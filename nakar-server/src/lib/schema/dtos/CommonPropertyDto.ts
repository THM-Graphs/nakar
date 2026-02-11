import { DatabaseConnectionDto } from './DatabaseConnectionDto';
import { ApiProperty } from '@nestjs/swagger';

export class CommonPropertyDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public leftLabel: string;

  @ApiProperty()
  public leftProperty: string;

  @ApiProperty()
  public rightLabel: string;

  @ApiProperty()
  public rightProperty: string;

  @ApiProperty({ type: DatabaseConnectionDto, nullable: true })
  public leftDatabase: DatabaseConnectionDto | null;

  @ApiProperty({ type: DatabaseConnectionDto, nullable: true })
  public rightDatabase: DatabaseConnectionDto | null;

  public constructor(data: {
    id: string;
    leftLabel: string;
    leftProperty: string;
    rightLabel: string;
    rightProperty: string;
    leftDatabase: DatabaseConnectionDto | null;
    rightDatabase: DatabaseConnectionDto | null;
  }) {
    this.id = data.id;
    this.leftLabel = data.leftLabel;
    this.leftProperty = data.leftProperty;
    this.rightLabel = data.rightLabel;
    this.rightProperty = data.rightProperty;
    this.leftDatabase = data.leftDatabase;
    this.rightDatabase = data.rightDatabase;
  }
}
