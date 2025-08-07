import {
  BrowserWindow as ElectronBrowserWindow,
  type BrowserWindowConstructorOptions,
} from "electron";

/**
 * Extended BrowserWindow class for additional functionality.
 */
export default class BrowserWindow extends ElectronBrowserWindow {
  constructor(options?: BrowserWindowConstructorOptions) {
    super(options);
  }
}
