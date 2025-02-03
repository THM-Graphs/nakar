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
  private _grabs: SSet<string>;
  private _locked: boolean;

  public constructor(id: string, node: MutableNode) {
    this._id = id;
    this._position = new Vector(node.position.x, node.position.y);
    this._velocity = new Vector(0, 0);
    this._original = node;
    this._grabs = new SSet();
    this._locked = false;
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
    return this._grabs.size > 0 || this._locked;
  }

  public get grabs(): SSet<string> {
    return this._grabs;
  }

  public set position(newValue: Vector) {
    this._position = newValue;
  }

  public grab(userId: string): void {
    this._grabs.add(userId);
  }

  public ungrab(userId: string): void {
    this._grabs.delete(userId);
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

  public lock(): void {
    this._locked = true;
  }

  public unlock(): void {
    this._locked = false;
  }
}
