# Troubleshooting

**Audience**: contributors hitting setup issues
**Phase**: P0 onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

## pnpm issues

### `ERR_PNPM_UNSUPPORTED_ENGINE` — wrong Node version

```
Your Node version is incompatible
```

**Fix**: `nvm use 20` or install Node 20 LTS.

### `Mismatched name in 'packageManager' field`

**Fix**: `corepack prepare pnpm@9.0.0 --activate`

### `EPERM: operation not permitted` on Windows

Node modules locked by another process.

**Fix**: Close VS Code / Cursor, kill any `node.exe` processes, retry.

### Lockfile mismatch after pull

```
ERR_PNPM_OUTDATED_LOCKFILE
```

**Fix**: `pnpm install --no-frozen-lockfile` (dev only — CI uses `--frozen-lockfile`).

## Docker issues

### Port 27017 already in use

Another MongoDB instance or Docker container is using the port.

**Fix**:
```powershell
# Find what's using it
netstat -ano | findstr :27017
# Kill the process or stop the container
docker ps | findstr mongo
docker stop <container-id>
```

### Docker Desktop not starting on Windows

**Fix**: Ensure WSL 2 is enabled and the "Use WSL 2 based engine" toggle is ON in Docker Desktop settings.

## MongoDB issues

### `MongoServerSelectionError: connect ECONNREFUSED`

MongoDB isn't running.

**Fix** (host-install): Start the MongoDB service:
```powershell
net start MongoDB
```

**Fix** (Docker):
```powershell
docker compose -f infrastructure/docker/docker-compose.yml up -d mongodb
```

## Redis issues

### `ECONNREFUSED 127.0.0.1:6379`

Redis isn't running.

**Fix** (Windows — Memurai):
```powershell
net start Memurai
```

**Fix** (Docker):
```powershell
docker compose -f infrastructure/docker/docker-compose.yml up -d redis
```

## Git issues

### `filename too long` on Windows

**Fix**:
```powershell
git config --system core.longpaths true
```

### Line ending warnings

**Fix**:
```powershell
git config --global core.autocrlf input
```

## Build issues

### TypeScript errors after pulling new changes

**Fix**: Clean build cache and rebuild:
```powershell
pnpm clean
pnpm install
pnpm build
```

### Turbo cache stale

**Fix**:
```powershell
Remove-Item -Recurse -Force node_modules/.cache/turbo
pnpm build
```

## Still stuck?

1. Check if the issue is in [GitHub Issues](https://github.com/goldr0g3r/lotusgift/issues)
2. Open a `type/chore` issue with reproduction steps
