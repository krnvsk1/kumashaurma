import SwiftUI

// MARK: - Admin Menu View

struct AdminMenuView: View {
    @State private var shawarmas: [Shawarma] = []
    @State private var isLoading = true
    @State private var errorMessage: String = ""

    var body: some View {
        VStack(spacing: 0) {
            if isLoading {
                Spacer()
                ProgressView("Загрузка меню...")
                Spacer()
            } else if shawarmas.isEmpty {
                Spacer()
                VStack(spacing: 12) {
                    Image(systemName: "takeoutbag.and.cup.and.straw")
                        .font(.title2)
                        .foregroundColor(.secondary)
                    Text("Меню пусто")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                Spacer()
            } else {
                List {
                    ForEach(shawarmas) { shawarma in
                        AdminMenuItemRow(shawarma: shawarma) { newValue in
                            Task { await toggleAvailability(id: shawarma.id, isAvailable: newValue) }
                        }
                        .listRowInsets(EdgeInsets(top: 6, leading: 16, bottom: 6, trailing: 16))
                        .listRowSeparator(.hidden)
                        .listRowBackground(Color.clear)
                    }
                }
                .listStyle(.plain)
            }
        }
        .navigationTitle("Управление меню")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.visible, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Task { await loadMenu() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
            }
        }
        .task { await loadMenu() }
        .refreshable { await loadMenu() }
    }

    private func loadMenu() async {
        isLoading = true
        do {
            shawarmas = try await APIClient.shared.getMenu()
        } catch {
            errorMessage = error.localizedDescription
            shawarmas = []
        }
        isLoading = false
    }

    private func toggleAvailability(id: Int, isAvailable: Bool) async {
        do {
            try await APIClient.shared.updateShawarmaAvailability(id: id, isAvailable: isAvailable)
            // Update local state
            if let index = shawarmas.firstIndex(where: { $0.id == id }) {
                // Since Shawarma properties are let, we need to refetch
                await loadMenu()
            }
        } catch {
            await loadMenu() // Refresh to revert UI state
        }
    }
}

// MARK: - Admin Menu Item Row

struct AdminMenuItemRow: View {
    let shawarma: Shawarma
    let onToggle: (Bool) -> Void

    var body: some View {
        HStack(spacing: 14) {
            // Thumbnail
            Group {
                if let imagePath = shawarma.primaryImage,
                   let url = APIClient.shared.getImageURL(imagePath) {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .success(let image):
                            image.resizable().aspectRatio(contentMode: .fill)
                        default:
                            Color.appBackground
                        }
                    }
                } else {
                    Color.appBackground
                }
            }
            .frame(width: 56, height: 56)
            .cornerRadius(10)
            .clipped()
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(Color.gray.opacity(0.2), lineWidth: 0.5)
            )

            // Info
            VStack(alignment: .leading, spacing: 4) {
                Text(shawarma.name)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .lineLimit(1)

                HStack(spacing: 8) {
                    Text(shawarma.category)
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text("\(Int(shawarma.displayPrice)) ₽")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.appPrimary)
                }
            }

            Spacer()

            // Availability toggle
            Toggle("", isOn: Binding(
                get: { shawarma.isAvailable },
                set: { onToggle($0) }
            ))
            .labelsHidden()
            .tint(.appPrimary)
        }
        .padding(12)
        .background(Color(.systemBackground))
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)
        .opacity(shawarma.isAvailable ? 1.0 : 0.6)
    }
}
