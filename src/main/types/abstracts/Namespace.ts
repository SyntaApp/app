import type { IpcMainInvokeEvent } from "electron";
import type ActionResponse from "../interfaces/ActionResponse";
import type { Channel } from "../types/Channel";
import type { ActionMethod } from "../../classes/services/IPCHandler";

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
   * Retrieves an action method from this namespace by its registered name.
   *
   * This method performs two validations:
   * 1. Checks if the action name exists in the action registry
   * 2. Verifies that the property is actually a callable function
   *
   * @example
   * ```ts
   * const action = namespace.getAction('sync');
   * if (action) {
   *   const result = await action.call(namespace, event, ...args);
   * }
   * ```
   */
  public getAction(name: string): ActionMethod | undefined {
    if (!this.actionRegistry.has(name)) return undefined;
    const action = (this as any)[name];
    return typeof action === "function" ? action : undefined;
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
 * Enforces that decorated methods match the ActionMethod signature.
 */
export function Action<This, Args extends readonly unknown[], Return>(
  value: (this: This, event: IpcMainInvokeEvent, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, event: IpcMainInvokeEvent, ...args: Args) => Return
  >
) {
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

/**
 * Rate limits an action. Essentially stops the renderer from spamming requests to this channel.
 */
export function Ratelimit(
  ms: number,
  every: number,
  msg: ActionResponse = { status: 429, message: "Rate limit exceeded" }
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    // Persistent variables that exist across all method calls
    const callTimestamps = new Map<object, number[]>();

    descriptor.value = function (...args: any[]) {
      const now = Date.now();
      const instance = this;

      // Get or initialize call history for this instance
      let timestamps = callTimestamps.get(instance) || [];

      // Remove timestamps older than the time window
      timestamps = timestamps.filter((timestamp) => now - timestamp < ms);

      // Check if we've exceeded the call limit
      if (timestamps.length >= every) {
        const oldestCall = timestamps[0];
        const waitTime = ms - (now - oldestCall);

        return {
          ...msg,
          message: `${msg.message}. Try again in ${waitTime}ms`,
        } as ActionResponse;
      }

      // Add current call timestamp
      timestamps.push(now);
      callTimestamps.set(instance, timestamps);

      // Execute the original method
      const result = originalMethod.apply(this, args);

      return result;
    };

    return descriptor;
  };
}
