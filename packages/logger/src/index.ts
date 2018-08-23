import withEmitter, {
  FetchBeginEvent,
  FetchErrorEvent,
  FetchSuccessEvent,
} from "../../emitter/src";

type Fetch = GlobalFetch["fetch"];

export type Logger = (message: string, options: { [key: string]: any }) => void;

export interface WithLoggerOptions {
  log: Logger;
}

// TODO(ndhoule): Allow overriding the event emitter decorator? Or just passing in an emitter?

// withLogger decorates a Fetch instance,
//
// TODO(ndhoule): More documentation
const withLogger = (fetch: Fetch, { log }: WithLoggerOptions): Fetch => {
  const [emitterFetch, emitter] = withEmitter(fetch);

  emitter.on("request.begin", (data: FetchBeginEvent) => {
    log("beginning fetch", data);
  });

  emitter.on("request.success", (data: FetchSuccessEvent) => {
    log("fetch succeeded", data);
  });

  emitter.on("request.error", (data: FetchErrorEvent) => {
    log("fetch errored", data);
  });

  return emitterFetch;
};

export default withLogger;
