import { z } from 'zod';
import { SMap } from '../../map/Map';

export class MutablePropertyCollection {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    properties: z.record(z.unknown()),
  });

  public properties: SMap<string, unknown>;

  public constructor(data: { properties: SMap<string, unknown> }) {
    this.properties = data.properties;
  }

  public static empty(): MutablePropertyCollection {
    return new MutablePropertyCollection({ properties: new SMap() });
  }

  public static fromPlain(
    data: z.infer<typeof this.schema>,
  ): MutablePropertyCollection {
    return new MutablePropertyCollection({
      properties: SMap.fromRecord(data.properties),
    });
  }

  public static fromRecord(
    data: Record<string, unknown>,
  ): MutablePropertyCollection {
    return new MutablePropertyCollection({
      properties: SMap.fromRecord(data),
    });
  }

  public getStringValueOfProperty(key: string): string | null {
    const v: unknown = this.properties.get(key);
    if (typeof v === 'string' && v.trim().length > 0) {
      return v;
    }
    return null;
  }

  public firstStringValue(): string | null {
    for (const value of this.properties.values()) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }
    return null;
  }

  public toPlain(): z.infer<typeof MutablePropertyCollection.schema> {
    return {
      properties: this.properties.toRecord(),
    };
  }

  public copy(): MutablePropertyCollection {
    return new MutablePropertyCollection({
      properties: this.properties.copy(),
    });
  }
}
