#!/usr/bin/env bash
# Emit GITHUB_OUTPUT fields for NUC trust boundaries (no candidate checkout required).
set -euo pipefail

run=true
message=""
skip_ci=false
code_changed=false
run_e2e=false

event_name="${GITHUB_EVENT_NAME:-}"
head_repo="${NUC_HEAD_REPO:-}"
repository="${GITHUB_REPOSITORY:-}"
actor="${GITHUB_ACTOR:-}"

if [[ "$event_name" == "pull_request" ]]; then
  if [[ -n "$head_repo" && "$head_repo" != "$repository" ]]; then
    run=false
    message="External fork PR: the NUC intentionally does not run untrusted code. This check passes by policy; full CI runs after maintainer workflow approval (if enabled)."
  elif [[ "$actor" == "dependabot[bot]" ]]; then
    run=false
    message="Dependabot PR: the NUC skips bot dependency PRs (same isolation as fork runs). Approve Dependabot workflows or merge manually after review."
  fi
elif [[ "$event_name" == "schedule" ]]; then
  :
elif [[ "$event_name" == "push" || "$event_name" == "workflow_dispatch" ]]; then
  case "$actor" in
    blakeox|github-actions[bot]) ;;
    *)
      run=false
      message="Actor '${actor}' is not in the NUC push/dispatch allowlist (blakeox, github-actions[bot])."
      ;;
  esac
fi

{
  echo "run=${run}"
  echo "policy_message=${message}"
  echo "skip_ci=${skip_ci}"
  echo "code_changed=${code_changed}"
  echo "run_e2e=${run_e2e}"
} >> "${GITHUB_OUTPUT:?GITHUB_OUTPUT must be set}"
