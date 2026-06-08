function Ss(t) {
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
function _s(t) {
  const e = (t.red & 255).toString(16).padStart(2, "0"), n = (t.green & 255).toString(16).padStart(2, "0"), o = (t.blue & 255).toString(16).padStart(2, "0");
  if (t.alpha === 255 || t.alpha === void 0)
    return `#${e}${n}${o}`;
  const s = (t.alpha & 255).toString(16).padStart(2, "0");
  return `#${e}${n}${o}${s}`;
}
function Us(t) {
  if (!Array.isArray(t))
    throw new Error("Palette must be an array of colors");
  return t.map((e) => {
    if (typeof e == "string")
      return Ss(e), zf(e);
    if (e && typeof e == "object" && "red" in e)
      return _s(e);
    throw new Error(`Invalid palette color: ${e}`);
  });
}
function zf(t) {
  return _s(Ss(t));
}
function Hf(t) {
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
function Wf(t) {
  const e = /* @__PURE__ */ new Map();
  for (let n = 0; n < t.length; n++)
    e.set(n, t[n].name);
  return e;
}
function jf(t) {
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
    return Yf(t);
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
function Yf(t) {
  const e = Math.round(t * 65536), n = e < 0 ? e + 4294967296 : e;
  return [
    255,
    n >> 24 & 255,
    n >> 16 & 255,
    n >> 8 & 255,
    n & 255
  ];
}
const zs = 21, Zf = 22, Xf = 4, qf = 5, Kf = 6, Jf = 7, Qf = 8, Hs = 14;
function Ze(t, e) {
  const n = Number.isFinite(e) ? j(e) : [];
  if (!t || t.length === 0)
    return [
      ...n,
      ...j(0),
      ...j(0),
      zs,
      Hs
    ];
  const o = [...n];
  let s = 0, r = 0;
  for (const i of t)
    if (!(!i || i.length === 0))
      for (const a of i)
        switch (a.type) {
          case "M": {
            const c = a.x - s, f = a.y - r;
            c === 0 && f !== 0 ? o.push(...j(f), Xf) : f === 0 && c !== 0 ? o.push(...j(c), Zf) : o.push(...j(c), ...j(f), zs), s = a.x, r = a.y;
            break;
          }
          case "L": {
            const c = a.x - s, f = a.y - r;
            c === 0 && f !== 0 ? o.push(...j(f), Jf) : f === 0 && c !== 0 ? o.push(...j(c), Kf) : o.push(...j(c), ...j(f), qf), s = a.x, r = a.y;
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
              Qf
            ), s = a.x, r = a.y;
            break;
          }
        }
  return o.push(Hs), o;
}
const Ws = {
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
function tl(t) {
  const e = [], n = t.split(`
`).filter((o) => o.trim().length > 0);
  for (const o of n) {
    const s = o.trim().split(/\s+/);
    if (s.length === 0) continue;
    let r = -1, i = null;
    for (let a = 0; a < s.length; a++) {
      const c = s[a].toLowerCase();
      if (Ws[c] || c.startsWith("op")) {
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
    } else i.startsWith("op") ? e.push(parseInt(i.slice(2), 10)) : e.push(...Ws[i]);
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
function el(t) {
  if (!t || t.length === 0) return "";
  const e = [];
  for (const n of t)
    !n || n.length === 0 || (n[0].type ? e.push(nl(n)) : e.push(ol(n)));
  return e.join(" ");
}
function nl(t) {
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
function ol(t) {
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
function ea(t, e = "cff") {
  const n = il(t);
  if (n.length === 0) return [];
  const o = [];
  let s = null;
  for (const r of n)
    r.op === "M" ? (s && s.length > 0 && o.push(s), s = [r]) : r.op === "Z" ? (s && s.length > 0 && o.push(s), s = null) : s && s.push(r);
  return s && s.length > 0 && o.push(s), e === "truetype" ? o.map((r) => rl(r)) : o.map((r) => sl(r));
}
function sl(t) {
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
function rl(t) {
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
function il(t) {
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
        let d = u(), x = u(), m = u(), y = u(), w = u(), S = u();
        p && (d += o, x += s, m += o, y += s, w += o, S += s), e.push({ op: "C", x1: d, y1: x, x2: m, y2: y, x: w, y: S }), c = m, f = y, o = w, s = S, a = h;
        break;
      }
      case "S": {
        let d = 2 * o - c, x = 2 * s - f;
        a.toUpperCase() !== "C" && a.toUpperCase() !== "S" && (d = o, x = s);
        let m = u(), y = u(), w = u(), S = u();
        p && (m += o, y += s, w += o, S += s), e.push({ op: "C", x1: d, y1: x, x2: m, y2: y, x: w, y: S }), c = m, f = y, o = w, s = S, a = h;
        break;
      }
      case "Q": {
        let d = u(), x = u(), m = u(), y = u();
        p && (d += o, x += s, m += o, y += s), e.push({ op: "Q", x1: d, y1: x, x: m, y }), c = d, f = x, o = m, s = y, a = h;
        break;
      }
      case "T": {
        let d = 2 * o - c, x = 2 * s - f;
        a.toUpperCase() !== "Q" && a.toUpperCase() !== "T" && (d = o, x = s);
        let m = u(), y = u();
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
function Ln(t, e, n, o, s, r, i, a, c = 0) {
  const f = (3 * (n + s) - t - i) / 4, l = (3 * (o + r) - e - a) / 4, u = t + 2 / 3 * (f - t), h = e + 2 / 3 * (l - e), p = i + 2 / 3 * (f - i), g = a + 2 / 3 * (l - a), d = Math.hypot(n - u, o - h), x = Math.hypot(s - p, r - g);
  if (Math.max(d, x) <= 0.5 || c >= 8)
    return [{ cx: f, cy: l, x: i, y: a }];
  const y = (t + n) / 2, w = (e + o) / 2, S = (n + s) / 2, _ = (o + r) / 2, b = (s + i) / 2, A = (r + a) / 2, k = (y + S) / 2, O = (w + _) / 2, I = (S + b) / 2, E = (_ + A) / 2, T = (k + I) / 2, D = (O + E) / 2, F = Ln(
    t,
    e,
    y,
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
  return F.concat(M);
}
function U(t) {
  const e = Math.round(t * 100) / 100;
  return e === Math.floor(e) ? String(e) : e.toFixed(2).replace(/0+$/, "");
}
function al(t) {
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
    const d = ea(c, p);
    g.contours = d, p === "cff" && (g.charString = Ze(d));
  } else f ? (g.contours = f, f.length > 0 && f[0] && f[0].length > 0 && f[0][0].type && (g.charString = Ze(f))) : u && (g.components = u);
  return g;
}
function pn(t, e) {
  const n = t?.glyphs;
  if (!n || !Array.isArray(n)) return;
  const o = na(e);
  if (o !== void 0)
    return oa(n, o);
  if (typeof e == "string")
    return n.find((s) => s.name === e);
}
function Rt(t, e) {
  const n = na(e);
  if (n !== void 0)
    return oa(t, n)?.name;
  if (typeof e == "string")
    return e;
}
function na(t) {
  if (typeof t == "number") return t;
  if (typeof t == "string") {
    const e = t.match(/^(?:U\+|0x)([0-9A-Fa-f]+)$/i);
    if (e) return parseInt(e[1], 16);
  }
}
function oa(t, e) {
  for (const n of t)
    if (n.unicode === e || n.unicodes && n.unicodes.includes(e) || n.codePoint === e) return n;
}
function cl(t) {
  let e = 1, n = 0, o = 0, s = 1;
  const r = t.transform;
  r && (typeof r.scale == "number" ? (e = r.scale, s = r.scale) : (typeof r.xScale == "number" && (e = r.xScale), typeof r.yScale == "number" && (s = r.yScale), typeof r.scale01 == "number" && (n = r.scale01), typeof r.scale10 == "number" && (o = r.scale10)));
  let i = 0, a = 0;
  return t.flags?.argsAreXYValues && (i = t.argument1 || 0, a = t.argument2 || 0), { a: e, b: n, c: o, d: s, dx: i, dy: a };
}
function ws(t, e, n = 0) {
  if (!e) return [];
  if (!e.components || e.components.length === 0)
    return Array.isArray(e.contours) ? e.contours.map((s) => s.slice()) : [];
  if (n > 16 || !Array.isArray(t)) return [];
  const o = [];
  for (const s of e.components) {
    const r = t[s.glyphIndex];
    if (!r) continue;
    const i = ws(t, r, n + 1);
    if (i.length === 0) continue;
    const { a, b: c, c: f, d: l, dx: u, dy: h } = cl(s), p = a === 1 && c === 0 && f === 0 && l === 1;
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
const fl = 65536, ll = 1330926671, ul = ["CFF ", "CFF2", "VORG"], hl = [
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
function sa(t, e) {
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
  if (gl(t) === e) return t;
  if (!Array.isArray(t.glyphs))
    throw new Error(
      "Outline conversion requires simplified glyph data ({ font, glyphs })."
    );
  const o = t.tables || {};
  if (t.axes?.length || o.fvar || o.gvar || o.CFF2)
    throw new Error(
      "Outline conversion is not supported for variable fonts (fvar/gvar/CFF2)."
    );
  return e === "truetype" ? pl(t) : ml(t);
}
function gl(t) {
  const e = t.tables || {};
  return e["CFF "] || e.CFF2 ? "cff" : e.glyf ? "truetype" : (t.glyphs || []).some((o) => o.charString) ? "cff" : "truetype";
}
function pl(t) {
  const e = t.glyphs.map((n) => {
    const o = { ...n };
    return delete o.charString, delete o.charStringDisassembly, delete o.components, Sl(n.contours) ? o.contours = n.contours.map(dl) : Array.isArray(n.contours) ? o.contours = n.contours : o.contours = [], o;
  });
  return aa(t, {
    glyphs: e,
    tables: ra(t.tables, ul),
    _header: ia(t._header, fl)
  });
}
function dl(t) {
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
function ml(t) {
  const e = t.glyphs, n = e.map((o) => {
    const s = { ...o };
    delete s.instructions, delete s.components;
    const i = ws(e, o).map(yl).filter((c) => c.length > 0);
    s.contours = i;
    const a = Number.isFinite(o.advanceWidth) ? o.advanceWidth : void 0;
    return s.charString = Ze(i, a), s;
  });
  return aa(t, {
    glyphs: n,
    tables: ra(t.tables, hl),
    _header: ia(t._header, ll),
    // Clear decomposed TrueType-hinting fields so they are not re-emitted.
    cvt: void 0,
    fpgm: void 0,
    prep: void 0,
    gasp: void 0
  });
}
function yl(t) {
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
      i.push(xl(a, c, u.x, u.y, h.x, h.y)), a = h.x, c = h.y, l += 2;
    }
  }
  return i;
}
function xl(t, e, n, o, s, r) {
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
function Sl(t) {
  return Array.isArray(t) && t.length > 0 && Array.isArray(t[0]) && t[0].length > 0 && typeof t[0][0]?.type == "string";
}
function ra(t, e) {
  const n = {};
  if (!t) return n;
  const o = new Set(e);
  for (const [s, r] of Object.entries(t))
    o.has(s) || (n[s] = r);
  return n;
}
function ia(t, e) {
  return t ? { ...t, sfVersion: e } : { sfVersion: e };
}
function aa(t, e) {
  const n = { ...t, ...e };
  for (const o of Object.keys(e))
    e[o] === void 0 && delete n[o];
  return n;
}
function ca(t, e) {
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
function js(t) {
  return t < 1240 ? 107 : t < 33900 ? 1131 : 32768;
}
function Jn(t, e = [], n = []) {
  const o = [], s = [];
  let r = null, i = 0, a = 0, c = null, f = !1, l = !0;
  const u = js(e.length), h = js(n.length);
  function p(S, _) {
    r && r.length > 0 && s.push(r), i += S, a += _, r = [{ type: "M", x: i, y: a }];
  }
  function g(S, _) {
    i += S, a += _, r && r.push({ type: "L", x: i, y: a });
  }
  function d(S, _, b, A, k, O) {
    const I = i + S, E = a + _, T = I + b, D = E + A;
    i = T + k, a = D + O, r && r.push({ type: "C", x1: I, y1: E, x2: T, y2: D, x: i, y: a });
  }
  function x() {
    l && (o.length % 2 !== 0 && (c = o.shift()), l = !1, f = !0);
  }
  function m(S) {
    switch (S) {
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
        for (let _ = 0; _ < o.length; _ += 2)
          g(o[_], o[_ + 1]);
        o.length = 0;
        break;
      case 6:
        for (let _ = 0; _ < o.length; _++)
          _ % 2 === 0 ? g(o[_], 0) : g(0, o[_]);
        o.length = 0;
        break;
      case 7:
        for (let _ = 0; _ < o.length; _++)
          _ % 2 === 0 ? g(0, o[_]) : g(o[_], 0);
        o.length = 0;
        break;
      case 8:
        for (let _ = 0; _ + 5 < o.length; _ += 6)
          d(
            o[_],
            o[_ + 1],
            o[_ + 2],
            o[_ + 3],
            o[_ + 4],
            o[_ + 5]
          );
        o.length = 0;
        break;
      case 10: {
        const _ = o.pop() + h;
        n[_] && (callStack.push(null), execute(n[_]));
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
          const _ = o.pop(), b = o.pop();
          p(b, _);
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
          let _ = 0, b = 0;
          for (o.length % 4 !== 0 && (b = o[_++]); _ + 3 < o.length; _ += 4)
            d(b, o[_], o[_ + 1], o[_ + 2], 0, o[_ + 3]), b = 0;
        }
        o.length = 0;
        break;
      case 27:
        {
          let _ = 0, b = 0;
          for (o.length % 4 !== 0 && (b = o[_++]); _ + 3 < o.length; _ += 4)
            d(o[_], b, o[_ + 1], o[_ + 2], o[_ + 3], 0), b = 0;
        }
        o.length = 0;
        break;
      case 29: {
        const _ = o.pop() + u;
        e[_] && (callStack.push(null), execute(e[_]));
        break;
      }
      case 30:
        {
          let _ = 0;
          for (; _ < o.length && _ + 3 < o.length; ) {
            {
              const b = o.length - _ === 5 ? o[_ + 4] : 0;
              d(
                0,
                o[_],
                o[_ + 1],
                o[_ + 2],
                o[_ + 3],
                b
              ), _ += b !== 0 ? 5 : 4;
            }
            if (_ + 3 < o.length) {
              const b = o.length - _ === 5 ? o[_ + 4] : 0;
              d(
                o[_],
                0,
                o[_ + 1],
                o[_ + 2],
                b,
                o[_ + 3]
              ), _ += b !== 0 ? 5 : 4;
            } else break;
          }
        }
        o.length = 0;
        break;
      case 31:
        {
          let _ = 0;
          for (; _ < o.length && _ + 3 < o.length; ) {
            {
              const b = o.length - _ === 5 ? o[_ + 4] : 0;
              d(
                o[_],
                0,
                o[_ + 1],
                o[_ + 2],
                b,
                o[_ + 3]
              ), _ += b !== 0 ? 5 : 4;
            }
            if (_ + 3 < o.length) {
              const b = o.length - _ === 5 ? o[_ + 4] : 0;
              d(
                0,
                o[_],
                o[_ + 1],
                o[_ + 2],
                o[_ + 3],
                b
              ), _ += b !== 0 ? 5 : 4;
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
  function y(S) {
    switch (S) {
      case 34:
        {
          const _ = o[0], b = 0, A = o[1], k = o[2], O = o[3], I = 0, E = o[4], T = 0, D = o[5], F = -k, M = o[6], L = 0;
          d(_, b, A, k, O, I), d(E, T, D, F, M, L);
        }
        o.length = 0;
        break;
      case 35:
        d(o[0], o[1], o[2], o[3], o[4], o[5]), d(o[6], o[7], o[8], o[9], o[10], o[11]), o.length = 0;
        break;
      case 36:
        {
          const _ = o[0], b = o[1], A = o[2], k = o[3], O = o[4], I = 0, E = o[5], T = 0, D = o[6], F = o[7], M = o[8], L = -(b + k + F);
          d(_, b, A, k, O, I), d(E, T, D, F, M, L);
        }
        o.length = 0;
        break;
      case 37:
        {
          const _ = o[0], b = o[1], A = o[2], k = o[3], O = o[4], I = o[5], E = o[6], T = o[7], D = o[8], F = o[9], M = o[10], L = _ + A + O + E + D, H = b + k + I + T + F;
          let P, Z;
          Math.abs(L) > Math.abs(H) ? (P = M, Z = -H) : (P = -L, Z = M), d(_, b, A, k, O, I), d(E, T, D, F, P, Z);
        }
        o.length = 0;
        break;
      default:
        o.length = 0;
        break;
    }
  }
  function w(S, _) {
    let b = _ || 0, A = 0;
    for (; A < S.length; ) {
      const k = S[A], O = ca(S, A);
      if (O !== null) {
        o.push(O.value), A += O.bytesConsumed;
        continue;
      }
      if (k === 12) {
        A++;
        const I = S[A];
        A++, y(I);
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
        A++, m(k);
      }
    }
    return b;
  }
  return w(t, 0), r && r.length > 0 && s.push(r), { contours: s, width: c };
}
const Ys = {
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
}, _l = {
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
function fa(t) {
  const e = [], n = [];
  let o = 0, s = 0;
  for (; s < t.length; ) {
    const r = t[s], i = ca(t, s);
    if (i !== null) {
      n.push(i.value), s += i.bytesConsumed;
      continue;
    }
    if (r === 12) {
      s++;
      const a = t[s];
      s++;
      const c = _l[a] || `op12.${a}`;
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
      const a = Ys[r];
      e.push(n.length ? `${n.join(" ")} ${a}` : a), n.length = 0, s++;
    } else {
      const a = Ys[r] || `op${r}`;
      e.push(n.length ? `${n.join(" ")} ${a}` : a), n.length = 0, s++;
    }
  }
  return n.length && e.push(n.join(" ")), e.join(`
`);
}
const wl = /* @__PURE__ */ new Set([
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
function bs(t) {
  const { header: e, tables: n } = t, o = Al(n), s = El(n), r = { font: o, glyphs: s }, i = Tl(n, s);
  i.length > 0 && (r.kerning = i), n.fvar && (r.axes = Nl(n), r.instances = Gl(n));
  const a = Ul(n);
  a && (r.axisMapping = a);
  const c = zl(n);
  c && (r.axisStyles = c);
  const f = Hl(n);
  if (f && (r.metricVariations = f), n.GSUB && !n.GSUB._raw) {
    const { substitutions: p, rawLookups: g } = jl(
      n.GSUB,
      s
    );
    p.length > 0 && (r.substitutions = p), g.length > 0 && (r._rawGSUBLookups = g);
  }
  const l = {};
  n.GPOS && !n.GPOS._raw && (l.GPOS = n.GPOS), n.GDEF && !n.GDEF._raw && (l.GDEF = n.GDEF), Object.keys(l).length > 0 && (r.features = l), n.gasp && !n.gasp._raw && n.gasp.gaspRanges && (r.gasp = n.gasp.gaspRanges.map((p) => ({
    maxPPEM: p.rangeMaxPPEM,
    behavior: p.rangeGaspBehavior
  }))), n["cvt "] && !n["cvt "]._raw && n["cvt "].values && (r.cvt = n["cvt "].values), n.fpgm && !n.fpgm._raw && n.fpgm.instructions && (r.fpgm = n.fpgm.instructions), n.prep && !n.prep._raw && n.prep.instructions && (r.prep = n.prep.instructions);
  const u = tu(n);
  u && (r.palettes = u);
  const h = eu(n, s);
  return h && h.length > 0 && (r.colorGlyphs = h), r.tables = { ...n }, r._header = e, r;
}
const bl = {
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
  19: "sampleText"
};
function _e(t, e) {
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
function Al(t) {
  const e = t.name, n = t.head, o = t.hhea, s = t["OS/2"], r = t.post, i = {};
  for (const [a, c] of Object.entries(bl)) {
    const f = _e(e, Number(a));
    f !== void 0 && f.trim() !== "" && (i[c] = f);
  }
  return n && !n._raw && (i.unitsPerEm = n.unitsPerEm, i.created = Xs(n.created), i.modified = Xs(n.modified)), o && !o._raw && (i.ascender = o.ascender, i.descender = o.descender, i.lineGap = o.lineGap), r && !r._raw && (i.italicAngle = r.italicAngle, i.underlinePosition = r.underlinePosition, i.underlineThickness = r.underlineThickness, i.isFixedPitch = r.isFixedPitch !== 0), s && !s._raw && (i.weightClass = s.usWeightClass, i.widthClass = s.usWidthClass, i.fsType = s.fsType, i.fsSelection = s.fsSelection, i.achVendID = s.achVendID, s.panose && (i.panose = s.panose)), i;
}
const Cl = [
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
function vl(t, e) {
  return t === 0 ? !0 : t === 3 ? e === 0 || e === 1 || e === 10 : !1;
}
function De(t, e) {
  return !e || t < 128 ? t : t <= 255 ? Cl[t - 128] : t;
}
function Il(t, e, n) {
  switch (e.format) {
    case 0:
      for (let o = 0; o < e.glyphIdArray.length; o++) {
        const s = e.glyphIdArray[o];
        s !== 0 && Fe(t, s, De(o, n));
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
          r !== void 0 && r !== 0 && Fe(t, r, De(s, n));
        }
      break;
    case 6:
      for (let o = 0; o < e.glyphIdArray.length; o++) {
        const s = e.glyphIdArray[o];
        s !== 0 && Fe(
          t,
          s,
          De(e.firstCode + o, n)
        );
      }
      break;
    case 12:
      for (const o of e.groups)
        for (let s = o.startCharCode; s <= o.endCharCode; s++) {
          const r = o.startGlyphID + (s - o.startCharCode);
          r !== 0 && Fe(t, r, De(s, n));
        }
      break;
    case 13:
      for (const o of e.groups)
        for (let s = o.startCharCode; s <= o.endCharCode; s++)
          o.glyphID !== 0 && Fe(
            t,
            o.glyphID,
            De(s, n)
          );
      break;
  }
}
function Ol(t) {
  const e = /* @__PURE__ */ new Map();
  if (!t || t._raw || !t.subtables) return e;
  const n = t.subtables, o = t.encodingRecords;
  let s;
  if (Array.isArray(o) && o.length > 0) {
    const r = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Set();
    for (const a of o)
      vl(a.platformID, a.encodingID) ? r.add(a.subtableIndex) : a.platformID === 1 && a.encodingID === 0 && i.add(a.subtableIndex);
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
    a && Il(e, a, i);
  }
  return e;
}
function Fe(t, e, n) {
  t.has(e) || t.set(e, []);
  const o = t.get(e);
  o.includes(n) || o.push(n);
}
function kl(t, e) {
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
function El(t) {
  const e = t.glyf && !t.glyf._raw, n = t["CFF "] && !t["CFF "]._raw, o = t.hmtx && !t.hmtx._raw ? t.hmtx : null, s = t.vmtx && !t.vmtx._raw ? t.vmtx : null, r = t.hhea && !t.hhea._raw ? t.hhea : null, i = t.vhea && !t.vhea._raw ? t.vhea : null;
  let a = 0;
  t.maxp && !t.maxp._raw ? a = t.maxp.numGlyphs : e ? a = t.glyf.glyphs.length : n ? a = t["CFF "].fonts[0].charStrings.length : o && (a = o.hMetrics.length + (o.leftSideBearings?.length || 0));
  const c = r ? r.numberOfHMetrics : a, f = i ? i.numOfLongVerMetrics : 0, l = Ol(t.cmap), u = kl(t, a), h = [];
  for (let p = 0; p < a; p++) {
    const g = {};
    u[p] && (g.name = u[p]);
    const d = l.get(p) || [];
    if (d.length === 1 ? g.unicode = d[0] : d.length > 1 ? (g.unicode = d[0], g.unicodes = d) : g.unicode = null, o && (p < c ? (g.advanceWidth = o.hMetrics[p].advanceWidth, g.leftSideBearing = o.hMetrics[p].lsb) : (g.advanceWidth = o.hMetrics[c - 1].advanceWidth, g.leftSideBearing = o.leftSideBearings[p - c])), s && (p < f ? (g.advanceHeight = s.vMetrics[p].advanceHeight, g.topSideBearing = s.vMetrics[p].topSideBearing) : s.topSideBearings && (g.advanceHeight = s.vMetrics[f - 1].advanceHeight, g.topSideBearing = s.topSideBearings[p - f])), e) {
      const x = t.glyf.glyphs[p];
      x && x.type === "simple" ? (g.contours = x.contours, x.instructions && x.instructions.length > 0 && (g.instructions = x.instructions)) : x && x.type === "composite" && (g.components = x.components, x.instructions && x.instructions.length > 0 && (g.instructions = x.instructions));
    }
    if (n) {
      const x = t["CFF "], m = x.fonts[0], y = m.charStrings;
      if (y[p]) {
        g.charString = y[p], g.charStringDisassembly = fa(y[p]);
        const w = x.globalSubrs || [], S = m.localSubrs || [], _ = Jn(
          y[p],
          w,
          S
        );
        _.contours.length > 0 && (g.contours = _.contours);
      }
    }
    h.push(g);
  }
  return h;
}
function Tl(t, e) {
  const n = Dl(t, e), o = Ml(t, e);
  if (n.length === 0) return o;
  if (o.length === 0) return n;
  const s = /* @__PURE__ */ new Map();
  for (const r of n)
    s.set(`${r.left}\0${r.right}`, r);
  for (const r of o) {
    const i = `${r.left}\0${r.right}`;
    s.has(i) || s.set(i, r);
  }
  return Array.from(s.values());
}
function Dl(t, e) {
  const n = t.GPOS;
  if (!n || n._raw || !n.featureList || !n.lookupList) return [];
  const o = /* @__PURE__ */ new Set();
  for (const r of n.featureList.featureRecords)
    if (r.featureTag === "kern")
      for (const i of r.feature.lookupListIndices)
        o.add(i);
  if (o.size === 0) return [];
  const s = [];
  for (const r of o) {
    const i = n.lookupList.lookups[r];
    if (!(!i || i.lookupType !== 2))
      for (const a of i.subtables)
        a.format === 1 ? Fl(a, e, s) : a.format === 2 && Rl(a, e, s);
  }
  return s;
}
function Fl(t, e, n) {
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
function Rl(t, e, n) {
  const o = Zs(t.classDef1, e.length), s = Zs(t.classDef2, e.length), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map(), a = new Set(Ot(t.coverage));
  for (let c = 0; c < e.length; c++) {
    if (a.has(c)) {
      const l = o.get(c) ?? 0;
      r.has(l) || r.set(l, []), r.get(l).push(c);
    }
    const f = s.get(c) ?? 0;
    i.has(f) || i.set(f, []), i.get(f).push(c);
  }
  for (let c = 0; c < t.class1Count; c++) {
    const f = r.get(c);
    if (f)
      for (let l = 0; l < t.class2Count; l++) {
        const h = t.class1Records[c]?.[l]?.value1?.xAdvance;
        if (h === void 0 || h === 0) continue;
        const p = i.get(l);
        if (p)
          for (const g of f) {
            const d = e[g]?.name || `glyph${g}`;
            for (const x of p) {
              const m = e[x]?.name || `glyph${x}`;
              n.push({ left: d, right: m, value: h });
            }
          }
      }
  }
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
function Zs(t, e) {
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
function Ml(t, e) {
  const n = t.kern;
  if (!n || n._raw || !n.subtables) return [];
  const o = [];
  for (const s of n.subtables)
    if (!s._raw)
      if (s.format === 0 && s.pairs)
        for (const r of s.pairs) {
          const i = e[r.left]?.name || `glyph${r.left}`, a = e[r.right]?.name || `glyph${r.right}`;
          o.push({
            left: i,
            right: a,
            value: r.value
          });
        }
      else s.format === 2 && s.values ? Ll(s, e, o) : s.format === 3 && s.kernValues ? Bl(s, e, o) : s.format === 1 && s.states && Vl(s, e, o);
  return o;
}
function Ll(t, e, n) {
  const {
    leftClassTable: o,
    rightClassTable: s,
    rowWidth: r,
    kerningArrayOffset: i,
    values: a
  } = t;
  if (!a) return;
  const c = r > 0 ? r / 2 : 0, f = /* @__PURE__ */ new Map();
  for (let u = 0; u < o.nGlyphs; u++) {
    const h = o.firstGlyph + u, p = o.offsets[u] || 0, g = r > 0 ? Math.floor((p - i) / r) : 0;
    g >= 0 && g < a.length && f.set(h, g);
  }
  const l = /* @__PURE__ */ new Map();
  for (let u = 0; u < s.nGlyphs; u++) {
    const h = s.firstGlyph + u, p = s.offsets[u] || 0, g = Math.floor(p / 2);
    g >= 0 && g < c && l.set(h, g);
  }
  for (const [u, h] of f) {
    const p = a[h];
    if (!p) continue;
    const g = e[u]?.name || `glyph${u}`;
    for (const [d, x] of l) {
      const m = p[x];
      if (m === 0) continue;
      const y = e[d]?.name || `glyph${d}`;
      n.push({ left: g, right: y, value: m });
    }
  }
}
function Bl(t, e, n) {
  const {
    glyphCount: o,
    leftClassCount: s,
    rightClassCount: r,
    kernValues: i,
    leftClasses: a,
    rightClasses: c,
    kernIndices: f
  } = t, l = Math.min(o, e.length);
  for (let u = 0; u < l; u++) {
    const h = a[u];
    if (h >= s) continue;
    const p = e[u]?.name || `glyph${u}`;
    for (let g = 0; g < l; g++) {
      const d = c[g];
      if (d >= r) continue;
      const x = h * r + d, m = f[x];
      if (m === void 0 || m >= i.length) continue;
      const y = i[m];
      if (y === 0) continue;
      const w = e[g]?.name || `glyph${g}`;
      n.push({ left: p, right: w, value: y });
    }
  }
}
function Vl(t, e, n) {
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
        const p = $l(
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
function $l(t, e, n, o, s, r, i, a) {
  let c = 0, f = 0;
  const l = [], u = [t, e];
  for (const h of u) {
    const p = n.get(h) ?? 1;
    if (p >= i || c >= o.length) break;
    const g = o[c][p];
    if (g === void 0 || g >= s.length) break;
    const d = s[g], x = (d.flags & 32768) !== 0, m = d.flags & 16383;
    if (x && l.push(h), m > 0 && l.length > 0) {
      const w = Math.floor((m - (r._offset || 0)) / 2);
      for (let S = 0; S < l.length; S++) {
        const _ = w + S;
        if (_ >= 0 && _ < r.length) {
          const b = r[_], A = (b & 1) !== 0;
          if (f += A ? b & -2 : b, A) break;
        }
      }
      l.length = 0;
    }
    const y = d.newStateOffset;
    c = i > 0 ? Math.floor((y - a) / i) : 0, (c < 0 || c >= o.length) && (c = 0);
  }
  return f;
}
function Nl(t) {
  const e = t.fvar;
  return !e || e._raw || !e.axes ? [] : e.axes.map((n) => ({
    tag: n.axisTag,
    name: _e(t.name, n.axisNameID) || n.axisTag,
    min: n.minValue,
    default: n.defaultValue,
    max: n.maxValue,
    hidden: (n.flags & 1) !== 0
  }));
}
function Gl(t) {
  const e = t.fvar;
  if (!e || e._raw || !e.instances) return [];
  const n = e.axes;
  return e.instances.map((o) => {
    const s = {};
    for (let i = 0; i < n.length; i++)
      s[n[i].axisTag] = o.coordinates[i];
    const r = {
      name: _e(t.name, o.subfamilyNameID) || `Instance ${o.subfamilyNameID}`,
      coordinates: s
    };
    if (o.postScriptNameID !== void 0) {
      const i = _e(t.name, o.postScriptNameID);
      i && (r.postScriptName = i);
    }
    return r;
  });
}
const la = {
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
}, Pl = Object.fromEntries(
  Object.entries(la).map(([t, e]) => [e, t])
);
function Ul(t) {
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
function zl(t) {
  const e = t.STAT, n = t.fvar;
  if (!e || e._raw) return null;
  const o = e.designAxes || [], s = n?.axes || [], r = {};
  return e.elidedFallbackNameID !== void 0 && (r.elidedFallbackName = _e(t.name, e.elidedFallbackNameID) || "Regular"), e.axisValues && e.axisValues.length > 0 && (r.values = e.axisValues.map((i) => {
    const a = (l) => l < o.length ? o[l].axisTag : l < s.length ? s[l].axisTag : `axis${l}`, f = { name: _e(t.name, i.valueNameID) || "", flags: i.flags };
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
function Hl(t) {
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
    const f = la[c.valueTag] || c.valueTag, l = c.deltaSetOuterIndex, u = c.deltaSetInnerIndex, h = o.itemVariationData[l];
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
const ua = Date.UTC(1904, 0, 1, 0, 0, 0);
function Xs(t) {
  if (t == null) return;
  const e = typeof t == "bigint" ? t : BigInt(t);
  if (e === 0n) return;
  const n = Number(e) * 1e3 + ua;
  if (!(!Number.isFinite(n) || n < -864e13 || n > 864e13))
    return new Date(n).toISOString();
}
function qs(t) {
  if (!t) return 0n;
  const e = Date.parse(t);
  return isNaN(e) ? 0n : BigInt(Math.floor((e - ua) / 1e3));
}
const Wl = /* @__PURE__ */ new Set([1, 2, 3, 4, 8]);
function jl(t, e) {
  const n = [], o = [];
  if (!t.featureList || !t.lookupList)
    return { substitutions: n, rawLookups: o };
  const s = Yl(t), r = t.lookupList.lookups, i = /* @__PURE__ */ new Set();
  for (let a = 0; a < r.length; a++) {
    const c = r[a];
    if (c && Wl.has(c.lookupType)) {
      const f = s.lookupToFeatures.get(a) || [], l = Zl(f);
      for (const u of l) {
        const h = Js(
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
        const u = Js(
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
function Yl(t) {
  const e = /* @__PURE__ */ new Map(), n = t.scriptList?.scriptRecords || [], o = t.featureList?.featureRecords || [];
  for (const s of n) {
    const r = s.scriptTag, i = s.script;
    i.defaultLangSys && Ks(
      i.defaultLangSys,
      r,
      null,
      o,
      e
    );
    for (const a of i.langSysRecords || [])
      Ks(
        a.langSys,
        r,
        a.langSysTag,
        o,
        e
      );
  }
  return { lookupToFeatures: e };
}
function Zl(t) {
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
function Ks(t, e, n, o, s) {
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
function Js(t, e, n, o, s, r) {
  const i = [], a = { feature: n, script: o, language: s };
  r && (a.allScripts = r);
  for (const c of t.subtables || [])
    switch (t.lookupType) {
      case 1:
        Xl(c, e, a, i);
        break;
      case 2:
        ql(c, e, a, i);
        break;
      case 3:
        Kl(c, e, a, i);
        break;
      case 4:
        Jl(c, e, a, i);
        break;
      case 8:
        Ql(c, e, a, i);
        break;
    }
  return i;
}
function Q(t, e) {
  return t[e]?.name || `glyph${e}`;
}
function Xl(t, e, n, o) {
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
function ql(t, e, n, o) {
  const s = Ot(t.coverage);
  for (let r = 0; r < s.length; r++)
    o.push({
      type: "multiple",
      ...n,
      from: Q(e, s[r]),
      to: (t.sequences[r] || []).map((i) => Q(e, i))
    });
}
function Kl(t, e, n, o) {
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
function Jl(t, e, n, o) {
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
function Ql(t, e, n, o) {
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
function tu(t) {
  const e = t.CPAL;
  return !e || e._raw || !e.palettes ? null : e.palettes.map(
    (n) => n.map((o) => _s(o))
  );
}
function eu(t, e) {
  const n = t.COLR;
  if (!n || n._raw) return null;
  const o = Wf(e), s = [];
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
function Qs(t) {
  const { font: e, glyphs: n } = t, o = n.some((f) => f.charString), s = nu(n, e), r = {};
  r.head = su(e, s), r.hhea = ru(e, s, n.length), r.maxp = iu(n, o), r["OS/2"] = au(e, s), r.name = cu(e), r.post = lu(e, n, o), r.cmap = uu(n), r.hmtx = pu(n), o ? r["CFF "] = _u(e, n) : (r.glyf = yu(n), r.loca = { offsets: [] }), n.some((f) => f.advanceHeight !== void 0) && (r.vhea = du(n), r.vmtx = mu(n));
  const a = t._options?.kerningFormat || "gpos";
  if (t.kerning && t.kerning.length > 0) {
    const f = a === "gpos" || a === "gpos+kern", l = a !== "gpos";
    if (f) {
      const u = t.features?.GPOS, h = u?.scriptList?.scriptRecords && u?.featureList?.featureRecords && u?.lookupList?.lookups;
      let p;
      h ? p = vu(u, t.kerning, n) : p = ma(t.kerning, n), p && (r.GPOS = p);
    }
    if (l) {
      const u = bu(
        t.kerning,
        n,
        a
      );
      u && (r.kern = u);
    }
  }
  if (t.axes && t.axes.length > 0 && (r.fvar = Ou(t, r.name), t.axisMapping && (r.avar = Tu(t)), t.axisStyles ? r.STAT = Eu(t, r.name) : t.tables?.STAT || (r.STAT = ku(t, r.name)), t.metricVariations && (r.MVAR = Du(t))), t.gasp && (r.gasp = {
    version: 1,
    gaspRanges: t.gasp.map((f) => ({
      rangeMaxPPEM: f.maxPPEM,
      rangeGaspBehavior: f.behavior
    }))
  }), t.cvt && (r["cvt "] = { values: t.cvt }), t.fpgm && (r.fpgm = { instructions: t.fpgm }), t.prep && (r.prep = { instructions: t.prep }), t.features && (t.features.GPOS && !r.GPOS && (r.GPOS = t.features.GPOS), t.features.GDEF && (r.GDEF = t.features.GDEF)), t.substitutions && t.substitutions.length > 0 ? r.GSUB = Ru(
    t.substitutions,
    t._rawGSUBLookups || [],
    n
  ) : t._rawGSUBLookups && t._rawGSUBLookups.length > 0 && (r.GSUB = Mu(t._rawGSUBLookups)), t.features?.GSUB && !r.GSUB && (r.GSUB = t.features.GSUB), t.palettes && t.palettes.length > 0 && (r.CPAL = zu(t.palettes)), t.colorGlyphs && t.colorGlyphs.length > 0 && (r.COLR = Hu(t.colorGlyphs, n)), t.tables)
    for (const [f, l] of Object.entries(t.tables))
      r[f] || (r[f] = l);
  let c;
  if (t._header)
    c = { ...t._header, numTables: Object.keys(r).length };
  else {
    const f = Object.keys(r).length, l = Math.floor(Math.log2(f)), u = Math.pow(2, l) * 16, h = f * 16 - u;
    c = {
      sfVersion: o ? 1330926671 : 65536,
      numTables: f,
      searchRange: u,
      entrySelector: l,
      rangeShift: h
    };
  }
  return { header: c, tables: r };
}
function nu(t, e) {
  let n = 1 / 0, o = 1 / 0, s = -1 / 0, r = -1 / 0, i = 0, a = 0, c = 1 / 0, f = 1 / 0, l = -1 / 0, u = 65535, h = 0;
  const p = /* @__PURE__ */ new Set();
  for (const x of t) {
    const m = x.advanceWidth || 0;
    a += m, m > i && (i = m);
    const y = Qn(x);
    if (y) {
      y.xMin < n && (n = y.xMin), y.yMin < o && (o = y.yMin), y.xMax > s && (s = y.xMax), y.yMax > r && (r = y.yMax);
      const S = x.leftSideBearing ?? y.xMin, _ = m - (S + (y.xMax - y.xMin)), b = S + (y.xMax - y.xMin);
      S < c && (c = S), _ < f && (f = _), b > l && (l = b);
    }
    const w = x.unicodes || (x.unicode ? [x.unicode] : []);
    for (const S of w)
      S < u && (u = S), S > h && (h = S), p.add(S);
  }
  n === 1 / 0 && (n = 0), o === 1 / 0 && (o = 0), s === -1 / 0 && (s = 0), r === -1 / 0 && (r = 0), c === 1 / 0 && (c = 0), f === 1 / 0 && (f = 0), l === -1 / 0 && (l = 0), u === 65535 && (u = 0), h === 0 && (h = 0);
  const g = tr(
    t,
    "xyvw",
    e.ascender ? Math.round(e.ascender / 2) : 0
  ), d = tr(
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
function Qn(t) {
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
function tr(t, e, n) {
  for (const o of e) {
    const s = o.charCodeAt(0), r = t.find((i) => (i.unicodes || (i.unicode ? [i.unicode] : [])).includes(s));
    if (r) {
      const i = Qn(r);
      if (i) return i.yMax;
    }
  }
  return n || 0;
}
function ou(t) {
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
function su(t, e) {
  const n = (t.weightClass || 400) >= 700, o = (t.italicAngle || 0) !== 0;
  let s = 0;
  return n && (s |= 1), o && (s |= 2), {
    majorVersion: 1,
    minorVersion: 0,
    fontRevision: 1,
    checksumAdjustment: 0,
    // will be overwritten by export
    magicNumber: 1594834165,
    flags: 11,
    // baseline at y=0, lsb at x=0, instructions may alter advance
    unitsPerEm: t.unitsPerEm,
    created: qs(t.created),
    modified: qs(t.modified),
    xMin: e.xMin,
    yMin: e.yMin,
    xMax: e.xMax,
    yMax: e.yMax,
    macStyle: s,
    lowestRecPPEM: 8,
    fontDirectionHint: 2,
    indexToLocFormat: 0,
    // coordinated by export.js for glyf/loca
    glyphDataFormat: 0
  };
}
function ru(t, e, n) {
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
function iu(t, e) {
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
function au(t, e) {
  const n = (t.weightClass || 400) >= 700, o = (t.italicAngle || 0) !== 0;
  let s = t.fsSelection;
  s === void 0 && (s = 0, n && (s |= 32), o && (s |= 1), !n && !o && (s |= 64), s |= 128);
  const r = ou(e.unicodeRanges), i = e.unicodeRanges.has(32);
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
    ulUnicodeRange1: r[0],
    ulUnicodeRange2: r[1],
    ulUnicodeRange3: r[2],
    ulUnicodeRange4: r[3],
    achVendID: t.achVendID || "XXXX",
    fsSelection: s,
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
    usDefaultChar: i ? 32 : 0,
    usBreakChar: i ? 32 : 0,
    usMaxContext: 0
  };
}
function cu(t) {
  const e = [], n = {
    0: t.copyright || "",
    1: t.familyName || "",
    2: t.styleName || "",
    3: t.uniqueID || fu(t),
    4: t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim(),
    5: t.version || "Version 1.000",
    6: t.postScriptName || ha(t),
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
function fu(t) {
  const e = t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim();
  return t.manufacturer ? `${t.manufacturer}: ${e}` : e;
}
function ha(t) {
  const e = (t.familyName || "").replace(/\s/g, ""), n = t.styleName || "Regular";
  return `${e}-${n}`;
}
function lu(t, e, n = !1) {
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
function uu(t) {
  const e = /* @__PURE__ */ new Map();
  let n = !1;
  for (let a = 0; a < t.length; a++) {
    const c = t[a], f = c.unicodes || (c.unicode != null ? [c.unicode] : []);
    for (const l of f)
      e.has(l) || e.set(l, a), l > 65535 && (n = !0);
  }
  const o = [...e.entries()].sort((a, c) => a[0] - c[0]), s = [], r = [];
  if (n) {
    const a = hu(o);
    s.push({ format: 12, language: 0, groups: a }), r.push({ platformID: 3, encodingID: 10, subtableIndex: 0 }), r.push({ platformID: 0, encodingID: 4, subtableIndex: 0 });
  }
  const i = o.filter(([a]) => a <= 65535);
  if (i.length > 0) {
    const { segments: a, glyphIdArray: c } = gu(i), f = s.length;
    s.push({ format: 4, language: 0, segments: a, glyphIdArray: c }), r.push({ platformID: 3, encodingID: 1, subtableIndex: f }), r.push({ platformID: 0, encodingID: 3, subtableIndex: f });
  }
  return { version: 0, encodingRecords: r, subtables: s };
}
function hu(t) {
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
function gu(t) {
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
function pu(t) {
  return { hMetrics: t.map((n) => ({
    advanceWidth: n.advanceWidth || 0,
    lsb: n.leftSideBearing ?? 0
  })), leftSideBearings: [] };
}
function du(t) {
  let e = 0, n = 1 / 0, o = 1 / 0, s = -1 / 0;
  for (const r of t) {
    const i = r.advanceHeight || 0;
    i > e && (e = i);
    const a = Qn(r);
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
function mu(t) {
  return { vMetrics: t.map((n) => ({
    advanceHeight: n.advanceHeight || 0,
    topSideBearing: n.topSideBearing ?? 0
  })), topSideBearings: [] };
}
function yu(t) {
  return { glyphs: t.map((n) => {
    if (n.contours && n.contours.length > 0) {
      const o = Qn(n);
      return {
        type: "simple",
        xMin: o ? o.xMin : 0,
        yMin: o ? o.yMin : 0,
        xMax: o ? o.xMax : 0,
        yMax: o ? o.yMax : 0,
        contours: n.contours,
        instructions: n.instructions || [],
        overlapSimple: !1
      };
    }
    return n.components && n.components.length > 0 ? {
      type: "composite",
      xMin: 0,
      yMin: 0,
      xMax: 0,
      yMax: 0,
      components: n.components,
      instructions: n.instructions || []
    } : null;
  }) };
}
function xu(t) {
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
function ga(t, e, n = {}) {
  if (!Number.isFinite(e)) return t;
  const {
    globalSubrs: o = [],
    localSubrs: s = [],
    nominalWidthX: r = 0,
    defaultWidthX: i = 0
  } = n;
  if (!Su(t)) return t;
  let a = null;
  try {
    a = Jn(t, o, s);
  } catch {
    return t;
  }
  if (a.width !== null && a.width !== void 0 || !a.contours || a.contours.length === 0 || e === i) return t;
  const c = xu(e - r), f = new Array(c.length + t.length);
  for (let l = 0; l < c.length; l++) f[l] = c[l];
  for (let l = 0; l < t.length; l++)
    f[c.length + l] = t[l];
  return f;
}
function Su(t) {
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
function _u(t, e) {
  const n = t.postScriptName || ha(t), o = e.slice(1).map((p) => p.name || ".notdef"), s = e.map((p) => {
    const g = Number.isFinite(p.advanceWidth) ? p.advanceWidth : void 0;
    return p.charString && p.charString.length > 0 ? ga(p.charString, g) : Ze(p.contours || [], g);
  }), r = [];
  function i(p) {
    const g = 391 + r.length;
    return r.push(p), g;
  }
  const a = t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim(), c = t.familyName || "", f = wu(t.weightClass), l = o.map((p) => i(p)), u = t.unitsPerEm || 1e3, h = {
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
function wu(t) {
  return !t || t <= 400 ? "Regular" : t <= 500 ? "Medium" : t <= 600 ? "SemiBold" : t <= 700 ? "Bold" : t <= 800 ? "ExtraBold" : "Black";
}
function er(t, e) {
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
function fn(t, e) {
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
function bu(t, e, n) {
  switch (n) {
    case "kern-ot-f0":
    case "gpos+kern":
      return er(t, e);
    case "kern-ot-f2":
      return Au(t, e);
    case "kern-apple-f0":
      return pa(t, e);
    case "kern-apple-f3":
      return Cu(t, e);
    default:
      return er(t, e);
  }
}
function Au(t, e) {
  const { pairs: n } = fn(t, e);
  if (n.length === 0) return null;
  const {
    leftClasses: o,
    rightClasses: s,
    valueMatrix: r,
    leftGlyphToClass: i,
    rightGlyphToClass: a
  } = da(n), c = o.length, f = s.length, l = f * 2, u = 8, h = Array.from(i.keys()).sort((O, I) => O - I), p = Array.from(a.keys()).sort(
    (O, I) => O - I
  ), g = h.length > 0 ? h[0] : 0, d = h.length > 0 ? h[h.length - 1] - g + 1 : 0, x = p.length > 0 ? p[0] : 0, m = p.length > 0 ? p[p.length - 1] - x + 1 : 0, y = 4 + d * 2, w = 4 + m * 2, S = u, _ = S + y, b = _ + w, A = [];
  for (let O = 0; O < d; O++) {
    const I = g + O, E = i.get(I) ?? 0;
    A.push(b + E * l);
  }
  const k = [];
  for (let O = 0; O < m; O++) {
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
        leftOffsetTable: S,
        rightOffsetTable: _,
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
function pa(t, e) {
  const { pairs: n } = fn(t, e);
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
function Cu(t, e) {
  const { pairs: n } = fn(t, e);
  if (n.length === 0) return null;
  const {
    leftClasses: o,
    rightClasses: s,
    valueMatrix: r,
    leftGlyphToClass: i,
    rightGlyphToClass: a
  } = da(n), c = o.length, f = s.length, l = /* @__PURE__ */ new Set();
  l.add(0);
  for (const m of r)
    for (const y of m)
      l.add(y);
  if (c > 255 || f > 255 || l.size > 255)
    return pa(t, e);
  const u = Array.from(l).sort((m, y) => m - y), h = /* @__PURE__ */ new Map();
  for (let m = 0; m < u.length; m++)
    h.set(u[m], m);
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
function da(t) {
  const e = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Set();
  for (const { left: m, right: y, value: w } of t)
    e.has(m) || e.set(m, /* @__PURE__ */ new Map()), e.get(m).set(y, w), n.add(y);
  const o = /* @__PURE__ */ new Map();
  for (const [m, y] of e) {
    const w = Array.from(y.entries()).sort((S, _) => S[0] - _[0]);
    o.set(m, w.map((S) => `${S[0]}:${S[1]}`).join(","));
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
    const w = Array.from(y.entries()).sort((S, _) => S[0] - _[0]);
    c.set(m, w.map((S) => `${S[0]}:${S[1]}`).join(","));
  }
  const f = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Map();
  let u = 1;
  for (const [m, y] of c)
    f.has(y) || f.set(y, u++), l.set(m, f.get(y));
  const h = i, p = u, g = [];
  for (let m = 0; m < h; m++)
    g.push(new Array(p).fill(0));
  for (const { left: m, right: y, value: w } of t) {
    const S = r.get(m) ?? 0, _ = l.get(y) ?? 0;
    g[S][_] = w;
  }
  const d = Array.from({ length: h }, (m, y) => y), x = Array.from({ length: p }, (m, y) => y);
  return {
    leftClasses: d,
    rightClasses: x,
    valueMatrix: g,
    leftGlyphToClass: r,
    rightGlyphToClass: l
  };
}
function ma(t, e) {
  const { pairs: n } = fn(t, e);
  if (n.length === 0) return null;
  const o = ya(n);
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
            lookupListIndices: [0]
          }
        }
      ]
    },
    lookupList: {
      lookups: [o]
    }
  };
}
function vu(t, e, n) {
  const { pairs: o } = fn(e, n), s = JSON.parse(JSON.stringify(t));
  if (!s.scriptList?.scriptRecords || !s.featureList?.featureRecords || !s.lookupList?.lookups)
    return ma(e, n);
  if (o.length === 0) return s;
  const r = ya(o), i = /* @__PURE__ */ new Set();
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
      Iu(s, l);
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
function Iu(t, e) {
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
function ya(t) {
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
function Ou(t, e) {
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
function ku(t, e) {
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
function Eu(t, e) {
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
function Tu(t) {
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
function Du(t) {
  const { axes: e, metricVariations: n } = t, { regions: o, metrics: s } = n, r = {};
  for (let g = 0; g < e.length; g++)
    r[e[g].tag] = g;
  const i = o.map((g) => {
    const d = [];
    for (let x = 0; x < e.length; x++) {
      const m = e[x].tag;
      if (g.axes[m]) {
        const [y, w, S] = g.axes[m];
        d.push({ startCoord: y, peakCoord: w, endCoord: S });
      } else
        d.push({ startCoord: 0, peakCoord: 0, endCoord: 0 });
    }
    return { regionAxes: d };
  }), a = /* @__PURE__ */ new Set();
  for (const g of Object.values(s))
    for (const d of g)
      a.add(d.region);
  const c = [...a].sort((g, d) => g - d), f = /* @__PURE__ */ new Map();
  for (let g = 0; g < c.length; g++)
    f.set(c[g], g);
  const l = Object.entries(s), u = [], h = [];
  for (const [g, d] of l) {
    const x = Pl[g] || g, m = new Array(c.length).fill(0);
    for (const y of d) {
      const w = f.get(y.region);
      w !== void 0 && (m[w] = y.delta);
    }
    u.push(m), h.push({
      valueTag: x,
      deltaSetOuterIndex: 0,
      deltaSetInnerIndex: u.length - 1
    });
  }
  let p = 0;
  for (let g = 0; g < c.length; g++) {
    let d = !1;
    for (const x of u)
      if (x[g] < -128 || x[g] > 127) {
        d = !0;
        break;
      }
    d && p++;
  }
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
          itemCount: u.length,
          wordDeltaCount: p,
          regionIndexes: c,
          deltaSets: u
        }
      ]
    }
  };
}
function Fu(t) {
  const e = /* @__PURE__ */ new Map();
  for (let n = 0; n < t.length; n++)
    t[n].name && e.set(t[n].name, n);
  return e;
}
function rt(t, e, n) {
  if (typeof t == "string" && n.has(t))
    return n.get(t);
  const o = Rt(e, t);
  if (o !== void 0)
    return n.get(o);
}
function Ru(t, e, n) {
  const o = Fu(n), s = [], r = /* @__PURE__ */ new Map(), i = Lu(t);
  for (const [h, p] of i) {
    const [g, d] = h.split("\0"), x = Bu(g, p, n, o);
    if (!x) continue;
    const m = s.length;
    s.push(x), r.has(d) || r.set(d, {
      lookupIndices: /* @__PURE__ */ new Set(),
      scripts: /* @__PURE__ */ new Map()
    });
    const y = r.get(d);
    y.lookupIndices.add(m);
    for (const w of p) {
      const S = w.allScripts || [
        { script: w.script, language: w.language }
      ];
      for (const _ of S) {
        const b = _.script || "DFLT", A = _.language || null;
        y.scripts.has(b) || y.scripts.set(b, /* @__PURE__ */ new Set()), y.scripts.get(b).add(A);
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
      const x = p.script || "DFLT", m = p.language || null;
      d.scripts.has(x) || d.scripts.set(x, /* @__PURE__ */ new Set()), d.scripts.get(x).add(m);
    }
  }
  a.size > 0 && xa(s, a);
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
      const m = l.get(d);
      for (const y of x)
        m.has(y) || m.set(y, /* @__PURE__ */ new Set()), m.get(y).add(g);
    }
  }
  const u = [];
  for (const [h, p] of l) {
    const g = [];
    let d = null;
    for (const [x, m] of p) {
      const y = {
        lookupOrderOffset: 0,
        requiredFeatureIndex: 65535,
        featureIndices: Array.from(m).sort((w, S) => w - S)
      };
      x === null ? d = y : g.push({
        langSysTag: x,
        langSys: y
      });
    }
    if (!d) {
      const x = /* @__PURE__ */ new Set();
      for (const [, m] of p)
        for (const y of m) x.add(y);
      d = {
        lookupOrderOffset: 0,
        requiredFeatureIndex: 65535,
        featureIndices: Array.from(x).sort((m, y) => m - y)
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
function Mu(t) {
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
  o.size > 0 && xa(e, o);
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
function Lu(t) {
  const e = /* @__PURE__ */ new Map();
  for (const n of t) {
    const o = `${n.type}\0${n.feature}`;
    e.has(o) || e.set(o, []), e.get(o).push(n);
  }
  return e;
}
function Bu(t, e, n, o) {
  switch (t) {
    case "single":
      return Vu(e, n, o);
    case "multiple":
      return $u(e, n, o);
    case "alternate":
      return Nu(e, n, o);
    case "ligature":
      return Gu(e, n, o);
    case "reverse":
      return Pu(e, n, o);
    default:
      return null;
  }
}
function Vu(t, e, n) {
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
function $u(t, e, n) {
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
function Nu(t, e, n) {
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
function Gu(t, e, n) {
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
function Pu(t, e, n) {
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
function xa(t, e) {
  for (const n of t)
    if (!(!n || !n.subtables) && !(n.lookupType !== 5 && n.lookupType !== 6))
      for (const o of n.subtables)
        Uu(o, e);
}
function Uu(t, e) {
  if (t.ruleSets) {
    for (const n of t.ruleSets)
      if (n)
        for (const o of n)
          Re(o.seqLookupRecords, e);
  }
  if (t.classSets) {
    for (const n of t.classSets)
      if (n)
        for (const o of n)
          Re(o.seqLookupRecords, e);
  }
  if (t.seqLookupRecords && Re(t.seqLookupRecords, e), t.chainedRuleSets) {
    for (const n of t.chainedRuleSets)
      if (n)
        for (const o of n)
          Re(o.seqLookupRecords, e);
  }
  if (t.chainedClassSets) {
    for (const n of t.chainedClassSets)
      if (n)
        for (const o of n)
          Re(o.seqLookupRecords, e);
  }
}
function Re(t, e) {
  if (t)
    for (const n of t) {
      const o = e.get(n.lookupListIndex);
      o !== void 0 && (n.lookupListIndex = o);
    }
}
function zu(t) {
  if (!t || t.length === 0) return null;
  const e = t[0].length, n = t.map(
    (o) => o.map((s) => Ss(s))
  );
  return {
    version: 0,
    numPaletteEntries: e,
    palettes: n
  };
}
function Hu(t, e) {
  if (!t || t.length === 0) return null;
  const n = jf(e), o = (h) => n.get(h) ?? 0, s = t.some((h) => h.paint), r = t.filter((h) => h.layers), i = [], a = [], c = r.map((h) => ({ ...h, glyphID: o(h.name) })).sort((h, p) => h.glyphID - p.glyphID);
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
function Wu(t, e, n = !0) {
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
  return o === 29 && n ? { value: t[e + 1] << 24 | t[e + 2] << 16 | t[e + 3] << 8 | t[e + 4] | 0, bytesConsumed: 5 } : o === 30 && n ? ju(t, e + 1) : o === 255 && !n ? { value: (t[e + 1] << 24 | t[e + 2] << 16 | t[e + 3] << 8 | t[e + 4] | 0) / 65536, bytesConsumed: 5 } : null;
}
function ju(t, e) {
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
function Sa(t) {
  return Number.isInteger(t) ? Yu(t) : Zu(t);
}
function Yu(t) {
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
function Zu(t) {
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
function Xu(t) {
  return t <= 27;
}
function Yt(t, e = 0, n = t.length) {
  const o = [], s = [];
  let r = e;
  for (; r < n; ) {
    const i = t[r];
    if (Xu(i)) {
      let a;
      i === 12 ? (a = 3072 | t[r + 1], r += 2) : (a = i, r += 1), o.push({ operator: a, operands: [...s] }), s.length = 0;
    } else {
      const a = Wu(t, r, !0);
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
const Po = {
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
  Object.entries(Po).map(([t, e]) => [e, Number(t)])
), Uo = {
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
}, nr = Object.fromEntries(
  Object.entries(Uo).map(([t, e]) => [e, Number(t)])
), zo = {
  17: "CharStrings",
  24: "VariationStore",
  3079: "FontMatrix",
  3108: "FDArray",
  3109: "FDSelect"
}, fe = Object.fromEntries(
  Object.entries(zo).map(([t, e]) => [e, Number(t)])
), _a = {
  18: "Private"
}, wa = {
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
function Zt(t, e) {
  const n = {};
  for (const { operator: o, operands: s } of t) {
    const r = e[o] || `op_${o}`;
    n[r] = s.length === 1 ? s[0] : s;
  }
  return n;
}
function we(t, e) {
  const n = [];
  for (const [o, s] of Object.entries(t)) {
    const r = e[o];
    if (r === void 0) continue;
    const i = Array.isArray(s) ? s : [s];
    n.push({ operator: r, operands: i });
  }
  return n;
}
function ba(t, e, n) {
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
function Aa(t) {
  const e = [0];
  for (const n of t)
    e.push(n);
  return e;
}
function qu(t, e, n) {
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
function Ku(t) {
  if (typeof t == "string")
    return [];
  const e = [0];
  for (const n of t)
    e.push(n >> 8 & 255, n & 255);
  return e;
}
function Ju(t, e) {
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
const Ca = /* @__PURE__ */ new Set([
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
]), or = /* @__PURE__ */ new Set([
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
      ) : n.push(...Sa(i));
    o >= 3072 ? n.push(12, o & 255) : n.push(o);
  }
  return n;
}
function sr(t) {
  const e = [];
  for (let n = 0; n < t.length; n++) e.push(t.charCodeAt(n));
  return e;
}
function rr(t) {
  return String.fromCharCode(...t);
}
function va(t, e) {
  const n = new Uint8Array(t), o = n[0], s = n[1];
  let i = n[2];
  const a = Mt(n, i);
  i += a.totalBytes;
  const c = a.items.map(rr), f = Mt(n, i);
  i += f.totalBytes;
  const l = Mt(n, i);
  i += l.totalBytes;
  const u = l.items.map(rr), p = Mt(n, i).items.map((d) => Array.from(d)), g = f.items.map((d) => Qu(n, d));
  return {
    majorVersion: o,
    minorVersion: s,
    names: c,
    strings: u,
    globalSubrs: p,
    fonts: g
  };
}
function Qu(t, e) {
  const n = Yt(e, 0, e.length), o = Zt(n, Po), s = o.CharStrings, r = o.charset ?? 0, i = o.Encoding ?? 0, a = o.Private;
  delete o.CharStrings, delete o.charset, delete o.Encoding, delete o.Private;
  const c = o.FDArray, f = o.FDSelect;
  delete o.FDArray, delete o.FDSelect;
  let l = [];
  s !== void 0 && (l = Mt(t, s).items.map((_) => Array.from(_)));
  const u = l.length, h = qu(t, r, u), p = Ju(t, i);
  let g = {}, d = [];
  if (Array.isArray(a) && a.length === 2) {
    const [S, _] = a, b = Yt(t, _, _ + S);
    g = Zt(b, Uo), g.Subrs !== void 0 && (d = Mt(t, _ + g.Subrs).items.map((k) => Array.from(k)), delete g.Subrs);
  }
  const x = o.ROS !== void 0;
  let m, y;
  x && (c !== void 0 && (m = Mt(t, c).items.map((_) => {
    const b = Yt(_, 0, _.length), A = Zt(b, Po);
    let k = {}, O = [];
    if (Array.isArray(A.Private) && A.Private.length === 2) {
      const [I, E] = A.Private, T = Yt(t, E, E + I);
      k = Zt(T, Uo), k.Subrs !== void 0 && (O = Mt(t, E + k.Subrs).items.map((F) => Array.from(F)), delete k.Subrs), delete A.Private;
    }
    return {
      fontDict: A,
      privateDict: k,
      localSubrs: O
    };
  })), f !== void 0 && (y = ba(t, f, u)));
  const w = {
    topDict: o,
    charset: h,
    encoding: p,
    charStrings: l,
    privateDict: g,
    localSubrs: d
  };
  return x && (w.isCIDFont = !0, m && (w.fdArray = m), y && (w.fdSelect = y)), w;
}
function Ia(t) {
  const {
    majorVersion: e = 1,
    minorVersion: n = 0,
    names: o = [],
    strings: s = [],
    globalSubrs: r = [],
    fonts: i = []
  } = t, a = [e, n, 4, 4], c = Dt(o.map(sr)), f = Dt(s.map(sr)), l = Dt(
    r.map((w) => new Uint8Array(w))
  ), u = i.map((w) => th(w)), h = i.map(
    (w, S) => ir(
      w,
      u[S],
      /* baseOffset */
      0
    )
  ), p = Dt(h);
  let d = a.length + c.length + p.length + f.length + l.length;
  const x = i.map((w, S) => {
    const _ = ir(w, u[S], d);
    return d += u[S].totalSize, _;
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
    ...l
  ];
  for (const w of u)
    for (const S of w.sections)
      for (let _ = 0; _ < S.length; _++) y.push(S[_]);
  return y;
}
function th(t) {
  const e = [], n = {};
  let o = 0;
  const s = (t.charStrings || []).map((u) => !u || u.length === 0 ? new Uint8Array([14]) : new Uint8Array(u)), r = Dt(s);
  n.charStrings = o, e.push(r), o += r.length;
  const i = t.charset;
  if (typeof i == "string")
    n.charset = i === "ISOAdobe" ? 0 : i === "Expert" ? 1 : 2, n.charsetIsPredefined = !0;
  else {
    const u = Ku(i || []);
    n.charset = o, n.charsetIsPredefined = !1, e.push(u), o += u.length;
  }
  const a = t.encoding;
  if (typeof a == "string")
    n.encoding = a === "Standard" ? 0 : 1, n.encodingIsPredefined = !0;
  else if (a && typeof a == "object") {
    const u = eh(a);
    n.encoding = o, n.encodingIsPredefined = !1, e.push(u), o += u.length;
  } else
    n.encoding = 0, n.encodingIsPredefined = !0;
  const c = we(
    t.privateDict || {},
    nr
  );
  let f = null;
  if (t.localSubrs && t.localSubrs.length > 0 && (f = Dt(t.localSubrs.map((u) => new Uint8Array(u)))), f) {
    const h = En(
      c,
      or
    ).length + 6;
    c.push({
      operator: nr.Subrs,
      operands: [h]
    });
  }
  const l = En(c, or);
  if (n.privateOffset = o, n.privateSize = l.length, e.push(l), o += l.length, f && (e.push(f), o += f.length), t.isCIDFont) {
    if (t.fdSelect) {
      const u = Aa(t.fdSelect);
      n.fdSelect = o, e.push(u), o += u.length;
    }
    if (t.fdArray) {
      const u = t.fdArray.map((p) => {
        const g = we(
          p.fontDict || {},
          gt
        );
        return En(g, Ca);
      }), h = Dt(u);
      n.fdArray = o, e.push(h), o += h.length;
    }
  }
  return { sections: e, totalSize: o, offsets: n };
}
function ir(t, e, n) {
  const o = e.offsets, s = we(
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
  })), En(s, Ca);
}
function eh(t) {
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
class R {
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
const Ho = 32768, Wo = 32767;
function Ut(t) {
  const e = new R(t), n = e.uint16(), o = e.offset32(), s = e.uint16(), r = e.array(
    "offset32",
    s
  ), i = nh(
    e,
    o
  ), a = [];
  for (let c = 0; c < s; c++) {
    const f = r[c];
    f === 0 ? a.push(null) : a.push(oh(e, f));
  }
  return {
    format: n,
    variationRegionList: i,
    itemVariationData: a
  };
}
function nh(t, e) {
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
function oh(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.uint16(), r = t.array("uint16", s), i = (o & Ho) !== 0, a = o & Wo, c = [];
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
    const d = g.regionIndexes.length, x = (g.wordDeltaCount & Ho) !== 0, m = g.wordDeltaCount & Wo, y = 6 + 2 * d, w = x ? 4 : 2, S = x ? 2 : 1, _ = m * w + (d - m) * S, b = y + g.itemCount * _;
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
    const d = g.regionIndexes.length, x = (g.wordDeltaCount & Ho) !== 0, m = g.wordDeltaCount & Wo;
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
function sh(t) {
  const e = ne(t), n = e.length, o = new Uint8Array(2 + n);
  return o[0] = n >> 8 & 255, o[1] = n & 255, o.set(new Uint8Array(e), 2), o;
}
const rh = Object.fromEntries(
  Object.entries(_a).map(([t, e]) => [e, Number(t)])
), ih = Object.fromEntries(
  Object.entries(wa).map(([t, e]) => [e, Number(t)])
), ah = /* @__PURE__ */ new Set([
  17,
  // CharStrings
  24,
  // VariationStore
  3108,
  // FDArray
  3109
  // FDSelect
]), ch = /* @__PURE__ */ new Set([
  18
  // Private  (size + offset)
]), ar = /* @__PURE__ */ new Set([
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
      ) : n.push(...Sa(i));
    o >= 3072 ? n.push(12, o & 255) : n.push(o);
  }
  return n;
}
function fh(t, e) {
  const n = new Uint8Array(t), o = n[0], s = n[1], r = n[2], i = n[3] << 8 | n[4], a = r, c = a + i, f = Yt(n, a, c), l = Zt(f, zo), u = l.CharStrings, h = l.VariationStore, p = l.FDArray, g = l.FDSelect;
  delete l.CharStrings, delete l.VariationStore, delete l.FDArray, delete l.FDSelect;
  const x = dn(n, c).items.map((b) => Array.from(b));
  let m = [];
  u !== void 0 && (m = dn(n, u).items.map((A) => Array.from(A)));
  const y = m.length;
  let w = [];
  p !== void 0 && (w = dn(n, p).items.map((A) => {
    const k = Yt(A, 0, A.length), O = Zt(k, {
      ..._a,
      ...zo
      // Font DICTs can also have FontMatrix
    });
    let I = {}, E = [];
    if (Array.isArray(O.Private) && O.Private.length === 2) {
      const [T, D] = O.Private, F = Yt(n, D, D + T);
      I = Zt(F, wa), I.Subrs !== void 0 && (E = dn(n, D + I.Subrs).items.map((L) => Array.from(L)), delete I.Subrs), delete O.Private;
    }
    return {
      fontDict: O,
      privateDict: I,
      localSubrs: E
    };
  }));
  let S = null;
  g !== void 0 && y > 0 && (S = ba(n, g, y));
  let _ = null;
  if (h !== void 0) {
    const b = n[h] << 8 | n[h + 1];
    _ = Ut(
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
    charStrings: m,
    fontDicts: w,
    fdSelect: S,
    variationStore: _
  };
}
function lh(t) {
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
  ), l = mn(r.map((T) => new Uint8Array(T))), u = a ? Aa(a) : null, h = c ? sh(c) : null, g = cr(o, {
    charStrings: 0,
    fdArray: i.length > 0 ? 0 : void 0,
    fdSelect: a ? 0 : void 0,
    variationStore: c ? 0 : void 0
  }).length, d = 5;
  let m = d + g + f.length;
  const y = m;
  m += l.length;
  let w;
  u && (w = m, m += u.length);
  let S;
  h && (S = m, m += h.length);
  const _ = i.map((T) => {
    const D = we(
      T.privateDict || {},
      ih
    );
    let F = null;
    if (T.localSubrs && T.localSubrs.length > 0 && (F = mn(T.localSubrs.map((L) => new Uint8Array(L)))), F) {
      const H = Tn(D, ar).length + 6;
      D.push({
        operator: 19,
        // Subrs
        operands: [H]
      });
    }
    const M = Tn(D, ar);
    return {
      privBytes: M,
      localSubrBytes: F,
      totalSize: M.length + (F ? F.length : 0)
    };
  }), b = [];
  for (const T of _)
    b.push({ offset: m, size: T.privBytes.length }), m += T.totalSize;
  let A = null, k;
  if (i.length > 0) {
    const T = i.map((D, F) => {
      const M = we(D.fontDict || {}, {
        ...rh,
        ...fe
      });
      return M.push({
        operator: 18,
        // Private
        operands: [b[F].size, b[F].offset]
      }), Tn(M, ch);
    });
    A = mn(T), k = m, m += A.length;
  }
  const O = cr(o, {
    charStrings: y,
    fdArray: k,
    fdSelect: w,
    variationStore: S
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
  for (const T of _) {
    for (let D = 0; D < T.privBytes.length; D++) E.push(T.privBytes[D]);
    if (T.localSubrBytes)
      for (let D = 0; D < T.localSubrBytes.length; D++)
        E.push(T.localSubrBytes[D]);
  }
  if (A)
    for (let T = 0; T < A.length; T++) E.push(A[T]);
  return E;
}
function cr(t, e) {
  const n = we(t, fe);
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
  }), Tn(n, ah);
}
const uh = 8, hh = 4;
function gh(t) {
  const e = new R(t), n = e.uint16(), o = e.uint16(), s = e.int16(), r = e.uint16(), i = [];
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
function ph(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.defaultVertOriginY ?? 0, s = t.vertOriginYMetrics ?? [], r = t.numVertOriginYMetrics ?? s.length, i = s.slice(0, r);
  for (; i.length < r; )
    i.push({ glyphIndex: 0, vertOriginY: o });
  const a = new v(
    uh + r * hh
  );
  a.uint16(e), a.uint16(n), a.int16(o), a.uint16(r);
  for (const c of i)
    a.uint16(c.glyphIndex ?? 0), a.int16(c.vertOriginY ?? o);
  return a.toArray();
}
const dh = 8;
function mh(t) {
  const e = new R(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = [];
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
function yh(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.reserved ?? 0, s = t.segmentMaps ?? [];
  let r = dh;
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
function be(t, e) {
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
    const x = t.uint16(), m = Math.min(h, c - d * h);
    for (let y = 0; y < m; y++) {
      const w = 16 - f * (y + 1);
      let S = x >> w & l;
      S >= u && (S -= u * 2), g.push(S);
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
function Oa(t, e) {
  t.seek(e);
  const n = t.uint16(), o = [];
  for (let r = 0; r < n; r++)
    o.push({
      scriptTag: t.tag(),
      scriptOffset: t.uint16()
    });
  return { scriptRecords: o.map((r) => ({
    scriptTag: r.scriptTag,
    script: xh(t, e + r.scriptOffset)
  })) };
}
function xh(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = [];
  for (let a = 0; a < o; a++)
    s.push({
      langSysTag: t.tag(),
      langSysOffset: t.uint16()
    });
  const r = n !== 0 ? fr(t, e + n) : null, i = s.map((a) => ({
    langSysTag: a.langSysTag,
    langSys: fr(t, e + a.langSysOffset)
  }));
  return { defaultLangSys: r, langSysRecords: i };
}
function fr(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.uint16(), r = t.array("uint16", s);
  return { lookupOrderOffset: n, requiredFeatureIndex: o, featureIndices: r };
}
function ka(t) {
  const { scriptRecords: e } = t, n = e.map((a) => Sh(a.script)), o = 2 + e.length * 6, s = [];
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
function Sh(t) {
  const { defaultLangSys: e, langSysRecords: n } = t, o = n.map((l) => lr(l.langSys)), s = e ? lr(e) : null;
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
function lr(t) {
  const e = 6 + t.featureIndices.length * 2, n = new v(e);
  return n.uint16(t.lookupOrderOffset), n.uint16(t.requiredFeatureIndex), n.uint16(t.featureIndices.length), n.array("uint16", t.featureIndices), n.toArray();
}
function Ea(t, e) {
  t.seek(e);
  const n = t.uint16(), o = [];
  for (let r = 0; r < n; r++)
    o.push({
      featureTag: t.tag(),
      featureOffset: t.uint16()
    });
  return { featureRecords: o.map((r) => ({
    featureTag: r.featureTag,
    feature: Ta(t, e + r.featureOffset)
  })) };
}
function Ta(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.array("uint16", o);
  return { featureParamsOffset: n, lookupListIndices: s };
}
function Da(t) {
  const { featureRecords: e } = t, n = e.map((a) => Fa(a.feature)), o = 2 + e.length * 6, s = [];
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
function Fa(t) {
  const e = 4 + t.lookupListIndices.length * 2, n = new v(e);
  return n.uint16(t.featureParamsOffset), n.uint16(t.lookupListIndices.length), n.array("uint16", t.lookupListIndices), n.toArray();
}
function Ra(t, e, n, o) {
  t.seek(e);
  const s = t.uint16();
  return { lookups: t.array("uint16", s).map(
    (a) => _h(t, e + a, n, o)
  ) };
}
function _h(t, e, n, o) {
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
function Ma(t, e, n) {
  const { lookups: o } = t, s = 8, r = o.map((p) => {
    const g = p.subtables.map(
      (d) => e(d, p.lookupType)
    );
    return { ...p, subtableBytes: g };
  }), i = (p) => {
    const { lookupType: g, lookupFlag: d, subtableBytes: x, markFilteringSet: m } = p, y = m !== void 0;
    let S = 6 + x.length * 2 + (y ? 2 : 0);
    const _ = x.map((A) => {
      const k = S;
      return S += A.length, k;
    }), b = new v(S);
    b.uint16(g), b.uint16(d), b.uint16(x.length), b.array("uint16", _), y && b.uint16(m);
    for (let A = 0; A < x.length; A++)
      b.seek(_[A]), b.rawBytes(x[A]);
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
    const p = r.map((y) => {
      const { lookupType: w, lookupFlag: S, subtableBytes: _, markFilteringSet: b } = y, A = b !== void 0;
      let O = 6 + _.length * 2 + (A ? 2 : 0);
      const I = _.map(() => {
        const T = O;
        return O += s, T;
      }), E = new v(O);
      E.uint16(n), E.uint16(S), E.uint16(_.length), E.array("uint16", I), A && E.uint16(b);
      for (let T = 0; T < _.length; T++)
        E.seek(I[T]), E.uint16(1), E.uint16(w), E.uint32(0);
      return {
        compactBytes: E.toArray(),
        subtableOffsets: I,
        innerDataBytes: _
      };
    });
    let g = c;
    const d = p.map((y) => {
      const w = g;
      return g += y.compactBytes.length, w;
    }), x = p.map(
      (y) => y.innerDataBytes.map((w) => {
        const S = g;
        return g += w.length, S;
      })
    ), m = new v(g);
    m.uint16(o.length), m.array("uint16", d);
    for (let y = 0; y < p.length; y++)
      m.seek(d[y]), m.rawBytes(p[y].compactBytes);
    for (let y = 0; y < p.length; y++) {
      const w = p[y];
      for (let S = 0; S < w.innerDataBytes.length; S++) {
        const _ = d[y] + w.subtableOffsets[S], b = x[y][S], A = b - _;
        m.seek(_ + 4), m.uint32(A), m.seek(b), m.rawBytes(w.innerDataBytes[S]);
      }
    }
    return m.toArray();
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
function La(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const o = t.uint16(), s = t.uint16(), r = [];
    for (let c = 0; c < s; c++)
      r.push(t.uint16());
    const i = $(t, e + o), a = r.map(
      (c) => c === 0 ? null : wh(t, e + c)
    );
    return { format: n, coverage: i, seqRuleSets: a };
  }
  if (n === 2) {
    const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = [];
    for (let l = 0; l < r; l++)
      i.push(t.uint16());
    const a = $(t, e + o), c = Vt(t, e + s), f = i.map(
      (l) => l === 0 ? null : bh(t, e + l)
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
function wh(t, e) {
  t.seek(e);
  const n = t.uint16();
  return t.array("uint16", n).map((s) => {
    t.seek(e + s);
    const r = t.uint16(), i = t.uint16(), a = t.array("uint16", r - 1), c = ln(t, i);
    return { glyphCount: r, inputSequence: a, seqLookupRecords: c };
  });
}
function bh(t, e) {
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
function Ba(t) {
  if (t.format === 1) return Ah(t);
  if (t.format === 2) return Ch(t);
  if (t.format === 3) return vh(t);
  throw new Error(`Unknown SequenceContext format: ${t.format}`);
}
function Ah(t) {
  const { coverage: e, seqRuleSets: n } = t, o = G(e), s = n.map(
    (l) => l === null ? null : Va(l)
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
function Ch(t) {
  const { coverage: e, classDef: n, classSeqRuleSets: o } = t, s = G(e), r = $t(n), i = o.map(
    (p) => p === null ? null : Va(p)
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
function vh(t) {
  const { coverages: e, seqLookupRecords: n } = t, o = e.map(G);
  let r = 6 + e.length * 2 + n.length * 4;
  const i = o.map((c) => {
    const f = r;
    return r += c.length, f;
  }), a = new v(r);
  a.uint16(3), a.uint16(e.length), a.uint16(n.length), a.array("uint16", i), to(a, n);
  for (let c = 0; c < o.length; c++)
    a.seek(i[c]), a.rawBytes(o[c]);
  return a.toArray();
}
function Va(t) {
  const e = t.map(Ih);
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
function Ih(t) {
  const { glyphCount: e, inputSequence: n, seqLookupRecords: o } = t, s = 4 + (e - 1) * 2 + o.length * 4, r = new v(s);
  return r.uint16(e), r.uint16(o.length), r.array("uint16", n), to(r, o), r.toArray();
}
function to(t, e) {
  for (const n of e)
    t.uint16(n.sequenceIndex), t.uint16(n.lookupListIndex);
}
function $a(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const o = t.uint16(), s = t.uint16(), r = [];
    for (let c = 0; c < s; c++)
      r.push(t.uint16());
    const i = $(t, e + o), a = r.map(
      (c) => c === 0 ? null : Oh(t, e + c)
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
      (g) => g === 0 ? null : kh(t, e + g)
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
    const o = t.uint16(), s = t.array("uint16", o), r = t.uint16(), i = t.array("uint16", r), a = t.uint16(), c = t.array("uint16", a), f = t.uint16(), l = ln(t, f), u = s.map(
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
function Oh(t, e) {
  t.seek(e);
  const n = t.uint16();
  return t.array("uint16", n).map((s) => Na(t, e + s));
}
function Na(t, e) {
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
function kh(t, e) {
  t.seek(e);
  const n = t.uint16();
  return t.array("uint16", n).map((s) => Na(t, e + s));
}
function Ga(t) {
  if (t.format === 1) return Eh(t);
  if (t.format === 2) return Th(t);
  if (t.format === 3) return Dh(t);
  throw new Error(`Unknown ChainedSequenceContext format: ${t.format}`);
}
function Eh(t) {
  const { coverage: e, chainedSeqRuleSets: n } = t, o = G(e), s = n.map(
    (l) => l === null ? null : Pa(l)
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
function Th(t) {
  const {
    coverage: e,
    backtrackClassDef: n,
    inputClassDef: o,
    lookaheadClassDef: s,
    chainedClassSeqRuleSets: r
  } = t, i = G(e), a = $t(n), c = $t(o), f = $t(s), l = r.map(
    (w) => w === null ? null : Pa(w)
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
  const m = l.map((w) => {
    if (w === null) return 0;
    const S = h;
    return h += w.length, S;
  }), y = new v(h);
  y.uint16(2), y.uint16(p), y.uint16(g), y.uint16(d), y.uint16(x), y.uint16(r.length), y.array("uint16", m), y.seek(p), y.rawBytes(i), y.seek(g), y.rawBytes(a), y.seek(d), y.rawBytes(c), y.seek(x), y.rawBytes(f);
  for (let w = 0; w < l.length; w++)
    l[w] && (y.seek(m[w]), y.rawBytes(l[w]));
  return y.toArray();
}
function Dh(t) {
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
  p.uint16(3), p.uint16(e.length), p.array("uint16", l), p.uint16(n.length), p.array("uint16", u), p.uint16(o.length), p.array("uint16", h), p.uint16(s.length), to(p, s);
  for (let g = 0; g < r.length; g++)
    p.seek(l[g]), p.rawBytes(r[g]);
  for (let g = 0; g < i.length; g++)
    p.seek(u[g]), p.rawBytes(i[g]);
  for (let g = 0; g < a.length; g++)
    p.seek(h[g]), p.rawBytes(a[g]);
  return p.toArray();
}
function Pa(t) {
  const e = t.map(Fh);
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
function Fh(t) {
  const {
    backtrackSequence: e,
    inputGlyphCount: n,
    inputSequence: o,
    lookaheadSequence: s,
    seqLookupRecords: r
  } = t, i = 2 + e.length * 2 + 2 + o.length * 2 + 2 + s.length * 2 + 2 + r.length * 4, a = new v(i);
  return a.uint16(e.length), a.array("uint16", e), a.uint16(n), a.array("uint16", o), a.uint16(s.length), a.array("uint16", s), a.uint16(r.length), to(a, r), a.toArray();
}
function Ua(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.uint32(), r = [];
  for (let a = 0; a < s; a++)
    r.push({
      conditionSetOffset: t.uint32(),
      featureTableSubstitutionOffset: t.uint32()
    });
  const i = r.map((a) => {
    const c = a.conditionSetOffset !== 0 ? Rh(t, e + a.conditionSetOffset) : null, f = a.featureTableSubstitutionOffset !== 0 ? Mh(
      t,
      e + a.featureTableSubstitutionOffset
    ) : null;
    return { conditionSet: c, featureTableSubstitution: f };
  });
  return { majorVersion: n, minorVersion: o, featureVariationRecords: i };
}
function Rh(t, e) {
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
function Mh(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.uint16(), r = [];
  for (let i = 0; i < s; i++) {
    const a = t.uint16(), c = t.uint32(), f = Ta(t, e + c);
    r.push({ featureIndex: a, feature: f });
  }
  return { majorVersion: n, minorVersion: o, substitutions: r };
}
function za(t) {
  const { majorVersion: e, minorVersion: n, featureVariationRecords: o } = t, s = o.map((f) => ({
    csBytes: f.conditionSet ? Lh(f.conditionSet) : null,
    ftsBytes: f.featureTableSubstitution ? Vh(f.featureTableSubstitution) : null
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
function Lh(t) {
  const e = t.conditions.map(Bh);
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
function Bh(t) {
  if (t.format === 1) {
    const e = new v(8);
    return e.uint16(1), e.uint16(t.axisIndex), e.int16(t.filterRangeMinValue), e.int16(t.filterRangeMaxValue), e.toArray();
  }
  throw new Error(`Unknown Condition format: ${t.format}`);
}
function Vh(t) {
  const e = t.substitutions.map((i) => Fa(i.feature));
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
const $h = 8, Nh = 12;
function Gh(t) {
  const e = new R(t), n = e.uint16(), o = e.uint16(), s = e.offset16(), r = e.offset16(), i = n > 1 || n === 1 && o >= 1 ? e.offset32() : 0, a = [s, r, i].filter(
    (c) => c > 0
  );
  return {
    majorVersion: n,
    minorVersion: o,
    horizAxis: s ? ur(t, s) : null,
    vertAxis: r ? ur(t, r) : null,
    itemVariationStore: i ? Ut(
      t.slice(
        i,
        Ph(t.length, i, a)
      )
    ) : null
  };
}
function Ph(t, e, n) {
  return n.filter((s) => s > e).sort((s, r) => s - r)[0] ?? t;
}
function ur(t, e) {
  if (e + 4 > t.length) return null;
  const n = new R(t);
  n.seek(e);
  const o = n.offset16(), s = n.offset16(), r = o ? Uh(n, e + o) : null, i = s ? zh(n, e + s) : [];
  return { baseTagList: r, baseScriptList: i };
}
function Uh(t, e) {
  t.seek(e);
  const n = t.uint16(), o = [];
  for (let s = 0; s < n; s++)
    o.push(t.tag());
  return o;
}
function zh(t, e) {
  t.seek(e);
  const n = t.uint16(), o = [];
  for (let s = 0; s < n; s++)
    o.push({ tag: t.tag(), off: t.offset16() });
  return o.map((s) => ({
    tag: s.tag,
    ...Hh(t, e + s.off)
  }));
}
function Hh(t, e) {
  t.seek(e);
  const n = t.offset16(), o = t.offset16(), s = t.uint16(), r = [];
  for (let i = 0; i < s; i++)
    r.push({ tag: t.tag(), off: t.offset16() });
  return {
    baseValues: n ? Wh(t, e + n) : null,
    defaultMinMax: o ? hr(t, e + o) : null,
    langSystems: r.map((i) => ({
      tag: i.tag,
      minMax: hr(t, e + i.off)
    }))
  };
}
function Wh(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = [];
  for (let r = 0; r < o; r++)
    s.push(t.offset16());
  return {
    defaultBaselineIndex: n,
    baseCoords: s.map(
      (r) => r ? Ve(t, e + r) : null
    )
  };
}
function hr(t, e) {
  t.seek(e);
  const n = t.offset16(), o = t.offset16(), s = t.uint16(), r = [];
  for (let i = 0; i < s; i++)
    r.push({
      tag: t.tag(),
      minOff: t.offset16(),
      maxOff: t.offset16()
    });
  return {
    minCoord: n ? Ve(t, e + n) : null,
    maxCoord: o ? Ve(t, e + o) : null,
    featMinMax: r.map((i) => ({
      tag: i.tag,
      minCoord: i.minOff ? Ve(t, e + i.minOff) : null,
      maxCoord: i.maxOff ? Ve(t, e + i.maxOff) : null
    }))
  };
}
function Ve(t, e) {
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
      device: s ? be(t, e + s) : null
    };
  }
  return { format: n, coordinate: o };
}
function jh(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = e > 1 || e === 1 && n >= 1, s = gr(t.horizAxis), r = gr(t.vertAxis), i = o && t.itemVariationStore ? ne(t.itemVariationStore) : [];
  let c = o ? Nh : $h;
  const f = s.length ? c : 0;
  c += s.length;
  const l = r.length ? c : 0;
  c += r.length;
  const u = i.length ? c : 0;
  c += i.length;
  const h = new v(c);
  return h.uint16(e), h.uint16(n), h.offset16(f), h.offset16(l), o && h.offset32(u), h.rawBytes(s), h.rawBytes(r), h.rawBytes(i), h.toArray();
}
function gr(t) {
  if (!t) return [];
  if (t._raw) return t._raw;
  const e = t.baseTagList ? Yh(t.baseTagList) : [], n = Zh(t.baseScriptList ?? []);
  let s = 4;
  const r = e.length ? s : 0;
  s += e.length;
  const i = n.length ? s : 0;
  s += n.length;
  const a = new v(s);
  return a.offset16(r), a.offset16(i), a.rawBytes(e), a.rawBytes(n), a.toArray();
}
function Yh(t) {
  const e = 2 + 4 * t.length, n = new v(e);
  n.uint16(t.length);
  for (const o of t)
    n.tag(o);
  return n.toArray();
}
function Zh(t) {
  const e = 2 + 6 * t.length, n = t.map((i) => Xh(i));
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
function Xh(t) {
  const e = qh(t.baseValues), n = pr(t.defaultMinMax), o = t.langSystems ?? [], s = o.map((u) => pr(u.minMax));
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
function qh(t) {
  if (!t) return [];
  const e = t.baseCoords ?? [], n = 4 + 2 * e.length, o = e.map((a) => $e(a));
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
function pr(t) {
  if (!t) return [];
  const e = t.featMinMax ?? [], n = 6 + 8 * e.length, o = $e(t.minCoord), s = $e(t.maxCoord), r = e.map((u) => ({
    tag: u.tag,
    min: $e(u.minCoord),
    max: $e(u.maxCoord)
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
function $e(t) {
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
const Ue = 5, Jt = 8;
function yn(t) {
  return {
    height: t.uint8(),
    width: t.uint8(),
    bearingX: t.int8(),
    bearingY: t.int8(),
    advance: t.uint8()
  };
}
function mo(t, e) {
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
function ze(t, e) {
  t.uint8(e.height ?? 0), t.uint8(e.width ?? 0), t.int8(e.horiBearingX ?? 0), t.int8(e.horiBearingY ?? 0), t.uint8(e.horiAdvance ?? 0), t.int8(e.vertBearingX ?? 0), t.int8(e.vertBearingY ?? 0), t.uint8(e.vertAdvance ?? 0);
}
function As(t, e) {
  const n = new R(t), o = n.uint32(), s = e?.CBLC;
  if (!s?.sizes)
    return { version: o, data: Array.from(t.slice(4)) };
  const r = [];
  for (const i of s.sizes) {
    const a = [];
    for (const c of i.indexSubTables ?? [])
      a.push(Kh(t, n, c));
    r.push(a);
  }
  return { version: o, bitmapData: r };
}
function Cs(t) {
  const e = t.version ?? 196608;
  if (t.data) {
    const o = t.data, s = new v(4 + o.length);
    return s.uint32(e), s.rawBytes(o), s.toArray();
  }
  const n = new v(4);
  return n.uint32(e), n.toArray();
}
function yo(t, e) {
  const n = t.version ?? 196608, o = t.bitmapData ?? [], s = e.sizes ?? [], r = [], i = [];
  let a = 4;
  for (let l = 0; l < s.length; l++) {
    const u = s[l].indexSubTables ?? [], h = o[l] ?? [], p = [];
    for (let g = 0; g < u.length; g++) {
      const d = u[g], x = h[g] ?? [], { bytes: m, info: y } = Jh(x, d, a);
      p.push(y), r.push(m), a += m.length;
    }
    i.push(p);
  }
  const c = a, f = new v(c);
  f.uint32(n);
  for (const l of r)
    f.rawBytes(l);
  return { bytes: f.toArray(), offsetInfo: i };
}
function Kh(t, e, n) {
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
        s - Ue
      );
      return { smallMetrics: i, imageData: a };
    }
    case 2: {
      const i = yn(e), a = r(
        e.position,
        s - Ue
      );
      return { smallMetrics: i, imageData: a };
    }
    case 5:
      return { imageData: r(n, s) };
    case 6: {
      const i = le(e), a = r(
        e.position,
        s - Jt
      );
      return { bigMetrics: i, imageData: a };
    }
    case 7: {
      const i = le(e), a = r(
        e.position,
        s - Jt
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
function Jh(t, e, n) {
  const { indexFormat: o, imageFormat: s } = e, r = { imageDataOffset: n }, i = t.map(
    (f) => f ? Qh(f, s) : []
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
function Qh(t, e) {
  switch (e) {
    case 1:
    case 2: {
      const n = t.imageData ?? [], o = new v(Ue + n.length);
      return mo(o, t.smallMetrics ?? {}), o.rawBytes(n), o.toArray();
    }
    case 5: {
      const n = t.imageData ?? [];
      return Array.from(n);
    }
    case 6:
    case 7: {
      const n = t.imageData ?? [], o = new v(Jt + n.length);
      return ze(o, t.bigMetrics ?? {}), o.rawBytes(n), o.toArray();
    }
    case 8: {
      const n = t.components ?? [], o = new v(
        Ue + 1 + 2 + n.length * 4
      );
      mo(o, t.smallMetrics ?? {}), o.uint8(0), o.uint16(n.length);
      for (const s of n)
        o.uint16(s.glyphID ?? 0), o.int8(s.xOffset ?? 0), o.int8(s.yOffset ?? 0);
      return o.toArray();
    }
    case 9: {
      const n = t.components ?? [], o = new v(Jt + 2 + n.length * 4);
      ze(o, t.bigMetrics ?? {}), o.uint16(n.length);
      for (const s of n)
        o.uint16(s.glyphID ?? 0), o.int8(s.xOffset ?? 0), o.int8(s.yOffset ?? 0);
      return o.toArray();
    }
    case 17: {
      const n = t.imageData ?? [], o = new v(Ue + 4 + n.length);
      return mo(o, t.smallMetrics ?? {}), o.uint32(n.length), o.rawBytes(n), o.toArray();
    }
    case 18: {
      const n = t.imageData ?? [], o = new v(Jt + 4 + n.length);
      return ze(o, t.bigMetrics ?? {}), o.uint32(n.length), o.rawBytes(n), o.toArray();
    }
    case 19: {
      const n = t.imageData ?? [], o = new v(4 + n.length);
      return o.uint32(n.length), o.rawBytes(n), o.toArray();
    }
    default:
      return Array.from(t.imageData ?? []);
  }
}
function t0(t, e) {
  return As(t, e?.bloc ? { CBLC: e.bloc } : e);
}
function e0(t) {
  return Cs(t);
}
const Ha = 48;
function vs(t) {
  return n0(t);
}
function me(t, e) {
  return e ? s0(t, e) : a0(t);
}
function n0(t) {
  const e = new R(t), n = e.uint16(), o = e.uint16(), s = e.uint32(), r = [], i = [];
  for (let a = 0; a < s; a++) {
    const c = e.uint32();
    e.uint32();
    const f = e.uint32(), l = e.uint32(), u = dr(e), h = dr(e), p = e.uint16(), g = e.uint16(), d = e.uint8(), x = e.uint8(), m = e.uint8(), y = e.int8();
    r.push({
      colorRef: l,
      hori: u,
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
    f !== 0 && (r[a].indexSubTables = o0(
      e,
      c,
      f
    ));
  }
  return { majorVersion: n, minorVersion: o, sizes: r };
}
function o0(t, e, n) {
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
function s0(t, e) {
  const n = t.majorVersion ?? 2, o = t.minorVersion ?? 0, s = t.sizes ?? [], r = s.map(
    (l, u) => r0(l.indexSubTables ?? [], e[u] ?? [])
  );
  let a = 8 + s.length * Ha;
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
function r0(t, e) {
  const n = t.map(
    (a, c) => i0(a, e[c] ?? {})
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
function i0(t, e) {
  const n = t.indexFormat, o = t.imageFormat, s = e.imageDataOffset ?? 0, r = 8;
  switch (n) {
    case 1: {
      const i = e.sbitOffsets ?? [], a = new v(r + i.length * 4);
      a.uint16(n), a.uint16(o), a.uint32(s);
      for (const c of i) a.uint32(c);
      return a.toArray();
    }
    case 2: {
      const i = new v(r + 4 + Jt);
      return i.uint16(n), i.uint16(o), i.uint32(s), i.uint32(t.imageSize ?? e.imageSize ?? 0), ze(i, t.bigMetrics ?? {}), i.toArray();
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
      let a = r + 4 + Jt + 4 + i.length * 2;
      i.length % 2 !== 0 && (a += 2);
      const c = new v(a);
      c.uint16(n), c.uint16(o), c.uint32(s), c.uint32(t.imageSize ?? e.imageSize ?? 0), ze(c, t.bigMetrics ?? {}), c.uint32(i.length);
      for (const f of i) c.uint16(f);
      return c.toArray();
    }
    default:
      throw new Error(`Unsupported index format: ${n}`);
  }
}
function a0(t) {
  const e = t.majorVersion ?? 2, n = t.minorVersion ?? 0, o = t.sizes ?? [], s = t.data ?? [], r = 8 + o.length * Ha + s.length, i = new v(r);
  i.uint16(e), i.uint16(n), i.uint32(o.length);
  for (const a of o)
    i.uint32(a.indexSubTableArrayOffset ?? 0), i.uint32(a.indexTablesSize ?? 0), i.uint32(a.numberOfIndexSubTables ?? 0), i.uint32(a.colorRef ?? 0), Vn(i, a.hori ?? {}), Vn(i, a.vert ?? {}), i.uint16(a.startGlyphIndex ?? 0), i.uint16(a.endGlyphIndex ?? 0), i.uint8(a.ppemX ?? 0), i.uint8(a.ppemY ?? 0), i.uint8(a.bitDepth ?? 0), i.int8(a.flags ?? 0);
  return i.rawBytes(s), i.toArray();
}
function dr(t) {
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
function c0(t) {
  return vs(t);
}
function f0(t) {
  return me(t);
}
function l0(t) {
  const e = new R(t), n = e.uint16(), o = e.uint16(), s = [], r = /* @__PURE__ */ new Set();
  for (let l = 0; l < o; l++) {
    const u = e.uint16(), h = e.uint16(), p = e.offset32();
    r.add(p), s.push({ platformID: u, encodingID: h, subtableOffset: p });
  }
  const i = [...r].sort((l, u) => l - u), a = i.map((l) => u0(e, l)), c = new Map(i.map((l, u) => [l, u])), f = s.map((l) => ({
    platformID: l.platformID,
    encodingID: l.encodingID,
    subtableIndex: c.get(l.subtableOffset)
  }));
  return { version: n, encodingRecords: f, subtables: a };
}
function u0(t, e) {
  t.seek(e);
  const n = t.uint16();
  switch (n) {
    case 0:
      return h0(t);
    case 2:
      return g0(t, e);
    case 4:
      return p0(t, e);
    case 6:
      return d0(t);
    case 8:
      return w0(t);
    case 10:
      return b0(t);
    case 12:
      return m0(t);
    case 13:
      return y0(t);
    case 14:
      return x0(t, e);
    default:
      return A0(t, e, n);
  }
}
function h0(t) {
  t.skip(2);
  const e = t.uint16(), n = t.array("uint8", 256);
  return { format: 0, language: e, glyphIdArray: n };
}
function g0(t, e) {
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
function p0(t, e) {
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
function d0(t) {
  t.skip(2);
  const e = t.uint16(), n = t.uint16(), o = t.uint16(), s = t.array("uint16", o);
  return { format: 6, language: e, firstCode: n, glyphIdArray: s };
}
function m0(t) {
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
function y0(t) {
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
function x0(t, e) {
  t.skip(4);
  const n = t.uint32(), o = [];
  for (let s = 0; s < n; s++) {
    const r = t.uint24(), i = t.offset32(), a = t.offset32();
    let c = null;
    if (i !== 0) {
      const l = t.position;
      c = S0(t, e + i), t.seek(l);
    }
    let f = null;
    if (a !== 0) {
      const l = t.position;
      f = _0(
        t,
        e + a
      ), t.seek(l);
    }
    o.push({ varSelector: r, defaultUVS: c, nonDefaultUVS: f });
  }
  return { format: 14, varSelectorRecords: o };
}
function S0(t, e) {
  t.seek(e);
  const n = t.uint32(), o = [];
  for (let s = 0; s < n; s++)
    o.push({
      startUnicodeValue: t.uint24(),
      additionalCount: t.uint8()
    });
  return o;
}
function _0(t, e) {
  t.seek(e);
  const n = t.uint32(), o = [];
  for (let s = 0; s < n; s++)
    o.push({
      unicodeValue: t.uint24(),
      glyphID: t.uint16()
    });
  return o;
}
function w0(t) {
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
function b0(t) {
  t.skip(2), t.skip(4);
  const e = t.uint32(), n = t.uint32(), o = t.uint32(), s = t.array("uint16", o);
  return { format: 10, language: e, startCharCode: n, glyphIdArray: s };
}
function A0(t, e, n) {
  let o;
  n >= 8 ? (t.skip(2), o = t.uint32()) : o = t.uint16(), t.seek(e);
  const s = t.bytes(o);
  return { format: n, _raw: s };
}
function C0(t) {
  const { version: e, encodingRecords: n, subtables: o } = t, s = n.map((u, h) => ({ rec: u, originalIndex: h })).sort((u, h) => {
    if (u.rec.platformID !== h.rec.platformID)
      return u.rec.platformID - h.rec.platformID;
    if (u.rec.encodingID !== h.rec.encodingID)
      return u.rec.encodingID - h.rec.encodingID;
    const p = (o[u.rec.subtableIndex] || {}).language || 0, g = (o[h.rec.subtableIndex] || {}).language || 0;
    return p - g;
  }).map(({ rec: u }) => u), r = o.map(v0), i = 4 + s.length * 8, a = [];
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
function v0(t) {
  switch (t.format) {
    case 0:
      return I0(t);
    case 2:
      return O0(t);
    case 4:
      return k0(t);
    case 6:
      return E0(t);
    case 8:
      return T0(t);
    case 10:
      return D0(t);
    case 12:
      return F0(t);
    case 13:
      return R0(t);
    case 14:
      return M0(t);
    default:
      return t._raw;
  }
}
function I0(t) {
  const n = new v(262);
  return n.uint16(0), n.uint16(262), n.uint16(t.language), n.array("uint8", t.glyphIdArray), n.toArray();
}
function O0(t) {
  const { language: e, subHeaderKeys: n, subHeaders: o, glyphIdArray: s } = t, r = 518 + o.length * 8 + s.length * 2, i = new v(r);
  i.uint16(2), i.uint16(r), i.uint16(e), i.array("uint16", n);
  for (const a of o)
    i.uint16(a.firstCode), i.uint16(a.entryCount), i.int16(a.idDelta), i.uint16(a.idRangeOffset);
  return i.array("uint16", s), i.toArray();
}
function k0(t) {
  const { language: e, segments: n, glyphIdArray: o } = t, s = n.length, r = s * 2, i = Math.floor(Math.log2(s)), a = Math.pow(2, i) * 2, c = r - a, f = 14 + s * 8 + 2 + o.length * 2, l = new v(f);
  l.uint16(4), l.uint16(f), l.uint16(e), l.uint16(r), l.uint16(a), l.uint16(i), l.uint16(c);
  for (const u of n) l.uint16(u.endCode);
  l.uint16(0);
  for (const u of n) l.uint16(u.startCode);
  for (const u of n) l.int16(u.idDelta);
  for (const u of n) l.uint16(u.idRangeOffset);
  return l.array("uint16", o), l.toArray();
}
function E0(t) {
  const { language: e, firstCode: n, glyphIdArray: o } = t, s = o.length, r = 10 + s * 2, i = new v(r);
  return i.uint16(6), i.uint16(r), i.uint16(e), i.uint16(n), i.uint16(s), i.array("uint16", o), i.toArray();
}
function T0(t) {
  const { language: e, is32: n, groups: o } = t, s = 8208 + o.length * 12, r = new v(s);
  r.uint16(8), r.uint16(0), r.uint32(s), r.uint32(e), r.rawBytes(n), r.uint32(o.length);
  for (const i of o)
    r.uint32(i.startCharCode), r.uint32(i.endCharCode), r.uint32(i.startGlyphID);
  return r.toArray();
}
function D0(t) {
  const { language: e, startCharCode: n, glyphIdArray: o } = t, s = 20 + o.length * 2, r = new v(s);
  return r.uint16(10), r.uint16(0), r.uint32(s), r.uint32(e), r.uint32(n), r.uint32(o.length), r.array("uint16", o), r.toArray();
}
function F0(t) {
  const e = t.groups.length, n = 16 + e * 12, o = new v(n);
  o.uint16(12), o.uint16(0), o.uint32(n), o.uint32(t.language), o.uint32(e);
  for (const s of t.groups)
    o.uint32(s.startCharCode), o.uint32(s.endCharCode), o.uint32(s.startGlyphID);
  return o.toArray();
}
function R0(t) {
  const e = t.groups.length, n = 16 + e * 12, o = new v(n);
  o.uint16(13), o.uint16(0), o.uint32(n), o.uint32(t.language), o.uint32(e);
  for (const s of t.groups)
    o.uint32(s.startCharCode), o.uint32(s.endCharCode), o.uint32(s.glyphID);
  return o.toArray();
}
function M0(t) {
  const { varSelectorRecords: e } = t, n = e.map((c) => ({
    defaultUVSBytes: c.defaultUVS ? L0(c.defaultUVS) : null,
    nonDefaultUVSBytes: c.nonDefaultUVS ? B0(c.nonDefaultUVS) : null
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
function L0(t) {
  const e = 4 + t.length * 4, n = new v(e);
  n.uint32(t.length);
  for (const o of t)
    n.uint24(o.startUnicodeValue), n.uint8(o.additionalCount);
  return n.toArray();
}
function B0(t) {
  const e = 4 + t.length * 5, n = new v(e);
  n.uint32(t.length);
  for (const o of t)
    n.uint24(o.unicodeValue), n.uint16(o.glyphID);
  return n.toArray();
}
const Ne = [
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
], Wa = 15, ja = 48;
function V0(t, e) {
  return e === 1 ? t.uint8() : e === 2 ? t.uint16() : e === 3 ? t.uint24() : t.uint32();
}
function $0(t, e, n) {
  n === 1 ? t.uint8(e) : n === 2 ? t.uint16(e) : n === 3 ? t.uint24(e) : t.uint32(e >>> 0);
}
function N0(t, e) {
  t.seek(e);
  const n = t.uint8(), o = t.uint8(), s = n === 1 ? t.uint32() : t.uint16(), r = (o & Wa) + 1, i = ((o & ja) >> 4) + 1, a = [];
  for (let c = 0; c < s; c++) {
    const f = V0(t, i), l = (1 << r) - 1;
    a.push({
      outerIndex: f >> r,
      innerIndex: f & l
    });
  }
  return { format: n, entryFormat: o, mapCount: s, entries: a };
}
function G0(t) {
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
  const f = t.entryFormat ?? c - 1 << 4 | i - 1, l = o === 1 ? 6 : 4, u = (f & Wa) + 1, h = ((f & ja) >> 4) + 1, p = new v(l + n * h);
  p.uint8(o), p.uint8(f), o === 1 ? p.uint32(n) : p.uint16(n);
  for (let g = 0; g < n; g++) {
    const d = e[g] ?? { outerIndex: 0, innerIndex: 0 }, x = (d.outerIndex ?? 0) << u | (d.innerIndex ?? 0) & (1 << u) - 1;
    $0(p, x, h);
  }
  return p.toArray();
}
function P0(t, e) {
  const n = /* @__PURE__ */ new Map(), o = U0(
    t,
    e.baseGlyphListOffset,
    n
  ), s = e.layerListOffset ? z0(t, e.layerListOffset, n) : null, r = e.clipListOffset ? H0(t, e.clipListOffset) : null, i = e.varIndexMapOffset ? N0(t, e.varIndexMapOffset) : null;
  e.itemVariationStoreOffset && Ut(
    t.bytes(0).length ? [] : []
    // unused — we re-read below
  );
  let a = null;
  if (e.itemVariationStoreOffset) {
    t.seek(e.itemVariationStoreOffset);
    const c = [];
    for (; t.position < t.length; )
      c.push(t.uint8());
    a = Ut(c);
  }
  return {
    baseGlyphPaintRecords: o,
    layerPaints: s,
    clipList: r,
    varIndexMap: i,
    itemVariationStore: a
  };
}
function U0(t, e, n) {
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
function z0(t, e, n) {
  t.seek(e);
  const o = t.uint32(), s = [];
  for (let i = 0; i < o; i++)
    s.push(t.uint32());
  const r = [];
  for (const i of s)
    r.push(et(t, e + i, n));
  return r;
}
function H0(t, e) {
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
    clipBox: W0(t, e + i.clipBoxOffset)
  }));
  return { format: n, clips: r };
}
function W0(t, e) {
  t.seek(e);
  const n = t.uint8(), o = t.fword(), s = t.fword(), r = t.fword(), i = t.fword(), a = { format: n, xMin: o, yMin: s, xMax: r, yMax: i };
  return n === 2 && (a.varIndexBase = t.uint32()), a;
}
function Is(t, e, n) {
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
function j0(t, e, n) {
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
      s = Y0(t);
      break;
    case 2:
      s = mr(t, !1);
      break;
    case 3:
      s = mr(t, !0);
      break;
    case 4:
      s = yr(t, e, !1);
      break;
    case 5:
      s = yr(t, e, !0);
      break;
    case 6:
      s = xr(t, e, !1);
      break;
    case 7:
      s = xr(t, e, !0);
      break;
    case 8:
      s = Sr(t, e, !1);
      break;
    case 9:
      s = Sr(t, e, !0);
      break;
    case 10:
      s = Z0(t, e, n);
      break;
    case 11:
      s = X0(t);
      break;
    case 12:
      s = _r(t, e, n, !1);
      break;
    case 13:
      s = _r(t, e, n, !0);
      break;
    case 14:
      s = wr(t, e, n, !1);
      break;
    case 15:
      s = wr(t, e, n, !0);
      break;
    case 16:
      s = br(t, e, n, !1);
      break;
    case 17:
      s = br(t, e, n, !0);
      break;
    case 18:
      s = Ar(t, e, n, !1);
      break;
    case 19:
      s = Ar(t, e, n, !0);
      break;
    case 20:
      s = Cr(t, e, n, !1);
      break;
    case 21:
      s = Cr(t, e, n, !0);
      break;
    case 22:
      s = vr(t, e, n, !1);
      break;
    case 23:
      s = vr(t, e, n, !0);
      break;
    case 24:
      s = Ir(t, e, n, !1);
      break;
    case 25:
      s = Ir(t, e, n, !0);
      break;
    case 26:
      s = Or(t, e, n, !1);
      break;
    case 27:
      s = Or(t, e, n, !0);
      break;
    case 28:
      s = kr(t, e, n, !1);
      break;
    case 29:
      s = kr(t, e, n, !0);
      break;
    case 30:
      s = Er(t, e, n, !1);
      break;
    case 31:
      s = Er(t, e, n, !0);
      break;
    case 32:
      s = q0(t, e, n);
      break;
    default:
      return s = { format: o, _unknown: !0 }, n.set(e, s), s;
  }
  return s.format = o, n.set(e, s), s;
}
function Y0(t) {
  return {
    numLayers: t.uint8(),
    firstLayerIndex: t.uint32()
  };
}
function mr(t, e) {
  const n = {
    paletteIndex: t.uint16(),
    alpha: t.f2dot14()
  };
  return e && (n.varIndexBase = t.uint32()), n;
}
function yr(t, e, n) {
  const o = t.uint24(), s = {
    x0: t.fword(),
    y0: t.fword(),
    x1: t.fword(),
    y1: t.fword(),
    x2: t.fword(),
    y2: t.fword()
  };
  return n && (s.varIndexBase = t.uint32()), s.colorLine = Is(t, e + o, n), s;
}
function xr(t, e, n) {
  const o = t.uint24(), s = {
    x0: t.fword(),
    y0: t.fword(),
    radius0: t.ufword(),
    x1: t.fword(),
    y1: t.fword(),
    radius1: t.ufword()
  };
  return n && (s.varIndexBase = t.uint32()), s.colorLine = Is(t, e + o, n), s;
}
function Sr(t, e, n) {
  const o = t.uint24(), s = {
    centerX: t.fword(),
    centerY: t.fword(),
    startAngle: t.f2dot14(),
    endAngle: t.f2dot14()
  };
  return n && (s.varIndexBase = t.uint32()), s.colorLine = Is(t, e + o, n), s;
}
function Z0(t, e, n) {
  const o = t.uint24();
  return {
    glyphID: t.uint16(),
    paint: et(t, e + o, n)
  };
}
function X0(t) {
  return { glyphID: t.uint16() };
}
function _r(t, e, n, o) {
  const s = t.uint24(), r = t.uint24();
  return {
    paint: et(t, e + s, n),
    transform: j0(t, e + r, o)
  };
}
function wr(t, e, n, o) {
  const s = t.uint24(), r = {
    dx: t.fword(),
    dy: t.fword()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = et(t, e + s, n), r;
}
function br(t, e, n, o) {
  const s = t.uint24(), r = {
    scaleX: t.f2dot14(),
    scaleY: t.f2dot14()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = et(t, e + s, n), r;
}
function Ar(t, e, n, o) {
  const s = t.uint24(), r = {
    scaleX: t.f2dot14(),
    scaleY: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = et(t, e + s, n), r;
}
function Cr(t, e, n, o) {
  const s = t.uint24(), r = { scale: t.f2dot14() };
  return o && (r.varIndexBase = t.uint32()), r.paint = et(t, e + s, n), r;
}
function vr(t, e, n, o) {
  const s = t.uint24(), r = {
    scale: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = et(t, e + s, n), r;
}
function Ir(t, e, n, o) {
  const s = t.uint24(), r = { angle: t.f2dot14() };
  return o && (r.varIndexBase = t.uint32()), r.paint = et(t, e + s, n), r;
}
function Or(t, e, n, o) {
  const s = t.uint24(), r = {
    angle: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = et(t, e + s, n), r;
}
function kr(t, e, n, o) {
  const s = t.uint24(), r = {
    xSkewAngle: t.f2dot14(),
    ySkewAngle: t.f2dot14()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = et(t, e + s, n), r;
}
function Er(t, e, n, o) {
  const s = t.uint24(), r = {
    xSkewAngle: t.f2dot14(),
    ySkewAngle: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = et(t, e + s, n), r;
}
function q0(t, e, n) {
  const o = t.uint24(), s = t.uint8(), r = t.uint24();
  return {
    sourcePaint: et(t, e + o, n),
    compositeMode: s,
    backdropPaint: et(t, e + r, n)
  };
}
function K0(t) {
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
      for (const F of jo(D))
        c(F);
    }
  }
  if (e)
    for (const D of e)
      c(D.paint);
  if (n)
    for (const D of n)
      c(D);
  const f = J0(a), l = /* @__PURE__ */ new Map();
  for (const D of f)
    l.set(D, Q0(D));
  const u = /* @__PURE__ */ new Map();
  let h = 0;
  for (const D of f)
    u.set(D, h), h += l.get(D);
  const p = h, g = e ? e.length : 0, d = 4 + g * 6, x = n ? n.length : 0, m = x > 0 ? 4 + x * 4 : 0, y = o ? ng(o) : [], w = s ? G0(s) : [], S = r ? ne(r) : [], _ = d + m + p + y.length + w.length + S.length, b = 0, A = d, k = d + m, O = k + p, I = O + y.length, E = I + w.length, T = new v(_);
  T.uint32(g);
  for (const D of e || [])
    T.uint16(D.glyphID), T.uint32(k - b + u.get(D.paint));
  if (x > 0) {
    T.uint32(x);
    for (const D of n)
      T.uint32(k - A + u.get(D));
  }
  for (const D of f)
    tg(
      T,
      D,
      k + u.get(D),
      u,
      k
    );
  return T.rawBytes(y), T.rawBytes(w), T.rawBytes(S), {
    bodyBytes: T.toArray(),
    bglBodyOffset: b,
    llBodyOffset: x > 0 ? A : 0,
    clipBodyOffset: y.length > 0 ? O : 0,
    dimBodyOffset: w.length > 0 ? I : 0,
    ivsBodyOffset: S.length > 0 ? E : 0
  };
}
function jo(t) {
  if (!t) return [];
  const e = [];
  return t.paint && e.push(t.paint), t.sourcePaint && e.push(t.sourcePaint), t.backdropPaint && e.push(t.backdropPaint), e;
}
function J0(t, e) {
  const n = /* @__PURE__ */ new Map();
  for (const a of t) n.set(a, 0);
  for (const a of t)
    for (const c of jo(a))
      n.has(c) && n.set(c, n.get(c) + 1);
  const o = [];
  let s = 0;
  for (const a of t)
    n.get(a) === 0 && o.push(a);
  const r = [], i = /* @__PURE__ */ new Set();
  for (; s < o.length; ) {
    const a = o[s++];
    r.push(a), i.add(a);
    for (const c of jo(a)) {
      if (!n.has(c)) continue;
      const f = n.get(c) - 1;
      n.set(c, f), f === 0 && o.push(c);
    }
  }
  for (const a of t)
    i.has(a) || r.push(a);
  return r;
}
function Q0(t) {
  const e = Ne[t.format] || 0, n = t.format;
  return n === 4 || n === 6 || n === 8 ? e + Tr(t.colorLine, !1) : n === 5 || n === 7 || n === 9 ? e + Tr(t.colorLine, !0) : n === 12 ? e + 24 : n === 13 ? e + 28 : e;
}
function Tr(t, e) {
  if (!t) return 0;
  const n = e ? 10 : 6;
  return 3 + t.colorStops.length * n;
}
function tg(t, e, n, o, s) {
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
      const i = Ne[r];
      t.uint24(i), t.fword(e.x0), t.fword(e.y0), t.fword(e.x1), t.fword(e.y1), t.fword(e.x2), t.fword(e.y2), r === 5 && t.uint32(e.varIndexBase), xo(t, e.colorLine, r === 5);
      break;
    }
    case 6:
    // PaintRadialGradient
    case 7: {
      const i = Ne[r];
      t.uint24(i), t.fword(e.x0), t.fword(e.y0), t.ufword(e.radius0), t.fword(e.x1), t.fword(e.y1), t.ufword(e.radius1), r === 7 && t.uint32(e.varIndexBase), xo(t, e.colorLine, r === 7);
      break;
    }
    case 8:
    // PaintSweepGradient
    case 9: {
      const i = Ne[r];
      t.uint24(i), t.fword(e.centerX), t.fword(e.centerY), t.f2dot14(e.startAngle), t.f2dot14(e.endAngle), r === 9 && t.uint32(e.varIndexBase), xo(t, e.colorLine, r === 9);
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
      const i = s + o.get(e.paint), a = Ne[r];
      t.uint24(i - n), t.uint24(a), eg(t, e.transform, r === 13);
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
function xo(t, e, n) {
  t.uint8(e.extend), t.uint16(e.colorStops.length);
  for (const o of e.colorStops)
    t.f2dot14(o.stopOffset), t.uint16(o.paletteIndex), t.f2dot14(o.alpha), n && t.uint32(o.varIndexBase);
}
function eg(t, e, n) {
  t.fixed(e.xx), t.fixed(e.yx), t.fixed(e.xy), t.fixed(e.yy), t.fixed(e.dx), t.fixed(e.dy), n && t.uint32(e.varIndexBase);
}
function ng(t) {
  if (!t || !t.clips || t.clips.length === 0) return [];
  const e = [];
  for (const a of t.clips)
    e.push(og(a.clipBox));
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
function og(t) {
  const e = t.format === 2 ? 13 : 9, n = new v(e);
  return n.uint8(t.format), n.fword(t.xMin), n.fword(t.yMin), n.fword(t.xMax), n.fword(t.yMax), t.format === 2 && n.uint32(t.varIndexBase), n.toArray();
}
function sg(t) {
  const e = new R(t), n = e.uint16(), o = e.uint16(), s = e.uint32(), r = e.uint32(), i = e.uint16(), a = [];
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
    const l = e.uint32(), u = e.uint32(), h = e.uint32(), p = e.uint32(), g = e.uint32(), x = P0(e, {
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
function rg(t) {
  const { baseGlyphRecords: e, layerRecords: n } = t;
  if (t.version >= 1 && t.baseGlyphPaintRecords) {
    const u = e.length * 6, h = n.length * 4, d = 14 + 20, x = u + h, m = d + x, y = K0({
      baseGlyphPaintRecords: t.baseGlyphPaintRecords,
      layerPaints: t.layerPaints,
      clipList: t.clipList,
      varIndexMap: t.varIndexMap,
      itemVariationStore: t.itemVariationStore
    }), w = y.bodyBytes, S = m + y.bglBodyOffset, _ = y.llBodyOffset ? m + y.llBodyOffset : 0, b = y.clipBodyOffset ? m + y.clipBodyOffset : 0, A = y.dimBodyOffset ? m + y.dimBodyOffset : 0, k = y.ivsBodyOffset ? m + y.ivsBodyOffset : 0, O = m + w.length, I = new v(O);
    I.uint16(t.version), I.uint16(e.length), I.uint32(e.length > 0 ? d : 0), I.uint32(n.length > 0 ? d + u : 0), I.uint16(n.length), I.uint32(S), I.uint32(_), I.uint32(b), I.uint32(A), I.uint32(k);
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
function ig(t) {
  const e = new R(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.uint32(), a = [];
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
    for (let m = 0; m < o; m++)
      x.push({ ...u[d + m] });
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
function ag(t) {
  const { version: e, numPaletteEntries: n, palettes: o } = t, s = o.length, r = [], i = [];
  for (let y = 0; y < s; y++) {
    r.push(i.length);
    for (let w = 0; w < n; w++)
      i.push(o[y][w]);
  }
  const a = i.length, c = 12 + s * 2, f = e >= 1 ? 12 : 0, l = c + f, u = a * 4;
  let h = l + u, p = 0, g = 0, d = 0;
  e >= 1 && t.paletteTypes && (p = h, h += s * 4), e >= 1 && t.paletteLabels && (g = h, h += s * 2), e >= 1 && t.paletteEntryLabels && (d = h, h += n * 2);
  const x = h, m = new v(x);
  m.uint16(e), m.uint16(n), m.uint16(s), m.uint16(a), m.uint32(l);
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
const cg = 8, fg = 12;
function lg(t) {
  const e = new R(t), n = e.uint32(), o = e.uint16(), s = e.uint16(), r = [];
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
function ug(t) {
  const e = t.version ?? 1, n = t.flags ?? 0, s = (t.signatures ?? []).map((c) => {
    const f = hg(c);
    return {
      format: c.format ?? 1,
      bytes: f
    };
  });
  let r = cg + s.length * fg;
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
function hg(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
function gg(t, e) {
  return As(t, e?.EBLC ? { CBLC: e.EBLC } : e);
}
function pg(t) {
  return Cs(t);
}
function dg(t) {
  return vs(t);
}
function mg(t) {
  return me(t);
}
const Yo = 28;
function yg(t) {
  const e = new R(t), n = e.uint32(), o = e.uint32(), s = [];
  for (let r = 0; r < o; r++) {
    const i = e.position;
    s.push({
      hori: Dr(e),
      vert: Dr(e),
      substitutePpemX: e.uint8(),
      substitutePpemY: e.uint8(),
      originalPpemX: e.uint8(),
      originalPpemY: e.uint8(),
      _raw: Array.from(t.slice(i, i + Yo))
    });
  }
  return { version: n, scales: s };
}
function xg(t) {
  const e = t.version ?? 131072, n = t.scales ?? [], o = new v(8 + n.length * Yo);
  o.uint32(e), o.uint32(n.length);
  for (const s of n) {
    if (s._raw && s._raw.length === Yo) {
      o.rawBytes(s._raw);
      continue;
    }
    Fr(o, s.hori ?? {}), Fr(o, s.vert ?? {}), o.uint8(s.substitutePpemX ?? 0), o.uint8(s.substitutePpemY ?? 0), o.uint8(s.originalPpemX ?? 0), o.uint8(s.originalPpemY ?? 0);
  }
  return o.toArray();
}
function Dr(t) {
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
function Fr(t, e) {
  t.int8(e.ascender ?? 0), t.int8(e.descender ?? 0), t.uint8(e.widthMax ?? 0), t.int8(e.caretSlopeNumerator ?? 0), t.int8(e.caretSlopeDenominator ?? 0), t.int8(e.caretOffset ?? 0), t.int8(e.minOriginSB ?? 0), t.int8(e.minAdvanceSB ?? 0), t.int8(e.maxBeforeBL ?? 0), t.int8(e.minAfterBL ?? 0), t.int8(e.pad1 ?? 0), t.int8(e.pad2 ?? 0);
}
const Rr = 16, Sg = 20;
function _g(t) {
  const e = new R(t), n = e.uint16(), o = e.uint16(), s = e.offset16(), r = e.uint16(), i = e.uint16(), a = e.uint16(), c = e.uint16(), f = e.uint16(), l = [];
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
    for (let m = 0; m < i; m++)
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
function wg(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.reserved ?? 2, s = t.axes ?? [], r = t.instances ?? [], i = s.length, a = Sg, c = 4 + i * 4, f = r.some(
    (d) => d.postScriptNameID !== void 0
  ), l = f ? c + 2 : c, u = r.length, h = Rr, p = Rr + i * a + u * l, g = new v(p);
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
function bg(t) {
  const e = new R(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.uint16(), a = e.uint16();
  let c = 0;
  o >= 2 && (c = e.uint16());
  let f = 0;
  o >= 3 && (f = e.uint32());
  const l = { majorVersion: n, minorVersion: o };
  return s !== 0 && (l.glyphClassDef = Vt(e, s)), r !== 0 && (l.attachList = Ag(e, r)), i !== 0 && (l.ligCaretList = Cg(e, i)), a !== 0 && (l.markAttachClassDef = Vt(e, a)), c !== 0 && (l.markGlyphSetsDef = Ig(e, c)), f !== 0 && (l.itemVarStoreOffset = f, l.itemVariationStore = Ut(
    t.slice(f)
  )), l;
}
function Ag(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.array("uint16", o), r = $(t, e + n), i = s.map((a) => {
    t.seek(e + a);
    const c = t.uint16();
    return t.array("uint16", c);
  });
  return { coverage: r, attachPoints: i };
}
function Cg(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.array("uint16", o), r = $(t, e + n), i = s.map(
    (a) => vg(t, e + a)
  );
  return { coverage: r, ligGlyphs: i };
}
function vg(t, e) {
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
      const a = t.int16(), c = t.uint16(), f = c !== 0 ? be(t, r + c) : null;
      return { format: i, coordinate: a, device: f };
    }
    throw new Error(`Unknown CaretValue format: ${i}`);
  });
}
function Ig(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = [];
  for (let i = 0; i < o; i++)
    s.push(t.uint32());
  const r = s.map(
    (i) => $(t, e + i)
  );
  return { format: n, coverages: r };
}
function Og(t) {
  const { majorVersion: e, minorVersion: n } = t, o = t.glyphClassDef ? $t(t.glyphClassDef) : null, s = t.attachList ? kg(t.attachList) : null, r = t.ligCaretList ? Tg(t.ligCaretList) : null, i = t.markAttachClassDef ? $t(t.markAttachClassDef) : null, a = n >= 2 && t.markGlyphSetsDef ? Rg(t.markGlyphSetsDef) : null, c = n >= 3 && t.itemVariationStore ? ne(t.itemVariationStore) : null;
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
  const m = new v(l);
  return m.uint16(e), m.uint16(n), m.uint16(u), m.uint16(h), m.uint16(p), m.uint16(g), n >= 2 && m.uint16(d), n >= 3 && m.uint32(x), o && (m.seek(u), m.rawBytes(o)), s && (m.seek(h), m.rawBytes(s)), r && (m.seek(p), m.rawBytes(r)), i && (m.seek(g), m.rawBytes(i)), a && (m.seek(d), m.rawBytes(a)), c && (m.seek(x), m.rawBytes(c)), m.toArray();
}
function kg(t) {
  const e = G(t.coverage), n = t.attachPoints.map(Eg);
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
function Eg(t) {
  const e = 2 + t.length * 2, n = new v(e);
  return n.uint16(t.length), n.array("uint16", t), n.toArray();
}
function Tg(t) {
  const e = G(t.coverage), n = t.ligGlyphs.map(Dg);
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
function Dg(t) {
  const e = t.map(Fg);
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
function Fg(t) {
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
function Rg(t) {
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
      return be(t, p);
    } catch (d) {
      if (g !== p)
        try {
          return be(t, g);
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
function Ae(t, e) {
  if (e === 0) return null;
  t.seek(e);
  const n = t.uint16(), o = t.int16(), s = t.int16(), r = { format: n, xCoordinate: o, yCoordinate: s };
  if (n === 2)
    r.anchorPoint = t.uint16();
  else if (n === 3) {
    const i = t.uint16(), a = t.uint16();
    i && (r.xDevice = be(t, e + i)), a && (r.yDevice = be(t, e + a));
  }
  return r;
}
function Os(t, e) {
  t.seek(e);
  const n = t.uint16(), o = [];
  for (let s = 0; s < n; s++) {
    const r = t.uint16(), i = t.uint16();
    o.push({ markClass: r, anchorOffset: i });
  }
  return o.map((s) => ({
    markClass: s.markClass,
    markAnchor: Ae(t, e + s.anchorOffset)
  }));
}
function Mg(t) {
  const e = new R(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.uint16();
  let a = 0;
  o >= 1 && (a = e.uint32());
  const c = {
    majorVersion: n,
    minorVersion: o,
    scriptList: Oa(e, s),
    featureList: Ea(e, r),
    lookupList: Ra(e, i, Ya, 9)
  };
  return a !== 0 && (c.featureVariations = Ua(
    e,
    a
  )), c;
}
function Ya(t, e, n) {
  switch (n) {
    case 1:
      return Lg(t, e);
    case 2:
      return Bg(t, e);
    case 3:
      return Vg(t, e);
    case 4:
      return $g(t, e);
    case 5:
      return Ng(t, e);
    case 6:
      return Gg(t, e);
    case 7:
      return La(t, e);
    case 8:
      return $a(t, e);
    case 9:
      return Pg(t, e);
    default:
      throw new Error(`Unknown GPOS lookup type: ${n}`);
  }
}
function Lg(t, e) {
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
function Bg(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = t.uint16(), c = t.array("uint16", i).map((l) => {
      const u = e + l;
      t.seek(u);
      const h = t.uint16(), p = [];
      for (let g = 0; g < h; g++) {
        const d = t.uint16(), x = ue(t, s, u), m = ue(t, r, u);
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
    const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = t.uint16(), a = t.uint16(), c = t.uint16(), f = t.uint16(), l = [];
    for (let g = 0; g < c; g++) {
      const d = [];
      for (let x = 0; x < f; x++) {
        const m = ue(t, s, e), y = ue(t, r, e);
        d.push({ value1: m, value2: y });
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
function Vg(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown CursivePos format: ${n}`);
  const o = t.uint16(), s = t.uint16(), r = [];
  for (let c = 0; c < s; c++) {
    const f = t.uint16(), l = t.uint16();
    r.push({ entryAnchorOff: f, exitAnchorOff: l });
  }
  const i = $(t, e + o), a = r.map((c) => ({
    entryAnchor: c.entryAnchorOff ? Ae(t, e + c.entryAnchorOff) : null,
    exitAnchor: c.exitAnchorOff ? Ae(t, e + c.exitAnchorOff) : null
  }));
  return { format: n, coverage: i, entryExitRecords: a };
}
function $g(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown MarkBasePos format: ${n}`);
  const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = t.uint16(), a = t.uint16(), c = $(t, e + o), f = $(t, e + s), l = Os(t, e + i);
  t.seek(e + a);
  const u = t.uint16(), h = [];
  for (let g = 0; g < u; g++) {
    const d = t.array("uint16", r);
    h.push(d);
  }
  const p = h.map(
    (g) => g.map(
      (d) => d ? Ae(t, e + a + d) : null
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
function Ng(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown MarkLigPos format: ${n}`);
  const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = t.uint16(), a = t.uint16(), c = $(t, e + o), f = $(t, e + s), l = Os(t, e + i);
  t.seek(e + a);
  const u = t.uint16(), p = t.array("uint16", u).map((g) => {
    const d = e + a + g;
    t.seek(d);
    const x = t.uint16(), m = [];
    for (let y = 0; y < x; y++) {
      const w = t.array("uint16", r);
      m.push(w);
    }
    return m.map(
      (y) => y.map((w) => w ? Ae(t, d + w) : null)
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
function Gg(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown MarkMarkPos format: ${n}`);
  const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = t.uint16(), a = t.uint16(), c = $(t, e + o), f = $(t, e + s), l = Os(t, e + i);
  t.seek(e + a);
  const u = t.uint16(), h = [];
  for (let g = 0; g < u; g++) {
    const d = t.array("uint16", r);
    h.push(d);
  }
  const p = h.map(
    (g) => g.map(
      (d) => d ? Ae(t, e + a + d) : null
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
function Pg(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown ExtensionPos format: ${n}`);
  const o = t.uint16(), s = t.uint32(), r = Ya(
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
function Xe(t) {
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
function ks(t) {
  const e = t.map((i) => Xe(i.markAnchor));
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
function Ug(t) {
  const { majorVersion: e, minorVersion: n } = t, o = zg(t), s = ka(o.scriptList), r = Da(o.featureList), i = Ma(
    o.lookupList,
    Za,
    9
  ), a = o.featureVariations ? za(o.featureVariations) : null;
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
function zg(t) {
  const e = t.lookupList.lookups.map((n) => {
    if (n.lookupType !== 2 || !Array.isArray(n.subtables))
      return n;
    const o = n.subtables.flatMap((s) => s?.format !== 1 || !Array.isArray(s.pairSets) ? [s] : Hg(s));
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
function Hg(t) {
  const e = Wg(t.coverage);
  if (e.length !== t.pairSets.length)
    return [t];
  const n = Lt(t.valueFormat1) + Lt(t.valueFormat2), o = t.pairSets.map(
    (c) => 2 + c.length * (2 + n)
  ), s = o.reduce((c, f) => c + f, 0);
  if (Mr(
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
      if (Mr(
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
function Mr(t, e) {
  const n = 10 + t * 2, o = 4 + t * 2;
  return n + o + e;
}
function Wg(t) {
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
function Za(t, e) {
  switch (e) {
    case 1:
      return jg(t);
    case 2:
      return Yg(t);
    case 3:
      return Zg(t);
    case 4:
      return Xg(t);
    case 5:
      return qg(t);
    case 6:
      return Jg(t);
    case 7:
      return Ba(t);
    case 8:
      return Ga(t);
    case 9:
      return Qg(t);
    default:
      throw new Error(`Unknown GPOS lookup type: ${e}`);
  }
}
function jg(t) {
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
function Yg(t) {
  const e = G(t.coverage), n = [];
  if (t.format === 1) {
    const o = t.pairSets.map((f) => {
      const l = Lt(t.valueFormat1), u = Lt(t.valueFormat2), h = 2 + l + u, p = new v(2 + f.length * h);
      p.uint16(f.length);
      for (const g of f)
        p.uint16(g.secondGlyph), p.rawBytes(he(g.value1, t.valueFormat1, n)), p.rawBytes(he(g.value2, t.valueFormat2, n));
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
        g.rawBytes(he(x.value1, t.valueFormat1, n)), g.rawBytes(he(x.value2, t.valueFormat2, n));
    return g.seek(u), g.rawBytes(e), g.seek(h), g.rawBytes(o), g.seek(p), g.rawBytes(s), g.toArray();
  }
  throw new Error(`Unknown PairPos format: ${t.format}`);
}
function Zg(t) {
  const e = G(t.coverage), n = t.entryExitRecords.map((c) => ({
    entry: c.entryAnchor ? Xe(c.entryAnchor) : null,
    exit: c.exitAnchor ? Xe(c.exitAnchor) : null
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
function Xg(t) {
  const e = G(t.markCoverage), n = G(t.baseCoverage), o = ks(t.markArray), s = Xa(t.baseArray);
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
function Xa(t) {
  const e = t.length > 0 ? t[0].length : 0, n = t.map((a) => a.map(Xe));
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
function qg(t) {
  const e = G(t.markCoverage), n = G(t.ligatureCoverage), o = ks(t.markArray), s = Kg(t.ligatureArray, t.markClassCount);
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
function Kg(t, e) {
  const n = t.map((a) => {
    const c = a.map((p) => p.map(Xe));
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
function Jg(t) {
  const e = G(t.mark1Coverage), n = G(t.mark2Coverage), o = ks(t.mark1Array), s = Xa(t.mark2Array);
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
function Qg(t) {
  const e = Za(t.subtable, t.extensionLookupType), n = 8, o = new v(n + e.length);
  return o.uint16(1), o.uint16(t.extensionLookupType), o.uint32(n), o.rawBytes(e), o.toArray();
}
function tp(t) {
  const e = new R(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.uint16();
  let a = 0;
  o >= 1 && (a = e.uint32());
  const c = {
    majorVersion: n,
    minorVersion: o,
    scriptList: Oa(e, s),
    featureList: Ea(e, r),
    lookupList: Ra(e, i, qa, 7)
  };
  return a !== 0 && (c.featureVariations = Ua(
    e,
    a
  )), c;
}
function qa(t, e, n) {
  switch (n) {
    case 1:
      return ep(t, e);
    case 2:
      return np(t, e);
    case 3:
      return op(t, e);
    case 4:
      return sp(t, e);
    case 5:
      return La(t, e);
    case 6:
      return $a(t, e);
    case 7:
      return rp(t, e);
    case 8:
      return ip(t, e);
    default:
      throw new Error(`Unknown GSUB lookup type: ${n}`);
  }
}
function ep(t, e) {
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
function np(t, e) {
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
function op(t, e) {
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
function sp(t, e) {
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
function rp(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown ExtensionSubst format: ${n}`);
  const o = t.uint16(), s = t.uint32(), r = qa(
    t,
    e + s,
    o
  );
  return { format: n, extensionLookupType: o, extensionOffset: s, subtable: r };
}
function ip(t, e) {
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
function ap(t) {
  const { majorVersion: e, minorVersion: n } = t, o = ka(t.scriptList), s = Da(t.featureList), r = Ma(t.lookupList, Ka, 7), i = t.featureVariations ? za(t.featureVariations) : null;
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
function Ka(t, e) {
  switch (e) {
    case 1:
      return cp(t);
    case 2:
      return fp(t);
    case 3:
      return lp(t);
    case 4:
      return up(t);
    case 5:
      return Ba(t);
    case 6:
      return Ga(t);
    case 7:
      return gp(t);
    case 8:
      return pp(t);
    default:
      throw new Error(`Unknown GSUB lookup type: ${e}`);
  }
}
function cp(t) {
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
function fp(t) {
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
function lp(t) {
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
function up(t) {
  const e = G(t.coverage), n = t.ligatureSets.map(hp);
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
function hp(t) {
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
function gp(t) {
  const e = Ka(t.subtable, t.extensionLookupType), n = 8, o = new v(n + e.length);
  return o.uint16(1), o.uint16(t.extensionLookupType), o.uint32(n), o.rawBytes(e), o.toArray();
}
function pp(t) {
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
const dp = 8;
function mp(t, e) {
  const n = new R(t), o = n.uint16(), s = n.uint16(), r = n.uint32(), i = e?.maxp?.numGlyphs, a = [];
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
function yp(t) {
  const e = t.version ?? 0, n = t.records ?? [], o = Math.max(
    0,
    ...n.map((f) => (f.widths ?? []).length)
  ), s = xp(2 + o), r = t.sizeDeviceRecord ?? s, i = Math.max(2, r), a = dp + i * n.length, c = new v(a);
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
function xp(t) {
  return t + (4 - t % 4) % 4;
}
const Sp = 54;
function Zo(t) {
  const e = new R(t);
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
function Ja(t) {
  const e = new v(Sp);
  return e.uint16(t.majorVersion), e.uint16(t.minorVersion), e.fixed(t.fontRevision), e.uint32(t.checksumAdjustment), e.uint32(t.magicNumber), e.uint16(t.flags), e.uint16(t.unitsPerEm), e.longDateTime(t.created), e.longDateTime(t.modified), e.int16(t.xMin), e.int16(t.yMin), e.int16(t.xMax), e.int16(t.yMax), e.uint16(t.macStyle), e.uint16(t.lowestRecPPEM), e.int16(t.fontDirectionHint), e.int16(t.indexToLocFormat), e.int16(t.glyphDataFormat), e.toArray();
}
const _p = 36;
function wp(t) {
  const e = new R(t);
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
function bp(t) {
  const e = new v(_p);
  return e.uint16(t.majorVersion), e.uint16(t.minorVersion), e.fword(t.ascender), e.fword(t.descender), e.fword(t.lineGap), e.ufword(t.advanceWidthMax), e.fword(t.minLeftSideBearing), e.fword(t.minRightSideBearing), e.fword(t.xMaxExtent), e.int16(t.caretSlopeRise), e.int16(t.caretSlopeRun), e.int16(t.caretOffset), e.int16(t.reserved1), e.int16(t.reserved2), e.int16(t.reserved3), e.int16(t.reserved4), e.int16(t.metricDataFormat), e.uint16(t.numberOfHMetrics), e.toArray();
}
function Ap(t, e) {
  const n = e.hhea.numberOfHMetrics, o = e.maxp.numGlyphs, s = new R(t), r = [];
  for (let c = 0; c < n; c++)
    r.push({
      advanceWidth: s.ufword(),
      lsb: s.fword()
    });
  const i = o - n, a = s.array("fword", i);
  return { hMetrics: r, leftSideBearings: a };
}
function Cp(t) {
  const { hMetrics: e, leftSideBearings: n } = t, o = e.length * 4 + n.length * 2, s = new v(o);
  for (const r of e)
    s.ufword(r.advanceWidth), s.fword(r.lsb);
  return s.array("fword", n), s.toArray();
}
const vp = 20, Qa = 15, tc = 48;
function Ip(t) {
  const e = new R(t), n = e.uint16(), o = e.uint16(), s = e.offset32(), r = e.offset32(), i = e.offset32(), a = e.offset32();
  return {
    majorVersion: n,
    minorVersion: o,
    itemVariationStore: s ? Ut(
      t.slice(
        s,
        ec(t.length, s, [
          r,
          i,
          a
        ])
      )
    ) : null,
    advanceWidthMapping: So(
      t,
      r,
      [s, i, a]
    ),
    lsbMapping: So(t, i, [
      s,
      r,
      a
    ]),
    rsbMapping: So(t, a, [
      s,
      r,
      i
    ])
  };
}
function So(t, e, n) {
  if (!e)
    return null;
  const o = ec(t.length, e, n);
  if (o <= e || e >= t.length)
    return { format: 0, entryFormat: 0, mapCount: 0, entries: [], _raw: [] };
  const s = Array.from(t.slice(e, o));
  return {
    ...Op(s),
    _raw: s
  };
}
function ec(t, e, n) {
  return n.filter((s) => s > e).sort((s, r) => s - r)[0] ?? t;
}
function Op(t) {
  const e = new R(t), n = e.uint8(), o = e.uint8(), s = n === 1 ? e.uint32() : e.uint16(), r = (o & Qa) + 1, i = ((o & tc) >> 4) + 1, a = [];
  for (let c = 0; c < s; c++) {
    const f = Mp(e, i);
    a.push(Dp(f, r));
  }
  return {
    format: n,
    entryFormat: o,
    mapCount: s,
    entries: a
  };
}
function kp(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.itemVariationStore ? ne(t.itemVariationStore) : [], s = _o(
    t.advanceWidthMapping
  ), r = _o(t.lsbMapping), i = _o(t.rsbMapping);
  let a = vp;
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
function _o(t) {
  return t ? t._raw ? t._raw : Ep(t) : [];
}
function Ep(t) {
  const e = t.entries ?? [], n = t.mapCount ?? e.length, o = Fp(e), s = t.format ?? (n > 65535 ? 1 : 0), r = t.entryFormat ?? o.entryFormat, i = (r & Qa) + 1, a = ((r & tc) >> 4) + 1, c = s === 1 ? 6 : 4, f = new v(c + n * a);
  f.uint8(s), f.uint8(r), s === 1 ? f.uint32(n) : f.uint16(n);
  for (let l = 0; l < n; l++) {
    const u = e[l] ?? { outerIndex: 0, innerIndex: 0 }, h = Tp(u, i);
    Lp(f, h, a);
  }
  return f.toArray();
}
function Tp(t, e) {
  const n = (1 << e) - 1;
  return (t.outerIndex ?? 0) << e | (t.innerIndex ?? 0) & n;
}
function Dp(t, e) {
  const n = (1 << e) - 1;
  return {
    outerIndex: t >> e,
    innerIndex: t & n
  };
}
function Fp(t) {
  let e = 0, n = 0;
  for (const a of t)
    e = Math.max(e, a.innerIndex ?? 0), n = Math.max(n, a.outerIndex ?? 0);
  let o = 1;
  for (; (1 << o) - 1 < e && o < 16; )
    o++;
  const s = n << o | e;
  let r = 1;
  for (; r < 4 && s > Rp(r); )
    r++;
  return { entryFormat: r - 1 << 4 | o - 1 };
}
function Rp(t) {
  return t === 1 ? 255 : t === 2 ? 65535 : t === 3 ? 16777215 : 4294967295;
}
function Mp(t, e) {
  return e === 1 ? t.uint8() : e === 2 ? t.uint16() : e === 3 ? t.uint24() : t.uint32();
}
function Lp(t, e, n) {
  n === 1 ? t.uint8(e) : n === 2 ? t.uint16(e) : n === 3 ? t.uint24(e) : t.uint32(e >>> 0);
}
const Bp = 6, Vp = 6;
function $p(t) {
  const e = new R(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = [];
  for (let c = 0; c < s; c++)
    r.push({
      tag: e.tag(),
      offset: e.offset16()
    });
  const i = r.map((c) => c.offset).filter((c) => c > 0), a = r.map((c) => ({
    ...c,
    table: Gp(t, c.offset, i)
  }));
  return {
    majorVersion: n,
    minorVersion: o,
    scripts: a
  };
}
function Np(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.scripts ?? [], s = o.map((c) => Pp(c.table));
  let r = Bp + o.length * Vp;
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
function Gp(t, e, n) {
  if (!e)
    return null;
  const s = n.filter((r) => r > e).sort((r, i) => r - i)[0] ?? t.length;
  return s <= e || e >= t.length ? { _raw: [] } : { _raw: Array.from(t.slice(e, s)) };
}
function Pp(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
const nc = 4, Dn = 6, oc = 8, Fn = 8;
function Up(t) {
  const e = new R(t);
  return (t.length >= 4 ? e.uint32() : 0) === 65536 ? Yp(t) : zp(t);
}
function zp(t) {
  const e = new R(t), n = e.uint16(), o = e.uint16(), s = [];
  let r = nc;
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
    l === 0 ? Object.assign(g, sc(p)) : l === 2 ? Object.assign(g, rc(p)) : g._raw = p, s.push(g), r = u;
  }
  return {
    formatVariant: "opentype",
    version: n,
    nTables: o,
    subtables: s
  };
}
function sc(t) {
  const e = new R(t);
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
function Hp(t) {
  return sc(t);
}
function rc(t) {
  const e = new R(t);
  if (t.length < 8) return { _raw: t };
  const n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = Lr(e, t, o), a = Lr(e, t, s), c = n > 0 ? n / 2 : 0, f = n > 0 && i.maxOffset >= r ? Math.floor((i.maxOffset - r) / n) + 1 : 1, l = [];
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
function Lr(t, e, n) {
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
function Wp(t) {
  const e = new R(t);
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
function jp(t) {
  const e = new R(t);
  if (t.length < 12) return { _raw: t };
  const n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.uint16();
  let a = 0, c = 0, f = [];
  if (o + 4 <= t.length) {
    e.seek(o), a = e.uint16(), c = e.uint16(), f = [];
    for (let m = 0; m < c; m++)
      e.position < t.length ? f.push(e.uint8()) : f.push(1);
  }
  const l = Math.min(r, t.length), u = n > 0 ? Math.floor((l - s) / n) : 0, h = [];
  for (let m = 0; m < u; m++) {
    const y = s + m * n;
    e.seek(y);
    const w = [];
    for (let S = 0; S < n; S++)
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
function Yp(t) {
  const e = new R(t), n = e.uint32(), o = e.uint32(), s = [];
  let r = oc;
  for (let i = 0; i < o && !(r + Fn > t.length); i++) {
    e.seek(r);
    const a = e.uint32(), c = e.uint8(), f = e.uint8(), l = e.uint16(), u = Math.min(
      t.length,
      r + Math.max(a, Fn)
    ), h = Array.from(
      t.slice(r + Fn, u)
    ), p = {
      coverage: c,
      format: f,
      tupleIndex: l
    };
    f === 0 ? Object.assign(p, Hp(h)) : f === 1 ? Object.assign(p, jp(h)) : f === 2 ? Object.assign(p, rc(h)) : f === 3 ? Object.assign(p, Wp(h)) : p._raw = h, s.push(p), r = u;
  }
  return {
    formatVariant: "apple",
    version: n,
    nTables: o,
    subtables: s
  };
}
function Zp(t) {
  return t.formatVariant === "apple" ? Kp(t) : Xp(t);
}
function Xp(t) {
  const e = t.version ?? 0, n = t.subtables ?? [], o = n.map(
    (a) => qp(a)
  ), s = n.length, r = nc + o.reduce((a, c) => a + c.length, 0), i = new v(r);
  i.uint16(e), i.uint16(s);
  for (const a of o)
    i.rawBytes(a);
  return i.toArray();
}
function qp(t) {
  const e = t._raw ? t._raw : t.format === 0 ? ic(t) : t.format === 2 ? ac(t) : [], n = Dn + e.length, o = t.coverage ?? (t.format ?? 0) << 8, s = new v(n);
  return s.uint16(t.version ?? 0), s.uint16(n), s.uint16(o), s.rawBytes(e), s.toArray();
}
function ic(t) {
  const e = t.pairs ?? [], n = e.length, o = Math.floor(Math.log2(Math.max(1, n))), s = Math.pow(2, o) * 6, r = n * 6 - s, i = new v(8 + n * 6);
  i.uint16(n), i.uint16(t.searchRange ?? s), i.uint16(t.entrySelector ?? o), i.uint16(t.rangeShift ?? r);
  for (const a of e)
    i.uint16(a.left), i.uint16(a.right), i.int16(a.value);
  return i.toArray();
}
function Kp(t) {
  const e = t.version ?? 65536, n = t.subtables ?? [], o = n.map((a) => {
    const c = Jp(a), f = Fn + c.length, l = new v(f);
    return l.uint32(f), l.uint8(a.coverage ?? 0), l.uint8(a.format ?? 0), l.uint16(a.tupleIndex ?? 0), l.rawBytes(c), l.toArray();
  }), s = n.length, r = oc + o.reduce((a, c) => a + c.length, 0), i = new v(r);
  i.uint32(e), i.uint32(s);
  for (const a of o)
    i.rawBytes(a);
  return i.toArray();
}
function Jp(t) {
  if (t._raw) return t._raw;
  switch (t.format) {
    case 0:
      return ic(t);
    case 1:
      return td(t);
    case 2:
      return ac(t);
    case 3:
      return Qp(t);
    default:
      return [];
  }
}
function ac(t) {
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
  } = t, l = Br(r), u = Br(i), h = a * c * 2, p = Math.max(
    s + h,
    n + l.length,
    o + u.length,
    8
    // header
  ), g = new v(p);
  g.uint16(e), g.uint16(n), g.uint16(o), g.uint16(s), g.seek(n), g.rawBytes(l), g.seek(o), g.rawBytes(u), g.seek(s);
  for (let d = 0; d < a; d++) {
    const x = f[d] || [];
    for (let m = 0; m < c; m++)
      g.int16(x[m] || 0);
  }
  return g.toArray();
}
function Br(t) {
  const { firstGlyph: e, nGlyphs: n, offsets: o } = t, s = new v(4 + n * 2);
  s.uint16(e), s.uint16(n);
  for (let r = 0; r < n; r++)
    s.uint16(o[r] || 0);
  return s.toArray();
}
function Qp(t) {
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
function td(t) {
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
function ed(t) {
  const e = new R(t), n = e.uint32(), o = e.uint32(), s = e.uint32(), r = [], i = [];
  for (let a = 0; a < s; a++)
    i.push({ offset: e.uint16(), length: e.uint16() });
  for (const a of i) {
    const c = t.slice(a.offset, a.offset + a.length);
    r.push(new TextDecoder("utf-8").decode(new Uint8Array(c)));
  }
  return { version: n, flags: o, tags: r };
}
function nd(t) {
  const { version: e, flags: n, tags: o } = t, s = new TextEncoder(), r = o.map((l) => s.encode(l)), i = 12 + o.length * 4, a = i + r.reduce((l, u) => l + u.length, 0), c = new v(a);
  c.uint32(e), c.uint32(n), c.uint32(o.length);
  let f = i;
  for (const l of r)
    c.uint16(f), c.uint16(l.length), f += l.length;
  for (const l of r)
    c.rawBytes(l);
  return c.toArray();
}
function od(t) {
  const e = new R(t), n = e.uint16(), o = e.uint16(), s = e.bytes(o);
  return {
    version: n,
    numGlyphs: o,
    yPels: s
  };
}
function sd(t) {
  const e = t.version ?? 0, n = t.yPels ?? [], o = t.numGlyphs ?? n.length, s = n.slice(0, o);
  for (; s.length < o; )
    s.push(0);
  const r = new v(4 + o);
  return r.uint16(e), r.uint16(o), r.rawBytes(s), r.toArray();
}
const rd = 10;
function id(t) {
  const e = new R(t), n = e.uint32(), o = e.offset16(), s = e.offset16(), r = e.offset16(), i = [
    o,
    s,
    r
  ].filter((a) => a > 0);
  return {
    version: n,
    mathConstants: wo(t, o, i),
    mathGlyphInfo: wo(t, s, i),
    mathVariants: wo(t, r, i)
  };
}
function ad(t) {
  const e = t.version ?? 65536, n = bo(t.mathConstants), o = bo(t.mathGlyphInfo), s = bo(t.mathVariants);
  let r = rd;
  const i = n.length ? r : 0;
  r += n.length;
  const a = o.length ? r : 0;
  r += o.length;
  const c = s.length ? r : 0;
  r += s.length;
  const f = new v(r);
  return f.uint32(e), f.offset16(i), f.offset16(a), f.offset16(c), f.rawBytes(n), f.rawBytes(o), f.rawBytes(s), f.toArray();
}
function wo(t, e, n) {
  if (!e)
    return null;
  const s = n.filter((r) => r > e).sort((r, i) => r - i)[0] ?? t.length;
  return s <= e || e >= t.length ? { _raw: [] } : { _raw: Array.from(t.slice(e, s)) };
}
function bo(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
const cd = 6, fd = 32;
function ld(t) {
  const e = new R(t), n = e.uint32(), o = e.uint16(), s = { version: n, numGlyphs: o };
  return n === 65536 && (s.maxPoints = e.uint16(), s.maxContours = e.uint16(), s.maxCompositePoints = e.uint16(), s.maxCompositeContours = e.uint16(), s.maxZones = e.uint16(), s.maxTwilightPoints = e.uint16(), s.maxStorage = e.uint16(), s.maxFunctionDefs = e.uint16(), s.maxInstructionDefs = e.uint16(), s.maxStackElements = e.uint16(), s.maxSizeOfInstructions = e.uint16(), s.maxComponentElements = e.uint16(), s.maxComponentDepth = e.uint16()), s;
}
function ud(t) {
  const e = t.version === 65536, n = e ? fd : cd, o = new v(n);
  return o.uint32(t.version), o.uint16(t.numGlyphs), e && (o.uint16(t.maxPoints), o.uint16(t.maxContours), o.uint16(t.maxCompositePoints), o.uint16(t.maxCompositeContours), o.uint16(t.maxZones), o.uint16(t.maxTwilightPoints), o.uint16(t.maxStorage), o.uint16(t.maxFunctionDefs), o.uint16(t.maxInstructionDefs), o.uint16(t.maxStackElements), o.uint16(t.maxSizeOfInstructions), o.uint16(t.maxComponentElements), o.uint16(t.maxComponentDepth)), o.toArray();
}
function hd(t) {
  if (!t.length)
    return { version: 0, data: [] };
  const e = new R(t), n = t.length >= 2 ? e.uint16() : 0, o = t.length >= 2 ? Array.from(t.slice(2)) : [];
  return {
    version: n,
    data: o
  };
}
function gd(t) {
  const e = t.version ?? 0, n = t.data ?? [], o = new v(2 + n.length);
  return o.uint16(e), o.rawBytes(n), o.toArray();
}
const cc = 16, pd = 12;
function dd(t) {
  const e = new R(t), n = e.uint32(), o = e.uint32(), s = e.uint32(), r = e.uint32(), i = [];
  for (let a = 0; a < r; a++) {
    const c = e.tag(), f = e.uint32(), l = e.uint32(), u = f, h = Math.min(t.length, u + l), p = u < cc || u >= t.length || h < u ? [] : Array.from(t.slice(u, h));
    i.push({ tag: c, dataOffset: f, dataLength: l, data: p });
  }
  return {
    version: n,
    flags: o,
    reserved: s,
    dataMaps: i
  };
}
function md(t) {
  const e = t.version ?? 1, n = t.flags ?? 0, o = t.reserved ?? 0, r = (t.dataMaps ?? []).map((f) => ({
    tag: (f.tag ?? "    ").slice(0, 4).padEnd(4, " "),
    data: f.data ?? []
  }));
  let i = cc + r.length * pd;
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
const Xo = 12, ge = 8;
function yd(t) {
  const e = new R(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.uint16(), a = e.offset16(), c = [];
  for (let l = 0; l < i; l++) {
    const u = Xo + l * r;
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
  const f = a > 0 && a < t.length ? Ut(t.slice(a)) : null;
  return {
    majorVersion: n,
    minorVersion: o,
    reserved: s,
    valueRecordSize: r,
    valueRecords: c,
    itemVariationStore: f
  };
}
function xd(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.reserved ?? 0, s = [...t.valueRecords ?? []].sort(
    (p, g) => Sd(p.valueTag, g.valueTag)
  ), r = t.valueRecordSize ?? ge, i = s.reduce((p, g) => {
    const d = g._extra?.length ?? 0;
    return Math.max(p, ge + d);
  }, ge), a = Math.max(
    r,
    i
  ), c = s.length, f = t.itemVariationStore ? ne(t.itemVariationStore) : [], l = f.length > 0 || c > 0 ? Xo + c * a : 0, u = l > 0 ? l + f.length : Xo, h = new v(u);
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
function Sd(t, e) {
  const n = t ?? "    ", o = e ?? "    ";
  for (let s = 0; s < 4; s++) {
    const r = n.charCodeAt(s) - o.charCodeAt(s);
    if (r !== 0)
      return r;
  }
  return 0;
}
const qo = [
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
], Es = /* @__PURE__ */ new Map();
for (let t = 0; t < 128; t++)
  Es.set(t, t);
for (let t = 0; t < qo.length; t++)
  Es.set(qo[t], 128 + t);
function _d(t, e, n) {
  return e === 0 || e === 3 ? Ko(t) : e === 1 && n === 0 ? bd(t) : t.length % 2 === 0 ? Ko(t) : "0x:" + t.map((o) => o.toString(16).padStart(2, "0")).join("");
}
function wd(t, e, n) {
  if (t.startsWith("0x:")) {
    const o = t.slice(3), s = [];
    for (let r = 0; r < o.length; r += 2)
      s.push(parseInt(o.slice(r, r + 2), 16));
    return s;
  }
  return e === 0 || e === 3 ? Jo(t) : e === 1 && n === 0 ? Ad(t) : Jo(t);
}
function Ko(t) {
  const e = [];
  for (let n = 0; n + 1 < t.length; n += 2) {
    const o = t[n] << 8 | t[n + 1];
    e.push(o);
  }
  return String.fromCharCode(...e);
}
function Jo(t) {
  const e = [];
  for (let n = 0; n < t.length; n++) {
    const o = t.charCodeAt(n);
    e.push(o >> 8 & 255, o & 255);
  }
  return e;
}
function bd(t) {
  return t.map((e) => e < 128 ? String.fromCharCode(e) : String.fromCharCode(qo[e - 128])).join("");
}
function Ad(t) {
  const e = [];
  for (let n = 0; n < t.length; n++) {
    const o = t.charCodeAt(n), s = Es.get(o);
    e.push(s !== void 0 ? s : 63);
  }
  return e;
}
function Cd(t) {
  const e = new R(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = [];
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
        tag: Ko(p)
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
      value: _d(l, f.platformID, f.encodingID)
    };
  }), c = { version: n, names: a };
  return n === 1 && i.length > 0 && (c.langTagRecords = i), c;
}
function vd(t) {
  const { version: e, names: n, langTagRecords: o = [] } = t, r = [...n].sort((_, b) => _.platformID !== b.platformID ? _.platformID - b.platformID : _.encodingID !== b.encodingID ? _.encodingID - b.encodingID : _.languageID !== b.languageID ? _.languageID - b.languageID : _.nameID - b.nameID).map((_) => ({
    platformID: _.platformID,
    encodingID: _.encodingID,
    languageID: _.languageID,
    nameID: _.nameID,
    bytes: wd(_.value, _.platformID, _.encodingID)
  })), i = o.map((_) => Jo(_.tag)), a = 6, c = 12, u = e === 1 ? (e === 1 ? 2 : 0) + o.length * 4 : 0, h = a + r.length * c + u, p = [];
  let g = 0;
  const d = /* @__PURE__ */ new Map();
  function x(_) {
    const b = _.join(",");
    if (d.has(b))
      return d.get(b);
    const A = g;
    return d.set(b, A), p.push(_), g += _.length, A;
  }
  const m = r.map((_) => ({
    ..._,
    stringOffset: x(_.bytes),
    stringLength: _.bytes.length
  })), y = i.map((_) => ({
    stringOffset: x(_),
    stringLength: _.length
  })), w = h + g, S = new v(w);
  S.uint16(e), S.uint16(r.length), S.uint16(h);
  for (const _ of m)
    S.uint16(_.platformID).uint16(_.encodingID).uint16(_.languageID).uint16(_.nameID).uint16(_.stringLength).uint16(_.stringOffset);
  if (e === 1) {
    S.uint16(y.length);
    for (const _ of y)
      S.uint16(_.stringLength).uint16(_.stringOffset);
  }
  for (const _ of p)
    S.rawBytes(_);
  return S.toArray();
}
const fc = 78, lc = 86, uc = 96, hc = 100;
function Id(t) {
  const e = new R(t), n = t.length, o = {};
  return o.version = e.uint16(), o.xAvgCharWidth = e.fword(), o.usWeightClass = e.uint16(), o.usWidthClass = e.uint16(), o.fsType = e.uint16(), o.ySubscriptXSize = e.fword(), o.ySubscriptYSize = e.fword(), o.ySubscriptXOffset = e.fword(), o.ySubscriptYOffset = e.fword(), o.ySuperscriptXSize = e.fword(), o.ySuperscriptYSize = e.fword(), o.ySuperscriptXOffset = e.fword(), o.ySuperscriptYOffset = e.fword(), o.yStrikeoutSize = e.fword(), o.yStrikeoutPosition = e.fword(), o.sFamilyClass = e.int16(), o.panose = e.bytes(10), o.ulUnicodeRange1 = e.uint32(), o.ulUnicodeRange2 = e.uint32(), o.ulUnicodeRange3 = e.uint32(), o.ulUnicodeRange4 = e.uint32(), o.achVendID = e.tag(), o.fsSelection = e.uint16(), o.usFirstCharIndex = e.uint16(), o.usLastCharIndex = e.uint16(), n < fc || (o.sTypoAscender = e.fword(), o.sTypoDescender = e.fword(), o.sTypoLineGap = e.fword(), o.usWinAscent = e.ufword(), o.usWinDescent = e.ufword(), o.version < 1 || n < lc) || (o.ulCodePageRange1 = e.uint32(), o.ulCodePageRange2 = e.uint32(), o.version < 2 || n < uc) || (o.sxHeight = e.fword(), o.sCapHeight = e.fword(), o.usDefaultChar = e.uint16(), o.usBreakChar = e.uint16(), o.usMaxContext = e.uint16(), o.version < 5 || n < hc) || (o.usLowerOpticalPointSize = e.uint16(), o.usUpperOpticalPointSize = e.uint16()), o;
}
function Od(t) {
  const e = t.version;
  let n;
  e >= 5 ? n = hc : e >= 2 ? n = uc : e >= 1 ? n = lc : n = t.sTypoAscender !== void 0 ? fc : 68;
  const o = new v(n);
  return o.uint16(e).fword(t.xAvgCharWidth).uint16(t.usWeightClass).uint16(t.usWidthClass).uint16(t.fsType).fword(t.ySubscriptXSize).fword(t.ySubscriptYSize).fword(t.ySubscriptXOffset).fword(t.ySubscriptYOffset).fword(t.ySuperscriptXSize).fword(t.ySuperscriptYSize).fword(t.ySuperscriptXOffset).fword(t.ySuperscriptYOffset).fword(t.yStrikeoutSize).fword(t.yStrikeoutPosition).int16(t.sFamilyClass).rawBytes(t.panose).uint32(t.ulUnicodeRange1).uint32(t.ulUnicodeRange2).uint32(t.ulUnicodeRange3).uint32(t.ulUnicodeRange4).tag(t.achVendID).uint16(t.fsSelection).uint16(t.usFirstCharIndex).uint16(t.usLastCharIndex), n <= 68 || (o.fword(t.sTypoAscender).fword(t.sTypoDescender).fword(t.sTypoLineGap).ufword(t.usWinAscent).ufword(t.usWinDescent), e < 1) || (o.uint32(t.ulCodePageRange1).uint32(t.ulCodePageRange2), e < 2) || (o.fword(t.sxHeight).fword(t.sCapHeight).uint16(t.usDefaultChar).uint16(t.usBreakChar).uint16(t.usMaxContext), e < 5) || o.uint16(t.usLowerOpticalPointSize).uint16(t.usUpperOpticalPointSize), o.toArray();
}
const kd = 54;
function Ed(t) {
  const e = new R(t);
  return {
    version: e.uint32(),
    fontNumber: e.uint32(),
    pitch: e.uint16(),
    xHeight: e.uint16(),
    style: e.uint16(),
    typeFamily: e.uint16(),
    capHeight: e.uint16(),
    symbolSet: e.uint16(),
    typeface: Ao(e.bytes(16)),
    characterComplement: Ao(e.bytes(8)),
    fileName: Ao(e.bytes(6)),
    strokeWeight: e.int8(),
    widthType: e.int8(),
    serifStyle: e.uint8(),
    reserved: e.uint8()
  };
}
function Td(t) {
  const e = new v(kd);
  return e.uint32(t.version ?? 65536), e.uint32(t.fontNumber ?? 0), e.uint16(t.pitch ?? 0), e.uint16(t.xHeight ?? 0), e.uint16(t.style ?? 0), e.uint16(t.typeFamily ?? 0), e.uint16(t.capHeight ?? 0), e.uint16(t.symbolSet ?? 0), e.rawBytes(Co(t.typeface ?? "", 16)), e.rawBytes(Co(t.characterComplement ?? "", 8)), e.rawBytes(Co(t.fileName ?? "", 6)), e.int8(t.strokeWeight ?? 0), e.int8(t.widthType ?? 0), e.uint8(t.serifStyle ?? 0), e.uint8(t.reserved ?? 0), e.toArray();
}
function Ao(t) {
  return String.fromCharCode(...t).replace(/\0+$/g, "");
}
function Co(t, e) {
  const n = new Array(e).fill(0);
  for (let o = 0; o < e && o < t.length; o++) {
    const s = t.charCodeAt(o);
    n[o] = s >= 0 && s <= 127 ? s : 63;
  }
  return n;
}
const Ts = 32, Qo = [
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
], gc = new Map(
  Qo.map((t, e) => [t, e])
);
function Dd(t) {
  const e = new R(t), n = e.uint32(), o = e.fixed(), s = e.fword(), r = e.fword(), i = e.uint32(), a = e.uint32(), c = e.uint32(), f = e.uint32(), l = e.uint32(), u = {
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
    for (const y of p)
      y > g && (g = y);
    const d = g >= 258 ? g - 258 + 1 : 0, x = [];
    for (let y = 0; y < d; y++) {
      const w = e.uint8(), S = e.bytes(w);
      x.push(String.fromCharCode(...S));
    }
    const m = p.map((y) => y < 258 ? Qo[y] : x[y - 258]);
    return u.glyphNames = m, u;
  }
  if (n === 151552) {
    const h = e.uint16(), g = e.array("int8", h).map(
      (d, x) => Qo[x + d]
    );
    return u.glyphNames = g, u;
  }
  return u;
}
function pc(t) {
  const { version: e } = t;
  return e === 65536 || e === 196608 ? Vr(t) : e === 131072 ? Fd(t) : e === 151552 ? Rd(t) : Vr(t);
}
function Vr(t) {
  const e = new v(Ts);
  return e.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), e.toArray();
}
function Fd(t) {
  const { glyphNames: e } = t, n = e.length, o = [], s = [], r = /* @__PURE__ */ new Map();
  for (const f of e) {
    const l = gc.get(f);
    l !== void 0 ? o.push(l) : (r.has(f) || (r.set(f, s.length), s.push(f)), o.push(258 + r.get(f)));
  }
  let i = 0;
  for (const f of s)
    i += 1 + f.length;
  const a = Ts + 2 + n * 2 + i, c = new v(a);
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
function Rd(t) {
  const { glyphNames: e } = t, n = e.length, o = Ts + 2 + n, s = new v(o);
  s.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), s.uint16(n);
  for (let r = 0; r < n; r++) {
    const i = e[r], c = gc.get(i) - r;
    s.int8(c);
  }
  return s.toArray();
}
function Md(t, e) {
  const n = new R(t), o = n.uint16(), s = n.uint16(), r = n.uint32(), i = n.array("uint32", r);
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
      const m = l + g[x], y = l + g[x + 1], w = y - m;
      if (w <= 0) {
        d.push(null);
        continue;
      }
      n.seek(m);
      const S = n.int16(), _ = n.int16(), b = n.tag(), A = w > 8 ? t.slice(m + 8, y) : [];
      d.push({ originOffsetX: S, originOffsetY: _, graphicType: b, imageData: A });
    }
    c.push({ ppem: h, ppi: p, glyphs: d });
  }
  return { version: o, flags: s, strikes: c };
}
function Ld(t) {
  const e = t.version ?? 1, n = t.flags ?? 0, o = t.strikes ?? [], s = o.map((f) => f._raw ? f._raw : Bd(f));
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
function Bd(t) {
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
const Vd = 18, dc = 20, pe = 8;
function $d(t) {
  const e = new R(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.offset32(), a = e.uint16(), c = e.offset32();
  let f;
  o >= 1 && t.length >= dc && (f = e.uint16());
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
    const d = u[g], x = c + d, m = g < u.length - 1 ? c + u[g + 1] : t.length;
    if (x >= t.length || m < x) {
      h.push({ format: 0, _raw: [] });
      continue;
    }
    h.push(Nd(t, x, m));
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
function Nd(t, e, n) {
  const o = new R(t);
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
function Gd(t) {
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
  const f = c ? dc : Vd, l = o.length, u = s.length, h = l > 0 ? f : 0, p = l * a, g = u > 0 ? f + p : 0, d = u * 2, x = s.map(
    (b) => Pd(b)
  );
  let m = d;
  const y = x.map((b) => {
    const A = m;
    return m += b.length, A;
  }), w = x.reduce(
    (b, A) => b + A.length,
    0
  ), S = f + p + d + w, _ = new v(S);
  _.uint16(e), _.uint16(n), _.uint16(a), _.uint16(l), _.offset32(h), _.uint16(u), _.offset32(g), c && _.uint16(t.elidedFallbackNameID ?? 2);
  for (const b of o) {
    _.tag(b.axisTag), _.uint16(b.axisNameID ?? 0), _.uint16(b.axisOrdering ?? 0);
    const A = b._extra ?? [];
    _.rawBytes(A);
    const k = a - pe - A.length;
    k > 0 && _.rawBytes(new Array(k).fill(0));
  }
  for (const b of y)
    _.offset16(b);
  for (const b of x)
    _.rawBytes(b);
  return _.toArray();
}
function Pd(t) {
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
      throw new Error(`Unsupported STAT axis value format: ${t.format}`);
  }
}
function Ud(t) {
  const e = new R(t), n = e.uint16(), o = e.uint32();
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
function zd(t) {
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
const Hd = 6, Wd = 4, jd = 2, mc = 6;
function Yd(t) {
  const e = new R(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = [];
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
  const a = [...new Set(i)].sort((u, h) => u - h), c = a.map((u) => Xd(t, u)), f = new Map(
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
function Zd(t) {
  const e = t.version ?? 0, n = t.ratios ?? [], o = t.groups ?? [], s = o.map((l) => qd(l)), r = t.numRecs ?? Math.max(0, ...o.map((l) => (l.entries ?? []).length)), i = n.length;
  let a = Hd + i * Wd + i * jd;
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
function Xd(t, e) {
  if (!e || e >= t.length)
    return { recs: 0, startsz: 0, endsz: 0, entries: [] };
  const n = new R(t, e), o = n.uint16(), s = n.uint8(), r = n.uint8(), i = [];
  for (let a = 0; a < o && !(n.position + mc > t.length); a++)
    i.push({
      yPelHeight: n.uint16(),
      yMax: n.int16(),
      yMin: n.int16()
    });
  return { recs: o, startsz: s, endsz: r, entries: i };
}
function qd(t) {
  const e = t.entries ?? [], n = t.recs ?? e.length, o = e.slice(0, n);
  for (; o.length < n; )
    o.push({ yPelHeight: 0, yMax: 0, yMin: 0 });
  const s = new v(4 + n * mc);
  s.uint16(n), s.uint8(t.startsz ?? 0), s.uint8(t.endsz ?? 0);
  for (const r of o)
    s.uint16(r.yPelHeight ?? 0), s.int16(r.yMax ?? 0), s.int16(r.yMin ?? 0);
  return s.toArray();
}
const Kd = 36;
function Jd(t) {
  const e = new R(t);
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
function Qd(t) {
  const e = new v(Kd);
  return e.uint32(t.version), e.fword(t.vertTypoAscender), e.fword(t.vertTypoDescender), e.fword(t.vertTypoLineGap), e.ufword(t.advanceHeightMax), e.fword(t.minTopSideBearing), e.fword(t.minBottomSideBearing), e.fword(t.yMaxExtent), e.int16(t.caretSlopeRise), e.int16(t.caretSlopeRun), e.int16(t.caretOffset), e.int16(t.reserved1), e.int16(t.reserved2), e.int16(t.reserved3), e.int16(t.reserved4), e.int16(t.metricDataFormat), e.uint16(t.numOfLongVerMetrics), e.toArray();
}
function t1(t, e) {
  const n = e.vhea.numOfLongVerMetrics, o = e.maxp.numGlyphs, s = new R(t), r = [];
  for (let c = 0; c < n; c++)
    r.push({
      advanceHeight: s.ufword(),
      topSideBearing: s.fword()
    });
  const i = o - n, a = s.array("fword", i);
  return { vMetrics: r, topSideBearings: a };
}
function e1(t) {
  const { vMetrics: e, topSideBearings: n } = t, o = e.length * 4 + n.length * 2, s = new v(o);
  for (const r of e)
    s.ufword(r.advanceHeight), s.fword(r.topSideBearing);
  return s.array("fword", n), s.toArray();
}
const n1 = 24, yc = 15, xc = 48;
function o1(t) {
  const e = new R(t), n = e.uint16(), o = e.uint16(), s = e.offset32(), r = e.offset32(), i = e.offset32(), a = e.offset32(), c = e.offset32(), f = [
    s,
    r,
    i,
    a,
    c
  ];
  return {
    majorVersion: n,
    minorVersion: o,
    itemVariationStore: s ? Ut(
      t.slice(
        s,
        Sc(t.length, s, f)
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
  const o = Sc(t.length, e, n);
  if (o <= e || e >= t.length)
    return { format: 0, entryFormat: 0, mapCount: 0, entries: [], _raw: [] };
  const s = Array.from(t.slice(e, o));
  return {
    ...s1(s),
    _raw: s
  };
}
function Sc(t, e, n) {
  return n.filter((s) => s > e).sort((s, r) => s - r)[0] ?? t;
}
function s1(t) {
  const e = new R(t), n = e.uint8(), o = e.uint8(), s = n === 1 ? e.uint32() : e.uint16(), r = (o & yc) + 1, i = ((o & xc) >> 4) + 1, a = [];
  for (let c = 0; c < s; c++) {
    const f = u1(e, i);
    a.push(c1(f, r));
  }
  return {
    format: n,
    entryFormat: o,
    mapCount: s,
    entries: a
  };
}
function r1(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.itemVariationStore ? ne(t.itemVariationStore) : [], s = _n(
    t.advanceHeightMapping
  ), r = _n(t.tsbMapping), i = _n(t.bsbMapping), a = _n(t.vOrgMapping);
  let c = n1;
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
  return t ? t._raw ? t._raw : i1(t) : [];
}
function i1(t) {
  const e = t.entries ?? [], n = t.mapCount ?? e.length, o = f1(e), s = t.format ?? (n > 65535 ? 1 : 0), r = t.entryFormat ?? o.entryFormat, i = (r & yc) + 1, a = ((r & xc) >> 4) + 1, c = s === 1 ? 6 : 4, f = new v(c + n * a);
  f.uint8(s), f.uint8(r), s === 1 ? f.uint32(n) : f.uint16(n);
  for (let l = 0; l < n; l++) {
    const u = e[l] ?? { outerIndex: 0, innerIndex: 0 }, h = a1(u, i);
    h1(f, h, a);
  }
  return f.toArray();
}
function a1(t, e) {
  const n = (1 << e) - 1;
  return (t.outerIndex ?? 0) << e | (t.innerIndex ?? 0) & n;
}
function c1(t, e) {
  const n = (1 << e) - 1;
  return {
    outerIndex: t >> e,
    innerIndex: t & n
  };
}
function f1(t) {
  let e = 0, n = 0;
  for (const a of t)
    e = Math.max(e, a.innerIndex ?? 0), n = Math.max(n, a.outerIndex ?? 0);
  let o = 1;
  for (; (1 << o) - 1 < e && o < 16; )
    o++;
  const s = n << o | e;
  let r = 1;
  for (; r < 4 && s > l1(r); )
    r++;
  return { entryFormat: r - 1 << 4 | o - 1 };
}
function l1(t) {
  return t === 1 ? 255 : t === 2 ? 65535 : t === 3 ? 16777215 : 4294967295;
}
function u1(t, e) {
  return e === 1 ? t.uint8() : e === 2 ? t.uint16() : e === 3 ? t.uint24() : t.uint32();
}
function h1(t, e, n) {
  n === 1 ? t.uint8(e) : n === 2 ? t.uint16(e) : n === 3 ? t.uint24(e) : t.uint32(e >>> 0);
}
const eo = 32768, no = 4095, oo = 32768, so = 16384, ro = 8192, g1 = 4095, _c = 128, p1 = 127, wc = 128, bc = 64, d1 = 63;
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
    const r = t.uint8(), i = (r & p1) + 1, a = (r & _c) !== 0;
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
    const f = (i ? _c : 0) | a - 1;
    n.push(f);
    for (let l = 0; l < a; l++) {
      const u = o[r + l];
      i ? n.push(u >> 8 & 255, u & 255) : n.push(u & 255);
    }
    r += a;
  }
  return n;
}
function Ac(t, e) {
  const n = [];
  for (; n.length < e; ) {
    const o = t.uint8(), s = (o & d1) + 1;
    if (o & wc)
      for (let r = 0; r < s && n.length < e; r++)
        n.push(0);
    else if (o & bc)
      for (let r = 0; r < s && n.length < e; r++)
        n.push(t.int16());
    else
      for (let r = 0; r < s && n.length < e; r++)
        n.push(t.int8());
  }
  return n;
}
function Cc(t) {
  const e = [];
  let n = 0;
  for (; n < t.length; )
    if (t[n] === 0) {
      let o = 1;
      const s = Math.min(64, t.length - n);
      for (; o < s && t[n + o] === 0; )
        o++;
      e.push(wc | o - 1), n += o;
    } else if (t[n] < -128 || t[n] > 127) {
      let o = 1;
      const s = Math.min(64, t.length - n);
      for (; o < s; ) {
        const r = t[n + o];
        if (r === 0 || r >= -128 && r <= 127) break;
        o++;
      }
      e.push(bc | o - 1);
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
function m1(t, e, n, o) {
  if (!t || t.length === 0) return [];
  const s = new R(t), r = s.uint16(), i = s.offset16(), a = r & no, c = (r & eo) !== 0;
  if (a === 0) return [];
  const f = [];
  for (let h = 0; h < a; h++) {
    const p = s.uint16(), g = s.uint16();
    let d;
    if (g & oo)
      d = s.array("f2dot14", e);
    else {
      const y = g & g1;
      d = n[y] ?? new Array(e).fill(0);
    }
    let x = null, m = null;
    g & so && (x = s.array("f2dot14", e), m = s.array("f2dot14", e)), f.push({
      variationDataSize: p,
      tupleIndex: g,
      peakTuple: d,
      intermediateStartTuple: x,
      intermediateEndTuple: m,
      hasPrivatePoints: (g & ro) !== 0
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
    const x = d === null ? o : d.length, m = x * 2, y = Ac(s, m);
    u.push({
      peakTuple: h.peakTuple,
      intermediateStartTuple: h.intermediateStartTuple,
      intermediateEndTuple: h.intermediateEndTuple,
      pointIndices: d,
      xDeltas: y.slice(0, x),
      yDeltas: y.slice(x)
    }), s.seek(g);
  }
  return u;
}
function y1(t, e) {
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
    d.push(...Cc(x)), a.push(d.length), r.push(d);
  }
  const c = [];
  for (const g of r)
    c.push(...g);
  const f = [];
  for (let g = 0; g < n; g++) {
    const d = t[g];
    let x = oo;
    s || (x |= ro), d.intermediateStartTuple && (x |= so);
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
  const l = [];
  for (const g of f)
    l.push(...g);
  const u = (s ? eo : 0) | n & no, h = 4 + l.length, p = [];
  return p.push(u >> 8 & 255), p.push(u & 255), p.push(h >> 8 & 255), p.push(h & 255), p.push(...l), p.push(...c), p;
}
function x1(t, e, n) {
  if (!t || t.length < 8)
    return { majorVersion: 1, minorVersion: 0, tupleVariations: [] };
  const o = new R(t), s = o.uint16(), r = o.uint16(), i = o.uint16(), a = o.offset16(), c = i & no, f = (i & eo) !== 0;
  if (c === 0)
    return { majorVersion: s, minorVersion: r, tupleVariations: [] };
  const l = [];
  for (let p = 0; p < c; p++) {
    const g = o.uint16(), d = o.uint16();
    let x = null;
    d & oo && (x = o.array("f2dot14", e));
    let m = null, y = null;
    d & so && (m = o.array("f2dot14", e), y = o.array("f2dot14", e)), l.push({
      variationDataSize: g,
      tupleIndex: d,
      peakTuple: x,
      intermediateStartTuple: m,
      intermediateEndTuple: y,
      hasPrivatePoints: (d & ro) !== 0
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
    const m = x === null ? n : x.length, y = Ac(o, m);
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
function S1(t, e) {
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
    const m = [];
    a || m.push(...Nn(x.pointIndices)), m.push(...Cc(x.deltas ?? [])), f.push(m.length), c.push(m);
  }
  const l = [];
  for (const x of c)
    l.push(...x);
  const u = [];
  for (let x = 0; x < r; x++) {
    const m = s[x];
    let y = oo;
    a || (y |= ro), m.intermediateStartTuple && (y |= so), u.push(f[x] >> 8 & 255), u.push(f[x] & 255), u.push(y >> 8 & 255), u.push(y & 255);
    for (let w = 0; w < e; w++) {
      const S = Math.round((m.peakTuple[w] ?? 0) * 16384) & 65535;
      u.push(S >> 8 & 255, S & 255);
    }
    if (m.intermediateStartTuple) {
      for (let w = 0; w < e; w++) {
        const S = Math.round((m.intermediateStartTuple[w] ?? 0) * 16384) & 65535;
        u.push(S >> 8 & 255, S & 255);
      }
      for (let w = 0; w < e; w++) {
        const S = Math.round((m.intermediateEndTuple[w] ?? 0) * 16384) & 65535;
        u.push(S >> 8 & 255, S & 255);
      }
    }
  }
  const h = (a ? eo : 0) | r & no, p = 8 + u.length, g = p + l.length, d = new v(g);
  return d.uint16(n), d.uint16(o), d.uint16(h), d.offset16(p), d.rawBytes(u), d.rawBytes(l), d.toArray();
}
function _1(t, e = {}) {
  const n = e.fvar?.axes?.length ?? 0, o = e["cvt "]?.values?.length ?? 0;
  return x1(t, n, o);
}
function w1(t) {
  const e = t.tupleVariations?.[0]?.peakTuple?.length ?? 0;
  return S1(t, e);
}
function b1(t) {
  const e = new R(t), n = t.length >>> 1;
  return { values: e.array("fword", n) };
}
function A1(t) {
  const e = t.values, n = new v(e.length * 2);
  return n.array("fword", e), n.toArray();
}
function C1(t) {
  return { instructions: Array.from(t) };
}
function v1(t) {
  return Array.from(t.instructions);
}
function I1(t) {
  const e = new R(t), n = e.uint16(), o = e.uint16(), s = [];
  for (let r = 0; r < o; r++)
    s.push({
      rangeMaxPPEM: e.uint16(),
      rangeGaspBehavior: e.uint16()
    });
  return { version: n, gaspRanges: s };
}
function O1(t) {
  const { version: e, gaspRanges: n } = t, o = new v(4 + n.length * 4);
  o.uint16(e), o.uint16(n.length);
  for (const s of n)
    o.uint16(s.rangeMaxPPEM), o.uint16(s.rangeGaspBehavior);
  return o.toArray();
}
const vc = 1, Ic = 2, Oc = 4, kc = 8, Gn = 16, Pn = 32, Ec = 64, qe = 1, Un = 2, Tc = 4, Ds = 8, ts = 32, Fs = 64, Rs = 128, Ke = 256, Dc = 512, Fc = 1024, Rc = 2048, Mc = 4096;
function k1(t, e) {
  const n = e.loca.offsets, o = e.maxp.numGlyphs, s = new R(t), r = [];
  for (let i = 0; i < o; i++) {
    const a = n[i], c = n[i + 1];
    if (a === c) {
      r.push(null);
      continue;
    }
    s.seek(a);
    const f = s.int16(), l = s.int16(), u = s.int16(), h = s.int16(), p = s.int16();
    f >= 0 ? r.push(
      E1(s, f, l, u, h, p)
    ) : r.push(T1(s, l, u, h, p));
  }
  return { glyphs: r };
}
function E1(t, e, n, o, s, r) {
  const i = t.array("uint16", e), a = e > 0 ? i[e - 1] + 1 : 0, c = t.uint16(), f = t.bytes(c), l = [];
  for (; l.length < a; ) {
    const y = t.uint8();
    if (l.push(y), y & kc) {
      const w = t.uint8();
      for (let S = 0; S < w; S++)
        l.push(y);
    }
  }
  const u = new Array(a);
  let h = 0;
  for (let y = 0; y < a; y++) {
    const w = l[y];
    if (w & Ic) {
      const S = t.uint8();
      h += w & Gn ? S : -S;
    } else w & Gn || (h += t.int16());
    u[y] = h;
  }
  const p = new Array(a);
  let g = 0;
  for (let y = 0; y < a; y++) {
    const w = l[y];
    if (w & Oc) {
      const S = t.uint8();
      g += w & Pn ? S : -S;
    } else w & Pn || (g += t.int16());
    p[y] = g;
  }
  const d = a > 0 && (l[0] & Ec) !== 0, x = [];
  let m = 0;
  for (let y = 0; y < e; y++) {
    const w = i[y], S = [];
    for (; m <= w; )
      S.push({
        x: u[m],
        y: p[m],
        onCurve: (l[m] & vc) !== 0
      }), m++;
    x.push(S);
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
function T1(t, e, n, o, s) {
  const r = [];
  let i, a = !1;
  do {
    i = t.uint16();
    const f = t.uint16();
    let l, u;
    i & qe ? i & Un ? (l = t.int16(), u = t.int16()) : (l = t.uint16(), u = t.uint16()) : i & Un ? (l = t.int8(), u = t.int8()) : (l = t.uint8(), u = t.uint8());
    const h = {
      glyphIndex: f,
      flags: D1(i),
      argument1: l,
      argument2: u
    };
    i & Ds ? h.transform = { scale: t.f2dot14() } : i & Fs ? h.transform = {
      xScale: t.f2dot14(),
      yScale: t.f2dot14()
    } : i & Rs && (h.transform = {
      xScale: t.f2dot14(),
      scale01: t.f2dot14(),
      scale10: t.f2dot14(),
      yScale: t.f2dot14()
    }), r.push(h), i & Ke && (a = !0);
  } while (i & ts);
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
function D1(t) {
  const e = {};
  return t & qe && (e.argsAreWords = !0), t & Un && (e.argsAreXYValues = !0), t & Tc && (e.roundXYToGrid = !0), t & Ds && (e.weHaveAScale = !0), t & Fs && (e.weHaveAnXAndYScale = !0), t & Rs && (e.weHaveATwoByTwo = !0), t & Ke && (e.weHaveInstructions = !0), t & Dc && (e.useMyMetrics = !0), t & Fc && (e.overlapCompound = !0), t & Rc && (e.scaledComponentOffset = !0), t & Mc && (e.unscaledComponentOffset = !0), e;
}
function Lc(t) {
  const { glyphs: e } = t, n = [];
  for (const r of e) {
    if (r === null) {
      n.push([]);
      continue;
    }
    r.type === "simple" ? n.push(R1(r)) : n.push(L1(r));
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
function F1(t) {
  return Lc(t).bytes;
}
function R1(t) {
  const { contours: e, instructions: n, xMin: o, yMin: s, xMax: r, yMax: i, overlapSimple: a } = t, c = e.length, f = [], l = [];
  for (const I of e) {
    for (const E of I)
      f.push(E);
    l.push(f.length - 1);
  }
  const u = f.length, h = f.map((I) => I.x), p = f.map((I) => I.y), g = new Array(u), d = new Array(u);
  for (let I = 0; I < u; I++)
    g[I] = I === 0 ? h[I] : h[I] - h[I - 1], d[I] = I === 0 ? p[I] : p[I] - p[I - 1];
  const x = [], m = [], y = [];
  for (let I = 0; I < u; I++) {
    let E = 0;
    f[I].onCurve && (E |= vc);
    const T = g[I], D = d[I];
    T === 0 ? E |= Gn : T >= -255 && T <= 255 ? (E |= Ic, T > 0 ? (E |= Gn, m.push(T)) : m.push(-T)) : m.push(T >> 8 & 255, T & 255), D === 0 ? E |= Pn : D >= -255 && D <= 255 ? (E |= Oc, D > 0 ? (E |= Pn, y.push(D)) : y.push(-D)) : y.push(D >> 8 & 255, D & 255), I === 0 && a && (E |= Ec), x.push(E);
  }
  const w = M1(x), S = 10, _ = c * 2, b = 2, A = n.length, k = S + _ + b + A + w.length + m.length + y.length, O = new v(k);
  return O.int16(c), O.int16(o), O.int16(s), O.int16(r), O.int16(i), O.array("uint16", l), O.uint16(n.length), O.rawBytes(n), O.rawBytes(w), O.rawBytes(m), O.rawBytes(y), O.toArray();
}
function M1(t) {
  const e = [];
  let n = 0;
  for (; n < t.length; ) {
    const o = t[n];
    let s = 0;
    for (; n + 1 + s < t.length && t[n + 1 + s] === o && s < 255; )
      s++;
    s > 0 ? (e.push(o | kc, s), n += 1 + s) : (e.push(o), n++);
  }
  return e;
}
function L1(t) {
  const { components: e, instructions: n, xMin: o, yMin: s, xMax: r, yMax: i } = t;
  let a = 10;
  for (let f = 0; f < e.length; f++) {
    const l = e[f];
    a += 4;
    const u = l.flags.argsAreWords || $r(l.argument1, l.argument2, l.flags.argsAreXYValues);
    a += u ? 4 : 2, l.transform && ("scale" in l.transform ? a += 2 : "scale01" in l.transform ? a += 8 : "xScale" in l.transform && (a += 4));
  }
  n && n.length > 0 && (a += 2 + n.length);
  const c = new v(a);
  c.int16(-1), c.int16(o), c.int16(s), c.int16(r), c.int16(i);
  for (let f = 0; f < e.length; f++) {
    const l = e[f], u = f === e.length - 1;
    let h = B1(l.flags);
    const p = l.flags.argsAreWords || $r(l.argument1, l.argument2, l.flags.argsAreXYValues);
    p ? h |= qe : h &= ~qe, u ? h &= ~ts : h |= ts, u && n && n.length > 0 ? h |= Ke : u && (h &= ~Ke), c.uint16(h), c.uint16(l.glyphIndex), p ? l.flags.argsAreXYValues ? (c.int16(l.argument1), c.int16(l.argument2)) : (c.uint16(l.argument1), c.uint16(l.argument2)) : l.flags.argsAreXYValues ? (c.int8(l.argument1), c.int8(l.argument2)) : (c.uint8(l.argument1), c.uint8(l.argument2)), l.transform && ("scale" in l.transform ? c.f2dot14(l.transform.scale) : "scale01" in l.transform ? (c.f2dot14(l.transform.xScale), c.f2dot14(l.transform.scale01), c.f2dot14(l.transform.scale10), c.f2dot14(l.transform.yScale)) : "xScale" in l.transform && (c.f2dot14(l.transform.xScale), c.f2dot14(l.transform.yScale)));
  }
  return n && n.length > 0 && (c.uint16(n.length), c.rawBytes(n)), c.toArray();
}
function $r(t, e, n) {
  return n ? t < -128 || t > 127 || e < -128 || e > 127 : t > 255 || e > 255;
}
function B1(t) {
  let e = 0;
  return t.argsAreWords && (e |= qe), t.argsAreXYValues && (e |= Un), t.roundXYToGrid && (e |= Tc), t.weHaveAScale && (e |= Ds), t.weHaveAnXAndYScale && (e |= Fs), t.weHaveATwoByTwo && (e |= Rs), t.weHaveInstructions && (e |= Ke), t.useMyMetrics && (e |= Dc), t.overlapCompound && (e |= Fc), t.scaledComponentOffset && (e |= Rc), t.unscaledComponentOffset && (e |= Mc), e;
}
const V1 = 20, es = 1;
function $1(t, e = {}) {
  const n = new R(t), o = n.uint16(), s = n.uint16(), r = n.uint16(), i = n.uint16(), a = n.offset32(), c = n.uint16(), f = n.uint16(), l = n.offset32(), u = (f & es) !== 0, h = c + 1, p = [];
  for (let x = 0; x < h; x++)
    u ? p.push(n.uint32()) : p.push(n.uint16() * 2);
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
    const S = l + m, _ = t.slice(S, S + w), b = N1(e, x);
    d.push(
      m1(_, r, g, b)
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
function N1(t, e) {
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
function G1(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.axisCount ?? 0, s = t.glyphVariationData ?? [], r = s.length, i = s.map((_) => Array.isArray(_) && (_.length === 0 || typeof _[0] == "number") ? _ : Array.isArray(_) ? y1(_, o) : []), a = t.sharedTuples ?? P1(s, o), c = a.length, f = c * o * 2, l = [0];
  let u = 0;
  for (const _ of i)
    u += _.length, l.push(u);
  const h = l.every(
    (_) => _ % 2 === 0 && _ / 2 <= 65535
  ), p = h ? 2 : 4, g = (r + 1) * p, d = V1 + g, x = d + f, m = x + u, y = t.flags ?? 0, w = h ? y & ~es : y | es, S = new v(m);
  S.uint16(e), S.uint16(n), S.uint16(o), S.uint16(c), S.offset32(d), S.uint16(r), S.uint16(w), S.offset32(x);
  for (const _ of l)
    h ? S.uint16(_ / 2) : S.uint32(_);
  for (const _ of a)
    for (let b = 0; b < o; b++)
      S.f2dot14(_[b] ?? 0);
  for (const _ of i)
    S.rawBytes(_);
  return S.toArray();
}
function P1(t, e) {
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
function U1(t, e) {
  const n = e.head.indexToLocFormat, s = e.maxp.numGlyphs + 1, r = new R(t), i = [];
  if (n === 0)
    for (let a = 0; a < s; a++)
      i.push(r.uint16() * 2);
  else
    for (let a = 0; a < s; a++)
      i.push(r.uint32());
  return { offsets: i };
}
function Bc(t) {
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
function z1(t) {
  return { instructions: Array.from(t) };
}
function H1(t) {
  return Array.from(t.instructions);
}
const W1 = 4, Nr = 0, Gr = 1, j1 = 2;
function Ie(t) {
  let e = t.length;
  for (; --e >= 0; )
    t[e] = 0;
}
const Y1 = 0, Vc = 1, Z1 = 2, X1 = 3, q1 = 258, Ms = 29, un = 256, Je = un + 1 + Ms, ye = 30, Ls = 19, $c = 2 * Je + 1, Xt = 15, vo = 16, K1 = 7, Bs = 256, Nc = 16, Gc = 17, Pc = 18, ns = (
  /* extra bits for each length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0])
), Rn = (
  /* extra bits for each distance code */
  new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13])
), J1 = (
  /* extra bits for each bit length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7])
), Uc = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), Q1 = 512, vt = new Array((Je + 2) * 2);
Ie(vt);
const He = new Array(ye * 2);
Ie(He);
const Qe = new Array(Q1);
Ie(Qe);
const tn = new Array(q1 - X1 + 1);
Ie(tn);
const Vs = new Array(Ms);
Ie(Vs);
const zn = new Array(ye);
Ie(zn);
function Io(t, e, n, o, s) {
  this.static_tree = t, this.extra_bits = e, this.extra_base = n, this.elems = o, this.max_length = s, this.has_stree = t && t.length;
}
let zc, Hc, Wc;
function Oo(t, e) {
  this.dyn_tree = t, this.max_code = 0, this.stat_desc = e;
}
const jc = (t) => t < 256 ? Qe[t] : Qe[256 + (t >>> 7)], en = (t, e) => {
  t.pending_buf[t.pending++] = e & 255, t.pending_buf[t.pending++] = e >>> 8 & 255;
}, nt = (t, e, n) => {
  t.bi_valid > vo - n ? (t.bi_buf |= e << t.bi_valid & 65535, en(t, t.bi_buf), t.bi_buf = e >> vo - t.bi_valid, t.bi_valid += n - vo) : (t.bi_buf |= e << t.bi_valid & 65535, t.bi_valid += n);
}, pt = (t, e, n) => {
  nt(
    t,
    n[e * 2],
    n[e * 2 + 1]
    /*.Len*/
  );
}, Yc = (t, e) => {
  let n = 0;
  do
    n |= t & 1, t >>>= 1, n <<= 1;
  while (--e > 0);
  return n >>> 1;
}, tm = (t) => {
  t.bi_valid === 16 ? (en(t, t.bi_buf), t.bi_buf = 0, t.bi_valid = 0) : t.bi_valid >= 8 && (t.pending_buf[t.pending++] = t.bi_buf & 255, t.bi_buf >>= 8, t.bi_valid -= 8);
}, em = (t, e) => {
  const n = e.dyn_tree, o = e.max_code, s = e.stat_desc.static_tree, r = e.stat_desc.has_stree, i = e.stat_desc.extra_bits, a = e.stat_desc.extra_base, c = e.stat_desc.max_length;
  let f, l, u, h, p, g, d = 0;
  for (h = 0; h <= Xt; h++)
    t.bl_count[h] = 0;
  for (n[t.heap[t.heap_max] * 2 + 1] = 0, f = t.heap_max + 1; f < $c; f++)
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
}, Zc = (t, e, n) => {
  const o = new Array(Xt + 1);
  let s = 0, r, i;
  for (r = 1; r <= Xt; r++)
    s = s + n[r - 1] << 1, o[r] = s;
  for (i = 0; i <= e; i++) {
    let a = t[i * 2 + 1];
    a !== 0 && (t[i * 2] = Yc(o[a]++, a));
  }
}, nm = () => {
  let t, e, n, o, s;
  const r = new Array(Xt + 1);
  for (n = 0, o = 0; o < Ms - 1; o++)
    for (Vs[o] = n, t = 0; t < 1 << ns[o]; t++)
      tn[n++] = o;
  for (tn[n - 1] = o, s = 0, o = 0; o < 16; o++)
    for (zn[o] = s, t = 0; t < 1 << Rn[o]; t++)
      Qe[s++] = o;
  for (s >>= 7; o < ye; o++)
    for (zn[o] = s << 7, t = 0; t < 1 << Rn[o] - 7; t++)
      Qe[256 + s++] = o;
  for (e = 0; e <= Xt; e++)
    r[e] = 0;
  for (t = 0; t <= 143; )
    vt[t * 2 + 1] = 8, t++, r[8]++;
  for (; t <= 255; )
    vt[t * 2 + 1] = 9, t++, r[9]++;
  for (; t <= 279; )
    vt[t * 2 + 1] = 7, t++, r[7]++;
  for (; t <= 287; )
    vt[t * 2 + 1] = 8, t++, r[8]++;
  for (Zc(vt, Je + 1, r), t = 0; t < ye; t++)
    He[t * 2 + 1] = 5, He[t * 2] = Yc(t, 5);
  zc = new Io(vt, ns, un + 1, Je, Xt), Hc = new Io(He, Rn, 0, ye, Xt), Wc = new Io(new Array(0), J1, 0, Ls, K1);
}, Xc = (t) => {
  let e;
  for (e = 0; e < Je; e++)
    t.dyn_ltree[e * 2] = 0;
  for (e = 0; e < ye; e++)
    t.dyn_dtree[e * 2] = 0;
  for (e = 0; e < Ls; e++)
    t.bl_tree[e * 2] = 0;
  t.dyn_ltree[Bs * 2] = 1, t.opt_len = t.static_len = 0, t.sym_next = t.matches = 0;
}, qc = (t) => {
  t.bi_valid > 8 ? en(t, t.bi_buf) : t.bi_valid > 0 && (t.pending_buf[t.pending++] = t.bi_buf), t.bi_buf = 0, t.bi_valid = 0;
}, Pr = (t, e, n, o) => {
  const s = e * 2, r = n * 2;
  return t[s] < t[r] || t[s] === t[r] && o[e] <= o[n];
}, ko = (t, e, n) => {
  const o = t.heap[n];
  let s = n << 1;
  for (; s <= t.heap_len && (s < t.heap_len && Pr(e, t.heap[s + 1], t.heap[s], t.depth) && s++, !Pr(e, o, t.heap[s], t.depth)); )
    t.heap[n] = t.heap[s], n = s, s <<= 1;
  t.heap[n] = o;
}, Ur = (t, e, n) => {
  let o, s, r = 0, i, a;
  if (t.sym_next !== 0)
    do
      o = t.pending_buf[t.sym_buf + r++] & 255, o += (t.pending_buf[t.sym_buf + r++] & 255) << 8, s = t.pending_buf[t.sym_buf + r++], o === 0 ? pt(t, s, e) : (i = tn[s], pt(t, i + un + 1, e), a = ns[i], a !== 0 && (s -= Vs[i], nt(t, s, a)), o--, i = jc(o), pt(t, i, n), a = Rn[i], a !== 0 && (o -= zn[i], nt(t, o, a)));
    while (r < t.sym_next);
  pt(t, Bs, e);
}, os = (t, e) => {
  const n = e.dyn_tree, o = e.stat_desc.static_tree, s = e.stat_desc.has_stree, r = e.stat_desc.elems;
  let i, a, c = -1, f;
  for (t.heap_len = 0, t.heap_max = $c, i = 0; i < r; i++)
    n[i * 2] !== 0 ? (t.heap[++t.heap_len] = c = i, t.depth[i] = 0) : n[i * 2 + 1] = 0;
  for (; t.heap_len < 2; )
    f = t.heap[++t.heap_len] = c < 2 ? ++c : 0, n[f * 2] = 1, t.depth[f] = 0, t.opt_len--, s && (t.static_len -= o[f * 2 + 1]);
  for (e.max_code = c, i = t.heap_len >> 1; i >= 1; i--)
    ko(t, n, i);
  f = r;
  do
    i = t.heap[
      1
      /*SMALLEST*/
    ], t.heap[
      1
      /*SMALLEST*/
    ] = t.heap[t.heap_len--], ko(
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
    ] = f++, ko(
      t,
      n,
      1
      /*SMALLEST*/
    );
  while (t.heap_len >= 2);
  t.heap[--t.heap_max] = t.heap[
    1
    /*SMALLEST*/
  ], em(t, e), Zc(n, c, t.bl_count);
}, zr = (t, e, n) => {
  let o, s = -1, r, i = e[1], a = 0, c = 7, f = 4;
  for (i === 0 && (c = 138, f = 3), e[(n + 1) * 2 + 1] = 65535, o = 0; o <= n; o++)
    r = i, i = e[(o + 1) * 2 + 1], !(++a < c && r === i) && (a < f ? t.bl_tree[r * 2] += a : r !== 0 ? (r !== s && t.bl_tree[r * 2]++, t.bl_tree[Nc * 2]++) : a <= 10 ? t.bl_tree[Gc * 2]++ : t.bl_tree[Pc * 2]++, a = 0, s = r, i === 0 ? (c = 138, f = 3) : r === i ? (c = 6, f = 3) : (c = 7, f = 4));
}, Hr = (t, e, n) => {
  let o, s = -1, r, i = e[1], a = 0, c = 7, f = 4;
  for (i === 0 && (c = 138, f = 3), o = 0; o <= n; o++)
    if (r = i, i = e[(o + 1) * 2 + 1], !(++a < c && r === i)) {
      if (a < f)
        do
          pt(t, r, t.bl_tree);
        while (--a !== 0);
      else r !== 0 ? (r !== s && (pt(t, r, t.bl_tree), a--), pt(t, Nc, t.bl_tree), nt(t, a - 3, 2)) : a <= 10 ? (pt(t, Gc, t.bl_tree), nt(t, a - 3, 3)) : (pt(t, Pc, t.bl_tree), nt(t, a - 11, 7));
      a = 0, s = r, i === 0 ? (c = 138, f = 3) : r === i ? (c = 6, f = 3) : (c = 7, f = 4);
    }
}, om = (t) => {
  let e;
  for (zr(t, t.dyn_ltree, t.l_desc.max_code), zr(t, t.dyn_dtree, t.d_desc.max_code), os(t, t.bl_desc), e = Ls - 1; e >= 3 && t.bl_tree[Uc[e] * 2 + 1] === 0; e--)
    ;
  return t.opt_len += 3 * (e + 1) + 5 + 5 + 4, e;
}, sm = (t, e, n, o) => {
  let s;
  for (nt(t, e - 257, 5), nt(t, n - 1, 5), nt(t, o - 4, 4), s = 0; s < o; s++)
    nt(t, t.bl_tree[Uc[s] * 2 + 1], 3);
  Hr(t, t.dyn_ltree, e - 1), Hr(t, t.dyn_dtree, n - 1);
}, rm = (t) => {
  let e = 4093624447, n;
  for (n = 0; n <= 31; n++, e >>>= 1)
    if (e & 1 && t.dyn_ltree[n * 2] !== 0)
      return Nr;
  if (t.dyn_ltree[18] !== 0 || t.dyn_ltree[20] !== 0 || t.dyn_ltree[26] !== 0)
    return Gr;
  for (n = 32; n < un; n++)
    if (t.dyn_ltree[n * 2] !== 0)
      return Gr;
  return Nr;
};
let Wr = !1;
const im = (t) => {
  Wr || (nm(), Wr = !0), t.l_desc = new Oo(t.dyn_ltree, zc), t.d_desc = new Oo(t.dyn_dtree, Hc), t.bl_desc = new Oo(t.bl_tree, Wc), t.bi_buf = 0, t.bi_valid = 0, Xc(t);
}, Kc = (t, e, n, o) => {
  nt(t, (Y1 << 1) + (o ? 1 : 0), 3), qc(t), en(t, n), en(t, ~n), n && t.pending_buf.set(t.window.subarray(e, e + n), t.pending), t.pending += n;
}, am = (t) => {
  nt(t, Vc << 1, 3), pt(t, Bs, vt), tm(t);
}, cm = (t, e, n, o) => {
  let s, r, i = 0;
  t.level > 0 ? (t.strm.data_type === j1 && (t.strm.data_type = rm(t)), os(t, t.l_desc), os(t, t.d_desc), i = om(t), s = t.opt_len + 3 + 7 >>> 3, r = t.static_len + 3 + 7 >>> 3, r <= s && (s = r)) : s = r = n + 5, n + 4 <= s && e !== -1 ? Kc(t, e, n, o) : t.strategy === W1 || r === s ? (nt(t, (Vc << 1) + (o ? 1 : 0), 3), Ur(t, vt, He)) : (nt(t, (Z1 << 1) + (o ? 1 : 0), 3), sm(t, t.l_desc.max_code + 1, t.d_desc.max_code + 1, i + 1), Ur(t, t.dyn_ltree, t.dyn_dtree)), Xc(t), o && qc(t);
}, fm = (t, e, n) => (t.pending_buf[t.sym_buf + t.sym_next++] = e, t.pending_buf[t.sym_buf + t.sym_next++] = e >> 8, t.pending_buf[t.sym_buf + t.sym_next++] = n, e === 0 ? t.dyn_ltree[n * 2]++ : (t.matches++, e--, t.dyn_ltree[(tn[n] + un + 1) * 2]++, t.dyn_dtree[jc(e) * 2]++), t.sym_next === t.sym_end);
var lm = im, um = Kc, hm = cm, gm = fm, pm = am, dm = {
  _tr_init: lm,
  _tr_stored_block: um,
  _tr_flush_block: hm,
  _tr_tally: gm,
  _tr_align: pm
};
const mm = (t, e, n, o) => {
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
var nn = mm;
const ym = () => {
  let t, e = [];
  for (var n = 0; n < 256; n++) {
    t = n;
    for (var o = 0; o < 8; o++)
      t = t & 1 ? 3988292384 ^ t >>> 1 : t >>> 1;
    e[n] = t;
  }
  return e;
}, xm = new Uint32Array(ym()), Sm = (t, e, n, o) => {
  const s = xm, r = o + n;
  t ^= -1;
  for (let i = o; i < r; i++)
    t = t >>> 8 ^ s[(t ^ e[i]) & 255];
  return t ^ -1;
};
var Y = Sm, Qt = {
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
}, io = {
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
const { _tr_init: _m, _tr_stored_block: ss, _tr_flush_block: wm, _tr_tally: Nt, _tr_align: bm } = dm, {
  Z_NO_FLUSH: Gt,
  Z_PARTIAL_FLUSH: Am,
  Z_FULL_FLUSH: Cm,
  Z_FINISH: ft,
  Z_BLOCK: jr,
  Z_OK: X,
  Z_STREAM_END: Yr,
  Z_STREAM_ERROR: mt,
  Z_DATA_ERROR: vm,
  Z_BUF_ERROR: Eo,
  Z_DEFAULT_COMPRESSION: Im,
  Z_FILTERED: Om,
  Z_HUFFMAN_ONLY: wn,
  Z_RLE: km,
  Z_FIXED: Em,
  Z_DEFAULT_STRATEGY: Tm,
  Z_UNKNOWN: Dm,
  Z_DEFLATED: ao
} = io, Fm = 9, Rm = 15, Mm = 8, Lm = 29, Bm = 256, rs = Bm + 1 + Lm, Vm = 30, $m = 19, Nm = 2 * rs + 1, Gm = 15, B = 3, Bt = 258, yt = Bt + B + 1, Pm = 32, Ce = 42, $s = 57, is = 69, as = 73, cs = 91, fs = 103, qt = 113, Ge = 666, tt = 1, Oe = 2, te = 3, ke = 4, Um = 3, Kt = (t, e) => (t.msg = Qt[e], e), Zr = (t) => t * 2 - (t > 4 ? 9 : 0), Ft = (t) => {
  let e = t.length;
  for (; --e >= 0; )
    t[e] = 0;
}, zm = (t) => {
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
let Hm = (t, e, n) => (e << t.hash_shift ^ n) & t.hash_mask, Pt = Hm;
const st = (t) => {
  const e = t.state;
  let n = e.pending;
  n > t.avail_out && (n = t.avail_out), n !== 0 && (t.output.set(e.pending_buf.subarray(e.pending_out, e.pending_out + n), t.next_out), t.next_out += n, e.pending_out += n, t.total_out += n, t.avail_out -= n, e.pending -= n, e.pending === 0 && (e.pending_out = 0));
}, it = (t, e) => {
  wm(t, t.block_start >= 0 ? t.block_start : -1, t.strstart - t.block_start, e), t.block_start = t.strstart, st(t.strm);
}, V = (t, e) => {
  t.pending_buf[t.pending++] = e;
}, Me = (t, e) => {
  t.pending_buf[t.pending++] = e >>> 8 & 255, t.pending_buf[t.pending++] = e & 255;
}, ls = (t, e, n, o) => {
  let s = t.avail_in;
  return s > o && (s = o), s === 0 ? 0 : (t.avail_in -= s, e.set(t.input.subarray(t.next_in, t.next_in + s), n), t.state.wrap === 1 ? t.adler = nn(t.adler, e, s, n) : t.state.wrap === 2 && (t.adler = Y(t.adler, e, s, n)), t.next_in += s, t.total_in += s, s);
}, Jc = (t, e) => {
  let n = t.max_chain_length, o = t.strstart, s, r, i = t.prev_length, a = t.nice_match;
  const c = t.strstart > t.w_size - yt ? t.strstart - (t.w_size - yt) : 0, f = t.window, l = t.w_mask, u = t.prev, h = t.strstart + Bt;
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
}, ve = (t) => {
  const e = t.w_size;
  let n, o, s;
  do {
    if (o = t.window_size - t.lookahead - t.strstart, t.strstart >= e + (e - yt) && (t.window.set(t.window.subarray(e, e + e - o), 0), t.match_start -= e, t.strstart -= e, t.block_start -= e, t.insert > t.strstart && (t.insert = t.strstart), zm(t), o += e), t.strm.avail_in === 0)
      break;
    if (n = ls(t.strm, t.window, t.strstart + t.lookahead, o), t.lookahead += n, t.lookahead + t.insert >= B)
      for (s = t.strstart - t.insert, t.ins_h = t.window[s], t.ins_h = Pt(t, t.ins_h, t.window[s + 1]); t.insert && (t.ins_h = Pt(t, t.ins_h, t.window[s + B - 1]), t.prev[s & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = s, s++, t.insert--, !(t.lookahead + t.insert < B)); )
        ;
  } while (t.lookahead < yt && t.strm.avail_in !== 0);
}, Qc = (t, e) => {
  let n = t.pending_buf_size - 5 > t.w_size ? t.w_size : t.pending_buf_size - 5, o, s, r, i = 0, a = t.strm.avail_in;
  do {
    if (o = 65535, r = t.bi_valid + 42 >> 3, t.strm.avail_out < r || (r = t.strm.avail_out - r, s = t.strstart - t.block_start, o > s + t.strm.avail_in && (o = s + t.strm.avail_in), o > r && (o = r), o < n && (o === 0 && e !== ft || e === Gt || o !== s + t.strm.avail_in)))
      break;
    i = e === ft && o === s + t.strm.avail_in ? 1 : 0, ss(t, 0, 0, i), t.pending_buf[t.pending - 4] = o, t.pending_buf[t.pending - 3] = o >> 8, t.pending_buf[t.pending - 2] = ~o, t.pending_buf[t.pending - 1] = ~o >> 8, st(t.strm), s && (s > o && (s = o), t.strm.output.set(t.window.subarray(t.block_start, t.block_start + s), t.strm.next_out), t.strm.next_out += s, t.strm.avail_out -= s, t.strm.total_out += s, t.block_start += s, o -= s), o && (ls(t.strm, t.strm.output, t.strm.next_out, o), t.strm.next_out += o, t.strm.avail_out -= o, t.strm.total_out += o);
  } while (i === 0);
  return a -= t.strm.avail_in, a && (a >= t.w_size ? (t.matches = 2, t.window.set(t.strm.input.subarray(t.strm.next_in - t.w_size, t.strm.next_in), 0), t.strstart = t.w_size, t.insert = t.strstart) : (t.window_size - t.strstart <= a && (t.strstart -= t.w_size, t.window.set(t.window.subarray(t.w_size, t.w_size + t.strstart), 0), t.matches < 2 && t.matches++, t.insert > t.strstart && (t.insert = t.strstart)), t.window.set(t.strm.input.subarray(t.strm.next_in - a, t.strm.next_in), t.strstart), t.strstart += a, t.insert += a > t.w_size - t.insert ? t.w_size - t.insert : a), t.block_start = t.strstart), t.high_water < t.strstart && (t.high_water = t.strstart), i ? ke : e !== Gt && e !== ft && t.strm.avail_in === 0 && t.strstart === t.block_start ? Oe : (r = t.window_size - t.strstart, t.strm.avail_in > r && t.block_start >= t.w_size && (t.block_start -= t.w_size, t.strstart -= t.w_size, t.window.set(t.window.subarray(t.w_size, t.w_size + t.strstart), 0), t.matches < 2 && t.matches++, r += t.w_size, t.insert > t.strstart && (t.insert = t.strstart)), r > t.strm.avail_in && (r = t.strm.avail_in), r && (ls(t.strm, t.window, t.strstart, r), t.strstart += r, t.insert += r > t.w_size - t.insert ? t.w_size - t.insert : r), t.high_water < t.strstart && (t.high_water = t.strstart), r = t.bi_valid + 42 >> 3, r = t.pending_buf_size - r > 65535 ? 65535 : t.pending_buf_size - r, n = r > t.w_size ? t.w_size : r, s = t.strstart - t.block_start, (s >= n || (s || e === ft) && e !== Gt && t.strm.avail_in === 0 && s <= r) && (o = s > r ? r : s, i = e === ft && t.strm.avail_in === 0 && o === s ? 1 : 0, ss(t, t.block_start, o, i), t.block_start += o, st(t.strm)), i ? te : tt);
}, To = (t, e) => {
  let n, o;
  for (; ; ) {
    if (t.lookahead < yt) {
      if (ve(t), t.lookahead < yt && e === Gt)
        return tt;
      if (t.lookahead === 0)
        break;
    }
    if (n = 0, t.lookahead >= B && (t.ins_h = Pt(t, t.ins_h, t.window[t.strstart + B - 1]), n = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), n !== 0 && t.strstart - n <= t.w_size - yt && (t.match_length = Jc(t, n)), t.match_length >= B)
      if (o = Nt(t, t.strstart - t.match_start, t.match_length - B), t.lookahead -= t.match_length, t.match_length <= t.max_lazy_match && t.lookahead >= B) {
        t.match_length--;
        do
          t.strstart++, t.ins_h = Pt(t, t.ins_h, t.window[t.strstart + B - 1]), n = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart;
        while (--t.match_length !== 0);
        t.strstart++;
      } else
        t.strstart += t.match_length, t.match_length = 0, t.ins_h = t.window[t.strstart], t.ins_h = Pt(t, t.ins_h, t.window[t.strstart + 1]);
    else
      o = Nt(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++;
    if (o && (it(t, !1), t.strm.avail_out === 0))
      return tt;
  }
  return t.insert = t.strstart < B - 1 ? t.strstart : B - 1, e === ft ? (it(t, !0), t.strm.avail_out === 0 ? te : ke) : t.sym_next && (it(t, !1), t.strm.avail_out === 0) ? tt : Oe;
}, ae = (t, e) => {
  let n, o, s;
  for (; ; ) {
    if (t.lookahead < yt) {
      if (ve(t), t.lookahead < yt && e === Gt)
        return tt;
      if (t.lookahead === 0)
        break;
    }
    if (n = 0, t.lookahead >= B && (t.ins_h = Pt(t, t.ins_h, t.window[t.strstart + B - 1]), n = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), t.prev_length = t.match_length, t.prev_match = t.match_start, t.match_length = B - 1, n !== 0 && t.prev_length < t.max_lazy_match && t.strstart - n <= t.w_size - yt && (t.match_length = Jc(t, n), t.match_length <= 5 && (t.strategy === Om || t.match_length === B && t.strstart - t.match_start > 4096) && (t.match_length = B - 1)), t.prev_length >= B && t.match_length <= t.prev_length) {
      s = t.strstart + t.lookahead - B, o = Nt(t, t.strstart - 1 - t.prev_match, t.prev_length - B), t.lookahead -= t.prev_length - 1, t.prev_length -= 2;
      do
        ++t.strstart <= s && (t.ins_h = Pt(t, t.ins_h, t.window[t.strstart + B - 1]), n = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart);
      while (--t.prev_length !== 0);
      if (t.match_available = 0, t.match_length = B - 1, t.strstart++, o && (it(t, !1), t.strm.avail_out === 0))
        return tt;
    } else if (t.match_available) {
      if (o = Nt(t, 0, t.window[t.strstart - 1]), o && it(t, !1), t.strstart++, t.lookahead--, t.strm.avail_out === 0)
        return tt;
    } else
      t.match_available = 1, t.strstart++, t.lookahead--;
  }
  return t.match_available && (o = Nt(t, 0, t.window[t.strstart - 1]), t.match_available = 0), t.insert = t.strstart < B - 1 ? t.strstart : B - 1, e === ft ? (it(t, !0), t.strm.avail_out === 0 ? te : ke) : t.sym_next && (it(t, !1), t.strm.avail_out === 0) ? tt : Oe;
}, Wm = (t, e) => {
  let n, o, s, r;
  const i = t.window;
  for (; ; ) {
    if (t.lookahead <= Bt) {
      if (ve(t), t.lookahead <= Bt && e === Gt)
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
  return t.insert = 0, e === ft ? (it(t, !0), t.strm.avail_out === 0 ? te : ke) : t.sym_next && (it(t, !1), t.strm.avail_out === 0) ? tt : Oe;
}, jm = (t, e) => {
  let n;
  for (; ; ) {
    if (t.lookahead === 0 && (ve(t), t.lookahead === 0)) {
      if (e === Gt)
        return tt;
      break;
    }
    if (t.match_length = 0, n = Nt(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++, n && (it(t, !1), t.strm.avail_out === 0))
      return tt;
  }
  return t.insert = 0, e === ft ? (it(t, !0), t.strm.avail_out === 0 ? te : ke) : t.sym_next && (it(t, !1), t.strm.avail_out === 0) ? tt : Oe;
};
function ht(t, e, n, o, s) {
  this.good_length = t, this.max_lazy = e, this.nice_length = n, this.max_chain = o, this.func = s;
}
const Pe = [
  /*      good lazy nice chain */
  new ht(0, 0, 0, 0, Qc),
  /* 0 store only */
  new ht(4, 4, 8, 4, To),
  /* 1 max speed, no lazy matches */
  new ht(4, 5, 16, 8, To),
  /* 2 */
  new ht(4, 6, 32, 32, To),
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
], Ym = (t) => {
  t.window_size = 2 * t.w_size, Ft(t.head), t.max_lazy_match = Pe[t.level].max_lazy, t.good_match = Pe[t.level].good_length, t.nice_match = Pe[t.level].nice_length, t.max_chain_length = Pe[t.level].max_chain, t.strstart = 0, t.block_start = 0, t.lookahead = 0, t.insert = 0, t.match_length = t.prev_length = B - 1, t.match_available = 0, t.ins_h = 0;
};
function Zm() {
  this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = ao, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new Uint16Array(Nm * 2), this.dyn_dtree = new Uint16Array((2 * Vm + 1) * 2), this.bl_tree = new Uint16Array((2 * $m + 1) * 2), Ft(this.dyn_ltree), Ft(this.dyn_dtree), Ft(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new Uint16Array(Gm + 1), this.heap = new Uint16Array(2 * rs + 1), Ft(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new Uint16Array(2 * rs + 1), Ft(this.depth), this.sym_buf = 0, this.lit_bufsize = 0, this.sym_next = 0, this.sym_end = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
}
const hn = (t) => {
  if (!t)
    return 1;
  const e = t.state;
  return !e || e.strm !== t || e.status !== Ce && //#ifdef GZIP
  e.status !== $s && //#endif
  e.status !== is && e.status !== as && e.status !== cs && e.status !== fs && e.status !== qt && e.status !== Ge ? 1 : 0;
}, tf = (t) => {
  if (hn(t))
    return Kt(t, mt);
  t.total_in = t.total_out = 0, t.data_type = Dm;
  const e = t.state;
  return e.pending = 0, e.pending_out = 0, e.wrap < 0 && (e.wrap = -e.wrap), e.status = //#ifdef GZIP
  e.wrap === 2 ? $s : (
    //#endif
    e.wrap ? Ce : qt
  ), t.adler = e.wrap === 2 ? 0 : 1, e.last_flush = -2, _m(e), X;
}, ef = (t) => {
  const e = tf(t);
  return e === X && Ym(t.state), e;
}, Xm = (t, e) => hn(t) || t.state.wrap !== 2 ? mt : (t.state.gzhead = e, X), nf = (t, e, n, o, s, r) => {
  if (!t)
    return mt;
  let i = 1;
  if (e === Im && (e = 6), o < 0 ? (i = 0, o = -o) : o > 15 && (i = 2, o -= 16), s < 1 || s > Fm || n !== ao || o < 8 || o > 15 || e < 0 || e > 9 || r < 0 || r > Em || o === 8 && i !== 1)
    return Kt(t, mt);
  o === 8 && (o = 9);
  const a = new Zm();
  return t.state = a, a.strm = t, a.status = Ce, a.wrap = i, a.gzhead = null, a.w_bits = o, a.w_size = 1 << a.w_bits, a.w_mask = a.w_size - 1, a.hash_bits = s + 7, a.hash_size = 1 << a.hash_bits, a.hash_mask = a.hash_size - 1, a.hash_shift = ~~((a.hash_bits + B - 1) / B), a.window = new Uint8Array(a.w_size * 2), a.head = new Uint16Array(a.hash_size), a.prev = new Uint16Array(a.w_size), a.lit_bufsize = 1 << s + 6, a.pending_buf_size = a.lit_bufsize * 4, a.pending_buf = new Uint8Array(a.pending_buf_size), a.sym_buf = a.lit_bufsize, a.sym_end = (a.lit_bufsize - 1) * 3, a.level = e, a.strategy = r, a.method = n, ef(t);
}, qm = (t, e) => nf(t, e, ao, Rm, Mm, Tm), Km = (t, e) => {
  if (hn(t) || e > jr || e < 0)
    return t ? Kt(t, mt) : mt;
  const n = t.state;
  if (!t.output || t.avail_in !== 0 && !t.input || n.status === Ge && e !== ft)
    return Kt(t, t.avail_out === 0 ? Eo : mt);
  const o = n.last_flush;
  if (n.last_flush = e, n.pending !== 0) {
    if (st(t), t.avail_out === 0)
      return n.last_flush = -1, X;
  } else if (t.avail_in === 0 && Zr(e) <= Zr(o) && e !== ft)
    return Kt(t, Eo);
  if (n.status === Ge && t.avail_in !== 0)
    return Kt(t, Eo);
  if (n.status === Ce && n.wrap === 0 && (n.status = qt), n.status === Ce) {
    let s = ao + (n.w_bits - 8 << 4) << 8, r = -1;
    if (n.strategy >= wn || n.level < 2 ? r = 0 : n.level < 6 ? r = 1 : n.level === 6 ? r = 2 : r = 3, s |= r << 6, n.strstart !== 0 && (s |= Pm), s += 31 - s % 31, Me(n, s), n.strstart !== 0 && (Me(n, t.adler >>> 16), Me(n, t.adler & 65535)), t.adler = 1, n.status = qt, st(t), n.pending !== 0)
      return n.last_flush = -1, X;
  }
  if (n.status === $s) {
    if (t.adler = 0, V(n, 31), V(n, 139), V(n, 8), n.gzhead)
      V(
        n,
        (n.gzhead.text ? 1 : 0) + (n.gzhead.hcrc ? 2 : 0) + (n.gzhead.extra ? 4 : 0) + (n.gzhead.name ? 8 : 0) + (n.gzhead.comment ? 16 : 0)
      ), V(n, n.gzhead.time & 255), V(n, n.gzhead.time >> 8 & 255), V(n, n.gzhead.time >> 16 & 255), V(n, n.gzhead.time >> 24 & 255), V(n, n.level === 9 ? 2 : n.strategy >= wn || n.level < 2 ? 4 : 0), V(n, n.gzhead.os & 255), n.gzhead.extra && n.gzhead.extra.length && (V(n, n.gzhead.extra.length & 255), V(n, n.gzhead.extra.length >> 8 & 255)), n.gzhead.hcrc && (t.adler = Y(t.adler, n.pending_buf, n.pending, 0)), n.gzindex = 0, n.status = is;
    else if (V(n, 0), V(n, 0), V(n, 0), V(n, 0), V(n, 0), V(n, n.level === 9 ? 2 : n.strategy >= wn || n.level < 2 ? 4 : 0), V(n, Um), n.status = qt, st(t), n.pending !== 0)
      return n.last_flush = -1, X;
  }
  if (n.status === is) {
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
    n.status = as;
  }
  if (n.status === as) {
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
    n.status = cs;
  }
  if (n.status === cs) {
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
    n.status = fs;
  }
  if (n.status === fs) {
    if (n.gzhead.hcrc) {
      if (n.pending + 2 > n.pending_buf_size && (st(t), n.pending !== 0))
        return n.last_flush = -1, X;
      V(n, t.adler & 255), V(n, t.adler >> 8 & 255), t.adler = 0;
    }
    if (n.status = qt, st(t), n.pending !== 0)
      return n.last_flush = -1, X;
  }
  if (t.avail_in !== 0 || n.lookahead !== 0 || e !== Gt && n.status !== Ge) {
    let s = n.level === 0 ? Qc(n, e) : n.strategy === wn ? jm(n, e) : n.strategy === km ? Wm(n, e) : Pe[n.level].func(n, e);
    if ((s === te || s === ke) && (n.status = Ge), s === tt || s === te)
      return t.avail_out === 0 && (n.last_flush = -1), X;
    if (s === Oe && (e === Am ? bm(n) : e !== jr && (ss(n, 0, 0, !1), e === Cm && (Ft(n.head), n.lookahead === 0 && (n.strstart = 0, n.block_start = 0, n.insert = 0))), st(t), t.avail_out === 0))
      return n.last_flush = -1, X;
  }
  return e !== ft ? X : n.wrap <= 0 ? Yr : (n.wrap === 2 ? (V(n, t.adler & 255), V(n, t.adler >> 8 & 255), V(n, t.adler >> 16 & 255), V(n, t.adler >> 24 & 255), V(n, t.total_in & 255), V(n, t.total_in >> 8 & 255), V(n, t.total_in >> 16 & 255), V(n, t.total_in >> 24 & 255)) : (Me(n, t.adler >>> 16), Me(n, t.adler & 65535)), st(t), n.wrap > 0 && (n.wrap = -n.wrap), n.pending !== 0 ? X : Yr);
}, Jm = (t) => {
  if (hn(t))
    return mt;
  const e = t.state.status;
  return t.state = null, e === qt ? Kt(t, vm) : X;
}, Qm = (t, e) => {
  let n = e.length;
  if (hn(t))
    return mt;
  const o = t.state, s = o.wrap;
  if (s === 2 || s === 1 && o.status !== Ce || o.lookahead)
    return mt;
  if (s === 1 && (t.adler = nn(t.adler, e, n, 0)), o.wrap = 0, n >= o.w_size) {
    s === 0 && (Ft(o.head), o.strstart = 0, o.block_start = 0, o.insert = 0);
    let c = new Uint8Array(o.w_size);
    c.set(e.subarray(n - o.w_size, n), 0), e = c, n = o.w_size;
  }
  const r = t.avail_in, i = t.next_in, a = t.input;
  for (t.avail_in = n, t.next_in = 0, t.input = e, ve(o); o.lookahead >= B; ) {
    let c = o.strstart, f = o.lookahead - (B - 1);
    do
      o.ins_h = Pt(o, o.ins_h, o.window[c + B - 1]), o.prev[c & o.w_mask] = o.head[o.ins_h], o.head[o.ins_h] = c, c++;
    while (--f);
    o.strstart = c, o.lookahead = B - 1, ve(o);
  }
  return o.strstart += o.lookahead, o.block_start = o.strstart, o.insert = o.lookahead, o.lookahead = 0, o.match_length = o.prev_length = B - 1, o.match_available = 0, t.next_in = i, t.input = a, t.avail_in = r, o.wrap = s, X;
};
var ty = qm, ey = nf, ny = ef, oy = tf, sy = Xm, ry = Km, iy = Jm, ay = Qm, cy = "pako deflate (from Nodeca project)", We = {
  deflateInit: ty,
  deflateInit2: ey,
  deflateReset: ny,
  deflateResetKeep: oy,
  deflateSetHeader: sy,
  deflate: ry,
  deflateEnd: iy,
  deflateSetDictionary: ay,
  deflateInfo: cy
};
const fy = (t, e) => Object.prototype.hasOwnProperty.call(t, e);
var ly = function(t) {
  const e = Array.prototype.slice.call(arguments, 1);
  for (; e.length; ) {
    const n = e.shift();
    if (n) {
      if (typeof n != "object")
        throw new TypeError(n + "must be non-object");
      for (const o in n)
        fy(n, o) && (t[o] = n[o]);
    }
  }
  return t;
}, uy = (t) => {
  let e = 0;
  for (let o = 0, s = t.length; o < s; o++)
    e += t[o].length;
  const n = new Uint8Array(e);
  for (let o = 0, s = 0, r = t.length; o < r; o++) {
    let i = t[o];
    n.set(i, s), s += i.length;
  }
  return n;
}, co = {
  assign: ly,
  flattenChunks: uy
};
let of = !0;
try {
  String.fromCharCode.apply(null, new Uint8Array(1));
} catch {
  of = !1;
}
const on = new Uint8Array(256);
for (let t = 0; t < 256; t++)
  on[t] = t >= 252 ? 6 : t >= 248 ? 5 : t >= 240 ? 4 : t >= 224 ? 3 : t >= 192 ? 2 : 1;
on[254] = on[254] = 1;
var hy = (t) => {
  if (typeof TextEncoder == "function" && TextEncoder.prototype.encode)
    return new TextEncoder().encode(t);
  let e, n, o, s, r, i = t.length, a = 0;
  for (s = 0; s < i; s++)
    n = t.charCodeAt(s), (n & 64512) === 55296 && s + 1 < i && (o = t.charCodeAt(s + 1), (o & 64512) === 56320 && (n = 65536 + (n - 55296 << 10) + (o - 56320), s++)), a += n < 128 ? 1 : n < 2048 ? 2 : n < 65536 ? 3 : 4;
  for (e = new Uint8Array(a), r = 0, s = 0; r < a; s++)
    n = t.charCodeAt(s), (n & 64512) === 55296 && s + 1 < i && (o = t.charCodeAt(s + 1), (o & 64512) === 56320 && (n = 65536 + (n - 55296 << 10) + (o - 56320), s++)), n < 128 ? e[r++] = n : n < 2048 ? (e[r++] = 192 | n >>> 6, e[r++] = 128 | n & 63) : n < 65536 ? (e[r++] = 224 | n >>> 12, e[r++] = 128 | n >>> 6 & 63, e[r++] = 128 | n & 63) : (e[r++] = 240 | n >>> 18, e[r++] = 128 | n >>> 12 & 63, e[r++] = 128 | n >>> 6 & 63, e[r++] = 128 | n & 63);
  return e;
};
const gy = (t, e) => {
  if (e < 65534 && t.subarray && of)
    return String.fromCharCode.apply(null, t.length === e ? t : t.subarray(0, e));
  let n = "";
  for (let o = 0; o < e; o++)
    n += String.fromCharCode(t[o]);
  return n;
};
var py = (t, e) => {
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
    let a = on[i];
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
  return gy(r, s);
}, dy = (t, e) => {
  e = e || t.length, e > t.length && (e = t.length);
  let n = e - 1;
  for (; n >= 0 && (t[n] & 192) === 128; )
    n--;
  return n < 0 || n === 0 ? e : n + on[t[n]] > e ? n : e;
}, sn = {
  string2buf: hy,
  buf2string: py,
  utf8border: dy
};
function my() {
  this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
}
var sf = my;
const rf = Object.prototype.toString, {
  Z_NO_FLUSH: yy,
  Z_SYNC_FLUSH: xy,
  Z_FULL_FLUSH: Sy,
  Z_FINISH: _y,
  Z_OK: Hn,
  Z_STREAM_END: wy,
  Z_DEFAULT_COMPRESSION: by,
  Z_DEFAULT_STRATEGY: Ay,
  Z_DEFLATED: Cy
} = io;
function fo(t) {
  this.options = co.assign({
    level: by,
    method: Cy,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: Ay
  }, t || {});
  let e = this.options;
  e.raw && e.windowBits > 0 ? e.windowBits = -e.windowBits : e.gzip && e.windowBits > 0 && e.windowBits < 16 && (e.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new sf(), this.strm.avail_out = 0;
  let n = We.deflateInit2(
    this.strm,
    e.level,
    e.method,
    e.windowBits,
    e.memLevel,
    e.strategy
  );
  if (n !== Hn)
    throw new Error(Qt[n]);
  if (e.header && We.deflateSetHeader(this.strm, e.header), e.dictionary) {
    let o;
    if (typeof e.dictionary == "string" ? o = sn.string2buf(e.dictionary) : rf.call(e.dictionary) === "[object ArrayBuffer]" ? o = new Uint8Array(e.dictionary) : o = e.dictionary, n = We.deflateSetDictionary(this.strm, o), n !== Hn)
      throw new Error(Qt[n]);
    this._dict_set = !0;
  }
}
fo.prototype.push = function(t, e) {
  const n = this.strm, o = this.options.chunkSize;
  let s, r;
  if (this.ended)
    return !1;
  for (e === ~~e ? r = e : r = e === !0 ? _y : yy, typeof t == "string" ? n.input = sn.string2buf(t) : rf.call(t) === "[object ArrayBuffer]" ? n.input = new Uint8Array(t) : n.input = t, n.next_in = 0, n.avail_in = n.input.length; ; ) {
    if (n.avail_out === 0 && (n.output = new Uint8Array(o), n.next_out = 0, n.avail_out = o), (r === xy || r === Sy) && n.avail_out <= 6) {
      this.onData(n.output.subarray(0, n.next_out)), n.avail_out = 0;
      continue;
    }
    if (s = We.deflate(n, r), s === wy)
      return n.next_out > 0 && this.onData(n.output.subarray(0, n.next_out)), s = We.deflateEnd(this.strm), this.onEnd(s), this.ended = !0, s === Hn;
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
fo.prototype.onData = function(t) {
  this.chunks.push(t);
};
fo.prototype.onEnd = function(t) {
  t === Hn && (this.result = co.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;
};
function vy(t, e) {
  const n = new fo(e);
  if (n.push(t, !0), n.err)
    throw n.msg || Qt[n.err];
  return n.result;
}
var Iy = vy, Oy = {
  deflate: Iy
};
const bn = 16209, ky = 16191;
var Ey = function(e, n) {
  let o, s, r, i, a, c, f, l, u, h, p, g, d, x, m, y, w, S, _, b, A, k, O, I;
  const E = e.state;
  o = e.next_in, O = e.input, s = o + (e.avail_in - 5), r = e.next_out, I = e.output, i = r - (n - e.avail_out), a = r + (e.avail_out - 257), c = E.dmax, f = E.wsize, l = E.whave, u = E.wnext, h = E.window, p = E.hold, g = E.bits, d = E.lencode, x = E.distcode, m = (1 << E.lenbits) - 1, y = (1 << E.distbits) - 1;
  t:
    do {
      g < 15 && (p += O[o++] << g, g += 8, p += O[o++] << g, g += 8), w = d[p & m];
      e:
        for (; ; ) {
          if (S = w >>> 24, p >>>= S, g -= S, S = w >>> 16 & 255, S === 0)
            I[r++] = w & 65535;
          else if (S & 16) {
            _ = w & 65535, S &= 15, S && (g < S && (p += O[o++] << g, g += 8), _ += p & (1 << S) - 1, p >>>= S, g -= S), g < 15 && (p += O[o++] << g, g += 8, p += O[o++] << g, g += 8), w = x[p & y];
            n:
              for (; ; ) {
                if (S = w >>> 24, p >>>= S, g -= S, S = w >>> 16 & 255, S & 16) {
                  if (b = w & 65535, S &= 15, g < S && (p += O[o++] << g, g += 8, g < S && (p += O[o++] << g, g += 8)), b += p & (1 << S) - 1, b > c) {
                    e.msg = "invalid distance too far back", E.mode = bn;
                    break t;
                  }
                  if (p >>>= S, g -= S, S = r - i, b > S) {
                    if (S = b - S, S > l && E.sane) {
                      e.msg = "invalid distance too far back", E.mode = bn;
                      break t;
                    }
                    if (A = 0, k = h, u === 0) {
                      if (A += f - S, S < _) {
                        _ -= S;
                        do
                          I[r++] = h[A++];
                        while (--S);
                        A = r - b, k = I;
                      }
                    } else if (u < S) {
                      if (A += f + u - S, S -= u, S < _) {
                        _ -= S;
                        do
                          I[r++] = h[A++];
                        while (--S);
                        if (A = 0, u < _) {
                          S = u, _ -= S;
                          do
                            I[r++] = h[A++];
                          while (--S);
                          A = r - b, k = I;
                        }
                      }
                    } else if (A += u - S, S < _) {
                      _ -= S;
                      do
                        I[r++] = h[A++];
                      while (--S);
                      A = r - b, k = I;
                    }
                    for (; _ > 2; )
                      I[r++] = k[A++], I[r++] = k[A++], I[r++] = k[A++], _ -= 3;
                    _ && (I[r++] = k[A++], _ > 1 && (I[r++] = k[A++]));
                  } else {
                    A = r - b;
                    do
                      I[r++] = I[A++], I[r++] = I[A++], I[r++] = I[A++], _ -= 3;
                    while (_ > 2);
                    _ && (I[r++] = I[A++], _ > 1 && (I[r++] = I[A++]));
                  }
                } else if ((S & 64) === 0) {
                  w = x[(w & 65535) + (p & (1 << S) - 1)];
                  continue n;
                } else {
                  e.msg = "invalid distance code", E.mode = bn;
                  break t;
                }
                break;
              }
          } else if ((S & 64) === 0) {
            w = d[(w & 65535) + (p & (1 << S) - 1)];
            continue e;
          } else if (S & 32) {
            E.mode = ky;
            break t;
          } else {
            e.msg = "invalid literal/length code", E.mode = bn;
            break t;
          }
          break;
        }
    } while (o < s && r < a);
  _ = g >> 3, o -= _, g -= _ << 3, p &= (1 << g) - 1, e.next_in = o, e.next_out = r, e.avail_in = o < s ? 5 + (s - o) : 5 - (o - s), e.avail_out = r < a ? 257 + (a - r) : 257 - (r - a), E.hold = p, E.bits = g;
};
const ce = 15, Xr = 852, qr = 592, Kr = 0, Do = 1, Jr = 2, Ty = new Uint16Array([
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
]), Dy = new Uint8Array([
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
  72,
  78
]), Fy = new Uint16Array([
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
]), Ry = new Uint8Array([
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
]), My = (t, e, n, o, s, r, i, a) => {
  const c = a.bits;
  let f = 0, l = 0, u = 0, h = 0, p = 0, g = 0, d = 0, x = 0, m = 0, y = 0, w, S, _, b, A, k = null, O;
  const I = new Uint16Array(ce + 1), E = new Uint16Array(ce + 1);
  let T = null, D, F, M;
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
  if (x > 0 && (t === Kr || h !== 1))
    return -1;
  for (E[1] = 0, f = 1; f < ce; f++)
    E[f + 1] = E[f] + I[f];
  for (l = 0; l < o; l++)
    e[n + l] !== 0 && (i[E[e[n + l]]++] = l);
  if (t === Kr ? (k = T = i, O = 20) : t === Do ? (k = Ty, T = Dy, O = 257) : (k = Fy, T = Ry, O = 0), y = 0, l = 0, f = u, A = r, g = p, d = 0, _ = -1, m = 1 << p, b = m - 1, t === Do && m > Xr || t === Jr && m > qr)
    return 1;
  for (; ; ) {
    D = f - d, i[l] + 1 < O ? (F = 0, M = i[l]) : i[l] >= O ? (F = T[i[l] - O], M = k[i[l] - O]) : (F = 96, M = 0), w = 1 << f - d, S = 1 << g, u = S;
    do
      S -= w, s[A + (y >> d) + S] = D << 24 | F << 16 | M | 0;
    while (S !== 0);
    for (w = 1 << f - 1; y & w; )
      w >>= 1;
    if (w !== 0 ? (y &= w - 1, y += w) : y = 0, l++, --I[f] === 0) {
      if (f === h)
        break;
      f = e[n + i[l]];
    }
    if (f > p && (y & b) !== _) {
      for (d === 0 && (d = p), A += u, g = f - d, x = 1 << g; g + d < h && (x -= I[g + d], !(x <= 0)); )
        g++, x <<= 1;
      if (m += 1 << g, t === Do && m > Xr || t === Jr && m > qr)
        return 1;
      _ = y & b, s[_] = p << 24 | g << 16 | A - r | 0;
    }
  }
  return y !== 0 && (s[A + y] = f - d << 24 | 64 << 16 | 0), a.bits = p, 0;
};
var je = My;
const Ly = 0, af = 1, cf = 2, {
  Z_FINISH: Qr,
  Z_BLOCK: By,
  Z_TREES: An,
  Z_OK: ee,
  Z_STREAM_END: Vy,
  Z_NEED_DICT: $y,
  Z_STREAM_ERROR: lt,
  Z_DATA_ERROR: ff,
  Z_MEM_ERROR: lf,
  Z_BUF_ERROR: Ny,
  Z_DEFLATED: ti
} = io, lo = 16180, ei = 16181, ni = 16182, oi = 16183, si = 16184, ri = 16185, ii = 16186, ai = 16187, ci = 16188, fi = 16189, Wn = 16190, bt = 16191, Fo = 16192, li = 16193, Ro = 16194, ui = 16195, hi = 16196, gi = 16197, pi = 16198, Cn = 16199, vn = 16200, di = 16201, mi = 16202, yi = 16203, xi = 16204, Si = 16205, Mo = 16206, _i = 16207, wi = 16208, z = 16209, uf = 16210, hf = 16211, Gy = 852, Py = 592, Uy = 15, zy = Uy, bi = (t) => (t >>> 24 & 255) + (t >>> 8 & 65280) + ((t & 65280) << 8) + ((t & 255) << 24);
function Hy() {
  this.strm = null, this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new Uint16Array(320), this.work = new Uint16Array(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
}
const oe = (t) => {
  if (!t)
    return 1;
  const e = t.state;
  return !e || e.strm !== t || e.mode < lo || e.mode > hf ? 1 : 0;
}, gf = (t) => {
  if (oe(t))
    return lt;
  const e = t.state;
  return t.total_in = t.total_out = e.total = 0, t.msg = "", e.wrap && (t.adler = e.wrap & 1), e.mode = lo, e.last = 0, e.havedict = 0, e.flags = -1, e.dmax = 32768, e.head = null, e.hold = 0, e.bits = 0, e.lencode = e.lendyn = new Int32Array(Gy), e.distcode = e.distdyn = new Int32Array(Py), e.sane = 1, e.back = -1, ee;
}, pf = (t) => {
  if (oe(t))
    return lt;
  const e = t.state;
  return e.wsize = 0, e.whave = 0, e.wnext = 0, gf(t);
}, df = (t, e) => {
  let n;
  if (oe(t))
    return lt;
  const o = t.state;
  return e < 0 ? (n = 0, e = -e) : (n = (e >> 4) + 5, e < 48 && (e &= 15)), e && (e < 8 || e > 15) ? lt : (o.window !== null && o.wbits !== e && (o.window = null), o.wrap = n, o.wbits = e, pf(t));
}, mf = (t, e) => {
  if (!t)
    return lt;
  const n = new Hy();
  t.state = n, n.strm = t, n.window = null, n.mode = lo;
  const o = df(t, e);
  return o !== ee && (t.state = null), o;
}, Wy = (t) => mf(t, zy);
let Ai = !0, Lo, Bo;
const jy = (t) => {
  if (Ai) {
    Lo = new Int32Array(512), Bo = new Int32Array(32);
    let e = 0;
    for (; e < 144; )
      t.lens[e++] = 8;
    for (; e < 256; )
      t.lens[e++] = 9;
    for (; e < 280; )
      t.lens[e++] = 7;
    for (; e < 288; )
      t.lens[e++] = 8;
    for (je(af, t.lens, 0, 288, Lo, 0, t.work, { bits: 9 }), e = 0; e < 32; )
      t.lens[e++] = 5;
    je(cf, t.lens, 0, 32, Bo, 0, t.work, { bits: 5 }), Ai = !1;
  }
  t.lencode = Lo, t.lenbits = 9, t.distcode = Bo, t.distbits = 5;
}, yf = (t, e, n, o) => {
  let s;
  const r = t.state;
  return r.window === null && (r.wsize = 1 << r.wbits, r.wnext = 0, r.whave = 0, r.window = new Uint8Array(r.wsize)), o >= r.wsize ? (r.window.set(e.subarray(n - r.wsize, n), 0), r.wnext = 0, r.whave = r.wsize) : (s = r.wsize - r.wnext, s > o && (s = o), r.window.set(e.subarray(n - o, n - o + s), r.wnext), o -= s, o ? (r.window.set(e.subarray(n - o, n), 0), r.wnext = o, r.whave = r.wsize) : (r.wnext += s, r.wnext === r.wsize && (r.wnext = 0), r.whave < r.wsize && (r.whave += s))), 0;
}, Yy = (t, e) => {
  let n, o, s, r, i, a, c, f, l, u, h, p, g, d, x = 0, m, y, w, S, _, b, A, k;
  const O = new Uint8Array(4);
  let I, E;
  const T = (
    /* permutation of code lengths */
    new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15])
  );
  if (oe(t) || !t.output || !t.input && t.avail_in !== 0)
    return lt;
  n = t.state, n.mode === bt && (n.mode = Fo), i = t.next_out, s = t.output, c = t.avail_out, r = t.next_in, o = t.input, a = t.avail_in, f = n.hold, l = n.bits, u = a, h = c, k = ee;
  t:
    for (; ; )
      switch (n.mode) {
        case lo:
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
            n.wbits === 0 && (n.wbits = 15), n.check = 0, O[0] = f & 255, O[1] = f >>> 8 & 255, n.check = Y(n.check, O, 2, 0), f = 0, l = 0, n.mode = ei;
            break;
          }
          if (n.head && (n.head.done = !1), !(n.wrap & 1) || /* check if zlib header allowed */
          (((f & 255) << 8) + (f >> 8)) % 31) {
            t.msg = "incorrect header check", n.mode = z;
            break;
          }
          if ((f & 15) !== ti) {
            t.msg = "unknown compression method", n.mode = z;
            break;
          }
          if (f >>>= 4, l -= 4, A = (f & 15) + 8, n.wbits === 0 && (n.wbits = A), A > 15 || A > n.wbits) {
            t.msg = "invalid window size", n.mode = z;
            break;
          }
          n.dmax = 1 << n.wbits, n.flags = 0, t.adler = n.check = 1, n.mode = f & 512 ? fi : bt, f = 0, l = 0;
          break;
        case ei:
          for (; l < 16; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          if (n.flags = f, (n.flags & 255) !== ti) {
            t.msg = "unknown compression method", n.mode = z;
            break;
          }
          if (n.flags & 57344) {
            t.msg = "unknown header flags set", n.mode = z;
            break;
          }
          n.head && (n.head.text = f >> 8 & 1), n.flags & 512 && n.wrap & 4 && (O[0] = f & 255, O[1] = f >>> 8 & 255, n.check = Y(n.check, O, 2, 0)), f = 0, l = 0, n.mode = ni;
        /* falls through */
        case ni:
          for (; l < 32; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          n.head && (n.head.time = f), n.flags & 512 && n.wrap & 4 && (O[0] = f & 255, O[1] = f >>> 8 & 255, O[2] = f >>> 16 & 255, O[3] = f >>> 24 & 255, n.check = Y(n.check, O, 4, 0)), f = 0, l = 0, n.mode = oi;
        /* falls through */
        case oi:
          for (; l < 16; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          n.head && (n.head.xflags = f & 255, n.head.os = f >> 8), n.flags & 512 && n.wrap & 4 && (O[0] = f & 255, O[1] = f >>> 8 & 255, n.check = Y(n.check, O, 2, 0)), f = 0, l = 0, n.mode = si;
        /* falls through */
        case si:
          if (n.flags & 1024) {
            for (; l < 16; ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << l, l += 8;
            }
            n.length = f, n.head && (n.head.extra_len = f), n.flags & 512 && n.wrap & 4 && (O[0] = f & 255, O[1] = f >>> 8 & 255, n.check = Y(n.check, O, 2, 0)), f = 0, l = 0;
          } else n.head && (n.head.extra = null);
          n.mode = ri;
        /* falls through */
        case ri:
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
          n.length = 0, n.mode = ii;
        /* falls through */
        case ii:
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
          n.length = 0, n.mode = ai;
        /* falls through */
        case ai:
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
          n.mode = ci;
        /* falls through */
        case ci:
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
          n.head && (n.head.hcrc = n.flags >> 9 & 1, n.head.done = !0), t.adler = n.check = 0, n.mode = bt;
          break;
        case fi:
          for (; l < 32; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          t.adler = n.check = bi(f), f = 0, l = 0, n.mode = Wn;
        /* falls through */
        case Wn:
          if (n.havedict === 0)
            return t.next_out = i, t.avail_out = c, t.next_in = r, t.avail_in = a, n.hold = f, n.bits = l, $y;
          t.adler = n.check = 1, n.mode = bt;
        /* falls through */
        case bt:
          if (e === By || e === An)
            break t;
        /* falls through */
        case Fo:
          if (n.last) {
            f >>>= l & 7, l -= l & 7, n.mode = Mo;
            break;
          }
          for (; l < 3; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          switch (n.last = f & 1, f >>>= 1, l -= 1, f & 3) {
            case 0:
              n.mode = li;
              break;
            case 1:
              if (jy(n), n.mode = Cn, e === An) {
                f >>>= 2, l -= 2;
                break t;
              }
              break;
            case 2:
              n.mode = hi;
              break;
            case 3:
              t.msg = "invalid block type", n.mode = z;
          }
          f >>>= 2, l -= 2;
          break;
        case li:
          for (f >>>= l & 7, l -= l & 7; l < 32; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          if ((f & 65535) !== (f >>> 16 ^ 65535)) {
            t.msg = "invalid stored block lengths", n.mode = z;
            break;
          }
          if (n.length = f & 65535, f = 0, l = 0, n.mode = Ro, e === An)
            break t;
        /* falls through */
        case Ro:
          n.mode = ui;
        /* falls through */
        case ui:
          if (p = n.length, p) {
            if (p > a && (p = a), p > c && (p = c), p === 0)
              break t;
            s.set(o.subarray(r, r + p), i), a -= p, r += p, c -= p, i += p, n.length -= p;
            break;
          }
          n.mode = bt;
          break;
        case hi:
          for (; l < 14; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          if (n.nlen = (f & 31) + 257, f >>>= 5, l -= 5, n.ndist = (f & 31) + 1, f >>>= 5, l -= 5, n.ncode = (f & 15) + 4, f >>>= 4, l -= 4, n.nlen > 286 || n.ndist > 30) {
            t.msg = "too many length or distance symbols", n.mode = z;
            break;
          }
          n.have = 0, n.mode = gi;
        /* falls through */
        case gi:
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
          if (n.lencode = n.lendyn, n.lenbits = 7, I = { bits: n.lenbits }, k = je(Ly, n.lens, 0, 19, n.lencode, 0, n.work, I), n.lenbits = I.bits, k) {
            t.msg = "invalid code lengths set", n.mode = z;
            break;
          }
          n.have = 0, n.mode = pi;
        /* falls through */
        case pi:
          for (; n.have < n.nlen + n.ndist; ) {
            for (; x = n.lencode[f & (1 << n.lenbits) - 1], m = x >>> 24, y = x >>> 16 & 255, w = x & 65535, !(m <= l); ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << l, l += 8;
            }
            if (w < 16)
              f >>>= m, l -= m, n.lens[n.have++] = w;
            else {
              if (w === 16) {
                for (E = m + 2; l < E; ) {
                  if (a === 0)
                    break t;
                  a--, f += o[r++] << l, l += 8;
                }
                if (f >>>= m, l -= m, n.have === 0) {
                  t.msg = "invalid bit length repeat", n.mode = z;
                  break;
                }
                A = n.lens[n.have - 1], p = 3 + (f & 3), f >>>= 2, l -= 2;
              } else if (w === 17) {
                for (E = m + 3; l < E; ) {
                  if (a === 0)
                    break t;
                  a--, f += o[r++] << l, l += 8;
                }
                f >>>= m, l -= m, A = 0, p = 3 + (f & 7), f >>>= 3, l -= 3;
              } else {
                for (E = m + 7; l < E; ) {
                  if (a === 0)
                    break t;
                  a--, f += o[r++] << l, l += 8;
                }
                f >>>= m, l -= m, A = 0, p = 11 + (f & 127), f >>>= 7, l -= 7;
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
          if (n.lenbits = 9, I = { bits: n.lenbits }, k = je(af, n.lens, 0, n.nlen, n.lencode, 0, n.work, I), n.lenbits = I.bits, k) {
            t.msg = "invalid literal/lengths set", n.mode = z;
            break;
          }
          if (n.distbits = 6, n.distcode = n.distdyn, I = { bits: n.distbits }, k = je(cf, n.lens, n.nlen, n.ndist, n.distcode, 0, n.work, I), n.distbits = I.bits, k) {
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
            t.next_out = i, t.avail_out = c, t.next_in = r, t.avail_in = a, n.hold = f, n.bits = l, Ey(t, h), i = t.next_out, s = t.output, c = t.avail_out, r = t.next_in, o = t.input, a = t.avail_in, f = n.hold, l = n.bits, n.mode === bt && (n.back = -1);
            break;
          }
          for (n.back = 0; x = n.lencode[f & (1 << n.lenbits) - 1], m = x >>> 24, y = x >>> 16 & 255, w = x & 65535, !(m <= l); ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          if (y && (y & 240) === 0) {
            for (S = m, _ = y, b = w; x = n.lencode[b + ((f & (1 << S + _) - 1) >> S)], m = x >>> 24, y = x >>> 16 & 255, w = x & 65535, !(S + m <= l); ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << l, l += 8;
            }
            f >>>= S, l -= S, n.back += S;
          }
          if (f >>>= m, l -= m, n.back += m, n.length = w, y === 0) {
            n.mode = Si;
            break;
          }
          if (y & 32) {
            n.back = -1, n.mode = bt;
            break;
          }
          if (y & 64) {
            t.msg = "invalid literal/length code", n.mode = z;
            break;
          }
          n.extra = y & 15, n.mode = di;
        /* falls through */
        case di:
          if (n.extra) {
            for (E = n.extra; l < E; ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << l, l += 8;
            }
            n.length += f & (1 << n.extra) - 1, f >>>= n.extra, l -= n.extra, n.back += n.extra;
          }
          n.was = n.length, n.mode = mi;
        /* falls through */
        case mi:
          for (; x = n.distcode[f & (1 << n.distbits) - 1], m = x >>> 24, y = x >>> 16 & 255, w = x & 65535, !(m <= l); ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          if ((y & 240) === 0) {
            for (S = m, _ = y, b = w; x = n.distcode[b + ((f & (1 << S + _) - 1) >> S)], m = x >>> 24, y = x >>> 16 & 255, w = x & 65535, !(S + m <= l); ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << l, l += 8;
            }
            f >>>= S, l -= S, n.back += S;
          }
          if (f >>>= m, l -= m, n.back += m, y & 64) {
            t.msg = "invalid distance code", n.mode = z;
            break;
          }
          n.offset = w, n.extra = y & 15, n.mode = yi;
        /* falls through */
        case yi:
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
          n.mode = xi;
        /* falls through */
        case xi:
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
        case Si:
          if (c === 0)
            break t;
          s[i++] = n.length, c--, n.mode = vn;
          break;
        case Mo:
          if (n.wrap) {
            for (; l < 32; ) {
              if (a === 0)
                break t;
              a--, f |= o[r++] << l, l += 8;
            }
            if (h -= c, t.total_out += h, n.total += h, n.wrap & 4 && h && (t.adler = n.check = /*UPDATE_CHECK(state.check, put - _out, _out);*/
            n.flags ? Y(n.check, s, h, i - h) : nn(n.check, s, h, i - h)), h = c, n.wrap & 4 && (n.flags ? f : bi(f)) !== n.check) {
              t.msg = "incorrect data check", n.mode = z;
              break;
            }
            f = 0, l = 0;
          }
          n.mode = _i;
        /* falls through */
        case _i:
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
          n.mode = wi;
        /* falls through */
        case wi:
          k = Vy;
          break t;
        case z:
          k = ff;
          break t;
        case uf:
          return lf;
        case hf:
        /* falls through */
        default:
          return lt;
      }
  return t.next_out = i, t.avail_out = c, t.next_in = r, t.avail_in = a, n.hold = f, n.bits = l, (n.wsize || h !== t.avail_out && n.mode < z && (n.mode < Mo || e !== Qr)) && yf(t, t.output, t.next_out, h - t.avail_out), u -= t.avail_in, h -= t.avail_out, t.total_in += u, t.total_out += h, n.total += h, n.wrap & 4 && h && (t.adler = n.check = /*UPDATE_CHECK(state.check, strm.next_out - _out, _out);*/
  n.flags ? Y(n.check, s, h, t.next_out - h) : nn(n.check, s, h, t.next_out - h)), t.data_type = n.bits + (n.last ? 64 : 0) + (n.mode === bt ? 128 : 0) + (n.mode === Cn || n.mode === Ro ? 256 : 0), (u === 0 && h === 0 || e === Qr) && k === ee && (k = Ny), k;
}, Zy = (t) => {
  if (oe(t))
    return lt;
  let e = t.state;
  return e.window && (e.window = null), t.state = null, ee;
}, Xy = (t, e) => {
  if (oe(t))
    return lt;
  const n = t.state;
  return (n.wrap & 2) === 0 ? lt : (n.head = e, e.done = !1, ee);
}, qy = (t, e) => {
  const n = e.length;
  let o, s, r;
  return oe(t) || (o = t.state, o.wrap !== 0 && o.mode !== Wn) ? lt : o.mode === Wn && (s = 1, s = nn(s, e, n, 0), s !== o.check) ? ff : (r = yf(t, e, n, n), r ? (o.mode = uf, lf) : (o.havedict = 1, ee));
};
var Ky = pf, Jy = df, Qy = gf, tx = Wy, ex = mf, nx = Yy, ox = Zy, sx = Xy, rx = qy, ix = "pako inflate (from Nodeca project)", It = {
  inflateReset: Ky,
  inflateReset2: Jy,
  inflateResetKeep: Qy,
  inflateInit: tx,
  inflateInit2: ex,
  inflate: nx,
  inflateEnd: ox,
  inflateGetHeader: sx,
  inflateSetDictionary: rx,
  inflateInfo: ix
};
function ax() {
  this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
}
var cx = ax;
const xf = Object.prototype.toString, {
  Z_NO_FLUSH: fx,
  Z_FINISH: lx,
  Z_OK: rn,
  Z_STREAM_END: Vo,
  Z_NEED_DICT: $o,
  Z_STREAM_ERROR: ux,
  Z_DATA_ERROR: Ci,
  Z_MEM_ERROR: hx
} = io;
function uo(t) {
  this.options = co.assign({
    chunkSize: 1024 * 64,
    windowBits: 15,
    to: ""
  }, t || {});
  const e = this.options;
  e.raw && e.windowBits >= 0 && e.windowBits < 16 && (e.windowBits = -e.windowBits, e.windowBits === 0 && (e.windowBits = -15)), e.windowBits >= 0 && e.windowBits < 16 && !(t && t.windowBits) && (e.windowBits += 32), e.windowBits > 15 && e.windowBits < 48 && (e.windowBits & 15) === 0 && (e.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new sf(), this.strm.avail_out = 0;
  let n = It.inflateInit2(
    this.strm,
    e.windowBits
  );
  if (n !== rn)
    throw new Error(Qt[n]);
  if (this.header = new cx(), It.inflateGetHeader(this.strm, this.header), e.dictionary && (typeof e.dictionary == "string" ? e.dictionary = sn.string2buf(e.dictionary) : xf.call(e.dictionary) === "[object ArrayBuffer]" && (e.dictionary = new Uint8Array(e.dictionary)), e.raw && (n = It.inflateSetDictionary(this.strm, e.dictionary), n !== rn)))
    throw new Error(Qt[n]);
}
uo.prototype.push = function(t, e) {
  const n = this.strm, o = this.options.chunkSize, s = this.options.dictionary;
  let r, i, a;
  if (this.ended) return !1;
  for (e === ~~e ? i = e : i = e === !0 ? lx : fx, xf.call(t) === "[object ArrayBuffer]" ? n.input = new Uint8Array(t) : n.input = t, n.next_in = 0, n.avail_in = n.input.length; ; ) {
    for (n.avail_out === 0 && (n.output = new Uint8Array(o), n.next_out = 0, n.avail_out = o), r = It.inflate(n, i), r === $o && s && (r = It.inflateSetDictionary(n, s), r === rn ? r = It.inflate(n, i) : r === Ci && (r = $o)); n.avail_in > 0 && r === Vo && n.state.wrap > 0 && t[n.next_in] !== 0; )
      It.inflateReset(n), r = It.inflate(n, i);
    switch (r) {
      case ux:
      case Ci:
      case $o:
      case hx:
        return this.onEnd(r), this.ended = !0, !1;
    }
    if (a = n.avail_out, n.next_out && (n.avail_out === 0 || r === Vo))
      if (this.options.to === "string") {
        let c = sn.utf8border(n.output, n.next_out), f = n.next_out - c, l = sn.buf2string(n.output, c);
        n.next_out = f, n.avail_out = o - f, f && n.output.set(n.output.subarray(c, c + f), 0), this.onData(l);
      } else
        this.onData(n.output.length === n.next_out ? n.output : n.output.subarray(0, n.next_out));
    if (!(r === rn && a === 0)) {
      if (r === Vo)
        return r = It.inflateEnd(this.strm), this.onEnd(r), this.ended = !0, !0;
      if (n.avail_in === 0) break;
    }
  }
  return !0;
};
uo.prototype.onData = function(t) {
  this.chunks.push(t);
};
uo.prototype.onEnd = function(t) {
  t === rn && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = co.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;
};
function gx(t, e) {
  const n = new uo(e);
  if (n.push(t), n.err) throw n.msg || Qt[n.err];
  return n.result;
}
var px = gx, dx = {
  inflate: px
};
const { deflate: mx } = Oy, { inflate: yx } = dx;
var vi = mx, Ii = yx;
const Sf = 2001684038, us = 44, hs = 20, jn = 12, Yn = 16;
function _f(t) {
  const e = new DataView(t), n = new Uint8Array(t);
  if (e.getUint32(0) !== Sf)
    throw new Error("Invalid WOFF1 signature");
  const s = e.getUint32(4), r = e.getUint16(12), i = e.getUint32(24), a = e.getUint32(28), c = e.getUint32(36), f = e.getUint32(40), l = [];
  let u = us;
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
    }), u += hs;
  const h = l.map((O) => {
    const I = n.subarray(
      O.offset,
      O.offset + O.compLength
    );
    let E;
    if (O.compLength < O.origLength) {
      if (E = Ii(I), E.length !== O.origLength)
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
  const { searchRange: d, entrySelector: x, rangeShift: m } = xx(r);
  let y = g;
  for (const O of h)
    y += O.paddedLength;
  const w = new ArrayBuffer(y), S = new DataView(w), _ = new Uint8Array(w);
  S.setUint32(0, s), S.setUint16(4, r), S.setUint16(6, d), S.setUint16(8, x), S.setUint16(10, m);
  const b = h.map((O, I) => ({ ...O, originalIndex: I })).sort((O, I) => O.tag < I.tag ? -1 : O.tag > I.tag ? 1 : 0);
  for (let O = 0; O < b.length; O++) {
    const I = b[O], E = jn + O * Yn;
    for (let T = 0; T < 4; T++)
      S.setUint8(E + T, I.tag.charCodeAt(T));
    S.setUint32(E + 4, I.checksum), S.setUint32(E + 8, g), S.setUint32(E + 12, I.length), _.set(I.data, g), g += I.paddedLength;
  }
  let A = null;
  if (i && a) {
    const O = n.subarray(i, i + a);
    A = Ii(O);
  }
  let k = null;
  return c && f && (k = n.slice(c, c + f)), { sfnt: w, metadata: A, privateData: k };
}
function gs(t, e = null, n = null) {
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
    const A = s.subarray(b.offset, b.offset + b.length), k = vi(A), O = k.length < b.length;
    return {
      tag: b.tag,
      origChecksum: b.checksum,
      origLength: b.length,
      data: O ? k : A,
      compLength: O ? k.length : b.length
    };
  });
  let f = null, l = 0;
  e && e.length > 0 && (l = e.length, f = vi(e));
  let h = us + i * hs;
  h += (4 - h % 4) % 4;
  for (const b of c)
    b.woffOffset = h, h += b.compLength, h += (4 - h % 4) % 4;
  let p = 0, g = 0;
  f && (p = h, g = f.length, h += g, h += (4 - h % 4) % 4);
  let d = 0, x = 0;
  n && n.length > 0 && (d = h, x = n.length, h += x);
  const m = h;
  let y = jn + i * Yn;
  for (const b of c)
    y += b.origLength + (4 - b.origLength % 4) % 4;
  const w = new ArrayBuffer(m), S = new DataView(w), _ = new Uint8Array(w);
  S.setUint32(0, Sf), S.setUint32(4, r), S.setUint32(8, m), S.setUint16(12, i), S.setUint16(14, 0), S.setUint32(16, y), S.setUint16(20, 0), S.setUint16(22, 0), S.setUint32(24, p), S.setUint32(28, g), S.setUint32(32, l), S.setUint32(36, d), S.setUint32(40, x);
  for (let b = 0; b < c.length; b++) {
    const A = c[b], k = us + b * hs;
    for (let O = 0; O < 4; O++)
      S.setUint8(k + O, A.tag.charCodeAt(O));
    S.setUint32(k + 4, A.woffOffset), S.setUint32(k + 8, A.compLength), S.setUint32(k + 12, A.origLength), S.setUint32(k + 16, A.origChecksum);
  }
  for (const b of c)
    _.set(b.data, b.woffOffset);
  return f && _.set(f, p), n && n.length > 0 && _.set(n, d), w;
}
function xx(t) {
  let e = 1, n = 0;
  for (; e * 2 <= t; )
    e *= 2, n++;
  e *= 16;
  const o = t * 16 - e;
  return { searchRange: e, entrySelector: n, rangeShift: o };
}
let Zn = null, xe = null;
async function wf() {
  if (!xe)
    try {
      const { brotliCompressSync: t, brotliDecompressSync: e } = await import("node:zlib");
      Zn = (n) => new Uint8Array(t(n)), xe = (n) => new Uint8Array(e(n));
    } catch {
      const t = await import("brotli-wasm"), e = await (t.default || t);
      Zn = e.compress, xe = e.decompress;
    }
}
function bf() {
  if (!xe)
    throw new Error(
      "WOFF2 support requires initialization. Call `await initWoff2()` before importing or exporting WOFF2 files."
    );
}
const Af = 2001684018, ps = 48, an = 12, cn = 16, ds = [
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
], Cf = /* @__PURE__ */ new Map();
for (let t = 0; t < ds.length; t++) Cf.set(ds[t], t);
function Oi(t, e) {
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
function Sx(t) {
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
function Se(t, e) {
  const n = t[e];
  return n === 253 ? { value: t[e + 1] << 8 | t[e + 2], bytesRead: 3 } : n === 255 ? { value: t[e + 1] + 253, bytesRead: 2 } : n === 254 ? { value: t[e + 1] + 506, bytesRead: 2 } : { value: n, bytesRead: 1 };
}
const _x = wx();
function wx() {
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
    t.push({ xBits: 12, yBits: 12, deltaX: 0, deltaY: 0, xSign: s, ySign: r });
  for (const [s, r] of n)
    t.push({ xBits: 16, yBits: 16, deltaX: 0, deltaY: 0, xSign: s, ySign: r });
  return t;
}
function bx(t, e, n) {
  const o = t & 127, s = !(t & 128), r = _x[o];
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
function Ax(t, e, n, o, s, r, i, a, c) {
  const f = [];
  dt(f, t), dt(f, s), dt(f, r), dt(f, i), dt(f, a);
  for (const g of e) ys(f, g);
  ys(f, o.length);
  for (let g = 0; g < o.length; g++) f.push(o[g]);
  const l = [], u = [], h = [];
  for (let g = 0; g < n.length; g++) {
    const { dx: d, dy: x, onCurve: m } = n[g];
    let y = m ? 1 : 0;
    if (g === 0 && c && (y |= 64), d === 0)
      y |= 16;
    else if (d >= -255 && d <= 255)
      y |= 2, d > 0 ? (y |= 16, u.push(d)) : u.push(-d);
    else {
      const w = d & 65535;
      u.push(w >> 8 & 255, w & 255);
    }
    if (x === 0)
      y |= 32;
    else if (x >= -255 && x <= 255)
      y |= 4, x > 0 ? (y |= 32, h.push(x)) : h.push(-x);
    else {
      const w = x & 65535;
      h.push(w >> 8 & 255, w & 255);
    }
    l.push(y);
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
function Cx(t, e, n, o, s, r) {
  const i = [];
  dt(i, -1), dt(i, n), dt(i, o), dt(i, s), dt(i, r);
  for (let a = 0; a < t.length; a++) i.push(t[a]);
  if (e && e.length > 0) {
    ys(i, e.length);
    for (let a = 0; a < e.length; a++) i.push(e[a]);
  }
  return i;
}
function vx(t, e) {
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
  const c = Ct(n, o);
  o += 4;
  const f = Ct(n, o);
  o += 4;
  const l = Ct(n, o);
  o += 4;
  const u = Ct(n, o);
  o += 4;
  const h = Ct(n, o);
  o += 4;
  const p = Ct(n, o);
  o += 4;
  const g = Ct(n, o);
  o += 4;
  const d = o, x = d + c, m = x + f, y = m + l, w = y + u, S = w + h, _ = S + p, b = 4 * Math.floor((i + 31) / 32), A = S, k = A + b;
  function O(J) {
    const at = J >> 3, Et = 7 - (J & 7);
    return !!(n[A + at] & 1 << Et);
  }
  const I = !!(r & 1), E = _ + g;
  function T(J) {
    if (!I) return !1;
    const at = J >> 3, Et = 7 - (J & 7);
    return !!(n[E + at] & 1 << Et);
  }
  let D = d, F = x, M = m, L = y, H = w, P = k, Z = _;
  const q = [], K = [0];
  let St = 0;
  for (let J = 0; J < i; J++) {
    const at = ct(n, D);
    if (D += 2, at === 0) {
      q.push(null), K.push(St);
      continue;
    }
    if (at > 0) {
      const Et = [];
      let re = 0;
      for (let ut = 0; ut < at; ut++) {
        const { value: wt, bytesRead: ie } = Se(n, F);
        F += ie, re += wt, Et.push(re - 1);
      }
      const Ee = [];
      for (let ut = 0; ut < re; ut++) {
        const wt = n[M++], { dx: ie, dy: Gf, onCurve: Pf, bytesConsumed: Uf } = bx(
          wt,
          n,
          L
        );
        L += Uf, Ee.push({ dx: ie, dy: Gf, onCurve: Pf });
      }
      const { value: Te, bytesRead: ho } = Se(
        n,
        L
      );
      L += ho;
      const go = n.subarray(Z, Z + Te);
      Z += Te;
      let zt, Ht, _t, Wt;
      if (O(J))
        zt = ct(n, P), P += 2, Ht = ct(n, P), P += 2, _t = ct(n, P), P += 2, Wt = ct(n, P), P += 2;
      else {
        let ut = 0, wt = 0;
        zt = 32767, Ht = 32767, _t = -32768, Wt = -32768;
        for (const ie of Ee)
          ut += ie.dx, wt += ie.dy, ut < zt && (zt = ut), ut > _t && (_t = ut), wt < Ht && (Ht = wt), wt > Wt && (Wt = wt);
      }
      const ot = Ax(
        at,
        Et,
        Ee,
        go,
        zt,
        Ht,
        _t,
        Wt,
        T(J)
      );
      q.push(ot);
      const po = ot.length + (ot.length % 2 ? 1 : 0);
      St += po, K.push(St);
    } else {
      const Et = H;
      let re = !1;
      for (; ; ) {
        const ot = n[H] << 8 | n[H + 1];
        if (H += 2, H += 2, ot & 1 ? H += 4 : H += 2, ot & 8 ? H += 2 : ot & 64 ? H += 4 : ot & 128 && (H += 8), ot & 256 && (re = !0), !(ot & 32)) break;
      }
      const Ee = n.subarray(Et, H);
      let Te = new Uint8Array(0);
      if (re) {
        const { value: ot, bytesRead: po } = Se(
          n,
          L
        );
        L += po, Te = n.subarray(Z, Z + ot), Z += ot;
      }
      const ho = ct(n, P);
      P += 2;
      const go = ct(n, P);
      P += 2;
      const zt = ct(n, P);
      P += 2;
      const Ht = ct(n, P);
      P += 2;
      const _t = Cx(
        Ee,
        Te,
        ho,
        go,
        zt,
        Ht
      );
      q.push(_t);
      const Wt = _t.length + (_t.length % 2 ? 1 : 0);
      St += Wt, K.push(St);
    }
  }
  const se = new Uint8Array(St);
  let gn = 0;
  for (const J of q)
    if (J !== null) {
      for (let at = 0; at < J.length; at++)
        se[gn++] = J[at];
      J.length % 2 && gn++;
    }
  return { glyfBytes: se, locaOffsets: K, indexFormat: a };
}
function Ix(t, e, n, o, s) {
  const r = t;
  let i = 0;
  const a = r[i++], c = !(a & 1), f = !(a & 2), l = [];
  for (let m = 0; m < e; m++)
    l.push(r[i] << 8 | r[i + 1]), i += 2;
  const u = [];
  if (c)
    for (let m = 0; m < e; m++)
      u.push(ct(r, i)), i += 2;
  else
    for (let m = 0; m < e; m++)
      u.push(ki(o, s, m));
  const h = n - e, p = [];
  if (f)
    for (let m = 0; m < h; m++)
      p.push(ct(r, i)), i += 2;
  else
    for (let m = 0; m < h; m++)
      p.push(
        ki(o, s, e + m)
      );
  const g = e * 4 + h * 2, d = new Uint8Array(g);
  let x = 0;
  for (let m = 0; m < e; m++) {
    d[x++] = l[m] >> 8 & 255, d[x++] = l[m] & 255;
    const y = u[m] & 65535;
    d[x++] = y >> 8 & 255, d[x++] = y & 255;
  }
  for (let m = 0; m < h; m++) {
    const y = p[m] & 65535;
    d[x++] = y >> 8 & 255, d[x++] = y & 255;
  }
  return d;
}
function ki(t, e, n) {
  const o = e[n], s = e[n + 1];
  return o === s ? 0 : ct(t, o + 2);
}
function Ox(t, e) {
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
function vf(t) {
  bf();
  const e = new Uint8Array(t), n = new DataView(t);
  if (n.getUint32(0) !== Af)
    throw new Error("Invalid WOFF2 signature");
  const s = n.getUint32(4), r = n.getUint16(12), i = n.getUint32(20), a = n.getUint32(28), c = n.getUint32(32), f = n.getUint32(40), l = n.getUint32(44);
  let u = ps;
  const h = [];
  for (let T = 0; T < r; T++) {
    const D = e[u++], F = D & 63, M = D >> 6 & 3;
    let L;
    F === 63 ? (L = String.fromCharCode(
      e[u],
      e[u + 1],
      e[u + 2],
      e[u + 3]
    ), u += 4) : L = ds[F];
    const { value: H, bytesRead: P } = Oi(
      e,
      u
    );
    u += P;
    let Z = H;
    const q = L === "glyf" || L === "loca", K = L === "hmtx";
    if (q && M === 0 || K && M === 1 || !q && !K && M !== 0) {
      const { value: se, bytesRead: gn } = Oi(e, u);
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
    const T = Ct(e, u);
    u += 4;
    const { value: D, bytesRead: F } = Se(e, u);
    u += F;
    const M = [];
    for (let L = 0; L < D; L++) {
      const { value: H, bytesRead: P } = Se(
        e,
        u
      );
      u += P;
      const Z = Ct(e, u);
      u += 4;
      const q = [];
      for (let K = 0; K < H; K++) {
        const { value: St, bytesRead: se } = Se(e, u);
        u += se, q.push(St);
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
  ), x = xe(d);
  let m = 0;
  const y = /* @__PURE__ */ new Map();
  for (const T of h) {
    const D = T.isTransformed ? T.transformLength : T.origLength, F = x.subarray(m, m + D);
    m += D, y.set(T.tag, { data: F, entry: T });
  }
  const w = /* @__PURE__ */ new Map();
  let S = null;
  const _ = y.get("glyf"), b = y.get("loca");
  _ && _.entry.isTransformed && (b && b.entry.origLength, S = vx(_.data), w.set("glyf", S.glyfBytes), w.set(
    "loca",
    Ox(S.locaOffsets, S.indexFormat)
  ));
  const A = y.get("hmtx");
  if (A && A.entry.isTransformed && S) {
    const T = y.get("hhea"), D = y.get("maxp");
    let F = 0, M = 0;
    T && (F = T.data[34] << 8 | T.data[35]), D && (M = D.data[4] << 8 | D.data[5]), w.set(
      "hmtx",
      Ix(
        A.data,
        F,
        M,
        S.glyfBytes,
        S.locaOffsets
      )
    );
  }
  const k = [];
  for (const T of h) {
    const D = T.tag;
    let F;
    w.has(D) ? F = w.get(D) : F = y.get(D).data, k.push({ tag: D, data: F, length: F.length });
  }
  let O;
  p ? O = kx(p, k) : O = If(s, k);
  let I = null;
  if (a && c) {
    const T = e.subarray(a, a + c);
    I = xe(T);
  }
  let E = null;
  return f && l && (E = e.slice(f, f + l)), { sfnt: O.buffer, metadata: I, privateData: E };
}
function If(t, e) {
  const n = e.length, { searchRange: o, entrySelector: s, rangeShift: r } = Ex(n), i = an + n * cn;
  let a = i + (4 - i % 4) % 4;
  const c = e.map((h, p) => ({ ...h, index: p })).sort((h, p) => h.tag < p.tag ? -1 : h.tag > p.tag ? 1 : 0);
  let f = a;
  for (const h of c)
    f += h.length + (4 - h.length % 4) % 4;
  const l = new Uint8Array(f), u = new DataView(l.buffer);
  u.setUint32(0, t), u.setUint16(4, n), u.setUint16(6, o), u.setUint16(8, s), u.setUint16(10, r);
  for (let h = 0; h < c.length; h++) {
    const p = c[h], g = an + h * cn;
    for (let x = 0; x < 4; x++)
      l[g + x] = p.tag.charCodeAt(x);
    const d = Of(p.data);
    u.setUint32(g + 4, d), u.setUint32(g + 8, a), u.setUint32(g + 12, p.length), l.set(
      p.data instanceof Uint8Array ? p.data : new Uint8Array(p.data),
      a
    ), a += p.length + (4 - p.length % 4) % 4;
  }
  return Tx(l, c), l;
}
function kx(t, e, n) {
  const o = [];
  for (const u of t.fonts) {
    const h = u.tableIndices.map((g) => e[g]), p = If(u.flavor, h);
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
function ms(t, e = null, n = null) {
  bf();
  const o = new DataView(t), s = new Uint8Array(t), r = o.getUint32(0), i = o.getUint16(4), a = [];
  for (let F = 0; F < i; F++) {
    const M = an + F * cn, L = String.fromCharCode(
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
  const c = a.filter((F) => F.tag !== "DSIG"), f = [], l = [];
  let u = an + c.length * cn;
  for (const F of c) {
    const M = s.subarray(F.offset, F.offset + F.length), L = Cf.get(F.tag), P = F.tag === "glyf" || F.tag === "loca" ? 3 : 0, q = [(L !== void 0 ? L : 63) | P << 6];
    if (L === void 0)
      for (let K = 0; K < 4; K++) q.push(F.tag.charCodeAt(K));
    q.push(...Sx(F.length)), f.push(q), l.push(M), u += F.length + (4 - F.length % 4) % 4;
  }
  let h = 0;
  for (const F of l) h += F.length;
  const p = new Uint8Array(h);
  let g = 0;
  for (const F of l)
    p.set(F, g), g += F.length;
  const d = Zn(p);
  let x = null, m = 0;
  e && e.length > 0 && (m = e.length, x = Zn(e));
  const y = [];
  for (const F of f) y.push(...F);
  let S = ps + y.length;
  const _ = S;
  S += d.length;
  let b = 0, A = 0;
  x && (S += (4 - S % 4) % 4, b = S, A = x.length, S += A);
  let k = 0, O = 0;
  n && n.length > 0 && (S += (4 - S % 4) % 4, k = S, O = n.length, S += O);
  const I = S, E = new ArrayBuffer(I), T = new DataView(E), D = new Uint8Array(E);
  T.setUint32(0, Af), T.setUint32(4, r), T.setUint32(8, I), T.setUint16(12, c.length), T.setUint16(14, 0), T.setUint32(16, u), T.setUint32(20, d.length), T.setUint16(24, 0), T.setUint16(26, 0), T.setUint32(28, b), T.setUint32(32, A), T.setUint32(36, m), T.setUint32(40, k), T.setUint32(44, O);
  for (let F = 0; F < y.length; F++)
    D[ps + F] = y[F];
  return D.set(
    d instanceof Uint8Array ? d : new Uint8Array(d),
    _
  ), x && D.set(
    x instanceof Uint8Array ? x : new Uint8Array(x),
    b
  ), n && n.length > 0 && D.set(n, k), E;
}
function Ct(t, e) {
  return (t[e] << 24 | t[e + 1] << 16 | t[e + 2] << 8 | t[e + 3]) >>> 0;
}
function ct(t, e) {
  const n = t[e] << 8 | t[e + 1];
  return n > 32767 ? n - 65536 : n;
}
function dt(t, e) {
  const n = e & 65535;
  t.push(n >> 8 & 255, n & 255);
}
function ys(t, e) {
  t.push(e >> 8 & 255, e & 255);
}
function Ex(t) {
  let e = 1, n = 0;
  for (; e * 2 <= t; )
    e *= 2, n++;
  e *= 16;
  const o = t * 16 - e;
  return { searchRange: e, entrySelector: n, rangeShift: o };
}
function Of(t) {
  let e = 0;
  const n = t.length, o = n + (4 - n % 4) % 4;
  for (let s = 0; s < o; s += 4)
    e = e + ((t[s] || 0) << 24 | (t[s + 1] || 0) << 16 | (t[s + 2] || 0) << 8 | (t[s + 3] || 0)) >>> 0;
  return e;
}
function Tx(t, e) {
  let n = -1;
  for (const r of e)
    if (r.tag === "head") {
      const i = t[4] << 8 | t[5];
      for (let a = 0; a < i; a++) {
        const c = an + a * cn;
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
  const s = 2981146554 - Of(t) >>> 0;
  t[n + 8] = s >> 24 & 255, t[n + 9] = s >> 16 & 255, t[n + 10] = s >> 8 & 255, t[n + 11] = s & 255;
}
const Dx = {
  cmap: C0,
  head: Ja,
  hhea: bp,
  HVAR: kp,
  hmtx: Cp,
  maxp: ud,
  MVAR: xd,
  name: vd,
  hdmx: yp,
  BASE: jh,
  JSTF: Np,
  MATH: ad,
  MERG: gd,
  meta: md,
  DSIG: ug,
  LTSH: sd,
  CBLC: me,
  CBDT: Cs,
  "OS/2": Od,
  kern: Zp,
  PCLT: Td,
  VDMX: Zd,
  post: pc,
  STAT: Gd,
  "CFF ": Ia,
  CFF2: lh,
  VORG: ph,
  fvar: wg,
  avar: yh,
  loca: Bc,
  glyf: F1,
  gvar: G1,
  GDEF: Og,
  GPOS: Ug,
  GSUB: ap,
  "cvt ": A1,
  cvar: w1,
  fpgm: v1,
  prep: H1,
  gasp: O1,
  vhea: Qd,
  VVAR: r1,
  vmtx: e1,
  COLR: rg,
  CPAL: ag,
  EBDT: pg,
  EBLC: mg,
  EBSC: xg,
  bloc: f0,
  bdat: e0,
  sbix: Ld,
  ltag: nd,
  "SVG ": zd
}, Ei = 12, Ti = 16;
function Fx(t, e) {
  const n = t.padEnd(4, " "), o = e.padEnd(4, " ");
  for (let s = 0; s < 4; s++) {
    const r = n.charCodeAt(s) - o.charCodeAt(s);
    if (r !== 0) return r;
  }
  return 0;
}
function Rx(t) {
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
const Mx = /* @__PURE__ */ new Set([
  "sfnt",
  "woff",
  "woff2",
  "cff",
  "ttf",
  "otf"
]), Di = {
  ttf: "truetype",
  otf: "cff"
};
function Lx(t) {
  if (t._standalone === "cff") return "cff";
  const e = t._woff?.version;
  return e === 2 ? "woff2" : e === 1 ? "woff" : "sfnt";
}
function Fi(t, e = {}) {
  if (!t || typeof t != "object")
    throw new TypeError("exportFont expects a font data object");
  let n = e.format ? e.format.toLowerCase() : Lx(t);
  if (!Mx.has(n))
    throw new Error(
      `Unknown export format "${n}". Supported: sfnt, woff, woff2, cff, ttf, otf.`
    );
  if (Di[n] && (t = sa(t, Di[n]), n = "sfnt"), Vx(t)) {
    if (n === "cff")
      throw new Error("CFF export does not support font collections.");
    if (e.split)
      return Bx(t, n);
    const r = Gx(t);
    return n === "woff" ? gs(
      r,
      t._woff?.metadata,
      t._woff?.privateData
    ) : n === "woff2" ? ms(
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
    const a = Ia(i), c = new ArrayBuffer(a.length);
    return new Uint8Array(c).set(a), c;
  }
  const o = Xn(t), s = qn(o, 0);
  if (n === "woff") {
    const r = t._woff?.metadata ?? null, i = t._woff?.privateData ?? null;
    return gs(s, r, i);
  }
  if (n === "woff2") {
    const r = t._woff?.metadata ?? null, i = t._woff?.privateData ?? null;
    return ms(s, r, i);
  }
  return s;
}
function Bx(t, e) {
  const { fonts: n } = t;
  if (!Array.isArray(n) || n.length === 0)
    throw new Error("Collection split expects a non-empty fonts array");
  return n.map((o) => {
    const s = Xn(o), r = qn(s, 0);
    return e === "woff" ? gs(r) : e === "woff2" ? ms(r) : r;
  });
}
function Vx(t) {
  return t.collection && t.collection.tag === "ttcf" && Array.isArray(t.fonts);
}
function Ri(t, e) {
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
function $x(t, e) {
  const n = e?.unitsPerEm || 1e3;
  if (n === 1e3) return;
  const o = t?.fonts?.[0];
  if (!o) return;
  o.topDict = o.topDict || {};
  const s = 1 / n, r = o.topDict.FontMatrix;
  Array.isArray(r) && r.length === 6 && Math.abs(r[0] - s) < 1e-9 && r[1] === 0 && r[2] === 0 && Math.abs(r[3] - s) < 1e-9 || (o.topDict.FontMatrix = [s, 0, 0, s, 0, 0]);
}
function Nx(t, e) {
  const n = t?.fonts?.[0];
  if (!n || !Array.isArray(n.charStrings)) return;
  const o = t.globalSubrs || [], s = n.localSubrs || [], r = n.privateDict?.nominalWidthX ?? 0, i = n.privateDict?.defaultWidthX ?? 0, a = Math.min(n.charStrings.length, e.length);
  for (let c = 0; c < a; c++) {
    const f = e[c]?.advanceWidth;
    Number.isFinite(f) && (n.charStrings[c] = ga(n.charStrings[c], f, {
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
    const e = Qs(t);
    for (const [n, o] of Object.entries(t.tables))
      !wl.has(n) && !e.tables[n] && (e.tables[n] = o);
    return t.tables["CFF "] && e.tables["CFF "] && Ri(t.tables["CFF "], t.glyphs) && (e.tables["CFF "] = t.tables["CFF "], $x(e.tables["CFF "], t.font), Nx(e.tables["CFF "], t.glyphs)), t.tables.CFF2 && e.tables.CFF2 && Ri(t.tables.CFF2, t.glyphs) && (e.tables.CFF2 = t.tables.CFF2), e;
  }
  if (t._header && t.tables)
    return { header: t._header, tables: t.tables };
  if (t.font && t.glyphs)
    return Qs(t);
  throw new Error(
    "exportFont: input must have { header, tables } or { font, glyphs }"
  );
}
function qn(t, e) {
  const { header: n, tables: o } = t, s = Object.keys(o).sort(Fx), r = s.length, i = Px(o), a = s.map((y) => {
    const w = o[y];
    let S;
    if (i.has(y))
      S = i.get(y);
    else if (w._raw)
      S = w._raw;
    else {
      const A = Dx[y];
      if (!A)
        throw new Error(`No writer registered for parsed table: ${y}`);
      S = A(w);
    }
    const _ = new Uint8Array(S), b = w._raw && typeof w._checksum == "number" && !i.has(y);
    return {
      tag: y,
      data: _,
      length: _.length,
      paddedLength: _.length + (4 - _.length % 4) % 4,
      checksum: b ? w._checksum >>> 0 : Rx(_)
    };
  }), c = Ei + r * Ti;
  let f = c + (4 - c % 4) % 4;
  for (const y of a)
    y.offset = f, f += y.paddedLength;
  const l = f, u = new ArrayBuffer(l), h = new DataView(u), p = new Uint8Array(u), g = r > 0 ? 2 ** Math.floor(Math.log2(r)) : 0, d = g * 16, x = g > 0 ? Math.floor(Math.log2(g)) : 0, m = r * 16 - d;
  h.setUint32(0, n.sfVersion), h.setUint16(4, r), h.setUint16(6, d), h.setUint16(8, x), h.setUint16(10, m);
  for (let y = 0; y < a.length; y++) {
    const w = a[y], S = Ei + y * Ti;
    for (let _ = 0; _ < 4; _++)
      h.setUint8(S + _, w.tag.charCodeAt(_));
    h.setUint32(S + 4, w.checksum), h.setUint32(S + 8, w.offset + e), h.setUint32(S + 12, w.length);
  }
  for (const y of a)
    p.set(y.data, y.offset);
  return u;
}
function Gx(t) {
  const { collection: e, fonts: n } = t;
  if (!Array.isArray(n) || n.length === 0)
    throw new Error("TTC/OTC export expects a non-empty fonts array");
  const o = n.map((m) => Xn(m)), s = e.majorVersion ?? 2, r = e.minorVersion ?? 0, i = o.length, a = s >= 2, c = 12 + i * 4 + (a ? 12 : 0);
  let f = c + (4 - c % 4) % 4;
  const u = o.map(
    (m) => new Uint8Array(qn(m, 0))
  ).map((m) => {
    const y = f;
    return f += m.length, f += (4 - f % 4) % 4, y;
  }), h = o.map(
    (m, y) => new Uint8Array(qn(m, u[y]))
  ), p = f, g = new ArrayBuffer(p), d = new DataView(g), x = new Uint8Array(g);
  d.setUint8(0, 116), d.setUint8(1, 116), d.setUint8(2, 99), d.setUint8(3, 102), d.setUint16(4, s), d.setUint16(6, r), d.setUint32(8, i);
  for (let m = 0; m < i; m++)
    d.setUint32(12 + m * 4, u[m]);
  if (a) {
    const m = 12 + i * 4;
    d.setUint32(m + 0, e.dsigTag ?? 0), d.setUint32(m + 4, e.dsigLength ?? 0), d.setUint32(m + 8, e.dsigOffset ?? 0);
  }
  for (let m = 0; m < i; m++)
    x.set(h[m], u[m]);
  return g;
}
function Px(t) {
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
      e.set("post", pc(h));
    }
  }
  const o = t.glyf && !t.glyf._raw, s = t.loca && !t.loca._raw;
  if (o && s) {
    const { bytes: u, offsets: h } = Lc(t.glyf);
    if (e.set("glyf", u), e.set("loca", Bc({ offsets: h })), t.head && !t.head._raw) {
      const g = h.every((d) => d % 2 === 0 && d / 2 <= 65535) ? 0 : 1;
      t.head.indexToLocFormat !== g && e.set(
        "head",
        Ja({ ...t.head, indexToLocFormat: g })
      );
    }
  }
  const r = t.CBLC && !t.CBLC._raw && t.CBLC.sizes, i = t.CBDT && !t.CBDT._raw && t.CBDT.bitmapData;
  if (r && i) {
    const { bytes: u, offsetInfo: h } = yo(
      t.CBDT,
      t.CBLC
    );
    e.set("CBDT", u), e.set("CBLC", me(t.CBLC, h));
  }
  const a = t.EBLC && !t.EBLC._raw && t.EBLC.sizes, c = t.EBDT && !t.EBDT._raw && t.EBDT.bitmapData;
  if (a && c) {
    const { bytes: u, offsetInfo: h } = yo(t.EBDT, t.EBLC);
    e.set("EBDT", u), e.set("EBLC", me(t.EBLC, h));
  }
  const f = t.bloc && !t.bloc._raw && t.bloc.sizes, l = t.bdat && !t.bdat._raw && t.bdat.bitmapData;
  if (f && l) {
    const { bytes: u, offsetInfo: h } = yo(t.bdat, t.bloc);
    e.set("bdat", u), e.set("bloc", me(t.bloc, h));
  }
  return e;
}
const kf = {
  cmap: l0,
  head: Zo,
  hhea: wp,
  HVAR: Ip,
  hmtx: Ap,
  maxp: ld,
  MVAR: yd,
  name: Cd,
  hdmx: mp,
  BASE: Gh,
  JSTF: $p,
  MATH: id,
  MERG: hd,
  meta: dd,
  DSIG: lg,
  LTSH: od,
  CBLC: vs,
  CBDT: As,
  "OS/2": Id,
  kern: Up,
  PCLT: Ed,
  VDMX: Yd,
  post: Dd,
  STAT: $d,
  "CFF ": va,
  CFF2: fh,
  VORG: gh,
  fvar: _g,
  avar: mh,
  loca: U1,
  glyf: k1,
  gvar: $1,
  GDEF: bg,
  GPOS: Mg,
  GSUB: tp,
  "cvt ": b1,
  cvar: _1,
  fpgm: C1,
  prep: z1,
  gasp: I1,
  vhea: Jd,
  VVAR: o1,
  vmtx: t1,
  COLR: sg,
  CPAL: ig,
  EBLC: dg,
  EBDT: gg,
  EBSC: yg,
  bloc: c0,
  bdat: t0,
  sbix: Md,
  ltag: ed,
  "SVG ": Ud
}, Ef = [
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
      const { sfnt: s, metadata: r, privateData: i } = _f(t), a = Kn(s);
      return a._woff = { version: 1 }, r && (a._woff.metadata = r), i && (a._woff.privateData = i), a;
    }
    if (o === "wOF2") {
      const { sfnt: s, metadata: r, privateData: i } = vf(t), a = Kn(s);
      return a._woff = { version: 2 }, r && (a._woff.metadata = r), i && (a._woff.privateData = i), a;
    }
    if (o === "ttcf")
      return zx(t);
  }
  if (e.length >= 4 && e[0] === 1 && e[1] === 0 && e[3] >= 1 && e[3] <= 4)
    return Wx(t);
  if (e.length >= 6 && e[0] === 128 && (e[1] === 1 || e[1] === 2))
    return jx(t);
  if (e.length >= 2 && e[0] === 37 && e[1] === 33)
    return Yx(t);
  const n = Ux(t);
  return bs(n);
}
function Ux(t) {
  if (!(t instanceof ArrayBuffer))
    throw new TypeError("importFontTables expects an ArrayBuffer");
  const e = new R(new Uint8Array(t)), n = Tf(e), o = Df(e, n.numTables), s = Ff(t, o);
  return { header: n, tables: s };
}
function zx(t) {
  const e = new R(new Uint8Array(t)), n = e.tag();
  if (n !== "ttcf")
    throw new Error("Invalid TTC/OTC collection signature");
  const o = e.uint16(), s = e.uint16(), r = e.uint32(), i = e.array("uint32", r);
  let a, c, f;
  o >= 2 && (a = e.uint32(), c = e.uint32(), f = e.uint32());
  const l = i.map((h) => {
    const p = new R(new Uint8Array(t), h), g = Tf(p), d = Df(p, g.numTables), x = Hx(
      t,
      d,
      h
    ), m = Ff(t, x);
    return bs({ header: g, tables: m });
  }), u = {
    tag: n,
    majorVersion: o,
    minorVersion: s,
    numFonts: r
  };
  return o >= 2 && (u.dsigTag = a, u.dsigLength = c, u.dsigOffset = f), { collection: u, fonts: l };
}
function Hx(t, e, n) {
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
  const c = Zo(
    Array.from(new Uint8Array(t, s, o.length))
  ), f = Zo(
    Array.from(new Uint8Array(t, r, o.length))
  ), l = c.magicNumber === 1594834165;
  return f.magicNumber === 1594834165 && !l ? e.map((h) => ({
    ...h,
    offset: n + h.offset
  })) : e;
}
function Tf(t) {
  return {
    sfVersion: t.uint32(),
    numTables: t.uint16(),
    searchRange: t.uint16(),
    entrySelector: t.uint16(),
    rangeShift: t.uint16()
  };
}
function Df(t, e) {
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
function Ff(t, e) {
  const n = {}, o = new Map(e.map((a) => [a.tag, a])), s = Ef.filter((a) => o.has(a)), r = e.map((a) => a.tag).filter((a) => !s.includes(a)), i = [...s, ...r];
  for (const a of i) {
    const c = o.get(a), f = c.offset, l = new Uint8Array(t, f, c.length), u = Array.from(l), h = kf[a];
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
function Wx(t) {
  const e = Array.from(new Uint8Array(t)), n = va(e), o = n.fonts[0], s = o?.topDict || {}, r = o?.charStrings || [], i = r.length, a = s.FontBBox || [0, 0, 1e3, 1e3], c = a[3] - a[1] || 1e3, f = n.names && n.names[0] || "CFFFont", l = {
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
  for (let y = 0; y < i; y++) {
    let w = p;
    if (r[y] && r[y].length > 0) {
      const S = n.globalSubrs || [], _ = o.localSubrs || [];
      try {
        const b = Jn(r[y], S, _);
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
    const y = o.encoding.codes || [], w = new Array(256).fill(0);
    for (let S = 0; S < y.length && S < 256; S++) {
      const _ = y[S];
      _ >= 0 && _ < 256 && (w[_] = S + 1);
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
  const m = bs({ header: { sfVersion: 1330926671 }, tables: l });
  return m._standalone = "cff", m;
}
function jx(t) {
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
  const r = Li(n), i = Li(o), a = new TextDecoder("latin1").decode(r);
  return Rf(a, i);
}
function Yx(t) {
  const e = new TextDecoder("latin1").decode(new Uint8Array(t)), n = "currentfile eexec", o = e.indexOf(n);
  if (o === -1)
    throw new Error('PFA: could not find "currentfile eexec" marker');
  const s = e.slice(0, o + n.length), i = e.slice(o + n.length).replace(/\s/g, ""), a = i.search(/0{64,}$/), c = a > 0 ? i.slice(0, a) : i, f = new Uint8Array(c.length / 2);
  for (let l = 0; l < f.length; l++)
    f[l] = parseInt(c.slice(l * 2, l * 2 + 2), 16);
  return Rf(s, f);
}
function Ns(t, e, n) {
  const o = new Uint8Array(t.length);
  let s = e;
  const r = 52845, i = 22719;
  for (let a = 0; a < t.length; a++) {
    const c = t[a];
    o[a] = c ^ s >>> 8, s = (c + s) * r + i & 65535;
  }
  return o.slice(n);
}
function Mi(t, e) {
  const n = [], o = [], s = [];
  let r = null, i = 0, a = 0, c = 0, f = 0, l = [], u = !1;
  function h(x, m) {
    r && r.length > 0 && s.push(r), r = [{ type: "M", x, y: m }];
  }
  function p(x, m) {
    r && r.push({ type: "L", x, y: m });
  }
  function g(x, m, y, w, S, _) {
    r && r.push({ type: "C", x1: x, y1: m, x2: y, y2: w, x: S, y: _ });
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
        const S = (x[y + 1] << 24 | x[y + 2] << 16 | x[y + 3] << 8 | x[y + 4]) >> 0;
        n.push(S), y += 5;
        continue;
      }
      if (w === 12) {
        const S = x[y + 1];
        switch (y += 2, S) {
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
            const _ = n.pop(), b = n.pop();
            n.push(_ !== 0 ? b / _ : 0);
            break;
          }
          case 16: {
            const _ = n.pop(), b = n.pop(), A = n.splice(n.length - b, b);
            if (_ === 0) {
              if (u = !1, l.length >= 7) {
                const k = l;
                g(k[1].x, k[1].y, k[2].x, k[2].y, k[3].x, k[3].y), g(k[4].x, k[4].y, k[5].x, k[5].y, k[6].x, k[6].y), i = k[6].x, a = k[6].y;
              }
              l = [], o.push(A[1]), o.push(A[0]);
            } else _ === 1 ? (u = !0, l = [{ x: i, y: a }], o.push(...A)) : _ === 2 ? o.push(...A) : _ === 3 ? o.push(3) : o.push(...A);
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
          const S = n.pop() || 0;
          u ? (a += S, l.push({ x: i, y: a })) : (a += S, h(i, a)), n.length = 0;
          break;
        }
        case 5: {
          const S = n.pop() || 0, _ = n.pop() || 0;
          i += _, a += S, p(i, a), n.length = 0;
          break;
        }
        case 6: {
          const S = n.pop() || 0;
          i += S, p(i, a), n.length = 0;
          break;
        }
        case 7: {
          const S = n.pop() || 0;
          a += S, p(i, a), n.length = 0;
          break;
        }
        case 8: {
          const S = n.pop() || 0, _ = n.pop() || 0, b = n.pop() || 0, A = n.pop() || 0, k = n.pop() || 0, O = n.pop() || 0, I = i + O, E = a + k, T = I + A, D = E + b;
          i = T + _, a = D + S, g(I, E, T, D, i, a), n.length = 0;
          break;
        }
        case 9: {
          r && r.length > 0 && (s.push(r), r = null), n.length = 0;
          break;
        }
        case 10: {
          const S = n.pop();
          S >= 0 && S < e.length && e[S] && d(e[S], m + 1);
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
          const S = n.pop() || 0, _ = n.pop() || 0;
          u ? (i += _, a += S, l.push({ x: i, y: a })) : (i += _, a += S, h(i, a)), n.length = 0;
          break;
        }
        case 22: {
          const S = n.pop() || 0;
          u ? (i += S, l.push({ x: i, y: a })) : (i += S, h(i, a)), n.length = 0;
          break;
        }
        case 30: {
          const S = n.pop() || 0, _ = n.pop() || 0, b = n.pop() || 0, A = n.pop() || 0, k = i, O = a + A, I = k + b, E = O + _;
          i = I + S, a = E, g(k, O, I, E, i, a), n.length = 0;
          break;
        }
        case 31: {
          const S = n.pop() || 0, _ = n.pop() || 0, b = n.pop() || 0, A = n.pop() || 0, k = i + A, O = a, I = k + b, E = O + _;
          i = I, a = E + S, g(k, O, I, E, i, a), n.length = 0;
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
function Zx(t) {
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
  return i && (e.FontMatrix = i.slice(1, 7).map(Number)), e.encoding = Xx(t), e;
}
function Xx(t) {
  const e = /* @__PURE__ */ new Map(), n = /dup\s+(\d+)\s+\/([^\s]+)\s+put/g;
  let o;
  for (; (o = n.exec(t)) !== null; )
    e.set(parseInt(o[1]), o[2]);
  return e;
}
function qx(t) {
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
    Kx(
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
      const g = p[1], d = parseInt(p[2]), x = p.index + p[0].length, m = Mn(u, x), y = u.slice(m, m + d), w = Ns(y, 4330, o);
      c.set(g, w);
    }
  }
  return { charStrings: c, subrs: i, privateDict: s };
}
function Kx(t, e, n, o, s) {
  const r = /dup\s+(\d+)\s+(\d+)\s+(?:RD|-\|)\s/g;
  let i;
  for (; (i = r.exec(t)) !== null; ) {
    const a = parseInt(i[1]), c = parseInt(i[2]), f = i.index + i[0].length, l = Mn(e, f), u = e.slice(l, l + c), h = Ns(u, 4330, o);
    s(a, h);
  }
}
function Mn(t, e) {
  return e;
}
function Rf(t, e) {
  const n = Ns(e, 55665, 4), o = Zx(t), { charStrings: s, subrs: r } = qx(n), i = o.FontBBox || [0, 0, 1e3, 1e3], a = o.FontMatrix || [1e-3, 0, 0, 1e-3, 0, 0], c = Math.round(1 / a[0]), f = o.FontName || o.FamilyName || "Type1Font", l = i[3], u = i[1], h = [];
  if (s.has(".notdef")) {
    const d = Mi(s.get(".notdef"), r);
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
    const m = Mi(x, r), y = p.get(d) ?? null;
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
function Li(t) {
  const e = t.reduce((s, r) => s + r.length, 0), n = new Uint8Array(e);
  let o = 0;
  for (const s of t)
    n.set(s, o), o += s.length;
  return n;
}
const Jx = /* @__PURE__ */ new Set([
  "_dirty",
  "_fileName",
  "_originalBuffer",
  "_collection",
  "_collectionFonts",
  "_woff"
]);
function Qx(t, e = 2) {
  return JSON.stringify(
    t,
    function(n, o) {
      if (!(this === t && Jx.has(n)))
        return typeof o == "bigint" ? Number(o) : ArrayBuffer.isView(o) && !(o instanceof DataView) ? Array.from(o) : o;
    },
    e
  );
}
function No(t) {
  return JSON.parse(t);
}
function tS(t) {
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
      Bi(r.left, r.right, r.value, n, o);
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
        Bi(i.left, i.right, i.value, n, o);
  const s = /* @__PURE__ */ new Map();
  for (const r of o)
    s.set(`${r.left}\0${r.right}`, r);
  return [...s.values()];
}
function Bi(t, e, n, o, s) {
  const r = de(t, o), i = de(e, o);
  for (const a of r)
    for (const c of i)
      s.push({ left: a, right: c, value: n });
}
function eS(t, e, n) {
  const o = t?.kerning;
  if (!o || !Array.isArray(o) || o.length === 0)
    return;
  const s = t.glyphs, r = Rt(s, e), i = Rt(s, n);
  if (!(r === void 0 || i === void 0))
    for (let a = o.length - 1; a >= 0; a--) {
      const c = o[a];
      if (c.left === r && c.right === i) return c.value;
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
function nS(t) {
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
            from: jt(l.from, n),
            to: jt(l.to, n)
          });
          break;
        case "multiple":
          o.push({
            ...u,
            from: jt(l.from, n),
            to: Le(l.to, n)
          });
          break;
        case "alternate":
          o.push({
            ...u,
            from: jt(l.from, n),
            alternates: Le(l.alternates, n)
          });
          break;
        case "ligature":
          o.push({
            ...u,
            components: Le(l.components, n),
            ligature: jt(l.ligature, n)
          });
          break;
        case "reverse":
          o.push({
            ...u,
            from: jt(l.from, n),
            to: jt(l.to, n),
            backtrack: (l.backtrack || []).map(
              (h) => Le(h, n)
            ),
            lookahead: (l.lookahead || []).map(
              (h) => Le(h, n)
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
function oS(t, e, n = {}) {
  const o = t?.substitutions;
  if (!o || !Array.isArray(o) || o.length === 0) return [];
  const s = t.glyphs, r = Rt(s, e);
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
function jt(t, e) {
  if (typeof t == "string" && t.startsWith("@")) {
    const n = t.slice(1), o = e[n];
    if (!o)
      throw new Error(`createSubstitution: unknown class "@${n}"`);
    return o;
  }
  return t;
}
function Le(t, e) {
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
const sS = [
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
], rS = ["CFF ", "CFF2", "VORG"], iS = [
  "cvar",
  "cvt ",
  "fpgm",
  "gasp",
  "glyf",
  "gvar",
  "loca",
  "prep"
], Mf = /* @__PURE__ */ new Set([
  ...sS,
  ...rS,
  ...iS
]), Lf = [
  "cmap",
  "head",
  "hhea",
  "hmtx",
  "maxp",
  "name",
  "post"
], aS = /* @__PURE__ */ new Map([
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
function cS(t) {
  for (let e = 0; e < t.length; e++) {
    const n = t.charCodeAt(e);
    if (n < 32 || n > 126) return !1;
  }
  return !0;
}
function fS(t, e, n) {
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
function lS(t, e) {
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
    C(e, "info", "FORMAT_WOFF1", "File is WOFF1-wrapped."), AS(t, e);
    try {
      const { sfnt: s } = _f(t);
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
    C(e, "info", "FORMAT_WOFF2", "File is WOFF2-wrapped."), CS(t, e);
    try {
      const { sfnt: s } = vf(t);
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
function uS(t, e) {
  const n = new Uint8Array(t), o = new R(n);
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
  const r = aS.get(s.sfVersion);
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
function hS(t, e, n) {
  const o = new Uint8Array(t), s = new R(o, 12), r = [], i = /* @__PURE__ */ new Set();
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
    if (!cS(l.tag)) {
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
function gS(t, e) {
  const n = new Set(t.map((r) => r.tag));
  for (const r of Lf)
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
    Mf.has(r) || C(
      e,
      "info",
      "UNKNOWN_TABLE",
      `Unrecognized table '${r}' — will be preserved as raw bytes.`
    );
}
function pS(t, e, n) {
  const o = new Uint8Array(t);
  for (const s of e) {
    if (s.offset + s.length > t.byteLength || s.length === 0 || s.tag === "head") continue;
    const r = fS(o, s.offset, s.length);
    r !== s.checksum && C(
      n,
      "warning",
      "BAD_CHECKSUM",
      `Table '${s.tag}' checksum mismatch: directory says 0x${s.checksum.toString(16).padStart(8, "0")}, computed 0x${r.toString(16).padStart(8, "0")}.`
    );
  }
}
function dS(t, e, n) {
  const o = new Map(e.map((c) => [c.tag, c])), s = {}, r = Ef.filter((c) => o.has(c)), i = e.map((c) => c.tag).filter((c) => !r.includes(c)), a = [...r, ...i];
  for (const c of a) {
    const f = o.get(c);
    if (f.offset + f.length > t.byteLength) continue;
    const l = kf[c];
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
function mS(t) {
  return t >= 6155 && t <= 6157 || t >= 65024 && t <= 65039 || t >= 917760 && t <= 917999;
}
function yS(t) {
  if (t.idRangeOffset === 0) {
    const e = t.startCode + t.idDelta & 65535, n = t.endCode + t.idDelta & 65535;
    return Math.max(e, n);
  }
  return null;
}
function xS(t, e, n) {
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
          const m = yS(x);
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
      const l = c.varSelectorRecords || [];
      let u = -1, h = !1, p = !1;
      for (let g = 0; g < l.length; g++) {
        const d = l[g];
        if (!mS(d.varSelector) && !p) {
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
const Vi = 783, $i = 127;
function SS(t, e, n) {
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
  ), typeof t.fsType == "number" && (t.fsType & ~Vi) !== 0 && C(
    n,
    "warning",
    "OS2_FSTYPE_RESERVED_BITS_SET",
    `OS/2.fsType has reserved bits set (0x${(t.fsType >>> 0).toString(16).padStart(4, "0")}); valid mask is 0x${Vi.toString(16).padStart(4, "0")}.`
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
    ), (e.macStyle & ~$i) !== 0 && C(
      n,
      "warning",
      "HEAD_MACSTYLE_RESERVED_BITS_SET",
      `head.macStyle has reserved bits set (0x${e.macStyle.toString(16).padStart(4, "0")}); valid mask is 0x${$i.toString(16).padStart(4, "0")}.`
    );
  }
}
const Ni = 32 * 1024, Gi = 200, _S = /[\x00-\x20\x7F-\uFFFF[\](){}<>/%]/;
function wS(t, e, n, o) {
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
      const p = 6 + h * 12, g = i.getUint16(p + 8), d = i.getUint16(p + 10), x = c + d, m = x + g;
      m > s.length && (l || (C(
        o,
        "error",
        "NAME_RECORD_OUT_OF_BOUNDS",
        `name record ${h} string overruns the table (offset ${x} + length ${g} = ${m}, table length ${s.length}).`
      ), l = !0)), g > Ni && C(
        o,
        "warning",
        "NAME_STRING_TOO_LONG",
        `name record ${h} (nameID=${i.getUint16(p + 6)}) is ${g} bytes; > ${Ni} is suspicious.`
      );
    }
  }
  if (Array.isArray(t.langTagRecords))
    for (let i = 0; i < t.langTagRecords.length; i++) {
      const c = (t.langTagRecords[i].tag ?? "").length * 2;
      c > Gi && C(
        o,
        "error",
        "NAME_LANG_TAG_TOO_LONG",
        `name.langTagRecord ${i} is ${c} bytes; spec limit is ${Gi}.`
      );
    }
  const r = t.nameRecords ?? t.names ?? t.records ?? [];
  for (const i of r) {
    if (i.nameID !== 6) continue;
    const a = i.value ?? i.string ?? "";
    if (typeof a == "string" && _S.test(a)) {
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
const Be = 44, In = 20, bS = 48;
function AS(t, e) {
  if (t.byteLength < Be) return;
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
  const u = Be + s * In;
  if (u <= t.byteLength) {
    let p = 12 + 16 * s;
    for (let g = 0; g < s; g++) {
      const d = n.getUint32(
        Be + g * In + 12
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
      const g = n.getUint32(Be + p * In + 4), d = n.getUint32(
        Be + p * In + 8
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
function CS(t, e) {
  if (t.byteLength < bS) return;
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
const Pi = 224;
function vS(t, e) {
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
function Ui(t, e, n) {
  const o = t?.lookupList?.lookups ?? [], s = 1, r = e === "GSUB" ? 8 : 9;
  let i = !1, a = !1;
  for (let c = 0; c < o.length; c++) {
    const f = o[c];
    if ((typeof f.lookupType != "number" || f.lookupType < s || f.lookupType > r) && (i || (C(
      n,
      "error",
      `${e}_LOOKUP_TYPE_INVALID`,
      `${e} lookup ${c} has invalid lookupType ${f.lookupType}; must be in [${s}, ${r}].`
    ), i = !0)), typeof f.lookupFlag == "number" && (f.lookupFlag & Pi) !== 0 && !a && (C(
      n,
      "warning",
      "LAYOUT_LOOKUP_FLAG_RESERVED",
      `${e} lookup ${c} has reserved bits set in lookupFlag (0x${f.lookupFlag.toString(16).padStart(
        4,
        "0"
      )}); reserved mask is 0x${Pi.toString(16).padStart(4, "0")}.`
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
const IS = 65534, OS = 65534;
function kS(t, e, n) {
  const o = t.axes ?? [], s = t.instances ?? [], r = /* @__PURE__ */ new Set();
  if (e && Array.isArray(e.names))
    for (const i of e.names)
      i && typeof i.nameID == "number" && r.add(i.nameID);
  for (let i = 0; i < o.length; i++) {
    const a = o[i];
    typeof a.flags == "number" && (a.flags & IS) !== 0 && C(
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
    typeof a.flags == "number" && (a.flags & OS) !== 0 && C(
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
function ES(t, e, n) {
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
function TS(t, e, n) {
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
function Gs(t, e, n, o) {
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
function DS(t, e, n) {
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
  Gs(o, e?.axes?.length ?? 0, "MVAR", n);
}
function zi(t, e, n, o) {
  Gs(
    t.itemVariationStore,
    n?.axes?.length ?? 0,
    e,
    o
  );
}
function FS(t, e, n, o, s) {
  if (s ||= Ps(), typeof t.majorVersion == "number" && t.majorVersion !== 1 && C(
    o,
    "error",
    "GDEF_VERSION_INVALID",
    `GDEF majorVersion must be 1, got ${t.majorVersion}.`
  ), t.glyphClassDef && xs(
    t.glyphClassDef,
    e,
    "GDEF.glyphClassDef",
    o,
    { maxClass: 4 },
    // 1=base, 2=ligature, 3=mark, 4=component
    s
  ), t.markAttachClassDef && xs(
    t.markAttachClassDef,
    e,
    "GDEF.markAttachClassDef",
    o,
    {},
    s
  ), t.attachList?.coverage && Ye(
    t.attachList.coverage,
    e,
    "GDEF.attachList.coverage",
    o,
    s
  ), t.ligCaretList?.coverage && Ye(
    t.ligCaretList.coverage,
    e,
    "GDEF.ligCaretList.coverage",
    o,
    s
  ), t.markGlyphSetsDef?.coverages)
    for (let r = 0; r < t.markGlyphSetsDef.coverages.length; r++)
      Ye(
        t.markGlyphSetsDef.coverages[r],
        e,
        `GDEF.markGlyphSetsDef.coverages[${r}]`,
        o,
        s
      );
  t.itemVariationStore && Gs(
    t.itemVariationStore,
    n?.axes?.length ?? 0,
    "GDEF",
    o
  );
}
function Ps() {
  return { coverages: /* @__PURE__ */ new WeakSet(), classDefs: /* @__PURE__ */ new WeakSet() };
}
function Ye(t, e, n, o, s) {
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
function xs(t, e, n, o, s = {}, r) {
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
function Hi(t, e, n, o, s) {
  s ||= Ps();
  const r = t?.lookupList?.lookups ?? [];
  for (let i = 0; i < r.length; i++) {
    const a = r[i], c = a.subtables ?? [];
    for (let f = 0; f < c.length; f++) {
      const l = c[f];
      if (!l || typeof l != "object") continue;
      const u = `${e} lookup ${i} (type ${a.lookupType}) subtable ${f}`;
      if (l.coverage && Ye(l.coverage, n, `${u}.coverage`, o, s), Array.isArray(l.coverages))
        for (let h = 0; h < l.coverages.length; h++)
          Ye(
            l.coverages[h],
            n,
            `${u}.coverages[${h}]`,
            o,
            s
          );
      if (l.classDef && xs(
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
function RS(t, e) {
  typeof t.version == "number" && t.version !== 65536 && C(
    e,
    "error",
    "MATH_VERSION_INVALID",
    `MATH table version must be 0x00010000, got 0x${t.version.toString(16).padStart(8, "0")}.`
  );
}
const MS = /* @__PURE__ */ new Set([
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
]), LS = /* @__PURE__ */ new Set([
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
]), BS = /* @__PURE__ */ new Set([
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
]), Wi = 10, ji = 48, Yi = 513;
function Zi(t, e, n, o = !1) {
  const s = o ? [
    {
      charStrings: t.charStrings || [],
      localSubrs: t.fontDicts?.[0]?.localSubrs || []
    }
  ] : t.fonts || [], r = t.globalSubrs || [], i = Xi(r.length), a = /* @__PURE__ */ new Set();
  function c(f, l, u) {
    a.has(f) || (a.add(f), C(n, l, f, u));
  }
  for (let f = 0; f < s.length; f++) {
    const l = s[f], u = l.charStrings || [], h = l.localSubrs || [], p = Xi(h.length);
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
      Bf(
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
      ), x.maxStackSeen > (o ? Yi : ji) && c(
        "CFF_STACK_OVERFLOW",
        "error",
        `${e}: charstring for glyph ${g} pushed ${x.maxStackSeen} operands, exceeding the ${o ? "CFF2" : "Type 2"} limit of ${o ? Yi : ji}.`
      );
    }
  }
}
function Xi(t) {
  return t < 1240 ? 107 : t < 33900 ? 1131 : 32768;
}
function Bf(t, e, n, o, s, r, i, a, c, f, l) {
  if (e.depth > Wi) {
    f(
      "CFF_SUBR_DEPTH_EXCEEDED",
      "error",
      `${i}: charstring for glyph ${c} exceeded subroutine recursion depth ${Wi}.`
    );
    return;
  }
  let u = 0;
  for (; u < t.length; ) {
    const h = t[u];
    if (h === 28 || h >= 32) {
      const g = VS(t, u);
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
      if (!BS.has(g)) {
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
    if (!(l ? LS : MS).has(h)) {
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
      e.depth++, Bf(
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
function VS(t, e) {
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
const qi = 16;
function $S(t, e, n) {
  const o = t?.glyphs;
  if (!Array.isArray(o)) return;
  let s = !1, r = !1, i = !1;
  function a(c, f) {
    if (s || r) return;
    const l = o[c];
    if (!(!l || !Array.isArray(l.components))) {
      if (f.length >= qi) {
        r = !0, C(
          n,
          "error",
          "GLYF_COMPOSITE_DEPTH_EXCEEDED",
          `glyf composite glyph chain starting at glyph ${f[0]} exceeds maximum nesting depth ${qi}.`
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
function NS(t, e, n) {
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
const GS = [
  [6155, 6157],
  // Mongolian Free Variation Selectors
  [65024, 65039],
  // Variation Selectors
  [917760, 917999]
  // Variation Selectors Supplement
];
function PS(t, e) {
  const n = t?.subTables ?? t?.subtables ?? [];
  let o = !1, s = !1;
  for (const r of n) {
    if (r?.format !== 14) continue;
    const i = r.varSelectorRecords ?? r.variationSelectors ?? [];
    let a = -1;
    for (let c = 0; c < i.length; c++) {
      const f = i[c], l = f.varSelector ?? f.variationSelector;
      if (typeof l != "number") continue;
      !GS.some(
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
function US(t, e) {
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
function Go(t, e, n) {
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
function zS(t, e) {
  t.fpgm?.instructions && Go(t.fpgm.instructions, "fpgm", e), t.prep?.instructions && Go(t.prep.instructions, "prep", e);
  const n = t.glyf?.glyphs;
  if (Array.isArray(n)) {
    const o = e.length;
    for (let s = 0; s < n.length; s++) {
      const r = n[s]?.instructions;
      if (!(!r || r.length === 0) && (Go(r, `glyf glyph ${s}`, e), e.length > o))
        break;
    }
  }
}
function HS(t, e, n, o) {
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
  if (t["OS/2"] && SS(t["OS/2"], t.head, n), t.maxp && t.hmtx) {
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
    wS(t.name, e, o, n);
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
  t.cmap && xS(t.cmap, t.maxp, n);
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
  const a = t.maxp?.numGlyphs ?? 0, c = t.fvar, f = Ps();
  c && (vS(c, n), kS(c, t.name, n)), t.STAT && ES(t.STAT, c, n), t.avar && TS(t.avar, c, n), t.HVAR && zi(t.HVAR, "HVAR", c, n), t.VVAR && zi(t.VVAR, "VVAR", c, n), t.MVAR && DS(t.MVAR, c, n), t.GDEF && FS(t.GDEF, a, c, n, f), t.GSUB && (Ui(t.GSUB, "GSUB", n), Hi(
    t.GSUB,
    "GSUB",
    a,
    n,
    f
  )), t.GPOS && (Ui(t.GPOS, "GPOS", n), Hi(
    t.GPOS,
    "GPOS",
    a,
    n,
    f
  )), t.MATH && RS(t.MATH, n), t["CFF "] && Zi(t["CFF "], "CFF", n, !1), t.CFF2 && Zi(t.CFF2, "CFF2", n, !0), t.glyf && ($S(t.glyf, a, n), NS(t.glyf, t.head, n)), t.cmap && (PS(t.cmap, n), US(t.cmap, n)), zS(t, n);
}
function WS(t) {
  const e = new R(new Uint8Array(t));
  e.skip(4);
  const n = e.uint16();
  e.skip(2);
  const o = e.uint32();
  if (o === 0) return null;
  const s = e.uint32();
  return { majorVersion: n, numFonts: o, firstOffset: s };
}
function jS(t) {
  const e = [];
  t && typeof t.byteLength == "number" && t.byteLength > 1073741824 && C(
    e,
    "error",
    "FILE_EXCEEDS_1GB",
    `Font file is ${t.byteLength} bytes (> 1 GiB); Firefox/OTS will reject it.`
  );
  const n = lS(t, e);
  if (!n) return Tt(e);
  let o = n.sfnt;
  if (n.format === "collection")
    try {
      const a = WS(o);
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
  const s = uS(o, e);
  if (!s) return Tt(e);
  const r = hS(o, s, e);
  if (r.length === 0 && s.numTables > 0)
    return C(
      e,
      "error",
      "NO_READABLE_ENTRIES",
      "Could not read any table directory entries."
    ), Tt(e);
  gS(r, e), pS(o, r, e);
  const i = dS(o, r, e);
  return HS(i, r, e, o), Tt(e);
}
function xt(t) {
  return t !== null && typeof t == "object" && !Array.isArray(t);
}
function Vf(t) {
  return Number.isInteger(t) && t >= 0 && t <= 4294967295;
}
function $f(t) {
  return Array.isArray(t?._raw);
}
function N(t, e, n, o, s) {
  t.push({ severity: e, code: n, message: o, path: s });
}
function Ki(t) {
  const e = t > 0 ? 2 ** Math.floor(Math.log2(t)) : 0, n = e * 16, o = e > 0 ? Math.floor(Math.log2(e)) : 0, s = t * 16 - n;
  return { searchRange: n, entrySelector: o, rangeShift: s };
}
function Ji(t) {
  return xt(t) && (t["CFF "] || t.CFF2) ? 1330926671 : 65536;
}
function Qi(t) {
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
function YS(t, e, n, o) {
  let s = t.header;
  if (!xt(s))
    if (xt(t._header))
      t.header = { ...t._header }, s = t.header, N(
        o,
        "info",
        "HEADER_PROMOTED",
        'No "header" found; promoted "_header" for export compatibility.',
        n
      );
    else {
      const a = Ji(t.tables), c = Ki(e);
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
  if (!Vf(s.sfVersion)) {
    const a = Ji(t.tables);
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
  const r = Ki(e);
  (s.searchRange !== r.searchRange || s.entrySelector !== r.entrySelector || s.rangeShift !== r.rangeShift) && (s.searchRange = r.searchRange, s.entrySelector = r.entrySelector, s.rangeShift = r.rangeShift, N(
    o,
    "info",
    "HEADER_FIELDS_CORRECTED",
    `Header directory fields auto-corrected for ${e} tables (searchRange=${r.searchRange}, entrySelector=${r.entrySelector}, rangeShift=${r.rangeShift}).`,
    n
  ));
}
function ZS(t, e, n) {
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
function XS(t, e, n) {
  if (!xt(t))
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
    if (!xt(r)) {
      N(
        n,
        "error",
        "TABLE_DATA_INVALID",
        `Table "${s}" must be an object.`,
        i
      );
      continue;
    }
    r._checksum !== void 0 && !Vf(r._checksum) && N(
      n,
      "error",
      "TABLE_CHECKSUM_INVALID",
      `Table "${s}" _checksum must be uint32 when provided.`,
      `${i}._checksum`
    ), r._raw !== void 0 && ZS(r._raw, `${i}._raw`, n);
    const a = Mf.has(s), c = $f(r);
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
function qS(t, e, n) {
  const o = (i) => t[i] !== void 0, s = (i) => o(i) && !$f(t[i]), r = (i, a, c = "requires") => {
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
function KS(t, e, n) {
  const o = (i) => t[i] !== void 0;
  for (const i of Lf)
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
function Nf(t, e, n) {
  if (!xt(t)) {
    N(
      n,
      "error",
      "FONTDATA_INVALID",
      "Font data must be an object.",
      e
    );
    return;
  }
  const o = XS(t.tables, `${e}.tables`, n);
  YS(t, o.length, `${e}.header`, n), xt(t.tables) && (KS(t.tables, `${e}.tables`, n), qS(t.tables, `${e}.tables`, n));
}
function JS(t, e, n) {
  const o = t.collection, s = t.fonts;
  if (xt(o) || N(
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
  xt(o) && o.numFonts !== void 0 && o.numFonts !== s.length && (o.numFonts = s.length, N(
    n,
    "info",
    "COLLECTION_NUMFONTS_CORRECTED",
    `collection.numFonts corrected to ${s.length} to match fonts array.`,
    `${e}.collection.numFonts`
  ));
  for (let r = 0; r < s.length; r++)
    Nf(s[r], `${e}.fonts[${r}]`, n);
}
function QS(t) {
  const e = [];
  return xt(t) ? (t.collection !== void 0 || t.fonts !== void 0 ? JS(t, "$", e) : Nf(t, "$", e), Qi(e)) : (N(
    e,
    "error",
    "INPUT_INVALID",
    "validateJSON expects a font JSON object.",
    "$"
  ), Qi(e));
}
function ta(t) {
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
const t2 = {
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
function e2(t, e) {
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
class At {
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
   * Returns a FontFlux instance with .notdef and space glyphs, ready for
   * addGlyph() calls and immediate export.
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
        { ...t2 },
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
    return new At(a);
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
    const n = ta(e);
    if (n.kind === "json") {
      const s = No(n.text);
      if (s && s.collection && Array.isArray(s.fonts))
        throw new Error(
          "FontFlux.open() received a font collection JSON. Use FontFlux.openAll() for collections."
        );
      return new At(s);
    }
    const o = Kn(n.buffer);
    if (o.collection && o.fonts)
      throw new Error(
        "FontFlux.open() received a font collection (TTC/OTC). Use FontFlux.openAll() for collections."
      );
    return new At(o);
  }
  /**
   * Open all fonts from a binary file or JSON. Works for both single fonts
   * and collections.  Accepts the same input types as `FontFlux.open()`.
   *
   * @param {ArrayBuffer|Uint8Array|string} input
   * @returns {FontFlux[]} Array of FontFlux instances (one per face).
   */
  static openAll(e) {
    const n = ta(e);
    if (n.kind === "json") {
      const s = No(n.text);
      return s && s.collection && Array.isArray(s.fonts) ? s.fonts.map((r) => new At(r)) : [new At(s)];
    }
    const o = Kn(n.buffer);
    return o.collection && o.fonts ? o.fonts.map((s) => new At(s)) : [new At(o)];
  }
  /**
   * Restore a font from a JSON string.
   *
   * @param {string} jsonString - JSON produced by font.toJSON().
   * @returns {FontFlux}
   */
  static fromJSON(e) {
    const n = No(e);
    return new At(n);
  }
  /**
   * Initialize WOFF2 support. Must be called (and awaited) once before
   * opening or exporting WOFF2 files.
   *
   * @returns {Promise<void>}
   */
  static async initWoff2() {
    return wf();
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
    return Fi(o, n);
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
    return jS(e);
  }
  /** Convert an SVG path `d` string to font contours. */
  static svgToContours(e, n) {
    return ea(e, n);
  }
  /** Convert font contours to an SVG path `d` string. */
  static contoursToSVG(e) {
    return el(e);
  }
  /** Compile CFF contours to Type 2 charstring bytecode. */
  static compileCharString(e) {
    return Ze(e);
  }
  /** Assemble charstring assembly text to Type 2 bytecode. */
  static assembleCharString(e) {
    return tl(e);
  }
  /** Interpret Type 2 charstring bytecode to CFF contours. */
  static interpretCharString(e, n, o) {
    return Jn(e, n, o);
  }
  /** Disassemble Type 2 charstring bytecode to assembly text. */
  static disassembleCharString(e) {
    return fa(e);
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
    return n ? ws(this._data.glyphs, n) : [];
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
    (n.path || n.name && n.advanceWidth && !n._created) && (n = al(n));
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
      n.name = e2(o, n);
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
    return eS(this._data, e, n);
  }
  /**
   * Add kerning pairs. Accepts all createKerning() input formats.
   * Duplicate pairs are resolved with last-write-wins.
   *
   * @param {object|object[]} pairsOrInput - Kerning data in any supported format.
   */
  addKerning(e) {
    const n = tS(e);
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
    const o = this._data.glyphs, s = Rt(o, e), r = Rt(o, n);
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
    return oS(this._data, e, n);
  }
  /**
   * Add substitution rules. Accepts the same flexible formats as
   * createSubstitution(): single rules, arrays, class-based, etc.
   *
   * @param {object|object[]} rulesOrInput - Substitution rule(s).
   */
  addSubstitution(e) {
    const n = nS(e);
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
    const n = Us(e);
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
    const r = Us([o]);
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
    const n = Rt(this._data.glyphs, e);
    if (n)
      return this._data.colorGlyphs?.find((o) => o.name === n);
  }
  /**
   * Add color data for a glyph. Replaces existing color data for the same glyph.
   *
   * @param {object} input - Color glyph data with `name` and either `layers` or `paint`.
   */
  addColorGlyph(e) {
    const n = Hf(e);
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
    const n = Rt(this._data.glyphs, e);
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
    return Fi(this._data, e);
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
    return this._data = sa(this._data, e), this;
  }
  /**
   * Serialize the font to a JSON string.
   *
   * @param {number} [indent=2] - Indentation level.
   * @returns {string}
   */
  toJSON(e) {
    return Qx(this._data, e);
  }
  /**
   * Validate the font data.
   *
   * @returns {object} { valid, errors, warnings, infos }
   */
  validate() {
    return QS(this._data);
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
async function n2() {
  return wf();
}
export {
  At as FontFlux,
  jS as diagnoseFont,
  No as fontFromJSON,
  Qx as fontToJSON,
  n2 as initWoff2
};
