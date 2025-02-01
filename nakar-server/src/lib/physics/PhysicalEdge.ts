import { MutableEdge } from '../graph/MutableEdge';
import { PhysicalNode } from './PhysicalNode';

export class PhysicalEdge {
  private _source: PhysicalNode;
  private _target: PhysicalNode;
  private _original: MutableEdge;

  public constructor(
    edge: MutableEdge,
    sourceNode: PhysicalNode,
    targetNode: PhysicalNode,
  ) {
    this._original = edge;
    this._source = sourceNode;
    this._target = targetNode;
  }

  public get source(): PhysicalNode {
    return this._source;
  }

  public get target(): PhysicalNode {
    return this._target;
  }

  public get original(): MutableEdge {
    return this._original;
  }
}
