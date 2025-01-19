import { DBDatabase } from './DBDatabase';
import { DBRoom } from './DBRoom';
import { DBScenario } from './DBScenario';
import { DBScenarioGroup } from './DBScenarioGroup';

export class DocumentsDatabase {
  private readonly databaseService = strapi.documents('api::database.database');
  private readonly roomService = strapi.documents('api::room.room');
  private readonly scenarioService = strapi.documents('api::scenario.scenario');
  private readonly scenarioGroupService = strapi.documents(
    'api::scenario-group.scenario-group',
  );

  public async getDatabases(): Promise<DBDatabase[]> {
    return (
      await this.databaseService.findMany({
        status: 'published',
        sort: 'title:asc',
        populate: {
          graphDisplayConfiguration: {
            populate: {
              nodeDisplayConfigurations: {},
            },
          },
        },
      })
    ).map((database) => DBDatabase.parse(database));
  }

  public async getRoom(roomId: string): Promise<DBRoom | null> {
    const rawRoom = await this.roomService.findOne({
      status: 'published',
      documentId: roomId,
    });
    if (rawRoom == null) {
      return null;
    }
    return DBRoom.parse(rawRoom);
  }

  public async getRooms(): Promise<DBRoom[]> {
    return (
      await this.roomService.findMany({
        status: 'published',
        sort: 'title:asc',
      })
    ).map((room) => DBRoom.parse(room));
  }

  public async getScenario(scenarioId: string): Promise<DBScenario | null> {
    const result = await this.scenarioService.findOne({
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
    if (result == null) {
      return null;
    }
    return DBScenario.parse(result);
  }

  public async getScenarios(scenarioGroupId: string): Promise<DBScenario[]> {
    return (
      await this.scenarioService.findMany({
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
      })
    ).map((scenario) => DBScenario.parse(scenario));
  }

  public async getScenarioGroups(
    databaseId: string,
  ): Promise<DBScenarioGroup[]> {
    return (
      await this.scenarioGroupService.findMany({
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
      })
    ).map((scenarioGroup) => DBScenarioGroup.parse(scenarioGroup));
  }
}
