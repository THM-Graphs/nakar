//
//  PhysicalGraph.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

public struct PhysicalGraph: Equatable {
    public var nodes: [String: PhysicalNode] = [:]
    public var edges: [String: PhysicalEdge] = [:]

    public init() {
        self.nodes = [:]
        self.edges = [:]
    }

    mutating func fill(with schemagraph: Components.Schemas.Graph) {
        for node in schemagraph.nodes {
            nodes[node.id] = PhysicalNode.from(schemaNode: node)
        }
        for edge in schemagraph.edges {
            edges[edge.id] = PhysicalEdge.from(schemaEdge: edge)
        }
    }
}
