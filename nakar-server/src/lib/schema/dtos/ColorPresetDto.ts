import { ColorPresetIndexDto } from './ColorPresetIndexDto';
import { ApiProperty } from '@nestjs/swagger';

export class ColorPresetDto {
  @ApiProperty({ enum: ['ColorPresetDto'] })
  public type: 'ColorPresetDto';

  @ApiProperty({ enum: ColorPresetIndexDto })
  public index: ColorPresetIndexDto;

  public constructor(data: { index: ColorPresetIndexDto }) {
    this.type = 'ColorPresetDto';
    this.index = data.index;
  }
}
