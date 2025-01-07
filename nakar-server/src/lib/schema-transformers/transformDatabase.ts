import { SchemaGetDatabase } from '../../../src-gen/schema';
import { DBDatabase } from '../strapi-db/types/DBDatabase';

export function transformDatabase(database: DBDatabase): SchemaGetDatabase {
  return {
    id: database.documentId,
    title: database.title ?? '',
    url: database.url ?? '',
    browserUrl: database.browserUrl,
  };
}
