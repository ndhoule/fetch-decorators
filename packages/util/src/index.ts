// Like Object.assign, but for Headers. Copies (from left to right) all name-value pairs off a list
// of `source` Headers instances onto a `destination` Headers instance.
export const assignHeaders = (destination: Headers, ...sources: Headers[]): Headers => {
  return sources.reduce((destination, source) => {
    for (const [header, value] of source.entries()) {
      destination.set(header, value);
    }
    return destination;
  }, destination);
};
