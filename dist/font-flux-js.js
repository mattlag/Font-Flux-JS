function ys(t) {
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
function xs(t) {
  const e = (t.red & 255).toString(16).padStart(2, "0"), n = (t.green & 255).toString(16).padStart(2, "0"), o = (t.blue & 255).toString(16).padStart(2, "0");
  if (t.alpha === 255 || t.alpha === void 0)
    return `#${e}${n}${o}`;
  const s = (t.alpha & 255).toString(16).padStart(2, "0");
  return `#${e}${n}${o}${s}`;
}
function Ns(t) {
  if (!Array.isArray(t))
    throw new Error("Palette must be an array of colors");
  return t.map((e) => {
    if (typeof e == "string")
      return ys(e), Lf(e);
    if (e && typeof e == "object" && "red" in e)
      return xs(e);
    throw new Error(`Invalid palette color: ${e}`);
  });
}
function Lf(t) {
  return xs(ys(t));
}
function Bf(t) {
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
function Vf(t) {
  const e = /* @__PURE__ */ new Map();
  for (let n = 0; n < t.length; n++)
    e.set(n, t[n].name);
  return e;
}
function $f(t) {
  const e = /* @__PURE__ */ new Map();
  for (let n = 0; n < t.length; n++)
    t[n].name && e.set(t[n].name, n);
  return e;
}
function An(t, e) {
  !t || typeof t != "object" || (t.glyphID !== void 0 && typeof t.glyphID == "number" && (t.glyphID = e.get(t.glyphID) ?? t.glyphID), t.paint && An(t.paint, e), t.sourcePaint && An(t.sourcePaint, e), t.backdropPaint && An(t.backdropPaint, e));
}
function Cn(t, e) {
  if (!(!t || typeof t != "object")) {
    if (t.glyphID !== void 0 && typeof t.glyphID == "string") {
      const n = e.get(t.glyphID);
      n !== void 0 && (t.glyphID = n);
    }
    t.paint && Cn(t.paint, e), t.sourcePaint && Cn(t.sourcePaint, e), t.backdropPaint && Cn(t.backdropPaint, e);
  }
}
function W(t) {
  if (!Number.isInteger(t) || t < -32768 || t > 32767)
    return Nf(t);
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
function Nf(t) {
  const e = Math.round(t * 65536), n = e < 0 ? e + 4294967296 : e;
  return [
    255,
    n >> 24 & 255,
    n >> 16 & 255,
    n >> 8 & 255,
    n & 255
  ];
}
const Gs = 21, Gf = 22, Pf = 4, Uf = 5, zf = 6, Hf = 7, Wf = 8, Ps = 14;
function Dn(t, e) {
  const n = Number.isFinite(e) ? W(e) : [];
  if (!t || t.length === 0)
    return [
      ...n,
      ...W(0),
      ...W(0),
      Gs,
      Ps
    ];
  const o = [...n];
  let s = 0, r = 0;
  for (const i of t)
    if (!(!i || i.length === 0))
      for (const a of i)
        switch (a.type) {
          case "M": {
            const c = a.x - s, f = a.y - r;
            c === 0 && f !== 0 ? o.push(...W(f), Pf) : f === 0 && c !== 0 ? o.push(...W(c), Gf) : o.push(...W(c), ...W(f), Gs), s = a.x, r = a.y;
            break;
          }
          case "L": {
            const c = a.x - s, f = a.y - r;
            c === 0 && f !== 0 ? o.push(...W(f), Hf) : f === 0 && c !== 0 ? o.push(...W(c), zf) : o.push(...W(c), ...W(f), Uf), s = a.x, r = a.y;
            break;
          }
          case "C": {
            const c = a.x1 - s, f = a.y1 - r, l = a.x2 - a.x1, u = a.y2 - a.y1, h = a.x - a.x2, p = a.y - a.y2;
            o.push(
              ...W(c),
              ...W(f),
              ...W(l),
              ...W(u),
              ...W(h),
              ...W(p),
              Wf
            ), s = a.x, r = a.y;
            break;
          }
        }
  return o.push(Ps), o;
}
const Us = {
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
function jf(t) {
  const e = [], n = t.split(`
`).filter((o) => o.trim().length > 0);
  for (const o of n) {
    const s = o.trim().split(/\s+/);
    if (s.length === 0) continue;
    let r = -1, i = null;
    for (let a = 0; a < s.length; a++) {
      const c = s[a].toLowerCase();
      if (Us[c] || c.startsWith("op")) {
        r = a, i = c;
        break;
      }
    }
    if (r === -1) {
      for (const a of s)
        e.push(...W(parseFloat(a)));
      continue;
    }
    for (let a = 0; a < r; a++)
      e.push(...W(parseFloat(s[a])));
    if (i.startsWith("op12.")) {
      const a = parseInt(i.slice(5), 10);
      e.push(12, a);
    } else i.startsWith("op") ? e.push(parseInt(i.slice(2), 10)) : e.push(...Us[i]);
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
function Yf(t) {
  if (!t || t.length === 0) return "";
  const e = [];
  for (const n of t)
    !n || n.length === 0 || (n[0].type ? e.push(Zf(n)) : e.push(Xf(n)));
  return e.join(" ");
}
function Zf(t) {
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
function Xf(t) {
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
function Ki(t, e = "cff") {
  const n = Jf(t);
  if (n.length === 0) return [];
  const o = [];
  let s = null;
  for (const r of n)
    r.op === "M" ? (s && s.length > 0 && o.push(s), s = [r]) : r.op === "Z" ? (s && s.length > 0 && o.push(s), s = null) : s && s.push(r);
  return s && s.length > 0 && o.push(s), e === "truetype" ? o.map((r) => Kf(r)) : o.map((r) => qf(r));
}
function qf(t) {
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
function Kf(t) {
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
        const o = e[e.length - 1], s = o ? o.x : 0, r = o ? o.y : 0, i = $o(
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
function Jf(t) {
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
function $o(t, e, n, o, s, r, i, a, c = 0) {
  const f = (3 * (n + s) - t - i) / 4, l = (3 * (o + r) - e - a) / 4, u = t + 2 / 3 * (f - t), h = e + 2 / 3 * (l - e), p = i + 2 / 3 * (f - i), g = a + 2 / 3 * (l - a), d = Math.hypot(n - u, o - h), x = Math.hypot(s - p, r - g);
  if (Math.max(d, x) <= 0.5 || c >= 8)
    return [{ cx: f, cy: l, x: i, y: a }];
  const y = (t + n) / 2, w = (e + o) / 2, S = (n + s) / 2, _ = (o + r) / 2, b = (s + i) / 2, A = (r + a) / 2, k = (y + S) / 2, O = (w + _) / 2, v = (S + b) / 2, E = (_ + A) / 2, T = (k + v) / 2, D = (O + E) / 2, R = $o(
    t,
    e,
    y,
    w,
    k,
    O,
    T,
    D,
    c + 1
  ), M = $o(
    T,
    D,
    v,
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
function Qf(t) {
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
    const d = Ki(c, p);
    g.contours = d, p === "cff" && (g.charString = Dn(d));
  } else f ? (g.contours = f, f.length > 0 && f[0] && f[0].length > 0 && f[0][0].type && (g.charString = Dn(f))) : u && (g.components = u);
  return g;
}
function uo(t, e) {
  const n = t?.glyphs;
  if (!n || !Array.isArray(n)) return;
  const o = Ji(e);
  if (o !== void 0)
    return Qi(n, o);
  if (typeof e == "string")
    return n.find((s) => s.name === e);
}
function Rt(t, e) {
  const n = Ji(e);
  if (n !== void 0)
    return Qi(t, n)?.name;
  if (typeof e == "string")
    return e;
}
function Ji(t) {
  if (typeof t == "number") return t;
  if (typeof t == "string") {
    const e = t.match(/^(?:U\+|0x)([0-9A-Fa-f]+)$/i);
    if (e) return parseInt(e[1], 16);
  }
}
function Qi(t, e) {
  for (const n of t)
    if (n.unicode === e || n.unicodes && n.unicodes.includes(e) || n.codePoint === e) return n;
}
function ta(t, e) {
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
function zs(t) {
  return t < 1240 ? 107 : t < 33900 ? 1131 : 32768;
}
function Zn(t, e = [], n = []) {
  const o = [], s = [];
  let r = null, i = 0, a = 0, c = null, f = !1, l = !0;
  const u = zs(e.length), h = zs(n.length);
  function p(S, _) {
    r && r.length > 0 && s.push(r), i += S, a += _, r = [{ type: "M", x: i, y: a }];
  }
  function g(S, _) {
    i += S, a += _, r && r.push({ type: "L", x: i, y: a });
  }
  function d(S, _, b, A, k, O) {
    const v = i + S, E = a + _, T = v + b, D = E + A;
    i = T + k, a = D + O, r && r.push({ type: "C", x1: v, y1: E, x2: T, y2: D, x: i, y: a });
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
          const _ = o[0], b = 0, A = o[1], k = o[2], O = o[3], v = 0, E = o[4], T = 0, D = o[5], R = -k, M = o[6], L = 0;
          d(_, b, A, k, O, v), d(E, T, D, R, M, L);
        }
        o.length = 0;
        break;
      case 35:
        d(o[0], o[1], o[2], o[3], o[4], o[5]), d(o[6], o[7], o[8], o[9], o[10], o[11]), o.length = 0;
        break;
      case 36:
        {
          const _ = o[0], b = o[1], A = o[2], k = o[3], O = o[4], v = 0, E = o[5], T = 0, D = o[6], R = o[7], M = o[8], L = -(b + k + R);
          d(_, b, A, k, O, v), d(E, T, D, R, M, L);
        }
        o.length = 0;
        break;
      case 37:
        {
          const _ = o[0], b = o[1], A = o[2], k = o[3], O = o[4], v = o[5], E = o[6], T = o[7], D = o[8], R = o[9], M = o[10], L = _ + A + O + E + D, H = b + k + v + T + R;
          let P, Y;
          Math.abs(L) > Math.abs(H) ? (P = M, Y = -H) : (P = -L, Y = M), d(_, b, A, k, O, v), d(E, T, D, R, P, Y);
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
      const k = S[A], O = ta(S, A);
      if (O !== null) {
        o.push(O.value), A += O.bytesConsumed;
        continue;
      }
      if (k === 12) {
        A++;
        const v = S[A];
        A++, y(v);
      } else if (k === 19 || k === 20) {
        f || (o.length % 2 !== 0 && (c = o.shift()), f = !0, l = !1), b += o.length >> 1, o.length = 0, A++;
        const v = Math.ceil(b / 8);
        A += v;
      } else if (k === 1 || k === 3 || k === 18 || k === 23)
        f || (o.length % 2 !== 0 && (c = o.shift()), f = !0, l = !1), b += o.length >> 1, o.length = 0, A++;
      else if (k === 10) {
        A++;
        const v = o.pop() + h;
        n[v] && (b = w(n[v], b));
      } else if (k === 29) {
        A++;
        const v = o.pop() + u;
        e[v] && (b = w(e[v], b));
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
const Hs = {
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
}, tl = {
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
function ea(t) {
  const e = [], n = [];
  let o = 0, s = 0;
  for (; s < t.length; ) {
    const r = t[s], i = ta(t, s);
    if (i !== null) {
      n.push(i.value), s += i.bytesConsumed;
      continue;
    }
    if (r === 12) {
      s++;
      const a = t[s];
      s++;
      const c = tl[a] || `op12.${a}`;
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
      const a = Hs[r];
      e.push(n.length ? `${n.join(" ")} ${a}` : a), n.length = 0, s++;
    } else {
      const a = Hs[r] || `op${r}`;
      e.push(n.length ? `${n.join(" ")} ${a}` : a), n.length = 0, s++;
    }
  }
  return n.length && e.push(n.join(" ")), e.join(`
`);
}
const el = /* @__PURE__ */ new Set([
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
function Ss(t) {
  const { header: e, tables: n } = t, o = ol(n), s = il(n), r = { font: o, glyphs: s }, i = al(n, s);
  i.length > 0 && (r.kerning = i), n.fvar && (r.axes = ml(n), r.instances = yl(n));
  const a = Sl(n);
  a && (r.axisMapping = a);
  const c = _l(n);
  c && (r.axisStyles = c);
  const f = wl(n);
  if (f && (r.metricVariations = f), n.GSUB && !n.GSUB._raw) {
    const { substitutions: p, rawLookups: g } = Al(
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
  const u = Dl(n);
  u && (r.palettes = u);
  const h = Rl(n, s);
  return h && h.length > 0 && (r.colorGlyphs = h), r.tables = { ...n }, r._header = e, r;
}
const nl = {
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
function Se(t, e) {
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
function ol(t) {
  const e = t.name, n = t.head, o = t.hhea, s = t["OS/2"], r = t.post, i = {};
  for (const [a, c] of Object.entries(nl)) {
    const f = Se(e, Number(a));
    f !== void 0 && f.trim() !== "" && (i[c] = f);
  }
  return n && !n._raw && (i.unitsPerEm = n.unitsPerEm, i.created = js(n.created), i.modified = js(n.modified)), o && !o._raw && (i.ascender = o.ascender, i.descender = o.descender, i.lineGap = o.lineGap), r && !r._raw && (i.italicAngle = r.italicAngle, i.underlinePosition = r.underlinePosition, i.underlineThickness = r.underlineThickness, i.isFixedPitch = r.isFixedPitch !== 0), s && !s._raw && (i.weightClass = s.usWeightClass, i.widthClass = s.usWidthClass, i.fsType = s.fsType, i.fsSelection = s.fsSelection, i.achVendID = s.achVendID, s.panose && (i.panose = s.panose)), i;
}
function sl(t) {
  const e = /* @__PURE__ */ new Map();
  if (!t || t._raw || !t.subtables) return e;
  for (const n of t.subtables)
    switch (n.format) {
      case 0:
        for (let o = 0; o < n.glyphIdArray.length; o++) {
          const s = n.glyphIdArray[o];
          s !== 0 && Te(e, s, o);
        }
        break;
      case 4:
        for (const o of n.segments)
          for (let s = o.startCode; s <= o.endCode; s++) {
            let r;
            if (o.idRangeOffset === 0)
              r = s + o.idDelta & 65535;
            else {
              const i = o.idRangeOffset / 2 + (s - o.startCode) - (n.segments.length - n.segments.indexOf(o));
              r = n.glyphIdArray[i], r !== void 0 && r !== 0 && (r = r + o.idDelta & 65535);
            }
            r !== void 0 && r !== 0 && Te(e, r, s);
          }
        break;
      case 6:
        for (let o = 0; o < n.glyphIdArray.length; o++) {
          const s = n.glyphIdArray[o];
          s !== 0 && Te(e, s, n.firstCode + o);
        }
        break;
      case 12:
        for (const o of n.groups)
          for (let s = o.startCharCode; s <= o.endCharCode; s++) {
            const r = o.startGlyphID + (s - o.startCharCode);
            r !== 0 && Te(e, r, s);
          }
        break;
      case 13:
        for (const o of n.groups)
          for (let s = o.startCharCode; s <= o.endCharCode; s++)
            o.glyphID !== 0 && Te(e, o.glyphID, s);
        break;
    }
  return e;
}
function Te(t, e, n) {
  t.has(e) || t.set(e, []);
  const o = t.get(e);
  o.includes(n) || o.push(n);
}
function rl(t, e) {
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
function il(t) {
  const e = t.glyf && !t.glyf._raw, n = t["CFF "] && !t["CFF "]._raw, o = t.hmtx && !t.hmtx._raw ? t.hmtx : null, s = t.vmtx && !t.vmtx._raw ? t.vmtx : null, r = t.hhea && !t.hhea._raw ? t.hhea : null, i = t.vhea && !t.vhea._raw ? t.vhea : null;
  let a = 0;
  t.maxp && !t.maxp._raw ? a = t.maxp.numGlyphs : e ? a = t.glyf.glyphs.length : n ? a = t["CFF "].fonts[0].charStrings.length : o && (a = o.hMetrics.length + (o.leftSideBearings?.length || 0));
  const c = r ? r.numberOfHMetrics : a, f = i ? i.numOfLongVerMetrics : 0, l = sl(t.cmap), u = rl(t, a), h = [];
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
        g.charString = y[p], g.charStringDisassembly = ea(y[p]);
        const w = x.globalSubrs || [], S = m.localSubrs || [], _ = Zn(y[p], w, S);
        _.contours.length > 0 && (g.contours = _.contours);
      }
    }
    h.push(g);
  }
  return h;
}
function al(t, e) {
  const n = cl(t, e), o = ul(t, e);
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
function cl(t, e) {
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
        a.format === 1 ? fl(a, e, s) : a.format === 2 && ll(a, e, s);
  }
  return s;
}
function fl(t, e, n) {
  const o = vt(t.coverage);
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
function ll(t, e, n) {
  const o = Ws(t.classDef1, e.length), s = Ws(t.classDef2, e.length), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map(), a = new Set(vt(t.coverage));
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
function vt(t) {
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
function Ws(t, e) {
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
function ul(t, e) {
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
      else s.format === 2 && s.values ? hl(s, e, o) : s.format === 3 && s.kernValues ? gl(s, e, o) : s.format === 1 && s.states && pl(s, e, o);
  return o;
}
function hl(t, e, n) {
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
function gl(t, e, n) {
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
function pl(t, e, n) {
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
        const p = dl(
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
function dl(t, e, n, o, s, r, i, a) {
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
function ml(t) {
  const e = t.fvar;
  return !e || e._raw || !e.axes ? [] : e.axes.map((n) => ({
    tag: n.axisTag,
    name: Se(t.name, n.axisNameID) || n.axisTag,
    min: n.minValue,
    default: n.defaultValue,
    max: n.maxValue,
    hidden: (n.flags & 1) !== 0
  }));
}
function yl(t) {
  const e = t.fvar;
  if (!e || e._raw || !e.instances) return [];
  const n = e.axes;
  return e.instances.map((o) => {
    const s = {};
    for (let i = 0; i < n.length; i++)
      s[n[i].axisTag] = o.coordinates[i];
    const r = {
      name: Se(t.name, o.subfamilyNameID) || `Instance ${o.subfamilyNameID}`,
      coordinates: s
    };
    if (o.postScriptNameID !== void 0) {
      const i = Se(t.name, o.postScriptNameID);
      i && (r.postScriptName = i);
    }
    return r;
  });
}
const na = {
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
}, xl = Object.fromEntries(
  Object.entries(na).map(([t, e]) => [e, t])
);
function Sl(t) {
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
function _l(t) {
  const e = t.STAT, n = t.fvar;
  if (!e || e._raw) return null;
  const o = e.designAxes || [], s = n?.axes || [], r = {};
  return e.elidedFallbackNameID !== void 0 && (r.elidedFallbackName = Se(t.name, e.elidedFallbackNameID) || "Regular"), e.axisValues && e.axisValues.length > 0 && (r.values = e.axisValues.map((i) => {
    const a = (l) => l < o.length ? o[l].axisTag : l < s.length ? s[l].axisTag : `axis${l}`, f = { name: Se(t.name, i.valueNameID) || "", flags: i.flags };
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
function wl(t) {
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
    const f = na[c.valueTag] || c.valueTag, l = c.deltaSetOuterIndex, u = c.deltaSetInnerIndex, h = o.itemVariationData[l];
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
const oa = Date.UTC(1904, 0, 1, 0, 0, 0);
function js(t) {
  if (t == null) return;
  const e = typeof t == "bigint" ? t : BigInt(t);
  if (e === 0n) return;
  const n = Number(e) * 1e3 + oa;
  if (!(!Number.isFinite(n) || n < -864e13 || n > 864e13))
    return new Date(n).toISOString();
}
function Ys(t) {
  if (!t) return 0n;
  const e = Date.parse(t);
  return isNaN(e) ? 0n : BigInt(Math.floor((e - oa) / 1e3));
}
const bl = /* @__PURE__ */ new Set([1, 2, 3, 4, 8]);
function Al(t, e) {
  const n = [], o = [];
  if (!t.featureList || !t.lookupList)
    return { substitutions: n, rawLookups: o };
  const s = Cl(t), r = t.lookupList.lookups, i = /* @__PURE__ */ new Set();
  for (let a = 0; a < r.length; a++) {
    const c = r[a];
    if (c && bl.has(c.lookupType)) {
      const f = s.lookupToFeatures.get(a) || [], l = Il(f);
      for (const u of l) {
        const h = Xs(
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
        const u = Xs(
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
function Cl(t) {
  const e = /* @__PURE__ */ new Map(), n = t.scriptList?.scriptRecords || [], o = t.featureList?.featureRecords || [];
  for (const s of n) {
    const r = s.scriptTag, i = s.script;
    i.defaultLangSys && Zs(
      i.defaultLangSys,
      r,
      null,
      o,
      e
    );
    for (const a of i.langSysRecords || [])
      Zs(
        a.langSys,
        r,
        a.langSysTag,
        o,
        e
      );
  }
  return { lookupToFeatures: e };
}
function Il(t) {
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
function Zs(t, e, n, o, s) {
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
function Xs(t, e, n, o, s, r) {
  const i = [], a = { feature: n, script: o, language: s };
  r && (a.allScripts = r);
  for (const c of t.subtables || [])
    switch (t.lookupType) {
      case 1:
        vl(c, e, a, i);
        break;
      case 2:
        Ol(c, e, a, i);
        break;
      case 3:
        kl(c, e, a, i);
        break;
      case 4:
        El(c, e, a, i);
        break;
      case 8:
        Tl(c, e, a, i);
        break;
    }
  return i;
}
function J(t, e) {
  return t[e]?.name || `glyph${e}`;
}
function vl(t, e, n, o) {
  const s = vt(t.coverage);
  if (t.format === 1)
    for (const r of s) {
      const i = r + t.deltaGlyphID & 65535;
      o.push({
        type: "single",
        ...n,
        from: J(e, r),
        to: J(e, i)
      });
    }
  else if (t.format === 2)
    for (let r = 0; r < s.length; r++)
      o.push({
        type: "single",
        ...n,
        from: J(e, s[r]),
        to: J(e, t.substituteGlyphIDs[r])
      });
}
function Ol(t, e, n, o) {
  const s = vt(t.coverage);
  for (let r = 0; r < s.length; r++)
    o.push({
      type: "multiple",
      ...n,
      from: J(e, s[r]),
      to: (t.sequences[r] || []).map((i) => J(e, i))
    });
}
function kl(t, e, n, o) {
  const s = vt(t.coverage);
  for (let r = 0; r < s.length; r++)
    o.push({
      type: "alternate",
      ...n,
      from: J(e, s[r]),
      alternates: (t.alternateSets[r] || []).map((i) => J(e, i))
    });
}
function El(t, e, n, o) {
  const s = vt(t.coverage);
  for (let r = 0; r < s.length; r++) {
    const i = t.ligatureSets[r] || [];
    for (const a of i) {
      const c = [
        J(e, s[r]),
        ...a.componentGlyphIDs.map((f) => J(e, f))
      ];
      o.push({
        type: "ligature",
        ...n,
        components: c,
        ligature: J(e, a.ligatureGlyph)
      });
    }
  }
}
function Tl(t, e, n, o) {
  const s = vt(t.coverage);
  for (let r = 0; r < s.length; r++)
    o.push({
      type: "reverse",
      ...n,
      from: J(e, s[r]),
      to: J(e, t.substituteGlyphIDs[r]),
      backtrack: (t.backtrackCoverages || []).map(
        (i) => vt(i).map((a) => J(e, a))
      ),
      lookahead: (t.lookaheadCoverages || []).map(
        (i) => vt(i).map((a) => J(e, a))
      )
    });
}
function Dl(t) {
  const e = t.CPAL;
  return !e || e._raw || !e.palettes ? null : e.palettes.map(
    (n) => n.map((o) => xs(o))
  );
}
function Rl(t, e) {
  const n = t.COLR;
  if (!n || n._raw) return null;
  const o = Vf(e), s = [];
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
      An(c, o), a >= 0 ? s[a].paint = c : s.push({ name: i, paint: c });
    }
  return s;
}
function qs(t) {
  const { font: e, glyphs: n } = t, o = n.some((f) => f.charString), s = Fl(n, e), r = {};
  r.head = Ll(e, s), r.hhea = Bl(e, s, n.length), r.maxp = Vl(n, o), r["OS/2"] = $l(e, s), r.name = Nl(e), r.post = Pl(e, n, o), r.cmap = Ul(n), r.hmtx = Wl(n), o ? r["CFF "] = Kl(e, n) : (r.glyf = Zl(n), r.loca = { offsets: [] }), n.some((f) => f.advanceHeight !== void 0) && (r.vhea = jl(n), r.vmtx = Yl(n));
  const a = t._options?.kerningFormat || "gpos";
  if (t.kerning && t.kerning.length > 0) {
    const f = a === "gpos" || a === "gpos+kern", l = a !== "gpos";
    if (f) {
      const u = t.features?.GPOS, h = u?.scriptList?.scriptRecords && u?.featureList?.featureRecords && u?.lookupList?.lookups;
      let p;
      h ? p = nu(u, t.kerning, n) : p = ca(t.kerning, n), p && (r.GPOS = p);
    }
    if (l) {
      const u = Ql(
        t.kerning,
        n,
        a
      );
      u && (r.kern = u);
    }
  }
  if (t.axes && t.axes.length > 0 && (r.fvar = su(t, r.name), t.axisMapping && (r.avar = au(t)), t.axisStyles ? r.STAT = iu(t, r.name) : t.tables?.STAT || (r.STAT = ru(t, r.name)), t.metricVariations && (r.MVAR = cu(t))), t.gasp && (r.gasp = {
    version: 1,
    gaspRanges: t.gasp.map((f) => ({
      rangeMaxPPEM: f.maxPPEM,
      rangeGaspBehavior: f.behavior
    }))
  }), t.cvt && (r["cvt "] = { values: t.cvt }), t.fpgm && (r.fpgm = { instructions: t.fpgm }), t.prep && (r.prep = { instructions: t.prep }), t.features && (t.features.GPOS && !r.GPOS && (r.GPOS = t.features.GPOS), t.features.GDEF && (r.GDEF = t.features.GDEF)), t.substitutions && t.substitutions.length > 0 ? r.GSUB = lu(
    t.substitutions,
    t._rawGSUBLookups || [],
    n
  ) : t._rawGSUBLookups && t._rawGSUBLookups.length > 0 && (r.GSUB = uu(t._rawGSUBLookups)), t.features?.GSUB && !r.GSUB && (r.GSUB = t.features.GSUB), t.palettes && t.palettes.length > 0 && (r.CPAL = _u(t.palettes)), t.colorGlyphs && t.colorGlyphs.length > 0 && (r.COLR = wu(t.colorGlyphs, n)), t.tables)
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
function Fl(t, e) {
  let n = 1 / 0, o = 1 / 0, s = -1 / 0, r = -1 / 0, i = 0, a = 0, c = 1 / 0, f = 1 / 0, l = -1 / 0, u = 65535, h = 0;
  const p = /* @__PURE__ */ new Set();
  for (const x of t) {
    const m = x.advanceWidth || 0;
    a += m, m > i && (i = m);
    const y = Xn(x);
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
  const g = Ks(
    t,
    "xyvw",
    e.ascender ? Math.round(e.ascender / 2) : 0
  ), d = Ks(
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
function Xn(t) {
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
function Ks(t, e, n) {
  for (const o of e) {
    const s = o.charCodeAt(0), r = t.find((i) => (i.unicodes || (i.unicode ? [i.unicode] : [])).includes(s));
    if (r) {
      const i = Xn(r);
      if (i) return i.yMax;
    }
  }
  return n || 0;
}
function Ml(t) {
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
function Ll(t, e) {
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
    created: Ys(t.created),
    modified: Ys(t.modified),
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
function Bl(t, e, n) {
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
function Vl(t, e) {
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
function $l(t, e) {
  const n = (t.weightClass || 400) >= 700, o = (t.italicAngle || 0) !== 0;
  let s = t.fsSelection;
  s === void 0 && (s = 0, n && (s |= 32), o && (s |= 1), !n && !o && (s |= 64), s |= 128);
  const r = Ml(e.unicodeRanges), i = e.unicodeRanges.has(32);
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
function Nl(t) {
  const e = [], n = {
    0: t.copyright || "",
    1: t.familyName || "",
    2: t.styleName || "",
    3: t.uniqueID || Gl(t),
    4: t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim(),
    5: t.version || "Version 1.000",
    6: t.postScriptName || sa(t),
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
function Gl(t) {
  const e = t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim();
  return t.manufacturer ? `${t.manufacturer}: ${e}` : e;
}
function sa(t) {
  const e = (t.familyName || "").replace(/\s/g, ""), n = t.styleName || "Regular";
  return `${e}-${n}`;
}
function Pl(t, e, n = !1) {
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
function Ul(t) {
  const e = /* @__PURE__ */ new Map();
  let n = !1;
  for (let a = 0; a < t.length; a++) {
    const c = t[a], f = c.unicodes || (c.unicode != null ? [c.unicode] : []);
    for (const l of f)
      e.has(l) || e.set(l, a), l > 65535 && (n = !0);
  }
  const o = [...e.entries()].sort((a, c) => a[0] - c[0]), s = [], r = [];
  if (n) {
    const a = zl(o);
    s.push({ format: 12, language: 0, groups: a }), r.push({ platformID: 3, encodingID: 10, subtableIndex: 0 }), r.push({ platformID: 0, encodingID: 4, subtableIndex: 0 });
  }
  const i = o.filter(([a]) => a <= 65535);
  if (i.length > 0) {
    const { segments: a, glyphIdArray: c } = Hl(i), f = s.length;
    s.push({ format: 4, language: 0, segments: a, glyphIdArray: c }), r.push({ platformID: 3, encodingID: 1, subtableIndex: f }), r.push({ platformID: 0, encodingID: 3, subtableIndex: f });
  }
  return { version: 0, encodingRecords: r, subtables: s };
}
function zl(t) {
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
function Hl(t) {
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
function Wl(t) {
  return { hMetrics: t.map((n) => ({
    advanceWidth: n.advanceWidth || 0,
    lsb: n.leftSideBearing ?? 0
  })), leftSideBearings: [] };
}
function jl(t) {
  let e = 0, n = 1 / 0, o = 1 / 0, s = -1 / 0;
  for (const r of t) {
    const i = r.advanceHeight || 0;
    i > e && (e = i);
    const a = Xn(r);
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
function Yl(t) {
  return { vMetrics: t.map((n) => ({
    advanceHeight: n.advanceHeight || 0,
    topSideBearing: n.topSideBearing ?? 0
  })), topSideBearings: [] };
}
function Zl(t) {
  return { glyphs: t.map((n) => {
    if (n.contours && n.contours.length > 0) {
      const o = Xn(n);
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
function Xl(t) {
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
function ra(t, e, n = {}) {
  if (!Number.isFinite(e)) return t;
  const {
    globalSubrs: o = [],
    localSubrs: s = [],
    nominalWidthX: r = 0,
    defaultWidthX: i = 0
  } = n;
  if (!ql(t)) return t;
  let a = null;
  try {
    a = Zn(t, o, s);
  } catch {
    return t;
  }
  if (a.width !== null && a.width !== void 0 || !a.contours || a.contours.length === 0 || e === i) return t;
  const c = Xl(e - r), f = new Array(c.length + t.length);
  for (let l = 0; l < c.length; l++) f[l] = c[l];
  for (let l = 0; l < t.length; l++)
    f[c.length + l] = t[l];
  return f;
}
function ql(t) {
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
function Kl(t, e) {
  const n = t.postScriptName || sa(t), o = e.slice(1).map((p) => p.name || ".notdef"), s = e.map((p) => {
    const g = Number.isFinite(p.advanceWidth) ? p.advanceWidth : void 0;
    return p.charString && p.charString.length > 0 ? ra(p.charString, g) : Dn(p.contours || [], g);
  }), r = [];
  function i(p) {
    const g = 391 + r.length;
    return r.push(p), g;
  }
  const a = t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim(), c = t.familyName || "", f = Jl(t.weightClass), l = o.map((p) => i(p)), u = t.unitsPerEm || 1e3, h = {
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
function Jl(t) {
  return !t || t <= 400 ? "Regular" : t <= 500 ? "Medium" : t <= 600 ? "SemiBold" : t <= 700 ? "Bold" : t <= 800 ? "ExtraBold" : "Black";
}
function Js(t, e) {
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
function rn(t, e) {
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
function Ql(t, e, n) {
  switch (n) {
    case "kern-ot-f0":
    case "gpos+kern":
      return Js(t, e);
    case "kern-ot-f2":
      return tu(t, e);
    case "kern-apple-f0":
      return ia(t, e);
    case "kern-apple-f3":
      return eu(t, e);
    default:
      return Js(t, e);
  }
}
function tu(t, e) {
  const { pairs: n } = rn(t, e);
  if (n.length === 0) return null;
  const {
    leftClasses: o,
    rightClasses: s,
    valueMatrix: r,
    leftGlyphToClass: i,
    rightGlyphToClass: a
  } = aa(n), c = o.length, f = s.length, l = f * 2, u = 8, h = Array.from(i.keys()).sort((O, v) => O - v), p = Array.from(a.keys()).sort(
    (O, v) => O - v
  ), g = h.length > 0 ? h[0] : 0, d = h.length > 0 ? h[h.length - 1] - g + 1 : 0, x = p.length > 0 ? p[0] : 0, m = p.length > 0 ? p[p.length - 1] - x + 1 : 0, y = 4 + d * 2, w = 4 + m * 2, S = u, _ = S + y, b = _ + w, A = [];
  for (let O = 0; O < d; O++) {
    const v = g + O, E = i.get(v) ?? 0;
    A.push(b + E * l);
  }
  const k = [];
  for (let O = 0; O < m; O++) {
    const v = x + O, E = a.get(v) ?? 0;
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
function ia(t, e) {
  const { pairs: n } = rn(t, e);
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
function eu(t, e) {
  const { pairs: n } = rn(t, e);
  if (n.length === 0) return null;
  const {
    leftClasses: o,
    rightClasses: s,
    valueMatrix: r,
    leftGlyphToClass: i,
    rightGlyphToClass: a
  } = aa(n), c = o.length, f = s.length, l = /* @__PURE__ */ new Set();
  l.add(0);
  for (const m of r)
    for (const y of m)
      l.add(y);
  if (c > 255 || f > 255 || l.size > 255)
    return ia(t, e);
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
function aa(t) {
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
function ca(t, e) {
  const { pairs: n } = rn(t, e);
  if (n.length === 0) return null;
  const o = fa(n);
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
function nu(t, e, n) {
  const { pairs: o } = rn(e, n), s = JSON.parse(JSON.stringify(t));
  if (!s.scriptList?.scriptRecords || !s.featureList?.featureRecords || !s.lookupList?.lookups)
    return ca(e, n);
  if (o.length === 0) return s;
  const r = fa(o), i = /* @__PURE__ */ new Set();
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
      ou(s, l);
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
function ou(t, e) {
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
function fa(t) {
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
function su(t, e) {
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
    const f = n.map((u) => a.coordinates[u.tag] ?? u.default), l = {
      subfamilyNameID: c,
      flags: 0,
      coordinates: f
    };
    if (a.postScriptName) {
      const u = s++;
      Ot(e, u, a.postScriptName), l.postScriptNameID = u;
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
function Ot(t, e, n) {
  n && t.names.push(
    { platformID: 3, encodingID: 1, languageID: 1033, nameID: e, value: n },
    { platformID: 1, encodingID: 0, languageID: 0, nameID: e, value: n },
    { platformID: 0, encodingID: 3, languageID: 0, nameID: e, value: n }
  );
}
function ru(t, e) {
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
    const c = n[a], f = o++, l = c.name || c.tag;
    Ot(e, f, l), r.push({
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
function iu(t, e) {
  const { axes: n, axisStyles: o } = t;
  let s = 256;
  for (const f of e.names)
    f.nameID >= s && (s = f.nameID + 1);
  const r = n.map((f) => {
    const l = s++;
    return Ot(e, l, f.name || f.tag), {
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
      if (Ot(e, l, f.name || ""), f._raw)
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
function au(t) {
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
function cu(t) {
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
    const x = xl[g] || g, m = new Array(c.length).fill(0);
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
function fu(t) {
  const e = /* @__PURE__ */ new Map();
  for (let n = 0; n < t.length; n++)
    t[n].name && e.set(t[n].name, n);
  return e;
}
function st(t, e, n) {
  if (typeof t == "string" && n.has(t))
    return n.get(t);
  const o = Rt(e, t);
  if (o !== void 0)
    return n.get(o);
}
function lu(t, e, n) {
  const o = fu(n), s = [], r = /* @__PURE__ */ new Map(), i = hu(t);
  for (const [h, p] of i) {
    const [g, d] = h.split("\0"), x = gu(g, p, n, o);
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
  a.size > 0 && la(s, a);
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
function uu(t) {
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
  o.size > 0 && la(e, o);
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
function hu(t) {
  const e = /* @__PURE__ */ new Map();
  for (const n of t) {
    const o = `${n.type}\0${n.feature}`;
    e.has(o) || e.set(o, []), e.get(o).push(n);
  }
  return e;
}
function gu(t, e, n, o) {
  switch (t) {
    case "single":
      return pu(e, n, o);
    case "multiple":
      return du(e, n, o);
    case "alternate":
      return mu(e, n, o);
    case "ligature":
      return yu(e, n, o);
    case "reverse":
      return xu(e, n, o);
    default:
      return null;
  }
}
function pu(t, e, n) {
  const o = [], s = [];
  for (const i of t) {
    const a = st(i.from, e, n), c = st(i.to, e, n);
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
function du(t, e, n) {
  const o = [];
  for (const s of t) {
    const r = st(s.from, e, n);
    if (r === void 0) continue;
    const i = [];
    let a = !0;
    for (const c of s.to) {
      const f = st(c, e, n);
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
function mu(t, e, n) {
  const o = [];
  for (const s of t) {
    const r = st(s.from, e, n);
    if (r === void 0) continue;
    const i = [];
    let a = !0;
    for (const c of s.alternates) {
      const f = st(c, e, n);
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
function yu(t, e, n) {
  const o = /* @__PURE__ */ new Map();
  for (const i of t) {
    if (!i.components || i.components.length < 2) continue;
    const a = st(i.components[0], e, n), c = st(i.ligature, e, n);
    if (a === void 0 || c === void 0) continue;
    const f = [];
    let l = !0;
    for (let u = 1; u < i.components.length; u++) {
      const h = st(i.components[u], e, n);
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
function xu(t, e, n) {
  const o = [];
  for (const s of t) {
    const r = st(s.from, e, n), i = st(s.to, e, n);
    if (r === void 0 || i === void 0) continue;
    const a = (s.backtrack || []).map((f) => ({ format: 1, glyphs: f.map((u) => st(u, e, n)).filter((u) => u !== void 0).sort((u, h) => u - h) })), c = (s.lookahead || []).map((f) => ({ format: 1, glyphs: f.map((u) => st(u, e, n)).filter((u) => u !== void 0).sort((u, h) => u - h) }));
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
function la(t, e) {
  for (const n of t)
    if (!(!n || !n.subtables) && !(n.lookupType !== 5 && n.lookupType !== 6))
      for (const o of n.subtables)
        Su(o, e);
}
function Su(t, e) {
  if (t.ruleSets) {
    for (const n of t.ruleSets)
      if (n)
        for (const o of n)
          De(o.seqLookupRecords, e);
  }
  if (t.classSets) {
    for (const n of t.classSets)
      if (n)
        for (const o of n)
          De(o.seqLookupRecords, e);
  }
  if (t.seqLookupRecords && De(t.seqLookupRecords, e), t.chainedRuleSets) {
    for (const n of t.chainedRuleSets)
      if (n)
        for (const o of n)
          De(o.seqLookupRecords, e);
  }
  if (t.chainedClassSets) {
    for (const n of t.chainedClassSets)
      if (n)
        for (const o of n)
          De(o.seqLookupRecords, e);
  }
}
function De(t, e) {
  if (t)
    for (const n of t) {
      const o = e.get(n.lookupListIndex);
      o !== void 0 && (n.lookupListIndex = o);
    }
}
function _u(t) {
  if (!t || t.length === 0) return null;
  const e = t[0].length, n = t.map(
    (o) => o.map((s) => ys(s))
  );
  return {
    version: 0,
    numPaletteEntries: e,
    palettes: n
  };
}
function wu(t, e) {
  if (!t || t.length === 0) return null;
  const n = $f(e), o = (h) => n.get(h) ?? 0, s = t.some((h) => h.paint), r = t.filter((h) => h.layers), i = [], a = [], c = r.map((h) => ({ ...h, glyphID: o(h.name) })).sort((h, p) => h.glyphID - p.glyphID);
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
    Cn(p, n), l.push({
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
function bu(t, e, n = !0) {
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
  return o === 29 && n ? { value: t[e + 1] << 24 | t[e + 2] << 16 | t[e + 3] << 8 | t[e + 4] | 0, bytesConsumed: 5 } : o === 30 && n ? Au(t, e + 1) : o === 255 && !n ? { value: (t[e + 1] << 24 | t[e + 2] << 16 | t[e + 3] << 8 | t[e + 4] | 0) / 65536, bytesConsumed: 5 } : null;
}
function Au(t, e) {
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
function ua(t) {
  return Number.isInteger(t) ? Cu(t) : Iu(t);
}
function Cu(t) {
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
function Iu(t) {
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
function vu(t) {
  return t <= 27;
}
function jt(t, e = 0, n = t.length) {
  const o = [], s = [];
  let r = e;
  for (; r < n; ) {
    const i = t[r];
    if (vu(i)) {
      let a;
      i === 12 ? (a = 3072 | t[r + 1], r += 2) : (a = i, r += 1), o.push({ operator: a, operands: [...s] }), s.length = 0;
    } else {
      const a = bu(t, r, !0);
      a === null ? r += 1 : (s.push(a.value), r += a.bytesConsumed);
    }
  }
  return o;
}
function Ft(t, e) {
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
function un(t, e) {
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
function Tt(t) {
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
function hn(t) {
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
const No = {
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
  Object.entries(No).map(([t, e]) => [e, Number(t)])
), Go = {
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
}, Qs = Object.fromEntries(
  Object.entries(Go).map(([t, e]) => [e, Number(t)])
), Po = {
  17: "CharStrings",
  24: "VariationStore",
  3079: "FontMatrix",
  3108: "FDArray",
  3109: "FDSelect"
}, ce = Object.fromEntries(
  Object.entries(Po).map(([t, e]) => [e, Number(t)])
), ha = {
  18: "Private"
}, ga = {
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
function _e(t, e) {
  const n = [];
  for (const [o, s] of Object.entries(t)) {
    const r = e[o];
    if (r === void 0) continue;
    const i = Array.isArray(s) ? s : [s];
    n.push({ operator: r, operands: i });
  }
  return n;
}
function pa(t, e, n) {
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
function da(t) {
  const e = [0];
  for (const n of t)
    e.push(n);
  return e;
}
function Ou(t, e, n) {
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
function ku(t) {
  if (typeof t == "string")
    return [];
  const e = [0];
  for (const n of t)
    e.push(n >> 8 & 255, n & 255);
  return e;
}
function Eu(t, e) {
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
const ma = /* @__PURE__ */ new Set([
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
]), tr = /* @__PURE__ */ new Set([
  19
  // Subrs  (relative offset from Private start)
]);
function In(t, e) {
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
      ) : n.push(...ua(i));
    o >= 3072 ? n.push(12, o & 255) : n.push(o);
  }
  return n;
}
function er(t) {
  const e = [];
  for (let n = 0; n < t.length; n++) e.push(t.charCodeAt(n));
  return e;
}
function nr(t) {
  return String.fromCharCode(...t);
}
function ya(t, e) {
  const n = new Uint8Array(t), o = n[0], s = n[1];
  let i = n[2];
  const a = Ft(n, i);
  i += a.totalBytes;
  const c = a.items.map(nr), f = Ft(n, i);
  i += f.totalBytes;
  const l = Ft(n, i);
  i += l.totalBytes;
  const u = l.items.map(nr), p = Ft(n, i).items.map((d) => Array.from(d)), g = f.items.map((d) => Tu(n, d));
  return {
    majorVersion: o,
    minorVersion: s,
    names: c,
    strings: u,
    globalSubrs: p,
    fonts: g
  };
}
function Tu(t, e) {
  const n = jt(e, 0, e.length), o = Yt(n, No), s = o.CharStrings, r = o.charset ?? 0, i = o.Encoding ?? 0, a = o.Private;
  delete o.CharStrings, delete o.charset, delete o.Encoding, delete o.Private;
  const c = o.FDArray, f = o.FDSelect;
  delete o.FDArray, delete o.FDSelect;
  let l = [];
  s !== void 0 && (l = Ft(t, s).items.map((_) => Array.from(_)));
  const u = l.length, h = Ou(t, r, u), p = Eu(t, i);
  let g = {}, d = [];
  if (Array.isArray(a) && a.length === 2) {
    const [S, _] = a, b = jt(t, _, _ + S);
    g = Yt(b, Go), g.Subrs !== void 0 && (d = Ft(t, _ + g.Subrs).items.map((k) => Array.from(k)), delete g.Subrs);
  }
  const x = o.ROS !== void 0;
  let m, y;
  x && (c !== void 0 && (m = Ft(t, c).items.map((_) => {
    const b = jt(_, 0, _.length), A = Yt(b, No);
    let k = {}, O = [];
    if (Array.isArray(A.Private) && A.Private.length === 2) {
      const [v, E] = A.Private, T = jt(t, E, E + v);
      k = Yt(T, Go), k.Subrs !== void 0 && (O = Ft(t, E + k.Subrs).items.map((R) => Array.from(R)), delete k.Subrs), delete A.Private;
    }
    return {
      fontDict: A,
      privateDict: k,
      localSubrs: O
    };
  })), f !== void 0 && (y = pa(t, f, u)));
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
function xa(t) {
  const {
    majorVersion: e = 1,
    minorVersion: n = 0,
    names: o = [],
    strings: s = [],
    globalSubrs: r = [],
    fonts: i = []
  } = t, a = [e, n, 4, 4], c = Tt(o.map(er)), f = Tt(s.map(er)), l = Tt(
    r.map((w) => new Uint8Array(w))
  ), u = i.map((w) => Du(w)), h = i.map(
    (w, S) => or(
      w,
      u[S],
      /* baseOffset */
      0
    )
  ), p = Tt(h);
  let d = a.length + c.length + p.length + f.length + l.length;
  const x = i.map((w, S) => {
    const _ = or(w, u[S], d);
    return d += u[S].totalSize, _;
  }), m = Tt(x);
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
function Du(t) {
  const e = [], n = {};
  let o = 0;
  const s = (t.charStrings || []).map((u) => !u || u.length === 0 ? new Uint8Array([14]) : new Uint8Array(u)), r = Tt(s);
  n.charStrings = o, e.push(r), o += r.length;
  const i = t.charset;
  if (typeof i == "string")
    n.charset = i === "ISOAdobe" ? 0 : i === "Expert" ? 1 : 2, n.charsetIsPredefined = !0;
  else {
    const u = ku(i || []);
    n.charset = o, n.charsetIsPredefined = !1, e.push(u), o += u.length;
  }
  const a = t.encoding;
  if (typeof a == "string")
    n.encoding = a === "Standard" ? 0 : 1, n.encodingIsPredefined = !0;
  else if (a && typeof a == "object") {
    const u = Ru(a);
    n.encoding = o, n.encodingIsPredefined = !1, e.push(u), o += u.length;
  } else
    n.encoding = 0, n.encodingIsPredefined = !0;
  const c = _e(
    t.privateDict || {},
    Qs
  );
  let f = null;
  if (t.localSubrs && t.localSubrs.length > 0 && (f = Tt(t.localSubrs.map((u) => new Uint8Array(u)))), f) {
    const h = In(
      c,
      tr
    ).length + 6;
    c.push({
      operator: Qs.Subrs,
      operands: [h]
    });
  }
  const l = In(c, tr);
  if (n.privateOffset = o, n.privateSize = l.length, e.push(l), o += l.length, f && (e.push(f), o += f.length), t.isCIDFont) {
    if (t.fdSelect) {
      const u = da(t.fdSelect);
      n.fdSelect = o, e.push(u), o += u.length;
    }
    if (t.fdArray) {
      const u = t.fdArray.map((p) => {
        const g = _e(
          p.fontDict || {},
          ht
        );
        return In(g, ma);
      }), h = Tt(u);
      n.fdArray = o, e.push(h), o += h.length;
    }
  }
  return { sections: e, totalSize: o, offsets: n };
}
function or(t, e, n) {
  const o = e.offsets, s = _e(
    t.topDict || {},
    ht
  );
  return s.push({
    operator: ht.CharStrings,
    operands: [n + o.charStrings]
  }), o.charsetIsPredefined ? o.charset !== 0 && s.push({
    operator: ht.charset,
    operands: [o.charset]
  }) : s.push({
    operator: ht.charset,
    operands: [n + o.charset]
  }), o.encodingIsPredefined ? o.encoding !== 0 && s.push({
    operator: ht.Encoding,
    operands: [o.encoding]
  }) : s.push({
    operator: ht.Encoding,
    operands: [n + o.encoding]
  }), s.push({
    operator: ht.Private,
    operands: [o.privateSize, n + o.privateOffset]
  }), t.isCIDFont && (o.fdArray !== void 0 && s.push({
    operator: ht.FDArray,
    operands: [n + o.fdArray]
  }), o.fdSelect !== void 0 && s.push({
    operator: ht.FDSelect,
    operands: [n + o.fdSelect]
  })), In(s, ma);
}
function Ru(t) {
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
class I {
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
const Uo = 32768, zo = 32767;
function Pt(t) {
  const e = new F(t), n = e.uint16(), o = e.offset32(), s = e.uint16(), r = e.array(
    "offset32",
    s
  ), i = Fu(
    e,
    o
  ), a = [];
  for (let c = 0; c < s; c++) {
    const f = r[c];
    f === 0 ? a.push(null) : a.push(Mu(e, f));
  }
  return {
    format: n,
    variationRegionList: i,
    itemVariationData: a
  };
}
function Fu(t, e) {
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
function Mu(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.uint16(), r = t.array("uint16", s), i = (o & Uo) !== 0, a = o & zo, c = [];
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
function ee(t) {
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
    const d = g.regionIndexes.length, x = (g.wordDeltaCount & Uo) !== 0, m = g.wordDeltaCount & zo, y = 6 + 2 * d, w = x ? 4 : 2, S = x ? 2 : 1, _ = m * w + (d - m) * S, b = y + g.itemCount * _;
    f += b;
  }
  const u = f, h = new I(u);
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
    const d = g.regionIndexes.length, x = (g.wordDeltaCount & Uo) !== 0, m = g.wordDeltaCount & zo;
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
function Lu(t) {
  const e = ee(t), n = e.length, o = new Uint8Array(2 + n);
  return o[0] = n >> 8 & 255, o[1] = n & 255, o.set(new Uint8Array(e), 2), o;
}
const Bu = Object.fromEntries(
  Object.entries(ha).map(([t, e]) => [e, Number(t)])
), Vu = Object.fromEntries(
  Object.entries(ga).map(([t, e]) => [e, Number(t)])
), $u = /* @__PURE__ */ new Set([
  17,
  // CharStrings
  24,
  // VariationStore
  3108,
  // FDArray
  3109
  // FDSelect
]), Nu = /* @__PURE__ */ new Set([
  18
  // Private  (size + offset)
]), sr = /* @__PURE__ */ new Set([
  19
  // Subrs  (relative offset)
]);
function vn(t, e) {
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
      ) : n.push(...ua(i));
    o >= 3072 ? n.push(12, o & 255) : n.push(o);
  }
  return n;
}
function Gu(t, e) {
  const n = new Uint8Array(t), o = n[0], s = n[1], r = n[2], i = n[3] << 8 | n[4], a = r, c = a + i, f = jt(n, a, c), l = Yt(f, Po), u = l.CharStrings, h = l.VariationStore, p = l.FDArray, g = l.FDSelect;
  delete l.CharStrings, delete l.VariationStore, delete l.FDArray, delete l.FDSelect;
  const x = un(n, c).items.map((b) => Array.from(b));
  let m = [];
  u !== void 0 && (m = un(n, u).items.map((A) => Array.from(A)));
  const y = m.length;
  let w = [];
  p !== void 0 && (w = un(n, p).items.map((A) => {
    const k = jt(A, 0, A.length), O = Yt(k, {
      ...ha,
      ...Po
      // Font DICTs can also have FontMatrix
    });
    let v = {}, E = [];
    if (Array.isArray(O.Private) && O.Private.length === 2) {
      const [T, D] = O.Private, R = jt(n, D, D + T);
      v = Yt(R, ga), v.Subrs !== void 0 && (E = un(n, D + v.Subrs).items.map((L) => Array.from(L)), delete v.Subrs), delete O.Private;
    }
    return {
      fontDict: O,
      privateDict: v,
      localSubrs: E
    };
  }));
  let S = null;
  g !== void 0 && y > 0 && (S = pa(n, g, y));
  let _ = null;
  if (h !== void 0) {
    const b = n[h] << 8 | n[h + 1];
    _ = Pt(
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
function Pu(t) {
  const {
    majorVersion: e = 2,
    minorVersion: n = 0,
    topDict: o = {},
    globalSubrs: s = [],
    charStrings: r = [],
    fontDicts: i = [],
    fdSelect: a = null,
    variationStore: c = null
  } = t, f = hn(
    s.map((T) => new Uint8Array(T))
  ), l = hn(r.map((T) => new Uint8Array(T))), u = a ? da(a) : null, h = c ? Lu(c) : null, g = rr(o, {
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
    const D = _e(
      T.privateDict || {},
      Vu
    );
    let R = null;
    if (T.localSubrs && T.localSubrs.length > 0 && (R = hn(T.localSubrs.map((L) => new Uint8Array(L)))), R) {
      const H = vn(D, sr).length + 6;
      D.push({
        operator: 19,
        // Subrs
        operands: [H]
      });
    }
    const M = vn(D, sr);
    return {
      privBytes: M,
      localSubrBytes: R,
      totalSize: M.length + (R ? R.length : 0)
    };
  }), b = [];
  for (const T of _)
    b.push({ offset: m, size: T.privBytes.length }), m += T.totalSize;
  let A = null, k;
  if (i.length > 0) {
    const T = i.map((D, R) => {
      const M = _e(D.fontDict || {}, {
        ...Bu,
        ...ce
      });
      return M.push({
        operator: 18,
        // Private
        operands: [b[R].size, b[R].offset]
      }), vn(M, Nu);
    });
    A = hn(T), k = m, m += A.length;
  }
  const O = rr(o, {
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
function rr(t, e) {
  const n = _e(t, ce);
  return e.charStrings !== void 0 && n.push({
    operator: ce.CharStrings,
    operands: [e.charStrings]
  }), e.fdArray !== void 0 && n.push({
    operator: ce.FDArray,
    operands: [e.fdArray]
  }), e.fdSelect !== void 0 && n.push({
    operator: ce.FDSelect,
    operands: [e.fdSelect]
  }), e.variationStore !== void 0 && n.push({
    operator: ce.VariationStore,
    operands: [e.variationStore]
  }), vn(n, $u);
}
const Uu = 8, zu = 4;
function Hu(t) {
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
function Wu(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.defaultVertOriginY ?? 0, s = t.vertOriginYMetrics ?? [], r = t.numVertOriginYMetrics ?? s.length, i = s.slice(0, r);
  for (; i.length < r; )
    i.push({ glyphIndex: 0, vertOriginY: o });
  const a = new I(
    Uu + r * zu
  );
  a.uint16(e), a.uint16(n), a.int16(o), a.uint16(r);
  for (const c of i)
    a.uint16(c.glyphIndex ?? 0), a.int16(c.vertOriginY ?? o);
  return a.toArray();
}
const ju = 8;
function Yu(t) {
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
function Zu(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.reserved ?? 0, s = t.segmentMaps ?? [];
  let r = ju;
  for (const a of s) {
    const c = a.axisValueMaps?.length ?? a.positionMapCount ?? 0;
    r += 2 + c * 4;
  }
  const i = new I(r);
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
    const e = 4 + t.glyphs.length * 2, n = new I(e);
    return n.uint16(1), n.uint16(t.glyphs.length), n.array("uint16", t.glyphs), n.toArray();
  }
  if (t.format === 2) {
    const e = 4 + t.ranges.length * 6, n = new I(e);
    n.uint16(2), n.uint16(t.ranges.length);
    for (const o of t.ranges)
      n.uint16(o.startGlyphID), n.uint16(o.endGlyphID), n.uint16(o.startCoverageIndex);
    return n.toArray();
  }
  throw new Error(`Unknown Coverage format: ${t.format}`);
}
function Bt(t, e) {
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
function Vt(t) {
  if (t.format === 1) {
    const e = 6 + t.classValues.length * 2, n = new I(e);
    return n.uint16(1), n.uint16(t.startGlyphID), n.uint16(t.classValues.length), n.array("uint16", t.classValues), n.toArray();
  }
  if (t.format === 2) {
    const e = 4 + t.ranges.length * 6, n = new I(e);
    n.uint16(2), n.uint16(t.ranges.length);
    for (const o of t.ranges)
      n.uint16(o.startGlyphID), n.uint16(o.endGlyphID), n.uint16(o.class);
    return n.toArray();
  }
  throw new Error(`Unknown ClassDef format: ${t.format}`);
}
function we(t, e) {
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
function Rn(t) {
  if (t.format === 32768) {
    const u = new I(6);
    return u.uint16(t.deltaSetOuterIndex), u.uint16(t.deltaSetInnerIndex), u.uint16(32768), u.toArray();
  }
  const { startSize: e, endSize: n, deltaFormat: o, deltaValues: s } = t;
  let r;
  if (o === 1) r = 2;
  else if (o === 2) r = 4;
  else if (o === 3) r = 8;
  else throw new Error(`Unknown Device deltaFormat: ${o}`);
  const i = 16 / r, a = Math.ceil(s.length / i), c = (1 << r) - 1, f = 6 + a * 2, l = new I(f);
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
function Sa(t, e) {
  t.seek(e);
  const n = t.uint16(), o = [];
  for (let r = 0; r < n; r++)
    o.push({
      scriptTag: t.tag(),
      scriptOffset: t.uint16()
    });
  return { scriptRecords: o.map((r) => ({
    scriptTag: r.scriptTag,
    script: Xu(t, e + r.scriptOffset)
  })) };
}
function Xu(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = [];
  for (let a = 0; a < o; a++)
    s.push({
      langSysTag: t.tag(),
      langSysOffset: t.uint16()
    });
  const r = n !== 0 ? ir(t, e + n) : null, i = s.map((a) => ({
    langSysTag: a.langSysTag,
    langSys: ir(t, e + a.langSysOffset)
  }));
  return { defaultLangSys: r, langSysRecords: i };
}
function ir(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.uint16(), r = t.array("uint16", s);
  return { lookupOrderOffset: n, requiredFeatureIndex: o, featureIndices: r };
}
function _a(t) {
  const { scriptRecords: e } = t, n = e.map((a) => qu(a.script)), o = 2 + e.length * 6, s = [];
  let r = o;
  for (const a of n)
    s.push(r), r += a.length;
  const i = new I(r);
  i.uint16(e.length);
  for (let a = 0; a < e.length; a++)
    i.tag(e[a].scriptTag), i.uint16(s[a]);
  for (let a = 0; a < n.length; a++)
    i.seek(s[a]), i.rawBytes(n[a]);
  return i.toArray();
}
function qu(t) {
  const { defaultLangSys: e, langSysRecords: n } = t, o = n.map((l) => ar(l.langSys)), s = e ? ar(e) : null;
  let i = 4 + n.length * 6;
  const a = s ? i : 0;
  s && (i += s.length);
  const c = [];
  for (const l of o)
    c.push(i), i += l.length;
  const f = new I(i);
  f.uint16(a), f.uint16(n.length);
  for (let l = 0; l < n.length; l++)
    f.tag(n[l].langSysTag), f.uint16(c[l]);
  s && (f.seek(a), f.rawBytes(s));
  for (let l = 0; l < o.length; l++)
    f.seek(c[l]), f.rawBytes(o[l]);
  return f.toArray();
}
function ar(t) {
  const e = 6 + t.featureIndices.length * 2, n = new I(e);
  return n.uint16(t.lookupOrderOffset), n.uint16(t.requiredFeatureIndex), n.uint16(t.featureIndices.length), n.array("uint16", t.featureIndices), n.toArray();
}
function wa(t, e) {
  t.seek(e);
  const n = t.uint16(), o = [];
  for (let r = 0; r < n; r++)
    o.push({
      featureTag: t.tag(),
      featureOffset: t.uint16()
    });
  return { featureRecords: o.map((r) => ({
    featureTag: r.featureTag,
    feature: ba(t, e + r.featureOffset)
  })) };
}
function ba(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.array("uint16", o);
  return { featureParamsOffset: n, lookupListIndices: s };
}
function Aa(t) {
  const { featureRecords: e } = t, n = e.map((a) => Ca(a.feature)), o = 2 + e.length * 6, s = [];
  let r = o;
  for (const a of n)
    s.push(r), r += a.length;
  const i = new I(r);
  i.uint16(e.length);
  for (let a = 0; a < e.length; a++)
    i.tag(e[a].featureTag), i.uint16(s[a]);
  for (let a = 0; a < n.length; a++)
    i.seek(s[a]), i.rawBytes(n[a]);
  return i.toArray();
}
function Ca(t) {
  const e = 4 + t.lookupListIndices.length * 2, n = new I(e);
  return n.uint16(t.featureParamsOffset), n.uint16(t.lookupListIndices.length), n.array("uint16", t.lookupListIndices), n.toArray();
}
function Ia(t, e, n, o) {
  t.seek(e);
  const s = t.uint16();
  return { lookups: t.array("uint16", s).map(
    (a) => Ku(t, e + a, n, o)
  ) };
}
function Ku(t, e, n, o) {
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
function va(t, e, n) {
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
    }), b = new I(S);
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
      const v = _.map(() => {
        const T = O;
        return O += s, T;
      }), E = new I(O);
      E.uint16(n), E.uint16(S), E.uint16(_.length), E.array("uint16", v), A && E.uint16(b);
      for (let T = 0; T < _.length; T++)
        E.seek(v[T]), E.uint16(1), E.uint16(w), E.uint32(0);
      return {
        compactBytes: E.toArray(),
        subtableOffsets: v,
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
    ), m = new I(g);
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
  }), h = new I(l);
  h.uint16(o.length), h.array("uint16", u);
  for (let p = 0; p < a.length; p++)
    h.seek(u[p]), h.rawBytes(a[p]);
  return h.toArray();
}
function Oa(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const o = t.uint16(), s = t.uint16(), r = [];
    for (let c = 0; c < s; c++)
      r.push(t.uint16());
    const i = $(t, e + o), a = r.map(
      (c) => c === 0 ? null : Ju(t, e + c)
    );
    return { format: n, coverage: i, seqRuleSets: a };
  }
  if (n === 2) {
    const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = [];
    for (let l = 0; l < r; l++)
      i.push(t.uint16());
    const a = $(t, e + o), c = Bt(t, e + s), f = i.map(
      (l) => l === 0 ? null : Qu(t, e + l)
    );
    return { format: n, coverage: a, classDef: c, classSeqRuleSets: f };
  }
  if (n === 3) {
    const o = t.uint16(), s = t.uint16(), r = t.array("uint16", o), i = an(t, s), a = r.map(
      (c) => $(t, e + c)
    );
    return { format: n, coverages: a, seqLookupRecords: i };
  }
  throw new Error(`Unknown SequenceContext format: ${n}`);
}
function Ju(t, e) {
  t.seek(e);
  const n = t.uint16();
  return t.array("uint16", n).map((s) => {
    t.seek(e + s);
    const r = t.uint16(), i = t.uint16(), a = t.array("uint16", r - 1), c = an(t, i);
    return { glyphCount: r, inputSequence: a, seqLookupRecords: c };
  });
}
function Qu(t, e) {
  t.seek(e);
  const n = t.uint16();
  return t.array("uint16", n).map((s) => {
    t.seek(e + s);
    const r = t.uint16(), i = t.uint16(), a = t.array("uint16", r - 1), c = an(t, i);
    return { glyphCount: r, inputSequence: a, seqLookupRecords: c };
  });
}
function an(t, e) {
  const n = [];
  for (let o = 0; o < e; o++)
    n.push({
      sequenceIndex: t.uint16(),
      lookupListIndex: t.uint16()
    });
  return n;
}
function ka(t) {
  if (t.format === 1) return th(t);
  if (t.format === 2) return eh(t);
  if (t.format === 3) return nh(t);
  throw new Error(`Unknown SequenceContext format: ${t.format}`);
}
function th(t) {
  const { coverage: e, seqRuleSets: n } = t, o = G(e), s = n.map(
    (l) => l === null ? null : Ea(l)
  );
  let i = 6 + n.length * 2;
  const a = i;
  i += o.length;
  const c = s.map((l) => {
    if (l === null) return 0;
    const u = i;
    return i += l.length, u;
  }), f = new I(i);
  f.uint16(1), f.uint16(a), f.uint16(n.length), f.array("uint16", c), f.seek(a), f.rawBytes(o);
  for (let l = 0; l < s.length; l++)
    s[l] && (f.seek(c[l]), f.rawBytes(s[l]));
  return f.toArray();
}
function eh(t) {
  const { coverage: e, classDef: n, classSeqRuleSets: o } = t, s = G(e), r = Vt(n), i = o.map(
    (p) => p === null ? null : Ea(p)
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
  }), h = new I(c);
  h.uint16(2), h.uint16(f), h.uint16(l), h.uint16(o.length), h.array("uint16", u), h.seek(f), h.rawBytes(s), h.seek(l), h.rawBytes(r);
  for (let p = 0; p < i.length; p++)
    i[p] && (h.seek(u[p]), h.rawBytes(i[p]));
  return h.toArray();
}
function nh(t) {
  const { coverages: e, seqLookupRecords: n } = t, o = e.map(G);
  let r = 6 + e.length * 2 + n.length * 4;
  const i = o.map((c) => {
    const f = r;
    return r += c.length, f;
  }), a = new I(r);
  a.uint16(3), a.uint16(e.length), a.uint16(n.length), a.array("uint16", i), qn(a, n);
  for (let c = 0; c < o.length; c++)
    a.seek(i[c]), a.rawBytes(o[c]);
  return a.toArray();
}
function Ea(t) {
  const e = t.map(oh);
  let o = 2 + t.length * 2;
  const s = e.map((i) => {
    const a = o;
    return o += i.length, a;
  }), r = new I(o);
  r.uint16(t.length), r.array("uint16", s);
  for (let i = 0; i < e.length; i++)
    r.seek(s[i]), r.rawBytes(e[i]);
  return r.toArray();
}
function oh(t) {
  const { glyphCount: e, inputSequence: n, seqLookupRecords: o } = t, s = 4 + (e - 1) * 2 + o.length * 4, r = new I(s);
  return r.uint16(e), r.uint16(o.length), r.array("uint16", n), qn(r, o), r.toArray();
}
function qn(t, e) {
  for (const n of e)
    t.uint16(n.sequenceIndex), t.uint16(n.lookupListIndex);
}
function Ta(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const o = t.uint16(), s = t.uint16(), r = [];
    for (let c = 0; c < s; c++)
      r.push(t.uint16());
    const i = $(t, e + o), a = r.map(
      (c) => c === 0 ? null : sh(t, e + c)
    );
    return { format: n, coverage: i, chainedSeqRuleSets: a };
  }
  if (n === 2) {
    const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = t.uint16(), a = t.uint16(), c = [];
    for (let g = 0; g < a; g++)
      c.push(t.uint16());
    const f = $(t, e + o), l = Bt(
      t,
      e + s
    ), u = Bt(
      t,
      e + r
    ), h = Bt(
      t,
      e + i
    ), p = c.map(
      (g) => g === 0 ? null : rh(t, e + g)
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
    const o = t.uint16(), s = t.array("uint16", o), r = t.uint16(), i = t.array("uint16", r), a = t.uint16(), c = t.array("uint16", a), f = t.uint16(), l = an(t, f), u = s.map(
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
function sh(t, e) {
  t.seek(e);
  const n = t.uint16();
  return t.array("uint16", n).map((s) => Da(t, e + s));
}
function Da(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.array("uint16", n), s = t.uint16(), r = t.array("uint16", s - 1), i = t.uint16(), a = t.array("uint16", i), c = t.uint16(), f = an(t, c);
  return {
    backtrackSequence: o,
    inputGlyphCount: s,
    inputSequence: r,
    lookaheadSequence: a,
    seqLookupRecords: f
  };
}
function rh(t, e) {
  t.seek(e);
  const n = t.uint16();
  return t.array("uint16", n).map((s) => Da(t, e + s));
}
function Ra(t) {
  if (t.format === 1) return ih(t);
  if (t.format === 2) return ah(t);
  if (t.format === 3) return ch(t);
  throw new Error(`Unknown ChainedSequenceContext format: ${t.format}`);
}
function ih(t) {
  const { coverage: e, chainedSeqRuleSets: n } = t, o = G(e), s = n.map(
    (l) => l === null ? null : Fa(l)
  );
  let i = 6 + n.length * 2;
  const a = i;
  i += o.length;
  const c = s.map((l) => {
    if (l === null) return 0;
    const u = i;
    return i += l.length, u;
  }), f = new I(i);
  f.uint16(1), f.uint16(a), f.uint16(n.length), f.array("uint16", c), f.seek(a), f.rawBytes(o);
  for (let l = 0; l < s.length; l++)
    s[l] && (f.seek(c[l]), f.rawBytes(s[l]));
  return f.toArray();
}
function ah(t) {
  const {
    coverage: e,
    backtrackClassDef: n,
    inputClassDef: o,
    lookaheadClassDef: s,
    chainedClassSeqRuleSets: r
  } = t, i = G(e), a = Vt(n), c = Vt(o), f = Vt(s), l = r.map(
    (w) => w === null ? null : Fa(w)
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
  }), y = new I(h);
  y.uint16(2), y.uint16(p), y.uint16(g), y.uint16(d), y.uint16(x), y.uint16(r.length), y.array("uint16", m), y.seek(p), y.rawBytes(i), y.seek(g), y.rawBytes(a), y.seek(d), y.rawBytes(c), y.seek(x), y.rawBytes(f);
  for (let w = 0; w < l.length; w++)
    l[w] && (y.seek(m[w]), y.rawBytes(l[w]));
  return y.toArray();
}
function ch(t) {
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
  }), p = new I(f);
  p.uint16(3), p.uint16(e.length), p.array("uint16", l), p.uint16(n.length), p.array("uint16", u), p.uint16(o.length), p.array("uint16", h), p.uint16(s.length), qn(p, s);
  for (let g = 0; g < r.length; g++)
    p.seek(l[g]), p.rawBytes(r[g]);
  for (let g = 0; g < i.length; g++)
    p.seek(u[g]), p.rawBytes(i[g]);
  for (let g = 0; g < a.length; g++)
    p.seek(h[g]), p.rawBytes(a[g]);
  return p.toArray();
}
function Fa(t) {
  const e = t.map(fh);
  let o = 2 + t.length * 2;
  const s = e.map((i) => {
    const a = o;
    return o += i.length, a;
  }), r = new I(o);
  r.uint16(t.length), r.array("uint16", s);
  for (let i = 0; i < e.length; i++)
    r.seek(s[i]), r.rawBytes(e[i]);
  return r.toArray();
}
function fh(t) {
  const {
    backtrackSequence: e,
    inputGlyphCount: n,
    inputSequence: o,
    lookaheadSequence: s,
    seqLookupRecords: r
  } = t, i = 2 + e.length * 2 + 2 + o.length * 2 + 2 + s.length * 2 + 2 + r.length * 4, a = new I(i);
  return a.uint16(e.length), a.array("uint16", e), a.uint16(n), a.array("uint16", o), a.uint16(s.length), a.array("uint16", s), a.uint16(r.length), qn(a, r), a.toArray();
}
function Ma(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.uint32(), r = [];
  for (let a = 0; a < s; a++)
    r.push({
      conditionSetOffset: t.uint32(),
      featureTableSubstitutionOffset: t.uint32()
    });
  const i = r.map((a) => {
    const c = a.conditionSetOffset !== 0 ? lh(t, e + a.conditionSetOffset) : null, f = a.featureTableSubstitutionOffset !== 0 ? uh(
      t,
      e + a.featureTableSubstitutionOffset
    ) : null;
    return { conditionSet: c, featureTableSubstitution: f };
  });
  return { majorVersion: n, minorVersion: o, featureVariationRecords: i };
}
function lh(t, e) {
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
function uh(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.uint16(), r = [];
  for (let i = 0; i < s; i++) {
    const a = t.uint16(), c = t.uint32(), f = ba(t, e + c);
    r.push({ featureIndex: a, feature: f });
  }
  return { majorVersion: n, minorVersion: o, substitutions: r };
}
function La(t) {
  const { majorVersion: e, minorVersion: n, featureVariationRecords: o } = t, s = o.map((f) => ({
    csBytes: f.conditionSet ? hh(f.conditionSet) : null,
    ftsBytes: f.featureTableSubstitution ? ph(f.featureTableSubstitution) : null
  }));
  let i = 8 + o.length * 8;
  const a = s.map((f) => {
    const l = f.csBytes ? i : 0;
    f.csBytes && (i += f.csBytes.length);
    const u = f.ftsBytes ? i : 0;
    return f.ftsBytes && (i += f.ftsBytes.length), { csOff: l, ftsOff: u };
  }), c = new I(i);
  c.uint16(e), c.uint16(n), c.uint32(o.length);
  for (const f of a)
    c.uint32(f.csOff), c.uint32(f.ftsOff);
  for (let f = 0; f < s.length; f++) {
    const l = s[f];
    l.csBytes && (c.seek(a[f].csOff), c.rawBytes(l.csBytes)), l.ftsBytes && (c.seek(a[f].ftsOff), c.rawBytes(l.ftsBytes));
  }
  return c.toArray();
}
function hh(t) {
  const e = t.conditions.map(gh);
  let o = 2 + t.conditions.length * 4;
  const s = e.map((i) => {
    const a = o;
    return o += i.length, a;
  }), r = new I(o);
  r.uint16(t.conditions.length);
  for (const i of s) r.uint32(i);
  for (let i = 0; i < e.length; i++)
    r.seek(s[i]), r.rawBytes(e[i]);
  return r.toArray();
}
function gh(t) {
  if (t.format === 1) {
    const e = new I(8);
    return e.uint16(1), e.uint16(t.axisIndex), e.int16(t.filterRangeMinValue), e.int16(t.filterRangeMaxValue), e.toArray();
  }
  throw new Error(`Unknown Condition format: ${t.format}`);
}
function ph(t) {
  const e = t.substitutions.map((i) => Ca(i.feature));
  let o = 6 + t.substitutions.length * 6;
  const s = e.map((i) => {
    const a = o;
    return o += i.length, a;
  }), r = new I(o);
  r.uint16(t.majorVersion), r.uint16(t.minorVersion), r.uint16(t.substitutions.length);
  for (let i = 0; i < t.substitutions.length; i++)
    r.uint16(t.substitutions[i].featureIndex), r.uint32(s[i]);
  for (let i = 0; i < e.length; i++)
    r.seek(s[i]), r.rawBytes(e[i]);
  return r.toArray();
}
const dh = 8, mh = 12;
function yh(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.offset16(), r = e.offset16(), i = n > 1 || n === 1 && o >= 1 ? e.offset32() : 0, a = [s, r, i].filter(
    (c) => c > 0
  );
  return {
    majorVersion: n,
    minorVersion: o,
    horizAxis: s ? cr(t, s) : null,
    vertAxis: r ? cr(t, r) : null,
    itemVariationStore: i ? Pt(
      t.slice(
        i,
        xh(t.length, i, a)
      )
    ) : null
  };
}
function xh(t, e, n) {
  return n.filter((s) => s > e).sort((s, r) => s - r)[0] ?? t;
}
function cr(t, e) {
  if (e + 4 > t.length) return null;
  const n = new F(t);
  n.seek(e);
  const o = n.offset16(), s = n.offset16(), r = o ? Sh(n, e + o) : null, i = s ? _h(n, e + s) : [];
  return { baseTagList: r, baseScriptList: i };
}
function Sh(t, e) {
  t.seek(e);
  const n = t.uint16(), o = [];
  for (let s = 0; s < n; s++)
    o.push(t.tag());
  return o;
}
function _h(t, e) {
  t.seek(e);
  const n = t.uint16(), o = [];
  for (let s = 0; s < n; s++)
    o.push({ tag: t.tag(), off: t.offset16() });
  return o.map((s) => ({
    tag: s.tag,
    ...wh(t, e + s.off)
  }));
}
function wh(t, e) {
  t.seek(e);
  const n = t.offset16(), o = t.offset16(), s = t.uint16(), r = [];
  for (let i = 0; i < s; i++)
    r.push({ tag: t.tag(), off: t.offset16() });
  return {
    baseValues: n ? bh(t, e + n) : null,
    defaultMinMax: o ? fr(t, e + o) : null,
    langSystems: r.map((i) => ({
      tag: i.tag,
      minMax: fr(t, e + i.off)
    }))
  };
}
function bh(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = [];
  for (let r = 0; r < o; r++)
    s.push(t.offset16());
  return {
    defaultBaselineIndex: n,
    baseCoords: s.map(
      (r) => r ? Le(t, e + r) : null
    )
  };
}
function fr(t, e) {
  t.seek(e);
  const n = t.offset16(), o = t.offset16(), s = t.uint16(), r = [];
  for (let i = 0; i < s; i++)
    r.push({
      tag: t.tag(),
      minOff: t.offset16(),
      maxOff: t.offset16()
    });
  return {
    minCoord: n ? Le(t, e + n) : null,
    maxCoord: o ? Le(t, e + o) : null,
    featMinMax: r.map((i) => ({
      tag: i.tag,
      minCoord: i.minOff ? Le(t, e + i.minOff) : null,
      maxCoord: i.maxOff ? Le(t, e + i.maxOff) : null
    }))
  };
}
function Le(t, e) {
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
      device: s ? we(t, e + s) : null
    };
  }
  return { format: n, coordinate: o };
}
function Ah(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = e > 1 || e === 1 && n >= 1, s = lr(t.horizAxis), r = lr(t.vertAxis), i = o && t.itemVariationStore ? ee(t.itemVariationStore) : [];
  let c = o ? mh : dh;
  const f = s.length ? c : 0;
  c += s.length;
  const l = r.length ? c : 0;
  c += r.length;
  const u = i.length ? c : 0;
  c += i.length;
  const h = new I(c);
  return h.uint16(e), h.uint16(n), h.offset16(f), h.offset16(l), o && h.offset32(u), h.rawBytes(s), h.rawBytes(r), h.rawBytes(i), h.toArray();
}
function lr(t) {
  if (!t) return [];
  if (t._raw) return t._raw;
  const e = t.baseTagList ? Ch(t.baseTagList) : [], n = Ih(t.baseScriptList ?? []);
  let s = 4;
  const r = e.length ? s : 0;
  s += e.length;
  const i = n.length ? s : 0;
  s += n.length;
  const a = new I(s);
  return a.offset16(r), a.offset16(i), a.rawBytes(e), a.rawBytes(n), a.toArray();
}
function Ch(t) {
  const e = 2 + 4 * t.length, n = new I(e);
  n.uint16(t.length);
  for (const o of t)
    n.tag(o);
  return n.toArray();
}
function Ih(t) {
  const e = 2 + 6 * t.length, n = t.map((i) => vh(i));
  let o = e;
  const s = n.map((i) => {
    const a = o;
    return o += i.length, a;
  }), r = new I(o);
  r.uint16(t.length);
  for (let i = 0; i < t.length; i++)
    r.tag(t[i].tag), r.offset16(s[i]);
  for (const i of n)
    r.rawBytes(i);
  return r.toArray();
}
function vh(t) {
  const e = Oh(t.baseValues), n = ur(t.defaultMinMax), o = t.langSystems ?? [], s = o.map((u) => ur(u.minMax));
  let i = 6 + 6 * o.length;
  const a = e.length ? i : 0;
  i += e.length;
  const c = n.length ? i : 0;
  i += n.length;
  const f = s.map((u) => {
    const h = u.length ? i : 0;
    return i += u.length, h;
  }), l = new I(i);
  l.offset16(a), l.offset16(c), l.uint16(o.length);
  for (let u = 0; u < o.length; u++)
    l.tag(o[u].tag), l.offset16(f[u]);
  l.rawBytes(e), l.rawBytes(n);
  for (const u of s)
    l.rawBytes(u);
  return l.toArray();
}
function Oh(t) {
  if (!t) return [];
  const e = t.baseCoords ?? [], n = 4 + 2 * e.length, o = e.map((a) => Be(a));
  let s = n;
  const r = o.map((a) => {
    const c = a.length ? s : 0;
    return s += a.length, c;
  }), i = new I(s);
  i.uint16(t.defaultBaselineIndex ?? 0), i.uint16(e.length);
  for (const a of r)
    i.offset16(a);
  for (const a of o)
    i.rawBytes(a);
  return i.toArray();
}
function ur(t) {
  if (!t) return [];
  const e = t.featMinMax ?? [], n = 6 + 8 * e.length, o = Be(t.minCoord), s = Be(t.maxCoord), r = e.map((u) => ({
    tag: u.tag,
    min: Be(u.minCoord),
    max: Be(u.maxCoord)
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
  }), l = new I(i);
  l.offset16(a), l.offset16(c), l.uint16(e.length);
  for (let u = 0; u < e.length; u++)
    l.tag(e[u].tag), l.offset16(f[u].minOff), l.offset16(f[u].maxOff);
  l.rawBytes(o), l.rawBytes(s);
  for (const u of r)
    l.rawBytes(u.min), l.rawBytes(u.max);
  return l.toArray();
}
function Be(t) {
  if (!t) return [];
  if (t.format === 1) {
    const e = new I(4);
    return e.uint16(1), e.int16(t.coordinate), e.toArray();
  }
  if (t.format === 2) {
    const e = new I(8);
    return e.uint16(2), e.int16(t.coordinate), e.uint16(t.referenceGlyph ?? 0), e.uint16(t.baseCoordPoint ?? 0), e.toArray();
  }
  if (t.format === 3) {
    const e = t.device ? Rn(t.device) : [], n = e.length ? 6 : 0, o = new I(6 + e.length);
    return o.uint16(3), o.int16(t.coordinate), o.offset16(n), o.rawBytes(e), o.toArray();
  }
  return [];
}
const Ge = 5, Kt = 8;
function gn(t) {
  return {
    height: t.uint8(),
    width: t.uint8(),
    bearingX: t.int8(),
    bearingY: t.int8(),
    advance: t.uint8()
  };
}
function ho(t, e) {
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
function Pe(t, e) {
  t.uint8(e.height ?? 0), t.uint8(e.width ?? 0), t.int8(e.horiBearingX ?? 0), t.int8(e.horiBearingY ?? 0), t.uint8(e.horiAdvance ?? 0), t.int8(e.vertBearingX ?? 0), t.int8(e.vertBearingY ?? 0), t.uint8(e.vertAdvance ?? 0);
}
function _s(t, e) {
  const n = new F(t), o = n.uint32(), s = e?.CBLC;
  if (!s?.sizes)
    return { version: o, data: Array.from(t.slice(4)) };
  const r = [];
  for (const i of s.sizes) {
    const a = [];
    for (const c of i.indexSubTables ?? [])
      a.push(kh(t, n, c));
    r.push(a);
  }
  return { version: o, bitmapData: r };
}
function ws(t) {
  const e = t.version ?? 196608;
  if (t.data) {
    const o = t.data, s = new I(4 + o.length);
    return s.uint32(e), s.rawBytes(o), s.toArray();
  }
  const n = new I(4);
  return n.uint32(e), n.toArray();
}
function go(t, e) {
  const n = t.version ?? 196608, o = t.bitmapData ?? [], s = e.sizes ?? [], r = [], i = [];
  let a = 4;
  for (let l = 0; l < s.length; l++) {
    const u = s[l].indexSubTables ?? [], h = o[l] ?? [], p = [];
    for (let g = 0; g < u.length; g++) {
      const d = u[g], x = h[g] ?? [], { bytes: m, info: y } = Eh(x, d, a);
      p.push(y), r.push(m), a += m.length;
    }
    i.push(p);
  }
  const c = a, f = new I(c);
  f.uint32(n);
  for (const l of r)
    f.rawBytes(l);
  return { bytes: f.toArray(), offsetInfo: i };
}
function kh(t, e, n) {
  const { indexFormat: o, imageFormat: s, imageDataOffset: r } = n, i = [];
  switch (o) {
    case 1:
    case 3: {
      const a = n.sbitOffsets;
      for (let c = 0; c < a.length - 1; c++) {
        const f = r + a[c], u = r + a[c + 1] - f;
        u <= 0 ? i.push(null) : i.push(
          pn(t, e, f, s, u)
        );
      }
      break;
    }
    case 2: {
      const a = n.lastGlyphIndex - n.firstGlyphIndex + 1, { imageSize: c } = n;
      for (let f = 0; f < a; f++) {
        const l = r + f * c;
        i.push(
          pn(t, e, l, s, c)
        );
      }
      break;
    }
    case 4: {
      const a = n.glyphArray;
      for (let c = 0; c < a.length - 1; c++) {
        const f = r + a[c].sbitOffset, u = r + a[c + 1].sbitOffset - f;
        u <= 0 ? i.push(null) : i.push(
          pn(t, e, f, s, u)
        );
      }
      break;
    }
    case 5: {
      const a = n.glyphIdArray.length, { imageSize: c } = n;
      for (let f = 0; f < a; f++) {
        const l = r + f * c;
        i.push(
          pn(t, e, l, s, c)
        );
      }
      break;
    }
  }
  return i;
}
function pn(t, e, n, o, s) {
  if (s <= 0) return null;
  e.seek(n);
  const r = (i, a) => t.slice(i, i + a);
  switch (o) {
    case 1: {
      const i = gn(e), a = r(
        e.position,
        s - Ge
      );
      return { smallMetrics: i, imageData: a };
    }
    case 2: {
      const i = gn(e), a = r(
        e.position,
        s - Ge
      );
      return { smallMetrics: i, imageData: a };
    }
    case 5:
      return { imageData: r(n, s) };
    case 6: {
      const i = fe(e), a = r(
        e.position,
        s - Kt
      );
      return { bigMetrics: i, imageData: a };
    }
    case 7: {
      const i = fe(e), a = r(
        e.position,
        s - Kt
      );
      return { bigMetrics: i, imageData: a };
    }
    case 8: {
      const i = gn(e);
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
      const i = fe(e), a = e.uint16(), c = [];
      for (let f = 0; f < a; f++)
        c.push({
          glyphID: e.uint16(),
          xOffset: e.int8(),
          yOffset: e.int8()
        });
      return { bigMetrics: i, components: c };
    }
    case 17: {
      const i = gn(e), a = e.uint32(), c = r(e.position, a);
      return { smallMetrics: i, imageData: c };
    }
    case 18: {
      const i = fe(e), a = e.uint32(), c = r(e.position, a);
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
function Eh(t, e, n) {
  const { indexFormat: o, imageFormat: s } = e, r = { imageDataOffset: n }, i = t.map(
    (f) => f ? Th(f, s) : []
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
  const a = i.reduce((f, l) => f + l.length, 0), c = new I(a);
  for (const f of i)
    c.rawBytes(f);
  return { bytes: c.toArray(), info: r };
}
function Th(t, e) {
  switch (e) {
    case 1:
    case 2: {
      const n = t.imageData ?? [], o = new I(Ge + n.length);
      return ho(o, t.smallMetrics ?? {}), o.rawBytes(n), o.toArray();
    }
    case 5: {
      const n = t.imageData ?? [];
      return Array.from(n);
    }
    case 6:
    case 7: {
      const n = t.imageData ?? [], o = new I(Kt + n.length);
      return Pe(o, t.bigMetrics ?? {}), o.rawBytes(n), o.toArray();
    }
    case 8: {
      const n = t.components ?? [], o = new I(
        Ge + 1 + 2 + n.length * 4
      );
      ho(o, t.smallMetrics ?? {}), o.uint8(0), o.uint16(n.length);
      for (const s of n)
        o.uint16(s.glyphID ?? 0), o.int8(s.xOffset ?? 0), o.int8(s.yOffset ?? 0);
      return o.toArray();
    }
    case 9: {
      const n = t.components ?? [], o = new I(Kt + 2 + n.length * 4);
      Pe(o, t.bigMetrics ?? {}), o.uint16(n.length);
      for (const s of n)
        o.uint16(s.glyphID ?? 0), o.int8(s.xOffset ?? 0), o.int8(s.yOffset ?? 0);
      return o.toArray();
    }
    case 17: {
      const n = t.imageData ?? [], o = new I(Ge + 4 + n.length);
      return ho(o, t.smallMetrics ?? {}), o.uint32(n.length), o.rawBytes(n), o.toArray();
    }
    case 18: {
      const n = t.imageData ?? [], o = new I(Kt + 4 + n.length);
      return Pe(o, t.bigMetrics ?? {}), o.uint32(n.length), o.rawBytes(n), o.toArray();
    }
    case 19: {
      const n = t.imageData ?? [], o = new I(4 + n.length);
      return o.uint32(n.length), o.rawBytes(n), o.toArray();
    }
    default:
      return Array.from(t.imageData ?? []);
  }
}
function Dh(t, e) {
  return _s(t, e?.bloc ? { CBLC: e.bloc } : e);
}
function Rh(t) {
  return ws(t);
}
const Ba = 48;
function bs(t) {
  return Fh(t);
}
function de(t, e) {
  return e ? Lh(t, e) : $h(t);
}
function Fh(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint32(), r = [], i = [];
  for (let a = 0; a < s; a++) {
    const c = e.uint32();
    e.uint32();
    const f = e.uint32(), l = e.uint32(), u = hr(e), h = hr(e), p = e.uint16(), g = e.uint16(), d = e.uint8(), x = e.uint8(), m = e.uint8(), y = e.int8();
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
    f !== 0 && (r[a].indexSubTables = Mh(
      e,
      c,
      f
    ));
  }
  return { majorVersion: n, minorVersion: o, sizes: r };
}
function Mh(t, e, n) {
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
        l.imageSize = t.uint32(), l.bigMetrics = fe(t);
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
        l.imageSize = t.uint32(), l.bigMetrics = fe(t);
        const h = t.uint32();
        l.glyphIdArray = t.array("uint16", h);
        break;
      }
    }
    s.push(l);
  }
  return s;
}
function Lh(t, e) {
  const n = t.majorVersion ?? 2, o = t.minorVersion ?? 0, s = t.sizes ?? [], r = s.map(
    (l, u) => Bh(l.indexSubTables ?? [], e[u] ?? [])
  );
  let a = 8 + s.length * Ba;
  const c = [];
  for (const l of r)
    c.push(a), a += l.length;
  const f = new I(a);
  f.uint16(n), f.uint16(o), f.uint32(s.length);
  for (let l = 0; l < s.length; l++) {
    const u = s[l], h = u.indexSubTables ?? [];
    f.uint32(c[l]), f.uint32(r[l].length), f.uint32(h.length), f.uint32(u.colorRef ?? 0), Fn(f, u.hori ?? {}), Fn(f, u.vert ?? {}), f.uint16(u.startGlyphIndex ?? 0), f.uint16(u.endGlyphIndex ?? 0), f.uint8(u.ppemX ?? 0), f.uint8(u.ppemY ?? 0), f.uint8(u.bitDepth ?? 0), f.int8(u.flags ?? 0);
  }
  for (const l of r)
    f.rawBytes(l);
  return f.toArray();
}
function Bh(t, e) {
  const n = t.map(
    (a, c) => Vh(a, e[c] ?? {})
  );
  let s = t.length * 8;
  const r = [];
  for (const a of n)
    r.push(s), s += a.length;
  const i = new I(s);
  for (let a = 0; a < t.length; a++)
    i.uint16(t[a].firstGlyphIndex), i.uint16(t[a].lastGlyphIndex), i.uint32(r[a]);
  for (const a of n)
    i.rawBytes(a);
  return i.toArray();
}
function Vh(t, e) {
  const n = t.indexFormat, o = t.imageFormat, s = e.imageDataOffset ?? 0, r = 8;
  switch (n) {
    case 1: {
      const i = e.sbitOffsets ?? [], a = new I(r + i.length * 4);
      a.uint16(n), a.uint16(o), a.uint32(s);
      for (const c of i) a.uint32(c);
      return a.toArray();
    }
    case 2: {
      const i = new I(r + 4 + Kt);
      return i.uint16(n), i.uint16(o), i.uint32(s), i.uint32(t.imageSize ?? e.imageSize ?? 0), Pe(i, t.bigMetrics ?? {}), i.toArray();
    }
    case 3: {
      const i = e.sbitOffsets ?? [];
      let a = r + i.length * 2;
      i.length % 2 !== 0 && (a += 2);
      const c = new I(a);
      c.uint16(n), c.uint16(o), c.uint32(s);
      for (const f of i) c.uint16(f);
      return c.toArray();
    }
    case 4: {
      const i = e.glyphArray ?? [], a = i.length > 0 ? i.length - 1 : 0, c = new I(r + 4 + i.length * 4);
      c.uint16(n), c.uint16(o), c.uint32(s), c.uint32(a);
      for (const f of i)
        c.uint16(f.glyphID), c.uint16(f.sbitOffset);
      return c.toArray();
    }
    case 5: {
      const i = t.glyphIdArray ?? [];
      let a = r + 4 + Kt + 4 + i.length * 2;
      i.length % 2 !== 0 && (a += 2);
      const c = new I(a);
      c.uint16(n), c.uint16(o), c.uint32(s), c.uint32(t.imageSize ?? e.imageSize ?? 0), Pe(c, t.bigMetrics ?? {}), c.uint32(i.length);
      for (const f of i) c.uint16(f);
      return c.toArray();
    }
    default:
      throw new Error(`Unsupported index format: ${n}`);
  }
}
function $h(t) {
  const e = t.majorVersion ?? 2, n = t.minorVersion ?? 0, o = t.sizes ?? [], s = t.data ?? [], r = 8 + o.length * Ba + s.length, i = new I(r);
  i.uint16(e), i.uint16(n), i.uint32(o.length);
  for (const a of o)
    i.uint32(a.indexSubTableArrayOffset ?? 0), i.uint32(a.indexTablesSize ?? 0), i.uint32(a.numberOfIndexSubTables ?? 0), i.uint32(a.colorRef ?? 0), Fn(i, a.hori ?? {}), Fn(i, a.vert ?? {}), i.uint16(a.startGlyphIndex ?? 0), i.uint16(a.endGlyphIndex ?? 0), i.uint8(a.ppemX ?? 0), i.uint8(a.ppemY ?? 0), i.uint8(a.bitDepth ?? 0), i.int8(a.flags ?? 0);
  return i.rawBytes(s), i.toArray();
}
function hr(t) {
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
function Fn(t, e) {
  t.int8(e.ascender ?? 0), t.int8(e.descender ?? 0), t.uint8(e.widthMax ?? 0), t.int8(e.caretSlopeNumerator ?? 0), t.int8(e.caretSlopeDenominator ?? 0), t.int8(e.caretOffset ?? 0), t.int8(e.minOriginSB ?? 0), t.int8(e.minAdvanceSB ?? 0), t.int8(e.maxBeforeBL ?? 0), t.int8(e.minAfterBL ?? 0), t.int8(e.pad1 ?? 0), t.int8(e.pad2 ?? 0);
}
function Nh(t) {
  return bs(t);
}
function Gh(t) {
  return de(t);
}
function Ph(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = [], r = /* @__PURE__ */ new Set();
  for (let l = 0; l < o; l++) {
    const u = e.uint16(), h = e.uint16(), p = e.offset32();
    r.add(p), s.push({ platformID: u, encodingID: h, subtableOffset: p });
  }
  const i = [...r].sort((l, u) => l - u), a = i.map((l) => Uh(e, l)), c = new Map(i.map((l, u) => [l, u])), f = s.map((l) => ({
    platformID: l.platformID,
    encodingID: l.encodingID,
    subtableIndex: c.get(l.subtableOffset)
  }));
  return { version: n, encodingRecords: f, subtables: a };
}
function Uh(t, e) {
  t.seek(e);
  const n = t.uint16();
  switch (n) {
    case 0:
      return zh(t);
    case 2:
      return Hh(t, e);
    case 4:
      return Wh(t, e);
    case 6:
      return jh(t);
    case 8:
      return Jh(t);
    case 10:
      return Qh(t);
    case 12:
      return Yh(t);
    case 13:
      return Zh(t);
    case 14:
      return Xh(t, e);
    default:
      return t0(t, e, n);
  }
}
function zh(t) {
  t.skip(2);
  const e = t.uint16(), n = t.array("uint8", 256);
  return { format: 0, language: e, glyphIdArray: n };
}
function Hh(t, e) {
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
function Wh(t, e) {
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
function jh(t) {
  t.skip(2);
  const e = t.uint16(), n = t.uint16(), o = t.uint16(), s = t.array("uint16", o);
  return { format: 6, language: e, firstCode: n, glyphIdArray: s };
}
function Yh(t) {
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
function Zh(t) {
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
function Xh(t, e) {
  t.skip(4);
  const n = t.uint32(), o = [];
  for (let s = 0; s < n; s++) {
    const r = t.uint24(), i = t.offset32(), a = t.offset32();
    let c = null;
    if (i !== 0) {
      const l = t.position;
      c = qh(t, e + i), t.seek(l);
    }
    let f = null;
    if (a !== 0) {
      const l = t.position;
      f = Kh(
        t,
        e + a
      ), t.seek(l);
    }
    o.push({ varSelector: r, defaultUVS: c, nonDefaultUVS: f });
  }
  return { format: 14, varSelectorRecords: o };
}
function qh(t, e) {
  t.seek(e);
  const n = t.uint32(), o = [];
  for (let s = 0; s < n; s++)
    o.push({
      startUnicodeValue: t.uint24(),
      additionalCount: t.uint8()
    });
  return o;
}
function Kh(t, e) {
  t.seek(e);
  const n = t.uint32(), o = [];
  for (let s = 0; s < n; s++)
    o.push({
      unicodeValue: t.uint24(),
      glyphID: t.uint16()
    });
  return o;
}
function Jh(t) {
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
function Qh(t) {
  t.skip(2), t.skip(4);
  const e = t.uint32(), n = t.uint32(), o = t.uint32(), s = t.array("uint16", o);
  return { format: 10, language: e, startCharCode: n, glyphIdArray: s };
}
function t0(t, e, n) {
  let o;
  n >= 8 ? (t.skip(2), o = t.uint32()) : o = t.uint16(), t.seek(e);
  const s = t.bytes(o);
  return { format: n, _raw: s };
}
function e0(t) {
  const { version: e, encodingRecords: n, subtables: o } = t, s = n.map((u, h) => ({ rec: u, originalIndex: h })).sort((u, h) => {
    if (u.rec.platformID !== h.rec.platformID)
      return u.rec.platformID - h.rec.platformID;
    if (u.rec.encodingID !== h.rec.encodingID)
      return u.rec.encodingID - h.rec.encodingID;
    const p = (o[u.rec.subtableIndex] || {}).language || 0, g = (o[h.rec.subtableIndex] || {}).language || 0;
    return p - g;
  }).map(({ rec: u }) => u), r = o.map(n0), i = 4 + s.length * 8, a = [];
  let c = i;
  for (const u of r)
    a.push(c), c += u.length;
  const f = c, l = new I(f);
  l.uint16(e), l.uint16(s.length);
  for (const u of s)
    l.uint16(u.platformID), l.uint16(u.encodingID), l.offset32(a[u.subtableIndex]);
  for (let u = 0; u < r.length; u++)
    l.seek(a[u]), l.rawBytes(r[u]);
  return l.toArray();
}
function n0(t) {
  switch (t.format) {
    case 0:
      return o0(t);
    case 2:
      return s0(t);
    case 4:
      return r0(t);
    case 6:
      return i0(t);
    case 8:
      return a0(t);
    case 10:
      return c0(t);
    case 12:
      return f0(t);
    case 13:
      return l0(t);
    case 14:
      return u0(t);
    default:
      return t._raw;
  }
}
function o0(t) {
  const n = new I(262);
  return n.uint16(0), n.uint16(262), n.uint16(t.language), n.array("uint8", t.glyphIdArray), n.toArray();
}
function s0(t) {
  const { language: e, subHeaderKeys: n, subHeaders: o, glyphIdArray: s } = t, r = 518 + o.length * 8 + s.length * 2, i = new I(r);
  i.uint16(2), i.uint16(r), i.uint16(e), i.array("uint16", n);
  for (const a of o)
    i.uint16(a.firstCode), i.uint16(a.entryCount), i.int16(a.idDelta), i.uint16(a.idRangeOffset);
  return i.array("uint16", s), i.toArray();
}
function r0(t) {
  const { language: e, segments: n, glyphIdArray: o } = t, s = n.length, r = s * 2, i = Math.floor(Math.log2(s)), a = Math.pow(2, i) * 2, c = r - a, f = 14 + s * 8 + 2 + o.length * 2, l = new I(f);
  l.uint16(4), l.uint16(f), l.uint16(e), l.uint16(r), l.uint16(a), l.uint16(i), l.uint16(c);
  for (const u of n) l.uint16(u.endCode);
  l.uint16(0);
  for (const u of n) l.uint16(u.startCode);
  for (const u of n) l.int16(u.idDelta);
  for (const u of n) l.uint16(u.idRangeOffset);
  return l.array("uint16", o), l.toArray();
}
function i0(t) {
  const { language: e, firstCode: n, glyphIdArray: o } = t, s = o.length, r = 10 + s * 2, i = new I(r);
  return i.uint16(6), i.uint16(r), i.uint16(e), i.uint16(n), i.uint16(s), i.array("uint16", o), i.toArray();
}
function a0(t) {
  const { language: e, is32: n, groups: o } = t, s = 8208 + o.length * 12, r = new I(s);
  r.uint16(8), r.uint16(0), r.uint32(s), r.uint32(e), r.rawBytes(n), r.uint32(o.length);
  for (const i of o)
    r.uint32(i.startCharCode), r.uint32(i.endCharCode), r.uint32(i.startGlyphID);
  return r.toArray();
}
function c0(t) {
  const { language: e, startCharCode: n, glyphIdArray: o } = t, s = 20 + o.length * 2, r = new I(s);
  return r.uint16(10), r.uint16(0), r.uint32(s), r.uint32(e), r.uint32(n), r.uint32(o.length), r.array("uint16", o), r.toArray();
}
function f0(t) {
  const e = t.groups.length, n = 16 + e * 12, o = new I(n);
  o.uint16(12), o.uint16(0), o.uint32(n), o.uint32(t.language), o.uint32(e);
  for (const s of t.groups)
    o.uint32(s.startCharCode), o.uint32(s.endCharCode), o.uint32(s.startGlyphID);
  return o.toArray();
}
function l0(t) {
  const e = t.groups.length, n = 16 + e * 12, o = new I(n);
  o.uint16(13), o.uint16(0), o.uint32(n), o.uint32(t.language), o.uint32(e);
  for (const s of t.groups)
    o.uint32(s.startCharCode), o.uint32(s.endCharCode), o.uint32(s.glyphID);
  return o.toArray();
}
function u0(t) {
  const { varSelectorRecords: e } = t, n = e.map((c) => ({
    defaultUVSBytes: c.defaultUVS ? h0(c.defaultUVS) : null,
    nonDefaultUVSBytes: c.nonDefaultUVS ? g0(c.nonDefaultUVS) : null
  }));
  let s = 10 + e.length * 11;
  const r = n.map((c) => {
    let f = 0;
    c.defaultUVSBytes && (f = s, s += c.defaultUVSBytes.length);
    let l = 0;
    return c.nonDefaultUVSBytes && (l = s, s += c.nonDefaultUVSBytes.length), { defaultUVSOffset: f, nonDefaultUVSOffset: l };
  }), i = s, a = new I(i);
  a.uint16(14), a.uint32(i), a.uint32(e.length);
  for (let c = 0; c < e.length; c++)
    a.uint24(e[c].varSelector), a.uint32(r[c].defaultUVSOffset), a.uint32(r[c].nonDefaultUVSOffset);
  for (let c = 0; c < n.length; c++)
    n[c].defaultUVSBytes && a.rawBytes(n[c].defaultUVSBytes), n[c].nonDefaultUVSBytes && a.rawBytes(n[c].nonDefaultUVSBytes);
  return a.toArray();
}
function h0(t) {
  const e = 4 + t.length * 4, n = new I(e);
  n.uint32(t.length);
  for (const o of t)
    n.uint24(o.startUnicodeValue), n.uint8(o.additionalCount);
  return n.toArray();
}
function g0(t) {
  const e = 4 + t.length * 5, n = new I(e);
  n.uint32(t.length);
  for (const o of t)
    n.uint24(o.unicodeValue), n.uint16(o.glyphID);
  return n.toArray();
}
const Ve = [
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
], Va = 15, $a = 48;
function p0(t, e) {
  return e === 1 ? t.uint8() : e === 2 ? t.uint16() : e === 3 ? t.uint24() : t.uint32();
}
function d0(t, e, n) {
  n === 1 ? t.uint8(e) : n === 2 ? t.uint16(e) : n === 3 ? t.uint24(e) : t.uint32(e >>> 0);
}
function m0(t, e) {
  t.seek(e);
  const n = t.uint8(), o = t.uint8(), s = n === 1 ? t.uint32() : t.uint16(), r = (o & Va) + 1, i = ((o & $a) >> 4) + 1, a = [];
  for (let c = 0; c < s; c++) {
    const f = p0(t, i), l = (1 << r) - 1;
    a.push({
      outerIndex: f >> r,
      innerIndex: f & l
    });
  }
  return { format: n, entryFormat: o, mapCount: s, entries: a };
}
function y0(t) {
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
  const f = t.entryFormat ?? c - 1 << 4 | i - 1, l = o === 1 ? 6 : 4, u = (f & Va) + 1, h = ((f & $a) >> 4) + 1, p = new I(l + n * h);
  p.uint8(o), p.uint8(f), o === 1 ? p.uint32(n) : p.uint16(n);
  for (let g = 0; g < n; g++) {
    const d = e[g] ?? { outerIndex: 0, innerIndex: 0 }, x = (d.outerIndex ?? 0) << u | (d.innerIndex ?? 0) & (1 << u) - 1;
    d0(p, x, h);
  }
  return p.toArray();
}
function x0(t, e) {
  const n = /* @__PURE__ */ new Map(), o = S0(
    t,
    e.baseGlyphListOffset,
    n
  ), s = e.layerListOffset ? _0(t, e.layerListOffset, n) : null, r = e.clipListOffset ? w0(t, e.clipListOffset) : null, i = e.varIndexMapOffset ? m0(t, e.varIndexMapOffset) : null;
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
function S0(t, e, n) {
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
      paint: tt(t, e + i.paintOffset, n)
    });
  return s;
}
function _0(t, e, n) {
  t.seek(e);
  const o = t.uint32(), s = [];
  for (let i = 0; i < o; i++)
    s.push(t.uint32());
  const r = [];
  for (const i of s)
    r.push(tt(t, e + i, n));
  return r;
}
function w0(t, e) {
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
    clipBox: b0(t, e + i.clipBoxOffset)
  }));
  return { format: n, clips: r };
}
function b0(t, e) {
  t.seek(e);
  const n = t.uint8(), o = t.fword(), s = t.fword(), r = t.fword(), i = t.fword(), a = { format: n, xMin: o, yMin: s, xMax: r, yMax: i };
  return n === 2 && (a.varIndexBase = t.uint32()), a;
}
function As(t, e, n) {
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
function A0(t, e, n) {
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
function tt(t, e, n) {
  if (n.has(e)) return n.get(e);
  t.seek(e);
  const o = t.uint8();
  let s;
  switch (o) {
    case 1:
      s = C0(t);
      break;
    case 2:
      s = gr(t, !1);
      break;
    case 3:
      s = gr(t, !0);
      break;
    case 4:
      s = pr(t, e, !1);
      break;
    case 5:
      s = pr(t, e, !0);
      break;
    case 6:
      s = dr(t, e, !1);
      break;
    case 7:
      s = dr(t, e, !0);
      break;
    case 8:
      s = mr(t, e, !1);
      break;
    case 9:
      s = mr(t, e, !0);
      break;
    case 10:
      s = I0(t, e, n);
      break;
    case 11:
      s = v0(t);
      break;
    case 12:
      s = yr(t, e, n, !1);
      break;
    case 13:
      s = yr(t, e, n, !0);
      break;
    case 14:
      s = xr(t, e, n, !1);
      break;
    case 15:
      s = xr(t, e, n, !0);
      break;
    case 16:
      s = Sr(t, e, n, !1);
      break;
    case 17:
      s = Sr(t, e, n, !0);
      break;
    case 18:
      s = _r(t, e, n, !1);
      break;
    case 19:
      s = _r(t, e, n, !0);
      break;
    case 20:
      s = wr(t, e, n, !1);
      break;
    case 21:
      s = wr(t, e, n, !0);
      break;
    case 22:
      s = br(t, e, n, !1);
      break;
    case 23:
      s = br(t, e, n, !0);
      break;
    case 24:
      s = Ar(t, e, n, !1);
      break;
    case 25:
      s = Ar(t, e, n, !0);
      break;
    case 26:
      s = Cr(t, e, n, !1);
      break;
    case 27:
      s = Cr(t, e, n, !0);
      break;
    case 28:
      s = Ir(t, e, n, !1);
      break;
    case 29:
      s = Ir(t, e, n, !0);
      break;
    case 30:
      s = vr(t, e, n, !1);
      break;
    case 31:
      s = vr(t, e, n, !0);
      break;
    case 32:
      s = O0(t, e, n);
      break;
    default:
      return s = { format: o, _unknown: !0 }, n.set(e, s), s;
  }
  return s.format = o, n.set(e, s), s;
}
function C0(t) {
  return {
    numLayers: t.uint8(),
    firstLayerIndex: t.uint32()
  };
}
function gr(t, e) {
  const n = {
    paletteIndex: t.uint16(),
    alpha: t.f2dot14()
  };
  return e && (n.varIndexBase = t.uint32()), n;
}
function pr(t, e, n) {
  const o = t.uint24(), s = {
    x0: t.fword(),
    y0: t.fword(),
    x1: t.fword(),
    y1: t.fword(),
    x2: t.fword(),
    y2: t.fword()
  };
  return n && (s.varIndexBase = t.uint32()), s.colorLine = As(t, e + o, n), s;
}
function dr(t, e, n) {
  const o = t.uint24(), s = {
    x0: t.fword(),
    y0: t.fword(),
    radius0: t.ufword(),
    x1: t.fword(),
    y1: t.fword(),
    radius1: t.ufword()
  };
  return n && (s.varIndexBase = t.uint32()), s.colorLine = As(t, e + o, n), s;
}
function mr(t, e, n) {
  const o = t.uint24(), s = {
    centerX: t.fword(),
    centerY: t.fword(),
    startAngle: t.f2dot14(),
    endAngle: t.f2dot14()
  };
  return n && (s.varIndexBase = t.uint32()), s.colorLine = As(t, e + o, n), s;
}
function I0(t, e, n) {
  const o = t.uint24();
  return {
    glyphID: t.uint16(),
    paint: tt(t, e + o, n)
  };
}
function v0(t) {
  return { glyphID: t.uint16() };
}
function yr(t, e, n, o) {
  const s = t.uint24(), r = t.uint24();
  return {
    paint: tt(t, e + s, n),
    transform: A0(t, e + r, o)
  };
}
function xr(t, e, n, o) {
  const s = t.uint24(), r = {
    dx: t.fword(),
    dy: t.fword()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = tt(t, e + s, n), r;
}
function Sr(t, e, n, o) {
  const s = t.uint24(), r = {
    scaleX: t.f2dot14(),
    scaleY: t.f2dot14()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = tt(t, e + s, n), r;
}
function _r(t, e, n, o) {
  const s = t.uint24(), r = {
    scaleX: t.f2dot14(),
    scaleY: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = tt(t, e + s, n), r;
}
function wr(t, e, n, o) {
  const s = t.uint24(), r = { scale: t.f2dot14() };
  return o && (r.varIndexBase = t.uint32()), r.paint = tt(t, e + s, n), r;
}
function br(t, e, n, o) {
  const s = t.uint24(), r = {
    scale: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = tt(t, e + s, n), r;
}
function Ar(t, e, n, o) {
  const s = t.uint24(), r = { angle: t.f2dot14() };
  return o && (r.varIndexBase = t.uint32()), r.paint = tt(t, e + s, n), r;
}
function Cr(t, e, n, o) {
  const s = t.uint24(), r = {
    angle: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = tt(t, e + s, n), r;
}
function Ir(t, e, n, o) {
  const s = t.uint24(), r = {
    xSkewAngle: t.f2dot14(),
    ySkewAngle: t.f2dot14()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = tt(t, e + s, n), r;
}
function vr(t, e, n, o) {
  const s = t.uint24(), r = {
    xSkewAngle: t.f2dot14(),
    ySkewAngle: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (r.varIndexBase = t.uint32()), r.paint = tt(t, e + s, n), r;
}
function O0(t, e, n) {
  const o = t.uint24(), s = t.uint8(), r = t.uint24();
  return {
    sourcePaint: tt(t, e + o, n),
    compositeMode: s,
    backdropPaint: tt(t, e + r, n)
  };
}
function k0(t) {
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
      for (const R of Ho(D))
        c(R);
    }
  }
  if (e)
    for (const D of e)
      c(D.paint);
  if (n)
    for (const D of n)
      c(D);
  const f = E0(a), l = /* @__PURE__ */ new Map();
  for (const D of f)
    l.set(D, T0(D));
  const u = /* @__PURE__ */ new Map();
  let h = 0;
  for (const D of f)
    u.set(D, h), h += l.get(D);
  const p = h, g = e ? e.length : 0, d = 4 + g * 6, x = n ? n.length : 0, m = x > 0 ? 4 + x * 4 : 0, y = o ? F0(o) : [], w = s ? y0(s) : [], S = r ? ee(r) : [], _ = d + m + p + y.length + w.length + S.length, b = 0, A = d, k = d + m, O = k + p, v = O + y.length, E = v + w.length, T = new I(_);
  T.uint32(g);
  for (const D of e || [])
    T.uint16(D.glyphID), T.uint32(k - b + u.get(D.paint));
  if (x > 0) {
    T.uint32(x);
    for (const D of n)
      T.uint32(k - A + u.get(D));
  }
  for (const D of f)
    D0(
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
    dimBodyOffset: w.length > 0 ? v : 0,
    ivsBodyOffset: S.length > 0 ? E : 0
  };
}
function Ho(t) {
  if (!t) return [];
  const e = [];
  return t.paint && e.push(t.paint), t.sourcePaint && e.push(t.sourcePaint), t.backdropPaint && e.push(t.backdropPaint), e;
}
function E0(t, e) {
  const n = /* @__PURE__ */ new Map();
  for (const a of t) n.set(a, 0);
  for (const a of t)
    for (const c of Ho(a))
      n.has(c) && n.set(c, n.get(c) + 1);
  const o = [];
  let s = 0;
  for (const a of t)
    n.get(a) === 0 && o.push(a);
  const r = [], i = /* @__PURE__ */ new Set();
  for (; s < o.length; ) {
    const a = o[s++];
    r.push(a), i.add(a);
    for (const c of Ho(a)) {
      if (!n.has(c)) continue;
      const f = n.get(c) - 1;
      n.set(c, f), f === 0 && o.push(c);
    }
  }
  for (const a of t)
    i.has(a) || r.push(a);
  return r;
}
function T0(t) {
  const e = Ve[t.format] || 0, n = t.format;
  return n === 4 || n === 6 || n === 8 ? e + Or(t.colorLine, !1) : n === 5 || n === 7 || n === 9 ? e + Or(t.colorLine, !0) : n === 12 ? e + 24 : n === 13 ? e + 28 : e;
}
function Or(t, e) {
  if (!t) return 0;
  const n = e ? 10 : 6;
  return 3 + t.colorStops.length * n;
}
function D0(t, e, n, o, s) {
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
      const i = Ve[r];
      t.uint24(i), t.fword(e.x0), t.fword(e.y0), t.fword(e.x1), t.fword(e.y1), t.fword(e.x2), t.fword(e.y2), r === 5 && t.uint32(e.varIndexBase), po(t, e.colorLine, r === 5);
      break;
    }
    case 6:
    // PaintRadialGradient
    case 7: {
      const i = Ve[r];
      t.uint24(i), t.fword(e.x0), t.fword(e.y0), t.ufword(e.radius0), t.fword(e.x1), t.fword(e.y1), t.ufword(e.radius1), r === 7 && t.uint32(e.varIndexBase), po(t, e.colorLine, r === 7);
      break;
    }
    case 8:
    // PaintSweepGradient
    case 9: {
      const i = Ve[r];
      t.uint24(i), t.fword(e.centerX), t.fword(e.centerY), t.f2dot14(e.startAngle), t.f2dot14(e.endAngle), r === 9 && t.uint32(e.varIndexBase), po(t, e.colorLine, r === 9);
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
      const i = s + o.get(e.paint), a = Ve[r];
      t.uint24(i - n), t.uint24(a), R0(t, e.transform, r === 13);
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
function po(t, e, n) {
  t.uint8(e.extend), t.uint16(e.colorStops.length);
  for (const o of e.colorStops)
    t.f2dot14(o.stopOffset), t.uint16(o.paletteIndex), t.f2dot14(o.alpha), n && t.uint32(o.varIndexBase);
}
function R0(t, e, n) {
  t.fixed(e.xx), t.fixed(e.yx), t.fixed(e.xy), t.fixed(e.yy), t.fixed(e.dx), t.fixed(e.dy), n && t.uint32(e.varIndexBase);
}
function F0(t) {
  if (!t || !t.clips || t.clips.length === 0) return [];
  const e = [];
  for (const a of t.clips)
    e.push(M0(a.clipBox));
  let o = 5 + t.clips.length * 7;
  const s = [];
  for (const a of e)
    s.push(o), o += a.length;
  const r = o, i = new I(r);
  i.uint8(t.format || 1), i.uint32(t.clips.length);
  for (let a = 0; a < t.clips.length; a++)
    i.uint16(t.clips[a].startGlyphID), i.uint16(t.clips[a].endGlyphID), i.uint24(s[a]);
  for (const a of e)
    i.rawBytes(a);
  return i.toArray();
}
function M0(t) {
  const e = t.format === 2 ? 13 : 9, n = new I(e);
  return n.uint8(t.format), n.fword(t.xMin), n.fword(t.yMin), n.fword(t.xMax), n.fword(t.yMax), t.format === 2 && n.uint32(t.varIndexBase), n.toArray();
}
function L0(t) {
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
    const l = e.uint32(), u = e.uint32(), h = e.uint32(), p = e.uint32(), g = e.uint32(), x = x0(e, {
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
function B0(t) {
  const { baseGlyphRecords: e, layerRecords: n } = t;
  if (t.version >= 1 && t.baseGlyphPaintRecords) {
    const u = e.length * 6, h = n.length * 4, d = 14 + 20, x = u + h, m = d + x, y = k0({
      baseGlyphPaintRecords: t.baseGlyphPaintRecords,
      layerPaints: t.layerPaints,
      clipList: t.clipList,
      varIndexMap: t.varIndexMap,
      itemVariationStore: t.itemVariationStore
    }), w = y.bodyBytes, S = m + y.bglBodyOffset, _ = y.llBodyOffset ? m + y.llBodyOffset : 0, b = y.clipBodyOffset ? m + y.clipBodyOffset : 0, A = y.dimBodyOffset ? m + y.dimBodyOffset : 0, k = y.ivsBodyOffset ? m + y.ivsBodyOffset : 0, O = m + w.length, v = new I(O);
    v.uint16(t.version), v.uint16(e.length), v.uint32(e.length > 0 ? d : 0), v.uint32(n.length > 0 ? d + u : 0), v.uint16(n.length), v.uint32(S), v.uint32(_), v.uint32(b), v.uint32(A), v.uint32(k);
    for (const E of e)
      v.uint16(E.glyphID), v.uint16(E.firstLayerIndex), v.uint16(E.numLayers);
    for (const E of n)
      v.uint16(E.glyphID), v.uint16(E.paletteIndex);
    return v.rawBytes(w), v.toArray();
  }
  const o = 14, s = e.length > 0 ? o : 0, r = e.length * 6, i = n.length > 0 ? o + r : 0, a = n.length * 4, c = o + r + a, f = new I(c);
  f.uint16(t.version), f.uint16(e.length), f.uint32(s), f.uint32(i), f.uint16(n.length);
  for (const l of e)
    f.uint16(l.glyphID), f.uint16(l.firstLayerIndex), f.uint16(l.numLayers);
  for (const l of n)
    f.uint16(l.glyphID), f.uint16(l.paletteIndex);
  return f.toArray();
}
function V0(t) {
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
function $0(t) {
  const { version: e, numPaletteEntries: n, palettes: o } = t, s = o.length, r = [], i = [];
  for (let y = 0; y < s; y++) {
    r.push(i.length);
    for (let w = 0; w < n; w++)
      i.push(o[y][w]);
  }
  const a = i.length, c = 12 + s * 2, f = e >= 1 ? 12 : 0, l = c + f, u = a * 4;
  let h = l + u, p = 0, g = 0, d = 0;
  e >= 1 && t.paletteTypes && (p = h, h += s * 4), e >= 1 && t.paletteLabels && (g = h, h += s * 2), e >= 1 && t.paletteEntryLabels && (d = h, h += n * 2);
  const x = h, m = new I(x);
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
const N0 = 8, G0 = 12;
function P0(t) {
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
function U0(t) {
  const e = t.version ?? 1, n = t.flags ?? 0, s = (t.signatures ?? []).map((c) => {
    const f = z0(c);
    return {
      format: c.format ?? 1,
      bytes: f
    };
  });
  let r = N0 + s.length * G0;
  const i = s.map((c) => {
    const f = {
      format: c.format,
      length: c.bytes.length,
      offset: c.bytes.length ? r : 0
    };
    return r += c.bytes.length, f;
  }), a = new I(r);
  a.uint32(e), a.uint16(s.length), a.uint16(n);
  for (const c of i)
    a.uint32(c.format), a.uint32(c.length), a.offset32(c.offset);
  for (const c of s)
    a.rawBytes(c.bytes);
  return a.toArray();
}
function z0(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
function H0(t, e) {
  return _s(t, e?.EBLC ? { CBLC: e.EBLC } : e);
}
function W0(t) {
  return ws(t);
}
function j0(t) {
  return bs(t);
}
function Y0(t) {
  return de(t);
}
const Wo = 28;
function Z0(t) {
  const e = new F(t), n = e.uint32(), o = e.uint32(), s = [];
  for (let r = 0; r < o; r++) {
    const i = e.position;
    s.push({
      hori: kr(e),
      vert: kr(e),
      substitutePpemX: e.uint8(),
      substitutePpemY: e.uint8(),
      originalPpemX: e.uint8(),
      originalPpemY: e.uint8(),
      _raw: Array.from(t.slice(i, i + Wo))
    });
  }
  return { version: n, scales: s };
}
function X0(t) {
  const e = t.version ?? 131072, n = t.scales ?? [], o = new I(8 + n.length * Wo);
  o.uint32(e), o.uint32(n.length);
  for (const s of n) {
    if (s._raw && s._raw.length === Wo) {
      o.rawBytes(s._raw);
      continue;
    }
    Er(o, s.hori ?? {}), Er(o, s.vert ?? {}), o.uint8(s.substitutePpemX ?? 0), o.uint8(s.substitutePpemY ?? 0), o.uint8(s.originalPpemX ?? 0), o.uint8(s.originalPpemY ?? 0);
  }
  return o.toArray();
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
function Er(t, e) {
  t.int8(e.ascender ?? 0), t.int8(e.descender ?? 0), t.uint8(e.widthMax ?? 0), t.int8(e.caretSlopeNumerator ?? 0), t.int8(e.caretSlopeDenominator ?? 0), t.int8(e.caretOffset ?? 0), t.int8(e.minOriginSB ?? 0), t.int8(e.minAdvanceSB ?? 0), t.int8(e.maxBeforeBL ?? 0), t.int8(e.minAfterBL ?? 0), t.int8(e.pad1 ?? 0), t.int8(e.pad2 ?? 0);
}
const Tr = 16, q0 = 20;
function K0(t) {
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
function J0(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.reserved ?? 2, s = t.axes ?? [], r = t.instances ?? [], i = s.length, a = q0, c = 4 + i * 4, f = r.some(
    (d) => d.postScriptNameID !== void 0
  ), l = f ? c + 2 : c, u = r.length, h = Tr, p = Tr + i * a + u * l, g = new I(p);
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
function Q0(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.uint16(), a = e.uint16();
  let c = 0;
  o >= 2 && (c = e.uint16());
  let f = 0;
  o >= 3 && (f = e.uint32());
  const l = { majorVersion: n, minorVersion: o };
  return s !== 0 && (l.glyphClassDef = Bt(e, s)), r !== 0 && (l.attachList = tg(e, r)), i !== 0 && (l.ligCaretList = eg(e, i)), a !== 0 && (l.markAttachClassDef = Bt(e, a)), c !== 0 && (l.markGlyphSetsDef = og(e, c)), f !== 0 && (l.itemVarStoreOffset = f, l.itemVariationStore = Pt(
    t.slice(f)
  )), l;
}
function tg(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.array("uint16", o), r = $(t, e + n), i = s.map((a) => {
    t.seek(e + a);
    const c = t.uint16();
    return t.array("uint16", c);
  });
  return { coverage: r, attachPoints: i };
}
function eg(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = t.array("uint16", o), r = $(t, e + n), i = s.map(
    (a) => ng(t, e + a)
  );
  return { coverage: r, ligGlyphs: i };
}
function ng(t, e) {
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
      const a = t.int16(), c = t.uint16(), f = c !== 0 ? we(t, r + c) : null;
      return { format: i, coordinate: a, device: f };
    }
    throw new Error(`Unknown CaretValue format: ${i}`);
  });
}
function og(t, e) {
  t.seek(e);
  const n = t.uint16(), o = t.uint16(), s = [];
  for (let i = 0; i < o; i++)
    s.push(t.uint32());
  const r = s.map(
    (i) => $(t, e + i)
  );
  return { format: n, coverages: r };
}
function sg(t) {
  const { majorVersion: e, minorVersion: n } = t, o = t.glyphClassDef ? Vt(t.glyphClassDef) : null, s = t.attachList ? rg(t.attachList) : null, r = t.ligCaretList ? ag(t.ligCaretList) : null, i = t.markAttachClassDef ? Vt(t.markAttachClassDef) : null, a = n >= 2 && t.markGlyphSetsDef ? lg(t.markGlyphSetsDef) : null, c = n >= 3 && t.itemVariationStore ? ee(t.itemVariationStore) : null;
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
  const m = new I(l);
  return m.uint16(e), m.uint16(n), m.uint16(u), m.uint16(h), m.uint16(p), m.uint16(g), n >= 2 && m.uint16(d), n >= 3 && m.uint32(x), o && (m.seek(u), m.rawBytes(o)), s && (m.seek(h), m.rawBytes(s)), r && (m.seek(p), m.rawBytes(r)), i && (m.seek(g), m.rawBytes(i)), a && (m.seek(d), m.rawBytes(a)), c && (m.seek(x), m.rawBytes(c)), m.toArray();
}
function rg(t) {
  const e = G(t.coverage), n = t.attachPoints.map(ig);
  let s = 4 + t.attachPoints.length * 2;
  const r = s;
  s += e.length;
  const i = n.map((c) => {
    const f = s;
    return s += c.length, f;
  }), a = new I(s);
  a.uint16(r), a.uint16(t.attachPoints.length), a.array("uint16", i), a.seek(r), a.rawBytes(e);
  for (let c = 0; c < n.length; c++)
    a.seek(i[c]), a.rawBytes(n[c]);
  return a.toArray();
}
function ig(t) {
  const e = 2 + t.length * 2, n = new I(e);
  return n.uint16(t.length), n.array("uint16", t), n.toArray();
}
function ag(t) {
  const e = G(t.coverage), n = t.ligGlyphs.map(cg);
  let s = 4 + t.ligGlyphs.length * 2;
  const r = s;
  s += e.length;
  const i = n.map((c) => {
    const f = s;
    return s += c.length, f;
  }), a = new I(s);
  a.uint16(r), a.uint16(t.ligGlyphs.length), a.array("uint16", i), a.seek(r), a.rawBytes(e);
  for (let c = 0; c < n.length; c++)
    a.seek(i[c]), a.rawBytes(n[c]);
  return a.toArray();
}
function cg(t) {
  const e = t.map(fg);
  let o = 2 + t.length * 2;
  const s = e.map((i) => {
    const a = o;
    return o += i.length, a;
  }), r = new I(o);
  r.uint16(t.length), r.array("uint16", s);
  for (let i = 0; i < e.length; i++)
    r.seek(s[i]), r.rawBytes(e[i]);
  return r.toArray();
}
function fg(t) {
  if (t.format === 1) {
    const e = new I(4);
    return e.uint16(1), e.int16(t.coordinate), e.toArray();
  }
  if (t.format === 2) {
    const e = new I(4);
    return e.uint16(2), e.uint16(t.caretValuePointIndex), e.toArray();
  }
  if (t.format === 3) {
    const e = t.device ? Rn(t.device) : null, n = 6 + (e ? e.length : 0), o = new I(n);
    return o.uint16(3), o.int16(t.coordinate), o.uint16(e ? 6 : 0), e && o.rawBytes(e), o.toArray();
  }
  throw new Error(`Unknown CaretValue format: ${t.format}`);
}
function lg(t) {
  const e = t.coverages.map(G);
  let o = 4 + t.coverages.length * 4;
  const s = e.map((i) => {
    const a = o;
    return o += i.length, a;
  }), r = new I(o);
  r.uint16(t.format), r.uint16(t.coverages.length);
  for (const i of s) r.uint32(i);
  for (let i = 0; i < e.length; i++)
    r.seek(s[i]), r.rawBytes(e[i]);
  return r.toArray();
}
function Mt(t) {
  let e = 0, n = t;
  for (; n; )
    e += n & 1, n >>>= 1;
  return e * 2;
}
function le(t, e, n) {
  if (e === 0) return null;
  const o = t.position, s = {};
  e & 1 && (s.xPlacement = t.int16()), e & 2 && (s.yPlacement = t.int16()), e & 4 && (s.xAdvance = t.int16()), e & 8 && (s.yAdvance = t.int16());
  const r = e & 16 ? t.uint16() : 0, i = e & 32 ? t.uint16() : 0, a = e & 64 ? t.uint16() : 0, c = e & 128 ? t.uint16() : 0, f = t.position, l = (u, h) => {
    const p = n + u, g = o + u;
    try {
      return we(t, p);
    } catch (d) {
      if (g !== p)
        try {
          return we(t, g);
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
function be(t, e) {
  if (e === 0) return null;
  t.seek(e);
  const n = t.uint16(), o = t.int16(), s = t.int16(), r = { format: n, xCoordinate: o, yCoordinate: s };
  if (n === 2)
    r.anchorPoint = t.uint16();
  else if (n === 3) {
    const i = t.uint16(), a = t.uint16();
    i && (r.xDevice = we(t, e + i)), a && (r.yDevice = we(t, e + a));
  }
  return r;
}
function Cs(t, e) {
  t.seek(e);
  const n = t.uint16(), o = [];
  for (let s = 0; s < n; s++) {
    const r = t.uint16(), i = t.uint16();
    o.push({ markClass: r, anchorOffset: i });
  }
  return o.map((s) => ({
    markClass: s.markClass,
    markAnchor: be(t, e + s.anchorOffset)
  }));
}
function ug(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.uint16();
  let a = 0;
  o >= 1 && (a = e.uint32());
  const c = {
    majorVersion: n,
    minorVersion: o,
    scriptList: Sa(e, s),
    featureList: wa(e, r),
    lookupList: Ia(e, i, Na, 9)
  };
  return a !== 0 && (c.featureVariations = Ma(
    e,
    a
  )), c;
}
function Na(t, e, n) {
  switch (n) {
    case 1:
      return hg(t, e);
    case 2:
      return gg(t, e);
    case 3:
      return pg(t, e);
    case 4:
      return dg(t, e);
    case 5:
      return mg(t, e);
    case 6:
      return yg(t, e);
    case 7:
      return Oa(t, e);
    case 8:
      return Ta(t, e);
    case 9:
      return xg(t, e);
    default:
      throw new Error(`Unknown GPOS lookup type: ${n}`);
  }
}
function hg(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const o = t.uint16(), s = t.uint16(), r = le(t, s, e), i = $(t, e + o);
    return { format: n, coverage: i, valueFormat: s, valueRecord: r };
  }
  if (n === 2) {
    const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = [];
    for (let c = 0; c < r; c++)
      i.push(le(t, s, e));
    const a = $(t, e + o);
    return { format: n, coverage: a, valueFormat: s, valueCount: r, valueRecords: i };
  }
  throw new Error(`Unknown SinglePos format: ${n}`);
}
function gg(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n === 1) {
    const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = t.uint16(), c = t.array("uint16", i).map((l) => {
      const u = e + l;
      t.seek(u);
      const h = t.uint16(), p = [];
      for (let g = 0; g < h; g++) {
        const d = t.uint16(), x = le(t, s, u), m = le(t, r, u);
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
        const m = le(t, s, e), y = le(t, r, e);
        d.push({ value1: m, value2: y });
      }
      l.push(d);
    }
    const u = $(t, e + o), h = Bt(t, e + i), p = Bt(t, e + a);
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
function pg(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown CursivePos format: ${n}`);
  const o = t.uint16(), s = t.uint16(), r = [];
  for (let c = 0; c < s; c++) {
    const f = t.uint16(), l = t.uint16();
    r.push({ entryAnchorOff: f, exitAnchorOff: l });
  }
  const i = $(t, e + o), a = r.map((c) => ({
    entryAnchor: c.entryAnchorOff ? be(t, e + c.entryAnchorOff) : null,
    exitAnchor: c.exitAnchorOff ? be(t, e + c.exitAnchorOff) : null
  }));
  return { format: n, coverage: i, entryExitRecords: a };
}
function dg(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown MarkBasePos format: ${n}`);
  const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = t.uint16(), a = t.uint16(), c = $(t, e + o), f = $(t, e + s), l = Cs(t, e + i);
  t.seek(e + a);
  const u = t.uint16(), h = [];
  for (let g = 0; g < u; g++) {
    const d = t.array("uint16", r);
    h.push(d);
  }
  const p = h.map(
    (g) => g.map(
      (d) => d ? be(t, e + a + d) : null
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
function mg(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown MarkLigPos format: ${n}`);
  const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = t.uint16(), a = t.uint16(), c = $(t, e + o), f = $(t, e + s), l = Cs(t, e + i);
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
      (y) => y.map((w) => w ? be(t, d + w) : null)
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
function yg(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown MarkMarkPos format: ${n}`);
  const o = t.uint16(), s = t.uint16(), r = t.uint16(), i = t.uint16(), a = t.uint16(), c = $(t, e + o), f = $(t, e + s), l = Cs(t, e + i);
  t.seek(e + a);
  const u = t.uint16(), h = [];
  for (let g = 0; g < u; g++) {
    const d = t.array("uint16", r);
    h.push(d);
  }
  const p = h.map(
    (g) => g.map(
      (d) => d ? be(t, e + a + d) : null
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
function xg(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown ExtensionPos format: ${n}`);
  const o = t.uint16(), s = t.uint32(), r = Na(
    t,
    e + s,
    o
  );
  return { format: n, extensionLookupType: o, extensionOffset: s, subtable: r };
}
function ue(t, e, n) {
  if (!e) return [];
  const o = new I(Mt(e));
  return e & 1 && o.int16(t ? t.xPlacement ?? 0 : 0), e & 2 && o.int16(t ? t.yPlacement ?? 0 : 0), e & 4 && o.int16(t ? t.xAdvance ?? 0 : 0), e & 8 && o.int16(t ? t.yAdvance ?? 0 : 0), e & 16 && (t?.xPlaDevice && n.push({ field: o.position, device: t.xPlaDevice }), o.uint16(0)), e & 32 && (t?.yPlaDevice && n.push({ field: o.position, device: t.yPlaDevice }), o.uint16(0)), e & 64 && (t?.xAdvDevice && n.push({ field: o.position, device: t.xAdvDevice }), o.uint16(0)), e & 128 && (t?.yAdvDevice && n.push({ field: o.position, device: t.yAdvDevice }), o.uint16(0)), o.toArray();
}
function je(t) {
  if (!t) return [];
  const { format: e, xCoordinate: n, yCoordinate: o } = t;
  if (e === 1) {
    const s = new I(6);
    return s.uint16(1), s.int16(n), s.int16(o), s.toArray();
  }
  if (e === 2) {
    const s = new I(8);
    return s.uint16(2), s.int16(n), s.int16(o), s.uint16(t.anchorPoint), s.toArray();
  }
  if (e === 3) {
    const s = t.xDevice ? Rn(t.xDevice) : null, r = t.yDevice ? Rn(t.yDevice) : null;
    let a = 10;
    const c = s ? a : 0;
    s && (a += s.length);
    const f = r ? a : 0;
    r && (a += r.length);
    const l = new I(a);
    return l.uint16(3), l.int16(n), l.int16(o), l.uint16(c), l.uint16(f), s && (l.seek(c), l.rawBytes(s)), r && (l.seek(f), l.rawBytes(r)), l.toArray();
  }
  throw new Error(`Unknown Anchor format: ${e}`);
}
function Is(t) {
  const e = t.map((i) => je(i.markAnchor));
  let o = 2 + t.length * 4;
  const s = e.map((i) => {
    if (!i.length) return 0;
    const a = o;
    return o += i.length, a;
  }), r = new I(o);
  r.uint16(t.length);
  for (let i = 0; i < t.length; i++)
    r.uint16(t[i].markClass), r.uint16(s[i]);
  for (let i = 0; i < e.length; i++)
    e[i].length && (r.seek(s[i]), r.rawBytes(e[i]));
  return r.toArray();
}
function Sg(t) {
  const { majorVersion: e, minorVersion: n } = t, o = _g(t), s = _a(o.scriptList), r = Aa(o.featureList), i = va(
    o.lookupList,
    Ga,
    9
  ), a = o.featureVariations ? La(o.featureVariations) : null;
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
  const g = new I(f);
  return g.uint16(e), g.uint16(n), g.uint16(l), g.uint16(u), g.uint16(h), n >= 1 && g.uint32(p), g.seek(l), g.rawBytes(s), g.seek(u), g.rawBytes(r), g.seek(h), g.rawBytes(i), a && (g.seek(p), g.rawBytes(a)), g.toArray();
}
function _g(t) {
  const e = t.lookupList.lookups.map((n) => {
    if (n.lookupType !== 2 || !Array.isArray(n.subtables))
      return n;
    const o = n.subtables.flatMap((s) => s?.format !== 1 || !Array.isArray(s.pairSets) ? [s] : wg(s));
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
function wg(t) {
  const e = bg(t.coverage);
  if (e.length !== t.pairSets.length)
    return [t];
  const n = Mt(t.valueFormat1) + Mt(t.valueFormat2), o = t.pairSets.map(
    (c) => 2 + c.length * (2 + n)
  ), s = o.reduce((c, f) => c + f, 0);
  if (Dr(
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
      if (Dr(
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
function Dr(t, e) {
  const n = 10 + t * 2, o = 4 + t * 2;
  return n + o + e;
}
function bg(t) {
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
function Ga(t, e) {
  switch (e) {
    case 1:
      return Ag(t);
    case 2:
      return Cg(t);
    case 3:
      return Ig(t);
    case 4:
      return vg(t);
    case 5:
      return Og(t);
    case 6:
      return Eg(t);
    case 7:
      return ka(t);
    case 8:
      return Ra(t);
    case 9:
      return Tg(t);
    default:
      throw new Error(`Unknown GPOS lookup type: ${e}`);
  }
}
function Ag(t) {
  const e = G(t.coverage), n = [];
  if (t.format === 1) {
    const o = ue(
      t.valueRecord,
      t.valueFormat,
      n
    ), r = 6 + o.length, i = r + e.length, a = new I(i);
    return a.uint16(1), a.uint16(r), a.uint16(t.valueFormat), a.rawBytes(o), a.seek(r), a.rawBytes(e), a.toArray();
  }
  if (t.format === 2) {
    const o = Mt(t.valueFormat), s = t.valueRecords.map(
      (f) => ue(f, t.valueFormat, n)
    ), i = 8 + s.length * o, a = i + e.length, c = new I(a);
    c.uint16(2), c.uint16(i), c.uint16(t.valueFormat), c.uint16(t.valueCount);
    for (const f of s) c.rawBytes(f);
    return c.seek(i), c.rawBytes(e), c.toArray();
  }
  throw new Error(`Unknown SinglePos format: ${t.format}`);
}
function Cg(t) {
  const e = G(t.coverage), n = [];
  if (t.format === 1) {
    const o = t.pairSets.map((f) => {
      const l = Mt(t.valueFormat1), u = Mt(t.valueFormat2), h = 2 + l + u, p = new I(2 + f.length * h);
      p.uint16(f.length);
      for (const g of f)
        p.uint16(g.secondGlyph), p.rawBytes(ue(g.value1, t.valueFormat1, n)), p.rawBytes(ue(g.value2, t.valueFormat2, n));
      return p.toArray();
    });
    let r = 10 + t.pairSets.length * 2;
    const i = r;
    r += e.length;
    const a = o.map((f) => {
      const l = r;
      return r += f.length, l;
    }), c = new I(r);
    c.uint16(1), c.uint16(i), c.uint16(t.valueFormat1), c.uint16(t.valueFormat2), c.uint16(t.pairSets.length), c.array("uint16", a), c.seek(i), c.rawBytes(e);
    for (let f = 0; f < o.length; f++)
      c.seek(a[f]), c.rawBytes(o[f]);
    return c.toArray();
  }
  if (t.format === 2) {
    const o = Vt(t.classDef1), s = Vt(t.classDef2), r = Mt(t.valueFormat1), i = Mt(t.valueFormat2), a = r + i;
    let l = 16 + t.class1Count * t.class2Count * a;
    const u = l;
    l += e.length;
    const h = l;
    l += o.length;
    const p = l;
    l += s.length;
    const g = new I(l);
    g.uint16(2), g.uint16(u), g.uint16(t.valueFormat1), g.uint16(t.valueFormat2), g.uint16(h), g.uint16(p), g.uint16(t.class1Count), g.uint16(t.class2Count);
    for (const d of t.class1Records)
      for (const x of d)
        g.rawBytes(ue(x.value1, t.valueFormat1, n)), g.rawBytes(ue(x.value2, t.valueFormat2, n));
    return g.seek(u), g.rawBytes(e), g.seek(h), g.rawBytes(o), g.seek(p), g.rawBytes(s), g.toArray();
  }
  throw new Error(`Unknown PairPos format: ${t.format}`);
}
function Ig(t) {
  const e = G(t.coverage), n = t.entryExitRecords.map((c) => ({
    entry: c.entryAnchor ? je(c.entryAnchor) : null,
    exit: c.exitAnchor ? je(c.exitAnchor) : null
  }));
  let s = 6 + t.entryExitRecords.length * 4;
  const r = s;
  s += e.length;
  const i = n.map((c) => {
    const f = c.entry ? s : 0;
    c.entry && (s += c.entry.length);
    const l = c.exit ? s : 0;
    return c.exit && (s += c.exit.length), { entryOff: f, exitOff: l };
  }), a = new I(s);
  a.uint16(1), a.uint16(r), a.uint16(t.entryExitRecords.length);
  for (const c of i)
    a.uint16(c.entryOff), a.uint16(c.exitOff);
  a.seek(r), a.rawBytes(e);
  for (let c = 0; c < n.length; c++)
    n[c].entry && (a.seek(i[c].entryOff), a.rawBytes(n[c].entry)), n[c].exit && (a.seek(i[c].exitOff), a.rawBytes(n[c].exit));
  return a.toArray();
}
function vg(t) {
  const e = G(t.markCoverage), n = G(t.baseCoverage), o = Is(t.markArray), s = Pa(t.baseArray);
  let i = 12;
  const a = i;
  i += e.length;
  const c = i;
  i += n.length;
  const f = i;
  i += o.length;
  const l = i;
  i += s.length;
  const u = new I(i);
  return u.uint16(1), u.uint16(a), u.uint16(c), u.uint16(t.markClassCount), u.uint16(f), u.uint16(l), u.seek(a), u.rawBytes(e), u.seek(c), u.rawBytes(n), u.seek(f), u.rawBytes(o), u.seek(l), u.rawBytes(s), u.toArray();
}
function Pa(t) {
  const e = t.length > 0 ? t[0].length : 0, n = t.map((a) => a.map(je));
  let s = 2 + t.length * e * 2;
  const r = n.map(
    (a) => a.map((c) => {
      if (!c.length) return 0;
      const f = s;
      return s += c.length, f;
    })
  ), i = new I(s);
  i.uint16(t.length);
  for (let a = 0; a < t.length; a++)
    for (let c = 0; c < e; c++)
      i.uint16(r[a][c]);
  for (let a = 0; a < n.length; a++)
    for (let c = 0; c < e; c++)
      n[a][c].length && (i.seek(r[a][c]), i.rawBytes(n[a][c]));
  return i.toArray();
}
function Og(t) {
  const e = G(t.markCoverage), n = G(t.ligatureCoverage), o = Is(t.markArray), s = kg(t.ligatureArray, t.markClassCount);
  let i = 12;
  const a = i;
  i += e.length;
  const c = i;
  i += n.length;
  const f = i;
  i += o.length;
  const l = i;
  i += s.length;
  const u = new I(i);
  return u.uint16(1), u.uint16(a), u.uint16(c), u.uint16(t.markClassCount), u.uint16(f), u.uint16(l), u.seek(a), u.rawBytes(e), u.seek(c), u.rawBytes(n), u.seek(f), u.rawBytes(o), u.seek(l), u.rawBytes(s), u.toArray();
}
function kg(t, e) {
  const n = t.map((a) => {
    const c = a.map((p) => p.map(je));
    let l = 2 + a.length * e * 2;
    const u = c.map(
      (p) => p.map((g) => {
        if (!g.length) return 0;
        const d = l;
        return l += g.length, d;
      })
    ), h = new I(l);
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
  }), i = new I(s);
  i.uint16(t.length), i.array("uint16", r);
  for (let a = 0; a < n.length; a++)
    i.seek(r[a]), i.rawBytes(n[a]);
  return i.toArray();
}
function Eg(t) {
  const e = G(t.mark1Coverage), n = G(t.mark2Coverage), o = Is(t.mark1Array), s = Pa(t.mark2Array);
  let i = 12;
  const a = i;
  i += e.length;
  const c = i;
  i += n.length;
  const f = i;
  i += o.length;
  const l = i;
  i += s.length;
  const u = new I(i);
  return u.uint16(1), u.uint16(a), u.uint16(c), u.uint16(t.markClassCount), u.uint16(f), u.uint16(l), u.seek(a), u.rawBytes(e), u.seek(c), u.rawBytes(n), u.seek(f), u.rawBytes(o), u.seek(l), u.rawBytes(s), u.toArray();
}
function Tg(t) {
  const e = Ga(t.subtable, t.extensionLookupType), n = 8, o = new I(n + e.length);
  return o.uint16(1), o.uint16(t.extensionLookupType), o.uint32(n), o.rawBytes(e), o.toArray();
}
function Dg(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.uint16();
  let a = 0;
  o >= 1 && (a = e.uint32());
  const c = {
    majorVersion: n,
    minorVersion: o,
    scriptList: Sa(e, s),
    featureList: wa(e, r),
    lookupList: Ia(e, i, Ua, 7)
  };
  return a !== 0 && (c.featureVariations = Ma(
    e,
    a
  )), c;
}
function Ua(t, e, n) {
  switch (n) {
    case 1:
      return Rg(t, e);
    case 2:
      return Fg(t, e);
    case 3:
      return Mg(t, e);
    case 4:
      return Lg(t, e);
    case 5:
      return Oa(t, e);
    case 6:
      return Ta(t, e);
    case 7:
      return Bg(t, e);
    case 8:
      return Vg(t, e);
    default:
      throw new Error(`Unknown GSUB lookup type: ${n}`);
  }
}
function Rg(t, e) {
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
function Fg(t, e) {
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
function Mg(t, e) {
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
function Lg(t, e) {
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
function Bg(t, e) {
  t.seek(e);
  const n = t.uint16();
  if (n !== 1) throw new Error(`Unknown ExtensionSubst format: ${n}`);
  const o = t.uint16(), s = t.uint32(), r = Ua(
    t,
    e + s,
    o
  );
  return { format: n, extensionLookupType: o, extensionOffset: s, subtable: r };
}
function Vg(t, e) {
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
function $g(t) {
  const { majorVersion: e, minorVersion: n } = t, o = _a(t.scriptList), s = Aa(t.featureList), r = va(t.lookupList, za, 7), i = t.featureVariations ? La(t.featureVariations) : null;
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
  const p = new I(c);
  return p.uint16(e), p.uint16(n), p.uint16(f), p.uint16(l), p.uint16(u), n >= 1 && p.uint32(h), p.seek(f), p.rawBytes(o), p.seek(l), p.rawBytes(s), p.seek(u), p.rawBytes(r), i && (p.seek(h), p.rawBytes(i)), p.toArray();
}
function za(t, e) {
  switch (e) {
    case 1:
      return Ng(t);
    case 2:
      return Gg(t);
    case 3:
      return Pg(t);
    case 4:
      return Ug(t);
    case 5:
      return ka(t);
    case 6:
      return Ra(t);
    case 7:
      return Hg(t);
    case 8:
      return Wg(t);
    default:
      throw new Error(`Unknown GSUB lookup type: ${e}`);
  }
}
function Ng(t) {
  const e = G(t.coverage);
  if (t.format === 1) {
    const s = new I(6 + e.length);
    return s.uint16(1), s.uint16(6), s.int16(t.deltaGlyphID), s.seek(6), s.rawBytes(e), s.toArray();
  }
  if (t.format === 2) {
    const n = 6 + t.substituteGlyphIDs.length * 2, o = n, s = new I(n + e.length);
    return s.uint16(2), s.uint16(o), s.uint16(t.substituteGlyphIDs.length), s.array("uint16", t.substituteGlyphIDs), s.seek(o), s.rawBytes(e), s.toArray();
  }
  throw new Error(`Unknown SingleSubst format: ${t.format}`);
}
function Gg(t) {
  const e = G(t.coverage), n = t.sequences.map((c) => {
    const f = new I(2 + c.length * 2);
    return f.uint16(c.length), f.array("uint16", c), f.toArray();
  });
  let s = 6 + t.sequences.length * 2;
  const r = s;
  s += e.length;
  const i = n.map((c) => {
    const f = s;
    return s += c.length, f;
  }), a = new I(s);
  a.uint16(1), a.uint16(r), a.uint16(t.sequences.length), a.array("uint16", i), a.seek(r), a.rawBytes(e);
  for (let c = 0; c < n.length; c++)
    a.seek(i[c]), a.rawBytes(n[c]);
  return a.toArray();
}
function Pg(t) {
  const e = G(t.coverage), n = t.alternateSets.map((c) => {
    const f = new I(2 + c.length * 2);
    return f.uint16(c.length), f.array("uint16", c), f.toArray();
  });
  let s = 6 + t.alternateSets.length * 2;
  const r = s;
  s += e.length;
  const i = n.map((c) => {
    const f = s;
    return s += c.length, f;
  }), a = new I(s);
  a.uint16(1), a.uint16(r), a.uint16(t.alternateSets.length), a.array("uint16", i), a.seek(r), a.rawBytes(e);
  for (let c = 0; c < n.length; c++)
    a.seek(i[c]), a.rawBytes(n[c]);
  return a.toArray();
}
function Ug(t) {
  const e = G(t.coverage), n = t.ligatureSets.map(zg);
  let s = 6 + t.ligatureSets.length * 2;
  const r = s;
  s += e.length;
  const i = n.map((c) => {
    const f = s;
    return s += c.length, f;
  }), a = new I(s);
  a.uint16(1), a.uint16(r), a.uint16(t.ligatureSets.length), a.array("uint16", i), a.seek(r), a.rawBytes(e);
  for (let c = 0; c < n.length; c++)
    a.seek(i[c]), a.rawBytes(n[c]);
  return a.toArray();
}
function zg(t) {
  const e = t.map((i) => {
    const a = 4 + (i.componentCount - 1) * 2, c = new I(a);
    return c.uint16(i.ligatureGlyph), c.uint16(i.componentCount), c.array("uint16", i.componentGlyphIDs), c.toArray();
  });
  let o = 2 + t.length * 2;
  const s = e.map((i) => {
    const a = o;
    return o += i.length, a;
  }), r = new I(o);
  r.uint16(t.length), r.array("uint16", s);
  for (let i = 0; i < e.length; i++)
    r.seek(s[i]), r.rawBytes(e[i]);
  return r.toArray();
}
function Hg(t) {
  const e = za(t.subtable, t.extensionLookupType), n = 8, o = new I(n + e.length);
  return o.uint16(1), o.uint16(t.extensionLookupType), o.uint32(n), o.rawBytes(e), o.toArray();
}
function Wg(t) {
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
  }), f = new I(r);
  f.uint16(1), f.uint16(i), f.uint16(t.backtrackCoverages.length), f.array("uint16", a), f.uint16(t.lookaheadCoverages.length), f.array("uint16", c), f.uint16(t.substituteGlyphIDs.length), f.array("uint16", t.substituteGlyphIDs), f.seek(i), f.rawBytes(e);
  for (let l = 0; l < n.length; l++)
    f.seek(a[l]), f.rawBytes(n[l]);
  for (let l = 0; l < o.length; l++)
    f.seek(c[l]), f.rawBytes(o[l]);
  return f.toArray();
}
const jg = 8;
function Yg(t, e) {
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
function Zg(t) {
  const e = t.version ?? 0, n = t.records ?? [], o = Math.max(
    0,
    ...n.map((f) => (f.widths ?? []).length)
  ), s = Xg(2 + o), r = t.sizeDeviceRecord ?? s, i = Math.max(2, r), a = jg + i * n.length, c = new I(a);
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
function Xg(t) {
  return t + (4 - t % 4) % 4;
}
const qg = 54;
function jo(t) {
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
function Ha(t) {
  const e = new I(qg);
  return e.uint16(t.majorVersion), e.uint16(t.minorVersion), e.fixed(t.fontRevision), e.uint32(t.checksumAdjustment), e.uint32(t.magicNumber), e.uint16(t.flags), e.uint16(t.unitsPerEm), e.longDateTime(t.created), e.longDateTime(t.modified), e.int16(t.xMin), e.int16(t.yMin), e.int16(t.xMax), e.int16(t.yMax), e.uint16(t.macStyle), e.uint16(t.lowestRecPPEM), e.int16(t.fontDirectionHint), e.int16(t.indexToLocFormat), e.int16(t.glyphDataFormat), e.toArray();
}
const Kg = 36;
function Jg(t) {
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
function Qg(t) {
  const e = new I(Kg);
  return e.uint16(t.majorVersion), e.uint16(t.minorVersion), e.fword(t.ascender), e.fword(t.descender), e.fword(t.lineGap), e.ufword(t.advanceWidthMax), e.fword(t.minLeftSideBearing), e.fword(t.minRightSideBearing), e.fword(t.xMaxExtent), e.int16(t.caretSlopeRise), e.int16(t.caretSlopeRun), e.int16(t.caretOffset), e.int16(t.reserved1), e.int16(t.reserved2), e.int16(t.reserved3), e.int16(t.reserved4), e.int16(t.metricDataFormat), e.uint16(t.numberOfHMetrics), e.toArray();
}
function tp(t, e) {
  const n = e.hhea.numberOfHMetrics, o = e.maxp.numGlyphs, s = new F(t), r = [];
  for (let c = 0; c < n; c++)
    r.push({
      advanceWidth: s.ufword(),
      lsb: s.fword()
    });
  const i = o - n, a = s.array("fword", i);
  return { hMetrics: r, leftSideBearings: a };
}
function ep(t) {
  const { hMetrics: e, leftSideBearings: n } = t, o = e.length * 4 + n.length * 2, s = new I(o);
  for (const r of e)
    s.ufword(r.advanceWidth), s.fword(r.lsb);
  return s.array("fword", n), s.toArray();
}
const np = 20, Wa = 15, ja = 48;
function op(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.offset32(), r = e.offset32(), i = e.offset32(), a = e.offset32();
  return {
    majorVersion: n,
    minorVersion: o,
    itemVariationStore: s ? Pt(
      t.slice(
        s,
        Ya(t.length, s, [
          r,
          i,
          a
        ])
      )
    ) : null,
    advanceWidthMapping: mo(
      t,
      r,
      [s, i, a]
    ),
    lsbMapping: mo(t, i, [
      s,
      r,
      a
    ]),
    rsbMapping: mo(t, a, [
      s,
      r,
      i
    ])
  };
}
function mo(t, e, n) {
  if (!e)
    return null;
  const o = Ya(t.length, e, n);
  if (o <= e || e >= t.length)
    return { format: 0, entryFormat: 0, mapCount: 0, entries: [], _raw: [] };
  const s = Array.from(t.slice(e, o));
  return {
    ...sp(s),
    _raw: s
  };
}
function Ya(t, e, n) {
  return n.filter((s) => s > e).sort((s, r) => s - r)[0] ?? t;
}
function sp(t) {
  const e = new F(t), n = e.uint8(), o = e.uint8(), s = n === 1 ? e.uint32() : e.uint16(), r = (o & Wa) + 1, i = ((o & ja) >> 4) + 1, a = [];
  for (let c = 0; c < s; c++) {
    const f = up(e, i);
    a.push(cp(f, r));
  }
  return {
    format: n,
    entryFormat: o,
    mapCount: s,
    entries: a
  };
}
function rp(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.itemVariationStore ? ee(t.itemVariationStore) : [], s = yo(
    t.advanceWidthMapping
  ), r = yo(t.lsbMapping), i = yo(t.rsbMapping);
  let a = np;
  const c = o.length ? a : 0;
  a += o.length;
  const f = s.length ? a : 0;
  a += s.length;
  const l = r.length ? a : 0;
  a += r.length;
  const u = i.length ? a : 0;
  a += i.length;
  const h = new I(a);
  return h.uint16(e), h.uint16(n), h.offset32(c), h.offset32(f), h.offset32(l), h.offset32(u), h.rawBytes(o), h.rawBytes(s), h.rawBytes(r), h.rawBytes(i), h.toArray();
}
function yo(t) {
  return t ? t._raw ? t._raw : ip(t) : [];
}
function ip(t) {
  const e = t.entries ?? [], n = t.mapCount ?? e.length, o = fp(e), s = t.format ?? (n > 65535 ? 1 : 0), r = t.entryFormat ?? o.entryFormat, i = (r & Wa) + 1, a = ((r & ja) >> 4) + 1, c = s === 1 ? 6 : 4, f = new I(c + n * a);
  f.uint8(s), f.uint8(r), s === 1 ? f.uint32(n) : f.uint16(n);
  for (let l = 0; l < n; l++) {
    const u = e[l] ?? { outerIndex: 0, innerIndex: 0 }, h = ap(u, i);
    hp(f, h, a);
  }
  return f.toArray();
}
function ap(t, e) {
  const n = (1 << e) - 1;
  return (t.outerIndex ?? 0) << e | (t.innerIndex ?? 0) & n;
}
function cp(t, e) {
  const n = (1 << e) - 1;
  return {
    outerIndex: t >> e,
    innerIndex: t & n
  };
}
function fp(t) {
  let e = 0, n = 0;
  for (const a of t)
    e = Math.max(e, a.innerIndex ?? 0), n = Math.max(n, a.outerIndex ?? 0);
  let o = 1;
  for (; (1 << o) - 1 < e && o < 16; )
    o++;
  const s = n << o | e;
  let r = 1;
  for (; r < 4 && s > lp(r); )
    r++;
  return { entryFormat: r - 1 << 4 | o - 1 };
}
function lp(t) {
  return t === 1 ? 255 : t === 2 ? 65535 : t === 3 ? 16777215 : 4294967295;
}
function up(t, e) {
  return e === 1 ? t.uint8() : e === 2 ? t.uint16() : e === 3 ? t.uint24() : t.uint32();
}
function hp(t, e, n) {
  n === 1 ? t.uint8(e) : n === 2 ? t.uint16(e) : n === 3 ? t.uint24(e) : t.uint32(e >>> 0);
}
const gp = 6, pp = 6;
function dp(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = [];
  for (let c = 0; c < s; c++)
    r.push({
      tag: e.tag(),
      offset: e.offset16()
    });
  const i = r.map((c) => c.offset).filter((c) => c > 0), a = r.map((c) => ({
    ...c,
    table: yp(t, c.offset, i)
  }));
  return {
    majorVersion: n,
    minorVersion: o,
    scripts: a
  };
}
function mp(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.scripts ?? [], s = o.map((c) => xp(c.table));
  let r = gp + o.length * pp;
  const i = s.map((c) => {
    if (!c.length)
      return 0;
    const f = r;
    return r += c.length, f;
  }), a = new I(r);
  a.uint16(e), a.uint16(n), a.uint16(o.length);
  for (let c = 0; c < o.length; c++) {
    const l = (o[c].tag ?? "    ").slice(0, 4).padEnd(4, " ");
    a.tag(l), a.offset16(i[c]);
  }
  for (const c of s)
    a.rawBytes(c);
  return a.toArray();
}
function yp(t, e, n) {
  if (!e)
    return null;
  const s = n.filter((r) => r > e).sort((r, i) => r - i)[0] ?? t.length;
  return s <= e || e >= t.length ? { _raw: [] } : { _raw: Array.from(t.slice(e, s)) };
}
function xp(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
const Za = 4, On = 6, Xa = 8, kn = 8;
function Sp(t) {
  const e = new F(t);
  return (t.length >= 4 ? e.uint32() : 0) === 65536 ? Cp(t) : _p(t);
}
function _p(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = [];
  let r = Za;
  for (let i = 0; i < o && !(r + On > t.length); i++) {
    e.seek(r);
    const a = e.uint16(), c = e.uint16(), f = e.uint16(), l = f >> 8 & 255, u = Math.min(
      t.length,
      r + Math.max(c, On)
    ), h = r + On, p = Array.from(t.slice(h, u)), g = {
      version: a,
      coverage: f,
      format: l
    };
    l === 0 ? Object.assign(g, qa(p)) : l === 2 ? Object.assign(g, Ka(p)) : g._raw = p, s.push(g), r = u;
  }
  return {
    formatVariant: "opentype",
    version: n,
    nTables: o,
    subtables: s
  };
}
function qa(t) {
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
function wp(t) {
  return qa(t);
}
function Ka(t) {
  const e = new F(t);
  if (t.length < 8) return { _raw: t };
  const n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = Rr(e, t, o), a = Rr(e, t, s), c = n > 0 ? n / 2 : 0, f = n > 0 && i.maxOffset >= r ? Math.floor((i.maxOffset - r) / n) + 1 : 1, l = [];
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
function Rr(t, e, n) {
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
function bp(t) {
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
function Ap(t) {
  const e = new F(t);
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
function Cp(t) {
  const e = new F(t), n = e.uint32(), o = e.uint32(), s = [];
  let r = Xa;
  for (let i = 0; i < o && !(r + kn > t.length); i++) {
    e.seek(r);
    const a = e.uint32(), c = e.uint8(), f = e.uint8(), l = e.uint16(), u = Math.min(
      t.length,
      r + Math.max(a, kn)
    ), h = Array.from(
      t.slice(r + kn, u)
    ), p = {
      coverage: c,
      format: f,
      tupleIndex: l
    };
    f === 0 ? Object.assign(p, wp(h)) : f === 1 ? Object.assign(p, Ap(h)) : f === 2 ? Object.assign(p, Ka(h)) : f === 3 ? Object.assign(p, bp(h)) : p._raw = h, s.push(p), r = u;
  }
  return {
    formatVariant: "apple",
    version: n,
    nTables: o,
    subtables: s
  };
}
function Ip(t) {
  return t.formatVariant === "apple" ? kp(t) : vp(t);
}
function vp(t) {
  const e = t.version ?? 0, n = t.subtables ?? [], o = n.map(
    (a) => Op(a)
  ), s = n.length, r = Za + o.reduce((a, c) => a + c.length, 0), i = new I(r);
  i.uint16(e), i.uint16(s);
  for (const a of o)
    i.rawBytes(a);
  return i.toArray();
}
function Op(t) {
  const e = t._raw ? t._raw : t.format === 0 ? Ja(t) : t.format === 2 ? Qa(t) : [], n = On + e.length, o = t.coverage ?? (t.format ?? 0) << 8, s = new I(n);
  return s.uint16(t.version ?? 0), s.uint16(n), s.uint16(o), s.rawBytes(e), s.toArray();
}
function Ja(t) {
  const e = t.pairs ?? [], n = e.length, o = Math.floor(Math.log2(Math.max(1, n))), s = Math.pow(2, o) * 6, r = n * 6 - s, i = new I(8 + n * 6);
  i.uint16(n), i.uint16(t.searchRange ?? s), i.uint16(t.entrySelector ?? o), i.uint16(t.rangeShift ?? r);
  for (const a of e)
    i.uint16(a.left), i.uint16(a.right), i.int16(a.value);
  return i.toArray();
}
function kp(t) {
  const e = t.version ?? 65536, n = t.subtables ?? [], o = n.map((a) => {
    const c = Ep(a), f = kn + c.length, l = new I(f);
    return l.uint32(f), l.uint8(a.coverage ?? 0), l.uint8(a.format ?? 0), l.uint16(a.tupleIndex ?? 0), l.rawBytes(c), l.toArray();
  }), s = n.length, r = Xa + o.reduce((a, c) => a + c.length, 0), i = new I(r);
  i.uint32(e), i.uint32(s);
  for (const a of o)
    i.rawBytes(a);
  return i.toArray();
}
function Ep(t) {
  if (t._raw) return t._raw;
  switch (t.format) {
    case 0:
      return Ja(t);
    case 1:
      return Dp(t);
    case 2:
      return Qa(t);
    case 3:
      return Tp(t);
    default:
      return [];
  }
}
function Qa(t) {
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
  } = t, l = Fr(r), u = Fr(i), h = a * c * 2, p = Math.max(
    s + h,
    n + l.length,
    o + u.length,
    8
    // header
  ), g = new I(p);
  g.uint16(e), g.uint16(n), g.uint16(o), g.uint16(s), g.seek(n), g.rawBytes(l), g.seek(o), g.rawBytes(u), g.seek(s);
  for (let d = 0; d < a; d++) {
    const x = f[d] || [];
    for (let m = 0; m < c; m++)
      g.int16(x[m] || 0);
  }
  return g.toArray();
}
function Fr(t) {
  const { firstGlyph: e, nGlyphs: n, offsets: o } = t, s = new I(4 + n * 2);
  s.uint16(e), s.uint16(n);
  for (let r = 0; r < n; r++)
    s.uint16(o[r] || 0);
  return s.toArray();
}
function Tp(t) {
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
  l, h = new I(u);
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
function Dp(t) {
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
  ), d = new I(g);
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
function Rp(t) {
  const e = new F(t), n = e.uint32(), o = e.uint32(), s = e.uint32(), r = [], i = [];
  for (let a = 0; a < s; a++)
    i.push({ offset: e.uint16(), length: e.uint16() });
  for (const a of i) {
    const c = t.slice(a.offset, a.offset + a.length);
    r.push(new TextDecoder("utf-8").decode(new Uint8Array(c)));
  }
  return { version: n, flags: o, tags: r };
}
function Fp(t) {
  const { version: e, flags: n, tags: o } = t, s = new TextEncoder(), r = o.map((l) => s.encode(l)), i = 12 + o.length * 4, a = i + r.reduce((l, u) => l + u.length, 0), c = new I(a);
  c.uint32(e), c.uint32(n), c.uint32(o.length);
  let f = i;
  for (const l of r)
    c.uint16(f), c.uint16(l.length), f += l.length;
  for (const l of r)
    c.rawBytes(l);
  return c.toArray();
}
function Mp(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.bytes(o);
  return {
    version: n,
    numGlyphs: o,
    yPels: s
  };
}
function Lp(t) {
  const e = t.version ?? 0, n = t.yPels ?? [], o = t.numGlyphs ?? n.length, s = n.slice(0, o);
  for (; s.length < o; )
    s.push(0);
  const r = new I(4 + o);
  return r.uint16(e), r.uint16(o), r.rawBytes(s), r.toArray();
}
const Bp = 10;
function Vp(t) {
  const e = new F(t), n = e.uint32(), o = e.offset16(), s = e.offset16(), r = e.offset16(), i = [
    o,
    s,
    r
  ].filter((a) => a > 0);
  return {
    version: n,
    mathConstants: xo(t, o, i),
    mathGlyphInfo: xo(t, s, i),
    mathVariants: xo(t, r, i)
  };
}
function $p(t) {
  const e = t.version ?? 65536, n = So(t.mathConstants), o = So(t.mathGlyphInfo), s = So(t.mathVariants);
  let r = Bp;
  const i = n.length ? r : 0;
  r += n.length;
  const a = o.length ? r : 0;
  r += o.length;
  const c = s.length ? r : 0;
  r += s.length;
  const f = new I(r);
  return f.uint32(e), f.offset16(i), f.offset16(a), f.offset16(c), f.rawBytes(n), f.rawBytes(o), f.rawBytes(s), f.toArray();
}
function xo(t, e, n) {
  if (!e)
    return null;
  const s = n.filter((r) => r > e).sort((r, i) => r - i)[0] ?? t.length;
  return s <= e || e >= t.length ? { _raw: [] } : { _raw: Array.from(t.slice(e, s)) };
}
function So(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
const Np = 6, Gp = 32;
function Pp(t) {
  const e = new F(t), n = e.uint32(), o = e.uint16(), s = { version: n, numGlyphs: o };
  return n === 65536 && (s.maxPoints = e.uint16(), s.maxContours = e.uint16(), s.maxCompositePoints = e.uint16(), s.maxCompositeContours = e.uint16(), s.maxZones = e.uint16(), s.maxTwilightPoints = e.uint16(), s.maxStorage = e.uint16(), s.maxFunctionDefs = e.uint16(), s.maxInstructionDefs = e.uint16(), s.maxStackElements = e.uint16(), s.maxSizeOfInstructions = e.uint16(), s.maxComponentElements = e.uint16(), s.maxComponentDepth = e.uint16()), s;
}
function Up(t) {
  const e = t.version === 65536, n = e ? Gp : Np, o = new I(n);
  return o.uint32(t.version), o.uint16(t.numGlyphs), e && (o.uint16(t.maxPoints), o.uint16(t.maxContours), o.uint16(t.maxCompositePoints), o.uint16(t.maxCompositeContours), o.uint16(t.maxZones), o.uint16(t.maxTwilightPoints), o.uint16(t.maxStorage), o.uint16(t.maxFunctionDefs), o.uint16(t.maxInstructionDefs), o.uint16(t.maxStackElements), o.uint16(t.maxSizeOfInstructions), o.uint16(t.maxComponentElements), o.uint16(t.maxComponentDepth)), o.toArray();
}
function zp(t) {
  if (!t.length)
    return { version: 0, data: [] };
  const e = new F(t), n = t.length >= 2 ? e.uint16() : 0, o = t.length >= 2 ? Array.from(t.slice(2)) : [];
  return {
    version: n,
    data: o
  };
}
function Hp(t) {
  const e = t.version ?? 0, n = t.data ?? [], o = new I(2 + n.length);
  return o.uint16(e), o.rawBytes(n), o.toArray();
}
const tc = 16, Wp = 12;
function jp(t) {
  const e = new F(t), n = e.uint32(), o = e.uint32(), s = e.uint32(), r = e.uint32(), i = [];
  for (let a = 0; a < r; a++) {
    const c = e.tag(), f = e.uint32(), l = e.uint32(), u = f, h = Math.min(t.length, u + l), p = u < tc || u >= t.length || h < u ? [] : Array.from(t.slice(u, h));
    i.push({ tag: c, dataOffset: f, dataLength: l, data: p });
  }
  return {
    version: n,
    flags: o,
    reserved: s,
    dataMaps: i
  };
}
function Yp(t) {
  const e = t.version ?? 1, n = t.flags ?? 0, o = t.reserved ?? 0, r = (t.dataMaps ?? []).map((f) => ({
    tag: (f.tag ?? "    ").slice(0, 4).padEnd(4, " "),
    data: f.data ?? []
  }));
  let i = tc + r.length * Wp;
  const a = r.map((f) => {
    const l = i, u = f.data.length;
    return i += u, {
      tag: f.tag,
      dataOffset: l,
      dataLength: u,
      data: f.data
    };
  }), c = new I(i);
  c.uint32(e), c.uint32(n), c.uint32(o), c.uint32(a.length);
  for (const f of a)
    c.tag(f.tag), c.uint32(f.dataOffset), c.uint32(f.dataLength);
  for (const f of a)
    c.rawBytes(f.data);
  return c.toArray();
}
const Yo = 12, he = 8;
function Zp(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.uint16(), a = e.offset16(), c = [];
  for (let l = 0; l < i; l++) {
    const u = Yo + l * r;
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
    r > he && (h._extra = e.bytes(r - he)), c.push(h);
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
function Xp(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.reserved ?? 0, s = [...t.valueRecords ?? []].sort(
    (p, g) => qp(p.valueTag, g.valueTag)
  ), r = t.valueRecordSize ?? he, i = s.reduce((p, g) => {
    const d = g._extra?.length ?? 0;
    return Math.max(p, he + d);
  }, he), a = Math.max(
    r,
    i
  ), c = s.length, f = t.itemVariationStore ? ee(t.itemVariationStore) : [], l = f.length > 0 || c > 0 ? Yo + c * a : 0, u = l > 0 ? l + f.length : Yo, h = new I(u);
  h.uint16(e), h.uint16(n), h.uint16(o), h.uint16(a), h.uint16(c), h.offset16(l);
  for (const p of s) {
    h.tag(p.valueTag ?? "    "), h.uint16(p.deltaSetOuterIndex ?? 0), h.uint16(p.deltaSetInnerIndex ?? 0);
    const g = p._extra ?? [];
    h.rawBytes(g);
    const d = a - he - g.length;
    d > 0 && h.rawBytes(new Array(d).fill(0));
  }
  return h.rawBytes(f), h.toArray();
}
function qp(t, e) {
  const n = t ?? "    ", o = e ?? "    ";
  for (let s = 0; s < 4; s++) {
    const r = n.charCodeAt(s) - o.charCodeAt(s);
    if (r !== 0)
      return r;
  }
  return 0;
}
const Zo = [
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
], vs = /* @__PURE__ */ new Map();
for (let t = 0; t < 128; t++)
  vs.set(t, t);
for (let t = 0; t < Zo.length; t++)
  vs.set(Zo[t], 128 + t);
function Kp(t, e, n) {
  return e === 0 || e === 3 ? Xo(t) : e === 1 && n === 0 ? Qp(t) : t.length % 2 === 0 ? Xo(t) : "0x:" + t.map((o) => o.toString(16).padStart(2, "0")).join("");
}
function Jp(t, e, n) {
  if (t.startsWith("0x:")) {
    const o = t.slice(3), s = [];
    for (let r = 0; r < o.length; r += 2)
      s.push(parseInt(o.slice(r, r + 2), 16));
    return s;
  }
  return e === 0 || e === 3 ? qo(t) : e === 1 && n === 0 ? td(t) : qo(t);
}
function Xo(t) {
  const e = [];
  for (let n = 0; n + 1 < t.length; n += 2) {
    const o = t[n] << 8 | t[n + 1];
    e.push(o);
  }
  return String.fromCharCode(...e);
}
function qo(t) {
  const e = [];
  for (let n = 0; n < t.length; n++) {
    const o = t.charCodeAt(n);
    e.push(o >> 8 & 255, o & 255);
  }
  return e;
}
function Qp(t) {
  return t.map((e) => e < 128 ? String.fromCharCode(e) : String.fromCharCode(Zo[e - 128])).join("");
}
function td(t) {
  const e = [];
  for (let n = 0; n < t.length; n++) {
    const o = t.charCodeAt(n), s = vs.get(o);
    e.push(s !== void 0 ? s : 63);
  }
  return e;
}
function ed(t) {
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
        tag: Xo(p)
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
      value: Kp(l, f.platformID, f.encodingID)
    };
  }), c = { version: n, names: a };
  return n === 1 && i.length > 0 && (c.langTagRecords = i), c;
}
function nd(t) {
  const { version: e, names: n, langTagRecords: o = [] } = t, r = [...n].sort((_, b) => _.platformID !== b.platformID ? _.platformID - b.platformID : _.encodingID !== b.encodingID ? _.encodingID - b.encodingID : _.languageID !== b.languageID ? _.languageID - b.languageID : _.nameID - b.nameID).map((_) => ({
    platformID: _.platformID,
    encodingID: _.encodingID,
    languageID: _.languageID,
    nameID: _.nameID,
    bytes: Jp(_.value, _.platformID, _.encodingID)
  })), i = o.map((_) => qo(_.tag)), a = 6, c = 12, u = e === 1 ? (e === 1 ? 2 : 0) + o.length * 4 : 0, h = a + r.length * c + u, p = [];
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
  })), w = h + g, S = new I(w);
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
const ec = 78, nc = 86, oc = 96, sc = 100;
function od(t) {
  const e = new F(t), n = t.length, o = {};
  return o.version = e.uint16(), o.xAvgCharWidth = e.fword(), o.usWeightClass = e.uint16(), o.usWidthClass = e.uint16(), o.fsType = e.uint16(), o.ySubscriptXSize = e.fword(), o.ySubscriptYSize = e.fword(), o.ySubscriptXOffset = e.fword(), o.ySubscriptYOffset = e.fword(), o.ySuperscriptXSize = e.fword(), o.ySuperscriptYSize = e.fword(), o.ySuperscriptXOffset = e.fword(), o.ySuperscriptYOffset = e.fword(), o.yStrikeoutSize = e.fword(), o.yStrikeoutPosition = e.fword(), o.sFamilyClass = e.int16(), o.panose = e.bytes(10), o.ulUnicodeRange1 = e.uint32(), o.ulUnicodeRange2 = e.uint32(), o.ulUnicodeRange3 = e.uint32(), o.ulUnicodeRange4 = e.uint32(), o.achVendID = e.tag(), o.fsSelection = e.uint16(), o.usFirstCharIndex = e.uint16(), o.usLastCharIndex = e.uint16(), n < ec || (o.sTypoAscender = e.fword(), o.sTypoDescender = e.fword(), o.sTypoLineGap = e.fword(), o.usWinAscent = e.ufword(), o.usWinDescent = e.ufword(), o.version < 1 || n < nc) || (o.ulCodePageRange1 = e.uint32(), o.ulCodePageRange2 = e.uint32(), o.version < 2 || n < oc) || (o.sxHeight = e.fword(), o.sCapHeight = e.fword(), o.usDefaultChar = e.uint16(), o.usBreakChar = e.uint16(), o.usMaxContext = e.uint16(), o.version < 5 || n < sc) || (o.usLowerOpticalPointSize = e.uint16(), o.usUpperOpticalPointSize = e.uint16()), o;
}
function sd(t) {
  const e = t.version;
  let n;
  e >= 5 ? n = sc : e >= 2 ? n = oc : e >= 1 ? n = nc : n = t.sTypoAscender !== void 0 ? ec : 68;
  const o = new I(n);
  return o.uint16(e).fword(t.xAvgCharWidth).uint16(t.usWeightClass).uint16(t.usWidthClass).uint16(t.fsType).fword(t.ySubscriptXSize).fword(t.ySubscriptYSize).fword(t.ySubscriptXOffset).fword(t.ySubscriptYOffset).fword(t.ySuperscriptXSize).fword(t.ySuperscriptYSize).fword(t.ySuperscriptXOffset).fword(t.ySuperscriptYOffset).fword(t.yStrikeoutSize).fword(t.yStrikeoutPosition).int16(t.sFamilyClass).rawBytes(t.panose).uint32(t.ulUnicodeRange1).uint32(t.ulUnicodeRange2).uint32(t.ulUnicodeRange3).uint32(t.ulUnicodeRange4).tag(t.achVendID).uint16(t.fsSelection).uint16(t.usFirstCharIndex).uint16(t.usLastCharIndex), n <= 68 || (o.fword(t.sTypoAscender).fword(t.sTypoDescender).fword(t.sTypoLineGap).ufword(t.usWinAscent).ufword(t.usWinDescent), e < 1) || (o.uint32(t.ulCodePageRange1).uint32(t.ulCodePageRange2), e < 2) || (o.fword(t.sxHeight).fword(t.sCapHeight).uint16(t.usDefaultChar).uint16(t.usBreakChar).uint16(t.usMaxContext), e < 5) || o.uint16(t.usLowerOpticalPointSize).uint16(t.usUpperOpticalPointSize), o.toArray();
}
const rd = 54;
function id(t) {
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
    typeface: _o(e.bytes(16)),
    characterComplement: _o(e.bytes(8)),
    fileName: _o(e.bytes(6)),
    strokeWeight: e.int8(),
    widthType: e.int8(),
    serifStyle: e.uint8(),
    reserved: e.uint8()
  };
}
function ad(t) {
  const e = new I(rd);
  return e.uint32(t.version ?? 65536), e.uint32(t.fontNumber ?? 0), e.uint16(t.pitch ?? 0), e.uint16(t.xHeight ?? 0), e.uint16(t.style ?? 0), e.uint16(t.typeFamily ?? 0), e.uint16(t.capHeight ?? 0), e.uint16(t.symbolSet ?? 0), e.rawBytes(wo(t.typeface ?? "", 16)), e.rawBytes(wo(t.characterComplement ?? "", 8)), e.rawBytes(wo(t.fileName ?? "", 6)), e.int8(t.strokeWeight ?? 0), e.int8(t.widthType ?? 0), e.uint8(t.serifStyle ?? 0), e.uint8(t.reserved ?? 0), e.toArray();
}
function _o(t) {
  return String.fromCharCode(...t).replace(/\0+$/g, "");
}
function wo(t, e) {
  const n = new Array(e).fill(0);
  for (let o = 0; o < e && o < t.length; o++) {
    const s = t.charCodeAt(o);
    n[o] = s >= 0 && s <= 127 ? s : 63;
  }
  return n;
}
const Os = 32, Ko = [
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
], rc = new Map(
  Ko.map((t, e) => [t, e])
);
function cd(t) {
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
    for (const y of p)
      y > g && (g = y);
    const d = g >= 258 ? g - 258 + 1 : 0, x = [];
    for (let y = 0; y < d; y++) {
      const w = e.uint8(), S = e.bytes(w);
      x.push(String.fromCharCode(...S));
    }
    const m = p.map((y) => y < 258 ? Ko[y] : x[y - 258]);
    return u.glyphNames = m, u;
  }
  if (n === 151552) {
    const h = e.uint16(), g = e.array("int8", h).map(
      (d, x) => Ko[x + d]
    );
    return u.glyphNames = g, u;
  }
  return u;
}
function ic(t) {
  const { version: e } = t;
  return e === 65536 || e === 196608 ? Mr(t) : e === 131072 ? fd(t) : e === 151552 ? ld(t) : Mr(t);
}
function Mr(t) {
  const e = new I(Os);
  return e.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), e.toArray();
}
function fd(t) {
  const { glyphNames: e } = t, n = e.length, o = [], s = [], r = /* @__PURE__ */ new Map();
  for (const f of e) {
    const l = rc.get(f);
    l !== void 0 ? o.push(l) : (r.has(f) || (r.set(f, s.length), s.push(f)), o.push(258 + r.get(f)));
  }
  let i = 0;
  for (const f of s)
    i += 1 + f.length;
  const a = Os + 2 + n * 2 + i, c = new I(a);
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
function ld(t) {
  const { glyphNames: e } = t, n = e.length, o = Os + 2 + n, s = new I(o);
  s.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), s.uint16(n);
  for (let r = 0; r < n; r++) {
    const i = e[r], c = rc.get(i) - r;
    s.int8(c);
  }
  return s.toArray();
}
function ud(t, e) {
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
function hd(t) {
  const e = t.version ?? 1, n = t.flags ?? 0, o = t.strikes ?? [], s = o.map((f) => f._raw ? f._raw : gd(f));
  let i = 8 + o.length * 4;
  const a = [];
  for (const f of s)
    a.push(i), i += f.length;
  const c = new I(i);
  c.uint16(e), c.uint16(n), c.uint32(o.length);
  for (const f of a)
    c.uint32(f);
  for (const f of s)
    c.rawBytes(f);
  return c.toArray();
}
function gd(t) {
  const e = t.glyphs ?? [], n = e.length, o = e.map((l) => {
    if (!l) return [];
    const u = l.imageData ?? [], h = new I(8 + u.length);
    return h.int16(l.originOffsetX ?? 0), h.int16(l.originOffsetY ?? 0), h.tag(l.graphicType ?? "png "), h.rawBytes(u), h.toArray();
  });
  let i = 4 + (n + 1) * 4;
  const a = [];
  for (const l of o)
    a.push(i), i += l.length;
  a.push(i);
  const c = i, f = new I(c);
  f.uint16(t.ppem ?? 0), f.uint16(t.ppi ?? 0);
  for (const l of a)
    f.uint32(l);
  for (const l of o)
    f.rawBytes(l);
  return f.toArray();
}
const pd = 18, ac = 20, ge = 8;
function dd(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = e.uint16(), r = e.uint16(), i = e.offset32(), a = e.uint16(), c = e.offset32();
  let f;
  o >= 1 && t.length >= ac && (f = e.uint16());
  const l = [];
  if (r > 0 && i > 0)
    for (let g = 0; g < r; g++) {
      e.seek(i + g * s);
      const d = {
        axisTag: e.tag(),
        axisNameID: e.uint16(),
        axisOrdering: e.uint16()
      };
      s > ge && (d._extra = e.bytes(s - ge)), l.push(d);
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
    h.push(md(t, x, m));
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
function md(t, e, n) {
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
function yd(t) {
  const e = t.majorVersion ?? 1;
  let n = t.minorVersion ?? 2;
  const o = t.designAxes ?? [], s = t.axisValues ?? [], r = t.designAxisSize ?? ge, i = o.reduce((b, A) => {
    const k = A._extra?.length ?? 0;
    return Math.max(b, ge + k);
  }, ge), a = Math.max(
    r,
    i
  ), c = n >= 1 || t.elidedFallbackNameID !== void 0;
  c && n === 0 && (n = 1);
  const f = c ? ac : pd, l = o.length, u = s.length, h = l > 0 ? f : 0, p = l * a, g = u > 0 ? f + p : 0, d = u * 2, x = s.map(
    (b) => xd(b)
  );
  let m = d;
  const y = x.map((b) => {
    const A = m;
    return m += b.length, A;
  }), w = x.reduce(
    (b, A) => b + A.length,
    0
  ), S = f + p + d + w, _ = new I(S);
  _.uint16(e), _.uint16(n), _.uint16(a), _.uint16(l), _.offset32(h), _.uint16(u), _.offset32(g), c && _.uint16(t.elidedFallbackNameID ?? 2);
  for (const b of o) {
    _.tag(b.axisTag), _.uint16(b.axisNameID ?? 0), _.uint16(b.axisOrdering ?? 0);
    const A = b._extra ?? [];
    _.rawBytes(A);
    const k = a - ge - A.length;
    k > 0 && _.rawBytes(new Array(k).fill(0));
  }
  for (const b of y)
    _.offset16(b);
  for (const b of x)
    _.rawBytes(b);
  return _.toArray();
}
function xd(t) {
  if (t._raw)
    return t._raw;
  switch (t.format) {
    case 1: {
      const e = new I(12);
      return e.uint16(1), e.uint16(t.axisIndex ?? 0), e.uint16(t.flags ?? 0), e.uint16(t.valueNameID ?? 0), e.fixed(t.value ?? 0), e.toArray();
    }
    case 2: {
      const e = new I(20);
      return e.uint16(2), e.uint16(t.axisIndex ?? 0), e.uint16(t.flags ?? 0), e.uint16(t.valueNameID ?? 0), e.fixed(t.nominalValue ?? 0), e.fixed(t.rangeMinValue ?? 0), e.fixed(t.rangeMaxValue ?? 0), e.toArray();
    }
    case 3: {
      const e = new I(16);
      return e.uint16(3), e.uint16(t.axisIndex ?? 0), e.uint16(t.flags ?? 0), e.uint16(t.valueNameID ?? 0), e.fixed(t.value ?? 0), e.fixed(t.linkedValue ?? 0), e.toArray();
    }
    case 4: {
      const e = t.axisValues ?? [], n = t.axisCount ?? e.length, o = new I(8 + n * 6);
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
function Sd(t) {
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
function _d(t) {
  const { version: e, documents: n, entries: o } = t, s = new TextEncoder(), r = n.map((g) => g.compressed ? g.data instanceof Uint8Array ? Array.from(g.data) : g.data : Array.from(s.encode(g.text))), a = 10, c = o.length;
  let l = 2 + c * 12;
  const u = [];
  for (let g = 0; g < r.length; g++) {
    const d = r[g];
    u.push({ offset: l, length: d.length }), l += d.length;
  }
  const h = a + l, p = new I(h);
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
const wd = 6, bd = 4, Ad = 2, cc = 6;
function Cd(t) {
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
  const a = [...new Set(i)].sort((u, h) => u - h), c = a.map((u) => vd(t, u)), f = new Map(
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
function Id(t) {
  const e = t.version ?? 0, n = t.ratios ?? [], o = t.groups ?? [], s = o.map((l) => Od(l)), r = t.numRecs ?? Math.max(0, ...o.map((l) => (l.entries ?? []).length)), i = n.length;
  let a = wd + i * bd + i * Ad;
  const c = s.map((l) => {
    const u = a;
    return a += l.length, u;
  }), f = new I(a);
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
function vd(t, e) {
  if (!e || e >= t.length)
    return { recs: 0, startsz: 0, endsz: 0, entries: [] };
  const n = new F(t, e), o = n.uint16(), s = n.uint8(), r = n.uint8(), i = [];
  for (let a = 0; a < o && !(n.position + cc > t.length); a++)
    i.push({
      yPelHeight: n.uint16(),
      yMax: n.int16(),
      yMin: n.int16()
    });
  return { recs: o, startsz: s, endsz: r, entries: i };
}
function Od(t) {
  const e = t.entries ?? [], n = t.recs ?? e.length, o = e.slice(0, n);
  for (; o.length < n; )
    o.push({ yPelHeight: 0, yMax: 0, yMin: 0 });
  const s = new I(4 + n * cc);
  s.uint16(n), s.uint8(t.startsz ?? 0), s.uint8(t.endsz ?? 0);
  for (const r of o)
    s.uint16(r.yPelHeight ?? 0), s.int16(r.yMax ?? 0), s.int16(r.yMin ?? 0);
  return s.toArray();
}
const kd = 36;
function Ed(t) {
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
function Td(t) {
  const e = new I(kd);
  return e.uint32(t.version), e.fword(t.vertTypoAscender), e.fword(t.vertTypoDescender), e.fword(t.vertTypoLineGap), e.ufword(t.advanceHeightMax), e.fword(t.minTopSideBearing), e.fword(t.minBottomSideBearing), e.fword(t.yMaxExtent), e.int16(t.caretSlopeRise), e.int16(t.caretSlopeRun), e.int16(t.caretOffset), e.int16(t.reserved1), e.int16(t.reserved2), e.int16(t.reserved3), e.int16(t.reserved4), e.int16(t.metricDataFormat), e.uint16(t.numOfLongVerMetrics), e.toArray();
}
function Dd(t, e) {
  const n = e.vhea.numOfLongVerMetrics, o = e.maxp.numGlyphs, s = new F(t), r = [];
  for (let c = 0; c < n; c++)
    r.push({
      advanceHeight: s.ufword(),
      topSideBearing: s.fword()
    });
  const i = o - n, a = s.array("fword", i);
  return { vMetrics: r, topSideBearings: a };
}
function Rd(t) {
  const { vMetrics: e, topSideBearings: n } = t, o = e.length * 4 + n.length * 2, s = new I(o);
  for (const r of e)
    s.ufword(r.advanceHeight), s.fword(r.topSideBearing);
  return s.array("fword", n), s.toArray();
}
const Fd = 24, fc = 15, lc = 48;
function Md(t) {
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
        uc(t.length, s, f)
      )
    ) : null,
    advanceHeightMapping: dn(
      t,
      r,
      f
    ),
    tsbMapping: dn(
      t,
      i,
      f
    ),
    bsbMapping: dn(
      t,
      a,
      f
    ),
    vOrgMapping: dn(
      t,
      c,
      f
    )
  };
}
function dn(t, e, n) {
  if (!e)
    return null;
  const o = uc(t.length, e, n);
  if (o <= e || e >= t.length)
    return { format: 0, entryFormat: 0, mapCount: 0, entries: [], _raw: [] };
  const s = Array.from(t.slice(e, o));
  return {
    ...Ld(s),
    _raw: s
  };
}
function uc(t, e, n) {
  return n.filter((s) => s > e).sort((s, r) => s - r)[0] ?? t;
}
function Ld(t) {
  const e = new F(t), n = e.uint8(), o = e.uint8(), s = n === 1 ? e.uint32() : e.uint16(), r = (o & fc) + 1, i = ((o & lc) >> 4) + 1, a = [];
  for (let c = 0; c < s; c++) {
    const f = Ud(e, i);
    a.push(Nd(f, r));
  }
  return {
    format: n,
    entryFormat: o,
    mapCount: s,
    entries: a
  };
}
function Bd(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.itemVariationStore ? ee(t.itemVariationStore) : [], s = mn(
    t.advanceHeightMapping
  ), r = mn(t.tsbMapping), i = mn(t.bsbMapping), a = mn(t.vOrgMapping);
  let c = Fd;
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
  const g = new I(c);
  return g.uint16(e), g.uint16(n), g.offset32(f), g.offset32(l), g.offset32(u), g.offset32(h), g.offset32(p), g.rawBytes(o), g.rawBytes(s), g.rawBytes(r), g.rawBytes(i), g.rawBytes(a), g.toArray();
}
function mn(t) {
  return t ? t._raw ? t._raw : Vd(t) : [];
}
function Vd(t) {
  const e = t.entries ?? [], n = t.mapCount ?? e.length, o = Gd(e), s = t.format ?? (n > 65535 ? 1 : 0), r = t.entryFormat ?? o.entryFormat, i = (r & fc) + 1, a = ((r & lc) >> 4) + 1, c = s === 1 ? 6 : 4, f = new I(c + n * a);
  f.uint8(s), f.uint8(r), s === 1 ? f.uint32(n) : f.uint16(n);
  for (let l = 0; l < n; l++) {
    const u = e[l] ?? { outerIndex: 0, innerIndex: 0 }, h = $d(u, i);
    zd(f, h, a);
  }
  return f.toArray();
}
function $d(t, e) {
  const n = (1 << e) - 1;
  return (t.outerIndex ?? 0) << e | (t.innerIndex ?? 0) & n;
}
function Nd(t, e) {
  const n = (1 << e) - 1;
  return {
    outerIndex: t >> e,
    innerIndex: t & n
  };
}
function Gd(t) {
  let e = 0, n = 0;
  for (const a of t)
    e = Math.max(e, a.innerIndex ?? 0), n = Math.max(n, a.outerIndex ?? 0);
  let o = 1;
  for (; (1 << o) - 1 < e && o < 16; )
    o++;
  const s = n << o | e;
  let r = 1;
  for (; r < 4 && s > Pd(r); )
    r++;
  return { entryFormat: r - 1 << 4 | o - 1 };
}
function Pd(t) {
  return t === 1 ? 255 : t === 2 ? 65535 : t === 3 ? 16777215 : 4294967295;
}
function Ud(t, e) {
  return e === 1 ? t.uint8() : e === 2 ? t.uint16() : e === 3 ? t.uint24() : t.uint32();
}
function zd(t, e, n) {
  n === 1 ? t.uint8(e) : n === 2 ? t.uint16(e) : n === 3 ? t.uint24(e) : t.uint32(e >>> 0);
}
const Kn = 32768, Jn = 4095, Qn = 32768, to = 16384, eo = 8192, Hd = 4095, hc = 128, Wd = 127, gc = 128, pc = 64, jd = 63;
function Mn(t) {
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
    const r = t.uint8(), i = (r & Wd) + 1, a = (r & hc) !== 0;
    for (let c = 0; c < i && o.length < n; c++) {
      const f = a ? t.uint16() : t.uint8();
      s += f, o.push(s);
    }
  }
  return o;
}
function Ln(t) {
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
    const f = (i ? hc : 0) | a - 1;
    n.push(f);
    for (let l = 0; l < a; l++) {
      const u = o[r + l];
      i ? n.push(u >> 8 & 255, u & 255) : n.push(u & 255);
    }
    r += a;
  }
  return n;
}
function dc(t, e) {
  const n = [];
  for (; n.length < e; ) {
    const o = t.uint8(), s = (o & jd) + 1;
    if (o & gc)
      for (let r = 0; r < s && n.length < e; r++)
        n.push(0);
    else if (o & pc)
      for (let r = 0; r < s && n.length < e; r++)
        n.push(t.int16());
    else
      for (let r = 0; r < s && n.length < e; r++)
        n.push(t.int8());
  }
  return n;
}
function mc(t) {
  const e = [];
  let n = 0;
  for (; n < t.length; )
    if (t[n] === 0) {
      let o = 1;
      const s = Math.min(64, t.length - n);
      for (; o < s && t[n + o] === 0; )
        o++;
      e.push(gc | o - 1), n += o;
    } else if (t[n] < -128 || t[n] > 127) {
      let o = 1;
      const s = Math.min(64, t.length - n);
      for (; o < s; ) {
        const r = t[n + o];
        if (r === 0 || r >= -128 && r <= 127) break;
        o++;
      }
      e.push(pc | o - 1);
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
function Yd(t, e, n, o) {
  if (!t || t.length === 0) return [];
  const s = new F(t), r = s.uint16(), i = s.offset16(), a = r & Jn, c = (r & Kn) !== 0;
  if (a === 0) return [];
  const f = [];
  for (let h = 0; h < a; h++) {
    const p = s.uint16(), g = s.uint16();
    let d;
    if (g & Qn)
      d = s.array("f2dot14", e);
    else {
      const y = g & Hd;
      d = n[y] ?? new Array(e).fill(0);
    }
    let x = null, m = null;
    g & to && (x = s.array("f2dot14", e), m = s.array("f2dot14", e)), f.push({
      variationDataSize: p,
      tupleIndex: g,
      peakTuple: d,
      intermediateStartTuple: x,
      intermediateEndTuple: m,
      hasPrivatePoints: (g & eo) !== 0
    });
  }
  s.seek(i);
  let l = null;
  c && (l = Mn(s));
  const u = [];
  for (const h of f) {
    const g = s.position + h.variationDataSize;
    let d;
    h.hasPrivatePoints ? d = Mn(s) : d = l;
    const x = d === null ? o : d.length, m = x * 2, y = dc(s, m);
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
function Zd(t, e) {
  if (!t || t.length === 0) return [];
  const n = t.length, s = t.every(
    (g) => JSON.stringify(g.pointIndices) === JSON.stringify(t[0].pointIndices)
  ) && n > 1, r = [];
  let i = [];
  s && (i = Ln(t[0].pointIndices), r.push(i));
  const a = [];
  for (const g of t) {
    const d = [];
    s || d.push(...Ln(g.pointIndices));
    const x = [...g.xDeltas ?? [], ...g.yDeltas ?? []];
    d.push(...mc(x)), a.push(d.length), r.push(d);
  }
  const c = [];
  for (const g of r)
    c.push(...g);
  const f = [];
  for (let g = 0; g < n; g++) {
    const d = t[g];
    let x = Qn;
    s || (x |= eo), d.intermediateStartTuple && (x |= to);
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
  const u = (s ? Kn : 0) | n & Jn, h = 4 + l.length, p = [];
  return p.push(u >> 8 & 255), p.push(u & 255), p.push(h >> 8 & 255), p.push(h & 255), p.push(...l), p.push(...c), p;
}
function Xd(t, e, n) {
  if (!t || t.length < 8)
    return { majorVersion: 1, minorVersion: 0, tupleVariations: [] };
  const o = new F(t), s = o.uint16(), r = o.uint16(), i = o.uint16(), a = o.offset16(), c = i & Jn, f = (i & Kn) !== 0;
  if (c === 0)
    return { majorVersion: s, minorVersion: r, tupleVariations: [] };
  const l = [];
  for (let p = 0; p < c; p++) {
    const g = o.uint16(), d = o.uint16();
    let x = null;
    d & Qn && (x = o.array("f2dot14", e));
    let m = null, y = null;
    d & to && (m = o.array("f2dot14", e), y = o.array("f2dot14", e)), l.push({
      variationDataSize: g,
      tupleIndex: d,
      peakTuple: x,
      intermediateStartTuple: m,
      intermediateEndTuple: y,
      hasPrivatePoints: (d & eo) !== 0
    });
  }
  o.seek(a);
  let u = null;
  f && (u = Mn(o));
  const h = [];
  for (const p of l) {
    const d = o.position + p.variationDataSize;
    let x;
    p.hasPrivatePoints ? x = Mn(o) : x = u;
    const m = x === null ? n : x.length, y = dc(o, m);
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
function qd(t, e) {
  const n = t.majorVersion ?? 1, o = t.minorVersion ?? 0, s = t.tupleVariations ?? [], r = s.length;
  if (r === 0) {
    const x = new I(8);
    return x.uint16(n), x.uint16(o), x.uint16(0), x.offset16(8), x.toArray();
  }
  const a = s.every(
    (x) => JSON.stringify(x.pointIndices) === JSON.stringify(s[0].pointIndices)
  ) && r > 1, c = [];
  a && c.push(
    Ln(s[0].pointIndices)
  );
  const f = [];
  for (const x of s) {
    const m = [];
    a || m.push(...Ln(x.pointIndices)), m.push(...mc(x.deltas ?? [])), f.push(m.length), c.push(m);
  }
  const l = [];
  for (const x of c)
    l.push(...x);
  const u = [];
  for (let x = 0; x < r; x++) {
    const m = s[x];
    let y = Qn;
    a || (y |= eo), m.intermediateStartTuple && (y |= to), u.push(f[x] >> 8 & 255), u.push(f[x] & 255), u.push(y >> 8 & 255), u.push(y & 255);
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
  const h = (a ? Kn : 0) | r & Jn, p = 8 + u.length, g = p + l.length, d = new I(g);
  return d.uint16(n), d.uint16(o), d.uint16(h), d.offset16(p), d.rawBytes(u), d.rawBytes(l), d.toArray();
}
function Kd(t, e = {}) {
  const n = e.fvar?.axes?.length ?? 0, o = e["cvt "]?.values?.length ?? 0;
  return Xd(t, n, o);
}
function Jd(t) {
  const e = t.tupleVariations?.[0]?.peakTuple?.length ?? 0;
  return qd(t, e);
}
function Qd(t) {
  const e = new F(t), n = t.length >>> 1;
  return { values: e.array("fword", n) };
}
function t1(t) {
  const e = t.values, n = new I(e.length * 2);
  return n.array("fword", e), n.toArray();
}
function e1(t) {
  return { instructions: Array.from(t) };
}
function n1(t) {
  return Array.from(t.instructions);
}
function o1(t) {
  const e = new F(t), n = e.uint16(), o = e.uint16(), s = [];
  for (let r = 0; r < o; r++)
    s.push({
      rangeMaxPPEM: e.uint16(),
      rangeGaspBehavior: e.uint16()
    });
  return { version: n, gaspRanges: s };
}
function s1(t) {
  const { version: e, gaspRanges: n } = t, o = new I(4 + n.length * 4);
  o.uint16(e), o.uint16(n.length);
  for (const s of n)
    o.uint16(s.rangeMaxPPEM), o.uint16(s.rangeGaspBehavior);
  return o.toArray();
}
const yc = 1, xc = 2, Sc = 4, _c = 8, Bn = 16, Vn = 32, wc = 64, Ye = 1, $n = 2, bc = 4, ks = 8, Jo = 32, Es = 64, Ts = 128, Ze = 256, Ac = 512, Cc = 1024, Ic = 2048, vc = 4096;
function r1(t, e) {
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
      i1(s, f, l, u, h, p)
    ) : r.push(a1(s, l, u, h, p));
  }
  return { glyphs: r };
}
function i1(t, e, n, o, s, r) {
  const i = t.array("uint16", e), a = e > 0 ? i[e - 1] + 1 : 0, c = t.uint16(), f = t.bytes(c), l = [];
  for (; l.length < a; ) {
    const y = t.uint8();
    if (l.push(y), y & _c) {
      const w = t.uint8();
      for (let S = 0; S < w; S++)
        l.push(y);
    }
  }
  const u = new Array(a);
  let h = 0;
  for (let y = 0; y < a; y++) {
    const w = l[y];
    if (w & xc) {
      const S = t.uint8();
      h += w & Bn ? S : -S;
    } else w & Bn || (h += t.int16());
    u[y] = h;
  }
  const p = new Array(a);
  let g = 0;
  for (let y = 0; y < a; y++) {
    const w = l[y];
    if (w & Sc) {
      const S = t.uint8();
      g += w & Vn ? S : -S;
    } else w & Vn || (g += t.int16());
    p[y] = g;
  }
  const d = a > 0 && (l[0] & wc) !== 0, x = [];
  let m = 0;
  for (let y = 0; y < e; y++) {
    const w = i[y], S = [];
    for (; m <= w; )
      S.push({
        x: u[m],
        y: p[m],
        onCurve: (l[m] & yc) !== 0
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
function a1(t, e, n, o, s) {
  const r = [];
  let i, a = !1;
  do {
    i = t.uint16();
    const f = t.uint16();
    let l, u;
    i & Ye ? i & $n ? (l = t.int16(), u = t.int16()) : (l = t.uint16(), u = t.uint16()) : i & $n ? (l = t.int8(), u = t.int8()) : (l = t.uint8(), u = t.uint8());
    const h = {
      glyphIndex: f,
      flags: c1(i),
      argument1: l,
      argument2: u
    };
    i & ks ? h.transform = { scale: t.f2dot14() } : i & Es ? h.transform = {
      xScale: t.f2dot14(),
      yScale: t.f2dot14()
    } : i & Ts && (h.transform = {
      xScale: t.f2dot14(),
      scale01: t.f2dot14(),
      scale10: t.f2dot14(),
      yScale: t.f2dot14()
    }), r.push(h), i & Ze && (a = !0);
  } while (i & Jo);
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
function c1(t) {
  const e = {};
  return t & Ye && (e.argsAreWords = !0), t & $n && (e.argsAreXYValues = !0), t & bc && (e.roundXYToGrid = !0), t & ks && (e.weHaveAScale = !0), t & Es && (e.weHaveAnXAndYScale = !0), t & Ts && (e.weHaveATwoByTwo = !0), t & Ze && (e.weHaveInstructions = !0), t & Ac && (e.useMyMetrics = !0), t & Cc && (e.overlapCompound = !0), t & Ic && (e.scaledComponentOffset = !0), t & vc && (e.unscaledComponentOffset = !0), e;
}
function Oc(t) {
  const { glyphs: e } = t, n = [];
  for (const r of e) {
    if (r === null) {
      n.push([]);
      continue;
    }
    r.type === "simple" ? n.push(l1(r)) : n.push(h1(r));
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
function f1(t) {
  return Oc(t).bytes;
}
function l1(t) {
  const { contours: e, instructions: n, xMin: o, yMin: s, xMax: r, yMax: i, overlapSimple: a } = t, c = e.length, f = [], l = [];
  for (const v of e) {
    for (const E of v)
      f.push(E);
    l.push(f.length - 1);
  }
  const u = f.length, h = f.map((v) => v.x), p = f.map((v) => v.y), g = new Array(u), d = new Array(u);
  for (let v = 0; v < u; v++)
    g[v] = v === 0 ? h[v] : h[v] - h[v - 1], d[v] = v === 0 ? p[v] : p[v] - p[v - 1];
  const x = [], m = [], y = [];
  for (let v = 0; v < u; v++) {
    let E = 0;
    f[v].onCurve && (E |= yc);
    const T = g[v], D = d[v];
    T === 0 ? E |= Bn : T >= -255 && T <= 255 ? (E |= xc, T > 0 ? (E |= Bn, m.push(T)) : m.push(-T)) : m.push(T >> 8 & 255, T & 255), D === 0 ? E |= Vn : D >= -255 && D <= 255 ? (E |= Sc, D > 0 ? (E |= Vn, y.push(D)) : y.push(-D)) : y.push(D >> 8 & 255, D & 255), v === 0 && a && (E |= wc), x.push(E);
  }
  const w = u1(x), S = 10, _ = c * 2, b = 2, A = n.length, k = S + _ + b + A + w.length + m.length + y.length, O = new I(k);
  return O.int16(c), O.int16(o), O.int16(s), O.int16(r), O.int16(i), O.array("uint16", l), O.uint16(n.length), O.rawBytes(n), O.rawBytes(w), O.rawBytes(m), O.rawBytes(y), O.toArray();
}
function u1(t) {
  const e = [];
  let n = 0;
  for (; n < t.length; ) {
    const o = t[n];
    let s = 0;
    for (; n + 1 + s < t.length && t[n + 1 + s] === o && s < 255; )
      s++;
    s > 0 ? (e.push(o | _c, s), n += 1 + s) : (e.push(o), n++);
  }
  return e;
}
function h1(t) {
  const { components: e, instructions: n, xMin: o, yMin: s, xMax: r, yMax: i } = t;
  let a = 10;
  for (let f = 0; f < e.length; f++) {
    const l = e[f];
    a += 4;
    const u = l.flags.argsAreWords || Lr(l.argument1, l.argument2, l.flags.argsAreXYValues);
    a += u ? 4 : 2, l.transform && ("scale" in l.transform ? a += 2 : "scale01" in l.transform ? a += 8 : "xScale" in l.transform && (a += 4));
  }
  n && n.length > 0 && (a += 2 + n.length);
  const c = new I(a);
  c.int16(-1), c.int16(o), c.int16(s), c.int16(r), c.int16(i);
  for (let f = 0; f < e.length; f++) {
    const l = e[f], u = f === e.length - 1;
    let h = g1(l.flags);
    const p = l.flags.argsAreWords || Lr(l.argument1, l.argument2, l.flags.argsAreXYValues);
    p ? h |= Ye : h &= ~Ye, u ? h &= ~Jo : h |= Jo, u && n && n.length > 0 ? h |= Ze : u && (h &= ~Ze), c.uint16(h), c.uint16(l.glyphIndex), p ? l.flags.argsAreXYValues ? (c.int16(l.argument1), c.int16(l.argument2)) : (c.uint16(l.argument1), c.uint16(l.argument2)) : l.flags.argsAreXYValues ? (c.int8(l.argument1), c.int8(l.argument2)) : (c.uint8(l.argument1), c.uint8(l.argument2)), l.transform && ("scale" in l.transform ? c.f2dot14(l.transform.scale) : "scale01" in l.transform ? (c.f2dot14(l.transform.xScale), c.f2dot14(l.transform.scale01), c.f2dot14(l.transform.scale10), c.f2dot14(l.transform.yScale)) : "xScale" in l.transform && (c.f2dot14(l.transform.xScale), c.f2dot14(l.transform.yScale)));
  }
  return n && n.length > 0 && (c.uint16(n.length), c.rawBytes(n)), c.toArray();
}
function Lr(t, e, n) {
  return n ? t < -128 || t > 127 || e < -128 || e > 127 : t > 255 || e > 255;
}
function g1(t) {
  let e = 0;
  return t.argsAreWords && (e |= Ye), t.argsAreXYValues && (e |= $n), t.roundXYToGrid && (e |= bc), t.weHaveAScale && (e |= ks), t.weHaveAnXAndYScale && (e |= Es), t.weHaveATwoByTwo && (e |= Ts), t.weHaveInstructions && (e |= Ze), t.useMyMetrics && (e |= Ac), t.overlapCompound && (e |= Cc), t.scaledComponentOffset && (e |= Ic), t.unscaledComponentOffset && (e |= vc), e;
}
const p1 = 20, Qo = 1;
function d1(t, e = {}) {
  const n = new F(t), o = n.uint16(), s = n.uint16(), r = n.uint16(), i = n.uint16(), a = n.offset32(), c = n.uint16(), f = n.uint16(), l = n.offset32(), u = (f & Qo) !== 0, h = c + 1, p = [];
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
    const S = l + m, _ = t.slice(S, S + w), b = m1(e, x);
    d.push(
      Yd(_, r, g, b)
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
function m1(t, e) {
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
function y1(t) {
  const e = t.majorVersion ?? 1, n = t.minorVersion ?? 0, o = t.axisCount ?? 0, s = t.glyphVariationData ?? [], r = s.length, i = s.map((_) => Array.isArray(_) && (_.length === 0 || typeof _[0] == "number") ? _ : Array.isArray(_) ? Zd(_, o) : []), a = t.sharedTuples ?? x1(s, o), c = a.length, f = c * o * 2, l = [0];
  let u = 0;
  for (const _ of i)
    u += _.length, l.push(u);
  const h = l.every(
    (_) => _ % 2 === 0 && _ / 2 <= 65535
  ), p = h ? 2 : 4, g = (r + 1) * p, d = p1 + g, x = d + f, m = x + u, y = t.flags ?? 0, w = h ? y & ~Qo : y | Qo, S = new I(m);
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
function x1(t, e) {
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
function S1(t, e) {
  const n = e.head.indexToLocFormat, s = e.maxp.numGlyphs + 1, r = new F(t), i = [];
  if (n === 0)
    for (let a = 0; a < s; a++)
      i.push(r.uint16() * 2);
  else
    for (let a = 0; a < s; a++)
      i.push(r.uint32());
  return { offsets: i };
}
function kc(t) {
  const { offsets: e } = t;
  if (e.every((s) => s % 2 === 0 && s / 2 <= 65535)) {
    const s = new I(e.length * 2);
    for (const r of e)
      s.uint16(r / 2);
    return s.toArray();
  }
  const o = new I(e.length * 4);
  for (const s of e)
    o.uint32(s);
  return o.toArray();
}
function _1(t) {
  return { instructions: Array.from(t) };
}
function w1(t) {
  return Array.from(t.instructions);
}
const b1 = 4, Br = 0, Vr = 1, A1 = 2;
function Ie(t) {
  let e = t.length;
  for (; --e >= 0; )
    t[e] = 0;
}
const C1 = 0, Ec = 1, I1 = 2, v1 = 3, O1 = 258, Ds = 29, cn = 256, Xe = cn + 1 + Ds, me = 30, Rs = 19, Tc = 2 * Xe + 1, Zt = 15, bo = 16, k1 = 7, Fs = 256, Dc = 16, Rc = 17, Fc = 18, ts = (
  /* extra bits for each length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0])
), En = (
  /* extra bits for each distance code */
  new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13])
), E1 = (
  /* extra bits for each bit length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7])
), Mc = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), T1 = 512, Ct = new Array((Xe + 2) * 2);
Ie(Ct);
const Ue = new Array(me * 2);
Ie(Ue);
const qe = new Array(T1);
Ie(qe);
const Ke = new Array(O1 - v1 + 1);
Ie(Ke);
const Ms = new Array(Ds);
Ie(Ms);
const Nn = new Array(me);
Ie(Nn);
function Ao(t, e, n, o, s) {
  this.static_tree = t, this.extra_bits = e, this.extra_base = n, this.elems = o, this.max_length = s, this.has_stree = t && t.length;
}
let Lc, Bc, Vc;
function Co(t, e) {
  this.dyn_tree = t, this.max_code = 0, this.stat_desc = e;
}
const $c = (t) => t < 256 ? qe[t] : qe[256 + (t >>> 7)], Je = (t, e) => {
  t.pending_buf[t.pending++] = e & 255, t.pending_buf[t.pending++] = e >>> 8 & 255;
}, et = (t, e, n) => {
  t.bi_valid > bo - n ? (t.bi_buf |= e << t.bi_valid & 65535, Je(t, t.bi_buf), t.bi_buf = e >> bo - t.bi_valid, t.bi_valid += n - bo) : (t.bi_buf |= e << t.bi_valid & 65535, t.bi_valid += n);
}, gt = (t, e, n) => {
  et(
    t,
    n[e * 2],
    n[e * 2 + 1]
    /*.Len*/
  );
}, Nc = (t, e) => {
  let n = 0;
  do
    n |= t & 1, t >>>= 1, n <<= 1;
  while (--e > 0);
  return n >>> 1;
}, D1 = (t) => {
  t.bi_valid === 16 ? (Je(t, t.bi_buf), t.bi_buf = 0, t.bi_valid = 0) : t.bi_valid >= 8 && (t.pending_buf[t.pending++] = t.bi_buf & 255, t.bi_buf >>= 8, t.bi_valid -= 8);
}, R1 = (t, e) => {
  const n = e.dyn_tree, o = e.max_code, s = e.stat_desc.static_tree, r = e.stat_desc.has_stree, i = e.stat_desc.extra_bits, a = e.stat_desc.extra_base, c = e.stat_desc.max_length;
  let f, l, u, h, p, g, d = 0;
  for (h = 0; h <= Zt; h++)
    t.bl_count[h] = 0;
  for (n[t.heap[t.heap_max] * 2 + 1] = 0, f = t.heap_max + 1; f < Tc; f++)
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
}, Gc = (t, e, n) => {
  const o = new Array(Zt + 1);
  let s = 0, r, i;
  for (r = 1; r <= Zt; r++)
    s = s + n[r - 1] << 1, o[r] = s;
  for (i = 0; i <= e; i++) {
    let a = t[i * 2 + 1];
    a !== 0 && (t[i * 2] = Nc(o[a]++, a));
  }
}, F1 = () => {
  let t, e, n, o, s;
  const r = new Array(Zt + 1);
  for (n = 0, o = 0; o < Ds - 1; o++)
    for (Ms[o] = n, t = 0; t < 1 << ts[o]; t++)
      Ke[n++] = o;
  for (Ke[n - 1] = o, s = 0, o = 0; o < 16; o++)
    for (Nn[o] = s, t = 0; t < 1 << En[o]; t++)
      qe[s++] = o;
  for (s >>= 7; o < me; o++)
    for (Nn[o] = s << 7, t = 0; t < 1 << En[o] - 7; t++)
      qe[256 + s++] = o;
  for (e = 0; e <= Zt; e++)
    r[e] = 0;
  for (t = 0; t <= 143; )
    Ct[t * 2 + 1] = 8, t++, r[8]++;
  for (; t <= 255; )
    Ct[t * 2 + 1] = 9, t++, r[9]++;
  for (; t <= 279; )
    Ct[t * 2 + 1] = 7, t++, r[7]++;
  for (; t <= 287; )
    Ct[t * 2 + 1] = 8, t++, r[8]++;
  for (Gc(Ct, Xe + 1, r), t = 0; t < me; t++)
    Ue[t * 2 + 1] = 5, Ue[t * 2] = Nc(t, 5);
  Lc = new Ao(Ct, ts, cn + 1, Xe, Zt), Bc = new Ao(Ue, En, 0, me, Zt), Vc = new Ao(new Array(0), E1, 0, Rs, k1);
}, Pc = (t) => {
  let e;
  for (e = 0; e < Xe; e++)
    t.dyn_ltree[e * 2] = 0;
  for (e = 0; e < me; e++)
    t.dyn_dtree[e * 2] = 0;
  for (e = 0; e < Rs; e++)
    t.bl_tree[e * 2] = 0;
  t.dyn_ltree[Fs * 2] = 1, t.opt_len = t.static_len = 0, t.sym_next = t.matches = 0;
}, Uc = (t) => {
  t.bi_valid > 8 ? Je(t, t.bi_buf) : t.bi_valid > 0 && (t.pending_buf[t.pending++] = t.bi_buf), t.bi_buf = 0, t.bi_valid = 0;
}, $r = (t, e, n, o) => {
  const s = e * 2, r = n * 2;
  return t[s] < t[r] || t[s] === t[r] && o[e] <= o[n];
}, Io = (t, e, n) => {
  const o = t.heap[n];
  let s = n << 1;
  for (; s <= t.heap_len && (s < t.heap_len && $r(e, t.heap[s + 1], t.heap[s], t.depth) && s++, !$r(e, o, t.heap[s], t.depth)); )
    t.heap[n] = t.heap[s], n = s, s <<= 1;
  t.heap[n] = o;
}, Nr = (t, e, n) => {
  let o, s, r = 0, i, a;
  if (t.sym_next !== 0)
    do
      o = t.pending_buf[t.sym_buf + r++] & 255, o += (t.pending_buf[t.sym_buf + r++] & 255) << 8, s = t.pending_buf[t.sym_buf + r++], o === 0 ? gt(t, s, e) : (i = Ke[s], gt(t, i + cn + 1, e), a = ts[i], a !== 0 && (s -= Ms[i], et(t, s, a)), o--, i = $c(o), gt(t, i, n), a = En[i], a !== 0 && (o -= Nn[i], et(t, o, a)));
    while (r < t.sym_next);
  gt(t, Fs, e);
}, es = (t, e) => {
  const n = e.dyn_tree, o = e.stat_desc.static_tree, s = e.stat_desc.has_stree, r = e.stat_desc.elems;
  let i, a, c = -1, f;
  for (t.heap_len = 0, t.heap_max = Tc, i = 0; i < r; i++)
    n[i * 2] !== 0 ? (t.heap[++t.heap_len] = c = i, t.depth[i] = 0) : n[i * 2 + 1] = 0;
  for (; t.heap_len < 2; )
    f = t.heap[++t.heap_len] = c < 2 ? ++c : 0, n[f * 2] = 1, t.depth[f] = 0, t.opt_len--, s && (t.static_len -= o[f * 2 + 1]);
  for (e.max_code = c, i = t.heap_len >> 1; i >= 1; i--)
    Io(t, n, i);
  f = r;
  do
    i = t.heap[
      1
      /*SMALLEST*/
    ], t.heap[
      1
      /*SMALLEST*/
    ] = t.heap[t.heap_len--], Io(
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
    ] = f++, Io(
      t,
      n,
      1
      /*SMALLEST*/
    );
  while (t.heap_len >= 2);
  t.heap[--t.heap_max] = t.heap[
    1
    /*SMALLEST*/
  ], R1(t, e), Gc(n, c, t.bl_count);
}, Gr = (t, e, n) => {
  let o, s = -1, r, i = e[1], a = 0, c = 7, f = 4;
  for (i === 0 && (c = 138, f = 3), e[(n + 1) * 2 + 1] = 65535, o = 0; o <= n; o++)
    r = i, i = e[(o + 1) * 2 + 1], !(++a < c && r === i) && (a < f ? t.bl_tree[r * 2] += a : r !== 0 ? (r !== s && t.bl_tree[r * 2]++, t.bl_tree[Dc * 2]++) : a <= 10 ? t.bl_tree[Rc * 2]++ : t.bl_tree[Fc * 2]++, a = 0, s = r, i === 0 ? (c = 138, f = 3) : r === i ? (c = 6, f = 3) : (c = 7, f = 4));
}, Pr = (t, e, n) => {
  let o, s = -1, r, i = e[1], a = 0, c = 7, f = 4;
  for (i === 0 && (c = 138, f = 3), o = 0; o <= n; o++)
    if (r = i, i = e[(o + 1) * 2 + 1], !(++a < c && r === i)) {
      if (a < f)
        do
          gt(t, r, t.bl_tree);
        while (--a !== 0);
      else r !== 0 ? (r !== s && (gt(t, r, t.bl_tree), a--), gt(t, Dc, t.bl_tree), et(t, a - 3, 2)) : a <= 10 ? (gt(t, Rc, t.bl_tree), et(t, a - 3, 3)) : (gt(t, Fc, t.bl_tree), et(t, a - 11, 7));
      a = 0, s = r, i === 0 ? (c = 138, f = 3) : r === i ? (c = 6, f = 3) : (c = 7, f = 4);
    }
}, M1 = (t) => {
  let e;
  for (Gr(t, t.dyn_ltree, t.l_desc.max_code), Gr(t, t.dyn_dtree, t.d_desc.max_code), es(t, t.bl_desc), e = Rs - 1; e >= 3 && t.bl_tree[Mc[e] * 2 + 1] === 0; e--)
    ;
  return t.opt_len += 3 * (e + 1) + 5 + 5 + 4, e;
}, L1 = (t, e, n, o) => {
  let s;
  for (et(t, e - 257, 5), et(t, n - 1, 5), et(t, o - 4, 4), s = 0; s < o; s++)
    et(t, t.bl_tree[Mc[s] * 2 + 1], 3);
  Pr(t, t.dyn_ltree, e - 1), Pr(t, t.dyn_dtree, n - 1);
}, B1 = (t) => {
  let e = 4093624447, n;
  for (n = 0; n <= 31; n++, e >>>= 1)
    if (e & 1 && t.dyn_ltree[n * 2] !== 0)
      return Br;
  if (t.dyn_ltree[18] !== 0 || t.dyn_ltree[20] !== 0 || t.dyn_ltree[26] !== 0)
    return Vr;
  for (n = 32; n < cn; n++)
    if (t.dyn_ltree[n * 2] !== 0)
      return Vr;
  return Br;
};
let Ur = !1;
const V1 = (t) => {
  Ur || (F1(), Ur = !0), t.l_desc = new Co(t.dyn_ltree, Lc), t.d_desc = new Co(t.dyn_dtree, Bc), t.bl_desc = new Co(t.bl_tree, Vc), t.bi_buf = 0, t.bi_valid = 0, Pc(t);
}, zc = (t, e, n, o) => {
  et(t, (C1 << 1) + (o ? 1 : 0), 3), Uc(t), Je(t, n), Je(t, ~n), n && t.pending_buf.set(t.window.subarray(e, e + n), t.pending), t.pending += n;
}, $1 = (t) => {
  et(t, Ec << 1, 3), gt(t, Fs, Ct), D1(t);
}, N1 = (t, e, n, o) => {
  let s, r, i = 0;
  t.level > 0 ? (t.strm.data_type === A1 && (t.strm.data_type = B1(t)), es(t, t.l_desc), es(t, t.d_desc), i = M1(t), s = t.opt_len + 3 + 7 >>> 3, r = t.static_len + 3 + 7 >>> 3, r <= s && (s = r)) : s = r = n + 5, n + 4 <= s && e !== -1 ? zc(t, e, n, o) : t.strategy === b1 || r === s ? (et(t, (Ec << 1) + (o ? 1 : 0), 3), Nr(t, Ct, Ue)) : (et(t, (I1 << 1) + (o ? 1 : 0), 3), L1(t, t.l_desc.max_code + 1, t.d_desc.max_code + 1, i + 1), Nr(t, t.dyn_ltree, t.dyn_dtree)), Pc(t), o && Uc(t);
}, G1 = (t, e, n) => (t.pending_buf[t.sym_buf + t.sym_next++] = e, t.pending_buf[t.sym_buf + t.sym_next++] = e >> 8, t.pending_buf[t.sym_buf + t.sym_next++] = n, e === 0 ? t.dyn_ltree[n * 2]++ : (t.matches++, e--, t.dyn_ltree[(Ke[n] + cn + 1) * 2]++, t.dyn_dtree[$c(e) * 2]++), t.sym_next === t.sym_end);
var P1 = V1, U1 = zc, z1 = N1, H1 = G1, W1 = $1, j1 = {
  _tr_init: P1,
  _tr_stored_block: U1,
  _tr_flush_block: z1,
  _tr_tally: H1,
  _tr_align: W1
};
const Y1 = (t, e, n, o) => {
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
var Qe = Y1;
const Z1 = () => {
  let t, e = [];
  for (var n = 0; n < 256; n++) {
    t = n;
    for (var o = 0; o < 8; o++)
      t = t & 1 ? 3988292384 ^ t >>> 1 : t >>> 1;
    e[n] = t;
  }
  return e;
}, X1 = new Uint32Array(Z1()), q1 = (t, e, n, o) => {
  const s = X1, r = o + n;
  t ^= -1;
  for (let i = o; i < r; i++)
    t = t >>> 8 ^ s[(t ^ e[i]) & 255];
  return t ^ -1;
};
var j = q1, Jt = {
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
}, no = {
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
const { _tr_init: K1, _tr_stored_block: ns, _tr_flush_block: J1, _tr_tally: $t, _tr_align: Q1 } = j1, {
  Z_NO_FLUSH: Nt,
  Z_PARTIAL_FLUSH: tm,
  Z_FULL_FLUSH: em,
  Z_FINISH: ct,
  Z_BLOCK: zr,
  Z_OK: Z,
  Z_STREAM_END: Hr,
  Z_STREAM_ERROR: dt,
  Z_DATA_ERROR: nm,
  Z_BUF_ERROR: vo,
  Z_DEFAULT_COMPRESSION: om,
  Z_FILTERED: sm,
  Z_HUFFMAN_ONLY: yn,
  Z_RLE: rm,
  Z_FIXED: im,
  Z_DEFAULT_STRATEGY: am,
  Z_UNKNOWN: cm,
  Z_DEFLATED: oo
} = no, fm = 9, lm = 15, um = 8, hm = 29, gm = 256, os = gm + 1 + hm, pm = 30, dm = 19, mm = 2 * os + 1, ym = 15, B = 3, Lt = 258, mt = Lt + B + 1, xm = 32, Ae = 42, Ls = 57, ss = 69, rs = 73, is = 91, as = 103, Xt = 113, $e = 666, Q = 1, ve = 2, Qt = 3, Oe = 4, Sm = 3, qt = (t, e) => (t.msg = Jt[e], e), Wr = (t) => t * 2 - (t > 4 ? 9 : 0), Dt = (t) => {
  let e = t.length;
  for (; --e >= 0; )
    t[e] = 0;
}, _m = (t) => {
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
let wm = (t, e, n) => (e << t.hash_shift ^ n) & t.hash_mask, Gt = wm;
const ot = (t) => {
  const e = t.state;
  let n = e.pending;
  n > t.avail_out && (n = t.avail_out), n !== 0 && (t.output.set(e.pending_buf.subarray(e.pending_out, e.pending_out + n), t.next_out), t.next_out += n, e.pending_out += n, t.total_out += n, t.avail_out -= n, e.pending -= n, e.pending === 0 && (e.pending_out = 0));
}, rt = (t, e) => {
  J1(t, t.block_start >= 0 ? t.block_start : -1, t.strstart - t.block_start, e), t.block_start = t.strstart, ot(t.strm);
}, V = (t, e) => {
  t.pending_buf[t.pending++] = e;
}, Re = (t, e) => {
  t.pending_buf[t.pending++] = e >>> 8 & 255, t.pending_buf[t.pending++] = e & 255;
}, cs = (t, e, n, o) => {
  let s = t.avail_in;
  return s > o && (s = o), s === 0 ? 0 : (t.avail_in -= s, e.set(t.input.subarray(t.next_in, t.next_in + s), n), t.state.wrap === 1 ? t.adler = Qe(t.adler, e, s, n) : t.state.wrap === 2 && (t.adler = j(t.adler, e, s, n)), t.next_in += s, t.total_in += s, s);
}, Hc = (t, e) => {
  let n = t.max_chain_length, o = t.strstart, s, r, i = t.prev_length, a = t.nice_match;
  const c = t.strstart > t.w_size - mt ? t.strstart - (t.w_size - mt) : 0, f = t.window, l = t.w_mask, u = t.prev, h = t.strstart + Lt;
  let p = f[o + i - 1], g = f[o + i];
  t.prev_length >= t.good_match && (n >>= 2), a > t.lookahead && (a = t.lookahead);
  do
    if (s = e, !(f[s + i] !== g || f[s + i - 1] !== p || f[s] !== f[o] || f[++s] !== f[o + 1])) {
      o += 2, s++;
      do
        ;
      while (f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && o < h);
      if (r = Lt - (h - o), o = h - Lt, r > i) {
        if (t.match_start = e, i = r, r >= a)
          break;
        p = f[o + i - 1], g = f[o + i];
      }
    }
  while ((e = u[e & l]) > c && --n !== 0);
  return i <= t.lookahead ? i : t.lookahead;
}, Ce = (t) => {
  const e = t.w_size;
  let n, o, s;
  do {
    if (o = t.window_size - t.lookahead - t.strstart, t.strstart >= e + (e - mt) && (t.window.set(t.window.subarray(e, e + e - o), 0), t.match_start -= e, t.strstart -= e, t.block_start -= e, t.insert > t.strstart && (t.insert = t.strstart), _m(t), o += e), t.strm.avail_in === 0)
      break;
    if (n = cs(t.strm, t.window, t.strstart + t.lookahead, o), t.lookahead += n, t.lookahead + t.insert >= B)
      for (s = t.strstart - t.insert, t.ins_h = t.window[s], t.ins_h = Gt(t, t.ins_h, t.window[s + 1]); t.insert && (t.ins_h = Gt(t, t.ins_h, t.window[s + B - 1]), t.prev[s & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = s, s++, t.insert--, !(t.lookahead + t.insert < B)); )
        ;
  } while (t.lookahead < mt && t.strm.avail_in !== 0);
}, Wc = (t, e) => {
  let n = t.pending_buf_size - 5 > t.w_size ? t.w_size : t.pending_buf_size - 5, o, s, r, i = 0, a = t.strm.avail_in;
  do {
    if (o = 65535, r = t.bi_valid + 42 >> 3, t.strm.avail_out < r || (r = t.strm.avail_out - r, s = t.strstart - t.block_start, o > s + t.strm.avail_in && (o = s + t.strm.avail_in), o > r && (o = r), o < n && (o === 0 && e !== ct || e === Nt || o !== s + t.strm.avail_in)))
      break;
    i = e === ct && o === s + t.strm.avail_in ? 1 : 0, ns(t, 0, 0, i), t.pending_buf[t.pending - 4] = o, t.pending_buf[t.pending - 3] = o >> 8, t.pending_buf[t.pending - 2] = ~o, t.pending_buf[t.pending - 1] = ~o >> 8, ot(t.strm), s && (s > o && (s = o), t.strm.output.set(t.window.subarray(t.block_start, t.block_start + s), t.strm.next_out), t.strm.next_out += s, t.strm.avail_out -= s, t.strm.total_out += s, t.block_start += s, o -= s), o && (cs(t.strm, t.strm.output, t.strm.next_out, o), t.strm.next_out += o, t.strm.avail_out -= o, t.strm.total_out += o);
  } while (i === 0);
  return a -= t.strm.avail_in, a && (a >= t.w_size ? (t.matches = 2, t.window.set(t.strm.input.subarray(t.strm.next_in - t.w_size, t.strm.next_in), 0), t.strstart = t.w_size, t.insert = t.strstart) : (t.window_size - t.strstart <= a && (t.strstart -= t.w_size, t.window.set(t.window.subarray(t.w_size, t.w_size + t.strstart), 0), t.matches < 2 && t.matches++, t.insert > t.strstart && (t.insert = t.strstart)), t.window.set(t.strm.input.subarray(t.strm.next_in - a, t.strm.next_in), t.strstart), t.strstart += a, t.insert += a > t.w_size - t.insert ? t.w_size - t.insert : a), t.block_start = t.strstart), t.high_water < t.strstart && (t.high_water = t.strstart), i ? Oe : e !== Nt && e !== ct && t.strm.avail_in === 0 && t.strstart === t.block_start ? ve : (r = t.window_size - t.strstart, t.strm.avail_in > r && t.block_start >= t.w_size && (t.block_start -= t.w_size, t.strstart -= t.w_size, t.window.set(t.window.subarray(t.w_size, t.w_size + t.strstart), 0), t.matches < 2 && t.matches++, r += t.w_size, t.insert > t.strstart && (t.insert = t.strstart)), r > t.strm.avail_in && (r = t.strm.avail_in), r && (cs(t.strm, t.window, t.strstart, r), t.strstart += r, t.insert += r > t.w_size - t.insert ? t.w_size - t.insert : r), t.high_water < t.strstart && (t.high_water = t.strstart), r = t.bi_valid + 42 >> 3, r = t.pending_buf_size - r > 65535 ? 65535 : t.pending_buf_size - r, n = r > t.w_size ? t.w_size : r, s = t.strstart - t.block_start, (s >= n || (s || e === ct) && e !== Nt && t.strm.avail_in === 0 && s <= r) && (o = s > r ? r : s, i = e === ct && t.strm.avail_in === 0 && o === s ? 1 : 0, ns(t, t.block_start, o, i), t.block_start += o, ot(t.strm)), i ? Qt : Q);
}, Oo = (t, e) => {
  let n, o;
  for (; ; ) {
    if (t.lookahead < mt) {
      if (Ce(t), t.lookahead < mt && e === Nt)
        return Q;
      if (t.lookahead === 0)
        break;
    }
    if (n = 0, t.lookahead >= B && (t.ins_h = Gt(t, t.ins_h, t.window[t.strstart + B - 1]), n = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), n !== 0 && t.strstart - n <= t.w_size - mt && (t.match_length = Hc(t, n)), t.match_length >= B)
      if (o = $t(t, t.strstart - t.match_start, t.match_length - B), t.lookahead -= t.match_length, t.match_length <= t.max_lazy_match && t.lookahead >= B) {
        t.match_length--;
        do
          t.strstart++, t.ins_h = Gt(t, t.ins_h, t.window[t.strstart + B - 1]), n = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart;
        while (--t.match_length !== 0);
        t.strstart++;
      } else
        t.strstart += t.match_length, t.match_length = 0, t.ins_h = t.window[t.strstart], t.ins_h = Gt(t, t.ins_h, t.window[t.strstart + 1]);
    else
      o = $t(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++;
    if (o && (rt(t, !1), t.strm.avail_out === 0))
      return Q;
  }
  return t.insert = t.strstart < B - 1 ? t.strstart : B - 1, e === ct ? (rt(t, !0), t.strm.avail_out === 0 ? Qt : Oe) : t.sym_next && (rt(t, !1), t.strm.avail_out === 0) ? Q : ve;
}, ie = (t, e) => {
  let n, o, s;
  for (; ; ) {
    if (t.lookahead < mt) {
      if (Ce(t), t.lookahead < mt && e === Nt)
        return Q;
      if (t.lookahead === 0)
        break;
    }
    if (n = 0, t.lookahead >= B && (t.ins_h = Gt(t, t.ins_h, t.window[t.strstart + B - 1]), n = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), t.prev_length = t.match_length, t.prev_match = t.match_start, t.match_length = B - 1, n !== 0 && t.prev_length < t.max_lazy_match && t.strstart - n <= t.w_size - mt && (t.match_length = Hc(t, n), t.match_length <= 5 && (t.strategy === sm || t.match_length === B && t.strstart - t.match_start > 4096) && (t.match_length = B - 1)), t.prev_length >= B && t.match_length <= t.prev_length) {
      s = t.strstart + t.lookahead - B, o = $t(t, t.strstart - 1 - t.prev_match, t.prev_length - B), t.lookahead -= t.prev_length - 1, t.prev_length -= 2;
      do
        ++t.strstart <= s && (t.ins_h = Gt(t, t.ins_h, t.window[t.strstart + B - 1]), n = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart);
      while (--t.prev_length !== 0);
      if (t.match_available = 0, t.match_length = B - 1, t.strstart++, o && (rt(t, !1), t.strm.avail_out === 0))
        return Q;
    } else if (t.match_available) {
      if (o = $t(t, 0, t.window[t.strstart - 1]), o && rt(t, !1), t.strstart++, t.lookahead--, t.strm.avail_out === 0)
        return Q;
    } else
      t.match_available = 1, t.strstart++, t.lookahead--;
  }
  return t.match_available && (o = $t(t, 0, t.window[t.strstart - 1]), t.match_available = 0), t.insert = t.strstart < B - 1 ? t.strstart : B - 1, e === ct ? (rt(t, !0), t.strm.avail_out === 0 ? Qt : Oe) : t.sym_next && (rt(t, !1), t.strm.avail_out === 0) ? Q : ve;
}, bm = (t, e) => {
  let n, o, s, r;
  const i = t.window;
  for (; ; ) {
    if (t.lookahead <= Lt) {
      if (Ce(t), t.lookahead <= Lt && e === Nt)
        return Q;
      if (t.lookahead === 0)
        break;
    }
    if (t.match_length = 0, t.lookahead >= B && t.strstart > 0 && (s = t.strstart - 1, o = i[s], o === i[++s] && o === i[++s] && o === i[++s])) {
      r = t.strstart + Lt;
      do
        ;
      while (o === i[++s] && o === i[++s] && o === i[++s] && o === i[++s] && o === i[++s] && o === i[++s] && o === i[++s] && o === i[++s] && s < r);
      t.match_length = Lt - (r - s), t.match_length > t.lookahead && (t.match_length = t.lookahead);
    }
    if (t.match_length >= B ? (n = $t(t, 1, t.match_length - B), t.lookahead -= t.match_length, t.strstart += t.match_length, t.match_length = 0) : (n = $t(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++), n && (rt(t, !1), t.strm.avail_out === 0))
      return Q;
  }
  return t.insert = 0, e === ct ? (rt(t, !0), t.strm.avail_out === 0 ? Qt : Oe) : t.sym_next && (rt(t, !1), t.strm.avail_out === 0) ? Q : ve;
}, Am = (t, e) => {
  let n;
  for (; ; ) {
    if (t.lookahead === 0 && (Ce(t), t.lookahead === 0)) {
      if (e === Nt)
        return Q;
      break;
    }
    if (t.match_length = 0, n = $t(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++, n && (rt(t, !1), t.strm.avail_out === 0))
      return Q;
  }
  return t.insert = 0, e === ct ? (rt(t, !0), t.strm.avail_out === 0 ? Qt : Oe) : t.sym_next && (rt(t, !1), t.strm.avail_out === 0) ? Q : ve;
};
function ut(t, e, n, o, s) {
  this.good_length = t, this.max_lazy = e, this.nice_length = n, this.max_chain = o, this.func = s;
}
const Ne = [
  /*      good lazy nice chain */
  new ut(0, 0, 0, 0, Wc),
  /* 0 store only */
  new ut(4, 4, 8, 4, Oo),
  /* 1 max speed, no lazy matches */
  new ut(4, 5, 16, 8, Oo),
  /* 2 */
  new ut(4, 6, 32, 32, Oo),
  /* 3 */
  new ut(4, 4, 16, 16, ie),
  /* 4 lazy matches */
  new ut(8, 16, 32, 32, ie),
  /* 5 */
  new ut(8, 16, 128, 128, ie),
  /* 6 */
  new ut(8, 32, 128, 256, ie),
  /* 7 */
  new ut(32, 128, 258, 1024, ie),
  /* 8 */
  new ut(32, 258, 258, 4096, ie)
  /* 9 max compression */
], Cm = (t) => {
  t.window_size = 2 * t.w_size, Dt(t.head), t.max_lazy_match = Ne[t.level].max_lazy, t.good_match = Ne[t.level].good_length, t.nice_match = Ne[t.level].nice_length, t.max_chain_length = Ne[t.level].max_chain, t.strstart = 0, t.block_start = 0, t.lookahead = 0, t.insert = 0, t.match_length = t.prev_length = B - 1, t.match_available = 0, t.ins_h = 0;
};
function Im() {
  this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = oo, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new Uint16Array(mm * 2), this.dyn_dtree = new Uint16Array((2 * pm + 1) * 2), this.bl_tree = new Uint16Array((2 * dm + 1) * 2), Dt(this.dyn_ltree), Dt(this.dyn_dtree), Dt(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new Uint16Array(ym + 1), this.heap = new Uint16Array(2 * os + 1), Dt(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new Uint16Array(2 * os + 1), Dt(this.depth), this.sym_buf = 0, this.lit_bufsize = 0, this.sym_next = 0, this.sym_end = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
}
const fn = (t) => {
  if (!t)
    return 1;
  const e = t.state;
  return !e || e.strm !== t || e.status !== Ae && //#ifdef GZIP
  e.status !== Ls && //#endif
  e.status !== ss && e.status !== rs && e.status !== is && e.status !== as && e.status !== Xt && e.status !== $e ? 1 : 0;
}, jc = (t) => {
  if (fn(t))
    return qt(t, dt);
  t.total_in = t.total_out = 0, t.data_type = cm;
  const e = t.state;
  return e.pending = 0, e.pending_out = 0, e.wrap < 0 && (e.wrap = -e.wrap), e.status = //#ifdef GZIP
  e.wrap === 2 ? Ls : (
    //#endif
    e.wrap ? Ae : Xt
  ), t.adler = e.wrap === 2 ? 0 : 1, e.last_flush = -2, K1(e), Z;
}, Yc = (t) => {
  const e = jc(t);
  return e === Z && Cm(t.state), e;
}, vm = (t, e) => fn(t) || t.state.wrap !== 2 ? dt : (t.state.gzhead = e, Z), Zc = (t, e, n, o, s, r) => {
  if (!t)
    return dt;
  let i = 1;
  if (e === om && (e = 6), o < 0 ? (i = 0, o = -o) : o > 15 && (i = 2, o -= 16), s < 1 || s > fm || n !== oo || o < 8 || o > 15 || e < 0 || e > 9 || r < 0 || r > im || o === 8 && i !== 1)
    return qt(t, dt);
  o === 8 && (o = 9);
  const a = new Im();
  return t.state = a, a.strm = t, a.status = Ae, a.wrap = i, a.gzhead = null, a.w_bits = o, a.w_size = 1 << a.w_bits, a.w_mask = a.w_size - 1, a.hash_bits = s + 7, a.hash_size = 1 << a.hash_bits, a.hash_mask = a.hash_size - 1, a.hash_shift = ~~((a.hash_bits + B - 1) / B), a.window = new Uint8Array(a.w_size * 2), a.head = new Uint16Array(a.hash_size), a.prev = new Uint16Array(a.w_size), a.lit_bufsize = 1 << s + 6, a.pending_buf_size = a.lit_bufsize * 4, a.pending_buf = new Uint8Array(a.pending_buf_size), a.sym_buf = a.lit_bufsize, a.sym_end = (a.lit_bufsize - 1) * 3, a.level = e, a.strategy = r, a.method = n, Yc(t);
}, Om = (t, e) => Zc(t, e, oo, lm, um, am), km = (t, e) => {
  if (fn(t) || e > zr || e < 0)
    return t ? qt(t, dt) : dt;
  const n = t.state;
  if (!t.output || t.avail_in !== 0 && !t.input || n.status === $e && e !== ct)
    return qt(t, t.avail_out === 0 ? vo : dt);
  const o = n.last_flush;
  if (n.last_flush = e, n.pending !== 0) {
    if (ot(t), t.avail_out === 0)
      return n.last_flush = -1, Z;
  } else if (t.avail_in === 0 && Wr(e) <= Wr(o) && e !== ct)
    return qt(t, vo);
  if (n.status === $e && t.avail_in !== 0)
    return qt(t, vo);
  if (n.status === Ae && n.wrap === 0 && (n.status = Xt), n.status === Ae) {
    let s = oo + (n.w_bits - 8 << 4) << 8, r = -1;
    if (n.strategy >= yn || n.level < 2 ? r = 0 : n.level < 6 ? r = 1 : n.level === 6 ? r = 2 : r = 3, s |= r << 6, n.strstart !== 0 && (s |= xm), s += 31 - s % 31, Re(n, s), n.strstart !== 0 && (Re(n, t.adler >>> 16), Re(n, t.adler & 65535)), t.adler = 1, n.status = Xt, ot(t), n.pending !== 0)
      return n.last_flush = -1, Z;
  }
  if (n.status === Ls) {
    if (t.adler = 0, V(n, 31), V(n, 139), V(n, 8), n.gzhead)
      V(
        n,
        (n.gzhead.text ? 1 : 0) + (n.gzhead.hcrc ? 2 : 0) + (n.gzhead.extra ? 4 : 0) + (n.gzhead.name ? 8 : 0) + (n.gzhead.comment ? 16 : 0)
      ), V(n, n.gzhead.time & 255), V(n, n.gzhead.time >> 8 & 255), V(n, n.gzhead.time >> 16 & 255), V(n, n.gzhead.time >> 24 & 255), V(n, n.level === 9 ? 2 : n.strategy >= yn || n.level < 2 ? 4 : 0), V(n, n.gzhead.os & 255), n.gzhead.extra && n.gzhead.extra.length && (V(n, n.gzhead.extra.length & 255), V(n, n.gzhead.extra.length >> 8 & 255)), n.gzhead.hcrc && (t.adler = j(t.adler, n.pending_buf, n.pending, 0)), n.gzindex = 0, n.status = ss;
    else if (V(n, 0), V(n, 0), V(n, 0), V(n, 0), V(n, 0), V(n, n.level === 9 ? 2 : n.strategy >= yn || n.level < 2 ? 4 : 0), V(n, Sm), n.status = Xt, ot(t), n.pending !== 0)
      return n.last_flush = -1, Z;
  }
  if (n.status === ss) {
    if (n.gzhead.extra) {
      let s = n.pending, r = (n.gzhead.extra.length & 65535) - n.gzindex;
      for (; n.pending + r > n.pending_buf_size; ) {
        let a = n.pending_buf_size - n.pending;
        if (n.pending_buf.set(n.gzhead.extra.subarray(n.gzindex, n.gzindex + a), n.pending), n.pending = n.pending_buf_size, n.gzhead.hcrc && n.pending > s && (t.adler = j(t.adler, n.pending_buf, n.pending - s, s)), n.gzindex += a, ot(t), n.pending !== 0)
          return n.last_flush = -1, Z;
        s = 0, r -= a;
      }
      let i = new Uint8Array(n.gzhead.extra);
      n.pending_buf.set(i.subarray(n.gzindex, n.gzindex + r), n.pending), n.pending += r, n.gzhead.hcrc && n.pending > s && (t.adler = j(t.adler, n.pending_buf, n.pending - s, s)), n.gzindex = 0;
    }
    n.status = rs;
  }
  if (n.status === rs) {
    if (n.gzhead.name) {
      let s = n.pending, r;
      do {
        if (n.pending === n.pending_buf_size) {
          if (n.gzhead.hcrc && n.pending > s && (t.adler = j(t.adler, n.pending_buf, n.pending - s, s)), ot(t), n.pending !== 0)
            return n.last_flush = -1, Z;
          s = 0;
        }
        n.gzindex < n.gzhead.name.length ? r = n.gzhead.name.charCodeAt(n.gzindex++) & 255 : r = 0, V(n, r);
      } while (r !== 0);
      n.gzhead.hcrc && n.pending > s && (t.adler = j(t.adler, n.pending_buf, n.pending - s, s)), n.gzindex = 0;
    }
    n.status = is;
  }
  if (n.status === is) {
    if (n.gzhead.comment) {
      let s = n.pending, r;
      do {
        if (n.pending === n.pending_buf_size) {
          if (n.gzhead.hcrc && n.pending > s && (t.adler = j(t.adler, n.pending_buf, n.pending - s, s)), ot(t), n.pending !== 0)
            return n.last_flush = -1, Z;
          s = 0;
        }
        n.gzindex < n.gzhead.comment.length ? r = n.gzhead.comment.charCodeAt(n.gzindex++) & 255 : r = 0, V(n, r);
      } while (r !== 0);
      n.gzhead.hcrc && n.pending > s && (t.adler = j(t.adler, n.pending_buf, n.pending - s, s));
    }
    n.status = as;
  }
  if (n.status === as) {
    if (n.gzhead.hcrc) {
      if (n.pending + 2 > n.pending_buf_size && (ot(t), n.pending !== 0))
        return n.last_flush = -1, Z;
      V(n, t.adler & 255), V(n, t.adler >> 8 & 255), t.adler = 0;
    }
    if (n.status = Xt, ot(t), n.pending !== 0)
      return n.last_flush = -1, Z;
  }
  if (t.avail_in !== 0 || n.lookahead !== 0 || e !== Nt && n.status !== $e) {
    let s = n.level === 0 ? Wc(n, e) : n.strategy === yn ? Am(n, e) : n.strategy === rm ? bm(n, e) : Ne[n.level].func(n, e);
    if ((s === Qt || s === Oe) && (n.status = $e), s === Q || s === Qt)
      return t.avail_out === 0 && (n.last_flush = -1), Z;
    if (s === ve && (e === tm ? Q1(n) : e !== zr && (ns(n, 0, 0, !1), e === em && (Dt(n.head), n.lookahead === 0 && (n.strstart = 0, n.block_start = 0, n.insert = 0))), ot(t), t.avail_out === 0))
      return n.last_flush = -1, Z;
  }
  return e !== ct ? Z : n.wrap <= 0 ? Hr : (n.wrap === 2 ? (V(n, t.adler & 255), V(n, t.adler >> 8 & 255), V(n, t.adler >> 16 & 255), V(n, t.adler >> 24 & 255), V(n, t.total_in & 255), V(n, t.total_in >> 8 & 255), V(n, t.total_in >> 16 & 255), V(n, t.total_in >> 24 & 255)) : (Re(n, t.adler >>> 16), Re(n, t.adler & 65535)), ot(t), n.wrap > 0 && (n.wrap = -n.wrap), n.pending !== 0 ? Z : Hr);
}, Em = (t) => {
  if (fn(t))
    return dt;
  const e = t.state.status;
  return t.state = null, e === Xt ? qt(t, nm) : Z;
}, Tm = (t, e) => {
  let n = e.length;
  if (fn(t))
    return dt;
  const o = t.state, s = o.wrap;
  if (s === 2 || s === 1 && o.status !== Ae || o.lookahead)
    return dt;
  if (s === 1 && (t.adler = Qe(t.adler, e, n, 0)), o.wrap = 0, n >= o.w_size) {
    s === 0 && (Dt(o.head), o.strstart = 0, o.block_start = 0, o.insert = 0);
    let c = new Uint8Array(o.w_size);
    c.set(e.subarray(n - o.w_size, n), 0), e = c, n = o.w_size;
  }
  const r = t.avail_in, i = t.next_in, a = t.input;
  for (t.avail_in = n, t.next_in = 0, t.input = e, Ce(o); o.lookahead >= B; ) {
    let c = o.strstart, f = o.lookahead - (B - 1);
    do
      o.ins_h = Gt(o, o.ins_h, o.window[c + B - 1]), o.prev[c & o.w_mask] = o.head[o.ins_h], o.head[o.ins_h] = c, c++;
    while (--f);
    o.strstart = c, o.lookahead = B - 1, Ce(o);
  }
  return o.strstart += o.lookahead, o.block_start = o.strstart, o.insert = o.lookahead, o.lookahead = 0, o.match_length = o.prev_length = B - 1, o.match_available = 0, t.next_in = i, t.input = a, t.avail_in = r, o.wrap = s, Z;
};
var Dm = Om, Rm = Zc, Fm = Yc, Mm = jc, Lm = vm, Bm = km, Vm = Em, $m = Tm, Nm = "pako deflate (from Nodeca project)", ze = {
  deflateInit: Dm,
  deflateInit2: Rm,
  deflateReset: Fm,
  deflateResetKeep: Mm,
  deflateSetHeader: Lm,
  deflate: Bm,
  deflateEnd: Vm,
  deflateSetDictionary: $m,
  deflateInfo: Nm
};
const Gm = (t, e) => Object.prototype.hasOwnProperty.call(t, e);
var Pm = function(t) {
  const e = Array.prototype.slice.call(arguments, 1);
  for (; e.length; ) {
    const n = e.shift();
    if (n) {
      if (typeof n != "object")
        throw new TypeError(n + "must be non-object");
      for (const o in n)
        Gm(n, o) && (t[o] = n[o]);
    }
  }
  return t;
}, Um = (t) => {
  let e = 0;
  for (let o = 0, s = t.length; o < s; o++)
    e += t[o].length;
  const n = new Uint8Array(e);
  for (let o = 0, s = 0, r = t.length; o < r; o++) {
    let i = t[o];
    n.set(i, s), s += i.length;
  }
  return n;
}, so = {
  assign: Pm,
  flattenChunks: Um
};
let Xc = !0;
try {
  String.fromCharCode.apply(null, new Uint8Array(1));
} catch {
  Xc = !1;
}
const tn = new Uint8Array(256);
for (let t = 0; t < 256; t++)
  tn[t] = t >= 252 ? 6 : t >= 248 ? 5 : t >= 240 ? 4 : t >= 224 ? 3 : t >= 192 ? 2 : 1;
tn[254] = tn[254] = 1;
var zm = (t) => {
  if (typeof TextEncoder == "function" && TextEncoder.prototype.encode)
    return new TextEncoder().encode(t);
  let e, n, o, s, r, i = t.length, a = 0;
  for (s = 0; s < i; s++)
    n = t.charCodeAt(s), (n & 64512) === 55296 && s + 1 < i && (o = t.charCodeAt(s + 1), (o & 64512) === 56320 && (n = 65536 + (n - 55296 << 10) + (o - 56320), s++)), a += n < 128 ? 1 : n < 2048 ? 2 : n < 65536 ? 3 : 4;
  for (e = new Uint8Array(a), r = 0, s = 0; r < a; s++)
    n = t.charCodeAt(s), (n & 64512) === 55296 && s + 1 < i && (o = t.charCodeAt(s + 1), (o & 64512) === 56320 && (n = 65536 + (n - 55296 << 10) + (o - 56320), s++)), n < 128 ? e[r++] = n : n < 2048 ? (e[r++] = 192 | n >>> 6, e[r++] = 128 | n & 63) : n < 65536 ? (e[r++] = 224 | n >>> 12, e[r++] = 128 | n >>> 6 & 63, e[r++] = 128 | n & 63) : (e[r++] = 240 | n >>> 18, e[r++] = 128 | n >>> 12 & 63, e[r++] = 128 | n >>> 6 & 63, e[r++] = 128 | n & 63);
  return e;
};
const Hm = (t, e) => {
  if (e < 65534 && t.subarray && Xc)
    return String.fromCharCode.apply(null, t.length === e ? t : t.subarray(0, e));
  let n = "";
  for (let o = 0; o < e; o++)
    n += String.fromCharCode(t[o]);
  return n;
};
var Wm = (t, e) => {
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
    let a = tn[i];
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
  return Hm(r, s);
}, jm = (t, e) => {
  e = e || t.length, e > t.length && (e = t.length);
  let n = e - 1;
  for (; n >= 0 && (t[n] & 192) === 128; )
    n--;
  return n < 0 || n === 0 ? e : n + tn[t[n]] > e ? n : e;
}, en = {
  string2buf: zm,
  buf2string: Wm,
  utf8border: jm
};
function Ym() {
  this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
}
var qc = Ym;
const Kc = Object.prototype.toString, {
  Z_NO_FLUSH: Zm,
  Z_SYNC_FLUSH: Xm,
  Z_FULL_FLUSH: qm,
  Z_FINISH: Km,
  Z_OK: Gn,
  Z_STREAM_END: Jm,
  Z_DEFAULT_COMPRESSION: Qm,
  Z_DEFAULT_STRATEGY: ty,
  Z_DEFLATED: ey
} = no;
function ro(t) {
  this.options = so.assign({
    level: Qm,
    method: ey,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: ty
  }, t || {});
  let e = this.options;
  e.raw && e.windowBits > 0 ? e.windowBits = -e.windowBits : e.gzip && e.windowBits > 0 && e.windowBits < 16 && (e.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new qc(), this.strm.avail_out = 0;
  let n = ze.deflateInit2(
    this.strm,
    e.level,
    e.method,
    e.windowBits,
    e.memLevel,
    e.strategy
  );
  if (n !== Gn)
    throw new Error(Jt[n]);
  if (e.header && ze.deflateSetHeader(this.strm, e.header), e.dictionary) {
    let o;
    if (typeof e.dictionary == "string" ? o = en.string2buf(e.dictionary) : Kc.call(e.dictionary) === "[object ArrayBuffer]" ? o = new Uint8Array(e.dictionary) : o = e.dictionary, n = ze.deflateSetDictionary(this.strm, o), n !== Gn)
      throw new Error(Jt[n]);
    this._dict_set = !0;
  }
}
ro.prototype.push = function(t, e) {
  const n = this.strm, o = this.options.chunkSize;
  let s, r;
  if (this.ended)
    return !1;
  for (e === ~~e ? r = e : r = e === !0 ? Km : Zm, typeof t == "string" ? n.input = en.string2buf(t) : Kc.call(t) === "[object ArrayBuffer]" ? n.input = new Uint8Array(t) : n.input = t, n.next_in = 0, n.avail_in = n.input.length; ; ) {
    if (n.avail_out === 0 && (n.output = new Uint8Array(o), n.next_out = 0, n.avail_out = o), (r === Xm || r === qm) && n.avail_out <= 6) {
      this.onData(n.output.subarray(0, n.next_out)), n.avail_out = 0;
      continue;
    }
    if (s = ze.deflate(n, r), s === Jm)
      return n.next_out > 0 && this.onData(n.output.subarray(0, n.next_out)), s = ze.deflateEnd(this.strm), this.onEnd(s), this.ended = !0, s === Gn;
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
ro.prototype.onData = function(t) {
  this.chunks.push(t);
};
ro.prototype.onEnd = function(t) {
  t === Gn && (this.result = so.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;
};
function ny(t, e) {
  const n = new ro(e);
  if (n.push(t, !0), n.err)
    throw n.msg || Jt[n.err];
  return n.result;
}
var oy = ny, sy = {
  deflate: oy
};
const xn = 16209, ry = 16191;
var iy = function(e, n) {
  let o, s, r, i, a, c, f, l, u, h, p, g, d, x, m, y, w, S, _, b, A, k, O, v;
  const E = e.state;
  o = e.next_in, O = e.input, s = o + (e.avail_in - 5), r = e.next_out, v = e.output, i = r - (n - e.avail_out), a = r + (e.avail_out - 257), c = E.dmax, f = E.wsize, l = E.whave, u = E.wnext, h = E.window, p = E.hold, g = E.bits, d = E.lencode, x = E.distcode, m = (1 << E.lenbits) - 1, y = (1 << E.distbits) - 1;
  t:
    do {
      g < 15 && (p += O[o++] << g, g += 8, p += O[o++] << g, g += 8), w = d[p & m];
      e:
        for (; ; ) {
          if (S = w >>> 24, p >>>= S, g -= S, S = w >>> 16 & 255, S === 0)
            v[r++] = w & 65535;
          else if (S & 16) {
            _ = w & 65535, S &= 15, S && (g < S && (p += O[o++] << g, g += 8), _ += p & (1 << S) - 1, p >>>= S, g -= S), g < 15 && (p += O[o++] << g, g += 8, p += O[o++] << g, g += 8), w = x[p & y];
            n:
              for (; ; ) {
                if (S = w >>> 24, p >>>= S, g -= S, S = w >>> 16 & 255, S & 16) {
                  if (b = w & 65535, S &= 15, g < S && (p += O[o++] << g, g += 8, g < S && (p += O[o++] << g, g += 8)), b += p & (1 << S) - 1, b > c) {
                    e.msg = "invalid distance too far back", E.mode = xn;
                    break t;
                  }
                  if (p >>>= S, g -= S, S = r - i, b > S) {
                    if (S = b - S, S > l && E.sane) {
                      e.msg = "invalid distance too far back", E.mode = xn;
                      break t;
                    }
                    if (A = 0, k = h, u === 0) {
                      if (A += f - S, S < _) {
                        _ -= S;
                        do
                          v[r++] = h[A++];
                        while (--S);
                        A = r - b, k = v;
                      }
                    } else if (u < S) {
                      if (A += f + u - S, S -= u, S < _) {
                        _ -= S;
                        do
                          v[r++] = h[A++];
                        while (--S);
                        if (A = 0, u < _) {
                          S = u, _ -= S;
                          do
                            v[r++] = h[A++];
                          while (--S);
                          A = r - b, k = v;
                        }
                      }
                    } else if (A += u - S, S < _) {
                      _ -= S;
                      do
                        v[r++] = h[A++];
                      while (--S);
                      A = r - b, k = v;
                    }
                    for (; _ > 2; )
                      v[r++] = k[A++], v[r++] = k[A++], v[r++] = k[A++], _ -= 3;
                    _ && (v[r++] = k[A++], _ > 1 && (v[r++] = k[A++]));
                  } else {
                    A = r - b;
                    do
                      v[r++] = v[A++], v[r++] = v[A++], v[r++] = v[A++], _ -= 3;
                    while (_ > 2);
                    _ && (v[r++] = v[A++], _ > 1 && (v[r++] = v[A++]));
                  }
                } else if ((S & 64) === 0) {
                  w = x[(w & 65535) + (p & (1 << S) - 1)];
                  continue n;
                } else {
                  e.msg = "invalid distance code", E.mode = xn;
                  break t;
                }
                break;
              }
          } else if ((S & 64) === 0) {
            w = d[(w & 65535) + (p & (1 << S) - 1)];
            continue e;
          } else if (S & 32) {
            E.mode = ry;
            break t;
          } else {
            e.msg = "invalid literal/length code", E.mode = xn;
            break t;
          }
          break;
        }
    } while (o < s && r < a);
  _ = g >> 3, o -= _, g -= _ << 3, p &= (1 << g) - 1, e.next_in = o, e.next_out = r, e.avail_in = o < s ? 5 + (s - o) : 5 - (o - s), e.avail_out = r < a ? 257 + (a - r) : 257 - (r - a), E.hold = p, E.bits = g;
};
const ae = 15, jr = 852, Yr = 592, Zr = 0, ko = 1, Xr = 2, ay = new Uint16Array([
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
]), cy = new Uint8Array([
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
]), fy = new Uint16Array([
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
]), ly = new Uint8Array([
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
]), uy = (t, e, n, o, s, r, i, a) => {
  const c = a.bits;
  let f = 0, l = 0, u = 0, h = 0, p = 0, g = 0, d = 0, x = 0, m = 0, y = 0, w, S, _, b, A, k = null, O;
  const v = new Uint16Array(ae + 1), E = new Uint16Array(ae + 1);
  let T = null, D, R, M;
  for (f = 0; f <= ae; f++)
    v[f] = 0;
  for (l = 0; l < o; l++)
    v[e[n + l]]++;
  for (p = c, h = ae; h >= 1 && v[h] === 0; h--)
    ;
  if (p > h && (p = h), h === 0)
    return s[r++] = 1 << 24 | 64 << 16 | 0, s[r++] = 1 << 24 | 64 << 16 | 0, a.bits = 1, 0;
  for (u = 1; u < h && v[u] === 0; u++)
    ;
  for (p < u && (p = u), x = 1, f = 1; f <= ae; f++)
    if (x <<= 1, x -= v[f], x < 0)
      return -1;
  if (x > 0 && (t === Zr || h !== 1))
    return -1;
  for (E[1] = 0, f = 1; f < ae; f++)
    E[f + 1] = E[f] + v[f];
  for (l = 0; l < o; l++)
    e[n + l] !== 0 && (i[E[e[n + l]]++] = l);
  if (t === Zr ? (k = T = i, O = 20) : t === ko ? (k = ay, T = cy, O = 257) : (k = fy, T = ly, O = 0), y = 0, l = 0, f = u, A = r, g = p, d = 0, _ = -1, m = 1 << p, b = m - 1, t === ko && m > jr || t === Xr && m > Yr)
    return 1;
  for (; ; ) {
    D = f - d, i[l] + 1 < O ? (R = 0, M = i[l]) : i[l] >= O ? (R = T[i[l] - O], M = k[i[l] - O]) : (R = 96, M = 0), w = 1 << f - d, S = 1 << g, u = S;
    do
      S -= w, s[A + (y >> d) + S] = D << 24 | R << 16 | M | 0;
    while (S !== 0);
    for (w = 1 << f - 1; y & w; )
      w >>= 1;
    if (w !== 0 ? (y &= w - 1, y += w) : y = 0, l++, --v[f] === 0) {
      if (f === h)
        break;
      f = e[n + i[l]];
    }
    if (f > p && (y & b) !== _) {
      for (d === 0 && (d = p), A += u, g = f - d, x = 1 << g; g + d < h && (x -= v[g + d], !(x <= 0)); )
        g++, x <<= 1;
      if (m += 1 << g, t === ko && m > jr || t === Xr && m > Yr)
        return 1;
      _ = y & b, s[_] = p << 24 | g << 16 | A - r | 0;
    }
  }
  return y !== 0 && (s[A + y] = f - d << 24 | 64 << 16 | 0), a.bits = p, 0;
};
var He = uy;
const hy = 0, Jc = 1, Qc = 2, {
  Z_FINISH: qr,
  Z_BLOCK: gy,
  Z_TREES: Sn,
  Z_OK: te,
  Z_STREAM_END: py,
  Z_NEED_DICT: dy,
  Z_STREAM_ERROR: ft,
  Z_DATA_ERROR: tf,
  Z_MEM_ERROR: ef,
  Z_BUF_ERROR: my,
  Z_DEFLATED: Kr
} = no, io = 16180, Jr = 16181, Qr = 16182, ti = 16183, ei = 16184, ni = 16185, oi = 16186, si = 16187, ri = 16188, ii = 16189, Pn = 16190, wt = 16191, Eo = 16192, ai = 16193, To = 16194, ci = 16195, fi = 16196, li = 16197, ui = 16198, _n = 16199, wn = 16200, hi = 16201, gi = 16202, pi = 16203, di = 16204, mi = 16205, Do = 16206, yi = 16207, xi = 16208, z = 16209, nf = 16210, of = 16211, yy = 852, xy = 592, Sy = 15, _y = Sy, Si = (t) => (t >>> 24 & 255) + (t >>> 8 & 65280) + ((t & 65280) << 8) + ((t & 255) << 24);
function wy() {
  this.strm = null, this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new Uint16Array(320), this.work = new Uint16Array(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
}
const ne = (t) => {
  if (!t)
    return 1;
  const e = t.state;
  return !e || e.strm !== t || e.mode < io || e.mode > of ? 1 : 0;
}, sf = (t) => {
  if (ne(t))
    return ft;
  const e = t.state;
  return t.total_in = t.total_out = e.total = 0, t.msg = "", e.wrap && (t.adler = e.wrap & 1), e.mode = io, e.last = 0, e.havedict = 0, e.flags = -1, e.dmax = 32768, e.head = null, e.hold = 0, e.bits = 0, e.lencode = e.lendyn = new Int32Array(yy), e.distcode = e.distdyn = new Int32Array(xy), e.sane = 1, e.back = -1, te;
}, rf = (t) => {
  if (ne(t))
    return ft;
  const e = t.state;
  return e.wsize = 0, e.whave = 0, e.wnext = 0, sf(t);
}, af = (t, e) => {
  let n;
  if (ne(t))
    return ft;
  const o = t.state;
  return e < 0 ? (n = 0, e = -e) : (n = (e >> 4) + 5, e < 48 && (e &= 15)), e && (e < 8 || e > 15) ? ft : (o.window !== null && o.wbits !== e && (o.window = null), o.wrap = n, o.wbits = e, rf(t));
}, cf = (t, e) => {
  if (!t)
    return ft;
  const n = new wy();
  t.state = n, n.strm = t, n.window = null, n.mode = io;
  const o = af(t, e);
  return o !== te && (t.state = null), o;
}, by = (t) => cf(t, _y);
let _i = !0, Ro, Fo;
const Ay = (t) => {
  if (_i) {
    Ro = new Int32Array(512), Fo = new Int32Array(32);
    let e = 0;
    for (; e < 144; )
      t.lens[e++] = 8;
    for (; e < 256; )
      t.lens[e++] = 9;
    for (; e < 280; )
      t.lens[e++] = 7;
    for (; e < 288; )
      t.lens[e++] = 8;
    for (He(Jc, t.lens, 0, 288, Ro, 0, t.work, { bits: 9 }), e = 0; e < 32; )
      t.lens[e++] = 5;
    He(Qc, t.lens, 0, 32, Fo, 0, t.work, { bits: 5 }), _i = !1;
  }
  t.lencode = Ro, t.lenbits = 9, t.distcode = Fo, t.distbits = 5;
}, ff = (t, e, n, o) => {
  let s;
  const r = t.state;
  return r.window === null && (r.wsize = 1 << r.wbits, r.wnext = 0, r.whave = 0, r.window = new Uint8Array(r.wsize)), o >= r.wsize ? (r.window.set(e.subarray(n - r.wsize, n), 0), r.wnext = 0, r.whave = r.wsize) : (s = r.wsize - r.wnext, s > o && (s = o), r.window.set(e.subarray(n - o, n - o + s), r.wnext), o -= s, o ? (r.window.set(e.subarray(n - o, n), 0), r.wnext = o, r.whave = r.wsize) : (r.wnext += s, r.wnext === r.wsize && (r.wnext = 0), r.whave < r.wsize && (r.whave += s))), 0;
}, Cy = (t, e) => {
  let n, o, s, r, i, a, c, f, l, u, h, p, g, d, x = 0, m, y, w, S, _, b, A, k;
  const O = new Uint8Array(4);
  let v, E;
  const T = (
    /* permutation of code lengths */
    new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15])
  );
  if (ne(t) || !t.output || !t.input && t.avail_in !== 0)
    return ft;
  n = t.state, n.mode === wt && (n.mode = Eo), i = t.next_out, s = t.output, c = t.avail_out, r = t.next_in, o = t.input, a = t.avail_in, f = n.hold, l = n.bits, u = a, h = c, k = te;
  t:
    for (; ; )
      switch (n.mode) {
        case io:
          if (n.wrap === 0) {
            n.mode = Eo;
            break;
          }
          for (; l < 16; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          if (n.wrap & 2 && f === 35615) {
            n.wbits === 0 && (n.wbits = 15), n.check = 0, O[0] = f & 255, O[1] = f >>> 8 & 255, n.check = j(n.check, O, 2, 0), f = 0, l = 0, n.mode = Jr;
            break;
          }
          if (n.head && (n.head.done = !1), !(n.wrap & 1) || /* check if zlib header allowed */
          (((f & 255) << 8) + (f >> 8)) % 31) {
            t.msg = "incorrect header check", n.mode = z;
            break;
          }
          if ((f & 15) !== Kr) {
            t.msg = "unknown compression method", n.mode = z;
            break;
          }
          if (f >>>= 4, l -= 4, A = (f & 15) + 8, n.wbits === 0 && (n.wbits = A), A > 15 || A > n.wbits) {
            t.msg = "invalid window size", n.mode = z;
            break;
          }
          n.dmax = 1 << n.wbits, n.flags = 0, t.adler = n.check = 1, n.mode = f & 512 ? ii : wt, f = 0, l = 0;
          break;
        case Jr:
          for (; l < 16; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          if (n.flags = f, (n.flags & 255) !== Kr) {
            t.msg = "unknown compression method", n.mode = z;
            break;
          }
          if (n.flags & 57344) {
            t.msg = "unknown header flags set", n.mode = z;
            break;
          }
          n.head && (n.head.text = f >> 8 & 1), n.flags & 512 && n.wrap & 4 && (O[0] = f & 255, O[1] = f >>> 8 & 255, n.check = j(n.check, O, 2, 0)), f = 0, l = 0, n.mode = Qr;
        /* falls through */
        case Qr:
          for (; l < 32; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          n.head && (n.head.time = f), n.flags & 512 && n.wrap & 4 && (O[0] = f & 255, O[1] = f >>> 8 & 255, O[2] = f >>> 16 & 255, O[3] = f >>> 24 & 255, n.check = j(n.check, O, 4, 0)), f = 0, l = 0, n.mode = ti;
        /* falls through */
        case ti:
          for (; l < 16; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          n.head && (n.head.xflags = f & 255, n.head.os = f >> 8), n.flags & 512 && n.wrap & 4 && (O[0] = f & 255, O[1] = f >>> 8 & 255, n.check = j(n.check, O, 2, 0)), f = 0, l = 0, n.mode = ei;
        /* falls through */
        case ei:
          if (n.flags & 1024) {
            for (; l < 16; ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << l, l += 8;
            }
            n.length = f, n.head && (n.head.extra_len = f), n.flags & 512 && n.wrap & 4 && (O[0] = f & 255, O[1] = f >>> 8 & 255, n.check = j(n.check, O, 2, 0)), f = 0, l = 0;
          } else n.head && (n.head.extra = null);
          n.mode = ni;
        /* falls through */
        case ni:
          if (n.flags & 1024 && (p = n.length, p > a && (p = a), p && (n.head && (A = n.head.extra_len - n.length, n.head.extra || (n.head.extra = new Uint8Array(n.head.extra_len)), n.head.extra.set(
            o.subarray(
              r,
              // extra field is limited to 65536 bytes
              // - no need for additional size check
              r + p
            ),
            /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
            A
          )), n.flags & 512 && n.wrap & 4 && (n.check = j(n.check, o, p, r)), a -= p, r += p, n.length -= p), n.length))
            break t;
          n.length = 0, n.mode = oi;
        /* falls through */
        case oi:
          if (n.flags & 2048) {
            if (a === 0)
              break t;
            p = 0;
            do
              A = o[r + p++], n.head && A && n.length < 65536 && (n.head.name += String.fromCharCode(A));
            while (A && p < a);
            if (n.flags & 512 && n.wrap & 4 && (n.check = j(n.check, o, p, r)), a -= p, r += p, A)
              break t;
          } else n.head && (n.head.name = null);
          n.length = 0, n.mode = si;
        /* falls through */
        case si:
          if (n.flags & 4096) {
            if (a === 0)
              break t;
            p = 0;
            do
              A = o[r + p++], n.head && A && n.length < 65536 && (n.head.comment += String.fromCharCode(A));
            while (A && p < a);
            if (n.flags & 512 && n.wrap & 4 && (n.check = j(n.check, o, p, r)), a -= p, r += p, A)
              break t;
          } else n.head && (n.head.comment = null);
          n.mode = ri;
        /* falls through */
        case ri:
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
          n.head && (n.head.hcrc = n.flags >> 9 & 1, n.head.done = !0), t.adler = n.check = 0, n.mode = wt;
          break;
        case ii:
          for (; l < 32; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          t.adler = n.check = Si(f), f = 0, l = 0, n.mode = Pn;
        /* falls through */
        case Pn:
          if (n.havedict === 0)
            return t.next_out = i, t.avail_out = c, t.next_in = r, t.avail_in = a, n.hold = f, n.bits = l, dy;
          t.adler = n.check = 1, n.mode = wt;
        /* falls through */
        case wt:
          if (e === gy || e === Sn)
            break t;
        /* falls through */
        case Eo:
          if (n.last) {
            f >>>= l & 7, l -= l & 7, n.mode = Do;
            break;
          }
          for (; l < 3; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          switch (n.last = f & 1, f >>>= 1, l -= 1, f & 3) {
            case 0:
              n.mode = ai;
              break;
            case 1:
              if (Ay(n), n.mode = _n, e === Sn) {
                f >>>= 2, l -= 2;
                break t;
              }
              break;
            case 2:
              n.mode = fi;
              break;
            case 3:
              t.msg = "invalid block type", n.mode = z;
          }
          f >>>= 2, l -= 2;
          break;
        case ai:
          for (f >>>= l & 7, l -= l & 7; l < 32; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          if ((f & 65535) !== (f >>> 16 ^ 65535)) {
            t.msg = "invalid stored block lengths", n.mode = z;
            break;
          }
          if (n.length = f & 65535, f = 0, l = 0, n.mode = To, e === Sn)
            break t;
        /* falls through */
        case To:
          n.mode = ci;
        /* falls through */
        case ci:
          if (p = n.length, p) {
            if (p > a && (p = a), p > c && (p = c), p === 0)
              break t;
            s.set(o.subarray(r, r + p), i), a -= p, r += p, c -= p, i += p, n.length -= p;
            break;
          }
          n.mode = wt;
          break;
        case fi:
          for (; l < 14; ) {
            if (a === 0)
              break t;
            a--, f += o[r++] << l, l += 8;
          }
          if (n.nlen = (f & 31) + 257, f >>>= 5, l -= 5, n.ndist = (f & 31) + 1, f >>>= 5, l -= 5, n.ncode = (f & 15) + 4, f >>>= 4, l -= 4, n.nlen > 286 || n.ndist > 30) {
            t.msg = "too many length or distance symbols", n.mode = z;
            break;
          }
          n.have = 0, n.mode = li;
        /* falls through */
        case li:
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
          if (n.lencode = n.lendyn, n.lenbits = 7, v = { bits: n.lenbits }, k = He(hy, n.lens, 0, 19, n.lencode, 0, n.work, v), n.lenbits = v.bits, k) {
            t.msg = "invalid code lengths set", n.mode = z;
            break;
          }
          n.have = 0, n.mode = ui;
        /* falls through */
        case ui:
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
          if (n.lenbits = 9, v = { bits: n.lenbits }, k = He(Jc, n.lens, 0, n.nlen, n.lencode, 0, n.work, v), n.lenbits = v.bits, k) {
            t.msg = "invalid literal/lengths set", n.mode = z;
            break;
          }
          if (n.distbits = 6, n.distcode = n.distdyn, v = { bits: n.distbits }, k = He(Qc, n.lens, n.nlen, n.ndist, n.distcode, 0, n.work, v), n.distbits = v.bits, k) {
            t.msg = "invalid distances set", n.mode = z;
            break;
          }
          if (n.mode = _n, e === Sn)
            break t;
        /* falls through */
        case _n:
          n.mode = wn;
        /* falls through */
        case wn:
          if (a >= 6 && c >= 258) {
            t.next_out = i, t.avail_out = c, t.next_in = r, t.avail_in = a, n.hold = f, n.bits = l, iy(t, h), i = t.next_out, s = t.output, c = t.avail_out, r = t.next_in, o = t.input, a = t.avail_in, f = n.hold, l = n.bits, n.mode === wt && (n.back = -1);
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
            n.mode = mi;
            break;
          }
          if (y & 32) {
            n.back = -1, n.mode = wt;
            break;
          }
          if (y & 64) {
            t.msg = "invalid literal/length code", n.mode = z;
            break;
          }
          n.extra = y & 15, n.mode = hi;
        /* falls through */
        case hi:
          if (n.extra) {
            for (E = n.extra; l < E; ) {
              if (a === 0)
                break t;
              a--, f += o[r++] << l, l += 8;
            }
            n.length += f & (1 << n.extra) - 1, f >>>= n.extra, l -= n.extra, n.back += n.extra;
          }
          n.was = n.length, n.mode = gi;
        /* falls through */
        case gi:
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
          n.offset = w, n.extra = y & 15, n.mode = pi;
        /* falls through */
        case pi:
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
          n.mode = di;
        /* falls through */
        case di:
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
          n.length === 0 && (n.mode = wn);
          break;
        case mi:
          if (c === 0)
            break t;
          s[i++] = n.length, c--, n.mode = wn;
          break;
        case Do:
          if (n.wrap) {
            for (; l < 32; ) {
              if (a === 0)
                break t;
              a--, f |= o[r++] << l, l += 8;
            }
            if (h -= c, t.total_out += h, n.total += h, n.wrap & 4 && h && (t.adler = n.check = /*UPDATE_CHECK(state.check, put - _out, _out);*/
            n.flags ? j(n.check, s, h, i - h) : Qe(n.check, s, h, i - h)), h = c, n.wrap & 4 && (n.flags ? f : Si(f)) !== n.check) {
              t.msg = "incorrect data check", n.mode = z;
              break;
            }
            f = 0, l = 0;
          }
          n.mode = yi;
        /* falls through */
        case yi:
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
          n.mode = xi;
        /* falls through */
        case xi:
          k = py;
          break t;
        case z:
          k = tf;
          break t;
        case nf:
          return ef;
        case of:
        /* falls through */
        default:
          return ft;
      }
  return t.next_out = i, t.avail_out = c, t.next_in = r, t.avail_in = a, n.hold = f, n.bits = l, (n.wsize || h !== t.avail_out && n.mode < z && (n.mode < Do || e !== qr)) && ff(t, t.output, t.next_out, h - t.avail_out), u -= t.avail_in, h -= t.avail_out, t.total_in += u, t.total_out += h, n.total += h, n.wrap & 4 && h && (t.adler = n.check = /*UPDATE_CHECK(state.check, strm.next_out - _out, _out);*/
  n.flags ? j(n.check, s, h, t.next_out - h) : Qe(n.check, s, h, t.next_out - h)), t.data_type = n.bits + (n.last ? 64 : 0) + (n.mode === wt ? 128 : 0) + (n.mode === _n || n.mode === To ? 256 : 0), (u === 0 && h === 0 || e === qr) && k === te && (k = my), k;
}, Iy = (t) => {
  if (ne(t))
    return ft;
  let e = t.state;
  return e.window && (e.window = null), t.state = null, te;
}, vy = (t, e) => {
  if (ne(t))
    return ft;
  const n = t.state;
  return (n.wrap & 2) === 0 ? ft : (n.head = e, e.done = !1, te);
}, Oy = (t, e) => {
  const n = e.length;
  let o, s, r;
  return ne(t) || (o = t.state, o.wrap !== 0 && o.mode !== Pn) ? ft : o.mode === Pn && (s = 1, s = Qe(s, e, n, 0), s !== o.check) ? tf : (r = ff(t, e, n, n), r ? (o.mode = nf, ef) : (o.havedict = 1, te));
};
var ky = rf, Ey = af, Ty = sf, Dy = by, Ry = cf, Fy = Cy, My = Iy, Ly = vy, By = Oy, Vy = "pako inflate (from Nodeca project)", It = {
  inflateReset: ky,
  inflateReset2: Ey,
  inflateResetKeep: Ty,
  inflateInit: Dy,
  inflateInit2: Ry,
  inflate: Fy,
  inflateEnd: My,
  inflateGetHeader: Ly,
  inflateSetDictionary: By,
  inflateInfo: Vy
};
function $y() {
  this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
}
var Ny = $y;
const lf = Object.prototype.toString, {
  Z_NO_FLUSH: Gy,
  Z_FINISH: Py,
  Z_OK: nn,
  Z_STREAM_END: Mo,
  Z_NEED_DICT: Lo,
  Z_STREAM_ERROR: Uy,
  Z_DATA_ERROR: wi,
  Z_MEM_ERROR: zy
} = no;
function ao(t) {
  this.options = so.assign({
    chunkSize: 1024 * 64,
    windowBits: 15,
    to: ""
  }, t || {});
  const e = this.options;
  e.raw && e.windowBits >= 0 && e.windowBits < 16 && (e.windowBits = -e.windowBits, e.windowBits === 0 && (e.windowBits = -15)), e.windowBits >= 0 && e.windowBits < 16 && !(t && t.windowBits) && (e.windowBits += 32), e.windowBits > 15 && e.windowBits < 48 && (e.windowBits & 15) === 0 && (e.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new qc(), this.strm.avail_out = 0;
  let n = It.inflateInit2(
    this.strm,
    e.windowBits
  );
  if (n !== nn)
    throw new Error(Jt[n]);
  if (this.header = new Ny(), It.inflateGetHeader(this.strm, this.header), e.dictionary && (typeof e.dictionary == "string" ? e.dictionary = en.string2buf(e.dictionary) : lf.call(e.dictionary) === "[object ArrayBuffer]" && (e.dictionary = new Uint8Array(e.dictionary)), e.raw && (n = It.inflateSetDictionary(this.strm, e.dictionary), n !== nn)))
    throw new Error(Jt[n]);
}
ao.prototype.push = function(t, e) {
  const n = this.strm, o = this.options.chunkSize, s = this.options.dictionary;
  let r, i, a;
  if (this.ended) return !1;
  for (e === ~~e ? i = e : i = e === !0 ? Py : Gy, lf.call(t) === "[object ArrayBuffer]" ? n.input = new Uint8Array(t) : n.input = t, n.next_in = 0, n.avail_in = n.input.length; ; ) {
    for (n.avail_out === 0 && (n.output = new Uint8Array(o), n.next_out = 0, n.avail_out = o), r = It.inflate(n, i), r === Lo && s && (r = It.inflateSetDictionary(n, s), r === nn ? r = It.inflate(n, i) : r === wi && (r = Lo)); n.avail_in > 0 && r === Mo && n.state.wrap > 0 && t[n.next_in] !== 0; )
      It.inflateReset(n), r = It.inflate(n, i);
    switch (r) {
      case Uy:
      case wi:
      case Lo:
      case zy:
        return this.onEnd(r), this.ended = !0, !1;
    }
    if (a = n.avail_out, n.next_out && (n.avail_out === 0 || r === Mo))
      if (this.options.to === "string") {
        let c = en.utf8border(n.output, n.next_out), f = n.next_out - c, l = en.buf2string(n.output, c);
        n.next_out = f, n.avail_out = o - f, f && n.output.set(n.output.subarray(c, c + f), 0), this.onData(l);
      } else
        this.onData(n.output.length === n.next_out ? n.output : n.output.subarray(0, n.next_out));
    if (!(r === nn && a === 0)) {
      if (r === Mo)
        return r = It.inflateEnd(this.strm), this.onEnd(r), this.ended = !0, !0;
      if (n.avail_in === 0) break;
    }
  }
  return !0;
};
ao.prototype.onData = function(t) {
  this.chunks.push(t);
};
ao.prototype.onEnd = function(t) {
  t === nn && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = so.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;
};
function Hy(t, e) {
  const n = new ao(e);
  if (n.push(t), n.err) throw n.msg || Jt[n.err];
  return n.result;
}
var Wy = Hy, jy = {
  inflate: Wy
};
const { deflate: Yy } = sy, { inflate: Zy } = jy;
var bi = Yy, Ai = Zy;
const uf = 2001684038, fs = 44, ls = 20, Un = 12, zn = 16;
function hf(t) {
  const e = new DataView(t), n = new Uint8Array(t);
  if (e.getUint32(0) !== uf)
    throw new Error("Invalid WOFF1 signature");
  const s = e.getUint32(4), r = e.getUint16(12), i = e.getUint32(24), a = e.getUint32(28), c = e.getUint32(36), f = e.getUint32(40), l = [];
  let u = fs;
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
    }), u += ls;
  const h = l.map((O) => {
    const v = n.subarray(
      O.offset,
      O.offset + O.compLength
    );
    let E;
    if (O.compLength < O.origLength) {
      if (E = Ai(v), E.length !== O.origLength)
        throw new Error(
          `WOFF1 table '${O.tag}': decompressed size ${E.length} !== expected ${O.origLength}`
        );
    } else
      E = v;
    return {
      tag: O.tag,
      checksum: O.origChecksum,
      data: E,
      length: O.origLength,
      paddedLength: O.origLength + (4 - O.origLength % 4) % 4
    };
  }), p = Un + r * zn;
  let g = p + (4 - p % 4) % 4;
  const { searchRange: d, entrySelector: x, rangeShift: m } = Xy(r);
  let y = g;
  for (const O of h)
    y += O.paddedLength;
  const w = new ArrayBuffer(y), S = new DataView(w), _ = new Uint8Array(w);
  S.setUint32(0, s), S.setUint16(4, r), S.setUint16(6, d), S.setUint16(8, x), S.setUint16(10, m);
  const b = h.map((O, v) => ({ ...O, originalIndex: v })).sort((O, v) => O.tag < v.tag ? -1 : O.tag > v.tag ? 1 : 0);
  for (let O = 0; O < b.length; O++) {
    const v = b[O], E = Un + O * zn;
    for (let T = 0; T < 4; T++)
      S.setUint8(E + T, v.tag.charCodeAt(T));
    S.setUint32(E + 4, v.checksum), S.setUint32(E + 8, g), S.setUint32(E + 12, v.length), _.set(v.data, g), g += v.paddedLength;
  }
  let A = null;
  if (i && a) {
    const O = n.subarray(i, i + a);
    A = Ai(O);
  }
  let k = null;
  return c && f && (k = n.slice(c, c + f)), { sfnt: w, metadata: A, privateData: k };
}
function us(t, e = null, n = null) {
  const o = new DataView(t), s = new Uint8Array(t), r = o.getUint32(0), i = o.getUint16(4), a = [];
  for (let b = 0; b < i; b++) {
    const A = Un + b * zn;
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
    const A = s.subarray(b.offset, b.offset + b.length), k = bi(A), O = k.length < b.length;
    return {
      tag: b.tag,
      origChecksum: b.checksum,
      origLength: b.length,
      data: O ? k : A,
      compLength: O ? k.length : b.length
    };
  });
  let f = null, l = 0;
  e && e.length > 0 && (l = e.length, f = bi(e));
  let h = fs + i * ls;
  h += (4 - h % 4) % 4;
  for (const b of c)
    b.woffOffset = h, h += b.compLength, h += (4 - h % 4) % 4;
  let p = 0, g = 0;
  f && (p = h, g = f.length, h += g, h += (4 - h % 4) % 4);
  let d = 0, x = 0;
  n && n.length > 0 && (d = h, x = n.length, h += x);
  const m = h;
  let y = Un + i * zn;
  for (const b of c)
    y += b.origLength + (4 - b.origLength % 4) % 4;
  const w = new ArrayBuffer(m), S = new DataView(w), _ = new Uint8Array(w);
  S.setUint32(0, uf), S.setUint32(4, r), S.setUint32(8, m), S.setUint16(12, i), S.setUint16(14, 0), S.setUint32(16, y), S.setUint16(20, 0), S.setUint16(22, 0), S.setUint32(24, p), S.setUint32(28, g), S.setUint32(32, l), S.setUint32(36, d), S.setUint32(40, x);
  for (let b = 0; b < c.length; b++) {
    const A = c[b], k = fs + b * ls;
    for (let O = 0; O < 4; O++)
      S.setUint8(k + O, A.tag.charCodeAt(O));
    S.setUint32(k + 4, A.woffOffset), S.setUint32(k + 8, A.compLength), S.setUint32(k + 12, A.origLength), S.setUint32(k + 16, A.origChecksum);
  }
  for (const b of c)
    _.set(b.data, b.woffOffset);
  return f && _.set(f, p), n && n.length > 0 && _.set(n, d), w;
}
function Xy(t) {
  let e = 1, n = 0;
  for (; e * 2 <= t; )
    e *= 2, n++;
  e *= 16;
  const o = t * 16 - e;
  return { searchRange: e, entrySelector: n, rangeShift: o };
}
let Hn = null, ye = null;
async function gf() {
  if (!ye)
    try {
      const { brotliCompressSync: t, brotliDecompressSync: e } = await import("node:zlib");
      Hn = (n) => new Uint8Array(t(n)), ye = (n) => new Uint8Array(e(n));
    } catch {
      const t = await import("brotli-wasm"), e = await (t.default || t);
      Hn = e.compress, ye = e.decompress;
    }
}
function pf() {
  if (!ye)
    throw new Error(
      "WOFF2 support requires initialization. Call `await initWoff2()` before importing or exporting WOFF2 files."
    );
}
const df = 2001684018, hs = 48, on = 12, sn = 16, gs = [
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
], mf = /* @__PURE__ */ new Map();
for (let t = 0; t < gs.length; t++) mf.set(gs[t], t);
function Ci(t, e) {
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
function qy(t) {
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
function xe(t, e) {
  const n = t[e];
  return n === 253 ? { value: t[e + 1] << 8 | t[e + 2], bytesRead: 3 } : n === 255 ? { value: t[e + 1] + 253, bytesRead: 2 } : n === 254 ? { value: t[e + 1] + 506, bytesRead: 2 } : { value: n, bytesRead: 1 };
}
const Ky = Jy();
function Jy() {
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
function Qy(t, e, n) {
  const o = t & 127, s = !(t & 128), r = Ky[o];
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
function tx(t, e, n, o, s, r, i, a, c) {
  const f = [];
  pt(f, t), pt(f, s), pt(f, r), pt(f, i), pt(f, a);
  for (const g of e) ds(f, g);
  ds(f, o.length);
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
function ex(t, e, n, o, s, r) {
  const i = [];
  pt(i, -1), pt(i, n), pt(i, o), pt(i, s), pt(i, r);
  for (let a = 0; a < t.length; a++) i.push(t[a]);
  if (e && e.length > 0) {
    ds(i, e.length);
    for (let a = 0; a < e.length; a++) i.push(e[a]);
  }
  return i;
}
function nx(t, e) {
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
  const c = At(n, o);
  o += 4;
  const f = At(n, o);
  o += 4;
  const l = At(n, o);
  o += 4;
  const u = At(n, o);
  o += 4;
  const h = At(n, o);
  o += 4;
  const p = At(n, o);
  o += 4;
  const g = At(n, o);
  o += 4;
  const d = o, x = d + c, m = x + f, y = m + l, w = y + u, S = w + h, _ = S + p, b = 4 * Math.floor((i + 31) / 32), A = S, k = A + b;
  function O(K) {
    const it = K >> 3, kt = 7 - (K & 7);
    return !!(n[A + it] & 1 << kt);
  }
  const v = !!(r & 1), E = _ + g;
  function T(K) {
    if (!v) return !1;
    const it = K >> 3, kt = 7 - (K & 7);
    return !!(n[E + it] & 1 << kt);
  }
  let D = d, R = x, M = m, L = y, H = w, P = k, Y = _;
  const X = [], q = [0];
  let xt = 0;
  for (let K = 0; K < i; K++) {
    const it = at(n, D);
    if (D += 2, it === 0) {
      X.push(null), q.push(xt);
      continue;
    }
    if (it > 0) {
      const kt = [];
      let se = 0;
      for (let lt = 0; lt < it; lt++) {
        const { value: _t, bytesRead: re } = xe(n, R);
        R += re, se += _t, kt.push(se - 1);
      }
      const ke = [];
      for (let lt = 0; lt < se; lt++) {
        const _t = n[M++], { dx: re, dy: Rf, onCurve: Ff, bytesConsumed: Mf } = Qy(
          _t,
          n,
          L
        );
        L += Mf, ke.push({ dx: re, dy: Rf, onCurve: Ff });
      }
      const { value: Ee, bytesRead: co } = xe(
        n,
        L
      );
      L += co;
      const fo = n.subarray(Y, Y + Ee);
      Y += Ee;
      let Ut, zt, St, Ht;
      if (O(K))
        Ut = at(n, P), P += 2, zt = at(n, P), P += 2, St = at(n, P), P += 2, Ht = at(n, P), P += 2;
      else {
        let lt = 0, _t = 0;
        Ut = 32767, zt = 32767, St = -32768, Ht = -32768;
        for (const re of ke)
          lt += re.dx, _t += re.dy, lt < Ut && (Ut = lt), lt > St && (St = lt), _t < zt && (zt = _t), _t > Ht && (Ht = _t);
      }
      const nt = tx(
        it,
        kt,
        ke,
        fo,
        Ut,
        zt,
        St,
        Ht,
        T(K)
      );
      X.push(nt);
      const lo = nt.length + (nt.length % 2 ? 1 : 0);
      xt += lo, q.push(xt);
    } else {
      const kt = H;
      let se = !1;
      for (; ; ) {
        const nt = n[H] << 8 | n[H + 1];
        if (H += 2, H += 2, nt & 1 ? H += 4 : H += 2, nt & 8 ? H += 2 : nt & 64 ? H += 4 : nt & 128 && (H += 8), nt & 256 && (se = !0), !(nt & 32)) break;
      }
      const ke = n.subarray(kt, H);
      let Ee = new Uint8Array(0);
      if (se) {
        const { value: nt, bytesRead: lo } = xe(
          n,
          L
        );
        L += lo, Ee = n.subarray(Y, Y + nt), Y += nt;
      }
      const co = at(n, P);
      P += 2;
      const fo = at(n, P);
      P += 2;
      const Ut = at(n, P);
      P += 2;
      const zt = at(n, P);
      P += 2;
      const St = ex(
        ke,
        Ee,
        co,
        fo,
        Ut,
        zt
      );
      X.push(St);
      const Ht = St.length + (St.length % 2 ? 1 : 0);
      xt += Ht, q.push(xt);
    }
  }
  const oe = new Uint8Array(xt);
  let ln = 0;
  for (const K of X)
    if (K !== null) {
      for (let it = 0; it < K.length; it++)
        oe[ln++] = K[it];
      K.length % 2 && ln++;
    }
  return { glyfBytes: oe, locaOffsets: q, indexFormat: a };
}
function ox(t, e, n, o, s) {
  const r = t;
  let i = 0;
  const a = r[i++], c = !(a & 1), f = !(a & 2), l = [];
  for (let m = 0; m < e; m++)
    l.push(r[i] << 8 | r[i + 1]), i += 2;
  const u = [];
  if (c)
    for (let m = 0; m < e; m++)
      u.push(at(r, i)), i += 2;
  else
    for (let m = 0; m < e; m++)
      u.push(Ii(o, s, m));
  const h = n - e, p = [];
  if (f)
    for (let m = 0; m < h; m++)
      p.push(at(r, i)), i += 2;
  else
    for (let m = 0; m < h; m++)
      p.push(
        Ii(o, s, e + m)
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
function Ii(t, e, n) {
  const o = e[n], s = e[n + 1];
  return o === s ? 0 : at(t, o + 2);
}
function sx(t, e) {
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
function yf(t) {
  pf();
  const e = new Uint8Array(t), n = new DataView(t);
  if (n.getUint32(0) !== df)
    throw new Error("Invalid WOFF2 signature");
  const s = n.getUint32(4), r = n.getUint16(12), i = n.getUint32(20), a = n.getUint32(28), c = n.getUint32(32), f = n.getUint32(40), l = n.getUint32(44);
  let u = hs;
  const h = [];
  for (let T = 0; T < r; T++) {
    const D = e[u++], R = D & 63, M = D >> 6 & 3;
    let L;
    R === 63 ? (L = String.fromCharCode(
      e[u],
      e[u + 1],
      e[u + 2],
      e[u + 3]
    ), u += 4) : L = gs[R];
    const { value: H, bytesRead: P } = Ci(
      e,
      u
    );
    u += P;
    let Y = H;
    const X = L === "glyf" || L === "loca", q = L === "hmtx";
    if (X && M === 0 || q && M === 1 || !X && !q && M !== 0) {
      const { value: oe, bytesRead: ln } = Ci(e, u);
      u += ln, Y = oe;
    }
    L === "loca" && M === 0 && (Y = 0), h.push({
      tag: L,
      transformVersion: M,
      origLength: H,
      transformLength: Y,
      isTransformed: X ? M === 0 : q ? M === 1 : M !== 0
    });
  }
  let p = null;
  if (s === 1953784678) {
    const T = At(e, u);
    u += 4;
    const { value: D, bytesRead: R } = xe(e, u);
    u += R;
    const M = [];
    for (let L = 0; L < D; L++) {
      const { value: H, bytesRead: P } = xe(
        e,
        u
      );
      u += P;
      const Y = At(e, u);
      u += 4;
      const X = [];
      for (let q = 0; q < H; q++) {
        const { value: xt, bytesRead: oe } = xe(e, u);
        u += oe, X.push(xt);
      }
      M.push({
        numTables: H,
        flavor: Y,
        tableIndices: X
      });
    }
    p = { version: T, numFonts: D, fonts: M };
  }
  const g = u, d = e.subarray(
    g,
    g + i
  ), x = ye(d);
  let m = 0;
  const y = /* @__PURE__ */ new Map();
  for (const T of h) {
    const D = T.isTransformed ? T.transformLength : T.origLength, R = x.subarray(m, m + D);
    m += D, y.set(T.tag, { data: R, entry: T });
  }
  const w = /* @__PURE__ */ new Map();
  let S = null;
  const _ = y.get("glyf"), b = y.get("loca");
  _ && _.entry.isTransformed && (b && b.entry.origLength, S = nx(_.data), w.set("glyf", S.glyfBytes), w.set(
    "loca",
    sx(S.locaOffsets, S.indexFormat)
  ));
  const A = y.get("hmtx");
  if (A && A.entry.isTransformed && S) {
    const T = y.get("hhea"), D = y.get("maxp");
    let R = 0, M = 0;
    T && (R = T.data[34] << 8 | T.data[35]), D && (M = D.data[4] << 8 | D.data[5]), w.set(
      "hmtx",
      ox(
        A.data,
        R,
        M,
        S.glyfBytes,
        S.locaOffsets
      )
    );
  }
  const k = [];
  for (const T of h) {
    const D = T.tag;
    let R;
    w.has(D) ? R = w.get(D) : R = y.get(D).data, k.push({ tag: D, data: R, length: R.length });
  }
  let O;
  p ? O = rx(p, k) : O = xf(s, k);
  let v = null;
  if (a && c) {
    const T = e.subarray(a, a + c);
    v = ye(T);
  }
  let E = null;
  return f && l && (E = e.slice(f, f + l)), { sfnt: O.buffer, metadata: v, privateData: E };
}
function xf(t, e) {
  const n = e.length, { searchRange: o, entrySelector: s, rangeShift: r } = ix(n), i = on + n * sn;
  let a = i + (4 - i % 4) % 4;
  const c = e.map((h, p) => ({ ...h, index: p })).sort((h, p) => h.tag < p.tag ? -1 : h.tag > p.tag ? 1 : 0);
  let f = a;
  for (const h of c)
    f += h.length + (4 - h.length % 4) % 4;
  const l = new Uint8Array(f), u = new DataView(l.buffer);
  u.setUint32(0, t), u.setUint16(4, n), u.setUint16(6, o), u.setUint16(8, s), u.setUint16(10, r);
  for (let h = 0; h < c.length; h++) {
    const p = c[h], g = on + h * sn;
    for (let x = 0; x < 4; x++)
      l[g + x] = p.tag.charCodeAt(x);
    const d = Sf(p.data);
    u.setUint32(g + 4, d), u.setUint32(g + 8, a), u.setUint32(g + 12, p.length), l.set(
      p.data instanceof Uint8Array ? p.data : new Uint8Array(p.data),
      a
    ), a += p.length + (4 - p.length % 4) % 4;
  }
  return ax(l, c), l;
}
function rx(t, e, n) {
  const o = [];
  for (const u of t.fonts) {
    const h = u.tableIndices.map((g) => e[g]), p = xf(u.flavor, h);
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
function ps(t, e = null, n = null) {
  pf();
  const o = new DataView(t), s = new Uint8Array(t), r = o.getUint32(0), i = o.getUint16(4), a = [];
  for (let R = 0; R < i; R++) {
    const M = on + R * sn, L = String.fromCharCode(
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
  let u = on + c.length * sn;
  for (const R of c) {
    const M = s.subarray(R.offset, R.offset + R.length), L = mf.get(R.tag), P = R.tag === "glyf" || R.tag === "loca" ? 3 : 0, X = [(L !== void 0 ? L : 63) | P << 6];
    if (L === void 0)
      for (let q = 0; q < 4; q++) X.push(R.tag.charCodeAt(q));
    X.push(...qy(R.length)), f.push(X), l.push(M), u += R.length + (4 - R.length % 4) % 4;
  }
  let h = 0;
  for (const R of l) h += R.length;
  const p = new Uint8Array(h);
  let g = 0;
  for (const R of l)
    p.set(R, g), g += R.length;
  const d = Hn(p);
  let x = null, m = 0;
  e && e.length > 0 && (m = e.length, x = Hn(e));
  const y = [];
  for (const R of f) y.push(...R);
  let S = hs + y.length;
  const _ = S;
  S += d.length;
  let b = 0, A = 0;
  x && (S += (4 - S % 4) % 4, b = S, A = x.length, S += A);
  let k = 0, O = 0;
  n && n.length > 0 && (S += (4 - S % 4) % 4, k = S, O = n.length, S += O);
  const v = S, E = new ArrayBuffer(v), T = new DataView(E), D = new Uint8Array(E);
  T.setUint32(0, df), T.setUint32(4, r), T.setUint32(8, v), T.setUint16(12, c.length), T.setUint16(14, 0), T.setUint32(16, u), T.setUint32(20, d.length), T.setUint16(24, 0), T.setUint16(26, 0), T.setUint32(28, b), T.setUint32(32, A), T.setUint32(36, m), T.setUint32(40, k), T.setUint32(44, O);
  for (let R = 0; R < y.length; R++)
    D[hs + R] = y[R];
  return D.set(
    d instanceof Uint8Array ? d : new Uint8Array(d),
    _
  ), x && D.set(
    x instanceof Uint8Array ? x : new Uint8Array(x),
    b
  ), n && n.length > 0 && D.set(n, k), E;
}
function At(t, e) {
  return (t[e] << 24 | t[e + 1] << 16 | t[e + 2] << 8 | t[e + 3]) >>> 0;
}
function at(t, e) {
  const n = t[e] << 8 | t[e + 1];
  return n > 32767 ? n - 65536 : n;
}
function pt(t, e) {
  const n = e & 65535;
  t.push(n >> 8 & 255, n & 255);
}
function ds(t, e) {
  t.push(e >> 8 & 255, e & 255);
}
function ix(t) {
  let e = 1, n = 0;
  for (; e * 2 <= t; )
    e *= 2, n++;
  e *= 16;
  const o = t * 16 - e;
  return { searchRange: e, entrySelector: n, rangeShift: o };
}
function Sf(t) {
  let e = 0;
  const n = t.length, o = n + (4 - n % 4) % 4;
  for (let s = 0; s < o; s += 4)
    e = e + ((t[s] || 0) << 24 | (t[s + 1] || 0) << 16 | (t[s + 2] || 0) << 8 | (t[s + 3] || 0)) >>> 0;
  return e;
}
function ax(t, e) {
  let n = -1;
  for (const r of e)
    if (r.tag === "head") {
      const i = t[4] << 8 | t[5];
      for (let a = 0; a < i; a++) {
        const c = on + a * sn;
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
  const s = 2981146554 - Sf(t) >>> 0;
  t[n + 8] = s >> 24 & 255, t[n + 9] = s >> 16 & 255, t[n + 10] = s >> 8 & 255, t[n + 11] = s & 255;
}
const cx = {
  cmap: e0,
  head: Ha,
  hhea: Qg,
  HVAR: rp,
  hmtx: ep,
  maxp: Up,
  MVAR: Xp,
  name: nd,
  hdmx: Zg,
  BASE: Ah,
  JSTF: mp,
  MATH: $p,
  MERG: Hp,
  meta: Yp,
  DSIG: U0,
  LTSH: Lp,
  CBLC: de,
  CBDT: ws,
  "OS/2": sd,
  kern: Ip,
  PCLT: ad,
  VDMX: Id,
  post: ic,
  STAT: yd,
  "CFF ": xa,
  CFF2: Pu,
  VORG: Wu,
  fvar: J0,
  avar: Zu,
  loca: kc,
  glyf: f1,
  gvar: y1,
  GDEF: sg,
  GPOS: Sg,
  GSUB: $g,
  "cvt ": t1,
  cvar: Jd,
  fpgm: n1,
  prep: w1,
  gasp: s1,
  vhea: Td,
  VVAR: Bd,
  vmtx: Rd,
  COLR: B0,
  CPAL: $0,
  EBDT: W0,
  EBLC: Y0,
  EBSC: X0,
  bloc: Gh,
  bdat: Rh,
  sbix: hd,
  ltag: Fp,
  "SVG ": _d
}, vi = 12, Oi = 16;
function fx(t, e) {
  const n = t.padEnd(4, " "), o = e.padEnd(4, " ");
  for (let s = 0; s < 4; s++) {
    const r = n.charCodeAt(s) - o.charCodeAt(s);
    if (r !== 0) return r;
  }
  return 0;
}
function lx(t) {
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
const ux = /* @__PURE__ */ new Set(["sfnt", "woff", "woff2", "cff"]);
function hx(t) {
  if (t._standalone === "cff") return "cff";
  const e = t._woff?.version;
  return e === 2 ? "woff2" : e === 1 ? "woff" : "sfnt";
}
function ki(t, e = {}) {
  if (!t || typeof t != "object")
    throw new TypeError("exportFont expects a font data object");
  const n = e.format ? e.format.toLowerCase() : hx(t);
  if (!ux.has(n))
    throw new Error(
      `Unknown export format "${n}". Supported: sfnt, woff, woff2, cff.`
    );
  if (px(t)) {
    if (n === "cff")
      throw new Error("CFF export does not support font collections.");
    if (e.split)
      return gx(t, n);
    const r = yx(t);
    return n === "woff" ? us(
      r,
      t._woff?.metadata,
      t._woff?.privateData
    ) : n === "woff2" ? ps(
      r,
      t._woff?.metadata,
      t._woff?.privateData
    ) : r;
  }
  if (n === "cff") {
    const i = Wn(t).tables["CFF "];
    if (!i)
      throw new Error(
        "CFF export requires CFF glyph data. This font uses TrueType outlines."
      );
    const a = xa(i), c = new ArrayBuffer(a.length);
    return new Uint8Array(c).set(a), c;
  }
  const o = Wn(t), s = jn(o, 0);
  if (n === "woff") {
    const r = t._woff?.metadata ?? null, i = t._woff?.privateData ?? null;
    return us(s, r, i);
  }
  if (n === "woff2") {
    const r = t._woff?.metadata ?? null, i = t._woff?.privateData ?? null;
    return ps(s, r, i);
  }
  return s;
}
function gx(t, e) {
  const { fonts: n } = t;
  if (!Array.isArray(n) || n.length === 0)
    throw new Error("Collection split expects a non-empty fonts array");
  return n.map((o) => {
    const s = Wn(o), r = jn(s, 0);
    return e === "woff" ? us(r) : e === "woff2" ? ps(r) : r;
  });
}
function px(t) {
  return t.collection && t.collection.tag === "ttcf" && Array.isArray(t.fonts);
}
function Ei(t, e) {
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
function dx(t, e) {
  const n = e?.unitsPerEm || 1e3;
  if (n === 1e3) return;
  const o = t?.fonts?.[0];
  if (!o) return;
  o.topDict = o.topDict || {};
  const s = 1 / n, r = o.topDict.FontMatrix;
  Array.isArray(r) && r.length === 6 && Math.abs(r[0] - s) < 1e-9 && r[1] === 0 && r[2] === 0 && Math.abs(r[3] - s) < 1e-9 || (o.topDict.FontMatrix = [s, 0, 0, s, 0, 0]);
}
function mx(t, e) {
  const n = t?.fonts?.[0];
  if (!n || !Array.isArray(n.charStrings)) return;
  const o = t.globalSubrs || [], s = n.localSubrs || [], r = n.privateDict?.nominalWidthX ?? 0, i = n.privateDict?.defaultWidthX ?? 0, a = Math.min(n.charStrings.length, e.length);
  for (let c = 0; c < a; c++) {
    const f = e[c]?.advanceWidth;
    Number.isFinite(f) && (n.charStrings[c] = ra(n.charStrings[c], f, {
      globalSubrs: o,
      localSubrs: s,
      nominalWidthX: r,
      defaultWidthX: i
    }));
  }
}
function Wn(t) {
  if (t.header && t.tables)
    return t;
  if (t._header && t.tables && t.font && t.glyphs) {
    const e = qs(t);
    for (const [n, o] of Object.entries(t.tables))
      !el.has(n) && !e.tables[n] && (e.tables[n] = o);
    return t.tables["CFF "] && e.tables["CFF "] && Ei(t.tables["CFF "], t.glyphs) && (e.tables["CFF "] = t.tables["CFF "], dx(e.tables["CFF "], t.font), mx(e.tables["CFF "], t.glyphs)), t.tables.CFF2 && e.tables.CFF2 && Ei(t.tables.CFF2, t.glyphs) && (e.tables.CFF2 = t.tables.CFF2), e;
  }
  if (t._header && t.tables)
    return { header: t._header, tables: t.tables };
  if (t.font && t.glyphs)
    return qs(t);
  throw new Error(
    "exportFont: input must have { header, tables } or { font, glyphs }"
  );
}
function jn(t, e) {
  const { header: n, tables: o } = t, s = Object.keys(o).sort(fx), r = s.length, i = xx(o), a = s.map((y) => {
    const w = o[y];
    let S;
    if (i.has(y))
      S = i.get(y);
    else if (w._raw)
      S = w._raw;
    else {
      const A = cx[y];
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
      checksum: b ? w._checksum >>> 0 : lx(_)
    };
  }), c = vi + r * Oi;
  let f = c + (4 - c % 4) % 4;
  for (const y of a)
    y.offset = f, f += y.paddedLength;
  const l = f, u = new ArrayBuffer(l), h = new DataView(u), p = new Uint8Array(u), g = r > 0 ? 2 ** Math.floor(Math.log2(r)) : 0, d = g * 16, x = g > 0 ? Math.floor(Math.log2(g)) : 0, m = r * 16 - d;
  h.setUint32(0, n.sfVersion), h.setUint16(4, r), h.setUint16(6, d), h.setUint16(8, x), h.setUint16(10, m);
  for (let y = 0; y < a.length; y++) {
    const w = a[y], S = vi + y * Oi;
    for (let _ = 0; _ < 4; _++)
      h.setUint8(S + _, w.tag.charCodeAt(_));
    h.setUint32(S + 4, w.checksum), h.setUint32(S + 8, w.offset + e), h.setUint32(S + 12, w.length);
  }
  for (const y of a)
    p.set(y.data, y.offset);
  return u;
}
function yx(t) {
  const { collection: e, fonts: n } = t;
  if (!Array.isArray(n) || n.length === 0)
    throw new Error("TTC/OTC export expects a non-empty fonts array");
  const o = n.map((m) => Wn(m)), s = e.majorVersion ?? 2, r = e.minorVersion ?? 0, i = o.length, a = s >= 2, c = 12 + i * 4 + (a ? 12 : 0);
  let f = c + (4 - c % 4) % 4;
  const u = o.map(
    (m) => new Uint8Array(jn(m, 0))
  ).map((m) => {
    const y = f;
    return f += m.length, f += (4 - f % 4) % 4, y;
  }), h = o.map(
    (m, y) => new Uint8Array(jn(m, u[y]))
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
function xx(t) {
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
      e.set("post", ic(h));
    }
  }
  const o = t.glyf && !t.glyf._raw, s = t.loca && !t.loca._raw;
  if (o && s) {
    const { bytes: u, offsets: h } = Oc(t.glyf);
    if (e.set("glyf", u), e.set("loca", kc({ offsets: h })), t.head && !t.head._raw) {
      const g = h.every((d) => d % 2 === 0 && d / 2 <= 65535) ? 0 : 1;
      t.head.indexToLocFormat !== g && e.set(
        "head",
        Ha({ ...t.head, indexToLocFormat: g })
      );
    }
  }
  const r = t.CBLC && !t.CBLC._raw && t.CBLC.sizes, i = t.CBDT && !t.CBDT._raw && t.CBDT.bitmapData;
  if (r && i) {
    const { bytes: u, offsetInfo: h } = go(
      t.CBDT,
      t.CBLC
    );
    e.set("CBDT", u), e.set("CBLC", de(t.CBLC, h));
  }
  const a = t.EBLC && !t.EBLC._raw && t.EBLC.sizes, c = t.EBDT && !t.EBDT._raw && t.EBDT.bitmapData;
  if (a && c) {
    const { bytes: u, offsetInfo: h } = go(t.EBDT, t.EBLC);
    e.set("EBDT", u), e.set("EBLC", de(t.EBLC, h));
  }
  const f = t.bloc && !t.bloc._raw && t.bloc.sizes, l = t.bdat && !t.bdat._raw && t.bdat.bitmapData;
  if (f && l) {
    const { bytes: u, offsetInfo: h } = go(t.bdat, t.bloc);
    e.set("bdat", u), e.set("bloc", de(t.bloc, h));
  }
  return e;
}
const _f = {
  cmap: Ph,
  head: jo,
  hhea: Jg,
  HVAR: op,
  hmtx: tp,
  maxp: Pp,
  MVAR: Zp,
  name: ed,
  hdmx: Yg,
  BASE: yh,
  JSTF: dp,
  MATH: Vp,
  MERG: zp,
  meta: jp,
  DSIG: P0,
  LTSH: Mp,
  CBLC: bs,
  CBDT: _s,
  "OS/2": od,
  kern: Sp,
  PCLT: id,
  VDMX: Cd,
  post: cd,
  STAT: dd,
  "CFF ": ya,
  CFF2: Gu,
  VORG: Hu,
  fvar: K0,
  avar: Yu,
  loca: S1,
  glyf: r1,
  gvar: d1,
  GDEF: Q0,
  GPOS: ug,
  GSUB: Dg,
  "cvt ": Qd,
  cvar: Kd,
  fpgm: e1,
  prep: _1,
  gasp: o1,
  vhea: Ed,
  VVAR: Md,
  vmtx: Dd,
  COLR: L0,
  CPAL: V0,
  EBLC: j0,
  EBDT: H0,
  EBSC: Z0,
  bloc: Nh,
  bdat: Dh,
  sbix: ud,
  ltag: Rp,
  "SVG ": Sd
}, wf = [
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
function Yn(t) {
  if (!(t instanceof ArrayBuffer))
    throw new TypeError("importFont expects an ArrayBuffer");
  const e = new Uint8Array(t);
  if (e.length >= 4) {
    const o = String.fromCharCode(e[0], e[1], e[2], e[3]);
    if (o === "wOFF") {
      const { sfnt: s, metadata: r, privateData: i } = hf(t), a = Yn(s);
      return a._woff = { version: 1 }, r && (a._woff.metadata = r), i && (a._woff.privateData = i), a;
    }
    if (o === "wOF2") {
      const { sfnt: s, metadata: r, privateData: i } = yf(t), a = Yn(s);
      return a._woff = { version: 2 }, r && (a._woff.metadata = r), i && (a._woff.privateData = i), a;
    }
    if (o === "ttcf")
      return _x(t);
  }
  if (e.length >= 4 && e[0] === 1 && e[1] === 0 && e[3] >= 1 && e[3] <= 4)
    return bx(t);
  if (e.length >= 6 && e[0] === 128 && (e[1] === 1 || e[1] === 2))
    return Ax(t);
  if (e.length >= 2 && e[0] === 37 && e[1] === 33)
    return Cx(t);
  const n = Sx(t);
  return Ss(n);
}
function Sx(t) {
  if (!(t instanceof ArrayBuffer))
    throw new TypeError("importFontTables expects an ArrayBuffer");
  const e = new F(new Uint8Array(t)), n = bf(e), o = Af(e, n.numTables), s = Cf(t, o);
  return { header: n, tables: s };
}
function _x(t) {
  const e = new F(new Uint8Array(t)), n = e.tag();
  if (n !== "ttcf")
    throw new Error("Invalid TTC/OTC collection signature");
  const o = e.uint16(), s = e.uint16(), r = e.uint32(), i = e.array("uint32", r);
  let a, c, f;
  o >= 2 && (a = e.uint32(), c = e.uint32(), f = e.uint32());
  const l = i.map((h) => {
    const p = new F(new Uint8Array(t), h), g = bf(p), d = Af(p, g.numTables), x = wx(
      t,
      d,
      h
    ), m = Cf(t, x);
    return Ss({ header: g, tables: m });
  }), u = {
    tag: n,
    majorVersion: o,
    minorVersion: s,
    numFonts: r
  };
  return o >= 2 && (u.dsigTag = a, u.dsigLength = c, u.dsigOffset = f), { collection: u, fonts: l };
}
function wx(t, e, n) {
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
  const c = jo(
    Array.from(new Uint8Array(t, s, o.length))
  ), f = jo(
    Array.from(new Uint8Array(t, r, o.length))
  ), l = c.magicNumber === 1594834165;
  return f.magicNumber === 1594834165 && !l ? e.map((h) => ({
    ...h,
    offset: n + h.offset
  })) : e;
}
function bf(t) {
  return {
    sfVersion: t.uint32(),
    numTables: t.uint16(),
    searchRange: t.uint16(),
    entrySelector: t.uint16(),
    rangeShift: t.uint16()
  };
}
function Af(t, e) {
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
function Cf(t, e) {
  const n = {}, o = new Map(e.map((a) => [a.tag, a])), s = wf.filter((a) => o.has(a)), r = e.map((a) => a.tag).filter((a) => !s.includes(a)), i = [...s, ...r];
  for (const a of i) {
    const c = o.get(a), f = c.offset, l = new Uint8Array(t, f, c.length), u = Array.from(l), h = _f[a];
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
function bx(t) {
  const e = Array.from(new Uint8Array(t)), n = ya(e), o = n.fonts[0], s = o?.topDict || {}, r = o?.charStrings || [], i = r.length, a = s.FontBBox || [0, 0, 1e3, 1e3], c = a[3] - a[1] || 1e3, f = n.names && n.names[0] || "CFFFont", l = {
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
        const b = Zn(r[y], S, _);
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
  const m = Ss({ header: { sfVersion: 1330926671 }, tables: l });
  return m._standalone = "cff", m;
}
function Ax(t) {
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
  const r = Di(n), i = Di(o), a = new TextDecoder("latin1").decode(r);
  return If(a, i);
}
function Cx(t) {
  const e = new TextDecoder("latin1").decode(new Uint8Array(t)), n = "currentfile eexec", o = e.indexOf(n);
  if (o === -1)
    throw new Error('PFA: could not find "currentfile eexec" marker');
  const s = e.slice(0, o + n.length), i = e.slice(o + n.length).replace(/\s/g, ""), a = i.search(/0{64,}$/), c = a > 0 ? i.slice(0, a) : i, f = new Uint8Array(c.length / 2);
  for (let l = 0; l < f.length; l++)
    f[l] = parseInt(c.slice(l * 2, l * 2 + 2), 16);
  return If(s, f);
}
function Bs(t, e, n) {
  const o = new Uint8Array(t.length);
  let s = e;
  const r = 52845, i = 22719;
  for (let a = 0; a < t.length; a++) {
    const c = t[a];
    o[a] = c ^ s >>> 8, s = (c + s) * r + i & 65535;
  }
  return o.slice(n);
}
function Ti(t, e) {
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
          const S = n.pop() || 0, _ = n.pop() || 0, b = n.pop() || 0, A = n.pop() || 0, k = n.pop() || 0, O = n.pop() || 0, v = i + O, E = a + k, T = v + A, D = E + b;
          i = T + _, a = D + S, g(v, E, T, D, i, a), n.length = 0;
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
          const S = n.pop() || 0, _ = n.pop() || 0, b = n.pop() || 0, A = n.pop() || 0, k = i, O = a + A, v = k + b, E = O + _;
          i = v + S, a = E, g(k, O, v, E, i, a), n.length = 0;
          break;
        }
        case 31: {
          const S = n.pop() || 0, _ = n.pop() || 0, b = n.pop() || 0, A = n.pop() || 0, k = i + A, O = a, v = k + b, E = O + _;
          i = v, a = E + S, g(k, O, v, E, i, a), n.length = 0;
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
function Ix(t) {
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
  return i && (e.FontMatrix = i.slice(1, 7).map(Number)), e.encoding = vx(t), e;
}
function vx(t) {
  const e = /* @__PURE__ */ new Map(), n = /dup\s+(\d+)\s+\/([^\s]+)\s+put/g;
  let o;
  for (; (o = n.exec(t)) !== null; )
    e.set(parseInt(o[1]), o[2]);
  return e;
}
function Ox(t) {
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
    kx(
      u,
      t.slice(Tn(t, a.index)),
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
      Tn(t, f.index)
    ), h = /\/([^\s]+)\s+(\d+)\s+(?:RD|-\|)\s/g;
    let p;
    for (; (p = h.exec(l)) !== null; ) {
      const g = p[1], d = parseInt(p[2]), x = p.index + p[0].length, m = Tn(u, x), y = u.slice(m, m + d), w = Bs(y, 4330, o);
      c.set(g, w);
    }
  }
  return { charStrings: c, subrs: i, privateDict: s };
}
function kx(t, e, n, o, s) {
  const r = /dup\s+(\d+)\s+(\d+)\s+(?:RD|-\|)\s/g;
  let i;
  for (; (i = r.exec(t)) !== null; ) {
    const a = parseInt(i[1]), c = parseInt(i[2]), f = i.index + i[0].length, l = Tn(e, f), u = e.slice(l, l + c), h = Bs(u, 4330, o);
    s(a, h);
  }
}
function Tn(t, e) {
  return e;
}
function If(t, e) {
  const n = Bs(e, 55665, 4), o = Ix(t), { charStrings: s, subrs: r } = Ox(n), i = o.FontBBox || [0, 0, 1e3, 1e3], a = o.FontMatrix || [1e-3, 0, 0, 1e-3, 0, 0], c = Math.round(1 / a[0]), f = o.FontName || o.FamilyName || "Type1Font", l = i[3], u = i[1], h = [];
  if (s.has(".notdef")) {
    const d = Ti(s.get(".notdef"), r);
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
    const m = Ti(x, r), y = p.get(d) ?? null;
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
function Di(t) {
  const e = t.reduce((s, r) => s + r.length, 0), n = new Uint8Array(e);
  let o = 0;
  for (const s of t)
    n.set(s, o), o += s.length;
  return n;
}
const Ex = /* @__PURE__ */ new Set([
  "_dirty",
  "_fileName",
  "_originalBuffer",
  "_collection",
  "_collectionFonts",
  "_woff"
]);
function Tx(t, e = 2) {
  return JSON.stringify(
    t,
    function(n, o) {
      if (!(this === t && Ex.has(n)))
        return typeof o == "bigint" ? Number(o) : ArrayBuffer.isView(o) && !(o instanceof DataView) ? Array.from(o) : o;
    },
    e
  );
}
function Bo(t) {
  return JSON.parse(t);
}
function Dx(t) {
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
      Ri(r.left, r.right, r.value, n, o);
    else if (r.left !== void 0 && r.pairs) {
      const i = pe(r.left, n);
      for (const [a, c] of Object.entries(r.pairs)) {
        const f = pe(a, n);
        for (const l of i)
          for (const u of f)
            o.push({ left: l, right: u, value: c });
      }
    } else if (r.groups)
      for (const [i, a] of Object.entries(r.groups)) {
        const c = pe(i, n);
        for (const [f, l] of Object.entries(a)) {
          const u = pe(f, n);
          for (const h of c)
            for (const p of u)
              o.push({ left: h, right: p, value: l });
        }
      }
    else if (r.classes && r.pairs)
      for (const i of r.pairs)
        Ri(i.left, i.right, i.value, n, o);
  const s = /* @__PURE__ */ new Map();
  for (const r of o)
    s.set(`${r.left}\0${r.right}`, r);
  return [...s.values()];
}
function Ri(t, e, n, o, s) {
  const r = pe(t, o), i = pe(e, o);
  for (const a of r)
    for (const c of i)
      s.push({ left: a, right: c, value: n });
}
function Rx(t, e, n) {
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
function pe(t, e) {
  if (typeof t == "string" && t.startsWith("@")) {
    const n = t.slice(1), o = e[n];
    if (!o)
      throw new Error(`createKerning: unknown class "@${n}"`);
    return o;
  }
  return [t];
}
function Fx(t) {
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
            to: Fe(l.to, n)
          });
          break;
        case "alternate":
          o.push({
            ...u,
            from: Wt(l.from, n),
            alternates: Fe(l.alternates, n)
          });
          break;
        case "ligature":
          o.push({
            ...u,
            components: Fe(l.components, n),
            ligature: Wt(l.ligature, n)
          });
          break;
        case "reverse":
          o.push({
            ...u,
            from: Wt(l.from, n),
            to: Wt(l.to, n),
            backtrack: (l.backtrack || []).map(
              (h) => Fe(h, n)
            ),
            lookahead: (l.lookahead || []).map(
              (h) => Fe(h, n)
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
function Mx(t, e, n = {}) {
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
function Wt(t, e) {
  if (typeof t == "string" && t.startsWith("@")) {
    const n = t.slice(1), o = e[n];
    if (!o)
      throw new Error(`createSubstitution: unknown class "@${n}"`);
    return o;
  }
  return t;
}
function Fe(t, e) {
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
const Lx = [
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
], Bx = ["CFF ", "CFF2", "VORG"], Vx = [
  "cvar",
  "cvt ",
  "fpgm",
  "gasp",
  "glyf",
  "gvar",
  "loca",
  "prep"
], vf = /* @__PURE__ */ new Set([
  ...Lx,
  ...Bx,
  ...Vx
]), Of = [
  "cmap",
  "head",
  "hhea",
  "hmtx",
  "maxp",
  "name",
  "post"
], $x = /* @__PURE__ */ new Map([
  [65536, "TrueType"],
  [1330926671, "OpenType (CFF)"],
  // 'OTTO'
  [1953658213, "TrueType (Apple)"]
  // 'true'
]);
function C(t, e, n, o) {
  t.push({ severity: e, code: n, message: o });
}
function Et(t) {
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
function Nx(t) {
  for (let e = 0; e < t.length; e++) {
    const n = t.charCodeAt(e);
    if (n < 32 || n > 126) return !1;
  }
  return !0;
}
function Gx(t, e, n) {
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
function Px(t, e) {
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
    C(e, "info", "FORMAT_WOFF1", "File is WOFF1-wrapped."), tS(t, e);
    try {
      const { sfnt: s } = hf(t);
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
    C(e, "info", "FORMAT_WOFF2", "File is WOFF2-wrapped."), eS(t, e);
    try {
      const { sfnt: s } = yf(t);
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
function Ux(t, e) {
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
  const r = $x.get(s.sfVersion);
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
function zx(t, e, n) {
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
    if (!Nx(l.tag)) {
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
function Hx(t, e) {
  const n = new Set(t.map((r) => r.tag));
  for (const r of Of)
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
    vf.has(r) || C(
      e,
      "info",
      "UNKNOWN_TABLE",
      `Unrecognized table '${r}' — will be preserved as raw bytes.`
    );
}
function Wx(t, e, n) {
  const o = new Uint8Array(t);
  for (const s of e) {
    if (s.offset + s.length > t.byteLength || s.length === 0 || s.tag === "head") continue;
    const r = Gx(o, s.offset, s.length);
    r !== s.checksum && C(
      n,
      "warning",
      "BAD_CHECKSUM",
      `Table '${s.tag}' checksum mismatch: directory says 0x${s.checksum.toString(16).padStart(8, "0")}, computed 0x${r.toString(16).padStart(8, "0")}.`
    );
  }
}
function jx(t, e, n) {
  const o = new Map(e.map((c) => [c.tag, c])), s = {}, r = wf.filter((c) => o.has(c)), i = e.map((c) => c.tag).filter((c) => !r.includes(c)), a = [...r, ...i];
  for (const c of a) {
    const f = o.get(c);
    if (f.offset + f.length > t.byteLength) continue;
    const l = _f[c];
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
function Yx(t) {
  return t >= 6155 && t <= 6157 || t >= 65024 && t <= 65039 || t >= 917760 && t <= 917999;
}
function Zx(t) {
  if (t.idRangeOffset === 0) {
    const e = t.startCode + t.idDelta & 65535, n = t.endCode + t.idDelta & 65535;
    return Math.max(e, n);
  }
  return null;
}
function Xx(t, e, n) {
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
          const m = Zx(x);
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
        if (!Yx(d.varSelector) && !p) {
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
const Fi = 783, Mi = 127;
function qx(t, e, n) {
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
  ), typeof t.fsType == "number" && (t.fsType & ~Fi) !== 0 && C(
    n,
    "warning",
    "OS2_FSTYPE_RESERVED_BITS_SET",
    `OS/2.fsType has reserved bits set (0x${(t.fsType >>> 0).toString(16).padStart(4, "0")}); valid mask is 0x${Fi.toString(16).padStart(4, "0")}.`
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
    ), (e.macStyle & ~Mi) !== 0 && C(
      n,
      "warning",
      "HEAD_MACSTYLE_RESERVED_BITS_SET",
      `head.macStyle has reserved bits set (0x${e.macStyle.toString(16).padStart(4, "0")}); valid mask is 0x${Mi.toString(16).padStart(4, "0")}.`
    );
  }
}
const Li = 32 * 1024, Bi = 200, Kx = /[\x00-\x20\x7F-\uFFFF[\](){}<>/%]/;
function Jx(t, e, n, o) {
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
      ), l = !0)), g > Li && C(
        o,
        "warning",
        "NAME_STRING_TOO_LONG",
        `name record ${h} (nameID=${i.getUint16(p + 6)}) is ${g} bytes; > ${Li} is suspicious.`
      );
    }
  }
  if (Array.isArray(t.langTagRecords))
    for (let i = 0; i < t.langTagRecords.length; i++) {
      const c = (t.langTagRecords[i].tag ?? "").length * 2;
      c > Bi && C(
        o,
        "error",
        "NAME_LANG_TAG_TOO_LONG",
        `name.langTagRecord ${i} is ${c} bytes; spec limit is ${Bi}.`
      );
    }
  const r = t.nameRecords ?? t.names ?? t.records ?? [];
  for (const i of r) {
    if (i.nameID !== 6) continue;
    const a = i.value ?? i.string ?? "";
    if (typeof a == "string" && Kx.test(a)) {
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
const Me = 44, bn = 20, Qx = 48;
function tS(t, e) {
  if (t.byteLength < Me) return;
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
  const u = Me + s * bn;
  if (u <= t.byteLength) {
    let p = 12 + 16 * s;
    for (let g = 0; g < s; g++) {
      const d = n.getUint32(
        Me + g * bn + 12
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
      const g = n.getUint32(Me + p * bn + 4), d = n.getUint32(
        Me + p * bn + 8
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
function eS(t, e) {
  if (t.byteLength < Qx) return;
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
const Vi = 224;
function nS(t, e) {
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
function $i(t, e, n) {
  const o = t?.lookupList?.lookups ?? [], s = 1, r = e === "GSUB" ? 8 : 9;
  let i = !1, a = !1;
  for (let c = 0; c < o.length; c++) {
    const f = o[c];
    if ((typeof f.lookupType != "number" || f.lookupType < s || f.lookupType > r) && (i || (C(
      n,
      "error",
      `${e}_LOOKUP_TYPE_INVALID`,
      `${e} lookup ${c} has invalid lookupType ${f.lookupType}; must be in [${s}, ${r}].`
    ), i = !0)), typeof f.lookupFlag == "number" && (f.lookupFlag & Vi) !== 0 && !a && (C(
      n,
      "warning",
      "LAYOUT_LOOKUP_FLAG_RESERVED",
      `${e} lookup ${c} has reserved bits set in lookupFlag (0x${f.lookupFlag.toString(16).padStart(
        4,
        "0"
      )}); reserved mask is 0x${Vi.toString(16).padStart(4, "0")}.`
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
const oS = 65534, sS = 65534;
function rS(t, e, n) {
  const o = t.axes ?? [], s = t.instances ?? [], r = /* @__PURE__ */ new Set();
  if (e && Array.isArray(e.names))
    for (const i of e.names)
      i && typeof i.nameID == "number" && r.add(i.nameID);
  for (let i = 0; i < o.length; i++) {
    const a = o[i];
    typeof a.flags == "number" && (a.flags & oS) !== 0 && C(
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
    typeof a.flags == "number" && (a.flags & sS) !== 0 && C(
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
function iS(t, e, n) {
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
function aS(t, e, n) {
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
function Vs(t, e, n, o) {
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
function cS(t, e, n) {
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
  Vs(o, e?.axes?.length ?? 0, "MVAR", n);
}
function Ni(t, e, n, o) {
  Vs(
    t.itemVariationStore,
    n?.axes?.length ?? 0,
    e,
    o
  );
}
function fS(t, e, n, o, s) {
  if (s ||= $s(), typeof t.majorVersion == "number" && t.majorVersion !== 1 && C(
    o,
    "error",
    "GDEF_VERSION_INVALID",
    `GDEF majorVersion must be 1, got ${t.majorVersion}.`
  ), t.glyphClassDef && ms(
    t.glyphClassDef,
    e,
    "GDEF.glyphClassDef",
    o,
    { maxClass: 4 },
    // 1=base, 2=ligature, 3=mark, 4=component
    s
  ), t.markAttachClassDef && ms(
    t.markAttachClassDef,
    e,
    "GDEF.markAttachClassDef",
    o,
    {},
    s
  ), t.attachList?.coverage && We(
    t.attachList.coverage,
    e,
    "GDEF.attachList.coverage",
    o,
    s
  ), t.ligCaretList?.coverage && We(
    t.ligCaretList.coverage,
    e,
    "GDEF.ligCaretList.coverage",
    o,
    s
  ), t.markGlyphSetsDef?.coverages)
    for (let r = 0; r < t.markGlyphSetsDef.coverages.length; r++)
      We(
        t.markGlyphSetsDef.coverages[r],
        e,
        `GDEF.markGlyphSetsDef.coverages[${r}]`,
        o,
        s
      );
  t.itemVariationStore && Vs(
    t.itemVariationStore,
    n?.axes?.length ?? 0,
    "GDEF",
    o
  );
}
function $s() {
  return { coverages: /* @__PURE__ */ new WeakSet(), classDefs: /* @__PURE__ */ new WeakSet() };
}
function We(t, e, n, o, s) {
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
function ms(t, e, n, o, s = {}, r) {
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
function Gi(t, e, n, o, s) {
  s ||= $s();
  const r = t?.lookupList?.lookups ?? [];
  for (let i = 0; i < r.length; i++) {
    const a = r[i], c = a.subtables ?? [];
    for (let f = 0; f < c.length; f++) {
      const l = c[f];
      if (!l || typeof l != "object") continue;
      const u = `${e} lookup ${i} (type ${a.lookupType}) subtable ${f}`;
      if (l.coverage && We(l.coverage, n, `${u}.coverage`, o, s), Array.isArray(l.coverages))
        for (let h = 0; h < l.coverages.length; h++)
          We(
            l.coverages[h],
            n,
            `${u}.coverages[${h}]`,
            o,
            s
          );
      if (l.classDef && ms(
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
function lS(t, e) {
  typeof t.version == "number" && t.version !== 65536 && C(
    e,
    "error",
    "MATH_VERSION_INVALID",
    `MATH table version must be 0x00010000, got 0x${t.version.toString(16).padStart(8, "0")}.`
  );
}
const uS = /* @__PURE__ */ new Set([
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
]), hS = /* @__PURE__ */ new Set([
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
]), gS = /* @__PURE__ */ new Set([
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
]), Pi = 10, Ui = 48, zi = 513;
function Hi(t, e, n, o = !1) {
  const s = o ? [
    {
      charStrings: t.charStrings || [],
      localSubrs: t.fontDicts?.[0]?.localSubrs || []
    }
  ] : t.fonts || [], r = t.globalSubrs || [], i = Wi(r.length), a = /* @__PURE__ */ new Set();
  function c(f, l, u) {
    a.has(f) || (a.add(f), C(n, l, f, u));
  }
  for (let f = 0; f < s.length; f++) {
    const l = s[f], u = l.charStrings || [], h = l.localSubrs || [], p = Wi(h.length);
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
      kf(
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
      ), x.maxStackSeen > (o ? zi : Ui) && c(
        "CFF_STACK_OVERFLOW",
        "error",
        `${e}: charstring for glyph ${g} pushed ${x.maxStackSeen} operands, exceeding the ${o ? "CFF2" : "Type 2"} limit of ${o ? zi : Ui}.`
      );
    }
  }
}
function Wi(t) {
  return t < 1240 ? 107 : t < 33900 ? 1131 : 32768;
}
function kf(t, e, n, o, s, r, i, a, c, f, l) {
  if (e.depth > Pi) {
    f(
      "CFF_SUBR_DEPTH_EXCEEDED",
      "error",
      `${i}: charstring for glyph ${c} exceeded subroutine recursion depth ${Pi}.`
    );
    return;
  }
  let u = 0;
  for (; u < t.length; ) {
    const h = t[u];
    if (h === 28 || h >= 32) {
      const g = pS(t, u);
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
      if (!gS.has(g)) {
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
    if (!(l ? hS : uS).has(h)) {
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
      e.depth++, kf(
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
function pS(t, e) {
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
const ji = 16;
function dS(t, e, n) {
  const o = t?.glyphs;
  if (!Array.isArray(o)) return;
  let s = !1, r = !1, i = !1;
  function a(c, f) {
    if (s || r) return;
    const l = o[c];
    if (!(!l || !Array.isArray(l.components))) {
      if (f.length >= ji) {
        r = !0, C(
          n,
          "error",
          "GLYF_COMPOSITE_DEPTH_EXCEEDED",
          `glyf composite glyph chain starting at glyph ${f[0]} exceeds maximum nesting depth ${ji}.`
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
function mS(t, e, n) {
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
const yS = [
  [6155, 6157],
  // Mongolian Free Variation Selectors
  [65024, 65039],
  // Variation Selectors
  [917760, 917999]
  // Variation Selectors Supplement
];
function xS(t, e) {
  const n = t?.subTables ?? t?.subtables ?? [];
  let o = !1, s = !1;
  for (const r of n) {
    if (r?.format !== 14) continue;
    const i = r.varSelectorRecords ?? r.variationSelectors ?? [];
    let a = -1;
    for (let c = 0; c < i.length; c++) {
      const f = i[c], l = f.varSelector ?? f.variationSelector;
      if (typeof l != "number") continue;
      !yS.some(
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
function SS(t, e) {
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
function Vo(t, e, n) {
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
function _S(t, e) {
  t.fpgm?.instructions && Vo(t.fpgm.instructions, "fpgm", e), t.prep?.instructions && Vo(t.prep.instructions, "prep", e);
  const n = t.glyf?.glyphs;
  if (Array.isArray(n)) {
    const o = e.length;
    for (let s = 0; s < n.length; s++) {
      const r = n[s]?.instructions;
      if (!(!r || r.length === 0) && (Vo(r, `glyf glyph ${s}`, e), e.length > o))
        break;
    }
  }
}
function wS(t, e, n, o) {
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
  if (t["OS/2"] && qx(t["OS/2"], t.head, n), t.maxp && t.hmtx) {
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
    Jx(t.name, e, o, n);
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
  t.cmap && Xx(t.cmap, t.maxp, n);
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
  const a = t.maxp?.numGlyphs ?? 0, c = t.fvar, f = $s();
  c && (nS(c, n), rS(c, t.name, n)), t.STAT && iS(t.STAT, c, n), t.avar && aS(t.avar, c, n), t.HVAR && Ni(t.HVAR, "HVAR", c, n), t.VVAR && Ni(t.VVAR, "VVAR", c, n), t.MVAR && cS(t.MVAR, c, n), t.GDEF && fS(t.GDEF, a, c, n, f), t.GSUB && ($i(t.GSUB, "GSUB", n), Gi(
    t.GSUB,
    "GSUB",
    a,
    n,
    f
  )), t.GPOS && ($i(t.GPOS, "GPOS", n), Gi(
    t.GPOS,
    "GPOS",
    a,
    n,
    f
  )), t.MATH && lS(t.MATH, n), t["CFF "] && Hi(t["CFF "], "CFF", n, !1), t.CFF2 && Hi(t.CFF2, "CFF2", n, !0), t.glyf && (dS(t.glyf, a, n), mS(t.glyf, t.head, n)), t.cmap && (xS(t.cmap, n), SS(t.cmap, n)), _S(t, n);
}
function bS(t) {
  const e = new F(new Uint8Array(t));
  e.skip(4);
  const n = e.uint16();
  e.skip(2);
  const o = e.uint32();
  if (o === 0) return null;
  const s = e.uint32();
  return { majorVersion: n, numFonts: o, firstOffset: s };
}
function AS(t) {
  const e = [];
  t && typeof t.byteLength == "number" && t.byteLength > 1073741824 && C(
    e,
    "error",
    "FILE_EXCEEDS_1GB",
    `Font file is ${t.byteLength} bytes (> 1 GiB); Firefox/OTS will reject it.`
  );
  const n = Px(t, e);
  if (!n) return Et(e);
  let o = n.sfnt;
  if (n.format === "collection")
    try {
      const a = bS(o);
      if (!a || a.numFonts === 0)
        return C(
          e,
          "error",
          "EMPTY_COLLECTION",
          "Collection contains no fonts."
        ), Et(e);
      if (a.majorVersion !== 1 && a.majorVersion !== 2)
        return C(
          e,
          "error",
          "TTC_VERSION_INVALID",
          `TTC majorVersion is ${a.majorVersion}; must be 1 or 2.`
        ), Et(e);
      if (a.numFonts > 65536)
        return C(
          e,
          "error",
          "TTC_TOO_MANY_FONTS",
          `TTC numFonts is ${a.numFonts}; must be ≤ 65536.`
        ), Et(e);
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
      ), Et(e);
    }
  const s = Ux(o, e);
  if (!s) return Et(e);
  const r = zx(o, s, e);
  if (r.length === 0 && s.numTables > 0)
    return C(
      e,
      "error",
      "NO_READABLE_ENTRIES",
      "Could not read any table directory entries."
    ), Et(e);
  Hx(r, e), Wx(o, r, e);
  const i = jx(o, r, e);
  return wS(i, r, e, o), Et(e);
}
function yt(t) {
  return t !== null && typeof t == "object" && !Array.isArray(t);
}
function Ef(t) {
  return Number.isInteger(t) && t >= 0 && t <= 4294967295;
}
function Tf(t) {
  return Array.isArray(t?._raw);
}
function N(t, e, n, o, s) {
  t.push({ severity: e, code: n, message: o, path: s });
}
function Yi(t) {
  const e = t > 0 ? 2 ** Math.floor(Math.log2(t)) : 0, n = e * 16, o = e > 0 ? Math.floor(Math.log2(e)) : 0, s = t * 16 - n;
  return { searchRange: n, entrySelector: o, rangeShift: s };
}
function Zi(t) {
  return yt(t) && (t["CFF "] || t.CFF2) ? 1330926671 : 65536;
}
function Xi(t) {
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
function CS(t, e, n, o) {
  let s = t.header;
  if (!yt(s))
    if (yt(t._header))
      t.header = { ...t._header }, s = t.header, N(
        o,
        "info",
        "HEADER_PROMOTED",
        'No "header" found; promoted "_header" for export compatibility.',
        n
      );
    else {
      const a = Zi(t.tables), c = Yi(e);
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
  if (!Ef(s.sfVersion)) {
    const a = Zi(t.tables);
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
  const r = Yi(e);
  (s.searchRange !== r.searchRange || s.entrySelector !== r.entrySelector || s.rangeShift !== r.rangeShift) && (s.searchRange = r.searchRange, s.entrySelector = r.entrySelector, s.rangeShift = r.rangeShift, N(
    o,
    "info",
    "HEADER_FIELDS_CORRECTED",
    `Header directory fields auto-corrected for ${e} tables (searchRange=${r.searchRange}, entrySelector=${r.entrySelector}, rangeShift=${r.rangeShift}).`,
    n
  ));
}
function IS(t, e, n) {
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
function vS(t, e, n) {
  if (!yt(t))
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
    if (!yt(r)) {
      N(
        n,
        "error",
        "TABLE_DATA_INVALID",
        `Table "${s}" must be an object.`,
        i
      );
      continue;
    }
    r._checksum !== void 0 && !Ef(r._checksum) && N(
      n,
      "error",
      "TABLE_CHECKSUM_INVALID",
      `Table "${s}" _checksum must be uint32 when provided.`,
      `${i}._checksum`
    ), r._raw !== void 0 && IS(r._raw, `${i}._raw`, n);
    const a = vf.has(s), c = Tf(r);
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
function OS(t, e, n) {
  const o = (i) => t[i] !== void 0, s = (i) => o(i) && !Tf(t[i]), r = (i, a, c = "requires") => {
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
function kS(t, e, n) {
  const o = (i) => t[i] !== void 0;
  for (const i of Of)
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
function Df(t, e, n) {
  if (!yt(t)) {
    N(
      n,
      "error",
      "FONTDATA_INVALID",
      "Font data must be an object.",
      e
    );
    return;
  }
  const o = vS(t.tables, `${e}.tables`, n);
  CS(t, o.length, `${e}.header`, n), yt(t.tables) && (kS(t.tables, `${e}.tables`, n), OS(t.tables, `${e}.tables`, n));
}
function ES(t, e, n) {
  const o = t.collection, s = t.fonts;
  if (yt(o) || N(
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
  yt(o) && o.numFonts !== void 0 && o.numFonts !== s.length && (o.numFonts = s.length, N(
    n,
    "info",
    "COLLECTION_NUMFONTS_CORRECTED",
    `collection.numFonts corrected to ${s.length} to match fonts array.`,
    `${e}.collection.numFonts`
  ));
  for (let r = 0; r < s.length; r++)
    Df(s[r], `${e}.fonts[${r}]`, n);
}
function TS(t) {
  const e = [];
  return yt(t) ? (t.collection !== void 0 || t.fonts !== void 0 ? ES(t, "$", e) : Df(t, "$", e), Xi(e)) : (N(
    e,
    "error",
    "INPUT_INVALID",
    "validateJSON expects a font JSON object.",
    "$"
  ), Xi(e));
}
function qi(t) {
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
const DS = {
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
class bt {
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
        { ...DS },
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
    return new bt(a);
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
    const n = qi(e);
    if (n.kind === "json") {
      const s = Bo(n.text);
      if (s && s.collection && Array.isArray(s.fonts))
        throw new Error(
          "FontFlux.open() received a font collection JSON. Use FontFlux.openAll() for collections."
        );
      return new bt(s);
    }
    const o = Yn(n.buffer);
    if (o.collection && o.fonts)
      throw new Error(
        "FontFlux.open() received a font collection (TTC/OTC). Use FontFlux.openAll() for collections."
      );
    return new bt(o);
  }
  /**
   * Open all fonts from a binary file or JSON. Works for both single fonts
   * and collections.  Accepts the same input types as `FontFlux.open()`.
   *
   * @param {ArrayBuffer|Uint8Array|string} input
   * @returns {FontFlux[]} Array of FontFlux instances (one per face).
   */
  static openAll(e) {
    const n = qi(e);
    if (n.kind === "json") {
      const s = Bo(n.text);
      return s && s.collection && Array.isArray(s.fonts) ? s.fonts.map((r) => new bt(r)) : [new bt(s)];
    }
    const o = Yn(n.buffer);
    return o.collection && o.fonts ? o.fonts.map((s) => new bt(s)) : [new bt(o)];
  }
  /**
   * Restore a font from a JSON string.
   *
   * @param {string} jsonString - JSON produced by font.toJSON().
   * @returns {FontFlux}
   */
  static fromJSON(e) {
    const n = Bo(e);
    return new bt(n);
  }
  /**
   * Initialize WOFF2 support. Must be called (and awaited) once before
   * opening or exporting WOFF2 files.
   *
   * @returns {Promise<void>}
   */
  static async initWoff2() {
    return gf();
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
    return ki(o, n);
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
    return AS(e);
  }
  /** Convert an SVG path `d` string to font contours. */
  static svgToContours(e, n) {
    return Ki(e, n);
  }
  /** Convert font contours to an SVG path `d` string. */
  static contoursToSVG(e) {
    return Yf(e);
  }
  /** Compile CFF contours to Type 2 charstring bytecode. */
  static compileCharString(e) {
    return Dn(e);
  }
  /** Assemble charstring assembly text to Type 2 bytecode. */
  static assembleCharString(e) {
    return jf(e);
  }
  /** Interpret Type 2 charstring bytecode to CFF contours. */
  static interpretCharString(e, n, o) {
    return Zn(e, n, o);
  }
  /** Disassemble Type 2 charstring bytecode to assembly text. */
  static disassembleCharString(e) {
    return ea(e);
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
    return uo(this._data, e);
  }
  /**
   * Check if a glyph exists.
   * @param {string|number} id
   * @returns {boolean}
   */
  hasGlyph(e) {
    return uo(this._data, e) !== void 0;
  }
  /**
   * Add or replace a glyph. If raw options are provided (not a glyph object),
   * they are passed through createGlyph() automatically.
   *
   * @param {object} glyphOrOptions - A glyph object or createGlyph() options.
   */
  addGlyph(e) {
    let n = e;
    (n.path || n.name && n.advanceWidth && !n._created) && (n = Qf(n));
    const o = this._data.glyphs, s = o.findIndex((r) => r.name === n.name);
    if (s >= 0) {
      o[s] = n;
      return;
    }
    if (n.unicode != null) {
      const r = o.findIndex((i) => i.unicode === n.unicode);
      if (r >= 0) {
        o[r] = n;
        return;
      }
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
    const n = this._data.glyphs, o = uo(this._data, e);
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
    return Rx(this._data, e, n);
  }
  /**
   * Add kerning pairs. Accepts all createKerning() input formats.
   * Duplicate pairs are resolved with last-write-wins.
   *
   * @param {object|object[]} pairsOrInput - Kerning data in any supported format.
   */
  addKerning(e) {
    const n = Dx(e);
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
    return Mx(this._data, e, n);
  }
  /**
   * Add substitution rules. Accepts the same flexible formats as
   * createSubstitution(): single rules, arrays, class-based, etc.
   *
   * @param {object|object[]} rulesOrInput - Substitution rule(s).
   */
  addSubstitution(e) {
    const n = Fx(e);
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
    const n = Ns(e);
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
    const r = Ns([o]);
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
    const n = Bf(e);
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
   * @param {string} [options.format] - 'sfnt', 'woff', or 'woff2'.
   * @returns {ArrayBuffer}
   */
  export(e) {
    return ki(this._data, e);
  }
  /**
   * Serialize the font to a JSON string.
   *
   * @param {number} [indent=2] - Indentation level.
   * @returns {string}
   */
  toJSON(e) {
    return Tx(this._data, e);
  }
  /**
   * Validate the font data.
   *
   * @returns {object} { valid, errors, warnings, infos }
   */
  validate() {
    return TS(this._data);
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
async function RS() {
  return gf();
}
export {
  bt as FontFlux,
  AS as diagnoseFont,
  Bo as fontFromJSON,
  Tx as fontToJSON,
  RS as initWoff2
};
