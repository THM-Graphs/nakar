import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { PositionDto } from './PositionDto';

export class PhysicalNodeDto {
  @ApiProperty()
  @IsString()
  public id!: string;

  @ApiProperty({ type: PositionDto })
  public position!: PositionDto;
}
