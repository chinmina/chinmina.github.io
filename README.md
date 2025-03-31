# Chinmina Bridge documentation

This repository is the source for the [Chinmina Bridge](https://github.com/chinmina/chinmina-bridge) documentation. Documentation is published on [chinmina.github.io](https://chinmina.github.io).

This documentation uses the [Starlight](https://starlight.astro.build/) project (based on [Astro](https://astro.build/)).

Inline diagrams can be included using [the D2 diagramming language](https://d2lang.com). There is a VS Code extension as well as an online playground to help author the diagrams.

Contributions are welcome! Fork the repo and create a PR for review.

## Local development

### Tooling

1. Node: `mise install`
2. PNPM: `corepack enable && corepack install`
3. [D2](https://d2lang.com/tour/install): `curl -fsSL https://d2lang.com/install.sh | sh -s --` (Check out [the install instructions](https://d2lang.com/tour/install) for more options.)

### Run the dev server

`pnpm run dev`
