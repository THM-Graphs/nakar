import z, { ZodError } from 'zod';
import {
  executeQuery,
  getStats,
  Neo4jEdge,
  Neo4jNode,
} from '../../../lib/Neo4j';
import type { Context } from 'koa';
import {
  EdgeDto,
  GetDatabaseStructureDto,
  GetInitialGraphDto,
  GetScenariosDto,
  NodeDto,
} from '../../../lib/shared/dto';
import {
  applyNodeColors,
  applyNodeSizes,
  getNodeDisplayTitle,
} from '../../../lib/BusinessLogic';

export default {
  initialGraph: async (ctx: Context): Promise<Context> => {
    const querySchema = z.object({
      scenarioId: z.string(),
    });

    try {
      const query = querySchema.parse(ctx.request.query);

      const repository = strapi.documents('api::scenario.scenario');
      const rawResult = await repository.findOne({
        documentId: query.scenarioId,
        status: 'published',
        fields: ['query'],
        populate: {
          database: {
            fields: ['url', 'username', 'password'],
          },
        },
      });
      if (rawResult == null) {
        return ctx.notFound('Scenario not found');
      }

      const graphResult = await executeQuery(
        rawResult.database,
        rawResult.query,
      );

      const graph = {
        graph: {
          nodes: graphResult.nodes.map((node: Neo4jNode): NodeDto => {
            return {
              id: node.id,
              displayTitle: getNodeDisplayTitle(node),
              labels: node.labels,
              properties: node.properties,
              size: 0,
              backgroundColor: '',
              displayTitleColor: '',
              position: {
                x: 0,
                y: 0,
              },
            };
          }),
          edges: graphResult.edges.map((edge: Neo4jEdge): EdgeDto => {
            return {
              id: edge.id,
              startNodeId: edge.startNodeId,
              endNodeId: edge.endNodeId,
              type: edge.type,
              properties: edge.properties,
            };
          }),
          tableData: graphResult.tableData,
        },
      } satisfies GetInitialGraphDto;

      applyNodeSizes(graph);
      applyNodeColors(graph);

      ctx.response.body = graph;
      return ctx;
    } catch (err) {
      if (err instanceof ZodError) {
        return ctx.badRequest(err as object);
      } else {
        return ctx.internalServerError(err as object);
      }
    }
  },
  scenarios: async (ctx: Context): Promise<Context> => {
    try {
      const repository = strapi.documents('api::database.database');
      const dbResult = await repository.findMany({
        status: 'published',
        fields: ['title', 'url'],
        populate: {
          scenarios: {
            fields: ['title', 'query', 'description'],
            populate: {
              cover: {
                fields: ['url'],
              },
            },
          },
        },
      });

      ctx.response.body = {
        databases: dbResult.map((db) => ({
          id: db.documentId,
          title: db.title ?? '',
          url: db.url ?? '',
          scenarios:
            db.scenarios?.map((scenario) => ({
              id: scenario.documentId,
              title: scenario.title ?? '',
              description: scenario.description ?? '',
              query: scenario.query ?? '',
              coverUrl: scenario.cover
                ? strapi.config.get('server.url', '') +
                  (scenario.cover as { url: string }).url
                : undefined,
              databaseId: db.documentId,
              databaseTitle: db.title ?? '',
              databaseUrl: db.url ?? '',
            })) ?? [],
        })),
      } satisfies GetScenariosDto;
      return ctx;
    } catch (err) {
      if (err instanceof ZodError) {
        return ctx.badRequest(err as object);
      } else {
        return ctx.internalServerError(err as object);
      }
    }
  },
  databaseStructure: async (ctx: Context): Promise<Context> => {
    const querySchema = z.object({
      databaseId: z.string(),
    });

    try {
      const query = querySchema.parse(ctx.request.query);

      const repository = strapi.documents('api::database.database');
      const rawResult = await repository.findOne({
        documentId: query.databaseId,
        status: 'published',
      });
      if (rawResult == null) {
        return ctx.notFound('Database not found');
      }

      const stats = await getStats(rawResult);

      ctx.response.body = {
        id: query.databaseId,
        stats,
      } satisfies GetDatabaseStructureDto;
      return ctx;
    } catch (err) {
      if (err instanceof ZodError) {
        return ctx.badRequest(err as object);
      } else {
        return ctx.internalServerError(err as object);
      }
    }
  },
};
