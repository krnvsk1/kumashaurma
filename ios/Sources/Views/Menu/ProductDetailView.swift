import SwiftUI

// MARK: - Product Detail View

struct ProductDetailView: View {
    let shawarma: Shawarma

    @State private var selectedVariant: ProductVariant?
    @State private var selectedAddons: Set<SelectedAddon> = []
    @State private var quantity: Int = 1
    @State private var addonCategories: [AddonCategory] = []
    @State private var currentImageIndex: Int = 0
    @State private var isLoadingAddons: Bool = false
    @State private var showAddedFeedback: Bool = false

    private let cartService = CartService.shared

    // MARK: - Computed Properties

    private var allImages: [ShawarmaImage] {
        shawarma.images ?? []
    }

    private var effectivePrice: Double {
        selectedVariant?.price ?? shawarma.displayPrice
    }

    private var addonsTotal: Double {
        selectedAddons.reduce(0) { $0 + $1.price * Double($1.quantity) }
    }

    private var totalPrice: Double {
        (effectivePrice + addonsTotal) * Double(quantity)
    }

    private var canAddToCart: Bool {
        shawarma.isAvailable && !isLoadingAddons
    }

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Image carousel
                imageCarousel

                // Product content
                VStack(alignment: .leading, spacing: 20) {
                    // Name & price
                    titleSection

                    // Description
                    if !shawarma.description.isEmpty {
                        Text(shawarma.description)
                            .font(.body)
                            .foregroundColor(.secondary)
                            .lineSpacing(4)
                    }

                    Divider()

                    // Variant selection
                    variantSection

                    // Addons
                    addonsSection
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
            }
        }
        .ignoresSafeArea(.container, edges: .top)
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.hidden, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                NavigationLink {
                    CartView()
                } label: {
                    CartBadgeView()
                }
            }
        }
        .overlay(alignment: .bottom) {
            bottomBar
        }
        .onAppear {
            loadAddons()
        }
        .overlay {
            if showAddedFeedback {
                addedToCartFeedback
            }
        }
    }

    // MARK: - Image Carousel

    private var imageCarousel: some View {
        ZStack(alignment: .bottom) {
            if allImages.isEmpty {
                // Placeholder
                ZStack {
                    Color.appBackground
                    Image(systemName: "fork.knife")
                        .font(.system(size: 48))
                        .foregroundColor(.secondary)
                        .opacity(0.3)
                }
                .frame(height: 320)
            } else {
                TabView(selection: $currentImageIndex) {
                    ForEach(Array(allImages.enumerated()), id: \.offset) { index, image in
                        if let url = APIClient.shared.getImageURL(image.filePath) {
                            AsyncImage(url: url) { phase in
                                switch phase {
                                case .success(let img):
                                    img
                                        .resizable()
                                        .aspectRatio(contentMode: .fill)
                                case .failure, .empty:
                                    Color.appBackground
                                @unknown default:
                                    Color.appBackground
                                }
                            }
                            .frame(height: 320)
                            .frame(maxWidth: .infinity)
                            .clipped()
                            .tag(index)
                        }
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))

                // Page indicators
                if allImages.count > 1 {
                    HStack(spacing: 6) {
                        ForEach(Array(allImages.indices), id: \.self) { index in
                            Capsule()
                                .fill(index == currentImageIndex ? Color.white : Color.white.opacity(0.4))
                                .frame(width: index == currentImageIndex ? 24 : 8, height: 8)
                                .animation(.easeInOut(duration: 0.2), value: currentImageIndex)
                        }
                    }
                    .padding(.bottom, 16)
                }
            }

            // Status & promo badges overlay
            VStack {
                HStack {
                    if shawarma.isPromo {
                        promoBadge
                    }
                    Spacer()
                    availabilityBadge
                }
                Spacer()
            }
            .padding(16)
        }
        .frame(height: 320)
        .cornerRadius(0, corners: [.bottomLeft, .bottomRight])
    }

    private var promoBadge: some View {
        HStack(spacing: 4) {
            Image(systemName: "tag.fill")
                .font(.caption2)
            Text("АКЦИЯ")
                .font(.caption)
                .fontWeight(.bold)
        }
        .foregroundColor(.white)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color.appAccent)
        .cornerRadius(8)
    }

    @ViewBuilder
    private var availabilityBadge: some View {
        if shawarma.isAvailable {
            Label("Доступен", systemImage: "checkmark.circle.fill")
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(.white)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Color.appSuccess)
                .cornerRadius(8)
        } else {
            Label("Недоступен", systemImage: "xmark.circle.fill")
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(.white)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Color.gray)
                .cornerRadius(8)
        }
    }

    // MARK: - Title Section

    private var titleSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(shawarma.name)
                        .font(.appTitle)

                    if let variants = shawarma.variants, !variants.isEmpty {
                        Text("от \(Int(variants.map(\.price).min() ?? 0)) ₽")
                            .font(.title3)
                            .fontWeight(.semibold)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                // Badges
                HStack(spacing: 6) {
                    if shawarma.isSpicy {
                        Image(systemName: "flame.fill")
                            .foregroundColor(.red)
                    }
                    if shawarma.hasCheese {
                        Image(systemName: "cheese")
                            .foregroundColor(.orange)
                    }
                }
                .font(.title3)
            }

            if selectedVariant != nil || shawarma.variants?.isEmpty != false {
                Text("\(Int(effectivePrice)) ₽")
                    .font(.appPrice)
            }

            // Category tag
            if !shawarma.category.isEmpty {
                Text(shawarma.category)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.appPrimary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Color.appPrimary.opacity(0.1))
                    .cornerRadius(6)
            }
        }
    }

    // MARK: - Variant Section

    @ViewBuilder
    private var variantSection: some View {
        if let variants = shawarma.variants, !variants.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                Text("Вариант")
                    .font(.headline)
                    .fontWeight(.semibold)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 10) {
                        ForEach(variants) { variant in
                            variantChip(variant)
                        }
                    }
                }
            }

            Divider()
        }
    }

    private func variantChip(_ variant: ProductVariant) -> some View {
        let isSelected = selectedVariant?.id == variant.id

        return Button {
            withAnimation(.spring(response: 0.25)) {
                selectedVariant = variant
            }
        } label: {
            VStack(spacing: 4) {
                Text(variant.name)
                    .font(.subheadline)
                    .fontWeight(isSelected ? .semibold : .regular)
                    .foregroundColor(isSelected ? .white : .primary)

                Text("\(Int(variant.price)) ₽")
                    .font(.caption)
                    .foregroundColor(isSelected ? .white.opacity(0.85) : .secondary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(isSelected ? Color.appPrimary : Color(.systemGray6))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .strokeBorder(
                        isSelected ? Color.appPrimary : Color.gray.opacity(0.3),
                        lineWidth: isSelected ? 2 : 1
                    )
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Addons Section

    @ViewBuilder
    private var addonsSection: some View {
        if !addonCategories.isEmpty {
            VStack(alignment: .leading, spacing: 20) {
                Text("Добавки")
                    .font(.headline)
                    .fontWeight(.semibold)

                if isLoadingAddons {
                    HStack {
                        ProgressView()
                            .tint(.appPrimary)
                        Text("Загрузка добавок...")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                } else {
                    ForEach(addonCategories) { category in
                        addonCategorySection(category)
                    }
                }
            }
        }
    }

    private func addonCategorySection(_ category: AddonCategory) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(category.name)
                    .font(.subheadline)
                    .fontWeight(.semibold)

                if category.isRequired == true {
                    Text("Обязательно")
                        .font(.caption2)
                        .fontWeight(.medium)
                        .foregroundColor(.appAccent)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(Color.appAccent.opacity(0.12))
                        .cornerRadius(4)
                }
            }

            if let description = category.description, !description.isEmpty {
                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            if let addons = category.addons, !addons.isEmpty {
                ForEach(addons) { addon in
                    addonRow(addon)
                }
            }
        }
    }

    private func addonRow(_ addon: Addon) -> some View {
        let isSelected = selectedAddons.contains(where: { $0.addonId == addon.id })

        return Button {
            toggleAddon(addon)
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(addon.name)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(isSelected ? .white : .primary)

                    if let description = addon.description, !description.isEmpty {
                        Text(description)
                            .font(.caption2)
                            .foregroundColor(isSelected ? .white.opacity(0.7) : .secondary)
                            .lineLimit(1)
                    }
                }

                Spacer()

                Text("+\(Int(addon.price)) ₽")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(isSelected ? .white : .appPrimary)
            }
            .padding(14)
            .background(isSelected ? Color.appPrimary : Color(.systemGray6))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .strokeBorder(
                        isSelected ? Color.appPrimary : Color.gray.opacity(0.3),
                        lineWidth: isSelected ? 2 : 1
                    )
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Bottom Bar

    private var bottomBar: some View {
        VStack(spacing: 0) {
            Rectangle()
                .fill(Color(.separator))
                .frame(height: 0.5)

            HStack(spacing: 16) {
                // Quantity controls
                quantityControls

                Spacer()

                // Add to cart button
                Button {
                    addToCart()
                } label: {
                    HStack(spacing: 8) {
                        Text("В корзину")
                            .font(.subheadline)
                            .fontWeight(.semibold)

                        Text("· \(Int(totalPrice)) ₽")
                            .font(.subheadline)
                            .fontWeight(.bold)
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
                    .background(canAddToCart ? Color.appPrimary : Color.gray.opacity(0.4))
                    .cornerRadius(14)
                }
                .disabled(!canAddToCart)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .background(.ultraThinMaterial)
        }
    }

    private var quantityControls: some View {
        HStack(spacing: 4) {
            Button {
                withAnimation { quantity = max(1, quantity - 1) }
            } label: {
                Image(systemName: "minus.circle.fill")
                    .font(.title2)
                    .foregroundColor(quantity > 1 ? .appPrimary : .gray.opacity(0.4))
            }
            .disabled(quantity <= 1)

            Text("\(quantity)")
                .font(.title3)
                .fontWeight(.semibold)
                .frame(minWidth: 36)

            Button {
                withAnimation { quantity += 1 }
            } label: {
                Image(systemName: "plus.circle.fill")
                    .font(.title2)
                    .foregroundColor(.appPrimary)
            }
        }
    }

    // MARK: - Added to Cart Feedback

    private var addedToCartFeedback: some View {
        VStack {
            Spacer()
            HStack(spacing: 10) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.title3)
                    .foregroundColor(.appSuccess)
                Text("Добавлено в корзину")
                    .font(.subheadline)
                    .fontWeight(.semibold)
            }
            .foregroundColor(.white)
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
            .background(Color(.darkGray))
            .cornerRadius(14)
            .padding(.bottom, 100)
            .transition(.move(edge: .bottom).combined(with: .opacity))
        }
    }

    // MARK: - Actions

    private func toggleAddon(_ addon: Addon) {
        withAnimation(.spring(response: 0.25)) {
            if let index = selectedAddons.firstIndex(where: { $0.addonId == addon.id }) {
                selectedAddons.remove(at: index)
            } else {
                selectedAddons.insert(SelectedAddon(
                    addonId: addon.id,
                    name: addon.name,
                    price: addon.price
                ))
            }
        }
    }

    private func addToCart() {
        cartService.addItem(
            shawarma: shawarma,
            quantity: quantity,
            selectedVariant: selectedVariant,
            selectedAddons: Array(selectedAddons)
        )

        // Show feedback
        showAddedFeedback = true
        withAnimation(.easeOut(duration: 0.3)) {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                withAnimation(.easeIn(duration: 0.3)) {
                    showAddedFeedback = false
                }
            }
        }
    }

    private func loadAddons() {
        guard let id = shawarma.id else { return }
        isLoadingAddons = true
        Task {
            do {
                addonCategories = try await APIClient.shared.getShawarmaAddons(shawarmaId: id)
            } catch {
                // Silently fail — addons are optional
                addonCategories = []
            }
            isLoadingAddons = false
        }
    }
}
