import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ScenarioDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty()
  @IsString()
  title: string;

  constructor(id: number, title: string) {
    this.id = id;
    this.title = title;
  }
}
