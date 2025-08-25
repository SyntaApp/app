import { app } from "electron";
import { join } from "path";
import type { Service } from "../core/ServiceManager";
import ReqService from "#ReqService";
import File from "../helpers/File";
import type { JsonObject } from "../../types/types/JSON";

/**
 * Settings service responsible for robustly reading and writing
 * user-scoped and project-scoped settings as JSON.
 */
export default class Settings implements Service {
  constructor(private readonly opts?: { getUserBaseDir?: () => string }) {}

  /** Returns the path to the user settings file under Electron's userData. */
  private getUserSettingsPath(): string {
    const base = this.opts?.getUserBaseDir?.() ?? app.getPath("userData");
    return join(base, "settings.json");
  }

  /** Returns the path to the project settings file under a hidden .synta folder. */
  private getProjectSettingsPath(projectRoot: string): string {
    return join(projectRoot, ".synta", "settings.json");
  }

  /** Reads JSON from file, returning {} on missing file or malformed JSON. */
  private safeReadJson(filePath: string): JsonObject {
    try {
      const f = new File(filePath);
      return f.safeObject<JsonObject>({});
    } catch (error) {
      ReqService("Logger").warn("Failed to read settings JSON; returning empty object", {
        filePath,
        error,
      });
      return {};
    }
  }

  /** Atomically writes JSON using File helper. */
  private atomicWriteJson(filePath: string, data: JsonObject): void {
    const f = new File(filePath);
    f.writeAtomic(data, { pretty: 2 });
  }

  /** Performs a deep merge suitable for settings objects. Arrays are replaced, objects are merged. */
  private deepMerge<T extends JsonObject, U extends JsonObject>(base: T, patch: U): T & U {
    const output: JsonObject = { ...base };
    for (const [key, value] of Object.entries(patch)) {
      const existing = (output as any)[key];
      if (this.isPlainObject(existing) && this.isPlainObject(value)) {
        (output as any)[key] = this.deepMerge(existing as JsonObject, value as JsonObject);
      } else {
        (output as any)[key] = value;
      }
    }
    return output as T & U;
  }

  private isPlainObject(value: unknown): value is JsonObject {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  // User-scoped

  public getUser(): JsonObject {
    const path = this.getUserSettingsPath();
    return this.safeReadJson(path);
  }

  public updateUser(patch: JsonObject): JsonObject {
    const path = this.getUserSettingsPath();
    const current = this.safeReadJson(path);
    const updated = this.deepMerge(current, patch);
    this.atomicWriteJson(path, updated);
    return updated;
  }

  // Project-scoped

  public getProject(projectRoot: string): JsonObject {
    const path = this.getProjectSettingsPath(projectRoot);
    return this.safeReadJson(path);
  }

  public updateProject(projectRoot: string, patch: JsonObject): JsonObject {
    const path = this.getProjectSettingsPath(projectRoot);
    const current = this.safeReadJson(path);
    const updated = this.deepMerge(current, patch);
    this.atomicWriteJson(path, updated);
    return updated;
  }
}


