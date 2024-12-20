import { IsNotEmpty, IsString } from 'class-validator';
import { PropertyDto } from './PropertyDto';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class NodeDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  public id: string;

  @IsString()
  @ApiProperty()
  public displayTitle: string;

  @IsString()
  @ApiProperty()
  public type: string;

  @Type(() => PropertyDto)
  @ApiProperty({ type: PropertyDto, isArray: true })
  public properties: PropertyDto[];

  constructor(
    id: string,
    displayTitle: string,
    type: string,
    properties: PropertyDto[],
  ) {
    this.id = id;
    this.displayTitle = displayTitle;
    this.type = type;
    this.properties = properties;
  }
}
