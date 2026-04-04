import SwiftUI

// MARK: - Side Menu View

struct SideMenuView: View {
    @Binding var isPresented: Bool
    @StateObject private var authService = AuthService.shared
    @StateObject private var themeManager = ThemeManager.shared

    @Environment(\.dismiss) private var dismiss

    private var isAdmin: Bool { authService.isAdmin }

    var body: some View {
        NavigationStack {
            List {
                // Orders section
                Section("Заказы") {
                    NavigationLink {
                        if isAdmin {
                            AdminOrdersView()
                        } else {
                            OrdersView()
                        }
                    } label: {
                        Label("Мои заказы", systemImage: "bag.fill")
                    }

                    if isAdmin {
                        NavigationLink {
                            AdminDashboardView()
                        } label: {
                            Label("Панель управления", systemImage: "chart.bar.fill")
                        }

                        NavigationLink {
                            AdminMenuView()
                        } label: {
                            Label("Управление меню", systemImage: "square.grid.2x2")
                        }

                        NavigationLink {
                            AdminUserManagementView()
                        } label: {
                            Label("Пользователи", systemImage: "person.2")
                        }

                        NavigationLink {
                            AdminAddonManagementView()
                        } label: {
                            Label("Дополнения", systemImage: "puzzlepiece.extension")
                        }
                    }
                }

                // Settings section
                Section("Настройки") {
                    // Theme picker
                    Picker("Оформление", selection: $themeManager.themeMode) {
                        ForEach(ThemeMode.allCases) { mode in
                            Label(mode.displayName, systemImage: mode.icon)
                                .tag(mode)
                        }
                    }
                }

                // App info
                Section {
                    HStack {
                        Text("Версия")
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Меню")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isPresented = false
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title3)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
    }
}
