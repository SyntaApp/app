import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

function createTempDir(prefix: string) {
  const base = tmpdir();
  const unique = Math.random().toString(36).slice(2);
  const dir = join(base, `${prefix}-${unique}`);
  // mkdtempSync requires a suffix, so use tmp + unique
  return mkdtempSync(dir);
}

// Mock the electron module so importing Settings in Bun test doesn't require Electron runtime
mock.module("electron", () => ({
  app: {
    getPath: (_key: string) => tmpdir(),
  },
}));

const { default: Settings } = await import("../src/main/classes/services/Settings.ts");

describe("Settings Service", () => {
  let tempUserDir: string;
  let tempProjectDir: string;
  let settings: any;

  beforeEach(() => {
    tempUserDir = createTempDir("synta-user");
    tempProjectDir = createTempDir("synta-project");
    settings = new Settings({ getUserBaseDir: () => tempUserDir });
  });

  afterEach(() => {
    // Cleanup temp directories
    rmSync(tempUserDir, { recursive: true, force: true });
    rmSync(tempProjectDir, { recursive: true, force: true });
  });

  it("returns empty object when user settings file is missing", () => {
    const result = settings.getUser();
    expect(result).toEqual({});
  });

  it("updates and merges user settings deeply, replacing arrays", () => {
    const first = settings.updateUser({ theme: "dark", options: { a: 1 }, arr: [1, 2, 3] });
    expect(first).toEqual({ theme: "dark", options: { a: 1 }, arr: [1, 2, 3] });

    const second = settings.updateUser({ options: { b: 2 }, arr: [9] });
    expect(second).toEqual({ theme: "dark", options: { a: 1, b: 2 }, arr: [9] });

    // Verify file written contains pretty JSON and valid content
    const filePath = join(tempUserDir, "settings.json");
    expect(existsSync(filePath)).toBe(true);
    const text = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(text);
    expect(parsed).toEqual(second);
  });

  it("returns empty object when project settings file is missing", () => {
    const result = settings.getProject(tempProjectDir);
    expect(result).toEqual({});
  });

  it("updates and retrieves project settings in .synta/settings.json", () => {
    const updated = settings.updateProject(tempProjectDir, { lastOpened: 123, nested: { x: 1 } });
    expect(updated).toEqual({ lastOpened: 123, nested: { x: 1 } });

    const again = settings.getProject(tempProjectDir);
    expect(again).toEqual(updated);

    const path = join(tempProjectDir, ".synta", "settings.json");
    expect(existsSync(path)).toBe(true);
    const parsed = JSON.parse(readFileSync(path, "utf-8"));
    expect(parsed).toEqual(updated);
  });
});


