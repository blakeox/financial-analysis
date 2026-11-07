#!/usr/bin/env bash
# Persistent self-hosted workspaces can keep a sparse/partial clone after actions/checkout.
set -euo pipefail
git sparse-checkout disable 2>/dev/null || true
git checkout-index -a -f
git config --local --unset-all extensions.partialClone 2>/dev/null || true
git config --local --unset-all remote.origin.promisor 2>/dev/null || true
git config --local --unset-all remote.origin.partialclonefilter 2>/dev/null || true
