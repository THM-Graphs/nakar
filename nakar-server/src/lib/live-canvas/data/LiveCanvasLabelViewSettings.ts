import { GraphNode } from '../graph/GraphNode';
import { match } from 'ts-pattern';
import { LiveCanvasLabelViewSettingsDto } from '../../schema/dtos/LiveCanvasLabelViewSettingsDto';
import z from 'zod';

export class LiveCanvasLabelViewSettings {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    radius: z.number(),
    customRadius: z.boolean(),
    colorIndex: z.enum(['0', '1', '2', '3', '4', '5']),
    customColorIndex: z.boolean(),
  });

  private readonly _radius: number;
  private readonly _customRadius: boolean;
  private readonly _colorIndex: LiveCanvasLabelViewSettings['colorIndex'];
  private readonly _customColorIndex: boolean;

  public constructor(data: {
    radius: number;
    customRadius: boolean;
    colorIndex: LiveCanvasLabelViewSettings['colorIndex'];
    customColorIndex: boolean;
  }) {
    this._radius = data.radius;
    this._customRadius = data.customRadius;
    this._colorIndex = data.colorIndex;
    this._customColorIndex = data.customColorIndex;
  }

  public get radius(): number {
    return this._radius;
  }

  public get customRadius(): boolean {
    return this._customRadius;
  }

  public get colorIndex(): 0 | 1 | 2 | 3 | 4 | 5 {
    return this._colorIndex;
  }

  public get customColorIndex(): boolean {
    return this._customColorIndex;
  }

  public static fromPlain(
    data: z.infer<typeof LiveCanvasLabelViewSettings.schema>,
  ): LiveCanvasLabelViewSettings {
    return new LiveCanvasLabelViewSettings({
      radius: data.radius,
      customRadius: data.customRadius,
      colorIndex: match(data.colorIndex)
        .with('0', (): LiveCanvasLabelViewSettings['colorIndex'] => 0)
        .with('1', (): LiveCanvasLabelViewSettings['colorIndex'] => 1)
        .with('2', (): LiveCanvasLabelViewSettings['colorIndex'] => 2)
        .with('3', (): LiveCanvasLabelViewSettings['colorIndex'] => 3)
        .with('4', (): LiveCanvasLabelViewSettings['colorIndex'] => 4)
        .with('5', (): LiveCanvasLabelViewSettings['colorIndex'] => 5)
        .exhaustive(),
      customColorIndex: data.customColorIndex,
    });
  }

  public static default(): LiveCanvasLabelViewSettings {
    return new LiveCanvasLabelViewSettings({
      radius: GraphNode.defaultRadius,
      customRadius: false,
      colorIndex: 0,
      customColorIndex: false,
    });
  }

  public static fromSchema(
    input: LiveCanvasLabelViewSettingsDto,
  ): LiveCanvasLabelViewSettings {
    return new LiveCanvasLabelViewSettings({
      radius: input.radius,
      customRadius: input.customRadius,
      colorIndex: input.colorIndex,
      customColorIndex: input.customColorIndex,
    });
  }

  public static getLeastOftenColorIndex(
    indexes: LiveCanvasLabelViewSettings['colorIndex'][],
  ): LiveCanvasLabelViewSettings['colorIndex'] {
    const colorCounts: [0, 0, 0, 0, 0, 0] = [0, 0, 0, 0, 0, 0];
    for (const index of indexes) {
      colorCounts[index] += 1;
    }

    let smallestIndex: number = 0;
    let smallesCount: number = colorCounts[0];
    for (let i: number = 1; i < colorCounts.length; i += 1) {
      if (colorCounts[i] < smallesCount) {
        smallestIndex = i;
        smallesCount = colorCounts[i];
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return smallestIndex as LiveCanvasLabelViewSettings['colorIndex'];
  }

  public toPlain(): z.infer<typeof LiveCanvasLabelViewSettings.schema> {
    return {
      radius: this.radius,
      customRadius: this.customRadius,
      colorIndex: match(this.colorIndex)
        .with(
          0,
          (): z.infer<
            typeof LiveCanvasLabelViewSettings.schema
          >['colorIndex'] => '0',
        )
        .with(
          1,
          (): z.infer<
            typeof LiveCanvasLabelViewSettings.schema
          >['colorIndex'] => '1',
        )
        .with(
          2,
          (): z.infer<
            typeof LiveCanvasLabelViewSettings.schema
          >['colorIndex'] => '2',
        )
        .with(
          3,
          (): z.infer<
            typeof LiveCanvasLabelViewSettings.schema
          >['colorIndex'] => '3',
        )
        .with(
          4,
          (): z.infer<
            typeof LiveCanvasLabelViewSettings.schema
          >['colorIndex'] => '4',
        )
        .with(
          5,
          (): z.infer<
            typeof LiveCanvasLabelViewSettings.schema
          >['colorIndex'] => '5',
        )
        .exhaustive(),
      customColorIndex: this.customColorIndex,
    };
  }
}
