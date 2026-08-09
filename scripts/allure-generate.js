const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const results = path.resolve(__dirname, '../allure-results');
const output  = path.resolve(__dirname, '../allure-report');
const bundledJre = path.resolve(__dirname, '../.tools/jre-17');

const env = { ...process.env };
if (!env.JAVA_HOME && fs.existsSync(path.join(bundledJre, 'bin', 'java'))) {
  env.JAVA_HOME = bundledJre;
  env.PATH = `${path.join(bundledJre, 'bin')}${path.delimiter}${env.PATH || ''}`;
}

execSync(
  `npx --no-install allure generate "${results}" -o "${output}" --clean`,
  { stdio: 'inherit', cwd: path.resolve(__dirname, '..'), env },
);
