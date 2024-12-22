import z, { ZodError } from 'zod';
import { executeQuery } from '../../../lib/neo4j';
import type { Context } from 'koa';
import { GetInitialGraphDto } from './dto/GetInitialGraphDto';
import {
  GetDatabaseDto,
  GetScenarioDto,
  GetScenariosDto,
} from './dto/GetScenariosDto';

export default {
  initialGraph: async (ctx: Context): Promise<Context> => {
    const querySchema = z.object({
      scenarioId: z.string(),
    });
    const dbResultSchema = z.object({
      query: z.string(),
      database: z.object({
        host: z.string(),
        port: z.number().int(),
        username: z.string(),
        password: z.string(),
      }),
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
      const dbResult = dbResultSchema.parse(rawResult);

      const graphResult = await executeQuery(dbResult.database, dbResult.query);

      ctx.response.body = new GetInitialGraphDto(graphResult);
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
    const dbResultSchema = z.array(
      z.object({
        documentId: z.string(),
        title: z.string(),
        host: z.string(),
        port: z.number().int(),
        scenarios: z.array(
          z.object({
            documentId: z.string(),
            title: z.string(),
            query: z.string(),
            cover: z.object({
              url: z.string(),
            }),
          }),
        ),
      }),
    );

    try {
      const repository = strapi.documents('api::database.database');
      const rawResult = await repository.findMany({
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

      const dbResult = dbResultSchema.parse(rawResult);

      ctx.response.body = new GetScenariosDto(
        dbResult.map((db): GetDatabaseDto => {
          return {
            id: db.documentId,
            title: db.title,
            host: db.host,
            port: db.port,
            scenarios: db.scenarios.map((scenario): GetScenarioDto => {
              return {
                id: scenario.documentId,
                title: scenario.title,
                query: scenario.query,
                coverUrl: strapi.config.get('server.url') + scenario.cover.url,
                databaseId: db.documentId,
                databaseTitle: db.title,
                databaseHost: db.host,
                databasePort: db.port,
              };
            }),
          };
        }),
      );
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
