import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class PhysicalNodeWsdto {
  @ApiProperty()
  @IsString()
  public id!: string;

  @ApiProperty()
  @IsNumber()
  public positionX!: number;

  @ApiProperty()
  @IsNumber()
  public positionY!: number;
}
