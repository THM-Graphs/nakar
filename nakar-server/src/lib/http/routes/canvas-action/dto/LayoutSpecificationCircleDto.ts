import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString } from 'class-validator';

export class LayoutSpecificationCircleDto {
  @ApiProperty({ enum: ['LayoutSpecificationCircleDto'] })
  @IsString()
  public type!: 'LayoutSpecificationCircleDto';

  @ApiProperty({ type: Number })
  @IsNumber()
  public radius!: number;

  @ApiProperty({ isArray: true, type: String })
  @IsArray()
  @IsString({ each: true })
  public nodeIds!: string[];
}
