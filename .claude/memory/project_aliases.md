---
name: Path aliases
description: @app/@pages/@widgets/@features/@entities/@shared — где объявлены
type: project
---

Объявлены в двух местах синхронно (править оба):
- `template/tsconfig.json` — `compilerOptions.paths`
- `template/babel.config.js` — `module-resolver`

```
@app       → src/app
@pages     → src/pages
@widgets   → src/widgets
@features  → src/features
@entities  → src/entities
@shared    → src/shared
```

`@shared/*`: `lib/di`, `lib/holders`, `lib/navigation`, `lib/theme`, `lib/socket`, `lib/slots`,
`api` (HttpClient, gen/), `config` (env.ts).
