//
//  OpenAPIValueContainer.swift
//  NakarKit
//
//  Created by Samuel Schepp on 11.02.25.
//

import OpenAPIRuntime
import Foundation

extension OpenAPIValueContainer {
    public var jsonStringRepresentation: String {
        #warning("Check if this is right")
        do {
            guard let nativeObject = self.value else {
                return "null"
            }

            if !JSONSerialization.isValidJSONObject(nativeObject) {
                return "null"
            }

            let jsonData = try JSONSerialization.data(withJSONObject: nativeObject)
            guard let jsonString = String(data: jsonData, encoding: .utf8) else {
                return "null"
            }

            return jsonString
        } catch let error {
            print(error)
            return "null"
        }
    }
}
