import { HTTPTools } from '../HTTPTools';
import { DatabaseService } from '../../database/DatabaseService';
import { type Request, Router } from 'express';
import type {
  operations,
  SchemaDatabaseSearchCapabilitiesEntry,
  SchemaDatabaseStats,
  SchemaNodePreview,
} from '../../../../src-gen/schema';
import { Neo4jDatabaseInfo } from '../../neo4j/Neo4jDatabaseInfo';
import { Neo4jService } from '../../neo4j/Neo4jService';
import { Neo4jNode } from '../../neo4j/Neo4jNode';
import { LiveCanvasData } from '../../room/graph/LiveCanvasData';
import { ElementCreationReason } from '../../room/graph/ElementCreationReason';
import { SSet } from '../../set/Set';
import { Neo4jSearchCapabilities } from '../../neo4j/Neo4jSearchCapabilities';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { LiveCanvasNode } from '../../room/graph/LiveCanvasNode';

export class DatabaseRouter {
  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _databaseService: DatabaseService,
    private readonly _neo4jService: Neo4jService,
  ) {}

  public register(): Router {
    const router: Router = Router();

    router.use(
      '/:id',
      this._httpTools.handleMiddleware(this._assertDatabase.bind(this)),
    );
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

  private async _assertDatabase(req: Request): Promise<void> {
    const databaseId: string = this._httpTools.getPathParameter(req, 'id');
    const database: Result<'api::v2-database-connection.v2-database-connection'> =
      await this._databaseService.getDatabase(databaseId);
    req.nakar = {
      ...req.nakar,
      database: database,
    };
  }

  private async _getStats(req: Request): Promise<SchemaDatabaseStats> {
    const database: Result<'api::v2-database-connection.v2-database-connection'> =
      req.nakar.database;
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
    const database: Result<'api::v2-database-connection.v2-database-connection'> =
      req.nakar.database;
    const credentials: Neo4jDatabaseInfo = Neo4jDatabaseInfo.parse(database);

    type Body =
      operations['postDatabaseSearch']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const body: Body = req.body as Body;
    const searchTerm: string = body.searchTerm;

    const result: Neo4jNode[] = await this._neo4jService.search({
      searchTerm: searchTerm,
      credentials: credentials,
    });

    const graph: LiveCanvasData = LiveCanvasData.empty();
    for (const node of result) {
      graph.nodes.addNeo4jNode(node, ElementCreationReason.search);
    }

    return {
      nodes: graph.nodes.nodes
        .toArray()
        .map((node: LiveCanvasNode): SchemaNodePreview => {
          return {
            id: node.id,
            title: node.getTitle(),
            labels: node.labels.toArray(),
            customColor: null, // TODO
          } satisfies SchemaNodePreview;
        }),
    };
  }

  private async _getSearchCapabilities(
    req: Request,
  ): Promise<
    operations['getDatabaseSearchCapabilities']['responses']['200']['content']['application/json']
  > {
    const database: Result<'api::v2-database-connection.v2-database-connection'> =
      req.nakar.database;
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
