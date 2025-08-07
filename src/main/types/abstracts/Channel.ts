import type { Namespace } from "../enums/Namespace";
import type { ChannelName } from "../types/ChannelName";

/**
 * Represents a
 */
export default abstract class Channel {
  /**
   * Namespace this channel is nested under (e.g. "settings", "main").
   * Determines the first part of the channel name.
   */
  public abstract namespace: Namespace;

  /**
   * Optional override of the action name.
   * If not provided, the class name is used (lowercased).
   * Determines the second part of the channel name.
   */
  public abstract action?: string;

  /**
   * @returns Channel name (e.g. `settings:get`)
   */
  public abstract get name(): ChannelName;

  /**
   * Handler function invoked when event over this channel is fired.
   */
  public abstract handle(): Promise<void>;
}
