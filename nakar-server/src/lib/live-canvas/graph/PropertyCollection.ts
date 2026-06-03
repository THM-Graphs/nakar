import { z } from 'zod';
import { SMap } from '../../../packages/map/Map';

export class PropertyCollection {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    properties: z.record(z.string(), z.unknown()),
  });

  public properties: SMap<string, unknown>;

  public constructor(data: { properties: SMap<string, unknown> }) {
    this.properties = data.properties;
  }

  public static empty(): PropertyCollection {
    return new PropertyCollection({ properties: new SMap() });
  }

  public static fromPlain(
    data: z.infer<typeof this.schema>,
  ): PropertyCollection {
    return new PropertyCollection({
      properties: SMap.fromRecord(data.properties),
    });
  }

  public static fromRecord(data: Record<string, unknown>): PropertyCollection {
    return new PropertyCollection({
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

  public toPlain(): z.infer<typeof PropertyCollection.schema> {
    return {
      properties: this.properties.toRecord(),
    };
  }

  public copy(): PropertyCollection {
    return new PropertyCollection({
      properties: this.properties.copy(),
    });
  }
}
