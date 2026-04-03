import Foundation
import Combine

// MARK: - Auth Service

@MainActor
final class AuthService: ObservableObject {
    static let shared = AuthService()

    // MARK: - Published State

    @Published private(set) var currentUser: User?
    @Published private(set) var isAuthenticated: Bool = false
    @Published private(set) var isLoading: Bool = false

    var userName: String {
        currentUser?.displayName ?? ""
    }

    private init() {
        isAuthenticated = APIClient.shared.isAuthenticated
    }

    // MARK: - Auth Methods

    func sendCode(phone: String) async throws {
        isLoading = true
        defer { isLoading = false }
        try await APIClient.shared.sendCode(phone: phone)
    }

    func verifyCode(phone: String, code: String) async throws -> Bool {
        isLoading = true
        defer { isLoading = false }

        // The existing APIClient saves tokens automatically on verify/register
        let response = try await APIClient.shared.verifyCode(phone: phone, code: code)

        // If tokens returned → existing user logged in
        if response.accessToken != nil {
            currentUser = response.user
            isAuthenticated = true
            return false // not a new user
        }

        // No tokens → new user, needs registration
        return true
    }

    func register(phone: String, firstName: String, lastName: String) async throws {
        isLoading = true
        defer { isLoading = false }

        // The existing APIClient saves tokens automatically on register
        let response = try await APIClient.shared.register(
            firstName: firstName,
            lastName: lastName,
            phone: phone
        )

        if response.accessToken != nil {
            currentUser = response.user
            isAuthenticated = true
        }
    }

    func logout() async {
        isLoading = true
        defer { isLoading = false }

        try? await APIClient.shared.logout()
        currentUser = nil
        isAuthenticated = false
    }

    func fetchCurrentUser() async {
        isLoading = true
        defer { isLoading = false }

        do {
            let user = try await APIClient.shared.getMe()
            currentUser = user
            isAuthenticated = true
        } catch {
            currentUser = nil
            isAuthenticated = false
        }
    }
}
