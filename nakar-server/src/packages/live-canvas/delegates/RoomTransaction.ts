import type { CanvasData } from '../data/CanvasData';
import type { CanvasReference } from '../data/CanvasReference';

/**
 * Exposes canvases only from the transaction room; creation and optional snapshot copying must be atomic.
 */
export interface RoomTransaction {
  /**
   * Returns detached references to the canvases in this transaction’s room.
   * @returns Detached references to the canvases in this transaction’s room.
   */
  list(): Promise<CanvasReference[]>;

  /**
   * Atomically creates a canvas and optionally initializes it from a detached snapshot.
   * @param title - Display title to assign.
   * @param data - Data object or snapshot used to initialize the operation.
   * @returns The concrete action implementing the serialized instruction.
   */
  create(title: string, data: CanvasData | null): Promise<CanvasReference>;

  /**
   * Removes a canvas belonging to the transaction’s room.
   * @param canvasId - Canonical identity of the canvas.
   * @returns A promise that settles when the operation completes.
   */
  remove(canvasId: string): Promise<void>;

  /**
   * Changes the title of a canvas belonging to the transaction’s room.
   * @param canvasId - Canonical identity of the canvas.
   * @param title - Display title to assign.
   * @returns A promise that settles when the operation completes.
   */
  rename(canvasId: string, title: string): Promise<void>;
}
