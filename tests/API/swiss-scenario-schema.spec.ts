import { test, expect } from '@playwright/test';
import {
  SWISS_PARTICIPANTS_MAX,
  swissFightsPerRound,
  swissRealBoutsPerRound,
  swissRecommendedRounds,
} from '../../src/data/swissData';
import { listSwissScenarios } from '../../src/helpers/loadScenario';
import { SwissScenarioSchema } from '../../src/schemas/swissScenario.schema';
import { expectSchemaIssue, type SchemaIssueExpectation } from './support/schemaIssue';

/** Fast guard: broken scenario JSON should fail here, not minutes into a UI run. */
test.describe('Swiss scenario schema', () => {
  test('every JSON in scenarios/swiss parses and has a unique id', () => {
    const scenarios = listSwissScenarios();

    expect(scenarios.length).toBeGreaterThan(0);

    const ids = scenarios.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('rounds are derived from the roster, not configured', () => {
    for (const scenario of listSwissScenarios()) {
      expect(scenario.rounds, `${scenario.id}: rounds follow the product recommendation`)
        .toBe(swissRecommendedRounds(scenario.participantsNumber));
    }
  });

  const validBase = { id: 'sanity', participantsNumber: 16 };

  const invalidCases: Array<{
    name:  string;
    patch: Record<string, unknown>;
    issue: SchemaIssueExpectation;
  }> = [
    {
      name:  'roster exceeds the largest matrix entry',
      patch: { participantsNumber: SWISS_PARTICIPANTS_MAX + 1 },
      issue: { path: 'participantsNumber', code: 'too_big' },
    },
    {
      name:  'roster too small for a single pairing',
      patch: { participantsNumber: 1 },
      issue: { path: 'participantsNumber', code: 'too_small' },
    },
    {
      name:  'rounds cannot be pinned by hand',
      patch: { rounds: 4 },
      issue: { path: '', code: 'unrecognized_keys' },
    },
    {
      name:  'misspelled key is not silently ignored',
      patch: { participantsNumbers: 16 },
      issue: { path: '', code: 'unrecognized_keys' },
    },
  ];

  for (const { name, patch, issue } of invalidCases) {
    test(`rejects config: ${name}`, () => {
      expectSchemaIssue(SwissScenarioSchema.safeParse({ ...validBase, ...patch }), issue);
    });
  }

  test('round and fight arithmetic matches the product readouts', () => {
    // "Recommended rounds" observed on the stage card: ceil(log2(N)) + 2.
    expect(swissRecommendedRounds(8)).toBe(5);
    expect(swissRecommendedRounds(10)).toBe(6);
    expect(swissRecommendedRounds(11)).toBe(6);
    expect(swissRecommendedRounds(16)).toBe(6);
    expect(swissRecommendedRounds(23)).toBe(7);
    expect(swissRecommendedRounds(32)).toBe(7);
    expect(swissRecommendedRounds(37)).toBe(8);

    // Odd rosters add one empty fight that has no Run button on the conduct page.
    expect(swissFightsPerRound(23)).toBe(12);
    expect(swissRealBoutsPerRound(23)).toBe(11);
    expect(swissFightsPerRound(32)).toBe(16);
    expect(swissRealBoutsPerRound(32)).toBe(16);
  });
});
