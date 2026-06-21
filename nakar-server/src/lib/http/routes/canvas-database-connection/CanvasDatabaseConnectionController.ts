import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GetDatabaseStatsResponseBodyDto } from './dto/GetDatabaseStatsResponseBodyDto';
import { DatabaseStatsLabelDto } from './dto/DatabaseStatsLabelDto';
import { DatabaseStatsRelationshipDto } from './dto/DatabaseStatsRelationshipDto';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { DatabaseService } from '../../../database/DatabaseService';
import { PostSearchResponseBodyDto } from './dto/PostSearchResponseBodyDto';
import { PostSearchRequestBodyDto } from './dto/PostSearchRequestBodyDto';
import { LiveCanvasUndoableData } from '../../../live-canvas/data/LiveCanvasUndoableData';
import { ElementCreationReason } from '../../../live-canvas/graph/ElementCreationReason';
import { GraphNode } from '../../../live-canvas/graph/GraphNode';
import { NodePreviewDto } from '../../../schema/dtos/NodePreviewDto';
import { GetSearchCapabilitiesResponseBodyDto } from './dto/GetSearchCapabilitiesResponseBodyDto';
import { ExternalGraphDatabaseService } from '../../../external-database/ExternalGraphDatabaseService';
import type { ExternalGraphDatabaseStats } from '../../../external-database/data/ExternalGraphDatabaseStats';
import type { ExternalGraphDatabaseSearchCapabilities } from '../../../external-database/data/ExternalGraphDatabaseSearchCapabilities';
import type { ExternalGraphDatabaseNode } from '../../../external-database/data/ExternalGraphDatabaseNode';
import type { ExternalGraphDatabaseExpandNodePreview } from '../../../external-database/data/ExternalGraphDatabaseExpandNodePreview';
import type { ExternalGraphDatabaseExpandNodePreviewEntry } from '../../../external-database/data/ExternalGraphDatabaseExpandNodePreviewEntry';
import { SSet } from '../../../../packages/set/Set';
import { SearchCapabilitiesEntryDto } from './dto/SearchCapabilitiesEntryDto';
import { DatabaseBelongsToCanvas } from '../../guards/DatabaseBelongsToCanvas';
import { ExpandNodePreviewRequestQueryDto } from './dto/ExpandNodePreviewRequestQueryDto';
import { ExpandNodePreviewResponseBodyDto } from './dto/ExpandNodePreviewResponseBodyDto';
import { ExpandNodePreviewEntryDto } from './dto/ExpandNodePreviewEntryDto';
import { UserCanAccessRoom } from '../../guards/UserCanAccessRoom';
import { CanvasBelongsToRoom } from '../../guards/CanvasBelongsToRoom';
import { DatabaseReferenceCache } from '../../../schema/DatabaseReferenceCache';
import { LiveCanvasService } from '../../../live-canvas/LiveCanvasService';
import { LiveCanvas } from '../../../live-canvas/LiveCanvas';
import { ExternalGraphDatabaseStatsRelationship } from '../../../external-database/data/ExternalGraphDatabaseStatsRelationship';
import { ExternalGraphDatabaseStatsLabel } from '../../../external-database/data/ExternalGraphDatabaseStatsLabel';

@Controller('room/:roomId/canvas/:canvasId/database-connection/:databaseId')
@ApiParam({
  name: 'canvasId',
  required: true,
  type: 'string',
})
@ApiParam({
  name: 'databaseId',
  required: true,
  type: 'string',
})
@ApiParam({
  name: 'roomId',
  required: true,
  type: 'string',
})
@UseGuards(DatabaseBelongsToCanvas)
@UseGuards(UserCanAccessRoom)
@UseGuards(CanvasBelongsToRoom)
export class CanvasDatabaseConnectionController {
  public constructor(
    private readonly _database: DatabaseService,
    private readonly _externalGraphDatabase: ExternalGraphDatabaseService,
    private readonly _liveCanvasService: LiveCanvasService,
  ) {}

  @Get('stats')
  @ApiResponse({ type: GetDatabaseStatsResponseBodyDto })
  public async getStats(
    @Param('databaseId') databaseId: string,
  ): Promise<GetDatabaseStatsResponseBodyDto> {
    const database: Result<'api::database-connection.database-connection'> =
      await this._database.getDatabase(databaseId);
    const genericStats: ExternalGraphDatabaseStats =
      await this._externalGraphDatabase.getStats(database);

    return new GetDatabaseStatsResponseBodyDto({
      relTypeCount: genericStats.relTypeCount,
      labelCount: genericStats.labelCount,
      relCount: genericStats.relCount,
      nodeCount: genericStats.nodeCount,
      labels: genericStats.labels.map(
        (label: ExternalGraphDatabaseStatsLabel): DatabaseStatsLabelDto =>
          new DatabaseStatsLabelDto({
            label: label.label,
            exploreQuery: label.exploreQuery,
          }),
      ),
      rels: genericStats.rels.map(
        (
          rel: ExternalGraphDatabaseStatsRelationship,
        ): DatabaseStatsRelationshipDto =>
          new DatabaseStatsRelationshipDto({
            relType: rel.relType,
            exploreQuery: rel.exploreQuery,
          }),
      ),
    });
  }

  @Post('search')
  @HttpCode(200)
  @ApiResponse({ type: PostSearchResponseBodyDto })
  @UseGuards(DatabaseBelongsToCanvas)
  public async performSearch(
    @Param('databaseId') databaseId: string,
    @Param('canvasId') canvasId: string,
    @Body() body: PostSearchRequestBodyDto,
  ): Promise<PostSearchResponseBodyDto> {
    const liveCanvas: LiveCanvas =
      this._liveCanvasService.getCanvasWithId(canvasId);
    const database: Result<'api::database-connection.database-connection'> =
      await this._database.getDatabase(databaseId);

    const searchTerm: string = body.searchTerm;

    const result: ExternalGraphDatabaseNode[] =
      await this._externalGraphDatabase.search(database, searchTerm);

    const graph: LiveCanvasUndoableData = LiveCanvasUndoableData.empty();
    const databaseCache: DatabaseReferenceCache = new DatabaseReferenceCache(
      this._database,
    );
    await Promise.all(
      result.map(async (node: ExternalGraphDatabaseNode): Promise<void> => {
        await graph.nodes.addGraphNode(
          node,
          ElementCreationReason.search,
          databaseCache,
        );
      }),
    );

    return {
      nodes: graph.nodes.nodes
        .toArray()
        .map((node: GraphNode): NodePreviewDto => {
          return {
            id: node.id,
            nativeId: node.nativeId,
            title: node.getTitle(liveCanvas.data.viewSettings),
            labels: node.labels,
          } satisfies NodePreviewDto;
        }),
    };
  }

  @Get('search-capabilities')
  @ApiResponse({ type: GetSearchCapabilitiesResponseBodyDto })
  public async getSearchCapabilities(
    @Param('databaseId') databaseId: string,
  ): Promise<GetSearchCapabilitiesResponseBodyDto> {
    const database: Result<'api::database-connection.database-connection'> =
      await this._database.getDatabase(databaseId);

    const capabilities: ExternalGraphDatabaseSearchCapabilities =
      await this._externalGraphDatabase.getSearchCapabilities(database);

    return new GetSearchCapabilitiesResponseBodyDto({
      canExactMatchNativeId: capabilities.canExactMatchNativeId,
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

  @Get('expand-node-preview')
  @ApiResponse({ type: ExpandNodePreviewResponseBodyDto })
  public async expandNodePreview(
    @Query() query: ExpandNodePreviewRequestQueryDto,
    @Param('canvasId') canvasId: string,
  ): Promise<ExpandNodePreviewResponseBodyDto> {
    const canvas: LiveCanvas =
      this._liveCanvasService.getCanvasWithId(canvasId);
    const node: GraphNode | null = canvas.data.undoableData.current.nodes.get(
      query.nodeId,
    );
    if (node == null) {
      throw new NotFoundException(`Node ${query.nodeId} not found.`);
    }

    const database: Result<'api::database-connection.database-connection'> =
      await this._database.getDatabase(node.sourceId);

    const expandNodePreview: ExternalGraphDatabaseExpandNodePreview =
      await this._externalGraphDatabase.expandNodePreview(
        database,
        new SSet<string>([node.nativeId]),
      );

    return new ExpandNodePreviewResponseBodyDto({
      labels: expandNodePreview.labels.map(
        (
          l: ExternalGraphDatabaseExpandNodePreviewEntry,
        ): ExpandNodePreviewEntryDto =>
          new ExpandNodePreviewEntryDto({
            identificator: l.identificator,
            count: l.count,
          }),
      ),
      relationships: expandNodePreview.relationships.map(
        (
          l: ExternalGraphDatabaseExpandNodePreviewEntry,
        ): ExpandNodePreviewEntryDto =>
          new ExpandNodePreviewEntryDto({
            identificator: l.identificator,
            count: l.count,
          }),
      ),
    });
  }
}
