import { IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyDto } from './PropertyDto';
import { ApiProperty } from '@nestjs/swagger';

export class EdgeDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  public id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  public startNodeId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  public endNodeId: string;

  @IsString()
  @ApiProperty()
  public type: string;

  @Type(() => PropertyDto)
  @ApiProperty({ type: PropertyDto, isArray: true })
  public properties: PropertyDto[];

  constructor(
    id: string,
    startNodeId: string,
    endNodeId: string,
    type: string,
    properties: PropertyDto[],
  ) {
    this.id = id;
    this.startNodeId = startNodeId;
    this.endNodeId = endNodeId;
    this.type = type;
    this.properties = properties;
  }
}
