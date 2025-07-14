import { Neo4jService } from './Neo4jService';

export class ToManyElementsError extends Error {
  public constructor(public readonly length: number) {
    super(
      `To many elements: ${length.toString()} (maximum: ${Neo4jService.maximalElements.toString()})`,
    );
  }
}
