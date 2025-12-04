import { HTTPTools } from '../HTTPTools';
import { DatabaseService } from '../../database/DatabaseService';
import { LoggerService } from '../../logger/LoggerService';
import { ConfigService } from '../../config/ConfigService';
import { MediaService } from '../../media/MediaService';
import { ProfilerService } from '../../profiler/ProfilerService';
import { NextFunction, type Request, Response, Router } from 'express';
import type {
  operations,
  SchemaDatabaseSearchCapabilitiesEntry,
  SchemaDatabaseStats,
  SchemaGraph,
} from '../../../../src-gen/schema';
import { GetDatabaseDBDTO } from '../../database/dto/GetDatabaseDBDTO';
import { NotFound } from 'http-errors';
import { Neo4jDatabaseInfo } from '../../neo4j/Neo4jDatabaseInfo';
import { Neo4jService } from '../../neo4j/Neo4jService';
import { GetRoomDBDTO } from '../../database/dto/GetRoomDBDTO';
import { GetScenarioDBDTO } from '../../database/dto/GetScenarioDBDTO';
import { FinalGraphDisplayConfiguration } from '../../room/scenario-pipeline/display-configuration/FinalGraphDisplayConfiguration';
import { Neo4jNode } from '../../neo4j/Neo4jNode';
import { MutableGraph } from '../../room/graph/MutableGraph';
import { MutableGraphElementCreationAction } from '../../room/graph/MutableGraphElementCreationAction';
import { SSet } from '../../tools/Set';
import { GetNoteDBDTO } from '../../database/dto/GetNoteDBDTO';
import { SMap } from '../../tools/Map';
import { Neo4jSearchCapabilities } from '../../neo4j/Neo4jSearchCapabilities';
import { SchemaFactoryService } from '../../schema/SchemaFactoryService';

export class DatabaseRouter {
  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _databaseService: DatabaseService,
    private readonly _neo4jService: Neo4jService,
    private readonly _logger: LoggerService,
    private readonly _profiler: ProfilerService,
    private readonly _config: ConfigService,
    private readonly _media: MediaService,
    private readonly _schemaFactory: SchemaFactoryService,
  ) {}

  public register(): Router {
    const router: Router = Router();

    router.use('/:id', this._assertDatabase.bind(this));
    router.get('/:id/stats', this._httpTools.handle(this._getStats.bind(this)));
    router.post(
      '/:id/search',
      this._httpTools.handle(this._postSearch.bind(this)),
    );
    router.get(
      '/:id/search-capabilities',
      this._httpTools.handle(this._getSearchCapabilities.bind(this)),
    );

    return router;
  }

  private async _assertDatabase(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const databaseId: string = this._httpTools.getPathParameter(req, 'id');
      const database: GetDatabaseDBDTO | null =
        await this._databaseService.getDatabase(databaseId);
      if (database == null) {
        throw new NotFound(`Database ${databaseId} not found.`);
      }
      req.nakarDatabase = database;
      next();
    } catch (error: unknown) {
      this._httpTools.handleUnknownError(res, error);
    }
  }

  private async _getStats(req: Request): Promise<SchemaDatabaseStats> {
    const database: GetDatabaseDBDTO = req.nakarDatabase;
    const credentials: Neo4jDatabaseInfo = Neo4jDatabaseInfo.parse(database);
    const stats: SchemaDatabaseStats = await this._neo4jService.getStats({
      credentials: credentials,
    });

    return stats;
  }

  private async _postSearch(
    req: Request,
  ): Promise<
    operations['postDatabaseSearch']['responses']['200']['content']['application/json']
  > {
    const database: GetDatabaseDBDTO = req.nakarDatabase;
    const credentials: Neo4jDatabaseInfo = Neo4jDatabaseInfo.parse(database);

    type Body =
      operations['postDatabaseSearch']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const body: Body = req.body as Body;
    const searchTerm: string = body.searchTerm;
    const room: GetRoomDBDTO | null = await this._databaseService.getRoom(
      body.roomId,
    );
    if (room == null) {
      throw new NotFound('Room not found.');
    }
    const scenario: GetScenarioDBDTO | null =
      await this._httpTools.getScenarioOfRoom(room);
    const config: FinalGraphDisplayConfiguration =
      await this._databaseService.getGraphDisplayConfiguration(
        scenario?.documentId ?? null,
        room.documentId,
      );

    const result: Neo4jNode[] = await this._neo4jService.search({
      searchTerm: searchTerm,
      credentials: credentials,
    });

    const graph: MutableGraph = MutableGraph.empty(
      this._logger,
      this._profiler,
    );
    for (const node of result) {
      graph.nodes.addNeo4jNode(
        node,
        MutableGraphElementCreationAction.search,
        config,
      );
    }

    const schemaGraph: SchemaGraph =
      await this._schemaFactory.createSchemaGraph(
        graph,
        { notes: new SSet<GetNoteDBDTO>(), byNodeId: new SMap() },
        config,
      );

    return {
      nodes: schemaGraph.elements.nodes,
    };
  }

  private async _getSearchCapabilities(
    req: Request,
  ): Promise<
    operations['getDatabaseSearchCapabilities']['responses']['200']['content']['application/json']
  > {
    const database: GetDatabaseDBDTO = req.nakarDatabase;
    const credentials: Neo4jDatabaseInfo = Neo4jDatabaseInfo.parse(database);

    const capabilities: Neo4jSearchCapabilities =
      await this._neo4jService.getSearchCapabilities({
        credentials: credentials,
      });

    return {
      canExactMatchElementId: capabilities.canExactMatchElementId,
      canExactMatchLabel: capabilities.canExactMatchLabel,
      exactMatchNodeProperties: capabilities.exactMatchNodeProperties.reduce(
        (
          result: SchemaDatabaseSearchCapabilitiesEntry[],
          label: string,
          propertyList: SSet<string>,
        ): SchemaDatabaseSearchCapabilitiesEntry[] => {
          return [
            ...result,
            ...propertyList.reduce(
              (
                properties: SchemaDatabaseSearchCapabilitiesEntry[],
                property: string,
              ): SchemaDatabaseSearchCapabilitiesEntry[] => [
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
          result: SchemaDatabaseSearchCapabilitiesEntry[],
          label: string,
          propertyList: SSet<string>,
        ): SchemaDatabaseSearchCapabilitiesEntry[] => {
          return [
            ...result,
            ...propertyList.reduce(
              (
                properties: SchemaDatabaseSearchCapabilitiesEntry[],
                property: string,
              ): SchemaDatabaseSearchCapabilitiesEntry[] => [
                ...properties,
                { property: property, label: label },
              ],
              [],
            ),
          ];
        },
        [],
      ),
    };
  }
}
