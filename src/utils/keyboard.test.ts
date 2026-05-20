import assert from 'node:assert/strict';
import {
  isEditableKeyboardTarget,
  shouldPreventSpaceScroll,
  shouldSendKunaMessageFromKey,
  shouldToggleKunaChatFromSpace,
} from './keyboard';

const inputTarget = { tagName: 'INPUT', isContentEditable: false };
const textareaTarget = { tagName: 'TEXTAREA', isContentEditable: false };
const pageTarget = { tagName: 'DIV', isContentEditable: false };

assert.equal(isEditableKeyboardTarget(inputTarget), true);
assert.equal(isEditableKeyboardTarget(textareaTarget), true);
assert.equal(isEditableKeyboardTarget({ tagName: 'DIV', isContentEditable: true }), true);
assert.equal(isEditableKeyboardTarget(pageTarget), false);

assert.equal(shouldPreventSpaceScroll({ code: 'Space', repeat: false, target: inputTarget }), false);
assert.equal(shouldPreventSpaceScroll({ code: 'Space', repeat: false, target: pageTarget }), true);
assert.equal(shouldPreventSpaceScroll({ code: 'Space', repeat: true, target: pageTarget }), false);

assert.equal(shouldToggleKunaChatFromSpace({ code: 'Space', repeat: false, target: inputTarget }), false);
assert.equal(shouldToggleKunaChatFromSpace({ code: 'Space', repeat: false, target: pageTarget }), true);

assert.equal(shouldSendKunaMessageFromKey({ key: 'Enter', shiftKey: false }), true);
assert.equal(shouldSendKunaMessageFromKey({ key: 'Enter', shiftKey: true }), false);
