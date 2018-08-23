import * as uuidv1 from "uuid/v1";
import { assignHeaders } from "../../util/src";

type Fetch = GlobalFetch["fetch"];

export type GenerateRequestId = () => string;

export interface WithRequestIdOptions {
  headerName?: string;
  generateRequestId?: GenerateRequestId;
}

const defaultGenerateRequestId = uuidv1;
const defaultHeaderName = "X-Request-Id";

// Decorates a Fetch instance, adding a request ID header to each request made with the decorated
// fetch instance.
//
// By default, the header name is "X-Request-Id" and the ID is generated using the UUIDv1 algorithm.
const withRequestId = (
  fetch: Fetch,
  {
    headerName = defaultHeaderName,
    generateRequestId = defaultGenerateRequestId,
  }: WithRequestIdOptions = {},
): Fetch => {
  return function requestIdFetch(input, init) {
    return fetch(input, {
      ...init,
      headers: assignHeaders(
        new Headers(init != null ? init.headers : undefined),
        new Headers({ "X-Request-Id": generateRequestId() }),
      ),
    });
  };
};

export default withRequestId;
