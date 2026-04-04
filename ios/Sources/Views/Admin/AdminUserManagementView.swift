import SwiftUI

// MARK: - Admin User Management View

struct AdminUserManagementView: View {
    @State private var users: [UserListItem] = []
    @State private var isLoading = true
    @State private var isRefreshing = false
    @State private var errorMessage: String = ""
    @State private var bannerMessage: String = ""
    @State private var searchText = ""

    // Role management state
    @State private var userForRoleAction: UserListItem?
    @State private var showAssignSheet = false
    @State private var showRemoveSheet = false
    @State private var isUpdatingRole = false

    private let allRoles = ["admin", "manager", "courier", "user"]

    var body: some View {
        VStack(spacing: 0) {
            // Error banner for role operation failures
            if !bannerMessage.isEmpty {
                errorBanner(bannerMessage)
                    .animation(.easeInOut(duration: 0.25), value: bannerMessage)
            }

            // User count summary
            if !isLoading && !filteredUsers.isEmpty {
                userSummaryBar
            }

            // Content
            if isLoading && !isRefreshing {
                Spacer()
                ProgressView("Загрузка пользователей...")
                Spacer()
            } else if !errorMessage.isEmpty, users.isEmpty {
                Spacer()
                errorView(errorMessage)
                Spacer()
            } else if filteredUsers.isEmpty && !searchText.isEmpty {
                Spacer()
                emptySearchView
                Spacer()
            } else if users.isEmpty {
                Spacer()
                emptyStateView
                Spacer()
            } else {
                userListView
            }
        }
        .navigationTitle("Пользователи")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.visible, for: .navigationBar)
        .searchable(
            text: $searchText,
            placement: .navigationBarDrawer(displayMode: .always),
            prompt: "Поиск по имени, телефону или ID"
        )
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Task { await loadUsers() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .disabled(isLoading)
            }
        }
        .confirmationDialog(
            "Назначить роль",
            isPresented: $showAssignSheet,
            titleVisibility: .visible
        ) {
            ForEach(availableRolesToAssign, id: \.self) { role in
                Button(roleDisplayName(role)) {
                    assignRole(role)
                }
            }
            Button("Отмена", role: .cancel) {}
        }
        .confirmationDialog(
            "Удалить роль",
            isPresented: $showRemoveSheet,
            titleVisibility: .visible
        ) {
            ForEach(userForRoleAction?.roles ?? [], id: \.self) { role in
                Button("\(roleDisplayName(role))", role: .destructive) {
                    removeRole(role)
                }
            }
            Button("Отмена", role: .cancel) {}
        }
        .overlay {
            if isUpdatingRole {
                ZStack {
                    Color.black.opacity(0.2)
                        .ignoresSafeArea()
                    ProgressView("Обновление...")
                        .padding(24)
                        .background(Color(.systemBackground))
                        .cornerRadius(14)
                        .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 4)
                }
            }
        }
        .task { await loadUsers() }
        .refreshable { await loadUsers() }
    }

    // MARK: - Computed Properties

    private var filteredUsers: [UserListItem] {
        guard !searchText.trimmingCharacters(in: .whitespaces).isEmpty else { return users }
        let query = searchText.lowercased()
        return users.filter { user in
            user.displayName.lowercased().contains(query)
                || user.phone.lowercased().contains(query)
                || "\(user.id)".contains(query)
        }
    }

    private var availableRolesToAssign: [String] {
        guard let currentRoles = userForRoleAction?.roles else { return allRoles }
        return allRoles.filter { !currentRoles.contains($0) }
    }

    // MARK: - Subviews

    private var userSummaryBar: some View {
        HStack(spacing: 16) {
            Label("\(filteredUsers.count)", systemImage: "person.2.fill")
                .font(.caption)
                .foregroundColor(.appPrimary)
            if !searchText.isEmpty {
                Text("найдено из \(users.count)")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            } else {
                Text("всего")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(Color.appPrimary.opacity(0.06))
    }

    private var userListView: some View {
        List {
            ForEach(filteredUsers) { user in
                UserManagementRowView(user: user)
                    .listRowInsets(EdgeInsets(top: 6, leading: 16, bottom: 6, trailing: 16))
                    .listRowSeparator(.hidden)
                    .listRowBackground(Color.clear)
                    .contextMenu {
                        if !(user.roles ?? []).isEmpty {
                            Button {
                                userForRoleAction = user
                                showRemoveSheet = true
                            } label: {
                                Label("Удалить роль", systemImage: "minus.circle")
                            }

                            Divider()
                        }

                        Button {
                            userForRoleAction = user
                            showAssignSheet = true
                        } label: {
                            Label("Назначить роль", systemImage: "plus.circle")
                        }
                    }
                    .swipeActions(edge: .trailing) {
                        Button {
                            userForRoleAction = user
                            showAssignSheet = true
                        } label: {
                            Label("Роль", systemImage: "plus.circle")
                        }
                        .tint(.appPrimary)

                        if !(user.roles ?? []).isEmpty {
                            Button(role: .destructive) {
                                userForRoleAction = user
                                showRemoveSheet = true
                            } label: {
                                Label("Удалить", systemImage: "minus.circle")
                            }
                        }
                    }
            }
        }
        .listStyle(.plain)
    }

    private func errorView(_ error: String) -> some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle")
                .font(.largeTitle)
                .foregroundColor(.appError)
            Text(error)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            Button("Повторить") {
                Task { await loadUsers() }
            }
            .foregroundColor(.appPrimary)
            .fontWeight(.medium)
        }
        .padding(.top, 60)
    }

    private var emptyStateView: some View {
        VStack(spacing: 12) {
            Image(systemName: "person.2.slash")
                .font(.title2)
                .foregroundColor(.secondary)
            Text("Пользователей пока нет")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }

    private func errorBanner(_ message: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.caption)
                .foregroundColor(.appError)
            Text(message)
                .font(.caption)
                .foregroundColor(.appError)
                .lineLimit(2)
            Spacer()
            Button {
                withAnimation { bannerMessage = "" }
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .foregroundColor(.appTextSecondary)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(Color.appError.opacity(0.08))
        .transition(.move(edge: .top).combined(with: .opacity))
    }

    private var emptySearchView: some View {
        VStack(spacing: 12) {
            Image(systemName: "magnifyingglass")
                .font(.title2)
                .foregroundColor(.secondary)
            Text("Ничего не найдено")
                .font(.subheadline)
                .foregroundColor(.secondary)
            Text("Попробуйте изменить запрос")
                .font(.caption)
                .foregroundColor(.appTextSecondary)
        }
    }

    // MARK: - Role Helpers

    private func roleDisplayName(_ role: String) -> String {
        switch role.lowercased() {
        case "admin": return "Администратор"
        case "manager": return "Менеджер"
        case "courier": return "Курьер"
        case "user": return "Пользователь"
        default: return role.capitalized
        }
    }

    private func roleColor(_ role: String) -> Color {
        switch role.lowercased() {
        case "admin": return .red
        case "manager": return .orange
        case "courier": return .blue
        case "user": return .gray
        default: return .gray
        }
    }

    // MARK: - Data Loading

    private func loadUsers() async {
        if !isLoading {
            isRefreshing = true
        }
        errorMessage = ""
        bannerMessage = ""

        do {
            users = try await APIClient.shared.getUsers()
        } catch {
            errorMessage = "Не удалось загрузить пользователей: \(error.localizedDescription)"
            users = []
        }

        isLoading = false
        isRefreshing = false
    }

    // MARK: - Role Actions

    private func assignRole(_ role: String) {
        guard let user = userForRoleAction else { return }
        isUpdatingRole = true

        Task {
            do {
                try await APIClient.shared.assignRole(userId: user.id, role: role)
                await MainActor.run {
                    updateLocalRoles(userId: user.id, role: role, added: true)
                    isUpdatingRole = false
                    userForRoleAction = nil
                }
            } catch {
                await MainActor.run {
                    withAnimation { bannerMessage = "Ошибка назначения роли: \(error.localizedDescription)" }
                    isUpdatingRole = false
                }
            }
        }
    }

    private func removeRole(_ role: String) {
        guard let user = userForRoleAction else { return }
        isUpdatingRole = true

        Task {
            do {
                try await APIClient.shared.removeRole(userId: user.id, role: role)
                await MainActor.run {
                    updateLocalRoles(userId: user.id, role: role, added: false)
                    isUpdatingRole = false
                    userForRoleAction = nil
                }
            } catch {
                await MainActor.run {
                    withAnimation { bannerMessage = "Ошибка удаления роли: \(error.localizedDescription)" }
                    isUpdatingRole = false
                }
            }
        }
    }

    private func updateLocalRoles(userId: Int, role: String, added: Bool) {
        guard let index = users.firstIndex(where: { $0.id == userId }) else { return }
        var currentRoles = users[index].roles ?? []

        if added {
            if !currentRoles.contains(role) {
                currentRoles.append(role)
            }
        } else {
            currentRoles.removeAll { $0 == role }
        }

        // Update the user in the array by re-fetching from the source
        // Since UserListItem roles are immutable, we rebuild the list
        // We work around this by keeping the server state — reload on next pull
        // For immediate UI feedback, we create an updated copy via a helper
        let original = users[index]
        let updated = UserListItem(
            id: original.id,
            phone: original.phone,
            firstName: original.firstName,
            lastName: original.lastName,
            phoneVerified: original.phoneVerified,
            roles: currentRoles,
            createdAt: original.createdAt
        )
        users[index] = updated
    }
}

// MARK: - User Management Row View

struct UserManagementRowView: View {
    let user: UserListItem

    var body: some View {
        HStack(spacing: 12) {
            // Avatar
            avatarView

            // Info
            VStack(alignment: .leading, spacing: 4) {
                // Name + verified
                HStack(spacing: 4) {
                    Text(user.displayName)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .lineLimit(1)

                    if user.phoneVerified == true {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.caption2)
                            .foregroundColor(.appSuccess)
                    }
                }

                // Phone
                Text(user.phone)
                    .font(.caption)
                    .foregroundColor(.secondary)

                // Roles
                if let roles = user.roles, !roles.isEmpty {
                    roleBadges(roles)
                } else {
                    Text("Нет ролей")
                        .font(.caption2)
                        .foregroundColor(.appTextSecondary)
                }
            }

            Spacer()

            // Chevron
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.appTextSecondary)
        }
        .padding(14)
        .background(Color(.systemBackground))
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
    }

    // MARK: - Avatar

    private var avatarView: some View {
        let name = user.displayName
        let hasName = user.firstName != nil && !(user.firstName ?? "").isEmpty
        let initials: String = {
            guard hasName else { return "#" }
            let first = user.firstName?.first ?? Character("")
            let last = user.lastName?.first ?? Character("")
            return "\(first)\(last)".uppercased()
        }()

        let avatarColor: Color = {
            guard let firstChar = name.first else { return .appPrimary }
            let colors: [Color] = [
                .appPrimary, .appAccent, .blue, .purple, .pink, .teal, .indigo
            ]
            let index = Int(firstChar.unicodeScalars.first!.value) % colors.count
            return colors[index]
        }()

        return ZStack {
            Circle()
                .fill(avatarColor.opacity(0.12))
                .frame(width: 44, height: 44)

            Text(initials)
                .font(.subheadline)
                .fontWeight(.bold)
                .foregroundColor(avatarColor)
        }
    }

    // MARK: - Role Badges

    private func roleBadges(_ roles: [String]) -> some View {
        let sortedRoles = roles.sorted { a, b in
            rolePriority(a) < rolePriority(b)
        }

        return ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 4) {
                ForEach(sortedRoles, id: \.self) { role in
                    roleBadge(role)
                }
            }
        }
    }

    private func roleBadge(_ role: String) -> some View {
        Text(roleDisplayName(role))
            .font(.caption2)
            .fontWeight(.medium)
            .foregroundColor(roleColor(role))
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(roleColor(role).opacity(0.12))
            .cornerRadius(6)
    }

    // MARK: - Helpers

    private func rolePriority(_ role: String) -> Int {
        switch role.lowercased() {
        case "admin": return 0
        case "manager": return 1
        case "courier": return 2
        case "user": return 3
        default: return 4
        }
    }

    private func roleDisplayName(_ role: String) -> String {
        switch role.lowercased() {
        case "admin": return "Админ"
        case "manager": return "Менеджер"
        case "courier": return "Курьер"
        case "user": return "Пользователь"
        default: return role.capitalized
        }
    }

    private func roleColor(_ role: String) -> Color {
        switch role.lowercased() {
        case "admin": return .red
        case "manager": return .orange
        case "courier": return .blue
        case "user": return .gray
        default: return .gray
        }
    }
}
