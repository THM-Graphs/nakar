import { ApiProperty } from '@nestjs/swagger';
import { NodeConfigurationDto } from './NodeConfigurationDto';

export class DatabaseConnectionDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public title: string;

  @ApiProperty()
  public browserUrl: string;

  @ApiProperty()
  public connectionUrl: string;

  @ApiProperty()
  public database: string;

  @ApiProperty({ type: NodeConfigurationDto, isArray: true })
  public nodeConfigurations: NodeConfigurationDto[];

  public constructor(data: {
    id: string;
    title: string;
    browserUrl: string;
    connectionUrl: string;
    database: string;
    nodeConfigurations: NodeConfigurationDto[];
  }) {
    this.id = data.id;
    this.title = data.title;
    this.browserUrl = data.browserUrl;
    this.connectionUrl = data.connectionUrl;
    this.database = data.database;
    this.nodeConfigurations = data.nodeConfigurations;
  }
}
