import { face, P, shine, starPts } from './pictures.ts';
import { cloud, stickerDots } from './pictures2.ts';
import type { PictureDef } from './types';

// Third batch: 20 simple level-1 pages for the 3½-year-old, in four themes.
// Same conventions as pictures.ts / pictures2.ts. Level 1 = big regions only (each >= 2,500 px).

export const eyes = (cx: number, cy: number, gap: number, s = 1) =>
  [-1, 1].map((d) =>
    `<ellipse class="k" fill="#222228" cx="${P(cx + d * gap)}" cy="${cy}" rx="${P(20 * s)}" ry="${P(27 * s)}"/>` +
    `<circle fill="#fff" stroke="none" cx="${P(cx + d * gap + 6 * s)}" cy="${P(cy - 9 * s)}" r="${P(7.5 * s)}"/>`).join('');

export const blush = (pts: [number, number][], rx = 32, ry = 19) =>
  `<g class="s" fill="#ff7b8a" opacity=".55" stroke="none">${pts.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('')}</g>`;

export const twinkles = (pts: [number, number, number][], fill = '#fff59d') =>
  `<g class="s" fill="${fill}" stroke="none">${pts.map(([x, y, r]) => `<polygon points="${starPts(x, y, r, r * 0.42)}"/>`).join('')}</g>`;

export const zigzag = (x0: number, x1: number, yTop: number, yBot: number, n: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) pts.push(`${P(x0 + ((x1 - x0) * i) / n)},${i % 2 ? yTop : yBot}`);
  return pts.join(' L');
};

// ------------------------------------------------------------------ animals

const puppy: PictureDef = {
  kind: 'picture', id: 'puppy', name: 'Puppy', level: 1, theme: 'animals', bg: '#e1f5fe', sw: 16,
  body:
    `<ellipse class="c" fill="#ffcc80" cx="500" cy="880" rx="270" ry="170"/>` +
    `<ellipse class="c" fill="#8d6e63" cx="275" cy="430" rx="85" ry="175" transform="rotate(18 275 430)"/>` +
    `<ellipse class="c" fill="#8d6e63" cx="725" cy="430" rx="85" ry="175" transform="rotate(-18 725 430)"/>` +
    `<rect class="c" fill="#e53935" x="365" y="672" width="270" height="62" rx="31"/>` +
    `<circle class="c" fill="#fdd835" cx="500" cy="778" r="40"/>` +
    `<circle class="c" fill="#ffcc80" cx="500" cy="450" r="245"/>` +
    `<ellipse class="c" fill="#8d6e63" cx="592" cy="405" rx="82" ry="72"/>` +
    `<ellipse class="c" fill="#fff3e0" cx="500" cy="565" rx="135" ry="90"/>` +
    eyes(500, 425, 88) +
    `<ellipse class="k" fill="#222228" cx="500" cy="530" rx="42" ry="30"/>` +
    `<path fill="none" d="M500,558 L500,588 M456,592 Q478,618 500,592 Q522,618 544,592"/>` +
    blush([[378, 515], [622, 515]]),
};

const bunny: PictureDef = {
  kind: 'picture', id: 'bunny', name: 'Bunny', level: 1, theme: 'animals', bg: '#e8f5e9', sw: 16,
  body:
    `<path class="c" fill="#81c784" d="M0,830 C200,790 380,810 500,825 C650,845 820,800 1000,815 L1000,1000 L0,1000 Z"/>` +
    `<ellipse class="c" fill="#ffffff" cx="500" cy="800" rx="215" ry="165"/>` +
    `<ellipse class="c" fill="#ffffff" cx="405" cy="235" rx="64" ry="178" transform="rotate(-10 405 235)"/>` +
    `<ellipse class="c" fill="#ffffff" cx="595" cy="235" rx="64" ry="178" transform="rotate(10 595 235)"/>` +
    `<ellipse class="c" fill="#f8bbd0" cx="405" cy="240" rx="32" ry="120" transform="rotate(-10 405 240)"/>` +
    `<ellipse class="c" fill="#f8bbd0" cx="595" cy="240" rx="32" ry="120" transform="rotate(10 595 240)"/>` +
    `<path class="c" fill="#43a047" d="M720,700 C690,640 705,600 735,615 C742,575 790,575 790,625 C825,615 848,655 812,690 Z"/>` +
    `<path class="c" fill="#fb8c00" d="M690,715 C720,690 800,684 820,712 C832,742 772,815 660,895 C622,920 600,902 618,868 C640,828 660,760 690,715 Z"/>` +
    `<circle class="c" fill="#ffffff" cx="500" cy="480" r="200"/>` +
    face(500, 468, 0.95, { gap: 70 }) +
    `<ellipse class="s" fill="#f06292" stroke="none" cx="500" cy="500" rx="17" ry="12"/>`,
};

const elephant: PictureDef = {
  kind: 'picture', id: 'elephant', name: 'Elephant', level: 1, theme: 'animals', bg: '#fff8e1', sw: 16,
  body:
    `<ellipse class="c" fill="#90a4ae" cx="500" cy="880" rx="265" ry="165"/>` +
    `<path class="c" fill="#90a4ae" d="M435,560 C430,700 470,790 575,790 C665,790 722,725 732,628 L662,618 C655,690 622,718 578,718 C532,718 520,670 565,560 Z"/>` +
    `<circle class="c" fill="#90a4ae" cx="282" cy="440" r="165"/><circle class="c" fill="#90a4ae" cx="718" cy="440" r="165"/>` +
    `<circle class="c" fill="#f8bbd0" cx="268" cy="450" r="102"/><circle class="c" fill="#f8bbd0" cx="732" cy="450" r="102"/>` +
    `<ellipse class="c" fill="#b0bec5" cx="500" cy="440" rx="200" ry="190"/>` +
    eyes(500, 405, 72, 0.95) +
    blush([[392, 480], [608, 480]], 30, 17),
};

const pig: PictureDef = {
  kind: 'picture', id: 'pig', name: 'Pig', level: 1, theme: 'animals', bg: '#e3f2fd', sw: 16,
  body:
    `<ellipse class="c" fill="#a1887f" cx="500" cy="935" rx="430" ry="80"/>` +
    `<ellipse class="c" fill="#f8bbd0" cx="500" cy="860" rx="265" ry="150"/>` +
    `<path class="c" fill="#f48fb1" d="M320,330 L265,115 L450,240 Z"/><path class="c" fill="#f48fb1" d="M680,330 L735,115 L550,240 Z"/>` +
    `<circle class="c" fill="#f8bbd0" cx="500" cy="460" r="245"/>` +
    `<ellipse class="c" fill="#f48fb1" cx="500" cy="548" rx="115" ry="80"/>` +
    `<ellipse class="k" fill="#222228" cx="462" cy="548" rx="15" ry="24"/><ellipse class="k" fill="#222228" cx="538" cy="548" rx="15" ry="24"/>` +
    eyes(500, 410, 92, 0.95) +
    `<path fill="none" d="M440,662 Q500,695 560,662"/>` +
    blush([[352, 520], [648, 520]]),
};

const octopus: PictureDef = {
  kind: 'picture', id: 'octopus', name: 'Octopus', level: 1, theme: 'animals', bg: '#b3e5fc', sw: 16,
  body:
    `<path class="c" fill="#ffe082" d="M0,900 C200,870 400,890 500,900 C650,915 820,880 1000,890 L1000,1000 L0,1000 Z"/>` +
    [[300, 22], [385, 12], [465, 4], [535, -4], [615, -12], [700, -22]]
      .map(([x, a]) => `<rect class="c" fill="#ba68c8" x="${x - 36}" y="520" width="72" height="350" rx="36" transform="rotate(${a} ${x} 520)"/>`).join('') +
    `<ellipse class="c" fill="#ab47bc" cx="500" cy="420" rx="260" ry="250"/>` +
    shine(378, 300, 30, 62) +
    face(500, 450, 1.1, { gap: 80 }) +
    `<circle class="c" fill="#e1f5fe" cx="830" cy="185" r="54"/><circle class="c" fill="#e1f5fe" cx="905" cy="330" r="40"/>`,
};

// ------------------------------------------------------------------ vehicles

const bus: PictureDef = {
  kind: 'picture', id: 'bus', name: 'Bus', level: 1, theme: 'vehicles', bg: '#e3f2fd', sw: 16,
  body:
    `<rect class="c" fill="#9e9e9e" x="-20" y="860" width="1040" height="160"/>` +
    `<rect class="c" fill="#fdd835" x="100" y="300" width="800" height="460" rx="60"/>` +
    [150, 320, 490].map((x) => `<rect class="c" fill="#b3e5fc" x="${x}" y="360" width="140" height="150" rx="20"/>`).join('') +
    `<rect class="c" fill="#ffb300" x="680" y="360" width="150" height="380" rx="16"/>` +
    `<rect class="c" fill="#b3e5fc" x="702" y="382" width="106" height="160" rx="12"/>` +
    [280, 560].map((x) => `<circle class="k" fill="#222228" cx="${x}" cy="772" r="86"/><circle class="c" fill="#e0e0e0" cx="${x}" cy="772" r="38"/>`).join('') +
    `<circle class="s" fill="#fff59d" stroke="none" cx="866" cy="650" r="20"/>` +
    shine(200, 410, 14, 30, 20) + shine(370, 410, 14, 30, 20) + shine(540, 410, 14, 30, 20),
};

const truck: PictureDef = {
  kind: 'picture', id: 'truck', name: 'Truck', level: 1, theme: 'vehicles', bg: '#fff8e1', sw: 16,
  body:
    `<rect class="c" fill="#9e9e9e" x="-20" y="870" width="1040" height="150"/>` +
    `<rect class="c" fill="#1e88e5" x="90" y="330" width="500" height="420" rx="24"/>` +
    `<polygon class="c" fill="#fdd835" points="${starPts(340, 530, 115, 52)}"/>` +
    `<path class="c" fill="#e53935" d="M600,430 L780,430 C840,430 880,480 890,560 L900,750 L600,750 Z"/>` +
    `<path class="c" fill="#b3e5fc" d="M640,470 L770,470 C810,470 836,505 843,560 L640,560 Z"/>` +
    [230, 450, 765].map((x) => `<circle class="k" fill="#222228" cx="${x}" cy="782" r="82"/><circle class="c" fill="#e0e0e0" cx="${x}" cy="782" r="37"/>`).join('') +
    `<circle class="s" fill="#fff59d" stroke="none" cx="884" cy="680" r="18"/>`,
};

const airplane: PictureDef = {
  kind: 'picture', id: 'airplane', name: 'Airplane', level: 1, theme: 'vehicles', bg: '#b3e5fc', sw: 16,
  body:
    cloud(200, 770, 0.85) + cloud(820, 850, 0.65) +
    `<path class="c" fill="#1e88e5" d="M440,440 L330,230 L445,230 L600,440 Z"/>` +
    `<path class="c" fill="#e53935" d="M160,470 L110,280 L230,290 L330,470 Z"/>` +
    `<rect class="c" fill="#ffffff" x="120" y="420" width="760" height="160" rx="80"/>` +
    `<path class="c" fill="#1e88e5" d="M430,530 L320,780 L445,780 L612,530 Z"/>` +
    [300, 420, 540].map((x) => `<circle class="c" fill="#b3e5fc" cx="${x}" cy="478" r="35"/>`).join('') +
    `<path class="c" fill="#b3e5fc" d="M720,448 C792,446 842,464 866,500 L720,500 Z"/>`,
};

const sailboat: PictureDef = {
  kind: 'picture', id: 'sailboat', name: 'Sailboat', level: 1, theme: 'vehicles', bg: '#e1f5fe', sw: 16,
  body:
    `<circle class="c" fill="#fdd835" cx="835" cy="165" r="85"/>` +
    `<path class="c" fill="#29b6f6" d="M0,760 C120,720 240,720 360,760 C480,800 600,800 720,760 C840,720 920,720 1020,750 L1020,1020 L0,1020 Z"/>` +
    `<rect class="k" fill="#222228" x="488" y="165" width="24" height="520" rx="10"/>` +
    `<path class="c" fill="#e53935" d="M512,172 L615,212 L512,252 Z"/>` +
    `<path class="c" fill="#ffffff" d="M478,232 L478,600 L188,600 C258,480 358,330 478,232 Z"/>` +
    `<path class="c" fill="#ffd54f" d="M522,282 L522,600 L735,600 C694,480 622,370 522,282 Z"/>` +
    `<path class="c" fill="#e53935" d="M140,630 L860,630 C830,720 768,792 696,802 L304,802 C232,792 170,720 140,630 Z"/>` +
    [380, 500, 620].map((x) => `<circle class="c" fill="#fff3e0" cx="${x}" cy="708" r="37"/>`).join(''),
};

const helicopter: PictureDef = {
  kind: 'picture', id: 'helicopter', name: 'Helicopter', level: 1, theme: 'vehicles', bg: '#e3f2fd', sw: 16,
  body:
    cloud(820, 820, 0.75) +
    `<rect class="c" fill="#ef5350" x="560" y="470" width="330" height="64" rx="32"/>` +
    `<ellipse class="c" fill="#90a4ae" cx="884" cy="502" rx="28" ry="88"/>` +
    `<path fill="none" d="M250,775 L650,775 C682,775 700,760 712,742 M330,775 L360,690 M560,775 L532,690"/>` +
    `<ellipse class="c" fill="#ef5350" cx="430" cy="530" rx="232" ry="172"/>` +
    `<path class="c" fill="#b3e5fc" d="M430,392 C338,388 250,430 224,522 L430,522 Z"/>` +
    `<rect class="k" fill="#222228" x="410" y="300" width="40" height="72" rx="8"/>` +
    `<rect class="c" fill="#78909c" x="130" y="266" width="600" height="46" rx="23"/>` +
    shine(330, 440, 14, 34, 30),
};

// ------------------------------------------------------------------ fairy tale

const crown: PictureDef = {
  kind: 'picture', id: 'crown', name: 'Crown', level: 1, theme: 'fairy', bg: '#f3e5f5', sw: 16,
  body:
    twinkles([[120, 200, 40], [880, 180, 34], [500, 110, 30], [860, 470, 26], [140, 500, 24]]) +
    `<path class="c" fill="#ab47bc" d="M150,840 C150,770 250,745 500,745 C750,745 850,770 850,840 C850,910 750,930 500,930 C250,930 150,910 150,840 Z"/>` +
    `<path class="c" fill="#fdd835" d="M232,700 L190,330 L345,480 L420,250 L500,430 L580,250 L655,480 L810,330 L768,700 Z"/>` +
    `<rect class="c" fill="#ffb300" x="212" y="600" width="576" height="140" rx="26"/>` +
    [[340, '#e53935'], [500, '#1e88e5'], [660, '#43a047']].map(([x, c]) => `<circle class="c" fill="${c}" cx="${x}" cy="670" r="40"/>`).join('') +
    [[190, 330], [420, 250], [580, 250], [810, 330]].map(([x, y]) => `<circle class="c" fill="#f8bbd0" cx="${x}" cy="${y}" r="36"/>`).join('') +
    shine(320, 530, 16, 40, 10),
};

export function scallops(x0: number, x1: number, y: number, n: number, depth: number) {
  const w = (x1 - x0) / n;
  let d = `M${x0},${y}`;
  for (let i = 0; i < n; i++) d += ` Q${P(x0 + w * (i + 0.5))},${y + depth} ${P(x0 + w * (i + 1))},${y}`;
  return d;
}

const SKIRT = 'M380,470 C300,600 210,770 150,880 C360,945 640,945 850,880 C790,770 700,600 620,470 Z';

const dress: PictureDef = {
  kind: 'picture', id: 'dress', name: 'Party dress', level: 1, theme: 'fairy', bg: '#fce4ec', sw: 16,
  body:
    `<circle class="c" fill="#f8bbd0" cx="385" cy="270" r="62"/><circle class="c" fill="#f8bbd0" cx="615" cy="270" r="62"/>` +
    `<clipPath id="sk"><path d="${SKIRT}"/></clipPath>` +
    `<path class="c" fill="#f48fb1" d="${SKIRT}"/>` +
    `<path class="c" fill="#fce4ec" clip-path="url(#sk)" d="${scallops(100, 900, 790, 8, 55)} L900,1000 L100,1000 Z"/>` +
    `<path fill="none" d="${SKIRT}"/>` +
    `<path class="c" fill="#ec407a" d="M400,230 C440,252 560,252 600,230 L625,482 L375,482 Z"/>` +
    `<path class="c" fill="#ce93d8" d="M500,482 L395,428 L395,536 Z"/><path class="c" fill="#ce93d8" d="M500,482 L605,428 L605,536 Z"/>` +
    `<circle class="c" fill="#ba68c8" cx="500" cy="482" r="36"/>` +
    stickerDots([[300, 700], [400, 640], [500, 720], [600, 640], [700, 700], [450, 560], [560, 580]], '#ffffff', 11, 11),
};

const WAND = { x: 470, y: 500, w: 64, h: 430 };

const wand: PictureDef = {
  kind: 'picture', id: 'wand', name: 'Magic wand', level: 1, theme: 'fairy', bg: '#ede7f6', sw: 16,
  body:
    `<g transform="rotate(28 502 500)">` +
    `<clipPath id="wd"><rect x="${WAND.x}" y="${WAND.y}" width="${WAND.w}" height="${WAND.h}" rx="32"/></clipPath>` +
    `<rect class="c" fill="#ab47bc" x="${WAND.x}" y="${WAND.y}" width="${WAND.w}" height="${WAND.h}" rx="32"/>` +
    [610, 760].map((y) => `<rect class="c" fill="#f48fb1" clip-path="url(#wd)" x="${WAND.x - 10}" y="${y}" width="${WAND.w + 20}" height="62"/>`).join('') +
    `<rect fill="none" x="${WAND.x}" y="${WAND.y}" width="${WAND.w}" height="${WAND.h}" rx="32"/>` +
    `</g>` +
    `<polygon class="c" fill="#fdd835" points="${starPts(500, 360, 250, 115)}"/>` +
    face(500, 378, 0.9, { gap: 56 }) +
    `<polygon class="c" fill="#4fc3f7" points="${starPts(160, 200, 62, 27)}"/>` +
    `<polygon class="c" fill="#f48fb1" points="${starPts(845, 170, 58, 25)}"/>` +
    `<polygon class="c" fill="#81c784" points="${starPts(820, 660, 64, 28)}"/>` +
    twinkles([[180, 560, 22], [880, 420, 18], [640, 900, 20]]),
};

const mushroomHouse: PictureDef = {
  kind: 'picture', id: 'mushroom-house', name: 'Mushroom house', level: 1, theme: 'fairy', bg: '#e8f5e9', sw: 16,
  body:
    `<path class="c" fill="#81c784" d="M0,850 C200,820 350,840 500,850 C650,860 800,830 1000,845 L1000,1000 L0,1000 Z"/>` +
    `<path class="c" fill="#fff3e0" d="M300,500 L280,872 L720,872 L700,500 Z"/>` +
    `<path class="c" fill="#8d6e63" d="M440,872 L440,725 A60,60 0 0 1 560,725 L560,872 Z"/>` +
    `<circle class="c" fill="#ffe082" cx="366" cy="662" r="42"/><circle class="c" fill="#ffe082" cx="634" cy="662" r="42"/>` +
    `<path class="c" fill="#e53935" d="M110,540 C110,280 300,130 500,130 C700,130 890,280 890,540 C760,582 240,582 110,540 Z"/>` +
    `<circle class="c" fill="#ffffff" cx="300" cy="335" r="56"/><circle class="c" fill="#ffffff" cx="500" cy="232" r="50"/>` +
    `<ellipse class="c" fill="#ffffff" cx="695" cy="345" rx="62" ry="50"/><circle class="c" fill="#ffffff" cx="480" cy="440" r="44"/>` +
    `<circle class="k" fill="#222228" cx="540" cy="800" r="9"/>`,
};

const swan: PictureDef = {
  kind: 'picture', id: 'swan', name: 'Swan', level: 1, theme: 'fairy', bg: '#e1f5fe', sw: 16,
  body:
    `<ellipse class="c" fill="#4fc3f7" cx="500" cy="855" rx="480" ry="135"/>` +
    `<ellipse class="c" fill="#66bb6a" cx="840" cy="905" rx="105" ry="42"/>` +
    `<path fill="none" d="M840,905 L925,890"/>` +
    `<path class="c" fill="#ffffff" d="M200,700 C180,600 262,560 362,590 C462,620 562,640 702,600 C802,570 862,610 832,680 C802,760 702,800 522,800 C342,800 222,770 200,700 Z"/>` +
    `<path class="c" fill="#ffffff" d="M290,630 C238,530 232,410 285,318 L372,326 C322,410 322,520 368,630 Z"/>` +
    `<path class="c" fill="#fb8c00" d="M272,272 L150,312 L278,342 Z"/>` +
    `<circle class="c" fill="#ffffff" cx="332" cy="292" r="72"/>` +
    `<path class="c" fill="#fdd835" d="M282,232 L286,162 L311,198 L332,150 L353,198 L378,162 L382,232 Z"/>` +
    `<path class="c" fill="#e3f2fd" d="M425,640 C525,560 685,560 765,612 C705,700 565,730 425,640 Z"/>` +
    `<circle class="k" fill="#222228" cx="315" cy="285" r="14"/>` +
    blush([[350, 318]], 22, 13),
};

// ------------------------------------------------------------------ space & dinosaurs

const RING = 'M100,520 A400,115 0 1 0 900,520 A400,115 0 1 0 100,520 Z M200,520 A300,70 0 1 0 800,520 A300,70 0 1 0 200,520 Z';

const planet: PictureDef = {
  kind: 'picture', id: 'planet', name: 'Planet', level: 1, theme: 'space', bg: '#1a237e', sw: 16,
  body:
    twinkles([[880, 330, 20], [80, 380, 18], [300, 930, 22], [700, 900, 16]]) +
    `<circle class="c" fill="#e0e0e0" cx="170" cy="185" r="72"/>` +
    [[830, 160, 58], [130, 820, 52], [860, 830, 60]].map(([x, y, r]) => `<polygon class="c" fill="#fff59d" points="${starPts(x, y, r, r * 0.44)}"/>`).join('') +
    `<path class="c" fill="#ffcc80" fill-rule="evenodd" d="${RING}"/>` +
    `<circle class="c" fill="#ff8a65" cx="500" cy="520" r="230"/>` +
    `<clipPath id="fr"><rect x="0" y="520" width="1000" height="480"/></clipPath>` +
    `<path class="c" fill="#ffcc80" fill-rule="evenodd" clip-path="url(#fr)" d="${RING}"/>` +
    face(500, 440, 0.9, { gap: 70 }),
};

const moon: PictureDef = {
  kind: 'picture', id: 'moon', name: 'Moon', level: 1, theme: 'space', bg: '#283593', sw: 16,
  body:
    twinkles([[110, 860, 18], [930, 640, 16], [380, 70, 18]]) +
    `<path class="c" fill="#fff59d" d="M533.9,145.8 A360,360 0 1 0 773.7,693.4 A300,300 0 1 1 533.9,145.8 Z"/>` +
    [[640, 330, 62], [830, 200, 54], [880, 470, 52], [170, 120, 50]].map(([x, y, r]) => `<polygon class="c" fill="#fdd835" points="${starPts(x, y, r, r * 0.44)}"/>`).join('') +
    cloud(650, 860, 1.15, '#e1f5fe') +
    `<path fill="none" d="M205,415 Q245,445 285,415 M222,530 Q262,565 305,522"/>` +
    blush([[275, 478]], 28, 17),
};

const alien: PictureDef = {
  kind: 'picture', id: 'alien', name: 'Alien', level: 1, theme: 'space', bg: '#e8eaf6', sw: 16,
  body:
    twinkles([[120, 160, 30], [880, 220, 26], [140, 700, 22], [870, 640, 24]], '#ffca28') +
    `<path fill="none" d="M420,255 L362,125 M580,255 L638,125"/>` +
    `<circle class="c" fill="#ec407a" cx="356" cy="112" r="44"/><circle class="c" fill="#ec407a" cx="644" cy="112" r="44"/>` +
    `<rect class="c" fill="#9ccc65" x="235" y="650" width="140" height="58" rx="29" transform="rotate(-28 372 679)"/>` +
    `<rect class="c" fill="#9ccc65" x="625" y="650" width="140" height="58" rx="29" transform="rotate(28 628 679)"/>` +
    `<path class="c" fill="#9ccc65" d="M340,590 C318,740 330,880 382,930 L618,930 C670,880 682,740 660,590 Z"/>` +
    `<ellipse class="c" fill="#7cb342" cx="415" cy="935" rx="82" ry="42"/><ellipse class="c" fill="#7cb342" cx="585" cy="935" rx="82" ry="42"/>` +
    `<ellipse class="c" fill="#9ccc65" cx="500" cy="420" rx="242" ry="200"/>` +
    `<circle class="c" fill="#ffffff" cx="500" cy="392" r="96"/>` +
    `<circle class="k" fill="#222228" cx="510" cy="402" r="46"/><circle fill="#fff" stroke="none" cx="526" cy="384" r="14"/>` +
    `<path fill="none" d="M428,525 Q500,575 572,525"/>` +
    blush([[340, 470], [660, 470]], 34, 20),
};

const ufo: PictureDef = {
  kind: 'picture', id: 'ufo', name: 'Flying saucer', level: 1, theme: 'space', bg: '#311b92', sw: 16,
  body:
    twinkles([[120, 140, 30], [880, 160, 26], [190, 420, 18], [840, 380, 20], [100, 700, 22], [900, 690, 24]]) +
    `<path class="c" fill="#7e57c2" d="M-20,870 C250,820 750,820 1020,870 L1020,1020 L-20,1020 Z"/>` +
    `<path class="c" fill="#fff59d" d="M400,540 L600,540 L762,884 L238,884 Z"/>` +
    `<path class="c" fill="#b3e5fc" d="M330,420 C330,300 400,228 500,228 C600,228 670,300 670,420 Z"/>` +
    `<path fill="none" d="M474,280 L462,258 M526,280 L538,258"/>` +
    `<circle class="c" fill="#9ccc65" cx="500" cy="336" r="64"/>` +
    `<circle class="k" fill="#222228" cx="477" cy="326" r="12"/><circle class="k" fill="#222228" cx="523" cy="326" r="12"/>` +
    `<ellipse class="c" fill="#b0bec5" cx="500" cy="452" rx="340" ry="95"/>` +
    [[320, 472, '#fdd835'], [500, 494, '#ec407a'], [680, 472, '#4fc3f7']].map(([x, y, c]) => `<circle class="c" fill="${c}" cx="${x}" cy="${y}" r="39"/>`).join('') +
    shine(380, 300, 16, 36, 30),
};

const dinoEgg: PictureDef = {
  kind: 'picture', id: 'dino-egg', name: 'Baby dino', level: 1, theme: 'space', bg: '#fff8e1', sw: 16,
  body:
    `<ellipse class="c" fill="#a1887f" cx="500" cy="880" rx="370" ry="98"/>` +
    `<path fill="none" d="M190,860 L250,845 M780,850 L840,868 M200,905 L260,900"/>` +
    `<path class="c" fill="#81c784" d="M360,640 C330,470 360,330 470,300 C600,265 690,350 680,450 C672,520 630,560 640,640 Z"/>` +
    `<path class="c" fill="#fff3e0" d="M${zigzag(240, 760, 545, 600, 10)} C780,760 660,902 500,902 C340,902 220,760 240,600 Z"/>` +
    `<ellipse class="c" fill="#aed581" cx="372" cy="722" rx="46" ry="36"/><ellipse class="c" fill="#aed581" cx="565" cy="805" rx="52" ry="38"/><ellipse class="c" fill="#aed581" cx="655" cy="680" rx="40" ry="33"/>` +
    `<path class="c" fill="#fff3e0" d="M405,330 C400,230 450,170 520,170 C590,170 640,225 640,300 L605,270 L570,315 L535,270 L500,315 L465,270 L430,315 Z"/>` +
    face(512, 420, 0.75, { gap: 60 }),
};

export const PICTURES3: PictureDef[] = [
  puppy, bunny, elephant, pig, octopus,
  bus, truck, airplane, sailboat, helicopter,
  crown, dress, wand, mushroomHouse, swan,
  planet, moon, alien, ufo, dinoEgg,
];
