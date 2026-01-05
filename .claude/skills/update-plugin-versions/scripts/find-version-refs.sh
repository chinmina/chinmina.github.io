#!/usr/bin/env bash
#
# Find references to plugin that aren't the simple plugin#version format
# Usage: find-version-refs.sh <plugin-name> <target-version>
# Example: find-version-refs.sh chinmina-token v1.3.1
#
# Output: file:line with 3 lines of context before/after

set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <plugin-name> <target-version>" >&2
  echo "Example: $0 chinmina-token v1.3.1" >&2
  exit 1
fi

plugin_name="$1"
target_version="$2"

docs_dir="src/content/docs"
if [[ ! -d "$docs_dir" ]]; then
  echo "Error: Documentation directory not found: $docs_dir" >&2
  exit 1
fi

# Step 1: Find all lines with plugin name
# Step 2: Exclude simple format with target version
matches=$(grep -rn "${plugin_name}" "$docs_dir" | grep -v "chinmina/${plugin_name}#${target_version}")

if [[ -z "$matches" ]]; then
  echo "No additional references found for ${plugin_name}"
  exit 0
fi

echo "=== References to ${plugin_name} (excluding chinmina/${plugin_name}#${target_version}) ==="
echo

# Step 3: For each match, show the line with context
echo "$matches" | while IFS=: read -r file line rest; do
  echo "${file}:${line}"

  # Show 3 lines before and after, with line numbers
  start=$((line - 3))
  if [[ $start -lt 1 ]]; then start=1; fi

  sed -n "${start},$((line + 3))p" "$file" | nl -v "$start" -w 5 -s ": "
  echo
done
