import SwiftUI

// MARK: - Content View (Main Tab Navigation)

struct ContentView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            Tab("Меню", systemImage: "fork.knife", value: 0) {
                NavigationStack {
                    MenuView()
                }
            }

            Tab("Заказы", systemImage: "bag", value: 1) {
                NavigationStack {
                    OrdersView()
                }
            }

            Tab("Профиль", systemImage: "person.crop.circle", value: 2) {
                NavigationStack {
                    ProfileView()
                }
            }
        }
        .tint(.appPrimary)
    }
}
