import { db } from './db';

export interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface TagCount {
  name: string;
  noteCount: number;
}

interface NoteRow {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

function tagsForNote(noteId: number): string[] {
  const rows = db
    .query<{ name: string }, [number]>(
      `SELECT t.name FROM tags t
       JOIN note_tags nt ON nt.tag_id = t.id
       WHERE nt.note_id = ?
       ORDER BY t.name`,
    )
    .all(noteId);
  return rows.map((row) => row.name);
}

function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: tagsForNote(row.id),
  };
}

function getOrCreateTagId(rawName: string): number {
  const name = rawName.trim().toLowerCase();
  const existing = db.query<{ id: number }, [string]>('SELECT id FROM tags WHERE name = ?').get(name);
  if (existing) return existing.id;
  const { lastInsertRowid } = db.query('INSERT INTO tags (name) VALUES (?)').run(name);
  return Number(lastInsertRowid);
}

function attachTags(noteId: number, tagNames: string[]): void {
  const link = db.query('INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)');
  for (const name of tagNames) {
    if (!name.trim()) continue;
    link.run(noteId, getOrCreateTagId(name));
  }
}

export function addNote(title: string, content: string, tags: string[] = []): Note {
  const { lastInsertRowid } = db.query('INSERT INTO notes (title, content) VALUES (?, ?)').run(title, content);
  const id = Number(lastInsertRowid);
  attachTags(id, tags);
  return getNote(id)!;
}

export function getNote(id: number): Note | null {
  const row = db
    .query<NoteRow, [number]>('SELECT id, title, content, created_at, updated_at FROM notes WHERE id = ?')
    .get(id);
  return row ? toNote(row) : null;
}

export function deleteNote(id: number): boolean {
  const { changes } = db.query('DELETE FROM notes WHERE id = ?').run(id);
  return changes > 0;
}

export function addTagsToNote(id: number, tags: string[]): Note | null {
  if (!getNote(id)) return null;
  attachTags(id, tags);
  return getNote(id);
}

export function listNotes(tag?: string): Note[] {
  const rows = tag
    ? db
        .query<NoteRow, [string]>(
          `SELECT n.id, n.title, n.content, n.created_at, n.updated_at
           FROM notes n
           JOIN note_tags nt ON nt.note_id = n.id
           JOIN tags t ON t.id = nt.tag_id
           WHERE t.name = ?
           ORDER BY n.id DESC`,
        )
        .all(tag.trim().toLowerCase())
    : db.query<NoteRow, []>('SELECT id, title, content, created_at, updated_at FROM notes ORDER BY id DESC').all();
  return rows.map(toNote);
}

export function searchNotes(searchTerm: string): Note[] {
  const likePattern = `%${searchTerm}%`;
  const rows = db
    .query<NoteRow, [string, string]>(
      `SELECT id, title, content, created_at, updated_at FROM notes
       WHERE title LIKE ? OR content LIKE ?
       ORDER BY id DESC`,
    )
    .all(likePattern, likePattern);
  return rows.map(toNote);
}

export function listTags(): TagCount[] {
  return db
    .query<TagCount, []>(
      `SELECT t.name AS name, COUNT(nt.note_id) AS noteCount
       FROM tags t
       LEFT JOIN note_tags nt ON nt.tag_id = t.id
       GROUP BY t.id
       ORDER BY t.name`,
    )
    .all();
}
