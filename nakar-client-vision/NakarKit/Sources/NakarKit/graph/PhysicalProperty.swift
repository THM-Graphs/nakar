//
//  PhysicalProperty.swift
//  NakarKit
//
//  Created by Samuel Schepp on 11.02.25.
//

import Foundation

public struct PhysicalProperty: Equatable {
    public var slug: String
    public var value: String

    init(slug: String, value: String) {
        self.slug = slug
        self.value = value
    }

    init(of schemaProperty: Components.Schemas.GraphProperty) {
        self.init(slug: schemaProperty.slug, value: schemaProperty.value.jsonStringRepresentation)
    }
}
