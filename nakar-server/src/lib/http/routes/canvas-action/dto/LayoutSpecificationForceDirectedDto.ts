import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LayoutSpecificationForceDirectedDto {
  @ApiProperty({ enum: ['LayoutSpecificationForceDirectedDto'] })
  @IsString()
  public type!: 'LayoutSpecificationForceDirectedDto';

  @ApiProperty({ type: String })
  @IsString()
  @MinLength(1)
  public label!: string;
}
