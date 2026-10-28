/** Fixed logical canvas per session; FIT handles browser chrome and orientation changes
 * without rebuilding scenes or interrupting an active run. */
export function gameViewport(width: number, height: number, mobileDevice = false) {
  const compactPortrait = width <= 900 && height > width;
  return mobileDevice || compactPortrait
    ? { width: 1080, height: 1920 }
    : { width: 1920, height: 1080 };
}
