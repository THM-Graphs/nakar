/**
 * Identifies a canvas and its containing room without loading its graph.
 */
export interface CanvasReference {
  /**
   * Canonical identity of this domain object.
   */
  id: string;

  /**
   * Identity of the room containing the canvas.
   */
  roomId: string;

  /**
   * Display title of the object or action.
   */
  title: string | null;
}
