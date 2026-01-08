import { ElementColor } from './ElementColor';
import { SchemaCustomColor } from '../../../../../src-gen/schema';
import z from 'zod';

export class ElementColorCustom extends ElementColor {
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

  public toPlain(): z.infer<typeof ElementColor.schema> {
    return {
      type: 'custom',
      backgroundColor: this.backgroundColor,
      textColor: this.textColor,
    };
  }
}
