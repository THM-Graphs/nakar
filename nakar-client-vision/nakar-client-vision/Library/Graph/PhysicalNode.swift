//
//  PhysicalNode.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 07.02.25.
//

import SpriteKit

public struct PhysicalNode: Identifiable, Equatable {
    public var id: String
    public var title: String
    public var labels: [String]
    public var properties: [PhysicalProperty]
    public var radius: Double
    public var position: PhysicalPosition
    public var inDegree: Int
    public var outDegree: Int
    public var degree: Int
    public var namesInQuery: [String]
    public var displayConfigurationContext: String
    public var customBackgroundColor: String?
    public var customTitleColor: String?

    init(
        id: String,
        title: String,
        labels: [String],
        properties: [PhysicalProperty],
        radius: Double,
        position: PhysicalPosition,
        inDegree: Int,
        outDegree: Int,
        degree: Int,
        namesInQuery: [String],
        displayConfigurationContext: String,
        customBackgroundColor: String?,
        customTitleColor: String?
    ) {
        self.id = id
        self.title = title
        self.labels = labels
        self.properties = properties
        self.radius = radius
        self.position = position
        self.inDegree = inDegree
        self.outDegree = outDegree
        self.degree = degree
        self.namesInQuery = namesInQuery
        self.displayConfigurationContext = displayConfigurationContext
        self.customBackgroundColor = customBackgroundColor
        self.customTitleColor = customTitleColor
    }

    init(of schemaNode: Components.Schemas.Node) {
        self.init(
            id: schemaNode.id,
            title: schemaNode.title,
            labels: schemaNode.labels,
            properties: schemaNode.properties.map { .init(of: $0) },
            radius: schemaNode.radius,
            position: .init(of: schemaNode.position),
            inDegree: schemaNode.inDegree,
            outDegree: schemaNode.outDegree,
            degree: schemaNode.degree,
            namesInQuery: schemaNode.namesInQuery,
            displayConfigurationContext: schemaNode.displayConfigurationContext.jsonStringRepresentation,
            customBackgroundColor: schemaNode.customBackgroundColor,
            customTitleColor: schemaNode.customTitleColor
        )
    }
}
