import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LayoutSpecificationForceDirectedDto {
  @ApiProperty({ enum: ['LayoutSpecificationForceDirectedDto'] })
  @IsString()
  public type!: 'LayoutSpecificationForceDirectedDto';
}
