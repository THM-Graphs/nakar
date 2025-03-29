import z from 'zod';
import { JSONValue } from '@strapi/types/dist/utils/json';

export class DBStringList {
  public readonly values: string[];

  public constructor(data: { values: string[] }) {
    this.values = data.values;
  }

  public toDb(): JSONValue {
    return this.values;
  }
}
