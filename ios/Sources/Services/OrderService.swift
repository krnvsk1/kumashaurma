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
        let items = cartItems.map { item in
            CreateOrderItem(
                shawarmaId: item.shawarma.id,
                name: item.shawarma.name,
                quantity: item.quantity,
                variantId: item.selectedVariant?.id,
                variantName: item.selectedVariant?.name,
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
