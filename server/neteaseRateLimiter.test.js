const assert = require('node:assert/strict');
const { createRequestQueue } = require('./neteaseRateLimiter');

async function run() {
  const starts = [];
  let now = 1000;
  const queue = createRequestQueue({
    minIntervalMs: 50,
    now: () => now,
    wait: async (ms) => {
      now += ms;
    },
  });

  const results = await Promise.all([
    queue.schedule(async () => {
      starts.push(now);
      return 'first';
    }),
    queue.schedule(async () => {
      starts.push(now);
      return 'second';
    }),
    queue.schedule(async () => {
      starts.push(now);
      return 'third';
    }),
  ]);

  assert.deepEqual(results, ['first', 'second', 'third']);
  assert.deepEqual(starts, [1000, 1050, 1100]);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
