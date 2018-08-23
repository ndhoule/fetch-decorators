import * as EventEmitter from "eventemitter3";

type Fetch = GlobalFetch["fetch"];

export type FetchEmitterEvents = "request.begin" | "request.success" | "request.error";

interface FetchBaseEvent {
  start: number;
  request: {
    init?: RequestInit;
    input?: string | Request;
  };
}

export interface FetchBeginEvent extends FetchBaseEvent {}

export interface FetchSuccessEvent extends FetchBaseEvent {
  duration: number;
  end: number;
  response: Response;
}

export interface FetchErrorEvent extends FetchBaseEvent {
  duration: number;
  end: number;
  error: Error;
}

// TODO(ndhoule): This should probably be called `timer` or something, GetTime doesn't make sense
// as a name for this new interface
export type GetTime = () => [number, () => [number, number]];

// TODO(ndhoule): Allow passing an emitter? Not sure how that will work type-wise
// TODO(ndhoule): Allow passing `createEventPayload`, or multiple fns for each event type
export interface WithEmitterOptions {
  getTime?: GetTime;
}

// TODO(ndhoule): Use (in order of fallback):
// performance.now -> process.hrtime.bigint -> process.hrtime -> Date.now -> new Date.getTime
// be aware that process.hrtime() has a different signature than all other fns
// TODO(ndhoule): Jesus clean all this up
const defaultGetTime: GetTime = () => {
  const start = Date.now();
  return [
    start,
    () => {
      const end = Date.now();
      return [end, end - start];
    },
  ];
};

const performanceGetTime: GetTime = () => {
  const start = performance.now();
  return [
    start,
    () => {
      const end = performance.now();
      return [end, end - start];
    },
  ];
};

const hrtimeBigIntGetTime: GetTime = () => {
  const start = process.hrtime.bigint();
  return [
    start,
    () => {
      const end = process.hrtime.bigint();
      return [end, end - start];
    },
  ];
};

const hrtimeGetTime: GetTime = () => {
  const start = process.hrtime();
  return [
    start,
    () => {
      const end = process.hrtime();
      return [end, end - start];
    },
  ];
};

// withEmitter decorates a Fetch instance, returning a the fetch instance an an EventEmitter. The
// emitter emits events on request begin, success (promise resolution), and error (promise
// rejection).
//
// TODO(ndhoule): More documentation
const withEmitter = (
  fetch: Fetch,
  { getTime = defaultGetTime }: WithEmitterOptions = {},
): [Fetch, EventEmitter<FetchEmitterEvents>] => {
  const emitter = new EventEmitter<FetchEmitterEvents>();

  return [
    function emitterFetch(input, init) {
      const [start, getEndTime] = getTime();

      const beginEvent: FetchBeginEvent = {
        request: { init, input },
        start,
      };
      emitter.emit("request.begin", beginEvent);

      return fetch(input, init)
        .then((response: Response) => {
          const [end, duration] = getEndTime();
          const successEvent: FetchSuccessEvent = {
            duration: end - start,
            end,
            request: { init, input },
            response,
            start,
          };
          emitter.emit("request.success", successEvent);
          return Promise.resolve(response);
        })
        .catch((error) => {
          const [end, duration] = getEndTime();
          const errorEvent: FetchErrorEvent = {
            duration: end - start,
            end,
            error,
            request: { init, input },
            start,
          };
          emitter.emit("request.error", errorEvent);
          return Promise.reject(error);
        });
    },
    emitter,
  ];
};

export default withEmitter;
