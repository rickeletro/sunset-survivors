/** Development UI is available only in the Vite dev build on the local machine. */
export function developerAccess(devBuild: boolean, hostname: string): boolean {
  return devBuild && ['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname.toLowerCase());
}
export function developerEnabled(): boolean {
  return import.meta.env.DEV && developerAccess(true, globalThis.location?.hostname ?? '');
}
