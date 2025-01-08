import { DBNodeDisplayConfiguration } from '../strapi-db/types/NodeDisplayConfiguration';

export class NodeDisplayConfiguration {
  public constructor(
    public readonly targetLabel: string | null,
    public readonly displayText: string | null,
    public readonly radius: string | null,
    public readonly backgroundColor: string | null,
  ) {}

  public static fromDb(
    nodeDisplayConfig: DBNodeDisplayConfiguration,
  ): NodeDisplayConfiguration {
    return new NodeDisplayConfiguration(
      nodeDisplayConfig.displayText,
      nodeDisplayConfig.radius,
      nodeDisplayConfig.backgroundColor,
      nodeDisplayConfig.targetLabel,
    );
  }
}
