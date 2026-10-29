// Keep tuning separate from game behaviour so features can be developed independently.
window.COIN_DASH = {
  width: 800,
  height: 500,
  roundSeconds: 120,
  playerSpeed: 240,
  droneCount: 3,
  highScoreKey: 'coinDashHighScore',
  droneSpawnSeconds: 15,
  // Each spawned drone gets one of these powers at random. The starting drones are always 'normal'.
  dronePowers: {
    normal: { label: 'Drone', color: 0xff657a, speed: 105, size: 26 },
    speedy: { label: 'Speedy!', color: 0xff9f43, speed: 200, size: 18 },
    hunter: { label: 'Hunter!', color: 0xb36bff, speed: 85, size: 26 },
    blinker: { label: 'Blinker!', color: 0xff4fd8, speed: 105, size: 26, blinkSeconds: 4 },
    giant: { label: 'Giant!', color: 0xc21f3a, speed: 60, size: 46 }
  },
  powerUpInterval: 12,
  powerUpSeconds: 5,
  powerUpSpeedMultiplier: 1.6,
  powerUpShrinkScale: 0.5,
  audio: {
    volume: 0.08,           // master gain for the background loop (0 to 1)
    tempo: 120,             // beats per minute, one note per beat
    wave: 'triangle',       // oscillator type for the loop
    notes: [262, 330, 392, 330, 294, 349, 440, 349], // Hz, looped
    deathVolume: 0.15,
    deathNotes: [523, 415, 330, 247, 165], // Hz, descending
    deathNoteSeconds: 0.14
  },
  colors: {
    background: 0x0f1430, player: 0x5ef2d0, coin: 0xffd23f, drone: 0xff4d6d,
    grid: 0x2a3366, panel: 0x090c1f, accent: 0x7c6cff, text: 0xf2f5ff,
    droneEdge: 0xffc2cf, coinEdge: 0xfff2b0, powerUp: 0xc77dff
  },
  visuals: { font: 'monospace', glow: true, trail: true }
};
