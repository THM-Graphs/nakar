import { DBScenarioGroup } from '../types/DBScenarioGroup';
import { SchemaGetScenarioGroup } from '../../../../src-gen/schema';

export function createScenarioGroupDto(
  dbScenarioGroup: DBScenarioGroup,
): SchemaGetScenarioGroup {
  return {
    id: dbScenarioGroup.documentId,
    title: dbScenarioGroup.title ?? null,
  };
}
