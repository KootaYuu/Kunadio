function createRequestQueue({
  minIntervalMs = 350,
  now = () => Date.now(),
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
  let chain = Promise.resolve();
  let lastStart = 0;

  const schedule = (operation) => {
    const run = chain.then(async () => {
      const elapsed = now() - lastStart;
      if (lastStart > 0 && elapsed < minIntervalMs) {
        await wait(minIntervalMs - elapsed);
      }
      lastStart = now();
      return operation();
    });

    chain = run.catch(() => undefined);
    return run;
  };

  return { schedule };
}

module.exports = {
  createRequestQueue,
};
