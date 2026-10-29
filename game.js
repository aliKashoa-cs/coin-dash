/* global Phaser, COIN_DASH */
class CoinDash extends Phaser.Scene {
  constructor() { super('CoinDash'); }

  create() {
    const c = COIN_DASH;
    this.score = 0;
    this.finished = false;
    this.deadline = this.time.now + c.roundSeconds * 1000;
    this.physics.world.setBounds(0, 44, c.width, c.height - 44);
    this.add.grid(c.width / 2, c.height / 2, c.width, c.height, 40, 40,
      c.colors.background, 1, 0x24334b, 0.45);
    this.hud = this.add.text(18, 12, '', { font: '18px monospace', color: '#ffffff' });
    this.player = this.add.rectangle(c.width / 2, c.height / 2, 24, 24, c.colors.player);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.coin = this.add.circle(100, 100, 9, c.colors.coin);
    this.physics.add.existing(this.coin);
    this.coin.body.setCircle(9);
    this.placeCoin();
    this.drones = this.physics.add.group();
    for (let i = 0; i < c.droneCount; i++) this.spawnDrone(90 + i * 270, 100, 35 + i * 105, 'normal');
    this.nextSpawn = c.droneSpawnSeconds;
    // Power-up starts hidden; a timer places it every powerUpInterval seconds.
    this.powerUpEnd = 0;
    this.powerUp = this.add.star(0, 0, 5, 7, 15, c.colors.powerUp).setStrokeStyle(2, 0xffffff);
    this.physics.add.existing(this.powerUp);
    this.hidePowerUp();
    this.tweens.add({ targets: this.powerUp, angle: 360, duration: 1500, repeat: -1 });
    this.time.addEvent({ delay: c.powerUpInterval * 1000, loop: true, callback: () => this.spawnPowerUp() });
    this.physics.add.overlap(this.player, this.coin, () => {
      if (this.finished) return;
      this.score++;
      this.placeCoin();
    });
    this.physics.add.overlap(this.player, this.powerUp, () => {
      if (this.finished || !this.powerUp.active) return;
      this.hidePowerUp();
      this.powerUpEnd = this.time.now + c.powerUpSeconds * 1000; // refreshes, never stacks
      this.player.setScale(c.powerUpShrinkScale); // scaling also resizes the arcade body
    });
    this.physics.add.overlap(this.player, this.drones, () => this.finish('A drone caught you!'));
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,R');
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this.paused = false;
    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    // The clock and tweens stay paused across a restart unless cleared here.
    this.time.paused = false;
    this.tweens.resumeAll();
    // Browsers only allow audio after a key press; on restart the context already exists.
    this.musicTimer = null;
    this.events.once('shutdown', () => this.stopMusic());
    if (CoinDash.audioCtx) this.startMusic();
    else this.input.keyboard.once('keydown', () => this.startMusic());
  }

  getAudio() {
    if (!CoinDash.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      try { CoinDash.audioCtx = new AudioCtx(); } catch (e) { return null; }
    }
    if (CoinDash.audioCtx.state === 'suspended') CoinDash.audioCtx.resume();
    return CoinDash.audioCtx;
  }

  tone(ctx, freq, start, length, volume, wave) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + length);
  }

  startMusic() {
    const a = COIN_DASH.audio;
    const ctx = this.getAudio();
    if (!ctx || this.musicTimer || this.paused) return;
    const beat = 60 / a.tempo;
    let step = 0;
    let next = ctx.currentTime + 0.05;
    // Look-ahead scheduler: queue the notes due in the next 0.3s every 100ms.
    const schedule = () => {
      while (next < ctx.currentTime + 0.3) {
        this.tone(ctx, a.notes[step % a.notes.length], next, beat * 0.9, a.volume, a.wave);
        next += beat;
        step++;
      }
    };
    schedule();
    this.musicTimer = setInterval(schedule, 100);
  }

  stopMusic() {
    clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  playDeath() {
    const a = COIN_DASH.audio;
    const ctx = this.getAudio();
    if (!ctx) return;
    const t = ctx.currentTime;
    a.deathNotes.forEach((f, i) =>
      this.tone(ctx, f, t + i * a.deathNoteSeconds, a.deathNoteSeconds * 1.5, a.deathVolume, 'sawtooth'));
  }

  placeCoin() {
    const c = COIN_DASH;
    // Avoid spawning the next coin directly underneath the player.
    let x, y;
    do {
      x = Phaser.Math.Between(25, c.width - 25);
      y = Phaser.Math.Between(70, c.height - 25);
    } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 60);
    this.coin.setPosition(x, y);
    this.coin.body.reset(x, y);
  }

  spawnPowerUp() {
    if (this.finished || this.powerUp.active) return;
    const c = COIN_DASH;
    const x = Phaser.Math.Between(25, c.width - 25);
    const y = Phaser.Math.Between(70, c.height - 25);
    this.powerUp.setPosition(x, y).setActive(true).setVisible(true);
    this.powerUp.body.reset(x, y);
    this.powerUp.body.enable = true;
  }

  hidePowerUp() {
    this.powerUp.setActive(false).setVisible(false);
    this.powerUp.body.enable = false;
  }

  spawnDrone(x, y, degrees, power) {
    const p = COIN_DASH.dronePowers[power];
    const drone = this.add.rectangle(x, y, p.size, p.size, p.color);
    drone.power = power;
    this.drones.add(drone);
    drone.body.setCollideWorldBounds(true).setBounce(1, 1);
    const angle = degrees * Math.PI / 180;
    drone.body.setVelocity(Math.cos(angle) * p.speed, Math.sin(angle) * p.speed);
    if (power === 'blinker') {
      this.time.addEvent({ delay: p.blinkSeconds * 1000, loop: true, callback: () => this.blink(drone) });
    }
    return drone;
  }

  // Flash for a moment as a warning, then jump to a random spot away from the player.
  blink(drone) {
    if (this.finished) return;
    this.tweens.add({ targets: drone, alpha: 0.2, duration: 120, yoyo: true, repeat: 2,
      onComplete: () => {
        if (this.finished) return;
        const { x, y } = this.randomSpotAwayFromPlayer(120);
        drone.body.reset(x, y);
        const angle = Phaser.Math.Between(0, 359) * Math.PI / 180;
        const speed = COIN_DASH.dronePowers.blinker.speed;
        drone.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      } });
  }

  randomSpotAwayFromPlayer(minDistance) {
    const c = COIN_DASH;
    let x, y;
    do {
      x = Phaser.Math.Between(30, c.width - 30);
      y = Phaser.Math.Between(75, c.height - 30);
    } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < minDistance);
    return { x, y };
  }

  spawnRandomDrone() {
    // Keep new drones well away from the player so a spawn is never an instant loss.
    const { x, y } = this.randomSpotAwayFromPlayer(150);
    const power = Phaser.Utils.Array.GetRandom(Object.keys(COIN_DASH.dronePowers));
    this.spawnDrone(x, y, Phaser.Math.Between(0, 359), power);
    const p = COIN_DASH.dronePowers[power];
    const label = this.add.text(x, y - 24, p.label, { font: 'bold 16px monospace',
      color: '#' + p.color.toString(16).padStart(6, '0') }).setOrigin(0.5);
    this.tweens.add({ targets: label, y: y - 60, alpha: 0, duration: 1200, onComplete: () => label.destroy() });
  }

  update() {
    if (this.finished || this.paused) return;
    const c = COIN_DASH;
    const boosted = this.time.now < this.powerUpEnd;
    if (!boosted && this.player.scale !== 1) this.player.setScale(1);
    const dx = Number(this.cursors.right.isDown || this.keys.D.isDown)
      - Number(this.cursors.left.isDown || this.keys.A.isDown);
    const dy = Number(this.cursors.down.isDown || this.keys.S.isDown)
      - Number(this.cursors.up.isDown || this.keys.W.isDown);
    const direction = new Phaser.Math.Vector2(dx, dy).normalize().scale(c.playerSpeed * (boosted ? c.powerUpSpeedMultiplier : 1));
    this.player.body.setVelocity(direction.x, direction.y);
    const seconds = Math.max(0, Math.ceil((this.deadline - this.time.now) / 1000));
    this.hud.setText(`Coins: ${this.score}                       Time: ${seconds}s`);
    if (seconds === 0) return this.finish('Time is up!');
    // Hunters steer straight at the player, but slower than the player can run.
    this.drones.getChildren().forEach(drone => {
      if (drone.power !== 'hunter') return;
      this.physics.moveToObject(drone, this.player, COIN_DASH.dronePowers.hunter.speed);
    });
    // Measure round time from the deadline, so anything that moves the deadline also delays spawns.
    const elapsed = COIN_DASH.roundSeconds - (this.deadline - this.time.now) / 1000;
    if (elapsed >= this.nextSpawn) {
      this.spawnRandomDrone();
      this.nextSpawn += COIN_DASH.droneSpawnSeconds;
    }
  }

  finish(reason) {
    if (this.finished) return;
    this.finished = true;
    this.physics.pause();
    this.stopMusic();
    this.playDeath();
    const c = COIN_DASH;
    this.add.rectangle(c.width / 2, c.height / 2, 460, 150, 0x0a1120, 0.95);
    this.add.text(c.width / 2, c.height / 2,
      `${reason}\n${this.score} coins collected\nPress R to try again`,
      { font: '24px monospace', color: '#ffffff', align: 'center', lineSpacing: 12 }
    ).setOrigin(0.5);
  }

  togglePause() {
    if (this.finished) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.pausedAt = this.time.now;
      this.physics.pause();
      this.time.paused = true; // stops power-up and blinker timers
      this.tweens.pauseAll();
      this.stopMusic();
      const c = COIN_DASH;
      this.pauseText = this.add.text(c.width / 2, c.height / 2,
        'Paused\nPress P or Esc to resume',
        { font: '24px monospace', color: '#ffffff', align: 'center', lineSpacing: 12,
          backgroundColor: '#0a1120', padding: { x: 24, y: 18 } }
      ).setOrigin(0.5);
    } else {
      // time.now keeps running while paused, so push the deadlines back by the paused time.
      const pausedFor = this.time.now - this.pausedAt;
      this.deadline += pausedFor;
      if (this.powerUpEnd > this.pausedAt) this.powerUpEnd += pausedFor;
      this.physics.resume();
      this.time.paused = false;
      this.tweens.resumeAll();
      this.startMusic();
      this.pauseText.destroy();
    }
  }
}
window.coinDashGame = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: COIN_DASH.width,
  height: COIN_DASH.height,
  backgroundColor: COIN_DASH.colors.background,
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
  scene: CoinDash
});
