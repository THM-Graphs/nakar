import { EdgeDto, GraphDto, NodeDto } from './shared/dto';

interface PhysicalNode {
  id: string;
  x: number;
  y: number;
}

interface PhysicalEdge {
  source: PhysicalNode;
  target: PhysicalNode;
  length: number;
}

const simulationLengthMs = 1000;

function updateForces(nodes: PhysicalNode[], edges: PhysicalEdge[]) {
  const repulsionConstant = 1000;
  const attractionConstant = 0.1;

  for (const node of nodes) {
    let forceX = 0;
    let forceY = 0;

    // Abstoßungskraft zwischen Knoten
    for (const otherNode of nodes) {
      if (node === otherNode) continue;

      const dx = node.x - otherNode.x;
      const dy = node.y - otherNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const force = repulsionConstant / (distance * distance);

      forceX += (dx / distance) * force;
      forceY += (dy / distance) * force;
    }

    // Anziehungskraft entlang der Kanten
    for (const edge of edges) {
      if (edge.source === node || edge.target === node) {
        const targetNode = edge.source === node ? edge.target : edge.source;
        const dx = node.x - targetNode.x;
        const dy = node.y - targetNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const force = attractionConstant * (distance - edge.length);

        forceX -= (dx / distance) * force;
        forceY -= (dy / distance) * force;
      }
    }

    // Aktualisiere die Position des Knotens basierend auf der resultierenden Kraft
    node.x += forceX;
    node.y += forceY;
  }
}

export const layoutGraph = async (graph: GraphDto): Promise<void> => {
  const physicalNodes: PhysicalNode[] = graph.nodes.map(
    (node: NodeDto): PhysicalNode => {
      return {
        id: node.id,
        x: node.position.x,
        y: node.position.y,
      };
    },
  );

  const physicalEdges: PhysicalEdge[] = graph.edges.map(
    (edge: EdgeDto): PhysicalEdge => {
      return {
        source: physicalNodes.find((n) => n.id === edge.startNodeId)!,
        target: physicalNodes.find((n) => n.id === edge.endNodeId)!,
        length: Math.random() * 100 + 500,
      };
    },
  );

  const tick = () => {
    return new Promise((res) => {
      setTimeout(res, 0);
    });
  };

  const dateStart = Date.now();
  while (Date.now() < dateStart + simulationLengthMs) {
    await tick();
    updateForces(physicalNodes, physicalEdges);
  }

  for (const node of graph.nodes) {
    const physicalNode = physicalNodes.find(
      (physicalNode: PhysicalNode) => physicalNode.id === node.id,
    );
    if (physicalNode == null) {
      continue;
    }
    node.position.x = physicalNode.x;
    node.position.y = physicalNode.y;
  }
};
