import Namespace, { Action } from "../../types/abstracts/Namespace";
import { RegisterNamespace } from "../services/IPCHandler";

@RegisterNamespace
export default class Component extends Namespace {
  @Action
  delete() {
    return "Component deleted";
  }
}
