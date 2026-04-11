import Foundation

// MARK: - Order Service

@MainActor
final class OrderService: ObservableObject {
    static let shared = OrderService()

    private let api = APIClient.shared

    private init() {}

    // MARK: - Create Order

    func createOrder(
        customerName: String,
        phone: String,
        address: String,
        notes: String?,
        cartItems: [CartItem]
    ) async throws -> Order {
        let validItems = cartItems.filter { $0.isValid }

        guard !validItems.isEmpty else {
            throw APIError.serverError(code: 400, message: "Нет валидных товаров в корзине")
        }

        let items = validItems.map { item in
            CreateOrderItem(
                shawarmaId: item.orderShawarmaId,
                name: item.selectedChild?.name ?? item.shawarma.name,
                quantity: item.quantity,
                variantId: item.selectedChild?.id,
                variantName: item.selectedChild?.name,
                selectedAddons: item.selectedAddons.map { addon in
                    CreateOrderAddon(addonId: addon.addonId, quantity: addon.quantity)
                }
            )
        }

        let request = CreateOrderRequest(
            customerName: customerName,
            phone: phone,
            address: address,
            notes: notes,
            items: items
        )

        return try await api.createOrder(orderRequest: request)
    }

    // MARK: - Fetch Orders

    func getMyOrders() async throws -> [Order] {
        return try await api.getMyOrders()
    }

    func getOrder(id: Int) async throws -> Order {
        return try await api.getOrder(id: id)
    }
}
