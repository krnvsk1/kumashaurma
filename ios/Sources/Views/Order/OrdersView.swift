import SwiftUI

// MARK: - Orders View

struct OrdersView: View {
    @State private var orders: [Order] = []
    @State private var isLoading: Bool = true
    @State private var showError: Bool = false
    @State private var errorMessage: String = ""
    @State private var selectedOrder: Order?

    var body: some View {
        Group {
            if isLoading {
                loadingView
            } else if orders.isEmpty {
                emptyView
            } else {
                ordersList
            }
        }
        .navigationTitle("Заказы")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            loadOrders()
        }
        .refreshable {
            await loadOrdersAsync()
        }
        .alert("Ошибка", isPresented: $showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage)
        }
        .sheet(item: $selectedOrder) { order in
            NavigationStack {
                OrderDetailView(order: order)
            }
        }
    }

    // MARK: - Loading View

    private var loadingView: some View {
        VStack(spacing: 16) {
            Spacer()
            ProgressView()
                .scaleEffect(1.5)
                .tint(.appPrimary)
            Text("Загрузка заказов...")
                .font(.subheadline)
                .foregroundColor(.secondary)
            Spacer()
        }
    }

    // MARK: - Empty View

    private var emptyView: some View {
        VStack(spacing: 20) {
            Spacer()

            ZStack {
                Circle()
                    .fill(Color.appPrimary.opacity(0.08))
                    .frame(width: 120, height: 120)

                Image(systemName: "doc.text")
                    .font(.system(size: 44))
                    .foregroundColor(.appPrimary)
                    .opacity(0.4)
            }

            VStack(spacing: 8) {
                Text("Заказов пока нет")
                    .font(.headline)

                Text("Ваши заказы появятся здесь")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
    }

    // MARK: - Orders List

    private var ordersList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(orders) { order in
                    Button {
                        selectedOrder = order
                    } label: {
                        OrderRowView(order: order)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(16)
        }
    }

    // MARK: - Data Loading

    private func loadOrders() {
        Task { await loadOrdersAsync() }
    }

    private func loadOrdersAsync() async {
        isLoading = true
        defer { isLoading = false }

        do {
            orders = try await OrderService.shared.getMyOrders()
        } catch {
            errorMessage = "Не удалось загрузить заказы"
            showError = true
        }
    }
}

// MARK: - Order Row View

struct OrderRowView: View {
    let order: Order

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Top row: order ID & status
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Заказ #\(order.id)")
                        .font(.subheadline)
                        .fontWeight(.semibold)

                    Text(formatDate(order.createdAt))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                StatusBadge(status: order.orderStatus)
            }

            // Items preview
            if let items = order.orderItems, !items.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(items.prefix(3)) { item in
                        HStack(spacing: 6) {
                            Circle()
                                .fill(Color.appPrimary.opacity(0.3))
                                .frame(width: 6, height: 6)
                            Text("\(item.quantity)× \(item.name)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .lineLimit(1)
                            Spacer()
                        }
                    }
                    if items.count > 3 {
                        Text("ещё +\(items.count - 3) позиций")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }

            // Bottom row: total
            HStack {
                Text(order.customerName)
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()

                Text("\(Int(order.total)) ₽")
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
    }

    private func formatDate(_ dateString: String) -> String {
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = isoFormatter.date(from: dateString) ??
                ISO8601DateFormatter().date(from: dateString) else {
            return dateString
        }

        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ru_RU")
        formatter.dateFormat = "d MMM yyyy, HH:mm"
        return formatter.string(from: date)
    }
}

// MARK: - Status Badge

struct StatusBadge: View {
    let status: OrderStatus

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(statusColor)
                .frame(width: 8, height: 8)

            Text(status.displayName)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(statusColor)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(statusColor.opacity(0.1))
                .cornerRadius(8)
        }
    }

    private var statusColor: Color {
        switch status {
        case .new: return .gray
        case .cooking: return .appAccent
        case .ready: return .appSuccess
        case .delivered: return .appPrimary
        case .cancelled: return .appError
        }
    }
}

// MARK: - Order Detail View

struct OrderDetailView: View {
    let order: Order

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        List {
            // Status section
            Section {
                HStack {
                    StatusBadge(status: order.orderStatus)
                    Spacer()
                }
                .padding(.vertical, 4)
            }

            // Order info section
            Section("Информация") {
                detailRow(title: "Заказ", value: "#\(order.id)")
                detailRow(title: "Дата", value: formatDate(order.createdAt))
                detailRow(title: "Клиент", value: order.customerName)
                detailRow(title: "Телефон", value: order.phone)

                if !order.address.isEmpty {
                    detailRow(title: "Адрес", value: order.address)
                }

                if let notes = order.notes, !notes.isEmpty {
                    detailRow(title: "Примечание", value: notes)
                }

                if let completedAt = order.completedAt {
                    detailRow(title: "Выполнен", value: formatDate(completedAt))
                }
            }

            // Items section
            Section("Состав заказа") {
                ForEach(order.orderItems ?? []) { item in
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text("\(item.quantity)×")
                                .fontWeight(.medium)
                                .foregroundColor(.secondary)

                            Text(item.name)
                                .fontWeight(.medium)

                            Spacer()

                            Text("\(Int(item.price * Double(item.quantity))) ₽")
                                .fontWeight(.semibold)
                        }

                        // Addons
                        if let addons = item.selectedAddons, !addons.isEmpty {
                            VStack(alignment: .leading, spacing: 3) {
                                ForEach(addons) { addon in
                                    HStack(spacing: 4) {
                                        Image(systemName: "plus.circle")
                                            .font(.system(size: 10))
                                            .foregroundColor(.secondary)
                                        Text("\(addon.addonName)")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                        if addon.quantity > 1 {
                                            Text("×\(addon.quantity)")
                                                .font(.caption)
                                                .foregroundColor(.secondary)
                                        }
                                        Spacer()
                                        Text("+\(Int(addon.price * Double(addon.quantity))) ₽")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                            }
                            .padding(.leading, 24)
                        }
                    }
                    .padding(.vertical, 4)
                }
            }

            // Total section
            Section {
                HStack {
                    Text("Итого")
                        .font(.body)
                    Spacer()
                    Text("\(Int(order.total)) ₽")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                }
                .padding(.vertical, 4)
            }
        }
        .navigationTitle("Заказ #\(order.id)")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Готово") { dismiss() }
            }
        }
    }

    // MARK: - Helper

    private func detailRow(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
        }
        .padding(.vertical, 2)
    }

    private func formatDate(_ dateString: String) -> String {
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = isoFormatter.date(from: dateString) ??
                ISO8601DateFormatter().date(from: dateString) else {
            return dateString
        }

        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ru_RU")
        formatter.dateFormat = "d MMM yyyy, HH:mm"
        return formatter.string(from: date)
    }
}
