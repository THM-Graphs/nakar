//
//  AttributedString.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

import Foundation
import SwiftUI

extension AttributedString {
    func height(withWidth width: CGFloat? = nil) -> CGFloat {
        let nsAttributedString = NSAttributedString(self)
        let framesetter = CTFramesetterCreateWithAttributedString(nsAttributedString)
        let targetSize = CGSize(width: width ?? CGFloat.greatestFiniteMagnitude, height: CGFloat.greatestFiniteMagnitude)
        let boundingBox = CTFramesetterSuggestFrameSizeWithConstraints(framesetter, CFRangeMake(0, nsAttributedString.length), nil, targetSize, nil)

        return ceil(boundingBox.height) + 1
    }

    func width() -> CGFloat {
        let nsAttributedString = NSAttributedString(self)
        let framesetter = CTFramesetterCreateWithAttributedString(nsAttributedString)
        let boundingBox = CTFramesetterSuggestFrameSizeWithConstraints(framesetter, CFRangeMake(0, nsAttributedString.length), nil, CGSize.init(width: CGFloat.greatestFiniteMagnitude, height: CGFloat.greatestFiniteMagnitude), nil)

        return ceil(boundingBox.width) + 1
    }
}
