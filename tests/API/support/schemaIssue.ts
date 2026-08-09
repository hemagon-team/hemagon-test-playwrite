import { expect } from '@playwright/test';

/**
 * What a rejected scenario config must report. Matching on `path` and `code` keeps the
 * assertions independent of Zod's own wording; `message` is only for our own refines.
 */
export interface SchemaIssueExpectation {
  /** Dotted field path; `''` for object-level issues such as an unknown key. */
  path:     string;
  code?:    string;
  message?: RegExp;
}

/** Structural view of a Zod `safeParse` result, so this helper survives Zod bumps. */
interface SafeParseResultLike {
  success: boolean;
  error?: {
    issues: ReadonlyArray<{
      path:    ReadonlyArray<string | number | symbol>;
      code:    string;
      message: string;
    }>;
  };
}

export function expectSchemaIssue(
  result: SafeParseResultLike,
  expected: SchemaIssueExpectation,
): void {
  expect(result.success, 'config must be rejected').toBe(false);

  const issues = result.error?.issues ?? [];
  const match  = issues.find(issue =>
    issue.path.join('.') === expected.path
    && (expected.code === undefined || issue.code === expected.code)
    && (expected.message === undefined || expected.message.test(issue.message)));

  expect(
    match,
    `expected an issue at "${expected.path}" matching ${JSON.stringify(expected)}, `
    + `got ${JSON.stringify(issues)}`,
  ).toBeDefined();
}
