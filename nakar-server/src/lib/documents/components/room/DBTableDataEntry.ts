import type { Result } from '@strapi/types/dist/modules/documents/result';
import z from 'zod';
import { JSONObject } from '@strapi/types/dist/utils/json';
import { Input } from '@strapi/types/dist/modules/documents/params/data';

export class DBTableDataEntry {
  public readonly rowData: JSONObject;

  public constructor(data: { rowData: JSONObject }) {
    this.rowData = data.rowData;
  }

  public static parse(db: Result<'room.table-data'>): DBTableDataEntry {
    try {
      const schema = z.record(z.any());
      const parsed = schema.parse(db.rowData);
      return new DBTableDataEntry({ rowData: parsed });
    } catch {
      return new DBTableDataEntry({ rowData: {} });
    }
  }

  public toDb(): Input<'room.table-data'> {
    return {
      rowData: this.rowData,
    };
  }
}
