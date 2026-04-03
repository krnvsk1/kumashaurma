import SwiftUI

// MARK: - Admin Dashboard View

struct AdminDashboardView: View {
    @State private var stats: OrderStats?
    @State private var recentOrders: [Order] = []
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

        async let statsTask: () = { stats = try? await APIClient.shared.getOrderStats() }()
        async let ordersTask: () = { recentOrders = (try? await APIClient.shared.getAllOrders()) ?? [] }()

        await statsTask
        await ordersTask

        isLoading = false
        if stats == nil && recentOrders.isEmpty {
            errorMessage = "Не удалось загрузить данные"
        }
    }

    private func formatPrice(_ value: Double) -> String {
        "\(Int(value)) ₽"
    }
}

// MARK: - Stat Card View

struct StatCardView: View {
    let title: String
    let value: String
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
                Text("\(Int(order.total)) ₽")
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
