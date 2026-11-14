import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CircuitDiagram, CircuitPart } from './CircuitDiagram';
import { COMPONENT_NAMES, generateCircuit, type ComponentKind } from './circuit';

test('all nine component kinds have two genuinely different SVG drawings', () => {
  for (const kind of Object.keys(COMPONENT_NAMES) as ComponentKind[]) {
    const first = renderToStaticMarkup(createElement('svg', null, createElement(CircuitPart, { kind, state: 0 })));
    const second = renderToStaticMarkup(createElement('svg', null, createElement(CircuitPart, { kind, state: 1 })));
    assert.notEqual(first, second, `${kind} must have a visual difference`);
    assert.match(first, /<(path|circle|rect)/);
    assert.match(second, /<(path|circle|rect)/);
  }
});

test('the circuit exposes twelve keyboard targets and marks found pairs without adding value tables', () => {
  const board = generateCircuit(42);
  const props = { board, side: 'inspected' as const, found: [board.differences[0]], lastMistake: null, disabled: false, onInspect: () => {} };
  const markup = renderToStaticMarkup(createElement(CircuitDiagram, props));
  assert.equal((markup.match(/role="button"/g) ?? []).length, 12);
  assert.equal((markup.match(/tabindex="0"/g) ?? []).length, 11);
  assert.equal((markup.match(/aria-pressed="true"/g) ?? []).length, 1);
  const locked = renderToStaticMarkup(createElement(CircuitDiagram, { ...props, disabled: true }));
  assert.equal((locked.match(/tabindex="0"/g) ?? []).length, 0);
  assert.ok(!markup.includes('<table'));
});
