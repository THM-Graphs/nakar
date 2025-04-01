import { Neo4jGraphElements } from '../../neo4j/Neo4jGraphElements';
import { GetScenarioDBDTO } from '../../database/dto/GetScenarioDBDTO';
import { v4 as uuidv4 } from 'uuid';
import { Neo4jNode } from '../../neo4j/Neo4jNode';
import { MutableNode } from '../graph/MutableNode';
import { Neo4jRelationship } from '../../neo4j/Neo4jRelationship';
import { MutableEdge } from '../graph/MutableEdge';
import { MutableGraphMetaData } from '../graph/MutableGraphMetaData';
import { MutableGraph } from '../graph/MutableGraph';
import { MutablePropertyCollection } from '../graph/MutablePropertyCollection';
import { SSet } from '../../../tools/Set';
import { MutablePosition } from '../graph/MutablePosition';
import { SMap } from '../../../tools/Map';
import { MutableScenarioInfo } from '../graph/MutableScenarioInfo';

export class MutableGraphFactory {
  public createGraph(
    graphElements: Neo4jGraphElements,
    scenario: GetScenarioDBDTO,
  ): MutableGraph {
    return new MutableGraph({
      id: uuidv4(),
      nodes: graphElements.nodes.map(
        (node: Neo4jNode): MutableNode => this.createMutableNode(node),
      ),
      edges: graphElements.relationships.map(
        (relationship: Neo4jRelationship): MutableEdge =>
          this.createMutableEdge(relationship),
      ),
      metaData: this.createMutableGraphMetaData(scenario),
      tableData: graphElements.tableData,
    });
  }

  public createMutableNode(node: Neo4jNode): MutableNode {
    return new MutableNode({
      labels: new SSet<string>(node.node.labels),
      properties: this.createMutablePropertyCollection(node.node.properties),
      radius: MutableNode.defaultRadius,
      position: MutablePosition.default(),
      inDegree: 0,
      outDegree: 0,
      namesInQuery: node.keys,
      customBackgroundColor: null,
      customTitleColor: null,
      customTitle: null,
      locked: false,
      grabs: new SSet(),
      source: node.source,
      additionalSources: new SSet(),
    });
  }

  public createMutableEdge(relationship: Neo4jRelationship): MutableEdge {
    return new MutableEdge({
      startNodeId: relationship.relationship.startNodeElementId,
      endNodeId: relationship.relationship.endNodeElementId,
      type: relationship.relationship.type,
      parallelCount: 1,
      parallelIndex: 0,
      compressedCount: 1,
      width: MutableEdge.defaultWidth,
      properties: this.createMutablePropertyCollection(
        relationship.relationship.properties,
      ),
      namesInQuery: relationship.keys,
      source: relationship.source,
      additionalSources: new SSet(),
    });
  }

  public createMutableGraphMetaData(
    scenario: GetScenarioDBDTO,
  ): MutableGraphMetaData {
    return new MutableGraphMetaData({
      labels: new SMap(),
      scenarioInfo: this.createMutableScenarioInfo(scenario),
      pipelineSummary: [],
    });
  }

  public createMutablePropertyCollection(
    properties: Record<string, unknown>,
  ): MutablePropertyCollection {
    return new MutablePropertyCollection({
      properties: Object.entries(properties).reduce(
        (
          akku: SMap<string, unknown>,
          [key, value]: [string, unknown],
        ): SMap<string, unknown> => akku.bySetting(key, value),
        new SMap<string, unknown>(),
      ),
    });
  }

  public createMutableScenarioInfo(
    scenario: GetScenarioDBDTO,
  ): MutableScenarioInfo {
    return new MutableScenarioInfo({
      id: scenario.documentId,
      title: scenario.title,
    });
  }
}
