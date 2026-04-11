import Foundation

// MARK: - Shawarma

struct Shawarma: Codable, Identifiable, Sendable, Hashable {
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
    let parentId: Int?
    let isCard: Bool?
    let children: [Shawarma]?
    let sortOrder: Int?

    var primaryImage: String? {
        images?.first(where: { $0.isPrimary })?.filePath ?? images?.first?.filePath
    }

    /// True if this is a parent card (group header, not sold directly)
    var isParentCard: Bool {
        isCard == true || parentId == nil
    }

    /// Minimum price among available children, or own price
    var displayPrice: Double {
        if let children = children, !children.isEmpty {
            let available = children.filter { $0.isAvailable }
            if !available.isEmpty {
                return available.map(\.price).min() ?? price
            }
        }
        return price
    }

    /// Available children (nil for child items)
    var availableChildren: [Shawarma]? {
        guard isParentCard else { return nil }
        return children?.filter { $0.isAvailable }
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }

    static func == (lhs: Shawarma, rhs: Shawarma) -> Bool {
        lhs.id == rhs.id
    }

    // Custom decoder with safe fallbacks
    // convertFromSnakeCase in APIClient handles snake_case → camelCase conversion
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(Int.self, forKey: .id)
        name = try container.decodeIfPresent(String.self, forKey: .name) ?? ""
        price = try container.decodeIfPresent(Double.self, forKey: .price) ?? 0
        description = try container.decodeIfPresent(String.self, forKey: .description) ?? ""
        category = try container.decodeIfPresent(String.self, forKey: .category) ?? ""
        isSpicy = try container.decodeIfPresent(Bool.self, forKey: .isSpicy) ?? false
        hasCheese = try container.decodeIfPresent(Bool.self, forKey: .hasCheese) ?? false
        isAvailable = try container.decodeIfPresent(Bool.self, forKey: .isAvailable) ?? true
        isPromo = try container.decodeIfPresent(Bool.self, forKey: .isPromo) ?? false
        createdAt = try? container.decodeIfPresent(String.self, forKey: .createdAt)
        updatedAt = try? container.decodeIfPresent(String.self, forKey: .updatedAt)
        images = try? container.decodeIfPresent([ShawarmaImage].self, forKey: .images)
        parentId = try? container.decodeIfPresent(Int.self, forKey: .parentId)
        isCard = try? container.decodeIfPresent(Bool.self, forKey: .isCard)
        children = try? container.decodeIfPresent([Shawarma].self, forKey: .children)
        sortOrder = try? container.decodeIfPresent(Int.self, forKey: .sortOrder)
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
}

// MARK: - OrderStatus (matches backend)

enum OrderStatus: String, Sendable {
    case new = "Новый"
    case cooking = "Готовится"
    case ready = "Готов"
    case delivered = "Доставлен"
    case cancelled = "Отменён"

    var displayName: String { rawValue }

    var color: String {
        switch self {
        case .new: return "#6B7280"        // gray
        case .cooking: return "#F59E0B"     // amber
        case .ready: return "#22C55E"       // green
        case .delivered: return "#0891B2"   // cyan
        case .cancelled: return "#EF4444"   // red
        }
    }
}

// MARK: - CartItem (Codable for UserDefaults persistence)

struct CartItem: Identifiable, Sendable, Codable {
    let id: UUID
    let shawarma: Shawarma          // Parent card
    let quantity: Int
    let selectedChild: Shawarma?    // Selected child product (variant)
    let selectedAddons: [SelectedAddon]
    let unitPrice: Double
    let totalPrice: Double

    /// Display name for the cart row
    var displayName: String {
        selectedChild?.name ?? shawarma.name
    }

    /// Variant name for display
    var variantName: String? {
        selectedChild?.name
    }

    init(
        shawarma: Shawarma,
        quantity: Int,
        selectedChild: Shawarma? = nil,
        selectedAddons: [SelectedAddon] = []
    ) {
        self.id = UUID()
        self.shawarma = shawarma
        self.quantity = quantity
        self.selectedChild = selectedChild
        self.selectedAddons = selectedAddons
        self.unitPrice = selectedChild?.price ?? shawarma.displayPrice
        let addonsPrice = selectedAddons.reduce(0.0) { $0 + $1.price * Double($1.quantity) }
        self.totalPrice = (unitPrice + addonsPrice) * Double(quantity)
    }
}

// MARK: - SelectedAddon (Codable for UserDefaults persistence)

struct SelectedAddon: Identifiable, Hashable, Sendable, Codable {
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

// MARK: - Order Stats

struct OrderStats: Codable, Sendable {
    let totalOrders: Int
    let totalRevenue: Double
    let todayOrders: Int
    let averageOrderValue: Double
}

// MARK: - Auth DTOs (Response)

struct AuthResponse: Codable {
    let success: Bool
    let message: String?
    let accessToken: String?
    let refreshToken: String?
    let expiresAt: String?
    let user: User?
}

struct SendCodeResponse: Codable {
    let success: Bool
    let message: String?
    let retryAfter: Int?
}

// MARK: - Auth DTOs (Request)
// Encoded with convertToSnakeCase — camelCase properties auto-converted

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
}

struct RefreshRequest: Encodable {
    let refreshToken: String
}

// MARK: - Order DTOs (Request)

struct CreateOrderRequest: Encodable {
    let customerName: String
    let phone: String
    let address: String
    let notes: String?
    let items: [CreateOrderItem]
}

struct CreateOrderItem: Encodable {
    let shawarmaId: Int
    let name: String
    let quantity: Int
    let variantId: Int?
    let variantName: String?
    let selectedAddons: [CreateOrderAddon]?
}

struct CreateOrderAddon: Encodable {
    let addonId: Int
    let quantity: Int
}

// MARK: - Admin: Shawarma CRUD DTOs

struct CreateShawarmaRequest: Encodable {
    let name: String
    let price: Double?
    let description: String?
    let category: String?
    let isSpicy: Bool?
    let hasCheese: Bool?
    let isAvailable: Bool?
    let isPromo: Bool?
    let parentId: Int?
    let sortOrder: Int?
}

struct UpdateShawarmaRequest: Encodable {
    let name: String?
    let price: Double?
    let description: String?
    let category: String?
    let isSpicy: Bool?
    let hasCheese: Bool?
    let isAvailable: Bool?
    let isPromo: Bool?
    let sortOrder: Int?
}

// MARK: - Admin: Order Update DTO

struct UpdateOrderRequest: Encodable {
    let status: String?
    let total: Double?
    let customerName: String?
    let phone: String?
    let address: String?
    let notes: String?
}

// MARK: - Admin: User Management DTOs

struct UserListItem: Codable, Identifiable, Sendable {
    let id: Int
    let phone: String
    let firstName: String?
    let lastName: String?
    let phoneVerified: Bool?
    let roles: [String]?
    let createdAt: String?

    var displayName: String {
        if let first = firstName, !first.isEmpty {
            if let last = lastName, !last.isEmpty {
                return "\(first) \(last)"
            }
            return first
        }
        return phone
    }
}

// MARK: - Admin: Addon CRUD DTOs

struct CreateAddonCategoryRequest: Encodable {
    let name: String
    let description: String?
    let displayOrder: Int?
    let isRequired: Bool?
    let minSelections: Int?
    let maxSelections: Int?
}

struct UpdateAddonCategoryRequest: Encodable {
    let name: String
    let description: String?
    let isRequired: Bool?
    let minSelections: Int?
    let maxSelections: Int?
    let displayOrder: Int?
}

struct CreateAddonRequest: Encodable {
    let name: String
    let description: String?
    let price: Double
    let addonCategoryId: Int
    let isAvailable: Bool?
    let displayOrder: Int?
}

struct UpdateAddonRequest: Encodable {
    let name: String?
    let description: String?
    let price: Double?
    let displayOrder: Int?
    let isAvailable: Bool?
}

struct LinkAddonRequest: Encodable {
    let shawarmaId: Int
    let addonId: Int
    let customPrice: Double?
    let isDefault: Bool?
    let maxQuantity: Int?
}

// MARK: - Admin: Image DTOs

struct ImageInfo: Codable, Identifiable, Sendable {
    let id: Int
    let filePath: String
    let isPrimary: Bool
    let createdAt: String?
}

struct ImageUploadResponse: Codable {
    let message: String?
    let imagePath: String?
    let isPrimary: Bool?
}
