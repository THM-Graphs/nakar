import type { EdgeData } from '../data/EdgeData';
import { CanvasElement } from './CanvasElement';

/**
 * References relationship data and resolves whether its canonical endpoints still exist.
 */
export class CanvasEdge extends CanvasElement<EdgeData> {
  /**
   * Returns the discriminator of this concrete element kind.
   * @returns The discriminator of this concrete element kind.
   */
  public override get kind(): 'edge' {
    return 'edge';
  }

  /**
   * Reports whether either canonical endpoint is absent from the supplied node collection.
   * @param nodeIds - Canonical identities of the selected nodes.
   * @returns True when at least one endpoint is absent from the supplied node IDs.
   */
  public isDangling(nodeIds: readonly string[]): boolean {
    return (
      !nodeIds.includes(this._data.startNodeId) ||
      !nodeIds.includes(this._data.endNodeId)
    );
  }
}
