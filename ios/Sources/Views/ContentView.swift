import SwiftUI

// MARK: - Content View (Main Tab Navigation)

struct ContentView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                MenuView()
            }
            .tabItem {
                Label("Меню", systemImage: "takeoutbag.and.cup.and.straw")
            }
            .tag(0)

            NavigationStack {
                OrdersView()
            }
            .tabItem {
                Label("Заказы", systemImage: "bag")
            }
            .tag(1)

            NavigationStack {
                ProfileView()
            }
            .tabItem {
                Label("Профиль", systemImage: "person.crop.circle")
            }
            .tag(2)
        }
        .tint(.appPrimary)
    }
}
