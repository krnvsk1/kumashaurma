import SwiftUI
import Combine

// MARK: - Theme Manager

@MainActor
final class ThemeManager: ObservableObject {
    static let shared = ThemeManager()

    @Published var themeMode: ThemeMode {
        didSet {
            UserDefaults.standard.set(themeMode.rawValue, forKey: "app_theme_mode")
            applyTheme()
        }
    }

    @Published private(set) var colorScheme: ColorScheme?

    private init() {
        let saved = ThemeMode(rawValue: UserDefaults.standard.integer(forKey: "app_theme_mode")) ?? .system
        _themeMode = Published(initialValue: saved)
        applyTheme()
    }

    private func applyTheme() {
        switch themeMode {
        case .system:
            colorScheme = nil
        case .light:
            colorScheme = .light
        case .dark:
            colorScheme = .dark
        }
    }
}

// MARK: - Theme Mode

enum ThemeMode: Int, CaseIterable, Identifiable {
    case system = 0
    case light = 1
    case dark = 2

    var id: Int { rawValue }

    var displayName: String {
        switch self {
        case .system: return "Системная"
        case .light: return "Светлая"
        case .dark: return "Тёмная"
        }
    }

    var icon: String {
        switch self {
        case .system: return "circle.lefthalf.filled"
        case .light: return "sun.max.fill"
        case .dark: return "moon.fill"
        }
    }
}
