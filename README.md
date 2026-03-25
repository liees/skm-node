# skm-node v2.0

[![npm version](https://badge.fury.io/js/skm-node.svg)](https://www.npmjs.com/package/skm-node)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Modern SSH Key Manager** — Secure, fast, and developer-friendly

A complete rewrite with TypeScript, Ed25519 support, interactive CLI, and modern best practices.

## ✨ Features

- 🔐 **Ed25519 by default** — More secure, faster, shorter keys (RSA/ECDSA also supported)
- 🎯 **Interactive CLI** — Beautiful prompts with inquirer
- 🔄 **Auto SSH sync** — Seamless switching between keys
- 📋 **Rich key info** — Fingerprints, creation dates, algorithm details
- 🗑️ **Safe deletion** — Confirmation prompts before removing keys
- 📤 **Export ready** — Easy public key export for GitHub/GitLab
- 🛡️ **Passphrase support** — Optional key encryption
- 📝 **TypeScript** — Full type safety and better DX

## 🚀 Installation

```bash
npm install -g skm-node
```

**Requirements:** Node.js >= 18.0.0

## 📖 Quick Start

### Initialize

```bash
skm init
```

### Create a Key (Recommended: Ed25519)

```bash
# Interactive mode (prompts for email)
skm create github

# With email
skm create github -e your@email.com

# With passphrase
skm create github -e your@email.com -p

# RSA key (if needed for legacy systems)
skm create legacy -e your@email.com -t rsa -b 4096
```

### List Keys

```bash
skm ls
```

Output:
```
Managed SSH keys:

→ github (active)
    Email: your@email.com
    Type: ed25519
    Fingerprint: SHA256:xxxxxxxxxxxxx
    Created: Mon Jan 15 2024
    Passphrase: No

  work
    Email: work@company.com
    Type: rsa (4096 bits)
    Fingerprint: SHA256:yyyyyyyyyyyyy
    Created: Tue Jan 16 2024
    Passphrase: Yes
```

### Switch Keys

```bash
skm use work
```

### View Fingerprint

```bash
skm fingerprint github
```

### Export Public Key

```bash
skm export github
# Copy output and paste to GitHub/GitLab SSH keys settings
```

### Delete Key

```bash
skm delete github
# Confirms before deletion
```

## 🔧 Commands

| Command | Description |
|---------|-------------|
| `skm init` | Initialize configuration |
| `skm create <name>` | Create new SSH key |
| `skm ls` / `skm list` | List all managed keys |
| `skm use <name>` | Activate a key |
| `skm delete <name>` / `skm rm <name>` | Delete a key |
| `skm fingerprint <name>` | Show key fingerprint |
| `skm export <name>` | Export public key |
| `skm --help` | Show help |

## 🎯 Create Command Options

```bash
skm create <name> [options]

Options:
  -e, --email <email>     Email for the key
  -t, --type <type>       Key type: ed25519 (default), rsa, ecdsa
  -b, --bits <bits>       Key bits for RSA (default: 4096)
  -p, --passphrase        Prompt for passphrase
```

## 🔒 Security Best Practices

### Why Ed25519?

| Algorithm | Security | Speed | Key Size | Recommendation |
|-----------|----------|-------|----------|----------------|
| Ed25519 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 68 chars | **Recommended** |
| ECDSA | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ~150 chars | Good alternative |
| RSA | ⭐⭐⭐ | ⭐⭐ | 3000+ chars | Legacy only |

### Passphrase Recommendation

For keys used on personal devices without automation:
```bash
skm create personal -e me@email.com -p
```

For CI/CD or automated deployments, use no passphrase and restrict key permissions instead.

## 📁 File Structure

```
~/.skm/
├── config.json          # SKM configuration
├── github/
│   ├── id_ed25519      # Private key
│   └── id_ed25519.pub  # Public key
└── work/
    ├── id_rsa
    └── id_rsa.pub

~/.ssh/
├── id_ed25519          # Currently active private key (symlink/copy)
└── id_ed25519.pub      # Currently active public key
```

## 🛠️ Development

```bash
# Clone
git clone https://github.com/liees/skm-node.git
cd skm-node

# Install
npm install

# Build
npm run build

# Test
npm test

# Lint
npm run lint
npm run format
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage
```

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -am 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Create a Pull Request

## 🙏 Acknowledgments

- Original concept by [liees](https://github.com/liees)
- Rewritten with modern best practices and TypeScript

---

**Made with ❤️ for developers who manage multiple SSH keys**
