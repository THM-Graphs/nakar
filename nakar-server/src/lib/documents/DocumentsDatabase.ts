import { DBDatabase } from './collection-types/DBDatabase';
import { DBRoom } from './collection-types/DBRoom';
import { DBScenario } from './collection-types/DBScenario';
import { DBScenarioGroup } from './collection-types/DBScenarioGroup';
import { MutableGraph } from '../graph/MutableGraph';
import { Result } from '@strapi/types/dist/modules/documents';

export class DocumentsDatabase {
  public async getDatabases(): Promise<DBDatabase[]> {
    return (
      await strapi.documents('api::database.database').findMany({
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
    ).map((database: Result<'api::database.database'>): DBDatabase => DBDatabase.parse(database));
  }

  public async getRoom(roomId: string): Promise<DBRoom | null> {
    const rawRoom: Result<'api::room.room'> | null = await strapi.documents('api::room.room').findOne({
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
      await strapi.documents('api::room.room').findMany({
        status: 'published',
        sort: 'title:asc',
      })
    ).map((room: Result<'api::room.room'>): DBRoom => DBRoom.parse(room));
  }

  public async getScenario(scenarioId: string): Promise<DBScenario | null> {
    const result: Result<
      'api::scenario.scenario',
      {
        populate: ['graphDisplayConfiguration', 'scenarioGroup'];
      }
    > | null = await strapi.documents('api::scenario.scenario').findOne({
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
      await strapi.documents('api::scenario.scenario').findMany({
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
    ).map((scenario: Result<'api::scenario.scenario'>): DBScenario => DBScenario.parse(scenario));
  }

  public async getScenarioGroups(databaseId: string): Promise<DBScenarioGroup[]> {
    return (
      await strapi.documents('api::scenario-group.scenario-group').findMany({
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
    ).map(
      (scenarioGroup: Result<'api::scenario-group.scenario-group'>): DBScenarioGroup =>
        DBScenarioGroup.parse(scenarioGroup),
    );
  }

  public async setRoomGraph(room: DBRoom, graph: MutableGraph): Promise<void> {
    const graphJson: string = JSON.stringify(graph.toPlain());
    await strapi.documents('api::room.room').update({
      documentId: room.documentId,
      data: {
        graphJson: graphJson,
      },
      status: 'published',
    });
    strapi.log.debug(`Did save graph of room ${room.documentId} in db.`);
  }
}
