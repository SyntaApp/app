import { join } from "path";
import { readFileSync, existsSync } from "fs";
import { nativeImage, app } from "electron";
import swallow from "../../functions/swallow";

/**
 * Represents an asset from the Asset directory.
 * This class was designed to streamline the importing process of assets.
 * Assets can be requested as buffers, native images, or their path.
 */
export default class Asset {
  private static defaultDir = "./dist/assets";
  private path: string;

  /**
   * @param relPath - The path of the asset relative to the asset directory.
   */
  constructor(relPath: string) {
    this.path = Asset.formPath(relPath);
  }

  /**
   * Update the existing asset directory.
   */
  public static updateAssetDir(path: string) {
    Asset.defaultDir = path;
  }

  public toPath() {
    return this.path;
  }

  public toBuffer() {
    return Buffer.from(readFileSync(this.path));
  }

  public toNativeImage() {
    return nativeImage.createFromBuffer(this.toBuffer());
  }

  /**
   * Creates a absolute path using the working directory and the relative path.
   *
   * @param relPath - Should be relative to the asset directory.
   */
  public static formPath(relPath: string) {
    const basePath = swallow(app.getAppPath, process.cwd());

    return join(basePath, Asset.defaultDir, relPath);
  }
}
