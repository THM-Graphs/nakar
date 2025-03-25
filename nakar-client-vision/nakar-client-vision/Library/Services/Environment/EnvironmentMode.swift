//
//  EnvironmentMode.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 23.03.25.
//

enum EnvironmentMode: CustomStringConvertible {
    case production
    case development

    var description: String {
        switch self {
        case .production: return "Production"
        case .development: return "Development"
        }
    }
}
