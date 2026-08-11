import { McpServer, ResourceTemplate } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod';
import { addNote, addTagsToNote, deleteNote, getNote, listNotes, listTags, searchNotes, type Note } from './notes';

const server = new McpServer({
  name: 'knowledge-base-server',
  version: '1.0.0',
});

function noteSummary(note: Note): string {
  const tagList = note.tags.length ? note.tags.join(', ') : 'none';
  return `#${note.id} "${note.title}" (tags: ${tagList})`;
}

function noteMarkdown(note: Note): string {
  const tagList = note.tags.length ? note.tags.join(', ') : 'none';
  return `# ${note.title}\n\nTags: ${tagList}\nUpdated: ${note.updatedAt}\n\n${note.content}`;
}

// --- Tools -------------------------------------------------------------

server.registerTool(
  'add-note',
  {
    description: 'Create a new note in the knowledge base, optionally with tags',
    inputSchema: z.object({
      title: z.string().describe('Short title for the note'),
      content: z.string().describe('Body of the note'),
      tags: z.array(z.string()).optional().describe('Tags to attach, e.g. ["mcp", "bun"]'),
    }),
  },
  async ({ title, content, tags }) => {
    const note = addNote(title, content, tags ?? []);
    return { content: [{ type: 'text', text: `Created ${noteSummary(note)}` }] };
  },
);

server.registerTool(
  'get-note',
  {
    description: 'Fetch a single note by id',
    inputSchema: z.object({ id: z.number().int().describe('Note id') }),
  },
  async ({ id }) => {
    const note = getNote(id);
    if (!note) {
      return { content: [{ type: 'text', text: `No note with id ${id}` }], isError: true };
    }
    return { content: [{ type: 'text', text: noteMarkdown(note) }] };
  },
);

server.registerTool(
  'search-notes',
  {
    description: 'Search note titles and bodies for a substring',
    inputSchema: z.object({ query: z.string().describe('Text to search for') }),
  },
  async ({ query }) => {
    const notes = searchNotes(query);
    const text = notes.length ? notes.map(noteSummary).join('\n') : `No notes match "${query}"`;
    return { content: [{ type: 'text', text }] };
  },
);

server.registerTool(
  'list-notes',
  {
    description: 'List all notes, optionally filtered to a single tag',
    inputSchema: z.object({ tag: z.string().optional().describe('Only list notes with this tag') }),
  },
  async ({ tag }) => {
    const notes = listNotes(tag);
    const text = notes.length ? notes.map(noteSummary).join('\n') : 'No notes found';
    return { content: [{ type: 'text', text }] };
  },
);

server.registerTool(
  'delete-note',
  {
    description: 'Delete a note by id',
    inputSchema: z.object({ id: z.number().int().describe('Note id') }),
  },
  async ({ id }) => {
    const deleted = deleteNote(id);
    return {
      content: [{ type: 'text', text: deleted ? `Deleted note #${id}` : `No note with id ${id}` }],
      isError: !deleted,
    };
  },
);

server.registerTool(
  'add-tags',
  {
    description: 'Attach one or more tags to an existing note',
    inputSchema: z.object({
      id: z.number().int().describe('Note id'),
      tags: z.array(z.string()).min(1).describe('Tags to add'),
    }),
  },
  async ({ id, tags }) => {
    const note = addTagsToNote(id, tags);
    if (!note) {
      return { content: [{ type: 'text', text: `No note with id ${id}` }], isError: true };
    }
    return { content: [{ type: 'text', text: `Updated ${noteSummary(note)}` }] };
  },
);

server.registerTool(
  'list-tags',
  { description: 'List every tag in use, with how many notes carry it' },
  async () => {
    const tags = listTags();
    const text = tags.length
      ? tags.map((tag) => `${tag.name} (${tag.noteCount})`).join('\n')
      : 'No tags yet';
    return { content: [{ type: 'text', text }] };
  },
);

// --- Resources -----------------------------------------------------------
// Tools are actions a client explicitly invokes; resources are data a client
// can pull into context on its own (e.g. "@-mention" a note in a chat UI).

server.registerResource(
  'notes-index',
  'kb://notes',
  { title: 'All notes', mimeType: 'application/json' },
  async (uri) => ({
    contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(listNotes(), null, 2) }],
  }),
);

server.registerResource(
  'note',
  new ResourceTemplate('kb://notes/{id}', {
    list: async () => ({
      resources: listNotes().map((note) => ({
        uri: `kb://notes/${note.id}`,
        name: note.title,
        mimeType: 'text/markdown',
      })),
    }),
  }),
  { title: 'Note', mimeType: 'text/markdown' },
  async (uri, variables) => {
    const id = Number(variables.id);
    const note = getNote(id);
    if (!note) throw new Error(`No note with id ${id}`);
    return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: noteMarkdown(note) }] };
  },
);

// --- Prompts ---------------------------------------------------------------
// A prompt is a reusable message template a client can surface as a slash
// command / menu item; it can pull live data (here, matching notes) into the
// generated messages before handing them back to the model.

server.registerPrompt(
  'summarize-notes-by-tag',
  {
    title: 'Summarize notes by tag',
    description: 'Summarize every note carrying a given tag',
    argsSchema: z.object({ tag: z.string().describe('Tag to summarize') }),
  },
  ({ tag }) => {
    const notes = listNotes(tag);
    const body = notes.length
      ? notes.map((note) => `## ${note.title}\n${note.content}`).join('\n\n')
      : `(no notes are tagged "${tag}")`;
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Summarize the key ideas across these notes tagged "${tag}":\n\n${body}`,
          },
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Knowledge Base MCP Server running on stdio');
