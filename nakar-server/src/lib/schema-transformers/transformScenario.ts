import { DBScenario } from '../strapi-db/types/DBScenario';
import { SchemaGetScenario } from '../../../src-gen/schema';

export function transformScenario(dbScenario: DBScenario): SchemaGetScenario {
  return {
    id: dbScenario.documentId,
    title: dbScenario.title ?? '',
    query: dbScenario.query ?? '',
    description: dbScenario.description ?? '',
    coverUrl: dbScenario.cover?.url ?? null,
  };
}
