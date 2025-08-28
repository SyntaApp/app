import fs from "fs";
import { promises as fsPromises } from "fs";
import path from "path";
import { type ChokidarOptions, watch, FSWatcher } from "chokidar";

/**
 * # File Helper
 * A Level 4 utility class that streamlines file operations and path management.
 *
 * This class provides a convenient wrapper around Node.js file system operations,
 * similar to Bun's File class. It handles absolute path resolution, file reading,
 * existence checks, and path information extraction.
 *
 * ## Usage
 * ```ts
 * const file = new File(File.workingDir, "/preload/something/file.ts");
 *
 * if (await file.exists()) {
 *   const content = await file.string();
 *   console.log(`File name: ${file.name}, File content: ${content}`);
 * }
 * ```
 */
export default class File {
  /**
   * The current working directory of the process.
   * Used as the default base directory for file operations.
   */
  public static workingDir = process.cwd();

  /**
   * Create a new File instance.
   * Must provide the absolute path.
   */
  constructor(public readonly path: string) {}

  /**
   * Get the file name including the extension.
   */
  public get name(): string {
    return path.basename(this.path);
  }

  /**
   * Get the file extension including the leading dot.
   */
  public get ext(): string {
    return path.extname(this.path);
  }

  /**
   * Get the directory path containing the file.
   */
  public get dir(): string {
    return path.dirname(this.path);
  }

  /**
   * Read the file contents as a UTF-8 encoded string.
   */
  public async string(): Promise<string> {
    return fsPromises.readFile(this.path, "utf-8");
  }

  /**
   * Read the file contents as a raw Buffer.
   * Useful for binary files or when you need the raw bytes.
   */
  public async buffer(): Promise<Buffer> {
    return fsPromises.readFile(this.path);
  }

  /**
   * Reads the file contents as an JS object.
   * @throws {Error} if file does not export valid JSON.
   */
  public async object(): Promise<Object> {
    try {
      const content = await this.string();
      return JSON.parse(content);
    } catch {
      throw new Error(`File contains malformed JSON at location: ${this.path}`);
    }
  }

  /**
   * Reads JSON and returns the fallback on error or missing/empty file.
   */
  public async safeObject<T extends object = Record<string, unknown>>(
    fallback: T = {} as T
  ): Promise<T> {
    try {
      if (!(await this.exists())) return fallback;
      const content = await this.string();
      if (!content || !content.trim()) return fallback;
      return JSON.parse(content) as T;
    } catch {
      return fallback;
    }
  }

  /**
   * Check if the file exists at the resolved path.
   */
  public async exists(): Promise<boolean> {
    try {
      await fsPromises.access(this.path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Write data to the file, creating it if it doesn't exist.
   */
  public async write(
    data: string | Buffer | object,
    options?: fs.WriteFileOptions
  ): Promise<void> {
    const content =
      typeof data === "object" && !(data instanceof Buffer)
        ? JSON.stringify(data)
        : data;
    await fsPromises.writeFile(this.path, content, options);
  }

  /**
   * Ensures the parent directory exists.
   */
  public async ensureDir(): Promise<void> {
    await fsPromises.mkdir(this.dir, { recursive: true });
  }

  /**
   * Atomically writes data by saving to a temporary file and renaming.
   * If data is an object, it will be JSON.stringified. Use options.pretty
   * to pretty-print JSON (true => 2 spaces, or provide a number).
   */
  public async writeAtomic(
    data: string | Buffer | object,
    options?: { pretty?: boolean | number }
  ): Promise<void> {
    await this.ensureDir();
    const tmpPath = `${this.path}.tmp`;
    let content: string | Buffer = data as any;
    if (typeof data === "object" && !(data instanceof Buffer)) {
      const spaces =
        typeof options?.pretty === "number"
          ? options.pretty
          : options?.pretty
          ? 2
          : undefined;
      content = JSON.stringify(data, null, spaces);
    }
    await fsPromises.writeFile(tmpPath, content);
    await fsPromises.rename(tmpPath, this.path);
  }

  /**
   * Creates the file if it does not exist.
   */
  public async touch(): Promise<void> {
    if (!(await this.exists())) {
      await fsPromises.writeFile(this.path, "");
    }
  }

  /**
   * Watch this file for changes and invoke the callback on each change.
   * Returns the underlying watcher so callers can close it when done.
   */
  public watch(
    onChange: (filePath: string) => void,
    options?: ChokidarOptions
  ): FSWatcher {
    const watcher = watch(this.path, { ignoreInitial: true, ...options });
    watcher.on("change", onChange);
    return watcher;
  }
}
