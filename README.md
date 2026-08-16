# Chinmina Bridge documentation

This repository is the source for the [Chinmina Bridge](https://github.com/chinmina/chinmina-bridge) documentation. Documentation is published on [chinmina.github.io](https://chinmina.github.io).

This documentation uses the [Starlight](https://starlight.astro.build/) project (based on [Astro](https://astro.build/)).

Inline diagrams can be included using [the D2 diagramming language](https://d2lang.com). There is a VS Code extension as well as an online playground to help author the diagrams.

Contributions are welcome! Fork the repo and create a PR for review.

## Local development

### Tooling

1. [Mise](https://mise.jdx.dev/getting-started.html), which manages Node and D2: install the `mise` CLI, then activate it in your shell (`eval "$(mise activate bash)"`, or the equivalent for your shell) so its installed tools are put on your `PATH`.
2. Run `mise install` to install Node and D2.
3. PNPM: `corepack enable && corepack install`

### Run the dev server

`pnpm run dev`
