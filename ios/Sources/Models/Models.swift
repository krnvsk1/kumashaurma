import Foundation

// MARK: - Shawarma

struct Shawarma: Codable, Identifiable, Sendable {
    let id: Int
    let name: String
    let price: Double
    let description: String
    let category: String
    let isSpicy: Bool
    let hasCheese: Bool
    let isAvailable: Bool
    let isPromo: Bool
    let createdAt: String?
    let updatedAt: String?
    let images: [ShawarmaImage]?
    let variants: [ProductVariant]?
    let sortOrder: Int?

    var primaryImage: String? {
        images?.first(where: { $0.isPrimary })?.filePath ?? images?.first?.filePath
    }

    var displayPrice: Double {
        if let variants = variants, !variants.isEmpty {
            return variants.map(\.price).min() ?? price
        }
        return price
    }

    enum CodingKeys: String, CodingKey {
        case id, name, price, description, category
        case isSpicy = "is_spicy"
        case hasCheese = "has_cheese"
        case isAvailable = "is_available"
        case isPromo = "is_promo"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case images, variants
        case sortOrder = "sort_order"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(Int.self, forKey: .id)
        name = try container.decodeIfPresent(String.self, forKey: .name) ?? ""
        price = try container.decodeIfPresent(Double.self, forKey: .price) ?? 0
        description = try container.decodeIfPresent(String.self, forKey: .description) ?? ""
        category = try container.decodeIfPresent(String.self, forKey: .category) ?? "Курица"
        isSpicy = try container.decodeIfPresent(Bool.self, forKey: .isSpicy) ?? false
        hasCheese = try container.decodeIfPresent(Bool.self, forKey: .hasCheese) ?? false
        isAvailable = try container.decodeIfPresent(Bool.self, forKey: .isAvailable) ?? true
        isPromo = try container.decodeIfPresent(Bool.self, forKey: .isPromo) ?? false
        createdAt = try? container.decodeIfPresent(String.self, forKey: .createdAt)
        updatedAt = try? container.decodeIfPresent(String.self, forKey: .updatedAt)
        images = try? container.decodeIfPresent([ShawarmaImage].self, forKey: .images)
        variants = try? container.decodeIfPresent([ProductVariant].self, forKey: .variants)
        sortOrder = try? container.decodeIfPresent(Int.self, forKey: .sortOrder)
    }
}

// MARK: - ProductVariant

struct ProductVariant: Codable, Identifiable, Sendable {
    let id: Int
    let shawarmaId: Int?
    let name: String
    let price: Double
    let sortOrder: Int?

    enum CodingKeys: String, CodingKey {
        case id, name, price
        case shawarmaId = "shawarma_id"
        case sortOrder = "sort_order"
    }
}

// MARK: - ShawarmaImage

struct ShawarmaImage: Codable, Identifiable, Sendable {
    let id: Int
    let shawarmaId: Int?
    let fileName: String
    let filePath: String
    let isPrimary: Bool
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id, fileName, filePath, isPrimary, createdAt
        case shawarmaId = "shawarma_id"
    }
}

// MARK: - AddonCategory

struct AddonCategory: Codable, Identifiable, Sendable {
    let id: Int
    let name: String
    let description: String?
    let displayOrder: Int?
    let isRequired: Bool?
    let minSelections: Int?
    let maxSelections: Int?
    let isActive: Bool?
    let createdAt: String?
    let updatedAt: String?
    let addons: [Addon]?

    enum CodingKeys: String, CodingKey {
        case id, name, description, addons
        case displayOrder = "display_order"
        case isRequired = "is_required"
        case minSelections = "min_selections"
        case maxSelections = "max_selections"
        case isActive = "is_active"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(Int.self, forKey: .id)
        name = try container.decodeIfPresent(String.self, forKey: .name) ?? ""
        description = try? container.decodeIfPresent(String.self, forKey: .description)
        displayOrder = try? container.decodeIfPresent(Int.self, forKey: .displayOrder)
        isRequired = try? container.decodeIfPresent(Bool.self, forKey: .isRequired)
        minSelections = try? container.decodeIfPresent(Int.self, forKey: .minSelections)
        maxSelections = try? container.decodeIfPresent(Int.self, forKey: .maxSelections)
        isActive = try? container.decodeIfPresent(Bool.self, forKey: .isActive)
        createdAt = try? container.decodeIfPresent(String.self, forKey: .createdAt)
        updatedAt = try? container.decodeIfPresent(String.self, forKey: .updatedAt)
        addons = try? container.decodeIfPresent([Addon].self, forKey: .addons)
    }
}

// MARK: - Addon

struct Addon: Codable, Identifiable, Sendable {
    let id: Int
    let name: String
    let description: String?
    let price: Double
    let displayOrder: Int?
    let isAvailable: Bool?
    let addonCategoryId: Int?
    let maxQuantity: Int?
    let isDefault: Bool?

    enum CodingKeys: String, CodingKey {
        case id, name, description, price
        case displayOrder = "display_order"
        case isAvailable = "is_available"
        case addonCategoryId = "addon_category_id"
        case maxQuantity = "max_quantity"
        case isDefault = "is_default"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(Int.self, forKey: .id)
        name = try container.decodeIfPresent(String.self, forKey: .name) ?? ""
        description = try? container.decodeIfPresent(String.self, forKey: .description)
        price = try container.decodeIfPresent(Double.self, forKey: .price) ?? 0
        displayOrder = try? container.decodeIfPresent(Int.self, forKey: .displayOrder)
        isAvailable = try? container.decodeIfPresent(Bool.self, forKey: .isAvailable) ?? true
        addonCategoryId = try? container.decodeIfPresent(Int.self, forKey: .addonCategoryId)
        maxQuantity = try? container.decodeIfPresent(Int.self, forKey: .maxQuantity)
        isDefault = try? container.decodeIfPresent(Bool.self, forKey: .isDefault)
    }
}

// MARK: - User

struct User: Codable, Identifiable, Sendable {
    let id: Int
    let phone: String
    let firstName: String?
    let lastName: String?
    let phoneVerified: Bool?
    let roles: [String]?

    var displayName: String {
        if let first = firstName, !first.isEmpty {
            if let last = lastName, !last.isEmpty {
                return "\(first) \(last)"
            }
            return first
        }
        return phone
    }

    var initials: String {
        let first = (firstName?.first ?? Character("")).uppercased()
        let last = (lastName?.first ?? Character("")).uppercased()
        return first + last
    }

    enum CodingKeys: String, CodingKey {
        case id, phone, roles
        case firstName = "first_name"
        case lastName = "last_name"
        case phoneVerified = "phone_verified"
    }
}

// MARK: - Order

struct Order: Codable, Identifiable, Sendable {
    let id: Int
    let userId: Int?
    let customerName: String
    let phone: String
    let address: String
    let total: Double
    let status: String
    let notes: String?
    let createdAt: String
    let completedAt: String?
    let orderItems: [OrderItem]?

    var orderStatus: OrderStatus {
        OrderStatus(rawValue: status) ?? .new
    }

    enum CodingKeys: String, CodingKey {
        case id, total, status, notes
        case userId = "user_id"
        case customerName = "customer_name"
        case address
        case phone
        case createdAt = "created_at"
        case completedAt = "completed_at"
        case orderItems = "order_items"
    }
}

// MARK: - OrderItem

struct OrderItem: Codable, Identifiable, Sendable {
    let id: Int
    let orderId: Int?
    let shawarmaId: Int?
    let name: String
    let quantity: Int
    let price: Double
    let subtotal: Double?
    let selectedAddons: [OrderItemAddon]?

    enum CodingKeys: String, CodingKey {
        case id, name, quantity, price, subtotal
        case orderId = "order_id"
        case shawarmaId = "shawarma_id"
        case selectedAddons = "selected_addons"
    }
}

// MARK: - OrderItemAddon

struct OrderItemAddon: Codable, Identifiable, Sendable {
    let id: Int
    let orderItemId: Int?
    let addonId: Int?
    let addonName: String
    let addonCategoryId: Int?
    let addonCategoryName: String?
    let price: Double
    let quantity: Int

    enum CodingKeys: String, CodingKey {
        case id, price, quantity
        case orderItemId = "order_item_id"
        case addonId = "addon_id"
        case addonName = "addon_name"
        case addonCategoryId = "addon_category_id"
        case addonCategoryName = "addon_category_name"
    }
}

// MARK: - OrderStatus

enum OrderStatus: String, Sendable {
    case new = "Новый"
    case accepted = "Принят"
    case cooking = "Готовится"
    case ready = "Готов"
    case delivering = "В пути"
    case completed = "Выполнен"
    case cancelled = "Отменён"

    var displayName: String { rawValue }

    var color: String {
        switch self {
        case .new: return "#6B7280"        // gray
        case .accepted: return "#0891B2"   // cyan
        case .cooking: return "#F59E0B"    // amber
        case .ready: return "#22C55E"      // green
        case .delivering: return "#3B82F6" // blue
        case .completed: return "#10B981"  // emerald
        case .cancelled: return "#EF4444"  // red
        }
    }
}

// MARK: - CartItem

struct CartItem: Identifiable, Sendable {
    let id: UUID
    let shawarma: Shawarma
    let quantity: Int
    let selectedVariant: ProductVariant?
    let selectedAddons: [SelectedAddon]
    let unitPrice: Double
    let totalPrice: Double
    let variantName: String?

    init(
        shawarma: Shawarma,
        quantity: Int,
        selectedVariant: ProductVariant? = nil,
        selectedAddons: [SelectedAddon] = []
    ) {
        self.id = UUID()
        self.shawarma = shawarma
        self.quantity = quantity
        self.selectedVariant = selectedVariant
        self.selectedAddons = selectedAddons
        self.unitPrice = selectedVariant?.price ?? shawarma.displayPrice
        self.variantName = selectedVariant?.name
        let addonsPrice = selectedAddons.reduce(0) { $0 + $1.price * Double($1.quantity) }
        self.totalPrice = (unitPrice + addonsPrice) * Double(quantity)
    }
}

// MARK: - SelectedAddon

struct SelectedAddon: Identifiable, Sendable {
    let id: UUID
    let addonId: Int
    let name: String
    let price: Double
    let quantity: Int

    init(addonId: Int, name: String, price: Double, quantity: Int = 1) {
        self.id = UUID()
        self.addonId = addonId
        self.name = name
        self.price = price
        self.quantity = quantity
    }
}

// MARK: - API Response

struct APIResponse<T: Codable>: Codable {
    let success: Bool?
    let message: String?
    let data: T?
}

// MARK: - Auth DTOs (Response)

struct AuthResponse: Codable {
    let success: Bool
    let message: String?
    let accessToken: String?
    let refreshToken: String?
    let expiresAt: String?
    let user: User?

    enum CodingKeys: String, CodingKey {
        case success, message, user
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case expiresAt = "expires_at"
    }
}

struct SendCodeResponse: Codable {
    let success: Bool
    let message: String?
    let retryAfter: Int?

    enum CodingKeys: String, CodingKey {
        case success, message
        case retryAfter = "retry_after"
    }
}

// MARK: - Auth DTOs (Request)

struct SendCodeRequest: Encodable {
    let phone: String
}

struct VerifyRequest: Encodable {
    let phone: String
    let code: String
}

struct RegisterRequest: Encodable {
    let phone: String
    let firstName: String
    let lastName: String

    enum CodingKeys: String, CodingKey {
        case phone
        case firstName = "first_name"
        case lastName = "last_name"
    }
}

struct RefreshRequest: Encodable {
    let refreshToken: String

    enum CodingKeys: String, CodingKey {
        case refreshToken = "refresh_token"
    }
}

// MARK: - Order DTOs (Request)

struct CreateOrderRequest: Encodable {
    let customerName: String
    let phone: String
    let address: String
    let notes: String?
    let items: [CreateOrderItem]

    enum CodingKeys: String, CodingKey {
        case customerName = "customer_name"
        case phone, address, notes, items
    }
}

struct CreateOrderItem: Encodable {
    let shawarmaId: Int
    let name: String
    let quantity: Int
    let selectedAddons: [CreateOrderAddon]?

    enum CodingKeys: String, CodingKey {
        case name, quantity
        case shawarmaId = "shawarma_id"
        case selectedAddons = "selected_addons"
    }
}

struct CreateOrderAddon: Encodable {
    let addonId: Int
    let quantity: Int
}
