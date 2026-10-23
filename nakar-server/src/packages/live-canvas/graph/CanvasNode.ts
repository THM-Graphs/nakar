import type { NodeData } from '../data/NodeData';
import type { Position } from '../data/Position';
import { CanvasError } from '../CanvasError';
import { CanvasElement } from './CanvasElement';

/**
 * References node data and validates position changes while managing its lock state.
 */
export class CanvasNode extends CanvasElement<NodeData> {
  /**
   * Returns the discriminator of this concrete element kind.
   * @returns The discriminator of this concrete element kind.
   */
  public override get kind(): 'node' {
    return 'node';
  }

  /**
   * Validates finite coordinates and replaces the referenced node position.
   * @param position - New finite canvas coordinates.
   * @throws {@link CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  public move(position: Position): void {
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
      throw new CanvasError('invalid-data', 'Positions must be finite.');
    }
    this._data.position = { ...position };
  }

  /**
   * Updates the referenced node’s lock state.
   * @param locked - Whether physics must preserve the node position.
   */
  public setLocked(locked: boolean): void {
    this._data.locked = locked;
  }
}
