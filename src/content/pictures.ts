import type { PictureDef } from './types';

// Drawing conventions (see types.ts): class "c" = colourable (fill = magic colour),
// "k" = black detail, "s" = sticker overlay drawn on top of the paint (shines, blush, stars).

const P = (n: number) => Math.round(n * 10) / 10;
const rad = (deg: number) => (deg * Math.PI) / 180;

function starPts(cx: number, cy: number, R: number, r: number, n = 5, rot = -90) {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rad(rot + (i * 180) / n), rr = i % 2 ? r : R;
    pts.push(`${P(cx + rr * Math.cos(a))},${P(cy + rr * Math.sin(a))}`);
  }
  return pts.join(' ');
}

/** cute face: eyes with shine, smile, blush stickers */
function face(cx: number, cy: number, s = 1, o: { blush?: boolean; gap?: number } = {}) {
  const g = (o.gap ?? 70) * s;
  const eye = (x: number) =>
    `<ellipse class="k" fill="#222228" cx="${P(x)}" cy="${P(cy)}" rx="${P(20 * s)}" ry="${P(27 * s)}"/>` +
    `<circle fill="#fff" stroke="none" cx="${P(x + 6 * s)}" cy="${P(cy - 9 * s)}" r="${P(7.5 * s)}"/>`;
  const smile = `<path fill="none" d="M${P(cx - 38 * s)},${P(cy + 48 * s)} Q${P(cx)},${P(cy + 84 * s)} ${P(cx + 38 * s)},${P(cy + 48 * s)}"/>`;
  const blush = o.blush === false ? '' :
    `<g class="s" fill="#ff7b8a" opacity=".55" stroke="none"><ellipse cx="${P(cx - g - 42 * s)}" cy="${P(cy + 44 * s)}" rx="${P(30 * s)}" ry="${P(18 * s)}"/>` +
    `<ellipse cx="${P(cx + g + 42 * s)}" cy="${P(cy + 44 * s)}" rx="${P(30 * s)}" ry="${P(18 * s)}"/></g>`;
  return eye(cx - g) + eye(cx + g) + smile + blush;
}

const shine = (cx: number, cy: number, rx: number, ry: number, rot = -30) =>
  `<ellipse class="s" fill="#fff" opacity=".75" stroke="none" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})"/>`;

// ------------------------------------------------------------------ level 1 (3½ +)

const apple: PictureDef = {
  kind: 'picture', id: 'apple', name: 'Apple', level: 1, bg: '#fff3c4', sw: 16,
  body:
    `<rect class="c" fill="#795548" x="478" y="150" width="44" height="150" rx="20"/>` +
    `<path class="c" fill="#43a047" d="M530,215 C600,140 720,150 760,190 C700,265 600,275 530,215 Z"/>` +
    `<path class="c" fill="#e53935" d="M500,300 C430,235 250,245 222,430 C195,615 330,835 445,840 C475,842 488,822 500,822 C512,822 525,842 555,840 C670,835 805,615 778,430 C750,245 570,235 500,300 Z"/>` +
    shine(330, 420, 34, 70) + face(500, 545, 1.15),
};

const balloons: PictureDef = {
  kind: 'picture', id: 'balloons', name: 'Balloons', level: 1, bg: '#d6f0ff', sw: 16,
  body:
    `<path fill="none" d="M280,575 C300,700 420,780 500,930 M500,480 C470,640 530,760 500,930 M720,575 C700,700 580,780 500,930"/>` +
    `<ellipse class="c" fill="#e53935" cx="280" cy="420" rx="110" ry="150"/>` +
    `<ellipse class="c" fill="#fdd835" cx="500" cy="325" rx="110" ry="150"/>` +
    `<ellipse class="c" fill="#1e88e5" cx="720" cy="420" rx="110" ry="150"/>` +
    shine(240, 360, 20, 42, 20) + shine(460, 265, 20, 42, 20) + shine(680, 360, 20, 42, 20) +
    face(500, 320, 0.7, { gap: 52 }),
};

function sunRays() {
  let s = '';
  for (let i = 0; i < 8; i++) {
    const a = i * 45 - 90;
    const b1 = [500 + 225 * Math.cos(rad(a - 15)), 500 + 225 * Math.sin(rad(a - 15))];
    const b2 = [500 + 225 * Math.cos(rad(a + 15)), 500 + 225 * Math.sin(rad(a + 15))];
    const t = [500 + 440 * Math.cos(rad(a)), 500 + 440 * Math.sin(rad(a))];
    s += `<path class="c" fill="#fb8c00" d="M${P(b1[0])},${P(b1[1])} L${P(t[0])},${P(t[1])} L${P(b2[0])},${P(b2[1])} Z"/>`;
  }
  return s;
}

const sun: PictureDef = {
  kind: 'picture', id: 'sun', name: 'Sun', level: 1, bg: '#bfe9ff', sw: 16,
  body: sunRays() + `<circle class="c" fill="#fdd835" cx="500" cy="500" r="255"/>` + face(500, 470, 1.25),
};

const fish: PictureDef = {
  kind: 'picture', id: 'fish', name: 'Fish', level: 1, bg: '#b3e5fc', sw: 16,
  body:
    `<path class="c" fill="#ef6c00" d="M300,500 L95,330 C130,430 130,570 95,670 Z"/>` +
    `<path class="c" fill="#ffd54f" d="M400,330 C450,200 620,190 700,330 Z"/>` +
    `<clipPath id="fb"><ellipse cx="540" cy="500" rx="290" ry="195"/></clipPath>` +
    `<ellipse class="c" fill="#ffa726" cx="540" cy="500" rx="290" ry="195"/>` +
    `<path class="c" fill="#fff3e0" clip-path="url(#fb)" d="M470,280 C430,420 430,580 470,720 L560,720 C520,580 520,420 560,280 Z"/>` +
    `<ellipse fill="none" cx="540" cy="500" rx="290" ry="195"/>` +
    `<ellipse class="k" fill="#222228" cx="700" cy="455" rx="30" ry="36"/><circle fill="#fff" stroke="none" cx="710" cy="442" r="11"/>` +
    `<path fill="none" d="M735,560 Q775,585 810,555"/>` +
    `<circle class="c" fill="#e1f5fe" cx="875" cy="385" r="48"/><circle class="c" fill="#e1f5fe" cx="900" cy="250" r="40"/><circle class="c" fill="#e1f5fe" cx="850" cy="130" r="36"/>`,
};

const icecream: PictureDef = {
  kind: 'picture', id: 'icecream', name: 'Ice cream', level: 1, bg: '#fce4ec', sw: 16,
  body:
    `<path class="c" fill="#ffcc80" d="M330,560 L670,560 L500,930 Z"/>` +
    `<path class="c" fill="#f48fb1" d="M320,560 C290,430 380,350 500,350 C620,350 710,430 680,560 C660,610 620,560 600,600 C580,640 540,575 500,615 C460,575 420,640 400,600 C380,560 340,610 320,560 Z"/>` +
    `<circle class="c" fill="#a5d6a7" cx="500" cy="290" r="140"/>` +
    `<path fill="none" d="M520,120 C530,90 560,70 590,62"/>` +
    `<circle class="c" fill="#e53935" cx="520" cy="160" r="46"/>` +
    `<g class="s" stroke="none"><rect fill="#ff7043" x="420" y="220" width="34" height="12" rx="6" transform="rotate(30 437 226)"/>` +
    `<rect fill="#42a5f5" x="560" y="240" width="34" height="12" rx="6" transform="rotate(-25 577 246)"/>` +
    `<rect fill="#ffee58" x="470" y="330" width="34" height="12" rx="6" transform="rotate(70 487 336)"/>` +
    `<rect fill="#ab47bc" x="580" y="320" width="34" height="12" rx="6" transform="rotate(15 597 326)"/></g>` +
    face(500, 492, 0.75, { gap: 60 }),
};

const cat: PictureDef = {
  kind: 'picture', id: 'cat', name: 'Cat', level: 1, bg: '#fff8e1', sw: 16,
  body:
    `<path class="c" fill="#ffb74d" d="M215,470 L235,160 L450,330 Z"/><path class="c" fill="#ffb74d" d="M785,470 L765,160 L550,330 Z"/>` +
    `<path class="c" fill="#f8bbd0" d="M262,400 L272,245 L385,335 Z"/><path class="c" fill="#f8bbd0" d="M738,400 L728,245 L615,335 Z"/>` +
    `<ellipse class="c" fill="#ffb74d" cx="500" cy="575" rx="320" ry="265"/>` +
    `<path fill="none" d="M430,375 Q440,420 430,455 M500,365 L500,450 M570,375 Q560,420 570,455"/>` +
    face(500, 560, 1.15, { gap: 85 }) +
    `<path class="c" fill="#f06292" d="M470,625 L530,625 L500,660 Z"/>` +
    `<path fill="none" d="M300,640 L130,610 M300,680 L130,700 M700,640 L870,610 M700,680 L870,700"/>`,
};

const bear: PictureDef = {
  kind: 'picture', id: 'bear', name: 'Bear', level: 1, bg: '#e8f5e9', sw: 16,
  body:
    `<circle class="c" fill="#a1887f" cx="275" cy="270" r="105"/><circle class="c" fill="#a1887f" cx="725" cy="270" r="105"/>` +
    `<circle class="c" fill="#ffccbc" cx="275" cy="270" r="55"/><circle class="c" fill="#ffccbc" cx="725" cy="270" r="55"/>` +
    `<circle class="c" fill="#a1887f" cx="500" cy="540" r="300"/>` +
    `<ellipse class="c" fill="#ffe0b2" cx="500" cy="660" rx="145" ry="110"/>` +
    `<ellipse class="k" fill="#222228" cx="500" cy="615" rx="48" ry="34"/>` +
    `<path fill="none" d="M500,650 L500,690 M455,700 Q500,730 545,700"/>` +
    face(500, 485, 1.1, { gap: 95 }).replace(/<path fill="none"[^>]*\/>/, ''),
};

const duck: PictureDef = {
  kind: 'picture', id: 'duck', name: 'Duck', level: 1, bg: '#bbdefb', sw: 16,
  body:
    `<ellipse class="c" fill="#fdd835" cx="560" cy="640" rx="270" ry="160"/>` +
    `<path class="c" fill="#fbc02d" d="M500,600 C560,540 700,545 760,610 C700,690 570,700 500,600 Z"/>` +
    `<path class="c" fill="#fb8c00" d="M215,410 C150,400 95,420 70,445 C110,480 170,480 225,470 Z"/>` +
    `<circle class="c" fill="#fdd835" cx="330" cy="400" r="135"/>` +
    `<ellipse class="k" fill="#222228" cx="320" cy="370" rx="22" ry="28"/><circle fill="#fff" stroke="none" cx="327" cy="360" r="8"/>` +
    `<g class="s" fill="#ff7b8a" opacity=".55" stroke="none"><ellipse cx="385" cy="440" rx="30" ry="18"/></g>` +
    `<path class="c" fill="#4fc3f7" d="M0,760 C80,720 160,720 250,760 C340,800 420,800 500,760 C580,720 660,720 750,760 C840,800 920,800 1000,760 L1000,1000 L0,1000 Z"/>`,
};

// ------------------------------------------------------------------ level 2

function windowPanes(x: number, y: number, s: number) {
  return `<rect class="c" fill="#b3e5fc" x="${x}" y="${y}" width="${s}" height="${s}" rx="8"/>` +
    `<path fill="none" d="M${x + s / 2},${y} L${x + s / 2},${y + s} M${x},${y + s / 2} L${x + s},${y + s / 2}"/>`;
}

const house: PictureDef = {
  kind: 'picture', id: 'house', name: 'House', level: 2, bg: '#bbdefb', sw: 13,
  body:
    `<path class="c" fill="#ffffff" d="M150,190 C150,150 200,130 235,150 C255,110 330,110 350,155 C390,145 420,175 410,210 C400,235 170,235 150,190 Z"/>` +
    `<circle class="c" fill="#fdd835" cx="840" cy="160" r="75"/>` +
    `<rect class="c" fill="#8d6e63" x="620" y="210" width="75" height="150"/>` +
    `<path class="c" fill="#81c784" d="M0,800 L1000,800 L1000,1000 L0,1000 Z"/>` +
    `<path class="c" fill="#bcaaa4" d="M450,800 L550,800 L620,1000 L380,1000 Z"/>` +
    `<rect class="c" fill="#ffe0b2" x="230" y="440" width="540" height="360"/>` +
    `<path class="c" fill="#e53935" d="M500,190 L170,450 L830,450 Z"/>` +
    `<path class="c" fill="#8d6e63" d="M440,800 L440,650 C440,590 560,590 560,650 L560,800 Z"/>` +
    `<circle class="k" fill="#222228" cx="535" cy="720" r="10"/>` +
    windowPanes(285, 520, 120) + windowPanes(595, 520, 120),
};

const car: PictureDef = {
  kind: 'picture', id: 'car', name: 'Car', level: 2, bg: '#e3f2fd', sw: 13,
  body:
    `<path class="c" fill="#9e9e9e" d="M0,770 L1000,770 L1000,1000 L0,1000 Z"/>` +
    `<path fill="none" stroke="#fff" stroke-width="18" d="M60,890 L200,890 M330,890 L470,890 M600,890 L740,890 M870,890 L1000,890" class="s"/>` +
    `<path class="c" fill="#e53935" d="M110,690 L110,560 C110,520 140,500 180,495 L300,485 L390,360 C405,340 425,330 450,330 L680,330 C705,330 725,340 740,360 L830,485 L870,495 C900,505 910,530 910,560 L910,690 Z"/>` +
    `<path class="c" fill="#b3e5fc" d="M330,485 L410,375 C418,365 428,362 440,362 L545,362 L545,485 Z"/>` +
    `<path class="c" fill="#b3e5fc" d="M580,485 L580,362 L670,362 C682,362 692,366 700,375 L785,485 Z"/>` +
    `<path fill="none" d="M562,332 L562,690"/>` +
    `<circle class="c" fill="#ffee58" cx="868" cy="560" r="28"/><rect class="c" fill="#ff7043" x="112" y="535" width="40" height="55" rx="10"/>` +
    `<circle class="k" fill="#222228" cx="290" cy="700" r="92"/><circle class="k" fill="#222228" cx="730" cy="700" r="92"/>` +
    `<circle class="c" fill="#cfd8dc" cx="290" cy="700" r="46"/><circle class="c" fill="#cfd8dc" cx="730" cy="700" r="46"/>`,
};

function petals() {
  let s = '';
  for (let i = 0; i < 6; i++) {
    const a = i * 60 - 90;
    const cx = 500 + 130 * Math.cos(rad(a)), cy = 330 + 130 * Math.sin(rad(a));
    s += `<ellipse class="c" fill="#f06292" cx="${P(cx)}" cy="${P(cy)}" rx="78" ry="118" transform="rotate(${a + 90} ${P(cx)} ${P(cy)})"/>`;
  }
  return s;
}

const flower: PictureDef = {
  kind: 'picture', id: 'flower', name: 'Flower', level: 2, bg: '#fffde7', sw: 13,
  body:
    `<rect class="c" fill="#43a047" x="478" y="420" width="44" height="340" rx="20"/>` +
    `<path class="c" fill="#66bb6a" d="M490,620 C420,540 300,540 250,580 C320,660 430,670 490,620 Z"/>` +
    `<path class="c" fill="#66bb6a" d="M510,560 C580,480 700,480 750,520 C680,600 570,610 510,560 Z"/>` +
    `<path class="c" fill="#ff8a65" d="M330,760 L670,760 L630,950 L370,950 Z"/>` +
    `<rect class="c" fill="#ff7043" x="300" y="730" width="400" height="70" rx="18"/>` +
    petals() + `<circle class="c" fill="#fdd835" cx="500" cy="330" r="92"/>` + face(500, 315, 0.62, { gap: 40 }),
};

const butterfly: PictureDef = {
  kind: 'picture', id: 'butterfly', name: 'Butterfly', level: 2, bg: '#e0f7fa', sw: 13,
  body:
    `<path class="c" fill="#ab47bc" d="M490,470 C400,250 200,150 130,240 C70,330 160,480 490,500 Z"/>` +
    `<path class="c" fill="#ab47bc" d="M510,470 C600,250 800,150 870,240 C930,330 840,480 510,500 Z"/>` +
    `<path class="c" fill="#ffa726" d="M490,520 C300,520 180,620 230,730 C280,830 440,760 490,560 Z"/>` +
    `<path class="c" fill="#ffa726" d="M510,520 C700,520 820,620 770,730 C720,830 560,760 510,560 Z"/>` +
    `<circle class="c" fill="#fff59d" cx="270" cy="300" r="55"/><circle class="c" fill="#81d4fa" cx="380" cy="400" r="38"/>` +
    `<circle class="c" fill="#fff59d" cx="730" cy="300" r="55"/><circle class="c" fill="#81d4fa" cx="620" cy="400" r="38"/>` +
    `<circle class="c" fill="#f48fb1" cx="330" cy="660" r="45"/><circle class="c" fill="#f48fb1" cx="670" cy="660" r="45"/>` +
    `<path fill="none" d="M480,300 C450,200 400,160 360,150 M520,300 C550,200 600,160 640,150"/>` +
    `<circle class="k" fill="#222228" cx="355" cy="150" r="16"/><circle class="k" fill="#222228" cx="645" cy="150" r="16"/>` +
    `<ellipse class="c" fill="#6d4c41" cx="500" cy="560" rx="42" ry="230"/>` +
    `<circle class="c" fill="#8d6e63" cx="500" cy="330" r="62"/>` + face(500, 320, 0.45, { gap: 30, blush: false }),
};

const ROCKET = 'M500,120 C620,220 640,420 620,640 L600,760 L400,760 L380,640 C360,420 380,220 500,120 Z';

const rocket: PictureDef = {
  kind: 'picture', id: 'rocket', name: 'Rocket', level: 2, bg: '#283593', sw: 13,
  body:
    `<g class="s" fill="#fff59d" stroke="none"><polygon points="${starPts(160, 200, 30, 12)}"/><polygon points="${starPts(820, 640, 26, 10)}"/>` +
    `<polygon points="${starPts(200, 760, 22, 9)}"/><polygon points="${starPts(760, 140, 18, 7)}"/><polygon points="${starPts(130, 480, 18, 7)}"/></g>` +
    `<circle class="c" fill="#ffb74d" cx="820" cy="330" r="85"/>` +
    `<path fill="none" d="M700,360 C760,300 900,280 940,300"/>` +
    `<path class="c" fill="#ff7043" d="M420,760 C420,850 470,900 500,960 C530,900 580,850 580,760 Z"/>` +
    `<path class="c" fill="#ffee58" d="M455,760 C455,820 480,860 500,900 C520,860 545,820 545,760 Z"/>` +
    `<path class="c" fill="#e53935" d="M390,560 L270,700 L300,790 L410,720 Z"/>` +
    `<path class="c" fill="#e53935" d="M610,560 L730,700 L700,790 L590,720 Z"/>` +
    `<clipPath id="rb"><path d="${ROCKET}"/></clipPath>` +
    `<path class="c" fill="#eceff1" d="${ROCKET}"/>` +
    `<rect class="c" fill="#e53935" clip-path="url(#rb)" x="300" y="80" width="400" height="220"/>` +
    `<rect class="c" fill="#90a4ae" clip-path="url(#rb)" x="300" y="650" width="400" height="60"/>` +
    `<path fill="none" d="${ROCKET}"/>` +
    `<circle class="c" fill="#81d4fa" cx="500" cy="440" r="72"/>` + shine(475, 415, 14, 26, 30),
};

// ------------------------------------------------------------------ level 3

function hexPath(cx: number, cy: number, r: number) {
  let d = '';
  for (let i = 0; i < 6; i++) {
    const a = rad(60 * i);
    d += `${i ? 'L' : 'M'}${P(cx + r * Math.cos(a))},${P(cy + r * Math.sin(a))} `;
  }
  return d + 'Z';
}

const turtle: PictureDef = {
  kind: 'picture', id: 'turtle', name: 'Turtle', level: 3, bg: '#c8e6c9', sw: 11,
  body:
    `<ellipse class="c" fill="#81c784" cx="270" cy="700" rx="70" ry="95" transform="rotate(30 270 700)"/>` +
    `<ellipse class="c" fill="#81c784" cx="730" cy="700" rx="70" ry="95" transform="rotate(-30 730 700)"/>` +
    `<ellipse class="c" fill="#81c784" cx="300" cy="420" rx="60" ry="85" transform="rotate(-40 300 420)"/>` +
    `<ellipse class="c" fill="#81c784" cx="700" cy="420" rx="60" ry="85" transform="rotate(40 700 420)"/>` +
    `<path class="c" fill="#81c784" d="M480,780 L500,880 L520,780 Z"/>` +
    `<circle class="c" fill="#81c784" cx="500" cy="240" r="105"/>` + face(500, 225, 0.55, { gap: 38 }) +
    `<ellipse class="c" fill="#6d4c41" cx="500" cy="560" rx="265" ry="235"/>` +
    `<ellipse class="c" fill="#8d6e63" cx="500" cy="550" rx="235" ry="205"/>` +
    `<path class="c" fill="#bcaaa4" d="${hexPath(500, 550, 82)}"/>` +
    [0, 60, 120, 180, 240, 300]
      .map((a) => `<path class="c" fill="#a1887f" d="${hexPath(500 + 150 * Math.cos(rad(a + 30)), 550 + 150 * Math.sin(rad(a + 30)), 62)}"/>`)
      .join(''),
};

function bellyFeathers() {
  let s = '';
  const rows = [[430, 500, 570], [395, 465, 535, 605], [430, 500, 570]];
  rows.forEach((xs, ri) => {
    const y = 600 + ri * 70;
    for (const x of xs) s += `<path class="c" fill="#efebe9" d="M${x - 32},${y} A32,32 0 0 0 ${x + 32},${y} Z"/>`;
  });
  return s;
}

const owl: PictureDef = {
  kind: 'picture', id: 'owl', name: 'Owl', level: 3, bg: '#5c6bc0', sw: 11,
  body:
    `<circle class="c" fill="#fff59d" cx="855" cy="150" r="78"/>` +
    `<g class="s" fill="#fff59d" stroke="none"><polygon points="${starPts(150, 150, 24, 10)}"/><polygon points="${starPts(260, 90, 16, 7)}"/><polygon points="${starPts(110, 330, 14, 6)}"/></g>` +
    `<path class="c" fill="#6d4c41" d="M300,250 L330,100 L420,215 Z"/><path class="c" fill="#6d4c41" d="M700,250 L670,100 L580,215 Z"/>` +
    `<path class="c" fill="#8d6e63" d="M500,180 C700,180 760,380 750,600 C740,800 640,860 500,860 C360,860 260,800 250,600 C240,380 300,180 500,180 Z"/>` +
    `<path class="c" fill="#6d4c41" d="M260,450 C180,520 190,700 300,780 C300,650 290,540 260,450 Z"/>` +
    `<path class="c" fill="#6d4c41" d="M740,450 C820,520 810,700 700,780 C700,650 710,540 740,450 Z"/>` +
    `<ellipse class="c" fill="#d7ccc8" cx="500" cy="660" rx="175" ry="175"/>` + bellyFeathers() +
    `<circle class="c" fill="#ffffff" cx="400" cy="380" r="95"/><circle class="c" fill="#ffffff" cx="600" cy="380" r="95"/>` +
    `<circle class="c" fill="#ffb300" cx="400" cy="385" r="58"/><circle class="c" fill="#ffb300" cx="600" cy="385" r="58"/>` +
    `<circle class="k" fill="#222228" cx="400" cy="390" r="30"/><circle class="k" fill="#222228" cx="600" cy="390" r="30"/>` +
    `<circle fill="#fff" stroke="none" cx="410" cy="378" r="10"/><circle fill="#fff" stroke="none" cx="610" cy="378" r="10"/>` +
    `<path class="c" fill="#fb8c00" d="M460,450 L540,450 L500,520 Z"/>` +
    `<path class="c" fill="#795548" d="M0,860 L1000,860 L1000,940 L0,940 Z"/>` +
    `<path class="c" fill="#fb8c00" d="M365,835 C365,815 435,815 435,835 L425,885 L410,860 L400,890 L390,860 L375,885 Z"/>` +
    `<path class="c" fill="#fb8c00" d="M565,835 C565,815 635,815 635,835 L625,885 L610,860 L600,890 L590,860 L575,885 Z"/>`,
};

const robot: PictureDef = {
  kind: 'picture', id: 'robot', name: 'Robot', level: 3, bg: '#e1f5fe', sw: 11,
  body:
    `<path fill="none" d="M500,170 L500,90"/><circle class="c" fill="#e53935" cx="500" cy="75" r="34"/>` +
    `<rect class="c" fill="#90a4ae" x="245" y="250" width="50" height="110" rx="14"/><rect class="c" fill="#90a4ae" x="705" y="250" width="50" height="110" rx="14"/>` +
    `<rect class="c" fill="#b0bec5" x="290" y="170" width="420" height="270" rx="50"/>` +
    `<circle class="c" fill="#81d4fa" cx="405" cy="285" r="52"/><circle class="c" fill="#81d4fa" cx="595" cy="285" r="52"/>` +
    `<circle class="k" fill="#222228" cx="405" cy="290" r="22"/><circle class="k" fill="#222228" cx="595" cy="290" r="22"/>` +
    `<circle fill="#fff" stroke="none" cx="413" cy="281" r="8"/><circle fill="#fff" stroke="none" cx="603" cy="281" r="8"/>` +
    `<rect class="c" fill="#ffffff" x="400" y="360" width="200" height="50" rx="10"/>` +
    `<path fill="none" d="M450,360 L450,410 M500,360 L500,410 M550,360 L550,410"/>` +
    `<rect class="c" fill="#78909c" x="455" y="440" width="90" height="40"/>` +
    `<rect class="c" fill="#4fc3f7" x="215" y="490" width="80" height="230" rx="30"/><rect class="c" fill="#4fc3f7" x="705" y="490" width="80" height="230" rx="30"/>` +
    `<circle class="c" fill="#b0bec5" cx="255" cy="760" r="48"/><circle class="c" fill="#b0bec5" cx="745" cy="760" r="48"/>` +
    `<rect class="c" fill="#90caf9" x="300" y="480" width="400" height="320" rx="40"/>` +
    `<rect class="c" fill="#e3f2fd" x="360" y="530" width="280" height="150" rx="20"/>` +
    `<circle class="c" fill="#e53935" cx="425" cy="605" r="34"/><circle class="c" fill="#fdd835" cx="500" cy="605" r="34"/><circle class="c" fill="#43a047" cx="575" cy="605" r="34"/>` +
    `<path class="c" fill="#ec407a" d="M500,760 C460,725 450,700 475,690 C490,685 500,700 500,700 C500,700 510,685 525,690 C550,700 540,725 500,760 Z"/>` +
    `<rect class="c" fill="#78909c" x="360" y="800" width="90" height="110"/><rect class="c" fill="#78909c" x="550" y="800" width="90" height="110"/>` +
    `<rect class="c" fill="#455a64" x="330" y="900" width="140" height="55" rx="20"/><rect class="c" fill="#455a64" x="530" y="900" width="140" height="55" rx="20"/>`,
};

export const PICTURES: PictureDef[] = [
  apple, balloons, sun, fish, icecream, cat, bear, duck,
  house, car, flower, butterfly, rocket,
  turtle, owl, robot,
];
