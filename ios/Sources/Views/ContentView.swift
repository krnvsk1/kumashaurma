import SwiftUI

// MARK: - Content View (Main Tab Navigation)

struct ContentView: View {
    @StateObject private var authService = AuthService.shared
    @State private var selectedTab = 0

    private var isAdmin: Bool { authService.isAdmin }

    // Adjust tab tags when admin tab is present
    private var menuTag: Int { 0 }
    private var ordersTag: Int { 1 }
    private var profileTag: Int { isAdmin ? 3 : 2 }
    private var adminTag: Int { 2 }

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                MenuView()
            }
            .tabItem {
                Label("Меню", systemImage: "takeoutbag.and.cup.and.straw")
            }
            .tag(menuTag)

            NavigationStack {
                isAdmin ? AdminOrdersView() : OrdersView()
            }
            .tabItem {
                Label("Заказы", systemImage: "bag")
            }
            .tag(ordersTag)

            if isAdmin {
                NavigationStack {
                    AdminMenuView()
                }
                .tabItem {
                    Label("Товары", systemImage: "square.grid.2x2")
                }
                .tag(adminTag)
            }

            NavigationStack {
                ProfileView()
            }
            .tabItem {
                Label("Профиль", systemImage: "person.crop.circle")
            }
            .tag(profileTag)
        }
        .tint(.appPrimary)
    }
}
