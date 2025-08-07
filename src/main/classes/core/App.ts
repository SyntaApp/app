import BrowserWindow from "./BrowserWindow";
import Asset from "../helpers/Asset";
import ServiceManager from "./ServiceManager";
import IPCHandler from "./IPCHandler";

/**
 * # App
 * This is the top level class which bootstraps electron and the Synta app itself.
 * It is a level 1 class according to the class hierarchy categorization.
 *
 * ## Responsibilities
 * - Bootstrapping the app
 * - Registering all services
 * - Wiring critical event flows
 * - Starting the renderer window
 * - Responding to lifecycle hooks (shutdown, crash, etc)
 *
 * ## Owns
 * - `ServiceManager`
 * - Lifecycle state
 * - Startup sequence (`start()`, `shutdown()`)
 * - Dev/Prod mode toggles
 */
export default class App {
  public readonly _debug = process.env.NODE_ENV === "debug";
  public services = new ServiceManager();

  /**
   * Must:
   * - prepare app
   * - start main window via electron
   *   - Load static files
   *   - Attach IPC handler?
   */
  constructor() {
    // Prepare services
    function prepServices(services: ServiceManager) {
      const add = services.addService;

      add("IPCHandler", new IPCHandler());
    }

    prepServices(this.services);

    // Setup crash reporting
    // Register app lifecycle hooks
    // Configure security policies
    // Setup dev tools if in debug mode
    // Load user preferences
    // Initialize state management

    // Create & render window
    // this.whenReady().then(createWindow);

    // Watch for top level events like the window being closed.
  }
}
