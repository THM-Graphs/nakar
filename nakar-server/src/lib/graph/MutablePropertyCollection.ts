import { SchemaGraphProperty } from '../../../src-gen/schema';
import { z } from 'zod';
import { SMap } from '../tools/Map';
import { jsonValueSchema, JsonValue } from '../json/JSON';

export class MutablePropertyCollection {
  public static readonly schema = z.object({
    properties: z.record(jsonValueSchema),
  });

  public properties: SMap<string, JsonValue>;

  public constructor(data: { properties: SMap<string, JsonValue> }) {
    this.properties = data.properties;
  }

  public static create(
    properties: Record<string, JsonValue>,
  ): MutablePropertyCollection {
    return new MutablePropertyCollection({
      properties: Object.entries(properties).reduce(
        (akku, [key, value]) => akku.bySetting(key, value),
        new SMap<string, JsonValue>(),
      ),
    });
  }

  public static fromPlain(input: unknown): MutablePropertyCollection {
    const data = MutablePropertyCollection.schema.parse(input);
    return new MutablePropertyCollection({
      properties: SMap.fromRecord(data.properties),
    });
  }

  public getStringValueOfProperty(key: string): string | null {
    const v = this.properties.get(key);
    if (typeof v === 'string') {
      return v;
    }
    return null;
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
