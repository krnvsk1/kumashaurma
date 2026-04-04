import SwiftUI

// MARK: - Cart View

struct CartView: View {
    @StateObject private var cartService = CartService.shared
    @State private var showOrderSheet: Bool = false
    @State private var showSuccessAlert: Bool = false

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
            OrderSheetView { result in
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
            ForEach(cartService.items) { item in
                CartItemRow(item: item)
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    .listRowSeparator(.hidden)
                    .listRowBackground(Color.clear)
            }
        }
        .listStyle(.plain)
        .safeAreaInset(edge: .bottom) {
            bottomTotalBar
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

                Text("\(Int(cartService.totalPrice)) ₽")
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
                .background(Color.appPrimary)
                .cornerRadius(14)
            }
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
                        Text(item.selectedAddons.map(\.name).joined(separator: ", "))
                            .font(.caption2)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }

                    Text("\(Int(item.unitPrice)) ₽/шт")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }

                Spacer()

                // Quantity controls
                quantityControls

                // Total price
                VStack(alignment: .trailing, spacing: 4) {
                    Text("\(Int(item.totalPrice)) ₽")
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

    private var isFormValid: Bool {
        !customerName.trimmingCharacters(in: .whitespaces).isEmpty
            && !customerPhone.trimmingCharacters(in: .whitespaces).isEmpty
            && !customerAddress.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Order summary
                    orderSummary

                    // Contact info
                    contactSection

                    // Delivery info
                    deliverySection

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
                    // Hidden to use custom bottom button
                    EmptyView()
                }
            }
            .safeAreaInset(edge: .bottom) {
                bottomButton
            }
            .onAppear {
                prefillUserData()
            }
            .onChange(of: authService.currentUser) { _ in
                prefillUserData()
            }
        }
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
                    Text("· \(item.shawarma.name)")
                        .font(.subheadline)
                        .lineLimit(1)
                    Spacer()
                    Text("\(Int(item.totalPrice)) ₽")
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
            }

            Divider()

            HStack {
                Text("Итого")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                Spacer()
                Text("\(Int(cartService.totalPrice)) ₽")
                    .font(.appPrice)
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
                            Text("Заказать за \(Int(cartService.totalPrice)) ₽")
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

        Task {
            do {
                let orderService = OrderService.shared
                _ = try await orderService.createOrder(
                    customerName: customerName.trimmingCharacters(in: .whitespaces),
                    phone: customerPhone.trimmingCharacters(in: .whitespaces),
                    address: customerAddress.trimmingCharacters(in: .whitespaces),
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
