import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PostAuthRequestBodyDto {
  @ApiProperty()
  @IsString()
  public username!: string;

  @ApiProperty()
  @IsString()
  public password!: string;
}
