import { MutableNode } from '../graph/MutableNode';
import { SSet } from '../tools/Set';
import { Force } from './Force';
import { Vector } from './Vector';

export class PhysicalNode {
  public static readonly maximumVelocity = 1000;

  private _id: string;
  private _position: Vector;
  private _velocity: Vector;
  private _original: MutableNode;
  private _locks: SSet<string>;

  public constructor(id: string, node: MutableNode) {
    this._id = id;
    this._velocity = new Vector(0, 0);
    this._original = node;
    this._locks = new SSet();

    this._position = new Vector(node.position.x, node.position.y);
  }

  public get id(): string {
    return this._id;
  }

  public get velocity(): Vector {
    return this._velocity;
  }

  public get position(): Vector {
    return this._position;
  }

  public get original(): MutableNode {
    return this._original;
  }

  public get mass(): number {
    return Math.PI * Math.pow(this._original.radius, 2);
  }

  public get locked(): boolean {
    return this._locks.size > 0;
  }

  public get locks(): SSet<string> {
    return this._locks;
  }

  public set position(newValue: Vector) {
    this._position = newValue;
  }

  public lock(userId: string): void {
    this._locks.add(userId);
  }

  public unlock(userId: string): void {
    this._locks.delete(userId);
  }

  public physicsTick(): void {
    this._position.add(this._velocity);
    this._velocity.multiply(0.8);
    this._original.position.x = this._position.x;
    this._original.position.y = this._position.y;
  }

  public distanceTo(other: PhysicalNode): Vector {
    return this.position.subtracted(other.position);
  }

  public applyForce(force: Force): void {
    this._velocity.add(force.value);
    if (this._velocity.magnitude > PhysicalNode.maximumVelocity) {
      this._velocity = this._velocity.normalized.multiplied(
        PhysicalNode.maximumVelocity,
      );
    }
  }

  public jiggle(): void {
    this._position.add(new Vector(Math.random() - 0.5, Math.random() - 0.5));
  }
}
