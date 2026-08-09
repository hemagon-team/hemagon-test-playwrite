import { test } from '../../../src/fixtures/test';
import { runSwissScenario } from '../../../src/flows/swiss.flow';
import { swissFightsPerRound } from '../../../src/data/swissData';
import { listSwissScenarios } from '../../../src/helpers/loadScenario';

/** Declarative matrix: `scenarios/swiss/*.json` */
const scenarios = listSwissScenarios();

if (scenarios.length === 0) {
  throw new Error('scenarios/swiss is empty — no scenario JSON files found');
}

/** Every round costs one conduct round-trip, so the budget scales with total fights. */
function scenarioTimeout(scenario: (typeof scenarios)[number]): number {
  const base       = 180_000;
  const roundExtra = scenario.rounds * 20_000;
  const fightExtra = swissFightsPerRound(scenario.participantsNumber) * scenario.rounds * 1_500;
  return base + roundExtra + fightExtra;
}

test.describe('Swiss system full progression', () => {
  for (const scenario of scenarios) {
    test(
      `full progression — ${scenario.id}`,
      { tag: '@scenario' },
      async ({ page, api, resources }) => {
        test.setTimeout(scenarioTimeout(scenario));

        await runSwissScenario({ page, api, resources, scenario });
      },
    );
  }
});
