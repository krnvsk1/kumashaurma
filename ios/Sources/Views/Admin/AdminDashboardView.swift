import SwiftUI

// MARK: - Admin Dashboard View

struct AdminDashboardView: View {
    @State private var stats: OrderStats?
    @State private var recentOrders: [Order] = []
    @State private var shawarmas: [Shawarma] = []
    @State private var popularItems: [PopularItem] = []
    @State private var isLoading = true
    @State private var errorMessage: String = ""

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if isLoading {
                    ProgressView("Загрузка...")
                        .padding(.top, 60)
                } else if !errorMessage.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundColor(.appError)
                        Text(errorMessage)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                        Button("Повторить") {
                            Task { await loadData() }
                        }
                        .foregroundColor(.appPrimary)
                    }
                    .padding(.top, 60)
                } else {
                    statsCards
                    popularItemsSection
                    recentOrdersSection
                }
            }
            .padding(16)
        }
        .navigationTitle("Панель управления")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.visible, for: .navigationBar)
        .task { await loadData() }
        .refreshable { await loadData() }
    }

    // MARK: - Stats Cards

    private var statsCards: some View {
        VStack(spacing: 12) {
            Text("Статистика")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                StatCardView(
                    title: "В меню",
                    value: "\(availableCount)/\(shawarmas.count)",
                    subtitle: "доступных товаров",
                    icon: "menu.fill",
                    color: .appPrimary
                )
                StatCardView(
                    title: "Всего заказов",
                    value: "\(stats?.totalOrders ?? 0)",
                    icon: "bag.fill",
                    color: .blue
                )
                StatCardView(
                    title: "Заказов сегодня",
                    value: "\(stats?.todayOrders ?? 0)",
                    icon: "calendar",
                    color: .purple
                )
                StatCardView(
                    title: "Выручка",
                    value: "\(formatPrice(stats?.totalRevenue ?? 0))",
                    icon: "rublesign.circle.fill",
                    color: .green
                )
                StatCardView(
                    title: "Средний чек",
                    value: "\(formatPrice(stats?.averageOrderValue ?? 0))",
                    icon: "chart.bar.fill",
                    color: .orange
                )
            }
        }
    }

    private var availableCount: Int {
        shawarmas.filter { $0.isAvailable }.count
    }

    // MARK: - Popular Items Section

    private var popularItemsSection: some View {
        VStack(spacing: 12) {
            Text("Популярные товары")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            if popularItems.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "chart.bar")
                        .font(.title2)
                        .foregroundColor(.secondary)
                    Text("Нет данных о продажах")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 24)
            } else {
                VStack(spacing: 0) {
                    let maxQuantity = popularItems.first?.quantity ?? 1

                    ForEach(Array(popularItems.prefix(5).enumerated()), id: \.element.id) { index, item in
                        VStack(spacing: 8) {
                            HStack {
                                Text("\(index + 1)")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                    .frame(width: 24, height: 24)
                                    .background(index == 0 ? Color.appAccent : Color.appPrimary.opacity(0.7))
                                    .cornerRadius(6)

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(item.name)
                                        .font(.subheadline)
                                        .fontWeight(.semibold)
                                        .lineLimit(1)
                                    Text("\(item.quantity) заказов")
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                }

                                Spacer()

                                Text("\(Int(item.revenue)) \u{20BD}")
                                    .font(.caption)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.appPrimary)
                            }

                            // Progress bar
                            GeometryReader { geo in
                                let ratio = maxQuantity > 0 ? CGFloat(item.quantity) / CGFloat(maxQuantity) : 0
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(Color.appPrimary.opacity(0.08))
                                    .overlay(alignment: .leading) {
                                        RoundedRectangle(cornerRadius: 4)
                                            .fill(index == 0 ? Color.appAccent : Color.appPrimary)
                                            .frame(width: max(24, geo.size.width * ratio))
                                    }
                            }
                            .frame(height: 6)
                        }
                        .padding(.vertical, 10)
                        if index < popularItems.prefix(5).count - 1 {
                            Divider()
                        }
                    }
                }
                .padding(16)
                .background(Color(.systemBackground))
                .cornerRadius(14)
                .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
            }
        }
    }

    // MARK: - Recent Orders Section

    private var recentOrdersSection: some View {
        VStack(spacing: 12) {
            Text("Последние заказы")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            if recentOrders.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "tray")
                        .font(.title2)
                        .foregroundColor(.secondary)
                    Text("Заказов пока нет")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 24)
            } else {
                ForEach(recentOrders.prefix(10)) { order in
                    NavigationLink {
                        AdminOrderDetailView(order: order)
                    } label: {
                        AdminOrderRowView(order: order)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    // MARK: - Data Loading

    private func loadData() async {
        isLoading = true
        errorMessage = ""

        async let statsTask = APIClient.shared.getOrderStats()
        async let ordersTask = APIClient.shared.getAllOrders()
        async let menuTask = APIClient.shared.getMenu()

        stats = (try? await statsTask)
        recentOrders = (try? await ordersTask) ?? []
        shawarmas = (try? await menuTask) ?? []

        // Calculate popular items from orders
        calculatePopularItems()

        isLoading = false
        if stats == nil && recentOrders.isEmpty {
            errorMessage = "Не удалось загрузить данные"
        }
    }

    private func calculatePopularItems() {
        var itemMap: [Int: (name: String, quantity: Int, revenue: Double)] = [:]

        for order in recentOrders {
            guard let items = order.orderItems else { continue }
            for item in items {
                if var existing = itemMap[item.shawarmaId ?? 0] {
                    existing.quantity += item.quantity
                    existing.revenue += item.price * Double(item.quantity)
                    itemMap[item.shawarmaId ?? 0] = existing
                } else {
                    itemMap[item.shawarmaId ?? 0] = (name: item.name, quantity: item.quantity, revenue: item.price * Double(item.quantity))
                }
            }
        }

        popularItems = itemMap.values
            .map { PopularItem(id: UUID(), name: $0.name, quantity: $0.quantity, revenue: $0.revenue) }
            .sorted { $0.quantity > $1.quantity }
    }

    private func formatPrice(_ value: Double) -> String {
        "\(Int(value)) \u{20BD}"
    }
}

// MARK: - Popular Item

private struct PopularItem: Identifiable {
    let id: UUID
    let name: String
    let quantity: Int
    let revenue: Double
}

// MARK: - Stat Card View

struct StatCardView: View {
    let title: String
    let value: String
    var subtitle: String? = nil
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.callout)
                    .foregroundColor(color)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text(value)
                .font(.title2)
                .fontWeight(.bold)

            if let subtitle = subtitle {
                Text(subtitle)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.systemBackground))
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
    }
}

// MARK: - Admin Order Row View

struct AdminOrderRowView: View {
    let order: Order

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Заказ #\(order.id)")
                    .font(.subheadline)
                    .fontWeight(.semibold)

                Text(order.customerName)
                    .font(.caption)
                    .foregroundColor(.secondary)

                Text(formatDate(order.createdAt))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text("\(Int(order.total)) \u{20BD}")
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(.appPrimary)

                StatusBadgeView(status: order.status)
            }
        }
        .padding(14)
        .background(Color(.systemBackground))
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
    }

    private func formatDate(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = formatter.date(from: dateString) else {
            // Try without fractional seconds
            formatter.formatOptions = [.withInternetDateTime]
            guard let date2 = formatter.date(from: dateString) else {
                return dateString
            }
            return date2.formatted(.dateTime.month().day().hour().minute())
        }
        return date.formatted(.dateTime.month().day().hour().minute())
    }
}

// MARK: - Status Badge View

struct StatusBadgeView: View {
    let status: String

    private var statusColor: Color {
        switch status {
        case "Новый": return .blue
        case "Готовится": return .orange
        case "Готов", "Доставлен": return .green
        case "Отменён": return .red
        default: return .gray
        }
    }

    var body: some View {
        Text(status)
            .font(.caption2)
            .fontWeight(.medium)
            .foregroundColor(statusColor)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(statusColor.opacity(0.12))
            .cornerRadius(6)
    }
}
