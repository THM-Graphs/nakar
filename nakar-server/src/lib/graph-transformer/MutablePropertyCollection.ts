import { SchemaGraphProperty } from '../../../src-gen/schema';

export class MutablePropertyCollection {
  public properties: Map<string, unknown>;

  public constructor(data: { properties: Map<string, unknown> }) {
    this.properties = data.properties;
  }

  public static create(
    properties: Record<string, unknown>,
  ): MutablePropertyCollection {
    return new MutablePropertyCollection({
      properties: Object.entries(properties).reduce(
        (akku, [key, value]) => akku.bySetting(key, value),
        new Map<string, unknown>(),
      ),
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

  public toRecord(): Record<string, unknown> {
    return this.properties.toRecord();
  }

  public toDto(): SchemaGraphProperty[] {
    return this.properties
      .toArray()
      .map(
        ([key, value]): SchemaGraphProperty => ({ slug: key, value: value }),
      );
  }
}
