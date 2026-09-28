/* VCA-VOL oefenapp – "Spot de gevaren"-scènes.
 * Levert window.VCA_SCENES: per scène een SVG-illustratie (inner markup) en de klikbare gevaren.
 * De SVG wordt hieronder met kleine tekenhulpjes opgebouwd; het resultaat is een gewone string.
 */
(function () {
  "use strict";

  /* ---------- tekenhulpjes ---------- */
  function a(o) {
    var s = "";
    for (var k in o) if (o[k] !== undefined && o[k] !== null) s += " " + k + '="' + o[k] + '"';
    return s;
  }
  function R(x, y, w, h, fill, ex) { return "<rect" + a({ x: x, y: y, width: w, height: h, fill: fill }) + (ex ? " " + ex : "") + "/>"; }
  function C(cx, cy, r, fill, ex) { return "<circle" + a({ cx: cx, cy: cy, r: r, fill: fill }) + (ex ? " " + ex : "") + "/>"; }
  function E(cx, cy, rx, ry, fill, ex) { return "<ellipse" + a({ cx: cx, cy: cy, rx: rx, ry: ry, fill: fill }) + (ex ? " " + ex : "") + "/>"; }
  function P(d, fill, ex) { return '<path d="' + d + '" fill="' + fill + '"' + (ex ? " " + ex : "") + "/>"; }
  function L(x1, y1, x2, y2, st, w, ex) {
    return "<line" + a({ x1: x1, y1: y1, x2: x2, y2: y2, stroke: st, "stroke-width": w, "stroke-linecap": "round" }) + (ex ? " " + ex : "") + "/>";
  }
  function PL(pts, st, w, ex) {
    return '<polyline points="' + pts.map(function (p) { return p[0] + "," + p[1]; }).join(" ") +
      '" fill="none" stroke="' + st + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + (ex ? " " + ex : "") + "/>";
  }
  function G(tr, inner) { return '<g transform="' + tr + '">' + inner + "</g>"; }

  var HELM_GEEL = "#f7c600", HELM_WIT = "#f6f6f2", VEST = "#f5821f", REFLEX = "#e4ecef";

  /* Figuurtje: voeten op (x,y), ±108 eenheden hoog bij s=1. */
  function person(o) {
    var s = o.s || 1, sk = o.skin || "#e9b98c", sh = o.shirt || "#3d6fa8", pa = o.pants || "#2f4058";
    var legs = o.legs || [[[-6, -46], [-7, -5]], [[6, -46], [7, -5]]];
    var arms = o.arms || [[[-13, -78], [-17, -62], [-18, -48]], [[13, -78], [17, -62], [18, -48]]];
    var g = "";
    if (o.behind) g += o.behind;
    legs.forEach(function (l) {
      g += PL(l, pa, 10.5);
      var f = l[l.length - 1];
      g += E(f[0] + (o.foot || 0), f[1] + 2, 7.5, 3.8, "#2b2420");
    });
    // romp
    g += P("M-15,-44 L-15,-76 Q-15,-85 -6,-85 L6,-85 Q15,-85 15,-76 L15,-44 Z", sh);
    if (o.vest !== false) {
      g += P("M-15,-46 L-15,-76 Q-15,-84 -8,-84 L-4,-84 L0,-73 L4,-84 L8,-84 Q15,-84 15,-76 L15,-46 Z", o.vest || VEST);
      g += R(-15, -64, 30, 3.6, REFLEX) + R(-15, -55, 30, 3.6, REFLEX);
      g += R(-11, -84, 3, 20, REFLEX) + R(8, -84, 3, 20, REFLEX);
    }
    g += R(-15, -48, 30, 5, pa);
    // hoofd
    g += R(-3.5, -89, 7, 6, sk);
    g += C(0, -95, 10, sk);
    if (o.helmet) {
      g += P("M-11.5,-97 C-11.5,-111 11.5,-111 11.5,-97 Z", o.helmet, o.helmet === HELM_WIT ? 'stroke="#b9bcbf" stroke-width="0.8"' : "");
      g += R(-14, -98.5, 28, 3.4, o.helmet, 'rx="1.7"' + (o.helmet === HELM_WIT ? ' stroke="#b9bcbf" stroke-width="0.8"' : ""));
      g += R(-1.5, -108, 3, 10, "rgba(0,0,0,0.12)");
    } else {
      g += P("M-10.5,-96 C-11,-108 11,-108 10.5,-96 C7,-101 -6,-102 -10.5,-96 Z", o.hair || "#4a3426");
    }
    if (o.glasses) g += R(-9, -97.5, 18, 5, "#a9dcf5", 'rx="2.2" stroke="#26465a" stroke-width="1.3"');
    if (o.mask) g += o.mask;
    if (o.mid) g += o.mid;
    arms.forEach(function (ar, i) {
      g += PL(ar, sh, 7.5);
      var h = ar[ar.length - 1];
      var gl = o.gloves;
      if (gl) g += C(h[0], h[1], 6.2, gl, 'stroke="#9a5d12" stroke-width="1"');
      else g += C(h[0], h[1], 4.2, sk);
    });
    if (o.front) g += o.front;
    var sx = (o.flip ? -s : s);
    return G("translate(" + o.x + " " + o.y + ")" + (o.rot ? " rotate(" + o.rot + ")" : "") + " scale(" + sx + " " + s + ")", g);
  }

  function ladder(x1, y1, x2, y2, col, rung) {
    var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy);
    var nx = -dy / len * 9, ny = dx / len * 9, g = "";
    var n = Math.floor(len / (rung || 15));
    for (var i = 1; i <= n; i++) {
      var t = i / (n + 0.4), px = x1 + dx * t, py = y1 + dy * t;
      g += L(px - nx, py - ny, px + nx, py + ny, col, 2.6);
    }
    g += L(x1 - nx, y1 - ny, x2 - nx, y2 - ny, col, 4) + L(x1 + nx, y1 + ny, x2 + nx, y2 + ny, col, 4);
    return g;
  }

  /* gasfles rechtop, bodem-midden op (0,0) */
  function bottle(body, shoulder, h) {
    h = h || 62;
    return R(-9, -h, 18, h, body, 'rx="7"') + P("M-9,-" + (h - 12) + " L-9,-" + (h - 6) + " Q-9,-" + (h + 1) + " 0,-" + (h + 1) + " Q9,-" + (h + 1) + " 9,-" + (h - 6) + " L9,-" + (h - 12) + " Z", shoulder) +
      R(-3.5, -h - 7, 7, 7, "#8a8f94") + R(-6, -h - 9, 12, 3, "#6d7277", 'rx="1.5"') + R(-9, -3, 18, 3, "rgba(0,0,0,0.15)", 'rx="1.5"');
  }

  function jerrycan(x, y) {
    return G("translate(" + x + " " + y + ")",
      P("M0,0 L0,-30 L6,-36 L24,-36 L24,0 Z", "#d6342a") + R(9, -41, 11, 5, "#d6342a", 'rx="2"') +
      R(3, -26, 18, 3, "#b02820") +
      P("M12,-21 L19,-14 L12,-7 L5,-14 Z", "#fff") + P("M12,-20 L18,-14 L12,-8 L6,-14 Z", "#ffffff", 'stroke="#d6342a" stroke-width="1.2"') +
      P("M12,-10.5 C9.5,-11 9.5,-14 11,-16 C11,-14.5 12,-14 12.5,-15 C13,-13.5 15,-12.5 12,-10.5 Z", "#222"));
  }

  function box(x, y, w, h, c) {
    c = c || "#c99a5b";
    return R(x, y, w, h, c, 'stroke="#9d7440" stroke-width="1.2"') + R(x + w / 2 - 3, y, 6, h, "rgba(255,255,255,0.35)");
  }
  function pallet(x, y, w) {
    return R(x, y, w, 3, "#b98a52") + R(x, y + 7, w, 3, "#b98a52") + R(x + 2, y + 3, 7, 4, "#9c7040") + R(x + w / 2 - 3.5, y + 3, 7, 4, "#9c7040") + R(x + w - 9, y + 3, 7, 4, "#9c7040");
  }
  function cloud(x, y, s) {
    return G("translate(" + x + " " + y + ") scale(" + s + ")", E(0, 0, 40, 13, "#ffffff") + E(-18, -8, 20, 13, "#ffffff") + E(12, -12, 24, 16, "#ffffff"));
  }
  function barrier(x, y, w) { // rood-wit hek op voetjes
    var g = R(x, y, w, 9, "#ffffff", 'stroke="#c62828" stroke-width="1"');
    for (var i = 0; i < w; i += 16) g += P("M" + (x + i) + "," + (y + 9) + " l8,-9 l8,0 l-8,9 Z", "#d32f2f");
    g = "<g>" + g + "</g>";
    return R(x + 3, y + 9, 3, 24, "#555") + R(x + w - 6, y + 9, 3, 24, "#555") + R(x - 3, y + 31, 15, 4, "#333", 'rx="1"') + R(x + w - 12, y + 31, 15, 4, "#333", 'rx="1"') + g;
  }
  function cone(x, y) {
    return P("M" + (x - 9) + "," + y + " L" + (x - 3) + "," + (y - 26) + " L" + (x + 3) + "," + (y - 26) + " L" + (x + 9) + "," + y + " Z", "#f26b1d") +
      P("M" + (x - 6.6) + "," + (y - 10) + " L" + (x - 5) + "," + (y - 17) + " L" + (x + 5) + "," + (y - 17) + " L" + (x + 6.6) + "," + (y - 10) + " Z", "#ffffff") +
      R(x - 12, y - 2, 24, 4, "#e25a12", 'rx="1"');
  }

  /* =========================================================
   * Scène 1 – Bouwplaats
   * ========================================================= */
  function bouwplaats() {
    var s = "";
    s += R(0, 0, 800, 460, "#d3eaf7");
    s += cloud(95, 58, 1) + cloud(560, 105, 0.75) + cloud(330, 40, 0.6);
    // bomen in de verte
    [20, 70, 150, 620, 690].forEach(function (x, i) { s += E(x, 300, 34, 22 + (i % 2) * 6, "#b4d5a5"); });
    // grond
    s += R(0, 300, 800, 160, "#e3d4aa");
    s += R(0, 300, 800, 5, "#cfbe8f");
    [[40, 350], [300, 455], [470, 360], [650, 452], [770, 405], [200, 385]].forEach(function (p) { s += E(p[0], p[1], 5, 2, "#cbb98a"); });

    // ---- torenkraan (achtergrond) ----
    var cr = "#f0b400", crd = "#c99500";
    s += R(718, 312, 58, 18, "#9aa1a8");
    s += R(737, 50, 4, 264, cr) + R(754, 50, 4, 264, cr);
    for (var yy = 60; yy < 312; yy += 20) s += L(739, yy, 756, yy + 20, crd, 2) + L(739, yy + 20, 756, yy + 20, crd, 1.5);
    s += P("M740,50 L747,10 L755,50 Z", "none", 'stroke="' + cr + '" stroke-width="3"');
    s += L(747, 12, 400, 44, "#8a8a8a", 1.2) + L(747, 12, 800, 42, "#8a8a8a", 1.2);
    s += R(395, 44, 405, 4, cr) + R(395, 56, 405, 4, cr);
    for (var xx = 398; xx < 790; xx += 18) s += L(xx, 58, xx + 9, 46, crd, 1.6) + L(xx + 9, 46, xx + 18, 58, crd, 1.6);
    s += R(760, 60, 40, 22, "#8d949a");
    s += R(716, 60, 26, 20, cr, 'rx="2"') + R(719, 63, 16, 10, "#a8daf2");
    // loopkat + kabel + last
    s += R(640, 60, 22, 6, "#555");
    s += L(646, 66, 649, 176, "#444", 1.5) + L(656, 66, 653, 176, "#444", 1.5);
    s += R(644, 174, 14, 9, "#e2a800") + P("M651,183 l0,6 a4,4 0 1 1 -6,2", "none", 'stroke="#333" stroke-width="2.2"');
    s += L(648, 190, 618, 212, "#444", 1.6) + L(652, 190, 684, 212, "#444", 1.6);
    s += R(616, 212, 70, 24, "#c1633f");
    for (var by = 218; by < 236; by += 6) s += L(616, by, 686, by, "#a54f2f", 1);
    s += pallet(614, 236, 74);

    // ---- gebouw in aanbouw ----
    s += R(250, 130, 280, 192, "#e2e4e6");
    s += R(274, 236, 113, 86, "#c8734d");
    for (var wy = 244; wy < 322; wy += 10) s += L(274, wy, 387, wy, "#b0603d", 1);
    s += R(305, 256, 46, 34, "#6d7f8c");
    s += R(399, 236, 113, 86, "#cfd3d6");
    [262, 387, 512].forEach(function (x) { s += R(x, 108, 12, 214, "#bfc4c9") + L(x + 3, 108, x + 3, 96, "#7b5a3a", 1.5) + L(x + 9, 108, x + 9, 98, "#7b5a3a", 1.5); });
    s += R(248, 225, 284, 11, "#a3aab1") + R(248, 130, 284, 10, "#a3aab1");
    // leuningen gebouw (goed)
    s += L(250, 76, 530, 76, "#e8b400", 3) + L(250, 102, 530, 102, "#e8b400", 3) + R(250, 120, 280, 10, "#e8b400");
    [252, 330, 410, 490, 528].forEach(function (x) { s += L(x, 74, x, 130, "#7c858c", 3); });
    s += L(250, 172, 500, 172, "#e8b400", 3) + L(250, 198, 500, 198, "#e8b400", 3) + R(250, 215, 250, 10, "#e8b400");
    [252, 330, 410, 498].forEach(function (x) { s += L(x, 170, x, 225, "#7c858c", 3); });
    // collega op 1e verdieping (goed)
    s += person({ x: 440, y: 225, s: 0.85, helmet: HELM_WIT, arms: [[[-13, -78], [-20, -62], [-14, -50]], [[13, -78], [22, -66], [30, -72]]] });
    // collega op dak (goed)
    s += person({ x: 330, y: 130, s: 0.72, helmet: HELM_GEEL });

    // ---- steiger links ----
    var st = "#8c969e";
    s += R(180, 128, 4, 194, st) + R(244, 128, 4, 194, st);
    s += L(182, 320, 246, 228, st, 2.5) + L(182, 225, 246, 140, st, 2.5);
    s += R(176, 221, 76, 7, "#c9a15a") + R(176, 127, 76, 6, "#c9a15a");
    s += L(178, 170, 250, 170, "#e8b400", 3) + L(178, 196, 250, 196, "#e8b400", 3) + R(176, 211, 76, 10, "#e8b400");
    s += L(180, 168, 180, 222, st, 3) + L(248, 168, 248, 222, st, 3);
    s += R(172, 318, 16, 5, "#555") + R(240, 318, 16, 5, "#555");
    // werker op onbeveiligde bovenste vloer
    s += person({ x: 222, y: 127, s: 0.82, helmet: HELM_GEEL, arms: [[[-13, -78], [-22, -64], [-30, -58]], [[13, -78], [18, -62], [18, -48]]] });

    // ---- bouwkeet met geblokkeerde nooduitgang ----
    s += R(18, 226, 152, 96, "#5a88b8") + R(18, 222, 152, 9, "#44709c");
    for (var kx = 26; kx < 170; kx += 12) s += L(kx, 232, kx, 320, "#4f7ba8", 1.2);
    s += R(34, 250, 50, 30, "#ffffff") + R(37, 253, 44, 24, "#b9e2f5");
    s += R(118, 250, 34, 72, "#e9eef2") + C(146, 288, 2, "#555");
    s += R(116, 234, 38, 13, "#1a9b4b", 'rx="1.5"');
    s += R(120, 236, 7, 9, "#ffffff") + P("M131,240.5 l7,0 l0,-2.5 l5,4 l-5,4 l0,-2.5 l-7,0 Z", "#ffffff") + C(147, 237.5, 1.6, "#fff") + L(147, 239.5, 146, 243, "#fff", 1.5);
    s += pallet(104, 312, 64) + pallet(104, 302, 64);
    s += box(108, 272, 30, 30) + box(138, 278, 28, 24, "#d3a869") + box(114, 250, 26, 22, "#d3a869");

    // ---- flessenkar (goed) ----
    s += R(26, 382, 52, 5, "#555") + C(34, 390, 5, "#333") + C(70, 390, 5, "#333") + R(28, 316, 4, 70, "#555");
    s += G("translate(44 382)", bottle("#2f5f8a", "#ffffff", 58)) + G("translate(64 382)", bottle("#5a5f63", "#7a2d2d", 58));
    s += L(30, 345, 76, 345, "#3a3a3a", 2.5, 'stroke-dasharray="3 2"');

    // ---- open put ----
    s += E(95, 420, 34, 12, "#8d949a") + E(95, 419, 27, 8.5, "#1b2024");
    s += E(165, 430, 27, 9, "#6f777d") + E(165, 428, 27, 9, "#80888e") + L(148, 428, 182, 428, "#6f777d", 1.5) + L(165, 420, 165, 436, "#6f777d", 1.5);

    // ---- jerrycans + roker ----
    s += jerrycan(232, 434) + jerrycan(260, 434);
    s += person({ x: 308, y: 440, s: 0.9, helmet: HELM_GEEL, flip: true,
      arms: [[[-13, -78], [-17, -62], [-18, -48]], [[13, -78], [20, -86], [8, -91]]],
      front: L(6, -91, -6, -93, "#ffffff", 3) + C(-7, -93, 2.2, "#ff5a1f") +
        P("M-8,-98 C-16,-104 -2,-110 -10,-117 C-18,-124 -4,-128 -12,-136", "none", 'stroke="#8d979d" stroke-width="2.4" stroke-linecap="round"') });

    // ---- bouwstroomkast + kabel door plas ----
    s += R(452, 300, 38, 44, "#d8dcdf", 'rx="2"') + R(452, 300, 38, 7, "#f0a500") + L(458, 344, 458, 352, "#555", 3) + L(484, 344, 484, 352, "#555", 3);
    s += P("M471,316 l7,12 l-14,0 Z", "#ffd400", 'stroke="#222" stroke-width="1"') + P("M471.5,319 l-2,5 l2.5,0 l-2,4", "none", 'stroke="#222" stroke-width="1"');
    s += E(452, 426, 46, 13, "#8ec5e6") + E(444, 423, 28, 6, "#b3daf0");
    s += P("M470,344 C472,380 440,392 450,414 C458,432 430,440 408,430 C392,422 396,402 384,398", "none", 'stroke="#1f1f1f" stroke-width="3" stroke-linecap="round"');
    // kabelhaspel aan het eind van de kabel
    s += R(356, 404, 40, 5, "#555") + L(362, 404, 368, 378, "#555", 3) + L(390, 404, 384, 378, "#555", 3);
    s += C(376, 376, 22, "#d6342a") + C(376, 376, 15, "#2a2a2a") + C(376, 376, 12, "#3a3a3a") + C(376, 376, 5, "#d6342a") + R(372, 348, 8, 8, "#555", 'rx="2"');

    // ---- gasfles los op de grond ----
    s += E(566, 446, 38, 3, "rgba(0,0,0,0.15)");
    s += G("translate(604 437) rotate(-90)", bottle("#5a5f63", "#7a2d2d", 62));

    // ---- ladder zonder uitsteek + klimmen met emmer ----
    s += ladder(574, 326, 538, 232, "#b8c0c7", 14);
    s += person({ x: 562, y: 300, s: 0.8, helmet: HELM_GEEL,
      legs: [[[-6, -46], [-7, -20], [-6, -3]], [[6, -46], [9, -30], [8, -22]]],
      arms: [[[-13, -78], [-15, -92], [-10, -104]], [[13, -78], [22, -66], [26, -54]]],
      front: G("translate(26 -50)", P("M-9,0 L9,0 L7,18 L-7,18 Z", "#9ea7ae") + P("M-8,0 C-8,-10 8,-10 8,0", "none", 'stroke="#555" stroke-width="1.5"') + R(-9, 0, 18, 3, "#808990")) });

    // ---- werker onder hangende last, zonder helm, bellend ----
    s += person({ x: 652, y: 392, s: 0.95, helmet: null,
      arms: [[[-13, -78], [-17, -62], [-18, -48]], [[13, -78], [22, -88], [10, -96]]],
      front: R(6, -102, 6, 11, "#222", 'rx="1.5"') });

    // ---- afgezet stuk rechts (goed) ----
    s += R(706, 420, 80, 18, "#7a6a4c", 'rx="3"');
    s += barrier(700, 392, 44) + barrier(750, 392, 44);
    s += cone(694, 452);
    s += person({ x: 770, y: 380, s: 0.8, helmet: HELM_WIT, arms: [[[-13, -78], [-20, -62], [-24, -48]], [[13, -78], [18, -62], [18, -48]]] });

    return s;
  }

  var scenes = [];

  scenes.push({
    id: "bouwplaats",
    titel: "Bouwplaats",
    intro: "Een drukke bouwplaats met kraan, steiger en bouwkeet: er zitten 8 gevaren in, maar niet alles is fout.",
    viewBox: "0 0 800 460",
    svg: bouwplaats(),
    hazards: [
      { id: "nooduitgang", x: 98, y: 226, w: 80, h: 104, titel: "Nooduitgang geblokkeerd",
        uitleg: "De nooduitgang van de bouwkeet staat vol met pallets en dozen. Vluchtwegen en nooduitgangen moeten altijd vrij, herkenbaar en direct bruikbaar zijn. Ruim het direct op en zet nooit iets voor een nooduitgang." },
      { id: "steiger", x: 166, y: 22, w: 96, h: 120, titel: "Steigervloer zonder leuning",
        uitleg: "Op de bovenste steigervloer ontbreken leuning, knieleuning en kantplank. Een steigervloer moet een leuning op ±1 m, een knieleuning op ±0,5 m en een kantplank van minimaal 15 cm hebben. De onderste vloer laat zien hoe het hoort." },
      { id: "ladder", x: 508, y: 170, w: 82, h: 160, titel: "Ladder onjuist gebruikt",
        uitleg: "De ladder steekt niet boven de verdiepingsvloer uit en de man klimt met een emmer in zijn hand. Een ladder moet ±1 m boven de uitstapplaats uitsteken, geborgd zijn en onder een hoek van 65–75° staan. Klim met je gezicht naar de ladder en houd drie steunpunten: materiaal gaat apart omhoog." },
      { id: "hangende-last", x: 604, y: 168, w: 94, h: 232, titel: "Onder hangende last, zonder helm",
        uitleg: "Deze medewerker staat bellend en zonder helm onder de last van de torenkraan. Loop of werk nooit onder een hangende last en blijf buiten het afgezette hijsgebied. Op de bouwplaats draag je altijd een veiligheidshelm en je houdt je aandacht bij je werk." },
      { id: "put", x: 52, y: 398, w: 146, h: 50, titel: "Open put zonder afzetting",
        uitleg: "De put staat open en het deksel ligt ernaast, zonder hekwerk of markering. Iemand kan erin vallen. Leg het deksel direct terug of zet de opening deugdelijk af met hekken en waarschuwingsborden, zoals rechts bij de sleuf." },
      { id: "roken", x: 222, y: 328, w: 110, h: 120, titel: "Roken bij brandbare vloeistof",
        uitleg: "Er wordt gerookt direct naast jerrycans met brandbare vloeistof (let op het vlampictogram). Dampen kunnen ontbranden of exploderen. Rook alleen op de aangewezen rookplek, ver van brandbare stoffen, en berg jerrycans gesloten op in een geventileerde opslag." },
      { id: "kabel-water", x: 398, y: 396, w: 106, h: 50, titel: "Kabel door een plas water",
        uitleg: "De kabel van de bouwstroomkast loopt door een plas water. Bij een beschadiging kan dat leiden tot elektrocutie. Leg kabels droog en bij voorkeur hoog (ophangen), controleer ze op schade en sluit aan via een aardlekschakelaar." },
      { id: "gasfles", x: 508, y: 404, w: 112, h: 52, titel: "Gasfles los op de grond",
        uitleg: "De gasfles ligt los op de grond en kan wegrollen of beschadigd raken. Gasflessen staan rechtop en geborgd tegen omvallen (ketting of flessenkar), met de beschermkap op de afsluiter als ze niet in gebruik zijn. Acetyleen nooit liggend gebruiken. De flessenkar links laat zien hoe het hoort." }
    ]
  });

  /* =========================================================
   * Scène 2 – Werkplaats
   * ========================================================= */
  function werkplaats() {
    var s = "";
    s += R(0, 0, 800, 460, "#e8e3d8");
    // dakspanten + ramen
    s += R(0, 0, 800, 16, "#8a96a3");
    for (var x = 20; x < 800; x += 130) s += R(x, 28, 100, 44, "#cfe6f3", 'stroke="#9aa6b1" stroke-width="3"') + L(x + 50, 28, x + 50, 72, "#9aa6b1", 3);
    s += R(0, 84, 800, 6, "#b9b2a3");
    // wandplint + vloer
    s += R(0, 300, 800, 160, "#b7bdc2");
    s += R(0, 292, 800, 10, "#8e959b");
    // looppad (geel gemarkeerd)
    s += R(0, 392, 800, 5, "#f2c200") + R(0, 452, 800, 5, "#f2c200");
    for (var px = 30; px < 800; px += 90) s += P("M" + px + ",424 l16,0 l0,-5 l10,8 l-10,8 l0,-5 l-16,0 Z", "rgba(255,255,255,0.55)");

    // EHBO-bord (goed)
    s += R(172, 112, 26, 26, "#1a9b4b", 'rx="2"') + R(182, 116, 6, 18, "#fff") + R(176, 122, 18, 6, "#fff");

    // ---- kolomboor ----
    s += R(40, 318, 90, 14, "#2f6b4c", 'rx="2"');
    s += R(76, 150, 12, 170, "#9aa3aa");
    s += R(48, 150, 76, 38, "#3a8a61", 'rx="6"') + R(52, 154, 20, 8, "#2f6b4c", 'rx="2"');
    s += L(118, 170, 132, 186, "#555", 3) + C(133, 187, 3, "#d33");
    s += R(96, 188, 10, 18, "#8f979d") + P("M99,206 L103,206 L101.5,230 Z", "#5b6266");
    s += R(60, 248, 76, 8, "#6c767d") + R(80, 256, 10, 10, "#6c767d");
    s += R(86, 234, 38, 14, "#b0b8bf");
    s += person({ x: 164, y: 330, s: 0.95, helmet: HELM_WIT, glasses: true, flip: true, gloves: "#f2a33a",
      arms: [[[-13, -78], [-22, -70], [-40, -88]], [[13, -78], [2, -66], [-32, -90]]] });

    // ---- werkbank + haakse slijper zonder kap / bril ----
    s += R(206, 270, 150, 9, "#8a5a36") + R(212, 279, 8, 51, "#6e4428") + R(342, 279, 8, 51, "#6e4428") + R(212, 306, 138, 5, "#6e4428");
    s += R(314, 254, 24, 16, "#555") + R(306, 248, 40, 7, "#6c767d") + R(296, 238, 34, 10, "#b0b8bf");
    // vonken richting gezicht
    [[-16, -30], [-26, -22], [-34, -34], [-22, -40], [-40, -24], [-10, -38], [-38, -42], [-30, -12]].forEach(function (d) {
      s += L(298 + d[0] * 0.25, 238 + d[1] * 0.25, 298 + d[0] * 1.5, 238 + d[1] * 1.5, "#ffae00", 2.2);
    });
    s += person({ x: 248, y: 330, s: 0.95, helmet: HELM_WIT,
      arms: [[[-13, -78], [4, -70], [28, -86]], [[13, -78], [26, -78], [40, -92]]],
      front: G("translate(34 -92) rotate(12)", R(-16, -7, 34, 13, "#2c5f8a", 'rx="6"') + R(-22, -4, 7, 7, "#333", 'rx="1"') + R(14, -3, 8, 6, "#6c767d") + C(22, 6, 12, "#4a4f54") + C(22, 6, 3, "#9aa3aa")) });

    // ---- brandblusser geblokkeerd ----
    s += R(372, 146, 30, 30, "#d32f2f", 'rx="2"');
    s += P("M383,152 L391,152 L391,155 L394,155 L394,170 L380,170 L380,155 L383,155 Z", "#fff") + L(391, 153, 397, 150, "#fff", 1.5);
    s += R(378, 196, 18, 60, "#d32f2f", 'rx="7"') + R(381, 188, 10, 9, "#333") + L(391, 190, 400, 205, "#222", 2);
    s += R(368, 228, 70, 100, "#4f8a4f", 'rx="4"') + R(364, 222, 78, 10, "#3f7440", 'rx="3"') + C(378, 330, 5, "#222") + C(428, 330, 5, "#222");
    s += R(376, 244, 54, 4, "#3f7440") + R(376, 256, 54, 4, "#3f7440");

    // ---- chemicaliënkast (goed) + tafel met drinkfles ----
    s += R(454, 176, 46, 150, "#f2c200", 'rx="3"') + L(477, 180, 477, 322, "#c79f00", 2);
    s += P("M465,196 l7,7 l-7,7 l-7,-7 Z", "#fff", 'stroke="#d32f2f" stroke-width="1.6"') + P("M489,196 l7,7 l-7,7 l-7,-7 Z", "#fff", 'stroke="#d32f2f" stroke-width="1.6"');
    s += P("M465,199 C462,204 463,207 465,209 C467,207 468,204 465,199 Z", "#222") + C(489, 203, 2.3, "#222");
    s += R(506, 272, 68, 8, "#8a5a36") + R(510, 280, 6, 48, "#6e4428") + R(564, 280, 6, 48, "#6e4428");
    // jerrycan met etiket
    s += R(510, 226, 32, 46, "#ffffff", 'rx="3" stroke="#9aa3aa" stroke-width="1.2"') + R(519, 219, 10, 8, "#1e6fb8") + R(514, 236, 24, 22, "#eeeeee");
    s += P("M526,238 l9,9 l-9,9 l-9,-9 Z", "#fff", 'stroke="#d32f2f" stroke-width="1.8"') + P("M522,250 l8,0 l-1.5,-5 l-5,0 Z", "#222");
    // drinkfles met groene vloeistof, zonder etiket
    s += R(548, 234, 18, 38, "#7fe07a", 'rx="5" stroke="#4f9f4a" stroke-width="1.2"') + R(551, 226, 12, 9, "#cfeecd") + R(551.5, 219, 11, 7, "#2d7fd1", 'rx="1.5"');
    s += R(551, 239, 4, 28, "rgba(255,255,255,0.5)", 'rx="2"');

    // ---- heftruck met persoon op de vorken ----
    s += R(646, 214, 64, 6, "#333") + L(648, 218, 654, 280, "#333", 4) + L(708, 218, 706, 270, "#333", 4);
    s += P("M646,272 L646,316 L718,316 L718,286 L702,272 Z", "#f2a900") + R(706, 256, 16, 40, "#dd9600", 'rx="3"');
    s += R(668, 250, 14, 22, "#333", 'rx="3"');
    s += C(658, 318, 13, "#2b2b2b") + C(658, 318, 5, "#8a8f94") + C(706, 320, 11, "#2b2b2b") + C(706, 320, 4, "#8a8f94");
    s += person({ x: 676, y: 272, s: 0.62, helmet: HELM_GEEL, glasses: true, legs: [[[-6, -46], [-12, -44], [-14, -30]], [[6, -46], [0, -44], [-2, -30]]],
      arms: [[[-13, -78], [-22, -66], [-30, -60]], [[13, -78], [2, -64], [-24, -58]]] });
    s += R(628, 148, 8, 180, "#555") + R(638, 148, 6, 180, "#666");
    s += R(620, 204, 6, 40, "#333") + R(580, 238, 46, 6, "#333");
    s += person({ x: 600, y: 238, s: 0.75, helmet: HELM_GEEL, glasses: true,
      arms: [[[-13, -78], [-18, -62], [-14, -48]], [[13, -78], [24, -84], [36, -90]]] });

    // ---- scheve stapel kratten ----
    var st = "";
    st += pallet(0, 0, 58);
    var cols = ["#3f7ac0", "#2f6aa8", "#3f7ac0", "#2f6aa8", "#3f7ac0", "#2f6aa8", "#3f7ac0"];
    for (var i = 0; i < 7; i++) {
      var off = i * i * 0.3, y0 = -30 * (i + 1);
      st += G("rotate(" + (i * 1.3) + " " + (off + 30) + " " + (y0 + 29) + ")", R(off, y0, 56, 29, cols[i], 'rx="2"') + R(6 + off, y0 + 6, 44, 5, "rgba(0,0,0,0.18)", 'rx="2"'));
    }
    s += G("translate(728 320)", st);

    // ---- gemorste olie op looppad ----
    s += P("M118,432 C112,418 150,410 172,414 C198,406 232,416 226,428 C236,440 200,448 176,444 C150,450 110,446 118,432 Z", "#2e2a24");
    s += E(160, 424, 16, 3, "rgba(255,255,255,0.28)") + E(206, 430, 9, 2, "rgba(255,255,255,0.22)");
    s += G("translate(230 428) rotate(-78)", R(-9, -28, 18, 28, "#3a6fb0", 'rx="2"') + R(-3, -34, 6, 7, "#333"));

    // ---- perslucht op kleding ----
    s += R(318, 400, 20, 30, "#1e6fb8", 'rx="3"') + C(328, 404, 9, "#1e6fb8") + C(328, 404, 4, "#0f4d85");
    s += P("M332,420 C360,448 390,452 410,420 C416,408 420,402 424,398", "none", 'stroke="#f2c200" stroke-width="3" stroke-linecap="round"');
    s += person({ x: 462, y: 452, s: 0.95, helmet: HELM_WIT, glasses: true,
      arms: [[[-13, -78], [-26, -64], [-22, -50]], [[13, -78], [20, -62], [22, -50]]],
      front: G("translate(-22 -50) rotate(30)", R(-12, -4, 14, 8, "#333", 'rx="2"') + R(2, -1.5, 9, 3, "#555")) +
        P("M-12,-44 C-6,-40 -2,-34 -4,-24 M-10,-46 C-2,-46 6,-42 8,-34 M-14,-42 C-12,-34 -10,-28 -14,-20", "none", 'stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"') +
        C(8, -26, 4.5, "#a08c6a") + C(0, -16, 4, "#a08c6a") + C(14, -36, 3.5, "#a08c6a") + C(-8, -12, 3, "#a08c6a") + C(16, -20, 3, "#a08c6a") });

    // ---- collega op looppad (goed) ----
    s += person({ x: 620, y: 440, s: 0.9, helmet: HELM_WIT, glasses: true,
      legs: [[[-6, -46], [-12, -5]], [[6, -46], [12, -5]]],
      arms: [[[-13, -78], [-22, -62], [-26, -50]], [[13, -78], [20, -62], [26, -52]]] });

    return s;
  }

  scenes.push({
    id: "werkplaats",
    titel: "Werkplaats",
    intro: "Een industriële werkplaats met machines, heftruck en opslag: zoek de 8 gevaren.",
    viewBox: "0 0 800 460",
    svg: werkplaats(),
    hazards: [
      { id: "kolomboor", x: 44, y: 150, w: 122, h: 184, titel: "Boren met handschoenen aan",
        uitleg: "Hij boort met werkhandschoenen aan en houdt het werkstuk met de hand vast. Een handschoen kan door de draaiende boor worden gegrepen, waardoor je hand wordt meegetrokken. Bij draaiende machines geen handschoenen dragen en het werkstuk vastzetten in een machineklem." },
      { id: "slijpen", x: 194, y: 180, w: 164, h: 154, titel: "Slijpen zonder bril en beschermkap",
        uitleg: "Deze collega slijpt zonder veiligheidsbril en de slijpschijf heeft geen beschermkap. Vonken en brokstukken van de schijf kunnen ernstig oogletsel geven. Draag bij slijpen altijd een veiligheidsbril (of gelaatsscherm) en werk nooit zonder beschermkap." },
      { id: "blusser", x: 362, y: 140, w: 84, h: 196, titel: "Brandblusser geblokkeerd",
        uitleg: "De brandblusser is geblokkeerd door een afvalcontainer. Blusmiddelen moeten altijd zichtbaar en vrij bereikbaar zijn, met het pictogram erboven. Zet nooit iets voor een blusser, brandslanghaspel of nooduitgang." },
      { id: "drinkfles", x: 502, y: 208, w: 76, h: 74, titel: "Chemicaliën in een drinkfles",
        uitleg: "Er is een chemische vloeistof overgegoten in een drinkfles zonder etiket. Iemand kan het opdrinken en niemand weet welk gevaar erin zit. Bewaar gevaarlijke stoffen alleen in de originele of correct geëtiketteerde verpakking (met GHS-pictogrammen), nooit in een fles voor eten of drinken." },
      { id: "heftruck", x: 580, y: 140, w: 146, h: 196, titel: "Persoon op de vorken van de heftruck",
        uitleg: "Er staat iemand op de geheven vorken van de heftruck. Meerijden op de vorken of het voertuig is verboden: een heftruck is geen personenlift. Voor werk op hoogte gebruik je een hoogwerker of een goedgekeurde werkbak." },
      { id: "stapel", x: 728, y: 96, w: 70, h: 240, titel: "Scheve, te hoge stapel",
        uitleg: "De kratten staan scheef en veel te hoog gestapeld en kunnen omvallen. Stapel recht en stabiel, zwaar onderop en niet hoger dan veilig kan; gebruik een stelling voor hoge opslag en haal scheve stapels direct weg." },
      { id: "olie", x: 104, y: 400, w: 150, h: 54, titel: "Olie op het looppad",
        uitleg: "Er ligt gemorste olie op het gemarkeerde looppad: grote kans op uitglijden en vallen. Ruim lekkages direct op met absorptiekorrels of -doeken, zet de plek zo nodig af en houd looppaden vrij en schoon." },
      { id: "perslucht", x: 404, y: 340, w: 96, h: 116, titel: "Kleding schoonblazen met perslucht",
        uitleg: "Hij blaast zijn kleding schoon met perslucht. Perslucht kan via de huid of lichaamsopeningen het lichaam binnendringen en vuil in je ogen blazen. Blaas nooit kleding of huid schoon met perslucht; gebruik een borstel of stofzuiger." }
    ]
  });

  /* =========================================================
   * Scène 3 – Besloten ruimte
   * ========================================================= */
  function beslotenRuimte() {
    var s = "";
    s += R(0, 0, 800, 460, "#dde8ee");
    // leidingenbrug achtergrond
    s += R(0, 58, 800, 8, "#aab5bd") + R(0, 78, 800, 8, "#b8c2c9");
    [60, 250, 440, 630].forEach(function (x) { s += R(x, 58, 8, 300, "#aab5bd"); });
    // grond
    s += R(0, 360, 800, 100, "#c9cbc5") + R(0, 358, 800, 5, "#b0b3ad");
    for (var gx = 0; gx < 800; gx += 100) s += L(gx, 363, gx - 30, 460, "#bcbfb9", 1.5);

    // ---- tank ----
    var tk = "#8fb3c9", tkd = "#6f96ae";
    s += R(250, 326, 30, 36, "#7c858c") + R(520, 326, 30, 36, "#7c858c");
    s += R(196, 150, 408, 190, tk, 'rx="95" ry="95"');
    // opengewerkt deel
    s += R(276, 188, 300, 132, "#2f3a42", 'rx="16"');
    s += P("M276,300 L576,300 L576,304 Q576,320 560,320 L292,320 Q276,320 276,304 Z", "#4a5760");
    s += R(276, 188, 300, 132, "none", 'rx="16" stroke="#5d7f95" stroke-width="5"');
    // bovenmangat
    s += R(400, 128, 44, 24, tkd) + R(394, 122, 56, 8, "#5d7f95", 'rx="2"');
    s += G("rotate(-38 450 124)", R(450, 118, 52, 7, "#5d7f95", 'rx="2"')) + C(450, 124, 3, "#44667c");
    // zij-mangat (links)
    s += C(236, 280, 25, "#5d7f95") + C(236, 280, 19, "#1e262b");

    // ---- werkvergunning (goed) ----
    s += R(46, 300, 4, 60, "#666") + R(22, 272, 52, 34, "#ffffff", 'stroke="#1e6fb8" stroke-width="2"');
    s += R(22, 272, 52, 8, "#1e6fb8");
    s += '<text x="48" y="278.5" font-family="Arial,Helvetica,sans-serif" font-size="6" font-weight="700" fill="#ffffff" text-anchor="middle">WERKVERGUNNING</text>';
    s += L(28, 287, 66, 287, "#9aa", 1.5) + L(28, 293, 66, 293, "#9aa", 1.5) + L(28, 299, 54, 299, "#9aa", 1.5);

    // ---- slachtoffer in de tank ----
    s += person({ x: 300, y: 304, s: 0.8, rot: 90, helmet: HELM_WIT,
      legs: [[[-6, -46], [-8, -5]], [[6, -46], [12, -8]]],
      arms: [[[-13, -78], [-20, -64], [-18, -50]], [[13, -78], [20, -92], [16, -108]]] });

    // ---- transformator in de tank ----
    s += R(440, 280, 48, 38, "#7d868d", 'rx="3"') + R(440, 280, 48, 7, "#5f676d") + R(444, 312, 40, 3, "#5f676d");
    s += P("M464,291 l10,17 l-20,0 Z", "#ffd400", 'stroke="#222" stroke-width="1.2"') + P("M464.8,295 l-3,7 l3.5,0 l-3,6", "none", 'stroke="#222" stroke-width="1.3"');
    s += P("M482,282 C490,250 440,200 428,152", "none", 'stroke="#1f1f1f" stroke-width="2.5"');
    s += P("M444,290 C430,280 420,262 404,258", "none", 'stroke="#1f1f1f" stroke-width="2"') + P("M396,252 L412,252 L408,266 L400,266 Z", "#ffd84a");

    // ---- propaanfles in de tank ----
    s += G("translate(540 318)", bottle("#e36a1e", "#d0d4d7", 54));
    s += P("M540,262 C548,272 560,290 548,304 C536,312 520,306 510,300", "none", 'stroke="#222" stroke-width="2"') + R(500, 296, 14, 6, "#555", 'rx="2"');

    // ---- zuurstoffles voor 'ventilatie' ----
    s += G("translate(660 362)", bottle("#2f5f8a", "#ffffff", 72));
    s += '<text x="660" y="330" font-family="Arial,Helvetica,sans-serif" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">O₂</text>';
    s += P("M660,282 C650,200 520,90 430,124 C426,150 420,170 418,196", "none", 'stroke="#1f5a92" stroke-width="3" stroke-linecap="round"');
    s += P("M410,206 l-6,10 M418,208 l0,12 M426,206 l6,10", "none", 'stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"');

    // ---- afsluiter zonder LOTO (boven rechts) ----
    s += R(560, 110, 240, 12, "#9aa3aa") + R(552, 110, 14, 44, "#9aa3aa");
    s += R(682, 102, 28, 28, "#c43d2b", 'rx="3"') + R(678, 108, 36, 16, "#c43d2b", 'rx="2"') + L(696, 102, 696, 88, "#444", 3.5) + E(696, 86, 22, 5, "#c43d2b") + E(696, 85, 16, 2.5, "#e05a46");
    // afsluiter met slot + label (goed, onder rechts)
    s += R(476, 336, 12, 16, "#9aa3aa") + R(436, 344, 52, 10, "#9aa3aa");
    s += R(446, 338, 18, 22, "#c43d2b", 'rx="2"') + L(455, 338, 455, 330, "#444", 3) + E(455, 328, 14, 3.5, "#c43d2b");
    s += R(462, 334, 10, 9, "#d32f2f", 'rx="1.5"') + P("M463.5,334 a3.5,3.5 0 0 1 7,0", "none", 'stroke="#444" stroke-width="1.6"');
    s += R(470, 342, 12, 17, "#ffd400", 'stroke="#aa8f00" stroke-width="0.8"');

    // ---- redder zonder adembescherming ----
    s += person({ x: 196, y: 378, s: 0.95, helmet: HELM_GEEL,
      legs: [[[-6, -46], [-14, -5]], [[6, -46], [12, -24], [18, -8]]],
      arms: [[[-13, -78], [4, -94], [24, -102]], [[13, -78], [28, -88], [34, -96]]] });

    // ---- aggregaat met uitlaatgassen bij mangat ----
    s += R(62, 392, 70, 42, "#d32f2f", 'rx="3"') + R(68, 400, 58, 28, "#2e3338", 'rx="2"') + C(84, 414, 8, "#555") + R(102, 404, 20, 8, "#777");
    s += R(64, 434, 8, 6, "#333") + R(122, 434, 8, 6, "#333");
    s += R(126, 386, 16, 6, "#555") + C(150, 382, 9, "rgba(95,100,105,0.6)") + C(162, 370, 11, "rgba(95,100,105,0.5)") + C(176, 356, 13, "rgba(95,100,105,0.42)") + C(196, 340, 14, "rgba(95,100,105,0.34)") + C(216, 318, 14, "rgba(95,100,105,0.28)") + C(232, 296, 12, "rgba(95,100,105,0.24)");

    // ---- mangatwacht loopt weg, bellend ----
    s += person({ x: 752, y: 446, s: 0.95, helmet: HELM_WIT,
      legs: [[[-6, -46], [-14, -5]], [[6, -46], [14, -5]]],
      arms: [[[-13, -78], [-22, -60], [-28, -50]], [[13, -78], [22, -88], [10, -96]]],
      front: R(6, -102, 6, 11, "#222", 'rx="1.5"') });

    // ---- afzetting (goed) ----
    s += cone(40, 452) + cone(300, 452) + cone(560, 452);

    return s;
  }

  scenes.push({
    id: "besloten-ruimte",
    titel: "Besloten ruimte",
    intro: "Werk in een opengewerkte opslagtank: er is iets misgegaan. Zoek de 7 gevaren.",
    viewBox: "0 0 800 460",
    svg: beslotenRuimte(),
    hazards: [
      { id: "redder", x: 150, y: 258, w: 278, h: 126, titel: "Redden zonder adembescherming",
        uitleg: "Een collega wil zonder adembescherming door het mangat naar binnen om het slachtoffer te redden; grote kans dat hij zelf ook bewusteloos raakt. Sla alarm en ga nooit onbeschermd naar binnen. Redden gebeurt alleen door getrainde hulpverleners met onafhankelijke adembescherming." },
      { id: "aggregaat", x: 44, y: 372, w: 104, h: 76, titel: "Aggregaat bij de ingang",
        uitleg: "Het aggregaat staat vlak bij het mangat en de uitlaatgassen waaien naar binnen. Koolmonoxide (CO) is giftig en je ruikt of ziet het niet. Plaats verbrandingsmotoren ver van ingangen en ventilatie-aanzuiging, zo dat de uitlaatgassen van de ruimte wegwaaien." },
      { id: "transformator", x: 432, y: 262, w: 74, h: 62, titel: "Transformator in de tank",
        uitleg: "De transformator staat binnen in de tank. In een besloten ruimte met geleidende wanden gebruik je veiligheidsspanning (max. 50 V wisselspanning) of een scheidingstransformator met één apparaat, en de transformator staat altijd buiten de ruimte." },
      { id: "propaan", x: 510, y: 232, w: 76, h: 90, titel: "Gasfles in de besloten ruimte",
        uitleg: "Er staat een propaanfles in de tank. Een klein lek geeft in een besloten ruimte al snel explosie- of verstikkingsgevaar. Gasflessen blijven altijd buiten de besloten ruimte; slangen en branders haal je bij pauze en na het werk naar buiten." },
      { id: "zuurstof", x: 622, y: 270, w: 76, h: 96, titel: "Ventileren met zuurstof",
        uitleg: "De tank wordt 'geventileerd' met een zuurstoffles. Zuurstofverrijking maakt kleding en materialen extreem brandbaar: één vonk geeft een steekvlam. Ventileer alleen met schone buitenlucht via een ventilator, nooit met zuivere zuurstof." },
      { id: "loto", x: 656, y: 76, w: 82, h: 60, titel: "Afsluiter niet vergrendeld",
        uitleg: "Op de afsluiter van de toevoerleiding zitten geen slot en geen label. Iemand kan de klep openzetten terwijl er mensen in de tank zijn. Blokkeer alle toevoer (Lock-Out/Tag-Out): afsluiter dicht, slot erop en label met naam, bij voorkeur ook blinderen. De afsluiter onderaan laat zien hoe het hoort." },
      { id: "mangatwacht", x: 708, y: 330, w: 88, h: 124, titel: "Mangatwacht weggelopen",
        uitleg: "De mangatwacht loopt bellend weg van de tank terwijl er iemand binnen is. De mangatwacht blijft continu bij de ingang, houdt contact met wie binnen werkt en slaat alarm bij problemen. Hij gaat zelf nooit naar binnen." }
    ]
  });

  window.VCA_SCENES = scenes;
})();
