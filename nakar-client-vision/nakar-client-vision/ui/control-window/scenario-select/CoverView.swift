//
//  CoverView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI

struct CoverView: View {
    let url: URL?

    private let size: CGFloat = 50

    var body: some View {
        AsyncImage(url: url, content: { image in
            image
                .resizable()
        }, placeholder: {
            ZStack {
                Image(systemName: "gearshape")
                    .resizable()
                    .padding(15)
            }
        })
        .frame(width: size, height: size)
        .background(.regularMaterial)
        .clipShape(.circle)
    }
}

#Preview {
    CoverView(url: nil)
    CoverView(url: URL(string: "https://fastly.picsum.photos/id/904/200/200.jpg?hmac=QegM9tS4hRwLbLWCb2W91mYYovO_itG2JmSQiz0PnrM"))
}
