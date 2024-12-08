import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ScenarioDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty()
  @IsString()
  title: string;

  constructor(slug: string, title: string) {
    this.slug = slug;
    this.title = title;
  }
}
