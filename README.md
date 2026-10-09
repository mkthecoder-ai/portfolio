# portfolio

Source for [mkthecoder.com](https://mkthecoder.com), the portfolio of Manoj Kumar, a DevOps and platform
engineer working on Azure.

- **Site** (`site/`): Next.js static export with a painted, parallax hero and a living background
  canvas. No runtime server: the output in `site/out` is served by Azure Static Web Apps.
- **Infrastructure** (`infra/`): Terraform for the Static Web App, DNS and budgets. See `infra/README.md`.
- **Pipelines** (`.github/workflows/`): `ci.yml` (lint, types, unit and browser tests, Terraform tests) and
  `deploy.yml`.

## Develop

Node 24 (`.nvmrc`).

```sh
npm ci
npm run dev            # local dev server
npm run verify         # everything CI runs: lint, types, unit, contrast, build, content, JS budget, links, e2e
npm run review         # screenshots at 360-2560px and reduced motion, into review/ (gitignored)
```

## Repository policy

`main` only changes through pull requests. Anyone can open one; it needs:

- the `site` and both `terraform` CI checks passing on an up-to-date branch,
- an approving review from the code owner (`.github/CODEOWNERS`),
- resolved review conversations, and it lands as a single squash commit.

Force pushes and deleting `main` are blocked for everyone. The rulesets live in `.github/rulesets/`;
`npm run repo-policy` applies them together with the repository's security settings.

## License

All rights reserved. The code is published to read; the artwork, photos, logos and text are not licensed for reuse.
