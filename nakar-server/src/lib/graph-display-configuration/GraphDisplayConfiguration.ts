import { NodeDisplayConfiguration } from './NodeDisplayConfiguration';
import { DBGraphDisplayConfiguration } from '../strapi-db/types/DBGraphDisplayConfiguration';
import { DBNodeDisplayConfiguration } from '../strapi-db/types/NodeDisplayConfiguration';
import { DBGraphDisplayConfigurationBoolean } from '../strapi-db/types/DBGraphDisplayConfigurationBoolea';
import { match } from 'ts-pattern';

export class GraphDisplayConfiguration {
  public constructor(
    public readonly connectResultNodes: boolean | null,
    public readonly growNodesBasedOnDegree: boolean | null,
    public readonly nodeDisplayConfigurations: NodeDisplayConfiguration[],
  ) {}

  public static fromDb(
    dbConfig: DBGraphDisplayConfiguration | undefined | null,
  ): GraphDisplayConfiguration {
    return new GraphDisplayConfiguration(
      GraphDisplayConfiguration.inheritToNull(dbConfig?.connectResultNodes),
      GraphDisplayConfiguration.inheritToNull(dbConfig?.growNodesBasedOnDegree),
      dbConfig?.nodeDisplayConfigurations?.map(
        (c: DBNodeDisplayConfiguration): NodeDisplayConfiguration =>
          NodeDisplayConfiguration.fromDb(c),
      ) ?? [],
    );
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
    return new GraphDisplayConfiguration(
      other.connectResultNodes ?? this.connectResultNodes,
      other.growNodesBasedOnDegree ?? this.growNodesBasedOnDegree,
      [...other.nodeDisplayConfigurations, ...this.nodeDisplayConfigurations],
    );
  }
}
