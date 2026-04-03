import SwiftUI

// MARK: - Menu View

struct MenuView: View {
    @State private var shawarmas: [Shawarma] = []
    @State private var categories: [String] = []
    @State private var selectedCategory: String? = nil
    @State private var isLoading: Bool = true
    @State private var searchText: String = ""
    @State private var showSearch: Bool = false
    @State private var showError: Bool = false
    @State private var errorMessage: String = ""

    private let columns = [
        GridItem(.flexible(), spacing: 16),
        GridItem(.flexible(), spacing: 16)
    ]

    // MARK: - Computed Properties

    private var filteredShawarmas: [Shawarma] {
        var result = shawarmas.filter { $0.isAvailable }

        if !searchText.isEmpty {
            result = result.filter {
                $0.name.localizedCaseInsensitiveContains(searchText)
                    || $0.description.localizedCaseInsensitiveContains(searchText)
            }
        }

        if let category = selectedCategory {
            result = result.filter { $0.category == category }
        }

        return result
    }

    // MARK: - Body

    var body: some View {
        VStack(spacing: 0) {
            // Header
            headerView

            // Category chips
            if !categories.isEmpty {
                categoryChips
            }

            // Search bar
            if showSearch {
                searchBar
                    .transition(.move(edge: .top).combined(with: .opacity))
            }

            // Content
            contentArea
        }
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text("Меню")
                    .font(.appTitle)
                    .foregroundColor(.primary)
            }

            ToolbarItem(placement: .navigationBarTrailing) {
                HStack(spacing: 8) {
                    Button {
                        withAnimation(.spring(response: 0.3)) {
                            showSearch.toggle()
                        }
                    } label: {
                        Image(systemName: "magnifyingglass")
                            .font(.body)
                            .foregroundColor(.primary)
                            .padding(10)
                            .background(Color.appPrimary.opacity(0.08))
                            .clipShape(Circle())
                    }

                    NavigationLink {
                        CartView()
                    } label: {
                        CartBadgeView()
                    }
                }
            }
        }
        .onAppear {
            if shawarmas.isEmpty { loadMenu() }
        }
        .refreshable { await loadMenuAsync() }
        .alert("Ошибка", isPresented: $showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage)
        }
    }

    // MARK: - Header View

    private var headerView: some View {
        EmptyView() // Using toolbar for header instead
    }

    // MARK: - Category Chips

    private var categoryChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                FilterChip(
                    text: "Все",
                    isSelected: selectedCategory == nil,
                    action: {
                        withAnimation(.spring(response: 0.3)) {
                            selectedCategory = nil
                        }
                    }
                )

                ForEach(categories, id: \.self) { category in
                    FilterChip(
                        text: category,
                        isSelected: selectedCategory == category,
                        action: {
                            withAnimation(.spring(response: 0.3)) {
                                selectedCategory = selectedCategory == category ? nil : category
                            }
                        }
                    )
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
        }
    }

    // MARK: - Search Bar

    private var searchBar: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.secondary)

            TextField("Поиск шаурмы...", text: $searchText)
                .font(.body)

            if !searchText.isEmpty {
                Button {
                    searchText = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(12)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.appPrimary.opacity(0.2), lineWidth: 1)
        )
        .padding(.horizontal, 16)
        .padding(.bottom, 8)
    }

    // MARK: - Content Area

    @ViewBuilder
    private var contentArea: some View {
        if isLoading {
            loadingView
        } else if filteredShawarmas.isEmpty {
            emptyView
        } else {
            productGrid
        }
    }

    private var loadingView: some View {
        VStack(spacing: 16) {
            Spacer()
            ProgressView()
                .scaleEffect(1.5)
                .tint(.appPrimary)
            Text("Загрузка меню...")
                .font(.subheadline)
                .foregroundColor(.secondary)
            Spacer()
        }
    }

    private var emptyView: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "takeoutbag.and.cup.and.straw")
                .font(.system(size: 56))
                .foregroundColor(.secondary)
                .opacity(0.4)
            Text(searchText.isEmpty ? "Нет доступных товаров" : "Ничего не найдено")
                .font(.headline)
                .foregroundColor(.secondary)
            Text("Попробуйте изменить фильтры")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .opacity(0.7)
            Spacer()
        }
    }

    private var productGrid: some View {
        ScrollView {
            LazyVGrid(columns: columns, spacing: 16) {
                ForEach(filteredShawarmas) { shawarma in
                    NavigationLink {
                        ProductDetailView(shawarma: shawarma)
                    } label: {
                        MenuProductCard(shawarma: shawarma)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 32)
        }
    }

    // MARK: - Data Loading

    private func loadMenu() {
        Task {
            await loadMenuAsync()
        }
    }

    private func loadMenuAsync() async {
        isLoading = true
        defer { isLoading = false }

        do {
            async let categoriesTask = APIClient.shared.getCategories()
            async let menuTask = APIClient.shared.getMenu()

            categories = try await categoriesTask
            shawarmas = try await menuTask
        } catch {
            errorMessage = "Не удалось загрузить меню. Проверьте подключение."
            showError = true
        }
    }
}

// MARK: - Filter Chip

struct FilterChip: View {
    let text: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(text)
                .font(.subheadline)
                .fontWeight(isSelected ? .semibold : .regular)
                .foregroundColor(isSelected ? .white : .primary)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(isSelected ? Color.appPrimary : Color.appPrimary.opacity(0.08))
                .cornerRadius(20)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .strokeBorder(
                            isSelected ? Color.clear : Color.appPrimary.opacity(0.25),
                            lineWidth: 1.5
                        )
                )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Menu Product Card

struct MenuProductCard: View {
    let shawarma: Shawarma

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Product image
            productImage

            // Product info
            VStack(alignment: .leading, spacing: 6) {
                // Name
                Text(shawarma.name)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 10)

                // Category badge
                if !shawarma.category.isEmpty {
                    Text(shawarma.category)
                        .font(.caption2)
                        .fontWeight(.medium)
                        .foregroundColor(.appPrimary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.appPrimary.opacity(0.1))
                        .cornerRadius(6)
                }

                // Badges row
                HStack(spacing: 4) {
                    if shawarma.isSpicy {
                        Label("Острое", systemImage: "flame.fill")
                            .font(.caption2)
                            .foregroundColor(.red)
                    }
                    if shawarma.hasCheese {
                        Label("Сыр", systemImage: "cheese")
                            .font(.caption2)
                            .foregroundColor(.orange)
                    }
                    Spacer()
                }

                Spacer()

                // Price
                Text(priceText)
                    .font(.appPrice)
                    .foregroundColor(.primary)
            }
            .padding(.horizontal, 12)
            .padding(.bottom, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.06), radius: 8, x: 0, y: 2)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .strokeBorder(Color(.separator), lineWidth: 0.5)
        )
    }

    // MARK: - Product Image

    @ViewBuilder
    private var productImage: some View {
        ZStack(alignment: .topTrailing) {
            if let imagePath = shawarma.primaryImage,
               let url = APIClient.shared.getImageURL(imagePath) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    case .failure:
                        placeholderView
                    case .empty:
                        ProgressView()
                            .tint(.appPrimary)
                    @unknown default:
                        placeholderView
                    }
                }
                .frame(height: 140)
                .frame(maxWidth: .infinity)
                .clipped()
            } else {
                placeholderView
                    .frame(height: 140)
                    .frame(maxWidth: .infinity)
            }

            // Promo badge
            if shawarma.isPromo {
                Text("АКЦИЯ")
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.appAccent)
                    .cornerRadius(0, corners: [.bottomLeft])
                    .padding(.top, 0)
            }
        }
        .cornerRadius(16, corners: [.topLeft, .topRight])
        .clipped()
    }

    private var placeholderView: some View {
        ZStack {
            Color.appBackground
            Image(systemName: "takeoutbag.and.cup.and.straw")
                .font(.system(size: 28))
                .foregroundColor(.secondary)
                .opacity(0.3)
        }
    }

    // MARK: - Price Text

    private var priceText: String {
        if let variants = shawarma.variants, !variants.isEmpty {
            let minPrice = variants.map(\.price).min() ?? 0
            return "от \(Int(minPrice)) ₽"
        }
        return "\(Int(shawarma.price)) ₽"
    }
}

// MARK: - Cart Badge View

struct CartBadgeView: View {
    @ObservedObject private var cartService = CartService.shared

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Image(systemName: "cart.fill")
                .font(.body)
                .foregroundColor(.primary)
                .padding(10)
                .background(Color.appPrimary.opacity(0.08))
                .clipShape(Circle())

            if cartService.totalItems > 0 {
                Text("\(cartService.totalItems)")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.white)
                    .frame(width: 20, height: 20)
                    .background(Color.appAccent)
                    .clipShape(Circle())
                    .offset(x: 4, y: -4)
            }
        }
    }
}

// MARK: - Rounded Corner Helper

extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}
