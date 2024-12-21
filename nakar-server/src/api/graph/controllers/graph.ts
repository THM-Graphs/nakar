/**
 * A set of functions called "actions" for `graph`
 */
import z from 'zod';
import { executeQuery } from '../../../lib/neo4j';

export default {
  initial: async (ctx, next) => {
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
      const query = querySchema.parse(ctx.query);

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

      return ctx.send(graphResult);
    } catch (err) {
      return ctx.internalServerError(err);
    }
  },
};
