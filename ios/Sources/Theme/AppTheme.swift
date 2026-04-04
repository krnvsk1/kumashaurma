import SwiftUI

// MARK: - App Color Palette (adapts to dark mode)

extension Color {
    /// Primary brand color — Ocean Cyan (#0891B2)
    static let appPrimary = Color(red: 0.031, green: 0.569, blue: 0.698)

    /// Accent color — Warm Amber (#F59E0B)
    static let appAccent = Color(red: 0.961, green: 0.620, blue: 0.043)

    /// Light background — (#F1F5F9)
    static let appBackground = Color(UIColor { traitCollection in
        traitCollection.userInterfaceStyle == .dark
            ? UIColor(red: 0.078, green: 0.102, blue: 0.149, alpha: 1.0) // #141A26
            : UIColor(red: 0.945, green: 0.961, blue: 0.976, alpha: 1.0)  // #F1F5F9
    })

    /// Dynamic card/surface background
    static let appSurface = Color(UIColor { traitCollection in
        traitCollection.userInterfaceStyle == .dark
            ? UIColor(red: 0.118, green: 0.141, blue: 0.188, alpha: 1.0) // #1E2430
            : UIColor.systemBackground
    })

    // MARK: - Semantic Colors

    static let appSuccess = Color(red: 0.133, green: 0.773, blue: 0.369)
    static let appWarning = Color(red: 0.961, green: 0.620, blue: 0.043)
    static let appError = Color(red: 0.937, green: 0.267, blue: 0.267)
    static let appTextSecondary = Color(UIColor { traitCollection in
        traitCollection.userInterfaceStyle == .dark
            ? UIColor(red: 0.553, green: 0.576, blue: 0.620, alpha: 1.0) // #8D93A0
            : UIColor(red: 0.420, green: 0.451, blue: 0.506, alpha: 1.0)  // #6B7381
    })
}

// MARK: - App Fonts

extension Font {
    static let appTitle = Font.system(size: 28, weight: .bold, design: .rounded)
    static let appHeadline = Font.system(size: 20, weight: .semibold, design: .rounded)
    static let appBody = Font.system(size: 16, weight: .regular, design: .default)
    static let appCaption = Font.system(size: 13, weight: .regular, design: .default)
    static let appPrice = Font.system(size: 18, weight: .bold, design: .rounded)
}

// MARK: - View Modifiers

struct AppCardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(Color.appSurface)
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.06), radius: 10, x: 0, y: 4)
    }
}

struct PrimaryButtonModifier: ViewModifier {
    let isEnabled: Bool

    func body(content: Content) -> some View {
        content
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(isEnabled ? Color.appPrimary : Color.gray.opacity(0.3))
            .foregroundColor(.white)
            .cornerRadius(12)
            .animation(.easeInOut(duration: 0.2), value: isEnabled)
    }
}

extension View {
    func appCard() -> some View {
        modifier(AppCardModifier())
    }

    func primaryButton(enabled: Bool = true) -> some View {
        modifier(PrimaryButtonModifier(isEnabled: enabled))
    }
}
