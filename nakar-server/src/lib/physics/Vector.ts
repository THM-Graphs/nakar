export class Vector {
  private _x: number;
  private _y: number;

  public constructor(x: number, y: number) {
    this._x = x;
    this._y = y;
  }

  public static get zero(): Vector {
    return new Vector(0, 0);
  }

  public get x(): number {
    return this._x;
  }

  public get y(): number {
    return this._y;
  }

  public get inverted(): Vector {
    return this.multiplied(-1);
  }

  public get magnitude(): number {
    return Math.sqrt(this._x * this._x + this._y * this._y);
  }

  public get normalized(): Vector {
    const magnitude = this.magnitude;
    if (magnitude === 0) {
      return new Vector(0, 0);
    }
    return this.divided(magnitude);
  }

  public added(vector: Vector): Vector {
    return new Vector(this._x + vector.x, this._y + vector.y);
  }

  public subtracted(vector: Vector): Vector {
    return new Vector(this._x - vector.x, this._y - vector.y);
  }

  public multiplied(scalar: number): Vector {
    return new Vector(this._x * scalar, this._y * scalar);
  }

  public divided(scalar: number): Vector {
    return new Vector(this._x / scalar, this._y / scalar);
  }

  public add(vector: Vector): void {
    this._x += vector.x;
    this._y += vector.y;
  }

  public subtract(vector: Vector): void {
    this._x -= vector.x;
    this._y -= vector.y;
  }

  public multiply(scalar: number): void {
    this._x *= scalar;
    this._y *= scalar;
  }

  public divide(scalar: number): void {
    this._x /= scalar;
    this._y /= scalar;
  }

  public normalize(): void {
    const magnitude = this.magnitude;
    if (magnitude !== 0) {
      this.divide(magnitude);
    }
  }
}
