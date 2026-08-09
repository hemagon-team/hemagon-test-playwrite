import { test } from '../../../src/fixtures/test';
import { listPoolsEliminationScenarios } from '../../../src/helpers/loadScenario';
import { runPoolsEliminationScenario } from '../../../src/flows/poolsElimination.flow';

/** Declarative matrix: `scenarios/pools-elimination/*.json` */
const scenarios = listPoolsEliminationScenarios();

if (scenarios.length === 0) {
  throw new Error('scenarios/pools-elimination is empty — no scenario JSON files found');
}

/** Per-scenario timeout scales with pool count and elimination depth. */
function scenarioTimeout(scenario: (typeof scenarios)[number]): number {
  const base         = 180_000;
  const poolExtra    = scenario.poolsCount * 15_000;
  const bracketExtra = Math.log2(scenario.advanceCount) * 30_000;
  return base + poolExtra + bracketExtra;
}

test.describe('Pools → Elimination full progression', () => {
  for (const scenario of scenarios) {
    test(
      `full progression — ${scenario.id}`,
      { tag: '@scenario' },
      async ({ page, api, resources }) => {
        test.setTimeout(scenarioTimeout(scenario));

        await runPoolsEliminationScenario({ page, api, resources, scenario });
      },
    );
  }
});
