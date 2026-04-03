import SwiftUI

// MARK: - Profile View

struct ProfileView: View {
    @StateObject private var authService = AuthService.shared
    @State private var showLogoutAlert: Bool = false
    @State private var isLoading: Bool = false

    var body: some View {
        List {
            // Profile header section
            Section {
                profileHeader
                    .listRowInsets(EdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16))
            }

            // Account info section
            if let user = authService.currentUser {
                Section("Аккаунт") {
                    infoRow(title: "Телефон", value: user.phone, icon: "phone.fill")
                    infoRow(
                        title: "Имя",
                        value: [user.firstName, user.lastName].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " ") ,
                        icon: "person.fill"
                    )

                    if let verified = user.phoneVerified {
                        HStack {
                            Label("Телефон подтверждён", systemImage: "checkmark.shield.fill")
                                .font(.subheadline)
                            Spacer()
                            Text(verified ? "Да" : "Нет")
                                .font(.subheadline)
                                .foregroundColor(verified ? .appSuccess : .appError)
                        }
                    }
                }
            }

            // Stats section
            Section {
                NavigationLink {
                    OrdersView()
                } label: {
                    Label("Мои заказы", systemImage: "bag.fill")
                        .font(.subheadline)
                }

                NavigationLink {
                    CartView()
                } label: {
                    HStack {
                        Label("Корзина", systemImage: "cart.fill")
                            .font(.subheadline)
                        Spacer()
                        Text("Открыть")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }

            // Role badge
            if authService.currentUser?.roles?.contains("admin") == true
                || authService.currentUser?.roles?.contains("manager") == true {
                Section {
                    HStack {
                        Image(systemName: "shield.checkered")
                            .font(.title3)
                            .foregroundColor(.appAccent)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Администратор")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                            Text("Полный доступ к управлению")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }

            // Logout section
            Section {
                Button(role: .destructive) {
                    showLogoutAlert = true
                } label: {
                    HStack(spacing: 10) {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                            .font(.callout)
                        Text("Выйти из аккаунта")
                            .fontWeight(.medium)
                    }
                }
            }

            // App info
            Section {
                HStack {
                    Text("Версия")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("1.0.0")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .navigationTitle("Профиль")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            refreshProfile()
        }
        .refreshable {
            await refreshProfileAsync()
        }
        .alert("Выйти из аккаунта", isPresented: $showLogoutAlert) {
            Button("Отмена", role: .cancel) {}
            Button("Выйти", role: .destructive) {
                Task { await authService.logout() }
            }
        } message: {
            Text("Вы уверены, что хотите выйти из аккаунта?")
        }
    }

    // MARK: - Profile Header

    private var profileHeader: some View {
        HStack(spacing: 16) {
            // Avatar
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [Color.appPrimary, Color(red: 0.1, green: 0.65, blue: 0.55)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 64, height: 64)

                Text(authService.currentUser?.initials ?? "?")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(authService.currentUser?.displayName ?? "Загрузка...")
                    .font(.title3)
                    .fontWeight(.semibold)

                if let phone = authService.currentUser?.phone, !phone.isEmpty {
                    Text(phone)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                if let roles = authService.currentUser?.roles, !roles.isEmpty {
                    HStack(spacing: 4) {
                        ForEach(roles, id: \.self) { role in
                            Text(role.capitalized)
                                .font(.caption2)
                                .fontWeight(.medium)
                                .foregroundColor(.appPrimary)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(Color.appPrimary.opacity(0.1))
                                .cornerRadius(4)
                        }
                    }
                }
            }

            Spacer()
        }
    }

    // MARK: - Info Row

    private func infoRow(title: String, value: String, icon: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.callout)
                .foregroundColor(.secondary)
                .frame(width: 20)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(value)
                    .font(.subheadline)
                    .fontWeight(.medium)
            }

            Spacer()
        }
        .padding(.vertical, 4)
    }

    // MARK: - Data Loading

    private func refreshProfile() {
        Task { await refreshProfileAsync() }
    }

    private func refreshProfileAsync() async {
        isLoading = true
        defer { isLoading = false }
        await authService.fetchCurrentUser()
    }
}
