import { Neo4jProperty } from './Neo4jProperty';
import { Neo4jPropertyValue } from './Neo4jPropertyValue';
import { match, P } from 'ts-pattern';
import { Integer } from 'neo4j-driver';

export class Neo4jPropertyCollection {
  public constructor(public readonly properties: Map<string, Neo4jProperty>) {}

  public static fromQueryResult(
    properties: Record<string, unknown>,
  ): Neo4jPropertyCollection {
    const p: Map<string, Neo4jProperty> = Object.entries(properties).reduce<
      Map<string, Neo4jProperty>
    >((map, [key, value]) => {
      map.set(key, { slug: key, value: this.getJSONValueOfProperty(value) });
      return map;
    }, new Map());

    return new Neo4jPropertyCollection(p);
  }

  private static getJSONValueOfProperty(field: unknown): Neo4jPropertyValue {
    return match(field)
      .returnType<Neo4jPropertyValue>()
      .with(P.nullish, () => null)
      .with(P.string, (s: string): string => s)
      .with(P.instanceOf(Integer), (integer: Integer): string =>
        integer.toString(),
      )
      .with(P.number, (n: number): number => n)
      .with(P.boolean, (b: boolean): string => b.toString())
      .otherwise((f: unknown) => {
        console.error(`WARNING: UNKNOWN RESULT TYPE: ${JSON.stringify(f)}`);
        return JSON.stringify(f);
      });
  }
}
