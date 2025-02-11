//
//  PhysicalGraph.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

public struct PhysicalGraph: Equatable {
    public var nodes: [String: PhysicalNode]
    public var edges: [String: PhysicalEdge]
    public var metaData: PhysicalGraphMetaData
    public var tableData: [[String: String]]

    public init(
        nodes:[String: PhysicalNode],
        edges: [String: PhysicalEdge],
        metaData: PhysicalGraphMetaData,
        tableData: [[String: String]]
    ) {
        self.nodes = nodes
        self.edges = edges
        self.metaData = metaData
        self.tableData = tableData
    }

    init(of schemaGraph: Components.Schemas.Graph) {
        self.init(
            nodes: Dictionary(uniqueKeysWithValues: schemaGraph.nodes.map { ($0.id, PhysicalNode(of: $0)) }),
            edges: Dictionary(uniqueKeysWithValues: schemaGraph.edges.map { ($0.id, PhysicalEdge(of: $0)) }),
            metaData: .init(of: schemaGraph.metaData),
            tableData: schemaGraph.tableData.map { row in
                return Dictionary(uniqueKeysWithValues: row.additionalProperties.map { (key, value) in
                    return (key, value.jsonStringRepresentation)
                })
            }
        )
    }
}
