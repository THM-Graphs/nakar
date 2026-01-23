/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { LiveCanvasLabelViewSettingsColorIndexDto } from './LiveCanvasLabelViewSettingsColorIndexDto';

export class LiveCanvasLabelViewSettingsDto {
  @ApiProperty({ type: String })
  @IsString()
  public label!: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  @Min(5)
  public radius!: number;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  public customRadius!: boolean;

  @ApiProperty({ enum: [0, 1, 2, 3, 4, 5], type: Number })
  @Type((): Function => Number)
  @IsEnum(LiveCanvasLabelViewSettingsColorIndexDto)
  @IsNumber()
  public colorIndex!: LiveCanvasLabelViewSettingsColorIndexDto;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  public customColorIndex!: boolean;
}
