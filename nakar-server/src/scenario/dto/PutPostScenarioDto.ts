import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class PutPostScenarioDto {
  @ApiProperty({ example: 'Common blobs of nodes' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'MATCH ...' })
  @IsString()
  query!: string;

  @ApiProperty({ example: 3762 })
  @IsNumber()
  databaseDefinitionId!: number;
}
