import type { Result } from '@strapi/types/dist/modules/documents/result';
import { Input } from '@strapi/types/dist/modules/documents/params/data';
import { JSONValue } from '@strapi/types/dist/utils/json';

export class DBProperty {
  public readonly key: string;
  public readonly value: JSONValue;

  public constructor(data: { key: string; value: JSONValue }) {
    this.key = data.key;
    this.value = data.value;
  }

  public static parse(db: Result<'room.property'>): DBProperty {
    return new DBProperty({
      key: db.key ?? '',
      value: db.value ?? null,
    });
  }

  public toDb(): Input<'room.property'> {
    return {
      key: this.key,
      value: this.value,
    };
  }
}
