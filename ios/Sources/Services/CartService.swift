import Foundation

// MARK: - Cart Service

@MainActor
final class CartService: ObservableObject {
    static let shared = CartService()

    // MARK: - Published State

    @Published private(set) var items: [CartItem] = []
    @Published private(set) var totalItems: Int = 0
    @Published private(set) var totalPrice: Double = 0

    var isEmpty: Bool { items.isEmpty }

    private init() {
        load()
    }

    // MARK: - Cart Operations

    func addItem(
        shawarma: Shawarma,
        quantity: Int = 1,
        selectedChild: Shawarma? = nil,
        selectedAddons: [SelectedAddon] = []
    ) {
        // Check if identical item already exists (same parent + same child + same addons)
        if let index = items.firstIndex(where: { item in
            item.shawarma.id == shawarma.id &&
            item.selectedChild?.id == selectedChild?.id &&
            item.selectedAddons.map(\.addonId).sorted() == selectedAddons.map(\.addonId).sorted()
        }) {
            var updated = items[index]
            items[index] = CartItem(
                shawarma: updated.shawarma,
                quantity: updated.quantity + quantity,
                selectedChild: updated.selectedChild,
                selectedAddons: updated.selectedAddons
            )
        } else {
            items.append(CartItem(
                shawarma: shawarma,
                quantity: quantity,
                selectedChild: selectedChild,
                selectedAddons: selectedAddons
            ))
        }

        recalculate()
        save()
    }

    func updateQuantity(id: UUID, quantity: Int) {
        guard let index = items.firstIndex(where: { $0.id == id }) else { return }

        if quantity <= 0 {
            items.remove(at: index)
        } else {
            let item = items[index]
            items[index] = CartItem(
                shawarma: item.shawarma,
                quantity: quantity,
                selectedChild: item.selectedChild,
                selectedAddons: item.selectedAddons
            )
        }

        recalculate()
        save()
    }

    func removeItem(id: UUID) {
        items.removeAll { $0.id == id }
        recalculate()
        save()
    }

    func clear() {
        items.removeAll()
        recalculate()
        save()
    }

    // MARK: - Persistence

    func load() {
        if let data = UserDefaults.standard.data(forKey: "cart_items") {
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            if let decoded = try? decoder.decode([CartItem].self, from: data) {
                // Remove invalid items (parent cards without selected child)
                items = decoded.filter { $0.isValid }
                if items.count != decoded.count {
                    save() // persist cleaned cart
                }
                recalculate()
            }
        }
    }

    func save() {
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        if let data = try? encoder.encode(items) {
            UserDefaults.standard.set(data, forKey: "cart_items")
        }
    }

    // MARK: - Helpers

    private func recalculate() {
        totalItems = items.reduce(0) { $0 + $1.quantity }
        totalPrice = items.reduce(0.0) { $0 + $1.totalPrice }
    }
}
