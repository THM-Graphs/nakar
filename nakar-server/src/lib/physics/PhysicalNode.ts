import { MutableNode } from '../graph/MutableNode';
import { Force } from './Force';
import { Vector } from './Vector';

export class PhysicalNode {
  private _id: string;
  private _position: Vector;
  private _velocity: Vector;
  private _original: MutableNode;

  public constructor(
    id: string,
    node: MutableNode,
    index: number,
    nodeCount: number,
  ) {
    this._id = id;
    this._velocity = new Vector(0, 0);
    this._original = node;

    const gridSize = 100;
    const gridWidth = Math.ceil(Math.sqrt(nodeCount));
    this._position = new Vector(
      (index % gridWidth) * gridSize - (gridWidth * gridSize) / 2,
      Math.floor(index / gridWidth) * gridSize - (gridWidth * gridSize) / 2,
    );
  }

  public get id(): string {
    return this._id;
  }

  public get position(): Vector {
    return this._position;
  }

  public get velocity(): Vector {
    return this._velocity;
  }

  public get original(): MutableNode {
    return this._original;
  }

  public get mass(): number {
    return Math.PI * Math.pow(this._original.radius, 2);
  }

  public physicsTick(): void {
    this._position.add(this._velocity);
    this._velocity.multiply(0.9);
  }

  public distanceTo(other: PhysicalNode): Vector {
    return this.position.subtracted(other.position);
  }

  public applyForce(force: Force): void {
    this._velocity.add(force.value);
  }
}
