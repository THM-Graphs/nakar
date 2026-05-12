import { ApiProperty } from '@nestjs/swagger';
import { Equals, IsEnum } from 'class-validator';
import { ColorPresetIndexDto } from '../../../../schema/dtos/ColorPresetIndexDto';

export class UpdateScenarioPostActionColorPresetDto {
  @ApiProperty({ enum: ['ColorPresetDto'] })
  @Equals('ColorPresetDto')
  public type!: 'ColorPresetDto';

  @ApiProperty({ enum: ColorPresetIndexDto })
  @IsEnum(ColorPresetIndexDto)
  public index!: ColorPresetIndexDto;
}
