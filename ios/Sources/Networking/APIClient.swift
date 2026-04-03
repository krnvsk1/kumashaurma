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

final class APIClient: @unchecked Sendable {
    static let shared = APIClient()
    private let lock = NSLock()

    private let baseURL: String
    private let session: URLSession
    private var _accessToken: String?
    private var accessToken: String? {
        get { lock.withLock { _accessToken } }
        set { lock.withLock { _accessToken = newValue; UserDefaults.standard.set(newValue, forKey: "accessToken") } }
    }
    private var _refreshToken: String?
    private var refreshToken: String? {
        get { lock.withLock { _refreshToken } }
        set { lock.withLock { _refreshToken = newValue; UserDefaults.standard.set(newValue, forKey: "refreshToken") } }
    }

    var isAuthenticated: Bool { accessToken != nil }

    init(baseURL: String = "http://localhost:5199/api") {
        self.baseURL = baseURL
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: config)

        lock.withLock {
            _accessToken = UserDefaults.standard.string(forKey: "accessToken")
            _refreshToken = UserDefaults.standard.string(forKey: "refreshToken")
        }
    }

    // MARK: - Generic Request

    private func request<T: Decodable>(
        path: String,
        method: String = "GET",
        body: Encodable? = nil,
        queryItems: [URLQueryItem]? = nil
    ) async throws -> T {
        guard let url = URL(string: baseURL + path) else { throw APIError.invalidURL }
        guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            throw APIError.invalidURL
        }
        if let items = queryItems { components.queryItems = items }
        guard let finalURL = components.url else { throw APIError.invalidURL }

        var urlRequest = URLRequest(url: finalURL)
        urlRequest.httpMethod = method
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = self.accessToken {
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            let encoder = JSONEncoder()
            encoder.keyEncodingStrategy = .convertToSnakeCase
            urlRequest.httpBody = try encoder.encode(body)
        }

        let (data, response) = try await session.data(for: urlRequest)

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

    // MARK: - Raw Request (for multipart / special cases)

    private func rawRequest(
        path: String,
        method: String = "GET",
        body: Data? = nil,
        contentType: String = "application/json",
        queryItems: [URLQueryItem]? = nil
    ) async throws -> (Data, HTTPURLResponse) {
        guard let url = URL(string: baseURL + path) else { throw APIError.invalidURL }
        guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            throw APIError.invalidURL
        }
        if let items = queryItems { components.queryItems = items }
        guard let finalURL = components.url else { throw APIError.invalidURL }

        var urlRequest = URLRequest(url: finalURL)
        urlRequest.httpMethod = method
        urlRequest.setValue(contentType, forHTTPHeaderField: "Content-Type")

        if let token = self.accessToken {
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            urlRequest.httpBody = body
        }

        let (data, response) = try await session.data(for: urlRequest)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        return (data, httpResponse)
    }

    // MARK: - Auth

    func sendCode(phone: String) async throws {
        let _: SendCodeResponse = try await request(
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
        guard let refresh = self.refreshToken else { return }
        let _: APIResponse<EmptyResponse> = try await self.request(
            path: "/auth/logout",
            method: "POST",
            body: RefreshRequest(refreshToken: refresh)
        )
        self.accessToken = nil
        self.refreshToken = nil
    }

    private func refreshTokens() async throws -> Bool {
        guard let refresh = self.refreshToken else { return false }

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

    // MARK: - Admin: Menu CRUD

    func createShawarma(request: CreateShawarmaRequest) async throws -> Shawarma {
        try await request(path: "/shawarma", method: "POST", body: request)
    }

    func updateShawarma(id: Int, request: UpdateShawarmaRequest) async throws -> Shawarma {
        try await request(path: "/shawarma/\(id)", method: "PUT", body: request)
    }

    func deleteShawarma(id: Int) async throws {
        let _: APIResponse<EmptyResponse> = try await request(path: "/shawarma/\(id)", method: "DELETE")
    }

    func updateShawarmaAvailability(id: Int, isAvailable: Bool) async throws {
        struct AvailabilityRequest: Encodable {
            let isAvailable: Bool
        }
        let _: APIResponse<Shawarma> = try await request(path: "/shawarma/\(id)", method: "PUT", body: AvailabilityRequest(isAvailable: isAvailable))
    }

    // MARK: - Images

    func getImageURL(_ filePath: String) -> URL? {
        let base = baseURL.replacingOccurrences(of: "/api", with: "")
        return URL(string: base + filePath)
    }

    func getShawarmaImages(shawarmaId: Int) async throws -> [ImageInfo] {
        try await request(path: "/image/shawarma/\(shawarmaId)")
    }

    func uploadImage(shawarmaId: Int, imageData: Data, fileName: String) async throws -> ImageUploadResponse {
        let boundary = UUID().uuidString
        let contentType = "multipart/form-data; boundary=\(boundary)"

        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)

        let (data, response) = try await rawRequest(
            path: "/image/upload/\(shawarmaId)",
            method: "POST",
            body: body,
            contentType: contentType
        )

        guard (200...299).contains(response.statusCode) else {
            if let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
               let message = json["message"] as? String {
                throw APIError.serverError(code: response.statusCode, message: message)
            }
            throw APIError.serverError(code: response.statusCode, message: "Ошибка загрузки")
        }

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(ImageUploadResponse.self, from: data)
    }

    func deleteImage(id: Int) async throws {
        let (data, response) = try await rawRequest(
            path: "/image/\(id)",
            method: "DELETE"
        )

        guard (200...299).contains(response.statusCode) else {
            if let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
               let message = json["message"] as? String {
                throw APIError.serverError(code: response.statusCode, message: message)
            }
            throw APIError.serverError(code: response.statusCode, message: "Ошибка удаления")
        }
    }

    // MARK: - Orders

    func createOrder(orderRequest: CreateOrderRequest) async throws -> Order {
        try await self.request(path: "/orders", method: "POST", body: orderRequest)
    }

    func getMyOrders() async throws -> [Order] {
        try await request(path: "/orders/my")
    }

    func getOrder(id: Int) async throws -> Order {
        try await request(path: "/orders/\(id)")
    }

    // MARK: - Admin: Orders

    func getAllOrders() async throws -> [Order] {
        try await request(path: "/orders")
    }

    func getOrderStats() async throws -> OrderStats {
        try await request(path: "/orders/stats")
    }

    func updateOrderStatus(orderId: Int, status: String) async throws -> Order {
        struct StatusRequest: Encodable {
            let status: String
        }
        return try await request(path: "/orders/\(orderId)/status", method: "PATCH", body: StatusRequest(status: status))
    }

    func updateOrder(orderId: Int, request: UpdateOrderRequest) async throws -> Order {
        try await request(path: "/orders/\(orderId)", method: "PUT", body: request)
    }

    func deleteOrder(orderId: Int) async throws {
        let _: APIResponse<EmptyResponse> = try await request(path: "/orders/\(orderId)", method: "DELETE")
    }

    // MARK: - Admin: Users

    func getUsers() async throws -> [UserListItem] {
        try await request(path: "/users")
    }

    func assignRole(userId: Int, role: String) async throws {
        struct RoleRequest: Encodable {
            let role: String
        }
        let _: APIResponse<EmptyResponse> = try await request(
            path: "/users/\(userId)/roles",
            method: "POST",
            body: RoleRequest(role: role)
        )
    }

    func removeRole(userId: Int, role: String) async throws {
        let (data, response) = try await rawRequest(
            path: "/users/\(userId)/roles/\(role)",
            method: "DELETE"
        )

        guard (200...299).contains(response.statusCode) else {
            if let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
               let message = json["message"] as? String {
                throw APIError.serverError(code: response.statusCode, message: message)
            }
            throw APIError.serverError(code: response.statusCode, message: "Ошибка")
        }
    }

    // MARK: - Admin: Addons

    func getAddonCategories() async throws -> [AddonCategory] {
        try await request(path: "/addons/categories")
    }

    func createAddonCategory(request: CreateAddonCategoryRequest) async throws -> AddonCategory {
        try await request(path: "/addons/categories", method: "POST", body: request)
    }

    func updateAddonCategory(id: Int, request: UpdateAddonCategoryRequest) async throws -> AddonCategory {
        try await request(path: "/addons/categories/\(id)", method: "PUT", body: request)
    }

    func deleteAddonCategory(id: Int) async throws {
        let (data, response) = try await rawRequest(
            path: "/addons/categories/\(id)",
            method: "DELETE"
        )

        guard (200...299).contains(response.statusCode) else {
            if let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
               let message = json["message"] as? String {
                throw APIError.serverError(code: response.statusCode, message: message)
            }
            throw APIError.serverError(code: response.statusCode, message: "Ошибка")
        }
    }

    func createAddon(request: CreateAddonRequest) async throws -> Addon {
        try await request(path: "/addons", method: "POST", body: request)
    }

    func updateAddon(id: Int, request: UpdateAddonRequest) async throws -> Addon {
        try await request(path: "/addons/\(id)", method: "PUT", body: request)
    }

    func deleteAddon(id: Int) async throws {
        let (data, response) = try await rawRequest(
            path: "/addons/\(id)",
            method: "DELETE"
        )

        guard (200...299).contains(response.statusCode) else {
            if let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
               let message = json["message"] as? String {
                throw APIError.serverError(code: response.statusCode, message: message)
            }
            throw APIError.serverError(code: response.statusCode, message: "Ошибка")
        }
    }

    func linkAddonToShawarma(request: LinkAddonRequest) async throws {
        let _: APIResponse<EmptyResponse> = try await request(
            path: "/addons/link-to-shawarma",
            method: "POST",
            body: request
        )
    }

    func unlinkAddonFromShawarma(shawarmaId: Int, addonId: Int) async throws {
        let (data, response) = try await rawRequest(
            path: "/addons/unlink-from-shawarma",
            method: "DELETE",
            queryItems: [
                URLQueryItem(name: "shawarmaId", value: "\(shawarmaId)"),
                URLQueryItem(name: "addonId", value: "\(addonId)")
            ]
        )

        guard (200...299).contains(response.statusCode) else {
            if let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
               let message = json["message"] as? String {
                throw APIError.serverError(code: response.statusCode, message: message)
            }
            throw APIError.serverError(code: response.statusCode, message: "Ошибка")
        }
    }
}

private struct EmptyResponse: Codable {}
