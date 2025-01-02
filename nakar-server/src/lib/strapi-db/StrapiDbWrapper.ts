import { DBScenario, DBScenarioSchema } from './types/DBScenario';
import { StrapiDbWrapperErrorNotFound } from './errors/StrapiDbWrapperErrorNotFound';
import { StrapiDbWrapperErrorCannotParse } from './errors/StrapiDbWrapperErrorCannotParse';
import { DBDatabase, DBDatabaseSchema } from './types/DBDatabase';

export class StrapiDbWrapper {
  private readonly scenariosRepository = strapi.documents(
    'api::scenario.scenario',
  );

  private readonly databaseRepository = strapi.documents(
    'api::database.database',
  );

  public async getScenario(id: string): Promise<DBScenario> {
    const rawResult = await this.scenariosRepository.findOne({
      documentId: id,
      status: 'published',
      populate: ['database', 'cover'],
    });
    if (rawResult == null) {
      throw new StrapiDbWrapperErrorNotFound(id);
    }
    try {
      const result: DBScenario = DBScenarioSchema.parse(rawResult);
      return result;
    } catch (error: unknown) {
      throw new StrapiDbWrapperErrorCannotParse(id, error);
    }
  }

  public async getDatabase(id: string): Promise<DBDatabase> {
    const rawResult = await this.databaseRepository.findOne({
      documentId: id,
      status: 'published',
      populate: {
        scenarios: {
          populate: {
            cover: {},
          },
        },
      },
    });
    if (rawResult == null) {
      throw new StrapiDbWrapperErrorNotFound(id);
    }
    try {
      const result: DBDatabase = DBDatabaseSchema.parse(rawResult);
      return result;
    } catch (error: unknown) {
      throw new StrapiDbWrapperErrorCannotParse(id, error);
    }
  }

  public async getDatabases(): Promise<DBDatabase[]> {
    const rawResults = await this.databaseRepository.findMany({
      status: 'published',
      populate: {
        scenarios: {
          populate: {
            cover: {},
          },
        },
      },
    });

    const result: DBDatabase[] = rawResults.map((rawResult) => {
      try {
        return DBDatabaseSchema.parse(rawResult);
      } catch (error: unknown) {
        throw new StrapiDbWrapperErrorCannotParse(rawResult.documentId, error);
      }
    });
    return result;
  }
}
