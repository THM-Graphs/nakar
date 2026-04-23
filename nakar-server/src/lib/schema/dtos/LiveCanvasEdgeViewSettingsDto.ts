/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { LiveCanvasEdgeViewSettingsColorIndexDto } from './LiveCanvasEdgeViewSettingsColorIndexDto';

export class LiveCanvasEdgeViewSettingsDto {
  @ApiProperty({ type: String })
  @IsString()
  public edgeType!: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  @Min(0)
  public width!: number;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  public customWidth!: boolean;

  @ApiProperty({ enum: [0, 1, 2, 3, 4, 5], type: Number })
  @Type((): Function => Number)
  @IsEnum(LiveCanvasEdgeViewSettingsColorIndexDto)
  @IsNumber()
  public colorIndex!: LiveCanvasEdgeViewSettingsColorIndexDto;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  public customColor!: boolean;
}
