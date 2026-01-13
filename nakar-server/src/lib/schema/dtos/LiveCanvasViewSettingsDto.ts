import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber } from 'class-validator';

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
}
