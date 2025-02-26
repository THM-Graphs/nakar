//
//  RendererViewController.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

import RealityKit
import SwiftUI
import Combine

class RendererTools {
    private init() {}

    class func backgroundColorOfNode(physicalNode: Components.Schemas.Node, metaData: Components.Schemas.GraphMetaData) -> CGColor {
        if let customBackgroundColor = physicalNode.customBackgroundColor, let color = CGColor.from(hex: customBackgroundColor) {
            return color
        }
        guard let firstLabel = physicalNode.labels.first else {
            return backgroundColor(index: ._0)
        }
        guard let foundLabel = metaData.labels.first(where: { $0.label == firstLabel }) else {
            return backgroundColor(index: ._0)
        }
        switch foundLabel.color {
        case .presetColor(let presetColor): return backgroundColor(index: presetColor.index)
        case .customColor(let customColor): return CGColor.from(hex: customColor.backgroundColor) ?? backgroundColor(index: ._0)
        }
    }

    class func backgroundColor(index: Components.Schemas.PresetColorIndex) -> CGColor {
        switch index {
        case ._0: return CGColor.from(hex: "#3B71CA")!
        case ._1: return CGColor.from(hex: "#14A44D")!
        case ._2: return CGColor.from(hex: "#DC4C64")!
        case ._3: return CGColor.from(hex: "#E4A11B")!
        case ._4: return CGColor.from(hex: "#54B4D3")!
        case ._5: return CGColor.from(hex: "#332D2D")!
        }
    }

    class func jiggleZPosition(_ zPosition: inout Float, globalScale: GlobalScale) {
        zPosition =  zPosition + Float.random(in: -(globalScale.elementThickness*0.01)...(globalScale.elementThickness*0.01))
    }

    struct GlobalScale {
        let defaultDepth: Float
        let personHeight: Float
        let defaultScale: Float
        let elementThickness: Float
        let curvature: Float = 15
        let fps: Float = 30.0
        let maxSpeed: Float = 500.0

        init(mode: Mode) {
            switch mode {
            case .immersiveSpace:
                defaultDepth = -3
                defaultScale = 0.001
                personHeight = 1.7
                elementThickness = 0.01
            case .window:
                defaultDepth = 0
                defaultScale = 0.001
                personHeight = 0
                elementThickness = 0.0001
            case .volumentricWindow:
                defaultDepth = 0
                defaultScale = 0.001
                personHeight = 0
                elementThickness = 0.01
            }
        }

        enum Mode {
            case window
            case volumentricWindow
            case immersiveSpace
        }
    }

    class func raycastToCustomPlane(from origin: SIMD3<Float>,
                                    direction: SIMD3<Float>,
                                    planePoint: SIMD3<Float>,
                                    planeNormal: SIMD3<Float>) -> SIMD3<Float>? {

        let denom = simd_dot(direction, planeNormal)

        // Check if the ray is parallel to the plane
        if abs(denom) < 1e-6 { return nil }

        let t = simd_dot((planePoint - origin), planeNormal) / denom

        // If t is negative, the intersection is behind the ray origin
        if t < 0 { return nil }

        return origin + t * direction
    }
}

