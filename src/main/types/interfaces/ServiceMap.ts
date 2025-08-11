import type IPCHandler from "../../classes/services/IPCHandler";
import type Logger from "../../classes/services/Logger";

/**
 * A type-safe mapping of all services that can be registered in Synta.
 * This interface enforces strict typing for service registration and dependency injection.
 */
export interface ServiceMap {
    Logger: Logger;
    IPCHandler: IPCHandler;
}