import { ColorPresetDto } from './ColorPresetDto';
import { ColorCustomDto } from './ColorCustomDto';
import { ApiExtraModels, ApiProperty, refs } from '@nestjs/swagger';

@ApiExtraModels(ColorPresetDto, ColorCustomDto)
export class ColorDto {
  @ApiProperty({
    oneOf: refs(ColorPresetDto, ColorCustomDto),
  })
  public color: ColorPresetDto | ColorCustomDto;

  public constructor(data: { color: ColorPresetDto | ColorCustomDto }) {
    this.color = data.color;
  }
}
