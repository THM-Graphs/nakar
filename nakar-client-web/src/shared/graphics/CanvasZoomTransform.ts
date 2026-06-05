export class CanvasZoomTransform {
  public readonly k: number;
  public readonly x: number;
  public readonly y: number;

  public constructor(k: number, x: number, y: number) {
    this.k = k;
    this.x = x;
    this.y = y;
  }

  public apply(point: [number, number]): [number, number] {
    return [point[0] * this.k + this.x, point[1] * this.k + this.y];
  }

  public applyX(x: number): number {
    return x * this.k + this.x;
  }

  public applyY(y: number): number {
    return y * this.k + this.y;
  }

  public invert(point: [number, number]): [number, number] {
    return [(point[0] - this.x) / this.k, (point[1] - this.y) / this.k];
  }

  public invertX(x: number): number {
    return (x - this.x) / this.k;
  }

  public invertY(y: number): number {
    return (y - this.y) / this.k;
  }

  public toString(): string {
    return `translate(${this.x.toString()},${this.y.toString()}) scale(${this.k.toString()})`;
  }
}
