import { DBScenarioGroup } from '../strapi-db/types/DBScenarioGroup';
import { SchemaGetScenarioGroup } from '../../../src-gen/schema';

export function transformScenarioGroup(
  dbScenarioGroup: DBScenarioGroup,
): SchemaGetScenarioGroup {
  return {
    id: dbScenarioGroup.documentId,
    title: dbScenarioGroup.title ?? '',
  };
}
