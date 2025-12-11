# repokit

A CLI tool to automate GitHub repository setup. Creates a directory, initializes git, creates a README, makes the first commit, creates a repo on GitHub, and pushes - all in one command.

## Prerequisites

- Node.js 18+
- [GitHub CLI](https://cli.github.com/) (`brew install gh`)
- Authenticated with GitHub CLI (`gh auth login`)

## Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/repokit.git
cd repokit

# Install dependencies
npm install

# Link globally
npm link
```

## Usage

### Initialize a new project

```bash
# Create a new private repo under your personal account
repokit init my-project

# Create a new public repo
repokit init my-project --public

# Create under an organization
repokit init my-project --org bluestemlabs

# Use current directory instead of creating new one
repokit init my-project --here
```

### Configure defaults

```bash
# View current configuration
repokit config

# Set default organization
repokit config --org bluestemlabs

# Reset to personal account
repokit config --org personal

# Set default visibility
repokit config --visibility private
repokit config --visibility public
```

## Command Reference

### `repokit init <project-name>`

Initialize a new project with a GitHub repository.

| Flag | Description |
|------|-------------|
| `--public` | Create a public repository |
| `--private` | Create a private repository (default) |
| `-h, --here` | Use current directory instead of creating new |
| `--org <name>` | GitHub organization to create repo under |

### `repokit config`

View or modify default configuration.

| Flag | Description |
|------|-------------|
| `--show` | Show current configuration |
| `--org <name>` | Set default org (use "personal" to clear) |
| `--visibility <type>` | Set default visibility (public/private) |

## Configuration File

Defaults are stored in `~/.repokitrc` as JSON:

```json
{
  "defaultOrg": "bluestemlabs",
  "defaultVisibility": "private"
}
```

## What `repokit init` does

1. Creates a new directory with the project name (unless `--here`)
2. Creates a README.md with the project name as header
3. Initializes a git repository
4. Makes the initial commit
5. Creates a repository on GitHub (via `gh` CLI)
6. Sets up the remote origin
7. Pushes to main

## License

MIT
