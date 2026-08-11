import { expect, test } from 'bun:test';

// TEMPORARY: deliberately failing test used to exercise the PR auto-fix CI flow.
// Delete this file once the experiment is done.
test('deliberate failure to make CI red', () => {
  expect(1 + 1).toBe(3);
});
