import type { Namespace } from "../enums/Namespace";

/**
 * Represents a channel name consisting of the `namespace` and the action.
 * The namespace defines the feature domain (e.g. `settings`, `component`),
 * while the action describes the specific operation (e.g. `get`, `update`)
 */
export type ChannelName = `${Namespace}:${string}`;
