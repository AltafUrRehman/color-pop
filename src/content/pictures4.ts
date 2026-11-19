import { face, P, rad, shine, starPts } from './pictures.ts';
import { cloud, stickerDots } from './pictures2.ts';
import { blush, eyes, scallops, twinkles } from './pictures3.ts';
import type { PictureDef } from './types';

// Fourth batch: 20 detailed level-2/3 pages for the 7-year-old, in four themes.

/** a rounded bar from (x1,y1) to (x2,y2), w wide (arms, legs, booms) */
function capsule(x1: number, y1: number, x2: number, y2: number, w: number, fill: string) {
  const len = Math.hypot(x2 - x1, y2 - y1), deg = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  return `<rect class="c" fill="${fill}" x="${x1}" y="${P(y1 - w / 2)}" width="${P(len)}" height="${w}" rx="${P(w / 2)}" transform="rotate(${P(deg)} ${x1} ${y1})"/>`;
}

/** coloured bands inside a shape: clip, fill each band, then re-stroke the outline */
function bands(id: string, shape: string, cuts: { d: string; fill: string }[], base: string) {
  return `<clipPath id="${id}">${shape.replace('<path ', '<path ')}</clipPath>` +
    shape.replace('/>', ` class="c" fill="${base}"/>`) +
    cuts.map((b) => `<path class="c" fill="${b.fill}" clip-path="url(#${id})" d="${b.d}"/>`).join('') +
    shape.replace('/>', ' fill="none"/>');
}

const ground = (fill: string, y = 880) =>
  `<path class="c" fill="${fill}" d="M-20,${y} C250,${y - 30} 750,${y - 30} 1020,${y} L1020,1020 L-20,1020 Z"/>`;

// ------------------------------------------------------------------ animals

const lion: PictureDef = {
  kind: 'picture', id: 'lion', name: 'Lion', level: 2, theme: 'animals', bg: '#fff8e1', sw: 13,
  body:
    Array.from({ length: 12 }, (_, i) => {
      const a = rad(i * 30 - 90);
      return `<circle class="c" fill="${i % 2 ? '#ffa726' : '#ef6c00'}" cx="${P(500 + 235 * Math.cos(a))}" cy="${P(470 + 235 * Math.sin(a))}" r="92"/>`;
    }).join('') +
    `<circle class="c" fill="#ffcc80" cx="365" cy="282" r="56"/><circle class="c" fill="#ffcc80" cx="635" cy="282" r="56"/>` +
    `<circle class="c" fill="#ffcc80" cx="500" cy="480" r="215"/>` +
    `<ellipse class="c" fill="#fff3e0" cx="455" cy="578" rx="72" ry="56"/><ellipse class="c" fill="#fff3e0" cx="545" cy="578" rx="72" ry="56"/>` +
    `<path class="k" fill="#222228" d="M462,512 Q500,496 538,512 Q522,548 500,552 Q478,548 462,512 Z"/>` +
    eyes(500, 440, 82, 0.9) +
    `<path fill="none" d="M468,640 Q500,662 532,640"/>` +
    stickerDots([[425, 565], [440, 595], [575, 565], [560, 595]], '#8d6e63', 5, 5) +
    blush([[360, 545], [640, 545]], 30, 18),
};

const giraffe: PictureDef = {
  kind: 'picture', id: 'giraffe', name: 'Giraffe', level: 2, theme: 'animals', bg: '#e3f2fd', sw: 13,
  body:
    `<circle class="c" fill="#fdd835" cx="855" cy="145" r="70"/>` +
    ground('#aed581') +
    `<path fill="none" d="M880,600 C910,640 915,690 905,730"/><ellipse class="k" fill="#222228" cx="905" cy="745" rx="14" ry="24"/>` +
    [530, 600, 760, 830].map((x) => `<rect class="c" fill="#ffd54f" x="${x}" y="640" width="46" height="250" rx="18"/><rect class="k" fill="#222228" x="${x}" y="868" width="46" height="26" rx="8"/>`).join('') +
    `<path class="c" fill="#ffd54f" d="M505,640 L360,300 L455,262 L610,600 Z"/>` +
    `<ellipse class="c" fill="#ffd54f" cx="690" cy="630" rx="205" ry="115"/>` +
    `<ellipse class="c" fill="#ffd54f" cx="478" cy="198" rx="46" ry="20" transform="rotate(-30 478 198)"/>` +
    `<path fill="none" d="M380,168 L374,112 M430,172 L438,116"/>` +
    `<circle class="k" fill="#222228" cx="373" cy="104" r="16"/><circle class="k" fill="#222228" cx="439" cy="108" r="16"/>` +
    `<ellipse class="c" fill="#ffd54f" cx="362" cy="235" rx="112" ry="76" transform="rotate(-12 362 235)"/>` +
    `<ellipse class="c" fill="#ffe0b2" cx="272" cy="262" rx="62" ry="48" transform="rotate(-12 272 262)"/>` +
    `<ellipse class="k" fill="#222228" cx="380" cy="218" rx="13" ry="17"/><circle fill="#fff" stroke="none" cx="384" cy="212" r="5"/>` +
    `<circle class="k" fill="#222228" cx="244" cy="252" r="7"/>` +
    `<path fill="none" d="M252,290 Q276,300 300,288"/>` +
    [[600, 600, 40, 30], [700, 580, 45, 32], [800, 625, 38, 30], [650, 690, 42, 27], [760, 700, 36, 24], [490, 470, 30, 24], [447, 372, 25, 19], [530, 560, 28, 22]]
      .map(([x, y, rx, ry]) => `<ellipse class="c" fill="#a1662f" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('') +
    blush([[330, 268]], 22, 13),
};

const WING = 'M600,380 C700,420 735,560 692,705 C640,692 598,622 588,520 Z';

const parrot: PictureDef = {
  kind: 'picture', id: 'parrot', name: 'Parrot', level: 2, theme: 'animals', bg: '#e8f5e9', sw: 13,
  body:
    `<path class="c" fill="#66bb6a" d="M-10,180 C120,120 260,160 320,260 C200,282 80,262 -10,180 Z"/>` +
    `<path class="c" fill="#66bb6a" d="M1010,120 C880,80 760,120 720,220 C840,242 940,212 1010,120 Z"/>` +
    `<path class="c" fill="#8d6e63" d="M40,760 C300,730 700,740 970,700 L980,752 C700,792 300,792 50,812 Z"/>` +
    `<ellipse class="c" fill="#1e88e5" cx="522" cy="820" rx="34" ry="150" transform="rotate(10 522 820)"/>` +
    `<ellipse class="c" fill="#fdd835" cx="576" cy="832" rx="34" ry="150"/>` +
    `<ellipse class="c" fill="#e53935" cx="630" cy="820" rx="34" ry="150" transform="rotate(-10 630 820)"/>` +
    `<ellipse class="c" fill="#e53935" cx="560" cy="520" rx="150" ry="212" transform="rotate(-15 560 520)"/>` +
    bands('pw', `<path d="${WING}"/>`, [
      { d: 'M560,470 L760,470 L760,580 L560,580 Z', fill: '#43a047' },
      { d: 'M560,580 L760,580 L760,740 L560,740 Z', fill: '#1e88e5' },
    ], '#fdd835') +
    `<path fill="none" d="M520,730 C510,752 522,768 542,760 M582,732 C576,752 590,766 610,756"/>` +
    `<circle class="c" fill="#e53935" cx="470" cy="300" r="105"/>` +
    `<ellipse class="c" fill="#ffffff" cx="448" cy="290" rx="50" ry="42"/>` +
    `<circle class="k" fill="#222228" cx="450" cy="288" r="15"/><circle fill="#fff" stroke="none" cx="455" cy="282" r="5"/>` +
    `<path class="c" fill="#eeeeee" d="M398,288 C345,278 300,318 318,388 C336,366 362,350 402,346 Z"/>` +
    `<path class="k" fill="#222228" d="M402,346 C380,353 352,368 346,392 C373,396 396,381 410,360 Z"/>`,
};

const DOLPHIN = 'M215,840 C230,560 380,380 560,360 C700,345 800,410 830,480 C850,500 880,520 902,540 C880,560 840,565 810,560 C740,545 660,522 560,540 C430,565 335,700 305,850 Z';

const dolphin: PictureDef = {
  kind: 'picture', id: 'dolphin', name: 'Dolphin', level: 2, theme: 'animals', bg: '#b3e5fc', sw: 13,
  body:
    `<circle class="c" fill="#fdd835" cx="130" cy="150" r="72"/>` +
    `<circle class="c" fill="#e53935" cx="800" cy="210" r="88"/>` +
    `<path class="c" fill="#ffffff" d="M800,122 C735,160 735,260 800,298 C865,260 865,160 800,122 Z"/>` +
    `<path class="c" fill="#1e88e5" d="M800,122 C778,160 778,260 800,298 C822,260 822,160 800,122 Z"/>` +
    `<path class="c" fill="#4fc3f7" d="M-20,700 C120,660 240,660 360,700 C480,740 600,740 720,700 C840,660 920,660 1020,690 L1020,1020 L-20,1020 Z"/>` +
    `<path class="c" fill="#78909c" d="M498,382 C512,302 560,262 622,250 C602,300 602,340 612,368 Z"/>` +
    bands('dol', `<path d="${DOLPHIN}"/>`, [
      { d: 'M290,900 C350,660 470,575 600,560 C700,552 800,575 905,555 L905,900 Z', fill: '#eceff1' },
    ], '#90a4ae') +
    `<path class="c" fill="#78909c" d="M560,528 C572,600 542,642 500,662 C510,612 520,562 540,524 Z"/>` +
    `<circle class="k" fill="#222228" cx="760" cy="452" r="13"/><circle fill="#fff" stroke="none" cx="764" cy="447" r="4"/>` +
    `<path fill="none" d="M800,522 Q832,534 864,526"/>` +
    `<path class="c" fill="#0288d1" d="M-20,800 C140,760 260,760 400,800 C540,840 660,840 800,800 C900,770 950,770 1020,785 L1020,1020 L-20,1020 Z"/>` +
    [[140, 690], [905, 700], [360, 760]].map(([x, y]) => `<path class="c" fill="#e1f5fe" d="M${x},${y} C${x - 22},${y - 30} ${x - 8},${y - 58} ${x + 2},${y - 80} C${x + 12},${y - 58} ${x + 26},${y - 30} ${x + 4},${y} Z"/>`).join('') +
    blush([[792, 495]], 20, 12),
};

const peacock: PictureDef = {
  kind: 'picture', id: 'peacock', name: 'Peacock', level: 3, theme: 'animals', bg: '#e8f5e9', sw: 11,
  body:
    ground('#a5d6a7', 860) +
    Array.from({ length: 9 }, (_, i) => {
      const deg = -160 + i * 17.5;
      return `<ellipse class="c" fill="${i % 2 ? '#43a047' : '#2e7d32'}" cx="830" cy="720" rx="150" ry="70" transform="rotate(${deg} 500 720)"/>`;
    }).join('') +
    Array.from({ length: 9 }, (_, i) => {
      const deg = -160 + i * 17.5;
      return `<g transform="rotate(${deg} 500 720)"><ellipse class="c" fill="#fdd835" cx="900" cy="720" rx="56" ry="42"/><ellipse class="c" fill="#1e88e5" cx="905" cy="720" rx="34" ry="25"/><circle class="k" fill="#222228" cx="910" cy="720" r="9"/></g>`;
    }).join('') +
    `<path fill="none" d="M470,735 L455,850 M530,735 L545,850 M455,850 L430,862 M455,850 L470,866 M545,850 L520,866 M545,850 L570,862"/>` +
    `<path class="c" fill="#1e88e5" d="M500,750 C420,750 398,650 430,565 C450,505 468,440 478,388 C488,356 522,356 528,388 C538,448 562,522 582,585 C602,665 580,750 500,750 Z"/>` +
    `<path class="c" fill="#26a69a" d="M452,590 C472,528 562,548 572,628 C562,700 482,712 452,650 Z"/>` +
    `<path fill="none" d="M490,322 L470,262 M505,320 L505,255 M520,322 L540,262"/>` +
    `<circle class="k" fill="#222228" cx="470" cy="255" r="11"/><circle class="k" fill="#222228" cx="505" cy="247" r="11"/><circle class="k" fill="#222228" cx="540" cy="255" r="11"/>` +
    `<path class="c" fill="#ffb74d" d="M540,355 L590,368 L542,382 Z"/>` +
    `<circle class="c" fill="#1e88e5" cx="505" cy="362" r="44"/>` +
    `<circle class="k" fill="#222228" cx="515" cy="352" r="8"/>` +
    `<path class="s" fill="#ffffff" stroke="none" d="M495,370 C505,364 525,364 530,372 C520,380 505,380 495,370 Z"/>`,
};

// ------------------------------------------------------------------ vehicles

const fireEngine: PictureDef = {
  kind: 'picture', id: 'fire-engine', name: 'Fire engine', level: 2, theme: 'vehicles', bg: '#fff8e1', sw: 13,
  body:
    `<rect class="c" fill="#9e9e9e" x="-20" y="880" width="1040" height="140"/>` +
    `<g class="s" fill="#ffffff" stroke="none">${[60, 260, 460, 660, 860].map((x) => `<rect x="${x}" y="940" width="110" height="16" rx="8"/>`).join('')}</g>` +
    `<rect class="c" fill="#bdbdbd" x="150" y="300" width="540" height="80" rx="12"/>` +
    `<path fill="none" d="M258,300 L258,380 M366,300 L366,380 M474,300 L474,380 M582,300 L582,380"/>` +
    `<rect class="c" fill="#e53935" x="110" y="380" width="600" height="420" rx="20"/>` +
    `<rect class="c" fill="#fdd835" x="110" y="610" width="600" height="50"/>` +
    `<rect class="c" fill="#ef9a9a" x="150" y="420" width="170" height="160" rx="12"/><rect class="c" fill="#ef9a9a" x="350" y="420" width="170" height="160" rx="12"/>` +
    `<circle class="c" fill="#bdbdbd" cx="618" cy="500" r="62"/><circle class="c" fill="#757575" cx="618" cy="500" r="26"/>` +
    `<path class="c" fill="#e53935" d="M710,470 L840,470 C880,470 902,500 907,560 L912,800 L700,800 Z"/>` +
    `<rect class="c" fill="#42a5f5" x="742" y="436" width="92" height="34" rx="12"/>` +
    `<path class="c" fill="#b3e5fc" d="M735,502 L830,502 C856,502 869,527 873,582 L735,582 Z"/>` +
    [260, 560, 805].map((x) => `<circle class="k" fill="#222228" cx="${x}" cy="812" r="78"/><circle class="c" fill="#e0e0e0" cx="${x}" cy="812" r="34"/>`).join('') +
    `<circle class="s" fill="#fff59d" stroke="none" cx="900" cy="700" r="16"/>`,
};

const digger: PictureDef = {
  kind: 'picture', id: 'digger', name: 'Digger', level: 2, theme: 'vehicles', bg: '#e3f2fd', sw: 13,
  body:
    `<rect class="c" fill="#bcaaa4" x="-20" y="880" width="1040" height="140"/>` +
    `<path class="c" fill="#8d6e63" d="M640,882 C690,780 760,730 850,740 C930,750 985,820 1010,882 Z"/>` +
    `<path fill="none" d="M520,562 L620,470"/>` +
    capsule(470, 600, 739, 331, 72, '#ffb300') +
    `<path class="c" fill="#ffb300" d="M766,318 L907,607 L853,633 L712,344 Z"/>` +
    `<path class="c" fill="#757575" d="M850,592 C932,600 974,652 962,722 L932,746 L906,722 L880,750 L855,724 L830,752 C800,722 800,652 850,592 Z"/>` +
    `<rect class="c" fill="#fdd835" x="160" y="560" width="400" height="205" rx="20"/>` +
    `<path class="c" fill="#fdd835" d="M190,565 L190,330 L400,330 C440,330 460,360 460,400 L460,565 Z"/>` +
    `<path class="c" fill="#b3e5fc" d="M225,370 L380,370 C405,370 420,390 420,415 L420,522 L225,522 Z"/>` +
    `<rect class="k" fill="#222228" x="500" y="470" width="22" height="92" rx="6"/>` +
    `<rect class="c" fill="#616161" x="120" y="762" width="540" height="130" rx="65"/>` +
    [190, 310, 430, 550].map((x) => `<circle class="c" fill="#bdbdbd" cx="${x}" cy="827" r="42"/>`).join('') +
    [[470, 600], [739, 331], [880, 620]].map(([x, y]) => `<circle class="k" fill="#222228" cx="${x}" cy="${y}" r="14"/>`).join(''),
};

const tractor: PictureDef = {
  kind: 'picture', id: 'tractor', name: 'Tractor', level: 2, theme: 'vehicles', bg: '#e1f5fe', sw: 13,
  body:
    `<circle class="c" fill="#fdd835" cx="130" cy="140" r="72"/>` + cloud(820, 150, 0.7) + cloud(480, 110, 0.5) +
    `<path class="c" fill="#aed581" d="M-20,760 C300,740 700,740 1020,760 L1020,840 C700,820 300,820 -20,840 Z"/>` +
    `<path class="c" fill="#9ccc65" d="M-20,840 C300,820 700,820 1020,840 L1020,920 C700,900 300,900 -20,920 Z"/>` +
    `<path class="c" fill="#8bc34a" d="M-20,920 C300,900 700,900 1020,920 L1020,1020 L-20,1020 Z"/>` +
    `<rect class="k" fill="#222228" x="760" y="380" width="30" height="145" rx="8"/>` +
    `<path class="c" fill="#43a047" d="M420,520 L860,520 C880,520 892,540 892,560 L892,700 L420,700 Z"/>` +
    `<path fill="none" d="M860,560 L860,670"/>` +
    `<path class="c" fill="#43a047" d="M190,525 L190,292 C190,265 210,250 235,250 L455,250 C480,250 495,265 495,292 L495,525 Z"/>` +
    `<path class="c" fill="#b3e5fc" d="M230,295 L455,295 L455,470 L230,470 Z"/>` +
    `<circle class="k" fill="#222228" cx="770" cy="740" r="100"/><circle class="c" fill="#fdd835" cx="770" cy="740" r="46"/>` +
    `<circle class="k" fill="#222228" cx="300" cy="660" r="180"/><circle class="c" fill="#fdd835" cx="300" cy="660" r="86"/>` +
    `<circle class="k" fill="#222228" cx="300" cy="660" r="22"/>` +
    `<path class="c" fill="#2e7d32" d="M90,640 A210,210 0 0 1 510,640 L475,640 A175,175 0 0 0 125,640 Z"/>`,
};

const submarine: PictureDef = {
  kind: 'picture', id: 'submarine', name: 'Submarine', level: 2, theme: 'vehicles', bg: '#80deea', sw: 13,
  body:
    `<path class="c" fill="#ffe082" d="M-20,880 C200,850 400,870 600,860 C800,850 900,870 1020,860 L1020,1020 L-20,1020 Z"/>` +
    `<path class="c" fill="#66bb6a" d="M120,882 C80,800 160,740 110,650 C170,720 190,800 152,882 Z"/>` +
    `<path class="c" fill="#43a047" d="M880,872 C850,782 920,722 880,632 C950,702 962,792 912,872 Z"/>` +
    `<polygon class="c" fill="#ff8a65" points="${starPts(620, 925, 52, 23)}"/>` +
    `<path class="c" fill="#ffb300" d="M560,342 L560,212 C560,200 570,192 582,192 L652,192 L652,232 L594,232 L594,342 Z"/>` +
    `<path class="c" fill="#fdd835" d="M420,362 L440,272 L620,272 L650,362 Z"/>` +
    `<ellipse class="c" fill="#ffb300" cx="112" cy="425" rx="24" ry="52"/><ellipse class="c" fill="#ffb300" cx="112" cy="535" rx="24" ry="52"/>` +
    `<circle class="k" fill="#222228" cx="128" cy="480" r="20"/>` +
    `<rect class="c" fill="#fdd835" x="150" y="350" width="690" height="260" rx="130"/>` +
    [330, 485, 640].map((x) => `<circle class="c" fill="#b3e5fc" cx="${x}" cy="482" r="46"/>`).join('') +
    shine(318, 470, 10, 22, 30) + shine(473, 470, 10, 22, 30) + shine(628, 470, 10, 22, 30) +
    `<ellipse class="c" fill="#ff7043" cx="790" cy="760" rx="62" ry="38"/><path class="c" fill="#ff7043" d="M846,760 L905,722 L905,798 Z"/>` +
    `<circle class="k" fill="#222228" cx="762" cy="752" r="8"/>` +
    `<ellipse class="c" fill="#ab47bc" cx="240" cy="200" rx="54" ry="34"/><path class="c" fill="#ab47bc" d="M190,200 L135,168 L135,232 Z"/>` +
    `<circle class="k" fill="#222228" cx="265" cy="192" r="7"/>` +
    `<circle class="c" fill="#e0f7fa" cx="700" cy="215" r="28"/>` +
    `<g class="s" fill="#e0f7fa" stroke="#222228" stroke-width="6"><circle cx="738" cy="155" r="16"/><circle cx="762" cy="108" r="11"/></g>`,
};

const HULL = 'M120,620 L900,620 C880,720 820,800 720,820 L300,820 C200,800 140,720 120,620 Z';
const MAINSAIL = 'M262,392 L718,392 C698,462 698,540 718,610 L262,610 C282,540 282,462 262,392 Z';

const pirateShip: PictureDef = {
  kind: 'picture', id: 'pirate-ship', name: 'Pirate ship', level: 3, theme: 'vehicles', bg: '#e1f5fe', sw: 11,
  body:
    `<circle class="c" fill="#fdd835" cx="880" cy="130" r="70"/>` + cloud(160, 120, 0.7) + cloud(650, 85, 0.5) +
    `<path fill="none" d="M120,260 q20,-18 40,0 q20,-18 40,0 M820,300 q16,-14 32,0 q16,-14 32,0"/>` +
    `<rect class="k" fill="#222228" x="480" y="140" width="24" height="520" rx="8"/>` +
    `<rect class="k" fill="#222228" x="702" y="222" width="20" height="440" rx="8"/>` +
    `<path class="c" fill="#424242" d="M504,142 L604,168 L504,194 Z"/>` +
    `<path class="c" fill="#fff3e0" d="M300,182 L680,182 C660,242 660,302 680,362 L300,362 C320,302 320,242 300,182 Z"/>` +
    bands('ms', `<path d="${MAINSAIL}"/>`, [
      { d: 'M350,380 L430,380 L430,620 L350,620 Z', fill: '#e53935' },
      { d: 'M550,380 L630,380 L630,620 L550,620 Z', fill: '#e53935' },
    ], '#fff3e0') +
    `<path class="c" fill="#ffcdd2" d="M732,242 L732,600 L912,600 Z"/>` +
    bands('hl', `<path d="${HULL}"/>`, [
      { d: 'M100,660 L920,660 L920,760 L100,760 Z', fill: '#a1887f' },
      { d: 'M100,760 L920,760 L920,840 L100,840 Z', fill: '#6d4c41' },
    ], '#8d6e63') +
    [300, 420, 540, 660].map((x) => `<circle class="c" fill="#ffe082" cx="${x}" cy="710" r="22"/>`).join('') +
    `<path class="c" fill="#29b6f6" d="M-20,800 C100,770 200,770 300,800 C400,830 500,830 600,800 C700,770 800,770 900,800 C950,815 980,815 1020,810 L1020,1020 L-20,1020 Z"/>` +
    `<path class="c" fill="#0288d1" d="M-20,880 C120,850 240,850 360,880 C480,910 600,910 720,880 C840,850 920,850 1020,875 L1020,1020 L-20,1020 Z"/>` +
    `<g class="s" fill="#ffffff" stroke="none"><circle cx="545" cy="160" r="9"/><path d="M533,176 L557,176 L552,184 L538,184 Z"/></g>`,
};

// ------------------------------------------------------------------ fairy tale

const PSKIRT = 'M380,520 C300,650 220,820 180,930 C380,982 620,982 820,930 C780,820 700,650 620,520 Z';

const princess: PictureDef = {
  kind: 'picture', id: 'princess', name: 'Princess', level: 2, theme: 'fairy', bg: '#fce4ec', sw: 13,
  body:
    `<path class="c" fill="#8d6e63" d="M330,330 C320,200 400,130 500,130 C600,130 680,200 670,330 L690,560 C640,580 600,560 590,520 L410,520 C400,560 360,580 310,560 Z"/>` +
    bands('psk', `<path d="${PSKIRT}"/>`, [
      { d: `${scallops(150, 850, 640, 7, 40)} L850,1000 L150,1000 Z`, fill: '#f8bbd0' },
      { d: `${scallops(120, 880, 790, 8, 45)} L880,1000 L120,1000 Z`, fill: '#f48fb1' },
    ], '#f48fb1') +
    capsule(392, 405, 330, 590, 54, '#ffe0b2') + capsule(608, 405, 670, 590, 54, '#ffe0b2') +
    `<circle class="c" fill="#ec407a" cx="388" cy="402" r="50"/><circle class="c" fill="#ec407a" cx="612" cy="402" r="50"/>` +
    `<rect class="c" fill="#ffe0b2" x="472" y="330" width="56" height="70"/>` +
    `<path class="c" fill="#ec407a" d="M420,380 C460,396 540,396 580,380 L606,545 L394,545 Z"/>` +
    `<circle class="c" fill="#ffe0b2" cx="500" cy="262" r="105"/>` +
    `<path class="c" fill="#8d6e63" d="M396,245 C398,172 448,140 500,140 C558,140 606,175 605,245 C570,218 530,208 500,218 C470,208 430,218 396,245 Z"/>` +
    `<path class="c" fill="#fdd835" d="M440,158 L446,98 L472,130 L500,84 L528,130 L554,98 L560,158 Z"/>` +
    face(500, 272, 0.62, { gap: 42 }) +
    stickerDots([[460, 420], [480, 430], [500, 434], [520, 430], [540, 420]], '#ffffff', 7, 7),
};

const TAIL = 'M420,590 C410,720 450,840 600,860 C680,870 732,850 762,828 L742,780 C702,800 652,806 612,796 C562,782 546,722 580,590 Z';

const mermaid: PictureDef = {
  kind: 'picture', id: 'mermaid', name: 'Mermaid', level: 2, theme: 'fairy', bg: '#b2ebf2', sw: 13, surprise: 9,
  body:
    `<circle class="c" fill="#e0f7fa" cx="790" cy="300" r="38"/><circle class="c" fill="#e0f7fa" cx="850" cy="200" r="28"/>` +
    `<ellipse class="c" fill="#ffb74d" cx="200" cy="300" rx="58" ry="36"/><path class="c" fill="#ffb74d" d="M255,300 L310,268 L310,332 Z"/><circle class="k" fill="#222228" cx="175" cy="292" r="7"/>` +
    `<path class="c" fill="#90a4ae" d="M100,1020 C90,890 180,800 320,790 C460,780 560,850 610,1020 Z"/>` +
    `<path class="c" fill="#5d4037" d="M380,330 C370,220 430,160 500,160 C580,160 630,220 620,330 C640,420 630,520 652,600 C602,602 580,560 570,520 L430,520 C420,560 400,602 348,600 C370,520 360,420 380,330 Z"/>` +
    `<path class="c" fill="#ce93d8" d="M752,800 C800,740 862,720 922,730 C892,770 862,800 822,820 C872,830 912,860 932,902 C872,902 802,882 757,842 Z"/>` +
    bands('mt', `<path d="${TAIL}"/>`, [
      { d: 'M380,680 L800,680 L800,760 L380,760 Z', fill: '#9575cd' },
      { d: 'M380,760 L800,760 L800,900 L380,900 Z', fill: '#7e57c2' },
    ], '#b39ddb') +
    capsule(440, 420, 400, 590, 44, '#ffe0b2') + capsule(560, 420, 600, 590, 44, '#ffe0b2') +
    `<path class="c" fill="#ffe0b2" d="M432,602 C420,520 432,442 462,402 L538,402 C568,442 580,520 568,602 Z"/>` +
    `<ellipse class="c" fill="#ffd54f" cx="466" cy="472" rx="34" ry="27"/><ellipse class="c" fill="#ffd54f" cx="534" cy="472" rx="34" ry="27"/>` +
    `<circle class="c" fill="#ffe0b2" cx="500" cy="300" r="95"/>` +
    `<path class="c" fill="#5d4037" d="M405,290 C405,215 450,180 500,180 C555,180 598,215 596,290 C565,262 532,252 500,260 C468,252 432,262 405,290 Z"/>` +
    `<polygon class="c" fill="#ff8a65" points="${starPts(590, 215, 36, 16)}"/>` +
    face(500, 312, 0.58, { gap: 40 }),
};

const fairy: PictureDef = {
  kind: 'picture', id: 'fairy', name: 'Fairy', level: 2, theme: 'fairy', bg: '#e8f5e9', sw: 13,
  body:
    twinkles([[760, 140, 26], [860, 260, 18], [690, 90, 14], [150, 700, 22], [860, 720, 20]], '#ffd54f') +
    `<ellipse class="c" fill="#b3e5fc" cx="370" cy="380" rx="120" ry="172" transform="rotate(-35 370 380)"/>` +
    `<ellipse class="c" fill="#b3e5fc" cx="630" cy="380" rx="120" ry="172" transform="rotate(35 630 380)"/>` +
    `<ellipse class="c" fill="#e1bee7" cx="398" cy="602" rx="82" ry="112" transform="rotate(30 398 602)"/>` +
    `<ellipse class="c" fill="#e1bee7" cx="602" cy="602" rx="82" ry="112" transform="rotate(-30 602 602)"/>` +
    capsule(480, 650, 465, 860, 38, '#ffe0b2') + capsule(520, 650, 535, 860, 38, '#ffe0b2') +
    `<ellipse class="c" fill="#ab47bc" cx="458" cy="868" rx="34" ry="18"/><ellipse class="c" fill="#ab47bc" cx="542" cy="868" rx="34" ry="18"/>` +
    `<path class="c" fill="#ce93d8" d="M500,520 C430,560 380,640 400,702 C440,692 470,662 500,622 Z"/>` +
    `<path class="c" fill="#ce93d8" d="M500,520 C570,560 620,640 600,702 C560,692 530,662 500,622 Z"/>` +
    `<path class="c" fill="#ba68c8" d="M500,520 C460,580 460,660 500,722 C540,660 540,580 500,520 Z"/>` +
    capsule(455, 440, 410, 575, 34, '#ffe0b2') +
    `<path fill="none" d="M640,330 L700,232"/>` +
    capsule(548, 440, 645, 330, 34, '#ffe0b2') +
    `<path class="c" fill="#ab47bc" d="M458,420 L542,420 L558,532 L442,532 Z"/>` +
    `<circle class="c" fill="#ffe0b2" cx="500" cy="352" r="72"/>` +
    `<circle class="c" fill="#ff8a65" cx="500" cy="262" r="42"/>` +
    `<path class="c" fill="#ff8a65" d="M430,345 C428,292 460,272 500,272 C540,272 572,292 570,345 C540,322 460,322 430,345 Z"/>` +
    `<polygon class="c" fill="#fdd835" points="${starPts(706, 214, 48, 21)}"/>` +
    face(500, 360, 0.45, { gap: 30 }),
};

const treasure: PictureDef = {
  kind: 'picture', id: 'treasure', name: 'Treasure chest', level: 2, theme: 'fairy', bg: '#fff8e1', sw: 13,
  body:
    `<path class="c" fill="#ffe082" d="M-20,820 C200,790 400,800 500,810 C650,825 820,795 1020,805 L1020,1020 L-20,1020 Z"/>` +
    `<path class="c" fill="#6d4c41" d="M250,480 L300,232 C400,192 600,192 700,232 L750,480 Z"/>` +
    `<path class="c" fill="#fdd835" d="M220,525 C260,432 330,402 400,422 C450,382 550,382 600,422 C670,402 740,432 780,525 Z"/>` +
    [[330, 470], [470, 432], [640, 458]].map(([x, y]) => `<circle class="c" fill="#ffca28" cx="${x}" cy="${y}" r="32"/>`).join('') +
    `<path class="c" fill="#e53935" d="M560,450 L590,420 L620,450 L590,490 Z"/><path class="c" fill="#1e88e5" d="M395,470 L420,445 L445,470 L420,502 Z"/>` +
    `<rect class="c" fill="#a1662f" x="220" y="520" width="560" height="330" rx="16"/>` +
    `<rect class="c" fill="#fdd835" x="300" y="520" width="52" height="330"/><rect class="c" fill="#fdd835" x="648" y="520" width="52" height="330"/>` +
    `<rect class="c" fill="#fdd835" x="458" y="560" width="84" height="104" rx="10"/>` +
    `<path class="k" fill="#222228" d="M500,590 C488,590 482,600 486,612 L478,640 L522,640 L514,612 C518,600 512,590 500,590 Z"/>` +
    `<ellipse class="c" fill="#ffca28" cx="160" cy="885" rx="46" ry="20"/><ellipse class="c" fill="#ffca28" cx="850" cy="905" rx="50" ry="21"/>` +
    twinkles([[300, 360, 20], [700, 380, 18], [520, 330, 16]], '#ffffff'),
};

const carriage: PictureDef = {
  kind: 'picture', id: 'carriage', name: 'Pumpkin carriage', level: 3, theme: 'fairy', bg: '#ede7f6', sw: 11, surprise: 15,
  body:
    twinkles([[120, 140, 22], [320, 90, 16], [600, 120, 18], [900, 380, 16], [70, 420, 14]]) +
    `<path class="c" fill="#fff59d" d="M833.5,56.5 A90,90 0 1 0 893.4,193.4 A75,75 0 1 1 833.5,56.5 Z"/>` +
    [[180, 250, 34], [700, 200, 28]].map(([x, y, r]) => `<polygon class="c" fill="#fdd835" points="${starPts(x, y, r, r * 0.45)}"/>`).join('') +
    `<rect class="c" fill="#bcaaa4" x="-20" y="880" width="1040" height="140"/>` +
    `<path class="c" fill="#43a047" d="M480,272 C470,222 490,182 530,172 L547,202 C522,212 517,242 522,272 Z"/>` +
    `<path class="c" fill="#66bb6a" d="M532,252 C582,202 652,212 682,252 C632,282 572,282 532,252 Z"/>` +
    `<path fill="none" d="M470,250 C430,230 420,190 450,180 C475,172 482,200 466,206"/>` +
    [[278, 520, 110, 232, '#fb8c00'], [722, 520, 110, 232, '#fb8c00'], [382, 520, 122, 252, '#ff9800'], [618, 520, 122, 252, '#ff9800'], [500, 520, 132, 262, '#ffa726']]
      .map(([x, y, rx, ry, c]) => `<ellipse class="c" fill="${c}" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('') +
    `<path class="c" fill="#fff59d" d="M440,575 L440,480 A60,60 0 0 1 560,480 L560,575 Z"/>` +
    `<path fill="none" d="M500,420 L500,575"/>` +
    `<path class="c" fill="#fdd835" d="M262,700 C380,742 620,742 738,700 L722,748 C620,786 380,786 278,748 Z"/>` +
    [290, 710].map((x) => {
      const spokes = Array.from({ length: 6 }, (_, i) => { const a = rad(i * 60 + 15); return `M${x},790 L${P(x + 110 * Math.cos(a))},${P(790 + 110 * Math.sin(a))}`; }).join(' ');
      return `<circle class="c" fill="#ffe082" cx="${x}" cy="790" r="112"/><path fill="none" d="${spokes}"/><circle class="c" fill="#fdd835" cx="${x}" cy="790" r="28"/>`;
    }).join(''),
};

// ------------------------------------------------------------------ space & dinosaurs

const astronaut: PictureDef = {
  kind: 'picture', id: 'astronaut', name: 'Astronaut', level: 3, theme: 'space', bg: '#1a237e', sw: 13,
  body:
    twinkles([[120, 150, 26], [260, 80, 16], [880, 420, 18], [120, 520, 16], [700, 90, 14]]) +
    `<circle class="c" fill="#42a5f5" cx="850" cy="170" r="72"/>` +
    `<path class="c" fill="#66bb6a" d="M810,130 C840,110 880,130 870,160 C860,190 820,180 815,205 C795,190 790,150 810,130 Z"/>` +
    `<path class="c" fill="#bdbdbd" d="M-20,850 C250,800 750,800 1020,850 L1020,1020 L-20,1020 Z"/>` +
    `<ellipse class="c" fill="#9e9e9e" cx="190" cy="905" rx="64" ry="22"/><ellipse class="c" fill="#9e9e9e" cx="790" cy="925" rx="72" ry="25"/>` +
    `<rect class="c" fill="#90a4ae" x="328" y="470" width="344" height="280" rx="40"/>` +
    `<rect class="c" fill="#eceff1" x="410" y="720" width="80" height="150" rx="30"/><rect class="c" fill="#eceff1" x="510" y="720" width="80" height="150" rx="30"/>` +
    `<rect class="c" fill="#757575" x="398" y="840" width="104" height="52" rx="20"/><rect class="c" fill="#757575" x="498" y="840" width="104" height="52" rx="20"/>` +
    capsule(390, 482, 275, 386, 72, '#eceff1') + capsule(610, 482, 690, 612, 72, '#eceff1') +
    `<circle class="c" fill="#757575" cx="270" cy="380" r="44"/><circle class="c" fill="#757575" cx="694" cy="618" r="44"/>` +
    `<rect class="c" fill="#eceff1" x="370" y="450" width="260" height="320" rx="70"/>` +
    `<rect class="c" fill="#b0bec5" x="440" y="540" width="120" height="92" rx="14"/>` +
    `<circle class="c" fill="#e53935" cx="472" cy="586" r="21"/><circle class="c" fill="#43a047" cx="528" cy="586" r="21"/>` +
    `<path fill="none" d="M560,152 L592,92"/><circle class="c" fill="#e53935" cx="596" cy="84" r="22"/>` +
    `<circle class="c" fill="#eceff1" cx="500" cy="300" r="165"/>` +
    `<ellipse class="c" fill="#4fc3f7" cx="500" cy="302" rx="118" ry="96"/>` +
    shine(440, 262, 22, 42, 30) + `<circle class="s" fill="#fff" opacity=".7" stroke="none" cx="568" cy="350" r="12"/>`,
};

const triceratops: PictureDef = {
  kind: 'picture', id: 'triceratops', name: 'Triceratops', level: 2, theme: 'space', bg: '#fff8e1', sw: 13,
  body:
    `<path class="c" fill="#8d6e63" d="M640,562 L760,300 L840,300 L960,562 Z"/>` +
    `<path class="c" fill="#ff7043" d="M760,300 C770,258 830,258 840,300 C820,332 780,332 760,300 Z"/>` +
    `<g class="s" fill="#ffffff" opacity=".85" stroke="none"><circle cx="790" cy="230" r="26"/><circle cx="822" cy="190" r="32"/><circle cx="790" cy="150" r="22"/></g>` +
    ground('#c5e1a5', 860) +
    `<path class="c" fill="#4db6ac" d="M660,640 C760,650 860,700 930,762 C850,762 760,742 660,722 Z"/>` +
    [[560, '#26a69a'], [640, '#26a69a'], [330, '#4db6ac'], [420, '#4db6ac']].map(([x, c]) => `<rect class="c" fill="${c}" x="${x}" y="700" width="72" height="170" rx="26"/>`).join('') +
    `<ellipse class="c" fill="#4db6ac" cx="520" cy="620" rx="222" ry="150"/>` +
    [[520, 560, 46, 30], [620, 610, 38, 26], [440, 640, 34, 24]].map(([x, y, rx, ry]) => `<ellipse class="c" fill="#00897b" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('') +
    `<ellipse class="c" fill="#ffb74d" cx="322" cy="452" rx="150" ry="162"/>` +
    `<path class="c" fill="#4db6ac" d="M392,502 C340,470 252,480 202,522 C160,552 150,612 182,642 C222,672 302,662 392,640 Z"/>` +
    `<path class="c" fill="#bcaaa4" d="M182,560 L118,600 L182,632 Z"/>` +
    `<path class="c" fill="#fff3e0" d="M262,492 L200,380 L288,472 Z"/><path class="c" fill="#fff3e0" d="M324,482 L304,362 L350,466 Z"/>` +
    `<path class="c" fill="#fff3e0" d="M198,550 L165,498 L218,540 Z"/>` +
    `<circle class="k" fill="#222228" cx="268" cy="542" r="14"/><circle fill="#fff" stroke="none" cx="272" cy="537" r="5"/>` +
    `<path fill="none" d="M192,616 Q222,632 254,620"/>` +
    blush([[300, 590]], 24, 14),
};

const longNeck: PictureDef = {
  kind: 'picture', id: 'long-neck', name: 'Long-neck dino', level: 2, theme: 'space', bg: '#e1f5fe', sw: 13,
  body:
    `<circle class="c" fill="#fdd835" cx="150" cy="140" r="72"/>` +
    ground('#aed581', 880) +
    `<path class="c" fill="#8d6e63" d="M800,882 C790,700 800,520 830,380 L870,385 C845,520 840,700 852,882 Z"/>` +
    [[-30, 0], [20, 1], [-150, 2], [-200, 3]].map(([deg, i]) =>
      `<ellipse class="c" fill="${i % 2 ? '#43a047' : '#66bb6a'}" cx="950" cy="380" rx="100" ry="30" transform="rotate(${deg} 850 380)"/>`).join('') +
    `<path class="c" fill="#9575cd" d="M290,640 C200,660 120,720 60,800 C150,780 230,760 300,740 Z"/>` +
    [[330, 740, 150], [420, 750, 140], [540, 750, 140], [620, 740, 150]].map(([x, y, h]) => `<rect class="c" fill="#7e57c2" x="${x}" y="${y}" width="70" height="${h}" rx="24"/>`).join('') +
    `<path class="c" fill="#9575cd" d="M560,602 C580,450 560,300 590,200 L660,210 C640,320 660,460 680,612 Z"/>` +
    `<ellipse class="c" fill="#9575cd" cx="480" cy="680" rx="232" ry="140"/>` +
    [[380, 640], [470, 610], [560, 650], [450, 700]].map(([x, y]) => `<circle class="c" fill="#b39ddb" cx="${x}" cy="${y}" r="30"/>`).join('') +
    `<ellipse class="c" fill="#9575cd" cx="640" cy="180" rx="86" ry="56"/>` +
    `<ellipse class="k" fill="#222228" cx="660" cy="166" rx="11" ry="14"/><circle fill="#fff" stroke="none" cx="663" cy="161" r="4"/>` +
    `<path fill="none" d="M680,200 Q700,210 718,198"/>` +
    blush([[640, 200]], 18, 11),
};

const PWL = 'M480,430 C380,330 250,300 120,330 C170,380 200,430 210,480 C280,460 330,470 380,500 C420,470 450,450 480,430 Z';
const PWR = 'M520,430 C620,330 750,300 880,330 C830,380 800,430 790,480 C720,460 670,470 620,500 C580,470 550,450 520,430 Z';

const pterodactyl: PictureDef = {
  kind: 'picture', id: 'pterodactyl', name: 'Flying dino', level: 2, theme: 'space', bg: '#ffe0b2', sw: 13,
  body:
    `<circle class="c" fill="#ffb74d" cx="500" cy="900" r="200"/>` +
    `<path class="c" fill="#8d6e63" d="M-20,1020 L-20,760 L220,560 L420,820 L600,620 L820,840 L1020,700 L1020,1020 Z"/>` +
    `<path class="c" fill="#ffffff" d="M220,560 L260,612 L240,626 L220,606 L196,626 L160,610 Z"/>` +
    `<path class="c" fill="#ffffff" d="M600,620 L644,664 L622,676 L600,656 L578,676 L560,664 Z"/>` +
    cloud(170, 220, 0.7) + cloud(830, 160, 0.6) +
    bands('pl', `<path d="${PWL}"/>`, [{ d: 'M100,400 C230,380 340,410 470,440 L470,520 L100,520 Z', fill: '#80cbc4' }], '#4db6ac') +
    bands('pr', `<path d="${PWR}"/>`, [{ d: 'M900,400 C770,380 660,410 530,440 L530,520 L900,520 Z', fill: '#80cbc4' }], '#4db6ac') +
    `<path fill="none" d="M470,572 L455,610 L440,616 M455,610 L462,624 M530,572 L545,610 L560,616 M545,610 L538,624"/>` +
    `<ellipse class="c" fill="#26a69a" cx="500" cy="472" rx="70" ry="110"/>` +
    `<ellipse class="c" fill="#b2dfdb" cx="500" cy="502" rx="40" ry="70"/>` +
    `<path class="c" fill="#ff7043" d="M540,345 L470,280 L582,340 Z"/>` +
    `<path class="c" fill="#26a69a" d="M500,362 C560,330 620,340 660,360 L782,382 L660,402 C620,422 560,412 520,402 Z"/>` +
    `<circle class="k" fill="#222228" cx="590" cy="366" r="11"/><circle fill="#fff" stroke="none" cx="594" cy="362" r="4"/>`,
};

const JUP = 'M600,470 A100,100 0 1 0 800,470 A100,100 0 1 0 600,470 Z';
const SAT_RING = 'M670,760 A120,34 0 1 0 910,760 A120,34 0 1 0 670,760 Z M712,760 A78,20 0 1 0 868,760 A78,20 0 1 0 712,760 Z';

const solarSystem: PictureDef = {
  kind: 'picture', id: 'solar-system', name: 'Solar system', level: 3, theme: 'space', bg: '#0d1446', sw: 11,
  body:
    twinkles([[300, 140, 16], [620, 120, 14], [420, 860, 16], [900, 900, 14], [640, 900, 12], [960, 380, 12], [260, 760, 12]]) +
    `<circle class="c" fill="#ffb300" cx="-60" cy="500" r="262"/>` +
    `<circle class="c" fill="#bcaaa4" cx="282" cy="330" r="32"/>` +
    `<circle class="c" fill="#ffcc80" cx="372" cy="560" r="46"/>` +
    `<circle class="c" fill="#42a5f5" cx="500" cy="378" r="62"/>` +
    `<path class="c" fill="#66bb6a" d="M460,340 C490,320 520,335 512,362 C505,385 470,378 466,400 C448,385 442,355 460,340 Z"/>` +
    `<path class="c" fill="#66bb6a" d="M520,395 C545,385 560,405 548,425 C535,440 515,430 520,395 Z"/>` +
    `<circle class="s" fill="#e0e0e0" stroke="#222228" stroke-width="6" cx="578" cy="318" r="16"/>` +
    `<circle class="c" fill="#e57373" cx="560" cy="640" r="42"/>` +
    bands('jup', `<path d="${JUP}"/>`, [
      { d: 'M590,410 L810,410 L810,445 L590,445 Z', fill: '#d7a86e' },
      { d: 'M590,470 L810,470 L810,500 L590,500 Z', fill: '#d7a86e' },
    ], '#ffe0b2') +
    `<ellipse class="c" fill="#e57373" cx="700" cy="535" rx="28" ry="14"/>` +
    `<path class="c" fill="#ffe082" fill-rule="evenodd" d="${SAT_RING}"/>` +
    `<circle class="c" fill="#ffcc80" cx="790" cy="760" r="66"/>` +
    `<clipPath id="sfr"><rect x="600" y="760" width="400" height="200"/></clipPath>` +
    `<path class="c" fill="#ffe082" fill-rule="evenodd" clip-path="url(#sfr)" d="${SAT_RING}"/>` +
    `<circle class="c" fill="#80deea" cx="880" cy="250" r="46"/>` +
    `<circle class="c" fill="#5c6bc0" cx="930" cy="565" r="42"/>`,
};

export const PICTURES4: PictureDef[] = [
  lion, giraffe, parrot, dolphin, peacock,
  fireEngine, digger, tractor, submarine, pirateShip,
  princess, mermaid, fairy, treasure, carriage,
  astronaut, triceratops, longNeck, pterodactyl, solarSystem,
];
