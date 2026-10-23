import type { CanvasData } from '../data/CanvasData';
import type { CanvasReference } from '../data/CanvasReference';
import type { CanvasRoomDelegate } from '../delegates/CanvasRoomDelegate';
import type { RoomTransaction } from '../delegates/RoomTransaction';

export class MockRoomDelegate implements CanvasRoomDelegate {
  public canvases: CanvasReference[] = [
    { id: 'canvas', roomId: 'room', title: 'Canvas' },
  ];

  public copies: (CanvasData | null)[] = [];

  private _tail: Promise<void> = Promise.resolve();

  public transact<T>(
    roomId: string,
    action: (transaction: RoomTransaction) => Promise<T>,
  ): Promise<T> {
    const operation: Promise<T> = this._tail.then(async (): Promise<T> => {
      const before: CanvasReference[] = structuredClone(this.canvases);
      try {
        return await action({
          list: (): Promise<CanvasReference[]> =>
            Promise.resolve(structuredClone(this.canvases)),
          create: (
            title: string,
            data: CanvasData | null,
          ): Promise<CanvasReference> => {
            const ref: CanvasReference = {
              id: `canvas-${this.canvases.length}`,
              roomId,
              title,
            };
            this.canvases.push(ref);
            this.copies.push(structuredClone(data));
            return Promise.resolve(structuredClone(ref));
          },
          remove: (id: string): Promise<void> => {
            this.canvases = this.canvases.filter(
              (ref: CanvasReference): boolean => ref.id !== id,
            );
            return Promise.resolve();
          },
          rename: (id: string, title: string): Promise<void> => {
            for (const ref of this.canvases) {
              if (ref.id === id) {
                ref.title = title;
              }
            }
            return Promise.resolve();
          },
        });
      } catch (error: unknown) {
        this.canvases = before;
        throw error;
      }
    });
    this._tail = operation.then(
      (): void => undefined,
      (): void => undefined,
    );
    return operation;
  }
}
