import { DBScenario, DBScenarioSchema } from './types/DBScenario';
import { StrapiDbWrapperErrorNotFound } from './errors/StrapiDbWrapperErrorNotFound';
import { StrapiDbWrapperErrorCannotParse } from './errors/StrapiDbWrapperErrorCannotParse';
import { DBDatabase, DBDatabaseSchema } from './types/DBDatabase';
import { DBRoom, DBRoomSchema } from './types/DBRoom';
import {
  DBScenarioGroup,
  DBScenarioGroupSchema,
} from './types/DBScenarioGroup';

export class StrapiDbWrapper {
  private readonly scenarioRepository = strapi.documents(
    'api::scenario.scenario',
  );
  private readonly databaseRepository = strapi.documents(
    'api::database.database',
  );
  private readonly roomRepository = strapi.documents('api::room.room');
  private readonly scenarioGroupRepository = strapi.documents(
    'api::scenario-group.scenario-group',
  );

  public async getDatabases(): Promise<DBDatabase[]> {
    const rawResults = await this.databaseRepository.findMany({
      status: 'published',
      sort: 'title:asc',
      populate: {
        graphDisplayConfiguration: {
          populate: {
            nodeDisplayConfigurations: {},
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

  public async getRooms(): Promise<DBRoom[]> {
    const rawResults = await this.roomRepository.findMany({
      status: 'published',
      sort: 'title:asc',
    });

    const result: DBRoom[] = rawResults.map((rawResult) => {
      try {
        return DBRoomSchema.parse(rawResult);
      } catch (error: unknown) {
        throw new StrapiDbWrapperErrorCannotParse(rawResult.documentId, error);
      }
    });
    return result;
  }

  public async getRoom(roomId: string): Promise<DBRoom> {
    const rawResult = await this.roomRepository.findOne({
      status: 'published',
      documentId: roomId,
    });

    if (rawResult == null) {
      throw new StrapiDbWrapperErrorNotFound(roomId);
    }

    try {
      return DBRoomSchema.parse(rawResult);
    } catch (error: unknown) {
      throw new StrapiDbWrapperErrorCannotParse(rawResult.documentId, error);
    }
  }

  public async getScenarioGroups(
    databaseId: string,
  ): Promise<DBScenarioGroup[]> {
    const rawResults = await this.scenarioGroupRepository.findMany({
      status: 'published',
      sort: 'title:asc',
      populate: {
        database: {
          populate: {
            graphDisplayConfiguration: {
              populate: {
                nodeDisplayConfigurations: {},
              },
            },
          },
        },
        graphDisplayConfiguration: {
          populate: {
            nodeDisplayConfigurations: {},
          },
        },
      },
      filters: {
        database: {
          documentId: {
            $eq: databaseId,
          },
        },
      },
    });

    const result: DBScenarioGroup[] = rawResults.map((rawResult) => {
      try {
        return DBScenarioGroupSchema.parse(rawResult);
      } catch (error: unknown) {
        throw new StrapiDbWrapperErrorCannotParse(rawResult.documentId, error);
      }
    });
    return result;
  }

  public async getScenarios(scenarioGroupId: string): Promise<DBScenario[]> {
    const rawResults = await this.scenarioRepository.findMany({
      status: 'published',
      sort: 'title:asc',
      populate: {
        cover: {},
        scenarioGroup: {
          populate: {
            database: {
              populate: {
                graphDisplayConfiguration: {
                  populate: {
                    nodeDisplayConfigurations: {},
                  },
                },
              },
            },
            graphDisplayConfiguration: {
              populate: {
                nodeDisplayConfigurations: {},
              },
            },
          },
        },
        graphDisplayConfiguration: {
          populate: {
            nodeDisplayConfigurations: {},
          },
        },
      },
      filters: {
        scenarioGroup: {
          documentId: {
            $eq: scenarioGroupId,
          },
        },
      },
    });

    const result: DBScenario[] = rawResults.map((rawResult): DBScenario => {
      try {
        return DBScenarioSchema.parse(rawResult);
      } catch (error: unknown) {
        throw new StrapiDbWrapperErrorCannotParse(rawResult.documentId, error);
      }
    });
    return result;
  }

  public async getScenario(scenarioId: string): Promise<DBScenario> {
    const rawResult = await this.scenarioRepository.findOne({
      status: 'published',
      documentId: scenarioId,
      populate: {
        cover: {},
        scenarioGroup: {
          populate: {
            database: {
              populate: {
                graphDisplayConfiguration: {
                  populate: {
                    nodeDisplayConfigurations: {},
                  },
                },
              },
            },
            graphDisplayConfiguration: {
              populate: {
                nodeDisplayConfigurations: {},
              },
            },
          },
        },
        graphDisplayConfiguration: {
          populate: {
            nodeDisplayConfigurations: {},
          },
        },
      },
    });

    if (rawResult == null) {
      throw new StrapiDbWrapperErrorNotFound(scenarioId);
    }

    try {
      return DBScenarioSchema.parse(rawResult);
    } catch (error: unknown) {
      throw new StrapiDbWrapperErrorCannotParse(rawResult.documentId, error);
    }
  }
}
