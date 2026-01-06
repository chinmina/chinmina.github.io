#!/usr/bin/env bash
#
# Fetch latest plugin versions from GitHub releases
# Output: JSON object with plugin names and versions

set -euo pipefail

token_version=$(gh api repos/chinmina/chinmina-token-buildkite-plugin/releases/latest --jq '.tag_name')
git_creds_version=$(gh api repos/chinmina/chinmina-git-credentials-buildkite-plugin/releases/latest --jq '.tag_name')

if [[ -z "$token_version" ]] || [[ -z "$git_creds_version" ]]; then
  echo '{"error": "Failed to fetch versions"}' >&2
  exit 1
fi

cat <<EOF
{
  "chinmina-token": "$token_version",
  "chinmina-git-credentials": "$git_creds_version"
}
EOF
