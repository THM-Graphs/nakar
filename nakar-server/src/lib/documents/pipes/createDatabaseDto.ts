import { DBDatabase } from '../types/DBDatabase';
import { SchemaGetDatabase } from '../../../../src-gen/schema';

export function createDatabaseDto(database: DBDatabase): SchemaGetDatabase {
  return {
    id: database.documentId,
    title: database.title ?? null,
    url: database.url ?? null,
    browserUrl: database.browserUrl ?? null,
  };
}
