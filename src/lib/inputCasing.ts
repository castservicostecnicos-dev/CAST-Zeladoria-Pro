/**
 * Global Input Casing Helper
 * Regras estritas solicitadas pelo usuário:
 * - Todos os campos de texto e áreas de texto (textarea): preenchimento e exibição em LETRAS MAIÚSCULAS (UPPERCASE)
 * - Campos de e-mail: preenchimento e exibição exclusivamente em letras minúsculas (lowercase)
 * - Campos de senha: sem alteração, recebem tanto maiúsculas quanto minúsculas (ambas)
 */

export function setupGlobalInputCasing() {
  if (typeof window === 'undefined') return;

  const transformTarget = (target: HTMLInputElement | HTMLTextAreaElement) => {
    const type = (target.getAttribute('type') || (target as HTMLInputElement).type || 'text').toLowerCase();

    // Senhas aceitam tanto maiúsculas quanto minúsculas sem qualquer alteração
    if (type === 'password') {
      return;
    }

    const identifier = `${target.name || ''} ${target.id || ''} ${target.placeholder || ''}`.toLowerCase();
    if (identifier.includes('password') || identifier.includes('senha')) {
      return;
    }

    // Pular inputs que não aceitam formatação de texto livre
    if (['checkbox', 'radio', 'file', 'date', 'time', 'datetime-local', 'color', 'range', 'number'].includes(type)) {
      return;
    }

    const isEmail = type === 'email' || identifier.includes('email') || identifier.includes('e-mail');

    const original = target.value;
    if (!original) return;

    // Regra: E-mail sempre minúsculo; todos os demais sempre MAIÚSCULOS
    const transformed = isEmail ? original.toLowerCase() : original.toUpperCase();

    if (original !== transformed) {
      const start = target.selectionStart;
      const end = target.selectionEnd;

      // Atualiza value tracker do React para garantir sincronização de componentes controlados
      const targetWithTracker = target as unknown as { _valueTracker?: { setValue: (v: string) => void } };
      if (targetWithTracker._valueTracker) {
        targetWithTracker._valueTracker.setValue(original);
      }

      target.value = transformed;

      if (start !== null && end !== null) {
        try {
          target.setSelectionRange(start, end);
        } catch {
          // Ignora se o tipo de input não suportar seleção
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

  // Intercepta digitação em tempo real (beforeinput) para inserção imediata com o casing correto
  const handleBeforeInput = (e: Event) => {
    const inputEvent = e as InputEvent;
    const target = inputEvent.target as HTMLInputElement | HTMLTextAreaElement | null;
    if (!target || !inputEvent.data) return;

    const type = (target.getAttribute('type') || (target as HTMLInputElement).type || 'text').toLowerCase();
    if (type === 'password') return;

    const identifier = `${target.name || ''} ${target.id || ''} ${target.placeholder || ''}`.toLowerCase();
    if (identifier.includes('password') || identifier.includes('senha')) return;
    if (['checkbox', 'radio', 'file', 'date', 'time', 'datetime-local', 'color', 'range', 'number'].includes(type)) return;

    const isEmail = type === 'email' || identifier.includes('email') || identifier.includes('e-mail');
    const transformed = isEmail ? inputEvent.data.toLowerCase() : inputEvent.data.toUpperCase();

    if (transformed !== inputEvent.data) {
      // Inserir texto transformado se suportado
      try {
        if (typeof document.execCommand === 'function') {
          inputEvent.preventDefault();
          document.execCommand('insertText', false, transformed);
        }
      } catch {
        // Fallback para handleEvent (input capture)
      }
    }
  };

  // Registra listeners na fase de captura (true) para interceptar antes dos SyntheticEvents do React
  window.addEventListener('beforeinput', handleBeforeInput, true);
  window.addEventListener('input', handleEvent, true);
  window.addEventListener('change', handleEvent, true);
  window.addEventListener('paste', () => setTimeout(() => {
    const active = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
      transformTarget(active);
    }
  }, 10), true);
}
