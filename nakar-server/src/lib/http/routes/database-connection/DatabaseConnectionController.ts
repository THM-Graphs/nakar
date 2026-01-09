import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GetDatabaseStatsResponseBodyDto } from './dto/GetDatabaseStatsResponseBodyDto';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { Neo4jDatabaseInfo } from '../../../neo4j/Neo4jDatabaseInfo';
import { DatabaseService } from '../../../database/DatabaseService';
import { Neo4jService } from '../../../neo4j/Neo4jService';
import { PostSearchResponseBodyDto } from './dto/PostSearchResponseBodyDto';
import { PostSearchRequestBodyDto } from './dto/PostSearchRequestBodyDto';
import { Neo4jNode } from '../../../neo4j/Neo4jNode';
import { LiveCanvasUndoableData } from '../../../room/data/LiveCanvasUndoableData';
import { ElementCreationReason } from '../../../room/graph/ElementCreationReason';
import { GraphNode } from '../../../room/graph/GraphNode';
import { NodePreviewDto } from '../../dto/NodePreviewDto';
import { GetSearchCapabilitiesResponseBodyDto } from './dto/GetSearchCapabilitiesResponseBodyDto';
import { Neo4jSearchCapabilities } from '../../../neo4j/Neo4jSearchCapabilities';
import { SSet } from '../../../set/Set';
import { SearchCapabilitiesEntryDto } from './dto/SearchCapabilitiesEntryDto';
import { UserCanAccessRoom } from '../../guards/UserCanAccessRoom';
import { DatabaseBelongsToRoom } from '../../guards/DatabaseBelongsToRoom';
import { ExpandNodePreview } from '../../../neo4j/expand-node-preview/ExpandNodePreview';
import { ExpandNodePreviewRequestQueryDto } from './dto/ExpandNodePreviewRequestQueryDto';
import { ExpandNodePreviewResponseBodyDto } from './dto/ExpandNodePreviewResponseBodyDto';
import { ExpandNodePreviewEntryDto } from './dto/ExpandNodePreviewEntryDto';
import { ExpandNodePreviewEntry } from '../../../neo4j/expand-node-preview/ExpandNodePreviewEntry';

@Controller('room/:roomId/database-connection')
@ApiParam({
  name: 'roomId',
  required: true,
  type: 'string',
})
export class DatabaseConnectionController {
  // TODO: Check if user can access db by putting this route behind room

  public constructor(
    private readonly _database: DatabaseService,
    private readonly _neo4jService: Neo4jService,
  ) {}

  @Get(':databaseId/stats')
  @ApiResponse({ type: GetDatabaseStatsResponseBodyDto })
  @UseGuards(UserCanAccessRoom)
  @UseGuards(DatabaseBelongsToRoom)
  public async getStats(
    @Param('databaseId') databaseId: string,
  ): Promise<GetDatabaseStatsResponseBodyDto> {
    const database: Result<'api::v2-database-connection.v2-database-connection'> =
      await this._database.getDatabase(databaseId);
    const credentials: Neo4jDatabaseInfo = Neo4jDatabaseInfo.parse(database);
    const stats: GetDatabaseStatsResponseBodyDto =
      await this._neo4jService.getStats({
        credentials: credentials,
      });

    return stats;
  }

  @Post(':databaseId/search')
  @HttpCode(200)
  @ApiResponse({ type: PostSearchResponseBodyDto })
  @UseGuards(UserCanAccessRoom)
  @UseGuards(DatabaseBelongsToRoom)
  public async performSearch(
    @Param('databaseId') databaseId: string,
    @Body() body: PostSearchRequestBodyDto,
  ): Promise<PostSearchResponseBodyDto> {
    const database: Result<'api::v2-database-connection.v2-database-connection'> =
      await this._database.getDatabase(databaseId);
    const credentials: Neo4jDatabaseInfo = Neo4jDatabaseInfo.parse(database);

    const searchTerm: string = body.searchTerm;

    const result: Neo4jNode[] = await this._neo4jService.search({
      searchTerm: searchTerm,
      credentials: credentials,
    });

    const graph: LiveCanvasUndoableData = LiveCanvasUndoableData.empty();
    for (const node of result) {
      graph.nodes.addNeo4jNode(node, ElementCreationReason.search);
    }

    return {
      nodes: graph.nodes.nodes
        .toArray()
        .map((node: GraphNode): NodePreviewDto => {
          return {
            id: node.id,
            title: node.getTitle(),
            labels: node.labels.toArray(),
            customColor: null, // TODO
          } satisfies NodePreviewDto;
        }),
    };
  }

  @Get(':databaseId/search-capabilities')
  @ApiResponse({ type: GetSearchCapabilitiesResponseBodyDto })
  @UseGuards(UserCanAccessRoom)
  @UseGuards(DatabaseBelongsToRoom)
  public async getSearchCapabilites(
    @Param('databaseId') databaseId: string,
  ): Promise<GetSearchCapabilitiesResponseBodyDto> {
    const database: Result<'api::v2-database-connection.v2-database-connection'> =
      await this._database.getDatabase(databaseId);
    const credentials: Neo4jDatabaseInfo = Neo4jDatabaseInfo.parse(database);

    const capabilities: Neo4jSearchCapabilities =
      await this._neo4jService.getSearchCapabilities({
        credentials: credentials,
      });

    return new GetSearchCapabilitiesResponseBodyDto({
      canExactMatchElementId: capabilities.canExactMatchElementId,
      canExactMatchLabel: capabilities.canExactMatchLabel,
      exactMatchNodeProperties: capabilities.exactMatchNodeProperties.reduce(
        (
          result: SearchCapabilitiesEntryDto[],
          label: string,
          propertyList: SSet<string>,
        ): SearchCapabilitiesEntryDto[] => {
          return [
            ...result,
            ...propertyList.reduce(
              (
                properties: SearchCapabilitiesEntryDto[],
                property: string,
              ): SearchCapabilitiesEntryDto[] => [
                ...properties,
                { property: property, label: label },
              ],
              [],
            ),
          ];
        },
        [],
      ),
      fuzzyMatchNodeProperties: capabilities.fuzzyMatchNodeProperties.reduce(
        (
          result: SearchCapabilitiesEntryDto[],
          label: string,
          propertyList: SSet<string>,
        ): SearchCapabilitiesEntryDto[] => {
          return [
            ...result,
            ...propertyList.reduce(
              (
                properties: SearchCapabilitiesEntryDto[],
                property: string,
              ): SearchCapabilitiesEntryDto[] => [
                ...properties,
                { property: property, label: label },
              ],
              [],
            ),
          ];
        },
        [],
      ),
    });
  }

  @Get(':databaseId/expand-node-preview')
  @UseGuards(UserCanAccessRoom)
  @UseGuards(DatabaseBelongsToRoom)
  @ApiResponse({ type: ExpandNodePreviewResponseBodyDto })
  public async expandNodePreview(
    @Query() query: ExpandNodePreviewRequestQueryDto,
    @Param('databaseId') databaseId: string,
  ): Promise<ExpandNodePreviewResponseBodyDto> {
    const database: Result<'api::v2-database-connection.v2-database-connection'> =
      await this._database.getDatabase(databaseId);

    const neo4jDatabaseInfo: Neo4jDatabaseInfo =
      Neo4jDatabaseInfo.parse(database);

    const expandNodePreview: ExpandNodePreview =
      await this._neo4jService.expandNodePreview(
        neo4jDatabaseInfo,
        new SSet<string>([query.nodeId]),
      );

    return new ExpandNodePreviewResponseBodyDto({
      labels: expandNodePreview.labels.map(
        (l: ExpandNodePreviewEntry): ExpandNodePreviewEntryDto =>
          new ExpandNodePreviewEntryDto({
            identificator: l.identificator,
            count: l.count,
          }),
      ),
      relationships: expandNodePreview.relationships.map(
        (l: ExpandNodePreviewEntry): ExpandNodePreviewEntryDto =>
          new ExpandNodePreviewEntryDto({
            identificator: l.identificator,
            count: l.count,
          }),
      ),
    });
  }
}
