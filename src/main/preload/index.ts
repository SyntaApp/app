import { contextBridge } from "electron";

// Expose a minimal API to the renderer process. Extend as needed.
contextBridge.exposeInMainWorld("api", {} as const);