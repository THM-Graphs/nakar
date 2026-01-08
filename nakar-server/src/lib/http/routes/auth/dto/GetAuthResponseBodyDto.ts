import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetAuthResponseBodyDto {
  @ApiProperty()
  @IsString()
  public username: string;

  public constructor(data: { username: string }) {
    this.username = data.username;
  }
}
