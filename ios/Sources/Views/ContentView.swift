import SwiftUI

// MARK: - Content View (Main Tab Navigation)

struct ContentView: View {
    @StateObject private var authService = AuthService.shared
    @StateObject private var themeManager = ThemeManager.shared
    @State private var selectedTab = 0
    @State private var showSideMenu = false

    var body: some View {
        TabView(selection: $selectedTab) {
            // Tab 1: Меню
            NavigationStack {
                MenuView()
            }
            .tabItem {
                Label("Меню", systemImage: "takeoutbag.and.cup.and.straw")
            }
            .tag(0)

            // Tab 2: Корзина
            NavigationStack {
                CartView()
            }
            .tabItem {
                Label("Корзина", systemImage: "cart.fill")
            }
            .tag(1)

            // Tab 3: Профиль
            NavigationStack {
                ProfileView()
            }
            .tabItem {
                Label("Профиль", systemImage: "person.crop.circle")
            }
            .tag(2)
        }
        .tint(.appPrimary)
        .preferredColorScheme(themeManager.colorScheme)
        .sheet(isPresented: $showSideMenu) {
            SideMenuView(isPresented: $showSideMenu)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
        .onReceive(NotificationCenter.default.publisher(for: .openSideMenu)) { _ in
            showSideMenu = true
        }
    }
}

// MARK: - Notification for opening side menu

extension Notification.Name {
    static let openSideMenu = Notification.Name("openSideMenu")
}

// MARK: - Open Side Menu Helper View

struct OpenSideMenuButton: View {
    var body: some View {
        Button {
            NotificationCenter.default.post(name: .openSideMenu, object: nil)
        } label: {
            Image(systemName: "line.3.horizontal")
                .font(.body)
                .foregroundColor(.primary)
                .padding(10)
                .background(Color.appPrimary.opacity(0.08))
                .clipShape(Circle())
        }
    }
}
