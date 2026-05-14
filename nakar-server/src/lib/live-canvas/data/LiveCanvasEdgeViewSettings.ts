import { match } from 'ts-pattern';
import z from 'zod';
import { GraphEdge } from '../graph/GraphEdge';
import { LiveCanvasEdgeViewSettingsDto } from '../../schema/dtos/LiveCanvasEdgeViewSettingsDto';

export class LiveCanvasEdgeViewSettings {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    width: z.number().optional(),
    customWidth: z.boolean().optional(),
    colorIndex: z.enum(['0', '1', '2', '3', '4', '5']).optional(),
    customColor: z.boolean().optional(),
  });

  private _width: number;
  private _customWidth: boolean;
  private _colorIndex: LiveCanvasEdgeViewSettings['colorIndex'];
  private _customColor: boolean;

  public constructor(data: {
    width: number;
    customWidth: boolean;
    colorIndex: LiveCanvasEdgeViewSettings['colorIndex'];
    customColor: boolean;
  }) {
    this._width = data.width;
    this._customWidth = data.customWidth;
    this._colorIndex = data.colorIndex;
    this._customColor = data.customColor;
  }

  public get width(): number {
    return this._width;
  }

  public get customWidth(): boolean {
    return this._customWidth;
  }

  public get colorIndex(): 0 | 1 | 2 | 3 | 4 | 5 {
    return this._colorIndex;
  }

  public get customColor(): boolean {
    return this._customColor;
  }

  public static fromPlain(
    data: z.infer<typeof LiveCanvasEdgeViewSettings.schema>,
  ): LiveCanvasEdgeViewSettings {
    return new LiveCanvasEdgeViewSettings({
      width: data.width ?? GraphEdge.defaultWidth,
      customWidth: data.customWidth ?? false,
      colorIndex: match(data.colorIndex ?? '0')
        .with('0', (): LiveCanvasEdgeViewSettings['colorIndex'] => 0)
        .with('1', (): LiveCanvasEdgeViewSettings['colorIndex'] => 1)
        .with('2', (): LiveCanvasEdgeViewSettings['colorIndex'] => 2)
        .with('3', (): LiveCanvasEdgeViewSettings['colorIndex'] => 3)
        .with('4', (): LiveCanvasEdgeViewSettings['colorIndex'] => 4)
        .with('5', (): LiveCanvasEdgeViewSettings['colorIndex'] => 5)
        .exhaustive(),
      customColor: data.customColor ?? false,
    });
  }

  public static fromSchema(
    input: LiveCanvasEdgeViewSettingsDto,
  ): LiveCanvasEdgeViewSettings {
    return new LiveCanvasEdgeViewSettings({
      width: input.width,
      customWidth: input.customWidth,
      colorIndex: input.colorIndex,
      customColor: input.customColor,
    });
  }

  public setCustomWidth(width: number): void {
    this._width = width;
    this._customWidth = true;
  }

  public setCustomColorIndex(
    colorIndex: LiveCanvasEdgeViewSettings['colorIndex'],
  ): void {
    this._colorIndex = colorIndex;
    this._customColor = true;
  }

  public toPlain(): z.infer<typeof LiveCanvasEdgeViewSettings.schema> {
    return {
      width: this.width,
      customWidth: this.customWidth,
      colorIndex: match(this.colorIndex)
        .with(
          0,
          (): z.infer<typeof LiveCanvasEdgeViewSettings.schema>['colorIndex'] =>
            '0',
        )
        .with(
          1,
          (): z.infer<typeof LiveCanvasEdgeViewSettings.schema>['colorIndex'] =>
            '1',
        )
        .with(
          2,
          (): z.infer<typeof LiveCanvasEdgeViewSettings.schema>['colorIndex'] =>
            '2',
        )
        .with(
          3,
          (): z.infer<typeof LiveCanvasEdgeViewSettings.schema>['colorIndex'] =>
            '3',
        )
        .with(
          4,
          (): z.infer<typeof LiveCanvasEdgeViewSettings.schema>['colorIndex'] =>
            '4',
        )
        .with(
          5,
          (): z.infer<typeof LiveCanvasEdgeViewSettings.schema>['colorIndex'] =>
            '5',
        )
        .exhaustive(),
      customColor: this.customColor,
    };
  }

  public toSchema(edgeType: string): LiveCanvasEdgeViewSettingsDto {
    return {
      edgeType: edgeType,
      width: this.width,
      customWidth: this.customWidth,
      colorIndex: this.colorIndex,
      customColor: this.customColor,
    } satisfies LiveCanvasEdgeViewSettingsDto;
  }
}
