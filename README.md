# Majik Message

**Majik Message** is a browser extension for **encrypting and decrypting text directly in your browser**. It is **not a chat platform** — it does not host conversations or store messages on a server. Instead, it allows you to securely encrypt text, share it with contacts, and decrypt it on any webpage, giving you full control over your data.



---

- [Majik Message](#majik-message)
  - [Features](#features)
  - [Usage](#usage)
    - [Encrypt Text](#encrypt-text)
    - [Decrypt Text](#decrypt-text)
    - [Account Management](#account-management)
  - [Architecture](#architecture)
    - [Browser Extension](#browser-extension)
    - [Encryption](#encryption)
    - [Contacts \& Accounts](#contacts--accounts)
    - [Scanner](#scanner)
  - [Contributing](#contributing)
  - [License](#license)
  - [Author](#author)
  - [About the Developer](#about-the-developer)
  - [Contact](#contact)


---

## Features

- **Text Encryption Anywhere**  
  - Highlight any text on a webpage (e.g., Gmail, Facebook), right-click, and select **Encrypt** to generate a secure string. Only authorized contacts can decrypt it.  

- **Local Account with Seed Phrase**  
  - Accounts are derived from a **seed phrase** — no registration required.  
  - Add multiple contacts who can decrypt your messages.  
  - Share your account via **invite key** for collaborative access.  
  - Save, export, and import your account as a **JSON file** or **backup key**.  

- **Page-Wide Decryption**  
  - Decrypt all valid encrypted strings on a page in a single action.  

- **Automatic Scanner**  
  - Enable the scanner in settings to automatically detect and decrypt valid encrypted text on any webpage in real-time.  

- **Privacy-First Design**  
  - All encryption and decryption occur locally. Messages are never stored on a server unless explicitly saved by the user.  

---

## Usage

### Encrypt Text

- Highlight text → right-click → Encrypt.
- Replace the text with an encrypted string or copy it.

### Decrypt Text

- Highlight encrypted string → right-click → Decrypt
- Decrypt the entire page → right-click → Decrypt Page
- Or enable the scanner to auto-detect and decrypt strings on a page

### Account Management

- Create an account from a seed phrase.
- Add contacts or share your account via an invite key.
- Export/import your account via JSON or backup key.

---

## Architecture

### Browser Extension
Injects a content script for detecting and modifying page text.

### Encryption
Uses standard cryptographic algorithms (AES, RSA or other implemented schemes) for end-to-end encryption.

### Contacts & Accounts
Local storage using browser storage APIs (optional JSON backup).

### Scanner
Observes DOM mutations to detect and auto-decrypt valid encrypted strings.

---

## Contributing

If you want to contribute or help extend support to more platforms, reach out via email. All contributions are welcome!  

---

## License

[Apache-2.0](LICENSE) — free for personal and commercial use.

---
## Author

Made with 💙 by [@thezelijah](https://github.com/jedlsf)

## About the Developer

- **Developer**: Josef Elijah Fabian
- **GitHub**: [https://github.com/jedlsf](https://github.com/jedlsf)
- **Project Repository**: [https://github.com/jedlsf/majik-message](https://github.com/jedlsf/majik-message)

---

## Contact

- **Business Email**: [business@thezelijah.world](mailto:business@thezelijah.world)
- **Official Website**: [https://www.thezelijah.world](https://www.thezelijah.world)
