import Namespace, { Action } from "../../types/abstracts/Namespace";
import { RegisterNamespace } from "../services/IPCHandler";

@RegisterNamespace
export default class Project extends Namespace {
    @Action
    structure() {
        /*
        return project.getStructure();
        */
    }

    @Action
    select() {
        /*
        project.select();
        */
    }

}

// Have a project class responsible for file structure and returning it 