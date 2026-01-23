import { GraphNode } from '../graph/GraphNode';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { match, P } from 'ts-pattern';
import { Input } from '@strapi/types/dist/modules/documents/params/data';
import { LiveCanvasLabelViewSettingsDto } from '../../schema/dtos/LiveCanvasLabelViewSettingsDto';

export class LiveCanvasLabelViewSettings {
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

  public static fromDb(
    db: Result<'api::canvas-label-setting.canvas-label-setting'>,
  ): LiveCanvasLabelViewSettings {
    return new LiveCanvasLabelViewSettings({
      radius: db.radius ?? GraphNode.defaultRadius,
      customRadius: db.customRadius ?? false,
      colorIndex: match(db.colorIndex)
        .returnType<LiveCanvasLabelViewSettings['colorIndex']>()
        .with('color0', (): 0 => 0)
        .with('color1', (): 1 => 1)
        .with('color2', (): 2 => 2)
        .with('color3', (): 3 => 3)
        .with('color4', (): 4 => 4)
        .with('color5', (): 5 => 5)
        .with(P.nullish, (): 0 => 0)
        .exhaustive(),
      customColorIndex: db.customColorIndex ?? false,
    });
  }

  public dbData(): Input<'api::canvas-label-setting.canvas-label-setting'> {
    return {
      radius: this._radius,
      customRadius: this._customRadius,
      colorIndex: match(this._colorIndex)
        .returnType<
          Input<'api::canvas-label-setting.canvas-label-setting'>['colorIndex']
        >()
        .with(0, (): 'color0' => 'color0')
        .with(1, (): 'color1' => 'color1')
        .with(2, (): 'color2' => 'color2')
        .with(3, (): 'color3' => 'color3')
        .with(4, (): 'color4' => 'color4')
        .with(5, (): 'color5' => 'color5')
        .exhaustive(),
      customColorIndex: this._customColorIndex,
    };
  }

  public getComputedRadius(): number {
    if (this._customRadius) {
      return this._radius;
    } else {
      return GraphNode.defaultRadius;
    }
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
}
