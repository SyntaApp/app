import type { IpcMainInvokeEvent } from "electron";
import Namespace, { Action } from "../../types/abstracts/Namespace";
import { RegisterNamespace } from "../services/IPCHandler";
import ReqService from "#ReqService";
import type { JsonObject } from "../../types/types/JSON";

@RegisterNamespace
export default class Settings extends Namespace {
  @Action
  getUser(_event: IpcMainInvokeEvent) {
    const settings = ReqService("Settings");
    const data = settings.getUser();
    return { status: 200, data } as const;
  }

  @Action
  updateUser(_event: IpcMainInvokeEvent, patch: JsonObject) {
    const settings = ReqService("Settings");
    const data = settings.updateUser(patch);
    return { status: 200, data } as const;
  }

  @Action
  getProject(_event: IpcMainInvokeEvent, projectRoot: string) {
    const settings = ReqService("Settings");
    const data = settings.getProject(projectRoot);
    return { status: 200, data } as const;
  }

  @Action
  updateProject(_event: IpcMainInvokeEvent, projectRoot: string, patch: JsonObject) {
    const settings = ReqService("Settings");
    const data = settings.updateProject(projectRoot, patch);
    return { status: 200, data } as const;
  }
}


