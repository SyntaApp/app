import type { IpcMainInvokeEvent } from "electron";
import Namespace, { Action } from "../../types/abstracts/Namespace";
import { RegisterNamespace } from "../services/IPCHandler";

@RegisterNamespace
export default class Component extends Namespace {
  @Action
  sync(event: IpcMainInvokeEvent, id: string, code: string) { // Perhaps wrap id and code in a obj
    // Sync component from renderer to disk

    /*

    components.sync(id, code);
    
    */
  }

  @Action
  delete(event: IpcMainInvokeEvent) {
    return "Component deleted";
  }
}

// NEEDS:
// We need to be able to:
// - Sync components bidirectionally (renderer <-> disk)
// - Renderer needs to be able to request a SINGULAR file code (to display & start editing)


// We need to be able to select a project.
