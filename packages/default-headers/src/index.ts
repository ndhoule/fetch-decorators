import { assignHeaders } from "../../util/src";

type Fetch = GlobalFetch["fetch"];

// Decorates a Fetch instance, setting a set of default headers to each request made with the
// decorated fetch instance.
//
// These default headers have lower priority than any other means of setting headers so they can be
// overwritten on a per-request basis.
const withDefaultHeaders = (fetch: Fetch, defaultHeaders: HeadersInit): Fetch => {
  const defaults = new Headers(defaultHeaders);

  return function defaultHeadersFetch(input, init) {
    if (input instanceof Request) {
      // Take a clone of the Request to avoid mutating `input` (a user may be passing a reusable
      // Request instance)
      const clonedInput = input.clone();
      assignHeaders(
        clonedInput.headers,
        defaults,
        // Take a copy of headers to avoid losing values as we mutate clonedInput.headers
        new Headers(clonedInput.headers),
      );
      return fetch(clonedInput, init);
    }

    return fetch(input, {
      ...init,
      headers: assignHeaders(
        new Headers(),
        defaults,
        new Headers(init != null ? init.headers : undefined),
      ),
    });
  };
};

export default withDefaultHeaders;
