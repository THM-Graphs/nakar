//
//  ExpandableListEntry.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 24.03.25.
//

import SwiftUI

struct ExpandableListEntryView<Content: View, Children: View>: View {
    @ViewBuilder let content: () -> Content
    @ViewBuilder let children: () -> Children

    @State var collapsed: Bool = true

    var body: some View {
        Button {
            collapsed.toggle()
        } label: {
            HStack {
                Image(systemName: collapsed ? "chevron.right" : "chevron.down")
                    .frame(width: 25)
                content()
            }
        }
        if !collapsed {
            children()
                .padding(.leading, 20)
        }
    }
}

#Preview(windowStyle: .automatic) {
    List {
        ExpandableListEntryView {
            Text("Element")
        } children: {
            ExpandableListEntryView {
                Text("Element")
            } children: {
                Text("Children1")
                Text("Children2")
            }
            ExpandableListEntryView {
                Text("Element")
            } children: {
                Text("Children1")
                Text("Children2")
            }
        }
        ExpandableListEntryView {
            Text("Element")
        } children: {
            Text("Children1")
            Text("Children2")
        }
        ExpandableListEntryView {
            Text("Element")
        } children: {
            Text("Children1")
            Text("Children2")
        }
    }
}
