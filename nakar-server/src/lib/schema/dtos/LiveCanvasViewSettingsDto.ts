/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { LiveCanvasLabelViewSettingsDto } from './LiveCanvasLabelViewSettingsDto';

export class LiveCanvasViewSettingsDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  public compressRelationshipsWidthFactor!: number;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  public growNodesBasedOnDegree!: boolean;

  @ApiProperty({ type: Number })
  @IsNumber()
  public growNodesBasedOnDegreeFactor!: number;

  @ApiProperty({ type: LiveCanvasLabelViewSettingsDto, isArray: true })
  @ValidateNested()
  @IsArray()
  @Type((): Function => LiveCanvasLabelViewSettingsDto)
  public labelSettings!: LiveCanvasLabelViewSettingsDto[];
}
