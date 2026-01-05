---
name: update-plugin-versions
description: Fetch latest release versions of chinmina-token and chinmina-git-credentials Buildkite plugins and update all references in the documentation. Use when updating plugin versions or checking for new releases.
allowed-tools: Bash, Read, Edit
---

# Update Plugin Versions

Updates all references to chinmina Buildkite plugins in the documentation to their latest released versions.

## Plugins Updated

1. **chinmina-token**: `chinmina/chinmina-token-buildkite-plugin`
2. **chinmina-git-credentials**: `chinmina/chinmina-git-credentials-buildkite-plugin`

## Workflow

The skill uses three scripts that work together:

### 1. Get Latest Versions

First, fetch the latest versions from GitHub:

```bash
.claude/skills/update-plugin-versions/scripts/get-latest-versions.sh
```

**Output:** JSON with plugin names and versions
```json
{
  "chinmina-token": "v1.3.1",
  "chinmina-git-credentials": "v1.4.1"
}
```

### 2. Update Simple References (Deterministic)

For each plugin, update the standard `chinmina/plugin-name#vX.Y.Z` format:

```bash
.claude/skills/update-plugin-versions/scripts/update-simple-refs.sh chinmina-token v1.3.1
.claude/skills/update-plugin-versions/scripts/update-simple-refs.sh chinmina-git-credentials v1.4.1
```

**Output:** List of files updated with counts

This handles the common case (pipeline plugin references) automatically.

### 3. Find Remaining References (Context for LLM)

Check for any remaining version references that need manual review:

```bash
.claude/skills/update-plugin-versions/scripts/find-version-refs.sh chinmina-token v1.3.1
.claude/skills/update-plugin-versions/scripts/find-version-refs.sh chinmina-git-credentials v1.4.1
```

**Output:** `file:line:context` showing outdated references with surrounding code

This shows bootstrap hooks, variable assignments, or other non-standard formats that need contextual understanding.

### 4. Manual Updates (LLM)

For any references found in step 3:
- Read the file to understand the format
- Use Edit tool to update the version in context
- The LLM adapts to whatever format is used (bash variables, etc.)

## Design Philosophy

**Scripts encode deterministic actions:**
- Fetching versions from GitHub
- Replacing standard plugin#version format
- Finding references with context

**LLM handles contextual understanding:**
- Understanding non-standard formats (bootstrap hooks, etc.)
- Making targeted edits in appropriate context
- Adapting to new patterns without script changes

This keeps scripts simple and maintainable while leveraging LLM flexibility for edge cases.

## Requirements

- GitHub CLI (`gh`) must be installed and authenticated
- Must be run from the repository root
