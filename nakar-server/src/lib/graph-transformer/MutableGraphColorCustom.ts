import { MutableGraphColor } from './MutableGraphColor';
import { SchemaCustomColor } from '../../../src-gen/schema';

export class MutableGraphColorCustom extends MutableGraphColor {
  public readonly backgroundColor: string;
  public readonly textColor: string;

  public constructor(data: { backgroundColor: string; textColor: string }) {
    super();
    this.backgroundColor = data.backgroundColor;
    this.textColor = data.textColor;
  }

  public toDto(): SchemaCustomColor {
    return {
      backgroundColor: this.backgroundColor,
      textColor: this.textColor,
      type: 'CustomColor',
    };
  }
}
