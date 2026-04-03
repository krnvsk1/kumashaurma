import SwiftUI

// MARK: - Admin Create / Edit Item View

struct AdminCreateEditItemView: View {
    let shawarma: Shawarma?
    let onSave: () -> Void

    // MARK: - Form State

    @State private var name: String = ""
    @State private var priceText: String = ""
    @State private var description: String = ""
    @State private var category: String = "Курица"
    @State private var isSpicy: Bool = false
    @State private var hasCheese: Bool = false
    @State private var isAvailable: Bool = true
    @State private var isPromo: Bool = false

    // MARK: - Variants State

    @State private var variants: [VariantFormData] = []

    // MARK: - UI State

    @State private var isLoading: Bool = false
    @State private var errorMessage: String = ""
    @State private var showErrorAlert: Bool = false

    // MARK: - Computed

    private var isEditing: Bool { shawarma != nil }
    private var screenTitle: String { isEditing ? "Редактировать" : "Новое блюдо" }

    private let categories = ["Курица", "Говядина", "Свинина", "Рыба", "Вегетарианская", "Другое"]

    private var isFormValid: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty
            && !priceText.trimmingCharacters(in: .whitespaces).isEmpty
            && (Double(priceText) ?? 0) > 0
    }

    // MARK: - Init

    init(shawarma: Shawarma? = nil, onSave: @escaping () -> Void) {
        self.shawarma = shawarma
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

                    // Basic info
                    basicInfoSection

                    // Category picker
                    categorySection

                    // Description
                    descriptionSection

                    // Toggles
                    togglesSection

                    // Variants
                    variantsSection
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
            }
        }
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

                // Price
                VStack(alignment: .leading, spacing: 6) {
                    Text("Цена (₽) *")
                        .font(.caption)
                        .foregroundColor(.secondary)
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

    // MARK: - Category Section

    private var categorySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader("Категория")

            Picker("Категория", selection: $category) {
                ForEach(categories, id: \.self) { cat in
                    Text(cat).tag(cat)
                }
            }
            .pickerStyle(.menu)
            .padding(12)
            .background(Color.appBackground)
            .cornerRadius(10)
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
                    icon: "🌶️",
                    title: "Острое",
                    isOn: $isSpicy
                )

                Divider()
                    .padding(.leading, 44)

                toggleRow(
                    icon: "🧀",
                    title: "С сыром",
                    isOn: $hasCheese
                )

                Divider()
                    .padding(.leading, 44)

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
            }
            .padding(.vertical, 4)
        }
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
    }

    // MARK: - Variants Section

    private var variantsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                sectionHeader("Варианты")

                Spacer()

                Text("\(variants.count)")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(variants.isEmpty ? Color.gray.opacity(0.4) : Color.appPrimary)
                    .cornerRadius(10)
            }

            if variants.isEmpty {
                emptyVariantsPlaceholder
            } else {
                VStack(spacing: 10) {
                    ForEach($variants) { $variant in
                        variantRow(variant: $variant)
                    }
                }
            }

            // Add variant button
            Button {
                addVariant()
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "plus.circle.fill")
                        .font(.subheadline)
                    Text("Добавить вариант")
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
                .foregroundColor(.appPrimary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(Color.appPrimary.opacity(0.08))
                .cornerRadius(10)
            }
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
            Text(icon)
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

    private func variantRow(variant: Binding<VariantFormData>) -> some View {
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Название")
                    .font(.caption2)
                    .foregroundColor(.secondary)
                TextField("Размер", text: variant.name)
                    .font(.subheadline)
                    .padding(8)
                    .background(Color.appBackground)
                    .cornerRadius(8)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text("Цена (₽)")
                    .font(.caption2)
                    .foregroundColor(.secondary)
                TextField("0", text: variant.priceText)
                    .keyboardType(.decimalPad)
                    .font(.subheadline)
                    .padding(8)
                    .background(Color.appBackground)
                    .cornerRadius(8)
                    .frame(width: 90)
            }

            Button {
                removeVariant(id: variant.wrappedValue.id)
            } label: {
                Image(systemName: "minus.circle.fill")
                    .font(.title3)
                    .foregroundColor(.appError.opacity(0.8))
            }
            .buttonStyle(.plain)
        }
        .padding(12)
        .background(Color.appBackground)
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.gray.opacity(0.15), lineWidth: 0.5)
        )
    }

    private var emptyVariantsPlaceholder: some View {
        VStack(spacing: 8) {
            Image(systemName: "list.bullet.rectangle.portrait")
                .font(.title3)
                .foregroundColor(.secondary)
            Text("Нет вариантов")
                .font(.caption)
                .foregroundColor(.secondary)
            Text("Добавьте размеры или порции блюда")
                .font(.caption2)
                .foregroundColor(.secondary.opacity(0.8))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
    }

    // MARK: - Actions

    private func prefillForm() {
        guard let item = shawarma else { return }
        name = item.name
        priceText = item.price == floor(item.price)
            ? "\(Int(item.price))"
            : "\(item.price)"
        description = item.description
        category = item.category
        isSpicy = item.isSpicy
        hasCheese = item.hasCheese
        isAvailable = item.isAvailable
        isPromo = item.isPromo
        variants = (item.variants ?? []).map {
            VariantFormData(
                id: $0.id,
                name: $0.name,
                priceText: $0.price == floor($0.price)
                    ? "\(Int($0.price))"
                    : "\($0.price)"
            )
        }
    }

    private func addVariant() {
        variants.append(VariantFormData(id: UUID(), name: "", priceText: ""))
    }

    private func removeVariant(id: UUID) {
        variants.removeAll { $0.id == id }
    }

    // MARK: - Save

    private func saveItem() async {
        // Validate
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        guard !trimmedName.isEmpty else {
            showFormError("Введите название блюда")
            return
        }

        guard let price = Double(priceText), price > 0 else {
            showFormError("Введите корректную цену")
            return
        }

        // Validate variants
        let validVariants = variants.compactMap { variant -> VariantRequest? in
            let trimmedVariantName = variant.name.trimmingCharacters(in: .whitespaces)
            guard !trimmedVariantName.isEmpty,
                  let variantPrice = Double(variant.priceText),
                  variantPrice > 0 else {
                return nil
            }
            return VariantRequest(name: trimmedVariantName, price: variantPrice)
        }

        // Check for partially filled variants
        let hasIncompleteVariant = variants.contains { variant in
            let nameFilled = !variant.name.trimmingCharacters(in: .whitespaces).isEmpty
            let priceFilled = !variant.priceText.trimmingCharacters(in: .whitespaces).isEmpty
            return nameFilled != priceFilled // XOR: one filled but not the other
        }

        if hasIncompleteVariant {
            showFormError("Заполните все поля вариантов или удалите незаполненные")
            return
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
                    category: category,
                    isSpicy: isSpicy,
                    hasCheese: hasCheese,
                    isAvailable: isAvailable,
                    isPromo: isPromo,
                    variants: validVariants.isEmpty ? nil : validVariants
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
                    category: category,
                    isSpicy: isSpicy,
                    hasCheese: hasCheese,
                    isAvailable: isAvailable,
                    isPromo: isPromo,
                    variants: validVariants.isEmpty ? nil : validVariants
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

// MARK: - Variant Form Data (local editing state)

struct VariantFormData: Identifiable {
    let id: UUID
    var name: String
    var priceText: String

    init(id: UUID = UUID(), name: String, priceText: String) {
        self.id = id
        self.name = name
        self.priceText = priceText
    }
}

// MARK: - Error Banner

private struct ErrorBanner: View {
    let message: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.caption)
            Text(message)
                .font(.caption)
                .lineLimit(3)
        }
        .foregroundColor(.appError)
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.appError.opacity(0.1))
        .cornerRadius(10)
    }
}
