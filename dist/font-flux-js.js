function fo(t) {
  if (typeof t != "string" || t[0] !== "#")
    throw new Error(`Invalid hex color: ${t}`);
  let e, n, s, o;
  const i = t.slice(1);
  if (i.length === 3)
    e = parseInt(i[0] + i[0], 16), n = parseInt(i[1] + i[1], 16), s = parseInt(i[2] + i[2], 16), o = 255;
  else if (i.length === 4)
    e = parseInt(i[0] + i[0], 16), n = parseInt(i[1] + i[1], 16), s = parseInt(i[2] + i[2], 16), o = parseInt(i[3] + i[3], 16);
  else if (i.length === 6)
    e = parseInt(i.slice(0, 2), 16), n = parseInt(i.slice(2, 4), 16), s = parseInt(i.slice(4, 6), 16), o = 255;
  else if (i.length === 8)
    e = parseInt(i.slice(0, 2), 16), n = parseInt(i.slice(2, 4), 16), s = parseInt(i.slice(4, 6), 16), o = parseInt(i.slice(6, 8), 16);
  else
    throw new Error(`Invalid hex color length: ${t}`);
  if ([e, n, s, o].some((r) => isNaN(r)))
    throw new Error(`Invalid hex color: ${t}`);
  return { blue: s, green: n, red: e, alpha: o };
}
function uo(t) {
  const e = (t.red & 255).toString(16).padStart(2, "0"), n = (t.green & 255).toString(16).padStart(2, "0"), s = (t.blue & 255).toString(16).padStart(2, "0");
  if (t.alpha === 255 || t.alpha === void 0)
    return `#${e}${n}${s}`;
  const o = (t.alpha & 255).toString(16).padStart(2, "0");
  return `#${e}${n}${s}${o}`;
}
function Eo(t) {
  if (!Array.isArray(t))
    throw new Error("Palette must be an array of colors");
  return t.map((e) => {
    if (typeof e == "string")
      return fo(e), ff(e);
    if (e && typeof e == "object" && "red" in e)
      return uo(e);
    throw new Error(`Invalid palette color: ${e}`);
  });
}
function ff(t) {
  return uo(fo(t));
}
function uf(t) {
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
function lf(t) {
  const e = /* @__PURE__ */ new Map();
  for (let n = 0; n < t.length; n++)
    e.set(n, t[n].name);
  return e;
}
function hf(t) {
  const e = /* @__PURE__ */ new Map();
  for (let n = 0; n < t.length; n++)
    t[n].name && e.set(t[n].name, n);
  return e;
}
function Sn(t, e) {
  !t || typeof t != "object" || (t.glyphID !== void 0 && typeof t.glyphID == "number" && (t.glyphID = e.get(t.glyphID) ?? t.glyphID), t.paint && Sn(t.paint, e), t.sourcePaint && Sn(t.sourcePaint, e), t.backdropPaint && Sn(t.backdropPaint, e));
}
function _n(t, e) {
  if (!(!t || typeof t != "object")) {
    if (t.glyphID !== void 0 && typeof t.glyphID == "string") {
      const n = e.get(t.glyphID);
      n !== void 0 && (t.glyphID = n);
    }
    t.paint && _n(t.paint, e), t.sourcePaint && _n(t.sourcePaint, e), t.backdropPaint && _n(t.backdropPaint, e);
  }
}
function j(t) {
  if (!Number.isInteger(t) || t < -32768 || t > 32767)
    return pf(t);
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
function pf(t) {
  const e = Math.round(t * 65536), n = e < 0 ? e + 4294967296 : e;
  return [
    255,
    n >> 24 & 255,
    n >> 16 & 255,
    n >> 8 & 255,
    n & 255
  ];
}
const Bo = 21, gf = 22, df = 4, mf = 5, yf = 6, xf = 7, wf = 8, Mo = 14;
function On(t) {
  if (!t || t.length === 0)
    return [...j(0), ...j(0), Bo, Mo];
  const e = [];
  let n = 0, s = 0;
  for (const o of t)
    if (!(!o || o.length === 0))
      for (const i of o)
        switch (i.type) {
          case "M": {
            const r = i.x - n, a = i.y - s;
            r === 0 && a !== 0 ? e.push(...j(a), df) : a === 0 && r !== 0 ? e.push(...j(r), gf) : e.push(...j(r), ...j(a), Bo), n = i.x, s = i.y;
            break;
          }
          case "L": {
            const r = i.x - n, a = i.y - s;
            r === 0 && a !== 0 ? e.push(...j(a), xf) : a === 0 && r !== 0 ? e.push(...j(r), yf) : e.push(...j(r), ...j(a), mf), n = i.x, s = i.y;
            break;
          }
          case "C": {
            const r = i.x1 - n, a = i.y1 - s, c = i.x2 - i.x1, f = i.y2 - i.y1, u = i.x - i.x2, l = i.y - i.y2;
            e.push(
              ...j(r),
              ...j(a),
              ...j(c),
              ...j(f),
              ...j(u),
              ...j(l),
              wf
            ), n = i.x, s = i.y;
            break;
          }
        }
  return e.push(Mo), e;
}
const Lo = {
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
function Sf(t) {
  const e = [], n = t.split(`
`).filter((s) => s.trim().length > 0);
  for (const s of n) {
    const o = s.trim().split(/\s+/);
    if (o.length === 0) continue;
    let i = -1, r = null;
    for (let a = 0; a < o.length; a++) {
      const c = o[a].toLowerCase();
      if (Lo[c] || c.startsWith("op")) {
        i = a, r = c;
        break;
      }
    }
    if (i === -1) {
      for (const a of o)
        e.push(...j(parseFloat(a)));
      continue;
    }
    for (let a = 0; a < i; a++)
      e.push(...j(parseFloat(o[a])));
    if (r.startsWith("op12.")) {
      const a = parseInt(r.slice(5), 10);
      e.push(12, a);
    } else r.startsWith("op") ? e.push(parseInt(r.slice(2), 10)) : e.push(...Lo[r]);
    if (r === "hintmask" || r === "cntrmask") {
      const a = o.slice(i + 1).join("");
      if (a.length > 0)
        for (let c = 0; c < a.length; c += 8) {
          const f = a.slice(c, c + 8).padEnd(8, "0");
          e.push(parseInt(f, 2));
        }
    }
  }
  return e;
}
function _f(t) {
  if (!t || t.length === 0) return "";
  const e = [];
  for (const n of t)
    !n || n.length === 0 || (n[0].type ? e.push(bf(n)) : e.push(vf(n)));
  return e.join(" ");
}
function bf(t) {
  const e = [];
  for (const n of t)
    switch (n.type) {
      case "M":
        e.push(`M${N(n.x)} ${N(n.y)}`);
        break;
      case "L":
        e.push(`L${N(n.x)} ${N(n.y)}`);
        break;
      case "C":
        e.push(
          `C${N(n.x1)} ${N(n.y1)} ${N(n.x2)} ${N(n.y2)} ${N(n.x)} ${N(n.y)}`
        );
        break;
    }
  return e.push("Z"), e.join(" ");
}
function vf(t) {
  if (t.length === 0) return "";
  const e = [], n = t.length;
  let s = 0;
  for (let a = 0; a < n; a++)
    if (t[a].onCurve) {
      s = a;
      break;
    }
  const o = t[s];
  e.push(`M${N(o.x)} ${N(o.y)}`);
  let i = 1;
  for (; i < n; ) {
    const a = (s + i) % n, c = t[a];
    if (c.onCurve)
      e.push(`L${N(c.x)} ${N(c.y)}`), i++;
    else {
      const f = (s + i + 1) % n, u = t[f];
      if (u.onCurve)
        e.push(`Q${N(c.x)} ${N(c.y)} ${N(u.x)} ${N(u.y)}`), i += 2;
      else {
        const l = (c.x + u.x) / 2, h = (c.y + u.y) / 2;
        e.push(`Q${N(c.x)} ${N(c.y)} ${N(l)} ${N(h)}`), i++;
      }
    }
  }
  const r = t[(s + n - 1) % n];
  return r.onCurve || e.push(
    `Q${N(r.x)} ${N(r.y)} ${N(o.x)} ${N(o.y)}`
  ), e.push("Z"), e.join(" ");
}
function Or(t, e = "cff") {
  const n = Af(t);
  if (n.length === 0) return [];
  const s = [];
  let o = null;
  for (const i of n)
    i.op === "M" ? (o && o.length > 0 && s.push(o), o = [i]) : i.op === "Z" ? (o && o.length > 0 && s.push(o), o = null) : o && o.push(i);
  return o && o.length > 0 && s.push(o), e === "truetype" ? s.map((i) => Cf(i)) : s.map((i) => kf(i));
}
function kf(t) {
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
        const s = e[e.length - 1], o = s ? s.x : 0, i = s ? s.y : 0, r = o + 2 / 3 * (n.x1 - o), a = i + 2 / 3 * (n.y1 - i), c = n.x + 2 / 3 * (n.x1 - n.x), f = n.y + 2 / 3 * (n.y1 - n.y);
        e.push({
          type: "C",
          x1: r,
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
function Cf(t) {
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
        const s = e[e.length - 1], o = s ? s.x : 0, i = s ? s.y : 0, r = Es(
          o,
          i,
          n.x1,
          n.y1,
          n.x2,
          n.y2,
          n.x,
          n.y
        );
        for (const a of r)
          e.push({ x: a.cx, y: a.cy, onCurve: !1 }), e.push({ x: a.x, y: a.y, onCurve: !0 });
        break;
      }
    }
  return e;
}
function Af(t) {
  const e = [], n = t.match(
    /[MmLlHhVvCcSsQqTtZz]|[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g
  );
  if (!n) return e;
  let s = 0, o = 0, i = 0, r = 0, a = "", c = 0, f = 0, u = 0;
  function l() {
    return parseFloat(n[u++]);
  }
  for (; u < n.length; ) {
    let h = n[u];
    /[A-Za-z]/.test(h) ? u++ : h = a;
    const g = h === h.toLowerCase();
    switch (h.toUpperCase()) {
      case "M": {
        let d = l(), x = l();
        g && (d += s, x += o), e.push({ op: "M", x: d, y: x }), s = i = d, o = r = x, a = g ? "l" : "L";
        break;
      }
      case "L": {
        let d = l(), x = l();
        g && (d += s, x += o), e.push({ op: "L", x: d, y: x }), s = d, o = x, a = h;
        break;
      }
      case "H": {
        let d = l();
        g && (d += s), e.push({ op: "L", x: d, y: o }), s = d, a = h;
        break;
      }
      case "V": {
        let d = l();
        g && (d += o), e.push({ op: "L", x: s, y: d }), o = d, a = h;
        break;
      }
      case "C": {
        let d = l(), x = l(), m = l(), y = l(), _ = l(), w = l();
        g && (d += s, x += o, m += s, y += o, _ += s, w += o), e.push({ op: "C", x1: d, y1: x, x2: m, y2: y, x: _, y: w }), c = m, f = y, s = _, o = w, a = h;
        break;
      }
      case "S": {
        let d = 2 * s - c, x = 2 * o - f;
        a.toUpperCase() !== "C" && a.toUpperCase() !== "S" && (d = s, x = o);
        let m = l(), y = l(), _ = l(), w = l();
        g && (m += s, y += o, _ += s, w += o), e.push({ op: "C", x1: d, y1: x, x2: m, y2: y, x: _, y: w }), c = m, f = y, s = _, o = w, a = h;
        break;
      }
      case "Q": {
        let d = l(), x = l(), m = l(), y = l();
        g && (d += s, x += o, m += s, y += o), e.push({ op: "Q", x1: d, y1: x, x: m, y }), c = d, f = x, s = m, o = y, a = h;
        break;
      }
      case "T": {
        let d = 2 * s - c, x = 2 * o - f;
        a.toUpperCase() !== "Q" && a.toUpperCase() !== "T" && (d = s, x = o);
        let m = l(), y = l();
        g && (m += s, y += o), e.push({ op: "Q", x1: d, y1: x, x: m, y }), c = d, f = x, s = m, o = y, a = h;
        break;
      }
      case "Z": {
        e.push({ op: "Z" }), s = i, o = r, a = h;
        break;
      }
      default:
        a = h;
        break;
    }
  }
  return e;
}
function Es(t, e, n, s, o, i, r, a, c = 0) {
  const f = (3 * (n + o) - t - r) / 4, u = (3 * (s + i) - e - a) / 4, l = t + 2 / 3 * (f - t), h = e + 2 / 3 * (u - e), g = r + 2 / 3 * (f - r), p = a + 2 / 3 * (u - a), d = Math.hypot(n - l, s - h), x = Math.hypot(o - g, i - p);
  if (Math.max(d, x) <= 0.5 || c >= 8)
    return [{ cx: f, cy: u, x: r, y: a }];
  const y = (t + n) / 2, _ = (e + s) / 2, w = (n + o) / 2, S = (s + i) / 2, b = (o + r) / 2, v = (i + a) / 2, I = (y + w) / 2, A = (_ + S) / 2, C = (w + b) / 2, O = (S + v) / 2, T = (I + C) / 2, D = (A + O) / 2, E = Es(
    t,
    e,
    y,
    _,
    I,
    A,
    T,
    D,
    c + 1
  ), M = Es(
    T,
    D,
    C,
    O,
    b,
    v,
    r,
    a,
    c + 1
  );
  return E.concat(M);
}
function N(t) {
  const e = Math.round(t * 100) / 100;
  return e === Math.floor(e) ? String(e) : e.toFixed(2).replace(/0+$/, "");
}
function If(t) {
  if (!t || typeof t != "object")
    throw new Error("createGlyph: options object is required");
  const {
    name: e,
    unicode: n,
    unicodes: s,
    advanceWidth: o,
    leftSideBearing: i,
    advanceHeight: r,
    topSideBearing: a,
    path: c,
    contours: f,
    charString: u,
    components: l,
    instructions: h,
    format: g = "truetype"
  } = t;
  if (e == null)
    throw new Error("createGlyph: name is required");
  if (o == null)
    throw new Error("createGlyph: advanceWidth is required");
  const p = {
    name: e,
    advanceWidth: o
  };
  if (s && s.length > 0 ? p.unicodes = s : n != null && (p.unicode = n), i !== void 0 && (p.leftSideBearing = i), r !== void 0 && (p.advanceHeight = r), a !== void 0 && (p.topSideBearing = a), h && (p.instructions = h), u)
    p.charString = u;
  else if (c) {
    const d = Or(c, g);
    p.contours = d, g === "cff" && (p.charString = On(d));
  } else f ? (p.contours = f, f.length > 0 && f[0] && f[0].length > 0 && f[0][0].type && (p.charString = On(f))) : l && (p.components = l);
  return p;
}
function as(t, e) {
  const n = t?.glyphs;
  if (!n || !Array.isArray(n)) return;
  const s = Tr(e);
  if (s !== void 0)
    return Dr(n, s);
  if (typeof e == "string")
    return n.find((o) => o.name === e);
}
function Dt(t, e) {
  const n = Tr(e);
  if (n !== void 0)
    return Dr(t, n)?.name;
  if (typeof e == "string")
    return e;
}
function Tr(t) {
  if (typeof t == "number") return t;
  if (typeof t == "string") {
    const e = t.match(/^(?:U\+|0x)([0-9A-Fa-f]+)$/i);
    if (e) return parseInt(e[1], 16);
  }
}
function Dr(t, e) {
  for (const n of t)
    if (n.unicode === e || n.unicodes && n.unicodes.includes(e) || n.codePoint === e) return n;
}
function Er(t, e) {
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
    const s = t[e + 1] << 8 | t[e + 2];
    return { value: s > 32767 ? s - 65536 : s, bytesConsumed: 3 };
  }
  if (n === 255) {
    const s = (t[e + 1] << 24 | t[e + 2] << 16 | t[e + 3] << 8 | t[e + 4]) >>> 0;
    return { value: (s > 2147483647 ? s - 4294967296 : s) / 65536, bytesConsumed: 5 };
  }
  return null;
}
function Ro(t) {
  return t < 1240 ? 107 : t < 33900 ? 1131 : 32768;
}
function lo(t, e = [], n = []) {
  const s = [], o = [];
  let i = null, r = 0, a = 0, c = null, f = !1, u = !0;
  const l = Ro(e.length), h = Ro(n.length);
  function g(w, S) {
    i && i.length > 0 && o.push(i), r += w, a += S, i = [{ type: "M", x: r, y: a }];
  }
  function p(w, S) {
    r += w, a += S, i && i.push({ type: "L", x: r, y: a });
  }
  function d(w, S, b, v, I, A) {
    const C = r + w, O = a + S, T = C + b, D = O + v;
    r = T + I, a = D + A, i && i.push({ type: "C", x1: C, y1: O, x2: T, y2: D, x: r, y: a });
  }
  function x() {
    u && (s.length % 2 !== 0 && (c = s.shift()), u = !1, f = !0);
  }
  function m(w) {
    switch (w) {
      case 1:
      // hstem
      case 3:
      // vstem
      case 18:
      // hstemhm
      case 23:
        f || (s.length % 2 !== 0 && (c = s.shift()), f = !0, u = !1), s.length = 0;
        break;
      case 4:
        u && (s.length > 1 && (c = s.shift()), u = !1, f = !0), g(0, s.pop()), s.length = 0;
        break;
      case 5:
        for (let S = 0; S < s.length; S += 2)
          p(s[S], s[S + 1]);
        s.length = 0;
        break;
      case 6:
        for (let S = 0; S < s.length; S++)
          S % 2 === 0 ? p(s[S], 0) : p(0, s[S]);
        s.length = 0;
        break;
      case 7:
        for (let S = 0; S < s.length; S++)
          S % 2 === 0 ? p(0, s[S]) : p(s[S], 0);
        s.length = 0;
        break;
      case 8:
        for (let S = 0; S + 5 < s.length; S += 6)
          d(
            s[S],
            s[S + 1],
            s[S + 2],
            s[S + 3],
            s[S + 4],
            s[S + 5]
          );
        s.length = 0;
        break;
      case 10: {
        const S = s.pop() + h;
        n[S] && (callStack.push(null), execute(n[S]));
        break;
      }
      case 11:
        return;
      // Return from subroutine
      case 14:
        !f && s.length > 0 && (c = s.shift(), f = !0, u = !1), i && i.length > 0 && (o.push(i), i = null), s.length = 0;
        break;
      case 19:
      // hintmask
      case 20:
        f || (s.length % 2 !== 0 && (c = s.shift()), f = !0, u = !1), s.length = 0;
        break;
      case 21:
        x();
        {
          const S = s.pop(), b = s.pop();
          g(b, S);
        }
        s.length = 0;
        break;
      case 22:
        u && (s.length > 1 && (c = s.shift()), u = !1, f = !0), g(s.pop(), 0), s.length = 0;
        break;
      case 24:
        {
          const b = s.length - 2;
          let v = 0;
          for (; v < b; v += 6)
            d(
              s[v],
              s[v + 1],
              s[v + 2],
              s[v + 3],
              s[v + 4],
              s[v + 5]
            );
          p(s[v], s[v + 1]);
        }
        s.length = 0;
        break;
      case 25:
        {
          const b = s.length - 6;
          let v = 0;
          for (; v < b; v += 2)
            p(s[v], s[v + 1]);
          d(
            s[v],
            s[v + 1],
            s[v + 2],
            s[v + 3],
            s[v + 4],
            s[v + 5]
          );
        }
        s.length = 0;
        break;
      case 26:
        {
          let S = 0, b = 0;
          for (s.length % 4 !== 0 && (b = s[S++]); S + 3 < s.length; S += 4)
            d(b, s[S], s[S + 1], s[S + 2], 0, s[S + 3]), b = 0;
        }
        s.length = 0;
        break;
      case 27:
        {
          let S = 0, b = 0;
          for (s.length % 4 !== 0 && (b = s[S++]); S + 3 < s.length; S += 4)
            d(s[S], b, s[S + 1], s[S + 2], s[S + 3], 0), b = 0;
        }
        s.length = 0;
        break;
      case 29: {
        const S = s.pop() + l;
        e[S] && (callStack.push(null), execute(e[S]));
        break;
      }
      case 30:
        {
          let S = 0;
          for (; S < s.length && S + 3 < s.length; ) {
            {
              const b = s.length - S === 5 ? s[S + 4] : 0;
              d(
                0,
                s[S],
                s[S + 1],
                s[S + 2],
                s[S + 3],
                b
              ), S += b !== 0 ? 5 : 4;
            }
            if (S + 3 < s.length) {
              const b = s.length - S === 5 ? s[S + 4] : 0;
              d(
                s[S],
                0,
                s[S + 1],
                s[S + 2],
                b,
                s[S + 3]
              ), S += b !== 0 ? 5 : 4;
            } else break;
          }
        }
        s.length = 0;
        break;
      case 31:
        {
          let S = 0;
          for (; S < s.length && S + 3 < s.length; ) {
            {
              const b = s.length - S === 5 ? s[S + 4] : 0;
              d(
                s[S],
                0,
                s[S + 1],
                s[S + 2],
                b,
                s[S + 3]
              ), S += b !== 0 ? 5 : 4;
            }
            if (S + 3 < s.length) {
              const b = s.length - S === 5 ? s[S + 4] : 0;
              d(
                0,
                s[S],
                s[S + 1],
                s[S + 2],
                s[S + 3],
                b
              ), S += b !== 0 ? 5 : 4;
            } else break;
          }
        }
        s.length = 0;
        break;
      default:
        s.length = 0;
        break;
    }
  }
  function y(w) {
    switch (w) {
      case 34:
        {
          const S = s[0], b = 0, v = s[1], I = s[2], A = s[3], C = 0, O = s[4], T = 0, D = s[5], E = -I, M = s[6], R = 0;
          d(S, b, v, I, A, C), d(O, T, D, E, M, R);
        }
        s.length = 0;
        break;
      case 35:
        d(s[0], s[1], s[2], s[3], s[4], s[5]), d(s[6], s[7], s[8], s[9], s[10], s[11]), s.length = 0;
        break;
      case 36:
        {
          const S = s[0], b = s[1], v = s[2], I = s[3], A = s[4], C = 0, O = s[5], T = 0, D = s[6], E = s[7], M = s[8], R = -(b + I + E);
          d(S, b, v, I, A, C), d(O, T, D, E, M, R);
        }
        s.length = 0;
        break;
      case 37:
        {
          const S = s[0], b = s[1], v = s[2], I = s[3], A = s[4], C = s[5], O = s[6], T = s[7], D = s[8], E = s[9], M = s[10], R = S + v + A + O + D, H = b + I + C + T + E;
          let U, W;
          Math.abs(R) > Math.abs(H) ? (U = M, W = -H) : (U = -R, W = M), d(S, b, v, I, A, C), d(O, T, D, E, U, W);
        }
        s.length = 0;
        break;
      default:
        s.length = 0;
        break;
    }
  }
  function _(w, S) {
    let b = S || 0, v = 0;
    for (; v < w.length; ) {
      const I = w[v], A = Er(w, v);
      if (A !== null) {
        s.push(A.value), v += A.bytesConsumed;
        continue;
      }
      if (I === 12) {
        v++;
        const C = w[v];
        v++, y(C);
      } else if (I === 19 || I === 20) {
        f || (s.length % 2 !== 0 && (c = s.shift()), f = !0, u = !1), b += s.length >> 1, s.length = 0, v++;
        const C = Math.ceil(b / 8);
        v += C;
      } else if (I === 1 || I === 3 || I === 18 || I === 23)
        f || (s.length % 2 !== 0 && (c = s.shift()), f = !0, u = !1), b += s.length >> 1, s.length = 0, v++;
      else if (I === 10) {
        v++;
        const C = s.pop() + h;
        n[C] && _(n[C], b);
      } else if (I === 29) {
        v++;
        const C = s.pop() + l;
        e[C] && _(e[C], b);
      } else {
        if (I === 11)
          return;
        v++, m(I);
      }
    }
  }
  return _(t, 0), i && i.length > 0 && o.push(i), { contours: o, width: c };
}
const Fo = {
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
}, Of = {
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
function Br(t) {
  const e = [], n = [];
  let s = 0, o = 0;
  for (; o < t.length; ) {
    const i = t[o], r = Er(t, o);
    if (r !== null) {
      n.push(r.value), o += r.bytesConsumed;
      continue;
    }
    if (i === 12) {
      o++;
      const a = t[o];
      o++;
      const c = Of[a] || `op12.${a}`;
      e.push(n.length ? `${n.join(" ")} ${c}` : c), n.length = 0;
    } else if (i === 19 || i === 20) {
      const a = i === 19 ? "hintmask" : "cntrmask";
      s += n.length >> 1, o++;
      const c = Math.ceil(s / 8), f = [];
      for (let l = 0; l < c && o < t.length; l++, o++)
        f.push(t[o].toString(2).padStart(8, "0"));
      const u = n.length ? `${n.join(" ")} ` : "";
      e.push(`${u}${a} ${f.join("")}`), n.length = 0;
    } else if (i === 1 || i === 3 || i === 18 || i === 23) {
      s += n.length >> 1;
      const a = Fo[i];
      e.push(n.length ? `${n.join(" ")} ${a}` : a), n.length = 0, o++;
    } else {
      const a = Fo[i] || `op${i}`;
      e.push(n.length ? `${n.join(" ")} ${a}` : a), n.length = 0, o++;
    }
  }
  return n.length && e.push(n.join(" ")), e.join(`
`);
}
const Tf = /* @__PURE__ */ new Set([
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
function ho(t) {
  const { header: e, tables: n } = t, s = Ef(n), o = Lf(n), i = { font: s, glyphs: o }, r = Rf(n, o);
  r.length > 0 && (i.kerning = r), n.fvar && (i.axes = Hf(n), i.instances = jf(n));
  const a = Wf(n);
  a && (i.axisMapping = a);
  const c = qf(n);
  c && (i.axisStyles = c);
  const f = Yf(n);
  if (f && (i.metricVariations = f), n.GSUB && !n.GSUB._raw) {
    const { substitutions: g, rawLookups: p } = Kf(
      n.GSUB,
      o
    );
    g.length > 0 && (i.substitutions = g), p.length > 0 && (i._rawGSUBLookups = p);
  }
  const u = {};
  n.GPOS && !n.GPOS._raw && (u.GPOS = n.GPOS), n.GDEF && !n.GDEF._raw && (u.GDEF = n.GDEF), Object.keys(u).length > 0 && (i.features = u), n.gasp && !n.gasp._raw && n.gasp.gaspRanges && (i.gasp = n.gasp.gaspRanges.map((g) => ({
    maxPPEM: g.rangeMaxPPEM,
    behavior: g.rangeGaspBehavior
  }))), n["cvt "] && !n["cvt "]._raw && n["cvt "].values && (i.cvt = n["cvt "].values), n.fpgm && !n.fpgm._raw && n.fpgm.instructions && (i.fpgm = n.fpgm.instructions), n.prep && !n.prep._raw && n.prep.instructions && (i.prep = n.prep.instructions);
  const l = iu(n);
  l && (i.palettes = l);
  const h = ru(n, o);
  return h && h.length > 0 && (i.colorGlyphs = h), i.tables = { ...n }, i._header = e, i;
}
const Df = {
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
function we(t, e) {
  if (!t || !t.names) return;
  const n = t.names.filter((r) => r.nameID === e);
  if (n.length === 0) return;
  const s = n.find(
    (r) => r.platformID === 3 && r.encodingID === 1 && r.languageID === 1033
  );
  if (s) return s.value;
  const o = n.find((r) => r.platformID === 0);
  if (o) return o.value;
  const i = n.find(
    (r) => r.platformID === 1 && r.encodingID === 0 && r.languageID === 0
  );
  return i ? i.value : n[0].value;
}
function Ef(t) {
  const e = t.name, n = t.head, s = t.hhea, o = t["OS/2"], i = t.post, r = {};
  for (const [a, c] of Object.entries(Df)) {
    const f = we(e, Number(a));
    f !== void 0 && f.trim() !== "" && (r[c] = f);
  }
  return n && !n._raw && (r.unitsPerEm = n.unitsPerEm, r.created = zo(n.created), r.modified = zo(n.modified)), s && !s._raw && (r.ascender = s.ascender, r.descender = s.descender, r.lineGap = s.lineGap), i && !i._raw && (r.italicAngle = i.italicAngle, r.underlinePosition = i.underlinePosition, r.underlineThickness = i.underlineThickness, r.isFixedPitch = i.isFixedPitch !== 0), o && !o._raw && (r.weightClass = o.usWeightClass, r.widthClass = o.usWidthClass, r.fsType = o.fsType, r.fsSelection = o.fsSelection, r.achVendID = o.achVendID, o.panose && (r.panose = o.panose)), r;
}
function Bf(t) {
  const e = /* @__PURE__ */ new Map();
  if (!t || t._raw || !t.subtables) return e;
  for (const n of t.subtables)
    switch (n.format) {
      case 0:
        for (let s = 0; s < n.glyphIdArray.length; s++) {
          const o = n.glyphIdArray[s];
          o !== 0 && De(e, o, s);
        }
        break;
      case 4:
        for (const s of n.segments)
          for (let o = s.startCode; o <= s.endCode; o++) {
            let i;
            if (s.idRangeOffset === 0)
              i = o + s.idDelta & 65535;
            else {
              const r = s.idRangeOffset / 2 + (o - s.startCode) - (n.segments.length - n.segments.indexOf(s));
              i = n.glyphIdArray[r], i !== void 0 && i !== 0 && (i = i + s.idDelta & 65535);
            }
            i !== void 0 && i !== 0 && De(e, i, o);
          }
        break;
      case 6:
        for (let s = 0; s < n.glyphIdArray.length; s++) {
          const o = n.glyphIdArray[s];
          o !== 0 && De(e, o, n.firstCode + s);
        }
        break;
      case 12:
        for (const s of n.groups)
          for (let o = s.startCharCode; o <= s.endCharCode; o++) {
            const i = s.startGlyphID + (o - s.startCharCode);
            i !== 0 && De(e, i, o);
          }
        break;
      case 13:
        for (const s of n.groups)
          for (let o = s.startCharCode; o <= s.endCharCode; o++)
            s.glyphID !== 0 && De(e, s.glyphID, o);
        break;
    }
  return e;
}
function De(t, e, n) {
  t.has(e) || t.set(e, []);
  const s = t.get(e);
  s.includes(n) || s.push(n);
}
function Mf(t, e) {
  if (t.post && !t.post._raw && t.post.glyphNames && t.post.glyphNames.length > 0)
    return t.post.glyphNames;
  if (t["CFF "] && !t["CFF "]._raw) {
    const s = t["CFF "];
    if (s.fonts && s.fonts[0] && s.fonts[0].charset) {
      const o = s.fonts[0].charset, i = s.strings || [];
      return [".notdef", ...o.map((a) => {
        if (typeof a == "string") return a;
        if (typeof a == "number" && a >= 391) {
          const c = i[a - 391];
          return typeof c == "string" && c !== "" ? c : String(a);
        }
        return String(a);
      })];
    }
  }
  const n = [];
  for (let s = 0; s < e; s++)
    n.push(s === 0 ? ".notdef" : `glyph${s}`);
  return n;
}
function Lf(t) {
  const e = t.glyf && !t.glyf._raw, n = t["CFF "] && !t["CFF "]._raw, s = t.hmtx && !t.hmtx._raw ? t.hmtx : null, o = t.vmtx && !t.vmtx._raw ? t.vmtx : null, i = t.hhea && !t.hhea._raw ? t.hhea : null, r = t.vhea && !t.vhea._raw ? t.vhea : null;
  let a = 0;
  t.maxp && !t.maxp._raw ? a = t.maxp.numGlyphs : e ? a = t.glyf.glyphs.length : n ? a = t["CFF "].fonts[0].charStrings.length : s && (a = s.hMetrics.length + (s.leftSideBearings?.length || 0));
  const c = i ? i.numberOfHMetrics : a, f = r ? r.numOfLongVerMetrics : 0, u = Bf(t.cmap), l = Mf(t, a), h = [];
  for (let g = 0; g < a; g++) {
    const p = {};
    l[g] && (p.name = l[g]);
    const d = u.get(g) || [];
    if (d.length === 1 ? p.unicode = d[0] : d.length > 1 ? (p.unicode = d[0], p.unicodes = d) : p.unicode = null, s && (g < c ? (p.advanceWidth = s.hMetrics[g].advanceWidth, p.leftSideBearing = s.hMetrics[g].lsb) : (p.advanceWidth = s.hMetrics[c - 1].advanceWidth, p.leftSideBearing = s.leftSideBearings[g - c])), o && (g < f ? (p.advanceHeight = o.vMetrics[g].advanceHeight, p.topSideBearing = o.vMetrics[g].topSideBearing) : o.topSideBearings && (p.advanceHeight = o.vMetrics[f - 1].advanceHeight, p.topSideBearing = o.topSideBearings[g - f])), e) {
      const x = t.glyf.glyphs[g];
      x && x.type === "simple" ? (p.contours = x.contours, x.instructions && x.instructions.length > 0 && (p.instructions = x.instructions)) : x && x.type === "composite" && (p.components = x.components, x.instructions && x.instructions.length > 0 && (p.instructions = x.instructions));
    }
    if (n) {
      const x = t["CFF "], m = x.fonts[0], y = m.charStrings;
      if (y[g]) {
        p.charString = y[g], p.charStringDisassembly = Br(y[g]);
        const _ = x.globalSubrs || [], w = m.localSubrs || [], S = lo(
          y[g],
          _,
          w
        );
        S.contours.length > 0 && (p.contours = S.contours);
      }
    }
    h.push(p);
  }
  return h;
}
function Rf(t, e) {
  const n = Ff(t, e), s = Pf(t, e);
  if (n.length === 0) return s;
  if (s.length === 0) return n;
  const o = /* @__PURE__ */ new Map();
  for (const i of n)
    o.set(`${i.left}\0${i.right}`, i);
  for (const i of s) {
    const r = `${i.left}\0${i.right}`;
    o.has(r) || o.set(r, i);
  }
  return Array.from(o.values());
}
function Ff(t, e) {
  const n = t.GPOS;
  if (!n || n._raw || !n.featureList || !n.lookupList) return [];
  const s = /* @__PURE__ */ new Set();
  for (const i of n.featureList.featureRecords)
    if (i.featureTag === "kern")
      for (const r of i.feature.lookupListIndices)
        s.add(r);
  if (s.size === 0) return [];
  const o = [];
  for (const i of s) {
    const r = n.lookupList.lookups[i];
    if (!(!r || r.lookupType !== 2))
      for (const a of r.subtables)
        a.format === 1 ? Vf(a, e, o) : a.format === 2 && zf(a, e, o);
  }
  return o;
}
function Vf(t, e, n) {
  const s = Ct(t.coverage);
  for (let o = 0; o < s.length && o < t.pairSets.length; o++) {
    const i = s[o], r = e[i]?.name || `glyph${i}`;
    for (const a of t.pairSets[o]) {
      const c = a.value1?.xAdvance;
      if (c === void 0 || c === 0) continue;
      const f = e[a.secondGlyph]?.name || `glyph${a.secondGlyph}`;
      n.push({ left: r, right: f, value: c });
    }
  }
}
function zf(t, e, n) {
  const s = Vo(t.classDef1, e.length), o = Vo(t.classDef2, e.length), i = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), a = new Set(Ct(t.coverage));
  for (let c = 0; c < e.length; c++) {
    if (a.has(c)) {
      const u = s.get(c) ?? 0;
      i.has(u) || i.set(u, []), i.get(u).push(c);
    }
    const f = o.get(c) ?? 0;
    r.has(f) || r.set(f, []), r.get(f).push(c);
  }
  for (let c = 0; c < t.class1Count; c++) {
    const f = i.get(c);
    if (f)
      for (let u = 0; u < t.class2Count; u++) {
        const h = t.class1Records[c]?.[u]?.value1?.xAdvance;
        if (h === void 0 || h === 0) continue;
        const g = r.get(u);
        if (g)
          for (const p of f) {
            const d = e[p]?.name || `glyph${p}`;
            for (const x of g) {
              const m = e[x]?.name || `glyph${x}`;
              n.push({ left: d, right: m, value: h });
            }
          }
      }
  }
}
function Ct(t) {
  if (t.format === 1) return t.glyphs;
  if (t.format === 2) {
    const e = [];
    for (const n of t.ranges)
      for (let s = n.startGlyphID; s <= n.endGlyphID; s++)
        e.push(s);
    return e;
  }
  return [];
}
function Vo(t, e) {
  const n = /* @__PURE__ */ new Map();
  if (t.format === 1)
    for (let s = 0; s < t.classValues.length; s++)
      n.set(t.startGlyphID + s, t.classValues[s]);
  else if (t.format === 2)
    for (const s of t.ranges)
      for (let o = s.startGlyphID; o <= s.endGlyphID; o++)
        n.set(o, s.class);
  return n;
}
function Pf(t, e) {
  const n = t.kern;
  if (!n || n._raw || !n.subtables) return [];
  const s = [];
  for (const o of n.subtables)
    if (!o._raw)
      if (o.format === 0 && o.pairs)
        for (const i of o.pairs) {
          const r = e[i.left]?.name || `glyph${i.left}`, a = e[i.right]?.name || `glyph${i.right}`;
          s.push({
            left: r,
            right: a,
            value: i.value
          });
        }
      else o.format === 2 && o.values ? Gf(o, e, s) : o.format === 3 && o.kernValues ? Uf(o, e, s) : o.format === 1 && o.states && Nf(o, e, s);
  return s;
}
function Gf(t, e, n) {
  const {
    leftClassTable: s,
    rightClassTable: o,
    rowWidth: i,
    kerningArrayOffset: r,
    values: a
  } = t;
  if (!a) return;
  const c = i > 0 ? i / 2 : 0, f = /* @__PURE__ */ new Map();
  for (let l = 0; l < s.nGlyphs; l++) {
    const h = s.firstGlyph + l, g = s.offsets[l] || 0, p = i > 0 ? Math.floor((g - r) / i) : 0;
    p >= 0 && p < a.length && f.set(h, p);
  }
  const u = /* @__PURE__ */ new Map();
  for (let l = 0; l < o.nGlyphs; l++) {
    const h = o.firstGlyph + l, g = o.offsets[l] || 0, p = Math.floor(g / 2);
    p >= 0 && p < c && u.set(h, p);
  }
  for (const [l, h] of f) {
    const g = a[h];
    if (!g) continue;
    const p = e[l]?.name || `glyph${l}`;
    for (const [d, x] of u) {
      const m = g[x];
      if (m === 0) continue;
      const y = e[d]?.name || `glyph${d}`;
      n.push({ left: p, right: y, value: m });
    }
  }
}
function Uf(t, e, n) {
  const {
    glyphCount: s,
    leftClassCount: o,
    rightClassCount: i,
    kernValues: r,
    leftClasses: a,
    rightClasses: c,
    kernIndices: f
  } = t, u = Math.min(s, e.length);
  for (let l = 0; l < u; l++) {
    const h = a[l];
    if (h >= o) continue;
    const g = e[l]?.name || `glyph${l}`;
    for (let p = 0; p < u; p++) {
      const d = c[p];
      if (d >= i) continue;
      const x = h * i + d, m = f[x];
      if (m === void 0 || m >= r.length) continue;
      const y = r[m];
      if (y === 0) continue;
      const _ = e[p]?.name || `glyph${p}`;
      n.push({ left: g, right: _, value: y });
    }
  }
}
function Nf(t, e, n) {
  const {
    stateSize: s,
    classTable: o,
    states: i,
    entryTable: r,
    valueTable: a,
    stateArrayOffset: c
  } = t;
  if (!o || !i || !r || !a || i.length === 0 || s === 0) return;
  const f = /* @__PURE__ */ new Map();
  for (let l = 0; l < o.nGlyphs; l++) {
    const h = o.firstGlyph + l, g = o.classArray[l];
    g >= 4 && f.set(h, g);
  }
  const u = Array.from(f.keys());
  if (u.length !== 0)
    for (const l of u)
      for (const h of u) {
        const g = $f(
          l,
          h,
          f,
          i,
          r,
          a,
          s,
          c
        );
        if (g !== 0) {
          const p = e[l]?.name || `glyph${l}`, d = e[h]?.name || `glyph${h}`;
          n.push({ left: p, right: d, value: g });
        }
      }
}
function $f(t, e, n, s, o, i, r, a) {
  let c = 0, f = 0;
  const u = [], l = [t, e];
  for (const h of l) {
    const g = n.get(h) ?? 1;
    if (g >= r || c >= s.length) break;
    const p = s[c][g];
    if (p === void 0 || p >= o.length) break;
    const d = o[p], x = (d.flags & 32768) !== 0, m = d.flags & 16383;
    if (x && u.push(h), m > 0 && u.length > 0) {
      const _ = Math.floor((m - (i._offset || 0)) / 2);
      for (let w = 0; w < u.length; w++) {
        const S = _ + w;
        if (S >= 0 && S < i.length) {
          const b = i[S], v = (b & 1) !== 0;
          if (f += v ? b & -2 : b, v) break;
        }
      }
      u.length = 0;
    }
    const y = d.newStateOffset;
    c = r > 0 ? Math.floor((y - a) / r) : 0, (c < 0 || c >= s.length) && (c = 0);
  }
  return f;
}
function Hf(t) {
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
function jf(t) {
  const e = t.fvar;
  if (!e || e._raw || !e.instances) return [];
  const n = e.axes;
  return e.instances.map((s) => {
    const o = {};
    for (let r = 0; r < n.length; r++)
      o[n[r].axisTag] = s.coordinates[r];
    const i = {
      name: we(t.name, s.subfamilyNameID) || `Instance ${s.subfamilyNameID}`,
      coordinates: o
    };
    if (s.postScriptNameID !== void 0) {
      const r = we(t.name, s.postScriptNameID);
      r && (i.postScriptName = r);
    }
    return i;
  });
}
const Mr = {
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
}, Zf = Object.fromEntries(
  Object.entries(Mr).map(([t, e]) => [e, t])
);
function Wf(t) {
  const e = t.avar, n = t.fvar;
  if (!e || e._raw || !e.segmentMaps || !n || n._raw || !n.axes) return null;
  const s = {}, o = n.axes;
  for (let i = 0; i < e.segmentMaps.length && i < o.length; i++) {
    const r = e.segmentMaps[i];
    if (!r.axisValueMaps || r.axisValueMaps.length === 0) continue;
    const a = r.axisValueMaps;
    a.length === 3 && a[0].fromCoordinate === -1 && a[0].toCoordinate === -1 && a[1].fromCoordinate === 0 && a[1].toCoordinate === 0 && a[2].fromCoordinate === 1 && a[2].toCoordinate === 1 || (s[o[i].axisTag] = a.map((f) => ({
      from: f.fromCoordinate,
      to: f.toCoordinate
    })));
  }
  return Object.keys(s).length > 0 ? s : null;
}
function qf(t) {
  const e = t.STAT, n = t.fvar;
  if (!e || e._raw) return null;
  const s = e.designAxes || [], o = n?.axes || [], i = {};
  return e.elidedFallbackNameID !== void 0 && (i.elidedFallbackName = we(t.name, e.elidedFallbackNameID) || "Regular"), e.axisValues && e.axisValues.length > 0 && (i.values = e.axisValues.map((r) => {
    const a = (u) => u < s.length ? s[u].axisTag : u < o.length ? o[u].axisTag : `axis${u}`, f = { name: we(t.name, r.valueNameID) || "", flags: r.flags };
    switch (r.format) {
      case 1:
        return {
          ...f,
          axis: a(r.axisIndex),
          value: r.value
        };
      case 2:
        return {
          ...f,
          axis: a(r.axisIndex),
          range: [r.rangeMinValue, r.nominalValue, r.rangeMaxValue]
        };
      case 3:
        return {
          ...f,
          axis: a(r.axisIndex),
          value: r.value,
          linkedValue: r.linkedValue
        };
      case 4: {
        const u = {};
        for (const l of r.axisValues)
          u[a(l.axisIndex)] = l.value;
        return { ...f, values: u };
      }
      default:
        return { ...f, _raw: r };
    }
  })), i;
}
function Yf(t) {
  const e = t.MVAR, n = t.fvar;
  if (!e || e._raw || !e.itemVariationStore || !n || n._raw || !n.axes) return null;
  const s = e.itemVariationStore, o = s.variationRegionList, i = n.axes, r = o.regions.map((c) => {
    const f = {};
    for (let u = 0; u < c.regionAxes.length && u < i.length; u++) {
      const l = c.regionAxes[u];
      l.startCoord === 0 && l.peakCoord === 0 && l.endCoord === 0 || (f[i[u].axisTag] = [l.startCoord, l.peakCoord, l.endCoord]);
    }
    return { axes: f };
  }), a = {};
  for (const c of e.valueRecords) {
    const f = Mr[c.valueTag] || c.valueTag, u = c.deltaSetOuterIndex, l = c.deltaSetInnerIndex, h = s.itemVariationData[u];
    if (!h || l >= h.deltaSets.length) continue;
    const g = h.deltaSets[l], p = [];
    for (let d = 0; d < h.regionIndexes.length; d++) {
      const x = g[d];
      x !== 0 && p.push({ region: h.regionIndexes[d], delta: x });
    }
    p.length > 0 && (a[f] = p);
  }
  return Object.keys(a).length === 0 ? null : { regions: r, metrics: a };
}
const Lr = Date.UTC(1904, 0, 1, 0, 0, 0);
function zo(t) {
  if (t == null) return;
  const e = typeof t == "bigint" ? t : BigInt(t);
  if (e === 0n) return;
  const n = Number(e) * 1e3 + Lr;
  if (!(!Number.isFinite(n) || n < -864e13 || n > 864e13))
    return new Date(n).toISOString();
}
function Po(t) {
  if (!t) return 0n;
  const e = Date.parse(t);
  return isNaN(e) ? 0n : BigInt(Math.floor((e - Lr) / 1e3));
}
const Xf = /* @__PURE__ */ new Set([1, 2, 3, 4, 8]);
function Kf(t, e) {
  const n = [], s = [];
  if (!t.featureList || !t.lookupList)
    return { substitutions: n, rawLookups: s };
  const o = Jf(t), i = t.lookupList.lookups, r = /* @__PURE__ */ new Set();
  for (let a = 0; a < i.length; a++) {
    const c = i[a];
    if (c && Xf.has(c.lookupType)) {
      const f = o.lookupToFeatures.get(a) || [], u = Qf(f);
      for (const l of u) {
        const h = Uo(
          c,
          e,
          l.featureTag,
          l.script,
          l.language,
          l.allScripts
        );
        n.push(...h);
      }
      if (u.length === 0) {
        const l = Uo(
          c,
          e,
          "DFLT",
          "DFLT",
          null
        );
        n.push(...l);
      }
      r.add(a);
    }
  }
  for (let a = 0; a < i.length; a++)
    !r.has(a) && i[a] && s.push({
      index: a,
      lookup: i[a],
      features: o.lookupToFeatures.get(a) || []
    });
  return { substitutions: n, rawLookups: s };
}
function Jf(t) {
  const e = /* @__PURE__ */ new Map(), n = t.scriptList?.scriptRecords || [], s = t.featureList?.featureRecords || [];
  for (const o of n) {
    const i = o.scriptTag, r = o.script;
    r.defaultLangSys && Go(
      r.defaultLangSys,
      i,
      null,
      s,
      e
    );
    for (const a of r.langSysRecords || [])
      Go(
        a.langSys,
        i,
        a.langSysTag,
        s,
        e
      );
  }
  return { lookupToFeatures: e };
}
function Qf(t) {
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
function Go(t, e, n, s, o) {
  for (const i of t.featureIndices || []) {
    const r = s[i];
    if (r)
      for (const a of r.feature.lookupListIndices || []) {
        o.has(a) || o.set(a, []);
        const c = o.get(a);
        c.some(
          (u) => u.featureTag === r.featureTag && u.script === e && u.language === n
        ) || c.push({
          featureTag: r.featureTag,
          script: e,
          language: n
        });
      }
  }
}
function Uo(t, e, n, s, o, i) {
  const r = [], a = { feature: n, script: s, language: o };
  i && (a.allScripts = i);
  for (const c of t.subtables || [])
    switch (t.lookupType) {
      case 1:
        tu(c, e, a, r);
        break;
      case 2:
        eu(c, e, a, r);
        break;
      case 3:
        nu(c, e, a, r);
        break;
      case 4:
        su(c, e, a, r);
        break;
      case 8:
        ou(c, e, a, r);
        break;
    }
  return r;
}
function J(t, e) {
  return t[e]?.name || `glyph${e}`;
}
function tu(t, e, n, s) {
  const o = Ct(t.coverage);
  if (t.format === 1)
    for (const i of o) {
      const r = i + t.deltaGlyphID & 65535;
      s.push({
        type: "single",
        ...n,
        from: J(e, i),
        to: J(e, r)
      });
    }
  else if (t.format === 2)
    for (let i = 0; i < o.length; i++)
      s.push({
        type: "single",
        ...n,
        from: J(e, o[i]),
        to: J(e, t.substituteGlyphIDs[i])
      });
}
function eu(t, e, n, s) {
  const o = Ct(t.coverage);
  for (let i = 0; i < o.length; i++)
    s.push({
      type: "multiple",
      ...n,
      from: J(e, o[i]),
      to: (t.sequences[i] || []).map((r) => J(e, r))
    });
}
function nu(t, e, n, s) {
  const o = Ct(t.coverage);
  for (let i = 0; i < o.length; i++)
    s.push({
      type: "alternate",
      ...n,
      from: J(e, o[i]),
      alternates: (t.alternateSets[i] || []).map(
        (r) => J(e, r)
      )
    });
}
function su(t, e, n, s) {
  const o = Ct(t.coverage);
  for (let i = 0; i < o.length; i++) {
    const r = t.ligatureSets[i] || [];
    for (const a of r) {
      const c = [
        J(e, o[i]),
        ...a.componentGlyphIDs.map((f) => J(e, f))
      ];
      s.push({
        type: "ligature",
        ...n,
        components: c,
        ligature: J(e, a.ligatureGlyph)
      });
    }
  }
}
function ou(t, e, n, s) {
  const o = Ct(t.coverage);
  for (let i = 0; i < o.length; i++)
    s.push({
      type: "reverse",
      ...n,
      from: J(e, o[i]),
      to: J(e, t.substituteGlyphIDs[i]),
      backtrack: (t.backtrackCoverages || []).map(
        (r) => Ct(r).map((a) => J(e, a))
      ),
      lookahead: (t.lookaheadCoverages || []).map(
        (r) => Ct(r).map((a) => J(e, a))
      )
    });
}
function iu(t) {
  const e = t.CPAL;
  return !e || e._raw || !e.palettes ? null : e.palettes.map(
    (n) => n.map((s) => uo(s))
  );
}
function ru(t, e) {
  const n = t.COLR;
  if (!n || n._raw) return null;
  const s = lf(e), o = [];
  if (n.baseGlyphRecords)
    for (const i of n.baseGlyphRecords) {
      const r = s.get(i.glyphID) ?? String(i.glyphID), a = [];
      for (let c = 0; c < i.numLayers; c++) {
        const f = n.layerRecords[i.firstLayerIndex + c];
        f && a.push({
          glyph: s.get(f.glyphID) ?? String(f.glyphID),
          paletteIndex: f.paletteIndex
        });
      }
      o.push({ name: r, layers: a });
    }
  if (n.baseGlyphPaintRecords)
    for (const i of n.baseGlyphPaintRecords) {
      const r = s.get(i.glyphID) ?? String(i.glyphID), a = o.findIndex((f) => f.name === r), c = structuredClone(i.paint);
      Sn(c, s), a >= 0 ? o[a].paint = c : o.push({ name: r, paint: c });
    }
  return o;
}
function No(t) {
  const { font: e, glyphs: n } = t, s = n.some((f) => f.charString), o = au(n, e), i = {};
  i.head = fu(e, o), i.hhea = uu(e, o, n.length), i.maxp = lu(n, s), i["OS/2"] = hu(e, o), i.name = pu(e), i.post = du(e, n), i.cmap = mu(n), i.hmtx = wu(n), s ? i["CFF "] = vu(e, n) : (i.glyf = bu(n), i.loca = { offsets: [] }), n.some((f) => f.advanceHeight !== void 0) && (i.vhea = Su(n), i.vmtx = _u(n));
  const a = t._options?.kerningFormat || "gpos";
  if (t.kerning && t.kerning.length > 0) {
    const f = a === "gpos" || a === "gpos+kern", u = a !== "gpos";
    if (f) {
      const l = t.features?.GPOS, h = l?.scriptList?.scriptRecords && l?.featureList?.featureRecords && l?.lookupList?.lookups;
      let g;
      h ? g = Ou(
        l,
        t.kerning,
        n
      ) : g = zr(t.kerning, n), g && (i.GPOS = g);
    }
    if (u) {
      const l = Cu(
        t.kerning,
        n,
        a
      );
      l && (i.kern = l);
    }
  }
  if (t.axes && t.axes.length > 0 && (i.fvar = Du(t, i.name), t.axisMapping && (i.avar = Mu(t)), t.axisStyles ? i.STAT = Bu(t, i.name) : t.tables?.STAT || (i.STAT = Eu(t, i.name)), t.metricVariations && (i.MVAR = Lu(t))), t.gasp && (i.gasp = {
    version: 1,
    gaspRanges: t.gasp.map((f) => ({
      rangeMaxPPEM: f.maxPPEM,
      rangeGaspBehavior: f.behavior
    }))
  }), t.cvt && (i["cvt "] = { values: t.cvt }), t.fpgm && (i.fpgm = { instructions: t.fpgm }), t.prep && (i.prep = { instructions: t.prep }), t.features && (t.features.GPOS && !i.GPOS && (i.GPOS = t.features.GPOS), t.features.GDEF && (i.GDEF = t.features.GDEF)), t.substitutions && t.substitutions.length > 0 ? i.GSUB = Fu(
    t.substitutions,
    t._rawGSUBLookups || [],
    n
  ) : t._rawGSUBLookups && t._rawGSUBLookups.length > 0 && (i.GSUB = Vu(t._rawGSUBLookups)), t.features?.GSUB && !i.GSUB && (i.GSUB = t.features.GSUB), t.palettes && t.palettes.length > 0 && (i.CPAL = Zu(t.palettes)), t.colorGlyphs && t.colorGlyphs.length > 0 && (i.COLR = Wu(t.colorGlyphs, n)), t.tables)
    for (const [f, u] of Object.entries(t.tables))
      i[f] || (i[f] = u);
  let c;
  if (t._header)
    c = { ...t._header, numTables: Object.keys(i).length };
  else {
    const f = Object.keys(i).length, u = Math.floor(Math.log2(f)), l = Math.pow(2, u) * 16, h = f * 16 - l;
    c = {
      sfVersion: s ? 1330926671 : 65536,
      numTables: f,
      searchRange: l,
      entrySelector: u,
      rangeShift: h
    };
  }
  return { header: c, tables: i };
}
function au(t, e) {
  let n = 1 / 0, s = 1 / 0, o = -1 / 0, i = -1 / 0, r = 0, a = 0, c = 1 / 0, f = 1 / 0, u = -1 / 0, l = 65535, h = 0;
  const g = /* @__PURE__ */ new Set();
  for (const x of t) {
    const m = x.advanceWidth || 0;
    a += m, m > r && (r = m);
    const y = jn(x);
    if (y) {
      y.xMin < n && (n = y.xMin), y.yMin < s && (s = y.yMin), y.xMax > o && (o = y.xMax), y.yMax > i && (i = y.yMax);
      const w = x.leftSideBearing ?? y.xMin, S = m - (w + (y.xMax - y.xMin)), b = w + (y.xMax - y.xMin);
      w < c && (c = w), S < f && (f = S), b > u && (u = b);
    }
    const _ = x.unicodes || (x.unicode ? [x.unicode] : []);
    for (const w of _)
      w < l && (l = w), w > h && (h = w), g.add(w);
  }
  n === 1 / 0 && (n = 0), s === 1 / 0 && (s = 0), o === -1 / 0 && (o = 0), i === -1 / 0 && (i = 0), c === 1 / 0 && (c = 0), f === 1 / 0 && (f = 0), u === -1 / 0 && (u = 0), l === 65535 && (l = 0), h === 0 && (h = 0);
  const p = $o(
    t,
    "xyvw",
    e.ascender ? Math.round(e.ascender / 2) : 0
  ), d = $o(
    t,
    "HIKLEFJMNTZBDPRAGOQSUVWXY",
    i
  );
  return {
    xMin: n,
    yMin: s,
    xMax: o,
    yMax: i,
    advanceWidthMax: r,
    advanceWidthAvg: t.length > 0 ? Math.round(a / t.length) : 0,
    minLSB: c,
    minRSB: f,
    maxExtent: u,
    firstCharIndex: Math.min(l, 65535),
    lastCharIndex: Math.min(h, 65535),
    sxHeight: p,
    sCapHeight: d,
    unicodeRanges: g
  };
}
function jn(t) {
  if (t.contours && t.contours.length > 0) {
    let e = 1 / 0, n = 1 / 0, s = -1 / 0, o = -1 / 0, i = !1;
    for (const r of t.contours)
      for (const a of r) {
        const c = [
          [a.x, a.y],
          [a.x1, a.y1],
          [a.x2, a.y2]
        ];
        for (const [f, u] of c)
          typeof f == "number" && typeof u == "number" && (i = !0, f < e && (e = f), u < n && (n = u), f > s && (s = f), u > o && (o = u));
      }
    if (i) return { xMin: e, yMin: n, xMax: s, yMax: o };
  }
  return null;
}
function $o(t, e, n) {
  for (const s of e) {
    const o = s.charCodeAt(0), i = t.find((r) => (r.unicodes || (r.unicode ? [r.unicode] : [])).includes(o));
    if (i) {
      const r = jn(i);
      if (r) return r.yMax;
    }
  }
  return n || 0;
}
function cu(t) {
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
  for (const [s, o, i] of n)
    for (const r of t)
      if (r >= o && r <= i) {
        const a = Math.floor(s / 32);
        e[a] |= 1 << s % 32;
        break;
      }
  return e;
}
function fu(t, e) {
  const n = (t.weightClass || 400) >= 700, s = (t.italicAngle || 0) !== 0;
  let o = 0;
  return n && (o |= 1), s && (o |= 2), {
    majorVersion: 1,
    minorVersion: 0,
    fontRevision: 1,
    checksumAdjustment: 0,
    // will be overwritten by export
    magicNumber: 1594834165,
    flags: 11,
    // baseline at y=0, lsb at x=0, instructions may alter advance
    unitsPerEm: t.unitsPerEm,
    created: Po(t.created),
    modified: Po(t.modified),
    xMin: e.xMin,
    yMin: e.yMin,
    xMax: e.xMax,
    yMax: e.yMax,
    macStyle: o,
    lowestRecPPEM: 8,
    fontDirectionHint: 2,
    indexToLocFormat: 0,
    // coordinated by export.js for glyf/loca
    glyphDataFormat: 0
  };
}
function uu(t, e, n) {
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
function lu(t, e) {
  if (e)
    return {
      version: 20480,
      numGlyphs: t.length
    };
  let n = 0, s = 0, o = 0, i = 0, r = 0, a = 0, c = 0;
  for (const f of t) {
    if (f.contours) {
      let u = 0;
      for (const l of f.contours)
        u += l.length;
      u > n && (n = u), f.contours.length > s && (s = f.contours.length);
    }
    f.components && (f.components.length > r && (r = f.components.length), 1 > a && (a = 1)), f.instructions && f.instructions.length > c && (c = f.instructions.length);
  }
  return {
    version: 65536,
    numGlyphs: t.length,
    maxPoints: n,
    maxContours: s,
    maxCompositePoints: o,
    maxCompositeContours: i,
    maxZones: 2,
    maxTwilightPoints: 0,
    maxStorage: 0,
    maxFunctionDefs: 0,
    maxInstructionDefs: 0,
    maxStackElements: 0,
    maxSizeOfInstructions: c,
    maxComponentElements: r,
    maxComponentDepth: a
  };
}
function hu(t, e) {
  const n = (t.weightClass || 400) >= 700, s = (t.italicAngle || 0) !== 0;
  let o = t.fsSelection;
  o === void 0 && (o = 0, n && (o |= 32), s && (o |= 1), !n && !s && (o |= 64), o |= 128);
  const i = cu(e.unicodeRanges), r = e.unicodeRanges.has(32);
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
    ulUnicodeRange1: i[0],
    ulUnicodeRange2: i[1],
    ulUnicodeRange3: i[2],
    ulUnicodeRange4: i[3],
    achVendID: t.achVendID || "XXXX",
    fsSelection: o,
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
    usDefaultChar: r ? 32 : 0,
    usBreakChar: r ? 32 : 0,
    usMaxContext: 0
  };
}
function pu(t) {
  const e = [], n = {
    0: t.copyright || "",
    1: t.familyName || "",
    2: t.styleName || "",
    3: t.uniqueID || gu(t),
    4: t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim(),
    5: t.version || "Version 1.000",
    6: t.postScriptName || Rr(t),
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
  for (const [s, o] of Object.entries(n)) {
    const i = Number(s);
    o && (e.push({
      platformID: 3,
      encodingID: 1,
      languageID: 1033,
      nameID: i,
      value: o
    }), e.push({
      platformID: 1,
      encodingID: 0,
      languageID: 0,
      nameID: i,
      value: o
    }), e.push({
      platformID: 0,
      encodingID: 3,
      languageID: 0,
      nameID: i,
      value: o
    }));
  }
  return { version: 0, names: e };
}
function gu(t) {
  const e = t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim();
  return t.manufacturer ? `${t.manufacturer}: ${e}` : e;
}
function Rr(t) {
  const e = (t.familyName || "").replace(/\s/g, ""), n = t.styleName || "Regular";
  return `${e}-${n}`;
}
function du(t, e) {
  const n = t.italicAngle || 0, s = t.underlinePosition || Math.round(-(t.unitsPerEm || 1e3) * 0.1), o = t.underlineThickness || Math.round((t.unitsPerEm || 1e3) * 0.05);
  return {
    version: 131072,
    italicAngle: n,
    underlinePosition: s,
    underlineThickness: o,
    isFixedPitch: t.isFixedPitch ? 1 : 0,
    minMemType42: 0,
    maxMemType42: 0,
    minMemType1: 0,
    maxMemType1: 0,
    glyphNames: e.map((i) => String(i.name ?? ".notdef"))
  };
}
function mu(t) {
  const e = /* @__PURE__ */ new Map();
  let n = !1;
  for (let a = 0; a < t.length; a++) {
    const c = t[a], f = c.unicodes || (c.unicode != null ? [c.unicode] : []);
    for (const u of f)
      e.has(u) || e.set(u, a), u > 65535 && (n = !0);
  }
  const s = [...e.entries()].sort((a, c) => a[0] - c[0]), o = [], i = [];
  if (n) {
    const a = yu(s);
    o.push({ format: 12, language: 0, groups: a }), i.push({ platformID: 3, encodingID: 10, subtableIndex: 0 }), i.push({ platformID: 0, encodingID: 4, subtableIndex: 0 });
  }
  const r = s.filter(([a]) => a <= 65535);
  if (r.length > 0) {
    const { segments: a, glyphIdArray: c } = xu(r), f = o.length;
    o.push({ format: 4, language: 0, segments: a, glyphIdArray: c }), i.push({ platformID: 3, encodingID: 1, subtableIndex: f }), i.push({ platformID: 0, encodingID: 3, subtableIndex: f });
  }
  return { version: 0, encodingRecords: i, subtables: o };
}
function yu(t) {
  if (t.length === 0) return [];
  const e = [];
  let n = t[0][0], s = t[0][1], o = n, i = s;
  for (let r = 1; r < t.length; r++) {
    const [a, c] = t[r];
    a === o + 1 && c === i + 1 ? (o = a, i = c) : (e.push({
      startCharCode: n,
      endCharCode: o,
      startGlyphID: s
    }), n = a, s = c, o = a, i = c);
  }
  return e.push({
    startCharCode: n,
    endCharCode: o,
    startGlyphID: s
  }), e;
}
function xu(t) {
  const e = [], n = [];
  if (t.length === 0)
    return e.push({
      startCode: 65535,
      endCode: 65535,
      idDelta: 1,
      idRangeOffset: 0
    }), { segments: e, glyphIdArray: n };
  let s = t[0][0], o = t[0][1] - t[0][0], i = t[0][0];
  for (let r = 1; r < t.length; r++) {
    const [a, c] = t[r], f = c - a;
    a === i + 1 && f === o || (e.push({
      startCode: s,
      endCode: i,
      idDelta: o,
      idRangeOffset: 0
    }), s = a, o = f), i = a;
  }
  return e.push({
    startCode: s,
    endCode: i,
    idDelta: o,
    idRangeOffset: 0
  }), e.push({
    startCode: 65535,
    endCode: 65535,
    idDelta: 1,
    idRangeOffset: 0
  }), { segments: e, glyphIdArray: n };
}
function wu(t) {
  return { hMetrics: t.map((n) => ({
    advanceWidth: n.advanceWidth || 0,
    lsb: n.leftSideBearing ?? 0
  })), leftSideBearings: [] };
}
function Su(t) {
  let e = 0, n = 1 / 0, s = 1 / 0, o = -1 / 0;
  for (const i of t) {
    const r = i.advanceHeight || 0;
    r > e && (e = r);
    const a = jn(i);
    if (a) {
      const c = i.topSideBearing ?? 0, f = a.yMax - a.yMin, u = r - (c + f), l = c + f;
      c < n && (n = c), u < s && (s = u), l > o && (o = l);
    }
  }
  return n === 1 / 0 && (n = 0), s === 1 / 0 && (s = 0), o === -1 / 0 && (o = 0), {
    version: 69632,
    // v1.1
    vertTypoAscender: 0,
    vertTypoDescender: 0,
    vertTypoLineGap: 0,
    advanceHeightMax: e,
    minTopSideBearing: n,
    minBottomSideBearing: s,
    yMaxExtent: o,
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
function _u(t) {
  return { vMetrics: t.map((n) => ({
    advanceHeight: n.advanceHeight || 0,
    topSideBearing: n.topSideBearing ?? 0
  })), topSideBearings: [] };
}
function bu(t) {
  return { glyphs: t.map((n) => {
    if (n.contours && n.contours.length > 0) {
      const s = jn(n);
      return {
        type: "simple",
        xMin: s ? s.xMin : 0,
        yMin: s ? s.yMin : 0,
        xMax: s ? s.xMax : 0,
        yMax: s ? s.yMax : 0,
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
function vu(t, e) {
  const n = t.postScriptName || Rr(t), s = e.slice(1).map((l) => l.name || ".notdef"), o = e.map((l) => l.charString ? l.charString : l.contours && l.contours.length > 0 && l.contours[0]?.[0]?.type ? On(l.contours) : []), i = [];
  function r(l) {
    const h = 391 + i.length;
    return i.push(l), h;
  }
  const a = t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim(), c = t.familyName || "", f = ku(t.weightClass), u = s.map((l) => r(l));
  return {
    majorVersion: 1,
    minorVersion: 0,
    names: [n],
    strings: i,
    globalSubrs: [],
    fonts: [
      {
        topDict: {
          FullName: r(a),
          FamilyName: r(c),
          Weight: r(f),
          FontBBox: [
            0,
            t.descender || 0,
            t.unitsPerEm || 1e3,
            t.ascender || 0
          ]
        },
        charset: u,
        encoding: [],
        charStrings: o,
        privateDict: {},
        localSubrs: []
      }
    ]
  };
}
function ku(t) {
  return !t || t <= 400 ? "Regular" : t <= 500 ? "Medium" : t <= 600 ? "SemiBold" : t <= 700 ? "Bold" : t <= 800 ? "ExtraBold" : "Black";
}
function Ho(t, e) {
  const n = /* @__PURE__ */ new Map();
  for (let c = 0; c < e.length; c++)
    e[c].name && n.set(e[c].name, c);
  const s = [];
  for (const c of t) {
    const f = n.get(c.left), u = n.get(c.right);
    f !== void 0 && u !== void 0 && s.push({ left: f, right: u, value: c.value });
  }
  if (s.length === 0) return null;
  const o = s.length, i = Math.floor(Math.log2(o)), r = Math.pow(2, i) * 6, a = o * 6 - r;
  return {
    formatVariant: "opentype",
    version: 0,
    nTables: 1,
    subtables: [
      {
        version: 0,
        coverage: 1,
        format: 0,
        nPairs: o,
        searchRange: r,
        entrySelector: i,
        rangeShift: a,
        pairs: s
      }
    ]
  };
}
function sn(t, e) {
  const n = /* @__PURE__ */ new Map();
  for (let o = 0; o < e.length; o++)
    e[o].name && n.set(e[o].name, o);
  const s = [];
  for (const o of t) {
    const i = n.get(o.left), r = n.get(o.right);
    i !== void 0 && r !== void 0 && s.push({ left: i, right: r, value: o.value });
  }
  return { pairs: s, nameToIndex: n };
}
function Cu(t, e, n) {
  switch (n) {
    case "kern-ot-f0":
    case "gpos+kern":
      return Ho(t, e);
    case "kern-ot-f2":
      return Au(t, e);
    case "kern-apple-f0":
      return Fr(t, e);
    case "kern-apple-f3":
      return Iu(t, e);
    default:
      return Ho(t, e);
  }
}
function Au(t, e) {
  const { pairs: n } = sn(t, e);
  if (n.length === 0) return null;
  const {
    leftClasses: s,
    rightClasses: o,
    valueMatrix: i,
    leftGlyphToClass: r,
    rightGlyphToClass: a
  } = Vr(n), c = s.length, f = o.length, u = f * 2, l = 8, h = Array.from(r.keys()).sort((A, C) => A - C), g = Array.from(a.keys()).sort(
    (A, C) => A - C
  ), p = h.length > 0 ? h[0] : 0, d = h.length > 0 ? h[h.length - 1] - p + 1 : 0, x = g.length > 0 ? g[0] : 0, m = g.length > 0 ? g[g.length - 1] - x + 1 : 0, y = 4 + d * 2, _ = 4 + m * 2, w = l, S = w + y, b = S + _, v = [];
  for (let A = 0; A < d; A++) {
    const C = p + A, O = r.get(C) ?? 0;
    v.push(b + O * u);
  }
  const I = [];
  for (let A = 0; A < m; A++) {
    const C = x + A, O = a.get(C) ?? 0;
    I.push(O * 2);
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
        leftOffsetTable: w,
        rightOffsetTable: S,
        kerningArrayOffset: b,
        leftClassTable: {
          firstGlyph: p,
          nGlyphs: d,
          offsets: v
        },
        rightClassTable: {
          firstGlyph: x,
          nGlyphs: m,
          offsets: I
        },
        nLeftClasses: c,
        nRightClasses: f,
        values: i
      }
    ]
  };
}
function Fr(t, e) {
  const { pairs: n } = sn(t, e);
  if (n.length === 0) return null;
  const s = n.length, o = Math.floor(Math.log2(s)), i = Math.pow(2, o) * 6, r = s * 6 - i;
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
        nPairs: s,
        searchRange: i,
        entrySelector: o,
        rangeShift: r,
        pairs: n
      }
    ]
  };
}
function Iu(t, e) {
  const { pairs: n } = sn(t, e);
  if (n.length === 0) return null;
  const {
    leftClasses: s,
    rightClasses: o,
    valueMatrix: i,
    leftGlyphToClass: r,
    rightGlyphToClass: a
  } = Vr(n), c = s.length, f = o.length, u = /* @__PURE__ */ new Set();
  u.add(0);
  for (const m of i)
    for (const y of m)
      u.add(y);
  if (c > 255 || f > 255 || u.size > 255)
    return Fr(t, e);
  const l = Array.from(u).sort((m, y) => m - y), h = /* @__PURE__ */ new Map();
  for (let m = 0; m < l.length; m++)
    h.set(l[m], m);
  const g = e.length, p = new Array(g).fill(0), d = new Array(g).fill(0);
  for (const [m, y] of r)
    m < g && (p[m] = y);
  for (const [m, y] of a)
    m < g && (d[m] = y);
  const x = [];
  for (let m = 0; m < c; m++)
    for (let y = 0; y < f; y++) {
      const _ = i[m]?.[y] || 0;
      x.push(h.get(_) ?? 0);
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
        glyphCount: g,
        kernValueCount: l.length,
        leftClassCount: c,
        rightClassCount: f,
        flags: 0,
        kernValues: l,
        leftClasses: p,
        rightClasses: d,
        kernIndices: x
      }
    ]
  };
}
function Vr(t) {
  const e = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Set();
  for (const { left: m, right: y, value: _ } of t)
    e.has(m) || e.set(m, /* @__PURE__ */ new Map()), e.get(m).set(y, _), n.add(y);
  const s = /* @__PURE__ */ new Map();
  for (const [m, y] of e) {
    const _ = Array.from(y.entries()).sort((w, S) => w[0] - S[0]);
    s.set(m, _.map((w) => `${w[0]}:${w[1]}`).join(","));
  }
  const o = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
  let r = 1;
  for (const [m, y] of s)
    o.has(y) || o.set(y, r++), i.set(m, o.get(y));
  const a = /* @__PURE__ */ new Map();
  for (const { left: m, right: y, value: _ } of t)
    a.has(y) || a.set(y, /* @__PURE__ */ new Map()), a.get(y).set(m, _);
  const c = /* @__PURE__ */ new Map();
  for (const [m, y] of a) {
    const _ = Array.from(y.entries()).sort((w, S) => w[0] - S[0]);
    c.set(m, _.map((w) => `${w[0]}:${w[1]}`).join(","));
  }
  const f = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Map();
  let l = 1;
  for (const [m, y] of c)
    f.has(y) || f.set(y, l++), u.set(m, f.get(y));
  const h = r, g = l, p = [];
  for (let m = 0; m < h; m++)
    p.push(new Array(g).fill(0));
  for (const { left: m, right: y, value: _ } of t) {
    const w = i.get(m) ?? 0, S = u.get(y) ?? 0;
    p[w][S] = _;
  }
  const d = Array.from({ length: h }, (m, y) => y), x = Array.from({ length: g }, (m, y) => y);
  return {
    leftClasses: d,
    rightClasses: x,
    valueMatrix: p,
    leftGlyphToClass: i,
    rightGlyphToClass: u
  };
}
function zr(t, e) {
  const { pairs: n } = sn(t, e);
  if (n.length === 0) return null;
  const s = Pr(n);
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
      lookups: [s]
    }
  };
}
function Ou(t, e, n) {
  const { pairs: s } = sn(e, n), o = JSON.parse(JSON.stringify(t));
  if (!o.scriptList?.scriptRecords || !o.featureList?.featureRecords || !o.lookupList?.lookups)
    return zr(e, n);
  if (s.length === 0) return o;
  const i = Pr(s), r = /* @__PURE__ */ new Set();
  for (const f of o.featureList.featureRecords)
    if (f.featureTag === "kern")
      for (const u of f.feature.lookupListIndices)
        r.add(u);
  let a;
  if (r.size > 0) {
    const f = [...r].sort((u, l) => u - l);
    a = f[0], o.lookupList.lookups[a] = i;
    for (let u = f.length - 1; u > 0; u--)
      o.lookupList.lookups.splice(f[u], 1);
    if (f.length > 1) {
      const u = f.slice(1);
      Tu(o, u);
    }
  } else
    a = o.lookupList.lookups.length, o.lookupList.lookups.push(i);
  let c = !1;
  for (const f of o.featureList.featureRecords)
    f.featureTag === "kern" && (f.feature.lookupListIndices = [a], c = !0);
  if (!c) {
    o.featureList.featureRecords.push({
      featureTag: "kern",
      feature: {
        featureParamsOffset: 0,
        lookupListIndices: [a]
      }
    });
    const f = o.featureList.featureRecords.length - 1;
    for (const u of o.scriptList.scriptRecords) {
      u.script.defaultLangSys && u.script.defaultLangSys.featureIndices.push(f);
      for (const l of u.script.langSysRecords || [])
        l.langSys.featureIndices.push(f);
    }
  }
  return o;
}
function Tu(t, e) {
  function n(s) {
    let o = 0;
    for (const i of e)
      if (i < s) o++;
      else break;
    return s - o;
  }
  for (const s of t.featureList.featureRecords)
    s.feature.lookupListIndices = s.feature.lookupListIndices.filter((o) => !e.includes(o)).map(n);
}
function Pr(t) {
  const e = /* @__PURE__ */ new Map();
  for (const { left: o, right: i, value: r } of t)
    e.has(o) || e.set(o, []), e.get(o).push({ secondGlyph: i, value1: { xAdvance: r }, value2: null });
  const n = Array.from(e.keys()).sort((o, i) => o - i), s = n.map((o) => {
    const i = e.get(o);
    return i.sort((r, a) => r.secondGlyph - a.secondGlyph), i;
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
        pairSets: s
      }
    ]
  };
}
function Du(t, e) {
  const { axes: n, instances: s = [] } = t;
  let o = 256;
  const i = n.map((a) => {
    const c = o++;
    return At(e, c, a.name || a.tag), {
      axisTag: a.tag,
      minValue: a.min,
      defaultValue: a.default,
      maxValue: a.max,
      flags: a.hidden ? 1 : 0,
      axisNameID: c
    };
  }), r = s.map((a) => {
    const c = o++;
    At(e, c, a.name);
    const f = n.map((l) => a.coordinates[l.tag] ?? l.default), u = {
      subfamilyNameID: c,
      flags: 0,
      coordinates: f
    };
    if (a.postScriptName) {
      const l = o++;
      At(e, l, a.postScriptName), u.postScriptNameID = l;
    }
    return u;
  });
  return {
    majorVersion: 1,
    minorVersion: 0,
    reserved: 2,
    axisSize: 20,
    instanceSize: 4 + n.length * 4 + (r.some((a) => a.postScriptNameID !== void 0) ? 2 : 0),
    axes: i,
    instances: r
  };
}
function At(t, e, n) {
  n && t.names.push(
    { platformID: 3, encodingID: 1, languageID: 1033, nameID: e, value: n },
    { platformID: 1, encodingID: 0, languageID: 0, nameID: e, value: n },
    { platformID: 0, encodingID: 3, languageID: 0, nameID: e, value: n }
  );
}
function Eu(t, e) {
  const { axes: n } = t;
  let s = 256;
  for (const a of e.names)
    a.nameID >= s && (s = a.nameID + 1);
  const o = n.map((a) => {
    const c = s++;
    return At(e, c, a.name || a.tag), {
      axisTag: a.tag,
      axisNameID: c,
      axisOrdering: 0
    };
  }), i = [];
  for (let a = 0; a < n.length; a++) {
    const c = n[a], f = s++, u = c.name || c.tag;
    At(e, f, u), i.push({
      format: 1,
      axisIndex: a,
      flags: 2,
      valueNameID: f,
      value: c.default
    });
  }
  const r = s++;
  return At(e, r, "Regular"), {
    majorVersion: 1,
    minorVersion: 1,
    designAxes: o,
    axisValues: i,
    elidedFallbackNameID: r
  };
}
function Bu(t, e) {
  const { axes: n, axisStyles: s } = t;
  let o = 256;
  for (const f of e.names)
    f.nameID >= o && (o = f.nameID + 1);
  const i = n.map((f) => {
    const u = o++;
    return At(e, u, f.name || f.tag), {
      axisTag: f.tag,
      axisNameID: u,
      axisOrdering: 0
    };
  }), r = {};
  for (let f = 0; f < n.length; f++)
    r[n[f].tag] = f;
  const a = [];
  if (s.values)
    for (const f of s.values) {
      const u = o++;
      if (At(e, u, f.name || ""), f._raw)
        a.push({ ...f._raw, valueNameID: u });
      else if (f.values) {
        const l = Object.entries(f.values).map(([h, g]) => ({
          axisIndex: r[h] ?? 0,
          value: g
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
        axisIndex: r[f.axis] ?? 0,
        flags: f.flags ?? 0,
        valueNameID: u,
        nominalValue: f.range[1],
        rangeMinValue: f.range[0],
        rangeMaxValue: f.range[2]
      }) : f.linkedValue !== void 0 ? a.push({
        format: 3,
        axisIndex: r[f.axis] ?? 0,
        flags: f.flags ?? 0,
        valueNameID: u,
        value: f.value,
        linkedValue: f.linkedValue
      }) : a.push({
        format: 1,
        axisIndex: r[f.axis] ?? 0,
        flags: f.flags ?? 0,
        valueNameID: u,
        value: f.value
      });
    }
  const c = o++;
  return At(
    e,
    c,
    s.elidedFallbackName || "Regular"
  ), {
    majorVersion: 1,
    minorVersion: 1,
    designAxes: i,
    axisValues: a,
    elidedFallbackNameID: c
  };
}
function Mu(t) {
  const { axes: e, axisMapping: n } = t;
  return {
    majorVersion: 1,
    minorVersion: 0,
    reserved: 0,
    segmentMaps: e.map((o) => {
      const i = n[o.tag];
      return !i || i.length === 0 ? {
        positionMapCount: 3,
        axisValueMaps: [
          { fromCoordinate: -1, toCoordinate: -1 },
          { fromCoordinate: 0, toCoordinate: 0 },
          { fromCoordinate: 1, toCoordinate: 1 }
        ]
      } : {
        positionMapCount: i.length,
        axisValueMaps: i.map((r) => ({
          fromCoordinate: r.from,
          toCoordinate: r.to
        }))
      };
    })
  };
}
function Lu(t) {
  const { axes: e, metricVariations: n } = t, { regions: s, metrics: o } = n, i = {};
  for (let p = 0; p < e.length; p++)
    i[e[p].tag] = p;
  const r = s.map((p) => {
    const d = [];
    for (let x = 0; x < e.length; x++) {
      const m = e[x].tag;
      if (p.axes[m]) {
        const [y, _, w] = p.axes[m];
        d.push({ startCoord: y, peakCoord: _, endCoord: w });
      } else
        d.push({ startCoord: 0, peakCoord: 0, endCoord: 0 });
    }
    return { regionAxes: d };
  }), a = /* @__PURE__ */ new Set();
  for (const p of Object.values(o))
    for (const d of p)
      a.add(d.region);
  const c = [...a].sort((p, d) => p - d), f = /* @__PURE__ */ new Map();
  for (let p = 0; p < c.length; p++)
    f.set(c[p], p);
  const u = Object.entries(o), l = [], h = [];
  for (const [p, d] of u) {
    const x = Zf[p] || p, m = new Array(c.length).fill(0);
    for (const y of d) {
      const _ = f.get(y.region);
      _ !== void 0 && (m[_] = y.delta);
    }
    l.push(m), h.push({
      valueTag: x,
      deltaSetOuterIndex: 0,
      deltaSetInnerIndex: l.length - 1
    });
  }
  let g = 0;
  for (let p = 0; p < c.length; p++) {
    let d = !1;
    for (const x of l)
      if (x[p] < -128 || x[p] > 127) {
        d = !0;
        break;
      }
    d && g++;
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
        regions: r
      },
      itemVariationData: [
        {
          itemCount: l.length,
          wordDeltaCount: g,
          regionIndexes: c,
          deltaSets: l
        }
      ]
    }
  };
}
function Ru(t) {
  const e = /* @__PURE__ */ new Map();
  for (let n = 0; n < t.length; n++)
    t[n].name && e.set(t[n].name, n);
  return e;
}
function ot(t, e, n) {
  if (typeof t == "string" && n.has(t))
    return n.get(t);
  const s = Dt(e, t);
  if (s !== void 0)
    return n.get(s);
}
function Fu(t, e, n) {
  const s = Ru(n), o = [], i = /* @__PURE__ */ new Map(), r = zu(t);
  for (const [h, g] of r) {
    const [p, d] = h.split("\0"), x = Pu(p, g, n, s);
    if (!x) continue;
    const m = o.length;
    o.push(x), i.has(d) || i.set(d, {
      lookupIndices: /* @__PURE__ */ new Set(),
      scripts: /* @__PURE__ */ new Map()
    });
    const y = i.get(d);
    y.lookupIndices.add(m);
    for (const _ of g) {
      const w = _.allScripts || [
        { script: _.script, language: _.language }
      ];
      for (const S of w) {
        const b = S.script || "DFLT", v = S.language || null;
        y.scripts.has(b) || y.scripts.set(b, /* @__PURE__ */ new Set()), y.scripts.get(b).add(v);
      }
    }
  }
  const a = /* @__PURE__ */ new Map();
  for (const h of e) {
    a.set(h.index, o.length), o.push(h.lookup);
    for (const g of h.features) {
      const p = g.featureTag;
      i.has(p) || i.set(p, {
        lookupIndices: /* @__PURE__ */ new Set(),
        scripts: /* @__PURE__ */ new Map()
      });
      const d = i.get(p);
      d.lookupIndices.add(o.length - 1);
      const x = g.script || "DFLT", m = g.language || null;
      d.scripts.has(x) || d.scripts.set(x, /* @__PURE__ */ new Set()), d.scripts.get(x).add(m);
    }
  }
  a.size > 0 && Gr(o, a);
  const c = [], f = /* @__PURE__ */ new Map();
  for (const [h, g] of i)
    f.set(h, c.length), c.push({
      featureTag: h,
      feature: {
        featureParamsOffset: 0,
        lookupListIndices: Array.from(g.lookupIndices).sort(
          (p, d) => p - d
        )
      }
    });
  const u = /* @__PURE__ */ new Map();
  for (const [h, g] of i) {
    const p = f.get(h);
    for (const [d, x] of g.scripts) {
      u.has(d) || u.set(d, /* @__PURE__ */ new Map());
      const m = u.get(d);
      for (const y of x)
        m.has(y) || m.set(y, /* @__PURE__ */ new Set()), m.get(y).add(p);
    }
  }
  const l = [];
  for (const [h, g] of u) {
    const p = [];
    let d = null;
    for (const [x, m] of g) {
      const y = {
        lookupOrderOffset: 0,
        requiredFeatureIndex: 65535,
        featureIndices: Array.from(m).sort((_, w) => _ - w)
      };
      x === null ? d = y : p.push({
        langSysTag: x,
        langSys: y
      });
    }
    if (!d) {
      const x = /* @__PURE__ */ new Set();
      for (const [, m] of g)
        for (const y of m) x.add(y);
      d = {
        lookupOrderOffset: 0,
        requiredFeatureIndex: 65535,
        featureIndices: Array.from(x).sort((m, y) => m - y)
      };
    }
    l.push({
      scriptTag: h,
      script: {
        defaultLangSys: d,
        langSysRecords: p
      }
    });
  }
  return {
    majorVersion: 1,
    minorVersion: 0,
    scriptList: { scriptRecords: l },
    featureList: { featureRecords: c },
    lookupList: { lookups: o }
  };
}
function Vu(t) {
  const e = [], n = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map();
  for (const c of t) {
    s.set(c.index, e.length), e.push(c.lookup);
    for (const f of c.features) {
      const u = f.featureTag;
      n.has(u) || n.set(u, {
        lookupIndices: /* @__PURE__ */ new Set(),
        scripts: /* @__PURE__ */ new Map()
      });
      const l = n.get(u);
      l.lookupIndices.add(e.length - 1);
      const h = f.script || "DFLT", g = f.language || null;
      l.scripts.has(h) || l.scripts.set(h, /* @__PURE__ */ new Set()), l.scripts.get(h).add(g);
    }
  }
  s.size > 0 && Gr(e, s);
  const o = [], i = /* @__PURE__ */ new Map();
  for (const [c, f] of n)
    i.set(c, o.length), o.push({
      featureTag: c,
      feature: {
        featureParamsOffset: 0,
        lookupListIndices: Array.from(f.lookupIndices).sort(
          (u, l) => u - l
        )
      }
    });
  const r = /* @__PURE__ */ new Map();
  for (const [c, f] of n) {
    const u = i.get(c);
    for (const [l, h] of f.scripts) {
      r.has(l) || r.set(l, /* @__PURE__ */ new Map());
      const g = r.get(l);
      for (const p of h)
        g.has(p) || g.set(p, /* @__PURE__ */ new Set()), g.get(p).add(u);
    }
  }
  const a = [];
  for (const [c, f] of r) {
    let u = null;
    const l = [];
    for (const [h, g] of f) {
      const p = {
        lookupOrderOffset: 0,
        requiredFeatureIndex: 65535,
        featureIndices: Array.from(g).sort((d, x) => d - x)
      };
      h === null ? u = p : l.push({ langSysTag: h, langSys: p });
    }
    if (!u) {
      const h = /* @__PURE__ */ new Set();
      for (const [, g] of f)
        for (const p of g) h.add(p);
      u = {
        lookupOrderOffset: 0,
        requiredFeatureIndex: 65535,
        featureIndices: Array.from(h).sort((g, p) => g - p)
      };
    }
    a.push({
      scriptTag: c,
      script: { defaultLangSys: u, langSysRecords: l }
    });
  }
  return {
    majorVersion: 1,
    minorVersion: 0,
    scriptList: { scriptRecords: a },
    featureList: { featureRecords: o },
    lookupList: { lookups: e }
  };
}
function zu(t) {
  const e = /* @__PURE__ */ new Map();
  for (const n of t) {
    const s = `${n.type}\0${n.feature}`;
    e.has(s) || e.set(s, []), e.get(s).push(n);
  }
  return e;
}
function Pu(t, e, n, s) {
  switch (t) {
    case "single":
      return Gu(e, n, s);
    case "multiple":
      return Uu(e, n, s);
    case "alternate":
      return Nu(e, n, s);
    case "ligature":
      return $u(e, n, s);
    case "reverse":
      return Hu(e, n, s);
    default:
      return null;
  }
}
function Gu(t, e, n) {
  const s = [], o = [];
  for (const r of t) {
    const a = ot(r.from, e, n), c = ot(r.to, e, n);
    a !== void 0 && c !== void 0 && (s.push(a), o.push(c));
  }
  if (s.length === 0) return null;
  const i = s.map((r, a) => ({ from: r, to: o[a] })).sort((r, a) => r.from - a.from);
  return {
    lookupType: 1,
    lookupFlag: 0,
    subtables: [
      {
        format: 2,
        coverage: { format: 1, glyphs: i.map((r) => r.from) },
        substituteGlyphIDs: i.map((r) => r.to)
      }
    ]
  };
}
function Uu(t, e, n) {
  const s = [];
  for (const o of t) {
    const i = ot(o.from, e, n);
    if (i === void 0) continue;
    const r = [];
    let a = !0;
    for (const c of o.to) {
      const f = ot(c, e, n);
      if (f === void 0) {
        a = !1;
        break;
      }
      r.push(f);
    }
    a && r.length > 0 && s.push({ from: i, to: r });
  }
  return s.length === 0 ? null : (s.sort((o, i) => o.from - i.from), {
    lookupType: 2,
    lookupFlag: 0,
    subtables: [
      {
        format: 1,
        coverage: { format: 1, glyphs: s.map((o) => o.from) },
        sequences: s.map((o) => o.to)
      }
    ]
  });
}
function Nu(t, e, n) {
  const s = [];
  for (const o of t) {
    const i = ot(o.from, e, n);
    if (i === void 0) continue;
    const r = [];
    let a = !0;
    for (const c of o.alternates) {
      const f = ot(c, e, n);
      if (f === void 0) {
        a = !1;
        break;
      }
      r.push(f);
    }
    a && r.length > 0 && s.push({ from: i, alternates: r });
  }
  return s.length === 0 ? null : (s.sort((o, i) => o.from - i.from), {
    lookupType: 3,
    lookupFlag: 0,
    subtables: [
      {
        format: 1,
        coverage: { format: 1, glyphs: s.map((o) => o.from) },
        alternateSets: s.map((o) => o.alternates)
      }
    ]
  });
}
function $u(t, e, n) {
  const s = /* @__PURE__ */ new Map();
  for (const r of t) {
    if (!r.components || r.components.length < 2) continue;
    const a = ot(r.components[0], e, n), c = ot(r.ligature, e, n);
    if (a === void 0 || c === void 0) continue;
    const f = [];
    let u = !0;
    for (let l = 1; l < r.components.length; l++) {
      const h = ot(r.components[l], e, n);
      if (h === void 0) {
        u = !1;
        break;
      }
      f.push(h);
    }
    u && (s.has(a) || s.set(a, []), s.get(a).push({
      ligatureGlyph: c,
      componentCount: r.components.length,
      componentGlyphIDs: f
    }));
  }
  if (s.size === 0) return null;
  const o = Array.from(s.keys()).sort((r, a) => r - a), i = o.map((r) => s.get(r));
  return {
    lookupType: 4,
    lookupFlag: 0,
    subtables: [
      {
        format: 1,
        coverage: { format: 1, glyphs: o },
        ligatureSets: i
      }
    ]
  };
}
function Hu(t, e, n) {
  const s = [];
  for (const o of t) {
    const i = ot(o.from, e, n), r = ot(o.to, e, n);
    if (i === void 0 || r === void 0) continue;
    const a = (o.backtrack || []).map((f) => ({ format: 1, glyphs: f.map((l) => ot(l, e, n)).filter((l) => l !== void 0).sort((l, h) => l - h) })), c = (o.lookahead || []).map((f) => ({ format: 1, glyphs: f.map((l) => ot(l, e, n)).filter((l) => l !== void 0).sort((l, h) => l - h) }));
    s.push({
      format: 1,
      coverage: { format: 1, glyphs: [i] },
      backtrackCoverages: a,
      lookaheadCoverages: c,
      substituteGlyphIDs: [r]
    });
  }
  return s.length === 0 ? null : {
    lookupType: 8,
    lookupFlag: 0,
    subtables: s
  };
}
function Gr(t, e) {
  for (const n of t)
    if (!(!n || !n.subtables) && !(n.lookupType !== 5 && n.lookupType !== 6))
      for (const s of n.subtables)
        ju(s, e);
}
function ju(t, e) {
  if (t.ruleSets) {
    for (const n of t.ruleSets)
      if (n)
        for (const s of n)
          Ee(s.seqLookupRecords, e);
  }
  if (t.classSets) {
    for (const n of t.classSets)
      if (n)
        for (const s of n)
          Ee(s.seqLookupRecords, e);
  }
  if (t.seqLookupRecords && Ee(t.seqLookupRecords, e), t.chainedRuleSets) {
    for (const n of t.chainedRuleSets)
      if (n)
        for (const s of n)
          Ee(s.seqLookupRecords, e);
  }
  if (t.chainedClassSets) {
    for (const n of t.chainedClassSets)
      if (n)
        for (const s of n)
          Ee(s.seqLookupRecords, e);
  }
}
function Ee(t, e) {
  if (t)
    for (const n of t) {
      const s = e.get(n.lookupListIndex);
      s !== void 0 && (n.lookupListIndex = s);
    }
}
function Zu(t) {
  if (!t || t.length === 0) return null;
  const e = t[0].length, n = t.map(
    (s) => s.map((o) => fo(o))
  );
  return {
    version: 0,
    numPaletteEntries: e,
    palettes: n
  };
}
function Wu(t, e) {
  if (!t || t.length === 0) return null;
  const n = hf(e), s = (h) => n.get(h) ?? 0, o = t.some((h) => h.paint), i = t.filter((h) => h.layers), r = [], a = [], c = i.map((h) => ({ ...h, glyphID: s(h.name) })).sort((h, g) => h.glyphID - g.glyphID);
  for (const h of c) {
    const g = a.length;
    for (const p of h.layers)
      a.push({
        glyphID: s(p.glyph),
        paletteIndex: p.paletteIndex
      });
    r.push({
      glyphID: h.glyphID,
      firstLayerIndex: g,
      numLayers: h.layers.length
    });
  }
  if (!o)
    return {
      version: 0,
      baseGlyphRecords: r,
      layerRecords: a
    };
  const f = t.filter((h) => h.paint), u = [], l = f.map((h) => ({ ...h, glyphID: s(h.name) })).sort((h, g) => h.glyphID - g.glyphID);
  for (const h of l) {
    const g = structuredClone(h.paint);
    _n(g, n), u.push({
      glyphID: h.glyphID,
      paint: g
    });
  }
  return {
    version: 1,
    baseGlyphRecords: r,
    layerRecords: a,
    baseGlyphPaintRecords: u,
    layerPaints: [],
    clipList: null,
    varIndexMap: null,
    itemVariationStore: null
  };
}
function qu(t, e, n = !0) {
  const s = t[e];
  if (s >= 32 && s <= 246)
    return { value: s - 139, bytesConsumed: 1 };
  if (s >= 247 && s <= 250) {
    const o = t[e + 1];
    return { value: (s - 247) * 256 + o + 108, bytesConsumed: 2 };
  }
  if (s >= 251 && s <= 254) {
    const o = t[e + 1];
    return { value: -(s - 251) * 256 - o - 108, bytesConsumed: 2 };
  }
  if (s === 28) {
    const o = t[e + 1] << 8 | t[e + 2];
    return { value: o > 32767 ? o - 65536 : o, bytesConsumed: 3 };
  }
  return s === 29 && n ? { value: t[e + 1] << 24 | t[e + 2] << 16 | t[e + 3] << 8 | t[e + 4] | 0, bytesConsumed: 5 } : s === 30 && n ? Yu(t, e + 1) : s === 255 && !n ? { value: (t[e + 1] << 24 | t[e + 2] << 16 | t[e + 3] << 8 | t[e + 4] | 0) / 65536, bytesConsumed: 5 } : null;
}
function Yu(t, e) {
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
  let s = "", o = e, i = !1;
  for (; !i; ) {
    const a = t[o++], c = a >> 4 & 15, f = a & 15;
    c === 15 ? i = !0 : (s += n[c], f === 15 ? i = !0 : s += n[f]);
  }
  return { value: s === "" || s === "." ? 0 : parseFloat(s), bytesConsumed: 1 + (o - e) };
}
function Ur(t) {
  return Number.isInteger(t) ? Xu(t) : Ku(t);
}
function Xu(t) {
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
function Ku(t) {
  const e = [30];
  let n = t.toString();
  (n.includes("e") || n.includes("E")) && (n = t.toPrecision(10), n.includes(".") && (n = n.replace(/0+$/, "").replace(/\.$/, "")));
  const s = [];
  for (const o of n)
    switch (o) {
      case "0":
        s.push(0);
        break;
      case "1":
        s.push(1);
        break;
      case "2":
        s.push(2);
        break;
      case "3":
        s.push(3);
        break;
      case "4":
        s.push(4);
        break;
      case "5":
        s.push(5);
        break;
      case "6":
        s.push(6);
        break;
      case "7":
        s.push(7);
        break;
      case "8":
        s.push(8);
        break;
      case "9":
        s.push(9);
        break;
      case ".":
        s.push(10);
        break;
      case "E":
      case "e":
        s.push(11);
        break;
      case "-":
        s.push(14);
        break;
    }
  for (let o = 0; o < s.length - 1; o++)
    s[o] === 11 && s[o + 1] === 14 && s.splice(o, 2, 12);
  s.push(15);
  for (let o = 0; o < s.length; o += 2) {
    const i = s[o], r = o + 1 < s.length ? s[o + 1] : 15;
    e.push(i << 4 | r);
  }
  return e;
}
function Ju(t) {
  return t <= 27;
}
function Ht(t, e = 0, n = t.length) {
  const s = [], o = [];
  let i = e;
  for (; i < n; ) {
    const r = t[i];
    if (Ju(r)) {
      let a;
      r === 12 ? (a = 3072 | t[i + 1], i += 2) : (a = r, i += 1), s.push({ operator: a, operands: [...o] }), o.length = 0;
    } else {
      const a = qu(t, i, !0);
      a === null ? i += 1 : (o.push(a.value), i += a.bytesConsumed);
    }
  }
  return s;
}
function Et(t, e) {
  const n = t[e] << 8 | t[e + 1];
  if (n === 0)
    return { items: [], totalBytes: 2 };
  const s = t[e + 2], o = e + 3, i = [];
  for (let f = 0; f <= n; f++) {
    let u = 0;
    const l = o + f * s;
    for (let h = 0; h < s; h++)
      u = u << 8 | t[l + h];
    i.push(u);
  }
  const r = o + (n + 1) * s, a = [];
  for (let f = 0; f < n; f++) {
    const u = r + i[f] - 1, l = r + i[f + 1] - 1;
    a.push(new Uint8Array(Array.prototype.slice.call(t, u, l)));
  }
  const c = r + i[n] - 1 - e;
  return { items: a, totalBytes: c };
}
function fn(t, e) {
  const s = (t[e] << 24 | t[e + 1] << 16 | t[e + 2] << 8 | t[e + 3]) >>> 0;
  if (s === 0)
    return { items: [], totalBytes: 4 };
  const o = t[e + 4], i = e + 5, r = [];
  for (let u = 0; u <= s; u++) {
    let l = 0;
    const h = i + u * o;
    for (let g = 0; g < o; g++)
      l = l << 8 | t[h + g];
    r.push(l >>> 0);
  }
  const a = i + (s + 1) * o, c = [];
  for (let u = 0; u < s; u++) {
    const l = a + r[u] - 1, h = a + r[u + 1] - 1;
    c.push(new Uint8Array(Array.prototype.slice.call(t, l, h)));
  }
  const f = a + r[s] - 1 - e;
  return { items: c, totalBytes: f };
}
function Ot(t) {
  const e = t.length;
  if (e === 0)
    return [0, 0];
  const n = [1];
  for (const r of t)
    n.push(n[n.length - 1] + r.length);
  const s = n[n.length - 1];
  let o;
  s <= 255 ? o = 1 : s <= 65535 ? o = 2 : s <= 16777215 ? o = 3 : o = 4;
  const i = [];
  i.push(e >> 8 & 255, e & 255), i.push(o);
  for (const r of n)
    for (let a = o - 1; a >= 0; a--)
      i.push(r >> a * 8 & 255);
  for (const r of t)
    for (let a = 0; a < r.length; a++)
      i.push(r[a]);
  return i;
}
function un(t) {
  const e = t.length;
  if (e === 0)
    return [0, 0, 0, 0];
  const n = [1];
  for (const r of t)
    n.push(n[n.length - 1] + r.length);
  const s = n[n.length - 1];
  let o;
  s <= 255 ? o = 1 : s <= 65535 ? o = 2 : s <= 16777215 ? o = 3 : o = 4;
  const i = [];
  i.push(
    e >> 24 & 255,
    e >> 16 & 255,
    e >> 8 & 255,
    e & 255
  ), i.push(o);
  for (const r of n)
    for (let a = o - 1; a >= 0; a--)
      i.push(r >> a * 8 & 255);
  for (const r of t)
    for (let a = 0; a < r.length; a++)
      i.push(r[a]);
  return i;
}
const Bs = {
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
}, ht = Object.fromEntries(
  Object.entries(Bs).map(([t, e]) => [e, Number(t)])
), Ms = {
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
}, jo = Object.fromEntries(
  Object.entries(Ms).map(([t, e]) => [e, Number(t)])
), Ls = {
  17: "CharStrings",
  24: "VariationStore",
  3079: "FontMatrix",
  3108: "FDArray",
  3109: "FDSelect"
}, ae = Object.fromEntries(
  Object.entries(Ls).map(([t, e]) => [e, Number(t)])
), Nr = {
  18: "Private"
}, $r = {
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
function jt(t, e) {
  const n = {};
  for (const { operator: s, operands: o } of t) {
    const i = e[s] || `op_${s}`;
    n[i] = o.length === 1 ? o[0] : o;
  }
  return n;
}
function Se(t, e) {
  const n = [];
  for (const [s, o] of Object.entries(t)) {
    const i = e[s];
    if (i === void 0) continue;
    const r = Array.isArray(o) ? o : [o];
    n.push({ operator: i, operands: r });
  }
  return n;
}
function Hr(t, e, n) {
  const s = t[e];
  if (s === 0) {
    const o = [];
    for (let i = 0; i < n; i++)
      o.push(t[e + 1 + i]);
    return o;
  }
  if (s === 3) {
    const o = t[e + 1] << 8 | t[e + 2], i = new Array(n);
    let r = e + 3;
    for (let a = 0; a < o; a++) {
      const c = t[r] << 8 | t[r + 1], f = t[r + 2];
      r += 3;
      const u = a < o - 1 ? t[r] << 8 | t[r + 1] : n;
      for (let l = c; l < u; l++)
        i[l] = f;
    }
    return i;
  }
  if (s === 4) {
    const o = (t[e + 1] << 24 | t[e + 2] << 16 | t[e + 3] << 8 | t[e + 4]) >>> 0, i = new Array(n);
    let r = e + 5;
    for (let a = 0; a < o; a++) {
      const c = (t[r] << 24 | t[r + 1] << 16 | t[r + 2] << 8 | t[r + 3]) >>> 0, f = t[r + 4] << 8 | t[r + 5];
      r += 6;
      const u = a < o - 1 ? (t[r] << 24 | t[r + 1] << 16 | t[r + 2] << 8 | t[r + 3]) >>> 0 : n;
      for (let l = c; l < u; l++)
        i[l] = f;
    }
    return i;
  }
  throw new Error(`Unsupported FDSelect format: ${s}`);
}
function jr(t) {
  const e = [0];
  for (const n of t)
    e.push(n);
  return e;
}
function Qu(t, e, n) {
  if (e === 0) return "ISOAdobe";
  if (e === 1) return "Expert";
  if (e === 2) return "ExpertSubset";
  const s = t[e], o = [];
  if (s === 0)
    for (let i = 1; i < n; i++) {
      const r = t[e + 1 + (i - 1) * 2] << 8 | t[e + 2 + (i - 1) * 2];
      o.push(r);
    }
  else if (s === 1) {
    let i = e + 1;
    for (; o.length < n - 1; ) {
      const r = t[i] << 8 | t[i + 1], a = t[i + 2];
      i += 3;
      for (let c = 0; c <= a && o.length < n - 1; c++)
        o.push(r + c);
    }
  } else if (s === 2) {
    let i = e + 1;
    for (; o.length < n - 1; ) {
      const r = t[i] << 8 | t[i + 1], a = t[i + 2] << 8 | t[i + 3];
      i += 4;
      for (let c = 0; c <= a && o.length < n - 1; c++)
        o.push(r + c);
    }
  }
  return o;
}
function tl(t) {
  if (typeof t == "string")
    return [];
  const e = [0];
  for (const n of t)
    e.push(n >> 8 & 255, n & 255);
  return e;
}
function el(t, e) {
  if (e === 0) return "Standard";
  if (e === 1) return "Expert";
  const n = t[e] & 127, s = (t[e] & 128) !== 0, o = [];
  if (n === 0) {
    const i = t[e + 1];
    for (let r = 0; r < i; r++)
      o.push(t[e + 2 + r]);
  } else if (n === 1) {
    const i = t[e + 1];
    let r = e + 2;
    for (let a = 0; a < i; a++) {
      const c = t[r], f = t[r + 1];
      r += 2;
      for (let u = 0; u <= f; u++)
        o.push(c + u);
    }
  }
  return { format: n, codes: o, hasSupplement: s };
}
const Zr = /* @__PURE__ */ new Set([
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
]), Zo = /* @__PURE__ */ new Set([
  19
  // Subrs  (relative offset from Private start)
]);
function bn(t, e) {
  const n = [];
  for (const { operator: s, operands: o } of t) {
    const i = e.has(s);
    for (const r of o)
      i && Number.isInteger(r) ? n.push(
        29,
        r >>> 24 & 255,
        r >>> 16 & 255,
        r >>> 8 & 255,
        r & 255
      ) : n.push(...Ur(r));
    s >= 3072 ? n.push(12, s & 255) : n.push(s);
  }
  return n;
}
function Wo(t) {
  const e = [];
  for (let n = 0; n < t.length; n++) e.push(t.charCodeAt(n));
  return e;
}
function qo(t) {
  return String.fromCharCode(...t);
}
function Wr(t, e) {
  const n = new Uint8Array(t), s = n[0], o = n[1];
  let r = n[2];
  const a = Et(n, r);
  r += a.totalBytes;
  const c = a.items.map(qo), f = Et(n, r);
  r += f.totalBytes;
  const u = Et(n, r);
  r += u.totalBytes;
  const l = u.items.map(qo), g = Et(n, r).items.map((d) => Array.from(d)), p = f.items.map((d) => nl(n, d));
  return {
    majorVersion: s,
    minorVersion: o,
    names: c,
    strings: l,
    globalSubrs: g,
    fonts: p
  };
}
function nl(t, e) {
  const n = Ht(e, 0, e.length), s = jt(n, Bs), o = s.CharStrings, i = s.charset ?? 0, r = s.Encoding ?? 0, a = s.Private;
  delete s.CharStrings, delete s.charset, delete s.Encoding, delete s.Private;
  const c = s.FDArray, f = s.FDSelect;
  delete s.FDArray, delete s.FDSelect;
  let u = [];
  o !== void 0 && (u = Et(t, o).items.map((S) => Array.from(S)));
  const l = u.length, h = Qu(t, i, l), g = el(t, r);
  let p = {}, d = [];
  if (Array.isArray(a) && a.length === 2) {
    const [w, S] = a, b = Ht(t, S, S + w);
    p = jt(b, Ms), p.Subrs !== void 0 && (d = Et(t, S + p.Subrs).items.map((I) => Array.from(I)), delete p.Subrs);
  }
  const x = s.ROS !== void 0;
  let m, y;
  x && (c !== void 0 && (m = Et(t, c).items.map((S) => {
    const b = Ht(S, 0, S.length), v = jt(b, Bs);
    let I = {}, A = [];
    if (Array.isArray(v.Private) && v.Private.length === 2) {
      const [C, O] = v.Private, T = Ht(t, O, O + C);
      I = jt(T, Ms), I.Subrs !== void 0 && (A = Et(t, O + I.Subrs).items.map((E) => Array.from(E)), delete I.Subrs), delete v.Private;
    }
    return {
      fontDict: v,
      privateDict: I,
      localSubrs: A
    };
  })), f !== void 0 && (y = Hr(t, f, l)));
  const _ = {
    topDict: s,
    charset: h,
    encoding: g,
    charStrings: u,
    privateDict: p,
    localSubrs: d
  };
  return x && (_.isCIDFont = !0, m && (_.fdArray = m), y && (_.fdSelect = y)), _;
}
function qr(t) {
  const {
    majorVersion: e = 1,
    minorVersion: n = 0,
    names: s = [],
    strings: o = [],
    globalSubrs: i = [],
    fonts: r = []
  } = t, a = [e, n, 4, 4], c = Ot(s.map(Wo)), f = Ot(o.map(Wo)), u = Ot(
    i.map((_) => new Uint8Array(_))
  ), l = r.map((_) => sl(_)), h = r.map(
    (_, w) => Yo(
      _,
      l[w],
      /* baseOffset */
      0
    )
  ), g = Ot(h);
  let d = a.length + c.length + g.length + f.length + u.length;
  const x = r.map((_, w) => {
    const S = Yo(_, l[w], d);
    return d += l[w].totalSize, S;
  }), m = Ot(x);
  if (m.length !== g.length)
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
  for (const _ of l)
    for (const w of _.sections)
      for (let S = 0; S < w.length; S++) y.push(w[S]);
  return y;
}
function sl(t) {
  const e = [], n = {};
  let s = 0;
  const o = (t.charStrings || []).map((l) => new Uint8Array(l)), i = Ot(o);
  n.charStrings = s, e.push(i), s += i.length;
  const r = t.charset;
  if (typeof r == "string")
    n.charset = r === "ISOAdobe" ? 0 : r === "Expert" ? 1 : 2, n.charsetIsPredefined = !0;
  else {
    const l = tl(r || []);
    n.charset = s, n.charsetIsPredefined = !1, e.push(l), s += l.length;
  }
  const a = t.encoding;
  if (typeof a == "string")
    n.encoding = a === "Standard" ? 0 : 1, n.encodingIsPredefined = !0;
  else if (a && typeof a == "object") {
    const l = ol(a);
    n.encoding = s, n.encodingIsPredefined = !1, e.push(l), s += l.length;
  } else
    n.encoding = 0, n.encodingIsPredefined = !0;
  const c = Se(
    t.privateDict || {},
    jo
  );
  let f = null;
  if (t.localSubrs && t.localSubrs.length > 0 && (f = Ot(
    t.localSubrs.map((l) => new Uint8Array(l))
  )), f) {
    const h = bn(
      c,
      Zo
    ).length + 6;
    c.push({
      operator: jo.Subrs,
      operands: [h]
    });
  }
  const u = bn(c, Zo);
  if (n.privateOffset = s, n.privateSize = u.length, e.push(u), s += u.length, f && (e.push(f), s += f.length), t.isCIDFont) {
    if (t.fdSelect) {
      const l = jr(t.fdSelect);
      n.fdSelect = s, e.push(l), s += l.length;
    }
    if (t.fdArray) {
      const l = t.fdArray.map((g) => {
        const p = Se(
          g.fontDict || {},
          ht
        );
        return bn(p, Zr);
      }), h = Ot(l);
      n.fdArray = s, e.push(h), s += h.length;
    }
  }
  return { sections: e, totalSize: s, offsets: n };
}
function Yo(t, e, n) {
  const s = e.offsets, o = Se(
    t.topDict || {},
    ht
  );
  return o.push({
    operator: ht.CharStrings,
    operands: [n + s.charStrings]
  }), s.charsetIsPredefined ? s.charset !== 0 && o.push({
    operator: ht.charset,
    operands: [s.charset]
  }) : o.push({
    operator: ht.charset,
    operands: [n + s.charset]
  }), s.encodingIsPredefined ? s.encoding !== 0 && o.push({
    operator: ht.Encoding,
    operands: [s.encoding]
  }) : o.push({
    operator: ht.Encoding,
    operands: [n + s.encoding]
  }), o.push({
    operator: ht.Private,
    operands: [s.privateSize, n + s.privateOffset]
  }), t.isCIDFont && (s.fdArray !== void 0 && o.push({
    operator: ht.FDArray,
    operands: [n + s.fdArray]
  }), s.fdSelect !== void 0 && o.push({
    operator: ht.FDSelect,
    operands: [n + s.fdSelect]
  })), bn(o, Zr);
}
function ol(t) {
  const { format: e = 0, codes: n = [], hasSupplement: s = !1 } = t, o = [], i = e | (s ? 128 : 0);
  if (e === 0) {
    o.push(i), o.push(n.length);
    for (const r of n) o.push(r);
  } else if (e === 1) {
    const r = [];
    if (n.length > 0) {
      let a = n[0], c = 0;
      for (let f = 1; f < n.length; f++)
        n[f] === a + c + 1 ? c++ : (r.push([a, c]), a = n[f], c = 0);
      r.push([a, c]);
    }
    o.push(i), o.push(r.length);
    for (const [a, c] of r)
      o.push(a, c);
  }
  return o;
}
class B {
  /**
   * @param {number[]|Uint8Array} bytes - source bytes
   * @param {number} [startOffset=0]    - initial cursor position
   */
  constructor(e, n = 0) {
    const s = e instanceof Uint8Array ? e : new Uint8Array(e);
    this._view = new DataView(s.buffer, s.byteOffset, s.byteLength), this._pos = n;
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
    const s = [], o = this[e].bind(this);
    for (let i = 0; i < n; i++)
      s.push(o());
    return s;
  }
  /**
   * Read `count` raw bytes and return a plain Array of numbers.
   * @param {number} count
   * @returns {number[]}
   */
  bytes(e) {
    const n = [];
    for (let s = 0; s < e; s++)
      n.push(this._view.getUint8(this._pos + s));
    return this._pos += e, n;
  }
}
class k {
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
    const s = this[e].bind(this);
    for (const o of n)
      s(o);
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
const Rs = 32768, Fs = 32767;
function Pt(t) {
  const e = new B(t), n = e.uint16(), s = e.offset32(), o = e.uint16(), i = e.array(
    "offset32",
    o
  ), r = il(
    e,
    s
  ), a = [];
  for (let c = 0; c < o; c++) {
    const f = i[c];
    f === 0 ? a.push(null) : a.push(rl(e, f));
  }
  return {
    format: n,
    variationRegionList: r,
    itemVariationData: a
  };
}
function il(t, e) {
  t.seek(e);
  const n = t.uint16(), s = t.uint16(), o = [];
  for (let i = 0; i < s; i++) {
    const r = [];
    for (let a = 0; a < n; a++)
      r.push({
        startCoord: t.f2dot14(),
        peakCoord: t.f2dot14(),
        endCoord: t.f2dot14()
      });
    o.push({ regionAxes: r });
  }
  return { axisCount: n, regions: o };
}
function rl(t, e) {
  t.seek(e);
  const n = t.uint16(), s = t.uint16(), o = t.uint16(), i = t.array("uint16", o), r = (s & Rs) !== 0, a = s & Fs, c = [];
  for (let f = 0; f < n; f++) {
    const u = [];
    for (let l = 0; l < a; l++)
      u.push(r ? t.int32() : t.int16());
    for (let l = a; l < o; l++)
      u.push(r ? t.int16() : t.int8());
    c.push(u);
  }
  return {
    itemCount: n,
    wordDeltaCount: s,
    regionIndexes: i,
    deltaSets: c
  };
}
function Qt(t) {
  const e = t.variationRegionList, n = t.itemVariationData ?? [], s = n.length, o = 8 + 4 * s, i = e.axisCount, r = e.regions.length, a = 4 + r * i * 6, c = o;
  let f = c + a;
  const u = [];
  for (let g = 0; g < s; g++) {
    const p = n[g];
    if (!p) {
      u.push(0);
      continue;
    }
    u.push(f);
    const d = p.regionIndexes.length, x = (p.wordDeltaCount & Rs) !== 0, m = p.wordDeltaCount & Fs, y = 6 + 2 * d, _ = x ? 4 : 2, w = x ? 2 : 1, S = m * _ + (d - m) * w, b = y + p.itemCount * S;
    f += b;
  }
  const l = f, h = new k(l);
  h.uint16(t.format ?? 1), h.offset32(c), h.uint16(s);
  for (let g = 0; g < s; g++)
    h.offset32(u[g]);
  h.uint16(i), h.uint16(r);
  for (const g of e.regions)
    for (const p of g.regionAxes)
      h.f2dot14(p.startCoord), h.f2dot14(p.peakCoord), h.f2dot14(p.endCoord);
  for (let g = 0; g < s; g++) {
    const p = n[g];
    if (!p) continue;
    const d = p.regionIndexes.length, x = (p.wordDeltaCount & Rs) !== 0, m = p.wordDeltaCount & Fs;
    h.uint16(p.itemCount), h.uint16(p.wordDeltaCount), h.uint16(d), h.array("uint16", p.regionIndexes);
    for (const y of p.deltaSets) {
      for (let _ = 0; _ < m; _++)
        x ? h.int32(y[_] ?? 0) : h.int16(y[_] ?? 0);
      for (let _ = m; _ < d; _++)
        x ? h.int16(y[_] ?? 0) : h.int8(y[_] ?? 0);
    }
  }
  return h.toArray();
}
function al(t) {
  const e = Qt(t), n = e.length, s = new Uint8Array(2 + n);
  return s[0] = n >> 8 & 255, s[1] = n & 255, s.set(new Uint8Array(e), 2), s;
}
const cl = Object.fromEntries(
  Object.entries(Nr).map(([t, e]) => [e, Number(t)])
), fl = Object.fromEntries(
  Object.entries($r).map(([t, e]) => [e, Number(t)])
), ul = /* @__PURE__ */ new Set([
  17,
  // CharStrings
  24,
  // VariationStore
  3108,
  // FDArray
  3109
  // FDSelect
]), ll = /* @__PURE__ */ new Set([
  18
  // Private  (size + offset)
]), Xo = /* @__PURE__ */ new Set([
  19
  // Subrs  (relative offset)
]);
function vn(t, e) {
  const n = [];
  for (const { operator: s, operands: o } of t) {
    const i = e.has(s);
    for (const r of o)
      i && Number.isInteger(r) ? n.push(
        29,
        r >>> 24 & 255,
        r >>> 16 & 255,
        r >>> 8 & 255,
        r & 255
      ) : n.push(...Ur(r));
    s >= 3072 ? n.push(12, s & 255) : n.push(s);
  }
  return n;
}
function hl(t, e) {
  const n = new Uint8Array(t), s = n[0], o = n[1], i = n[2], r = n[3] << 8 | n[4], a = i, c = a + r, f = Ht(n, a, c), u = jt(f, Ls), l = u.CharStrings, h = u.VariationStore, g = u.FDArray, p = u.FDSelect;
  delete u.CharStrings, delete u.VariationStore, delete u.FDArray, delete u.FDSelect;
  const x = fn(n, c).items.map((b) => Array.from(b));
  let m = [];
  l !== void 0 && (m = fn(n, l).items.map((v) => Array.from(v)));
  const y = m.length;
  let _ = [];
  g !== void 0 && (_ = fn(n, g).items.map((v) => {
    const I = Ht(v, 0, v.length), A = jt(I, {
      ...Nr,
      ...Ls
      // Font DICTs can also have FontMatrix
    });
    let C = {}, O = [];
    if (Array.isArray(A.Private) && A.Private.length === 2) {
      const [T, D] = A.Private, E = Ht(n, D, D + T);
      C = jt(E, $r), C.Subrs !== void 0 && (O = fn(n, D + C.Subrs).items.map((R) => Array.from(R)), delete C.Subrs), delete A.Private;
    }
    return {
      fontDict: A,
      privateDict: C,
      localSubrs: O
    };
  }));
  let w = null;
  p !== void 0 && y > 0 && (w = Hr(n, p, y));
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
    majorVersion: s,
    minorVersion: o,
    topDict: u,
    globalSubrs: x,
    charStrings: m,
    fontDicts: _,
    fdSelect: w,
    variationStore: S
  };
}
function pl(t) {
  const {
    majorVersion: e = 2,
    minorVersion: n = 0,
    topDict: s = {},
    globalSubrs: o = [],
    charStrings: i = [],
    fontDicts: r = [],
    fdSelect: a = null,
    variationStore: c = null
  } = t, f = un(
    o.map((T) => new Uint8Array(T))
  ), u = un(i.map((T) => new Uint8Array(T))), l = a ? jr(a) : null, h = c ? al(c) : null, p = Ko(s, {
    charStrings: 0,
    fdArray: r.length > 0 ? 0 : void 0,
    fdSelect: a ? 0 : void 0,
    variationStore: c ? 0 : void 0
  }).length, d = 5;
  let m = d + p + f.length;
  const y = m;
  m += u.length;
  let _;
  l && (_ = m, m += l.length);
  let w;
  h && (w = m, m += h.length);
  const S = r.map((T) => {
    const D = Se(
      T.privateDict || {},
      fl
    );
    let E = null;
    if (T.localSubrs && T.localSubrs.length > 0 && (E = un(
      T.localSubrs.map((R) => new Uint8Array(R))
    )), E) {
      const H = vn(
        D,
        Xo
      ).length + 6;
      D.push({
        operator: 19,
        // Subrs
        operands: [H]
      });
    }
    const M = vn(D, Xo);
    return {
      privBytes: M,
      localSubrBytes: E,
      totalSize: M.length + (E ? E.length : 0)
    };
  }), b = [];
  for (const T of S)
    b.push({ offset: m, size: T.privBytes.length }), m += T.totalSize;
  let v = null, I;
  if (r.length > 0) {
    const T = r.map((D, E) => {
      const M = Se(D.fontDict || {}, {
        ...cl,
        ...ae
      });
      return M.push({
        operator: 18,
        // Private
        operands: [b[E].size, b[E].offset]
      }), vn(M, ll);
    });
    v = un(T), I = m, m += v.length;
  }
  const A = Ko(s, {
    charStrings: y,
    fdArray: I,
    fdSelect: _,
    variationStore: w
  });
  if (A.length !== p)
    throw new Error(
      "CFF2 TopDICT size mismatch — this should not happen with forced int32 offsets"
    );
  const O = [
    ...[
      e,
      n,
      d,
      p >> 8 & 255,
      p & 255
    ],
    ...A,
    ...f,
    ...u
  ];
  if (l)
    for (let T = 0; T < l.length; T++)
      O.push(l[T]);
  if (h)
    for (let T = 0; T < h.length; T++)
      O.push(h[T]);
  for (const T of S) {
    for (let D = 0; D < T.privBytes.length; D++) O.push(T.privBytes[D]);
    if (T.localSubrBytes)
      for (let D = 0; D < T.localSubrBytes.length; D++)
        O.push(T.localSubrBytes[D]);
  }
  if (v)
    for (let T = 0; T < v.length; T++) O.push(v[T]);
  return O;
}
function Ko(t, e) {
  const n = Se(t, ae);
  return e.charStrings !== void 0 && n.push({
    operator: ae.CharStrings,
    operands: [e.charStrings]
  }), e.fdArray !== void 0 && n.push({
    operator: ae.FDArray,
    operands: [e.fdArray]
  }), e.fdSelect !== void 0 && n.push({
    operator: ae.FDSelect,
    operands: [e.fdSelect]
  }), e.variationStore !== void 0 && n.push({
    operator: ae.VariationStore,
    operands: [e.variationStore]
  }), vn(n, ul);
}
const gl = 8, dl = 4;
function ml(t) {
  const e = new B(t), n = e.uint16(), s = e.uint16(), o = e.int16(), i = e.uint16(), r = [];
  for (let a = 0; a < i; a++)
    r.push({
      glyphIndex: e.uint16(),
      vertOriginY: e.int16()
    });
  return {
    majorVersion: n,
    minorVersion: s,
    defaultVertOriginY: o,
    numVertOriginYMetrics: i,
    vertOriginYMetrics: r
  };
}
function yl(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, s = t.defaultVertOriginY ?? 0, o = t.vertOriginYMetrics ?? [], i = t.numVertOriginYMetrics ?? o.length, r = o.slice(0, i);
  for (; r.length < i; )
    r.push({ glyphIndex: 0, vertOriginY: s });
  const a = new k(
    gl + i * dl
  );
  a.uint16(e), a.uint16(n), a.int16(s), a.uint16(i);
  for (const c of r)
    a.uint16(c.glyphIndex ?? 0), a.int16(c.vertOriginY ?? s);
  return a.toArray();
}
const xl = 8;
function wl(t) {
  const e = new B(t), n = e.uint16(), s = e.uint16(), o = e.uint16(), i = e.uint16(), r = [];
  for (let a = 0; a < i; a++) {
    const c = e.uint16(), f = [];
    for (let u = 0; u < c; u++)
      f.push({
        fromCoordinate: e.f2dot14(),
        toCoordinate: e.f2dot14()
      });
    r.push({ positionMapCount: c, axisValueMaps: f });
  }
  return {
    majorVersion: n,
    minorVersion: s,
    reserved: o,
    segmentMaps: r
  };
}
function Sl(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, s = t.reserved ?? 0, o = t.segmentMaps ?? [];
  let i = xl;
  for (const a of o) {
    const c = a.axisValueMaps?.length ?? a.positionMapCount ?? 0;
    i += 2 + c * 4;
  }
  const r = new k(i);
  r.uint16(e), r.uint16(n), r.uint16(s), r.uint16(o.length);
  for (const a of o) {
    const c = a.axisValueMaps ?? [];
    r.uint16(c.length);
    for (const f of c)
      r.f2dot14(f.fromCoordinate), r.f2dot14(f.toCoordinate);
  }
  return r.toArray();
}
function z(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const s = t.uint16(), o = t.array("uint16", s);
    return { format: n, glyphs: o };
  }
  if (n === 2) {
    const s = t.uint16(), o = [];
    for (let i = 0; i < s; i++)
      o.push({
        startGlyphID: t.uint16(),
        endGlyphID: t.uint16(),
        startCoverageIndex: t.uint16()
      });
    return { format: n, ranges: o };
  }
  throw new Error(`Unknown Coverage format: ${n}`);
}
function G(t) {
  if (t.format === 1) {
    const e = 4 + t.glyphs.length * 2, n = new k(e);
    return n.uint16(1), n.uint16(t.glyphs.length), n.array("uint16", t.glyphs), n.toArray();
  }
  if (t.format === 2) {
    const e = 4 + t.ranges.length * 6, n = new k(e);
    n.uint16(2), n.uint16(t.ranges.length);
    for (const s of t.ranges)
      n.uint16(s.startGlyphID), n.uint16(s.endGlyphID), n.uint16(s.startCoverageIndex);
    return n.toArray();
  }
  throw new Error(`Unknown Coverage format: ${t.format}`);
}
function Lt(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const s = t.uint16(), o = t.uint16(), i = t.array("uint16", o);
    return { format: n, startGlyphID: s, classValues: i };
  }
  if (n === 2) {
    const s = t.uint16(), o = [];
    for (let i = 0; i < s; i++)
      o.push({
        startGlyphID: t.uint16(),
        endGlyphID: t.uint16(),
        class: t.uint16()
      });
    return { format: n, ranges: o };
  }
  throw new Error(`Unknown ClassDef format: ${n}`);
}
function Rt(t) {
  if (t.format === 1) {
    const e = 6 + t.classValues.length * 2, n = new k(e);
    return n.uint16(1), n.uint16(t.startGlyphID), n.uint16(t.classValues.length), n.array("uint16", t.classValues), n.toArray();
  }
  if (t.format === 2) {
    const e = 4 + t.ranges.length * 6, n = new k(e);
    n.uint16(2), n.uint16(t.ranges.length);
    for (const s of t.ranges)
      n.uint16(s.startGlyphID), n.uint16(s.endGlyphID), n.uint16(s.class);
    return n.toArray();
  }
  throw new Error(`Unknown ClassDef format: ${t.format}`);
}
function _e(t, e) {
  t.seek(e);
  const n = t.uint16(), s = t.uint16(), o = t.uint16();
  if (o === 32768)
    return {
      format: 32768,
      deltaSetOuterIndex: n,
      deltaSetInnerIndex: s
    };
  const i = n, r = s, a = o, c = r - i + 1;
  let f, u, l;
  if (a === 1)
    f = 2, u = 3, l = 2;
  else if (a === 2)
    f = 4, u = 15, l = 8;
  else if (a === 3)
    f = 8, u = 255, l = 128;
  else
    throw new Error(
      `Unknown Device deltaFormat: ${a} at offset ${e} (words: ${n}, ${s}, ${o})`
    );
  const h = 16 / f, g = Math.ceil(c / h), p = [];
  for (let d = 0; d < g; d++) {
    const x = t.uint16(), m = Math.min(h, c - d * h);
    for (let y = 0; y < m; y++) {
      const _ = 16 - f * (y + 1);
      let w = x >> _ & u;
      w >= l && (w -= l * 2), p.push(w);
    }
  }
  return { format: a, startSize: i, endSize: r, deltaValues: p };
}
function Tn(t) {
  if (t.format === 32768) {
    const l = new k(6);
    return l.uint16(t.deltaSetOuterIndex), l.uint16(t.deltaSetInnerIndex), l.uint16(32768), l.toArray();
  }
  const { startSize: e, endSize: n, deltaFormat: s, deltaValues: o } = t;
  let i;
  if (s === 1) i = 2;
  else if (s === 2) i = 4;
  else if (s === 3) i = 8;
  else throw new Error(`Unknown Device deltaFormat: ${s}`);
  const r = 16 / i, a = Math.ceil(o.length / r), c = (1 << i) - 1, f = 6 + a * 2, u = new k(f);
  u.uint16(e), u.uint16(n), u.uint16(s);
  for (let l = 0; l < a; l++) {
    let h = 0;
    const g = Math.min(
      r,
      o.length - l * r
    );
    for (let p = 0; p < g; p++) {
      const d = 16 - i * (p + 1);
      h |= (o[l * r + p] & c) << d;
    }
    u.uint16(h);
  }
  return u.toArray();
}
function Yr(t, e) {
  t.seek(e);
  const n = t.uint16(), s = [];
  for (let i = 0; i < n; i++)
    s.push({
      scriptTag: t.tag(),
      scriptOffset: t.uint16()
    });
  return { scriptRecords: s.map((i) => ({
    scriptTag: i.scriptTag,
    script: _l(t, e + i.scriptOffset)
  })) };
}
function _l(t, e) {
  t.seek(e);
  const n = t.uint16(), s = t.uint16(), o = [];
  for (let a = 0; a < s; a++)
    o.push({
      langSysTag: t.tag(),
      langSysOffset: t.uint16()
    });
  const i = n !== 0 ? Jo(t, e + n) : null, r = o.map((a) => ({
    langSysTag: a.langSysTag,
    langSys: Jo(t, e + a.langSysOffset)
  }));
  return { defaultLangSys: i, langSysRecords: r };
}
function Jo(t, e) {
  t.seek(e);
  const n = t.uint16(), s = t.uint16(), o = t.uint16(), i = t.array("uint16", o);
  return { lookupOrderOffset: n, requiredFeatureIndex: s, featureIndices: i };
}
function Xr(t) {
  const { scriptRecords: e } = t, n = e.map((a) => bl(a.script)), s = 2 + e.length * 6, o = [];
  let i = s;
  for (const a of n)
    o.push(i), i += a.length;
  const r = new k(i);
  r.uint16(e.length);
  for (let a = 0; a < e.length; a++)
    r.tag(e[a].scriptTag), r.uint16(o[a]);
  for (let a = 0; a < n.length; a++)
    r.seek(o[a]), r.rawBytes(n[a]);
  return r.toArray();
}
function bl(t) {
  const { defaultLangSys: e, langSysRecords: n } = t, s = n.map((u) => Qo(u.langSys)), o = e ? Qo(e) : null;
  let r = 4 + n.length * 6;
  const a = o ? r : 0;
  o && (r += o.length);
  const c = [];
  for (const u of s)
    c.push(r), r += u.length;
  const f = new k(r);
  f.uint16(a), f.uint16(n.length);
  for (let u = 0; u < n.length; u++)
    f.tag(n[u].langSysTag), f.uint16(c[u]);
  o && (f.seek(a), f.rawBytes(o));
  for (let u = 0; u < s.length; u++)
    f.seek(c[u]), f.rawBytes(s[u]);
  return f.toArray();
}
function Qo(t) {
  const e = 6 + t.featureIndices.length * 2, n = new k(e);
  return n.uint16(t.lookupOrderOffset), n.uint16(t.requiredFeatureIndex), n.uint16(t.featureIndices.length), n.array("uint16", t.featureIndices), n.toArray();
}
function Kr(t, e) {
  t.seek(e);
  const n = t.uint16(), s = [];
  for (let i = 0; i < n; i++)
    s.push({
      featureTag: t.tag(),
      featureOffset: t.uint16()
    });
  return { featureRecords: s.map((i) => ({
    featureTag: i.featureTag,
    feature: Jr(t, e + i.featureOffset)
  })) };
}
function Jr(t, e) {
  t.seek(e);
  const n = t.uint16(), s = t.uint16(), o = t.array("uint16", s);
  return { featureParamsOffset: n, lookupListIndices: o };
}
function Qr(t) {
  const { featureRecords: e } = t, n = e.map((a) => ta(a.feature)), s = 2 + e.length * 6, o = [];
  let i = s;
  for (const a of n)
    o.push(i), i += a.length;
  const r = new k(i);
  r.uint16(e.length);
  for (let a = 0; a < e.length; a++)
    r.tag(e[a].featureTag), r.uint16(o[a]);
  for (let a = 0; a < n.length; a++)
    r.seek(o[a]), r.rawBytes(n[a]);
  return r.toArray();
}
function ta(t) {
  const e = 4 + t.lookupListIndices.length * 2, n = new k(e);
  return n.uint16(t.featureParamsOffset), n.uint16(t.lookupListIndices.length), n.array("uint16", t.lookupListIndices), n.toArray();
}
function ea(t, e, n, s) {
  t.seek(e);
  const o = t.uint16();
  return { lookups: t.array("uint16", o).map(
    (a) => vl(t, e + a, n, s)
  ) };
}
function vl(t, e, n, s) {
  t.seek(e);
  const o = t.uint16(), i = t.uint16(), r = t.uint16(), a = t.array("uint16", r), c = i & 16 ? t.uint16() : void 0, f = a.map(
    (g) => n(t, e + g, o)
  );
  let u = o, l = f;
  s !== void 0 && o === s && f.length > 0 && (u = f[0].extensionLookupType, l = f.map((g) => g.subtable));
  const h = {
    lookupType: u,
    lookupFlag: i,
    subtables: l
  };
  return c !== void 0 && (h.markFilteringSet = c), h;
}
function na(t, e, n) {
  const { lookups: s } = t, o = 8, i = s.map((g) => {
    const p = g.subtables.map(
      (d) => e(d, g.lookupType)
    );
    return { ...g, subtableBytes: p };
  }), r = (g) => {
    const { lookupType: p, lookupFlag: d, subtableBytes: x, markFilteringSet: m } = g, y = m !== void 0;
    let w = 6 + x.length * 2 + (y ? 2 : 0);
    const S = x.map((v) => {
      const I = w;
      return w += v.length, I;
    }), b = new k(w);
    b.uint16(p), b.uint16(d), b.uint16(x.length), b.array("uint16", S), y && b.uint16(m);
    for (let v = 0; v < x.length; v++)
      b.seek(S[v]), b.rawBytes(x[v]);
    return b.toArray();
  };
  let a = i.map(r);
  const c = 2 + s.length * 2;
  if (((g) => {
    let p = c;
    for (const d of g) {
      if (p > 65535) return !0;
      p += d.length;
    }
    return !1;
  })(a) && n !== void 0) {
    const g = i.map((y) => {
      const { lookupType: _, lookupFlag: w, subtableBytes: S, markFilteringSet: b } = y, v = b !== void 0;
      let A = 6 + S.length * 2 + (v ? 2 : 0);
      const C = S.map(() => {
        const T = A;
        return A += o, T;
      }), O = new k(A);
      O.uint16(n), O.uint16(w), O.uint16(S.length), O.array("uint16", C), v && O.uint16(b);
      for (let T = 0; T < S.length; T++)
        O.seek(C[T]), O.uint16(1), O.uint16(_), O.uint32(0);
      return {
        compactBytes: O.toArray(),
        subtableOffsets: C,
        innerDataBytes: S
      };
    });
    let p = c;
    const d = g.map((y) => {
      const _ = p;
      return p += y.compactBytes.length, _;
    }), x = g.map(
      (y) => y.innerDataBytes.map((_) => {
        const w = p;
        return p += _.length, w;
      })
    ), m = new k(p);
    m.uint16(s.length), m.array("uint16", d);
    for (let y = 0; y < g.length; y++)
      m.seek(d[y]), m.rawBytes(g[y].compactBytes);
    for (let y = 0; y < g.length; y++) {
      const _ = g[y];
      for (let w = 0; w < _.innerDataBytes.length; w++) {
        const S = d[y] + _.subtableOffsets[w], b = x[y][w], v = b - S;
        m.seek(S + 4), m.uint32(v), m.seek(b), m.rawBytes(_.innerDataBytes[w]);
      }
    }
    return m.toArray();
  }
  let u = c;
  const l = a.map((g) => {
    const p = u;
    return u += g.length, p;
  }), h = new k(u);
  h.uint16(s.length), h.array("uint16", l);
  for (let g = 0; g < a.length; g++)
    h.seek(l[g]), h.rawBytes(a[g]);
  return h.toArray();
}
function sa(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const s = t.uint16(), o = t.uint16(), i = [];
    for (let c = 0; c < o; c++)
      i.push(t.uint16());
    const r = z(t, e + s), a = i.map(
      (c) => c === 0 ? null : kl(t, e + c)
    );
    return { format: n, coverage: r, seqRuleSets: a };
  }
  if (n === 2) {
    const s = t.uint16(), o = t.uint16(), i = t.uint16(), r = [];
    for (let u = 0; u < i; u++)
      r.push(t.uint16());
    const a = z(t, e + s), c = Lt(t, e + o), f = r.map(
      (u) => u === 0 ? null : Cl(t, e + u)
    );
    return { format: n, coverage: a, classDef: c, classSeqRuleSets: f };
  }
  if (n === 3) {
    const s = t.uint16(), o = t.uint16(), i = t.array("uint16", s), r = on(t, o), a = i.map(
      (c) => z(t, e + c)
    );
    return { format: n, coverages: a, seqLookupRecords: r };
  }
  throw new Error(`Unknown SequenceContext format: ${n}`);
}
function kl(t, e) {
  t.seek(e);
  const n = t.uint16();
  return t.array("uint16", n).map((o) => {
    t.seek(e + o);
    const i = t.uint16(), r = t.uint16(), a = t.array("uint16", i - 1), c = on(t, r);
    return { glyphCount: i, inputSequence: a, seqLookupRecords: c };
  });
}
function Cl(t, e) {
  t.seek(e);
  const n = t.uint16();
  return t.array("uint16", n).map((o) => {
    t.seek(e + o);
    const i = t.uint16(), r = t.uint16(), a = t.array("uint16", i - 1), c = on(t, r);
    return { glyphCount: i, inputSequence: a, seqLookupRecords: c };
  });
}
function on(t, e) {
  const n = [];
  for (let s = 0; s < e; s++)
    n.push({
      sequenceIndex: t.uint16(),
      lookupListIndex: t.uint16()
    });
  return n;
}
function oa(t) {
  if (t.format === 1) return Al(t);
  if (t.format === 2) return Il(t);
  if (t.format === 3) return Ol(t);
  throw new Error(`Unknown SequenceContext format: ${t.format}`);
}
function Al(t) {
  const { coverage: e, seqRuleSets: n } = t, s = G(e), o = n.map(
    (u) => u === null ? null : ia(u)
  );
  let r = 6 + n.length * 2;
  const a = r;
  r += s.length;
  const c = o.map((u) => {
    if (u === null) return 0;
    const l = r;
    return r += u.length, l;
  }), f = new k(r);
  f.uint16(1), f.uint16(a), f.uint16(n.length), f.array("uint16", c), f.seek(a), f.rawBytes(s);
  for (let u = 0; u < o.length; u++)
    o[u] && (f.seek(c[u]), f.rawBytes(o[u]));
  return f.toArray();
}
function Il(t) {
  const { coverage: e, classDef: n, classSeqRuleSets: s } = t, o = G(e), i = Rt(n), r = s.map(
    (g) => g === null ? null : ia(g)
  );
  let c = 8 + s.length * 2;
  const f = c;
  c += o.length;
  const u = c;
  c += i.length;
  const l = r.map((g) => {
    if (g === null) return 0;
    const p = c;
    return c += g.length, p;
  }), h = new k(c);
  h.uint16(2), h.uint16(f), h.uint16(u), h.uint16(s.length), h.array("uint16", l), h.seek(f), h.rawBytes(o), h.seek(u), h.rawBytes(i);
  for (let g = 0; g < r.length; g++)
    r[g] && (h.seek(l[g]), h.rawBytes(r[g]));
  return h.toArray();
}
function Ol(t) {
  const { coverages: e, seqLookupRecords: n } = t, s = e.map(G);
  let i = 6 + e.length * 2 + n.length * 4;
  const r = s.map((c) => {
    const f = i;
    return i += c.length, f;
  }), a = new k(i);
  a.uint16(3), a.uint16(e.length), a.uint16(n.length), a.array("uint16", r), Zn(a, n);
  for (let c = 0; c < s.length; c++)
    a.seek(r[c]), a.rawBytes(s[c]);
  return a.toArray();
}
function ia(t) {
  const e = t.map(Tl);
  let s = 2 + t.length * 2;
  const o = e.map((r) => {
    const a = s;
    return s += r.length, a;
  }), i = new k(s);
  i.uint16(t.length), i.array("uint16", o);
  for (let r = 0; r < e.length; r++)
    i.seek(o[r]), i.rawBytes(e[r]);
  return i.toArray();
}
function Tl(t) {
  const { glyphCount: e, inputSequence: n, seqLookupRecords: s } = t, o = 4 + (e - 1) * 2 + s.length * 4, i = new k(o);
  return i.uint16(e), i.uint16(s.length), i.array("uint16", n), Zn(i, s), i.toArray();
}
function Zn(t, e) {
  for (const n of e)
    t.uint16(n.sequenceIndex), t.uint16(n.lookupListIndex);
}
function ra(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const s = t.uint16(), o = t.uint16(), i = [];
    for (let c = 0; c < o; c++)
      i.push(t.uint16());
    const r = z(t, e + s), a = i.map(
      (c) => c === 0 ? null : Dl(t, e + c)
    );
    return { format: n, coverage: r, chainedSeqRuleSets: a };
  }
  if (n === 2) {
    const s = t.uint16(), o = t.uint16(), i = t.uint16(), r = t.uint16(), a = t.uint16(), c = [];
    for (let p = 0; p < a; p++)
      c.push(t.uint16());
    const f = z(t, e + s), u = Lt(
      t,
      e + o
    ), l = Lt(
      t,
      e + i
    ), h = Lt(
      t,
      e + r
    ), g = c.map(
      (p) => p === 0 ? null : El(t, e + p)
    );
    return {
      format: n,
      coverage: f,
      backtrackClassDef: u,
      inputClassDef: l,
      lookaheadClassDef: h,
      chainedClassSeqRuleSets: g
    };
  }
  if (n === 3) {
    const s = t.uint16(), o = t.array(
      "uint16",
      s
    ), i = t.uint16(), r = t.array("uint16", i), a = t.uint16(), c = t.array(
      "uint16",
      a
    ), f = t.uint16(), u = on(t, f), l = o.map(
      (p) => z(t, e + p)
    ), h = r.map(
      (p) => z(t, e + p)
    ), g = c.map(
      (p) => z(t, e + p)
    );
    return {
      format: n,
      backtrackCoverages: l,
      inputCoverages: h,
      lookaheadCoverages: g,
      seqLookupRecords: u
    };
  }
  throw new Error(`Unknown ChainedSequenceContext format: ${n}`);
}
function Dl(t, e) {
  t.seek(e);
  const n = t.uint16();
  return t.array("uint16", n).map((o) => aa(t, e + o));
}
function aa(t, e) {
  t.seek(e);
  const n = t.uint16(), s = t.array("uint16", n), o = t.uint16(), i = t.array("uint16", o - 1), r = t.uint16(), a = t.array("uint16", r), c = t.uint16(), f = on(t, c);
  return {
    backtrackSequence: s,
    inputGlyphCount: o,
    inputSequence: i,
    lookaheadSequence: a,
    seqLookupRecords: f
  };
}
function El(t, e) {
  t.seek(e);
  const n = t.uint16();
  return t.array("uint16", n).map((o) => aa(t, e + o));
}
function ca(t) {
  if (t.format === 1) return Bl(t);
  if (t.format === 2) return Ml(t);
  if (t.format === 3) return Ll(t);
  throw new Error(`Unknown ChainedSequenceContext format: ${t.format}`);
}
function Bl(t) {
  const { coverage: e, chainedSeqRuleSets: n } = t, s = G(e), o = n.map(
    (u) => u === null ? null : fa(u)
  );
  let r = 6 + n.length * 2;
  const a = r;
  r += s.length;
  const c = o.map((u) => {
    if (u === null) return 0;
    const l = r;
    return r += u.length, l;
  }), f = new k(r);
  f.uint16(1), f.uint16(a), f.uint16(n.length), f.array("uint16", c), f.seek(a), f.rawBytes(s);
  for (let u = 0; u < o.length; u++)
    o[u] && (f.seek(c[u]), f.rawBytes(o[u]));
  return f.toArray();
}
function Ml(t) {
  const {
    coverage: e,
    backtrackClassDef: n,
    inputClassDef: s,
    lookaheadClassDef: o,
    chainedClassSeqRuleSets: i
  } = t, r = G(e), a = Rt(n), c = Rt(s), f = Rt(o), u = i.map(
    (_) => _ === null ? null : fa(_)
  );
  let h = 12 + i.length * 2;
  const g = h;
  h += r.length;
  const p = h;
  h += a.length;
  const d = h;
  h += c.length;
  const x = h;
  h += f.length;
  const m = u.map((_) => {
    if (_ === null) return 0;
    const w = h;
    return h += _.length, w;
  }), y = new k(h);
  y.uint16(2), y.uint16(g), y.uint16(p), y.uint16(d), y.uint16(x), y.uint16(i.length), y.array("uint16", m), y.seek(g), y.rawBytes(r), y.seek(p), y.rawBytes(a), y.seek(d), y.rawBytes(c), y.seek(x), y.rawBytes(f);
  for (let _ = 0; _ < u.length; _++)
    u[_] && (y.seek(m[_]), y.rawBytes(u[_]));
  return y.toArray();
}
function Ll(t) {
  const {
    backtrackCoverages: e,
    inputCoverages: n,
    lookaheadCoverages: s,
    seqLookupRecords: o
  } = t, i = e.map(G), r = n.map(G), a = s.map(G);
  let f = 4 + e.length * 2 + 2 + n.length * 2 + 2 + s.length * 2 + 2 + o.length * 4;
  const u = i.map((p) => {
    const d = f;
    return f += p.length, d;
  }), l = r.map((p) => {
    const d = f;
    return f += p.length, d;
  }), h = a.map((p) => {
    const d = f;
    return f += p.length, d;
  }), g = new k(f);
  g.uint16(3), g.uint16(e.length), g.array("uint16", u), g.uint16(n.length), g.array("uint16", l), g.uint16(s.length), g.array("uint16", h), g.uint16(o.length), Zn(g, o);
  for (let p = 0; p < i.length; p++)
    g.seek(u[p]), g.rawBytes(i[p]);
  for (let p = 0; p < r.length; p++)
    g.seek(l[p]), g.rawBytes(r[p]);
  for (let p = 0; p < a.length; p++)
    g.seek(h[p]), g.rawBytes(a[p]);
  return g.toArray();
}
function fa(t) {
  const e = t.map(Rl);
  let s = 2 + t.length * 2;
  const o = e.map((r) => {
    const a = s;
    return s += r.length, a;
  }), i = new k(s);
  i.uint16(t.length), i.array("uint16", o);
  for (let r = 0; r < e.length; r++)
    i.seek(o[r]), i.rawBytes(e[r]);
  return i.toArray();
}
function Rl(t) {
  const {
    backtrackSequence: e,
    inputGlyphCount: n,
    inputSequence: s,
    lookaheadSequence: o,
    seqLookupRecords: i
  } = t, r = 2 + e.length * 2 + 2 + s.length * 2 + 2 + o.length * 2 + 2 + i.length * 4, a = new k(r);
  return a.uint16(e.length), a.array("uint16", e), a.uint16(n), a.array("uint16", s), a.uint16(o.length), a.array("uint16", o), a.uint16(i.length), Zn(a, i), a.toArray();
}
function ua(t, e) {
  t.seek(e);
  const n = t.uint16(), s = t.uint16(), o = t.uint32(), i = [];
  for (let a = 0; a < o; a++)
    i.push({
      conditionSetOffset: t.uint32(),
      featureTableSubstitutionOffset: t.uint32()
    });
  const r = i.map((a) => {
    const c = a.conditionSetOffset !== 0 ? Fl(t, e + a.conditionSetOffset) : null, f = a.featureTableSubstitutionOffset !== 0 ? Vl(
      t,
      e + a.featureTableSubstitutionOffset
    ) : null;
    return { conditionSet: c, featureTableSubstitution: f };
  });
  return { majorVersion: n, minorVersion: s, featureVariationRecords: r };
}
function Fl(t, e) {
  t.seek(e);
  const n = t.uint16(), s = [];
  for (let i = 0; i < n; i++)
    s.push(t.uint32());
  return { conditions: s.map((i) => {
    t.seek(e + i);
    const r = t.uint16();
    if (r === 1) {
      const a = t.uint16(), c = t.int16(), f = t.int16();
      return { format: r, axisIndex: a, filterRangeMinValue: c, filterRangeMaxValue: f };
    }
    return { format: r, _raw: !0 };
  }) };
}
function Vl(t, e) {
  t.seek(e);
  const n = t.uint16(), s = t.uint16(), o = t.uint16(), i = [];
  for (let r = 0; r < o; r++) {
    const a = t.uint16(), c = t.uint32(), f = Jr(t, e + c);
    i.push({ featureIndex: a, feature: f });
  }
  return { majorVersion: n, minorVersion: s, substitutions: i };
}
function la(t) {
  const { majorVersion: e, minorVersion: n, featureVariationRecords: s } = t, o = s.map((f) => ({
    csBytes: f.conditionSet ? zl(f.conditionSet) : null,
    ftsBytes: f.featureTableSubstitution ? Gl(f.featureTableSubstitution) : null
  }));
  let r = 8 + s.length * 8;
  const a = o.map((f) => {
    const u = f.csBytes ? r : 0;
    f.csBytes && (r += f.csBytes.length);
    const l = f.ftsBytes ? r : 0;
    return f.ftsBytes && (r += f.ftsBytes.length), { csOff: u, ftsOff: l };
  }), c = new k(r);
  c.uint16(e), c.uint16(n), c.uint32(s.length);
  for (const f of a)
    c.uint32(f.csOff), c.uint32(f.ftsOff);
  for (let f = 0; f < o.length; f++) {
    const u = o[f];
    u.csBytes && (c.seek(a[f].csOff), c.rawBytes(u.csBytes)), u.ftsBytes && (c.seek(a[f].ftsOff), c.rawBytes(u.ftsBytes));
  }
  return c.toArray();
}
function zl(t) {
  const e = t.conditions.map(Pl);
  let s = 2 + t.conditions.length * 4;
  const o = e.map((r) => {
    const a = s;
    return s += r.length, a;
  }), i = new k(s);
  i.uint16(t.conditions.length);
  for (const r of o) i.uint32(r);
  for (let r = 0; r < e.length; r++)
    i.seek(o[r]), i.rawBytes(e[r]);
  return i.toArray();
}
function Pl(t) {
  if (t.format === 1) {
    const e = new k(8);
    return e.uint16(1), e.uint16(t.axisIndex), e.int16(t.filterRangeMinValue), e.int16(t.filterRangeMaxValue), e.toArray();
  }
  throw new Error(`Unknown Condition format: ${t.format}`);
}
function Gl(t) {
  const e = t.substitutions.map(
    (r) => ta(r.feature)
  );
  let s = 6 + t.substitutions.length * 6;
  const o = e.map((r) => {
    const a = s;
    return s += r.length, a;
  }), i = new k(s);
  i.uint16(t.majorVersion), i.uint16(t.minorVersion), i.uint16(t.substitutions.length);
  for (let r = 0; r < t.substitutions.length; r++)
    i.uint16(t.substitutions[r].featureIndex), i.uint32(o[r]);
  for (let r = 0; r < e.length; r++)
    i.seek(o[r]), i.rawBytes(e[r]);
  return i.toArray();
}
const Ul = 8, Nl = 12;
function $l(t) {
  const e = new B(t), n = e.uint16(), s = e.uint16(), o = e.offset16(), i = e.offset16(), r = n > 1 || n === 1 && s >= 1 ? e.offset32() : 0, a = [o, i, r].filter(
    (c) => c > 0
  );
  return {
    majorVersion: n,
    minorVersion: s,
    horizAxis: o ? ti(t, o) : null,
    vertAxis: i ? ti(t, i) : null,
    itemVariationStore: r ? Pt(
      t.slice(
        r,
        Hl(t.length, r, a)
      )
    ) : null
  };
}
function Hl(t, e, n) {
  return n.filter((o) => o > e).sort((o, i) => o - i)[0] ?? t;
}
function ti(t, e) {
  if (e + 4 > t.length) return null;
  const n = new B(t);
  n.seek(e);
  const s = n.offset16(), o = n.offset16(), i = s ? jl(n, e + s) : null, r = o ? Zl(n, e + o) : [];
  return { baseTagList: i, baseScriptList: r };
}
function jl(t, e) {
  t.seek(e);
  const n = t.uint16(), s = [];
  for (let o = 0; o < n; o++)
    s.push(t.tag());
  return s;
}
function Zl(t, e) {
  t.seek(e);
  const n = t.uint16(), s = [];
  for (let o = 0; o < n; o++)
    s.push({ tag: t.tag(), off: t.offset16() });
  return s.map((o) => ({
    tag: o.tag,
    ...Wl(t, e + o.off)
  }));
}
function Wl(t, e) {
  t.seek(e);
  const n = t.offset16(), s = t.offset16(), o = t.uint16(), i = [];
  for (let r = 0; r < o; r++)
    i.push({ tag: t.tag(), off: t.offset16() });
  return {
    baseValues: n ? ql(t, e + n) : null,
    defaultMinMax: s ? ei(t, e + s) : null,
    langSystems: i.map((r) => ({
      tag: r.tag,
      minMax: ei(t, e + r.off)
    }))
  };
}
function ql(t, e) {
  t.seek(e);
  const n = t.uint16(), s = t.uint16(), o = [];
  for (let i = 0; i < s; i++)
    o.push(t.offset16());
  return {
    defaultBaselineIndex: n,
    baseCoords: o.map(
      (i) => i ? Le(t, e + i) : null
    )
  };
}
function ei(t, e) {
  t.seek(e);
  const n = t.offset16(), s = t.offset16(), o = t.uint16(), i = [];
  for (let r = 0; r < o; r++)
    i.push({
      tag: t.tag(),
      minOff: t.offset16(),
      maxOff: t.offset16()
    });
  return {
    minCoord: n ? Le(t, e + n) : null,
    maxCoord: s ? Le(t, e + s) : null,
    featMinMax: i.map((r) => ({
      tag: r.tag,
      minCoord: r.minOff ? Le(t, e + r.minOff) : null,
      maxCoord: r.maxOff ? Le(t, e + r.maxOff) : null
    }))
  };
}
function Le(t, e) {
  t.seek(e);
  const n = t.uint16(), s = t.int16();
  if (n === 1) return { format: n, coordinate: s };
  if (n === 2)
    return {
      format: n,
      coordinate: s,
      referenceGlyph: t.uint16(),
      baseCoordPoint: t.uint16()
    };
  if (n === 3) {
    const o = t.offset16();
    return {
      format: n,
      coordinate: s,
      device: o ? _e(t, e + o) : null
    };
  }
  return { format: n, coordinate: s };
}
function Yl(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, s = e > 1 || e === 1 && n >= 1, o = ni(t.horizAxis), i = ni(t.vertAxis), r = s && t.itemVariationStore ? Qt(t.itemVariationStore) : [];
  let c = s ? Nl : Ul;
  const f = o.length ? c : 0;
  c += o.length;
  const u = i.length ? c : 0;
  c += i.length;
  const l = r.length ? c : 0;
  c += r.length;
  const h = new k(c);
  return h.uint16(e), h.uint16(n), h.offset16(f), h.offset16(u), s && h.offset32(l), h.rawBytes(o), h.rawBytes(i), h.rawBytes(r), h.toArray();
}
function ni(t) {
  if (!t) return [];
  if (t._raw) return t._raw;
  const e = t.baseTagList ? Xl(t.baseTagList) : [], n = Kl(t.baseScriptList ?? []);
  let o = 4;
  const i = e.length ? o : 0;
  o += e.length;
  const r = n.length ? o : 0;
  o += n.length;
  const a = new k(o);
  return a.offset16(i), a.offset16(r), a.rawBytes(e), a.rawBytes(n), a.toArray();
}
function Xl(t) {
  const e = 2 + 4 * t.length, n = new k(e);
  n.uint16(t.length);
  for (const s of t)
    n.tag(s);
  return n.toArray();
}
function Kl(t) {
  const e = 2 + 6 * t.length, n = t.map((r) => Jl(r));
  let s = e;
  const o = n.map((r) => {
    const a = s;
    return s += r.length, a;
  }), i = new k(s);
  i.uint16(t.length);
  for (let r = 0; r < t.length; r++)
    i.tag(t[r].tag), i.offset16(o[r]);
  for (const r of n)
    i.rawBytes(r);
  return i.toArray();
}
function Jl(t) {
  const e = Ql(t.baseValues), n = si(t.defaultMinMax), s = t.langSystems ?? [], o = s.map((l) => si(l.minMax));
  let r = 6 + 6 * s.length;
  const a = e.length ? r : 0;
  r += e.length;
  const c = n.length ? r : 0;
  r += n.length;
  const f = o.map((l) => {
    const h = l.length ? r : 0;
    return r += l.length, h;
  }), u = new k(r);
  u.offset16(a), u.offset16(c), u.uint16(s.length);
  for (let l = 0; l < s.length; l++)
    u.tag(s[l].tag), u.offset16(f[l]);
  u.rawBytes(e), u.rawBytes(n);
  for (const l of o)
    u.rawBytes(l);
  return u.toArray();
}
function Ql(t) {
  if (!t) return [];
  const e = t.baseCoords ?? [], n = 4 + 2 * e.length, s = e.map((a) => Re(a));
  let o = n;
  const i = s.map((a) => {
    const c = a.length ? o : 0;
    return o += a.length, c;
  }), r = new k(o);
  r.uint16(t.defaultBaselineIndex ?? 0), r.uint16(e.length);
  for (const a of i)
    r.offset16(a);
  for (const a of s)
    r.rawBytes(a);
  return r.toArray();
}
function si(t) {
  if (!t) return [];
  const e = t.featMinMax ?? [], n = 6 + 8 * e.length, s = Re(t.minCoord), o = Re(t.maxCoord), i = e.map((l) => ({
    tag: l.tag,
    min: Re(l.minCoord),
    max: Re(l.maxCoord)
  }));
  let r = n;
  const a = s.length ? r : 0;
  r += s.length;
  const c = o.length ? r : 0;
  r += o.length;
  const f = i.map((l) => {
    const h = l.min.length ? r : 0;
    r += l.min.length;
    const g = l.max.length ? r : 0;
    return r += l.max.length, { minOff: h, maxOff: g };
  }), u = new k(r);
  u.offset16(a), u.offset16(c), u.uint16(e.length);
  for (let l = 0; l < e.length; l++)
    u.tag(e[l].tag), u.offset16(f[l].minOff), u.offset16(f[l].maxOff);
  u.rawBytes(s), u.rawBytes(o);
  for (const l of i)
    u.rawBytes(l.min), u.rawBytes(l.max);
  return u.toArray();
}
function Re(t) {
  if (!t) return [];
  if (t.format === 1) {
    const e = new k(4);
    return e.uint16(1), e.int16(t.coordinate), e.toArray();
  }
  if (t.format === 2) {
    const e = new k(8);
    return e.uint16(2), e.int16(t.coordinate), e.uint16(t.referenceGlyph ?? 0), e.uint16(t.baseCoordPoint ?? 0), e.toArray();
  }
  if (t.format === 3) {
    const e = t.device ? Tn(t.device) : [], n = e.length ? 6 : 0, s = new k(6 + e.length);
    return s.uint16(3), s.int16(t.coordinate), s.offset16(n), s.rawBytes(e), s.toArray();
  }
  return [];
}
const Pe = 5, Yt = 8;
function ln(t) {
  return {
    height: t.uint8(),
    width: t.uint8(),
    bearingX: t.int8(),
    bearingY: t.int8(),
    advance: t.uint8()
  };
}
function cs(t, e) {
  t.uint8(e.height ?? 0), t.uint8(e.width ?? 0), t.int8(e.bearingX ?? 0), t.int8(e.bearingY ?? 0), t.uint8(e.advance ?? 0);
}
function fe(t) {
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
function Ge(t, e) {
  t.uint8(e.height ?? 0), t.uint8(e.width ?? 0), t.int8(e.horiBearingX ?? 0), t.int8(e.horiBearingY ?? 0), t.uint8(e.horiAdvance ?? 0), t.int8(e.vertBearingX ?? 0), t.int8(e.vertBearingY ?? 0), t.uint8(e.vertAdvance ?? 0);
}
function po(t, e) {
  const n = new B(t), s = n.uint32(), o = e?.CBLC;
  if (!o?.sizes)
    return { version: s, data: Array.from(t.slice(4)) };
  const i = [];
  for (const r of o.sizes) {
    const a = [];
    for (const c of r.indexSubTables ?? [])
      a.push(th(t, n, c));
    i.push(a);
  }
  return { version: s, bitmapData: i };
}
function go(t) {
  const e = t.version ?? 196608;
  if (t.data) {
    const s = t.data, o = new k(4 + s.length);
    return o.uint32(e), o.rawBytes(s), o.toArray();
  }
  const n = new k(4);
  return n.uint32(e), n.toArray();
}
function fs(t, e) {
  const n = t.version ?? 196608, s = t.bitmapData ?? [], o = e.sizes ?? [], i = [], r = [];
  let a = 4;
  for (let u = 0; u < o.length; u++) {
    const l = o[u].indexSubTables ?? [], h = s[u] ?? [], g = [];
    for (let p = 0; p < l.length; p++) {
      const d = l[p], x = h[p] ?? [], { bytes: m, info: y } = eh(
        x,
        d,
        a
      );
      g.push(y), i.push(m), a += m.length;
    }
    r.push(g);
  }
  const c = a, f = new k(c);
  f.uint32(n);
  for (const u of i)
    f.rawBytes(u);
  return { bytes: f.toArray(), offsetInfo: r };
}
function th(t, e, n) {
  const { indexFormat: s, imageFormat: o, imageDataOffset: i } = n, r = [];
  switch (s) {
    case 1:
    case 3: {
      const a = n.sbitOffsets;
      for (let c = 0; c < a.length - 1; c++) {
        const f = i + a[c], l = i + a[c + 1] - f;
        l <= 0 ? r.push(null) : r.push(
          hn(
            t,
            e,
            f,
            o,
            l
          )
        );
      }
      break;
    }
    case 2: {
      const a = n.lastGlyphIndex - n.firstGlyphIndex + 1, { imageSize: c } = n;
      for (let f = 0; f < a; f++) {
        const u = i + f * c;
        r.push(
          hn(
            t,
            e,
            u,
            o,
            c
          )
        );
      }
      break;
    }
    case 4: {
      const a = n.glyphArray;
      for (let c = 0; c < a.length - 1; c++) {
        const f = i + a[c].sbitOffset, l = i + a[c + 1].sbitOffset - f;
        l <= 0 ? r.push(null) : r.push(
          hn(
            t,
            e,
            f,
            o,
            l
          )
        );
      }
      break;
    }
    case 5: {
      const a = n.glyphIdArray.length, { imageSize: c } = n;
      for (let f = 0; f < a; f++) {
        const u = i + f * c;
        r.push(
          hn(
            t,
            e,
            u,
            o,
            c
          )
        );
      }
      break;
    }
  }
  return r;
}
function hn(t, e, n, s, o) {
  if (o <= 0) return null;
  e.seek(n);
  const i = (r, a) => t.slice(r, r + a);
  switch (s) {
    case 1: {
      const r = ln(e), a = i(
        e.position,
        o - Pe
      );
      return { smallMetrics: r, imageData: a };
    }
    case 2: {
      const r = ln(e), a = i(
        e.position,
        o - Pe
      );
      return { smallMetrics: r, imageData: a };
    }
    case 5:
      return { imageData: i(n, o) };
    case 6: {
      const r = fe(e), a = i(
        e.position,
        o - Yt
      );
      return { bigMetrics: r, imageData: a };
    }
    case 7: {
      const r = fe(e), a = i(
        e.position,
        o - Yt
      );
      return { bigMetrics: r, imageData: a };
    }
    case 8: {
      const r = ln(e);
      e.skip(1);
      const a = e.uint16(), c = [];
      for (let f = 0; f < a; f++)
        c.push({
          glyphID: e.uint16(),
          xOffset: e.int8(),
          yOffset: e.int8()
        });
      return { smallMetrics: r, components: c };
    }
    case 9: {
      const r = fe(e), a = e.uint16(), c = [];
      for (let f = 0; f < a; f++)
        c.push({
          glyphID: e.uint16(),
          xOffset: e.int8(),
          yOffset: e.int8()
        });
      return { bigMetrics: r, components: c };
    }
    case 17: {
      const r = ln(e), a = e.uint32(), c = i(e.position, a);
      return { smallMetrics: r, imageData: c };
    }
    case 18: {
      const r = fe(e), a = e.uint32(), c = i(e.position, a);
      return { bigMetrics: r, imageData: c };
    }
    case 19: {
      const r = e.uint32();
      return { imageData: i(e.position, r) };
    }
    default:
      return { imageData: i(n, o) };
  }
}
function eh(t, e, n) {
  const { indexFormat: s, imageFormat: o } = e, i = { imageDataOffset: n }, r = t.map(
    (f) => f ? nh(f, o) : []
  );
  switch (s) {
    case 1:
    case 3: {
      const f = [0];
      let u = 0;
      for (const l of r)
        u += l.length, f.push(u);
      i.sbitOffsets = f;
      break;
    }
    case 2:
    case 5: {
      i.imageSize = e.imageSize ?? (r.length > 0 ? r[0].length : 0);
      break;
    }
    case 4: {
      const f = e.glyphIdArray ?? [], u = [];
      let l = 0;
      for (let h = 0; h < r.length; h++)
        u.push({
          glyphID: f[h] ?? 0,
          sbitOffset: l
        }), l += r[h].length;
      u.push({ glyphID: 0, sbitOffset: l }), i.glyphArray = u;
      break;
    }
  }
  const a = r.reduce((f, u) => f + u.length, 0), c = new k(a);
  for (const f of r)
    c.rawBytes(f);
  return { bytes: c.toArray(), info: i };
}
function nh(t, e) {
  switch (e) {
    case 1:
    case 2: {
      const n = t.imageData ?? [], s = new k(Pe + n.length);
      return cs(s, t.smallMetrics ?? {}), s.rawBytes(n), s.toArray();
    }
    case 5: {
      const n = t.imageData ?? [];
      return Array.from(n);
    }
    case 6:
    case 7: {
      const n = t.imageData ?? [], s = new k(Yt + n.length);
      return Ge(s, t.bigMetrics ?? {}), s.rawBytes(n), s.toArray();
    }
    case 8: {
      const n = t.components ?? [], s = new k(
        Pe + 1 + 2 + n.length * 4
      );
      cs(s, t.smallMetrics ?? {}), s.uint8(0), s.uint16(n.length);
      for (const o of n)
        s.uint16(o.glyphID ?? 0), s.int8(o.xOffset ?? 0), s.int8(o.yOffset ?? 0);
      return s.toArray();
    }
    case 9: {
      const n = t.components ?? [], s = new k(
        Yt + 2 + n.length * 4
      );
      Ge(s, t.bigMetrics ?? {}), s.uint16(n.length);
      for (const o of n)
        s.uint16(o.glyphID ?? 0), s.int8(o.xOffset ?? 0), s.int8(o.yOffset ?? 0);
      return s.toArray();
    }
    case 17: {
      const n = t.imageData ?? [], s = new k(Pe + 4 + n.length);
      return cs(s, t.smallMetrics ?? {}), s.uint32(n.length), s.rawBytes(n), s.toArray();
    }
    case 18: {
      const n = t.imageData ?? [], s = new k(Yt + 4 + n.length);
      return Ge(s, t.bigMetrics ?? {}), s.uint32(n.length), s.rawBytes(n), s.toArray();
    }
    case 19: {
      const n = t.imageData ?? [], s = new k(4 + n.length);
      return s.uint32(n.length), s.rawBytes(n), s.toArray();
    }
    default:
      return Array.from(t.imageData ?? []);
  }
}
function sh(t, e) {
  return po(t, e?.bloc ? { CBLC: e.bloc } : e);
}
function oh(t) {
  return go(t);
}
const ha = 48;
function mo(t) {
  return ih(t);
}
function de(t, e) {
  return e ? ah(t, e) : uh(t);
}
function ih(t) {
  const e = new B(t), n = e.uint16(), s = e.uint16(), o = e.uint32(), i = [], r = [];
  for (let a = 0; a < o; a++) {
    const c = e.uint32();
    e.uint32();
    const f = e.uint32(), u = e.uint32(), l = oi(e), h = oi(e), g = e.uint16(), p = e.uint16(), d = e.uint8(), x = e.uint8(), m = e.uint8(), y = e.int8();
    i.push({
      colorRef: u,
      hori: l,
      vert: h,
      startGlyphIndex: g,
      endGlyphIndex: p,
      ppemX: d,
      ppemY: x,
      bitDepth: m,
      flags: y,
      indexSubTables: []
    }), r.push({
      indexSubTableArrayOffset: c,
      numberOfIndexSubTables: f
    });
  }
  for (let a = 0; a < o; a++) {
    const { indexSubTableArrayOffset: c, numberOfIndexSubTables: f } = r[a];
    f !== 0 && (i[a].indexSubTables = rh(
      e,
      c,
      f
    ));
  }
  return { majorVersion: n, minorVersion: s, sizes: i };
}
function rh(t, e, n) {
  t.seek(e);
  const s = [];
  for (let i = 0; i < n; i++)
    s.push({
      firstGlyphIndex: t.uint16(),
      lastGlyphIndex: t.uint16(),
      indexSubtableOffset: t.uint32()
    });
  const o = [];
  for (const i of s) {
    const r = e + i.indexSubtableOffset;
    t.seek(r);
    const a = t.uint16(), c = t.uint16(), f = t.uint32(), u = {
      firstGlyphIndex: i.firstGlyphIndex,
      lastGlyphIndex: i.lastGlyphIndex,
      indexFormat: a,
      imageFormat: c,
      imageDataOffset: f
    }, l = i.lastGlyphIndex - i.firstGlyphIndex + 1;
    switch (a) {
      case 1: {
        u.sbitOffsets = t.array("uint32", l + 1);
        break;
      }
      case 2: {
        u.imageSize = t.uint32(), u.bigMetrics = fe(t);
        break;
      }
      case 3: {
        u.sbitOffsets = t.array("uint16", l + 1);
        break;
      }
      case 4: {
        const h = t.uint32();
        u.glyphArray = [];
        for (let g = 0; g <= h; g++)
          u.glyphArray.push({
            glyphID: t.uint16(),
            sbitOffset: t.uint16()
          });
        break;
      }
      case 5: {
        u.imageSize = t.uint32(), u.bigMetrics = fe(t);
        const h = t.uint32();
        u.glyphIdArray = t.array("uint16", h);
        break;
      }
    }
    o.push(u);
  }
  return o;
}
function ah(t, e) {
  const n = t.majorVersion ?? 2, s = t.minorVersion ?? 0, o = t.sizes ?? [], i = o.map(
    (u, l) => ch(u.indexSubTables ?? [], e[l] ?? [])
  );
  let a = 8 + o.length * ha;
  const c = [];
  for (const u of i)
    c.push(a), a += u.length;
  const f = new k(a);
  f.uint16(n), f.uint16(s), f.uint32(o.length);
  for (let u = 0; u < o.length; u++) {
    const l = o[u], h = l.indexSubTables ?? [];
    f.uint32(c[u]), f.uint32(i[u].length), f.uint32(h.length), f.uint32(l.colorRef ?? 0), Dn(f, l.hori ?? {}), Dn(f, l.vert ?? {}), f.uint16(l.startGlyphIndex ?? 0), f.uint16(l.endGlyphIndex ?? 0), f.uint8(l.ppemX ?? 0), f.uint8(l.ppemY ?? 0), f.uint8(l.bitDepth ?? 0), f.int8(l.flags ?? 0);
  }
  for (const u of i)
    f.rawBytes(u);
  return f.toArray();
}
function ch(t, e) {
  const n = t.map(
    (a, c) => fh(a, e[c] ?? {})
  );
  let o = t.length * 8;
  const i = [];
  for (const a of n)
    i.push(o), o += a.length;
  const r = new k(o);
  for (let a = 0; a < t.length; a++)
    r.uint16(t[a].firstGlyphIndex), r.uint16(t[a].lastGlyphIndex), r.uint32(i[a]);
  for (const a of n)
    r.rawBytes(a);
  return r.toArray();
}
function fh(t, e) {
  const n = t.indexFormat, s = t.imageFormat, o = e.imageDataOffset ?? 0, i = 8;
  switch (n) {
    case 1: {
      const r = e.sbitOffsets ?? [], a = new k(i + r.length * 4);
      a.uint16(n), a.uint16(s), a.uint32(o);
      for (const c of r) a.uint32(c);
      return a.toArray();
    }
    case 2: {
      const r = new k(i + 4 + Yt);
      return r.uint16(n), r.uint16(s), r.uint32(o), r.uint32(t.imageSize ?? e.imageSize ?? 0), Ge(r, t.bigMetrics ?? {}), r.toArray();
    }
    case 3: {
      const r = e.sbitOffsets ?? [];
      let a = i + r.length * 2;
      r.length % 2 !== 0 && (a += 2);
      const c = new k(a);
      c.uint16(n), c.uint16(s), c.uint32(o);
      for (const f of r) c.uint16(f);
      return c.toArray();
    }
    case 4: {
      const r = e.glyphArray ?? [], a = r.length > 0 ? r.length - 1 : 0, c = new k(i + 4 + r.length * 4);
      c.uint16(n), c.uint16(s), c.uint32(o), c.uint32(a);
      for (const f of r)
        c.uint16(f.glyphID), c.uint16(f.sbitOffset);
      return c.toArray();
    }
    case 5: {
      const r = t.glyphIdArray ?? [];
      let a = i + 4 + Yt + 4 + r.length * 2;
      r.length % 2 !== 0 && (a += 2);
      const c = new k(a);
      c.uint16(n), c.uint16(s), c.uint32(o), c.uint32(t.imageSize ?? e.imageSize ?? 0), Ge(c, t.bigMetrics ?? {}), c.uint32(r.length);
      for (const f of r) c.uint16(f);
      return c.toArray();
    }
    default:
      throw new Error(`Unsupported index format: ${n}`);
  }
}
function uh(t) {
  const e = t.majorVersion ?? 2, n = t.minorVersion ?? 0, s = t.sizes ?? [], o = t.data ?? [], i = 8 + s.length * ha + o.length, r = new k(i);
  r.uint16(e), r.uint16(n), r.uint32(s.length);
  for (const a of s)
    r.uint32(a.indexSubTableArrayOffset ?? 0), r.uint32(a.indexTablesSize ?? 0), r.uint32(a.numberOfIndexSubTables ?? 0), r.uint32(a.colorRef ?? 0), Dn(r, a.hori ?? {}), Dn(r, a.vert ?? {}), r.uint16(a.startGlyphIndex ?? 0), r.uint16(a.endGlyphIndex ?? 0), r.uint8(a.ppemX ?? 0), r.uint8(a.ppemY ?? 0), r.uint8(a.bitDepth ?? 0), r.int8(a.flags ?? 0);
  return r.rawBytes(o), r.toArray();
}
function oi(t) {
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
function Dn(t, e) {
  t.int8(e.ascender ?? 0), t.int8(e.descender ?? 0), t.uint8(e.widthMax ?? 0), t.int8(e.caretSlopeNumerator ?? 0), t.int8(e.caretSlopeDenominator ?? 0), t.int8(e.caretOffset ?? 0), t.int8(e.minOriginSB ?? 0), t.int8(e.minAdvanceSB ?? 0), t.int8(e.maxBeforeBL ?? 0), t.int8(e.minAfterBL ?? 0), t.int8(e.pad1 ?? 0), t.int8(e.pad2 ?? 0);
}
function lh(t) {
  return mo(t);
}
function hh(t) {
  return de(t);
}
function ph(t) {
  const e = new B(t), n = e.uint16(), s = e.uint16(), o = [], i = /* @__PURE__ */ new Set();
  for (let u = 0; u < s; u++) {
    const l = e.uint16(), h = e.uint16(), g = e.offset32();
    i.add(g), o.push({ platformID: l, encodingID: h, subtableOffset: g });
  }
  const r = [...i].sort((u, l) => u - l), a = r.map((u) => gh(e, u)), c = new Map(r.map((u, l) => [u, l])), f = o.map((u) => ({
    platformID: u.platformID,
    encodingID: u.encodingID,
    subtableIndex: c.get(u.subtableOffset)
  }));
  return { version: n, encodingRecords: f, subtables: a };
}
function gh(t, e) {
  t.seek(e);
  const n = t.uint16();
  switch (n) {
    case 0:
      return dh(t);
    case 2:
      return mh(t, e);
    case 4:
      return yh(t, e);
    case 6:
      return xh(t);
    case 8:
      return kh(t);
    case 10:
      return Ch(t);
    case 12:
      return wh(t);
    case 13:
      return Sh(t);
    case 14:
      return _h(t, e);
    default:
      return Ah(t, e, n);
  }
}
function dh(t) {
  t.skip(2);
  const e = t.uint16(), n = t.array("uint8", 256);
  return { format: 0, language: e, glyphIdArray: n };
}
function mh(t, e) {
  const n = t.uint16(), s = t.uint16(), o = t.array("uint16", 256);
  let i = 0;
  for (let h = 0; h < 256; h++)
    o[h] > i && (i = o[h]);
  const r = i / 8 + 1, a = [];
  for (let h = 0; h < r; h++)
    a.push({
      firstCode: t.uint16(),
      entryCount: t.uint16(),
      idDelta: t.int16(),
      idRangeOffset: t.uint16()
    });
  const c = t.position, u = (e + n - c) / 2, l = t.array("uint16", u);
  return { format: 2, language: s, subHeaderKeys: o, subHeaders: a, glyphIdArray: l };
}
function yh(t, e) {
  const n = t.uint16(), s = t.uint16(), i = t.uint16() / 2;
  t.skip(6);
  const r = t.array("uint16", i);
  t.skip(2);
  const a = t.array("uint16", i), c = t.array("int16", i), f = t.array("uint16", i), u = t.position, l = (n - (u - e)) / 2, h = t.array("uint16", l), g = [];
  for (let p = 0; p < i; p++)
    g.push({
      endCode: r[p],
      startCode: a[p],
      idDelta: c[p],
      idRangeOffset: f[p]
    });
  return { format: 4, language: s, segments: g, glyphIdArray: h };
}
function xh(t) {
  t.skip(2);
  const e = t.uint16(), n = t.uint16(), s = t.uint16(), o = t.array("uint16", s);
  return { format: 6, language: e, firstCode: n, glyphIdArray: o };
}
function wh(t) {
  t.skip(2), t.skip(4);
  const e = t.uint32(), n = t.uint32(), s = [];
  for (let o = 0; o < n; o++)
    s.push({
      startCharCode: t.uint32(),
      endCharCode: t.uint32(),
      startGlyphID: t.uint32()
    });
  return { format: 12, language: e, groups: s };
}
function Sh(t) {
  t.skip(2), t.skip(4);
  const e = t.uint32(), n = t.uint32(), s = [];
  for (let o = 0; o < n; o++)
    s.push({
      startCharCode: t.uint32(),
      endCharCode: t.uint32(),
      glyphID: t.uint32()
    });
  return { format: 13, language: e, groups: s };
}
function _h(t, e) {
  t.skip(4);
  const n = t.uint32(), s = [];
  for (let o = 0; o < n; o++) {
    const i = t.uint24(), r = t.offset32(), a = t.offset32();
    let c = null;
    if (r !== 0) {
      const u = t.position;
      c = bh(t, e + r), t.seek(u);
    }
    let f = null;
    if (a !== 0) {
      const u = t.position;
      f = vh(
        t,
        e + a
      ), t.seek(u);
    }
    s.push({ varSelector: i, defaultUVS: c, nonDefaultUVS: f });
  }
  return { format: 14, varSelectorRecords: s };
}
function bh(t, e) {
  t.seek(e);
  const n = t.uint32(), s = [];
  for (let o = 0; o < n; o++)
    s.push({
      startUnicodeValue: t.uint24(),
      additionalCount: t.uint8()
    });
  return s;
}
function vh(t, e) {
  t.seek(e);
  const n = t.uint32(), s = [];
  for (let o = 0; o < n; o++)
    s.push({
      unicodeValue: t.uint24(),
      glyphID: t.uint16()
    });
  return s;
}
function kh(t) {
  t.skip(2), t.skip(4);
  const e = t.uint32(), n = t.bytes(8192), s = t.uint32(), o = [];
  for (let i = 0; i < s; i++)
    o.push({
      startCharCode: t.uint32(),
      endCharCode: t.uint32(),
      startGlyphID: t.uint32()
    });
  return { format: 8, language: e, is32: n, groups: o };
}
function Ch(t) {
  t.skip(2), t.skip(4);
  const e = t.uint32(), n = t.uint32(), s = t.uint32(), o = t.array("uint16", s);
  return { format: 10, language: e, startCharCode: n, glyphIdArray: o };
}
function Ah(t, e, n) {
  let s;
  n >= 8 ? (t.skip(2), s = t.uint32()) : s = t.uint16(), t.seek(e);
  const o = t.bytes(s);
  return { format: n, _raw: o };
}
function Ih(t) {
  const { version: e, encodingRecords: n, subtables: s } = t, o = s.map(Oh), i = 4 + n.length * 8, r = [];
  let a = i;
  for (const u of o)
    r.push(a), a += u.length;
  const c = a, f = new k(c);
  f.uint16(e), f.uint16(n.length);
  for (const u of n)
    f.uint16(u.platformID), f.uint16(u.encodingID), f.offset32(r[u.subtableIndex]);
  for (let u = 0; u < o.length; u++)
    f.seek(r[u]), f.rawBytes(o[u]);
  return f.toArray();
}
function Oh(t) {
  switch (t.format) {
    case 0:
      return Th(t);
    case 2:
      return Dh(t);
    case 4:
      return Eh(t);
    case 6:
      return Bh(t);
    case 8:
      return Mh(t);
    case 10:
      return Lh(t);
    case 12:
      return Rh(t);
    case 13:
      return Fh(t);
    case 14:
      return Vh(t);
    default:
      return t._raw;
  }
}
function Th(t) {
  const n = new k(262);
  return n.uint16(0), n.uint16(262), n.uint16(t.language), n.array("uint8", t.glyphIdArray), n.toArray();
}
function Dh(t) {
  const { language: e, subHeaderKeys: n, subHeaders: s, glyphIdArray: o } = t, i = 518 + s.length * 8 + o.length * 2, r = new k(i);
  r.uint16(2), r.uint16(i), r.uint16(e), r.array("uint16", n);
  for (const a of s)
    r.uint16(a.firstCode), r.uint16(a.entryCount), r.int16(a.idDelta), r.uint16(a.idRangeOffset);
  return r.array("uint16", o), r.toArray();
}
function Eh(t) {
  const { language: e, segments: n, glyphIdArray: s } = t, o = n.length, i = o * 2, r = Math.floor(Math.log2(o)), a = Math.pow(2, r) * 2, c = i - a, f = 14 + o * 8 + 2 + s.length * 2, u = new k(f);
  u.uint16(4), u.uint16(f), u.uint16(e), u.uint16(i), u.uint16(a), u.uint16(r), u.uint16(c);
  for (const l of n) u.uint16(l.endCode);
  u.uint16(0);
  for (const l of n) u.uint16(l.startCode);
  for (const l of n) u.int16(l.idDelta);
  for (const l of n) u.uint16(l.idRangeOffset);
  return u.array("uint16", s), u.toArray();
}
function Bh(t) {
  const { language: e, firstCode: n, glyphIdArray: s } = t, o = s.length, i = 10 + o * 2, r = new k(i);
  return r.uint16(6), r.uint16(i), r.uint16(e), r.uint16(n), r.uint16(o), r.array("uint16", s), r.toArray();
}
function Mh(t) {
  const { language: e, is32: n, groups: s } = t, o = 8208 + s.length * 12, i = new k(o);
  i.uint16(8), i.uint16(0), i.uint32(o), i.uint32(e), i.rawBytes(n), i.uint32(s.length);
  for (const r of s)
    i.uint32(r.startCharCode), i.uint32(r.endCharCode), i.uint32(r.startGlyphID);
  return i.toArray();
}
function Lh(t) {
  const { language: e, startCharCode: n, glyphIdArray: s } = t, o = 20 + s.length * 2, i = new k(o);
  return i.uint16(10), i.uint16(0), i.uint32(o), i.uint32(e), i.uint32(n), i.uint32(s.length), i.array("uint16", s), i.toArray();
}
function Rh(t) {
  const e = t.groups.length, n = 16 + e * 12, s = new k(n);
  s.uint16(12), s.uint16(0), s.uint32(n), s.uint32(t.language), s.uint32(e);
  for (const o of t.groups)
    s.uint32(o.startCharCode), s.uint32(o.endCharCode), s.uint32(o.startGlyphID);
  return s.toArray();
}
function Fh(t) {
  const e = t.groups.length, n = 16 + e * 12, s = new k(n);
  s.uint16(13), s.uint16(0), s.uint32(n), s.uint32(t.language), s.uint32(e);
  for (const o of t.groups)
    s.uint32(o.startCharCode), s.uint32(o.endCharCode), s.uint32(o.glyphID);
  return s.toArray();
}
function Vh(t) {
  const { varSelectorRecords: e } = t, n = e.map((c) => ({
    defaultUVSBytes: c.defaultUVS ? zh(c.defaultUVS) : null,
    nonDefaultUVSBytes: c.nonDefaultUVS ? Ph(c.nonDefaultUVS) : null
  }));
  let o = 10 + e.length * 11;
  const i = n.map((c) => {
    let f = 0;
    c.defaultUVSBytes && (f = o, o += c.defaultUVSBytes.length);
    let u = 0;
    return c.nonDefaultUVSBytes && (u = o, o += c.nonDefaultUVSBytes.length), { defaultUVSOffset: f, nonDefaultUVSOffset: u };
  }), r = o, a = new k(r);
  a.uint16(14), a.uint32(r), a.uint32(e.length);
  for (let c = 0; c < e.length; c++)
    a.uint24(e[c].varSelector), a.uint32(i[c].defaultUVSOffset), a.uint32(i[c].nonDefaultUVSOffset);
  for (let c = 0; c < n.length; c++)
    n[c].defaultUVSBytes && a.rawBytes(n[c].defaultUVSBytes), n[c].nonDefaultUVSBytes && a.rawBytes(n[c].nonDefaultUVSBytes);
  return a.toArray();
}
function zh(t) {
  const e = 4 + t.length * 4, n = new k(e);
  n.uint32(t.length);
  for (const s of t)
    n.uint24(s.startUnicodeValue), n.uint8(s.additionalCount);
  return n.toArray();
}
function Ph(t) {
  const e = 4 + t.length * 5, n = new k(e);
  n.uint32(t.length);
  for (const s of t)
    n.uint24(s.unicodeValue), n.uint16(s.glyphID);
  return n.toArray();
}
const Fe = [
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
], pa = 15, ga = 48;
function Gh(t, e) {
  return e === 1 ? t.uint8() : e === 2 ? t.uint16() : e === 3 ? t.uint24() : t.uint32();
}
function Uh(t, e, n) {
  n === 1 ? t.uint8(e) : n === 2 ? t.uint16(e) : n === 3 ? t.uint24(e) : t.uint32(e >>> 0);
}
function Nh(t, e) {
  t.seek(e);
  const n = t.uint8(), s = t.uint8(), o = n === 1 ? t.uint32() : t.uint16(), i = (s & pa) + 1, r = ((s & ga) >> 4) + 1, a = [];
  for (let c = 0; c < o; c++) {
    const f = Gh(t, r), u = (1 << i) - 1;
    a.push({
      outerIndex: f >> i,
      innerIndex: f & u
    });
  }
  return { format: n, entryFormat: s, mapCount: o, entries: a };
}
function $h(t) {
  const e = t.entries ?? [], n = t.mapCount ?? e.length, s = t.format ?? (n > 65535 ? 1 : 0);
  let o = 0, i = 0;
  for (const p of e)
    o = Math.max(o, p.innerIndex ?? 0), i = Math.max(i, p.outerIndex ?? 0);
  let r = 1;
  for (; (1 << r) - 1 < o && r < 16; )
    r++;
  const a = i << r | o;
  let c = 1;
  for (; c < 4 && a > (c === 1 ? 255 : c === 2 ? 65535 : 16777215); )
    c++;
  const f = t.entryFormat ?? c - 1 << 4 | r - 1, u = s === 1 ? 6 : 4, l = (f & pa) + 1, h = ((f & ga) >> 4) + 1, g = new k(u + n * h);
  g.uint8(s), g.uint8(f), s === 1 ? g.uint32(n) : g.uint16(n);
  for (let p = 0; p < n; p++) {
    const d = e[p] ?? { outerIndex: 0, innerIndex: 0 }, x = (d.outerIndex ?? 0) << l | (d.innerIndex ?? 0) & (1 << l) - 1;
    Uh(g, x, h);
  }
  return g.toArray();
}
function Hh(t, e) {
  const n = /* @__PURE__ */ new Map(), s = jh(
    t,
    e.baseGlyphListOffset,
    n
  ), o = e.layerListOffset ? Zh(t, e.layerListOffset, n) : null, i = e.clipListOffset ? Wh(t, e.clipListOffset) : null, r = e.varIndexMapOffset ? Nh(t, e.varIndexMapOffset) : null;
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
    baseGlyphPaintRecords: s,
    layerPaints: o,
    clipList: i,
    varIndexMap: r,
    itemVariationStore: a
  };
}
function jh(t, e, n) {
  t.seek(e);
  const s = t.uint32(), o = [], i = [];
  for (let r = 0; r < s; r++)
    i.push({
      glyphID: t.uint16(),
      paintOffset: t.uint32()
    });
  for (const r of i)
    o.push({
      glyphID: r.glyphID,
      paint: tt(t, e + r.paintOffset, n)
    });
  return o;
}
function Zh(t, e, n) {
  t.seek(e);
  const s = t.uint32(), o = [];
  for (let r = 0; r < s; r++)
    o.push(t.uint32());
  const i = [];
  for (const r of o)
    i.push(tt(t, e + r, n));
  return i;
}
function Wh(t, e) {
  t.seek(e);
  const n = t.uint8(), s = t.uint32(), o = [];
  for (let r = 0; r < s; r++)
    o.push({
      startGlyphID: t.uint16(),
      endGlyphID: t.uint16(),
      clipBoxOffset: t.uint24()
    });
  const i = o.map((r) => ({
    startGlyphID: r.startGlyphID,
    endGlyphID: r.endGlyphID,
    clipBox: qh(t, e + r.clipBoxOffset)
  }));
  return { format: n, clips: i };
}
function qh(t, e) {
  t.seek(e);
  const n = t.uint8(), s = t.fword(), o = t.fword(), i = t.fword(), r = t.fword(), a = { format: n, xMin: s, yMin: o, xMax: i, yMax: r };
  return n === 2 && (a.varIndexBase = t.uint32()), a;
}
function yo(t, e, n) {
  t.seek(e);
  const s = t.uint8(), o = t.uint16(), i = [];
  for (let r = 0; r < o; r++) {
    const a = {
      stopOffset: t.f2dot14(),
      paletteIndex: t.uint16(),
      alpha: t.f2dot14()
    };
    n && (a.varIndexBase = t.uint32()), i.push(a);
  }
  return { extend: s, colorStops: i };
}
function Yh(t, e, n) {
  t.seek(e);
  const s = {
    xx: t.fixed(),
    yx: t.fixed(),
    xy: t.fixed(),
    yy: t.fixed(),
    dx: t.fixed(),
    dy: t.fixed()
  };
  return n && (s.varIndexBase = t.uint32()), s;
}
function tt(t, e, n) {
  if (n.has(e)) return n.get(e);
  t.seek(e);
  const s = t.uint8();
  let o;
  switch (s) {
    case 1:
      o = Xh(t);
      break;
    case 2:
      o = ii(t, !1);
      break;
    case 3:
      o = ii(t, !0);
      break;
    case 4:
      o = ri(t, e, !1);
      break;
    case 5:
      o = ri(t, e, !0);
      break;
    case 6:
      o = ai(t, e, !1);
      break;
    case 7:
      o = ai(t, e, !0);
      break;
    case 8:
      o = ci(t, e, !1);
      break;
    case 9:
      o = ci(t, e, !0);
      break;
    case 10:
      o = Kh(t, e, n);
      break;
    case 11:
      o = Jh(t);
      break;
    case 12:
      o = fi(t, e, n, !1);
      break;
    case 13:
      o = fi(t, e, n, !0);
      break;
    case 14:
      o = ui(t, e, n, !1);
      break;
    case 15:
      o = ui(t, e, n, !0);
      break;
    case 16:
      o = li(t, e, n, !1);
      break;
    case 17:
      o = li(t, e, n, !0);
      break;
    case 18:
      o = hi(t, e, n, !1);
      break;
    case 19:
      o = hi(t, e, n, !0);
      break;
    case 20:
      o = pi(t, e, n, !1);
      break;
    case 21:
      o = pi(t, e, n, !0);
      break;
    case 22:
      o = gi(t, e, n, !1);
      break;
    case 23:
      o = gi(t, e, n, !0);
      break;
    case 24:
      o = di(t, e, n, !1);
      break;
    case 25:
      o = di(t, e, n, !0);
      break;
    case 26:
      o = mi(t, e, n, !1);
      break;
    case 27:
      o = mi(t, e, n, !0);
      break;
    case 28:
      o = yi(t, e, n, !1);
      break;
    case 29:
      o = yi(t, e, n, !0);
      break;
    case 30:
      o = xi(t, e, n, !1);
      break;
    case 31:
      o = xi(t, e, n, !0);
      break;
    case 32:
      o = Qh(t, e, n);
      break;
    default:
      return o = { format: s, _unknown: !0 }, n.set(e, o), o;
  }
  return o.format = s, n.set(e, o), o;
}
function Xh(t) {
  return {
    numLayers: t.uint8(),
    firstLayerIndex: t.uint32()
  };
}
function ii(t, e) {
  const n = {
    paletteIndex: t.uint16(),
    alpha: t.f2dot14()
  };
  return e && (n.varIndexBase = t.uint32()), n;
}
function ri(t, e, n) {
  const s = t.uint24(), o = {
    x0: t.fword(),
    y0: t.fword(),
    x1: t.fword(),
    y1: t.fword(),
    x2: t.fword(),
    y2: t.fword()
  };
  return n && (o.varIndexBase = t.uint32()), o.colorLine = yo(t, e + s, n), o;
}
function ai(t, e, n) {
  const s = t.uint24(), o = {
    x0: t.fword(),
    y0: t.fword(),
    radius0: t.ufword(),
    x1: t.fword(),
    y1: t.fword(),
    radius1: t.ufword()
  };
  return n && (o.varIndexBase = t.uint32()), o.colorLine = yo(t, e + s, n), o;
}
function ci(t, e, n) {
  const s = t.uint24(), o = {
    centerX: t.fword(),
    centerY: t.fword(),
    startAngle: t.f2dot14(),
    endAngle: t.f2dot14()
  };
  return n && (o.varIndexBase = t.uint32()), o.colorLine = yo(t, e + s, n), o;
}
function Kh(t, e, n) {
  const s = t.uint24();
  return {
    glyphID: t.uint16(),
    paint: tt(t, e + s, n)
  };
}
function Jh(t) {
  return { glyphID: t.uint16() };
}
function fi(t, e, n, s) {
  const o = t.uint24(), i = t.uint24();
  return {
    paint: tt(t, e + o, n),
    transform: Yh(t, e + i, s)
  };
}
function ui(t, e, n, s) {
  const o = t.uint24(), i = {
    dx: t.fword(),
    dy: t.fword()
  };
  return s && (i.varIndexBase = t.uint32()), i.paint = tt(t, e + o, n), i;
}
function li(t, e, n, s) {
  const o = t.uint24(), i = {
    scaleX: t.f2dot14(),
    scaleY: t.f2dot14()
  };
  return s && (i.varIndexBase = t.uint32()), i.paint = tt(t, e + o, n), i;
}
function hi(t, e, n, s) {
  const o = t.uint24(), i = {
    scaleX: t.f2dot14(),
    scaleY: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return s && (i.varIndexBase = t.uint32()), i.paint = tt(t, e + o, n), i;
}
function pi(t, e, n, s) {
  const o = t.uint24(), i = { scale: t.f2dot14() };
  return s && (i.varIndexBase = t.uint32()), i.paint = tt(t, e + o, n), i;
}
function gi(t, e, n, s) {
  const o = t.uint24(), i = {
    scale: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return s && (i.varIndexBase = t.uint32()), i.paint = tt(t, e + o, n), i;
}
function di(t, e, n, s) {
  const o = t.uint24(), i = { angle: t.f2dot14() };
  return s && (i.varIndexBase = t.uint32()), i.paint = tt(t, e + o, n), i;
}
function mi(t, e, n, s) {
  const o = t.uint24(), i = {
    angle: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return s && (i.varIndexBase = t.uint32()), i.paint = tt(t, e + o, n), i;
}
function yi(t, e, n, s) {
  const o = t.uint24(), i = {
    xSkewAngle: t.f2dot14(),
    ySkewAngle: t.f2dot14()
  };
  return s && (i.varIndexBase = t.uint32()), i.paint = tt(t, e + o, n), i;
}
function xi(t, e, n, s) {
  const o = t.uint24(), i = {
    xSkewAngle: t.f2dot14(),
    ySkewAngle: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return s && (i.varIndexBase = t.uint32()), i.paint = tt(t, e + o, n), i;
}
function Qh(t, e, n) {
  const s = t.uint24(), o = t.uint8(), i = t.uint24();
  return {
    sourcePaint: tt(t, e + s, n),
    compositeMode: o,
    backdropPaint: tt(t, e + i, n)
  };
}
function t0(t) {
  const {
    baseGlyphPaintRecords: e,
    layerPaints: n,
    clipList: s,
    varIndexMap: o,
    itemVariationStore: i
  } = t, r = /* @__PURE__ */ new Map(), a = [];
  function c(D) {
    if (!(!D || r.has(D))) {
      r.set(D, a.length), a.push(D);
      for (const E of Vs(D))
        c(E);
    }
  }
  if (e)
    for (const D of e)
      c(D.paint);
  if (n)
    for (const D of n)
      c(D);
  const f = e0(a), u = /* @__PURE__ */ new Map();
  for (const D of f)
    u.set(D, n0(D));
  const l = /* @__PURE__ */ new Map();
  let h = 0;
  for (const D of f)
    l.set(D, h), h += u.get(D);
  const g = h, p = e ? e.length : 0, d = 4 + p * 6, x = n ? n.length : 0, m = x > 0 ? 4 + x * 4 : 0, y = s ? i0(s) : [], _ = o ? $h(o) : [], w = i ? Qt(i) : [], S = d + m + g + y.length + _.length + w.length, b = 0, v = d, I = d + m, A = I + g, C = A + y.length, O = C + _.length, T = new k(S);
  T.uint32(p);
  for (const D of e || [])
    T.uint16(D.glyphID), T.uint32(I - b + l.get(D.paint));
  if (x > 0) {
    T.uint32(x);
    for (const D of n)
      T.uint32(I - v + l.get(D));
  }
  for (const D of f)
    s0(
      T,
      D,
      I + l.get(D),
      l,
      I
    );
  return T.rawBytes(y), T.rawBytes(_), T.rawBytes(w), {
    bodyBytes: T.toArray(),
    bglBodyOffset: b,
    llBodyOffset: x > 0 ? v : 0,
    clipBodyOffset: y.length > 0 ? A : 0,
    dimBodyOffset: _.length > 0 ? C : 0,
    ivsBodyOffset: w.length > 0 ? O : 0
  };
}
function Vs(t) {
  if (!t) return [];
  const e = [];
  return t.paint && e.push(t.paint), t.sourcePaint && e.push(t.sourcePaint), t.backdropPaint && e.push(t.backdropPaint), e;
}
function e0(t, e) {
  const n = /* @__PURE__ */ new Map();
  for (const a of t) n.set(a, 0);
  for (const a of t)
    for (const c of Vs(a))
      n.has(c) && n.set(c, n.get(c) + 1);
  const s = [];
  let o = 0;
  for (const a of t)
    n.get(a) === 0 && s.push(a);
  const i = [], r = /* @__PURE__ */ new Set();
  for (; o < s.length; ) {
    const a = s[o++];
    i.push(a), r.add(a);
    for (const c of Vs(a)) {
      if (!n.has(c)) continue;
      const f = n.get(c) - 1;
      n.set(c, f), f === 0 && s.push(c);
    }
  }
  for (const a of t)
    r.has(a) || i.push(a);
  return i;
}
function n0(t) {
  const e = Fe[t.format] || 0, n = t.format;
  return n === 4 || n === 6 || n === 8 ? e + wi(t.colorLine, !1) : n === 5 || n === 7 || n === 9 ? e + wi(t.colorLine, !0) : n === 12 ? e + 24 : n === 13 ? e + 28 : e;
}
function wi(t, e) {
  if (!t) return 0;
  const n = e ? 10 : 6;
  return 3 + t.colorStops.length * n;
}
function s0(t, e, n, s, o) {
  const i = e.format;
  switch (t.uint8(i), i) {
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
      const r = Fe[i];
      t.uint24(r), t.fword(e.x0), t.fword(e.y0), t.fword(e.x1), t.fword(e.y1), t.fword(e.x2), t.fword(e.y2), i === 5 && t.uint32(e.varIndexBase), us(t, e.colorLine, i === 5);
      break;
    }
    case 6:
    // PaintRadialGradient
    case 7: {
      const r = Fe[i];
      t.uint24(r), t.fword(e.x0), t.fword(e.y0), t.ufword(e.radius0), t.fword(e.x1), t.fword(e.y1), t.ufword(e.radius1), i === 7 && t.uint32(e.varIndexBase), us(t, e.colorLine, i === 7);
      break;
    }
    case 8:
    // PaintSweepGradient
    case 9: {
      const r = Fe[i];
      t.uint24(r), t.fword(e.centerX), t.fword(e.centerY), t.f2dot14(e.startAngle), t.f2dot14(e.endAngle), i === 9 && t.uint32(e.varIndexBase), us(t, e.colorLine, i === 9);
      break;
    }
    case 10: {
      const r = o + s.get(e.paint);
      t.uint24(r - n), t.uint16(e.glyphID);
      break;
    }
    case 11:
      t.uint16(e.glyphID);
      break;
    case 12:
    // PaintTransform
    case 13: {
      const r = o + s.get(e.paint), a = Fe[i];
      t.uint24(r - n), t.uint24(a), o0(t, e.transform, i === 13);
      break;
    }
    case 14:
    // PaintTranslate
    case 15: {
      const r = o + s.get(e.paint);
      t.uint24(r - n), t.fword(e.dx), t.fword(e.dy), i === 15 && t.uint32(e.varIndexBase);
      break;
    }
    case 16:
    // PaintScale
    case 17: {
      const r = o + s.get(e.paint);
      t.uint24(r - n), t.f2dot14(e.scaleX), t.f2dot14(e.scaleY), i === 17 && t.uint32(e.varIndexBase);
      break;
    }
    case 18:
    // PaintScaleAroundCenter
    case 19: {
      const r = o + s.get(e.paint);
      t.uint24(r - n), t.f2dot14(e.scaleX), t.f2dot14(e.scaleY), t.fword(e.centerX), t.fword(e.centerY), i === 19 && t.uint32(e.varIndexBase);
      break;
    }
    case 20:
    // PaintScaleUniform
    case 21: {
      const r = o + s.get(e.paint);
      t.uint24(r - n), t.f2dot14(e.scale), i === 21 && t.uint32(e.varIndexBase);
      break;
    }
    case 22:
    // PaintScaleUniformAroundCenter
    case 23: {
      const r = o + s.get(e.paint);
      t.uint24(r - n), t.f2dot14(e.scale), t.fword(e.centerX), t.fword(e.centerY), i === 23 && t.uint32(e.varIndexBase);
      break;
    }
    case 24:
    // PaintRotate
    case 25: {
      const r = o + s.get(e.paint);
      t.uint24(r - n), t.f2dot14(e.angle), i === 25 && t.uint32(e.varIndexBase);
      break;
    }
    case 26:
    // PaintRotateAroundCenter
    case 27: {
      const r = o + s.get(e.paint);
      t.uint24(r - n), t.f2dot14(e.angle), t.fword(e.centerX), t.fword(e.centerY), i === 27 && t.uint32(e.varIndexBase);
      break;
    }
    case 28:
    // PaintSkew
    case 29: {
      const r = o + s.get(e.paint);
      t.uint24(r - n), t.f2dot14(e.xSkewAngle), t.f2dot14(e.ySkewAngle), i === 29 && t.uint32(e.varIndexBase);
      break;
    }
    case 30:
    // PaintSkewAroundCenter
    case 31: {
      const r = o + s.get(e.paint);
      t.uint24(r - n), t.f2dot14(e.xSkewAngle), t.f2dot14(e.ySkewAngle), t.fword(e.centerX), t.fword(e.centerY), i === 31 && t.uint32(e.varIndexBase);
      break;
    }
    case 32: {
      const r = o + s.get(e.sourcePaint), a = o + s.get(e.backdropPaint);
      t.uint24(r - n), t.uint8(e.compositeMode), t.uint24(a - n);
      break;
    }
  }
}
function us(t, e, n) {
  t.uint8(e.extend), t.uint16(e.colorStops.length);
  for (const s of e.colorStops)
    t.f2dot14(s.stopOffset), t.uint16(s.paletteIndex), t.f2dot14(s.alpha), n && t.uint32(s.varIndexBase);
}
function o0(t, e, n) {
  t.fixed(e.xx), t.fixed(e.yx), t.fixed(e.xy), t.fixed(e.yy), t.fixed(e.dx), t.fixed(e.dy), n && t.uint32(e.varIndexBase);
}
function i0(t) {
  if (!t || !t.clips || t.clips.length === 0) return [];
  const e = [];
  for (const a of t.clips)
    e.push(r0(a.clipBox));
  let s = 5 + t.clips.length * 7;
  const o = [];
  for (const a of e)
    o.push(s), s += a.length;
  const i = s, r = new k(i);
  r.uint8(t.format || 1), r.uint32(t.clips.length);
  for (let a = 0; a < t.clips.length; a++)
    r.uint16(t.clips[a].startGlyphID), r.uint16(t.clips[a].endGlyphID), r.uint24(o[a]);
  for (const a of e)
    r.rawBytes(a);
  return r.toArray();
}
function r0(t) {
  const e = t.format === 2 ? 13 : 9, n = new k(e);
  return n.uint8(t.format), n.fword(t.xMin), n.fword(t.yMin), n.fword(t.xMax), n.fword(t.yMax), t.format === 2 && n.uint32(t.varIndexBase), n.toArray();
}
function a0(t) {
  const e = new B(t), n = e.uint16(), s = e.uint16(), o = e.uint32(), i = e.uint32(), r = e.uint16(), a = [];
  if (s > 0 && o > 0) {
    e.seek(o);
    for (let u = 0; u < s; u++)
      a.push({
        glyphID: e.uint16(),
        firstLayerIndex: e.uint16(),
        numLayers: e.uint16()
      });
  }
  const c = [];
  if (r > 0 && i > 0) {
    e.seek(i);
    for (let u = 0; u < r; u++)
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
    const u = e.uint32(), l = e.uint32(), h = e.uint32(), g = e.uint32(), p = e.uint32(), x = Hh(e, {
      baseGlyphListOffset: u,
      layerListOffset: l,
      clipListOffset: h,
      varIndexMapOffset: g,
      itemVariationStoreOffset: p
    });
    f.baseGlyphPaintRecords = x.baseGlyphPaintRecords, f.layerPaints = x.layerPaints, f.clipList = x.clipList, f.varIndexMap = x.varIndexMap, f.itemVariationStore = x.itemVariationStore;
  }
  return f;
}
function c0(t) {
  const { baseGlyphRecords: e, layerRecords: n } = t;
  if (t.version >= 1 && t.baseGlyphPaintRecords) {
    const l = e.length * 6, h = n.length * 4, d = 14 + 20, x = l + h, m = d + x, y = t0({
      baseGlyphPaintRecords: t.baseGlyphPaintRecords,
      layerPaints: t.layerPaints,
      clipList: t.clipList,
      varIndexMap: t.varIndexMap,
      itemVariationStore: t.itemVariationStore
    }), _ = y.bodyBytes, w = m + y.bglBodyOffset, S = y.llBodyOffset ? m + y.llBodyOffset : 0, b = y.clipBodyOffset ? m + y.clipBodyOffset : 0, v = y.dimBodyOffset ? m + y.dimBodyOffset : 0, I = y.ivsBodyOffset ? m + y.ivsBodyOffset : 0, A = m + _.length, C = new k(A);
    C.uint16(t.version), C.uint16(e.length), C.uint32(e.length > 0 ? d : 0), C.uint32(n.length > 0 ? d + l : 0), C.uint16(n.length), C.uint32(w), C.uint32(S), C.uint32(b), C.uint32(v), C.uint32(I);
    for (const O of e)
      C.uint16(O.glyphID), C.uint16(O.firstLayerIndex), C.uint16(O.numLayers);
    for (const O of n)
      C.uint16(O.glyphID), C.uint16(O.paletteIndex);
    return C.rawBytes(_), C.toArray();
  }
  const s = 14, o = e.length > 0 ? s : 0, i = e.length * 6, r = n.length > 0 ? s + i : 0, a = n.length * 4, c = s + i + a, f = new k(c);
  f.uint16(t.version), f.uint16(e.length), f.uint32(o), f.uint32(r), f.uint16(n.length);
  for (const u of e)
    f.uint16(u.glyphID), f.uint16(u.firstLayerIndex), f.uint16(u.numLayers);
  for (const u of n)
    f.uint16(u.glyphID), f.uint16(u.paletteIndex);
  return f.toArray();
}
function f0(t) {
  const e = new B(t), n = e.uint16(), s = e.uint16(), o = e.uint16(), i = e.uint16(), r = e.uint32(), a = [];
  for (let p = 0; p < o; p++)
    a.push(e.uint16());
  let c = 0, f = 0, u = 0;
  n >= 1 && (c = e.uint32(), f = e.uint32(), u = e.uint32()), e.seek(r);
  const l = [];
  for (let p = 0; p < i; p++)
    l.push({
      blue: e.uint8(),
      green: e.uint8(),
      red: e.uint8(),
      alpha: e.uint8()
    });
  const h = [];
  for (let p = 0; p < o; p++) {
    const d = a[p], x = [];
    for (let m = 0; m < s; m++)
      x.push({ ...l[d + m] });
    h.push(x);
  }
  const g = {
    version: n,
    numPaletteEntries: s,
    palettes: h
  };
  if (n >= 1 && c !== 0) {
    e.seek(c), g.paletteTypes = [];
    for (let p = 0; p < o; p++)
      g.paletteTypes.push(e.uint32());
  }
  if (n >= 1 && f !== 0) {
    e.seek(f), g.paletteLabels = [];
    for (let p = 0; p < o; p++)
      g.paletteLabels.push(e.uint16());
  }
  if (n >= 1 && u !== 0) {
    e.seek(u), g.paletteEntryLabels = [];
    for (let p = 0; p < s; p++)
      g.paletteEntryLabels.push(e.uint16());
  }
  return g;
}
function u0(t) {
  const { version: e, numPaletteEntries: n, palettes: s } = t, o = s.length, i = [], r = [];
  for (let y = 0; y < o; y++) {
    i.push(r.length);
    for (let _ = 0; _ < n; _++)
      r.push(s[y][_]);
  }
  const a = r.length, c = 12 + o * 2, f = e >= 1 ? 12 : 0, u = c + f, l = a * 4;
  let h = u + l, g = 0, p = 0, d = 0;
  e >= 1 && t.paletteTypes && (g = h, h += o * 4), e >= 1 && t.paletteLabels && (p = h, h += o * 2), e >= 1 && t.paletteEntryLabels && (d = h, h += n * 2);
  const x = h, m = new k(x);
  m.uint16(e), m.uint16(n), m.uint16(o), m.uint16(a), m.uint32(u);
  for (let y = 0; y < o; y++)
    m.uint16(i[y]);
  e >= 1 && (m.uint32(g), m.uint32(p), m.uint32(d));
  for (const y of r)
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
const l0 = 8, h0 = 12;
function p0(t) {
  const e = new B(t), n = e.uint32(), s = e.uint16(), o = e.uint16(), i = [];
  for (let a = 0; a < s; a++)
    i.push({
      format: e.uint32(),
      length: e.uint32(),
      offset: e.offset32()
    });
  const r = i.map((a) => {
    const c = a.offset, f = Math.min(t.length, c + a.length);
    return c <= 0 || c >= t.length || f < c ? { ...a, _raw: [] } : {
      ...a,
      _raw: Array.from(t.slice(c, f))
    };
  });
  return {
    version: n,
    flags: o,
    signatures: r
  };
}
function g0(t) {
  const e = t.version ?? 1, n = t.flags ?? 0, o = (t.signatures ?? []).map((c) => {
    const f = d0(c);
    return {
      format: c.format ?? 1,
      bytes: f
    };
  });
  let i = l0 + o.length * h0;
  const r = o.map((c) => {
    const f = {
      format: c.format,
      length: c.bytes.length,
      offset: c.bytes.length ? i : 0
    };
    return i += c.bytes.length, f;
  }), a = new k(i);
  a.uint32(e), a.uint16(o.length), a.uint16(n);
  for (const c of r)
    a.uint32(c.format), a.uint32(c.length), a.offset32(c.offset);
  for (const c of o)
    a.rawBytes(c.bytes);
  return a.toArray();
}
function d0(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
function m0(t, e) {
  return po(t, e?.EBLC ? { CBLC: e.EBLC } : e);
}
function y0(t) {
  return go(t);
}
function x0(t) {
  return mo(t);
}
function w0(t) {
  return de(t);
}
const zs = 28;
function S0(t) {
  const e = new B(t), n = e.uint32(), s = e.uint32(), o = [];
  for (let i = 0; i < s; i++) {
    const r = e.position;
    o.push({
      hori: Si(e),
      vert: Si(e),
      substitutePpemX: e.uint8(),
      substitutePpemY: e.uint8(),
      originalPpemX: e.uint8(),
      originalPpemY: e.uint8(),
      _raw: Array.from(t.slice(r, r + zs))
    });
  }
  return { version: n, scales: o };
}
function _0(t) {
  const e = t.version ?? 131072, n = t.scales ?? [], s = new k(8 + n.length * zs);
  s.uint32(e), s.uint32(n.length);
  for (const o of n) {
    if (o._raw && o._raw.length === zs) {
      s.rawBytes(o._raw);
      continue;
    }
    _i(s, o.hori ?? {}), _i(s, o.vert ?? {}), s.uint8(o.substitutePpemX ?? 0), s.uint8(o.substitutePpemY ?? 0), s.uint8(o.originalPpemX ?? 0), s.uint8(o.originalPpemY ?? 0);
  }
  return s.toArray();
}
function Si(t) {
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
function _i(t, e) {
  t.int8(e.ascender ?? 0), t.int8(e.descender ?? 0), t.uint8(e.widthMax ?? 0), t.int8(e.caretSlopeNumerator ?? 0), t.int8(e.caretSlopeDenominator ?? 0), t.int8(e.caretOffset ?? 0), t.int8(e.minOriginSB ?? 0), t.int8(e.minAdvanceSB ?? 0), t.int8(e.maxBeforeBL ?? 0), t.int8(e.minAfterBL ?? 0), t.int8(e.pad1 ?? 0), t.int8(e.pad2 ?? 0);
}
const bi = 16, b0 = 20;
function v0(t) {
  const e = new B(t), n = e.uint16(), s = e.uint16(), o = e.offset16(), i = e.uint16(), r = e.uint16(), a = e.uint16(), c = e.uint16(), f = e.uint16(), u = [];
  for (let d = 0; d < r; d++)
    e.seek(o + d * a), u.push({
      axisTag: e.tag(),
      minValue: e.fixed(),
      defaultValue: e.fixed(),
      maxValue: e.fixed(),
      flags: e.uint16(),
      axisNameID: e.uint16()
    });
  const l = [], h = o + r * a, g = 4 + r * 4, p = f >= g + 2;
  for (let d = 0; d < c; d++) {
    e.seek(h + d * f);
    const x = {
      subfamilyNameID: e.uint16(),
      flags: e.uint16(),
      coordinates: []
    };
    for (let m = 0; m < r; m++)
      x.coordinates.push(e.fixed());
    p && (x.postScriptNameID = e.uint16()), l.push(x);
  }
  return {
    majorVersion: n,
    minorVersion: s,
    reserved: i,
    axisSize: a,
    instanceSize: f,
    axes: u,
    instances: l
  };
}
function k0(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, s = t.reserved ?? 2, o = t.axes ?? [], i = t.instances ?? [], r = o.length, a = b0, c = 4 + r * 4, f = i.some(
    (d) => d.postScriptNameID !== void 0
  ), u = f ? c + 2 : c, l = i.length, h = bi, g = bi + r * a + l * u, p = new k(g);
  p.uint16(e), p.uint16(n), p.offset16(h), p.uint16(s), p.uint16(r), p.uint16(a), p.uint16(l), p.uint16(u);
  for (const d of o)
    p.tag(d.axisTag), p.fixed(d.minValue), p.fixed(d.defaultValue), p.fixed(d.maxValue), p.uint16(d.flags ?? 0), p.uint16(d.axisNameID ?? 0);
  for (const d of i) {
    p.uint16(d.subfamilyNameID ?? 0), p.uint16(d.flags ?? 0);
    for (let x = 0; x < r; x++)
      p.fixed(d.coordinates?.[x] ?? 0);
    f && p.uint16(d.postScriptNameID ?? 65535);
  }
  return p.toArray();
}
function C0(t) {
  const e = new B(t), n = e.uint16(), s = e.uint16(), o = e.uint16(), i = e.uint16(), r = e.uint16(), a = e.uint16();
  let c = 0;
  s >= 2 && (c = e.uint16());
  let f = 0;
  s >= 3 && (f = e.uint32());
  const u = { majorVersion: n, minorVersion: s };
  return o !== 0 && (u.glyphClassDef = Lt(e, o)), i !== 0 && (u.attachList = A0(e, i)), r !== 0 && (u.ligCaretList = I0(e, r)), a !== 0 && (u.markAttachClassDef = Lt(e, a)), c !== 0 && (u.markGlyphSetsDef = T0(
    e,
    c
  )), f !== 0 && (u.itemVarStoreOffset = f, u.itemVariationStore = Pt(
    t.slice(f)
  )), u;
}
function A0(t, e) {
  t.seek(e);
  const n = t.uint16(), s = t.uint16(), o = t.array("uint16", s), i = z(t, e + n), r = o.map((a) => {
    t.seek(e + a);
    const c = t.uint16();
    return t.array("uint16", c);
  });
  return { coverage: i, attachPoints: r };
}
function I0(t, e) {
  t.seek(e);
  const n = t.uint16(), s = t.uint16(), o = t.array("uint16", s), i = z(t, e + n), r = o.map(
    (a) => O0(t, e + a)
  );
  return { coverage: i, ligGlyphs: r };
}
function O0(t, e) {
  t.seek(e);
  const n = t.uint16();
  return t.array("uint16", n).map((o) => {
    const i = e + o;
    t.seek(i);
    const r = t.uint16();
    if (r === 1)
      return { format: r, coordinate: t.int16() };
    if (r === 2)
      return { format: r, caretValuePointIndex: t.uint16() };
    if (r === 3) {
      const a = t.int16(), c = t.uint16(), f = c !== 0 ? _e(t, i + c) : null;
      return { format: r, coordinate: a, device: f };
    }
    throw new Error(`Unknown CaretValue format: ${r}`);
  });
}
function T0(t, e) {
  t.seek(e);
  const n = t.uint16(), s = t.uint16(), o = [];
  for (let r = 0; r < s; r++)
    o.push(t.uint32());
  const i = o.map(
    (r) => z(t, e + r)
  );
  return { format: n, coverages: i };
}
function D0(t) {
  const { majorVersion: e, minorVersion: n } = t, s = t.glyphClassDef ? Rt(t.glyphClassDef) : null, o = t.attachList ? E0(t.attachList) : null, i = t.ligCaretList ? M0(t.ligCaretList) : null, r = t.markAttachClassDef ? Rt(t.markAttachClassDef) : null, a = n >= 2 && t.markGlyphSetsDef ? F0(t.markGlyphSetsDef) : null, c = n >= 3 && t.itemVariationStore ? Qt(t.itemVariationStore) : null;
  let f = 12;
  n >= 2 && (f += 2), n >= 3 && (f += 4);
  let u = f;
  const l = s ? u : 0;
  s && (u += s.length);
  const h = o ? u : 0;
  o && (u += o.length);
  const g = i ? u : 0;
  i && (u += i.length);
  const p = r ? u : 0;
  r && (u += r.length);
  const d = a ? u : 0;
  a && (u += a.length);
  const x = c ? u : 0;
  c && (u += c.length);
  const m = new k(u);
  return m.uint16(e), m.uint16(n), m.uint16(l), m.uint16(h), m.uint16(g), m.uint16(p), n >= 2 && m.uint16(d), n >= 3 && m.uint32(x), s && (m.seek(l), m.rawBytes(s)), o && (m.seek(h), m.rawBytes(o)), i && (m.seek(g), m.rawBytes(i)), r && (m.seek(p), m.rawBytes(r)), a && (m.seek(d), m.rawBytes(a)), c && (m.seek(x), m.rawBytes(c)), m.toArray();
}
function E0(t) {
  const e = G(t.coverage), n = t.attachPoints.map(B0);
  let o = 4 + t.attachPoints.length * 2;
  const i = o;
  o += e.length;
  const r = n.map((c) => {
    const f = o;
    return o += c.length, f;
  }), a = new k(o);
  a.uint16(i), a.uint16(t.attachPoints.length), a.array("uint16", r), a.seek(i), a.rawBytes(e);
  for (let c = 0; c < n.length; c++)
    a.seek(r[c]), a.rawBytes(n[c]);
  return a.toArray();
}
function B0(t) {
  const e = 2 + t.length * 2, n = new k(e);
  return n.uint16(t.length), n.array("uint16", t), n.toArray();
}
function M0(t) {
  const e = G(t.coverage), n = t.ligGlyphs.map(L0);
  let o = 4 + t.ligGlyphs.length * 2;
  const i = o;
  o += e.length;
  const r = n.map((c) => {
    const f = o;
    return o += c.length, f;
  }), a = new k(o);
  a.uint16(i), a.uint16(t.ligGlyphs.length), a.array("uint16", r), a.seek(i), a.rawBytes(e);
  for (let c = 0; c < n.length; c++)
    a.seek(r[c]), a.rawBytes(n[c]);
  return a.toArray();
}
function L0(t) {
  const e = t.map(R0);
  let s = 2 + t.length * 2;
  const o = e.map((r) => {
    const a = s;
    return s += r.length, a;
  }), i = new k(s);
  i.uint16(t.length), i.array("uint16", o);
  for (let r = 0; r < e.length; r++)
    i.seek(o[r]), i.rawBytes(e[r]);
  return i.toArray();
}
function R0(t) {
  if (t.format === 1) {
    const e = new k(4);
    return e.uint16(1), e.int16(t.coordinate), e.toArray();
  }
  if (t.format === 2) {
    const e = new k(4);
    return e.uint16(2), e.uint16(t.caretValuePointIndex), e.toArray();
  }
  if (t.format === 3) {
    const e = t.device ? Tn(t.device) : null, n = 6 + (e ? e.length : 0), s = new k(n);
    return s.uint16(3), s.int16(t.coordinate), s.uint16(e ? 6 : 0), e && s.rawBytes(e), s.toArray();
  }
  throw new Error(`Unknown CaretValue format: ${t.format}`);
}
function F0(t) {
  const e = t.coverages.map(G);
  let s = 4 + t.coverages.length * 4;
  const o = e.map((r) => {
    const a = s;
    return s += r.length, a;
  }), i = new k(s);
  i.uint16(t.format), i.uint16(t.coverages.length);
  for (const r of o) i.uint32(r);
  for (let r = 0; r < e.length; r++)
    i.seek(o[r]), i.rawBytes(e[r]);
  return i.toArray();
}
function Bt(t) {
  let e = 0, n = t;
  for (; n; )
    e += n & 1, n >>>= 1;
  return e * 2;
}
function ue(t, e, n) {
  if (e === 0) return null;
  const s = t.position, o = {};
  e & 1 && (o.xPlacement = t.int16()), e & 2 && (o.yPlacement = t.int16()), e & 4 && (o.xAdvance = t.int16()), e & 8 && (o.yAdvance = t.int16());
  const i = e & 16 ? t.uint16() : 0, r = e & 32 ? t.uint16() : 0, a = e & 64 ? t.uint16() : 0, c = e & 128 ? t.uint16() : 0, f = t.position, u = (l, h) => {
    const g = n + l, p = s + l;
    try {
      return _e(t, g);
    } catch (d) {
      if (p !== g)
        try {
          return _e(t, p);
        } catch {
        }
      const x = d instanceof Error ? d.message : String(d);
      throw new Error(
        `${x}; ValueRecord context: valueFormat=${e}, subtableOffset=${n}, valueRecordStart=${s}, offsets={xPla:${i},yPla:${r},xAdv:${a},yAdv:${c}}, field=${h}`
      );
    }
  };
  return i && (o.xPlaDevice = u(i, "xPlaDevice"), t.seek(f)), r && (o.yPlaDevice = u(r, "yPlaDevice"), t.seek(f)), a && (o.xAdvDevice = u(a, "xAdvDevice"), t.seek(f)), c && (o.yAdvDevice = u(c, "yAdvDevice"), t.seek(f)), o;
}
function be(t, e) {
  if (e === 0) return null;
  t.seek(e);
  const n = t.uint16(), s = t.int16(), o = t.int16(), i = { format: n, xCoordinate: s, yCoordinate: o };
  if (n === 2)
    i.anchorPoint = t.uint16();
  else if (n === 3) {
    const r = t.uint16(), a = t.uint16();
    r && (i.xDevice = _e(t, e + r)), a && (i.yDevice = _e(t, e + a));
  }
  return i;
}
function xo(t, e) {
  t.seek(e);
  const n = t.uint16(), s = [];
  for (let o = 0; o < n; o++) {
    const i = t.uint16(), r = t.uint16();
    s.push({ markClass: i, anchorOffset: r });
  }
  return s.map((o) => ({
    markClass: o.markClass,
    markAnchor: be(t, e + o.anchorOffset)
  }));
}
function V0(t) {
  const e = new B(t), n = e.uint16(), s = e.uint16(), o = e.uint16(), i = e.uint16(), r = e.uint16();
  let a = 0;
  s >= 1 && (a = e.uint32());
  const c = {
    majorVersion: n,
    minorVersion: s,
    scriptList: Yr(e, o),
    featureList: Kr(e, i),
    lookupList: ea(e, r, da, 9)
  };
  return a !== 0 && (c.featureVariations = ua(
    e,
    a
  )), c;
}
function da(t, e, n) {
  switch (n) {
    case 1:
      return z0(t, e);
    case 2:
      return P0(t, e);
    case 3:
      return G0(t, e);
    case 4:
      return U0(t, e);
    case 5:
      return N0(t, e);
    case 6:
      return $0(t, e);
    case 7:
      return sa(t, e);
    case 8:
      return ra(t, e);
    case 9:
      return H0(t, e);
    default:
      throw new Error(`Unknown GPOS lookup type: ${n}`);
  }
}
function z0(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const s = t.uint16(), o = t.uint16(), i = ue(t, o, e), r = z(t, e + s);
    return { format: n, coverage: r, valueFormat: o, valueRecord: i };
  }
  if (n === 2) {
    const s = t.uint16(), o = t.uint16(), i = t.uint16(), r = [];
    for (let c = 0; c < i; c++)
      r.push(ue(t, o, e));
    const a = z(t, e + s);
    return { format: n, coverage: a, valueFormat: o, valueCount: i, valueRecords: r };
  }
  throw new Error(`Unknown SinglePos format: ${n}`);
}
function P0(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const s = t.uint16(), o = t.uint16(), i = t.uint16(), r = t.uint16(), c = t.array("uint16", r).map((u) => {
      const l = e + u;
      t.seek(l);
      const h = t.uint16(), g = [];
      for (let p = 0; p < h; p++) {
        const d = t.uint16(), x = ue(t, o, l), m = ue(t, i, l);
        g.push({ secondGlyph: d, value1: x, value2: m });
      }
      return g;
    }), f = z(t, e + s);
    return {
      format: n,
      coverage: f,
      valueFormat1: o,
      valueFormat2: i,
      pairSets: c
    };
  }
  if (n === 2) {
    const s = t.uint16(), o = t.uint16(), i = t.uint16(), r = t.uint16(), a = t.uint16(), c = t.uint16(), f = t.uint16(), u = [];
    for (let p = 0; p < c; p++) {
      const d = [];
      for (let x = 0; x < f; x++) {
        const m = ue(t, o, e), y = ue(t, i, e);
        d.push({ value1: m, value2: y });
      }
      u.push(d);
    }
    const l = z(t, e + s), h = Lt(t, e + r), g = Lt(t, e + a);
    return {
      format: n,
      coverage: l,
      valueFormat1: o,
      valueFormat2: i,
      classDef1: h,
      classDef2: g,
      class1Count: c,
      class2Count: f,
      class1Records: u
    };
  }
  throw new Error(`Unknown PairPos format: ${n}`);
}
function G0(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown CursivePos format: ${n}`);
  const s = t.uint16(), o = t.uint16(), i = [];
  for (let c = 0; c < o; c++) {
    const f = t.uint16(), u = t.uint16();
    i.push({ entryAnchorOff: f, exitAnchorOff: u });
  }
  const r = z(t, e + s), a = i.map((c) => ({
    entryAnchor: c.entryAnchorOff ? be(t, e + c.entryAnchorOff) : null,
    exitAnchor: c.exitAnchorOff ? be(t, e + c.exitAnchorOff) : null
  }));
  return { format: n, coverage: r, entryExitRecords: a };
}
function U0(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown MarkBasePos format: ${n}`);
  const s = t.uint16(), o = t.uint16(), i = t.uint16(), r = t.uint16(), a = t.uint16(), c = z(t, e + s), f = z(t, e + o), u = xo(t, e + r);
  t.seek(e + a);
  const l = t.uint16(), h = [];
  for (let p = 0; p < l; p++) {
    const d = t.array("uint16", i);
    h.push(d);
  }
  const g = h.map(
    (p) => p.map(
      (d) => d ? be(t, e + a + d) : null
    )
  );
  return {
    format: n,
    markCoverage: c,
    baseCoverage: f,
    markClassCount: i,
    markArray: u,
    baseArray: g
  };
}
function N0(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown MarkLigPos format: ${n}`);
  const s = t.uint16(), o = t.uint16(), i = t.uint16(), r = t.uint16(), a = t.uint16(), c = z(t, e + s), f = z(t, e + o), u = xo(t, e + r);
  t.seek(e + a);
  const l = t.uint16(), g = t.array("uint16", l).map((p) => {
    const d = e + a + p;
    t.seek(d);
    const x = t.uint16(), m = [];
    for (let y = 0; y < x; y++) {
      const _ = t.array("uint16", i);
      m.push(_);
    }
    return m.map(
      (y) => y.map((_) => _ ? be(t, d + _) : null)
    );
  });
  return {
    format: n,
    markCoverage: c,
    ligatureCoverage: f,
    markClassCount: i,
    markArray: u,
    ligatureArray: g
  };
}
function $0(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown MarkMarkPos format: ${n}`);
  const s = t.uint16(), o = t.uint16(), i = t.uint16(), r = t.uint16(), a = t.uint16(), c = z(t, e + s), f = z(t, e + o), u = xo(t, e + r);
  t.seek(e + a);
  const l = t.uint16(), h = [];
  for (let p = 0; p < l; p++) {
    const d = t.array("uint16", i);
    h.push(d);
  }
  const g = h.map(
    (p) => p.map(
      (d) => d ? be(t, e + a + d) : null
    )
  );
  return {
    format: n,
    mark1Coverage: c,
    mark2Coverage: f,
    markClassCount: i,
    mark1Array: u,
    mark2Array: g
  };
}
function H0(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown ExtensionPos format: ${n}`);
  const s = t.uint16(), o = t.uint32(), i = da(
    t,
    e + o,
    s
  );
  return { format: n, extensionLookupType: s, extensionOffset: o, subtable: i };
}
function le(t, e, n) {
  if (!e) return [];
  const s = new k(Bt(e));
  return e & 1 && s.int16(t ? t.xPlacement ?? 0 : 0), e & 2 && s.int16(t ? t.yPlacement ?? 0 : 0), e & 4 && s.int16(t ? t.xAdvance ?? 0 : 0), e & 8 && s.int16(t ? t.yAdvance ?? 0 : 0), e & 16 && (t?.xPlaDevice && n.push({ field: s.position, device: t.xPlaDevice }), s.uint16(0)), e & 32 && (t?.yPlaDevice && n.push({ field: s.position, device: t.yPlaDevice }), s.uint16(0)), e & 64 && (t?.xAdvDevice && n.push({ field: s.position, device: t.xAdvDevice }), s.uint16(0)), e & 128 && (t?.yAdvDevice && n.push({ field: s.position, device: t.yAdvDevice }), s.uint16(0)), s.toArray();
}
function He(t) {
  if (!t) return [];
  const { format: e, xCoordinate: n, yCoordinate: s } = t;
  if (e === 1) {
    const o = new k(6);
    return o.uint16(1), o.int16(n), o.int16(s), o.toArray();
  }
  if (e === 2) {
    const o = new k(8);
    return o.uint16(2), o.int16(n), o.int16(s), o.uint16(t.anchorPoint), o.toArray();
  }
  if (e === 3) {
    const o = t.xDevice ? Tn(t.xDevice) : null, i = t.yDevice ? Tn(t.yDevice) : null;
    let a = 10;
    const c = o ? a : 0;
    o && (a += o.length);
    const f = i ? a : 0;
    i && (a += i.length);
    const u = new k(a);
    return u.uint16(3), u.int16(n), u.int16(s), u.uint16(c), u.uint16(f), o && (u.seek(c), u.rawBytes(o)), i && (u.seek(f), u.rawBytes(i)), u.toArray();
  }
  throw new Error(`Unknown Anchor format: ${e}`);
}
function wo(t) {
  const e = t.map((r) => He(r.markAnchor));
  let s = 2 + t.length * 4;
  const o = e.map((r) => {
    if (!r.length) return 0;
    const a = s;
    return s += r.length, a;
  }), i = new k(s);
  i.uint16(t.length);
  for (let r = 0; r < t.length; r++)
    i.uint16(t[r].markClass), i.uint16(o[r]);
  for (let r = 0; r < e.length; r++)
    e[r].length && (i.seek(o[r]), i.rawBytes(e[r]));
  return i.toArray();
}
function j0(t) {
  const { majorVersion: e, minorVersion: n } = t, s = Z0(t), o = Xr(s.scriptList), i = Qr(s.featureList), r = na(
    s.lookupList,
    ma,
    9
  ), a = s.featureVariations ? la(s.featureVariations) : null;
  let c = 10;
  n >= 1 && (c += 4);
  let f = c;
  const u = f;
  f += o.length;
  const l = f;
  f += i.length;
  const h = f;
  f += r.length;
  const g = a ? f : 0;
  a && (f += a.length);
  const p = new k(f);
  return p.uint16(e), p.uint16(n), p.uint16(u), p.uint16(l), p.uint16(h), n >= 1 && p.uint32(g), p.seek(u), p.rawBytes(o), p.seek(l), p.rawBytes(i), p.seek(h), p.rawBytes(r), a && (p.seek(g), p.rawBytes(a)), p.toArray();
}
function Z0(t) {
  const e = t.lookupList.lookups.map((n) => {
    if (n.lookupType !== 2 || !Array.isArray(n.subtables))
      return n;
    const s = n.subtables.flatMap((o) => o?.format !== 1 || !Array.isArray(o.pairSets) ? [o] : W0(o));
    return {
      ...n,
      subtables: s
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
function W0(t) {
  const e = q0(t.coverage);
  if (e.length !== t.pairSets.length)
    return [t];
  const n = Bt(t.valueFormat1) + Bt(t.valueFormat2), s = t.pairSets.map(
    (c) => 2 + c.length * (2 + n)
  ), o = s.reduce((c, f) => c + f, 0);
  if (vi(
    t.pairSets.length,
    o
  ) <= 65535)
    return [t];
  const r = [];
  let a = 0;
  for (; a < t.pairSets.length; ) {
    let c = a, f = 0, u = !1;
    for (; c < t.pairSets.length; ) {
      const l = f + s[c], h = c - a + 1;
      if (vi(
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
    r.push({
      ...t,
      coverage: {
        format: 1,
        glyphs: e.slice(a, c)
      },
      pairSets: t.pairSets.slice(a, c)
    }), a = c;
  }
  return r;
}
function vi(t, e) {
  const n = 10 + t * 2, s = 4 + t * 2;
  return n + s + e;
}
function q0(t) {
  if (!t)
    return [];
  if (t.format === 1)
    return t.glyphs;
  if (t.format === 2) {
    const e = [];
    for (const n of t.ranges)
      for (let s = n.startGlyphID; s <= n.endGlyphID; s++)
        e.push(s);
    return e;
  }
  return [];
}
function ma(t, e) {
  switch (e) {
    case 1:
      return Y0(t);
    case 2:
      return X0(t);
    case 3:
      return K0(t);
    case 4:
      return J0(t);
    case 5:
      return Q0(t);
    case 6:
      return ep(t);
    case 7:
      return oa(t);
    case 8:
      return ca(t);
    case 9:
      return np(t);
    default:
      throw new Error(`Unknown GPOS lookup type: ${e}`);
  }
}
function Y0(t) {
  const e = G(t.coverage), n = [];
  if (t.format === 1) {
    const s = le(
      t.valueRecord,
      t.valueFormat,
      n
    ), i = 6 + s.length, r = i + e.length, a = new k(r);
    return a.uint16(1), a.uint16(i), a.uint16(t.valueFormat), a.rawBytes(s), a.seek(i), a.rawBytes(e), a.toArray();
  }
  if (t.format === 2) {
    const s = Bt(t.valueFormat), o = t.valueRecords.map(
      (f) => le(f, t.valueFormat, n)
    ), r = 8 + o.length * s, a = r + e.length, c = new k(a);
    c.uint16(2), c.uint16(r), c.uint16(t.valueFormat), c.uint16(t.valueCount);
    for (const f of o) c.rawBytes(f);
    return c.seek(r), c.rawBytes(e), c.toArray();
  }
  throw new Error(`Unknown SinglePos format: ${t.format}`);
}
function X0(t) {
  const e = G(t.coverage), n = [];
  if (t.format === 1) {
    const s = t.pairSets.map((f) => {
      const u = Bt(t.valueFormat1), l = Bt(t.valueFormat2), h = 2 + u + l, g = new k(2 + f.length * h);
      g.uint16(f.length);
      for (const p of f)
        g.uint16(p.secondGlyph), g.rawBytes(
          le(p.value1, t.valueFormat1, n)
        ), g.rawBytes(
          le(p.value2, t.valueFormat2, n)
        );
      return g.toArray();
    });
    let i = 10 + t.pairSets.length * 2;
    const r = i;
    i += e.length;
    const a = s.map((f) => {
      const u = i;
      return i += f.length, u;
    }), c = new k(i);
    c.uint16(1), c.uint16(r), c.uint16(t.valueFormat1), c.uint16(t.valueFormat2), c.uint16(t.pairSets.length), c.array("uint16", a), c.seek(r), c.rawBytes(e);
    for (let f = 0; f < s.length; f++)
      c.seek(a[f]), c.rawBytes(s[f]);
    return c.toArray();
  }
  if (t.format === 2) {
    const s = Rt(t.classDef1), o = Rt(t.classDef2), i = Bt(t.valueFormat1), r = Bt(t.valueFormat2), a = i + r;
    let u = 16 + t.class1Count * t.class2Count * a;
    const l = u;
    u += e.length;
    const h = u;
    u += s.length;
    const g = u;
    u += o.length;
    const p = new k(u);
    p.uint16(2), p.uint16(l), p.uint16(t.valueFormat1), p.uint16(t.valueFormat2), p.uint16(h), p.uint16(g), p.uint16(t.class1Count), p.uint16(t.class2Count);
    for (const d of t.class1Records)
      for (const x of d)
        p.rawBytes(
          le(x.value1, t.valueFormat1, n)
        ), p.rawBytes(
          le(x.value2, t.valueFormat2, n)
        );
    return p.seek(l), p.rawBytes(e), p.seek(h), p.rawBytes(s), p.seek(g), p.rawBytes(o), p.toArray();
  }
  throw new Error(`Unknown PairPos format: ${t.format}`);
}
function K0(t) {
  const e = G(t.coverage), n = t.entryExitRecords.map((c) => ({
    entry: c.entryAnchor ? He(c.entryAnchor) : null,
    exit: c.exitAnchor ? He(c.exitAnchor) : null
  }));
  let o = 6 + t.entryExitRecords.length * 4;
  const i = o;
  o += e.length;
  const r = n.map((c) => {
    const f = c.entry ? o : 0;
    c.entry && (o += c.entry.length);
    const u = c.exit ? o : 0;
    return c.exit && (o += c.exit.length), { entryOff: f, exitOff: u };
  }), a = new k(o);
  a.uint16(1), a.uint16(i), a.uint16(t.entryExitRecords.length);
  for (const c of r)
    a.uint16(c.entryOff), a.uint16(c.exitOff);
  a.seek(i), a.rawBytes(e);
  for (let c = 0; c < n.length; c++)
    n[c].entry && (a.seek(r[c].entryOff), a.rawBytes(n[c].entry)), n[c].exit && (a.seek(r[c].exitOff), a.rawBytes(n[c].exit));
  return a.toArray();
}
function J0(t) {
  const e = G(t.markCoverage), n = G(t.baseCoverage), s = wo(t.markArray), o = ya(t.baseArray);
  let r = 12;
  const a = r;
  r += e.length;
  const c = r;
  r += n.length;
  const f = r;
  r += s.length;
  const u = r;
  r += o.length;
  const l = new k(r);
  return l.uint16(1), l.uint16(a), l.uint16(c), l.uint16(t.markClassCount), l.uint16(f), l.uint16(u), l.seek(a), l.rawBytes(e), l.seek(c), l.rawBytes(n), l.seek(f), l.rawBytes(s), l.seek(u), l.rawBytes(o), l.toArray();
}
function ya(t) {
  const e = t.length > 0 ? t[0].length : 0, n = t.map((a) => a.map(He));
  let o = 2 + t.length * e * 2;
  const i = n.map(
    (a) => a.map((c) => {
      if (!c.length) return 0;
      const f = o;
      return o += c.length, f;
    })
  ), r = new k(o);
  r.uint16(t.length);
  for (let a = 0; a < t.length; a++)
    for (let c = 0; c < e; c++)
      r.uint16(i[a][c]);
  for (let a = 0; a < n.length; a++)
    for (let c = 0; c < e; c++)
      n[a][c].length && (r.seek(i[a][c]), r.rawBytes(n[a][c]));
  return r.toArray();
}
function Q0(t) {
  const e = G(t.markCoverage), n = G(t.ligatureCoverage), s = wo(t.markArray), o = tp(t.ligatureArray, t.markClassCount);
  let r = 12;
  const a = r;
  r += e.length;
  const c = r;
  r += n.length;
  const f = r;
  r += s.length;
  const u = r;
  r += o.length;
  const l = new k(r);
  return l.uint16(1), l.uint16(a), l.uint16(c), l.uint16(t.markClassCount), l.uint16(f), l.uint16(u), l.seek(a), l.rawBytes(e), l.seek(c), l.rawBytes(n), l.seek(f), l.rawBytes(s), l.seek(u), l.rawBytes(o), l.toArray();
}
function tp(t, e) {
  const n = t.map((a) => {
    const c = a.map((g) => g.map(He));
    let u = 2 + a.length * e * 2;
    const l = c.map(
      (g) => g.map((p) => {
        if (!p.length) return 0;
        const d = u;
        return u += p.length, d;
      })
    ), h = new k(u);
    h.uint16(a.length);
    for (let g = 0; g < a.length; g++)
      for (let p = 0; p < e; p++)
        h.uint16(l[g][p]);
    for (let g = 0; g < c.length; g++)
      for (let p = 0; p < e; p++)
        c[g][p].length && (h.seek(l[g][p]), h.rawBytes(c[g][p]));
    return h.toArray();
  });
  let o = 2 + t.length * 2;
  const i = n.map((a) => {
    const c = o;
    return o += a.length, c;
  }), r = new k(o);
  r.uint16(t.length), r.array("uint16", i);
  for (let a = 0; a < n.length; a++)
    r.seek(i[a]), r.rawBytes(n[a]);
  return r.toArray();
}
function ep(t) {
  const e = G(t.mark1Coverage), n = G(t.mark2Coverage), s = wo(t.mark1Array), o = ya(t.mark2Array);
  let r = 12;
  const a = r;
  r += e.length;
  const c = r;
  r += n.length;
  const f = r;
  r += s.length;
  const u = r;
  r += o.length;
  const l = new k(r);
  return l.uint16(1), l.uint16(a), l.uint16(c), l.uint16(t.markClassCount), l.uint16(f), l.uint16(u), l.seek(a), l.rawBytes(e), l.seek(c), l.rawBytes(n), l.seek(f), l.rawBytes(s), l.seek(u), l.rawBytes(o), l.toArray();
}
function np(t) {
  const e = ma(t.subtable, t.extensionLookupType), n = 8, s = new k(n + e.length);
  return s.uint16(1), s.uint16(t.extensionLookupType), s.uint32(n), s.rawBytes(e), s.toArray();
}
function sp(t) {
  const e = new B(t), n = e.uint16(), s = e.uint16(), o = e.uint16(), i = e.uint16(), r = e.uint16();
  let a = 0;
  s >= 1 && (a = e.uint32());
  const c = {
    majorVersion: n,
    minorVersion: s,
    scriptList: Yr(e, o),
    featureList: Kr(e, i),
    lookupList: ea(e, r, xa, 7)
  };
  return a !== 0 && (c.featureVariations = ua(
    e,
    a
  )), c;
}
function xa(t, e, n) {
  switch (n) {
    case 1:
      return op(t, e);
    case 2:
      return ip(t, e);
    case 3:
      return rp(t, e);
    case 4:
      return ap(t, e);
    case 5:
      return sa(t, e);
    case 6:
      return ra(t, e);
    case 7:
      return cp(t, e);
    case 8:
      return fp(t, e);
    default:
      throw new Error(`Unknown GSUB lookup type: ${n}`);
  }
}
function op(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const s = t.uint16(), o = t.int16(), i = z(t, e + s);
    return { format: n, coverage: i, deltaGlyphID: o };
  }
  if (n === 2) {
    const s = t.uint16(), o = t.uint16(), i = t.array("uint16", o), r = z(t, e + s);
    return { format: n, coverage: r, substituteGlyphIDs: i };
  }
  throw new Error(`Unknown SingleSubst format: ${n}`);
}
function ip(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown MultipleSubst format: ${n}`);
  const s = t.uint16(), o = t.uint16(), i = t.array("uint16", o), r = z(t, e + s), a = i.map((c) => {
    t.seek(e + c);
    const f = t.uint16();
    return t.array("uint16", f);
  });
  return { format: n, coverage: r, sequences: a };
}
function rp(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown AlternateSubst format: ${n}`);
  const s = t.uint16(), o = t.uint16(), i = t.array("uint16", o), r = z(t, e + s), a = i.map((c) => {
    t.seek(e + c);
    const f = t.uint16();
    return t.array("uint16", f);
  });
  return { format: n, coverage: r, alternateSets: a };
}
function ap(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown LigatureSubst format: ${n}`);
  const s = t.uint16(), o = t.uint16(), i = t.array("uint16", o), r = z(t, e + s), a = i.map((c) => {
    const f = e + c;
    t.seek(f);
    const u = t.uint16();
    return t.array("uint16", u).map((h) => {
      t.seek(f + h);
      const g = t.uint16(), p = t.uint16(), d = t.array("uint16", p - 1);
      return { ligatureGlyph: g, componentCount: p, componentGlyphIDs: d };
    });
  });
  return { format: n, coverage: r, ligatureSets: a };
}
function cp(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown ExtensionSubst format: ${n}`);
  const s = t.uint16(), o = t.uint32(), i = xa(
    t,
    e + o,
    s
  );
  return { format: n, extensionLookupType: s, extensionOffset: o, subtable: i };
}
function fp(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1)
    throw new Error(`Unknown ReverseChainSingleSubst format: ${n}`);
  const s = t.uint16(), o = t.uint16(), i = t.array("uint16", o), r = t.uint16(), a = t.array("uint16", r), c = t.uint16(), f = t.array("uint16", c), u = z(t, e + s), l = i.map(
    (g) => z(t, e + g)
  ), h = a.map(
    (g) => z(t, e + g)
  );
  return {
    format: n,
    coverage: u,
    backtrackCoverages: l,
    lookaheadCoverages: h,
    substituteGlyphIDs: f
  };
}
function up(t) {
  const { majorVersion: e, minorVersion: n } = t, s = Xr(t.scriptList), o = Qr(t.featureList), i = na(
    t.lookupList,
    wa,
    7
  ), r = t.featureVariations ? la(t.featureVariations) : null;
  let a = 10;
  n >= 1 && (a += 4);
  let c = a;
  const f = c;
  c += s.length;
  const u = c;
  c += o.length;
  const l = c;
  c += i.length;
  const h = r ? c : 0;
  r && (c += r.length);
  const g = new k(c);
  return g.uint16(e), g.uint16(n), g.uint16(f), g.uint16(u), g.uint16(l), n >= 1 && g.uint32(h), g.seek(f), g.rawBytes(s), g.seek(u), g.rawBytes(o), g.seek(l), g.rawBytes(i), r && (g.seek(h), g.rawBytes(r)), g.toArray();
}
function wa(t, e) {
  switch (e) {
    case 1:
      return lp(t);
    case 2:
      return hp(t);
    case 3:
      return pp(t);
    case 4:
      return gp(t);
    case 5:
      return oa(t);
    case 6:
      return ca(t);
    case 7:
      return mp(t);
    case 8:
      return yp(t);
    default:
      throw new Error(`Unknown GSUB lookup type: ${e}`);
  }
}
function lp(t) {
  const e = G(t.coverage);
  if (t.format === 1) {
    const o = new k(6 + e.length);
    return o.uint16(1), o.uint16(6), o.int16(t.deltaGlyphID), o.seek(6), o.rawBytes(e), o.toArray();
  }
  if (t.format === 2) {
    const n = 6 + t.substituteGlyphIDs.length * 2, s = n, o = new k(n + e.length);
    return o.uint16(2), o.uint16(s), o.uint16(t.substituteGlyphIDs.length), o.array("uint16", t.substituteGlyphIDs), o.seek(s), o.rawBytes(e), o.toArray();
  }
  throw new Error(`Unknown SingleSubst format: ${t.format}`);
}
function hp(t) {
  const e = G(t.coverage), n = t.sequences.map((c) => {
    const f = new k(2 + c.length * 2);
    return f.uint16(c.length), f.array("uint16", c), f.toArray();
  });
  let o = 6 + t.sequences.length * 2;
  const i = o;
  o += e.length;
  const r = n.map((c) => {
    const f = o;
    return o += c.length, f;
  }), a = new k(o);
  a.uint16(1), a.uint16(i), a.uint16(t.sequences.length), a.array("uint16", r), a.seek(i), a.rawBytes(e);
  for (let c = 0; c < n.length; c++)
    a.seek(r[c]), a.rawBytes(n[c]);
  return a.toArray();
}
function pp(t) {
  const e = G(t.coverage), n = t.alternateSets.map((c) => {
    const f = new k(2 + c.length * 2);
    return f.uint16(c.length), f.array("uint16", c), f.toArray();
  });
  let o = 6 + t.alternateSets.length * 2;
  const i = o;
  o += e.length;
  const r = n.map((c) => {
    const f = o;
    return o += c.length, f;
  }), a = new k(o);
  a.uint16(1), a.uint16(i), a.uint16(t.alternateSets.length), a.array("uint16", r), a.seek(i), a.rawBytes(e);
  for (let c = 0; c < n.length; c++)
    a.seek(r[c]), a.rawBytes(n[c]);
  return a.toArray();
}
function gp(t) {
  const e = G(t.coverage), n = t.ligatureSets.map(dp);
  let o = 6 + t.ligatureSets.length * 2;
  const i = o;
  o += e.length;
  const r = n.map((c) => {
    const f = o;
    return o += c.length, f;
  }), a = new k(o);
  a.uint16(1), a.uint16(i), a.uint16(t.ligatureSets.length), a.array("uint16", r), a.seek(i), a.rawBytes(e);
  for (let c = 0; c < n.length; c++)
    a.seek(r[c]), a.rawBytes(n[c]);
  return a.toArray();
}
function dp(t) {
  const e = t.map((r) => {
    const a = 4 + (r.componentCount - 1) * 2, c = new k(a);
    return c.uint16(r.ligatureGlyph), c.uint16(r.componentCount), c.array("uint16", r.componentGlyphIDs), c.toArray();
  });
  let s = 2 + t.length * 2;
  const o = e.map((r) => {
    const a = s;
    return s += r.length, a;
  }), i = new k(s);
  i.uint16(t.length), i.array("uint16", o);
  for (let r = 0; r < e.length; r++)
    i.seek(o[r]), i.rawBytes(e[r]);
  return i.toArray();
}
function mp(t) {
  const e = wa(t.subtable, t.extensionLookupType), n = 8, s = new k(n + e.length);
  return s.uint16(1), s.uint16(t.extensionLookupType), s.uint32(n), s.rawBytes(e), s.toArray();
}
function yp(t) {
  const e = G(t.coverage), n = t.backtrackCoverages.map(G), s = t.lookaheadCoverages.map(G);
  let i = 6 + t.backtrackCoverages.length * 2 + 2 + t.lookaheadCoverages.length * 2 + 2 + t.substituteGlyphIDs.length * 2;
  const r = i;
  i += e.length;
  const a = n.map((u) => {
    const l = i;
    return i += u.length, l;
  }), c = s.map((u) => {
    const l = i;
    return i += u.length, l;
  }), f = new k(i);
  f.uint16(1), f.uint16(r), f.uint16(t.backtrackCoverages.length), f.array("uint16", a), f.uint16(t.lookaheadCoverages.length), f.array("uint16", c), f.uint16(t.substituteGlyphIDs.length), f.array("uint16", t.substituteGlyphIDs), f.seek(r), f.rawBytes(e);
  for (let u = 0; u < n.length; u++)
    f.seek(a[u]), f.rawBytes(n[u]);
  for (let u = 0; u < s.length; u++)
    f.seek(c[u]), f.rawBytes(s[u]);
  return f.toArray();
}
const xp = 8;
function wp(t, e) {
  const n = new B(t), s = n.uint16(), o = n.uint16(), i = n.uint32(), r = e?.maxp?.numGlyphs, a = [];
  for (let c = 0; c < o && !(n.position + i > t.length || i < 2); c++) {
    const u = n.uint8(), l = n.uint8(), h = i - 2, g = typeof r == "number" ? Math.min(r, h) : h, p = n.bytes(g), d = h - g, x = d > 0 ? n.bytes(d) : [];
    a.push({
      pixelSize: u,
      maxWidth: l,
      widths: p,
      padding: x
    });
  }
  return {
    version: s,
    numRecords: o,
    sizeDeviceRecord: i,
    records: a
  };
}
function Sp(t) {
  const e = t.version ?? 0, n = t.records ?? [], s = Math.max(
    0,
    ...n.map((f) => (f.widths ?? []).length)
  ), o = _p(2 + s), i = t.sizeDeviceRecord ?? o, r = Math.max(2, i), a = xp + r * n.length, c = new k(a);
  c.uint16(e), c.uint16(n.length), c.uint32(r);
  for (const f of n) {
    c.uint8(f.pixelSize ?? 0), c.uint8(f.maxWidth ?? 0);
    const u = r - 2, l = (f.widths ?? []).slice(0, u), h = f.padding ?? [], g = l.concat(h).slice(0, u);
    for (; g.length < u; )
      g.push(0);
    c.rawBytes(g);
  }
  return c.toArray();
}
function _p(t) {
  return t + (4 - t % 4) % 4;
}
const bp = 54;
function Ps(t) {
  const e = new B(t);
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
function Sa(t) {
  const e = new k(bp);
  return e.uint16(t.majorVersion), e.uint16(t.minorVersion), e.fixed(t.fontRevision), e.uint32(t.checksumAdjustment), e.uint32(t.magicNumber), e.uint16(t.flags), e.uint16(t.unitsPerEm), e.longDateTime(t.created), e.longDateTime(t.modified), e.int16(t.xMin), e.int16(t.yMin), e.int16(t.xMax), e.int16(t.yMax), e.uint16(t.macStyle), e.uint16(t.lowestRecPPEM), e.int16(t.fontDirectionHint), e.int16(t.indexToLocFormat), e.int16(t.glyphDataFormat), e.toArray();
}
const vp = 36;
function kp(t) {
  const e = new B(t);
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
function Cp(t) {
  const e = new k(vp);
  return e.uint16(t.majorVersion), e.uint16(t.minorVersion), e.fword(t.ascender), e.fword(t.descender), e.fword(t.lineGap), e.ufword(t.advanceWidthMax), e.fword(t.minLeftSideBearing), e.fword(t.minRightSideBearing), e.fword(t.xMaxExtent), e.int16(t.caretSlopeRise), e.int16(t.caretSlopeRun), e.int16(t.caretOffset), e.int16(t.reserved1), e.int16(t.reserved2), e.int16(t.reserved3), e.int16(t.reserved4), e.int16(t.metricDataFormat), e.uint16(t.numberOfHMetrics), e.toArray();
}
function Ap(t, e) {
  const n = e.hhea.numberOfHMetrics, s = e.maxp.numGlyphs, o = new B(t), i = [];
  for (let c = 0; c < n; c++)
    i.push({
      advanceWidth: o.ufword(),
      lsb: o.fword()
    });
  const r = s - n, a = o.array("fword", r);
  return { hMetrics: i, leftSideBearings: a };
}
function Ip(t) {
  const { hMetrics: e, leftSideBearings: n } = t, s = e.length * 4 + n.length * 2, o = new k(s);
  for (const i of e)
    o.ufword(i.advanceWidth), o.fword(i.lsb);
  return o.array("fword", n), o.toArray();
}
const Op = 20, _a = 15, ba = 48;
function Tp(t) {
  const e = new B(t), n = e.uint16(), s = e.uint16(), o = e.offset32(), i = e.offset32(), r = e.offset32(), a = e.offset32();
  return {
    majorVersion: n,
    minorVersion: s,
    itemVariationStore: o ? Pt(
      t.slice(
        o,
        va(t.length, o, [
          i,
          r,
          a
        ])
      )
    ) : null,
    advanceWidthMapping: ls(
      t,
      i,
      [o, r, a]
    ),
    lsbMapping: ls(t, r, [
      o,
      i,
      a
    ]),
    rsbMapping: ls(t, a, [
      o,
      i,
      r
    ])
  };
}
function ls(t, e, n) {
  if (!e)
    return null;
  const s = va(t.length, e, n);
  if (s <= e || e >= t.length)
    return { format: 0, entryFormat: 0, mapCount: 0, entries: [], _raw: [] };
  const o = Array.from(t.slice(e, s));
  return {
    ...Dp(o),
    _raw: o
  };
}
function va(t, e, n) {
  return n.filter((o) => o > e).sort((o, i) => o - i)[0] ?? t;
}
function Dp(t) {
  const e = new B(t), n = e.uint8(), s = e.uint8(), o = n === 1 ? e.uint32() : e.uint16(), i = (s & _a) + 1, r = ((s & ba) >> 4) + 1, a = [];
  for (let c = 0; c < o; c++) {
    const f = Vp(e, r);
    a.push(Lp(f, i));
  }
  return {
    format: n,
    entryFormat: s,
    mapCount: o,
    entries: a
  };
}
function Ep(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, s = t.itemVariationStore ? Qt(t.itemVariationStore) : [], o = hs(
    t.advanceWidthMapping
  ), i = hs(t.lsbMapping), r = hs(t.rsbMapping);
  let a = Op;
  const c = s.length ? a : 0;
  a += s.length;
  const f = o.length ? a : 0;
  a += o.length;
  const u = i.length ? a : 0;
  a += i.length;
  const l = r.length ? a : 0;
  a += r.length;
  const h = new k(a);
  return h.uint16(e), h.uint16(n), h.offset32(c), h.offset32(f), h.offset32(u), h.offset32(l), h.rawBytes(s), h.rawBytes(o), h.rawBytes(i), h.rawBytes(r), h.toArray();
}
function hs(t) {
  return t ? t._raw ? t._raw : Bp(t) : [];
}
function Bp(t) {
  const e = t.entries ?? [], n = t.mapCount ?? e.length, s = Rp(e), o = t.format ?? (n > 65535 ? 1 : 0), i = t.entryFormat ?? s.entryFormat, r = (i & _a) + 1, a = ((i & ba) >> 4) + 1, c = o === 1 ? 6 : 4, f = new k(c + n * a);
  f.uint8(o), f.uint8(i), o === 1 ? f.uint32(n) : f.uint16(n);
  for (let u = 0; u < n; u++) {
    const l = e[u] ?? { outerIndex: 0, innerIndex: 0 }, h = Mp(l, r);
    zp(f, h, a);
  }
  return f.toArray();
}
function Mp(t, e) {
  const n = (1 << e) - 1;
  return (t.outerIndex ?? 0) << e | (t.innerIndex ?? 0) & n;
}
function Lp(t, e) {
  const n = (1 << e) - 1;
  return {
    outerIndex: t >> e,
    innerIndex: t & n
  };
}
function Rp(t) {
  let e = 0, n = 0;
  for (const a of t)
    e = Math.max(e, a.innerIndex ?? 0), n = Math.max(n, a.outerIndex ?? 0);
  let s = 1;
  for (; (1 << s) - 1 < e && s < 16; )
    s++;
  const o = n << s | e;
  let i = 1;
  for (; i < 4 && o > Fp(i); )
    i++;
  return { entryFormat: i - 1 << 4 | s - 1 };
}
function Fp(t) {
  return t === 1 ? 255 : t === 2 ? 65535 : t === 3 ? 16777215 : 4294967295;
}
function Vp(t, e) {
  return e === 1 ? t.uint8() : e === 2 ? t.uint16() : e === 3 ? t.uint24() : t.uint32();
}
function zp(t, e, n) {
  n === 1 ? t.uint8(e) : n === 2 ? t.uint16(e) : n === 3 ? t.uint24(e) : t.uint32(e >>> 0);
}
const Pp = 6, Gp = 6;
function Up(t) {
  const e = new B(t), n = e.uint16(), s = e.uint16(), o = e.uint16(), i = [];
  for (let c = 0; c < o; c++)
    i.push({
      tag: e.tag(),
      offset: e.offset16()
    });
  const r = i.map((c) => c.offset).filter((c) => c > 0), a = i.map((c) => ({
    ...c,
    table: $p(t, c.offset, r)
  }));
  return {
    majorVersion: n,
    minorVersion: s,
    scripts: a
  };
}
function Np(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, s = t.scripts ?? [], o = s.map((c) => Hp(c.table));
  let i = Pp + s.length * Gp;
  const r = o.map((c) => {
    if (!c.length)
      return 0;
    const f = i;
    return i += c.length, f;
  }), a = new k(i);
  a.uint16(e), a.uint16(n), a.uint16(s.length);
  for (let c = 0; c < s.length; c++) {
    const u = (s[c].tag ?? "    ").slice(0, 4).padEnd(4, " ");
    a.tag(u), a.offset16(r[c]);
  }
  for (const c of o)
    a.rawBytes(c);
  return a.toArray();
}
function $p(t, e, n) {
  if (!e)
    return null;
  const o = n.filter((i) => i > e).sort((i, r) => i - r)[0] ?? t.length;
  return o <= e || e >= t.length ? { _raw: [] } : { _raw: Array.from(t.slice(e, o)) };
}
function Hp(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
const ka = 4, kn = 6, Ca = 8, Cn = 8;
function jp(t) {
  const e = new B(t);
  return (t.length >= 4 ? e.uint32() : 0) === 65536 ? Xp(t) : Zp(t);
}
function Zp(t) {
  const e = new B(t), n = e.uint16(), s = e.uint16(), o = [];
  let i = ka;
  for (let r = 0; r < s && !(i + kn > t.length); r++) {
    e.seek(i);
    const a = e.uint16(), c = e.uint16(), f = e.uint16(), u = f >> 8 & 255, l = Math.min(
      t.length,
      i + Math.max(c, kn)
    ), h = i + kn, g = Array.from(t.slice(h, l)), p = {
      version: a,
      coverage: f,
      format: u
    };
    u === 0 ? Object.assign(p, Aa(g)) : u === 2 ? Object.assign(p, Ia(g)) : p._raw = g, o.push(p), i = l;
  }
  return {
    formatVariant: "opentype",
    version: n,
    nTables: s,
    subtables: o
  };
}
function Aa(t) {
  const e = new B(t);
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
  const s = [];
  for (let c = 0; c < n && !(e.position + 6 > t.length); c++)
    s.push({
      left: e.uint16(),
      right: e.uint16(),
      value: e.int16()
    });
  const o = s.length, i = Math.floor(
    Math.log2(Math.max(1, o))
  ), r = Math.pow(2, i) * 6, a = o * 6 - r;
  return {
    nPairs: o,
    searchRange: r,
    entrySelector: i,
    rangeShift: a,
    pairs: s
  };
}
function Wp(t) {
  return Aa(t);
}
function Ia(t) {
  const e = new B(t);
  if (t.length < 8) return { _raw: t };
  const n = e.uint16(), s = e.uint16(), o = e.uint16(), i = e.uint16(), r = ki(e, t, s), a = ki(
    e,
    t,
    o
  ), c = n > 0 ? n / 2 : 0, f = n > 0 && r.maxOffset >= i ? Math.floor((r.maxOffset - i) / n) + 1 : 1, u = [];
  for (let l = 0; l < f; l++) {
    const h = [], g = i + l * n;
    for (let p = 0; p < c; p++) {
      const d = g + p * 2;
      d + 2 <= t.length ? (e.seek(d), h.push(e.int16())) : h.push(0);
    }
    u.push(h);
  }
  return {
    rowWidth: n,
    leftOffsetTable: s,
    rightOffsetTable: o,
    kerningArrayOffset: i,
    leftClassTable: r,
    rightClassTable: a,
    nLeftClasses: f,
    nRightClasses: c,
    values: u
  };
}
function ki(t, e, n) {
  if (n + 4 > e.length)
    return {
      firstGlyph: 0,
      nGlyphs: 0,
      offsets: [],
      maxOffset: 0
    };
  t.seek(n);
  const s = t.uint16(), o = t.uint16(), i = [];
  let r = 0;
  for (let a = 0; a < o; a++)
    if (t.position + 2 <= e.length) {
      const c = t.uint16();
      i.push(c), c > r && (r = c);
    } else
      i.push(0);
  return { firstGlyph: s, nGlyphs: o, offsets: i, maxOffset: r };
}
function qp(t) {
  const e = new B(t);
  if (t.length < 8) return { _raw: t };
  const n = e.uint16(), s = e.uint8(), o = e.uint8(), i = e.uint8(), r = e.uint8(), a = [];
  for (let h = 0; h < s; h++)
    e.position + 2 <= t.length ? a.push(e.int16()) : a.push(0);
  const c = [];
  for (let h = 0; h < n; h++)
    e.position < t.length ? c.push(e.uint8()) : c.push(0);
  const f = [];
  for (let h = 0; h < n; h++)
    e.position < t.length ? f.push(e.uint8()) : f.push(0);
  const u = [], l = o * i;
  for (let h = 0; h < l; h++)
    e.position < t.length ? u.push(e.uint8()) : u.push(0);
  return {
    glyphCount: n,
    kernValueCount: s,
    leftClassCount: o,
    rightClassCount: i,
    flags: r,
    kernValues: a,
    leftClasses: c,
    rightClasses: f,
    kernIndices: u
  };
}
function Yp(t) {
  const e = new B(t);
  if (t.length < 12) return { _raw: t };
  const n = e.uint16(), s = e.uint16(), o = e.uint16(), i = e.uint16(), r = e.uint16();
  let a = 0, c = 0, f = [];
  if (s + 4 <= t.length) {
    e.seek(s), a = e.uint16(), c = e.uint16(), f = [];
    for (let m = 0; m < c; m++)
      e.position < t.length ? f.push(e.uint8()) : f.push(1);
  }
  const u = Math.min(i, t.length), l = n > 0 ? Math.floor((u - o) / n) : 0, h = [];
  for (let m = 0; m < l; m++) {
    const y = o + m * n;
    e.seek(y);
    const _ = [];
    for (let w = 0; w < n; w++)
      e.position < t.length ? _.push(e.uint8()) : _.push(0);
    h.push(_);
  }
  const g = Math.min(
    r > i ? r : t.length,
    t.length
  ), p = Math.floor((g - i) / 4), d = [];
  e.seek(i);
  for (let m = 0; m < p; m++)
    if (e.position + 4 <= t.length) {
      const y = e.uint16(), _ = e.uint16();
      d.push({ newStateOffset: y, flags: _ });
    }
  const x = [];
  if (r < t.length)
    for (e.seek(r); e.position + 2 <= t.length; )
      x.push(e.int16());
  return {
    stateSize: n,
    classTableOffset: s,
    stateArrayOffset: o,
    entryTableOffset: i,
    valueTableOffset: r,
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
function Xp(t) {
  const e = new B(t), n = e.uint32(), s = e.uint32(), o = [];
  let i = Ca;
  for (let r = 0; r < s && !(i + Cn > t.length); r++) {
    e.seek(i);
    const a = e.uint32(), c = e.uint8(), f = e.uint8(), u = e.uint16(), l = Math.min(
      t.length,
      i + Math.max(a, Cn)
    ), h = Array.from(
      t.slice(i + Cn, l)
    ), g = {
      coverage: c,
      format: f,
      tupleIndex: u
    };
    f === 0 ? Object.assign(g, Wp(h)) : f === 1 ? Object.assign(g, Yp(h)) : f === 2 ? Object.assign(g, Ia(h)) : f === 3 ? Object.assign(g, qp(h)) : g._raw = h, o.push(g), i = l;
  }
  return {
    formatVariant: "apple",
    version: n,
    nTables: s,
    subtables: o
  };
}
function Kp(t) {
  return t.formatVariant === "apple" ? tg(t) : Jp(t);
}
function Jp(t) {
  const e = t.version ?? 0, n = t.subtables ?? [], s = n.map(
    (a) => Qp(a)
  ), o = n.length, i = ka + s.reduce((a, c) => a + c.length, 0), r = new k(i);
  r.uint16(e), r.uint16(o);
  for (const a of s)
    r.rawBytes(a);
  return r.toArray();
}
function Qp(t) {
  const e = t._raw ? t._raw : t.format === 0 ? Oa(t) : t.format === 2 ? Ta(t) : [], n = kn + e.length, s = t.coverage ?? (t.format ?? 0) << 8, o = new k(n);
  return o.uint16(t.version ?? 0), o.uint16(n), o.uint16(s), o.rawBytes(e), o.toArray();
}
function Oa(t) {
  const e = t.pairs ?? [], n = e.length, s = Math.floor(Math.log2(Math.max(1, n))), o = Math.pow(2, s) * 6, i = n * 6 - o, r = new k(8 + n * 6);
  r.uint16(n), r.uint16(t.searchRange ?? o), r.uint16(t.entrySelector ?? s), r.uint16(t.rangeShift ?? i);
  for (const a of e)
    r.uint16(a.left), r.uint16(a.right), r.int16(a.value);
  return r.toArray();
}
function tg(t) {
  const e = t.version ?? 65536, n = t.subtables ?? [], s = n.map((a) => {
    const c = eg(a), f = Cn + c.length, u = new k(f);
    return u.uint32(f), u.uint8(a.coverage ?? 0), u.uint8(a.format ?? 0), u.uint16(a.tupleIndex ?? 0), u.rawBytes(c), u.toArray();
  }), o = n.length, i = Ca + s.reduce((a, c) => a + c.length, 0), r = new k(i);
  r.uint32(e), r.uint32(o);
  for (const a of s)
    r.rawBytes(a);
  return r.toArray();
}
function eg(t) {
  if (t._raw) return t._raw;
  switch (t.format) {
    case 0:
      return Oa(t);
    case 1:
      return sg(t);
    case 2:
      return Ta(t);
    case 3:
      return ng(t);
    default:
      return [];
  }
}
function Ta(t) {
  const {
    rowWidth: e,
    leftOffsetTable: n,
    rightOffsetTable: s,
    kerningArrayOffset: o,
    leftClassTable: i,
    rightClassTable: r,
    nLeftClasses: a,
    nRightClasses: c,
    values: f
  } = t, u = Ci(i), l = Ci(r), h = a * c * 2, g = Math.max(
    o + h,
    n + u.length,
    s + l.length,
    8
    // header
  ), p = new k(g);
  p.uint16(e), p.uint16(n), p.uint16(s), p.uint16(o), p.seek(n), p.rawBytes(u), p.seek(s), p.rawBytes(l), p.seek(o);
  for (let d = 0; d < a; d++) {
    const x = f[d] || [];
    for (let m = 0; m < c; m++)
      p.int16(x[m] || 0);
  }
  return p.toArray();
}
function Ci(t) {
  const { firstGlyph: e, nGlyphs: n, offsets: s } = t, o = new k(4 + n * 2);
  o.uint16(e), o.uint16(n);
  for (let i = 0; i < n; i++)
    o.uint16(s[i] || 0);
  return o.toArray();
}
function ng(t) {
  const {
    glyphCount: e,
    kernValueCount: n,
    leftClassCount: s,
    rightClassCount: o,
    flags: i,
    kernValues: r,
    leftClasses: a,
    rightClasses: c,
    kernIndices: f
  } = t, u = s * o, l = 6 + // header: uint16 + 4×uint8
  n * 2 + // int16 values
  e + // left class uint8
  e + // right class uint8
  u, h = new k(l);
  h.uint16(e), h.uint8(n), h.uint8(s), h.uint8(o), h.uint8(i ?? 0);
  for (let g = 0; g < n; g++)
    h.int16(r[g] || 0);
  for (let g = 0; g < e; g++)
    h.uint8(a[g] || 0);
  for (let g = 0; g < e; g++)
    h.uint8(c[g] || 0);
  for (let g = 0; g < u; g++)
    h.uint8(f[g] || 0);
  return h.toArray();
}
function sg(t) {
  const {
    stateSize: e,
    classTableOffset: n,
    stateArrayOffset: s,
    entryTableOffset: o,
    valueTableOffset: i,
    classTable: r,
    states: a,
    entryTable: c,
    valueTable: f
  } = t, u = 4 + (r?.nGlyphs || 0), l = (a?.length || 0) * e, h = (c?.length || 0) * 4, g = (f?.length || 0) * 2, p = Math.max(
    10,
    // header: 5 × uint16
    n + u,
    s + l,
    o + h,
    i + g
  ), d = new k(p);
  if (d.uint16(e), d.uint16(n), d.uint16(s), d.uint16(o), d.uint16(i), d.seek(n), d.uint16(r?.firstGlyph || 0), d.uint16(r?.nGlyphs || 0), r?.classArray)
    for (const x of r.classArray)
      d.uint8(x);
  if (d.seek(s), a)
    for (const x of a)
      for (const m of x)
        d.uint8(m);
  if (d.seek(o), c)
    for (const x of c)
      d.uint16(x.newStateOffset), d.uint16(x.flags);
  if (d.seek(i), f)
    for (const x of f)
      d.int16(x);
  return d.toArray();
}
function og(t) {
  const e = new B(t), n = e.uint32(), s = e.uint32(), o = e.uint32(), i = [], r = [];
  for (let a = 0; a < o; a++)
    r.push({ offset: e.uint16(), length: e.uint16() });
  for (const a of r) {
    const c = t.slice(a.offset, a.offset + a.length);
    i.push(new TextDecoder("utf-8").decode(new Uint8Array(c)));
  }
  return { version: n, flags: s, tags: i };
}
function ig(t) {
  const { version: e, flags: n, tags: s } = t, o = new TextEncoder(), i = s.map((u) => o.encode(u)), r = 12 + s.length * 4, a = r + i.reduce((u, l) => u + l.length, 0), c = new k(a);
  c.uint32(e), c.uint32(n), c.uint32(s.length);
  let f = r;
  for (const u of i)
    c.uint16(f), c.uint16(u.length), f += u.length;
  for (const u of i)
    c.rawBytes(u);
  return c.toArray();
}
function rg(t) {
  const e = new B(t), n = e.uint16(), s = e.uint16(), o = e.bytes(s);
  return {
    version: n,
    numGlyphs: s,
    yPels: o
  };
}
function ag(t) {
  const e = t.version ?? 0, n = t.yPels ?? [], s = t.numGlyphs ?? n.length, o = n.slice(0, s);
  for (; o.length < s; )
    o.push(0);
  const i = new k(4 + s);
  return i.uint16(e), i.uint16(s), i.rawBytes(o), i.toArray();
}
const cg = 10;
function fg(t) {
  const e = new B(t), n = e.uint32(), s = e.offset16(), o = e.offset16(), i = e.offset16(), r = [
    s,
    o,
    i
  ].filter((a) => a > 0);
  return {
    version: n,
    mathConstants: ps(t, s, r),
    mathGlyphInfo: ps(t, o, r),
    mathVariants: ps(t, i, r)
  };
}
function ug(t) {
  const e = t.version ?? 65536, n = gs(t.mathConstants), s = gs(t.mathGlyphInfo), o = gs(t.mathVariants);
  let i = cg;
  const r = n.length ? i : 0;
  i += n.length;
  const a = s.length ? i : 0;
  i += s.length;
  const c = o.length ? i : 0;
  i += o.length;
  const f = new k(i);
  return f.uint32(e), f.offset16(r), f.offset16(a), f.offset16(c), f.rawBytes(n), f.rawBytes(s), f.rawBytes(o), f.toArray();
}
function ps(t, e, n) {
  if (!e)
    return null;
  const o = n.filter((i) => i > e).sort((i, r) => i - r)[0] ?? t.length;
  return o <= e || e >= t.length ? { _raw: [] } : { _raw: Array.from(t.slice(e, o)) };
}
function gs(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
const lg = 6, hg = 32;
function pg(t) {
  const e = new B(t), n = e.uint32(), s = e.uint16(), o = { version: n, numGlyphs: s };
  return n === 65536 && (o.maxPoints = e.uint16(), o.maxContours = e.uint16(), o.maxCompositePoints = e.uint16(), o.maxCompositeContours = e.uint16(), o.maxZones = e.uint16(), o.maxTwilightPoints = e.uint16(), o.maxStorage = e.uint16(), o.maxFunctionDefs = e.uint16(), o.maxInstructionDefs = e.uint16(), o.maxStackElements = e.uint16(), o.maxSizeOfInstructions = e.uint16(), o.maxComponentElements = e.uint16(), o.maxComponentDepth = e.uint16()), o;
}
function gg(t) {
  const e = t.version === 65536, n = e ? hg : lg, s = new k(n);
  return s.uint32(t.version), s.uint16(t.numGlyphs), e && (s.uint16(t.maxPoints), s.uint16(t.maxContours), s.uint16(t.maxCompositePoints), s.uint16(t.maxCompositeContours), s.uint16(t.maxZones), s.uint16(t.maxTwilightPoints), s.uint16(t.maxStorage), s.uint16(t.maxFunctionDefs), s.uint16(t.maxInstructionDefs), s.uint16(t.maxStackElements), s.uint16(t.maxSizeOfInstructions), s.uint16(t.maxComponentElements), s.uint16(t.maxComponentDepth)), s.toArray();
}
function dg(t) {
  if (!t.length)
    return { version: 0, data: [] };
  const e = new B(t), n = t.length >= 2 ? e.uint16() : 0, s = t.length >= 2 ? Array.from(t.slice(2)) : [];
  return {
    version: n,
    data: s
  };
}
function mg(t) {
  const e = t.version ?? 0, n = t.data ?? [], s = new k(2 + n.length);
  return s.uint16(e), s.rawBytes(n), s.toArray();
}
const Da = 16, yg = 12;
function xg(t) {
  const e = new B(t), n = e.uint32(), s = e.uint32(), o = e.uint32(), i = e.uint32(), r = [];
  for (let a = 0; a < i; a++) {
    const c = e.tag(), f = e.uint32(), u = e.uint32(), l = f, h = Math.min(t.length, l + u), g = l < Da || l >= t.length || h < l ? [] : Array.from(t.slice(l, h));
    r.push({ tag: c, dataOffset: f, dataLength: u, data: g });
  }
  return {
    version: n,
    flags: s,
    reserved: o,
    dataMaps: r
  };
}
function wg(t) {
  const e = t.version ?? 1, n = t.flags ?? 0, s = t.reserved ?? 0, i = (t.dataMaps ?? []).map((f) => ({
    tag: (f.tag ?? "    ").slice(0, 4).padEnd(4, " "),
    data: f.data ?? []
  }));
  let r = Da + i.length * yg;
  const a = i.map((f) => {
    const u = r, l = f.data.length;
    return r += l, {
      tag: f.tag,
      dataOffset: u,
      dataLength: l,
      data: f.data
    };
  }), c = new k(r);
  c.uint32(e), c.uint32(n), c.uint32(s), c.uint32(a.length);
  for (const f of a)
    c.tag(f.tag), c.uint32(f.dataOffset), c.uint32(f.dataLength);
  for (const f of a)
    c.rawBytes(f.data);
  return c.toArray();
}
const Gs = 12, he = 8;
function Sg(t) {
  const e = new B(t), n = e.uint16(), s = e.uint16(), o = e.uint16(), i = e.uint16(), r = e.uint16(), a = e.offset16(), c = [];
  for (let u = 0; u < r; u++) {
    const l = Gs + u * i;
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
    i > he && (h._extra = e.bytes(i - he)), c.push(h);
  }
  const f = a > 0 && a < t.length ? Pt(t.slice(a)) : null;
  return {
    majorVersion: n,
    minorVersion: s,
    reserved: o,
    valueRecordSize: i,
    valueRecords: c,
    itemVariationStore: f
  };
}
function _g(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, s = t.reserved ?? 0, o = [...t.valueRecords ?? []].sort(
    (g, p) => bg(g.valueTag, p.valueTag)
  ), i = t.valueRecordSize ?? he, r = o.reduce((g, p) => {
    const d = p._extra?.length ?? 0;
    return Math.max(g, he + d);
  }, he), a = Math.max(
    i,
    r
  ), c = o.length, f = t.itemVariationStore ? Qt(t.itemVariationStore) : [], u = f.length > 0 || c > 0 ? Gs + c * a : 0, l = u > 0 ? u + f.length : Gs, h = new k(l);
  h.uint16(e), h.uint16(n), h.uint16(s), h.uint16(a), h.uint16(c), h.offset16(u);
  for (const g of o) {
    h.tag(g.valueTag ?? "    "), h.uint16(g.deltaSetOuterIndex ?? 0), h.uint16(g.deltaSetInnerIndex ?? 0);
    const p = g._extra ?? [];
    h.rawBytes(p);
    const d = a - he - p.length;
    d > 0 && h.rawBytes(new Array(d).fill(0));
  }
  return h.rawBytes(f), h.toArray();
}
function bg(t, e) {
  const n = t ?? "    ", s = e ?? "    ";
  for (let o = 0; o < 4; o++) {
    const i = n.charCodeAt(o) - s.charCodeAt(o);
    if (i !== 0)
      return i;
  }
  return 0;
}
const Us = [
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
], So = /* @__PURE__ */ new Map();
for (let t = 0; t < 128; t++)
  So.set(t, t);
for (let t = 0; t < Us.length; t++)
  So.set(Us[t], 128 + t);
function vg(t, e, n) {
  return e === 0 || e === 3 ? Ns(t) : e === 1 && n === 0 ? Cg(t) : t.length % 2 === 0 ? Ns(t) : "0x:" + t.map((s) => s.toString(16).padStart(2, "0")).join("");
}
function kg(t, e, n) {
  if (t.startsWith("0x:")) {
    const s = t.slice(3), o = [];
    for (let i = 0; i < s.length; i += 2)
      o.push(parseInt(s.slice(i, i + 2), 16));
    return o;
  }
  return e === 0 || e === 3 ? $s(t) : e === 1 && n === 0 ? Ag(t) : $s(t);
}
function Ns(t) {
  const e = [];
  for (let n = 0; n + 1 < t.length; n += 2) {
    const s = t[n] << 8 | t[n + 1];
    e.push(s);
  }
  return String.fromCharCode(...e);
}
function $s(t) {
  const e = [];
  for (let n = 0; n < t.length; n++) {
    const s = t.charCodeAt(n);
    e.push(s >> 8 & 255, s & 255);
  }
  return e;
}
function Cg(t) {
  return t.map((e) => e < 128 ? String.fromCharCode(e) : String.fromCharCode(Us[e - 128])).join("");
}
function Ag(t) {
  const e = [];
  for (let n = 0; n < t.length; n++) {
    const s = t.charCodeAt(n), o = So.get(s);
    e.push(o !== void 0 ? o : 63);
  }
  return e;
}
function Ig(t) {
  const e = new B(t), n = e.uint16(), s = e.uint16(), o = e.uint16(), i = [];
  for (let f = 0; f < s; f++)
    i.push({
      platformID: e.uint16(),
      encodingID: e.uint16(),
      languageID: e.uint16(),
      nameID: e.uint16(),
      length: e.uint16(),
      stringOffset: e.uint16()
    });
  let r = [];
  if (n === 1) {
    const f = e.uint16();
    for (let u = 0; u < f; u++) {
      const l = e.uint16(), h = e.uint16(), g = t.slice(
        o + h,
        o + h + l
      );
      r.push({
        tag: Ns(g)
      });
    }
  }
  const a = i.map((f) => {
    const u = t.slice(
      o + f.stringOffset,
      o + f.stringOffset + f.length
    );
    return {
      platformID: f.platformID,
      encodingID: f.encodingID,
      languageID: f.languageID,
      nameID: f.nameID,
      value: vg(u, f.platformID, f.encodingID)
    };
  }), c = { version: n, names: a };
  return n === 1 && r.length > 0 && (c.langTagRecords = r), c;
}
function Og(t) {
  const { version: e, names: n, langTagRecords: s = [] } = t, o = n.map((w) => ({
    platformID: w.platformID,
    encodingID: w.encodingID,
    languageID: w.languageID,
    nameID: w.nameID,
    bytes: kg(w.value, w.platformID, w.encodingID)
  })), i = s.map((w) => $s(w.tag)), r = 6, a = 12, u = e === 1 ? (e === 1 ? 2 : 0) + s.length * 4 : 0, l = r + o.length * a + u, h = [];
  let g = 0;
  const p = /* @__PURE__ */ new Map();
  function d(w) {
    const S = w.join(",");
    if (p.has(S))
      return p.get(S);
    const b = g;
    return p.set(S, b), h.push(w), g += w.length, b;
  }
  const x = o.map((w) => ({
    ...w,
    stringOffset: d(w.bytes),
    stringLength: w.bytes.length
  })), m = i.map((w) => ({
    stringOffset: d(w),
    stringLength: w.length
  })), y = l + g, _ = new k(y);
  _.uint16(e), _.uint16(o.length), _.uint16(l);
  for (const w of x)
    _.uint16(w.platformID).uint16(w.encodingID).uint16(w.languageID).uint16(w.nameID).uint16(w.stringLength).uint16(w.stringOffset);
  if (e === 1) {
    _.uint16(m.length);
    for (const w of m)
      _.uint16(w.stringLength).uint16(w.stringOffset);
  }
  for (const w of h)
    _.rawBytes(w);
  return _.toArray();
}
const Ea = 78, Ba = 86, Ma = 96, La = 100;
function Tg(t) {
  const e = new B(t), n = t.length, s = {};
  return s.version = e.uint16(), s.xAvgCharWidth = e.fword(), s.usWeightClass = e.uint16(), s.usWidthClass = e.uint16(), s.fsType = e.uint16(), s.ySubscriptXSize = e.fword(), s.ySubscriptYSize = e.fword(), s.ySubscriptXOffset = e.fword(), s.ySubscriptYOffset = e.fword(), s.ySuperscriptXSize = e.fword(), s.ySuperscriptYSize = e.fword(), s.ySuperscriptXOffset = e.fword(), s.ySuperscriptYOffset = e.fword(), s.yStrikeoutSize = e.fword(), s.yStrikeoutPosition = e.fword(), s.sFamilyClass = e.int16(), s.panose = e.bytes(10), s.ulUnicodeRange1 = e.uint32(), s.ulUnicodeRange2 = e.uint32(), s.ulUnicodeRange3 = e.uint32(), s.ulUnicodeRange4 = e.uint32(), s.achVendID = e.tag(), s.fsSelection = e.uint16(), s.usFirstCharIndex = e.uint16(), s.usLastCharIndex = e.uint16(), n < Ea || (s.sTypoAscender = e.fword(), s.sTypoDescender = e.fword(), s.sTypoLineGap = e.fword(), s.usWinAscent = e.ufword(), s.usWinDescent = e.ufword(), s.version < 1 || n < Ba) || (s.ulCodePageRange1 = e.uint32(), s.ulCodePageRange2 = e.uint32(), s.version < 2 || n < Ma) || (s.sxHeight = e.fword(), s.sCapHeight = e.fword(), s.usDefaultChar = e.uint16(), s.usBreakChar = e.uint16(), s.usMaxContext = e.uint16(), s.version < 5 || n < La) || (s.usLowerOpticalPointSize = e.uint16(), s.usUpperOpticalPointSize = e.uint16()), s;
}
function Dg(t) {
  const e = t.version;
  let n;
  e >= 5 ? n = La : e >= 2 ? n = Ma : e >= 1 ? n = Ba : n = t.sTypoAscender !== void 0 ? Ea : 68;
  const s = new k(n);
  return s.uint16(e).fword(t.xAvgCharWidth).uint16(t.usWeightClass).uint16(t.usWidthClass).uint16(t.fsType).fword(t.ySubscriptXSize).fword(t.ySubscriptYSize).fword(t.ySubscriptXOffset).fword(t.ySubscriptYOffset).fword(t.ySuperscriptXSize).fword(t.ySuperscriptYSize).fword(t.ySuperscriptXOffset).fword(t.ySuperscriptYOffset).fword(t.yStrikeoutSize).fword(t.yStrikeoutPosition).int16(t.sFamilyClass).rawBytes(t.panose).uint32(t.ulUnicodeRange1).uint32(t.ulUnicodeRange2).uint32(t.ulUnicodeRange3).uint32(t.ulUnicodeRange4).tag(t.achVendID).uint16(t.fsSelection).uint16(t.usFirstCharIndex).uint16(t.usLastCharIndex), n <= 68 || (s.fword(t.sTypoAscender).fword(t.sTypoDescender).fword(t.sTypoLineGap).ufword(t.usWinAscent).ufword(t.usWinDescent), e < 1) || (s.uint32(t.ulCodePageRange1).uint32(t.ulCodePageRange2), e < 2) || (s.fword(t.sxHeight).fword(t.sCapHeight).uint16(t.usDefaultChar).uint16(t.usBreakChar).uint16(t.usMaxContext), e < 5) || s.uint16(t.usLowerOpticalPointSize).uint16(t.usUpperOpticalPointSize), s.toArray();
}
const Eg = 54;
function Bg(t) {
  const e = new B(t);
  return {
    version: e.uint32(),
    fontNumber: e.uint32(),
    pitch: e.uint16(),
    xHeight: e.uint16(),
    style: e.uint16(),
    typeFamily: e.uint16(),
    capHeight: e.uint16(),
    symbolSet: e.uint16(),
    typeface: ds(e.bytes(16)),
    characterComplement: ds(e.bytes(8)),
    fileName: ds(e.bytes(6)),
    strokeWeight: e.int8(),
    widthType: e.int8(),
    serifStyle: e.uint8(),
    reserved: e.uint8()
  };
}
function Mg(t) {
  const e = new k(Eg);
  return e.uint32(t.version ?? 65536), e.uint32(t.fontNumber ?? 0), e.uint16(t.pitch ?? 0), e.uint16(t.xHeight ?? 0), e.uint16(t.style ?? 0), e.uint16(t.typeFamily ?? 0), e.uint16(t.capHeight ?? 0), e.uint16(t.symbolSet ?? 0), e.rawBytes(ms(t.typeface ?? "", 16)), e.rawBytes(ms(t.characterComplement ?? "", 8)), e.rawBytes(ms(t.fileName ?? "", 6)), e.int8(t.strokeWeight ?? 0), e.int8(t.widthType ?? 0), e.uint8(t.serifStyle ?? 0), e.uint8(t.reserved ?? 0), e.toArray();
}
function ds(t) {
  return String.fromCharCode(...t).replace(/\0+$/g, "");
}
function ms(t, e) {
  const n = new Array(e).fill(0);
  for (let s = 0; s < e && s < t.length; s++) {
    const o = t.charCodeAt(s);
    n[s] = o >= 0 && o <= 127 ? o : 63;
  }
  return n;
}
const _o = 32, Hs = [
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
], Ra = new Map(
  Hs.map((t, e) => [t, e])
);
function Lg(t) {
  const e = new B(t), n = e.uint32(), s = e.fixed(), o = e.fword(), i = e.fword(), r = e.uint32(), a = e.uint32(), c = e.uint32(), f = e.uint32(), u = e.uint32(), l = {
    version: n,
    italicAngle: s,
    underlinePosition: o,
    underlineThickness: i,
    isFixedPitch: r,
    minMemType42: a,
    maxMemType42: c,
    minMemType1: f,
    maxMemType1: u
  };
  if (n === 65536 || n === 196608)
    return l;
  if (n === 131072) {
    const h = e.uint16(), g = e.array("uint16", h);
    let p = -1;
    for (const y of g)
      y > p && (p = y);
    const d = p >= 258 ? p - 258 + 1 : 0, x = [];
    for (let y = 0; y < d; y++) {
      const _ = e.uint8(), w = e.bytes(_);
      x.push(String.fromCharCode(...w));
    }
    const m = g.map((y) => y < 258 ? Hs[y] : x[y - 258]);
    return l.glyphNames = m, l;
  }
  if (n === 151552) {
    const h = e.uint16(), p = e.array("int8", h).map(
      (d, x) => Hs[x + d]
    );
    return l.glyphNames = p, l;
  }
  return l;
}
function Rg(t) {
  const { version: e } = t;
  return e === 65536 || e === 196608 ? Ai(t) : e === 131072 ? Fg(t) : e === 151552 ? Vg(t) : Ai(t);
}
function Ai(t) {
  const e = new k(_o);
  return e.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), e.toArray();
}
function Fg(t) {
  const { glyphNames: e } = t, n = e.length, s = [], o = [], i = /* @__PURE__ */ new Map();
  for (const f of e) {
    const u = Ra.get(f);
    u !== void 0 ? s.push(u) : (i.has(f) || (i.set(f, o.length), o.push(f)), s.push(258 + i.get(f)));
  }
  let r = 0;
  for (const f of o)
    r += 1 + f.length;
  const a = _o + 2 + n * 2 + r, c = new k(a);
  c.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), c.uint16(n);
  for (const f of s)
    c.uint16(f);
  for (const f of o) {
    c.uint8(f.length);
    for (let u = 0; u < f.length; u++)
      c.uint8(f.charCodeAt(u));
  }
  return c.toArray();
}
function Vg(t) {
  const { glyphNames: e } = t, n = e.length, s = _o + 2 + n, o = new k(s);
  o.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), o.uint16(n);
  for (let i = 0; i < n; i++) {
    const r = e[i], c = Ra.get(r) - i;
    o.int8(c);
  }
  return o.toArray();
}
function zg(t, e) {
  const n = new B(t), s = n.uint16(), o = n.uint16(), i = n.uint32(), r = n.array("uint32", i);
  let a = e?.maxp?.numGlyphs;
  const c = [];
  for (let f = 0; f < i; f++) {
    const u = r[f], l = r[f + 1] ?? t.length;
    if (u >= t.length || l <= u) {
      c.push({ ppem: 0, ppi: 0, glyphs: [] });
      continue;
    }
    n.seek(u);
    const h = n.uint16(), g = n.uint16();
    a == null && (a = (n.uint32() - 4) / 4 - 1, n.seek(u + 4));
    const p = n.array("uint32", a + 1), d = [];
    for (let x = 0; x < a; x++) {
      const m = u + p[x], y = u + p[x + 1], _ = y - m;
      if (_ <= 0) {
        d.push(null);
        continue;
      }
      n.seek(m);
      const w = n.int16(), S = n.int16(), b = n.tag(), v = _ > 8 ? t.slice(m + 8, y) : [];
      d.push({ originOffsetX: w, originOffsetY: S, graphicType: b, imageData: v });
    }
    c.push({ ppem: h, ppi: g, glyphs: d });
  }
  return { version: s, flags: o, strikes: c };
}
function Pg(t) {
  const e = t.version ?? 1, n = t.flags ?? 0, s = t.strikes ?? [], o = s.map((f) => f._raw ? f._raw : Gg(f));
  let r = 8 + s.length * 4;
  const a = [];
  for (const f of o)
    a.push(r), r += f.length;
  const c = new k(r);
  c.uint16(e), c.uint16(n), c.uint32(s.length);
  for (const f of a)
    c.uint32(f);
  for (const f of o)
    c.rawBytes(f);
  return c.toArray();
}
function Gg(t) {
  const e = t.glyphs ?? [], n = e.length, s = e.map((u) => {
    if (!u) return [];
    const l = u.imageData ?? [], h = new k(8 + l.length);
    return h.int16(u.originOffsetX ?? 0), h.int16(u.originOffsetY ?? 0), h.tag(u.graphicType ?? "png "), h.rawBytes(l), h.toArray();
  });
  let r = 4 + (n + 1) * 4;
  const a = [];
  for (const u of s)
    a.push(r), r += u.length;
  a.push(r);
  const c = r, f = new k(c);
  f.uint16(t.ppem ?? 0), f.uint16(t.ppi ?? 0);
  for (const u of a)
    f.uint32(u);
  for (const u of s)
    f.rawBytes(u);
  return f.toArray();
}
const Ug = 18, Fa = 20, pe = 8;
function Ng(t) {
  const e = new B(t), n = e.uint16(), s = e.uint16(), o = e.uint16(), i = e.uint16(), r = e.offset32(), a = e.uint16(), c = e.offset32();
  let f;
  s >= 1 && t.length >= Fa && (f = e.uint16());
  const u = [];
  if (i > 0 && r > 0)
    for (let p = 0; p < i; p++) {
      e.seek(r + p * o);
      const d = {
        axisTag: e.tag(),
        axisNameID: e.uint16(),
        axisOrdering: e.uint16()
      };
      o > pe && (d._extra = e.bytes(o - pe)), u.push(d);
    }
  const l = [];
  if (a > 0 && c > 0) {
    e.seek(c);
    for (let p = 0; p < a; p++)
      l.push(e.offset16());
  }
  const h = [];
  for (let p = 0; p < l.length; p++) {
    const d = l[p], x = c + d, m = p < l.length - 1 ? c + l[p + 1] : t.length;
    if (x >= t.length || m < x) {
      h.push({ format: 0, _raw: [] });
      continue;
    }
    h.push($g(t, x, m));
  }
  const g = {
    majorVersion: n,
    minorVersion: s,
    designAxisSize: o,
    designAxes: u,
    axisValues: h
  };
  return f !== void 0 && (g.elidedFallbackNameID = f), g;
}
function $g(t, e, n) {
  const s = new B(t);
  s.seek(e);
  const o = s.uint16();
  switch (o) {
    case 1:
      return {
        format: o,
        axisIndex: s.uint16(),
        flags: s.uint16(),
        valueNameID: s.uint16(),
        value: s.fixed()
      };
    case 2:
      return {
        format: o,
        axisIndex: s.uint16(),
        flags: s.uint16(),
        valueNameID: s.uint16(),
        nominalValue: s.fixed(),
        rangeMinValue: s.fixed(),
        rangeMaxValue: s.fixed()
      };
    case 3:
      return {
        format: o,
        axisIndex: s.uint16(),
        flags: s.uint16(),
        valueNameID: s.uint16(),
        value: s.fixed(),
        linkedValue: s.fixed()
      };
    case 4: {
      const i = s.uint16(), r = s.uint16(), a = s.uint16(), c = [];
      for (let f = 0; f < i; f++)
        c.push({
          axisIndex: s.uint16(),
          value: s.fixed()
        });
      return {
        format: o,
        axisCount: i,
        flags: r,
        valueNameID: a,
        axisValues: c
      };
    }
    default:
      return {
        format: o,
        _raw: Array.from(t.slice(e, n))
      };
  }
}
function Hg(t) {
  const e = t.majorVersion ?? 1;
  let n = t.minorVersion ?? 2;
  const s = t.designAxes ?? [], o = t.axisValues ?? [], i = t.designAxisSize ?? pe, r = s.reduce((b, v) => {
    const I = v._extra?.length ?? 0;
    return Math.max(b, pe + I);
  }, pe), a = Math.max(
    i,
    r
  ), c = n >= 1 || t.elidedFallbackNameID !== void 0;
  c && n === 0 && (n = 1);
  const f = c ? Fa : Ug, u = s.length, l = o.length, h = u > 0 ? f : 0, g = u * a, p = l > 0 ? f + g : 0, d = l * 2, x = o.map(
    (b) => jg(b)
  );
  let m = d;
  const y = x.map((b) => {
    const v = m;
    return m += b.length, v;
  }), _ = x.reduce(
    (b, v) => b + v.length,
    0
  ), w = f + g + d + _, S = new k(w);
  S.uint16(e), S.uint16(n), S.uint16(a), S.uint16(u), S.offset32(h), S.uint16(l), S.offset32(p), c && S.uint16(t.elidedFallbackNameID ?? 2);
  for (const b of s) {
    S.tag(b.axisTag), S.uint16(b.axisNameID ?? 0), S.uint16(b.axisOrdering ?? 0);
    const v = b._extra ?? [];
    S.rawBytes(v);
    const I = a - pe - v.length;
    I > 0 && S.rawBytes(new Array(I).fill(0));
  }
  for (const b of y)
    S.offset16(b);
  for (const b of x)
    S.rawBytes(b);
  return S.toArray();
}
function jg(t) {
  if (t._raw)
    return t._raw;
  switch (t.format) {
    case 1: {
      const e = new k(12);
      return e.uint16(1), e.uint16(t.axisIndex ?? 0), e.uint16(t.flags ?? 0), e.uint16(t.valueNameID ?? 0), e.fixed(t.value ?? 0), e.toArray();
    }
    case 2: {
      const e = new k(20);
      return e.uint16(2), e.uint16(t.axisIndex ?? 0), e.uint16(t.flags ?? 0), e.uint16(t.valueNameID ?? 0), e.fixed(t.nominalValue ?? 0), e.fixed(t.rangeMinValue ?? 0), e.fixed(t.rangeMaxValue ?? 0), e.toArray();
    }
    case 3: {
      const e = new k(16);
      return e.uint16(3), e.uint16(t.axisIndex ?? 0), e.uint16(t.flags ?? 0), e.uint16(t.valueNameID ?? 0), e.fixed(t.value ?? 0), e.fixed(t.linkedValue ?? 0), e.toArray();
    }
    case 4: {
      const e = t.axisValues ?? [], n = t.axisCount ?? e.length, s = new k(8 + n * 6);
      s.uint16(4), s.uint16(n), s.uint16(t.flags ?? 0), s.uint16(t.valueNameID ?? 0);
      for (let o = 0; o < n; o++) {
        const i = e[o] ?? { axisIndex: 0, value: 0 };
        s.uint16(i.axisIndex ?? 0), s.fixed(i.value ?? 0);
      }
      return s.toArray();
    }
    default:
      throw new Error(
        `Unsupported STAT axis value format: ${t.format}`
      );
  }
}
function Zg(t) {
  const e = new B(t), n = e.uint16(), s = e.uint32();
  e.uint32(), e.seek(s);
  const o = e.uint16(), i = [];
  for (let u = 0; u < o; u++)
    i.push({
      startGlyphID: e.uint16(),
      endGlyphID: e.uint16(),
      svgDocOffset: e.uint32(),
      svgDocLength: e.uint32()
    });
  const r = new TextDecoder("utf-8"), a = /* @__PURE__ */ new Map(), c = [];
  for (const u of i) {
    const l = `${u.svgDocOffset}:${u.svgDocLength}`;
    if (!a.has(l)) {
      const h = s + u.svgDocOffset, g = t.slice(h, h + u.svgDocLength), p = g.length >= 3 && g[0] === 31 && g[1] === 139 && g[2] === 8, d = c.length;
      if (p)
        c.push({ compressed: !0, data: g });
      else {
        const x = r.decode(new Uint8Array(g));
        c.push({ compressed: !1, text: x });
      }
      a.set(l, d);
    }
  }
  const f = [];
  for (const u of i) {
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
function Wg(t) {
  const { version: e, documents: n, entries: s } = t, o = new TextEncoder(), i = n.map((p) => p.compressed ? p.data instanceof Uint8Array ? Array.from(p.data) : p.data : Array.from(o.encode(p.text))), a = 10, c = s.length;
  let u = 2 + c * 12;
  const l = [];
  for (let p = 0; p < i.length; p++) {
    const d = i[p];
    l.push({ offset: u, length: d.length }), u += d.length;
  }
  const h = a + u, g = new k(h);
  g.uint16(e), g.uint32(a), g.uint32(0), g.uint16(c);
  for (const p of s) {
    const d = l[p.documentIndex];
    g.uint16(p.startGlyphID), g.uint16(p.endGlyphID), g.uint32(d.offset), g.uint32(d.length);
  }
  for (const p of i)
    for (const d of p)
      g.uint8(d);
  return g.toArray();
}
const qg = 6, Yg = 4, Xg = 2, Va = 6;
function Kg(t) {
  const e = new B(t), n = e.uint16(), s = e.uint16(), o = e.uint16(), i = [];
  for (let l = 0; l < o; l++)
    i.push({
      bCharSet: e.uint8(),
      xRatio: e.uint8(),
      yStartRatio: e.uint8(),
      yEndRatio: e.uint8()
    });
  const r = [];
  for (let l = 0; l < o; l++)
    r.push(e.offset16());
  const a = [...new Set(r)].sort((l, h) => l - h), c = a.map((l) => Qg(t, l)), f = new Map(
    a.map((l, h) => [l, h])
  ), u = i.map((l, h) => ({
    ...l,
    groupIndex: f.get(r[h]) ?? 0
  }));
  return {
    version: n,
    numRecs: s,
    numRatios: o,
    ratios: u,
    groups: c
  };
}
function Jg(t) {
  const e = t.version ?? 0, n = t.ratios ?? [], s = t.groups ?? [], o = s.map((u) => td(u)), i = t.numRecs ?? Math.max(0, ...s.map((u) => (u.entries ?? []).length)), r = n.length;
  let a = qg + r * Yg + r * Xg;
  const c = o.map((u) => {
    const l = a;
    return a += u.length, l;
  }), f = new k(a);
  f.uint16(e), f.uint16(i), f.uint16(r);
  for (const u of n)
    f.uint8(u.bCharSet ?? 0), f.uint8(u.xRatio ?? 0), f.uint8(u.yStartRatio ?? 0), f.uint8(u.yEndRatio ?? 0);
  for (const u of n) {
    const l = u.groupIndex ?? 0, h = c[l] ?? 0;
    f.offset16(h);
  }
  for (const u of o)
    f.rawBytes(u);
  return f.toArray();
}
function Qg(t, e) {
  if (!e || e >= t.length)
    return { recs: 0, startsz: 0, endsz: 0, entries: [] };
  const n = new B(t, e), s = n.uint16(), o = n.uint8(), i = n.uint8(), r = [];
  for (let a = 0; a < s && !(n.position + Va > t.length); a++)
    r.push({
      yPelHeight: n.uint16(),
      yMax: n.int16(),
      yMin: n.int16()
    });
  return { recs: s, startsz: o, endsz: i, entries: r };
}
function td(t) {
  const e = t.entries ?? [], n = t.recs ?? e.length, s = e.slice(0, n);
  for (; s.length < n; )
    s.push({ yPelHeight: 0, yMax: 0, yMin: 0 });
  const o = new k(4 + n * Va);
  o.uint16(n), o.uint8(t.startsz ?? 0), o.uint8(t.endsz ?? 0);
  for (const i of s)
    o.uint16(i.yPelHeight ?? 0), o.int16(i.yMax ?? 0), o.int16(i.yMin ?? 0);
  return o.toArray();
}
const ed = 36;
function nd(t) {
  const e = new B(t);
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
function sd(t) {
  const e = new k(ed);
  return e.uint32(t.version), e.fword(t.vertTypoAscender), e.fword(t.vertTypoDescender), e.fword(t.vertTypoLineGap), e.ufword(t.advanceHeightMax), e.fword(t.minTopSideBearing), e.fword(t.minBottomSideBearing), e.fword(t.yMaxExtent), e.int16(t.caretSlopeRise), e.int16(t.caretSlopeRun), e.int16(t.caretOffset), e.int16(t.reserved1), e.int16(t.reserved2), e.int16(t.reserved3), e.int16(t.reserved4), e.int16(t.metricDataFormat), e.uint16(t.numOfLongVerMetrics), e.toArray();
}
function od(t, e) {
  const n = e.vhea.numOfLongVerMetrics, s = e.maxp.numGlyphs, o = new B(t), i = [];
  for (let c = 0; c < n; c++)
    i.push({
      advanceHeight: o.ufword(),
      topSideBearing: o.fword()
    });
  const r = s - n, a = o.array("fword", r);
  return { vMetrics: i, topSideBearings: a };
}
function id(t) {
  const { vMetrics: e, topSideBearings: n } = t, s = e.length * 4 + n.length * 2, o = new k(s);
  for (const i of e)
    o.ufword(i.advanceHeight), o.fword(i.topSideBearing);
  return o.array("fword", n), o.toArray();
}
const rd = 24, za = 15, Pa = 48;
function ad(t) {
  const e = new B(t), n = e.uint16(), s = e.uint16(), o = e.offset32(), i = e.offset32(), r = e.offset32(), a = e.offset32(), c = e.offset32(), f = [
    o,
    i,
    r,
    a,
    c
  ];
  return {
    majorVersion: n,
    minorVersion: s,
    itemVariationStore: o ? Pt(
      t.slice(
        o,
        Ga(
          t.length,
          o,
          f
        )
      )
    ) : null,
    advanceHeightMapping: pn(
      t,
      i,
      f
    ),
    tsbMapping: pn(
      t,
      r,
      f
    ),
    bsbMapping: pn(
      t,
      a,
      f
    ),
    vOrgMapping: pn(
      t,
      c,
      f
    )
  };
}
function pn(t, e, n) {
  if (!e)
    return null;
  const s = Ga(t.length, e, n);
  if (s <= e || e >= t.length)
    return { format: 0, entryFormat: 0, mapCount: 0, entries: [], _raw: [] };
  const o = Array.from(t.slice(e, s));
  return {
    ...cd(o),
    _raw: o
  };
}
function Ga(t, e, n) {
  return n.filter((o) => o > e).sort((o, i) => o - i)[0] ?? t;
}
function cd(t) {
  const e = new B(t), n = e.uint8(), s = e.uint8(), o = n === 1 ? e.uint32() : e.uint16(), i = (s & za) + 1, r = ((s & Pa) >> 4) + 1, a = [];
  for (let c = 0; c < o; c++) {
    const f = dd(e, r);
    a.push(hd(f, i));
  }
  return {
    format: n,
    entryFormat: s,
    mapCount: o,
    entries: a
  };
}
function fd(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, s = t.itemVariationStore ? Qt(t.itemVariationStore) : [], o = gn(
    t.advanceHeightMapping
  ), i = gn(t.tsbMapping), r = gn(t.bsbMapping), a = gn(t.vOrgMapping);
  let c = rd;
  const f = s.length ? c : 0;
  c += s.length;
  const u = o.length ? c : 0;
  c += o.length;
  const l = i.length ? c : 0;
  c += i.length;
  const h = r.length ? c : 0;
  c += r.length;
  const g = a.length ? c : 0;
  c += a.length;
  const p = new k(c);
  return p.uint16(e), p.uint16(n), p.offset32(f), p.offset32(u), p.offset32(l), p.offset32(h), p.offset32(g), p.rawBytes(s), p.rawBytes(o), p.rawBytes(i), p.rawBytes(r), p.rawBytes(a), p.toArray();
}
function gn(t) {
  return t ? t._raw ? t._raw : ud(t) : [];
}
function ud(t) {
  const e = t.entries ?? [], n = t.mapCount ?? e.length, s = pd(e), o = t.format ?? (n > 65535 ? 1 : 0), i = t.entryFormat ?? s.entryFormat, r = (i & za) + 1, a = ((i & Pa) >> 4) + 1, c = o === 1 ? 6 : 4, f = new k(c + n * a);
  f.uint8(o), f.uint8(i), o === 1 ? f.uint32(n) : f.uint16(n);
  for (let u = 0; u < n; u++) {
    const l = e[u] ?? { outerIndex: 0, innerIndex: 0 }, h = ld(l, r);
    md(f, h, a);
  }
  return f.toArray();
}
function ld(t, e) {
  const n = (1 << e) - 1;
  return (t.outerIndex ?? 0) << e | (t.innerIndex ?? 0) & n;
}
function hd(t, e) {
  const n = (1 << e) - 1;
  return {
    outerIndex: t >> e,
    innerIndex: t & n
  };
}
function pd(t) {
  let e = 0, n = 0;
  for (const a of t)
    e = Math.max(e, a.innerIndex ?? 0), n = Math.max(n, a.outerIndex ?? 0);
  let s = 1;
  for (; (1 << s) - 1 < e && s < 16; )
    s++;
  const o = n << s | e;
  let i = 1;
  for (; i < 4 && o > gd(i); )
    i++;
  return { entryFormat: i - 1 << 4 | s - 1 };
}
function gd(t) {
  return t === 1 ? 255 : t === 2 ? 65535 : t === 3 ? 16777215 : 4294967295;
}
function dd(t, e) {
  return e === 1 ? t.uint8() : e === 2 ? t.uint16() : e === 3 ? t.uint24() : t.uint32();
}
function md(t, e, n) {
  n === 1 ? t.uint8(e) : n === 2 ? t.uint16(e) : n === 3 ? t.uint24(e) : t.uint32(e >>> 0);
}
const Wn = 32768, qn = 4095, Yn = 32768, Xn = 16384, Kn = 8192, yd = 4095, Ua = 128, xd = 127, Na = 128, $a = 64, wd = 63;
function En(t) {
  const e = t.uint8();
  let n;
  if (e === 0)
    return null;
  if ((e & 128) === 0)
    n = e;
  else {
    const i = t.uint8();
    n = (e & 127) << 8 | i;
  }
  const s = [];
  let o = 0;
  for (; s.length < n; ) {
    const i = t.uint8(), r = (i & xd) + 1, a = (i & Ua) !== 0;
    for (let c = 0; c < r && s.length < n; c++) {
      const f = a ? t.uint16() : t.uint8();
      o += f, s.push(o);
    }
  }
  return s;
}
function Bn(t) {
  if (t === null)
    return [0];
  const e = t.length, n = [];
  e < 128 ? n.push(e) : (n.push(128 | e >> 8), n.push(e & 255));
  const s = [];
  let o = 0;
  for (const r of t)
    s.push(r - o), o = r;
  let i = 0;
  for (; i < s.length; ) {
    const r = s[i] > 255;
    let a = 1;
    const c = Math.min(128, s.length - i);
    for (; a < c && s[i + a] > 255 === r; )
      a++;
    const f = (r ? Ua : 0) | a - 1;
    n.push(f);
    for (let u = 0; u < a; u++) {
      const l = s[i + u];
      r ? n.push(l >> 8 & 255, l & 255) : n.push(l & 255);
    }
    i += a;
  }
  return n;
}
function Ha(t, e) {
  const n = [];
  for (; n.length < e; ) {
    const s = t.uint8(), o = (s & wd) + 1;
    if (s & Na)
      for (let i = 0; i < o && n.length < e; i++)
        n.push(0);
    else if (s & $a)
      for (let i = 0; i < o && n.length < e; i++)
        n.push(t.int16());
    else
      for (let i = 0; i < o && n.length < e; i++)
        n.push(t.int8());
  }
  return n;
}
function ja(t) {
  const e = [];
  let n = 0;
  for (; n < t.length; )
    if (t[n] === 0) {
      let s = 1;
      const o = Math.min(64, t.length - n);
      for (; s < o && t[n + s] === 0; )
        s++;
      e.push(Na | s - 1), n += s;
    } else if (t[n] < -128 || t[n] > 127) {
      let s = 1;
      const o = Math.min(64, t.length - n);
      for (; s < o; ) {
        const i = t[n + s];
        if (i === 0 || i >= -128 && i <= 127) break;
        s++;
      }
      e.push($a | s - 1);
      for (let i = 0; i < s; i++) {
        const r = t[n + i] & 65535;
        e.push(r >> 8 & 255, r & 255);
      }
      n += s;
    } else {
      let s = 1;
      const o = Math.min(64, t.length - n);
      for (; s < o; ) {
        const i = t[n + s];
        if (i === 0 || i < -128 || i > 127) break;
        s++;
      }
      e.push(s - 1);
      for (let i = 0; i < s; i++)
        e.push(t[n + i] & 255);
      n += s;
    }
  return e;
}
function Sd(t, e, n, s) {
  if (!t || t.length === 0) return [];
  const o = new B(t), i = o.uint16(), r = o.offset16(), a = i & qn, c = (i & Wn) !== 0;
  if (a === 0) return [];
  const f = [];
  for (let h = 0; h < a; h++) {
    const g = o.uint16(), p = o.uint16();
    let d;
    if (p & Yn)
      d = o.array("f2dot14", e);
    else {
      const y = p & yd;
      d = n[y] ?? new Array(e).fill(0);
    }
    let x = null, m = null;
    p & Xn && (x = o.array("f2dot14", e), m = o.array("f2dot14", e)), f.push({
      variationDataSize: g,
      tupleIndex: p,
      peakTuple: d,
      intermediateStartTuple: x,
      intermediateEndTuple: m,
      hasPrivatePoints: (p & Kn) !== 0
    });
  }
  o.seek(r);
  let u = null;
  c && (u = En(o));
  const l = [];
  for (const h of f) {
    const p = o.position + h.variationDataSize;
    let d;
    h.hasPrivatePoints ? d = En(o) : d = u;
    const x = d === null ? s : d.length, m = x * 2, y = Ha(o, m);
    l.push({
      peakTuple: h.peakTuple,
      intermediateStartTuple: h.intermediateStartTuple,
      intermediateEndTuple: h.intermediateEndTuple,
      pointIndices: d,
      xDeltas: y.slice(0, x),
      yDeltas: y.slice(x)
    }), o.seek(p);
  }
  return l;
}
function _d(t, e) {
  if (!t || t.length === 0) return [];
  const n = t.length, o = t.every(
    (p) => JSON.stringify(p.pointIndices) === JSON.stringify(t[0].pointIndices)
  ) && n > 1, i = [];
  let r = [];
  o && (r = Bn(t[0].pointIndices), i.push(r));
  const a = [];
  for (const p of t) {
    const d = [];
    o || d.push(...Bn(p.pointIndices));
    const x = [...p.xDeltas ?? [], ...p.yDeltas ?? []];
    d.push(...ja(x)), a.push(d.length), i.push(d);
  }
  const c = [];
  for (const p of i)
    c.push(...p);
  const f = [];
  for (let p = 0; p < n; p++) {
    const d = t[p];
    let x = Yn;
    o || (x |= Kn), d.intermediateStartTuple && (x |= Xn);
    const m = [];
    m.push(a[p] >> 8 & 255), m.push(a[p] & 255), m.push(x >> 8 & 255), m.push(x & 255);
    for (let y = 0; y < e; y++) {
      const _ = Math.round((d.peakTuple[y] ?? 0) * 16384) & 65535;
      m.push(_ >> 8 & 255, _ & 255);
    }
    if (d.intermediateStartTuple) {
      for (let y = 0; y < e; y++) {
        const _ = Math.round((d.intermediateStartTuple[y] ?? 0) * 16384) & 65535;
        m.push(_ >> 8 & 255, _ & 255);
      }
      for (let y = 0; y < e; y++) {
        const _ = Math.round((d.intermediateEndTuple[y] ?? 0) * 16384) & 65535;
        m.push(_ >> 8 & 255, _ & 255);
      }
    }
    f.push(m);
  }
  const u = [];
  for (const p of f)
    u.push(...p);
  const l = (o ? Wn : 0) | n & qn, h = 4 + u.length, g = [];
  return g.push(l >> 8 & 255), g.push(l & 255), g.push(h >> 8 & 255), g.push(h & 255), g.push(...u), g.push(...c), g;
}
function bd(t, e, n) {
  if (!t || t.length < 8)
    return { majorVersion: 1, minorVersion: 0, tupleVariations: [] };
  const s = new B(t), o = s.uint16(), i = s.uint16(), r = s.uint16(), a = s.offset16(), c = r & qn, f = (r & Wn) !== 0;
  if (c === 0)
    return { majorVersion: o, minorVersion: i, tupleVariations: [] };
  const u = [];
  for (let g = 0; g < c; g++) {
    const p = s.uint16(), d = s.uint16();
    let x = null;
    d & Yn && (x = s.array("f2dot14", e));
    let m = null, y = null;
    d & Xn && (m = s.array("f2dot14", e), y = s.array("f2dot14", e)), u.push({
      variationDataSize: p,
      tupleIndex: d,
      peakTuple: x,
      intermediateStartTuple: m,
      intermediateEndTuple: y,
      hasPrivatePoints: (d & Kn) !== 0
    });
  }
  s.seek(a);
  let l = null;
  f && (l = En(s));
  const h = [];
  for (const g of u) {
    const d = s.position + g.variationDataSize;
    let x;
    g.hasPrivatePoints ? x = En(s) : x = l;
    const m = x === null ? n : x.length, y = Ha(s, m);
    h.push({
      peakTuple: g.peakTuple,
      intermediateStartTuple: g.intermediateStartTuple,
      intermediateEndTuple: g.intermediateEndTuple,
      pointIndices: x,
      deltas: y
    }), s.seek(d);
  }
  return { majorVersion: o, minorVersion: i, tupleVariations: h };
}
function vd(t, e) {
  const n = t.majorVersion ?? 1, s = t.minorVersion ?? 0, o = t.tupleVariations ?? [], i = o.length;
  if (i === 0) {
    const x = new k(8);
    return x.uint16(n), x.uint16(s), x.uint16(0), x.offset16(8), x.toArray();
  }
  const a = o.every(
    (x) => JSON.stringify(x.pointIndices) === JSON.stringify(o[0].pointIndices)
  ) && i > 1, c = [];
  a && c.push(
    Bn(o[0].pointIndices)
  );
  const f = [];
  for (const x of o) {
    const m = [];
    a || m.push(...Bn(x.pointIndices)), m.push(...ja(x.deltas ?? [])), f.push(m.length), c.push(m);
  }
  const u = [];
  for (const x of c)
    u.push(...x);
  const l = [];
  for (let x = 0; x < i; x++) {
    const m = o[x];
    let y = Yn;
    a || (y |= Kn), m.intermediateStartTuple && (y |= Xn), l.push(f[x] >> 8 & 255), l.push(f[x] & 255), l.push(y >> 8 & 255), l.push(y & 255);
    for (let _ = 0; _ < e; _++) {
      const w = Math.round((m.peakTuple[_] ?? 0) * 16384) & 65535;
      l.push(w >> 8 & 255, w & 255);
    }
    if (m.intermediateStartTuple) {
      for (let _ = 0; _ < e; _++) {
        const w = Math.round((m.intermediateStartTuple[_] ?? 0) * 16384) & 65535;
        l.push(w >> 8 & 255, w & 255);
      }
      for (let _ = 0; _ < e; _++) {
        const w = Math.round((m.intermediateEndTuple[_] ?? 0) * 16384) & 65535;
        l.push(w >> 8 & 255, w & 255);
      }
    }
  }
  const h = (a ? Wn : 0) | i & qn, g = 8 + l.length, p = g + u.length, d = new k(p);
  return d.uint16(n), d.uint16(s), d.uint16(h), d.offset16(g), d.rawBytes(l), d.rawBytes(u), d.toArray();
}
function kd(t, e = {}) {
  const n = e.fvar?.axes?.length ?? 0, s = e["cvt "]?.values?.length ?? 0;
  return bd(t, n, s);
}
function Cd(t) {
  const e = t.tupleVariations?.[0]?.peakTuple?.length ?? 0;
  return vd(t, e);
}
function Ad(t) {
  const e = new B(t), n = t.length >>> 1;
  return { values: e.array("fword", n) };
}
function Id(t) {
  const e = t.values, n = new k(e.length * 2);
  return n.array("fword", e), n.toArray();
}
function Od(t) {
  return { instructions: Array.from(t) };
}
function Td(t) {
  return Array.from(t.instructions);
}
function Dd(t) {
  const e = new B(t), n = e.uint16(), s = e.uint16(), o = [];
  for (let i = 0; i < s; i++)
    o.push({
      rangeMaxPPEM: e.uint16(),
      rangeGaspBehavior: e.uint16()
    });
  return { version: n, gaspRanges: o };
}
function Ed(t) {
  const { version: e, gaspRanges: n } = t, s = new k(4 + n.length * 4);
  s.uint16(e), s.uint16(n.length);
  for (const o of n)
    s.uint16(o.rangeMaxPPEM), s.uint16(o.rangeGaspBehavior);
  return s.toArray();
}
const Za = 1, Wa = 2, qa = 4, Ya = 8, Mn = 16, Ln = 32, Xa = 64, je = 1, Rn = 2, Ka = 4, bo = 8, js = 32, vo = 64, ko = 128, Ze = 256, Ja = 512, Qa = 1024, tc = 2048, ec = 4096;
function Bd(t, e) {
  const n = e.loca.offsets, s = e.maxp.numGlyphs, o = new B(t), i = [];
  for (let r = 0; r < s; r++) {
    const a = n[r], c = n[r + 1];
    if (a === c) {
      i.push(null);
      continue;
    }
    o.seek(a);
    const f = o.int16(), u = o.int16(), l = o.int16(), h = o.int16(), g = o.int16();
    f >= 0 ? i.push(
      Md(o, f, u, l, h, g)
    ) : i.push(Ld(o, u, l, h, g));
  }
  return { glyphs: i };
}
function Md(t, e, n, s, o, i) {
  const r = t.array("uint16", e), a = e > 0 ? r[e - 1] + 1 : 0, c = t.uint16(), f = t.bytes(c), u = [];
  for (; u.length < a; ) {
    const y = t.uint8();
    if (u.push(y), y & Ya) {
      const _ = t.uint8();
      for (let w = 0; w < _; w++)
        u.push(y);
    }
  }
  const l = new Array(a);
  let h = 0;
  for (let y = 0; y < a; y++) {
    const _ = u[y];
    if (_ & Wa) {
      const w = t.uint8();
      h += _ & Mn ? w : -w;
    } else _ & Mn || (h += t.int16());
    l[y] = h;
  }
  const g = new Array(a);
  let p = 0;
  for (let y = 0; y < a; y++) {
    const _ = u[y];
    if (_ & qa) {
      const w = t.uint8();
      p += _ & Ln ? w : -w;
    } else _ & Ln || (p += t.int16());
    g[y] = p;
  }
  const d = a > 0 && (u[0] & Xa) !== 0, x = [];
  let m = 0;
  for (let y = 0; y < e; y++) {
    const _ = r[y], w = [];
    for (; m <= _; )
      w.push({
        x: l[m],
        y: g[m],
        onCurve: (u[m] & Za) !== 0
      }), m++;
    x.push(w);
  }
  return {
    type: "simple",
    xMin: n,
    yMin: s,
    xMax: o,
    yMax: i,
    contours: x,
    instructions: f,
    overlapSimple: d
  };
}
function Ld(t, e, n, s, o) {
  const i = [];
  let r, a = !1;
  do {
    r = t.uint16();
    const f = t.uint16();
    let u, l;
    r & je ? r & Rn ? (u = t.int16(), l = t.int16()) : (u = t.uint16(), l = t.uint16()) : r & Rn ? (u = t.int8(), l = t.int8()) : (u = t.uint8(), l = t.uint8());
    const h = {
      glyphIndex: f,
      flags: Rd(r),
      argument1: u,
      argument2: l
    };
    r & bo ? h.transform = { scale: t.f2dot14() } : r & vo ? h.transform = {
      xScale: t.f2dot14(),
      yScale: t.f2dot14()
    } : r & ko && (h.transform = {
      xScale: t.f2dot14(),
      scale01: t.f2dot14(),
      scale10: t.f2dot14(),
      yScale: t.f2dot14()
    }), i.push(h), r & Ze && (a = !0);
  } while (r & js);
  let c = [];
  if (a) {
    const f = t.uint16();
    c = t.bytes(f);
  }
  return {
    type: "composite",
    xMin: e,
    yMin: n,
    xMax: s,
    yMax: o,
    components: i,
    instructions: c
  };
}
function Rd(t) {
  const e = {};
  return t & je && (e.argsAreWords = !0), t & Rn && (e.argsAreXYValues = !0), t & Ka && (e.roundXYToGrid = !0), t & bo && (e.weHaveAScale = !0), t & vo && (e.weHaveAnXAndYScale = !0), t & ko && (e.weHaveATwoByTwo = !0), t & Ze && (e.weHaveInstructions = !0), t & Ja && (e.useMyMetrics = !0), t & Qa && (e.overlapCompound = !0), t & tc && (e.scaledComponentOffset = !0), t & ec && (e.unscaledComponentOffset = !0), e;
}
function nc(t) {
  const { glyphs: e } = t, n = [];
  for (const i of e) {
    if (i === null) {
      n.push([]);
      continue;
    }
    i.type === "simple" ? n.push(Vd(i)) : n.push(Pd(i));
  }
  const s = [], o = [];
  for (const i of n) {
    o.push(s.length);
    for (let r = 0; r < i.length; r++)
      s.push(i[r]);
    i.length % 2 !== 0 && s.push(0);
  }
  return o.push(s.length), { bytes: s, offsets: o };
}
function Fd(t) {
  return nc(t).bytes;
}
function Vd(t) {
  const { contours: e, instructions: n, xMin: s, yMin: o, xMax: i, yMax: r, overlapSimple: a } = t, c = e.length, f = [], u = [];
  for (const C of e) {
    for (const O of C)
      f.push(O);
    u.push(f.length - 1);
  }
  const l = f.length, h = f.map((C) => C.x), g = f.map((C) => C.y), p = new Array(l), d = new Array(l);
  for (let C = 0; C < l; C++)
    p[C] = C === 0 ? h[C] : h[C] - h[C - 1], d[C] = C === 0 ? g[C] : g[C] - g[C - 1];
  const x = [], m = [], y = [];
  for (let C = 0; C < l; C++) {
    let O = 0;
    f[C].onCurve && (O |= Za);
    const T = p[C], D = d[C];
    T === 0 ? O |= Mn : T >= -255 && T <= 255 ? (O |= Wa, T > 0 ? (O |= Mn, m.push(T)) : m.push(-T)) : m.push(T >> 8 & 255, T & 255), D === 0 ? O |= Ln : D >= -255 && D <= 255 ? (O |= qa, D > 0 ? (O |= Ln, y.push(D)) : y.push(-D)) : y.push(D >> 8 & 255, D & 255), C === 0 && a && (O |= Xa), x.push(O);
  }
  const _ = zd(x), w = 10, S = c * 2, b = 2, v = n.length, I = w + S + b + v + _.length + m.length + y.length, A = new k(I);
  return A.int16(c), A.int16(s), A.int16(o), A.int16(i), A.int16(r), A.array("uint16", u), A.uint16(n.length), A.rawBytes(n), A.rawBytes(_), A.rawBytes(m), A.rawBytes(y), A.toArray();
}
function zd(t) {
  const e = [];
  let n = 0;
  for (; n < t.length; ) {
    const s = t[n];
    let o = 0;
    for (; n + 1 + o < t.length && t[n + 1 + o] === s && o < 255; )
      o++;
    o > 0 ? (e.push(s | Ya, o), n += 1 + o) : (e.push(s), n++);
  }
  return e;
}
function Pd(t) {
  const { components: e, instructions: n, xMin: s, yMin: o, xMax: i, yMax: r } = t;
  let a = 10;
  for (let f = 0; f < e.length; f++) {
    const u = e[f];
    a += 4;
    const l = u.flags.argsAreWords || Ii(u.argument1, u.argument2, u.flags.argsAreXYValues);
    a += l ? 4 : 2, u.transform && ("scale" in u.transform ? a += 2 : "scale01" in u.transform ? a += 8 : "xScale" in u.transform && (a += 4));
  }
  n && n.length > 0 && (a += 2 + n.length);
  const c = new k(a);
  c.int16(-1), c.int16(s), c.int16(o), c.int16(i), c.int16(r);
  for (let f = 0; f < e.length; f++) {
    const u = e[f], l = f === e.length - 1;
    let h = Gd(u.flags);
    const g = u.flags.argsAreWords || Ii(u.argument1, u.argument2, u.flags.argsAreXYValues);
    g ? h |= je : h &= ~je, l ? h &= ~js : h |= js, l && n && n.length > 0 ? h |= Ze : l && (h &= ~Ze), c.uint16(h), c.uint16(u.glyphIndex), g ? u.flags.argsAreXYValues ? (c.int16(u.argument1), c.int16(u.argument2)) : (c.uint16(u.argument1), c.uint16(u.argument2)) : u.flags.argsAreXYValues ? (c.int8(u.argument1), c.int8(u.argument2)) : (c.uint8(u.argument1), c.uint8(u.argument2)), u.transform && ("scale" in u.transform ? c.f2dot14(u.transform.scale) : "scale01" in u.transform ? (c.f2dot14(u.transform.xScale), c.f2dot14(u.transform.scale01), c.f2dot14(u.transform.scale10), c.f2dot14(u.transform.yScale)) : "xScale" in u.transform && (c.f2dot14(u.transform.xScale), c.f2dot14(u.transform.yScale)));
  }
  return n && n.length > 0 && (c.uint16(n.length), c.rawBytes(n)), c.toArray();
}
function Ii(t, e, n) {
  return n ? t < -128 || t > 127 || e < -128 || e > 127 : t > 255 || e > 255;
}
function Gd(t) {
  let e = 0;
  return t.argsAreWords && (e |= je), t.argsAreXYValues && (e |= Rn), t.roundXYToGrid && (e |= Ka), t.weHaveAScale && (e |= bo), t.weHaveAnXAndYScale && (e |= vo), t.weHaveATwoByTwo && (e |= ko), t.weHaveInstructions && (e |= Ze), t.useMyMetrics && (e |= Ja), t.overlapCompound && (e |= Qa), t.scaledComponentOffset && (e |= tc), t.unscaledComponentOffset && (e |= ec), e;
}
const Ud = 20, Zs = 1;
function Nd(t, e = {}) {
  const n = new B(t), s = n.uint16(), o = n.uint16(), i = n.uint16(), r = n.uint16(), a = n.offset32(), c = n.uint16(), f = n.uint16(), u = n.offset32(), l = (f & Zs) !== 0, h = c + 1, g = [];
  for (let x = 0; x < h; x++)
    l ? g.push(n.uint32()) : g.push(n.uint16() * 2);
  const p = [];
  if (r > 0 && a > 0) {
    n.seek(a);
    for (let x = 0; x < r; x++) {
      const m = [];
      for (let y = 0; y < i; y++)
        m.push(n.f2dot14());
      p.push(m);
    }
  }
  const d = [];
  for (let x = 0; x < c; x++) {
    const m = g[x], y = g[x + 1], _ = Math.max(0, y - m);
    if (_ === 0) {
      d.push([]);
      continue;
    }
    const w = u + m, S = t.slice(w, w + _), b = $d(e, x);
    d.push(
      Sd(S, i, p, b)
    );
  }
  return {
    majorVersion: s,
    minorVersion: o,
    axisCount: i,
    flags: f,
    sharedTuples: p,
    glyphVariationData: d
  };
}
function $d(t, e) {
  const n = t.glyf?.glyphs?.[e];
  if (!n) return 0;
  if (n.type === "simple" && n.contours) {
    let s = 0;
    for (const o of n.contours)
      s += o.length;
    return s + 4;
  }
  return n.type === "composite" && n.components ? n.components.length + 4 : 0;
}
function Hd(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, s = t.axisCount ?? 0, o = t.glyphVariationData ?? [], i = o.length, r = o.map((S) => Array.isArray(S) && (S.length === 0 || typeof S[0] == "number") ? S : Array.isArray(S) ? _d(S, s) : []), a = t.sharedTuples ?? jd(o, s), c = a.length, f = c * s * 2, u = [0];
  let l = 0;
  for (const S of r)
    l += S.length, u.push(l);
  const h = u.every(
    (S) => S % 2 === 0 && S / 2 <= 65535
  ), g = h ? 2 : 4, p = (i + 1) * g, d = Ud + p, x = d + f, m = x + l, y = t.flags ?? 0, _ = h ? y & ~Zs : y | Zs, w = new k(m);
  w.uint16(e), w.uint16(n), w.uint16(s), w.uint16(c), w.offset32(d), w.uint16(i), w.uint16(_), w.offset32(x);
  for (const S of u)
    h ? w.uint16(S / 2) : w.uint32(S);
  for (const S of a)
    for (let b = 0; b < s; b++)
      w.f2dot14(S[b] ?? 0);
  for (const S of r)
    w.rawBytes(S);
  return w.toArray();
}
function jd(t, e) {
  if (e === 0) return [];
  const n = /* @__PURE__ */ new Set(), s = [];
  for (const o of t)
    if (Array.isArray(o))
      for (const i of o) {
        if (!i || !i.peakTuple) continue;
        const r = i.peakTuple.map((a) => Math.round((a ?? 0) * 16384)).join(",");
        n.has(r) || (n.add(r), s.push(i.peakTuple));
      }
  return s;
}
function Zd(t, e) {
  const n = e.head.indexToLocFormat, o = e.maxp.numGlyphs + 1, i = new B(t), r = [];
  if (n === 0)
    for (let a = 0; a < o; a++)
      r.push(i.uint16() * 2);
  else
    for (let a = 0; a < o; a++)
      r.push(i.uint32());
  return { offsets: r };
}
function sc(t) {
  const { offsets: e } = t;
  if (e.every((o) => o % 2 === 0 && o / 2 <= 65535)) {
    const o = new k(e.length * 2);
    for (const i of e)
      o.uint16(i / 2);
    return o.toArray();
  }
  const s = new k(e.length * 4);
  for (const o of e)
    s.uint32(o);
  return s.toArray();
}
function Wd(t) {
  return { instructions: Array.from(t) };
}
function qd(t) {
  return Array.from(t.instructions);
}
const Yd = 4, Oi = 0, Ti = 1, Xd = 2;
function Ce(t) {
  let e = t.length;
  for (; --e >= 0; )
    t[e] = 0;
}
const Kd = 0, oc = 1, Jd = 2, Qd = 3, t1 = 258, Co = 29, rn = 256, We = rn + 1 + Co, me = 30, Ao = 19, ic = 2 * We + 1, Zt = 15, ys = 16, e1 = 7, Io = 256, rc = 16, ac = 17, cc = 18, Ws = (
  /* extra bits for each length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0])
), An = (
  /* extra bits for each distance code */
  new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13])
), n1 = (
  /* extra bits for each bit length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7])
), fc = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), s1 = 512, vt = new Array((We + 2) * 2);
Ce(vt);
const Ue = new Array(me * 2);
Ce(Ue);
const qe = new Array(s1);
Ce(qe);
const Ye = new Array(t1 - Qd + 1);
Ce(Ye);
const Oo = new Array(Co);
Ce(Oo);
const Fn = new Array(me);
Ce(Fn);
function xs(t, e, n, s, o) {
  this.static_tree = t, this.extra_bits = e, this.extra_base = n, this.elems = s, this.max_length = o, this.has_stree = t && t.length;
}
let uc, lc, hc;
function ws(t, e) {
  this.dyn_tree = t, this.max_code = 0, this.stat_desc = e;
}
const pc = (t) => t < 256 ? qe[t] : qe[256 + (t >>> 7)], Xe = (t, e) => {
  t.pending_buf[t.pending++] = e & 255, t.pending_buf[t.pending++] = e >>> 8 & 255;
}, et = (t, e, n) => {
  t.bi_valid > ys - n ? (t.bi_buf |= e << t.bi_valid & 65535, Xe(t, t.bi_buf), t.bi_buf = e >> ys - t.bi_valid, t.bi_valid += n - ys) : (t.bi_buf |= e << t.bi_valid & 65535, t.bi_valid += n);
}, pt = (t, e, n) => {
  et(
    t,
    n[e * 2],
    n[e * 2 + 1]
    /*.Len*/
  );
}, gc = (t, e) => {
  let n = 0;
  do
    n |= t & 1, t >>>= 1, n <<= 1;
  while (--e > 0);
  return n >>> 1;
}, o1 = (t) => {
  t.bi_valid === 16 ? (Xe(t, t.bi_buf), t.bi_buf = 0, t.bi_valid = 0) : t.bi_valid >= 8 && (t.pending_buf[t.pending++] = t.bi_buf & 255, t.bi_buf >>= 8, t.bi_valid -= 8);
}, i1 = (t, e) => {
  const n = e.dyn_tree, s = e.max_code, o = e.stat_desc.static_tree, i = e.stat_desc.has_stree, r = e.stat_desc.extra_bits, a = e.stat_desc.extra_base, c = e.stat_desc.max_length;
  let f, u, l, h, g, p, d = 0;
  for (h = 0; h <= Zt; h++)
    t.bl_count[h] = 0;
  for (n[t.heap[t.heap_max] * 2 + 1] = 0, f = t.heap_max + 1; f < ic; f++)
    u = t.heap[f], h = n[n[u * 2 + 1] * 2 + 1] + 1, h > c && (h = c, d++), n[u * 2 + 1] = h, !(u > s) && (t.bl_count[h]++, g = 0, u >= a && (g = r[u - a]), p = n[u * 2], t.opt_len += p * (h + g), i && (t.static_len += p * (o[u * 2 + 1] + g)));
  if (d !== 0) {
    do {
      for (h = c - 1; t.bl_count[h] === 0; )
        h--;
      t.bl_count[h]--, t.bl_count[h + 1] += 2, t.bl_count[c]--, d -= 2;
    } while (d > 0);
    for (h = c; h !== 0; h--)
      for (u = t.bl_count[h]; u !== 0; )
        l = t.heap[--f], !(l > s) && (n[l * 2 + 1] !== h && (t.opt_len += (h - n[l * 2 + 1]) * n[l * 2], n[l * 2 + 1] = h), u--);
  }
}, dc = (t, e, n) => {
  const s = new Array(Zt + 1);
  let o = 0, i, r;
  for (i = 1; i <= Zt; i++)
    o = o + n[i - 1] << 1, s[i] = o;
  for (r = 0; r <= e; r++) {
    let a = t[r * 2 + 1];
    a !== 0 && (t[r * 2] = gc(s[a]++, a));
  }
}, r1 = () => {
  let t, e, n, s, o;
  const i = new Array(Zt + 1);
  for (n = 0, s = 0; s < Co - 1; s++)
    for (Oo[s] = n, t = 0; t < 1 << Ws[s]; t++)
      Ye[n++] = s;
  for (Ye[n - 1] = s, o = 0, s = 0; s < 16; s++)
    for (Fn[s] = o, t = 0; t < 1 << An[s]; t++)
      qe[o++] = s;
  for (o >>= 7; s < me; s++)
    for (Fn[s] = o << 7, t = 0; t < 1 << An[s] - 7; t++)
      qe[256 + o++] = s;
  for (e = 0; e <= Zt; e++)
    i[e] = 0;
  for (t = 0; t <= 143; )
    vt[t * 2 + 1] = 8, t++, i[8]++;
  for (; t <= 255; )
    vt[t * 2 + 1] = 9, t++, i[9]++;
  for (; t <= 279; )
    vt[t * 2 + 1] = 7, t++, i[7]++;
  for (; t <= 287; )
    vt[t * 2 + 1] = 8, t++, i[8]++;
  for (dc(vt, We + 1, i), t = 0; t < me; t++)
    Ue[t * 2 + 1] = 5, Ue[t * 2] = gc(t, 5);
  uc = new xs(vt, Ws, rn + 1, We, Zt), lc = new xs(Ue, An, 0, me, Zt), hc = new xs(new Array(0), n1, 0, Ao, e1);
}, mc = (t) => {
  let e;
  for (e = 0; e < We; e++)
    t.dyn_ltree[e * 2] = 0;
  for (e = 0; e < me; e++)
    t.dyn_dtree[e * 2] = 0;
  for (e = 0; e < Ao; e++)
    t.bl_tree[e * 2] = 0;
  t.dyn_ltree[Io * 2] = 1, t.opt_len = t.static_len = 0, t.sym_next = t.matches = 0;
}, yc = (t) => {
  t.bi_valid > 8 ? Xe(t, t.bi_buf) : t.bi_valid > 0 && (t.pending_buf[t.pending++] = t.bi_buf), t.bi_buf = 0, t.bi_valid = 0;
}, Di = (t, e, n, s) => {
  const o = e * 2, i = n * 2;
  return t[o] < t[i] || t[o] === t[i] && s[e] <= s[n];
}, Ss = (t, e, n) => {
  const s = t.heap[n];
  let o = n << 1;
  for (; o <= t.heap_len && (o < t.heap_len && Di(e, t.heap[o + 1], t.heap[o], t.depth) && o++, !Di(e, s, t.heap[o], t.depth)); )
    t.heap[n] = t.heap[o], n = o, o <<= 1;
  t.heap[n] = s;
}, Ei = (t, e, n) => {
  let s, o, i = 0, r, a;
  if (t.sym_next !== 0)
    do
      s = t.pending_buf[t.sym_buf + i++] & 255, s += (t.pending_buf[t.sym_buf + i++] & 255) << 8, o = t.pending_buf[t.sym_buf + i++], s === 0 ? pt(t, o, e) : (r = Ye[o], pt(t, r + rn + 1, e), a = Ws[r], a !== 0 && (o -= Oo[r], et(t, o, a)), s--, r = pc(s), pt(t, r, n), a = An[r], a !== 0 && (s -= Fn[r], et(t, s, a)));
    while (i < t.sym_next);
  pt(t, Io, e);
}, qs = (t, e) => {
  const n = e.dyn_tree, s = e.stat_desc.static_tree, o = e.stat_desc.has_stree, i = e.stat_desc.elems;
  let r, a, c = -1, f;
  for (t.heap_len = 0, t.heap_max = ic, r = 0; r < i; r++)
    n[r * 2] !== 0 ? (t.heap[++t.heap_len] = c = r, t.depth[r] = 0) : n[r * 2 + 1] = 0;
  for (; t.heap_len < 2; )
    f = t.heap[++t.heap_len] = c < 2 ? ++c : 0, n[f * 2] = 1, t.depth[f] = 0, t.opt_len--, o && (t.static_len -= s[f * 2 + 1]);
  for (e.max_code = c, r = t.heap_len >> 1; r >= 1; r--)
    Ss(t, n, r);
  f = i;
  do
    r = t.heap[
      1
      /*SMALLEST*/
    ], t.heap[
      1
      /*SMALLEST*/
    ] = t.heap[t.heap_len--], Ss(
      t,
      n,
      1
      /*SMALLEST*/
    ), a = t.heap[
      1
      /*SMALLEST*/
    ], t.heap[--t.heap_max] = r, t.heap[--t.heap_max] = a, n[f * 2] = n[r * 2] + n[a * 2], t.depth[f] = (t.depth[r] >= t.depth[a] ? t.depth[r] : t.depth[a]) + 1, n[r * 2 + 1] = n[a * 2 + 1] = f, t.heap[
      1
      /*SMALLEST*/
    ] = f++, Ss(
      t,
      n,
      1
      /*SMALLEST*/
    );
  while (t.heap_len >= 2);
  t.heap[--t.heap_max] = t.heap[
    1
    /*SMALLEST*/
  ], i1(t, e), dc(n, c, t.bl_count);
}, Bi = (t, e, n) => {
  let s, o = -1, i, r = e[1], a = 0, c = 7, f = 4;
  for (r === 0 && (c = 138, f = 3), e[(n + 1) * 2 + 1] = 65535, s = 0; s <= n; s++)
    i = r, r = e[(s + 1) * 2 + 1], !(++a < c && i === r) && (a < f ? t.bl_tree[i * 2] += a : i !== 0 ? (i !== o && t.bl_tree[i * 2]++, t.bl_tree[rc * 2]++) : a <= 10 ? t.bl_tree[ac * 2]++ : t.bl_tree[cc * 2]++, a = 0, o = i, r === 0 ? (c = 138, f = 3) : i === r ? (c = 6, f = 3) : (c = 7, f = 4));
}, Mi = (t, e, n) => {
  let s, o = -1, i, r = e[1], a = 0, c = 7, f = 4;
  for (r === 0 && (c = 138, f = 3), s = 0; s <= n; s++)
    if (i = r, r = e[(s + 1) * 2 + 1], !(++a < c && i === r)) {
      if (a < f)
        do
          pt(t, i, t.bl_tree);
        while (--a !== 0);
      else i !== 0 ? (i !== o && (pt(t, i, t.bl_tree), a--), pt(t, rc, t.bl_tree), et(t, a - 3, 2)) : a <= 10 ? (pt(t, ac, t.bl_tree), et(t, a - 3, 3)) : (pt(t, cc, t.bl_tree), et(t, a - 11, 7));
      a = 0, o = i, r === 0 ? (c = 138, f = 3) : i === r ? (c = 6, f = 3) : (c = 7, f = 4);
    }
}, a1 = (t) => {
  let e;
  for (Bi(t, t.dyn_ltree, t.l_desc.max_code), Bi(t, t.dyn_dtree, t.d_desc.max_code), qs(t, t.bl_desc), e = Ao - 1; e >= 3 && t.bl_tree[fc[e] * 2 + 1] === 0; e--)
    ;
  return t.opt_len += 3 * (e + 1) + 5 + 5 + 4, e;
}, c1 = (t, e, n, s) => {
  let o;
  for (et(t, e - 257, 5), et(t, n - 1, 5), et(t, s - 4, 4), o = 0; o < s; o++)
    et(t, t.bl_tree[fc[o] * 2 + 1], 3);
  Mi(t, t.dyn_ltree, e - 1), Mi(t, t.dyn_dtree, n - 1);
}, f1 = (t) => {
  let e = 4093624447, n;
  for (n = 0; n <= 31; n++, e >>>= 1)
    if (e & 1 && t.dyn_ltree[n * 2] !== 0)
      return Oi;
  if (t.dyn_ltree[18] !== 0 || t.dyn_ltree[20] !== 0 || t.dyn_ltree[26] !== 0)
    return Ti;
  for (n = 32; n < rn; n++)
    if (t.dyn_ltree[n * 2] !== 0)
      return Ti;
  return Oi;
};
let Li = !1;
const u1 = (t) => {
  Li || (r1(), Li = !0), t.l_desc = new ws(t.dyn_ltree, uc), t.d_desc = new ws(t.dyn_dtree, lc), t.bl_desc = new ws(t.bl_tree, hc), t.bi_buf = 0, t.bi_valid = 0, mc(t);
}, xc = (t, e, n, s) => {
  et(t, (Kd << 1) + (s ? 1 : 0), 3), yc(t), Xe(t, n), Xe(t, ~n), n && t.pending_buf.set(t.window.subarray(e, e + n), t.pending), t.pending += n;
}, l1 = (t) => {
  et(t, oc << 1, 3), pt(t, Io, vt), o1(t);
}, h1 = (t, e, n, s) => {
  let o, i, r = 0;
  t.level > 0 ? (t.strm.data_type === Xd && (t.strm.data_type = f1(t)), qs(t, t.l_desc), qs(t, t.d_desc), r = a1(t), o = t.opt_len + 3 + 7 >>> 3, i = t.static_len + 3 + 7 >>> 3, i <= o && (o = i)) : o = i = n + 5, n + 4 <= o && e !== -1 ? xc(t, e, n, s) : t.strategy === Yd || i === o ? (et(t, (oc << 1) + (s ? 1 : 0), 3), Ei(t, vt, Ue)) : (et(t, (Jd << 1) + (s ? 1 : 0), 3), c1(t, t.l_desc.max_code + 1, t.d_desc.max_code + 1, r + 1), Ei(t, t.dyn_ltree, t.dyn_dtree)), mc(t), s && yc(t);
}, p1 = (t, e, n) => (t.pending_buf[t.sym_buf + t.sym_next++] = e, t.pending_buf[t.sym_buf + t.sym_next++] = e >> 8, t.pending_buf[t.sym_buf + t.sym_next++] = n, e === 0 ? t.dyn_ltree[n * 2]++ : (t.matches++, e--, t.dyn_ltree[(Ye[n] + rn + 1) * 2]++, t.dyn_dtree[pc(e) * 2]++), t.sym_next === t.sym_end);
var g1 = u1, d1 = xc, m1 = h1, y1 = p1, x1 = l1, w1 = {
  _tr_init: g1,
  _tr_stored_block: d1,
  _tr_flush_block: m1,
  _tr_tally: y1,
  _tr_align: x1
};
const S1 = (t, e, n, s) => {
  let o = t & 65535 | 0, i = t >>> 16 & 65535 | 0, r = 0;
  for (; n !== 0; ) {
    r = n > 2e3 ? 2e3 : n, n -= r;
    do
      o = o + e[s++] | 0, i = i + o | 0;
    while (--r);
    o %= 65521, i %= 65521;
  }
  return o | i << 16 | 0;
};
var Ke = S1;
const _1 = () => {
  let t, e = [];
  for (var n = 0; n < 256; n++) {
    t = n;
    for (var s = 0; s < 8; s++)
      t = t & 1 ? 3988292384 ^ t >>> 1 : t >>> 1;
    e[n] = t;
  }
  return e;
}, b1 = new Uint32Array(_1()), v1 = (t, e, n, s) => {
  const o = b1, i = s + n;
  t ^= -1;
  for (let r = s; r < i; r++)
    t = t >>> 8 ^ o[(t ^ e[r]) & 255];
  return t ^ -1;
};
var Z = v1, Xt = {
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
}, Jn = {
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
const { _tr_init: k1, _tr_stored_block: Ys, _tr_flush_block: C1, _tr_tally: Ft, _tr_align: A1 } = w1, {
  Z_NO_FLUSH: Vt,
  Z_PARTIAL_FLUSH: I1,
  Z_FULL_FLUSH: O1,
  Z_FINISH: ct,
  Z_BLOCK: Ri,
  Z_OK: q,
  Z_STREAM_END: Fi,
  Z_STREAM_ERROR: dt,
  Z_DATA_ERROR: T1,
  Z_BUF_ERROR: _s,
  Z_DEFAULT_COMPRESSION: D1,
  Z_FILTERED: E1,
  Z_HUFFMAN_ONLY: dn,
  Z_RLE: B1,
  Z_FIXED: M1,
  Z_DEFAULT_STRATEGY: L1,
  Z_UNKNOWN: R1,
  Z_DEFLATED: Qn
} = Jn, F1 = 9, V1 = 15, z1 = 8, P1 = 29, G1 = 256, Xs = G1 + 1 + P1, U1 = 30, N1 = 19, $1 = 2 * Xs + 1, H1 = 15, F = 3, Mt = 258, mt = Mt + F + 1, j1 = 32, ve = 42, To = 57, Ks = 69, Js = 73, Qs = 91, to = 103, Wt = 113, Ve = 666, Q = 1, Ae = 2, Kt = 3, Ie = 4, Z1 = 3, qt = (t, e) => (t.msg = Xt[e], e), Vi = (t) => t * 2 - (t > 4 ? 9 : 0), Tt = (t) => {
  let e = t.length;
  for (; --e >= 0; )
    t[e] = 0;
}, W1 = (t) => {
  let e, n, s, o = t.w_size;
  e = t.hash_size, s = e;
  do
    n = t.head[--s], t.head[s] = n >= o ? n - o : 0;
  while (--e);
  e = o, s = e;
  do
    n = t.prev[--s], t.prev[s] = n >= o ? n - o : 0;
  while (--e);
};
let q1 = (t, e, n) => (e << t.hash_shift ^ n) & t.hash_mask, zt = q1;
const st = (t) => {
  const e = t.state;
  let n = e.pending;
  n > t.avail_out && (n = t.avail_out), n !== 0 && (t.output.set(e.pending_buf.subarray(e.pending_out, e.pending_out + n), t.next_out), t.next_out += n, e.pending_out += n, t.total_out += n, t.avail_out -= n, e.pending -= n, e.pending === 0 && (e.pending_out = 0));
}, it = (t, e) => {
  C1(t, t.block_start >= 0 ? t.block_start : -1, t.strstart - t.block_start, e), t.block_start = t.strstart, st(t.strm);
}, V = (t, e) => {
  t.pending_buf[t.pending++] = e;
}, Be = (t, e) => {
  t.pending_buf[t.pending++] = e >>> 8 & 255, t.pending_buf[t.pending++] = e & 255;
}, eo = (t, e, n, s) => {
  let o = t.avail_in;
  return o > s && (o = s), o === 0 ? 0 : (t.avail_in -= o, e.set(t.input.subarray(t.next_in, t.next_in + o), n), t.state.wrap === 1 ? t.adler = Ke(t.adler, e, o, n) : t.state.wrap === 2 && (t.adler = Z(t.adler, e, o, n)), t.next_in += o, t.total_in += o, o);
}, wc = (t, e) => {
  let n = t.max_chain_length, s = t.strstart, o, i, r = t.prev_length, a = t.nice_match;
  const c = t.strstart > t.w_size - mt ? t.strstart - (t.w_size - mt) : 0, f = t.window, u = t.w_mask, l = t.prev, h = t.strstart + Mt;
  let g = f[s + r - 1], p = f[s + r];
  t.prev_length >= t.good_match && (n >>= 2), a > t.lookahead && (a = t.lookahead);
  do
    if (o = e, !(f[o + r] !== p || f[o + r - 1] !== g || f[o] !== f[s] || f[++o] !== f[s + 1])) {
      s += 2, o++;
      do
        ;
      while (f[++s] === f[++o] && f[++s] === f[++o] && f[++s] === f[++o] && f[++s] === f[++o] && f[++s] === f[++o] && f[++s] === f[++o] && f[++s] === f[++o] && f[++s] === f[++o] && s < h);
      if (i = Mt - (h - s), s = h - Mt, i > r) {
        if (t.match_start = e, r = i, i >= a)
          break;
        g = f[s + r - 1], p = f[s + r];
      }
    }
  while ((e = l[e & u]) > c && --n !== 0);
  return r <= t.lookahead ? r : t.lookahead;
}, ke = (t) => {
  const e = t.w_size;
  let n, s, o;
  do {
    if (s = t.window_size - t.lookahead - t.strstart, t.strstart >= e + (e - mt) && (t.window.set(t.window.subarray(e, e + e - s), 0), t.match_start -= e, t.strstart -= e, t.block_start -= e, t.insert > t.strstart && (t.insert = t.strstart), W1(t), s += e), t.strm.avail_in === 0)
      break;
    if (n = eo(t.strm, t.window, t.strstart + t.lookahead, s), t.lookahead += n, t.lookahead + t.insert >= F)
      for (o = t.strstart - t.insert, t.ins_h = t.window[o], t.ins_h = zt(t, t.ins_h, t.window[o + 1]); t.insert && (t.ins_h = zt(t, t.ins_h, t.window[o + F - 1]), t.prev[o & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = o, o++, t.insert--, !(t.lookahead + t.insert < F)); )
        ;
  } while (t.lookahead < mt && t.strm.avail_in !== 0);
}, Sc = (t, e) => {
  let n = t.pending_buf_size - 5 > t.w_size ? t.w_size : t.pending_buf_size - 5, s, o, i, r = 0, a = t.strm.avail_in;
  do {
    if (s = 65535, i = t.bi_valid + 42 >> 3, t.strm.avail_out < i || (i = t.strm.avail_out - i, o = t.strstart - t.block_start, s > o + t.strm.avail_in && (s = o + t.strm.avail_in), s > i && (s = i), s < n && (s === 0 && e !== ct || e === Vt || s !== o + t.strm.avail_in)))
      break;
    r = e === ct && s === o + t.strm.avail_in ? 1 : 0, Ys(t, 0, 0, r), t.pending_buf[t.pending - 4] = s, t.pending_buf[t.pending - 3] = s >> 8, t.pending_buf[t.pending - 2] = ~s, t.pending_buf[t.pending - 1] = ~s >> 8, st(t.strm), o && (o > s && (o = s), t.strm.output.set(t.window.subarray(t.block_start, t.block_start + o), t.strm.next_out), t.strm.next_out += o, t.strm.avail_out -= o, t.strm.total_out += o, t.block_start += o, s -= o), s && (eo(t.strm, t.strm.output, t.strm.next_out, s), t.strm.next_out += s, t.strm.avail_out -= s, t.strm.total_out += s);
  } while (r === 0);
  return a -= t.strm.avail_in, a && (a >= t.w_size ? (t.matches = 2, t.window.set(t.strm.input.subarray(t.strm.next_in - t.w_size, t.strm.next_in), 0), t.strstart = t.w_size, t.insert = t.strstart) : (t.window_size - t.strstart <= a && (t.strstart -= t.w_size, t.window.set(t.window.subarray(t.w_size, t.w_size + t.strstart), 0), t.matches < 2 && t.matches++, t.insert > t.strstart && (t.insert = t.strstart)), t.window.set(t.strm.input.subarray(t.strm.next_in - a, t.strm.next_in), t.strstart), t.strstart += a, t.insert += a > t.w_size - t.insert ? t.w_size - t.insert : a), t.block_start = t.strstart), t.high_water < t.strstart && (t.high_water = t.strstart), r ? Ie : e !== Vt && e !== ct && t.strm.avail_in === 0 && t.strstart === t.block_start ? Ae : (i = t.window_size - t.strstart, t.strm.avail_in > i && t.block_start >= t.w_size && (t.block_start -= t.w_size, t.strstart -= t.w_size, t.window.set(t.window.subarray(t.w_size, t.w_size + t.strstart), 0), t.matches < 2 && t.matches++, i += t.w_size, t.insert > t.strstart && (t.insert = t.strstart)), i > t.strm.avail_in && (i = t.strm.avail_in), i && (eo(t.strm, t.window, t.strstart, i), t.strstart += i, t.insert += i > t.w_size - t.insert ? t.w_size - t.insert : i), t.high_water < t.strstart && (t.high_water = t.strstart), i = t.bi_valid + 42 >> 3, i = t.pending_buf_size - i > 65535 ? 65535 : t.pending_buf_size - i, n = i > t.w_size ? t.w_size : i, o = t.strstart - t.block_start, (o >= n || (o || e === ct) && e !== Vt && t.strm.avail_in === 0 && o <= i) && (s = o > i ? i : o, r = e === ct && t.strm.avail_in === 0 && s === o ? 1 : 0, Ys(t, t.block_start, s, r), t.block_start += s, st(t.strm)), r ? Kt : Q);
}, bs = (t, e) => {
  let n, s;
  for (; ; ) {
    if (t.lookahead < mt) {
      if (ke(t), t.lookahead < mt && e === Vt)
        return Q;
      if (t.lookahead === 0)
        break;
    }
    if (n = 0, t.lookahead >= F && (t.ins_h = zt(t, t.ins_h, t.window[t.strstart + F - 1]), n = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), n !== 0 && t.strstart - n <= t.w_size - mt && (t.match_length = wc(t, n)), t.match_length >= F)
      if (s = Ft(t, t.strstart - t.match_start, t.match_length - F), t.lookahead -= t.match_length, t.match_length <= t.max_lazy_match && t.lookahead >= F) {
        t.match_length--;
        do
          t.strstart++, t.ins_h = zt(t, t.ins_h, t.window[t.strstart + F - 1]), n = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart;
        while (--t.match_length !== 0);
        t.strstart++;
      } else
        t.strstart += t.match_length, t.match_length = 0, t.ins_h = t.window[t.strstart], t.ins_h = zt(t, t.ins_h, t.window[t.strstart + 1]);
    else
      s = Ft(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++;
    if (s && (it(t, !1), t.strm.avail_out === 0))
      return Q;
  }
  return t.insert = t.strstart < F - 1 ? t.strstart : F - 1, e === ct ? (it(t, !0), t.strm.avail_out === 0 ? Kt : Ie) : t.sym_next && (it(t, !1), t.strm.avail_out === 0) ? Q : Ae;
}, oe = (t, e) => {
  let n, s, o;
  for (; ; ) {
    if (t.lookahead < mt) {
      if (ke(t), t.lookahead < mt && e === Vt)
        return Q;
      if (t.lookahead === 0)
        break;
    }
    if (n = 0, t.lookahead >= F && (t.ins_h = zt(t, t.ins_h, t.window[t.strstart + F - 1]), n = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), t.prev_length = t.match_length, t.prev_match = t.match_start, t.match_length = F - 1, n !== 0 && t.prev_length < t.max_lazy_match && t.strstart - n <= t.w_size - mt && (t.match_length = wc(t, n), t.match_length <= 5 && (t.strategy === E1 || t.match_length === F && t.strstart - t.match_start > 4096) && (t.match_length = F - 1)), t.prev_length >= F && t.match_length <= t.prev_length) {
      o = t.strstart + t.lookahead - F, s = Ft(t, t.strstart - 1 - t.prev_match, t.prev_length - F), t.lookahead -= t.prev_length - 1, t.prev_length -= 2;
      do
        ++t.strstart <= o && (t.ins_h = zt(t, t.ins_h, t.window[t.strstart + F - 1]), n = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart);
      while (--t.prev_length !== 0);
      if (t.match_available = 0, t.match_length = F - 1, t.strstart++, s && (it(t, !1), t.strm.avail_out === 0))
        return Q;
    } else if (t.match_available) {
      if (s = Ft(t, 0, t.window[t.strstart - 1]), s && it(t, !1), t.strstart++, t.lookahead--, t.strm.avail_out === 0)
        return Q;
    } else
      t.match_available = 1, t.strstart++, t.lookahead--;
  }
  return t.match_available && (s = Ft(t, 0, t.window[t.strstart - 1]), t.match_available = 0), t.insert = t.strstart < F - 1 ? t.strstart : F - 1, e === ct ? (it(t, !0), t.strm.avail_out === 0 ? Kt : Ie) : t.sym_next && (it(t, !1), t.strm.avail_out === 0) ? Q : Ae;
}, Y1 = (t, e) => {
  let n, s, o, i;
  const r = t.window;
  for (; ; ) {
    if (t.lookahead <= Mt) {
      if (ke(t), t.lookahead <= Mt && e === Vt)
        return Q;
      if (t.lookahead === 0)
        break;
    }
    if (t.match_length = 0, t.lookahead >= F && t.strstart > 0 && (o = t.strstart - 1, s = r[o], s === r[++o] && s === r[++o] && s === r[++o])) {
      i = t.strstart + Mt;
      do
        ;
      while (s === r[++o] && s === r[++o] && s === r[++o] && s === r[++o] && s === r[++o] && s === r[++o] && s === r[++o] && s === r[++o] && o < i);
      t.match_length = Mt - (i - o), t.match_length > t.lookahead && (t.match_length = t.lookahead);
    }
    if (t.match_length >= F ? (n = Ft(t, 1, t.match_length - F), t.lookahead -= t.match_length, t.strstart += t.match_length, t.match_length = 0) : (n = Ft(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++), n && (it(t, !1), t.strm.avail_out === 0))
      return Q;
  }
  return t.insert = 0, e === ct ? (it(t, !0), t.strm.avail_out === 0 ? Kt : Ie) : t.sym_next && (it(t, !1), t.strm.avail_out === 0) ? Q : Ae;
}, X1 = (t, e) => {
  let n;
  for (; ; ) {
    if (t.lookahead === 0 && (ke(t), t.lookahead === 0)) {
      if (e === Vt)
        return Q;
      break;
    }
    if (t.match_length = 0, n = Ft(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++, n && (it(t, !1), t.strm.avail_out === 0))
      return Q;
  }
  return t.insert = 0, e === ct ? (it(t, !0), t.strm.avail_out === 0 ? Kt : Ie) : t.sym_next && (it(t, !1), t.strm.avail_out === 0) ? Q : Ae;
};
function lt(t, e, n, s, o) {
  this.good_length = t, this.max_lazy = e, this.nice_length = n, this.max_chain = s, this.func = o;
}
const ze = [
  /*      good lazy nice chain */
  new lt(0, 0, 0, 0, Sc),
  /* 0 store only */
  new lt(4, 4, 8, 4, bs),
  /* 1 max speed, no lazy matches */
  new lt(4, 5, 16, 8, bs),
  /* 2 */
  new lt(4, 6, 32, 32, bs),
  /* 3 */
  new lt(4, 4, 16, 16, oe),
  /* 4 lazy matches */
  new lt(8, 16, 32, 32, oe),
  /* 5 */
  new lt(8, 16, 128, 128, oe),
  /* 6 */
  new lt(8, 32, 128, 256, oe),
  /* 7 */
  new lt(32, 128, 258, 1024, oe),
  /* 8 */
  new lt(32, 258, 258, 4096, oe)
  /* 9 max compression */
], K1 = (t) => {
  t.window_size = 2 * t.w_size, Tt(t.head), t.max_lazy_match = ze[t.level].max_lazy, t.good_match = ze[t.level].good_length, t.nice_match = ze[t.level].nice_length, t.max_chain_length = ze[t.level].max_chain, t.strstart = 0, t.block_start = 0, t.lookahead = 0, t.insert = 0, t.match_length = t.prev_length = F - 1, t.match_available = 0, t.ins_h = 0;
};
function J1() {
  this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = Qn, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new Uint16Array($1 * 2), this.dyn_dtree = new Uint16Array((2 * U1 + 1) * 2), this.bl_tree = new Uint16Array((2 * N1 + 1) * 2), Tt(this.dyn_ltree), Tt(this.dyn_dtree), Tt(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new Uint16Array(H1 + 1), this.heap = new Uint16Array(2 * Xs + 1), Tt(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new Uint16Array(2 * Xs + 1), Tt(this.depth), this.sym_buf = 0, this.lit_bufsize = 0, this.sym_next = 0, this.sym_end = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
}
const an = (t) => {
  if (!t)
    return 1;
  const e = t.state;
  return !e || e.strm !== t || e.status !== ve && //#ifdef GZIP
  e.status !== To && //#endif
  e.status !== Ks && e.status !== Js && e.status !== Qs && e.status !== to && e.status !== Wt && e.status !== Ve ? 1 : 0;
}, _c = (t) => {
  if (an(t))
    return qt(t, dt);
  t.total_in = t.total_out = 0, t.data_type = R1;
  const e = t.state;
  return e.pending = 0, e.pending_out = 0, e.wrap < 0 && (e.wrap = -e.wrap), e.status = //#ifdef GZIP
  e.wrap === 2 ? To : (
    //#endif
    e.wrap ? ve : Wt
  ), t.adler = e.wrap === 2 ? 0 : 1, e.last_flush = -2, k1(e), q;
}, bc = (t) => {
  const e = _c(t);
  return e === q && K1(t.state), e;
}, Q1 = (t, e) => an(t) || t.state.wrap !== 2 ? dt : (t.state.gzhead = e, q), vc = (t, e, n, s, o, i) => {
  if (!t)
    return dt;
  let r = 1;
  if (e === D1 && (e = 6), s < 0 ? (r = 0, s = -s) : s > 15 && (r = 2, s -= 16), o < 1 || o > F1 || n !== Qn || s < 8 || s > 15 || e < 0 || e > 9 || i < 0 || i > M1 || s === 8 && r !== 1)
    return qt(t, dt);
  s === 8 && (s = 9);
  const a = new J1();
  return t.state = a, a.strm = t, a.status = ve, a.wrap = r, a.gzhead = null, a.w_bits = s, a.w_size = 1 << a.w_bits, a.w_mask = a.w_size - 1, a.hash_bits = o + 7, a.hash_size = 1 << a.hash_bits, a.hash_mask = a.hash_size - 1, a.hash_shift = ~~((a.hash_bits + F - 1) / F), a.window = new Uint8Array(a.w_size * 2), a.head = new Uint16Array(a.hash_size), a.prev = new Uint16Array(a.w_size), a.lit_bufsize = 1 << o + 6, a.pending_buf_size = a.lit_bufsize * 4, a.pending_buf = new Uint8Array(a.pending_buf_size), a.sym_buf = a.lit_bufsize, a.sym_end = (a.lit_bufsize - 1) * 3, a.level = e, a.strategy = i, a.method = n, bc(t);
}, tm = (t, e) => vc(t, e, Qn, V1, z1, L1), em = (t, e) => {
  if (an(t) || e > Ri || e < 0)
    return t ? qt(t, dt) : dt;
  const n = t.state;
  if (!t.output || t.avail_in !== 0 && !t.input || n.status === Ve && e !== ct)
    return qt(t, t.avail_out === 0 ? _s : dt);
  const s = n.last_flush;
  if (n.last_flush = e, n.pending !== 0) {
    if (st(t), t.avail_out === 0)
      return n.last_flush = -1, q;
  } else if (t.avail_in === 0 && Vi(e) <= Vi(s) && e !== ct)
    return qt(t, _s);
  if (n.status === Ve && t.avail_in !== 0)
    return qt(t, _s);
  if (n.status === ve && n.wrap === 0 && (n.status = Wt), n.status === ve) {
    let o = Qn + (n.w_bits - 8 << 4) << 8, i = -1;
    if (n.strategy >= dn || n.level < 2 ? i = 0 : n.level < 6 ? i = 1 : n.level === 6 ? i = 2 : i = 3, o |= i << 6, n.strstart !== 0 && (o |= j1), o += 31 - o % 31, Be(n, o), n.strstart !== 0 && (Be(n, t.adler >>> 16), Be(n, t.adler & 65535)), t.adler = 1, n.status = Wt, st(t), n.pending !== 0)
      return n.last_flush = -1, q;
  }
  if (n.status === To) {
    if (t.adler = 0, V(n, 31), V(n, 139), V(n, 8), n.gzhead)
      V(
        n,
        (n.gzhead.text ? 1 : 0) + (n.gzhead.hcrc ? 2 : 0) + (n.gzhead.extra ? 4 : 0) + (n.gzhead.name ? 8 : 0) + (n.gzhead.comment ? 16 : 0)
      ), V(n, n.gzhead.time & 255), V(n, n.gzhead.time >> 8 & 255), V(n, n.gzhead.time >> 16 & 255), V(n, n.gzhead.time >> 24 & 255), V(n, n.level === 9 ? 2 : n.strategy >= dn || n.level < 2 ? 4 : 0), V(n, n.gzhead.os & 255), n.gzhead.extra && n.gzhead.extra.length && (V(n, n.gzhead.extra.length & 255), V(n, n.gzhead.extra.length >> 8 & 255)), n.gzhead.hcrc && (t.adler = Z(t.adler, n.pending_buf, n.pending, 0)), n.gzindex = 0, n.status = Ks;
    else if (V(n, 0), V(n, 0), V(n, 0), V(n, 0), V(n, 0), V(n, n.level === 9 ? 2 : n.strategy >= dn || n.level < 2 ? 4 : 0), V(n, Z1), n.status = Wt, st(t), n.pending !== 0)
      return n.last_flush = -1, q;
  }
  if (n.status === Ks) {
    if (n.gzhead.extra) {
      let o = n.pending, i = (n.gzhead.extra.length & 65535) - n.gzindex;
      for (; n.pending + i > n.pending_buf_size; ) {
        let a = n.pending_buf_size - n.pending;
        if (n.pending_buf.set(n.gzhead.extra.subarray(n.gzindex, n.gzindex + a), n.pending), n.pending = n.pending_buf_size, n.gzhead.hcrc && n.pending > o && (t.adler = Z(t.adler, n.pending_buf, n.pending - o, o)), n.gzindex += a, st(t), n.pending !== 0)
          return n.last_flush = -1, q;
        o = 0, i -= a;
      }
      let r = new Uint8Array(n.gzhead.extra);
      n.pending_buf.set(r.subarray(n.gzindex, n.gzindex + i), n.pending), n.pending += i, n.gzhead.hcrc && n.pending > o && (t.adler = Z(t.adler, n.pending_buf, n.pending - o, o)), n.gzindex = 0;
    }
    n.status = Js;
  }
  if (n.status === Js) {
    if (n.gzhead.name) {
      let o = n.pending, i;
      do {
        if (n.pending === n.pending_buf_size) {
          if (n.gzhead.hcrc && n.pending > o && (t.adler = Z(t.adler, n.pending_buf, n.pending - o, o)), st(t), n.pending !== 0)
            return n.last_flush = -1, q;
          o = 0;
        }
        n.gzindex < n.gzhead.name.length ? i = n.gzhead.name.charCodeAt(n.gzindex++) & 255 : i = 0, V(n, i);
      } while (i !== 0);
      n.gzhead.hcrc && n.pending > o && (t.adler = Z(t.adler, n.pending_buf, n.pending - o, o)), n.gzindex = 0;
    }
    n.status = Qs;
  }
  if (n.status === Qs) {
    if (n.gzhead.comment) {
      let o = n.pending, i;
      do {
        if (n.pending === n.pending_buf_size) {
          if (n.gzhead.hcrc && n.pending > o && (t.adler = Z(t.adler, n.pending_buf, n.pending - o, o)), st(t), n.pending !== 0)
            return n.last_flush = -1, q;
          o = 0;
        }
        n.gzindex < n.gzhead.comment.length ? i = n.gzhead.comment.charCodeAt(n.gzindex++) & 255 : i = 0, V(n, i);
      } while (i !== 0);
      n.gzhead.hcrc && n.pending > o && (t.adler = Z(t.adler, n.pending_buf, n.pending - o, o));
    }
    n.status = to;
  }
  if (n.status === to) {
    if (n.gzhead.hcrc) {
      if (n.pending + 2 > n.pending_buf_size && (st(t), n.pending !== 0))
        return n.last_flush = -1, q;
      V(n, t.adler & 255), V(n, t.adler >> 8 & 255), t.adler = 0;
    }
    if (n.status = Wt, st(t), n.pending !== 0)
      return n.last_flush = -1, q;
  }
  if (t.avail_in !== 0 || n.lookahead !== 0 || e !== Vt && n.status !== Ve) {
    let o = n.level === 0 ? Sc(n, e) : n.strategy === dn ? X1(n, e) : n.strategy === B1 ? Y1(n, e) : ze[n.level].func(n, e);
    if ((o === Kt || o === Ie) && (n.status = Ve), o === Q || o === Kt)
      return t.avail_out === 0 && (n.last_flush = -1), q;
    if (o === Ae && (e === I1 ? A1(n) : e !== Ri && (Ys(n, 0, 0, !1), e === O1 && (Tt(n.head), n.lookahead === 0 && (n.strstart = 0, n.block_start = 0, n.insert = 0))), st(t), t.avail_out === 0))
      return n.last_flush = -1, q;
  }
  return e !== ct ? q : n.wrap <= 0 ? Fi : (n.wrap === 2 ? (V(n, t.adler & 255), V(n, t.adler >> 8 & 255), V(n, t.adler >> 16 & 255), V(n, t.adler >> 24 & 255), V(n, t.total_in & 255), V(n, t.total_in >> 8 & 255), V(n, t.total_in >> 16 & 255), V(n, t.total_in >> 24 & 255)) : (Be(n, t.adler >>> 16), Be(n, t.adler & 65535)), st(t), n.wrap > 0 && (n.wrap = -n.wrap), n.pending !== 0 ? q : Fi);
}, nm = (t) => {
  if (an(t))
    return dt;
  const e = t.state.status;
  return t.state = null, e === Wt ? qt(t, T1) : q;
}, sm = (t, e) => {
  let n = e.length;
  if (an(t))
    return dt;
  const s = t.state, o = s.wrap;
  if (o === 2 || o === 1 && s.status !== ve || s.lookahead)
    return dt;
  if (o === 1 && (t.adler = Ke(t.adler, e, n, 0)), s.wrap = 0, n >= s.w_size) {
    o === 0 && (Tt(s.head), s.strstart = 0, s.block_start = 0, s.insert = 0);
    let c = new Uint8Array(s.w_size);
    c.set(e.subarray(n - s.w_size, n), 0), e = c, n = s.w_size;
  }
  const i = t.avail_in, r = t.next_in, a = t.input;
  for (t.avail_in = n, t.next_in = 0, t.input = e, ke(s); s.lookahead >= F; ) {
    let c = s.strstart, f = s.lookahead - (F - 1);
    do
      s.ins_h = zt(s, s.ins_h, s.window[c + F - 1]), s.prev[c & s.w_mask] = s.head[s.ins_h], s.head[s.ins_h] = c, c++;
    while (--f);
    s.strstart = c, s.lookahead = F - 1, ke(s);
  }
  return s.strstart += s.lookahead, s.block_start = s.strstart, s.insert = s.lookahead, s.lookahead = 0, s.match_length = s.prev_length = F - 1, s.match_available = 0, t.next_in = r, t.input = a, t.avail_in = i, s.wrap = o, q;
};
var om = tm, im = vc, rm = bc, am = _c, cm = Q1, fm = em, um = nm, lm = sm, hm = "pako deflate (from Nodeca project)", Ne = {
  deflateInit: om,
  deflateInit2: im,
  deflateReset: rm,
  deflateResetKeep: am,
  deflateSetHeader: cm,
  deflate: fm,
  deflateEnd: um,
  deflateSetDictionary: lm,
  deflateInfo: hm
};
const pm = (t, e) => Object.prototype.hasOwnProperty.call(t, e);
var gm = function(t) {
  const e = Array.prototype.slice.call(arguments, 1);
  for (; e.length; ) {
    const n = e.shift();
    if (n) {
      if (typeof n != "object")
        throw new TypeError(n + "must be non-object");
      for (const s in n)
        pm(n, s) && (t[s] = n[s]);
    }
  }
  return t;
}, dm = (t) => {
  let e = 0;
  for (let s = 0, o = t.length; s < o; s++)
    e += t[s].length;
  const n = new Uint8Array(e);
  for (let s = 0, o = 0, i = t.length; s < i; s++) {
    let r = t[s];
    n.set(r, o), o += r.length;
  }
  return n;
}, ts = {
  assign: gm,
  flattenChunks: dm
};
let kc = !0;
try {
  String.fromCharCode.apply(null, new Uint8Array(1));
} catch {
  kc = !1;
}
const Je = new Uint8Array(256);
for (let t = 0; t < 256; t++)
  Je[t] = t >= 252 ? 6 : t >= 248 ? 5 : t >= 240 ? 4 : t >= 224 ? 3 : t >= 192 ? 2 : 1;
Je[254] = Je[254] = 1;
var mm = (t) => {
  if (typeof TextEncoder == "function" && TextEncoder.prototype.encode)
    return new TextEncoder().encode(t);
  let e, n, s, o, i, r = t.length, a = 0;
  for (o = 0; o < r; o++)
    n = t.charCodeAt(o), (n & 64512) === 55296 && o + 1 < r && (s = t.charCodeAt(o + 1), (s & 64512) === 56320 && (n = 65536 + (n - 55296 << 10) + (s - 56320), o++)), a += n < 128 ? 1 : n < 2048 ? 2 : n < 65536 ? 3 : 4;
  for (e = new Uint8Array(a), i = 0, o = 0; i < a; o++)
    n = t.charCodeAt(o), (n & 64512) === 55296 && o + 1 < r && (s = t.charCodeAt(o + 1), (s & 64512) === 56320 && (n = 65536 + (n - 55296 << 10) + (s - 56320), o++)), n < 128 ? e[i++] = n : n < 2048 ? (e[i++] = 192 | n >>> 6, e[i++] = 128 | n & 63) : n < 65536 ? (e[i++] = 224 | n >>> 12, e[i++] = 128 | n >>> 6 & 63, e[i++] = 128 | n & 63) : (e[i++] = 240 | n >>> 18, e[i++] = 128 | n >>> 12 & 63, e[i++] = 128 | n >>> 6 & 63, e[i++] = 128 | n & 63);
  return e;
};
const ym = (t, e) => {
  if (e < 65534 && t.subarray && kc)
    return String.fromCharCode.apply(null, t.length === e ? t : t.subarray(0, e));
  let n = "";
  for (let s = 0; s < e; s++)
    n += String.fromCharCode(t[s]);
  return n;
};
var xm = (t, e) => {
  const n = e || t.length;
  if (typeof TextDecoder == "function" && TextDecoder.prototype.decode)
    return new TextDecoder().decode(t.subarray(0, e));
  let s, o;
  const i = new Array(n * 2);
  for (o = 0, s = 0; s < n; ) {
    let r = t[s++];
    if (r < 128) {
      i[o++] = r;
      continue;
    }
    let a = Je[r];
    if (a > 4) {
      i[o++] = 65533, s += a - 1;
      continue;
    }
    for (r &= a === 2 ? 31 : a === 3 ? 15 : 7; a > 1 && s < n; )
      r = r << 6 | t[s++] & 63, a--;
    if (a > 1) {
      i[o++] = 65533;
      continue;
    }
    r < 65536 ? i[o++] = r : (r -= 65536, i[o++] = 55296 | r >> 10 & 1023, i[o++] = 56320 | r & 1023);
  }
  return ym(i, o);
}, wm = (t, e) => {
  e = e || t.length, e > t.length && (e = t.length);
  let n = e - 1;
  for (; n >= 0 && (t[n] & 192) === 128; )
    n--;
  return n < 0 || n === 0 ? e : n + Je[t[n]] > e ? n : e;
}, Qe = {
  string2buf: mm,
  buf2string: xm,
  utf8border: wm
};
function Sm() {
  this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
}
var Cc = Sm;
const Ac = Object.prototype.toString, {
  Z_NO_FLUSH: _m,
  Z_SYNC_FLUSH: bm,
  Z_FULL_FLUSH: vm,
  Z_FINISH: km,
  Z_OK: Vn,
  Z_STREAM_END: Cm,
  Z_DEFAULT_COMPRESSION: Am,
  Z_DEFAULT_STRATEGY: Im,
  Z_DEFLATED: Om
} = Jn;
function es(t) {
  this.options = ts.assign({
    level: Am,
    method: Om,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: Im
  }, t || {});
  let e = this.options;
  e.raw && e.windowBits > 0 ? e.windowBits = -e.windowBits : e.gzip && e.windowBits > 0 && e.windowBits < 16 && (e.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new Cc(), this.strm.avail_out = 0;
  let n = Ne.deflateInit2(
    this.strm,
    e.level,
    e.method,
    e.windowBits,
    e.memLevel,
    e.strategy
  );
  if (n !== Vn)
    throw new Error(Xt[n]);
  if (e.header && Ne.deflateSetHeader(this.strm, e.header), e.dictionary) {
    let s;
    if (typeof e.dictionary == "string" ? s = Qe.string2buf(e.dictionary) : Ac.call(e.dictionary) === "[object ArrayBuffer]" ? s = new Uint8Array(e.dictionary) : s = e.dictionary, n = Ne.deflateSetDictionary(this.strm, s), n !== Vn)
      throw new Error(Xt[n]);
    this._dict_set = !0;
  }
}
es.prototype.push = function(t, e) {
  const n = this.strm, s = this.options.chunkSize;
  let o, i;
  if (this.ended)
    return !1;
  for (e === ~~e ? i = e : i = e === !0 ? km : _m, typeof t == "string" ? n.input = Qe.string2buf(t) : Ac.call(t) === "[object ArrayBuffer]" ? n.input = new Uint8Array(t) : n.input = t, n.next_in = 0, n.avail_in = n.input.length; ; ) {
    if (n.avail_out === 0 && (n.output = new Uint8Array(s), n.next_out = 0, n.avail_out = s), (i === bm || i === vm) && n.avail_out <= 6) {
      this.onData(n.output.subarray(0, n.next_out)), n.avail_out = 0;
      continue;
    }
    if (o = Ne.deflate(n, i), o === Cm)
      return n.next_out > 0 && this.onData(n.output.subarray(0, n.next_out)), o = Ne.deflateEnd(this.strm), this.onEnd(o), this.ended = !0, o === Vn;
    if (n.avail_out === 0) {
      this.onData(n.output);
      continue;
    }
    if (i > 0 && n.next_out > 0) {
      this.onData(n.output.subarray(0, n.next_out)), n.avail_out = 0;
      continue;
    }
    if (n.avail_in === 0) break;
  }
  return !0;
};
es.prototype.onData = function(t) {
  this.chunks.push(t);
};
es.prototype.onEnd = function(t) {
  t === Vn && (this.result = ts.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;
};
function Tm(t, e) {
  const n = new es(e);
  if (n.push(t, !0), n.err)
    throw n.msg || Xt[n.err];
  return n.result;
}
var Dm = Tm, Em = {
  deflate: Dm
};
const mn = 16209, Bm = 16191;
var Mm = function(e, n) {
  let s, o, i, r, a, c, f, u, l, h, g, p, d, x, m, y, _, w, S, b, v, I, A, C;
  const O = e.state;
  s = e.next_in, A = e.input, o = s + (e.avail_in - 5), i = e.next_out, C = e.output, r = i - (n - e.avail_out), a = i + (e.avail_out - 257), c = O.dmax, f = O.wsize, u = O.whave, l = O.wnext, h = O.window, g = O.hold, p = O.bits, d = O.lencode, x = O.distcode, m = (1 << O.lenbits) - 1, y = (1 << O.distbits) - 1;
  t:
    do {
      p < 15 && (g += A[s++] << p, p += 8, g += A[s++] << p, p += 8), _ = d[g & m];
      e:
        for (; ; ) {
          if (w = _ >>> 24, g >>>= w, p -= w, w = _ >>> 16 & 255, w === 0)
            C[i++] = _ & 65535;
          else if (w & 16) {
            S = _ & 65535, w &= 15, w && (p < w && (g += A[s++] << p, p += 8), S += g & (1 << w) - 1, g >>>= w, p -= w), p < 15 && (g += A[s++] << p, p += 8, g += A[s++] << p, p += 8), _ = x[g & y];
            n:
              for (; ; ) {
                if (w = _ >>> 24, g >>>= w, p -= w, w = _ >>> 16 & 255, w & 16) {
                  if (b = _ & 65535, w &= 15, p < w && (g += A[s++] << p, p += 8, p < w && (g += A[s++] << p, p += 8)), b += g & (1 << w) - 1, b > c) {
                    e.msg = "invalid distance too far back", O.mode = mn;
                    break t;
                  }
                  if (g >>>= w, p -= w, w = i - r, b > w) {
                    if (w = b - w, w > u && O.sane) {
                      e.msg = "invalid distance too far back", O.mode = mn;
                      break t;
                    }
                    if (v = 0, I = h, l === 0) {
                      if (v += f - w, w < S) {
                        S -= w;
                        do
                          C[i++] = h[v++];
                        while (--w);
                        v = i - b, I = C;
                      }
                    } else if (l < w) {
                      if (v += f + l - w, w -= l, w < S) {
                        S -= w;
                        do
                          C[i++] = h[v++];
                        while (--w);
                        if (v = 0, l < S) {
                          w = l, S -= w;
                          do
                            C[i++] = h[v++];
                          while (--w);
                          v = i - b, I = C;
                        }
                      }
                    } else if (v += l - w, w < S) {
                      S -= w;
                      do
                        C[i++] = h[v++];
                      while (--w);
                      v = i - b, I = C;
                    }
                    for (; S > 2; )
                      C[i++] = I[v++], C[i++] = I[v++], C[i++] = I[v++], S -= 3;
                    S && (C[i++] = I[v++], S > 1 && (C[i++] = I[v++]));
                  } else {
                    v = i - b;
                    do
                      C[i++] = C[v++], C[i++] = C[v++], C[i++] = C[v++], S -= 3;
                    while (S > 2);
                    S && (C[i++] = C[v++], S > 1 && (C[i++] = C[v++]));
                  }
                } else if ((w & 64) === 0) {
                  _ = x[(_ & 65535) + (g & (1 << w) - 1)];
                  continue n;
                } else {
                  e.msg = "invalid distance code", O.mode = mn;
                  break t;
                }
                break;
              }
          } else if ((w & 64) === 0) {
            _ = d[(_ & 65535) + (g & (1 << w) - 1)];
            continue e;
          } else if (w & 32) {
            O.mode = Bm;
            break t;
          } else {
            e.msg = "invalid literal/length code", O.mode = mn;
            break t;
          }
          break;
        }
    } while (s < o && i < a);
  S = p >> 3, s -= S, p -= S << 3, g &= (1 << p) - 1, e.next_in = s, e.next_out = i, e.avail_in = s < o ? 5 + (o - s) : 5 - (s - o), e.avail_out = i < a ? 257 + (a - i) : 257 - (i - a), O.hold = g, O.bits = p;
};
const ie = 15, zi = 852, Pi = 592, Gi = 0, vs = 1, Ui = 2, Lm = new Uint16Array([
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
]), Rm = new Uint8Array([
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
]), Fm = new Uint16Array([
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
]), Vm = new Uint8Array([
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
]), zm = (t, e, n, s, o, i, r, a) => {
  const c = a.bits;
  let f = 0, u = 0, l = 0, h = 0, g = 0, p = 0, d = 0, x = 0, m = 0, y = 0, _, w, S, b, v, I = null, A;
  const C = new Uint16Array(ie + 1), O = new Uint16Array(ie + 1);
  let T = null, D, E, M;
  for (f = 0; f <= ie; f++)
    C[f] = 0;
  for (u = 0; u < s; u++)
    C[e[n + u]]++;
  for (g = c, h = ie; h >= 1 && C[h] === 0; h--)
    ;
  if (g > h && (g = h), h === 0)
    return o[i++] = 1 << 24 | 64 << 16 | 0, o[i++] = 1 << 24 | 64 << 16 | 0, a.bits = 1, 0;
  for (l = 1; l < h && C[l] === 0; l++)
    ;
  for (g < l && (g = l), x = 1, f = 1; f <= ie; f++)
    if (x <<= 1, x -= C[f], x < 0)
      return -1;
  if (x > 0 && (t === Gi || h !== 1))
    return -1;
  for (O[1] = 0, f = 1; f < ie; f++)
    O[f + 1] = O[f] + C[f];
  for (u = 0; u < s; u++)
    e[n + u] !== 0 && (r[O[e[n + u]]++] = u);
  if (t === Gi ? (I = T = r, A = 20) : t === vs ? (I = Lm, T = Rm, A = 257) : (I = Fm, T = Vm, A = 0), y = 0, u = 0, f = l, v = i, p = g, d = 0, S = -1, m = 1 << g, b = m - 1, t === vs && m > zi || t === Ui && m > Pi)
    return 1;
  for (; ; ) {
    D = f - d, r[u] + 1 < A ? (E = 0, M = r[u]) : r[u] >= A ? (E = T[r[u] - A], M = I[r[u] - A]) : (E = 96, M = 0), _ = 1 << f - d, w = 1 << p, l = w;
    do
      w -= _, o[v + (y >> d) + w] = D << 24 | E << 16 | M | 0;
    while (w !== 0);
    for (_ = 1 << f - 1; y & _; )
      _ >>= 1;
    if (_ !== 0 ? (y &= _ - 1, y += _) : y = 0, u++, --C[f] === 0) {
      if (f === h)
        break;
      f = e[n + r[u]];
    }
    if (f > g && (y & b) !== S) {
      for (d === 0 && (d = g), v += l, p = f - d, x = 1 << p; p + d < h && (x -= C[p + d], !(x <= 0)); )
        p++, x <<= 1;
      if (m += 1 << p, t === vs && m > zi || t === Ui && m > Pi)
        return 1;
      S = y & b, o[S] = g << 24 | p << 16 | v - i | 0;
    }
  }
  return y !== 0 && (o[v + y] = f - d << 24 | 64 << 16 | 0), a.bits = g, 0;
};
var $e = zm;
const Pm = 0, Ic = 1, Oc = 2, {
  Z_FINISH: Ni,
  Z_BLOCK: Gm,
  Z_TREES: yn,
  Z_OK: Jt,
  Z_STREAM_END: Um,
  Z_NEED_DICT: Nm,
  Z_STREAM_ERROR: ft,
  Z_DATA_ERROR: Tc,
  Z_MEM_ERROR: Dc,
  Z_BUF_ERROR: $m,
  Z_DEFLATED: $i
} = Jn, ns = 16180, Hi = 16181, ji = 16182, Zi = 16183, Wi = 16184, qi = 16185, Yi = 16186, Xi = 16187, Ki = 16188, Ji = 16189, zn = 16190, _t = 16191, ks = 16192, Qi = 16193, Cs = 16194, tr = 16195, er = 16196, nr = 16197, sr = 16198, xn = 16199, wn = 16200, or = 16201, ir = 16202, rr = 16203, ar = 16204, cr = 16205, As = 16206, fr = 16207, ur = 16208, $ = 16209, Ec = 16210, Bc = 16211, Hm = 852, jm = 592, Zm = 15, Wm = Zm, lr = (t) => (t >>> 24 & 255) + (t >>> 8 & 65280) + ((t & 65280) << 8) + ((t & 255) << 24);
function qm() {
  this.strm = null, this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new Uint16Array(320), this.work = new Uint16Array(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
}
const te = (t) => {
  if (!t)
    return 1;
  const e = t.state;
  return !e || e.strm !== t || e.mode < ns || e.mode > Bc ? 1 : 0;
}, Mc = (t) => {
  if (te(t))
    return ft;
  const e = t.state;
  return t.total_in = t.total_out = e.total = 0, t.msg = "", e.wrap && (t.adler = e.wrap & 1), e.mode = ns, e.last = 0, e.havedict = 0, e.flags = -1, e.dmax = 32768, e.head = null, e.hold = 0, e.bits = 0, e.lencode = e.lendyn = new Int32Array(Hm), e.distcode = e.distdyn = new Int32Array(jm), e.sane = 1, e.back = -1, Jt;
}, Lc = (t) => {
  if (te(t))
    return ft;
  const e = t.state;
  return e.wsize = 0, e.whave = 0, e.wnext = 0, Mc(t);
}, Rc = (t, e) => {
  let n;
  if (te(t))
    return ft;
  const s = t.state;
  return e < 0 ? (n = 0, e = -e) : (n = (e >> 4) + 5, e < 48 && (e &= 15)), e && (e < 8 || e > 15) ? ft : (s.window !== null && s.wbits !== e && (s.window = null), s.wrap = n, s.wbits = e, Lc(t));
}, Fc = (t, e) => {
  if (!t)
    return ft;
  const n = new qm();
  t.state = n, n.strm = t, n.window = null, n.mode = ns;
  const s = Rc(t, e);
  return s !== Jt && (t.state = null), s;
}, Ym = (t) => Fc(t, Wm);
let hr = !0, Is, Os;
const Xm = (t) => {
  if (hr) {
    Is = new Int32Array(512), Os = new Int32Array(32);
    let e = 0;
    for (; e < 144; )
      t.lens[e++] = 8;
    for (; e < 256; )
      t.lens[e++] = 9;
    for (; e < 280; )
      t.lens[e++] = 7;
    for (; e < 288; )
      t.lens[e++] = 8;
    for ($e(Ic, t.lens, 0, 288, Is, 0, t.work, { bits: 9 }), e = 0; e < 32; )
      t.lens[e++] = 5;
    $e(Oc, t.lens, 0, 32, Os, 0, t.work, { bits: 5 }), hr = !1;
  }
  t.lencode = Is, t.lenbits = 9, t.distcode = Os, t.distbits = 5;
}, Vc = (t, e, n, s) => {
  let o;
  const i = t.state;
  return i.window === null && (i.wsize = 1 << i.wbits, i.wnext = 0, i.whave = 0, i.window = new Uint8Array(i.wsize)), s >= i.wsize ? (i.window.set(e.subarray(n - i.wsize, n), 0), i.wnext = 0, i.whave = i.wsize) : (o = i.wsize - i.wnext, o > s && (o = s), i.window.set(e.subarray(n - s, n - s + o), i.wnext), s -= o, s ? (i.window.set(e.subarray(n - s, n), 0), i.wnext = s, i.whave = i.wsize) : (i.wnext += o, i.wnext === i.wsize && (i.wnext = 0), i.whave < i.wsize && (i.whave += o))), 0;
}, Km = (t, e) => {
  let n, s, o, i, r, a, c, f, u, l, h, g, p, d, x = 0, m, y, _, w, S, b, v, I;
  const A = new Uint8Array(4);
  let C, O;
  const T = (
    /* permutation of code lengths */
    new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15])
  );
  if (te(t) || !t.output || !t.input && t.avail_in !== 0)
    return ft;
  n = t.state, n.mode === _t && (n.mode = ks), r = t.next_out, o = t.output, c = t.avail_out, i = t.next_in, s = t.input, a = t.avail_in, f = n.hold, u = n.bits, l = a, h = c, I = Jt;
  t:
    for (; ; )
      switch (n.mode) {
        case ns:
          if (n.wrap === 0) {
            n.mode = ks;
            break;
          }
          for (; u < 16; ) {
            if (a === 0)
              break t;
            a--, f += s[i++] << u, u += 8;
          }
          if (n.wrap & 2 && f === 35615) {
            n.wbits === 0 && (n.wbits = 15), n.check = 0, A[0] = f & 255, A[1] = f >>> 8 & 255, n.check = Z(n.check, A, 2, 0), f = 0, u = 0, n.mode = Hi;
            break;
          }
          if (n.head && (n.head.done = !1), !(n.wrap & 1) || /* check if zlib header allowed */
          (((f & 255) << 8) + (f >> 8)) % 31) {
            t.msg = "incorrect header check", n.mode = $;
            break;
          }
          if ((f & 15) !== $i) {
            t.msg = "unknown compression method", n.mode = $;
            break;
          }
          if (f >>>= 4, u -= 4, v = (f & 15) + 8, n.wbits === 0 && (n.wbits = v), v > 15 || v > n.wbits) {
            t.msg = "invalid window size", n.mode = $;
            break;
          }
          n.dmax = 1 << n.wbits, n.flags = 0, t.adler = n.check = 1, n.mode = f & 512 ? Ji : _t, f = 0, u = 0;
          break;
        case Hi:
          for (; u < 16; ) {
            if (a === 0)
              break t;
            a--, f += s[i++] << u, u += 8;
          }
          if (n.flags = f, (n.flags & 255) !== $i) {
            t.msg = "unknown compression method", n.mode = $;
            break;
          }
          if (n.flags & 57344) {
            t.msg = "unknown header flags set", n.mode = $;
            break;
          }
          n.head && (n.head.text = f >> 8 & 1), n.flags & 512 && n.wrap & 4 && (A[0] = f & 255, A[1] = f >>> 8 & 255, n.check = Z(n.check, A, 2, 0)), f = 0, u = 0, n.mode = ji;
        /* falls through */
        case ji:
          for (; u < 32; ) {
            if (a === 0)
              break t;
            a--, f += s[i++] << u, u += 8;
          }
          n.head && (n.head.time = f), n.flags & 512 && n.wrap & 4 && (A[0] = f & 255, A[1] = f >>> 8 & 255, A[2] = f >>> 16 & 255, A[3] = f >>> 24 & 255, n.check = Z(n.check, A, 4, 0)), f = 0, u = 0, n.mode = Zi;
        /* falls through */
        case Zi:
          for (; u < 16; ) {
            if (a === 0)
              break t;
            a--, f += s[i++] << u, u += 8;
          }
          n.head && (n.head.xflags = f & 255, n.head.os = f >> 8), n.flags & 512 && n.wrap & 4 && (A[0] = f & 255, A[1] = f >>> 8 & 255, n.check = Z(n.check, A, 2, 0)), f = 0, u = 0, n.mode = Wi;
        /* falls through */
        case Wi:
          if (n.flags & 1024) {
            for (; u < 16; ) {
              if (a === 0)
                break t;
              a--, f += s[i++] << u, u += 8;
            }
            n.length = f, n.head && (n.head.extra_len = f), n.flags & 512 && n.wrap & 4 && (A[0] = f & 255, A[1] = f >>> 8 & 255, n.check = Z(n.check, A, 2, 0)), f = 0, u = 0;
          } else n.head && (n.head.extra = null);
          n.mode = qi;
        /* falls through */
        case qi:
          if (n.flags & 1024 && (g = n.length, g > a && (g = a), g && (n.head && (v = n.head.extra_len - n.length, n.head.extra || (n.head.extra = new Uint8Array(n.head.extra_len)), n.head.extra.set(
            s.subarray(
              i,
              // extra field is limited to 65536 bytes
              // - no need for additional size check
              i + g
            ),
            /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
            v
          )), n.flags & 512 && n.wrap & 4 && (n.check = Z(n.check, s, g, i)), a -= g, i += g, n.length -= g), n.length))
            break t;
          n.length = 0, n.mode = Yi;
        /* falls through */
        case Yi:
          if (n.flags & 2048) {
            if (a === 0)
              break t;
            g = 0;
            do
              v = s[i + g++], n.head && v && n.length < 65536 && (n.head.name += String.fromCharCode(v));
            while (v && g < a);
            if (n.flags & 512 && n.wrap & 4 && (n.check = Z(n.check, s, g, i)), a -= g, i += g, v)
              break t;
          } else n.head && (n.head.name = null);
          n.length = 0, n.mode = Xi;
        /* falls through */
        case Xi:
          if (n.flags & 4096) {
            if (a === 0)
              break t;
            g = 0;
            do
              v = s[i + g++], n.head && v && n.length < 65536 && (n.head.comment += String.fromCharCode(v));
            while (v && g < a);
            if (n.flags & 512 && n.wrap & 4 && (n.check = Z(n.check, s, g, i)), a -= g, i += g, v)
              break t;
          } else n.head && (n.head.comment = null);
          n.mode = Ki;
        /* falls through */
        case Ki:
          if (n.flags & 512) {
            for (; u < 16; ) {
              if (a === 0)
                break t;
              a--, f += s[i++] << u, u += 8;
            }
            if (n.wrap & 4 && f !== (n.check & 65535)) {
              t.msg = "header crc mismatch", n.mode = $;
              break;
            }
            f = 0, u = 0;
          }
          n.head && (n.head.hcrc = n.flags >> 9 & 1, n.head.done = !0), t.adler = n.check = 0, n.mode = _t;
          break;
        case Ji:
          for (; u < 32; ) {
            if (a === 0)
              break t;
            a--, f += s[i++] << u, u += 8;
          }
          t.adler = n.check = lr(f), f = 0, u = 0, n.mode = zn;
        /* falls through */
        case zn:
          if (n.havedict === 0)
            return t.next_out = r, t.avail_out = c, t.next_in = i, t.avail_in = a, n.hold = f, n.bits = u, Nm;
          t.adler = n.check = 1, n.mode = _t;
        /* falls through */
        case _t:
          if (e === Gm || e === yn)
            break t;
        /* falls through */
        case ks:
          if (n.last) {
            f >>>= u & 7, u -= u & 7, n.mode = As;
            break;
          }
          for (; u < 3; ) {
            if (a === 0)
              break t;
            a--, f += s[i++] << u, u += 8;
          }
          switch (n.last = f & 1, f >>>= 1, u -= 1, f & 3) {
            case 0:
              n.mode = Qi;
              break;
            case 1:
              if (Xm(n), n.mode = xn, e === yn) {
                f >>>= 2, u -= 2;
                break t;
              }
              break;
            case 2:
              n.mode = er;
              break;
            case 3:
              t.msg = "invalid block type", n.mode = $;
          }
          f >>>= 2, u -= 2;
          break;
        case Qi:
          for (f >>>= u & 7, u -= u & 7; u < 32; ) {
            if (a === 0)
              break t;
            a--, f += s[i++] << u, u += 8;
          }
          if ((f & 65535) !== (f >>> 16 ^ 65535)) {
            t.msg = "invalid stored block lengths", n.mode = $;
            break;
          }
          if (n.length = f & 65535, f = 0, u = 0, n.mode = Cs, e === yn)
            break t;
        /* falls through */
        case Cs:
          n.mode = tr;
        /* falls through */
        case tr:
          if (g = n.length, g) {
            if (g > a && (g = a), g > c && (g = c), g === 0)
              break t;
            o.set(s.subarray(i, i + g), r), a -= g, i += g, c -= g, r += g, n.length -= g;
            break;
          }
          n.mode = _t;
          break;
        case er:
          for (; u < 14; ) {
            if (a === 0)
              break t;
            a--, f += s[i++] << u, u += 8;
          }
          if (n.nlen = (f & 31) + 257, f >>>= 5, u -= 5, n.ndist = (f & 31) + 1, f >>>= 5, u -= 5, n.ncode = (f & 15) + 4, f >>>= 4, u -= 4, n.nlen > 286 || n.ndist > 30) {
            t.msg = "too many length or distance symbols", n.mode = $;
            break;
          }
          n.have = 0, n.mode = nr;
        /* falls through */
        case nr:
          for (; n.have < n.ncode; ) {
            for (; u < 3; ) {
              if (a === 0)
                break t;
              a--, f += s[i++] << u, u += 8;
            }
            n.lens[T[n.have++]] = f & 7, f >>>= 3, u -= 3;
          }
          for (; n.have < 19; )
            n.lens[T[n.have++]] = 0;
          if (n.lencode = n.lendyn, n.lenbits = 7, C = { bits: n.lenbits }, I = $e(Pm, n.lens, 0, 19, n.lencode, 0, n.work, C), n.lenbits = C.bits, I) {
            t.msg = "invalid code lengths set", n.mode = $;
            break;
          }
          n.have = 0, n.mode = sr;
        /* falls through */
        case sr:
          for (; n.have < n.nlen + n.ndist; ) {
            for (; x = n.lencode[f & (1 << n.lenbits) - 1], m = x >>> 24, y = x >>> 16 & 255, _ = x & 65535, !(m <= u); ) {
              if (a === 0)
                break t;
              a--, f += s[i++] << u, u += 8;
            }
            if (_ < 16)
              f >>>= m, u -= m, n.lens[n.have++] = _;
            else {
              if (_ === 16) {
                for (O = m + 2; u < O; ) {
                  if (a === 0)
                    break t;
                  a--, f += s[i++] << u, u += 8;
                }
                if (f >>>= m, u -= m, n.have === 0) {
                  t.msg = "invalid bit length repeat", n.mode = $;
                  break;
                }
                v = n.lens[n.have - 1], g = 3 + (f & 3), f >>>= 2, u -= 2;
              } else if (_ === 17) {
                for (O = m + 3; u < O; ) {
                  if (a === 0)
                    break t;
                  a--, f += s[i++] << u, u += 8;
                }
                f >>>= m, u -= m, v = 0, g = 3 + (f & 7), f >>>= 3, u -= 3;
              } else {
                for (O = m + 7; u < O; ) {
                  if (a === 0)
                    break t;
                  a--, f += s[i++] << u, u += 8;
                }
                f >>>= m, u -= m, v = 0, g = 11 + (f & 127), f >>>= 7, u -= 7;
              }
              if (n.have + g > n.nlen + n.ndist) {
                t.msg = "invalid bit length repeat", n.mode = $;
                break;
              }
              for (; g--; )
                n.lens[n.have++] = v;
            }
          }
          if (n.mode === $)
            break;
          if (n.lens[256] === 0) {
            t.msg = "invalid code -- missing end-of-block", n.mode = $;
            break;
          }
          if (n.lenbits = 9, C = { bits: n.lenbits }, I = $e(Ic, n.lens, 0, n.nlen, n.lencode, 0, n.work, C), n.lenbits = C.bits, I) {
            t.msg = "invalid literal/lengths set", n.mode = $;
            break;
          }
          if (n.distbits = 6, n.distcode = n.distdyn, C = { bits: n.distbits }, I = $e(Oc, n.lens, n.nlen, n.ndist, n.distcode, 0, n.work, C), n.distbits = C.bits, I) {
            t.msg = "invalid distances set", n.mode = $;
            break;
          }
          if (n.mode = xn, e === yn)
            break t;
        /* falls through */
        case xn:
          n.mode = wn;
        /* falls through */
        case wn:
          if (a >= 6 && c >= 258) {
            t.next_out = r, t.avail_out = c, t.next_in = i, t.avail_in = a, n.hold = f, n.bits = u, Mm(t, h), r = t.next_out, o = t.output, c = t.avail_out, i = t.next_in, s = t.input, a = t.avail_in, f = n.hold, u = n.bits, n.mode === _t && (n.back = -1);
            break;
          }
          for (n.back = 0; x = n.lencode[f & (1 << n.lenbits) - 1], m = x >>> 24, y = x >>> 16 & 255, _ = x & 65535, !(m <= u); ) {
            if (a === 0)
              break t;
            a--, f += s[i++] << u, u += 8;
          }
          if (y && (y & 240) === 0) {
            for (w = m, S = y, b = _; x = n.lencode[b + ((f & (1 << w + S) - 1) >> w)], m = x >>> 24, y = x >>> 16 & 255, _ = x & 65535, !(w + m <= u); ) {
              if (a === 0)
                break t;
              a--, f += s[i++] << u, u += 8;
            }
            f >>>= w, u -= w, n.back += w;
          }
          if (f >>>= m, u -= m, n.back += m, n.length = _, y === 0) {
            n.mode = cr;
            break;
          }
          if (y & 32) {
            n.back = -1, n.mode = _t;
            break;
          }
          if (y & 64) {
            t.msg = "invalid literal/length code", n.mode = $;
            break;
          }
          n.extra = y & 15, n.mode = or;
        /* falls through */
        case or:
          if (n.extra) {
            for (O = n.extra; u < O; ) {
              if (a === 0)
                break t;
              a--, f += s[i++] << u, u += 8;
            }
            n.length += f & (1 << n.extra) - 1, f >>>= n.extra, u -= n.extra, n.back += n.extra;
          }
          n.was = n.length, n.mode = ir;
        /* falls through */
        case ir:
          for (; x = n.distcode[f & (1 << n.distbits) - 1], m = x >>> 24, y = x >>> 16 & 255, _ = x & 65535, !(m <= u); ) {
            if (a === 0)
              break t;
            a--, f += s[i++] << u, u += 8;
          }
          if ((y & 240) === 0) {
            for (w = m, S = y, b = _; x = n.distcode[b + ((f & (1 << w + S) - 1) >> w)], m = x >>> 24, y = x >>> 16 & 255, _ = x & 65535, !(w + m <= u); ) {
              if (a === 0)
                break t;
              a--, f += s[i++] << u, u += 8;
            }
            f >>>= w, u -= w, n.back += w;
          }
          if (f >>>= m, u -= m, n.back += m, y & 64) {
            t.msg = "invalid distance code", n.mode = $;
            break;
          }
          n.offset = _, n.extra = y & 15, n.mode = rr;
        /* falls through */
        case rr:
          if (n.extra) {
            for (O = n.extra; u < O; ) {
              if (a === 0)
                break t;
              a--, f += s[i++] << u, u += 8;
            }
            n.offset += f & (1 << n.extra) - 1, f >>>= n.extra, u -= n.extra, n.back += n.extra;
          }
          if (n.offset > n.dmax) {
            t.msg = "invalid distance too far back", n.mode = $;
            break;
          }
          n.mode = ar;
        /* falls through */
        case ar:
          if (c === 0)
            break t;
          if (g = h - c, n.offset > g) {
            if (g = n.offset - g, g > n.whave && n.sane) {
              t.msg = "invalid distance too far back", n.mode = $;
              break;
            }
            g > n.wnext ? (g -= n.wnext, p = n.wsize - g) : p = n.wnext - g, g > n.length && (g = n.length), d = n.window;
          } else
            d = o, p = r - n.offset, g = n.length;
          g > c && (g = c), c -= g, n.length -= g;
          do
            o[r++] = d[p++];
          while (--g);
          n.length === 0 && (n.mode = wn);
          break;
        case cr:
          if (c === 0)
            break t;
          o[r++] = n.length, c--, n.mode = wn;
          break;
        case As:
          if (n.wrap) {
            for (; u < 32; ) {
              if (a === 0)
                break t;
              a--, f |= s[i++] << u, u += 8;
            }
            if (h -= c, t.total_out += h, n.total += h, n.wrap & 4 && h && (t.adler = n.check = /*UPDATE_CHECK(state.check, put - _out, _out);*/
            n.flags ? Z(n.check, o, h, r - h) : Ke(n.check, o, h, r - h)), h = c, n.wrap & 4 && (n.flags ? f : lr(f)) !== n.check) {
              t.msg = "incorrect data check", n.mode = $;
              break;
            }
            f = 0, u = 0;
          }
          n.mode = fr;
        /* falls through */
        case fr:
          if (n.wrap && n.flags) {
            for (; u < 32; ) {
              if (a === 0)
                break t;
              a--, f += s[i++] << u, u += 8;
            }
            if (n.wrap & 4 && f !== (n.total & 4294967295)) {
              t.msg = "incorrect length check", n.mode = $;
              break;
            }
            f = 0, u = 0;
          }
          n.mode = ur;
        /* falls through */
        case ur:
          I = Um;
          break t;
        case $:
          I = Tc;
          break t;
        case Ec:
          return Dc;
        case Bc:
        /* falls through */
        default:
          return ft;
      }
  return t.next_out = r, t.avail_out = c, t.next_in = i, t.avail_in = a, n.hold = f, n.bits = u, (n.wsize || h !== t.avail_out && n.mode < $ && (n.mode < As || e !== Ni)) && Vc(t, t.output, t.next_out, h - t.avail_out), l -= t.avail_in, h -= t.avail_out, t.total_in += l, t.total_out += h, n.total += h, n.wrap & 4 && h && (t.adler = n.check = /*UPDATE_CHECK(state.check, strm.next_out - _out, _out);*/
  n.flags ? Z(n.check, o, h, t.next_out - h) : Ke(n.check, o, h, t.next_out - h)), t.data_type = n.bits + (n.last ? 64 : 0) + (n.mode === _t ? 128 : 0) + (n.mode === xn || n.mode === Cs ? 256 : 0), (l === 0 && h === 0 || e === Ni) && I === Jt && (I = $m), I;
}, Jm = (t) => {
  if (te(t))
    return ft;
  let e = t.state;
  return e.window && (e.window = null), t.state = null, Jt;
}, Qm = (t, e) => {
  if (te(t))
    return ft;
  const n = t.state;
  return (n.wrap & 2) === 0 ? ft : (n.head = e, e.done = !1, Jt);
}, ty = (t, e) => {
  const n = e.length;
  let s, o, i;
  return te(t) || (s = t.state, s.wrap !== 0 && s.mode !== zn) ? ft : s.mode === zn && (o = 1, o = Ke(o, e, n, 0), o !== s.check) ? Tc : (i = Vc(t, e, n, n), i ? (s.mode = Ec, Dc) : (s.havedict = 1, Jt));
};
var ey = Lc, ny = Rc, sy = Mc, oy = Ym, iy = Fc, ry = Km, ay = Jm, cy = Qm, fy = ty, uy = "pako inflate (from Nodeca project)", kt = {
  inflateReset: ey,
  inflateReset2: ny,
  inflateResetKeep: sy,
  inflateInit: oy,
  inflateInit2: iy,
  inflate: ry,
  inflateEnd: ay,
  inflateGetHeader: cy,
  inflateSetDictionary: fy,
  inflateInfo: uy
};
function ly() {
  this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
}
var hy = ly;
const zc = Object.prototype.toString, {
  Z_NO_FLUSH: py,
  Z_FINISH: gy,
  Z_OK: tn,
  Z_STREAM_END: Ts,
  Z_NEED_DICT: Ds,
  Z_STREAM_ERROR: dy,
  Z_DATA_ERROR: pr,
  Z_MEM_ERROR: my
} = Jn;
function ss(t) {
  this.options = ts.assign({
    chunkSize: 1024 * 64,
    windowBits: 15,
    to: ""
  }, t || {});
  const e = this.options;
  e.raw && e.windowBits >= 0 && e.windowBits < 16 && (e.windowBits = -e.windowBits, e.windowBits === 0 && (e.windowBits = -15)), e.windowBits >= 0 && e.windowBits < 16 && !(t && t.windowBits) && (e.windowBits += 32), e.windowBits > 15 && e.windowBits < 48 && (e.windowBits & 15) === 0 && (e.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new Cc(), this.strm.avail_out = 0;
  let n = kt.inflateInit2(
    this.strm,
    e.windowBits
  );
  if (n !== tn)
    throw new Error(Xt[n]);
  if (this.header = new hy(), kt.inflateGetHeader(this.strm, this.header), e.dictionary && (typeof e.dictionary == "string" ? e.dictionary = Qe.string2buf(e.dictionary) : zc.call(e.dictionary) === "[object ArrayBuffer]" && (e.dictionary = new Uint8Array(e.dictionary)), e.raw && (n = kt.inflateSetDictionary(this.strm, e.dictionary), n !== tn)))
    throw new Error(Xt[n]);
}
ss.prototype.push = function(t, e) {
  const n = this.strm, s = this.options.chunkSize, o = this.options.dictionary;
  let i, r, a;
  if (this.ended) return !1;
  for (e === ~~e ? r = e : r = e === !0 ? gy : py, zc.call(t) === "[object ArrayBuffer]" ? n.input = new Uint8Array(t) : n.input = t, n.next_in = 0, n.avail_in = n.input.length; ; ) {
    for (n.avail_out === 0 && (n.output = new Uint8Array(s), n.next_out = 0, n.avail_out = s), i = kt.inflate(n, r), i === Ds && o && (i = kt.inflateSetDictionary(n, o), i === tn ? i = kt.inflate(n, r) : i === pr && (i = Ds)); n.avail_in > 0 && i === Ts && n.state.wrap > 0 && t[n.next_in] !== 0; )
      kt.inflateReset(n), i = kt.inflate(n, r);
    switch (i) {
      case dy:
      case pr:
      case Ds:
      case my:
        return this.onEnd(i), this.ended = !0, !1;
    }
    if (a = n.avail_out, n.next_out && (n.avail_out === 0 || i === Ts))
      if (this.options.to === "string") {
        let c = Qe.utf8border(n.output, n.next_out), f = n.next_out - c, u = Qe.buf2string(n.output, c);
        n.next_out = f, n.avail_out = s - f, f && n.output.set(n.output.subarray(c, c + f), 0), this.onData(u);
      } else
        this.onData(n.output.length === n.next_out ? n.output : n.output.subarray(0, n.next_out));
    if (!(i === tn && a === 0)) {
      if (i === Ts)
        return i = kt.inflateEnd(this.strm), this.onEnd(i), this.ended = !0, !0;
      if (n.avail_in === 0) break;
    }
  }
  return !0;
};
ss.prototype.onData = function(t) {
  this.chunks.push(t);
};
ss.prototype.onEnd = function(t) {
  t === tn && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = ts.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;
};
function yy(t, e) {
  const n = new ss(e);
  if (n.push(t), n.err) throw n.msg || Xt[n.err];
  return n.result;
}
var xy = yy, wy = {
  inflate: xy
};
const { deflate: Sy } = Em, { inflate: _y } = wy;
var gr = Sy, dr = _y;
const Pc = 2001684038, no = 44, so = 20, Pn = 12, Gn = 16;
function Gc(t) {
  const e = new DataView(t), n = new Uint8Array(t);
  if (e.getUint32(0) !== Pc)
    throw new Error("Invalid WOFF1 signature");
  const o = e.getUint32(4), i = e.getUint16(12), r = e.getUint32(24), a = e.getUint32(28), c = e.getUint32(36), f = e.getUint32(40), u = [];
  let l = no;
  for (let A = 0; A < i; A++)
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
    }), l += so;
  const h = u.map((A) => {
    const C = n.subarray(
      A.offset,
      A.offset + A.compLength
    );
    let O;
    if (A.compLength < A.origLength) {
      if (O = dr(C), O.length !== A.origLength)
        throw new Error(
          `WOFF1 table '${A.tag}': decompressed size ${O.length} !== expected ${A.origLength}`
        );
    } else
      O = C;
    return {
      tag: A.tag,
      checksum: A.origChecksum,
      data: O,
      length: A.origLength,
      paddedLength: A.origLength + (4 - A.origLength % 4) % 4
    };
  }), g = Pn + i * Gn;
  let p = g + (4 - g % 4) % 4;
  const { searchRange: d, entrySelector: x, rangeShift: m } = by(i);
  let y = p;
  for (const A of h)
    y += A.paddedLength;
  const _ = new ArrayBuffer(y), w = new DataView(_), S = new Uint8Array(_);
  w.setUint32(0, o), w.setUint16(4, i), w.setUint16(6, d), w.setUint16(8, x), w.setUint16(10, m);
  const b = h.map((A, C) => ({ ...A, originalIndex: C })).sort((A, C) => A.tag < C.tag ? -1 : A.tag > C.tag ? 1 : 0);
  for (let A = 0; A < b.length; A++) {
    const C = b[A], O = Pn + A * Gn;
    for (let T = 0; T < 4; T++)
      w.setUint8(O + T, C.tag.charCodeAt(T));
    w.setUint32(O + 4, C.checksum), w.setUint32(O + 8, p), w.setUint32(O + 12, C.length), S.set(C.data, p), p += C.paddedLength;
  }
  let v = null;
  if (r && a) {
    const A = n.subarray(r, r + a);
    v = dr(A);
  }
  let I = null;
  return c && f && (I = n.slice(c, c + f)), { sfnt: _, metadata: v, privateData: I };
}
function oo(t, e = null, n = null) {
  const s = new DataView(t), o = new Uint8Array(t), i = s.getUint32(0), r = s.getUint16(4), a = [];
  for (let b = 0; b < r; b++) {
    const v = Pn + b * Gn;
    a.push({
      tag: String.fromCharCode(
        s.getUint8(v),
        s.getUint8(v + 1),
        s.getUint8(v + 2),
        s.getUint8(v + 3)
      ),
      checksum: s.getUint32(v + 4),
      offset: s.getUint32(v + 8),
      length: s.getUint32(v + 12)
    });
  }
  const c = a.map((b) => {
    const v = o.subarray(b.offset, b.offset + b.length), I = gr(v), A = I.length < b.length;
    return {
      tag: b.tag,
      origChecksum: b.checksum,
      origLength: b.length,
      data: A ? I : v,
      compLength: A ? I.length : b.length
    };
  });
  let f = null, u = 0;
  e && e.length > 0 && (u = e.length, f = gr(e));
  let h = no + r * so;
  h += (4 - h % 4) % 4;
  for (const b of c)
    b.woffOffset = h, h += b.compLength, h += (4 - h % 4) % 4;
  let g = 0, p = 0;
  f && (g = h, p = f.length, h += p, h += (4 - h % 4) % 4);
  let d = 0, x = 0;
  n && n.length > 0 && (d = h, x = n.length, h += x);
  const m = h;
  let y = Pn + r * Gn;
  for (const b of c)
    y += b.origLength + (4 - b.origLength % 4) % 4;
  const _ = new ArrayBuffer(m), w = new DataView(_), S = new Uint8Array(_);
  w.setUint32(0, Pc), w.setUint32(4, i), w.setUint32(8, m), w.setUint16(12, r), w.setUint16(14, 0), w.setUint32(16, y), w.setUint16(20, 0), w.setUint16(22, 0), w.setUint32(24, g), w.setUint32(28, p), w.setUint32(32, u), w.setUint32(36, d), w.setUint32(40, x);
  for (let b = 0; b < c.length; b++) {
    const v = c[b], I = no + b * so;
    for (let A = 0; A < 4; A++)
      w.setUint8(I + A, v.tag.charCodeAt(A));
    w.setUint32(I + 4, v.woffOffset), w.setUint32(I + 8, v.compLength), w.setUint32(I + 12, v.origLength), w.setUint32(I + 16, v.origChecksum);
  }
  for (const b of c)
    S.set(b.data, b.woffOffset);
  return f && S.set(f, g), n && n.length > 0 && S.set(n, d), _;
}
function by(t) {
  let e = 1, n = 0;
  for (; e * 2 <= t; )
    e *= 2, n++;
  e *= 16;
  const s = t * 16 - e;
  return { searchRange: e, entrySelector: n, rangeShift: s };
}
let Un = null, ye = null;
async function Uc() {
  if (!ye)
    try {
      const { brotliCompressSync: t, brotliDecompressSync: e } = await import("node:zlib");
      Un = (n) => new Uint8Array(t(n)), ye = (n) => new Uint8Array(e(n));
    } catch {
      const t = await import("brotli-wasm"), e = await (t.default || t);
      Un = e.compress, ye = e.decompress;
    }
}
function Nc() {
  if (!ye)
    throw new Error(
      "WOFF2 support requires initialization. Call `await initWoff2()` before importing or exporting WOFF2 files."
    );
}
const $c = 2001684018, io = 48, en = 12, nn = 16, ro = [
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
], Hc = /* @__PURE__ */ new Map();
for (let t = 0; t < ro.length; t++) Hc.set(ro[t], t);
function mr(t, e) {
  let n = 0;
  for (let s = 0; s < 5; s++) {
    const o = t[e + s];
    if (s === 0 && o === 128)
      throw new Error("UIntBase128: leading zero");
    if (n & 4261412864)
      throw new Error("UIntBase128: overflow");
    if (n = n << 7 | o & 127, !(o & 128))
      return { value: n >>> 0, bytesRead: s + 1 };
  }
  throw new Error("UIntBase128: exceeds 5 bytes");
}
function vy(t) {
  const e = [];
  let n = t >>> 0;
  const s = [];
  do
    s.push(n & 127), n >>>= 7;
  while (n > 0);
  s.reverse();
  for (let o = 0; o < s.length; o++)
    e.push(o < s.length - 1 ? s[o] | 128 : s[o]);
  return e;
}
function xe(t, e) {
  const n = t[e];
  return n === 253 ? { value: t[e + 1] << 8 | t[e + 2], bytesRead: 3 } : n === 255 ? { value: t[e + 1] + 253, bytesRead: 2 } : n === 254 ? { value: t[e + 1] + 506, bytesRead: 2 } : { value: n, bytesRead: 1 };
}
const ky = Cy();
function Cy() {
  const t = [];
  for (let o = 0; o < 10; o++)
    t.push({
      xBits: 0,
      yBits: 8,
      deltaX: 0,
      deltaY: (o >> 1) * 256,
      xSign: 0,
      ySign: o & 1 ? 1 : -1
    });
  for (let o = 0; o < 10; o++)
    t.push({
      xBits: 8,
      yBits: 0,
      deltaX: (o >> 1) * 256,
      deltaY: 0,
      xSign: o & 1 ? 1 : -1,
      ySign: 0
    });
  const e = [1, 17, 33, 49], n = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (const o of e)
    for (const i of e)
      for (const [r, a] of n)
        t.push({ xBits: 4, yBits: 4, deltaX: o, deltaY: i, xSign: r, ySign: a });
  const s = [1, 257, 513];
  for (const o of s)
    for (const i of s)
      for (const [r, a] of n)
        t.push({ xBits: 8, yBits: 8, deltaX: o, deltaY: i, xSign: r, ySign: a });
  for (const [o, i] of n)
    t.push({ xBits: 12, yBits: 12, deltaX: 0, deltaY: 0, xSign: o, ySign: i });
  for (const [o, i] of n)
    t.push({ xBits: 16, yBits: 16, deltaX: 0, deltaY: 0, xSign: o, ySign: i });
  return t;
}
function Ay(t, e, n) {
  const s = t & 127, o = !(t & 128), i = ky[s];
  let r = 0, a = 0, c = n;
  if (i.xBits === 0 && i.yBits === 8)
    a = i.ySign * (e[c++] + i.deltaY);
  else if (i.xBits === 8 && i.yBits === 0)
    r = i.xSign * (e[c++] + i.deltaX);
  else if (i.xBits === 4 && i.yBits === 4) {
    const f = e[c++];
    r = i.xSign * ((f >> 4 & 15) + i.deltaX), a = i.ySign * ((f & 15) + i.deltaY);
  } else if (i.xBits === 8 && i.yBits === 8)
    r = i.xSign * (e[c++] + i.deltaX), a = i.ySign * (e[c++] + i.deltaY);
  else if (i.xBits === 12 && i.yBits === 12) {
    const f = e[c++], u = e[c++], l = e[c++];
    r = i.xSign * ((f << 4 | u >> 4) + i.deltaX), a = i.ySign * (((u & 15) << 8 | l) + i.deltaY);
  } else i.xBits === 16 && i.yBits === 16 && (r = i.xSign * ((e[c++] << 8 | e[c++]) + i.deltaX), a = i.ySign * ((e[c++] << 8 | e[c++]) + i.deltaY));
  return { dx: r, dy: a, onCurve: o, bytesConsumed: c - n };
}
function Iy(t, e, n, s, o, i, r, a, c) {
  const f = [];
  gt(f, t), gt(f, o), gt(f, i), gt(f, r), gt(f, a);
  for (const p of e) co(f, p);
  co(f, s.length);
  for (let p = 0; p < s.length; p++) f.push(s[p]);
  const u = [], l = [], h = [];
  for (let p = 0; p < n.length; p++) {
    const { dx: d, dy: x, onCurve: m } = n[p];
    let y = m ? 1 : 0;
    if (p === 0 && c && (y |= 64), d === 0)
      y |= 16;
    else if (d >= -255 && d <= 255)
      y |= 2, d > 0 ? (y |= 16, l.push(d)) : l.push(-d);
    else {
      const _ = d & 65535;
      l.push(_ >> 8 & 255, _ & 255);
    }
    if (x === 0)
      y |= 32;
    else if (x >= -255 && x <= 255)
      y |= 4, x > 0 ? (y |= 32, h.push(x)) : h.push(-x);
    else {
      const _ = x & 65535;
      h.push(_ >> 8 & 255, _ & 255);
    }
    u.push(y);
  }
  let g = 0;
  for (; g < u.length; ) {
    const p = u[g];
    let d = 0;
    for (; g + d + 1 < u.length && u[g + d + 1] === p && d < 255; )
      d++;
    d > 0 ? (f.push(p | 8), f.push(d), g += d + 1) : (f.push(p), g++);
  }
  for (const p of l) f.push(p);
  for (const p of h) f.push(p);
  return f;
}
function Oy(t, e, n, s, o, i) {
  const r = [];
  gt(r, -1), gt(r, n), gt(r, s), gt(r, o), gt(r, i);
  for (let a = 0; a < t.length; a++) r.push(t[a]);
  if (e && e.length > 0) {
    co(r, e.length);
    for (let a = 0; a < e.length; a++) r.push(e[a]);
  }
  return r;
}
function Ty(t, e) {
  const n = t;
  let s = 0;
  const o = n[s] << 8 | n[s + 1];
  if (s += 2, o !== 0) throw new Error("WOFF2 glyf transform: reserved != 0");
  const i = n[s] << 8 | n[s + 1];
  s += 2;
  const r = n[s] << 8 | n[s + 1];
  s += 2;
  const a = n[s] << 8 | n[s + 1];
  s += 2;
  const c = bt(n, s);
  s += 4;
  const f = bt(n, s);
  s += 4;
  const u = bt(n, s);
  s += 4;
  const l = bt(n, s);
  s += 4;
  const h = bt(n, s);
  s += 4;
  const g = bt(n, s);
  s += 4;
  const p = bt(n, s);
  s += 4;
  const d = s, x = d + c, m = x + f, y = m + u, _ = y + l, w = _ + h, S = w + g, b = 4 * Math.floor((r + 31) / 32), v = w, I = v + b;
  function A(K) {
    const rt = K >> 3, It = 7 - (K & 7);
    return !!(n[v + rt] & 1 << It);
  }
  const C = !!(i & 1), O = S + p;
  function T(K) {
    if (!C) return !1;
    const rt = K >> 3, It = 7 - (K & 7);
    return !!(n[O + rt] & 1 << It);
  }
  let D = d, E = x, M = m, R = y, H = _, U = I, W = S;
  const Y = [], X = [0];
  let xt = 0;
  for (let K = 0; K < r; K++) {
    const rt = at(n, D);
    if (D += 2, rt === 0) {
      Y.push(null), X.push(xt);
      continue;
    }
    if (rt > 0) {
      const It = [];
      let ne = 0;
      for (let ut = 0; ut < rt; ut++) {
        const { value: St, bytesRead: se } = xe(n, E);
        E += se, ne += St, It.push(ne - 1);
      }
      const Oe = [];
      for (let ut = 0; ut < ne; ut++) {
        const St = n[M++], { dx: se, dy: rf, onCurve: af, bytesConsumed: cf } = Ay(St, n, R);
        R += cf, Oe.push({ dx: se, dy: rf, onCurve: af });
      }
      const { value: Te, bytesRead: os } = xe(n, R);
      R += os;
      const is = n.subarray(W, W + Te);
      W += Te;
      let Gt, Ut, wt, Nt;
      if (A(K))
        Gt = at(n, U), U += 2, Ut = at(n, U), U += 2, wt = at(n, U), U += 2, Nt = at(n, U), U += 2;
      else {
        let ut = 0, St = 0;
        Gt = 32767, Ut = 32767, wt = -32768, Nt = -32768;
        for (const se of Oe)
          ut += se.dx, St += se.dy, ut < Gt && (Gt = ut), ut > wt && (wt = ut), St < Ut && (Ut = St), St > Nt && (Nt = St);
      }
      const nt = Iy(
        rt,
        It,
        Oe,
        is,
        Gt,
        Ut,
        wt,
        Nt,
        T(K)
      );
      Y.push(nt);
      const rs = nt.length + (nt.length % 2 ? 1 : 0);
      xt += rs, X.push(xt);
    } else {
      const It = H;
      let ne = !1;
      for (; ; ) {
        const nt = n[H] << 8 | n[H + 1];
        if (H += 2, H += 2, nt & 1 ? H += 4 : H += 2, nt & 8 ? H += 2 : nt & 64 ? H += 4 : nt & 128 && (H += 8), nt & 256 && (ne = !0), !(nt & 32)) break;
      }
      const Oe = n.subarray(It, H);
      let Te = new Uint8Array(0);
      if (ne) {
        const { value: nt, bytesRead: rs } = xe(n, R);
        R += rs, Te = n.subarray(W, W + nt), W += nt;
      }
      const os = at(n, U);
      U += 2;
      const is = at(n, U);
      U += 2;
      const Gt = at(n, U);
      U += 2;
      const Ut = at(n, U);
      U += 2;
      const wt = Oy(
        Oe,
        Te,
        os,
        is,
        Gt,
        Ut
      );
      Y.push(wt);
      const Nt = wt.length + (wt.length % 2 ? 1 : 0);
      xt += Nt, X.push(xt);
    }
  }
  const ee = new Uint8Array(xt);
  let cn = 0;
  for (const K of Y)
    if (K !== null) {
      for (let rt = 0; rt < K.length; rt++)
        ee[cn++] = K[rt];
      K.length % 2 && cn++;
    }
  return { glyfBytes: ee, locaOffsets: X, indexFormat: a };
}
function Dy(t, e, n, s, o) {
  const i = t;
  let r = 0;
  const a = i[r++], c = !(a & 1), f = !(a & 2), u = [];
  for (let m = 0; m < e; m++)
    u.push(i[r] << 8 | i[r + 1]), r += 2;
  const l = [];
  if (c)
    for (let m = 0; m < e; m++)
      l.push(at(i, r)), r += 2;
  else
    for (let m = 0; m < e; m++)
      l.push(yr(s, o, m));
  const h = n - e, g = [];
  if (f)
    for (let m = 0; m < h; m++)
      g.push(at(i, r)), r += 2;
  else
    for (let m = 0; m < h; m++)
      g.push(yr(s, o, e + m));
  const p = e * 4 + h * 2, d = new Uint8Array(p);
  let x = 0;
  for (let m = 0; m < e; m++) {
    d[x++] = u[m] >> 8 & 255, d[x++] = u[m] & 255;
    const y = l[m] & 65535;
    d[x++] = y >> 8 & 255, d[x++] = y & 255;
  }
  for (let m = 0; m < h; m++) {
    const y = g[m] & 65535;
    d[x++] = y >> 8 & 255, d[x++] = y & 255;
  }
  return d;
}
function yr(t, e, n) {
  const s = e[n], o = e[n + 1];
  return s === o ? 0 : at(t, s + 2);
}
function Ey(t, e) {
  if (e === 0) {
    const s = new Uint8Array(t.length * 2);
    for (let o = 0; o < t.length; o++) {
      const i = t[o] >> 1;
      s[o * 2] = i >> 8 & 255, s[o * 2 + 1] = i & 255;
    }
    return s;
  }
  const n = new Uint8Array(t.length * 4);
  for (let s = 0; s < t.length; s++) {
    const o = t[s];
    n[s * 4] = o >> 24 & 255, n[s * 4 + 1] = o >> 16 & 255, n[s * 4 + 2] = o >> 8 & 255, n[s * 4 + 3] = o & 255;
  }
  return n;
}
function jc(t) {
  Nc();
  const e = new Uint8Array(t), n = new DataView(t);
  if (n.getUint32(0) !== $c)
    throw new Error("Invalid WOFF2 signature");
  const o = n.getUint32(4), i = n.getUint16(12), r = n.getUint32(20), a = n.getUint32(28), c = n.getUint32(32), f = n.getUint32(40), u = n.getUint32(44);
  let l = io;
  const h = [];
  for (let T = 0; T < i; T++) {
    const D = e[l++], E = D & 63, M = D >> 6 & 3;
    let R;
    E === 63 ? (R = String.fromCharCode(e[l], e[l + 1], e[l + 2], e[l + 3]), l += 4) : R = ro[E];
    const { value: H, bytesRead: U } = mr(e, l);
    l += U;
    let W = H;
    const Y = R === "glyf" || R === "loca", X = R === "hmtx";
    if (Y && M === 0 || X && M === 1 || !Y && !X && M !== 0) {
      const { value: ee, bytesRead: cn } = mr(e, l);
      l += cn, W = ee;
    }
    R === "loca" && M === 0 && (W = 0), h.push({
      tag: R,
      transformVersion: M,
      origLength: H,
      transformLength: W,
      isTransformed: Y ? M === 0 : X ? M === 1 : M !== 0
    });
  }
  let g = null;
  if (o === 1953784678) {
    const T = bt(e, l);
    l += 4;
    const { value: D, bytesRead: E } = xe(e, l);
    l += E;
    const M = [];
    for (let R = 0; R < D; R++) {
      const { value: H, bytesRead: U } = xe(e, l);
      l += U;
      const W = bt(e, l);
      l += 4;
      const Y = [];
      for (let X = 0; X < H; X++) {
        const { value: xt, bytesRead: ee } = xe(e, l);
        l += ee, Y.push(xt);
      }
      M.push({ numTables: H, flavor: W, tableIndices: Y });
    }
    g = { version: T, numFonts: D, fonts: M };
  }
  const p = l, d = e.subarray(p, p + r), x = ye(d);
  let m = 0;
  const y = /* @__PURE__ */ new Map();
  for (const T of h) {
    const D = T.isTransformed ? T.transformLength : T.origLength, E = x.subarray(m, m + D);
    m += D, y.set(T.tag, { data: E, entry: T });
  }
  const _ = /* @__PURE__ */ new Map();
  let w = null;
  const S = y.get("glyf"), b = y.get("loca");
  S && S.entry.isTransformed && (b && b.entry.origLength, w = Ty(S.data), _.set("glyf", w.glyfBytes), _.set("loca", Ey(
    w.locaOffsets,
    w.indexFormat
  )));
  const v = y.get("hmtx");
  if (v && v.entry.isTransformed && w) {
    const T = y.get("hhea"), D = y.get("maxp");
    let E = 0, M = 0;
    T && (E = T.data[34] << 8 | T.data[35]), D && (M = D.data[4] << 8 | D.data[5]), _.set("hmtx", Dy(
      v.data,
      E,
      M,
      w.glyfBytes,
      w.locaOffsets
    ));
  }
  const I = [];
  for (const T of h) {
    const D = T.tag;
    let E;
    _.has(D) ? E = _.get(D) : E = y.get(D).data, I.push({ tag: D, data: E, length: E.length });
  }
  let A;
  g ? A = By(g, I) : A = Zc(o, I);
  let C = null;
  if (a && c) {
    const T = e.subarray(a, a + c);
    C = ye(T);
  }
  let O = null;
  return f && u && (O = e.slice(f, f + u)), { sfnt: A.buffer, metadata: C, privateData: O };
}
function Zc(t, e) {
  const n = e.length, { searchRange: s, entrySelector: o, rangeShift: i } = My(n), r = en + n * nn;
  let a = r + (4 - r % 4) % 4;
  const c = e.map((h, g) => ({ ...h, index: g })).sort((h, g) => h.tag < g.tag ? -1 : h.tag > g.tag ? 1 : 0);
  let f = a;
  for (const h of c)
    f += h.length + (4 - h.length % 4) % 4;
  const u = new Uint8Array(f), l = new DataView(u.buffer);
  l.setUint32(0, t), l.setUint16(4, n), l.setUint16(6, s), l.setUint16(8, o), l.setUint16(10, i);
  for (let h = 0; h < c.length; h++) {
    const g = c[h], p = en + h * nn;
    for (let x = 0; x < 4; x++)
      u[p + x] = g.tag.charCodeAt(x);
    const d = Wc(g.data);
    l.setUint32(p + 4, d), l.setUint32(p + 8, a), l.setUint32(p + 12, g.length), u.set(g.data instanceof Uint8Array ? g.data : new Uint8Array(g.data), a), a += g.length + (4 - g.length % 4) % 4;
  }
  return Ly(u, c), u;
}
function By(t, e, n) {
  const s = [];
  for (const l of t.fonts) {
    const h = l.tableIndices.map((p) => e[p]), g = Zc(l.flavor, h);
    s.push(g);
  }
  const o = s.length;
  let r = 12 + o * 4;
  r += (4 - r % 4) % 4;
  const a = [];
  let c = r;
  for (const l of s)
    a.push(c), c += l.length, c += (4 - c % 4) % 4;
  const f = new Uint8Array(c), u = new DataView(f.buffer);
  u.setUint32(0, 1953784678), u.setUint32(4, t.version), u.setUint32(8, o);
  for (let l = 0; l < o; l++)
    u.setUint32(12 + l * 4, a[l]);
  for (let l = 0; l < o; l++)
    f.set(s[l], a[l]);
  return f;
}
function ao(t, e = null, n = null) {
  Nc();
  const s = new DataView(t), o = new Uint8Array(t), i = s.getUint32(0), r = s.getUint16(4), a = [];
  for (let E = 0; E < r; E++) {
    const M = en + E * nn, R = String.fromCharCode(
      s.getUint8(M),
      s.getUint8(M + 1),
      s.getUint8(M + 2),
      s.getUint8(M + 3)
    );
    a.push({
      tag: R,
      checksum: s.getUint32(M + 4),
      offset: s.getUint32(M + 8),
      length: s.getUint32(M + 12)
    });
  }
  const c = a.filter((E) => E.tag !== "DSIG"), f = [], u = [];
  let l = en + c.length * nn;
  for (const E of c) {
    const M = o.subarray(E.offset, E.offset + E.length), R = Hc.get(E.tag), U = E.tag === "glyf" || E.tag === "loca" ? 3 : 0, Y = [(R !== void 0 ? R : 63) | U << 6];
    if (R === void 0)
      for (let X = 0; X < 4; X++) Y.push(E.tag.charCodeAt(X));
    Y.push(...vy(E.length)), f.push(Y), u.push(M), l += E.length + (4 - E.length % 4) % 4;
  }
  let h = 0;
  for (const E of u) h += E.length;
  const g = new Uint8Array(h);
  let p = 0;
  for (const E of u)
    g.set(E, p), p += E.length;
  const d = Un(g);
  let x = null, m = 0;
  e && e.length > 0 && (m = e.length, x = Un(e));
  let y = [];
  for (const E of f) y.push(...E);
  let w = io + y.length;
  const S = w;
  w += d.length;
  let b = 0, v = 0;
  x && (w += (4 - w % 4) % 4, b = w, v = x.length, w += v);
  let I = 0, A = 0;
  n && n.length > 0 && (w += (4 - w % 4) % 4, I = w, A = n.length, w += A);
  const C = w, O = new ArrayBuffer(C), T = new DataView(O), D = new Uint8Array(O);
  T.setUint32(0, $c), T.setUint32(4, i), T.setUint32(8, C), T.setUint16(12, c.length), T.setUint16(14, 0), T.setUint32(16, l), T.setUint32(20, d.length), T.setUint16(24, 0), T.setUint16(26, 0), T.setUint32(28, b), T.setUint32(32, v), T.setUint32(36, m), T.setUint32(40, I), T.setUint32(44, A);
  for (let E = 0; E < y.length; E++)
    D[io + E] = y[E];
  return D.set(d instanceof Uint8Array ? d : new Uint8Array(d), S), x && D.set(
    x instanceof Uint8Array ? x : new Uint8Array(x),
    b
  ), n && n.length > 0 && D.set(n, I), O;
}
function bt(t, e) {
  return (t[e] << 24 | t[e + 1] << 16 | t[e + 2] << 8 | t[e + 3]) >>> 0;
}
function at(t, e) {
  const n = t[e] << 8 | t[e + 1];
  return n > 32767 ? n - 65536 : n;
}
function gt(t, e) {
  const n = e & 65535;
  t.push(n >> 8 & 255, n & 255);
}
function co(t, e) {
  t.push(e >> 8 & 255, e & 255);
}
function My(t) {
  let e = 1, n = 0;
  for (; e * 2 <= t; )
    e *= 2, n++;
  e *= 16;
  const s = t * 16 - e;
  return { searchRange: e, entrySelector: n, rangeShift: s };
}
function Wc(t) {
  let e = 0;
  const n = t.length, s = n + (4 - n % 4) % 4;
  for (let o = 0; o < s; o += 4)
    e = e + ((t[o] || 0) << 24 | (t[o + 1] || 0) << 16 | (t[o + 2] || 0) << 8 | (t[o + 3] || 0)) >>> 0;
  return e;
}
function Ly(t, e) {
  let n = -1;
  for (const i of e)
    if (i.tag === "head") {
      const r = t[4] << 8 | t[5];
      for (let a = 0; a < r; a++) {
        const c = en + a * nn;
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
  const o = 2981146554 - Wc(t) >>> 0;
  t[n + 8] = o >> 24 & 255, t[n + 9] = o >> 16 & 255, t[n + 10] = o >> 8 & 255, t[n + 11] = o & 255;
}
const Ry = {
  cmap: Ih,
  head: Sa,
  hhea: Cp,
  HVAR: Ep,
  hmtx: Ip,
  maxp: gg,
  MVAR: _g,
  name: Og,
  hdmx: Sp,
  BASE: Yl,
  JSTF: Np,
  MATH: ug,
  MERG: mg,
  meta: wg,
  DSIG: g0,
  LTSH: ag,
  CBLC: de,
  CBDT: go,
  "OS/2": Dg,
  kern: Kp,
  PCLT: Mg,
  VDMX: Jg,
  post: Rg,
  STAT: Hg,
  "CFF ": qr,
  CFF2: pl,
  VORG: yl,
  fvar: k0,
  avar: Sl,
  loca: sc,
  glyf: Fd,
  gvar: Hd,
  GDEF: D0,
  GPOS: j0,
  GSUB: up,
  "cvt ": Id,
  cvar: Cd,
  fpgm: Td,
  prep: qd,
  gasp: Ed,
  vhea: sd,
  VVAR: fd,
  vmtx: id,
  COLR: c0,
  CPAL: u0,
  EBDT: y0,
  EBLC: w0,
  EBSC: _0,
  bloc: hh,
  bdat: oh,
  sbix: Pg,
  ltag: ig,
  "SVG ": Wg
}, xr = 12, wr = 16;
function Fy(t) {
  let e = 0;
  const n = t.length, s = n & -4, o = new DataView(t.buffer, t.byteOffset, t.byteLength);
  for (let i = 0; i < s; i += 4)
    e = e + o.getUint32(i) >>> 0;
  if (n & 3) {
    let i = 0;
    for (let r = s; r < n; r++)
      i |= t[r] << 24 - 8 * (r - s);
    e = e + i >>> 0;
  }
  return e;
}
const Vy = /* @__PURE__ */ new Set(["sfnt", "woff", "woff2", "cff"]);
function zy(t) {
  if (t._standalone === "cff") return "cff";
  const e = t._woff?.version;
  return e === 2 ? "woff2" : e === 1 ? "woff" : "sfnt";
}
function Sr(t, e = {}) {
  if (!t || typeof t != "object")
    throw new TypeError("exportFont expects a font data object");
  const n = e.format ? e.format.toLowerCase() : zy(t);
  if (!Vy.has(n))
    throw new Error(
      `Unknown export format "${n}". Supported: sfnt, woff, woff2, cff.`
    );
  if (Gy(t)) {
    if (n === "cff")
      throw new Error("CFF export does not support font collections.");
    if (e.split)
      return Py(t, n);
    const i = Uy(t);
    return n === "woff" ? oo(
      i,
      t._woff?.metadata,
      t._woff?.privateData
    ) : n === "woff2" ? ao(
      i,
      t._woff?.metadata,
      t._woff?.privateData
    ) : i;
  }
  if (n === "cff") {
    const r = Nn(t).tables["CFF "];
    if (!r)
      throw new Error(
        "CFF export requires CFF glyph data. This font uses TrueType outlines."
      );
    const a = qr(r), c = new ArrayBuffer(a.length);
    return new Uint8Array(c).set(a), c;
  }
  const s = Nn(t), o = $n(s, 0);
  if (n === "woff") {
    const i = t._woff?.metadata ?? null, r = t._woff?.privateData ?? null;
    return oo(o, i, r);
  }
  if (n === "woff2") {
    const i = t._woff?.metadata ?? null, r = t._woff?.privateData ?? null;
    return ao(o, i, r);
  }
  return o;
}
function Py(t, e) {
  const { fonts: n } = t;
  if (!Array.isArray(n) || n.length === 0)
    throw new Error("Collection split expects a non-empty fonts array");
  return n.map((s) => {
    const o = Nn(s), i = $n(o, 0);
    return e === "woff" ? oo(i) : e === "woff2" ? ao(i) : i;
  });
}
function Gy(t) {
  return t.collection && t.collection.tag === "ttcf" && Array.isArray(t.fonts);
}
function _r(t, e) {
  if (!t?.fonts?.[0]) return !1;
  const n = t.fonts[0].charStrings;
  if (!n || n.length !== e.length) return !1;
  for (let s = 0; s < e.length; s++) {
    const o = e[s], i = n[s];
    if (!o.charString) {
      if (i && i.length > 0) return !1;
      continue;
    }
    if (!i || o.charString.length !== i.length) return !1;
    for (let r = 0; r < i.length; r++)
      if (o.charString[r] !== i[r]) return !1;
  }
  return !0;
}
function Nn(t) {
  if (t.header && t.tables)
    return t;
  if (t._header && t.tables && t.font && t.glyphs) {
    const e = No(t);
    for (const [n, s] of Object.entries(t.tables))
      !Tf.has(n) && !e.tables[n] && (e.tables[n] = s);
    return t.tables["CFF "] && e.tables["CFF "] && _r(t.tables["CFF "], t.glyphs) && (e.tables["CFF "] = t.tables["CFF "]), t.tables.CFF2 && e.tables.CFF2 && _r(t.tables.CFF2, t.glyphs) && (e.tables.CFF2 = t.tables.CFF2), e;
  }
  if (t._header && t.tables)
    return { header: t._header, tables: t.tables };
  if (t.font && t.glyphs)
    return No(t);
  throw new Error(
    "exportFont: input must have { header, tables } or { font, glyphs }"
  );
}
function $n(t, e) {
  const { header: n, tables: s } = t, o = Object.keys(s), i = o.length, r = Ny(s), a = o.map((y) => {
    const _ = s[y];
    let w;
    if (r.has(y))
      w = r.get(y);
    else if (_._raw)
      w = _._raw;
    else {
      const b = Ry[y];
      if (!b)
        throw new Error(`No writer registered for parsed table: ${y}`);
      w = b(_);
    }
    const S = new Uint8Array(w);
    return {
      tag: y,
      data: S,
      length: S.length,
      paddedLength: S.length + (4 - S.length % 4) % 4,
      checksum: Fy(S)
    };
  }), c = xr + i * wr;
  let f = c + (4 - c % 4) % 4;
  for (const y of a)
    y.offset = f, f += y.paddedLength;
  const u = f, l = new ArrayBuffer(u), h = new DataView(l), g = new Uint8Array(l), p = i > 0 ? 2 ** Math.floor(Math.log2(i)) : 0, d = p * 16, x = p > 0 ? Math.floor(Math.log2(p)) : 0, m = i * 16 - d;
  h.setUint32(0, n.sfVersion), h.setUint16(4, i), h.setUint16(6, d), h.setUint16(8, x), h.setUint16(10, m);
  for (let y = 0; y < a.length; y++) {
    const _ = a[y], w = xr + y * wr;
    for (let S = 0; S < 4; S++)
      h.setUint8(w + S, _.tag.charCodeAt(S));
    h.setUint32(w + 4, _.checksum), h.setUint32(w + 8, _.offset + e), h.setUint32(w + 12, _.length);
  }
  for (const y of a)
    g.set(y.data, y.offset);
  return l;
}
function Uy(t) {
  const { collection: e, fonts: n } = t;
  if (!Array.isArray(n) || n.length === 0)
    throw new Error("TTC/OTC export expects a non-empty fonts array");
  const s = n.map((m) => Nn(m)), o = e.majorVersion ?? 2, i = e.minorVersion ?? 0, r = s.length, a = o >= 2, c = 12 + r * 4 + (a ? 12 : 0);
  let f = c + (4 - c % 4) % 4;
  const l = s.map(
    (m) => new Uint8Array($n(m, 0))
  ).map((m) => {
    const y = f;
    return f += m.length, f += (4 - f % 4) % 4, y;
  }), h = s.map(
    (m, y) => new Uint8Array($n(m, l[y]))
  ), g = f, p = new ArrayBuffer(g), d = new DataView(p), x = new Uint8Array(p);
  d.setUint8(0, 116), d.setUint8(1, 116), d.setUint8(2, 99), d.setUint8(3, 102), d.setUint16(4, o), d.setUint16(6, i), d.setUint32(8, r);
  for (let m = 0; m < r; m++)
    d.setUint32(12 + m * 4, l[m]);
  if (a) {
    const m = 12 + r * 4;
    d.setUint32(m + 0, e.dsigTag ?? 0), d.setUint32(m + 4, e.dsigLength ?? 0), d.setUint32(m + 8, e.dsigOffset ?? 0);
  }
  for (let m = 0; m < r; m++)
    x.set(h[m], l[m]);
  return p;
}
function Ny(t) {
  const e = /* @__PURE__ */ new Map(), n = t.glyf && !t.glyf._raw, s = t.loca && !t.loca._raw;
  if (n && s) {
    const { bytes: u, offsets: l } = nc(t.glyf);
    if (e.set("glyf", u), e.set("loca", sc({ offsets: l })), t.head && !t.head._raw) {
      const g = l.every((p) => p % 2 === 0 && p / 2 <= 65535) ? 0 : 1;
      t.head.indexToLocFormat !== g && e.set(
        "head",
        Sa({ ...t.head, indexToLocFormat: g })
      );
    }
  }
  const o = t.CBLC && !t.CBLC._raw && t.CBLC.sizes, i = t.CBDT && !t.CBDT._raw && t.CBDT.bitmapData;
  if (o && i) {
    const { bytes: u, offsetInfo: l } = fs(
      t.CBDT,
      t.CBLC
    );
    e.set("CBDT", u), e.set("CBLC", de(t.CBLC, l));
  }
  const r = t.EBLC && !t.EBLC._raw && t.EBLC.sizes, a = t.EBDT && !t.EBDT._raw && t.EBDT.bitmapData;
  if (r && a) {
    const { bytes: u, offsetInfo: l } = fs(t.EBDT, t.EBLC);
    e.set("EBDT", u), e.set("EBLC", de(t.EBLC, l));
  }
  const c = t.bloc && !t.bloc._raw && t.bloc.sizes, f = t.bdat && !t.bdat._raw && t.bdat.bitmapData;
  if (c && f) {
    const { bytes: u, offsetInfo: l } = fs(t.bdat, t.bloc);
    e.set("bdat", u), e.set("bloc", de(t.bloc, l));
  }
  return e;
}
const qc = {
  cmap: ph,
  head: Ps,
  hhea: kp,
  HVAR: Tp,
  hmtx: Ap,
  maxp: pg,
  MVAR: Sg,
  name: Ig,
  hdmx: wp,
  BASE: $l,
  JSTF: Up,
  MATH: fg,
  MERG: dg,
  meta: xg,
  DSIG: p0,
  LTSH: rg,
  CBLC: mo,
  CBDT: po,
  "OS/2": Tg,
  kern: jp,
  PCLT: Bg,
  VDMX: Kg,
  post: Lg,
  STAT: Ng,
  "CFF ": Wr,
  CFF2: hl,
  VORG: ml,
  fvar: v0,
  avar: wl,
  loca: Zd,
  glyf: Bd,
  gvar: Nd,
  GDEF: C0,
  GPOS: V0,
  GSUB: sp,
  "cvt ": Ad,
  cvar: kd,
  fpgm: Od,
  prep: Wd,
  gasp: Dd,
  vhea: nd,
  VVAR: ad,
  vmtx: od,
  COLR: a0,
  CPAL: f0,
  EBLC: x0,
  EBDT: m0,
  EBSC: S0,
  bloc: lh,
  bdat: sh,
  sbix: zg,
  ltag: og,
  "SVG ": Zg
}, Yc = [
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
function Hn(t) {
  if (!(t instanceof ArrayBuffer))
    throw new TypeError("importFont expects an ArrayBuffer");
  const e = new Uint8Array(t);
  if (e.length >= 4) {
    const s = String.fromCharCode(
      e[0],
      e[1],
      e[2],
      e[3]
    );
    if (s === "wOFF") {
      const { sfnt: o, metadata: i, privateData: r } = Gc(t), a = Hn(o);
      return a._woff = { version: 1 }, i && (a._woff.metadata = i), r && (a._woff.privateData = r), a;
    }
    if (s === "wOF2") {
      const { sfnt: o, metadata: i, privateData: r } = jc(t), a = Hn(o);
      return a._woff = { version: 2 }, i && (a._woff.metadata = i), r && (a._woff.privateData = r), a;
    }
    if (s === "ttcf")
      return Hy(t);
  }
  if (e.length >= 4 && e[0] === 1 && e[1] === 0 && e[3] >= 1 && e[3] <= 4)
    return Zy(t);
  if (e.length >= 6 && e[0] === 128 && (e[1] === 1 || e[1] === 2))
    return Wy(t);
  if (e.length >= 2 && e[0] === 37 && e[1] === 33)
    return qy(t);
  const n = $y(t);
  return ho(n);
}
function $y(t) {
  if (!(t instanceof ArrayBuffer))
    throw new TypeError("importFontTables expects an ArrayBuffer");
  const e = new B(new Uint8Array(t)), n = Xc(e), s = Kc(e, n.numTables), o = Jc(t, s);
  return { header: n, tables: o };
}
function Hy(t) {
  const e = new B(new Uint8Array(t)), n = e.tag();
  if (n !== "ttcf")
    throw new Error("Invalid TTC/OTC collection signature");
  const s = e.uint16(), o = e.uint16(), i = e.uint32(), r = e.array("uint32", i);
  let a, c, f;
  s >= 2 && (a = e.uint32(), c = e.uint32(), f = e.uint32());
  const u = r.map((h) => {
    const g = new B(new Uint8Array(t), h), p = Xc(g), d = Kc(g, p.numTables), x = jy(
      t,
      d,
      h
    ), m = Jc(t, x);
    return ho({ header: p, tables: m });
  }), l = {
    tag: n,
    majorVersion: s,
    minorVersion: o,
    numFonts: i
  };
  return s >= 2 && (l.dsigTag = a, l.dsigLength = c, l.dsigOffset = f), { collection: l, fonts: u };
}
function jy(t, e, n) {
  const s = e.find((h) => h.tag === "head");
  if (!s)
    return e;
  const o = s.offset, i = n + s.offset, r = o + s.length <= t.byteLength, a = i + s.length <= t.byteLength;
  if (!r && a)
    return e.map((h) => ({
      ...h,
      offset: n + h.offset
    }));
  if (r && !a || !r && !a)
    return e;
  const c = Ps(
    Array.from(new Uint8Array(t, o, s.length))
  ), f = Ps(
    Array.from(new Uint8Array(t, i, s.length))
  ), u = c.magicNumber === 1594834165;
  return f.magicNumber === 1594834165 && !u ? e.map((h) => ({
    ...h,
    offset: n + h.offset
  })) : e;
}
function Xc(t) {
  return {
    sfVersion: t.uint32(),
    numTables: t.uint16(),
    searchRange: t.uint16(),
    entrySelector: t.uint16(),
    rangeShift: t.uint16()
  };
}
function Kc(t, e) {
  const n = [];
  for (let s = 0; s < e; s++)
    n.push({
      tag: t.tag(),
      checksum: t.uint32(),
      offset: t.offset32(),
      length: t.uint32()
    });
  return n;
}
function Jc(t, e) {
  const n = {}, s = new Map(e.map((a) => [a.tag, a])), o = Yc.filter((a) => s.has(a)), i = e.map((a) => a.tag).filter((a) => !o.includes(a)), r = [...o, ...i];
  for (const a of r) {
    const c = s.get(a), f = c.offset, u = new Uint8Array(t, f, c.length), l = Array.from(u), h = qc[a];
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
function Zy(t) {
  const e = Array.from(new Uint8Array(t)), n = Wr(e), s = n.fonts[0], o = s?.topDict || {}, i = s?.charStrings || [], r = i.length, a = o.FontBBox || [0, 0, 1e3, 1e3], c = a[3] - a[1] || 1e3, f = n.names && n.names[0] || "CFFFont", u = {
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
    numGlyphs: r
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
    numberOfHMetrics: r
  };
  const g = s?.privateDict?.defaultWidthX ?? 0, p = s?.privateDict?.nominalWidthX ?? 0, d = [];
  for (let y = 0; y < r; y++) {
    let _ = g;
    if (i[y] && i[y].length > 0) {
      const w = n.globalSubrs || [], S = s.localSubrs || [];
      try {
        const b = lo(
          i[y],
          w,
          S
        );
        b.width !== void 0 && (_ = b.width + p);
      } catch {
      }
    }
    d.push({ advanceWidth: _, lsb: 0 });
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
    italicAngle: o.ItalicAngle || 0,
    underlinePosition: o.UnderlinePosition || -100,
    underlineThickness: o.UnderlineThickness || 50,
    isFixedPitch: o.isFixedPitch || 0
  }, s?.encoding && typeof s.encoding != "string") {
    const y = s.encoding.codes || [], _ = new Array(256).fill(0);
    for (let w = 0; w < y.length && w < 256; w++) {
      const S = y[w];
      S >= 0 && S < 256 && (_[S] = w + 1);
    }
    u.cmap = {
      version: 0,
      subtables: [
        {
          platformID: 1,
          encodingID: 0,
          format: 0,
          glyphIdArray: _
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
  const m = ho({ header: { sfVersion: 1330926671 }, tables: u });
  return m._standalone = "cff", m;
}
function Wy(t) {
  const e = new Uint8Array(t), n = [], s = [];
  let o = 0;
  for (; o < e.length && e[o] === 128; ) {
    const c = e[o + 1];
    if (c === 3) break;
    const f = e[o + 2] | e[o + 3] << 8 | e[o + 4] << 16 | e[o + 5] << 24;
    o += 6;
    const u = e.slice(o, o + f);
    o += f, c === 1 ? n.push(u) : c === 2 && s.push(u);
  }
  const i = vr(n), r = vr(s), a = new TextDecoder("latin1").decode(i);
  return Qc(a, r);
}
function qy(t) {
  const e = new TextDecoder("latin1").decode(new Uint8Array(t)), n = "currentfile eexec", s = e.indexOf(n);
  if (s === -1)
    throw new Error('PFA: could not find "currentfile eexec" marker');
  const o = e.slice(0, s + n.length), r = e.slice(s + n.length).replace(/\s/g, ""), a = r.search(/0{64,}$/), c = a > 0 ? r.slice(0, a) : r, f = new Uint8Array(c.length / 2);
  for (let u = 0; u < f.length; u++)
    f[u] = parseInt(c.slice(u * 2, u * 2 + 2), 16);
  return Qc(o, f);
}
function Do(t, e, n) {
  const s = new Uint8Array(t.length);
  let o = e;
  const i = 52845, r = 22719;
  for (let a = 0; a < t.length; a++) {
    const c = t[a];
    s[a] = c ^ o >>> 8, o = (c + o) * i + r & 65535;
  }
  return s.slice(n);
}
function br(t, e) {
  const n = [], s = [], o = [];
  let i = null, r = 0, a = 0, c = 0, f = 0, u = [], l = !1;
  function h(x, m) {
    i && i.length > 0 && o.push(i), i = [{ type: "M", x, y: m }];
  }
  function g(x, m) {
    i && i.push({ type: "L", x, y: m });
  }
  function p(x, m, y, _, w, S) {
    i && i.push({ type: "C", x1: x, y1: m, x2: y, y2: _, x: w, y: S });
  }
  function d(x, m) {
    if (m > 10) return;
    let y = 0;
    for (; y < x.length; ) {
      const _ = x[y];
      if (_ >= 32 && _ <= 246) {
        n.push(_ - 139), y++;
        continue;
      }
      if (_ >= 247 && _ <= 250) {
        n.push((_ - 247) * 256 + x[y + 1] + 108), y += 2;
        continue;
      }
      if (_ >= 251 && _ <= 254) {
        n.push(-(_ - 251) * 256 - x[y + 1] - 108), y += 2;
        continue;
      }
      if (_ === 255) {
        const w = (x[y + 1] << 24 | x[y + 2] << 16 | x[y + 3] << 8 | x[y + 4]) >> 0;
        n.push(w), y += 5;
        continue;
      }
      if (_ === 12) {
        const w = x[y + 1];
        switch (y += 2, w) {
          case 0:
            n.length = 0;
            break;
          case 6: {
            n.length = 0;
            break;
          }
          case 7: {
            f = n[n.length - 4] || 0, c = n[n.length - 2] || 0, r = f, a = n[n.length - 3] || 0, n.length = 0;
            break;
          }
          case 12: {
            const S = n.pop(), b = n.pop();
            n.push(S !== 0 ? b / S : 0);
            break;
          }
          case 16: {
            const S = n.pop(), b = n.pop(), v = n.splice(n.length - b, b);
            if (S === 0) {
              if (l = !1, u.length >= 7) {
                const I = u;
                p(I[1].x, I[1].y, I[2].x, I[2].y, I[3].x, I[3].y), p(I[4].x, I[4].y, I[5].x, I[5].y, I[6].x, I[6].y), r = I[6].x, a = I[6].y;
              }
              u = [], s.push(v[1]), s.push(v[0]);
            } else S === 1 ? (l = !0, u = [{ x: r, y: a }], s.push(...v)) : S === 2 ? s.push(...v) : S === 3 ? s.push(3) : s.push(...v);
            break;
          }
          case 17: {
            s.length > 0 ? n.push(s.pop()) : n.push(0);
            break;
          }
          case 33:
            r = n[n.length - 2] || 0, a = n[n.length - 1] || 0, n.length = 0;
            break;
          default:
            n.length = 0;
            break;
        }
        continue;
      }
      switch (y++, _) {
        case 1:
        // hstem
        case 3:
          n.length = 0;
          break;
        case 4: {
          const w = n.pop() || 0;
          l ? (a += w, u.push({ x: r, y: a })) : (a += w, h(r, a)), n.length = 0;
          break;
        }
        case 5: {
          const w = n.pop() || 0, S = n.pop() || 0;
          r += S, a += w, g(r, a), n.length = 0;
          break;
        }
        case 6: {
          const w = n.pop() || 0;
          r += w, g(r, a), n.length = 0;
          break;
        }
        case 7: {
          const w = n.pop() || 0;
          a += w, g(r, a), n.length = 0;
          break;
        }
        case 8: {
          const w = n.pop() || 0, S = n.pop() || 0, b = n.pop() || 0, v = n.pop() || 0, I = n.pop() || 0, A = n.pop() || 0, C = r + A, O = a + I, T = C + v, D = O + b;
          r = T + S, a = D + w, p(C, O, T, D, r, a), n.length = 0;
          break;
        }
        case 9: {
          i && i.length > 0 && (o.push(i), i = null), n.length = 0;
          break;
        }
        case 10: {
          const w = n.pop();
          w >= 0 && w < e.length && e[w] && d(e[w], m + 1);
          break;
        }
        case 11:
          return;
        case 13: {
          c = n.pop() || 0, f = n.pop() || 0, r = f, n.length = 0;
          break;
        }
        case 14: {
          i && i.length > 0 && (o.push(i), i = null);
          return;
        }
        case 21: {
          const w = n.pop() || 0, S = n.pop() || 0;
          l ? (r += S, a += w, u.push({ x: r, y: a })) : (r += S, a += w, h(r, a)), n.length = 0;
          break;
        }
        case 22: {
          const w = n.pop() || 0;
          l ? (r += w, u.push({ x: r, y: a })) : (r += w, h(r, a)), n.length = 0;
          break;
        }
        case 30: {
          const w = n.pop() || 0, S = n.pop() || 0, b = n.pop() || 0, v = n.pop() || 0, I = r, A = a + v, C = I + b, O = A + S;
          r = C + w, a = O, p(I, A, C, O, r, a), n.length = 0;
          break;
        }
        case 31: {
          const w = n.pop() || 0, S = n.pop() || 0, b = n.pop() || 0, v = n.pop() || 0, I = r + v, A = a, C = I + b, O = A + S;
          r = C, a = O + w, p(I, A, C, O, r, a), n.length = 0;
          break;
        }
        default:
          n.length = 0;
          break;
      }
    }
  }
  return d(t, 0), i && i.length > 0 && o.push(i), { contours: o, width: c };
}
function Yy(t) {
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
  const s = [
    "PaintType",
    "FontType",
    "UniqueID",
    "ItalicAngle",
    "isFixedPitch",
    "UnderlinePosition",
    "UnderlineThickness"
  ];
  for (const a of s) {
    const c = t.match(new RegExp(`/${a}\\s+(-?[\\d.]+)`));
    c && (e[a] = parseFloat(c[1]));
  }
  const o = t.match(/\/isFixedPitch\s+(true|false)/);
  o && (e.isFixedPitch = o[1] === "true" ? 1 : 0);
  const i = t.match(
    /\/FontBBox\s*\{\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*\}/
  );
  if (i)
    e.FontBBox = i.slice(1, 5).map(Number);
  else {
    const a = t.match(
      /\/FontBBox\s*\[\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*\]/
    );
    a && (e.FontBBox = a.slice(1, 5).map(Number));
  }
  const r = t.match(
    /\/FontMatrix\s*\[\s*([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)\s*\]/
  );
  return r && (e.FontMatrix = r.slice(1, 7).map(Number)), e.encoding = Xy(t), e;
}
function Xy(t) {
  const e = /* @__PURE__ */ new Map(), n = /dup\s+(\d+)\s+\/([^\s]+)\s+put/g;
  let s;
  for (; (s = n.exec(t)) !== null; )
    e.set(parseInt(s[1]), s[2]);
  return e;
}
function Ky(t) {
  const e = new TextDecoder("latin1").decode(t), n = e.match(/\/lenIV\s+(\d+)/), s = n ? parseInt(n[1]) : 4, o = {}, i = [
    "BlueFuzz",
    "BlueScale",
    "BlueShift",
    "ForceBold",
    "StdHW",
    "StdVW",
    "defaultWidthX",
    "nominalWidthX"
  ];
  for (const u of i) {
    const l = e.match(new RegExp(`/${u}\\s+(-?[\\d.]+)`));
    l && (o[u] = parseFloat(l[1]));
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
    l && (o[u] = l[1].trim().split(/\s+/).map(Number));
  }
  const r = [], a = e.match(/\/Subrs\s+(\d+)\s+array/);
  if (a) {
    const u = parseInt(a[1]), l = e.slice(a.index);
    Jy(
      l,
      t.slice(In(t, a.index)),
      u,
      s,
      (h, g) => {
        r[h] = g;
      }
    );
  }
  const c = /* @__PURE__ */ new Map(), f = e.match(/\/CharStrings\s+(\d+)\s+dict/);
  if (f) {
    const u = e.slice(f.index), l = t.slice(
      In(t, f.index)
    ), h = /\/([^\s]+)\s+(\d+)\s+(?:RD|-\|)\s/g;
    let g;
    for (; (g = h.exec(u)) !== null; ) {
      const p = g[1], d = parseInt(g[2]), x = g.index + g[0].length, m = In(l, x), y = l.slice(m, m + d), _ = Do(y, 4330, s);
      c.set(p, _);
    }
  }
  return { charStrings: c, subrs: r, privateDict: o };
}
function Jy(t, e, n, s, o) {
  const i = /dup\s+(\d+)\s+(\d+)\s+(?:RD|-\|)\s/g;
  let r;
  for (; (r = i.exec(t)) !== null; ) {
    const a = parseInt(r[1]), c = parseInt(r[2]), f = r.index + r[0].length, u = In(e, f), l = e.slice(u, u + c), h = Do(l, 4330, s);
    o(a, h);
  }
}
function In(t, e) {
  return e;
}
function Qc(t, e) {
  const n = Do(e, 55665, 4), s = Yy(t), { charStrings: o, subrs: i } = Ky(n), r = s.FontBBox || [0, 0, 1e3, 1e3], a = s.FontMatrix || [1e-3, 0, 0, 1e-3, 0, 0], c = Math.round(1 / a[0]), f = s.FontName || s.FamilyName || "Type1Font", u = r[3], l = r[1], h = [];
  if (o.has(".notdef")) {
    const d = br(o.get(".notdef"), i);
    h.push({
      name: ".notdef",
      unicode: null,
      advanceWidth: d.width,
      contours: d.contours.length > 0 ? d.contours : void 0
    });
  } else
    h.push({ name: ".notdef", unicode: null, advanceWidth: 0 });
  const g = /* @__PURE__ */ new Map();
  for (const [d, x] of s.encoding)
    g.set(x, d);
  for (const [d, x] of o) {
    if (d === ".notdef") continue;
    const m = br(x, i), y = g.get(d) ?? null;
    h.push({
      name: d,
      unicode: y,
      advanceWidth: m.width,
      contours: m.contours.length > 0 ? m.contours : void 0
    });
  }
  const p = {
    font: {
      familyName: s.FamilyName || f,
      styleName: "Regular",
      fullName: s.FullName || f,
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
  return s.Weight && (p.font.weight = s.Weight), s.version && (p.font.version = s.version), s.Notice && (p.font.copyright = s.Notice), p;
}
function vr(t) {
  const e = t.reduce((o, i) => o + i.length, 0), n = new Uint8Array(e);
  let s = 0;
  for (const o of t)
    n.set(o, s), s += o.length;
  return n;
}
const Qy = /* @__PURE__ */ new Set([
  "_dirty",
  "_fileName",
  "_originalBuffer",
  "_collection",
  "_collectionFonts",
  "_woff"
]);
function tx(t, e = 2) {
  return JSON.stringify(
    t,
    function(n, s) {
      if (!(this === t && Qy.has(n)))
        return typeof s == "bigint" ? Number(s) : ArrayBuffer.isView(s) && !(s instanceof DataView) ? Array.from(s) : s;
    },
    e
  );
}
function ex(t) {
  return JSON.parse(t);
}
function nx(t) {
  if (!t || typeof t != "object")
    throw new Error("createKerning: input is required (object or array)");
  const e = Array.isArray(t) ? t : [t], n = {}, s = [];
  for (const i of e)
    if (i.classes)
      for (const [r, a] of Object.entries(i.classes)) {
        if (!Array.isArray(a))
          throw new Error(
            `createKerning: class "${r}" must be an array of glyph names`
          );
        n[r] = a;
      }
  for (const i of e)
    if (i.left !== void 0 && i.right !== void 0 && i.value !== void 0)
      kr(i.left, i.right, i.value, n, s);
    else if (i.left !== void 0 && i.pairs) {
      const r = ge(i.left, n);
      for (const [a, c] of Object.entries(i.pairs)) {
        const f = ge(a, n);
        for (const u of r)
          for (const l of f)
            s.push({ left: u, right: l, value: c });
      }
    } else if (i.groups)
      for (const [r, a] of Object.entries(i.groups)) {
        const c = ge(r, n);
        for (const [f, u] of Object.entries(a)) {
          const l = ge(f, n);
          for (const h of c)
            for (const g of l)
              s.push({ left: h, right: g, value: u });
        }
      }
    else if (i.classes && i.pairs)
      for (const r of i.pairs)
        kr(r.left, r.right, r.value, n, s);
  const o = /* @__PURE__ */ new Map();
  for (const i of s)
    o.set(`${i.left}\0${i.right}`, i);
  return [...o.values()];
}
function kr(t, e, n, s, o) {
  const i = ge(t, s), r = ge(e, s);
  for (const a of i)
    for (const c of r)
      o.push({ left: a, right: c, value: n });
}
function sx(t, e, n) {
  const s = t?.kerning;
  if (!s || !Array.isArray(s) || s.length === 0)
    return;
  const o = t.glyphs, i = Dt(o, e), r = Dt(o, n);
  if (!(i === void 0 || r === void 0))
    for (let a = s.length - 1; a >= 0; a--) {
      const c = s[a];
      if (c.left === i && c.right === r) return c.value;
    }
}
function ge(t, e) {
  if (typeof t == "string" && t.startsWith("@")) {
    const n = t.slice(1), s = e[n];
    if (!s)
      throw new Error(`createKerning: unknown class "@${n}"`);
    return s;
  }
  return [t];
}
function ox(t) {
  if (!t || typeof t != "object")
    throw new Error("createSubstitution: input is required (object or array)");
  const e = Array.isArray(t) ? t : [t], n = {}, s = [];
  for (const o of e)
    if (o.classes)
      for (const [i, r] of Object.entries(o.classes)) {
        if (!Array.isArray(r))
          throw new Error(
            `createSubstitution: class "${i}" must be an array of glyph names`
          );
        n[i] = r;
      }
  for (const o of e) {
    const i = o.type;
    if (!i)
      throw new Error(
        'createSubstitution: each rule must have a "type" (single, multiple, alternate, ligature, reverse)'
      );
    const r = o.feature || "liga", a = o.script || "DFLT", c = o.language || null, f = o.substitutions ? o.substitutions : o.substitution ? [o.substitution] : [];
    if (f.length === 0)
      throw new Error(
        `createSubstitution: rule of type "${i}" must have "substitution" or "substitutions"`
      );
    for (const u of f) {
      const l = { type: i, feature: r, script: a, language: c };
      switch (i) {
        case "single":
          s.push({
            ...l,
            from: $t(u.from, n),
            to: $t(u.to, n)
          });
          break;
        case "multiple":
          s.push({
            ...l,
            from: $t(u.from, n),
            to: Me(u.to, n)
          });
          break;
        case "alternate":
          s.push({
            ...l,
            from: $t(u.from, n),
            alternates: Me(u.alternates, n)
          });
          break;
        case "ligature":
          s.push({
            ...l,
            components: Me(u.components, n),
            ligature: $t(u.ligature, n)
          });
          break;
        case "reverse":
          s.push({
            ...l,
            from: $t(u.from, n),
            to: $t(u.to, n),
            backtrack: (u.backtrack || []).map(
              (h) => Me(h, n)
            ),
            lookahead: (u.lookahead || []).map(
              (h) => Me(h, n)
            )
          });
          break;
        default:
          throw new Error(
            `createSubstitution: unknown type "${i}". Valid: single, multiple, alternate, ligature, reverse`
          );
      }
    }
  }
  return s;
}
function ix(t, e, n = {}) {
  const s = t?.substitutions;
  if (!s || !Array.isArray(s) || s.length === 0) return [];
  const o = t.glyphs, i = Dt(o, e);
  return i === void 0 ? [] : s.filter((r) => {
    if (n.type && r.type !== n.type || n.feature && r.feature !== n.feature) return !1;
    switch (r.type) {
      case "single":
      case "multiple":
      case "alternate":
      case "reverse":
        return r.from === i;
      case "ligature":
        return r.components && r.components.includes(i);
      default:
        return !1;
    }
  });
}
function $t(t, e) {
  if (typeof t == "string" && t.startsWith("@")) {
    const n = t.slice(1), s = e[n];
    if (!s)
      throw new Error(`createSubstitution: unknown class "@${n}"`);
    return s;
  }
  return t;
}
function Me(t, e) {
  if (!Array.isArray(t))
    throw new Error(
      "createSubstitution: expected an array of glyph references"
    );
  const n = [];
  for (const s of t)
    if (typeof s == "string" && s.startsWith("@")) {
      const o = s.slice(1), i = e[o];
      if (!i)
        throw new Error(`createSubstitution: unknown class "@${o}"`);
      n.push(...i);
    } else
      n.push(s);
  return n;
}
const rx = [
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
], ax = ["CFF ", "CFF2", "VORG"], cx = [
  "cvar",
  "cvt ",
  "fpgm",
  "gasp",
  "glyf",
  "gvar",
  "loca",
  "prep"
], tf = /* @__PURE__ */ new Set([
  ...rx,
  ...ax,
  ...cx
]), ef = [
  "cmap",
  "head",
  "hhea",
  "hmtx",
  "maxp",
  "name",
  "post"
], fx = /* @__PURE__ */ new Map([
  [65536, "TrueType"],
  [1330926671, "OpenType (CFF)"],
  // 'OTTO'
  [1953658213, "TrueType (Apple)"]
  // 'true'
]);
function L(t, e, n, s) {
  t.push({ severity: e, code: n, message: s });
}
function re(t) {
  const e = t.filter((o) => o.severity === "error"), n = t.filter((o) => o.severity === "warning"), s = t.filter((o) => o.severity === "info");
  return {
    valid: e.length === 0,
    errors: e,
    warnings: n,
    infos: s,
    issues: t,
    summary: {
      errorCount: e.length,
      warningCount: n.length,
      infoCount: s.length,
      issueCount: t.length
    }
  };
}
function ux(t) {
  for (let e = 0; e < t.length; e++) {
    const n = t.charCodeAt(e);
    if (n < 32 || n > 126) return !1;
  }
  return !0;
}
function lx(t, e, n) {
  const s = new DataView(t.buffer, t.byteOffset, t.byteLength);
  let o = 0;
  const i = n & -4;
  for (let r = 0; r < i; r += 4)
    o = o + s.getUint32(e + r) >>> 0;
  if (n & 3) {
    let r = 0;
    for (let a = i; a < n; a++)
      r |= t[e + a] << 24 - 8 * (a - i);
    o = o + r >>> 0;
  }
  return o;
}
function hx(t, e) {
  if (!(t instanceof ArrayBuffer))
    return L(
      e,
      "error",
      "NOT_ARRAYBUFFER",
      "Input is not an ArrayBuffer."
    ), null;
  if (t.byteLength < 12)
    return L(
      e,
      "error",
      "TOO_SHORT",
      `File is only ${t.byteLength} bytes — too short for a valid font header (minimum 12 bytes).`
    ), null;
  const n = new Uint8Array(t), s = String.fromCharCode(n[0], n[1], n[2], n[3]);
  if (s === "wOFF") {
    L(e, "info", "FORMAT_WOFF1", "File is WOFF1-wrapped.");
    try {
      const { sfnt: o } = Gc(t);
      return L(
        e,
        "info",
        "WOFF1_UNWRAPPED",
        "WOFF1 wrapper decompressed successfully."
      ), { format: "woff1", sfnt: o };
    } catch (o) {
      return L(
        e,
        "error",
        "WOFF1_UNWRAP_FAILED",
        `WOFF1 decompression failed: ${o.message}`
      ), null;
    }
  }
  if (s === "wOF2") {
    L(e, "info", "FORMAT_WOFF2", "File is WOFF2-wrapped.");
    try {
      const { sfnt: o } = jc(t);
      return L(
        e,
        "info",
        "WOFF2_UNWRAPPED",
        "WOFF2 wrapper decompressed successfully."
      ), { format: "woff2", sfnt: o };
    } catch (o) {
      return L(
        e,
        "error",
        "WOFF2_UNWRAP_FAILED",
        `WOFF2 decompression failed: ${o.message}`
      ), null;
    }
  }
  return s === "ttcf" ? (L(
    e,
    "info",
    "FORMAT_COLLECTION",
    "File is a font collection (TTC/OTC). Diagnosing the first font in the collection."
  ), { format: "collection", sfnt: t }) : { format: "sfnt", sfnt: t };
}
function px(t, e) {
  const n = new Uint8Array(t), s = new B(n);
  let o;
  try {
    o = {
      sfVersion: s.uint32(),
      numTables: s.uint16(),
      searchRange: s.uint16(),
      entrySelector: s.uint16(),
      rangeShift: s.uint16()
    };
  } catch (a) {
    return L(
      e,
      "error",
      "HEADER_UNREADABLE",
      `Could not read font header: ${a.message}`
    ), null;
  }
  const i = fx.get(o.sfVersion);
  if (i)
    L(
      e,
      "info",
      "SF_VERSION",
      `sfVersion indicates ${i}.`
    );
  else {
    const a = "0x" + o.sfVersion.toString(16).padStart(8, "0");
    L(
      e,
      "error",
      "BAD_SF_VERSION",
      `Unrecognized sfVersion ${a}. Expected 0x00010000 (TrueType), 0x4F54544F (OTTO), or 0x74727565 ('true').`
    );
  }
  o.numTables === 0 ? L(
    e,
    "error",
    "NO_TABLES",
    "numTables is 0 — the font contains no tables."
  ) : o.numTables > 200 && L(
    e,
    "warning",
    "EXCESSIVE_TABLES",
    `numTables is ${o.numTables}, which is unusually high.`
  );
  const r = 12 + o.numTables * 16;
  if (r > t.byteLength)
    return L(
      e,
      "error",
      "DIRECTORY_TRUNCATED",
      `Table directory requires ${r} bytes but the file is only ${t.byteLength} bytes. The file appears truncated.`
    ), null;
  if (o.numTables > 0) {
    const a = 2 ** Math.floor(Math.log2(o.numTables)), c = a * 16, f = Math.floor(Math.log2(a)), u = o.numTables * 16 - c;
    o.searchRange !== c && L(
      e,
      "warning",
      "BAD_SEARCH_RANGE",
      `searchRange is ${o.searchRange}, expected ${c}.`
    ), o.entrySelector !== f && L(
      e,
      "warning",
      "BAD_ENTRY_SELECTOR",
      `entrySelector is ${o.entrySelector}, expected ${f}.`
    ), o.rangeShift !== u && L(
      e,
      "warning",
      "BAD_RANGE_SHIFT",
      `rangeShift is ${o.rangeShift}, expected ${u}.`
    );
  }
  return o;
}
function gx(t, e, n) {
  const s = new Uint8Array(t), o = new B(s, 12), i = [], r = /* @__PURE__ */ new Set();
  for (let a = 0; a < e.numTables; a++) {
    let c;
    try {
      c = {
        tag: o.tag(),
        checksum: o.uint32(),
        offset: o.uint32(),
        length: o.uint32()
      };
    } catch (f) {
      L(
        n,
        "error",
        "DIRECTORY_ENTRY_UNREADABLE",
        `Could not read table directory entry ${a}: ${f.message}`
      );
      continue;
    }
    if (!ux(c.tag)) {
      const f = [...c.tag].map((u) => u.charCodeAt(0).toString(16).padStart(2, "0")).join(" ");
      L(
        n,
        "error",
        "BAD_TABLE_TAG",
        `Table ${a} has non-printable tag bytes (${f}).`
      );
    }
    r.has(c.tag) && L(
      n,
      "error",
      "DUPLICATE_TABLE",
      `Duplicate table tag '${c.tag}'.`
    ), r.add(c.tag), c.offset + c.length > t.byteLength && L(
      n,
      "error",
      "TABLE_OUT_OF_BOUNDS",
      `Table '${c.tag}' extends beyond end of file (offset ${c.offset} + length ${c.length} = ${c.offset + c.length}, but file is ${t.byteLength} bytes).`
    ), c.length === 0 && L(
      n,
      "warning",
      "EMPTY_TABLE",
      `Table '${c.tag}' has zero length.`
    ), c.offset % 4 !== 0 && L(
      n,
      "warning",
      "TABLE_MISALIGNED",
      `Table '${c.tag}' at offset ${c.offset} is not 4-byte aligned.`
    ), i.push(c);
  }
  return i;
}
function dx(t, e) {
  const n = new Set(t.map((i) => i.tag));
  for (const i of ef)
    n.has(i) || L(
      e,
      "error",
      "MISSING_REQUIRED_TABLE",
      `Required table '${i}' is missing.`
    );
  const s = n.has("glyf") && n.has("loca"), o = n.has("CFF ") || n.has("CFF2");
  !s && !o && L(
    e,
    "error",
    "NO_OUTLINES",
    "No outline data found. Expected glyf+loca (TrueType) or CFF/CFF2 (OpenType)."
  ), s && o && L(
    e,
    "warning",
    "MIXED_OUTLINES",
    "Font has both TrueType (glyf) and CFF outlines — unusual."
  );
  for (const i of n)
    tf.has(i) || L(
      e,
      "info",
      "UNKNOWN_TABLE",
      `Unrecognized table '${i}' — will be preserved as raw bytes.`
    );
}
function mx(t, e, n) {
  const s = new Uint8Array(t);
  for (const o of e) {
    if (o.offset + o.length > t.byteLength || o.length === 0 || o.tag === "head") continue;
    const i = lx(s, o.offset, o.length);
    i !== o.checksum && L(
      n,
      "warning",
      "BAD_CHECKSUM",
      `Table '${o.tag}' checksum mismatch: directory says 0x${o.checksum.toString(16).padStart(8, "0")}, computed 0x${i.toString(16).padStart(8, "0")}.`
    );
  }
}
function yx(t, e, n) {
  const s = new Map(e.map((c) => [c.tag, c])), o = {}, i = Yc.filter((c) => s.has(c)), r = e.map((c) => c.tag).filter((c) => !i.includes(c)), a = [...i, ...r];
  for (const c of a) {
    const f = s.get(c);
    if (f.offset + f.length > t.byteLength) continue;
    const u = qc[c];
    if (u)
      try {
        const l = new Uint8Array(t, f.offset, f.length), h = Array.from(l);
        o[c] = u(h, o), L(
          n,
          "info",
          "TABLE_PARSED",
          `Table '${c}' parsed successfully.`
        );
      } catch (l) {
        L(
          n,
          "error",
          "TABLE_PARSE_FAILED",
          `Table '${c}' failed to parse: ${l.message}`
        );
      }
  }
  return o;
}
function xx(t, e, n) {
  const s = new Set(e.map((i) => i.tag));
  if (t.head) {
    t.head.magicNumber !== 1594834165 && L(
      n,
      "error",
      "BAD_MAGIC_NUMBER",
      `head.magicNumber is 0x${(t.head.magicNumber >>> 0).toString(16).padStart(8, "0")}, expected 0x5F0F3CF5.`
    );
    const i = t.head.unitsPerEm;
    i !== void 0 && (i < 16 || i > 16384) && L(
      n,
      "error",
      "BAD_UNITS_PER_EM",
      `head.unitsPerEm is ${i} — must be between 16 and 16384.`
    );
  }
  if (t.maxp && t.hmtx) {
    const i = t.maxp.numGlyphs, r = t.hmtx.hMetrics?.length ?? 0, a = t.hmtx.leftSideBearings?.length ?? 0, c = r + a;
    c !== i && L(
      n,
      "warning",
      "HMTX_GLYPH_MISMATCH",
      `hmtx has ${c} entries (${r} metrics + ${a} LSBs) but maxp.numGlyphs is ${i}.`
    );
  }
  if (t.hhea && t.hmtx) {
    const i = t.hhea.numberOfHMetrics, r = t.hmtx.hMetrics?.length ?? 0;
    r !== i && L(
      n,
      "warning",
      "HHEA_HMTX_MISMATCH",
      `hhea.numberOfHMetrics is ${i} but hmtx has ${r} full metric entries.`
    );
  }
  if (t.loca && t.glyf) {
    const i = t.loca.offsets;
    if (i && i.length > 0) {
      const r = e.find((a) => a.tag === "glyf");
      if (r) {
        const a = i[i.length - 1];
        a > r.length && L(
          n,
          "error",
          "LOCA_BEYOND_GLYF",
          `loca final offset (${a}) exceeds glyf table length (${r.length}).`
        );
      }
    }
  }
  const o = t["CFF "] || t.CFF2;
  if (o && t.maxp) {
    const i = o.topDict?.charStrings?.length ?? o.charStrings?.length ?? null;
    i !== null && i !== t.maxp.numGlyphs && L(
      n,
      "warning",
      "CFF_GLYPH_MISMATCH",
      `CFF charStrings count (${i}) doesn't match maxp.numGlyphs (${t.maxp.numGlyphs}).`
    );
  }
  if (t.name) {
    const i = t.name.nameRecords ?? t.name.names ?? t.name.records ?? [], r = i.some((c) => c.nameID === 1), a = i.some((c) => c.nameID === 2);
    r || L(
      n,
      "warning",
      "NO_FAMILY_NAME",
      "name table has no family name (nameID 1)."
    ), a || L(
      n,
      "warning",
      "NO_STYLE_NAME",
      "name table has no style name (nameID 2)."
    );
  }
  if (t.vhea && t.vmtx) {
    const i = t.vhea.numOfLongVerMetrics ?? t.vhea.numberOfVMetrics, r = t.vmtx.metrics?.length ?? 0;
    i !== void 0 && r !== i && L(
      n,
      "warning",
      "VHEA_VMTX_MISMATCH",
      `vhea.numOfLongVerMetrics is ${i} but vmtx has ${r} full metric entries.`
    );
  }
  s.has("gvar") && !s.has("fvar") && L(
    n,
    "error",
    "GVAR_WITHOUT_FVAR",
    "gvar table present without fvar — glyph variations require a variation axis table."
  );
}
function wx(t) {
  const e = new B(new Uint8Array(t));
  e.skip(4);
  const n = e.uint16();
  e.skip(2);
  const s = e.uint32();
  if (s === 0) return null;
  const o = e.uint32();
  return { majorVersion: n, numFonts: s, firstOffset: o };
}
function Sx(t) {
  const e = [], n = hx(t, e);
  if (!n) return re(e);
  let s = n.sfnt;
  if (n.format === "collection")
    try {
      const a = wx(s);
      if (!a || a.numFonts === 0)
        return L(
          e,
          "error",
          "EMPTY_COLLECTION",
          "Collection contains no fonts."
        ), re(e);
      L(
        e,
        "info",
        "COLLECTION_INFO",
        `Collection contains ${a.numFonts} font(s). Diagnosing the first font at offset ${a.firstOffset}.`
      ), s = t;
    } catch (a) {
      return L(
        e,
        "error",
        "COLLECTION_HEADER_UNREADABLE",
        `Could not read collection header: ${a.message}`
      ), re(e);
    }
  const o = px(s, e);
  if (!o) return re(e);
  const i = gx(s, o, e);
  if (i.length === 0 && o.numTables > 0)
    return L(
      e,
      "error",
      "NO_READABLE_ENTRIES",
      "Could not read any table directory entries."
    ), re(e);
  dx(i, e), mx(s, i, e);
  const r = yx(s, i, e);
  return xx(r, i, e), re(e);
}
function yt(t) {
  return t !== null && typeof t == "object" && !Array.isArray(t);
}
function nf(t) {
  return Number.isInteger(t) && t >= 0 && t <= 4294967295;
}
function sf(t) {
  return Array.isArray(t?._raw);
}
function P(t, e, n, s, o) {
  t.push({ severity: e, code: n, message: s, path: o });
}
function Cr(t) {
  const e = t > 0 ? 2 ** Math.floor(Math.log2(t)) : 0, n = e * 16, s = e > 0 ? Math.floor(Math.log2(e)) : 0, o = t * 16 - n;
  return { searchRange: n, entrySelector: s, rangeShift: o };
}
function Ar(t) {
  return yt(t) && (t["CFF "] || t.CFF2) ? 1330926671 : 65536;
}
function Ir(t) {
  const e = t.filter((o) => o.severity === "error"), n = t.filter((o) => o.severity === "warning"), s = t.filter((o) => o.severity === "info");
  return {
    valid: e.length === 0,
    errors: e,
    warnings: n,
    infos: s,
    issues: t,
    summary: {
      errorCount: e.length,
      warningCount: n.length,
      infoCount: s.length,
      issueCount: t.length
    }
  };
}
function _x(t, e, n, s) {
  let o = t.header;
  if (!yt(o))
    if (yt(t._header))
      t.header = { ...t._header }, o = t.header, P(
        s,
        "info",
        "HEADER_PROMOTED",
        'No "header" found; promoted "_header" for export compatibility.',
        n
      );
    else {
      const a = Ar(t.tables), c = Cr(e);
      t.header = {
        sfVersion: a,
        numTables: e,
        ...c
      }, o = t.header, P(
        s,
        "info",
        "HEADER_SYNTHESIZED",
        `No header found; synthesized one (sfVersion=0x${a.toString(16).toUpperCase().padStart(8, "0")}, ${e} tables).`,
        n
      );
      return;
    }
  if (!nf(o.sfVersion)) {
    const a = Ar(t.tables);
    o.sfVersion = a, P(
      s,
      "info",
      "HEADER_SFVERSION_INFERRED",
      `header.sfVersion was missing or invalid; set to 0x${a.toString(16).toUpperCase().padStart(8, "0")} based on outline tables.`,
      `${n}.sfVersion`
    );
  }
  if (o.numTables !== void 0 && (!Number.isInteger(o.numTables) || o.numTables < 0) && P(
    s,
    "error",
    "HEADER_NUMTABLES_INVALID",
    "header.numTables must be a non-negative integer when provided.",
    `${n}.numTables`
  ), o.numTables !== e) {
    const a = o.numTables;
    o.numTables = e, P(
      s,
      "info",
      "HEADER_NUMTABLES_CORRECTED",
      a === void 0 ? `header.numTables was missing; set to ${e}.` : `header.numTables corrected from ${a} to ${e}.`,
      `${n}.numTables`
    );
  }
  const i = Cr(e);
  (o.searchRange !== i.searchRange || o.entrySelector !== i.entrySelector || o.rangeShift !== i.rangeShift) && (o.searchRange = i.searchRange, o.entrySelector = i.entrySelector, o.rangeShift = i.rangeShift, P(
    s,
    "info",
    "HEADER_FIELDS_CORRECTED",
    `Header directory fields auto-corrected for ${e} tables (searchRange=${i.searchRange}, entrySelector=${i.entrySelector}, rangeShift=${i.rangeShift}).`,
    n
  ));
}
function bx(t, e, n) {
  if (!Array.isArray(t)) {
    P(
      n,
      "error",
      "TABLE_RAW_INVALID_TYPE",
      "_raw must be an array of byte values.",
      e
    );
    return;
  }
  for (let s = 0; s < t.length; s++) {
    const o = t[s];
    if (!Number.isInteger(o) || o < 0 || o > 255) {
      P(
        n,
        "error",
        "TABLE_RAW_INVALID_BYTE",
        `_raw[${s}] must be an integer byte (0-255).`,
        `${e}[${s}]`
      );
      break;
    }
  }
}
function vx(t, e, n) {
  if (!yt(t))
    return P(
      n,
      "error",
      "TABLES_MISSING",
      "Font tables are required and must be an object keyed by 4-char table tag.",
      e
    ), [];
  const s = Object.keys(t);
  s.length === 0 && P(
    n,
    "error",
    "TABLES_EMPTY",
    "Font tables object is empty; at least core required tables are needed.",
    e
  );
  for (const o of s) {
    (typeof o != "string" || o.length !== 4) && P(
      n,
      "error",
      "TABLE_TAG_INVALID",
      `Table tag "${o}" must be exactly 4 characters.`,
      `${e}.${o}`
    );
    const i = t[o], r = `${e}.${o}`;
    if (!yt(i)) {
      P(
        n,
        "error",
        "TABLE_DATA_INVALID",
        `Table "${o}" must be an object.`,
        r
      );
      continue;
    }
    i._checksum !== void 0 && !nf(i._checksum) && P(
      n,
      "error",
      "TABLE_CHECKSUM_INVALID",
      `Table "${o}" _checksum must be uint32 when provided.`,
      `${r}._checksum`
    ), i._raw !== void 0 && bx(i._raw, `${r}._raw`, n);
    const a = tf.has(o), c = sf(i);
    !c && !a ? P(
      n,
      "error",
      "TABLE_WRITER_UNSUPPORTED",
      `Table "${o}" is parsed JSON but no writer is available. Use _raw for unknown tables.`,
      r
    ) : c && !a && P(
      n,
      "info",
      "TABLE_UNRECOGNIZED_RAW",
      `Table "${o}" is not a recognized OpenType table; preserved via _raw bytes.`,
      r
    );
  }
  return s;
}
function kx(t, e, n) {
  const s = (r) => t[r] !== void 0, o = (r) => s(r) && !sf(t[r]), i = (r, a, c = "requires") => {
    if (o(r))
      for (const f of a)
        s(f) || P(
          n,
          "error",
          "TABLE_DEPENDENCY_MISSING",
          `Parsed table "${r}" ${c} table "${f}".`,
          `${e}.${r}`
        );
  };
  i("hmtx", ["hhea", "maxp"]), i("loca", ["head", "maxp"]), i("glyf", ["loca", "head", "maxp"]), i("vmtx", ["vhea", "maxp"]), o("gvar") && !s("fvar") && P(
    n,
    "warning",
    "VARIABLE_TABLE_DEPENDENCY",
    'Parsed table "gvar" usually expects "fvar" to describe variation axes.',
    `${e}.gvar`
  ), o("cvar") && !s("fvar") && P(
    n,
    "warning",
    "VARIABLE_TABLE_DEPENDENCY",
    'Parsed table "cvar" usually expects "fvar" to describe variation axes.',
    `${e}.cvar`
  );
}
function Cx(t, e, n) {
  const s = (r) => t[r] !== void 0;
  for (const r of ef)
    s(r) || P(
      n,
      "error",
      "REQUIRED_TABLE_MISSING",
      `Required core table "${r}" is missing.`,
      e
    );
  s("OS/2") || P(
    n,
    "warning",
    "RECOMMENDED_TABLE_MISSING",
    'Recommended table "OS/2" is missing.',
    e
  );
  const o = s("glyf") || s("loca"), i = s("CFF ") || s("CFF2");
  !o && !i && P(
    n,
    "error",
    "OUTLINE_MISSING",
    "No outline tables found. Include TrueType (glyf+loca) or CFF (CFF / CFF2) outlines.",
    e
  ), o && (s("glyf") || P(
    n,
    "error",
    "TRUETYPE_OUTLINE_INCOMPLETE",
    'TrueType outline requires table "glyf".',
    e
  ), s("loca") || P(
    n,
    "error",
    "TRUETYPE_OUTLINE_INCOMPLETE",
    'TrueType outline requires table "loca".',
    e
  )), o && i && P(
    n,
    "warning",
    "MULTIPLE_OUTLINE_TYPES",
    "Both TrueType and CFF outline tables are present; most fonts use one outline model.",
    e
  );
}
function of(t, e, n) {
  if (!yt(t)) {
    P(
      n,
      "error",
      "FONTDATA_INVALID",
      "Font data must be an object.",
      e
    );
    return;
  }
  const s = vx(t.tables, `${e}.tables`, n);
  _x(t, s.length, `${e}.header`, n), yt(t.tables) && (Cx(t.tables, `${e}.tables`, n), kx(t.tables, `${e}.tables`, n));
}
function Ax(t, e, n) {
  const s = t.collection, o = t.fonts;
  if (yt(s) || P(
    n,
    "error",
    "COLLECTION_META_INVALID",
    "collection must be an object for TTC/OTC inputs.",
    `${e}.collection`
  ), !Array.isArray(o) || o.length === 0) {
    P(
      n,
      "error",
      "COLLECTION_FONTS_INVALID",
      "fonts must be a non-empty array for TTC/OTC inputs.",
      `${e}.fonts`
    );
    return;
  }
  yt(s) && s.numFonts !== void 0 && s.numFonts !== o.length && (s.numFonts = o.length, P(
    n,
    "info",
    "COLLECTION_NUMFONTS_CORRECTED",
    `collection.numFonts corrected to ${o.length} to match fonts array.`,
    `${e}.collection.numFonts`
  ));
  for (let i = 0; i < o.length; i++)
    of(o[i], `${e}.fonts[${i}]`, n);
}
function Ix(t) {
  const e = [];
  return yt(t) ? (t.collection !== void 0 || t.fonts !== void 0 ? Ax(t, "$", e) : of(t, "$", e), Ir(e)) : (P(
    e,
    "error",
    "INPUT_INVALID",
    "validateJSON expects a font JSON object.",
    "$"
  ), Ir(e));
}
const Ox = {
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
class ce {
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
      style: s = "Regular",
      unitsPerEm: o = 1e3,
      ascender: i = 800,
      descender: r = -200
    } = e, a = {
      font: {
        familyName: n,
        styleName: s,
        unitsPerEm: o,
        ascender: i,
        descender: r,
        lineGap: 0
      },
      glyphs: [
        { ...Ox },
        {
          name: "space",
          unicode: 32,
          advanceWidth: Math.round(o / 4)
        }
      ],
      kerning: [],
      // Default gasp table: enable symmetric smoothing at all sizes.
      // Optimal for unhinted fonts — tells rasterizers to use anti-aliasing.
      gasp: [{ maxPPEM: 65535, behavior: 10 }]
    };
    return new ce(a);
  }
  /**
   * Open an existing font from binary data (Scenario 1).
   *
   * @param {ArrayBuffer} buffer - Binary font data (TTF/OTF/WOFF/WOFF2/TTC/OTC).
   * @returns {FontFlux} Single-font instance. For collections, use openAll().
   * @throws {Error} If buffer is a collection (TTC/OTC) — use openAll() instead.
   */
  static open(e) {
    const n = Hn(e);
    if (n.collection && n.fonts)
      throw new Error(
        "FontFlux.open() received a font collection (TTC/OTC). Use FontFlux.openAll() for collections."
      );
    return new ce(n);
  }
  /**
   * Open all fonts from a binary file. Works for both single fonts and collections.
   *
   * @param {ArrayBuffer} buffer - Binary font data.
   * @returns {FontFlux[]} Array of FontFlux instances (one per face).
   */
  static openAll(e) {
    const n = Hn(e);
    return n.collection && n.fonts ? n.fonts.map((s) => new ce(s)) : [new ce(n)];
  }
  /**
   * Restore a font from a JSON string.
   *
   * @param {string} jsonString - JSON produced by font.toJSON().
   * @returns {FontFlux}
   */
  static fromJSON(e) {
    const n = ex(e);
    return new ce(n);
  }
  /**
   * Initialize WOFF2 support. Must be called (and awaited) once before
   * opening or exporting WOFF2 files.
   *
   * @returns {Promise<void>}
   */
  static async initWoff2() {
    return Uc();
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
    const s = {
      collection: {
        tag: "ttcf",
        majorVersion: 2,
        minorVersion: 0,
        numFonts: e.length
      },
      fonts: e.map((o) => o._data)
    };
    return Sr(s, n);
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
    return Sx(e);
  }
  /** Convert an SVG path `d` string to font contours. */
  static svgToContours(e, n) {
    return Or(e, n);
  }
  /** Convert font contours to an SVG path `d` string. */
  static contoursToSVG(e) {
    return _f(e);
  }
  /** Compile CFF contours to Type 2 charstring bytecode. */
  static compileCharString(e) {
    return On(e);
  }
  /** Assemble charstring assembly text to Type 2 bytecode. */
  static assembleCharString(e) {
    return Sf(e);
  }
  /** Interpret Type 2 charstring bytecode to CFF contours. */
  static interpretCharString(e, n, s) {
    return lo(e, n, s);
  }
  /** Disassemble Type 2 charstring bytecode to assembly text. */
  static disassembleCharString(e) {
    return Br(e);
  }
  // ========================================================================
  //  DIRECT DATA ACCESS (live references — zero friction reads)
  // ========================================================================
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
    return as(this._data, e);
  }
  /**
   * Check if a glyph exists.
   * @param {string|number} id
   * @returns {boolean}
   */
  hasGlyph(e) {
    return as(this._data, e) !== void 0;
  }
  /**
   * Add or replace a glyph. If raw options are provided (not a glyph object),
   * they are passed through createGlyph() automatically.
   *
   * @param {object} glyphOrOptions - A glyph object or createGlyph() options.
   */
  addGlyph(e) {
    let n = e;
    (n.path || n.name && n.advanceWidth && !n._created) && (n = If(n));
    const s = this._data.glyphs, o = s.findIndex((i) => i.name === n.name);
    if (o >= 0) {
      s[o] = n;
      return;
    }
    if (n.unicode != null) {
      const i = s.findIndex((r) => r.unicode === n.unicode);
      if (i >= 0) {
        s[i] = n;
        return;
      }
    }
    s.push(n);
  }
  /**
   * Remove a glyph by name, Unicode code point, or hex string.
   * Also removes any kerning pairs referencing the removed glyph.
   *
   * @param {string|number} id
   * @returns {boolean} True if a glyph was removed.
   */
  removeGlyph(e) {
    const n = this._data.glyphs, s = as(this._data, e);
    if (!s) return !1;
    const o = n.indexOf(s);
    return o < 0 ? !1 : (n.splice(o, 1), this._data.kerning && s.name && (this._data.kerning = this._data.kerning.filter(
      (i) => i.left !== s.name && i.right !== s.name
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
    return sx(this._data, e, n);
  }
  /**
   * Add kerning pairs. Accepts all createKerning() input formats.
   * Duplicate pairs are resolved with last-write-wins.
   *
   * @param {object|object[]} pairsOrInput - Kerning data in any supported format.
   */
  addKerning(e) {
    const n = nx(e);
    this._data.kerning || (this._data.kerning = []);
    for (const s of n) {
      const o = this._data.kerning.findIndex(
        (i) => i.left === s.left && i.right === s.right
      );
      o >= 0 ? this._data.kerning[o] = s : this._data.kerning.push(s);
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
    const s = this._data.glyphs, o = Dt(s, e), i = Dt(s, n);
    if (!o || !i) return !1;
    const r = this._data.kerning.findIndex(
      (a) => a.left === o && a.right === i
    );
    return r < 0 ? !1 : (this._data.kerning.splice(r, 1), !0);
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
    return e ? n.filter((s) => !(e.type && s.type !== e.type || e.feature && s.feature !== e.feature)) : n;
  }
  /**
   * Find substitution rules for a specific glyph.
   *
   * @param {string|number} glyphId - Glyph name, code point, or hex string.
   * @param {object} [options] - { type?, feature? }
   * @returns {Array<object>}
   */
  getSubstitution(e, n) {
    return ix(this._data, e, n);
  }
  /**
   * Add substitution rules. Accepts the same flexible formats as
   * createSubstitution(): single rules, arrays, class-based, etc.
   *
   * @param {object|object[]} rulesOrInput - Substitution rule(s).
   */
  addSubstitution(e) {
    const n = ox(e);
    this._data.substitutions || (this._data.substitutions = []);
    for (const s of n)
      this._data.substitutions.push(s);
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
    return this._data.substitutions = this._data.substitutions.filter((s) => !!(e.type && s.type !== e.type || e.feature && s.feature !== e.feature || e.from && s.from !== e.from || e.ligature && s.ligature !== e.ligature)), n - this._data.substitutions.length;
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
    const n = this._data.axes.findIndex((s) => s.tag === e.tag);
    n >= 0 ? this._data.axes[n] = e : this._data.axes.push(e);
  }
  /**
   * Remove an axis by tag. Also removes instances referencing it.
   * @param {string} tag
   * @returns {boolean}
   */
  removeAxis(e) {
    if (!this._data.axes) return !1;
    const n = this._data.axes.findIndex((s) => s.tag === e);
    return n < 0 ? !1 : (this._data.axes.splice(n, 1), this._data.instances && (this._data.instances = this._data.instances.filter(
      (s) => !s.coordinates || !(e in s.coordinates)
    )), this._data.axes.length === 0 && (delete this._data.axes, delete this._data.instances), !0);
  }
  /**
   * Update an axis's properties.
   * @param {string} tag
   * @param {object} partial - Fields to update.
   * @returns {boolean}
   */
  setAxis(e, n) {
    const s = this._data.axes?.find((o) => o.tag === e);
    return s ? (Object.assign(s, n), !0) : !1;
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
      (s) => s.name === e.name
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
    const n = this._data.instances.findIndex((s) => s.name === e);
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
    const n = Eo(e);
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
  setPaletteColor(e, n, s) {
    const o = this._data.palettes?.[e];
    if (!o)
      throw new Error(`Palette ${e} does not exist`);
    if (n < 0 || n >= o.length)
      throw new Error(`Color index ${n} out of range`);
    const i = Eo([s]);
    o[n] = i[0];
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
    const n = Dt(this._data.glyphs, e);
    if (n)
      return this._data.colorGlyphs?.find((s) => s.name === n);
  }
  /**
   * Add color data for a glyph. Replaces existing color data for the same glyph.
   *
   * @param {object} input - Color glyph data with `name` and either `layers` or `paint`.
   */
  addColorGlyph(e) {
    const n = uf(e);
    this._data.colorGlyphs || (this._data.colorGlyphs = []);
    const s = this._data.colorGlyphs.findIndex(
      (o) => o.name === n.name
    );
    s >= 0 ? this._data.colorGlyphs[s] = n : this._data.colorGlyphs.push(n);
  }
  /**
   * Remove color data for a glyph.
   * @param {string|number} id - Glyph name, code point, or hex string.
   * @returns {boolean} True if color data was removed.
   */
  removeColorGlyph(e) {
    if (!this._data.colorGlyphs) return !1;
    const n = Dt(this._data.glyphs, e);
    if (!n) return !1;
    const s = this._data.colorGlyphs.findIndex((o) => o.name === n);
    return s < 0 ? !1 : (this._data.colorGlyphs.splice(s, 1), this._data.colorGlyphs.length === 0 && delete this._data.colorGlyphs, !0);
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
   * @param {string} [options.format] - 'sfnt', 'woff', or 'woff2'.
   * @returns {ArrayBuffer}
   */
  export(e) {
    return Sr(this._data, e);
  }
  /**
   * Serialize the font to a JSON string.
   *
   * @param {number} [indent=2] - Indentation level.
   * @returns {string}
   */
  toJSON(e) {
    return tx(this._data, e);
  }
  /**
   * Validate the font data.
   *
   * @returns {object} { valid, errors, warnings, infos }
   */
  validate() {
    return Ix(this._data);
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
async function Tx() {
  return Uc();
}
export {
  ce as FontFlux,
  Sx as diagnoseFont,
  Tx as initWoff2
};
