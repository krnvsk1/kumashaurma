import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case unauthorized
    case serverError(code: Int, message: String)
    case networkError(Error)
    case decodingError(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Неверный URL"
        case .invalidResponse: return "Неверный ответ сервера"
        case .unauthorized: return "Требуется авторизация"
        case .serverError(let code, let message): return "Ошибка \(code): \(message)"
        case .networkError(let error): return "Ошибка сети: \(error.localizedDescription)"
        case .decodingError(let error): return "Ошибка обработки данных: \(error.localizedDescription)"
        }
    }

    var failureReason: Error? {
        switch self {
        case .networkError(let error): return error
        case .decodingError(let error): return error
        default: return nil
        }
    }
}

class APIClient {
    static let shared = APIClient()

    private let baseURL: String
    private let session: URLSession
    private var accessToken: String? {
        didSet { UserDefaults.standard.set(accessToken, forKey: "accessToken") }
    }
    private var refreshToken: String? {
        didSet { UserDefaults.standard.set(refreshToken, forKey: "refreshToken") }
    }

    var isAuthenticated: Bool { accessToken != nil }

    init(baseURL: String = "http://localhost:5199/api") {
        self.baseURL = baseURL
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: config)

        self.accessToken = UserDefaults.standard.string(forKey: "accessToken")
        self.refreshToken = UserDefaults.standard.string(forKey: "refreshToken")
    }

    // MARK: - Generic Request
    private func request<T: Decodable>(
        path: String,
        method: String = "GET",
        body: Encodable? = nil,
        queryItems: [URLQueryItem]? = nil
    ) async throws -> T {
        guard let url = URL(string: baseURL + path) else { throw APIError.invalidURL }
        var components = URLComponents(url: url)
        if let items = queryItems { components.queryItems = items }
        guard let finalURL = components.url else { throw APIError.invalidURL }

        var request = URLRequest(url: finalURL)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            let encoder = JSONEncoder()
            encoder.keyEncodingStrategy = .convertToSnakeCase
            request.httpBody = try encoder.encode(body)
        }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        switch httpResponse.statusCode {
        case 200...299:
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            return try decoder.decode(T.self, from: data)
        case 401:
            // Try to refresh token
            let refreshed = try await refreshTokens()
            if refreshed {
                // Retry the original request
                return try await request(
                    path: path,
                    method: method,
                    body: body,
                    queryItems: queryItems
                )
            }
            throw APIError.unauthorized
        default:
            if let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
               let message = json["message"] as? String {
                throw APIError.serverError(code: httpResponse.statusCode, message: message)
            }
            throw APIError.serverError(code: httpResponse.statusCode, message: "Ошибка сервера")
        }
    }

    // MARK: - Auth
    func sendCode(phone: String) async throws {
        let _: AuthResponse = try await request(
            path: "/auth/send-code",
            method: "POST",
            body: SendCodeRequest(phone: phone)
        )
    }

    func verifyCode(phone: String, code: String) async throws -> AuthResponse {
        let response: AuthResponse = try await request(
            path: "/auth/verify",
            method: "POST",
            body: VerifyRequest(phone: phone, code: code)
        )

        if let token = response.accessToken {
            self.accessToken = token
        }
        if let refresh = response.refreshToken {
            self.refreshToken = refresh
        }

        return response
    }

    func register(firstName: String, lastName: String, phone: String) async throws -> AuthResponse {
        let response: AuthResponse = try await request(
            path: "/auth/register",
            method: "POST",
            body: RegisterRequest(phone: phone, firstName: firstName, lastName: lastName)
        )

        if let token = response.accessToken {
            self.accessToken = token
        }
        if let refresh = response.refreshToken {
            self.refreshToken = refresh
        }

        return response
    }

    func getMe() async throws -> User {
        let response: APIResponse<User> = try await request(path: "/auth/me")
        guard let user = response.data else { throw APIError.invalidResponse }
        return user
    }

    func logout() async throws {
        guard let refresh = refreshToken else { return }
        let _: APIResponse<EmptyResponse> = try await request(
            path: "/auth/logout",
            method: "POST",
            body: RefreshRequest(refreshToken: refresh)
        )
        accessToken = nil
        refreshToken = nil
    }

    private func refreshTokens() async throws -> Bool {
        guard let refresh = refreshToken else { return false }

        let response: AuthResponse = try await request(
            path: "/auth/refresh",
            method: "POST",
            body: RefreshRequest(refreshToken: refresh)
        )

        if let token = response.accessToken {
            self.accessToken = token
        }
        if let newRefresh = response.refreshToken {
            self.refreshToken = newRefresh
        }

        return true
    }

    // MARK: - Menu
    func getCategories() async throws -> [String] {
        try await request(path: "/shawarma/categories")
    }

    func getMenu() async throws -> [Shawarma] {
        try await request(path: "/shawarma")
    }

    func getShawarma(id: Int) async throws -> Shawarma {
        try await request(path: "/shawarma/\(id)")
    }

    func getShawarmaAddons(shawarmaId: Int) async throws -> [AddonCategory] {
        try await request(path: "/addons/shawarma/\(shawarmaId)")
    }

    // MARK: - Images
    func getImageURL(_ filePath: String) -> URL? {
        let base = baseURL.replacingOccurrences(of: "/api", with: "")
        return URL(string: base + filePath)
    }

    // MARK: - Orders
    func createOrder(request: CreateOrderRequest) async throws -> Order {
        try await request(path: "/orders", method: "POST", body: request)
    }

    func getMyOrders() async throws -> [Order] {
        try await request(path: "/orders/my")
    }

    func getOrder(id: Int) async throws -> Order {
        try await request(path: "/orders/\(id)")
    }
}

private struct EmptyResponse: Codable {}
