import type { Service } from "../core/ServiceManager";
import File from "../helpers/File";

/**
 * ## File Watching
 * File watching across Synta should use Chokidar which gives us
 * reliable, cross-platform, high-level file watching with filtering,
 * debouncing, and fallbacks.
 */

/**
 * Responsible for:
 * - loading & managing components.
 * - watching directory for changes (not changes in files - components manage that)
 */
export class Project implements Service {
  /**
   * All components are stored on service for easy access and management.
   * They are removed & added dynamically depending on whats happening to disk.
   */
  private components: Component[] = [];

  // ----------- Pre Load Methods ---------- //

  /**
   * Loads all components into components array (memory) & watch for deletions/creations
   */
  public load() {}

  // ---------- Post Load Methods ---------- //

  /**
   * Returns metadata about all components in the selected project.
   */
  public structure() {}

  public getComponent() {}
}

/**
 * Represents a component consisting of the TSX file, styling with a CSS file, and some other metadata.
 * Methods allow:
 * - Syncing of render -> disk
 * - Watching files for changes & syncing disk -> render
 */
export class Component {
  private tsxFile: File;
  private cssFile: File;

  constructor(tsxPath: string, cssPath: string) {
    this.tsxFile = new File(tsxPath);
    this.cssFile = new File(cssPath);
  }

  /**
   * Delete component tsx, css, etc.
   * CSS implementation will come later but still design for it with
   * paramters and whatnot.
   */
  public delete() {}

  /**
   * Get component contents.
   */
  public read() {}

  /**
   * Sync tsx AND css
   */
  public sync() {}
}
