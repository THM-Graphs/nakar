import type { Result } from '@strapi/types/dist/modules/documents/result';

export class GetNodeDisplayConfigurationDBDTO {
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
}
