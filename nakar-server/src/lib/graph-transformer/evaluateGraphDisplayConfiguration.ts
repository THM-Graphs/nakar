import { GraphDisplayConfiguration } from './GraphDisplayConfiguration';
import { DBScenario } from '../strapi-db/types/DBScenario';
import { DBGraphDisplayConfiguration } from '../strapi-db/types/DBGraphDisplayConfiguration';
import { match } from 'ts-pattern';
import { DBGraphDisplayConfigurationBoolean } from '../strapi-db/types/DBGraphDisplayConfigurationBoolea';
import { DBNodeDisplayConfiguration } from '../strapi-db/types/NodeDisplayConfiguration';
import { NodeDisplayConfiguration } from './NodeDisplayConfiguration';

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
    nodeDisplayConfigurations:
      dbConfig?.nodeDisplayConfigurations?.map(
        (c: DBNodeDisplayConfiguration): NodeDisplayConfiguration => {
          return {
            displayText: c.displayText,
            radius: c.radius,
            backgroundColor: c.backgroundColor,
            targetLabel: c.targetLabel,
          };
        },
      ) ?? [],
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
    nodeDisplayConfigurations: [
      ...a.nodeDisplayConfigurations,
      ...b.nodeDisplayConfigurations,
    ],
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
