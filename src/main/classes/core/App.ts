import { app as electronApp } from "electron";
import ServiceManager, { type ServiceKey, ReqService } from "./ServiceManager";
import Logger, { LogLevel } from "../services/Logger";
import IPCHandler from "../services/IPCHandler";
import type { ServiceMap } from "../../types/interfaces/ServiceMap";
import BrowserWindow from "../helpers/BrowserWindow";

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
  public readonly debug: boolean = true;

  private get services() {
    return ServiceManager.getInstance();
  }

  get logger() {
    switch (this.state) {
      case AppState.INITIALIZING:
        throw new Error("Logger cannot be accessed while initalizing.");
      case AppState.SHUTTING_DOWN:
        Logger.safeLog(
          "Logger accessed during shutdown, behavior may be unpredictable",
          {
            level: LogLevel.WARN,
          }
        );
        break;
    }

    return ReqService("Logger").with("app", { state: this.state });
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
    try {
      // Create a temp logger used during init
      const initLogger = new Logger(this.debug).with("init");

      initLogger.info("Initializing Synta application");

      this.initServices(initLogger);
      this.setupEventHandlers(initLogger);

      this.state = AppState.READY;
      this.logger.info("Application initialized successfully");

      // Should be called externally, this method is to "initalize"
      // await this.startApplication();
    } catch (error) {
      this.newState(AppState.ERROR);
      Logger.safeLog("Application initialization failed", {
        error,
        level: LogLevel.ERROR,
        scope: "app",
      });

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
    if (this.state !== AppState.READY) {
      this.logger.error(
        `Cannot start app with ${this.state} state, expected ${AppState.READY}. App will remain in original state.`
      );
      return;
    }

    this.logger.info("Starting application");

    electronApp.whenReady().then(async () => {
      this.state = AppState.RUNNING;

      await this.createMainWindow();
    });

    this.logger.info("Application started successfully");
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
      ["Logger", new Logger(this.debug)],
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
    // Todo: make these events more modular.
    logger.info("Setting up event handlers");

    // Application lifecycle events
    electronApp.on("window-all-closed", () => {
      logger.info("All windows closed");

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
      this.logger.info("Application activated");

      this.createMainWindow();
    });

    logger.info("Event handlers registered successfully");
  }

  /**
   * Creates and configures the main application window
   */
  private async createMainWindow(): Promise<void> {
    if (this.state !== AppState.RUNNING) {
      this.logger.error(
        `Cannot start app with ${this.state} state, expected ${AppState.RUNNING}. App will remain in original state.`
      );
      return;
    }

    this.logger.info("Creating main window");

    const mainWindow = new BrowserWindow();

    // Set up security handlers for the window
    // security.setupWindowOpenHandler(mainWindow.webContents);
    // security.setupWillNavigateHandler(mainWindow.webContents);

    // Load content based on environment
    //todo:
    if (this.debug) {
      await mainWindow.loadURL("http://localhost:5173");
    } else {
      try {
        // TODO: Implement production file loading
        // await window.loadFile("path/to/production/index.html");
        this.logger.warn("Production content loading not implemented");
      } catch (error) {
        this.logger.error("Failed to load production content", { error });
      }
    }
  }

  /**
   * Gracefully shuts down the application
   */
  private async shutdown(): Promise<void> {
    this.logger.info("Shutting down application");
    this.state = AppState.SHUTTING_DOWN;

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
