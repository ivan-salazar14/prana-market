# Deferred Work

## Deferred from: code review of spec-epic-10-order-correctness-and-verification.md (2026-10-19)

- **Retrocompatibilidad de flag `--experimental-strip-types` en Node < 22** (`frontend/package.json:414`): El script `"test:order"` usa Node 22.6+ type stripping. Si se corre en CI con Node 18 o 20, requiere `tsx` o runner alternativo. Se difiere dado que el entorno local de desarrollo corre en Node 22+.
