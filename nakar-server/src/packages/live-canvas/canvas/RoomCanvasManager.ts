import { NotFoundError } from '../error/NotFoundError';
import { ConflictError } from '../error/ConflictError';
import type { CanvasData } from '../data/CanvasData';
import type { CanvasReference } from '../data/CanvasReference';
import type { RoomData } from '../data/RoomData';
import type { CanvasRoomDelegate } from '../delegates/CanvasRoomDelegate';
import type { RoomTransaction } from '../delegates/RoomTransaction';

/**
 * Manages the canvases belonging to a room through host-provided atomic transactions.
 */
export class RoomCanvasManager {
  /**
   * References the room whose canvases are managed and its transactional delegate.
   * @param _data - Room whose canvases are managed by this instance.
   * @param _delegate - Host implementation of transactional room-canvas operations.
   */
  public constructor(
    private readonly _data: RoomData,
    private readonly _delegate: CanvasRoomDelegate,
  ) {}

  /**
   * Applies the requested canvas operation atomically within the room and protects its last canvas from deletion.
   * @param canvasId - Canonical identity of an existing canvas in the managed room.
   * @param operation - Operation to serialize and execute.
   * @param data - Data object or snapshot used to initialize the operation.
   * @param title - Display title to assign.
   * @returns The selected or newly created canvas reference and the updated room canvas list.
   * @throws {@link error/CanvasError!CanvasError | CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  public async change(
    canvasId: string,
    operation: 'create' | 'duplicate' | 'close' | 'closeOthers' | 'rename',
    data: CanvasData | null = null,
    title: string = 'New Canvas',
  ): Promise<{
    /**
     * Canvas reference created by the operation, or null when none is created.
     */
    canvas: CanvasReference | null;

    /**
     * Canvas references in the managed room after the operation.
     */
    canvases: CanvasReference[];
  }> {
    return await this._delegate.transact(
      this._data.id,
      async (
        transaction: RoomTransaction,
      ): Promise<{
        /**
         * Canvas reference created by the operation, or null when none is created.
         */
        canvas: CanvasReference | null;

        /**
         * Canvas references in the managed room after the operation.
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
          throw new NotFoundError('Canvas does not belong to room.');
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
              throw new ConflictError('Cannot close the last canvas.');
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
