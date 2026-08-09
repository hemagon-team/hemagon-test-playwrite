import fs from 'node:fs';
import path from 'node:path';
import type { z } from 'zod';
import {
  PoolsEliminationScenarioSchema,
  type PoolsEliminationScenario,
} from '../schemas/poolsEliminationScenario.schema';
import {
  SwissScenarioSchema,
  type SwissScenario,
} from '../schemas/swissScenario.schema';

const SCENARIOS_ROOT = path.resolve(__dirname, '../../scenarios');

const POOLS_ELIMINATION_DIR = 'pools-elimination';
const SWISS_DIR             = 'swiss';

function loadScenario<S extends z.ZodType>(
  dir: string,
  fileName: string,
  schema: S,
): z.output<S> {
  const filePath = path.join(SCENARIOS_ROOT, dir, fileName);
  const raw      = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;

  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `${dir}/${fileName} is not a valid scenario: ${JSON.stringify(result.error.issues)}`,
    );
  }
  return result.data;
}

/** Every scenario in a directory, ordered by file name so runs are reproducible. */
function listScenarios<S extends z.ZodType>(dir: string, schema: S): z.output<S>[] {
  return fs.readdirSync(path.join(SCENARIOS_ROOT, dir))
    .filter(name => name.endsWith('.json'))
    .sort()
    .map(name => loadScenario(dir, name, schema));
}

export function listPoolsEliminationScenarios(): PoolsEliminationScenario[] {
  return listScenarios(POOLS_ELIMINATION_DIR, PoolsEliminationScenarioSchema);
}

export function listSwissScenarios(): SwissScenario[] {
  return listScenarios(SWISS_DIR, SwissScenarioSchema);
}
