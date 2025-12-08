import {
  NAKARGraphCreationReason,
  NAKARGraphNode,
  NAKARGraphRelationship,
  NAKARGraphState,
} from './NAKARGraphState';
import { UndoWrapper } from '../undo/UndoWrapper';
import { NAKARGraphTransaction } from './NAKARGraphTransaction';
import { Neo4jNode } from '../neo4j/Neo4jNode';
import { PhysicsSimulation } from '../physics/PhysicsSimulation';
import { Neo4jRelationship } from '../neo4j/Neo4jRelationship';
import { SMap } from '../tools/Map';
import { v4 } from 'uuid';

export class NAKARGraph {
  private readonly _state: UndoWrapper<NAKARGraphState>;

  public constructor(state: NAKARGraphState) {
    this._state = new UndoWrapper(
      state,
      (input: NAKARGraphState): NAKARGraphState => {
        return structuredClone(input);
      },
      { maximumStackSize: 10 },
    );
  }

  public static empty(): NAKARGraph {
    return new NAKARGraph({
      nodes: [],
      relationships: [],
      tableData: [],
      id: v4(),
      metaData: {
        arguments: {},
        scenarioId: null,
      },
    });
  }

  public transaction(
    title: string,
    action: (transaction: NAKARGraphTransaction) => void,
  ): void {
    this._state.transaction(
      title,
      (graph: NAKARGraphState): NAKARGraphState => {
        const transaction: NAKARGraphTransaction = {
          addNode(
            node: Neo4jNode,
            creationAction: NAKARGraphCreationReason,
          ): void {
            graph.nodes.push({
              id: node.node.elementId,
              creationAction: creationAction,
              locked: false,
              compressed: [],
              namesInQuery: node.keys.toArray(),
              nativeLabels: node.node.labels,
              position: PhysicsSimulation.jiggled(),
              source: node.source.nakarId,
              properties: node.node.properties,
            });
          },
          removeNode(nodeId: string): void {
            // TODO: Use index
            const index: number = graph.nodes.findIndex(
              (node: NAKARGraphNode): boolean => node.id === nodeId,
            );
            if (index !== -1) {
              graph.nodes.splice(index, 1);
            }
          },
          addRelationship(
            relationship: Neo4jRelationship,
            creationAction: NAKARGraphCreationReason,
          ): void {
            graph.relationships.push({
              id: relationship.relationship.elementId,
              source: relationship.source.nakarId,
              properties: relationship.relationship.properties,
              namesInQuery: relationship.keys.toArray(),
              compressed: [],
              creationAction: creationAction,
              type: relationship.relationship.type,
              startNodeId: relationship.relationship.startNodeElementId,
              endNodeId: relationship.relationship.endNodeElementId,
            });
          },
          removeRelationship(relationshipId: string): void {
            // TODO: Use index
            const index: number = graph.relationships.findIndex(
              (relationship: NAKARGraphRelationship): boolean =>
                relationship.id === relationshipId,
            );
            if (index !== -1) {
              graph.relationships.splice(index, 1);
            }
          },
          addTableData(data: SMap<string, unknown>[]): void {
            graph.tableData.push(
              ...data.map(
                (entry: SMap<string, unknown>): Record<string, unknown> =>
                  entry.toRecord(),
              ),
            );
          },
          clearTableData(): void {
            graph.tableData = [];
          },
          clearGraphElements(): void {
            graph.nodes = [];
            graph.relationships = [];
          },
        };
        action(transaction);
        return graph;
      },
    );
  }
}
