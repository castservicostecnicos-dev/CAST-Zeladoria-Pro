/**
 * Global Input Casing Helper
 * Rules:
 * - All text inputs and textareas: automatically converted to UPPERCASE
 * - Email inputs: automatically converted to lowercase
 * - Password inputs: preserve exact casing (accepts both uppercase and lowercase)
 */

export function setupGlobalInputCasing() {
  if (typeof window === 'undefined') return;

  const transformTarget = (target: HTMLInputElement | HTMLTextAreaElement) => {
    const type = (target.getAttribute('type') || (target as HTMLInputElement).type || 'text').toLowerCase();

    // Passwords accept both uppercase and lowercase without alteration
    if (type === 'password') {
      return;
    }

    const identifier = `${target.name || ''} ${target.id || ''} ${target.placeholder || ''}`.toLowerCase();
    if (identifier.includes('password') || identifier.includes('senha')) {
      return;
    }

    // Skip non-text inputs
    if (['checkbox', 'radio', 'file', 'date', 'time', 'datetime-local', 'color', 'range', 'number'].includes(type)) {
      return;
    }

    const isEmail = type === 'email' || identifier.includes('email') || identifier.includes('e-mail');

    const original = target.value;
    if (!original) return;

    const transformed = isEmail ? original.toLowerCase() : original.toUpperCase();

    if (original !== transformed) {
      const start = target.selectionStart;
      const end = target.selectionEnd;

      // Update value tracker for React synthetic events compatibility
      const targetWithTracker = target as unknown as { _valueTracker?: { setValue: (v: string) => void } };
      if (targetWithTracker._valueTracker) {
        targetWithTracker._valueTracker.setValue(original);
      }

      target.value = transformed;

      if (start !== null && end !== null) {
        try {
          target.setSelectionRange(start, end);
        } catch {
          // Some input types do not support selection ranges
        }
      }
    }
  };

  const handleEvent = (e: Event) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | null;
    if (!target) return;
    const tagName = target.tagName ? target.tagName.toLowerCase() : '';
    if (tagName === 'input' || tagName === 'textarea') {
      transformTarget(target);
    }
  };

  // Attach capture listeners so transformation happens before React SyntheticEvent dispatch
  window.addEventListener('input', handleEvent, true);
  window.addEventListener('change', handleEvent, true);
}
