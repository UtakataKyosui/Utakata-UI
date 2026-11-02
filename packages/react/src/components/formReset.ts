import { type Ref, useCallback, useRef, useState } from 'react';

/**
 * Base UI keeps the checked state in React, so a native form reset only
 * resets its hidden input. Remount the control after reset so the visible
 * state, aria-checked and the submitted value return to defaultChecked
 * (controlled consumers reset their own state).
 */
export function useFormResetKey(inputRef: Ref<HTMLInputElement> | undefined) {
  const [key, setKey] = useState(0);
  const cleanup = useRef<(() => void) | undefined>(undefined);
  const ref = useCallback(
    (input: HTMLInputElement | null) => {
      cleanup.current?.();
      cleanup.current = undefined;
      if (typeof inputRef === 'function') inputRef(input);
      else if (inputRef) inputRef.current = input;
      const form = input?.form;
      if (!form) return;
      // The reset event fires before the form restores its controls.
      const onReset = () => setTimeout(() => setKey((value) => value + 1), 0);
      form.addEventListener('reset', onReset);
      cleanup.current = () => form.removeEventListener('reset', onReset);
    },
    [inputRef],
  );
  return [key, ref] as const;
}
