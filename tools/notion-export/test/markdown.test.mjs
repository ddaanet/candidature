import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blocksToMarkdown } from '../lib/markdown.mjs';

const rt = (s) => [{ type: 'text', plain_text: s, annotations: {} }];
const blk = (type, extra = {}) => ({ id: 'x', type, has_children: false, [type]: { rich_text: rt('T') }, ...extra });

test('titres h1/h2/h3', async () => {
  const { markdown } = await blocksToMarkdown([
    { id: '1', type: 'heading_1', has_children: false, heading_1: { rich_text: rt('A') } },
    { id: '2', type: 'heading_2', has_children: false, heading_2: { rich_text: rt('B') } },
    { id: '3', type: 'heading_3', has_children: false, heading_3: { rich_text: rt('C') } },
  ], {});
  assert.equal(markdown, '# A\n\n## B\n\n### C\n');
});

test('paragraphe, divider, quote, code', async () => {
  const { markdown } = await blocksToMarkdown([
    { id: '1', type: 'paragraph', has_children: false, paragraph: { rich_text: rt('para') } },
    { id: '2', type: 'divider', has_children: false, divider: {} },
    { id: '3', type: 'quote', has_children: false, quote: { rich_text: rt('cite') } },
    { id: '4', type: 'code', has_children: false, code: { rich_text: rt('print(1)'), language: 'python' } },
  ], {});
  assert.equal(markdown, 'para\n\n---\n\n> cite\n\n```python\nprint(1)\n```\n');
});

test('listes à puces, numérotées, to_do', async () => {
  const { markdown } = await blocksToMarkdown([
    { id: '1', type: 'bulleted_list_item', has_children: false, bulleted_list_item: { rich_text: rt('a') } },
    { id: '2', type: 'numbered_list_item', has_children: false, numbered_list_item: { rich_text: rt('b') } },
    { id: '3', type: 'to_do', has_children: false, to_do: { rich_text: rt('c'), checked: false } },
    { id: '4', type: 'to_do', has_children: false, to_do: { rich_text: rt('d'), checked: true } },
  ], {});
  assert.equal(markdown, '- a\n1. b\n- [ ] c\n- [x] d\n');
});

test('child_page collecté, non rendu en ligne', async () => {
  const { markdown, childPages } = await blocksToMarkdown([
    { id: 'p1', type: 'child_page', has_children: true, child_page: { title: 'Lettre de motivation' } },
  ], {});
  assert.equal(markdown, '');
  assert.deepEqual(childPages, [{ id: 'p1', title: 'Lettre de motivation' }]);
});

test('table rendue depuis ses table_row', async () => {
  const stub = {
    fetch: async () => ({ ok: true, status: 200, json: async () => ({
      results: [
        { id: 'r1', type: 'table_row', has_children: false, table_row: { cells: [rt('H1'), rt('H2')] } },
        { id: 'r2', type: 'table_row', has_children: false, table_row: { cells: [rt('a'), rt('b')] } },
      ], has_more: false, next_cursor: null }) }),
  };
  const { markdown } = await blocksToMarkdown([
    { id: 't', type: 'table', has_children: true, table: { table_width: 2, has_column_header: true } },
  ], { token: 't', fetch: stub.fetch });
  assert.equal(markdown, '| H1 | H2 |\n| --- | --- |\n| a | b |\n');
});

test('liste imbriquée indentée', async () => {
  const stub = {
    fetch: async () => ({ ok: true, status: 200, json: async () => ({
      results: [{ id: 'c', type: 'bulleted_list_item', has_children: false, bulleted_list_item: { rich_text: rt('enfant') } }],
      has_more: false, next_cursor: null }) }),
  };
  const { markdown } = await blocksToMarkdown([
    { id: 'p', type: 'bulleted_list_item', has_children: true, bulleted_list_item: { rich_text: rt('parent') } },
  ], { token: 't', fetch: stub.fetch });
  assert.equal(markdown, '- parent\n  - enfant\n');
});
