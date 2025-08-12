import { type Service } from "../core/ServiceManager";
import ReqService from "#ReqService";
import type Namespace from "../../types/abstracts/Namespace";

/**
 * # IPC Handler
 * It manages Inter-Process Communication (IPC) between the main and renderer processes.
 * Provides a type-safe way to register and handle IPC channels for bi-directional
 * communication.
 */
export default class IPCHandler implements Service {
  private registry = new Map<string, Namespace>();

  init?(): any {
    // Initialize IPC handler
  }

  dispose?(): any {
    // Cleanup IPC handler
  }

  /**
   * Registers a channel with the registry.
   */
  public register(name: string, chan: Namespace) {
    this.registry.set(name, chan);
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
