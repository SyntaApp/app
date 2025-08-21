import { app as electronApp } from "electron";
import ServiceManager, { type ServiceKey, ReqService } from "./ServiceManager";
import Logger, { LogLevel } from "../services/Logger";
import IPCHandler from "../services/IPCHandler";
import type { ServiceMap } from "../../types/interfaces/ServiceMap";
import BrowserWindow from "../helpers/BrowserWindow";
import debug from "../../constants/debug";

/**
 * Application lifecycle states
 */
export enum AppState {
  INITIALIZING = "initializing",
  READY = "ready",
  RUNNING = "running",
  SHUTTING_DOWN = "shutting_down",
  ERROR = "error",
}

/**
 * # Synta Application Core
 *
 * Level 1 architectural component responsible for application lifecycle management,
 * service orchestration, and system-wide event handling.
 *
 * ## Architecture Principles
 * - **Single Responsibility**: Each subsystem handles one concern
 * - **Dependency Injection**: Services are managed through ServiceManager
 * - **Lifecycle Management**: Clear state transitions and cleanup
 * - **Error Resilience**: Graceful handling of failures
 * - **Observability**: Comprehensive logging and monitoring hooks
 */
export default class App {
  private state: AppState = AppState.INITIALIZING;
  private get services() {
    return ServiceManager.getInstance();
  }

  /**
   * Initializes the application and completes startup sequences.
   *
   * Sets up services, event handlers, security policies, crash reporting,
   * transitions to READY state, and launches main window.
   *
   * @throws {Error} When any critical initialization step fails
   */
  public async init(): Promise<void> {
    // Tiny logger returned by the SM for logging when services are unavailable.
    const initLogger = ReqService("Logger");
    try {
      initLogger.info("Initializing Synta application");

      this.initServices(initLogger);
      this.setupEventHandlers(initLogger);

      this.newState(AppState.READY);

      // Request logger again so we use the full instanced version.
      ReqService("Logger").info("Application initialized successfully");
    } catch (error) {
      this.newState(AppState.ERROR);

      initLogger.error("Application initialization failed", { error });

      // TODO: Implement error recovery or graceful shutdown
      electronApp.quit();
    }
  }

  /**
   * Starts the application after initialization.
   *
   * Waits for Electron ready state, transitions to RUNNING, and creates
   * the main application window. Must be called after successful initialization.
   *
   * @throws {Error} When application is not in READY state or startup fails
   */
  public async start(): Promise<void> {
    const logger = ReqService("Logger");

    if (this.state !== AppState.READY) {
      logger.error(
        `Cannot start app with ${this.state} state, expected ${AppState.READY}. App will remain in original state.`
      );
      return;
    }

    logger.debug("Starting application");

    electronApp.whenReady().then(async () => {
      this.newState(AppState.RUNNING);

      await this.createMainWindow();
    });

    logger.info("Application started successfully");
  }

  /**
   * Initializes and configures all core application services.
   *
   * Registers services in dependency order, initializes them through the ServiceManager,
   * and performs post-initialization configuration.
   */
  private initServices(logger: Logger) {
    logger.info("Setting up application services");

    // Register services
    const serviceReg: ReadonlyArray<[ServiceKey, ServiceMap[ServiceKey]]> = [
      ["Logger", new Logger()],
      ["IPCHandler", new IPCHandler()],
    ];

    serviceReg.forEach((s) => {
      this.services.add(...s);
    });

    // Init services
    this.services.init();

    logger.info("Services initialized successfully");
  }

  /**
   * Sets up system-wide event handlers with proper cleanup
   */
  private setupEventHandlers(logger: Logger) {
    logger.info("Setting up event handlers");

    // Application lifecycle events
    electronApp.on("window-all-closed", () => {
      // Re-req service - don't want to use init logger.
      ReqService("Logger").info("All windows closed");

      if (process.platform !== "darwin") {
        this.shutdown();
      }
    });

    /**
     * macOS-specific event handler for when the app is activated (dock icon clicked).
     * On macOS, apps typically stay running even when all windows are closed, so we need
     * to recreate the main window when the user clicks the dock icon to reactivate the app.
     */
    electronApp.on("activate", () => {
      // Re-req service - don't want to use init logger.
      ReqService("Logger").info("Application activated");

      this.createMainWindow();
    });

    logger.info("Event handlers registered successfully");
  }

  /**
   * Creates and configures the main application window
   */
  private async createMainWindow(): Promise<void> {
    const logger = ReqService("Logger");

    if (this.state !== AppState.RUNNING) {
      logger.error(
        `Cannot start app with ${this.state} state, expected ${AppState.RUNNING}. App will remain in original state.`
      );
      return;
    }

    logger.info("Creating main window");

    const mainWindow = new BrowserWindow();

    // Set up security handlers for the window
    // security.setupWindowOpenHandler(mainWindow.webContents);
    // security.setupWillNavigateHandler(mainWindow.webContents);

    // Load content based on environment
    //todo:
    if (debug) {
      // Should not use debug but rather a prod/dev
      await mainWindow.loadURL("http://localhost:5174");
    } else {
      try {
        // TODO: Implement production file loading
        // await window.loadFile("path/to/production/index.html");
        logger.warn("Production content loading not implemented");
      } catch (error) {
        logger.error("Failed to load production content", { error });
      }
    }
  }

  /**
   * Gracefully shuts down the application
   */
  private async shutdown(): Promise<void> {
    ReqService("Logger").info("Shutting down application");

    this.newState(AppState.SHUTTING_DOWN);

    // Stop and dispose services
    this.services.dispose();

    // Quit application
    electronApp.quit();
  }

  /**
   * Used to update the app's state.
   */
  private newState(s: AppState) {
    this.state = s;
  }
}
