//
//  ImmersiveView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.12.24.
//

import SwiftUI
import RealityKit

struct ImmersiveView: View {
    var body: some View {
        RealityView { content in
            let min: Float = -1
            let step: Float = 0.5
            let max: Float = 1

            var x = min
            while x <= max {
                x += step
                var y = min
                while y <= max {
                    y += step
                    var z = min
                    while z <= max {
                        z += step

                        // Create a sphere mesh
                        let sphereMesh = MeshResource.generateSphere(radius: step / 10)

                        // Create a material
                        let material = SimpleMaterial(color: .red, isMetallic: true)

                        // Create a model entity with the mesh and material
                        let sphereEntity = ModelEntity(mesh: sphereMesh, materials: [material])

                        // Set the position of the sphere
                        sphereEntity.position = SIMD3(x: x, y: y, z: z)

                        content.add(sphereEntity)

                        print("Did add object at \(sphereEntity.position)")
                    }
                }
            }
        }
    }
}

#Preview(windowStyle: .volumetric) {
    ImmersiveView()
}
