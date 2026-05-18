export class HierarchyLayoutConfig {
  public constructor(
    public readonly layerSpacing: number,
    public readonly nodeSpacing: number,
    public readonly componentSpacing: number,
    public readonly sweeps: number,
    public readonly positionSweeps: number,
    public readonly orderSweeps: number,
    public readonly crossingWeight: number,
  ) {}

  public static createDefault(): HierarchyLayoutConfig {
    return new HierarchyLayoutConfig(450, 50, 250, 4, 12, 4, 1000000);
  }
}
