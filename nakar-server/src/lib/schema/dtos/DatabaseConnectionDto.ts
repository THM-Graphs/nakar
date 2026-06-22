import { ApiProperty } from '@nestjs/swagger';
import { NodeConfigurationDto } from './NodeConfigurationDto';
import { DatabaseConnectionDatabaseType } from '../../http/routes/database-connection/dto/DatabaseConnectionDatabaseType';
import { IsEnum } from 'class-validator';

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

  @ApiProperty({ enum: DatabaseConnectionDatabaseType })
  public databaseType: DatabaseConnectionDatabaseType;

  public constructor(data: {
    id: string;
    title: string;
    browserUrl: string;
    connectionUrl: string;
    database: string;
    nodeConfigurations: NodeConfigurationDto[];
    databaseType: DatabaseConnectionDatabaseType;
  }) {
    this.id = data.id;
    this.title = data.title;
    this.browserUrl = data.browserUrl;
    this.connectionUrl = data.connectionUrl;
    this.database = data.database;
    this.nodeConfigurations = data.nodeConfigurations;
    this.databaseType = data.databaseType;
  }
}
