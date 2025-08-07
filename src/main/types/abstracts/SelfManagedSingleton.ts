/**
 * # Self Managed Singleton
 * An abstract base class that implements the singleton pattern with type safety.
 * Classes extending this will automatically get singleton behavior and type checking.
 * 
 * This class is not ranked in the class hierarchy, it is classed as a type.
 * 
 * ## Usage
 * ```ts
 * class MyService extends SelfManagedSingleton {}
 * 
 * const instance = MyService.getInstance();
 * ```
 */
export default abstract class SelfManagedSingleton {
  // Generic method to get instance with proper typing
  public static getInstance<T extends SelfManagedSingleton>(this: new () => T): T {
    if (!(this as any)._instance) {
      (this as any)._instance = new this();
    }
    return (this as any)._instance;
  }
}
