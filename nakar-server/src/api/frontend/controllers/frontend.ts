import z, { ZodError } from 'zod';
import { executeQuery, getStats } from '../../../lib/neo4j';
import type { Context } from 'koa';
import {
  GetDatabaseStructureDto,
  GetInitialGraphDto,
  GetScenariosDto,
} from '../../../lib/shared/dto';

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
            fields: ['host', 'port', 'username', 'password'],
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

      ctx.response.body = {
        graph: graphResult,
      } satisfies GetInitialGraphDto;
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
        fields: ['title', 'host', 'port'],
        populate: {
          scenarios: {
            fields: ['title', 'query'],
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
          host: db.host ?? '',
          port: db.port ?? 0,
          scenarios:
            db.scenarios?.map((scenario) => ({
              id: scenario.documentId,
              title: scenario.title ?? '',
              query: scenario.query ?? '',
              coverUrl: scenario.cover
                ? strapi.config.get('server.url', '') +
                  (scenario.cover as { url: string }).url
                : undefined,
              databaseId: db.documentId,
              databaseTitle: db.title ?? '',
              databaseHost: db.host ?? '',
              databasePort: db.port ?? 0,
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
