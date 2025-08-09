import fs from 'fs';
import path from 'path';

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
 * if (file.exists()) {
 *   const content = file.readText();
 *   console.log(`File name: ${file.name}`);
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
	 * The absolute path to the file, resolved from the base directory and relative path.
	 * This is computed once during construction and remains immutable.
	 */
	public readonly absPath: string;

	/**
	 * Create a new File instance with an absolute path resolved from base and relative paths.
	 * 
	 * @param baseDir - The base directory to resolve the relative path from (e.g., File.workingDir)
	 * @param relPath - The relative path to the file from the base directory
	 */
	constructor(baseDir: string, relPath: string) {
		this.absPath = path.resolve(baseDir, relPath);
	}

	/**
	 * Read the file contents as a UTF-8 encoded string.
	 */
	string(): string {
		return fs.readFileSync(this.absPath, 'utf-8');
	}

	/**
	 * Read the file contents as a raw Buffer.
	 * Useful for binary files or when you need the raw bytes.
	 */
	buffer(): Buffer {
		return fs.readFileSync(this.absPath);
	}

	/**
	 * Check if the file exists at the resolved path.
	 */
	exists(): boolean {
		return fs.existsSync(this.absPath);
	}

	/**
	 * Get the file name including the extension.
	 */
	get name(): string {
		return path.basename(this.absPath);
	}

	/**
	 * Get the file extension including the leading dot.
	 */
	get ext(): string {
		return path.extname(this.absPath);
	}

	/**
	 * Get the directory path containing the file.
	 */
	get dir(): string {
		return path.dirname(this.absPath);
	}
}
