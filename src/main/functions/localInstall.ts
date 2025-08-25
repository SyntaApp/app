import { app } from 'electron';

/**
 * Gets the absolute installation directory for Synta.
 * @returns The absolute path to the directory where the app was started from
 */
export default function localInstall(): string {
  // app.getAppPath() returns the directory containing the app's package.json
  // This works for both development and production builds
  return app.getAppPath();
}