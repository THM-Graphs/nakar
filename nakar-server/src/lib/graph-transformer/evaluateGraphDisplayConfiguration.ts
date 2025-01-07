import { GraphDisplayConfiguration } from './GraphDisplayConfiguration';
import { DBScenario } from '../strapi-db/types/DBScenario';
import {
  DBGraphDisplayConfiguration,
  DBGraphDisplayConfigurationBoolean,
} from '../strapi-db/types/DBGraphDisplayConfiguration';
import { match } from 'ts-pattern';

export function evaluateGraphDisplayConfiguration(
  scneario: DBScenario,
): GraphDisplayConfiguration {
  const configFromDatabase = transform(
    scneario.scenarioGroup?.database?.graphDisplayConfiguration,
  );
  const configFromScenarioGroup = transform(
    scneario.scenarioGroup?.graphDisplayConfiguration,
  );
  const configFromScenario = transform(scneario.graphDisplayConfiguration);

  const resulting = mergeAIntoB(
    configFromScenario,
    mergeAIntoB(configFromScenarioGroup, configFromDatabase),
  );

  return resulting;
}

function transform(
  dbConfig: DBGraphDisplayConfiguration | undefined | null,
): GraphDisplayConfiguration {
  return {
    connectResultNodes: inheritToNull(dbConfig?.connectResultNodes),
    growNodesBasedOnDegree: inheritToNull(dbConfig?.growNodesBasedOnDegree),
  };
}

function mergeAIntoB(
  a: GraphDisplayConfiguration,
  b: GraphDisplayConfiguration,
): GraphDisplayConfiguration {
  return {
    connectResultNodes: a.connectResultNodes ?? b.connectResultNodes,
    growNodesBasedOnDegree:
      a.growNodesBasedOnDegree ?? b.growNodesBasedOnDegree,
  };
}

function inheritToNull(
  input: DBGraphDisplayConfigurationBoolean | null | undefined,
): boolean | null {
  return match(input)
    .returnType<boolean | null>()
    .with('inherit', () => null)
    .with(null, () => null)
    .with(undefined, () => null)
    .with('true', () => true)
    .with('false', () => false)
    .exhaustive();
}
