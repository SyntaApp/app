import debug from "../../constants/debug";
import SelfManagedSingleton from "../../types/abstracts/SelfManagedSingleton";
import type { ServiceMap } from "../../types/interfaces/ServiceMap";
import Logger, { LogLevel } from "../services/Logger";

export type ServiceKey = keyof ServiceMap;

/**
 * # Service Manager
 * A Level 2 core system component that manages service lifecycle and dependencies.
 *
 * ## Responsibilities
 * - Manages registration and initialization of Level 3 services
 * - Provides dependency injection with type safety
 * - Ensures proper service startup/shutdown order
 * - Maintains singleton instances of services
 * - Supports full lifecycle management: init → start → stop → dispose
 */
export default class ServiceManager extends SelfManagedSingleton {
  private registry = new Map<ServiceKey, ServiceMap[ServiceKey] & Service>();

  /**
   * Default way to request the logger.
   * This getter functions even when services have been disposed by creating a
   * substitute logger.
   * It is the only "special" functionality existing on the service manager for a service.
   */
  private get logger(): Logger {
    if (!this.ready) {
      // This could be swapped out to use a minimal tiny logger
      return new Logger().with({ subLogger: true });
    } else {
      return this.registry.get("Logger") as Logger;
    }
  }

  /**
   * Represents if the class has been marked as ready yet.
   * If the class has initialized, additional services cannot be added.
   */
  private _ready = false;
  get ready() {
    return this._ready;
  }

  /**
   * Registers a service with type safety.
   * Service keys and values are predetermined by the {@link ServiceMap}
   *
   * Overrides a service if it is already set.
   */
  public add<T extends ServiceKey>(
    key: T,
    value: ServiceMap[T] & Service // Value must implement Service interface
  ) {
    if (this._ready) {
      this.logger.warn(
        `Cannot register service ${key} - Service Manager has already been initialized`
      );
      return;
    }

    this.registry.set(key, value);
  }

  /**
   * Retrieves a service with type safety using generics.
   * Returns the service instance with proper typing.
   */
  public get<T extends ServiceKey>(key: T): ServiceMap[T] {
    // Special logic for logger service
    if (key === "Logger") {
      // Using logger getter ensures logger service will always be available
      return this.logger as ServiceMap[T];
    }

    if (!this._ready) {
      throw new Error(`"${key}" accessed before SM initialization`);
    }

    if (!this.registry.has(key)) {
      throw new Error(`${key} has not been registered with SM`);
    }

    return this.registry.get(key) as ServiceMap[T];
  }

  /**
   * Initializes all registered services.
   */
  public async init(): Promise<void> {
    if (this._ready) {
      this.logger.warn("Service Manager has already been initialized");
      return;
    }

    for (const [key, service] of this.registry.entries()) {
      try {
        await service.init?.();
      } catch (err) {
        this.logger.error(`Error initializing ${key}: ${err}`);
      } finally {
        this.logger.info(`Service '${key}' initialized successfully`);
      }
    }

    this._ready = true;
  }

  /**
   * Disposes all registered services.
   * This is the final step in the service lifecycle.
   */
  public async dispose(): Promise<void> {
    // Dispose services in reverse order
    const services = Array.from(this.registry.entries()).reverse();

    for (const [key, service] of services) {
      try {
        await service.dispose?.();
      } catch (error) {
        this.logger.error(`Failed to dispose service: ${key}`);
      } finally {
        this.logger.info(`${key} disposed successfully`);
      }
    }

    this.registry.clear();
    this._ready = false;
  }
}

/**
 * Interface that all Level 3 services must implement to ensure consistent lifecycle management.
 * Services implementing this interface can be registered with the ServiceManager for dependency
 * injection, initialization, and proper startup/shutdown sequencing.
 */
export interface Service {
  /**
   * Initialization function invoked after the service is registered.
   * Called first in the service lifecycle.
   */
  init?: () => void | Promise<void>;

  /**
   * Disposal function invoked before Service goes out of scope.
   * Called last in the service lifecycle.
   */
  dispose?: () => void | Promise<void>;

  // Allow additional items to avoid comparison errors
  [k: string]: any;
}

/**
 * The `ReqService` function allows for easy importing of services via the Service Manager.
 * It is re-exported under the functions directory for easy access.
 *
 * @example
 * ```typescript
 * const logger = ReqService('LoggerService');
 * logger.logInfo('Hello World');
 * ```
 */
export function ReqService<K extends ServiceKey>(key: K): ServiceMap[K] {
  return ServiceManager.getInstance().get(key);
}
