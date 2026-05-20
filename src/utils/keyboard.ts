type KeyboardTarget = {
  tagName?: string;
  isContentEditable?: boolean;
};

type SpaceKeyboardEvent = {
  code: string;
  repeat: boolean;
  target: EventTarget | KeyboardTarget | null;
};

type KunaSubmitKeyboardEvent = {
  key: string;
  shiftKey: boolean;
};

export function isEditableKeyboardTarget(target: EventTarget | KeyboardTarget | null): boolean {
  if (!target || typeof target !== 'object') return false;

  const keyboardTarget = target as KeyboardTarget;
  if (keyboardTarget.isContentEditable) return true;

  const tagName = keyboardTarget.tagName?.toUpperCase();
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
}

export function shouldPreventSpaceScroll(event: SpaceKeyboardEvent): boolean {
  return event.code === 'Space' && !event.repeat && !isEditableKeyboardTarget(event.target);
}

export function shouldToggleKunaChatFromSpace(event: SpaceKeyboardEvent): boolean {
  return event.code === 'Space' && !event.repeat && !isEditableKeyboardTarget(event.target);
}

export function shouldSendKunaMessageFromKey(event: KunaSubmitKeyboardEvent): boolean {
  return event.key === 'Enter' && !event.shiftKey;
}
