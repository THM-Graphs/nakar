import { NodeDisplayConfiguration } from './NodeDisplayConfiguration';
import { DBGraphDisplayConfiguration } from '../strapi-db/types/DBGraphDisplayConfiguration';
import { DBNodeDisplayConfiguration } from '../strapi-db/types/NodeDisplayConfiguration';
import { DBGraphDisplayConfigurationBoolean } from '../strapi-db/types/DBGraphDisplayConfigurationBoolea';
import { match } from 'ts-pattern';

export class GraphDisplayConfiguration {
  public readonly connectResultNodes: boolean | null;
  public readonly growNodesBasedOnDegree: boolean | null;
  public readonly nodeDisplayConfigurations: NodeDisplayConfiguration[];

  public constructor(data: {
    connectResultNodes: boolean | null;
    growNodesBasedOnDegree: boolean | null;
    nodeDisplayConfigurations: NodeDisplayConfiguration[];
  }) {
    this.connectResultNodes = data.connectResultNodes;
    this.growNodesBasedOnDegree = data.growNodesBasedOnDegree;
    this.nodeDisplayConfigurations = data.nodeDisplayConfigurations;
  }

  public static fromDb(
    dbConfig: DBGraphDisplayConfiguration | undefined | null,
  ): GraphDisplayConfiguration {
    return new GraphDisplayConfiguration({
      connectResultNodes: GraphDisplayConfiguration.inheritToNull(
        dbConfig?.connectResultNodes,
      ),
      growNodesBasedOnDegree: GraphDisplayConfiguration.inheritToNull(
        dbConfig?.growNodesBasedOnDegree,
      ),
      nodeDisplayConfigurations:
        dbConfig?.nodeDisplayConfigurations?.map(
          (c: DBNodeDisplayConfiguration): NodeDisplayConfiguration =>
            NodeDisplayConfiguration.fromDb(c),
        ) ?? [],
    });
  }

  private static inheritToNull(
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

  public byMergingIntoSelf(
    other: GraphDisplayConfiguration,
  ): GraphDisplayConfiguration {
    return new GraphDisplayConfiguration({
      connectResultNodes: other.connectResultNodes ?? this.connectResultNodes,
      growNodesBasedOnDegree:
        other.growNodesBasedOnDegree ?? this.growNodesBasedOnDegree,
      nodeDisplayConfigurations: [
        ...other.nodeDisplayConfigurations,
        ...this.nodeDisplayConfigurations,
      ],
    });
  }
}
