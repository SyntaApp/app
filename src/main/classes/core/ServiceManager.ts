import SelfManagedSingleton from "../../types/abstracts/SelfManagedSingleton";
import type { ServiceMap } from "../../types/interfaces/ServiceMap";

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
   * Represents if the class has been marked as ready yet.
   * If the class has initialized, additional services cannot be added.
   */
  private isInitialized = false;

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
    if (this.isInitialized) {
      console.warn(
        `Cannot register service '${key}': Service Manager has already been initialized. Services must be registered before initialization.`
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
    return this.registry.get(key) as ServiceMap[T];
  }

  /**
   * Initializes all registered services.
   */
  public init(): void {
    if (this.isInitialized) {
      console.warn("Service Manager has already been initialized");
      return;
    }

    this.isInitialized = true;

    for (const [key, service] of this.registry.entries()) {
      try {
        service.init?.();
        console.log(`Service '${key}' initialized successfully`);
      } catch (error) {
        console.error(`Failed to initialize service '${key}':`, error);
        throw error;
      }
    }
  }

  /**
   * Disposes all registered services.
   * This is the final step in the service lifecycle.
   */
  public dispose(): void {
    // Dispose services in reverse order
    const services = Array.from(this.registry.entries()).reverse();

    for (const [key, service] of services) {
      try {
        service.dispose?.();
        console.log(`Service '${key}' disposed successfully`);
      } catch (error) {
        console.error(`Failed to dispose service '${key}':`, error);
      }
    }

    this.registry.clear();
    this.isInitialized = false;
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
