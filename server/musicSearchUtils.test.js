const assert = require('node:assert/strict');
const { withTimeout } = require('./musicSearchUtils');

(async () => {
  const result = await withTimeout(Promise.resolve('ok'), 50, 'slow source');
  assert.equal(result, 'ok');

  await assert.rejects(
    () => withTimeout(new Promise(() => {}), 10, 'Netease'),
    /Netease timed out/,
  );
})();
