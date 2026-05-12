import { ColorPresetIndexDto } from './ColorPresetIndexDto';
import { ApiProperty } from '@nestjs/swagger';
import { Equals, IsEnum } from 'class-validator';

export class ColorPresetDto {
  @ApiProperty({ enum: ['ColorPresetDto'] })
  @Equals('ColorPresetDto')
  public type: 'ColorPresetDto';

  @ApiProperty({ enum: ColorPresetIndexDto })
  @IsEnum(ColorPresetIndexDto)
  public index: ColorPresetIndexDto;

  public constructor(data: { index: ColorPresetIndexDto }) {
    this.type = 'ColorPresetDto';
    this.index = data.index;
  }
}
