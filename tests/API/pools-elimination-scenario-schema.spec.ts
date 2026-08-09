import { test, expect } from '@playwright/test';
import { listPoolsEliminationScenarios } from '../../src/helpers/loadScenario';
import { PoolsEliminationScenarioSchema } from '../../src/schemas/poolsEliminationScenario.schema';
import { expectSchemaIssue, type SchemaIssueExpectation } from './support/schemaIssue';

/** Fast guard: broken scenario JSON should fail here, not 6 minutes into a UI run. */
test.describe('Pools-Elimination scenario schema', () => {
  test('every JSON in scenarios/pools-elimination parses and has a unique id', () => {
    const scenarios = listPoolsEliminationScenarios();

    expect(scenarios.length).toBeGreaterThan(0);

    const ids = scenarios.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  const validBase = {
    id:                  'sanity',
    participantsNumber:  24,
    poolsCount:          4,
    advanceCount:        8,
    minimumFromEachPool: 'any',
  };

  const invalidCases: Array<{
    name:  string;
    patch: Record<string, unknown>;
    issue: SchemaIssueExpectation;
  }> = [
    {
      name:  'advanceCount not a power of two',
      patch: { advanceCount: 10 },
      issue: { path: 'advanceCount', message: /advanceCount must be one of/ },
    },
    {
      name:  'advanceCount exceeds participants',
      patch: { participantsNumber: 6, poolsCount: 1, advanceCount: 8 },
      issue: { path: '', message: /must not exceed participantsNumber/ },
    },
    {
      name:  'pool size out of 4-6 range (too small)',
      patch: { participantsNumber: 9, poolsCount: 3, advanceCount: 4 },
      issue: { path: '', message: /pool size must stay within/ },
    },
    {
      name:  'pool size out of 4-6 range (too large)',
      patch: { participantsNumber: 32, poolsCount: 4, advanceCount: 16 },
      issue: { path: '', message: /pool size must stay within/ },
    },
    {
      name:  'guaranteed pool minimum exceeds advance',
      patch: { participantsNumber: 45, poolsCount: 9, advanceCount: 16, minimumFromEachPool: 3 },
      issue: { path: '', message: /must not exceed advanceCount/ },
    },
    {
      name:  'misspelled key is not silently ignored',
      patch: { thirdPlaces: false },
      issue: { path: '', code: 'unrecognized_keys' },
    },
  ];

  for (const { name, patch, issue } of invalidCases) {
    test(`rejects config: ${name}`, () => {
      expectSchemaIssue(
        PoolsEliminationScenarioSchema.safeParse({ ...validBase, ...patch }),
        issue,
      );
    });
  }
});
