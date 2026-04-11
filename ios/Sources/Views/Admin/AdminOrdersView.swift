import SwiftUI

// MARK: - Admin Orders View

struct AdminOrdersView: View {
    @State private var orders: [Order] = []
    @State private var isLoading = true
    @State private var errorMessage: String = ""
    @State private var selectedStatus: String? = nil
    @State private var searchText: String = ""

    private let statusFilters: [String?] = [nil, "Новый", "Готовится", "Готов", "Доставлен", "Отменён"]

    // MARK: - Computed Stats

    private var stats: OrderListStats {
        let total = orders.reduce(0.0) { $0 + $1.total }
        let newCount = orders.filter { $0.status == "Новый" }.count
        let preparingCount = orders.filter { $0.status == "Готовится" }.count
        let readyCount = orders.filter { $0.status == "Готов" }.count
        return OrderListStats(
            totalOrders: orders.count,
            newCount: newCount,
            preparingCount: preparingCount,
            readyCount: readyCount,
            totalRevenue: total
        )
    }

    var body: some View {
        VStack(spacing: 0) {
            // Status filter chips
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(statusFilters, id: \.self) { status in
                        Button {
                            withAnimation { selectedStatus = status }
                        } label: {
                            Text(status ?? "Все")
                                .font(.caption)
                                .fontWeight(.medium)
                                .foregroundColor(selectedStatus == status ? .white : .primary)
                                .padding(.horizontal, 14)
                                .padding(.vertical, 8)
                                .background(selectedStatus == status ? Color.appPrimary : Color.appPrimary.opacity(0.1))
                                .cornerRadius(8)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
            }

            // Statistics bar
            if !isLoading && !orders.isEmpty {
                statisticsBar
            }

            // Orders count
            if !isLoading && !orders.isEmpty {
                HStack {
                    Text("Показано: \(filteredOrders.count) из \(orders.count)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 4)
            }

            // Orders list
            if isLoading {
                Spacer()
                ProgressView("Загрузка заказов...")
                Spacer()
            } else if filteredOrders.isEmpty {
                Spacer()
                VStack(spacing: 12) {
                    Image(systemName: searchText.isEmpty ? "tray" : "magnifyingglass")
                        .font(.title2)
                        .foregroundColor(.secondary)
                    Text(searchText.isEmpty ? "Заказов пока нет" : "Ничего не найдено")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                Spacer()
            } else {
                List {
                    ForEach(filteredOrders) { order in
                        NavigationLink {
                            AdminOrderDetailView(order: order)
                        } label: {
                            AdminOrderRowView(order: order)
                        }
                        .listRowInsets(EdgeInsets(top: 6, leading: 16, bottom: 6, trailing: 16))
                        .listRowSeparator(.hidden)
                        .listRowBackground(Color.clear)
                    }
                }
                .listStyle(.plain)
            }
        }
        .navigationTitle("Все заказы")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.visible, for: .navigationBar)
        .searchable(text: $searchText, prompt: "Поиск по ID, имени, телефону")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Task { await loadOrders() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
            }
        }
        .task { await loadOrders() }
        .refreshable { await loadOrders() }
    }

    // MARK: - Statistics Bar

    private var statisticsBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                statsCard(title: "Всего", value: "\(stats.totalOrders)", color: .primary)

                statsCard(title: "Новые", value: "\(stats.newCount)", color: .blue)

                statsCard(title: "Готовятся", value: "\(stats.preparingCount)", color: .orange)

                statsCard(title: "Готовы", value: "\(stats.readyCount)", color: .green)

                statsCard(title: "Выручка", value: "\(formatPrice(stats.totalRevenue))", color: .appPrimary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 4)
        }
    }

    private func statsCard(title: String, value: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.subheadline)
                .fontWeight(.bold)
                .foregroundColor(color)
            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
    }

    private func formatPrice(_ value: Double) -> String {
        "\(Int(value)) \u{20BD}"
    }

    // MARK: - Filtered Orders

    private var filteredOrders: [Order] {
        var result = orders

        // Filter by status
        if let status = selectedStatus {
            result = result.filter { $0.status == status }
        }

        // Filter by search text
        if !searchText.isEmpty {
            let query = searchText.lowercased()
            result = result.filter { order in
                order.customerName.lowercased().contains(query) ||
                order.phone.lowercased().contains(query) ||
                "\(order.id)".contains(query)
            }
        }

        return result
    }

    private func loadOrders() async {
        isLoading = true
        errorMessage = ""

        do {
            orders = try await APIClient.shared.getAllOrders()
        } catch {
            errorMessage = error.localizedDescription
            orders = []
        }

        isLoading = false
    }
}

// MARK: - Order List Stats

private struct OrderListStats {
    let totalOrders: Int
    let newCount: Int
    let preparingCount: Int
    let readyCount: Int
    let totalRevenue: Double
}
