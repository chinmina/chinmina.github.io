#!/usr/bin/env bash
#
# cloudflare-deploy.sh — post-deploy GitHub integration for Cloudflare Workers/Pages
#
# Usage:
#   cloudflare-deploy.sh comment          Post or update a PR comment with the preview URL
#   cloudflare-deploy.sh deployment       Create a GitHub Deployment and job summary
#
# Required environment:
#   WRANGLER_OUTPUT_FILE_DIRECTORY   Directory where wrangler wrote its output artifacts
#   GH_TOKEN                        GitHub token (usually secrets.GITHUB_TOKEN)
#   GITHUB_REPOSITORY               owner/repo (set automatically by Actions)
#
# For 'comment':
#   PR_NUMBER                       Pull request number
#
# For 'deployment':
#   GITHUB_HEAD_REF / GITHUB_REF_NAME   Branch ref (set automatically by Actions)
#   CLOUDFLARE_ACCOUNT_ID               Cloudflare account ID (for dashboard link)

set -euo pipefail

die() {
  echo "error: $*" >&2
  exit 1
}

# Read the first wrangler output entry matching one of the supported types.
#
# Wrangler writes newline-delimited JSON files named
# wrangler-output-<timestamp>-<hex>.json into WRANGLER_OUTPUT_FILE_DIRECTORY.
# We read all files once and search in priority order:
#   pages-deploy-detailed > deploy > version-upload
read_deploy_output() {
  local dir="${WRANGLER_OUTPUT_FILE_DIRECTORY:?WRANGLER_OUTPUT_FILE_DIRECTORY must be set}"

  # Gather all matching files. Use nullglob-safe find to avoid errors on
  # empty directories.
  local files
  files=$(find "$dir" -maxdepth 1 -name 'wrangler-output-*.json' 2>/dev/null | sort)

  if [[ -z "${files}" ]]; then
    die "no wrangler output files found in ${dir}"
  fi

  # Slurp all lines from all output files into a single stream, then filter.
  # This avoids re-reading the directory for each entry type.
  local -a file_list
  mapfile -t file_list <<< "${files}"

  local all_entries
  all_entries=$(cat "${file_list[@]}" 2>/dev/null)

  local entry_type
  local match
  for entry_type in "pages-deploy-detailed" "deploy" "version-upload"; do
    match=$(jq -c "select(.type == \"${entry_type}\")" <<< "${all_entries}" 2>/dev/null | head -n1)
    if [[ -n "${match}" ]]; then
      echo "${match}"
      return
    fi
  done

  die "no deployment output entry found in wrangler artifacts"
}

# Extract the deployment URL from whichever entry type we found.
extract_url() {
  local entry="$1"
  local entry_type
  entry_type=$(jq -r '.type' <<< "${entry}")

  case "${entry_type}" in
    pages-deploy-detailed)
      jq -r '.url // empty' <<< "${entry}"
      ;;
    deploy)
      jq -r '.targets[0] // empty' <<< "${entry}"
      ;;
    version-upload)
      jq -r '.preview_url // empty' <<< "${entry}"
      ;;
    *)
      die "unknown entry type: ${entry_type}"
      ;;
  esac
}

# Post or update a PR comment with the preview URL.
cmd_comment() {
  local pr="${PR_NUMBER:?PR_NUMBER must be set}"

  local entry
  entry=$(read_deploy_output)

  local url
  url=$(extract_url "${entry}")
  [[ -z "${url}" ]] && die "could not extract deployment URL from wrangler output"

  local body
  body="**Cloudflare Preview**"$'\n\n'"🔗 <a href=\"${url}\" target=\"_blank\">${url}</a>"

  # Include alias URL for Pages deployments.
  local alias_url
  alias_url=$(jq -r '.alias // empty' <<< "${entry}" 2>/dev/null)
  if [[ -n "${alias_url}" ]]; then
    body+=$'\n'"🔀 <a href=\"${alias_url}\" target=\"_blank\">${alias_url}</a> (branch alias)"
  fi

  # Look for an existing comment to update (avoids spamming on repeated pushes).
  local existing_comment
  existing_comment=$(
    gh api "repos/${GITHUB_REPOSITORY}/issues/${pr}/comments" \
      --jq '.[] | select(.body | startswith("**Cloudflare Preview**")) | .id' \
      2>/dev/null | head -n1
  ) || true

  if [[ -n "${existing_comment}" ]]; then
    gh api "repos/${GITHUB_REPOSITORY}/issues/comments/${existing_comment}" \
      -X PATCH -f body="${body}" --silent
    echo "Updated existing comment ${existing_comment}"
  else
    gh api "repos/${GITHUB_REPOSITORY}/issues/${pr}/comments" \
      -f body="${body}" --silent
    echo "Posted new comment on PR #${pr}"
  fi
}

# Create a GitHub Deployment + status and write a job summary.
cmd_deployment() {
  local entry
  entry=$(read_deploy_output)

  local url
  url=$(extract_url "${entry}")
  [[ -z "${url}" ]] && die "could not extract deployment URL from wrangler output"

  local entry_type
  entry_type=$(jq -r '.type' <<< "${entry}")

  local ref="${GITHUB_HEAD_REF:-${GITHUB_REF_NAME:?}}"
  local environment="preview"
  local log_url=""

  # Pages deployments have richer metadata.
  if [[ "${entry_type}" == "pages-deploy-detailed" ]]; then
    environment=$(jq -r '.environment // "preview"' <<< "${entry}")

    local project_name
    project_name=$(jq -r '.pages_project // empty' <<< "${entry}")

    local cf_deployment_id
    cf_deployment_id=$(jq -r '.deployment_id // empty' <<< "${entry}")

    local account_id="${CLOUDFLARE_ACCOUNT_ID:-}"

    if [[ -n "${account_id}" && -n "${project_name}" && -n "${cf_deployment_id}" ]]; then
      log_url="https://dash.cloudflare.com/${account_id}/pages/view/${project_name}/${cf_deployment_id}"
    fi
  fi

  # Create the deployment.
  # Passing an empty JSON array for required_contexts disables commit status
  # checks on the deployment object. The gh cli -f flag cannot represent an
  # empty array, so we pipe raw JSON via --input.
  local gh_deployment_id
  gh_deployment_id=$(
    jq -n \
      --arg ref "${ref}" \
      --arg env "${environment}" \
      --arg desc "Cloudflare Deploy" \
      '{
        ref: $ref,
        environment: $env,
        auto_merge: false,
        description: $desc,
        required_contexts: []
      }' \
    | gh api "repos/${GITHUB_REPOSITORY}/deployments" \
        --method POST --input - --jq '.id'
  )

  if [[ -z "${gh_deployment_id}" ]]; then
    die "failed to create GitHub deployment"
  fi

  # Set deployment status to success.
  local status_body
  status_body=$(
    jq -n \
      --arg env "${environment}" \
      --arg url "${url}" \
      --arg desc "Cloudflare Deploy" \
      --arg log_url "${log_url}" \
      '{
        state: "success",
        environment: $env,
        environment_url: $url,
        description: $desc,
        auto_inactive: false
      }
      | if $log_url != "" then . + {log_url: $log_url} else . end'
  )

  gh api "repos/${GITHUB_REPOSITORY}/deployments/${gh_deployment_id}/statuses" \
    --method POST --input - --silent <<< "${status_body}"

  echo "Created GitHub deployment ${gh_deployment_id} → ${url}"

  # Write job summary if the variable is available.
  if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
    {
      echo "### Cloudflare Deploy"
      echo ""
      echo "| | |"
      echo "|---|---|"
      echo "| **URL** | ${url} |"
      echo "| **Environment** | ${environment} |"
      if [[ -n "${log_url}" ]]; then
        echo "| **Dashboard** | [View](${log_url}) |"
      fi
    } >> "${GITHUB_STEP_SUMMARY}"
  fi
}

main() {
  case "${1:-}" in
    comment)    cmd_comment ;;
    deployment) cmd_deployment ;;
    *)
      echo "Usage: $(basename "$0") {comment|deployment}" >&2
      exit 1
      ;;
  esac
}

main "$@"
