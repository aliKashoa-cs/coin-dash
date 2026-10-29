/* global Phaser, COIN_DASH */
// Cosmetic helpers only. Nothing here changes speeds, body sizes or scoring.
window.Visuals = (() => {
  const css = (n) => '#' + n.toString(16).padStart(6, '0');
  const V = () => COIN_DASH.visuals;

  function styleHud(text) {
    const c = COIN_DASH.colors;
    text.setFontFamily(V().font).setFontSize(18).setColor(css(c.text)).setDepth(20);
    text.setStroke(css(c.panel), 4).setShadow(0, 0, css(c.accent), V().glow ? 8 : 0, false, true);
    return text;
  }

  // Top HUD band, drawn behind the HUD text.
  function hudBand(scene) {
    const c = COIN_DASH.colors;
    const g = scene.add.graphics().setDepth(19);
    g.fillStyle(c.panel, 0.85).fillRect(0, 0, COIN_DASH.width, 44);
    g.lineStyle(2, c.accent, 0.8).lineBetween(0, 44, COIN_DASH.width, 44);
    return g;
  }

  function stylePlayer(p) {
    const c = COIN_DASH.colors;
    p.setFillStyle(c.player).setStrokeStyle(2, c.text, 1).setDepth(5);
    return p;
  }
  function styleDrone(d) {
    const c = COIN_DASH.colors;
    d.setFillStyle(c.drone).setStrokeStyle(2, c.droneEdge, 1).setDepth(4);
    return d;
  }
  function styleCoin(k) {
    const c = COIN_DASH.colors;
    k.setFillStyle(c.coin).setStrokeStyle(2, c.coinEdge, 1).setDepth(4);
    return k;
  }

  // Adds glows, a pulsing coin halo and a player trail; follows objects each frame.
  function decorate(scene) {
    const c = COIN_DASH.colors, v = V();
    hudBand(scene);
    const g = scene.add.graphics().setDepth(2);
    const trail = [];
    let t = 0;
    const onUpdate = (_time, delta) => {
      t += delta;
      g.clear();
      if (v.trail && !scene.finished) {
        trail.push({ x: scene.player.x, y: scene.player.y });
        if (trail.length > 12) trail.shift();
      }
      if (v.trail) trail.forEach((p, i) => {
        const f = (i + 1) / trail.length;
        g.fillStyle(c.player, 0.28 * f).fillRect(p.x - 10 * f, p.y - 10 * f, 20 * f, 20 * f);
      });
      if (!v.glow) return;
      const pulse = 0.5 + 0.5 * Math.sin(t / 220);
      g.lineStyle(2, c.coin, 0.35 + 0.35 * pulse).strokeCircle(scene.coin.x, scene.coin.y, 13 + 4 * pulse);
      g.fillStyle(c.coin, 0.12 + 0.1 * pulse).fillCircle(scene.coin.x, scene.coin.y, 20 + 4 * pulse);
      g.fillStyle(c.player, 0.12).fillCircle(scene.player.x, scene.player.y, 26);
      scene.drones.getChildren().forEach((d) => {
        g.fillStyle(c.drone, 0.14 + 0.08 * pulse).fillCircle(d.x, d.y, 26);
      });
    };
    scene.events.on('update', onUpdate);
    scene.events.once('shutdown', () => scene.events.off('update', onUpdate));
  }

  // Dark rounded panel with an accent border for the end screen.
  function endPanel(scene, w, h) {
    const c = COIN_DASH.colors;
    const g = scene.add.graphics().setDepth(30);
    const x = (COIN_DASH.width - w) / 2, y = (COIN_DASH.height - h) / 2;
    g.fillStyle(c.panel, 0.95).fillRoundedRect(x, y, w, h, 16);
    g.lineStyle(3, c.accent, 1).strokeRoundedRect(x, y, w, h, 16);
    return g;
  }
  function styleEnd(text) {
    const c = COIN_DASH.colors;
    text.setFontFamily(V().font).setColor(css(c.text)).setDepth(31);
    text.setShadow(0, 0, css(c.accent), V().glow ? 10 : 0, false, true);
    return text;
  }

  return { styleHud, stylePlayer, styleDrone, styleCoin, decorate, endPanel, styleEnd };
})();
