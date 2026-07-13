function ws(t) {
  if (typeof t != "string" || t[0] !== "#")
    throw new Error(`Invalid hex color: ${t}`);
  let e, n, o, s;
  const r = t.slice(1);
  if (r.length === 3)
    e = parseInt(r[0] + r[0], 16), n = parseInt(r[1] + r[1], 16), o = parseInt(r[2] + r[2], 16), s = 255;
  else if (r.length === 4)
    e = parseInt(r[0] + r[0], 16), n = parseInt(r[1] + r[1], 16), o = parseInt(r[2] + r[2], 16), s = parseInt(r[3] + r[3], 16);
  else if (r.length === 6)
    e = parseInt(r.slice(0, 2), 16), n = parseInt(r.slice(2, 4), 16), o = parseInt(r.slice(4, 6), 16), s = 255;
  else if (r.length === 8)
    e = parseInt(r.slice(0, 2), 16), n = parseInt(r.slice(2, 4), 16), o = parseInt(r.slice(4, 6), 16), s = parseInt(r.slice(6, 8), 16);
  else
    throw new Error(`Invalid hex color length: ${t}`);
  if ([e, n, o, s].some((i) => isNaN(i)))
    throw new Error(`Invalid hex color: ${t}`);
  return { blue: o, green: n, red: e, alpha: s };
}
function bs(t) {
  const e = (t.red & 255).toString(16).padStart(2, "0"), n = (t.green & 255).toString(16).padStart(2, "0"), o = (t.blue & 255).toString(16).padStart(2, "0");
  if (t.alpha === 255 || t.alpha === void 0)
    return `#${e}${n}${o}`;
  const s = (t.alpha & 255).toString(16).padStart(2, "0");
  return `#${e}${n}${o}${s}`;
}
function Ys(t) {
  if (!Array.isArray(t))
    throw new Error("Palette must be an array of colors");
  return t.map((e) => {
    if (typeof e == "string")
      return ws(e), el(e);
    if (e && typeof e == "object" && "red" in e)
      return bs(e);
    throw new Error(`Invalid palette color: ${e}`);
  });
}
function el(t) {
  return bs(ws(t));
}
function nl(t) {
  if (!t || typeof t != "object")
    throw new Error("createColorGlyph: input object is required");
  if (!t.name)
    throw new Error("createColorGlyph: name is required");
  if (!t.layers && !t.paint)
    throw new Error(
      "createColorGlyph: either layers (v0) or paint (v1) is required"
    );
  const e = { name: t.name };
  if (t.layers) {
    if (!Array.isArray(t.layers) || t.layers.length === 0)
      throw new Error("createColorGlyph: layers must be a non-empty array");
    e.layers = t.layers.map((n) => {
      if (!n.glyph)
        throw new Error("createColorGlyph: each layer needs a glyph name");
      if (n.paletteIndex == null)
        throw new Error("createColorGlyph: each layer needs a paletteIndex");
      return { glyph: n.glyph, paletteIndex: n.paletteIndex };
    });
  } else
    e.paint = t.paint;
  return e;
}
function ol(t) {
  const e = /* @__PURE__ */ new Map();
  for (let n = 0; n < t.length; n++)
    e.set(n, t[n].name);
  return e;
}
function sl(t) {
  const e = /* @__PURE__ */ new Map();
  for (let n = 0; n < t.length; n++)
    t[n].name && e.set(t[n].name, n);
  return e;
}
function On(t, e) {
  !t || typeof t != "object" || (t.glyphID !== void 0 && typeof t.glyphID == "number" && (t.glyphID = e.get(t.glyphID) ?? t.glyphID), t.paint && On(t.paint, e), t.sourcePaint && On(t.sourcePaint, e), t.backdropPaint && On(t.backdropPaint, e));
}
function kn(t, e) {
  if (!(!t || typeof t != "object")) {
    if (t.glyphID !== void 0 && typeof t.glyphID == "string") {
      const n = e.get(t.glyphID);
      n !== void 0 && (t.glyphID = n);
    }
    t.paint && kn(t.paint, e), t.sourcePaint && kn(t.sourcePaint, e), t.backdropPaint && kn(t.backdropPaint, e);
  }
}
function j(t) {
  if (!Number.isInteger(t) || t < -32768 || t > 32767)
    return rl(t);
  if (t >= -107 && t <= 107)
    return [t + 139];
  if (t >= 108 && t <= 1131) {
    const n = t - 108;
    return [(n >> 8 & 255) + 247, n & 255];
  }
  if (t >= -1131 && t <= -108) {
    const n = -t - 108;
    return [(n >> 8 & 255) + 251, n & 255];
  }
  const e = t < 0 ? t + 65536 : t;
  return [28, e >> 8 & 255, e & 255];
}
function rl(t) {
  const e = Math.round(t * 65536), n = e < 0 ? e + 4294967296 : e;
  return [
    255,
    n >> 24 & 255,
    n >> 16 & 255,
    n >> 8 & 255,
    n & 255
  ];
}
const Zs = 21, il = 22, al = 4, cl = 5, fl = 6, ll = 7, ul = 8, Xs = 14;
function qe(t, e) {
  const n = Number.isFinite(e) ? j(e) : [];
  if (!t || t.length === 0)
    return [
      ...n,
      ...j(0),
      ...j(0),
      Zs,
      Xs
    ];
  const o = [...n];
  let s = 0, r = 0;
  for (const i of t)
    if (!(!i || i.length === 0))
      for (const a of i)
        switch (a.type) {
          case "M": {
            const c = a.x - s, f = a.y - r;
            c === 0 && f !== 0 ? o.push(...j(f), al) : f === 0 && c !== 0 ? o.push(...j(c), il) : o.push(...j(c), ...j(f), Zs), s = a.x, r = a.y;
            break;
          }
          case "L": {
            const c = a.x - s, f = a.y - r;
            c === 0 && f !== 0 ? o.push(...j(f), ll) : f === 0 && c !== 0 ? o.push(...j(c), fl) : o.push(...j(c), ...j(f), cl), s = a.x, r = a.y;
            break;
          }
          case "C": {
            const c = a.x1 - s, f = a.y1 - r, l = a.x2 - a.x1, u = a.y2 - a.y1, h = a.x - a.x2, p = a.y - a.y2;
            o.push(
              ...j(c),
              ...j(f),
              ...j(l),
              ...j(u),
              ...j(h),
              ...j(p),
              ul
            ), s = a.x, r = a.y;
            break;
          }
        }
  return o.push(Xs), o;
}
const qs = {
  hstem: [1],
  vstem: [3],
  vmoveto: [4],
  rlineto: [5],
  hlineto: [6],
  vlineto: [7],
  rrcurveto: [8],
  callsubr: [10],
  return: [11],
  endchar: [14],
  hstemhm: [18],
  hintmask: [19],
  cntrmask: [20],
  rmoveto: [21],
  hmoveto: [22],
  vstemhm: [23],
  rcurveline: [24],
  rlinecurve: [25],
  vvcurveto: [26],
  hhcurveto: [27],
  callgsubr: [29],
  vhcurveto: [30],
  hvcurveto: [31],
  // Two-byte operators (12 xx)
  dotsection: [12, 0],
  and: [12, 3],
  or: [12, 4],
  not: [12, 5],
  abs: [12, 9],
  add: [12, 10],
  sub: [12, 11],
  div: [12, 12],
  neg: [12, 14],
  eq: [12, 15],
  drop: [12, 18],
  put: [12, 20],
  get: [12, 21],
  ifelse: [12, 22],
  random: [12, 23],
  mul: [12, 24],
  sqrt: [12, 26],
  dup: [12, 27],
  exch: [12, 28],
  index: [12, 29],
  roll: [12, 30],
  hflex: [12, 34],
  flex: [12, 35],
  hflex1: [12, 36],
  flex1: [12, 37]
};
function hl(t) {
  const e = [], n = t.split(`
`).filter((o) => o.trim().length > 0);
  for (const o of n) {
    const s = o.trim().split(/\s+/);
    if (s.length === 0) continue;
    let r = -1, i = null;
    for (let a = 0; a < s.length; a++) {
      const c = s[a].toLowerCase();
      if (qs[c] || c.startsWith("op")) {
        r = a, i = c;
        break;
      }
    }
    if (r === -1) {
      for (const a of s)
        e.push(...j(parseFloat(a)));
      continue;
    }
    for (let a = 0; a < r; a++)
      e.push(...j(parseFloat(s[a])));
    if (i.startsWith("op12.")) {
      const a = parseInt(i.slice(5), 10);
      e.push(12, a);
    } else i.startsWith("op") ? e.push(parseInt(i.slice(2), 10)) : e.push(...qs[i]);
    if (i === "hintmask" || i === "cntrmask") {
      const a = s.slice(r + 1).join("");
      if (a.length > 0)
        for (let c = 0; c < a.length; c += 8) {
          const f = a.slice(c, c + 8).padEnd(8, "0");
          e.push(parseInt(f, 2));
        }
    }
  }
  return e;
}
function gl(t) {
  if (!t || t.length === 0) return "";
  const e = [];
  for (const n of t)
    !n || n.length === 0 || (n[0].type ? e.push(pl(n)) : e.push(dl(n)));
  return e.join(" ");
}
function pl(t) {
  const e = [];
  for (const n of t)
    switch (n.type) {
      case "M":
        e.push(`M${U(n.x)} ${U(n.y)}`);
        break;
      case "L":
        e.push(`L${U(n.x)} ${U(n.y)}`);
        break;
      case "C":
        e.push(
          `C${U(n.x1)} ${U(n.y1)} ${U(n.x2)} ${U(n.y2)} ${U(n.x)} ${U(n.y)}`
        );
        break;
    }
  return e.push("Z"), e.join(" ");
}
function dl(t) {
  if (t.length === 0) return "";
  const e = [], n = t.length;
  let o = 0;
  for (let a = 0; a < n; a++)
    if (t[a].onCurve) {
      o = a;
      break;
    }
  const s = t[o];
  e.push(`M${U(s.x)} ${U(s.y)}`);
  let r = 1;
  for (; r < n; ) {
    const a = (o + r) % n, c = t[a];
    if (c.onCurve)
      e.push(`L${U(c.x)} ${U(c.y)}`), r++;
    else {
      const f = (o + r + 1) % n, l = t[f];
      if (l.onCurve)
        e.push(`Q${U(c.x)} ${U(c.y)} ${U(l.x)} ${U(l.y)}`), r += 2;
      else {
        const u = (c.x + l.x) / 2, h = (c.y + l.y) / 2;
        e.push(`Q${U(c.x)} ${U(c.y)} ${U(u)} ${U(h)}`), r++;
      }
    }
  }
  const i = t[(o + n - 1) % n];
  return i.onCurve || e.push(
    `Q${U(i.x)} ${U(i.y)} ${U(s.x)} ${U(s.y)}`
  ), e.push("Z"), e.join(" ");
}
function fa(t, e = "cff") {
  const n = xl(t);
  if (n.length === 0) return [];
  const o = [];
  let s = null;
  const r = () => {
    s && s.some((i) => i.op !== "M") && o.push(s), s = null;
  };
  for (const i of n)
    i.op === "M" ? (r(), s = [i]) : i.op === "Z" ? r() : s && s.push(i);
  return r(), e === "truetype" ? o.map((i) => yl(i)) : o.map((i) => ml(i));
}
function ml(t) {
  const e = [];
  for (const n of t)
    switch (n.op) {
      case "M":
        e.push({ type: "M", x: n.x, y: n.y });
        break;
      case "L":
        e.push({ type: "L", x: n.x, y: n.y });
        break;
      case "C":
        e.push({
          type: "C",
          x1: n.x1,
          y1: n.y1,
          x2: n.x2,
          y2: n.y2,
          x: n.x,
          y: n.y
        });
        break;
      case "Q": {
        const o = e[e.length - 1], s = o ? o.x : 0, r = o ? o.y : 0, i = s + 2 / 3 * (n.x1 - s), a = r + 2 / 3 * (n.y1 - r), c = n.x + 2 / 3 * (n.x1 - n.x), f = n.y + 2 / 3 * (n.y1 - n.y);
        e.push({
          type: "C",
          x1: i,
          y1: a,
          x2: c,
          y2: f,
          x: n.x,
          y: n.y
        });
        break;
      }
    }
  return e;
}
function yl(t) {
  const e = [];
  for (const n of t)
    switch (n.op) {
      case "M":
        e.push({ x: n.x, y: n.y, onCurve: !0 });
        break;
      case "L":
        e.push({ x: n.x, y: n.y, onCurve: !0 });
        break;
      case "Q":
        e.push({ x: n.x1, y: n.y1, onCurve: !1 }), e.push({ x: n.x, y: n.y, onCurve: !0 });
        break;
      case "C": {
        const o = e[e.length - 1], s = o ? o.x : 0, r = o ? o.y : 0, i = Ln(
          s,
          r,
          n.x1,
          n.y1,
          n.x2,
          n.y2,
          n.x,
          n.y
        );
        for (const a of i)
          e.push({ x: a.cx, y: a.cy, onCurve: !1 }), e.push({ x: a.x, y: a.y, onCurve: !0 });
        break;
      }
    }
  return e;
}
function xl(t) {
  const e = [], n = t.match(
    /[MmLlHhVvCcSsQqTtZz]|[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g
  );
  if (!n) return e;
  let o = 0, s = 0, r = 0, i = 0, a = "", c = 0, f = 0, l = 0;
  function u() {
    return parseFloat(n[l++]);
  }
  for (; l < n.length; ) {
    let h = n[l];
    /[A-Za-z]/.test(h) ? l++ : h = a;
    const p = h === h.toLowerCase();
    switch (h.toUpperCase()) {
      case "M": {
        let d = u(), x = u();
        p && (d += o, x += s), e.push({ op: "M", x: d, y: x }), o = r = d, s = i = x, a = p ? "l" : "L";
        break;
      }
      case "L": {
        let d = u(), x = u();
        p && (d += o, x += s), e.push({ op: "L", x: d, y: x }), o = d, s = x, a = h;
        break;
      }
      case "H": {
        let d = u();
        p && (d += o), e.push({ op: "L", x: d, y: s }), o = d, a = h;
        break;
      }
      case "V": {
        let d = u();
        p && (d += s), e.push({ op: "L", x: o, y: d }), s = d, a = h;
        break;
      }
      case "C": {
        let d = u(), x = u(), y = u(), m = u(), w = u(), _ = u();
        p && (d += o, x += s, y += o, m += s, w += o, _ += s), e.push({ op: "C", x1: d, y1: x, x2: y, y2: m, x: w, y: _ }), c = y, f = m, o = w, s = _, a = h;
        break;
      }
      case "S": {
        let d = 2 * o - c, x = 2 * s - f;
        a.toUpperCase() !== "C" && a.toUpperCase() !== "S" && (d = o, x = s);
        let y = u(), m = u(), w = u(), _ = u();
        p && (y += o, m += s, w += o, _ += s), e.push({ op: "C", x1: d, y1: x, x2: y, y2: m, x: w, y: _ }), c = y, f = m, o = w, s = _, a = h;
        break;
      }
      case "Q": {
        let d = u(), x = u(), y = u(), m = u();
        p && (d += o, x += s, y += o, m += s), e.push({ op: "Q", x1: d, y1: x, x: y, y: m }), c = d, f = x, o = y, s = m, a = h;
        break;
      }
      case "T": {
        let d = 2 * o - c, x = 2 * s - f;
        a.toUpperCase() !== "Q" && a.toUpperCase() !== "T" && (d = o, x = s);
        let y = u(), m = u();
        p && (y += o, m += s), e.push({ op: "Q", x1: d, y1: x, x: y, y: m }), c = d, f = x, o = y, s = m, a = h;
        break;
      }
      case "Z": {
        e.push({ op: "Z" }), o = r, s = i, a = h;
        break;
      }
      default:
        a = h;
        break;
    }
  }
  return e;
}
function Ln(t, e, n, o, s, r, i, a, c = 0) {
  const f = (3 * (n + s) - t - i) / 4, l = (3 * (o + r) - e - a) / 4, u = t + 2 / 3 * (f - t), h = e + 2 / 3 * (l - e), p = i + 2 / 3 * (f - i), g = a + 2 / 3 * (l - a), d = Math.hypot(n - u, o - h), x = Math.hypot(s - p, r - g);
  if (Math.max(d, x) <= 0.5 || c >= 8)
    return [{ cx: f, cy: l, x: i, y: a }];
  const m = (t + n) / 2, w = (e + o) / 2, _ = (n + s) / 2, S = (o + r) / 2, b = (s + i) / 2, A = (r + a) / 2, k = (m + _) / 2, O = (w + S) / 2, I = (_ + b) / 2, E = (S + A) / 2, T = (k + I) / 2, D = (O + E) / 2, R = Ln(
    t,
    e,
    m,
    w,
    k,
    O,
    T,
    D,
    c + 1
  ), M = Ln(
    T,
    D,
    I,
    E,
    b,
    A,
    i,
    a,
    c + 1
  );
  return R.concat(M);
}
function U(t) {
  const e = Math.round(t * 100) / 100;
  return e === Math.floor(e) ? String(e) : e.toFixed(2).replace(/0+$/, "");
}
function Sl(t) {
  if (!t || typeof t != "object")
    throw new Error("createGlyph: options object is required");
  const {
    name: e,
    unicode: n,
    unicodes: o,
    advanceWidth: s,
    leftSideBearing: r,
    advanceHeight: i,
    topSideBearing: a,
    path: c,
    contours: f,
    charString: l,
    components: u,
    instructions: h,
    format: p = "truetype"
  } = t;
  if (e == null)
    throw new Error("createGlyph: name is required");
  if (s == null)
    throw new Error("createGlyph: advanceWidth is required");
  const g = {
    name: e,
    advanceWidth: s
  };
  if (o && o.length > 0 ? g.unicodes = o : n != null && (g.unicode = n), r !== void 0 && (g.leftSideBearing = r), i !== void 0 && (g.advanceHeight = i), a !== void 0 && (g.topSideBearing = a), h && (g.instructions = h), l)
    g.charString = l;
  else if (c) {
    const d = fa(c, p);
    g.contours = d, p === "cff" && (g.charString = qe(d));
  } else f ? (g.contours = f, f.length > 0 && f[0] && f[0].length > 0 && f[0][0].type && (g.charString = qe(f))) : u && (g.components = u);
  return g;
}
function pn(t, e) {
  const n = t?.glyphs;
  if (!n || !Array.isArray(n)) return;
  const o = la(e);
  if (o !== void 0)
    return ua(n, o);
  if (typeof e == "string")
    return n.find((s) => s.name === e);
}
function Ft(t, e) {
  const n = la(e);
  if (n !== void 0)
    return ua(t, n)?.name;
  if (typeof e == "string")
    return e;
}
function la(t) {
  if (typeof t == "number") return t;
  if (typeof t == "string") {
    const e = t.match(/^(?:U\+|0x)([0-9A-Fa-f]+)$/i);
    if (e) return parseInt(e[1], 16);
  }
}
function ua(t, e) {
  for (const n of t)
    if (n.unicode === e || n.unicodes && n.unicodes.includes(e) || n.codePoint === e) return n;
}
function ha(t) {
  const e = t.transform;
  if (e) {
    if ("scale" in e || "xScale" in e) return e;
    if ("xx" in e || "xy" in e || "yx" in e || "yy" in e)
      return {
        xScale: e.xx ?? 1,
        scale01: e.xy ?? 0,
        scale10: e.yx ?? 0,
        yScale: e.yy ?? 1
      };
  }
  return typeof t.scale == "number" ? { scale: t.scale } : t.scaleXY && typeof t.scaleXY == "object" ? { xScale: t.scaleXY.x ?? 1, yScale: t.scaleXY.y ?? 1 } : null;
}
function _l(t, e) {
  let n = t.glyphIndex;
  if (t.glyphName != null) {
    const f = e ? e.get(t.glyphName) : void 0;
    if (f === void 0)
      throw new Error(
        `Composite component references unknown glyph name "${t.glyphName}". Add that glyph to the font before exporting, or use glyphIndex.`
      );
    n = f;
  }
  const o = t.flags && t.argument1 !== void 0 && t.argument2 !== void 0;
  let s, r, i;
  o ? (s = { ...t.flags }, r = t.argument1, i = t.argument2) : (s = { ...t.flags || {}, argsAreXYValues: !0 }, r = t.argument1 ?? t.dx ?? 0, i = t.argument2 ?? t.dy ?? 0), t.useMyMetrics && (s.useMyMetrics = !0);
  const a = { glyphIndex: n, flags: s, argument1: r, argument2: i }, c = ha(t);
  return c && (a.transform = c), a;
}
function wl(t) {
  let e = 1, n = 0, o = 0, s = 1;
  const r = ha(t);
  r && (typeof r.scale == "number" ? (e = r.scale, s = r.scale) : (typeof r.xScale == "number" && (e = r.xScale), typeof r.yScale == "number" && (s = r.yScale), typeof r.scale01 == "number" && (n = r.scale01), typeof r.scale10 == "number" && (o = r.scale10)));
  let i = 0, a = 0;
  return t.flags?.argsAreXYValues ? (i = t.argument1 || 0, a = t.argument2 || 0) : t.flags == null && (i = t.argument1 ?? t.dx ?? 0, a = t.argument2 ?? t.dy ?? 0), { a: e, b: n, c: o, d: s, dx: i, dy: a };
}
function As(t, e, n = 0) {
  if (!e) return [];
  if (!e.components || e.components.length === 0)
    return Array.isArray(e.contours) ? e.contours.map((s) => s.slice()) : [];
  if (n > 16 || !Array.isArray(t)) return [];
  const o = [];
  for (const s of e.components) {
    let r = t[s.glyphIndex];
    if (!r && s.glyphName != null && (r = t.find((g) => g && g.name === s.glyphName)), !r) continue;
    const i = As(t, r, n + 1);
    if (i.length === 0) continue;
    const { a, b: c, c: f, d: l, dx: u, dy: h } = wl(s), p = a === 1 && c === 0 && f === 0 && l === 1;
    for (const g of i)
      o.push(
        g.map((d) => ({
          x: p ? d.x + u : Math.round(a * d.x + f * d.y + u),
          y: p ? d.y + h : Math.round(c * d.x + l * d.y + h),
          onCurve: d.onCurve
        }))
      );
  }
  return o;
}
const bl = 65536, Al = 1330926671, Cl = ["CFF ", "CFF2", "VORG"], vl = [
  "glyf",
  "loca",
  "cvt ",
  "fpgm",
  "prep",
  "gasp",
  "hdmx",
  "LTSH",
  "VDMX",
  "gvar",
  "cvar"
];
function ga(t, e) {
  if (!t || typeof t != "object")
    throw new TypeError("convertOutlines expects a font data object");
  if (e !== "truetype" && e !== "cff")
    throw new Error(
      `convertOutlines: target must be 'truetype' or 'cff', got '${e}'`
    );
  if (t.collection && Array.isArray(t.fonts))
    throw new Error(
      "Outline conversion is not supported for font collections."
    );
  if (Il(t) === e) return t;
  if (!Array.isArray(t.glyphs))
    throw new Error(
      "Outline conversion requires simplified glyph data ({ font, glyphs })."
    );
  const o = t.tables || {};
  if (t.axes?.length || o.fvar || o.gvar || o.CFF2)
    throw new Error(
      "Outline conversion is not supported for variable fonts (fvar/gvar/CFF2)."
    );
  return e === "truetype" ? Ol(t) : kl(t);
}
function Il(t) {
  const e = t.tables || {};
  if (e["CFF "] || e.CFF2) return "cff";
  if (e.glyf) return "truetype";
  const n = t.glyphs || [];
  if (n.some((r) => r.components && r.components.length > 0))
    return "truetype";
  let o = 0, s = 0;
  for (const r of n)
    r.charString ? o++ : r.contours && r.contours.length > 0 && !Jn(r.contours) && s++;
  return o > 0 && o >= s ? "cff" : "truetype";
}
function Ol(t) {
  const e = t.glyphs.map((n) => {
    const o = { ...n };
    return delete o.charString, delete o.charStringDisassembly, delete o.components, Jn(n.contours) ? o.contours = n.contours.map(pa) : Array.isArray(n.contours) ? o.contours = n.contours : o.contours = [], o.leftSideBearing = Dl(o.contours), o;
  });
  return ya(t, {
    glyphs: e,
    tables: da(t.tables, Cl),
    _header: ma(t._header, bl)
  });
}
function pa(t) {
  if (!Array.isArray(t) || t.length === 0) return [];
  const e = [];
  let n = 0, o = 0;
  for (const s of t)
    switch (s.type) {
      case "M":
      case "L":
        e.push({ x: W(s.x), y: W(s.y), onCurve: !0 }), n = s.x, o = s.y;
        break;
      case "Q":
        e.push({ x: W(s.x1), y: W(s.y1), onCurve: !1 }), e.push({ x: W(s.x), y: W(s.y), onCurve: !0 }), n = s.x, o = s.y;
        break;
      case "C": {
        const r = Ln(
          n,
          o,
          s.x1,
          s.y1,
          s.x2,
          s.y2,
          s.x,
          s.y
        );
        for (const i of r)
          e.push({ x: W(i.cx), y: W(i.cy), onCurve: !1 }), e.push({ x: W(i.x), y: W(i.y), onCurve: !0 });
        n = s.x, o = s.y;
        break;
      }
    }
  return e;
}
function kl(t) {
  const e = t.glyphs, n = e.map((o) => {
    const s = { ...o };
    delete s.instructions, delete s.components;
    const i = As(e, o).map(El).filter((c) => c.length > 0);
    s.contours = i;
    const a = Number.isFinite(o.advanceWidth) ? o.advanceWidth : void 0;
    return s.charString = qe(i, a), s;
  });
  return ya(t, {
    glyphs: n,
    tables: da(t.tables, vl),
    _header: ma(t._header, Al),
    // Clear decomposed TrueType-hinting fields so they are not re-emitted.
    cvt: void 0,
    fpgm: void 0,
    prep: void 0,
    gasp: void 0
  });
}
function El(t) {
  if (!Array.isArray(t) || t.length === 0) return [];
  const e = t.length;
  let n;
  const o = t.findIndex((u) => u.onCurve);
  if (o === -1) {
    const u = t[e - 1], h = t[0];
    n = [
      { x: (u.x + h.x) / 2, y: (u.y + h.y) / 2, onCurve: !0 },
      ...t
    ];
  } else {
    n = [];
    for (let u = 0; u < e; u++) n.push(t[(o + u) % e]);
  }
  const s = [];
  for (let u = 0; u < n.length; u++) {
    const h = n[u];
    s.push(h);
    const p = n[(u + 1) % n.length];
    !h.onCurve && !p.onCurve && s.push({
      x: (h.x + p.x) / 2,
      y: (h.y + p.y) / 2,
      onCurve: !0
    });
  }
  const r = s[0], i = [{ type: "M", x: W(r.x), y: W(r.y) }];
  let a = r.x, c = r.y;
  const f = s.length;
  let l = 1;
  for (; l < f; ) {
    const u = s[l];
    if (u.onCurve)
      i.push({ type: "L", x: W(u.x), y: W(u.y) }), a = u.x, c = u.y, l++;
    else {
      const h = s[(l + 1) % f];
      i.push(Tl(a, c, u.x, u.y, h.x, h.y)), a = h.x, c = h.y, l += 2;
    }
  }
  return i;
}
function Tl(t, e, n, o, s, r) {
  const i = t + 0.6666666666666666 * (n - t), a = e + 2 / 3 * (o - e), c = s + 2 / 3 * (n - s), f = r + 2 / 3 * (o - r);
  return {
    type: "C",
    x1: W(i),
    y1: W(a),
    x2: W(c),
    y2: W(f),
    x: W(s),
    y: W(r)
  };
}
function W(t) {
  return Math.round(t);
}
function Dl(t) {
  let e = 1 / 0;
  for (const n of t)
    for (const o of n)
      o.x < e && (e = o.x);
  return e === 1 / 0 ? 0 : e;
}
function Jn(t) {
  return Array.isArray(t) && t.length > 0 && Array.isArray(t[0]) && t[0].length > 0 && typeof t[0][0]?.type == "string";
}
function da(t, e) {
  const n = {};
  if (!t) return n;
  const o = new Set(e);
  for (const [s, r] of Object.entries(t))
    o.has(s) || (n[s] = r);
  return n;
}
function ma(t, e) {
  return t ? { ...t, sfVersion: e } : { sfVersion: e };
}
function ya(t, e) {
  const n = { ...t, ...e };
  for (const o of Object.keys(e))
    e[o] === void 0 && delete n[o];
  return n;
}
function xa(t, e) {
  const n = t[e];
  if (n >= 32 && n <= 246)
    return { value: n - 139, bytesConsumed: 1 };
  if (n >= 247 && n <= 250)
    return {
      value: (n - 247) * 256 + t[e + 1] + 108,
      bytesConsumed: 2
    };
  if (n >= 251 && n <= 254)
    return {
      value: -(n - 251) * 256 - t[e + 1] - 108,
      bytesConsumed: 2
    };
  if (n === 28) {
    const o = t[e + 1] << 8 | t[e + 2];
    return { value: o > 32767 ? o - 65536 : o, bytesConsumed: 3 };
  }
  if (n === 255) {
    const o = (t[e + 1] << 24 | t[e + 2] << 16 | t[e + 3] << 8 | t[e + 4]) >>> 0;
    return { value: (o > 2147483647 ? o - 4294967296 : o) / 65536, bytesConsumed: 5 };
  }
  return null;
}
function Ks(t) {
  return t < 1240 ? 107 : t < 33900 ? 1131 : 32768;
}
function Qn(t, e = [], n = []) {
  const o = [], s = [];
  let r = null, i = 0, a = 0, c = null, f = !1, l = !0;
  const u = Ks(e.length), h = Ks(n.length);
  function p(_, S) {
    r && r.length > 0 && s.push(r), i += _, a += S, r = [{ type: "M", x: i, y: a }];
  }
  function g(_, S) {
    i += _, a += S, r && r.push({ type: "L", x: i, y: a });
  }
  function d(_, S, b, A, k, O) {
    const I = i + _, E = a + S, T = I + b, D = E + A;
    i = T + k, a = D + O, r && r.push({ type: "C", x1: I, y1: E, x2: T, y2: D, x: i, y: a });
  }
  function x() {
    l && (o.length % 2 !== 0 && (c = o.shift()), l = !1, f = !0);
  }
  function y(_) {
    switch (_) {
      case 1:
      // hstem
      case 3:
      // vstem
      case 18:
      // hstemhm
      case 23:
        f || (o.length % 2 !== 0 && (c = o.shift()), f = !0, l = !1), o.length = 0;
        break;
      case 4:
        l && (o.length > 1 && (c = o.shift()), l = !1, f = !0), p(0, o.pop()), o.length = 0;
        break;
      case 5:
        for (let S = 0; S < o.length; S += 2)
          g(o[S], o[S + 1]);
        o.length = 0;
        break;
      case 6:
        for (let S = 0; S < o.length; S++)
          S % 2 === 0 ? g(o[S], 0) : g(0, o[S]);
        o.length = 0;
        break;
      case 7:
        for (let S = 0; S < o.length; S++)
          S % 2 === 0 ? g(0, o[S]) : g(o[S], 0);
        o.length = 0;
        break;
      case 8:
        for (let S = 0; S + 5 < o.length; S += 6)
          d(
            o[S],
            o[S + 1],
            o[S + 2],
            o[S + 3],
            o[S + 4],
            o[S + 5]
          );
        o.length = 0;
        break;
      case 10: {
        const S = o.pop() + h;
        n[S] && (callStack.push(null), execute(n[S]));
        break;
      }
      case 11:
        return;
      // Return from subroutine
      case 14:
        !f && o.length > 0 && (c = o.shift(), f = !0, l = !1), r && r.length > 0 && (s.push(r), r = null), o.length = 0;
        break;
      case 19:
      // hintmask
      case 20:
        f || (o.length % 2 !== 0 && (c = o.shift()), f = !0, l = !1), o.length = 0;
        break;
      case 21:
        x();
        {
          const S = o.pop(), b = o.pop();
          p(b, S);
        }
        o.length = 0;
        break;
      case 22:
        l && (o.length > 1 && (c = o.shift()), l = !1, f = !0), p(o.pop(), 0), o.length = 0;
        break;
      case 24:
        {
          const b = o.length - 2;
          let A = 0;
          for (; A < b; A += 6)
            d(
              o[A],
              o[A + 1],
              o[A + 2],
              o[A + 3],
              o[A + 4],
              o[A + 5]
            );
          g(o[A], o[A + 1]);
        }
        o.length = 0;
        break;
      case 25:
        {
          const b = o.length - 6;
          let A = 0;
          for (; A < b; A += 2)
            g(o[A], o[A + 1]);
          d(
            o[A],
            o[A + 1],
            o[A + 2],
            o[A + 3],
            o[A + 4],
            o[A + 5]
          );
        }
        o.length = 0;
        break;
      case 26:
        {
          let S = 0, b = 0;
          for (o.length % 4 !== 0 && (b = o[S++]); S + 3 < o.length; S += 4)
            d(b, o[S], o[S + 1], o[S + 2], 0, o[S + 3]), b = 0;
        }
        o.length = 0;
        break;
      case 27:
        {
          let S = 0, b = 0;
          for (o.length % 4 !== 0 && (b = o[S++]); S + 3 < o.length; S += 4)
            d(o[S], b, o[S + 1], o[S + 2], o[S + 3], 0), b = 0;
        }
        o.length = 0;
        break;
      case 29: {
        const S = o.pop() + u;
        e[S] && (callStack.push(null), execute(e[S]));
        break;
      }
      case 30:
        {
          let S = 0;
          for (; S < o.length && S + 3 < o.length; ) {
            {
              const b = o.length - S === 5 ? o[S + 4] : 0;
              d(
                0,
                o[S],
                o[S + 1],
                o[S + 2],
                o[S + 3],
                b
              ), S += b !== 0 ? 5 : 4;
            }
            if (S + 3 < o.length) {
              const b = o.length - S === 5 ? o[S + 4] : 0;
              d(
                o[S],
                0,
                o[S + 1],
                o[S + 2],
                b,
                o[S + 3]
              ), S += b !== 0 ? 5 : 4;
            } else break;
          }
        }
        o.length = 0;
        break;
      case 31:
        {
          let S = 0;
          for (; S < o.length && S + 3 < o.length; ) {
            {
              const b = o.length - S === 5 ? o[S + 4] : 0;
              d(
                o[S],
                0,
                o[S + 1],
                o[S + 2],
                b,
                o[S + 3]
              ), S += b !== 0 ? 5 : 4;
            }
            if (S + 3 < o.length) {
              const b = o.length - S === 5 ? o[S + 4] : 0;
              d(
                0,
                o[S],
                o[S + 1],
                o[S + 2],
                o[S + 3],
                b
              ), S += b !== 0 ? 5 : 4;
            } else break;
          }
        }
        o.length = 0;
        break;
      default:
        o.length = 0;
        break;
    }
  }
  function m(_) {
    switch (_) {
      case 34:
        {
          const S = o[0], b = 0, A = o[1], k = o[2], O = o[3], I = 0, E = o[4], T = 0, D = o[5], R = -k, M = o[6], L = 0;
          d(S, b, A, k, O, I), d(E, T, D, R, M, L);
        }
        o.length = 0;
        break;
      case 35:
        d(o[0], o[1], o[2], o[3], o[4], o[5]), d(o[6], o[7], o[8], o[9], o[10], o[11]), o.length = 0;
        break;
      case 36:
        {
          const S = o[0], b = o[1], A = o[2], k = o[3], O = o[4], I = 0, E = o[5], T = 0, D = o[6], R = o[7], M = o[8], L = -(b + k + R);
          d(S, b, A, k, O, I), d(E, T, D, R, M, L);
        }
        o.length = 0;
        break;
      case 37:
        {
          const S = o[0], b = o[1], A = o[2], k = o[3], O = o[4], I = o[5], E = o[6], T = o[7], D = o[8], R = o[9], M = o[10], L = S + A + O + E + D, H = b + k + I + T + R;
          let P, Z;
          Math.abs(L) > Math.abs(H) ? (P = M, Z = -H) : (P = -L, Z = M), d(S, b, A, k, O, I), d(E, T, D, R, P, Z);
        }
        o.length = 0;
        break;
      default:
        o.length = 0;
        break;
    }
  }
  function w(_, S) {
    let b = S || 0, A = 0;
    for (; A < _.length; ) {
      const k = _[A], O = xa(_, A);
      if (O !== null) {
        o.push(O.value), A += O.bytesConsumed;
        continue;
      }
      if (k === 12) {
        A++;
        const I = _[A];
        A++, m(I);
      } else if (k === 19 || k === 20) {
        f || (o.length % 2 !== 0 && (c = o.shift()), f = !0, l = !1), b += o.length >> 1, o.length = 0, A++;
        const I = Math.ceil(b / 8);
        A += I;
      } else if (k === 1 || k === 3 || k === 18 || k === 23)
        f || (o.length % 2 !== 0 && (c = o.shift()), f = !0, l = !1), b += o.length >> 1, o.length = 0, A++;
      else if (k === 10) {
        A++;
        const I = o.pop() + h;
        n[I] && (b = w(n[I], b));
      } else if (k === 29) {
        A++;
        const I = o.pop() + u;
        e[I] && (b = w(e[I], b));
      } else {
        if (k === 11)
          return b;
        A++, y(k);
      }
    }
    return b;
  }
  return w(t, 0), r && r.length > 0 && s.push(r), { contours: s, width: c };
}
const Js = {
  1: "hstem",
  3: "vstem",
  4: "vmoveto",
  5: "rlineto",
  6: "hlineto",
  7: "vlineto",
  8: "rrcurveto",
  10: "callsubr",
  11: "return",
  14: "endchar",
  18: "hstemhm",
  19: "hintmask",
  20: "cntrmask",
  21: "rmoveto",
  22: "hmoveto",
  23: "vstemhm",
  24: "rcurveline",
  25: "rlinecurve",
  26: "vvcurveto",
  27: "hhcurveto",
  29: "callgsubr",
  30: "vhcurveto",
  31: "hvcurveto"
}, Rl = {
  0: "dotsection",
  3: "and",
  4: "or",
  5: "not",
  9: "abs",
  10: "add",
  11: "sub",
  12: "div",
  14: "neg",
  15: "eq",
  18: "drop",
  20: "put",
  21: "get",
  22: "ifelse",
  23: "random",
  24: "mul",
  26: "sqrt",
  27: "dup",
  28: "exch",
  29: "index",
  30: "roll",
  34: "hflex",
  35: "flex",
  36: "hflex1",
  37: "flex1"
};
function Sa(t) {
  const e = [], n = [];
  let o = 0, s = 0;
  for (; s < t.length; ) {
    const r = t[s], i = xa(t, s);
    if (i !== null) {
      n.push(i.value), s += i.bytesConsumed;
      continue;
    }
    if (r === 12) {
      s++;
      const a = t[s];
      s++;
      const c = Rl[a] || `op12.${a}`;
      e.push(n.length ? `${n.join(" ")} ${c}` : c), n.length = 0;
    } else if (r === 19 || r === 20) {
      const a = r === 19 ? "hintmask" : "cntrmask";
      o += n.length >> 1, s++;
      const c = Math.ceil(o / 8), f = [];
      for (let u = 0; u < c && s < t.length; u++, s++)
        f.push(t[s].toString(2).padStart(8, "0"));
      const l = n.length ? `${n.join(" ")} ` : "";
      e.push(`${l}${a} ${f.join("")}`), n.length = 0;
    } else if (r === 1 || r === 3 || r === 18 || r === 23) {
      o += n.length >> 1;
      const a = Js[r];
      e.push(n.length ? `${n.join(" ")} ${a}` : a), n.length = 0, s++;
    } else {
      const a = Js[r] || `op${r}`;
      e.push(n.length ? `${n.join(" ")} ${a}` : a), n.length = 0, s++;
    }
  }
  return n.length && e.push(n.join(" ")), e.join(`
`);
}
const Fl = /* @__PURE__ */ new Set([
  "head",
  "hhea",
  "hmtx",
  "vmtx",
  "name",
  "OS/2",
  "post",
  "maxp",
  "cmap",
  "glyf",
  "loca",
  "CFF ",
  "kern",
  "fvar",
  "avar",
  "STAT",
  "MVAR",
  "GPOS",
  "GSUB",
  "GDEF",
  "gasp",
  "cvt ",
  "fpgm",
  "prep",
  "COLR",
  "CPAL"
]);
function Cs(t) {
  const { header: e, tables: n } = t, o = Ll(n), s = Pl(n), r = { font: o, glyphs: s }, { pairs: i, classes: a } = Ul(
    n,
    s
  );
  i.length > 0 && (r.kerning = i), a && (r.kerningClasses = a), n.fvar && (r.axes = Kl(n), r.instances = Jl(n));
  const c = tu(n);
  c && (r.axisMapping = c);
  const f = eu(n);
  f && (r.axisStyles = f);
  const l = nu(n);
  if (l && (r.metricVariations = l), n.GSUB && !n.GSUB._raw) {
    const { substitutions: g, rawLookups: d } = su(
      n.GSUB,
      s
    );
    g.length > 0 && (r.substitutions = g), d.length > 0 && (r._rawGSUBLookups = d);
  }
  const u = {};
  n.GPOS && !n.GPOS._raw && (u.GPOS = n.GPOS), n.GDEF && !n.GDEF._raw && (u.GDEF = n.GDEF), Object.keys(u).length > 0 && (r.features = u), n.gasp && !n.gasp._raw && n.gasp.gaspRanges && (r.gasp = n.gasp.gaspRanges.map((g) => ({
    maxPPEM: g.rangeMaxPPEM,
    behavior: g.rangeGaspBehavior
  }))), n["cvt "] && !n["cvt "]._raw && n["cvt "].values && (r.cvt = n["cvt "].values), n.fpgm && !n.fpgm._raw && n.fpgm.instructions && (r.fpgm = n.fpgm.instructions), n.prep && !n.prep._raw && n.prep.instructions && (r.prep = n.prep.instructions);
  const h = hu(n);
  h && (r.palettes = h);
  const p = gu(n, s);
  return p && p.length > 0 && (r.colorGlyphs = p), r.tables = { ...n }, r._header = e, r;
}
const Ml = {
  0: "copyright",
  1: "familyName",
  2: "styleName",
  3: "uniqueID",
  4: "fullName",
  5: "version",
  6: "postScriptName",
  7: "trademark",
  8: "manufacturer",
  9: "designer",
  10: "description",
  11: "vendorURL",
  12: "designerURL",
  13: "license",
  14: "licenseURL",
  16: "typographicFamily",
  17: "typographicSubfamily",
  19: "sampleText",
  21: "wwsFamily",
  22: "wwsSubfamily",
  25: "variationsPostScriptNamePrefix"
};
function we(t, e) {
  if (!t || !t.names) return;
  const n = t.names.filter((i) => i.nameID === e);
  if (n.length === 0) return;
  const o = n.find(
    (i) => i.platformID === 3 && i.encodingID === 1 && i.languageID === 1033
  );
  if (o) return o.value;
  const s = n.find((i) => i.platformID === 0);
  if (s) return s.value;
  const r = n.find(
    (i) => i.platformID === 1 && i.encodingID === 0 && i.languageID === 0
  );
  return r ? r.value : n[0].value;
}
function Ll(t) {
  const e = t.name, n = t.head, o = t.hhea, s = t["OS/2"], r = t.post, i = {};
  for (const [a, c] of Object.entries(Ml)) {
    const f = we(e, Number(a));
    f !== void 0 && f.trim() !== "" && (i[c] = f);
  }
  return n && !n._raw && (i.unitsPerEm = n.unitsPerEm, i.created = tr(n.created), i.modified = tr(n.modified), n.macStyle !== void 0 && (i.macStyle = n.macStyle)), o && !o._raw && (i.ascender = o.ascender, i.descender = o.descender, i.lineGap = o.lineGap), r && !r._raw && (i.italicAngle = r.italicAngle, i.underlinePosition = r.underlinePosition, i.underlineThickness = r.underlineThickness, i.isFixedPitch = r.isFixedPitch !== 0), s && !s._raw && (i.weightClass = s.usWeightClass, i.widthClass = s.usWidthClass, i.fsType = s.fsType, i.fsSelection = s.fsSelection, i.achVendID = s.achVendID, s.panose && (i.panose = s.panose)), i;
}
const Bl = [
  196,
  197,
  199,
  201,
  209,
  214,
  220,
  225,
  // 0x80
  224,
  226,
  228,
  227,
  229,
  231,
  233,
  232,
  // 0x88
  234,
  235,
  237,
  236,
  238,
  239,
  241,
  243,
  // 0x90
  242,
  244,
  246,
  245,
  250,
  249,
  251,
  252,
  // 0x98
  8224,
  176,
  162,
  163,
  167,
  8226,
  182,
  223,
  // 0xA0
  174,
  169,
  8482,
  180,
  168,
  8800,
  198,
  216,
  // 0xA8
  8734,
  177,
  8804,
  8805,
  165,
  181,
  8706,
  8721,
  // 0xB0
  8719,
  960,
  8747,
  170,
  186,
  937,
  230,
  248,
  // 0xB8
  191,
  161,
  172,
  8730,
  402,
  8776,
  8710,
  171,
  // 0xC0
  187,
  8230,
  160,
  192,
  195,
  213,
  338,
  339,
  // 0xC8
  8211,
  8212,
  8220,
  8221,
  8216,
  8217,
  247,
  9674,
  // 0xD0
  255,
  376,
  8260,
  8364,
  8249,
  8250,
  64257,
  64258,
  // 0xD8
  8225,
  183,
  8218,
  8222,
  8240,
  194,
  202,
  193,
  // 0xE0
  203,
  200,
  205,
  206,
  207,
  204,
  211,
  212,
  // 0xE8
  63743,
  210,
  218,
  219,
  217,
  305,
  710,
  732,
  // 0xF0
  175,
  728,
  729,
  730,
  184,
  733,
  731,
  711
  // 0xF8
];
function Vl(t, e) {
  return t === 0 ? !0 : t === 3 ? e === 0 || e === 1 || e === 10 : !1;
}
function Fe(t, e) {
  return !e || t < 128 ? t : t <= 255 ? Bl[t - 128] : t;
}
function $l(t, e, n) {
  switch (e.format) {
    case 0:
      for (let o = 0; o < e.glyphIdArray.length; o++) {
        const s = e.glyphIdArray[o];
        s !== 0 && Me(t, s, Fe(o, n));
      }
      break;
    case 4:
      for (const o of e.segments)
        for (let s = o.startCode; s <= o.endCode; s++) {
          let r;
          if (o.idRangeOffset === 0)
            r = s + o.idDelta & 65535;
          else {
            const i = o.idRangeOffset / 2 + (s - o.startCode) - (e.segments.length - e.segments.indexOf(o));
            r = e.glyphIdArray[i], r !== void 0 && r !== 0 && (r = r + o.idDelta & 65535);
          }
          r !== void 0 && r !== 0 && Me(t, r, Fe(s, n));
        }
      break;
    case 6:
      for (let o = 0; o < e.glyphIdArray.length; o++) {
        const s = e.glyphIdArray[o];
        s !== 0 && Me(
          t,
          s,
          Fe(e.firstCode + o, n)
        );
      }
      break;
    case 12:
      for (const o of e.groups)
        for (let s = o.startCharCode; s <= o.endCharCode; s++) {
          const r = o.startGlyphID + (s - o.startCharCode);
          r !== 0 && Me(t, r, Fe(s, n));
        }
      break;
    case 13:
      for (const o of e.groups)
        for (let s = o.startCharCode; s <= o.endCharCode; s++)
          o.glyphID !== 0 && Me(
            t,
            o.glyphID,
            Fe(s, n)
          );
      break;
  }
}
function Nl(t) {
  const e = /* @__PURE__ */ new Map();
  if (!t || t._raw || !t.subtables) return e;
  const n = t.subtables, o = t.encodingRecords;
  let s;
  if (Array.isArray(o) && o.length > 0) {
    const r = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Set();
    for (const a of o)
      Vl(a.platformID, a.encodingID) ? r.add(a.subtableIndex) : a.platformID === 1 && a.encodingID === 0 && i.add(a.subtableIndex);
    r.size > 0 ? s = [...r].map((a) => ({
      index: a,
      translateMacRoman: !1
    })) : i.size > 0 ? s = [...i].map((a) => ({
      index: a,
      translateMacRoman: !0
    })) : s = n.map((a, c) => ({
      index: c,
      translateMacRoman: !1
    }));
  } else
    s = n.map((r, i) => ({
      index: i,
      translateMacRoman: !1
    }));
  for (const { index: r, translateMacRoman: i } of s) {
    const a = n[r];
    a && $l(e, a, i);
  }
  return e;
}
function Me(t, e, n) {
  t.has(e) || t.set(e, []);
  const o = t.get(e);
  o.includes(n) || o.push(n);
}
function Gl(t, e) {
  if (t.post && !t.post._raw && t.post.glyphNames && t.post.glyphNames.length > 0)
    return t.post.glyphNames;
  if (t["CFF "] && !t["CFF "]._raw) {
    const o = t["CFF "];
    if (o.fonts && o.fonts[0] && o.fonts[0].charset) {
      const s = o.fonts[0].charset, r = o.strings || [];
      return [".notdef", ...s.map((a) => {
        if (typeof a == "string") return a;
        if (typeof a == "number" && a >= 391) {
          const c = r[a - 391];
          return typeof c == "string" && c !== "" ? c : String(a);
        }
        return String(a);
      })];
    }
  }
  const n = [];
  for (let o = 0; o < e; o++)
    n.push(o === 0 ? ".notdef" : `glyph${o}`);
  return n;
}
function Pl(t) {
  const e = t.glyf && !t.glyf._raw, n = t["CFF "] && !t["CFF "]._raw, o = t.hmtx && !t.hmtx._raw ? t.hmtx : null, s = t.vmtx && !t.vmtx._raw ? t.vmtx : null, r = t.hhea && !t.hhea._raw ? t.hhea : null, i = t.vhea && !t.vhea._raw ? t.vhea : null;
  let a = 0;
  t.maxp && !t.maxp._raw ? a = t.maxp.numGlyphs : e ? a = t.glyf.glyphs.length : n ? a = t["CFF "].fonts[0].charStrings.length : o && (a = o.hMetrics.length + (o.leftSideBearings?.length || 0));
  const c = r ? r.numberOfHMetrics : a, f = i ? i.numOfLongVerMetrics : 0, l = Nl(t.cmap), u = Gl(t, a), h = [];
  for (let p = 0; p < a; p++) {
    const g = {};
    u[p] && (g.name = u[p]);
    const d = l.get(p) || [];
    if (d.length === 1 ? g.unicode = d[0] : d.length > 1 ? (g.unicode = d[0], g.unicodes = d) : g.unicode = null, o && (p < c ? (g.advanceWidth = o.hMetrics[p].advanceWidth, g.leftSideBearing = o.hMetrics[p].lsb) : (g.advanceWidth = o.hMetrics[c - 1].advanceWidth, g.leftSideBearing = o.leftSideBearings[p - c])), s && (p < f ? (g.advanceHeight = s.vMetrics[p].advanceHeight, g.topSideBearing = s.vMetrics[p].topSideBearing) : s.topSideBearings && (g.advanceHeight = s.vMetrics[f - 1].advanceHeight, g.topSideBearing = s.topSideBearings[p - f])), e) {
      const x = t.glyf.glyphs[p];
      x && x.type === "simple" ? (g.contours = x.contours, x.instructions && x.instructions.length > 0 && (g.instructions = x.instructions)) : x && x.type === "composite" && (g.components = x.components, x.instructions && x.instructions.length > 0 && (g.instructions = x.instructions));
    }
    if (n) {
      const x = t["CFF "], y = x.fonts[0], m = y.charStrings;
      if (m[p]) {
        g.charString = m[p], g.charStringDisassembly = Sa(m[p]);
        const w = x.globalSubrs || [], _ = y.localSubrs || [], S = Qn(
          m[p],
          w,
          _
        );
        S.contours.length > 0 && (g.contours = S.contours);
      }
    }
    h.push(g);
  }
  return h;
}
function Ul(t, e) {
  const n = zl(t, e), o = jl(t, e), s = /* @__PURE__ */ new Map();
  for (const a of n.pairs)
    s.set(`${a.left}\0${a.right}`, a);
  for (const a of o.pairs) {
    const c = `${a.left}\0${a.right}`;
    s.has(c) || s.set(c, a);
  }
  const r = Array.from(s.values()), i = (n.classes && n.classes.length ? n.classes : null) || (o.classes && o.classes.length ? o.classes : null) || null;
  return { pairs: r, classes: i };
}
function vs(t) {
  const { leftMembers: e, rightMembers: n, leftCount: o, rightCount: s, valueAt: r } = t, i = { leftClasses: {}, rightClasses: {}, pairs: [] }, a = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), f = (l, u, h, p, g) => {
    const d = h.get(l);
    if (d !== void 0) return d;
    let x;
    if (u.length === 1)
      x = u[0];
    else {
      const y = `${g}${l}`;
      p[y] = u, x = `@${y}`;
    }
    return h.set(l, x), x;
  };
  for (let l = 0; l < o; l++) {
    const u = e.get(l);
    if (!(!u || u.length === 0))
      for (let h = 0; h < s; h++) {
        const p = r(l, h);
        if (!p) continue;
        const g = n.get(h);
        if (!g || g.length === 0) continue;
        const d = f(
          l,
          u,
          a,
          i.leftClasses,
          "kern_L"
        ), x = f(
          h,
          g,
          c,
          i.rightClasses,
          "kern_R"
        );
        i.pairs.push({ left: d, right: x, value: p });
      }
  }
  return i.pairs.length > 0 ? i : null;
}
function zl(t, e) {
  const n = t.GPOS, o = { pairs: [], classes: null };
  if (!n || n._raw || !n.featureList || !n.lookupList) return o;
  const s = /* @__PURE__ */ new Set();
  for (const a of n.featureList.featureRecords)
    if (a.featureTag === "kern")
      for (const c of a.feature.lookupListIndices)
        s.add(c);
  if (s.size === 0) return o;
  const r = [], i = [];
  for (const a of s) {
    const c = n.lookupList.lookups[a];
    if (!(!c || c.lookupType !== 2)) {
      for (const f of c.subtables)
        if (f.format === 1)
          Hl(f, e, r);
        else if (f.format === 2) {
          const l = Wl(f, e);
          l && i.push(l);
        }
    }
  }
  return { pairs: r, classes: i.length ? i : null };
}
function Hl(t, e, n) {
  const o = Ot(t.coverage);
  for (let s = 0; s < o.length && s < t.pairSets.length; s++) {
    const r = o[s], i = e[r]?.name || `glyph${r}`;
    for (const a of t.pairSets[s]) {
      const c = a.value1?.xAdvance;
      if (c === void 0 || c === 0) continue;
      const f = e[a.secondGlyph]?.name || `glyph${a.secondGlyph}`;
      n.push({ left: i, right: f, value: c });
    }
  }
}
function Wl(t, e) {
  const n = Qs(t.classDef1, e.length), o = Qs(t.classDef2, e.length), s = new Set(Ot(t.coverage)), r = /* @__PURE__ */ new Map();
  for (const a of s) {
    const c = n.get(a) ?? 0;
    r.has(c) || r.set(c, []), r.get(c).push(e[a]?.name || `glyph${a}`);
  }
  const i = /* @__PURE__ */ new Map();
  for (let a = 0; a < e.length; a++) {
    const c = o.get(a) ?? 0;
    i.has(c) || i.set(c, []), i.get(c).push(e[a]?.name || `glyph${a}`);
  }
  return vs({
    leftMembers: r,
    rightMembers: i,
    leftCount: t.class1Count,
    rightCount: t.class2Count,
    valueAt: (a, c) => t.class1Records[a]?.[c]?.value1?.xAdvance || 0
  });
}
function Ot(t) {
  if (t.format === 1) return t.glyphs;
  if (t.format === 2) {
    const e = [];
    for (const n of t.ranges)
      for (let o = n.startGlyphID; o <= n.endGlyphID; o++)
        e.push(o);
    return e;
  }
  return [];
}
function Qs(t, e) {
  const n = /* @__PURE__ */ new Map();
  if (t.format === 1)
    for (let o = 0; o < t.classValues.length; o++)
      n.set(t.startGlyphID + o, t.classValues[o]);
  else if (t.format === 2)
    for (const o of t.ranges)
      for (let s = o.startGlyphID; s <= o.endGlyphID; s++)
        n.set(s, o.class);
  return n;
}
function jl(t, e) {
  const n = t.kern;
  if (!n || n._raw || !n.subtables)
    return { pairs: [], classes: null };
  const o = [], s = [];
  for (const r of n.subtables)
    if (!r._raw)
      if (r.format === 0 && r.pairs)
        for (const i of r.pairs) {
          const a = e[i.left]?.name || `glyph${i.left}`, c = e[i.right]?.name || `glyph${i.right}`;
          o.push({
            left: a,
            right: c,
            value: i.value
          });
        }
      else if (r.format === 2 && r.values) {
        const i = Yl(r, e);
        i && s.push(i);
      } else if (r.format === 3 && r.kernValues) {
        const i = Zl(r, e);
        i && s.push(i);
      } else r.format === 1 && r.states && Xl(r, e, o);
  return { pairs: o, classes: s.length ? s : null };
}
function Yl(t, e) {
  const {
    leftClassTable: n,
    rightClassTable: o,
    rowWidth: s,
    kerningArrayOffset: r,
    values: i
  } = t;
  if (!i) return null;
  const a = s > 0 ? s / 2 : 0, c = /* @__PURE__ */ new Map();
  for (let l = 0; l < n.nGlyphs; l++) {
    const u = n.firstGlyph + l, h = n.offsets[l] || 0, p = s > 0 ? Math.floor((h - r) / s) : 0;
    p >= 0 && p < i.length && (c.has(p) || c.set(p, []), c.get(p).push(e[u]?.name || `glyph${u}`));
  }
  const f = /* @__PURE__ */ new Map();
  for (let l = 0; l < o.nGlyphs; l++) {
    const u = o.firstGlyph + l, h = o.offsets[l] || 0, p = Math.floor(h / 2);
    p >= 0 && p < a && (f.has(p) || f.set(p, []), f.get(p).push(e[u]?.name || `glyph${u}`));
  }
  return vs({
    leftMembers: c,
    rightMembers: f,
    leftCount: i.length,
    rightCount: a,
    valueAt: (l, u) => i[l]?.[u] || 0
  });
}
function Zl(t, e) {
  const {
    glyphCount: n,
    leftClassCount: o,
    rightClassCount: s,
    kernValues: r,
    leftClasses: i,
    rightClasses: a,
    kernIndices: c
  } = t, f = Math.min(n, e.length), l = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Map();
  for (let h = 0; h < f; h++) {
    const p = i[h];
    p < o && (l.has(p) || l.set(p, []), l.get(p).push(e[h]?.name || `glyph${h}`));
    const g = a[h];
    g < s && (u.has(g) || u.set(g, []), u.get(g).push(e[h]?.name || `glyph${h}`));
  }
  return vs({
    leftMembers: l,
    rightMembers: u,
    leftCount: o,
    rightCount: s,
    valueAt: (h, p) => {
      const g = c[h * s + p];
      return g === void 0 || g >= r.length ? 0 : r[g] || 0;
    }
  });
}
function Xl(t, e, n) {
  const {
    stateSize: o,
    classTable: s,
    states: r,
    entryTable: i,
    valueTable: a,
    stateArrayOffset: c
  } = t;
  if (!s || !r || !i || !a || r.length === 0 || o === 0) return;
  const f = /* @__PURE__ */ new Map();
  for (let u = 0; u < s.nGlyphs; u++) {
    const h = s.firstGlyph + u, p = s.classArray[u];
    p >= 4 && f.set(h, p);
  }
  const l = Array.from(f.keys());
  if (l.length !== 0)
    for (const u of l)
      for (const h of l) {
        const p = ql(
          u,
          h,
          f,
          r,
          i,
          a,
          o,
          c
        );
        if (p !== 0) {
          const g = e[u]?.name || `glyph${u}`, d = e[h]?.name || `glyph${h}`;
          n.push({ left: g, right: d, value: p });
        }
      }
}
function ql(t, e, n, o, s, r, i, a) {
  let c = 0, f = 0;
  const l = [], u = [t, e];
  for (const h of u) {
    const p = n.get(h) ?? 1;
    if (p >= i || c >= o.length) break;
    const g = o[c][p];
    if (g === void 0 || g >= s.length) break;
    const d = s[g], x = (d.flags & 32768) !== 0, y = d.flags & 16383;
    if (x && l.push(h), y > 0 && l.length > 0) {
      const w = Math.floor((y - (r._offset || 0)) / 2);
      for (let _ = 0; _ < l.length; _++) {
        const S = w + _;
        if (S >= 0 && S < r.length) {
          const b = r[S], A = (b & 1) !== 0;
          if (f += A ? b & -2 : b, A) break;
        }
      }
      l.length = 0;
    }
    const m = d.newStateOffset;
    c = i > 0 ? Math.floor((m - a) / i) : 0, (c < 0 || c >= o.length) && (c = 0);
  }
  return f;
}
function Kl(t) {
  const e = t.fvar;
  return !e || e._raw || !e.axes ? [] : e.axes.map((n) => ({
    tag: n.axisTag,
    name: we(t.name, n.axisNameID) || n.axisTag,
    min: n.minValue,
    default: n.defaultValue,
    max: n.maxValue,
    hidden: (n.flags & 1) !== 0
  }));
}
function Jl(t) {
  const e = t.fvar;
  if (!e || e._raw || !e.instances) return [];
  const n = e.axes;
  return e.instances.map((o) => {
    const s = {};
    for (let i = 0; i < n.length; i++)
      s[n[i].axisTag] = o.coordinates[i];
    const r = {
      name: we(t.name, o.subfamilyNameID) || `Instance ${o.subfamilyNameID}`,
      coordinates: s
    };
    if (o.postScriptNameID !== void 0) {
      const i = we(t.name, o.postScriptNameID);
      i && (r.postScriptName = i);
    }
    return r;
  });
}
const _a = {
  hasc: "ascender",
  hdsc: "descender",
  hlgp: "lineGap",
  hcla: "caretSlopeRise",
  hcld: "caretSlopeRun",
  hcof: "caretOffset",
  hcrn: "hCaretRun",
  hcrs: "hCaretRise",
  vasc: "vAscender",
  vdsc: "vDescender",
  vlgp: "vLineGap",
  xhgt: "xHeight",
  cpht: "capHeight",
  sbxs: "subscriptXSize",
  sbys: "subscriptYSize",
  sbxo: "subscriptXOffset",
  sbyo: "subscriptYOffset",
  spxs: "superscriptXSize",
  spys: "superscriptYSize",
  spxo: "superscriptXOffset",
  spyo: "superscriptYOffset",
  strs: "strikeoutSize",
  stro: "strikeoutOffset",
  unds: "underlineSize",
  undo: "underlineOffset",
  gsp0: "gaspRange0",
  gsp1: "gaspRange1",
  gsp2: "gaspRange2",
  gsp3: "gaspRange3",
  gsp4: "gaspRange4",
  gsp5: "gaspRange5",
  gsp6: "gaspRange6",
  gsp7: "gaspRange7",
  gsp8: "gaspRange8",
  gsp9: "gaspRange9"
}, Ql = Object.fromEntries(
  Object.entries(_a).map(([t, e]) => [e, t])
);
function tu(t) {
  const e = t.avar, n = t.fvar;
  if (!e || e._raw || !e.segmentMaps || !n || n._raw || !n.axes) return null;
  const o = {}, s = n.axes;
  for (let r = 0; r < e.segmentMaps.length && r < s.length; r++) {
    const i = e.segmentMaps[r];
    if (!i.axisValueMaps || i.axisValueMaps.length === 0) continue;
    const a = i.axisValueMaps;
    a.length === 3 && a[0].fromCoordinate === -1 && a[0].toCoordinate === -1 && a[1].fromCoordinate === 0 && a[1].toCoordinate === 0 && a[2].fromCoordinate === 1 && a[2].toCoordinate === 1 || (o[s[r].axisTag] = a.map((f) => ({
      from: f.fromCoordinate,
      to: f.toCoordinate
    })));
  }
  return Object.keys(o).length > 0 ? o : null;
}
function eu(t) {
  const e = t.STAT, n = t.fvar;
  if (!e || e._raw) return null;
  const o = e.designAxes || [], s = n?.axes || [], r = {};
  return e.elidedFallbackNameID !== void 0 && (r.elidedFallbackName = we(t.name, e.elidedFallbackNameID) || "Regular"), e.axisValues && e.axisValues.length > 0 && (r.values = e.axisValues.map((i) => {
    const a = (l) => l < o.length ? o[l].axisTag : l < s.length ? s[l].axisTag : `axis${l}`, f = { name: we(t.name, i.valueNameID) || "", flags: i.flags };
    switch (i.format) {
      case 1:
        return {
          ...f,
          axis: a(i.axisIndex),
          value: i.value
        };
      case 2:
        return {
          ...f,
          axis: a(i.axisIndex),
          range: [i.rangeMinValue, i.nominalValue, i.rangeMaxValue]
        };
      case 3:
        return {
          ...f,
          axis: a(i.axisIndex),
          value: i.value,
          linkedValue: i.linkedValue
        };
      case 4: {
        const l = {};
        for (const u of i.axisValues)
          l[a(u.axisIndex)] = u.value;
        return { ...f, values: l };
      }
      default:
        return { ...f, _raw: i };
    }
  })), r;
}
function nu(t) {
  const e = t.MVAR, n = t.fvar;
  if (!e || e._raw || !e.itemVariationStore || !n || n._raw || !n.axes) return null;
  const o = e.itemVariationStore, s = o.variationRegionList, r = n.axes, i = s.regions.map((c) => {
    const f = {};
    for (let l = 0; l < c.regionAxes.length && l < r.length; l++) {
      const u = c.regionAxes[l];
      u.startCoord === 0 && u.peakCoord === 0 && u.endCoord === 0 || (f[r[l].axisTag] = [u.startCoord, u.peakCoord, u.endCoord]);
    }
    return { axes: f };
  }), a = {};
  for (const c of e.valueRecords) {
    const f = _a[c.valueTag] || c.valueTag, l = c.deltaSetOuterIndex, u = c.deltaSetInnerIndex, h = o.itemVariationData[l];
    if (!h || u >= h.deltaSets.length) continue;
    const p = h.deltaSets[u], g = [];
    for (let d = 0; d < h.regionIndexes.length; d++) {
      const x = p[d];
      x !== 0 && g.push({ region: h.regionIndexes[d], delta: x });
    }
    g.length > 0 && (a[f] = g);
  }
  return Object.keys(a).length === 0 ? null : { regions: i, metrics: a };
}
const wa = Date.UTC(1904, 0, 1, 0, 0, 0);
function tr(t) {
  if (t == null) return;
  const e = typeof t == "bigint" ? t : BigInt(t);
  if (e === 0n) return;
  const n = Number(e) * 1e3 + wa;
  if (!(!Number.isFinite(n) || n < -864e13 || n > 864e13))
    return new Date(n).toISOString();
}
function er(t) {
  if (!t) return 0n;
  const e = Date.parse(t);
  return isNaN(e) ? 0n : BigInt(Math.floor((e - wa) / 1e3));
}
const ou = /* @__PURE__ */ new Set([1, 2, 3, 4, 8]);
function su(t, e) {
  const n = [], o = [];
  if (!t.featureList || !t.lookupList)
    return { substitutions: n, rawLookups: o };
  const s = ru(t), r = t.lookupList.lookups, i = /* @__PURE__ */ new Set();
  for (let a = 0; a < r.length; a++) {
    const c = r[a];
    if (c && ou.has(c.lookupType)) {
      const f = s.lookupToFeatures.get(a) || [], l = iu(f);
      for (const u of l) {
        const h = or(
          c,
          e,
          u.featureTag,
          u.script,
          u.language,
          u.allScripts
        );
        n.push(...h);
      }
      if (l.length === 0) {
        const u = or(
          c,
          e,
          "DFLT",
          "DFLT",
          null
        );
        n.push(...u);
      }
      i.add(a);
    }
  }
  for (let a = 0; a < r.length; a++)
    !i.has(a) && r[a] && o.push({
      index: a,
      lookup: r[a],
      features: s.lookupToFeatures.get(a) || []
    });
  return { substitutions: n, rawLookups: o };
}
function ru(t) {
  const e = /* @__PURE__ */ new Map(), n = t.scriptList?.scriptRecords || [], o = t.featureList?.featureRecords || [];
  for (const s of n) {
    const r = s.scriptTag, i = s.script;
    i.defaultLangSys && nr(
      i.defaultLangSys,
      r,
      null,
      o,
      e
    );
    for (const a of i.langSysRecords || [])
      nr(
        a.langSys,
        r,
        a.langSysTag,
        o,
        e
      );
  }
  return { lookupToFeatures: e };
}
function iu(t) {
  const e = /* @__PURE__ */ new Map();
  for (const n of t)
    e.has(n.featureTag) ? e.get(n.featureTag).allScripts.push({
      script: n.script,
      language: n.language
    }) : e.set(n.featureTag, {
      featureTag: n.featureTag,
      script: n.script,
      language: n.language,
      allScripts: [{ script: n.script, language: n.language }]
    });
  return Array.from(e.values());
}
function nr(t, e, n, o, s) {
  for (const r of t.featureIndices || []) {
    const i = o[r];
    if (i)
      for (const a of i.feature.lookupListIndices || []) {
        s.has(a) || s.set(a, []);
        const c = s.get(a);
        c.some(
          (l) => l.featureTag === i.featureTag && l.script === e && l.language === n
        ) || c.push({
          featureTag: i.featureTag,
          script: e,
          language: n
        });
      }
  }
}
function or(t, e, n, o, s, r) {
  const i = [], a = { feature: n, script: o, language: s };
  r && (a.allScripts = r);
  for (const c of t.subtables || [])
    switch (t.lookupType) {
      case 1:
        au(c, e, a, i);
        break;
      case 2:
        cu(c, e, a, i);
        break;
      case 3:
        fu(c, e, a, i);
        break;
      case 4:
        lu(c, e, a, i);
        break;
      case 8:
        uu(c, e, a, i);
        break;
    }
  return i;
}
function Q(t, e) {
  return t[e]?.name || `glyph${e}`;
}
function au(t, e, n, o) {
  const s = Ot(t.coverage);
  if (t.format === 1)
    for (const r of s) {
      const i = r + t.deltaGlyphID & 65535;
      o.push({
        type: "single",
        ...n,
        from: Q(e, r),
        to: Q(e, i)
      });
    }
  else if (t.format === 2)
    for (let r = 0; r < s.length; r++)
      o.push({
        type: "single",
        ...n,
        from: Q(e, s[r]),
        to: Q(e, t.substituteGlyphIDs[r])
      });
}
function cu(t, e, n, o) {
  const s = Ot(t.coverage);
  for (let r = 0; r < s.length; r++)
    o.push({
      type: "multiple",
      ...n,
      from: Q(e, s[r]),
      to: (t.sequences[r] || []).map((i) => Q(e, i))
    });
}
function fu(t, e, n, o) {
  const s = Ot(t.coverage);
  for (let r = 0; r < s.length; r++)
    o.push({
      type: "alternate",
      ...n,
      from: Q(e, s[r]),
      alternates: (t.alternateSets[r] || []).map(
        (i) => Q(e, i)
      )
    });
}
function lu(t, e, n, o) {
  const s = Ot(t.coverage);
  for (let r = 0; r < s.length; r++) {
    const i = t.ligatureSets[r] || [];
    for (const a of i) {
      const c = [
        Q(e, s[r]),
        ...a.componentGlyphIDs.map((f) => Q(e, f))
      ];
      o.push({
        type: "ligature",
        ...n,
        components: c,
        ligature: Q(e, a.ligatureGlyph)
      });
    }
  }
}
function uu(t, e, n, o) {
  const s = Ot(t.coverage);
  for (let r = 0; r < s.length; r++)
    o.push({
      type: "reverse",
      ...n,
      from: Q(e, s[r]),
      to: Q(e, t.substituteGlyphIDs[r]),
      backtrack: (t.backtrackCoverages || []).map(
        (i) => Ot(i).map((a) => Q(e, a))
      ),
      lookahead: (t.lookaheadCoverages || []).map(
        (i) => Ot(i).map((a) => Q(e, a))
      )
    });
}
function hu(t) {
  const e = t.CPAL;
  return !e || e._raw || !e.palettes ? null : e.palettes.map(
    (n) => n.map((o) => bs(o))
  );
}
function gu(t, e) {
  const n = t.COLR;
  if (!n || n._raw) return null;
  const o = ol(e), s = [];
  if (n.baseGlyphRecords)
    for (const r of n.baseGlyphRecords) {
      const i = o.get(r.glyphID) ?? String(r.glyphID), a = [];
      for (let c = 0; c < r.numLayers; c++) {
        const f = n.layerRecords[r.firstLayerIndex + c];
        f && a.push({
          glyph: o.get(f.glyphID) ?? String(f.glyphID),
          paletteIndex: f.paletteIndex
        });
      }
      s.push({ name: i, layers: a });
    }
  if (n.baseGlyphPaintRecords)
    for (const r of n.baseGlyphPaintRecords) {
      const i = o.get(r.glyphID) ?? String(r.glyphID), a = s.findIndex((f) => f.name === i), c = structuredClone(r.paint);
      On(c, o), a >= 0 ? s[a].paint = c : s.push({ name: i, paint: c });
    }
  return s;
}
function sr(t) {
  const { font: e, glyphs: n } = t, o = n.some(
    (g) => g.components && g.components.length > 0
  );
  let s = 0, r = 0;
  for (const g of n)
    g.charString ? s++ : g.contours && g.contours.length > 0 && !Jn(g.contours) && r++;
  const i = !o && s > 0 && s >= r, a = pu(n, e), c = {};
  if (c.head = mu(e, a), c.hhea = yu(e, a, n.length), c.maxp = xu(n, i), c["OS/2"] = Su(e, a), c.name = _u(e), t.tables?.name?.names) {
    const g = !!(t.axes && t.axes.length > 0);
    c.name = wu(
      c.name,
      t.tables.name,
      g
    );
  }
  c.post = Au(e, n, i), c.cmap = Cu(n), c.hmtx = Ou(n), i ? c["CFF "] = Fu(e, n) : (c.glyf = Tu(n), c.loca = { offsets: [] }), n.some((g) => g.advanceHeight !== void 0) && (c.vhea = ku(n), c.vmtx = Eu(n));
  const l = t._options?.kerningFormat || "gpos", u = t.kerning && t.kerning.length > 0, h = Array.isArray(t.kerningClasses) && t.kerningClasses.some(
    (g) => g && Array.isArray(g.pairs) && g.pairs.length > 0
  );
  if (u || h) {
    const g = l === "gpos" || l === "gpos+kern", d = l !== "gpos";
    if (g) {
      const x = t.features?.GPOS, y = x?.scriptList?.scriptRecords && x?.featureList?.featureRecords && x?.lookupList?.lookups;
      let m;
      if (h) {
        const w = Uu(
          t.kerningClasses,
          t.kerning || [],
          n
        );
        w.length > 0 ? m = y && zu(x, w) || Uo(w) : y && (m = x);
      } else y ? m = $u(x, t.kerning, n) : m = Oa(t.kerning, n);
      m && (c.GPOS = m);
    }
    if (d) {
      let x = t.kerning || [];
      h && (x = x.concat(
        Ea(t.kerningClasses, n)
      ));
      const y = Lu(
        x,
        n,
        l
      );
      y && (c.kern = y);
    }
  }
  if (t.axes && t.axes.length > 0 && (c.fvar = Hu(t, c.name), t.axisMapping && (c.avar = Yu(t)), t.axisStyles ? c.STAT = ju(t, c.name) : t.tables?.STAT || (c.STAT = Wu(t, c.name)), t.metricVariations && (c.MVAR = Zu(t))), t.gasp && (c.gasp = {
    version: 1,
    gaspRanges: t.gasp.map((g) => ({
      rangeMaxPPEM: g.maxPPEM,
      rangeGaspBehavior: g.behavior
    }))
  }), t.cvt && (c["cvt "] = { values: t.cvt }), t.fpgm && (c.fpgm = { instructions: t.fpgm }), t.prep && (c.prep = { instructions: t.prep }), t.features && (t.features.GPOS && !c.GPOS && (c.GPOS = t.features.GPOS), t.features.GDEF && (c.GDEF = t.features.GDEF)), t.substitutions && t.substitutions.length > 0 ? c.GSUB = qu(
    t.substitutions,
    t._rawGSUBLookups || [],
    n
  ) : t._rawGSUBLookups && t._rawGSUBLookups.length > 0 && (c.GSUB = Ku(t._rawGSUBLookups)), t.features?.GSUB && !c.GSUB && (c.GSUB = t.features.GSUB), t.palettes && t.palettes.length > 0 && (c.CPAL = ih(t.palettes)), t.colorGlyphs && t.colorGlyphs.length > 0 && (c.COLR = ah(t.colorGlyphs, n)), t.tables)
    for (const [g, d] of Object.entries(t.tables))
      c[g] || (c[g] = d);
  let p;
  if (t._header)
    p = { ...t._header, numTables: Object.keys(c).length };
  else {
    const g = Object.keys(c).length, d = Math.floor(Math.log2(g)), x = Math.pow(2, d) * 16, y = g * 16 - x;
    p = {
      sfVersion: i ? 1330926671 : 65536,
      numTables: g,
      searchRange: x,
      entrySelector: d,
      rangeShift: y
    };
  }
  return { header: p, tables: c };
}
function pu(t, e) {
  let n = 1 / 0, o = 1 / 0, s = -1 / 0, r = -1 / 0, i = 0, a = 0, c = 1 / 0, f = 1 / 0, l = -1 / 0, u = 65535, h = 0;
  const p = /* @__PURE__ */ new Set();
  for (const x of t) {
    const y = x.advanceWidth || 0;
    a += y, y > i && (i = y);
    const m = to(x);
    if (m) {
      m.xMin < n && (n = m.xMin), m.yMin < o && (o = m.yMin), m.xMax > s && (s = m.xMax), m.yMax > r && (r = m.yMax);
      const _ = x.leftSideBearing ?? m.xMin, S = y - (_ + (m.xMax - m.xMin)), b = _ + (m.xMax - m.xMin);
      _ < c && (c = _), S < f && (f = S), b > l && (l = b);
    }
    const w = x.unicodes || (x.unicode ? [x.unicode] : []);
    for (const _ of w)
      _ < u && (u = _), _ > h && (h = _), p.add(_);
  }
  n === 1 / 0 && (n = 0), o === 1 / 0 && (o = 0), s === -1 / 0 && (s = 0), r === -1 / 0 && (r = 0), c === 1 / 0 && (c = 0), f === 1 / 0 && (f = 0), l === -1 / 0 && (l = 0), u === 65535 && (u = 0), h === 0 && (h = 0);
  const g = rr(
    t,
    "xyvw",
    e.ascender ? Math.round(e.ascender / 2) : 0
  ), d = rr(
    t,
    "HIKLEFJMNTZBDPRAGOQSUVWXY",
    r
  );
  return {
    xMin: n,
    yMin: o,
    xMax: s,
    yMax: r,
    advanceWidthMax: i,
    advanceWidthAvg: t.length > 0 ? Math.round(a / t.length) : 0,
    minLSB: c,
    minRSB: f,
    maxExtent: l,
    firstCharIndex: Math.min(u, 65535),
    lastCharIndex: Math.min(h, 65535),
    sxHeight: g,
    sCapHeight: d,
    unicodeRanges: p
  };
}
function to(t) {
  if (t.contours && t.contours.length > 0) {
    let e = 1 / 0, n = 1 / 0, o = -1 / 0, s = -1 / 0, r = !1;
    for (const i of t.contours)
      for (const a of i) {
        const c = [
          [a.x, a.y],
          [a.x1, a.y1],
          [a.x2, a.y2]
        ];
        for (const [f, l] of c)
          typeof f == "number" && typeof l == "number" && (r = !0, f < e && (e = f), l < n && (n = l), f > o && (o = f), l > s && (s = l));
      }
    if (r) return { xMin: e, yMin: n, xMax: o, yMax: s };
  }
  return null;
}
function rr(t, e, n) {
  for (const o of e) {
    const s = o.charCodeAt(0), r = t.find((i) => (i.unicodes || (i.unicode ? [i.unicode] : [])).includes(s));
    if (r) {
      const i = to(r);
      if (i) return i.yMax;
    }
  }
  return n || 0;
}
function du(t) {
  const e = [0, 0, 0, 0], n = [
    // [bitPosition (0-127), rangeStart, rangeEnd]
    [0, 32, 126],
    // Basic Latin
    [1, 128, 255],
    // Latin-1 Supplement
    [2, 256, 383],
    // Latin Extended-A
    [3, 384, 591],
    // Latin Extended-B
    [7, 880, 1023],
    // Greek
    [9, 1024, 1279],
    // Cyrillic
    [10, 1328, 1423],
    // Armenian
    [11, 1424, 1535],
    // Hebrew
    [13, 1536, 1791],
    // Arabic
    [24, 3584, 3711],
    // Thai
    [28, 4352, 4607],
    // Hangul Jamo
    [30, 7680, 7935],
    // Latin Extended Additional
    [31, 7936, 8191],
    // Greek Extended
    [32, 8192, 8303],
    // General Punctuation
    [33, 8304, 8351],
    // Superscripts and Subscripts
    [34, 8352, 8399],
    // Currency Symbols
    [35, 8400, 8447],
    // Combining Diacritical Marks for Symbols
    [36, 8448, 8527],
    // Letterlike Symbols
    [37, 8528, 8591],
    // Number Forms
    [38, 8592, 8703],
    // Arrows
    [39, 8704, 8959],
    // Mathematical Operators
    [40, 8960, 9215],
    // Miscellaneous Technical
    [42, 9472, 9599],
    // Box Drawing
    [43, 9600, 9631],
    // Block Elements
    [44, 9632, 9727],
    // Geometric Shapes
    [45, 9728, 9983],
    // Miscellaneous Symbols
    [46, 9984, 10175],
    // Dingbats
    [48, 12288, 12351],
    // CJK Symbols and Punctuation
    [49, 12352, 12447],
    // Hiragana
    [50, 12448, 12543],
    // Katakana
    [52, 12544, 12591],
    // Bopomofo
    [56, 44032, 55215],
    // Hangul Syllables
    [57, 55296, 57343],
    // Surrogates (should not appear)
    [59, 19968, 40959],
    // CJK Unified Ideographs
    [60, 57344, 63743],
    // Private Use Area
    [62, 65056, 65071],
    // Combining Half Marks
    [69, 64336, 65023],
    // Arabic Presentation Forms-A
    [70, 65136, 65279],
    // Arabic Presentation Forms-B
    [78, 65280, 65519]
    // Halfwidth and Fullwidth Forms
  ];
  for (const [o, s, r] of n)
    for (const i of t)
      if (i >= s && i <= r) {
        const a = Math.floor(o / 32);
        e[a] |= 1 << o % 32;
        break;
      }
  return e;
}
function ba(t) {
  const e = t.isBold !== void 0 ? !!t.isBold : (t.weightClass || 400) === 700, n = t.isItalic !== void 0 ? !!t.isItalic : (t.italicAngle || 0) !== 0;
  return { isBold: e, isItalic: n };
}
function mu(t, e) {
  let n;
  if (t.macStyle !== void 0)
    n = t.macStyle;
  else {
    const { isBold: o, isItalic: s } = ba(t);
    n = 0, o && (n |= 1), s && (n |= 2);
  }
  return {
    majorVersion: 1,
    minorVersion: 0,
    fontRevision: 1,
    checksumAdjustment: 0,
    // will be overwritten by export
    magicNumber: 1594834165,
    flags: 11,
    // baseline at y=0, lsb at x=0, instructions may alter advance
    unitsPerEm: t.unitsPerEm,
    created: er(t.created),
    modified: er(t.modified),
    xMin: e.xMin,
    yMin: e.yMin,
    xMax: e.xMax,
    yMax: e.yMax,
    macStyle: n,
    lowestRecPPEM: 8,
    fontDirectionHint: 2,
    indexToLocFormat: 0,
    // coordinated by export.js for glyf/loca
    glyphDataFormat: 0
  };
}
function yu(t, e, n) {
  return {
    majorVersion: 1,
    minorVersion: 0,
    ascender: t.ascender || 0,
    descender: t.descender || 0,
    lineGap: t.lineGap || 0,
    advanceWidthMax: e.advanceWidthMax,
    minLeftSideBearing: e.minLSB,
    minRightSideBearing: e.minRSB,
    xMaxExtent: e.maxExtent,
    caretSlopeRise: 1,
    caretSlopeRun: 0,
    caretOffset: 0,
    reserved1: 0,
    reserved2: 0,
    reserved3: 0,
    reserved4: 0,
    metricDataFormat: 0,
    numberOfHMetrics: n
  };
}
function xu(t, e) {
  if (e)
    return {
      version: 20480,
      numGlyphs: t.length
    };
  let n = 0, o = 0;
  const s = 0, r = 0;
  let i = 0, a = 0, c = 0;
  for (const f of t) {
    if (f.contours) {
      let l = 0;
      for (const u of f.contours)
        l += u.length;
      l > n && (n = l), f.contours.length > o && (o = f.contours.length);
    }
    f.components && (f.components.length > i && (i = f.components.length), 1 > a && (a = 1)), f.instructions && f.instructions.length > c && (c = f.instructions.length);
  }
  return {
    version: 65536,
    numGlyphs: t.length,
    maxPoints: n,
    maxContours: o,
    maxCompositePoints: s,
    maxCompositeContours: r,
    maxZones: 2,
    maxTwilightPoints: 0,
    maxStorage: 0,
    maxFunctionDefs: 0,
    maxInstructionDefs: 0,
    maxStackElements: 0,
    maxSizeOfInstructions: c,
    maxComponentElements: i,
    maxComponentDepth: a
  };
}
function Su(t, e) {
  let n = t.fsSelection;
  if (n === void 0) {
    const { isBold: r, isItalic: i } = ba(t);
    n = 0, r && (n |= 32), i && (n |= 1), !r && !i && (n |= 64), n |= 128;
  }
  const o = du(e.unicodeRanges), s = e.unicodeRanges.has(32);
  return {
    version: 4,
    xAvgCharWidth: e.advanceWidthAvg,
    usWeightClass: t.weightClass || 400,
    usWidthClass: t.widthClass || 5,
    fsType: t.fsType || 0,
    ySubscriptXSize: Math.round((t.unitsPerEm || 1e3) * 0.65),
    ySubscriptYSize: Math.round((t.unitsPerEm || 1e3) * 0.6),
    ySubscriptXOffset: 0,
    ySubscriptYOffset: Math.round((t.unitsPerEm || 1e3) * 0.075),
    ySuperscriptXSize: Math.round((t.unitsPerEm || 1e3) * 0.65),
    ySuperscriptYSize: Math.round((t.unitsPerEm || 1e3) * 0.6),
    ySuperscriptXOffset: 0,
    ySuperscriptYOffset: Math.round((t.unitsPerEm || 1e3) * 0.35),
    yStrikeoutSize: Math.round((t.unitsPerEm || 1e3) * 0.05),
    yStrikeoutPosition: Math.round((t.unitsPerEm || 1e3) * 0.3),
    sFamilyClass: 0,
    panose: t.panose || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ulUnicodeRange1: o[0],
    ulUnicodeRange2: o[1],
    ulUnicodeRange3: o[2],
    ulUnicodeRange4: o[3],
    achVendID: t.achVendID || "XXXX",
    fsSelection: n,
    usFirstCharIndex: e.firstCharIndex,
    usLastCharIndex: e.lastCharIndex,
    sTypoAscender: t.ascender || 0,
    sTypoDescender: t.descender || 0,
    sTypoLineGap: t.lineGap || 0,
    usWinAscent: e.yMax > 0 ? e.yMax : t.ascender || 0,
    usWinDescent: e.yMin < 0 ? Math.abs(e.yMin) : 0,
    ulCodePageRange1: 1,
    ulCodePageRange2: 0,
    sxHeight: e.sxHeight,
    sCapHeight: e.sCapHeight,
    usDefaultChar: s ? 32 : 0,
    usBreakChar: s ? 32 : 0,
    usMaxContext: 0
  };
}
function _u(t) {
  const e = [], n = {
    0: t.copyright || "",
    1: t.familyName || "",
    2: t.styleName || "",
    3: t.uniqueID || bu(t),
    4: t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim(),
    5: t.version || "Version 1.000",
    6: t.postScriptName || Aa(t),
    7: t.trademark || "",
    8: t.manufacturer || "",
    9: t.designer || "",
    10: t.description || "",
    11: t.vendorURL || "",
    12: t.designerURL || "",
    13: t.license || "",
    14: t.licenseURL || "",
    19: t.sampleText || ""
  };
  t.typographicFamily && t.typographicFamily !== (t.familyName || "") && (n[16] = t.typographicFamily), t.typographicSubfamily && t.typographicSubfamily !== (t.styleName || "") && (n[17] = t.typographicSubfamily), t.wwsFamily && (n[21] = t.wwsFamily), t.wwsSubfamily && (n[22] = t.wwsSubfamily), t.variationsPostScriptNamePrefix && (n[25] = t.variationsPostScriptNamePrefix);
  for (const [o, s] of Object.entries(n)) {
    const r = Number(o);
    s && (e.push({
      platformID: 3,
      encodingID: 1,
      languageID: 1033,
      nameID: r,
      value: s
    }), e.push({
      platformID: 1,
      encodingID: 0,
      languageID: 0,
      nameID: r,
      value: s
    }), e.push({
      platformID: 0,
      encodingID: 3,
      languageID: 0,
      nameID: r,
      value: s
    }));
  }
  return { version: 0, names: e };
}
function wu(t, e, n) {
  if (!e?.names?.length) return t;
  const o = (a) => `${a.platformID},${a.encodingID},${a.languageID},${a.nameID}`, s = new Set(t.names.map(o)), r = t.names.slice();
  for (const a of e.names)
    n && a.nameID >= 256 || s.has(o(a)) || (r.push({
      platformID: a.platformID,
      encodingID: a.encodingID,
      languageID: a.languageID,
      nameID: a.nameID,
      value: a.value
    }), s.add(o(a)));
  const i = { version: t.version, names: r };
  return e.version === 1 && e.langTagRecords?.length && (i.version = 1, i.langTagRecords = e.langTagRecords.map((a) => ({
    ...a
  }))), i;
}
function bu(t) {
  const e = t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim();
  return t.manufacturer ? `${t.manufacturer}: ${e}` : e;
}
function Aa(t) {
  const e = (s) => (s || "").replace(/[^\x21-\x7e]/g, "").replace(/[[\](){}<>/%]/g, ""), n = e(t.familyName), o = e(t.styleName) || "Regular";
  return `${n}-${o}`.slice(0, 63);
}
function Au(t, e, n = !1) {
  const o = t.italicAngle || 0, s = t.underlinePosition || Math.round(-(t.unitsPerEm || 1e3) * 0.1), r = t.underlineThickness || Math.round((t.unitsPerEm || 1e3) * 0.05), i = {
    italicAngle: o,
    underlinePosition: s,
    underlineThickness: r,
    isFixedPitch: t.isFixedPitch ? 1 : 0,
    minMemType42: 0,
    maxMemType42: 0,
    minMemType1: 0,
    maxMemType1: 0
  };
  return n ? { version: 196608, ...i } : {
    version: 131072,
    ...i,
    glyphNames: e.map((a) => String(a.name ?? ".notdef"))
  };
}
function Cu(t) {
  const e = /* @__PURE__ */ new Map();
  let n = !1;
  for (let a = 0; a < t.length; a++) {
    const c = t[a], f = c.unicodes || (c.unicode != null ? [c.unicode] : []);
    for (const l of f)
      e.has(l) || e.set(l, a), l > 65535 && (n = !0);
  }
  const o = [...e.entries()].sort((a, c) => a[0] - c[0]), s = [], r = [];
  if (n) {
    const a = vu(o);
    s.push({ format: 12, language: 0, groups: a }), r.push({ platformID: 3, encodingID: 10, subtableIndex: 0 }), r.push({ platformID: 0, encodingID: 4, subtableIndex: 0 });
  }
  const i = o.filter(([a]) => a <= 65535);
  if (i.length > 0) {
    const { segments: a, glyphIdArray: c } = Iu(i), f = s.length;
    s.push({ format: 4, language: 0, segments: a, glyphIdArray: c }), r.push({ platformID: 3, encodingID: 1, subtableIndex: f }), r.push({ platformID: 0, encodingID: 3, subtableIndex: f });
  }
  return { version: 0, encodingRecords: r, subtables: s };
}
function vu(t) {
  if (t.length === 0) return [];
  const e = [];
  let n = t[0][0], o = t[0][1], s = n, r = o;
  for (let i = 1; i < t.length; i++) {
    const [a, c] = t[i];
    a === s + 1 && c === r + 1 ? (s = a, r = c) : (e.push({
      startCharCode: n,
      endCharCode: s,
      startGlyphID: o
    }), n = a, o = c, s = a, r = c);
  }
  return e.push({
    startCharCode: n,
    endCharCode: s,
    startGlyphID: o
  }), e;
}
function Iu(t) {
  const e = [], n = [];
  if (t.length === 0)
    return e.push({
      startCode: 65535,
      endCode: 65535,
      idDelta: 1,
      idRangeOffset: 0
    }), { segments: e, glyphIdArray: n };
  let o = t[0][0], s = t[0][1] - t[0][0], r = t[0][0];
  for (let i = 1; i < t.length; i++) {
    const [a, c] = t[i], f = c - a;
    a === r + 1 && f === s || (e.push({
      startCode: o,
      endCode: r,
      idDelta: s,
      idRangeOffset: 0
    }), o = a, s = f), r = a;
  }
  return e.push({
    startCode: o,
    endCode: r,
    idDelta: s,
    idRangeOffset: 0
  }), e.push({
    startCode: 65535,
    endCode: 65535,
    idDelta: 1,
    idRangeOffset: 0
  }), { segments: e, glyphIdArray: n };
}
function Ou(t) {
  return { hMetrics: t.map((n) => ({
    advanceWidth: n.advanceWidth || 0,
    lsb: n.leftSideBearing ?? 0
  })), leftSideBearings: [] };
}
function ku(t) {
  let e = 0, n = 1 / 0, o = 1 / 0, s = -1 / 0;
  for (const r of t) {
    const i = r.advanceHeight || 0;
    i > e && (e = i);
    const a = to(r);
    if (a) {
      const c = r.topSideBearing ?? 0, f = a.yMax - a.yMin, l = i - (c + f), u = c + f;
      c < n && (n = c), l < o && (o = l), u > s && (s = u);
    }
  }
  return n === 1 / 0 && (n = 0), o === 1 / 0 && (o = 0), s === -1 / 0 && (s = 0), {
    version: 69632,
    // v1.1
    vertTypoAscender: 0,
    vertTypoDescender: 0,
    vertTypoLineGap: 0,
    advanceHeightMax: e,
    minTopSideBearing: n,
    minBottomSideBearing: o,
    yMaxExtent: s,
    caretSlopeRise: 0,
    caretSlopeRun: 0,
    caretOffset: 0,
    reserved1: 0,
    reserved2: 0,
    reserved3: 0,
    reserved4: 0,
    metricDataFormat: 0,
    numOfLongVerMetrics: t.length
  };
}
function Eu(t) {
  return { vMetrics: t.map((n) => ({
    advanceHeight: n.advanceHeight || 0,
    topSideBearing: n.topSideBearing ?? 0
  })), topSideBearings: [] };
}
function Tu(t) {
  const e = /* @__PURE__ */ new Map();
  for (let o = 0; o < t.length; o++) {
    const s = t[o] && t[o].name;
    s != null && !e.has(s) && e.set(s, o);
  }
  return { glyphs: t.map((o) => {
    if (o.contours && o.contours.length > 0) {
      const s = Jn(o.contours) ? o.contours.map(pa) : o.contours, r = to({ contours: s });
      return {
        type: "simple",
        xMin: r ? r.xMin : 0,
        yMin: r ? r.yMin : 0,
        xMax: r ? r.xMax : 0,
        yMax: r ? r.yMax : 0,
        contours: s,
        instructions: o.instructions || [],
        overlapSimple: !1
      };
    }
    return o.components && o.components.length > 0 ? {
      type: "composite",
      xMin: 0,
      yMin: 0,
      xMax: 0,
      yMax: 0,
      components: o.components.map(
        (r) => _l(r, e)
      ),
      instructions: o.instructions || []
    } : null;
  }) };
}
function Du(t) {
  const e = Math.round(t);
  if (e >= -107 && e <= 107) return [e + 139];
  if (e >= 108 && e <= 1131) {
    const o = e - 108;
    return [(o >> 8 & 255) + 247, o & 255];
  }
  if (e >= -1131 && e <= -108) {
    const o = -e - 108;
    return [(o >> 8 & 255) + 251, o & 255];
  }
  const n = e < 0 ? e + 65536 : e;
  return [28, n >> 8 & 255, n & 255];
}
function Ca(t, e, n = {}) {
  if (!Number.isFinite(e)) return t;
  const {
    globalSubrs: o = [],
    localSubrs: s = [],
    nominalWidthX: r = 0,
    defaultWidthX: i = 0
  } = n;
  if (!Ru(t)) return t;
  let a = null;
  try {
    a = Qn(t, o, s);
  } catch {
    return t;
  }
  if (a.width !== null && a.width !== void 0 || !a.contours || a.contours.length === 0 || e === i) return t;
  const c = Du(e - r), f = new Array(c.length + t.length);
  for (let l = 0; l < c.length; l++) f[l] = c[l];
  for (let l = 0; l < t.length; l++)
    f[c.length + l] = t[l];
  return f;
}
function Ru(t) {
  if (!t || t.length === 0) return !1;
  let e = 0;
  for (; e < t.length; ) {
    const n = t[e];
    if (n === 14) return !0;
    if (n >= 32 && n <= 246) {
      e += 1;
      continue;
    }
    if (n >= 247 && n <= 254) {
      e += 2;
      continue;
    }
    if (n === 28) {
      e += 3;
      continue;
    }
    if (n === 255) {
      e += 5;
      continue;
    }
    e += n === 12 ? 2 : 1;
  }
  return !1;
}
function Fu(t, e) {
  const n = t.postScriptName || Aa(t), o = e.slice(1).map((p) => p.name || ".notdef"), s = e.map((p) => {
    const g = Number.isFinite(p.advanceWidth) ? p.advanceWidth : void 0;
    return p.charString && p.charString.length > 0 ? Ca(p.charString, g) : qe(p.contours || [], g);
  }), r = [];
  function i(p) {
    const g = 391 + r.length;
    return r.push(p), g;
  }
  const a = t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim(), c = t.familyName || "", f = Mu(t.weightClass), l = o.map((p) => i(p)), u = t.unitsPerEm || 1e3, h = {
    FullName: i(a),
    FamilyName: i(c),
    Weight: i(f),
    FontBBox: [0, t.descender || 0, u, t.ascender || 0]
  };
  if (u !== 1e3) {
    const p = 1 / u;
    h.FontMatrix = [p, 0, 0, p, 0, 0];
  }
  return {
    majorVersion: 1,
    minorVersion: 0,
    names: [n],
    strings: r,
    globalSubrs: [],
    fonts: [
      {
        topDict: h,
        charset: l,
        encoding: [],
        charStrings: s,
        privateDict: {},
        localSubrs: []
      }
    ]
  };
}
function Mu(t) {
  return !t || t <= 400 ? "Regular" : t <= 500 ? "Medium" : t <= 600 ? "SemiBold" : t <= 700 ? "Bold" : t <= 800 ? "ExtraBold" : "Black";
}
function ir(t, e) {
  const n = /* @__PURE__ */ new Map();
  for (let c = 0; c < e.length; c++)
    e[c].name && n.set(e[c].name, c);
  const o = [];
  for (const c of t) {
    const f = n.get(c.left), l = n.get(c.right);
    f !== void 0 && l !== void 0 && o.push({ left: f, right: l, value: c.value });
  }
  if (o.length === 0) return null;
  const s = o.length, r = Math.floor(Math.log2(s)), i = Math.pow(2, r) * 6, a = s * 6 - i;
  return {
    formatVariant: "opentype",
    version: 0,
    nTables: 1,
    subtables: [
      {
        version: 0,
        coverage: 1,
        format: 0,
        nPairs: s,
        searchRange: i,
        entrySelector: r,
        rangeShift: a,
        pairs: o
      }
    ]
  };
}
function Oe(t, e) {
  const n = /* @__PURE__ */ new Map();
  for (let s = 0; s < e.length; s++)
    e[s].name && n.set(e[s].name, s);
  const o = [];
  for (const s of t) {
    const r = n.get(s.left), i = n.get(s.right);
    r !== void 0 && i !== void 0 && o.push({ left: r, right: i, value: s.value });
  }
  return { pairs: o, nameToIndex: n };
}
function Lu(t, e, n) {
  switch (n) {
    case "kern-ot-f0":
    case "gpos+kern":
      return ir(t, e);
    case "kern-ot-f2":
      return Bu(t, e);
    case "kern-apple-f0":
      return va(t, e);
    case "kern-apple-f3":
      return Vu(t, e);
    default:
      return ir(t, e);
  }
}
function Bu(t, e) {
  const { pairs: n } = Oe(t, e);
  if (n.length === 0) return null;
  const {
    leftClasses: o,
    rightClasses: s,
    valueMatrix: r,
    leftGlyphToClass: i,
    rightGlyphToClass: a
  } = Ia(n), c = o.length, f = s.length, l = f * 2, u = 8, h = Array.from(i.keys()).sort((O, I) => O - I), p = Array.from(a.keys()).sort(
    (O, I) => O - I
  ), g = h.length > 0 ? h[0] : 0, d = h.length > 0 ? h[h.length - 1] - g + 1 : 0, x = p.length > 0 ? p[0] : 0, y = p.length > 0 ? p[p.length - 1] - x + 1 : 0, m = 4 + d * 2, w = 4 + y * 2, _ = u, S = _ + m, b = S + w, A = [];
  for (let O = 0; O < d; O++) {
    const I = g + O, E = i.get(I) ?? 0;
    A.push(b + E * l);
  }
  const k = [];
  for (let O = 0; O < y; O++) {
    const I = x + O, E = a.get(I) ?? 0;
    k.push(E * 2);
  }
  return {
    formatVariant: "opentype",
    version: 0,
    nTables: 1,
    subtables: [
      {
        version: 0,
        coverage: 513,
        // format 2, horizontal
        format: 2,
        rowWidth: l,
        leftOffsetTable: _,
        rightOffsetTable: S,
        kerningArrayOffset: b,
        leftClassTable: {
          firstGlyph: g,
          nGlyphs: d,
          offsets: A
        },
        rightClassTable: {
          firstGlyph: x,
          nGlyphs: y,
          offsets: k
        },
        nLeftClasses: c,
        nRightClasses: f,
        values: r
      }
    ]
  };
}
function va(t, e) {
  const { pairs: n } = Oe(t, e);
  if (n.length === 0) return null;
  const o = n.length, s = Math.floor(Math.log2(o)), r = Math.pow(2, s) * 6, i = o * 6 - r;
  return {
    formatVariant: "apple",
    version: 65536,
    nTables: 1,
    subtables: [
      {
        coverage: 0,
        // horizontal
        format: 0,
        tupleIndex: 0,
        nPairs: o,
        searchRange: r,
        entrySelector: s,
        rangeShift: i,
        pairs: n
      }
    ]
  };
}
function Vu(t, e) {
  const { pairs: n } = Oe(t, e);
  if (n.length === 0) return null;
  const {
    leftClasses: o,
    rightClasses: s,
    valueMatrix: r,
    leftGlyphToClass: i,
    rightGlyphToClass: a
  } = Ia(n), c = o.length, f = s.length, l = /* @__PURE__ */ new Set();
  l.add(0);
  for (const y of r)
    for (const m of y)
      l.add(m);
  if (c > 255 || f > 255 || l.size > 255)
    return va(t, e);
  const u = Array.from(l).sort((y, m) => y - m), h = /* @__PURE__ */ new Map();
  for (let y = 0; y < u.length; y++)
    h.set(u[y], y);
  const p = e.length, g = new Array(p).fill(0), d = new Array(p).fill(0);
  for (const [y, m] of i)
    y < p && (g[y] = m);
  for (const [y, m] of a)
    y < p && (d[y] = m);
  const x = [];
  for (let y = 0; y < c; y++)
    for (let m = 0; m < f; m++) {
      const w = r[y]?.[m] || 0;
      x.push(h.get(w) ?? 0);
    }
  return {
    formatVariant: "apple",
    version: 65536,
    nTables: 1,
    subtables: [
      {
        coverage: 0,
        format: 3,
        tupleIndex: 0,
        glyphCount: p,
        kernValueCount: u.length,
        leftClassCount: c,
        rightClassCount: f,
        flags: 0,
        kernValues: u,
        leftClasses: g,
        rightClasses: d,
        kernIndices: x
      }
    ]
  };
}
function Ia(t) {
  const e = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Set();
  for (const { left: y, right: m, value: w } of t)
    e.has(y) || e.set(y, /* @__PURE__ */ new Map()), e.get(y).set(m, w), n.add(m);
  const o = /* @__PURE__ */ new Map();
  for (const [y, m] of e) {
    const w = Array.from(m.entries()).sort((_, S) => _[0] - S[0]);
    o.set(y, w.map((_) => `${_[0]}:${_[1]}`).join(","));
  }
  const s = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  let i = 1;
  for (const [y, m] of o)
    s.has(m) || s.set(m, i++), r.set(y, s.get(m));
  const a = /* @__PURE__ */ new Map();
  for (const { left: y, right: m, value: w } of t)
    a.has(m) || a.set(m, /* @__PURE__ */ new Map()), a.get(m).set(y, w);
  const c = /* @__PURE__ */ new Map();
  for (const [y, m] of a) {
    const w = Array.from(m.entries()).sort((_, S) => _[0] - S[0]);
    c.set(y, w.map((_) => `${_[0]}:${_[1]}`).join(","));
  }
  const f = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Map();
  let u = 1;
  for (const [y, m] of c)
    f.has(m) || f.set(m, u++), l.set(y, f.get(m));
  const h = i, p = u, g = [];
  for (let y = 0; y < h; y++)
    g.push(new Array(p).fill(0));
  for (const { left: y, right: m, value: w } of t) {
    const _ = r.get(y) ?? 0, S = l.get(m) ?? 0;
    g[_][S] = w;
  }
  const d = Array.from({ length: h }, (y, m) => m), x = Array.from({ length: p }, (y, m) => m);
  return {
    leftClasses: d,
    rightClasses: x,
    valueMatrix: g,
    leftGlyphToClass: r,
    rightGlyphToClass: l
  };
}
function Oa(t, e) {
  const { pairs: n } = Oe(t, e);
  return n.length === 0 ? null : Uo([Is(n)]);
}
function Uo(t) {
  if (!t || t.length === 0) return null;
  const e = t.map((n, o) => o);
  return {
    majorVersion: 1,
    minorVersion: 0,
    scriptList: {
      scriptRecords: [
        {
          scriptTag: "DFLT",
          script: {
            defaultLangSys: {
              lookupOrderOffset: 0,
              requiredFeatureIndex: 65535,
              featureIndices: [0]
            },
            langSysRecords: []
          }
        }
      ]
    },
    featureList: {
      featureRecords: [
        {
          featureTag: "kern",
          feature: {
            featureParamsOffset: 0,
            lookupListIndices: e
          }
        }
      ]
    },
    lookupList: {
      lookups: t
    }
  };
}
function $u(t, e, n) {
  const { pairs: o } = Oe(e, n), s = JSON.parse(JSON.stringify(t));
  if (!s.scriptList?.scriptRecords || !s.featureList?.featureRecords || !s.lookupList?.lookups)
    return Oa(e, n);
  if (o.length === 0) return s;
  const r = Is(o), i = /* @__PURE__ */ new Set();
  for (const f of s.featureList.featureRecords)
    if (f.featureTag === "kern")
      for (const l of f.feature.lookupListIndices)
        i.add(l);
  let a;
  if (i.size > 0) {
    const f = [...i].sort((l, u) => l - u);
    a = f[0], s.lookupList.lookups[a] = r;
    for (let l = f.length - 1; l > 0; l--)
      s.lookupList.lookups.splice(f[l], 1);
    if (f.length > 1) {
      const l = f.slice(1);
      ka(s, l);
    }
  } else
    a = s.lookupList.lookups.length, s.lookupList.lookups.push(r);
  let c = !1;
  for (const f of s.featureList.featureRecords)
    f.featureTag === "kern" && (f.feature.lookupListIndices = [a], c = !0);
  if (!c) {
    s.featureList.featureRecords.push({
      featureTag: "kern",
      feature: {
        featureParamsOffset: 0,
        lookupListIndices: [a]
      }
    });
    const f = s.featureList.featureRecords.length - 1;
    for (const l of s.scriptList.scriptRecords) {
      l.script.defaultLangSys && l.script.defaultLangSys.featureIndices.push(f);
      for (const u of l.script.langSysRecords || [])
        u.langSys.featureIndices.push(f);
    }
  }
  return s;
}
function ka(t, e) {
  function n(o) {
    let s = 0;
    for (const r of e)
      if (r < o) s++;
      else break;
    return o - s;
  }
  for (const o of t.featureList.featureRecords)
    o.feature.lookupListIndices = o.feature.lookupListIndices.filter((s) => !e.includes(s)).map(n);
}
function Is(t) {
  const e = /* @__PURE__ */ new Map();
  for (const { left: s, right: r, value: i } of t)
    e.has(s) || e.set(s, []), e.get(s).push({ secondGlyph: r, value1: { xAdvance: i }, value2: null });
  const n = Array.from(e.keys()).sort((s, r) => s - r), o = n.map((s) => {
    const r = e.get(s);
    return r.sort((i, a) => i.secondGlyph - a.secondGlyph), r;
  });
  return {
    lookupType: 2,
    lookupFlag: 0,
    subtables: [
      {
        format: 1,
        coverage: { format: 1, glyphs: n },
        valueFormat1: 4,
        // xAdvance
        valueFormat2: 0,
        pairSets: o
      }
    ]
  };
}
function ar(t) {
  const e = Array.from(t.entries()).sort(
    (o, s) => o[0] - s[0]
  ), n = [];
  for (const [o, s] of e) {
    const r = n[n.length - 1];
    r && r.class === s && o === r.endGlyphID + 1 ? r.endGlyphID = o : n.push({ startGlyphID: o, endGlyphID: o, class: s });
  }
  return { format: 2, ranges: n };
}
function Nu(t) {
  const e = [];
  for (let n = 0; n < t.length; n++) {
    const o = t[n], s = e[e.length - 1];
    s && o === s.endGlyphID + 1 ? s.endGlyphID = o : e.push({ startGlyphID: o, endGlyphID: o, startCoverageIndex: n });
  }
  return { format: 2, ranges: e };
}
function Gu(t, e, n) {
  if (typeof t == "string" && t.startsWith("@")) {
    const s = e[t.slice(1)];
    if (!s) return [];
    const r = [];
    for (const i of s) {
      const a = n.get(i);
      a !== void 0 && r.push(a);
    }
    return r;
  }
  const o = n.get(t);
  return o !== void 0 ? [o] : [];
}
function Pu(t, e) {
  const n = /* @__PURE__ */ new Map();
  for (let m = 0; m < e.length; m++)
    e[m].name && n.set(e[m].name, m);
  const { leftClasses: o = {}, rightClasses: s = {}, pairs: r = [] } = t, i = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), c = [null], f = [null];
  function l(m, w, _, S) {
    if (_.has(m)) return _.get(m);
    const b = S.length;
    return S.push(Gu(m, w, n)), _.set(m, b), b;
  }
  const u = [];
  for (const m of r) {
    if (!m || !m.value) continue;
    const w = l(m.left, o, i, c), _ = l(
      m.right,
      s,
      a,
      f
    );
    u.push({ lc: w, rc: _, value: m.value });
  }
  const h = c.length, p = f.length;
  if (h <= 1 || p <= 1 || u.length === 0) return null;
  const g = /* @__PURE__ */ new Map(), d = /* @__PURE__ */ new Map();
  for (let m = 1; m < h; m++)
    for (const w of c[m]) {
      if (g.has(w) && g.get(w) !== m) return null;
      g.set(w, m);
    }
  for (let m = 1; m < p; m++)
    for (const w of f[m]) {
      if (d.has(w) && d.get(w) !== m) return null;
      d.set(w, m);
    }
  if (g.size === 0 || d.size === 0) return null;
  const x = [];
  for (let m = 0; m < h; m++) {
    const w = [];
    for (let _ = 0; _ < p; _++)
      w.push({ value1: { xAdvance: 0 }, value2: null });
    x.push(w);
  }
  for (const { lc: m, rc: w, value: _ } of u)
    x[m][w].value1.xAdvance = _;
  const y = Array.from(g.keys()).sort((m, w) => m - w);
  return {
    lookupType: 2,
    lookupFlag: 0,
    subtables: [
      {
        format: 2,
        coverage: Nu(y),
        valueFormat1: 4,
        // xAdvance
        valueFormat2: 0,
        classDef1: ar(g),
        classDef2: ar(d),
        class1Count: h,
        class2Count: p,
        class1Records: x
      }
    ]
  };
}
function Ea(t, e) {
  if (!Array.isArray(t)) return [];
  const n = /* @__PURE__ */ new Set();
  for (const r of e) r.name && n.add(r.name);
  function o(r, i) {
    if (typeof r == "string" && r.startsWith("@")) {
      const a = i[r.slice(1)];
      return a ? a.filter((c) => n.has(c)) : [];
    }
    return n.has(r) ? [r] : [];
  }
  const s = [];
  for (const r of t) {
    if (!r || !Array.isArray(r.pairs)) continue;
    const { leftClasses: i = {}, rightClasses: a = {}, pairs: c = [] } = r;
    for (const f of c) {
      if (!f || !f.value) continue;
      const l = o(f.left, i), u = o(f.right, a);
      for (const h of l)
        for (const p of u)
          s.push({ left: h, right: p, value: f.value });
    }
  }
  return s;
}
function Uu(t, e, n) {
  const o = [];
  let s = e ? [...e] : [];
  const r = Array.isArray(t) ? t : [];
  for (const i of r) {
    if (!i || !Array.isArray(i.pairs) || i.pairs.length === 0)
      continue;
    const a = Pu(i, n);
    a ? o.push(a) : s = s.concat(Ea([i], n));
  }
  if (s.length > 0) {
    const { pairs: i } = Oe(s, n);
    i.length > 0 && o.push(Is(i));
  }
  return o;
}
function zu(t, e) {
  if (!e || e.length === 0) return null;
  const n = JSON.parse(JSON.stringify(t));
  if (!n.scriptList?.scriptRecords || !n.featureList?.featureRecords || !n.lookupList?.lookups)
    return null;
  const o = /* @__PURE__ */ new Set();
  for (const a of n.featureList.featureRecords)
    if (a.featureTag === "kern")
      for (const c of a.feature.lookupListIndices) o.add(c);
  const s = [...o].sort((a, c) => a - c);
  for (let a = s.length - 1; a >= 0; a--)
    n.lookupList.lookups.splice(s[a], 1);
  s.length > 0 && ka(n, s);
  const r = [];
  for (const a of e)
    r.push(n.lookupList.lookups.length), n.lookupList.lookups.push(a);
  let i = !1;
  for (const a of n.featureList.featureRecords)
    a.featureTag === "kern" && (a.feature.lookupListIndices = [...r], i = !0);
  if (!i) {
    n.featureList.featureRecords.push({
      featureTag: "kern",
      feature: { featureParamsOffset: 0, lookupListIndices: [...r] }
    });
    const a = n.featureList.featureRecords.length - 1;
    for (const c of n.scriptList.scriptRecords) {
      c.script.defaultLangSys && c.script.defaultLangSys.featureIndices.push(a);
      for (const f of c.script.langSysRecords || [])
        f.langSys.featureIndices.push(a);
    }
  }
  return n;
}
function Hu(t, e) {
  const { axes: n, instances: o = [] } = t;
  let s = 256;
  const r = n.map((a) => {
    const c = s++;
    return kt(e, c, a.name || a.tag), {
      axisTag: a.tag,
      minValue: a.min,
      defaultValue: a.default,
      maxValue: a.max,
      flags: a.hidden ? 1 : 0,
      axisNameID: c
    };
  }), i = o.map((a) => {
    const c = s++;
    kt(e, c, a.name);
    const f = n.map((u) => a.coordinates[u.tag] ?? u.default), l = {
      subfamilyNameID: c,
      flags: 0,
      coordinates: f
    };
    if (a.postScriptName) {
      const u = s++;
      kt(e, u, a.postScriptName), l.postScriptNameID = u;
    }
    return l;
  });
  return {
    majorVersion: 1,
    minorVersion: 0,
    reserved: 2,
    axisSize: 20,
    instanceSize: 4 + n.length * 4 + (i.some((a) => a.postScriptNameID !== void 0) ? 2 : 0),
    axes: r,
    instances: i
  };
}
function kt(t, e, n) {
  n && t.names.push(
    { platformID: 3, encodingID: 1, languageID: 1033, nameID: e, value: n },
    { platformID: 1, encodingID: 0, languageID: 0, nameID: e, value: n },
    { platformID: 0, encodingID: 3, languageID: 0, nameID: e, value: n }
  );
}
function Wu(t, e) {
  const { axes: n } = t;
  let o = 256;
  for (const a of e.names)
    a.nameID >= o && (o = a.nameID + 1);
  const s = n.map((a) => {
    const c = o++;
    return kt(e, c, a.name || a.tag), {
      axisTag: a.tag,
      axisNameID: c,
      axisOrdering: 0
    };
  }), r = [];
  for (let a = 0; a < n.length; a++) {
    const c = n[a], f = o++, l = c.name || c.tag;
    kt(e, f, l), r.push({
      format: 1,
      axisIndex: a,
      flags: 2,
      valueNameID: f,
      value: c.default
    });
  }
  const i = o++;
  return kt(e, i, "Regular"), {
    majorVersion: 1,
    minorVersion: 1,
    designAxes: s,
    axisValues: r,
    elidedFallbackNameID: i
  };
}
function ju(t, e) {
  const { axes: n, axisStyles: o } = t;
  let s = 256;
  for (const f of e.names)
    f.nameID >= s && (s = f.nameID + 1);
  const r = n.map((f) => {
    const l = s++;
    return kt(e, l, f.name || f.tag), {
      axisTag: f.tag,
      axisNameID: l,
      axisOrdering: 0
    };
  }), i = {};
  for (let f = 0; f < n.length; f++)
    i[n[f].tag] = f;
  const a = [];
  if (o.values)
    for (const f of o.values) {
      const l = s++;
      if (kt(e, l, f.name || ""), f._raw)
        a.push({ ...f._raw, valueNameID: l });
      else if (f.values) {
        const u = Object.entries(f.values).map(([h, p]) => ({
          axisIndex: i[h] ?? 0,
          value: p
        }));
        a.push({
          format: 4,
          axisCount: u.length,
          flags: f.flags ?? 0,
          valueNameID: l,
          axisValues: u
        });
      } else f.range ? a.push({
        format: 2,
        axisIndex: i[f.axis] ?? 0,
        flags: f.flags ?? 0,
        valueNameID: l,
        nominalValue: f.range[1],
        rangeMinValue: f.range[0],
        rangeMaxValue: f.range[2]
      }) : f.linkedValue !== void 0 ? a.push({
        format: 3,
        axisIndex: i[f.axis] ?? 0,
        flags: f.flags ?? 0,
        valueNameID: l,
        value: f.value,
        linkedValue: f.linkedValue
      }) : a.push({
        format: 1,
        axisIndex: i[f.axis] ?? 0,
        flags: f.flags ?? 0,
        valueNameID: l,
        value: f.value
      });
    }
  const c = s++;
  return kt(
    e,
    c,
    o.elidedFallbackName || "Regular"
  ), {
    majorVersion: 1,
    minorVersion: 1,
    designAxes: r,
    axisValues: a,
    elidedFallbackNameID: c
  };
}
function Yu(t) {
  const { axes: e, axisMapping: n } = t;
  return {
    majorVersion: 1,
    minorVersion: 0,
    reserved: 0,
    segmentMaps: e.map((s) => {
      const r = n[s.tag];
      return !r || r.length === 0 ? {
        positionMapCount: 3,
        axisValueMaps: [
          { fromCoordinate: -1, toCoordinate: -1 },
          { fromCoordinate: 0, toCoordinate: 0 },
          { fromCoordinate: 1, toCoordinate: 1 }
        ]
      } : {
        positionMapCount: r.length,
        axisValueMaps: r.map((i) => ({
          fromCoordinate: i.from,
          toCoordinate: i.to
        }))
      };
    })
  };
}
function Zu(t) {
  const { axes: e, metricVariations: n } = t, { regions: o, metrics: s } = n, r = {};
  for (let S = 0; S < e.length; S++)
    r[e[S].tag] = S;
  const i = o.map((S) => {
    const b = [];
    for (let A = 0; A < e.length; A++) {
      const k = e[A].tag;
      if (S.axes[k]) {
        const [O, I, E] = S.axes[k];
        b.push({ startCoord: O, peakCoord: I, endCoord: E });
      } else
        b.push({ startCoord: 0, peakCoord: 0, endCoord: 0 });
    }
    return { regionAxes: b };
  }), a = /* @__PURE__ */ new Set();
  for (const S of Object.values(s))
    for (const b of S)
      a.add(b.region);
  const c = [...a].sort((S, b) => S - b), f = /* @__PURE__ */ new Map();
  for (let S = 0; S < c.length; S++)
    f.set(c[S], S);
  const l = Object.entries(s), u = [], h = [];
  for (const [S, b] of l) {
    const A = Ql[S] || S, k = new Array(c.length).fill(0);
    for (const O of b) {
      const I = f.get(O.region);
      I !== void 0 && (k[I] = O.delta);
    }
    u.push(k), h.push({
      valueTag: A,
      deltaSetOuterIndex: 0,
      deltaSetInnerIndex: u.length - 1
    });
  }
  const p = 32768;
  let g = !1;
  for (const S of u) {
    for (const b of S)
      if (b < -32768 || b > 32767) {
        g = !0;
        break;
      }
    if (g) break;
  }
  const d = [], x = [];
  for (let S = 0; S < c.length; S++) {
    let b = !1;
    for (const A of u) {
      const k = A[S];
      if (g ? k < -32768 || k > 32767 : k < -128 || k > 127) {
        b = !0;
        break;
      }
    }
    (b ? d : x).push(S);
  }
  const y = [...d, ...x], m = y.map((S) => c[S]), w = u.map((S) => y.map((b) => S[b])), _ = g ? d.length | p : d.length;
  return {
    majorVersion: 1,
    minorVersion: 0,
    reserved: 0,
    valueRecordSize: 8,
    valueRecords: h,
    itemVariationStore: {
      format: 1,
      variationRegionList: {
        axisCount: e.length,
        regions: i
      },
      itemVariationData: [
        {
          itemCount: w.length,
          wordDeltaCount: _,
          regionIndexes: m,
          deltaSets: w
        }
      ]
    }
  };
}
function Xu(t) {
  const e = /* @__PURE__ */ new Map();
  for (let n = 0; n < t.length; n++)
    t[n].name && e.set(t[n].name, n);
  return e;
}
function rt(t, e, n) {
  if (typeof t == "string" && n.has(t))
    return n.get(t);
  const o = Ft(e, t);
  if (o !== void 0)
    return n.get(o);
}
function qu(t, e, n) {
  const o = Xu(n), s = [], r = /* @__PURE__ */ new Map(), i = Ju(t);
  for (const [h, p] of i) {
    const [g, d] = h.split("\0"), x = Qu(g, p, n, o);
    if (!x) continue;
    const y = s.length;
    s.push(x), r.has(d) || r.set(d, {
      lookupIndices: /* @__PURE__ */ new Set(),
      scripts: /* @__PURE__ */ new Map()
    });
    const m = r.get(d);
    m.lookupIndices.add(y);
    for (const w of p) {
      const _ = w.allScripts || [
        { script: w.script, language: w.language }
      ];
      for (const S of _) {
        const b = S.script || "DFLT", A = S.language || null;
        m.scripts.has(b) || m.scripts.set(b, /* @__PURE__ */ new Set()), m.scripts.get(b).add(A);
      }
    }
  }
  const a = /* @__PURE__ */ new Map();
  for (const h of e) {
    a.set(h.index, s.length), s.push(h.lookup);
    for (const p of h.features) {
      const g = p.featureTag;
      r.has(g) || r.set(g, {
        lookupIndices: /* @__PURE__ */ new Set(),
        scripts: /* @__PURE__ */ new Map()
      });
      const d = r.get(g);
      d.lookupIndices.add(s.length - 1);
      const x = p.script || "DFLT", y = p.language || null;
      d.scripts.has(x) || d.scripts.set(x, /* @__PURE__ */ new Set()), d.scripts.get(x).add(y);
    }
  }
  a.size > 0 && Ta(s, a);
  const c = [], f = /* @__PURE__ */ new Map();
  for (const [h, p] of r)
    f.set(h, c.length), c.push({
      featureTag: h,
      feature: {
        featureParamsOffset: 0,
        lookupListIndices: Array.from(p.lookupIndices).sort(
          (g, d) => g - d
        )
      }
    });
  const l = /* @__PURE__ */ new Map();
  for (const [h, p] of r) {
    const g = f.get(h);
    for (const [d, x] of p.scripts) {
      l.has(d) || l.set(d, /* @__PURE__ */ new Map());
      const y = l.get(d);
      for (const m of x)
        y.has(m) || y.set(m, /* @__PURE__ */ new Set()), y.get(m).add(g);
    }
  }
  const u = [];
  for (const [h, p] of l) {
    const g = [];
    let d = null;
    for (const [x, y] of p) {
      const m = {
        lookupOrderOffset: 0,
        requiredFeatureIndex: 65535,
        featureIndices: Array.from(y).sort((w, _) => w - _)
      };
      x === null ? d = m : g.push({
        langSysTag: x,
        langSys: m
      });
    }
    if (!d) {
      const x = /* @__PURE__ */ new Set();
      for (const [, y] of p)
        for (const m of y) x.add(m);
      d = {
        lookupOrderOffset: 0,
        requiredFeatureIndex: 65535,
        featureIndices: Array.from(x).sort((y, m) => y - m)
      };
    }
    u.push({
      scriptTag: h,
      script: {
        defaultLangSys: d,
        langSysRecords: g
      }
    });
  }
  return {
    majorVersion: 1,
    minorVersion: 0,
    scriptList: { scriptRecords: u },
    featureList: { featureRecords: c },
    lookupList: { lookups: s }
  };
}
function Ku(t) {
  const e = [], n = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map();
  for (const c of t) {
    o.set(c.index, e.length), e.push(c.lookup);
    for (const f of c.features) {
      const l = f.featureTag;
      n.has(l) || n.set(l, {
        lookupIndices: /* @__PURE__ */ new Set(),
        scripts: /* @__PURE__ */ new Map()
      });
      const u = n.get(l);
      u.lookupIndices.add(e.length - 1);
      const h = f.script || "DFLT", p = f.language || null;
      u.scripts.has(h) || u.scripts.set(h, /* @__PURE__ */ new Set()), u.scripts.get(h).add(p);
    }
  }
  o.size > 0 && Ta(e, o);
  const s = [], r = /* @__PURE__ */ new Map();
  for (const [c, f] of n)
    r.set(c, s.length), s.push({
      featureTag: c,
      feature: {
        featureParamsOffset: 0,
        lookupListIndices: Array.from(f.lookupIndices).sort(
          (l, u) => l - u
        )
      }
    });
  const i = /* @__PURE__ */ new Map();
  for (const [c, f] of n) {
    const l = r.get(c);
    for (const [u, h] of f.scripts) {
      i.has(u) || i.set(u, /* @__PURE__ */ new Map());
      const p = i.get(u);
      for (const g of h)
        p.has(g) || p.set(g, /* @__PURE__ */ new Set()), p.get(g).add(l);
    }
  }
  const a = [];
  for (const [c, f] of i) {
    let l = null;
    const u = [];
    for (const [h, p] of f) {
      const g = {
        lookupOrderOffset: 0,
        requiredFeatureIndex: 65535,
        featureIndices: Array.from(p).sort((d, x) => d - x)
      };
      h === null ? l = g : u.push({ langSysTag: h, langSys: g });
    }
    if (!l) {
      const h = /* @__PURE__ */ new Set();
      for (const [, p] of f)
        for (const g of p) h.add(g);
      l = {
        lookupOrderOffset: 0,
        requiredFeatureIndex: 65535,
        featureIndices: Array.from(h).sort((p, g) => p - g)
      };
    }
    a.push({
      scriptTag: c,
      script: { defaultLangSys: l, langSysRecords: u }
    });
  }
  return {
    majorVersion: 1,
    minorVersion: 0,
    scriptList: { scriptRecords: a },
    featureList: { featureRecords: s },
    lookupList: { lookups: e }
  };
}
function Ju(t) {
  const e = /* @__PURE__ */ new Map();
  for (const n of t) {
    const o = `${n.type}\0${n.feature}`;
    e.has(o) || e.set(o, []), e.get(o).push(n);
  }
  return e;
}
function Qu(t, e, n, o) {
  switch (t) {
    case "single":
      return th(e, n, o);
    case "multiple":
      return eh(e, n, o);
    case "alternate":
      return nh(e, n, o);
    case "ligature":
      return oh(e, n, o);
    case "reverse":
      return sh(e, n, o);
    default:
      return null;
  }
}
function th(t, e, n) {
  const o = [], s = [];
  for (const i of t) {
    const a = rt(i.from, e, n), c = rt(i.to, e, n);
    a !== void 0 && c !== void 0 && (o.push(a), s.push(c));
  }
  if (o.length === 0) return null;
  const r = o.map((i, a) => ({ from: i, to: s[a] })).sort((i, a) => i.from - a.from);
  return {
    lookupType: 1,
    lookupFlag: 0,
    subtables: [
      {
        format: 2,
        coverage: { format: 1, glyphs: r.map((i) => i.from) },
        substituteGlyphIDs: r.map((i) => i.to)
      }
    ]
  };
}
function eh(t, e, n) {
  const o = [];
  for (const s of t) {
    const r = rt(s.from, e, n);
    if (r === void 0) continue;
    const i = [];
    let a = !0;
    for (const c of s.to) {
      const f = rt(c, e, n);
      if (f === void 0) {
        a = !1;
        break;
      }
      i.push(f);
    }
    a && i.length > 0 && o.push({ from: r, to: i });
  }
  return o.length === 0 ? null : (o.sort((s, r) => s.from - r.from), {
    lookupType: 2,
    lookupFlag: 0,
    subtables: [
      {
        format: 1,
        coverage: { format: 1, glyphs: o.map((s) => s.from) },
        sequences: o.map((s) => s.to)
      }
    ]
  });
}
function nh(t, e, n) {
  const o = [];
  for (const s of t) {
    const r = rt(s.from, e, n);
    if (r === void 0) continue;
    const i = [];
    let a = !0;
    for (const c of s.alternates) {
      const f = rt(c, e, n);
      if (f === void 0) {
        a = !1;
        break;
      }
      i.push(f);
    }
    a && i.length > 0 && o.push({ from: r, alternates: i });
  }
  return o.length === 0 ? null : (o.sort((s, r) => s.from - r.from), {
    lookupType: 3,
    lookupFlag: 0,
    subtables: [
      {
        format: 1,
        coverage: { format: 1, glyphs: o.map((s) => s.from) },
        alternateSets: o.map((s) => s.alternates)
      }
    ]
  });
}
function oh(t, e, n) {
  const o = /* @__PURE__ */ new Map();
  for (const i of t) {
    if (!i.components || i.components.length < 2) continue;
    const a = rt(i.components[0], e, n), c = rt(i.ligature, e, n);
    if (a === void 0 || c === void 0) continue;
    const f = [];
    let l = !0;
    for (let u = 1; u < i.components.length; u++) {
      const h = rt(i.components[u], e, n);
      if (h === void 0) {
        l = !1;
        break;
      }
      f.push(h);
    }
    l && (o.has(a) || o.set(a, []), o.get(a).push({
      ligatureGlyph: c,
      componentCount: i.components.length,
      componentGlyphIDs: f
    }));
  }
  if (o.size === 0) return null;
  const s = Array.from(o.keys()).sort((i, a) => i - a), r = s.map((i) => o.get(i));
  return {
    lookupType: 4,
    lookupFlag: 0,
    subtables: [
      {
        format: 1,
        coverage: { format: 1, glyphs: s },
        ligatureSets: r
      }
    ]
  };
}
function sh(t, e, n) {
  const o = [];
  for (const s of t) {
    const r = rt(s.from, e, n), i = rt(s.to, e, n);
    if (r === void 0 || i === void 0) continue;
    const a = (s.backtrack || []).map((f) => ({ format: 1, glyphs: f.map((u) => rt(u, e, n)).filter((u) => u !== void 0).sort((u, h) => u - h) })), c = (s.lookahead || []).map((f) => ({ format: 1, glyphs: f.map((u) => rt(u, e, n)).filter((u) => u !== void 0).sort((u, h) => u - h) }));
    o.push({
      format: 1,
      coverage: { format: 1, glyphs: [r] },
      backtrackCoverages: a,
      lookaheadCoverages: c,
      substituteGlyphIDs: [i]
    });
  }
  return o.length === 0 ? null : {
    lookupType: 8,
    lookupFlag: 0,
    subtables: o
  };
}
function Ta(t, e) {
  for (const n of t)
    if (!(!n || !n.subtables) && !(n.lookupType !== 5 && n.lookupType !== 6))
      for (const o of n.subtables)
        rh(o, e);
}
function rh(t, e) {
  if (t.ruleSets) {
    for (const n of t.ruleSets)
      if (n)
        for (const o of n)
          Le(o.seqLookupRecords, e);
  }
  if (t.classSets) {
    for (const n of t.classSets)
      if (n)
        for (const o of n)
          Le(o.seqLookupRecords, e);
  }
  if (t.seqLookupRecords && Le(t.seqLookupRecords, e), t.chainedRuleSets) {
    for (const n of t.chainedRuleSets)
      if (n)
        for (const o of n)
          Le(o.seqLookupRecords, e);
  }
  if (t.chainedClassSets) {
    for (const n of t.chainedClassSets)
      if (n)
        for (const o of n)
          Le(o.seqLookupRecords, e);
  }
}
function Le(t, e) {
  if (t)
    for (const n of t) {
      const o = e.get(n.lookupListIndex);
      o !== void 0 && (n.lookupListIndex = o);
    }
}
function ih(t) {
  if (!t || t.length === 0) return null;
  const e = t[0].length, n = t.map(
    (o) => o.map((s) => ws(s))
  );
  return {
    version: 0,
    numPaletteEntries: e,
    palettes: n
  };
}
function ah(t, e) {
  if (!t || t.length === 0) return null;
  const n = sl(e), o = (h) => n.get(h) ?? 0, s = t.some((h) => h.paint), r = t.filter((h) => h.layers), i = [], a = [], c = r.map((h) => ({ ...h, glyphID: o(h.name) })).sort((h, p) => h.glyphID - p.glyphID);
  for (const h of c) {
    const p = a.length;
    for (const g of h.layers)
      a.push({
        glyphID: o(g.glyph),
        paletteIndex: g.paletteIndex
      });
    i.push({
      glyphID: h.glyphID,
      firstLayerIndex: p,
      numLayers: h.layers.length
    });
  }
  if (!s)
    return {
      version: 0,
      baseGlyphRecords: i,
      layerRecords: a
    };
  const f = t.filter((h) => h.paint), l = [], u = f.map((h) => ({ ...h, glyphID: o(h.name) })).sort((h, p) => h.glyphID - p.glyphID);
  for (const h of u) {
    const p = structuredClone(h.paint);
    kn(p, n), l.push({
      glyphID: h.glyphID,
      paint: p
    });
  }
  return {
    version: 1,
    baseGlyphRecords: i,
    layerRecords: a,
    baseGlyphPaintRecords: l,
    layerPaints: [],
    clipList: null,
    varIndexMap: null,
    itemVariationStore: null
  };
}
function ch(t, e, n = !0) {
  const o = t[e];
  if (o >= 32 && o <= 246)
    return { value: o - 139, bytesConsumed: 1 };
  if (o >= 247 && o <= 250) {
    const s = t[e + 1];
    return { value: (o - 247) * 256 + s + 108, bytesConsumed: 2 };
  }
  if (o >= 251 && o <= 254) {
    const s = t[e + 1];
    return { value: -(o - 251) * 256 - s - 108, bytesConsumed: 2 };
  }
  if (o === 28) {
    const s = t[e + 1] << 8 | t[e + 2];
    return { value: s > 32767 ? s - 65536 : s, bytesConsumed: 3 };
  }
  return o === 29 && n ? { value: t[e + 1] << 24 | t[e + 2] << 16 | t[e + 3] << 8 | t[e + 4] | 0, bytesConsumed: 5 } : o === 30 && n ? fh(t, e + 1) : o === 255 && !n ? { value: (t[e + 1] << 24 | t[e + 2] << 16 | t[e + 3] << 8 | t[e + 4] | 0) / 65536, bytesConsumed: 5 } : null;
}
function fh(t, e) {
  const n = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    ".",
    "E",
    "E-",
    "",
    "-",
    ""
  ];
  let o = "", s = e, r = !1;
  for (; !r; ) {
    const a = t[s++], c = a >> 4 & 15, f = a & 15;
    c === 15 ? r = !0 : (o += n[c], f === 15 ? r = !0 : o += n[f]);
  }
  return { value: o === "" || o === "." ? 0 : parseFloat(o), bytesConsumed: 1 + (s - e) };
}
function Da(t) {
  return Number.isInteger(t) ? lh(t) : uh(t);
}
function lh(t) {
  if (t >= -107 && t <= 107)
    return [t + 139];
  if (t >= 108 && t <= 1131) {
    const e = t - 108;
    return [247 + (e >> 8 & 3), e & 255];
  }
  if (t >= -1131 && t <= -108) {
    const e = -t - 108;
    return [251 + (e >> 8 & 3), e & 255];
  }
  return t >= -32768 && t <= 32767 ? [28, t >> 8 & 255, t & 255] : [
    29,
    t >> 24 & 255,
    t >> 16 & 255,
    t >> 8 & 255,
    t & 255
  ];
}
function uh(t) {
  const e = [30];
  let n = t.toString();
  (n.includes("e") || n.includes("E")) && (n = t.toPrecision(10), n.includes(".") && (n = n.replace(/0+$/, "").replace(/\.$/, "")));
  const o = [];
  for (const s of n)
    switch (s) {
      case "0":
        o.push(0);
        break;
      case "1":
        o.push(1);
        break;
      case "2":
        o.push(2);
        break;
      case "3":
        o.push(3);
        break;
      case "4":
        o.push(4);
        break;
      case "5":
        o.push(5);
        break;
      case "6":
        o.push(6);
        break;
      case "7":
        o.push(7);
        break;
      case "8":
        o.push(8);
        break;
      case "9":
        o.push(9);
        break;
      case ".":
        o.push(10);
        break;
      case "E":
      case "e":
        o.push(11);
        break;
      case "-":
        o.push(14);
        break;
    }
  for (let s = 0; s < o.length - 1; s++)
    o[s] === 11 && o[s + 1] === 14 && o.splice(s, 2, 12);
  o.push(15);
  for (let s = 0; s < o.length; s += 2) {
    const r = o[s], i = s + 1 < o.length ? o[s + 1] : 15;
    e.push(r << 4 | i);
  }
  return e;
}
function hh(t) {
  return t <= 27;
}
function jt(t, e = 0, n = t.length) {
  const o = [], s = [];
  let r = e;
  for (; r < n; ) {
    const i = t[r];
    if (hh(i)) {
      let a;
      i === 12 ? (a = 3072 | t[r + 1], r += 2) : (a = i, r += 1), o.push({ operator: a, operands: [...s] }), s.length = 0;
    } else {
      const a = ch(t, r, !0);
      a === null ? r += 1 : (s.push(a.value), r += a.bytesConsumed);
    }
  }
  return o;
}
function Mt(t, e) {
  const n = t[e] << 8 | t[e + 1];
  if (n === 0)
    return { items: [], totalBytes: 2 };
  const o = t[e + 2], s = e + 3, r = [];
  for (let f = 0; f <= n; f++) {
    let l = 0;
    const u = s + f * o;
    for (let h = 0; h < o; h++)
      l = l << 8 | t[u + h];
    r.push(l);
  }
  const i = s + (n + 1) * o, a = [];
  for (let f = 0; f < n; f++) {
    const l = i + r[f] - 1, u = i + r[f + 1] - 1;
    a.push(new Uint8Array(Array.prototype.slice.call(t, l, u)));
  }
  const c = i + r[n] - 1 - e;
  return { items: a, totalBytes: c };
}
function dn(t, e) {
  const o = (t[e] << 24 | t[e + 1] << 16 | t[e + 2] << 8 | t[e + 3]) >>> 0;
  if (o === 0)
    return { items: [], totalBytes: 4 };
  const s = t[e + 4], r = e + 5, i = [];
  for (let l = 0; l <= o; l++) {
    let u = 0;
    const h = r + l * s;
    for (let p = 0; p < s; p++)
      u = u << 8 | t[h + p];
    i.push(u >>> 0);
  }
  const a = r + (o + 1) * s, c = [];
  for (let l = 0; l < o; l++) {
    const u = a + i[l] - 1, h = a + i[l + 1] - 1;
    c.push(new Uint8Array(Array.prototype.slice.call(t, u, h)));
  }
  const f = a + i[o] - 1 - e;
  return { items: c, totalBytes: f };
}
function Dt(t) {
  const e = t.length;
  if (e === 0)
    return [0, 0];
  const n = [1];
  for (const i of t)
    n.push(n[n.length - 1] + i.length);
  const o = n[n.length - 1];
  let s;
  o <= 255 ? s = 1 : o <= 65535 ? s = 2 : o <= 16777215 ? s = 3 : s = 4;
  const r = [];
  r.push(e >> 8 & 255, e & 255), r.push(s);
  for (const i of n)
    for (let a = s - 1; a >= 0; a--)
      r.push(i >> a * 8 & 255);
  for (const i of t)
    for (let a = 0; a < i.length; a++)
      r.push(i[a]);
  return r;
}
function mn(t) {
  const e = t.length;
  if (e === 0)
    return [0, 0, 0, 0];
  const n = [1];
  for (const i of t)
    n.push(n[n.length - 1] + i.length);
  const o = n[n.length - 1];
  let s;
  o <= 255 ? s = 1 : o <= 65535 ? s = 2 : o <= 16777215 ? s = 3 : s = 4;
  const r = [];
  r.push(
    e >> 24 & 255,
    e >> 16 & 255,
    e >> 8 & 255,
    e & 255
  ), r.push(s);
  for (const i of n)
    for (let a = s - 1; a >= 0; a--)
      r.push(i >> a * 8 & 255);
  for (const i of t)
    for (let a = 0; a < i.length; a++)
      r.push(i[a]);
  return r;
}
const zo = {
  0: "version",
  1: "Notice",
  2: "FullName",
  3: "FamilyName",
  4: "Weight",
  5: "FontBBox",
  13: "UniqueID",
  14: "XUID",
  15: "charset",
  16: "Encoding",
  17: "CharStrings",
  18: "Private",
  // Two-byte operators (12, x)
  3072: "Copyright",
  3073: "isFixedPitch",
  3074: "ItalicAngle",
  3075: "UnderlinePosition",
  3076: "UnderlineThickness",
  3077: "PaintType",
  3078: "CharstringType",
  3079: "FontMatrix",
  3080: "StrokeWidth",
  3092: "SyntheticBase",
  3093: "PostScript",
  3094: "BaseFontName",
  3095: "BaseFontBlend",
  // CIDFont operators
  3102: "ROS",
  3103: "CIDFontVersion",
  3104: "CIDFontRevision",
  3105: "CIDFontType",
  3106: "CIDCount",
  3107: "UIDBase",
  3108: "FDArray",
  3109: "FDSelect",
  3110: "FontName"
}, gt = Object.fromEntries(
  Object.entries(zo).map(([t, e]) => [e, Number(t)])
), Ho = {
  6: "BlueValues",
  7: "OtherBlues",
  8: "FamilyBlues",
  9: "FamilyOtherBlues",
  10: "StdHW",
  11: "StdVW",
  19: "Subrs",
  20: "defaultWidthX",
  21: "nominalWidthX",
  3081: "BlueScale",
  3082: "BlueShift",
  3083: "BlueFuzz",
  3084: "StemSnapH",
  3085: "StemSnapV",
  3086: "ForceBold",
  3089: "LanguageGroup",
  3090: "ExpansionFactor",
  3091: "initialRandomSeed"
}, cr = Object.fromEntries(
  Object.entries(Ho).map(([t, e]) => [e, Number(t)])
), Wo = {
  17: "CharStrings",
  24: "VariationStore",
  3079: "FontMatrix",
  3108: "FDArray",
  3109: "FDSelect"
}, fe = Object.fromEntries(
  Object.entries(Wo).map(([t, e]) => [e, Number(t)])
), Ra = {
  18: "Private"
}, Fa = {
  6: "BlueValues",
  7: "OtherBlues",
  8: "FamilyBlues",
  9: "FamilyOtherBlues",
  10: "StdHW",
  11: "StdVW",
  19: "Subrs",
  22: "vsindex",
  23: "blend",
  3081: "BlueScale",
  3082: "BlueShift",
  3083: "BlueFuzz",
  3084: "StemSnapH",
  3085: "StemSnapV",
  3089: "LanguageGroup",
  3090: "ExpansionFactor"
};
function Yt(t, e) {
  const n = {};
  for (const { operator: o, operands: s } of t) {
    const r = e[o] || `op_${o}`;
    n[r] = s.length === 1 ? s[0] : s;
  }
  return n;
}
function be(t, e) {
  const n = [];
  for (const [o, s] of Object.entries(t)) {
    const r = e[o];
    if (r === void 0) continue;
    const i = Array.isArray(s) ? s : [s];
    n.push({ operator: r, operands: i });
  }
  return n;
}
function Ma(t, e, n) {
  const o = t[e];
  if (o === 0) {
    const s = [];
    for (let r = 0; r < n; r++)
      s.push(t[e + 1 + r]);
    return s;
  }
  if (o === 3) {
    const s = t[e + 1] << 8 | t[e + 2], r = new Array(n);
    let i = e + 3;
    for (let a = 0; a < s; a++) {
      const c = t[i] << 8 | t[i + 1], f = t[i + 2];
      i += 3;
      const l = a < s - 1 ? t[i] << 8 | t[i + 1] : n;
      for (let u = c; u < l; u++)
        r[u] = f;
    }
    return r;
  }
  if (o === 4) {
    const s = (t[e + 1] << 24 | t[e + 2] << 16 | t[e + 3] << 8 | t[e + 4]) >>> 0, r = new Array(n);
    let i = e + 5;
    for (let a = 0; a < s; a++) {
      const c = (t[i] << 24 | t[i + 1] << 16 | t[i + 2] << 8 | t[i + 3]) >>> 0, f = t[i + 4] << 8 | t[i + 5];
      i += 6;
      const l = a < s - 1 ? (t[i] << 24 | t[i + 1] << 16 | t[i + 2] << 8 | t[i + 3]) >>> 0 : n;
      for (let u = c; u < l; u++)
        r[u] = f;
    }
    return r;
  }
  throw new Error(`Unsupported FDSelect format: ${o}`);
}
function La(t) {
  const e = [0];
  for (const n of t)
    e.push(n);
  return e;
}
function gh(t, e, n) {
  if (e === 0) return "ISOAdobe";
  if (e === 1) return "Expert";
  if (e === 2) return "ExpertSubset";
  const o = t[e], s = [];
  if (o === 0)
    for (let r = 1; r < n; r++) {
      const i = t[e + 1 + (r - 1) * 2] << 8 | t[e + 2 + (r - 1) * 2];
      s.push(i);
    }
  else if (o === 1) {
    let r = e + 1;
    for (; s.length < n - 1; ) {
      const i = t[r] << 8 | t[r + 1], a = t[r + 2];
      r += 3;
      for (let c = 0; c <= a && s.length < n - 1; c++)
        s.push(i + c);
    }
  } else if (o === 2) {
    let r = e + 1;
    for (; s.length < n - 1; ) {
      const i = t[r] << 8 | t[r + 1], a = t[r + 2] << 8 | t[r + 3];
      r += 4;
      for (let c = 0; c <= a && s.length < n - 1; c++)
        s.push(i + c);
    }
  }
  return s;
}
function ph(t) {
  if (typeof t == "string")
    return [];
  const e = [0];
  for (const n of t)
    e.push(n >> 8 & 255, n & 255);
  return e;
}
function dh(t, e) {
  if (e === 0) return "Standard";
  if (e === 1) return "Expert";
  const n = t[e] & 127, o = (t[e] & 128) !== 0, s = [];
  if (n === 0) {
    const r = t[e + 1];
    for (let i = 0; i < r; i++)
      s.push(t[e + 2 + i]);
  } else if (n === 1) {
    const r = t[e + 1];
    let i = e + 2;
    for (let a = 0; a < r; a++) {
      const c = t[i], f = t[i + 1];
      i += 2;
      for (let l = 0; l <= f; l++)
        s.push(c + l);
    }
  }
  return { format: n, codes: s, hasSupplement: o };
}
const Ba = /* @__PURE__ */ new Set([
  15,
  // charset
  16,
  // Encoding
  17,
  // CharStrings
  18,
  // Private  (size + offset — both forced)
  3108,
  // FDArray
  3109
  // FDSelect
]), fr = /* @__PURE__ */ new Set([
  19
  // Subrs  (relative offset from Private start)
]);
function En(t, e) {
  const n = [];
  for (const { operator: o, operands: s } of t) {
    const r = e.has(o);
    for (const i of s)
      r && Number.isInteger(i) ? n.push(
        29,
        i >>> 24 & 255,
        i >>> 16 & 255,
        i >>> 8 & 255,
        i & 255
      ) : n.push(...Da(i));
    o >= 3072 ? n.push(12, o & 255) : n.push(o);
  }
  return n;
}
function lr(t) {
  const e = [];
  for (let n = 0; n < t.length; n++) e.push(t.charCodeAt(n));
  return e;
}
function ur(t) {
  return String.fromCharCode(...t);
}
function Va(t, e) {
  const n = new Uint8Array(t), o = n[0], s = n[1];
  let i = n[2];
  const a = Mt(n, i);
  i += a.totalBytes;
  const c = a.items.map(ur), f = Mt(n, i);
  i += f.totalBytes;
  const l = Mt(n, i);
  i += l.totalBytes;
  const u = l.items.map(ur), p = Mt(n, i).items.map((d) => Array.from(d)), g = f.items.map((d) => mh(n, d));
  return {
    majorVersion: o,
    minorVersion: s,
    names: c,
    strings: u,
    globalSubrs: p,
    fonts: g
  };
}
function mh(t, e) {
  const n = jt(e, 0, e.length), o = Yt(n, zo), s = o.CharStrings, r = o.charset ?? 0, i = o.Encoding ?? 0, a = o.Private;
  delete o.CharStrings, delete o.charset, delete o.Encoding, delete o.Private;
  const c = o.FDArray, f = o.FDSelect;
  delete o.FDArray, delete o.FDSelect;
  let l = [];
  s !== void 0 && (l = Mt(t, s).items.map((S) => Array.from(S)));
  const u = l.length, h = gh(t, r, u), p = dh(t, i);
  let g = {}, d = [];
  if (Array.isArray(a) && a.length === 2) {
    const [_, S] = a, b = jt(t, S, S + _);
    g = Yt(b, Ho), g.Subrs !== void 0 && (d = Mt(t, S + g.Subrs).items.map((k) => Array.from(k)), delete g.Subrs);
  }
  const x = o.ROS !== void 0;
  let y, m;
  x && (c !== void 0 && (y = Mt(t, c).items.map((S) => {
    const b = jt(S, 0, S.length), A = Yt(b, zo);
    let k = {}, O = [];
    if (Array.isArray(A.Private) && A.Private.length === 2) {
      const [I, E] = A.Private, T = jt(t, E, E + I);
      k = Yt(T, Ho), k.Subrs !== void 0 && (O = Mt(t, E + k.Subrs).items.map((R) => Array.from(R)), delete k.Subrs), delete A.Private;
    }
    return {
      fontDict: A,
      privateDict: k,
      localSubrs: O
    };
  })), f !== void 0 && (m = Ma(t, f, u)));
  const w = {
    topDict: o,
    charset: h,
    encoding: p,
    charStrings: l,
    privateDict: g,
    localSubrs: d
  };
  return x && (w.isCIDFont = !0, y && (w.fdArray = y), m && (w.fdSelect = m)), w;
}
function $a(t) {
  const {
    majorVersion: e = 1,
    minorVersion: n = 0,
    names: o = [],
    strings: s = [],
    globalSubrs: r = [],
    fonts: i = []
  } = t, a = [e, n, 4, 4], c = Dt(o.map(lr)), f = Dt(s.map(lr)), l = Dt(
    r.map((w) => new Uint8Array(w))
  ), u = i.map((w) => yh(w)), h = i.map(
    (w, _) => hr(
      w,
      u[_],
      /* baseOffset */
      0
    )
  ), p = Dt(h);
  let d = a.length + c.length + p.length + f.length + l.length;
  const x = i.map((w, _) => {
    const S = hr(w, u[_], d);
    return d += u[_].totalSize, S;
  }), y = Dt(x);
  if (y.length !== p.length)
    throw new Error(
      "CFF Top DICT INDEX size mismatch — this should not happen with forced int32 offsets"
    );
  const m = [
    ...a,
    ...c,
    ...y,
    ...f,
    ...l
  ];
  for (const w of u)
    for (const _ of w.sections)
      for (let S = 0; S < _.length; S++) m.push(_[S]);
  return m;
}
function yh(t) {
  const e = [], n = {};
  let o = 0;
  const s = (t.charStrings || []).map((u) => !u || u.length === 0 ? new Uint8Array([14]) : new Uint8Array(u)), r = Dt(s);
  n.charStrings = o, e.push(r), o += r.length;
  const i = t.charset;
  if (typeof i == "string")
    n.charset = i === "ISOAdobe" ? 0 : i === "Expert" ? 1 : 2, n.charsetIsPredefined = !0;
  else {
    const u = ph(i || []);
    n.charset = o, n.charsetIsPredefined = !1, e.push(u), o += u.length;
  }
  const a = t.encoding;
  if (typeof a == "string")
    n.encoding = a === "Standard" ? 0 : 1, n.encodingIsPredefined = !0;
  else if (a && typeof a == "object") {
    const u = xh(a);
    n.encoding = o, n.encodingIsPredefined = !1, e.push(u), o += u.length;
  } else
    n.encoding = 0, n.encodingIsPredefined = !0;
  const c = be(
    t.privateDict || {},
    cr
  );
  let f = null;
  if (t.localSubrs && t.localSubrs.length > 0 && (f = Dt(t.localSubrs.map((u) => new Uint8Array(u)))), f) {
    const h = En(
      c,
      fr
    ).length + 6;
    c.push({
      operator: cr.Subrs,
      operands: [h]
    });
  }
  const l = En(c, fr);
  if (n.privateOffset = o, n.privateSize = l.length, e.push(l), o += l.length, f && (e.push(f), o += f.length), t.isCIDFont) {
    if (t.fdSelect) {
      const u = La(t.fdSelect);
      n.fdSelect = o, e.push(u), o += u.length;
    }
    if (t.fdArray) {
      const u = t.fdArray.map((p) => {
        const g = be(
          p.fontDict || {},
          gt
        );
        return En(g, Ba);
      }), h = Dt(u);
      n.fdArray = o, e.push(h), o += h.length;
    }
  }
  return { sections: e, totalSize: o, offsets: n };
}
function hr(t, e, n) {
  const o = e.offsets, s = be(
    t.topDict || {},
    gt
  );
  return s.push({
    operator: gt.CharStrings,
    operands: [n + o.charStrings]
  }), o.charsetIsPredefined ? o.charset !== 0 && s.push({
    operator: gt.charset,
    operands: [o.charset]
  }) : s.push({
    operator: gt.charset,
    operands: [n + o.charset]
  }), o.encodingIsPredefined ? o.encoding !== 0 && s.push({
    operator: gt.Encoding,
    operands: [o.encoding]
  }) : s.push({
    operator: gt.Encoding,
    operands: [n + o.encoding]
  }), s.push({
    operator: gt.Private,
    operands: [o.privateSize, n + o.privateOffset]
  }), t.isCIDFont && (o.fdArray !== void 0 && s.push({
    operator: gt.FDArray,
    operands: [n + o.fdArray]
  }), o.fdSelect !== void 0 && s.push({
    operator: gt.FDSelect,
    operands: [n + o.fdSelect]
  })), En(s, Ba);
}
function xh(t) {
  const { format: e = 0, codes: n = [], hasSupplement: o = !1 } = t, s = [], r = e | (o ? 128 : 0);
  if (e === 0) {
    s.push(r), s.push(n.length);
    for (const i of n) s.push(i);
  } else if (e === 1) {
    const i = [];
    if (n.length > 0) {
      let a = n[0], c = 0;
      for (let f = 1; f < n.length; f++)
        n[f] === a + c + 1 ? c++ : (i.push([a, c]), a = n[f], c = 0);
      i.push([a, c]);
    }
    s.push(r), s.push(i.length);
    for (const [a, c] of i)
      s.push(a, c);
  }
  return s;
}
class F {
  /**
   * @param {number[]|Uint8Array} bytes - source bytes
   * @param {number} [startOffset=0]    - initial cursor position
   */
  constructor(e, n = 0) {
    const o = e instanceof Uint8Array ? e : new Uint8Array(e);
    this._view = new DataView(o.buffer, o.byteOffset, o.byteLength), this._pos = n;
  }
  /** Current byte offset. */
  get position() {
    return this._pos;
  }
  /** Total byte length of the underlying data. */
  get length() {
    return this._view.byteLength;
  }
  /**
   * The underlying DataView — for callers that need random-access reads
   * (e.g., subtable offsets that jump around within a table).
   */
  get view() {
    return this._view;
  }
  // --- Cursor control -------------------------------------------------
  /** Move the cursor to an absolute byte offset. */
  seek(e) {
    return this._pos = e, this;
  }
  /** Advance the cursor by `n` bytes without reading. */
  skip(e) {
    return this._pos += e, this;
  }
  // --- Unsigned integers ----------------------------------------------
  /** Read uint8 (1 byte). */
  uint8() {
    const e = this._view.getUint8(this._pos);
    return this._pos += 1, e;
  }
  /** Read uint16 (2 bytes, big-endian). */
  uint16() {
    const e = this._view.getUint16(this._pos);
    return this._pos += 2, e;
  }
  /** Read uint24 (3 bytes, big-endian). */
  uint24() {
    const e = this._view.getUint8(this._pos) << 16 | this._view.getUint8(this._pos + 1) << 8 | this._view.getUint8(this._pos + 2);
    return this._pos += 3, e;
  }
  /** Read uint32 (4 bytes, big-endian). */
  uint32() {
    const e = this._view.getUint32(this._pos);
    return this._pos += 4, e;
  }
  // --- Signed integers ------------------------------------------------
  /** Read int8 (1 byte, signed). */
  int8() {
    const e = this._view.getInt8(this._pos);
    return this._pos += 1, e;
  }
  /** Read int16 (2 bytes, big-endian, signed). */
  int16() {
    const e = this._view.getInt16(this._pos);
    return this._pos += 2, e;
  }
  /** Read int32 (4 bytes, big-endian, signed). */
  int32() {
    const e = this._view.getInt32(this._pos);
    return this._pos += 4, e;
  }
  // --- OpenType-specific types ----------------------------------------
  /** Read a Tag — 4 ASCII bytes returned as a string. */
  tag() {
    const e = String.fromCharCode(
      this._view.getUint8(this._pos),
      this._view.getUint8(this._pos + 1),
      this._view.getUint8(this._pos + 2),
      this._view.getUint8(this._pos + 3)
    );
    return this._pos += 4, e;
  }
  /** Read Offset16 (alias for uint16). */
  offset16() {
    return this.uint16();
  }
  /** Read Offset32 (alias for uint32). */
  offset32() {
    return this.uint32();
  }
  /** Read Fixed (16.16 signed fixed-point -> JS number). */
  fixed() {
    const e = this._view.getInt32(this._pos);
    return this._pos += 4, e / 65536;
  }
  /** Read FWORD (alias for int16). */
  fword() {
    return this.int16();
  }
  /** Read UFWORD (alias for uint16). */
  ufword() {
    return this.uint16();
  }
  /** Read F2DOT14 (2.14 signed fixed-point -> JS number). */
  f2dot14() {
    const e = this._view.getInt16(this._pos);
    return this._pos += 2, e / 16384;
  }
  /**
   * Read LONGDATETIME — signed 64-bit integer representing seconds since
   * 1904-01-01 00:00 UTC.  Returned as a BigInt.
   */
  longDateTime() {
    const e = this._view.getInt32(this._pos), n = this._view.getUint32(this._pos + 4);
    return this._pos += 8, BigInt(e) << 32n | BigInt(n);
  }
  // --- Bulk reads -----------------------------------------------------
  /**
   * Read `count` values using the named method.
   * @param {string} method - name of a read method, e.g. 'uint16'
   * @param {number} count
   * @returns {Array}
   */
  array(e, n) {
    const o = [], s = this[e].bind(this);
    for (let r = 0; r < n; r++)
      o.push(s());
    return o;
  }
  /**
   * Read `count` raw bytes and return a plain Array of numbers.
   * @param {number} count
   * @returns {number[]}
   */
  bytes(e) {
    const n = [];
    for (let o = 0; o < e; o++)
      n.push(this._view.getUint8(this._pos + o));
    return this._pos += e, n;
  }
}
class v {
  /**
   * @param {number} size - number of bytes to allocate (all initialised to 0)
   */
  constructor(e) {
    this._buffer = new ArrayBuffer(e), this._view = new DataView(this._buffer), this._bytes = new Uint8Array(this._buffer), this._pos = 0;
  }
  /** Current byte offset. */
  get position() {
    return this._pos;
  }
  /** Total byte length of the buffer. */
  get length() {
    return this._buffer.byteLength;
  }
  /** The underlying DataView — for random-access writes when needed. */
  get view() {
    return this._view;
  }
  /** The underlying Uint8Array — for bulk set operations. */
  get bytes() {
    return this._bytes;
  }
  // --- Cursor control -------------------------------------------------
  /** Move the cursor to an absolute byte offset. */
  seek(e) {
    return this._pos = e, this;
  }
  /** Advance the cursor by `n` bytes without writing. */
  skip(e) {
    return this._pos += e, this;
  }
  // --- Unsigned integers ----------------------------------------------
  /** Write uint8 (1 byte). */
  uint8(e) {
    return this._view.setUint8(this._pos, e), this._pos += 1, this;
  }
  /** Write uint16 (2 bytes, big-endian). */
  uint16(e) {
    return this._view.setUint16(this._pos, e), this._pos += 2, this;
  }
  /** Write uint24 (3 bytes, big-endian). */
  uint24(e) {
    return this._view.setUint8(this._pos, e >> 16 & 255), this._view.setUint8(this._pos + 1, e >> 8 & 255), this._view.setUint8(this._pos + 2, e & 255), this._pos += 3, this;
  }
  /** Write uint32 (4 bytes, big-endian). */
  uint32(e) {
    return this._view.setUint32(this._pos, e), this._pos += 4, this;
  }
  // --- Signed integers ------------------------------------------------
  /** Write int8 (1 byte, signed). */
  int8(e) {
    return this._view.setInt8(this._pos, e), this._pos += 1, this;
  }
  /** Write int16 (2 bytes, big-endian, signed). */
  int16(e) {
    return this._view.setInt16(this._pos, e), this._pos += 2, this;
  }
  /** Write int32 (4 bytes, big-endian, signed). */
  int32(e) {
    return this._view.setInt32(this._pos, e), this._pos += 4, this;
  }
  // --- OpenType-specific types ----------------------------------------
  /** Write a Tag — 4 ASCII bytes from a string. */
  tag(e) {
    for (let n = 0; n < 4; n++)
      this._view.setUint8(this._pos + n, e.charCodeAt(n));
    return this._pos += 4, this;
  }
  /** Write Offset16 (alias for uint16). */
  offset16(e) {
    return this.uint16(e);
  }
  /** Write Offset32 (alias for uint32). */
  offset32(e) {
    return this.uint32(e);
  }
  /** Write Fixed (JS number -> 16.16 signed fixed-point). */
  fixed(e) {
    return this._view.setInt32(this._pos, Math.round(e * 65536)), this._pos += 4, this;
  }
  /** Write FWORD (alias for int16). */
  fword(e) {
    return this.int16(e);
  }
  /** Write UFWORD (alias for uint16). */
  ufword(e) {
    return this.uint16(e);
  }
  /** Write F2DOT14 (JS number -> 2.14 signed fixed-point). */
  f2dot14(e) {
    return this._view.setInt16(this._pos, Math.round(e * 16384)), this._pos += 2, this;
  }
  /**
   * Write LONGDATETIME — BigInt representing seconds since 1904-01-01 00:00 UTC.
   */
  longDateTime(e) {
    const n = BigInt(e);
    return this._view.setInt32(this._pos, Number(n >> 32n)), this._view.setUint32(this._pos + 4, Number(n & 0xffffffffn)), this._pos += 8, this;
  }
  // --- Bulk writes ----------------------------------------------------
  /**
   * Write an array of values using the named method.
   * @param {string} method - name of a write method, e.g. 'uint16'
   * @param {Array} values
   */
  array(e, n) {
    const o = this[e].bind(this);
    for (const s of n)
      o(s);
    return this;
  }
  /**
   * Write raw bytes (number[] or Uint8Array) at the current position.
   * @param {number[]|Uint8Array} data
   */
  rawBytes(e) {
    const n = e instanceof Uint8Array ? e : new Uint8Array(e);
    return this._bytes.set(n, this._pos), this._pos += n.length, this;
  }
  // --- Output ---------------------------------------------------------
  /** Return the buffer contents as a plain number[]. */
  toArray() {
    return Array.from(this._bytes);
  }
}
const jo = 32768, Yo = 32767;
function Pt(t) {
  const e = new F(t), n = e.uint16(), o = e.offset32(), s = e.uint16(), r = e.array(
    "offset32",
    s
  ), i = Sh(
    e,
    o
  ), a = [];
  for (let c = 0; c < s; c++) {
    const f = r[c];
    f === 0 ? a.push(null) : a.push(_h(e, f));
  }
  return {
    format: n,
    variationRegionList: i,
    itemVariationData: a
  };
}
function Sh(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = [];
  for (let r = 0; r < o; r++) {
    const i = [];
    for (let a = 0; a < n; a++)
      i.push({
        startCoord: t.f2dot14(),
        peakCoord: t.f2dot14(),
        endCoord: t.f2dot14()
      });
    s.push({ regionAxes: i });
  }
  return { axisCount: n, regions: s };
}
function _h(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.uint16(), r = t.array("uint16", s), i = (o & jo) !== 0, a = o & Yo, c = [];
  for (let f = 0; f < n; f++) {
    const l = [];
    for (let u = 0; u < a; u++)
      l.push(i ? t.int32() : t.int16());
    for (let u = a; u < s; u++)
      l.push(i ? t.int16() : t.int8());
    c.push(l);
  }
  return {
    itemCount: n,
    wordDeltaCount: o,
    regionIndexes: r,
    deltaSets: c
  };
}
function ne(t) {
  const e = t.variationRegionList, n = t.itemVariationData ?? [], o = n.length, s = 8 + 4 * o, r = e.axisCount, i = e.regions.length, a = 4 + i * r * 6, c = s;
  let f = c + a;
  const l = [];
  for (let p = 0; p < o; p++) {
    const g = n[p];
    if (!g) {
      l.push(0);
      continue;
    }
    l.push(f);
    const d = g.regionIndexes.length, x = (g.wordDeltaCount & jo) !== 0, y = g.wordDeltaCount & Yo, m = 6 + 2 * d, w = x ? 4 : 2, _ = x ? 2 : 1, S = y * w + (d - y) * _, b = m + g.itemCount * S;
    f += b;
  }
  const u = f, h = new v(u);
  h.uint16(t.format ?? 1), h.offset32(c), h.uint16(o);
  for (let p = 0; p < o; p++)
    h.offset32(l[p]);
  h.uint16(r), h.uint16(i);
  for (const p of e.regions)
    for (const g of p.regionAxes)
      h.f2dot14(g.startCoord), h.f2dot14(g.peakCoord), h.f2dot14(g.endCoord);
  for (let p = 0; p < o; p++) {
    const g = n[p];
    if (!g) continue;
    const d = g.regionIndexes.length, x = (g.wordDeltaCount & jo) !== 0, y = g.wordDeltaCount & Yo;
    h.uint16(g.itemCount), h.uint16(g.wordDeltaCount), h.uint16(d), h.array("uint16", g.regionIndexes);
    for (const m of g.deltaSets) {
      for (let w = 0; w < y; w++)
        x ? h.int32(m[w] ?? 0) : h.int16(m[w] ?? 0);
      for (let w = y; w < d; w++)
        x ? h.int16(m[w] ?? 0) : h.int8(m[w] ?? 0);
    }
  }
  return h.toArray();
}
function wh(t) {
  const e = ne(t), n = e.length, o = new Uint8Array(2 + n);
  return o[0] = n >> 8 & 255, o[1] = n & 255, o.set(new Uint8Array(e), 2), o;
}
const bh = Object.fromEntries(
  Object.entries(Ra).map(([t, e]) => [e, Number(t)])
), Ah = Object.fromEntries(
  Object.entries(Fa).map(([t, e]) => [e, Number(t)])
), Ch = /* @__PURE__ */ new Set([
  17,
  // CharStrings
  24,
  // VariationStore
  3108,
  // FDArray
  3109
  // FDSelect
]), vh = /* @__PURE__ */ new Set([
  18
  // Private  (size + offset)
]), gr = /* @__PURE__ */ new Set([
  19
  // Subrs  (relative offset)
]);
function Tn(t, e) {
  const n = [];
  for (const { operator: o, operands: s } of t) {
    const r = e.has(o);
    for (const i of s)
      r && Number.isInteger(i) ? n.push(
        29,
        i >>> 24 & 255,
        i >>> 16 & 255,
        i >>> 8 & 255,
        i & 255
      ) : n.push(...Da(i));
    o >= 3072 ? n.push(12, o & 255) : n.push(o);
  }
  return n;
}
function Ih(t, e) {
  const n = new Uint8Array(t), o = n[0], s = n[1], r = n[2], i = n[3] << 8 | n[4], a = r, c = a + i, f = jt(n, a, c), l = Yt(f, Wo), u = l.CharStrings, h = l.VariationStore, p = l.FDArray, g = l.FDSelect;
  delete l.CharStrings, delete l.VariationStore, delete l.FDArray, delete l.FDSelect;
  const x = dn(n, c).items.map((b) => Array.from(b));
  let y = [];
  u !== void 0 && (y = dn(n, u).items.map((A) => Array.from(A)));
  const m = y.length;
  let w = [];
  p !== void 0 && (w = dn(n, p).items.map((A) => {
    const k = jt(A, 0, A.length), O = Yt(k, {
      ...Ra,
      ...Wo
      // Font DICTs can also have FontMatrix
    });
    let I = {}, E = [];
    if (Array.isArray(O.Private) && O.Private.length === 2) {
      const [T, D] = O.Private, R = jt(n, D, D + T);
      I = Yt(R, Fa), I.Subrs !== void 0 && (E = dn(n, D + I.Subrs).items.map((L) => Array.from(L)), delete I.Subrs), delete O.Private;
    }
    return {
      fontDict: O,
      privateDict: I,
      localSubrs: E
    };
  }));
  let _ = null;
  g !== void 0 && m > 0 && (_ = Ma(n, g, m));
  let S = null;
  if (h !== void 0) {
    const b = n[h] << 8 | n[h + 1];
    S = Pt(
      Array.from(
        n.slice(
          h + 2,
          h + 2 + b
        )
      )
    );
  }
  return {
    majorVersion: o,
    minorVersion: s,
    topDict: l,
    globalSubrs: x,
    charStrings: y,
    fontDicts: w,
    fdSelect: _,
    variationStore: S
  };
}
function Oh(t) {
  const {
    majorVersion: e = 2,
    minorVersion: n = 0,
    topDict: o = {},
    globalSubrs: s = [],
    charStrings: r = [],
    fontDicts: i = [],
    fdSelect: a = null,
    variationStore: c = null
  } = t, f = mn(
    s.map((T) => new Uint8Array(T))
  ), l = mn(r.map((T) => new Uint8Array(T))), u = a ? La(a) : null, h = c ? wh(c) : null, g = pr(o, {
    charStrings: 0,
    fdArray: i.length > 0 ? 0 : void 0,
    fdSelect: a ? 0 : void 0,
    variationStore: c ? 0 : void 0
  }).length, d = 5;
  let y = d + g + f.length;
  const m = y;
  y += l.length;
  let w;
  u && (w = y, y += u.length);
  let _;
  h && (_ = y, y += h.length);
  const S = i.map((T) => {
    const D = be(
      T.privateDict || {},
      Ah
    );
    let R = null;
    if (T.localSubrs && T.localSubrs.length > 0 && (R = mn(T.localSubrs.map((L) => new Uint8Array(L)))), R) {
      const H = Tn(D, gr).length + 6;
      D.push({
        operator: 19,
        // Subrs
        operands: [H]
      });
    }
    const M = Tn(D, gr);
    return {
      privBytes: M,
      localSubrBytes: R,
      totalSize: M.length + (R ? R.length : 0)
    };
  }), b = [];
  for (const T of S)
    b.push({ offset: y, size: T.privBytes.length }), y += T.totalSize;
  let A = null, k;
  if (i.length > 0) {
    const T = i.map((D, R) => {
      const M = be(D.fontDict || {}, {
        ...bh,
        ...fe
      });
      return M.push({
        operator: 18,
        // Private
        operands: [b[R].size, b[R].offset]
      }), Tn(M, vh);
    });
    A = mn(T), k = y, y += A.length;
  }
  const O = pr(o, {
    charStrings: m,
    fdArray: k,
    fdSelect: w,
    variationStore: _
  });
  if (O.length !== g)
    throw new Error(
      "CFF2 TopDICT size mismatch — this should not happen with forced int32 offsets"
    );
  const E = [
    ...[
      e,
      n,
      d,
      g >> 8 & 255,
      g & 255
    ],
    ...O,
    ...f,
    ...l
  ];
  if (u)
    for (let T = 0; T < u.length; T++) E.push(u[T]);
  if (h)
    for (let T = 0; T < h.length; T++)
      E.push(h[T]);
  for (const T of S) {
    for (let D = 0; D < T.privBytes.length; D++) E.push(T.privBytes[D]);
    if (T.localSubrBytes)
      for (let D = 0; D < T.localSubrBytes.length; D++)
        E.push(T.localSubrBytes[D]);
  }
  if (A)
    for (let T = 0; T < A.length; T++) E.push(A[T]);
  return E;
}
function pr(t, e) {
  const n = be(t, fe);
  return e.charStrings !== void 0 && n.push({
    operator: fe.CharStrings,
    operands: [e.charStrings]
  }), e.fdArray !== void 0 && n.push({
    operator: fe.FDArray,
    operands: [e.fdArray]
  }), e.fdSelect !== void 0 && n.push({
    operator: fe.FDSelect,
    operands: [e.fdSelect]
  }), e.variationStore !== void 0 && n.push({
    operator: fe.VariationStore,
    operands: [e.variationStore]
  }), Tn(n, Ch);
}
const kh = 8, Eh = 4;
function Th(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.int16(), r = e.uint16(), i = [];
  for (let a = 0; a < r; a++)
    i.push({
      glyphIndex: e.uint16(),
      vertOriginY: e.int16()
    });
  return {
    majorVersion: n,
    minorVersion: o,
    defaultVertOriginY: s,
    numVertOriginYMetrics: r,
    vertOriginYMetrics: i
  };
}
function Dh(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.defaultVertOriginY ?? 0, s = t.vertOriginYMetrics ?? [], r = t.numVertOriginYMetrics ?? s.length, i = s.slice(0, r);
  for (; i.length < r; )
    i.push({ glyphIndex: 0, vertOriginY: o });
  const a = new v(
    kh + r * Eh
  );
  a.uint16(e), a.uint16(n), a.int16(o), a.uint16(r);
  for (const c of i)
    a.uint16(c.glyphIndex ?? 0), a.int16(c.vertOriginY ?? o);
  return a.toArray();
}
const Rh = 8;
function Fh(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = [];
  for (let a = 0; a < r; a++) {
    const c = e.uint16(), f = [];
    for (let l = 0; l < c; l++)
      f.push({
        fromCoordinate: e.f2dot14(),
        toCoordinate: e.f2dot14()
      });
    i.push({ positionMapCount: c, axisValueMaps: f });
  }
  return {
    majorVersion: n,
    minorVersion: o,
    reserved: s,
    segmentMaps: i
  };
}
function Mh(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.reserved ?? 0, s = t.segmentMaps ?? [];
  let r = Rh;
  for (const a of s) {
    const c = a.axisValueMaps?.length ?? a.positionMapCount ?? 0;
    r += 2 + c * 4;
  }
  const i = new v(r);
  i.uint16(e), i.uint16(n), i.uint16(o), i.uint16(s.length);
  for (const a of s) {
    const c = a.axisValueMaps ?? [];
    i.uint16(c.length);
    for (const f of c)
      i.f2dot14(f.fromCoordinate), i.f2dot14(f.toCoordinate);
  }
  return i.toArray();
}
function $(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const o = t.uint16(), s = t.array("uint16", o);
    return { format: n, glyphs: s };
  }
  if (n === 2) {
    const o = t.uint16(), s = [];
    for (let r = 0; r < o; r++)
      s.push({
        startGlyphID: t.uint16(),
        endGlyphID: t.uint16(),
        startCoverageIndex: t.uint16()
      });
    return { format: n, ranges: s };
  }
  throw new Error(`Unknown Coverage format: ${n}`);
}
function G(t) {
  if (t.format === 1) {
    const e = 4 + t.glyphs.length * 2, n = new v(e);
    return n.uint16(1), n.uint16(t.glyphs.length), n.array("uint16", t.glyphs), n.toArray();
  }
  if (t.format === 2) {
    const e = 4 + t.ranges.length * 6, n = new v(e);
    n.uint16(2), n.uint16(t.ranges.length);
    for (const o of t.ranges)
      n.uint16(o.startGlyphID), n.uint16(o.endGlyphID), n.uint16(o.startCoverageIndex);
    return n.toArray();
  }
  throw new Error(`Unknown Coverage format: ${t.format}`);
}
function Vt(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const o = t.uint16(), s = t.uint16(), r = t.array("uint16", s);
    return { format: n, startGlyphID: o, classValues: r };
  }
  if (n === 2) {
    const o = t.uint16(), s = [];
    for (let r = 0; r < o; r++)
      s.push({
        startGlyphID: t.uint16(),
        endGlyphID: t.uint16(),
        class: t.uint16()
      });
    return { format: n, ranges: s };
  }
  throw new Error(`Unknown ClassDef format: ${n}`);
}
function $t(t) {
  if (t.format === 1) {
    const e = 6 + t.classValues.length * 2, n = new v(e);
    return n.uint16(1), n.uint16(t.startGlyphID), n.uint16(t.classValues.length), n.array("uint16", t.classValues), n.toArray();
  }
  if (t.format === 2) {
    const e = 4 + t.ranges.length * 6, n = new v(e);
    n.uint16(2), n.uint16(t.ranges.length);
    for (const o of t.ranges)
      n.uint16(o.startGlyphID), n.uint16(o.endGlyphID), n.uint16(o.class);
    return n.toArray();
  }
  throw new Error(`Unknown ClassDef format: ${t.format}`);
}
function Ae(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.uint16();
  if (s === 32768)
    return {
      format: 32768,
      deltaSetOuterIndex: n,
      deltaSetInnerIndex: o
    };
  const r = n, i = o, a = s, c = i - r + 1;
  let f, l, u;
  if (a === 1)
    f = 2, l = 3, u = 2;
  else if (a === 2)
    f = 4, l = 15, u = 8;
  else if (a === 3)
    f = 8, l = 255, u = 128;
  else
    throw new Error(
      `Unknown Device deltaFormat: ${a} at offset ${e} (words: ${n}, ${o}, ${s})`
    );
  const h = 16 / f, p = Math.ceil(c / h), g = [];
  for (let d = 0; d < p; d++) {
    const x = t.uint16(), y = Math.min(h, c - d * h);
    for (let m = 0; m < y; m++) {
      const w = 16 - f * (m + 1);
      let _ = x >> w & l;
      _ >= u && (_ -= u * 2), g.push(_);
    }
  }
  return { format: a, startSize: r, endSize: i, deltaValues: g };
}
function Bn(t) {
  if (t.format === 32768) {
    const u = new v(6);
    return u.uint16(t.deltaSetOuterIndex), u.uint16(t.deltaSetInnerIndex), u.uint16(32768), u.toArray();
  }
  const { startSize: e, endSize: n, deltaFormat: o, deltaValues: s } = t;
  let r;
  if (o === 1) r = 2;
  else if (o === 2) r = 4;
  else if (o === 3) r = 8;
  else throw new Error(`Unknown Device deltaFormat: ${o}`);
  const i = 16 / r, a = Math.ceil(s.length / i), c = (1 << r) - 1, f = 6 + a * 2, l = new v(f);
  l.uint16(e), l.uint16(n), l.uint16(o);
  for (let u = 0; u < a; u++) {
    let h = 0;
    const p = Math.min(
      i,
      s.length - u * i
    );
    for (let g = 0; g < p; g++) {
      const d = 16 - r * (g + 1);
      h |= (s[u * i + g] & c) << d;
    }
    l.uint16(h);
  }
  return l.toArray();
}
function Na(t, e) {
  t.seek(e);
  const n = t.uint16(), o = [];
  for (let r = 0; r < n; r++)
    o.push({
      scriptTag: t.tag(),
      scriptOffset: t.uint16()
    });
  return { scriptRecords: o.map((r) => ({
    scriptTag: r.scriptTag,
    script: Lh(t, e + r.scriptOffset)
  })) };
}
function Lh(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = [];
  for (let a = 0; a < o; a++)
    s.push({
      langSysTag: t.tag(),
      langSysOffset: t.uint16()
    });
  const r = n !== 0 ? dr(t, e + n) : null, i = s.map((a) => ({
    langSysTag: a.langSysTag,
    langSys: dr(t, e + a.langSysOffset)
  }));
  return { defaultLangSys: r, langSysRecords: i };
}
function dr(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.uint16(), r = t.array("uint16", s);
  return { lookupOrderOffset: n, requiredFeatureIndex: o, featureIndices: r };
}
function Ga(t) {
  const { scriptRecords: e } = t, n = e.map((a) => Bh(a.script)), o = 2 + e.length * 6, s = [];
  let r = o;
  for (const a of n)
    s.push(r), r += a.length;
  const i = new v(r);
  i.uint16(e.length);
  for (let a = 0; a < e.length; a++)
    i.tag(e[a].scriptTag), i.uint16(s[a]);
  for (let a = 0; a < n.length; a++)
    i.seek(s[a]), i.rawBytes(n[a]);
  return i.toArray();
}
function Bh(t) {
  const { defaultLangSys: e, langSysRecords: n } = t, o = n.map((l) => mr(l.langSys)), s = e ? mr(e) : null;
  let i = 4 + n.length * 6;
  const a = s ? i : 0;
  s && (i += s.length);
  const c = [];
  for (const l of o)
    c.push(i), i += l.length;
  const f = new v(i);
  f.uint16(a), f.uint16(n.length);
  for (let l = 0; l < n.length; l++)
    f.tag(n[l].langSysTag), f.uint16(c[l]);
  s && (f.seek(a), f.rawBytes(s));
  for (let l = 0; l < o.length; l++)
    f.seek(c[l]), f.rawBytes(o[l]);
  return f.toArray();
}
function mr(t) {
  const e = 6 + t.featureIndices.length * 2, n = new v(e);
  return n.uint16(t.lookupOrderOffset), n.uint16(t.requiredFeatureIndex), n.uint16(t.featureIndices.length), n.array("uint16", t.featureIndices), n.toArray();
}
function Pa(t, e) {
  t.seek(e);
  const n = t.uint16(), o = [];
  for (let r = 0; r < n; r++)
    o.push({
      featureTag: t.tag(),
      featureOffset: t.uint16()
    });
  return { featureRecords: o.map((r) => ({
    featureTag: r.featureTag,
    feature: Ua(t, e + r.featureOffset)
  })) };
}
function Ua(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.array("uint16", o);
  return { featureParamsOffset: n, lookupListIndices: s };
}
function za(t) {
  const { featureRecords: e } = t, n = e.map((a) => Ha(a.feature)), o = 2 + e.length * 6, s = [];
  let r = o;
  for (const a of n)
    s.push(r), r += a.length;
  const i = new v(r);
  i.uint16(e.length);
  for (let a = 0; a < e.length; a++)
    i.tag(e[a].featureTag), i.uint16(s[a]);
  for (let a = 0; a < n.length; a++)
    i.seek(s[a]), i.rawBytes(n[a]);
  return i.toArray();
}
function Ha(t) {
  const e = 4 + t.lookupListIndices.length * 2, n = new v(e);
  return n.uint16(t.featureParamsOffset), n.uint16(t.lookupListIndices.length), n.array("uint16", t.lookupListIndices), n.toArray();
}
function Wa(t, e, n, o) {
  t.seek(e);
  const s = t.uint16();
  return { lookups: t.array("uint16", s).map(
    (a) => Vh(t, e + a, n, o)
  ) };
}
function Vh(t, e, n, o) {
  t.seek(e);
  const s = t.uint16(), r = t.uint16(), i = t.uint16(), a = t.array("uint16", i), c = r & 16 ? t.uint16() : void 0, f = a.map(
    (p) => n(t, e + p, s)
  );
  let l = s, u = f;
  o !== void 0 && s === o && f.length > 0 && (l = f[0].extensionLookupType, u = f.map((p) => p.subtable));
  const h = {
    lookupType: l,
    lookupFlag: r,
    subtables: u
  };
  return c !== void 0 && (h.markFilteringSet = c), h;
}
function ja(t, e, n) {
  const { lookups: o } = t, s = 8, r = o.map((p) => {
    const g = p.subtables.map(
      (d) => e(d, p.lookupType)
    );
    return { ...p, subtableBytes: g };
  }), i = (p) => {
    const { lookupType: g, lookupFlag: d, subtableBytes: x, markFilteringSet: y } = p, m = y !== void 0;
    let _ = 6 + x.length * 2 + (m ? 2 : 0);
    const S = x.map((A) => {
      const k = _;
      return _ += A.length, k;
    }), b = new v(_);
    b.uint16(g), b.uint16(d), b.uint16(x.length), b.array("uint16", S), m && b.uint16(y);
    for (let A = 0; A < x.length; A++)
      b.seek(S[A]), b.rawBytes(x[A]);
    return b.toArray();
  }, a = r.map(i), c = 2 + o.length * 2;
  if (((p) => {
    let g = c;
    for (const d of p) {
      if (g > 65535) return !0;
      g += d.length;
    }
    return !1;
  })(a) && n !== void 0) {
    const p = r.map((m) => {
      const { lookupType: w, lookupFlag: _, subtableBytes: S, markFilteringSet: b } = m, A = b !== void 0;
      let O = 6 + S.length * 2 + (A ? 2 : 0);
      const I = S.map(() => {
        const T = O;
        return O += s, T;
      }), E = new v(O);
      E.uint16(n), E.uint16(_), E.uint16(S.length), E.array("uint16", I), A && E.uint16(b);
      for (let T = 0; T < S.length; T++)
        E.seek(I[T]), E.uint16(1), E.uint16(w), E.uint32(0);
      return {
        compactBytes: E.toArray(),
        subtableOffsets: I,
        innerDataBytes: S
      };
    });
    let g = c;
    const d = p.map((m) => {
      const w = g;
      return g += m.compactBytes.length, w;
    }), x = p.map(
      (m) => m.innerDataBytes.map((w) => {
        const _ = g;
        return g += w.length, _;
      })
    ), y = new v(g);
    y.uint16(o.length), y.array("uint16", d);
    for (let m = 0; m < p.length; m++)
      y.seek(d[m]), y.rawBytes(p[m].compactBytes);
    for (let m = 0; m < p.length; m++) {
      const w = p[m];
      for (let _ = 0; _ < w.innerDataBytes.length; _++) {
        const S = d[m] + w.subtableOffsets[_], b = x[m][_], A = b - S;
        y.seek(S + 4), y.uint32(A), y.seek(b), y.rawBytes(w.innerDataBytes[_]);
      }
    }
    return y.toArray();
  }
  let l = c;
  const u = a.map((p) => {
    const g = l;
    return l += p.length, g;
  }), h = new v(l);
  h.uint16(o.length), h.array("uint16", u);
  for (let p = 0; p < a.length; p++)
    h.seek(u[p]), h.rawBytes(a[p]);
  return h.toArray();
}
function Ya(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const o = t.uint16(), s = t.uint16(), r = [];
    for (let c = 0; c < s; c++)
      r.push(t.uint16());
    const i = $(t, e + o), a = r.map(
      (c) => c === 0 ? null : $h(t, e + c)
    );
    return { format: n, coverage: i, seqRuleSets: a };
  }
  if (n === 2) {
    const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = [];
    for (let l = 0; l < r; l++)
      i.push(t.uint16());
    const a = $(t, e + o), c = Vt(t, e + s), f = i.map(
      (l) => l === 0 ? null : Nh(t, e + l)
    );
    return { format: n, coverage: a, classDef: c, classSeqRuleSets: f };
  }
  if (n === 3) {
    const o = t.uint16(), s = t.uint16(), r = t.array("uint16", o), i = ln(t, s), a = r.map(
      (c) => $(t, e + c)
    );
    return { format: n, coverages: a, seqLookupRecords: i };
  }
  throw new Error(`Unknown SequenceContext format: ${n}`);
}
function $h(t, e) {
  t.seek(e);
  const n = t.uint16();
  return t.array("uint16", n).map((s) => {
    t.seek(e + s);
    const r = t.uint16(), i = t.uint16(), a = t.array("uint16", r - 1), c = ln(t, i);
    return { glyphCount: r, inputSequence: a, seqLookupRecords: c };
  });
}
function Nh(t, e) {
  t.seek(e);
  const n = t.uint16();
  return t.array("uint16", n).map((s) => {
    t.seek(e + s);
    const r = t.uint16(), i = t.uint16(), a = t.array("uint16", r - 1), c = ln(t, i);
    return { glyphCount: r, inputSequence: a, seqLookupRecords: c };
  });
}
function ln(t, e) {
  const n = [];
  for (let o = 0; o < e; o++)
    n.push({
      sequenceIndex: t.uint16(),
      lookupListIndex: t.uint16()
    });
  return n;
}
function Za(t) {
  if (t.format === 1) return Gh(t);
  if (t.format === 2) return Ph(t);
  if (t.format === 3) return Uh(t);
  throw new Error(`Unknown SequenceContext format: ${t.format}`);
}
function Gh(t) {
  const { coverage: e, seqRuleSets: n } = t, o = G(e), s = n.map(
    (l) => l === null ? null : Xa(l)
  );
  let i = 6 + n.length * 2;
  const a = i;
  i += o.length;
  const c = s.map((l) => {
    if (l === null) return 0;
    const u = i;
    return i += l.length, u;
  }), f = new v(i);
  f.uint16(1), f.uint16(a), f.uint16(n.length), f.array("uint16", c), f.seek(a), f.rawBytes(o);
  for (let l = 0; l < s.length; l++)
    s[l] && (f.seek(c[l]), f.rawBytes(s[l]));
  return f.toArray();
}
function Ph(t) {
  const { coverage: e, classDef: n, classSeqRuleSets: o } = t, s = G(e), r = $t(n), i = o.map(
    (p) => p === null ? null : Xa(p)
  );
  let c = 8 + o.length * 2;
  const f = c;
  c += s.length;
  const l = c;
  c += r.length;
  const u = i.map((p) => {
    if (p === null) return 0;
    const g = c;
    return c += p.length, g;
  }), h = new v(c);
  h.uint16(2), h.uint16(f), h.uint16(l), h.uint16(o.length), h.array("uint16", u), h.seek(f), h.rawBytes(s), h.seek(l), h.rawBytes(r);
  for (let p = 0; p < i.length; p++)
    i[p] && (h.seek(u[p]), h.rawBytes(i[p]));
  return h.toArray();
}
function Uh(t) {
  const { coverages: e, seqLookupRecords: n } = t, o = e.map(G);
  let r = 6 + e.length * 2 + n.length * 4;
  const i = o.map((c) => {
    const f = r;
    return r += c.length, f;
  }), a = new v(r);
  a.uint16(3), a.uint16(e.length), a.uint16(n.length), a.array("uint16", i), eo(a, n);
  for (let c = 0; c < o.length; c++)
    a.seek(i[c]), a.rawBytes(o[c]);
  return a.toArray();
}
function Xa(t) {
  const e = t.map(zh);
  let o = 2 + t.length * 2;
  const s = e.map((i) => {
    const a = o;
    return o += i.length, a;
  }), r = new v(o);
  r.uint16(t.length), r.array("uint16", s);
  for (let i = 0; i < e.length; i++)
    r.seek(s[i]), r.rawBytes(e[i]);
  return r.toArray();
}
function zh(t) {
  const { glyphCount: e, inputSequence: n, seqLookupRecords: o } = t, s = 4 + (e - 1) * 2 + o.length * 4, r = new v(s);
  return r.uint16(e), r.uint16(o.length), r.array("uint16", n), eo(r, o), r.toArray();
}
function eo(t, e) {
  for (const n of e)
    t.uint16(n.sequenceIndex), t.uint16(n.lookupListIndex);
}
function qa(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const o = t.uint16(), s = t.uint16(), r = [];
    for (let c = 0; c < s; c++)
      r.push(t.uint16());
    const i = $(t, e + o), a = r.map(
      (c) => c === 0 ? null : Hh(t, e + c)
    );
    return { format: n, coverage: i, chainedSeqRuleSets: a };
  }
  if (n === 2) {
    const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = t.uint16(), a = t.uint16(), c = [];
    for (let g = 0; g < a; g++)
      c.push(t.uint16());
    const f = $(t, e + o), l = Vt(
      t,
      e + s
    ), u = Vt(
      t,
      e + r
    ), h = Vt(
      t,
      e + i
    ), p = c.map(
      (g) => g === 0 ? null : Wh(t, e + g)
    );
    return {
      format: n,
      coverage: f,
      backtrackClassDef: l,
      inputClassDef: u,
      lookaheadClassDef: h,
      chainedClassSeqRuleSets: p
    };
  }
  if (n === 3) {
    const o = t.uint16(), s = t.array(
      "uint16",
      o
    ), r = t.uint16(), i = t.array("uint16", r), a = t.uint16(), c = t.array(
      "uint16",
      a
    ), f = t.uint16(), l = ln(t, f), u = s.map(
      (g) => $(t, e + g)
    ), h = i.map(
      (g) => $(t, e + g)
    ), p = c.map(
      (g) => $(t, e + g)
    );
    return {
      format: n,
      backtrackCoverages: u,
      inputCoverages: h,
      lookaheadCoverages: p,
      seqLookupRecords: l
    };
  }
  throw new Error(`Unknown ChainedSequenceContext format: ${n}`);
}
function Hh(t, e) {
  t.seek(e);
  const n = t.uint16();
  return t.array("uint16", n).map((s) => Ka(t, e + s));
}
function Ka(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.array("uint16", n), s = t.uint16(), r = t.array("uint16", s - 1), i = t.uint16(), a = t.array("uint16", i), c = t.uint16(), f = ln(t, c);
  return {
    backtrackSequence: o,
    inputGlyphCount: s,
    inputSequence: r,
    lookaheadSequence: a,
    seqLookupRecords: f
  };
}
function Wh(t, e) {
  t.seek(e);
  const n = t.uint16();
  return t.array("uint16", n).map((s) => Ka(t, e + s));
}
function Ja(t) {
  if (t.format === 1) return jh(t);
  if (t.format === 2) return Yh(t);
  if (t.format === 3) return Zh(t);
  throw new Error(`Unknown ChainedSequenceContext format: ${t.format}`);
}
function jh(t) {
  const { coverage: e, chainedSeqRuleSets: n } = t, o = G(e), s = n.map(
    (l) => l === null ? null : Qa(l)
  );
  let i = 6 + n.length * 2;
  const a = i;
  i += o.length;
  const c = s.map((l) => {
    if (l === null) return 0;
    const u = i;
    return i += l.length, u;
  }), f = new v(i);
  f.uint16(1), f.uint16(a), f.uint16(n.length), f.array("uint16", c), f.seek(a), f.rawBytes(o);
  for (let l = 0; l < s.length; l++)
    s[l] && (f.seek(c[l]), f.rawBytes(s[l]));
  return f.toArray();
}
function Yh(t) {
  const {
    coverage: e,
    backtrackClassDef: n,
    inputClassDef: o,
    lookaheadClassDef: s,
    chainedClassSeqRuleSets: r
  } = t, i = G(e), a = $t(n), c = $t(o), f = $t(s), l = r.map(
    (w) => w === null ? null : Qa(w)
  );
  let h = 12 + r.length * 2;
  const p = h;
  h += i.length;
  const g = h;
  h += a.length;
  const d = h;
  h += c.length;
  const x = h;
  h += f.length;
  const y = l.map((w) => {
    if (w === null) return 0;
    const _ = h;
    return h += w.length, _;
  }), m = new v(h);
  m.uint16(2), m.uint16(p), m.uint16(g), m.uint16(d), m.uint16(x), m.uint16(r.length), m.array("uint16", y), m.seek(p), m.rawBytes(i), m.seek(g), m.rawBytes(a), m.seek(d), m.rawBytes(c), m.seek(x), m.rawBytes(f);
  for (let w = 0; w < l.length; w++)
    l[w] && (m.seek(y[w]), m.rawBytes(l[w]));
  return m.toArray();
}
function Zh(t) {
  const {
    backtrackCoverages: e,
    inputCoverages: n,
    lookaheadCoverages: o,
    seqLookupRecords: s
  } = t, r = e.map(G), i = n.map(G), a = o.map(G);
  let f = 4 + e.length * 2 + 2 + n.length * 2 + 2 + o.length * 2 + 2 + s.length * 4;
  const l = r.map((g) => {
    const d = f;
    return f += g.length, d;
  }), u = i.map((g) => {
    const d = f;
    return f += g.length, d;
  }), h = a.map((g) => {
    const d = f;
    return f += g.length, d;
  }), p = new v(f);
  p.uint16(3), p.uint16(e.length), p.array("uint16", l), p.uint16(n.length), p.array("uint16", u), p.uint16(o.length), p.array("uint16", h), p.uint16(s.length), eo(p, s);
  for (let g = 0; g < r.length; g++)
    p.seek(l[g]), p.rawBytes(r[g]);
  for (let g = 0; g < i.length; g++)
    p.seek(u[g]), p.rawBytes(i[g]);
  for (let g = 0; g < a.length; g++)
    p.seek(h[g]), p.rawBytes(a[g]);
  return p.toArray();
}
function Qa(t) {
  const e = t.map(Xh);
  let o = 2 + t.length * 2;
  const s = e.map((i) => {
    const a = o;
    return o += i.length, a;
  }), r = new v(o);
  r.uint16(t.length), r.array("uint16", s);
  for (let i = 0; i < e.length; i++)
    r.seek(s[i]), r.rawBytes(e[i]);
  return r.toArray();
}
function Xh(t) {
  const {
    backtrackSequence: e,
    inputGlyphCount: n,
    inputSequence: o,
    lookaheadSequence: s,
    seqLookupRecords: r
  } = t, i = 2 + e.length * 2 + 2 + o.length * 2 + 2 + s.length * 2 + 2 + r.length * 4, a = new v(i);
  return a.uint16(e.length), a.array("uint16", e), a.uint16(n), a.array("uint16", o), a.uint16(s.length), a.array("uint16", s), a.uint16(r.length), eo(a, r), a.toArray();
}
function tc(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.uint32(), r = [];
  for (let a = 0; a < s; a++)
    r.push({
      conditionSetOffset: t.uint32(),
      featureTableSubstitutionOffset: t.uint32()
    });
  const i = r.map((a) => {
    const c = a.conditionSetOffset !== 0 ? qh(t, e + a.conditionSetOffset) : null, f = a.featureTableSubstitutionOffset !== 0 ? Kh(
      t,
      e + a.featureTableSubstitutionOffset
    ) : null;
    return { conditionSet: c, featureTableSubstitution: f };
  });
  return { majorVersion: n, minorVersion: o, featureVariationRecords: i };
}
function qh(t, e) {
  t.seek(e);
  const n = t.uint16(), o = [];
  for (let r = 0; r < n; r++)
    o.push(t.uint32());
  return { conditions: o.map((r) => {
    t.seek(e + r);
    const i = t.uint16();
    if (i === 1) {
      const a = t.uint16(), c = t.int16(), f = t.int16();
      return { format: i, axisIndex: a, filterRangeMinValue: c, filterRangeMaxValue: f };
    }
    return { format: i, _raw: !0 };
  }) };
}
function Kh(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.uint16(), r = [];
  for (let i = 0; i < s; i++) {
    const a = t.uint16(), c = t.uint32(), f = Ua(t, e + c);
    r.push({ featureIndex: a, feature: f });
  }
  return { majorVersion: n, minorVersion: o, substitutions: r };
}
function ec(t) {
  const { majorVersion: e, minorVersion: n, featureVariationRecords: o } = t, s = o.map((f) => ({
    csBytes: f.conditionSet ? Jh(f.conditionSet) : null,
    ftsBytes: f.featureTableSubstitution ? t0(f.featureTableSubstitution) : null
  }));
  let i = 8 + o.length * 8;
  const a = s.map((f) => {
    const l = f.csBytes ? i : 0;
    f.csBytes && (i += f.csBytes.length);
    const u = f.ftsBytes ? i : 0;
    return f.ftsBytes && (i += f.ftsBytes.length), { csOff: l, ftsOff: u };
  }), c = new v(i);
  c.uint16(e), c.uint16(n), c.uint32(o.length);
  for (const f of a)
    c.uint32(f.csOff), c.uint32(f.ftsOff);
  for (let f = 0; f < s.length; f++) {
    const l = s[f];
    l.csBytes && (c.seek(a[f].csOff), c.rawBytes(l.csBytes)), l.ftsBytes && (c.seek(a[f].ftsOff), c.rawBytes(l.ftsBytes));
  }
  return c.toArray();
}
function Jh(t) {
  const e = t.conditions.map(Qh);
  let o = 2 + t.conditions.length * 4;
  const s = e.map((i) => {
    const a = o;
    return o += i.length, a;
  }), r = new v(o);
  r.uint16(t.conditions.length);
  for (const i of s) r.uint32(i);
  for (let i = 0; i < e.length; i++)
    r.seek(s[i]), r.rawBytes(e[i]);
  return r.toArray();
}
function Qh(t) {
  if (t.format === 1) {
    const e = new v(8);
    return e.uint16(1), e.uint16(t.axisIndex), e.int16(t.filterRangeMinValue), e.int16(t.filterRangeMaxValue), e.toArray();
  }
  throw new Error(`Unknown Condition format: ${t.format}`);
}
function t0(t) {
  const e = t.substitutions.map(
    (i) => Ha(i.feature)
  );
  let o = 6 + t.substitutions.length * 6;
  const s = e.map((i) => {
    const a = o;
    return o += i.length, a;
  }), r = new v(o);
  r.uint16(t.majorVersion), r.uint16(t.minorVersion), r.uint16(t.substitutions.length);
  for (let i = 0; i < t.substitutions.length; i++)
    r.uint16(t.substitutions[i].featureIndex), r.uint32(s[i]);
  for (let i = 0; i < e.length; i++)
    r.seek(s[i]), r.rawBytes(e[i]);
  return r.toArray();
}
const e0 = 8, n0 = 12;
function o0(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.offset16(), r = e.offset16(), i = n > 1 || n === 1 && o >= 1 ? e.offset32() : 0, a = [s, r, i].filter(
    (c) => c > 0
  );
  return {
    majorVersion: n,
    minorVersion: o,
    horizAxis: s ? yr(t, s) : null,
    vertAxis: r ? yr(t, r) : null,
    itemVariationStore: i ? Pt(
      t.slice(
        i,
        s0(t.length, i, a)
      )
    ) : null
  };
}
function s0(t, e, n) {
  return n.filter((s) => s > e).sort((s, r) => s - r)[0] ?? t;
}
function yr(t, e) {
  if (e + 4 > t.length) return null;
  const n = new F(t);
  n.seek(e);
  const o = n.offset16(), s = n.offset16(), r = o ? r0(n, e + o) : null, i = s ? i0(n, e + s) : [];
  return { baseTagList: r, baseScriptList: i };
}
function r0(t, e) {
  t.seek(e);
  const n = t.uint16(), o = [];
  for (let s = 0; s < n; s++)
    o.push(t.tag());
  return o;
}
function i0(t, e) {
  t.seek(e);
  const n = t.uint16(), o = [];
  for (let s = 0; s < n; s++)
    o.push({ tag: t.tag(), off: t.offset16() });
  return o.map((s) => ({
    tag: s.tag,
    ...a0(t, e + s.off)
  }));
}
function a0(t, e) {
  t.seek(e);
  const n = t.offset16(), o = t.offset16(), s = t.uint16(), r = [];
  for (let i = 0; i < s; i++)
    r.push({ tag: t.tag(), off: t.offset16() });
  return {
    baseValues: n ? c0(t, e + n) : null,
    defaultMinMax: o ? xr(t, e + o) : null,
    langSystems: r.map((i) => ({
      tag: i.tag,
      minMax: xr(t, e + i.off)
    }))
  };
}
function c0(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = [];
  for (let r = 0; r < o; r++)
    s.push(t.offset16());
  return {
    defaultBaselineIndex: n,
    baseCoords: s.map(
      (r) => r ? Ne(t, e + r) : null
    )
  };
}
function xr(t, e) {
  t.seek(e);
  const n = t.offset16(), o = t.offset16(), s = t.uint16(), r = [];
  for (let i = 0; i < s; i++)
    r.push({
      tag: t.tag(),
      minOff: t.offset16(),
      maxOff: t.offset16()
    });
  return {
    minCoord: n ? Ne(t, e + n) : null,
    maxCoord: o ? Ne(t, e + o) : null,
    featMinMax: r.map((i) => ({
      tag: i.tag,
      minCoord: i.minOff ? Ne(t, e + i.minOff) : null,
      maxCoord: i.maxOff ? Ne(t, e + i.maxOff) : null
    }))
  };
}
function Ne(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.int16();
  if (n === 1) return { format: n, coordinate: o };
  if (n === 2)
    return {
      format: n,
      coordinate: o,
      referenceGlyph: t.uint16(),
      baseCoordPoint: t.uint16()
    };
  if (n === 3) {
    const s = t.offset16();
    return {
      format: n,
      coordinate: o,
      device: s ? Ae(t, e + s) : null
    };
  }
  return { format: n, coordinate: o };
}
function f0(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = e > 1 || e === 1 && n >= 1, s = Sr(t.horizAxis), r = Sr(t.vertAxis), i = o && t.itemVariationStore ? ne(t.itemVariationStore) : [];
  let c = o ? n0 : e0;
  const f = s.length ? c : 0;
  c += s.length;
  const l = r.length ? c : 0;
  c += r.length;
  const u = i.length ? c : 0;
  c += i.length;
  const h = new v(c);
  return h.uint16(e), h.uint16(n), h.offset16(f), h.offset16(l), o && h.offset32(u), h.rawBytes(s), h.rawBytes(r), h.rawBytes(i), h.toArray();
}
function Sr(t) {
  if (!t) return [];
  if (t._raw) return t._raw;
  const e = t.baseTagList ? l0(t.baseTagList) : [], n = u0(t.baseScriptList ?? []);
  let s = 4;
  const r = e.length ? s : 0;
  s += e.length;
  const i = n.length ? s : 0;
  s += n.length;
  const a = new v(s);
  return a.offset16(r), a.offset16(i), a.rawBytes(e), a.rawBytes(n), a.toArray();
}
function l0(t) {
  const e = 2 + 4 * t.length, n = new v(e);
  n.uint16(t.length);
  for (const o of t)
    n.tag(o);
  return n.toArray();
}
function u0(t) {
  const e = 2 + 6 * t.length, n = t.map((i) => h0(i));
  let o = e;
  const s = n.map((i) => {
    const a = o;
    return o += i.length, a;
  }), r = new v(o);
  r.uint16(t.length);
  for (let i = 0; i < t.length; i++)
    r.tag(t[i].tag), r.offset16(s[i]);
  for (const i of n)
    r.rawBytes(i);
  return r.toArray();
}
function h0(t) {
  const e = g0(t.baseValues), n = _r(t.defaultMinMax), o = t.langSystems ?? [], s = o.map((u) => _r(u.minMax));
  let i = 6 + 6 * o.length;
  const a = e.length ? i : 0;
  i += e.length;
  const c = n.length ? i : 0;
  i += n.length;
  const f = s.map((u) => {
    const h = u.length ? i : 0;
    return i += u.length, h;
  }), l = new v(i);
  l.offset16(a), l.offset16(c), l.uint16(o.length);
  for (let u = 0; u < o.length; u++)
    l.tag(o[u].tag), l.offset16(f[u]);
  l.rawBytes(e), l.rawBytes(n);
  for (const u of s)
    l.rawBytes(u);
  return l.toArray();
}
function g0(t) {
  if (!t) return [];
  const e = t.baseCoords ?? [], n = 4 + 2 * e.length, o = e.map((a) => Ge(a));
  let s = n;
  const r = o.map((a) => {
    const c = a.length ? s : 0;
    return s += a.length, c;
  }), i = new v(s);
  i.uint16(t.defaultBaselineIndex ?? 0), i.uint16(e.length);
  for (const a of r)
    i.offset16(a);
  for (const a of o)
    i.rawBytes(a);
  return i.toArray();
}
function _r(t) {
  if (!t) return [];
  const e = t.featMinMax ?? [], n = 6 + 8 * e.length, o = Ge(t.minCoord), s = Ge(t.maxCoord), r = e.map((u) => ({
    tag: u.tag,
    min: Ge(u.minCoord),
    max: Ge(u.maxCoord)
  }));
  let i = n;
  const a = o.length ? i : 0;
  i += o.length;
  const c = s.length ? i : 0;
  i += s.length;
  const f = r.map((u) => {
    const h = u.min.length ? i : 0;
    i += u.min.length;
    const p = u.max.length ? i : 0;
    return i += u.max.length, { minOff: h, maxOff: p };
  }), l = new v(i);
  l.offset16(a), l.offset16(c), l.uint16(e.length);
  for (let u = 0; u < e.length; u++)
    l.tag(e[u].tag), l.offset16(f[u].minOff), l.offset16(f[u].maxOff);
  l.rawBytes(o), l.rawBytes(s);
  for (const u of r)
    l.rawBytes(u.min), l.rawBytes(u.max);
  return l.toArray();
}
function Ge(t) {
  if (!t) return [];
  if (t.format === 1) {
    const e = new v(4);
    return e.uint16(1), e.int16(t.coordinate), e.toArray();
  }
  if (t.format === 2) {
    const e = new v(8);
    return e.uint16(2), e.int16(t.coordinate), e.uint16(t.referenceGlyph ?? 0), e.uint16(t.baseCoordPoint ?? 0), e.toArray();
  }
  if (t.format === 3) {
    const e = t.device ? Bn(t.device) : [], n = e.length ? 6 : 0, o = new v(6 + e.length);
    return o.uint16(3), o.int16(t.coordinate), o.offset16(n), o.rawBytes(e), o.toArray();
  }
  return [];
}
const He = 5, Kt = 8;
function yn(t) {
  return {
    height: t.uint8(),
    width: t.uint8(),
    bearingX: t.int8(),
    bearingY: t.int8(),
    advance: t.uint8()
  };
}
function yo(t, e) {
  t.uint8(e.height ?? 0), t.uint8(e.width ?? 0), t.int8(e.bearingX ?? 0), t.int8(e.bearingY ?? 0), t.uint8(e.advance ?? 0);
}
function le(t) {
  return {
    height: t.uint8(),
    width: t.uint8(),
    horiBearingX: t.int8(),
    horiBearingY: t.int8(),
    horiAdvance: t.uint8(),
    vertBearingX: t.int8(),
    vertBearingY: t.int8(),
    vertAdvance: t.uint8()
  };
}
function We(t, e) {
  t.uint8(e.height ?? 0), t.uint8(e.width ?? 0), t.int8(e.horiBearingX ?? 0), t.int8(e.horiBearingY ?? 0), t.uint8(e.horiAdvance ?? 0), t.int8(e.vertBearingX ?? 0), t.int8(e.vertBearingY ?? 0), t.uint8(e.vertAdvance ?? 0);
}
function Os(t, e) {
  const n = new F(t), o = n.uint32(), s = e?.CBLC;
  if (!s?.sizes)
    return { version: o, data: Array.from(t.slice(4)) };
  const r = [];
  for (const i of s.sizes) {
    const a = [];
    for (const c of i.indexSubTables ?? [])
      a.push(p0(t, n, c));
    r.push(a);
  }
  return { version: o, bitmapData: r };
}
function ks(t) {
  const e = t.version ?? 196608;
  if (t.data) {
    const o = t.data, s = new v(4 + o.length);
    return s.uint32(e), s.rawBytes(o), s.toArray();
  }
  const n = new v(4);
  return n.uint32(e), n.toArray();
}
function xo(t, e) {
  const n = t.version ?? 196608, o = t.bitmapData ?? [], s = e.sizes ?? [], r = [], i = [];
  let a = 4;
  for (let l = 0; l < s.length; l++) {
    const u = s[l].indexSubTables ?? [], h = o[l] ?? [], p = [];
    for (let g = 0; g < u.length; g++) {
      const d = u[g], x = h[g] ?? [], { bytes: y, info: m } = d0(x, d, a);
      p.push(m), r.push(y), a += y.length;
    }
    i.push(p);
  }
  const c = a, f = new v(c);
  f.uint32(n);
  for (const l of r)
    f.rawBytes(l);
  return { bytes: f.toArray(), offsetInfo: i };
}
function p0(t, e, n) {
  const { indexFormat: o, imageFormat: s, imageDataOffset: r } = n, i = [];
  switch (o) {
    case 1:
    case 3: {
      const a = n.sbitOffsets;
      for (let c = 0; c < a.length - 1; c++) {
        const f = r + a[c], u = r + a[c + 1] - f;
        u <= 0 ? i.push(null) : i.push(
          xn(t, e, f, s, u)
        );
      }
      break;
    }
    case 2: {
      const a = n.lastGlyphIndex - n.firstGlyphIndex + 1, { imageSize: c } = n;
      for (let f = 0; f < a; f++) {
        const l = r + f * c;
        i.push(
          xn(t, e, l, s, c)
        );
      }
      break;
    }
    case 4: {
      const a = n.glyphArray;
      for (let c = 0; c < a.length - 1; c++) {
        const f = r + a[c].sbitOffset, u = r + a[c + 1].sbitOffset - f;
        u <= 0 ? i.push(null) : i.push(
          xn(t, e, f, s, u)
        );
      }
      break;
    }
    case 5: {
      const a = n.glyphIdArray.length, { imageSize: c } = n;
      for (let f = 0; f < a; f++) {
        const l = r + f * c;
        i.push(
          xn(t, e, l, s, c)
        );
      }
      break;
    }
  }
  return i;
}
function xn(t, e, n, o, s) {
  if (s <= 0) return null;
  e.seek(n);
  const r = (i, a) => t.slice(i, i + a);
  switch (o) {
    case 1: {
      const i = yn(e), a = r(
        e.position,
        s - He
      );
      return { smallMetrics: i, imageData: a };
    }
    case 2: {
      const i = yn(e), a = r(
        e.position,
        s - He
      );
      return { smallMetrics: i, imageData: a };
    }
    case 5:
      return { imageData: r(n, s) };
    case 6: {
      const i = le(e), a = r(
        e.position,
        s - Kt
      );
      return { bigMetrics: i, imageData: a };
    }
    case 7: {
      const i = le(e), a = r(
        e.position,
        s - Kt
      );
      return { bigMetrics: i, imageData: a };
    }
    case 8: {
      const i = yn(e);
      e.skip(1);
      const a = e.uint16(), c = [];
      for (let f = 0; f < a; f++)
        c.push({
          glyphID: e.uint16(),
          xOffset: e.int8(),
          yOffset: e.int8()
        });
      return { smallMetrics: i, components: c };
    }
    case 9: {
      const i = le(e), a = e.uint16(), c = [];
      for (let f = 0; f < a; f++)
        c.push({
          glyphID: e.uint16(),
          xOffset: e.int8(),
          yOffset: e.int8()
        });
      return { bigMetrics: i, components: c };
    }
    case 17: {
      const i = yn(e), a = e.uint32(), c = r(e.position, a);
      return { smallMetrics: i, imageData: c };
    }
    case 18: {
      const i = le(e), a = e.uint32(), c = r(e.position, a);
      return { bigMetrics: i, imageData: c };
    }
    case 19: {
      const i = e.uint32();
      return { imageData: r(e.position, i) };
    }
    default:
      return { imageData: r(n, s) };
  }
}
function d0(t, e, n) {
  const { indexFormat: o, imageFormat: s } = e, r = { imageDataOffset: n }, i = t.map(
    (f) => f ? m0(f, s) : []
  );
  switch (o) {
    case 1:
    case 3: {
      const f = [0];
      let l = 0;
      for (const u of i)
        l += u.length, f.push(l);
      r.sbitOffsets = f;
      break;
    }
    case 2:
    case 5: {
      r.imageSize = e.imageSize ?? (i.length > 0 ? i[0].length : 0);
      break;
    }
    case 4: {
      const f = e.glyphIdArray ?? [], l = [];
      let u = 0;
      for (let h = 0; h < i.length; h++)
        l.push({
          glyphID: f[h] ?? 0,
          sbitOffset: u
        }), u += i[h].length;
      l.push({ glyphID: 0, sbitOffset: u }), r.glyphArray = l;
      break;
    }
  }
  const a = i.reduce((f, l) => f + l.length, 0), c = new v(a);
  for (const f of i)
    c.rawBytes(f);
  return { bytes: c.toArray(), info: r };
}
function m0(t, e) {
  switch (e) {
    case 1:
    case 2: {
      const n = t.imageData ?? [], o = new v(He + n.length);
      return yo(o, t.smallMetrics ?? {}), o.rawBytes(n), o.toArray();
    }
    case 5: {
      const n = t.imageData ?? [];
      return Array.from(n);
    }
    case 6:
    case 7: {
      const n = t.imageData ?? [], o = new v(Kt + n.length);
      return We(o, t.bigMetrics ?? {}), o.rawBytes(n), o.toArray();
    }
    case 8: {
      const n = t.components ?? [], o = new v(
        He + 1 + 2 + n.length * 4
      );
      yo(o, t.smallMetrics ?? {}), o.uint8(0), o.uint16(n.length);
      for (const s of n)
        o.uint16(s.glyphID ?? 0), o.int8(s.xOffset ?? 0), o.int8(s.yOffset ?? 0);
      return o.toArray();
    }
    case 9: {
      const n = t.components ?? [], o = new v(Kt + 2 + n.length * 4);
      We(o, t.bigMetrics ?? {}), o.uint16(n.length);
      for (const s of n)
        o.uint16(s.glyphID ?? 0), o.int8(s.xOffset ?? 0), o.int8(s.yOffset ?? 0);
      return o.toArray();
    }
    case 17: {
      const n = t.imageData ?? [], o = new v(He + 4 + n.length);
      return yo(o, t.smallMetrics ?? {}), o.uint32(n.length), o.rawBytes(n), o.toArray();
    }
    case 18: {
      const n = t.imageData ?? [], o = new v(Kt + 4 + n.length);
      return We(o, t.bigMetrics ?? {}), o.uint32(n.length), o.rawBytes(n), o.toArray();
    }
    case 19: {
      const n = t.imageData ?? [], o = new v(4 + n.length);
      return o.uint32(n.length), o.rawBytes(n), o.toArray();
    }
    default:
      return Array.from(t.imageData ?? []);
  }
}
function y0(t, e) {
  return Os(t, e?.bloc ? { CBLC: e.bloc } : e);
}
function x0(t) {
  return ks(t);
}
const nc = 48;
function Es(t) {
  return S0(t);
}
function me(t, e) {
  return e ? w0(t, e) : C0(t);
}
function S0(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint32(), r = [], i = [];
  for (let a = 0; a < s; a++) {
    const c = e.uint32();
    e.uint32();
    const f = e.uint32(), l = e.uint32(), u = wr(e), h = wr(e), p = e.uint16(), g = e.uint16(), d = e.uint8(), x = e.uint8(), y = e.uint8(), m = e.int8();
    r.push({
      colorRef: l,
      hori: u,
      vert: h,
      startGlyphIndex: p,
      endGlyphIndex: g,
      ppemX: d,
      ppemY: x,
      bitDepth: y,
      flags: m,
      indexSubTables: []
    }), i.push({
      indexSubTableArrayOffset: c,
      numberOfIndexSubTables: f
    });
  }
  for (let a = 0; a < s; a++) {
    const { indexSubTableArrayOffset: c, numberOfIndexSubTables: f } = i[a];
    f !== 0 && (r[a].indexSubTables = _0(
      e,
      c,
      f
    ));
  }
  return { majorVersion: n, minorVersion: o, sizes: r };
}
function _0(t, e, n) {
  t.seek(e);
  const o = [];
  for (let r = 0; r < n; r++)
    o.push({
      firstGlyphIndex: t.uint16(),
      lastGlyphIndex: t.uint16(),
      indexSubtableOffset: t.uint32()
    });
  const s = [];
  for (const r of o) {
    const i = e + r.indexSubtableOffset;
    t.seek(i);
    const a = t.uint16(), c = t.uint16(), f = t.uint32(), l = {
      firstGlyphIndex: r.firstGlyphIndex,
      lastGlyphIndex: r.lastGlyphIndex,
      indexFormat: a,
      imageFormat: c,
      imageDataOffset: f
    }, u = r.lastGlyphIndex - r.firstGlyphIndex + 1;
    switch (a) {
      case 1: {
        l.sbitOffsets = t.array("uint32", u + 1);
        break;
      }
      case 2: {
        l.imageSize = t.uint32(), l.bigMetrics = le(t);
        break;
      }
      case 3: {
        l.sbitOffsets = t.array("uint16", u + 1);
        break;
      }
      case 4: {
        const h = t.uint32();
        l.glyphArray = [];
        for (let p = 0; p <= h; p++)
          l.glyphArray.push({
            glyphID: t.uint16(),
            sbitOffset: t.uint16()
          });
        break;
      }
      case 5: {
        l.imageSize = t.uint32(), l.bigMetrics = le(t);
        const h = t.uint32();
        l.glyphIdArray = t.array("uint16", h);
        break;
      }
    }
    s.push(l);
  }
  return s;
}
function w0(t, e) {
  const n = t.majorVersion ?? 2, o = t.minorVersion ?? 0, s = t.sizes ?? [], r = s.map(
    (l, u) => b0(l.indexSubTables ?? [], e[u] ?? [])
  );
  let a = 8 + s.length * nc;
  const c = [];
  for (const l of r)
    c.push(a), a += l.length;
  const f = new v(a);
  f.uint16(n), f.uint16(o), f.uint32(s.length);
  for (let l = 0; l < s.length; l++) {
    const u = s[l], h = u.indexSubTables ?? [];
    f.uint32(c[l]), f.uint32(r[l].length), f.uint32(h.length), f.uint32(u.colorRef ?? 0), Vn(f, u.hori ?? {}), Vn(f, u.vert ?? {}), f.uint16(u.startGlyphIndex ?? 0), f.uint16(u.endGlyphIndex ?? 0), f.uint8(u.ppemX ?? 0), f.uint8(u.ppemY ?? 0), f.uint8(u.bitDepth ?? 0), f.int8(u.flags ?? 0);
  }
  for (const l of r)
    f.rawBytes(l);
  return f.toArray();
}
function b0(t, e) {
  const n = t.map(
    (a, c) => A0(a, e[c] ?? {})
  );
  let s = t.length * 8;
  const r = [];
  for (const a of n)
    r.push(s), s += a.length;
  const i = new v(s);
  for (let a = 0; a < t.length; a++)
    i.uint16(t[a].firstGlyphIndex), i.uint16(t[a].lastGlyphIndex), i.uint32(r[a]);
  for (const a of n)
    i.rawBytes(a);
  return i.toArray();
}
function A0(t, e) {
  const n = t.indexFormat, o = t.imageFormat, s = e.imageDataOffset ?? 0, r = 8;
  switch (n) {
    case 1: {
      const i = e.sbitOffsets ?? [], a = new v(r + i.length * 4);
      a.uint16(n), a.uint16(o), a.uint32(s);
      for (const c of i) a.uint32(c);
      return a.toArray();
    }
    case 2: {
      const i = new v(r + 4 + Kt);
      return i.uint16(n), i.uint16(o), i.uint32(s), i.uint32(t.imageSize ?? e.imageSize ?? 0), We(i, t.bigMetrics ?? {}), i.toArray();
    }
    case 3: {
      const i = e.sbitOffsets ?? [];
      let a = r + i.length * 2;
      i.length % 2 !== 0 && (a += 2);
      const c = new v(a);
      c.uint16(n), c.uint16(o), c.uint32(s);
      for (const f of i) c.uint16(f);
      return c.toArray();
    }
    case 4: {
      const i = e.glyphArray ?? [], a = i.length > 0 ? i.length - 1 : 0, c = new v(r + 4 + i.length * 4);
      c.uint16(n), c.uint16(o), c.uint32(s), c.uint32(a);
      for (const f of i)
        c.uint16(f.glyphID), c.uint16(f.sbitOffset);
      return c.toArray();
    }
    case 5: {
      const i = t.glyphIdArray ?? [];
      let a = r + 4 + Kt + 4 + i.length * 2;
      i.length % 2 !== 0 && (a += 2);
      const c = new v(a);
      c.uint16(n), c.uint16(o), c.uint32(s), c.uint32(t.imageSize ?? e.imageSize ?? 0), We(c, t.bigMetrics ?? {}), c.uint32(i.length);
      for (const f of i) c.uint16(f);
      return c.toArray();
    }
    default:
      throw new Error(`Unsupported index format: ${n}`);
  }
}
function C0(t) {
  const e = t.majorVersion ?? 2, n = t.minorVersion ?? 0, o = t.sizes ?? [], s = t.data ?? [], r = 8 + o.length * nc + s.length, i = new v(r);
  i.uint16(e), i.uint16(n), i.uint32(o.length);
  for (const a of o)
    i.uint32(a.indexSubTableArrayOffset ?? 0), i.uint32(a.indexTablesSize ?? 0), i.uint32(a.numberOfIndexSubTables ?? 0), i.uint32(a.colorRef ?? 0), Vn(i, a.hori ?? {}), Vn(i, a.vert ?? {}), i.uint16(a.startGlyphIndex ?? 0), i.uint16(a.endGlyphIndex ?? 0), i.uint8(a.ppemX ?? 0), i.uint8(a.ppemY ?? 0), i.uint8(a.bitDepth ?? 0), i.int8(a.flags ?? 0);
  return i.rawBytes(s), i.toArray();
}
function wr(t) {
  return {
    ascender: t.int8(),
    descender: t.int8(),
    widthMax: t.uint8(),
    caretSlopeNumerator: t.int8(),
    caretSlopeDenominator: t.int8(),
    caretOffset: t.int8(),
    minOriginSB: t.int8(),
    minAdvanceSB: t.int8(),
    maxBeforeBL: t.int8(),
    minAfterBL: t.int8(),
    pad1: t.int8(),
    pad2: t.int8()
  };
}
function Vn(t, e) {
  t.int8(e.ascender ?? 0), t.int8(e.descender ?? 0), t.uint8(e.widthMax ?? 0), t.int8(e.caretSlopeNumerator ?? 0), t.int8(e.caretSlopeDenominator ?? 0), t.int8(e.caretOffset ?? 0), t.int8(e.minOriginSB ?? 0), t.int8(e.minAdvanceSB ?? 0), t.int8(e.maxBeforeBL ?? 0), t.int8(e.minAfterBL ?? 0), t.int8(e.pad1 ?? 0), t.int8(e.pad2 ?? 0);
}
function v0(t) {
  return Es(t);
}
function I0(t) {
  return me(t);
}
function O0(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = [], r = /* @__PURE__ */ new Set();
  for (let l = 0; l < o; l++) {
    const u = e.uint16(), h = e.uint16(), p = e.offset32();
    r.add(p), s.push({ platformID: u, encodingID: h, subtableOffset: p });
  }
  const i = [...r].sort((l, u) => l - u), a = i.map((l) => k0(e, l)), c = new Map(i.map((l, u) => [l, u])), f = s.map((l) => ({
    platformID: l.platformID,
    encodingID: l.encodingID,
    subtableIndex: c.get(l.subtableOffset)
  }));
  return { version: n, encodingRecords: f, subtables: a };
}
function k0(t, e) {
  t.seek(e);
  const n = t.uint16();
  switch (n) {
    case 0:
      return E0(t);
    case 2:
      return T0(t, e);
    case 4:
      return D0(t, e);
    case 6:
      return R0(t);
    case 8:
      return $0(t);
    case 10:
      return N0(t);
    case 12:
      return F0(t);
    case 13:
      return M0(t);
    case 14:
      return L0(t, e);
    default:
      return G0(t, e, n);
  }
}
function E0(t) {
  t.skip(2);
  const e = t.uint16(), n = t.array("uint8", 256);
  return { format: 0, language: e, glyphIdArray: n };
}
function T0(t, e) {
  const n = t.uint16(), o = t.uint16(), s = t.array("uint16", 256);
  let r = 0;
  for (let h = 0; h < 256; h++)
    s[h] > r && (r = s[h]);
  const i = r / 8 + 1, a = [];
  for (let h = 0; h < i; h++)
    a.push({
      firstCode: t.uint16(),
      entryCount: t.uint16(),
      idDelta: t.int16(),
      idRangeOffset: t.uint16()
    });
  const c = t.position, l = (e + n - c) / 2, u = t.array("uint16", l);
  return { format: 2, language: o, subHeaderKeys: s, subHeaders: a, glyphIdArray: u };
}
function D0(t, e) {
  const n = t.uint16(), o = t.uint16(), r = t.uint16() / 2;
  t.skip(6);
  const i = t.array("uint16", r);
  t.skip(2);
  const a = t.array("uint16", r), c = t.array("int16", r), f = t.array("uint16", r), l = t.position, u = (n - (l - e)) / 2, h = t.array("uint16", u), p = [];
  for (let g = 0; g < r; g++)
    p.push({
      endCode: i[g],
      startCode: a[g],
      idDelta: c[g],
      idRangeOffset: f[g]
    });
  return { format: 4, language: o, segments: p, glyphIdArray: h };
}
function R0(t) {
  t.skip(2);
  const e = t.uint16(), n = t.uint16(), o = t.uint16(), s = t.array("uint16", o);
  return { format: 6, language: e, firstCode: n, glyphIdArray: s };
}
function F0(t) {
  t.skip(2), t.skip(4);
  const e = t.uint32(), n = t.uint32(), o = [];
  for (let s = 0; s < n; s++)
    o.push({
      startCharCode: t.uint32(),
      endCharCode: t.uint32(),
      startGlyphID: t.uint32()
    });
  return { format: 12, language: e, groups: o };
}
function M0(t) {
  t.skip(2), t.skip(4);
  const e = t.uint32(), n = t.uint32(), o = [];
  for (let s = 0; s < n; s++)
    o.push({
      startCharCode: t.uint32(),
      endCharCode: t.uint32(),
      glyphID: t.uint32()
    });
  return { format: 13, language: e, groups: o };
}
function L0(t, e) {
  t.skip(4);
  const n = t.uint32(), o = [];
  for (let s = 0; s < n; s++) {
    const r = t.uint24(), i = t.offset32(), a = t.offset32();
    let c = null;
    if (i !== 0) {
      const l = t.position;
      c = B0(t, e + i), t.seek(l);
    }
    let f = null;
    if (a !== 0) {
      const l = t.position;
      f = V0(
        t,
        e + a
      ), t.seek(l);
    }
    o.push({ varSelector: r, defaultUVS: c, nonDefaultUVS: f });
  }
  return { format: 14, varSelectorRecords: o };
}
function B0(t, e) {
  t.seek(e);
  const n = t.uint32(), o = [];
  for (let s = 0; s < n; s++)
    o.push({
      startUnicodeValue: t.uint24(),
      additionalCount: t.uint8()
    });
  return o;
}
function V0(t, e) {
  t.seek(e);
  const n = t.uint32(), o = [];
  for (let s = 0; s < n; s++)
    o.push({
      unicodeValue: t.uint24(),
      glyphID: t.uint16()
    });
  return o;
}
function $0(t) {
  t.skip(2), t.skip(4);
  const e = t.uint32(), n = t.bytes(8192), o = t.uint32(), s = [];
  for (let r = 0; r < o; r++)
    s.push({
      startCharCode: t.uint32(),
      endCharCode: t.uint32(),
      startGlyphID: t.uint32()
    });
  return { format: 8, language: e, is32: n, groups: s };
}
function N0(t) {
  t.skip(2), t.skip(4);
  const e = t.uint32(), n = t.uint32(), o = t.uint32(), s = t.array("uint16", o);
  return { format: 10, language: e, startCharCode: n, glyphIdArray: s };
}
function G0(t, e, n) {
  let o;
  n >= 8 ? (t.skip(2), o = t.uint32()) : o = t.uint16(), t.seek(e);
  const s = t.bytes(o);
  return { format: n, _raw: s };
}
function P0(t) {
  const { version: e, encodingRecords: n, subtables: o } = t, s = n.map((u, h) => ({ rec: u, originalIndex: h })).sort((u, h) => {
    if (u.rec.platformID !== h.rec.platformID)
      return u.rec.platformID - h.rec.platformID;
    if (u.rec.encodingID !== h.rec.encodingID)
      return u.rec.encodingID - h.rec.encodingID;
    const p = (o[u.rec.subtableIndex] || {}).language || 0, g = (o[h.rec.subtableIndex] || {}).language || 0;
    return p - g;
  }).map(({ rec: u }) => u), r = o.map(U0), i = 4 + s.length * 8, a = [];
  let c = i;
  for (const u of r)
    a.push(c), c += u.length;
  const f = c, l = new v(f);
  l.uint16(e), l.uint16(s.length);
  for (const u of s)
    l.uint16(u.platformID), l.uint16(u.encodingID), l.offset32(a[u.subtableIndex]);
  for (let u = 0; u < r.length; u++)
    l.seek(a[u]), l.rawBytes(r[u]);
  return l.toArray();
}
function U0(t) {
  switch (t.format) {
    case 0:
      return z0(t);
    case 2:
      return H0(t);
    case 4:
      return W0(t);
    case 6:
      return j0(t);
    case 8:
      return Y0(t);
    case 10:
      return Z0(t);
    case 12:
      return X0(t);
    case 13:
      return q0(t);
    case 14:
      return K0(t);
    default:
      return t._raw;
  }
}
function z0(t) {
  const n = new v(262);
  return n.uint16(0), n.uint16(262), n.uint16(t.language), n.array("uint8", t.glyphIdArray), n.toArray();
}
function H0(t) {
  const { language: e, subHeaderKeys: n, subHeaders: o, glyphIdArray: s } = t, r = 518 + o.length * 8 + s.length * 2, i = new v(r);
  i.uint16(2), i.uint16(r), i.uint16(e), i.array("uint16", n);
  for (const a of o)
    i.uint16(a.firstCode), i.uint16(a.entryCount), i.int16(a.idDelta), i.uint16(a.idRangeOffset);
  return i.array("uint16", s), i.toArray();
}
function W0(t) {
  const { language: e, segments: n, glyphIdArray: o } = t, s = n.length, r = s * 2, i = Math.floor(Math.log2(s)), a = Math.pow(2, i) * 2, c = r - a, f = 14 + s * 8 + 2 + o.length * 2, l = new v(f);
  l.uint16(4), l.uint16(f), l.uint16(e), l.uint16(r), l.uint16(a), l.uint16(i), l.uint16(c);
  for (const u of n) l.uint16(u.endCode);
  l.uint16(0);
  for (const u of n) l.uint16(u.startCode);
  for (const u of n) l.int16(u.idDelta);
  for (const u of n) l.uint16(u.idRangeOffset);
  return l.array("uint16", o), l.toArray();
}
function j0(t) {
  const { language: e, firstCode: n, glyphIdArray: o } = t, s = o.length, r = 10 + s * 2, i = new v(r);
  return i.uint16(6), i.uint16(r), i.uint16(e), i.uint16(n), i.uint16(s), i.array("uint16", o), i.toArray();
}
function Y0(t) {
  const { language: e, is32: n, groups: o } = t, s = 8208 + o.length * 12, r = new v(s);
  r.uint16(8), r.uint16(0), r.uint32(s), r.uint32(e), r.rawBytes(n), r.uint32(o.length);
  for (const i of o)
    r.uint32(i.startCharCode), r.uint32(i.endCharCode), r.uint32(i.startGlyphID);
  return r.toArray();
}
function Z0(t) {
  const { language: e, startCharCode: n, glyphIdArray: o } = t, s = 20 + o.length * 2, r = new v(s);
  return r.uint16(10), r.uint16(0), r.uint32(s), r.uint32(e), r.uint32(n), r.uint32(o.length), r.array("uint16", o), r.toArray();
}
function X0(t) {
  const e = t.groups.length, n = 16 + e * 12, o = new v(n);
  o.uint16(12), o.uint16(0), o.uint32(n), o.uint32(t.language), o.uint32(e);
  for (const s of t.groups)
    o.uint32(s.startCharCode), o.uint32(s.endCharCode), o.uint32(s.startGlyphID);
  return o.toArray();
}
function q0(t) {
  const e = t.groups.length, n = 16 + e * 12, o = new v(n);
  o.uint16(13), o.uint16(0), o.uint32(n), o.uint32(t.language), o.uint32(e);
  for (const s of t.groups)
    o.uint32(s.startCharCode), o.uint32(s.endCharCode), o.uint32(s.glyphID);
  return o.toArray();
}
function K0(t) {
  const { varSelectorRecords: e } = t, n = e.map((c) => ({
    defaultUVSBytes: c.defaultUVS ? J0(c.defaultUVS) : null,
    nonDefaultUVSBytes: c.nonDefaultUVS ? Q0(c.nonDefaultUVS) : null
  }));
  let s = 10 + e.length * 11;
  const r = n.map((c) => {
    let f = 0;
    c.defaultUVSBytes && (f = s, s += c.defaultUVSBytes.length);
    let l = 0;
    return c.nonDefaultUVSBytes && (l = s, s += c.nonDefaultUVSBytes.length), { defaultUVSOffset: f, nonDefaultUVSOffset: l };
  }), i = s, a = new v(i);
  a.uint16(14), a.uint32(i), a.uint32(e.length);
  for (let c = 0; c < e.length; c++)
    a.uint24(e[c].varSelector), a.uint32(r[c].defaultUVSOffset), a.uint32(r[c].nonDefaultUVSOffset);
  for (let c = 0; c < n.length; c++)
    n[c].defaultUVSBytes && a.rawBytes(n[c].defaultUVSBytes), n[c].nonDefaultUVSBytes && a.rawBytes(n[c].nonDefaultUVSBytes);
  return a.toArray();
}
function J0(t) {
  const e = 4 + t.length * 4, n = new v(e);
  n.uint32(t.length);
  for (const o of t)
    n.uint24(o.startUnicodeValue), n.uint8(o.additionalCount);
  return n.toArray();
}
function Q0(t) {
  const e = 4 + t.length * 5, n = new v(e);
  n.uint32(t.length);
  for (const o of t)
    n.uint24(o.unicodeValue), n.uint16(o.glyphID);
  return n.toArray();
}
const Pe = [
  0,
  // index 0 unused
  6,
  5,
  9,
  // 1-3
  16,
  20,
  // 4-5  (+ ColorLine / VarColorLine inline)
  16,
  20,
  // 6-7  (+ ColorLine / VarColorLine inline)
  12,
  16,
  // 8-9  (+ ColorLine / VarColorLine inline)
  6,
  3,
  // 10-11
  7,
  7,
  // 12-13 (+ Affine2x3 / VarAffine2x3 inline)
  8,
  12,
  // 14-15
  8,
  12,
  // 16-17
  12,
  16,
  // 18-19
  6,
  10,
  // 20-21
  10,
  14,
  // 22-23
  6,
  10,
  // 24-25
  10,
  14,
  // 26-27
  8,
  12,
  // 28-29
  12,
  16,
  // 30-31
  8
  // 32
], oc = 15, sc = 48;
function tg(t, e) {
  return e === 1 ? t.uint8() : e === 2 ? t.uint16() : e === 3 ? t.uint24() : t.uint32();
}
function eg(t, e, n) {
  n === 1 ? t.uint8(e) : n === 2 ? t.uint16(e) : n === 3 ? t.uint24(e) : t.uint32(e >>> 0);
}
function ng(t, e) {
  t.seek(e);
  const n = t.uint8(), o = t.uint8(), s = n === 1 ? t.uint32() : t.uint16(), r = (o & oc) + 1, i = ((o & sc) >> 4) + 1, a = [];
  for (let c = 0; c < s; c++) {
    const f = tg(t, i), l = (1 << r) - 1;
    a.push({
      outerIndex: f >> r,
      innerIndex: f & l
    });
  }
  return { format: n, entryFormat: o, mapCount: s, entries: a };
}
function og(t) {
  const e = t.entries ?? [], n = t.mapCount ?? e.length, o = t.format ?? (n > 65535 ? 1 : 0);
  let s = 0, r = 0;
  for (const g of e)
    s = Math.max(s, g.innerIndex ?? 0), r = Math.max(r, g.outerIndex ?? 0);
  let i = 1;
  for (; (1 << i) - 1 < s && i < 16; )
    i++;
  const a = r << i | s;
  let c = 1;
  for (; c < 4 && a > (c === 1 ? 255 : c === 2 ? 65535 : 16777215); )
    c++;
  const f = t.entryFormat ?? c - 1 << 4 | i - 1, l = o === 1 ? 6 : 4, u = (f & oc) + 1, h = ((f & sc) >> 4) + 1, p = new v(l + n * h);
  p.uint8(o), p.uint8(f), o === 1 ? p.uint32(n) : p.uint16(n);
  for (let g = 0; g < n; g++) {
    const d = e[g] ?? { outerIndex: 0, innerIndex: 0 }, x = (d.outerIndex ?? 0) << u | (d.innerIndex ?? 0) & (1 << u) - 1;
    eg(p, x, h);
  }
  return p.toArray();
}
function sg(t, e) {
  const n = /* @__PURE__ */ new Map(), o = rg(
    t,
    e.baseGlyphListOffset,
    n
  ), s = e.layerListOffset ? ig(t, e.layerListOffset, n) : null, r = e.clipListOffset ? ag(t, e.clipListOffset) : null, i = e.varIndexMapOffset ? ng(t, e.varIndexMapOffset) : null;
  e.itemVariationStoreOffset && Pt(
    t.bytes(0).length ? [] : []
    // unused — we re-read below
  );
  let a = null;
  if (e.itemVariationStoreOffset) {
    t.seek(e.itemVariationStoreOffset);
    const c = [];
    for (; t.position < t.length; )
      c.push(t.uint8());
    a = Pt(c);
  }
  return {
    baseGlyphPaintRecords: o,
    layerPaints: s,
    clipList: r,
    varIndexMap: i,
    itemVariationStore: a
  };
}
function rg(t, e, n) {
  t.seek(e);
  const o = t.uint32(), s = [], r = [];
  for (let i = 0; i < o; i++)
    r.push({
      glyphID: t.uint16(),
      paintOffset: t.uint32()
    });
  for (const i of r)
    s.push({
      glyphID: i.glyphID,
      paint: et(t, e + i.paintOffset, n)
    });
  return s;
}
function ig(t, e, n) {
  t.seek(e);
  const o = t.uint32(), s = [];
  for (let i = 0; i < o; i++)
    s.push(t.uint32());
  const r = [];
  for (const i of s)
    r.push(et(t, e + i, n));
  return r;
}
function ag(t, e) {
  t.seek(e);
  const n = t.uint8(), o = t.uint32(), s = [];
  for (let i = 0; i < o; i++)
    s.push({
      startGlyphID: t.uint16(),
      endGlyphID: t.uint16(),
      clipBoxOffset: t.uint24()
    });
  const r = s.map((i) => ({
    startGlyphID: i.startGlyphID,
    endGlyphID: i.endGlyphID,
    clipBox: cg(t, e + i.clipBoxOffset)
  }));
  return { format: n, clips: r };
}
function cg(t, e) {
  t.seek(e);
  const n = t.uint8(), o = t.fword(), s = t.fword(), r = t.fword(), i = t.fword(), a = { format: n, xMin: o, yMin: s, xMax: r, yMax: i };
  return n === 2 && (a.varIndexBase = t.uint32()), a;
}
function Ts(t, e, n) {
  t.seek(e);
  const o = t.uint8(), s = t.uint16(), r = [];
  for (let i = 0; i < s; i++) {
    const a = {
      stopOffset: t.f2dot14(),
      paletteIndex: t.uint16(),
      alpha: t.f2dot14()
    };
    n && (a.varIndexBase = t.uint32()), r.push(a);
  }
  return { extend: o, colorStops: r };
}
function fg(t, e, n) {
  t.seek(e);
  const o = {
    xx: t.fixed(),
    yx: t.fixed(),
    xy: t.fixed(),
    yy: t.fixed(),
    dx: t.fixed(),
    dy: t.fixed()
  };
  return n && (o.varIndexBase = t.uint32()), o;
}
function et(t, e, n) {
  if (n.has(e)) return n.get(e);
  t.seek(e);
  const o = t.uint8();
  let s;
  switch (o) {
    case 1:
      s = lg(t);
      break;
    case 2:
      s = br(t, !1);
      break;
    case 3:
      s = br(t, !0);
      break;
    case 4:
      s = Ar(t, e, !1);
      break;
    case 5:
      s = Ar(t, e, !0);
      break;
    case 6:
      s = Cr(t, e, !1);
      break;
    case 7:
      s = Cr(t, e, !0);
      break;
    case 8:
      s = vr(t, e, !1);
      break;
    case 9:
      s = vr(t, e, !0);
      break;
    case 10:
      s = ug(t, e, n);
      break;
    case 11:
      s = hg(t);
      break;
    case 12:
      s = Ir(t, e, n, !1);
      break;
    case 13:
      s = Ir(t, e, n, !0);
      break;
    case 14:
      s = Or(t, e, n, !1);
      break;
    case 15:
      s = Or(t, e, n, !0);
      break;
    case 16:
      s = kr(t, e, n, !1);
      break;
    case 17:
      s = kr(t, e, n, !0);
      break;
    case 18:
      s = Er(t, e, n, !1);
      break;
    case 19:
      s = Er(t, e, n, !0);
      break;
    case 20:
      s = Tr(t, e, n, !1);
      break;
    case 21:
      s = Tr(t, e, n, !0);
      break;
    case 22:
      s = Dr(t, e, n, !1);
      break;
    case 23:
      s = Dr(t, e, n, !0);
      break;
    case 24:
      s = Rr(t, e, n, !1);
      break;
    case 25:
      s = Rr(t, e, n, !0);
      break;
    case 26:
      s = Fr(t, e, n, !1);
      break;
    case 27:
      s = Fr(t, e, n, !0);
      break;
    case 28:
      s = Mr(t, e, n, !1);
      break;
    case 29:
      s = Mr(t, e, n, !0);
      break;
    case 30:
      s = Lr(t, e, n, !1);
      break;
    case 31:
      s = Lr(t, e, n, !0);
      break;
    case 32:
      s = gg(t, e, n);
      break;
    default:
      return s = { format: o, _unknown: !0 }, n.set(e, s), s;
  }
  return s.format = o, n.set(e, s), s;
}
function lg(t) {
  return {
    numLayers: t.uint8(),
    firstLayerIndex: t.uint32()
  };
}
function br(t, e) {
  const n = {
    paletteIndex: t.uint16(),
    alpha: t.f2dot14()
  };
  return e && (n.varIndexBase = t.uint32()), n;
}
function Ar(t, e, n) {
  const o = t.uint24(), s = {
    x0: t.fword(),
    y0: t.fword(),
    x1: t.fword(),
    y1: t.fword(),
    x2: t.fword(),
    y2: t.fword()
  };
  return n && (s.varIndexBase = t.uint32()), s.colorLine = Ts(t, e + o, n), s;
}
function Cr(t, e, n) {
  const o = t.uint24(), s = {
    x0: t.fword(),
    y0: t.fword(),
    radius0: t.ufword(),
    x1: t.fword(),
    y1: t.fword(),
    radius1: t.ufword()
  };
  return n && (s.varIndexBase = t.uint32()), s.colorLine = Ts(t, e + o, n), s;
}
function vr(t, e, n) {
  const o = t.uint24(), s = {
    centerX: t.fword(),
    centerY: t.fword(),
    startAngle: t.f2dot14(),
    endAngle: t.f2dot14()
  };
  return n && (s.varIndexBase = t.uint32()), s.colorLine = Ts(t, e + o, n), s;
}
function ug(t, e, n) {
  const o = t.uint24();
  return {
    glyphID: t.uint16(),
    paint: et(t, e + o, n)
  };
}
function hg(t) {
  return { glyphID: t.uint16() };
}
function Ir(t, e, n, o) {
  const s = t.uint24(), r = t.uint24();
  return {
    paint: et(t, e + s, n),
    transform: fg(t, e + r, o)
  };
}
function Or(t, e, n, o) {
  const s = t.uint24(), r = {
    dx: t.fword(),
    dy: t.fword()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = et(t, e + s, n), r;
}
function kr(t, e, n, o) {
  const s = t.uint24(), r = {
    scaleX: t.f2dot14(),
    scaleY: t.f2dot14()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = et(t, e + s, n), r;
}
function Er(t, e, n, o) {
  const s = t.uint24(), r = {
    scaleX: t.f2dot14(),
    scaleY: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = et(t, e + s, n), r;
}
function Tr(t, e, n, o) {
  const s = t.uint24(), r = { scale: t.f2dot14() };
  return o && (r.varIndexBase = t.uint32()), r.paint = et(t, e + s, n), r;
}
function Dr(t, e, n, o) {
  const s = t.uint24(), r = {
    scale: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = et(t, e + s, n), r;
}
function Rr(t, e, n, o) {
  const s = t.uint24(), r = { angle: t.f2dot14() };
  return o && (r.varIndexBase = t.uint32()), r.paint = et(t, e + s, n), r;
}
function Fr(t, e, n, o) {
  const s = t.uint24(), r = {
    angle: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = et(t, e + s, n), r;
}
function Mr(t, e, n, o) {
  const s = t.uint24(), r = {
    xSkewAngle: t.f2dot14(),
    ySkewAngle: t.f2dot14()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = et(t, e + s, n), r;
}
function Lr(t, e, n, o) {
  const s = t.uint24(), r = {
    xSkewAngle: t.f2dot14(),
    ySkewAngle: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = et(t, e + s, n), r;
}
function gg(t, e, n) {
  const o = t.uint24(), s = t.uint8(), r = t.uint24();
  return {
    sourcePaint: et(t, e + o, n),
    compositeMode: s,
    backdropPaint: et(t, e + r, n)
  };
}
function pg(t) {
  const {
    baseGlyphPaintRecords: e,
    layerPaints: n,
    clipList: o,
    varIndexMap: s,
    itemVariationStore: r
  } = t, i = /* @__PURE__ */ new Map(), a = [];
  function c(D) {
    if (!(!D || i.has(D))) {
      i.set(D, a.length), a.push(D);
      for (const R of Zo(D))
        c(R);
    }
  }
  if (e)
    for (const D of e)
      c(D.paint);
  if (n)
    for (const D of n)
      c(D);
  const f = dg(a), l = /* @__PURE__ */ new Map();
  for (const D of f)
    l.set(D, mg(D));
  const u = /* @__PURE__ */ new Map();
  let h = 0;
  for (const D of f)
    u.set(D, h), h += l.get(D);
  const p = h, g = e ? e.length : 0, d = 4 + g * 6, x = n ? n.length : 0, y = x > 0 ? 4 + x * 4 : 0, m = o ? Sg(o) : [], w = s ? og(s) : [], _ = r ? ne(r) : [], S = d + y + p + m.length + w.length + _.length, b = 0, A = d, k = d + y, O = k + p, I = O + m.length, E = I + w.length, T = new v(S);
  T.uint32(g);
  for (const D of e || [])
    T.uint16(D.glyphID), T.uint32(k - b + u.get(D.paint));
  if (x > 0) {
    T.uint32(x);
    for (const D of n)
      T.uint32(k - A + u.get(D));
  }
  for (const D of f)
    yg(
      T,
      D,
      k + u.get(D),
      u,
      k
    );
  return T.rawBytes(m), T.rawBytes(w), T.rawBytes(_), {
    bodyBytes: T.toArray(),
    bglBodyOffset: b,
    llBodyOffset: x > 0 ? A : 0,
    clipBodyOffset: m.length > 0 ? O : 0,
    dimBodyOffset: w.length > 0 ? I : 0,
    ivsBodyOffset: _.length > 0 ? E : 0
  };
}
function Zo(t) {
  if (!t) return [];
  const e = [];
  return t.paint && e.push(t.paint), t.sourcePaint && e.push(t.sourcePaint), t.backdropPaint && e.push(t.backdropPaint), e;
}
function dg(t, e) {
  const n = /* @__PURE__ */ new Map();
  for (const a of t) n.set(a, 0);
  for (const a of t)
    for (const c of Zo(a))
      n.has(c) && n.set(c, n.get(c) + 1);
  const o = [];
  let s = 0;
  for (const a of t)
    n.get(a) === 0 && o.push(a);
  const r = [], i = /* @__PURE__ */ new Set();
  for (; s < o.length; ) {
    const a = o[s++];
    r.push(a), i.add(a);
    for (const c of Zo(a)) {
      if (!n.has(c)) continue;
      const f = n.get(c) - 1;
      n.set(c, f), f === 0 && o.push(c);
    }
  }
  for (const a of t)
    i.has(a) || r.push(a);
  return r;
}
function mg(t) {
  const e = Pe[t.format] || 0, n = t.format;
  return n === 4 || n === 6 || n === 8 ? e + Br(t.colorLine, !1) : n === 5 || n === 7 || n === 9 ? e + Br(t.colorLine, !0) : n === 12 ? e + 24 : n === 13 ? e + 28 : e;
}
function Br(t, e) {
  if (!t) return 0;
  const n = e ? 10 : 6;
  return 3 + t.colorStops.length * n;
}
function yg(t, e, n, o, s) {
  const r = e.format;
  switch (t.uint8(r), r) {
    case 1:
      t.uint8(e.numLayers), t.uint32(e.firstLayerIndex);
      break;
    case 2:
      t.uint16(e.paletteIndex), t.f2dot14(e.alpha);
      break;
    case 3:
      t.uint16(e.paletteIndex), t.f2dot14(e.alpha), t.uint32(e.varIndexBase);
      break;
    case 4:
    // PaintLinearGradient
    case 5: {
      const i = Pe[r];
      t.uint24(i), t.fword(e.x0), t.fword(e.y0), t.fword(e.x1), t.fword(e.y1), t.fword(e.x2), t.fword(e.y2), r === 5 && t.uint32(e.varIndexBase), So(t, e.colorLine, r === 5);
      break;
    }
    case 6:
    // PaintRadialGradient
    case 7: {
      const i = Pe[r];
      t.uint24(i), t.fword(e.x0), t.fword(e.y0), t.ufword(e.radius0), t.fword(e.x1), t.fword(e.y1), t.ufword(e.radius1), r === 7 && t.uint32(e.varIndexBase), So(t, e.colorLine, r === 7);
      break;
    }
    case 8:
    // PaintSweepGradient
    case 9: {
      const i = Pe[r];
      t.uint24(i), t.fword(e.centerX), t.fword(e.centerY), t.f2dot14(e.startAngle), t.f2dot14(e.endAngle), r === 9 && t.uint32(e.varIndexBase), So(t, e.colorLine, r === 9);
      break;
    }
    case 10: {
      const i = s + o.get(e.paint);
      t.uint24(i - n), t.uint16(e.glyphID);
      break;
    }
    case 11:
      t.uint16(e.glyphID);
      break;
    case 12:
    // PaintTransform
    case 13: {
      const i = s + o.get(e.paint), a = Pe[r];
      t.uint24(i - n), t.uint24(a), xg(t, e.transform, r === 13);
      break;
    }
    case 14:
    // PaintTranslate
    case 15: {
      const i = s + o.get(e.paint);
      t.uint24(i - n), t.fword(e.dx), t.fword(e.dy), r === 15 && t.uint32(e.varIndexBase);
      break;
    }
    case 16:
    // PaintScale
    case 17: {
      const i = s + o.get(e.paint);
      t.uint24(i - n), t.f2dot14(e.scaleX), t.f2dot14(e.scaleY), r === 17 && t.uint32(e.varIndexBase);
      break;
    }
    case 18:
    // PaintScaleAroundCenter
    case 19: {
      const i = s + o.get(e.paint);
      t.uint24(i - n), t.f2dot14(e.scaleX), t.f2dot14(e.scaleY), t.fword(e.centerX), t.fword(e.centerY), r === 19 && t.uint32(e.varIndexBase);
      break;
    }
    case 20:
    // PaintScaleUniform
    case 21: {
      const i = s + o.get(e.paint);
      t.uint24(i - n), t.f2dot14(e.scale), r === 21 && t.uint32(e.varIndexBase);
      break;
    }
    case 22:
    // PaintScaleUniformAroundCenter
    case 23: {
      const i = s + o.get(e.paint);
      t.uint24(i - n), t.f2dot14(e.scale), t.fword(e.centerX), t.fword(e.centerY), r === 23 && t.uint32(e.varIndexBase);
      break;
    }
    case 24:
    // PaintRotate
    case 25: {
      const i = s + o.get(e.paint);
      t.uint24(i - n), t.f2dot14(e.angle), r === 25 && t.uint32(e.varIndexBase);
      break;
    }
    case 26:
    // PaintRotateAroundCenter
    case 27: {
      const i = s + o.get(e.paint);
      t.uint24(i - n), t.f2dot14(e.angle), t.fword(e.centerX), t.fword(e.centerY), r === 27 && t.uint32(e.varIndexBase);
      break;
    }
    case 28:
    // PaintSkew
    case 29: {
      const i = s + o.get(e.paint);
      t.uint24(i - n), t.f2dot14(e.xSkewAngle), t.f2dot14(e.ySkewAngle), r === 29 && t.uint32(e.varIndexBase);
      break;
    }
    case 30:
    // PaintSkewAroundCenter
    case 31: {
      const i = s + o.get(e.paint);
      t.uint24(i - n), t.f2dot14(e.xSkewAngle), t.f2dot14(e.ySkewAngle), t.fword(e.centerX), t.fword(e.centerY), r === 31 && t.uint32(e.varIndexBase);
      break;
    }
    case 32: {
      const i = s + o.get(e.sourcePaint), a = s + o.get(e.backdropPaint);
      t.uint24(i - n), t.uint8(e.compositeMode), t.uint24(a - n);
      break;
    }
  }
}
function So(t, e, n) {
  t.uint8(e.extend), t.uint16(e.colorStops.length);
  for (const o of e.colorStops)
    t.f2dot14(o.stopOffset), t.uint16(o.paletteIndex), t.f2dot14(o.alpha), n && t.uint32(o.varIndexBase);
}
function xg(t, e, n) {
  t.fixed(e.xx), t.fixed(e.yx), t.fixed(e.xy), t.fixed(e.yy), t.fixed(e.dx), t.fixed(e.dy), n && t.uint32(e.varIndexBase);
}
function Sg(t) {
  if (!t || !t.clips || t.clips.length === 0) return [];
  const e = [];
  for (const a of t.clips)
    e.push(_g(a.clipBox));
  let o = 5 + t.clips.length * 7;
  const s = [];
  for (const a of e)
    s.push(o), o += a.length;
  const r = o, i = new v(r);
  i.uint8(t.format || 1), i.uint32(t.clips.length);
  for (let a = 0; a < t.clips.length; a++)
    i.uint16(t.clips[a].startGlyphID), i.uint16(t.clips[a].endGlyphID), i.uint24(s[a]);
  for (const a of e)
    i.rawBytes(a);
  return i.toArray();
}
function _g(t) {
  const e = t.format === 2 ? 13 : 9, n = new v(e);
  return n.uint8(t.format), n.fword(t.xMin), n.fword(t.yMin), n.fword(t.xMax), n.fword(t.yMax), t.format === 2 && n.uint32(t.varIndexBase), n.toArray();
}
function wg(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint32(), r = e.uint32(), i = e.uint16(), a = [];
  if (o > 0 && s > 0) {
    e.seek(s);
    for (let l = 0; l < o; l++)
      a.push({
        glyphID: e.uint16(),
        firstLayerIndex: e.uint16(),
        numLayers: e.uint16()
      });
  }
  const c = [];
  if (i > 0 && r > 0) {
    e.seek(r);
    for (let l = 0; l < i; l++)
      c.push({
        glyphID: e.uint16(),
        paletteIndex: e.uint16()
      });
  }
  const f = {
    version: n,
    baseGlyphRecords: a,
    layerRecords: c
  };
  if (n >= 1) {
    e.seek(14);
    const l = e.uint32(), u = e.uint32(), h = e.uint32(), p = e.uint32(), g = e.uint32(), x = sg(e, {
      baseGlyphListOffset: l,
      layerListOffset: u,
      clipListOffset: h,
      varIndexMapOffset: p,
      itemVariationStoreOffset: g
    });
    f.baseGlyphPaintRecords = x.baseGlyphPaintRecords, f.layerPaints = x.layerPaints, f.clipList = x.clipList, f.varIndexMap = x.varIndexMap, f.itemVariationStore = x.itemVariationStore;
  }
  return f;
}
function bg(t) {
  const { baseGlyphRecords: e, layerRecords: n } = t;
  if (t.version >= 1 && t.baseGlyphPaintRecords) {
    const u = e.length * 6, h = n.length * 4, d = 14 + 20, x = u + h, y = d + x, m = pg({
      baseGlyphPaintRecords: t.baseGlyphPaintRecords,
      layerPaints: t.layerPaints,
      clipList: t.clipList,
      varIndexMap: t.varIndexMap,
      itemVariationStore: t.itemVariationStore
    }), w = m.bodyBytes, _ = y + m.bglBodyOffset, S = m.llBodyOffset ? y + m.llBodyOffset : 0, b = m.clipBodyOffset ? y + m.clipBodyOffset : 0, A = m.dimBodyOffset ? y + m.dimBodyOffset : 0, k = m.ivsBodyOffset ? y + m.ivsBodyOffset : 0, O = y + w.length, I = new v(O);
    I.uint16(t.version), I.uint16(e.length), I.uint32(e.length > 0 ? d : 0), I.uint32(n.length > 0 ? d + u : 0), I.uint16(n.length), I.uint32(_), I.uint32(S), I.uint32(b), I.uint32(A), I.uint32(k);
    for (const E of e)
      I.uint16(E.glyphID), I.uint16(E.firstLayerIndex), I.uint16(E.numLayers);
    for (const E of n)
      I.uint16(E.glyphID), I.uint16(E.paletteIndex);
    return I.rawBytes(w), I.toArray();
  }
  const o = 14, s = e.length > 0 ? o : 0, r = e.length * 6, i = n.length > 0 ? o + r : 0, a = n.length * 4, c = o + r + a, f = new v(c);
  f.uint16(t.version), f.uint16(e.length), f.uint32(s), f.uint32(i), f.uint16(n.length);
  for (const l of e)
    f.uint16(l.glyphID), f.uint16(l.firstLayerIndex), f.uint16(l.numLayers);
  for (const l of n)
    f.uint16(l.glyphID), f.uint16(l.paletteIndex);
  return f.toArray();
}
function Ag(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.uint32(), a = [];
  for (let g = 0; g < s; g++)
    a.push(e.uint16());
  let c = 0, f = 0, l = 0;
  n >= 1 && (c = e.uint32(), f = e.uint32(), l = e.uint32()), e.seek(i);
  const u = [];
  for (let g = 0; g < r; g++)
    u.push({
      blue: e.uint8(),
      green: e.uint8(),
      red: e.uint8(),
      alpha: e.uint8()
    });
  const h = [];
  for (let g = 0; g < s; g++) {
    const d = a[g], x = [];
    for (let y = 0; y < o; y++)
      x.push({ ...u[d + y] });
    h.push(x);
  }
  const p = {
    version: n,
    numPaletteEntries: o,
    palettes: h
  };
  if (n >= 1 && c !== 0) {
    e.seek(c), p.paletteTypes = [];
    for (let g = 0; g < s; g++)
      p.paletteTypes.push(e.uint32());
  }
  if (n >= 1 && f !== 0) {
    e.seek(f), p.paletteLabels = [];
    for (let g = 0; g < s; g++)
      p.paletteLabels.push(e.uint16());
  }
  if (n >= 1 && l !== 0) {
    e.seek(l), p.paletteEntryLabels = [];
    for (let g = 0; g < o; g++)
      p.paletteEntryLabels.push(e.uint16());
  }
  return p;
}
function Cg(t) {
  const { version: e, numPaletteEntries: n, palettes: o } = t, s = o.length, r = [], i = [];
  for (let m = 0; m < s; m++) {
    r.push(i.length);
    for (let w = 0; w < n; w++)
      i.push(o[m][w]);
  }
  const a = i.length, c = 12 + s * 2, f = e >= 1 ? 12 : 0, l = c + f, u = a * 4;
  let h = l + u, p = 0, g = 0, d = 0;
  e >= 1 && t.paletteTypes && (p = h, h += s * 4), e >= 1 && t.paletteLabels && (g = h, h += s * 2), e >= 1 && t.paletteEntryLabels && (d = h, h += n * 2);
  const x = h, y = new v(x);
  y.uint16(e), y.uint16(n), y.uint16(s), y.uint16(a), y.uint32(l);
  for (let m = 0; m < s; m++)
    y.uint16(r[m]);
  e >= 1 && (y.uint32(p), y.uint32(g), y.uint32(d));
  for (const m of i)
    y.uint8(m.blue), y.uint8(m.green), y.uint8(m.red), y.uint8(m.alpha);
  if (e >= 1 && t.paletteTypes)
    for (const m of t.paletteTypes)
      y.uint32(m);
  if (e >= 1 && t.paletteLabels)
    for (const m of t.paletteLabels)
      y.uint16(m);
  if (e >= 1 && t.paletteEntryLabels)
    for (const m of t.paletteEntryLabels)
      y.uint16(m);
  return y.toArray();
}
const vg = 8, Ig = 12;
function Og(t) {
  const e = new F(t), n = e.uint32(), o = e.uint16(), s = e.uint16(), r = [];
  for (let a = 0; a < o; a++)
    r.push({
      format: e.uint32(),
      length: e.uint32(),
      offset: e.offset32()
    });
  const i = r.map((a) => {
    const c = a.offset, f = Math.min(t.length, c + a.length);
    return c <= 0 || c >= t.length || f < c ? { ...a, _raw: [] } : {
      ...a,
      _raw: Array.from(t.slice(c, f))
    };
  });
  return {
    version: n,
    flags: s,
    signatures: i
  };
}
function kg(t) {
  const e = t.version ?? 1, n = t.flags ?? 0, s = (t.signatures ?? []).map((c) => {
    const f = Eg(c);
    return {
      format: c.format ?? 1,
      bytes: f
    };
  });
  let r = vg + s.length * Ig;
  const i = s.map((c) => {
    const f = {
      format: c.format,
      length: c.bytes.length,
      offset: c.bytes.length ? r : 0
    };
    return r += c.bytes.length, f;
  }), a = new v(r);
  a.uint32(e), a.uint16(s.length), a.uint16(n);
  for (const c of i)
    a.uint32(c.format), a.uint32(c.length), a.offset32(c.offset);
  for (const c of s)
    a.rawBytes(c.bytes);
  return a.toArray();
}
function Eg(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
function Tg(t, e) {
  return Os(t, e?.EBLC ? { CBLC: e.EBLC } : e);
}
function Dg(t) {
  return ks(t);
}
function Rg(t) {
  return Es(t);
}
function Fg(t) {
  return me(t);
}
const Xo = 28;
function Mg(t) {
  const e = new F(t), n = e.uint32(), o = e.uint32(), s = [];
  for (let r = 0; r < o; r++) {
    const i = e.position;
    s.push({
      hori: Vr(e),
      vert: Vr(e),
      substitutePpemX: e.uint8(),
      substitutePpemY: e.uint8(),
      originalPpemX: e.uint8(),
      originalPpemY: e.uint8(),
      _raw: Array.from(t.slice(i, i + Xo))
    });
  }
  return { version: n, scales: s };
}
function Lg(t) {
  const e = t.version ?? 131072, n = t.scales ?? [], o = new v(8 + n.length * Xo);
  o.uint32(e), o.uint32(n.length);
  for (const s of n) {
    if (s._raw && s._raw.length === Xo) {
      o.rawBytes(s._raw);
      continue;
    }
    $r(o, s.hori ?? {}), $r(o, s.vert ?? {}), o.uint8(s.substitutePpemX ?? 0), o.uint8(s.substitutePpemY ?? 0), o.uint8(s.originalPpemX ?? 0), o.uint8(s.originalPpemY ?? 0);
  }
  return o.toArray();
}
function Vr(t) {
  return {
    ascender: t.int8(),
    descender: t.int8(),
    widthMax: t.uint8(),
    caretSlopeNumerator: t.int8(),
    caretSlopeDenominator: t.int8(),
    caretOffset: t.int8(),
    minOriginSB: t.int8(),
    minAdvanceSB: t.int8(),
    maxBeforeBL: t.int8(),
    minAfterBL: t.int8(),
    pad1: t.int8(),
    pad2: t.int8()
  };
}
function $r(t, e) {
  t.int8(e.ascender ?? 0), t.int8(e.descender ?? 0), t.uint8(e.widthMax ?? 0), t.int8(e.caretSlopeNumerator ?? 0), t.int8(e.caretSlopeDenominator ?? 0), t.int8(e.caretOffset ?? 0), t.int8(e.minOriginSB ?? 0), t.int8(e.minAdvanceSB ?? 0), t.int8(e.maxBeforeBL ?? 0), t.int8(e.minAfterBL ?? 0), t.int8(e.pad1 ?? 0), t.int8(e.pad2 ?? 0);
}
const Nr = 16, Bg = 20;
function Vg(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.offset16(), r = e.uint16(), i = e.uint16(), a = e.uint16(), c = e.uint16(), f = e.uint16(), l = [];
  for (let d = 0; d < i; d++)
    e.seek(s + d * a), l.push({
      axisTag: e.tag(),
      minValue: e.fixed(),
      defaultValue: e.fixed(),
      maxValue: e.fixed(),
      flags: e.uint16(),
      axisNameID: e.uint16()
    });
  const u = [], h = s + i * a, p = 4 + i * 4, g = f >= p + 2;
  for (let d = 0; d < c; d++) {
    e.seek(h + d * f);
    const x = {
      subfamilyNameID: e.uint16(),
      flags: e.uint16(),
      coordinates: []
    };
    for (let y = 0; y < i; y++)
      x.coordinates.push(e.fixed());
    g && (x.postScriptNameID = e.uint16()), u.push(x);
  }
  return {
    majorVersion: n,
    minorVersion: o,
    reserved: r,
    axisSize: a,
    instanceSize: f,
    axes: l,
    instances: u
  };
}
function $g(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.reserved ?? 2, s = t.axes ?? [], r = t.instances ?? [], i = s.length, a = Bg, c = 4 + i * 4, f = r.some(
    (d) => d.postScriptNameID !== void 0
  ), l = f ? c + 2 : c, u = r.length, h = Nr, p = Nr + i * a + u * l, g = new v(p);
  g.uint16(e), g.uint16(n), g.offset16(h), g.uint16(o), g.uint16(i), g.uint16(a), g.uint16(u), g.uint16(l);
  for (const d of s)
    g.tag(d.axisTag), g.fixed(d.minValue), g.fixed(d.defaultValue), g.fixed(d.maxValue), g.uint16(d.flags ?? 0), g.uint16(d.axisNameID ?? 0);
  for (const d of r) {
    g.uint16(d.subfamilyNameID ?? 0), g.uint16(d.flags ?? 0);
    for (let x = 0; x < i; x++)
      g.fixed(d.coordinates?.[x] ?? 0);
    f && g.uint16(d.postScriptNameID ?? 65535);
  }
  return g.toArray();
}
function Ng(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.uint16(), a = e.uint16();
  let c = 0;
  o >= 2 && (c = e.uint16());
  let f = 0;
  o >= 3 && (f = e.uint32());
  const l = { majorVersion: n, minorVersion: o };
  return s !== 0 && (l.glyphClassDef = Vt(e, s)), r !== 0 && (l.attachList = Gg(e, r)), i !== 0 && (l.ligCaretList = Pg(e, i)), a !== 0 && (l.markAttachClassDef = Vt(e, a)), c !== 0 && (l.markGlyphSetsDef = zg(e, c)), f !== 0 && (l.itemVarStoreOffset = f, l.itemVariationStore = Pt(
    t.slice(f)
  )), l;
}
function Gg(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.array("uint16", o), r = $(t, e + n), i = s.map((a) => {
    t.seek(e + a);
    const c = t.uint16();
    return t.array("uint16", c);
  });
  return { coverage: r, attachPoints: i };
}
function Pg(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.array("uint16", o), r = $(t, e + n), i = s.map(
    (a) => Ug(t, e + a)
  );
  return { coverage: r, ligGlyphs: i };
}
function Ug(t, e) {
  t.seek(e);
  const n = t.uint16();
  return t.array("uint16", n).map((s) => {
    const r = e + s;
    t.seek(r);
    const i = t.uint16();
    if (i === 1)
      return { format: i, coordinate: t.int16() };
    if (i === 2)
      return { format: i, caretValuePointIndex: t.uint16() };
    if (i === 3) {
      const a = t.int16(), c = t.uint16(), f = c !== 0 ? Ae(t, r + c) : null;
      return { format: i, coordinate: a, device: f };
    }
    throw new Error(`Unknown CaretValue format: ${i}`);
  });
}
function zg(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = [];
  for (let i = 0; i < o; i++)
    s.push(t.uint32());
  const r = s.map(
    (i) => $(t, e + i)
  );
  return { format: n, coverages: r };
}
function Hg(t) {
  const { majorVersion: e, minorVersion: n } = t, o = t.glyphClassDef ? $t(t.glyphClassDef) : null, s = t.attachList ? Wg(t.attachList) : null, r = t.ligCaretList ? Yg(t.ligCaretList) : null, i = t.markAttachClassDef ? $t(t.markAttachClassDef) : null, a = n >= 2 && t.markGlyphSetsDef ? qg(t.markGlyphSetsDef) : null, c = n >= 3 && t.itemVariationStore ? ne(t.itemVariationStore) : null;
  let f = 12;
  n >= 2 && (f += 2), n >= 3 && (f += 4);
  let l = f;
  const u = o ? l : 0;
  o && (l += o.length);
  const h = s ? l : 0;
  s && (l += s.length);
  const p = r ? l : 0;
  r && (l += r.length);
  const g = i ? l : 0;
  i && (l += i.length);
  const d = a ? l : 0;
  a && (l += a.length);
  const x = c ? l : 0;
  c && (l += c.length);
  const y = new v(l);
  return y.uint16(e), y.uint16(n), y.uint16(u), y.uint16(h), y.uint16(p), y.uint16(g), n >= 2 && y.uint16(d), n >= 3 && y.uint32(x), o && (y.seek(u), y.rawBytes(o)), s && (y.seek(h), y.rawBytes(s)), r && (y.seek(p), y.rawBytes(r)), i && (y.seek(g), y.rawBytes(i)), a && (y.seek(d), y.rawBytes(a)), c && (y.seek(x), y.rawBytes(c)), y.toArray();
}
function Wg(t) {
  const e = G(t.coverage), n = t.attachPoints.map(jg);
  let s = 4 + t.attachPoints.length * 2;
  const r = s;
  s += e.length;
  const i = n.map((c) => {
    const f = s;
    return s += c.length, f;
  }), a = new v(s);
  a.uint16(r), a.uint16(t.attachPoints.length), a.array("uint16", i), a.seek(r), a.rawBytes(e);
  for (let c = 0; c < n.length; c++)
    a.seek(i[c]), a.rawBytes(n[c]);
  return a.toArray();
}
function jg(t) {
  const e = 2 + t.length * 2, n = new v(e);
  return n.uint16(t.length), n.array("uint16", t), n.toArray();
}
function Yg(t) {
  const e = G(t.coverage), n = t.ligGlyphs.map(Zg);
  let s = 4 + t.ligGlyphs.length * 2;
  const r = s;
  s += e.length;
  const i = n.map((c) => {
    const f = s;
    return s += c.length, f;
  }), a = new v(s);
  a.uint16(r), a.uint16(t.ligGlyphs.length), a.array("uint16", i), a.seek(r), a.rawBytes(e);
  for (let c = 0; c < n.length; c++)
    a.seek(i[c]), a.rawBytes(n[c]);
  return a.toArray();
}
function Zg(t) {
  const e = t.map(Xg);
  let o = 2 + t.length * 2;
  const s = e.map((i) => {
    const a = o;
    return o += i.length, a;
  }), r = new v(o);
  r.uint16(t.length), r.array("uint16", s);
  for (let i = 0; i < e.length; i++)
    r.seek(s[i]), r.rawBytes(e[i]);
  return r.toArray();
}
function Xg(t) {
  if (t.format === 1) {
    const e = new v(4);
    return e.uint16(1), e.int16(t.coordinate), e.toArray();
  }
  if (t.format === 2) {
    const e = new v(4);
    return e.uint16(2), e.uint16(t.caretValuePointIndex), e.toArray();
  }
  if (t.format === 3) {
    const e = t.device ? Bn(t.device) : null, n = 6 + (e ? e.length : 0), o = new v(n);
    return o.uint16(3), o.int16(t.coordinate), o.uint16(e ? 6 : 0), e && o.rawBytes(e), o.toArray();
  }
  throw new Error(`Unknown CaretValue format: ${t.format}`);
}
function qg(t) {
  const e = t.coverages.map(G);
  let o = 4 + t.coverages.length * 4;
  const s = e.map((i) => {
    const a = o;
    return o += i.length, a;
  }), r = new v(o);
  r.uint16(t.format), r.uint16(t.coverages.length);
  for (const i of s) r.uint32(i);
  for (let i = 0; i < e.length; i++)
    r.seek(s[i]), r.rawBytes(e[i]);
  return r.toArray();
}
function Lt(t) {
  let e = 0, n = t;
  for (; n; )
    e += n & 1, n >>>= 1;
  return e * 2;
}
function ue(t, e, n) {
  if (e === 0) return null;
  const o = t.position, s = {};
  e & 1 && (s.xPlacement = t.int16()), e & 2 && (s.yPlacement = t.int16()), e & 4 && (s.xAdvance = t.int16()), e & 8 && (s.yAdvance = t.int16());
  const r = e & 16 ? t.uint16() : 0, i = e & 32 ? t.uint16() : 0, a = e & 64 ? t.uint16() : 0, c = e & 128 ? t.uint16() : 0, f = t.position, l = (u, h) => {
    const p = n + u, g = o + u;
    try {
      return Ae(t, p);
    } catch (d) {
      if (g !== p)
        try {
          return Ae(t, g);
        } catch {
        }
      const x = d instanceof Error ? d.message : String(d);
      throw new Error(
        `${x}; ValueRecord context: valueFormat=${e}, subtableOffset=${n}, valueRecordStart=${o}, offsets={xPla:${r},yPla:${i},xAdv:${a},yAdv:${c}}, field=${h}`
      );
    }
  };
  return r && (s.xPlaDevice = l(r, "xPlaDevice"), t.seek(f)), i && (s.yPlaDevice = l(i, "yPlaDevice"), t.seek(f)), a && (s.xAdvDevice = l(a, "xAdvDevice"), t.seek(f)), c && (s.yAdvDevice = l(c, "yAdvDevice"), t.seek(f)), s;
}
function Ce(t, e) {
  if (e === 0) return null;
  t.seek(e);
  const n = t.uint16(), o = t.int16(), s = t.int16(), r = { format: n, xCoordinate: o, yCoordinate: s };
  if (n === 2)
    r.anchorPoint = t.uint16();
  else if (n === 3) {
    const i = t.uint16(), a = t.uint16();
    i && (r.xDevice = Ae(t, e + i)), a && (r.yDevice = Ae(t, e + a));
  }
  return r;
}
function Ds(t, e) {
  t.seek(e);
  const n = t.uint16(), o = [];
  for (let s = 0; s < n; s++) {
    const r = t.uint16(), i = t.uint16();
    o.push({ markClass: r, anchorOffset: i });
  }
  return o.map((s) => ({
    markClass: s.markClass,
    markAnchor: Ce(t, e + s.anchorOffset)
  }));
}
function Kg(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.uint16();
  let a = 0;
  o >= 1 && (a = e.uint32());
  const c = {
    majorVersion: n,
    minorVersion: o,
    scriptList: Na(e, s),
    featureList: Pa(e, r),
    lookupList: Wa(e, i, rc, 9)
  };
  return a !== 0 && (c.featureVariations = tc(
    e,
    a
  )), c;
}
function rc(t, e, n) {
  switch (n) {
    case 1:
      return Jg(t, e);
    case 2:
      return Qg(t, e);
    case 3:
      return tp(t, e);
    case 4:
      return ep(t, e);
    case 5:
      return np(t, e);
    case 6:
      return op(t, e);
    case 7:
      return Ya(t, e);
    case 8:
      return qa(t, e);
    case 9:
      return sp(t, e);
    default:
      throw new Error(`Unknown GPOS lookup type: ${n}`);
  }
}
function Jg(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const o = t.uint16(), s = t.uint16(), r = ue(t, s, e), i = $(t, e + o);
    return { format: n, coverage: i, valueFormat: s, valueRecord: r };
  }
  if (n === 2) {
    const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = [];
    for (let c = 0; c < r; c++)
      i.push(ue(t, s, e));
    const a = $(t, e + o);
    return { format: n, coverage: a, valueFormat: s, valueCount: r, valueRecords: i };
  }
  throw new Error(`Unknown SinglePos format: ${n}`);
}
function Qg(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = t.uint16(), c = t.array("uint16", i).map((l) => {
      const u = e + l;
      t.seek(u);
      const h = t.uint16(), p = [];
      for (let g = 0; g < h; g++) {
        const d = t.uint16(), x = ue(t, s, u), y = ue(t, r, u);
        p.push({ secondGlyph: d, value1: x, value2: y });
      }
      return p;
    }), f = $(t, e + o);
    return {
      format: n,
      coverage: f,
      valueFormat1: s,
      valueFormat2: r,
      pairSets: c
    };
  }
  if (n === 2) {
    const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = t.uint16(), a = t.uint16(), c = t.uint16(), f = t.uint16(), l = [];
    for (let g = 0; g < c; g++) {
      const d = [];
      for (let x = 0; x < f; x++) {
        const y = ue(t, s, e), m = ue(t, r, e);
        d.push({ value1: y, value2: m });
      }
      l.push(d);
    }
    const u = $(t, e + o), h = Vt(t, e + i), p = Vt(t, e + a);
    return {
      format: n,
      coverage: u,
      valueFormat1: s,
      valueFormat2: r,
      classDef1: h,
      classDef2: p,
      class1Count: c,
      class2Count: f,
      class1Records: l
    };
  }
  throw new Error(`Unknown PairPos format: ${n}`);
}
function tp(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown CursivePos format: ${n}`);
  const o = t.uint16(), s = t.uint16(), r = [];
  for (let c = 0; c < s; c++) {
    const f = t.uint16(), l = t.uint16();
    r.push({ entryAnchorOff: f, exitAnchorOff: l });
  }
  const i = $(t, e + o), a = r.map((c) => ({
    entryAnchor: c.entryAnchorOff ? Ce(t, e + c.entryAnchorOff) : null,
    exitAnchor: c.exitAnchorOff ? Ce(t, e + c.exitAnchorOff) : null
  }));
  return { format: n, coverage: i, entryExitRecords: a };
}
function ep(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown MarkBasePos format: ${n}`);
  const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = t.uint16(), a = t.uint16(), c = $(t, e + o), f = $(t, e + s), l = Ds(t, e + i);
  t.seek(e + a);
  const u = t.uint16(), h = [];
  for (let g = 0; g < u; g++) {
    const d = t.array("uint16", r);
    h.push(d);
  }
  const p = h.map(
    (g) => g.map(
      (d) => d ? Ce(t, e + a + d) : null
    )
  );
  return {
    format: n,
    markCoverage: c,
    baseCoverage: f,
    markClassCount: r,
    markArray: l,
    baseArray: p
  };
}
function np(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown MarkLigPos format: ${n}`);
  const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = t.uint16(), a = t.uint16(), c = $(t, e + o), f = $(t, e + s), l = Ds(t, e + i);
  t.seek(e + a);
  const u = t.uint16(), p = t.array("uint16", u).map((g) => {
    const d = e + a + g;
    t.seek(d);
    const x = t.uint16(), y = [];
    for (let m = 0; m < x; m++) {
      const w = t.array("uint16", r);
      y.push(w);
    }
    return y.map(
      (m) => m.map((w) => w ? Ce(t, d + w) : null)
    );
  });
  return {
    format: n,
    markCoverage: c,
    ligatureCoverage: f,
    markClassCount: r,
    markArray: l,
    ligatureArray: p
  };
}
function op(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown MarkMarkPos format: ${n}`);
  const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = t.uint16(), a = t.uint16(), c = $(t, e + o), f = $(t, e + s), l = Ds(t, e + i);
  t.seek(e + a);
  const u = t.uint16(), h = [];
  for (let g = 0; g < u; g++) {
    const d = t.array("uint16", r);
    h.push(d);
  }
  const p = h.map(
    (g) => g.map(
      (d) => d ? Ce(t, e + a + d) : null
    )
  );
  return {
    format: n,
    mark1Coverage: c,
    mark2Coverage: f,
    markClassCount: r,
    mark1Array: l,
    mark2Array: p
  };
}
function sp(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown ExtensionPos format: ${n}`);
  const o = t.uint16(), s = t.uint32(), r = rc(
    t,
    e + s,
    o
  );
  return { format: n, extensionLookupType: o, extensionOffset: s, subtable: r };
}
function he(t, e, n) {
  if (!e) return [];
  const o = new v(Lt(e));
  return e & 1 && o.int16(t ? t.xPlacement ?? 0 : 0), e & 2 && o.int16(t ? t.yPlacement ?? 0 : 0), e & 4 && o.int16(t ? t.xAdvance ?? 0 : 0), e & 8 && o.int16(t ? t.yAdvance ?? 0 : 0), e & 16 && (t?.xPlaDevice && n.push({ field: o.position, device: t.xPlaDevice }), o.uint16(0)), e & 32 && (t?.yPlaDevice && n.push({ field: o.position, device: t.yPlaDevice }), o.uint16(0)), e & 64 && (t?.xAdvDevice && n.push({ field: o.position, device: t.xAdvDevice }), o.uint16(0)), e & 128 && (t?.yAdvDevice && n.push({ field: o.position, device: t.yAdvDevice }), o.uint16(0)), o.toArray();
}
function Ke(t) {
  if (!t) return [];
  const { format: e, xCoordinate: n, yCoordinate: o } = t;
  if (e === 1) {
    const s = new v(6);
    return s.uint16(1), s.int16(n), s.int16(o), s.toArray();
  }
  if (e === 2) {
    const s = new v(8);
    return s.uint16(2), s.int16(n), s.int16(o), s.uint16(t.anchorPoint), s.toArray();
  }
  if (e === 3) {
    const s = t.xDevice ? Bn(t.xDevice) : null, r = t.yDevice ? Bn(t.yDevice) : null;
    let a = 10;
    const c = s ? a : 0;
    s && (a += s.length);
    const f = r ? a : 0;
    r && (a += r.length);
    const l = new v(a);
    return l.uint16(3), l.int16(n), l.int16(o), l.uint16(c), l.uint16(f), s && (l.seek(c), l.rawBytes(s)), r && (l.seek(f), l.rawBytes(r)), l.toArray();
  }
  throw new Error(`Unknown Anchor format: ${e}`);
}
function Rs(t) {
  const e = t.map((i) => Ke(i.markAnchor));
  let o = 2 + t.length * 4;
  const s = e.map((i) => {
    if (!i.length) return 0;
    const a = o;
    return o += i.length, a;
  }), r = new v(o);
  r.uint16(t.length);
  for (let i = 0; i < t.length; i++)
    r.uint16(t[i].markClass), r.uint16(s[i]);
  for (let i = 0; i < e.length; i++)
    e[i].length && (r.seek(s[i]), r.rawBytes(e[i]));
  return r.toArray();
}
function rp(t) {
  const { majorVersion: e, minorVersion: n } = t, o = ip(t), s = Ga(o.scriptList), r = za(o.featureList), i = ja(
    o.lookupList,
    ic,
    9
  ), a = o.featureVariations ? ec(o.featureVariations) : null;
  let c = 10;
  n >= 1 && (c += 4);
  let f = c;
  const l = f;
  f += s.length;
  const u = f;
  f += r.length;
  const h = f;
  f += i.length;
  const p = a ? f : 0;
  a && (f += a.length);
  const g = new v(f);
  return g.uint16(e), g.uint16(n), g.uint16(l), g.uint16(u), g.uint16(h), n >= 1 && g.uint32(p), g.seek(l), g.rawBytes(s), g.seek(u), g.rawBytes(r), g.seek(h), g.rawBytes(i), a && (g.seek(p), g.rawBytes(a)), g.toArray();
}
function ip(t) {
  const e = t.lookupList.lookups.map((n) => {
    if (n.lookupType !== 2 || !Array.isArray(n.subtables))
      return n;
    const o = n.subtables.flatMap((s) => s?.format !== 1 || !Array.isArray(s.pairSets) ? [s] : ap(s));
    return {
      ...n,
      subtables: o
    };
  });
  return {
    ...t,
    lookupList: {
      ...t.lookupList,
      lookups: e
    }
  };
}
function ap(t) {
  const e = cp(t.coverage);
  if (e.length !== t.pairSets.length)
    return [t];
  const n = Lt(t.valueFormat1) + Lt(t.valueFormat2), o = t.pairSets.map(
    (c) => 2 + c.length * (2 + n)
  ), s = o.reduce((c, f) => c + f, 0);
  if (Gr(
    t.pairSets.length,
    s
  ) <= 65535)
    return [t];
  const i = [];
  let a = 0;
  for (; a < t.pairSets.length; ) {
    let c = a, f = 0, l = !1;
    for (; c < t.pairSets.length; ) {
      const u = f + o[c], h = c - a + 1;
      if (Gr(
        h,
        u
      ) > 65535)
        break;
      f = u, c += 1, l = !0;
    }
    if (!l)
      throw new Error(
        "Cannot encode PairPos format 1: single PairSet exceeds 16-bit offset range"
      );
    i.push({
      ...t,
      coverage: {
        format: 1,
        glyphs: e.slice(a, c)
      },
      pairSets: t.pairSets.slice(a, c)
    }), a = c;
  }
  return i;
}
function Gr(t, e) {
  const n = 10 + t * 2, o = 4 + t * 2;
  return n + o + e;
}
function cp(t) {
  if (!t)
    return [];
  if (t.format === 1)
    return t.glyphs;
  if (t.format === 2) {
    const e = [];
    for (const n of t.ranges)
      for (let o = n.startGlyphID; o <= n.endGlyphID; o++)
        e.push(o);
    return e;
  }
  return [];
}
function ic(t, e) {
  switch (e) {
    case 1:
      return fp(t);
    case 2:
      return lp(t);
    case 3:
      return up(t);
    case 4:
      return hp(t);
    case 5:
      return gp(t);
    case 6:
      return dp(t);
    case 7:
      return Za(t);
    case 8:
      return Ja(t);
    case 9:
      return mp(t);
    default:
      throw new Error(`Unknown GPOS lookup type: ${e}`);
  }
}
function fp(t) {
  const e = G(t.coverage), n = [];
  if (t.format === 1) {
    const o = he(
      t.valueRecord,
      t.valueFormat,
      n
    ), r = 6 + o.length, i = r + e.length, a = new v(i);
    return a.uint16(1), a.uint16(r), a.uint16(t.valueFormat), a.rawBytes(o), a.seek(r), a.rawBytes(e), a.toArray();
  }
  if (t.format === 2) {
    const o = Lt(t.valueFormat), s = t.valueRecords.map(
      (f) => he(f, t.valueFormat, n)
    ), i = 8 + s.length * o, a = i + e.length, c = new v(a);
    c.uint16(2), c.uint16(i), c.uint16(t.valueFormat), c.uint16(t.valueCount);
    for (const f of s) c.rawBytes(f);
    return c.seek(i), c.rawBytes(e), c.toArray();
  }
  throw new Error(`Unknown SinglePos format: ${t.format}`);
}
function lp(t) {
  const e = G(t.coverage), n = [];
  if (t.format === 1) {
    const o = t.pairSets.map((f) => {
      const l = Lt(t.valueFormat1), u = Lt(t.valueFormat2), h = 2 + l + u, p = new v(2 + f.length * h);
      p.uint16(f.length);
      for (const g of f)
        p.uint16(g.secondGlyph), p.rawBytes(
          he(g.value1, t.valueFormat1, n)
        ), p.rawBytes(
          he(g.value2, t.valueFormat2, n)
        );
      return p.toArray();
    });
    let r = 10 + t.pairSets.length * 2;
    const i = r;
    r += e.length;
    const a = o.map((f) => {
      const l = r;
      return r += f.length, l;
    }), c = new v(r);
    c.uint16(1), c.uint16(i), c.uint16(t.valueFormat1), c.uint16(t.valueFormat2), c.uint16(t.pairSets.length), c.array("uint16", a), c.seek(i), c.rawBytes(e);
    for (let f = 0; f < o.length; f++)
      c.seek(a[f]), c.rawBytes(o[f]);
    return c.toArray();
  }
  if (t.format === 2) {
    const o = $t(t.classDef1), s = $t(t.classDef2), r = Lt(t.valueFormat1), i = Lt(t.valueFormat2), a = r + i;
    let l = 16 + t.class1Count * t.class2Count * a;
    const u = l;
    l += e.length;
    const h = l;
    l += o.length;
    const p = l;
    l += s.length;
    const g = new v(l);
    g.uint16(2), g.uint16(u), g.uint16(t.valueFormat1), g.uint16(t.valueFormat2), g.uint16(h), g.uint16(p), g.uint16(t.class1Count), g.uint16(t.class2Count);
    for (const d of t.class1Records)
      for (const x of d)
        g.rawBytes(
          he(x.value1, t.valueFormat1, n)
        ), g.rawBytes(
          he(x.value2, t.valueFormat2, n)
        );
    return g.seek(u), g.rawBytes(e), g.seek(h), g.rawBytes(o), g.seek(p), g.rawBytes(s), g.toArray();
  }
  throw new Error(`Unknown PairPos format: ${t.format}`);
}
function up(t) {
  const e = G(t.coverage), n = t.entryExitRecords.map((c) => ({
    entry: c.entryAnchor ? Ke(c.entryAnchor) : null,
    exit: c.exitAnchor ? Ke(c.exitAnchor) : null
  }));
  let s = 6 + t.entryExitRecords.length * 4;
  const r = s;
  s += e.length;
  const i = n.map((c) => {
    const f = c.entry ? s : 0;
    c.entry && (s += c.entry.length);
    const l = c.exit ? s : 0;
    return c.exit && (s += c.exit.length), { entryOff: f, exitOff: l };
  }), a = new v(s);
  a.uint16(1), a.uint16(r), a.uint16(t.entryExitRecords.length);
  for (const c of i)
    a.uint16(c.entryOff), a.uint16(c.exitOff);
  a.seek(r), a.rawBytes(e);
  for (let c = 0; c < n.length; c++)
    n[c].entry && (a.seek(i[c].entryOff), a.rawBytes(n[c].entry)), n[c].exit && (a.seek(i[c].exitOff), a.rawBytes(n[c].exit));
  return a.toArray();
}
function hp(t) {
  const e = G(t.markCoverage), n = G(t.baseCoverage), o = Rs(t.markArray), s = ac(t.baseArray);
  let i = 12;
  const a = i;
  i += e.length;
  const c = i;
  i += n.length;
  const f = i;
  i += o.length;
  const l = i;
  i += s.length;
  const u = new v(i);
  return u.uint16(1), u.uint16(a), u.uint16(c), u.uint16(t.markClassCount), u.uint16(f), u.uint16(l), u.seek(a), u.rawBytes(e), u.seek(c), u.rawBytes(n), u.seek(f), u.rawBytes(o), u.seek(l), u.rawBytes(s), u.toArray();
}
function ac(t) {
  const e = t.length > 0 ? t[0].length : 0, n = t.map((a) => a.map(Ke));
  let s = 2 + t.length * e * 2;
  const r = n.map(
    (a) => a.map((c) => {
      if (!c.length) return 0;
      const f = s;
      return s += c.length, f;
    })
  ), i = new v(s);
  i.uint16(t.length);
  for (let a = 0; a < t.length; a++)
    for (let c = 0; c < e; c++)
      i.uint16(r[a][c]);
  for (let a = 0; a < n.length; a++)
    for (let c = 0; c < e; c++)
      n[a][c].length && (i.seek(r[a][c]), i.rawBytes(n[a][c]));
  return i.toArray();
}
function gp(t) {
  const e = G(t.markCoverage), n = G(t.ligatureCoverage), o = Rs(t.markArray), s = pp(t.ligatureArray, t.markClassCount);
  let i = 12;
  const a = i;
  i += e.length;
  const c = i;
  i += n.length;
  const f = i;
  i += o.length;
  const l = i;
  i += s.length;
  const u = new v(i);
  return u.uint16(1), u.uint16(a), u.uint16(c), u.uint16(t.markClassCount), u.uint16(f), u.uint16(l), u.seek(a), u.rawBytes(e), u.seek(c), u.rawBytes(n), u.seek(f), u.rawBytes(o), u.seek(l), u.rawBytes(s), u.toArray();
}
function pp(t, e) {
  const n = t.map((a) => {
    const c = a.map((p) => p.map(Ke));
    let l = 2 + a.length * e * 2;
    const u = c.map(
      (p) => p.map((g) => {
        if (!g.length) return 0;
        const d = l;
        return l += g.length, d;
      })
    ), h = new v(l);
    h.uint16(a.length);
    for (let p = 0; p < a.length; p++)
      for (let g = 0; g < e; g++)
        h.uint16(u[p][g]);
    for (let p = 0; p < c.length; p++)
      for (let g = 0; g < e; g++)
        c[p][g].length && (h.seek(u[p][g]), h.rawBytes(c[p][g]));
    return h.toArray();
  });
  let s = 2 + t.length * 2;
  const r = n.map((a) => {
    const c = s;
    return s += a.length, c;
  }), i = new v(s);
  i.uint16(t.length), i.array("uint16", r);
  for (let a = 0; a < n.length; a++)
    i.seek(r[a]), i.rawBytes(n[a]);
  return i.toArray();
}
function dp(t) {
  const e = G(t.mark1Coverage), n = G(t.mark2Coverage), o = Rs(t.mark1Array), s = ac(t.mark2Array);
  let i = 12;
  const a = i;
  i += e.length;
  const c = i;
  i += n.length;
  const f = i;
  i += o.length;
  const l = i;
  i += s.length;
  const u = new v(i);
  return u.uint16(1), u.uint16(a), u.uint16(c), u.uint16(t.markClassCount), u.uint16(f), u.uint16(l), u.seek(a), u.rawBytes(e), u.seek(c), u.rawBytes(n), u.seek(f), u.rawBytes(o), u.seek(l), u.rawBytes(s), u.toArray();
}
function mp(t) {
  const e = ic(t.subtable, t.extensionLookupType), n = 8, o = new v(n + e.length);
  return o.uint16(1), o.uint16(t.extensionLookupType), o.uint32(n), o.rawBytes(e), o.toArray();
}
function yp(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.uint16();
  let a = 0;
  o >= 1 && (a = e.uint32());
  const c = {
    majorVersion: n,
    minorVersion: o,
    scriptList: Na(e, s),
    featureList: Pa(e, r),
    lookupList: Wa(e, i, cc, 7)
  };
  return a !== 0 && (c.featureVariations = tc(
    e,
    a
  )), c;
}
function cc(t, e, n) {
  switch (n) {
    case 1:
      return xp(t, e);
    case 2:
      return Sp(t, e);
    case 3:
      return _p(t, e);
    case 4:
      return wp(t, e);
    case 5:
      return Ya(t, e);
    case 6:
      return qa(t, e);
    case 7:
      return bp(t, e);
    case 8:
      return Ap(t, e);
    default:
      throw new Error(`Unknown GSUB lookup type: ${n}`);
  }
}
function xp(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const o = t.uint16(), s = t.int16(), r = $(t, e + o);
    return { format: n, coverage: r, deltaGlyphID: s };
  }
  if (n === 2) {
    const o = t.uint16(), s = t.uint16(), r = t.array("uint16", s), i = $(t, e + o);
    return { format: n, coverage: i, substituteGlyphIDs: r };
  }
  throw new Error(`Unknown SingleSubst format: ${n}`);
}
function Sp(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown MultipleSubst format: ${n}`);
  const o = t.uint16(), s = t.uint16(), r = t.array("uint16", s), i = $(t, e + o), a = r.map((c) => {
    t.seek(e + c);
    const f = t.uint16();
    return t.array("uint16", f);
  });
  return { format: n, coverage: i, sequences: a };
}
function _p(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown AlternateSubst format: ${n}`);
  const o = t.uint16(), s = t.uint16(), r = t.array("uint16", s), i = $(t, e + o), a = r.map((c) => {
    t.seek(e + c);
    const f = t.uint16();
    return t.array("uint16", f);
  });
  return { format: n, coverage: i, alternateSets: a };
}
function wp(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown LigatureSubst format: ${n}`);
  const o = t.uint16(), s = t.uint16(), r = t.array("uint16", s), i = $(t, e + o), a = r.map((c) => {
    const f = e + c;
    t.seek(f);
    const l = t.uint16();
    return t.array("uint16", l).map((h) => {
      t.seek(f + h);
      const p = t.uint16(), g = t.uint16(), d = t.array("uint16", g - 1);
      return { ligatureGlyph: p, componentCount: g, componentGlyphIDs: d };
    });
  });
  return { format: n, coverage: i, ligatureSets: a };
}
function bp(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown ExtensionSubst format: ${n}`);
  const o = t.uint16(), s = t.uint32(), r = cc(
    t,
    e + s,
    o
  );
  return { format: n, extensionLookupType: o, extensionOffset: s, subtable: r };
}
function Ap(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1)
    throw new Error(`Unknown ReverseChainSingleSubst format: ${n}`);
  const o = t.uint16(), s = t.uint16(), r = t.array("uint16", s), i = t.uint16(), a = t.array("uint16", i), c = t.uint16(), f = t.array("uint16", c), l = $(t, e + o), u = r.map(
    (p) => $(t, e + p)
  ), h = a.map(
    (p) => $(t, e + p)
  );
  return {
    format: n,
    coverage: l,
    backtrackCoverages: u,
    lookaheadCoverages: h,
    substituteGlyphIDs: f
  };
}
function Cp(t) {
  const { majorVersion: e, minorVersion: n } = t, o = Ga(t.scriptList), s = za(t.featureList), r = ja(t.lookupList, fc, 7), i = t.featureVariations ? ec(t.featureVariations) : null;
  let a = 10;
  n >= 1 && (a += 4);
  let c = a;
  const f = c;
  c += o.length;
  const l = c;
  c += s.length;
  const u = c;
  c += r.length;
  const h = i ? c : 0;
  i && (c += i.length);
  const p = new v(c);
  return p.uint16(e), p.uint16(n), p.uint16(f), p.uint16(l), p.uint16(u), n >= 1 && p.uint32(h), p.seek(f), p.rawBytes(o), p.seek(l), p.rawBytes(s), p.seek(u), p.rawBytes(r), i && (p.seek(h), p.rawBytes(i)), p.toArray();
}
function fc(t, e) {
  switch (e) {
    case 1:
      return vp(t);
    case 2:
      return Ip(t);
    case 3:
      return Op(t);
    case 4:
      return kp(t);
    case 5:
      return Za(t);
    case 6:
      return Ja(t);
    case 7:
      return Tp(t);
    case 8:
      return Dp(t);
    default:
      throw new Error(`Unknown GSUB lookup type: ${e}`);
  }
}
function vp(t) {
  const e = G(t.coverage);
  if (t.format === 1) {
    const s = new v(6 + e.length);
    return s.uint16(1), s.uint16(6), s.int16(t.deltaGlyphID), s.seek(6), s.rawBytes(e), s.toArray();
  }
  if (t.format === 2) {
    const n = 6 + t.substituteGlyphIDs.length * 2, o = n, s = new v(n + e.length);
    return s.uint16(2), s.uint16(o), s.uint16(t.substituteGlyphIDs.length), s.array("uint16", t.substituteGlyphIDs), s.seek(o), s.rawBytes(e), s.toArray();
  }
  throw new Error(`Unknown SingleSubst format: ${t.format}`);
}
function Ip(t) {
  const e = G(t.coverage), n = t.sequences.map((c) => {
    const f = new v(2 + c.length * 2);
    return f.uint16(c.length), f.array("uint16", c), f.toArray();
  });
  let s = 6 + t.sequences.length * 2;
  const r = s;
  s += e.length;
  const i = n.map((c) => {
    const f = s;
    return s += c.length, f;
  }), a = new v(s);
  a.uint16(1), a.uint16(r), a.uint16(t.sequences.length), a.array("uint16", i), a.seek(r), a.rawBytes(e);
  for (let c = 0; c < n.length; c++)
    a.seek(i[c]), a.rawBytes(n[c]);
  return a.toArray();
}
function Op(t) {
  const e = G(t.coverage), n = t.alternateSets.map((c) => {
    const f = new v(2 + c.length * 2);
    return f.uint16(c.length), f.array("uint16", c), f.toArray();
  });
  let s = 6 + t.alternateSets.length * 2;
  const r = s;
  s += e.length;
  const i = n.map((c) => {
    const f = s;
    return s += c.length, f;
  }), a = new v(s);
  a.uint16(1), a.uint16(r), a.uint16(t.alternateSets.length), a.array("uint16", i), a.seek(r), a.rawBytes(e);
  for (let c = 0; c < n.length; c++)
    a.seek(i[c]), a.rawBytes(n[c]);
  return a.toArray();
}
function kp(t) {
  const e = G(t.coverage), n = t.ligatureSets.map(Ep);
  let s = 6 + t.ligatureSets.length * 2;
  const r = s;
  s += e.length;
  const i = n.map((c) => {
    const f = s;
    return s += c.length, f;
  }), a = new v(s);
  a.uint16(1), a.uint16(r), a.uint16(t.ligatureSets.length), a.array("uint16", i), a.seek(r), a.rawBytes(e);
  for (let c = 0; c < n.length; c++)
    a.seek(i[c]), a.rawBytes(n[c]);
  return a.toArray();
}
function Ep(t) {
  const e = t.map((i) => {
    const a = 4 + (i.componentCount - 1) * 2, c = new v(a);
    return c.uint16(i.ligatureGlyph), c.uint16(i.componentCount), c.array("uint16", i.componentGlyphIDs), c.toArray();
  });
  let o = 2 + t.length * 2;
  const s = e.map((i) => {
    const a = o;
    return o += i.length, a;
  }), r = new v(o);
  r.uint16(t.length), r.array("uint16", s);
  for (let i = 0; i < e.length; i++)
    r.seek(s[i]), r.rawBytes(e[i]);
  return r.toArray();
}
function Tp(t) {
  const e = fc(t.subtable, t.extensionLookupType), n = 8, o = new v(n + e.length);
  return o.uint16(1), o.uint16(t.extensionLookupType), o.uint32(n), o.rawBytes(e), o.toArray();
}
function Dp(t) {
  const e = G(t.coverage), n = t.backtrackCoverages.map(G), o = t.lookaheadCoverages.map(G);
  let r = 6 + t.backtrackCoverages.length * 2 + 2 + t.lookaheadCoverages.length * 2 + 2 + t.substituteGlyphIDs.length * 2;
  const i = r;
  r += e.length;
  const a = n.map((l) => {
    const u = r;
    return r += l.length, u;
  }), c = o.map((l) => {
    const u = r;
    return r += l.length, u;
  }), f = new v(r);
  f.uint16(1), f.uint16(i), f.uint16(t.backtrackCoverages.length), f.array("uint16", a), f.uint16(t.lookaheadCoverages.length), f.array("uint16", c), f.uint16(t.substituteGlyphIDs.length), f.array("uint16", t.substituteGlyphIDs), f.seek(i), f.rawBytes(e);
  for (let l = 0; l < n.length; l++)
    f.seek(a[l]), f.rawBytes(n[l]);
  for (let l = 0; l < o.length; l++)
    f.seek(c[l]), f.rawBytes(o[l]);
  return f.toArray();
}
const Rp = 8;
function Fp(t, e) {
  const n = new F(t), o = n.uint16(), s = n.uint16(), r = n.uint32(), i = e?.maxp?.numGlyphs, a = [];
  for (let c = 0; c < s && !(n.position + r > t.length || r < 2); c++) {
    const l = n.uint8(), u = n.uint8(), h = r - 2, p = typeof i == "number" ? Math.min(i, h) : h, g = n.bytes(p), d = h - p, x = d > 0 ? n.bytes(d) : [];
    a.push({
      pixelSize: l,
      maxWidth: u,
      widths: g,
      padding: x
    });
  }
  return {
    version: o,
    numRecords: s,
    sizeDeviceRecord: r,
    records: a
  };
}
function Mp(t) {
  const e = t.version ?? 0, n = t.records ?? [], o = Math.max(
    0,
    ...n.map((f) => (f.widths ?? []).length)
  ), s = Lp(2 + o), r = t.sizeDeviceRecord ?? s, i = Math.max(2, r), a = Rp + i * n.length, c = new v(a);
  c.uint16(e), c.uint16(n.length), c.uint32(i);
  for (const f of n) {
    c.uint8(f.pixelSize ?? 0), c.uint8(f.maxWidth ?? 0);
    const l = i - 2, u = (f.widths ?? []).slice(0, l), h = f.padding ?? [], p = u.concat(h).slice(0, l);
    for (; p.length < l; )
      p.push(0);
    c.rawBytes(p);
  }
  return c.toArray();
}
function Lp(t) {
  return t + (4 - t % 4) % 4;
}
const Bp = 54;
function qo(t) {
  const e = new F(t);
  return {
    majorVersion: e.uint16(),
    minorVersion: e.uint16(),
    fontRevision: e.fixed(),
    checksumAdjustment: e.uint32(),
    magicNumber: e.uint32(),
    flags: e.uint16(),
    unitsPerEm: e.uint16(),
    created: e.longDateTime(),
    modified: e.longDateTime(),
    xMin: e.int16(),
    yMin: e.int16(),
    xMax: e.int16(),
    yMax: e.int16(),
    macStyle: e.uint16(),
    lowestRecPPEM: e.uint16(),
    fontDirectionHint: e.int16(),
    indexToLocFormat: e.int16(),
    glyphDataFormat: e.int16()
  };
}
function lc(t) {
  const e = new v(Bp);
  return e.uint16(t.majorVersion), e.uint16(t.minorVersion), e.fixed(t.fontRevision), e.uint32(t.checksumAdjustment), e.uint32(t.magicNumber), e.uint16(t.flags), e.uint16(t.unitsPerEm), e.longDateTime(t.created), e.longDateTime(t.modified), e.int16(t.xMin), e.int16(t.yMin), e.int16(t.xMax), e.int16(t.yMax), e.uint16(t.macStyle), e.uint16(t.lowestRecPPEM), e.int16(t.fontDirectionHint), e.int16(t.indexToLocFormat), e.int16(t.glyphDataFormat), e.toArray();
}
const Vp = 36;
function $p(t) {
  const e = new F(t);
  return {
    majorVersion: e.uint16(),
    minorVersion: e.uint16(),
    ascender: e.fword(),
    descender: e.fword(),
    lineGap: e.fword(),
    advanceWidthMax: e.ufword(),
    minLeftSideBearing: e.fword(),
    minRightSideBearing: e.fword(),
    xMaxExtent: e.fword(),
    caretSlopeRise: e.int16(),
    caretSlopeRun: e.int16(),
    caretOffset: e.int16(),
    reserved1: e.int16(),
    reserved2: e.int16(),
    reserved3: e.int16(),
    reserved4: e.int16(),
    metricDataFormat: e.int16(),
    numberOfHMetrics: e.uint16()
  };
}
function Np(t) {
  const e = new v(Vp);
  return e.uint16(t.majorVersion), e.uint16(t.minorVersion), e.fword(t.ascender), e.fword(t.descender), e.fword(t.lineGap), e.ufword(t.advanceWidthMax), e.fword(t.minLeftSideBearing), e.fword(t.minRightSideBearing), e.fword(t.xMaxExtent), e.int16(t.caretSlopeRise), e.int16(t.caretSlopeRun), e.int16(t.caretOffset), e.int16(t.reserved1), e.int16(t.reserved2), e.int16(t.reserved3), e.int16(t.reserved4), e.int16(t.metricDataFormat), e.uint16(t.numberOfHMetrics), e.toArray();
}
function Gp(t, e) {
  const n = e.hhea.numberOfHMetrics, o = e.maxp.numGlyphs, s = new F(t), r = [];
  for (let c = 0; c < n; c++)
    r.push({
      advanceWidth: s.ufword(),
      lsb: s.fword()
    });
  const i = o - n, a = s.array("fword", i);
  return { hMetrics: r, leftSideBearings: a };
}
function Pp(t) {
  const { hMetrics: e, leftSideBearings: n } = t, o = e.length * 4 + n.length * 2, s = new v(o);
  for (const r of e)
    s.ufword(r.advanceWidth), s.fword(r.lsb);
  return s.array("fword", n), s.toArray();
}
const Up = 20, uc = 15, hc = 48;
function zp(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.offset32(), r = e.offset32(), i = e.offset32(), a = e.offset32();
  return {
    majorVersion: n,
    minorVersion: o,
    itemVariationStore: s ? Pt(
      t.slice(
        s,
        gc(t.length, s, [
          r,
          i,
          a
        ])
      )
    ) : null,
    advanceWidthMapping: _o(
      t,
      r,
      [s, i, a]
    ),
    lsbMapping: _o(t, i, [
      s,
      r,
      a
    ]),
    rsbMapping: _o(t, a, [
      s,
      r,
      i
    ])
  };
}
function _o(t, e, n) {
  if (!e)
    return null;
  const o = gc(t.length, e, n);
  if (o <= e || e >= t.length)
    return { format: 0, entryFormat: 0, mapCount: 0, entries: [], _raw: [] };
  const s = Array.from(t.slice(e, o));
  return {
    ...Hp(s),
    _raw: s
  };
}
function gc(t, e, n) {
  return n.filter((s) => s > e).sort((s, r) => s - r)[0] ?? t;
}
function Hp(t) {
  const e = new F(t), n = e.uint8(), o = e.uint8(), s = n === 1 ? e.uint32() : e.uint16(), r = (o & uc) + 1, i = ((o & hc) >> 4) + 1, a = [];
  for (let c = 0; c < s; c++) {
    const f = Kp(e, i);
    a.push(Zp(f, r));
  }
  return {
    format: n,
    entryFormat: o,
    mapCount: s,
    entries: a
  };
}
function Wp(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.itemVariationStore ? ne(t.itemVariationStore) : [], s = wo(
    t.advanceWidthMapping
  ), r = wo(t.lsbMapping), i = wo(t.rsbMapping);
  let a = Up;
  const c = o.length ? a : 0;
  a += o.length;
  const f = s.length ? a : 0;
  a += s.length;
  const l = r.length ? a : 0;
  a += r.length;
  const u = i.length ? a : 0;
  a += i.length;
  const h = new v(a);
  return h.uint16(e), h.uint16(n), h.offset32(c), h.offset32(f), h.offset32(l), h.offset32(u), h.rawBytes(o), h.rawBytes(s), h.rawBytes(r), h.rawBytes(i), h.toArray();
}
function wo(t) {
  return t ? t._raw ? t._raw : jp(t) : [];
}
function jp(t) {
  const e = t.entries ?? [], n = t.mapCount ?? e.length, o = Xp(e), s = t.format ?? (n > 65535 ? 1 : 0), r = t.entryFormat ?? o.entryFormat, i = (r & uc) + 1, a = ((r & hc) >> 4) + 1, c = s === 1 ? 6 : 4, f = new v(c + n * a);
  f.uint8(s), f.uint8(r), s === 1 ? f.uint32(n) : f.uint16(n);
  for (let l = 0; l < n; l++) {
    const u = e[l] ?? { outerIndex: 0, innerIndex: 0 }, h = Yp(u, i);
    Jp(f, h, a);
  }
  return f.toArray();
}
function Yp(t, e) {
  const n = (1 << e) - 1;
  return (t.outerIndex ?? 0) << e | (t.innerIndex ?? 0) & n;
}
function Zp(t, e) {
  const n = (1 << e) - 1;
  return {
    outerIndex: t >> e,
    innerIndex: t & n
  };
}
function Xp(t) {
  let e = 0, n = 0;
  for (const a of t)
    e = Math.max(e, a.innerIndex ?? 0), n = Math.max(n, a.outerIndex ?? 0);
  let o = 1;
  for (; (1 << o) - 1 < e && o < 16; )
    o++;
  const s = n << o | e;
  let r = 1;
  for (; r < 4 && s > qp(r); )
    r++;
  return { entryFormat: r - 1 << 4 | o - 1 };
}
function qp(t) {
  return t === 1 ? 255 : t === 2 ? 65535 : t === 3 ? 16777215 : 4294967295;
}
function Kp(t, e) {
  return e === 1 ? t.uint8() : e === 2 ? t.uint16() : e === 3 ? t.uint24() : t.uint32();
}
function Jp(t, e, n) {
  n === 1 ? t.uint8(e) : n === 2 ? t.uint16(e) : n === 3 ? t.uint24(e) : t.uint32(e >>> 0);
}
const Qp = 6, td = 6;
function ed(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = [];
  for (let c = 0; c < s; c++)
    r.push({
      tag: e.tag(),
      offset: e.offset16()
    });
  const i = r.map((c) => c.offset).filter((c) => c > 0), a = r.map((c) => ({
    ...c,
    table: od(t, c.offset, i)
  }));
  return {
    majorVersion: n,
    minorVersion: o,
    scripts: a
  };
}
function nd(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.scripts ?? [], s = o.map((c) => sd(c.table));
  let r = Qp + o.length * td;
  const i = s.map((c) => {
    if (!c.length)
      return 0;
    const f = r;
    return r += c.length, f;
  }), a = new v(r);
  a.uint16(e), a.uint16(n), a.uint16(o.length);
  for (let c = 0; c < o.length; c++) {
    const l = (o[c].tag ?? "    ").slice(0, 4).padEnd(4, " ");
    a.tag(l), a.offset16(i[c]);
  }
  for (const c of s)
    a.rawBytes(c);
  return a.toArray();
}
function od(t, e, n) {
  if (!e)
    return null;
  const s = n.filter((r) => r > e).sort((r, i) => r - i)[0] ?? t.length;
  return s <= e || e >= t.length ? { _raw: [] } : { _raw: Array.from(t.slice(e, s)) };
}
function sd(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
const pc = 4, Dn = 6, dc = 8, Rn = 8;
function rd(t) {
  const e = new F(t);
  return (t.length >= 4 ? e.uint32() : 0) === 65536 ? ld(t) : id(t);
}
function id(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = [];
  let r = pc;
  for (let i = 0; i < o && !(r + Dn > t.length); i++) {
    e.seek(r);
    const a = e.uint16(), c = e.uint16(), f = e.uint16(), l = f >> 8 & 255, u = Math.min(
      t.length,
      r + Math.max(c, Dn)
    ), h = r + Dn, p = Array.from(t.slice(h, u)), g = {
      version: a,
      coverage: f,
      format: l
    };
    l === 0 ? Object.assign(g, mc(p)) : l === 2 ? Object.assign(g, yc(p)) : g._raw = p, s.push(g), r = u;
  }
  return {
    formatVariant: "opentype",
    version: n,
    nTables: o,
    subtables: s
  };
}
function mc(t) {
  const e = new F(t);
  if (t.length < 8)
    return {
      nPairs: 0,
      searchRange: 0,
      entrySelector: 0,
      rangeShift: 0,
      pairs: []
    };
  const n = e.uint16();
  e.uint16(), e.uint16(), e.uint16();
  const o = [];
  for (let c = 0; c < n && !(e.position + 6 > t.length); c++)
    o.push({
      left: e.uint16(),
      right: e.uint16(),
      value: e.int16()
    });
  const s = o.length, r = Math.floor(
    Math.log2(Math.max(1, s))
  ), i = Math.pow(2, r) * 6, a = s * 6 - i;
  return {
    nPairs: s,
    searchRange: i,
    entrySelector: r,
    rangeShift: a,
    pairs: o
  };
}
function ad(t) {
  return mc(t);
}
function yc(t) {
  const e = new F(t);
  if (t.length < 8) return { _raw: t };
  const n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = Pr(e, t, o), a = Pr(e, t, s), c = n > 0 ? n / 2 : 0, f = n > 0 && i.maxOffset >= r ? Math.floor((i.maxOffset - r) / n) + 1 : 1, l = [];
  for (let u = 0; u < f; u++) {
    const h = [], p = r + u * n;
    for (let g = 0; g < c; g++) {
      const d = p + g * 2;
      d + 2 <= t.length ? (e.seek(d), h.push(e.int16())) : h.push(0);
    }
    l.push(h);
  }
  return {
    rowWidth: n,
    leftOffsetTable: o,
    rightOffsetTable: s,
    kerningArrayOffset: r,
    leftClassTable: i,
    rightClassTable: a,
    nLeftClasses: f,
    nRightClasses: c,
    values: l
  };
}
function Pr(t, e, n) {
  if (n + 4 > e.length)
    return {
      firstGlyph: 0,
      nGlyphs: 0,
      offsets: [],
      maxOffset: 0
    };
  t.seek(n);
  const o = t.uint16(), s = t.uint16(), r = [];
  let i = 0;
  for (let a = 0; a < s; a++)
    if (t.position + 2 <= e.length) {
      const c = t.uint16();
      r.push(c), c > i && (i = c);
    } else
      r.push(0);
  return { firstGlyph: o, nGlyphs: s, offsets: r, maxOffset: i };
}
function cd(t) {
  const e = new F(t);
  if (t.length < 8) return { _raw: t };
  const n = e.uint16(), o = e.uint8(), s = e.uint8(), r = e.uint8(), i = e.uint8(), a = [];
  for (let h = 0; h < o; h++)
    e.position + 2 <= t.length ? a.push(e.int16()) : a.push(0);
  const c = [];
  for (let h = 0; h < n; h++)
    e.position < t.length ? c.push(e.uint8()) : c.push(0);
  const f = [];
  for (let h = 0; h < n; h++)
    e.position < t.length ? f.push(e.uint8()) : f.push(0);
  const l = [], u = s * r;
  for (let h = 0; h < u; h++)
    e.position < t.length ? l.push(e.uint8()) : l.push(0);
  return {
    glyphCount: n,
    kernValueCount: o,
    leftClassCount: s,
    rightClassCount: r,
    flags: i,
    kernValues: a,
    leftClasses: c,
    rightClasses: f,
    kernIndices: l
  };
}
function fd(t) {
  const e = new F(t);
  if (t.length < 12) return { _raw: t };
  const n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.uint16();
  let a = 0, c = 0, f = [];
  if (o + 4 <= t.length) {
    e.seek(o), a = e.uint16(), c = e.uint16(), f = [];
    for (let y = 0; y < c; y++)
      e.position < t.length ? f.push(e.uint8()) : f.push(1);
  }
  const l = Math.min(r, t.length), u = n > 0 ? Math.floor((l - s) / n) : 0, h = [];
  for (let y = 0; y < u; y++) {
    const m = s + y * n;
    e.seek(m);
    const w = [];
    for (let _ = 0; _ < n; _++)
      e.position < t.length ? w.push(e.uint8()) : w.push(0);
    h.push(w);
  }
  const p = Math.min(
    i > r ? i : t.length,
    t.length
  ), g = Math.floor((p - r) / 4), d = [];
  e.seek(r);
  for (let y = 0; y < g; y++)
    if (e.position + 4 <= t.length) {
      const m = e.uint16(), w = e.uint16();
      d.push({ newStateOffset: m, flags: w });
    }
  const x = [];
  if (i < t.length)
    for (e.seek(i); e.position + 2 <= t.length; )
      x.push(e.int16());
  return {
    stateSize: n,
    classTableOffset: o,
    stateArrayOffset: s,
    entryTableOffset: r,
    valueTableOffset: i,
    classTable: {
      firstGlyph: a,
      nGlyphs: c,
      classArray: f
    },
    states: h,
    entryTable: d,
    valueTable: x
  };
}
function ld(t) {
  const e = new F(t), n = e.uint32(), o = e.uint32(), s = [];
  let r = dc;
  for (let i = 0; i < o && !(r + Rn > t.length); i++) {
    e.seek(r);
    const a = e.uint32(), c = e.uint8(), f = e.uint8(), l = e.uint16(), u = Math.min(
      t.length,
      r + Math.max(a, Rn)
    ), h = Array.from(
      t.slice(r + Rn, u)
    ), p = {
      coverage: c,
      format: f,
      tupleIndex: l
    };
    f === 0 ? Object.assign(p, ad(h)) : f === 1 ? Object.assign(p, fd(h)) : f === 2 ? Object.assign(p, yc(h)) : f === 3 ? Object.assign(p, cd(h)) : p._raw = h, s.push(p), r = u;
  }
  return {
    formatVariant: "apple",
    version: n,
    nTables: o,
    subtables: s
  };
}
function ud(t) {
  return t.formatVariant === "apple" ? pd(t) : hd(t);
}
function hd(t) {
  const e = t.version ?? 0, n = t.subtables ?? [], o = n.map(
    (a) => gd(a)
  ), s = n.length, r = pc + o.reduce((a, c) => a + c.length, 0), i = new v(r);
  i.uint16(e), i.uint16(s);
  for (const a of o)
    i.rawBytes(a);
  return i.toArray();
}
function gd(t) {
  const e = t._raw ? t._raw : t.format === 0 ? xc(t) : t.format === 2 ? Sc(t) : [], n = Dn + e.length, o = t.coverage ?? (t.format ?? 0) << 8, s = new v(n);
  return s.uint16(t.version ?? 0), s.uint16(n), s.uint16(o), s.rawBytes(e), s.toArray();
}
function xc(t) {
  const e = t.pairs ?? [], n = e.length, o = Math.floor(Math.log2(Math.max(1, n))), s = Math.pow(2, o) * 6, r = n * 6 - s, i = new v(8 + n * 6);
  i.uint16(n), i.uint16(t.searchRange ?? s), i.uint16(t.entrySelector ?? o), i.uint16(t.rangeShift ?? r);
  for (const a of e)
    i.uint16(a.left), i.uint16(a.right), i.int16(a.value);
  return i.toArray();
}
function pd(t) {
  const e = t.version ?? 65536, n = t.subtables ?? [], o = n.map((a) => {
    const c = dd(a), f = Rn + c.length, l = new v(f);
    return l.uint32(f), l.uint8(a.coverage ?? 0), l.uint8(a.format ?? 0), l.uint16(a.tupleIndex ?? 0), l.rawBytes(c), l.toArray();
  }), s = n.length, r = dc + o.reduce((a, c) => a + c.length, 0), i = new v(r);
  i.uint32(e), i.uint32(s);
  for (const a of o)
    i.rawBytes(a);
  return i.toArray();
}
function dd(t) {
  if (t._raw) return t._raw;
  switch (t.format) {
    case 0:
      return xc(t);
    case 1:
      return yd(t);
    case 2:
      return Sc(t);
    case 3:
      return md(t);
    default:
      return [];
  }
}
function Sc(t) {
  const {
    rowWidth: e,
    leftOffsetTable: n,
    rightOffsetTable: o,
    kerningArrayOffset: s,
    leftClassTable: r,
    rightClassTable: i,
    nLeftClasses: a,
    nRightClasses: c,
    values: f
  } = t, l = Ur(r), u = Ur(i), h = a * c * 2, p = Math.max(
    s + h,
    n + l.length,
    o + u.length,
    8
    // header
  ), g = new v(p);
  g.uint16(e), g.uint16(n), g.uint16(o), g.uint16(s), g.seek(n), g.rawBytes(l), g.seek(o), g.rawBytes(u), g.seek(s);
  for (let d = 0; d < a; d++) {
    const x = f[d] || [];
    for (let y = 0; y < c; y++)
      g.int16(x[y] || 0);
  }
  return g.toArray();
}
function Ur(t) {
  const { firstGlyph: e, nGlyphs: n, offsets: o } = t, s = new v(4 + n * 2);
  s.uint16(e), s.uint16(n);
  for (let r = 0; r < n; r++)
    s.uint16(o[r] || 0);
  return s.toArray();
}
function md(t) {
  const {
    glyphCount: e,
    kernValueCount: n,
    leftClassCount: o,
    rightClassCount: s,
    flags: r,
    kernValues: i,
    leftClasses: a,
    rightClasses: c,
    kernIndices: f
  } = t, l = o * s, u = 6 + // header: uint16 + 4×uint8
  n * 2 + // int16 values
  e + // left class uint8
  e + // right class uint8
  l, h = new v(u);
  h.uint16(e), h.uint8(n), h.uint8(o), h.uint8(s), h.uint8(r ?? 0);
  for (let p = 0; p < n; p++)
    h.int16(i[p] || 0);
  for (let p = 0; p < e; p++)
    h.uint8(a[p] || 0);
  for (let p = 0; p < e; p++)
    h.uint8(c[p] || 0);
  for (let p = 0; p < l; p++)
    h.uint8(f[p] || 0);
  return h.toArray();
}
function yd(t) {
  const {
    stateSize: e,
    classTableOffset: n,
    stateArrayOffset: o,
    entryTableOffset: s,
    valueTableOffset: r,
    classTable: i,
    states: a,
    entryTable: c,
    valueTable: f
  } = t, l = 4 + (i?.nGlyphs || 0), u = (a?.length || 0) * e, h = (c?.length || 0) * 4, p = (f?.length || 0) * 2, g = Math.max(
    10,
    // header: 5 × uint16
    n + l,
    o + u,
    s + h,
    r + p
  ), d = new v(g);
  if (d.uint16(e), d.uint16(n), d.uint16(o), d.uint16(s), d.uint16(r), d.seek(n), d.uint16(i?.firstGlyph || 0), d.uint16(i?.nGlyphs || 0), i?.classArray)
    for (const x of i.classArray)
      d.uint8(x);
  if (d.seek(o), a)
    for (const x of a)
      for (const y of x)
        d.uint8(y);
  if (d.seek(s), c)
    for (const x of c)
      d.uint16(x.newStateOffset), d.uint16(x.flags);
  if (d.seek(r), f)
    for (const x of f)
      d.int16(x);
  return d.toArray();
}
function xd(t) {
  const e = new F(t), n = e.uint32(), o = e.uint32(), s = e.uint32(), r = [], i = [];
  for (let a = 0; a < s; a++)
    i.push({ offset: e.uint16(), length: e.uint16() });
  for (const a of i) {
    const c = t.slice(a.offset, a.offset + a.length);
    r.push(new TextDecoder("utf-8").decode(new Uint8Array(c)));
  }
  return { version: n, flags: o, tags: r };
}
function Sd(t) {
  const { version: e, flags: n, tags: o } = t, s = new TextEncoder(), r = o.map((l) => s.encode(l)), i = 12 + o.length * 4, a = i + r.reduce((l, u) => l + u.length, 0), c = new v(a);
  c.uint32(e), c.uint32(n), c.uint32(o.length);
  let f = i;
  for (const l of r)
    c.uint16(f), c.uint16(l.length), f += l.length;
  for (const l of r)
    c.rawBytes(l);
  return c.toArray();
}
function _d(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.bytes(o);
  return {
    version: n,
    numGlyphs: o,
    yPels: s
  };
}
function wd(t) {
  const e = t.version ?? 0, n = t.yPels ?? [], o = t.numGlyphs ?? n.length, s = n.slice(0, o);
  for (; s.length < o; )
    s.push(0);
  const r = new v(4 + o);
  return r.uint16(e), r.uint16(o), r.rawBytes(s), r.toArray();
}
const bd = 10;
function Ad(t) {
  const e = new F(t), n = e.uint32(), o = e.offset16(), s = e.offset16(), r = e.offset16(), i = [
    o,
    s,
    r
  ].filter((a) => a > 0);
  return {
    version: n,
    mathConstants: bo(t, o, i),
    mathGlyphInfo: bo(t, s, i),
    mathVariants: bo(t, r, i)
  };
}
function Cd(t) {
  const e = t.version ?? 65536, n = Ao(t.mathConstants), o = Ao(t.mathGlyphInfo), s = Ao(t.mathVariants);
  let r = bd;
  const i = n.length ? r : 0;
  r += n.length;
  const a = o.length ? r : 0;
  r += o.length;
  const c = s.length ? r : 0;
  r += s.length;
  const f = new v(r);
  return f.uint32(e), f.offset16(i), f.offset16(a), f.offset16(c), f.rawBytes(n), f.rawBytes(o), f.rawBytes(s), f.toArray();
}
function bo(t, e, n) {
  if (!e)
    return null;
  const s = n.filter((r) => r > e).sort((r, i) => r - i)[0] ?? t.length;
  return s <= e || e >= t.length ? { _raw: [] } : { _raw: Array.from(t.slice(e, s)) };
}
function Ao(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
const vd = 6, Id = 32;
function Od(t) {
  const e = new F(t), n = e.uint32(), o = e.uint16(), s = { version: n, numGlyphs: o };
  return n === 65536 && (s.maxPoints = e.uint16(), s.maxContours = e.uint16(), s.maxCompositePoints = e.uint16(), s.maxCompositeContours = e.uint16(), s.maxZones = e.uint16(), s.maxTwilightPoints = e.uint16(), s.maxStorage = e.uint16(), s.maxFunctionDefs = e.uint16(), s.maxInstructionDefs = e.uint16(), s.maxStackElements = e.uint16(), s.maxSizeOfInstructions = e.uint16(), s.maxComponentElements = e.uint16(), s.maxComponentDepth = e.uint16()), s;
}
function kd(t) {
  const e = t.version === 65536, n = e ? Id : vd, o = new v(n);
  return o.uint32(t.version), o.uint16(t.numGlyphs), e && (o.uint16(t.maxPoints), o.uint16(t.maxContours), o.uint16(t.maxCompositePoints), o.uint16(t.maxCompositeContours), o.uint16(t.maxZones), o.uint16(t.maxTwilightPoints), o.uint16(t.maxStorage), o.uint16(t.maxFunctionDefs), o.uint16(t.maxInstructionDefs), o.uint16(t.maxStackElements), o.uint16(t.maxSizeOfInstructions), o.uint16(t.maxComponentElements), o.uint16(t.maxComponentDepth)), o.toArray();
}
function Ed(t) {
  if (!t.length)
    return { version: 0, data: [] };
  const e = new F(t), n = t.length >= 2 ? e.uint16() : 0, o = t.length >= 2 ? Array.from(t.slice(2)) : [];
  return {
    version: n,
    data: o
  };
}
function Td(t) {
  const e = t.version ?? 0, n = t.data ?? [], o = new v(2 + n.length);
  return o.uint16(e), o.rawBytes(n), o.toArray();
}
const _c = 16, Dd = 12;
function Rd(t) {
  const e = new F(t), n = e.uint32(), o = e.uint32(), s = e.uint32(), r = e.uint32(), i = [];
  for (let a = 0; a < r; a++) {
    const c = e.tag(), f = e.uint32(), l = e.uint32(), u = f, h = Math.min(t.length, u + l), p = u < _c || u >= t.length || h < u ? [] : Array.from(t.slice(u, h));
    i.push({ tag: c, dataOffset: f, dataLength: l, data: p });
  }
  return {
    version: n,
    flags: o,
    reserved: s,
    dataMaps: i
  };
}
function Fd(t) {
  const e = t.version ?? 1, n = t.flags ?? 0, o = t.reserved ?? 0, r = (t.dataMaps ?? []).map((f) => ({
    tag: (f.tag ?? "    ").slice(0, 4).padEnd(4, " "),
    data: f.data ?? []
  }));
  let i = _c + r.length * Dd;
  const a = r.map((f) => {
    const l = i, u = f.data.length;
    return i += u, {
      tag: f.tag,
      dataOffset: l,
      dataLength: u,
      data: f.data
    };
  }), c = new v(i);
  c.uint32(e), c.uint32(n), c.uint32(o), c.uint32(a.length);
  for (const f of a)
    c.tag(f.tag), c.uint32(f.dataOffset), c.uint32(f.dataLength);
  for (const f of a)
    c.rawBytes(f.data);
  return c.toArray();
}
const Ko = 12, ge = 8;
function Md(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.uint16(), a = e.offset16(), c = [];
  for (let l = 0; l < i; l++) {
    const u = Ko + l * r;
    if (u >= t.length) {
      c.push({
        valueTag: "    ",
        deltaSetOuterIndex: 0,
        deltaSetInnerIndex: 0,
        _extra: []
      });
      continue;
    }
    e.seek(u);
    const h = {
      valueTag: e.tag(),
      deltaSetOuterIndex: e.uint16(),
      deltaSetInnerIndex: e.uint16()
    };
    r > ge && (h._extra = e.bytes(r - ge)), c.push(h);
  }
  const f = a > 0 && a < t.length ? Pt(t.slice(a)) : null;
  return {
    majorVersion: n,
    minorVersion: o,
    reserved: s,
    valueRecordSize: r,
    valueRecords: c,
    itemVariationStore: f
  };
}
function Ld(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.reserved ?? 0, s = [...t.valueRecords ?? []].sort(
    (p, g) => Bd(p.valueTag, g.valueTag)
  ), r = t.valueRecordSize ?? ge, i = s.reduce((p, g) => {
    const d = g._extra?.length ?? 0;
    return Math.max(p, ge + d);
  }, ge), a = Math.max(
    r,
    i
  ), c = s.length, f = t.itemVariationStore ? ne(t.itemVariationStore) : [], l = f.length > 0 || c > 0 ? Ko + c * a : 0, u = l > 0 ? l + f.length : Ko, h = new v(u);
  h.uint16(e), h.uint16(n), h.uint16(o), h.uint16(a), h.uint16(c), h.offset16(l);
  for (const p of s) {
    h.tag(p.valueTag ?? "    "), h.uint16(p.deltaSetOuterIndex ?? 0), h.uint16(p.deltaSetInnerIndex ?? 0);
    const g = p._extra ?? [];
    h.rawBytes(g);
    const d = a - ge - g.length;
    d > 0 && h.rawBytes(new Array(d).fill(0));
  }
  return h.rawBytes(f), h.toArray();
}
function Bd(t, e) {
  const n = t ?? "    ", o = e ?? "    ";
  for (let s = 0; s < 4; s++) {
    const r = n.charCodeAt(s) - o.charCodeAt(s);
    if (r !== 0)
      return r;
  }
  return 0;
}
const Jo = [
  196,
  197,
  199,
  201,
  209,
  214,
  220,
  225,
  224,
  226,
  228,
  227,
  229,
  231,
  233,
  232,
  234,
  235,
  237,
  236,
  238,
  239,
  241,
  243,
  242,
  244,
  246,
  245,
  250,
  249,
  251,
  252,
  8224,
  176,
  162,
  163,
  167,
  8226,
  182,
  223,
  174,
  169,
  8482,
  180,
  168,
  8800,
  198,
  216,
  8734,
  177,
  8804,
  8805,
  165,
  181,
  8706,
  8721,
  8719,
  960,
  8747,
  170,
  186,
  937,
  230,
  248,
  191,
  161,
  172,
  8730,
  402,
  8776,
  8710,
  171,
  187,
  8230,
  160,
  192,
  195,
  213,
  338,
  339,
  8211,
  8212,
  8220,
  8221,
  8216,
  8217,
  247,
  9674,
  255,
  376,
  8260,
  8364,
  8249,
  8250,
  64257,
  64258,
  8225,
  183,
  8218,
  8222,
  8240,
  194,
  202,
  193,
  203,
  200,
  205,
  206,
  207,
  204,
  211,
  212,
  63743,
  210,
  218,
  219,
  217,
  305,
  710,
  732,
  175,
  728,
  729,
  730,
  184,
  733,
  731,
  711
], Fs = /* @__PURE__ */ new Map();
for (let t = 0; t < 128; t++)
  Fs.set(t, t);
for (let t = 0; t < Jo.length; t++)
  Fs.set(Jo[t], 128 + t);
function Vd(t, e, n) {
  return e === 0 || e === 3 ? Qo(t) : e === 1 && n === 0 ? Nd(t) : t.length % 2 === 0 ? Qo(t) : "0x:" + t.map((o) => o.toString(16).padStart(2, "0")).join("");
}
function $d(t, e, n) {
  if (t.startsWith("0x:")) {
    const o = t.slice(3), s = [];
    for (let r = 0; r < o.length; r += 2)
      s.push(parseInt(o.slice(r, r + 2), 16));
    return s;
  }
  return e === 0 || e === 3 ? ts(t) : e === 1 && n === 0 ? Gd(t) : ts(t);
}
function Qo(t) {
  const e = [];
  for (let n = 0; n + 1 < t.length; n += 2) {
    const o = t[n] << 8 | t[n + 1];
    e.push(o);
  }
  return String.fromCharCode(...e);
}
function ts(t) {
  const e = [];
  for (let n = 0; n < t.length; n++) {
    const o = t.charCodeAt(n);
    e.push(o >> 8 & 255, o & 255);
  }
  return e;
}
function Nd(t) {
  return t.map((e) => e < 128 ? String.fromCharCode(e) : String.fromCharCode(Jo[e - 128])).join("");
}
function Gd(t) {
  const e = [];
  for (let n = 0; n < t.length; n++) {
    const o = t.charCodeAt(n), s = Fs.get(o);
    e.push(s !== void 0 ? s : 63);
  }
  return e;
}
function Pd(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = [];
  for (let f = 0; f < o; f++)
    r.push({
      platformID: e.uint16(),
      encodingID: e.uint16(),
      languageID: e.uint16(),
      nameID: e.uint16(),
      length: e.uint16(),
      stringOffset: e.uint16()
    });
  const i = [];
  if (n === 1) {
    const f = e.uint16();
    for (let l = 0; l < f; l++) {
      const u = e.uint16(), h = e.uint16(), p = t.slice(
        s + h,
        s + h + u
      );
      i.push({
        tag: Qo(p)
      });
    }
  }
  const a = r.map((f) => {
    const l = t.slice(
      s + f.stringOffset,
      s + f.stringOffset + f.length
    );
    return {
      platformID: f.platformID,
      encodingID: f.encodingID,
      languageID: f.languageID,
      nameID: f.nameID,
      value: Vd(l, f.platformID, f.encodingID)
    };
  }), c = { version: n, names: a };
  return n === 1 && i.length > 0 && (c.langTagRecords = i), c;
}
function Ud(t) {
  const { version: e, names: n, langTagRecords: o = [] } = t, r = [...n].sort((S, b) => S.platformID !== b.platformID ? S.platformID - b.platformID : S.encodingID !== b.encodingID ? S.encodingID - b.encodingID : S.languageID !== b.languageID ? S.languageID - b.languageID : S.nameID - b.nameID).map((S) => ({
    platformID: S.platformID,
    encodingID: S.encodingID,
    languageID: S.languageID,
    nameID: S.nameID,
    bytes: $d(S.value, S.platformID, S.encodingID)
  })), i = o.map((S) => ts(S.tag)), a = 6, c = 12, u = e === 1 ? (e === 1 ? 2 : 0) + o.length * 4 : 0, h = a + r.length * c + u, p = [];
  let g = 0;
  const d = /* @__PURE__ */ new Map();
  function x(S) {
    const b = S.join(",");
    if (d.has(b))
      return d.get(b);
    const A = g;
    return d.set(b, A), p.push(S), g += S.length, A;
  }
  const y = r.map((S) => ({
    ...S,
    stringOffset: x(S.bytes),
    stringLength: S.bytes.length
  })), m = i.map((S) => ({
    stringOffset: x(S),
    stringLength: S.length
  })), w = h + g, _ = new v(w);
  _.uint16(e), _.uint16(r.length), _.uint16(h);
  for (const S of y)
    _.uint16(S.platformID).uint16(S.encodingID).uint16(S.languageID).uint16(S.nameID).uint16(S.stringLength).uint16(S.stringOffset);
  if (e === 1) {
    _.uint16(m.length);
    for (const S of m)
      _.uint16(S.stringLength).uint16(S.stringOffset);
  }
  for (const S of p)
    _.rawBytes(S);
  return _.toArray();
}
const wc = 78, bc = 86, Ac = 96, Cc = 100;
function zd(t) {
  const e = new F(t), n = t.length, o = {};
  return o.version = e.uint16(), o.xAvgCharWidth = e.fword(), o.usWeightClass = e.uint16(), o.usWidthClass = e.uint16(), o.fsType = e.uint16(), o.ySubscriptXSize = e.fword(), o.ySubscriptYSize = e.fword(), o.ySubscriptXOffset = e.fword(), o.ySubscriptYOffset = e.fword(), o.ySuperscriptXSize = e.fword(), o.ySuperscriptYSize = e.fword(), o.ySuperscriptXOffset = e.fword(), o.ySuperscriptYOffset = e.fword(), o.yStrikeoutSize = e.fword(), o.yStrikeoutPosition = e.fword(), o.sFamilyClass = e.int16(), o.panose = e.bytes(10), o.ulUnicodeRange1 = e.uint32(), o.ulUnicodeRange2 = e.uint32(), o.ulUnicodeRange3 = e.uint32(), o.ulUnicodeRange4 = e.uint32(), o.achVendID = e.tag(), o.fsSelection = e.uint16(), o.usFirstCharIndex = e.uint16(), o.usLastCharIndex = e.uint16(), n < wc || (o.sTypoAscender = e.fword(), o.sTypoDescender = e.fword(), o.sTypoLineGap = e.fword(), o.usWinAscent = e.ufword(), o.usWinDescent = e.ufword(), o.version < 1 || n < bc) || (o.ulCodePageRange1 = e.uint32(), o.ulCodePageRange2 = e.uint32(), o.version < 2 || n < Ac) || (o.sxHeight = e.fword(), o.sCapHeight = e.fword(), o.usDefaultChar = e.uint16(), o.usBreakChar = e.uint16(), o.usMaxContext = e.uint16(), o.version < 5 || n < Cc) || (o.usLowerOpticalPointSize = e.uint16(), o.usUpperOpticalPointSize = e.uint16()), o;
}
function Hd(t) {
  const e = t.version;
  let n;
  e >= 5 ? n = Cc : e >= 2 ? n = Ac : e >= 1 ? n = bc : n = t.sTypoAscender !== void 0 ? wc : 68;
  const o = new v(n);
  return o.uint16(e).fword(t.xAvgCharWidth).uint16(t.usWeightClass).uint16(t.usWidthClass).uint16(t.fsType).fword(t.ySubscriptXSize).fword(t.ySubscriptYSize).fword(t.ySubscriptXOffset).fword(t.ySubscriptYOffset).fword(t.ySuperscriptXSize).fword(t.ySuperscriptYSize).fword(t.ySuperscriptXOffset).fword(t.ySuperscriptYOffset).fword(t.yStrikeoutSize).fword(t.yStrikeoutPosition).int16(t.sFamilyClass).rawBytes(t.panose).uint32(t.ulUnicodeRange1).uint32(t.ulUnicodeRange2).uint32(t.ulUnicodeRange3).uint32(t.ulUnicodeRange4).tag(t.achVendID).uint16(t.fsSelection).uint16(t.usFirstCharIndex).uint16(t.usLastCharIndex), n <= 68 || (o.fword(t.sTypoAscender).fword(t.sTypoDescender).fword(t.sTypoLineGap).ufword(t.usWinAscent).ufword(t.usWinDescent), e < 1) || (o.uint32(t.ulCodePageRange1).uint32(t.ulCodePageRange2), e < 2) || (o.fword(t.sxHeight).fword(t.sCapHeight).uint16(t.usDefaultChar).uint16(t.usBreakChar).uint16(t.usMaxContext), e < 5) || o.uint16(t.usLowerOpticalPointSize).uint16(t.usUpperOpticalPointSize), o.toArray();
}
const Wd = 54;
function jd(t) {
  const e = new F(t);
  return {
    version: e.uint32(),
    fontNumber: e.uint32(),
    pitch: e.uint16(),
    xHeight: e.uint16(),
    style: e.uint16(),
    typeFamily: e.uint16(),
    capHeight: e.uint16(),
    symbolSet: e.uint16(),
    typeface: Co(e.bytes(16)),
    characterComplement: Co(e.bytes(8)),
    fileName: Co(e.bytes(6)),
    strokeWeight: e.int8(),
    widthType: e.int8(),
    serifStyle: e.uint8(),
    reserved: e.uint8()
  };
}
function Yd(t) {
  const e = new v(Wd);
  return e.uint32(t.version ?? 65536), e.uint32(t.fontNumber ?? 0), e.uint16(t.pitch ?? 0), e.uint16(t.xHeight ?? 0), e.uint16(t.style ?? 0), e.uint16(t.typeFamily ?? 0), e.uint16(t.capHeight ?? 0), e.uint16(t.symbolSet ?? 0), e.rawBytes(vo(t.typeface ?? "", 16)), e.rawBytes(vo(t.characterComplement ?? "", 8)), e.rawBytes(vo(t.fileName ?? "", 6)), e.int8(t.strokeWeight ?? 0), e.int8(t.widthType ?? 0), e.uint8(t.serifStyle ?? 0), e.uint8(t.reserved ?? 0), e.toArray();
}
function Co(t) {
  return String.fromCharCode(...t).replace(/\0+$/g, "");
}
function vo(t, e) {
  const n = new Array(e).fill(0);
  for (let o = 0; o < e && o < t.length; o++) {
    const s = t.charCodeAt(o);
    n[o] = s >= 0 && s <= 127 ? s : 63;
  }
  return n;
}
const Ms = 32, es = [
  ".notdef",
  ".null",
  "nonmarkingreturn",
  "space",
  "exclam",
  "quotedbl",
  "numbersign",
  "dollar",
  "percent",
  "ampersand",
  "quotesingle",
  "parenleft",
  "parenright",
  "asterisk",
  "plus",
  "comma",
  "hyphen",
  "period",
  "slash",
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "colon",
  "semicolon",
  "less",
  "equal",
  "greater",
  "question",
  "at",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "bracketleft",
  "backslash",
  "bracketright",
  "asciicircum",
  "underscore",
  "grave",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "braceleft",
  "bar",
  "braceright",
  "asciitilde",
  "Adieresis",
  "Aring",
  "Ccedilla",
  "Eacute",
  "Ntilde",
  "Odieresis",
  "Udieresis",
  "aacute",
  "agrave",
  "acircumflex",
  "adieresis",
  "atilde",
  "aring",
  "ccedilla",
  "eacute",
  "egrave",
  "ecircumflex",
  "edieresis",
  "iacute",
  "igrave",
  "icircumflex",
  "idieresis",
  "ntilde",
  "oacute",
  "ograve",
  "ocircumflex",
  "odieresis",
  "otilde",
  "uacute",
  "ugrave",
  "ucircumflex",
  "udieresis",
  "dagger",
  "degree",
  "cent",
  "sterling",
  "section",
  "bullet",
  "paragraph",
  "germandbls",
  "registered",
  "copyright",
  "trademark",
  "acute",
  "dieresis",
  "notequal",
  "AE",
  "Oslash",
  "infinity",
  "plusminus",
  "lessequal",
  "greaterequal",
  "yen",
  "mu",
  "partialdiff",
  "summation",
  "product",
  "pi",
  "integral",
  "ordfeminine",
  "ordmasculine",
  "Omega",
  "ae",
  "oslash",
  "questiondown",
  "exclamdown",
  "logicalnot",
  "radical",
  "florin",
  "approxequal",
  "Delta",
  "guillemotleft",
  "guillemotright",
  "ellipsis",
  "nonbreakingspace",
  "Agrave",
  "Atilde",
  "Otilde",
  "OE",
  "oe",
  "endash",
  "emdash",
  "quotedblleft",
  "quotedblright",
  "quoteleft",
  "quoteright",
  "divide",
  "lozenge",
  "ydieresis",
  "Ydieresis",
  "fraction",
  "currency",
  "guilsinglleft",
  "guilsinglright",
  "fi",
  "fl",
  "daggerdbl",
  "periodcentered",
  "quotesinglbase",
  "quotedblbase",
  "perthousand",
  "Acircumflex",
  "Ecircumflex",
  "Aacute",
  "Edieresis",
  "Egrave",
  "Iacute",
  "Icircumflex",
  "Idieresis",
  "Igrave",
  "Oacute",
  "Ocircumflex",
  "apple",
  "Ograve",
  "Uacute",
  "Ucircumflex",
  "Ugrave",
  "dotlessi",
  "circumflex",
  "tilde",
  "macron",
  "breve",
  "dotaccent",
  "ring",
  "cedilla",
  "hungarumlaut",
  "ogonek",
  "caron",
  "Lslash",
  "lslash",
  "Scaron",
  "scaron",
  "Zcaron",
  "zcaron",
  "brokenbar",
  "Eth",
  "eth",
  "Yacute",
  "yacute",
  "Thorn",
  "thorn",
  "minus",
  "multiply",
  "onesuperior",
  "twosuperior",
  "threesuperior",
  "onehalf",
  "onequarter",
  "threequarters",
  "franc",
  "Gbreve",
  "gbreve",
  "Idotaccent",
  "Scedilla",
  "scedilla",
  "Cacute",
  "cacute",
  "Ccaron",
  "ccaron",
  "dcroat"
], vc = new Map(
  es.map((t, e) => [t, e])
);
function Zd(t) {
  const e = new F(t), n = e.uint32(), o = e.fixed(), s = e.fword(), r = e.fword(), i = e.uint32(), a = e.uint32(), c = e.uint32(), f = e.uint32(), l = e.uint32(), u = {
    version: n,
    italicAngle: o,
    underlinePosition: s,
    underlineThickness: r,
    isFixedPitch: i,
    minMemType42: a,
    maxMemType42: c,
    minMemType1: f,
    maxMemType1: l
  };
  if (n === 65536 || n === 196608)
    return u;
  if (n === 131072) {
    const h = e.uint16(), p = e.array("uint16", h);
    let g = -1;
    for (const m of p)
      m > g && (g = m);
    const d = g >= 258 ? g - 258 + 1 : 0, x = [];
    for (let m = 0; m < d; m++) {
      const w = e.uint8(), _ = e.bytes(w);
      x.push(String.fromCharCode(..._));
    }
    const y = p.map((m) => m < 258 ? es[m] : x[m - 258]);
    return u.glyphNames = y, u;
  }
  if (n === 151552) {
    const h = e.uint16(), g = e.array("int8", h).map(
      (d, x) => es[x + d]
    );
    return u.glyphNames = g, u;
  }
  return u;
}
function Ic(t) {
  const { version: e } = t;
  return e === 65536 || e === 196608 ? zr(t) : e === 131072 ? Xd(t) : e === 151552 ? qd(t) : zr(t);
}
function zr(t) {
  const e = new v(Ms);
  return e.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), e.toArray();
}
function Xd(t) {
  const { glyphNames: e } = t, n = e.length, o = [], s = [], r = /* @__PURE__ */ new Map();
  for (const f of e) {
    const l = vc.get(f);
    l !== void 0 ? o.push(l) : (r.has(f) || (r.set(f, s.length), s.push(f)), o.push(258 + r.get(f)));
  }
  let i = 0;
  for (const f of s)
    i += 1 + f.length;
  const a = Ms + 2 + n * 2 + i, c = new v(a);
  c.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), c.uint16(n);
  for (const f of o)
    c.uint16(f);
  for (const f of s) {
    c.uint8(f.length);
    for (let l = 0; l < f.length; l++)
      c.uint8(f.charCodeAt(l));
  }
  return c.toArray();
}
function qd(t) {
  const { glyphNames: e } = t, n = e.length, o = Ms + 2 + n, s = new v(o);
  s.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), s.uint16(n);
  for (let r = 0; r < n; r++) {
    const i = e[r], c = vc.get(i) - r;
    s.int8(c);
  }
  return s.toArray();
}
function Kd(t, e) {
  const n = new F(t), o = n.uint16(), s = n.uint16(), r = n.uint32(), i = n.array("uint32", r);
  let a = e?.maxp?.numGlyphs;
  const c = [];
  for (let f = 0; f < r; f++) {
    const l = i[f], u = i[f + 1] ?? t.length;
    if (l >= t.length || u <= l) {
      c.push({ ppem: 0, ppi: 0, glyphs: [] });
      continue;
    }
    n.seek(l);
    const h = n.uint16(), p = n.uint16();
    a == null && (a = (n.uint32() - 4) / 4 - 1, n.seek(l + 4));
    const g = n.array("uint32", a + 1), d = [];
    for (let x = 0; x < a; x++) {
      const y = l + g[x], m = l + g[x + 1], w = m - y;
      if (w <= 0) {
        d.push(null);
        continue;
      }
      n.seek(y);
      const _ = n.int16(), S = n.int16(), b = n.tag(), A = w > 8 ? t.slice(y + 8, m) : [];
      d.push({ originOffsetX: _, originOffsetY: S, graphicType: b, imageData: A });
    }
    c.push({ ppem: h, ppi: p, glyphs: d });
  }
  return { version: o, flags: s, strikes: c };
}
function Jd(t) {
  const e = t.version ?? 1, n = t.flags ?? 0, o = t.strikes ?? [], s = o.map((f) => f._raw ? f._raw : Qd(f));
  let i = 8 + o.length * 4;
  const a = [];
  for (const f of s)
    a.push(i), i += f.length;
  const c = new v(i);
  c.uint16(e), c.uint16(n), c.uint32(o.length);
  for (const f of a)
    c.uint32(f);
  for (const f of s)
    c.rawBytes(f);
  return c.toArray();
}
function Qd(t) {
  const e = t.glyphs ?? [], n = e.length, o = e.map((l) => {
    if (!l) return [];
    const u = l.imageData ?? [], h = new v(8 + u.length);
    return h.int16(l.originOffsetX ?? 0), h.int16(l.originOffsetY ?? 0), h.tag(l.graphicType ?? "png "), h.rawBytes(u), h.toArray();
  });
  let i = 4 + (n + 1) * 4;
  const a = [];
  for (const l of o)
    a.push(i), i += l.length;
  a.push(i);
  const c = i, f = new v(c);
  f.uint16(t.ppem ?? 0), f.uint16(t.ppi ?? 0);
  for (const l of a)
    f.uint32(l);
  for (const l of o)
    f.rawBytes(l);
  return f.toArray();
}
const t1 = 18, Oc = 20, pe = 8;
function e1(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.offset32(), a = e.uint16(), c = e.offset32();
  let f;
  o >= 1 && t.length >= Oc && (f = e.uint16());
  const l = [];
  if (r > 0 && i > 0)
    for (let g = 0; g < r; g++) {
      e.seek(i + g * s);
      const d = {
        axisTag: e.tag(),
        axisNameID: e.uint16(),
        axisOrdering: e.uint16()
      };
      s > pe && (d._extra = e.bytes(s - pe)), l.push(d);
    }
  const u = [];
  if (a > 0 && c > 0) {
    e.seek(c);
    for (let g = 0; g < a; g++)
      u.push(e.offset16());
  }
  const h = [];
  for (let g = 0; g < u.length; g++) {
    const d = u[g], x = c + d;
    let y = t.length;
    for (let m = 0; m < u.length; m++) {
      const w = c + u[m];
      w > x && w < y && (y = w);
    }
    if (x >= t.length) {
      h.push({ format: 0, _raw: [] });
      continue;
    }
    h.push(n1(t, x, y));
  }
  const p = {
    majorVersion: n,
    minorVersion: o,
    designAxisSize: s,
    designAxes: l,
    axisValues: h
  };
  return f !== void 0 && (p.elidedFallbackNameID = f), p;
}
function n1(t, e, n) {
  const o = new F(t);
  o.seek(e);
  const s = o.uint16();
  switch (s) {
    case 1:
      return {
        format: s,
        axisIndex: o.uint16(),
        flags: o.uint16(),
        valueNameID: o.uint16(),
        value: o.fixed()
      };
    case 2:
      return {
        format: s,
        axisIndex: o.uint16(),
        flags: o.uint16(),
        valueNameID: o.uint16(),
        nominalValue: o.fixed(),
        rangeMinValue: o.fixed(),
        rangeMaxValue: o.fixed()
      };
    case 3:
      return {
        format: s,
        axisIndex: o.uint16(),
        flags: o.uint16(),
        valueNameID: o.uint16(),
        value: o.fixed(),
        linkedValue: o.fixed()
      };
    case 4: {
      const r = o.uint16(), i = o.uint16(), a = o.uint16(), c = [];
      for (let f = 0; f < r; f++)
        c.push({
          axisIndex: o.uint16(),
          value: o.fixed()
        });
      return {
        format: s,
        axisCount: r,
        flags: i,
        valueNameID: a,
        axisValues: c
      };
    }
    default:
      return {
        format: s,
        _raw: Array.from(t.slice(e, n))
      };
  }
}
function o1(t) {
  const e = t.majorVersion ?? 1;
  let n = t.minorVersion ?? 2;
  const o = t.designAxes ?? [], s = t.axisValues ?? [], r = t.designAxisSize ?? pe, i = o.reduce((b, A) => {
    const k = A._extra?.length ?? 0;
    return Math.max(b, pe + k);
  }, pe), a = Math.max(
    r,
    i
  ), c = n >= 1 || t.elidedFallbackNameID !== void 0;
  c && n === 0 && (n = 1);
  const f = c ? Oc : t1, l = o.length, u = s.length, h = l > 0 ? f : 0, p = l * a, g = u > 0 ? f + p : 0, d = u * 2, x = s.map(
    (b) => s1(b)
  );
  let y = d;
  const m = x.map((b) => {
    const A = y;
    return y += b.length, A;
  }), w = x.reduce(
    (b, A) => b + A.length,
    0
  ), _ = f + p + d + w, S = new v(_);
  S.uint16(e), S.uint16(n), S.uint16(a), S.uint16(l), S.offset32(h), S.uint16(u), S.offset32(g), c && S.uint16(t.elidedFallbackNameID ?? 2);
  for (const b of o) {
    S.tag(b.axisTag), S.uint16(b.axisNameID ?? 0), S.uint16(b.axisOrdering ?? 0);
    const A = b._extra ?? [];
    S.rawBytes(A);
    const k = a - pe - A.length;
    k > 0 && S.rawBytes(new Array(k).fill(0));
  }
  for (const b of m)
    S.offset16(b);
  for (const b of x)
    S.rawBytes(b);
  return S.toArray();
}
function s1(t) {
  if (t._raw)
    return t._raw;
  switch (t.format) {
    case 1: {
      const e = new v(12);
      return e.uint16(1), e.uint16(t.axisIndex ?? 0), e.uint16(t.flags ?? 0), e.uint16(t.valueNameID ?? 0), e.fixed(t.value ?? 0), e.toArray();
    }
    case 2: {
      const e = new v(20);
      return e.uint16(2), e.uint16(t.axisIndex ?? 0), e.uint16(t.flags ?? 0), e.uint16(t.valueNameID ?? 0), e.fixed(t.nominalValue ?? 0), e.fixed(t.rangeMinValue ?? 0), e.fixed(t.rangeMaxValue ?? 0), e.toArray();
    }
    case 3: {
      const e = new v(16);
      return e.uint16(3), e.uint16(t.axisIndex ?? 0), e.uint16(t.flags ?? 0), e.uint16(t.valueNameID ?? 0), e.fixed(t.value ?? 0), e.fixed(t.linkedValue ?? 0), e.toArray();
    }
    case 4: {
      const e = t.axisValues ?? [], n = t.axisCount ?? e.length, o = new v(8 + n * 6);
      o.uint16(4), o.uint16(n), o.uint16(t.flags ?? 0), o.uint16(t.valueNameID ?? 0);
      for (let s = 0; s < n; s++) {
        const r = e[s] ?? { axisIndex: 0, value: 0 };
        o.uint16(r.axisIndex ?? 0), o.fixed(r.value ?? 0);
      }
      return o.toArray();
    }
    default:
      throw new Error(
        `Unsupported STAT axis value format: ${t.format}`
      );
  }
}
function r1(t) {
  const e = new F(t), n = e.uint16(), o = e.uint32();
  e.uint32(), e.seek(o);
  const s = e.uint16(), r = [];
  for (let l = 0; l < s; l++)
    r.push({
      startGlyphID: e.uint16(),
      endGlyphID: e.uint16(),
      svgDocOffset: e.uint32(),
      svgDocLength: e.uint32()
    });
  const i = new TextDecoder("utf-8"), a = /* @__PURE__ */ new Map(), c = [];
  for (const l of r) {
    const u = `${l.svgDocOffset}:${l.svgDocLength}`;
    if (!a.has(u)) {
      const h = o + l.svgDocOffset, p = t.slice(h, h + l.svgDocLength), g = p.length >= 3 && p[0] === 31 && p[1] === 139 && p[2] === 8, d = c.length;
      if (g)
        c.push({ compressed: !0, data: p });
      else {
        const x = i.decode(new Uint8Array(p));
        c.push({ compressed: !1, text: x });
      }
      a.set(u, d);
    }
  }
  const f = [];
  for (const l of r) {
    const u = `${l.svgDocOffset}:${l.svgDocLength}`;
    f.push({
      startGlyphID: l.startGlyphID,
      endGlyphID: l.endGlyphID,
      documentIndex: a.get(u)
    });
  }
  return {
    version: n,
    documents: c,
    entries: f
  };
}
function i1(t) {
  const { version: e, documents: n, entries: o } = t, s = new TextEncoder(), r = n.map((g) => g.compressed ? g.data instanceof Uint8Array ? Array.from(g.data) : g.data : Array.from(s.encode(g.text))), a = 10, c = o.length;
  let l = 2 + c * 12;
  const u = [];
  for (let g = 0; g < r.length; g++) {
    const d = r[g];
    u.push({ offset: l, length: d.length }), l += d.length;
  }
  const h = a + l, p = new v(h);
  p.uint16(e), p.uint32(a), p.uint32(0), p.uint16(c);
  for (const g of o) {
    const d = u[g.documentIndex];
    p.uint16(g.startGlyphID), p.uint16(g.endGlyphID), p.uint32(d.offset), p.uint32(d.length);
  }
  for (const g of r)
    for (const d of g)
      p.uint8(d);
  return p.toArray();
}
const a1 = 6, c1 = 4, f1 = 2, kc = 6;
function l1(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = [];
  for (let u = 0; u < s; u++)
    r.push({
      bCharSet: e.uint8(),
      xRatio: e.uint8(),
      yStartRatio: e.uint8(),
      yEndRatio: e.uint8()
    });
  const i = [];
  for (let u = 0; u < s; u++)
    i.push(e.offset16());
  const a = [...new Set(i)].sort((u, h) => u - h), c = a.map((u) => h1(t, u)), f = new Map(
    a.map((u, h) => [u, h])
  ), l = r.map((u, h) => ({
    ...u,
    groupIndex: f.get(i[h]) ?? 0
  }));
  return {
    version: n,
    numRecs: o,
    numRatios: s,
    ratios: l,
    groups: c
  };
}
function u1(t) {
  const e = t.version ?? 0, n = t.ratios ?? [], o = t.groups ?? [], s = o.map((l) => g1(l)), r = t.numRecs ?? Math.max(0, ...o.map((l) => (l.entries ?? []).length)), i = n.length;
  let a = a1 + i * c1 + i * f1;
  const c = s.map((l) => {
    const u = a;
    return a += l.length, u;
  }), f = new v(a);
  f.uint16(e), f.uint16(r), f.uint16(i);
  for (const l of n)
    f.uint8(l.bCharSet ?? 0), f.uint8(l.xRatio ?? 0), f.uint8(l.yStartRatio ?? 0), f.uint8(l.yEndRatio ?? 0);
  for (const l of n) {
    const u = l.groupIndex ?? 0, h = c[u] ?? 0;
    f.offset16(h);
  }
  for (const l of s)
    f.rawBytes(l);
  return f.toArray();
}
function h1(t, e) {
  if (!e || e >= t.length)
    return { recs: 0, startsz: 0, endsz: 0, entries: [] };
  const n = new F(t, e), o = n.uint16(), s = n.uint8(), r = n.uint8(), i = [];
  for (let a = 0; a < o && !(n.position + kc > t.length); a++)
    i.push({
      yPelHeight: n.uint16(),
      yMax: n.int16(),
      yMin: n.int16()
    });
  return { recs: o, startsz: s, endsz: r, entries: i };
}
function g1(t) {
  const e = t.entries ?? [], n = t.recs ?? e.length, o = e.slice(0, n);
  for (; o.length < n; )
    o.push({ yPelHeight: 0, yMax: 0, yMin: 0 });
  const s = new v(4 + n * kc);
  s.uint16(n), s.uint8(t.startsz ?? 0), s.uint8(t.endsz ?? 0);
  for (const r of o)
    s.uint16(r.yPelHeight ?? 0), s.int16(r.yMax ?? 0), s.int16(r.yMin ?? 0);
  return s.toArray();
}
const p1 = 36;
function d1(t) {
  const e = new F(t);
  return {
    version: e.uint32(),
    vertTypoAscender: e.fword(),
    vertTypoDescender: e.fword(),
    vertTypoLineGap: e.fword(),
    advanceHeightMax: e.ufword(),
    minTopSideBearing: e.fword(),
    minBottomSideBearing: e.fword(),
    yMaxExtent: e.fword(),
    caretSlopeRise: e.int16(),
    caretSlopeRun: e.int16(),
    caretOffset: e.int16(),
    reserved1: e.int16(),
    reserved2: e.int16(),
    reserved3: e.int16(),
    reserved4: e.int16(),
    metricDataFormat: e.int16(),
    numOfLongVerMetrics: e.uint16()
  };
}
function m1(t) {
  const e = new v(p1);
  return e.uint32(t.version), e.fword(t.vertTypoAscender), e.fword(t.vertTypoDescender), e.fword(t.vertTypoLineGap), e.ufword(t.advanceHeightMax), e.fword(t.minTopSideBearing), e.fword(t.minBottomSideBearing), e.fword(t.yMaxExtent), e.int16(t.caretSlopeRise), e.int16(t.caretSlopeRun), e.int16(t.caretOffset), e.int16(t.reserved1), e.int16(t.reserved2), e.int16(t.reserved3), e.int16(t.reserved4), e.int16(t.metricDataFormat), e.uint16(t.numOfLongVerMetrics), e.toArray();
}
function y1(t, e) {
  const n = e.vhea.numOfLongVerMetrics, o = e.maxp.numGlyphs, s = new F(t), r = [];
  for (let c = 0; c < n; c++)
    r.push({
      advanceHeight: s.ufword(),
      topSideBearing: s.fword()
    });
  const i = o - n, a = s.array("fword", i);
  return { vMetrics: r, topSideBearings: a };
}
function x1(t) {
  const { vMetrics: e, topSideBearings: n } = t, o = e.length * 4 + n.length * 2, s = new v(o);
  for (const r of e)
    s.ufword(r.advanceHeight), s.fword(r.topSideBearing);
  return s.array("fword", n), s.toArray();
}
const S1 = 24, Ec = 15, Tc = 48;
function _1(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.offset32(), r = e.offset32(), i = e.offset32(), a = e.offset32(), c = e.offset32(), f = [
    s,
    r,
    i,
    a,
    c
  ];
  return {
    majorVersion: n,
    minorVersion: o,
    itemVariationStore: s ? Pt(
      t.slice(
        s,
        Dc(t.length, s, f)
      )
    ) : null,
    advanceHeightMapping: Sn(
      t,
      r,
      f
    ),
    tsbMapping: Sn(
      t,
      i,
      f
    ),
    bsbMapping: Sn(
      t,
      a,
      f
    ),
    vOrgMapping: Sn(
      t,
      c,
      f
    )
  };
}
function Sn(t, e, n) {
  if (!e)
    return null;
  const o = Dc(t.length, e, n);
  if (o <= e || e >= t.length)
    return { format: 0, entryFormat: 0, mapCount: 0, entries: [], _raw: [] };
  const s = Array.from(t.slice(e, o));
  return {
    ...w1(s),
    _raw: s
  };
}
function Dc(t, e, n) {
  return n.filter((s) => s > e).sort((s, r) => s - r)[0] ?? t;
}
function w1(t) {
  const e = new F(t), n = e.uint8(), o = e.uint8(), s = n === 1 ? e.uint32() : e.uint16(), r = (o & Ec) + 1, i = ((o & Tc) >> 4) + 1, a = [];
  for (let c = 0; c < s; c++) {
    const f = k1(e, i);
    a.push(v1(f, r));
  }
  return {
    format: n,
    entryFormat: o,
    mapCount: s,
    entries: a
  };
}
function b1(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.itemVariationStore ? ne(t.itemVariationStore) : [], s = _n(
    t.advanceHeightMapping
  ), r = _n(t.tsbMapping), i = _n(t.bsbMapping), a = _n(t.vOrgMapping);
  let c = S1;
  const f = o.length ? c : 0;
  c += o.length;
  const l = s.length ? c : 0;
  c += s.length;
  const u = r.length ? c : 0;
  c += r.length;
  const h = i.length ? c : 0;
  c += i.length;
  const p = a.length ? c : 0;
  c += a.length;
  const g = new v(c);
  return g.uint16(e), g.uint16(n), g.offset32(f), g.offset32(l), g.offset32(u), g.offset32(h), g.offset32(p), g.rawBytes(o), g.rawBytes(s), g.rawBytes(r), g.rawBytes(i), g.rawBytes(a), g.toArray();
}
function _n(t) {
  return t ? t._raw ? t._raw : A1(t) : [];
}
function A1(t) {
  const e = t.entries ?? [], n = t.mapCount ?? e.length, o = I1(e), s = t.format ?? (n > 65535 ? 1 : 0), r = t.entryFormat ?? o.entryFormat, i = (r & Ec) + 1, a = ((r & Tc) >> 4) + 1, c = s === 1 ? 6 : 4, f = new v(c + n * a);
  f.uint8(s), f.uint8(r), s === 1 ? f.uint32(n) : f.uint16(n);
  for (let l = 0; l < n; l++) {
    const u = e[l] ?? { outerIndex: 0, innerIndex: 0 }, h = C1(u, i);
    E1(f, h, a);
  }
  return f.toArray();
}
function C1(t, e) {
  const n = (1 << e) - 1;
  return (t.outerIndex ?? 0) << e | (t.innerIndex ?? 0) & n;
}
function v1(t, e) {
  const n = (1 << e) - 1;
  return {
    outerIndex: t >> e,
    innerIndex: t & n
  };
}
function I1(t) {
  let e = 0, n = 0;
  for (const a of t)
    e = Math.max(e, a.innerIndex ?? 0), n = Math.max(n, a.outerIndex ?? 0);
  let o = 1;
  for (; (1 << o) - 1 < e && o < 16; )
    o++;
  const s = n << o | e;
  let r = 1;
  for (; r < 4 && s > O1(r); )
    r++;
  return { entryFormat: r - 1 << 4 | o - 1 };
}
function O1(t) {
  return t === 1 ? 255 : t === 2 ? 65535 : t === 3 ? 16777215 : 4294967295;
}
function k1(t, e) {
  return e === 1 ? t.uint8() : e === 2 ? t.uint16() : e === 3 ? t.uint24() : t.uint32();
}
function E1(t, e, n) {
  n === 1 ? t.uint8(e) : n === 2 ? t.uint16(e) : n === 3 ? t.uint24(e) : t.uint32(e >>> 0);
}
const no = 32768, oo = 4095, so = 32768, ro = 16384, io = 8192, T1 = 4095, Rc = 128, D1 = 127, Fc = 128, Mc = 64, R1 = 63;
function $n(t) {
  const e = t.uint8();
  let n;
  if (e === 0)
    return null;
  if ((e & 128) === 0)
    n = e;
  else {
    const r = t.uint8();
    n = (e & 127) << 8 | r;
  }
  const o = [];
  let s = 0;
  for (; o.length < n; ) {
    const r = t.uint8(), i = (r & D1) + 1, a = (r & Rc) !== 0;
    for (let c = 0; c < i && o.length < n; c++) {
      const f = a ? t.uint16() : t.uint8();
      s += f, o.push(s);
    }
  }
  return o;
}
function Nn(t) {
  if (t === null)
    return [0];
  const e = t.length, n = [];
  e < 128 ? n.push(e) : (n.push(128 | e >> 8), n.push(e & 255));
  const o = [];
  let s = 0;
  for (const i of t)
    o.push(i - s), s = i;
  let r = 0;
  for (; r < o.length; ) {
    const i = o[r] > 255;
    let a = 1;
    const c = Math.min(128, o.length - r);
    for (; a < c && o[r + a] > 255 === i; )
      a++;
    const f = (i ? Rc : 0) | a - 1;
    n.push(f);
    for (let l = 0; l < a; l++) {
      const u = o[r + l];
      i ? n.push(u >> 8 & 255, u & 255) : n.push(u & 255);
    }
    r += a;
  }
  return n;
}
function Lc(t, e) {
  const n = [];
  for (; n.length < e; ) {
    const o = t.uint8(), s = (o & R1) + 1;
    if (o & Fc)
      for (let r = 0; r < s && n.length < e; r++)
        n.push(0);
    else if (o & Mc)
      for (let r = 0; r < s && n.length < e; r++)
        n.push(t.int16());
    else
      for (let r = 0; r < s && n.length < e; r++)
        n.push(t.int8());
  }
  return n;
}
function Bc(t) {
  const e = [];
  let n = 0;
  for (; n < t.length; )
    if (t[n] === 0) {
      let o = 1;
      const s = Math.min(64, t.length - n);
      for (; o < s && t[n + o] === 0; )
        o++;
      e.push(Fc | o - 1), n += o;
    } else if (t[n] < -128 || t[n] > 127) {
      let o = 1;
      const s = Math.min(64, t.length - n);
      for (; o < s; ) {
        const r = t[n + o];
        if (r === 0 || r >= -128 && r <= 127) break;
        o++;
      }
      e.push(Mc | o - 1);
      for (let r = 0; r < o; r++) {
        const i = t[n + r] & 65535;
        e.push(i >> 8 & 255, i & 255);
      }
      n += o;
    } else {
      let o = 1;
      const s = Math.min(64, t.length - n);
      for (; o < s; ) {
        const r = t[n + o];
        if (r === 0 || r < -128 || r > 127) break;
        o++;
      }
      e.push(o - 1);
      for (let r = 0; r < o; r++)
        e.push(t[n + r] & 255);
      n += o;
    }
  return e;
}
function F1(t, e, n, o) {
  if (!t || t.length === 0) return [];
  const s = new F(t), r = s.uint16(), i = s.offset16(), a = r & oo, c = (r & no) !== 0;
  if (a === 0) return [];
  const f = [];
  for (let h = 0; h < a; h++) {
    const p = s.uint16(), g = s.uint16();
    let d;
    if (g & so)
      d = s.array("f2dot14", e);
    else {
      const m = g & T1;
      d = n[m] ?? new Array(e).fill(0);
    }
    let x = null, y = null;
    g & ro && (x = s.array("f2dot14", e), y = s.array("f2dot14", e)), f.push({
      variationDataSize: p,
      tupleIndex: g,
      peakTuple: d,
      intermediateStartTuple: x,
      intermediateEndTuple: y,
      hasPrivatePoints: (g & io) !== 0
    });
  }
  s.seek(i);
  let l = null;
  c && (l = $n(s));
  const u = [];
  for (const h of f) {
    const g = s.position + h.variationDataSize;
    let d;
    h.hasPrivatePoints ? d = $n(s) : d = l;
    const x = d === null ? o : d.length, y = x * 2, m = Lc(s, y);
    u.push({
      peakTuple: h.peakTuple,
      intermediateStartTuple: h.intermediateStartTuple,
      intermediateEndTuple: h.intermediateEndTuple,
      pointIndices: d,
      xDeltas: m.slice(0, x),
      yDeltas: m.slice(x)
    }), s.seek(g);
  }
  return u;
}
function M1(t, e) {
  if (!t || t.length === 0) return [];
  const n = t.length, s = t.every(
    (g) => JSON.stringify(g.pointIndices) === JSON.stringify(t[0].pointIndices)
  ) && n > 1, r = [];
  let i = [];
  s && (i = Nn(t[0].pointIndices), r.push(i));
  const a = [];
  for (const g of t) {
    const d = [];
    s || d.push(...Nn(g.pointIndices));
    const x = [...g.xDeltas ?? [], ...g.yDeltas ?? []];
    d.push(...Bc(x)), a.push(d.length), r.push(d);
  }
  const c = [];
  for (const g of r)
    c.push(...g);
  const f = [];
  for (let g = 0; g < n; g++) {
    const d = t[g];
    let x = so;
    s || (x |= io), d.intermediateStartTuple && (x |= ro);
    const y = [];
    y.push(a[g] >> 8 & 255), y.push(a[g] & 255), y.push(x >> 8 & 255), y.push(x & 255);
    for (let m = 0; m < e; m++) {
      const w = Math.round((d.peakTuple[m] ?? 0) * 16384) & 65535;
      y.push(w >> 8 & 255, w & 255);
    }
    if (d.intermediateStartTuple) {
      for (let m = 0; m < e; m++) {
        const w = Math.round((d.intermediateStartTuple[m] ?? 0) * 16384) & 65535;
        y.push(w >> 8 & 255, w & 255);
      }
      for (let m = 0; m < e; m++) {
        const w = Math.round((d.intermediateEndTuple[m] ?? 0) * 16384) & 65535;
        y.push(w >> 8 & 255, w & 255);
      }
    }
    f.push(y);
  }
  const l = [];
  for (const g of f)
    l.push(...g);
  const u = (s ? no : 0) | n & oo, h = 4 + l.length, p = [];
  return p.push(u >> 8 & 255), p.push(u & 255), p.push(h >> 8 & 255), p.push(h & 255), p.push(...l), p.push(...c), p;
}
function L1(t, e, n) {
  if (!t || t.length < 8)
    return { majorVersion: 1, minorVersion: 0, tupleVariations: [] };
  const o = new F(t), s = o.uint16(), r = o.uint16(), i = o.uint16(), a = o.offset16(), c = i & oo, f = (i & no) !== 0;
  if (c === 0)
    return { majorVersion: s, minorVersion: r, tupleVariations: [] };
  const l = [];
  for (let p = 0; p < c; p++) {
    const g = o.uint16(), d = o.uint16();
    let x = null;
    d & so && (x = o.array("f2dot14", e));
    let y = null, m = null;
    d & ro && (y = o.array("f2dot14", e), m = o.array("f2dot14", e)), l.push({
      variationDataSize: g,
      tupleIndex: d,
      peakTuple: x,
      intermediateStartTuple: y,
      intermediateEndTuple: m,
      hasPrivatePoints: (d & io) !== 0
    });
  }
  o.seek(a);
  let u = null;
  f && (u = $n(o));
  const h = [];
  for (const p of l) {
    const d = o.position + p.variationDataSize;
    let x;
    p.hasPrivatePoints ? x = $n(o) : x = u;
    const y = x === null ? n : x.length, m = Lc(o, y);
    h.push({
      peakTuple: p.peakTuple,
      intermediateStartTuple: p.intermediateStartTuple,
      intermediateEndTuple: p.intermediateEndTuple,
      pointIndices: x,
      deltas: m
    }), o.seek(d);
  }
  return { majorVersion: s, minorVersion: r, tupleVariations: h };
}
function B1(t, e) {
  const n = t.majorVersion ?? 1, o = t.minorVersion ?? 0, s = t.tupleVariations ?? [], r = s.length;
  if (r === 0) {
    const x = new v(8);
    return x.uint16(n), x.uint16(o), x.uint16(0), x.offset16(8), x.toArray();
  }
  const a = s.every(
    (x) => JSON.stringify(x.pointIndices) === JSON.stringify(s[0].pointIndices)
  ) && r > 1, c = [];
  a && c.push(
    Nn(s[0].pointIndices)
  );
  const f = [];
  for (const x of s) {
    const y = [];
    a || y.push(...Nn(x.pointIndices)), y.push(...Bc(x.deltas ?? [])), f.push(y.length), c.push(y);
  }
  const l = [];
  for (const x of c)
    l.push(...x);
  const u = [];
  for (let x = 0; x < r; x++) {
    const y = s[x];
    let m = so;
    a || (m |= io), y.intermediateStartTuple && (m |= ro), u.push(f[x] >> 8 & 255), u.push(f[x] & 255), u.push(m >> 8 & 255), u.push(m & 255);
    for (let w = 0; w < e; w++) {
      const _ = Math.round((y.peakTuple[w] ?? 0) * 16384) & 65535;
      u.push(_ >> 8 & 255, _ & 255);
    }
    if (y.intermediateStartTuple) {
      for (let w = 0; w < e; w++) {
        const _ = Math.round((y.intermediateStartTuple[w] ?? 0) * 16384) & 65535;
        u.push(_ >> 8 & 255, _ & 255);
      }
      for (let w = 0; w < e; w++) {
        const _ = Math.round((y.intermediateEndTuple[w] ?? 0) * 16384) & 65535;
        u.push(_ >> 8 & 255, _ & 255);
      }
    }
  }
  const h = (a ? no : 0) | r & oo, p = 8 + u.length, g = p + l.length, d = new v(g);
  return d.uint16(n), d.uint16(o), d.uint16(h), d.offset16(p), d.rawBytes(u), d.rawBytes(l), d.toArray();
}
function V1(t, e = {}) {
  const n = e.fvar?.axes?.length ?? 0, o = e["cvt "]?.values?.length ?? 0;
  return L1(t, n, o);
}
function $1(t) {
  const e = t.tupleVariations?.[0]?.peakTuple?.length ?? 0;
  return B1(t, e);
}
function N1(t) {
  const e = new F(t), n = t.length >>> 1;
  return { values: e.array("fword", n) };
}
function G1(t) {
  const e = t.values, n = new v(e.length * 2);
  return n.array("fword", e), n.toArray();
}
function P1(t) {
  return { instructions: Array.from(t) };
}
function U1(t) {
  return Array.from(t.instructions);
}
function z1(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = [];
  for (let r = 0; r < o; r++)
    s.push({
      rangeMaxPPEM: e.uint16(),
      rangeGaspBehavior: e.uint16()
    });
  return { version: n, gaspRanges: s };
}
function H1(t) {
  const { version: e, gaspRanges: n } = t, o = new v(4 + n.length * 4);
  o.uint16(e), o.uint16(n.length);
  for (const s of n)
    o.uint16(s.rangeMaxPPEM), o.uint16(s.rangeGaspBehavior);
  return o.toArray();
}
const Vc = 1, $c = 2, Nc = 4, Gc = 8, Gn = 16, Pn = 32, Pc = 64, Je = 1, Un = 2, Uc = 4, Ls = 8, ns = 32, Bs = 64, Vs = 128, Qe = 256, zc = 512, Hc = 1024, Wc = 2048, jc = 4096;
function W1(t, e) {
  const n = e.loca.offsets, o = e.maxp.numGlyphs, s = new F(t), r = [];
  for (let i = 0; i < o; i++) {
    const a = n[i], c = n[i + 1];
    if (a === c) {
      r.push(null);
      continue;
    }
    s.seek(a);
    const f = s.int16(), l = s.int16(), u = s.int16(), h = s.int16(), p = s.int16();
    f >= 0 ? r.push(
      j1(s, f, l, u, h, p)
    ) : r.push(Y1(s, l, u, h, p));
  }
  return { glyphs: r };
}
function j1(t, e, n, o, s, r) {
  const i = t.array("uint16", e), a = e > 0 ? i[e - 1] + 1 : 0, c = t.uint16(), f = t.bytes(c), l = [];
  for (; l.length < a; ) {
    const m = t.uint8();
    if (l.push(m), m & Gc) {
      const w = t.uint8();
      for (let _ = 0; _ < w; _++)
        l.push(m);
    }
  }
  const u = new Array(a);
  let h = 0;
  for (let m = 0; m < a; m++) {
    const w = l[m];
    if (w & $c) {
      const _ = t.uint8();
      h += w & Gn ? _ : -_;
    } else w & Gn || (h += t.int16());
    u[m] = h;
  }
  const p = new Array(a);
  let g = 0;
  for (let m = 0; m < a; m++) {
    const w = l[m];
    if (w & Nc) {
      const _ = t.uint8();
      g += w & Pn ? _ : -_;
    } else w & Pn || (g += t.int16());
    p[m] = g;
  }
  const d = a > 0 && (l[0] & Pc) !== 0, x = [];
  let y = 0;
  for (let m = 0; m < e; m++) {
    const w = i[m], _ = [];
    for (; y <= w; )
      _.push({
        x: u[y],
        y: p[y],
        onCurve: (l[y] & Vc) !== 0
      }), y++;
    x.push(_);
  }
  return {
    type: "simple",
    xMin: n,
    yMin: o,
    xMax: s,
    yMax: r,
    contours: x,
    instructions: f,
    overlapSimple: d
  };
}
function Y1(t, e, n, o, s) {
  const r = [];
  let i, a = !1;
  do {
    i = t.uint16();
    const f = t.uint16();
    let l, u;
    i & Je ? i & Un ? (l = t.int16(), u = t.int16()) : (l = t.uint16(), u = t.uint16()) : i & Un ? (l = t.int8(), u = t.int8()) : (l = t.uint8(), u = t.uint8());
    const h = {
      glyphIndex: f,
      flags: Z1(i),
      argument1: l,
      argument2: u
    };
    i & Ls ? h.transform = { scale: t.f2dot14() } : i & Bs ? h.transform = {
      xScale: t.f2dot14(),
      yScale: t.f2dot14()
    } : i & Vs && (h.transform = {
      xScale: t.f2dot14(),
      scale01: t.f2dot14(),
      scale10: t.f2dot14(),
      yScale: t.f2dot14()
    }), r.push(h), i & Qe && (a = !0);
  } while (i & ns);
  let c = [];
  if (a) {
    const f = t.uint16();
    c = t.bytes(f);
  }
  return {
    type: "composite",
    xMin: e,
    yMin: n,
    xMax: o,
    yMax: s,
    components: r,
    instructions: c
  };
}
function Z1(t) {
  const e = {};
  return t & Je && (e.argsAreWords = !0), t & Un && (e.argsAreXYValues = !0), t & Uc && (e.roundXYToGrid = !0), t & Ls && (e.weHaveAScale = !0), t & Bs && (e.weHaveAnXAndYScale = !0), t & Vs && (e.weHaveATwoByTwo = !0), t & Qe && (e.weHaveInstructions = !0), t & zc && (e.useMyMetrics = !0), t & Hc && (e.overlapCompound = !0), t & Wc && (e.scaledComponentOffset = !0), t & jc && (e.unscaledComponentOffset = !0), e;
}
function Yc(t) {
  const { glyphs: e } = t, n = [];
  for (const r of e) {
    if (r === null) {
      n.push([]);
      continue;
    }
    r.type === "simple" ? n.push(q1(r)) : n.push(J1(r));
  }
  const o = [], s = [];
  for (const r of n) {
    s.push(o.length);
    for (let i = 0; i < r.length; i++)
      o.push(r[i]);
    r.length % 2 !== 0 && o.push(0);
  }
  return s.push(o.length), { bytes: o, offsets: s };
}
function X1(t) {
  return Yc(t).bytes;
}
function q1(t) {
  const { contours: e, instructions: n, xMin: o, yMin: s, xMax: r, yMax: i, overlapSimple: a } = t, c = e.length, f = [], l = [];
  for (const I of e) {
    for (const E of I)
      f.push(E);
    l.push(f.length - 1);
  }
  const u = f.length, h = f.map((I) => I.x), p = f.map((I) => I.y), g = new Array(u), d = new Array(u);
  for (let I = 0; I < u; I++)
    g[I] = I === 0 ? h[I] : h[I] - h[I - 1], d[I] = I === 0 ? p[I] : p[I] - p[I - 1];
  const x = [], y = [], m = [];
  for (let I = 0; I < u; I++) {
    let E = 0;
    f[I].onCurve && (E |= Vc);
    const T = g[I], D = d[I];
    T === 0 ? E |= Gn : T >= -255 && T <= 255 ? (E |= $c, T > 0 ? (E |= Gn, y.push(T)) : y.push(-T)) : y.push(T >> 8 & 255, T & 255), D === 0 ? E |= Pn : D >= -255 && D <= 255 ? (E |= Nc, D > 0 ? (E |= Pn, m.push(D)) : m.push(-D)) : m.push(D >> 8 & 255, D & 255), I === 0 && a && (E |= Pc), x.push(E);
  }
  const w = K1(x), _ = 10, S = c * 2, b = 2, A = n.length, k = _ + S + b + A + w.length + y.length + m.length, O = new v(k);
  return O.int16(c), O.int16(o), O.int16(s), O.int16(r), O.int16(i), O.array("uint16", l), O.uint16(n.length), O.rawBytes(n), O.rawBytes(w), O.rawBytes(y), O.rawBytes(m), O.toArray();
}
function K1(t) {
  const e = [];
  let n = 0;
  for (; n < t.length; ) {
    const o = t[n];
    let s = 0;
    for (; n + 1 + s < t.length && t[n + 1 + s] === o && s < 255; )
      s++;
    s > 0 ? (e.push(o | Gc, s), n += 1 + s) : (e.push(o), n++);
  }
  return e;
}
function J1(t) {
  const { components: e, instructions: n, xMin: o, yMin: s, xMax: r, yMax: i } = t;
  let a = 10;
  for (let f = 0; f < e.length; f++) {
    const l = e[f];
    a += 4;
    const u = l.flags.argsAreWords || Hr(l.argument1, l.argument2, l.flags.argsAreXYValues);
    a += u ? 4 : 2, l.transform && ("scale" in l.transform ? a += 2 : "scale01" in l.transform ? a += 8 : "xScale" in l.transform && (a += 4));
  }
  n && n.length > 0 && (a += 2 + n.length);
  const c = new v(a);
  c.int16(-1), c.int16(o), c.int16(s), c.int16(r), c.int16(i);
  for (let f = 0; f < e.length; f++) {
    const l = e[f], u = f === e.length - 1;
    let h = Q1(l.flags);
    const p = l.flags.argsAreWords || Hr(l.argument1, l.argument2, l.flags.argsAreXYValues);
    p ? h |= Je : h &= ~Je, u ? h &= ~ns : h |= ns, u && n && n.length > 0 ? h |= Qe : u && (h &= ~Qe), c.uint16(h), c.uint16(l.glyphIndex), p ? l.flags.argsAreXYValues ? (c.int16(l.argument1), c.int16(l.argument2)) : (c.uint16(l.argument1), c.uint16(l.argument2)) : l.flags.argsAreXYValues ? (c.int8(l.argument1), c.int8(l.argument2)) : (c.uint8(l.argument1), c.uint8(l.argument2)), l.transform && ("scale" in l.transform ? c.f2dot14(l.transform.scale) : "scale01" in l.transform ? (c.f2dot14(l.transform.xScale), c.f2dot14(l.transform.scale01), c.f2dot14(l.transform.scale10), c.f2dot14(l.transform.yScale)) : "xScale" in l.transform && (c.f2dot14(l.transform.xScale), c.f2dot14(l.transform.yScale)));
  }
  return n && n.length > 0 && (c.uint16(n.length), c.rawBytes(n)), c.toArray();
}
function Hr(t, e, n) {
  return n ? t < -128 || t > 127 || e < -128 || e > 127 : t > 255 || e > 255;
}
function Q1(t) {
  let e = 0;
  return t.argsAreWords && (e |= Je), t.argsAreXYValues && (e |= Un), t.roundXYToGrid && (e |= Uc), t.weHaveAScale && (e |= Ls), t.weHaveAnXAndYScale && (e |= Bs), t.weHaveATwoByTwo && (e |= Vs), t.weHaveInstructions && (e |= Qe), t.useMyMetrics && (e |= zc), t.overlapCompound && (e |= Hc), t.scaledComponentOffset && (e |= Wc), t.unscaledComponentOffset && (e |= jc), e;
}
const tm = 20, os = 1;
function em(t, e = {}) {
  const n = new F(t), o = n.uint16(), s = n.uint16(), r = n.uint16(), i = n.uint16(), a = n.offset32(), c = n.uint16(), f = n.uint16(), l = n.offset32(), u = (f & os) !== 0, h = c + 1, p = [];
  for (let x = 0; x < h; x++)
    u ? p.push(n.uint32()) : p.push(n.uint16() * 2);
  const g = [];
  if (i > 0 && a > 0) {
    n.seek(a);
    for (let x = 0; x < i; x++) {
      const y = [];
      for (let m = 0; m < r; m++)
        y.push(n.f2dot14());
      g.push(y);
    }
  }
  const d = [];
  for (let x = 0; x < c; x++) {
    const y = p[x], m = p[x + 1], w = Math.max(0, m - y);
    if (w === 0) {
      d.push([]);
      continue;
    }
    const _ = l + y, S = t.slice(_, _ + w), b = nm(e, x);
    d.push(
      F1(S, r, g, b)
    );
  }
  return {
    majorVersion: o,
    minorVersion: s,
    axisCount: r,
    flags: f,
    sharedTuples: g,
    glyphVariationData: d
  };
}
function nm(t, e) {
  const n = t.glyf?.glyphs?.[e];
  if (!n) return 0;
  if (n.type === "simple" && n.contours) {
    let o = 0;
    for (const s of n.contours)
      o += s.length;
    return o + 4;
  }
  return n.type === "composite" && n.components ? n.components.length + 4 : 0;
}
function om(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.axisCount ?? 0, s = t.glyphVariationData ?? [], r = s.length, i = s.map((S) => Array.isArray(S) && (S.length === 0 || typeof S[0] == "number") ? S : Array.isArray(S) ? M1(S, o) : []), a = t.sharedTuples ?? sm(s, o), c = a.length, f = c * o * 2, l = [0];
  let u = 0;
  for (const S of i)
    u += S.length, l.push(u);
  const h = l.every(
    (S) => S % 2 === 0 && S / 2 <= 65535
  ), p = h ? 2 : 4, g = (r + 1) * p, d = tm + g, x = d + f, y = x + u, m = t.flags ?? 0, w = h ? m & ~os : m | os, _ = new v(y);
  _.uint16(e), _.uint16(n), _.uint16(o), _.uint16(c), _.offset32(d), _.uint16(r), _.uint16(w), _.offset32(x);
  for (const S of l)
    h ? _.uint16(S / 2) : _.uint32(S);
  for (const S of a)
    for (let b = 0; b < o; b++)
      _.f2dot14(S[b] ?? 0);
  for (const S of i)
    _.rawBytes(S);
  return _.toArray();
}
function sm(t, e) {
  if (e === 0) return [];
  const n = /* @__PURE__ */ new Set(), o = [];
  for (const s of t)
    if (Array.isArray(s))
      for (const r of s) {
        if (!r || !r.peakTuple) continue;
        const i = r.peakTuple.map((a) => Math.round((a ?? 0) * 16384)).join(",");
        n.has(i) || (n.add(i), o.push(r.peakTuple));
      }
  return o;
}
function rm(t, e) {
  const n = e.head.indexToLocFormat, s = e.maxp.numGlyphs + 1, r = new F(t), i = [];
  if (n === 0)
    for (let a = 0; a < s; a++)
      i.push(r.uint16() * 2);
  else
    for (let a = 0; a < s; a++)
      i.push(r.uint32());
  return { offsets: i };
}
function Zc(t) {
  const { offsets: e } = t;
  if (e.every((s) => s % 2 === 0 && s / 2 <= 65535)) {
    const s = new v(e.length * 2);
    for (const r of e)
      s.uint16(r / 2);
    return s.toArray();
  }
  const o = new v(e.length * 4);
  for (const s of e)
    o.uint32(s);
  return o.toArray();
}
function im(t) {
  return { instructions: Array.from(t) };
}
function am(t) {
  return Array.from(t.instructions);
}
const cm = 4, Wr = 0, jr = 1, fm = 2;
function ke(t) {
  let e = t.length;
  for (; --e >= 0; )
    t[e] = 0;
}
const lm = 0, Xc = 1, um = 2, hm = 3, gm = 258, $s = 29, un = 256, tn = un + 1 + $s, ye = 30, Ns = 19, qc = 2 * tn + 1, Zt = 15, Io = 16, pm = 7, Gs = 256, Kc = 16, Jc = 17, Qc = 18, ss = (
  /* extra bits for each length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0])
), Fn = (
  /* extra bits for each distance code */
  new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13])
), dm = (
  /* extra bits for each bit length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7])
), tf = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), mm = 512, It = new Array((tn + 2) * 2);
ke(It);
const je = new Array(ye * 2);
ke(je);
const en = new Array(mm);
ke(en);
const nn = new Array(gm - hm + 1);
ke(nn);
const Ps = new Array($s);
ke(Ps);
const zn = new Array(ye);
ke(zn);
function Oo(t, e, n, o, s) {
  this.static_tree = t, this.extra_bits = e, this.extra_base = n, this.elems = o, this.max_length = s, this.has_stree = t && t.length;
}
let ef, nf, of;
function ko(t, e) {
  this.dyn_tree = t, this.max_code = 0, this.stat_desc = e;
}
const sf = (t) => t < 256 ? en[t] : en[256 + (t >>> 7)], on = (t, e) => {
  t.pending_buf[t.pending++] = e & 255, t.pending_buf[t.pending++] = e >>> 8 & 255;
}, nt = (t, e, n) => {
  t.bi_valid > Io - n ? (t.bi_buf |= e << t.bi_valid & 65535, on(t, t.bi_buf), t.bi_buf = e >> Io - t.bi_valid, t.bi_valid += n - Io) : (t.bi_buf |= e << t.bi_valid & 65535, t.bi_valid += n);
}, dt = (t, e, n) => {
  nt(
    t,
    n[e * 2],
    n[e * 2 + 1]
    /*.Len*/
  );
}, rf = (t, e) => {
  let n = 0;
  do
    n |= t & 1, t >>>= 1, n <<= 1;
  while (--e > 0);
  return n >>> 1;
}, ym = (t) => {
  t.bi_valid === 16 ? (on(t, t.bi_buf), t.bi_buf = 0, t.bi_valid = 0) : t.bi_valid >= 8 && (t.pending_buf[t.pending++] = t.bi_buf & 255, t.bi_buf >>= 8, t.bi_valid -= 8);
}, xm = (t, e) => {
  const n = e.dyn_tree, o = e.max_code, s = e.stat_desc.static_tree, r = e.stat_desc.has_stree, i = e.stat_desc.extra_bits, a = e.stat_desc.extra_base, c = e.stat_desc.max_length;
  let f, l, u, h, p, g, d = 0;
  for (h = 0; h <= Zt; h++)
    t.bl_count[h] = 0;
  for (n[t.heap[t.heap_max] * 2 + 1] = 0, f = t.heap_max + 1; f < qc; f++)
    l = t.heap[f], h = n[n[l * 2 + 1] * 2 + 1] + 1, h > c && (h = c, d++), n[l * 2 + 1] = h, !(l > o) && (t.bl_count[h]++, p = 0, l >= a && (p = i[l - a]), g = n[l * 2], t.opt_len += g * (h + p), r && (t.static_len += g * (s[l * 2 + 1] + p)));
  if (d !== 0) {
    do {
      for (h = c - 1; t.bl_count[h] === 0; )
        h--;
      t.bl_count[h]--, t.bl_count[h + 1] += 2, t.bl_count[c]--, d -= 2;
    } while (d > 0);
    for (h = c; h !== 0; h--)
      for (l = t.bl_count[h]; l !== 0; )
        u = t.heap[--f], !(u > o) && (n[u * 2 + 1] !== h && (t.opt_len += (h - n[u * 2 + 1]) * n[u * 2], n[u * 2 + 1] = h), l--);
  }
}, af = (t, e, n) => {
  const o = new Array(Zt + 1);
  let s = 0, r, i;
  for (r = 1; r <= Zt; r++)
    s = s + n[r - 1] << 1, o[r] = s;
  for (i = 0; i <= e; i++) {
    let a = t[i * 2 + 1];
    a !== 0 && (t[i * 2] = rf(o[a]++, a));
  }
}, Sm = () => {
  let t, e, n, o, s;
  const r = new Array(Zt + 1);
  for (n = 0, o = 0; o < $s - 1; o++)
    for (Ps[o] = n, t = 0; t < 1 << ss[o]; t++)
      nn[n++] = o;
  for (nn[n - 1] = o, s = 0, o = 0; o < 16; o++)
    for (zn[o] = s, t = 0; t < 1 << Fn[o]; t++)
      en[s++] = o;
  for (s >>= 7; o < ye; o++)
    for (zn[o] = s << 7, t = 0; t < 1 << Fn[o] - 7; t++)
      en[256 + s++] = o;
  for (e = 0; e <= Zt; e++)
    r[e] = 0;
  for (t = 0; t <= 143; )
    It[t * 2 + 1] = 8, t++, r[8]++;
  for (; t <= 255; )
    It[t * 2 + 1] = 9, t++, r[9]++;
  for (; t <= 279; )
    It[t * 2 + 1] = 7, t++, r[7]++;
  for (; t <= 287; )
    It[t * 2 + 1] = 8, t++, r[8]++;
  for (af(It, tn + 1, r), t = 0; t < ye; t++)
    je[t * 2 + 1] = 5, je[t * 2] = rf(t, 5);
  ef = new Oo(It, ss, un + 1, tn, Zt), nf = new Oo(je, Fn, 0, ye, Zt), of = new Oo(new Array(0), dm, 0, Ns, pm);
}, cf = (t) => {
  let e;
  for (e = 0; e < tn; e++)
    t.dyn_ltree[e * 2] = 0;
  for (e = 0; e < ye; e++)
    t.dyn_dtree[e * 2] = 0;
  for (e = 0; e < Ns; e++)
    t.bl_tree[e * 2] = 0;
  t.dyn_ltree[Gs * 2] = 1, t.opt_len = t.static_len = 0, t.sym_next = t.matches = 0;
}, ff = (t) => {
  t.bi_valid > 8 ? on(t, t.bi_buf) : t.bi_valid > 0 && (t.pending_buf[t.pending++] = t.bi_buf), t.bi_buf = 0, t.bi_valid = 0;
}, Yr = (t, e, n, o) => {
  const s = e * 2, r = n * 2;
  return t[s] < t[r] || t[s] === t[r] && o[e] <= o[n];
}, Eo = (t, e, n) => {
  const o = t.heap[n];
  let s = n << 1;
  for (; s <= t.heap_len && (s < t.heap_len && Yr(e, t.heap[s + 1], t.heap[s], t.depth) && s++, !Yr(e, o, t.heap[s], t.depth)); )
    t.heap[n] = t.heap[s], n = s, s <<= 1;
  t.heap[n] = o;
}, Zr = (t, e, n) => {
  let o, s, r = 0, i, a;
  if (t.sym_next !== 0)
    do
      o = t.pending_buf[t.sym_buf + r++] & 255, o += (t.pending_buf[t.sym_buf + r++] & 255) << 8, s = t.pending_buf[t.sym_buf + r++], o === 0 ? dt(t, s, e) : (i = nn[s], dt(t, i + un + 1, e), a = ss[i], a !== 0 && (s -= Ps[i], nt(t, s, a)), o--, i = sf(o), dt(t, i, n), a = Fn[i], a !== 0 && (o -= zn[i], nt(t, o, a)));
    while (r < t.sym_next);
  dt(t, Gs, e);
}, rs = (t, e) => {
  const n = e.dyn_tree, o = e.stat_desc.static_tree, s = e.stat_desc.has_stree, r = e.stat_desc.elems;
  let i, a, c = -1, f;
  for (t.heap_len = 0, t.heap_max = qc, i = 0; i < r; i++)
    n[i * 2] !== 0 ? (t.heap[++t.heap_len] = c = i, t.depth[i] = 0) : n[i * 2 + 1] = 0;
  for (; t.heap_len < 2; )
    f = t.heap[++t.heap_len] = c < 2 ? ++c : 0, n[f * 2] = 1, t.depth[f] = 0, t.opt_len--, s && (t.static_len -= o[f * 2 + 1]);
  for (e.max_code = c, i = t.heap_len >> 1; i >= 1; i--)
    Eo(t, n, i);
  f = r;
  do
    i = t.heap[
      1
      /*SMALLEST*/
    ], t.heap[
      1
      /*SMALLEST*/
    ] = t.heap[t.heap_len--], Eo(
      t,
      n,
      1
      /*SMALLEST*/
    ), a = t.heap[
      1
      /*SMALLEST*/
    ], t.heap[--t.heap_max] = i, t.heap[--t.heap_max] = a, n[f * 2] = n[i * 2] + n[a * 2], t.depth[f] = (t.depth[i] >= t.depth[a] ? t.depth[i] : t.depth[a]) + 1, n[i * 2 + 1] = n[a * 2 + 1] = f, t.heap[
      1
      /*SMALLEST*/
    ] = f++, Eo(
      t,
      n,
      1
      /*SMALLEST*/
    );
  while (t.heap_len >= 2);
  t.heap[--t.heap_max] = t.heap[
    1
    /*SMALLEST*/
  ], xm(t, e), af(n, c, t.bl_count);
}, Xr = (t, e, n) => {
  let o, s = -1, r, i = e[1], a = 0, c = 7, f = 4;
  for (i === 0 && (c = 138, f = 3), e[(n + 1) * 2 + 1] = 65535, o = 0; o <= n; o++)
    r = i, i = e[(o + 1) * 2 + 1], !(++a < c && r === i) && (a < f ? t.bl_tree[r * 2] += a : r !== 0 ? (r !== s && t.bl_tree[r * 2]++, t.bl_tree[Kc * 2]++) : a <= 10 ? t.bl_tree[Jc * 2]++ : t.bl_tree[Qc * 2]++, a = 0, s = r, i === 0 ? (c = 138, f = 3) : r === i ? (c = 6, f = 3) : (c = 7, f = 4));
}, qr = (t, e, n) => {
  let o, s = -1, r, i = e[1], a = 0, c = 7, f = 4;
  for (i === 0 && (c = 138, f = 3), o = 0; o <= n; o++)
    if (r = i, i = e[(o + 1) * 2 + 1], !(++a < c && r === i)) {
      if (a < f)
        do
          dt(t, r, t.bl_tree);
        while (--a !== 0);
      else r !== 0 ? (r !== s && (dt(t, r, t.bl_tree), a--), dt(t, Kc, t.bl_tree), nt(t, a - 3, 2)) : a <= 10 ? (dt(t, Jc, t.bl_tree), nt(t, a - 3, 3)) : (dt(t, Qc, t.bl_tree), nt(t, a - 11, 7));
      a = 0, s = r, i === 0 ? (c = 138, f = 3) : r === i ? (c = 6, f = 3) : (c = 7, f = 4);
    }
}, _m = (t) => {
  let e;
  for (Xr(t, t.dyn_ltree, t.l_desc.max_code), Xr(t, t.dyn_dtree, t.d_desc.max_code), rs(t, t.bl_desc), e = Ns - 1; e >= 3 && t.bl_tree[tf[e] * 2 + 1] === 0; e--)
    ;
  return t.opt_len += 3 * (e + 1) + 5 + 5 + 4, e;
}, wm = (t, e, n, o) => {
  let s;
  for (nt(t, e - 257, 5), nt(t, n - 1, 5), nt(t, o - 4, 4), s = 0; s < o; s++)
    nt(t, t.bl_tree[tf[s] * 2 + 1], 3);
  qr(t, t.dyn_ltree, e - 1), qr(t, t.dyn_dtree, n - 1);
}, bm = (t) => {
  let e = 4093624447, n;
  for (n = 0; n <= 31; n++, e >>>= 1)
    if (e & 1 && t.dyn_ltree[n * 2] !== 0)
      return Wr;
  if (t.dyn_ltree[18] !== 0 || t.dyn_ltree[20] !== 0 || t.dyn_ltree[26] !== 0)
    return jr;
  for (n = 32; n < un; n++)
    if (t.dyn_ltree[n * 2] !== 0)
      return jr;
  return Wr;
};
let Kr = !1;
const Am = (t) => {
  Kr || (Sm(), Kr = !0), t.l_desc = new ko(t.dyn_ltree, ef), t.d_desc = new ko(t.dyn_dtree, nf), t.bl_desc = new ko(t.bl_tree, of), t.bi_buf = 0, t.bi_valid = 0, cf(t);
}, lf = (t, e, n, o) => {
  nt(t, (lm << 1) + (o ? 1 : 0), 3), ff(t), on(t, n), on(t, ~n), n && t.pending_buf.set(t.window.subarray(e, e + n), t.pending), t.pending += n;
}, Cm = (t) => {
  nt(t, Xc << 1, 3), dt(t, Gs, It), ym(t);
}, vm = (t, e, n, o) => {
  let s, r, i = 0;
  t.level > 0 ? (t.strm.data_type === fm && (t.strm.data_type = bm(t)), rs(t, t.l_desc), rs(t, t.d_desc), i = _m(t), s = t.opt_len + 3 + 7 >>> 3, r = t.static_len + 3 + 7 >>> 3, r <= s && (s = r)) : s = r = n + 5, n + 4 <= s && e !== -1 ? lf(t, e, n, o) : t.strategy === cm || r === s ? (nt(t, (Xc << 1) + (o ? 1 : 0), 3), Zr(t, It, je)) : (nt(t, (um << 1) + (o ? 1 : 0), 3), wm(t, t.l_desc.max_code + 1, t.d_desc.max_code + 1, i + 1), Zr(t, t.dyn_ltree, t.dyn_dtree)), cf(t), o && ff(t);
}, Im = (t, e, n) => (t.pending_buf[t.sym_buf + t.sym_next++] = e, t.pending_buf[t.sym_buf + t.sym_next++] = e >> 8, t.pending_buf[t.sym_buf + t.sym_next++] = n, e === 0 ? t.dyn_ltree[n * 2]++ : (t.matches++, e--, t.dyn_ltree[(nn[n] + un + 1) * 2]++, t.dyn_dtree[sf(e) * 2]++), t.sym_next === t.sym_end);
var Om = Am, km = lf, Em = vm, Tm = Im, Dm = Cm, Rm = {
  _tr_init: Om,
  _tr_stored_block: km,
  _tr_flush_block: Em,
  _tr_tally: Tm,
  _tr_align: Dm
};
const Fm = (t, e, n, o) => {
  let s = t & 65535 | 0, r = t >>> 16 & 65535 | 0, i = 0;
  for (; n !== 0; ) {
    i = n > 2e3 ? 2e3 : n, n -= i;
    do
      s = s + e[o++] | 0, r = r + s | 0;
    while (--i);
    s %= 65521, r %= 65521;
  }
  return s | r << 16 | 0;
};
var sn = Fm;
const Mm = () => {
  let t, e = [];
  for (var n = 0; n < 256; n++) {
    t = n;
    for (var o = 0; o < 8; o++)
      t = t & 1 ? 3988292384 ^ t >>> 1 : t >>> 1;
    e[n] = t;
  }
  return e;
}, Lm = new Uint32Array(Mm()), Bm = (t, e, n, o) => {
  const s = Lm, r = o + n;
  t ^= -1;
  for (let i = o; i < r; i++)
    t = t >>> 8 ^ s[(t ^ e[i]) & 255];
  return t ^ -1;
};
var Y = Bm, Jt = {
  2: "need dictionary",
  /* Z_NEED_DICT       2  */
  1: "stream end",
  /* Z_STREAM_END      1  */
  0: "",
  /* Z_OK              0  */
  "-1": "file error",
  /* Z_ERRNO         (-1) */
  "-2": "stream error",
  /* Z_STREAM_ERROR  (-2) */
  "-3": "data error",
  /* Z_DATA_ERROR    (-3) */
  "-4": "insufficient memory",
  /* Z_MEM_ERROR     (-4) */
  "-5": "buffer error",
  /* Z_BUF_ERROR     (-5) */
  "-6": "incompatible version"
  /* Z_VERSION_ERROR (-6) */
}, ao = {
  /* Allowed flush values; see deflate() and inflate() below for details */
  Z_NO_FLUSH: 0,
  Z_PARTIAL_FLUSH: 1,
  Z_SYNC_FLUSH: 2,
  Z_FULL_FLUSH: 3,
  Z_FINISH: 4,
  Z_BLOCK: 5,
  Z_TREES: 6,
  /* Return codes for the compression/decompression functions. Negative values
  * are errors, positive values are used for special but normal events.
  */
  Z_OK: 0,
  Z_STREAM_END: 1,
  Z_NEED_DICT: 2,
  Z_STREAM_ERROR: -2,
  Z_DATA_ERROR: -3,
  Z_MEM_ERROR: -4,
  Z_BUF_ERROR: -5,
  Z_DEFAULT_COMPRESSION: -1,
  Z_FILTERED: 1,
  Z_HUFFMAN_ONLY: 2,
  Z_RLE: 3,
  Z_FIXED: 4,
  Z_DEFAULT_STRATEGY: 0,
  //Z_ASCII:                1, // = Z_TEXT (deprecated)
  Z_UNKNOWN: 2,
  /* The deflate compression method */
  Z_DEFLATED: 8
  //Z_NULL:                 null // Use -1 or null inline, depending on var type
};
const { _tr_init: Vm, _tr_stored_block: is, _tr_flush_block: $m, _tr_tally: Nt, _tr_align: Nm } = Rm, {
  Z_NO_FLUSH: Gt,
  Z_PARTIAL_FLUSH: Gm,
  Z_FULL_FLUSH: Pm,
  Z_FINISH: ft,
  Z_BLOCK: Jr,
  Z_OK: X,
  Z_STREAM_END: Qr,
  Z_STREAM_ERROR: yt,
  Z_DATA_ERROR: Um,
  Z_BUF_ERROR: To,
  Z_DEFAULT_COMPRESSION: zm,
  Z_FILTERED: Hm,
  Z_HUFFMAN_ONLY: wn,
  Z_RLE: Wm,
  Z_FIXED: jm,
  Z_DEFAULT_STRATEGY: Ym,
  Z_UNKNOWN: Zm,
  Z_DEFLATED: co
} = ao, Xm = 9, qm = 15, Km = 8, Jm = 29, Qm = 256, as = Qm + 1 + Jm, ty = 30, ey = 19, ny = 2 * as + 1, oy = 15, B = 3, Bt = 258, xt = Bt + B + 1, sy = 32, ve = 42, Us = 57, cs = 69, fs = 73, ls = 91, us = 103, Xt = 113, Ue = 666, tt = 1, Ee = 2, Qt = 3, Te = 4, ry = 3, qt = (t, e) => (t.msg = Jt[e], e), ti = (t) => t * 2 - (t > 4 ? 9 : 0), Rt = (t) => {
  let e = t.length;
  for (; --e >= 0; )
    t[e] = 0;
}, iy = (t) => {
  let e, n, o, s = t.w_size;
  e = t.hash_size, o = e;
  do
    n = t.head[--o], t.head[o] = n >= s ? n - s : 0;
  while (--e);
  e = s, o = e;
  do
    n = t.prev[--o], t.prev[o] = n >= s ? n - s : 0;
  while (--e);
};
let zs = (t, e, n) => (e << t.hash_shift ^ n) & t.hash_mask;
const te = (t, e) => {
  let n;
  if (t.legacy_hash)
    n = t.ins_h = zs(t, t.ins_h, t.window[e + B - 1]);
  else {
    const s = t.window, r = s[e] | s[e + 1] << 8 | s[e + 2] << 16 | s[e + 3] << 24;
    n = t.ins_h = Math.imul(r, 66521) + 66521 >>> 16 & t.hash_mask;
  }
  const o = t.prev[e & t.w_mask] = t.head[n];
  return t.head[n] = e, o;
}, st = (t) => {
  const e = t.state;
  let n = e.pending;
  n > t.avail_out && (n = t.avail_out), n !== 0 && (t.output.set(e.pending_buf.subarray(e.pending_out, e.pending_out + n), t.next_out), t.next_out += n, e.pending_out += n, t.total_out += n, t.avail_out -= n, e.pending -= n, e.pending === 0 && (e.pending_out = 0));
}, it = (t, e) => {
  $m(t, t.block_start >= 0 ? t.block_start : -1, t.strstart - t.block_start, e), t.block_start = t.strstart, st(t.strm);
}, V = (t, e) => {
  t.pending_buf[t.pending++] = e;
}, Be = (t, e) => {
  t.pending_buf[t.pending++] = e >>> 8 & 255, t.pending_buf[t.pending++] = e & 255;
}, hs = (t, e, n, o) => {
  let s = t.avail_in;
  return s > o && (s = o), s === 0 ? 0 : (t.avail_in -= s, e.set(t.input.subarray(t.next_in, t.next_in + s), n), t.state.wrap === 1 ? t.adler = sn(t.adler, e, s, n) : t.state.wrap === 2 && (t.adler = Y(t.adler, e, s, n)), t.next_in += s, t.total_in += s, s);
}, uf = (t, e) => {
  let n = t.max_chain_length, o = t.strstart, s, r, i = t.prev_length, a = t.nice_match;
  const c = t.strstart > t.w_size - xt ? t.strstart - (t.w_size - xt) : 0, f = t.window, l = t.w_mask, u = t.prev, h = t.strstart + Bt;
  let p = f[o + i - 1], g = f[o + i];
  t.prev_length >= t.good_match && (n >>= 2), a > t.lookahead && (a = t.lookahead);
  do
    if (s = e, !(f[s + i] !== g || f[s + i - 1] !== p || f[s] !== f[o] || f[++s] !== f[o + 1])) {
      o += 2, s++;
      do
        ;
      while (f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && o < h);
      if (r = Bt - (h - o), o = h - Bt, r > i) {
        if (t.match_start = e, i = r, r >= a)
          break;
        p = f[o + i - 1], g = f[o + i];
      }
    }
  while ((e = u[e & l]) > c && --n !== 0);
  return i <= t.lookahead ? i : t.lookahead;
}, Ie = (t) => {
  const e = t.w_size;
  let n, o, s;
  do {
    if (o = t.window_size - t.lookahead - t.strstart, t.strstart >= e + (e - xt) && (t.window.set(t.window.subarray(e, e + e - o), 0), t.match_start -= e, t.strstart -= e, t.block_start -= e, t.insert > t.strstart && (t.insert = t.strstart), iy(t), o += e), t.strm.avail_in === 0)
      break;
    if (n = hs(t.strm, t.window, t.strstart + t.lookahead, o), t.lookahead += n, t.legacy_hash) {
      if (t.lookahead + t.insert >= B)
        for (s = t.strstart - t.insert, t.ins_h = t.window[s], t.ins_h = zs(t, t.ins_h, t.window[s + 1]); t.insert && (te(t, s), s++, t.insert--, !(t.lookahead + t.insert < B)); )
          ;
    } else if (t.lookahead + t.insert > B)
      for (s = t.strstart - t.insert; t.insert && (te(t, s), s++, t.insert--, !(t.lookahead + t.insert <= B)); )
        ;
  } while (t.lookahead < xt && t.strm.avail_in !== 0);
}, hf = (t, e) => {
  let n = t.pending_buf_size - 5 > t.w_size ? t.w_size : t.pending_buf_size - 5, o, s, r, i = 0, a = t.strm.avail_in;
  do {
    if (o = 65535, r = t.bi_valid + 42 >> 3, t.strm.avail_out < r || (r = t.strm.avail_out - r, s = t.strstart - t.block_start, o > s + t.strm.avail_in && (o = s + t.strm.avail_in), o > r && (o = r), o < n && (o === 0 && e !== ft || e === Gt || o !== s + t.strm.avail_in)))
      break;
    i = e === ft && o === s + t.strm.avail_in ? 1 : 0, is(t, 0, 0, i), t.pending_buf[t.pending - 4] = o, t.pending_buf[t.pending - 3] = o >> 8, t.pending_buf[t.pending - 2] = ~o, t.pending_buf[t.pending - 1] = ~o >> 8, st(t.strm), s && (s > o && (s = o), t.strm.output.set(t.window.subarray(t.block_start, t.block_start + s), t.strm.next_out), t.strm.next_out += s, t.strm.avail_out -= s, t.strm.total_out += s, t.block_start += s, o -= s), o && (hs(t.strm, t.strm.output, t.strm.next_out, o), t.strm.next_out += o, t.strm.avail_out -= o, t.strm.total_out += o);
  } while (i === 0);
  return a -= t.strm.avail_in, a && (a >= t.w_size ? (t.matches = 2, t.window.set(t.strm.input.subarray(t.strm.next_in - t.w_size, t.strm.next_in), 0), t.strstart = t.w_size, t.insert = t.strstart) : (t.window_size - t.strstart <= a && (t.strstart -= t.w_size, t.window.set(t.window.subarray(t.w_size, t.w_size + t.strstart), 0), t.matches < 2 && t.matches++, t.insert > t.strstart && (t.insert = t.strstart)), t.window.set(t.strm.input.subarray(t.strm.next_in - a, t.strm.next_in), t.strstart), t.strstart += a, t.insert += a > t.w_size - t.insert ? t.w_size - t.insert : a), t.block_start = t.strstart), t.high_water < t.strstart && (t.high_water = t.strstart), i ? Te : e !== Gt && e !== ft && t.strm.avail_in === 0 && t.strstart === t.block_start ? Ee : (r = t.window_size - t.strstart, t.strm.avail_in > r && t.block_start >= t.w_size && (t.block_start -= t.w_size, t.strstart -= t.w_size, t.window.set(t.window.subarray(t.w_size, t.w_size + t.strstart), 0), t.matches < 2 && t.matches++, r += t.w_size, t.insert > t.strstart && (t.insert = t.strstart)), r > t.strm.avail_in && (r = t.strm.avail_in), r && (hs(t.strm, t.window, t.strstart, r), t.strstart += r, t.insert += r > t.w_size - t.insert ? t.w_size - t.insert : r), t.high_water < t.strstart && (t.high_water = t.strstart), r = t.bi_valid + 42 >> 3, r = t.pending_buf_size - r > 65535 ? 65535 : t.pending_buf_size - r, n = r > t.w_size ? t.w_size : r, s = t.strstart - t.block_start, (s >= n || (s || e === ft) && e !== Gt && t.strm.avail_in === 0 && s <= r) && (o = s > r ? r : s, i = e === ft && t.strm.avail_in === 0 && o === s ? 1 : 0, is(t, t.block_start, o, i), t.block_start += o, st(t.strm)), i ? Qt : tt);
}, Do = (t, e) => {
  let n, o;
  for (; ; ) {
    if (t.lookahead < xt) {
      if (Ie(t), t.lookahead < xt && e === Gt)
        return tt;
      if (t.lookahead === 0)
        break;
    }
    if (n = 0, t.lookahead >= B && (n = te(t, t.strstart)), n !== 0 && t.strstart - n <= t.w_size - xt && (t.match_length = uf(t, n)), t.match_length >= B)
      if (o = Nt(t, t.strstart - t.match_start, t.match_length - B), t.lookahead -= t.match_length, t.match_length <= t.max_lazy_match && t.lookahead >= B) {
        t.match_length--;
        do
          t.strstart++, n = te(t, t.strstart);
        while (--t.match_length !== 0);
        t.strstart++;
      } else
        t.strstart += t.match_length, t.match_length = 0, t.legacy_hash && (t.ins_h = t.window[t.strstart], t.ins_h = zs(t, t.ins_h, t.window[t.strstart + 1]));
    else
      o = Nt(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++;
    if (o && (it(t, !1), t.strm.avail_out === 0))
      return tt;
  }
  return t.insert = t.strstart < B - 1 ? t.strstart : B - 1, e === ft ? (it(t, !0), t.strm.avail_out === 0 ? Qt : Te) : t.sym_next && (it(t, !1), t.strm.avail_out === 0) ? tt : Ee;
}, ae = (t, e) => {
  let n, o, s;
  for (; ; ) {
    if (t.lookahead < xt) {
      if (Ie(t), t.lookahead < xt && e === Gt)
        return tt;
      if (t.lookahead === 0)
        break;
    }
    if (n = 0, t.lookahead >= B && (n = te(t, t.strstart)), t.prev_length = t.match_length, t.prev_match = t.match_start, t.match_length = B - 1, n !== 0 && t.prev_length < t.max_lazy_match && t.strstart - n <= t.w_size - xt && (t.match_length = uf(t, n), t.match_length <= 5 && (t.strategy === Hm || t.match_length === B && t.strstart - t.match_start > 4096) && (t.match_length = B - 1)), t.prev_length >= B && t.match_length <= t.prev_length) {
      s = t.strstart + t.lookahead - B, o = Nt(t, t.strstart - 1 - t.prev_match, t.prev_length - B), t.lookahead -= t.prev_length - 1, t.prev_length -= 2;
      do
        ++t.strstart <= s && (n = te(t, t.strstart));
      while (--t.prev_length !== 0);
      if (t.match_available = 0, t.match_length = B - 1, t.strstart++, o && (it(t, !1), t.strm.avail_out === 0))
        return tt;
    } else if (t.match_available) {
      if (o = Nt(t, 0, t.window[t.strstart - 1]), o && it(t, !1), t.strstart++, t.lookahead--, t.strm.avail_out === 0)
        return tt;
    } else
      t.match_available = 1, t.strstart++, t.lookahead--;
  }
  return t.match_available && (o = Nt(t, 0, t.window[t.strstart - 1]), t.match_available = 0), t.insert = t.strstart < B - 1 ? t.strstart : B - 1, e === ft ? (it(t, !0), t.strm.avail_out === 0 ? Qt : Te) : t.sym_next && (it(t, !1), t.strm.avail_out === 0) ? tt : Ee;
}, ay = (t, e) => {
  let n, o, s, r;
  const i = t.window;
  for (; ; ) {
    if (t.lookahead <= Bt) {
      if (Ie(t), t.lookahead <= Bt && e === Gt)
        return tt;
      if (t.lookahead === 0)
        break;
    }
    if (t.match_length = 0, t.lookahead >= B && t.strstart > 0 && (s = t.strstart - 1, o = i[s], o === i[++s] && o === i[++s] && o === i[++s])) {
      r = t.strstart + Bt;
      do
        ;
      while (o === i[++s] && o === i[++s] && o === i[++s] && o === i[++s] && o === i[++s] && o === i[++s] && o === i[++s] && o === i[++s] && s < r);
      t.match_length = Bt - (r - s), t.match_length > t.lookahead && (t.match_length = t.lookahead);
    }
    if (t.match_length >= B ? (n = Nt(t, 1, t.match_length - B), t.lookahead -= t.match_length, t.strstart += t.match_length, t.match_length = 0) : (n = Nt(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++), n && (it(t, !1), t.strm.avail_out === 0))
      return tt;
  }
  return t.insert = 0, e === ft ? (it(t, !0), t.strm.avail_out === 0 ? Qt : Te) : t.sym_next && (it(t, !1), t.strm.avail_out === 0) ? tt : Ee;
}, cy = (t, e) => {
  let n;
  for (; ; ) {
    if (t.lookahead === 0 && (Ie(t), t.lookahead === 0)) {
      if (e === Gt)
        return tt;
      break;
    }
    if (t.match_length = 0, n = Nt(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++, n && (it(t, !1), t.strm.avail_out === 0))
      return tt;
  }
  return t.insert = 0, e === ft ? (it(t, !0), t.strm.avail_out === 0 ? Qt : Te) : t.sym_next && (it(t, !1), t.strm.avail_out === 0) ? tt : Ee;
};
function ht(t, e, n, o, s) {
  this.good_length = t, this.max_lazy = e, this.nice_length = n, this.max_chain = o, this.func = s;
}
const ze = [
  /*      good lazy nice chain */
  new ht(0, 0, 0, 0, hf),
  /* 0 store only */
  new ht(4, 4, 8, 4, Do),
  /* 1 max speed, no lazy matches */
  new ht(4, 5, 16, 8, Do),
  /* 2 */
  new ht(4, 6, 32, 32, Do),
  /* 3 */
  new ht(4, 4, 16, 16, ae),
  /* 4 lazy matches */
  new ht(8, 16, 32, 32, ae),
  /* 5 */
  new ht(8, 16, 128, 128, ae),
  /* 6 */
  new ht(8, 32, 128, 256, ae),
  /* 7 */
  new ht(32, 128, 258, 1024, ae),
  /* 8 */
  new ht(32, 258, 258, 4096, ae)
  /* 9 max compression */
], fy = (t) => {
  t.window_size = 2 * t.w_size, Rt(t.head), t.max_lazy_match = ze[t.level].max_lazy, t.good_match = ze[t.level].good_length, t.nice_match = ze[t.level].nice_length, t.max_chain_length = ze[t.level].max_chain, t.strstart = 0, t.block_start = 0, t.lookahead = 0, t.insert = 0, t.match_length = t.prev_length = B - 1, t.match_available = 0, t.ins_h = 0;
};
function ly() {
  this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = co, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.legacy_hash = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new Uint16Array(ny * 2), this.dyn_dtree = new Uint16Array((2 * ty + 1) * 2), this.bl_tree = new Uint16Array((2 * ey + 1) * 2), Rt(this.dyn_ltree), Rt(this.dyn_dtree), Rt(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new Uint16Array(oy + 1), this.heap = new Uint16Array(2 * as + 1), Rt(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new Uint16Array(2 * as + 1), Rt(this.depth), this.sym_buf = 0, this.lit_bufsize = 0, this.sym_next = 0, this.sym_end = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
}
const hn = (t) => {
  if (!t)
    return 1;
  const e = t.state;
  return !e || e.strm !== t || e.status !== ve && //#ifdef GZIP
  e.status !== Us && //#endif
  e.status !== cs && e.status !== fs && e.status !== ls && e.status !== us && e.status !== Xt && e.status !== Ue ? 1 : 0;
}, gf = (t) => {
  if (hn(t))
    return qt(t, yt);
  t.total_in = t.total_out = 0, t.data_type = Zm;
  const e = t.state;
  return e.pending = 0, e.pending_out = 0, e.wrap < 0 && (e.wrap = -e.wrap), e.status = //#ifdef GZIP
  e.wrap === 2 ? Us : (
    //#endif
    e.wrap ? ve : Xt
  ), t.adler = e.wrap === 2 ? 0 : 1, e.last_flush = -2, Vm(e), X;
}, pf = (t) => {
  const e = gf(t);
  return e === X && fy(t.state), e;
}, uy = (t, e) => hn(t) || t.state.wrap !== 2 ? yt : (t.state.gzhead = e, X), df = (t, e, n, o, s, r, i) => {
  if (!t)
    return yt;
  let a = 1;
  if (e === zm && (e = 6), o < 0 ? (a = 0, o = -o) : o > 15 && (a = 2, o -= 16), s < 1 || s > Xm || n !== co || o < 8 || o > 15 || e < 0 || e > 9 || r < 0 || r > jm || o === 8 && a !== 1)
    return qt(t, yt);
  o === 8 && (o = 9);
  const c = new ly();
  return t.state = c, c.strm = t, c.status = ve, c.wrap = a, c.gzhead = null, c.w_bits = o, c.w_size = 1 << c.w_bits, c.w_mask = c.w_size - 1, c.legacy_hash = i ? 1 : 0, c.hash_bits = s + 7, !c.legacy_hash && c.hash_bits < 15 && (c.hash_bits = 15), c.hash_size = 1 << c.hash_bits, c.hash_mask = c.hash_size - 1, c.hash_shift = ~~((c.hash_bits + B - 1) / B), c.window = new Uint8Array(c.w_size * 2), c.head = new Uint16Array(c.hash_size), c.prev = new Uint16Array(c.w_size), c.lit_bufsize = 1 << s + 6, c.pending_buf_size = c.lit_bufsize * 4, c.pending_buf = new Uint8Array(c.pending_buf_size), c.sym_buf = c.lit_bufsize, c.sym_end = (c.lit_bufsize - 1) * 3, c.level = e, c.strategy = r, c.method = n, pf(t);
}, hy = (t, e) => df(t, e, co, qm, Km, Ym), gy = (t, e) => {
  if (hn(t) || e > Jr || e < 0)
    return t ? qt(t, yt) : yt;
  const n = t.state;
  if (!t.output || t.avail_in !== 0 && !t.input || n.status === Ue && e !== ft)
    return qt(t, t.avail_out === 0 ? To : yt);
  const o = n.last_flush;
  if (n.last_flush = e, n.pending !== 0) {
    if (st(t), t.avail_out === 0)
      return n.last_flush = -1, X;
  } else if (t.avail_in === 0 && ti(e) <= ti(o) && e !== ft)
    return qt(t, To);
  if (n.status === Ue && t.avail_in !== 0)
    return qt(t, To);
  if (n.status === ve && n.wrap === 0 && (n.status = Xt), n.status === ve) {
    let s = co + (n.w_bits - 8 << 4) << 8, r = -1;
    if (n.strategy >= wn || n.level < 2 ? r = 0 : n.level < 6 ? r = 1 : n.level === 6 ? r = 2 : r = 3, s |= r << 6, n.strstart !== 0 && (s |= sy), s += 31 - s % 31, Be(n, s), n.strstart !== 0 && (Be(n, t.adler >>> 16), Be(n, t.adler & 65535)), t.adler = 1, n.status = Xt, st(t), n.pending !== 0)
      return n.last_flush = -1, X;
  }
  if (n.status === Us) {
    if (t.adler = 0, V(n, 31), V(n, 139), V(n, 8), n.gzhead)
      V(
        n,
        (n.gzhead.text ? 1 : 0) + (n.gzhead.hcrc ? 2 : 0) + (n.gzhead.extra ? 4 : 0) + (n.gzhead.name ? 8 : 0) + (n.gzhead.comment ? 16 : 0)
      ), V(n, n.gzhead.time & 255), V(n, n.gzhead.time >> 8 & 255), V(n, n.gzhead.time >> 16 & 255), V(n, n.gzhead.time >> 24 & 255), V(n, n.level === 9 ? 2 : n.strategy >= wn || n.level < 2 ? 4 : 0), V(n, n.gzhead.os & 255), n.gzhead.extra && n.gzhead.extra.length && (V(n, n.gzhead.extra.length & 255), V(n, n.gzhead.extra.length >> 8 & 255)), n.gzhead.hcrc && (t.adler = Y(t.adler, n.pending_buf, n.pending, 0)), n.gzindex = 0, n.status = cs;
    else if (V(n, 0), V(n, 0), V(n, 0), V(n, 0), V(n, 0), V(n, n.level === 9 ? 2 : n.strategy >= wn || n.level < 2 ? 4 : 0), V(n, ry), n.status = Xt, st(t), n.pending !== 0)
      return n.last_flush = -1, X;
  }
  if (n.status === cs) {
    if (n.gzhead.extra) {
      let s = n.pending, r = (n.gzhead.extra.length & 65535) - n.gzindex;
      for (; n.pending + r > n.pending_buf_size; ) {
        let a = n.pending_buf_size - n.pending;
        if (n.pending_buf.set(n.gzhead.extra.subarray(n.gzindex, n.gzindex + a), n.pending), n.pending = n.pending_buf_size, n.gzhead.hcrc && n.pending > s && (t.adler = Y(t.adler, n.pending_buf, n.pending - s, s)), n.gzindex += a, st(t), n.pending !== 0)
          return n.last_flush = -1, X;
        s = 0, r -= a;
      }
      let i = new Uint8Array(n.gzhead.extra);
      n.pending_buf.set(i.subarray(n.gzindex, n.gzindex + r), n.pending), n.pending += r, n.gzhead.hcrc && n.pending > s && (t.adler = Y(t.adler, n.pending_buf, n.pending - s, s)), n.gzindex = 0;
    }
    n.status = fs;
  }
  if (n.status === fs) {
    if (n.gzhead.name) {
      let s = n.pending, r;
      do {
        if (n.pending === n.pending_buf_size) {
          if (n.gzhead.hcrc && n.pending > s && (t.adler = Y(t.adler, n.pending_buf, n.pending - s, s)), st(t), n.pending !== 0)
            return n.last_flush = -1, X;
          s = 0;
        }
        n.gzindex < n.gzhead.name.length ? r = n.gzhead.name.charCodeAt(n.gzindex++) & 255 : r = 0, V(n, r);
      } while (r !== 0);
      n.gzhead.hcrc && n.pending > s && (t.adler = Y(t.adler, n.pending_buf, n.pending - s, s)), n.gzindex = 0;
    }
    n.status = ls;
  }
  if (n.status === ls) {
    if (n.gzhead.comment) {
      let s = n.pending, r;
      do {
        if (n.pending === n.pending_buf_size) {
          if (n.gzhead.hcrc && n.pending > s && (t.adler = Y(t.adler, n.pending_buf, n.pending - s, s)), st(t), n.pending !== 0)
            return n.last_flush = -1, X;
          s = 0;
        }
        n.gzindex < n.gzhead.comment.length ? r = n.gzhead.comment.charCodeAt(n.gzindex++) & 255 : r = 0, V(n, r);
      } while (r !== 0);
      n.gzhead.hcrc && n.pending > s && (t.adler = Y(t.adler, n.pending_buf, n.pending - s, s));
    }
    n.status = us;
  }
  if (n.status === us) {
    if (n.gzhead.hcrc) {
      if (n.pending + 2 > n.pending_buf_size && (st(t), n.pending !== 0))
        return n.last_flush = -1, X;
      V(n, t.adler & 255), V(n, t.adler >> 8 & 255), t.adler = 0;
    }
    if (n.status = Xt, st(t), n.pending !== 0)
      return n.last_flush = -1, X;
  }
  if (t.avail_in !== 0 || n.lookahead !== 0 || e !== Gt && n.status !== Ue) {
    let s = n.level === 0 ? hf(n, e) : n.strategy === wn ? cy(n, e) : n.strategy === Wm ? ay(n, e) : ze[n.level].func(n, e);
    if ((s === Qt || s === Te) && (n.status = Ue), s === tt || s === Qt)
      return t.avail_out === 0 && (n.last_flush = -1), X;
    if (s === Ee && (e === Gm ? Nm(n) : e !== Jr && (is(n, 0, 0, !1), e === Pm && (Rt(n.head), n.lookahead === 0 && (n.strstart = 0, n.block_start = 0, n.insert = 0))), st(t), t.avail_out === 0))
      return n.last_flush = -1, X;
  }
  return e !== ft ? X : n.wrap <= 0 ? Qr : (n.wrap === 2 ? (V(n, t.adler & 255), V(n, t.adler >> 8 & 255), V(n, t.adler >> 16 & 255), V(n, t.adler >> 24 & 255), V(n, t.total_in & 255), V(n, t.total_in >> 8 & 255), V(n, t.total_in >> 16 & 255), V(n, t.total_in >> 24 & 255)) : (Be(n, t.adler >>> 16), Be(n, t.adler & 65535)), st(t), n.wrap > 0 && (n.wrap = -n.wrap), n.pending !== 0 ? X : Qr);
}, py = (t) => {
  if (hn(t))
    return yt;
  const e = t.state.status;
  return t.state = null, e === Xt ? qt(t, Um) : X;
}, dy = (t, e) => {
  let n = e.length;
  if (hn(t))
    return yt;
  const o = t.state, s = o.wrap;
  if (s === 2 || s === 1 && o.status !== ve || o.lookahead)
    return yt;
  if (s === 1 && (t.adler = sn(t.adler, e, n, 0)), o.wrap = 0, n >= o.w_size) {
    s === 0 && (Rt(o.head), o.strstart = 0, o.block_start = 0, o.insert = 0);
    let c = new Uint8Array(o.w_size);
    c.set(e.subarray(n - o.w_size, n), 0), e = c, n = o.w_size;
  }
  const r = t.avail_in, i = t.next_in, a = t.input;
  for (t.avail_in = n, t.next_in = 0, t.input = e, Ie(o); o.lookahead >= B; ) {
    let c = o.strstart, f = o.lookahead - (B - 1);
    do
      te(o, c), c++;
    while (--f);
    o.strstart = c, o.lookahead = B - 1, Ie(o);
  }
  return o.strstart += o.lookahead, o.block_start = o.strstart, o.insert = o.lookahead, o.lookahead = 0, o.match_length = o.prev_length = B - 1, o.match_available = 0, t.next_in = i, t.input = a, t.avail_in = r, o.wrap = s, X;
};
var my = hy, yy = df, xy = pf, Sy = gf, _y = uy, wy = gy, by = py, Ay = dy, Cy = "pako deflate (from Nodeca project)", Ye = {
  deflateInit: my,
  deflateInit2: yy,
  deflateReset: xy,
  deflateResetKeep: Sy,
  deflateSetHeader: _y,
  deflate: wy,
  deflateEnd: by,
  deflateSetDictionary: Ay,
  deflateInfo: Cy
};
const vy = (t, e) => Object.prototype.hasOwnProperty.call(t, e);
var Iy = function(t) {
  const e = Array.prototype.slice.call(arguments, 1);
  for (; e.length; ) {
    const n = e.shift();
    if (n) {
      if (typeof n != "object")
        throw new TypeError(n + "must be non-object");
      for (const o in n)
        vy(n, o) && (t[o] = n[o]);
    }
  }
  return t;
}, Oy = (t) => {
  let e = 0;
  for (let o = 0, s = t.length; o < s; o++)
    e += t[o].length;
  const n = new Uint8Array(e);
  for (let o = 0, s = 0, r = t.length; o < r; o++) {
    let i = t[o];
    n.set(i, s), s += i.length;
  }
  return n;
}, fo = {
  assign: Iy,
  flattenChunks: Oy
};
let mf = !0;
try {
  String.fromCharCode.apply(null, new Uint8Array(1));
} catch {
  mf = !1;
}
const rn = new Uint8Array(256);
for (let t = 0; t < 256; t++)
  rn[t] = t >= 252 ? 6 : t >= 248 ? 5 : t >= 240 ? 4 : t >= 224 ? 3 : t >= 192 ? 2 : 1;
rn[254] = rn[255] = 1;
var ky = (t) => {
  if (typeof TextEncoder == "function" && TextEncoder.prototype.encode)
    return new TextEncoder().encode(t);
  let e, n, o, s, r, i = t.length, a = 0;
  for (s = 0; s < i; s++)
    n = t.charCodeAt(s), (n & 64512) === 55296 && s + 1 < i && (o = t.charCodeAt(s + 1), (o & 64512) === 56320 && (n = 65536 + (n - 55296 << 10) + (o - 56320), s++)), a += n < 128 ? 1 : n < 2048 ? 2 : n < 65536 ? 3 : 4;
  for (e = new Uint8Array(a), r = 0, s = 0; r < a; s++)
    n = t.charCodeAt(s), (n & 64512) === 55296 && s + 1 < i && (o = t.charCodeAt(s + 1), (o & 64512) === 56320 && (n = 65536 + (n - 55296 << 10) + (o - 56320), s++)), n < 128 ? e[r++] = n : n < 2048 ? (e[r++] = 192 | n >>> 6, e[r++] = 128 | n & 63) : n < 65536 ? (e[r++] = 224 | n >>> 12, e[r++] = 128 | n >>> 6 & 63, e[r++] = 128 | n & 63) : (e[r++] = 240 | n >>> 18, e[r++] = 128 | n >>> 12 & 63, e[r++] = 128 | n >>> 6 & 63, e[r++] = 128 | n & 63);
  return e;
};
const Ey = (t, e) => {
  if (e < 65534 && t.subarray && mf)
    return String.fromCharCode.apply(null, t.length === e ? t : t.subarray(0, e));
  let n = "";
  for (let o = 0; o < e; o++)
    n += String.fromCharCode(t[o]);
  return n;
};
var Ty = (t, e) => {
  const n = e || t.length;
  if (typeof TextDecoder == "function" && TextDecoder.prototype.decode)
    return new TextDecoder().decode(t.subarray(0, e));
  let o, s;
  const r = new Array(n * 2);
  for (s = 0, o = 0; o < n; ) {
    let i = t[o++];
    if (i < 128) {
      r[s++] = i;
      continue;
    }
    let a = rn[i];
    if (a > 4) {
      r[s++] = 65533, o += a - 1;
      continue;
    }
    for (i &= a === 2 ? 31 : a === 3 ? 15 : 7; a > 1 && o < n; )
      i = i << 6 | t[o++] & 63, a--;
    if (a > 1) {
      r[s++] = 65533;
      continue;
    }
    i < 65536 ? r[s++] = i : (i -= 65536, r[s++] = 55296 | i >> 10 & 1023, r[s++] = 56320 | i & 1023);
  }
  return Ey(r, s);
}, Dy = (t, e) => {
  e = e || t.length, e > t.length && (e = t.length);
  let n = e - 1;
  for (; n >= 0 && (t[n] & 192) === 128; )
    n--;
  return n < 0 || n === 0 ? e : n + rn[t[n]] > e ? n : e;
}, an = {
  string2buf: ky,
  buf2string: Ty,
  utf8border: Dy
};
function Ry() {
  this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
}
var yf = Ry;
const xf = Object.prototype.toString, {
  Z_NO_FLUSH: Fy,
  Z_SYNC_FLUSH: My,
  Z_FULL_FLUSH: Ly,
  Z_FINISH: By,
  Z_OK: Hn,
  Z_STREAM_END: Vy,
  Z_DEFAULT_COMPRESSION: $y,
  Z_DEFAULT_STRATEGY: Ny,
  Z_DEFLATED: Gy
} = ao, Py = {
  level: $y,
  method: Gy,
  chunkSize: 16384,
  windowBits: 15,
  memLevel: 8,
  strategy: Ny,
  legacyHash: !0
};
function lo(t) {
  this.options = fo.assign({}, Py, t || {});
  let e = this.options;
  e.raw && e.windowBits > 0 ? e.windowBits = -e.windowBits : e.gzip && e.windowBits > 0 && e.windowBits < 16 && (e.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new yf(), this.strm.avail_out = 0;
  let n = Ye.deflateInit2(
    this.strm,
    e.level,
    e.method,
    e.windowBits,
    e.memLevel,
    e.strategy,
    e.legacyHash
  );
  if (n !== Hn)
    throw new Error(Jt[n]);
  if (e.header && Ye.deflateSetHeader(this.strm, e.header), e.dictionary) {
    let o;
    if (typeof e.dictionary == "string" ? o = an.string2buf(e.dictionary) : xf.call(e.dictionary) === "[object ArrayBuffer]" ? o = new Uint8Array(e.dictionary) : o = e.dictionary, n = Ye.deflateSetDictionary(this.strm, o), n !== Hn)
      throw new Error(Jt[n]);
    this._dict_set = !0;
  }
}
lo.prototype.push = function(t, e) {
  const n = this.strm, o = this.options.chunkSize;
  let s, r;
  if (this.ended)
    return !1;
  for (e === ~~e ? r = e : r = e === !0 ? By : Fy, typeof t == "string" ? n.input = an.string2buf(t) : xf.call(t) === "[object ArrayBuffer]" ? n.input = new Uint8Array(t) : n.input = t, n.next_in = 0, n.avail_in = n.input.length; ; ) {
    if (n.avail_out === 0 && (n.output = new Uint8Array(o), n.next_out = 0, n.avail_out = o), (r === My || r === Ly) && n.avail_out <= 6) {
      this.onData(n.output.subarray(0, n.next_out)), n.avail_out = 0;
      continue;
    }
    if (s = Ye.deflate(n, r), s === Vy)
      return n.next_out > 0 && this.onData(n.output.subarray(0, n.next_out)), s = Ye.deflateEnd(this.strm), this.onEnd(s), this.ended = !0, s === Hn;
    if (n.avail_out === 0) {
      this.onData(n.output);
      continue;
    }
    if (r > 0 && n.next_out > 0) {
      this.onData(n.output.subarray(0, n.next_out)), n.avail_out = 0;
      continue;
    }
    if (n.avail_in === 0) break;
  }
  return !0;
};
lo.prototype.onData = function(t) {
  this.chunks.push(t);
};
lo.prototype.onEnd = function(t) {
  t === Hn && (this.result = fo.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;
};
function Uy(t, e) {
  const n = new lo(e);
  if (n.push(t, !0), n.err)
    throw n.msg || Jt[n.err];
  return n.result;
}
var zy = Uy, Hy = {
  deflate: zy
};
const bn = 16209, Wy = 16191;
var jy = function(e, n) {
  let o, s, r, i, a, c, f, l, u, h, p, g, d, x, y, m, w, _, S, b, A, k, O, I;
  const E = e.state;
  o = e.next_in, O = e.input, s = o + (e.avail_in - 5), r = e.next_out, I = e.output, i = r - (n - e.avail_out), a = r + (e.avail_out - 257), c = E.dmax, f = E.wsize, l = E.whave, u = E.wnext, h = E.window, p = E.hold, g = E.bits, d = E.lencode, x = E.distcode, y = (1 << E.lenbits) - 1, m = (1 << E.distbits) - 1;
  t:
    do {
      g < 15 && (p += O[o++] << g, g += 8, p += O[o++] << g, g += 8), w = d[p & y];
      e:
        for (; ; ) {
          if (_ = w >>> 24, p >>>= _, g -= _, _ = w >>> 16 & 255, _ === 0)
            I[r++] = w & 65535;
          else if (_ & 16) {
            S = w & 65535, _ &= 15, _ && (g < _ && (p += O[o++] << g, g += 8), S += p & (1 << _) - 1, p >>>= _, g -= _), g < 15 && (p += O[o++] << g, g += 8, p += O[o++] << g, g += 8), w = x[p & m];
            n:
              for (; ; ) {
                if (_ = w >>> 24, p >>>= _, g -= _, _ = w >>> 16 & 255, _ & 16) {
                  if (b = w & 65535, _ &= 15, g < _ && (p += O[o++] << g, g += 8, g < _ && (p += O[o++] << g, g += 8)), b += p & (1 << _) - 1, b > c) {
                    e.msg = "invalid distance too far back", E.mode = bn;
                    break t;
                  }
                  if (p >>>= _, g -= _, _ = r - i, b > _) {
                    if (_ = b - _, _ > l && E.sane) {
                      e.msg = "invalid distance too far back", E.mode = bn;
                      break t;
                    }
                    if (A = 0, k = h, u === 0) {
                      if (A += f - _, _ < S) {
                        S -= _;
                        do
                          I[r++] = h[A++];
                        while (--_);
                        A = r - b, k = I;
                      }
                    } else if (u < _) {
                      if (A += f + u - _, _ -= u, _ < S) {
                        S -= _;
                        do
                          I[r++] = h[A++];
                        while (--_);
                        if (A = 0, u < S) {
                          _ = u, S -= _;
                          do
                            I[r++] = h[A++];
                          while (--_);
                          A = r - b, k = I;
                        }
                      }
                    } else if (A += u - _, _ < S) {
                      S -= _;
                      do
                        I[r++] = h[A++];
                      while (--_);
                      A = r - b, k = I;
                    }
                    for (; S > 2; )
                      I[r++] = k[A++], I[r++] = k[A++], I[r++] = k[A++], S -= 3;
                    S && (I[r++] = k[A++], S > 1 && (I[r++] = k[A++]));
                  } else {
                    A = r - b;
                    do
                      I[r++] = I[A++], I[r++] = I[A++], I[r++] = I[A++], S -= 3;
                    while (S > 2);
                    S && (I[r++] = I[A++], S > 1 && (I[r++] = I[A++]));
                  }
                } else if ((_ & 64) === 0) {
                  w = x[(w & 65535) + (p & (1 << _) - 1)];
                  continue n;
                } else {
                  e.msg = "invalid distance code", E.mode = bn;
                  break t;
                }
                break;
              }
          } else if ((_ & 64) === 0) {
            w = d[(w & 65535) + (p & (1 << _) - 1)];
            continue e;
          } else if (_ & 32) {
            E.mode = Wy;
            break t;
          } else {
            e.msg = "invalid literal/length code", E.mode = bn;
            break t;
          }
          break;
        }
    } while (o < s && r < a);
  S = g >> 3, o -= S, g -= S << 3, p &= (1 << g) - 1, e.next_in = o, e.next_out = r, e.avail_in = o < s ? 5 + (s - o) : 5 - (o - s), e.avail_out = r < a ? 257 + (a - r) : 257 - (r - a), E.hold = p, E.bits = g;
};
const ce = 15, ei = 852, ni = 592, oi = 0, Ro = 1, si = 2, Yy = new Uint16Array([
  /* Length codes 257..285 base */
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  13,
  15,
  17,
  19,
  23,
  27,
  31,
  35,
  43,
  51,
  59,
  67,
  83,
  99,
  115,
  131,
  163,
  195,
  227,
  258,
  0,
  0
]), Zy = new Uint8Array([
  /* Length codes 257..285 extra */
  16,
  16,
  16,
  16,
  16,
  16,
  16,
  16,
  17,
  17,
  17,
  17,
  18,
  18,
  18,
  18,
  19,
  19,
  19,
  19,
  20,
  20,
  20,
  20,
  21,
  21,
  21,
  21,
  16,
  199,
  75
]), Xy = new Uint16Array([
  /* Distance codes 0..29 base */
  1,
  2,
  3,
  4,
  5,
  7,
  9,
  13,
  17,
  25,
  33,
  49,
  65,
  97,
  129,
  193,
  257,
  385,
  513,
  769,
  1025,
  1537,
  2049,
  3073,
  4097,
  6145,
  8193,
  12289,
  16385,
  24577,
  0,
  0
]), qy = new Uint8Array([
  /* Distance codes 0..29 extra */
  16,
  16,
  16,
  16,
  17,
  17,
  18,
  18,
  19,
  19,
  20,
  20,
  21,
  21,
  22,
  22,
  23,
  23,
  24,
  24,
  25,
  25,
  26,
  26,
  27,
  27,
  28,
  28,
  29,
  29,
  64,
  64
]), Ky = (t, e, n, o, s, r, i, a) => {
  const c = a.bits;
  let f = 0, l = 0, u = 0, h = 0, p = 0, g = 0, d = 0, x = 0, y = 0, m = 0, w, _, S, b, A, k = null, O;
  const I = new Uint16Array(ce + 1), E = new Uint16Array(ce + 1);
  let T = null, D, R, M;
  for (f = 0; f <= ce; f++)
    I[f] = 0;
  for (l = 0; l < o; l++)
    I[e[n + l]]++;
  for (p = c, h = ce; h >= 1 && I[h] === 0; h--)
    ;
  if (p > h && (p = h), h === 0)
    return s[r++] = 1 << 24 | 64 << 16 | 0, s[r++] = 1 << 24 | 64 << 16 | 0, a.bits = 1, 0;
  for (u = 1; u < h && I[u] === 0; u++)
    ;
  for (p < u && (p = u), x = 1, f = 1; f <= ce; f++)
    if (x <<= 1, x -= I[f], x < 0)
      return -1;
  if (x > 0 && (t === oi || h !== 1))
    return -1;
  for (E[1] = 0, f = 1; f < ce; f++)
    E[f + 1] = E[f] + I[f];
  for (l = 0; l < o; l++)
    e[n + l] !== 0 && (i[E[e[n + l]]++] = l);
  if (t === oi ? (k = T = i, O = 20) : t === Ro ? (k = Yy, T = Zy, O = 257) : (k = Xy, T = qy, O = 0), m = 0, l = 0, f = u, A = r, g = p, d = 0, S = -1, y = 1 << p, b = y - 1, t === Ro && y > ei || t === si && y > ni)
    return 1;
  for (; ; ) {
    D = f - d, i[l] + 1 < O ? (R = 0, M = i[l]) : i[l] >= O ? (R = T[i[l] - O], M = k[i[l] - O]) : (R = 96, M = 0), w = 1 << f - d, _ = 1 << g, u = _;
    do
      _ -= w, s[A + (m >> d) + _] = D << 24 | R << 16 | M | 0;
    while (_ !== 0);
    for (w = 1 << f - 1; m & w; )
      w >>= 1;
    if (w !== 0 ? (m &= w - 1, m += w) : m = 0, l++, --I[f] === 0) {
      if (f === h)
        break;
      f = e[n + i[l]];
    }
    if (f > p && (m & b) !== S) {
      for (d === 0 && (d = p), A += u, g = f - d, x = 1 << g; g + d < h && (x -= I[g + d], !(x <= 0)); )
        g++, x <<= 1;
      if (y += 1 << g, t === Ro && y > ei || t === si && y > ni)
        return 1;
      S = m & b, s[S] = p << 24 | g << 16 | A - r | 0;
    }
  }
  return m !== 0 && (s[A + m] = f - d << 24 | 64 << 16 | 0), a.bits = p, 0;
};
var Ze = Ky;
const Jy = 0, Sf = 1, _f = 2, {
  Z_FINISH: ri,
  Z_BLOCK: Qy,
  Z_TREES: An,
  Z_OK: ee,
  Z_STREAM_END: tx,
  Z_NEED_DICT: ex,
  Z_STREAM_ERROR: lt,
  Z_DATA_ERROR: wf,
  Z_MEM_ERROR: bf,
  Z_BUF_ERROR: nx,
  Z_DEFLATED: ii
} = ao, uo = 16180, ai = 16181, ci = 16182, fi = 16183, li = 16184, ui = 16185, hi = 16186, gi = 16187, pi = 16188, di = 16189, Wn = 16190, At = 16191, Fo = 16192, mi = 16193, Mo = 16194, yi = 16195, xi = 16196, Si = 16197, _i = 16198, Cn = 16199, vn = 16200, wi = 16201, bi = 16202, Ai = 16203, Ci = 16204, vi = 16205, Lo = 16206, Ii = 16207, Oi = 16208, z = 16209, Af = 16210, Cf = 16211, ox = 852, sx = 592, rx = 15, ix = rx, ki = (t) => (t >>> 24 & 255) + (t >>> 8 & 65280) + ((t & 65280) << 8) + ((t & 255) << 24);
function ax() {
  this.strm = null, this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new Uint16Array(320), this.work = new Uint16Array(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
}
const oe = (t) => {
  if (!t)
    return 1;
  const e = t.state;
  return !e || e.strm !== t || e.mode < uo || e.mode > Cf ? 1 : 0;
}, vf = (t) => {
  if (oe(t))
    return lt;
  const e = t.state;
  return t.total_in = t.total_out = e.total = 0, t.msg = "", e.wrap && (t.adler = e.wrap & 1), e.mode = uo, e.last = 0, e.havedict = 0, e.flags = -1, e.dmax = 32768, e.head = null, e.hold = 0, e.bits = 0, e.lencode = e.lendyn = new Int32Array(ox), e.distcode = e.distdyn = new Int32Array(sx), e.sane = 1, e.back = -1, ee;
}, If = (t) => {
  if (oe(t))
    return lt;
  const e = t.state;
  return e.wsize = 0, e.whave = 0, e.wnext = 0, vf(t);
}, Of = (t, e) => {
  let n;
  if (oe(t))
    return lt;
  const o = t.state;
  return e < 0 ? (n = 0, e = -e) : (n = (e >> 4) + 5, e < 48 && (e &= 15)), e && (e < 8 || e > 15) ? lt : (o.window !== null && o.wbits !== e && (o.window = null), o.wrap = n, o.wbits = e, If(t));
}, kf = (t, e) => {
  if (!t)
    return lt;
  const n = new ax();
  t.state = n, n.strm = t, n.window = null, n.mode = uo;
  const o = Of(t, e);
  return o !== ee && (t.state = null), o;
}, cx = (t) => kf(t, ix);
let Ei = !0, Bo, Vo;
const fx = (t) => {
  if (Ei) {
    Bo = new Int32Array(512), Vo = new Int32Array(32);
    let e = 0;
    for (; e < 144; )
      t.lens[e++] = 8;
    for (; e < 256; )
      t.lens[e++] = 9;
    for (; e < 280; )
      t.lens[e++] = 7;
    for (; e < 288; )
      t.lens[e++] = 8;
    for (Ze(Sf, t.lens, 0, 288, Bo, 0, t.work, { bits: 9 }), e = 0; e < 32; )
      t.lens[e++] = 5;
    Ze(_f, t.lens, 0, 32, Vo, 0, t.work, { bits: 5 }), Ei = !1;
  }
  t.lencode = Bo, t.lenbits = 9, t.distcode = Vo, t.distbits = 5;
}, Ef = (t, e, n, o) => {
  let s;
  const r = t.state;
  return r.window === null && (r.window = new Uint8Array(1 << r.wbits)), r.wsize === 0 && (r.wsize = 1 << r.wbits, r.wnext = 0, r.whave = 0), o >= r.wsize ? (r.window.set(e.subarray(n - r.wsize, n), 0), r.wnext = 0, r.whave = r.wsize) : (s = r.wsize - r.wnext, s > o && (s = o), r.window.set(e.subarray(n - o, n - o + s), r.wnext), o -= s, o ? (r.window.set(e.subarray(n - o, n), 0), r.wnext = o, r.whave = r.wsize) : (r.wnext += s, r.wnext === r.wsize && (r.wnext = 0), r.whave < r.wsize && (r.whave += s))), 0;
}, lx = (t, e) => {
  let n, o, s, r, i, a, c, f, l, u, h, p, g, d, x = 0, y, m, w, _, S, b, A, k;
  const O = new Uint8Array(4);
  let I, E;
  const T = (
    /* permutation of code lengths */
    new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15])
  );
  if (oe(t) || !t.output || !t.input && t.avail_in !== 0)
    return lt;
  n = t.state, n.mode === At && (n.mode = Fo), i = t.next_out, s = t.output, c = t.avail_out, r = t.next_in, o = t.input, a = t.avail_in, f = n.hold, l = n.bits, u = a, h = c, k = ee;
  t:
    for (; ; )
      switch (n.mode) {
        case uo:
          if (n.wrap === 0) {
            n.mode = Fo;
            break;
          }
          for (; l < 16; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          if (n.wrap & 2 && f === 35615) {
            n.wbits === 0 && (n.wbits = 15), n.check = 0, O[0] = f & 255, O[1] = f >>> 8 & 255, n.check = Y(n.check, O, 2, 0), f = 0, l = 0, n.mode = ai;
            break;
          }
          if (n.head && (n.head.done = !1), !(n.wrap & 1) || /* check if zlib header allowed */
          (((f & 255) << 8) + (f >> 8)) % 31) {
            t.msg = "incorrect header check", n.mode = z;
            break;
          }
          if ((f & 15) !== ii) {
            t.msg = "unknown compression method", n.mode = z;
            break;
          }
          if (f >>>= 4, l -= 4, A = (f & 15) + 8, n.wbits === 0 && (n.wbits = A), A > 15 || A > n.wbits) {
            t.msg = "invalid window size", n.mode = z;
            break;
          }
          n.dmax = 1 << n.wbits, n.flags = 0, t.adler = n.check = 1, n.mode = f & 512 ? di : At, f = 0, l = 0;
          break;
        case ai:
          for (; l < 16; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          if (n.flags = f, (n.flags & 255) !== ii) {
            t.msg = "unknown compression method", n.mode = z;
            break;
          }
          if (n.flags & 57344) {
            t.msg = "unknown header flags set", n.mode = z;
            break;
          }
          n.head && (n.head.text = f >> 8 & 1), n.flags & 512 && n.wrap & 4 && (O[0] = f & 255, O[1] = f >>> 8 & 255, n.check = Y(n.check, O, 2, 0)), f = 0, l = 0, n.mode = ci;
        /* falls through */
        case ci:
          for (; l < 32; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          n.head && (n.head.time = f), n.flags & 512 && n.wrap & 4 && (O[0] = f & 255, O[1] = f >>> 8 & 255, O[2] = f >>> 16 & 255, O[3] = f >>> 24 & 255, n.check = Y(n.check, O, 4, 0)), f = 0, l = 0, n.mode = fi;
        /* falls through */
        case fi:
          for (; l < 16; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          n.head && (n.head.xflags = f & 255, n.head.os = f >> 8), n.flags & 512 && n.wrap & 4 && (O[0] = f & 255, O[1] = f >>> 8 & 255, n.check = Y(n.check, O, 2, 0)), f = 0, l = 0, n.mode = li;
        /* falls through */
        case li:
          if (n.flags & 1024) {
            for (; l < 16; ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << l, l += 8;
            }
            n.length = f, n.head && (n.head.extra_len = f), n.flags & 512 && n.wrap & 4 && (O[0] = f & 255, O[1] = f >>> 8 & 255, n.check = Y(n.check, O, 2, 0)), f = 0, l = 0;
          } else n.head && (n.head.extra = null);
          n.mode = ui;
        /* falls through */
        case ui:
          if (n.flags & 1024 && (p = n.length, p > a && (p = a), p && (n.head && (A = n.head.extra_len - n.length, n.head.extra || (n.head.extra = new Uint8Array(n.head.extra_len)), n.head.extra.set(
            o.subarray(
              r,
              // extra field is limited to 65536 bytes
              // - no need for additional size check
              r + p
            ),
            /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
            A
          )), n.flags & 512 && n.wrap & 4 && (n.check = Y(n.check, o, p, r)), a -= p, r += p, n.length -= p), n.length))
            break t;
          n.length = 0, n.mode = hi;
        /* falls through */
        case hi:
          if (n.flags & 2048) {
            if (a === 0)
              break t;
            p = 0;
            do
              A = o[r + p++], n.head && A && n.length < 65536 && (n.head.name += String.fromCharCode(A));
            while (A && p < a);
            if (n.flags & 512 && n.wrap & 4 && (n.check = Y(n.check, o, p, r)), a -= p, r += p, A)
              break t;
          } else n.head && (n.head.name = null);
          n.length = 0, n.mode = gi;
        /* falls through */
        case gi:
          if (n.flags & 4096) {
            if (a === 0)
              break t;
            p = 0;
            do
              A = o[r + p++], n.head && A && n.length < 65536 && (n.head.comment += String.fromCharCode(A));
            while (A && p < a);
            if (n.flags & 512 && n.wrap & 4 && (n.check = Y(n.check, o, p, r)), a -= p, r += p, A)
              break t;
          } else n.head && (n.head.comment = null);
          n.mode = pi;
        /* falls through */
        case pi:
          if (n.flags & 512) {
            for (; l < 16; ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << l, l += 8;
            }
            if (n.wrap & 4 && f !== (n.check & 65535)) {
              t.msg = "header crc mismatch", n.mode = z;
              break;
            }
            f = 0, l = 0;
          }
          n.head && (n.head.hcrc = n.flags >> 9 & 1, n.head.done = !0), t.adler = n.check = 0, n.mode = At;
          break;
        case di:
          for (; l < 32; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          t.adler = n.check = ki(f), f = 0, l = 0, n.mode = Wn;
        /* falls through */
        case Wn:
          if (n.havedict === 0)
            return t.next_out = i, t.avail_out = c, t.next_in = r, t.avail_in = a, n.hold = f, n.bits = l, ex;
          t.adler = n.check = 1, n.mode = At;
        /* falls through */
        case At:
          if (e === Qy || e === An)
            break t;
        /* falls through */
        case Fo:
          if (n.last) {
            f >>>= l & 7, l -= l & 7, n.mode = Lo;
            break;
          }
          for (; l < 3; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          switch (n.last = f & 1, f >>>= 1, l -= 1, f & 3) {
            case 0:
              n.mode = mi;
              break;
            case 1:
              if (fx(n), n.mode = Cn, e === An) {
                f >>>= 2, l -= 2;
                break t;
              }
              break;
            case 2:
              n.mode = xi;
              break;
            case 3:
              t.msg = "invalid block type", n.mode = z;
          }
          f >>>= 2, l -= 2;
          break;
        case mi:
          for (f >>>= l & 7, l -= l & 7; l < 32; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          if ((f & 65535) !== (f >>> 16 ^ 65535)) {
            t.msg = "invalid stored block lengths", n.mode = z;
            break;
          }
          if (n.length = f & 65535, f = 0, l = 0, n.mode = Mo, e === An)
            break t;
        /* falls through */
        case Mo:
          n.mode = yi;
        /* falls through */
        case yi:
          if (p = n.length, p) {
            if (p > a && (p = a), p > c && (p = c), p === 0)
              break t;
            s.set(o.subarray(r, r + p), i), a -= p, r += p, c -= p, i += p, n.length -= p;
            break;
          }
          n.mode = At;
          break;
        case xi:
          for (; l < 14; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          if (n.nlen = (f & 31) + 257, f >>>= 5, l -= 5, n.ndist = (f & 31) + 1, f >>>= 5, l -= 5, n.ncode = (f & 15) + 4, f >>>= 4, l -= 4, n.nlen > 286 || n.ndist > 30) {
            t.msg = "too many length or distance symbols", n.mode = z;
            break;
          }
          n.have = 0, n.mode = Si;
        /* falls through */
        case Si:
          for (; n.have < n.ncode; ) {
            for (; l < 3; ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << l, l += 8;
            }
            n.lens[T[n.have++]] = f & 7, f >>>= 3, l -= 3;
          }
          for (; n.have < 19; )
            n.lens[T[n.have++]] = 0;
          if (n.lencode = n.lendyn, n.lenbits = 7, I = { bits: n.lenbits }, k = Ze(Jy, n.lens, 0, 19, n.lencode, 0, n.work, I), n.lenbits = I.bits, k) {
            t.msg = "invalid code lengths set", n.mode = z;
            break;
          }
          n.have = 0, n.mode = _i;
        /* falls through */
        case _i:
          for (; n.have < n.nlen + n.ndist; ) {
            for (; x = n.lencode[f & (1 << n.lenbits) - 1], y = x >>> 24, m = x >>> 16 & 255, w = x & 65535, !(y <= l); ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << l, l += 8;
            }
            if (w < 16)
              f >>>= y, l -= y, n.lens[n.have++] = w;
            else {
              if (w === 16) {
                for (E = y + 2; l < E; ) {
                  if (a === 0)
                    break t;
                  a--, f += o[r++] << l, l += 8;
                }
                if (f >>>= y, l -= y, n.have === 0) {
                  t.msg = "invalid bit length repeat", n.mode = z;
                  break;
                }
                A = n.lens[n.have - 1], p = 3 + (f & 3), f >>>= 2, l -= 2;
              } else if (w === 17) {
                for (E = y + 3; l < E; ) {
                  if (a === 0)
                    break t;
                  a--, f += o[r++] << l, l += 8;
                }
                f >>>= y, l -= y, A = 0, p = 3 + (f & 7), f >>>= 3, l -= 3;
              } else {
                for (E = y + 7; l < E; ) {
                  if (a === 0)
                    break t;
                  a--, f += o[r++] << l, l += 8;
                }
                f >>>= y, l -= y, A = 0, p = 11 + (f & 127), f >>>= 7, l -= 7;
              }
              if (n.have + p > n.nlen + n.ndist) {
                t.msg = "invalid bit length repeat", n.mode = z;
                break;
              }
              for (; p--; )
                n.lens[n.have++] = A;
            }
          }
          if (n.mode === z)
            break;
          if (n.lens[256] === 0) {
            t.msg = "invalid code -- missing end-of-block", n.mode = z;
            break;
          }
          if (n.lenbits = 9, I = { bits: n.lenbits }, k = Ze(Sf, n.lens, 0, n.nlen, n.lencode, 0, n.work, I), n.lenbits = I.bits, k) {
            t.msg = "invalid literal/lengths set", n.mode = z;
            break;
          }
          if (n.distbits = 6, n.distcode = n.distdyn, I = { bits: n.distbits }, k = Ze(_f, n.lens, n.nlen, n.ndist, n.distcode, 0, n.work, I), n.distbits = I.bits, k) {
            t.msg = "invalid distances set", n.mode = z;
            break;
          }
          if (n.mode = Cn, e === An)
            break t;
        /* falls through */
        case Cn:
          n.mode = vn;
        /* falls through */
        case vn:
          if (a >= 6 && c >= 258) {
            t.next_out = i, t.avail_out = c, t.next_in = r, t.avail_in = a, n.hold = f, n.bits = l, jy(t, h), i = t.next_out, s = t.output, c = t.avail_out, r = t.next_in, o = t.input, a = t.avail_in, f = n.hold, l = n.bits, n.mode === At && (n.back = -1);
            break;
          }
          for (n.back = 0; x = n.lencode[f & (1 << n.lenbits) - 1], y = x >>> 24, m = x >>> 16 & 255, w = x & 65535, !(y <= l); ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          if (m && (m & 240) === 0) {
            for (_ = y, S = m, b = w; x = n.lencode[b + ((f & (1 << _ + S) - 1) >> _)], y = x >>> 24, m = x >>> 16 & 255, w = x & 65535, !(_ + y <= l); ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << l, l += 8;
            }
            f >>>= _, l -= _, n.back += _;
          }
          if (f >>>= y, l -= y, n.back += y, n.length = w, m === 0) {
            n.mode = vi;
            break;
          }
          if (m & 32) {
            n.back = -1, n.mode = At;
            break;
          }
          if (m & 64) {
            t.msg = "invalid literal/length code", n.mode = z;
            break;
          }
          n.extra = m & 15, n.mode = wi;
        /* falls through */
        case wi:
          if (n.extra) {
            for (E = n.extra; l < E; ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << l, l += 8;
            }
            n.length += f & (1 << n.extra) - 1, f >>>= n.extra, l -= n.extra, n.back += n.extra;
          }
          n.was = n.length, n.mode = bi;
        /* falls through */
        case bi:
          for (; x = n.distcode[f & (1 << n.distbits) - 1], y = x >>> 24, m = x >>> 16 & 255, w = x & 65535, !(y <= l); ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          if ((m & 240) === 0) {
            for (_ = y, S = m, b = w; x = n.distcode[b + ((f & (1 << _ + S) - 1) >> _)], y = x >>> 24, m = x >>> 16 & 255, w = x & 65535, !(_ + y <= l); ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << l, l += 8;
            }
            f >>>= _, l -= _, n.back += _;
          }
          if (f >>>= y, l -= y, n.back += y, m & 64) {
            t.msg = "invalid distance code", n.mode = z;
            break;
          }
          n.offset = w, n.extra = m & 15, n.mode = Ai;
        /* falls through */
        case Ai:
          if (n.extra) {
            for (E = n.extra; l < E; ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << l, l += 8;
            }
            n.offset += f & (1 << n.extra) - 1, f >>>= n.extra, l -= n.extra, n.back += n.extra;
          }
          if (n.offset > n.dmax) {
            t.msg = "invalid distance too far back", n.mode = z;
            break;
          }
          n.mode = Ci;
        /* falls through */
        case Ci:
          if (c === 0)
            break t;
          if (p = h - c, n.offset > p) {
            if (p = n.offset - p, p > n.whave && n.sane) {
              t.msg = "invalid distance too far back", n.mode = z;
              break;
            }
            p > n.wnext ? (p -= n.wnext, g = n.wsize - p) : g = n.wnext - p, p > n.length && (p = n.length), d = n.window;
          } else
            d = s, g = i - n.offset, p = n.length;
          p > c && (p = c), c -= p, n.length -= p;
          do
            s[i++] = d[g++];
          while (--p);
          n.length === 0 && (n.mode = vn);
          break;
        case vi:
          if (c === 0)
            break t;
          s[i++] = n.length, c--, n.mode = vn;
          break;
        case Lo:
          if (n.wrap) {
            for (; l < 32; ) {
              if (a === 0)
                break t;
              a--, f |= o[r++] << l, l += 8;
            }
            if (h -= c, t.total_out += h, n.total += h, n.wrap & 4 && h && (t.adler = n.check = /*UPDATE_CHECK(state.check, put - _out, _out);*/
            n.flags ? Y(n.check, s, h, i - h) : sn(n.check, s, h, i - h)), h = c, n.wrap & 4 && (n.flags ? f : ki(f)) !== n.check) {
              t.msg = "incorrect data check", n.mode = z;
              break;
            }
            f = 0, l = 0;
          }
          n.mode = Ii;
        /* falls through */
        case Ii:
          if (n.wrap && n.flags) {
            for (; l < 32; ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << l, l += 8;
            }
            if (n.wrap & 4 && f !== (n.total & 4294967295)) {
              t.msg = "incorrect length check", n.mode = z;
              break;
            }
            f = 0, l = 0;
          }
          n.mode = Oi;
        /* falls through */
        case Oi:
          k = tx;
          break t;
        case z:
          k = wf;
          break t;
        case Af:
          return bf;
        case Cf:
        /* falls through */
        default:
          return lt;
      }
  return t.next_out = i, t.avail_out = c, t.next_in = r, t.avail_in = a, n.hold = f, n.bits = l, (n.wsize || h !== t.avail_out && n.mode < z && (n.mode < Lo || e !== ri)) && Ef(t, t.output, t.next_out, h - t.avail_out), u -= t.avail_in, h -= t.avail_out, t.total_in += u, t.total_out += h, n.total += h, n.wrap & 4 && h && (t.adler = n.check = /*UPDATE_CHECK(state.check, strm.next_out - _out, _out);*/
  n.flags ? Y(n.check, s, h, t.next_out - h) : sn(n.check, s, h, t.next_out - h)), t.data_type = n.bits + (n.last ? 64 : 0) + (n.mode === At ? 128 : 0) + (n.mode === Cn || n.mode === Mo ? 256 : 0), (u === 0 && h === 0 || e === ri) && k === ee && (k = nx), k;
}, ux = (t) => {
  if (oe(t))
    return lt;
  let e = t.state;
  return e.window && (e.window = null), t.state = null, ee;
}, hx = (t, e) => {
  if (oe(t))
    return lt;
  const n = t.state;
  return (n.wrap & 2) === 0 ? lt : (n.head = e, e.done = !1, ee);
}, gx = (t, e) => {
  const n = e.length;
  let o, s, r;
  return oe(t) || (o = t.state, o.wrap !== 0 && o.mode !== Wn) ? lt : o.mode === Wn && (s = 1, s = sn(s, e, n, 0), s !== o.check) ? wf : (r = Ef(t, e, n, n), r ? (o.mode = Af, bf) : (o.havedict = 1, ee));
};
var px = If, dx = Of, mx = vf, yx = cx, xx = kf, Sx = lx, _x = ux, wx = hx, bx = gx, Ax = "pako inflate (from Nodeca project)", pt = {
  inflateReset: px,
  inflateReset2: dx,
  inflateResetKeep: mx,
  inflateInit: yx,
  inflateInit2: xx,
  inflate: Sx,
  inflateEnd: _x,
  inflateGetHeader: wx,
  inflateSetDictionary: bx,
  inflateInfo: Ax
};
function Cx() {
  this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
}
var vx = Cx;
const Tf = Object.prototype.toString, {
  Z_NO_FLUSH: Ix,
  Z_FINISH: Ti,
  Z_OK: xe,
  Z_STREAM_END: $o,
  Z_NEED_DICT: No,
  Z_STREAM_ERROR: Ox,
  Z_DATA_ERROR: Di,
  Z_MEM_ERROR: kx,
  Z_BUF_ERROR: Ri
} = ao, Ex = {
  chunkSize: 1024 * 64,
  windowBits: 15,
  to: ""
};
function ho(t) {
  this.options = fo.assign({}, Ex, t || {});
  const e = this.options;
  e.raw && e.windowBits >= 0 && e.windowBits < 16 && (e.windowBits = -e.windowBits, e.windowBits === 0 && (e.windowBits = -15)), e.windowBits >= 0 && e.windowBits < 16 && !(t && t.windowBits) && (e.windowBits += 32), e.windowBits > 15 && e.windowBits < 48 && (e.windowBits & 15) === 0 && (e.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new yf(), this.strm.avail_out = 0;
  let n = pt.inflateInit2(
    this.strm,
    e.windowBits
  );
  if (n !== xe)
    throw new Error(Jt[n]);
  if (this.header = new vx(), pt.inflateGetHeader(this.strm, this.header), e.dictionary && (typeof e.dictionary == "string" ? e.dictionary = an.string2buf(e.dictionary) : Tf.call(e.dictionary) === "[object ArrayBuffer]" && (e.dictionary = new Uint8Array(e.dictionary)), e.raw && (n = pt.inflateSetDictionary(this.strm, e.dictionary), n !== xe)))
    throw new Error(Jt[n]);
}
ho.prototype.push = function(t, e) {
  const n = this.strm, o = this.options.chunkSize, s = this.options.dictionary;
  let r, i, a;
  if (this.ended) return !1;
  for (e === ~~e ? i = e : i = e === !0 ? Ti : Ix, Tf.call(t) === "[object ArrayBuffer]" ? n.input = new Uint8Array(t) : n.input = t, n.next_in = 0, n.avail_in = n.input.length; ; ) {
    for (n.avail_out === 0 && (n.output = new Uint8Array(o), n.next_out = 0, n.avail_out = o), r = pt.inflate(n, i), r === No && s && (r = pt.inflateSetDictionary(n, s), r === xe ? r = pt.inflate(n, i) : r === Di && (r = No)); n.avail_in > 0 && r === $o && n.state.wrap & 2 && n.state.flags !== 0 && n.input[n.next_in] !== 0; )
      pt.inflateReset(n), r = pt.inflate(n, i);
    switch (r) {
      case Ox:
      case Di:
      case No:
      case kx:
        return this.onEnd(r), this.ended = !0, !1;
    }
    if (a = n.avail_out, n.next_out && (n.avail_out === 0 || r === $o || i > 0))
      if (this.options.to === "string") {
        let c = an.utf8border(n.output, n.next_out), f = n.next_out - c, l = an.buf2string(n.output, c);
        n.next_out = f, n.avail_out = o - f, f && n.output.set(n.output.subarray(c, c + f), 0), this.onData(l);
      } else
        this.onData(n.output.length === n.next_out ? n.output : n.output.subarray(0, n.next_out)), n.avail_out = 0, n.next_out = 0;
    if (!((r === xe || r === Ri) && a === 0)) {
      if (r === $o)
        return r = pt.inflateEnd(this.strm), this.onEnd(r), this.ended = !0, !0;
      if (n.avail_in === 0) {
        if (i === Ti)
          return r = pt.inflateEnd(this.strm), this.onEnd(r === xe ? Ri : r), this.ended = !0, !1;
        break;
      }
    }
  }
  return !0;
};
ho.prototype.onData = function(t) {
  this.chunks.push(t);
};
ho.prototype.onEnd = function(t) {
  t === xe && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = fo.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;
};
function Tx(t, e) {
  const n = new ho(e);
  if (n.push(t, !0), n.err) throw n.msg || Jt[n.err];
  return n.result;
}
var Dx = Tx, Rx = {
  inflate: Dx
};
const { deflate: Fx } = Hy, { inflate: Mx } = Rx;
var Fi = Fx, Mi = Mx;
const Df = 2001684038, gs = 44, ps = 20, jn = 12, Yn = 16;
function Rf(t) {
  const e = new DataView(t), n = new Uint8Array(t);
  if (e.getUint32(0) !== Df)
    throw new Error("Invalid WOFF1 signature");
  const s = e.getUint32(4), r = e.getUint16(12), i = e.getUint32(24), a = e.getUint32(28), c = e.getUint32(36), f = e.getUint32(40), l = [];
  let u = gs;
  for (let O = 0; O < r; O++)
    l.push({
      tag: String.fromCharCode(
        e.getUint8(u),
        e.getUint8(u + 1),
        e.getUint8(u + 2),
        e.getUint8(u + 3)
      ),
      offset: e.getUint32(u + 4),
      compLength: e.getUint32(u + 8),
      origLength: e.getUint32(u + 12),
      origChecksum: e.getUint32(u + 16)
    }), u += ps;
  const h = l.map((O) => {
    const I = n.subarray(
      O.offset,
      O.offset + O.compLength
    );
    let E;
    if (O.compLength < O.origLength) {
      if (E = Mi(I), E.length !== O.origLength)
        throw new Error(
          `WOFF1 table '${O.tag}': decompressed size ${E.length} !== expected ${O.origLength}`
        );
    } else
      E = I;
    return {
      tag: O.tag,
      checksum: O.origChecksum,
      data: E,
      length: O.origLength,
      paddedLength: O.origLength + (4 - O.origLength % 4) % 4
    };
  }), p = jn + r * Yn;
  let g = p + (4 - p % 4) % 4;
  const { searchRange: d, entrySelector: x, rangeShift: y } = Lx(r);
  let m = g;
  for (const O of h)
    m += O.paddedLength;
  const w = new ArrayBuffer(m), _ = new DataView(w), S = new Uint8Array(w);
  _.setUint32(0, s), _.setUint16(4, r), _.setUint16(6, d), _.setUint16(8, x), _.setUint16(10, y);
  const b = h.map((O, I) => ({ ...O, originalIndex: I })).sort((O, I) => O.tag < I.tag ? -1 : O.tag > I.tag ? 1 : 0);
  for (let O = 0; O < b.length; O++) {
    const I = b[O], E = jn + O * Yn;
    for (let T = 0; T < 4; T++)
      _.setUint8(E + T, I.tag.charCodeAt(T));
    _.setUint32(E + 4, I.checksum), _.setUint32(E + 8, g), _.setUint32(E + 12, I.length), S.set(I.data, g), g += I.paddedLength;
  }
  let A = null;
  if (i && a) {
    const O = n.subarray(i, i + a);
    A = Mi(O);
  }
  let k = null;
  return c && f && (k = n.slice(c, c + f)), { sfnt: w, metadata: A, privateData: k };
}
function ds(t, e = null, n = null) {
  const o = new DataView(t), s = new Uint8Array(t), r = o.getUint32(0), i = o.getUint16(4), a = [];
  for (let b = 0; b < i; b++) {
    const A = jn + b * Yn;
    a.push({
      tag: String.fromCharCode(
        o.getUint8(A),
        o.getUint8(A + 1),
        o.getUint8(A + 2),
        o.getUint8(A + 3)
      ),
      checksum: o.getUint32(A + 4),
      offset: o.getUint32(A + 8),
      length: o.getUint32(A + 12)
    });
  }
  const c = a.map((b) => {
    const A = s.subarray(b.offset, b.offset + b.length), k = Fi(A), O = k.length < b.length;
    return {
      tag: b.tag,
      origChecksum: b.checksum,
      origLength: b.length,
      data: O ? k : A,
      compLength: O ? k.length : b.length
    };
  });
  let f = null, l = 0;
  e && e.length > 0 && (l = e.length, f = Fi(e));
  let h = gs + i * ps;
  h += (4 - h % 4) % 4;
  for (const b of c)
    b.woffOffset = h, h += b.compLength, h += (4 - h % 4) % 4;
  let p = 0, g = 0;
  f && (p = h, g = f.length, h += g, h += (4 - h % 4) % 4);
  let d = 0, x = 0;
  n && n.length > 0 && (d = h, x = n.length, h += x);
  const y = h;
  let m = jn + i * Yn;
  for (const b of c)
    m += b.origLength + (4 - b.origLength % 4) % 4;
  const w = new ArrayBuffer(y), _ = new DataView(w), S = new Uint8Array(w);
  _.setUint32(0, Df), _.setUint32(4, r), _.setUint32(8, y), _.setUint16(12, i), _.setUint16(14, 0), _.setUint32(16, m), _.setUint16(20, 0), _.setUint16(22, 0), _.setUint32(24, p), _.setUint32(28, g), _.setUint32(32, l), _.setUint32(36, d), _.setUint32(40, x);
  for (let b = 0; b < c.length; b++) {
    const A = c[b], k = gs + b * ps;
    for (let O = 0; O < 4; O++)
      _.setUint8(k + O, A.tag.charCodeAt(O));
    _.setUint32(k + 4, A.woffOffset), _.setUint32(k + 8, A.compLength), _.setUint32(k + 12, A.origLength), _.setUint32(k + 16, A.origChecksum);
  }
  for (const b of c)
    S.set(b.data, b.woffOffset);
  return f && S.set(f, p), n && n.length > 0 && S.set(n, d), w;
}
function Lx(t) {
  let e = 1, n = 0;
  for (; e * 2 <= t; )
    e *= 2, n++;
  e *= 16;
  const o = t * 16 - e;
  return { searchRange: e, entrySelector: n, rangeShift: o };
}
let Zn = null, Se = null;
async function Ff() {
  if (!Se)
    try {
      const { brotliCompressSync: t, brotliDecompressSync: e } = await import("node:zlib");
      if (typeof t != "function" || typeof e != "function")
        throw new Error("node:zlib brotli functions unavailable");
      Zn = (n) => new Uint8Array(t(n)), Se = (n) => new Uint8Array(e(n));
    } catch {
      const t = await import("brotli-wasm"), e = await (t.default || t);
      Zn = e.compress, Se = e.decompress;
    }
}
function Mf() {
  if (!Se)
    throw new Error(
      "WOFF2 support requires initialization. Call `await initWoff2()` before importing or exporting WOFF2 files."
    );
}
const Lf = 2001684018, ms = 48, cn = 12, fn = 16, ys = [
  "cmap",
  "head",
  "hhea",
  "hmtx",
  "maxp",
  "name",
  "OS/2",
  "post",
  // 0-7
  "cvt ",
  "fpgm",
  "glyf",
  "loca",
  "prep",
  "CFF ",
  "VORG",
  "EBDT",
  // 8-15
  "EBLC",
  "gasp",
  "hdmx",
  "kern",
  "LTSH",
  "PCLT",
  "VDMX",
  "vhea",
  // 16-23
  "vmtx",
  "BASE",
  "GDEF",
  "GPOS",
  "GSUB",
  "EBSC",
  "JSTF",
  "MATH",
  // 24-31
  "CBDT",
  "CBLC",
  "COLR",
  "CPAL",
  "SVG ",
  "sbix",
  "acnt",
  "avar",
  // 32-39
  "bdat",
  "bloc",
  "bsln",
  "cvar",
  "fdsc",
  "feat",
  "fmtx",
  "fvar",
  // 40-47
  "gvar",
  "hsty",
  "just",
  "lcar",
  "mort",
  "morx",
  "opbd",
  "prop",
  // 48-55
  "trak",
  "Zapf",
  "Silf",
  "Glat",
  "Gloc",
  "Feat",
  "Sill"
  // 56-62
], Bf = /* @__PURE__ */ new Map();
for (let t = 0; t < ys.length; t++) Bf.set(ys[t], t);
function Li(t, e) {
  let n = 0;
  for (let o = 0; o < 5; o++) {
    const s = t[e + o];
    if (o === 0 && s === 128)
      throw new Error("UIntBase128: leading zero");
    if (n & 4261412864)
      throw new Error("UIntBase128: overflow");
    if (n = n << 7 | s & 127, !(s & 128))
      return { value: n >>> 0, bytesRead: o + 1 };
  }
  throw new Error("UIntBase128: exceeds 5 bytes");
}
function Bx(t) {
  const e = [];
  let n = t >>> 0;
  const o = [];
  do
    o.push(n & 127), n >>>= 7;
  while (n > 0);
  o.reverse();
  for (let s = 0; s < o.length; s++)
    e.push(s < o.length - 1 ? o[s] | 128 : o[s]);
  return e;
}
function _e(t, e) {
  const n = t[e];
  return n === 253 ? { value: t[e + 1] << 8 | t[e + 2], bytesRead: 3 } : n === 255 ? { value: t[e + 1] + 253, bytesRead: 2 } : n === 254 ? { value: t[e + 1] + 506, bytesRead: 2 } : { value: n, bytesRead: 1 };
}
const Vx = $x();
function $x() {
  const t = [];
  for (let s = 0; s < 10; s++)
    t.push({
      xBits: 0,
      yBits: 8,
      deltaX: 0,
      deltaY: (s >> 1) * 256,
      xSign: 0,
      ySign: s & 1 ? 1 : -1
    });
  for (let s = 0; s < 10; s++)
    t.push({
      xBits: 8,
      yBits: 0,
      deltaX: (s >> 1) * 256,
      deltaY: 0,
      xSign: s & 1 ? 1 : -1,
      ySign: 0
    });
  const e = [1, 17, 33, 49], n = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1]
  ];
  for (const s of e)
    for (const r of e)
      for (const [i, a] of n)
        t.push({
          xBits: 4,
          yBits: 4,
          deltaX: s,
          deltaY: r,
          xSign: i,
          ySign: a
        });
  const o = [1, 257, 513];
  for (const s of o)
    for (const r of o)
      for (const [i, a] of n)
        t.push({
          xBits: 8,
          yBits: 8,
          deltaX: s,
          deltaY: r,
          xSign: i,
          ySign: a
        });
  for (const [s, r] of n)
    t.push({
      xBits: 12,
      yBits: 12,
      deltaX: 0,
      deltaY: 0,
      xSign: s,
      ySign: r
    });
  for (const [s, r] of n)
    t.push({
      xBits: 16,
      yBits: 16,
      deltaX: 0,
      deltaY: 0,
      xSign: s,
      ySign: r
    });
  return t;
}
function Nx(t, e, n) {
  const o = t & 127, s = !(t & 128), r = Vx[o];
  let i = 0, a = 0, c = n;
  if (r.xBits === 0 && r.yBits === 8)
    a = r.ySign * (e[c++] + r.deltaY);
  else if (r.xBits === 8 && r.yBits === 0)
    i = r.xSign * (e[c++] + r.deltaX);
  else if (r.xBits === 4 && r.yBits === 4) {
    const f = e[c++];
    i = r.xSign * ((f >> 4 & 15) + r.deltaX), a = r.ySign * ((f & 15) + r.deltaY);
  } else if (r.xBits === 8 && r.yBits === 8)
    i = r.xSign * (e[c++] + r.deltaX), a = r.ySign * (e[c++] + r.deltaY);
  else if (r.xBits === 12 && r.yBits === 12) {
    const f = e[c++], l = e[c++], u = e[c++];
    i = r.xSign * ((f << 4 | l >> 4) + r.deltaX), a = r.ySign * (((l & 15) << 8 | u) + r.deltaY);
  } else r.xBits === 16 && r.yBits === 16 && (i = r.xSign * ((e[c++] << 8 | e[c++]) + r.deltaX), a = r.ySign * ((e[c++] << 8 | e[c++]) + r.deltaY));
  return { dx: i, dy: a, onCurve: s, bytesConsumed: c - n };
}
function Gx(t, e, n, o, s, r, i, a, c) {
  const f = [];
  mt(f, t), mt(f, s), mt(f, r), mt(f, i), mt(f, a);
  for (const g of e) Ss(f, g);
  Ss(f, o.length);
  for (let g = 0; g < o.length; g++) f.push(o[g]);
  const l = [], u = [], h = [];
  for (let g = 0; g < n.length; g++) {
    const { dx: d, dy: x, onCurve: y } = n[g];
    let m = y ? 1 : 0;
    if (g === 0 && c && (m |= 64), d === 0)
      m |= 16;
    else if (d >= -255 && d <= 255)
      m |= 2, d > 0 ? (m |= 16, u.push(d)) : u.push(-d);
    else {
      const w = d & 65535;
      u.push(w >> 8 & 255, w & 255);
    }
    if (x === 0)
      m |= 32;
    else if (x >= -255 && x <= 255)
      m |= 4, x > 0 ? (m |= 32, h.push(x)) : h.push(-x);
    else {
      const w = x & 65535;
      h.push(w >> 8 & 255, w & 255);
    }
    l.push(m);
  }
  let p = 0;
  for (; p < l.length; ) {
    const g = l[p];
    let d = 0;
    for (; p + d + 1 < l.length && l[p + d + 1] === g && d < 255; )
      d++;
    d > 0 ? (f.push(g | 8), f.push(d), p += d + 1) : (f.push(g), p++);
  }
  for (const g of u) f.push(g);
  for (const g of h) f.push(g);
  return f;
}
function Px(t, e, n, o, s, r) {
  const i = [];
  mt(i, -1), mt(i, n), mt(i, o), mt(i, s), mt(i, r);
  for (let a = 0; a < t.length; a++) i.push(t[a]);
  if (e && e.length > 0) {
    Ss(i, e.length);
    for (let a = 0; a < e.length; a++) i.push(e[a]);
  }
  return i;
}
function Ux(t, e) {
  const n = t;
  let o = 0;
  const s = n[o] << 8 | n[o + 1];
  if (o += 2, s !== 0) throw new Error("WOFF2 glyf transform: reserved != 0");
  const r = n[o] << 8 | n[o + 1];
  o += 2;
  const i = n[o] << 8 | n[o + 1];
  o += 2;
  const a = n[o] << 8 | n[o + 1];
  o += 2;
  const c = vt(n, o);
  o += 4;
  const f = vt(n, o);
  o += 4;
  const l = vt(n, o);
  o += 4;
  const u = vt(n, o);
  o += 4;
  const h = vt(n, o);
  o += 4;
  const p = vt(n, o);
  o += 4;
  const g = vt(n, o);
  o += 4;
  const d = o, x = d + c, y = x + f, m = y + l, w = m + u, _ = w + h, S = _ + p, b = 4 * Math.floor((i + 31) / 32), A = _, k = A + b;
  function O(J) {
    const at = J >> 3, Et = 7 - (J & 7);
    return !!(n[A + at] & 1 << Et);
  }
  const I = !!(r & 1), E = S + g;
  function T(J) {
    if (!I) return !1;
    const at = J >> 3, Et = 7 - (J & 7);
    return !!(n[E + at] & 1 << Et);
  }
  let D = d, R = x, M = y, L = m, H = w, P = k, Z = S;
  const q = [], K = [0];
  let _t = 0;
  for (let J = 0; J < i; J++) {
    const at = ct(n, D);
    if (D += 2, at === 0) {
      q.push(null), K.push(_t);
      continue;
    }
    if (at > 0) {
      const Et = [];
      let re = 0;
      for (let ut = 0; ut < at; ut++) {
        const { value: bt, bytesRead: ie } = _e(n, R);
        R += ie, re += bt, Et.push(re - 1);
      }
      const De = [];
      for (let ut = 0; ut < re; ut++) {
        const bt = n[M++], { dx: ie, dy: Jf, onCurve: Qf, bytesConsumed: tl } = Nx(
          bt,
          n,
          L
        );
        L += tl, De.push({ dx: ie, dy: Jf, onCurve: Qf });
      }
      const { value: Re, bytesRead: go } = _e(
        n,
        L
      );
      L += go;
      const po = n.subarray(
        Z,
        Z + Re
      );
      Z += Re;
      let Ut, zt, wt, Ht;
      if (O(J))
        Ut = ct(n, P), P += 2, zt = ct(n, P), P += 2, wt = ct(n, P), P += 2, Ht = ct(n, P), P += 2;
      else {
        let ut = 0, bt = 0;
        Ut = 32767, zt = 32767, wt = -32768, Ht = -32768;
        for (const ie of De)
          ut += ie.dx, bt += ie.dy, ut < Ut && (Ut = ut), ut > wt && (wt = ut), bt < zt && (zt = bt), bt > Ht && (Ht = bt);
      }
      const ot = Gx(
        at,
        Et,
        De,
        po,
        Ut,
        zt,
        wt,
        Ht,
        T(J)
      );
      q.push(ot);
      const mo = ot.length + (ot.length % 2 ? 1 : 0);
      _t += mo, K.push(_t);
    } else {
      const Et = H;
      let re = !1;
      for (; ; ) {
        const ot = n[H] << 8 | n[H + 1];
        if (H += 2, H += 2, ot & 1 ? H += 4 : H += 2, ot & 8 ? H += 2 : ot & 64 ? H += 4 : ot & 128 && (H += 8), ot & 256 && (re = !0), !(ot & 32)) break;
      }
      const De = n.subarray(Et, H);
      let Re = new Uint8Array(0);
      if (re) {
        const { value: ot, bytesRead: mo } = _e(
          n,
          L
        );
        L += mo, Re = n.subarray(Z, Z + ot), Z += ot;
      }
      const go = ct(n, P);
      P += 2;
      const po = ct(n, P);
      P += 2;
      const Ut = ct(n, P);
      P += 2;
      const zt = ct(n, P);
      P += 2;
      const wt = Px(
        De,
        Re,
        go,
        po,
        Ut,
        zt
      );
      q.push(wt);
      const Ht = wt.length + (wt.length % 2 ? 1 : 0);
      _t += Ht, K.push(_t);
    }
  }
  const se = new Uint8Array(_t);
  let gn = 0;
  for (const J of q)
    if (J !== null) {
      for (let at = 0; at < J.length; at++)
        se[gn++] = J[at];
      J.length % 2 && gn++;
    }
  return { glyfBytes: se, locaOffsets: K, indexFormat: a };
}
function zx(t, e, n, o, s) {
  const r = t;
  let i = 0;
  const a = r[i++], c = !(a & 1), f = !(a & 2), l = [];
  for (let y = 0; y < e; y++)
    l.push(r[i] << 8 | r[i + 1]), i += 2;
  const u = [];
  if (c)
    for (let y = 0; y < e; y++)
      u.push(ct(r, i)), i += 2;
  else
    for (let y = 0; y < e; y++)
      u.push(Bi(o, s, y));
  const h = n - e, p = [];
  if (f)
    for (let y = 0; y < h; y++)
      p.push(ct(r, i)), i += 2;
  else
    for (let y = 0; y < h; y++)
      p.push(
        Bi(o, s, e + y)
      );
  const g = e * 4 + h * 2, d = new Uint8Array(g);
  let x = 0;
  for (let y = 0; y < e; y++) {
    d[x++] = l[y] >> 8 & 255, d[x++] = l[y] & 255;
    const m = u[y] & 65535;
    d[x++] = m >> 8 & 255, d[x++] = m & 255;
  }
  for (let y = 0; y < h; y++) {
    const m = p[y] & 65535;
    d[x++] = m >> 8 & 255, d[x++] = m & 255;
  }
  return d;
}
function Bi(t, e, n) {
  const o = e[n], s = e[n + 1];
  return o === s ? 0 : ct(t, o + 2);
}
function Hx(t, e) {
  if (e === 0) {
    const o = new Uint8Array(t.length * 2);
    for (let s = 0; s < t.length; s++) {
      const r = t[s] >> 1;
      o[s * 2] = r >> 8 & 255, o[s * 2 + 1] = r & 255;
    }
    return o;
  }
  const n = new Uint8Array(t.length * 4);
  for (let o = 0; o < t.length; o++) {
    const s = t[o];
    n[o * 4] = s >> 24 & 255, n[o * 4 + 1] = s >> 16 & 255, n[o * 4 + 2] = s >> 8 & 255, n[o * 4 + 3] = s & 255;
  }
  return n;
}
function Vf(t) {
  Mf();
  const e = new Uint8Array(t), n = new DataView(t);
  if (n.getUint32(0) !== Lf)
    throw new Error("Invalid WOFF2 signature");
  const s = n.getUint32(4), r = n.getUint16(12), i = n.getUint32(20), a = n.getUint32(28), c = n.getUint32(32), f = n.getUint32(40), l = n.getUint32(44);
  let u = ms;
  const h = [];
  for (let T = 0; T < r; T++) {
    const D = e[u++], R = D & 63, M = D >> 6 & 3;
    let L;
    R === 63 ? (L = String.fromCharCode(
      e[u],
      e[u + 1],
      e[u + 2],
      e[u + 3]
    ), u += 4) : L = ys[R];
    const { value: H, bytesRead: P } = Li(
      e,
      u
    );
    u += P;
    let Z = H;
    const q = L === "glyf" || L === "loca", K = L === "hmtx";
    if (q && M === 0 || K && M === 1 || !q && !K && M !== 0) {
      const { value: se, bytesRead: gn } = Li(e, u);
      u += gn, Z = se;
    }
    L === "loca" && M === 0 && (Z = 0), h.push({
      tag: L,
      transformVersion: M,
      origLength: H,
      transformLength: Z,
      isTransformed: q ? M === 0 : K ? M === 1 : M !== 0
    });
  }
  let p = null;
  if (s === 1953784678) {
    const T = vt(e, u);
    u += 4;
    const { value: D, bytesRead: R } = _e(
      e,
      u
    );
    u += R;
    const M = [];
    for (let L = 0; L < D; L++) {
      const { value: H, bytesRead: P } = _e(
        e,
        u
      );
      u += P;
      const Z = vt(e, u);
      u += 4;
      const q = [];
      for (let K = 0; K < H; K++) {
        const { value: _t, bytesRead: se } = _e(e, u);
        u += se, q.push(_t);
      }
      M.push({
        numTables: H,
        flavor: Z,
        tableIndices: q
      });
    }
    p = { version: T, numFonts: D, fonts: M };
  }
  const g = u, d = e.subarray(
    g,
    g + i
  ), x = Se(d);
  let y = 0;
  const m = /* @__PURE__ */ new Map();
  for (const T of h) {
    const D = T.isTransformed ? T.transformLength : T.origLength, R = x.subarray(y, y + D);
    y += D, m.set(T.tag, { data: R, entry: T });
  }
  const w = /* @__PURE__ */ new Map();
  let _ = null;
  const S = m.get("glyf"), b = m.get("loca");
  S && S.entry.isTransformed && (b && b.entry.origLength, _ = Ux(S.data), w.set("glyf", _.glyfBytes), w.set(
    "loca",
    Hx(_.locaOffsets, _.indexFormat)
  ));
  const A = m.get("hmtx");
  if (A && A.entry.isTransformed && _) {
    const T = m.get("hhea"), D = m.get("maxp");
    let R = 0, M = 0;
    T && (R = T.data[34] << 8 | T.data[35]), D && (M = D.data[4] << 8 | D.data[5]), w.set(
      "hmtx",
      zx(
        A.data,
        R,
        M,
        _.glyfBytes,
        _.locaOffsets
      )
    );
  }
  const k = [];
  for (const T of h) {
    const D = T.tag;
    let R;
    w.has(D) ? R = w.get(D) : R = m.get(D).data, k.push({ tag: D, data: R, length: R.length });
  }
  let O;
  p ? O = Wx(p, k) : O = $f(s, k);
  let I = null;
  if (a && c) {
    const T = e.subarray(a, a + c);
    I = Se(T);
  }
  let E = null;
  return f && l && (E = e.slice(f, f + l)), { sfnt: O.buffer, metadata: I, privateData: E };
}
function $f(t, e) {
  const n = e.length, { searchRange: o, entrySelector: s, rangeShift: r } = jx(n), i = cn + n * fn;
  let a = i + (4 - i % 4) % 4;
  const c = e.map((h, p) => ({ ...h, index: p })).sort((h, p) => h.tag < p.tag ? -1 : h.tag > p.tag ? 1 : 0);
  let f = a;
  for (const h of c)
    f += h.length + (4 - h.length % 4) % 4;
  const l = new Uint8Array(f), u = new DataView(l.buffer);
  u.setUint32(0, t), u.setUint16(4, n), u.setUint16(6, o), u.setUint16(8, s), u.setUint16(10, r);
  for (let h = 0; h < c.length; h++) {
    const p = c[h], g = cn + h * fn;
    for (let x = 0; x < 4; x++)
      l[g + x] = p.tag.charCodeAt(x);
    const d = Nf(p.data);
    u.setUint32(g + 4, d), u.setUint32(g + 8, a), u.setUint32(g + 12, p.length), l.set(
      p.data instanceof Uint8Array ? p.data : new Uint8Array(p.data),
      a
    ), a += p.length + (4 - p.length % 4) % 4;
  }
  return Yx(l, c), l;
}
function Wx(t, e, n) {
  const o = [];
  for (const u of t.fonts) {
    const h = u.tableIndices.map((g) => e[g]), p = $f(u.flavor, h);
    o.push(p);
  }
  const s = o.length;
  let i = 12 + s * 4;
  i += (4 - i % 4) % 4;
  const a = [];
  let c = i;
  for (const u of o)
    a.push(c), c += u.length, c += (4 - c % 4) % 4;
  const f = new Uint8Array(c), l = new DataView(f.buffer);
  l.setUint32(0, 1953784678), l.setUint32(4, t.version), l.setUint32(8, s);
  for (let u = 0; u < s; u++)
    l.setUint32(12 + u * 4, a[u]);
  for (let u = 0; u < s; u++)
    f.set(o[u], a[u]);
  return f;
}
function xs(t, e = null, n = null) {
  Mf();
  const o = new DataView(t), s = new Uint8Array(t), r = o.getUint32(0), i = o.getUint16(4), a = [];
  for (let R = 0; R < i; R++) {
    const M = cn + R * fn, L = String.fromCharCode(
      o.getUint8(M),
      o.getUint8(M + 1),
      o.getUint8(M + 2),
      o.getUint8(M + 3)
    );
    a.push({
      tag: L,
      checksum: o.getUint32(M + 4),
      offset: o.getUint32(M + 8),
      length: o.getUint32(M + 12)
    });
  }
  const c = a.filter((R) => R.tag !== "DSIG"), f = [], l = [];
  let u = cn + c.length * fn;
  for (const R of c) {
    const M = s.subarray(R.offset, R.offset + R.length), L = Bf.get(R.tag), P = R.tag === "glyf" || R.tag === "loca" ? 3 : 0, q = [(L !== void 0 ? L : 63) | P << 6];
    if (L === void 0)
      for (let K = 0; K < 4; K++) q.push(R.tag.charCodeAt(K));
    q.push(...Bx(R.length)), f.push(q), l.push(M), u += R.length + (4 - R.length % 4) % 4;
  }
  let h = 0;
  for (const R of l) h += R.length;
  const p = new Uint8Array(h);
  let g = 0;
  for (const R of l)
    p.set(R, g), g += R.length;
  const d = Zn(p);
  let x = null, y = 0;
  e && e.length > 0 && (y = e.length, x = Zn(e));
  const m = [];
  for (const R of f) m.push(...R);
  let _ = ms + m.length;
  const S = _;
  _ += d.length;
  let b = 0, A = 0;
  x && (_ += (4 - _ % 4) % 4, b = _, A = x.length, _ += A);
  let k = 0, O = 0;
  n && n.length > 0 && (_ += (4 - _ % 4) % 4, k = _, O = n.length, _ += O);
  const I = _, E = new ArrayBuffer(I), T = new DataView(E), D = new Uint8Array(E);
  T.setUint32(0, Lf), T.setUint32(4, r), T.setUint32(8, I), T.setUint16(12, c.length), T.setUint16(14, 0), T.setUint32(16, u), T.setUint32(20, d.length), T.setUint16(24, 0), T.setUint16(26, 0), T.setUint32(28, b), T.setUint32(32, A), T.setUint32(36, y), T.setUint32(40, k), T.setUint32(44, O);
  for (let R = 0; R < m.length; R++)
    D[ms + R] = m[R];
  return D.set(
    d instanceof Uint8Array ? d : new Uint8Array(d),
    S
  ), x && D.set(
    x instanceof Uint8Array ? x : new Uint8Array(x),
    b
  ), n && n.length > 0 && D.set(n, k), E;
}
function vt(t, e) {
  return (t[e] << 24 | t[e + 1] << 16 | t[e + 2] << 8 | t[e + 3]) >>> 0;
}
function ct(t, e) {
  const n = t[e] << 8 | t[e + 1];
  return n > 32767 ? n - 65536 : n;
}
function mt(t, e) {
  const n = e & 65535;
  t.push(n >> 8 & 255, n & 255);
}
function Ss(t, e) {
  t.push(e >> 8 & 255, e & 255);
}
function jx(t) {
  let e = 1, n = 0;
  for (; e * 2 <= t; )
    e *= 2, n++;
  e *= 16;
  const o = t * 16 - e;
  return { searchRange: e, entrySelector: n, rangeShift: o };
}
function Nf(t) {
  let e = 0;
  const n = t.length, o = n + (4 - n % 4) % 4;
  for (let s = 0; s < o; s += 4)
    e = e + ((t[s] || 0) << 24 | (t[s + 1] || 0) << 16 | (t[s + 2] || 0) << 8 | (t[s + 3] || 0)) >>> 0;
  return e;
}
function Yx(t, e) {
  let n = -1;
  for (const r of e)
    if (r.tag === "head") {
      const i = t[4] << 8 | t[5];
      for (let a = 0; a < i; a++) {
        const c = cn + a * fn;
        if (String.fromCharCode(
          t[c],
          t[c + 1],
          t[c + 2],
          t[c + 3]
        ) === "head") {
          n = t[c + 8] << 24 | t[c + 9] << 16 | t[c + 10] << 8 | t[c + 11];
          break;
        }
      }
      break;
    }
  if (n < 0) return;
  t[n + 8] = 0, t[n + 9] = 0, t[n + 10] = 0, t[n + 11] = 0;
  const s = 2981146554 - Nf(t) >>> 0;
  t[n + 8] = s >> 24 & 255, t[n + 9] = s >> 16 & 255, t[n + 10] = s >> 8 & 255, t[n + 11] = s & 255;
}
const Zx = {
  cmap: P0,
  head: lc,
  hhea: Np,
  HVAR: Wp,
  hmtx: Pp,
  maxp: kd,
  MVAR: Ld,
  name: Ud,
  hdmx: Mp,
  BASE: f0,
  JSTF: nd,
  MATH: Cd,
  MERG: Td,
  meta: Fd,
  DSIG: kg,
  LTSH: wd,
  CBLC: me,
  CBDT: ks,
  "OS/2": Hd,
  kern: ud,
  PCLT: Yd,
  VDMX: u1,
  post: Ic,
  STAT: o1,
  "CFF ": $a,
  CFF2: Oh,
  VORG: Dh,
  fvar: $g,
  avar: Mh,
  loca: Zc,
  glyf: X1,
  gvar: om,
  GDEF: Hg,
  GPOS: rp,
  GSUB: Cp,
  "cvt ": G1,
  cvar: $1,
  fpgm: U1,
  prep: am,
  gasp: H1,
  vhea: m1,
  VVAR: b1,
  vmtx: x1,
  COLR: bg,
  CPAL: Cg,
  EBDT: Dg,
  EBLC: Fg,
  EBSC: Lg,
  bloc: I0,
  bdat: x0,
  sbix: Jd,
  ltag: Sd,
  "SVG ": i1
}, Vi = 12, $i = 16;
function Xx(t, e) {
  const n = t.padEnd(4, " "), o = e.padEnd(4, " ");
  for (let s = 0; s < 4; s++) {
    const r = n.charCodeAt(s) - o.charCodeAt(s);
    if (r !== 0) return r;
  }
  return 0;
}
function qx(t) {
  let e = 0;
  const n = t.length, o = n & -4, s = new DataView(t.buffer, t.byteOffset, t.byteLength);
  for (let r = 0; r < o; r += 4)
    e = e + s.getUint32(r) >>> 0;
  if (n & 3) {
    let r = 0;
    for (let i = o; i < n; i++)
      r |= t[i] << 24 - 8 * (i - o);
    e = e + r >>> 0;
  }
  return e;
}
const Kx = /* @__PURE__ */ new Set([
  "sfnt",
  "woff",
  "woff2",
  "cff",
  "ttf",
  "otf"
]), Ni = {
  ttf: "truetype",
  otf: "cff"
};
function Jx(t) {
  if (t._standalone === "cff") return "cff";
  const e = t._woff?.version;
  return e === 2 ? "woff2" : e === 1 ? "woff" : "sfnt";
}
function Gi(t, e = {}) {
  if (!t || typeof t != "object")
    throw new TypeError("exportFont expects a font data object");
  let n = e.format ? e.format.toLowerCase() : Jx(t);
  if (!Kx.has(n))
    throw new Error(
      `Unknown export format "${n}". Supported: sfnt, woff, woff2, cff, ttf, otf.`
    );
  if (Ni[n] && (t = ga(t, Ni[n]), n = "sfnt"), tS(t)) {
    if (n === "cff")
      throw new Error("CFF export does not support font collections.");
    if (e.split)
      return Qx(t, n);
    const r = oS(t);
    return n === "woff" ? ds(
      r,
      t._woff?.metadata,
      t._woff?.privateData
    ) : n === "woff2" ? xs(
      r,
      t._woff?.metadata,
      t._woff?.privateData
    ) : r;
  }
  if (n === "cff") {
    const i = Xn(t).tables["CFF "];
    if (!i)
      throw new Error(
        "CFF export requires CFF glyph data. This font uses TrueType outlines."
      );
    const a = $a(i), c = new ArrayBuffer(a.length);
    return new Uint8Array(c).set(a), c;
  }
  const o = Xn(t), s = qn(o, 0);
  if (n === "woff") {
    const r = t._woff?.metadata ?? null, i = t._woff?.privateData ?? null;
    return ds(s, r, i);
  }
  if (n === "woff2") {
    const r = t._woff?.metadata ?? null, i = t._woff?.privateData ?? null;
    return xs(s, r, i);
  }
  return s;
}
function Qx(t, e) {
  const { fonts: n } = t;
  if (!Array.isArray(n) || n.length === 0)
    throw new Error("Collection split expects a non-empty fonts array");
  return n.map((o) => {
    const s = Xn(o), r = qn(s, 0);
    return e === "woff" ? ds(r) : e === "woff2" ? xs(r) : r;
  });
}
function tS(t) {
  return t.collection && t.collection.tag === "ttcf" && Array.isArray(t.fonts);
}
function Pi(t, e) {
  if (!t?.fonts?.[0]) return !1;
  const n = t.fonts[0].charStrings;
  if (!n || n.length !== e.length) return !1;
  for (let o = 0; o < e.length; o++) {
    const s = e[o], r = n[o];
    if (!s.charString) {
      if (r && r.length > 0) return !1;
      continue;
    }
    if (!r || s.charString.length !== r.length) return !1;
    for (let i = 0; i < r.length; i++)
      if (s.charString[i] !== r[i]) return !1;
  }
  return !0;
}
function eS(t, e) {
  const n = e?.unitsPerEm || 1e3;
  if (n === 1e3) return;
  const o = t?.fonts?.[0];
  if (!o) return;
  o.topDict = o.topDict || {};
  const s = 1 / n, r = o.topDict.FontMatrix;
  Array.isArray(r) && r.length === 6 && Math.abs(r[0] - s) < 1e-9 && r[1] === 0 && r[2] === 0 && Math.abs(r[3] - s) < 1e-9 || (o.topDict.FontMatrix = [s, 0, 0, s, 0, 0]);
}
function nS(t, e) {
  const n = t?.fonts?.[0];
  if (!n || !Array.isArray(n.charStrings)) return;
  const o = t.globalSubrs || [], s = n.localSubrs || [], r = n.privateDict?.nominalWidthX ?? 0, i = n.privateDict?.defaultWidthX ?? 0, a = Math.min(n.charStrings.length, e.length);
  for (let c = 0; c < a; c++) {
    const f = e[c]?.advanceWidth;
    Number.isFinite(f) && (n.charStrings[c] = Ca(n.charStrings[c], f, {
      globalSubrs: o,
      localSubrs: s,
      nominalWidthX: r,
      defaultWidthX: i
    }));
  }
}
function Xn(t) {
  if (t.header && t.tables)
    return t;
  if (t._header && t.tables && t.font && t.glyphs) {
    const e = sr(t);
    for (const [n, o] of Object.entries(t.tables))
      !Fl.has(n) && !e.tables[n] && (e.tables[n] = o);
    return t.tables["CFF "] && e.tables["CFF "] && Pi(t.tables["CFF "], t.glyphs) && (e.tables["CFF "] = t.tables["CFF "], eS(e.tables["CFF "], t.font), nS(e.tables["CFF "], t.glyphs)), t.tables.CFF2 && e.tables.CFF2 && Pi(t.tables.CFF2, t.glyphs) && (e.tables.CFF2 = t.tables.CFF2), e;
  }
  if (t._header && t.tables)
    return { header: t._header, tables: t.tables };
  if (t.font && t.glyphs)
    return sr(t);
  throw new Error(
    "exportFont: input must have { header, tables } or { font, glyphs }"
  );
}
function qn(t, e) {
  const { header: n, tables: o } = t, s = Object.keys(o).sort(Xx), r = s.length, i = sS(o), a = s.map((m) => {
    const w = o[m];
    let _;
    if (i.has(m))
      _ = i.get(m);
    else if (w._raw)
      _ = w._raw;
    else {
      const A = Zx[m];
      if (!A)
        throw new Error(`No writer registered for parsed table: ${m}`);
      _ = A(w);
    }
    const S = new Uint8Array(_), b = w._raw && typeof w._checksum == "number" && !i.has(m);
    return {
      tag: m,
      data: S,
      length: S.length,
      paddedLength: S.length + (4 - S.length % 4) % 4,
      checksum: b ? w._checksum >>> 0 : qx(S)
    };
  }), c = Vi + r * $i;
  let f = c + (4 - c % 4) % 4;
  for (const m of a)
    m.offset = f, f += m.paddedLength;
  const l = f, u = new ArrayBuffer(l), h = new DataView(u), p = new Uint8Array(u), g = r > 0 ? 2 ** Math.floor(Math.log2(r)) : 0, d = g * 16, x = g > 0 ? Math.floor(Math.log2(g)) : 0, y = r * 16 - d;
  h.setUint32(0, n.sfVersion), h.setUint16(4, r), h.setUint16(6, d), h.setUint16(8, x), h.setUint16(10, y);
  for (let m = 0; m < a.length; m++) {
    const w = a[m], _ = Vi + m * $i;
    for (let S = 0; S < 4; S++)
      h.setUint8(_ + S, w.tag.charCodeAt(S));
    h.setUint32(_ + 4, w.checksum), h.setUint32(_ + 8, w.offset + e), h.setUint32(_ + 12, w.length);
  }
  for (const m of a)
    p.set(m.data, m.offset);
  return u;
}
function oS(t) {
  const { collection: e, fonts: n } = t;
  if (!Array.isArray(n) || n.length === 0)
    throw new Error("TTC/OTC export expects a non-empty fonts array");
  const o = n.map((y) => Xn(y)), s = e.majorVersion ?? 2, r = e.minorVersion ?? 0, i = o.length, a = s >= 2, c = 12 + i * 4 + (a ? 12 : 0);
  let f = c + (4 - c % 4) % 4;
  const u = o.map(
    (y) => new Uint8Array(qn(y, 0))
  ).map((y) => {
    const m = f;
    return f += y.length, f += (4 - f % 4) % 4, m;
  }), h = o.map(
    (y, m) => new Uint8Array(qn(y, u[m]))
  ), p = f, g = new ArrayBuffer(p), d = new DataView(g), x = new Uint8Array(g);
  d.setUint8(0, 116), d.setUint8(1, 116), d.setUint8(2, 99), d.setUint8(3, 102), d.setUint16(4, s), d.setUint16(6, r), d.setUint32(8, i);
  for (let y = 0; y < i; y++)
    d.setUint32(12 + y * 4, u[y]);
  if (a) {
    const y = 12 + i * 4;
    d.setUint32(y + 0, e.dsigTag ?? 0), d.setUint32(y + 4, e.dsigLength ?? 0), d.setUint32(y + 8, e.dsigOffset ?? 0);
  }
  for (let y = 0; y < i; y++)
    x.set(h[y], u[y]);
  return g;
}
function sS(t) {
  const e = /* @__PURE__ */ new Map();
  if ((t["CFF "] && !t["CFF "]._raw || t.CFF2 && !t.CFF2._raw) && t.post && !t.post._raw) {
    const u = t.post;
    if (u.version !== 196608) {
      const h = {
        version: 196608,
        italicAngle: u.italicAngle ?? 0,
        underlinePosition: u.underlinePosition ?? 0,
        underlineThickness: u.underlineThickness ?? 0,
        isFixedPitch: u.isFixedPitch ?? 0,
        minMemType42: u.minMemType42 ?? 0,
        maxMemType42: u.maxMemType42 ?? 0,
        minMemType1: u.minMemType1 ?? 0,
        maxMemType1: u.maxMemType1 ?? 0
      };
      e.set("post", Ic(h));
    }
  }
  const o = t.glyf && !t.glyf._raw, s = t.loca && !t.loca._raw;
  if (o && s) {
    const { bytes: u, offsets: h } = Yc(t.glyf);
    if (e.set("glyf", u), e.set("loca", Zc({ offsets: h })), t.head && !t.head._raw) {
      const g = h.every((d) => d % 2 === 0 && d / 2 <= 65535) ? 0 : 1;
      t.head.indexToLocFormat !== g && e.set(
        "head",
        lc({ ...t.head, indexToLocFormat: g })
      );
    }
  }
  const r = t.CBLC && !t.CBLC._raw && t.CBLC.sizes, i = t.CBDT && !t.CBDT._raw && t.CBDT.bitmapData;
  if (r && i) {
    const { bytes: u, offsetInfo: h } = xo(
      t.CBDT,
      t.CBLC
    );
    e.set("CBDT", u), e.set("CBLC", me(t.CBLC, h));
  }
  const a = t.EBLC && !t.EBLC._raw && t.EBLC.sizes, c = t.EBDT && !t.EBDT._raw && t.EBDT.bitmapData;
  if (a && c) {
    const { bytes: u, offsetInfo: h } = xo(t.EBDT, t.EBLC);
    e.set("EBDT", u), e.set("EBLC", me(t.EBLC, h));
  }
  const f = t.bloc && !t.bloc._raw && t.bloc.sizes, l = t.bdat && !t.bdat._raw && t.bdat.bitmapData;
  if (f && l) {
    const { bytes: u, offsetInfo: h } = xo(t.bdat, t.bloc);
    e.set("bdat", u), e.set("bloc", me(t.bloc, h));
  }
  return e;
}
const Gf = {
  cmap: O0,
  head: qo,
  hhea: $p,
  HVAR: zp,
  hmtx: Gp,
  maxp: Od,
  MVAR: Md,
  name: Pd,
  hdmx: Fp,
  BASE: o0,
  JSTF: ed,
  MATH: Ad,
  MERG: Ed,
  meta: Rd,
  DSIG: Og,
  LTSH: _d,
  CBLC: Es,
  CBDT: Os,
  "OS/2": zd,
  kern: rd,
  PCLT: jd,
  VDMX: l1,
  post: Zd,
  STAT: e1,
  "CFF ": Va,
  CFF2: Ih,
  VORG: Th,
  fvar: Vg,
  avar: Fh,
  loca: rm,
  glyf: W1,
  gvar: em,
  GDEF: Ng,
  GPOS: Kg,
  GSUB: yp,
  "cvt ": N1,
  cvar: V1,
  fpgm: P1,
  prep: im,
  gasp: z1,
  vhea: d1,
  VVAR: _1,
  vmtx: y1,
  COLR: wg,
  CPAL: Ag,
  EBLC: Rg,
  EBDT: Tg,
  EBSC: Mg,
  bloc: v0,
  bdat: y0,
  sbix: Kd,
  ltag: xd,
  "SVG ": r1
}, Pf = [
  "head",
  "maxp",
  "fvar",
  "avar",
  "cvt ",
  "hhea",
  "cmap",
  "hmtx",
  "HVAR",
  "name",
  "BASE",
  "JSTF",
  "MATH",
  "STAT",
  "MVAR",
  "OS/2",
  "kern",
  "hdmx",
  "LTSH",
  "MERG",
  "meta",
  "DSIG",
  "PCLT",
  "VDMX",
  "post",
  "CFF ",
  "CFF2",
  "VORG",
  "loca",
  "glyf",
  "gvar",
  "cvar",
  "vhea",
  "vmtx",
  "VVAR",
  "CBLC",
  "CBDT",
  "EBLC",
  "EBDT",
  "EBSC",
  "bloc",
  "bdat",
  "sbix",
  "ltag"
];
function Kn(t) {
  if (!(t instanceof ArrayBuffer))
    throw new TypeError("importFont expects an ArrayBuffer");
  const e = new Uint8Array(t);
  if (e.length >= 4) {
    const o = String.fromCharCode(e[0], e[1], e[2], e[3]);
    if (o === "wOFF") {
      const { sfnt: s, metadata: r, privateData: i } = Rf(t), a = Kn(s);
      return a._woff = { version: 1 }, r && (a._woff.metadata = r), i && (a._woff.privateData = i), a;
    }
    if (o === "wOF2") {
      const { sfnt: s, metadata: r, privateData: i } = Vf(t), a = Kn(s);
      return a._woff = { version: 2 }, r && (a._woff.metadata = r), i && (a._woff.privateData = i), a;
    }
    if (o === "ttcf")
      return iS(t);
  }
  if (e.length >= 4 && e[0] === 1 && e[1] === 0 && e[3] >= 1 && e[3] <= 4)
    return cS(t);
  if (e.length >= 6 && e[0] === 128 && (e[1] === 1 || e[1] === 2))
    return fS(t);
  if (e.length >= 2 && e[0] === 37 && e[1] === 33)
    return lS(t);
  const n = rS(t);
  return Cs(n);
}
function rS(t) {
  if (!(t instanceof ArrayBuffer))
    throw new TypeError("importFontTables expects an ArrayBuffer");
  const e = new F(new Uint8Array(t)), n = Uf(e), o = zf(e, n.numTables), s = Hf(t, o);
  return { header: n, tables: s };
}
function iS(t) {
  const e = new F(new Uint8Array(t)), n = e.tag();
  if (n !== "ttcf")
    throw new Error("Invalid TTC/OTC collection signature");
  const o = e.uint16(), s = e.uint16(), r = e.uint32(), i = e.array("uint32", r);
  let a, c, f;
  o >= 2 && (a = e.uint32(), c = e.uint32(), f = e.uint32());
  const l = i.map((h) => {
    const p = new F(new Uint8Array(t), h), g = Uf(p), d = zf(p, g.numTables), x = aS(
      t,
      d,
      h
    ), y = Hf(t, x);
    return Cs({ header: g, tables: y });
  }), u = {
    tag: n,
    majorVersion: o,
    minorVersion: s,
    numFonts: r
  };
  return o >= 2 && (u.dsigTag = a, u.dsigLength = c, u.dsigOffset = f), { collection: u, fonts: l };
}
function aS(t, e, n) {
  const o = e.find((h) => h.tag === "head");
  if (!o)
    return e;
  const s = o.offset, r = n + o.offset, i = s + o.length <= t.byteLength, a = r + o.length <= t.byteLength;
  if (!i && a)
    return e.map((h) => ({
      ...h,
      offset: n + h.offset
    }));
  if (i && !a || !i && !a)
    return e;
  const c = qo(
    Array.from(new Uint8Array(t, s, o.length))
  ), f = qo(
    Array.from(new Uint8Array(t, r, o.length))
  ), l = c.magicNumber === 1594834165;
  return f.magicNumber === 1594834165 && !l ? e.map((h) => ({
    ...h,
    offset: n + h.offset
  })) : e;
}
function Uf(t) {
  return {
    sfVersion: t.uint32(),
    numTables: t.uint16(),
    searchRange: t.uint16(),
    entrySelector: t.uint16(),
    rangeShift: t.uint16()
  };
}
function zf(t, e) {
  const n = [];
  for (let o = 0; o < e; o++)
    n.push({
      tag: t.tag(),
      checksum: t.uint32(),
      offset: t.offset32(),
      length: t.uint32()
    });
  return n;
}
function Hf(t, e) {
  const n = {}, o = new Map(e.map((a) => [a.tag, a])), s = Pf.filter((a) => o.has(a)), r = e.map((a) => a.tag).filter((a) => !s.includes(a)), i = [...s, ...r];
  for (const a of i) {
    const c = o.get(a), f = c.offset, l = new Uint8Array(t, f, c.length), u = Array.from(l), h = Gf[a];
    h ? n[a] = {
      ...h(u, n),
      _checksum: c.checksum
    } : n[a] = {
      _raw: u,
      _checksum: c.checksum
    };
  }
  if (n.loca && n.glyf && !n.glyf._raw && delete n.loca.offsets, n.CBLC && n.CBDT?.bitmapData)
    for (const a of n.CBLC.sizes)
      for (const c of a.indexSubTables ?? [])
        delete c.imageDataOffset, delete c.sbitOffsets, c.glyphArray && (c.glyphIdArray = c.glyphArray.slice(0, -1).map((f) => f.glyphID), delete c.glyphArray);
  if (n.EBLC && n.EBDT?.bitmapData)
    for (const a of n.EBLC.sizes)
      for (const c of a.indexSubTables ?? [])
        delete c.imageDataOffset, delete c.sbitOffsets, c.glyphArray && (c.glyphIdArray = c.glyphArray.slice(0, -1).map((f) => f.glyphID), delete c.glyphArray);
  if (n.bloc && n.bdat?.bitmapData)
    for (const a of n.bloc.sizes)
      for (const c of a.indexSubTables ?? [])
        delete c.imageDataOffset, delete c.sbitOffsets, c.glyphArray && (c.glyphIdArray = c.glyphArray.slice(0, -1).map((f) => f.glyphID), delete c.glyphArray);
  return n;
}
function cS(t) {
  const e = Array.from(new Uint8Array(t)), n = Va(e), o = n.fonts[0], s = o?.topDict || {}, r = o?.charStrings || [], i = r.length, a = s.FontBBox || [0, 0, 1e3, 1e3], c = a[3] - a[1] || 1e3, f = n.names && n.names[0] || "CFFFont", l = {
    "CFF ": n
  };
  l.head = {
    majorVersion: 1,
    minorVersion: 0,
    magicNumber: 1594834165,
    unitsPerEm: c,
    created: 0n,
    modified: 0n,
    xMin: a[0],
    yMin: a[1],
    xMax: a[2],
    yMax: a[3],
    flags: 11,
    macStyle: 0,
    lowestRecPPEM: 8,
    fontDirectionHint: 2,
    indexToLocFormat: 0,
    glyphDataFormat: 0
  }, l.maxp = {
    version: 20480,
    numGlyphs: i
  };
  const u = a[3], h = a[1];
  l.hhea = {
    majorVersion: 1,
    minorVersion: 0,
    ascender: u,
    descender: h,
    lineGap: 0,
    advanceWidthMax: 0,
    minLeftSideBearing: 0,
    minRightSideBearing: 0,
    xMaxExtent: a[2],
    caretSlopeRise: 1,
    caretSlopeRun: 0,
    caretOffset: 0,
    reserved0: 0,
    reserved1: 0,
    reserved2: 0,
    reserved3: 0,
    metricDataFormat: 0,
    numberOfHMetrics: i
  };
  const p = o?.privateDict?.defaultWidthX ?? 0, g = o?.privateDict?.nominalWidthX ?? 0, d = [];
  for (let m = 0; m < i; m++) {
    let w = p;
    if (r[m] && r[m].length > 0) {
      const _ = n.globalSubrs || [], S = o.localSubrs || [];
      try {
        const b = Qn(r[m], _, S);
        b.width !== void 0 && (w = b.width + g);
      } catch {
      }
    }
    d.push({ advanceWidth: w, lsb: 0 });
  }
  if (l.hmtx = { hMetrics: d }, l.name = {
    format: 0,
    names: [
      {
        nameID: 1,
        platformID: 3,
        encodingID: 1,
        languageID: 1033,
        value: f
      },
      {
        nameID: 2,
        platformID: 3,
        encodingID: 1,
        languageID: 1033,
        value: "Regular"
      },
      {
        nameID: 4,
        platformID: 3,
        encodingID: 1,
        languageID: 1033,
        value: f
      },
      {
        nameID: 6,
        platformID: 3,
        encodingID: 1,
        languageID: 1033,
        value: f
      }
    ]
  }, l.post = {
    version: 196608,
    italicAngle: s.ItalicAngle || 0,
    underlinePosition: s.UnderlinePosition || -100,
    underlineThickness: s.UnderlineThickness || 50,
    isFixedPitch: s.isFixedPitch || 0
  }, o?.encoding && typeof o.encoding != "string") {
    const m = o.encoding.codes || [], w = new Array(256).fill(0);
    for (let _ = 0; _ < m.length && _ < 256; _++) {
      const S = m[_];
      S >= 0 && S < 256 && (w[S] = _ + 1);
    }
    l.cmap = {
      version: 0,
      subtables: [
        {
          platformID: 1,
          encodingID: 0,
          format: 0,
          glyphIdArray: w
        }
      ]
    };
  }
  l["OS/2"] = {
    version: 4,
    xAvgCharWidth: 0,
    usWeightClass: 400,
    usWidthClass: 5,
    fsType: 0,
    ySubscriptXSize: Math.round(c * 0.65),
    ySubscriptYSize: Math.round(c * 0.6),
    ySubscriptXOffset: 0,
    ySubscriptYOffset: Math.round(c * 0.075),
    ySuperscriptXSize: Math.round(c * 0.65),
    ySuperscriptYSize: Math.round(c * 0.6),
    ySuperscriptXOffset: 0,
    ySuperscriptYOffset: Math.round(c * 0.35),
    yStrikeoutSize: Math.round(c * 0.05),
    yStrikeoutPosition: Math.round(c * 0.3),
    sFamilyClass: 0,
    panose: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ulUnicodeRange1: 0,
    ulUnicodeRange2: 0,
    ulUnicodeRange3: 0,
    ulUnicodeRange4: 0,
    achVendID: "    ",
    fsSelection: 64,
    usFirstCharIndex: 0,
    usLastCharIndex: 65535,
    sTypoAscender: u,
    sTypoDescender: h,
    sTypoLineGap: 0,
    usWinAscent: Math.abs(u),
    usWinDescent: Math.abs(h),
    ulCodePageRange1: 0,
    ulCodePageRange2: 0,
    sxHeight: Math.round(c * 0.5),
    sCapHeight: Math.round(c * 0.7),
    usDefaultChar: 0,
    usBreakChar: 32,
    usMaxContext: 0
  };
  const y = Cs({ header: { sfVersion: 1330926671 }, tables: l });
  return y._standalone = "cff", y;
}
function fS(t) {
  const e = new Uint8Array(t), n = [], o = [];
  let s = 0;
  for (; s < e.length && e[s] === 128; ) {
    const c = e[s + 1];
    if (c === 3) break;
    const f = e[s + 2] | e[s + 3] << 8 | e[s + 4] << 16 | e[s + 5] << 24;
    s += 6;
    const l = e.slice(s, s + f);
    s += f, c === 1 ? n.push(l) : c === 2 && o.push(l);
  }
  const r = zi(n), i = zi(o), a = new TextDecoder("latin1").decode(r);
  return Wf(a, i);
}
function lS(t) {
  const e = new TextDecoder("latin1").decode(new Uint8Array(t)), n = "currentfile eexec", o = e.indexOf(n);
  if (o === -1)
    throw new Error('PFA: could not find "currentfile eexec" marker');
  const s = e.slice(0, o + n.length), i = e.slice(o + n.length).replace(/\s/g, ""), a = i.search(/0{64,}$/), c = a > 0 ? i.slice(0, a) : i, f = new Uint8Array(c.length / 2);
  for (let l = 0; l < f.length; l++)
    f[l] = parseInt(c.slice(l * 2, l * 2 + 2), 16);
  return Wf(s, f);
}
function Hs(t, e, n) {
  const o = new Uint8Array(t.length);
  let s = e;
  const r = 52845, i = 22719;
  for (let a = 0; a < t.length; a++) {
    const c = t[a];
    o[a] = c ^ s >>> 8, s = (c + s) * r + i & 65535;
  }
  return o.slice(n);
}
function Ui(t, e) {
  const n = [], o = [], s = [];
  let r = null, i = 0, a = 0, c = 0, f = 0, l = [], u = !1;
  function h(x, y) {
    r && r.length > 0 && s.push(r), r = [{ type: "M", x, y }];
  }
  function p(x, y) {
    r && r.push({ type: "L", x, y });
  }
  function g(x, y, m, w, _, S) {
    r && r.push({ type: "C", x1: x, y1: y, x2: m, y2: w, x: _, y: S });
  }
  function d(x, y) {
    if (y > 10) return;
    let m = 0;
    for (; m < x.length; ) {
      const w = x[m];
      if (w >= 32 && w <= 246) {
        n.push(w - 139), m++;
        continue;
      }
      if (w >= 247 && w <= 250) {
        n.push((w - 247) * 256 + x[m + 1] + 108), m += 2;
        continue;
      }
      if (w >= 251 && w <= 254) {
        n.push(-(w - 251) * 256 - x[m + 1] - 108), m += 2;
        continue;
      }
      if (w === 255) {
        const _ = (x[m + 1] << 24 | x[m + 2] << 16 | x[m + 3] << 8 | x[m + 4]) >> 0;
        n.push(_), m += 5;
        continue;
      }
      if (w === 12) {
        const _ = x[m + 1];
        switch (m += 2, _) {
          case 0:
            n.length = 0;
            break;
          case 6: {
            n.length = 0;
            break;
          }
          case 7: {
            f = n[n.length - 4] || 0, c = n[n.length - 2] || 0, i = f, a = n[n.length - 3] || 0, n.length = 0;
            break;
          }
          case 12: {
            const S = n.pop(), b = n.pop();
            n.push(S !== 0 ? b / S : 0);
            break;
          }
          case 16: {
            const S = n.pop(), b = n.pop(), A = n.splice(n.length - b, b);
            if (S === 0) {
              if (u = !1, l.length >= 7) {
                const k = l;
                g(k[1].x, k[1].y, k[2].x, k[2].y, k[3].x, k[3].y), g(k[4].x, k[4].y, k[5].x, k[5].y, k[6].x, k[6].y), i = k[6].x, a = k[6].y;
              }
              l = [], o.push(A[1]), o.push(A[0]);
            } else S === 1 ? (u = !0, l = [{ x: i, y: a }], o.push(...A)) : S === 2 ? o.push(...A) : S === 3 ? o.push(3) : o.push(...A);
            break;
          }
          case 17: {
            o.length > 0 ? n.push(o.pop()) : n.push(0);
            break;
          }
          case 33:
            i = n[n.length - 2] || 0, a = n[n.length - 1] || 0, n.length = 0;
            break;
          default:
            n.length = 0;
            break;
        }
        continue;
      }
      switch (m++, w) {
        case 1:
        // hstem
        case 3:
          n.length = 0;
          break;
        case 4: {
          const _ = n.pop() || 0;
          u ? (a += _, l.push({ x: i, y: a })) : (a += _, h(i, a)), n.length = 0;
          break;
        }
        case 5: {
          const _ = n.pop() || 0, S = n.pop() || 0;
          i += S, a += _, p(i, a), n.length = 0;
          break;
        }
        case 6: {
          const _ = n.pop() || 0;
          i += _, p(i, a), n.length = 0;
          break;
        }
        case 7: {
          const _ = n.pop() || 0;
          a += _, p(i, a), n.length = 0;
          break;
        }
        case 8: {
          const _ = n.pop() || 0, S = n.pop() || 0, b = n.pop() || 0, A = n.pop() || 0, k = n.pop() || 0, O = n.pop() || 0, I = i + O, E = a + k, T = I + A, D = E + b;
          i = T + S, a = D + _, g(I, E, T, D, i, a), n.length = 0;
          break;
        }
        case 9: {
          r && r.length > 0 && (s.push(r), r = null), n.length = 0;
          break;
        }
        case 10: {
          const _ = n.pop();
          _ >= 0 && _ < e.length && e[_] && d(e[_], y + 1);
          break;
        }
        case 11:
          return;
        case 13: {
          c = n.pop() || 0, f = n.pop() || 0, i = f, n.length = 0;
          break;
        }
        case 14: {
          r && r.length > 0 && (s.push(r), r = null);
          return;
        }
        case 21: {
          const _ = n.pop() || 0, S = n.pop() || 0;
          u ? (i += S, a += _, l.push({ x: i, y: a })) : (i += S, a += _, h(i, a)), n.length = 0;
          break;
        }
        case 22: {
          const _ = n.pop() || 0;
          u ? (i += _, l.push({ x: i, y: a })) : (i += _, h(i, a)), n.length = 0;
          break;
        }
        case 30: {
          const _ = n.pop() || 0, S = n.pop() || 0, b = n.pop() || 0, A = n.pop() || 0, k = i, O = a + A, I = k + b, E = O + S;
          i = I + _, a = E, g(k, O, I, E, i, a), n.length = 0;
          break;
        }
        case 31: {
          const _ = n.pop() || 0, S = n.pop() || 0, b = n.pop() || 0, A = n.pop() || 0, k = i + A, O = a, I = k + b, E = O + S;
          i = I, a = E + _, g(k, O, I, E, i, a), n.length = 0;
          break;
        }
        default:
          n.length = 0;
          break;
      }
    }
  }
  return d(t, 0), r && r.length > 0 && s.push(r), { contours: s, width: c };
}
function uS(t) {
  const e = {}, n = [
    "FontName",
    "FamilyName",
    "FullName",
    "Weight",
    "version",
    "Notice"
  ];
  for (const a of n) {
    const c = t.match(new RegExp(`/${a}\\s*\\(([^)]*)\\)`));
    if (c)
      e[a] = c[1];
    else {
      const f = t.match(new RegExp(`/${a}\\s+/([^\\s]+)`));
      f && (e[a] = f[1]);
    }
  }
  const o = [
    "PaintType",
    "FontType",
    "UniqueID",
    "ItalicAngle",
    "isFixedPitch",
    "UnderlinePosition",
    "UnderlineThickness"
  ];
  for (const a of o) {
    const c = t.match(new RegExp(`/${a}\\s+(-?[\\d.]+)`));
    c && (e[a] = parseFloat(c[1]));
  }
  const s = t.match(/\/isFixedPitch\s+(true|false)/);
  s && (e.isFixedPitch = s[1] === "true" ? 1 : 0);
  const r = t.match(
    /\/FontBBox\s*\{\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*\}/
  );
  if (r)
    e.FontBBox = r.slice(1, 5).map(Number);
  else {
    const a = t.match(
      /\/FontBBox\s*\[\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*\]/
    );
    a && (e.FontBBox = a.slice(1, 5).map(Number));
  }
  const i = t.match(
    /\/FontMatrix\s*\[\s*([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)\s*\]/
  );
  return i && (e.FontMatrix = i.slice(1, 7).map(Number)), e.encoding = hS(t), e;
}
function hS(t) {
  const e = /* @__PURE__ */ new Map(), n = /dup\s+(\d+)\s+\/([^\s]+)\s+put/g;
  let o;
  for (; (o = n.exec(t)) !== null; )
    e.set(parseInt(o[1]), o[2]);
  return e;
}
function gS(t) {
  const e = new TextDecoder("latin1").decode(t), n = e.match(/\/lenIV\s+(\d+)/), o = n ? parseInt(n[1]) : 4, s = {}, r = [
    "BlueFuzz",
    "BlueScale",
    "BlueShift",
    "ForceBold",
    "StdHW",
    "StdVW",
    "defaultWidthX",
    "nominalWidthX"
  ];
  for (const l of r) {
    const u = e.match(new RegExp(`/${l}\\s+(-?[\\d.]+)`));
    u && (s[l] = parseFloat(u[1]));
  }
  for (const l of [
    "BlueValues",
    "OtherBlues",
    "FamilyBlues",
    "FamilyOtherBlues",
    "StemSnapH",
    "StemSnapV"
  ]) {
    const u = e.match(new RegExp(`/${l}\\s*\\[([^\\]]+)\\]`));
    u && (s[l] = u[1].trim().split(/\s+/).map(Number));
  }
  const i = [], a = e.match(/\/Subrs\s+(\d+)\s+array/);
  if (a) {
    const l = parseInt(a[1]), u = e.slice(a.index);
    pS(
      u,
      t.slice(Mn(t, a.index)),
      l,
      o,
      (h, p) => {
        i[h] = p;
      }
    );
  }
  const c = /* @__PURE__ */ new Map(), f = e.match(/\/CharStrings\s+(\d+)\s+dict/);
  if (f) {
    const l = e.slice(f.index), u = t.slice(
      Mn(t, f.index)
    ), h = /\/([^\s]+)\s+(\d+)\s+(?:RD|-\|)\s/g;
    let p;
    for (; (p = h.exec(l)) !== null; ) {
      const g = p[1], d = parseInt(p[2]), x = p.index + p[0].length, y = Mn(u, x), m = u.slice(y, y + d), w = Hs(m, 4330, o);
      c.set(g, w);
    }
  }
  return { charStrings: c, subrs: i, privateDict: s };
}
function pS(t, e, n, o, s) {
  const r = /dup\s+(\d+)\s+(\d+)\s+(?:RD|-\|)\s/g;
  let i;
  for (; (i = r.exec(t)) !== null; ) {
    const a = parseInt(i[1]), c = parseInt(i[2]), f = i.index + i[0].length, l = Mn(e, f), u = e.slice(l, l + c), h = Hs(u, 4330, o);
    s(a, h);
  }
}
function Mn(t, e) {
  return e;
}
function Wf(t, e) {
  const n = Hs(e, 55665, 4), o = uS(t), { charStrings: s, subrs: r } = gS(n), i = o.FontBBox || [0, 0, 1e3, 1e3], a = o.FontMatrix || [1e-3, 0, 0, 1e-3, 0, 0], c = Math.round(1 / a[0]), f = o.FontName || o.FamilyName || "Type1Font", l = i[3], u = i[1], h = [];
  if (s.has(".notdef")) {
    const d = Ui(s.get(".notdef"), r);
    h.push({
      name: ".notdef",
      unicode: null,
      advanceWidth: d.width,
      contours: d.contours.length > 0 ? d.contours : void 0
    });
  } else
    h.push({ name: ".notdef", unicode: null, advanceWidth: 0 });
  const p = /* @__PURE__ */ new Map();
  for (const [d, x] of o.encoding)
    p.set(x, d);
  for (const [d, x] of s) {
    if (d === ".notdef") continue;
    const y = Ui(x, r), m = p.get(d) ?? null;
    h.push({
      name: d,
      unicode: m,
      advanceWidth: y.width,
      contours: y.contours.length > 0 ? y.contours : void 0
    });
  }
  const g = {
    font: {
      familyName: o.FamilyName || f,
      styleName: "Regular",
      fullName: o.FullName || f,
      postScriptName: f,
      unitsPerEm: c,
      ascender: l,
      descender: u,
      lineGap: 0,
      created: (/* @__PURE__ */ new Date()).toISOString().slice(0, 19) + "Z",
      modified: (/* @__PURE__ */ new Date()).toISOString().slice(0, 19) + "Z"
    },
    glyphs: h,
    tables: {},
    _header: { sfVersion: 1330926671 },
    _standalone: "type1"
  };
  return o.Weight && (g.font.weight = o.Weight), o.version && (g.font.version = o.version), o.Notice && (g.font.copyright = o.Notice), g;
}
function zi(t) {
  const e = t.reduce((s, r) => s + r.length, 0), n = new Uint8Array(e);
  let o = 0;
  for (const s of t)
    n.set(s, o), o += s.length;
  return n;
}
const dS = /* @__PURE__ */ new Set([
  "_dirty",
  "_fileName",
  "_originalBuffer",
  "_collection",
  "_collectionFonts",
  "_woff"
]);
function mS(t, e = 2) {
  return JSON.stringify(
    t,
    function(n, o) {
      if (!(this === t && dS.has(n)))
        return typeof o == "bigint" ? Number(o) : ArrayBuffer.isView(o) && !(o instanceof DataView) ? Array.from(o) : o;
    },
    e
  );
}
function Go(t) {
  return JSON.parse(t);
}
function yS(t) {
  if (!t || typeof t != "object")
    throw new Error("createKerning: input is required (object or array)");
  const e = Array.isArray(t) ? t : [t], n = {}, o = [];
  for (const r of e)
    if (r.classes)
      for (const [i, a] of Object.entries(r.classes)) {
        if (!Array.isArray(a))
          throw new Error(
            `createKerning: class "${i}" must be an array of glyph names`
          );
        n[i] = a;
      }
  for (const r of e)
    if (r.left !== void 0 && r.right !== void 0 && r.value !== void 0)
      Hi(r.left, r.right, r.value, n, o);
    else if (r.left !== void 0 && r.pairs) {
      const i = de(r.left, n);
      for (const [a, c] of Object.entries(r.pairs)) {
        const f = de(a, n);
        for (const l of i)
          for (const u of f)
            o.push({ left: l, right: u, value: c });
      }
    } else if (r.groups)
      for (const [i, a] of Object.entries(r.groups)) {
        const c = de(i, n);
        for (const [f, l] of Object.entries(a)) {
          const u = de(f, n);
          for (const h of c)
            for (const p of u)
              o.push({ left: h, right: p, value: l });
        }
      }
    else if (r.classes && r.pairs)
      for (const i of r.pairs)
        Hi(i.left, i.right, i.value, n, o);
  const s = /* @__PURE__ */ new Map();
  for (const r of o)
    s.set(`${r.left}\0${r.right}`, r);
  return [...s.values()];
}
function Hi(t, e, n, o, s) {
  const r = de(t, o), i = de(e, o);
  for (const a of r)
    for (const c of i)
      s.push({ left: a, right: c, value: n });
}
function xS(t, e, n) {
  const o = t?.kerning, s = t?.kerningClasses, r = Array.isArray(o) && o.length > 0, i = Array.isArray(s) && s.some(
    (l) => l && Array.isArray(l.pairs) && l.pairs.length > 0
  );
  if (!r && !i) return;
  const a = t.glyphs, c = Ft(a, e), f = Ft(a, n);
  if (!(c === void 0 || f === void 0)) {
    if (r)
      for (let l = o.length - 1; l >= 0; l--) {
        const u = o[l];
        if (u.left === c && u.right === f) return u.value;
      }
    if (i)
      for (let l = s.length - 1; l >= 0; l--) {
        const u = SS(
          s[l],
          c,
          f
        );
        if (u !== void 0) return u;
      }
  }
}
function SS(t, e, n) {
  const { leftClasses: o = {}, rightClasses: s = {}, pairs: r = [] } = t, i = (a, c, f) => {
    if (typeof a == "string" && a.startsWith("@")) {
      const l = f[a.slice(1)];
      return Array.isArray(l) && l.includes(c);
    }
    return a === c;
  };
  for (let a = r.length - 1; a >= 0; a--) {
    const c = r[a];
    if (i(c.left, e, o) && i(c.right, n, s))
      return c.value;
  }
}
function de(t, e) {
  if (typeof t == "string" && t.startsWith("@")) {
    const n = t.slice(1), o = e[n];
    if (!o)
      throw new Error(`createKerning: unknown class "@${n}"`);
    return o;
  }
  return [t];
}
function _S(t) {
  if (!t || typeof t != "object")
    throw new Error("createSubstitution: input is required (object or array)");
  const e = Array.isArray(t) ? t : [t], n = {}, o = [];
  for (const s of e)
    if (s.classes)
      for (const [r, i] of Object.entries(s.classes)) {
        if (!Array.isArray(i))
          throw new Error(
            `createSubstitution: class "${r}" must be an array of glyph names`
          );
        n[r] = i;
      }
  for (const s of e) {
    const r = s.type;
    if (!r)
      throw new Error(
        'createSubstitution: each rule must have a "type" (single, multiple, alternate, ligature, reverse)'
      );
    const i = s.feature || "liga", a = s.script || "DFLT", c = s.language || null, f = s.substitutions ? s.substitutions : s.substitution ? [s.substitution] : [];
    if (f.length === 0)
      throw new Error(
        `createSubstitution: rule of type "${r}" must have "substitution" or "substitutions"`
      );
    for (const l of f) {
      const u = { type: r, feature: i, script: a, language: c };
      switch (r) {
        case "single":
          o.push({
            ...u,
            from: Wt(l.from, n),
            to: Wt(l.to, n)
          });
          break;
        case "multiple":
          o.push({
            ...u,
            from: Wt(l.from, n),
            to: Ve(l.to, n)
          });
          break;
        case "alternate":
          o.push({
            ...u,
            from: Wt(l.from, n),
            alternates: Ve(l.alternates, n)
          });
          break;
        case "ligature":
          o.push({
            ...u,
            components: Ve(l.components, n),
            ligature: Wt(l.ligature, n)
          });
          break;
        case "reverse":
          o.push({
            ...u,
            from: Wt(l.from, n),
            to: Wt(l.to, n),
            backtrack: (l.backtrack || []).map(
              (h) => Ve(h, n)
            ),
            lookahead: (l.lookahead || []).map(
              (h) => Ve(h, n)
            )
          });
          break;
        default:
          throw new Error(
            `createSubstitution: unknown type "${r}". Valid: single, multiple, alternate, ligature, reverse`
          );
      }
    }
  }
  return o;
}
function wS(t, e, n = {}) {
  const o = t?.substitutions;
  if (!o || !Array.isArray(o) || o.length === 0) return [];
  const s = t.glyphs, r = Ft(s, e);
  return r === void 0 ? [] : o.filter((i) => {
    if (n.type && i.type !== n.type || n.feature && i.feature !== n.feature) return !1;
    switch (i.type) {
      case "single":
      case "multiple":
      case "alternate":
      case "reverse":
        return i.from === r;
      case "ligature":
        return i.components && i.components.includes(r);
      default:
        return !1;
    }
  });
}
function Wt(t, e) {
  if (typeof t == "string" && t.startsWith("@")) {
    const n = t.slice(1), o = e[n];
    if (!o)
      throw new Error(`createSubstitution: unknown class "@${n}"`);
    return o;
  }
  return t;
}
function Ve(t, e) {
  if (!Array.isArray(t))
    throw new Error("createSubstitution: expected an array of glyph references");
  const n = [];
  for (const o of t)
    if (typeof o == "string" && o.startsWith("@")) {
      const s = o.slice(1), r = e[s];
      if (!r)
        throw new Error(`createSubstitution: unknown class "@${s}"`);
      n.push(...r);
    } else
      n.push(o);
  return n;
}
const bS = [
  "BASE",
  "CBDT",
  "CBLC",
  "COLR",
  "CPAL",
  "DSIG",
  "EBDT",
  "EBLC",
  "EBSC",
  "GDEF",
  "GPOS",
  "GSUB",
  "HVAR",
  "JSTF",
  "LTSH",
  "MATH",
  "MERG",
  "MVAR",
  "OS/2",
  "PCLT",
  "STAT",
  "SVG ",
  "VDMX",
  "VVAR",
  "avar",
  "cmap",
  "fvar",
  "hdmx",
  "head",
  "hhea",
  "hmtx",
  "kern",
  "maxp",
  "meta",
  "name",
  "post",
  "sbix",
  "vhea",
  "vmtx"
], AS = ["CFF ", "CFF2", "VORG"], CS = [
  "cvar",
  "cvt ",
  "fpgm",
  "gasp",
  "glyf",
  "gvar",
  "loca",
  "prep"
], jf = /* @__PURE__ */ new Set([
  ...bS,
  ...AS,
  ...CS
]), Yf = [
  "cmap",
  "head",
  "hhea",
  "hmtx",
  "maxp",
  "name",
  "post"
], vS = /* @__PURE__ */ new Map([
  [65536, "TrueType"],
  [1330926671, "OpenType (CFF)"],
  // 'OTTO'
  [1953658213, "TrueType (Apple)"]
  // 'true'
]);
function C(t, e, n, o) {
  t.push({ severity: e, code: n, message: o });
}
function Tt(t) {
  const e = t.filter((s) => s.severity === "error"), n = t.filter((s) => s.severity === "warning"), o = t.filter((s) => s.severity === "info");
  return {
    valid: e.length === 0,
    errors: e,
    warnings: n,
    infos: o,
    issues: t,
    summary: {
      errorCount: e.length,
      warningCount: n.length,
      infoCount: o.length,
      issueCount: t.length
    }
  };
}
function IS(t) {
  for (let e = 0; e < t.length; e++) {
    const n = t.charCodeAt(e);
    if (n < 32 || n > 126) return !1;
  }
  return !0;
}
function OS(t, e, n) {
  const o = new DataView(t.buffer, t.byteOffset, t.byteLength);
  let s = 0;
  const r = n & -4;
  for (let i = 0; i < r; i += 4)
    s = s + o.getUint32(e + i) >>> 0;
  if (n & 3) {
    let i = 0;
    for (let a = r; a < n; a++)
      i |= t[e + a] << 24 - 8 * (a - r);
    s = s + i >>> 0;
  }
  return s;
}
function kS(t, e) {
  if (!(t instanceof ArrayBuffer))
    return C(e, "error", "NOT_ARRAYBUFFER", "Input is not an ArrayBuffer."), null;
  if (t.byteLength < 12)
    return C(
      e,
      "error",
      "TOO_SHORT",
      `File is only ${t.byteLength} bytes — too short for a valid font header (minimum 12 bytes).`
    ), null;
  const n = new Uint8Array(t), o = String.fromCharCode(n[0], n[1], n[2], n[3]);
  if (o === "wOFF") {
    C(e, "info", "FORMAT_WOFF1", "File is WOFF1-wrapped."), PS(t, e);
    try {
      const { sfnt: s } = Rf(t);
      return C(
        e,
        "info",
        "WOFF1_UNWRAPPED",
        "WOFF1 wrapper decompressed successfully."
      ), { format: "woff1", sfnt: s };
    } catch (s) {
      return C(
        e,
        "error",
        "WOFF1_UNWRAP_FAILED",
        `WOFF1 decompression failed: ${s.message}`
      ), null;
    }
  }
  if (o === "wOF2") {
    C(e, "info", "FORMAT_WOFF2", "File is WOFF2-wrapped."), US(t, e);
    try {
      const { sfnt: s } = Vf(t);
      return C(
        e,
        "info",
        "WOFF2_UNWRAPPED",
        "WOFF2 wrapper decompressed successfully."
      ), { format: "woff2", sfnt: s };
    } catch (s) {
      return C(
        e,
        "error",
        "WOFF2_UNWRAP_FAILED",
        `WOFF2 decompression failed: ${s.message}`
      ), null;
    }
  }
  return o === "ttcf" ? (C(
    e,
    "info",
    "FORMAT_COLLECTION",
    "File is a font collection (TTC/OTC). Diagnosing the first font in the collection."
  ), { format: "collection", sfnt: t }) : { format: "sfnt", sfnt: t };
}
function ES(t, e) {
  const n = new Uint8Array(t), o = new F(n);
  let s;
  try {
    s = {
      sfVersion: o.uint32(),
      numTables: o.uint16(),
      searchRange: o.uint16(),
      entrySelector: o.uint16(),
      rangeShift: o.uint16()
    };
  } catch (a) {
    return C(
      e,
      "error",
      "HEADER_UNREADABLE",
      `Could not read font header: ${a.message}`
    ), null;
  }
  const r = vS.get(s.sfVersion);
  if (r)
    C(
      e,
      "info",
      "SF_VERSION",
      `sfVersion indicates ${r}.`
    );
  else {
    const a = "0x" + s.sfVersion.toString(16).padStart(8, "0");
    C(
      e,
      "error",
      "BAD_SF_VERSION",
      `Unrecognized sfVersion ${a}. Expected 0x00010000 (TrueType), 0x4F54544F (OTTO), or 0x74727565 ('true').`
    );
  }
  s.numTables === 0 ? C(
    e,
    "error",
    "NO_TABLES",
    "numTables is 0 — the font contains no tables."
  ) : s.numTables > 200 && C(
    e,
    "warning",
    "EXCESSIVE_TABLES",
    `numTables is ${s.numTables}, which is unusually high.`
  );
  const i = 12 + s.numTables * 16;
  if (i > t.byteLength)
    return C(
      e,
      "error",
      "DIRECTORY_TRUNCATED",
      `Table directory requires ${i} bytes but the file is only ${t.byteLength} bytes. The file appears truncated.`
    ), null;
  if (s.numTables > 0) {
    const a = 2 ** Math.floor(Math.log2(s.numTables)), c = a * 16, f = Math.floor(Math.log2(a)), l = s.numTables * 16 - c;
    s.searchRange !== c && C(
      e,
      "warning",
      "BAD_SEARCH_RANGE",
      `searchRange is ${s.searchRange}, expected ${c}.`
    ), s.entrySelector !== f && C(
      e,
      "warning",
      "BAD_ENTRY_SELECTOR",
      `entrySelector is ${s.entrySelector}, expected ${f}.`
    ), s.rangeShift !== l && C(
      e,
      "warning",
      "BAD_RANGE_SHIFT",
      `rangeShift is ${s.rangeShift}, expected ${l}.`
    );
  }
  return s;
}
function TS(t, e, n) {
  const o = new Uint8Array(t), s = new F(o, 12), r = [], i = /* @__PURE__ */ new Set();
  for (let f = 0; f < e.numTables; f++) {
    let l;
    try {
      l = {
        tag: s.tag(),
        checksum: s.uint32(),
        offset: s.uint32(),
        length: s.uint32()
      };
    } catch (u) {
      C(
        n,
        "error",
        "DIRECTORY_ENTRY_UNREADABLE",
        `Could not read table directory entry ${f}: ${u.message}`
      );
      continue;
    }
    if (!IS(l.tag)) {
      const u = [...l.tag].map((h) => h.charCodeAt(0).toString(16).padStart(2, "0")).join(" ");
      C(
        n,
        "error",
        "BAD_TABLE_TAG",
        `Table ${f} has non-printable tag bytes (${u}).`
      );
    }
    i.has(l.tag) && C(
      n,
      "error",
      "DUPLICATE_TABLE",
      `Duplicate table tag '${l.tag}'.`
    ), i.add(l.tag), l.offset + l.length > t.byteLength && C(
      n,
      "error",
      "TABLE_OUT_OF_BOUNDS",
      `Table '${l.tag}' extends beyond end of file (offset ${l.offset} + length ${l.length} = ${l.offset + l.length}, but file is ${t.byteLength} bytes).`
    ), l.length === 0 && C(
      n,
      "warning",
      "EMPTY_TABLE",
      `Table '${l.tag}' has zero length.`
    ), l.offset % 4 !== 0 && C(
      n,
      "warning",
      "TABLE_MISALIGNED",
      `Table '${l.tag}' at offset ${l.offset} is not 4-byte aligned.`
    ), r.push(l);
  }
  for (let f = 1; f < r.length; f++) {
    const l = r[f - 1].tag.padEnd(4, " "), u = r[f].tag.padEnd(4, " ");
    if (l >= u) {
      C(
        n,
        "error",
        "DIRECTORY_NOT_SORTED",
        `Table directory is not sorted: '${r[f - 1].tag}' precedes '${r[f].tag}'. Tables must be sorted in ascending order by 4-byte tag.`
      );
      break;
    }
  }
  const a = 1024 * 1024 * 1024;
  for (const f of r)
    f.length > a && C(
      n,
      "error",
      "TABLE_LENGTH_EXCEEDS_1GB",
      `Table '${f.tag}' has length ${f.length} bytes (> 1 GiB); Firefox/OTS will reject it.`
    );
  const c = r.filter((f) => f.length > 0 && f.offset + f.length <= t.byteLength).slice().sort((f, l) => f.offset - l.offset);
  for (let f = 1; f < c.length; f++) {
    const l = c[f - 1], u = c[f], h = l.offset + l.length;
    h > u.offset && C(
      n,
      "error",
      "TABLES_OVERLAPPING",
      `Tables '${l.tag}' and '${u.tag}' overlap (${l.tag} ends at ${h}, ${u.tag} starts at ${u.offset}).`
    );
  }
  return r;
}
function DS(t, e) {
  const n = new Set(t.map((r) => r.tag));
  for (const r of Yf)
    n.has(r) || C(
      e,
      "error",
      "MISSING_REQUIRED_TABLE",
      `Required table '${r}' is missing.`
    );
  const o = n.has("glyf") && n.has("loca"), s = n.has("CFF ") || n.has("CFF2");
  !o && !s && C(
    e,
    "error",
    "NO_OUTLINES",
    "No outline data found. Expected glyf+loca (TrueType) or CFF/CFF2 (OpenType)."
  ), o && s && C(
    e,
    "warning",
    "MIXED_OUTLINES",
    "Font has both TrueType (glyf) and CFF outlines — unusual."
  );
  for (const r of n)
    jf.has(r) || C(
      e,
      "info",
      "UNKNOWN_TABLE",
      `Unrecognized table '${r}' — will be preserved as raw bytes.`
    );
}
function RS(t, e, n) {
  const o = new Uint8Array(t);
  for (const s of e) {
    if (s.offset + s.length > t.byteLength || s.length === 0 || s.tag === "head") continue;
    const r = OS(o, s.offset, s.length);
    r !== s.checksum && C(
      n,
      "warning",
      "BAD_CHECKSUM",
      `Table '${s.tag}' checksum mismatch: directory says 0x${s.checksum.toString(16).padStart(8, "0")}, computed 0x${r.toString(16).padStart(8, "0")}.`
    );
  }
}
function FS(t, e, n) {
  const o = new Map(e.map((c) => [c.tag, c])), s = {}, r = Pf.filter((c) => o.has(c)), i = e.map((c) => c.tag).filter((c) => !r.includes(c)), a = [...r, ...i];
  for (const c of a) {
    const f = o.get(c);
    if (f.offset + f.length > t.byteLength) continue;
    const l = Gf[c];
    if (l)
      try {
        const u = new Uint8Array(t, f.offset, f.length), h = Array.from(u);
        s[c] = l(h, s), C(
          n,
          "info",
          "TABLE_PARSED",
          `Table '${c}' parsed successfully.`
        );
      } catch (u) {
        C(
          n,
          "error",
          "TABLE_PARSE_FAILED",
          `Table '${c}' failed to parse: ${u.message}`
        );
      }
  }
  return s;
}
function MS(t) {
  return t >= 6155 && t <= 6157 || t >= 65024 && t <= 65039 || t >= 917760 && t <= 917999;
}
function LS(t) {
  if (t.idRangeOffset === 0) {
    const e = t.startCode + t.idDelta & 65535, n = t.endCode + t.idDelta & 65535;
    return Math.max(e, n);
  }
  return null;
}
function BS(t, e, n) {
  typeof t.version == "number" && t.version !== 0 && C(
    n,
    "error",
    "CMAP_VERSION_INVALID",
    `cmap.version is ${t.version}; must be 0.`
  );
  const o = t.encodingRecords || [], s = t.subtables || [];
  if (o.length === 0) {
    C(
      n,
      "error",
      "CMAP_NO_SUBTABLES",
      "cmap has no encoding records."
    );
    return;
  }
  let r = !1;
  for (const a of o) {
    const c = s[a.subtableIndex];
    if (!c) continue;
    const f = c.format, l = `${a.platformID}-${a.encodingID}-${f}`;
    if (l === "3-1-4" || l === "3-10-12" || l === "3-10-13" || l === "0-3-4" || l === "3-0-4") {
      r = !0;
      break;
    }
  }
  r || C(
    n,
    "error",
    "CMAP_NO_SUPPORTED_SUBTABLE",
    "cmap has no supported Unicode subtable (expected one of (3,1,4), (3,10,12), (3,10,13), (0,3,4), or (3,0,4))."
  );
  for (const a of o) {
    if (a.platformID !== 3) continue;
    const c = s[a.subtableIndex];
    if (c && c.language !== void 0 && c.language !== 0) {
      C(
        n,
        "error",
        "CMAP_LANGUAGE_NONZERO_FOR_WINDOWS",
        `cmap subtable (pid=3, eid=${a.encodingID}, fmt=${c.format}) has language=${c.language}; Windows-platform subtables must use language=0.`
      );
      break;
    }
  }
  const i = e?.numGlyphs;
  for (let a = 0; a < s.length; a++) {
    const c = s[a];
    if (!c) continue;
    const f = c.format;
    if (f === 4) {
      const l = c.segments || [];
      if (l.length < 1) {
        C(
          n,
          "error",
          "CMAP_FORMAT4_SEGCOUNT_INVALID",
          `cmap format-4 subtable ${a} has no segments.`
        );
        continue;
      }
      const u = l[l.length - 1];
      (u.startCode !== 65535 || u.endCode !== 65535) && C(
        n,
        "error",
        "CMAP_FORMAT4_INVALID_TERMINATOR",
        `cmap format-4 subtable ${a}: final segment is [${u.startCode.toString(16)}-${u.endCode.toString(16)}], must be [FFFF-FFFF].`
      );
      let h = -1;
      for (let p = 0; p < l.length; p++) {
        const g = l[p];
        if (g.startCode > g.endCode) {
          C(
            n,
            "error",
            "CMAP_FORMAT4_RANGES_OUT_OF_ORDER",
            `cmap format-4 subtable ${a} segment ${p}: startCode (0x${g.startCode.toString(16)}) > endCode (0x${g.endCode.toString(16)}).`
          );
          break;
        }
        if (g.endCode <= h) {
          C(
            n,
            "error",
            "CMAP_FORMAT4_RANGES_OUT_OF_ORDER",
            `cmap format-4 subtable ${a} segment ${p}: endCode (0x${g.endCode.toString(16)}) is not greater than previous endCode (0x${h.toString(16)}).`
          );
          break;
        }
        h = g.endCode;
      }
      if (i !== void 0) {
        let p = !1;
        for (let d = 0; d < l.length && !p; d++) {
          const x = l[d];
          if (x.startCode === 65535 && x.endCode === 65535) continue;
          const y = LS(x);
          y !== null && y >= i && (C(
            n,
            "error",
            "CMAP_GLYPH_OUT_OF_RANGE",
            `cmap format-4 subtable ${a} segment ${d}: glyph id ${y} >= numGlyphs (${i}).`
          ), p = !0);
        }
        const g = c.glyphIdArray || [];
        for (let d = 0; d < g.length && !p; d++)
          g[d] !== 0 && g[d] >= i && (C(
            n,
            "error",
            "CMAP_GLYPH_OUT_OF_RANGE",
            `cmap format-4 subtable ${a} glyphIdArray[${d}] = ${g[d]} >= numGlyphs (${i}).`
          ), p = !0);
      }
    } else if (f === 12 || f === 13) {
      const l = c.groups || [];
      let u = -1, h = !1, p = !1;
      for (let g = 0; g < l.length; g++) {
        const d = l[g];
        if (d.endCharCode < d.startCharCode && !h) {
          C(
            n,
            "error",
            "CMAP_FORMAT12_END_BEFORE_START",
            `cmap format-${f} subtable ${a} group ${g}: endCharCode (0x${d.endCharCode.toString(16)}) < startCharCode (0x${d.startCharCode.toString(16)}).`
          ), h = !0;
          break;
        }
        if (d.startCharCode <= u && !h) {
          C(
            n,
            "error",
            "CMAP_FORMAT12_GROUPS_OUT_OF_ORDER",
            `cmap format-${f} subtable ${a} group ${g}: startCharCode (0x${d.startCharCode.toString(16)}) is not greater than previous endCharCode (0x${u.toString(16)}).`
          ), h = !0;
          break;
        }
        if (u = d.endCharCode, i !== void 0 && !p)
          if (f === 12) {
            const x = d.endCharCode - d.startCharCode, y = d.startGlyphID + x;
            y >= i && (C(
              n,
              "error",
              "CMAP_GLYPH_OUT_OF_RANGE",
              `cmap format-12 subtable ${a} group ${g}: maps to glyph id ${y} >= numGlyphs (${i}).`
            ), p = !0);
          } else f === 13 && d.glyphID >= i && (C(
            n,
            "error",
            "CMAP_GLYPH_OUT_OF_RANGE",
            `cmap format-13 subtable ${a} group ${g}: glyphID ${d.glyphID} >= numGlyphs (${i}).`
          ), p = !0);
      }
    } else if (f === 14) {
      const l = c.varSelectorRecords || [];
      let u = -1, h = !1, p = !1;
      for (let g = 0; g < l.length; g++) {
        const d = l[g];
        if (!MS(d.varSelector) && !p) {
          C(
            n,
            "error",
            "CMAP_FORMAT14_VS_OUT_OF_RANGE",
            `cmap format-14 subtable ${a} record ${g}: varSelector U+${d.varSelector.toString(16).toUpperCase()} is not in a valid variation-selector range.`
          ), p = !0;
          break;
        }
        if (d.varSelector <= u && !h) {
          C(
            n,
            "error",
            "CMAP_FORMAT14_VS_OUT_OF_ORDER",
            `cmap format-14 subtable ${a} record ${g}: varSelector U+${d.varSelector.toString(16).toUpperCase()} is not greater than previous (U+${u.toString(16).toUpperCase()}).`
          ), h = !0;
          break;
        }
        if (u = d.varSelector, i !== void 0 && d.nonDefaultUVS) {
          for (const x of d.nonDefaultUVS)
            if (x.glyphID >= i) {
              C(
                n,
                "error",
                "CMAP_GLYPH_OUT_OF_RANGE",
                `cmap format-14 subtable ${a} record ${g}: nonDefaultUVS mapping has glyphID ${x.glyphID} >= numGlyphs (${i}).`
              );
              break;
            }
        }
      }
    }
  }
}
const Wi = 783, ji = 127;
function VS(t, e, n) {
  typeof t.usWeightClass == "number" && (t.usWeightClass < 1 || t.usWeightClass > 1e3) && C(
    n,
    "warning",
    "OS2_WEIGHT_CLAMPED",
    `OS/2.usWeightClass is ${t.usWeightClass}; must be in [1, 1000].`
  ), typeof t.usWidthClass == "number" && (t.usWidthClass < 1 || t.usWidthClass > 9) && C(
    n,
    "warning",
    "OS2_WIDTH_CLAMPED",
    `OS/2.usWidthClass is ${t.usWidthClass}; must be in [1, 9].`
  ), typeof t.fsType == "number" && (t.fsType & ~Wi) !== 0 && C(
    n,
    "warning",
    "OS2_FSTYPE_RESERVED_BITS_SET",
    `OS/2.fsType has reserved bits set (0x${(t.fsType >>> 0).toString(16).padStart(4, "0")}); valid mask is 0x${Wi.toString(16).padStart(4, "0")}.`
  );
  const o = [
    "ySubscriptXSize",
    "ySubscriptYSize",
    "ySuperscriptXSize",
    "ySuperscriptYSize",
    "yStrikeoutSize"
  ];
  for (const s of o)
    if (typeof t[s] == "number" && t[s] < 0) {
      C(
        n,
        "warning",
        "OS2_NEGATIVE_SIZE",
        `OS/2.${s} is ${t[s]}; must be ≥ 0.`
      );
      break;
    }
  if (typeof t.usFirstCharIndex == "number" && typeof t.usLastCharIndex == "number" && t.usFirstCharIndex > t.usLastCharIndex && C(
    n,
    "warning",
    "OS2_FIRST_LAST_CHAR_INVERTED",
    `OS/2.usFirstCharIndex (${t.usFirstCharIndex}) > usLastCharIndex (${t.usLastCharIndex}).`
  ), typeof t.sTypoLineGap == "number" && t.sTypoLineGap < 0 && C(
    n,
    "warning",
    "OS2_TYPO_LINEGAP_NEGATIVE",
    `OS/2.sTypoLineGap is ${t.sTypoLineGap}; must be ≥ 0.`
  ), typeof t.sxHeight == "number" && t.sxHeight < 0 && C(
    n,
    "warning",
    "OS2_X_HEIGHT_NEGATIVE",
    `OS/2.sxHeight is ${t.sxHeight}; must be ≥ 0.`
  ), typeof t.sCapHeight == "number" && t.sCapHeight < 0 && C(
    n,
    "warning",
    "OS2_CAP_HEIGHT_NEGATIVE",
    `OS/2.sCapHeight is ${t.sCapHeight}; must be ≥ 0.`
  ), typeof t.usLowerOpticalPointSize == "number" && t.usLowerOpticalPointSize > 65534 && C(
    n,
    "warning",
    "OS2_OPTICAL_POINTSIZE_OUT_OF_RANGE",
    `OS/2.usLowerOpticalPointSize is ${t.usLowerOpticalPointSize}; must be ≤ 0xFFFE.`
  ), typeof t.usUpperOpticalPointSize == "number" && t.usUpperOpticalPointSize < 2 && C(
    n,
    "warning",
    "OS2_OPTICAL_POINTSIZE_OUT_OF_RANGE",
    `OS/2.usUpperOpticalPointSize is ${t.usUpperOpticalPointSize}; must be ≥ 2.`
  ), e && typeof t.fsSelection == "number" && typeof e.macStyle == "number") {
    const s = (t.fsSelection & 1) !== 0, r = (t.fsSelection & 32) !== 0, i = (e.macStyle & 1) !== 0, a = (e.macStyle & 2) !== 0;
    (s !== a || r !== i) && C(
      n,
      "warning",
      "OS2_FSSELECTION_HEAD_MACSTYLE_MISMATCH",
      `OS/2.fsSelection (italic=${s}, bold=${r}) does not match head.macStyle (italic=${a}, bold=${i}).`
    ), (e.macStyle & ~ji) !== 0 && C(
      n,
      "warning",
      "HEAD_MACSTYLE_RESERVED_BITS_SET",
      `head.macStyle has reserved bits set (0x${e.macStyle.toString(16).padStart(4, "0")}); valid mask is 0x${ji.toString(16).padStart(4, "0")}.`
    );
  }
}
const Yi = 32 * 1024, Zi = 200, $S = /[\x00-\x20\x7F-\uFFFF[\](){}<>/%]/;
function NS(t, e, n, o) {
  typeof t.version == "number" && t.version > 1 && C(
    o,
    "error",
    "NAME_FORMAT_INVALID",
    `name table format is ${t.version}; must be 0 or 1.`
  );
  const s = e.find((i) => i.tag === "name");
  if (s && s.length >= 6 && s.offset + s.length <= n.byteLength) {
    const i = new DataView(n, s.offset, s.length), a = i.getUint16(2), c = i.getUint16(4), f = 6 + a * 12;
    (c < f || c > s.length) && C(
      o,
      "error",
      "NAME_STRING_OFFSET_INVALID",
      `name.stringOffset (${c}) is outside the table (records end at ${f}, table length ${s.length}).`
    );
    let l = !1;
    const u = Math.min(a, Math.floor((s.length - 6) / 12));
    for (let h = 0; h < u; h++) {
      const p = 6 + h * 12, g = i.getUint16(p + 8), d = i.getUint16(p + 10), x = c + d, y = x + g;
      y > s.length && (l || (C(
        o,
        "error",
        "NAME_RECORD_OUT_OF_BOUNDS",
        `name record ${h} string overruns the table (offset ${x} + length ${g} = ${y}, table length ${s.length}).`
      ), l = !0)), g > Yi && C(
        o,
        "warning",
        "NAME_STRING_TOO_LONG",
        `name record ${h} (nameID=${i.getUint16(p + 6)}) is ${g} bytes; > ${Yi} is suspicious.`
      );
    }
  }
  if (Array.isArray(t.langTagRecords))
    for (let i = 0; i < t.langTagRecords.length; i++) {
      const c = (t.langTagRecords[i].tag ?? "").length * 2;
      c > Zi && C(
        o,
        "error",
        "NAME_LANG_TAG_TOO_LONG",
        `name.langTagRecord ${i} is ${c} bytes; spec limit is ${Zi}.`
      );
    }
  const r = t.nameRecords ?? t.names ?? t.records ?? [];
  for (const i of r) {
    if (i.nameID !== 6) continue;
    const a = i.value ?? i.string ?? "";
    if (typeof a == "string" && $S.test(a)) {
      C(
        o,
        "warning",
        "NAME_POSTSCRIPT_NAME_INVALID_CHARS",
        `PostScript name "${a}" contains invalid characters; only printable 7-bit ASCII excluding [](){}<>/% is allowed.`
      );
      break;
    }
  }
}
const $e = 44, In = 20, GS = 48;
function PS(t, e) {
  if (t.byteLength < $e) return;
  const n = new DataView(t), o = n.getUint32(8), s = n.getUint16(12), r = n.getUint16(14), i = n.getUint32(16), a = n.getUint32(24), c = n.getUint32(28), f = n.getUint32(36), l = n.getUint32(40);
  r !== 0 && C(
    e,
    "error",
    "WOFF1_RESERVED_FIELD_NONZERO",
    `WOFF1 header reserved field is 0x${r.toString(16)}; must be 0.`
  ), o !== t.byteLength && C(
    e,
    "error",
    "WOFF1_FILE_SIZE_MISMATCH",
    `WOFF1 header.length (${o}) does not match file size (${t.byteLength}).`
  );
  const u = $e + s * In;
  if (u <= t.byteLength) {
    let p = 12 + 16 * s;
    for (let g = 0; g < s; g++) {
      const d = n.getUint32(
        $e + g * In + 12
      );
      p += d + 3 & -4;
    }
    p !== i && C(
      e,
      "error",
      "WOFF1_SFNT_SIZE_MISMATCH",
      `WOFF1 header.totalSfntSize (${i}) does not match computed size from directory (${p}).`
    );
  }
  a === 0 != (c === 0) ? C(
    e,
    "error",
    "WOFF1_METADATA_BLOCK_INVALID",
    `WOFF1 metadata block has inconsistent offset/length (offset=${a}, length=${c}); both must be zero or both non-zero.`
  ) : c > 0 && (a < u || a + c > t.byteLength) && C(
    e,
    "error",
    "WOFF1_METADATA_BLOCK_INVALID",
    `WOFF1 metadata block (offset ${a}, length ${c}) is out of bounds (file size ${t.byteLength}, directory ends at ${u}).`
  ), f === 0 != (l === 0) ? C(
    e,
    "error",
    "WOFF1_PRIVATE_BLOCK_INVALID",
    `WOFF1 private block has inconsistent offset/length (offset=${f}, length=${l}); both must be zero or both non-zero.`
  ) : l > 0 && (f < u || f + l > t.byteLength) && C(
    e,
    "error",
    "WOFF1_PRIVATE_BLOCK_INVALID",
    `WOFF1 private block (offset ${f}, length ${l}) is out of bounds (file size ${t.byteLength}, directory ends at ${u}).`
  );
  let h = u;
  if (u <= t.byteLength)
    for (let p = 0; p < s; p++) {
      const g = n.getUint32($e + p * In + 4), d = n.getUint32(
        $e + p * In + 8
      ), x = g + d + 3 & -4;
      x > h && (h = x);
    }
  if (c > 0) {
    const p = a + c + 3 & -4;
    p > h && (h = p);
  }
  if (l > 0) {
    const p = f + l;
    p > h && (h = p);
  }
  if (h > 0 && h < t.byteLength) {
    const p = t.byteLength - h;
    p > 3 && C(
      e,
      "warning",
      "WOFF1_TRAILING_JUNK",
      `WOFF1 file has ${p} bytes of trailing data after the last block (ends at ${h}, file size ${t.byteLength}).`
    );
  }
}
function US(t, e) {
  if (t.byteLength < GS) return;
  const n = new DataView(t), o = n.getUint32(8), s = n.getUint16(14), r = n.getUint32(16), i = n.getUint32(20);
  s !== 0 && C(
    e,
    "error",
    "WOFF2_RESERVED_FIELD_NONZERO",
    `WOFF2 header reserved field is 0x${s.toString(16)}; must be 0.`
  ), o !== t.byteLength && C(
    e,
    "error",
    "WOFF2_FILE_SIZE_MISMATCH",
    `WOFF2 header.length (${o}) does not match file size (${t.byteLength}).`
  ), r < 12 && C(
    e,
    "error",
    "WOFF2_DECOMPRESSED_SIZE_INVALID",
    `WOFF2 header.totalSfntSize (${r}) is too small to be a valid SFNT.`
  ), i > t.byteLength && C(
    e,
    "error",
    "WOFF2_DECOMPRESSED_SIZE_INVALID",
    `WOFF2 header.totalCompressedSize (${i}) exceeds file size (${t.byteLength}).`
  );
}
const Xi = 224;
function zS(t, e) {
  const n = t.axes ?? [], o = /* @__PURE__ */ new Set();
  for (let r = 0; r < n.length; r++) {
    const i = n[r];
    i.minValue <= i.defaultValue && i.defaultValue <= i.maxValue || C(
      e,
      "error",
      "FVAR_AXIS_RANGE_INVALID",
      `fvar axis '${i.axisTag}' violates min ≤ default ≤ max (min=${i.minValue}, default=${i.defaultValue}, max=${i.maxValue}).`
    ), o.has(i.axisTag) ? C(
      e,
      "error",
      "FVAR_AXIS_DUPLICATE_TAG",
      `fvar has multiple axes with tag '${i.axisTag}'.`
    ) : o.add(i.axisTag);
  }
  const s = t.instances ?? [];
  for (let r = 0; r < s.length; r++) {
    const i = s[r], a = i.coordinates ?? i.coords ?? [];
    for (let c = 0; c < Math.min(a.length, n.length); c++) {
      const f = a[c], l = n[c];
      if (typeof f != "number" || f < l.minValue || f > l.maxValue) {
        C(
          e,
          "error",
          "FVAR_INSTANCE_OUT_OF_RANGE",
          `fvar instance ${r} coordinate for axis '${l.axisTag}' is ${f}, outside axis range [${l.minValue}, ${l.maxValue}].`
        );
        break;
      }
    }
  }
}
function qi(t, e, n) {
  const o = t?.lookupList?.lookups ?? [], s = 1, r = e === "GSUB" ? 8 : 9;
  let i = !1, a = !1;
  for (let c = 0; c < o.length; c++) {
    const f = o[c];
    if ((typeof f.lookupType != "number" || f.lookupType < s || f.lookupType > r) && (i || (C(
      n,
      "error",
      `${e}_LOOKUP_TYPE_INVALID`,
      `${e} lookup ${c} has invalid lookupType ${f.lookupType}; must be in [${s}, ${r}].`
    ), i = !0)), typeof f.lookupFlag == "number" && (f.lookupFlag & Xi) !== 0 && !a && (C(
      n,
      "warning",
      "LAYOUT_LOOKUP_FLAG_RESERVED",
      `${e} lookup ${c} has reserved bits set in lookupFlag (0x${f.lookupFlag.toString(16).padStart(
        4,
        "0"
      )}); reserved mask is 0x${Xi.toString(16).padStart(4, "0")}.`
    ), a = !0), typeof f.lookupFlag == "number" && (f.lookupFlag & -256 & 65535) !== 0) {
      C(
        n,
        "error",
        "LAYOUT_LOOKUP_FLAG_INVALID",
        `${e} lookup ${c} has bits set outside the valid lookupFlag mask 0x00FF (got 0x${f.lookupFlag.toString(16).padStart(4, "0")}).`
      );
      break;
    }
  }
}
const HS = 65534, WS = 65534;
function jS(t, e, n) {
  const o = t.axes ?? [], s = t.instances ?? [], r = /* @__PURE__ */ new Set();
  if (e && Array.isArray(e.names))
    for (const i of e.names)
      i && typeof i.nameID == "number" && r.add(i.nameID);
  for (let i = 0; i < o.length; i++) {
    const a = o[i];
    typeof a.flags == "number" && (a.flags & HS) !== 0 && C(
      n,
      "warning",
      "FVAR_AXIS_FLAGS_RESERVED",
      `fvar axis '${a.axisTag}' has reserved bits set in flags (0x${a.flags.toString(16).padStart(4, "0")}); only bit 0 (HIDDEN_AXIS) is defined.`
    ), typeof a.axisNameID == "number" && a.axisNameID < 256 ? C(
      n,
      "warning",
      "FVAR_AXIS_NAMEID_RESERVED",
      `fvar axis '${a.axisTag}' axisNameID is ${a.axisNameID}; axis name IDs should be ≥ 256.`
    ) : typeof a.axisNameID == "number" && r.size > 0 && !r.has(a.axisNameID) && C(
      n,
      "warning",
      "FVAR_AXIS_NAMEID_MISSING",
      `fvar axis '${a.axisTag}' axisNameID ${a.axisNameID} has no matching name record.`
    );
  }
  for (let i = 0; i < s.length; i++) {
    const a = s[i];
    typeof a.flags == "number" && (a.flags & WS) !== 0 && C(
      n,
      "warning",
      "FVAR_INSTANCE_FLAGS_RESERVED",
      `fvar instance ${i} has reserved bits set in flags (0x${a.flags.toString(16).padStart(4, "0")}).`
    );
    const c = [
      ["subfamilyNameID", a.subfamilyNameID],
      ["postScriptNameID", a.postScriptNameID]
    ];
    for (const [f, l] of c)
      l === void 0 || l === 65535 || typeof l == "number" && r.size > 0 && !r.has(l) && l !== 2 && l !== 17 && l !== 6 && C(
        n,
        "warning",
        "FVAR_INSTANCE_NAMEID_MISSING",
        `fvar instance ${i} ${f} ${l} has no matching name record.`
      );
  }
}
function YS(t, e, n) {
  typeof t.majorVersion == "number" && t.majorVersion !== 1 && C(
    n,
    "error",
    "STAT_VERSION_INVALID",
    `STAT majorVersion must be 1, got ${t.majorVersion}.`
  ), typeof t.designAxisSize == "number" && t.designAxisSize < 8 && C(
    n,
    "error",
    "STAT_DESIGN_AXIS_SIZE_INVALID",
    `STAT designAxisSize must be ≥ 8, got ${t.designAxisSize}.`
  );
  const o = t.designAxes ?? [], s = e?.axes ?? [], r = /* @__PURE__ */ new Set();
  for (let a = 0; a < o.length; a++) {
    const c = o[a];
    typeof c.axisTag == "string" && (r.has(c.axisTag) && C(
      n,
      "warning",
      "STAT_AXIS_DUPLICATE_TAG",
      `STAT designAxes contains duplicate axisTag '${c.axisTag}'.`
    ), r.add(c.axisTag));
  }
  if (s.length > 0)
    for (const a of s)
      r.has(a.axisTag) || C(
        n,
        "warning",
        "STAT_MISSING_FVAR_AXIS",
        `STAT designAxes is missing an entry for fvar axis '${a.axisTag}'.`
      );
  const i = t.axisValues ?? [];
  for (let a = 0; a < i.length; a++) {
    const c = i[a];
    if (!(!c || typeof c != "object") && ((c.format === 1 || c.format === 2 || c.format === 3) && typeof c.axisIndex == "number" && (c.axisIndex < 0 || c.axisIndex >= o.length) && C(
      n,
      "error",
      "STAT_AXIS_VALUE_AXIS_INDEX_OUT_OF_RANGE",
      `STAT axisValue ${a} (format ${c.format}) references axisIndex ${c.axisIndex} but only ${o.length} design axes are defined.`
    ), c.format === 2 && typeof c.rangeMinValue == "number" && typeof c.rangeMaxValue == "number" && typeof c.nominalValue == "number" && !(c.rangeMinValue <= c.nominalValue && c.nominalValue <= c.rangeMaxValue) && C(
      n,
      "error",
      "STAT_AXIS_VALUE_RANGE_INVALID",
      `STAT axisValue ${a} (format 2) violates rangeMin ≤ nominal ≤ rangeMax (min=${c.rangeMinValue}, nominal=${c.nominalValue}, max=${c.rangeMaxValue}).`
    ), c.format === 4 && Array.isArray(c.axisValues))) {
      for (const f of c.axisValues)
        if (typeof f.axisIndex == "number" && (f.axisIndex < 0 || f.axisIndex >= o.length)) {
          C(
            n,
            "error",
            "STAT_AXIS_VALUE_AXIS_INDEX_OUT_OF_RANGE",
            `STAT axisValue ${a} (format 4) sub-record references axisIndex ${f.axisIndex} but only ${o.length} design axes are defined.`
          );
          break;
        }
    }
  }
}
function ZS(t, e, n) {
  const o = t.segmentMaps ?? [], s = e?.axes ?? [];
  s.length > 0 && o.length !== s.length && C(
    n,
    "error",
    "AVAR_SEGMENT_COUNT_MISMATCH",
    `avar has ${o.length} segment maps but fvar declares ${s.length} axes.`
  );
  for (let r = 0; r < o.length; r++) {
    const i = o[r].axisValueMaps ?? [];
    let a = -1 / 0, c = !1, f = !1, l = !1, u = !1, h = !1;
    for (let p = 0; p < i.length; p++) {
      const { fromCoordinate: g, toCoordinate: d } = i[p];
      !u && (typeof g != "number" || typeof d != "number" || g < -1 || g > 1 || d < -1 || d > 1) && (C(
        n,
        "error",
        "AVAR_COORD_OUT_OF_RANGE",
        `avar axis ${r} segment map entry ${p} has out-of-range coordinate (from=${g}, to=${d}); both must be in [-1, 1].`
      ), u = !0), !h && typeof g == "number" && g <= a && (C(
        n,
        "error",
        "AVAR_FROM_COORD_NOT_INCREASING",
        `avar axis ${r} segment map fromCoordinate values must be strictly increasing (entry ${p} = ${g}, previous = ${a}).`
      ), h = !0), typeof g == "number" && (a = g), g === -1 && d === -1 && (c = !0), g === 0 && d === 0 && (f = !0), g === 1 && d === 1 && (l = !0);
    }
    i.length > 0 && !(c && f && l) && C(
      n,
      "error",
      "AVAR_MISSING_REQUIRED_ENDPOINTS",
      `avar axis ${r} segment map must include (-1,-1), (0,0), and (1,1) entries when non-empty.`
    );
  }
}
function Ws(t, e, n, o) {
  if (!t) return;
  const s = t.variationRegionList;
  if (!s) return;
  e > 0 && typeof s.axisCount == "number" && s.axisCount !== e && C(
    o,
    "error",
    "IVS_AXIS_COUNT_MISMATCH",
    `${n} ItemVariationStore declares axisCount=${s.axisCount} but fvar has ${e} axes.`
  );
  const r = s.regions ?? [];
  let i = !1;
  for (let f = 0; f < r.length; f++) {
    const l = r[f].regionAxes ?? [];
    for (let u = 0; u < l.length; u++) {
      const { startCoord: h, peakCoord: p, endCoord: g } = l[u];
      !i && (typeof h != "number" || typeof p != "number" || typeof g != "number" || h < -1 || h > 1 || p < -1 || p > 1 || g < -1 || g > 1) && (C(
        o,
        "error",
        "IVS_REGION_COORD_OUT_OF_RANGE",
        `${n} ItemVariationStore region ${f} axis ${u} has out-of-range coords (start=${h}, peak=${p}, end=${g}); all must be in [-1, 1].`
      ), i = !0), !i && typeof h == "number" && typeof p == "number" && typeof g == "number" && !(h <= p && p <= g) && (C(
        o,
        "error",
        "IVS_REGION_PEAK_OUT_OF_ORDER",
        `${n} ItemVariationStore region ${f} axis ${u} violates start ≤ peak ≤ end (start=${h}, peak=${p}, end=${g}).`
      ), i = !0);
    }
  }
  const a = t.itemVariationData ?? [];
  let c = !1;
  for (let f = 0; f < a.length; f++) {
    const l = a[f];
    if (!l) continue;
    const u = l.regionIndexes ?? [];
    for (let h = 0; h < u.length; h++)
      u[h] >= r.length && !c && (C(
        o,
        "error",
        "IVS_REGION_INDEX_OUT_OF_RANGE",
        `${n} ItemVariationData ${f} regionIndex ${u[h]} is ≥ regionCount (${r.length}).`
      ), c = !0);
  }
}
function XS(t, e, n) {
  typeof t.valueRecordSize == "number" && t.valueRecordSize < 8 && C(
    n,
    "error",
    "MVAR_VALUE_RECORD_SIZE_INVALID",
    `MVAR valueRecordSize must be ≥ 8, got ${t.valueRecordSize}.`
  );
  const o = t.itemVariationStore, s = t.valueRecords ?? [], r = o?.itemVariationData ?? [];
  let i = !1, a = !1;
  for (let c = 0; c < s.length; c++) {
    const f = s[c], l = f.deltaSetOuterIndex, u = f.deltaSetInnerIndex;
    !i && typeof l == "number" && l >= r.length && (C(
      n,
      "error",
      "MVAR_DELTA_SET_OUTER_OUT_OF_RANGE",
      `MVAR record '${f.valueTag}' deltaSetOuterIndex ${l} is ≥ ItemVariationData count (${r.length}).`
    ), i = !0);
    const h = r[l];
    !a && h && typeof u == "number" && u >= (h.itemCount ?? 0) && (C(
      n,
      "error",
      "MVAR_DELTA_SET_INNER_OUT_OF_RANGE",
      `MVAR record '${f.valueTag}' deltaSetInnerIndex ${u} is ≥ itemCount (${h.itemCount}).`
    ), a = !0);
  }
  Ws(o, e?.axes?.length ?? 0, "MVAR", n);
}
function Ki(t, e, n, o) {
  Ws(
    t.itemVariationStore,
    n?.axes?.length ?? 0,
    e,
    o
  );
}
function qS(t, e, n, o, s) {
  if (s ||= js(), typeof t.majorVersion == "number" && t.majorVersion !== 1 && C(
    o,
    "error",
    "GDEF_VERSION_INVALID",
    `GDEF majorVersion must be 1, got ${t.majorVersion}.`
  ), t.glyphClassDef && _s(
    t.glyphClassDef,
    e,
    "GDEF.glyphClassDef",
    o,
    { maxClass: 4 },
    // 1=base, 2=ligature, 3=mark, 4=component
    s
  ), t.markAttachClassDef && _s(
    t.markAttachClassDef,
    e,
    "GDEF.markAttachClassDef",
    o,
    {},
    s
  ), t.attachList?.coverage && Xe(
    t.attachList.coverage,
    e,
    "GDEF.attachList.coverage",
    o,
    s
  ), t.ligCaretList?.coverage && Xe(
    t.ligCaretList.coverage,
    e,
    "GDEF.ligCaretList.coverage",
    o,
    s
  ), t.markGlyphSetsDef?.coverages)
    for (let r = 0; r < t.markGlyphSetsDef.coverages.length; r++)
      Xe(
        t.markGlyphSetsDef.coverages[r],
        e,
        `GDEF.markGlyphSetsDef.coverages[${r}]`,
        o,
        s
      );
  t.itemVariationStore && Ws(
    t.itemVariationStore,
    n?.axes?.length ?? 0,
    "GDEF",
    o
  );
}
function js() {
  return { coverages: /* @__PURE__ */ new WeakSet(), classDefs: /* @__PURE__ */ new WeakSet() };
}
function Xe(t, e, n, o, s) {
  if (t) {
    if (s) {
      if (s.coverages.has(t)) return;
      s.coverages.add(t);
    }
    if (t.format !== 1 && t.format !== 2) {
      C(
        o,
        "error",
        "COVERAGE_FORMAT_INVALID",
        `${n}: Coverage format must be 1 or 2, got ${t.format}.`
      );
      return;
    }
    if (t.format === 1) {
      const r = t.glyphs ?? [];
      let i = -1;
      for (let a = 0; a < r.length; a++) {
        const c = r[a];
        if (e > 0 && c >= e) {
          C(
            o,
            "error",
            "COVERAGE_GLYPH_OUT_OF_RANGE",
            `${n}: Coverage format 1 references glyphID ${c} but font has only ${e} glyphs.`
          );
          return;
        }
        if (c <= i) {
          C(
            o,
            "error",
            "COVERAGE_GLYPHS_NOT_SORTED",
            `${n}: Coverage format 1 glyph list is not strictly ascending at index ${a} (got ${c} after ${i}).`
          );
          return;
        }
        i = c;
      }
    } else {
      const r = t.ranges ?? [];
      let i = -1;
      for (let a = 0; a < r.length; a++) {
        const c = r[a];
        if (typeof c.startGlyphID != "number" || typeof c.endGlyphID != "number" || c.startGlyphID > c.endGlyphID) {
          C(
            o,
            "error",
            "COVERAGE_RANGE_INVALID",
            `${n}: Coverage format 2 range ${a} is invalid (start=${c.startGlyphID}, end=${c.endGlyphID}).`
          );
          return;
        }
        if (e > 0 && c.endGlyphID >= e) {
          C(
            o,
            "error",
            "COVERAGE_GLYPH_OUT_OF_RANGE",
            `${n}: Coverage format 2 range ${a} endGlyphID ${c.endGlyphID} is ≥ numGlyphs (${e}).`
          );
          return;
        }
        if (c.startGlyphID <= i) {
          C(
            o,
            "error",
            "COVERAGE_RANGES_NOT_SORTED",
            `${n}: Coverage format 2 ranges overlap or are not sorted at index ${a} (start=${c.startGlyphID}, prev end=${i}).`
          );
          return;
        }
        i = c.endGlyphID;
      }
    }
  }
}
function _s(t, e, n, o, s = {}, r) {
  if (!t) return;
  if (r) {
    if (r.classDefs.has(t)) return;
    r.classDefs.add(t);
  }
  if (t.format !== 1 && t.format !== 2) {
    C(
      o,
      "error",
      "CLASSDEF_FORMAT_INVALID",
      `${n}: ClassDef format must be 1 or 2, got ${t.format}.`
    );
    return;
  }
  const i = s.maxClass;
  if (t.format === 1) {
    const a = t.startGlyphID ?? 0, c = t.classValues ?? [];
    if (e > 0 && a + c.length > e) {
      C(
        o,
        "error",
        "CLASSDEF_GLYPH_OUT_OF_RANGE",
        `${n}: ClassDef format 1 covers glyphs [${a}, ${a + c.length - 1}] but font has only ${e} glyphs.`
      );
      return;
    }
    if (i !== void 0) {
      for (let f = 0; f < c.length; f++)
        if (c[f] > i) {
          C(
            o,
            "error",
            "CLASSDEF_CLASS_OUT_OF_RANGE",
            `${n}: ClassDef format 1 entry ${f} has class ${c[f]}, which exceeds the maximum ${i} for this table.`
          );
          return;
        }
    }
  } else {
    const a = t.ranges ?? [];
    let c = -1;
    for (let f = 0; f < a.length; f++) {
      const l = a[f];
      if (l.startGlyphID > l.endGlyphID) {
        C(
          o,
          "error",
          "CLASSDEF_RANGE_INVALID",
          `${n}: ClassDef format 2 range ${f} is invalid (start=${l.startGlyphID}, end=${l.endGlyphID}).`
        );
        return;
      }
      if (e > 0 && l.endGlyphID >= e) {
        C(
          o,
          "error",
          "CLASSDEF_GLYPH_OUT_OF_RANGE",
          `${n}: ClassDef format 2 range ${f} endGlyphID ${l.endGlyphID} is ≥ numGlyphs (${e}).`
        );
        return;
      }
      if (l.startGlyphID <= c) {
        C(
          o,
          "error",
          "CLASSDEF_RANGES_NOT_SORTED",
          `${n}: ClassDef format 2 ranges overlap or are not sorted at index ${f} (start=${l.startGlyphID}, prev end=${c}).`
        );
        return;
      }
      if (i !== void 0 && l.class > i) {
        C(
          o,
          "error",
          "CLASSDEF_CLASS_OUT_OF_RANGE",
          `${n}: ClassDef format 2 range ${f} has class ${l.class}, which exceeds the maximum ${i} for this table.`
        );
        return;
      }
      c = l.endGlyphID;
    }
  }
}
function Ji(t, e, n, o, s) {
  s ||= js();
  const r = t?.lookupList?.lookups ?? [];
  for (let i = 0; i < r.length; i++) {
    const a = r[i], c = a.subtables ?? [];
    for (let f = 0; f < c.length; f++) {
      const l = c[f];
      if (!l || typeof l != "object") continue;
      const u = `${e} lookup ${i} (type ${a.lookupType}) subtable ${f}`;
      if (l.coverage && Xe(l.coverage, n, `${u}.coverage`, o, s), Array.isArray(l.coverages))
        for (let h = 0; h < l.coverages.length; h++)
          Xe(
            l.coverages[h],
            n,
            `${u}.coverages[${h}]`,
            o,
            s
          );
      if (l.classDef && _s(
        l.classDef,
        n,
        `${u}.classDef`,
        o,
        {},
        s
      ), e === "GSUB" && a.lookupType === 1 && Array.isArray(l.substituteGlyphIDs)) {
        for (const h of l.substituteGlyphIDs)
          if (n > 0 && h >= n) {
            C(
              o,
              "error",
              "GSUB_SUBSTITUTE_GLYPH_OUT_OF_RANGE",
              `${u}: substituteGlyphID ${h} is ≥ numGlyphs (${n}).`
            );
            break;
          }
      }
      if (e === "GSUB" && a.lookupType === 4 && Array.isArray(l.ligatureSets)) {
        let h = !1;
        for (const p of l.ligatureSets) {
          if (h) break;
          for (const g of p ?? []) {
            if (n > 0 && g.ligatureGlyph >= n) {
              C(
                o,
                "error",
                "GSUB_LIGATURE_GLYPH_OUT_OF_RANGE",
                `${u}: ligatureGlyph ${g.ligatureGlyph} is ≥ numGlyphs (${n}).`
              ), h = !0;
              break;
            }
            for (const d of g.componentGlyphIDs ?? [])
              if (n > 0 && d >= n) {
                C(
                  o,
                  "error",
                  "GSUB_LIGATURE_COMPONENT_OUT_OF_RANGE",
                  `${u}: ligature componentGlyphID ${d} is ≥ numGlyphs (${n}).`
                ), h = !0;
                break;
              }
          }
        }
      }
    }
  }
}
function KS(t, e) {
  typeof t.version == "number" && t.version !== 65536 && C(
    e,
    "error",
    "MATH_VERSION_INVALID",
    `MATH table version must be 0x00010000, got 0x${t.version.toString(16).padStart(8, "0")}.`
  );
}
const JS = /* @__PURE__ */ new Set([
  1,
  3,
  4,
  5,
  6,
  7,
  8,
  10,
  11,
  14,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  29,
  30,
  31
  // 12 is the escape byte; valid two-byte ops are checked separately.
]), QS = /* @__PURE__ */ new Set([
  1,
  3,
  4,
  5,
  6,
  7,
  8,
  10,
  11,
  15,
  16,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  29,
  30,
  31
]), t2 = /* @__PURE__ */ new Set([
  34,
  35,
  36,
  37,
  // hflex, flex, hflex1, flex1
  // Plus arithmetic/storage ops 0,3,4,5,9,10,11,12,14,15,18,20,21,22,23,24,
  // 26,27,28,29,30 — but the interpreter doesn't decode those, so we don't
  // require them. We only flag operators that are not in either set.
  0,
  3,
  4,
  5,
  9,
  10,
  11,
  12,
  14,
  15,
  18,
  20,
  21,
  22,
  23,
  24,
  26,
  27,
  28,
  29,
  30
]), Qi = 10, ta = 48, ea = 513;
function na(t, e, n, o = !1) {
  const s = o ? [
    {
      charStrings: t.charStrings || [],
      localSubrs: t.fontDicts?.[0]?.localSubrs || []
    }
  ] : t.fonts || [], r = t.globalSubrs || [], i = oa(r.length), a = /* @__PURE__ */ new Set();
  function c(f, l, u) {
    a.has(f) || (a.add(f), C(n, l, f, u));
  }
  for (let f = 0; f < s.length; f++) {
    const l = s[f], u = l.charStrings || [], h = l.localSubrs || [], p = oa(h.length);
    for (let g = 0; g < u.length; g++) {
      const d = u[g];
      if (!d || d.length === 0) continue;
      const x = {
        stack: [],
        maxStackSeen: 0,
        stemCount: 0,
        depth: 0,
        returned: !1,
        saw: { endchar: !1, anyDraw: !1 }
      };
      Zf(
        d,
        x,
        h,
        p,
        r,
        i,
        e,
        f,
        g,
        c,
        o
      ), x.maxStackSeen > (o ? ea : ta) && c(
        "CFF_STACK_OVERFLOW",
        "error",
        `${e}: charstring for glyph ${g} pushed ${x.maxStackSeen} operands, exceeding the ${o ? "CFF2" : "Type 2"} limit of ${o ? ea : ta}.`
      );
    }
  }
}
function oa(t) {
  return t < 1240 ? 107 : t < 33900 ? 1131 : 32768;
}
function Zf(t, e, n, o, s, r, i, a, c, f, l) {
  if (e.depth > Qi) {
    f(
      "CFF_SUBR_DEPTH_EXCEEDED",
      "error",
      `${i}: charstring for glyph ${c} exceeded subroutine recursion depth ${Qi}.`
    );
    return;
  }
  let u = 0;
  for (; u < t.length; ) {
    const h = t[u];
    if (h === 28 || h >= 32) {
      const g = e2(t, u);
      if (g === null) {
        f(
          "CFF_INVALID_NUMBER",
          "error",
          `${i}: charstring for glyph ${c} contains a malformed numeric operand at byte ${u}.`
        );
        return;
      }
      if (u + g.bytesConsumed > t.length) {
        f(
          "CFF_TRUNCATED_OPERAND",
          "error",
          `${i}: charstring for glyph ${c} truncated mid-operand at byte ${u}.`
        );
        return;
      }
      e.stack.push(g.value), e.stack.length > e.maxStackSeen && (e.maxStackSeen = e.stack.length), u += g.bytesConsumed;
      continue;
    }
    if (h === 12) {
      if (u + 1 >= t.length) {
        f(
          "CFF_TRUNCATED_OPERATOR",
          "error",
          `${i}: charstring for glyph ${c} ends mid-escaped operator at byte ${u}.`
        );
        return;
      }
      const g = t[u + 1];
      if (!t2.has(g)) {
        f(
          "CFF_INVALID_OPERATOR",
          "error",
          `${i}: charstring for glyph ${c} uses unrecognised two-byte operator 12 ${g} at byte ${u}.`
        );
        return;
      }
      const d = { 34: 7, 35: 13, 36: 9, 37: 11 }[g];
      if (d !== void 0 && e.stack.length < d) {
        f(
          "CFF_STACK_UNDERFLOW",
          "error",
          `${i}: charstring for glyph ${c} two-byte op ${g} requires ${d} operands but stack has ${e.stack.length}.`
        );
        return;
      }
      e.stack.length = 0, e.saw.anyDraw = !0, u += 2;
      continue;
    }
    if (!(l ? QS : JS).has(h)) {
      f(
        "CFF_INVALID_OPERATOR",
        "error",
        `${i}: charstring for glyph ${c} uses unknown operator 0x${h.toString(16).padStart(2, "0")} at byte ${u}.`
      );
      return;
    }
    if (l && h === 15) {
      if (e.stack.length < 1) {
        f(
          "CFF_STACK_UNDERFLOW",
          "error",
          `${i}: charstring for glyph ${c} vsindex with empty stack at byte ${u}.`
        );
        return;
      }
      e.stack.pop(), u++;
      continue;
    }
    if (l && h === 16) {
      if (e.stack.length < 1) {
        f(
          "CFF_STACK_UNDERFLOW",
          "error",
          `${i}: charstring for glyph ${c} blend with empty stack at byte ${u}.`
        );
        return;
      }
      const g = e.stack.pop();
      typeof g == "number" && g >= 0 && g <= e.stack.length ? e.stack.length = g : e.stack.length = 0, u++;
      continue;
    }
    if (h === 1 || h === 3 || h === 18 || h === 23) {
      e.stemCount += e.stack.length >> 1, e.stack.length = 0, u++;
      continue;
    }
    if (h === 19 || h === 20) {
      e.stemCount += e.stack.length >> 1, e.stack.length = 0, u++;
      const g = Math.ceil(e.stemCount / 8);
      if (u + g > t.length) {
        f(
          "CFF_TRUNCATED_OPERATOR",
          "error",
          `${i}: charstring for glyph ${c} truncated mid-mask at byte ${u}.`
        );
        return;
      }
      u += g;
      continue;
    }
    if (h === 10 || h === 29) {
      if (e.stack.length < 1) {
        f(
          "CFF_STACK_UNDERFLOW",
          "error",
          `${i}: charstring for glyph ${c} ${h === 10 ? "callsubr" : "callgsubr"} with empty stack at byte ${u}.`
        );
        return;
      }
      const g = e.stack.pop(), d = g + (h === 10 ? o : r), x = h === 10 ? n : s;
      if (d < 0 || d >= x.length) {
        f(
          "CFF_SUBR_INDEX_OUT_OF_RANGE",
          "error",
          `${i}: charstring for glyph ${c} ${h === 10 ? "callsubr" : "callgsubr"} index ${g} (biased ${d}) out of range [0, ${x.length}).`
        );
        return;
      }
      e.depth++, Zf(
        x[d],
        e,
        n,
        o,
        s,
        r,
        i,
        a,
        c,
        f,
        l
      ), e.depth--, u++;
      continue;
    }
    if (h === 11) {
      e.returned = !0;
      return;
    }
    if (h === 14) {
      e.saw.endchar = !0, e.stack.length = 0, u++;
      continue;
    }
    e.stack.length = 0, e.saw.anyDraw = !0, u++;
  }
}
function e2(t, e) {
  const n = t[e];
  if (n >= 32 && n <= 246) return { value: n - 139, bytesConsumed: 1 };
  if (n >= 247 && n <= 250)
    return e + 1 >= t.length ? null : {
      value: (n - 247) * 256 + t[e + 1] + 108,
      bytesConsumed: 2
    };
  if (n >= 251 && n <= 254)
    return e + 1 >= t.length ? null : {
      value: -(n - 251) * 256 - t[e + 1] - 108,
      bytesConsumed: 2
    };
  if (n === 28) {
    if (e + 2 >= t.length) return null;
    const o = t[e + 1] << 8 | t[e + 2];
    return { value: o > 32767 ? o - 65536 : o, bytesConsumed: 3 };
  }
  if (n === 255) {
    if (e + 4 >= t.length) return null;
    const o = (t[e + 1] << 24 | t[e + 2] << 16 | t[e + 3] << 8 | t[e + 4]) >>> 0;
    return { value: (o > 2147483647 ? o - 4294967296 : o) / 65536, bytesConsumed: 5 };
  }
  return null;
}
const sa = 16;
function n2(t, e, n) {
  const o = t?.glyphs;
  if (!Array.isArray(o)) return;
  let s = !1, r = !1, i = !1;
  function a(c, f) {
    if (s || r) return;
    const l = o[c];
    if (!(!l || !Array.isArray(l.components))) {
      if (f.length >= sa) {
        r = !0, C(
          n,
          "error",
          "GLYF_COMPOSITE_DEPTH_EXCEEDED",
          `glyf composite glyph chain starting at glyph ${f[0]} exceeds maximum nesting depth ${sa}.`
        );
        return;
      }
      for (const u of l.components) {
        const h = u.glyphIndex ?? u.glyphID;
        if (typeof h == "number") {
          if (e > 0 && (h < 0 || h >= e)) {
            i || (i = !0, C(
              n,
              "error",
              "GLYF_COMPOSITE_GLYPH_OUT_OF_RANGE",
              `glyf composite glyph ${c} references component glyph ${h}, which is out of range [0, ${e}).`
            ));
            continue;
          }
          if (f.includes(h)) {
            s = !0, C(
              n,
              "error",
              "GLYF_COMPOSITE_CYCLE",
              `glyf composite glyph chain forms a cycle: ${[...f, h].join(" → ")}.`
            );
            return;
          }
          if (f.push(h), a(h, f), f.pop(), s || r) return;
        }
      }
    }
  }
  for (let c = 0; c < o.length; c++) {
    const f = o[c];
    if (f && Array.isArray(f.components) && (a(c, [c]), s || r))
      break;
  }
}
function o2(t, e, n) {
  const o = t?.glyphs;
  if (!Array.isArray(o)) return;
  const s = e?.xMin, r = e?.xMax, i = e?.yMin, a = e?.yMax;
  let c = !1, f = !1, l = !1;
  for (let u = 0; u < o.length; u++) {
    const h = o[u];
    h && (!c && typeof h.xMin == "number" && typeof h.xMax == "number" && h.xMin > h.xMax && (c = !0, C(
      n,
      "warning",
      "GLYF_BBOX_INVERTED",
      `glyf glyph ${u} has xMin (${h.xMin}) > xMax (${h.xMax}).`
    )), !c && typeof h.yMin == "number" && typeof h.yMax == "number" && h.yMin > h.yMax && (c = !0, C(
      n,
      "warning",
      "GLYF_BBOX_INVERTED",
      `glyf glyph ${u} has yMin (${h.yMin}) > yMax (${h.yMax}).`
    )), !f && typeof s == "number" && typeof r == "number" && typeof h.xMin == "number" && typeof h.xMax == "number" && (h.xMin < s || h.xMax > r) && (f = !0, C(
      n,
      "warning",
      "GLYF_BBOX_OUTSIDE_HEAD",
      `glyf glyph ${u} bounding box [${h.xMin},${h.xMax}] x [${h.yMin},${h.yMax}] extends outside the head.bbox [${s},${r}] x [${i},${a}].`
    )), !l && typeof h.numberOfContours == "number" && h.numberOfContours < -1 && (l = !0, C(
      n,
      "error",
      "GLYF_NUM_CONTOURS_INVALID",
      `glyf glyph ${u} numberOfContours = ${h.numberOfContours}; only ≥ -1 is valid (-1 indicates a composite).`
    )));
  }
}
const s2 = [
  [6155, 6157],
  // Mongolian Free Variation Selectors
  [65024, 65039],
  // Variation Selectors
  [917760, 917999]
  // Variation Selectors Supplement
];
function r2(t, e) {
  const n = t?.subTables ?? t?.subtables ?? [];
  let o = !1, s = !1;
  for (const r of n) {
    if (r?.format !== 14) continue;
    const i = r.varSelectorRecords ?? r.variationSelectors ?? [];
    let a = -1;
    for (let c = 0; c < i.length; c++) {
      const f = i[c], l = f.varSelector ?? f.variationSelector;
      if (typeof l != "number") continue;
      !s2.some(
        ([h, p]) => l >= h && l <= p
      ) && !o && (o = !0, C(
        e,
        "error",
        "CMAP_FORMAT14_VS_OUT_OF_RANGE",
        `cmap format 14 record ${c} variation selector U+${l.toString(16).toUpperCase().padStart(4, "0")} is not in any defined VS range (Mongolian FVS, FE00–FE0F, or E0100–E01EF).`
      )), l <= a && !s && (s = !0, C(
        e,
        "error",
        "CMAP_FORMAT14_VS_OUT_OF_ORDER",
        `cmap format 14 variation selectors must be strictly ascending; record ${c} U+${l.toString(16).toUpperCase()} follows U+${a.toString(16).toUpperCase()}.`
      )), a = l;
    }
  }
}
function i2(t, e) {
  const n = t?.subTables ?? t?.subtables ?? [];
  let o = !1, s = !1, r = !1;
  for (const i of n) {
    if (i?.format !== 12 && i?.format !== 13) continue;
    const a = i.groups ?? i.sequentialMapGroups ?? i.constantMapGroups ?? [];
    for (let c = 0; c < a.length; c++) {
      const f = a[c], l = f.startCharCode ?? f.startcharCode ?? f.start, u = f.endCharCode ?? f.endcharCode ?? f.end;
      if (!(typeof l != "number" || typeof u != "number") && (u < l && !r && (r = !0, C(
        e,
        "error",
        "CMAP_FORMAT12_END_BEFORE_START",
        `cmap format ${i.format} group ${c} has endCharCode (U+${u.toString(16).toUpperCase()}) < startCharCode (U+${l.toString(16).toUpperCase()}).`
      )), c > 0)) {
        const h = a[c - 1], p = h.startCharCode ?? h.startcharCode ?? h.start, g = h.endCharCode ?? h.endcharCode ?? h.end;
        typeof p == "number" && l <= p && !o && (o = !0, C(
          e,
          "error",
          "CMAP_FORMAT12_GROUPS_NOT_SORTED",
          `cmap format ${i.format} groups must be sorted by startCharCode; group ${c} (U+${l.toString(16).toUpperCase()}) follows group ${c - 1} (U+${p.toString(16).toUpperCase()}).`
        )), typeof g == "number" && l <= g && !s && (s = !0, C(
          e,
          "error",
          "CMAP_FORMAT12_GROUPS_OVERLAP",
          `cmap format ${i.format} group ${c} (U+${l.toString(16).toUpperCase()}–U+${u.toString(16).toUpperCase()}) overlaps with group ${c - 1} (ends at U+${g.toString(16).toUpperCase()}).`
        ));
      }
    }
  }
}
function Po(t, e, n) {
  if (!t || t.length === 0) return;
  let o = 0, s = 0, r = !1, i = !1, a = !1, c = !1, f = !1;
  for (; o < t.length; ) {
    const l = t[o];
    if (l >= 176 && l <= 183) {
      const u = (l & 7) + 1;
      if (o++, o + u > t.length) {
        i || (i = !0, C(
          n,
          "error",
          "TT_INSTR_TRUNCATED_PUSH",
          `${e}: PUSHB[${u - 1}] at byte ${o - 1} would read ${u} operands past end of stream (length ${t.length}).`
        ));
        return;
      }
      o += u;
      continue;
    }
    if (l >= 184 && l <= 191) {
      const u = ((l & 7) + 1) * 2;
      if (o++, o + u > t.length) {
        i || (i = !0, C(
          n,
          "error",
          "TT_INSTR_TRUNCATED_PUSH",
          `${e}: PUSHW[${l & 7}] at byte ${o - 1} would read ${u} operand bytes past end of stream (length ${t.length}).`
        ));
        return;
      }
      o += u;
      continue;
    }
    if (l === 64) {
      if (o++, o >= t.length) {
        i || (i = !0, C(
          n,
          "error",
          "TT_INSTR_TRUNCATED_PUSH",
          `${e}: NPUSHB at end of stream with no count byte.`
        ));
        return;
      }
      const u = t[o];
      if (o++, o + u > t.length) {
        i || (i = !0, C(
          n,
          "error",
          "TT_INSTR_TRUNCATED_PUSH",
          `${e}: NPUSHB at byte ${o - 2} declares ${u} operands but only ${t.length - o} remain.`
        ));
        return;
      }
      o += u;
      continue;
    }
    if (l === 65) {
      if (o++, o >= t.length) {
        i || (i = !0, C(
          n,
          "error",
          "TT_INSTR_TRUNCATED_PUSH",
          `${e}: NPUSHW at end of stream with no count byte.`
        ));
        return;
      }
      const u = t[o] * 2;
      if (o++, o + u > t.length) {
        i || (i = !0, C(
          n,
          "error",
          "TT_INSTR_TRUNCATED_PUSH",
          `${e}: NPUSHW at byte ${o - 2} declares ${u / 2} word operands but only ${t.length - o} bytes remain.`
        ));
        return;
      }
      o += u;
      continue;
    }
    if (l === 88) {
      s++, o++;
      continue;
    }
    if (l === 89) {
      s === 0 ? a || (a = !0, C(
        n,
        "error",
        "TT_INSTR_UNBALANCED_EIF",
        `${e}: EIF at byte ${o} with no matching IF.`
      )) : s--, o++;
      continue;
    }
    if (l === 44) {
      r && !c && (c = !0, C(
        n,
        "error",
        "TT_INSTR_NESTED_FDEF",
        `${e}: FDEF at byte ${o} nested inside another FDEF.`
      )), r = !0, o++;
      continue;
    }
    if (l === 45) {
      !r && !f && (f = !0, C(
        n,
        "error",
        "TT_INSTR_STRAY_ENDF",
        `${e}: ENDF at byte ${o} with no matching FDEF.`
      )), r = !1, o++;
      continue;
    }
    o++;
  }
  s !== 0 && C(
    n,
    "error",
    "TT_INSTR_UNBALANCED_IF",
    `${e}: ${s} unclosed IF block(s) at end of stream.`
  ), r && C(
    n,
    "error",
    "TT_INSTR_UNCLOSED_FDEF",
    `${e}: FDEF was never closed by ENDF before end of stream.`
  );
}
function a2(t, e) {
  t.fpgm?.instructions && Po(t.fpgm.instructions, "fpgm", e), t.prep?.instructions && Po(t.prep.instructions, "prep", e);
  const n = t.glyf?.glyphs;
  if (Array.isArray(n)) {
    const o = e.length;
    for (let s = 0; s < n.length; s++) {
      const r = n[s]?.instructions;
      if (!(!r || r.length === 0) && (Po(r, `glyf glyph ${s}`, e), e.length > o))
        break;
    }
  }
}
function c2(t, e, n, o) {
  const s = new Set(e.map((l) => l.tag));
  if (t.head) {
    t.head.magicNumber !== 1594834165 && C(
      n,
      "error",
      "BAD_MAGIC_NUMBER",
      `head.magicNumber is 0x${(t.head.magicNumber >>> 0).toString(16).padStart(8, "0")}, expected 0x5F0F3CF5.`
    );
    const l = t.head.unitsPerEm;
    l !== void 0 && (l < 16 || l > 16384) && C(
      n,
      "error",
      "BAD_UNITS_PER_EM",
      `head.unitsPerEm is ${l} — must be between 16 and 16384.`
    ), t.head.majorVersion !== void 0 && t.head.majorVersion !== 1 && C(
      n,
      "error",
      "HEAD_MAJOR_VERSION_UNSUPPORTED",
      `head.majorVersion is ${t.head.majorVersion}, expected 1.`
    );
    const { xMin: u, xMax: h, yMin: p, yMax: g } = t.head;
    u !== void 0 && h !== void 0 && u > h && C(
      n,
      "error",
      "HEAD_BBOX_INVERTED",
      `head.xMin (${u}) is greater than head.xMax (${h}).`
    ), p !== void 0 && g !== void 0 && p > g && C(
      n,
      "error",
      "HEAD_BBOX_INVERTED",
      `head.yMin (${p}) is greater than head.yMax (${g}).`
    );
    const d = t.head.indexToLocFormat;
    d !== void 0 && d !== 0 && d !== 1 && C(
      n,
      "error",
      "HEAD_INDEX_TO_LOC_FORMAT_INVALID",
      `head.indexToLocFormat is ${d}; must be 0 (short offsets) or 1 (long offsets).`
    );
    const x = t.head.glyphDataFormat;
    x !== void 0 && x !== 0 && C(
      n,
      "error",
      "HEAD_GLYPH_DATA_FORMAT_INVALID",
      `head.glyphDataFormat is ${x}; must be 0.`
    );
  }
  if (t.maxp) {
    const l = t.maxp.version;
    l !== void 0 && l !== 20480 && l !== 65536 && C(
      n,
      "error",
      "MAXP_VERSION_INVALID",
      `maxp.version is 0x${(l >>> 0).toString(16).padStart(8, "0")}; must be 0x00005000 (0.5) or 0x00010000 (1.0).`
    ), t.maxp.numGlyphs === 0 && C(
      n,
      "error",
      "MAXP_NUMGLYPHS_ZERO",
      "maxp.numGlyphs is 0 — font contains no glyphs."
    ), l === 20480 && s.has("glyf") && C(
      n,
      "error",
      "MAXP_VERSION_MISMATCH_FOR_OUTLINE",
      "maxp.version is 0.5 (CFF) but font contains a glyf table; TrueType outlines require maxp 1.0."
    ), l === 65536 && (s.has("CFF ") || s.has("CFF2")) && !s.has("glyf") && C(
      n,
      "error",
      "MAXP_VERSION_MISMATCH_FOR_OUTLINE",
      "maxp.version is 1.0 (TrueType) but font has only CFF/CFF2 outlines; CFF requires maxp 0.5."
    );
  }
  if (t.hhea && t.hhea.majorVersion !== void 0 && t.hhea.majorVersion !== 1 && C(
    n,
    "error",
    "HHEA_MAJOR_VERSION_UNSUPPORTED",
    `hhea.majorVersion is ${t.hhea.majorVersion}, expected 1.`
  ), t.post && typeof t.post.version == "number") {
    const l = t.post.version;
    l === 65536 || l === 131072 || l === 151552 || l === 196608 || C(
      n,
      "error",
      "POST_VERSION_UNSUPPORTED",
      `post.version is 0x${(l >>> 0).toString(16).padStart(8, "0")}; must be 1.0, 2.0, 2.5, or 3.0.`
    ), l === 131072 && t.maxp && typeof t.post.numGlyphs == "number" && t.post.numGlyphs !== t.maxp.numGlyphs && C(
      n,
      "error",
      "POST_NUMGLYPHS_MISMATCH",
      `post.numGlyphs (${t.post.numGlyphs}) does not match maxp.numGlyphs (${t.maxp.numGlyphs}).`
    );
  }
  if (t["OS/2"] && typeof t["OS/2"].version == "number") {
    const l = t["OS/2"].version;
    (l < 0 || l > 5) && C(
      n,
      "error",
      "OS2_VERSION_INVALID",
      `OS/2.version is ${l}; must be in range 0..5.`
    );
  }
  if (t["OS/2"] && VS(t["OS/2"], t.head, n), t.maxp && t.hmtx) {
    const l = t.maxp.numGlyphs, u = t.hmtx.hMetrics?.length ?? 0, h = t.hmtx.leftSideBearings?.length ?? 0, p = u + h;
    p !== l && C(
      n,
      "warning",
      "HMTX_GLYPH_MISMATCH",
      `hmtx has ${p} entries (${u} metrics + ${h} LSBs) but maxp.numGlyphs is ${l}.`
    );
  }
  if (t.hhea && t.hmtx) {
    const l = t.hhea.numberOfHMetrics, u = t.hmtx.hMetrics?.length ?? 0;
    u !== l && C(
      n,
      "warning",
      "HHEA_HMTX_MISMATCH",
      `hhea.numberOfHMetrics is ${l} but hmtx has ${u} full metric entries.`
    );
  }
  if (t.loca && t.glyf) {
    const l = t.loca.offsets;
    if (l && l.length > 0) {
      const u = e.find((h) => h.tag === "glyf");
      if (u) {
        const h = l[l.length - 1];
        h > u.length && C(
          n,
          "error",
          "LOCA_BEYOND_GLYF",
          `loca final offset (${h}) exceeds glyf table length (${u.length}).`
        );
      }
    }
  }
  const r = t["CFF "] || t.CFF2;
  if (r && t.maxp) {
    const l = r.topDict?.charStrings?.length ?? r.charStrings?.length ?? null;
    l !== null && l !== t.maxp.numGlyphs && C(
      n,
      "warning",
      "CFF_GLYPH_MISMATCH",
      `CFF charStrings count (${l}) doesn't match maxp.numGlyphs (${t.maxp.numGlyphs}).`
    );
  }
  if (t.name) {
    NS(t.name, e, o, n);
    const l = t.name.nameRecords ?? t.name.names ?? t.name.records ?? [], u = l.some((p) => p.nameID === 1), h = l.some((p) => p.nameID === 2);
    u || C(
      n,
      "warning",
      "NO_FAMILY_NAME",
      "name table has no family name (nameID 1)."
    ), h || C(
      n,
      "warning",
      "NO_STYLE_NAME",
      "name table has no style name (nameID 2)."
    );
    for (let p = 1; p < l.length; p++) {
      const g = l[p - 1], d = l[p];
      if ((g.platformID - d.platformID || g.encodingID - d.encodingID || g.languageID - d.languageID || g.nameID - d.nameID) >= 0) {
        C(
          n,
          "error",
          "NAME_RECORDS_NOT_SORTED",
          `name records are not sorted: record ${p - 1} (pid=${g.platformID}, eid=${g.encodingID}, lid=${g.languageID}, nid=${g.nameID}) precedes record ${p} (pid=${d.platformID}, eid=${d.encodingID}, lid=${d.languageID}, nid=${d.nameID}).`
        );
        break;
      }
    }
  }
  if (t.cmap?.encodingRecords) {
    const l = t.cmap.encodingRecords, u = t.cmap.subtables || [];
    for (let h = 1; h < l.length; h++) {
      const p = l[h - 1], g = l[h], d = (u[p.subtableIndex] || {}).language || 0, x = (u[g.subtableIndex] || {}).language || 0;
      if ((p.platformID - g.platformID || p.encodingID - g.encodingID || d - x) >= 0) {
        C(
          n,
          "error",
          "CMAP_SUBTABLES_NOT_SORTED",
          `cmap encoding records are not sorted: record ${h - 1} (pid=${p.platformID}, eid=${p.encodingID}, lang=${d}) precedes record ${h} (pid=${g.platformID}, eid=${g.encodingID}, lang=${x}).`
        );
        break;
      }
    }
  }
  t.cmap && BS(t.cmap, t.maxp, n);
  const i = t["CFF "];
  if (i?.fonts)
    for (let l = 0; l < i.fonts.length; l++) {
      const u = i.fonts[l].charStrings || [];
      for (let h = 0; h < u.length; h++) {
        const p = u[h];
        if (!p || p.length === 0) {
          C(
            n,
            "error",
            "CFF_EMPTY_CHARSTRING",
            `CFF font ${l}: charstring for glyph ${h} is empty (must contain at least an endchar operator).`
          );
          break;
        }
        const g = p[p.length - 1];
        if (g !== 14 && g !== 11) {
          C(
            n,
            "warning",
            "CFF_CHARSTRING_NO_ENDCHAR",
            `CFF font ${l}: charstring for glyph ${h} does not terminate with endchar (last byte = 0x${g.toString(16).padStart(2, "0")}).`
          );
          break;
        }
      }
    }
  if (s.has("CFF ") || s.has("CFF2")) {
    let l;
    if (t.post && typeof t.post.version == "number")
      l = t.post.version;
    else if (o) {
      const u = e.find((h) => h.tag === "post");
      u && u.length >= 4 && u.offset + 4 <= o.byteLength && (l = new DataView(o).getUint32(u.offset));
    }
    if (l !== void 0 && l !== 196608) {
      const u = `0x${(l >>> 0).toString(16).padStart(8, "0")}`;
      C(
        n,
        "error",
        "POST_VERSION_INVALID_FOR_CFF",
        `post table version is ${u} but CFF-flavored fonts must use 0x00030000 (3.0).`
      );
    }
  }
  if (t.vhea && t.vmtx) {
    const l = t.vhea.numOfLongVerMetrics ?? t.vhea.numberOfVMetrics, u = t.vmtx.metrics?.length ?? 0;
    l !== void 0 && u !== l && C(
      n,
      "warning",
      "VHEA_VMTX_MISMATCH",
      `vhea.numOfLongVerMetrics is ${l} but vmtx has ${u} full metric entries.`
    );
  }
  s.has("gvar") && !s.has("fvar") && C(
    n,
    "error",
    "GVAR_WITHOUT_FVAR",
    "gvar table present without fvar — glyph variations require a variation axis table."
  );
  for (const l of ["HVAR", "VVAR", "MVAR", "avar"])
    s.has(l) && !s.has("fvar") && C(
      n,
      "error",
      `${l.toUpperCase()}_WITHOUT_FVAR`,
      `${l} table present without fvar — variation tables require a variation axis table.`
    );
  const a = t.maxp?.numGlyphs ?? 0, c = t.fvar, f = js();
  c && (zS(c, n), jS(c, t.name, n)), t.STAT && YS(t.STAT, c, n), t.avar && ZS(t.avar, c, n), t.HVAR && Ki(t.HVAR, "HVAR", c, n), t.VVAR && Ki(t.VVAR, "VVAR", c, n), t.MVAR && XS(t.MVAR, c, n), t.GDEF && qS(t.GDEF, a, c, n, f), t.GSUB && (qi(t.GSUB, "GSUB", n), Ji(
    t.GSUB,
    "GSUB",
    a,
    n,
    f
  )), t.GPOS && (qi(t.GPOS, "GPOS", n), Ji(
    t.GPOS,
    "GPOS",
    a,
    n,
    f
  )), t.MATH && KS(t.MATH, n), t["CFF "] && na(t["CFF "], "CFF", n, !1), t.CFF2 && na(t.CFF2, "CFF2", n, !0), t.glyf && (n2(t.glyf, a, n), o2(t.glyf, t.head, n)), t.cmap && (r2(t.cmap, n), i2(t.cmap, n)), a2(t, n);
}
function f2(t) {
  const e = new F(new Uint8Array(t));
  e.skip(4);
  const n = e.uint16();
  e.skip(2);
  const o = e.uint32();
  if (o === 0) return null;
  const s = e.uint32();
  return { majorVersion: n, numFonts: o, firstOffset: s };
}
function l2(t) {
  const e = [];
  t && typeof t.byteLength == "number" && t.byteLength > 1073741824 && C(
    e,
    "error",
    "FILE_EXCEEDS_1GB",
    `Font file is ${t.byteLength} bytes (> 1 GiB); Firefox/OTS will reject it.`
  );
  const n = kS(t, e);
  if (!n) return Tt(e);
  let o = n.sfnt;
  if (n.format === "collection")
    try {
      const a = f2(o);
      if (!a || a.numFonts === 0)
        return C(
          e,
          "error",
          "EMPTY_COLLECTION",
          "Collection contains no fonts."
        ), Tt(e);
      if (a.majorVersion !== 1 && a.majorVersion !== 2)
        return C(
          e,
          "error",
          "TTC_VERSION_INVALID",
          `TTC majorVersion is ${a.majorVersion}; must be 1 or 2.`
        ), Tt(e);
      if (a.numFonts > 65536)
        return C(
          e,
          "error",
          "TTC_TOO_MANY_FONTS",
          `TTC numFonts is ${a.numFonts}; must be ≤ 65536.`
        ), Tt(e);
      C(
        e,
        "info",
        "COLLECTION_INFO",
        `Collection contains ${a.numFonts} font(s). Diagnosing the first font at offset ${a.firstOffset}.`
      ), o = t;
    } catch (a) {
      return C(
        e,
        "error",
        "COLLECTION_HEADER_UNREADABLE",
        `Could not read collection header: ${a.message}`
      ), Tt(e);
    }
  const s = ES(o, e);
  if (!s) return Tt(e);
  const r = TS(o, s, e);
  if (r.length === 0 && s.numTables > 0)
    return C(
      e,
      "error",
      "NO_READABLE_ENTRIES",
      "Could not read any table directory entries."
    ), Tt(e);
  DS(r, e), RS(o, r, e);
  const i = FS(o, r, e);
  return c2(i, r, e, o), Tt(e);
}
function St(t) {
  return t !== null && typeof t == "object" && !Array.isArray(t);
}
function Xf(t) {
  return Number.isInteger(t) && t >= 0 && t <= 4294967295;
}
function qf(t) {
  return Array.isArray(t?._raw);
}
function N(t, e, n, o, s) {
  t.push({ severity: e, code: n, message: o, path: s });
}
function ra(t) {
  const e = t > 0 ? 2 ** Math.floor(Math.log2(t)) : 0, n = e * 16, o = e > 0 ? Math.floor(Math.log2(e)) : 0, s = t * 16 - n;
  return { searchRange: n, entrySelector: o, rangeShift: s };
}
function ia(t) {
  return St(t) && (t["CFF "] || t.CFF2) ? 1330926671 : 65536;
}
function aa(t) {
  const e = t.filter((s) => s.severity === "error"), n = t.filter((s) => s.severity === "warning"), o = t.filter((s) => s.severity === "info");
  return {
    valid: e.length === 0,
    errors: e,
    warnings: n,
    infos: o,
    issues: t,
    summary: {
      errorCount: e.length,
      warningCount: n.length,
      infoCount: o.length,
      issueCount: t.length
    }
  };
}
function u2(t, e, n, o) {
  let s = t.header;
  if (!St(s))
    if (St(t._header))
      t.header = { ...t._header }, s = t.header, N(
        o,
        "info",
        "HEADER_PROMOTED",
        'No "header" found; promoted "_header" for export compatibility.',
        n
      );
    else {
      const a = ia(t.tables), c = ra(e);
      t.header = {
        sfVersion: a,
        numTables: e,
        ...c
      }, s = t.header, N(
        o,
        "info",
        "HEADER_SYNTHESIZED",
        `No header found; synthesized one (sfVersion=0x${a.toString(16).toUpperCase().padStart(8, "0")}, ${e} tables).`,
        n
      );
      return;
    }
  if (!Xf(s.sfVersion)) {
    const a = ia(t.tables);
    s.sfVersion = a, N(
      o,
      "info",
      "HEADER_SFVERSION_INFERRED",
      `header.sfVersion was missing or invalid; set to 0x${a.toString(16).toUpperCase().padStart(8, "0")} based on outline tables.`,
      `${n}.sfVersion`
    );
  }
  if (s.numTables !== void 0 && (!Number.isInteger(s.numTables) || s.numTables < 0) && N(
    o,
    "error",
    "HEADER_NUMTABLES_INVALID",
    "header.numTables must be a non-negative integer when provided.",
    `${n}.numTables`
  ), s.numTables !== e) {
    const a = s.numTables;
    s.numTables = e, N(
      o,
      "info",
      "HEADER_NUMTABLES_CORRECTED",
      a === void 0 ? `header.numTables was missing; set to ${e}.` : `header.numTables corrected from ${a} to ${e}.`,
      `${n}.numTables`
    );
  }
  const r = ra(e);
  (s.searchRange !== r.searchRange || s.entrySelector !== r.entrySelector || s.rangeShift !== r.rangeShift) && (s.searchRange = r.searchRange, s.entrySelector = r.entrySelector, s.rangeShift = r.rangeShift, N(
    o,
    "info",
    "HEADER_FIELDS_CORRECTED",
    `Header directory fields auto-corrected for ${e} tables (searchRange=${r.searchRange}, entrySelector=${r.entrySelector}, rangeShift=${r.rangeShift}).`,
    n
  ));
}
function h2(t, e, n) {
  if (!Array.isArray(t)) {
    N(
      n,
      "error",
      "TABLE_RAW_INVALID_TYPE",
      "_raw must be an array of byte values.",
      e
    );
    return;
  }
  for (let o = 0; o < t.length; o++) {
    const s = t[o];
    if (!Number.isInteger(s) || s < 0 || s > 255) {
      N(
        n,
        "error",
        "TABLE_RAW_INVALID_BYTE",
        `_raw[${o}] must be an integer byte (0-255).`,
        `${e}[${o}]`
      );
      break;
    }
  }
}
function g2(t, e, n) {
  if (!St(t))
    return N(
      n,
      "error",
      "TABLES_MISSING",
      "Font tables are required and must be an object keyed by 4-char table tag.",
      e
    ), [];
  const o = Object.keys(t);
  o.length === 0 && N(
    n,
    "error",
    "TABLES_EMPTY",
    "Font tables object is empty; at least core required tables are needed.",
    e
  );
  for (const s of o) {
    (typeof s != "string" || s.length !== 4) && N(
      n,
      "error",
      "TABLE_TAG_INVALID",
      `Table tag "${s}" must be exactly 4 characters.`,
      `${e}.${s}`
    );
    const r = t[s], i = `${e}.${s}`;
    if (!St(r)) {
      N(
        n,
        "error",
        "TABLE_DATA_INVALID",
        `Table "${s}" must be an object.`,
        i
      );
      continue;
    }
    r._checksum !== void 0 && !Xf(r._checksum) && N(
      n,
      "error",
      "TABLE_CHECKSUM_INVALID",
      `Table "${s}" _checksum must be uint32 when provided.`,
      `${i}._checksum`
    ), r._raw !== void 0 && h2(r._raw, `${i}._raw`, n);
    const a = jf.has(s), c = qf(r);
    !c && !a ? N(
      n,
      "error",
      "TABLE_WRITER_UNSUPPORTED",
      `Table "${s}" is parsed JSON but no writer is available. Use _raw for unknown tables.`,
      i
    ) : c && !a && N(
      n,
      "info",
      "TABLE_UNRECOGNIZED_RAW",
      `Table "${s}" is not a recognized OpenType table; preserved via _raw bytes.`,
      i
    );
  }
  return o;
}
function p2(t, e, n) {
  const o = (i) => t[i] !== void 0, s = (i) => o(i) && !qf(t[i]), r = (i, a, c = "requires") => {
    if (s(i))
      for (const f of a)
        o(f) || N(
          n,
          "error",
          "TABLE_DEPENDENCY_MISSING",
          `Parsed table "${i}" ${c} table "${f}".`,
          `${e}.${i}`
        );
  };
  r("hmtx", ["hhea", "maxp"]), r("loca", ["head", "maxp"]), r("glyf", ["loca", "head", "maxp"]), r("vmtx", ["vhea", "maxp"]), s("gvar") && !o("fvar") && N(
    n,
    "warning",
    "VARIABLE_TABLE_DEPENDENCY",
    'Parsed table "gvar" usually expects "fvar" to describe variation axes.',
    `${e}.gvar`
  ), s("cvar") && !o("fvar") && N(
    n,
    "warning",
    "VARIABLE_TABLE_DEPENDENCY",
    'Parsed table "cvar" usually expects "fvar" to describe variation axes.',
    `${e}.cvar`
  );
}
function d2(t, e, n) {
  const o = (i) => t[i] !== void 0;
  for (const i of Yf)
    o(i) || N(
      n,
      "error",
      "REQUIRED_TABLE_MISSING",
      `Required core table "${i}" is missing.`,
      e
    );
  o("OS/2") || N(
    n,
    "warning",
    "RECOMMENDED_TABLE_MISSING",
    'Recommended table "OS/2" is missing.',
    e
  );
  const s = o("glyf") || o("loca"), r = o("CFF ") || o("CFF2");
  !s && !r && N(
    n,
    "error",
    "OUTLINE_MISSING",
    "No outline tables found. Include TrueType (glyf+loca) or CFF (CFF / CFF2) outlines.",
    e
  ), s && (o("glyf") || N(
    n,
    "error",
    "TRUETYPE_OUTLINE_INCOMPLETE",
    'TrueType outline requires table "glyf".',
    e
  ), o("loca") || N(
    n,
    "error",
    "TRUETYPE_OUTLINE_INCOMPLETE",
    'TrueType outline requires table "loca".',
    e
  )), s && r && N(
    n,
    "warning",
    "MULTIPLE_OUTLINE_TYPES",
    "Both TrueType and CFF outline tables are present; most fonts use one outline model.",
    e
  );
}
function Kf(t, e, n) {
  if (!St(t)) {
    N(
      n,
      "error",
      "FONTDATA_INVALID",
      "Font data must be an object.",
      e
    );
    return;
  }
  const o = g2(t.tables, `${e}.tables`, n);
  u2(t, o.length, `${e}.header`, n), St(t.tables) && (d2(t.tables, `${e}.tables`, n), p2(t.tables, `${e}.tables`, n));
}
function m2(t, e, n) {
  const o = t.collection, s = t.fonts;
  if (St(o) || N(
    n,
    "error",
    "COLLECTION_META_INVALID",
    "collection must be an object for TTC/OTC inputs.",
    `${e}.collection`
  ), !Array.isArray(s) || s.length === 0) {
    N(
      n,
      "error",
      "COLLECTION_FONTS_INVALID",
      "fonts must be a non-empty array for TTC/OTC inputs.",
      `${e}.fonts`
    );
    return;
  }
  St(o) && o.numFonts !== void 0 && o.numFonts !== s.length && (o.numFonts = s.length, N(
    n,
    "info",
    "COLLECTION_NUMFONTS_CORRECTED",
    `collection.numFonts corrected to ${s.length} to match fonts array.`,
    `${e}.collection.numFonts`
  ));
  for (let r = 0; r < s.length; r++)
    Kf(s[r], `${e}.fonts[${r}]`, n);
}
function y2(t) {
  const e = [];
  return St(t) ? (t.collection !== void 0 || t.fonts !== void 0 ? m2(t, "$", e) : Kf(t, "$", e), aa(e)) : (N(
    e,
    "error",
    "INPUT_INVALID",
    "validateJSON expects a font JSON object.",
    "$"
  ), aa(e));
}
function ca(t) {
  if (typeof t == "string")
    return { kind: "json", text: t };
  let e, n;
  if (t instanceof ArrayBuffer)
    n = t, e = new Uint8Array(t);
  else if (ArrayBuffer.isView(t))
    e = new Uint8Array(t.buffer, t.byteOffset, t.byteLength), n = e.slice().buffer;
  else
    throw new TypeError(
      "FontFlux.open() expects an ArrayBuffer, Uint8Array, or JSON string."
    );
  let o = 0;
  for (e.length >= 3 && e[0] === 239 && e[1] === 187 && e[2] === 191 && (o = 3); o < e.length && (e[o] === 32 || e[o] === 9 || e[o] === 10 || e[o] === 13); )
    o++;
  return o < e.length && (e[o] === 123 || e[o] === 91) ? { kind: "json", text: new TextDecoder("utf-8", { fatal: !1 }).decode(e) } : { kind: "binary", buffer: n };
}
const x2 = {
  name: ".notdef",
  advanceWidth: 500,
  contours: [
    [
      { x: 50, y: 0, onCurve: !0 },
      { x: 50, y: 700, onCurve: !0 },
      { x: 450, y: 700, onCurve: !0 },
      { x: 450, y: 0, onCurve: !0 }
    ]
  ]
};
function S2(t, e) {
  const n = new Set(t.map((r) => r.name));
  let o;
  if (e.unicode != null) {
    const r = e.unicode.toString(16).toUpperCase();
    o = e.unicode <= 65535 ? `uni${r.padStart(4, "0")}` : `u${r.padStart(6, "0")}`;
  } else
    o = e.name || "glyph";
  if (!n.has(o)) return o;
  let s = 1;
  for (; n.has(`${o}.${s}`); ) s++;
  return `${o}.${s}`;
}
class Ct {
  /**
   * @private — use FontFlux.open(), FontFlux.create(), or FontFlux.fromJSON().
   * @param {object} data - The internal simplified font data object.
   */
  constructor(e) {
    this._data = e;
  }
  // ========================================================================
  //  STATIC FACTORY METHODS
  // ========================================================================
  /**
   * Create a new font from scratch (Scenario 2).
   *
   * Returns a FontFlux instance pre-populated with two glyphs at the front of
   * the glyph order: `.notdef` at index 0 and `space` (U+0020) at index 1.
   * Glyphs you add via addGlyph() are appended after these, so the first
   * glyph you add lives at index 2. Because composite components can be
   * resolved by `glyphName` (see createGlyph), you normally never need to
   * reason about these indices — but if you do compute indices by hand,
   * account for the two leading glyphs.
   *
   * @param {object} [options]
   * @param {string} options.family - Font family name (required)
   * @param {string} [options.style='Regular'] - Style name
   * @param {number} [options.unitsPerEm=1000] - Units per em
   * @param {number} [options.ascender=800] - Ascender
   * @param {number} [options.descender=-200] - Descender
   * @returns {FontFlux}
   */
  static create(e = {}) {
    const {
      family: n = "Untitled",
      style: o = "Regular",
      unitsPerEm: s = 1e3,
      ascender: r = 800,
      descender: i = -200
    } = e, a = {
      font: {
        familyName: n,
        styleName: o,
        unitsPerEm: s,
        ascender: r,
        descender: i,
        lineGap: 0
      },
      glyphs: [
        { ...x2 },
        {
          name: "space",
          unicode: 32,
          advanceWidth: Math.round(s / 4)
        }
      ],
      kerning: [],
      // Default gasp table: enable symmetric smoothing at all sizes.
      // Optimal for unhinted fonts — tells rasterizers to use anti-aliasing.
      gasp: [{ maxPPEM: 65535, behavior: 10 }]
    };
    return new Ct(a);
  }
  /**
   * Open an existing font from binary data, a JSON string, or a JSON byte
   * sequence (Scenario 1).
   *
   * Accepted inputs:
   *  - `ArrayBuffer` — binary TTF/OTF/WOFF/WOFF2/TTC/OTC.
   *  - `Uint8Array`  — binary font bytes, or UTF-8 bytes of a JSON file.
   *  - `string`      — JSON produced by `font.toJSON()`.
   *
   * @param {ArrayBuffer|Uint8Array|string} input
   * @returns {FontFlux} Single-font instance. For collections, use openAll().
   * @throws {Error} If input is a collection (TTC/OTC) — use openAll() instead.
   */
  static open(e) {
    const n = ca(e);
    if (n.kind === "json") {
      const s = Go(n.text);
      if (s && s.collection && Array.isArray(s.fonts))
        throw new Error(
          "FontFlux.open() received a font collection JSON. Use FontFlux.openAll() for collections."
        );
      return new Ct(s);
    }
    const o = Kn(n.buffer);
    if (o.collection && o.fonts)
      throw new Error(
        "FontFlux.open() received a font collection (TTC/OTC). Use FontFlux.openAll() for collections."
      );
    return new Ct(o);
  }
  /**
   * Open all fonts from a binary file or JSON. Works for both single fonts
   * and collections.  Accepts the same input types as `FontFlux.open()`.
   *
   * @param {ArrayBuffer|Uint8Array|string} input
   * @returns {FontFlux[]} Array of FontFlux instances (one per face).
   */
  static openAll(e) {
    const n = ca(e);
    if (n.kind === "json") {
      const s = Go(n.text);
      return s && s.collection && Array.isArray(s.fonts) ? s.fonts.map((r) => new Ct(r)) : [new Ct(s)];
    }
    const o = Kn(n.buffer);
    return o.collection && o.fonts ? o.fonts.map((s) => new Ct(s)) : [new Ct(o)];
  }
  /**
   * Restore a font from a JSON string.
   *
   * @param {string} jsonString - JSON produced by font.toJSON().
   * @returns {FontFlux}
   */
  static fromJSON(e) {
    const n = Go(e);
    return new Ct(n);
  }
  /**
   * Initialize WOFF2 support. Must be called (and awaited) once before
   * opening or exporting WOFF2 files.
   *
   * @returns {Promise<void>}
   */
  static async initWoff2() {
    return Ff();
  }
  /**
   * Export a collection of FontFlux instances as a TTC/OTC file.
   *
   * @param {FontFlux[]} fonts - Array of FontFlux instances.
   * @param {object} [options] - Export options.
   * @param {string} [options.format='sfnt'] - Output format: 'sfnt', 'woff', 'woff2'.
   * @returns {ArrayBuffer}
   */
  static exportCollection(e, n = {}) {
    if (!Array.isArray(e) || e.length === 0)
      throw new Error(
        "exportCollection requires a non-empty array of FontFlux instances"
      );
    const o = {
      collection: {
        tag: "ttcf",
        majorVersion: 2,
        minorVersion: 0,
        numFonts: e.length
      },
      fonts: e.map((s) => s._data)
    };
    return Gi(o, n);
  }
  // ========================================================================
  //  STATIC UTILITIES (font-independent)
  // ========================================================================
  /**
   * Diagnose a binary font file and return a detailed report of problems.
   *
   * Unlike `FontFlux.open()` which throws on corruption, this method
   * catches errors at each phase and continues, producing a comprehensive
   * report that explains exactly what's wrong with the file.
   *
   * @param {ArrayBuffer} buffer - Raw font file bytes.
   * @returns {object} Report: `{ valid, errors, warnings, infos, issues, summary }`.
   */
  static diagnose(e) {
    return l2(e);
  }
  /** Convert an SVG path `d` string to font contours. */
  static svgToContours(e, n) {
    return fa(e, n);
  }
  /** Convert font contours to an SVG path `d` string. */
  static contoursToSVG(e) {
    return gl(e);
  }
  /** Compile CFF contours to Type 2 charstring bytecode. */
  static compileCharString(e) {
    return qe(e);
  }
  /** Assemble charstring assembly text to Type 2 bytecode. */
  static assembleCharString(e) {
    return hl(e);
  }
  /** Interpret Type 2 charstring bytecode to CFF contours. */
  static interpretCharString(e, n, o) {
    return Qn(e, n, o);
  }
  /** Disassemble Type 2 charstring bytecode to assembly text. */
  static disassembleCharString(e) {
    return Sa(e);
  }
  // ========================================================================
  //  DIRECT DATA ACCESS (live references — zero friction reads)
  // ========================================================================
  /**
   * The full simplified font data object — the same shape returned by
   * `FontFlux.fromJSON()`. This is a live reference (mutations persist),
   * intended as an escape hatch for power users who need to read or
   * transform the whole document without going field-by-field.
   *
   * The instance getters below (`.info`, `.glyphs`, `.tables`, ...) read
   * into this same object.
   */
  get data() {
    return this._data;
  }
  /** Font metadata object. */
  get info() {
    return this._data.font;
  }
  /** Glyphs array. */
  get glyphs() {
    return this._data.glyphs;
  }
  /** Kerning pairs array. */
  get kerning() {
    return this._data.kerning || (this._data.kerning = []), this._data.kerning;
  }
  /** Variable font axes, or undefined. */
  get axes() {
    return this._data.axes;
  }
  /** Named instances, or undefined. */
  get instances() {
    return this._data.instances;
  }
  /** OpenType features { GPOS, GSUB, GDEF }, or undefined. */
  get features() {
    return this._data.features;
  }
  /** Original stored raw tables (Scenario 1 imports), or undefined. */
  get tables() {
    return this._data.tables;
  }
  /** Number of glyphs. */
  get glyphCount() {
    return this._data.glyphs.length;
  }
  /** Detected outline format: 'truetype', 'cff', or 'cff2'. */
  get format() {
    return this._data._header?.sfVersion === 1330926671 || this._data.glyphs.some((n) => n.charString) ? "cff" : "truetype";
  }
  // ========================================================================
  //  FONT INFO
  // ========================================================================
  /**
   * Get font metadata as a plain object.
   * @returns {object}
   */
  getInfo() {
    return this._data.font;
  }
  /**
   * Update font metadata by merging partial values.
   * @param {object} partial - Fields to update (e.g. { familyName: 'New' }).
   */
  setInfo(e) {
    Object.assign(this._data.font, e);
  }
  // ========================================================================
  //  GLYPHS
  // ========================================================================
  /**
   * List all glyphs (lightweight summary).
   * @returns {Array<{name: string, unicode: number|null, index: number}>}
   */
  listGlyphs() {
    return this._data.glyphs.map((e, n) => ({
      name: e.name,
      unicode: e.unicode ?? null,
      index: n
    }));
  }
  /**
   * Get a glyph by name, Unicode code point, or hex string.
   * Returns the live internal glyph object (direct mutation works).
   *
   * @param {string|number} id - Glyph name, code point, or hex string.
   * @returns {object|undefined}
   */
  getGlyph(e) {
    return pn(this._data, e);
  }
  /**
   * Check if a glyph exists.
   * @param {string|number} id
   * @returns {boolean}
   */
  hasGlyph(e) {
    return pn(this._data, e) !== void 0;
  }
  /**
   * Get a glyph's renderable outline contours, recursively flattening
   * composite (component-based) glyphs into absolute TrueType contours and
   * applying each component's offset and 2×2 transform.
   *
   * Simple glyphs return a copy of their own contours. Composite glyphs (e.g.
   * accented letters built from a base letter plus a diacritic) return the
   * decomposed geometry rather than an empty array. The stored glyph is not
   * mutated, so its `components` remain intact for a lossless export.
   *
   * @param {string|number} id - Glyph name, code point, or hex string.
   * @returns {Array} Array of contours ([{ x, y, onCurve }, …]), or [] when
   *   the glyph has no geometry or does not exist.
   */
  getGlyphContours(e) {
    const n = pn(this._data, e);
    return n ? As(this._data.glyphs, n) : [];
  }
  /**
   * Add or replace a glyph. If raw options are provided (not a glyph object),
   * they are passed through createGlyph() automatically.
   *
   * Replacement rules (in priority order):
   *   1. A Unicode code point maps to exactly one glyph, so a new glyph that
   *      claims a code point already owned by another glyph replaces it.
   *   2. Otherwise, a glyph with the same `name` is replaced in place — but
   *      only when doing so would not discard a glyph that owns a *different*
   *      code point. Two glyphs that merely share a name yet map to distinct
   *      code points must both survive; the incoming one is auto-uniquified
   *      (AGL `uniXXXX` / `uXXXXXX`) and appended instead of silently dropping
   *      the existing glyph.
   *
   * @param {object} glyphOrOptions - A glyph object or createGlyph() options.
   */
  addGlyph(e) {
    let n = e;
    (n.path || n.name && n.advanceWidth && !n._created) && (n = Sl(n));
    const o = this._data.glyphs;
    if (n.unicode != null) {
      const r = o.findIndex((i) => i.unicode === n.unicode);
      if (r >= 0) {
        o[r] = n;
        return;
      }
    }
    const s = o.findIndex((r) => r.name === n.name);
    if (s >= 0) {
      const r = o[s];
      if (!(r.unicode != null && n.unicode != null && r.unicode !== n.unicode)) {
        o[s] = n;
        return;
      }
      n.name = S2(o, n);
    }
    o.push(n);
  }
  /**
   * Remove a glyph by name, Unicode code point, or hex string.
   * Also removes any kerning pairs referencing the removed glyph.
   *
   * @param {string|number} id
   * @returns {boolean} True if a glyph was removed.
   */
  removeGlyph(e) {
    const n = this._data.glyphs, o = pn(this._data, e);
    if (!o) return !1;
    const s = n.indexOf(o);
    return s < 0 ? !1 : (n.splice(s, 1), this._data.kerning && o.name && (this._data.kerning = this._data.kerning.filter(
      (r) => r.left !== o.name && r.right !== o.name
    )), !0);
  }
  // ========================================================================
  //  KERNING
  // ========================================================================
  /**
   * Get the kerning value for a pair of glyphs.
   *
   * @param {string|number} left - Glyph name, code point, or hex string.
   * @param {string|number} right - Glyph name, code point, or hex string.
   * @returns {number|undefined}
   */
  getKerning(e, n) {
    return xS(this._data, e, n);
  }
  /**
   * Add kerning pairs. Accepts all createKerning() input formats.
   * Duplicate pairs are resolved with last-write-wins.
   *
   * @param {object|object[]} pairsOrInput - Kerning data in any supported format.
   */
  addKerning(e) {
    const n = yS(e);
    this._data.kerning || (this._data.kerning = []);
    for (const o of n) {
      const s = this._data.kerning.findIndex(
        (r) => r.left === o.left && r.right === o.right
      );
      s >= 0 ? this._data.kerning[s] = o : this._data.kerning.push(o);
    }
  }
  /**
   * Remove a specific kerning pair.
   *
   * @param {string|number} left
   * @param {string|number} right
   * @returns {boolean} True if a pair was removed.
   */
  removeKerning(e, n) {
    if (!this._data.kerning) return !1;
    const o = this._data.glyphs, s = Ft(o, e), r = Ft(o, n);
    if (!s || !r) return !1;
    const i = this._data.kerning.findIndex(
      (a) => a.left === s && a.right === r
    );
    return i < 0 ? !1 : (this._data.kerning.splice(i, 1), !0);
  }
  /**
   * List all kerning pairs.
   * @returns {Array<{left: string, right: string, value: number}>}
   */
  listKerning() {
    return this._data.kerning || [];
  }
  /**
   * Remove all kerning.
   */
  clearKerning() {
    this._data.kerning = [];
  }
  // ========================================================================
  //  GSUB SUBSTITUTIONS
  // ========================================================================
  /**
   * Live reference to substitution rules.
   * @returns {Array<object>}
   */
  get substitutions() {
    return this._data.substitutions || (this._data.substitutions = []), this._data.substitutions;
  }
  /**
   * List all substitution rules.
   * @param {object} [filter] - Optional { type?, feature? } filter.
   * @returns {Array<object>}
   */
  listSubstitutions(e) {
    const n = this._data.substitutions || [];
    return e ? n.filter((o) => !(e.type && o.type !== e.type || e.feature && o.feature !== e.feature)) : n;
  }
  /**
   * Find substitution rules for a specific glyph.
   *
   * @param {string|number} glyphId - Glyph name, code point, or hex string.
   * @param {object} [options] - { type?, feature? }
   * @returns {Array<object>}
   */
  getSubstitution(e, n) {
    return wS(this._data, e, n);
  }
  /**
   * Add substitution rules. Accepts the same flexible formats as
   * createSubstitution(): single rules, arrays, class-based, etc.
   *
   * @param {object|object[]} rulesOrInput - Substitution rule(s).
   */
  addSubstitution(e) {
    const n = _S(e);
    this._data.substitutions || (this._data.substitutions = []);
    for (const o of n)
      this._data.substitutions.push(o);
  }
  /**
   * Remove substitution rules matching a filter.
   *
   * @param {object} filter - { type?, feature?, from?, ligature? }
   * @returns {number} Number of rules removed.
   */
  removeSubstitution(e) {
    if (!this._data.substitutions) return 0;
    const n = this._data.substitutions.length;
    return this._data.substitutions = this._data.substitutions.filter((o) => !!(e.type && o.type !== e.type || e.feature && o.feature !== e.feature || e.from && o.from !== e.from || e.ligature && o.ligature !== e.ligature)), n - this._data.substitutions.length;
  }
  /**
   * Remove all substitution rules.
   */
  clearSubstitutions() {
    this._data.substitutions = [];
  }
  // ========================================================================
  //  VARIABLE FONT AXES
  // ========================================================================
  /**
   * List variable font axes.
   * @returns {Array<{tag: string, name: string, min: number, default: number, max: number}>}
   */
  listAxes() {
    return this._data.axes || [];
  }
  /**
   * Get a specific axis by tag.
   * @param {string} tag - 4-character axis tag (e.g. 'wght', 'wdth').
   * @returns {object|undefined}
   */
  getAxis(e) {
    return this._data.axes?.find((n) => n.tag === e);
  }
  /**
   * Add a new variable font axis.
   * @param {object} axis - { tag, name, min, default, max, hidden? }
   */
  addAxis(e) {
    this._data.axes || (this._data.axes = []);
    const n = this._data.axes.findIndex((o) => o.tag === e.tag);
    n >= 0 ? this._data.axes[n] = e : this._data.axes.push(e);
  }
  /**
   * Remove an axis by tag. Also removes instances referencing it.
   * @param {string} tag
   * @returns {boolean}
   */
  removeAxis(e) {
    if (!this._data.axes) return !1;
    const n = this._data.axes.findIndex((o) => o.tag === e);
    return n < 0 ? !1 : (this._data.axes.splice(n, 1), this._data.instances && (this._data.instances = this._data.instances.filter(
      (o) => !o.coordinates || !(e in o.coordinates)
    )), this._data.axes.length === 0 && (delete this._data.axes, delete this._data.instances), !0);
  }
  /**
   * Update an axis's properties.
   * @param {string} tag
   * @param {object} partial - Fields to update.
   * @returns {boolean}
   */
  setAxis(e, n) {
    const o = this._data.axes?.find((s) => s.tag === e);
    return o ? (Object.assign(o, n), !0) : !1;
  }
  // ========================================================================
  //  NAMED INSTANCES
  // ========================================================================
  /**
   * List named instances.
   * @returns {Array<{name: string, coordinates: object}>}
   */
  listInstances() {
    return this._data.instances || [];
  }
  /**
   * Add a named instance.
   * @param {object} instance - { name, coordinates: { wght: 700, ... } }
   */
  addInstance(e) {
    this._data.instances || (this._data.instances = []);
    const n = this._data.instances.findIndex(
      (o) => o.name === e.name
    );
    n >= 0 ? this._data.instances[n] = e : this._data.instances.push(e);
  }
  /**
   * Remove a named instance by name.
   * @param {string} name
   * @returns {boolean}
   */
  removeInstance(e) {
    if (!this._data.instances) return !1;
    const n = this._data.instances.findIndex((o) => o.name === e);
    return n < 0 ? !1 : (this._data.instances.splice(n, 1), !0);
  }
  // ========================================================================
  //  COLOR FONTS (PALETTES + COLOR GLYPHS)
  // ========================================================================
  /**
   * Live reference to palettes array.
   * Each palette is an array of hex color strings (#RRGGBB or #RRGGBBAA).
   * @returns {string[][]}
   */
  get palettes() {
    return this._data.palettes || (this._data.palettes = []), this._data.palettes;
  }
  /**
   * Get a palette by index.
   * @param {number} index - Palette index.
   * @returns {string[]|undefined} Array of hex strings, or undefined.
   */
  getPalette(e) {
    return this._data.palettes?.[e];
  }
  /**
   * Add a palette.
   *
   * @param {Array<string|object>} colors - Array of hex strings or BGRA objects.
   * @returns {number} The index of the added palette.
   */
  addPalette(e) {
    this._data.palettes || (this._data.palettes = []);
    const n = Ys(e);
    return this._data.palettes.push(n), this._data.palettes.length - 1;
  }
  /**
   * Remove a palette by index.
   * @param {number} index
   * @returns {boolean} True if a palette was removed.
   */
  removePalette(e) {
    return !this._data.palettes || e < 0 || e >= this._data.palettes.length ? !1 : (this._data.palettes.splice(e, 1), this._data.palettes.length === 0 && delete this._data.palettes, !0);
  }
  /**
   * Update a single color in a palette.
   * @param {number} paletteIndex
   * @param {number} colorIndex
   * @param {string} hex - Hex color string.
   */
  setPaletteColor(e, n, o) {
    const s = this._data.palettes?.[e];
    if (!s)
      throw new Error(`Palette ${e} does not exist`);
    if (n < 0 || n >= s.length)
      throw new Error(`Color index ${n} out of range`);
    const r = Ys([o]);
    s[n] = r[0];
  }
  /**
   * Live reference to color glyphs array.
   * @returns {object[]}
   */
  get colorGlyphs() {
    return this._data.colorGlyphs || (this._data.colorGlyphs = []), this._data.colorGlyphs;
  }
  /**
   * Get color data for a glyph by name, code point, or hex string.
   * @param {string|number} id
   * @returns {object|undefined} The color glyph object, or undefined.
   */
  getColorGlyph(e) {
    const n = Ft(this._data.glyphs, e);
    if (n)
      return this._data.colorGlyphs?.find((o) => o.name === n);
  }
  /**
   * Add color data for a glyph. Replaces existing color data for the same glyph.
   *
   * @param {object} input - Color glyph data with `name` and either `layers` or `paint`.
   */
  addColorGlyph(e) {
    const n = nl(e);
    this._data.colorGlyphs || (this._data.colorGlyphs = []);
    const o = this._data.colorGlyphs.findIndex(
      (s) => s.name === n.name
    );
    o >= 0 ? this._data.colorGlyphs[o] = n : this._data.colorGlyphs.push(n);
  }
  /**
   * Remove color data for a glyph.
   * @param {string|number} id - Glyph name, code point, or hex string.
   * @returns {boolean} True if color data was removed.
   */
  removeColorGlyph(e) {
    if (!this._data.colorGlyphs) return !1;
    const n = Ft(this._data.glyphs, e);
    if (!n) return !1;
    const o = this._data.colorGlyphs.findIndex((s) => s.name === n);
    return o < 0 ? !1 : (this._data.colorGlyphs.splice(o, 1), this._data.colorGlyphs.length === 0 && delete this._data.colorGlyphs, !0);
  }
  /**
   * List all glyphs that have color data.
   * @returns {Array<{name: string, type: string}>}
   */
  listColorGlyphs() {
    return (this._data.colorGlyphs || []).map((e) => ({
      name: e.name,
      type: e.layers ? "layers" : "paint"
    }));
  }
  // ========================================================================
  //  FEATURES & HINTING
  // ========================================================================
  /**
   * Get OpenType features (GPOS, GSUB, GDEF) as raw parsed objects.
   * @returns {object}
   */
  getFeatures() {
    return this._data.features || {};
  }
  /**
   * Replace or update feature tables.
   * @param {object} partial - { GPOS?, GSUB?, GDEF? }
   */
  setFeatures(e) {
    this._data.features || (this._data.features = {}), Object.assign(this._data.features, e);
  }
  /**
   * Get TrueType hinting tables.
   * @returns {object} { gasp?, cvt?, fpgm?, prep? }
   */
  getHinting() {
    return {
      gasp: this._data.gasp,
      cvt: this._data.cvt,
      fpgm: this._data.fpgm,
      prep: this._data.prep
    };
  }
  /**
   * Update TrueType hinting tables.
   * @param {object} partial - { gasp?, cvt?, fpgm?, prep? }
   */
  setHinting(e) {
    e.gasp !== void 0 && (this._data.gasp = e.gasp), e.cvt !== void 0 && (this._data.cvt = e.cvt), e.fpgm !== void 0 && (this._data.fpgm = e.fpgm), e.prep !== void 0 && (this._data.prep = e.prep);
  }
  // ========================================================================
  //  EXPORT & SERIALIZATION
  // ========================================================================
  /**
   * Export the font to binary data.
   *
   * @param {object} [options]
   * @param {string} [options.format] - 'sfnt', 'woff', 'woff2', 'cff', 'ttf',
   *   or 'otf'. `ttf` and `otf` emit an SFNT file but first convert the glyph
   *   outlines to TrueType (`glyf`) or PostScript (`CFF `) respectively.
   * @returns {ArrayBuffer}
   */
  export(e) {
    return Gi(this._data, e);
  }
  /**
   * Convert the font's glyph outlines between TrueType (`glyf`, quadratic) and
   * PostScript/CFF (`CFF `, cubic) technologies in place, switching the
   * sfntVersion and swapping the outline tables. Static fonts only.
   *
   * @param {'truetype'|'cff'} target - Desired outline technology.
   * @returns {FontFlux} this (for chaining).
   */
  convertOutlines(e) {
    return this._data = ga(this._data, e), this;
  }
  /**
   * Serialize the font to a JSON string.
   *
   * @param {number} [indent=2] - Indentation level.
   * @returns {string}
   */
  toJSON(e) {
    return mS(this._data, e);
  }
  /**
   * Validate the font data.
   *
   * @returns {object} { valid, errors, warnings, infos }
   */
  validate() {
    return y2(this._data);
  }
  /**
   * Strip stored tables and header, converting to a pure hand-authored shape.
   * Non-decomposed tables (COLR, gvar, bitmap data, etc.) are lost.
   *
   * @returns {FontFlux} Returns `this` for chaining.
   */
  detach() {
    return delete this._data._header, delete this._data.tables, delete this._data._woff, this;
  }
}
async function _2() {
  return Ff();
}
export {
  Ct as FontFlux,
  l2 as diagnoseFont,
  Go as fontFromJSON,
  mS as fontToJSON,
  _2 as initWoff2
};
