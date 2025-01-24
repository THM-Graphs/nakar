import z from 'zod';
import { JSONValue } from '@strapi/types/dist/utils/json';

export class DBStringList {
  public readonly values: string[];

  public constructor(data: { values: string[] }) {
    this.values = data.values;
  }

  public static parse(input: unknown): DBStringList {
    try {
      const schema = z.array(z.string());
      const parsedValue = schema.parse(input);
      return new DBStringList({ values: parsedValue });
    } catch {
      return new DBStringList({ values: [] });
    }
  }

  public toDb(): JSONValue {
    return this.values;
  }
}
