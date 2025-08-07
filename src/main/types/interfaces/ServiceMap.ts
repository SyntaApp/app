import type IPCHandler from "../../classes/core/IPCHandler";

/**
 * A type-safe mapping of all services that can be registered in Synta.
 * This interface enforces strict typing for service registration and dependency injection.
 */
export interface ServiceMap {
    IPCHandler: IPCHandler
}