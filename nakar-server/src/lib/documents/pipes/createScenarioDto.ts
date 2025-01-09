import { DBScenario } from '../types/DBScenario';
import { SchemaGetScenario } from '../../../../src-gen/schema';

export function createScenarioDto(dbScenario: DBScenario): SchemaGetScenario {
  return {
    id: dbScenario.documentId,
    title: dbScenario.title ?? null,
    query: dbScenario.query ?? null,
    description: dbScenario.description ?? null,
    coverUrl: dbScenario.cover?.url ?? null,
  };
}
