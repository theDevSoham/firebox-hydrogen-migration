import {useRef, useState} from 'react';

// "Copy number" next to the footer CTA. Falls back to selecting the number on the page.

export function CopyNumber({
  number,
  targetId,
}: {
  number: string;
  targetId: string;
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'selected'>('idle');
  const timer = useRef<number | undefined>(undefined);

  function settle(next: 'copied' | 'selected') {
    setState(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 1800);
  }

  function select() {
    const target = document.getElementById(targetId);
    const selection = window.getSelection();
    if (!target || !selection) return;
    const range = document.createRange();
    range.selectNodeContents(target);
    selection.removeAllRanges();
    selection.addRange(range);
    settle('selected');
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(number);
      settle('copied');
    } catch {
      select();
    }
  }

  return (
    <>
      <button type="button" className="s9-copy" onClick={copy}>
        {state === 'copied'
          ? 'Copied'
          : state === 'selected'
            ? 'Selected'
            : 'Copy number'}
      </button>
      <span className="sr-only" aria-live="polite">
        {state === 'copied'
          ? `${number} copied`
          : state === 'selected'
            ? 'Number selected'
            : ''}
      </span>
    </>
  );
}
