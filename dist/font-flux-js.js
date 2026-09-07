function Os(t) {
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
function Es(t) {
  const e = (t.red & 255).toString(16).padStart(2, "0"), n = (t.green & 255).toString(16).padStart(2, "0"), o = (t.blue & 255).toString(16).padStart(2, "0");
  if (t.alpha === 255 || t.alpha === void 0)
    return `#${e}${n}${o}`;
  const s = (t.alpha & 255).toString(16).padStart(2, "0");
  return `#${e}${n}${o}${s}`;
}
function tr(t) {
  if (!Array.isArray(t))
    throw new Error("Palette must be an array of colors");
  return t.map((e) => {
    if (typeof e == "string")
      return Os(e), lu(e);
    if (e && typeof e == "object" && "red" in e)
      return Es(e);
    throw new Error(`Invalid palette color: ${e}`);
  });
}
function lu(t) {
  return Es(Os(t));
}
function hu(t) {
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
function gu(t) {
  const e = /* @__PURE__ */ new Map();
  for (let n = 0; n < t.length; n++)
    e.set(n, t[n].name);
  return e;
}
function pu(t) {
  const e = /* @__PURE__ */ new Map();
  for (let n = 0; n < t.length; n++)
    t[n].name && e.set(t[n].name, n);
  return e;
}
function On(t, e) {
  !t || typeof t != "object" || (t.glyphID !== void 0 && typeof t.glyphID == "number" && (t.glyphID = e.get(t.glyphID) ?? t.glyphID), t.paint && On(t.paint, e), t.sourcePaint && On(t.sourcePaint, e), t.backdropPaint && On(t.backdropPaint, e));
}
function En(t, e) {
  if (!(!t || typeof t != "object")) {
    if (t.glyphID !== void 0 && typeof t.glyphID == "string") {
      const n = e.get(t.glyphID);
      n !== void 0 && (t.glyphID = n);
    }
    t.paint && En(t.paint, e), t.sourcePaint && En(t.sourcePaint, e), t.backdropPaint && En(t.backdropPaint, e);
  }
}
function q(t) {
  if (!Number.isInteger(t) || t < -32768 || t > 32767)
    return du(t);
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
function du(t) {
  const e = Math.round(t * 65536), n = e < 0 ? e + 4294967296 : e;
  return [
    255,
    n >> 24 & 255,
    n >> 16 & 255,
    n >> 8 & 255,
    n & 255
  ];
}
const er = 21, mu = 22, yu = 4, xu = 5, Su = 6, _u = 7, wu = 8, nr = 14;
function Xe(t, e) {
  const n = Number.isFinite(e) ? q(e) : [];
  if (!t || t.length === 0)
    return [
      ...n,
      ...q(0),
      ...q(0),
      er,
      nr
    ];
  const o = [...n];
  let s = 0, r = 0;
  for (const i of t)
    if (!(!i || i.length === 0))
      for (const a of i)
        switch (a.type) {
          case "M": {
            const c = a.x - s, f = a.y - r;
            c === 0 && f !== 0 ? o.push(...q(f), yu) : f === 0 && c !== 0 ? o.push(...q(c), mu) : o.push(...q(c), ...q(f), er), s = a.x, r = a.y;
            break;
          }
          case "L": {
            const c = a.x - s, f = a.y - r;
            c === 0 && f !== 0 ? o.push(...q(f), _u) : f === 0 && c !== 0 ? o.push(...q(c), Su) : o.push(...q(c), ...q(f), xu), s = a.x, r = a.y;
            break;
          }
          case "C": {
            const c = a.x1 - s, f = a.y1 - r, u = a.x2 - a.x1, l = a.y2 - a.y1, h = a.x - a.x2, p = a.y - a.y2;
            o.push(
              ...q(c),
              ...q(f),
              ...q(u),
              ...q(l),
              ...q(h),
              ...q(p),
              wu
            ), s = a.x, r = a.y;
            break;
          }
        }
  return o.push(nr), o;
}
const or = {
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
function bu(t) {
  const e = [], n = t.split(`
`).filter((o) => o.trim().length > 0);
  for (const o of n) {
    const s = o.trim().split(/\s+/);
    if (s.length === 0) continue;
    let r = -1, i = null;
    for (let a = 0; a < s.length; a++) {
      const c = s[a].toLowerCase();
      if (or[c] || c.startsWith("op")) {
        r = a, i = c;
        break;
      }
    }
    if (r === -1) {
      for (const a of s)
        e.push(...q(parseFloat(a)));
      continue;
    }
    for (let a = 0; a < r; a++)
      e.push(...q(parseFloat(s[a])));
    if (i.startsWith("op12.")) {
      const a = parseInt(i.slice(5), 10);
      e.push(12, a);
    } else i.startsWith("op") ? e.push(parseInt(i.slice(2), 10)) : e.push(...or[i]);
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
function Au(t) {
  if (!t || t.length === 0) return "";
  const e = [];
  for (const n of t)
    !n || n.length === 0 || (n[0].type ? e.push(Cu(n)) : e.push(vu(n)));
  return e.join(" ");
}
function Cu(t) {
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
function vu(t) {
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
      const f = (o + r + 1) % n, u = t[f];
      if (u.onCurve)
        e.push(`Q${U(c.x)} ${U(c.y)} ${U(u.x)} ${U(u.y)}`), r += 2;
      else {
        const l = (c.x + u.x) / 2, h = (c.y + u.y) / 2;
        e.push(`Q${U(c.x)} ${U(c.y)} ${U(l)} ${U(h)}`), r++;
      }
    }
  }
  const i = t[(o + n - 1) % n];
  return i.onCurve || e.push(
    `Q${U(i.x)} ${U(i.y)} ${U(s.x)} ${U(s.y)}`
  ), e.push("Z"), e.join(" ");
}
function da(t, e = "cff") {
  const n = Ou(t);
  if (n.length === 0) return [];
  const o = [];
  let s = null;
  const r = () => {
    s && s.some((i) => i.op !== "M") && o.push(s), s = null;
  };
  for (const i of n)
    i.op === "M" ? (r(), s = [i]) : i.op === "Z" ? r() : s && s.push(i);
  return r(), e === "truetype" ? o.map((i) => ku(i)) : o.map((i) => Iu(i));
}
function Iu(t) {
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
function ku(t) {
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
        const o = e[e.length - 1], s = o ? o.x : 0, r = o ? o.y : 0, i = Bn(
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
function Ou(t) {
  const e = [], n = t.match(
    /[MmLlHhVvCcSsQqTtZz]|[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g
  );
  if (!n) return e;
  let o = 0, s = 0, r = 0, i = 0, a = "", c = 0, f = 0, u = 0;
  function l() {
    return parseFloat(n[u++]);
  }
  for (; u < n.length; ) {
    let h = n[u];
    /[A-Za-z]/.test(h) ? u++ : h = a;
    const p = h === h.toLowerCase();
    switch (h.toUpperCase()) {
      case "M": {
        let d = l(), x = l();
        p && (d += o, x += s), e.push({ op: "M", x: d, y: x }), o = r = d, s = i = x, a = p ? "l" : "L";
        break;
      }
      case "L": {
        let d = l(), x = l();
        p && (d += o, x += s), e.push({ op: "L", x: d, y: x }), o = d, s = x, a = h;
        break;
      }
      case "H": {
        let d = l();
        p && (d += o), e.push({ op: "L", x: d, y: s }), o = d, a = h;
        break;
      }
      case "V": {
        let d = l();
        p && (d += s), e.push({ op: "L", x: o, y: d }), s = d, a = h;
        break;
      }
      case "C": {
        let d = l(), x = l(), m = l(), y = l(), w = l(), _ = l();
        p && (d += o, x += s, m += o, y += s, w += o, _ += s), e.push({ op: "C", x1: d, y1: x, x2: m, y2: y, x: w, y: _ }), c = m, f = y, o = w, s = _, a = h;
        break;
      }
      case "S": {
        let d = 2 * o - c, x = 2 * s - f;
        a.toUpperCase() !== "C" && a.toUpperCase() !== "S" && (d = o, x = s);
        let m = l(), y = l(), w = l(), _ = l();
        p && (m += o, y += s, w += o, _ += s), e.push({ op: "C", x1: d, y1: x, x2: m, y2: y, x: w, y: _ }), c = m, f = y, o = w, s = _, a = h;
        break;
      }
      case "Q": {
        let d = l(), x = l(), m = l(), y = l();
        p && (d += o, x += s, m += o, y += s), e.push({ op: "Q", x1: d, y1: x, x: m, y }), c = d, f = x, o = m, s = y, a = h;
        break;
      }
      case "T": {
        let d = 2 * o - c, x = 2 * s - f;
        a.toUpperCase() !== "Q" && a.toUpperCase() !== "T" && (d = o, x = s);
        let m = l(), y = l();
        p && (m += o, y += s), e.push({ op: "Q", x1: d, y1: x, x: m, y }), c = d, f = x, o = m, s = y, a = h;
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
function Bn(t, e, n, o, s, r, i, a, c = 0) {
  const f = (3 * (n + s) - t - i) / 4, u = (3 * (o + r) - e - a) / 4, l = t + 2 / 3 * (f - t), h = e + 2 / 3 * (u - e), p = i + 2 / 3 * (f - i), g = a + 2 / 3 * (u - a), d = Math.hypot(n - l, o - h), x = Math.hypot(s - p, r - g);
  if (Math.max(d, x) <= 0.5 || c >= 8)
    return [{ cx: f, cy: u, x: i, y: a }];
  const y = (t + n) / 2, w = (e + o) / 2, _ = (n + s) / 2, S = (o + r) / 2, b = (s + i) / 2, A = (r + a) / 2, k = (y + _) / 2, O = (w + S) / 2, I = (_ + b) / 2, T = (S + A) / 2, E = (k + I) / 2, D = (O + T) / 2, R = Bn(
    t,
    e,
    y,
    w,
    k,
    O,
    E,
    D,
    c + 1
  ), M = Bn(
    E,
    D,
    I,
    T,
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
function Eu(t) {
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
    charString: u,
    components: l,
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
  if (o && o.length > 0 ? g.unicodes = o : n != null && (g.unicode = n), r !== void 0 && (g.leftSideBearing = r), i !== void 0 && (g.advanceHeight = i), a !== void 0 && (g.topSideBearing = a), h && (g.instructions = h), u)
    g.charString = u;
  else if (c) {
    const d = da(c, p);
    g.contours = d, p === "cff" && (g.charString = Xe(d));
  } else f ? (g.contours = f, f.length > 0 && f[0] && f[0].length > 0 && f[0][0].type && (g.charString = Xe(f))) : l && (g.components = l);
  return g;
}
function pn(t, e) {
  const n = t?.glyphs;
  if (!n || !Array.isArray(n)) return;
  const o = ma(e);
  if (o !== void 0)
    return ya(n, o);
  if (typeof e == "string")
    return n.find((s) => s.name === e);
}
function Ft(t, e) {
  const n = ma(e);
  if (n !== void 0)
    return ya(t, n)?.name;
  if (typeof e == "string")
    return e;
}
function ma(t) {
  if (typeof t == "number") return t;
  if (typeof t == "string") {
    const e = t.match(/^(?:U\+|0x)([0-9A-Fa-f]+)$/i);
    if (e) return parseInt(e[1], 16);
  }
}
function ya(t, e) {
  for (const n of t)
    if (n.unicode === e || n.unicodes && n.unicodes.includes(e) || n.codePoint === e) return n;
}
function xa(t) {
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
function Tu(t, e) {
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
  const a = { glyphIndex: n, flags: s, argument1: r, argument2: i }, c = xa(t);
  return c && (a.transform = c), a;
}
function Du(t) {
  let e = 1, n = 0, o = 0, s = 1;
  const r = xa(t);
  r && (typeof r.scale == "number" ? (e = r.scale, s = r.scale) : (typeof r.xScale == "number" && (e = r.xScale), typeof r.yScale == "number" && (s = r.yScale), typeof r.scale01 == "number" && (n = r.scale01), typeof r.scale10 == "number" && (o = r.scale10)));
  let i = 0, a = 0;
  return t.flags?.argsAreXYValues ? (i = t.argument1 || 0, a = t.argument2 || 0) : t.flags == null && (i = t.argument1 ?? t.dx ?? 0, a = t.argument2 ?? t.dy ?? 0), { a: e, b: n, c: o, d: s, dx: i, dy: a };
}
function Ts(t, e, n = 0) {
  if (!e) return [];
  if (!e.components || e.components.length === 0)
    return Array.isArray(e.contours) ? e.contours.map((s) => s.slice()) : [];
  if (n > 16 || !Array.isArray(t)) return [];
  const o = [];
  for (const s of e.components) {
    let r = t[s.glyphIndex];
    if (!r && s.glyphName != null && (r = t.find((g) => g && g.name === s.glyphName)), !r) continue;
    const i = Ts(t, r, n + 1);
    if (i.length === 0) continue;
    const { a, b: c, c: f, d: u, dx: l, dy: h } = Du(s), p = a === 1 && c === 0 && f === 0 && u === 1;
    for (const g of i)
      o.push(
        g.map((d) => ({
          x: p ? d.x + l : Math.round(a * d.x + f * d.y + l),
          y: p ? d.y + h : Math.round(c * d.x + u * d.y + h),
          onCurve: d.onCurve
        }))
      );
  }
  return o;
}
const Ru = 65536, Fu = 1330926671, Mu = ["CFF ", "CFF2", "VORG"], Lu = [
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
function Sa(t, e) {
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
  if (Bu(t) === e) return t;
  if (!Array.isArray(t.glyphs))
    throw new Error(
      "Outline conversion requires simplified glyph data ({ font, glyphs })."
    );
  const o = t.tables || {};
  if (t.axes?.length || o.fvar || o.gvar || o.CFF2)
    throw new Error(
      "Outline conversion is not supported for variable fonts (fvar/gvar/CFF2)."
    );
  return e === "truetype" ? Vu(t) : $u(t);
}
function Bu(t) {
  const e = t.tables || {};
  if (e["CFF "] || e.CFF2) return "cff";
  if (e.glyf) return "truetype";
  const n = t.glyphs || [];
  if (n.some((r) => r.components && r.components.length > 0))
    return "truetype";
  let o = 0, s = 0;
  for (const r of n)
    r.charString ? o++ : r.contours && r.contours.length > 0 && !to(r.contours) && s++;
  return o > 0 && o >= s ? "cff" : "truetype";
}
function Vu(t) {
  const e = t.glyphs.map((n) => {
    const o = { ...n };
    return delete o.charString, delete o.charStringDisassembly, delete o.components, to(n.contours) ? o.contours = n.contours.map(_a) : Array.isArray(n.contours) ? o.contours = n.contours : o.contours = [], o.leftSideBearing = Pu(o.contours), o;
  });
  return Aa(t, {
    glyphs: e,
    tables: wa(t.tables, Mu),
    _header: ba(t._header, Ru)
  });
}
function _a(t) {
  if (!Array.isArray(t) || t.length === 0) return [];
  const e = [];
  let n = 0, o = 0;
  for (const s of t)
    switch (s.type) {
      case "M":
      case "L":
        e.push({ x: j(s.x), y: j(s.y), onCurve: !0 }), n = s.x, o = s.y;
        break;
      case "Q":
        e.push({ x: j(s.x1), y: j(s.y1), onCurve: !1 }), e.push({ x: j(s.x), y: j(s.y), onCurve: !0 }), n = s.x, o = s.y;
        break;
      case "C": {
        const r = Bn(
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
          e.push({ x: j(i.cx), y: j(i.cy), onCurve: !1 }), e.push({ x: j(i.x), y: j(i.y), onCurve: !0 });
        n = s.x, o = s.y;
        break;
      }
    }
  return e;
}
function $u(t) {
  const e = t.glyphs, n = e.map((o) => {
    const s = { ...o };
    delete s.instructions, delete s.components;
    const i = Ts(e, o).map(Nu).filter((c) => c.length > 0);
    s.contours = i;
    const a = Number.isFinite(o.advanceWidth) ? o.advanceWidth : void 0;
    return s.charString = Xe(i, a), s;
  });
  return Aa(t, {
    glyphs: n,
    tables: wa(t.tables, Lu),
    _header: ba(t._header, Fu),
    // Clear decomposed TrueType-hinting fields so they are not re-emitted.
    cvt: void 0,
    fpgm: void 0,
    prep: void 0,
    gasp: void 0
  });
}
function Nu(t) {
  if (!Array.isArray(t) || t.length === 0) return [];
  const e = t.length;
  let n;
  const o = t.findIndex((l) => l.onCurve);
  if (o === -1) {
    const l = t[e - 1], h = t[0];
    n = [
      { x: (l.x + h.x) / 2, y: (l.y + h.y) / 2, onCurve: !0 },
      ...t
    ];
  } else {
    n = [];
    for (let l = 0; l < e; l++) n.push(t[(o + l) % e]);
  }
  const s = [];
  for (let l = 0; l < n.length; l++) {
    const h = n[l];
    s.push(h);
    const p = n[(l + 1) % n.length];
    !h.onCurve && !p.onCurve && s.push({
      x: (h.x + p.x) / 2,
      y: (h.y + p.y) / 2,
      onCurve: !0
    });
  }
  const r = s[0], i = [{ type: "M", x: j(r.x), y: j(r.y) }];
  let a = r.x, c = r.y;
  const f = s.length;
  let u = 1;
  for (; u < f; ) {
    const l = s[u];
    if (l.onCurve)
      i.push({ type: "L", x: j(l.x), y: j(l.y) }), a = l.x, c = l.y, u++;
    else {
      const h = s[(u + 1) % f];
      i.push(Gu(a, c, l.x, l.y, h.x, h.y)), a = h.x, c = h.y, u += 2;
    }
  }
  return i;
}
function Gu(t, e, n, o, s, r) {
  const i = t + 0.6666666666666666 * (n - t), a = e + 2 / 3 * (o - e), c = s + 2 / 3 * (n - s), f = r + 2 / 3 * (o - r);
  return {
    type: "C",
    x1: j(i),
    y1: j(a),
    x2: j(c),
    y2: j(f),
    x: j(s),
    y: j(r)
  };
}
function j(t) {
  return Math.round(t);
}
function Pu(t) {
  let e = 1 / 0;
  for (const n of t)
    for (const o of n)
      o.x < e && (e = o.x);
  return e === 1 / 0 ? 0 : e;
}
function to(t) {
  return Array.isArray(t) && t.length > 0 && Array.isArray(t[0]) && t[0].length > 0 && typeof t[0][0]?.type == "string";
}
function wa(t, e) {
  const n = {};
  if (!t) return n;
  const o = new Set(e);
  for (const [s, r] of Object.entries(t))
    o.has(s) || (n[s] = r);
  return n;
}
function ba(t, e) {
  return t ? { ...t, sfVersion: e } : { sfVersion: e };
}
function Aa(t, e) {
  const n = { ...t, ...e };
  for (const o of Object.keys(e))
    e[o] === void 0 && delete n[o];
  return n;
}
function Ca(t, e) {
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
function sr(t) {
  return t < 1240 ? 107 : t < 33900 ? 1131 : 32768;
}
function eo(t, e = [], n = []) {
  const o = [], s = [];
  let r = null, i = 0, a = 0, c = null, f = !1, u = !0;
  const l = sr(e.length), h = sr(n.length);
  function p(_, S) {
    r && r.length > 0 && s.push(r), i += _, a += S, r = [{ type: "M", x: i, y: a }];
  }
  function g(_, S) {
    i += _, a += S, r && r.push({ type: "L", x: i, y: a });
  }
  function d(_, S, b, A, k, O) {
    const I = i + _, T = a + S, E = I + b, D = T + A;
    i = E + k, a = D + O, r && r.push({ type: "C", x1: I, y1: T, x2: E, y2: D, x: i, y: a });
  }
  function x() {
    u && (o.length % 2 !== 0 && (c = o.shift()), u = !1, f = !0);
  }
  function m(_) {
    switch (_) {
      case 1:
      // hstem
      case 3:
      // vstem
      case 18:
      // hstemhm
      case 23:
        f || (o.length % 2 !== 0 && (c = o.shift()), f = !0, u = !1), o.length = 0;
        break;
      case 4:
        u && (o.length > 1 && (c = o.shift()), u = !1, f = !0), p(0, o.pop()), o.length = 0;
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
        !f && o.length > 0 && (c = o.shift(), f = !0, u = !1), r && r.length > 0 && (s.push(r), r = null), o.length = 0;
        break;
      case 19:
      // hintmask
      case 20:
        f || (o.length % 2 !== 0 && (c = o.shift()), f = !0, u = !1), o.length = 0;
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
        u && (o.length > 1 && (c = o.shift()), u = !1, f = !0), p(o.pop(), 0), o.length = 0;
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
        const S = o.pop() + l;
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
  function y(_) {
    switch (_) {
      case 34:
        {
          const S = o[0], b = 0, A = o[1], k = o[2], O = o[3], I = 0, T = o[4], E = 0, D = o[5], R = -k, M = o[6], L = 0;
          d(S, b, A, k, O, I), d(T, E, D, R, M, L);
        }
        o.length = 0;
        break;
      case 35:
        d(o[0], o[1], o[2], o[3], o[4], o[5]), d(o[6], o[7], o[8], o[9], o[10], o[11]), o.length = 0;
        break;
      case 36:
        {
          const S = o[0], b = o[1], A = o[2], k = o[3], O = o[4], I = 0, T = o[5], E = 0, D = o[6], R = o[7], M = o[8], L = -(b + k + R);
          d(S, b, A, k, O, I), d(T, E, D, R, M, L);
        }
        o.length = 0;
        break;
      case 37:
        {
          const S = o[0], b = o[1], A = o[2], k = o[3], O = o[4], I = o[5], T = o[6], E = o[7], D = o[8], R = o[9], M = o[10], L = S + A + O + T + D, W = b + k + I + E + R;
          let P, Z;
          Math.abs(L) > Math.abs(W) ? (P = M, Z = -W) : (P = -L, Z = M), d(S, b, A, k, O, I), d(T, E, D, R, P, Z);
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
      const k = _[A], O = Ca(_, A);
      if (O !== null) {
        o.push(O.value), A += O.bytesConsumed;
        continue;
      }
      if (k === 12) {
        A++;
        const I = _[A];
        A++, y(I);
      } else if (k === 19 || k === 20) {
        f || (o.length % 2 !== 0 && (c = o.shift()), f = !0, u = !1), b += o.length >> 1, o.length = 0, A++;
        const I = Math.ceil(b / 8);
        A += I;
      } else if (k === 1 || k === 3 || k === 18 || k === 23)
        f || (o.length % 2 !== 0 && (c = o.shift()), f = !0, u = !1), b += o.length >> 1, o.length = 0, A++;
      else if (k === 10) {
        A++;
        const I = o.pop() + h;
        n[I] && (b = w(n[I], b));
      } else if (k === 29) {
        A++;
        const I = o.pop() + l;
        e[I] && (b = w(e[I], b));
      } else {
        if (k === 11)
          return b;
        A++, m(k);
      }
    }
    return b;
  }
  return w(t, 0), r && r.length > 0 && s.push(r), { contours: s, width: c };
}
const rr = {
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
}, Uu = {
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
function va(t) {
  const e = [], n = [];
  let o = 0, s = 0;
  for (; s < t.length; ) {
    const r = t[s], i = Ca(t, s);
    if (i !== null) {
      n.push(i.value), s += i.bytesConsumed;
      continue;
    }
    if (r === 12) {
      s++;
      const a = t[s];
      s++;
      const c = Uu[a] || `op12.${a}`;
      e.push(n.length ? `${n.join(" ")} ${c}` : c), n.length = 0;
    } else if (r === 19 || r === 20) {
      const a = r === 19 ? "hintmask" : "cntrmask";
      o += n.length >> 1, s++;
      const c = Math.ceil(o / 8), f = [];
      for (let l = 0; l < c && s < t.length; l++, s++)
        f.push(t[s].toString(2).padStart(8, "0"));
      const u = n.length ? `${n.join(" ")} ` : "";
      e.push(`${u}${a} ${f.join("")}`), n.length = 0;
    } else if (r === 1 || r === 3 || r === 18 || r === 23) {
      o += n.length >> 1;
      const a = rr[r];
      e.push(n.length ? `${n.join(" ")} ${a}` : a), n.length = 0, s++;
    } else {
      const a = rr[r] || `op${r}`;
      e.push(n.length ? `${n.join(" ")} ${a}` : a), n.length = 0, s++;
    }
  }
  return n.length && e.push(n.join(" ")), e.join(`
`);
}
const zu = /* @__PURE__ */ new Set([
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
function Ds(t) {
  const { header: e, tables: n } = t, o = ju(n), s = Ju(n), r = { font: o, glyphs: s }, { pairs: i, classes: a } = Qu(
    n,
    s
  );
  i.length > 0 && (r.kerning = i), a && (r.kerningClasses = a), n.fvar && (r.axes = cl(n), r.instances = fl(n));
  const c = ll(n);
  c && (r.axisMapping = c);
  const f = hl(n);
  f && (r.axisStyles = f);
  const u = gl(n);
  if (u && (r.metricVariations = u), n.GSUB && !n.GSUB._raw) {
    const { substitutions: g, rawLookups: d } = pl(
      n.GSUB,
      s
    );
    r.substitutionMetadata = Hu(n.GSUB), g.length > 0 && (r.substitutions = g), d.length > 0 && (r._rawGSUBLookups = d);
  }
  const l = {};
  n.GPOS && !n.GPOS._raw && (l.GPOS = n.GPOS), n.GDEF && !n.GDEF._raw && (l.GDEF = n.GDEF), Object.keys(l).length > 0 && (r.features = l), n.gasp && !n.gasp._raw && n.gasp.gaspRanges && (r.gasp = n.gasp.gaspRanges.map((g) => ({
    maxPPEM: g.rangeMaxPPEM,
    behavior: g.rangeGaspBehavior
  }))), n["cvt "] && !n["cvt "]._raw && n["cvt "].values && (r.cvt = n["cvt "].values), n.fpgm && !n.fpgm._raw && n.fpgm.instructions && (r.fpgm = n.fpgm.instructions), n.prep && !n.prep._raw && n.prep.instructions && (r.prep = n.prep.instructions);
  const h = Il(n);
  h && (r.palettes = h);
  const p = kl(n, s);
  return p && p.length > 0 && (r.colorGlyphs = p), r.tables = { ...n }, r._header = e, r;
}
function Hu(t) {
  const e = t.featureList?.featureRecords || [], n = [];
  for (const s of t.scriptList?.scriptRecords || []) {
    const r = (i, a) => {
      const c = i?.requiredFeatureIndex;
      if (c === void 0 || c === 65535) return;
      const f = e[c]?.featureTag;
      f && n.push({
        script: s.scriptTag,
        language: a,
        feature: f
      });
    };
    r(s.script.defaultLangSys, null);
    for (const i of s.script.langSysRecords || [])
      r(i.langSys, i.langSysTag);
  }
  const o = {
    majorVersion: t.majorVersion,
    minorVersion: t.minorVersion,
    featureOrder: e.map((s) => s.featureTag),
    requiredFeatures: n
  };
  return t.featureVariations && (o.featureVariations = structuredClone(t.featureVariations)), o;
}
const Wu = {
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
function be(t, e) {
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
function ju(t) {
  const e = t.name, n = t.head, o = t.hhea, s = t["OS/2"], r = t.post, i = {};
  for (const [a, c] of Object.entries(Wu)) {
    const f = be(e, Number(a));
    f !== void 0 && f.trim() !== "" && (i[c] = f);
  }
  return n && !n._raw && (i.unitsPerEm = n.unitsPerEm, i.created = ir(n.created), i.modified = ir(n.modified), n.macStyle !== void 0 && (i.macStyle = n.macStyle)), o && !o._raw && (i.ascender = o.ascender, i.descender = o.descender, i.lineGap = o.lineGap), r && !r._raw && (i.italicAngle = r.italicAngle, i.underlinePosition = r.underlinePosition, i.underlineThickness = r.underlineThickness, i.isFixedPitch = r.isFixedPitch !== 0), s && !s._raw && (i.weightClass = s.usWeightClass, i.widthClass = s.usWidthClass, i.fsType = s.fsType, i.fsSelection = s.fsSelection, i.achVendID = s.achVendID, s.panose && (i.panose = s.panose)), i;
}
const qu = [
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
function Yu(t, e) {
  return t === 0 ? !0 : t === 3 ? e === 0 || e === 1 || e === 10 : !1;
}
function Me(t, e) {
  return !e || t < 128 ? t : t <= 255 ? qu[t - 128] : t;
}
function Zu(t, e, n) {
  switch (e.format) {
    case 0:
      for (let o = 0; o < e.glyphIdArray.length; o++) {
        const s = e.glyphIdArray[o];
        s !== 0 && Le(t, s, Me(o, n));
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
          r !== void 0 && r !== 0 && Le(t, r, Me(s, n));
        }
      break;
    case 6:
      for (let o = 0; o < e.glyphIdArray.length; o++) {
        const s = e.glyphIdArray[o];
        s !== 0 && Le(
          t,
          s,
          Me(e.firstCode + o, n)
        );
      }
      break;
    case 12:
      for (const o of e.groups)
        for (let s = o.startCharCode; s <= o.endCharCode; s++) {
          const r = o.startGlyphID + (s - o.startCharCode);
          r !== 0 && Le(t, r, Me(s, n));
        }
      break;
    case 13:
      for (const o of e.groups)
        for (let s = o.startCharCode; s <= o.endCharCode; s++)
          o.glyphID !== 0 && Le(
            t,
            o.glyphID,
            Me(s, n)
          );
      break;
  }
}
function Xu(t) {
  const e = /* @__PURE__ */ new Map();
  if (!t || t._raw || !t.subtables) return e;
  const n = t.subtables, o = t.encodingRecords;
  let s;
  if (Array.isArray(o) && o.length > 0) {
    const r = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Set();
    for (const a of o)
      Yu(a.platformID, a.encodingID) ? r.add(a.subtableIndex) : a.platformID === 1 && a.encodingID === 0 && i.add(a.subtableIndex);
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
    a && Zu(e, a, i);
  }
  return e;
}
function Le(t, e, n) {
  t.has(e) || t.set(e, []);
  const o = t.get(e);
  o.includes(n) || o.push(n);
}
function Ku(t, e) {
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
function Ju(t) {
  const e = t.glyf && !t.glyf._raw, n = t["CFF "] && !t["CFF "]._raw, o = t.hmtx && !t.hmtx._raw ? t.hmtx : null, s = t.vmtx && !t.vmtx._raw ? t.vmtx : null, r = t.hhea && !t.hhea._raw ? t.hhea : null, i = t.vhea && !t.vhea._raw ? t.vhea : null;
  let a = 0;
  t.maxp && !t.maxp._raw ? a = t.maxp.numGlyphs : e ? a = t.glyf.glyphs.length : n ? a = t["CFF "].fonts[0].charStrings.length : o && (a = o.hMetrics.length + (o.leftSideBearings?.length || 0));
  const c = r ? r.numberOfHMetrics : a, f = i ? i.numOfLongVerMetrics : 0, u = Xu(t.cmap), l = Ku(t, a), h = [];
  for (let p = 0; p < a; p++) {
    const g = {};
    l[p] && (g.name = l[p]);
    const d = u.get(p) || [];
    if (d.length === 1 ? g.unicode = d[0] : d.length > 1 ? (g.unicode = d[0], g.unicodes = d) : g.unicode = null, o && (p < c ? (g.advanceWidth = o.hMetrics[p].advanceWidth, g.leftSideBearing = o.hMetrics[p].lsb) : (g.advanceWidth = o.hMetrics[c - 1].advanceWidth, g.leftSideBearing = o.leftSideBearings[p - c])), s && (p < f ? (g.advanceHeight = s.vMetrics[p].advanceHeight, g.topSideBearing = s.vMetrics[p].topSideBearing) : s.topSideBearings && (g.advanceHeight = s.vMetrics[f - 1].advanceHeight, g.topSideBearing = s.topSideBearings[p - f])), e) {
      const x = t.glyf.glyphs[p];
      x && x.type === "simple" ? (g.contours = x.contours, x.instructions && x.instructions.length > 0 && (g.instructions = x.instructions)) : x && x.type === "composite" && (g.components = x.components, x.instructions && x.instructions.length > 0 && (g.instructions = x.instructions));
    }
    if (n) {
      const x = t["CFF "], m = x.fonts[0], y = m.charStrings;
      if (y[p]) {
        g.charString = y[p], g.charStringDisassembly = va(y[p]);
        const w = x.globalSubrs || [], _ = m.localSubrs || [], S = eo(
          y[p],
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
function Qu(t, e) {
  const n = tl(t, e), o = ol(t, e), s = /* @__PURE__ */ new Map();
  for (const a of n.pairs)
    s.set(`${a.left}\0${a.right}`, a);
  for (const a of o.pairs) {
    const c = `${a.left}\0${a.right}`;
    s.has(c) || s.set(c, a);
  }
  const r = Array.from(s.values()), i = (n.classes && n.classes.length ? n.classes : null) || (o.classes && o.classes.length ? o.classes : null) || null;
  return { pairs: r, classes: i };
}
function Rs(t) {
  const { leftMembers: e, rightMembers: n, leftCount: o, rightCount: s, valueAt: r } = t, i = { leftClasses: {}, rightClasses: {}, pairs: [] }, a = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), f = (u, l, h, p, g) => {
    const d = h.get(u);
    if (d !== void 0) return d;
    let x;
    if (l.length === 1)
      x = l[0];
    else {
      const m = `${g}${u}`;
      p[m] = l, x = `@${m}`;
    }
    return h.set(u, x), x;
  };
  for (let u = 0; u < o; u++) {
    const l = e.get(u);
    if (!(!l || l.length === 0))
      for (let h = 0; h < s; h++) {
        const p = r(u, h);
        if (!p) continue;
        const g = n.get(h);
        if (!g || g.length === 0) continue;
        const d = f(
          u,
          l,
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
function tl(t, e) {
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
          el(f, e, r);
        else if (f.format === 2) {
          const u = nl(f, e);
          u && i.push(u);
        }
    }
  }
  return { pairs: r, classes: i.length ? i : null };
}
function el(t, e, n) {
  const o = K(t.coverage);
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
function nl(t, e) {
  const n = jo(t.classDef1, e.length), o = jo(t.classDef2, e.length), s = new Set(K(t.coverage)), r = /* @__PURE__ */ new Map();
  for (const a of s) {
    const c = n.get(a) ?? 0;
    r.has(c) || r.set(c, []), r.get(c).push(e[a]?.name || `glyph${a}`);
  }
  const i = /* @__PURE__ */ new Map();
  for (let a = 0; a < e.length; a++) {
    const c = o.get(a) ?? 0;
    i.has(c) || i.set(c, []), i.get(c).push(e[a]?.name || `glyph${a}`);
  }
  return Rs({
    leftMembers: r,
    rightMembers: i,
    leftCount: t.class1Count,
    rightCount: t.class2Count,
    valueAt: (a, c) => t.class1Records[a]?.[c]?.value1?.xAdvance || 0
  });
}
function K(t) {
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
function jo(t, e) {
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
function ol(t, e) {
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
        const i = sl(r, e);
        i && s.push(i);
      } else if (r.format === 3 && r.kernValues) {
        const i = rl(r, e);
        i && s.push(i);
      } else r.format === 1 && r.states && il(r, e, o);
  return { pairs: o, classes: s.length ? s : null };
}
function sl(t, e) {
  const {
    leftClassTable: n,
    rightClassTable: o,
    rowWidth: s,
    kerningArrayOffset: r,
    values: i
  } = t;
  if (!i) return null;
  const a = s > 0 ? s / 2 : 0, c = /* @__PURE__ */ new Map();
  for (let u = 0; u < n.nGlyphs; u++) {
    const l = n.firstGlyph + u, h = n.offsets[u] || 0, p = s > 0 ? Math.floor((h - r) / s) : 0;
    p >= 0 && p < i.length && (c.has(p) || c.set(p, []), c.get(p).push(e[l]?.name || `glyph${l}`));
  }
  const f = /* @__PURE__ */ new Map();
  for (let u = 0; u < o.nGlyphs; u++) {
    const l = o.firstGlyph + u, h = o.offsets[u] || 0, p = Math.floor(h / 2);
    p >= 0 && p < a && (f.has(p) || f.set(p, []), f.get(p).push(e[l]?.name || `glyph${l}`));
  }
  return Rs({
    leftMembers: c,
    rightMembers: f,
    leftCount: i.length,
    rightCount: a,
    valueAt: (u, l) => i[u]?.[l] || 0
  });
}
function rl(t, e) {
  const {
    glyphCount: n,
    leftClassCount: o,
    rightClassCount: s,
    kernValues: r,
    leftClasses: i,
    rightClasses: a,
    kernIndices: c
  } = t, f = Math.min(n, e.length), u = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Map();
  for (let h = 0; h < f; h++) {
    const p = i[h];
    p < o && (u.has(p) || u.set(p, []), u.get(p).push(e[h]?.name || `glyph${h}`));
    const g = a[h];
    g < s && (l.has(g) || l.set(g, []), l.get(g).push(e[h]?.name || `glyph${h}`));
  }
  return Rs({
    leftMembers: u,
    rightMembers: l,
    leftCount: o,
    rightCount: s,
    valueAt: (h, p) => {
      const g = c[h * s + p];
      return g === void 0 || g >= r.length ? 0 : r[g] || 0;
    }
  });
}
function il(t, e, n) {
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
  for (let l = 0; l < s.nGlyphs; l++) {
    const h = s.firstGlyph + l, p = s.classArray[l];
    p >= 4 && f.set(h, p);
  }
  const u = Array.from(f.keys());
  if (u.length !== 0)
    for (const l of u)
      for (const h of u) {
        const p = al(
          l,
          h,
          f,
          r,
          i,
          a,
          o,
          c
        );
        if (p !== 0) {
          const g = e[l]?.name || `glyph${l}`, d = e[h]?.name || `glyph${h}`;
          n.push({ left: g, right: d, value: p });
        }
      }
}
function al(t, e, n, o, s, r, i, a) {
  let c = 0, f = 0;
  const u = [], l = [t, e];
  for (const h of l) {
    const p = n.get(h) ?? 1;
    if (p >= i || c >= o.length) break;
    const g = o[c][p];
    if (g === void 0 || g >= s.length) break;
    const d = s[g], x = (d.flags & 32768) !== 0, m = d.flags & 16383;
    if (x && u.push(h), m > 0 && u.length > 0) {
      const w = Math.floor((m - (r._offset || 0)) / 2);
      for (let _ = 0; _ < u.length; _++) {
        const S = w + _;
        if (S >= 0 && S < r.length) {
          const b = r[S], A = (b & 1) !== 0;
          if (f += A ? b & -2 : b, A) break;
        }
      }
      u.length = 0;
    }
    const y = d.newStateOffset;
    c = i > 0 ? Math.floor((y - a) / i) : 0, (c < 0 || c >= o.length) && (c = 0);
  }
  return f;
}
function cl(t) {
  const e = t.fvar;
  return !e || e._raw || !e.axes ? [] : e.axes.map((n) => ({
    tag: n.axisTag,
    name: be(t.name, n.axisNameID) || n.axisTag,
    min: n.minValue,
    default: n.defaultValue,
    max: n.maxValue,
    hidden: (n.flags & 1) !== 0
  }));
}
function fl(t) {
  const e = t.fvar;
  if (!e || e._raw || !e.instances) return [];
  const n = e.axes;
  return e.instances.map((o) => {
    const s = {};
    for (let i = 0; i < n.length; i++)
      s[n[i].axisTag] = o.coordinates[i];
    const r = {
      name: be(t.name, o.subfamilyNameID) || `Instance ${o.subfamilyNameID}`,
      coordinates: s
    };
    if (o.postScriptNameID !== void 0) {
      const i = be(t.name, o.postScriptNameID);
      i && (r.postScriptName = i);
    }
    return r;
  });
}
const Ia = {
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
}, ul = Object.fromEntries(
  Object.entries(Ia).map(([t, e]) => [e, t])
);
function ll(t) {
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
function hl(t) {
  const e = t.STAT, n = t.fvar;
  if (!e || e._raw) return null;
  const o = e.designAxes || [], s = n?.axes || [], r = {};
  return e.elidedFallbackNameID !== void 0 && (r.elidedFallbackName = be(t.name, e.elidedFallbackNameID) || "Regular"), e.axisValues && e.axisValues.length > 0 && (r.values = e.axisValues.map((i) => {
    const a = (u) => u < o.length ? o[u].axisTag : u < s.length ? s[u].axisTag : `axis${u}`, f = { name: be(t.name, i.valueNameID) || "", flags: i.flags };
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
        const u = {};
        for (const l of i.axisValues)
          u[a(l.axisIndex)] = l.value;
        return { ...f, values: u };
      }
      default:
        return { ...f, _raw: i };
    }
  })), r;
}
function gl(t) {
  const e = t.MVAR, n = t.fvar;
  if (!e || e._raw || !e.itemVariationStore || !n || n._raw || !n.axes) return null;
  const o = e.itemVariationStore, s = o.variationRegionList, r = n.axes, i = s.regions.map((c) => {
    const f = {};
    for (let u = 0; u < c.regionAxes.length && u < r.length; u++) {
      const l = c.regionAxes[u];
      l.startCoord === 0 && l.peakCoord === 0 && l.endCoord === 0 || (f[r[u].axisTag] = [l.startCoord, l.peakCoord, l.endCoord]);
    }
    return { axes: f };
  }), a = {};
  for (const c of e.valueRecords) {
    const f = Ia[c.valueTag] || c.valueTag, u = c.deltaSetOuterIndex, l = c.deltaSetInnerIndex, h = o.itemVariationData[u];
    if (!h || l >= h.deltaSets.length) continue;
    const p = h.deltaSets[l], g = [];
    for (let d = 0; d < h.regionIndexes.length; d++) {
      const x = p[d];
      x !== 0 && g.push({ region: h.regionIndexes[d], delta: x });
    }
    g.length > 0 && (a[f] = g);
  }
  return Object.keys(a).length === 0 ? null : { regions: i, metrics: a };
}
const ka = Date.UTC(1904, 0, 1, 0, 0, 0);
function ir(t) {
  if (t == null) return;
  const e = typeof t == "bigint" ? t : BigInt(t);
  if (e === 0n) return;
  const n = Number(e) * 1e3 + ka;
  if (!(!Number.isFinite(n) || n < -864e13 || n > 864e13))
    return new Date(n).toISOString();
}
function ar(t) {
  if (!t) return 0n;
  const e = Date.parse(t);
  return isNaN(e) ? 0n : BigInt(Math.floor((e - ka) / 1e3));
}
const Oa = /* @__PURE__ */ new Set([1, 2, 3, 4, 8]);
function pl(t, e) {
  const n = [], o = [];
  if (!t.featureList || !t.lookupList)
    return { substitutions: n, rawLookups: o };
  const s = Sl(t), r = t.lookupList.lookups, i = /* @__PURE__ */ new Set(), a = xl(r);
  for (let c = 0; c < r.length; c++) {
    const f = r[c];
    if (!f) continue;
    const u = s.lookupToFeatures.get(c) || [], l = _l(u), h = l.length ? l : [
      {
        featureTag: "DFLT",
        script: "DFLT",
        language: null,
        allScripts: void 0
      }
    ];
    if (f.lookupType === 5 || f.lookupType === 6) {
      let p = !0;
      const g = [], d = /* @__PURE__ */ new Set();
      for (const x of h) {
        const m = dl(
          f,
          c,
          r,
          e,
          x
        );
        if (!m) {
          p = !1;
          break;
        }
        g.push(...m.rules);
        for (const y of m.usedHelpers) d.add(y);
      }
      if (p) {
        n.push(...g), i.add(c);
        for (const x of d) i.add(x);
      }
      continue;
    }
    if (Oa.has(f.lookupType) && (!a.has(c) || u.length > 0)) {
      for (const p of l) {
        const g = Yo(
          f,
          e,
          p.featureTag,
          p.script,
          p.language,
          p.allScripts,
          c
        );
        n.push(...g);
      }
      if (l.length === 0) {
        const p = Yo(
          f,
          e,
          "DFLT",
          "DFLT",
          null,
          void 0,
          c
        );
        n.push(...p);
      }
      i.add(c);
    }
  }
  for (let c = 0; c < r.length; c++)
    !i.has(c) && r[c] && o.push({
      index: c,
      lookup: r[c],
      features: s.lookupToFeatures.get(c) || []
    });
  return { substitutions: n, rawLookups: o };
}
function dl(t, e, n, o, s) {
  const r = [], i = /* @__PURE__ */ new Set();
  for (const a of t.subtables || []) {
    const c = yl(a, t.lookupType, o);
    if (!c) return null;
    for (const f of c) {
      const u = [];
      for (const h of f.records) {
        const p = n[h.lookupListIndex];
        if (!p || !Oa.has(p.lookupType))
          return null;
        const g = Yo(
          p,
          o,
          s.featureTag,
          s.script,
          s.language,
          void 0,
          h.lookupListIndex
        ).map(ml);
        if (g.length === 0) return null;
        u.push({
          at: h.sequenceIndex,
          lookup: qo(p, h.lookupListIndex),
          substitutions: g
        }), i.add(h.lookupListIndex);
      }
      const l = {
        type: "contextual",
        feature: s.featureTag,
        script: s.script,
        language: s.language,
        backtrack: f.backtrack,
        input: f.input,
        lookahead: f.lookahead,
        actions: u,
        lookup: qo(t, e)
      };
      s.allScripts && (l.allScripts = s.allScripts), r.push(l);
    }
  }
  return { rules: r, usedHelpers: i };
}
function qo(t, e) {
  const n = { id: e, flags: t.lookupFlag || 0 };
  return t.markFilteringSet !== void 0 && (n.markFilteringSet = t.markFilteringSet), t.useExtension && (n.useExtension = !0), n;
}
function ml(t) {
  const { feature: e, script: n, language: o, allScripts: s, lookup: r, ...i } = t;
  return i;
}
function yl(t, e, n) {
  const o = { backtrack: [], lookahead: [] };
  if (e === 5 && t.format === 1) {
    const s = K(t.coverage), r = [];
    for (let i = 0; i < (t.seqRuleSets || []).length; i++)
      for (const a of t.seqRuleSets[i] || [])
        r.push({
          ...o,
          input: [
            [z(n, s[i])],
            ...a.inputSequence.map((c) => [z(n, c)])
          ],
          records: a.seqLookupRecords || []
        });
    return r;
  }
  if (e === 5 && t.format === 2) {
    const s = dn(t.classDef, n), r = new Set(K(t.coverage)), i = [];
    for (let a = 0; a < (t.classSeqRuleSets || []).length; a++)
      for (const c of t.classSeqRuleSets[a] || [])
        i.push({
          ...o,
          input: [
            (s.get(a) || []).filter(
              (f) => r.has(cr(n, f))
            ),
            ...c.inputSequence.map(
              (f) => s.get(f) || []
            )
          ],
          records: c.seqLookupRecords || []
        });
    return i;
  }
  if (e === 5 && t.format === 3)
    return [
      {
        ...o,
        input: t.coverages.map(
          (s) => K(s).map((r) => z(n, r))
        ),
        records: t.seqLookupRecords || []
      }
    ];
  if (e === 6 && t.format === 1) {
    const s = K(t.coverage), r = [];
    for (let i = 0; i < (t.chainedSeqRuleSets || []).length; i++)
      for (const a of t.chainedSeqRuleSets[i] || [])
        r.push({
          backtrack: a.backtrackSequence.map((c) => [z(n, c)]),
          input: [
            [z(n, s[i])],
            ...a.inputSequence.map((c) => [z(n, c)])
          ],
          lookahead: a.lookaheadSequence.map((c) => [z(n, c)]),
          records: a.seqLookupRecords || []
        });
    return r;
  }
  if (e === 6 && t.format === 2) {
    const s = dn(t.backtrackClassDef, n), r = dn(t.inputClassDef, n), i = dn(t.lookaheadClassDef, n), a = new Set(K(t.coverage)), c = [];
    for (let f = 0; f < (t.chainedClassSeqRuleSets || []).length; f++)
      for (const u of t.chainedClassSeqRuleSets[f] || [])
        c.push({
          backtrack: u.backtrackSequence.map((l) => s.get(l) || []),
          input: [
            (r.get(f) || []).filter(
              (l) => a.has(cr(n, l))
            ),
            ...u.inputSequence.map((l) => r.get(l) || [])
          ],
          lookahead: u.lookaheadSequence.map((l) => i.get(l) || []),
          records: u.seqLookupRecords || []
        });
    return c;
  }
  return e === 6 && t.format === 3 ? [
    {
      backtrack: t.backtrackCoverages.map(
        (s) => K(s).map((r) => z(n, r))
      ),
      input: t.inputCoverages.map(
        (s) => K(s).map((r) => z(n, r))
      ),
      lookahead: t.lookaheadCoverages.map(
        (s) => K(s).map((r) => z(n, r))
      ),
      records: t.seqLookupRecords || []
    }
  ] : null;
}
function dn(t, e) {
  const n = jo(t, e.length), o = /* @__PURE__ */ new Map();
  for (let s = 0; s < e.length; s++) {
    const r = n.get(s) ?? 0;
    o.has(r) || o.set(r, []), o.get(r).push(z(e, s));
  }
  return o;
}
function cr(t, e) {
  return t.findIndex((n) => n.name === e);
}
function xl(t) {
  const e = /* @__PURE__ */ new Set(), n = (o) => {
    for (const s of o || []) e.add(s.lookupListIndex);
  };
  for (const o of t)
    if (!(o?.lookupType !== 5 && o?.lookupType !== 6))
      for (const s of o.subtables || []) {
        n(s.seqLookupRecords);
        for (const r of [
          "seqRuleSets",
          "classSeqRuleSets",
          "chainedSeqRuleSets",
          "chainedClassSeqRuleSets"
        ])
          for (const i of s[r] || [])
            for (const a of i || []) n(a.seqLookupRecords);
      }
  return e;
}
function Sl(t) {
  const e = /* @__PURE__ */ new Map(), n = t.scriptList?.scriptRecords || [], o = t.featureList?.featureRecords || [];
  for (const s of n) {
    const r = s.scriptTag, i = s.script;
    i.defaultLangSys && fr(
      i.defaultLangSys,
      r,
      null,
      o,
      e
    );
    for (const a of i.langSysRecords || [])
      fr(
        a.langSys,
        r,
        a.langSysTag,
        o,
        e
      );
  }
  return { lookupToFeatures: e };
}
function _l(t) {
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
function fr(t, e, n, o, s) {
  for (const r of t.featureIndices || []) {
    const i = o[r];
    if (i)
      for (const a of i.feature.lookupListIndices || []) {
        s.has(a) || s.set(a, []);
        const c = s.get(a);
        c.some(
          (u) => u.featureTag === i.featureTag && u.script === e && u.language === n
        ) || c.push({
          featureTag: i.featureTag,
          script: e,
          language: n
        });
      }
  }
}
function Yo(t, e, n, o, s, r, i) {
  const a = [], c = {
    feature: n,
    script: o,
    language: s,
    lookup: qo(t, i)
  };
  r && (c.allScripts = r);
  for (const f of t.subtables || [])
    switch (t.lookupType) {
      case 1:
        wl(f, e, c, a);
        break;
      case 2:
        bl(f, e, c, a);
        break;
      case 3:
        Al(f, e, c, a);
        break;
      case 4:
        Cl(f, e, c, a);
        break;
      case 8:
        vl(f, e, c, a);
        break;
    }
  return a;
}
function z(t, e) {
  return t[e]?.name || `glyph${e}`;
}
function wl(t, e, n, o) {
  const s = K(t.coverage);
  if (t.format === 1)
    for (const r of s) {
      const i = r + t.deltaGlyphID & 65535;
      o.push({
        type: "single",
        ...n,
        from: z(e, r),
        to: z(e, i)
      });
    }
  else if (t.format === 2)
    for (let r = 0; r < s.length; r++)
      o.push({
        type: "single",
        ...n,
        from: z(e, s[r]),
        to: z(e, t.substituteGlyphIDs[r])
      });
}
function bl(t, e, n, o) {
  const s = K(t.coverage);
  for (let r = 0; r < s.length; r++)
    o.push({
      type: "multiple",
      ...n,
      from: z(e, s[r]),
      to: (t.sequences[r] || []).map((i) => z(e, i))
    });
}
function Al(t, e, n, o) {
  const s = K(t.coverage);
  for (let r = 0; r < s.length; r++)
    o.push({
      type: "alternate",
      ...n,
      from: z(e, s[r]),
      alternates: (t.alternateSets[r] || []).map(
        (i) => z(e, i)
      )
    });
}
function Cl(t, e, n, o) {
  const s = K(t.coverage);
  for (let r = 0; r < s.length; r++) {
    const i = t.ligatureSets[r] || [];
    for (const a of i) {
      const c = [
        z(e, s[r]),
        ...a.componentGlyphIDs.map((f) => z(e, f))
      ];
      o.push({
        type: "ligature",
        ...n,
        components: c,
        ligature: z(e, a.ligatureGlyph)
      });
    }
  }
}
function vl(t, e, n, o) {
  const s = K(t.coverage);
  for (let r = 0; r < s.length; r++)
    o.push({
      type: "reverse",
      ...n,
      from: z(e, s[r]),
      to: z(e, t.substituteGlyphIDs[r]),
      backtrack: (t.backtrackCoverages || []).map(
        (i) => K(i).map((a) => z(e, a))
      ),
      lookahead: (t.lookaheadCoverages || []).map(
        (i) => K(i).map((a) => z(e, a))
      )
    });
}
function Il(t) {
  const e = t.CPAL;
  return !e || e._raw || !e.palettes ? null : e.palettes.map(
    (n) => n.map((o) => Es(o))
  );
}
function kl(t, e) {
  const n = t.COLR;
  if (!n || n._raw) return null;
  const o = gu(e), s = [];
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
function ur(t) {
  const { font: e, glyphs: n } = t, o = n.some(
    (g) => g.components && g.components.length > 0
  );
  let s = 0, r = 0;
  for (const g of n)
    g.charString ? s++ : g.contours && g.contours.length > 0 && !to(g.contours) && r++;
  const i = !o && s > 0 && s >= r, a = Ol(n, e), c = {};
  if (c.head = Tl(e, a), c.hhea = Dl(e, a, n.length), c.maxp = Rl(n, i), c["OS/2"] = Fl(e, a), c.name = Ml(e), t.tables?.name?.names) {
    const g = !!(t.axes && t.axes.length > 0);
    c.name = Ll(
      c.name,
      t.tables.name,
      g
    );
  }
  c.post = Vl(e, n, i), c.cmap = $l(n), c.hmtx = Pl(n), i ? c["CFF "] = ql(e, n) : (c.glyf = Hl(n), c.loca = { offsets: [] }), n.some((g) => g.advanceHeight !== void 0) && (c.vhea = Ul(n), c.vmtx = zl(n));
  const u = t._options?.kerningFormat || "gpos", l = t.kerning && t.kerning.length > 0, h = Array.isArray(t.kerningClasses) && t.kerningClasses.some(
    (g) => g && Array.isArray(g.pairs) && g.pairs.length > 0
  );
  if (l || h) {
    const g = u === "gpos" || u === "gpos+kern", d = u !== "gpos";
    if (g) {
      const x = t.features?.GPOS, m = x?.scriptList?.scriptRecords && x?.featureList?.featureRecords && x?.lookupList?.lookups;
      let y;
      if (h) {
        const w = nh(
          t.kerningClasses,
          t.kerning || [],
          n
        );
        w.length > 0 ? y = m && oh(x, w) || Zo(w) : m && (y = x);
      } else m ? y = Jl(x, t.kerning, n) : y = Ma(t.kerning, n);
      y && (c.GPOS = y);
    }
    if (d) {
      let x = t.kerning || [];
      h && (x = x.concat(
        Ba(t.kerningClasses, n)
      ));
      const m = Zl(
        x,
        n,
        u
      );
      m && (c.kern = m);
    }
  }
  if (t.axes && t.axes.length > 0 && (c.fvar = sh(t, c.name), t.axisMapping && (c.avar = ah(t)), t.axisStyles ? c.STAT = ih(t, c.name) : t.tables?.STAT || (c.STAT = rh(t, c.name)), t.metricVariations && (c.MVAR = ch(t))), t.gasp && (c.gasp = {
    version: 1,
    gaspRanges: t.gasp.map((g) => ({
      rangeMaxPPEM: g.maxPPEM,
      rangeGaspBehavior: g.behavior
    }))
  }), t.cvt && (c["cvt "] = { values: t.cvt }), t.fpgm && (c.fpgm = { instructions: t.fpgm }), t.prep && (c.prep = { instructions: t.prep }), t.features && (t.features.GPOS && !c.GPOS && (c.GPOS = t.features.GPOS), t.features.GDEF && (c.GDEF = t.features.GDEF)), t.substitutions && t.substitutions.length > 0 ? c.GSUB = uh(
    t.substitutions,
    t._rawGSUBLookups || [],
    n,
    t.substitutionMetadata
  ) : t._rawGSUBLookups && t._rawGSUBLookups.length > 0 && (c.GSUB = lh(
    t._rawGSUBLookups,
    t.substitutionMetadata
  )), t.features?.GSUB && !c.GSUB && (c.GSUB = t.features.GSUB), t.palettes && t.palettes.length > 0 && (c.CPAL = _h(t.palettes)), t.colorGlyphs && t.colorGlyphs.length > 0 && (c.COLR = wh(t.colorGlyphs, n)), t.tables)
    for (const [g, d] of Object.entries(t.tables))
      c[g] || (c[g] = d);
  let p;
  if (t._header)
    p = { ...t._header, numTables: Object.keys(c).length };
  else {
    const g = Object.keys(c).length, d = Math.floor(Math.log2(g)), x = Math.pow(2, d) * 16, m = g * 16 - x;
    p = {
      sfVersion: i ? 1330926671 : 65536,
      numTables: g,
      searchRange: x,
      entrySelector: d,
      rangeShift: m
    };
  }
  return { header: p, tables: c };
}
function Ol(t, e) {
  let n = 1 / 0, o = 1 / 0, s = -1 / 0, r = -1 / 0, i = 0, a = 0, c = 1 / 0, f = 1 / 0, u = -1 / 0, l = 65535, h = 0;
  const p = /* @__PURE__ */ new Set();
  for (const x of t) {
    const m = x.advanceWidth || 0;
    a += m, m > i && (i = m);
    const y = no(x);
    if (y) {
      y.xMin < n && (n = y.xMin), y.yMin < o && (o = y.yMin), y.xMax > s && (s = y.xMax), y.yMax > r && (r = y.yMax);
      const _ = x.leftSideBearing ?? y.xMin, S = m - (_ + (y.xMax - y.xMin)), b = _ + (y.xMax - y.xMin);
      _ < c && (c = _), S < f && (f = S), b > u && (u = b);
    }
    const w = x.unicodes || (x.unicode ? [x.unicode] : []);
    for (const _ of w)
      _ < l && (l = _), _ > h && (h = _), p.add(_);
  }
  n === 1 / 0 && (n = 0), o === 1 / 0 && (o = 0), s === -1 / 0 && (s = 0), r === -1 / 0 && (r = 0), c === 1 / 0 && (c = 0), f === 1 / 0 && (f = 0), u === -1 / 0 && (u = 0), l === 65535 && (l = 0), h === 0 && (h = 0);
  const g = lr(
    t,
    "xyvw",
    e.ascender ? Math.round(e.ascender / 2) : 0
  ), d = lr(
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
    maxExtent: u,
    firstCharIndex: Math.min(l, 65535),
    lastCharIndex: Math.min(h, 65535),
    sxHeight: g,
    sCapHeight: d,
    unicodeRanges: p
  };
}
function no(t) {
  if (t.contours && t.contours.length > 0) {
    let e = 1 / 0, n = 1 / 0, o = -1 / 0, s = -1 / 0, r = !1;
    for (const i of t.contours)
      for (const a of i) {
        const c = [
          [a.x, a.y],
          [a.x1, a.y1],
          [a.x2, a.y2]
        ];
        for (const [f, u] of c)
          typeof f == "number" && typeof u == "number" && (r = !0, f < e && (e = f), u < n && (n = u), f > o && (o = f), u > s && (s = u));
      }
    if (r) return { xMin: e, yMin: n, xMax: o, yMax: s };
  }
  return null;
}
function lr(t, e, n) {
  for (const o of e) {
    const s = o.charCodeAt(0), r = t.find((i) => (i.unicodes || (i.unicode ? [i.unicode] : [])).includes(s));
    if (r) {
      const i = no(r);
      if (i) return i.yMax;
    }
  }
  return n || 0;
}
function El(t) {
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
function Ea(t) {
  const e = t.isBold !== void 0 ? !!t.isBold : (t.weightClass || 400) === 700, n = t.isItalic !== void 0 ? !!t.isItalic : (t.italicAngle || 0) !== 0;
  return { isBold: e, isItalic: n };
}
function Tl(t, e) {
  let n;
  if (t.macStyle !== void 0)
    n = t.macStyle;
  else {
    const { isBold: o, isItalic: s } = Ea(t);
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
    created: ar(t.created),
    modified: ar(t.modified),
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
function Dl(t, e, n) {
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
function Rl(t, e) {
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
      let u = 0;
      for (const l of f.contours)
        u += l.length;
      u > n && (n = u), f.contours.length > o && (o = f.contours.length);
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
function Fl(t, e) {
  let n = t.fsSelection;
  if (n === void 0) {
    const { isBold: r, isItalic: i } = Ea(t);
    n = 0, r && (n |= 32), i && (n |= 1), !r && !i && (n |= 64), n |= 128;
  }
  const o = El(e.unicodeRanges), s = e.unicodeRanges.has(32);
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
function Ml(t) {
  const e = [], n = {
    0: t.copyright || "",
    1: t.familyName || "",
    2: t.styleName || "",
    3: t.uniqueID || Bl(t),
    4: t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim(),
    5: t.version || "Version 1.000",
    6: t.postScriptName || Ta(t),
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
function Ll(t, e, n) {
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
function Bl(t) {
  const e = t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim();
  return t.manufacturer ? `${t.manufacturer}: ${e}` : e;
}
function Ta(t) {
  const e = (s) => (s || "").replace(/[^\x21-\x7e]/g, "").replace(/[[\](){}<>/%]/g, ""), n = e(t.familyName), o = e(t.styleName) || "Regular";
  return `${n}-${o}`.slice(0, 63);
}
function Vl(t, e, n = !1) {
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
function $l(t) {
  const e = /* @__PURE__ */ new Map();
  let n = !1;
  for (let a = 0; a < t.length; a++) {
    const c = t[a], f = c.unicodes || (c.unicode != null ? [c.unicode] : []);
    for (const u of f)
      e.has(u) || e.set(u, a), u > 65535 && (n = !0);
  }
  const o = [...e.entries()].sort((a, c) => a[0] - c[0]), s = [], r = [];
  if (n) {
    const a = Nl(o);
    s.push({ format: 12, language: 0, groups: a }), r.push({ platformID: 3, encodingID: 10, subtableIndex: 0 }), r.push({ platformID: 0, encodingID: 4, subtableIndex: 0 });
  }
  const i = o.filter(([a]) => a <= 65535);
  if (i.length > 0) {
    const { segments: a, glyphIdArray: c } = Gl(i), f = s.length;
    s.push({ format: 4, language: 0, segments: a, glyphIdArray: c }), r.push({ platformID: 3, encodingID: 1, subtableIndex: f }), r.push({ platformID: 0, encodingID: 3, subtableIndex: f });
  }
  return { version: 0, encodingRecords: r, subtables: s };
}
function Nl(t) {
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
function Gl(t) {
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
function Pl(t) {
  return { hMetrics: t.map((n) => ({
    advanceWidth: n.advanceWidth || 0,
    lsb: n.leftSideBearing ?? 0
  })), leftSideBearings: [] };
}
function Ul(t) {
  let e = 0, n = 1 / 0, o = 1 / 0, s = -1 / 0;
  for (const r of t) {
    const i = r.advanceHeight || 0;
    i > e && (e = i);
    const a = no(r);
    if (a) {
      const c = r.topSideBearing ?? 0, f = a.yMax - a.yMin, u = i - (c + f), l = c + f;
      c < n && (n = c), u < o && (o = u), l > s && (s = l);
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
function zl(t) {
  return { vMetrics: t.map((n) => ({
    advanceHeight: n.advanceHeight || 0,
    topSideBearing: n.topSideBearing ?? 0
  })), topSideBearings: [] };
}
function Hl(t) {
  const e = /* @__PURE__ */ new Map();
  for (let o = 0; o < t.length; o++) {
    const s = t[o] && t[o].name;
    s != null && !e.has(s) && e.set(s, o);
  }
  return { glyphs: t.map((o) => {
    if (o.contours && o.contours.length > 0) {
      const s = to(o.contours) ? o.contours.map(_a) : o.contours, r = no({ contours: s });
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
        (r) => Tu(r, e)
      ),
      instructions: o.instructions || []
    } : null;
  }) };
}
function Wl(t) {
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
function Da(t, e, n = {}) {
  if (!Number.isFinite(e)) return t;
  const {
    globalSubrs: o = [],
    localSubrs: s = [],
    nominalWidthX: r = 0,
    defaultWidthX: i = 0
  } = n;
  if (!jl(t)) return t;
  let a = null;
  try {
    a = eo(t, o, s);
  } catch {
    return t;
  }
  if (a.width !== null && a.width !== void 0 || !a.contours || a.contours.length === 0 || e === i) return t;
  const c = Wl(e - r), f = new Array(c.length + t.length);
  for (let u = 0; u < c.length; u++) f[u] = c[u];
  for (let u = 0; u < t.length; u++)
    f[c.length + u] = t[u];
  return f;
}
function jl(t) {
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
function ql(t, e) {
  const n = t.postScriptName || Ta(t), o = e.slice(1).map((p) => p.name || ".notdef"), s = e.map((p) => {
    const g = Number.isFinite(p.advanceWidth) ? p.advanceWidth : void 0;
    return p.charString && p.charString.length > 0 ? Da(p.charString, g) : Xe(p.contours || [], g);
  }), r = [];
  function i(p) {
    const g = 391 + r.length;
    return r.push(p), g;
  }
  const a = t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim(), c = t.familyName || "", f = Yl(t.weightClass), u = o.map((p) => i(p)), l = t.unitsPerEm || 1e3, h = {
    FullName: i(a),
    FamilyName: i(c),
    Weight: i(f),
    FontBBox: [0, t.descender || 0, l, t.ascender || 0]
  };
  if (l !== 1e3) {
    const p = 1 / l;
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
        charset: u,
        encoding: [],
        charStrings: s,
        privateDict: {},
        localSubrs: []
      }
    ]
  };
}
function Yl(t) {
  return !t || t <= 400 ? "Regular" : t <= 500 ? "Medium" : t <= 600 ? "SemiBold" : t <= 700 ? "Bold" : t <= 800 ? "ExtraBold" : "Black";
}
function hr(t, e) {
  const n = /* @__PURE__ */ new Map();
  for (let c = 0; c < e.length; c++)
    e[c].name && n.set(e[c].name, c);
  const o = [];
  for (const c of t) {
    const f = n.get(c.left), u = n.get(c.right);
    f !== void 0 && u !== void 0 && o.push({ left: f, right: u, value: c.value });
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
function Zl(t, e, n) {
  switch (n) {
    case "kern-ot-f0":
    case "gpos+kern":
      return hr(t, e);
    case "kern-ot-f2":
      return Xl(t, e);
    case "kern-apple-f0":
      return Ra(t, e);
    case "kern-apple-f3":
      return Kl(t, e);
    default:
      return hr(t, e);
  }
}
function Xl(t, e) {
  const { pairs: n } = Oe(t, e);
  if (n.length === 0) return null;
  const {
    leftClasses: o,
    rightClasses: s,
    valueMatrix: r,
    leftGlyphToClass: i,
    rightGlyphToClass: a
  } = Fa(n), c = o.length, f = s.length, u = f * 2, l = 8, h = Array.from(i.keys()).sort((O, I) => O - I), p = Array.from(a.keys()).sort(
    (O, I) => O - I
  ), g = h.length > 0 ? h[0] : 0, d = h.length > 0 ? h[h.length - 1] - g + 1 : 0, x = p.length > 0 ? p[0] : 0, m = p.length > 0 ? p[p.length - 1] - x + 1 : 0, y = 4 + d * 2, w = 4 + m * 2, _ = l, S = _ + y, b = S + w, A = [];
  for (let O = 0; O < d; O++) {
    const I = g + O, T = i.get(I) ?? 0;
    A.push(b + T * u);
  }
  const k = [];
  for (let O = 0; O < m; O++) {
    const I = x + O, T = a.get(I) ?? 0;
    k.push(T * 2);
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
        rowWidth: u,
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
          nGlyphs: m,
          offsets: k
        },
        nLeftClasses: c,
        nRightClasses: f,
        values: r
      }
    ]
  };
}
function Ra(t, e) {
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
function Kl(t, e) {
  const { pairs: n } = Oe(t, e);
  if (n.length === 0) return null;
  const {
    leftClasses: o,
    rightClasses: s,
    valueMatrix: r,
    leftGlyphToClass: i,
    rightGlyphToClass: a
  } = Fa(n), c = o.length, f = s.length, u = /* @__PURE__ */ new Set();
  u.add(0);
  for (const m of r)
    for (const y of m)
      u.add(y);
  if (c > 255 || f > 255 || u.size > 255)
    return Ra(t, e);
  const l = Array.from(u).sort((m, y) => m - y), h = /* @__PURE__ */ new Map();
  for (let m = 0; m < l.length; m++)
    h.set(l[m], m);
  const p = e.length, g = new Array(p).fill(0), d = new Array(p).fill(0);
  for (const [m, y] of i)
    m < p && (g[m] = y);
  for (const [m, y] of a)
    m < p && (d[m] = y);
  const x = [];
  for (let m = 0; m < c; m++)
    for (let y = 0; y < f; y++) {
      const w = r[m]?.[y] || 0;
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
        kernValueCount: l.length,
        leftClassCount: c,
        rightClassCount: f,
        flags: 0,
        kernValues: l,
        leftClasses: g,
        rightClasses: d,
        kernIndices: x
      }
    ]
  };
}
function Fa(t) {
  const e = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Set();
  for (const { left: m, right: y, value: w } of t)
    e.has(m) || e.set(m, /* @__PURE__ */ new Map()), e.get(m).set(y, w), n.add(y);
  const o = /* @__PURE__ */ new Map();
  for (const [m, y] of e) {
    const w = Array.from(y.entries()).sort((_, S) => _[0] - S[0]);
    o.set(m, w.map((_) => `${_[0]}:${_[1]}`).join(","));
  }
  const s = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  let i = 1;
  for (const [m, y] of o)
    s.has(y) || s.set(y, i++), r.set(m, s.get(y));
  const a = /* @__PURE__ */ new Map();
  for (const { left: m, right: y, value: w } of t)
    a.has(y) || a.set(y, /* @__PURE__ */ new Map()), a.get(y).set(m, w);
  const c = /* @__PURE__ */ new Map();
  for (const [m, y] of a) {
    const w = Array.from(y.entries()).sort((_, S) => _[0] - S[0]);
    c.set(m, w.map((_) => `${_[0]}:${_[1]}`).join(","));
  }
  const f = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Map();
  let l = 1;
  for (const [m, y] of c)
    f.has(y) || f.set(y, l++), u.set(m, f.get(y));
  const h = i, p = l, g = [];
  for (let m = 0; m < h; m++)
    g.push(new Array(p).fill(0));
  for (const { left: m, right: y, value: w } of t) {
    const _ = r.get(m) ?? 0, S = u.get(y) ?? 0;
    g[_][S] = w;
  }
  const d = Array.from({ length: h }, (m, y) => y), x = Array.from({ length: p }, (m, y) => y);
  return {
    leftClasses: d,
    rightClasses: x,
    valueMatrix: g,
    leftGlyphToClass: r,
    rightGlyphToClass: u
  };
}
function Ma(t, e) {
  const { pairs: n } = Oe(t, e);
  return n.length === 0 ? null : Zo([Fs(n)]);
}
function Zo(t) {
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
function Jl(t, e, n) {
  const { pairs: o } = Oe(e, n), s = JSON.parse(JSON.stringify(t));
  if (!s.scriptList?.scriptRecords || !s.featureList?.featureRecords || !s.lookupList?.lookups)
    return Ma(e, n);
  if (o.length === 0) return s;
  const r = Fs(o), i = /* @__PURE__ */ new Set();
  for (const f of s.featureList.featureRecords)
    if (f.featureTag === "kern")
      for (const u of f.feature.lookupListIndices)
        i.add(u);
  let a;
  if (i.size > 0) {
    const f = [...i].sort((u, l) => u - l);
    a = f[0], s.lookupList.lookups[a] = r;
    for (let u = f.length - 1; u > 0; u--)
      s.lookupList.lookups.splice(f[u], 1);
    if (f.length > 1) {
      const u = f.slice(1);
      La(s, u);
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
    for (const u of s.scriptList.scriptRecords) {
      u.script.defaultLangSys && u.script.defaultLangSys.featureIndices.push(f);
      for (const l of u.script.langSysRecords || [])
        l.langSys.featureIndices.push(f);
    }
  }
  return s;
}
function La(t, e) {
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
function Fs(t) {
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
function gr(t) {
  const e = Array.from(t.entries()).sort(
    (o, s) => o[0] - s[0]
  ), n = [];
  for (const [o, s] of e) {
    const r = n[n.length - 1];
    r && r.class === s && o === r.endGlyphID + 1 ? r.endGlyphID = o : n.push({ startGlyphID: o, endGlyphID: o, class: s });
  }
  return { format: 2, ranges: n };
}
function Ql(t) {
  const e = [];
  for (let n = 0; n < t.length; n++) {
    const o = t[n], s = e[e.length - 1];
    s && o === s.endGlyphID + 1 ? s.endGlyphID = o : e.push({ startGlyphID: o, endGlyphID: o, startCoverageIndex: n });
  }
  return { format: 2, ranges: e };
}
function th(t, e, n) {
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
function eh(t, e) {
  const n = /* @__PURE__ */ new Map();
  for (let y = 0; y < e.length; y++)
    e[y].name && n.set(e[y].name, y);
  const { leftClasses: o = {}, rightClasses: s = {}, pairs: r = [] } = t, i = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), c = [null], f = [null];
  function u(y, w, _, S) {
    if (_.has(y)) return _.get(y);
    const b = S.length;
    return S.push(th(y, w, n)), _.set(y, b), b;
  }
  const l = [];
  for (const y of r) {
    if (!y || !y.value) continue;
    const w = u(y.left, o, i, c), _ = u(
      y.right,
      s,
      a,
      f
    );
    l.push({ lc: w, rc: _, value: y.value });
  }
  const h = c.length, p = f.length;
  if (h <= 1 || p <= 1 || l.length === 0) return null;
  const g = /* @__PURE__ */ new Map(), d = /* @__PURE__ */ new Map();
  for (let y = 1; y < h; y++)
    for (const w of c[y]) {
      if (g.has(w) && g.get(w) !== y) return null;
      g.set(w, y);
    }
  for (let y = 1; y < p; y++)
    for (const w of f[y]) {
      if (d.has(w) && d.get(w) !== y) return null;
      d.set(w, y);
    }
  if (g.size === 0 || d.size === 0) return null;
  const x = [];
  for (let y = 0; y < h; y++) {
    const w = [];
    for (let _ = 0; _ < p; _++)
      w.push({ value1: { xAdvance: 0 }, value2: null });
    x.push(w);
  }
  for (const { lc: y, rc: w, value: _ } of l)
    x[y][w].value1.xAdvance = _;
  const m = Array.from(g.keys()).sort((y, w) => y - w);
  return {
    lookupType: 2,
    lookupFlag: 0,
    subtables: [
      {
        format: 2,
        coverage: Ql(m),
        valueFormat1: 4,
        // xAdvance
        valueFormat2: 0,
        classDef1: gr(g),
        classDef2: gr(d),
        class1Count: h,
        class2Count: p,
        class1Records: x
      }
    ]
  };
}
function Ba(t, e) {
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
      const u = o(f.left, i), l = o(f.right, a);
      for (const h of u)
        for (const p of l)
          s.push({ left: h, right: p, value: f.value });
    }
  }
  return s;
}
function nh(t, e, n) {
  const o = [];
  let s = e ? [...e] : [];
  const r = Array.isArray(t) ? t : [];
  for (const i of r) {
    if (!i || !Array.isArray(i.pairs) || i.pairs.length === 0)
      continue;
    const a = eh(i, n);
    a ? o.push(a) : s = s.concat(Ba([i], n));
  }
  if (s.length > 0) {
    const { pairs: i } = Oe(s, n);
    i.length > 0 && o.push(Fs(i));
  }
  return o;
}
function oh(t, e) {
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
  s.length > 0 && La(n, s);
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
function sh(t, e) {
  const { axes: n, instances: o = [] } = t;
  let s = 256;
  const r = n.map((a) => {
    const c = s++;
    return Ot(e, c, a.name || a.tag), {
      axisTag: a.tag,
      minValue: a.min,
      defaultValue: a.default,
      maxValue: a.max,
      flags: a.hidden ? 1 : 0,
      axisNameID: c
    };
  }), i = o.map((a) => {
    const c = s++;
    Ot(e, c, a.name);
    const f = n.map((l) => a.coordinates[l.tag] ?? l.default), u = {
      subfamilyNameID: c,
      flags: 0,
      coordinates: f
    };
    if (a.postScriptName) {
      const l = s++;
      Ot(e, l, a.postScriptName), u.postScriptNameID = l;
    }
    return u;
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
function Ot(t, e, n) {
  n && t.names.push(
    { platformID: 3, encodingID: 1, languageID: 1033, nameID: e, value: n },
    { platformID: 1, encodingID: 0, languageID: 0, nameID: e, value: n },
    { platformID: 0, encodingID: 3, languageID: 0, nameID: e, value: n }
  );
}
function rh(t, e) {
  const { axes: n } = t;
  let o = 256;
  for (const a of e.names)
    a.nameID >= o && (o = a.nameID + 1);
  const s = n.map((a) => {
    const c = o++;
    return Ot(e, c, a.name || a.tag), {
      axisTag: a.tag,
      axisNameID: c,
      axisOrdering: 0
    };
  }), r = [];
  for (let a = 0; a < n.length; a++) {
    const c = n[a], f = o++, u = c.name || c.tag;
    Ot(e, f, u), r.push({
      format: 1,
      axisIndex: a,
      flags: 2,
      valueNameID: f,
      value: c.default
    });
  }
  const i = o++;
  return Ot(e, i, "Regular"), {
    majorVersion: 1,
    minorVersion: 1,
    designAxes: s,
    axisValues: r,
    elidedFallbackNameID: i
  };
}
function ih(t, e) {
  const { axes: n, axisStyles: o } = t;
  let s = 256;
  for (const f of e.names)
    f.nameID >= s && (s = f.nameID + 1);
  const r = n.map((f) => {
    const u = s++;
    return Ot(e, u, f.name || f.tag), {
      axisTag: f.tag,
      axisNameID: u,
      axisOrdering: 0
    };
  }), i = {};
  for (let f = 0; f < n.length; f++)
    i[n[f].tag] = f;
  const a = [];
  if (o.values)
    for (const f of o.values) {
      const u = s++;
      if (Ot(e, u, f.name || ""), f._raw)
        a.push({ ...f._raw, valueNameID: u });
      else if (f.values) {
        const l = Object.entries(f.values).map(([h, p]) => ({
          axisIndex: i[h] ?? 0,
          value: p
        }));
        a.push({
          format: 4,
          axisCount: l.length,
          flags: f.flags ?? 0,
          valueNameID: u,
          axisValues: l
        });
      } else f.range ? a.push({
        format: 2,
        axisIndex: i[f.axis] ?? 0,
        flags: f.flags ?? 0,
        valueNameID: u,
        nominalValue: f.range[1],
        rangeMinValue: f.range[0],
        rangeMaxValue: f.range[2]
      }) : f.linkedValue !== void 0 ? a.push({
        format: 3,
        axisIndex: i[f.axis] ?? 0,
        flags: f.flags ?? 0,
        valueNameID: u,
        value: f.value,
        linkedValue: f.linkedValue
      }) : a.push({
        format: 1,
        axisIndex: i[f.axis] ?? 0,
        flags: f.flags ?? 0,
        valueNameID: u,
        value: f.value
      });
    }
  const c = s++;
  return Ot(
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
function ah(t) {
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
function ch(t) {
  const { axes: e, metricVariations: n } = t, { regions: o, metrics: s } = n, r = {};
  for (let S = 0; S < e.length; S++)
    r[e[S].tag] = S;
  const i = o.map((S) => {
    const b = [];
    for (let A = 0; A < e.length; A++) {
      const k = e[A].tag;
      if (S.axes[k]) {
        const [O, I, T] = S.axes[k];
        b.push({ startCoord: O, peakCoord: I, endCoord: T });
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
  const u = Object.entries(s), l = [], h = [];
  for (const [S, b] of u) {
    const A = ul[S] || S, k = new Array(c.length).fill(0);
    for (const O of b) {
      const I = f.get(O.region);
      I !== void 0 && (k[I] = O.delta);
    }
    l.push(k), h.push({
      valueTag: A,
      deltaSetOuterIndex: 0,
      deltaSetInnerIndex: l.length - 1
    });
  }
  const p = 32768;
  let g = !1;
  for (const S of l) {
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
    for (const A of l) {
      const k = A[S];
      if (g ? k < -32768 || k > 32767 : k < -128 || k > 127) {
        b = !0;
        break;
      }
    }
    (b ? d : x).push(S);
  }
  const m = [...d, ...x], y = m.map((S) => c[S]), w = l.map((S) => m.map((b) => S[b])), _ = g ? d.length | p : d.length;
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
          regionIndexes: y,
          deltaSets: w
        }
      ]
    }
  };
}
function fh(t) {
  const e = /* @__PURE__ */ new Map();
  for (let n = 0; n < t.length; n++)
    t[n].name && e.set(t[n].name, n);
  return e;
}
function ot(t, e, n) {
  if (typeof t == "string" && n.has(t))
    return n.get(t);
  const o = Ft(e, t);
  if (o !== void 0)
    return n.get(o);
}
function uh(t, e, n, o = {}) {
  const s = fh(n), r = [], i = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), c = hh(t);
  let f = -1;
  for (const [x, m] of c) {
    const [y, w] = x.split("\0");
    let _;
    if (y === "contextual") {
      const k = gh(
        m,
        n,
        s,
        r,
        a,
        f
      );
      _ = k.lookup, f = k.nextSyntheticLookupId;
    } else
      _ = $a(y, m, n, s);
    if (!_) continue;
    const S = r.length;
    r.push(_);
    const b = m[0]?.lookup?.id;
    b !== void 0 && a.set(b, S), i.has(w) || i.set(w, {
      lookupIndices: /* @__PURE__ */ new Set(),
      scripts: /* @__PURE__ */ new Map()
    });
    const A = i.get(w);
    A.lookupIndices.add(S);
    for (const k of m) {
      const O = k.allScripts || [
        { script: k.script, language: k.language }
      ];
      for (const I of O) {
        const T = I.script || "DFLT", E = I.language || null;
        A.scripts.has(T) || A.scripts.set(T, /* @__PURE__ */ new Set()), A.scripts.get(T).add(E);
      }
    }
  }
  for (const x of e) {
    a.set(x.index, r.length), r.push(structuredClone(x.lookup));
    for (const m of x.features) {
      const y = m.featureTag;
      i.has(y) || i.set(y, {
        lookupIndices: /* @__PURE__ */ new Set(),
        scripts: /* @__PURE__ */ new Map()
      });
      const w = i.get(y);
      w.lookupIndices.add(r.length - 1);
      const _ = m.script || "DFLT", S = m.language || null;
      w.scripts.has(_) || w.scripts.set(_, /* @__PURE__ */ new Set()), w.scripts.get(_).add(S);
    }
  }
  a.size > 0 && Na(r, a);
  const u = [], l = /* @__PURE__ */ new Map();
  for (const [x, m] of i)
    l.set(x, u.length), u.push({
      featureTag: x,
      feature: {
        featureParamsOffset: 0,
        lookupListIndices: Array.from(m.lookupIndices).sort(
          (y, w) => y - w
        )
      }
    });
  const h = /* @__PURE__ */ new Map();
  for (const [x, m] of i) {
    const y = l.get(x);
    for (const [w, _] of m.scripts) {
      h.has(w) || h.set(w, /* @__PURE__ */ new Map());
      const S = h.get(w);
      for (const b of _)
        S.has(b) || S.set(b, /* @__PURE__ */ new Set()), S.get(b).add(y);
    }
  }
  const p = [];
  for (const [x, m] of h) {
    const y = [];
    let w = null;
    for (const [_, S] of m) {
      const b = {
        lookupOrderOffset: 0,
        requiredFeatureIndex: Vn(
          o,
          x,
          _,
          l
        ),
        featureIndices: Array.from(S).sort((A, k) => A - k)
      };
      _ === null ? w = b : y.push({
        langSysTag: _,
        langSys: b
      });
    }
    if (!w) {
      const _ = /* @__PURE__ */ new Set();
      for (const [, S] of m)
        for (const b of S) _.add(b);
      w = {
        lookupOrderOffset: 0,
        requiredFeatureIndex: Vn(
          o,
          x,
          null,
          l
        ),
        featureIndices: Array.from(_).sort((S, b) => S - b)
      };
    }
    p.push({
      scriptTag: x,
      script: {
        defaultLangSys: w,
        langSysRecords: y
      }
    });
  }
  const g = Va(
    o,
    l,
    a
  ), d = {
    majorVersion: o.majorVersion ?? 1,
    minorVersion: g ? Math.max(o.minorVersion ?? 0, 1) : 0,
    scriptList: { scriptRecords: p },
    featureList: { featureRecords: u },
    lookupList: { lookups: r }
  };
  return g && (d.featureVariations = g), d;
}
function lh(t, e = {}) {
  const n = [], o = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map();
  for (const l of t) {
    s.set(l.index, n.length), n.push(structuredClone(l.lookup));
    for (const h of l.features) {
      const p = h.featureTag;
      o.has(p) || o.set(p, {
        lookupIndices: /* @__PURE__ */ new Set(),
        scripts: /* @__PURE__ */ new Map()
      });
      const g = o.get(p);
      g.lookupIndices.add(n.length - 1);
      const d = h.script || "DFLT", x = h.language || null;
      g.scripts.has(d) || g.scripts.set(d, /* @__PURE__ */ new Set()), g.scripts.get(d).add(x);
    }
  }
  s.size > 0 && Na(n, s);
  const r = [], i = /* @__PURE__ */ new Map();
  for (const [l, h] of o)
    i.set(l, r.length), r.push({
      featureTag: l,
      feature: {
        featureParamsOffset: 0,
        lookupListIndices: Array.from(h.lookupIndices).sort(
          (p, g) => p - g
        )
      }
    });
  const a = /* @__PURE__ */ new Map();
  for (const [l, h] of o) {
    const p = i.get(l);
    for (const [g, d] of h.scripts) {
      a.has(g) || a.set(g, /* @__PURE__ */ new Map());
      const x = a.get(g);
      for (const m of d)
        x.has(m) || x.set(m, /* @__PURE__ */ new Set()), x.get(m).add(p);
    }
  }
  const c = [];
  for (const [l, h] of a) {
    let p = null;
    const g = [];
    for (const [d, x] of h) {
      const m = {
        lookupOrderOffset: 0,
        requiredFeatureIndex: Vn(
          e,
          l,
          d,
          i
        ),
        featureIndices: Array.from(x).sort((y, w) => y - w)
      };
      d === null ? p = m : g.push({ langSysTag: d, langSys: m });
    }
    if (!p) {
      const d = /* @__PURE__ */ new Set();
      for (const [, x] of h)
        for (const m of x) d.add(m);
      p = {
        lookupOrderOffset: 0,
        requiredFeatureIndex: Vn(
          e,
          l,
          null,
          i
        ),
        featureIndices: Array.from(d).sort((x, m) => x - m)
      };
    }
    c.push({
      scriptTag: l,
      script: { defaultLangSys: p, langSysRecords: g }
    });
  }
  const f = Va(
    e,
    i,
    s
  ), u = {
    majorVersion: e.majorVersion ?? 1,
    minorVersion: f ? Math.max(e.minorVersion ?? 0, 1) : 0,
    scriptList: { scriptRecords: c },
    featureList: { featureRecords: r },
    lookupList: { lookups: n }
  };
  return f && (u.featureVariations = f), u;
}
function Vn(t, e, n, o) {
  const s = (t.requiredFeatures || []).find(
    (r) => r.script === e && r.language === n
  );
  return s ? o.get(s.feature) ?? 65535 : 65535;
}
function Va(t, e, n) {
  if (!t.featureVariations) return null;
  const o = structuredClone(t.featureVariations);
  for (const s of o.featureVariationRecords || [])
    for (const r of s.featureTableSubstitution?.substitutions || []) {
      const i = t.featureOrder?.[r.featureIndex];
      !i || !e.has(i) || (r.featureIndex = e.get(i), r.feature.lookupListIndices = (r.feature.lookupListIndices || []).map((a) => n.get(a)).filter((a) => a !== void 0));
    }
  return o;
}
function hh(t) {
  const e = /* @__PURE__ */ new Map();
  for (const n of t) {
    const o = n.lookup || {}, s = o.id !== void 0 ? `id:${o.id}` : `auto:${o.flags || 0}:${o.markFilteringSet ?? ""}:${o.useExtension ? 1 : 0}`, r = `${n.type}\0${n.feature}\0${s}`;
    e.has(r) || e.set(r, []), e.get(r).push(n);
  }
  return e;
}
function $a(t, e, n, o) {
  let s;
  switch (t) {
    case "single":
      s = ph(e, n, o);
      break;
    case "multiple":
      s = dh(e, n, o);
      break;
    case "alternate":
      s = mh(e, n, o);
      break;
    case "ligature":
      s = yh(e, n, o);
      break;
    case "reverse":
      s = xh(e, n, o);
      break;
    default:
      return null;
  }
  if (!s) return null;
  const r = e[0]?.lookup;
  return r && (s.lookupFlag = r.flags || 0, r.markFilteringSet !== void 0 && (s.markFilteringSet = r.markFilteringSet, s.lookupFlag |= 16), r.useExtension && (s.useExtension = !0)), s;
}
function gh(t, e, n, o, s, r) {
  const i = [];
  let a = 5;
  for (const u of t) {
    const l = [];
    for (const d of u.actions || []) {
      let x = d.lookup?.id;
      if (x === void 0 && (x = r--), !s.has(x)) {
        const m = d.substitutions || [], y = m[0]?.type, w = m.map((S) => ({
          ...S,
          lookup: d.lookup
        })), _ = $a(
          y,
          w,
          e,
          n
        );
        if (!_) continue;
        s.set(x, o.length), o.push(_);
      }
      l.push({
        sequenceIndex: d.at,
        lookupListIndex: x
      });
    }
    if (l.length === 0) continue;
    const h = So(
      u.input,
      e,
      n
    );
    if (h.some((d) => d.glyphs.length === 0)) continue;
    const p = So(
      u.backtrack,
      e,
      n
    ), g = So(
      u.lookahead,
      e,
      n
    );
    p.length || g.length ? (a = 6, i.push({
      format: 3,
      backtrackCoverages: p,
      inputCoverages: h,
      lookaheadCoverages: g,
      seqLookupRecords: l
    })) : i.push({
      format: 3,
      coverages: h,
      seqLookupRecords: l
    });
  }
  if (i.length === 0)
    return { lookup: null, nextSyntheticLookupId: r };
  const c = { lookupType: a, lookupFlag: 0, subtables: i }, f = t[0]?.lookup;
  return f && (c.lookupFlag = f.flags || 0, f.markFilteringSet !== void 0 && (c.markFilteringSet = f.markFilteringSet, c.lookupFlag |= 16), f.useExtension && (c.useExtension = !0)), { lookup: c, nextSyntheticLookupId: r };
}
function So(t, e, n) {
  return (t || []).map((o) => ({
    format: 1,
    glyphs: o.map((s) => ot(s, e, n)).filter((s) => s !== void 0).sort((s, r) => s - r)
  }));
}
function ph(t, e, n) {
  const o = [], s = [];
  for (const i of t) {
    const a = ot(i.from, e, n), c = ot(i.to, e, n);
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
function dh(t, e, n) {
  const o = [];
  for (const s of t) {
    const r = ot(s.from, e, n);
    if (r === void 0) continue;
    const i = [];
    let a = !0;
    for (const c of s.to) {
      const f = ot(c, e, n);
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
function mh(t, e, n) {
  const o = [];
  for (const s of t) {
    const r = ot(s.from, e, n);
    if (r === void 0) continue;
    const i = [];
    let a = !0;
    for (const c of s.alternates) {
      const f = ot(c, e, n);
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
function yh(t, e, n) {
  const o = /* @__PURE__ */ new Map();
  for (const i of t) {
    if (!i.components || i.components.length < 2) continue;
    const a = ot(i.components[0], e, n), c = ot(i.ligature, e, n);
    if (a === void 0 || c === void 0) continue;
    const f = [];
    let u = !0;
    for (let l = 1; l < i.components.length; l++) {
      const h = ot(i.components[l], e, n);
      if (h === void 0) {
        u = !1;
        break;
      }
      f.push(h);
    }
    u && (o.has(a) || o.set(a, []), o.get(a).push({
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
function xh(t, e, n) {
  const o = [];
  for (const s of t) {
    const r = ot(s.from, e, n), i = ot(s.to, e, n);
    if (r === void 0 || i === void 0) continue;
    const a = (s.backtrack || []).map((f) => ({ format: 1, glyphs: f.map((l) => ot(l, e, n)).filter((l) => l !== void 0).sort((l, h) => l - h) })), c = (s.lookahead || []).map((f) => ({ format: 1, glyphs: f.map((l) => ot(l, e, n)).filter((l) => l !== void 0).sort((l, h) => l - h) }));
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
function Na(t, e) {
  for (const n of t)
    if (!(!n || !n.subtables) && !(n.lookupType !== 5 && n.lookupType !== 6))
      for (const o of n.subtables)
        Sh(o, e);
}
function Sh(t, e) {
  if (t.seqRuleSets) {
    for (const n of t.seqRuleSets)
      if (n)
        for (const o of n)
          Be(o.seqLookupRecords, e);
  }
  if (t.classSeqRuleSets) {
    for (const n of t.classSeqRuleSets)
      if (n)
        for (const o of n)
          Be(o.seqLookupRecords, e);
  }
  if (t.seqLookupRecords && Be(t.seqLookupRecords, e), t.chainedSeqRuleSets) {
    for (const n of t.chainedSeqRuleSets)
      if (n)
        for (const o of n)
          Be(o.seqLookupRecords, e);
  }
  if (t.chainedClassSeqRuleSets) {
    for (const n of t.chainedClassSeqRuleSets)
      if (n)
        for (const o of n)
          Be(o.seqLookupRecords, e);
  }
}
function Be(t, e) {
  if (t)
    for (const n of t) {
      const o = e.get(n.lookupListIndex);
      o !== void 0 && (n.lookupListIndex = o);
    }
}
function _h(t) {
  if (!t || t.length === 0) return null;
  const e = t[0].length, n = t.map(
    (o) => o.map((s) => Os(s))
  );
  return {
    version: 0,
    numPaletteEntries: e,
    palettes: n
  };
}
function wh(t, e) {
  if (!t || t.length === 0) return null;
  const n = pu(e), o = (h) => n.get(h) ?? 0, s = t.some((h) => h.paint), r = t.filter((h) => h.layers), i = [], a = [], c = r.map((h) => ({ ...h, glyphID: o(h.name) })).sort((h, p) => h.glyphID - p.glyphID);
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
  const f = t.filter((h) => h.paint), u = [], l = f.map((h) => ({ ...h, glyphID: o(h.name) })).sort((h, p) => h.glyphID - p.glyphID);
  for (const h of l) {
    const p = structuredClone(h.paint);
    En(p, n), u.push({
      glyphID: h.glyphID,
      paint: p
    });
  }
  return {
    version: 1,
    baseGlyphRecords: i,
    layerRecords: a,
    baseGlyphPaintRecords: u,
    layerPaints: [],
    clipList: null,
    varIndexMap: null,
    itemVariationStore: null
  };
}
function bh(t, e, n = !0) {
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
  return o === 29 && n ? { value: t[e + 1] << 24 | t[e + 2] << 16 | t[e + 3] << 8 | t[e + 4] | 0, bytesConsumed: 5 } : o === 30 && n ? Ah(t, e + 1) : o === 255 && !n ? { value: (t[e + 1] << 24 | t[e + 2] << 16 | t[e + 3] << 8 | t[e + 4] | 0) / 65536, bytesConsumed: 5 } : null;
}
function Ah(t, e) {
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
function Ga(t) {
  return Number.isInteger(t) ? Ch(t) : vh(t);
}
function Ch(t) {
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
function vh(t) {
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
function Ih(t) {
  return t <= 27;
}
function jt(t, e = 0, n = t.length) {
  const o = [], s = [];
  let r = e;
  for (; r < n; ) {
    const i = t[r];
    if (Ih(i)) {
      let a;
      i === 12 ? (a = 3072 | t[r + 1], r += 2) : (a = i, r += 1), o.push({ operator: a, operands: [...s] }), s.length = 0;
    } else {
      const a = bh(t, r, !0);
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
    let u = 0;
    const l = s + f * o;
    for (let h = 0; h < o; h++)
      u = u << 8 | t[l + h];
    r.push(u);
  }
  const i = s + (n + 1) * o, a = [];
  for (let f = 0; f < n; f++) {
    const u = i + r[f] - 1, l = i + r[f + 1] - 1;
    a.push(new Uint8Array(Array.prototype.slice.call(t, u, l)));
  }
  const c = i + r[n] - 1 - e;
  return { items: a, totalBytes: c };
}
function mn(t, e) {
  const o = (t[e] << 24 | t[e + 1] << 16 | t[e + 2] << 8 | t[e + 3]) >>> 0;
  if (o === 0)
    return { items: [], totalBytes: 4 };
  const s = t[e + 4], r = e + 5, i = [];
  for (let u = 0; u <= o; u++) {
    let l = 0;
    const h = r + u * s;
    for (let p = 0; p < s; p++)
      l = l << 8 | t[h + p];
    i.push(l >>> 0);
  }
  const a = r + (o + 1) * s, c = [];
  for (let u = 0; u < o; u++) {
    const l = a + i[u] - 1, h = a + i[u + 1] - 1;
    c.push(new Uint8Array(Array.prototype.slice.call(t, l, h)));
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
function yn(t) {
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
const Xo = {
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
}, pt = Object.fromEntries(
  Object.entries(Xo).map(([t, e]) => [e, Number(t)])
), Ko = {
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
}, pr = Object.fromEntries(
  Object.entries(Ko).map(([t, e]) => [e, Number(t)])
), Jo = {
  17: "CharStrings",
  24: "VariationStore",
  3079: "FontMatrix",
  3108: "FDArray",
  3109: "FDSelect"
}, fe = Object.fromEntries(
  Object.entries(Jo).map(([t, e]) => [e, Number(t)])
), Pa = {
  18: "Private"
}, Ua = {
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
function qt(t, e) {
  const n = {};
  for (const { operator: o, operands: s } of t) {
    const r = e[o] || `op_${o}`;
    n[r] = s.length === 1 ? s[0] : s;
  }
  return n;
}
function Ae(t, e) {
  const n = [];
  for (const [o, s] of Object.entries(t)) {
    const r = e[o];
    if (r === void 0) continue;
    const i = Array.isArray(s) ? s : [s];
    n.push({ operator: r, operands: i });
  }
  return n;
}
function za(t, e, n) {
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
      const u = a < s - 1 ? t[i] << 8 | t[i + 1] : n;
      for (let l = c; l < u; l++)
        r[l] = f;
    }
    return r;
  }
  if (o === 4) {
    const s = (t[e + 1] << 24 | t[e + 2] << 16 | t[e + 3] << 8 | t[e + 4]) >>> 0, r = new Array(n);
    let i = e + 5;
    for (let a = 0; a < s; a++) {
      const c = (t[i] << 24 | t[i + 1] << 16 | t[i + 2] << 8 | t[i + 3]) >>> 0, f = t[i + 4] << 8 | t[i + 5];
      i += 6;
      const u = a < s - 1 ? (t[i] << 24 | t[i + 1] << 16 | t[i + 2] << 8 | t[i + 3]) >>> 0 : n;
      for (let l = c; l < u; l++)
        r[l] = f;
    }
    return r;
  }
  throw new Error(`Unsupported FDSelect format: ${o}`);
}
function Ha(t) {
  const e = [0];
  for (const n of t)
    e.push(n);
  return e;
}
function kh(t, e, n) {
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
function Oh(t) {
  if (typeof t == "string")
    return [];
  const e = [0];
  for (const n of t)
    e.push(n >> 8 & 255, n & 255);
  return e;
}
function Eh(t, e) {
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
      for (let u = 0; u <= f; u++)
        s.push(c + u);
    }
  }
  return { format: n, codes: s, hasSupplement: o };
}
const Wa = /* @__PURE__ */ new Set([
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
]), dr = /* @__PURE__ */ new Set([
  19
  // Subrs  (relative offset from Private start)
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
      ) : n.push(...Ga(i));
    o >= 3072 ? n.push(12, o & 255) : n.push(o);
  }
  return n;
}
function mr(t) {
  const e = [];
  for (let n = 0; n < t.length; n++) e.push(t.charCodeAt(n));
  return e;
}
function yr(t) {
  return String.fromCharCode(...t);
}
function ja(t, e) {
  const n = new Uint8Array(t), o = n[0], s = n[1];
  let i = n[2];
  const a = Mt(n, i);
  i += a.totalBytes;
  const c = a.items.map(yr), f = Mt(n, i);
  i += f.totalBytes;
  const u = Mt(n, i);
  i += u.totalBytes;
  const l = u.items.map(yr), p = Mt(n, i).items.map((d) => Array.from(d)), g = f.items.map((d) => Th(n, d));
  return {
    majorVersion: o,
    minorVersion: s,
    names: c,
    strings: l,
    globalSubrs: p,
    fonts: g
  };
}
function Th(t, e) {
  const n = jt(e, 0, e.length), o = qt(n, Xo), s = o.CharStrings, r = o.charset ?? 0, i = o.Encoding ?? 0, a = o.Private;
  delete o.CharStrings, delete o.charset, delete o.Encoding, delete o.Private;
  const c = o.FDArray, f = o.FDSelect;
  delete o.FDArray, delete o.FDSelect;
  let u = [];
  s !== void 0 && (u = Mt(t, s).items.map((S) => Array.from(S)));
  const l = u.length, h = kh(t, r, l), p = Eh(t, i);
  let g = {}, d = [];
  if (Array.isArray(a) && a.length === 2) {
    const [_, S] = a, b = jt(t, S, S + _);
    g = qt(b, Ko), g.Subrs !== void 0 && (d = Mt(t, S + g.Subrs).items.map((k) => Array.from(k)), delete g.Subrs);
  }
  const x = o.ROS !== void 0;
  let m, y;
  x && (c !== void 0 && (m = Mt(t, c).items.map((S) => {
    const b = jt(S, 0, S.length), A = qt(b, Xo);
    let k = {}, O = [];
    if (Array.isArray(A.Private) && A.Private.length === 2) {
      const [I, T] = A.Private, E = jt(t, T, T + I);
      k = qt(E, Ko), k.Subrs !== void 0 && (O = Mt(t, T + k.Subrs).items.map((R) => Array.from(R)), delete k.Subrs), delete A.Private;
    }
    return {
      fontDict: A,
      privateDict: k,
      localSubrs: O
    };
  })), f !== void 0 && (y = za(t, f, l)));
  const w = {
    topDict: o,
    charset: h,
    encoding: p,
    charStrings: u,
    privateDict: g,
    localSubrs: d
  };
  return x && (w.isCIDFont = !0, m && (w.fdArray = m), y && (w.fdSelect = y)), w;
}
function qa(t) {
  const {
    majorVersion: e = 1,
    minorVersion: n = 0,
    names: o = [],
    strings: s = [],
    globalSubrs: r = [],
    fonts: i = []
  } = t, a = [e, n, 4, 4], c = Dt(o.map(mr)), f = Dt(s.map(mr)), u = Dt(
    r.map((w) => new Uint8Array(w))
  ), l = i.map((w) => Dh(w)), h = i.map(
    (w, _) => xr(
      w,
      l[_],
      /* baseOffset */
      0
    )
  ), p = Dt(h);
  let d = a.length + c.length + p.length + f.length + u.length;
  const x = i.map((w, _) => {
    const S = xr(w, l[_], d);
    return d += l[_].totalSize, S;
  }), m = Dt(x);
  if (m.length !== p.length)
    throw new Error(
      "CFF Top DICT INDEX size mismatch — this should not happen with forced int32 offsets"
    );
  const y = [
    ...a,
    ...c,
    ...m,
    ...f,
    ...u
  ];
  for (const w of l)
    for (const _ of w.sections)
      for (let S = 0; S < _.length; S++) y.push(_[S]);
  return y;
}
function Dh(t) {
  const e = [], n = {};
  let o = 0;
  const s = (t.charStrings || []).map((l) => !l || l.length === 0 ? new Uint8Array([14]) : new Uint8Array(l)), r = Dt(s);
  n.charStrings = o, e.push(r), o += r.length;
  const i = t.charset;
  if (typeof i == "string")
    n.charset = i === "ISOAdobe" ? 0 : i === "Expert" ? 1 : 2, n.charsetIsPredefined = !0;
  else {
    const l = Oh(i || []);
    n.charset = o, n.charsetIsPredefined = !1, e.push(l), o += l.length;
  }
  const a = t.encoding;
  if (typeof a == "string")
    n.encoding = a === "Standard" ? 0 : 1, n.encodingIsPredefined = !0;
  else if (a && typeof a == "object") {
    const l = Rh(a);
    n.encoding = o, n.encodingIsPredefined = !1, e.push(l), o += l.length;
  } else
    n.encoding = 0, n.encodingIsPredefined = !0;
  const c = Ae(
    t.privateDict || {},
    pr
  );
  let f = null;
  if (t.localSubrs && t.localSubrs.length > 0 && (f = Dt(t.localSubrs.map((l) => new Uint8Array(l)))), f) {
    const h = Tn(
      c,
      dr
    ).length + 6;
    c.push({
      operator: pr.Subrs,
      operands: [h]
    });
  }
  const u = Tn(c, dr);
  if (n.privateOffset = o, n.privateSize = u.length, e.push(u), o += u.length, f && (e.push(f), o += f.length), t.isCIDFont) {
    if (t.fdSelect) {
      const l = Ha(t.fdSelect);
      n.fdSelect = o, e.push(l), o += l.length;
    }
    if (t.fdArray) {
      const l = t.fdArray.map((p) => {
        const g = Ae(
          p.fontDict || {},
          pt
        );
        return Tn(g, Wa);
      }), h = Dt(l);
      n.fdArray = o, e.push(h), o += h.length;
    }
  }
  return { sections: e, totalSize: o, offsets: n };
}
function xr(t, e, n) {
  const o = e.offsets, s = Ae(
    t.topDict || {},
    pt
  );
  return s.push({
    operator: pt.CharStrings,
    operands: [n + o.charStrings]
  }), o.charsetIsPredefined ? o.charset !== 0 && s.push({
    operator: pt.charset,
    operands: [o.charset]
  }) : s.push({
    operator: pt.charset,
    operands: [n + o.charset]
  }), o.encodingIsPredefined ? o.encoding !== 0 && s.push({
    operator: pt.Encoding,
    operands: [o.encoding]
  }) : s.push({
    operator: pt.Encoding,
    operands: [n + o.encoding]
  }), s.push({
    operator: pt.Private,
    operands: [o.privateSize, n + o.privateOffset]
  }), t.isCIDFont && (o.fdArray !== void 0 && s.push({
    operator: pt.FDArray,
    operands: [n + o.fdArray]
  }), o.fdSelect !== void 0 && s.push({
    operator: pt.FDSelect,
    operands: [n + o.fdSelect]
  })), Tn(s, Wa);
}
function Rh(t) {
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
const Qo = 32768, ts = 32767;
function Pt(t) {
  const e = new F(t), n = e.uint16(), o = e.offset32(), s = e.uint16(), r = e.array(
    "offset32",
    s
  ), i = Fh(
    e,
    o
  ), a = [];
  for (let c = 0; c < s; c++) {
    const f = r[c];
    f === 0 ? a.push(null) : a.push(Mh(e, f));
  }
  return {
    format: n,
    variationRegionList: i,
    itemVariationData: a
  };
}
function Fh(t, e) {
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
function Mh(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.uint16(), r = t.array("uint16", s), i = (o & Qo) !== 0, a = o & ts, c = [];
  for (let f = 0; f < n; f++) {
    const u = [];
    for (let l = 0; l < a; l++)
      u.push(i ? t.int32() : t.int16());
    for (let l = a; l < s; l++)
      u.push(i ? t.int16() : t.int8());
    c.push(u);
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
  const u = [];
  for (let p = 0; p < o; p++) {
    const g = n[p];
    if (!g) {
      u.push(0);
      continue;
    }
    u.push(f);
    const d = g.regionIndexes.length, x = (g.wordDeltaCount & Qo) !== 0, m = g.wordDeltaCount & ts, y = 6 + 2 * d, w = x ? 4 : 2, _ = x ? 2 : 1, S = m * w + (d - m) * _, b = y + g.itemCount * S;
    f += b;
  }
  const l = f, h = new v(l);
  h.uint16(t.format ?? 1), h.offset32(c), h.uint16(o);
  for (let p = 0; p < o; p++)
    h.offset32(u[p]);
  h.uint16(r), h.uint16(i);
  for (const p of e.regions)
    for (const g of p.regionAxes)
      h.f2dot14(g.startCoord), h.f2dot14(g.peakCoord), h.f2dot14(g.endCoord);
  for (let p = 0; p < o; p++) {
    const g = n[p];
    if (!g) continue;
    const d = g.regionIndexes.length, x = (g.wordDeltaCount & Qo) !== 0, m = g.wordDeltaCount & ts;
    h.uint16(g.itemCount), h.uint16(g.wordDeltaCount), h.uint16(d), h.array("uint16", g.regionIndexes);
    for (const y of g.deltaSets) {
      for (let w = 0; w < m; w++)
        x ? h.int32(y[w] ?? 0) : h.int16(y[w] ?? 0);
      for (let w = m; w < d; w++)
        x ? h.int16(y[w] ?? 0) : h.int8(y[w] ?? 0);
    }
  }
  return h.toArray();
}
function Lh(t) {
  const e = ne(t), n = e.length, o = new Uint8Array(2 + n);
  return o[0] = n >> 8 & 255, o[1] = n & 255, o.set(new Uint8Array(e), 2), o;
}
const Bh = Object.fromEntries(
  Object.entries(Pa).map(([t, e]) => [e, Number(t)])
), Vh = Object.fromEntries(
  Object.entries(Ua).map(([t, e]) => [e, Number(t)])
), $h = /* @__PURE__ */ new Set([
  17,
  // CharStrings
  24,
  // VariationStore
  3108,
  // FDArray
  3109
  // FDSelect
]), Nh = /* @__PURE__ */ new Set([
  18
  // Private  (size + offset)
]), Sr = /* @__PURE__ */ new Set([
  19
  // Subrs  (relative offset)
]);
function Dn(t, e) {
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
      ) : n.push(...Ga(i));
    o >= 3072 ? n.push(12, o & 255) : n.push(o);
  }
  return n;
}
function Gh(t, e) {
  const n = new Uint8Array(t), o = n[0], s = n[1], r = n[2], i = n[3] << 8 | n[4], a = r, c = a + i, f = jt(n, a, c), u = qt(f, Jo), l = u.CharStrings, h = u.VariationStore, p = u.FDArray, g = u.FDSelect;
  delete u.CharStrings, delete u.VariationStore, delete u.FDArray, delete u.FDSelect;
  const x = mn(n, c).items.map((b) => Array.from(b));
  let m = [];
  l !== void 0 && (m = mn(n, l).items.map((A) => Array.from(A)));
  const y = m.length;
  let w = [];
  p !== void 0 && (w = mn(n, p).items.map((A) => {
    const k = jt(A, 0, A.length), O = qt(k, {
      ...Pa,
      ...Jo
      // Font DICTs can also have FontMatrix
    });
    let I = {}, T = [];
    if (Array.isArray(O.Private) && O.Private.length === 2) {
      const [E, D] = O.Private, R = jt(n, D, D + E);
      I = qt(R, Ua), I.Subrs !== void 0 && (T = mn(n, D + I.Subrs).items.map((L) => Array.from(L)), delete I.Subrs), delete O.Private;
    }
    return {
      fontDict: O,
      privateDict: I,
      localSubrs: T
    };
  }));
  let _ = null;
  g !== void 0 && y > 0 && (_ = za(n, g, y));
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
    topDict: u,
    globalSubrs: x,
    charStrings: m,
    fontDicts: w,
    fdSelect: _,
    variationStore: S
  };
}
function Ph(t) {
  const {
    majorVersion: e = 2,
    minorVersion: n = 0,
    topDict: o = {},
    globalSubrs: s = [],
    charStrings: r = [],
    fontDicts: i = [],
    fdSelect: a = null,
    variationStore: c = null
  } = t, f = yn(
    s.map((E) => new Uint8Array(E))
  ), u = yn(r.map((E) => new Uint8Array(E))), l = a ? Ha(a) : null, h = c ? Lh(c) : null, g = _r(o, {
    charStrings: 0,
    fdArray: i.length > 0 ? 0 : void 0,
    fdSelect: a ? 0 : void 0,
    variationStore: c ? 0 : void 0
  }).length, d = 5;
  let m = d + g + f.length;
  const y = m;
  m += u.length;
  let w;
  l && (w = m, m += l.length);
  let _;
  h && (_ = m, m += h.length);
  const S = i.map((E) => {
    const D = Ae(
      E.privateDict || {},
      Vh
    );
    let R = null;
    if (E.localSubrs && E.localSubrs.length > 0 && (R = yn(E.localSubrs.map((L) => new Uint8Array(L)))), R) {
      const W = Dn(D, Sr).length + 6;
      D.push({
        operator: 19,
        // Subrs
        operands: [W]
      });
    }
    const M = Dn(D, Sr);
    return {
      privBytes: M,
      localSubrBytes: R,
      totalSize: M.length + (R ? R.length : 0)
    };
  }), b = [];
  for (const E of S)
    b.push({ offset: m, size: E.privBytes.length }), m += E.totalSize;
  let A = null, k;
  if (i.length > 0) {
    const E = i.map((D, R) => {
      const M = Ae(D.fontDict || {}, {
        ...Bh,
        ...fe
      });
      return M.push({
        operator: 18,
        // Private
        operands: [b[R].size, b[R].offset]
      }), Dn(M, Nh);
    });
    A = yn(E), k = m, m += A.length;
  }
  const O = _r(o, {
    charStrings: y,
    fdArray: k,
    fdSelect: w,
    variationStore: _
  });
  if (O.length !== g)
    throw new Error(
      "CFF2 TopDICT size mismatch — this should not happen with forced int32 offsets"
    );
  const T = [
    ...[
      e,
      n,
      d,
      g >> 8 & 255,
      g & 255
    ],
    ...O,
    ...f,
    ...u
  ];
  if (l)
    for (let E = 0; E < l.length; E++) T.push(l[E]);
  if (h)
    for (let E = 0; E < h.length; E++)
      T.push(h[E]);
  for (const E of S) {
    for (let D = 0; D < E.privBytes.length; D++) T.push(E.privBytes[D]);
    if (E.localSubrBytes)
      for (let D = 0; D < E.localSubrBytes.length; D++)
        T.push(E.localSubrBytes[D]);
  }
  if (A)
    for (let E = 0; E < A.length; E++) T.push(A[E]);
  return T;
}
function _r(t, e) {
  const n = Ae(t, fe);
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
  }), Dn(n, $h);
}
const Uh = 8, zh = 4;
function Hh(t) {
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
function Wh(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.defaultVertOriginY ?? 0, s = t.vertOriginYMetrics ?? [], r = t.numVertOriginYMetrics ?? s.length, i = s.slice(0, r);
  for (; i.length < r; )
    i.push({ glyphIndex: 0, vertOriginY: o });
  const a = new v(
    Uh + r * zh
  );
  a.uint16(e), a.uint16(n), a.int16(o), a.uint16(r);
  for (const c of i)
    a.uint16(c.glyphIndex ?? 0), a.int16(c.vertOriginY ?? o);
  return a.toArray();
}
const jh = 8;
function qh(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = [];
  for (let a = 0; a < r; a++) {
    const c = e.uint16(), f = [];
    for (let u = 0; u < c; u++)
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
function Yh(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.reserved ?? 0, s = t.segmentMaps ?? [];
  let r = jh;
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
function Ce(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.uint16();
  if (s === 32768)
    return {
      format: 32768,
      deltaSetOuterIndex: n,
      deltaSetInnerIndex: o
    };
  const r = n, i = o, a = s, c = i - r + 1;
  let f, u, l;
  if (a === 1)
    f = 2, u = 3, l = 2;
  else if (a === 2)
    f = 4, u = 15, l = 8;
  else if (a === 3)
    f = 8, u = 255, l = 128;
  else
    throw new Error(
      `Unknown Device deltaFormat: ${a} at offset ${e} (words: ${n}, ${o}, ${s})`
    );
  const h = 16 / f, p = Math.ceil(c / h), g = [];
  for (let d = 0; d < p; d++) {
    const x = t.uint16(), m = Math.min(h, c - d * h);
    for (let y = 0; y < m; y++) {
      const w = 16 - f * (y + 1);
      let _ = x >> w & u;
      _ >= l && (_ -= l * 2), g.push(_);
    }
  }
  return { format: a, startSize: r, endSize: i, deltaValues: g };
}
function $n(t) {
  if (t.format === 32768) {
    const l = new v(6);
    return l.uint16(t.deltaSetOuterIndex), l.uint16(t.deltaSetInnerIndex), l.uint16(32768), l.toArray();
  }
  const { startSize: e, endSize: n, deltaFormat: o, deltaValues: s } = t;
  let r;
  if (o === 1) r = 2;
  else if (o === 2) r = 4;
  else if (o === 3) r = 8;
  else throw new Error(`Unknown Device deltaFormat: ${o}`);
  const i = 16 / r, a = Math.ceil(s.length / i), c = (1 << r) - 1, f = 6 + a * 2, u = new v(f);
  u.uint16(e), u.uint16(n), u.uint16(o);
  for (let l = 0; l < a; l++) {
    let h = 0;
    const p = Math.min(
      i,
      s.length - l * i
    );
    for (let g = 0; g < p; g++) {
      const d = 16 - r * (g + 1);
      h |= (s[l * i + g] & c) << d;
    }
    u.uint16(h);
  }
  return u.toArray();
}
function Ya(t, e) {
  t.seek(e);
  const n = t.uint16(), o = [];
  for (let r = 0; r < n; r++)
    o.push({
      scriptTag: t.tag(),
      scriptOffset: t.uint16()
    });
  return { scriptRecords: o.map((r) => ({
    scriptTag: r.scriptTag,
    script: Zh(t, e + r.scriptOffset)
  })) };
}
function Zh(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = [];
  for (let a = 0; a < o; a++)
    s.push({
      langSysTag: t.tag(),
      langSysOffset: t.uint16()
    });
  const r = n !== 0 ? wr(t, e + n) : null, i = s.map((a) => ({
    langSysTag: a.langSysTag,
    langSys: wr(t, e + a.langSysOffset)
  }));
  return { defaultLangSys: r, langSysRecords: i };
}
function wr(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.uint16(), r = t.array("uint16", s);
  return { lookupOrderOffset: n, requiredFeatureIndex: o, featureIndices: r };
}
function Za(t) {
  const { scriptRecords: e } = t, n = e.map((a) => Xh(a.script)), o = 2 + e.length * 6, s = [];
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
function Xh(t) {
  const { defaultLangSys: e, langSysRecords: n } = t, o = n.map((u) => br(u.langSys)), s = e ? br(e) : null;
  let i = 4 + n.length * 6;
  const a = s ? i : 0;
  s && (i += s.length);
  const c = [];
  for (const u of o)
    c.push(i), i += u.length;
  const f = new v(i);
  f.uint16(a), f.uint16(n.length);
  for (let u = 0; u < n.length; u++)
    f.tag(n[u].langSysTag), f.uint16(c[u]);
  s && (f.seek(a), f.rawBytes(s));
  for (let u = 0; u < o.length; u++)
    f.seek(c[u]), f.rawBytes(o[u]);
  return f.toArray();
}
function br(t) {
  const e = 6 + t.featureIndices.length * 2, n = new v(e);
  return n.uint16(t.lookupOrderOffset), n.uint16(t.requiredFeatureIndex), n.uint16(t.featureIndices.length), n.array("uint16", t.featureIndices), n.toArray();
}
function Xa(t, e) {
  t.seek(e);
  const n = t.uint16(), o = [];
  for (let r = 0; r < n; r++)
    o.push({
      featureTag: t.tag(),
      featureOffset: t.uint16()
    });
  return { featureRecords: o.map((r) => ({
    featureTag: r.featureTag,
    feature: Ka(t, e + r.featureOffset)
  })) };
}
function Ka(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.array("uint16", o);
  return { featureParamsOffset: n, lookupListIndices: s };
}
function Ja(t) {
  const { featureRecords: e } = t, n = e.map((a) => Qa(a.feature)), o = 2 + e.length * 6, s = [];
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
function Qa(t) {
  const e = 4 + t.lookupListIndices.length * 2, n = new v(e);
  return n.uint16(t.featureParamsOffset), n.uint16(t.lookupListIndices.length), n.array("uint16", t.lookupListIndices), n.toArray();
}
function tc(t, e, n, o) {
  t.seek(e);
  const s = t.uint16();
  return { lookups: t.array("uint16", s).map(
    (a) => Kh(t, e + a, n, o)
  ) };
}
function Kh(t, e, n, o) {
  t.seek(e);
  const s = t.uint16(), r = t.uint16(), i = t.uint16(), a = t.array("uint16", i), c = r & 16 ? t.uint16() : void 0, f = a.map(
    (p) => n(t, e + p, s)
  );
  let u = s, l = f;
  o !== void 0 && s === o && f.length > 0 && (u = f[0].extensionLookupType, l = f.map((p) => p.subtable));
  const h = {
    lookupType: u,
    lookupFlag: r,
    subtables: l
  };
  return u !== s && (h.useExtension = !0), c !== void 0 && (h.markFilteringSet = c), h;
}
function ec(t, e, n) {
  const { lookups: o } = t, s = 8, r = o.map((d) => {
    const x = d.subtables.map(
      (m) => e(m, d.lookupType)
    );
    return { ...d, subtableBytes: x };
  }), i = (d) => {
    const { lookupType: x, lookupFlag: m, subtableBytes: y, markFilteringSet: w } = d, _ = w !== void 0;
    let b = 6 + y.length * 2 + (_ ? 2 : 0);
    const A = y.map((O) => {
      const I = b;
      return b += O.length, I;
    }), k = new v(b);
    k.uint16(x), k.uint16(m), k.uint16(y.length), k.array("uint16", A), _ && k.uint16(w);
    for (let O = 0; O < y.length; O++)
      k.seek(A[O]), k.rawBytes(y[O]);
    return k.toArray();
  }, a = r.map(i), c = 2 + o.length * 2, u = ((d) => {
    let x = c;
    for (const m of d) {
      if (x > 65535) return !0;
      x += m.length;
    }
    return !1;
  })(a), l = r.some((d) => d.useExtension);
  if ((u || l) && n !== void 0) {
    const d = r.map((_, S) => {
      if (!u && !_.useExtension)
        return {
          compactBytes: a[S],
          subtableOffsets: [],
          innerDataBytes: []
        };
      const { lookupType: b, lookupFlag: A, subtableBytes: k, markFilteringSet: O } = _, I = O !== void 0;
      let E = 6 + k.length * 2 + (I ? 2 : 0);
      const D = k.map(() => {
        const M = E;
        return E += s, M;
      }), R = new v(E);
      R.uint16(n), R.uint16(A), R.uint16(k.length), R.array("uint16", D), I && R.uint16(O);
      for (let M = 0; M < k.length; M++)
        R.seek(D[M]), R.uint16(1), R.uint16(b), R.uint32(0);
      return {
        compactBytes: R.toArray(),
        subtableOffsets: D,
        innerDataBytes: k
      };
    });
    let x = c;
    const m = d.map((_) => {
      const S = x;
      return x += _.compactBytes.length, S;
    }), y = d.map(
      (_) => _.innerDataBytes.map((S) => {
        const b = x;
        return x += S.length, b;
      })
    ), w = new v(x);
    w.uint16(o.length), w.array("uint16", m);
    for (let _ = 0; _ < d.length; _++)
      w.seek(m[_]), w.rawBytes(d[_].compactBytes);
    for (let _ = 0; _ < d.length; _++) {
      const S = d[_];
      for (let b = 0; b < S.innerDataBytes.length; b++) {
        const A = m[_] + S.subtableOffsets[b], k = y[_][b], O = k - A;
        w.seek(A + 4), w.uint32(O), w.seek(k), w.rawBytes(S.innerDataBytes[b]);
      }
    }
    return w.toArray();
  }
  let h = c;
  const p = a.map((d) => {
    const x = h;
    return h += d.length, x;
  }), g = new v(h);
  g.uint16(o.length), g.array("uint16", p);
  for (let d = 0; d < a.length; d++)
    g.seek(p[d]), g.rawBytes(a[d]);
  return g.toArray();
}
function nc(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const o = t.uint16(), s = t.uint16(), r = [];
    for (let c = 0; c < s; c++)
      r.push(t.uint16());
    const i = $(t, e + o), a = r.map(
      (c) => c === 0 ? null : Jh(t, e + c)
    );
    return { format: n, coverage: i, seqRuleSets: a };
  }
  if (n === 2) {
    const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = [];
    for (let u = 0; u < r; u++)
      i.push(t.uint16());
    const a = $(t, e + o), c = Vt(t, e + s), f = i.map(
      (u) => u === 0 ? null : Qh(t, e + u)
    );
    return { format: n, coverage: a, classDef: c, classSeqRuleSets: f };
  }
  if (n === 3) {
    const o = t.uint16(), s = t.uint16(), r = t.array("uint16", o), i = un(t, s), a = r.map(
      (c) => $(t, e + c)
    );
    return { format: n, coverages: a, seqLookupRecords: i };
  }
  throw new Error(`Unknown SequenceContext format: ${n}`);
}
function Jh(t, e) {
  t.seek(e);
  const n = t.uint16();
  return t.array("uint16", n).map((s) => {
    t.seek(e + s);
    const r = t.uint16(), i = t.uint16(), a = t.array("uint16", r - 1), c = un(t, i);
    return { glyphCount: r, inputSequence: a, seqLookupRecords: c };
  });
}
function Qh(t, e) {
  t.seek(e);
  const n = t.uint16();
  return t.array("uint16", n).map((s) => {
    t.seek(e + s);
    const r = t.uint16(), i = t.uint16(), a = t.array("uint16", r - 1), c = un(t, i);
    return { glyphCount: r, inputSequence: a, seqLookupRecords: c };
  });
}
function un(t, e) {
  const n = [];
  for (let o = 0; o < e; o++)
    n.push({
      sequenceIndex: t.uint16(),
      lookupListIndex: t.uint16()
    });
  return n;
}
function oc(t) {
  if (t.format === 1) return t0(t);
  if (t.format === 2) return e0(t);
  if (t.format === 3) return n0(t);
  throw new Error(`Unknown SequenceContext format: ${t.format}`);
}
function t0(t) {
  const { coverage: e, seqRuleSets: n } = t, o = G(e), s = n.map(
    (u) => u === null ? null : sc(u)
  );
  let i = 6 + n.length * 2;
  const a = i;
  i += o.length;
  const c = s.map((u) => {
    if (u === null) return 0;
    const l = i;
    return i += u.length, l;
  }), f = new v(i);
  f.uint16(1), f.uint16(a), f.uint16(n.length), f.array("uint16", c), f.seek(a), f.rawBytes(o);
  for (let u = 0; u < s.length; u++)
    s[u] && (f.seek(c[u]), f.rawBytes(s[u]));
  return f.toArray();
}
function e0(t) {
  const { coverage: e, classDef: n, classSeqRuleSets: o } = t, s = G(e), r = $t(n), i = o.map(
    (p) => p === null ? null : sc(p)
  );
  let c = 8 + o.length * 2;
  const f = c;
  c += s.length;
  const u = c;
  c += r.length;
  const l = i.map((p) => {
    if (p === null) return 0;
    const g = c;
    return c += p.length, g;
  }), h = new v(c);
  h.uint16(2), h.uint16(f), h.uint16(u), h.uint16(o.length), h.array("uint16", l), h.seek(f), h.rawBytes(s), h.seek(u), h.rawBytes(r);
  for (let p = 0; p < i.length; p++)
    i[p] && (h.seek(l[p]), h.rawBytes(i[p]));
  return h.toArray();
}
function n0(t) {
  const { coverages: e, seqLookupRecords: n } = t, o = e.map(G);
  let r = 6 + e.length * 2 + n.length * 4;
  const i = o.map((c) => {
    const f = r;
    return r += c.length, f;
  }), a = new v(r);
  a.uint16(3), a.uint16(e.length), a.uint16(n.length), a.array("uint16", i), oo(a, n);
  for (let c = 0; c < o.length; c++)
    a.seek(i[c]), a.rawBytes(o[c]);
  return a.toArray();
}
function sc(t) {
  const e = t.map(o0);
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
function o0(t) {
  const { glyphCount: e, inputSequence: n, seqLookupRecords: o } = t, s = 4 + (e - 1) * 2 + o.length * 4, r = new v(s);
  return r.uint16(e), r.uint16(o.length), r.array("uint16", n), oo(r, o), r.toArray();
}
function oo(t, e) {
  for (const n of e)
    t.uint16(n.sequenceIndex), t.uint16(n.lookupListIndex);
}
function rc(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const o = t.uint16(), s = t.uint16(), r = [];
    for (let c = 0; c < s; c++)
      r.push(t.uint16());
    const i = $(t, e + o), a = r.map(
      (c) => c === 0 ? null : s0(t, e + c)
    );
    return { format: n, coverage: i, chainedSeqRuleSets: a };
  }
  if (n === 2) {
    const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = t.uint16(), a = t.uint16(), c = [];
    for (let g = 0; g < a; g++)
      c.push(t.uint16());
    const f = $(t, e + o), u = Vt(
      t,
      e + s
    ), l = Vt(
      t,
      e + r
    ), h = Vt(
      t,
      e + i
    ), p = c.map(
      (g) => g === 0 ? null : r0(t, e + g)
    );
    return {
      format: n,
      coverage: f,
      backtrackClassDef: u,
      inputClassDef: l,
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
    ), f = t.uint16(), u = un(t, f), l = s.map(
      (g) => $(t, e + g)
    ), h = i.map(
      (g) => $(t, e + g)
    ), p = c.map(
      (g) => $(t, e + g)
    );
    return {
      format: n,
      backtrackCoverages: l,
      inputCoverages: h,
      lookaheadCoverages: p,
      seqLookupRecords: u
    };
  }
  throw new Error(`Unknown ChainedSequenceContext format: ${n}`);
}
function s0(t, e) {
  t.seek(e);
  const n = t.uint16();
  return t.array("uint16", n).map((s) => ic(t, e + s));
}
function ic(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.array("uint16", n), s = t.uint16(), r = t.array("uint16", s - 1), i = t.uint16(), a = t.array("uint16", i), c = t.uint16(), f = un(t, c);
  return {
    backtrackSequence: o,
    inputGlyphCount: s,
    inputSequence: r,
    lookaheadSequence: a,
    seqLookupRecords: f
  };
}
function r0(t, e) {
  t.seek(e);
  const n = t.uint16();
  return t.array("uint16", n).map((s) => ic(t, e + s));
}
function ac(t) {
  if (t.format === 1) return i0(t);
  if (t.format === 2) return a0(t);
  if (t.format === 3) return c0(t);
  throw new Error(`Unknown ChainedSequenceContext format: ${t.format}`);
}
function i0(t) {
  const { coverage: e, chainedSeqRuleSets: n } = t, o = G(e), s = n.map(
    (u) => u === null ? null : cc(u)
  );
  let i = 6 + n.length * 2;
  const a = i;
  i += o.length;
  const c = s.map((u) => {
    if (u === null) return 0;
    const l = i;
    return i += u.length, l;
  }), f = new v(i);
  f.uint16(1), f.uint16(a), f.uint16(n.length), f.array("uint16", c), f.seek(a), f.rawBytes(o);
  for (let u = 0; u < s.length; u++)
    s[u] && (f.seek(c[u]), f.rawBytes(s[u]));
  return f.toArray();
}
function a0(t) {
  const {
    coverage: e,
    backtrackClassDef: n,
    inputClassDef: o,
    lookaheadClassDef: s,
    chainedClassSeqRuleSets: r
  } = t, i = G(e), a = $t(n), c = $t(o), f = $t(s), u = r.map(
    (w) => w === null ? null : cc(w)
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
  const m = u.map((w) => {
    if (w === null) return 0;
    const _ = h;
    return h += w.length, _;
  }), y = new v(h);
  y.uint16(2), y.uint16(p), y.uint16(g), y.uint16(d), y.uint16(x), y.uint16(r.length), y.array("uint16", m), y.seek(p), y.rawBytes(i), y.seek(g), y.rawBytes(a), y.seek(d), y.rawBytes(c), y.seek(x), y.rawBytes(f);
  for (let w = 0; w < u.length; w++)
    u[w] && (y.seek(m[w]), y.rawBytes(u[w]));
  return y.toArray();
}
function c0(t) {
  const {
    backtrackCoverages: e,
    inputCoverages: n,
    lookaheadCoverages: o,
    seqLookupRecords: s
  } = t, r = e.map(G), i = n.map(G), a = o.map(G);
  let f = 4 + e.length * 2 + 2 + n.length * 2 + 2 + o.length * 2 + 2 + s.length * 4;
  const u = r.map((g) => {
    const d = f;
    return f += g.length, d;
  }), l = i.map((g) => {
    const d = f;
    return f += g.length, d;
  }), h = a.map((g) => {
    const d = f;
    return f += g.length, d;
  }), p = new v(f);
  p.uint16(3), p.uint16(e.length), p.array("uint16", u), p.uint16(n.length), p.array("uint16", l), p.uint16(o.length), p.array("uint16", h), p.uint16(s.length), oo(p, s);
  for (let g = 0; g < r.length; g++)
    p.seek(u[g]), p.rawBytes(r[g]);
  for (let g = 0; g < i.length; g++)
    p.seek(l[g]), p.rawBytes(i[g]);
  for (let g = 0; g < a.length; g++)
    p.seek(h[g]), p.rawBytes(a[g]);
  return p.toArray();
}
function cc(t) {
  const e = t.map(f0);
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
function f0(t) {
  const {
    backtrackSequence: e,
    inputGlyphCount: n,
    inputSequence: o,
    lookaheadSequence: s,
    seqLookupRecords: r
  } = t, i = 2 + e.length * 2 + 2 + o.length * 2 + 2 + s.length * 2 + 2 + r.length * 4, a = new v(i);
  return a.uint16(e.length), a.array("uint16", e), a.uint16(n), a.array("uint16", o), a.uint16(s.length), a.array("uint16", s), a.uint16(r.length), oo(a, r), a.toArray();
}
function fc(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.uint32(), r = [];
  for (let a = 0; a < s; a++)
    r.push({
      conditionSetOffset: t.uint32(),
      featureTableSubstitutionOffset: t.uint32()
    });
  const i = r.map((a) => {
    const c = a.conditionSetOffset !== 0 ? u0(t, e + a.conditionSetOffset) : null, f = a.featureTableSubstitutionOffset !== 0 ? l0(
      t,
      e + a.featureTableSubstitutionOffset
    ) : null;
    return { conditionSet: c, featureTableSubstitution: f };
  });
  return { majorVersion: n, minorVersion: o, featureVariationRecords: i };
}
function u0(t, e) {
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
function l0(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.uint16(), r = [];
  for (let i = 0; i < s; i++) {
    const a = t.uint16(), c = t.uint32(), f = Ka(t, e + c);
    r.push({ featureIndex: a, feature: f });
  }
  return { majorVersion: n, minorVersion: o, substitutions: r };
}
function uc(t) {
  const { majorVersion: e, minorVersion: n, featureVariationRecords: o } = t, s = o.map((f) => ({
    csBytes: f.conditionSet ? h0(f.conditionSet) : null,
    ftsBytes: f.featureTableSubstitution ? p0(f.featureTableSubstitution) : null
  }));
  let i = 8 + o.length * 8;
  const a = s.map((f) => {
    const u = f.csBytes ? i : 0;
    f.csBytes && (i += f.csBytes.length);
    const l = f.ftsBytes ? i : 0;
    return f.ftsBytes && (i += f.ftsBytes.length), { csOff: u, ftsOff: l };
  }), c = new v(i);
  c.uint16(e), c.uint16(n), c.uint32(o.length);
  for (const f of a)
    c.uint32(f.csOff), c.uint32(f.ftsOff);
  for (let f = 0; f < s.length; f++) {
    const u = s[f];
    u.csBytes && (c.seek(a[f].csOff), c.rawBytes(u.csBytes)), u.ftsBytes && (c.seek(a[f].ftsOff), c.rawBytes(u.ftsBytes));
  }
  return c.toArray();
}
function h0(t) {
  const e = t.conditions.map(g0);
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
function g0(t) {
  if (t.format === 1) {
    const e = new v(8);
    return e.uint16(1), e.uint16(t.axisIndex), e.int16(t.filterRangeMinValue), e.int16(t.filterRangeMaxValue), e.toArray();
  }
  throw new Error(`Unknown Condition format: ${t.format}`);
}
function p0(t) {
  const e = t.substitutions.map(
    (i) => Qa(i.feature)
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
const d0 = 8, m0 = 12;
function y0(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.offset16(), r = e.offset16(), i = n > 1 || n === 1 && o >= 1 ? e.offset32() : 0, a = [s, r, i].filter(
    (c) => c > 0
  );
  return {
    majorVersion: n,
    minorVersion: o,
    horizAxis: s ? Ar(t, s) : null,
    vertAxis: r ? Ar(t, r) : null,
    itemVariationStore: i ? Pt(
      t.slice(
        i,
        x0(t.length, i, a)
      )
    ) : null
  };
}
function x0(t, e, n) {
  return n.filter((s) => s > e).sort((s, r) => s - r)[0] ?? t;
}
function Ar(t, e) {
  if (e + 4 > t.length) return null;
  const n = new F(t);
  n.seek(e);
  const o = n.offset16(), s = n.offset16(), r = o ? S0(n, e + o) : null, i = s ? _0(n, e + s) : [];
  return { baseTagList: r, baseScriptList: i };
}
function S0(t, e) {
  t.seek(e);
  const n = t.uint16(), o = [];
  for (let s = 0; s < n; s++)
    o.push(t.tag());
  return o;
}
function _0(t, e) {
  t.seek(e);
  const n = t.uint16(), o = [];
  for (let s = 0; s < n; s++)
    o.push({ tag: t.tag(), off: t.offset16() });
  return o.map((s) => ({
    tag: s.tag,
    ...w0(t, e + s.off)
  }));
}
function w0(t, e) {
  t.seek(e);
  const n = t.offset16(), o = t.offset16(), s = t.uint16(), r = [];
  for (let i = 0; i < s; i++)
    r.push({ tag: t.tag(), off: t.offset16() });
  return {
    baseValues: n ? b0(t, e + n) : null,
    defaultMinMax: o ? Cr(t, e + o) : null,
    langSystems: r.map((i) => ({
      tag: i.tag,
      minMax: Cr(t, e + i.off)
    }))
  };
}
function b0(t, e) {
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
function Cr(t, e) {
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
      device: s ? Ce(t, e + s) : null
    };
  }
  return { format: n, coordinate: o };
}
function A0(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = e > 1 || e === 1 && n >= 1, s = vr(t.horizAxis), r = vr(t.vertAxis), i = o && t.itemVariationStore ? ne(t.itemVariationStore) : [];
  let c = o ? m0 : d0;
  const f = s.length ? c : 0;
  c += s.length;
  const u = r.length ? c : 0;
  c += r.length;
  const l = i.length ? c : 0;
  c += i.length;
  const h = new v(c);
  return h.uint16(e), h.uint16(n), h.offset16(f), h.offset16(u), o && h.offset32(l), h.rawBytes(s), h.rawBytes(r), h.rawBytes(i), h.toArray();
}
function vr(t) {
  if (!t) return [];
  if (t._raw) return t._raw;
  const e = t.baseTagList ? C0(t.baseTagList) : [], n = v0(t.baseScriptList ?? []);
  let s = 4;
  const r = e.length ? s : 0;
  s += e.length;
  const i = n.length ? s : 0;
  s += n.length;
  const a = new v(s);
  return a.offset16(r), a.offset16(i), a.rawBytes(e), a.rawBytes(n), a.toArray();
}
function C0(t) {
  const e = 2 + 4 * t.length, n = new v(e);
  n.uint16(t.length);
  for (const o of t)
    n.tag(o);
  return n.toArray();
}
function v0(t) {
  const e = 2 + 6 * t.length, n = t.map((i) => I0(i));
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
function I0(t) {
  const e = k0(t.baseValues), n = Ir(t.defaultMinMax), o = t.langSystems ?? [], s = o.map((l) => Ir(l.minMax));
  let i = 6 + 6 * o.length;
  const a = e.length ? i : 0;
  i += e.length;
  const c = n.length ? i : 0;
  i += n.length;
  const f = s.map((l) => {
    const h = l.length ? i : 0;
    return i += l.length, h;
  }), u = new v(i);
  u.offset16(a), u.offset16(c), u.uint16(o.length);
  for (let l = 0; l < o.length; l++)
    u.tag(o[l].tag), u.offset16(f[l]);
  u.rawBytes(e), u.rawBytes(n);
  for (const l of s)
    u.rawBytes(l);
  return u.toArray();
}
function k0(t) {
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
function Ir(t) {
  if (!t) return [];
  const e = t.featMinMax ?? [], n = 6 + 8 * e.length, o = Ge(t.minCoord), s = Ge(t.maxCoord), r = e.map((l) => ({
    tag: l.tag,
    min: Ge(l.minCoord),
    max: Ge(l.maxCoord)
  }));
  let i = n;
  const a = o.length ? i : 0;
  i += o.length;
  const c = s.length ? i : 0;
  i += s.length;
  const f = r.map((l) => {
    const h = l.min.length ? i : 0;
    i += l.min.length;
    const p = l.max.length ? i : 0;
    return i += l.max.length, { minOff: h, maxOff: p };
  }), u = new v(i);
  u.offset16(a), u.offset16(c), u.uint16(e.length);
  for (let l = 0; l < e.length; l++)
    u.tag(e[l].tag), u.offset16(f[l].minOff), u.offset16(f[l].maxOff);
  u.rawBytes(o), u.rawBytes(s);
  for (const l of r)
    u.rawBytes(l.min), u.rawBytes(l.max);
  return u.toArray();
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
    const e = t.device ? $n(t.device) : [], n = e.length ? 6 : 0, o = new v(6 + e.length);
    return o.uint16(3), o.int16(t.coordinate), o.offset16(n), o.rawBytes(e), o.toArray();
  }
  return [];
}
const He = 5, Kt = 8;
function xn(t) {
  return {
    height: t.uint8(),
    width: t.uint8(),
    bearingX: t.int8(),
    bearingY: t.int8(),
    advance: t.uint8()
  };
}
function _o(t, e) {
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
function Ms(t, e) {
  const n = new F(t), o = n.uint32(), s = e?.CBLC;
  if (!s?.sizes)
    return { version: o, data: Array.from(t.slice(4)) };
  const r = [];
  for (const i of s.sizes) {
    const a = [];
    for (const c of i.indexSubTables ?? [])
      a.push(O0(t, n, c));
    r.push(a);
  }
  return { version: o, bitmapData: r };
}
function Ls(t) {
  const e = t.version ?? 196608;
  if (t.data) {
    const o = t.data, s = new v(4 + o.length);
    return s.uint32(e), s.rawBytes(o), s.toArray();
  }
  const n = new v(4);
  return n.uint32(e), n.toArray();
}
function wo(t, e) {
  const n = t.version ?? 196608, o = t.bitmapData ?? [], s = e.sizes ?? [], r = [], i = [];
  let a = 4;
  for (let u = 0; u < s.length; u++) {
    const l = s[u].indexSubTables ?? [], h = o[u] ?? [], p = [];
    for (let g = 0; g < l.length; g++) {
      const d = l[g], x = h[g] ?? [], { bytes: m, info: y } = E0(x, d, a);
      p.push(y), r.push(m), a += m.length;
    }
    i.push(p);
  }
  const c = a, f = new v(c);
  f.uint32(n);
  for (const u of r)
    f.rawBytes(u);
  return { bytes: f.toArray(), offsetInfo: i };
}
function O0(t, e, n) {
  const { indexFormat: o, imageFormat: s, imageDataOffset: r } = n, i = [];
  switch (o) {
    case 1:
    case 3: {
      const a = n.sbitOffsets;
      for (let c = 0; c < a.length - 1; c++) {
        const f = r + a[c], l = r + a[c + 1] - f;
        l <= 0 ? i.push(null) : i.push(
          Sn(t, e, f, s, l)
        );
      }
      break;
    }
    case 2: {
      const a = n.lastGlyphIndex - n.firstGlyphIndex + 1, { imageSize: c } = n;
      for (let f = 0; f < a; f++) {
        const u = r + f * c;
        i.push(
          Sn(t, e, u, s, c)
        );
      }
      break;
    }
    case 4: {
      const a = n.glyphArray;
      for (let c = 0; c < a.length - 1; c++) {
        const f = r + a[c].sbitOffset, l = r + a[c + 1].sbitOffset - f;
        l <= 0 ? i.push(null) : i.push(
          Sn(t, e, f, s, l)
        );
      }
      break;
    }
    case 5: {
      const a = n.glyphIdArray.length, { imageSize: c } = n;
      for (let f = 0; f < a; f++) {
        const u = r + f * c;
        i.push(
          Sn(t, e, u, s, c)
        );
      }
      break;
    }
  }
  return i;
}
function Sn(t, e, n, o, s) {
  if (s <= 0) return null;
  e.seek(n);
  const r = (i, a) => t.slice(i, i + a);
  switch (o) {
    case 1: {
      const i = xn(e), a = r(
        e.position,
        s - He
      );
      return { smallMetrics: i, imageData: a };
    }
    case 2: {
      const i = xn(e), a = r(
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
      const i = xn(e);
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
      const i = xn(e), a = e.uint32(), c = r(e.position, a);
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
function E0(t, e, n) {
  const { indexFormat: o, imageFormat: s } = e, r = { imageDataOffset: n }, i = t.map(
    (f) => f ? T0(f, s) : []
  );
  switch (o) {
    case 1:
    case 3: {
      const f = [0];
      let u = 0;
      for (const l of i)
        u += l.length, f.push(u);
      r.sbitOffsets = f;
      break;
    }
    case 2:
    case 5: {
      r.imageSize = e.imageSize ?? (i.length > 0 ? i[0].length : 0);
      break;
    }
    case 4: {
      const f = e.glyphIdArray ?? [], u = [];
      let l = 0;
      for (let h = 0; h < i.length; h++)
        u.push({
          glyphID: f[h] ?? 0,
          sbitOffset: l
        }), l += i[h].length;
      u.push({ glyphID: 0, sbitOffset: l }), r.glyphArray = u;
      break;
    }
  }
  const a = i.reduce((f, u) => f + u.length, 0), c = new v(a);
  for (const f of i)
    c.rawBytes(f);
  return { bytes: c.toArray(), info: r };
}
function T0(t, e) {
  switch (e) {
    case 1:
    case 2: {
      const n = t.imageData ?? [], o = new v(He + n.length);
      return _o(o, t.smallMetrics ?? {}), o.rawBytes(n), o.toArray();
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
      _o(o, t.smallMetrics ?? {}), o.uint8(0), o.uint16(n.length);
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
      return _o(o, t.smallMetrics ?? {}), o.uint32(n.length), o.rawBytes(n), o.toArray();
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
function D0(t, e) {
  return Ms(t, e?.bloc ? { CBLC: e.bloc } : e);
}
function R0(t) {
  return Ls(t);
}
const lc = 48;
function Bs(t) {
  return F0(t);
}
function ye(t, e) {
  return e ? L0(t, e) : $0(t);
}
function F0(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint32(), r = [], i = [];
  for (let a = 0; a < s; a++) {
    const c = e.uint32();
    e.uint32();
    const f = e.uint32(), u = e.uint32(), l = kr(e), h = kr(e), p = e.uint16(), g = e.uint16(), d = e.uint8(), x = e.uint8(), m = e.uint8(), y = e.int8();
    r.push({
      colorRef: u,
      hori: l,
      vert: h,
      startGlyphIndex: p,
      endGlyphIndex: g,
      ppemX: d,
      ppemY: x,
      bitDepth: m,
      flags: y,
      indexSubTables: []
    }), i.push({
      indexSubTableArrayOffset: c,
      numberOfIndexSubTables: f
    });
  }
  for (let a = 0; a < s; a++) {
    const { indexSubTableArrayOffset: c, numberOfIndexSubTables: f } = i[a];
    f !== 0 && (r[a].indexSubTables = M0(
      e,
      c,
      f
    ));
  }
  return { majorVersion: n, minorVersion: o, sizes: r };
}
function M0(t, e, n) {
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
    const a = t.uint16(), c = t.uint16(), f = t.uint32(), u = {
      firstGlyphIndex: r.firstGlyphIndex,
      lastGlyphIndex: r.lastGlyphIndex,
      indexFormat: a,
      imageFormat: c,
      imageDataOffset: f
    }, l = r.lastGlyphIndex - r.firstGlyphIndex + 1;
    switch (a) {
      case 1: {
        u.sbitOffsets = t.array("uint32", l + 1);
        break;
      }
      case 2: {
        u.imageSize = t.uint32(), u.bigMetrics = le(t);
        break;
      }
      case 3: {
        u.sbitOffsets = t.array("uint16", l + 1);
        break;
      }
      case 4: {
        const h = t.uint32();
        u.glyphArray = [];
        for (let p = 0; p <= h; p++)
          u.glyphArray.push({
            glyphID: t.uint16(),
            sbitOffset: t.uint16()
          });
        break;
      }
      case 5: {
        u.imageSize = t.uint32(), u.bigMetrics = le(t);
        const h = t.uint32();
        u.glyphIdArray = t.array("uint16", h);
        break;
      }
    }
    s.push(u);
  }
  return s;
}
function L0(t, e) {
  const n = t.majorVersion ?? 2, o = t.minorVersion ?? 0, s = t.sizes ?? [], r = s.map(
    (u, l) => B0(u.indexSubTables ?? [], e[l] ?? [])
  );
  let a = 8 + s.length * lc;
  const c = [];
  for (const u of r)
    c.push(a), a += u.length;
  const f = new v(a);
  f.uint16(n), f.uint16(o), f.uint32(s.length);
  for (let u = 0; u < s.length; u++) {
    const l = s[u], h = l.indexSubTables ?? [];
    f.uint32(c[u]), f.uint32(r[u].length), f.uint32(h.length), f.uint32(l.colorRef ?? 0), Nn(f, l.hori ?? {}), Nn(f, l.vert ?? {}), f.uint16(l.startGlyphIndex ?? 0), f.uint16(l.endGlyphIndex ?? 0), f.uint8(l.ppemX ?? 0), f.uint8(l.ppemY ?? 0), f.uint8(l.bitDepth ?? 0), f.int8(l.flags ?? 0);
  }
  for (const u of r)
    f.rawBytes(u);
  return f.toArray();
}
function B0(t, e) {
  const n = t.map(
    (a, c) => V0(a, e[c] ?? {})
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
function V0(t, e) {
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
function $0(t) {
  const e = t.majorVersion ?? 2, n = t.minorVersion ?? 0, o = t.sizes ?? [], s = t.data ?? [], r = 8 + o.length * lc + s.length, i = new v(r);
  i.uint16(e), i.uint16(n), i.uint32(o.length);
  for (const a of o)
    i.uint32(a.indexSubTableArrayOffset ?? 0), i.uint32(a.indexTablesSize ?? 0), i.uint32(a.numberOfIndexSubTables ?? 0), i.uint32(a.colorRef ?? 0), Nn(i, a.hori ?? {}), Nn(i, a.vert ?? {}), i.uint16(a.startGlyphIndex ?? 0), i.uint16(a.endGlyphIndex ?? 0), i.uint8(a.ppemX ?? 0), i.uint8(a.ppemY ?? 0), i.uint8(a.bitDepth ?? 0), i.int8(a.flags ?? 0);
  return i.rawBytes(s), i.toArray();
}
function kr(t) {
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
function Nn(t, e) {
  t.int8(e.ascender ?? 0), t.int8(e.descender ?? 0), t.uint8(e.widthMax ?? 0), t.int8(e.caretSlopeNumerator ?? 0), t.int8(e.caretSlopeDenominator ?? 0), t.int8(e.caretOffset ?? 0), t.int8(e.minOriginSB ?? 0), t.int8(e.minAdvanceSB ?? 0), t.int8(e.maxBeforeBL ?? 0), t.int8(e.minAfterBL ?? 0), t.int8(e.pad1 ?? 0), t.int8(e.pad2 ?? 0);
}
function N0(t) {
  return Bs(t);
}
function G0(t) {
  return ye(t);
}
function P0(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = [], r = /* @__PURE__ */ new Set();
  for (let u = 0; u < o; u++) {
    const l = e.uint16(), h = e.uint16(), p = e.offset32();
    r.add(p), s.push({ platformID: l, encodingID: h, subtableOffset: p });
  }
  const i = [...r].sort((u, l) => u - l), a = i.map((u) => U0(e, u)), c = new Map(i.map((u, l) => [u, l])), f = s.map((u) => ({
    platformID: u.platformID,
    encodingID: u.encodingID,
    subtableIndex: c.get(u.subtableOffset)
  }));
  return { version: n, encodingRecords: f, subtables: a };
}
function U0(t, e) {
  t.seek(e);
  const n = t.uint16();
  switch (n) {
    case 0:
      return z0(t);
    case 2:
      return H0(t, e);
    case 4:
      return W0(t, e);
    case 6:
      return j0(t);
    case 8:
      return J0(t);
    case 10:
      return Q0(t);
    case 12:
      return q0(t);
    case 13:
      return Y0(t);
    case 14:
      return Z0(t, e);
    default:
      return tg(t, e, n);
  }
}
function z0(t) {
  t.skip(2);
  const e = t.uint16(), n = t.array("uint8", 256);
  return { format: 0, language: e, glyphIdArray: n };
}
function H0(t, e) {
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
  const c = t.position, u = (e + n - c) / 2, l = t.array("uint16", u);
  return { format: 2, language: o, subHeaderKeys: s, subHeaders: a, glyphIdArray: l };
}
function W0(t, e) {
  const n = t.uint16(), o = t.uint16(), r = t.uint16() / 2;
  t.skip(6);
  const i = t.array("uint16", r);
  t.skip(2);
  const a = t.array("uint16", r), c = t.array("int16", r), f = t.array("uint16", r), u = t.position, l = (n - (u - e)) / 2, h = t.array("uint16", l), p = [];
  for (let g = 0; g < r; g++)
    p.push({
      endCode: i[g],
      startCode: a[g],
      idDelta: c[g],
      idRangeOffset: f[g]
    });
  return { format: 4, language: o, segments: p, glyphIdArray: h };
}
function j0(t) {
  t.skip(2);
  const e = t.uint16(), n = t.uint16(), o = t.uint16(), s = t.array("uint16", o);
  return { format: 6, language: e, firstCode: n, glyphIdArray: s };
}
function q0(t) {
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
function Y0(t) {
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
function Z0(t, e) {
  t.skip(4);
  const n = t.uint32(), o = [];
  for (let s = 0; s < n; s++) {
    const r = t.uint24(), i = t.offset32(), a = t.offset32();
    let c = null;
    if (i !== 0) {
      const u = t.position;
      c = X0(t, e + i), t.seek(u);
    }
    let f = null;
    if (a !== 0) {
      const u = t.position;
      f = K0(
        t,
        e + a
      ), t.seek(u);
    }
    o.push({ varSelector: r, defaultUVS: c, nonDefaultUVS: f });
  }
  return { format: 14, varSelectorRecords: o };
}
function X0(t, e) {
  t.seek(e);
  const n = t.uint32(), o = [];
  for (let s = 0; s < n; s++)
    o.push({
      startUnicodeValue: t.uint24(),
      additionalCount: t.uint8()
    });
  return o;
}
function K0(t, e) {
  t.seek(e);
  const n = t.uint32(), o = [];
  for (let s = 0; s < n; s++)
    o.push({
      unicodeValue: t.uint24(),
      glyphID: t.uint16()
    });
  return o;
}
function J0(t) {
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
function Q0(t) {
  t.skip(2), t.skip(4);
  const e = t.uint32(), n = t.uint32(), o = t.uint32(), s = t.array("uint16", o);
  return { format: 10, language: e, startCharCode: n, glyphIdArray: s };
}
function tg(t, e, n) {
  let o;
  n >= 8 ? (t.skip(2), o = t.uint32()) : o = t.uint16(), t.seek(e);
  const s = t.bytes(o);
  return { format: n, _raw: s };
}
function eg(t) {
  const { version: e, encodingRecords: n, subtables: o } = t, s = n.map((l, h) => ({ rec: l, originalIndex: h })).sort((l, h) => {
    if (l.rec.platformID !== h.rec.platformID)
      return l.rec.platformID - h.rec.platformID;
    if (l.rec.encodingID !== h.rec.encodingID)
      return l.rec.encodingID - h.rec.encodingID;
    const p = (o[l.rec.subtableIndex] || {}).language || 0, g = (o[h.rec.subtableIndex] || {}).language || 0;
    return p - g;
  }).map(({ rec: l }) => l), r = o.map(ng), i = 4 + s.length * 8, a = [];
  let c = i;
  for (const l of r)
    a.push(c), c += l.length;
  const f = c, u = new v(f);
  u.uint16(e), u.uint16(s.length);
  for (const l of s)
    u.uint16(l.platformID), u.uint16(l.encodingID), u.offset32(a[l.subtableIndex]);
  for (let l = 0; l < r.length; l++)
    u.seek(a[l]), u.rawBytes(r[l]);
  return u.toArray();
}
function ng(t) {
  switch (t.format) {
    case 0:
      return og(t);
    case 2:
      return sg(t);
    case 4:
      return rg(t);
    case 6:
      return ig(t);
    case 8:
      return ag(t);
    case 10:
      return cg(t);
    case 12:
      return fg(t);
    case 13:
      return ug(t);
    case 14:
      return lg(t);
    default:
      return t._raw;
  }
}
function og(t) {
  const n = new v(262);
  return n.uint16(0), n.uint16(262), n.uint16(t.language), n.array("uint8", t.glyphIdArray), n.toArray();
}
function sg(t) {
  const { language: e, subHeaderKeys: n, subHeaders: o, glyphIdArray: s } = t, r = 518 + o.length * 8 + s.length * 2, i = new v(r);
  i.uint16(2), i.uint16(r), i.uint16(e), i.array("uint16", n);
  for (const a of o)
    i.uint16(a.firstCode), i.uint16(a.entryCount), i.int16(a.idDelta), i.uint16(a.idRangeOffset);
  return i.array("uint16", s), i.toArray();
}
function rg(t) {
  const { language: e, segments: n, glyphIdArray: o } = t, s = n.length, r = s * 2, i = Math.floor(Math.log2(s)), a = Math.pow(2, i) * 2, c = r - a, f = 14 + s * 8 + 2 + o.length * 2, u = new v(f);
  u.uint16(4), u.uint16(f), u.uint16(e), u.uint16(r), u.uint16(a), u.uint16(i), u.uint16(c);
  for (const l of n) u.uint16(l.endCode);
  u.uint16(0);
  for (const l of n) u.uint16(l.startCode);
  for (const l of n) u.int16(l.idDelta);
  for (const l of n) u.uint16(l.idRangeOffset);
  return u.array("uint16", o), u.toArray();
}
function ig(t) {
  const { language: e, firstCode: n, glyphIdArray: o } = t, s = o.length, r = 10 + s * 2, i = new v(r);
  return i.uint16(6), i.uint16(r), i.uint16(e), i.uint16(n), i.uint16(s), i.array("uint16", o), i.toArray();
}
function ag(t) {
  const { language: e, is32: n, groups: o } = t, s = 8208 + o.length * 12, r = new v(s);
  r.uint16(8), r.uint16(0), r.uint32(s), r.uint32(e), r.rawBytes(n), r.uint32(o.length);
  for (const i of o)
    r.uint32(i.startCharCode), r.uint32(i.endCharCode), r.uint32(i.startGlyphID);
  return r.toArray();
}
function cg(t) {
  const { language: e, startCharCode: n, glyphIdArray: o } = t, s = 20 + o.length * 2, r = new v(s);
  return r.uint16(10), r.uint16(0), r.uint32(s), r.uint32(e), r.uint32(n), r.uint32(o.length), r.array("uint16", o), r.toArray();
}
function fg(t) {
  const e = t.groups.length, n = 16 + e * 12, o = new v(n);
  o.uint16(12), o.uint16(0), o.uint32(n), o.uint32(t.language), o.uint32(e);
  for (const s of t.groups)
    o.uint32(s.startCharCode), o.uint32(s.endCharCode), o.uint32(s.startGlyphID);
  return o.toArray();
}
function ug(t) {
  const e = t.groups.length, n = 16 + e * 12, o = new v(n);
  o.uint16(13), o.uint16(0), o.uint32(n), o.uint32(t.language), o.uint32(e);
  for (const s of t.groups)
    o.uint32(s.startCharCode), o.uint32(s.endCharCode), o.uint32(s.glyphID);
  return o.toArray();
}
function lg(t) {
  const { varSelectorRecords: e } = t, n = e.map((c) => ({
    defaultUVSBytes: c.defaultUVS ? hg(c.defaultUVS) : null,
    nonDefaultUVSBytes: c.nonDefaultUVS ? gg(c.nonDefaultUVS) : null
  }));
  let s = 10 + e.length * 11;
  const r = n.map((c) => {
    let f = 0;
    c.defaultUVSBytes && (f = s, s += c.defaultUVSBytes.length);
    let u = 0;
    return c.nonDefaultUVSBytes && (u = s, s += c.nonDefaultUVSBytes.length), { defaultUVSOffset: f, nonDefaultUVSOffset: u };
  }), i = s, a = new v(i);
  a.uint16(14), a.uint32(i), a.uint32(e.length);
  for (let c = 0; c < e.length; c++)
    a.uint24(e[c].varSelector), a.uint32(r[c].defaultUVSOffset), a.uint32(r[c].nonDefaultUVSOffset);
  for (let c = 0; c < n.length; c++)
    n[c].defaultUVSBytes && a.rawBytes(n[c].defaultUVSBytes), n[c].nonDefaultUVSBytes && a.rawBytes(n[c].nonDefaultUVSBytes);
  return a.toArray();
}
function hg(t) {
  const e = 4 + t.length * 4, n = new v(e);
  n.uint32(t.length);
  for (const o of t)
    n.uint24(o.startUnicodeValue), n.uint8(o.additionalCount);
  return n.toArray();
}
function gg(t) {
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
], hc = 15, gc = 48;
function pg(t, e) {
  return e === 1 ? t.uint8() : e === 2 ? t.uint16() : e === 3 ? t.uint24() : t.uint32();
}
function dg(t, e, n) {
  n === 1 ? t.uint8(e) : n === 2 ? t.uint16(e) : n === 3 ? t.uint24(e) : t.uint32(e >>> 0);
}
function mg(t, e) {
  t.seek(e);
  const n = t.uint8(), o = t.uint8(), s = n === 1 ? t.uint32() : t.uint16(), r = (o & hc) + 1, i = ((o & gc) >> 4) + 1, a = [];
  for (let c = 0; c < s; c++) {
    const f = pg(t, i), u = (1 << r) - 1;
    a.push({
      outerIndex: f >> r,
      innerIndex: f & u
    });
  }
  return { format: n, entryFormat: o, mapCount: s, entries: a };
}
function yg(t) {
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
  const f = t.entryFormat ?? c - 1 << 4 | i - 1, u = o === 1 ? 6 : 4, l = (f & hc) + 1, h = ((f & gc) >> 4) + 1, p = new v(u + n * h);
  p.uint8(o), p.uint8(f), o === 1 ? p.uint32(n) : p.uint16(n);
  for (let g = 0; g < n; g++) {
    const d = e[g] ?? { outerIndex: 0, innerIndex: 0 }, x = (d.outerIndex ?? 0) << l | (d.innerIndex ?? 0) & (1 << l) - 1;
    dg(p, x, h);
  }
  return p.toArray();
}
function xg(t, e) {
  const n = /* @__PURE__ */ new Map(), o = Sg(
    t,
    e.baseGlyphListOffset,
    n
  ), s = e.layerListOffset ? _g(t, e.layerListOffset, n) : null, r = e.clipListOffset ? wg(t, e.clipListOffset) : null, i = e.varIndexMapOffset ? mg(t, e.varIndexMapOffset) : null;
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
function Sg(t, e, n) {
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
      paint: nt(t, e + i.paintOffset, n)
    });
  return s;
}
function _g(t, e, n) {
  t.seek(e);
  const o = t.uint32(), s = [];
  for (let i = 0; i < o; i++)
    s.push(t.uint32());
  const r = [];
  for (const i of s)
    r.push(nt(t, e + i, n));
  return r;
}
function wg(t, e) {
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
    clipBox: bg(t, e + i.clipBoxOffset)
  }));
  return { format: n, clips: r };
}
function bg(t, e) {
  t.seek(e);
  const n = t.uint8(), o = t.fword(), s = t.fword(), r = t.fword(), i = t.fword(), a = { format: n, xMin: o, yMin: s, xMax: r, yMax: i };
  return n === 2 && (a.varIndexBase = t.uint32()), a;
}
function Vs(t, e, n) {
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
function Ag(t, e, n) {
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
function nt(t, e, n) {
  if (n.has(e)) return n.get(e);
  t.seek(e);
  const o = t.uint8();
  let s;
  switch (o) {
    case 1:
      s = Cg(t);
      break;
    case 2:
      s = Or(t, !1);
      break;
    case 3:
      s = Or(t, !0);
      break;
    case 4:
      s = Er(t, e, !1);
      break;
    case 5:
      s = Er(t, e, !0);
      break;
    case 6:
      s = Tr(t, e, !1);
      break;
    case 7:
      s = Tr(t, e, !0);
      break;
    case 8:
      s = Dr(t, e, !1);
      break;
    case 9:
      s = Dr(t, e, !0);
      break;
    case 10:
      s = vg(t, e, n);
      break;
    case 11:
      s = Ig(t);
      break;
    case 12:
      s = Rr(t, e, n, !1);
      break;
    case 13:
      s = Rr(t, e, n, !0);
      break;
    case 14:
      s = Fr(t, e, n, !1);
      break;
    case 15:
      s = Fr(t, e, n, !0);
      break;
    case 16:
      s = Mr(t, e, n, !1);
      break;
    case 17:
      s = Mr(t, e, n, !0);
      break;
    case 18:
      s = Lr(t, e, n, !1);
      break;
    case 19:
      s = Lr(t, e, n, !0);
      break;
    case 20:
      s = Br(t, e, n, !1);
      break;
    case 21:
      s = Br(t, e, n, !0);
      break;
    case 22:
      s = Vr(t, e, n, !1);
      break;
    case 23:
      s = Vr(t, e, n, !0);
      break;
    case 24:
      s = $r(t, e, n, !1);
      break;
    case 25:
      s = $r(t, e, n, !0);
      break;
    case 26:
      s = Nr(t, e, n, !1);
      break;
    case 27:
      s = Nr(t, e, n, !0);
      break;
    case 28:
      s = Gr(t, e, n, !1);
      break;
    case 29:
      s = Gr(t, e, n, !0);
      break;
    case 30:
      s = Pr(t, e, n, !1);
      break;
    case 31:
      s = Pr(t, e, n, !0);
      break;
    case 32:
      s = kg(t, e, n);
      break;
    default:
      return s = { format: o, _unknown: !0 }, n.set(e, s), s;
  }
  return s.format = o, n.set(e, s), s;
}
function Cg(t) {
  return {
    numLayers: t.uint8(),
    firstLayerIndex: t.uint32()
  };
}
function Or(t, e) {
  const n = {
    paletteIndex: t.uint16(),
    alpha: t.f2dot14()
  };
  return e && (n.varIndexBase = t.uint32()), n;
}
function Er(t, e, n) {
  const o = t.uint24(), s = {
    x0: t.fword(),
    y0: t.fword(),
    x1: t.fword(),
    y1: t.fword(),
    x2: t.fword(),
    y2: t.fword()
  };
  return n && (s.varIndexBase = t.uint32()), s.colorLine = Vs(t, e + o, n), s;
}
function Tr(t, e, n) {
  const o = t.uint24(), s = {
    x0: t.fword(),
    y0: t.fword(),
    radius0: t.ufword(),
    x1: t.fword(),
    y1: t.fword(),
    radius1: t.ufword()
  };
  return n && (s.varIndexBase = t.uint32()), s.colorLine = Vs(t, e + o, n), s;
}
function Dr(t, e, n) {
  const o = t.uint24(), s = {
    centerX: t.fword(),
    centerY: t.fword(),
    startAngle: t.f2dot14(),
    endAngle: t.f2dot14()
  };
  return n && (s.varIndexBase = t.uint32()), s.colorLine = Vs(t, e + o, n), s;
}
function vg(t, e, n) {
  const o = t.uint24();
  return {
    glyphID: t.uint16(),
    paint: nt(t, e + o, n)
  };
}
function Ig(t) {
  return { glyphID: t.uint16() };
}
function Rr(t, e, n, o) {
  const s = t.uint24(), r = t.uint24();
  return {
    paint: nt(t, e + s, n),
    transform: Ag(t, e + r, o)
  };
}
function Fr(t, e, n, o) {
  const s = t.uint24(), r = {
    dx: t.fword(),
    dy: t.fword()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = nt(t, e + s, n), r;
}
function Mr(t, e, n, o) {
  const s = t.uint24(), r = {
    scaleX: t.f2dot14(),
    scaleY: t.f2dot14()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = nt(t, e + s, n), r;
}
function Lr(t, e, n, o) {
  const s = t.uint24(), r = {
    scaleX: t.f2dot14(),
    scaleY: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = nt(t, e + s, n), r;
}
function Br(t, e, n, o) {
  const s = t.uint24(), r = { scale: t.f2dot14() };
  return o && (r.varIndexBase = t.uint32()), r.paint = nt(t, e + s, n), r;
}
function Vr(t, e, n, o) {
  const s = t.uint24(), r = {
    scale: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = nt(t, e + s, n), r;
}
function $r(t, e, n, o) {
  const s = t.uint24(), r = { angle: t.f2dot14() };
  return o && (r.varIndexBase = t.uint32()), r.paint = nt(t, e + s, n), r;
}
function Nr(t, e, n, o) {
  const s = t.uint24(), r = {
    angle: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = nt(t, e + s, n), r;
}
function Gr(t, e, n, o) {
  const s = t.uint24(), r = {
    xSkewAngle: t.f2dot14(),
    ySkewAngle: t.f2dot14()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = nt(t, e + s, n), r;
}
function Pr(t, e, n, o) {
  const s = t.uint24(), r = {
    xSkewAngle: t.f2dot14(),
    ySkewAngle: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = nt(t, e + s, n), r;
}
function kg(t, e, n) {
  const o = t.uint24(), s = t.uint8(), r = t.uint24();
  return {
    sourcePaint: nt(t, e + o, n),
    compositeMode: s,
    backdropPaint: nt(t, e + r, n)
  };
}
function Og(t) {
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
      for (const R of es(D))
        c(R);
    }
  }
  if (e)
    for (const D of e)
      c(D.paint);
  if (n)
    for (const D of n)
      c(D);
  const f = Eg(a), u = /* @__PURE__ */ new Map();
  for (const D of f)
    u.set(D, Tg(D));
  const l = /* @__PURE__ */ new Map();
  let h = 0;
  for (const D of f)
    l.set(D, h), h += u.get(D);
  const p = h, g = e ? e.length : 0, d = 4 + g * 6, x = n ? n.length : 0, m = x > 0 ? 4 + x * 4 : 0, y = o ? Fg(o) : [], w = s ? yg(s) : [], _ = r ? ne(r) : [], S = d + m + p + y.length + w.length + _.length, b = 0, A = d, k = d + m, O = k + p, I = O + y.length, T = I + w.length, E = new v(S);
  E.uint32(g);
  for (const D of e || [])
    E.uint16(D.glyphID), E.uint32(k - b + l.get(D.paint));
  if (x > 0) {
    E.uint32(x);
    for (const D of n)
      E.uint32(k - A + l.get(D));
  }
  for (const D of f)
    Dg(
      E,
      D,
      k + l.get(D),
      l,
      k
    );
  return E.rawBytes(y), E.rawBytes(w), E.rawBytes(_), {
    bodyBytes: E.toArray(),
    bglBodyOffset: b,
    llBodyOffset: x > 0 ? A : 0,
    clipBodyOffset: y.length > 0 ? O : 0,
    dimBodyOffset: w.length > 0 ? I : 0,
    ivsBodyOffset: _.length > 0 ? T : 0
  };
}
function es(t) {
  if (!t) return [];
  const e = [];
  return t.paint && e.push(t.paint), t.sourcePaint && e.push(t.sourcePaint), t.backdropPaint && e.push(t.backdropPaint), e;
}
function Eg(t, e) {
  const n = /* @__PURE__ */ new Map();
  for (const a of t) n.set(a, 0);
  for (const a of t)
    for (const c of es(a))
      n.has(c) && n.set(c, n.get(c) + 1);
  const o = [];
  let s = 0;
  for (const a of t)
    n.get(a) === 0 && o.push(a);
  const r = [], i = /* @__PURE__ */ new Set();
  for (; s < o.length; ) {
    const a = o[s++];
    r.push(a), i.add(a);
    for (const c of es(a)) {
      if (!n.has(c)) continue;
      const f = n.get(c) - 1;
      n.set(c, f), f === 0 && o.push(c);
    }
  }
  for (const a of t)
    i.has(a) || r.push(a);
  return r;
}
function Tg(t) {
  const e = Pe[t.format] || 0, n = t.format;
  return n === 4 || n === 6 || n === 8 ? e + Ur(t.colorLine, !1) : n === 5 || n === 7 || n === 9 ? e + Ur(t.colorLine, !0) : n === 12 ? e + 24 : n === 13 ? e + 28 : e;
}
function Ur(t, e) {
  if (!t) return 0;
  const n = e ? 10 : 6;
  return 3 + t.colorStops.length * n;
}
function Dg(t, e, n, o, s) {
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
      t.uint24(i), t.fword(e.x0), t.fword(e.y0), t.fword(e.x1), t.fword(e.y1), t.fword(e.x2), t.fword(e.y2), r === 5 && t.uint32(e.varIndexBase), bo(t, e.colorLine, r === 5);
      break;
    }
    case 6:
    // PaintRadialGradient
    case 7: {
      const i = Pe[r];
      t.uint24(i), t.fword(e.x0), t.fword(e.y0), t.ufword(e.radius0), t.fword(e.x1), t.fword(e.y1), t.ufword(e.radius1), r === 7 && t.uint32(e.varIndexBase), bo(t, e.colorLine, r === 7);
      break;
    }
    case 8:
    // PaintSweepGradient
    case 9: {
      const i = Pe[r];
      t.uint24(i), t.fword(e.centerX), t.fword(e.centerY), t.f2dot14(e.startAngle), t.f2dot14(e.endAngle), r === 9 && t.uint32(e.varIndexBase), bo(t, e.colorLine, r === 9);
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
      t.uint24(i - n), t.uint24(a), Rg(t, e.transform, r === 13);
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
function bo(t, e, n) {
  t.uint8(e.extend), t.uint16(e.colorStops.length);
  for (const o of e.colorStops)
    t.f2dot14(o.stopOffset), t.uint16(o.paletteIndex), t.f2dot14(o.alpha), n && t.uint32(o.varIndexBase);
}
function Rg(t, e, n) {
  t.fixed(e.xx), t.fixed(e.yx), t.fixed(e.xy), t.fixed(e.yy), t.fixed(e.dx), t.fixed(e.dy), n && t.uint32(e.varIndexBase);
}
function Fg(t) {
  if (!t || !t.clips || t.clips.length === 0) return [];
  const e = [];
  for (const a of t.clips)
    e.push(Mg(a.clipBox));
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
function Mg(t) {
  const e = t.format === 2 ? 13 : 9, n = new v(e);
  return n.uint8(t.format), n.fword(t.xMin), n.fword(t.yMin), n.fword(t.xMax), n.fword(t.yMax), t.format === 2 && n.uint32(t.varIndexBase), n.toArray();
}
function Lg(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint32(), r = e.uint32(), i = e.uint16(), a = [];
  if (o > 0 && s > 0) {
    e.seek(s);
    for (let u = 0; u < o; u++)
      a.push({
        glyphID: e.uint16(),
        firstLayerIndex: e.uint16(),
        numLayers: e.uint16()
      });
  }
  const c = [];
  if (i > 0 && r > 0) {
    e.seek(r);
    for (let u = 0; u < i; u++)
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
    const u = e.uint32(), l = e.uint32(), h = e.uint32(), p = e.uint32(), g = e.uint32(), x = xg(e, {
      baseGlyphListOffset: u,
      layerListOffset: l,
      clipListOffset: h,
      varIndexMapOffset: p,
      itemVariationStoreOffset: g
    });
    f.baseGlyphPaintRecords = x.baseGlyphPaintRecords, f.layerPaints = x.layerPaints, f.clipList = x.clipList, f.varIndexMap = x.varIndexMap, f.itemVariationStore = x.itemVariationStore;
  }
  return f;
}
function Bg(t) {
  const { baseGlyphRecords: e, layerRecords: n } = t;
  if (t.version >= 1 && t.baseGlyphPaintRecords) {
    const l = e.length * 6, h = n.length * 4, d = 14 + 20, x = l + h, m = d + x, y = Og({
      baseGlyphPaintRecords: t.baseGlyphPaintRecords,
      layerPaints: t.layerPaints,
      clipList: t.clipList,
      varIndexMap: t.varIndexMap,
      itemVariationStore: t.itemVariationStore
    }), w = y.bodyBytes, _ = m + y.bglBodyOffset, S = y.llBodyOffset ? m + y.llBodyOffset : 0, b = y.clipBodyOffset ? m + y.clipBodyOffset : 0, A = y.dimBodyOffset ? m + y.dimBodyOffset : 0, k = y.ivsBodyOffset ? m + y.ivsBodyOffset : 0, O = m + w.length, I = new v(O);
    I.uint16(t.version), I.uint16(e.length), I.uint32(e.length > 0 ? d : 0), I.uint32(n.length > 0 ? d + l : 0), I.uint16(n.length), I.uint32(_), I.uint32(S), I.uint32(b), I.uint32(A), I.uint32(k);
    for (const T of e)
      I.uint16(T.glyphID), I.uint16(T.firstLayerIndex), I.uint16(T.numLayers);
    for (const T of n)
      I.uint16(T.glyphID), I.uint16(T.paletteIndex);
    return I.rawBytes(w), I.toArray();
  }
  const o = 14, s = e.length > 0 ? o : 0, r = e.length * 6, i = n.length > 0 ? o + r : 0, a = n.length * 4, c = o + r + a, f = new v(c);
  f.uint16(t.version), f.uint16(e.length), f.uint32(s), f.uint32(i), f.uint16(n.length);
  for (const u of e)
    f.uint16(u.glyphID), f.uint16(u.firstLayerIndex), f.uint16(u.numLayers);
  for (const u of n)
    f.uint16(u.glyphID), f.uint16(u.paletteIndex);
  return f.toArray();
}
function Vg(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.uint32(), a = [];
  for (let g = 0; g < s; g++)
    a.push(e.uint16());
  let c = 0, f = 0, u = 0;
  n >= 1 && (c = e.uint32(), f = e.uint32(), u = e.uint32()), e.seek(i);
  const l = [];
  for (let g = 0; g < r; g++)
    l.push({
      blue: e.uint8(),
      green: e.uint8(),
      red: e.uint8(),
      alpha: e.uint8()
    });
  const h = [];
  for (let g = 0; g < s; g++) {
    const d = a[g], x = [];
    for (let m = 0; m < o; m++)
      x.push({ ...l[d + m] });
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
  if (n >= 1 && u !== 0) {
    e.seek(u), p.paletteEntryLabels = [];
    for (let g = 0; g < o; g++)
      p.paletteEntryLabels.push(e.uint16());
  }
  return p;
}
function $g(t) {
  const { version: e, numPaletteEntries: n, palettes: o } = t, s = o.length, r = [], i = [];
  for (let y = 0; y < s; y++) {
    r.push(i.length);
    for (let w = 0; w < n; w++)
      i.push(o[y][w]);
  }
  const a = i.length, c = 12 + s * 2, f = e >= 1 ? 12 : 0, u = c + f, l = a * 4;
  let h = u + l, p = 0, g = 0, d = 0;
  e >= 1 && t.paletteTypes && (p = h, h += s * 4), e >= 1 && t.paletteLabels && (g = h, h += s * 2), e >= 1 && t.paletteEntryLabels && (d = h, h += n * 2);
  const x = h, m = new v(x);
  m.uint16(e), m.uint16(n), m.uint16(s), m.uint16(a), m.uint32(u);
  for (let y = 0; y < s; y++)
    m.uint16(r[y]);
  e >= 1 && (m.uint32(p), m.uint32(g), m.uint32(d));
  for (const y of i)
    m.uint8(y.blue), m.uint8(y.green), m.uint8(y.red), m.uint8(y.alpha);
  if (e >= 1 && t.paletteTypes)
    for (const y of t.paletteTypes)
      m.uint32(y);
  if (e >= 1 && t.paletteLabels)
    for (const y of t.paletteLabels)
      m.uint16(y);
  if (e >= 1 && t.paletteEntryLabels)
    for (const y of t.paletteEntryLabels)
      m.uint16(y);
  return m.toArray();
}
const Ng = 8, Gg = 12;
function Pg(t) {
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
function Ug(t) {
  const e = t.version ?? 1, n = t.flags ?? 0, s = (t.signatures ?? []).map((c) => {
    const f = zg(c);
    return {
      format: c.format ?? 1,
      bytes: f
    };
  });
  let r = Ng + s.length * Gg;
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
function zg(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
function Hg(t, e) {
  return Ms(t, e?.EBLC ? { CBLC: e.EBLC } : e);
}
function Wg(t) {
  return Ls(t);
}
function jg(t) {
  return Bs(t);
}
function qg(t) {
  return ye(t);
}
const ns = 28;
function Yg(t) {
  const e = new F(t), n = e.uint32(), o = e.uint32(), s = [];
  for (let r = 0; r < o; r++) {
    const i = e.position;
    s.push({
      hori: zr(e),
      vert: zr(e),
      substitutePpemX: e.uint8(),
      substitutePpemY: e.uint8(),
      originalPpemX: e.uint8(),
      originalPpemY: e.uint8(),
      _raw: Array.from(t.slice(i, i + ns))
    });
  }
  return { version: n, scales: s };
}
function Zg(t) {
  const e = t.version ?? 131072, n = t.scales ?? [], o = new v(8 + n.length * ns);
  o.uint32(e), o.uint32(n.length);
  for (const s of n) {
    if (s._raw && s._raw.length === ns) {
      o.rawBytes(s._raw);
      continue;
    }
    Hr(o, s.hori ?? {}), Hr(o, s.vert ?? {}), o.uint8(s.substitutePpemX ?? 0), o.uint8(s.substitutePpemY ?? 0), o.uint8(s.originalPpemX ?? 0), o.uint8(s.originalPpemY ?? 0);
  }
  return o.toArray();
}
function zr(t) {
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
function Hr(t, e) {
  t.int8(e.ascender ?? 0), t.int8(e.descender ?? 0), t.uint8(e.widthMax ?? 0), t.int8(e.caretSlopeNumerator ?? 0), t.int8(e.caretSlopeDenominator ?? 0), t.int8(e.caretOffset ?? 0), t.int8(e.minOriginSB ?? 0), t.int8(e.minAdvanceSB ?? 0), t.int8(e.maxBeforeBL ?? 0), t.int8(e.minAfterBL ?? 0), t.int8(e.pad1 ?? 0), t.int8(e.pad2 ?? 0);
}
const Wr = 16, Xg = 20;
function Kg(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.offset16(), r = e.uint16(), i = e.uint16(), a = e.uint16(), c = e.uint16(), f = e.uint16(), u = [];
  for (let d = 0; d < i; d++)
    e.seek(s + d * a), u.push({
      axisTag: e.tag(),
      minValue: e.fixed(),
      defaultValue: e.fixed(),
      maxValue: e.fixed(),
      flags: e.uint16(),
      axisNameID: e.uint16()
    });
  const l = [], h = s + i * a, p = 4 + i * 4, g = f >= p + 2;
  for (let d = 0; d < c; d++) {
    e.seek(h + d * f);
    const x = {
      subfamilyNameID: e.uint16(),
      flags: e.uint16(),
      coordinates: []
    };
    for (let m = 0; m < i; m++)
      x.coordinates.push(e.fixed());
    g && (x.postScriptNameID = e.uint16()), l.push(x);
  }
  return {
    majorVersion: n,
    minorVersion: o,
    reserved: r,
    axisSize: a,
    instanceSize: f,
    axes: u,
    instances: l
  };
}
function Jg(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.reserved ?? 2, s = t.axes ?? [], r = t.instances ?? [], i = s.length, a = Xg, c = 4 + i * 4, f = r.some(
    (d) => d.postScriptNameID !== void 0
  ), u = f ? c + 2 : c, l = r.length, h = Wr, p = Wr + i * a + l * u, g = new v(p);
  g.uint16(e), g.uint16(n), g.offset16(h), g.uint16(o), g.uint16(i), g.uint16(a), g.uint16(l), g.uint16(u);
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
function Qg(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.uint16(), a = e.uint16();
  let c = 0;
  o >= 2 && (c = e.uint16());
  let f = 0;
  o >= 3 && (f = e.uint32());
  const u = { majorVersion: n, minorVersion: o };
  return s !== 0 && (u.glyphClassDef = Vt(e, s)), r !== 0 && (u.attachList = tp(e, r)), i !== 0 && (u.ligCaretList = ep(e, i)), a !== 0 && (u.markAttachClassDef = Vt(e, a)), c !== 0 && (u.markGlyphSetsDef = op(e, c)), f !== 0 && (u.itemVarStoreOffset = f, u.itemVariationStore = Pt(
    t.slice(f)
  )), u;
}
function tp(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.array("uint16", o), r = $(t, e + n), i = s.map((a) => {
    t.seek(e + a);
    const c = t.uint16();
    return t.array("uint16", c);
  });
  return { coverage: r, attachPoints: i };
}
function ep(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.array("uint16", o), r = $(t, e + n), i = s.map(
    (a) => np(t, e + a)
  );
  return { coverage: r, ligGlyphs: i };
}
function np(t, e) {
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
      const a = t.int16(), c = t.uint16(), f = c !== 0 ? Ce(t, r + c) : null;
      return { format: i, coordinate: a, device: f };
    }
    throw new Error(`Unknown CaretValue format: ${i}`);
  });
}
function op(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = [];
  for (let i = 0; i < o; i++)
    s.push(t.uint32());
  const r = s.map(
    (i) => $(t, e + i)
  );
  return { format: n, coverages: r };
}
function sp(t) {
  const { majorVersion: e, minorVersion: n } = t, o = t.glyphClassDef ? $t(t.glyphClassDef) : null, s = t.attachList ? rp(t.attachList) : null, r = t.ligCaretList ? ap(t.ligCaretList) : null, i = t.markAttachClassDef ? $t(t.markAttachClassDef) : null, a = n >= 2 && t.markGlyphSetsDef ? up(t.markGlyphSetsDef) : null, c = n >= 3 && t.itemVariationStore ? ne(t.itemVariationStore) : null;
  let f = 12;
  n >= 2 && (f += 2), n >= 3 && (f += 4);
  let u = f;
  const l = o ? u : 0;
  o && (u += o.length);
  const h = s ? u : 0;
  s && (u += s.length);
  const p = r ? u : 0;
  r && (u += r.length);
  const g = i ? u : 0;
  i && (u += i.length);
  const d = a ? u : 0;
  a && (u += a.length);
  const x = c ? u : 0;
  c && (u += c.length);
  const m = new v(u);
  return m.uint16(e), m.uint16(n), m.uint16(l), m.uint16(h), m.uint16(p), m.uint16(g), n >= 2 && m.uint16(d), n >= 3 && m.uint32(x), o && (m.seek(l), m.rawBytes(o)), s && (m.seek(h), m.rawBytes(s)), r && (m.seek(p), m.rawBytes(r)), i && (m.seek(g), m.rawBytes(i)), a && (m.seek(d), m.rawBytes(a)), c && (m.seek(x), m.rawBytes(c)), m.toArray();
}
function rp(t) {
  const e = G(t.coverage), n = t.attachPoints.map(ip);
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
function ip(t) {
  const e = 2 + t.length * 2, n = new v(e);
  return n.uint16(t.length), n.array("uint16", t), n.toArray();
}
function ap(t) {
  const e = G(t.coverage), n = t.ligGlyphs.map(cp);
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
function cp(t) {
  const e = t.map(fp);
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
function fp(t) {
  if (t.format === 1) {
    const e = new v(4);
    return e.uint16(1), e.int16(t.coordinate), e.toArray();
  }
  if (t.format === 2) {
    const e = new v(4);
    return e.uint16(2), e.uint16(t.caretValuePointIndex), e.toArray();
  }
  if (t.format === 3) {
    const e = t.device ? $n(t.device) : null, n = 6 + (e ? e.length : 0), o = new v(n);
    return o.uint16(3), o.int16(t.coordinate), o.uint16(e ? 6 : 0), e && o.rawBytes(e), o.toArray();
  }
  throw new Error(`Unknown CaretValue format: ${t.format}`);
}
function up(t) {
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
function he(t, e, n) {
  if (e === 0) return null;
  const o = t.position, s = {};
  e & 1 && (s.xPlacement = t.int16()), e & 2 && (s.yPlacement = t.int16()), e & 4 && (s.xAdvance = t.int16()), e & 8 && (s.yAdvance = t.int16());
  const r = e & 16 ? t.uint16() : 0, i = e & 32 ? t.uint16() : 0, a = e & 64 ? t.uint16() : 0, c = e & 128 ? t.uint16() : 0, f = t.position, u = (l, h) => {
    const p = n + l, g = o + l;
    try {
      return Ce(t, p);
    } catch (d) {
      if (g !== p)
        try {
          return Ce(t, g);
        } catch {
        }
      const x = d instanceof Error ? d.message : String(d);
      throw new Error(
        `${x}; ValueRecord context: valueFormat=${e}, subtableOffset=${n}, valueRecordStart=${o}, offsets={xPla:${r},yPla:${i},xAdv:${a},yAdv:${c}}, field=${h}`
      );
    }
  };
  return r && (s.xPlaDevice = u(r, "xPlaDevice"), t.seek(f)), i && (s.yPlaDevice = u(i, "yPlaDevice"), t.seek(f)), a && (s.xAdvDevice = u(a, "xAdvDevice"), t.seek(f)), c && (s.yAdvDevice = u(c, "yAdvDevice"), t.seek(f)), s;
}
function ve(t, e) {
  if (e === 0) return null;
  t.seek(e);
  const n = t.uint16(), o = t.int16(), s = t.int16(), r = { format: n, xCoordinate: o, yCoordinate: s };
  if (n === 2)
    r.anchorPoint = t.uint16();
  else if (n === 3) {
    const i = t.uint16(), a = t.uint16();
    i && (r.xDevice = Ce(t, e + i)), a && (r.yDevice = Ce(t, e + a));
  }
  return r;
}
function $s(t, e) {
  t.seek(e);
  const n = t.uint16(), o = [];
  for (let s = 0; s < n; s++) {
    const r = t.uint16(), i = t.uint16();
    o.push({ markClass: r, anchorOffset: i });
  }
  return o.map((s) => ({
    markClass: s.markClass,
    markAnchor: ve(t, e + s.anchorOffset)
  }));
}
function lp(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.uint16();
  let a = 0;
  o >= 1 && (a = e.uint32());
  const c = {
    majorVersion: n,
    minorVersion: o,
    scriptList: Ya(e, s),
    featureList: Xa(e, r),
    lookupList: tc(e, i, pc, 9)
  };
  return a !== 0 && (c.featureVariations = fc(
    e,
    a
  )), c;
}
function pc(t, e, n) {
  switch (n) {
    case 1:
      return hp(t, e);
    case 2:
      return gp(t, e);
    case 3:
      return pp(t, e);
    case 4:
      return dp(t, e);
    case 5:
      return mp(t, e);
    case 6:
      return yp(t, e);
    case 7:
      return nc(t, e);
    case 8:
      return rc(t, e);
    case 9:
      return xp(t, e);
    default:
      throw new Error(`Unknown GPOS lookup type: ${n}`);
  }
}
function hp(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const o = t.uint16(), s = t.uint16(), r = he(t, s, e), i = $(t, e + o);
    return { format: n, coverage: i, valueFormat: s, valueRecord: r };
  }
  if (n === 2) {
    const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = [];
    for (let c = 0; c < r; c++)
      i.push(he(t, s, e));
    const a = $(t, e + o);
    return { format: n, coverage: a, valueFormat: s, valueCount: r, valueRecords: i };
  }
  throw new Error(`Unknown SinglePos format: ${n}`);
}
function gp(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = t.uint16(), c = t.array("uint16", i).map((u) => {
      const l = e + u;
      t.seek(l);
      const h = t.uint16(), p = [];
      for (let g = 0; g < h; g++) {
        const d = t.uint16(), x = he(t, s, l), m = he(t, r, l);
        p.push({ secondGlyph: d, value1: x, value2: m });
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
    const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = t.uint16(), a = t.uint16(), c = t.uint16(), f = t.uint16(), u = [];
    for (let g = 0; g < c; g++) {
      const d = [];
      for (let x = 0; x < f; x++) {
        const m = he(t, s, e), y = he(t, r, e);
        d.push({ value1: m, value2: y });
      }
      u.push(d);
    }
    const l = $(t, e + o), h = Vt(t, e + i), p = Vt(t, e + a);
    return {
      format: n,
      coverage: l,
      valueFormat1: s,
      valueFormat2: r,
      classDef1: h,
      classDef2: p,
      class1Count: c,
      class2Count: f,
      class1Records: u
    };
  }
  throw new Error(`Unknown PairPos format: ${n}`);
}
function pp(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown CursivePos format: ${n}`);
  const o = t.uint16(), s = t.uint16(), r = [];
  for (let c = 0; c < s; c++) {
    const f = t.uint16(), u = t.uint16();
    r.push({ entryAnchorOff: f, exitAnchorOff: u });
  }
  const i = $(t, e + o), a = r.map((c) => ({
    entryAnchor: c.entryAnchorOff ? ve(t, e + c.entryAnchorOff) : null,
    exitAnchor: c.exitAnchorOff ? ve(t, e + c.exitAnchorOff) : null
  }));
  return { format: n, coverage: i, entryExitRecords: a };
}
function dp(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown MarkBasePos format: ${n}`);
  const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = t.uint16(), a = t.uint16(), c = $(t, e + o), f = $(t, e + s), u = $s(t, e + i);
  t.seek(e + a);
  const l = t.uint16(), h = [];
  for (let g = 0; g < l; g++) {
    const d = t.array("uint16", r);
    h.push(d);
  }
  const p = h.map(
    (g) => g.map(
      (d) => d ? ve(t, e + a + d) : null
    )
  );
  return {
    format: n,
    markCoverage: c,
    baseCoverage: f,
    markClassCount: r,
    markArray: u,
    baseArray: p
  };
}
function mp(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown MarkLigPos format: ${n}`);
  const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = t.uint16(), a = t.uint16(), c = $(t, e + o), f = $(t, e + s), u = $s(t, e + i);
  t.seek(e + a);
  const l = t.uint16(), p = t.array("uint16", l).map((g) => {
    const d = e + a + g;
    t.seek(d);
    const x = t.uint16(), m = [];
    for (let y = 0; y < x; y++) {
      const w = t.array("uint16", r);
      m.push(w);
    }
    return m.map(
      (y) => y.map((w) => w ? ve(t, d + w) : null)
    );
  });
  return {
    format: n,
    markCoverage: c,
    ligatureCoverage: f,
    markClassCount: r,
    markArray: u,
    ligatureArray: p
  };
}
function yp(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown MarkMarkPos format: ${n}`);
  const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = t.uint16(), a = t.uint16(), c = $(t, e + o), f = $(t, e + s), u = $s(t, e + i);
  t.seek(e + a);
  const l = t.uint16(), h = [];
  for (let g = 0; g < l; g++) {
    const d = t.array("uint16", r);
    h.push(d);
  }
  const p = h.map(
    (g) => g.map(
      (d) => d ? ve(t, e + a + d) : null
    )
  );
  return {
    format: n,
    mark1Coverage: c,
    mark2Coverage: f,
    markClassCount: r,
    mark1Array: u,
    mark2Array: p
  };
}
function xp(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown ExtensionPos format: ${n}`);
  const o = t.uint16(), s = t.uint32(), r = pc(
    t,
    e + s,
    o
  );
  return { format: n, extensionLookupType: o, extensionOffset: s, subtable: r };
}
function ge(t, e, n) {
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
    const s = t.xDevice ? $n(t.xDevice) : null, r = t.yDevice ? $n(t.yDevice) : null;
    let a = 10;
    const c = s ? a : 0;
    s && (a += s.length);
    const f = r ? a : 0;
    r && (a += r.length);
    const u = new v(a);
    return u.uint16(3), u.int16(n), u.int16(o), u.uint16(c), u.uint16(f), s && (u.seek(c), u.rawBytes(s)), r && (u.seek(f), u.rawBytes(r)), u.toArray();
  }
  throw new Error(`Unknown Anchor format: ${e}`);
}
function Ns(t) {
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
function Sp(t) {
  const { majorVersion: e, minorVersion: n } = t, o = _p(t), s = Za(o.scriptList), r = Ja(o.featureList), i = ec(
    o.lookupList,
    dc,
    9
  ), a = o.featureVariations ? uc(o.featureVariations) : null;
  let c = 10;
  n >= 1 && (c += 4);
  let f = c;
  const u = f;
  f += s.length;
  const l = f;
  f += r.length;
  const h = f;
  f += i.length;
  const p = a ? f : 0;
  a && (f += a.length);
  const g = new v(f);
  return g.uint16(e), g.uint16(n), g.uint16(u), g.uint16(l), g.uint16(h), n >= 1 && g.uint32(p), g.seek(u), g.rawBytes(s), g.seek(l), g.rawBytes(r), g.seek(h), g.rawBytes(i), a && (g.seek(p), g.rawBytes(a)), g.toArray();
}
function _p(t) {
  const e = t.lookupList.lookups.map((n) => {
    if (n.lookupType !== 2 || !Array.isArray(n.subtables))
      return n;
    const o = n.subtables.flatMap((s) => s?.format !== 1 || !Array.isArray(s.pairSets) ? [s] : wp(s));
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
function wp(t) {
  const e = bp(t.coverage);
  if (e.length !== t.pairSets.length)
    return [t];
  const n = Lt(t.valueFormat1) + Lt(t.valueFormat2), o = t.pairSets.map(
    (c) => 2 + c.length * (2 + n)
  ), s = o.reduce((c, f) => c + f, 0);
  if (jr(
    t.pairSets.length,
    s
  ) <= 65535)
    return [t];
  const i = [];
  let a = 0;
  for (; a < t.pairSets.length; ) {
    let c = a, f = 0, u = !1;
    for (; c < t.pairSets.length; ) {
      const l = f + o[c], h = c - a + 1;
      if (jr(
        h,
        l
      ) > 65535)
        break;
      f = l, c += 1, u = !0;
    }
    if (!u)
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
function jr(t, e) {
  const n = 10 + t * 2, o = 4 + t * 2;
  return n + o + e;
}
function bp(t) {
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
function dc(t, e) {
  switch (e) {
    case 1:
      return Ap(t);
    case 2:
      return Cp(t);
    case 3:
      return vp(t);
    case 4:
      return Ip(t);
    case 5:
      return kp(t);
    case 6:
      return Ep(t);
    case 7:
      return oc(t);
    case 8:
      return ac(t);
    case 9:
      return Tp(t);
    default:
      throw new Error(`Unknown GPOS lookup type: ${e}`);
  }
}
function Ap(t) {
  const e = G(t.coverage), n = [];
  if (t.format === 1) {
    const o = ge(
      t.valueRecord,
      t.valueFormat,
      n
    ), r = 6 + o.length, i = r + e.length, a = new v(i);
    return a.uint16(1), a.uint16(r), a.uint16(t.valueFormat), a.rawBytes(o), a.seek(r), a.rawBytes(e), a.toArray();
  }
  if (t.format === 2) {
    const o = Lt(t.valueFormat), s = t.valueRecords.map(
      (f) => ge(f, t.valueFormat, n)
    ), i = 8 + s.length * o, a = i + e.length, c = new v(a);
    c.uint16(2), c.uint16(i), c.uint16(t.valueFormat), c.uint16(t.valueCount);
    for (const f of s) c.rawBytes(f);
    return c.seek(i), c.rawBytes(e), c.toArray();
  }
  throw new Error(`Unknown SinglePos format: ${t.format}`);
}
function Cp(t) {
  const e = G(t.coverage), n = [];
  if (t.format === 1) {
    const o = t.pairSets.map((f) => {
      const u = Lt(t.valueFormat1), l = Lt(t.valueFormat2), h = 2 + u + l, p = new v(2 + f.length * h);
      p.uint16(f.length);
      for (const g of f)
        p.uint16(g.secondGlyph), p.rawBytes(
          ge(g.value1, t.valueFormat1, n)
        ), p.rawBytes(
          ge(g.value2, t.valueFormat2, n)
        );
      return p.toArray();
    });
    let r = 10 + t.pairSets.length * 2;
    const i = r;
    r += e.length;
    const a = o.map((f) => {
      const u = r;
      return r += f.length, u;
    }), c = new v(r);
    c.uint16(1), c.uint16(i), c.uint16(t.valueFormat1), c.uint16(t.valueFormat2), c.uint16(t.pairSets.length), c.array("uint16", a), c.seek(i), c.rawBytes(e);
    for (let f = 0; f < o.length; f++)
      c.seek(a[f]), c.rawBytes(o[f]);
    return c.toArray();
  }
  if (t.format === 2) {
    const o = $t(t.classDef1), s = $t(t.classDef2), r = Lt(t.valueFormat1), i = Lt(t.valueFormat2), a = r + i;
    let u = 16 + t.class1Count * t.class2Count * a;
    const l = u;
    u += e.length;
    const h = u;
    u += o.length;
    const p = u;
    u += s.length;
    const g = new v(u);
    g.uint16(2), g.uint16(l), g.uint16(t.valueFormat1), g.uint16(t.valueFormat2), g.uint16(h), g.uint16(p), g.uint16(t.class1Count), g.uint16(t.class2Count);
    for (const d of t.class1Records)
      for (const x of d)
        g.rawBytes(
          ge(x.value1, t.valueFormat1, n)
        ), g.rawBytes(
          ge(x.value2, t.valueFormat2, n)
        );
    return g.seek(l), g.rawBytes(e), g.seek(h), g.rawBytes(o), g.seek(p), g.rawBytes(s), g.toArray();
  }
  throw new Error(`Unknown PairPos format: ${t.format}`);
}
function vp(t) {
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
    const u = c.exit ? s : 0;
    return c.exit && (s += c.exit.length), { entryOff: f, exitOff: u };
  }), a = new v(s);
  a.uint16(1), a.uint16(r), a.uint16(t.entryExitRecords.length);
  for (const c of i)
    a.uint16(c.entryOff), a.uint16(c.exitOff);
  a.seek(r), a.rawBytes(e);
  for (let c = 0; c < n.length; c++)
    n[c].entry && (a.seek(i[c].entryOff), a.rawBytes(n[c].entry)), n[c].exit && (a.seek(i[c].exitOff), a.rawBytes(n[c].exit));
  return a.toArray();
}
function Ip(t) {
  const e = G(t.markCoverage), n = G(t.baseCoverage), o = Ns(t.markArray), s = mc(t.baseArray);
  let i = 12;
  const a = i;
  i += e.length;
  const c = i;
  i += n.length;
  const f = i;
  i += o.length;
  const u = i;
  i += s.length;
  const l = new v(i);
  return l.uint16(1), l.uint16(a), l.uint16(c), l.uint16(t.markClassCount), l.uint16(f), l.uint16(u), l.seek(a), l.rawBytes(e), l.seek(c), l.rawBytes(n), l.seek(f), l.rawBytes(o), l.seek(u), l.rawBytes(s), l.toArray();
}
function mc(t) {
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
function kp(t) {
  const e = G(t.markCoverage), n = G(t.ligatureCoverage), o = Ns(t.markArray), s = Op(t.ligatureArray, t.markClassCount);
  let i = 12;
  const a = i;
  i += e.length;
  const c = i;
  i += n.length;
  const f = i;
  i += o.length;
  const u = i;
  i += s.length;
  const l = new v(i);
  return l.uint16(1), l.uint16(a), l.uint16(c), l.uint16(t.markClassCount), l.uint16(f), l.uint16(u), l.seek(a), l.rawBytes(e), l.seek(c), l.rawBytes(n), l.seek(f), l.rawBytes(o), l.seek(u), l.rawBytes(s), l.toArray();
}
function Op(t, e) {
  const n = t.map((a) => {
    const c = a.map((p) => p.map(Ke));
    let u = 2 + a.length * e * 2;
    const l = c.map(
      (p) => p.map((g) => {
        if (!g.length) return 0;
        const d = u;
        return u += g.length, d;
      })
    ), h = new v(u);
    h.uint16(a.length);
    for (let p = 0; p < a.length; p++)
      for (let g = 0; g < e; g++)
        h.uint16(l[p][g]);
    for (let p = 0; p < c.length; p++)
      for (let g = 0; g < e; g++)
        c[p][g].length && (h.seek(l[p][g]), h.rawBytes(c[p][g]));
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
function Ep(t) {
  const e = G(t.mark1Coverage), n = G(t.mark2Coverage), o = Ns(t.mark1Array), s = mc(t.mark2Array);
  let i = 12;
  const a = i;
  i += e.length;
  const c = i;
  i += n.length;
  const f = i;
  i += o.length;
  const u = i;
  i += s.length;
  const l = new v(i);
  return l.uint16(1), l.uint16(a), l.uint16(c), l.uint16(t.markClassCount), l.uint16(f), l.uint16(u), l.seek(a), l.rawBytes(e), l.seek(c), l.rawBytes(n), l.seek(f), l.rawBytes(o), l.seek(u), l.rawBytes(s), l.toArray();
}
function Tp(t) {
  const e = dc(t.subtable, t.extensionLookupType), n = 8, o = new v(n + e.length);
  return o.uint16(1), o.uint16(t.extensionLookupType), o.uint32(n), o.rawBytes(e), o.toArray();
}
function Dp(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.uint16();
  let a = 0;
  o >= 1 && (a = e.uint32());
  const c = {
    majorVersion: n,
    minorVersion: o,
    scriptList: Ya(e, s),
    featureList: Xa(e, r),
    lookupList: tc(e, i, yc, 7)
  };
  return a !== 0 && (c.featureVariations = fc(
    e,
    a
  )), c;
}
function yc(t, e, n) {
  switch (n) {
    case 1:
      return Rp(t, e);
    case 2:
      return Fp(t, e);
    case 3:
      return Mp(t, e);
    case 4:
      return Lp(t, e);
    case 5:
      return nc(t, e);
    case 6:
      return rc(t, e);
    case 7:
      return Bp(t, e);
    case 8:
      return Vp(t, e);
    default:
      throw new Error(`Unknown GSUB lookup type: ${n}`);
  }
}
function Rp(t, e) {
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
function Fp(t, e) {
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
function Mp(t, e) {
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
function Lp(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown LigatureSubst format: ${n}`);
  const o = t.uint16(), s = t.uint16(), r = t.array("uint16", s), i = $(t, e + o), a = r.map((c) => {
    const f = e + c;
    t.seek(f);
    const u = t.uint16();
    return t.array("uint16", u).map((h) => {
      t.seek(f + h);
      const p = t.uint16(), g = t.uint16(), d = t.array("uint16", g - 1);
      return { ligatureGlyph: p, componentCount: g, componentGlyphIDs: d };
    });
  });
  return { format: n, coverage: i, ligatureSets: a };
}
function Bp(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown ExtensionSubst format: ${n}`);
  const o = t.uint16(), s = t.uint32(), r = yc(
    t,
    e + s,
    o
  );
  return { format: n, extensionLookupType: o, extensionOffset: s, subtable: r };
}
function Vp(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1)
    throw new Error(`Unknown ReverseChainSingleSubst format: ${n}`);
  const o = t.uint16(), s = t.uint16(), r = t.array("uint16", s), i = t.uint16(), a = t.array("uint16", i), c = t.uint16(), f = t.array("uint16", c), u = $(t, e + o), l = r.map(
    (p) => $(t, e + p)
  ), h = a.map(
    (p) => $(t, e + p)
  );
  return {
    format: n,
    coverage: u,
    backtrackCoverages: l,
    lookaheadCoverages: h,
    substituteGlyphIDs: f
  };
}
function $p(t) {
  const { majorVersion: e, minorVersion: n } = t, o = Za(t.scriptList), s = Ja(t.featureList), r = ec(t.lookupList, xc, 7), i = t.featureVariations ? uc(t.featureVariations) : null;
  let a = 10;
  n >= 1 && (a += 4);
  let c = a;
  const f = c;
  c += o.length;
  const u = c;
  c += s.length;
  const l = c;
  c += r.length;
  const h = i ? c : 0;
  i && (c += i.length);
  const p = new v(c);
  return p.uint16(e), p.uint16(n), p.uint16(f), p.uint16(u), p.uint16(l), n >= 1 && p.uint32(h), p.seek(f), p.rawBytes(o), p.seek(u), p.rawBytes(s), p.seek(l), p.rawBytes(r), i && (p.seek(h), p.rawBytes(i)), p.toArray();
}
function xc(t, e) {
  switch (e) {
    case 1:
      return Np(t);
    case 2:
      return Gp(t);
    case 3:
      return Pp(t);
    case 4:
      return Up(t);
    case 5:
      return oc(t);
    case 6:
      return ac(t);
    case 7:
      return Hp(t);
    case 8:
      return Wp(t);
    default:
      throw new Error(`Unknown GSUB lookup type: ${e}`);
  }
}
function Np(t) {
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
function Gp(t) {
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
function Pp(t) {
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
function Up(t) {
  const e = G(t.coverage), n = t.ligatureSets.map(zp);
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
function zp(t) {
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
function Hp(t) {
  const e = xc(t.subtable, t.extensionLookupType), n = 8, o = new v(n + e.length);
  return o.uint16(1), o.uint16(t.extensionLookupType), o.uint32(n), o.rawBytes(e), o.toArray();
}
function Wp(t) {
  const e = G(t.coverage), n = t.backtrackCoverages.map(G), o = t.lookaheadCoverages.map(G);
  let r = 6 + t.backtrackCoverages.length * 2 + 2 + t.lookaheadCoverages.length * 2 + 2 + t.substituteGlyphIDs.length * 2;
  const i = r;
  r += e.length;
  const a = n.map((u) => {
    const l = r;
    return r += u.length, l;
  }), c = o.map((u) => {
    const l = r;
    return r += u.length, l;
  }), f = new v(r);
  f.uint16(1), f.uint16(i), f.uint16(t.backtrackCoverages.length), f.array("uint16", a), f.uint16(t.lookaheadCoverages.length), f.array("uint16", c), f.uint16(t.substituteGlyphIDs.length), f.array("uint16", t.substituteGlyphIDs), f.seek(i), f.rawBytes(e);
  for (let u = 0; u < n.length; u++)
    f.seek(a[u]), f.rawBytes(n[u]);
  for (let u = 0; u < o.length; u++)
    f.seek(c[u]), f.rawBytes(o[u]);
  return f.toArray();
}
const jp = 8;
function qp(t, e) {
  const n = new F(t), o = n.uint16(), s = n.uint16(), r = n.uint32(), i = e?.maxp?.numGlyphs, a = [];
  for (let c = 0; c < s && !(n.position + r > t.length || r < 2); c++) {
    const u = n.uint8(), l = n.uint8(), h = r - 2, p = typeof i == "number" ? Math.min(i, h) : h, g = n.bytes(p), d = h - p, x = d > 0 ? n.bytes(d) : [];
    a.push({
      pixelSize: u,
      maxWidth: l,
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
function Yp(t) {
  const e = t.version ?? 0, n = t.records ?? [], o = Math.max(
    0,
    ...n.map((f) => (f.widths ?? []).length)
  ), s = Zp(2 + o), r = t.sizeDeviceRecord ?? s, i = Math.max(2, r), a = jp + i * n.length, c = new v(a);
  c.uint16(e), c.uint16(n.length), c.uint32(i);
  for (const f of n) {
    c.uint8(f.pixelSize ?? 0), c.uint8(f.maxWidth ?? 0);
    const u = i - 2, l = (f.widths ?? []).slice(0, u), h = f.padding ?? [], p = l.concat(h).slice(0, u);
    for (; p.length < u; )
      p.push(0);
    c.rawBytes(p);
  }
  return c.toArray();
}
function Zp(t) {
  return t + (4 - t % 4) % 4;
}
const Xp = 54;
function os(t) {
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
function Sc(t) {
  const e = new v(Xp);
  return e.uint16(t.majorVersion), e.uint16(t.minorVersion), e.fixed(t.fontRevision), e.uint32(t.checksumAdjustment), e.uint32(t.magicNumber), e.uint16(t.flags), e.uint16(t.unitsPerEm), e.longDateTime(t.created), e.longDateTime(t.modified), e.int16(t.xMin), e.int16(t.yMin), e.int16(t.xMax), e.int16(t.yMax), e.uint16(t.macStyle), e.uint16(t.lowestRecPPEM), e.int16(t.fontDirectionHint), e.int16(t.indexToLocFormat), e.int16(t.glyphDataFormat), e.toArray();
}
const Kp = 36;
function Jp(t) {
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
function Qp(t) {
  const e = new v(Kp);
  return e.uint16(t.majorVersion), e.uint16(t.minorVersion), e.fword(t.ascender), e.fword(t.descender), e.fword(t.lineGap), e.ufword(t.advanceWidthMax), e.fword(t.minLeftSideBearing), e.fword(t.minRightSideBearing), e.fword(t.xMaxExtent), e.int16(t.caretSlopeRise), e.int16(t.caretSlopeRun), e.int16(t.caretOffset), e.int16(t.reserved1), e.int16(t.reserved2), e.int16(t.reserved3), e.int16(t.reserved4), e.int16(t.metricDataFormat), e.uint16(t.numberOfHMetrics), e.toArray();
}
function td(t, e) {
  const n = e.hhea.numberOfHMetrics, o = e.maxp.numGlyphs, s = new F(t), r = [];
  for (let c = 0; c < n; c++)
    r.push({
      advanceWidth: s.ufword(),
      lsb: s.fword()
    });
  const i = o - n, a = s.array("fword", i);
  return { hMetrics: r, leftSideBearings: a };
}
function ed(t) {
  const { hMetrics: e, leftSideBearings: n } = t, o = e.length * 4 + n.length * 2, s = new v(o);
  for (const r of e)
    s.ufword(r.advanceWidth), s.fword(r.lsb);
  return s.array("fword", n), s.toArray();
}
const nd = 20, _c = 15, wc = 48;
function od(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.offset32(), r = e.offset32(), i = e.offset32(), a = e.offset32();
  return {
    majorVersion: n,
    minorVersion: o,
    itemVariationStore: s ? Pt(
      t.slice(
        s,
        bc(t.length, s, [
          r,
          i,
          a
        ])
      )
    ) : null,
    advanceWidthMapping: Ao(
      t,
      r,
      [s, i, a]
    ),
    lsbMapping: Ao(t, i, [
      s,
      r,
      a
    ]),
    rsbMapping: Ao(t, a, [
      s,
      r,
      i
    ])
  };
}
function Ao(t, e, n) {
  if (!e)
    return null;
  const o = bc(t.length, e, n);
  if (o <= e || e >= t.length)
    return { format: 0, entryFormat: 0, mapCount: 0, entries: [], _raw: [] };
  const s = Array.from(t.slice(e, o));
  return {
    ...sd(s),
    _raw: s
  };
}
function bc(t, e, n) {
  return n.filter((s) => s > e).sort((s, r) => s - r)[0] ?? t;
}
function sd(t) {
  const e = new F(t), n = e.uint8(), o = e.uint8(), s = n === 1 ? e.uint32() : e.uint16(), r = (o & _c) + 1, i = ((o & wc) >> 4) + 1, a = [];
  for (let c = 0; c < s; c++) {
    const f = ld(e, i);
    a.push(cd(f, r));
  }
  return {
    format: n,
    entryFormat: o,
    mapCount: s,
    entries: a
  };
}
function rd(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.itemVariationStore ? ne(t.itemVariationStore) : [], s = Co(
    t.advanceWidthMapping
  ), r = Co(t.lsbMapping), i = Co(t.rsbMapping);
  let a = nd;
  const c = o.length ? a : 0;
  a += o.length;
  const f = s.length ? a : 0;
  a += s.length;
  const u = r.length ? a : 0;
  a += r.length;
  const l = i.length ? a : 0;
  a += i.length;
  const h = new v(a);
  return h.uint16(e), h.uint16(n), h.offset32(c), h.offset32(f), h.offset32(u), h.offset32(l), h.rawBytes(o), h.rawBytes(s), h.rawBytes(r), h.rawBytes(i), h.toArray();
}
function Co(t) {
  return t ? t._raw ? t._raw : id(t) : [];
}
function id(t) {
  const e = t.entries ?? [], n = t.mapCount ?? e.length, o = fd(e), s = t.format ?? (n > 65535 ? 1 : 0), r = t.entryFormat ?? o.entryFormat, i = (r & _c) + 1, a = ((r & wc) >> 4) + 1, c = s === 1 ? 6 : 4, f = new v(c + n * a);
  f.uint8(s), f.uint8(r), s === 1 ? f.uint32(n) : f.uint16(n);
  for (let u = 0; u < n; u++) {
    const l = e[u] ?? { outerIndex: 0, innerIndex: 0 }, h = ad(l, i);
    hd(f, h, a);
  }
  return f.toArray();
}
function ad(t, e) {
  const n = (1 << e) - 1;
  return (t.outerIndex ?? 0) << e | (t.innerIndex ?? 0) & n;
}
function cd(t, e) {
  const n = (1 << e) - 1;
  return {
    outerIndex: t >> e,
    innerIndex: t & n
  };
}
function fd(t) {
  let e = 0, n = 0;
  for (const a of t)
    e = Math.max(e, a.innerIndex ?? 0), n = Math.max(n, a.outerIndex ?? 0);
  let o = 1;
  for (; (1 << o) - 1 < e && o < 16; )
    o++;
  const s = n << o | e;
  let r = 1;
  for (; r < 4 && s > ud(r); )
    r++;
  return { entryFormat: r - 1 << 4 | o - 1 };
}
function ud(t) {
  return t === 1 ? 255 : t === 2 ? 65535 : t === 3 ? 16777215 : 4294967295;
}
function ld(t, e) {
  return e === 1 ? t.uint8() : e === 2 ? t.uint16() : e === 3 ? t.uint24() : t.uint32();
}
function hd(t, e, n) {
  n === 1 ? t.uint8(e) : n === 2 ? t.uint16(e) : n === 3 ? t.uint24(e) : t.uint32(e >>> 0);
}
const gd = 6, pd = 6;
function dd(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = [];
  for (let c = 0; c < s; c++)
    r.push({
      tag: e.tag(),
      offset: e.offset16()
    });
  const i = r.map((c) => c.offset).filter((c) => c > 0), a = r.map((c) => ({
    ...c,
    table: yd(t, c.offset, i)
  }));
  return {
    majorVersion: n,
    minorVersion: o,
    scripts: a
  };
}
function md(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.scripts ?? [], s = o.map((c) => xd(c.table));
  let r = gd + o.length * pd;
  const i = s.map((c) => {
    if (!c.length)
      return 0;
    const f = r;
    return r += c.length, f;
  }), a = new v(r);
  a.uint16(e), a.uint16(n), a.uint16(o.length);
  for (let c = 0; c < o.length; c++) {
    const u = (o[c].tag ?? "    ").slice(0, 4).padEnd(4, " ");
    a.tag(u), a.offset16(i[c]);
  }
  for (const c of s)
    a.rawBytes(c);
  return a.toArray();
}
function yd(t, e, n) {
  if (!e)
    return null;
  const s = n.filter((r) => r > e).sort((r, i) => r - i)[0] ?? t.length;
  return s <= e || e >= t.length ? { _raw: [] } : { _raw: Array.from(t.slice(e, s)) };
}
function xd(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
const Ac = 4, Rn = 6, Cc = 8, Fn = 8;
function Sd(t) {
  const e = new F(t);
  return (t.length >= 4 ? e.uint32() : 0) === 65536 ? Cd(t) : _d(t);
}
function _d(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = [];
  let r = Ac;
  for (let i = 0; i < o && !(r + Rn > t.length); i++) {
    e.seek(r);
    const a = e.uint16(), c = e.uint16(), f = e.uint16(), u = f >> 8 & 255, l = Math.min(
      t.length,
      r + Math.max(c, Rn)
    ), h = r + Rn, p = Array.from(t.slice(h, l)), g = {
      version: a,
      coverage: f,
      format: u
    };
    u === 0 ? Object.assign(g, vc(p)) : u === 2 ? Object.assign(g, Ic(p)) : g._raw = p, s.push(g), r = l;
  }
  return {
    formatVariant: "opentype",
    version: n,
    nTables: o,
    subtables: s
  };
}
function vc(t) {
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
function wd(t) {
  return vc(t);
}
function Ic(t) {
  const e = new F(t);
  if (t.length < 8) return { _raw: t };
  const n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = qr(e, t, o), a = qr(e, t, s), c = n > 0 ? n / 2 : 0, f = n > 0 && i.maxOffset >= r ? Math.floor((i.maxOffset - r) / n) + 1 : 1, u = [];
  for (let l = 0; l < f; l++) {
    const h = [], p = r + l * n;
    for (let g = 0; g < c; g++) {
      const d = p + g * 2;
      d + 2 <= t.length ? (e.seek(d), h.push(e.int16())) : h.push(0);
    }
    u.push(h);
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
    values: u
  };
}
function qr(t, e, n) {
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
function bd(t) {
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
  const u = [], l = s * r;
  for (let h = 0; h < l; h++)
    e.position < t.length ? u.push(e.uint8()) : u.push(0);
  return {
    glyphCount: n,
    kernValueCount: o,
    leftClassCount: s,
    rightClassCount: r,
    flags: i,
    kernValues: a,
    leftClasses: c,
    rightClasses: f,
    kernIndices: u
  };
}
function Ad(t) {
  const e = new F(t);
  if (t.length < 12) return { _raw: t };
  const n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.uint16();
  let a = 0, c = 0, f = [];
  if (o + 4 <= t.length) {
    e.seek(o), a = e.uint16(), c = e.uint16(), f = [];
    for (let m = 0; m < c; m++)
      e.position < t.length ? f.push(e.uint8()) : f.push(1);
  }
  const u = Math.min(r, t.length), l = n > 0 ? Math.floor((u - s) / n) : 0, h = [];
  for (let m = 0; m < l; m++) {
    const y = s + m * n;
    e.seek(y);
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
  for (let m = 0; m < g; m++)
    if (e.position + 4 <= t.length) {
      const y = e.uint16(), w = e.uint16();
      d.push({ newStateOffset: y, flags: w });
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
function Cd(t) {
  const e = new F(t), n = e.uint32(), o = e.uint32(), s = [];
  let r = Cc;
  for (let i = 0; i < o && !(r + Fn > t.length); i++) {
    e.seek(r);
    const a = e.uint32(), c = e.uint8(), f = e.uint8(), u = e.uint16(), l = Math.min(
      t.length,
      r + Math.max(a, Fn)
    ), h = Array.from(
      t.slice(r + Fn, l)
    ), p = {
      coverage: c,
      format: f,
      tupleIndex: u
    };
    f === 0 ? Object.assign(p, wd(h)) : f === 1 ? Object.assign(p, Ad(h)) : f === 2 ? Object.assign(p, Ic(h)) : f === 3 ? Object.assign(p, bd(h)) : p._raw = h, s.push(p), r = l;
  }
  return {
    formatVariant: "apple",
    version: n,
    nTables: o,
    subtables: s
  };
}
function vd(t) {
  return t.formatVariant === "apple" ? Od(t) : Id(t);
}
function Id(t) {
  const e = t.version ?? 0, n = t.subtables ?? [], o = n.map(
    (a) => kd(a)
  ), s = n.length, r = Ac + o.reduce((a, c) => a + c.length, 0), i = new v(r);
  i.uint16(e), i.uint16(s);
  for (const a of o)
    i.rawBytes(a);
  return i.toArray();
}
function kd(t) {
  const e = t._raw ? t._raw : t.format === 0 ? kc(t) : t.format === 2 ? Oc(t) : [], n = Rn + e.length, o = t.coverage ?? (t.format ?? 0) << 8, s = new v(n);
  return s.uint16(t.version ?? 0), s.uint16(n), s.uint16(o), s.rawBytes(e), s.toArray();
}
function kc(t) {
  const e = t.pairs ?? [], n = e.length, o = Math.floor(Math.log2(Math.max(1, n))), s = Math.pow(2, o) * 6, r = n * 6 - s, i = new v(8 + n * 6);
  i.uint16(n), i.uint16(t.searchRange ?? s), i.uint16(t.entrySelector ?? o), i.uint16(t.rangeShift ?? r);
  for (const a of e)
    i.uint16(a.left), i.uint16(a.right), i.int16(a.value);
  return i.toArray();
}
function Od(t) {
  const e = t.version ?? 65536, n = t.subtables ?? [], o = n.map((a) => {
    const c = Ed(a), f = Fn + c.length, u = new v(f);
    return u.uint32(f), u.uint8(a.coverage ?? 0), u.uint8(a.format ?? 0), u.uint16(a.tupleIndex ?? 0), u.rawBytes(c), u.toArray();
  }), s = n.length, r = Cc + o.reduce((a, c) => a + c.length, 0), i = new v(r);
  i.uint32(e), i.uint32(s);
  for (const a of o)
    i.rawBytes(a);
  return i.toArray();
}
function Ed(t) {
  if (t._raw) return t._raw;
  switch (t.format) {
    case 0:
      return kc(t);
    case 1:
      return Dd(t);
    case 2:
      return Oc(t);
    case 3:
      return Td(t);
    default:
      return [];
  }
}
function Oc(t) {
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
  } = t, u = Yr(r), l = Yr(i), h = a * c * 2, p = Math.max(
    s + h,
    n + u.length,
    o + l.length,
    8
    // header
  ), g = new v(p);
  g.uint16(e), g.uint16(n), g.uint16(o), g.uint16(s), g.seek(n), g.rawBytes(u), g.seek(o), g.rawBytes(l), g.seek(s);
  for (let d = 0; d < a; d++) {
    const x = f[d] || [];
    for (let m = 0; m < c; m++)
      g.int16(x[m] || 0);
  }
  return g.toArray();
}
function Yr(t) {
  const { firstGlyph: e, nGlyphs: n, offsets: o } = t, s = new v(4 + n * 2);
  s.uint16(e), s.uint16(n);
  for (let r = 0; r < n; r++)
    s.uint16(o[r] || 0);
  return s.toArray();
}
function Td(t) {
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
  } = t, u = o * s, l = 6 + // header: uint16 + 4×uint8
  n * 2 + // int16 values
  e + // left class uint8
  e + // right class uint8
  u, h = new v(l);
  h.uint16(e), h.uint8(n), h.uint8(o), h.uint8(s), h.uint8(r ?? 0);
  for (let p = 0; p < n; p++)
    h.int16(i[p] || 0);
  for (let p = 0; p < e; p++)
    h.uint8(a[p] || 0);
  for (let p = 0; p < e; p++)
    h.uint8(c[p] || 0);
  for (let p = 0; p < u; p++)
    h.uint8(f[p] || 0);
  return h.toArray();
}
function Dd(t) {
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
  } = t, u = 4 + (i?.nGlyphs || 0), l = (a?.length || 0) * e, h = (c?.length || 0) * 4, p = (f?.length || 0) * 2, g = Math.max(
    10,
    // header: 5 × uint16
    n + u,
    o + l,
    s + h,
    r + p
  ), d = new v(g);
  if (d.uint16(e), d.uint16(n), d.uint16(o), d.uint16(s), d.uint16(r), d.seek(n), d.uint16(i?.firstGlyph || 0), d.uint16(i?.nGlyphs || 0), i?.classArray)
    for (const x of i.classArray)
      d.uint8(x);
  if (d.seek(o), a)
    for (const x of a)
      for (const m of x)
        d.uint8(m);
  if (d.seek(s), c)
    for (const x of c)
      d.uint16(x.newStateOffset), d.uint16(x.flags);
  if (d.seek(r), f)
    for (const x of f)
      d.int16(x);
  return d.toArray();
}
function Rd(t) {
  const e = new F(t), n = e.uint32(), o = e.uint32(), s = e.uint32(), r = [], i = [];
  for (let a = 0; a < s; a++)
    i.push({ offset: e.uint16(), length: e.uint16() });
  for (const a of i) {
    const c = t.slice(a.offset, a.offset + a.length);
    r.push(new TextDecoder("utf-8").decode(new Uint8Array(c)));
  }
  return { version: n, flags: o, tags: r };
}
function Fd(t) {
  const { version: e, flags: n, tags: o } = t, s = new TextEncoder(), r = o.map((u) => s.encode(u)), i = 12 + o.length * 4, a = i + r.reduce((u, l) => u + l.length, 0), c = new v(a);
  c.uint32(e), c.uint32(n), c.uint32(o.length);
  let f = i;
  for (const u of r)
    c.uint16(f), c.uint16(u.length), f += u.length;
  for (const u of r)
    c.rawBytes(u);
  return c.toArray();
}
function Md(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.bytes(o);
  return {
    version: n,
    numGlyphs: o,
    yPels: s
  };
}
function Ld(t) {
  const e = t.version ?? 0, n = t.yPels ?? [], o = t.numGlyphs ?? n.length, s = n.slice(0, o);
  for (; s.length < o; )
    s.push(0);
  const r = new v(4 + o);
  return r.uint16(e), r.uint16(o), r.rawBytes(s), r.toArray();
}
const Bd = 10;
function Vd(t) {
  const e = new F(t), n = e.uint32(), o = e.offset16(), s = e.offset16(), r = e.offset16(), i = [
    o,
    s,
    r
  ].filter((a) => a > 0);
  return {
    version: n,
    mathConstants: vo(t, o, i),
    mathGlyphInfo: vo(t, s, i),
    mathVariants: vo(t, r, i)
  };
}
function $d(t) {
  const e = t.version ?? 65536, n = Io(t.mathConstants), o = Io(t.mathGlyphInfo), s = Io(t.mathVariants);
  let r = Bd;
  const i = n.length ? r : 0;
  r += n.length;
  const a = o.length ? r : 0;
  r += o.length;
  const c = s.length ? r : 0;
  r += s.length;
  const f = new v(r);
  return f.uint32(e), f.offset16(i), f.offset16(a), f.offset16(c), f.rawBytes(n), f.rawBytes(o), f.rawBytes(s), f.toArray();
}
function vo(t, e, n) {
  if (!e)
    return null;
  const s = n.filter((r) => r > e).sort((r, i) => r - i)[0] ?? t.length;
  return s <= e || e >= t.length ? { _raw: [] } : { _raw: Array.from(t.slice(e, s)) };
}
function Io(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
const Nd = 6, Gd = 32;
function Pd(t) {
  const e = new F(t), n = e.uint32(), o = e.uint16(), s = { version: n, numGlyphs: o };
  return n === 65536 && (s.maxPoints = e.uint16(), s.maxContours = e.uint16(), s.maxCompositePoints = e.uint16(), s.maxCompositeContours = e.uint16(), s.maxZones = e.uint16(), s.maxTwilightPoints = e.uint16(), s.maxStorage = e.uint16(), s.maxFunctionDefs = e.uint16(), s.maxInstructionDefs = e.uint16(), s.maxStackElements = e.uint16(), s.maxSizeOfInstructions = e.uint16(), s.maxComponentElements = e.uint16(), s.maxComponentDepth = e.uint16()), s;
}
function Ud(t) {
  const e = t.version === 65536, n = e ? Gd : Nd, o = new v(n);
  return o.uint32(t.version), o.uint16(t.numGlyphs), e && (o.uint16(t.maxPoints), o.uint16(t.maxContours), o.uint16(t.maxCompositePoints), o.uint16(t.maxCompositeContours), o.uint16(t.maxZones), o.uint16(t.maxTwilightPoints), o.uint16(t.maxStorage), o.uint16(t.maxFunctionDefs), o.uint16(t.maxInstructionDefs), o.uint16(t.maxStackElements), o.uint16(t.maxSizeOfInstructions), o.uint16(t.maxComponentElements), o.uint16(t.maxComponentDepth)), o.toArray();
}
function zd(t) {
  if (!t.length)
    return { version: 0, data: [] };
  const e = new F(t), n = t.length >= 2 ? e.uint16() : 0, o = t.length >= 2 ? Array.from(t.slice(2)) : [];
  return {
    version: n,
    data: o
  };
}
function Hd(t) {
  const e = t.version ?? 0, n = t.data ?? [], o = new v(2 + n.length);
  return o.uint16(e), o.rawBytes(n), o.toArray();
}
const Ec = 16, Wd = 12;
function jd(t) {
  const e = new F(t), n = e.uint32(), o = e.uint32(), s = e.uint32(), r = e.uint32(), i = [];
  for (let a = 0; a < r; a++) {
    const c = e.tag(), f = e.uint32(), u = e.uint32(), l = f, h = Math.min(t.length, l + u), p = l < Ec || l >= t.length || h < l ? [] : Array.from(t.slice(l, h));
    i.push({ tag: c, dataOffset: f, dataLength: u, data: p });
  }
  return {
    version: n,
    flags: o,
    reserved: s,
    dataMaps: i
  };
}
function qd(t) {
  const e = t.version ?? 1, n = t.flags ?? 0, o = t.reserved ?? 0, r = (t.dataMaps ?? []).map((f) => ({
    tag: (f.tag ?? "    ").slice(0, 4).padEnd(4, " "),
    data: f.data ?? []
  }));
  let i = Ec + r.length * Wd;
  const a = r.map((f) => {
    const u = i, l = f.data.length;
    return i += l, {
      tag: f.tag,
      dataOffset: u,
      dataLength: l,
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
const ss = 12, pe = 8;
function Yd(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.uint16(), a = e.offset16(), c = [];
  for (let u = 0; u < i; u++) {
    const l = ss + u * r;
    if (l >= t.length) {
      c.push({
        valueTag: "    ",
        deltaSetOuterIndex: 0,
        deltaSetInnerIndex: 0,
        _extra: []
      });
      continue;
    }
    e.seek(l);
    const h = {
      valueTag: e.tag(),
      deltaSetOuterIndex: e.uint16(),
      deltaSetInnerIndex: e.uint16()
    };
    r > pe && (h._extra = e.bytes(r - pe)), c.push(h);
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
function Zd(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.reserved ?? 0, s = [...t.valueRecords ?? []].sort(
    (p, g) => Xd(p.valueTag, g.valueTag)
  ), r = t.valueRecordSize ?? pe, i = s.reduce((p, g) => {
    const d = g._extra?.length ?? 0;
    return Math.max(p, pe + d);
  }, pe), a = Math.max(
    r,
    i
  ), c = s.length, f = t.itemVariationStore ? ne(t.itemVariationStore) : [], u = f.length > 0 || c > 0 ? ss + c * a : 0, l = u > 0 ? u + f.length : ss, h = new v(l);
  h.uint16(e), h.uint16(n), h.uint16(o), h.uint16(a), h.uint16(c), h.offset16(u);
  for (const p of s) {
    h.tag(p.valueTag ?? "    "), h.uint16(p.deltaSetOuterIndex ?? 0), h.uint16(p.deltaSetInnerIndex ?? 0);
    const g = p._extra ?? [];
    h.rawBytes(g);
    const d = a - pe - g.length;
    d > 0 && h.rawBytes(new Array(d).fill(0));
  }
  return h.rawBytes(f), h.toArray();
}
function Xd(t, e) {
  const n = t ?? "    ", o = e ?? "    ";
  for (let s = 0; s < 4; s++) {
    const r = n.charCodeAt(s) - o.charCodeAt(s);
    if (r !== 0)
      return r;
  }
  return 0;
}
const rs = [
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
], Gs = /* @__PURE__ */ new Map();
for (let t = 0; t < 128; t++)
  Gs.set(t, t);
for (let t = 0; t < rs.length; t++)
  Gs.set(rs[t], 128 + t);
function Kd(t, e, n) {
  return e === 0 || e === 3 ? is(t) : e === 1 && n === 0 ? Qd(t) : t.length % 2 === 0 ? is(t) : "0x:" + t.map((o) => o.toString(16).padStart(2, "0")).join("");
}
function Jd(t, e, n) {
  if (t.startsWith("0x:")) {
    const o = t.slice(3), s = [];
    for (let r = 0; r < o.length; r += 2)
      s.push(parseInt(o.slice(r, r + 2), 16));
    return s;
  }
  return e === 0 || e === 3 ? as(t) : e === 1 && n === 0 ? t1(t) : as(t);
}
function is(t) {
  const e = [];
  for (let n = 0; n + 1 < t.length; n += 2) {
    const o = t[n] << 8 | t[n + 1];
    e.push(o);
  }
  return String.fromCharCode(...e);
}
function as(t) {
  const e = [];
  for (let n = 0; n < t.length; n++) {
    const o = t.charCodeAt(n);
    e.push(o >> 8 & 255, o & 255);
  }
  return e;
}
function Qd(t) {
  return t.map((e) => e < 128 ? String.fromCharCode(e) : String.fromCharCode(rs[e - 128])).join("");
}
function t1(t) {
  const e = [];
  for (let n = 0; n < t.length; n++) {
    const o = t.charCodeAt(n), s = Gs.get(o);
    e.push(s !== void 0 ? s : 63);
  }
  return e;
}
function e1(t) {
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
    for (let u = 0; u < f; u++) {
      const l = e.uint16(), h = e.uint16(), p = t.slice(
        s + h,
        s + h + l
      );
      i.push({
        tag: is(p)
      });
    }
  }
  const a = r.map((f) => {
    const u = t.slice(
      s + f.stringOffset,
      s + f.stringOffset + f.length
    );
    return {
      platformID: f.platformID,
      encodingID: f.encodingID,
      languageID: f.languageID,
      nameID: f.nameID,
      value: Kd(u, f.platformID, f.encodingID)
    };
  }), c = { version: n, names: a };
  return n === 1 && i.length > 0 && (c.langTagRecords = i), c;
}
function n1(t) {
  const { version: e, names: n, langTagRecords: o = [] } = t, r = [...n].sort((S, b) => S.platformID !== b.platformID ? S.platformID - b.platformID : S.encodingID !== b.encodingID ? S.encodingID - b.encodingID : S.languageID !== b.languageID ? S.languageID - b.languageID : S.nameID - b.nameID).map((S) => ({
    platformID: S.platformID,
    encodingID: S.encodingID,
    languageID: S.languageID,
    nameID: S.nameID,
    bytes: Jd(S.value, S.platformID, S.encodingID)
  })), i = o.map((S) => as(S.tag)), a = 6, c = 12, l = e === 1 ? (e === 1 ? 2 : 0) + o.length * 4 : 0, h = a + r.length * c + l, p = [];
  let g = 0;
  const d = /* @__PURE__ */ new Map();
  function x(S) {
    const b = S.join(",");
    if (d.has(b))
      return d.get(b);
    const A = g;
    return d.set(b, A), p.push(S), g += S.length, A;
  }
  const m = r.map((S) => ({
    ...S,
    stringOffset: x(S.bytes),
    stringLength: S.bytes.length
  })), y = i.map((S) => ({
    stringOffset: x(S),
    stringLength: S.length
  })), w = h + g, _ = new v(w);
  _.uint16(e), _.uint16(r.length), _.uint16(h);
  for (const S of m)
    _.uint16(S.platformID).uint16(S.encodingID).uint16(S.languageID).uint16(S.nameID).uint16(S.stringLength).uint16(S.stringOffset);
  if (e === 1) {
    _.uint16(y.length);
    for (const S of y)
      _.uint16(S.stringLength).uint16(S.stringOffset);
  }
  for (const S of p)
    _.rawBytes(S);
  return _.toArray();
}
const Tc = 78, Dc = 86, Rc = 96, Fc = 100;
function o1(t) {
  const e = new F(t), n = t.length, o = {};
  return o.version = e.uint16(), o.xAvgCharWidth = e.fword(), o.usWeightClass = e.uint16(), o.usWidthClass = e.uint16(), o.fsType = e.uint16(), o.ySubscriptXSize = e.fword(), o.ySubscriptYSize = e.fword(), o.ySubscriptXOffset = e.fword(), o.ySubscriptYOffset = e.fword(), o.ySuperscriptXSize = e.fword(), o.ySuperscriptYSize = e.fword(), o.ySuperscriptXOffset = e.fword(), o.ySuperscriptYOffset = e.fword(), o.yStrikeoutSize = e.fword(), o.yStrikeoutPosition = e.fword(), o.sFamilyClass = e.int16(), o.panose = e.bytes(10), o.ulUnicodeRange1 = e.uint32(), o.ulUnicodeRange2 = e.uint32(), o.ulUnicodeRange3 = e.uint32(), o.ulUnicodeRange4 = e.uint32(), o.achVendID = e.tag(), o.fsSelection = e.uint16(), o.usFirstCharIndex = e.uint16(), o.usLastCharIndex = e.uint16(), n < Tc || (o.sTypoAscender = e.fword(), o.sTypoDescender = e.fword(), o.sTypoLineGap = e.fword(), o.usWinAscent = e.ufword(), o.usWinDescent = e.ufword(), o.version < 1 || n < Dc) || (o.ulCodePageRange1 = e.uint32(), o.ulCodePageRange2 = e.uint32(), o.version < 2 || n < Rc) || (o.sxHeight = e.fword(), o.sCapHeight = e.fword(), o.usDefaultChar = e.uint16(), o.usBreakChar = e.uint16(), o.usMaxContext = e.uint16(), o.version < 5 || n < Fc) || (o.usLowerOpticalPointSize = e.uint16(), o.usUpperOpticalPointSize = e.uint16()), o;
}
function s1(t) {
  const e = t.version;
  let n;
  e >= 5 ? n = Fc : e >= 2 ? n = Rc : e >= 1 ? n = Dc : n = t.sTypoAscender !== void 0 ? Tc : 68;
  const o = new v(n);
  return o.uint16(e).fword(t.xAvgCharWidth).uint16(t.usWeightClass).uint16(t.usWidthClass).uint16(t.fsType).fword(t.ySubscriptXSize).fword(t.ySubscriptYSize).fword(t.ySubscriptXOffset).fword(t.ySubscriptYOffset).fword(t.ySuperscriptXSize).fword(t.ySuperscriptYSize).fword(t.ySuperscriptXOffset).fword(t.ySuperscriptYOffset).fword(t.yStrikeoutSize).fword(t.yStrikeoutPosition).int16(t.sFamilyClass).rawBytes(t.panose).uint32(t.ulUnicodeRange1).uint32(t.ulUnicodeRange2).uint32(t.ulUnicodeRange3).uint32(t.ulUnicodeRange4).tag(t.achVendID).uint16(t.fsSelection).uint16(t.usFirstCharIndex).uint16(t.usLastCharIndex), n <= 68 || (o.fword(t.sTypoAscender).fword(t.sTypoDescender).fword(t.sTypoLineGap).ufword(t.usWinAscent).ufword(t.usWinDescent), e < 1) || (o.uint32(t.ulCodePageRange1).uint32(t.ulCodePageRange2), e < 2) || (o.fword(t.sxHeight).fword(t.sCapHeight).uint16(t.usDefaultChar).uint16(t.usBreakChar).uint16(t.usMaxContext), e < 5) || o.uint16(t.usLowerOpticalPointSize).uint16(t.usUpperOpticalPointSize), o.toArray();
}
const r1 = 54;
function i1(t) {
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
    typeface: ko(e.bytes(16)),
    characterComplement: ko(e.bytes(8)),
    fileName: ko(e.bytes(6)),
    strokeWeight: e.int8(),
    widthType: e.int8(),
    serifStyle: e.uint8(),
    reserved: e.uint8()
  };
}
function a1(t) {
  const e = new v(r1);
  return e.uint32(t.version ?? 65536), e.uint32(t.fontNumber ?? 0), e.uint16(t.pitch ?? 0), e.uint16(t.xHeight ?? 0), e.uint16(t.style ?? 0), e.uint16(t.typeFamily ?? 0), e.uint16(t.capHeight ?? 0), e.uint16(t.symbolSet ?? 0), e.rawBytes(Oo(t.typeface ?? "", 16)), e.rawBytes(Oo(t.characterComplement ?? "", 8)), e.rawBytes(Oo(t.fileName ?? "", 6)), e.int8(t.strokeWeight ?? 0), e.int8(t.widthType ?? 0), e.uint8(t.serifStyle ?? 0), e.uint8(t.reserved ?? 0), e.toArray();
}
function ko(t) {
  return String.fromCharCode(...t).replace(/\0+$/g, "");
}
function Oo(t, e) {
  const n = new Array(e).fill(0);
  for (let o = 0; o < e && o < t.length; o++) {
    const s = t.charCodeAt(o);
    n[o] = s >= 0 && s <= 127 ? s : 63;
  }
  return n;
}
const Ps = 32, cs = [
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
], Mc = new Map(
  cs.map((t, e) => [t, e])
);
function c1(t) {
  const e = new F(t), n = e.uint32(), o = e.fixed(), s = e.fword(), r = e.fword(), i = e.uint32(), a = e.uint32(), c = e.uint32(), f = e.uint32(), u = e.uint32(), l = {
    version: n,
    italicAngle: o,
    underlinePosition: s,
    underlineThickness: r,
    isFixedPitch: i,
    minMemType42: a,
    maxMemType42: c,
    minMemType1: f,
    maxMemType1: u
  };
  if (n === 65536 || n === 196608)
    return l;
  if (n === 131072) {
    const h = e.uint16(), p = e.array("uint16", h);
    let g = -1;
    for (const y of p)
      y > g && (g = y);
    const d = g >= 258 ? g - 258 + 1 : 0, x = [];
    for (let y = 0; y < d; y++) {
      const w = e.uint8(), _ = e.bytes(w);
      x.push(String.fromCharCode(..._));
    }
    const m = p.map((y) => y < 258 ? cs[y] : x[y - 258]);
    return l.glyphNames = m, l;
  }
  if (n === 151552) {
    const h = e.uint16(), g = e.array("int8", h).map(
      (d, x) => cs[x + d]
    );
    return l.glyphNames = g, l;
  }
  return l;
}
function Lc(t) {
  const { version: e } = t;
  return e === 65536 || e === 196608 ? Zr(t) : e === 131072 ? f1(t) : e === 151552 ? u1(t) : Zr(t);
}
function Zr(t) {
  const e = new v(Ps);
  return e.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), e.toArray();
}
function f1(t) {
  const { glyphNames: e } = t, n = e.length, o = [], s = [], r = /* @__PURE__ */ new Map();
  for (const f of e) {
    const u = Mc.get(f);
    u !== void 0 ? o.push(u) : (r.has(f) || (r.set(f, s.length), s.push(f)), o.push(258 + r.get(f)));
  }
  let i = 0;
  for (const f of s)
    i += 1 + f.length;
  const a = Ps + 2 + n * 2 + i, c = new v(a);
  c.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), c.uint16(n);
  for (const f of o)
    c.uint16(f);
  for (const f of s) {
    c.uint8(f.length);
    for (let u = 0; u < f.length; u++)
      c.uint8(f.charCodeAt(u));
  }
  return c.toArray();
}
function u1(t) {
  const { glyphNames: e } = t, n = e.length, o = Ps + 2 + n, s = new v(o);
  s.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), s.uint16(n);
  for (let r = 0; r < n; r++) {
    const i = e[r], c = Mc.get(i) - r;
    s.int8(c);
  }
  return s.toArray();
}
function l1(t, e) {
  const n = new F(t), o = n.uint16(), s = n.uint16(), r = n.uint32(), i = n.array("uint32", r);
  let a = e?.maxp?.numGlyphs;
  const c = [];
  for (let f = 0; f < r; f++) {
    const u = i[f], l = i[f + 1] ?? t.length;
    if (u >= t.length || l <= u) {
      c.push({ ppem: 0, ppi: 0, glyphs: [] });
      continue;
    }
    n.seek(u);
    const h = n.uint16(), p = n.uint16();
    a == null && (a = (n.uint32() - 4) / 4 - 1, n.seek(u + 4));
    const g = n.array("uint32", a + 1), d = [];
    for (let x = 0; x < a; x++) {
      const m = u + g[x], y = u + g[x + 1], w = y - m;
      if (w <= 0) {
        d.push(null);
        continue;
      }
      n.seek(m);
      const _ = n.int16(), S = n.int16(), b = n.tag(), A = w > 8 ? t.slice(m + 8, y) : [];
      d.push({ originOffsetX: _, originOffsetY: S, graphicType: b, imageData: A });
    }
    c.push({ ppem: h, ppi: p, glyphs: d });
  }
  return { version: o, flags: s, strikes: c };
}
function h1(t) {
  const e = t.version ?? 1, n = t.flags ?? 0, o = t.strikes ?? [], s = o.map((f) => f._raw ? f._raw : g1(f));
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
function g1(t) {
  const e = t.glyphs ?? [], n = e.length, o = e.map((u) => {
    if (!u) return [];
    const l = u.imageData ?? [], h = new v(8 + l.length);
    return h.int16(u.originOffsetX ?? 0), h.int16(u.originOffsetY ?? 0), h.tag(u.graphicType ?? "png "), h.rawBytes(l), h.toArray();
  });
  let i = 4 + (n + 1) * 4;
  const a = [];
  for (const u of o)
    a.push(i), i += u.length;
  a.push(i);
  const c = i, f = new v(c);
  f.uint16(t.ppem ?? 0), f.uint16(t.ppi ?? 0);
  for (const u of a)
    f.uint32(u);
  for (const u of o)
    f.rawBytes(u);
  return f.toArray();
}
const p1 = 18, Bc = 20, de = 8;
function d1(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.offset32(), a = e.uint16(), c = e.offset32();
  let f;
  o >= 1 && t.length >= Bc && (f = e.uint16());
  const u = [];
  if (r > 0 && i > 0)
    for (let g = 0; g < r; g++) {
      e.seek(i + g * s);
      const d = {
        axisTag: e.tag(),
        axisNameID: e.uint16(),
        axisOrdering: e.uint16()
      };
      s > de && (d._extra = e.bytes(s - de)), u.push(d);
    }
  const l = [];
  if (a > 0 && c > 0) {
    e.seek(c);
    for (let g = 0; g < a; g++)
      l.push(e.offset16());
  }
  const h = [];
  for (let g = 0; g < l.length; g++) {
    const d = l[g], x = c + d;
    let m = t.length;
    for (let y = 0; y < l.length; y++) {
      const w = c + l[y];
      w > x && w < m && (m = w);
    }
    if (x >= t.length) {
      h.push({ format: 0, _raw: [] });
      continue;
    }
    h.push(m1(t, x, m));
  }
  const p = {
    majorVersion: n,
    minorVersion: o,
    designAxisSize: s,
    designAxes: u,
    axisValues: h
  };
  return f !== void 0 && (p.elidedFallbackNameID = f), p;
}
function m1(t, e, n) {
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
function y1(t) {
  const e = t.majorVersion ?? 1;
  let n = t.minorVersion ?? 2;
  const o = t.designAxes ?? [], s = t.axisValues ?? [], r = t.designAxisSize ?? de, i = o.reduce((b, A) => {
    const k = A._extra?.length ?? 0;
    return Math.max(b, de + k);
  }, de), a = Math.max(
    r,
    i
  ), c = n >= 1 || t.elidedFallbackNameID !== void 0;
  c && n === 0 && (n = 1);
  const f = c ? Bc : p1, u = o.length, l = s.length, h = u > 0 ? f : 0, p = u * a, g = l > 0 ? f + p : 0, d = l * 2, x = s.map(
    (b) => x1(b)
  );
  let m = d;
  const y = x.map((b) => {
    const A = m;
    return m += b.length, A;
  }), w = x.reduce(
    (b, A) => b + A.length,
    0
  ), _ = f + p + d + w, S = new v(_);
  S.uint16(e), S.uint16(n), S.uint16(a), S.uint16(u), S.offset32(h), S.uint16(l), S.offset32(g), c && S.uint16(t.elidedFallbackNameID ?? 2);
  for (const b of o) {
    S.tag(b.axisTag), S.uint16(b.axisNameID ?? 0), S.uint16(b.axisOrdering ?? 0);
    const A = b._extra ?? [];
    S.rawBytes(A);
    const k = a - de - A.length;
    k > 0 && S.rawBytes(new Array(k).fill(0));
  }
  for (const b of y)
    S.offset16(b);
  for (const b of x)
    S.rawBytes(b);
  return S.toArray();
}
function x1(t) {
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
function S1(t) {
  const e = new F(t), n = e.uint16(), o = e.uint32();
  e.uint32(), e.seek(o);
  const s = e.uint16(), r = [];
  for (let u = 0; u < s; u++)
    r.push({
      startGlyphID: e.uint16(),
      endGlyphID: e.uint16(),
      svgDocOffset: e.uint32(),
      svgDocLength: e.uint32()
    });
  const i = new TextDecoder("utf-8"), a = /* @__PURE__ */ new Map(), c = [];
  for (const u of r) {
    const l = `${u.svgDocOffset}:${u.svgDocLength}`;
    if (!a.has(l)) {
      const h = o + u.svgDocOffset, p = t.slice(h, h + u.svgDocLength), g = p.length >= 3 && p[0] === 31 && p[1] === 139 && p[2] === 8, d = c.length;
      if (g)
        c.push({ compressed: !0, data: p });
      else {
        const x = i.decode(new Uint8Array(p));
        c.push({ compressed: !1, text: x });
      }
      a.set(l, d);
    }
  }
  const f = [];
  for (const u of r) {
    const l = `${u.svgDocOffset}:${u.svgDocLength}`;
    f.push({
      startGlyphID: u.startGlyphID,
      endGlyphID: u.endGlyphID,
      documentIndex: a.get(l)
    });
  }
  return {
    version: n,
    documents: c,
    entries: f
  };
}
function _1(t) {
  const { version: e, documents: n, entries: o } = t, s = new TextEncoder(), r = n.map((g) => g.compressed ? g.data instanceof Uint8Array ? Array.from(g.data) : g.data : Array.from(s.encode(g.text))), a = 10, c = o.length;
  let u = 2 + c * 12;
  const l = [];
  for (let g = 0; g < r.length; g++) {
    const d = r[g];
    l.push({ offset: u, length: d.length }), u += d.length;
  }
  const h = a + u, p = new v(h);
  p.uint16(e), p.uint32(a), p.uint32(0), p.uint16(c);
  for (const g of o) {
    const d = l[g.documentIndex];
    p.uint16(g.startGlyphID), p.uint16(g.endGlyphID), p.uint32(d.offset), p.uint32(d.length);
  }
  for (const g of r)
    for (const d of g)
      p.uint8(d);
  return p.toArray();
}
const w1 = 6, b1 = 4, A1 = 2, Vc = 6;
function C1(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = [];
  for (let l = 0; l < s; l++)
    r.push({
      bCharSet: e.uint8(),
      xRatio: e.uint8(),
      yStartRatio: e.uint8(),
      yEndRatio: e.uint8()
    });
  const i = [];
  for (let l = 0; l < s; l++)
    i.push(e.offset16());
  const a = [...new Set(i)].sort((l, h) => l - h), c = a.map((l) => I1(t, l)), f = new Map(
    a.map((l, h) => [l, h])
  ), u = r.map((l, h) => ({
    ...l,
    groupIndex: f.get(i[h]) ?? 0
  }));
  return {
    version: n,
    numRecs: o,
    numRatios: s,
    ratios: u,
    groups: c
  };
}
function v1(t) {
  const e = t.version ?? 0, n = t.ratios ?? [], o = t.groups ?? [], s = o.map((u) => k1(u)), r = t.numRecs ?? Math.max(0, ...o.map((u) => (u.entries ?? []).length)), i = n.length;
  let a = w1 + i * b1 + i * A1;
  const c = s.map((u) => {
    const l = a;
    return a += u.length, l;
  }), f = new v(a);
  f.uint16(e), f.uint16(r), f.uint16(i);
  for (const u of n)
    f.uint8(u.bCharSet ?? 0), f.uint8(u.xRatio ?? 0), f.uint8(u.yStartRatio ?? 0), f.uint8(u.yEndRatio ?? 0);
  for (const u of n) {
    const l = u.groupIndex ?? 0, h = c[l] ?? 0;
    f.offset16(h);
  }
  for (const u of s)
    f.rawBytes(u);
  return f.toArray();
}
function I1(t, e) {
  if (!e || e >= t.length)
    return { recs: 0, startsz: 0, endsz: 0, entries: [] };
  const n = new F(t, e), o = n.uint16(), s = n.uint8(), r = n.uint8(), i = [];
  for (let a = 0; a < o && !(n.position + Vc > t.length); a++)
    i.push({
      yPelHeight: n.uint16(),
      yMax: n.int16(),
      yMin: n.int16()
    });
  return { recs: o, startsz: s, endsz: r, entries: i };
}
function k1(t) {
  const e = t.entries ?? [], n = t.recs ?? e.length, o = e.slice(0, n);
  for (; o.length < n; )
    o.push({ yPelHeight: 0, yMax: 0, yMin: 0 });
  const s = new v(4 + n * Vc);
  s.uint16(n), s.uint8(t.startsz ?? 0), s.uint8(t.endsz ?? 0);
  for (const r of o)
    s.uint16(r.yPelHeight ?? 0), s.int16(r.yMax ?? 0), s.int16(r.yMin ?? 0);
  return s.toArray();
}
const O1 = 36;
function E1(t) {
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
function T1(t) {
  const e = new v(O1);
  return e.uint32(t.version), e.fword(t.vertTypoAscender), e.fword(t.vertTypoDescender), e.fword(t.vertTypoLineGap), e.ufword(t.advanceHeightMax), e.fword(t.minTopSideBearing), e.fword(t.minBottomSideBearing), e.fword(t.yMaxExtent), e.int16(t.caretSlopeRise), e.int16(t.caretSlopeRun), e.int16(t.caretOffset), e.int16(t.reserved1), e.int16(t.reserved2), e.int16(t.reserved3), e.int16(t.reserved4), e.int16(t.metricDataFormat), e.uint16(t.numOfLongVerMetrics), e.toArray();
}
function D1(t, e) {
  const n = e.vhea.numOfLongVerMetrics, o = e.maxp.numGlyphs, s = new F(t), r = [];
  for (let c = 0; c < n; c++)
    r.push({
      advanceHeight: s.ufword(),
      topSideBearing: s.fword()
    });
  const i = o - n, a = s.array("fword", i);
  return { vMetrics: r, topSideBearings: a };
}
function R1(t) {
  const { vMetrics: e, topSideBearings: n } = t, o = e.length * 4 + n.length * 2, s = new v(o);
  for (const r of e)
    s.ufword(r.advanceHeight), s.fword(r.topSideBearing);
  return s.array("fword", n), s.toArray();
}
const F1 = 24, $c = 15, Nc = 48;
function M1(t) {
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
        Gc(t.length, s, f)
      )
    ) : null,
    advanceHeightMapping: _n(
      t,
      r,
      f
    ),
    tsbMapping: _n(
      t,
      i,
      f
    ),
    bsbMapping: _n(
      t,
      a,
      f
    ),
    vOrgMapping: _n(
      t,
      c,
      f
    )
  };
}
function _n(t, e, n) {
  if (!e)
    return null;
  const o = Gc(t.length, e, n);
  if (o <= e || e >= t.length)
    return { format: 0, entryFormat: 0, mapCount: 0, entries: [], _raw: [] };
  const s = Array.from(t.slice(e, o));
  return {
    ...L1(s),
    _raw: s
  };
}
function Gc(t, e, n) {
  return n.filter((s) => s > e).sort((s, r) => s - r)[0] ?? t;
}
function L1(t) {
  const e = new F(t), n = e.uint8(), o = e.uint8(), s = n === 1 ? e.uint32() : e.uint16(), r = (o & $c) + 1, i = ((o & Nc) >> 4) + 1, a = [];
  for (let c = 0; c < s; c++) {
    const f = U1(e, i);
    a.push(N1(f, r));
  }
  return {
    format: n,
    entryFormat: o,
    mapCount: s,
    entries: a
  };
}
function B1(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.itemVariationStore ? ne(t.itemVariationStore) : [], s = wn(
    t.advanceHeightMapping
  ), r = wn(t.tsbMapping), i = wn(t.bsbMapping), a = wn(t.vOrgMapping);
  let c = F1;
  const f = o.length ? c : 0;
  c += o.length;
  const u = s.length ? c : 0;
  c += s.length;
  const l = r.length ? c : 0;
  c += r.length;
  const h = i.length ? c : 0;
  c += i.length;
  const p = a.length ? c : 0;
  c += a.length;
  const g = new v(c);
  return g.uint16(e), g.uint16(n), g.offset32(f), g.offset32(u), g.offset32(l), g.offset32(h), g.offset32(p), g.rawBytes(o), g.rawBytes(s), g.rawBytes(r), g.rawBytes(i), g.rawBytes(a), g.toArray();
}
function wn(t) {
  return t ? t._raw ? t._raw : V1(t) : [];
}
function V1(t) {
  const e = t.entries ?? [], n = t.mapCount ?? e.length, o = G1(e), s = t.format ?? (n > 65535 ? 1 : 0), r = t.entryFormat ?? o.entryFormat, i = (r & $c) + 1, a = ((r & Nc) >> 4) + 1, c = s === 1 ? 6 : 4, f = new v(c + n * a);
  f.uint8(s), f.uint8(r), s === 1 ? f.uint32(n) : f.uint16(n);
  for (let u = 0; u < n; u++) {
    const l = e[u] ?? { outerIndex: 0, innerIndex: 0 }, h = $1(l, i);
    z1(f, h, a);
  }
  return f.toArray();
}
function $1(t, e) {
  const n = (1 << e) - 1;
  return (t.outerIndex ?? 0) << e | (t.innerIndex ?? 0) & n;
}
function N1(t, e) {
  const n = (1 << e) - 1;
  return {
    outerIndex: t >> e,
    innerIndex: t & n
  };
}
function G1(t) {
  let e = 0, n = 0;
  for (const a of t)
    e = Math.max(e, a.innerIndex ?? 0), n = Math.max(n, a.outerIndex ?? 0);
  let o = 1;
  for (; (1 << o) - 1 < e && o < 16; )
    o++;
  const s = n << o | e;
  let r = 1;
  for (; r < 4 && s > P1(r); )
    r++;
  return { entryFormat: r - 1 << 4 | o - 1 };
}
function P1(t) {
  return t === 1 ? 255 : t === 2 ? 65535 : t === 3 ? 16777215 : 4294967295;
}
function U1(t, e) {
  return e === 1 ? t.uint8() : e === 2 ? t.uint16() : e === 3 ? t.uint24() : t.uint32();
}
function z1(t, e, n) {
  n === 1 ? t.uint8(e) : n === 2 ? t.uint16(e) : n === 3 ? t.uint24(e) : t.uint32(e >>> 0);
}
const so = 32768, ro = 4095, io = 32768, ao = 16384, co = 8192, H1 = 4095, Pc = 128, W1 = 127, Uc = 128, zc = 64, j1 = 63;
function Gn(t) {
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
    const r = t.uint8(), i = (r & W1) + 1, a = (r & Pc) !== 0;
    for (let c = 0; c < i && o.length < n; c++) {
      const f = a ? t.uint16() : t.uint8();
      s += f, o.push(s);
    }
  }
  return o;
}
function Pn(t) {
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
    const f = (i ? Pc : 0) | a - 1;
    n.push(f);
    for (let u = 0; u < a; u++) {
      const l = o[r + u];
      i ? n.push(l >> 8 & 255, l & 255) : n.push(l & 255);
    }
    r += a;
  }
  return n;
}
function Hc(t, e) {
  const n = [];
  for (; n.length < e; ) {
    const o = t.uint8(), s = (o & j1) + 1;
    if (o & Uc)
      for (let r = 0; r < s && n.length < e; r++)
        n.push(0);
    else if (o & zc)
      for (let r = 0; r < s && n.length < e; r++)
        n.push(t.int16());
    else
      for (let r = 0; r < s && n.length < e; r++)
        n.push(t.int8());
  }
  return n;
}
function Wc(t) {
  const e = [];
  let n = 0;
  for (; n < t.length; )
    if (t[n] === 0) {
      let o = 1;
      const s = Math.min(64, t.length - n);
      for (; o < s && t[n + o] === 0; )
        o++;
      e.push(Uc | o - 1), n += o;
    } else if (t[n] < -128 || t[n] > 127) {
      let o = 1;
      const s = Math.min(64, t.length - n);
      for (; o < s; ) {
        const r = t[n + o];
        if (r === 0 || r >= -128 && r <= 127) break;
        o++;
      }
      e.push(zc | o - 1);
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
function q1(t, e, n, o) {
  if (!t || t.length === 0) return [];
  const s = new F(t), r = s.uint16(), i = s.offset16(), a = r & ro, c = (r & so) !== 0;
  if (a === 0) return [];
  const f = [];
  for (let h = 0; h < a; h++) {
    const p = s.uint16(), g = s.uint16();
    let d;
    if (g & io)
      d = s.array("f2dot14", e);
    else {
      const y = g & H1;
      d = n[y] ?? new Array(e).fill(0);
    }
    let x = null, m = null;
    g & ao && (x = s.array("f2dot14", e), m = s.array("f2dot14", e)), f.push({
      variationDataSize: p,
      tupleIndex: g,
      peakTuple: d,
      intermediateStartTuple: x,
      intermediateEndTuple: m,
      hasPrivatePoints: (g & co) !== 0
    });
  }
  s.seek(i);
  let u = null;
  c && (u = Gn(s));
  const l = [];
  for (const h of f) {
    const g = s.position + h.variationDataSize;
    let d;
    h.hasPrivatePoints ? d = Gn(s) : d = u;
    const x = d === null ? o : d.length, m = x * 2, y = Hc(s, m);
    l.push({
      peakTuple: h.peakTuple,
      intermediateStartTuple: h.intermediateStartTuple,
      intermediateEndTuple: h.intermediateEndTuple,
      pointIndices: d,
      xDeltas: y.slice(0, x),
      yDeltas: y.slice(x)
    }), s.seek(g);
  }
  return l;
}
function Y1(t, e) {
  if (!t || t.length === 0) return [];
  const n = t.length, s = t.every(
    (g) => JSON.stringify(g.pointIndices) === JSON.stringify(t[0].pointIndices)
  ) && n > 1, r = [];
  let i = [];
  s && (i = Pn(t[0].pointIndices), r.push(i));
  const a = [];
  for (const g of t) {
    const d = [];
    s || d.push(...Pn(g.pointIndices));
    const x = [...g.xDeltas ?? [], ...g.yDeltas ?? []];
    d.push(...Wc(x)), a.push(d.length), r.push(d);
  }
  const c = [];
  for (const g of r)
    c.push(...g);
  const f = [];
  for (let g = 0; g < n; g++) {
    const d = t[g];
    let x = io;
    s || (x |= co), d.intermediateStartTuple && (x |= ao);
    const m = [];
    m.push(a[g] >> 8 & 255), m.push(a[g] & 255), m.push(x >> 8 & 255), m.push(x & 255);
    for (let y = 0; y < e; y++) {
      const w = Math.round((d.peakTuple[y] ?? 0) * 16384) & 65535;
      m.push(w >> 8 & 255, w & 255);
    }
    if (d.intermediateStartTuple) {
      for (let y = 0; y < e; y++) {
        const w = Math.round((d.intermediateStartTuple[y] ?? 0) * 16384) & 65535;
        m.push(w >> 8 & 255, w & 255);
      }
      for (let y = 0; y < e; y++) {
        const w = Math.round((d.intermediateEndTuple[y] ?? 0) * 16384) & 65535;
        m.push(w >> 8 & 255, w & 255);
      }
    }
    f.push(m);
  }
  const u = [];
  for (const g of f)
    u.push(...g);
  const l = (s ? so : 0) | n & ro, h = 4 + u.length, p = [];
  return p.push(l >> 8 & 255), p.push(l & 255), p.push(h >> 8 & 255), p.push(h & 255), p.push(...u), p.push(...c), p;
}
function Z1(t, e, n) {
  if (!t || t.length < 8)
    return { majorVersion: 1, minorVersion: 0, tupleVariations: [] };
  const o = new F(t), s = o.uint16(), r = o.uint16(), i = o.uint16(), a = o.offset16(), c = i & ro, f = (i & so) !== 0;
  if (c === 0)
    return { majorVersion: s, minorVersion: r, tupleVariations: [] };
  const u = [];
  for (let p = 0; p < c; p++) {
    const g = o.uint16(), d = o.uint16();
    let x = null;
    d & io && (x = o.array("f2dot14", e));
    let m = null, y = null;
    d & ao && (m = o.array("f2dot14", e), y = o.array("f2dot14", e)), u.push({
      variationDataSize: g,
      tupleIndex: d,
      peakTuple: x,
      intermediateStartTuple: m,
      intermediateEndTuple: y,
      hasPrivatePoints: (d & co) !== 0
    });
  }
  o.seek(a);
  let l = null;
  f && (l = Gn(o));
  const h = [];
  for (const p of u) {
    const d = o.position + p.variationDataSize;
    let x;
    p.hasPrivatePoints ? x = Gn(o) : x = l;
    const m = x === null ? n : x.length, y = Hc(o, m);
    h.push({
      peakTuple: p.peakTuple,
      intermediateStartTuple: p.intermediateStartTuple,
      intermediateEndTuple: p.intermediateEndTuple,
      pointIndices: x,
      deltas: y
    }), o.seek(d);
  }
  return { majorVersion: s, minorVersion: r, tupleVariations: h };
}
function X1(t, e) {
  const n = t.majorVersion ?? 1, o = t.minorVersion ?? 0, s = t.tupleVariations ?? [], r = s.length;
  if (r === 0) {
    const x = new v(8);
    return x.uint16(n), x.uint16(o), x.uint16(0), x.offset16(8), x.toArray();
  }
  const a = s.every(
    (x) => JSON.stringify(x.pointIndices) === JSON.stringify(s[0].pointIndices)
  ) && r > 1, c = [];
  a && c.push(
    Pn(s[0].pointIndices)
  );
  const f = [];
  for (const x of s) {
    const m = [];
    a || m.push(...Pn(x.pointIndices)), m.push(...Wc(x.deltas ?? [])), f.push(m.length), c.push(m);
  }
  const u = [];
  for (const x of c)
    u.push(...x);
  const l = [];
  for (let x = 0; x < r; x++) {
    const m = s[x];
    let y = io;
    a || (y |= co), m.intermediateStartTuple && (y |= ao), l.push(f[x] >> 8 & 255), l.push(f[x] & 255), l.push(y >> 8 & 255), l.push(y & 255);
    for (let w = 0; w < e; w++) {
      const _ = Math.round((m.peakTuple[w] ?? 0) * 16384) & 65535;
      l.push(_ >> 8 & 255, _ & 255);
    }
    if (m.intermediateStartTuple) {
      for (let w = 0; w < e; w++) {
        const _ = Math.round((m.intermediateStartTuple[w] ?? 0) * 16384) & 65535;
        l.push(_ >> 8 & 255, _ & 255);
      }
      for (let w = 0; w < e; w++) {
        const _ = Math.round((m.intermediateEndTuple[w] ?? 0) * 16384) & 65535;
        l.push(_ >> 8 & 255, _ & 255);
      }
    }
  }
  const h = (a ? so : 0) | r & ro, p = 8 + l.length, g = p + u.length, d = new v(g);
  return d.uint16(n), d.uint16(o), d.uint16(h), d.offset16(p), d.rawBytes(l), d.rawBytes(u), d.toArray();
}
function K1(t, e = {}) {
  const n = e.fvar?.axes?.length ?? 0, o = e["cvt "]?.values?.length ?? 0;
  return Z1(t, n, o);
}
function J1(t) {
  const e = t.tupleVariations?.[0]?.peakTuple?.length ?? 0;
  return X1(t, e);
}
function Q1(t) {
  const e = new F(t), n = t.length >>> 1;
  return { values: e.array("fword", n) };
}
function tm(t) {
  const e = t.values, n = new v(e.length * 2);
  return n.array("fword", e), n.toArray();
}
function em(t) {
  return { instructions: Array.from(t) };
}
function nm(t) {
  return Array.from(t.instructions);
}
function om(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = [];
  for (let r = 0; r < o; r++)
    s.push({
      rangeMaxPPEM: e.uint16(),
      rangeGaspBehavior: e.uint16()
    });
  return { version: n, gaspRanges: s };
}
function sm(t) {
  const { version: e, gaspRanges: n } = t, o = new v(4 + n.length * 4);
  o.uint16(e), o.uint16(n.length);
  for (const s of n)
    o.uint16(s.rangeMaxPPEM), o.uint16(s.rangeGaspBehavior);
  return o.toArray();
}
const jc = 1, qc = 2, Yc = 4, Zc = 8, Un = 16, zn = 32, Xc = 64, Je = 1, Hn = 2, Kc = 4, Us = 8, fs = 32, zs = 64, Hs = 128, Qe = 256, Jc = 512, Qc = 1024, tf = 2048, ef = 4096;
function rm(t, e) {
  const n = e.loca.offsets, o = e.maxp.numGlyphs, s = new F(t), r = [];
  for (let i = 0; i < o; i++) {
    const a = n[i], c = n[i + 1];
    if (a === c) {
      r.push(null);
      continue;
    }
    s.seek(a);
    const f = s.int16(), u = s.int16(), l = s.int16(), h = s.int16(), p = s.int16();
    f >= 0 ? r.push(
      im(s, f, u, l, h, p)
    ) : r.push(am(s, u, l, h, p));
  }
  return { glyphs: r };
}
function im(t, e, n, o, s, r) {
  const i = t.array("uint16", e), a = e > 0 ? i[e - 1] + 1 : 0, c = t.uint16(), f = t.bytes(c), u = [];
  for (; u.length < a; ) {
    const y = t.uint8();
    if (u.push(y), y & Zc) {
      const w = t.uint8();
      for (let _ = 0; _ < w; _++)
        u.push(y);
    }
  }
  const l = new Array(a);
  let h = 0;
  for (let y = 0; y < a; y++) {
    const w = u[y];
    if (w & qc) {
      const _ = t.uint8();
      h += w & Un ? _ : -_;
    } else w & Un || (h += t.int16());
    l[y] = h;
  }
  const p = new Array(a);
  let g = 0;
  for (let y = 0; y < a; y++) {
    const w = u[y];
    if (w & Yc) {
      const _ = t.uint8();
      g += w & zn ? _ : -_;
    } else w & zn || (g += t.int16());
    p[y] = g;
  }
  const d = a > 0 && (u[0] & Xc) !== 0, x = [];
  let m = 0;
  for (let y = 0; y < e; y++) {
    const w = i[y], _ = [];
    for (; m <= w; )
      _.push({
        x: l[m],
        y: p[m],
        onCurve: (u[m] & jc) !== 0
      }), m++;
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
function am(t, e, n, o, s) {
  const r = [];
  let i, a = !1;
  do {
    i = t.uint16();
    const f = t.uint16();
    let u, l;
    i & Je ? i & Hn ? (u = t.int16(), l = t.int16()) : (u = t.uint16(), l = t.uint16()) : i & Hn ? (u = t.int8(), l = t.int8()) : (u = t.uint8(), l = t.uint8());
    const h = {
      glyphIndex: f,
      flags: cm(i),
      argument1: u,
      argument2: l
    };
    i & Us ? h.transform = { scale: t.f2dot14() } : i & zs ? h.transform = {
      xScale: t.f2dot14(),
      yScale: t.f2dot14()
    } : i & Hs && (h.transform = {
      xScale: t.f2dot14(),
      scale01: t.f2dot14(),
      scale10: t.f2dot14(),
      yScale: t.f2dot14()
    }), r.push(h), i & Qe && (a = !0);
  } while (i & fs);
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
function cm(t) {
  const e = {};
  return t & Je && (e.argsAreWords = !0), t & Hn && (e.argsAreXYValues = !0), t & Kc && (e.roundXYToGrid = !0), t & Us && (e.weHaveAScale = !0), t & zs && (e.weHaveAnXAndYScale = !0), t & Hs && (e.weHaveATwoByTwo = !0), t & Qe && (e.weHaveInstructions = !0), t & Jc && (e.useMyMetrics = !0), t & Qc && (e.overlapCompound = !0), t & tf && (e.scaledComponentOffset = !0), t & ef && (e.unscaledComponentOffset = !0), e;
}
function nf(t) {
  const { glyphs: e } = t, n = [];
  for (const r of e) {
    if (r === null) {
      n.push([]);
      continue;
    }
    r.type === "simple" ? n.push(um(r)) : n.push(hm(r));
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
function fm(t) {
  return nf(t).bytes;
}
function um(t) {
  const { contours: e, instructions: n, xMin: o, yMin: s, xMax: r, yMax: i, overlapSimple: a } = t, c = e.length, f = [], u = [];
  for (const I of e) {
    for (const T of I)
      f.push(T);
    u.push(f.length - 1);
  }
  const l = f.length, h = f.map((I) => I.x), p = f.map((I) => I.y), g = new Array(l), d = new Array(l);
  for (let I = 0; I < l; I++)
    g[I] = I === 0 ? h[I] : h[I] - h[I - 1], d[I] = I === 0 ? p[I] : p[I] - p[I - 1];
  const x = [], m = [], y = [];
  for (let I = 0; I < l; I++) {
    let T = 0;
    f[I].onCurve && (T |= jc);
    const E = g[I], D = d[I];
    E === 0 ? T |= Un : E >= -255 && E <= 255 ? (T |= qc, E > 0 ? (T |= Un, m.push(E)) : m.push(-E)) : m.push(E >> 8 & 255, E & 255), D === 0 ? T |= zn : D >= -255 && D <= 255 ? (T |= Yc, D > 0 ? (T |= zn, y.push(D)) : y.push(-D)) : y.push(D >> 8 & 255, D & 255), I === 0 && a && (T |= Xc), x.push(T);
  }
  const w = lm(x), _ = 10, S = c * 2, b = 2, A = n.length, k = _ + S + b + A + w.length + m.length + y.length, O = new v(k);
  return O.int16(c), O.int16(o), O.int16(s), O.int16(r), O.int16(i), O.array("uint16", u), O.uint16(n.length), O.rawBytes(n), O.rawBytes(w), O.rawBytes(m), O.rawBytes(y), O.toArray();
}
function lm(t) {
  const e = [];
  let n = 0;
  for (; n < t.length; ) {
    const o = t[n];
    let s = 0;
    for (; n + 1 + s < t.length && t[n + 1 + s] === o && s < 255; )
      s++;
    s > 0 ? (e.push(o | Zc, s), n += 1 + s) : (e.push(o), n++);
  }
  return e;
}
function hm(t) {
  const { components: e, instructions: n, xMin: o, yMin: s, xMax: r, yMax: i } = t;
  let a = 10;
  for (let f = 0; f < e.length; f++) {
    const u = e[f];
    a += 4;
    const l = u.flags.argsAreWords || Xr(u.argument1, u.argument2, u.flags.argsAreXYValues);
    a += l ? 4 : 2, u.transform && ("scale" in u.transform ? a += 2 : "scale01" in u.transform ? a += 8 : "xScale" in u.transform && (a += 4));
  }
  n && n.length > 0 && (a += 2 + n.length);
  const c = new v(a);
  c.int16(-1), c.int16(o), c.int16(s), c.int16(r), c.int16(i);
  for (let f = 0; f < e.length; f++) {
    const u = e[f], l = f === e.length - 1;
    let h = gm(u.flags);
    const p = u.flags.argsAreWords || Xr(u.argument1, u.argument2, u.flags.argsAreXYValues);
    p ? h |= Je : h &= ~Je, l ? h &= ~fs : h |= fs, l && n && n.length > 0 ? h |= Qe : l && (h &= ~Qe), c.uint16(h), c.uint16(u.glyphIndex), p ? u.flags.argsAreXYValues ? (c.int16(u.argument1), c.int16(u.argument2)) : (c.uint16(u.argument1), c.uint16(u.argument2)) : u.flags.argsAreXYValues ? (c.int8(u.argument1), c.int8(u.argument2)) : (c.uint8(u.argument1), c.uint8(u.argument2)), u.transform && ("scale" in u.transform ? c.f2dot14(u.transform.scale) : "scale01" in u.transform ? (c.f2dot14(u.transform.xScale), c.f2dot14(u.transform.scale01), c.f2dot14(u.transform.scale10), c.f2dot14(u.transform.yScale)) : "xScale" in u.transform && (c.f2dot14(u.transform.xScale), c.f2dot14(u.transform.yScale)));
  }
  return n && n.length > 0 && (c.uint16(n.length), c.rawBytes(n)), c.toArray();
}
function Xr(t, e, n) {
  return n ? t < -128 || t > 127 || e < -128 || e > 127 : t > 255 || e > 255;
}
function gm(t) {
  let e = 0;
  return t.argsAreWords && (e |= Je), t.argsAreXYValues && (e |= Hn), t.roundXYToGrid && (e |= Kc), t.weHaveAScale && (e |= Us), t.weHaveAnXAndYScale && (e |= zs), t.weHaveATwoByTwo && (e |= Hs), t.weHaveInstructions && (e |= Qe), t.useMyMetrics && (e |= Jc), t.overlapCompound && (e |= Qc), t.scaledComponentOffset && (e |= tf), t.unscaledComponentOffset && (e |= ef), e;
}
const pm = 20, us = 1;
function dm(t, e = {}) {
  const n = new F(t), o = n.uint16(), s = n.uint16(), r = n.uint16(), i = n.uint16(), a = n.offset32(), c = n.uint16(), f = n.uint16(), u = n.offset32(), l = (f & us) !== 0, h = c + 1, p = [];
  for (let x = 0; x < h; x++)
    l ? p.push(n.uint32()) : p.push(n.uint16() * 2);
  const g = [];
  if (i > 0 && a > 0) {
    n.seek(a);
    for (let x = 0; x < i; x++) {
      const m = [];
      for (let y = 0; y < r; y++)
        m.push(n.f2dot14());
      g.push(m);
    }
  }
  const d = [];
  for (let x = 0; x < c; x++) {
    const m = p[x], y = p[x + 1], w = Math.max(0, y - m);
    if (w === 0) {
      d.push([]);
      continue;
    }
    const _ = u + m, S = t.slice(_, _ + w), b = mm(e, x);
    d.push(
      q1(S, r, g, b)
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
function mm(t, e) {
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
function ym(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.axisCount ?? 0, s = t.glyphVariationData ?? [], r = s.length, i = s.map((S) => Array.isArray(S) && (S.length === 0 || typeof S[0] == "number") ? S : Array.isArray(S) ? Y1(S, o) : []), a = t.sharedTuples ?? xm(s, o), c = a.length, f = c * o * 2, u = [0];
  let l = 0;
  for (const S of i)
    l += S.length, u.push(l);
  const h = u.every(
    (S) => S % 2 === 0 && S / 2 <= 65535
  ), p = h ? 2 : 4, g = (r + 1) * p, d = pm + g, x = d + f, m = x + l, y = t.flags ?? 0, w = h ? y & ~us : y | us, _ = new v(m);
  _.uint16(e), _.uint16(n), _.uint16(o), _.uint16(c), _.offset32(d), _.uint16(r), _.uint16(w), _.offset32(x);
  for (const S of u)
    h ? _.uint16(S / 2) : _.uint32(S);
  for (const S of a)
    for (let b = 0; b < o; b++)
      _.f2dot14(S[b] ?? 0);
  for (const S of i)
    _.rawBytes(S);
  return _.toArray();
}
function xm(t, e) {
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
function Sm(t, e) {
  const n = e.head.indexToLocFormat, s = e.maxp.numGlyphs + 1, r = new F(t), i = [];
  if (n === 0)
    for (let a = 0; a < s; a++)
      i.push(r.uint16() * 2);
  else
    for (let a = 0; a < s; a++)
      i.push(r.uint32());
  return { offsets: i };
}
function of(t) {
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
function _m(t) {
  return { instructions: Array.from(t) };
}
function wm(t) {
  return Array.from(t.instructions);
}
const bm = 4, Kr = 0, Jr = 1, Am = 2;
function Ee(t) {
  let e = t.length;
  for (; --e >= 0; )
    t[e] = 0;
}
const Cm = 0, sf = 1, vm = 2, Im = 3, km = 258, Ws = 29, ln = 256, tn = ln + 1 + Ws, xe = 30, js = 19, rf = 2 * tn + 1, Yt = 15, Eo = 16, Om = 7, qs = 256, af = 16, cf = 17, ff = 18, ls = (
  /* extra bits for each length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0])
), Mn = (
  /* extra bits for each distance code */
  new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13])
), Em = (
  /* extra bits for each bit length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7])
), uf = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), Tm = 512, kt = new Array((tn + 2) * 2);
Ee(kt);
const je = new Array(xe * 2);
Ee(je);
const en = new Array(Tm);
Ee(en);
const nn = new Array(km - Im + 1);
Ee(nn);
const Ys = new Array(Ws);
Ee(Ys);
const Wn = new Array(xe);
Ee(Wn);
function To(t, e, n, o, s) {
  this.static_tree = t, this.extra_bits = e, this.extra_base = n, this.elems = o, this.max_length = s, this.has_stree = t && t.length;
}
let lf, hf, gf;
function Do(t, e) {
  this.dyn_tree = t, this.max_code = 0, this.stat_desc = e;
}
const pf = (t) => t < 256 ? en[t] : en[256 + (t >>> 7)], on = (t, e) => {
  t.pending_buf[t.pending++] = e & 255, t.pending_buf[t.pending++] = e >>> 8 & 255;
}, st = (t, e, n) => {
  t.bi_valid > Eo - n ? (t.bi_buf |= e << t.bi_valid & 65535, on(t, t.bi_buf), t.bi_buf = e >> Eo - t.bi_valid, t.bi_valid += n - Eo) : (t.bi_buf |= e << t.bi_valid & 65535, t.bi_valid += n);
}, mt = (t, e, n) => {
  st(
    t,
    n[e * 2],
    n[e * 2 + 1]
    /*.Len*/
  );
}, df = (t, e) => {
  let n = 0;
  do
    n |= t & 1, t >>>= 1, n <<= 1;
  while (--e > 0);
  return n >>> 1;
}, Dm = (t) => {
  t.bi_valid === 16 ? (on(t, t.bi_buf), t.bi_buf = 0, t.bi_valid = 0) : t.bi_valid >= 8 && (t.pending_buf[t.pending++] = t.bi_buf & 255, t.bi_buf >>= 8, t.bi_valid -= 8);
}, Rm = (t, e) => {
  const n = e.dyn_tree, o = e.max_code, s = e.stat_desc.static_tree, r = e.stat_desc.has_stree, i = e.stat_desc.extra_bits, a = e.stat_desc.extra_base, c = e.stat_desc.max_length;
  let f, u, l, h, p, g, d = 0;
  for (h = 0; h <= Yt; h++)
    t.bl_count[h] = 0;
  for (n[t.heap[t.heap_max] * 2 + 1] = 0, f = t.heap_max + 1; f < rf; f++)
    u = t.heap[f], h = n[n[u * 2 + 1] * 2 + 1] + 1, h > c && (h = c, d++), n[u * 2 + 1] = h, !(u > o) && (t.bl_count[h]++, p = 0, u >= a && (p = i[u - a]), g = n[u * 2], t.opt_len += g * (h + p), r && (t.static_len += g * (s[u * 2 + 1] + p)));
  if (d !== 0) {
    do {
      for (h = c - 1; t.bl_count[h] === 0; )
        h--;
      t.bl_count[h]--, t.bl_count[h + 1] += 2, t.bl_count[c]--, d -= 2;
    } while (d > 0);
    for (h = c; h !== 0; h--)
      for (u = t.bl_count[h]; u !== 0; )
        l = t.heap[--f], !(l > o) && (n[l * 2 + 1] !== h && (t.opt_len += (h - n[l * 2 + 1]) * n[l * 2], n[l * 2 + 1] = h), u--);
  }
}, mf = (t, e, n) => {
  const o = new Array(Yt + 1);
  let s = 0, r, i;
  for (r = 1; r <= Yt; r++)
    s = s + n[r - 1] << 1, o[r] = s;
  for (i = 0; i <= e; i++) {
    let a = t[i * 2 + 1];
    a !== 0 && (t[i * 2] = df(o[a]++, a));
  }
}, Fm = () => {
  let t, e, n, o, s;
  const r = new Array(Yt + 1);
  for (n = 0, o = 0; o < Ws - 1; o++)
    for (Ys[o] = n, t = 0; t < 1 << ls[o]; t++)
      nn[n++] = o;
  for (nn[n - 1] = o, s = 0, o = 0; o < 16; o++)
    for (Wn[o] = s, t = 0; t < 1 << Mn[o]; t++)
      en[s++] = o;
  for (s >>= 7; o < xe; o++)
    for (Wn[o] = s << 7, t = 0; t < 1 << Mn[o] - 7; t++)
      en[256 + s++] = o;
  for (e = 0; e <= Yt; e++)
    r[e] = 0;
  for (t = 0; t <= 143; )
    kt[t * 2 + 1] = 8, t++, r[8]++;
  for (; t <= 255; )
    kt[t * 2 + 1] = 9, t++, r[9]++;
  for (; t <= 279; )
    kt[t * 2 + 1] = 7, t++, r[7]++;
  for (; t <= 287; )
    kt[t * 2 + 1] = 8, t++, r[8]++;
  for (mf(kt, tn + 1, r), t = 0; t < xe; t++)
    je[t * 2 + 1] = 5, je[t * 2] = df(t, 5);
  lf = new To(kt, ls, ln + 1, tn, Yt), hf = new To(je, Mn, 0, xe, Yt), gf = new To(new Array(0), Em, 0, js, Om);
}, yf = (t) => {
  let e;
  for (e = 0; e < tn; e++)
    t.dyn_ltree[e * 2] = 0;
  for (e = 0; e < xe; e++)
    t.dyn_dtree[e * 2] = 0;
  for (e = 0; e < js; e++)
    t.bl_tree[e * 2] = 0;
  t.dyn_ltree[qs * 2] = 1, t.opt_len = t.static_len = 0, t.sym_next = t.matches = 0;
}, xf = (t) => {
  t.bi_valid > 8 ? on(t, t.bi_buf) : t.bi_valid > 0 && (t.pending_buf[t.pending++] = t.bi_buf), t.bi_buf = 0, t.bi_valid = 0;
}, Qr = (t, e, n, o) => {
  const s = e * 2, r = n * 2;
  return t[s] < t[r] || t[s] === t[r] && o[e] <= o[n];
}, Ro = (t, e, n) => {
  const o = t.heap[n];
  let s = n << 1;
  for (; s <= t.heap_len && (s < t.heap_len && Qr(e, t.heap[s + 1], t.heap[s], t.depth) && s++, !Qr(e, o, t.heap[s], t.depth)); )
    t.heap[n] = t.heap[s], n = s, s <<= 1;
  t.heap[n] = o;
}, ti = (t, e, n) => {
  let o, s, r = 0, i, a;
  if (t.sym_next !== 0)
    do
      o = t.pending_buf[t.sym_buf + r++] & 255, o += (t.pending_buf[t.sym_buf + r++] & 255) << 8, s = t.pending_buf[t.sym_buf + r++], o === 0 ? mt(t, s, e) : (i = nn[s], mt(t, i + ln + 1, e), a = ls[i], a !== 0 && (s -= Ys[i], st(t, s, a)), o--, i = pf(o), mt(t, i, n), a = Mn[i], a !== 0 && (o -= Wn[i], st(t, o, a)));
    while (r < t.sym_next);
  mt(t, qs, e);
}, hs = (t, e) => {
  const n = e.dyn_tree, o = e.stat_desc.static_tree, s = e.stat_desc.has_stree, r = e.stat_desc.elems;
  let i, a, c = -1, f;
  for (t.heap_len = 0, t.heap_max = rf, i = 0; i < r; i++)
    n[i * 2] !== 0 ? (t.heap[++t.heap_len] = c = i, t.depth[i] = 0) : n[i * 2 + 1] = 0;
  for (; t.heap_len < 2; )
    f = t.heap[++t.heap_len] = c < 2 ? ++c : 0, n[f * 2] = 1, t.depth[f] = 0, t.opt_len--, s && (t.static_len -= o[f * 2 + 1]);
  for (e.max_code = c, i = t.heap_len >> 1; i >= 1; i--)
    Ro(t, n, i);
  f = r;
  do
    i = t.heap[
      1
      /*SMALLEST*/
    ], t.heap[
      1
      /*SMALLEST*/
    ] = t.heap[t.heap_len--], Ro(
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
    ] = f++, Ro(
      t,
      n,
      1
      /*SMALLEST*/
    );
  while (t.heap_len >= 2);
  t.heap[--t.heap_max] = t.heap[
    1
    /*SMALLEST*/
  ], Rm(t, e), mf(n, c, t.bl_count);
}, ei = (t, e, n) => {
  let o, s = -1, r, i = e[1], a = 0, c = 7, f = 4;
  for (i === 0 && (c = 138, f = 3), e[(n + 1) * 2 + 1] = 65535, o = 0; o <= n; o++)
    r = i, i = e[(o + 1) * 2 + 1], !(++a < c && r === i) && (a < f ? t.bl_tree[r * 2] += a : r !== 0 ? (r !== s && t.bl_tree[r * 2]++, t.bl_tree[af * 2]++) : a <= 10 ? t.bl_tree[cf * 2]++ : t.bl_tree[ff * 2]++, a = 0, s = r, i === 0 ? (c = 138, f = 3) : r === i ? (c = 6, f = 3) : (c = 7, f = 4));
}, ni = (t, e, n) => {
  let o, s = -1, r, i = e[1], a = 0, c = 7, f = 4;
  for (i === 0 && (c = 138, f = 3), o = 0; o <= n; o++)
    if (r = i, i = e[(o + 1) * 2 + 1], !(++a < c && r === i)) {
      if (a < f)
        do
          mt(t, r, t.bl_tree);
        while (--a !== 0);
      else r !== 0 ? (r !== s && (mt(t, r, t.bl_tree), a--), mt(t, af, t.bl_tree), st(t, a - 3, 2)) : a <= 10 ? (mt(t, cf, t.bl_tree), st(t, a - 3, 3)) : (mt(t, ff, t.bl_tree), st(t, a - 11, 7));
      a = 0, s = r, i === 0 ? (c = 138, f = 3) : r === i ? (c = 6, f = 3) : (c = 7, f = 4);
    }
}, Mm = (t) => {
  let e;
  for (ei(t, t.dyn_ltree, t.l_desc.max_code), ei(t, t.dyn_dtree, t.d_desc.max_code), hs(t, t.bl_desc), e = js - 1; e >= 3 && t.bl_tree[uf[e] * 2 + 1] === 0; e--)
    ;
  return t.opt_len += 3 * (e + 1) + 5 + 5 + 4, e;
}, Lm = (t, e, n, o) => {
  let s;
  for (st(t, e - 257, 5), st(t, n - 1, 5), st(t, o - 4, 4), s = 0; s < o; s++)
    st(t, t.bl_tree[uf[s] * 2 + 1], 3);
  ni(t, t.dyn_ltree, e - 1), ni(t, t.dyn_dtree, n - 1);
}, Bm = (t) => {
  let e = 4093624447, n;
  for (n = 0; n <= 31; n++, e >>>= 1)
    if (e & 1 && t.dyn_ltree[n * 2] !== 0)
      return Kr;
  if (t.dyn_ltree[18] !== 0 || t.dyn_ltree[20] !== 0 || t.dyn_ltree[26] !== 0)
    return Jr;
  for (n = 32; n < ln; n++)
    if (t.dyn_ltree[n * 2] !== 0)
      return Jr;
  return Kr;
};
let oi = !1;
const Vm = (t) => {
  oi || (Fm(), oi = !0), t.l_desc = new Do(t.dyn_ltree, lf), t.d_desc = new Do(t.dyn_dtree, hf), t.bl_desc = new Do(t.bl_tree, gf), t.bi_buf = 0, t.bi_valid = 0, yf(t);
}, Sf = (t, e, n, o) => {
  st(t, (Cm << 1) + (o ? 1 : 0), 3), xf(t), on(t, n), on(t, ~n), n && t.pending_buf.set(t.window.subarray(e, e + n), t.pending), t.pending += n;
}, $m = (t) => {
  st(t, sf << 1, 3), mt(t, qs, kt), Dm(t);
}, Nm = (t, e, n, o) => {
  let s, r, i = 0;
  t.level > 0 ? (t.strm.data_type === Am && (t.strm.data_type = Bm(t)), hs(t, t.l_desc), hs(t, t.d_desc), i = Mm(t), s = t.opt_len + 3 + 7 >>> 3, r = t.static_len + 3 + 7 >>> 3, r <= s && (s = r)) : s = r = n + 5, n + 4 <= s && e !== -1 ? Sf(t, e, n, o) : t.strategy === bm || r === s ? (st(t, (sf << 1) + (o ? 1 : 0), 3), ti(t, kt, je)) : (st(t, (vm << 1) + (o ? 1 : 0), 3), Lm(t, t.l_desc.max_code + 1, t.d_desc.max_code + 1, i + 1), ti(t, t.dyn_ltree, t.dyn_dtree)), yf(t), o && xf(t);
}, Gm = (t, e, n) => (t.pending_buf[t.sym_buf + t.sym_next++] = e, t.pending_buf[t.sym_buf + t.sym_next++] = e >> 8, t.pending_buf[t.sym_buf + t.sym_next++] = n, e === 0 ? t.dyn_ltree[n * 2]++ : (t.matches++, e--, t.dyn_ltree[(nn[n] + ln + 1) * 2]++, t.dyn_dtree[pf(e) * 2]++), t.sym_next === t.sym_end);
var Pm = Vm, Um = Sf, zm = Nm, Hm = Gm, Wm = $m, jm = {
  _tr_init: Pm,
  _tr_stored_block: Um,
  _tr_flush_block: zm,
  _tr_tally: Hm,
  _tr_align: Wm
};
const qm = (t, e, n, o) => {
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
var sn = qm;
const Ym = () => {
  let t, e = [];
  for (var n = 0; n < 256; n++) {
    t = n;
    for (var o = 0; o < 8; o++)
      t = t & 1 ? 3988292384 ^ t >>> 1 : t >>> 1;
    e[n] = t;
  }
  return e;
}, Zm = new Uint32Array(Ym()), Xm = (t, e, n, o) => {
  const s = Zm, r = o + n;
  t ^= -1;
  for (let i = o; i < r; i++)
    t = t >>> 8 ^ s[(t ^ e[i]) & 255];
  return t ^ -1;
};
var Y = Xm, Jt = {
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
}, fo = {
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
const { _tr_init: Km, _tr_stored_block: gs, _tr_flush_block: Jm, _tr_tally: Nt, _tr_align: Qm } = jm, {
  Z_NO_FLUSH: Gt,
  Z_PARTIAL_FLUSH: ty,
  Z_FULL_FLUSH: ey,
  Z_FINISH: ut,
  Z_BLOCK: si,
  Z_OK: X,
  Z_STREAM_END: ri,
  Z_STREAM_ERROR: xt,
  Z_DATA_ERROR: ny,
  Z_BUF_ERROR: Fo,
  Z_DEFAULT_COMPRESSION: oy,
  Z_FILTERED: sy,
  Z_HUFFMAN_ONLY: bn,
  Z_RLE: ry,
  Z_FIXED: iy,
  Z_DEFAULT_STRATEGY: ay,
  Z_UNKNOWN: cy,
  Z_DEFLATED: uo
} = fo, fy = 9, uy = 15, ly = 8, hy = 29, gy = 256, ps = gy + 1 + hy, py = 30, dy = 19, my = 2 * ps + 1, yy = 15, B = 3, Bt = 258, St = Bt + B + 1, xy = 32, Ie = 42, Zs = 57, ds = 69, ms = 73, ys = 91, xs = 103, Zt = 113, Ue = 666, et = 1, Te = 2, Qt = 3, De = 4, Sy = 3, Xt = (t, e) => (t.msg = Jt[e], e), ii = (t) => t * 2 - (t > 4 ? 9 : 0), Rt = (t) => {
  let e = t.length;
  for (; --e >= 0; )
    t[e] = 0;
}, _y = (t) => {
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
let Xs = (t, e, n) => (e << t.hash_shift ^ n) & t.hash_mask;
const te = (t, e) => {
  let n;
  if (t.legacy_hash)
    n = t.ins_h = Xs(t, t.ins_h, t.window[e + B - 1]);
  else {
    const s = t.window, r = s[e] | s[e + 1] << 8 | s[e + 2] << 16 | s[e + 3] << 24;
    n = t.ins_h = Math.imul(r, 66521) + 66521 >>> 16 & t.hash_mask;
  }
  const o = t.prev[e & t.w_mask] = t.head[n];
  return t.head[n] = e, o;
}, it = (t) => {
  const e = t.state;
  let n = e.pending;
  n > t.avail_out && (n = t.avail_out), n !== 0 && (t.output.set(e.pending_buf.subarray(e.pending_out, e.pending_out + n), t.next_out), t.next_out += n, e.pending_out += n, t.total_out += n, t.avail_out -= n, e.pending -= n, e.pending === 0 && (e.pending_out = 0));
}, at = (t, e) => {
  Jm(t, t.block_start >= 0 ? t.block_start : -1, t.strstart - t.block_start, e), t.block_start = t.strstart, it(t.strm);
}, V = (t, e) => {
  t.pending_buf[t.pending++] = e;
}, Ve = (t, e) => {
  t.pending_buf[t.pending++] = e >>> 8 & 255, t.pending_buf[t.pending++] = e & 255;
}, Ss = (t, e, n, o) => {
  let s = t.avail_in;
  return s > o && (s = o), s === 0 ? 0 : (t.avail_in -= s, e.set(t.input.subarray(t.next_in, t.next_in + s), n), t.state.wrap === 1 ? t.adler = sn(t.adler, e, s, n) : t.state.wrap === 2 && (t.adler = Y(t.adler, e, s, n)), t.next_in += s, t.total_in += s, s);
}, _f = (t, e) => {
  let n = t.max_chain_length, o = t.strstart, s, r, i = t.prev_length, a = t.nice_match;
  const c = t.strstart > t.w_size - St ? t.strstart - (t.w_size - St) : 0, f = t.window, u = t.w_mask, l = t.prev, h = t.strstart + Bt;
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
  while ((e = l[e & u]) > c && --n !== 0);
  return i <= t.lookahead ? i : t.lookahead;
}, ke = (t) => {
  const e = t.w_size;
  let n, o, s;
  do {
    if (o = t.window_size - t.lookahead - t.strstart, t.strstart >= e + (e - St) && (t.window.set(t.window.subarray(e, e + e - o), 0), t.match_start -= e, t.strstart -= e, t.block_start -= e, t.insert > t.strstart && (t.insert = t.strstart), _y(t), o += e), t.strm.avail_in === 0)
      break;
    if (n = Ss(t.strm, t.window, t.strstart + t.lookahead, o), t.lookahead += n, t.legacy_hash) {
      if (t.lookahead + t.insert >= B)
        for (s = t.strstart - t.insert, t.ins_h = t.window[s], t.ins_h = Xs(t, t.ins_h, t.window[s + 1]); t.insert && (te(t, s), s++, t.insert--, !(t.lookahead + t.insert < B)); )
          ;
    } else if (t.lookahead + t.insert > B)
      for (s = t.strstart - t.insert; t.insert && (te(t, s), s++, t.insert--, !(t.lookahead + t.insert <= B)); )
        ;
  } while (t.lookahead < St && t.strm.avail_in !== 0);
}, wf = (t, e) => {
  let n = t.pending_buf_size - 5 > t.w_size ? t.w_size : t.pending_buf_size - 5, o, s, r, i = 0, a = t.strm.avail_in;
  do {
    if (o = 65535, r = t.bi_valid + 42 >> 3, t.strm.avail_out < r || (r = t.strm.avail_out - r, s = t.strstart - t.block_start, o > s + t.strm.avail_in && (o = s + t.strm.avail_in), o > r && (o = r), o < n && (o === 0 && e !== ut || e === Gt || o !== s + t.strm.avail_in)))
      break;
    i = e === ut && o === s + t.strm.avail_in ? 1 : 0, gs(t, 0, 0, i), t.pending_buf[t.pending - 4] = o, t.pending_buf[t.pending - 3] = o >> 8, t.pending_buf[t.pending - 2] = ~o, t.pending_buf[t.pending - 1] = ~o >> 8, it(t.strm), s && (s > o && (s = o), t.strm.output.set(t.window.subarray(t.block_start, t.block_start + s), t.strm.next_out), t.strm.next_out += s, t.strm.avail_out -= s, t.strm.total_out += s, t.block_start += s, o -= s), o && (Ss(t.strm, t.strm.output, t.strm.next_out, o), t.strm.next_out += o, t.strm.avail_out -= o, t.strm.total_out += o);
  } while (i === 0);
  return a -= t.strm.avail_in, a && (a >= t.w_size ? (t.matches = 2, t.window.set(t.strm.input.subarray(t.strm.next_in - t.w_size, t.strm.next_in), 0), t.strstart = t.w_size, t.insert = t.strstart) : (t.window_size - t.strstart <= a && (t.strstart -= t.w_size, t.window.set(t.window.subarray(t.w_size, t.w_size + t.strstart), 0), t.matches < 2 && t.matches++, t.insert > t.strstart && (t.insert = t.strstart)), t.window.set(t.strm.input.subarray(t.strm.next_in - a, t.strm.next_in), t.strstart), t.strstart += a, t.insert += a > t.w_size - t.insert ? t.w_size - t.insert : a), t.block_start = t.strstart), t.high_water < t.strstart && (t.high_water = t.strstart), i ? De : e !== Gt && e !== ut && t.strm.avail_in === 0 && t.strstart === t.block_start ? Te : (r = t.window_size - t.strstart, t.strm.avail_in > r && t.block_start >= t.w_size && (t.block_start -= t.w_size, t.strstart -= t.w_size, t.window.set(t.window.subarray(t.w_size, t.w_size + t.strstart), 0), t.matches < 2 && t.matches++, r += t.w_size, t.insert > t.strstart && (t.insert = t.strstart)), r > t.strm.avail_in && (r = t.strm.avail_in), r && (Ss(t.strm, t.window, t.strstart, r), t.strstart += r, t.insert += r > t.w_size - t.insert ? t.w_size - t.insert : r), t.high_water < t.strstart && (t.high_water = t.strstart), r = t.bi_valid + 42 >> 3, r = t.pending_buf_size - r > 65535 ? 65535 : t.pending_buf_size - r, n = r > t.w_size ? t.w_size : r, s = t.strstart - t.block_start, (s >= n || (s || e === ut) && e !== Gt && t.strm.avail_in === 0 && s <= r) && (o = s > r ? r : s, i = e === ut && t.strm.avail_in === 0 && o === s ? 1 : 0, gs(t, t.block_start, o, i), t.block_start += o, it(t.strm)), i ? Qt : et);
}, Mo = (t, e) => {
  let n, o;
  for (; ; ) {
    if (t.lookahead < St) {
      if (ke(t), t.lookahead < St && e === Gt)
        return et;
      if (t.lookahead === 0)
        break;
    }
    if (n = 0, t.lookahead >= B && (n = te(t, t.strstart)), n !== 0 && t.strstart - n <= t.w_size - St && (t.match_length = _f(t, n)), t.match_length >= B)
      if (o = Nt(t, t.strstart - t.match_start, t.match_length - B), t.lookahead -= t.match_length, t.match_length <= t.max_lazy_match && t.lookahead >= B) {
        t.match_length--;
        do
          t.strstart++, n = te(t, t.strstart);
        while (--t.match_length !== 0);
        t.strstart++;
      } else
        t.strstart += t.match_length, t.match_length = 0, t.legacy_hash && (t.ins_h = t.window[t.strstart], t.ins_h = Xs(t, t.ins_h, t.window[t.strstart + 1]));
    else
      o = Nt(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++;
    if (o && (at(t, !1), t.strm.avail_out === 0))
      return et;
  }
  return t.insert = t.strstart < B - 1 ? t.strstart : B - 1, e === ut ? (at(t, !0), t.strm.avail_out === 0 ? Qt : De) : t.sym_next && (at(t, !1), t.strm.avail_out === 0) ? et : Te;
}, ae = (t, e) => {
  let n, o, s;
  for (; ; ) {
    if (t.lookahead < St) {
      if (ke(t), t.lookahead < St && e === Gt)
        return et;
      if (t.lookahead === 0)
        break;
    }
    if (n = 0, t.lookahead >= B && (n = te(t, t.strstart)), t.prev_length = t.match_length, t.prev_match = t.match_start, t.match_length = B - 1, n !== 0 && t.prev_length < t.max_lazy_match && t.strstart - n <= t.w_size - St && (t.match_length = _f(t, n), t.match_length <= 5 && (t.strategy === sy || t.match_length === B && t.strstart - t.match_start > 4096) && (t.match_length = B - 1)), t.prev_length >= B && t.match_length <= t.prev_length) {
      s = t.strstart + t.lookahead - B, o = Nt(t, t.strstart - 1 - t.prev_match, t.prev_length - B), t.lookahead -= t.prev_length - 1, t.prev_length -= 2;
      do
        ++t.strstart <= s && (n = te(t, t.strstart));
      while (--t.prev_length !== 0);
      if (t.match_available = 0, t.match_length = B - 1, t.strstart++, o && (at(t, !1), t.strm.avail_out === 0))
        return et;
    } else if (t.match_available) {
      if (o = Nt(t, 0, t.window[t.strstart - 1]), o && at(t, !1), t.strstart++, t.lookahead--, t.strm.avail_out === 0)
        return et;
    } else
      t.match_available = 1, t.strstart++, t.lookahead--;
  }
  return t.match_available && (o = Nt(t, 0, t.window[t.strstart - 1]), t.match_available = 0), t.insert = t.strstart < B - 1 ? t.strstart : B - 1, e === ut ? (at(t, !0), t.strm.avail_out === 0 ? Qt : De) : t.sym_next && (at(t, !1), t.strm.avail_out === 0) ? et : Te;
}, wy = (t, e) => {
  let n, o, s, r;
  const i = t.window;
  for (; ; ) {
    if (t.lookahead <= Bt) {
      if (ke(t), t.lookahead <= Bt && e === Gt)
        return et;
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
    if (t.match_length >= B ? (n = Nt(t, 1, t.match_length - B), t.lookahead -= t.match_length, t.strstart += t.match_length, t.match_length = 0) : (n = Nt(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++), n && (at(t, !1), t.strm.avail_out === 0))
      return et;
  }
  return t.insert = 0, e === ut ? (at(t, !0), t.strm.avail_out === 0 ? Qt : De) : t.sym_next && (at(t, !1), t.strm.avail_out === 0) ? et : Te;
}, by = (t, e) => {
  let n;
  for (; ; ) {
    if (t.lookahead === 0 && (ke(t), t.lookahead === 0)) {
      if (e === Gt)
        return et;
      break;
    }
    if (t.match_length = 0, n = Nt(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++, n && (at(t, !1), t.strm.avail_out === 0))
      return et;
  }
  return t.insert = 0, e === ut ? (at(t, !0), t.strm.avail_out === 0 ? Qt : De) : t.sym_next && (at(t, !1), t.strm.avail_out === 0) ? et : Te;
};
function gt(t, e, n, o, s) {
  this.good_length = t, this.max_lazy = e, this.nice_length = n, this.max_chain = o, this.func = s;
}
const ze = [
  /*      good lazy nice chain */
  new gt(0, 0, 0, 0, wf),
  /* 0 store only */
  new gt(4, 4, 8, 4, Mo),
  /* 1 max speed, no lazy matches */
  new gt(4, 5, 16, 8, Mo),
  /* 2 */
  new gt(4, 6, 32, 32, Mo),
  /* 3 */
  new gt(4, 4, 16, 16, ae),
  /* 4 lazy matches */
  new gt(8, 16, 32, 32, ae),
  /* 5 */
  new gt(8, 16, 128, 128, ae),
  /* 6 */
  new gt(8, 32, 128, 256, ae),
  /* 7 */
  new gt(32, 128, 258, 1024, ae),
  /* 8 */
  new gt(32, 258, 258, 4096, ae)
  /* 9 max compression */
], Ay = (t) => {
  t.window_size = 2 * t.w_size, Rt(t.head), t.max_lazy_match = ze[t.level].max_lazy, t.good_match = ze[t.level].good_length, t.nice_match = ze[t.level].nice_length, t.max_chain_length = ze[t.level].max_chain, t.strstart = 0, t.block_start = 0, t.lookahead = 0, t.insert = 0, t.match_length = t.prev_length = B - 1, t.match_available = 0, t.ins_h = 0;
};
function Cy() {
  this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = uo, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.legacy_hash = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new Uint16Array(my * 2), this.dyn_dtree = new Uint16Array((2 * py + 1) * 2), this.bl_tree = new Uint16Array((2 * dy + 1) * 2), Rt(this.dyn_ltree), Rt(this.dyn_dtree), Rt(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new Uint16Array(yy + 1), this.heap = new Uint16Array(2 * ps + 1), Rt(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new Uint16Array(2 * ps + 1), Rt(this.depth), this.sym_buf = 0, this.lit_bufsize = 0, this.sym_next = 0, this.sym_end = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
}
const hn = (t) => {
  if (!t)
    return 1;
  const e = t.state;
  return !e || e.strm !== t || e.status !== Ie && //#ifdef GZIP
  e.status !== Zs && //#endif
  e.status !== ds && e.status !== ms && e.status !== ys && e.status !== xs && e.status !== Zt && e.status !== Ue ? 1 : 0;
}, bf = (t) => {
  if (hn(t))
    return Xt(t, xt);
  t.total_in = t.total_out = 0, t.data_type = cy;
  const e = t.state;
  return e.pending = 0, e.pending_out = 0, e.wrap < 0 && (e.wrap = -e.wrap), e.status = //#ifdef GZIP
  e.wrap === 2 ? Zs : (
    //#endif
    e.wrap ? Ie : Zt
  ), t.adler = e.wrap === 2 ? 0 : 1, e.last_flush = -2, Km(e), X;
}, Af = (t) => {
  const e = bf(t);
  return e === X && Ay(t.state), e;
}, vy = (t, e) => hn(t) || t.state.wrap !== 2 ? xt : (t.state.gzhead = e, X), Cf = (t, e, n, o, s, r, i) => {
  if (!t)
    return xt;
  let a = 1;
  if (e === oy && (e = 6), o < 0 ? (a = 0, o = -o) : o > 15 && (a = 2, o -= 16), s < 1 || s > fy || n !== uo || o < 8 || o > 15 || e < 0 || e > 9 || r < 0 || r > iy || o === 8 && a !== 1)
    return Xt(t, xt);
  o === 8 && (o = 9);
  const c = new Cy();
  return t.state = c, c.strm = t, c.status = Ie, c.wrap = a, c.gzhead = null, c.w_bits = o, c.w_size = 1 << c.w_bits, c.w_mask = c.w_size - 1, c.legacy_hash = i ? 1 : 0, c.hash_bits = s + 7, !c.legacy_hash && c.hash_bits < 15 && (c.hash_bits = 15), c.hash_size = 1 << c.hash_bits, c.hash_mask = c.hash_size - 1, c.hash_shift = ~~((c.hash_bits + B - 1) / B), c.window = new Uint8Array(c.w_size * 2), c.head = new Uint16Array(c.hash_size), c.prev = new Uint16Array(c.w_size), c.lit_bufsize = 1 << s + 6, c.pending_buf_size = c.lit_bufsize * 4, c.pending_buf = new Uint8Array(c.pending_buf_size), c.sym_buf = c.lit_bufsize, c.sym_end = (c.lit_bufsize - 1) * 3, c.level = e, c.strategy = r, c.method = n, Af(t);
}, Iy = (t, e) => Cf(t, e, uo, uy, ly, ay), ky = (t, e) => {
  if (hn(t) || e > si || e < 0)
    return t ? Xt(t, xt) : xt;
  const n = t.state;
  if (!t.output || t.avail_in !== 0 && !t.input || n.status === Ue && e !== ut)
    return Xt(t, t.avail_out === 0 ? Fo : xt);
  const o = n.last_flush;
  if (n.last_flush = e, n.pending !== 0) {
    if (it(t), t.avail_out === 0)
      return n.last_flush = -1, X;
  } else if (t.avail_in === 0 && ii(e) <= ii(o) && e !== ut)
    return Xt(t, Fo);
  if (n.status === Ue && t.avail_in !== 0)
    return Xt(t, Fo);
  if (n.status === Ie && n.wrap === 0 && (n.status = Zt), n.status === Ie) {
    let s = uo + (n.w_bits - 8 << 4) << 8, r = -1;
    if (n.strategy >= bn || n.level < 2 ? r = 0 : n.level < 6 ? r = 1 : n.level === 6 ? r = 2 : r = 3, s |= r << 6, n.strstart !== 0 && (s |= xy), s += 31 - s % 31, Ve(n, s), n.strstart !== 0 && (Ve(n, t.adler >>> 16), Ve(n, t.adler & 65535)), t.adler = 1, n.status = Zt, it(t), n.pending !== 0)
      return n.last_flush = -1, X;
  }
  if (n.status === Zs) {
    if (t.adler = 0, V(n, 31), V(n, 139), V(n, 8), n.gzhead)
      V(
        n,
        (n.gzhead.text ? 1 : 0) + (n.gzhead.hcrc ? 2 : 0) + (n.gzhead.extra ? 4 : 0) + (n.gzhead.name ? 8 : 0) + (n.gzhead.comment ? 16 : 0)
      ), V(n, n.gzhead.time & 255), V(n, n.gzhead.time >> 8 & 255), V(n, n.gzhead.time >> 16 & 255), V(n, n.gzhead.time >> 24 & 255), V(n, n.level === 9 ? 2 : n.strategy >= bn || n.level < 2 ? 4 : 0), V(n, n.gzhead.os & 255), n.gzhead.extra && n.gzhead.extra.length && (V(n, n.gzhead.extra.length & 255), V(n, n.gzhead.extra.length >> 8 & 255)), n.gzhead.hcrc && (t.adler = Y(t.adler, n.pending_buf, n.pending, 0)), n.gzindex = 0, n.status = ds;
    else if (V(n, 0), V(n, 0), V(n, 0), V(n, 0), V(n, 0), V(n, n.level === 9 ? 2 : n.strategy >= bn || n.level < 2 ? 4 : 0), V(n, Sy), n.status = Zt, it(t), n.pending !== 0)
      return n.last_flush = -1, X;
  }
  if (n.status === ds) {
    if (n.gzhead.extra) {
      let s = n.pending, r = (n.gzhead.extra.length & 65535) - n.gzindex;
      for (; n.pending + r > n.pending_buf_size; ) {
        let a = n.pending_buf_size - n.pending;
        if (n.pending_buf.set(n.gzhead.extra.subarray(n.gzindex, n.gzindex + a), n.pending), n.pending = n.pending_buf_size, n.gzhead.hcrc && n.pending > s && (t.adler = Y(t.adler, n.pending_buf, n.pending - s, s)), n.gzindex += a, it(t), n.pending !== 0)
          return n.last_flush = -1, X;
        s = 0, r -= a;
      }
      let i = new Uint8Array(n.gzhead.extra);
      n.pending_buf.set(i.subarray(n.gzindex, n.gzindex + r), n.pending), n.pending += r, n.gzhead.hcrc && n.pending > s && (t.adler = Y(t.adler, n.pending_buf, n.pending - s, s)), n.gzindex = 0;
    }
    n.status = ms;
  }
  if (n.status === ms) {
    if (n.gzhead.name) {
      let s = n.pending, r;
      do {
        if (n.pending === n.pending_buf_size) {
          if (n.gzhead.hcrc && n.pending > s && (t.adler = Y(t.adler, n.pending_buf, n.pending - s, s)), it(t), n.pending !== 0)
            return n.last_flush = -1, X;
          s = 0;
        }
        n.gzindex < n.gzhead.name.length ? r = n.gzhead.name.charCodeAt(n.gzindex++) & 255 : r = 0, V(n, r);
      } while (r !== 0);
      n.gzhead.hcrc && n.pending > s && (t.adler = Y(t.adler, n.pending_buf, n.pending - s, s)), n.gzindex = 0;
    }
    n.status = ys;
  }
  if (n.status === ys) {
    if (n.gzhead.comment) {
      let s = n.pending, r;
      do {
        if (n.pending === n.pending_buf_size) {
          if (n.gzhead.hcrc && n.pending > s && (t.adler = Y(t.adler, n.pending_buf, n.pending - s, s)), it(t), n.pending !== 0)
            return n.last_flush = -1, X;
          s = 0;
        }
        n.gzindex < n.gzhead.comment.length ? r = n.gzhead.comment.charCodeAt(n.gzindex++) & 255 : r = 0, V(n, r);
      } while (r !== 0);
      n.gzhead.hcrc && n.pending > s && (t.adler = Y(t.adler, n.pending_buf, n.pending - s, s));
    }
    n.status = xs;
  }
  if (n.status === xs) {
    if (n.gzhead.hcrc) {
      if (n.pending + 2 > n.pending_buf_size && (it(t), n.pending !== 0))
        return n.last_flush = -1, X;
      V(n, t.adler & 255), V(n, t.adler >> 8 & 255), t.adler = 0;
    }
    if (n.status = Zt, it(t), n.pending !== 0)
      return n.last_flush = -1, X;
  }
  if (t.avail_in !== 0 || n.lookahead !== 0 || e !== Gt && n.status !== Ue) {
    let s = n.level === 0 ? wf(n, e) : n.strategy === bn ? by(n, e) : n.strategy === ry ? wy(n, e) : ze[n.level].func(n, e);
    if ((s === Qt || s === De) && (n.status = Ue), s === et || s === Qt)
      return t.avail_out === 0 && (n.last_flush = -1), X;
    if (s === Te && (e === ty ? Qm(n) : e !== si && (gs(n, 0, 0, !1), e === ey && (Rt(n.head), n.lookahead === 0 && (n.strstart = 0, n.block_start = 0, n.insert = 0))), it(t), t.avail_out === 0))
      return n.last_flush = -1, X;
  }
  return e !== ut ? X : n.wrap <= 0 ? ri : (n.wrap === 2 ? (V(n, t.adler & 255), V(n, t.adler >> 8 & 255), V(n, t.adler >> 16 & 255), V(n, t.adler >> 24 & 255), V(n, t.total_in & 255), V(n, t.total_in >> 8 & 255), V(n, t.total_in >> 16 & 255), V(n, t.total_in >> 24 & 255)) : (Ve(n, t.adler >>> 16), Ve(n, t.adler & 65535)), it(t), n.wrap > 0 && (n.wrap = -n.wrap), n.pending !== 0 ? X : ri);
}, Oy = (t) => {
  if (hn(t))
    return xt;
  const e = t.state.status;
  return t.state = null, e === Zt ? Xt(t, ny) : X;
}, Ey = (t, e) => {
  let n = e.length;
  if (hn(t))
    return xt;
  const o = t.state, s = o.wrap;
  if (s === 2 || s === 1 && o.status !== Ie || o.lookahead)
    return xt;
  if (s === 1 && (t.adler = sn(t.adler, e, n, 0)), o.wrap = 0, n >= o.w_size) {
    s === 0 && (Rt(o.head), o.strstart = 0, o.block_start = 0, o.insert = 0);
    let c = new Uint8Array(o.w_size);
    c.set(e.subarray(n - o.w_size, n), 0), e = c, n = o.w_size;
  }
  const r = t.avail_in, i = t.next_in, a = t.input;
  for (t.avail_in = n, t.next_in = 0, t.input = e, ke(o); o.lookahead >= B; ) {
    let c = o.strstart, f = o.lookahead - (B - 1);
    do
      te(o, c), c++;
    while (--f);
    o.strstart = c, o.lookahead = B - 1, ke(o);
  }
  return o.strstart += o.lookahead, o.block_start = o.strstart, o.insert = o.lookahead, o.lookahead = 0, o.match_length = o.prev_length = B - 1, o.match_available = 0, t.next_in = i, t.input = a, t.avail_in = r, o.wrap = s, X;
};
var Ty = Iy, Dy = Cf, Ry = Af, Fy = bf, My = vy, Ly = ky, By = Oy, Vy = Ey, $y = "pako deflate (from Nodeca project)", qe = {
  deflateInit: Ty,
  deflateInit2: Dy,
  deflateReset: Ry,
  deflateResetKeep: Fy,
  deflateSetHeader: My,
  deflate: Ly,
  deflateEnd: By,
  deflateSetDictionary: Vy,
  deflateInfo: $y
};
const Ny = (t, e) => Object.prototype.hasOwnProperty.call(t, e);
var Gy = function(t) {
  const e = Array.prototype.slice.call(arguments, 1);
  for (; e.length; ) {
    const n = e.shift();
    if (n) {
      if (typeof n != "object")
        throw new TypeError(n + "must be non-object");
      for (const o in n)
        Ny(n, o) && (t[o] = n[o]);
    }
  }
  return t;
}, Py = (t) => {
  let e = 0;
  for (let o = 0, s = t.length; o < s; o++)
    e += t[o].length;
  const n = new Uint8Array(e);
  for (let o = 0, s = 0, r = t.length; o < r; o++) {
    let i = t[o];
    n.set(i, s), s += i.length;
  }
  return n;
}, lo = {
  assign: Gy,
  flattenChunks: Py
};
let vf = !0;
try {
  String.fromCharCode.apply(null, new Uint8Array(1));
} catch {
  vf = !1;
}
const rn = new Uint8Array(256);
for (let t = 0; t < 256; t++)
  rn[t] = t >= 252 ? 6 : t >= 248 ? 5 : t >= 240 ? 4 : t >= 224 ? 3 : t >= 192 ? 2 : 1;
rn[254] = rn[255] = 1;
var Uy = (t) => {
  if (typeof TextEncoder == "function" && TextEncoder.prototype.encode)
    return new TextEncoder().encode(t);
  let e, n, o, s, r, i = t.length, a = 0;
  for (s = 0; s < i; s++)
    n = t.charCodeAt(s), (n & 64512) === 55296 && s + 1 < i && (o = t.charCodeAt(s + 1), (o & 64512) === 56320 && (n = 65536 + (n - 55296 << 10) + (o - 56320), s++)), a += n < 128 ? 1 : n < 2048 ? 2 : n < 65536 ? 3 : 4;
  for (e = new Uint8Array(a), r = 0, s = 0; r < a; s++)
    n = t.charCodeAt(s), (n & 64512) === 55296 && s + 1 < i && (o = t.charCodeAt(s + 1), (o & 64512) === 56320 && (n = 65536 + (n - 55296 << 10) + (o - 56320), s++)), n < 128 ? e[r++] = n : n < 2048 ? (e[r++] = 192 | n >>> 6, e[r++] = 128 | n & 63) : n < 65536 ? (e[r++] = 224 | n >>> 12, e[r++] = 128 | n >>> 6 & 63, e[r++] = 128 | n & 63) : (e[r++] = 240 | n >>> 18, e[r++] = 128 | n >>> 12 & 63, e[r++] = 128 | n >>> 6 & 63, e[r++] = 128 | n & 63);
  return e;
};
const zy = (t, e) => {
  if (e < 65534 && t.subarray && vf)
    return String.fromCharCode.apply(null, t.length === e ? t : t.subarray(0, e));
  let n = "";
  for (let o = 0; o < e; o++)
    n += String.fromCharCode(t[o]);
  return n;
};
var Hy = (t, e) => {
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
  return zy(r, s);
}, Wy = (t, e) => {
  e = e || t.length, e > t.length && (e = t.length);
  let n = e - 1;
  for (; n >= 0 && (t[n] & 192) === 128; )
    n--;
  return n < 0 || n === 0 ? e : n + rn[t[n]] > e ? n : e;
}, an = {
  string2buf: Uy,
  buf2string: Hy,
  utf8border: Wy
};
function jy() {
  this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
}
var If = jy;
const kf = Object.prototype.toString, {
  Z_NO_FLUSH: qy,
  Z_SYNC_FLUSH: Yy,
  Z_FULL_FLUSH: Zy,
  Z_FINISH: Xy,
  Z_OK: jn,
  Z_STREAM_END: Ky,
  Z_DEFAULT_COMPRESSION: Jy,
  Z_DEFAULT_STRATEGY: Qy,
  Z_DEFLATED: tx
} = fo, ex = {
  level: Jy,
  method: tx,
  chunkSize: 16384,
  windowBits: 15,
  memLevel: 8,
  strategy: Qy,
  legacyHash: !0
};
function ho(t) {
  this.options = lo.assign({}, ex, t || {});
  let e = this.options;
  e.raw && e.windowBits > 0 ? e.windowBits = -e.windowBits : e.gzip && e.windowBits > 0 && e.windowBits < 16 && (e.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new If(), this.strm.avail_out = 0;
  let n = qe.deflateInit2(
    this.strm,
    e.level,
    e.method,
    e.windowBits,
    e.memLevel,
    e.strategy,
    e.legacyHash
  );
  if (n !== jn)
    throw new Error(Jt[n]);
  if (e.header && qe.deflateSetHeader(this.strm, e.header), e.dictionary) {
    let o;
    if (typeof e.dictionary == "string" ? o = an.string2buf(e.dictionary) : kf.call(e.dictionary) === "[object ArrayBuffer]" ? o = new Uint8Array(e.dictionary) : o = e.dictionary, n = qe.deflateSetDictionary(this.strm, o), n !== jn)
      throw new Error(Jt[n]);
    this._dict_set = !0;
  }
}
ho.prototype.push = function(t, e) {
  const n = this.strm, o = this.options.chunkSize;
  let s, r;
  if (this.ended)
    return !1;
  for (e === ~~e ? r = e : r = e === !0 ? Xy : qy, typeof t == "string" ? n.input = an.string2buf(t) : kf.call(t) === "[object ArrayBuffer]" ? n.input = new Uint8Array(t) : n.input = t, n.next_in = 0, n.avail_in = n.input.length; ; ) {
    if (n.avail_out === 0 && (n.output = new Uint8Array(o), n.next_out = 0, n.avail_out = o), (r === Yy || r === Zy) && n.avail_out <= 6) {
      this.onData(n.output.subarray(0, n.next_out)), n.avail_out = 0;
      continue;
    }
    if (s = qe.deflate(n, r), s === Ky)
      return n.next_out > 0 && this.onData(n.output.subarray(0, n.next_out)), s = qe.deflateEnd(this.strm), this.onEnd(s), this.ended = !0, s === jn;
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
ho.prototype.onData = function(t) {
  this.chunks.push(t);
};
ho.prototype.onEnd = function(t) {
  t === jn && (this.result = lo.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;
};
function nx(t, e) {
  const n = new ho(e);
  if (n.push(t, !0), n.err)
    throw n.msg || Jt[n.err];
  return n.result;
}
var ox = nx, sx = {
  deflate: ox
};
const An = 16209, rx = 16191;
var ix = function(e, n) {
  let o, s, r, i, a, c, f, u, l, h, p, g, d, x, m, y, w, _, S, b, A, k, O, I;
  const T = e.state;
  o = e.next_in, O = e.input, s = o + (e.avail_in - 5), r = e.next_out, I = e.output, i = r - (n - e.avail_out), a = r + (e.avail_out - 257), c = T.dmax, f = T.wsize, u = T.whave, l = T.wnext, h = T.window, p = T.hold, g = T.bits, d = T.lencode, x = T.distcode, m = (1 << T.lenbits) - 1, y = (1 << T.distbits) - 1;
  t:
    do {
      g < 15 && (p += O[o++] << g, g += 8, p += O[o++] << g, g += 8), w = d[p & m];
      e:
        for (; ; ) {
          if (_ = w >>> 24, p >>>= _, g -= _, _ = w >>> 16 & 255, _ === 0)
            I[r++] = w & 65535;
          else if (_ & 16) {
            S = w & 65535, _ &= 15, _ && (g < _ && (p += O[o++] << g, g += 8), S += p & (1 << _) - 1, p >>>= _, g -= _), g < 15 && (p += O[o++] << g, g += 8, p += O[o++] << g, g += 8), w = x[p & y];
            n:
              for (; ; ) {
                if (_ = w >>> 24, p >>>= _, g -= _, _ = w >>> 16 & 255, _ & 16) {
                  if (b = w & 65535, _ &= 15, g < _ && (p += O[o++] << g, g += 8, g < _ && (p += O[o++] << g, g += 8)), b += p & (1 << _) - 1, b > c) {
                    e.msg = "invalid distance too far back", T.mode = An;
                    break t;
                  }
                  if (p >>>= _, g -= _, _ = r - i, b > _) {
                    if (_ = b - _, _ > u && T.sane) {
                      e.msg = "invalid distance too far back", T.mode = An;
                      break t;
                    }
                    if (A = 0, k = h, l === 0) {
                      if (A += f - _, _ < S) {
                        S -= _;
                        do
                          I[r++] = h[A++];
                        while (--_);
                        A = r - b, k = I;
                      }
                    } else if (l < _) {
                      if (A += f + l - _, _ -= l, _ < S) {
                        S -= _;
                        do
                          I[r++] = h[A++];
                        while (--_);
                        if (A = 0, l < S) {
                          _ = l, S -= _;
                          do
                            I[r++] = h[A++];
                          while (--_);
                          A = r - b, k = I;
                        }
                      }
                    } else if (A += l - _, _ < S) {
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
                  e.msg = "invalid distance code", T.mode = An;
                  break t;
                }
                break;
              }
          } else if ((_ & 64) === 0) {
            w = d[(w & 65535) + (p & (1 << _) - 1)];
            continue e;
          } else if (_ & 32) {
            T.mode = rx;
            break t;
          } else {
            e.msg = "invalid literal/length code", T.mode = An;
            break t;
          }
          break;
        }
    } while (o < s && r < a);
  S = g >> 3, o -= S, g -= S << 3, p &= (1 << g) - 1, e.next_in = o, e.next_out = r, e.avail_in = o < s ? 5 + (s - o) : 5 - (o - s), e.avail_out = r < a ? 257 + (a - r) : 257 - (r - a), T.hold = p, T.bits = g;
};
const ce = 15, ai = 852, ci = 592, fi = 0, Lo = 1, ui = 2, ax = new Uint16Array([
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
]), cx = new Uint8Array([
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
]), fx = new Uint16Array([
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
]), ux = new Uint8Array([
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
]), lx = (t, e, n, o, s, r, i, a) => {
  const c = a.bits;
  let f = 0, u = 0, l = 0, h = 0, p = 0, g = 0, d = 0, x = 0, m = 0, y = 0, w, _, S, b, A, k = null, O;
  const I = new Uint16Array(ce + 1), T = new Uint16Array(ce + 1);
  let E = null, D, R, M;
  for (f = 0; f <= ce; f++)
    I[f] = 0;
  for (u = 0; u < o; u++)
    I[e[n + u]]++;
  for (p = c, h = ce; h >= 1 && I[h] === 0; h--)
    ;
  if (p > h && (p = h), h === 0)
    return s[r++] = 1 << 24 | 64 << 16 | 0, s[r++] = 1 << 24 | 64 << 16 | 0, a.bits = 1, 0;
  for (l = 1; l < h && I[l] === 0; l++)
    ;
  for (p < l && (p = l), x = 1, f = 1; f <= ce; f++)
    if (x <<= 1, x -= I[f], x < 0)
      return -1;
  if (x > 0 && (t === fi || h !== 1))
    return -1;
  for (T[1] = 0, f = 1; f < ce; f++)
    T[f + 1] = T[f] + I[f];
  for (u = 0; u < o; u++)
    e[n + u] !== 0 && (i[T[e[n + u]]++] = u);
  if (t === fi ? (k = E = i, O = 20) : t === Lo ? (k = ax, E = cx, O = 257) : (k = fx, E = ux, O = 0), y = 0, u = 0, f = l, A = r, g = p, d = 0, S = -1, m = 1 << p, b = m - 1, t === Lo && m > ai || t === ui && m > ci)
    return 1;
  for (; ; ) {
    D = f - d, i[u] + 1 < O ? (R = 0, M = i[u]) : i[u] >= O ? (R = E[i[u] - O], M = k[i[u] - O]) : (R = 96, M = 0), w = 1 << f - d, _ = 1 << g, l = _;
    do
      _ -= w, s[A + (y >> d) + _] = D << 24 | R << 16 | M | 0;
    while (_ !== 0);
    for (w = 1 << f - 1; y & w; )
      w >>= 1;
    if (w !== 0 ? (y &= w - 1, y += w) : y = 0, u++, --I[f] === 0) {
      if (f === h)
        break;
      f = e[n + i[u]];
    }
    if (f > p && (y & b) !== S) {
      for (d === 0 && (d = p), A += l, g = f - d, x = 1 << g; g + d < h && (x -= I[g + d], !(x <= 0)); )
        g++, x <<= 1;
      if (m += 1 << g, t === Lo && m > ai || t === ui && m > ci)
        return 1;
      S = y & b, s[S] = p << 24 | g << 16 | A - r | 0;
    }
  }
  return y !== 0 && (s[A + y] = f - d << 24 | 64 << 16 | 0), a.bits = p, 0;
};
var Ye = lx;
const hx = 0, Of = 1, Ef = 2, {
  Z_FINISH: li,
  Z_BLOCK: gx,
  Z_TREES: Cn,
  Z_OK: ee,
  Z_STREAM_END: px,
  Z_NEED_DICT: dx,
  Z_STREAM_ERROR: lt,
  Z_DATA_ERROR: Tf,
  Z_MEM_ERROR: Df,
  Z_BUF_ERROR: mx,
  Z_DEFLATED: hi
} = fo, go = 16180, gi = 16181, pi = 16182, di = 16183, mi = 16184, yi = 16185, xi = 16186, Si = 16187, _i = 16188, wi = 16189, qn = 16190, Ct = 16191, Bo = 16192, bi = 16193, Vo = 16194, Ai = 16195, Ci = 16196, vi = 16197, Ii = 16198, vn = 16199, In = 16200, ki = 16201, Oi = 16202, Ei = 16203, Ti = 16204, Di = 16205, $o = 16206, Ri = 16207, Fi = 16208, H = 16209, Rf = 16210, Ff = 16211, yx = 852, xx = 592, Sx = 15, _x = Sx, Mi = (t) => (t >>> 24 & 255) + (t >>> 8 & 65280) + ((t & 65280) << 8) + ((t & 255) << 24);
function wx() {
  this.strm = null, this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new Uint16Array(320), this.work = new Uint16Array(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
}
const oe = (t) => {
  if (!t)
    return 1;
  const e = t.state;
  return !e || e.strm !== t || e.mode < go || e.mode > Ff ? 1 : 0;
}, Mf = (t) => {
  if (oe(t))
    return lt;
  const e = t.state;
  return t.total_in = t.total_out = e.total = 0, t.msg = "", e.wrap && (t.adler = e.wrap & 1), e.mode = go, e.last = 0, e.havedict = 0, e.flags = -1, e.dmax = 32768, e.head = null, e.hold = 0, e.bits = 0, e.lencode = e.lendyn = new Int32Array(yx), e.distcode = e.distdyn = new Int32Array(xx), e.sane = 1, e.back = -1, ee;
}, Lf = (t) => {
  if (oe(t))
    return lt;
  const e = t.state;
  return e.wsize = 0, e.whave = 0, e.wnext = 0, Mf(t);
}, Bf = (t, e) => {
  let n;
  if (oe(t))
    return lt;
  const o = t.state;
  return e < 0 ? (n = 0, e = -e) : (n = (e >> 4) + 5, e < 48 && (e &= 15)), e && (e < 8 || e > 15) ? lt : (o.window !== null && o.wbits !== e && (o.window = null), o.wrap = n, o.wbits = e, Lf(t));
}, Vf = (t, e) => {
  if (!t)
    return lt;
  const n = new wx();
  t.state = n, n.strm = t, n.window = null, n.mode = go;
  const o = Bf(t, e);
  return o !== ee && (t.state = null), o;
}, bx = (t) => Vf(t, _x);
let Li = !0, No, Go;
const Ax = (t) => {
  if (Li) {
    No = new Int32Array(512), Go = new Int32Array(32);
    let e = 0;
    for (; e < 144; )
      t.lens[e++] = 8;
    for (; e < 256; )
      t.lens[e++] = 9;
    for (; e < 280; )
      t.lens[e++] = 7;
    for (; e < 288; )
      t.lens[e++] = 8;
    for (Ye(Of, t.lens, 0, 288, No, 0, t.work, { bits: 9 }), e = 0; e < 32; )
      t.lens[e++] = 5;
    Ye(Ef, t.lens, 0, 32, Go, 0, t.work, { bits: 5 }), Li = !1;
  }
  t.lencode = No, t.lenbits = 9, t.distcode = Go, t.distbits = 5;
}, $f = (t, e, n, o) => {
  let s;
  const r = t.state;
  return r.window === null && (r.window = new Uint8Array(1 << r.wbits)), r.wsize === 0 && (r.wsize = 1 << r.wbits, r.wnext = 0, r.whave = 0), o >= r.wsize ? (r.window.set(e.subarray(n - r.wsize, n), 0), r.wnext = 0, r.whave = r.wsize) : (s = r.wsize - r.wnext, s > o && (s = o), r.window.set(e.subarray(n - o, n - o + s), r.wnext), o -= s, o ? (r.window.set(e.subarray(n - o, n), 0), r.wnext = o, r.whave = r.wsize) : (r.wnext += s, r.wnext === r.wsize && (r.wnext = 0), r.whave < r.wsize && (r.whave += s))), 0;
}, Cx = (t, e) => {
  let n, o, s, r, i, a, c, f, u, l, h, p, g, d, x = 0, m, y, w, _, S, b, A, k;
  const O = new Uint8Array(4);
  let I, T;
  const E = (
    /* permutation of code lengths */
    new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15])
  );
  if (oe(t) || !t.output || !t.input && t.avail_in !== 0)
    return lt;
  n = t.state, n.mode === Ct && (n.mode = Bo), i = t.next_out, s = t.output, c = t.avail_out, r = t.next_in, o = t.input, a = t.avail_in, f = n.hold, u = n.bits, l = a, h = c, k = ee;
  t:
    for (; ; )
      switch (n.mode) {
        case go:
          if (n.wrap === 0) {
            n.mode = Bo;
            break;
          }
          for (; u < 16; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << u, u += 8;
          }
          if (n.wrap & 2 && f === 35615) {
            n.wbits === 0 && (n.wbits = 15), n.check = 0, O[0] = f & 255, O[1] = f >>> 8 & 255, n.check = Y(n.check, O, 2, 0), f = 0, u = 0, n.mode = gi;
            break;
          }
          if (n.head && (n.head.done = !1), !(n.wrap & 1) || /* check if zlib header allowed */
          (((f & 255) << 8) + (f >> 8)) % 31) {
            t.msg = "incorrect header check", n.mode = H;
            break;
          }
          if ((f & 15) !== hi) {
            t.msg = "unknown compression method", n.mode = H;
            break;
          }
          if (f >>>= 4, u -= 4, A = (f & 15) + 8, n.wbits === 0 && (n.wbits = A), A > 15 || A > n.wbits) {
            t.msg = "invalid window size", n.mode = H;
            break;
          }
          n.dmax = 1 << n.wbits, n.flags = 0, t.adler = n.check = 1, n.mode = f & 512 ? wi : Ct, f = 0, u = 0;
          break;
        case gi:
          for (; u < 16; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << u, u += 8;
          }
          if (n.flags = f, (n.flags & 255) !== hi) {
            t.msg = "unknown compression method", n.mode = H;
            break;
          }
          if (n.flags & 57344) {
            t.msg = "unknown header flags set", n.mode = H;
            break;
          }
          n.head && (n.head.text = f >> 8 & 1), n.flags & 512 && n.wrap & 4 && (O[0] = f & 255, O[1] = f >>> 8 & 255, n.check = Y(n.check, O, 2, 0)), f = 0, u = 0, n.mode = pi;
        /* falls through */
        case pi:
          for (; u < 32; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << u, u += 8;
          }
          n.head && (n.head.time = f), n.flags & 512 && n.wrap & 4 && (O[0] = f & 255, O[1] = f >>> 8 & 255, O[2] = f >>> 16 & 255, O[3] = f >>> 24 & 255, n.check = Y(n.check, O, 4, 0)), f = 0, u = 0, n.mode = di;
        /* falls through */
        case di:
          for (; u < 16; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << u, u += 8;
          }
          n.head && (n.head.xflags = f & 255, n.head.os = f >> 8), n.flags & 512 && n.wrap & 4 && (O[0] = f & 255, O[1] = f >>> 8 & 255, n.check = Y(n.check, O, 2, 0)), f = 0, u = 0, n.mode = mi;
        /* falls through */
        case mi:
          if (n.flags & 1024) {
            for (; u < 16; ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << u, u += 8;
            }
            n.length = f, n.head && (n.head.extra_len = f), n.flags & 512 && n.wrap & 4 && (O[0] = f & 255, O[1] = f >>> 8 & 255, n.check = Y(n.check, O, 2, 0)), f = 0, u = 0;
          } else n.head && (n.head.extra = null);
          n.mode = yi;
        /* falls through */
        case yi:
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
          n.length = 0, n.mode = xi;
        /* falls through */
        case xi:
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
          n.length = 0, n.mode = Si;
        /* falls through */
        case Si:
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
          n.mode = _i;
        /* falls through */
        case _i:
          if (n.flags & 512) {
            for (; u < 16; ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << u, u += 8;
            }
            if (n.wrap & 4 && f !== (n.check & 65535)) {
              t.msg = "header crc mismatch", n.mode = H;
              break;
            }
            f = 0, u = 0;
          }
          n.head && (n.head.hcrc = n.flags >> 9 & 1, n.head.done = !0), t.adler = n.check = 0, n.mode = Ct;
          break;
        case wi:
          for (; u < 32; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << u, u += 8;
          }
          t.adler = n.check = Mi(f), f = 0, u = 0, n.mode = qn;
        /* falls through */
        case qn:
          if (n.havedict === 0)
            return t.next_out = i, t.avail_out = c, t.next_in = r, t.avail_in = a, n.hold = f, n.bits = u, dx;
          t.adler = n.check = 1, n.mode = Ct;
        /* falls through */
        case Ct:
          if (e === gx || e === Cn)
            break t;
        /* falls through */
        case Bo:
          if (n.last) {
            f >>>= u & 7, u -= u & 7, n.mode = $o;
            break;
          }
          for (; u < 3; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << u, u += 8;
          }
          switch (n.last = f & 1, f >>>= 1, u -= 1, f & 3) {
            case 0:
              n.mode = bi;
              break;
            case 1:
              if (Ax(n), n.mode = vn, e === Cn) {
                f >>>= 2, u -= 2;
                break t;
              }
              break;
            case 2:
              n.mode = Ci;
              break;
            case 3:
              t.msg = "invalid block type", n.mode = H;
          }
          f >>>= 2, u -= 2;
          break;
        case bi:
          for (f >>>= u & 7, u -= u & 7; u < 32; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << u, u += 8;
          }
          if ((f & 65535) !== (f >>> 16 ^ 65535)) {
            t.msg = "invalid stored block lengths", n.mode = H;
            break;
          }
          if (n.length = f & 65535, f = 0, u = 0, n.mode = Vo, e === Cn)
            break t;
        /* falls through */
        case Vo:
          n.mode = Ai;
        /* falls through */
        case Ai:
          if (p = n.length, p) {
            if (p > a && (p = a), p > c && (p = c), p === 0)
              break t;
            s.set(o.subarray(r, r + p), i), a -= p, r += p, c -= p, i += p, n.length -= p;
            break;
          }
          n.mode = Ct;
          break;
        case Ci:
          for (; u < 14; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << u, u += 8;
          }
          if (n.nlen = (f & 31) + 257, f >>>= 5, u -= 5, n.ndist = (f & 31) + 1, f >>>= 5, u -= 5, n.ncode = (f & 15) + 4, f >>>= 4, u -= 4, n.nlen > 286 || n.ndist > 30) {
            t.msg = "too many length or distance symbols", n.mode = H;
            break;
          }
          n.have = 0, n.mode = vi;
        /* falls through */
        case vi:
          for (; n.have < n.ncode; ) {
            for (; u < 3; ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << u, u += 8;
            }
            n.lens[E[n.have++]] = f & 7, f >>>= 3, u -= 3;
          }
          for (; n.have < 19; )
            n.lens[E[n.have++]] = 0;
          if (n.lencode = n.lendyn, n.lenbits = 7, I = { bits: n.lenbits }, k = Ye(hx, n.lens, 0, 19, n.lencode, 0, n.work, I), n.lenbits = I.bits, k) {
            t.msg = "invalid code lengths set", n.mode = H;
            break;
          }
          n.have = 0, n.mode = Ii;
        /* falls through */
        case Ii:
          for (; n.have < n.nlen + n.ndist; ) {
            for (; x = n.lencode[f & (1 << n.lenbits) - 1], m = x >>> 24, y = x >>> 16 & 255, w = x & 65535, !(m <= u); ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << u, u += 8;
            }
            if (w < 16)
              f >>>= m, u -= m, n.lens[n.have++] = w;
            else {
              if (w === 16) {
                for (T = m + 2; u < T; ) {
                  if (a === 0)
                    break t;
                  a--, f += o[r++] << u, u += 8;
                }
                if (f >>>= m, u -= m, n.have === 0) {
                  t.msg = "invalid bit length repeat", n.mode = H;
                  break;
                }
                A = n.lens[n.have - 1], p = 3 + (f & 3), f >>>= 2, u -= 2;
              } else if (w === 17) {
                for (T = m + 3; u < T; ) {
                  if (a === 0)
                    break t;
                  a--, f += o[r++] << u, u += 8;
                }
                f >>>= m, u -= m, A = 0, p = 3 + (f & 7), f >>>= 3, u -= 3;
              } else {
                for (T = m + 7; u < T; ) {
                  if (a === 0)
                    break t;
                  a--, f += o[r++] << u, u += 8;
                }
                f >>>= m, u -= m, A = 0, p = 11 + (f & 127), f >>>= 7, u -= 7;
              }
              if (n.have + p > n.nlen + n.ndist) {
                t.msg = "invalid bit length repeat", n.mode = H;
                break;
              }
              for (; p--; )
                n.lens[n.have++] = A;
            }
          }
          if (n.mode === H)
            break;
          if (n.lens[256] === 0) {
            t.msg = "invalid code -- missing end-of-block", n.mode = H;
            break;
          }
          if (n.lenbits = 9, I = { bits: n.lenbits }, k = Ye(Of, n.lens, 0, n.nlen, n.lencode, 0, n.work, I), n.lenbits = I.bits, k) {
            t.msg = "invalid literal/lengths set", n.mode = H;
            break;
          }
          if (n.distbits = 6, n.distcode = n.distdyn, I = { bits: n.distbits }, k = Ye(Ef, n.lens, n.nlen, n.ndist, n.distcode, 0, n.work, I), n.distbits = I.bits, k) {
            t.msg = "invalid distances set", n.mode = H;
            break;
          }
          if (n.mode = vn, e === Cn)
            break t;
        /* falls through */
        case vn:
          n.mode = In;
        /* falls through */
        case In:
          if (a >= 6 && c >= 258) {
            t.next_out = i, t.avail_out = c, t.next_in = r, t.avail_in = a, n.hold = f, n.bits = u, ix(t, h), i = t.next_out, s = t.output, c = t.avail_out, r = t.next_in, o = t.input, a = t.avail_in, f = n.hold, u = n.bits, n.mode === Ct && (n.back = -1);
            break;
          }
          for (n.back = 0; x = n.lencode[f & (1 << n.lenbits) - 1], m = x >>> 24, y = x >>> 16 & 255, w = x & 65535, !(m <= u); ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << u, u += 8;
          }
          if (y && (y & 240) === 0) {
            for (_ = m, S = y, b = w; x = n.lencode[b + ((f & (1 << _ + S) - 1) >> _)], m = x >>> 24, y = x >>> 16 & 255, w = x & 65535, !(_ + m <= u); ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << u, u += 8;
            }
            f >>>= _, u -= _, n.back += _;
          }
          if (f >>>= m, u -= m, n.back += m, n.length = w, y === 0) {
            n.mode = Di;
            break;
          }
          if (y & 32) {
            n.back = -1, n.mode = Ct;
            break;
          }
          if (y & 64) {
            t.msg = "invalid literal/length code", n.mode = H;
            break;
          }
          n.extra = y & 15, n.mode = ki;
        /* falls through */
        case ki:
          if (n.extra) {
            for (T = n.extra; u < T; ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << u, u += 8;
            }
            n.length += f & (1 << n.extra) - 1, f >>>= n.extra, u -= n.extra, n.back += n.extra;
          }
          n.was = n.length, n.mode = Oi;
        /* falls through */
        case Oi:
          for (; x = n.distcode[f & (1 << n.distbits) - 1], m = x >>> 24, y = x >>> 16 & 255, w = x & 65535, !(m <= u); ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << u, u += 8;
          }
          if ((y & 240) === 0) {
            for (_ = m, S = y, b = w; x = n.distcode[b + ((f & (1 << _ + S) - 1) >> _)], m = x >>> 24, y = x >>> 16 & 255, w = x & 65535, !(_ + m <= u); ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << u, u += 8;
            }
            f >>>= _, u -= _, n.back += _;
          }
          if (f >>>= m, u -= m, n.back += m, y & 64) {
            t.msg = "invalid distance code", n.mode = H;
            break;
          }
          n.offset = w, n.extra = y & 15, n.mode = Ei;
        /* falls through */
        case Ei:
          if (n.extra) {
            for (T = n.extra; u < T; ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << u, u += 8;
            }
            n.offset += f & (1 << n.extra) - 1, f >>>= n.extra, u -= n.extra, n.back += n.extra;
          }
          if (n.offset > n.dmax) {
            t.msg = "invalid distance too far back", n.mode = H;
            break;
          }
          n.mode = Ti;
        /* falls through */
        case Ti:
          if (c === 0)
            break t;
          if (p = h - c, n.offset > p) {
            if (p = n.offset - p, p > n.whave && n.sane) {
              t.msg = "invalid distance too far back", n.mode = H;
              break;
            }
            p > n.wnext ? (p -= n.wnext, g = n.wsize - p) : g = n.wnext - p, p > n.length && (p = n.length), d = n.window;
          } else
            d = s, g = i - n.offset, p = n.length;
          p > c && (p = c), c -= p, n.length -= p;
          do
            s[i++] = d[g++];
          while (--p);
          n.length === 0 && (n.mode = In);
          break;
        case Di:
          if (c === 0)
            break t;
          s[i++] = n.length, c--, n.mode = In;
          break;
        case $o:
          if (n.wrap) {
            for (; u < 32; ) {
              if (a === 0)
                break t;
              a--, f |= o[r++] << u, u += 8;
            }
            if (h -= c, t.total_out += h, n.total += h, n.wrap & 4 && h && (t.adler = n.check = /*UPDATE_CHECK(state.check, put - _out, _out);*/
            n.flags ? Y(n.check, s, h, i - h) : sn(n.check, s, h, i - h)), h = c, n.wrap & 4 && (n.flags ? f : Mi(f)) !== n.check) {
              t.msg = "incorrect data check", n.mode = H;
              break;
            }
            f = 0, u = 0;
          }
          n.mode = Ri;
        /* falls through */
        case Ri:
          if (n.wrap && n.flags) {
            for (; u < 32; ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << u, u += 8;
            }
            if (n.wrap & 4 && f !== (n.total & 4294967295)) {
              t.msg = "incorrect length check", n.mode = H;
              break;
            }
            f = 0, u = 0;
          }
          n.mode = Fi;
        /* falls through */
        case Fi:
          k = px;
          break t;
        case H:
          k = Tf;
          break t;
        case Rf:
          return Df;
        case Ff:
        /* falls through */
        default:
          return lt;
      }
  return t.next_out = i, t.avail_out = c, t.next_in = r, t.avail_in = a, n.hold = f, n.bits = u, (n.wsize || h !== t.avail_out && n.mode < H && (n.mode < $o || e !== li)) && $f(t, t.output, t.next_out, h - t.avail_out), l -= t.avail_in, h -= t.avail_out, t.total_in += l, t.total_out += h, n.total += h, n.wrap & 4 && h && (t.adler = n.check = /*UPDATE_CHECK(state.check, strm.next_out - _out, _out);*/
  n.flags ? Y(n.check, s, h, t.next_out - h) : sn(n.check, s, h, t.next_out - h)), t.data_type = n.bits + (n.last ? 64 : 0) + (n.mode === Ct ? 128 : 0) + (n.mode === vn || n.mode === Vo ? 256 : 0), (l === 0 && h === 0 || e === li) && k === ee && (k = mx), k;
}, vx = (t) => {
  if (oe(t))
    return lt;
  let e = t.state;
  return e.window && (e.window = null), t.state = null, ee;
}, Ix = (t, e) => {
  if (oe(t))
    return lt;
  const n = t.state;
  return (n.wrap & 2) === 0 ? lt : (n.head = e, e.done = !1, ee);
}, kx = (t, e) => {
  const n = e.length;
  let o, s, r;
  return oe(t) || (o = t.state, o.wrap !== 0 && o.mode !== qn) ? lt : o.mode === qn && (s = 1, s = sn(s, e, n, 0), s !== o.check) ? Tf : (r = $f(t, e, n, n), r ? (o.mode = Rf, Df) : (o.havedict = 1, ee));
};
var Ox = Lf, Ex = Bf, Tx = Mf, Dx = bx, Rx = Vf, Fx = Cx, Mx = vx, Lx = Ix, Bx = kx, Vx = "pako inflate (from Nodeca project)", dt = {
  inflateReset: Ox,
  inflateReset2: Ex,
  inflateResetKeep: Tx,
  inflateInit: Dx,
  inflateInit2: Rx,
  inflate: Fx,
  inflateEnd: Mx,
  inflateGetHeader: Lx,
  inflateSetDictionary: Bx,
  inflateInfo: Vx
};
function $x() {
  this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
}
var Nx = $x;
const Nf = Object.prototype.toString, {
  Z_NO_FLUSH: Gx,
  Z_FINISH: Bi,
  Z_OK: Se,
  Z_STREAM_END: Po,
  Z_NEED_DICT: Uo,
  Z_STREAM_ERROR: Px,
  Z_DATA_ERROR: Vi,
  Z_MEM_ERROR: Ux,
  Z_BUF_ERROR: $i
} = fo, zx = {
  chunkSize: 1024 * 64,
  windowBits: 15,
  to: ""
};
function po(t) {
  this.options = lo.assign({}, zx, t || {});
  const e = this.options;
  e.raw && e.windowBits >= 0 && e.windowBits < 16 && (e.windowBits = -e.windowBits, e.windowBits === 0 && (e.windowBits = -15)), e.windowBits >= 0 && e.windowBits < 16 && !(t && t.windowBits) && (e.windowBits += 32), e.windowBits > 15 && e.windowBits < 48 && (e.windowBits & 15) === 0 && (e.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new If(), this.strm.avail_out = 0;
  let n = dt.inflateInit2(
    this.strm,
    e.windowBits
  );
  if (n !== Se)
    throw new Error(Jt[n]);
  if (this.header = new Nx(), dt.inflateGetHeader(this.strm, this.header), e.dictionary && (typeof e.dictionary == "string" ? e.dictionary = an.string2buf(e.dictionary) : Nf.call(e.dictionary) === "[object ArrayBuffer]" && (e.dictionary = new Uint8Array(e.dictionary)), e.raw && (n = dt.inflateSetDictionary(this.strm, e.dictionary), n !== Se)))
    throw new Error(Jt[n]);
}
po.prototype.push = function(t, e) {
  const n = this.strm, o = this.options.chunkSize, s = this.options.dictionary;
  let r, i, a;
  if (this.ended) return !1;
  for (e === ~~e ? i = e : i = e === !0 ? Bi : Gx, Nf.call(t) === "[object ArrayBuffer]" ? n.input = new Uint8Array(t) : n.input = t, n.next_in = 0, n.avail_in = n.input.length; ; ) {
    for (n.avail_out === 0 && (n.output = new Uint8Array(o), n.next_out = 0, n.avail_out = o), r = dt.inflate(n, i), r === Uo && s && (r = dt.inflateSetDictionary(n, s), r === Se ? r = dt.inflate(n, i) : r === Vi && (r = Uo)); n.avail_in > 0 && r === Po && n.state.wrap & 2 && n.state.flags !== 0 && n.input[n.next_in] !== 0; )
      dt.inflateReset(n), r = dt.inflate(n, i);
    switch (r) {
      case Px:
      case Vi:
      case Uo:
      case Ux:
        return this.onEnd(r), this.ended = !0, !1;
    }
    if (a = n.avail_out, n.next_out && (n.avail_out === 0 || r === Po || i > 0))
      if (this.options.to === "string") {
        let c = an.utf8border(n.output, n.next_out), f = n.next_out - c, u = an.buf2string(n.output, c);
        n.next_out = f, n.avail_out = o - f, f && n.output.set(n.output.subarray(c, c + f), 0), this.onData(u);
      } else
        this.onData(n.output.length === n.next_out ? n.output : n.output.subarray(0, n.next_out)), n.avail_out = 0, n.next_out = 0;
    if (!((r === Se || r === $i) && a === 0)) {
      if (r === Po)
        return r = dt.inflateEnd(this.strm), this.onEnd(r), this.ended = !0, !0;
      if (n.avail_in === 0) {
        if (i === Bi)
          return r = dt.inflateEnd(this.strm), this.onEnd(r === Se ? $i : r), this.ended = !0, !1;
        break;
      }
    }
  }
  return !0;
};
po.prototype.onData = function(t) {
  this.chunks.push(t);
};
po.prototype.onEnd = function(t) {
  t === Se && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = lo.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;
};
function Hx(t, e) {
  const n = new po(e);
  if (n.push(t, !0), n.err) throw n.msg || Jt[n.err];
  return n.result;
}
var Wx = Hx, jx = {
  inflate: Wx
};
const { deflate: qx } = sx, { inflate: Yx } = jx;
var Ni = qx, Gi = Yx;
const Gf = 2001684038, _s = 44, ws = 20, Yn = 12, Zn = 16;
function Pf(t) {
  const e = new DataView(t), n = new Uint8Array(t);
  if (e.getUint32(0) !== Gf)
    throw new Error("Invalid WOFF1 signature");
  const s = e.getUint32(4), r = e.getUint16(12), i = e.getUint32(24), a = e.getUint32(28), c = e.getUint32(36), f = e.getUint32(40), u = [];
  let l = _s;
  for (let O = 0; O < r; O++)
    u.push({
      tag: String.fromCharCode(
        e.getUint8(l),
        e.getUint8(l + 1),
        e.getUint8(l + 2),
        e.getUint8(l + 3)
      ),
      offset: e.getUint32(l + 4),
      compLength: e.getUint32(l + 8),
      origLength: e.getUint32(l + 12),
      origChecksum: e.getUint32(l + 16)
    }), l += ws;
  const h = u.map((O) => {
    const I = n.subarray(
      O.offset,
      O.offset + O.compLength
    );
    let T;
    if (O.compLength < O.origLength) {
      if (T = Gi(I), T.length !== O.origLength)
        throw new Error(
          `WOFF1 table '${O.tag}': decompressed size ${T.length} !== expected ${O.origLength}`
        );
    } else
      T = I;
    return {
      tag: O.tag,
      checksum: O.origChecksum,
      data: T,
      length: O.origLength,
      paddedLength: O.origLength + (4 - O.origLength % 4) % 4
    };
  }), p = Yn + r * Zn;
  let g = p + (4 - p % 4) % 4;
  const { searchRange: d, entrySelector: x, rangeShift: m } = Zx(r);
  let y = g;
  for (const O of h)
    y += O.paddedLength;
  const w = new ArrayBuffer(y), _ = new DataView(w), S = new Uint8Array(w);
  _.setUint32(0, s), _.setUint16(4, r), _.setUint16(6, d), _.setUint16(8, x), _.setUint16(10, m);
  const b = h.map((O, I) => ({ ...O, originalIndex: I })).sort((O, I) => O.tag < I.tag ? -1 : O.tag > I.tag ? 1 : 0);
  for (let O = 0; O < b.length; O++) {
    const I = b[O], T = Yn + O * Zn;
    for (let E = 0; E < 4; E++)
      _.setUint8(T + E, I.tag.charCodeAt(E));
    _.setUint32(T + 4, I.checksum), _.setUint32(T + 8, g), _.setUint32(T + 12, I.length), S.set(I.data, g), g += I.paddedLength;
  }
  let A = null;
  if (i && a) {
    const O = n.subarray(i, i + a);
    A = Gi(O);
  }
  let k = null;
  return c && f && (k = n.slice(c, c + f)), { sfnt: w, metadata: A, privateData: k };
}
function bs(t, e = null, n = null) {
  const o = new DataView(t), s = new Uint8Array(t), r = o.getUint32(0), i = o.getUint16(4), a = [];
  for (let b = 0; b < i; b++) {
    const A = Yn + b * Zn;
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
    const A = s.subarray(b.offset, b.offset + b.length), k = Ni(A), O = k.length < b.length;
    return {
      tag: b.tag,
      origChecksum: b.checksum,
      origLength: b.length,
      data: O ? k : A,
      compLength: O ? k.length : b.length
    };
  });
  let f = null, u = 0;
  e && e.length > 0 && (u = e.length, f = Ni(e));
  let h = _s + i * ws;
  h += (4 - h % 4) % 4;
  for (const b of c)
    b.woffOffset = h, h += b.compLength, h += (4 - h % 4) % 4;
  let p = 0, g = 0;
  f && (p = h, g = f.length, h += g, h += (4 - h % 4) % 4);
  let d = 0, x = 0;
  n && n.length > 0 && (d = h, x = n.length, h += x);
  const m = h;
  let y = Yn + i * Zn;
  for (const b of c)
    y += b.origLength + (4 - b.origLength % 4) % 4;
  const w = new ArrayBuffer(m), _ = new DataView(w), S = new Uint8Array(w);
  _.setUint32(0, Gf), _.setUint32(4, r), _.setUint32(8, m), _.setUint16(12, i), _.setUint16(14, 0), _.setUint32(16, y), _.setUint16(20, 0), _.setUint16(22, 0), _.setUint32(24, p), _.setUint32(28, g), _.setUint32(32, u), _.setUint32(36, d), _.setUint32(40, x);
  for (let b = 0; b < c.length; b++) {
    const A = c[b], k = _s + b * ws;
    for (let O = 0; O < 4; O++)
      _.setUint8(k + O, A.tag.charCodeAt(O));
    _.setUint32(k + 4, A.woffOffset), _.setUint32(k + 8, A.compLength), _.setUint32(k + 12, A.origLength), _.setUint32(k + 16, A.origChecksum);
  }
  for (const b of c)
    S.set(b.data, b.woffOffset);
  return f && S.set(f, p), n && n.length > 0 && S.set(n, d), w;
}
function Zx(t) {
  let e = 1, n = 0;
  for (; e * 2 <= t; )
    e *= 2, n++;
  e *= 16;
  const o = t * 16 - e;
  return { searchRange: e, entrySelector: n, rangeShift: o };
}
let Xn = null, _e = null;
async function Uf() {
  if (!_e)
    try {
      const { brotliCompressSync: t, brotliDecompressSync: e } = await import("node:zlib");
      if (typeof t != "function" || typeof e != "function")
        throw new Error("node:zlib brotli functions unavailable");
      Xn = (n) => new Uint8Array(t(n)), _e = (n) => new Uint8Array(e(n));
    } catch {
      const t = await import("brotli-wasm"), e = await (t.default || t);
      Xn = e.compress, _e = e.decompress;
    }
}
function zf() {
  if (!_e)
    throw new Error(
      "WOFF2 support requires initialization. Call `await initWoff2()` before importing or exporting WOFF2 files."
    );
}
const Hf = 2001684018, As = 48, cn = 12, fn = 16, Cs = [
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
], Wf = /* @__PURE__ */ new Map();
for (let t = 0; t < Cs.length; t++) Wf.set(Cs[t], t);
function Pi(t, e) {
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
function Xx(t) {
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
function we(t, e) {
  const n = t[e];
  return n === 253 ? { value: t[e + 1] << 8 | t[e + 2], bytesRead: 3 } : n === 255 ? { value: t[e + 1] + 253, bytesRead: 2 } : n === 254 ? { value: t[e + 1] + 506, bytesRead: 2 } : { value: n, bytesRead: 1 };
}
const Kx = Jx();
function Jx() {
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
function Qx(t, e, n) {
  const o = t & 127, s = !(t & 128), r = Kx[o];
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
    const f = e[c++], u = e[c++], l = e[c++];
    i = r.xSign * ((f << 4 | u >> 4) + r.deltaX), a = r.ySign * (((u & 15) << 8 | l) + r.deltaY);
  } else r.xBits === 16 && r.yBits === 16 && (i = r.xSign * ((e[c++] << 8 | e[c++]) + r.deltaX), a = r.ySign * ((e[c++] << 8 | e[c++]) + r.deltaY));
  return { dx: i, dy: a, onCurve: s, bytesConsumed: c - n };
}
function tS(t, e, n, o, s, r, i, a, c) {
  const f = [];
  yt(f, t), yt(f, s), yt(f, r), yt(f, i), yt(f, a);
  for (const g of e) Is(f, g);
  Is(f, o.length);
  for (let g = 0; g < o.length; g++) f.push(o[g]);
  const u = [], l = [], h = [];
  for (let g = 0; g < n.length; g++) {
    const { dx: d, dy: x, onCurve: m } = n[g];
    let y = m ? 1 : 0;
    if (g === 0 && c && (y |= 64), d === 0)
      y |= 16;
    else if (d >= -255 && d <= 255)
      y |= 2, d > 0 ? (y |= 16, l.push(d)) : l.push(-d);
    else {
      const w = d & 65535;
      l.push(w >> 8 & 255, w & 255);
    }
    if (x === 0)
      y |= 32;
    else if (x >= -255 && x <= 255)
      y |= 4, x > 0 ? (y |= 32, h.push(x)) : h.push(-x);
    else {
      const w = x & 65535;
      h.push(w >> 8 & 255, w & 255);
    }
    u.push(y);
  }
  let p = 0;
  for (; p < u.length; ) {
    const g = u[p];
    let d = 0;
    for (; p + d + 1 < u.length && u[p + d + 1] === g && d < 255; )
      d++;
    d > 0 ? (f.push(g | 8), f.push(d), p += d + 1) : (f.push(g), p++);
  }
  for (const g of l) f.push(g);
  for (const g of h) f.push(g);
  return f;
}
function eS(t, e, n, o, s, r) {
  const i = [];
  yt(i, -1), yt(i, n), yt(i, o), yt(i, s), yt(i, r);
  for (let a = 0; a < t.length; a++) i.push(t[a]);
  if (e && e.length > 0) {
    Is(i, e.length);
    for (let a = 0; a < e.length; a++) i.push(e[a]);
  }
  return i;
}
function nS(t, e) {
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
  const c = It(n, o);
  o += 4;
  const f = It(n, o);
  o += 4;
  const u = It(n, o);
  o += 4;
  const l = It(n, o);
  o += 4;
  const h = It(n, o);
  o += 4;
  const p = It(n, o);
  o += 4;
  const g = It(n, o);
  o += 4;
  const d = o, x = d + c, m = x + f, y = m + u, w = y + l, _ = w + h, S = _ + p, b = 4 * Math.floor((i + 31) / 32), A = _, k = A + b;
  function O(tt) {
    const ct = tt >> 3, Et = 7 - (tt & 7);
    return !!(n[A + ct] & 1 << Et);
  }
  const I = !!(r & 1), T = S + g;
  function E(tt) {
    if (!I) return !1;
    const ct = tt >> 3, Et = 7 - (tt & 7);
    return !!(n[T + ct] & 1 << Et);
  }
  let D = d, R = x, M = m, L = y, W = w, P = k, Z = S;
  const J = [], Q = [0];
  let wt = 0;
  for (let tt = 0; tt < i; tt++) {
    const ct = ft(n, D);
    if (D += 2, ct === 0) {
      J.push(null), Q.push(wt);
      continue;
    }
    if (ct > 0) {
      const Et = [];
      let re = 0;
      for (let ht = 0; ht < ct; ht++) {
        const { value: At, bytesRead: ie } = we(n, R);
        R += ie, re += At, Et.push(re - 1);
      }
      const Re = [];
      for (let ht = 0; ht < re; ht++) {
        const At = n[M++], { dx: ie, dy: cu, onCurve: fu, bytesConsumed: uu } = Qx(
          At,
          n,
          L
        );
        L += uu, Re.push({ dx: ie, dy: cu, onCurve: fu });
      }
      const { value: Fe, bytesRead: mo } = we(
        n,
        L
      );
      L += mo;
      const yo = n.subarray(
        Z,
        Z + Fe
      );
      Z += Fe;
      let Ut, zt, bt, Ht;
      if (O(tt))
        Ut = ft(n, P), P += 2, zt = ft(n, P), P += 2, bt = ft(n, P), P += 2, Ht = ft(n, P), P += 2;
      else {
        let ht = 0, At = 0;
        Ut = 32767, zt = 32767, bt = -32768, Ht = -32768;
        for (const ie of Re)
          ht += ie.dx, At += ie.dy, ht < Ut && (Ut = ht), ht > bt && (bt = ht), At < zt && (zt = At), At > Ht && (Ht = At);
      }
      const rt = tS(
        ct,
        Et,
        Re,
        yo,
        Ut,
        zt,
        bt,
        Ht,
        E(tt)
      );
      J.push(rt);
      const xo = rt.length + (rt.length % 2 ? 1 : 0);
      wt += xo, Q.push(wt);
    } else {
      const Et = W;
      let re = !1;
      for (; ; ) {
        const rt = n[W] << 8 | n[W + 1];
        if (W += 2, W += 2, rt & 1 ? W += 4 : W += 2, rt & 8 ? W += 2 : rt & 64 ? W += 4 : rt & 128 && (W += 8), rt & 256 && (re = !0), !(rt & 32)) break;
      }
      const Re = n.subarray(Et, W);
      let Fe = new Uint8Array(0);
      if (re) {
        const { value: rt, bytesRead: xo } = we(
          n,
          L
        );
        L += xo, Fe = n.subarray(Z, Z + rt), Z += rt;
      }
      const mo = ft(n, P);
      P += 2;
      const yo = ft(n, P);
      P += 2;
      const Ut = ft(n, P);
      P += 2;
      const zt = ft(n, P);
      P += 2;
      const bt = eS(
        Re,
        Fe,
        mo,
        yo,
        Ut,
        zt
      );
      J.push(bt);
      const Ht = bt.length + (bt.length % 2 ? 1 : 0);
      wt += Ht, Q.push(wt);
    }
  }
  const se = new Uint8Array(wt);
  let gn = 0;
  for (const tt of J)
    if (tt !== null) {
      for (let ct = 0; ct < tt.length; ct++)
        se[gn++] = tt[ct];
      tt.length % 2 && gn++;
    }
  return { glyfBytes: se, locaOffsets: Q, indexFormat: a };
}
function oS(t, e, n, o, s) {
  const r = t;
  let i = 0;
  const a = r[i++], c = !(a & 1), f = !(a & 2), u = [];
  for (let m = 0; m < e; m++)
    u.push(r[i] << 8 | r[i + 1]), i += 2;
  const l = [];
  if (c)
    for (let m = 0; m < e; m++)
      l.push(ft(r, i)), i += 2;
  else
    for (let m = 0; m < e; m++)
      l.push(Ui(o, s, m));
  const h = n - e, p = [];
  if (f)
    for (let m = 0; m < h; m++)
      p.push(ft(r, i)), i += 2;
  else
    for (let m = 0; m < h; m++)
      p.push(
        Ui(o, s, e + m)
      );
  const g = e * 4 + h * 2, d = new Uint8Array(g);
  let x = 0;
  for (let m = 0; m < e; m++) {
    d[x++] = u[m] >> 8 & 255, d[x++] = u[m] & 255;
    const y = l[m] & 65535;
    d[x++] = y >> 8 & 255, d[x++] = y & 255;
  }
  for (let m = 0; m < h; m++) {
    const y = p[m] & 65535;
    d[x++] = y >> 8 & 255, d[x++] = y & 255;
  }
  return d;
}
function Ui(t, e, n) {
  const o = e[n], s = e[n + 1];
  return o === s ? 0 : ft(t, o + 2);
}
function sS(t, e) {
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
function jf(t) {
  zf();
  const e = new Uint8Array(t), n = new DataView(t);
  if (n.getUint32(0) !== Hf)
    throw new Error("Invalid WOFF2 signature");
  const s = n.getUint32(4), r = n.getUint16(12), i = n.getUint32(20), a = n.getUint32(28), c = n.getUint32(32), f = n.getUint32(40), u = n.getUint32(44);
  let l = As;
  const h = [];
  for (let E = 0; E < r; E++) {
    const D = e[l++], R = D & 63, M = D >> 6 & 3;
    let L;
    R === 63 ? (L = String.fromCharCode(
      e[l],
      e[l + 1],
      e[l + 2],
      e[l + 3]
    ), l += 4) : L = Cs[R];
    const { value: W, bytesRead: P } = Pi(
      e,
      l
    );
    l += P;
    let Z = W;
    const J = L === "glyf" || L === "loca", Q = L === "hmtx";
    if (J && M === 0 || Q && M === 1 || !J && !Q && M !== 0) {
      const { value: se, bytesRead: gn } = Pi(e, l);
      l += gn, Z = se;
    }
    L === "loca" && M === 0 && (Z = 0), h.push({
      tag: L,
      transformVersion: M,
      origLength: W,
      transformLength: Z,
      isTransformed: J ? M === 0 : Q ? M === 1 : M !== 0
    });
  }
  let p = null;
  if (s === 1953784678) {
    const E = It(e, l);
    l += 4;
    const { value: D, bytesRead: R } = we(
      e,
      l
    );
    l += R;
    const M = [];
    for (let L = 0; L < D; L++) {
      const { value: W, bytesRead: P } = we(
        e,
        l
      );
      l += P;
      const Z = It(e, l);
      l += 4;
      const J = [];
      for (let Q = 0; Q < W; Q++) {
        const { value: wt, bytesRead: se } = we(e, l);
        l += se, J.push(wt);
      }
      M.push({
        numTables: W,
        flavor: Z,
        tableIndices: J
      });
    }
    p = { version: E, numFonts: D, fonts: M };
  }
  const g = l, d = e.subarray(
    g,
    g + i
  ), x = _e(d);
  let m = 0;
  const y = /* @__PURE__ */ new Map();
  for (const E of h) {
    const D = E.isTransformed ? E.transformLength : E.origLength, R = x.subarray(m, m + D);
    m += D, y.set(E.tag, { data: R, entry: E });
  }
  const w = /* @__PURE__ */ new Map();
  let _ = null;
  const S = y.get("glyf"), b = y.get("loca");
  S && S.entry.isTransformed && (b && b.entry.origLength, _ = nS(S.data), w.set("glyf", _.glyfBytes), w.set(
    "loca",
    sS(_.locaOffsets, _.indexFormat)
  ));
  const A = y.get("hmtx");
  if (A && A.entry.isTransformed && _) {
    const E = y.get("hhea"), D = y.get("maxp");
    let R = 0, M = 0;
    E && (R = E.data[34] << 8 | E.data[35]), D && (M = D.data[4] << 8 | D.data[5]), w.set(
      "hmtx",
      oS(
        A.data,
        R,
        M,
        _.glyfBytes,
        _.locaOffsets
      )
    );
  }
  const k = [];
  for (const E of h) {
    const D = E.tag;
    let R;
    w.has(D) ? R = w.get(D) : R = y.get(D).data, k.push({ tag: D, data: R, length: R.length });
  }
  let O;
  p ? O = rS(p, k) : O = qf(s, k);
  let I = null;
  if (a && c) {
    const E = e.subarray(a, a + c);
    I = _e(E);
  }
  let T = null;
  return f && u && (T = e.slice(f, f + u)), { sfnt: O.buffer, metadata: I, privateData: T };
}
function qf(t, e) {
  const n = e.length, { searchRange: o, entrySelector: s, rangeShift: r } = iS(n), i = cn + n * fn;
  let a = i + (4 - i % 4) % 4;
  const c = e.map((h, p) => ({ ...h, index: p })).sort((h, p) => h.tag < p.tag ? -1 : h.tag > p.tag ? 1 : 0);
  let f = a;
  for (const h of c)
    f += h.length + (4 - h.length % 4) % 4;
  const u = new Uint8Array(f), l = new DataView(u.buffer);
  l.setUint32(0, t), l.setUint16(4, n), l.setUint16(6, o), l.setUint16(8, s), l.setUint16(10, r);
  for (let h = 0; h < c.length; h++) {
    const p = c[h], g = cn + h * fn;
    for (let x = 0; x < 4; x++)
      u[g + x] = p.tag.charCodeAt(x);
    const d = Yf(p.data);
    l.setUint32(g + 4, d), l.setUint32(g + 8, a), l.setUint32(g + 12, p.length), u.set(
      p.data instanceof Uint8Array ? p.data : new Uint8Array(p.data),
      a
    ), a += p.length + (4 - p.length % 4) % 4;
  }
  return aS(u, c), u;
}
function rS(t, e, n) {
  const o = [];
  for (const l of t.fonts) {
    const h = l.tableIndices.map((g) => e[g]), p = qf(l.flavor, h);
    o.push(p);
  }
  const s = o.length;
  let i = 12 + s * 4;
  i += (4 - i % 4) % 4;
  const a = [];
  let c = i;
  for (const l of o)
    a.push(c), c += l.length, c += (4 - c % 4) % 4;
  const f = new Uint8Array(c), u = new DataView(f.buffer);
  u.setUint32(0, 1953784678), u.setUint32(4, t.version), u.setUint32(8, s);
  for (let l = 0; l < s; l++)
    u.setUint32(12 + l * 4, a[l]);
  for (let l = 0; l < s; l++)
    f.set(o[l], a[l]);
  return f;
}
function vs(t, e = null, n = null) {
  zf();
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
  const c = a.filter((R) => R.tag !== "DSIG"), f = [], u = [];
  let l = cn + c.length * fn;
  for (const R of c) {
    const M = s.subarray(R.offset, R.offset + R.length), L = Wf.get(R.tag), P = R.tag === "glyf" || R.tag === "loca" ? 3 : 0, J = [(L !== void 0 ? L : 63) | P << 6];
    if (L === void 0)
      for (let Q = 0; Q < 4; Q++) J.push(R.tag.charCodeAt(Q));
    J.push(...Xx(R.length)), f.push(J), u.push(M), l += R.length + (4 - R.length % 4) % 4;
  }
  let h = 0;
  for (const R of u) h += R.length;
  const p = new Uint8Array(h);
  let g = 0;
  for (const R of u)
    p.set(R, g), g += R.length;
  const d = Xn(p);
  let x = null, m = 0;
  e && e.length > 0 && (m = e.length, x = Xn(e));
  const y = [];
  for (const R of f) y.push(...R);
  let _ = As + y.length;
  const S = _;
  _ += d.length;
  let b = 0, A = 0;
  x && (_ += (4 - _ % 4) % 4, b = _, A = x.length, _ += A);
  let k = 0, O = 0;
  n && n.length > 0 && (_ += (4 - _ % 4) % 4, k = _, O = n.length, _ += O);
  const I = _, T = new ArrayBuffer(I), E = new DataView(T), D = new Uint8Array(T);
  E.setUint32(0, Hf), E.setUint32(4, r), E.setUint32(8, I), E.setUint16(12, c.length), E.setUint16(14, 0), E.setUint32(16, l), E.setUint32(20, d.length), E.setUint16(24, 0), E.setUint16(26, 0), E.setUint32(28, b), E.setUint32(32, A), E.setUint32(36, m), E.setUint32(40, k), E.setUint32(44, O);
  for (let R = 0; R < y.length; R++)
    D[As + R] = y[R];
  return D.set(
    d instanceof Uint8Array ? d : new Uint8Array(d),
    S
  ), x && D.set(
    x instanceof Uint8Array ? x : new Uint8Array(x),
    b
  ), n && n.length > 0 && D.set(n, k), T;
}
function It(t, e) {
  return (t[e] << 24 | t[e + 1] << 16 | t[e + 2] << 8 | t[e + 3]) >>> 0;
}
function ft(t, e) {
  const n = t[e] << 8 | t[e + 1];
  return n > 32767 ? n - 65536 : n;
}
function yt(t, e) {
  const n = e & 65535;
  t.push(n >> 8 & 255, n & 255);
}
function Is(t, e) {
  t.push(e >> 8 & 255, e & 255);
}
function iS(t) {
  let e = 1, n = 0;
  for (; e * 2 <= t; )
    e *= 2, n++;
  e *= 16;
  const o = t * 16 - e;
  return { searchRange: e, entrySelector: n, rangeShift: o };
}
function Yf(t) {
  let e = 0;
  const n = t.length, o = n + (4 - n % 4) % 4;
  for (let s = 0; s < o; s += 4)
    e = e + ((t[s] || 0) << 24 | (t[s + 1] || 0) << 16 | (t[s + 2] || 0) << 8 | (t[s + 3] || 0)) >>> 0;
  return e;
}
function aS(t, e) {
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
  const s = 2981146554 - Yf(t) >>> 0;
  t[n + 8] = s >> 24 & 255, t[n + 9] = s >> 16 & 255, t[n + 10] = s >> 8 & 255, t[n + 11] = s & 255;
}
const cS = {
  cmap: eg,
  head: Sc,
  hhea: Qp,
  HVAR: rd,
  hmtx: ed,
  maxp: Ud,
  MVAR: Zd,
  name: n1,
  hdmx: Yp,
  BASE: A0,
  JSTF: md,
  MATH: $d,
  MERG: Hd,
  meta: qd,
  DSIG: Ug,
  LTSH: Ld,
  CBLC: ye,
  CBDT: Ls,
  "OS/2": s1,
  kern: vd,
  PCLT: a1,
  VDMX: v1,
  post: Lc,
  STAT: y1,
  "CFF ": qa,
  CFF2: Ph,
  VORG: Wh,
  fvar: Jg,
  avar: Yh,
  loca: of,
  glyf: fm,
  gvar: ym,
  GDEF: sp,
  GPOS: Sp,
  GSUB: $p,
  "cvt ": tm,
  cvar: J1,
  fpgm: nm,
  prep: wm,
  gasp: sm,
  vhea: T1,
  VVAR: B1,
  vmtx: R1,
  COLR: Bg,
  CPAL: $g,
  EBDT: Wg,
  EBLC: qg,
  EBSC: Zg,
  bloc: G0,
  bdat: R0,
  sbix: h1,
  ltag: Fd,
  "SVG ": _1
}, zi = 12, Hi = 16;
function fS(t, e) {
  const n = t.padEnd(4, " "), o = e.padEnd(4, " ");
  for (let s = 0; s < 4; s++) {
    const r = n.charCodeAt(s) - o.charCodeAt(s);
    if (r !== 0) return r;
  }
  return 0;
}
function uS(t) {
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
const lS = /* @__PURE__ */ new Set([
  "sfnt",
  "woff",
  "woff2",
  "cff",
  "ttf",
  "otf"
]), Wi = {
  ttf: "truetype",
  otf: "cff"
};
function hS(t) {
  if (t._standalone === "cff") return "cff";
  const e = t._woff?.version;
  return e === 2 ? "woff2" : e === 1 ? "woff" : "sfnt";
}
function ji(t, e = {}) {
  if (!t || typeof t != "object")
    throw new TypeError("exportFont expects a font data object");
  let n = e.format ? e.format.toLowerCase() : hS(t);
  if (!lS.has(n))
    throw new Error(
      `Unknown export format "${n}". Supported: sfnt, woff, woff2, cff, ttf, otf.`
    );
  if (Wi[n] && (t = Sa(t, Wi[n]), n = "sfnt"), pS(t)) {
    if (n === "cff")
      throw new Error("CFF export does not support font collections.");
    if (e.split)
      return gS(t, n);
    const r = yS(t);
    return n === "woff" ? bs(
      r,
      t._woff?.metadata,
      t._woff?.privateData
    ) : n === "woff2" ? vs(
      r,
      t._woff?.metadata,
      t._woff?.privateData
    ) : r;
  }
  if (n === "cff") {
    const i = Kn(t).tables["CFF "];
    if (!i)
      throw new Error(
        "CFF export requires CFF glyph data. This font uses TrueType outlines."
      );
    const a = qa(i), c = new ArrayBuffer(a.length);
    return new Uint8Array(c).set(a), c;
  }
  const o = Kn(t), s = Jn(o, 0);
  if (n === "woff") {
    const r = t._woff?.metadata ?? null, i = t._woff?.privateData ?? null;
    return bs(s, r, i);
  }
  if (n === "woff2") {
    const r = t._woff?.metadata ?? null, i = t._woff?.privateData ?? null;
    return vs(s, r, i);
  }
  return s;
}
function gS(t, e) {
  const { fonts: n } = t;
  if (!Array.isArray(n) || n.length === 0)
    throw new Error("Collection split expects a non-empty fonts array");
  return n.map((o) => {
    const s = Kn(o), r = Jn(s, 0);
    return e === "woff" ? bs(r) : e === "woff2" ? vs(r) : r;
  });
}
function pS(t) {
  return t.collection && t.collection.tag === "ttcf" && Array.isArray(t.fonts);
}
function qi(t, e) {
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
function dS(t, e) {
  const n = e?.unitsPerEm || 1e3;
  if (n === 1e3) return;
  const o = t?.fonts?.[0];
  if (!o) return;
  o.topDict = o.topDict || {};
  const s = 1 / n, r = o.topDict.FontMatrix;
  Array.isArray(r) && r.length === 6 && Math.abs(r[0] - s) < 1e-9 && r[1] === 0 && r[2] === 0 && Math.abs(r[3] - s) < 1e-9 || (o.topDict.FontMatrix = [s, 0, 0, s, 0, 0]);
}
function mS(t, e) {
  const n = t?.fonts?.[0];
  if (!n || !Array.isArray(n.charStrings)) return;
  const o = t.globalSubrs || [], s = n.localSubrs || [], r = n.privateDict?.nominalWidthX ?? 0, i = n.privateDict?.defaultWidthX ?? 0, a = Math.min(n.charStrings.length, e.length);
  for (let c = 0; c < a; c++) {
    const f = e[c]?.advanceWidth;
    Number.isFinite(f) && (n.charStrings[c] = Da(n.charStrings[c], f, {
      globalSubrs: o,
      localSubrs: s,
      nominalWidthX: r,
      defaultWidthX: i
    }));
  }
}
function Kn(t) {
  if (t.header && t.tables)
    return t;
  if (t._header && t.tables && t.font && t.glyphs) {
    const e = ur(t);
    for (const [n, o] of Object.entries(t.tables))
      !zu.has(n) && !e.tables[n] && (e.tables[n] = o);
    return t.tables["CFF "] && e.tables["CFF "] && qi(t.tables["CFF "], t.glyphs) && (e.tables["CFF "] = t.tables["CFF "], dS(e.tables["CFF "], t.font), mS(e.tables["CFF "], t.glyphs)), t.tables.CFF2 && e.tables.CFF2 && qi(t.tables.CFF2, t.glyphs) && (e.tables.CFF2 = t.tables.CFF2), e;
  }
  if (t._header && t.tables)
    return { header: t._header, tables: t.tables };
  if (t.font && t.glyphs)
    return ur(t);
  throw new Error(
    "exportFont: input must have { header, tables } or { font, glyphs }"
  );
}
function Jn(t, e) {
  const { header: n, tables: o } = t, s = Object.keys(o).sort(fS), r = s.length, i = xS(o), a = s.map((y) => {
    const w = o[y];
    let _;
    if (i.has(y))
      _ = i.get(y);
    else if (w._raw)
      _ = w._raw;
    else {
      const A = cS[y];
      if (!A)
        throw new Error(`No writer registered for parsed table: ${y}`);
      _ = A(w);
    }
    const S = new Uint8Array(_), b = w._raw && typeof w._checksum == "number" && !i.has(y);
    return {
      tag: y,
      data: S,
      length: S.length,
      paddedLength: S.length + (4 - S.length % 4) % 4,
      checksum: b ? w._checksum >>> 0 : uS(S)
    };
  }), c = zi + r * Hi;
  let f = c + (4 - c % 4) % 4;
  for (const y of a)
    y.offset = f, f += y.paddedLength;
  const u = f, l = new ArrayBuffer(u), h = new DataView(l), p = new Uint8Array(l), g = r > 0 ? 2 ** Math.floor(Math.log2(r)) : 0, d = g * 16, x = g > 0 ? Math.floor(Math.log2(g)) : 0, m = r * 16 - d;
  h.setUint32(0, n.sfVersion), h.setUint16(4, r), h.setUint16(6, d), h.setUint16(8, x), h.setUint16(10, m);
  for (let y = 0; y < a.length; y++) {
    const w = a[y], _ = zi + y * Hi;
    for (let S = 0; S < 4; S++)
      h.setUint8(_ + S, w.tag.charCodeAt(S));
    h.setUint32(_ + 4, w.checksum), h.setUint32(_ + 8, w.offset + e), h.setUint32(_ + 12, w.length);
  }
  for (const y of a)
    p.set(y.data, y.offset);
  return l;
}
function yS(t) {
  const { collection: e, fonts: n } = t;
  if (!Array.isArray(n) || n.length === 0)
    throw new Error("TTC/OTC export expects a non-empty fonts array");
  const o = n.map((m) => Kn(m)), s = e.majorVersion ?? 2, r = e.minorVersion ?? 0, i = o.length, a = s >= 2, c = 12 + i * 4 + (a ? 12 : 0);
  let f = c + (4 - c % 4) % 4;
  const l = o.map(
    (m) => new Uint8Array(Jn(m, 0))
  ).map((m) => {
    const y = f;
    return f += m.length, f += (4 - f % 4) % 4, y;
  }), h = o.map(
    (m, y) => new Uint8Array(Jn(m, l[y]))
  ), p = f, g = new ArrayBuffer(p), d = new DataView(g), x = new Uint8Array(g);
  d.setUint8(0, 116), d.setUint8(1, 116), d.setUint8(2, 99), d.setUint8(3, 102), d.setUint16(4, s), d.setUint16(6, r), d.setUint32(8, i);
  for (let m = 0; m < i; m++)
    d.setUint32(12 + m * 4, l[m]);
  if (a) {
    const m = 12 + i * 4;
    d.setUint32(m + 0, e.dsigTag ?? 0), d.setUint32(m + 4, e.dsigLength ?? 0), d.setUint32(m + 8, e.dsigOffset ?? 0);
  }
  for (let m = 0; m < i; m++)
    x.set(h[m], l[m]);
  return g;
}
function xS(t) {
  const e = /* @__PURE__ */ new Map();
  if ((t["CFF "] && !t["CFF "]._raw || t.CFF2 && !t.CFF2._raw) && t.post && !t.post._raw) {
    const l = t.post;
    if (l.version !== 196608) {
      const h = {
        version: 196608,
        italicAngle: l.italicAngle ?? 0,
        underlinePosition: l.underlinePosition ?? 0,
        underlineThickness: l.underlineThickness ?? 0,
        isFixedPitch: l.isFixedPitch ?? 0,
        minMemType42: l.minMemType42 ?? 0,
        maxMemType42: l.maxMemType42 ?? 0,
        minMemType1: l.minMemType1 ?? 0,
        maxMemType1: l.maxMemType1 ?? 0
      };
      e.set("post", Lc(h));
    }
  }
  const o = t.glyf && !t.glyf._raw, s = t.loca && !t.loca._raw;
  if (o && s) {
    const { bytes: l, offsets: h } = nf(t.glyf);
    if (e.set("glyf", l), e.set("loca", of({ offsets: h })), t.head && !t.head._raw) {
      const g = h.every((d) => d % 2 === 0 && d / 2 <= 65535) ? 0 : 1;
      t.head.indexToLocFormat !== g && e.set(
        "head",
        Sc({ ...t.head, indexToLocFormat: g })
      );
    }
  }
  const r = t.CBLC && !t.CBLC._raw && t.CBLC.sizes, i = t.CBDT && !t.CBDT._raw && t.CBDT.bitmapData;
  if (r && i) {
    const { bytes: l, offsetInfo: h } = wo(
      t.CBDT,
      t.CBLC
    );
    e.set("CBDT", l), e.set("CBLC", ye(t.CBLC, h));
  }
  const a = t.EBLC && !t.EBLC._raw && t.EBLC.sizes, c = t.EBDT && !t.EBDT._raw && t.EBDT.bitmapData;
  if (a && c) {
    const { bytes: l, offsetInfo: h } = wo(t.EBDT, t.EBLC);
    e.set("EBDT", l), e.set("EBLC", ye(t.EBLC, h));
  }
  const f = t.bloc && !t.bloc._raw && t.bloc.sizes, u = t.bdat && !t.bdat._raw && t.bdat.bitmapData;
  if (f && u) {
    const { bytes: l, offsetInfo: h } = wo(t.bdat, t.bloc);
    e.set("bdat", l), e.set("bloc", ye(t.bloc, h));
  }
  return e;
}
const Zf = {
  cmap: P0,
  head: os,
  hhea: Jp,
  HVAR: od,
  hmtx: td,
  maxp: Pd,
  MVAR: Yd,
  name: e1,
  hdmx: qp,
  BASE: y0,
  JSTF: dd,
  MATH: Vd,
  MERG: zd,
  meta: jd,
  DSIG: Pg,
  LTSH: Md,
  CBLC: Bs,
  CBDT: Ms,
  "OS/2": o1,
  kern: Sd,
  PCLT: i1,
  VDMX: C1,
  post: c1,
  STAT: d1,
  "CFF ": ja,
  CFF2: Gh,
  VORG: Hh,
  fvar: Kg,
  avar: qh,
  loca: Sm,
  glyf: rm,
  gvar: dm,
  GDEF: Qg,
  GPOS: lp,
  GSUB: Dp,
  "cvt ": Q1,
  cvar: K1,
  fpgm: em,
  prep: _m,
  gasp: om,
  vhea: E1,
  VVAR: M1,
  vmtx: D1,
  COLR: Lg,
  CPAL: Vg,
  EBLC: jg,
  EBDT: Hg,
  EBSC: Yg,
  bloc: N0,
  bdat: D0,
  sbix: l1,
  ltag: Rd,
  "SVG ": S1
}, Xf = [
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
function Qn(t) {
  if (!(t instanceof ArrayBuffer))
    throw new TypeError("importFont expects an ArrayBuffer");
  const e = new Uint8Array(t);
  if (e.length >= 4) {
    const o = String.fromCharCode(e[0], e[1], e[2], e[3]);
    if (o === "wOFF") {
      const { sfnt: s, metadata: r, privateData: i } = Pf(t), a = Qn(s);
      return a._woff = { version: 1 }, r && (a._woff.metadata = r), i && (a._woff.privateData = i), a;
    }
    if (o === "wOF2") {
      const { sfnt: s, metadata: r, privateData: i } = jf(t), a = Qn(s);
      return a._woff = { version: 2 }, r && (a._woff.metadata = r), i && (a._woff.privateData = i), a;
    }
    if (o === "ttcf")
      return _S(t);
  }
  if (e.length >= 4 && e[0] === 1 && e[1] === 0 && e[3] >= 1 && e[3] <= 4)
    return bS(t);
  if (e.length >= 6 && e[0] === 128 && (e[1] === 1 || e[1] === 2))
    return AS(t);
  if (e.length >= 2 && e[0] === 37 && e[1] === 33)
    return CS(t);
  const n = SS(t);
  return Ds(n);
}
function SS(t) {
  if (!(t instanceof ArrayBuffer))
    throw new TypeError("importFontTables expects an ArrayBuffer");
  const e = new F(new Uint8Array(t)), n = Kf(e), o = Jf(e, n.numTables), s = Qf(t, o);
  return { header: n, tables: s };
}
function _S(t) {
  const e = new F(new Uint8Array(t)), n = e.tag();
  if (n !== "ttcf")
    throw new Error("Invalid TTC/OTC collection signature");
  const o = e.uint16(), s = e.uint16(), r = e.uint32(), i = e.array("uint32", r);
  let a, c, f;
  o >= 2 && (a = e.uint32(), c = e.uint32(), f = e.uint32());
  const u = i.map((h) => {
    const p = new F(new Uint8Array(t), h), g = Kf(p), d = Jf(p, g.numTables), x = wS(
      t,
      d,
      h
    ), m = Qf(t, x);
    return Ds({ header: g, tables: m });
  }), l = {
    tag: n,
    majorVersion: o,
    minorVersion: s,
    numFonts: r
  };
  return o >= 2 && (l.dsigTag = a, l.dsigLength = c, l.dsigOffset = f), { collection: l, fonts: u };
}
function wS(t, e, n) {
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
  const c = os(
    Array.from(new Uint8Array(t, s, o.length))
  ), f = os(
    Array.from(new Uint8Array(t, r, o.length))
  ), u = c.magicNumber === 1594834165;
  return f.magicNumber === 1594834165 && !u ? e.map((h) => ({
    ...h,
    offset: n + h.offset
  })) : e;
}
function Kf(t) {
  return {
    sfVersion: t.uint32(),
    numTables: t.uint16(),
    searchRange: t.uint16(),
    entrySelector: t.uint16(),
    rangeShift: t.uint16()
  };
}
function Jf(t, e) {
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
function Qf(t, e) {
  const n = {}, o = new Map(e.map((a) => [a.tag, a])), s = Xf.filter((a) => o.has(a)), r = e.map((a) => a.tag).filter((a) => !s.includes(a)), i = [...s, ...r];
  for (const a of i) {
    const c = o.get(a), f = c.offset, u = new Uint8Array(t, f, c.length), l = Array.from(u), h = Zf[a];
    h ? n[a] = {
      ...h(l, n),
      _checksum: c.checksum
    } : n[a] = {
      _raw: l,
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
function bS(t) {
  const e = Array.from(new Uint8Array(t)), n = ja(e), o = n.fonts[0], s = o?.topDict || {}, r = o?.charStrings || [], i = r.length, a = s.FontBBox || [0, 0, 1e3, 1e3], c = a[3] - a[1] || 1e3, f = n.names && n.names[0] || "CFFFont", u = {
    "CFF ": n
  };
  u.head = {
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
  }, u.maxp = {
    version: 20480,
    numGlyphs: i
  };
  const l = a[3], h = a[1];
  u.hhea = {
    majorVersion: 1,
    minorVersion: 0,
    ascender: l,
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
  for (let y = 0; y < i; y++) {
    let w = p;
    if (r[y] && r[y].length > 0) {
      const _ = n.globalSubrs || [], S = o.localSubrs || [];
      try {
        const b = eo(r[y], _, S);
        b.width !== void 0 && (w = b.width + g);
      } catch {
      }
    }
    d.push({ advanceWidth: w, lsb: 0 });
  }
  if (u.hmtx = { hMetrics: d }, u.name = {
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
  }, u.post = {
    version: 196608,
    italicAngle: s.ItalicAngle || 0,
    underlinePosition: s.UnderlinePosition || -100,
    underlineThickness: s.UnderlineThickness || 50,
    isFixedPitch: s.isFixedPitch || 0
  }, o?.encoding && typeof o.encoding != "string") {
    const y = o.encoding.codes || [], w = new Array(256).fill(0);
    for (let _ = 0; _ < y.length && _ < 256; _++) {
      const S = y[_];
      S >= 0 && S < 256 && (w[S] = _ + 1);
    }
    u.cmap = {
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
  u["OS/2"] = {
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
    sTypoAscender: l,
    sTypoDescender: h,
    sTypoLineGap: 0,
    usWinAscent: Math.abs(l),
    usWinDescent: Math.abs(h),
    ulCodePageRange1: 0,
    ulCodePageRange2: 0,
    sxHeight: Math.round(c * 0.5),
    sCapHeight: Math.round(c * 0.7),
    usDefaultChar: 0,
    usBreakChar: 32,
    usMaxContext: 0
  };
  const m = Ds({ header: { sfVersion: 1330926671 }, tables: u });
  return m._standalone = "cff", m;
}
function AS(t) {
  const e = new Uint8Array(t), n = [], o = [];
  let s = 0;
  for (; s < e.length && e[s] === 128; ) {
    const c = e[s + 1];
    if (c === 3) break;
    const f = e[s + 2] | e[s + 3] << 8 | e[s + 4] << 16 | e[s + 5] << 24;
    s += 6;
    const u = e.slice(s, s + f);
    s += f, c === 1 ? n.push(u) : c === 2 && o.push(u);
  }
  const r = Zi(n), i = Zi(o), a = new TextDecoder("latin1").decode(r);
  return tu(a, i);
}
function CS(t) {
  const e = new TextDecoder("latin1").decode(new Uint8Array(t)), n = "currentfile eexec", o = e.indexOf(n);
  if (o === -1)
    throw new Error('PFA: could not find "currentfile eexec" marker');
  const s = e.slice(0, o + n.length), i = e.slice(o + n.length).replace(/\s/g, ""), a = i.search(/0{64,}$/), c = a > 0 ? i.slice(0, a) : i, f = new Uint8Array(c.length / 2);
  for (let u = 0; u < f.length; u++)
    f[u] = parseInt(c.slice(u * 2, u * 2 + 2), 16);
  return tu(s, f);
}
function Ks(t, e, n) {
  const o = new Uint8Array(t.length);
  let s = e;
  const r = 52845, i = 22719;
  for (let a = 0; a < t.length; a++) {
    const c = t[a];
    o[a] = c ^ s >>> 8, s = (c + s) * r + i & 65535;
  }
  return o.slice(n);
}
function Yi(t, e) {
  const n = [], o = [], s = [];
  let r = null, i = 0, a = 0, c = 0, f = 0, u = [], l = !1;
  function h(x, m) {
    r && r.length > 0 && s.push(r), r = [{ type: "M", x, y: m }];
  }
  function p(x, m) {
    r && r.push({ type: "L", x, y: m });
  }
  function g(x, m, y, w, _, S) {
    r && r.push({ type: "C", x1: x, y1: m, x2: y, y2: w, x: _, y: S });
  }
  function d(x, m) {
    if (m > 10) return;
    let y = 0;
    for (; y < x.length; ) {
      const w = x[y];
      if (w >= 32 && w <= 246) {
        n.push(w - 139), y++;
        continue;
      }
      if (w >= 247 && w <= 250) {
        n.push((w - 247) * 256 + x[y + 1] + 108), y += 2;
        continue;
      }
      if (w >= 251 && w <= 254) {
        n.push(-(w - 251) * 256 - x[y + 1] - 108), y += 2;
        continue;
      }
      if (w === 255) {
        const _ = (x[y + 1] << 24 | x[y + 2] << 16 | x[y + 3] << 8 | x[y + 4]) >> 0;
        n.push(_), y += 5;
        continue;
      }
      if (w === 12) {
        const _ = x[y + 1];
        switch (y += 2, _) {
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
              if (l = !1, u.length >= 7) {
                const k = u;
                g(k[1].x, k[1].y, k[2].x, k[2].y, k[3].x, k[3].y), g(k[4].x, k[4].y, k[5].x, k[5].y, k[6].x, k[6].y), i = k[6].x, a = k[6].y;
              }
              u = [], o.push(A[1]), o.push(A[0]);
            } else S === 1 ? (l = !0, u = [{ x: i, y: a }], o.push(...A)) : S === 2 ? o.push(...A) : S === 3 ? o.push(3) : o.push(...A);
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
      switch (y++, w) {
        case 1:
        // hstem
        case 3:
          n.length = 0;
          break;
        case 4: {
          const _ = n.pop() || 0;
          l ? (a += _, u.push({ x: i, y: a })) : (a += _, h(i, a)), n.length = 0;
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
          const _ = n.pop() || 0, S = n.pop() || 0, b = n.pop() || 0, A = n.pop() || 0, k = n.pop() || 0, O = n.pop() || 0, I = i + O, T = a + k, E = I + A, D = T + b;
          i = E + S, a = D + _, g(I, T, E, D, i, a), n.length = 0;
          break;
        }
        case 9: {
          r && r.length > 0 && (s.push(r), r = null), n.length = 0;
          break;
        }
        case 10: {
          const _ = n.pop();
          _ >= 0 && _ < e.length && e[_] && d(e[_], m + 1);
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
          l ? (i += S, a += _, u.push({ x: i, y: a })) : (i += S, a += _, h(i, a)), n.length = 0;
          break;
        }
        case 22: {
          const _ = n.pop() || 0;
          l ? (i += _, u.push({ x: i, y: a })) : (i += _, h(i, a)), n.length = 0;
          break;
        }
        case 30: {
          const _ = n.pop() || 0, S = n.pop() || 0, b = n.pop() || 0, A = n.pop() || 0, k = i, O = a + A, I = k + b, T = O + S;
          i = I + _, a = T, g(k, O, I, T, i, a), n.length = 0;
          break;
        }
        case 31: {
          const _ = n.pop() || 0, S = n.pop() || 0, b = n.pop() || 0, A = n.pop() || 0, k = i + A, O = a, I = k + b, T = O + S;
          i = I, a = T + _, g(k, O, I, T, i, a), n.length = 0;
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
function vS(t) {
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
  return i && (e.FontMatrix = i.slice(1, 7).map(Number)), e.encoding = IS(t), e;
}
function IS(t) {
  const e = /* @__PURE__ */ new Map(), n = /dup\s+(\d+)\s+\/([^\s]+)\s+put/g;
  let o;
  for (; (o = n.exec(t)) !== null; )
    e.set(parseInt(o[1]), o[2]);
  return e;
}
function kS(t) {
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
  for (const u of r) {
    const l = e.match(new RegExp(`/${u}\\s+(-?[\\d.]+)`));
    l && (s[u] = parseFloat(l[1]));
  }
  for (const u of [
    "BlueValues",
    "OtherBlues",
    "FamilyBlues",
    "FamilyOtherBlues",
    "StemSnapH",
    "StemSnapV"
  ]) {
    const l = e.match(new RegExp(`/${u}\\s*\\[([^\\]]+)\\]`));
    l && (s[u] = l[1].trim().split(/\s+/).map(Number));
  }
  const i = [], a = e.match(/\/Subrs\s+(\d+)\s+array/);
  if (a) {
    const u = parseInt(a[1]), l = e.slice(a.index);
    OS(
      l,
      t.slice(Ln(t, a.index)),
      u,
      o,
      (h, p) => {
        i[h] = p;
      }
    );
  }
  const c = /* @__PURE__ */ new Map(), f = e.match(/\/CharStrings\s+(\d+)\s+dict/);
  if (f) {
    const u = e.slice(f.index), l = t.slice(
      Ln(t, f.index)
    ), h = /\/([^\s]+)\s+(\d+)\s+(?:RD|-\|)\s/g;
    let p;
    for (; (p = h.exec(u)) !== null; ) {
      const g = p[1], d = parseInt(p[2]), x = p.index + p[0].length, m = Ln(l, x), y = l.slice(m, m + d), w = Ks(y, 4330, o);
      c.set(g, w);
    }
  }
  return { charStrings: c, subrs: i, privateDict: s };
}
function OS(t, e, n, o, s) {
  const r = /dup\s+(\d+)\s+(\d+)\s+(?:RD|-\|)\s/g;
  let i;
  for (; (i = r.exec(t)) !== null; ) {
    const a = parseInt(i[1]), c = parseInt(i[2]), f = i.index + i[0].length, u = Ln(e, f), l = e.slice(u, u + c), h = Ks(l, 4330, o);
    s(a, h);
  }
}
function Ln(t, e) {
  return e;
}
function tu(t, e) {
  const n = Ks(e, 55665, 4), o = vS(t), { charStrings: s, subrs: r } = kS(n), i = o.FontBBox || [0, 0, 1e3, 1e3], a = o.FontMatrix || [1e-3, 0, 0, 1e-3, 0, 0], c = Math.round(1 / a[0]), f = o.FontName || o.FamilyName || "Type1Font", u = i[3], l = i[1], h = [];
  if (s.has(".notdef")) {
    const d = Yi(s.get(".notdef"), r);
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
    const m = Yi(x, r), y = p.get(d) ?? null;
    h.push({
      name: d,
      unicode: y,
      advanceWidth: m.width,
      contours: m.contours.length > 0 ? m.contours : void 0
    });
  }
  const g = {
    font: {
      familyName: o.FamilyName || f,
      styleName: "Regular",
      fullName: o.FullName || f,
      postScriptName: f,
      unitsPerEm: c,
      ascender: u,
      descender: l,
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
function Zi(t) {
  const e = t.reduce((s, r) => s + r.length, 0), n = new Uint8Array(e);
  let o = 0;
  for (const s of t)
    n.set(s, o), o += s.length;
  return n;
}
const ES = /* @__PURE__ */ new Set([
  "_dirty",
  "_fileName",
  "_originalBuffer",
  "_collection",
  "_collectionFonts",
  "_woff"
]);
function TS(t, e = 2) {
  return JSON.stringify(
    t,
    function(n, o) {
      if (!(this === t && ES.has(n)))
        return typeof o == "bigint" ? Number(o) : ArrayBuffer.isView(o) && !(o instanceof DataView) ? Array.from(o) : o;
    },
    e
  );
}
function zo(t) {
  return JSON.parse(t);
}
function DS(t) {
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
      Xi(r.left, r.right, r.value, n, o);
    else if (r.left !== void 0 && r.pairs) {
      const i = me(r.left, n);
      for (const [a, c] of Object.entries(r.pairs)) {
        const f = me(a, n);
        for (const u of i)
          for (const l of f)
            o.push({ left: u, right: l, value: c });
      }
    } else if (r.groups)
      for (const [i, a] of Object.entries(r.groups)) {
        const c = me(i, n);
        for (const [f, u] of Object.entries(a)) {
          const l = me(f, n);
          for (const h of c)
            for (const p of l)
              o.push({ left: h, right: p, value: u });
        }
      }
    else if (r.classes && r.pairs)
      for (const i of r.pairs)
        Xi(i.left, i.right, i.value, n, o);
  const s = /* @__PURE__ */ new Map();
  for (const r of o)
    s.set(`${r.left}\0${r.right}`, r);
  return [...s.values()];
}
function Xi(t, e, n, o, s) {
  const r = me(t, o), i = me(e, o);
  for (const a of r)
    for (const c of i)
      s.push({ left: a, right: c, value: n });
}
function RS(t, e, n) {
  const o = t?.kerning, s = t?.kerningClasses, r = Array.isArray(o) && o.length > 0, i = Array.isArray(s) && s.some(
    (u) => u && Array.isArray(u.pairs) && u.pairs.length > 0
  );
  if (!r && !i) return;
  const a = t.glyphs, c = Ft(a, e), f = Ft(a, n);
  if (!(c === void 0 || f === void 0)) {
    if (r)
      for (let u = o.length - 1; u >= 0; u--) {
        const l = o[u];
        if (l.left === c && l.right === f) return l.value;
      }
    if (i)
      for (let u = s.length - 1; u >= 0; u--) {
        const l = FS(
          s[u],
          c,
          f
        );
        if (l !== void 0) return l;
      }
  }
}
function FS(t, e, n) {
  const { leftClasses: o = {}, rightClasses: s = {}, pairs: r = [] } = t, i = (a, c, f) => {
    if (typeof a == "string" && a.startsWith("@")) {
      const u = f[a.slice(1)];
      return Array.isArray(u) && u.includes(c);
    }
    return a === c;
  };
  for (let a = r.length - 1; a >= 0; a--) {
    const c = r[a];
    if (i(c.left, e, o) && i(c.right, n, s))
      return c.value;
  }
}
function me(t, e) {
  if (typeof t == "string" && t.startsWith("@")) {
    const n = t.slice(1), o = e[n];
    if (!o)
      throw new Error(`createKerning: unknown class "@${n}"`);
    return o;
  }
  return [t];
}
function eu(t) {
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
        'createSubstitution: each rule must have a "type" (single, multiple, alternate, ligature, reverse, contextual)'
      );
    const i = s.feature || "liga", a = s.script || "DFLT", c = s.language || null;
    if (r === "contextual") {
      if (!Array.isArray(s.input) || s.input.length === 0)
        throw new Error(
          'createSubstitution: contextual rules require a non-empty "input" array'
        );
      if (!Array.isArray(s.actions) || s.actions.length === 0)
        throw new Error(
          'createSubstitution: contextual rules require a non-empty "actions" array'
        );
      const u = {
        type: r,
        feature: i,
        script: a,
        language: c,
        backtrack: Ho(s.backtrack, n),
        input: Ho(s.input, n),
        lookahead: Ho(s.lookahead, n),
        actions: s.actions.map(
          (l) => LS(l, n)
        )
      };
      s.lookup && (u.lookup = { ...s.lookup }), o.push(u);
      continue;
    }
    const f = s.substitutions ? s.substitutions : s.substitution ? [s.substitution] : [];
    if (f.length === 0)
      throw new Error(
        `createSubstitution: rule of type "${r}" must have "substitution" or "substitutions"`
      );
    for (const u of f) {
      const l = { type: r, feature: i, script: a, language: c }, h = u.lookup || s.lookup;
      switch (h && (l.lookup = { ...h }), r) {
        case "single":
          o.push({
            ...l,
            from: Wt(u.from, n),
            to: Wt(u.to, n)
          });
          break;
        case "multiple":
          o.push({
            ...l,
            from: Wt(u.from, n),
            to: ue(u.to, n)
          });
          break;
        case "alternate":
          o.push({
            ...l,
            from: Wt(u.from, n),
            alternates: ue(u.alternates, n)
          });
          break;
        case "ligature":
          o.push({
            ...l,
            components: ue(u.components, n),
            ligature: Wt(u.ligature, n)
          });
          break;
        case "reverse":
          o.push({
            ...l,
            from: Wt(u.from, n),
            to: Wt(u.to, n),
            backtrack: (u.backtrack || []).map(
              (p) => ue(p, n)
            ),
            lookahead: (u.lookahead || []).map(
              (p) => ue(p, n)
            )
          });
          break;
        default:
          throw new Error(
            `createSubstitution: unknown type "${r}". Valid: single, multiple, alternate, ligature, reverse, contextual`
          );
      }
    }
  }
  return o;
}
function MS(t, e, n = {}) {
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
      case "contextual":
        return [...i.backtrack, ...i.input, ...i.lookahead].some(
          (a) => a.includes(r)
        );
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
function ue(t, e) {
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
function Ho(t, e) {
  return (t || []).map(
    (n) => ue(n, e)
  );
}
function LS(t, e) {
  if (!Number.isInteger(t.at) || t.at < 0)
    throw new Error(
      'createSubstitution: contextual action "at" must be a non-negative integer'
    );
  const n = t.substitutions || (t.substitution ? [t.substitution] : []);
  if (n.length === 0)
    throw new Error(
      'createSubstitution: contextual actions require "substitution" or "substitutions"'
    );
  const o = [];
  for (const r of n) {
    const i = eu({
      type: r.type || t.type,
      feature: "DFLT",
      substitution: r,
      classes: e
    });
    o.push(
      ...i.map(
        ({ feature: a, script: c, language: f, lookup: u, ...l }) => l
      )
    );
  }
  const s = { at: t.at, substitutions: o };
  return t.lookup && (s.lookup = { ...t.lookup }), s;
}
const BS = [
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
], VS = ["CFF ", "CFF2", "VORG"], $S = [
  "cvar",
  "cvt ",
  "fpgm",
  "gasp",
  "glyf",
  "gvar",
  "loca",
  "prep"
], nu = /* @__PURE__ */ new Set([
  ...BS,
  ...VS,
  ...$S
]), ou = [
  "cmap",
  "head",
  "hhea",
  "hmtx",
  "maxp",
  "name",
  "post"
], NS = /* @__PURE__ */ new Map([
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
function GS(t) {
  for (let e = 0; e < t.length; e++) {
    const n = t.charCodeAt(e);
    if (n < 32 || n > 126) return !1;
  }
  return !0;
}
function PS(t, e, n) {
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
function US(t, e) {
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
    C(e, "info", "FORMAT_WOFF1", "File is WOFF1-wrapped."), e2(t, e);
    try {
      const { sfnt: s } = Pf(t);
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
    C(e, "info", "FORMAT_WOFF2", "File is WOFF2-wrapped."), n2(t, e);
    try {
      const { sfnt: s } = jf(t);
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
function zS(t, e) {
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
  const r = NS.get(s.sfVersion);
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
    const a = 2 ** Math.floor(Math.log2(s.numTables)), c = a * 16, f = Math.floor(Math.log2(a)), u = s.numTables * 16 - c;
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
    ), s.rangeShift !== u && C(
      e,
      "warning",
      "BAD_RANGE_SHIFT",
      `rangeShift is ${s.rangeShift}, expected ${u}.`
    );
  }
  return s;
}
function HS(t, e, n) {
  const o = new Uint8Array(t), s = new F(o, 12), r = [], i = /* @__PURE__ */ new Set();
  for (let f = 0; f < e.numTables; f++) {
    let u;
    try {
      u = {
        tag: s.tag(),
        checksum: s.uint32(),
        offset: s.uint32(),
        length: s.uint32()
      };
    } catch (l) {
      C(
        n,
        "error",
        "DIRECTORY_ENTRY_UNREADABLE",
        `Could not read table directory entry ${f}: ${l.message}`
      );
      continue;
    }
    if (!GS(u.tag)) {
      const l = [...u.tag].map((h) => h.charCodeAt(0).toString(16).padStart(2, "0")).join(" ");
      C(
        n,
        "error",
        "BAD_TABLE_TAG",
        `Table ${f} has non-printable tag bytes (${l}).`
      );
    }
    i.has(u.tag) && C(
      n,
      "error",
      "DUPLICATE_TABLE",
      `Duplicate table tag '${u.tag}'.`
    ), i.add(u.tag), u.offset + u.length > t.byteLength && C(
      n,
      "error",
      "TABLE_OUT_OF_BOUNDS",
      `Table '${u.tag}' extends beyond end of file (offset ${u.offset} + length ${u.length} = ${u.offset + u.length}, but file is ${t.byteLength} bytes).`
    ), u.length === 0 && C(
      n,
      "warning",
      "EMPTY_TABLE",
      `Table '${u.tag}' has zero length.`
    ), u.offset % 4 !== 0 && C(
      n,
      "warning",
      "TABLE_MISALIGNED",
      `Table '${u.tag}' at offset ${u.offset} is not 4-byte aligned.`
    ), r.push(u);
  }
  for (let f = 1; f < r.length; f++) {
    const u = r[f - 1].tag.padEnd(4, " "), l = r[f].tag.padEnd(4, " ");
    if (u >= l) {
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
  const c = r.filter((f) => f.length > 0 && f.offset + f.length <= t.byteLength).slice().sort((f, u) => f.offset - u.offset);
  for (let f = 1; f < c.length; f++) {
    const u = c[f - 1], l = c[f], h = u.offset + u.length;
    h > l.offset && C(
      n,
      "error",
      "TABLES_OVERLAPPING",
      `Tables '${u.tag}' and '${l.tag}' overlap (${u.tag} ends at ${h}, ${l.tag} starts at ${l.offset}).`
    );
  }
  return r;
}
function WS(t, e) {
  const n = new Set(t.map((r) => r.tag));
  for (const r of ou)
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
    nu.has(r) || C(
      e,
      "info",
      "UNKNOWN_TABLE",
      `Unrecognized table '${r}' — will be preserved as raw bytes.`
    );
}
function jS(t, e, n) {
  const o = new Uint8Array(t);
  for (const s of e) {
    if (s.offset + s.length > t.byteLength || s.length === 0 || s.tag === "head") continue;
    const r = PS(o, s.offset, s.length);
    r !== s.checksum && C(
      n,
      "warning",
      "BAD_CHECKSUM",
      `Table '${s.tag}' checksum mismatch: directory says 0x${s.checksum.toString(16).padStart(8, "0")}, computed 0x${r.toString(16).padStart(8, "0")}.`
    );
  }
}
function qS(t, e, n) {
  const o = new Map(e.map((c) => [c.tag, c])), s = {}, r = Xf.filter((c) => o.has(c)), i = e.map((c) => c.tag).filter((c) => !r.includes(c)), a = [...r, ...i];
  for (const c of a) {
    const f = o.get(c);
    if (f.offset + f.length > t.byteLength) continue;
    const u = Zf[c];
    if (u)
      try {
        const l = new Uint8Array(t, f.offset, f.length), h = Array.from(l);
        s[c] = u(h, s), C(
          n,
          "info",
          "TABLE_PARSED",
          `Table '${c}' parsed successfully.`
        );
      } catch (l) {
        C(
          n,
          "error",
          "TABLE_PARSE_FAILED",
          `Table '${c}' failed to parse: ${l.message}`
        );
      }
  }
  return s;
}
function YS(t) {
  return t >= 6155 && t <= 6157 || t >= 65024 && t <= 65039 || t >= 917760 && t <= 917999;
}
function ZS(t) {
  if (t.idRangeOffset === 0) {
    const e = t.startCode + t.idDelta & 65535, n = t.endCode + t.idDelta & 65535;
    return Math.max(e, n);
  }
  return null;
}
function XS(t, e, n) {
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
    const f = c.format, u = `${a.platformID}-${a.encodingID}-${f}`;
    if (u === "3-1-4" || u === "3-10-12" || u === "3-10-13" || u === "0-3-4" || u === "3-0-4") {
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
      const u = c.segments || [];
      if (u.length < 1) {
        C(
          n,
          "error",
          "CMAP_FORMAT4_SEGCOUNT_INVALID",
          `cmap format-4 subtable ${a} has no segments.`
        );
        continue;
      }
      const l = u[u.length - 1];
      (l.startCode !== 65535 || l.endCode !== 65535) && C(
        n,
        "error",
        "CMAP_FORMAT4_INVALID_TERMINATOR",
        `cmap format-4 subtable ${a}: final segment is [${l.startCode.toString(16)}-${l.endCode.toString(16)}], must be [FFFF-FFFF].`
      );
      let h = -1;
      for (let p = 0; p < u.length; p++) {
        const g = u[p];
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
        for (let d = 0; d < u.length && !p; d++) {
          const x = u[d];
          if (x.startCode === 65535 && x.endCode === 65535) continue;
          const m = ZS(x);
          m !== null && m >= i && (C(
            n,
            "error",
            "CMAP_GLYPH_OUT_OF_RANGE",
            `cmap format-4 subtable ${a} segment ${d}: glyph id ${m} >= numGlyphs (${i}).`
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
      const u = c.groups || [];
      let l = -1, h = !1, p = !1;
      for (let g = 0; g < u.length; g++) {
        const d = u[g];
        if (d.endCharCode < d.startCharCode && !h) {
          C(
            n,
            "error",
            "CMAP_FORMAT12_END_BEFORE_START",
            `cmap format-${f} subtable ${a} group ${g}: endCharCode (0x${d.endCharCode.toString(16)}) < startCharCode (0x${d.startCharCode.toString(16)}).`
          ), h = !0;
          break;
        }
        if (d.startCharCode <= l && !h) {
          C(
            n,
            "error",
            "CMAP_FORMAT12_GROUPS_OUT_OF_ORDER",
            `cmap format-${f} subtable ${a} group ${g}: startCharCode (0x${d.startCharCode.toString(16)}) is not greater than previous endCharCode (0x${l.toString(16)}).`
          ), h = !0;
          break;
        }
        if (l = d.endCharCode, i !== void 0 && !p)
          if (f === 12) {
            const x = d.endCharCode - d.startCharCode, m = d.startGlyphID + x;
            m >= i && (C(
              n,
              "error",
              "CMAP_GLYPH_OUT_OF_RANGE",
              `cmap format-12 subtable ${a} group ${g}: maps to glyph id ${m} >= numGlyphs (${i}).`
            ), p = !0);
          } else f === 13 && d.glyphID >= i && (C(
            n,
            "error",
            "CMAP_GLYPH_OUT_OF_RANGE",
            `cmap format-13 subtable ${a} group ${g}: glyphID ${d.glyphID} >= numGlyphs (${i}).`
          ), p = !0);
      }
    } else if (f === 14) {
      const u = c.varSelectorRecords || [];
      let l = -1, h = !1, p = !1;
      for (let g = 0; g < u.length; g++) {
        const d = u[g];
        if (!YS(d.varSelector) && !p) {
          C(
            n,
            "error",
            "CMAP_FORMAT14_VS_OUT_OF_RANGE",
            `cmap format-14 subtable ${a} record ${g}: varSelector U+${d.varSelector.toString(16).toUpperCase()} is not in a valid variation-selector range.`
          ), p = !0;
          break;
        }
        if (d.varSelector <= l && !h) {
          C(
            n,
            "error",
            "CMAP_FORMAT14_VS_OUT_OF_ORDER",
            `cmap format-14 subtable ${a} record ${g}: varSelector U+${d.varSelector.toString(16).toUpperCase()} is not greater than previous (U+${l.toString(16).toUpperCase()}).`
          ), h = !0;
          break;
        }
        if (l = d.varSelector, i !== void 0 && d.nonDefaultUVS) {
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
const Ki = 783, Ji = 127;
function KS(t, e, n) {
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
  ), typeof t.fsType == "number" && (t.fsType & ~Ki) !== 0 && C(
    n,
    "warning",
    "OS2_FSTYPE_RESERVED_BITS_SET",
    `OS/2.fsType has reserved bits set (0x${(t.fsType >>> 0).toString(16).padStart(4, "0")}); valid mask is 0x${Ki.toString(16).padStart(4, "0")}.`
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
    ), (e.macStyle & ~Ji) !== 0 && C(
      n,
      "warning",
      "HEAD_MACSTYLE_RESERVED_BITS_SET",
      `head.macStyle has reserved bits set (0x${e.macStyle.toString(16).padStart(4, "0")}); valid mask is 0x${Ji.toString(16).padStart(4, "0")}.`
    );
  }
}
const Qi = 32 * 1024, ta = 200, JS = /[\x00-\x20\x7F-\uFFFF[\](){}<>/%]/;
function QS(t, e, n, o) {
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
    let u = !1;
    const l = Math.min(a, Math.floor((s.length - 6) / 12));
    for (let h = 0; h < l; h++) {
      const p = 6 + h * 12, g = i.getUint16(p + 8), d = i.getUint16(p + 10), x = c + d, m = x + g;
      m > s.length && (u || (C(
        o,
        "error",
        "NAME_RECORD_OUT_OF_BOUNDS",
        `name record ${h} string overruns the table (offset ${x} + length ${g} = ${m}, table length ${s.length}).`
      ), u = !0)), g > Qi && C(
        o,
        "warning",
        "NAME_STRING_TOO_LONG",
        `name record ${h} (nameID=${i.getUint16(p + 6)}) is ${g} bytes; > ${Qi} is suspicious.`
      );
    }
  }
  if (Array.isArray(t.langTagRecords))
    for (let i = 0; i < t.langTagRecords.length; i++) {
      const c = (t.langTagRecords[i].tag ?? "").length * 2;
      c > ta && C(
        o,
        "error",
        "NAME_LANG_TAG_TOO_LONG",
        `name.langTagRecord ${i} is ${c} bytes; spec limit is ${ta}.`
      );
    }
  const r = t.nameRecords ?? t.names ?? t.records ?? [];
  for (const i of r) {
    if (i.nameID !== 6) continue;
    const a = i.value ?? i.string ?? "";
    if (typeof a == "string" && JS.test(a)) {
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
const $e = 44, kn = 20, t2 = 48;
function e2(t, e) {
  if (t.byteLength < $e) return;
  const n = new DataView(t), o = n.getUint32(8), s = n.getUint16(12), r = n.getUint16(14), i = n.getUint32(16), a = n.getUint32(24), c = n.getUint32(28), f = n.getUint32(36), u = n.getUint32(40);
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
  const l = $e + s * kn;
  if (l <= t.byteLength) {
    let p = 12 + 16 * s;
    for (let g = 0; g < s; g++) {
      const d = n.getUint32(
        $e + g * kn + 12
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
  ) : c > 0 && (a < l || a + c > t.byteLength) && C(
    e,
    "error",
    "WOFF1_METADATA_BLOCK_INVALID",
    `WOFF1 metadata block (offset ${a}, length ${c}) is out of bounds (file size ${t.byteLength}, directory ends at ${l}).`
  ), f === 0 != (u === 0) ? C(
    e,
    "error",
    "WOFF1_PRIVATE_BLOCK_INVALID",
    `WOFF1 private block has inconsistent offset/length (offset=${f}, length=${u}); both must be zero or both non-zero.`
  ) : u > 0 && (f < l || f + u > t.byteLength) && C(
    e,
    "error",
    "WOFF1_PRIVATE_BLOCK_INVALID",
    `WOFF1 private block (offset ${f}, length ${u}) is out of bounds (file size ${t.byteLength}, directory ends at ${l}).`
  );
  let h = l;
  if (l <= t.byteLength)
    for (let p = 0; p < s; p++) {
      const g = n.getUint32($e + p * kn + 4), d = n.getUint32(
        $e + p * kn + 8
      ), x = g + d + 3 & -4;
      x > h && (h = x);
    }
  if (c > 0) {
    const p = a + c + 3 & -4;
    p > h && (h = p);
  }
  if (u > 0) {
    const p = f + u;
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
function n2(t, e) {
  if (t.byteLength < t2) return;
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
const ea = 224;
function o2(t, e) {
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
      const f = a[c], u = n[c];
      if (typeof f != "number" || f < u.minValue || f > u.maxValue) {
        C(
          e,
          "error",
          "FVAR_INSTANCE_OUT_OF_RANGE",
          `fvar instance ${r} coordinate for axis '${u.axisTag}' is ${f}, outside axis range [${u.minValue}, ${u.maxValue}].`
        );
        break;
      }
    }
  }
}
function na(t, e, n) {
  const o = t?.lookupList?.lookups ?? [], s = 1, r = e === "GSUB" ? 8 : 9;
  let i = !1, a = !1;
  for (let c = 0; c < o.length; c++) {
    const f = o[c];
    if ((typeof f.lookupType != "number" || f.lookupType < s || f.lookupType > r) && (i || (C(
      n,
      "error",
      `${e}_LOOKUP_TYPE_INVALID`,
      `${e} lookup ${c} has invalid lookupType ${f.lookupType}; must be in [${s}, ${r}].`
    ), i = !0)), typeof f.lookupFlag == "number" && (f.lookupFlag & ea) !== 0 && !a && (C(
      n,
      "warning",
      "LAYOUT_LOOKUP_FLAG_RESERVED",
      `${e} lookup ${c} has reserved bits set in lookupFlag (0x${f.lookupFlag.toString(16).padStart(
        4,
        "0"
      )}); reserved mask is 0x${ea.toString(16).padStart(4, "0")}.`
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
const s2 = 65534, r2 = 65534;
function i2(t, e, n) {
  const o = t.axes ?? [], s = t.instances ?? [], r = /* @__PURE__ */ new Set();
  if (e && Array.isArray(e.names))
    for (const i of e.names)
      i && typeof i.nameID == "number" && r.add(i.nameID);
  for (let i = 0; i < o.length; i++) {
    const a = o[i];
    typeof a.flags == "number" && (a.flags & s2) !== 0 && C(
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
    typeof a.flags == "number" && (a.flags & r2) !== 0 && C(
      n,
      "warning",
      "FVAR_INSTANCE_FLAGS_RESERVED",
      `fvar instance ${i} has reserved bits set in flags (0x${a.flags.toString(16).padStart(4, "0")}).`
    );
    const c = [
      ["subfamilyNameID", a.subfamilyNameID],
      ["postScriptNameID", a.postScriptNameID]
    ];
    for (const [f, u] of c)
      u === void 0 || u === 65535 || typeof u == "number" && r.size > 0 && !r.has(u) && u !== 2 && u !== 17 && u !== 6 && C(
        n,
        "warning",
        "FVAR_INSTANCE_NAMEID_MISSING",
        `fvar instance ${i} ${f} ${u} has no matching name record.`
      );
  }
}
function a2(t, e, n) {
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
function c2(t, e, n) {
  const o = t.segmentMaps ?? [], s = e?.axes ?? [];
  s.length > 0 && o.length !== s.length && C(
    n,
    "error",
    "AVAR_SEGMENT_COUNT_MISMATCH",
    `avar has ${o.length} segment maps but fvar declares ${s.length} axes.`
  );
  for (let r = 0; r < o.length; r++) {
    const i = o[r].axisValueMaps ?? [];
    let a = -1 / 0, c = !1, f = !1, u = !1, l = !1, h = !1;
    for (let p = 0; p < i.length; p++) {
      const { fromCoordinate: g, toCoordinate: d } = i[p];
      !l && (typeof g != "number" || typeof d != "number" || g < -1 || g > 1 || d < -1 || d > 1) && (C(
        n,
        "error",
        "AVAR_COORD_OUT_OF_RANGE",
        `avar axis ${r} segment map entry ${p} has out-of-range coordinate (from=${g}, to=${d}); both must be in [-1, 1].`
      ), l = !0), !h && typeof g == "number" && g <= a && (C(
        n,
        "error",
        "AVAR_FROM_COORD_NOT_INCREASING",
        `avar axis ${r} segment map fromCoordinate values must be strictly increasing (entry ${p} = ${g}, previous = ${a}).`
      ), h = !0), typeof g == "number" && (a = g), g === -1 && d === -1 && (c = !0), g === 0 && d === 0 && (f = !0), g === 1 && d === 1 && (u = !0);
    }
    i.length > 0 && !(c && f && u) && C(
      n,
      "error",
      "AVAR_MISSING_REQUIRED_ENDPOINTS",
      `avar axis ${r} segment map must include (-1,-1), (0,0), and (1,1) entries when non-empty.`
    );
  }
}
function Js(t, e, n, o) {
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
    const u = r[f].regionAxes ?? [];
    for (let l = 0; l < u.length; l++) {
      const { startCoord: h, peakCoord: p, endCoord: g } = u[l];
      !i && (typeof h != "number" || typeof p != "number" || typeof g != "number" || h < -1 || h > 1 || p < -1 || p > 1 || g < -1 || g > 1) && (C(
        o,
        "error",
        "IVS_REGION_COORD_OUT_OF_RANGE",
        `${n} ItemVariationStore region ${f} axis ${l} has out-of-range coords (start=${h}, peak=${p}, end=${g}); all must be in [-1, 1].`
      ), i = !0), !i && typeof h == "number" && typeof p == "number" && typeof g == "number" && !(h <= p && p <= g) && (C(
        o,
        "error",
        "IVS_REGION_PEAK_OUT_OF_ORDER",
        `${n} ItemVariationStore region ${f} axis ${l} violates start ≤ peak ≤ end (start=${h}, peak=${p}, end=${g}).`
      ), i = !0);
    }
  }
  const a = t.itemVariationData ?? [];
  let c = !1;
  for (let f = 0; f < a.length; f++) {
    const u = a[f];
    if (!u) continue;
    const l = u.regionIndexes ?? [];
    for (let h = 0; h < l.length; h++)
      l[h] >= r.length && !c && (C(
        o,
        "error",
        "IVS_REGION_INDEX_OUT_OF_RANGE",
        `${n} ItemVariationData ${f} regionIndex ${l[h]} is ≥ regionCount (${r.length}).`
      ), c = !0);
  }
}
function f2(t, e, n) {
  typeof t.valueRecordSize == "number" && t.valueRecordSize < 8 && C(
    n,
    "error",
    "MVAR_VALUE_RECORD_SIZE_INVALID",
    `MVAR valueRecordSize must be ≥ 8, got ${t.valueRecordSize}.`
  );
  const o = t.itemVariationStore, s = t.valueRecords ?? [], r = o?.itemVariationData ?? [];
  let i = !1, a = !1;
  for (let c = 0; c < s.length; c++) {
    const f = s[c], u = f.deltaSetOuterIndex, l = f.deltaSetInnerIndex;
    !i && typeof u == "number" && u >= r.length && (C(
      n,
      "error",
      "MVAR_DELTA_SET_OUTER_OUT_OF_RANGE",
      `MVAR record '${f.valueTag}' deltaSetOuterIndex ${u} is ≥ ItemVariationData count (${r.length}).`
    ), i = !0);
    const h = r[u];
    !a && h && typeof l == "number" && l >= (h.itemCount ?? 0) && (C(
      n,
      "error",
      "MVAR_DELTA_SET_INNER_OUT_OF_RANGE",
      `MVAR record '${f.valueTag}' deltaSetInnerIndex ${l} is ≥ itemCount (${h.itemCount}).`
    ), a = !0);
  }
  Js(o, e?.axes?.length ?? 0, "MVAR", n);
}
function oa(t, e, n, o) {
  Js(
    t.itemVariationStore,
    n?.axes?.length ?? 0,
    e,
    o
  );
}
function u2(t, e, n, o, s) {
  if (s ||= Qs(), typeof t.majorVersion == "number" && t.majorVersion !== 1 && C(
    o,
    "error",
    "GDEF_VERSION_INVALID",
    `GDEF majorVersion must be 1, got ${t.majorVersion}.`
  ), t.glyphClassDef && ks(
    t.glyphClassDef,
    e,
    "GDEF.glyphClassDef",
    o,
    { maxClass: 4 },
    // 1=base, 2=ligature, 3=mark, 4=component
    s
  ), t.markAttachClassDef && ks(
    t.markAttachClassDef,
    e,
    "GDEF.markAttachClassDef",
    o,
    {},
    s
  ), t.attachList?.coverage && Ze(
    t.attachList.coverage,
    e,
    "GDEF.attachList.coverage",
    o,
    s
  ), t.ligCaretList?.coverage && Ze(
    t.ligCaretList.coverage,
    e,
    "GDEF.ligCaretList.coverage",
    o,
    s
  ), t.markGlyphSetsDef?.coverages)
    for (let r = 0; r < t.markGlyphSetsDef.coverages.length; r++)
      Ze(
        t.markGlyphSetsDef.coverages[r],
        e,
        `GDEF.markGlyphSetsDef.coverages[${r}]`,
        o,
        s
      );
  t.itemVariationStore && Js(
    t.itemVariationStore,
    n?.axes?.length ?? 0,
    "GDEF",
    o
  );
}
function Qs() {
  return { coverages: /* @__PURE__ */ new WeakSet(), classDefs: /* @__PURE__ */ new WeakSet() };
}
function Ze(t, e, n, o, s) {
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
function ks(t, e, n, o, s = {}, r) {
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
      const u = a[f];
      if (u.startGlyphID > u.endGlyphID) {
        C(
          o,
          "error",
          "CLASSDEF_RANGE_INVALID",
          `${n}: ClassDef format 2 range ${f} is invalid (start=${u.startGlyphID}, end=${u.endGlyphID}).`
        );
        return;
      }
      if (e > 0 && u.endGlyphID >= e) {
        C(
          o,
          "error",
          "CLASSDEF_GLYPH_OUT_OF_RANGE",
          `${n}: ClassDef format 2 range ${f} endGlyphID ${u.endGlyphID} is ≥ numGlyphs (${e}).`
        );
        return;
      }
      if (u.startGlyphID <= c) {
        C(
          o,
          "error",
          "CLASSDEF_RANGES_NOT_SORTED",
          `${n}: ClassDef format 2 ranges overlap or are not sorted at index ${f} (start=${u.startGlyphID}, prev end=${c}).`
        );
        return;
      }
      if (i !== void 0 && u.class > i) {
        C(
          o,
          "error",
          "CLASSDEF_CLASS_OUT_OF_RANGE",
          `${n}: ClassDef format 2 range ${f} has class ${u.class}, which exceeds the maximum ${i} for this table.`
        );
        return;
      }
      c = u.endGlyphID;
    }
  }
}
function sa(t, e, n, o, s) {
  s ||= Qs();
  const r = t?.lookupList?.lookups ?? [];
  for (let i = 0; i < r.length; i++) {
    const a = r[i], c = a.subtables ?? [];
    for (let f = 0; f < c.length; f++) {
      const u = c[f];
      if (!u || typeof u != "object") continue;
      const l = `${e} lookup ${i} (type ${a.lookupType}) subtable ${f}`;
      if (u.coverage && Ze(u.coverage, n, `${l}.coverage`, o, s), Array.isArray(u.coverages))
        for (let h = 0; h < u.coverages.length; h++)
          Ze(
            u.coverages[h],
            n,
            `${l}.coverages[${h}]`,
            o,
            s
          );
      if (u.classDef && ks(
        u.classDef,
        n,
        `${l}.classDef`,
        o,
        {},
        s
      ), e === "GSUB" && a.lookupType === 1 && Array.isArray(u.substituteGlyphIDs)) {
        for (const h of u.substituteGlyphIDs)
          if (n > 0 && h >= n) {
            C(
              o,
              "error",
              "GSUB_SUBSTITUTE_GLYPH_OUT_OF_RANGE",
              `${l}: substituteGlyphID ${h} is ≥ numGlyphs (${n}).`
            );
            break;
          }
      }
      if (e === "GSUB" && a.lookupType === 4 && Array.isArray(u.ligatureSets)) {
        let h = !1;
        for (const p of u.ligatureSets) {
          if (h) break;
          for (const g of p ?? []) {
            if (n > 0 && g.ligatureGlyph >= n) {
              C(
                o,
                "error",
                "GSUB_LIGATURE_GLYPH_OUT_OF_RANGE",
                `${l}: ligatureGlyph ${g.ligatureGlyph} is ≥ numGlyphs (${n}).`
              ), h = !0;
              break;
            }
            for (const d of g.componentGlyphIDs ?? [])
              if (n > 0 && d >= n) {
                C(
                  o,
                  "error",
                  "GSUB_LIGATURE_COMPONENT_OUT_OF_RANGE",
                  `${l}: ligature componentGlyphID ${d} is ≥ numGlyphs (${n}).`
                ), h = !0;
                break;
              }
          }
        }
      }
    }
  }
}
function l2(t, e) {
  typeof t.version == "number" && t.version !== 65536 && C(
    e,
    "error",
    "MATH_VERSION_INVALID",
    `MATH table version must be 0x00010000, got 0x${t.version.toString(16).padStart(8, "0")}.`
  );
}
const h2 = /* @__PURE__ */ new Set([
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
]), g2 = /* @__PURE__ */ new Set([
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
]), p2 = /* @__PURE__ */ new Set([
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
]), ra = 10, ia = 48, aa = 513;
function ca(t, e, n, o = !1) {
  const s = o ? [
    {
      charStrings: t.charStrings || [],
      localSubrs: t.fontDicts?.[0]?.localSubrs || []
    }
  ] : t.fonts || [], r = t.globalSubrs || [], i = fa(r.length), a = /* @__PURE__ */ new Set();
  function c(f, u, l) {
    a.has(f) || (a.add(f), C(n, u, f, l));
  }
  for (let f = 0; f < s.length; f++) {
    const u = s[f], l = u.charStrings || [], h = u.localSubrs || [], p = fa(h.length);
    for (let g = 0; g < l.length; g++) {
      const d = l[g];
      if (!d || d.length === 0) continue;
      const x = {
        stack: [],
        maxStackSeen: 0,
        stemCount: 0,
        depth: 0,
        returned: !1,
        saw: { endchar: !1, anyDraw: !1 }
      };
      su(
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
      ), x.maxStackSeen > (o ? aa : ia) && c(
        "CFF_STACK_OVERFLOW",
        "error",
        `${e}: charstring for glyph ${g} pushed ${x.maxStackSeen} operands, exceeding the ${o ? "CFF2" : "Type 2"} limit of ${o ? aa : ia}.`
      );
    }
  }
}
function fa(t) {
  return t < 1240 ? 107 : t < 33900 ? 1131 : 32768;
}
function su(t, e, n, o, s, r, i, a, c, f, u) {
  if (e.depth > ra) {
    f(
      "CFF_SUBR_DEPTH_EXCEEDED",
      "error",
      `${i}: charstring for glyph ${c} exceeded subroutine recursion depth ${ra}.`
    );
    return;
  }
  let l = 0;
  for (; l < t.length; ) {
    const h = t[l];
    if (h === 28 || h >= 32) {
      const g = d2(t, l);
      if (g === null) {
        f(
          "CFF_INVALID_NUMBER",
          "error",
          `${i}: charstring for glyph ${c} contains a malformed numeric operand at byte ${l}.`
        );
        return;
      }
      if (l + g.bytesConsumed > t.length) {
        f(
          "CFF_TRUNCATED_OPERAND",
          "error",
          `${i}: charstring for glyph ${c} truncated mid-operand at byte ${l}.`
        );
        return;
      }
      e.stack.push(g.value), e.stack.length > e.maxStackSeen && (e.maxStackSeen = e.stack.length), l += g.bytesConsumed;
      continue;
    }
    if (h === 12) {
      if (l + 1 >= t.length) {
        f(
          "CFF_TRUNCATED_OPERATOR",
          "error",
          `${i}: charstring for glyph ${c} ends mid-escaped operator at byte ${l}.`
        );
        return;
      }
      const g = t[l + 1];
      if (!p2.has(g)) {
        f(
          "CFF_INVALID_OPERATOR",
          "error",
          `${i}: charstring for glyph ${c} uses unrecognised two-byte operator 12 ${g} at byte ${l}.`
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
      e.stack.length = 0, e.saw.anyDraw = !0, l += 2;
      continue;
    }
    if (!(u ? g2 : h2).has(h)) {
      f(
        "CFF_INVALID_OPERATOR",
        "error",
        `${i}: charstring for glyph ${c} uses unknown operator 0x${h.toString(16).padStart(2, "0")} at byte ${l}.`
      );
      return;
    }
    if (u && h === 15) {
      if (e.stack.length < 1) {
        f(
          "CFF_STACK_UNDERFLOW",
          "error",
          `${i}: charstring for glyph ${c} vsindex with empty stack at byte ${l}.`
        );
        return;
      }
      e.stack.pop(), l++;
      continue;
    }
    if (u && h === 16) {
      if (e.stack.length < 1) {
        f(
          "CFF_STACK_UNDERFLOW",
          "error",
          `${i}: charstring for glyph ${c} blend with empty stack at byte ${l}.`
        );
        return;
      }
      const g = e.stack.pop();
      typeof g == "number" && g >= 0 && g <= e.stack.length ? e.stack.length = g : e.stack.length = 0, l++;
      continue;
    }
    if (h === 1 || h === 3 || h === 18 || h === 23) {
      e.stemCount += e.stack.length >> 1, e.stack.length = 0, l++;
      continue;
    }
    if (h === 19 || h === 20) {
      e.stemCount += e.stack.length >> 1, e.stack.length = 0, l++;
      const g = Math.ceil(e.stemCount / 8);
      if (l + g > t.length) {
        f(
          "CFF_TRUNCATED_OPERATOR",
          "error",
          `${i}: charstring for glyph ${c} truncated mid-mask at byte ${l}.`
        );
        return;
      }
      l += g;
      continue;
    }
    if (h === 10 || h === 29) {
      if (e.stack.length < 1) {
        f(
          "CFF_STACK_UNDERFLOW",
          "error",
          `${i}: charstring for glyph ${c} ${h === 10 ? "callsubr" : "callgsubr"} with empty stack at byte ${l}.`
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
      e.depth++, su(
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
        u
      ), e.depth--, l++;
      continue;
    }
    if (h === 11) {
      e.returned = !0;
      return;
    }
    if (h === 14) {
      e.saw.endchar = !0, e.stack.length = 0, l++;
      continue;
    }
    e.stack.length = 0, e.saw.anyDraw = !0, l++;
  }
}
function d2(t, e) {
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
const ua = 16;
function m2(t, e, n) {
  const o = t?.glyphs;
  if (!Array.isArray(o)) return;
  let s = !1, r = !1, i = !1;
  function a(c, f) {
    if (s || r) return;
    const u = o[c];
    if (!(!u || !Array.isArray(u.components))) {
      if (f.length >= ua) {
        r = !0, C(
          n,
          "error",
          "GLYF_COMPOSITE_DEPTH_EXCEEDED",
          `glyf composite glyph chain starting at glyph ${f[0]} exceeds maximum nesting depth ${ua}.`
        );
        return;
      }
      for (const l of u.components) {
        const h = l.glyphIndex ?? l.glyphID;
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
function y2(t, e, n) {
  const o = t?.glyphs;
  if (!Array.isArray(o)) return;
  const s = e?.xMin, r = e?.xMax, i = e?.yMin, a = e?.yMax;
  let c = !1, f = !1, u = !1;
  for (let l = 0; l < o.length; l++) {
    const h = o[l];
    h && (!c && typeof h.xMin == "number" && typeof h.xMax == "number" && h.xMin > h.xMax && (c = !0, C(
      n,
      "warning",
      "GLYF_BBOX_INVERTED",
      `glyf glyph ${l} has xMin (${h.xMin}) > xMax (${h.xMax}).`
    )), !c && typeof h.yMin == "number" && typeof h.yMax == "number" && h.yMin > h.yMax && (c = !0, C(
      n,
      "warning",
      "GLYF_BBOX_INVERTED",
      `glyf glyph ${l} has yMin (${h.yMin}) > yMax (${h.yMax}).`
    )), !f && typeof s == "number" && typeof r == "number" && typeof h.xMin == "number" && typeof h.xMax == "number" && (h.xMin < s || h.xMax > r) && (f = !0, C(
      n,
      "warning",
      "GLYF_BBOX_OUTSIDE_HEAD",
      `glyf glyph ${l} bounding box [${h.xMin},${h.xMax}] x [${h.yMin},${h.yMax}] extends outside the head.bbox [${s},${r}] x [${i},${a}].`
    )), !u && typeof h.numberOfContours == "number" && h.numberOfContours < -1 && (u = !0, C(
      n,
      "error",
      "GLYF_NUM_CONTOURS_INVALID",
      `glyf glyph ${l} numberOfContours = ${h.numberOfContours}; only ≥ -1 is valid (-1 indicates a composite).`
    )));
  }
}
const x2 = [
  [6155, 6157],
  // Mongolian Free Variation Selectors
  [65024, 65039],
  // Variation Selectors
  [917760, 917999]
  // Variation Selectors Supplement
];
function S2(t, e) {
  const n = t?.subTables ?? t?.subtables ?? [];
  let o = !1, s = !1;
  for (const r of n) {
    if (r?.format !== 14) continue;
    const i = r.varSelectorRecords ?? r.variationSelectors ?? [];
    let a = -1;
    for (let c = 0; c < i.length; c++) {
      const f = i[c], u = f.varSelector ?? f.variationSelector;
      if (typeof u != "number") continue;
      !x2.some(
        ([h, p]) => u >= h && u <= p
      ) && !o && (o = !0, C(
        e,
        "error",
        "CMAP_FORMAT14_VS_OUT_OF_RANGE",
        `cmap format 14 record ${c} variation selector U+${u.toString(16).toUpperCase().padStart(4, "0")} is not in any defined VS range (Mongolian FVS, FE00–FE0F, or E0100–E01EF).`
      )), u <= a && !s && (s = !0, C(
        e,
        "error",
        "CMAP_FORMAT14_VS_OUT_OF_ORDER",
        `cmap format 14 variation selectors must be strictly ascending; record ${c} U+${u.toString(16).toUpperCase()} follows U+${a.toString(16).toUpperCase()}.`
      )), a = u;
    }
  }
}
function _2(t, e) {
  const n = t?.subTables ?? t?.subtables ?? [];
  let o = !1, s = !1, r = !1;
  for (const i of n) {
    if (i?.format !== 12 && i?.format !== 13) continue;
    const a = i.groups ?? i.sequentialMapGroups ?? i.constantMapGroups ?? [];
    for (let c = 0; c < a.length; c++) {
      const f = a[c], u = f.startCharCode ?? f.startcharCode ?? f.start, l = f.endCharCode ?? f.endcharCode ?? f.end;
      if (!(typeof u != "number" || typeof l != "number") && (l < u && !r && (r = !0, C(
        e,
        "error",
        "CMAP_FORMAT12_END_BEFORE_START",
        `cmap format ${i.format} group ${c} has endCharCode (U+${l.toString(16).toUpperCase()}) < startCharCode (U+${u.toString(16).toUpperCase()}).`
      )), c > 0)) {
        const h = a[c - 1], p = h.startCharCode ?? h.startcharCode ?? h.start, g = h.endCharCode ?? h.endcharCode ?? h.end;
        typeof p == "number" && u <= p && !o && (o = !0, C(
          e,
          "error",
          "CMAP_FORMAT12_GROUPS_NOT_SORTED",
          `cmap format ${i.format} groups must be sorted by startCharCode; group ${c} (U+${u.toString(16).toUpperCase()}) follows group ${c - 1} (U+${p.toString(16).toUpperCase()}).`
        )), typeof g == "number" && u <= g && !s && (s = !0, C(
          e,
          "error",
          "CMAP_FORMAT12_GROUPS_OVERLAP",
          `cmap format ${i.format} group ${c} (U+${u.toString(16).toUpperCase()}–U+${l.toString(16).toUpperCase()}) overlaps with group ${c - 1} (ends at U+${g.toString(16).toUpperCase()}).`
        ));
      }
    }
  }
}
function Wo(t, e, n) {
  if (!t || t.length === 0) return;
  let o = 0, s = 0, r = !1, i = !1, a = !1, c = !1, f = !1;
  for (; o < t.length; ) {
    const u = t[o];
    if (u >= 176 && u <= 183) {
      const l = (u & 7) + 1;
      if (o++, o + l > t.length) {
        i || (i = !0, C(
          n,
          "error",
          "TT_INSTR_TRUNCATED_PUSH",
          `${e}: PUSHB[${l - 1}] at byte ${o - 1} would read ${l} operands past end of stream (length ${t.length}).`
        ));
        return;
      }
      o += l;
      continue;
    }
    if (u >= 184 && u <= 191) {
      const l = ((u & 7) + 1) * 2;
      if (o++, o + l > t.length) {
        i || (i = !0, C(
          n,
          "error",
          "TT_INSTR_TRUNCATED_PUSH",
          `${e}: PUSHW[${u & 7}] at byte ${o - 1} would read ${l} operand bytes past end of stream (length ${t.length}).`
        ));
        return;
      }
      o += l;
      continue;
    }
    if (u === 64) {
      if (o++, o >= t.length) {
        i || (i = !0, C(
          n,
          "error",
          "TT_INSTR_TRUNCATED_PUSH",
          `${e}: NPUSHB at end of stream with no count byte.`
        ));
        return;
      }
      const l = t[o];
      if (o++, o + l > t.length) {
        i || (i = !0, C(
          n,
          "error",
          "TT_INSTR_TRUNCATED_PUSH",
          `${e}: NPUSHB at byte ${o - 2} declares ${l} operands but only ${t.length - o} remain.`
        ));
        return;
      }
      o += l;
      continue;
    }
    if (u === 65) {
      if (o++, o >= t.length) {
        i || (i = !0, C(
          n,
          "error",
          "TT_INSTR_TRUNCATED_PUSH",
          `${e}: NPUSHW at end of stream with no count byte.`
        ));
        return;
      }
      const l = t[o] * 2;
      if (o++, o + l > t.length) {
        i || (i = !0, C(
          n,
          "error",
          "TT_INSTR_TRUNCATED_PUSH",
          `${e}: NPUSHW at byte ${o - 2} declares ${l / 2} word operands but only ${t.length - o} bytes remain.`
        ));
        return;
      }
      o += l;
      continue;
    }
    if (u === 88) {
      s++, o++;
      continue;
    }
    if (u === 89) {
      s === 0 ? a || (a = !0, C(
        n,
        "error",
        "TT_INSTR_UNBALANCED_EIF",
        `${e}: EIF at byte ${o} with no matching IF.`
      )) : s--, o++;
      continue;
    }
    if (u === 44) {
      r && !c && (c = !0, C(
        n,
        "error",
        "TT_INSTR_NESTED_FDEF",
        `${e}: FDEF at byte ${o} nested inside another FDEF.`
      )), r = !0, o++;
      continue;
    }
    if (u === 45) {
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
function w2(t, e) {
  t.fpgm?.instructions && Wo(t.fpgm.instructions, "fpgm", e), t.prep?.instructions && Wo(t.prep.instructions, "prep", e);
  const n = t.glyf?.glyphs;
  if (Array.isArray(n)) {
    const o = e.length;
    for (let s = 0; s < n.length; s++) {
      const r = n[s]?.instructions;
      if (!(!r || r.length === 0) && (Wo(r, `glyf glyph ${s}`, e), e.length > o))
        break;
    }
  }
}
function b2(t, e, n, o) {
  const s = new Set(e.map((u) => u.tag));
  if (t.head) {
    t.head.magicNumber !== 1594834165 && C(
      n,
      "error",
      "BAD_MAGIC_NUMBER",
      `head.magicNumber is 0x${(t.head.magicNumber >>> 0).toString(16).padStart(8, "0")}, expected 0x5F0F3CF5.`
    );
    const u = t.head.unitsPerEm;
    u !== void 0 && (u < 16 || u > 16384) && C(
      n,
      "error",
      "BAD_UNITS_PER_EM",
      `head.unitsPerEm is ${u} — must be between 16 and 16384.`
    ), t.head.majorVersion !== void 0 && t.head.majorVersion !== 1 && C(
      n,
      "error",
      "HEAD_MAJOR_VERSION_UNSUPPORTED",
      `head.majorVersion is ${t.head.majorVersion}, expected 1.`
    );
    const { xMin: l, xMax: h, yMin: p, yMax: g } = t.head;
    l !== void 0 && h !== void 0 && l > h && C(
      n,
      "error",
      "HEAD_BBOX_INVERTED",
      `head.xMin (${l}) is greater than head.xMax (${h}).`
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
    const u = t.maxp.version;
    u !== void 0 && u !== 20480 && u !== 65536 && C(
      n,
      "error",
      "MAXP_VERSION_INVALID",
      `maxp.version is 0x${(u >>> 0).toString(16).padStart(8, "0")}; must be 0x00005000 (0.5) or 0x00010000 (1.0).`
    ), t.maxp.numGlyphs === 0 && C(
      n,
      "error",
      "MAXP_NUMGLYPHS_ZERO",
      "maxp.numGlyphs is 0 — font contains no glyphs."
    ), u === 20480 && s.has("glyf") && C(
      n,
      "error",
      "MAXP_VERSION_MISMATCH_FOR_OUTLINE",
      "maxp.version is 0.5 (CFF) but font contains a glyf table; TrueType outlines require maxp 1.0."
    ), u === 65536 && (s.has("CFF ") || s.has("CFF2")) && !s.has("glyf") && C(
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
    const u = t.post.version;
    u === 65536 || u === 131072 || u === 151552 || u === 196608 || C(
      n,
      "error",
      "POST_VERSION_UNSUPPORTED",
      `post.version is 0x${(u >>> 0).toString(16).padStart(8, "0")}; must be 1.0, 2.0, 2.5, or 3.0.`
    ), u === 131072 && t.maxp && typeof t.post.numGlyphs == "number" && t.post.numGlyphs !== t.maxp.numGlyphs && C(
      n,
      "error",
      "POST_NUMGLYPHS_MISMATCH",
      `post.numGlyphs (${t.post.numGlyphs}) does not match maxp.numGlyphs (${t.maxp.numGlyphs}).`
    );
  }
  if (t["OS/2"] && typeof t["OS/2"].version == "number") {
    const u = t["OS/2"].version;
    (u < 0 || u > 5) && C(
      n,
      "error",
      "OS2_VERSION_INVALID",
      `OS/2.version is ${u}; must be in range 0..5.`
    );
  }
  if (t["OS/2"] && KS(t["OS/2"], t.head, n), t.maxp && t.hmtx) {
    const u = t.maxp.numGlyphs, l = t.hmtx.hMetrics?.length ?? 0, h = t.hmtx.leftSideBearings?.length ?? 0, p = l + h;
    p !== u && C(
      n,
      "warning",
      "HMTX_GLYPH_MISMATCH",
      `hmtx has ${p} entries (${l} metrics + ${h} LSBs) but maxp.numGlyphs is ${u}.`
    );
  }
  if (t.hhea && t.hmtx) {
    const u = t.hhea.numberOfHMetrics, l = t.hmtx.hMetrics?.length ?? 0;
    l !== u && C(
      n,
      "warning",
      "HHEA_HMTX_MISMATCH",
      `hhea.numberOfHMetrics is ${u} but hmtx has ${l} full metric entries.`
    );
  }
  if (t.loca && t.glyf) {
    const u = t.loca.offsets;
    if (u && u.length > 0) {
      const l = e.find((h) => h.tag === "glyf");
      if (l) {
        const h = u[u.length - 1];
        h > l.length && C(
          n,
          "error",
          "LOCA_BEYOND_GLYF",
          `loca final offset (${h}) exceeds glyf table length (${l.length}).`
        );
      }
    }
  }
  const r = t["CFF "] || t.CFF2;
  if (r && t.maxp) {
    const u = r.topDict?.charStrings?.length ?? r.charStrings?.length ?? null;
    u !== null && u !== t.maxp.numGlyphs && C(
      n,
      "warning",
      "CFF_GLYPH_MISMATCH",
      `CFF charStrings count (${u}) doesn't match maxp.numGlyphs (${t.maxp.numGlyphs}).`
    );
  }
  if (t.name) {
    QS(t.name, e, o, n);
    const u = t.name.nameRecords ?? t.name.names ?? t.name.records ?? [], l = u.some((p) => p.nameID === 1), h = u.some((p) => p.nameID === 2);
    l || C(
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
    for (let p = 1; p < u.length; p++) {
      const g = u[p - 1], d = u[p];
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
    const u = t.cmap.encodingRecords, l = t.cmap.subtables || [];
    for (let h = 1; h < u.length; h++) {
      const p = u[h - 1], g = u[h], d = (l[p.subtableIndex] || {}).language || 0, x = (l[g.subtableIndex] || {}).language || 0;
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
  t.cmap && XS(t.cmap, t.maxp, n);
  const i = t["CFF "];
  if (i?.fonts)
    for (let u = 0; u < i.fonts.length; u++) {
      const l = i.fonts[u].charStrings || [];
      for (let h = 0; h < l.length; h++) {
        const p = l[h];
        if (!p || p.length === 0) {
          C(
            n,
            "error",
            "CFF_EMPTY_CHARSTRING",
            `CFF font ${u}: charstring for glyph ${h} is empty (must contain at least an endchar operator).`
          );
          break;
        }
        const g = p[p.length - 1];
        if (g !== 14 && g !== 11) {
          C(
            n,
            "warning",
            "CFF_CHARSTRING_NO_ENDCHAR",
            `CFF font ${u}: charstring for glyph ${h} does not terminate with endchar (last byte = 0x${g.toString(16).padStart(2, "0")}).`
          );
          break;
        }
      }
    }
  if (s.has("CFF ") || s.has("CFF2")) {
    let u;
    if (t.post && typeof t.post.version == "number")
      u = t.post.version;
    else if (o) {
      const l = e.find((h) => h.tag === "post");
      l && l.length >= 4 && l.offset + 4 <= o.byteLength && (u = new DataView(o).getUint32(l.offset));
    }
    if (u !== void 0 && u !== 196608) {
      const l = `0x${(u >>> 0).toString(16).padStart(8, "0")}`;
      C(
        n,
        "error",
        "POST_VERSION_INVALID_FOR_CFF",
        `post table version is ${l} but CFF-flavored fonts must use 0x00030000 (3.0).`
      );
    }
  }
  if (t.vhea && t.vmtx) {
    const u = t.vhea.numOfLongVerMetrics ?? t.vhea.numberOfVMetrics, l = t.vmtx.metrics?.length ?? 0;
    u !== void 0 && l !== u && C(
      n,
      "warning",
      "VHEA_VMTX_MISMATCH",
      `vhea.numOfLongVerMetrics is ${u} but vmtx has ${l} full metric entries.`
    );
  }
  s.has("gvar") && !s.has("fvar") && C(
    n,
    "error",
    "GVAR_WITHOUT_FVAR",
    "gvar table present without fvar — glyph variations require a variation axis table."
  );
  for (const u of ["HVAR", "VVAR", "MVAR", "avar"])
    s.has(u) && !s.has("fvar") && C(
      n,
      "error",
      `${u.toUpperCase()}_WITHOUT_FVAR`,
      `${u} table present without fvar — variation tables require a variation axis table.`
    );
  const a = t.maxp?.numGlyphs ?? 0, c = t.fvar, f = Qs();
  c && (o2(c, n), i2(c, t.name, n)), t.STAT && a2(t.STAT, c, n), t.avar && c2(t.avar, c, n), t.HVAR && oa(t.HVAR, "HVAR", c, n), t.VVAR && oa(t.VVAR, "VVAR", c, n), t.MVAR && f2(t.MVAR, c, n), t.GDEF && u2(t.GDEF, a, c, n, f), t.GSUB && (na(t.GSUB, "GSUB", n), sa(
    t.GSUB,
    "GSUB",
    a,
    n,
    f
  )), t.GPOS && (na(t.GPOS, "GPOS", n), sa(
    t.GPOS,
    "GPOS",
    a,
    n,
    f
  )), t.MATH && l2(t.MATH, n), t["CFF "] && ca(t["CFF "], "CFF", n, !1), t.CFF2 && ca(t.CFF2, "CFF2", n, !0), t.glyf && (m2(t.glyf, a, n), y2(t.glyf, t.head, n)), t.cmap && (S2(t.cmap, n), _2(t.cmap, n)), w2(t, n);
}
function A2(t) {
  const e = new F(new Uint8Array(t));
  e.skip(4);
  const n = e.uint16();
  e.skip(2);
  const o = e.uint32();
  if (o === 0) return null;
  const s = e.uint32();
  return { majorVersion: n, numFonts: o, firstOffset: s };
}
function C2(t) {
  const e = [];
  t && typeof t.byteLength == "number" && t.byteLength > 1073741824 && C(
    e,
    "error",
    "FILE_EXCEEDS_1GB",
    `Font file is ${t.byteLength} bytes (> 1 GiB); Firefox/OTS will reject it.`
  );
  const n = US(t, e);
  if (!n) return Tt(e);
  let o = n.sfnt;
  if (n.format === "collection")
    try {
      const a = A2(o);
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
  const s = zS(o, e);
  if (!s) return Tt(e);
  const r = HS(o, s, e);
  if (r.length === 0 && s.numTables > 0)
    return C(
      e,
      "error",
      "NO_READABLE_ENTRIES",
      "Could not read any table directory entries."
    ), Tt(e);
  WS(r, e), jS(o, r, e);
  const i = qS(o, r, e);
  return b2(i, r, e, o), Tt(e);
}
function _t(t) {
  return t !== null && typeof t == "object" && !Array.isArray(t);
}
function ru(t) {
  return Number.isInteger(t) && t >= 0 && t <= 4294967295;
}
function iu(t) {
  return Array.isArray(t?._raw);
}
function N(t, e, n, o, s) {
  t.push({ severity: e, code: n, message: o, path: s });
}
function la(t) {
  const e = t > 0 ? 2 ** Math.floor(Math.log2(t)) : 0, n = e * 16, o = e > 0 ? Math.floor(Math.log2(e)) : 0, s = t * 16 - n;
  return { searchRange: n, entrySelector: o, rangeShift: s };
}
function ha(t) {
  return _t(t) && (t["CFF "] || t.CFF2) ? 1330926671 : 65536;
}
function ga(t) {
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
function v2(t, e, n, o) {
  let s = t.header;
  if (!_t(s))
    if (_t(t._header))
      t.header = { ...t._header }, s = t.header, N(
        o,
        "info",
        "HEADER_PROMOTED",
        'No "header" found; promoted "_header" for export compatibility.',
        n
      );
    else {
      const a = ha(t.tables), c = la(e);
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
  if (!ru(s.sfVersion)) {
    const a = ha(t.tables);
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
  const r = la(e);
  (s.searchRange !== r.searchRange || s.entrySelector !== r.entrySelector || s.rangeShift !== r.rangeShift) && (s.searchRange = r.searchRange, s.entrySelector = r.entrySelector, s.rangeShift = r.rangeShift, N(
    o,
    "info",
    "HEADER_FIELDS_CORRECTED",
    `Header directory fields auto-corrected for ${e} tables (searchRange=${r.searchRange}, entrySelector=${r.entrySelector}, rangeShift=${r.rangeShift}).`,
    n
  ));
}
function I2(t, e, n) {
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
function k2(t, e, n) {
  if (!_t(t))
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
    if (!_t(r)) {
      N(
        n,
        "error",
        "TABLE_DATA_INVALID",
        `Table "${s}" must be an object.`,
        i
      );
      continue;
    }
    r._checksum !== void 0 && !ru(r._checksum) && N(
      n,
      "error",
      "TABLE_CHECKSUM_INVALID",
      `Table "${s}" _checksum must be uint32 when provided.`,
      `${i}._checksum`
    ), r._raw !== void 0 && I2(r._raw, `${i}._raw`, n);
    const a = nu.has(s), c = iu(r);
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
function O2(t, e, n) {
  const o = (i) => t[i] !== void 0, s = (i) => o(i) && !iu(t[i]), r = (i, a, c = "requires") => {
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
function E2(t, e, n) {
  const o = (i) => t[i] !== void 0;
  for (const i of ou)
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
function au(t, e, n) {
  if (!_t(t)) {
    N(
      n,
      "error",
      "FONTDATA_INVALID",
      "Font data must be an object.",
      e
    );
    return;
  }
  const o = k2(t.tables, `${e}.tables`, n);
  v2(t, o.length, `${e}.header`, n), _t(t.tables) && (E2(t.tables, `${e}.tables`, n), O2(t.tables, `${e}.tables`, n));
}
function T2(t, e, n) {
  const o = t.collection, s = t.fonts;
  if (_t(o) || N(
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
  _t(o) && o.numFonts !== void 0 && o.numFonts !== s.length && (o.numFonts = s.length, N(
    n,
    "info",
    "COLLECTION_NUMFONTS_CORRECTED",
    `collection.numFonts corrected to ${s.length} to match fonts array.`,
    `${e}.collection.numFonts`
  ));
  for (let r = 0; r < s.length; r++)
    au(s[r], `${e}.fonts[${r}]`, n);
}
function D2(t) {
  const e = [];
  return _t(t) ? (t.collection !== void 0 || t.fonts !== void 0 ? T2(t, "$", e) : au(t, "$", e), ga(e)) : (N(
    e,
    "error",
    "INPUT_INVALID",
    "validateJSON expects a font JSON object.",
    "$"
  ), ga(e));
}
function pa(t) {
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
const R2 = {
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
function F2(t, e) {
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
class vt {
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
        { ...R2 },
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
    return new vt(a);
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
    const n = pa(e);
    if (n.kind === "json") {
      const s = zo(n.text);
      if (s && s.collection && Array.isArray(s.fonts))
        throw new Error(
          "FontFlux.open() received a font collection JSON. Use FontFlux.openAll() for collections."
        );
      return new vt(s);
    }
    const o = Qn(n.buffer);
    if (o.collection && o.fonts)
      throw new Error(
        "FontFlux.open() received a font collection (TTC/OTC). Use FontFlux.openAll() for collections."
      );
    return new vt(o);
  }
  /**
   * Open all fonts from a binary file or JSON. Works for both single fonts
   * and collections.  Accepts the same input types as `FontFlux.open()`.
   *
   * @param {ArrayBuffer|Uint8Array|string} input
   * @returns {FontFlux[]} Array of FontFlux instances (one per face).
   */
  static openAll(e) {
    const n = pa(e);
    if (n.kind === "json") {
      const s = zo(n.text);
      return s && s.collection && Array.isArray(s.fonts) ? s.fonts.map((r) => new vt(r)) : [new vt(s)];
    }
    const o = Qn(n.buffer);
    return o.collection && o.fonts ? o.fonts.map((s) => new vt(s)) : [new vt(o)];
  }
  /**
   * Restore a font from a JSON string.
   *
   * @param {string} jsonString - JSON produced by font.toJSON().
   * @returns {FontFlux}
   */
  static fromJSON(e) {
    const n = zo(e);
    return new vt(n);
  }
  /**
   * Initialize WOFF2 support. Must be called (and awaited) once before
   * opening or exporting WOFF2 files.
   *
   * @returns {Promise<void>}
   */
  static async initWoff2() {
    return Uf();
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
    return ji(o, n);
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
    return C2(e);
  }
  /** Convert an SVG path `d` string to font contours. */
  static svgToContours(e, n) {
    return da(e, n);
  }
  /** Convert font contours to an SVG path `d` string. */
  static contoursToSVG(e) {
    return Au(e);
  }
  /** Compile CFF contours to Type 2 charstring bytecode. */
  static compileCharString(e) {
    return Xe(e);
  }
  /** Assemble charstring assembly text to Type 2 bytecode. */
  static assembleCharString(e) {
    return bu(e);
  }
  /** Interpret Type 2 charstring bytecode to CFF contours. */
  static interpretCharString(e, n, o) {
    return eo(e, n, o);
  }
  /** Disassemble Type 2 charstring bytecode to assembly text. */
  static disassembleCharString(e) {
    return va(e);
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
    return n ? Ts(this._data.glyphs, n) : [];
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
    (n.path || n.name && n.advanceWidth && !n._created) && (n = Eu(n));
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
      n.name = F2(o, n);
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
    return RS(this._data, e, n);
  }
  /**
   * Add kerning pairs. Accepts all createKerning() input formats.
   * Duplicate pairs are resolved with last-write-wins.
   *
   * @param {object|object[]} pairsOrInput - Kerning data in any supported format.
   */
  addKerning(e) {
    const n = DS(e);
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
    return MS(this._data, e, n);
  }
  /**
   * Add substitution rules. Accepts the same flexible formats as
   * createSubstitution(): single rules, arrays, class-based, etc.
   *
   * @param {object|object[]} rulesOrInput - Substitution rule(s).
   */
  addSubstitution(e) {
    const n = eu(e);
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
    const n = tr(e);
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
    const r = tr([o]);
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
    const n = hu(e);
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
    return ji(this._data, e);
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
    return this._data = Sa(this._data, e), this;
  }
  /**
   * Serialize the font to a JSON string.
   *
   * @param {number} [indent=2] - Indentation level.
   * @returns {string}
   */
  toJSON(e) {
    return TS(this._data, e);
  }
  /**
   * Validate the font data.
   *
   * @returns {object} { valid, errors, warnings, infos }
   */
  validate() {
    return D2(this._data);
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
async function M2() {
  return Uf();
}
export {
  vt as FontFlux,
  C2 as diagnoseFont,
  zo as fontFromJSON,
  TS as fontToJSON,
  M2 as initWoff2
};
