import assert from 'node:assert/strict';
import { getNeteaseUserId } from './neteaseSession';

assert.equal(
  getNeteaseUserId({
    code: 803,
    account: {},
    profile: { userId: 328363790 },
  }),
  '328363790',
);

assert.equal(
  getNeteaseUserId({
    code: 803,
    account: { id: 123 },
  }),
  '123',
);
