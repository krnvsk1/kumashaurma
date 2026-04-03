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

    var isAdmin: Bool {
        guard let roles = currentUser?.roles else { return false }
        return roles.contains("admin") || roles.contains("manager")
    }

    private init() {
        isAuthenticated = APIClient.shared.isAuthenticated
        // Validate saved token on app launch
        if isAuthenticated {
            Task { await validateSession() }
        }
    }

    // MARK: - Session Validation

    /// Validates the current token by calling /auth/me.
    /// Called on app launch — if token is invalid, redirects to auth.
    private func validateSession() async {
        do {
            let user = try await APIClient.shared.getMe()
            currentUser = user
            isAuthenticated = true
        } catch {
            // Token invalid or expired — redirect to auth
            currentUser = nil
            isAuthenticated = false
        }
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
        } catch APIError.unauthorized {
            // Don't redirect to auth — just clear user data
            // The session will be re-validated on next app launch
            currentUser = nil
        } catch {
            // Network error, server error — keep session
        }
    }
}
