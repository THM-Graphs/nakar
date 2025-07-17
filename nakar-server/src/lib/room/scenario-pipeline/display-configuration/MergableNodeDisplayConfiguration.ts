import { NodeDisplayConfigurationDBDTO } from '../../../database/dto/NodeDisplayConfigurationDBDTO';
import { FinalNodeDisplayConfiguration } from './FinalNodeDisplayConfiguration';

export class MergableNodeDisplayConfiguration {
  public readonly displayText: string | null;
  public readonly radius: string | null;
  public readonly backgroundColor: string | null;
  public readonly compress: boolean | null;

  public constructor(data: {
    displayText: string | null;
    radius: string | null;
    backgroundColor: string | null;
    compress: boolean | null;
  }) {
    this.displayText = data.displayText;
    this.radius = data.radius;
    this.backgroundColor = data.backgroundColor;
    this.compress = data.compress;
  }

  public static createFromDb(
    nodeDisplayConfig: NodeDisplayConfigurationDBDTO,
  ): MergableNodeDisplayConfiguration {
    return new MergableNodeDisplayConfiguration({
      displayText: nodeDisplayConfig.displayText,
      radius: nodeDisplayConfig.radius,
      backgroundColor: nodeDisplayConfig.backgroundColor,
      compress: nodeDisplayConfig.compress,
    });
  }

  public byMerging(
    other: MergableNodeDisplayConfiguration,
  ): MergableNodeDisplayConfiguration {
    return new MergableNodeDisplayConfiguration({
      displayText: other.displayText ?? this.displayText,
      radius: other.radius ?? this.radius,
      backgroundColor: other.backgroundColor ?? this.backgroundColor,
      compress: other.compress ?? this.compress,
    });
  }

  public finalize(): FinalNodeDisplayConfiguration {
    return new FinalNodeDisplayConfiguration({
      displayText: this.displayText,
      radius: this.radius,
      backgroundColor: this.backgroundColor,
      compress: this.compress ?? false,
    });
  }
}
