import SwiftUI

// MARK: - Admin Order Detail View

struct AdminOrderDetailView: View {
    let order: Order

    @State private var showDeleteAlert = false
    @State private var isUpdating = false
    @State private var errorMessage: String = ""
    @State private var successMessage: String = ""
    @State private var isEditing = false
    @State private var editName: String = ""
    @State private var editPhone: String = ""
    @State private var editAddress: String = ""
    @State private var editNotes: String = ""

    private let statusOptions = ["Новый", "Готовится", "Готов", "Доставлен", "Отменён"]

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Order header
                orderHeader

                // Status management
                statusSection

                // Customer info (editable)
                customerInfoSection

                // Order items
                orderItemsSection

                // Error/Success messages
                if !errorMessage.isEmpty {
                    ErrorBanner(message: errorMessage)
                }
                if !successMessage.isEmpty {
                    SuccessBanner(message: successMessage)
                }

                // Action buttons
                actionButtons
            }
            .padding(16)
        }
        .navigationTitle("Заказ #\(order.id)")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.visible, for: .navigationBar)
        .alert("Удалить заказ?", isPresented: $showDeleteAlert) {
            Button("Отмена", role: .cancel) {}
            Button("Удалить", role: .destructive) {
                Task { await deleteOrder() }
            }
        } message: {
            Text("Заказ #\(order.id) будет удалён безвозвратно")
        }
        .onAppear {
            editName = order.customerName
            editPhone = order.phone
            editAddress = order.address
            editNotes = order.notes ?? ""
        }
    }

    // MARK: - Order Header

    private var orderHeader: some View {
        VStack(spacing: 12) {
            HStack {
                Text("Заказ #\(order.id)")
                    .font(.title2)
                    .fontWeight(.bold)
                Spacer()
                StatusBadgeView(status: order.status)
            }

            HStack {
                Text("Итого")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                Spacer()
                Text("\(Int(order.total)) ₽")
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(.appPrimary)
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(14)
    }

    // MARK: - Status Section

    private var statusSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Статус заказа")
                .font(.headline)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(statusOptions, id: \.self) { status in
                        Button {
                            Task { await changeStatus(status) }
                        } label: {
                            Text(status)
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(order.status == status ? .white : .primary)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 10)
                                .background(order.status == status ? Color.appPrimary : Color.appPrimary.opacity(0.1))
                                .cornerRadius(10)
                        }
                        .disabled(order.status == status || isUpdating)
                    }
                }
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(14)
    }

    // MARK: - Customer Info

    private var customerInfoSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Информация о клиенте")
                    .font(.headline)
                Spacer()
                Button {
                    withAnimation { isEditing.toggle() }
                } label: {
                    Text(isEditing ? "Готово" : "Изменить")
                        .font(.caption)
                        .foregroundColor(.appPrimary)
                }
            }

            if isEditing {
                // Editable fields
                VStack(spacing: 12) {
                    EditableField(title: "Имя", text: $editName, icon: "person.fill")
                    EditableField(title: "Телефон", text: $editPhone, icon: "phone.fill", keyboardType: .phonePad)
                    EditableField(title: "Адрес", text: $editAddress, icon: "location.fill")

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Примечание")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        TextEditor(text: $editNotes)
                            .font(.subheadline)
                            .frame(height: 80)
                            .padding(8)
                            .background(Color.appBackground)
                            .cornerRadius(8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color.gray.opacity(0.2), lineWidth: 0.5)
                            )
                    }

                    Button {
                        Task { await saveOrderEdits() }
                    } label: {
                        HStack {
                            if isUpdating {
                                ProgressView()
                                    .tint(.white)
                            }
                            Text("Сохранить изменения")
                                .fontWeight(.medium)
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Color.appPrimary)
                        .cornerRadius(10)
                    }
                    .disabled(isUpdating)
                }
            } else {
                // Read-only fields
                InfoRow(icon: "person.fill", title: "Имя", value: order.customerName)
                InfoRow(icon: "phone.fill", title: "Телефон", value: order.phone)
                InfoRow(icon: "location.fill", title: "Адрес", value: order.address.isEmpty ? "Самовывоз" : order.address)

                if let notes = order.notes, !notes.isEmpty {
                    InfoRow(icon: "text.bubble", title: "Примечание", value: notes)
                }
            }

            InfoRow(icon: "calendar", title: "Создан", value: formatDate(order.createdAt))

            if let completed = order.completedAt {
                InfoRow(icon: "checkmark.circle", title: "Завершён", value: formatDate(completed))
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(14)
    }

    // MARK: - Order Items

    private var orderItemsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Состав заказа")
                .font(.headline)

            ForEach(order.orderItems ?? []) { item in
                VStack(spacing: 8) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.name)
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Text("\(item.quantity) × \(Int(item.price)) ₽")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        Text("\(Int(item.subtotal ?? item.price * Double(item.quantity))) ₽")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                    }

                    // Show addons
                    if let addons = item.selectedAddons, !addons.isEmpty {
                        VStack(alignment: .leading, spacing: 2) {
                            ForEach(addons) { addon in
                                HStack {
                                    Text("• \(addon.addonName)")
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                    Spacer()
                                    Text("+\(Int(addon.price * Double(addon.quantity))) ₽")
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                        .padding(.leading, 8)
                    }
                }
                .padding(12)
                .background(Color.appBackground)
                .cornerRadius(10)
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(14)
    }

    // MARK: - Action Buttons

    private var actionButtons: some View {
        VStack(spacing: 12) {
            Button(role: .destructive) {
                showDeleteAlert = true
            } label: {
                HStack {
                    Image(systemName: "trash")
                    Text("Удалить заказ")
                        .fontWeight(.medium)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(Color.appError)
                .cornerRadius(14)
            }
        }
    }

    // MARK: - Actions

    private func changeStatus(_ newStatus: String) async {
        isUpdating = true
        errorMessage = ""
        successMessage = ""

        do {
            _ = try await APIClient.shared.updateOrderStatus(orderId: order.id, status: newStatus)
            successMessage = "Статус изменён на \"\(newStatus)\""
        } catch {
            errorMessage = "Ошибка: \(error.localizedDescription)"
        }

        isUpdating = false
    }

    private func saveOrderEdits() async {
        isUpdating = true
        errorMessage = ""
        successMessage = ""

        do {
            _ = try await APIClient.shared.updateOrder(
                orderId: order.id,
                request: UpdateOrderRequest(
                    status: nil,
                    total: nil,
                    customerName: editName.trimmingCharacters(in: .whitespaces),
                    phone: editPhone.trimmingCharacters(in: .whitespaces),
                    address: editAddress.trimmingCharacters(in: .whitespaces),
                    notes: editNotes.trimmingCharacters(in: .whitespaces)
                )
            )
            successMessage = "Изменения сохранены"
            isEditing = false
        } catch {
            errorMessage = "Ошибка: \(error.localizedDescription)"
        }

        isUpdating = false
    }

    private func deleteOrder() async {
        do {
            try await APIClient.shared.deleteOrder(orderId: order.id)
        } catch {
            errorMessage = "Ошибка: \(error.localizedDescription)"
        }
    }

    private func formatDate(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = formatter.date(from: dateString) else {
            formatter.formatOptions = [.withInternetDateTime]
            guard let date2 = formatter.date(from: dateString) else {
                return dateString
            }
            return date2.formatted(.dateTime.month().day().hour().minute())
        }
        return date.formatted(.dateTime.month().day().hour().minute())
    }
}

// MARK: - Info Row

private struct InfoRow: View {
    let icon: String
    let title: String
    let value: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(width: 16)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                Text(value)
                    .font(.subheadline)
            }
            Spacer()
        }
    }
}

// MARK: - Editable Field

struct EditableField: View {
    let title: String
    @Binding var text: String
    var icon: String = ""
    var keyboardType: UIKeyboardType = .default

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
            TextField("", text: $text)
                .font(.subheadline)
                .keyboardType(keyboardType)
                .padding(8)
                .background(Color.appBackground)
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.gray.opacity(0.2), lineWidth: 0.5)
                )
        }
    }
}

// MARK: - Success Banner

struct SuccessBanner: View {
    let message: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "checkmark.circle.fill")
                .font(.caption)
            Text(message)
                .font(.caption)
        }
        .foregroundColor(.appSuccess)
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.appSuccess.opacity(0.1))
        .cornerRadius(10)
    }
}
