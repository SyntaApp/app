import type { Channel } from "../types/Channel";

/**
 * # Namespace
 * Abstract base class for IPC channel namespaces that provides automatic action registration.
 *
 * This class serves as the foundation for creating IPC channels with type-safe method registration.
 * Methods decorated with {@link Action} are automatically registered and can be invoked through
 * the IPC system. Each namespace maintains its own action registry for organized management.
 *
 * ## Features
 * - Automatic action registration via decorators
 * - Type-safe method definitions
 * - Built-in ping/pong functionality for health checks
 * - Read-only access to registered actions
 *
 * @example
 * ```ts
 * @RegisterNamespace
 * class SomeNamespace extends Namespace {
 *   @Action
 *   async getData() {
 *     return { message: "Hello from IPC!" };
 *   }
 * }
 * ```
 */
export default abstract class Namespace {
  protected actionRegistry = new Set<string>();

  /**
   * Adds a new action to the action registry.
   */
  protected addAction(key: string) {
    this.actionRegistry.add(key);
  }

  /**
   * Read-only list of actions in the registry.
   */
  public getActions(): string[] {
    return [...this.actionRegistry];
  }

  /**
   * Gets the full channel name for an action on this namespace.
   * @returns A Channel type with namespace:action format, or undefined if action doesn't exist
   */
  public getChannel(action: string): Channel | undefined {
    if (this.actionRegistry.has(action)) {
      const namespaceName = this.constructor.name;
      return `${namespaceName}:${action}` as Channel;
    }
    return undefined;
  }

  /**
   * Default action built into all namespaces.
   */
  @Action
  public async ping() {
    return "Pong 🏓!";
  }
}

/**
 * Registers an action with its class registry.
 */
export function Action(value: Function, context: ClassMethodDecoratorContext) {
  // Ensure the item is a method and is not static
  if (context.kind !== "method" || context.static) {
    throw new Error(
      "The Action decorator can only be used on instance methods."
    );
  }
  if (!context.name) {
    throw new Error(
      "The Action decorator cannot be used on methods without names."
    );
  }

  /* Injects initialization code into the constructor of any class extending Namespace.
    Allowing us to automatically register decorated methods without requiring
    manual registration.
    Note: The callback function must use regular function syntax (not arrow functions)*/
  context.addInitializer(function (this: any) {
    // "this" is "any" to access private members

    this.addAction(String(context.name));
  });
}
