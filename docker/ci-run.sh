#!/usr/bin/env bash
# Full CI run inside the test container: all Playwright projects, then Allure HTML.
set -euo pipefail

TEST_EXIT=0

echo "==> Running full Playwright suite (API + UI + @scenario matrices)"
npm test || TEST_EXIT=$?

echo "==> Generating Allure HTML report"
if npm run allure:generate; then
  echo "Allure report ready at ./allure-report/index.html"
else
  echo "WARNING: Allure report generation failed (tests exit code: ${TEST_EXIT})" >&2
fi

exit "$TEST_EXIT"
