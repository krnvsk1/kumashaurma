import SwiftUI

// MARK: - Auth View

/// Multi-step authentication flow:
/// Step 1 → Enter phone number
/// Step 2 → Enter 4-digit SMS code
/// Step 3 → Registration (first name, last name) for new users
struct AuthView: View {
    @StateObject private var authService = AuthService.shared

    // MARK: - State

    @State private var phone: String = "+7"
    @State private var code: String = ""
    @State private var firstName: String = ""
    @State private var lastName: String = ""
    @State private var step: AuthStep = .phone
    @State private var errorMessage: String = ""
    @State private var isLoading: Bool = false

    @FocusState private var phoneFocused: Bool
    @FocusState private var codeFocused: Bool
    @FocusState private var nameFocused: Bool

    // MARK: - Auth Step

    enum AuthStep: Int, CaseIterable {
        case phone = 0
        case code = 1
        case register = 2
    }

    // MARK: - Body

    var body: some View {
        VStack(spacing: 0) {
            // Header
            headerSection

            Spacer()

            // Step indicator
            stepIndicator

            Spacer()

            // Form content
            formContent
                .padding(.horizontal, 28)
                .transition(.asymmetric(
                    insertion: .move(edge: .trailing).combined(with: .opacity),
                    removal: .move(edge: .leading).combined(with: .opacity)
                ))
                .id(step)

            Spacer()
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.appBackground)
        .ignoresSafeArea(.keyboard)
    }

    // MARK: - Header Section

    private var headerSection: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color.appPrimary.opacity(0.12))
                    .frame(width: 96, height: 96)

                Image(systemName: "takeoutbag.and.cup.and.straw")
                    .font(.system(size: 40))
                    .foregroundStyle(
                        .linearGradient(
                            colors: [Color.appPrimary, Color(red: 0.2, green: 0.7, blue: 0.6)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            }

            Text("Кумашурма")
                .font(.appTitle)

            Text(headerSubtitle)
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding(.top, 60)
    }

    private var headerSubtitle: String {
        switch step {
        case .phone: return "Войдите по номеру телефона"
        case .code: return "Введите код из SMS"
        case .register: return "Завершите регистрацию"
        }
    }

    // MARK: - Step Indicator

    private var stepIndicator: some View {
        HStack(spacing: 8) {
            ForEach(AuthStep.allCases, id: \.rawValue) { s in
                Capsule()
                    .fill(s.rawValue <= step.rawValue ? Color.appPrimary : Color.gray.opacity(0.2))
                    .frame(width: s == step ? 32 : 8, height: 8)
                    .animation(.spring(response: 0.3), value: step)
            }
        }
        .padding(.vertical, 16)
    }

    // MARK: - Form Content

    @ViewBuilder
    private var formContent: some View {
        switch step {
        case .phone:
            phoneStepView
        case .code:
            codeStepView
        case .register:
            registrationStepView
        }
    }

    // MARK: - Phone Step

    private var phoneStepView: some View {
        VStack(spacing: 20) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Номер телефона")
                    .font(.appHeadline)

                Text("Мы отправим код подтверждения по SMS")
                    .font(.appCaption)
                    .foregroundColor(.secondary)
            }

            TextField("+7 (___) ___-__-__", text: $phone)
                .font(.body)
                .keyboardType(.phonePad)
                .focused($phoneFocused)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .onChange(of: phone) { newValue in
                    let digits = newValue.filter(\.isNumber)
                    // Keep only +7 prefix + 10 digits max
                    var raw = "+7"
                    let relevant = digits.hasPrefix("7") ? String(digits.dropFirst()) : digits
                    let capped = String(relevant.prefix(10))
                    raw += formatDigits(capped)
                    if raw != newValue {
                        phone = raw
                    }
                }
                .padding(16)
                .background(Color(.systemBackground))
                .cornerRadius(14)
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(Color.appPrimary.opacity(0.3), lineWidth: 1.5)
                )

            if !errorMessage.isEmpty {
                ErrorBanner(message: errorMessage)
            }

            Button {
                sendCode()
            } label: {
                Group {
                    if isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("Получить код")
                            .fontWeight(.semibold)
                    }
                }
            }
            .primaryButton(enabled: phoneDigitsCount >= 10 && !isLoading)
            .disabled(phoneDigitsCount < 10 || isLoading)
        }
    }

    private var phoneDigitsCount: Int {
        let digits = phone.filter(\.isNumber)
        return digits.hasPrefix("7") ? digits.count - 1 : digits.count
    }

    /// Format 10 digits into " (999) 123-45-67"
    private func formatDigits(_ digits: String) -> String {
        let chars = Array(digits)
        var result = ""
        for (i, char) in chars.enumerated() {
            if i == 0 { result += " (\(char)" }
            else if i == 2 { result += "\(char)) " }
            else if i == 5 { result += "\(char)-" }
            else if i == 7 { result += "\(char)-" }
            else { result += "\(char)" }
        }
        return result
    }

    // MARK: - Code Step

    private var codeStepView: some View {
        VStack(spacing: 20) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Введите код")
                    .font(.appHeadline)

                Text("SMS отправлен на \(formatPhone(phone))")
                    .font(.appCaption)
                    .foregroundColor(.secondary)
            }

            // 4-digit code input
            OTPInputView(code: $code, maxLength: 4)
                .focused($codeFocused)
                .onChange(of: code) { newValue in
                    if newValue.count == 4 && !isLoading {
                        verifyCode()
                    }
                }

            if !errorMessage.isEmpty {
                ErrorBanner(message: errorMessage)
            }

            HStack {
                Button("Изменить номер") {
                    withAnimation(.spring(response: 0.3)) {
                        step = .phone
                        code = ""
                        errorMessage = ""
                    }
                }
                .foregroundColor(.appPrimary)

                Spacer()

                Button("Отправить повторно") {
                    resendCode()
                }
                .font(.caption)
                .foregroundColor(.secondary)
            }

            // Confirm button
            Button {
                verifyCode()
            } label: {
                Group {
                    if isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("Подтвердить")
                            .fontWeight(.semibold)
                    }
                }
            }
            .primaryButton(enabled: code.count == 4 && !isLoading)
            .disabled(code.count != 4 || isLoading)
        }
    }

    // MARK: - Registration Step

    private var registrationStepView: some View {
        VStack(spacing: 20) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Регистрация")
                    .font(.appHeadline)

                Text("Заполните данные для создания аккаунта")
                    .font(.appCaption)
                    .foregroundColor(.secondary)
            }

            VStack(spacing: 14) {
                TextField("Имя", text: $firstName)
                    .focused($nameFocused)
                    .padding(16)
                    .background(Color(.systemBackground))
                    .cornerRadius(14)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Color.appPrimary.opacity(0.3), lineWidth: 1.5)
                    )

                TextField("Фамилия", text: $lastName)
                    .padding(16)
                    .background(Color(.systemBackground))
                    .cornerRadius(14)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Color.appPrimary.opacity(0.3), lineWidth: 1.5)
                    )
            }

            if !errorMessage.isEmpty {
                ErrorBanner(message: errorMessage)
            }

            Button {
                registerUser()
            } label: {
                Group {
                    if isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("Завершить регистрацию")
                            .fontWeight(.semibold)
                    }
                }
            }
            .primaryButton(enabled: !firstName.trimmingCharacters(in: .whitespaces).isEmpty
                           && !lastName.trimmingCharacters(in: .whitespaces).isEmpty
                           && !isLoading)
        }
    }

    // MARK: - Actions

    /// Backend requires format: +7 (999) 123-45-67
    private var formattedPhone: String {
        formatPhone(phone)
    }

    private func sendCode() {
        Task {
            isLoading = true
            errorMessage = ""
            defer { isLoading = false }

            do {
                _ = try await authService.sendCode(phone: formattedPhone)
                withAnimation(.spring(response: 0.3)) {
                    step = .code
                }
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func verifyCode() {
        Task {
            isLoading = true
            errorMessage = ""
            defer { isLoading = false }

            do {
                let isNewUser = try await authService.verifyCode(phone: formattedPhone, code: code)
                if isNewUser {
                    withAnimation(.spring(response: 0.3)) {
                        step = .register
                    }
                }
                // If not new user, authService handles login automatically
            } catch {
                errorMessage = "Неверный код. Попробуйте ещё раз."
                code = ""
            }
        }
    }

    private func resendCode() {
        Task {
            isLoading = true
            errorMessage = ""
            defer { isLoading = false }

            do {
                _ = try await authService.sendCode(phone: formattedPhone)
                code = ""
            } catch {
                errorMessage = "Не удалось отправить код"
            }
        }
    }

    private func registerUser() {
        Task {
            isLoading = true
            errorMessage = ""
            defer { isLoading = false }

            do {
                try await authService.register(
                    phone: formattedPhone,
                    firstName: firstName.trimmingCharacters(in: .whitespaces),
                    lastName: lastName.trimmingCharacters(in: .whitespaces)
                )
                // authService handles login after registration
            } catch {
                errorMessage = "Ошибка регистрации. Попробуйте ещё раз."
            }
        }
    }

    // MARK: - Helpers

    private func formatPhone(_ raw: String) -> String {
        let digits = raw.filter(\.isNumber)
        guard digits.count >= 1 else { return raw }

        var result = "+7"
        let relevant = digits.hasPrefix("7") ? String(digits.dropFirst()) : digits

        let chars = Array(relevant)
        for (i, char) in chars.enumerated() {
            if i == 0 { result += " (\(char)" }
            else if i == 2 { result += "\(char)) " }
            else if i == 5 { result += "\(char)-" }
            else if i == 7 { result += "\(char)-" }
            else { result += "\(char)" }
        }
        return result
    }
}

// MARK: - OTP Input View

struct OTPInputView: UIViewRepresentable {
    @Binding var code: String
    let maxLength: Int

    func makeUIView(context: Context) -> UIStackView {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 12
        stack.distribution = .fillEqually
        stack.alignment = .fill
        NSLayoutConstraint.activate([
            stack.heightAnchor.constraint(equalToConstant: 56)
        ])

        for i in 0..<maxLength {
            let field = UITextField()
            field.textAlignment = .center
            field.font = .systemFont(ofSize: 24, weight: .bold)
            field.keyboardType = .numberPad
            field.backgroundColor = UIColor.systemGray6
            field.layer.cornerRadius = 12
            field.layer.borderWidth = 1.5
            field.layer.borderColor = UIColor.appPrimary.withAlphaComponent(0.3).cgColor
            field.tag = i
            field.delegate = context.coordinator

            stack.addArrangedSubview(field)
        }

        DispatchQueue.main.async {
            if let firstField = stack.arrangedSubviews.first as? UITextField {
                firstField.becomeFirstResponder()
            }
        }

        return stack
    }

    func updateUIView(_ uiView: UIStackView, context: Context) {
        for (i, subview) in uiView.arrangedSubviews.enumerated() {
            guard let field = subview as? UITextField else { continue }
            if i < code.count {
                field.text = String(code[code.index(code.startIndex, offsetBy: i)])
                field.layer.borderColor = UIColor.appPrimary.cgColor
            } else {
                field.text = ""
                field.layer.borderColor = UIColor.appPrimary.withAlphaComponent(0.3).cgColor
            }
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    final class Coordinator: NSObject, UITextFieldDelegate {
        var parent: OTPInputView

        init(_ parent: OTPInputView) {
            self.parent = parent
        }

        func textField(_ textField: UITextField, shouldChangeCharactersIn range: NSRange, replacementString string: String) -> Bool {
            guard let digit = string.filter(\.isNumber).last else {
                // Handle backspace
                if string.isEmpty, textField.tag > 0 {
                    parent.code.removeLast()
                    if let stack = textField.superview as? UIStackView,
                       let prev = stack.arrangedSubviews[safe: textField.tag - 1] as? UITextField {
                        prev.becomeFirstResponder()
                    }
                }
                return false
            }

            if parent.code.count < parent.maxLength {
                parent.code.append(digit)
                if parent.code.count == parent.maxLength {
                    textField.resignFirstResponder()
                } else {
                    if let stack = textField.superview as? UIStackView,
                       let next = stack.arrangedSubviews[safe: textField.tag + 1] as? UITextField {
                        next.becomeFirstResponder()
                    }
                }
            }
            return false
        }
    }
}

// MARK: - Error Banner

struct ErrorBanner: View {
    let message: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.caption)
            Text(message)
                .font(.caption)
        }
        .foregroundColor(.appError)
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.appError.opacity(0.1))
        .cornerRadius(10)
    }
}

// MARK: - Array Safe Subscript

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}

// MARK: - UIColor Extension

private extension UIColor {
    static let appPrimary = UIColor(red: 0.031, green: 0.569, blue: 0.698, alpha: 1.0)
}
