import Foundation

// MARK: - App State

class AppState: ObservableObject {
    @Published var isAuthenticated: Bool = false
    @Published var isLoading: Bool = false

    init() {
        isAuthenticated = APIClient.shared.isAuthenticated
    }
}
