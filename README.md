# SSH Key Manager for Node.js (skm-node)

[![npm version](https://img.shields.io/npm/v/skm-node.svg)](https://badge.fury.io/js/skm-node)
[![downloads](https://img.shields.io/npm/dt/skm-node.svg)](https://www.npmjs.com/package/skm-node)
[![License](https://img.shields.io/badge/license-WTFPL-green.svg)](LICENSE)

A modern, easy-to-use SSH key manager for Node.js. Easily create, switch between, and manage multiple SSH keys for different services (GitHub, GitLab, servers, etc.).

## Features

- 🔑 Create and manage multiple SSH keys
- 🔄 Easy switching between different SSH keys
- 📋 List all managed keys with clear visual indicators
- 🚀 Modern ES Modules implementation
- 🎨 Beautiful colored terminal output
- ✅ Fully tested with Jest
- 🔒 Secure key generation with 4096-bit RSA keys

> 本次更新均来自AI

## Requirements

- Node.js >= 18.0.0

## Installation

```bash
npm install -g skm-node
```

## Usage

### Initialize skm-node

Before first use, initialize skm-node:

```bash
skm init
```

This will create necessary directories and configuration files. If you have existing SSH keys, skm-node will detect them.

### Create a New SSH Key

```bash
skm create <email> <name>

# Example:
skm create "john@example.com" github
```

This will:
- Create a new 4096-bit RSA key
- Store it with the given name
- Associate it with your email

### List Available Keys

```bash
skm ls
```

The current active key will be marked with a green arrow (→).

### Switch Between Keys

```bash
skm use <name>

# Example:
skm use github
```

This will activate the specified SSH key, making it the default key for SSH operations.

### Help

```bash
skm --help
```

Shows all available commands and their usage.

## Directory Structure

- `~/.skm/` - Base directory for skm-node
  - `config.json` - Configuration file
  - `<key-name>/` - Directory for each SSH key
    - `id_rsa` - Private key
    - `id_rsa.pub` - Public key

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/liees/skm-node.git
cd skm-node

# Install dependencies
npm install
```

### Testing

The project uses Jest for testing. All major functionality is covered by tests.

```bash
# Run all tests
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Project Structure

- `skm.js` - Main application file
- `__tests__/` - Test files
  - `init.test.js` - Initialization tests
  - `key-management.test.js` - Key management tests

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -am 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## License

This project is licensed under the WTFPL - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Original author: [liees](https://github.com/liees)
- Contributors: [List of contributors](https://github.com/liees/skm-node/graphs/contributors)

## Changelog

### 1.0.0
- Complete rewrite using modern JavaScript features
- Added ES Modules support
- Improved error handling and logging
- Added colored terminal output
- Added comprehensive test suite
- Upgraded to 4096-bit RSA keys for better security
- Added automatic directory creation
- Improved command-line interface
