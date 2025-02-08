//
//  SocketIOManagerDelegate.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

protocol SocketIOManagerDelegate: AnyObject {
    func onClientConnect()
    func onClientDisconnect(reason: String)
    func onWSEventScenarioLoaded(event: Components.Schemas.WSEventScenarioLoaded)
    func onWSEventNodesMoved(event: Components.Schemas.WSEventNodesMoved)
    func onWSEventNotification(event: Components.Schemas.WSEventNotification)
    func onWSEventScenarioProgress(event: Components.Schemas.WSEventScenarioProgress)
}
