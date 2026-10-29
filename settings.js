// Keep tuning separate from game behaviour so features can be developed independently.
window.COIN_DASH = {
  width: 800,
  height: 500,
  roundSeconds: 120,
  playerSpeed: 240,
  droneCount: 3,
  droneSpawnSeconds: 15,
  // Each spawned drone gets one of these powers at random. The starting drones are always 'normal'.
  dronePowers: {
    normal: { label: 'Drone', color: 0xff657a, speed: 105, size: 26 },
    speedy: { label: 'Speedy!', color: 0xff9f43, speed: 200, size: 18 },
    hunter: { label: 'Hunter!', color: 0xb36bff, speed: 85, size: 26 },
    blinker: { label: 'Blinker!', color: 0xff4fd8, speed: 105, size: 26, blinkSeconds: 4 },
    giant: { label: 'Giant!', color: 0xc21f3a, speed: 60, size: 46 }
  },
  colors: { background: 0x1e63d6, player: 0x71e8ce, coin: 0xffd166 }
};
