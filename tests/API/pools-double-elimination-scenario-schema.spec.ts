import { test, expect } from '@playwright/test';
import {
  bracketSeedOrder,
  leftBracketSeedPairs,
  rightBracketSeedPairs,
  standardBracketSeedPairs,
  winnerBracketRoundOneFights,
} from '../../src/data/doubleElimData';
import { listPoolsDoubleEliminationScenarios } from '../../src/helpers/loadScenario';
import { PoolsDoubleEliminationScenarioSchema } from '../../src/schemas/poolsDoubleEliminationScenario.schema';
import { expectSchemaIssue, type SchemaIssueExpectation } from './support/schemaIssue';

/** Fast guard: broken scenario JSON should fail here, not minutes into a UI run. */
test.describe('Pools-Double-Elimination scenario schema', () => {
  test('every JSON in scenarios/pools-double-elimination parses and has a unique id', () => {
    const scenarios = listPoolsDoubleEliminationScenarios();

    expect(scenarios.length).toBeGreaterThan(0);

    const ids = scenarios.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('bracket seed order matches Hemagon probe for N=16', () => {
    expect(bracketSeedOrder(16)).toEqual([
      1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11,
    ]);
    expect(leftBracketSeedPairs(16)).toEqual([
      [1, 16], [8, 9], [4, 13], [5, 12],
    ]);
    expect(rightBracketSeedPairs(16)).toEqual([
      [2, 15], [7, 10], [3, 14], [6, 11],
    ]);
    expect(winnerBracketRoundOneFights(16)).toBe(8);
    expect(standardBracketSeedPairs(32)).toHaveLength(16);
  });

  const validBase = {
    id:                 'sanity',
    participantsNumber: 16,
    poolsCount:         4,
    finalsMode:         'BO_1',
    tillFinals:         'yes',
  };

  const invalidCases: Array<{
    name:  string;
    patch: Record<string, unknown>;
    issue: SchemaIssueExpectation;
  }> = [
    {
      name:  'participants not a power of two',
      patch: { participantsNumber: 24, poolsCount: 4 },
      issue: { path: '', message: /power of two/ },
    },
    {
      name:  'participants below matrix minimum',
      patch: { participantsNumber: 8, poolsCount: 2 },
      issue: { path: '', message: /at least 16/ },
    },
    {
      name:  'pool size out of 4-6 range (too small)',
      patch: { participantsNumber: 16, poolsCount: 8 },
      issue: { path: '', message: /pool size must stay within/ },
    },
    {
      name:  'pool size out of 4-6 range (too large)',
      patch: { participantsNumber: 32, poolsCount: 4 },
      issue: { path: '', message: /pool size must stay within/ },
    },
    {
      name:  'invalid finals mode',
      patch: { finalsMode: 'BO_5' },
      issue: { path: 'finalsMode' },
    },
    {
      name:  'misspelled key is not silently ignored',
      patch: { advanceCount: 8 },
      issue: { path: '', code: 'unrecognized_keys' },
    },
  ];

  for (const { name, patch, issue } of invalidCases) {
    test(`rejects config: ${name}`, () => {
      expectSchemaIssue(
        PoolsDoubleEliminationScenarioSchema.safeParse({ ...validBase, ...patch }),
        issue,
      );
    });
  }
});
