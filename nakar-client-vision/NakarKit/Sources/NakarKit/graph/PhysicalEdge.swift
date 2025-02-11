//
//  PhysicalEdge.swift
//  NakarKit
//
//  Created by Samuel Schepp on 11.02.25.
//

public struct PhysicalEdge: Identifiable, Equatable {
    public var id: String
    public var startNodeId: String
    public var endNodeId: String
    public var type: String
    public var width: Double

    static func from(schemaEdge: Components.Schemas.Edge) -> PhysicalEdge {
        PhysicalEdge(
            id: schemaEdge.id,
            startNodeId: schemaEdge.startNodeId,
            endNodeId: schemaEdge.endNodeId,
            type: schemaEdge._type,
            width: schemaEdge.width
        )
    }
}
