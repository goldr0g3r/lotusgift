# Prerequisites

**Audience**: new contributors
**Phase**: P0 onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

Install these before cloning the repo.

## Required

| Tool | Version | Install |
| ---- | ------- | ------- |
| **Node.js** | ≥ 20.x LTS | `nvm install 20` or [nodejs.org](https://nodejs.org/) |
| **pnpm** | 9.x (matches `packageManager` in `package.json`) | `corepack enable && corepack prepare pnpm@9.0.0 --activate` |
| **Git** | ≥ 2.40 | [git-scm.com](https://git-scm.com/) |
| **GitHub CLI** | ≥ 2.50 | `winget install GitHub.cli` or [cli.github.com](https://cli.github.com/) |

## Recommended

| Tool | Purpose | Install |
| ---- | ------- | ------- |
| **Cursor** | Primary IDE (loads `.cursor/rules/` + skills + subagents) | [cursor.com](https://www.cursor.com/) |
| **VS Code** | Alternative IDE (loads `.github/instructions/`) | [code.visualstudio.com](https://code.visualstudio.com/) |
| **Docker Desktop** | Optional: run Mongo + Redis in containers | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **MongoDB Community** | Alternative: host-install MongoDB 8 | [mongodb.com/try/download](https://www.mongodb.com/try/download/community) |
| **Redis** (via Memurai on Windows) | Alternative: host-install Redis | [memurai.com](https://www.memurai.com/) |
| **nvm-windows** | Node version manager for Windows | [github.com/coreybutler/nvm-windows](https://github.com/coreybutler/nvm-windows) |

## Windows-specific notes

### Long paths

The deepest `node_modules/.pnpm/...` path can exceed 260 chars. Enable long paths:

```powershell
# Git
git config --system core.longpaths true

# Windows Registry (run as Admin)
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1
```

### Execution policy

Scripts require `RemoteSigned`:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Line endings

The repo uses LF. Configure git:

```powershell
git config --global core.autocrlf input
```

## Verify installation

```powershell
node --version    # v20.x.x+
pnpm --version   # 9.x.x
git --version     # 2.40+
gh --version      # 2.50+
gh auth status    # logged in
```

## Next step

→ [`local-dev-setup.md`](./local-dev-setup.md)
