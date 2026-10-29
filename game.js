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
    this.physics.add.overlap(this.player, this.coin, () => {
      if (this.finished) return;
      this.score++;
      this.placeCoin();
    });
    this.physics.add.overlap(this.player, this.drones, () => this.finish('A drone caught you!'));
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,R');
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
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
    if (this.finished) return;
    const dx = Number(this.cursors.right.isDown || this.keys.D.isDown)
      - Number(this.cursors.left.isDown || this.keys.A.isDown);
    const dy = Number(this.cursors.down.isDown || this.keys.S.isDown)
      - Number(this.cursors.up.isDown || this.keys.W.isDown);
    const direction = new Phaser.Math.Vector2(dx, dy).normalize().scale(COIN_DASH.playerSpeed);
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
    const c = COIN_DASH;
    this.add.rectangle(c.width / 2, c.height / 2, 460, 150, 0x0a1120, 0.95);
    this.add.text(c.width / 2, c.height / 2,
      `${reason}\n${this.score} coins collected\nPress R to try again`,
      { font: '24px monospace', color: '#ffffff', align: 'center', lineSpacing: 12 }
    ).setOrigin(0.5);
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
