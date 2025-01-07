import { GraphDisplayConfiguration } from './GraphDisplayConfiguration';
import { DBScenario } from '../strapi-db/types/DBScenario';
import { DBGraphDisplayConfiguration } from '../strapi-db/types/DBGraphDisplayConfiguration';

const defaultConfig: GraphDisplayConfiguration = {
  connectResultNodes: false,
  growNodesBasedOnDegree: false,
};

export function evaluateGraphDisplayConfiguration(
  scneario: DBScenario,
): GraphDisplayConfiguration {
  const configFromDatabase = transform(
    scneario.scenarioGroup?.database?.graphDisplayConfiguration,
  );

  return configFromDatabase ?? defaultConfig;
}

function transform(
  dbConfig: DBGraphDisplayConfiguration | undefined | null,
): GraphDisplayConfiguration | null {
  if (dbConfig == null) {
    return null;
  } else {
    return {
      connectResultNodes:
        dbConfig.connectResultNodes ?? defaultConfig.connectResultNodes,
      growNodesBasedOnDegree:
        dbConfig.growNodesBasedOnDegree ?? defaultConfig.growNodesBasedOnDegree,
    };
  }
}
