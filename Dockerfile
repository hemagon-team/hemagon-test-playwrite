# Browser version must match @playwright/test in package.json (currently 1.60.x).
FROM mcr.microsoft.com/playwright:v1.60.0-jammy

WORKDIR /app

# Bundled .tools/jre is local-only (gitignored); OpenJDK covers Allure in CI/Docker.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openjdk-17-jre-headless \
  && rm -rf /var/lib/apt/lists/*

ENV CI=1
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

COPY package.json package-lock.json ./
# Browsers ship with the base image — skip postinstall Chromium download.
RUN npm ci --ignore-scripts

COPY . .

RUN chmod +x docker/ci-run.sh

ENTRYPOINT ["docker/ci-run.sh"]
