import { ColorPresetIndexDto } from './ColorPresetIndexDto';
import { ApiProperty } from '@nestjs/swagger';

export class ColorPresetDto {
  @ApiProperty({ enum: ColorPresetIndexDto })
  public index: ColorPresetIndexDto;

  public constructor(data: { index: ColorPresetIndexDto }) {
    this.index = data.index;
  }
}
