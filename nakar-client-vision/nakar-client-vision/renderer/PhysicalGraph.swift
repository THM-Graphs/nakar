//
//  PhysicalGraph.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

struct PhysicalGraph {
    var nodes: [PhysicalNode] = []

    init() {
        self.nodes = []
    }

    mutating func fill(with schemagraph: Components.Schemas.Graph) {
        self.nodes = schemagraph.nodes.map { schemaNode in
            PhysicalNode(
                id: schemaNode.id,
                x: schemaNode.position.x,
                y: schemaNode.position.y,
                radus: schemaNode.radius,
                title: schemaNode.title
            )
        }
    }
}
