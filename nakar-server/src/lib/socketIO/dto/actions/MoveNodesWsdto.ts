/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PhysicalNodeDto } from '../types/PhysicalNodeDto';

export class MoveNodesWsdto {
  @ApiProperty({ enum: ['MoveNodesWsdto'] })
  @IsString()
  public type!: 'MoveNodesWsdto';

  @ApiProperty({ type: PhysicalNodeDto, isArray: true })
  @ValidateNested()
  @Type(() => PhysicalNodeDto)
  @IsArray()
  public nodes!: PhysicalNodeDto[];
}
