import { face, P, rad, shine, starPts } from './pictures.ts';
import type { PictureDef } from './types';

// Second batch of pictures. Same conventions as pictures.ts, plus class "t" for
// "top stickers" that must sit above black shapes (eyes on a ladybug's head).

export const eyesOnBlack = (cx: number, cy: number, gap: number, r: number) =>
  [-1, 1].map((d) =>
    `<circle class="t" fill="#fff" stroke="none" cx="${cx + d * gap}" cy="${cy}" r="${r}"/>` +
    `<circle class="t" fill="#222228" stroke="none" cx="${cx + d * gap + 3}" cy="${cy + 4}" r="${P(r * 0.48)}"/>` +
    `<circle class="t" fill="#fff" stroke="none" cx="${cx + d * gap + 6}" cy="${cy - 1}" r="${P(r * 0.2)}"/>`).join('');

export const stickerDots = (pts: [number, number][], fill: string, rx: number, ry: number) =>
  `<g class="s" fill="${fill}" stroke="none">${pts.map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${(i * 37) % 60 - 30} ${x} ${y})"/>`).join('')}</g>`;

export const cloud = (cx: number, cy: number, s: number, fill = '#ffffff') =>
  `<path class="c" fill="${fill}" d="M${P(cx - 110 * s)},${P(cy + 30 * s)} C${P(cx - 150 * s)},${P(cy + 30 * s)} ${P(cx - 150 * s)},${P(cy - 30 * s)} ${P(cx - 100 * s)},${P(cy - 30 * s)} C${P(cx - 90 * s)},${P(cy - 80 * s)} ${P(cx - 20 * s)},${P(cy - 90 * s)} ${P(cx)},${P(cy - 50 * s)} C${P(cx + 30 * s)},${P(cy - 100 * s)} ${P(cx + 110 * s)},${P(cy - 80 * s)} ${P(cx + 100 * s)},${P(cy - 25 * s)} C${P(cx + 150 * s)},${P(cy - 25 * s)} ${P(cx + 150 * s)},${P(cy + 30 * s)} ${P(cx + 105 * s)},${P(cy + 30 * s)} Z"/>`;

// ------------------------------------------------------------------ level 1

const ladybug: PictureDef = {
  kind: 'picture', id: 'ladybug', name: 'Ladybug', level: 1, bg: '#c8e6c9', sw: 16,
  body:
    `<path class="c" fill="#66bb6a" d="M110,850 C120,540 420,260 880,190 C860,560 610,860 110,850 Z"/>` +
    `<path fill="none" d="M450,290 C420,210 380,180 340,170 M550,290 C580,210 620,180 660,170"/>` +
    `<circle class="k" fill="#222228" cx="340" cy="170" r="20"/><circle class="k" fill="#222228" cx="660" cy="170" r="20"/>` +
    `<circle class="k" fill="#222228" cx="500" cy="330" r="105"/>` +
    `<circle class="c" fill="#e53935" cx="500" cy="575" r="270"/>` +
    `<path fill="none" d="M500,310 L500,845"/>` +
    [[380, 480, 46], [325, 625, 38], [420, 735, 42], [620, 480, 46], [675, 625, 38], [580, 735, 42]]
      .map(([x, y, r]) => `<circle class="k" fill="#222228" cx="${x}" cy="${y}" r="${r}"/>`).join('') +
    eyesOnBlack(500, 318, 38, 22) +
    shine(400, 400, 26, 50, -40),
};

const strawberry: PictureDef = {
  kind: 'picture', id: 'strawberry', name: 'Strawberry', level: 1, bg: '#fff3e0', sw: 16,
  body:
    `<rect class="c" fill="#8d6e63" x="482" y="120" width="36" height="120" rx="16"/>` +
    `<path class="c" fill="#e53935" d="M500,890 C330,870 190,650 210,480 C225,345 360,305 500,335 C640,305 775,345 790,480 C810,650 670,870 500,890 Z"/>` +
    `<path class="c" fill="#43a047" d="M500,250 L560,180 L585,268 L680,245 L630,322 L705,385 L592,365 L500,405 L408,365 L295,385 L370,322 L320,245 L415,268 L440,180 Z"/>` +
    stickerDots([[300, 480], [700, 480], [330, 650], [670, 650], [420, 770], [580, 770], [500, 840], [270, 570], [730, 570]], '#ffe082', 9, 15) +
    face(500, 560, 1.1, { gap: 72 }),
};

function cupcakeStripes() {
  const cols = ['#4fc3f7', '#b3e5fc', '#4fc3f7', '#b3e5fc', '#4fc3f7'];
  return cols.map((c, i) => {
    const tx0 = 260 + 96 * i, tx1 = tx0 + 96, bx0 = 330 + 68 * i, bx1 = bx0 + 68;
    return `<path class="c" fill="${c}" d="M${tx0},560 L${tx1},560 L${bx1},900 L${bx0},900 Z"/>`;
  }).join('');
}

const cupcake: PictureDef = {
  kind: 'picture', id: 'cupcake', name: 'Cupcake', level: 1, bg: '#fce4ec', sw: 16,
  body:
    cupcakeStripes() +
    `<path fill="none" d="M540,255 C560,210 600,188 632,182"/>` +
    `<path class="c" fill="#f48fb1" d="M250,585 C195,525 240,430 320,442 C330,360 430,330 482,382 C522,300 642,322 652,402 C732,382 792,462 752,542 C792,602 722,645 662,612 C602,652 542,632 500,612 C460,642 390,652 340,612 C290,645 230,635 250,585 Z"/>` +
    `<circle class="c" fill="#e53935" cx="520" cy="300" r="50"/>` +
    stickerDots([[340, 470], [430, 420], [600, 430], [690, 500], [380, 560], [640, 570], [520, 390]], '#ffffff', 6, 16) +
    face(500, 500, 0.8, { gap: 60 }),
};

const whale: PictureDef = {
  kind: 'picture', id: 'whale', name: 'Whale', level: 1, bg: '#b3e5fc', sw: 16,
  body:
    `<path class="c" fill="#e1f5fe" d="M470,300 C430,240 440,170 480,120 C520,170 530,240 490,300 Z"/>` +
    `<circle class="c" fill="#e1f5fe" cx="385" cy="185" r="34"/><circle class="c" fill="#e1f5fe" cx="580" cy="185" r="34"/>` +
    `<path class="c" fill="#42a5f5" d="M760,520 C820,470 860,380 905,330 C935,410 925,470 885,520 C945,540 965,600 955,665 C895,625 835,605 770,605 Z"/>` +
    `<path class="c" fill="#42a5f5" d="M150,560 C150,400 300,330 480,330 C680,330 800,430 800,560 C800,700 660,780 470,780 C280,780 150,700 150,560 Z"/>` +
    `<path class="c" fill="#e3f2fd" d="M175,610 C250,720 420,765 565,745 C690,725 765,665 795,605 C700,655 565,688 420,678 C320,670 240,645 175,610 Z"/>` +
    `<ellipse class="k" fill="#222228" cx="300" cy="500" rx="24" ry="30"/><circle fill="#fff" stroke="none" cx="308" cy="489" r="9"/>` +
    `<path fill="none" d="M230,585 Q290,625 360,592"/>` +
    `<g class="s" fill="#ff7b8a" opacity=".55" stroke="none"><ellipse cx="380" cy="560" rx="32" ry="18"/></g>` +
    `<path class="c" fill="#29b6f6" d="M0,790 C120,750 240,750 360,790 C480,830 600,830 720,790 C840,750 920,750 1000,780 L1000,1000 L0,1000 Z"/>`,
};

const frog: PictureDef = {
  kind: 'picture', id: 'frog', name: 'Frog', level: 1, bg: '#e1f5fe', sw: 16,
  body:
    `<ellipse class="c" fill="#43a047" cx="500" cy="860" rx="400" ry="110"/>` +
    `<circle class="c" fill="#7cb342" cx="320" cy="330" r="115"/><circle class="c" fill="#7cb342" cx="680" cy="330" r="115"/>` +
    `<ellipse class="c" fill="#7cb342" cx="500" cy="580" rx="340" ry="250"/>` +
    `<circle class="c" fill="#ffffff" cx="320" cy="320" r="72"/><circle class="c" fill="#ffffff" cx="680" cy="320" r="72"/>` +
    `<circle class="k" fill="#222228" cx="332" cy="332" r="34"/><circle class="k" fill="#222228" cx="668" cy="332" r="34"/>` +
    `<circle fill="#fff" stroke="none" cx="342" cy="320" r="10"/><circle fill="#fff" stroke="none" cx="678" cy="320" r="10"/>` +
    `<circle class="k" fill="#222228" cx="465" cy="520" r="9"/><circle class="k" fill="#222228" cx="535" cy="520" r="9"/>` +
    `<path fill="none" d="M320,620 Q500,750 680,620"/>` +
    `<g class="s" fill="#ff7b8a" opacity=".5" stroke="none"><ellipse cx="270" cy="620" rx="38" ry="22"/><ellipse cx="730" cy="620" rx="38" ry="22"/></g>`,
};

const star: PictureDef = {
  kind: 'picture', id: 'star', name: 'Star', level: 1, bg: '#283593', sw: 16,
  body:
    `<polygon class="c" fill="#fff59d" points="${starPts(150, 170, 72, 33)}"/>` +
    `<polygon class="c" fill="#fff59d" points="${starPts(855, 190, 62, 28)}"/>` +
    `<polygon class="c" fill="#fff59d" points="${starPts(140, 840, 58, 26)}"/>` +
    `<polygon class="c" fill="#fff59d" points="${starPts(860, 845, 66, 30)}"/>` +
    `<polygon class="c" fill="#fdd835" points="${starPts(500, 530, 370, 170)}"/>` +
    face(500, 545, 1.05, { gap: 62 }),
};

const snail: PictureDef = {
  kind: 'picture', id: 'snail', name: 'Snail', level: 1, bg: '#fffde7', sw: 16,
  body:
    `<path fill="none" d="M790,520 L760,410 M860,530 L885,420"/>` +
    `<circle class="k" fill="#222228" cx="758" cy="400" r="22"/><circle class="k" fill="#222228" cx="887" cy="410" r="22"/>` +
    `<path class="c" fill="#ffcc80" d="M110,850 C110,790 160,770 230,770 L630,770 C690,710 690,575 755,530 C815,490 905,530 905,610 C905,710 865,790 825,850 Z"/>` +
    `<circle class="c" fill="#ff8a65" cx="430" cy="560" r="235"/>` +
    `<circle class="c" fill="#ffab91" cx="445" cy="575" r="150"/>` +
    `<circle class="c" fill="#ffccbc" cx="460" cy="590" r="70"/>` +
    face(825, 615, 0.5, { gap: 30 }) +
    `<path class="c" fill="#a5d6a7" d="M0,850 L1000,850 L1000,1000 L0,1000 Z"/>`,
};

const tree: PictureDef = {
  kind: 'picture', id: 'tree', name: 'Apple tree', level: 1, bg: '#e3f2fd', sw: 16,
  body:
    `<path class="c" fill="#8d6e63" d="M440,890 L460,560 L540,560 L560,890 Z"/>` +
    `<path class="c" fill="#43a047" d="M230,520 C150,470 170,330 280,320 C290,200 420,150 500,200 C580,140 720,190 730,300 C840,310 870,460 780,520 C800,610 690,660 600,620 C550,680 440,680 400,620 C310,660 200,620 230,520 Z"/>` +
    [[350, 420], [520, 300], [660, 430], [470, 520], [300, 545]]
      .map(([x, y]) => `<circle class="c" fill="#e53935" cx="${x}" cy="${y}" r="44"/>`).join('') +
    `<path class="c" fill="#81c784" d="M0,840 C200,800 400,820 500,845 C650,875 800,820 1000,830 L1000,1000 L0,1000 Z"/>`,
};

const unicorn: PictureDef = {
  kind: 'picture', id: 'unicorn', name: 'Unicorn', level: 1, bg: '#f3e5f5', sw: 16,
  body:
    `<g class="s" fill="#ffd54f" stroke="none"><polygon points="${starPts(130, 160, 40, 16)}"/><polygon points="${starPts(860, 150, 34, 14)}"/><polygon points="${starPts(880, 820, 30, 12)}"/><polygon points="${starPts(120, 820, 26, 11)}"/></g>` +
    `<path class="c" fill="#ffffff" d="M390,620 C370,740 370,850 395,970 L640,970 C650,850 640,720 620,640 Z"/>` +
    `<circle class="c" fill="#f48fb1" cx="330" cy="320" r="90"/><circle class="c" fill="#ce93d8" cx="290" cy="470" r="90"/><circle class="c" fill="#81d4fa" cx="340" cy="610" r="85"/>` +
    `<path class="c" fill="#ffffff" d="M410,300 L455,160 L530,275 Z"/>` +
    `<path class="c" fill="#f8bbd0" d="M440,280 L460,205 L500,270 Z"/>` +
    `<path class="c" fill="#fdd835" d="M560,280 L640,70 L650,300 Z"/>` +
    `<circle class="c" fill="#ffffff" cx="520" cy="460" r="200"/>` +
    `<ellipse class="c" fill="#f8bbd0" cx="660" cy="560" rx="125" ry="92"/>` +
    `<circle class="k" fill="#222228" cx="700" cy="545" r="12"/>` +
    `<path fill="none" d="M640,610 Q680,630 720,605"/>` +
    `<ellipse class="k" fill="#222228" cx="555" cy="430" rx="22" ry="30"/><circle fill="#fff" stroke="none" cx="563" cy="419" r="8"/>` +
    `<path fill="none" d="M540,400 L525,375 M556,398 L552,370 M572,402 L580,376"/>` +
    `<g class="s" fill="#ff7b8a" opacity=".5" stroke="none"><ellipse cx="545" cy="510" rx="32" ry="18"/></g>`,
};

// ------------------------------------------------------------------ level 2

const dinosaur: PictureDef = {
  kind: 'picture', id: 'dinosaur', name: 'Dinosaur', level: 2, bg: '#fff8e1', sw: 13,
  body:
    [[390, 470], [460, 440], [535, 440], [605, 465]]
      .map(([x, y]) => `<path class="c" fill="#ffb74d" d="M${x - 40},${y + 40} L${x},${y - 70} L${x + 40},${y + 40} Z"/>`).join('') +
    `<rect class="c" fill="#66bb6a" x="380" y="680" width="74" height="160" rx="24"/><rect class="c" fill="#66bb6a" x="560" y="680" width="74" height="160" rx="24"/>` +
    `<path class="c" fill="#81c784" d="M100,650 L370,560 L380,730 Z"/>` +
    `<path class="c" fill="#81c784" d="M640,560 C650,420 670,330 770,320 C870,312 910,380 890,440 C872,498 790,512 750,522 C730,560 715,600 700,650 Z"/>` +
    `<ellipse class="c" fill="#81c784" cx="500" cy="630" rx="215" ry="150"/>` +
    `<ellipse class="c" fill="#dcedc8" cx="500" cy="690" rx="150" ry="70"/>` +
    `<ellipse class="k" fill="#222228" cx="800" cy="390" rx="18" ry="24"/><circle fill="#fff" stroke="none" cx="806" cy="381" r="7"/>` +
    `<path fill="none" d="M820,455 Q850,470 880,450"/>` +
    stickerDots([[400, 600], [470, 560], [560, 590], [620, 640], [330, 640]], '#558b2f', 16, 12),
};

const crab: PictureDef = {
  kind: 'picture', id: 'crab', name: 'Crab', level: 2, bg: '#b3e5fc', sw: 13,
  body:
    `<path class="c" fill="#4fc3f7" d="M0,540 C150,520 300,560 500,540 C700,520 850,560 1000,540 L1000,720 L0,720 Z"/>` +
    `<path class="c" fill="#ffe082" d="M0,700 C200,680 400,720 600,700 C800,680 900,710 1000,700 L1000,1000 L0,1000 Z"/>` +
    `<path fill="none" d="M330,760 L220,850 M345,800 L250,900 M380,835 L320,935 M670,760 L780,850 M655,800 L750,900 M620,835 L680,935"/>` +
    `<path fill="none" d="M360,660 L270,540 M640,660 L730,540"/>` +
    `<path class="c" fill="#ef5350" d="M250,540 C170,540 150,440 200,390 C215,440 250,450 285,430 C270,380 230,350 250,320 C330,330 360,420 330,480 C315,520 285,540 250,540 Z"/>` +
    `<path class="c" fill="#ef5350" d="M750,540 C830,540 850,440 800,390 C785,440 750,450 715,430 C730,380 770,350 750,320 C670,330 640,420 670,480 C685,520 715,540 750,540 Z"/>` +
    `<path fill="none" d="M450,640 L430,560 M550,640 L570,560"/>` +
    `<ellipse class="c" fill="#ef5350" cx="500" cy="745" rx="205" ry="135"/>` +
    `<circle class="c" fill="#ffffff" cx="430" cy="535" r="36"/><circle class="c" fill="#ffffff" cx="570" cy="535" r="36"/>` +
    `<circle class="k" fill="#222228" cx="436" cy="540" r="15"/><circle class="k" fill="#222228" cx="564" cy="540" r="15"/>` +
    `<path fill="none" d="M450,770 Q500,810 550,770"/>` +
    `<g class="s" fill="#ff8a80" opacity=".6" stroke="none"><ellipse cx="390" cy="760" rx="30" ry="18"/><ellipse cx="610" cy="760" rx="30" ry="18"/></g>` +
    `<path class="c" fill="#f8bbd0" d="M820,900 C820,850 900,850 900,900 C900,930 820,930 820,900 Z"/>`,
};

const train: PictureDef = {
  kind: 'picture', id: 'train', name: 'Train', level: 2, bg: '#e3f2fd', sw: 13,
  body:
    `<circle class="c" fill="#ffffff" cx="300" cy="185" r="52"/><circle class="c" fill="#ffffff" cx="385" cy="125" r="62"/><circle class="c" fill="#ffffff" cx="490" cy="92" r="46"/>` +
    `<rect class="c" fill="#616161" x="270" y="240" width="72" height="150" rx="10"/>` +
    `<rect class="c" fill="#ab47bc" x="850" y="470" width="170" height="230" rx="14"/>` +
    `<rect class="c" fill="#e1bee7" x="885" y="510" width="90" height="80" rx="8"/>` +
    `<rect class="c" fill="#e53935" x="560" y="300" width="250" height="330" rx="16"/>` +
    `<rect class="c" fill="#b3e5fc" x="600" y="345" width="170" height="120" rx="10"/>` +
    `<rect class="c" fill="#8d6e63" x="535" y="268" width="300" height="50" rx="12"/>` +
    `<rect class="c" fill="#1e88e5" x="215" y="380" width="365" height="250" rx="34"/>` +
    `<path class="c" fill="#fdd835" d="M220,560 L130,770 L225,770 Z"/>` +
    `<rect class="c" fill="#757575" x="200" y="600" width="630" height="100" rx="14"/>` +
    `<path class="c" fill="#bcaaa4" d="M0,860 L1000,860 L1000,905 L0,905 Z"/>` +
    `<path class="c" fill="#a5d6a7" d="M0,905 L1000,905 L1000,1000 L0,1000 Z"/>` +
    [[300, 760, 82], [480, 760, 82], [700, 755, 92]]
      .map(([x, y, r]) => `<circle class="k" fill="#222228" cx="${x}" cy="${y}" r="${r}"/><circle class="c" fill="#fdd835" cx="${x}" cy="${y}" r="${Math.round(r * 0.42)}"/>`).join(''),
};

const penguin: PictureDef = {
  kind: 'picture', id: 'penguin', name: 'Penguin', level: 2, bg: '#e1f5fe', sw: 13,
  body:
    `<g class="s" fill="#ffffff" stroke="none"><polygon points="${starPts(140, 160, 26, 9, 6)}"/><polygon points="${starPts(860, 220, 22, 8, 6)}"/><polygon points="${starPts(180, 520, 18, 7, 6)}"/><polygon points="${starPts(850, 560, 24, 9, 6)}"/></g>` +
    `<path class="c" fill="#4fc3f7" d="M0,800 L1000,800 L1000,1000 L0,1000 Z"/>` +
    `<ellipse class="c" fill="#ffffff" cx="500" cy="865" rx="420" ry="85"/>` +
    `<path class="c" fill="#37474f" d="M305,470 C225,550 205,650 235,705 C285,665 325,600 335,535 Z"/>` +
    `<path class="c" fill="#37474f" d="M695,470 C775,550 795,650 765,705 C715,665 675,600 665,535 Z"/>` +
    `<ellipse class="c" fill="#37474f" cx="500" cy="560" rx="215" ry="290"/>` +
    `<ellipse class="c" fill="#ffffff" cx="500" cy="660" rx="150" ry="190"/>` +
    `<path class="c" fill="#ffffff" d="M380,360 C380,300 440,280 500,330 C560,280 620,300 620,360 C620,430 565,462 500,462 C435,462 380,430 380,360 Z"/>` +
    `<path class="c" fill="#e53935" d="M325,475 C420,515 580,515 675,475 L688,535 C595,575 405,575 312,535 Z"/>` +
    `<path class="c" fill="#e53935" d="M590,540 L640,690 L578,700 L552,552 Z"/>` +
    `<circle class="k" fill="#222228" cx="455" cy="372" r="14"/><circle class="k" fill="#222228" cx="545" cy="372" r="14"/>` +
    `<path class="c" fill="#ff9800" d="M468,410 L532,410 L500,450 Z"/>` +
    `<ellipse class="c" fill="#ff9800" cx="430" cy="852" rx="62" ry="26"/><ellipse class="c" fill="#ff9800" cx="570" cy="852" rx="62" ry="26"/>`,
};

const HB = 'M500,100 C700,100 800,240 800,380 C800,520 650,620 580,690 L420,690 C350,620 200,520 200,380 C200,240 300,100 500,100 Z';

const balloon: PictureDef = {
  kind: 'picture', id: 'hot-air-balloon', name: 'Hot-air balloon', level: 2, bg: '#b3e5fc', sw: 13,
  body:
    `<circle class="c" fill="#fdd835" cx="140" cy="140" r="70"/>` +
    cloud(830, 170, 0.9) + cloud(170, 640, 0.75) +
    `<path fill="none" d="M720,520 l25,22 l25,-22 M790,600 l20,18 l20,-18"/>` +
    `<path fill="none" d="M435,680 L425,785 M565,680 L575,785 M480,688 L470,785 M520,688 L530,785"/>` +
    `<clipPath id="hb"><path d="${HB}"/></clipPath>` +
    ['#e53935', '#fdd835', '#1e88e5', '#fdd835', '#e53935']
      .map((c, i) => `<rect class="c" fill="${c}" clip-path="url(#hb)" x="${200 + i * 120}" y="80" width="120" height="620"/>`).join('') +
    `<path fill="none" d="${HB}"/>` +
    shine(330, 260, 26, 60, 20) +
    `<rect class="c" fill="#a1887f" x="410" y="780" width="180" height="120" rx="12"/>` +
    `<path fill="none" d="M410,840 L590,840 M470,780 L470,900 M530,780 L530,900"/>`,
};

// ------------------------------------------------------------------ level 3

const castle: PictureDef = {
  kind: 'picture', id: 'castle', name: 'Castle', level: 3, bg: '#bbdefb', sw: 11,
  body:
    cloud(130, 110, 0.6) + cloud(880, 90, 0.55) +
    `<path class="c" fill="#a5d6a7" d="M0,760 C200,620 400,640 520,720 C650,620 850,640 1000,700 L1000,1000 L0,1000 Z"/>` +
    `<path fill="none" d="M250,200 L250,120 M750,200 L750,120 M500,100 L500,30"/>` +
    `<path class="c" fill="#fdd835" d="M250,120 L318,140 L250,162 Z"/><path class="c" fill="#fdd835" d="M750,120 L818,140 L750,162 Z"/><path class="c" fill="#ec407a" d="M500,30 L568,50 L500,72 Z"/>` +
    `<rect class="c" fill="#b0bec5" x="430" y="255" width="140" height="240"/>` +
    `<path class="c" fill="#8e24aa" d="M410,260 L590,260 L500,98 Z"/>` +
    `<rect class="c" fill="#b0bec5" x="170" y="380" width="160" height="490"/><rect class="c" fill="#b0bec5" x="670" y="380" width="160" height="490"/>` +
    `<path class="c" fill="#e53935" d="M150,385 L350,385 L250,198 Z"/><path class="c" fill="#e53935" d="M650,385 L850,385 L750,198 Z"/>` +
    [330, 410, 550, 630].map((x) => `<rect class="c" fill="#cfd8dc" x="${x}" y="440" width="40" height="45"/>`).join('') +
    `<rect class="c" fill="#cfd8dc" x="330" y="480" width="340" height="390"/>` +
    [[225, 470, 50, 90], [725, 470, 50, 90], [475, 320, 50, 80], [380, 560, 50, 62], [570, 560, 50, 62]]
      .map(([x, y, w, h]) => `<path class="c" fill="#ffe082" d="M${x},${y + h} L${x},${y + w / 2} A${w / 2},${w / 2} 0 0 1 ${x + w},${y + w / 2} L${x + w},${y + h} Z"/>`).join('') +
    `<path class="c" fill="#8d6e63" d="M440,870 L440,740 A60,60 0 0 1 560,740 L560,870 Z"/>` +
    `<path fill="none" d="M480,700 L480,870 M520,700 L520,870"/>` +
    `<path class="c" fill="#81c784" d="M0,870 L1000,870 L1000,1000 L0,1000 Z"/>`,
};

function dragonWing(dir: 1 | -1) {
  const x = (v: number) => 500 + dir * v;
  return `<path class="c" fill="#26a69a" d="M${x(40)},480 C${x(120)},300 ${x(260)},220 ${x(380)},200 C${x(350)},270 ${x(370)},330 ${x(400)},380 C${x(330)},380 ${x(300)},420 ${x(300)},470 C${x(230)},450 ${x(160)},470 ${x(120)},540 Z"/>` +
    `<path fill="none" d="M${x(120)},450 L${x(340)},245 M${x(170)},500 L${x(380)},340"/>`;
}

const dragon: PictureDef = {
  kind: 'picture', id: 'dragon', name: 'Dragon', level: 3, bg: '#fff3e0', sw: 11,
  body:
    dragonWing(-1) + dragonWing(1) +
    `<path class="c" fill="#66bb6a" d="M330,800 C230,840 140,820 110,760 C150,780 200,770 230,730 Z"/>` +
    `<path class="c" fill="#ffb74d" d="M110,760 L60,700 L120,715 Z"/>` +
    [[330, 520], [305, 610], [300, 700]].map(([x, y]) => `<path class="c" fill="#ffb74d" d="M${x + 30},${y - 40} L${x - 50},${y} L${x + 30},${y + 40} Z"/>`).join('') +
    `<ellipse class="c" fill="#66bb6a" cx="420" cy="900" rx="80" ry="45"/><ellipse class="c" fill="#66bb6a" cx="620" cy="900" rx="80" ry="45"/>` +
    `<ellipse class="c" fill="#66bb6a" cx="520" cy="660" rx="200" ry="235"/>` +
    `<clipPath id="db"><ellipse cx="540" cy="690" rx="120" ry="170"/></clipPath>` +
    ['#fff59d', '#ffe082', '#fff59d', '#ffe082'].map((c, i) => `<rect class="c" fill="${c}" clip-path="url(#db)" x="400" y="${520 + i * 85}" width="300" height="85"/>`).join('') +
    `<ellipse fill="none" cx="540" cy="690" rx="120" ry="170"/>` +
    `<path class="c" fill="#ffb74d" d="M470,210 L490,120 L540,195 Z"/><path class="c" fill="#ffb74d" d="M600,200 L640,115 L665,205 Z"/>` +
    `<circle class="c" fill="#66bb6a" cx="560" cy="330" r="150"/>` +
    `<ellipse class="c" fill="#a5d6a7" cx="665" cy="385" rx="92" ry="70"/>` +
    `<circle class="k" fill="#222228" cx="700" cy="370" r="10"/><circle class="k" fill="#222228" cx="640" cy="372" r="10"/>` +
    `<path class="c" fill="#ff7043" d="M760,380 C830,330 900,350 940,320 C920,380 960,420 930,470 C880,450 830,450 765,420 Z"/>` +
    `<path class="c" fill="#ffee58" d="M790,395 C840,375 880,385 905,370 C895,405 915,425 900,445 C860,435 830,435 790,415 Z"/>` +
    `<ellipse class="k" fill="#222228" cx="540" cy="300" rx="20" ry="27"/><circle fill="#fff" stroke="none" cx="547" cy="290" r="8"/>` +
    `<path fill="none" d="M600,440 Q650,470 700,440"/>` +
    `<g class="s" fill="#ff7b8a" opacity=".5" stroke="none"><ellipse cx="480" cy="390" rx="30" ry="18"/></g>`,
};

export const MORE_PICTURES: PictureDef[] = [
  ladybug, strawberry, cupcake, whale, frog, star, snail, tree, unicorn,
  dinosaur, crab, train, penguin, balloon,
  castle, dragon,
];

void rad; // shared helper kept for future pages
