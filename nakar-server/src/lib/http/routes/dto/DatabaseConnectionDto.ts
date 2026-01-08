import { ApiProperty } from '@nestjs/swagger';

export class DatabaseConnectionDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public title: string;

  @ApiProperty()
  public browserUrl: string;

  @ApiProperty()
  public connectionUrl: string;

  public constructor(data: {
    id: string;
    title: string;
    browserUrl: string;
    connectionUrl: string;
  }) {
    this.id = data.id;
    this.title = data.title;
    this.browserUrl = data.browserUrl;
    this.connectionUrl = data.connectionUrl;
  }
}
