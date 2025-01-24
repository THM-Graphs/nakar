import { SchemaGraphProperty } from '../../../src-gen/schema';
import { z } from 'zod';
import { JSONValue } from '../json/JSON';
import { SMap } from '../tools/Map';

export class MutablePropertyCollection {
  public static readonly schema = z.object({
    properties: z.record(z.any()),
  });

  public properties: SMap<string, JSONValue>;

  public constructor(data: { properties: SMap<string, JSONValue> }) {
    this.properties = data.properties;
  }

  public static create(
    properties: Record<string, JSONValue>,
  ): MutablePropertyCollection {
    return new MutablePropertyCollection({
      properties: Object.entries(properties).reduce(
        (akku, [key, value]) => akku.bySetting(key, value),
        new SMap<string, JSONValue>(),
      ),
    });
  }

  public static fromPlain(input: unknown): MutablePropertyCollection {
    const data = MutablePropertyCollection.schema.parse(input);
    return new MutablePropertyCollection({
      // TODO: fully parse JSONValue
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      properties: SMap.fromRecord(data.properties) as SMap<string, JSONValue>,
    });
  }

  public getStringValueOfProperty(key: string): string | null {
    const value = this.properties.get(key);
    if (typeof value !== 'string') {
      return null;
    }
    return value;
  }

  public firstStringValue(): string | null {
    for (const value of this.properties.values()) {
      if (typeof value === 'string') {
        return value;
      }
    }
    return null;
  }

  public toDto(): SchemaGraphProperty[] {
    return this.properties
      .toArray()
      .map(
        ([key, value]): SchemaGraphProperty => ({ slug: key, value: value }),
      );
  }

  public toPlain(): z.infer<typeof MutablePropertyCollection.schema> {
    return {
      properties: this.properties.toRecord(),
    };
  }
}
