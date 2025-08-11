import ReqService from "#ReqService";
import {
  BrowserWindow as ElectronBrowserWindow,
  type BrowserWindowConstructorOptions,
  type NativeImage,
} from "electron";
import Asset from "./Asset";

/**
 * Extended BrowserWindow class for additional functionality.
 */
export default class BrowserWindow extends ElectronBrowserWindow {
  // Must be static to be accessed inside constructor 
  private static defaultOptions: BrowserWindowConstructorOptions = {
    title: "Synta",
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false, // Don't show until ready
    center: true,
    icon: BrowserWindow.defaultIco(),
    webPreferences: {
      sandbox: true,
      spellcheck: false,
      autoplayPolicy: "document-user-activation-required",
    },
  };

  constructor(o?: BrowserWindowConstructorOptions) {
    super({ ...BrowserWindow.defaultOptions, ...o });

    this.once("ready-to-show", () => {
      this.show();
    });
  }

  /**
   * Gets the default app icon relavent to the OS.
   */
  private static defaultIco() {
    // Todo:
    return new Asset("logo.ico").toPath();
  }
}
