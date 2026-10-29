// Persistent best score. Storage failures fall back to an in-memory best.
(function () {
  let memoryBest = 0;
  const key = () => (window.COIN_DASH && COIN_DASH.highScoreKey) || 'coinDashHighScore';

  function valid(n) { return Number.isFinite(n) && n >= 0 && Number.isInteger(n); }

  function read() {
    let stored = 0;
    try {
      const raw = window.localStorage.getItem(key());
      if (raw !== null && /^\d+$/.test(raw)) {
        const n = Number(raw);
        if (valid(n)) stored = n;
      }
    } catch (e) { /* storage unavailable */ }
    return Math.max(stored, memoryBest);
  }

  window.HighScore = {
    get() { return read(); },
    submit(score) {
      const previous = read();
      const s = valid(score) ? score : 0;
      const isNew = s > 0 && s > previous;
      const best = isNew ? s : previous;
      memoryBest = best;
      if (isNew) {
        try { window.localStorage.setItem(key(), String(best)); } catch (e) { /* ignore */ }
      }
      return { best, isNew };
    }
  };
})();
