import { DBNodeDisplayConfiguration } from '../documents/types/DBNodeDisplayConfiguration';
import { FinalNodeDisplayConfiguration } from './FinalNodeDisplayConfiguration';

export class MergableNodeDisplayConfiguration {
  public readonly displayText: string | null;
  public readonly radius: string | null;
  public readonly backgroundColor: string | null;

  public constructor(data: {
    displayText: string | null;
    radius: string | null;
    backgroundColor: string | null;
  }) {
    this.displayText = data.displayText;
    this.radius = data.radius;
    this.backgroundColor = data.backgroundColor;
  }

  public static createFromDb(
    nodeDisplayConfig: DBNodeDisplayConfiguration,
  ): MergableNodeDisplayConfiguration {
    return new MergableNodeDisplayConfiguration({
      displayText: MergableNodeDisplayConfiguration.nullIfEmpty(
        nodeDisplayConfig.displayText,
      ),
      radius: MergableNodeDisplayConfiguration.nullIfEmpty(
        nodeDisplayConfig.radius,
      ),
      backgroundColor: MergableNodeDisplayConfiguration.nullIfEmpty(
        nodeDisplayConfig.backgroundColor,
      ),
    });
  }

  private static nullIfEmpty(input: string | null | undefined): string | null {
    if (input == null) {
      return null;
    } else {
      if (input.trim().length === 0) {
        return null;
      } else {
        return input;
      }
    }
  }

  public byMerging(
    other: MergableNodeDisplayConfiguration,
  ): MergableNodeDisplayConfiguration {
    return new MergableNodeDisplayConfiguration({
      displayText: other.displayText ?? this.displayText,
      radius: other.radius ?? this.radius,
      backgroundColor: other.backgroundColor ?? this.backgroundColor,
    });
  }

  public finalize(): FinalNodeDisplayConfiguration {
    return new FinalNodeDisplayConfiguration({
      displayText: this.displayText,
      radius: this.radius,
      backgroundColor: this.backgroundColor,
    });
  }
}
