#!/usr/bin/env bash
#
# Update simple plugin references: chinmina/plugin-name#vX.Y.Z
# Usage: update-simple-refs.sh <plugin-name> <target-version>
# Example: update-simple-refs.sh chinmina-token v1.3.1

set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <plugin-name> <target-version>" >&2
  echo "Example: $0 chinmina-token v1.3.1" >&2
  exit 1
fi

plugin_name="$1"
target_version="$2"

# Validate version format
if [[ ! "$target_version" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Invalid version format. Expected vX.Y.Z, got: $target_version" >&2
  exit 1
fi

docs_dir="src/content/docs"
if [[ ! -d "$docs_dir" ]]; then
  echo "Error: Documentation directory not found: $docs_dir" >&2
  exit 1
fi

# Find current versions for this plugin
pattern="chinmina/${plugin_name}#v"
current_versions=$(grep -rh "${pattern}" "$docs_dir" | grep -o "v[0-9]\+\.[0-9]\+\.[0-9]\+" | sort -u)

if [[ -z "$current_versions" ]]; then
  echo "No references found for ${plugin_name}"
  exit 0
fi

# Track updates
total_updates=0
updated_files=()

# Update each outdated version
for old_version in $current_versions; do
  if [[ "$old_version" == "$target_version" ]]; then
    continue
  fi

  # Find and update files
  while IFS= read -r file || [[ -n "$file" ]]; do
    if [[ -n "$file" ]]; then
      sed -i.bak "s|chinmina/${plugin_name}#${old_version}|chinmina/${plugin_name}#${target_version}|g" "$file"
      rm "${file}.bak"
      updated_files+=("$file")
      (( ++total_updates ))
    fi
  done < <(grep -rl "chinmina/${plugin_name}#${old_version}" "$docs_dir")
done

# Output results
if [[ $total_updates -eq 0 ]]; then
  echo "All ${plugin_name} references already at ${target_version}"
else
  echo "Updated ${total_updates} reference(s) to ${target_version}:"
  printf '%s\n' "${updated_files[@]}" | sort -u
fi
