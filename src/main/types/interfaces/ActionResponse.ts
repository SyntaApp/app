/**
 * Standard response interface for IPC communication between main and renderer processes.
 *
 * This interface defines the structure for all responses sent through the IPC system,
 * providing consistent error handling and status reporting across all channels.
 *
 * @interface ActionResponse
 *
 * @example
 * ```ts
 * // Success response
 * const successResponse: IPCResponse = {
 *   status: 200,
 *   message: "Operation successful"
 * };
 * ```
 */
export default interface ActionResponse {
  status: number;
  message?: string;
  // Optional payload returned by actions
  data?: unknown;
}
