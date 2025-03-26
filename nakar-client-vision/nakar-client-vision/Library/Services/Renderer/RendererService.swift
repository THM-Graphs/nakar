//
//  RendererViewController.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

import RealityKit
import SwiftUI
import Combine

@MainActor
class RendererService: Service {
    let meshCache: MeshCache
    let logger: LoggerService

    init(loggerService: LoggerService) {
        meshCache = MeshCache(logger: loggerService)
        logger = loggerService
    }

    func bootstrap() async {
        /* */
    }

    func destory() async {
        /* */
    }

    func createEdgeEntity(physicalEdge: Components.Schemas.Edge, source: Entity, target: Entity, globalScale: RendererService.GlobalScale) async -> Entity {
        let entity = Entity()
        let start: SIMD3<Float> = [source.position.x, source.position.y, globalScale.defaultDepth]
        let end: SIMD3<Float> = [target.position.x, target.position.y, globalScale.defaultDepth]

        // Line
        // let lineMaterial = UnlitMaterial(color: .white)
        var lineMaterial = PhysicallyBasedMaterial()
        lineMaterial.baseColor = .init(tint: .black)
        lineMaterial.sheen = .init(tint: .black)
        lineMaterial.emissiveColor = .init(color: .white)
        lineMaterial.emissiveIntensity = 2
        let lineThickness = globalScale.elementThickness / 2
        let lineMesh = await meshCache.generateCurve(
            curvature: Float(physicalEdge.parallelIndex) * globalScale.curvature * globalScale.defaultScale,
            width: Float(physicalEdge.width) * globalScale.defaultScale,
            length: 1,
            thickness: lineThickness
        )
        let lineEntity = ModelEntity(mesh: lineMesh, materials: [lineMaterial, lineMaterial])
        jiggleZPosition(&lineEntity.position.z, globalScale: globalScale)
        entity.addChild(lineEntity)

        // Title Label
        var textString = AttributedString(physicalEdge._type)
        let fontSize: CGFloat = 12
        textString.font = .systemFont(ofSize: fontSize, weight: .bold)
        textString.foregroundColor = .black
        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.alignment = .center
        textString.paragraphStyle = paragraphStyle
        var textComponent = TextComponent()
        textComponent.text = textString
        textComponent.backgroundColor = CGColor.init(gray: 1, alpha: 1)
        textComponent.cornerRadius = 4
        textComponent.edgeInsets = TextComponent.EdgeInsets(top: 4, left: 8, bottom: 4, right: 8)
        let height = textString.height() + 8
        let width = textString.width() + 16
        textComponent.size = CGSize(width: width, height: height)
        let textEntity = Entity()
        textEntity.components.set(textComponent)
        textEntity.scale = SIMD3<Float>(SIMD2<Float>(repeating: 2.8), 1) // idk why
        textEntity.position.z = lineEntity.position.z + lineThickness / 2
        jiggleZPosition(&textEntity.position.z, globalScale: globalScale)
        entity.addChild(textEntity)

        // Hover
        textEntity.components.set(InputTargetComponent())
        textEntity.components.set(CollisionComponent(
            shapes: [ShapeResource.generateBox(width: Float(width), height: Float(height), depth: globalScale.elementThickness)]
        ))
        textEntity.components.set(HoverEffectComponent(.highlight(.init(color: .black, strength: 1))))

        // Edge
        entity.components.set(
            EdgeComponent(
                physicalEdge: physicalEdge,
                source: source,
                target: target,
                lineEntity: lineEntity,
                textEntity: textEntity,
                globalScale: globalScale,
                logger: logger
            )
        )

        return entity
    }

    func createNodeEntity(physicalNode: Components.Schemas.Node, globalScale: RendererService.GlobalScale, metaData: Components.Schemas.GraphMetaData) throws -> Entity {
        let entity = Entity()
        entity.position = nativeNodePosition(physicalNode: physicalNode, globalScale: globalScale)

        // Model
        // let material = UnlitMaterial(color: renderer.backgroundColorOfNode(physicalNode: physicalNode).platformNative)
        let material = SimpleMaterial(color: UIColor(cgColor: backgroundColorOfNode(physicalNode: physicalNode, metaData: metaData)), isMetallic: false)
        let radius = Float(physicalNode.radius) * globalScale.defaultScale
        let mesh = meshCache.generateCircle(radius: radius, thickness: globalScale.elementThickness)
        let model = ModelEntity(mesh: mesh, materials: [material])
        model.transform.rotation = simd_quatf.init(angle: .pi / 2, axis: SIMD3<Float>.init(x: 1, y: 0, z: 0))
        jiggleZPosition(&model.position.z, globalScale: globalScale)
        entity.addChild(model)

        // Node
        entity.components.set(NodeComponent(source: physicalNode, globalScale: globalScale, rendererService: self, logger: logger))

        // Hover
        model.components.set(InputTargetComponent())
        model.components.set(CollisionComponent(
            shapes: [ShapeResource.generateSphere(radius: Float(physicalNode.radius) * globalScale.defaultScale)]
        ))
        model.components.set(HoverEffectComponent(.highlight(.init(color: .white, strength: 1))))

        // Title Label
        var textString = AttributedString(physicalNode.title)
        let fontSize: CGFloat = (CGFloat(physicalNode.radius) / 5 + 3)
        textString.font = .systemFont(ofSize: fontSize, weight: .bold)
        textString.foregroundColor = .white
        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.alignment = .center
        textString.paragraphStyle = paragraphStyle
        var textComponent = TextComponent()
        textComponent.text = textString
        let height = min(textString.height(withWidth: physicalNode.radius * 2), physicalNode.radius * 2)
        textComponent.size = CGSize(width: physicalNode.radius * 2, height: height)
        let textEntity = Entity()
        textEntity.components.set(textComponent)
        textEntity.scale = SIMD3<Float>(SIMD2<Float>(repeating: 2.8), 1) // idk why
        textEntity.position.z = model.position.z + globalScale.elementThickness / 2
        entity.addChild(textEntity)


        return entity
    }

    func colorFrom(hex: String) -> CGColor? {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()

        if hexSanitized.hasPrefix("#") {
            hexSanitized.removeFirst()
        }

        if hexSanitized.count == 3 {
            hexSanitized = hexSanitized.map { "\($0)\($0)" }.joined()
        }

        guard hexSanitized.count == 6 else {
            logger.error(sender: self, message: "Cannot convert \(hex) into uicolor.")
            return nil
        }

        var rgbValue: UInt64 = 0
        Scanner(string: hexSanitized).scanHexInt64(&rgbValue)

        let red = CGFloat((rgbValue >> 16) & 0xFF) / 255.0
        let green = CGFloat((rgbValue >> 8) & 0xFF) / 255.0
        let blue = CGFloat(rgbValue & 0xFF) / 255.0

        return CGColor(red: red, green: green, blue: blue, alpha: 1)
    }

    func nativeNodePosition(physicalNode: Components.Schemas.Node, globalScale: GlobalScale) -> SIMD3<Float> {
        return [
            Float(physicalNode.position.x) * globalScale.defaultScale,
            -Float(physicalNode.position.y) * globalScale.defaultScale + globalScale.personHeight,
            globalScale.defaultDepth
        ]
    }

    func backgroundColorOfNode(physicalNode: Components.Schemas.Node, metaData: Components.Schemas.GraphMetaData) -> CGColor {
        if let customBackgroundColor = physicalNode.customBackgroundColor, let color = colorFrom(hex: customBackgroundColor) {
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
        case .customColor(let customColor): return colorFrom(hex: customColor.backgroundColor) ?? backgroundColor(index: ._0)
        }
    }

    func backgroundColor(index: Components.Schemas.PresetColorIndex) -> CGColor {
        switch index {
        case ._0: return colorFrom(hex: "#3B71CA")!
        case ._1: return colorFrom(hex: "#14A44D")!
        case ._2: return colorFrom(hex: "#DC4C64")!
        case ._3: return colorFrom(hex: "#E4A11B")!
        case ._4: return colorFrom(hex: "#54B4D3")!
        case ._5: return colorFrom(hex: "#332D2D")!
        }
    }

    func jiggleZPosition(_ zPosition: inout Float, globalScale: GlobalScale) {
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

    func raycastToCustomPlane(from origin: SIMD3<Float>,
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

