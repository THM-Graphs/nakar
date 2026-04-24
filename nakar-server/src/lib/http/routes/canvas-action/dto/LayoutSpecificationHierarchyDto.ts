import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LayoutSpecificationHierarchyDto {
  @ApiProperty({ enum: ['LayoutSpecificationHierarchyDto'] })
  @IsString()
  public type!: 'LayoutSpecificationHierarchyDto';

  @ApiProperty({ type: String })
  @IsString()
  @MinLength(1)
  public edgeType!: string;
}
