import SwiftUI

// MARK: - Admin Addon Management View

struct AdminAddonManagementView: View {
    @State private var categories: [AddonCategory] = []
    @State private var isLoading = true
    @State private var errorMessage: String = ""

    // Category sheet
    @State private var isCategorySheetPresented = false
    @State private var editingCategory: AddonCategory?

    // Addon sheet — nil addon means "create new", non-nil means "edit existing"
    @State private var isAddonSheetPresented = false
    @State private var addonSheetTargetCategoryId: Int?
    @State private var editingAddon: Addon?

    // Delete alerts
    @State private var categoryToDelete: AddonCategory?
    @State private var isDeleteCategoryAlertShown = false
    @State private var addonToDelete: Addon?
    @State private var isDeleteAddonAlertShown = false

    // Expanded category IDs
    @State private var expandedCategoryIds: Set<Int> = []

    var body: some View {
        VStack(spacing: 0) {
            if isLoading {
                Spacer()
                ProgressView("Загрузка категорий...")
                Spacer()
            } else if !errorMessage.isEmpty {
                Spacer()
                VStack(spacing: 12) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.largeTitle)
                        .foregroundColor(.appError)
                    Text(errorMessage)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                    Button("Повторить") {
                        Task { await loadCategories() }
                    }
                    .foregroundColor(.appPrimary)
                }
                Spacer()
            } else if categories.isEmpty {
                Spacer()
                VStack(spacing: 12) {
                    Image(systemName: "square.stack.3d.up.slash")
                        .font(.title2)
                        .foregroundColor(.secondary)
                    Text("Категории дополнений отсутствуют")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Text("Нажмите + чтобы создать первую категорию")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(categories) { category in
                            AddonCategoryCard(
                                category: category,
                                isExpanded: expandedCategoryIds.contains(category.id),
                                onToggleExpand: { toggleExpand(category.id) },
                                onEdit: { presentCategorySheet(for: category) },
                                onDelete: { categoryToDelete = category; isDeleteCategoryAlertShown = true },
                                onAddAddon: { presentAddonSheet(categoryId: category.id) },
                                onEditAddon: { addon in presentAddonSheet(for: addon, categoryId: category.id) },
                                onDeleteAddon: { addon in addonToDelete = addon; isDeleteAddonAlertShown = true }
                            )
                        }
                    }
                    .padding(16)
                }
            }
        }
        .navigationTitle("Дополнения")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.visible, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                HStack(spacing: 12) {
                    Button {
                        Task { await loadCategories() }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }

                    Button {
                        presentCategorySheet()
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
        }
        .task { await loadCategories() }
        .refreshable { await loadCategories() }
        // MARK: - Category sheet
        .sheet(isPresented: $isCategorySheetPresented, onDismiss: resetCategorySheet) {
            AddonCategoryFormView(
                category: editingCategory,
                onSave: { request in
                    await saveCategory(request: request)
                }
            )
        }
        // MARK: - Addon sheet
        .sheet(isPresented: $isAddonSheetPresented, onDismiss: resetAddonSheet) {
            if let categoryId = addonSheetTargetCategoryId {
                AddonFormView(
                    addon: editingAddon,
                    categoryId: categoryId,
                    onSave: { request in
                        await saveAddon(request: request)
                    }
                )
            }
        }
        // MARK: - Delete category alert
        .alert("Удалить категорию?", isPresented: $isDeleteCategoryAlertShown) {
            Button("Отмена", role: .cancel) {
                categoryToDelete = nil
            }
            Button("Удалить", role: .destructive) {
                if let category = categoryToDelete {
                    Task { await deleteCategory(category) }
                }
            }
        } message: {
            if let category = categoryToDelete {
                Text("Категория «\(category.name)» и все её дополнения будут удалены безвозвратно.")
            }
        }
        // MARK: - Delete addon alert
        .alert("Удалить дополнение?", isPresented: $isDeleteAddonAlertShown) {
            Button("Отмена", role: .cancel) {
                addonToDelete = nil
            }
            Button("Удалить", role: .destructive) {
                if let addon = addonToDelete {
                    Task { await deleteAddon(addon) }
                }
            }
        } message: {
            if let addon = addonToDelete {
                Text("Дополнение «\(addon.name)» будет удалено безвозвратно.")
            }
        }
    }

    // MARK: - Sheet Helpers

    private func presentCategorySheet(for category: AddonCategory? = nil) {
        editingCategory = category
        isCategorySheetPresented = true
    }

    private func resetCategorySheet() {
        editingCategory = nil
    }

    private func presentAddonSheet(categoryId: Int) {
        editingAddon = nil
        addonSheetTargetCategoryId = categoryId
        isAddonSheetPresented = true
    }

    private func presentAddonSheet(for addon: Addon, categoryId: Int) {
        editingAddon = addon
        addonSheetTargetCategoryId = categoryId
        isAddonSheetPresented = true
    }

    private func resetAddonSheet() {
        editingAddon = nil
        addonSheetTargetCategoryId = nil
    }

    // MARK: - Expand / Collapse

    private func toggleExpand(_ categoryId: Int) {
        withAnimation(.easeInOut(duration: 0.25)) {
            if expandedCategoryIds.contains(categoryId) {
                expandedCategoryIds.remove(categoryId)
            } else {
                expandedCategoryIds.insert(categoryId)
            }
        }
    }

    // MARK: - Data Loading

    private func loadCategories() async {
        guard !isLoading else { return }
        isLoading = true
        errorMessage = ""

        do {
            categories = try await APIClient.shared.getAddonCategories()
        } catch {
            errorMessage = error.localizedDescription
            categories = []
        }

        isLoading = false
    }

    /// Silent reload after mutations — keeps expanded state, doesn't show loading spinner.
    private func refreshCategories() async {
        do {
            categories = try await APIClient.shared.getAddonCategories()
        } catch {
            // Silently ignore refresh errors; data is still current from before the mutation.
        }
    }

    // MARK: - Category CRUD

    private func saveCategory(request: CreateAddonCategoryRequest) async {
        do {
            if let existing = editingCategory {
                let updateRequest = UpdateAddonCategoryRequest(
                    name: request.name,
                    description: request.description,
                    isRequired: request.isRequired,
                    minSelections: request.minSelections,
                    maxSelections: request.maxSelections,
                    displayOrder: request.displayOrder
                )
                _ = try await APIClient.shared.updateAddonCategory(id: existing.id, request: updateRequest)
            } else {
                _ = try await APIClient.shared.createAddonCategory(request: request)
            }
            isCategorySheetPresented = false
            await refreshCategories()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func deleteCategory(_ category: AddonCategory) async {
        do {
            try await APIClient.shared.deleteAddonCategory(id: category.id)
            expandedCategoryIds.remove(category.id)
            categoryToDelete = nil
            await refreshCategories()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Addon CRUD

    private func saveAddon(request: CreateAddonRequest) async {
        guard let categoryId = addonSheetTargetCategoryId else { return }

        do {
            if let existing = editingAddon {
                let updateRequest = UpdateAddonRequest(
                    name: request.name,
                    description: request.description,
                    price: request.price,
                    displayOrder: request.displayOrder,
                    isAvailable: request.isAvailable
                )
                _ = try await APIClient.shared.updateAddon(id: existing.id, request: updateRequest)
            } else {
                _ = try await APIClient.shared.createAddon(request: request)
                // Auto-expand the category so user sees the new addon
                expandedCategoryIds.insert(categoryId)
            }
            isAddonSheetPresented = false
            await refreshCategories()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func deleteAddon(_ addon: Addon) async {
        do {
            try await APIClient.shared.deleteAddon(id: addon.id)
            addonToDelete = nil
            await refreshCategories()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

// MARK: - Addon Category Card

struct AddonCategoryCard: View {
    let category: AddonCategory
    let isExpanded: Bool
    let onToggleExpand: () -> Void
    let onEdit: () -> Void
    let onDelete: () -> Void
    let onAddAddon: () -> Void
    let onEditAddon: (Addon) -> Void
    let onDeleteAddon: (Addon) -> Void

    var body: some View {
        VStack(spacing: 0) {
            // Category header row
            Button(action: onToggleExpand) {
                HStack(spacing: 14) {
                    // Icon circle
                    ZStack {
                        Circle()
                            .fill(category.isActive == true ? Color.appPrimary.opacity(0.1) : Color.gray.opacity(0.1))
                            .frame(width: 42, height: 42)

                        Image(systemName: category.isRequired == true ? "star.fill" : "square.stack.3d.up")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(category.isActive == true ? .appPrimary : .secondary)
                    }

                    // Category info
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 8) {
                            Text(category.name)
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(.primary)
                                .lineLimit(1)

                            if category.isRequired == true {
                                Text("Обяз.")
                                    .font(.caption2)
                                    .fontWeight(.medium)
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(Color.appAccent)
                                    .cornerRadius(4)
                            }
                        }

                        HStack(spacing: 12) {
                            if let desc = category.description, !desc.isEmpty {
                                Text(desc)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                    .lineLimit(1)
                            }

                            if let min = category.minSelections, let max = category.maxSelections {
                                Text("\(min)–\(max) шт.")
                                    .font(.caption)
                                    .foregroundColor(.appPrimary)
                            } else if let min = category.minSelections {
                                Text("от \(min) шт.")
                                    .font(.caption)
                                    .foregroundColor(.appPrimary)
                            } else if let max = category.maxSelections {
                                Text("до \(max) шт.")
                                    .font(.caption)
                                    .foregroundColor(.appPrimary)
                            }

                            let addonCount = category.addons?.count ?? 0
                            Text("\(addonCount) доп.")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }

                    Spacer()

                    // Edit / Delete buttons
                    HStack(spacing: 6) {
                        Button(action: onEdit) {
                            Image(systemName: "pencil")
                                .font(.system(size: 13))
                                .foregroundColor(.appPrimary)
                                .padding(8)
                                .background(Color.appPrimary.opacity(0.1))
                                .cornerRadius(8)
                        }
                        .buttonStyle(.plain)

                        Button(action: onDelete) {
                            Image(systemName: "trash")
                                .font(.system(size: 13))
                                .foregroundColor(.appError)
                                .padding(8)
                                .background(Color.appError.opacity(0.1))
                                .cornerRadius(8)
                        }
                        .buttonStyle(.plain)
                    }

                    // Chevron
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.secondary)
                        .rotationEffect(.degrees(isExpanded ? 90 : 0))
                        .animation(.easeInOut(duration: 0.2), value: isExpanded)
                }
                .padding(14)
            }
            .buttonStyle(.plain)

            // Expanded: addon list
            if isExpanded {
                Divider()
                    .padding(.leading, 70)

                addonsSection
            }
        }
        .background(Color(.systemBackground))
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
    }

    // MARK: - Addons Section

    private var addonsSection: some View {
        VStack(spacing: 0) {
            let addons = category.addons ?? []

            if addons.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "plus.circle.dashed")
                        .font(.title3)
                        .foregroundColor(.secondary)
                    Text("Нет дополнений")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 20)
            } else {
                ForEach(Array(addons.enumerated()), id: \.element.id) { index, addon in
                    addonRow(addon)
                    if index < addons.count - 1 {
                        Divider()
                            .padding(.leading, 70)
                    }
                }
            }

            // Add addon button
            Button(action: onAddAddon) {
                HStack(spacing: 6) {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 14))
                    Text("Добавить дополнение")
                        .font(.caption)
                        .fontWeight(.medium)
                }
                .foregroundColor(.appPrimary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
            }
            .buttonStyle(.plain)
        }
    }

    // MARK: - Single Addon Row

    private func addonRow(_ addon: Addon) -> some View {
        HStack(spacing: 12) {
            // Availability indicator
            Circle()
                .fill(addon.isAvailable == true ? Color.appSuccess : Color.gray.opacity(0.3))
                .frame(width: 8, height: 8)
                .frame(width: 28, alignment: .center)

            // Addon info
            VStack(alignment: .leading, spacing: 3) {
                Text(addon.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(addon.isAvailable == true ? .primary : .secondary)
                    .lineLimit(1)

                HStack(spacing: 8) {
                    Text("\(Int(addon.price)) ₽")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.appPrimary)

                    if let desc = addon.description, !desc.isEmpty {
                        Text(desc)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                }
            }

            Spacer()

            // Edit / Delete
            HStack(spacing: 6) {
                Button {
                    onEditAddon(addon)
                } label: {
                    Image(systemName: "pencil")
                        .font(.system(size: 11))
                        .foregroundColor(.appPrimary)
                        .padding(6)
                        .background(Color.appPrimary.opacity(0.08))
                        .cornerRadius(6)
                }
                .buttonStyle(.plain)

                Button {
                    onDeleteAddon(addon)
                } label: {
                    Image(systemName: "trash")
                        .font(.system(size: 11))
                        .foregroundColor(.appError)
                        .padding(6)
                        .background(Color.appError.opacity(0.08))
                        .cornerRadius(6)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .opacity(addon.isAvailable == true ? 1.0 : 0.6)
    }
}

// MARK: - Addon Category Form Sheet

struct AddonCategoryFormView: View {
    let category: AddonCategory?
    let onSave: (CreateAddonCategoryRequest) -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var name: String = ""
    @State private var description: String = ""
    @State private var isRequired: Bool = false
    @State private var minSelections: String = ""
    @State private var maxSelections: String = ""
    @State private var displayOrder: String = ""
    @State private var isSaving = false

    private var isFormValid: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        NavigationView {
            Form {
                Section {
                    field(label: "Название", placeholder: "Например: Соусы", text: $name)
                    field(label: "Описание", placeholder: "Необязательное описание", text: $description)
                }
                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                .listRowBackground(Color.clear)

                Section {
                    Toggle("Обязательная категория", isOn: $isRequired)
                        .tint(.appPrimary)

                    numberField(label: "Мин. выбранных", placeholder: "0", text: $minSelections)
                    numberField(label: "Макс. выбранных", placeholder: "Без лимита", text: $maxSelections)
                    numberField(label: "Порядок отображения", placeholder: "0", text: $displayOrder)
                }
                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                .listRowBackground(Color.clear)
            }
            .formStyle(.grouped)
            .navigationTitle(category == nil ? "Новая категория" : "Редактирование")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Отмена") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(category == nil ? "Создать" : "Сохранить") {
                        save()
                    }
                    .fontWeight(.semibold)
                    .foregroundColor(isFormValid ? .appPrimary : .gray)
                    .disabled(!isFormValid || isSaving)
                }
            }
        }
        .onAppear {
            guard let category = category else { return }
            name = category.name
            description = category.description ?? ""
            isRequired = category.isRequired ?? false
            minSelections = category.minSelections.map(String.init) ?? ""
            maxSelections = category.maxSelections.map(String.init) ?? ""
            displayOrder = category.displayOrder.map(String.init) ?? ""
        }
    }

    // MARK: - Reusable Field Builders

    private func field(label: String, placeholder: String, text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
            TextField(placeholder, text: text)
                .textFieldStyle(.roundedBorder)
        }
        .padding(.vertical, 4)
    }

    private func numberField(label: String, placeholder: String, text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
            TextField(placeholder, text: text)
                .keyboardType(.numberPad)
                .textFieldStyle(.roundedBorder)
        }
        .padding(.vertical, 4)
    }

    // MARK: - Save

    private func save() {
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        let trimmedDesc = description.trimmingCharacters(in: .whitespaces)

        let request = CreateAddonCategoryRequest(
            name: trimmedName,
            description: trimmedDesc.isEmpty ? nil : trimmedDesc,
            displayOrder: Int(displayOrder),
            isRequired: isRequired,
            minSelections: Int(minSelections),
            maxSelections: Int(maxSelections)
        )

        isSaving = true
        Task {
            await onSave(request)
            isSaving = false
        }
    }
}

// MARK: - Addon Form Sheet

struct AddonFormView: View {
    let addon: Addon?
    let categoryId: Int
    let onSave: (CreateAddonRequest) -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var name: String = ""
    @State private var description: String = ""
    @State private var price: String = ""
    @State private var isAvailable: Bool = true
    @State private var displayOrder: String = ""
    @State private var isSaving = false

    private var isFormValid: Bool {
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        guard !trimmedName.isEmpty else { return false }
        guard let priceValue = Double(price), priceValue >= 0 else { return false }
        return true
    }

    var body: some View {
        NavigationView {
            Form {
                Section {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Название")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        TextField("Например: Острый соус", text: $name)
                            .textFieldStyle(.roundedBorder)
                    }
                    .padding(.vertical, 4)

                    VStack(alignment: .leading, spacing: 6) {
                        Text("Описание")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        TextField("Необязательное описание", text: $description)
                            .textFieldStyle(.roundedBorder)
                    }
                    .padding(.vertical, 4)

                    VStack(alignment: .leading, spacing: 6) {
                        Text("Цена (₽)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        TextField("0", text: $price)
                            .keyboardType(.decimalPad)
                            .textFieldStyle(.roundedBorder)
                    }
                    .padding(.vertical, 4)

                    VStack(alignment: .leading, spacing: 6) {
                        Text("Порядок отображения")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        TextField("0", text: $displayOrder)
                            .keyboardType(.numberPad)
                            .textFieldStyle(.roundedBorder)
                    }
                    .padding(.vertical, 4)
                }
                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                .listRowBackground(Color.clear)

                Section {
                    Toggle("Доступно для заказа", isOn: $isAvailable)
                        .tint(.appSuccess)
                }
                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                .listRowBackground(Color.clear)
            }
            .formStyle(.grouped)
            .navigationTitle(addon == nil ? "Новое дополнение" : "Редактирование")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Отмена") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(addon == nil ? "Добавить" : "Сохранить") {
                        save()
                    }
                    .fontWeight(.semibold)
                    .foregroundColor(isFormValid ? .appPrimary : .gray)
                    .disabled(!isFormValid || isSaving)
                }
            }
        }
        .onAppear {
            guard let addon = addon else { return }
            name = addon.name
            description = addon.description ?? ""
            price = addon.price == 0 ? "" : String(format: "%.0f", addon.price)
            isAvailable = addon.isAvailable ?? true
            displayOrder = addon.displayOrder.map(String.init) ?? ""
        }
    }

    // MARK: - Save

    private func save() {
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        let trimmedDesc = description.trimmingCharacters(in: .whitespaces)

        let request = CreateAddonRequest(
            name: trimmedName,
            description: trimmedDesc.isEmpty ? nil : trimmedDesc,
            price: Double(price) ?? 0,
            addonCategoryId: categoryId,
            isAvailable: isAvailable,
            displayOrder: Int(displayOrder)
        )

        isSaving = true
        Task {
            await onSave(request)
            isSaving = false
        }
    }
}
