//
//  Loadable.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

enum Loadable<T> {
    case nothing
    case loading
    case error(error: Error)
    case data(data: T)
}
