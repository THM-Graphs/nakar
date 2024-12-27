import z, { ZodError } from 'zod';
import {
  executeQuery,
  getStats,
  Neo4jEdge,
  Neo4jNode,
  Neo4JProperty,
} from '../../../lib/Neo4j';
import type { Context } from 'koa';
import {
  EdgeDto,
  GetDatabaseStructureDto,
  GetInitialGraphDto,
  GetScenariosDto,
  NodeDto,
} from '../../../lib/shared/dto';
import { getRandomColor, invertColor } from '../../../lib/Color';

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
              displayTitle:
                node.properties.find((p) => p.slug == 'name')?.value ??
                node.properties.find((p) => p.slug == 'label')?.value ??
                (node.properties[0] as Neo4JProperty | null)?.value ??
                node.labels.join(', '),
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

function applyNodeSizes(graph: GetInitialGraphDto): void {
  const nodeConnections: Record<string, number> = {};
  for (const node of graph.graph.nodes) {
    const edges = graph.graph.edges.filter(
      (e) => e.startNodeId == node.id || e.endNodeId == node.id,
    );
    nodeConnections[node.id] = edges.length;
  }

  const minSize = 60;
  const maxSize = 110;
  const sizeDelta = maxSize - minSize;
  const minConnections = Math.min(...Object.values(nodeConnections));
  const maxConnections = Math.max(...Object.values(nodeConnections));
  const delta = maxConnections - minConnections;

  for (const node of graph.graph.nodes) {
    if (delta == 0) {
      node.size = (minSize + maxSize) / 2;
      continue;
    }
    const connections = nodeConnections[node.id];

    const percent = (connections - minConnections) / delta;
    const size = minSize + sizeDelta * percent;
    node.size = size;
  }
}

function applyNodeColors(graph: GetInitialGraphDto): void {
  const labels: Record<string, string> = {};
  const htmlColors: string[] = [
    '#ff8189',
    '#ffff80',
    '#7dff98',
    '#ffc280',
    '#7fc7ff',
    '#b580ff',
  ];

  let htmlCounter = 0;

  for (const node of graph.graph.nodes) {
    for (const label of node.labels) {
      if (!Object.keys(labels).includes(label)) {
        labels[label] = htmlColors[htmlCounter];
        htmlCounter = (htmlCounter + 1) % htmlColors.length;
      }
    }
  }

  for (const node of graph.graph.nodes) {
    node.backgroundColor = labels[node.labels[0]];
    node.displayTitleColor = invertColor(labels[node.labels[0]]);
  }
}
