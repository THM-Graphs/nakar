import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, MinLength } from 'class-validator';

export class LayoutSpecificationCircleDto {
  @ApiProperty({ enum: ['LayoutSpecificationCircleDto'] })
  @IsString()
  public type!: 'LayoutSpecificationCircleDto';

  @ApiProperty({ type: Number })
  @IsNumber()
  public radius!: number;

  @ApiProperty({ type: String })
  @IsString()
  @MinLength(1)
  public label!: string;
}
