/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, ValidateNested } from 'class-validator';
import { PhysicalNodeDto } from '../types/PhysicalNodeDto';
import { Type } from 'class-transformer';

export class UngrabNodeWsdto {
  @ApiProperty({ enum: ['UngrabNodeWsdto'] })
  @IsString()
  public type!: 'UngrabNodeWsdto';

  @ApiProperty({ type: PhysicalNodeDto })
  @ValidateNested()
  @Type(() => PhysicalNodeDto)
  public node!: PhysicalNodeDto;
}
