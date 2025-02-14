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
    public var isLoop: Bool
    public var parallelCount: Int
    public var parallelIndex: Int
    public var compressedCount: Int
    public var width: Double
    public var properties: [PhysicalProperty]
    public var namesInQuery: [String]

    init(
        id: String,
        startNodeId: String,
        endNodeId: String,
        type: String,
        isLoop: Bool,
        parallelCount: Int,
        parallelIndex: Int,
        compressedCount: Int,
        width: Double,
        properties: [PhysicalProperty],
        namesInQuery: [String]
    ) {
        self.id = id
        self.startNodeId = startNodeId
        self.endNodeId = endNodeId
        self.type = type
        self.isLoop = isLoop
        self.parallelCount = parallelCount
        self.parallelIndex = parallelIndex
        self.compressedCount = compressedCount
        self.width = width
        self.properties = properties
        self.namesInQuery = namesInQuery
    }

    init(of schemaEdge: Components.Schemas.Edge) {
        self.init(
            id: schemaEdge.id,
            startNodeId: schemaEdge.startNodeId,
            endNodeId: schemaEdge.endNodeId,
            type: schemaEdge._type,
            isLoop: schemaEdge.isLoop,
            parallelCount: schemaEdge.parallelCount,
            parallelIndex: schemaEdge.parallelIndex,
            compressedCount: schemaEdge.compressedCount,
            width: schemaEdge.width,
            properties: schemaEdge.properties.map { .init(of: $0) },
            namesInQuery: schemaEdge.namesInQuery
        )
    }
}
