import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PropertyDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  slug: string;

  @IsString()
  @ApiProperty()
  value: string;

  constructor(slug: string, value: string) {
    this.slug = slug;
    this.value = value;
  }
}
