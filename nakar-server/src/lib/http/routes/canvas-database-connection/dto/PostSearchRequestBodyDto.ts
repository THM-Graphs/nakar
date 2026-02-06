import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PostSearchRequestBodyDto {
  @ApiProperty()
  @IsString()
  public searchTerm!: string;
}
