import { DBScenario } from '../strapi-db/types/DBScenario';
import { GraphDisplayConfiguration } from './GraphDisplayConfiguration';
import { SchemaGetInitialGraph } from '../../../src-gen/schema';
import { NodeDisplayConfigurationData } from './NodeDisplayConfigurationData';
import { Neo4jWrapper } from '../neo4j/Neo4jWrapper';
import { GraphDtoFactory } from '../graph-transformer/GraphDtoFactory';

export class DisplayConfiguration {
  private current: GraphDisplayConfiguration;

  public constructor() {
    this.current = new GraphDisplayConfiguration(null, null, []);
  }

  public loadAllAndMerge(scenario: DBScenario): void {
    this.mergeWith(
      GraphDisplayConfiguration.fromDb(
        scenario.scenarioGroup?.database?.graphDisplayConfiguration,
      ),
    );
    this.mergeWith(
      GraphDisplayConfiguration.fromDb(
        scenario.scenarioGroup?.graphDisplayConfiguration,
      ),
    );
    this.mergeWith(
      GraphDisplayConfiguration.fromDb(scenario.graphDisplayConfiguration),
    );
  }

  public mergeWith(otherConfig: GraphDisplayConfiguration): void {
    this.current = this.current.byMergingIntoSelf(otherConfig);
  }

  public async applyToGraph(
    graph: SchemaGetInitialGraph,
    neo4jWrapper: Neo4jWrapper,
  ): Promise<void> {
    await this.applyConnectNodes(graph, neo4jWrapper);
    this.applyNodeDisplayText(graph);
    this.applyNodeRadius(graph);
    this.applyNodeBackgroundColor(graph);
    this.applyGrowNodeBasedOnDegree(graph);
  }

  private async applyConnectNodes(
    graph: SchemaGetInitialGraph,
    neo4jWrapper: Neo4jWrapper,
  ): Promise<void> {
    if (this.current.connectResultNodes !== true) {
      return;
    }

    const nodeIds = new Set<string>(graph.graph.nodes.map((n) => n.id));
    const result = await neo4jWrapper.loadConnectingRelationships(nodeIds);

    const edges = GraphDtoFactory.transformEdges(result);
    for (const edge of edges) {
      if (graph.graph.edges.find((e) => e.id === edge.id)) {
        continue;
      }
      graph.graph.edges.push(edge);
    }
  }

  private applyGrowNodeBasedOnDegree(graph: SchemaGetInitialGraph): void {
    if (this.current.growNodesBasedOnDegree !== true) {
      return;
    }

    const degrees = graph.graph.nodes.map((n) => n.degree);

    const growFactor = 1;
    const minConnections = Math.min(...degrees);
    const maxConnections = Math.max(...degrees);
    const delta = maxConnections - minConnections;

    if (delta === 0) {
      return;
    }

    for (const node of graph.graph.nodes) {
      const percent = (node.degree - minConnections) / delta;
      node.radius = node.radius * (1 + growFactor * percent);
    }
  }

  private applyNodeDisplayText(graph: SchemaGetInitialGraph): void {
    for (const nodeConfig of this.current.nodeDisplayConfigurations) {
      if (nodeConfig.targetLabel === null) {
        continue;
      }
      if (nodeConfig.displayText === null) {
        continue;
      }
      for (const node of graph.graph.nodes) {
        if (
          node.labels.find((l) => l.label === nodeConfig.targetLabel) == null
        ) {
          continue;
        }
        const data = NodeDisplayConfigurationData.fromNode(node);
        const newValue = data.applyToTemplate(nodeConfig.displayText);
        if (newValue.trim().length === 0) {
          continue;
        }
        node.displayTitle = newValue;
      }
    }
  }

  private applyNodeRadius(graph: SchemaGetInitialGraph): void {
    for (const nodeConfig of this.current.nodeDisplayConfigurations) {
      if (nodeConfig.targetLabel === null) {
        continue;
      }
      if (nodeConfig.radius === null) {
        continue;
      }
      for (const node of graph.graph.nodes) {
        if (
          node.labels.find((l) => l.label === nodeConfig.targetLabel) == null
        ) {
          continue;
        }
        const data = NodeDisplayConfigurationData.fromNode(node);
        const newValue = data.applyToTemplate(nodeConfig.radius);
        if (newValue.trim().length === 0) {
          continue;
        }
        const newRadius = parseFloat(newValue);
        if (isNaN(newRadius)) {
          console.warn(
            `Unable to parse node radius config: ${nodeConfig.radius} for label ${nodeConfig.targetLabel}`,
          );
          break;
        }
        node.radius = newRadius;
        break;
      }
    }
  }

  private applyNodeBackgroundColor(graph: SchemaGetInitialGraph): void {
    for (const nodeConfig of this.current.nodeDisplayConfigurations) {
      if (nodeConfig.targetLabel === null) {
        continue;
      }
      if (nodeConfig.backgroundColor === null) {
        continue;
      }
      for (const node of graph.graph.nodes) {
        if (node.labels.length === 0) {
          continue;
        }
        if (node.labels[0].label === nodeConfig.targetLabel) {
          const data = NodeDisplayConfigurationData.fromNode(node);
          const newValue = data.applyToTemplate(nodeConfig.backgroundColor);
          if (newValue.trim().length === 0) {
            continue;
          }
          node.labels[0].color = {
            type: 'CustomColor',
            backgroundColor: nodeConfig.backgroundColor,
            textColor: '#000000',
          };
        }
      }
    }
  }
}
