import { test } from 'node:test';
import assert from 'node:assert/strict';
import { richTextToMarkdown } from '../lib/richtext.mjs';

const item = (text, annotations = {}, href = null) => ({
  type: 'text', plain_text: text, href,
  annotations: { bold: false, italic: false, code: false, strikethrough: false, underline: false, color: 'default', ...annotations },
});

test('texte simple est rendu tel quel', () => {
  assert.equal(richTextToMarkdown([item('bonjour')]), 'bonjour');
});

test('gras, italique, code', () => {
  assert.equal(richTextToMarkdown([item('x', { bold: true })]), '**x**');
  assert.equal(richTextToMarkdown([item('x', { italic: true })]), '*x*');
  assert.equal(richTextToMarkdown([item('x', { code: true })]), '`x`');
});

test('le code enveloppe avant le gras', () => {
  assert.equal(richTextToMarkdown([item('x', { code: true, bold: true })]), '**`x`**');
});

test('lien', () => {
  assert.equal(richTextToMarkdown([item('Notion', {}, 'https://notion.so')]), '[Notion](https://notion.so)');
});

test('concatène plusieurs segments', () => {
  assert.equal(richTextToMarkdown([item('a '), item('b', { bold: true })]), 'a **b**');
});

test('mention rendue par plain_text', () => {
  assert.equal(richTextToMarkdown([{ type: 'mention', plain_text: '2026-04-09', annotations: {} }]), '2026-04-09');
});

test('tableau vide ou absent donne chaîne vide', () => {
  assert.equal(richTextToMarkdown([]), '');
  assert.equal(richTextToMarkdown(undefined), '');
});
