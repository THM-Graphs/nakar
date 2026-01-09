/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, ValidateNested } from 'class-validator';
import { PhysicalNodeWsdto } from '../types/PhysicalNodeWsdto';
import { Type } from 'class-transformer';

export class UngrabNodeWsdto {
  @ApiProperty({ enum: ['UngrabNodeWsdto'] })
  @IsString()
  public type!: 'UngrabNodeWsdto';

  @ApiProperty({ type: PhysicalNodeWsdto })
  @ValidateNested()
  @Type(() => PhysicalNodeWsdto)
  public node!: PhysicalNodeWsdto;
}
