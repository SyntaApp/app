import SelfManagedSingleton from "../../types/abstracts/SelfManagedSingleton";
import type { ServiceMap } from "../../types/interfaces/ServiceMap";

type ServiceKey = keyof ServiceMap;

/**
 * # Service Manager
 * A Level 2 core system component that manages service lifecycle and dependencies.
 *
 * ## Responsibilities
 * - Manages registration and initialization of Level 3 services
 * - Provides dependency injection
 * - Ensures proper service startup/shutdown order
 * - Maintains singleton instances of services
 */
export default class ServiceManager extends SelfManagedSingleton {
  private registry = new Map<
  ServiceKey,
    ServiceMap[ServiceKey] & Service
  >();
  /**
   * Represents if the class has been marked as ready yet.
   * If the class has initialized, additional services cannot be added.
   */
  private init = false;

  /**
   * Registers a service.
   * Service keys and values are predetermined by the {@link ServiceMap}
   *
   * Overrides a service if it is already set.
   */
  public addService<T extends ServiceKey>(
    key: T,
    value: ServiceMap[T] & Service // Value must implement Service interface
  ) {
    if (this.init) {
      console.warn(
        `Cannot register service '${key}': Service Manager has already been initialized. Services must be registered before initialization.`
      );
      return;
    }

    this.registry.set(key, value);
  }

  public getService(key: ServiceKey) {
    return this.registry.get(key);
  }

  /**
   * Lets the service manager know to init all services
   */
  public ready() {
    this.init = true;

    for (const service of this.registry.values()) {
      service.init?.(); // Call init if it exists.
    }
  }

  /**
   * Calls the disposal methods on all services
   */
  public exit() {
    for (const service of this.registry.values()) {
      service.dispose?.(); // Call dispose if it exists.
    }
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
   */
  init?: () => any;
  /**
   * Disposal function invoked before Service goes out of scope.
   */
  dispose?: () => any;
}

/**
 * The `ReqService` function allows for easy importing of services via the Service Manager.
 * It is re-exported under the functions directory for easy access.
 */
export function ReqService(key: ServiceKey) {
    return ServiceManager.getInstance().getService(key);
}
