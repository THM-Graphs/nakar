import { DBDatabase } from './collection-types/DBDatabase';
import { DBRoom } from './collection-types/DBRoom';
import { DBScenario } from './collection-types/DBScenario';
import { DBScenarioGroup } from './collection-types/DBScenarioGroup';
import { MutableGraph } from '../graph/MutableGraph';

export class DocumentsDatabase {
  private readonly _databaseService = strapi.documents(
    'api::database.database',
  );
  private readonly _roomService = strapi.documents('api::room.room');
  private readonly _scenarioService = strapi.documents(
    'api::scenario.scenario',
  );
  private readonly _scenarioGroupService = strapi.documents(
    'api::scenario-group.scenario-group',
  );

  public async getDatabases(): Promise<DBDatabase[]> {
    return (
      await this._databaseService.findMany({
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
    const rawRoom = await this._roomService.findOne({
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
      await this._roomService.findMany({
        status: 'published',
        sort: 'title:asc',
      })
    ).map((room) => DBRoom.parse(room));
  }

  public async getScenario(scenarioId: string): Promise<DBScenario | null> {
    const result = await this._scenarioService.findOne({
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
      await this._scenarioService.findMany({
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
      await this._scenarioGroupService.findMany({
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

  public async setRoomGraph(room: DBRoom, graph: MutableGraph): Promise<void> {
    const graphJson = JSON.stringify(graph.toPlain());
    await this._roomService.update({
      documentId: room.documentId,
      data: {
        graphJson: graphJson,
      },
      status: 'published',
    });
    strapi.log.debug(`Did save graph of room ${room.documentId} in db.`);
  }
}
