import { contextBridge, ipcRenderer } from "electron";

// Expose a minimal API to the renderer process. Extend as needed.
contextBridge.exposeInMainWorld("api", {
  // Generic invoke in case the renderer wants lower-level access
  invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),

  // Convenience helpers for settings
  settings: {
    getUser: () => ipcRenderer.invoke("Settings:getUser"),
    updateUser: (patch: Record<string, unknown>) =>
      ipcRenderer.invoke("Settings:updateUser", patch),
    getProject: (projectRoot: string) =>
      ipcRenderer.invoke("Settings:getProject", projectRoot),
    updateProject: (projectRoot: string, patch: Record<string, unknown>) =>
      ipcRenderer.invoke("Settings:updateProject", projectRoot, patch),
  },
} as const);