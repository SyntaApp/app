/**
 * Channels follow a `namespace:action` format.
 * The namespace defines the feature domain (e.g. settings, component),
 * while the action defines the operation (e.g. get, update).
 *
 * For example:
 * - `settings:get` - used to fetch settings
 * - `settings:update` - used to update settings
 */
export type Channel = `${string}:${string}`;
