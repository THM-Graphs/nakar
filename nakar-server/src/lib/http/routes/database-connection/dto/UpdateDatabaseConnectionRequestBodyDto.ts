import { BadRequestException } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiProperty,
  getSchemaPath,
  refs,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import type { TypeHelpOptions } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsObject,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { DatabaseConnectionAdapterBaseDto } from './adapters/DatabaseConnectionAdapterBaseDto';
import { Neo4jDatabaseConnectionAdapterDto } from './adapters/Neo4jDatabaseConnectionAdapterDto';
import { RamenDatabaseConnectionAdapterDto } from './adapters/RamenDatabaseConnectionAdapterDto';
import { SparqlDatabaseConnectionAdapterDto } from './adapters/SparqlDatabaseConnectionAdapterDto';
import { WikidataDatabaseConnectionAdapterDto } from './adapters/WikidataDatabaseConnectionAdapterDto';
import { DatabaseConnectionDatabaseType } from './DatabaseConnectionDatabaseType';
import { UpdateNodeConfigurationRequestBodyDto } from './UpdateNodeConfigurationRequestBodyDto';

@ApiExtraModels(
  Neo4jDatabaseConnectionAdapterDto,
  RamenDatabaseConnectionAdapterDto,
  SparqlDatabaseConnectionAdapterDto,
  WikidataDatabaseConnectionAdapterDto,
)
export class UpdateDatabaseConnectionRequestBodyDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  public title!: string;

  @ApiProperty()
  @IsString()
  public browserUrl!: string;

  @ApiProperty()
  @IsBoolean()
  public credentialStoreConsent!: boolean;

  @ApiProperty({ type: UpdateNodeConfigurationRequestBodyDto, isArray: true })
  @ValidateNested({ each: true })
  @Type(
    (): typeof UpdateNodeConfigurationRequestBodyDto =>
      UpdateNodeConfigurationRequestBodyDto,
  )
  @IsArray()
  public nodeConfigurations!: UpdateNodeConfigurationRequestBodyDto[];

  @ApiProperty({
    oneOf: refs(
      Neo4jDatabaseConnectionAdapterDto,
      RamenDatabaseConnectionAdapterDto,
      SparqlDatabaseConnectionAdapterDto,
      WikidataDatabaseConnectionAdapterDto,
    ),
    discriminator: {
      propertyName: 'databaseType',
      mapping: {
        neo4j: getSchemaPath(Neo4jDatabaseConnectionAdapterDto),
        ramen: getSchemaPath(RamenDatabaseConnectionAdapterDto),
        sparql: getSchemaPath(SparqlDatabaseConnectionAdapterDto),
        wikidata: getSchemaPath(WikidataDatabaseConnectionAdapterDto),
      } satisfies Record<DatabaseConnectionDatabaseType, string>,
    },
  })
  @IsObject()
  @ValidateNested()
  @Type(
    (options?: TypeHelpOptions): typeof DatabaseConnectionAdapterBaseDto => {
      const body: Record<string, unknown> | undefined = options?.object;
      // class-transformer reads array item discriminators before @IsObject() runs.
      if (Array.isArray(body?.['adapter'])) {
        throw new BadRequestException(['adapter must be an object']);
      }
      return DatabaseConnectionAdapterBaseDto;
    },
    {
      discriminator: {
        property: 'databaseType',
        subTypes: [
          {
            name: DatabaseConnectionDatabaseType.neo4j,
            value: Neo4jDatabaseConnectionAdapterDto,
          },
          {
            name: DatabaseConnectionDatabaseType.ramen,
            value: RamenDatabaseConnectionAdapterDto,
          },
          {
            name: DatabaseConnectionDatabaseType.sparql,
            value: SparqlDatabaseConnectionAdapterDto,
          },
          {
            name: DatabaseConnectionDatabaseType.wikidata,
            value: WikidataDatabaseConnectionAdapterDto,
          },
        ],
      },
      keepDiscriminatorProperty: true,
    },
  )
  public adapter!:
    | Neo4jDatabaseConnectionAdapterDto
    | RamenDatabaseConnectionAdapterDto
    | SparqlDatabaseConnectionAdapterDto
    | WikidataDatabaseConnectionAdapterDto;
}
