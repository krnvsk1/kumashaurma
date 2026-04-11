import SwiftUI

// MARK: - Admin Create / Edit Item View

struct AdminCreateEditItemView: View {
    let shawarma: Shawarma?
    let parentShawarma: Shawarma?  // Pre-set parent for creating a child
    let onSave: () -> Void

    // MARK: - Form State

    @State private var name: String = ""
    @State private var priceText: String = ""
    @State private var description: String = ""
    @State private var isSpicy: Bool = false
    @State private var hasCheese: Bool = false
    @State private var isAvailable: Bool = true
    @State private var isPromo: Bool = false

    // MARK: - Parent Selection State

    @State private var isChild: Bool = false
    @State private var selectedParentId: Int? = nil
    @State private var parentCards: [Shawarma] = []

    // MARK: - UI State

    @State private var isLoading: Bool = false
    @State private var errorMessage: String = ""
    @State private var showErrorAlert: Bool = false
    @State private var isLoadingParents: Bool = true

    // MARK: - Computed

    private var isEditing: Bool { shawarma != nil }
    private var isCreatingChild: Bool { parentShawarma != nil && shawarma == nil }
    private var screenTitle: String {
        if isCreatingChild { return "Новая позиция" }
        return isEditing ? "Редактировать" : "Новое блюдо"
    }

    private var isFormValid: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty
            && (isChild ? !priceText.trimmingCharacters(in: .whitespaces).isEmpty && (Double(priceText) ?? 0) > 0 : true)
    }

    private var selectedParentName: String? {
        guard let parentId = selectedParentId else { return nil }
        return parentCards.first(where: { $0.id == parentId })?.name
    }

    // MARK: - Init

    init(shawarma: Shawarma? = nil, parentShawarma: Shawarma? = nil, onSave: @escaping () -> Void) {
        self.shawarma = shawarma
        self.parentShawarma = parentShawarma
        self.onSave = onSave
    }

    // MARK: - Body

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Error banner
                    if !errorMessage.isEmpty {
                        ErrorBanner(message: errorMessage)
                    }

                    // Type selection (parent card or child item)
                    if !isEditing && !isCreatingChild {
                        typeSection
                    }

                    // Basic info
                    basicInfoSection

                    // Parent card selection (for child items)
                    if isChild || isCreatingChild {
                        parentSelectionSection
                    }

                    // Description
                    descriptionSection

                    // Toggles
                    togglesSection
                }
                .padding(16)
            }
            .background(Color.appBackground)
            .navigationTitle(screenTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    if isEditing {
                        Text("Отмена")
                            .foregroundColor(.appPrimary)
                    }
                }
            }
            .safeAreaInset(edge: .bottom) {
                saveButton
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
                    .padding(.bottom, 8)
                    .background(Color(.systemBackground).ignoresSafeArea(edges: .bottom))
            }
            .alert("Ошибка", isPresented: $showErrorAlert) {
                Button("ОК", role: .cancel) {}
            } message: {
                Text(errorMessage)
            }
            .onAppear {
                prefillForm()
                loadParentCards()
            }
        }
    }

    // MARK: - Type Section

    private var typeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader("Тип")

            HStack(spacing: 12) {
                // Parent card option
                Button {
                    withAnimation { isChild = false }
                } label: {
                    VStack(spacing: 8) {
                        Image(systemName: "square.grid.2x2")
                            .font(.title2)
                            .foregroundColor(isChild ? .secondary : .appPrimary)
                        Text("Карточка")
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(isChild ? .secondary : .appPrimary)
                        Text("Группа товаров")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(isChild ? Color(.systemGray6) : Color.appPrimary.opacity(0.08))
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .strokeBorder(isChild ? Color.gray.opacity(0.2) : Color.appPrimary, lineWidth: 1.5)
                    )
                }
                .buttonStyle(.plain)

                // Child item option
                Button {
                    withAnimation { isChild = true }
                } label: {
                    VStack(spacing: 8) {
                        Image(systemName: "doc.text")
                            .font(.title2)
                            .foregroundColor(isChild ? .appPrimary : .secondary)
                        Text("Позиция")
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(isChild ? .appPrimary : .secondary)
                        Text("Внутри карточки")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(isChild ? Color.appPrimary.opacity(0.08) : Color(.systemGray6))
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .strokeBorder(isChild ? Color.appPrimary : Color.gray.opacity(0.2), lineWidth: 1.5)
                    )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
    }

    // MARK: - Parent Selection Section

    private var parentSelectionSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader("Родительская карточка")

            if isLoadingParents {
                HStack {
                    ProgressView()
                        .tint(.appPrimary)
                    Text("Загрузка...")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            } else if parentCards.isEmpty {
                Text("Нет родительских карточек. Сначала создайте карточку.")
                    .font(.caption)
                    .foregroundColor(.secondary)
            } else {
                Menu {
                    ForEach(parentCards) { card in
                        Button {
                            selectedParentId = card.id
                        } label: {
                            HStack {
                                Text(card.name)
                                if selectedParentId == card.id {
                                    Image(systemName: "checkmark")
                                }
                            }
                        }
                    }
                } label: {
                    HStack {
                        Text(selectedParentName ?? "Выберите карточку")
                            .foregroundColor(selectedParentId != nil ? .primary : .secondary)
                        Spacer()
                        Image(systemName: "chevron.up.chevron.down")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(12)
                    .background(Color.appBackground)
                    .cornerRadius(10)
                }
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
    }

    // MARK: - Basic Info Section

    private var basicInfoSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            sectionHeader("Основная информация")

            VStack(spacing: 12) {
                // Name
                VStack(alignment: .leading, spacing: 6) {
                    Text("Название *")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    TextField("Введите название", text: $name)
                        .padding(12)
                        .background(Color.appBackground)
                        .cornerRadius(10)
                        .font(.body)
                }

                // Price (required for child items, optional for parent cards)
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text("Цена (\u{20BD})")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        if isChild || isCreatingChild {
                            Text("*")
                                .foregroundColor(.appError)
                        } else {
                            Text("(необязательно для карточки)")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                    TextField("0", text: $priceText)
                        .keyboardType(.decimalPad)
                        .padding(12)
                        .background(Color.appBackground)
                        .cornerRadius(10)
                        .font(.body)
                }
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
    }

    // MARK: - Description Section

    private var descriptionSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader("Описание")

            TextEditor(text: $description)
                .frame(minHeight: 100, maxHeight: 200)
                .padding(12)
                .background(Color.appBackground)
                .cornerRadius(10)
                .font(.body)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color.gray.opacity(0.2), lineWidth: 0.5)
                )
        }
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
    }

    // MARK: - Toggles Section

    private var togglesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader("Параметры")

            VStack(spacing: 0) {
                toggleRow(
                    icon: "checkmark.circle",
                    title: "Доступно",
                    subtitle: "Отображается в меню",
                    isOn: $isAvailable
                )

                Divider()
                    .padding(.leading, 44)

                toggleRow(
                    icon: "tag.fill",
                    title: "Акция",
                    isOn: $isPromo
                )

                Divider()
                    .padding(.leading, 44)

                toggleRow(
                    icon: "flame.fill",
                    title: "Острое",
                    isOn: $isSpicy
                )

                Divider()
                    .padding(.leading, 44)

                toggleRow(
                    icon: "cheese",
                    title: "С сыром",
                    isOn: $hasCheese
                )
            }
            .padding(.vertical, 4)
        }
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
    }

    // MARK: - Save Button

    private var saveButton: some View {
        Button {
            Task { await saveItem() }
        } label: {
            Group {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                } else {
                    Text("Сохранить")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                }
            }
            .background(isFormValid && !isLoading ? Color.appPrimary : Color.gray.opacity(0.3))
            .foregroundColor(.white)
            .cornerRadius(14)
        }
        .disabled(!isFormValid || isLoading)
        .animation(.easeInOut(duration: 0.2), value: isFormValid)
    }

    // MARK: - Subviews

    private func sectionHeader(_ title: String) -> some View {
        Text(title)
            .font(.headline)
    }

    private func toggleRow(
        icon: String,
        title: String,
        subtitle: String? = nil,
        isOn: Binding<Bool>
    ) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .frame(width: 28)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            Toggle("", isOn: isOn)
                .labelsHidden()
                .tint(.appPrimary)
        }
        .padding(.vertical, 8)
    }

    // MARK: - Actions

    private func prefillForm() {
        // If creating a child under a parent
        if let parent = parentShawarma {
            isChild = true
            selectedParentId = parent.id
            return
        }

        guard let item = shawarma else { return }
        name = item.name
        priceText = item.price == floor(item.price)
            ? "\(Int(item.price))"
            : "\(item.price)"
        description = item.description
        isSpicy = item.isSpicy
        hasCheese = item.hasCheese
        isAvailable = item.isAvailable
        isPromo = item.isPromo

        // If editing a child item
        if let parentId = item.parentId {
            isChild = true
            selectedParentId = parentId
        }
    }

    private func loadParentCards() {
        isLoadingParents = true
        Task {
            do {
                let all = try await APIClient.shared.getMenu()
                parentCards = all.filter { $0.isParentCard }
            } catch {
                parentCards = []
            }
            isLoadingParents = false
        }
    }

    // MARK: - Save

    private func saveItem() async {
        // Validate
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        guard !trimmedName.isEmpty else {
            showFormError("Введите название")
            return
        }

        let price = Double(priceText)

        // Validate price for child items
        let isChildItem = isChild || isCreatingChild
        if isChildItem {
            guard let priceValue = price, priceValue > 0 else {
                showFormError("Введите корректную цену для позиции")
                return
            }
            guard selectedParentId != nil else {
                showFormError("Выберите родительскую карточку")
                return
            }
        }

        isLoading = true
        errorMessage = ""

        do {
            if let item = shawarma {
                // Edit mode
                let request = UpdateShawarmaRequest(
                    name: trimmedName,
                    price: price,
                    description: description.trimmingCharacters(in: .whitespaces).isEmpty
                        ? nil
                        : description.trimmingCharacters(in: .whitespaces),
                    isSpicy: isSpicy,
                    hasCheese: hasCheese,
                    isAvailable: isAvailable,
                    isPromo: isPromo
                )
                _ = try await APIClient.shared.updateShawarma(id: item.id, request: request)
            } else {
                // Create mode
                let request = CreateShawarmaRequest(
                    name: trimmedName,
                    price: price,
                    description: description.trimmingCharacters(in: .whitespaces).isEmpty
                        ? nil
                        : description.trimmingCharacters(in: .whitespaces),
                    isSpicy: isSpicy,
                    hasCheese: hasCheese,
                    isAvailable: isAvailable,
                    isPromo: isPromo,
                    parentId: isChildItem ? selectedParentId : nil
                )
                _ = try await APIClient.shared.createShawarma(request: request)
            }

            onSave()
        } catch {
            showFormError("Не удалось сохранить: \(error.localizedDescription)")
        }

        isLoading = false
    }

    private func showFormError(_ message: String) {
        errorMessage = message
        showErrorAlert = true
    }
}
