/* VCA-VOL oefenapp: veiligheidsborden (ISO 7010-stijl) en CLP/GHS-gevarenpictogrammen.
   Plain script, geen modules. Levert window.VCA_BORDEN = { CAT, SIGNS, svg(id), shape(cat) }.
   Alle SVG's: viewBox 0 0 100 100, geen width/height, vaste kleuren, geen id's/defs/<style>. */
(function () {
  "use strict";

  var RED = "#C8102E", YEL = "#F9B000", INK = "#111", BLUE = "#1B5FAA",
      GREEN = "#1F8A4C", GHSRED = "#E2001A", WHITE = "#fff";

  /* ---------- kleine SVG-helpers ---------- */
  function n(v) { return Math.round(v * 100) / 100; }
  function ol(col, w) { return ' stroke="' + col + '" stroke-width="' + w + '" stroke-linejoin="round"'; }
  function P(d, f, x) { return '<path d="' + d + '" fill="' + f + '"' + (x || "") + "/>"; }
  function S(d, c, w, x) {
    return '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + w +
      '" stroke-linecap="round" stroke-linejoin="round"' + (x || "") + "/>";
  }
  function C(cx, cy, r, f, x) { return '<circle cx="' + n(cx) + '" cy="' + n(cy) + '" r="' + n(r) + '" fill="' + f + '"' + (x || "") + "/>"; }
  function E(cx, cy, rx, ry, f, x) { return '<ellipse cx="' + n(cx) + '" cy="' + n(cy) + '" rx="' + n(rx) + '" ry="' + n(ry) + '" fill="' + f + '"' + (x || "") + "/>"; }
  function R(x, y, w, h, rx, f, xx) {
    return '<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) + '"' +
      (rx ? ' rx="' + n(rx) + '"' : "") + ' fill="' + f + '"' + (xx || "") + "/>";
  }
  function G(t, inner) { return '<g transform="' + t + '">' + inner + "</g>"; }
  function poly(pts) {
    return "M" + pts.map(function (p) { return n(p[0]) + " " + n(p[1]); }).join(" L ") + " Z";
  }
  /* ledematen: eerst een contour in achtergrondkleur, dan de lijn zelf (scheidt overlappende delen) */
  function limbs(list, F, K, gap) {
    var out = "", i;
    if (gap) for (i = 0; i < list.length; i++) out += S(list[i][0], K, list[i][1] + gap);
    for (i = 0; i < list.length; i++) out += S(list[i][0], F, list[i][1]);
    return out;
  }

  /* ---------- herbruikbare symbool-onderdelen (ontworpen in een 100x100-vak) ---------- */
  function flame(F, K, x, y, w, h) {
    var d = "M50 100 C 71 100 86 86 86 66 C 86 50 78 38 73 22 C 67 28 63 35 62 43 C 58 30 50 16 54 0 " +
      "C 40 12 30 27 24 41 C 18 53 14 60 14 68 C 14 86 29 100 50 100 Z";
    var inner = "M50 94 C 38 94 30 86 31 75 C 32 64 42 58 46 46 C 56 56 68 64 68 77 C 68 87 60 94 50 94 Z";
    return G("translate(" + n(x) + " " + n(y) + ") scale(" + n(w / 100) + " " + n(h / 100) + ")", P(d, F) + P(inner, K));
  }

  function bone(x1, y1, x2, y2, w, F) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L;
    var px = -uy * w * 0.55, py = ux * w * 0.55, r = w * 0.62, out = S("M" + n(x1) + " " + n(y1) + " L " + n(x2) + " " + n(y2), F, w);
    [[x1 - ux * w * 0.35, y1 - uy * w * 0.35], [x2 + ux * w * 0.35, y2 + uy * w * 0.35]].forEach(function (e) {
      out += C(e[0] + px, e[1] + py, r, F) + C(e[0] - px, e[1] - py, r, F);
    });
    return out;
  }

  function skull(F, K) {
    return bone(24, 66, 76, 91, 8, F) + bone(76, 66, 24, 91, 8, F) +
      P("M50 5 C 29 5 20 19 20 35 C 20 45 25 52 32 55 L 32 64 C 32 67 34 69 37 69 L 63 69 C 66 69 68 67 68 64 " +
        "L 68 55 C 75 52 80 45 80 35 C 80 19 71 5 50 5 Z", F, ol(K, 3.5)) +
      E(38.5, 36, 8, 9, K) + E(61.5, 36, 8, 9, K) + P("M50 45 L 44.5 54 L 55.5 54 Z", K) +
      S("M43 60 V 69 M50 60 V 69 M57 60 V 69", K, 2.6);
  }

  function exclam(F) {
    return P("M40.5 12 C 40.5 3 59.5 3 59.5 12 L 55 68 C 54.6 71 45.4 71 45 68 Z", F) + C(50, 85, 8.5, F);
  }

  function drop(x, y, s, F) {
    s = s || 1;
    return P("M" + n(x) + " " + n(y - 5 * s) + " C " + n(x + 1.5 * s) + " " + n(y - 2 * s) + " " + n(x + 3.5 * s) + " " + n(y) + " " +
      n(x + 3.5 * s) + " " + n(y + 2 * s) + " A " + n(3.5 * s) + " " + n(3.5 * s) + " 0 0 1 " + n(x - 3.5 * s) + " " + n(y + 2 * s) +
      " C " + n(x - 3.5 * s) + " " + n(y) + " " + n(x - 1.5 * s) + " " + n(y - 2 * s) + " " + n(x) + " " + n(y - 5 * s) + " Z", F);
  }

  function tube(F, cx, cy, ang) {
    /* reageerbuis; open kant = lokaal y -22 */
    return G("translate(" + cx + " " + cy + ") rotate(" + ang + ")",
      S("M-7 -18 L -7 10 A 7 7 0 0 0 7 10 L 7 -18", F, 3.2) + S("M-10 -18 H 10", F, 3.2) +
      P("M-7 -18 L 7 -18 L 7 -6 L -7 -6 Z", F));
  }

  function corrosive(F, K) {
    return tube(F, 27, 25, 135) + tube(F, 73, 25, -135) +
      drop(41, 44, 1, F) + drop(41, 55, 1, F) + drop(59, 44, 1, F) + drop(59, 55, 1, F) +
      /* oppervlak dat wordt aangetast */
      P("M14 66 H 36 C 36 71 38 74 41 74 C 44 74 46 71 46 66 H 47 V 80 H 14 Z", F) +
      /* hand die wordt aangetast */
      P("M53 66 H 54 C 54 71 56 74 59 74 C 62 74 64 71 64 66 H 83 C 87 66 87 71 83 71 H 74 H 85 C 89 71 89 76 85 76 H 74 " +
        "H 82 C 86 76 86 81 82 81 H 60 C 56 81 53 78 53 74 Z", F) +
      S("M74 71 H 80 M74 76 H 78", K, 1.4);
  }

  function bust(F, K, head) {
    /* hoofd + schouders vooraanzicht */
    return P("M15 99 C 15 82 26 73 41 71 L 59 71 C 74 73 85 82 85 99 Z", F) +
      R(42.5, 56, 15, 17, 0, F) + (head === false ? "" : E(50, 42, 17, 21, F));
  }

  function person(F, K, x, y, s) {
    /* staand persoon vooraanzicht in vak van ~40 x 100, schaal s */
    return G("translate(" + x + " " + y + ") scale(" + s + ")",
      C(0, 9, 9, F) + R(-11, 21, 22, 36, 7, F) + R(-10.5, 52, 9.5, 46, 4.7, F) + R(1, 52, 9.5, 46, 4.7, F) +
      R(-19, 22, 8, 36, 4, F) + R(11, 22, 8, 36, 4, F) + S("M0 60 V 98", K, 1.5));
  }

  function star(cx, cy, r1, r2, k, rot) {
    var pts = [], i, a;
    for (i = 0; i < 2 * k; i++) {
      a = (rot || 0) + Math.PI * i / k;
      pts.push([cx + Math.cos(a) * (i % 2 ? r2 : r1), cy + Math.sin(a) * (i % 2 ? r2 : r1)]);
    }
    return poly(pts);
  }

  function arrowTo(x1, y1, x2, y2, w, head, F) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L;
    var bx = x2 - ux * head, by = y2 - uy * head, px = -uy * head * 0.62, py = ux * head * 0.62;
    return S("M" + n(x1) + " " + n(y1) + " L " + n(bx + ux) + " " + n(by + uy), F, w, ' stroke-linecap="butt"') +
      P(poly([[x2, y2], [bx + px, by + py], [bx - px, by - py]]), F);
  }

  /* ---------- symbolen per bord: functie(F = symboolkleur, K = kleur van het vlak) ---------- */
  var SYM = {
    /* ===== VERBOD ===== */
    "v-roken": function (F, K) {
      return R(8, 64, 16, 12, 0, F) + R(26, 64, 42, 12, 0, F) + R(70, 64, 10, 12, 0, F) +
        S("M75 56 C 67 48 83 42 76 32 C 70 24 82 18 76 8", F, 4.5);
    },
    "v-vuur": function (F, K) {
      return R(45.5, 50, 9, 46, 2, F) + E(50, 50, 8, 10, F) + flame(F, K, 33, 2, 34, 38);
    },
    "v-voetgangers": function (F, K) {
      return C(55, 11, 9, F) + limbs([
        ["M53 27 L 47 55", 13],
        ["M53 30 L 63 44 L 72 50", 8], ["M51 30 L 41 44 L 35 56", 8],
        ["M47 55 L 58 73 L 62 93", 10], ["M47 55 L 40 74 L 28 90", 10]
      ], F, K, 0);
    },
    "v-water": function (F, K) {
      return G("translate(70 27) rotate(-118) scale(1.05)",
        P("M-15 -18 L 15 -18 L 11 17 C 11 19 10 20 8 20 L -8 20 C -10 20 -11 19 -11 17 Z", F) +
        S("M-15 -18 C -15 -34 15 -34 15 -18", F, 3)) +
        S("M52 36 C 46 40 42 46 40 52 M56 42 C 51 46 48 51 47 56 M48 32 C 42 35 37 40 34 46", F, 3, ' stroke-dasharray="4 3.5"') +
        flame(F, K, 16, 56, 38, 40);
    },
    "v-onbevoegden": function (F, K) {
      return C(44, 12, 9.5, F) + R(33, 25, 22, 36, 7, F) +
        R(33.5, 56, 9.5, 40, 4.7, F) + R(45, 56, 9.5, 40, 4.7, F) + S("M44 62 V 96", K, 1.5) +
        R(24, 26, 8, 34, 4, F) +
        S("M55 32 L 66 22 L 66 10", F, 8) +
        P("M60 12 L 60 0 C 60 -2 63 -2 63 0 L 63 -4 C 63 -6 66 -6 66 -4 L 66 -3 C 66 -5 69 -5 69 -3 L 69 1 C 69 -1 72 -1 72 1 L 72 12 C 72 16 68 18 66 18 C 62 18 60 16 60 12 Z", F);
    },
    "v-telefoon": function (F, K) {
      var keys = "", r, c;
      for (r = 0; r < 4; r++) for (c = 0; c < 3; c++) keys += R(35 + c * 7, 54 + r * 7, 5, 4, 1, K);
      return R(30, 16, 30, 74, 6, F) + R(34.5, 26, 21, 22, 2, K) + R(40, 20, 10, 2.6, 1.3, K) + keys +
        S("M61.4 10.1 A 8 8 0 0 1 67.9 19.4", F, 3.6) + S("M62.6 2.2 A 15 15 0 0 1 74.8 20.6", F, 3.6);
    },

    /* ===== WAARSCHUWING ===== */
    "w-algemeen": function (F) { return exclam(F); },
    "w-elektrisch": function (F) {
      return P("M54 2 L 66 2 L 50 42 L 64 40 L 48 79 L 56 82 L 37 99 L 38 73 L 44 76 L 54 50 L 40 52 Z", F);
    },
    "w-brandgevaarlijk": function (F, K) { return flame(F, K, 24, 2, 52, 82) + R(20, 88, 60, 8, 0, F); },
    "w-giftig": function (F, K) { return G("translate(50 60) scale(0.9) translate(-50 -60)", skull(F, K)); },
    "w-bijtend": function (F, K) { return G("translate(50 64) scale(0.9) translate(-50 -64)", corrosive(F, K)); },
    "w-hangende-last": function (F, K) {
      return S("M50 0 V 16", F, 4) + R(44, 14, 12, 8, 2, F) +
        S("M50 22 V 34 C 50 42 40 43 38 36", F, 5) +
        S("M50 36 L 26 62 M50 36 L 74 62", F, 3.5) + C(50, 36, 3.5, F) +
        R(18, 62, 64, 34, 1.5, F);
    },
    "w-radioactief": function (F, K) {
      var out = C(50, 60, 8, F), k, a1, a2, r1 = 13, r2 = 38;
      for (k = 0; k < 3; k++) {
        var a = (-150 + k * 120) * Math.PI / 180;
        a1 = a - Math.PI / 6; a2 = a + Math.PI / 6;
        out += P("M" + n(50 + r1 * Math.cos(a1)) + " " + n(60 + r1 * Math.sin(a1)) +
          " L " + n(50 + r2 * Math.cos(a1)) + " " + n(60 + r2 * Math.sin(a1)) +
          " A " + r2 + " " + r2 + " 0 0 1 " + n(50 + r2 * Math.cos(a2)) + " " + n(60 + r2 * Math.sin(a2)) +
          " L " + n(50 + r1 * Math.cos(a2)) + " " + n(60 + r1 * Math.sin(a2)) +
          " A " + r1 + " " + r1 + " 0 0 0 " + n(50 + r1 * Math.cos(a1)) + " " + n(60 + r1 * Math.sin(a1)) + " Z", F);
      }
      return out;
    },
    "w-explosief": function (F) {
      return P("M12 44 H 44 V 53 H 23 V 62.5 H 41 V 71.5 H 23 V 81 H 44 V 90 H 12 Z", F) +
        P("M49 44 H 61 L 69 59 L 77 44 H 89 L 75 67 L 89 90 H 77 L 69 75 L 61 90 H 49 L 63 67 Z", F);
    },
    "w-heftruck": function (F, K) {
      return G("translate(50 60) scale(0.95) translate(-50 -60)", P("M6 84 V 62 C 6 57 9 54 14 54 H 60 V 84 Z", F) +
        S("M24 54 L 28 26 H 62", F, 4) +
        C(43, 33, 6, F) + S("M42 42 L 40 54 M42 44 L 52 48", F, 6) +
        R(60, 14, 7, 72, 0, F) +
        P("M70 40 H 75 V 80 H 97 V 86 H 70 Z", F) +
        C(20, 84, 11, F, ol(K, 3)) + C(20, 84, 3.5, K) + C(52, 86, 9, F, ol(K, 3)) + C(52, 86, 3, K));
    },
    "w-struikelen": function (F, K) {
      return R(2, 92, 96, 4, 0, F) + R(44, 78, 18, 14, 1, F) +
        C(78, 28, 8.5, F) + limbs([
          ["M68 41 L 48 62", 13],
          ["M69 43 L 82 52 L 92 62", 8], ["M66 44 L 72 60 L 82 72", 8],
          ["M48 62 L 38 74 L 44 80", 10], ["M48 62 L 32 64 L 16 56", 10]
        ], F, K, 0);
    },
    "w-laser": function (F) {
      return P(star(64, 54, 32, 11, 12, 0), F) + R(4, 51, 60, 6, 0, F);
    },

    /* ===== GEBOD ===== */
    "g-helm": function (F, K) {
      return bust(F, K) +
        P("M30 36 C 30 19 38 9 50 9 C 62 9 70 19 70 36 Z", F, ol(K, 3)) +
        R(25, 33, 50, 7.5, 3, F, ol(K, 3));
    },
    "g-gehoor": function (F, K) {
      return bust(F, K) +
        S("M29 42 C 26 12 74 12 71 42", K, 11) + S("M29 42 C 26 12 74 12 71 42", F, 5) +
        R(22, 32, 13, 24, 5, F, ol(K, 3)) + R(65, 32, 13, 24, 5, F, ol(K, 3));
    },
    "g-oog": function (F, K) {
      return bust(F, K) +
        R(29, 32, 42, 16, 7, F, ol(K, 3)) + R(33.5, 35.5, 14.5, 9, 4, K) + R(52, 35.5, 14.5, 9, 4, K);
    },
    "g-schoenen": function (F, K) {
      return P("M20 8 H 50 V 52 C 50 57 54 60 60 62 L 80 69 C 89 72 92 78 92 84 V 86 H 13 C 12 70 20 56 20 40 Z", F) +
        R(12, 88, 81, 7, 2, F) + S("M66 66 C 75 70 79 77 79 86", K, 2.5);
    },
    "g-handschoenen": function (F, K) {
      return R(33, 18, 11, 42, 5.5, F, ol(K, 2)) + R(44.5, 10, 11, 48, 5.5, F, ol(K, 2)) +
        R(56, 14, 11, 44, 5.5, F, ol(K, 2)) + R(67.5, 24, 10, 36, 5, F, ol(K, 2)) +
        G("rotate(-40 38 70)", R(14, 64, 30, 12, 6, F)) +
        R(33, 44, 45, 34, 8, F) +
        R(34, 81, 43, 15, 2, F);
    },
    "g-adem": function (F, K) {
      return bust(F, K) +
        E(43, 35, 3.4, 2.4, K) + E(57, 35, 3.4, 2.4, K) +
        S("M34 50 L 33 43 M66 50 L 67 43", K, 2.5) +
        P("M36 47 C 42 42 58 42 64 47 L 62 58 C 58 65 42 65 38 58 Z", F, ol(K, 3)) +
        C(39, 61, 8, F, ol(K, 3)) + C(61, 61, 8, F, ol(K, 3)) + C(39, 61, 3.5, K) + C(61, 61, 3.5, K);
    },
    "g-valbeveiliging": function (F, K) {
      return S("M58 30 C 70 22 76 14 78 7", F, 3.5) + C(80, 5, 4.5, "none", ol(F, 3)) +
        C(50, 13, 9, F) + R(39, 25, 22, 36, 7, F) +
        R(39.5, 56, 9.5, 42, 4.7, F) + R(51, 56, 9.5, 42, 4.7, F) + S("M50 62 V 98", K, 1.5) +
        R(30, 26, 8, 34, 4, F) + R(62, 26, 8, 34, 4, F) +
        S("M43 26 L 47 58 M57 26 L 53 58 M40 45 H 60 M39 60 C 42 66 48 66 50 60 C 52 66 58 66 61 60", K, 2.4) +
        C(50, 29, 3, K);
    },
    "g-signaalkleding": function (F, K) {
      return P("M28 8 H 40 L 50 36 L 60 8 H 72 C 72 24 76 32 86 36 V 94 H 14 V 36 C 24 32 28 24 28 8 Z", F) +
        R(14, 60, 72, 5, 0, K) + R(14, 74, 72, 5, 0, K) + S("M50 36 V 94", K, 2) +
        R(32, 8, 4, 86, 0, K) + R(64, 8, 4, 86, 0, K);
    },

    /* ===== REDDING ===== */
    "r-nooduitgang": function (F, K) {
      return P("M62 6 H 95 V 94 H 89 V 12 H 68 V 94 H 62 Z", F) +
        C(51, 16, 8.5, F, ol(K, 3)) + limbs([
          ["M45 31 L 33 56", 13],
          ["M45 33 L 57 42 L 67 36", 8], ["M43 33 L 30 40 L 22 32", 8],
          ["M33 56 L 50 64 L 53 84", 10], ["M33 56 L 25 74 L 8 78", 10]
        ], F, K, 5);
    },
    "r-ehbo": function (F) { return R(37, 14, 26, 72, 0, F) + R(14, 37, 72, 26, 0, F); },
    "r-verzamelplaats": function (F, K) {
      var ar = "", k;
      for (k = 0; k < 4; k++) ar += G("rotate(" + (k * 90) + " 50 50)", arrowTo(6, 6, 28, 28, 5, 11, F));
      return ar +
        C(37, 44, 5.5, F) + R(31, 51, 12, 22, 4, F) +
        C(63, 44, 5.5, F) + R(57, 51, 12, 22, 4, F) +
        C(50, 40, 6.5, F, ol(K, 2.5)) + R(43, 48, 14, 28, 4.5, F, ol(K, 2.5)) + S("M50 62 V 76", K, 1.5);
    },
    "r-oogdouche": function (F, K) {
      return P("M12 96 C 12 76 22 64 34 60 L 44 60 C 46 72 52 84 58 96 Z", F) +
        P("M26 32 C 26 18 38 10 50 12 C 62 14 70 24 70 36 L 76 46 C 77 48 76 49 74 49 L 70 49 L 70 54 C 70 58 67 60 63 60 L 40 60 C 31 58 26 46 26 32 Z", F) +
        E(59, 34, 3.5, 3.5, K) +
        R(76, 80, 10, 16, 1, F) + R(72, 76, 18, 6, 2, F) +
        S("M78 74 C 78 60 72 48 62 40", F, 3, ' stroke-dasharray="5 4"') +
        S("M86 74 C 88 58 82 44 66 36", F, 3, ' stroke-dasharray="5 4"');
    },
    "r-nooddouche": function (F, K) {
      return S("M8 8 H 50 V 16", F, 5) + P("M36 26 H 64 L 57 16 H 43 Z", F) +
        S("M40 31 L 38 38 M50 31 V 38 M60 31 L 62 38 M36 42 L 34 48 M64 42 L 66 48", F, 3) +
        person(F, K, 50, 42, 0.55);
    },
    "r-aed": function (F, K) {
      return P("M46 94 C 28 80 8 66 8 44 C 8 30 18 22 30 22 C 38 22 43 26 46 32 C 49 26 54 22 62 22 C 74 22 84 30 84 44 " +
        "C 84 66 64 80 46 94 Z", F) +
        P("M52 32 L 36 60 H 46 L 40 82 L 60 52 H 49 L 57 32 Z", K) +
        R(81, 4, 6, 20, 0, F) + R(74, 11, 20, 6, 0, F);
    },

    /* ===== BRAND ===== */
    "b-blusser": function (F, K) {
      return flame(F, K, 4, 2, 26, 36) +
        R(48, 34, 26, 62, 9, F) + R(55, 24, 12, 12, 1, F) +
        S("M64 26 L 82 18", F, 4) + S("M56 28 C 42 28 36 36 36 50 V 70", F, 4.5) + R(32, 68, 8, 14, 2, F);
    },
    "b-slanghaspel": function (F, K) {
      return flame(F, K, 4, 2, 26, 36) +
        C(52, 54, 32, F) + C(52, 54, 24, "none", ol(K, 2.5)) + C(52, 54, 16, "none", ol(K, 2.5)) + C(52, 54, 6, K) +
        S("M84 54 C 90 62 90 76 88 84", F, 5) + R(83, 82, 10, 14, 2, F);
    },
    "b-melder": function (F, K) {
      return flame(F, K, 4, 2, 26, 36) +
        R(40, 20, 52, 52, 5, "none", ol(F, 6)) + C(66, 46, 9, F) +
        G("translate(46 68) rotate(40)",
          R(-5, -26, 10, 30, 5, F, ol(K, 3)) + R(-14, -8, 30, 28, 8, F, ol(K, 3)) + R(-5, -26, 10, 30, 5, F) +
          S("M6 -2 V 8 M11 0 V 8", K, 1.8) + R(-12, 22, 26, 16, 2, F, ol(K, 3)));
    },
    "b-telefoon": function (F, K) {
      return flame(F, K, 4, 2, 26, 36) +
        P("M40 30 C 38 26 42 22 46 23 L 55 26 C 59 28 60 32 58 36 L 53 45 C 57 58 65 66 76 71 L 84 66 C 88 64 92 65 93 69 " +
          "L 96 78 C 97 83 93 87 89 87 C 60 86 40 62 40 30 Z", F);
    },

    /* ===== GHS ===== */
    ghs01: function (F, K) {
      var frags = [
        [[22, 26], [30, 22], [31, 30], [25, 32]], [[72, 20], [80, 24], [76, 31]], [[10, 50], [18, 45], [19, 53]],
        [[84, 44], [92, 50], [84, 54]], [[46, 6], [54, 4], [53, 12], [47, 13]]
      ].map(function (t) { return P(poly(t), F); }).join("");
      var burst = [], i, rr = [34, 26, 36, 28, 33, 25, 35, 27, 32, 26, 34];
      for (i = 0; i < 11; i++) {
        var a = Math.PI + Math.PI * (i + 0.5) / 11 - 0.25, b = a + Math.PI / 22 * 1.0;
        burst.push([50 + Math.cos(a) * 17, 56 + Math.sin(a) * 17]);
        burst.push([50 + Math.cos(b) * rr[i], 56 + Math.sin(b) * rr[i]]);
      }
      return P(poly(burst), F) + C(50, 56, 18, F) + frags +
        P("M27 70 L 34 62 L 40 68 L 47 60 L 53 67 L 60 60 L 66 67 L 73 64 L 73 70 A 23 23 0 0 1 27 70 Z", F, ol(K, 2));
    },
    ghs02: function (F, K) { return flame(F, K, 22, 4, 56, 78) + R(24, 86, 52, 6, 0, F); },
    ghs03: function (F, K) {
      return C(50, 62, 18, "none", ol(F, 9)) + flame(F, K, 31, 2, 38, 52) + R(24, 88, 52, 6, 0, F);
    },
    ghs04: function (F, K) {
      return G("rotate(-30 50 50)",
        P("M26 34 H 62 C 70 34 76 40 78 46 H 82 V 54 H 78 C 76 60 70 66 62 66 H 26 C 17 66 10 59 10 50 C 10 41 17 34 26 34 Z", F) +
        R(81, 42, 9, 16, 2, F) + S("M22 42 H 62", K, 2.5));
    },
    ghs05: function (F, K) { return corrosive(F, K); },
    ghs06: function (F, K) { return skull(F, K); },
    ghs07: function (F) { return exclam(F); },
    ghs08: function (F, K) {
      return P("M18 90 C 18 72 30 64 42 62 L 58 62 C 70 64 82 72 82 90 Z", F) + R(43, 50, 14, 14, 0, F) +
        E(50, 38, 14, 17, F) + P(star(50, 76, 11, 4.5, 8, -Math.PI / 2), K);
    },
    ghs09: function (F, K) {
      return P("M24 84 L 27 50 L 14 38 L 16 35 L 27.5 45 L 29 24 L 20 12 L 23 10 L 30 18 L 32 8 L 35 8 L 33 30 L 44 20 L 46 23 " +
        "L 33 36 L 32 54 L 44 46 L 46 49 L 32 60 L 31 84 Z", F) +
        P("M42 70 C 50 57 72 57 80 70 C 72 81 50 81 42 70 Z", F) + P("M78 70 L 91 60 L 88 70 L 91 80 Z", F) +
        P("M56 76 L 66 76 L 61 84 Z", F) +
        S("M48 66 L 53 71 M53 66 L 48 71", K, 1.8) +
        R(14, 84, 72, 4, 0, F);
    }
  };

  /* ---------- lijst met borden ---------- */
  var SIGNS = [
    /* verbod */
    { id: "v-roken", cat: "verbod", naam: "Roken verboden",
      uitleg: "Hangt bij opslag van brandbare stoffen, in gebouwen en bij tankplaatsen. Je mag hier niet roken, ook geen e-sigaret." },
    { id: "v-vuur", cat: "verbod", naam: "Vuur, open vlam en roken verboden",
      uitleg: "Hangt waar brandbare of explosieve stoffen zijn. Geen aansteker, lucifer, lasbrander of sigaret; vaak is ook vonkend werk verboden zonder vergunning." },
    { id: "v-voetgangers", cat: "verbod", naam: "Verboden voor voetgangers",
      uitleg: "Hangt bij rijroutes van heftrucks en ander verkeer. Loop hier niet, gebruik de aangegeven looproute." },
    { id: "v-water", cat: "verbod", naam: "Niet blussen met water",
      uitleg: "Hangt bij elektrische installaties en stoffen die heftig reageren met water (zoals natrium of brandende olie). Gebruik een ander blusmiddel, bijvoorbeeld CO2 of poeder." },
    { id: "v-onbevoegden", cat: "verbod", naam: "Geen toegang voor onbevoegden",
      uitleg: "Hangt bij afgeschermde ruimtes zoals schakelruimtes of werkterreinen. Je mag alleen naar binnen als je daar toestemming of een opdracht voor hebt." },
    { id: "v-telefoon", cat: "verbod", naam: "Mobiele telefoon verboden",
      uitleg: "Hangt in explosiegevaarlijke zones en bij gevoelige apparatuur. Zet je telefoon uit; een telefoon kan een vonk geven of storing veroorzaken." },

    /* waarschuwing */
    { id: "w-algemeen", cat: "waarschuwing", naam: "Algemeen gevaar",
      uitleg: "Waarschuwt voor een gevaar waar geen eigen bord voor is. Meestal hangt er een onderbord bij dat zegt wat het gevaar is." },
    { id: "w-elektrisch", cat: "waarschuwing", naam: "Gevaar: elektrische spanning",
      uitleg: "Hangt op schakelkasten, verdeelkasten en transformatoren. Niet openen of aanraken als je daar niet voor bevoegd bent." },
    { id: "w-brandgevaarlijk", cat: "waarschuwing", naam: "Brandgevaarlijke stoffen",
      uitleg: "Hangt bij opslag van bijvoorbeeld benzine, verf of gasflessen. Houd vuur, vonken en hitte uit de buurt." },
    { id: "w-giftig", cat: "waarschuwing", naam: "Giftige stoffen",
      uitleg: "Hangt waar giftige stoffen worden opgeslagen of gebruikt. Niet eten, drinken of roken en draag de voorgeschreven PBM." },
    { id: "w-bijtend", cat: "waarschuwing", naam: "Bijtende stoffen",
      uitleg: "Hangt bij zuren en logen, zoals accuzuur of ontkalker. Deze stoffen tasten huid, ogen en materialen aan; draag handschoenen en een bril." },
    { id: "w-hangende-last", cat: "waarschuwing", naam: "Hangende last",
      uitleg: "Hangt waar met een kraan of takel wordt gehesen. Loop of sta nooit onder een hangende last." },
    { id: "w-radioactief", cat: "waarschuwing", naam: "Radioactieve stoffen / ioniserende straling",
      uitleg: "Hangt bij bronnen voor bijvoorbeeld röntgenonderzoek van lasnaden of niveaumeting. Blijf buiten de afgezette zone." },
    { id: "w-explosief", cat: "waarschuwing", naam: "Explosiegevaarlijke omgeving (Ex)",
      uitleg: "Hangt bij de ingang van een ATEX-zone, waar gas, damp of stof een explosief mengsel kan vormen. Gebruik alleen goedgekeurd (Ex-)gereedschap en geen open vuur." },
    { id: "w-heftruck", cat: "waarschuwing", naam: "Transportvoertuigen (heftrucks)",
      uitleg: "Hangt in magazijnen en op terreinen waar heftrucks rijden. Let goed op, maak oogcontact met de bestuurder en blijf op het looppad." },
    { id: "w-struikelen", cat: "waarschuwing", naam: "Struikelgevaar",
      uitleg: "Hangt bij drempels, kabels of obstakels op de vloer. Kijk waar je loopt en houd je werkplek opgeruimd." },
    { id: "w-laser", cat: "waarschuwing", naam: "Laserstraal",
      uitleg: "Hangt waar met lasers wordt gemeten of gesneden. Kijk nooit in de straal; die kan je ogen blijvend beschadigen." },

    /* gebod */
    { id: "g-helm", cat: "gebod", naam: "Veiligheidshelm verplicht",
      uitleg: "Hangt op bouwplaatsen en waar dingen kunnen vallen. Draag een goedgekeurde helm, goed afgesteld op je hoofd." },
    { id: "g-gehoor", cat: "gebod", naam: "Gehoorbescherming verplicht",
      uitleg: "Hangt waar het geluid 85 dB(A) of meer is. Draag oorkappen of oordoppen, ook als het maar even is." },
    { id: "g-oog", cat: "gebod", naam: "Oogbescherming verplicht",
      uitleg: "Hangt bij slijpen, boren en werken met chemicaliën. Draag een veiligheidsbril of ruimzichtbril." },
    { id: "g-schoenen", cat: "gebod", naam: "Veiligheidsschoenen verplicht",
      uitleg: "Hangt op bouwplaatsen en in werkplaatsen. Veiligheidsschoenen hebben een stalen of kunststof neus en vaak een anti-doorstapzool." },
    { id: "g-handschoenen", cat: "gebod", naam: "Veiligheidshandschoenen verplicht",
      uitleg: "Hangt waar je handen kunnen worden gesneden, verbrand of in contact komen met stoffen. Kies handschoenen die passen bij het gevaar." },
    { id: "g-adem", cat: "gebod", naam: "Adembescherming verplicht",
      uitleg: "Hangt waar stof, dampen of gassen in de lucht kunnen zijn. Draag het juiste masker of filter, goed aansluitend op je gezicht." },
    { id: "g-valbeveiliging", cat: "gebod", naam: "Valbeveiliging (harnasgordel) verplicht",
      uitleg: "Hangt bij werken op hoogte zonder vaste randbeveiliging. Draag een harnasgordel en haak je vast aan een sterk ankerpunt." },
    { id: "g-signaalkleding", cat: "gebod", naam: "Signaalkleding verplicht",
      uitleg: "Hangt op terreinen met verkeer of rijdend materieel. Draag een veiligheidsvest of signaalkleding zodat je goed zichtbaar bent." },

    /* redding */
    { id: "r-nooduitgang", cat: "redding", naam: "Nooduitgang",
      uitleg: "Wijst de uitgang die je bij een ontruiming gebruikt. Houd nooduitgangen en vluchtroutes altijd vrij." },
    { id: "r-ehbo", cat: "redding", naam: "Eerste hulp (EHBO)",
      uitleg: "Hier vind je EHBO-middelen of een EHBO-post. Weet waar hij is voordat er iets gebeurt." },
    { id: "r-verzamelplaats", cat: "redding", naam: "Verzamelplaats",
      uitleg: "Hier verzamel je bij een ontruiming, zodat gecontroleerd kan worden of iedereen buiten is. Ga er direct naartoe en blijf daar." },
    { id: "r-oogdouche", cat: "redding", naam: "Oogdouche",
      uitleg: "Hangt bij werkplekken met chemicaliën. Spoel bij een spat in je oog direct en lang (minstens 15 minuten) met water." },
    { id: "r-nooddouche", cat: "redding", naam: "Nooddouche",
      uitleg: "Hangt bij werkplekken met gevaarlijke stoffen. Spoel een besmet of verbrand lichaam direct en langdurig af; trek besmette kleding uit." },
    { id: "r-aed", cat: "redding", naam: "AED",
      uitleg: "Hier hangt een AED (automatische externe defibrillator) voor reanimatie bij een hartstilstand. Het apparaat geeft zelf gesproken aanwijzingen." },

    /* brand */
    { id: "b-blusser", cat: "brand", naam: "Brandblusser",
      uitleg: "Hier hangt een draagbaar blustoestel. Kijk op het etiket voor welke brandklassen hij geschikt is." },
    { id: "b-slanghaspel", cat: "brand", naam: "Brandslanghaspel",
      uitleg: "Hier hangt een brandslang met water. Niet gebruiken bij elektrische installaties of brandende vloeistoffen." },
    { id: "b-melder", cat: "brand", naam: "Brandmelder (handmelder)",
      uitleg: "Hier kun je handmatig brandalarm geven door het ruitje in te drukken. Doe dit meteen als je brand ontdekt." },
    { id: "b-telefoon", cat: "brand", naam: "Telefoon voor brandalarm",
      uitleg: "Hier staat een telefoon om brand of een noodsituatie te melden. Volg het noodnummer dat erbij staat." },

    /* ghs */
    { id: "ghs01", cat: "ghs", naam: "Ontplofbaar (GHS01)",
      uitleg: "Stoffen die kunnen ontploffen door vuur, schokken of wrijving, zoals explosieven, vuurwerk en sommige organische peroxiden." },
    { id: "ghs02", cat: "ghs", naam: "Ontvlambaar (GHS02)",
      uitleg: "Stoffen die makkelijk vlam vatten, zoals benzine, aceton, spiritus, thinner en spuitbussen. Weg van vuur, vonken en hitte." },
    { id: "ghs03", cat: "ghs", naam: "Oxiderend (GHS03)",
      uitleg: "Stoffen die een brand heftiger maken doordat ze zuurstof afgeven, zoals zuivere zuurstof, waterstofperoxide en nitraten. Niet opslaan bij brandbare stoffen." },
    { id: "ghs04", cat: "ghs", naam: "Gassen onder druk (GHS04)",
      uitleg: "Gasflessen met bijvoorbeeld zuurstof, acetyleen, propaan, stikstof of CO2. Kan ontploffen bij verhitting; koud vloeibaar gas kan bevriezing geven." },
    { id: "ghs05", cat: "ghs", naam: "Bijtend (GHS05)",
      uitleg: "Stoffen die huid, ogen en metaal aantasten, zoals zoutzuur, zwavelzuur (accuzuur), natronloog en ontstopper. Draag handschoenen en oogbescherming." },
    { id: "ghs06", cat: "ghs", naam: "Acuut giftig (GHS06)",
      uitleg: "Een kleine hoeveelheid kan al dodelijk zijn bij inademen, inslikken of via de huid, zoals methanol, cyaniden en sommige bestrijdingsmiddelen." },
    { id: "ghs07", cat: "ghs", naam: "Schadelijk / irriterend (GHS07)",
      uitleg: "Stoffen die irriteren, allergie geven, bedwelmen of schadelijk zijn, zoals sommige schoonmaakmiddelen, lijmen en verdunners." },
    { id: "ghs08", cat: "ghs", naam: "Ernstig gevaar voor de gezondheid (GHS08)",
      uitleg: "Stoffen met gevolgen op lange termijn: kankerverwekkend, schadelijk voor de voortplanting of longen, zoals benzeen, isocyanaten en terpentine." },
    { id: "ghs09", cat: "ghs", naam: "Milieugevaarlijk (GHS09)",
      uitleg: "Stoffen die giftig zijn voor planten en waterdieren, zoals bestrijdingsmiddelen, diesel en sommige verven. Nooit in de bodem of het riool laten komen." }
  ];

  var CAT = {
    verbod: { naam: "Verbod", vorm: "Rond, rode rand en rode schuine balk, wit vlak, zwart symbool", betekenis: "Dit mag niet." },
    waarschuwing: { naam: "Waarschuwing", vorm: "Driehoek met zwarte rand, geel vlak, zwart symbool", betekenis: "Let op: hier is gevaar." },
    gebod: { naam: "Gebod", vorm: "Rond, blauw vlak, wit symbool", betekenis: "Dit moet: verplicht voor iedereen hier." },
    redding: { naam: "Redding & EHBO", vorm: "Vierkant of rechthoek, groen vlak, wit symbool", betekenis: "Hier vind je een veilige vluchtweg, uitgang of eerste hulp." },
    brand: { naam: "Brandbestrijding", vorm: "Vierkant of rechthoek, rood vlak, wit symbool", betekenis: "Hier vind je blusmiddelen of een brandmelder." },
    ghs: { naam: "Gevaarlijke stoffen (CLP)", vorm: "Ruit met rode rand, wit vlak, zwart symbool", betekenis: "Etiket op verpakking van gevaarlijke stoffen: het symbool toont het soort gevaar." }
  };

  /* ---------- vormen per categorie ---------- */
  var SQ3 = Math.sqrt(3);
  function triPts(cy, r) { return [[50, cy - 2 * r], [50 - SQ3 * r, cy + r], [50 + SQ3 * r, cy + r]]; }

  var FRAME = {
    verbod: { F: INK, K: WHITE, sc: 0.6, cx: 50, cy: 50,
      bg: function () { return C(50, 50, 47, RED) + C(50, 50, 38.5, WHITE); },
      fg: function () { return S("M21.8 21.8 L 78.2 78.2", RED, 7.5, ' stroke-linecap="butt"'); } },
    waarschuwing: { F: INK, K: YEL, sc: 0.5, cx: 50, cy: 60,
      bg: function () {
        return P(poly(triPts(63, 26.5)), INK, ol(INK, 6)) + P(poly(triPts(63, 21.5)), YEL, ol(YEL, 2));
      } },
    gebod: { F: WHITE, K: BLUE, sc: 0.64, cx: 50, cy: 50,
      bg: function () { return C(50, 50, 47, BLUE); } },
    redding: { F: WHITE, K: GREEN, sc: 0.76, cx: 50, cy: 50,
      bg: function () { return R(3, 3, 94, 94, 7, GREEN); } },
    brand: { F: WHITE, K: RED, sc: 0.76, cx: 50, cy: 50,
      bg: function () { return R(3, 3, 94, 94, 7, RED); } },
    ghs: { F: INK, K: WHITE, sc: 0.56, cx: 50, cy: 50,
      bg: function () {
        return P("M50 2 L 98 50 L 50 98 L 2 50 Z", GHSRED) + P("M50 10.5 L 89.5 50 L 50 89.5 L 10.5 50 Z", WHITE);
      } }
  };

  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function wrap(label, body) {
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(label) + '">' + body + "</svg>";
  }

  var BYID = {};
  SIGNS.forEach(function (s) { BYID[s.id] = s; });
  var cache = {};

  function svg(id) {
    if (cache[id]) return cache[id];
    var s = BYID[id];
    if (!s) return wrap("Onbekend bord", "");
    var f = FRAME[s.cat], sym = SYM[id] ? SYM[id](f.F, f.K) : "";
    var t = "translate(" + n(f.cx - 50 * f.sc) + " " + n(f.cy - 50 * f.sc) + ") scale(" + f.sc + ")";
    return (cache[id] = wrap(s.naam, f.bg() + G(t, sym) + (f.fg ? f.fg() : "")));
  }

  function shape(cat) {
    var f = FRAME[cat];
    if (!f) return wrap("Onbekende categorie", "");
    return wrap((CAT[cat] ? CAT[cat].naam : cat), f.bg() + (f.fg ? f.fg() : ""));
  }

  window.VCA_BORDEN = { CAT: CAT, SIGNS: SIGNS, svg: svg, shape: shape };
})();
