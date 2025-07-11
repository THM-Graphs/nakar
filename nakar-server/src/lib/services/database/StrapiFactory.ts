import { Input } from '@strapi/types/dist/modules/documents/params/data';
import { SaveDatabaseDBDTO } from './dto/SaveDatabaseDBDTO';
import { GraphDisplayConfigurationDBDTO } from './dto/GraphDisplayConfigurationDBDTO';
import { match } from 'ts-pattern';
import { NodeDisplayConfigurationDBDTO } from './dto/NodeDisplayConfigurationDBDTO';
import { SaveScenarioGroupDBDTO } from './dto/SaveScenarioGroupDBDTO';
import { SaveScenarioDBDTO } from './dto/SaveScenarioDBDTO';
import { AdditionalQueryDBDTO } from './dto/AdditionalQueryDBDTO';

export class StrapiFactory {
  public createDatabaseInsertObject(
    saveDto: SaveDatabaseDBDTO,
  ): Input<'api::database.database'> {
    return {
      title: saveDto.title ?? undefined,
      url: saveDto.url ?? undefined,
      username: saveDto.username ?? undefined,
      password: saveDto.password ?? undefined,
      browserUrl: saveDto.browserUrl ?? undefined,
      graphDisplayConfiguration: this._createGraphDisplayConfiguration(
        saveDto.graphDisplayConfiguration,
      ),
    };
  }

  public createScenarioGroupInsertObject(
    saveDto: SaveScenarioGroupDBDTO,
  ): Input<'api::scenario-group.scenario-group'> {
    return {
      title: saveDto.title ?? undefined,
      room: saveDto.room
        ? {
            documentId: saveDto.room.documentId,
          }
        : null,
      graphDisplayConfiguration: this._createGraphDisplayConfiguration(
        saveDto.graphDisplayConfiguration,
      ),
    };
  }

  public createScenarioInsertObject(
    saveDto: SaveScenarioDBDTO,
  ): Input<'api::scenario.scenario'> {
    return {
      title: saveDto.title ?? undefined,
      query: '',
      description: saveDto.description ?? undefined,
      cover:
        saveDto.cover != null
          ? {
              documentId: saveDto.cover.documentId,
            }
          : null,
      scenarioGroup: saveDto.scenarioGroup
        ? {
            documentId: saveDto.scenarioGroup.documentId,
          }
        : null,
      graphDisplayConfiguration: this._createGraphDisplayConfiguration(
        saveDto.graphDisplayConfiguration,
      ),
      additionalQueries: [],
    };
  }

  private _createAdditionalQuery(
    additionalQuery: AdditionalQueryDBDTO,
  ): Input<'graph.additional-query'> {
    return {
      originalLabel: additionalQuery.originalLabel,
      originalProperties: additionalQuery.originalProperties.join(', '),
      mergeLabel: additionalQuery.mergeLabel,
      mergeProperties: additionalQuery.mergeProperties.join(', '),
      mergeQuery: additionalQuery.mergeQuery,
      mergeDatabase:
        additionalQuery.mergeDatabase != null
          ? {
              documentId: additionalQuery.mergeDatabase.documentId,
            }
          : undefined,
    };
  }

  private _createGraphDisplayConfiguration(
    graphDisplayConfiguration: GraphDisplayConfigurationDBDTO,
  ): Input<'graph.graph-display-configuration'> {
    return {
      connectResultNodes: this._createOptionalBoolean(
        graphDisplayConfiguration.connectResultNodes,
      ),
      growNodesBasedOnDegree: this._createOptionalBoolean(
        graphDisplayConfiguration.growNodesBasedOnDegree,
      ),
      growNodesBasedOnDegreeFactor:
        graphDisplayConfiguration.growNodesBasedOnDegreeFactor ?? undefined,
      nodeDisplayConfigurations:
        graphDisplayConfiguration.nodeDisplayConfigurations.map(
          (
            nodeDisplayConfiguration: NodeDisplayConfigurationDBDTO,
          ): Input<'graph.node-display-configuration'> =>
            this._createNodeDisplayConfiguration(nodeDisplayConfiguration),
        ),
      compressRelationships: this._createOptionalBoolean(
        graphDisplayConfiguration.compressRelationships,
      ),
      compressRelationshipsWidthFactor:
        graphDisplayConfiguration.compressRelationshipsWidthFactor ?? undefined,
      scaleType: graphDisplayConfiguration.scaleType ?? undefined,
    };
  }

  private _createNodeDisplayConfiguration(
    nodeDisplayConfiguration: NodeDisplayConfigurationDBDTO,
  ): Input<'graph.node-display-configuration'> {
    return {
      targetLabel: nodeDisplayConfiguration.targetLabel ?? undefined,
      displayText: nodeDisplayConfiguration.displayText ?? undefined,
      radius: nodeDisplayConfiguration.radius ?? undefined,
      backgroundColor: nodeDisplayConfiguration.backgroundColor ?? undefined,
    };
  }

  private _createOptionalBoolean(
    input: boolean | null,
  ): 'true' | 'false' | 'inherit' {
    return match(input)
      .returnType<'true' | 'false' | 'inherit'>()
      .with(null, (): 'inherit' => 'inherit')
      .with(true, (): 'true' => 'true')
      .with(false, (): 'false' => 'false')
      .exhaustive();
  }
}
