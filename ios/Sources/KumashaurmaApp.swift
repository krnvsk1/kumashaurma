import SwiftUI

@main
struct KumashaurmaApp: App {
    @StateObject private var themeManager = ThemeManager.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .preferredColorScheme(themeManager.colorScheme)
        }
    }
}
