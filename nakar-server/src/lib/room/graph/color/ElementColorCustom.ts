import { ElementColor } from './ElementColor';
import z from 'zod';
import { ColorDto } from '../../../http/dto/ColorDto';

export class ElementColorCustom extends ElementColor {
  public readonly backgroundColor: string;
  public readonly textColor: string;

  public constructor(data: { backgroundColor: string; textColor: string }) {
    super();
    this.backgroundColor = data.backgroundColor;
    this.textColor = data.textColor;
  }

  public toDto(): ColorDto {
    return {
      color: {
        backgroundColor: this.backgroundColor,
        textColor: this.textColor,
        type: 'ColorCustomDto',
      },
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
