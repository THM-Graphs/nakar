import { match } from 'ts-pattern';
import { LiveCanvasLabelViewSettingsDto } from '../../schema/dtos/LiveCanvasLabelViewSettingsDto';
import z from 'zod';

export class LiveCanvasLabelViewSettings {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    radius: z.number(),
    customRadius: z.boolean(),
    colorIndex: z.enum(['0', '1', '2', '3', '4', '5']),
    titleProperty: z.string().optional(),
    customTitleProperty: z.boolean().optional(),
  });

  private readonly _radius: number;
  private readonly _customRadius: boolean;
  private readonly _colorIndex: LiveCanvasLabelViewSettings['colorIndex'];
  private readonly _titleProperty: string;
  private readonly _customTitleProperty: boolean;

  public constructor(data: {
    radius: number;
    customRadius: boolean;
    colorIndex: LiveCanvasLabelViewSettings['colorIndex'];
    titleProperty: string;
    customTitleProperty: boolean;
  }) {
    this._radius = data.radius;
    this._customRadius = data.customRadius;
    this._colorIndex = data.colorIndex;
    this._titleProperty = data.titleProperty;
    this._customTitleProperty = data.customTitleProperty;
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

  public get titleProperty(): string {
    return this._titleProperty;
  }

  public get customTitleProperty(): boolean {
    return this._customTitleProperty;
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
      titleProperty: data.titleProperty ?? '',
      customTitleProperty: data.customTitleProperty ?? false,
    });
  }

  public static fromSchema(
    input: LiveCanvasLabelViewSettingsDto,
  ): LiveCanvasLabelViewSettings {
    return new LiveCanvasLabelViewSettings({
      radius: input.radius,
      customRadius: input.customRadius,
      colorIndex: input.colorIndex,
      titleProperty: input.titleProperty,
      customTitleProperty: input.customTitleProperty,
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

  public withColorIndex(
    colorIndex: LiveCanvasLabelViewSettings['colorIndex'],
  ): LiveCanvasLabelViewSettings {
    return new LiveCanvasLabelViewSettings({
      radius: this.radius,
      customRadius: this.customRadius,
      colorIndex: colorIndex,
      titleProperty: this.titleProperty,
      customTitleProperty: this.customTitleProperty,
    });
  }

  public withCustomRadius(radius: number): LiveCanvasLabelViewSettings {
    return new LiveCanvasLabelViewSettings({
      radius: radius,
      customRadius: true,
      colorIndex: this.colorIndex,
      titleProperty: this.titleProperty,
      customTitleProperty: this.customTitleProperty,
    });
  }

  public withCustomTitleProperty(
    titleProperty: string,
  ): LiveCanvasLabelViewSettings {
    return new LiveCanvasLabelViewSettings({
      radius: this.radius,
      customRadius: this.customRadius,
      colorIndex: this.colorIndex,
      titleProperty: titleProperty,
      customTitleProperty: true,
    });
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
      titleProperty: this._titleProperty,
      customTitleProperty: this._customTitleProperty,
    };
  }

  public toSchema(label: string): LiveCanvasLabelViewSettingsDto {
    return {
      label: label,
      colorIndex: this._colorIndex,
      customRadius: this._customRadius,
      radius: this._radius,
      titleProperty: this._titleProperty,
      customTitleProperty: this._customTitleProperty,
    } satisfies LiveCanvasLabelViewSettingsDto;
  }
}
