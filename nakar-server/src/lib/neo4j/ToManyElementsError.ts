export class ToManyElementsError extends Error {
  public constructor(
    public readonly length: number,
    public readonly limit: number,
  ) {
    super(
      `To many elements: ${length.toString()} (maximum: ${limit.toString()})`,
    );
  }
}
