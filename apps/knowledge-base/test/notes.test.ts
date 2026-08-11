import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// WAL mode writes -wal/-shm siblings, so the database gets its own directory to be removed wholesale.
const testDbDir = mkdtempSync(join(tmpdir(), 'kb-notes-test-'));

// src/db.ts reads KB_DB_PATH the moment it is imported, and ESM hoists static imports above
// every statement here — so notes.ts has to be imported dynamically, after the variable is set.
let notes: typeof import('../src/notes');

beforeAll(async () => {
  process.env.KB_DB_PATH = join(testDbDir, 'knowledge-base.sqlite');
  notes = await import('../src/notes');

  // Guards the dynamic import above: a static import would open the real database instead,
  // and every test below would still pass while writing to the user's actual notes.
  const { db } = await import('../src/db');
  expect(db.filename).toBe(process.env.KB_DB_PATH);
});

afterAll(() => {
  rmSync(testDbDir, { recursive: true, force: true });
});

describe('addNote', () => {
  test('stores the note and returns it with its tags', () => {
    const note = notes.addNote('Bun test runner', 'bun test discovers *.test.ts', ['bun', 'testing']);

    expect(note.id).toBeGreaterThan(0);
    expect(note.title).toBe('Bun test runner');
    expect(note.content).toBe('bun test discovers *.test.ts');
    expect(note.tags).toEqual(['bun', 'testing']);
    expect(notes.getNote(note.id)).toEqual(note);
  });

  test('normalises tags to trimmed lowercase and drops blank ones', () => {
    const note = notes.addNote('Tag normalisation', 'whitespace and case are not significant', [
      '  MCP  ',
      'Mcp',
      '   ',
      'Transport',
    ]);

    expect(note.tags).toEqual(['mcp', 'transport']);
  });

  test('defaults to no tags', () => {
    expect(notes.addNote('Untagged', 'no tags supplied').tags).toEqual([]);
  });
});

describe('getNote', () => {
  test('returns null for an id that does not exist', () => {
    expect(notes.getNote(999_999)).toBeNull();
  });
});

describe('addTagsToNote', () => {
  test('adds new tags without duplicating existing ones', () => {
    const note = notes.addNote('Streamable HTTP', 'one endpoint, POST and GET', ['transport']);

    const updated = notes.addTagsToNote(note.id, ['transport', 'http']);

    expect(updated?.tags).toEqual(['http', 'transport']);
  });

  test('returns null for an id that does not exist', () => {
    expect(notes.addTagsToNote(999_999, ['orphan'])).toBeNull();
  });
});

describe('deleteNote', () => {
  test('removes the note and reports the deletion', () => {
    const note = notes.addNote('Temporary', 'about to be deleted', ['scratch']);

    expect(notes.deleteNote(note.id)).toBe(true);
    expect(notes.getNote(note.id)).toBeNull();
  });

  test('reports false when nothing was deleted', () => {
    expect(notes.deleteNote(999_999)).toBe(false);
  });

  test('drops the note-tag links but keeps the tag itself', () => {
    const note = notes.addNote('Cascade check', 'tag survives its last note', ['cascade']);
    notes.deleteNote(note.id);

    const cascadeTag = notes.listTags().find((tag) => tag.name === 'cascade');
    expect(cascadeTag).toEqual({ name: 'cascade', noteCount: 0 });
  });
});

describe('listNotes', () => {
  test('returns every note, newest first', () => {
    const older = notes.addNote('Older listing entry', 'first', ['listing']);
    const newer = notes.addNote('Newer listing entry', 'second', ['listing']);

    const listed = notes.listNotes().map((note) => note.id);
    expect(listed.indexOf(newer.id)).toBeLessThan(listed.indexOf(older.id));
  });

  test('filters by tag, matching case-insensitively', () => {
    const note = notes.addNote('Filtered by tag', 'only this one', ['inspector']);

    expect(notes.listNotes('INSPECTOR').map((match) => match.id)).toEqual([note.id]);
  });

  test('returns an empty array for a tag nothing uses', () => {
    expect(notes.listNotes('no-such-tag')).toEqual([]);
  });
});

describe('searchNotes', () => {
  test('matches on title and on content', () => {
    const byTitle = notes.addNote('Zod schema validation', 'unrelated body', []);
    const byContent = notes.addNote('Unrelated title', 'servers describe tools with a zod schema', []);

    const matchedIds = notes.searchNotes('zod schema').map((note) => note.id);
    expect(matchedIds).toContain(byTitle.id);
    expect(matchedIds).toContain(byContent.id);
  });

  test('returns an empty array when nothing matches', () => {
    expect(notes.searchNotes('no note contains this phrase')).toEqual([]);
  });
});

describe('listTags', () => {
  test('counts the notes carrying each tag', () => {
    notes.addNote('Counted one', 'first', ['counted']);
    notes.addNote('Counted two', 'second', ['counted']);

    expect(notes.listTags()).toContainEqual({ name: 'counted', noteCount: 2 });
  });

  test('returns tags in alphabetical order', () => {
    const names = notes.listTags().map((tag) => tag.name);
    expect(names).toEqual([...names].sort());
  });
});
