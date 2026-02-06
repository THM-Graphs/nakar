import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class LayoutSpecificationCircleDto {
  @ApiProperty({ enum: ['LayoutSpecificationCircleDto'] })
  @IsString()
  public type!: 'LayoutSpecificationCircleDto';

  @ApiProperty({ type: Number })
  @IsNumber()
  public radius!: number;
}
