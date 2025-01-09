import { Neo4jProperty } from './Neo4jProperty';
import {
  Neo4jPropertyValue,
  Neo4jPropertyValueArray,
  Neo4jPropertyValueObject,
} from './Neo4jPropertyValue';
import { match, P } from 'ts-pattern';
import { Integer } from 'neo4j-driver';

export class Neo4jPropertyCollection {
  public readonly properties: Map<string, Neo4jProperty>;

  public constructor(data: { properties: Map<string, Neo4jProperty> }) {
    this.properties = data.properties;
  }

  public static fromQueryResult(
    properties: Record<string, unknown>,
  ): Neo4jPropertyCollection {
    const p: Map<string, Neo4jProperty> = Object.entries(properties).reduce<
      Map<string, Neo4jProperty>
    >((map, [key, value]) => {
      map.set(
        key,
        new Neo4jProperty({
          slug: key,
          value: this.getJSONValueOfProperty(value),
        }),
      );
      return map;
    }, new Map());

    return new Neo4jPropertyCollection({ properties: p });
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
      .with(P.boolean, (b: boolean): boolean => b)
      .with(
        P.array(),
        (a: unknown[]): Neo4jPropertyValueArray =>
          a.map((e) => this.getJSONValueOfProperty(e)),
      )
      .with(
        P.map(),
        (o: Map<string, unknown>): Neo4jPropertyValueObject =>
          [...o.entries()].reduce<Neo4jPropertyValueObject>(
            (
              akku: Neo4jPropertyValueObject,
              [key, value]: [string, unknown],
            ): Neo4jPropertyValueObject => ({
              ...akku,
              [key]: this.getJSONValueOfProperty(value),
            }),
            {},
          ),
      )
      .otherwise((f: unknown) => {
        console.error(`WARNING: UNKNOWN PROPERTY TYPE: ${JSON.stringify(f)}`);
        return JSON.stringify(f);
      });
  }
}
