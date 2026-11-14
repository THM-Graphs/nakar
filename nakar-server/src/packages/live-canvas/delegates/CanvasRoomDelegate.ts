import type { RoomTransaction } from './RoomTransaction';

/**
 * Runs an atomic transaction serialized across every instance sharing the requested room; failures must roll back changes.
 */
export interface CanvasRoomDelegate {
  /**
   * Serializes an atomic room operation and returns its callback result.
   * @typeParam T - Value or result type preserved by this operation.
   * @param roomId - Identity of the room containing the canvas.
   * @param action - Polymorphic canvas action or transaction callback to execute.
   * @returns The callback result after the serialized transaction completes.
   */
  transact<T>(
    roomId: string,
    action: (transaction: RoomTransaction) => Promise<T>,
  ): Promise<T>;
}
