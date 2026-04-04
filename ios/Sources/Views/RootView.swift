import SwiftUI

// MARK: - Root View (Auth Gate)

struct RootView: View {
    @StateObject private var authService = AuthService.shared

    var body: some View {
        Group {
            if authService.isAuthenticated {
                ContentView()
                    .transition(.opacity)
            } else {
                AuthView()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.3), value: authService.isAuthenticated)
    }
}
