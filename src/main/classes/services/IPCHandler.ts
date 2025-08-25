import { type Service } from "../core/ServiceManager";
import ReqService from "#ReqService";
import type Namespace from "../../types/abstracts/Namespace";
import { ipcMain } from "electron";
import type { IpcMainInvokeEvent } from "electron";
import type ActionResponse from "../../types/interfaces/ActionResponse";

/**
 * What an action method should look like.
 */
export type ActionMethod = (
  event: IpcMainInvokeEvent,
  ...args: unknown[]
) => Promise<ActionResponse>;

/**
 * # IPC Handler
 * It manages Inter-Process Communication (IPC) between the main and renderer processes.
 * Provides a type-safe way to register and handle IPC channels for bi-directional
 * communication.
 */
export default class IPCHandler implements Service {
  /**
   * Registers a channel with the registry.
   */
  public register(name: string, namespace: Namespace) {
    // Bind all actions on this namespace to ipcMain
    const actions = namespace.getActions();
    actions.forEach((name) => {
      const channel = namespace.getChannel(name);
      if (!channel) return;

      // Ensure no duplicate handlers
      ipcMain.removeHandler(channel);

      const method = namespace.getAction(name);
      if (!method) {
        throw new Error(`Method with name ${name} does not exist.`);
      }

      ipcMain.handle(channel, async (event, ...args) => {
        try {
          // Invoke the action; if it returns a plain value, pass it through
          const result = (await method.call(
            namespace,
            event,
            ...args
          )) as ActionResponse;
          return result;
        } catch (error: any) {
          return {
            status: 500,
            message: String(error?.message ?? error ?? "Unknown error"),
          };
        }
      });
    });
  }
}

/**
 * Decorator function used to automatically define channels.
 */
export function RegisterNamespace<T extends Namespace>(
  constructor: new () => T
) {
  const ns = new constructor();
  ReqService("IPCHandler").register(constructor.name, ns);
}
