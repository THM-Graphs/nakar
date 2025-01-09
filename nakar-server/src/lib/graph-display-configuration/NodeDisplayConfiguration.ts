import { DBNodeDisplayConfiguration } from '../strapi-db/types/NodeDisplayConfiguration';

export class NodeDisplayConfiguration {
  public readonly targetLabel: string | null;
  public readonly displayText: string | null;
  public readonly radius: string | null;
  public readonly backgroundColor: string | null;

  public constructor(data: {
    targetLabel: string | null;
    displayText: string | null;
    radius: string | null;
    backgroundColor: string | null;
  }) {
    this.targetLabel = data.targetLabel;
    this.displayText = data.displayText;
    this.radius = data.radius;
    this.backgroundColor = data.backgroundColor;
  }

  public static fromDb(
    nodeDisplayConfig: DBNodeDisplayConfiguration,
  ): NodeDisplayConfiguration {
    return new NodeDisplayConfiguration({
      targetLabel: nodeDisplayConfig.targetLabel,
      displayText: nodeDisplayConfig.displayText,
      radius: nodeDisplayConfig.radius,
      backgroundColor: nodeDisplayConfig.backgroundColor,
    });
  }
}
