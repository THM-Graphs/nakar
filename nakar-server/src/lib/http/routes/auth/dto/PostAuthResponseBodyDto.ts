import { ApiProperty } from '@nestjs/swagger';

export class PostAuthResponseBodyDto {
  @ApiProperty()
  public jwt: string;

  @ApiProperty()
  public username: string;

  public constructor(data: { jwt: string; username: string }) {
    this.jwt = data.jwt;
    this.username = data.username;
  }
}
