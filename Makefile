.PHONY: lint typecheck check test.all test.ui test.ui.fast test.scenarios test.api browsers report.clean report.generate report.open run run.full docker.build docker.test docker.report

# Parallel workers for local `make run` / `make test.*` (override: `make run WORKERS=2`).
WORKERS ?= 4

DOCKER_IMAGE ?= hemagon-playwright:local

# Playwright browsers live in ~/.cache/ms-playwright (not in node_modules).
# Re-run after `npm update` / Playwright minor bump (e.g. 1217 → 1223).
browsers:
	node node_modules/playwright/cli.js install chromium

# --- Static checks ---

lint:
	npm run lint

typecheck:
	npm run typecheck

# Fast feedback without a browser: types + lint.
check: typecheck lint

# --- Tests ---

test.all: browsers
	WORKERS=$(WORKERS) npm test

test.ui: browsers
	WORKERS=$(WORKERS) npm run test:ui

# Everything except the long tournament matrices — the fast pre-push signal.
test.ui.fast: browsers
	WORKERS=$(WORKERS) npm run test:ui:fast

# Only the declarative pools/elimination and Swiss matrices (@scenario).
test.scenarios: browsers
	WORKERS=$(WORKERS) npm run test:scenarios

test.api:
	WORKERS=$(WORKERS) npm run test:api

# --- Allure reports ---

REPORT_DIRS := allure-results allure-report test-results playwright-report blob-report

report.clean:
	rm -rf $(REPORT_DIRS)

report.generate:
	npm run allure:generate

report.open:
	npm run allure:open

# --- Full run: clean → all tests (WORKERS parallel) → Allure generate → open ---
# Tests may fail; report is still generated and opened (see message below).

run: run.full

run.full:
	$(MAKE) report.clean
	@TEST_EXIT=0; \
	$(MAKE) test.all || TEST_EXIT=$$?; \
	$(MAKE) report.generate; \
	if [ $$TEST_EXIT -ne 0 ]; then \
		echo ""; \
		echo ">>> Tests failed (exit $$TEST_EXIT). Opening Allure report anyway."; \
		echo ""; \
	fi; \
	$(MAKE) report.open

# --- Docker (same image as .github/workflows/ci.yml) ---

docker.build:
	docker build -t $(DOCKER_IMAGE) .

# Full suite + Allure HTML; requires .env (BASE_URL, ORGANIZER_EMAIL, ORGANIZER_PASSWORD).
docker.test: docker.build
	mkdir -p allure-results allure-report test-results .cache/auth
	docker run --rm --shm-size=2g --env-file .env \
		-v "$(CURDIR)/.cache:/app/.cache" \
		-v "$(CURDIR)/allure-results:/app/allure-results" \
		-v "$(CURDIR)/allure-report:/app/allure-report" \
		-v "$(CURDIR)/test-results:/app/test-results" \
		-e CI=1 \
		$(DOCKER_IMAGE)

docker.report:
	@echo "Open file://$(CURDIR)/allure-report/index.html"
