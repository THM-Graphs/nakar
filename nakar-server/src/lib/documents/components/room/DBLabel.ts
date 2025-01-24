import { Input } from '@strapi/types/dist/modules/documents/params/data';
import { DBLabelType } from './DBLabelType';
import type { Result } from '@strapi/types/dist/modules/documents/result';
import { match, P } from 'ts-pattern';

export class DBLabel {
  public readonly label: string;
  public readonly count: number;
  public readonly customBackgroundColor: string;
  public readonly customTextColor: string;
  public readonly presetColorIndex: number;
  public readonly type: DBLabelType;

  public constructor(data: {
    label: string;
    count: number;
    customBackgroundColor: string;
    customTextColor: string;
    presetColorIndex: number;
    type: DBLabelType;
  }) {
    this.label = data.label;
    this.count = data.count;
    this.customBackgroundColor = data.customBackgroundColor;
    this.customTextColor = data.customTextColor;
    this.presetColorIndex = data.presetColorIndex;
    this.type = data.type;
  }

  public static parse(db: Result<'room.label'>): DBLabel {
    return new DBLabel({
      label: db.label ?? '',
      count: db.count ?? 0,
      customBackgroundColor: db.customBackgroundColor ?? '',
      customTextColor: db.customTextColor ?? '',
      presetColorIndex: db.presetColorIndex ?? 0,
      type: DBLabel._parseLabelType(db.type),
    });
  }

  private static _parseLabelType(
    input: 'PresetColor' | 'CustomColor' | null | undefined,
  ): DBLabelType {
    return match(input)
      .with(P.nullish, () => DBLabelType.presetColor)
      .with('PresetColor', () => DBLabelType.presetColor)
      .with('CustomColor', () => DBLabelType.customColor)
      .exhaustive();
  }

  public toDb(): Input<'room.label'> {
    return {
      label: this.label,
      count: this.count,
      customBackgroundColor: this.customBackgroundColor,
      customTextColor: this.customTextColor,
      presetColorIndex: this.presetColorIndex,
      type: this._labelTypeToDb(),
    };
  }

  private _labelTypeToDb(): 'CustomColor' | 'PresetColor' {
    return match(this.type)
      .returnType<'CustomColor' | 'PresetColor'>()
      .with(DBLabelType.customColor, () => 'CustomColor')
      .with(DBLabelType.presetColor, () => 'PresetColor')
      .exhaustive();
  }
}
