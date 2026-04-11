import SwiftUI

// MARK: - Delivery Type

enum DeliveryType: String, CaseIterable, Identifiable {
    case delivery = "Доставка"
    case pickup = "Самовывоз"
    case dineIn = "В зале"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .delivery: return " scooter"
        case .pickup: return "bag"
        case .dineIn: return "fork.knife"
        }
    }
}

// MARK: - Cart View

struct CartView: View {
    @StateObject private var cartService = CartService.shared
    @State private var showOrderSheet: Bool = false
    @State private var showSuccessAlert: Bool = false
    @State private var deliveryType: DeliveryType = .delivery

    private let minOrderAmount: Double = 499
    private let deliveryPrice: Double = 0

    private var isMinOrderReached: Bool {
        deliveryType == .delivery
            ? cartService.totalPrice >= minOrderAmount
            : true
    }

    var body: some View {
        Group {
            if cartService.isEmpty {
                emptyCartView
            } else {
                cartListView
            }
        }
        .navigationTitle("Корзина")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.visible, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                OpenSideMenuButton()
            }
        }
        .sheet(isPresented: $showOrderSheet) {
            OrderSheetView(deliveryType: deliveryType) { result in
                showOrderSheet = false
                if result {
                    showSuccessAlert = true
                }
            }
        }
        .alert("Заказ оформлен!", isPresented: $showSuccessAlert) {
            Button("Отлично", role: .none) {}
        } message: {
            Text("Ваш заказ успешно создан и передан в работу.")
        }
    }

    // MARK: - Empty Cart View

    private var emptyCartView: some View {
        VStack(spacing: 24) {
            Spacer()

            ZStack {
                Circle()
                    .fill(Color.appPrimary.opacity(0.08))
                    .frame(width: 120, height: 120)

                Image(systemName: "cart")
                    .font(.system(size: 48))
                    .foregroundColor(.appPrimary)
                    .opacity(0.4)
            }

            VStack(spacing: 8) {
                Text("Корзина пуста")
                    .font(.headline)
                    .foregroundColor(.primary)

                Text("Добавьте шаурму из меню")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            Text("Перейдите на вкладку Меню")
                .font(.subheadline)
                .foregroundColor(.secondary)

            Spacer()
        }
    }

    // MARK: - Cart List View

    private var cartListView: some View {
        List {
            // Delivery type selector
            Section {
                deliveryTypeSelector
            }
            .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
            .listRowSeparator(.hidden)
            .listRowBackground(Color.clear)

            // Cart items
            ForEach(cartService.items) { item in
                CartItemRow(item: item)
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    .listRowSeparator(.hidden)
                    .listRowBackground(Color.clear)
            }

            // Promo code
            Section {
                promoCodeField
            }
            .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
            .listRowSeparator(.hidden)
            .listRowBackground(Color.clear)

            // Order summary
            Section {
                orderSummary
            }
            .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
            .listRowSeparator(.hidden)
            .listRowBackground(Color.clear)
        }
        .listStyle(.plain)
        .safeAreaInset(edge: .bottom) {
            bottomTotalBar
        }
    }

    // MARK: - Delivery Type Selector

    private var deliveryTypeSelector: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Способ получения")
                .font(.caption)
                .foregroundColor(.secondary)

            HStack(spacing: 8) {
                ForEach(DeliveryType.allCases) { type in
                    Button {
                        withAnimation(.spring(response: 0.3)) {
                            deliveryType = type
                        }
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: type.icon)
                                .font(.caption)
                            Text(type.rawValue)
                                .font(.subheadline)
                                .fontWeight(.medium)
                        }
                        .foregroundColor(deliveryType == type ? .white : .primary)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(deliveryType == type ? Color.appPrimary : Color.appPrimary.opacity(0.08))
                        .cornerRadius(20)
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .strokeBorder(
                                    deliveryType == type ? Color.clear : Color.appPrimary.opacity(0.25),
                                    lineWidth: 1.5
                                )
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    // MARK: - Promo Code Field

    @State private var promoCode: String = ""
    @State private var promoError: Bool = false

    private var promoCodeField: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Image(systemName: "tag.fill")
                    .font(.caption)
                    .foregroundColor(promoError ? .appError : .secondary)

                TextField("Промокод", text: $promoCode)
                    .font(.subheadline)
                    .autocorrectionDisabled()
                    .autocapitalization(.allCharacters)

                if !promoCode.isEmpty {
                    Button {
                        promoCode = ""
                        promoError = false
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(12)
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(promoError ? Color.appError : Color.gray.opacity(0.2), lineWidth: 1)
            )

            if promoError {
                Text("Не найдены блюда в корзине для промокода")
                    .font(.caption2)
                    .foregroundColor(.appError)
            }
        }
    }

    // MARK: - Order Summary

    private var orderSummary: some View {
        VStack(spacing: 10) {
            HStack {
                Text("Товары в заказе \(cartService.totalItems) шт.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                Spacer()
                Text("\(Int(cartService.totalPrice)) \u{20BD}")
                    .font(.subheadline)
                    .fontWeight(.semibold)
            }

            HStack {
                Text("Доставка")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                Spacer()
                Text(deliveryType == .delivery ? "\(Int(deliveryPrice)) \u{20BD}" : "Бесплатно")
                    .font(.subheadline)
                    .fontWeight(.semibold)
            }

            if !isMinOrderReached && deliveryType == .delivery {
                Text("Минимальный заказ \(Int(minOrderAmount)) \u{20BD}. Добавьте ещё товаров.")
                    .font(.caption2)
                    .foregroundColor(.appError)
            }

            Divider()

            HStack {
                Text("Бонусы к начислению")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                Spacer()
                Text("+\(Int(cartService.totalPrice * 0.02)) \u{20BD}")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.appPrimary)
            }
            .padding(.vertical, 4)
            .padding(.horizontal, 12)
            .background(Color.appPrimary.opacity(0.06))
            .cornerRadius(10)
        }
    }

    // MARK: - Bottom Total Bar

    private var bottomTotalBar: some View {
        VStack(spacing: 12) {
            // Items count & clear
            HStack {
                Text("\(cartService.totalItems) \(pluralItemText)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                Spacer()
                Button("Очистить") {
                    withAnimation { cartService.clear() }
                }
                .font(.subheadline)
                .foregroundColor(.appError)
            }

            Divider()

            HStack {
                Text("Итого")
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Spacer()

                Text("\(Int(cartService.totalPrice + deliveryPrice)) \u{20BD}")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
            }

            Button {
                showOrderSheet = true
            } label: {
                HStack {
                    Image(systemName: "paperplane.fill")
                    Text("Оформить заказ")
                        .fontWeight(.semibold)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(isMinOrderReached ? Color.appPrimary : Color.gray.opacity(0.4))
                .cornerRadius(14)
            }
            .disabled(!isMinOrderReached)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 16)
        .background(.ultraThinMaterial)
    }

    private var pluralItemText: String {
        let n = cartService.totalItems
        let absN = abs(n)
        let lastTwo = absN % 100
        let lastOne = absN % 10
        if lastTwo >= 11 && lastTwo <= 19 { return "товаров" }
        if lastOne == 1 { return "товар" }
        if lastOne >= 2 && lastOne <= 4 { return "товара" }
        return "товаров"
    }
}

// MARK: - Cart Item Row

struct CartItemRow: View {
    let item: CartItem

    @ObservedObject private var cartService = CartService.shared

    var body: some View {
        NavigationLink {
            ProductDetailView(shawarma: item.shawarma)
        } label: {
            HStack(spacing: 14) {
                // Thumbnail
                productThumbnail

                // Info + price
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.shawarma.name)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .lineLimit(1)
                        .foregroundColor(.primary)

                    if let variantName = item.variantName {
                        Text(variantName)
                            .font(.caption)
                            .foregroundColor(.appPrimary)
                    }

                    if !item.selectedAddons.isEmpty {
                        Text(item.selectedAddons.map { "\($0.name)" + ($0.quantity > 1 ? " x\($0.quantity)" : "") }.joined(separator: ", "))
                            .font(.caption2)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }

                    Text("\(Int(item.unitPrice)) \u{20BD}/\u{0448}\u{0442}")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }

                Spacer()

                // Quantity controls
                quantityControls

                // Total price
                VStack(alignment: .trailing, spacing: 4) {
                    Text("\(Int(item.totalPrice)) \u{20BD}")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)

                    // Remove button
                    Button {
                        withAnimation { cartService.removeItem(id: item.id) }
                    } label: {
                        Image(systemName: "trash")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(12)
            .background(Color(.systemBackground))
            .cornerRadius(14)
            .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Product Thumbnail

    @ViewBuilder
    private var productThumbnail: some View {
        if let imagePath = item.shawarma.primaryImage,
           let url = APIClient.shared.getImageURL(imagePath) {
            AsyncImage(url: url) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                default:
                    ZStack {
                        Color.appBackground
                        Image(systemName: "takeoutbag.and.cup.and.straw")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .opacity(0.3)
                    }
                }
            }
            .frame(width: 72, height: 72)
            .cornerRadius(12)
            .clipped()
        } else {
            ZStack {
                Color.appBackground
                Image(systemName: "takeoutbag.and.cup.and.straw")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .opacity(0.3)
            }
            .frame(width: 72, height: 72)
            .cornerRadius(12)
        }
    }

    // MARK: - Quantity Controls

    private var quantityControls: some View {
        HStack(spacing: 4) {
            Button {
                cartService.updateQuantity(id: item.id, quantity: item.quantity - 1)
            } label: {
                Image(systemName: "minus.circle")
                    .font(.callout)
                    .foregroundColor(item.quantity > 1 ? .appPrimary : .gray.opacity(0.4))
            }
            .buttonStyle(.plain)
            .disabled(item.quantity <= 1)

            Text("\(item.quantity)")
                .font(.subheadline)
                .fontWeight(.semibold)
                .frame(minWidth: 24)

            Button {
                cartService.updateQuantity(id: item.id, quantity: item.quantity + 1)
            } label: {
                Image(systemName: "plus.circle")
                    .font(.callout)
                    .foregroundColor(.appPrimary)
            }
            .buttonStyle(.plain)
        }
    }
}

// MARK: - Order Sheet View

struct OrderSheetView: View {
    let deliveryType: DeliveryType
    let onComplete: (Bool) -> Void

    @State private var customerName: String = ""
    @State private var customerPhone: String = ""
    @State private var customerAddress: String = ""
    @State private var customerNotes: String = ""
    @State private var isPlacingOrder: Bool = false
    @State private var errorMessage: String = ""

    @Environment(\.dismiss) private var dismiss
    @StateObject private var cartService = CartService.shared
    @StateObject private var authService = AuthService.shared

    private let deliveryPrice: Double = 0

    private var isFormValid: Bool {
        !customerName.trimmingCharacters(in: .whitespaces).isEmpty
            && !customerPhone.trimmingCharacters(in: .whitespaces).isEmpty
            && (deliveryType != .delivery || !customerAddress.trimmingCharacters(in: .whitespaces).isEmpty)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Delivery type display
                    deliveryTypeDisplay

                    // Order summary
                    orderSummary

                    // Contact info
                    contactSection

                    // Delivery info (only for delivery)
                    if deliveryType == .delivery {
                        deliverySection
                    }

                    // Notes
                    notesSection

                    // Error message
                    if !errorMessage.isEmpty {
                        ErrorBanner(message: errorMessage)
                    }
                }
                .padding(20)
            }
            .background(Color.appBackground)
            .navigationTitle("Оформление заказа")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Отмена") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    EmptyView()
                }
            }
            .safeAreaInset(edge: .bottom) {
                bottomButton
            }
            .onAppear {
                prefillUserData()
            }
            .onChange(of: authService.currentUser?.id) { _ in
                prefillUserData()
            }
        }
    }

    // MARK: - Delivery Type Display

    private var deliveryTypeDisplay: some View {
        HStack(spacing: 10) {
            Image(systemName: deliveryType.icon)
                .font(.callout)
                .foregroundColor(.appPrimary)

            VStack(alignment: .leading, spacing: 2) {
                Text(deliveryType.rawValue)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                Text(deliveryType == .delivery ? "Адрес потребуется ниже" : "Без доставки")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(14)
    }

    // MARK: - Order Summary

    private var orderSummary: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Ваш заказ")
                    .font(.headline)
                    .fontWeight(.semibold)
                Spacer()
                Text("\(cartService.totalItems) шт")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.appPrimary.opacity(0.1))
                    .cornerRadius(6)
            }

            ForEach(cartService.items) { item in
                HStack {
                    Text("\u{00B7} \(item.shawarma.name)")
                        .font(.subheadline)
                        .lineLimit(1)
                    Spacer()
                    Text("\(Int(item.totalPrice)) \u{20BD}")
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
            }

            Divider()

            HStack {
                Text("Товары")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Text("\(Int(cartService.totalPrice)) \u{20BD}")
                    .font(.caption)
                    .fontWeight(.medium)
            }

            HStack {
                Text("Доставка")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Text(deliveryType == .delivery ? "\(Int(deliveryPrice)) \u{20BD}" : "Бесплатно")
                    .font(.caption)
                    .fontWeight(.medium)
            }

            Divider()

            HStack {
                Text("Итого")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                Spacer()
                Text("\(Int(cartService.totalPrice + deliveryPrice)) \u{20BD}")
                    .font(.appPrice)
            }

            HStack {
                Text("Бонусы к начислению")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Text("+\(Int(cartService.totalPrice * 0.02)) \u{20BD}")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.appPrimary)
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(14)
    }

    // MARK: - Contact Section

    private var contactSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader("Контакты", icon: "person.fill")

            VStack(spacing: 12) {
                formField(title: "Имя", text: $customerName, icon: "person", keyboardType: .default)
                formField(title: "Телефон", text: $customerPhone, icon: "phone.fill", keyboardType: .phonePad)
            }
        }
    }

    // MARK: - Delivery Section

    private var deliverySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader("Доставка", icon: "location.fill")

            formField(title: "Адрес доставки", text: $customerAddress, icon: "mappin.and.ellipse", keyboardType: .default)
        }
    }

    // MARK: - Notes Section

    private var notesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader("Примечание", icon: "text.bubble")

            TextField("Комментарий к заказу (необязательно)", text: $customerNotes, axis: .vertical)
                .lineLimit(3...6)
                .padding(14)
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                )
        }
    }

    // MARK: - Bottom Button

    private var bottomButton: some View {
        VStack(spacing: 0) {
            Rectangle()
                .fill(Color(.separator))
                .frame(height: 0.5)

            Button {
                placeOrder()
            } label: {
                Group {
                    if isPlacingOrder {
                        HStack {
                            ProgressView()
                                .tint(.white)
                            Text("Оформляем...")
                                .fontWeight(.semibold)
                        }
                    } else {
                        HStack {
                            Image(systemName: "paperplane.fill")
                            Text("Заказать за \(Int(cartService.totalPrice + deliveryPrice)) \u{20BD}")
                                .fontWeight(.semibold)
                        }
                    }
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(isFormValid && !isPlacingOrder ? Color.appPrimary : Color.gray.opacity(0.4))
                .cornerRadius(14)
            }
            .disabled(!isFormValid || isPlacingOrder)
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .background(.ultraThinMaterial)
        }
    }

    // MARK: - Helpers

    private func sectionHeader(_ title: String, icon: String) -> some View {
        Label(title, systemImage: icon)
            .font(.subheadline)
            .fontWeight(.semibold)
            .foregroundColor(.primary)
    }

    private func formField(
        title: String,
        text: Binding<String>,
        icon: String,
        keyboardType: UIKeyboardType = .default
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)

            HStack(spacing: 10) {
                Image(systemName: icon)
                    .font(.callout)
                    .foregroundColor(.secondary)
                    .frame(width: 20)

                TextField(title, text: text)
                    .keyboardType(keyboardType)
                    .autocorrectionDisabled()
            }
            .padding(14)
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.gray.opacity(0.2), lineWidth: 1)
            )
        }
    }

    private func prefillUserData() {
        let user = authService.currentUser
        customerName = user?.firstName ?? ""
        customerPhone = user?.phone ?? ""
    }

    private func placeOrder() {
        isPlacingOrder = true
        errorMessage = ""

        let address = deliveryType == .delivery
            ? customerAddress.trimmingCharacters(in: .whitespaces)
            : ""

        Task {
            do {
                let orderService = OrderService.shared
                _ = try await orderService.createOrder(
                    customerName: customerName.trimmingCharacters(in: .whitespaces),
                    phone: customerPhone.trimmingCharacters(in: .whitespaces),
                    address: address,
                    notes: customerNotes.isEmpty ? nil : customerNotes,
                    cartItems: cartService.items
                )

                cartService.clear()
                isPlacingOrder = false
                onComplete(true)
            } catch {
                isPlacingOrder = false
                errorMessage = "Не удалось создать заказ: \(error.localizedDescription)"
            }
        }
    }
}
