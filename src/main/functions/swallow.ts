/**
 * Executes a function and swallows synchronous errors
 * Function will attempt to return the resolved value of the callback but will return the fallback value if it errored.
 * @param callback - The function to execute
 * @param fallback - Optional fallback value to return if the callback errors
 */
export default function swallow<R extends any, F extends any = undefined>(
  callback: () => R,
  fallback?: F
): R | F {
  try {
    return callback();
  } catch (_err) {
    return fallback as F;
  }
}
