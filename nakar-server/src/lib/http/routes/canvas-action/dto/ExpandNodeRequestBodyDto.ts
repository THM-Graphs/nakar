/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { ExpandNodeLimitDto } from './ExpandNodeLimitDto';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ExpandNodeRequestBodyDto {
  @ApiProperty({ isArray: true, type: String })
  @IsArray()
  @IsString({ each: true })
  public nodeIds!: string[];

  @ApiProperty({ type: ExpandNodeLimitDto, nullable: true })
  @ValidateNested()
  @Type(() => ExpandNodeLimitDto)
  @IsOptional()
  public limit!: ExpandNodeLimitDto | null;
}
