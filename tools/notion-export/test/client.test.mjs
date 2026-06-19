import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notionGet, listChildren } from '../lib/client.mjs';

function stubFetch(responses) {
  const calls = [];
  const fetch = async (url, opts) => {
    calls.push({ url, opts });
    const r = responses.shift();
    return { ok: r.ok ?? true, status: r.status ?? 200, json: async () => r.json ?? {} };
  };
  return { fetch, calls };
}

test('notionGet pose les en-têtes et jette sur non ok', async () => {
  const { fetch, calls } = stubFetch([{ json: { id: 'p1' } }]);
  const out = await notionGet('/pages/p1', { token: 'ntn_x', fetch });
  assert.deepEqual(out, { id: 'p1' });
  assert.match(calls[0].url, /\/v1\/pages\/p1$/);
  assert.equal(calls[0].opts.headers.Authorization, 'Bearer ntn_x');
  assert.equal(calls[0].opts.headers['Notion-Version'], '2022-06-28');

  const bad = stubFetch([{ ok: false, status: 404, json: { message: 'nope' } }]);
  await assert.rejects(() => notionGet('/pages/x', { token: 't', fetch: bad.fetch }), /404/);
});

test('listChildren suit la pagination', async () => {
  const { fetch, calls } = stubFetch([
    { json: { results: [{ id: 'a', type: 'paragraph', has_children: false }], has_more: true, next_cursor: 'c1' } },
    { json: { results: [{ id: 'b', type: 'paragraph', has_children: false }], has_more: false, next_cursor: null } },
  ]);
  const blocks = await listChildren('root', { token: 't', fetch });
  assert.equal(blocks.length, 2);
  assert.deepEqual(blocks.map((b) => b.id), ['a', 'b']);
  assert.match(calls[0].url, /\/blocks\/root\/children\?page_size=100$/);
  assert.match(calls[1].url, /start_cursor=c1/);
});
