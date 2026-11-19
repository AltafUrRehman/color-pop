export type Level = 1 | 2 | 3;

/** A hand-drawn picture: inner SVG on a 1000x1000 viewBox.
 *  - class "c": colourable shape; its fill is the "magic" target colour
 *  - class "k": black detail (eyes, mouths) — part of the lines
 *  - anything else keeps its own fill (e.g. white eye highlights)
 */
export interface PictureDef {
  kind: 'picture';
  id: string;
  name: string;
  level: Level;
  /** background (sky/paper) colour used by magic mode */
  bg: string;
  /** stroke width in viewBox units */
  sw?: number;
  /** surprise page: stars needed to unlock */
  surprise?: number;
  body: string;
}

export interface FlagDef {
  kind: 'flag';
  id: string;
  name: string;
  level: Level;
  svg: string;
}

/** a child's own paper drawing, photographed and turned into line art */
export interface DrawingDef {
  kind: 'drawing';
  id: string;
  name: string;
  level: Level;
  /** black-on-transparent PNG */
  ink: Blob;
  w: number;
  h: number;
  created: number;
}

export type PageDef = PictureDef | FlagDef | DrawingDef;
