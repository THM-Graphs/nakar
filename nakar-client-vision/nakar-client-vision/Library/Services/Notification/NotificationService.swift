//
//  MessageService.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 26.03.25.
//

import Combine
import UIKit

class NotificationService: NSObject, Service, UNUserNotificationCenterDelegate {
    let wsService: WSService
    let logger: LoggerService

    private var cancellables: Set<AnyCancellable>

    init(wsService: WSService, logger: LoggerService) {
        self.wsService = wsService
        self.logger = logger
        cancellables = []
    }

    func bootstrap() async {
        wsService.onWSEventNotification.sink { event in
            let content = UNMutableNotificationContent()
            content.title = event.title
            content.body = event.message
            content.sound = .default

            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 0.1, repeats: false)
            let request = UNNotificationRequest(identifier: "WSEventNotification", content: content, trigger: trigger)

            UNUserNotificationCenter.current().add(request)
        }.store(in: &cancellables)

        Task {
            do {
                let result = try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge])
                if result {
                    self.logger.log(sender: self, message: "✅ Notification permission granted: \(result)")
                    UNUserNotificationCenter.current().delegate = self
                } else {
                    self.logger.error(sender: self, message: "❌ Permission denied.")
                }
            } catch let err {
                self.logger.error(sender: self, message: "❌ Permission denied: \(err.localizedDescription)")
            }
        }
    }

    func destory() async {
        cancellables.forEach {
            $0.cancel()
        }
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound])
    }
}
