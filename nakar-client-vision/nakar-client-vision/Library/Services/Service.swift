//
//  Service.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 23.03.25.
//

@MainActor
protocol Service {
    func bootstrap() async
    func destory() async
}
