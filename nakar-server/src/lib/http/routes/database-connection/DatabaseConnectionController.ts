import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { GetDatabaseStatsResponseBodyDto } from './dto/GetDatabaseStatsResponseBodyDto';
import { ApiResponse } from '@nestjs/swagger';
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

@Controller('database-connection')
export class DatabaseConnectionController {
  // TODO: Check if user can access db by putting this route behind room

  public constructor(
    private readonly _database: DatabaseService,
    private readonly _neo4jService: Neo4jService,
  ) {}

  @Get(':id/stats')
  @ApiResponse({ type: GetDatabaseStatsResponseBodyDto })
  public async getStats(
    @Param('id') id: string,
  ): Promise<GetDatabaseStatsResponseBodyDto> {
    const database: Result<'api::v2-database-connection.v2-database-connection'> =
      await this._database.getDatabase(id);
    const credentials: Neo4jDatabaseInfo = Neo4jDatabaseInfo.parse(database);
    const stats: GetDatabaseStatsResponseBodyDto =
      await this._neo4jService.getStats({
        credentials: credentials,
      });

    return stats;
  }

  @Post(':id/search')
  @HttpCode(200)
  @ApiResponse({ type: PostSearchResponseBodyDto })
  public async performSearch(
    @Param('id') id: string,
    @Body() body: PostSearchRequestBodyDto,
  ): Promise<PostSearchResponseBodyDto> {
    const database: Result<'api::v2-database-connection.v2-database-connection'> =
      await this._database.getDatabase(id);
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

  @Get(':id/search-capabilities')
  @ApiResponse({ type: GetSearchCapabilitiesResponseBodyDto })
  public async getSearchCapabilites(
    @Param('id') id: string,
  ): Promise<GetSearchCapabilitiesResponseBodyDto> {
    const database: Result<'api::v2-database-connection.v2-database-connection'> =
      await this._database.getDatabase(id);
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
}
