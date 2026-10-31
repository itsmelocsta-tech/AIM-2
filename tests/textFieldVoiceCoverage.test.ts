import { expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

it('every editable text/number field has shared dictation or its existing dedicated microphone', () => {
  const missing: string[] = [];
  let shared = 0;
  // These composers already expose a microphone driven by their existing flow.
  const composers = new Set(['CoachScreen.tsx', 'HomeScreen.tsx', 'VoiceModal.tsx', 'ConversationalHomeModule.tsx']);
  function scan(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const filename = path.join(dir, entry.name);
      if (entry.isDirectory()) { scan(filename); continue; }
      if (!filename.endsWith('.tsx') || entry.name === 'VoiceTextField.tsx') continue;
      const source = ts.createSourceFile(filename, fs.readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const walk = (node: ts.Node) => {
        if (ts.isJsxSelfClosingElement(node)) {
          const tag = node.tagName.getText(source);
          if (['VoiceInput', 'VoiceTextarea'].includes(tag)) shared++;
          if (tag === 'input' || tag === 'textarea') {
            const attrs = node.attributes.properties;
            const type = attrs.find(a => ts.isJsxAttribute(a) && a.name.getText(source) === 'type');
            const typeText = type && ts.isJsxAttribute(type) ? type.initializer?.getText(source) || 'text' : 'text';
            const value = attrs.find(a => ts.isJsxAttribute(a) && a.name.getText(source) === 'value')?.getText(source) || '';
            const dedicated = composers.has(entry.name) || (entry.name === 'LifeUpdateModule.tsx' && value.includes('updateText'));
            if (!dedicated && !/range|checkbox|file|date|time|password|hidden/.test(typeText)) missing.push(`${filename}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}`);
          }
        }
        ts.forEachChild(node, walk);
      };
      walk(source);
    }
  }
  scan('src');
  expect(missing).toEqual([]);
  expect(shared).toBeGreaterThan(45);
});
