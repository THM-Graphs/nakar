//
//  MeshCache.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 13.02.25.
//

import RealityKit
import SwiftUI

class MeshCache {
    private var circles: [Int: MeshResource]
    private var lines: [Int: MeshResource]
    private var curves: [Int: MeshResource]

    init() {
        circles = [:]
        lines = [:]
        curves = [:]
    }

    func generateLine(length: Float, width: Float, thickness: Float) -> MeshResource {
        let hashKey = [length, width, thickness].hashValue;
        if let mesh = lines[hashKey] {
            return mesh
        } else {
            let mesh = MeshResource.generateBox(size: [length, width, thickness])
            lines[hashKey] = mesh
            return mesh
        }
    }

    func generateCircle(radius: Float, thickness: Float) -> MeshResource {
        let hashKey = [radius, thickness].hashValue;
        if let mesh = circles[hashKey] {
            return mesh
        } else {
            let mesh = MeshResource.generateCylinder(height: thickness, radius: radius)
            circles[hashKey] = mesh
            return mesh
        }
    }

    func generateCurve(curvature: Float, width: Float, length: Float, thickness: Float) async -> MeshResource {
        let hashKey = [curvature, width, length, thickness].hashValue;
        if let mesh = curves[hashKey] {
            return mesh
        } else {
            do {
                let graphic = SwiftUI.Path { (path: inout SwiftUI.Path) in
                    let start = CGPoint(x: 0, y: 0)
                    let topStart = CGPoint(x: 0, y: Double(width) / 2.0)
                    let topCurve = CGPoint(x: Double(length) / 2.0, y: Double(curvature) + Double(width) / 2.0)
                    let topEnd = CGPoint(x: Double(length), y: Double(width) / 2.0)
                    let bottomEnd = CGPoint(x: Double(length), y: -Double(width) / 2.0)
                    let bottomCurve = CGPoint(x: Double(length) / 2.0, y: Double(curvature) - Double(width) / 2.0)
                    let bottomStart = CGPoint(x: 0, y: -Double(width) / 2.0)

                    path.move(to: start)
                    path.addLine(to: topStart)
                    path.addLine(to: topCurve)
                    path.addLine(to: topEnd)
                    path.addLine(to: bottomEnd)
                    path.addLine(to: bottomCurve)
                    path.addLine(to: bottomStart)
                    path.closeSubpath()
                }
                var options = MeshResource.ShapeExtrusionOptions()
                options.extrusionMethod = .linear(depth: thickness)
                options.boundaryResolution = .uniformSegmentsPerSpan(segmentCount: 8)
                options.chamferRadius = 0
                let mesh = try await MeshResource(extruding: graphic, extrusionOptions: options)
                curves[hashKey] = mesh
                return mesh
            } catch let error {
                print(error)
                return generateLine(length: length, width: width, thickness: thickness)
            }
        }

    }
}
