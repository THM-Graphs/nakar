export class MutablePosition {
  public x: number;
  public y: number;

  public constructor(data: { x: number; y: number }) {
    this.x = data.x;
    this.y = data.y;
  }

  public static default(): MutablePosition {
    return new MutablePosition({
      x: 0,
      y: 0,
    });
  }
}
