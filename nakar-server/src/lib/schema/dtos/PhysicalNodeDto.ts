import { ApiProperty } from '@nestjs/swagger';
import { IsString, ValidateNested } from 'class-validator';
import { PositionDto } from './PositionDto';
import { Type } from 'class-transformer';

export class PhysicalNodeDto {
  @ApiProperty()
  @IsString()
  public id!: string;

  @ApiProperty({ type: PositionDto })
  @ValidateNested()
  @Type((): typeof PositionDto => PositionDto)
  public position!: PositionDto;
}
