import File from "./File";
import { promises as fsp } from "fs";

/**
 * # ConfigFile
 *
 * JSON-focused helper that extends `File` with safe reads, deep merging,
 * frozen views, and atomic writes tailored for configuration data.
 */
export default class ConfigFile extends File {
  private mutex: Promise<void> = Promise.resolve();

  // ---------- public API ----------

  /** Ensure parent directory exists. */
  public async ensure(): Promise<void> {
    await this.ensureDir();
  }

  /** Read JSON or fallback if missing/malformed. */
  public async read<T extends object = Record<string, unknown>>(fallback: T = {} as T): Promise<T> {
    return this.safeObject<T>(fallback);
  }

  /** Read JSON and freeze deeply for readonly use. */
  public async view<T extends object = Record<string, unknown>>(fallback: T = {} as T): Promise<Readonly<T>> {
    const obj = await this.read<T>(fallback);
    return ConfigFile.freeze(obj);
  }

  /** Overwrite config (pretty by default). */
  public async save(data: object, pretty: boolean | number = 2): Promise<void> {
    await this.atomic(data, { pretty });
  }

  /** Patch by deep merge (arrays replaced). */
  public async patch<T extends object = Record<string, unknown>>(patch: Partial<T>): Promise<Readonly<T>> {
    return this.serial(async () => {
      const current = await this.read<T>({} as T);
      const next = ConfigFile.merge(current, patch as T) as T;
      await this.atomic(next, { pretty: 2, fsync: true });
      return ConfigFile.freeze(next);
    });
  }

  /** Set a top-level key (replace semantics). */
  public async set<T extends object = Record<string, unknown>, K extends keyof T = keyof T>(key: K, value: T[K]): Promise<Readonly<T>> {
    return this.serial(async () => {
      const obj = await this.read<T>({} as T);
      (obj as any)[key as string] = value as any;
      await this.atomic(obj, { pretty: 2, fsync: true });
      return ConfigFile.freeze(obj);
    });
  }

  /** Get a value at top-level with optional fallback. */
  public async get<T extends object = Record<string, unknown>, K extends keyof T = keyof T>(key: K, fallback?: T[K]): Promise<T[K] | undefined> {
    const obj = await this.read<T>({} as T);
    const val = (obj as any)[key as string];
    return val === undefined ? fallback : (val as T[K]);
  }

  /** Reset file to provided object (or empty). */
  public async reset(data: object = {}): Promise<void> {
    await this.atomic(data, { pretty: 2, fsync: true });
  }

  /** Ensure file exists with defaults if missing. */
  public async init(defaults: object): Promise<Readonly<object>> {
    return this.serial(async () => {
      if (!(await this.exists())) {
        await this.atomic(defaults, { pretty: 2, fsync: true });
        return ConfigFile.freeze(defaults);
      }
      const obj = await this.read<object>({});
      const merged = ConfigFile.merge(defaults, obj);
      return ConfigFile.freeze(merged);
    });
  }

  /**
   * Atomically write JSON with optional pretty and fsync.
   * Uses base `writeAtomic` when fsync is not requested.
   */
  public async atomic(data: object, options?: { pretty?: boolean | number; fsync?: boolean }): Promise<void> {
    return this.serial(async () => {
      if (!options?.fsync) {
        await super.writeAtomic(data, { pretty: options?.pretty });
        return;
      }
      await this.ensureDir();
      const tmp = `${this.path}.tmp`;
      const spaces = typeof options.pretty === "number" ? options.pretty : options.pretty ? 2 : undefined;
      const json = JSON.stringify(data, null, spaces);
      await fsp.writeFile(tmp, json, "utf8");
      const handle = await fsp.open(tmp, "r+");
      await handle.sync();
      await handle.close();
      await fsp.rename(tmp, this.path);
    });
  }

  // ---------- static utils ----------

  /** Deep freeze object/arrays. */
  public static freeze<T>(obj: T): Readonly<T> {
    const stack: any[] = [obj as any];
    while (stack.length) {
      const curr = stack.pop();
      if (curr && (Array.isArray(curr) || ConfigFile.isObject(curr))) {
        Object.freeze(curr);
        for (const k of Object.keys(curr)) {
          const v = (curr as any)[k as any];
          if (v && (Array.isArray(v) || ConfigFile.isObject(v)) && !Object.isFrozen(v)) stack.push(v);
        }
      }
    }
    return obj as Readonly<T>;
  }

  /** Deep merge where arrays are replaced. */
  public static merge<A extends object, B extends object>(base: A, patch: B): A & B {
    if (Array.isArray(patch)) return patch as unknown as A & B;
    if (ConfigFile.isObject(base) && ConfigFile.isObject(patch)) {
      const out: Record<string, any> = { ...(base as any) };
      for (const key of Object.keys(patch)) {
        const b = (base as any)[key];
        const p = (patch as any)[key];
        if (ConfigFile.isObject(b) && ConfigFile.isObject(p)) out[key] = ConfigFile.merge(b, p);
        else if (Array.isArray(p)) out[key] = p.slice();
        else out[key] = p;
      }
      return out as A & B;
    }
    return patch as unknown as A & B;
  }

  /** Lightweight object check (no class instances). */
  public static isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && Object.getPrototypeOf(v) === Object.prototype;
  }

  // ---------- private internals ----------

  /** Simple per-instance mutex to serialize writes. */
  private async serial<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.mutex.then(fn, fn);
    this.mutex = run.then(() => undefined, () => undefined);
    return run;
  }
}