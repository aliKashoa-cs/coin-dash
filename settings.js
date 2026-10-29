// Keep tuning separate from game behaviour so features can be developed independently.
window.COIN_DASH = {
  width: 800,
  height: 500,
  roundSeconds: 120,
  playerSpeed: 240,
  droneSpeed: 105,
  droneCount: 3,
  colors: {
    background: 0x0f1430, player: 0x5ef2d0, coin: 0xffd23f, drone: 0xff4d6d,
    grid: 0x2a3366, panel: 0x090c1f, accent: 0x7c6cff, text: 0xf2f5ff,
    droneEdge: 0xffc2cf, coinEdge: 0xfff2b0
  },
  visuals: { font: 'monospace', glow: true, trail: true }
};
