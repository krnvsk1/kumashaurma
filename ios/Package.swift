// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "Kumashaurma",
    platforms: [.iOS(.v16), .macOS(.v13)],
    products: [
        .executable(
            name: "Kumashaurma",
            targets: ["Kumashaurma"]
        ),
    ],
    targets: [
        .executableTarget(
            name: "Kumashaurma",
            dependencies: [],
            path: "Sources"
        ),
    ]
)
