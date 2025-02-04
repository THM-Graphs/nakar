import { SchemaGraphProperty } from '../../../src-gen/schema';
import { z } from 'zod';
import { SMap } from '../tools/Map';

export class MutablePropertyCollection {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    properties: z.record(z.unknown()),
  });

  public properties: SMap<string, unknown>;

  public constructor(data: { properties: SMap<string, unknown> }) {
    this.properties = data.properties;
  }

  public static create(
    properties: Record<string, unknown>,
  ): MutablePropertyCollection {
    return new MutablePropertyCollection({
      properties: Object.entries(properties).reduce(
        (
          akku: SMap<string, unknown>,
          [key, value]: [string, unknown],
        ): SMap<string, unknown> => akku.bySetting(key, value),
        new SMap<string, unknown>(),
      ),
    });
  }

  public static fromPlain(input: unknown): MutablePropertyCollection {
    const data: z.infer<typeof this.schema> =
      MutablePropertyCollection.schema.parse(input);
    return new MutablePropertyCollection({
      properties: SMap.fromRecord(data.properties),
    });
  }

  public getStringValueOfProperty(key: string): string | null {
    const v: unknown = this.properties.get(key);
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
    return this.properties.toArray().map(
      ([key, value]: [string, unknown]): SchemaGraphProperty => ({
        slug: key,
        value: value,
      }),
    );
  }

  public toPlain(): z.infer<typeof MutablePropertyCollection.schema> {
    return {
      properties: this.properties.toRecord(),
    };
  }
}
