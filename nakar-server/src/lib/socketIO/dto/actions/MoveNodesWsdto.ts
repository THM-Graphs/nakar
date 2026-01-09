/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PhysicalNodeWsdto } from '../types/PhysicalNodeWsdto';

export class MoveNodesWsdto {
  @ApiProperty({ enum: ['MoveNodesWsdto'] })
  @IsString()
  public type!: 'MoveNodesWsdto';

  @ApiProperty({ type: PhysicalNodeWsdto, isArray: true })
  @ValidateNested()
  @Type(() => PhysicalNodeWsdto)
  @IsArray()
  public nodes!: PhysicalNodeWsdto[];
}
