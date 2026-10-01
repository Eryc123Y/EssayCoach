import { describe, expect, it } from 'vitest';

import { expandPracticeExemplarsForPrint } from './practice-print';

describe('expandPracticeExemplarsForPrint', () => {
  it('opens every exemplar for printing and restores each prior disclosure state', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <details class="practice-exemplar"><summary>View example</summary><p>Closed exemplar</p></details>
      <details class="practice-exemplar" open><summary>View example</summary><p>Open exemplar</p></details>
    `;
    const [closed, open] = Array.from(root.querySelectorAll<HTMLDetailsElement>('details'));

    const restore = expandPracticeExemplarsForPrint(root);
    expect(closed.open).toBe(true);
    expect(open.open).toBe(true);

    restore();
    expect(closed.open).toBe(false);
    expect(open.open).toBe(true);
  });
});
