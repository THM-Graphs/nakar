import type { CanvasData } from './data/CanvasData';
import type { CanvasReference } from './data/CanvasReference';
import type { RoomData } from './data/RoomData';
import type { CanvasRoomDelegate } from './delegates/CanvasRoomDelegate';
import type { RoomTransaction } from './delegates/RoomTransaction';
import { CanvasError } from './CanvasError';

/**
 * Applies canvas creation, duplication, closing and renaming within a host-provided room transaction.
 */
export class CanvasRoom {
  /**
   * References the current room and its transactional canvas delegate.
   * @param _data - Data object or snapshot used to initialize the operation.
   * @param _delegate - Host implementation of the external operations.
   */
  public constructor(
    private readonly _data: RoomData,
    private readonly _delegate: CanvasRoomDelegate,
  ) {}

  /**
   * Applies the requested room mutation atomically and rejects foreign canvases or deletion of the last canvas.
   * @param canvasId - Canonical identity of the canvas.
   * @param operation - Operation to serialize and execute.
   * @param data - Data object or snapshot used to initialize the operation.
   * @param title - Display title to assign.
   * @returns The selected or newly created canvas reference and the updated room canvas list.
   * @throws {@link CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  public async change(
    canvasId: string,
    operation: 'create' | 'duplicate' | 'close' | 'closeOthers' | 'rename',
    data: CanvasData | null = null,
    title: string = 'New Canvas',
  ): Promise<{
    /**
     * Canvas instance owned by the test harness.
     */
    canvas: CanvasReference | null;

    /**
     * Canvas references belonging to the room.
     */
    canvases: CanvasReference[];
  }> {
    return await this._delegate.transact(
      this._data.id,
      async (
        transaction: RoomTransaction,
      ): Promise<{
        /**
         * Canvas instance owned by the test harness.
         */
        canvas: CanvasReference | null;

        /**
         * Canvas references belonging to the room.
         */
        canvases: CanvasReference[];
      }> => {
        const canvases: CanvasReference[] = await transaction.list();
        const source: CanvasReference | undefined = canvases.find(
          (canvas: CanvasReference): boolean =>
            canvas.id === canvasId && canvas.roomId === this._data.id,
        );
        if (
          source === undefined ||
          canvases.some(
            (canvas: CanvasReference): boolean =>
              canvas.roomId !== this._data.id,
          )
        ) {
          throw new CanvasError('not-found', 'Canvas does not belong to room.');
        }
        let result: CanvasReference | null = null;
        switch (operation) {
          case 'create':
            result = await transaction.create(title, null);
            break;
          case 'duplicate':
            result = await transaction.create(
              source.title ?? 'New Canvas',
              structuredClone(data),
            );
            break;
          case 'close':
            if (canvases.length <= 1) {
              throw new CanvasError(
                'conflict',
                'Cannot close the last canvas.',
              );
            }
            await transaction.remove(canvasId);
            break;
          case 'closeOthers':
            for (const canvas of canvases) {
              if (canvas.id !== canvasId) {
                await transaction.remove(canvas.id);
              }
            }
            break;
          case 'rename':
            await transaction.rename(canvasId, title);
            break;
        }
        return { canvas: result, canvases: await transaction.list() };
      },
    );
  }
}
