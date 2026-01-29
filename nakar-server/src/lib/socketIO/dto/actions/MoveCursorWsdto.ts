/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PositionDto } from '../../../schema/dtos/PositionDto';

export class MoveCursorWsdto {
  @ApiProperty({ enum: ['MoveCursorWsdto'] })
  @IsString()
  public type!: 'MoveCursorWsdto';

  @ApiProperty({ type: PositionDto })
  @ValidateNested()
  @Type(() => PositionDto)
  public position!: PositionDto;
}
