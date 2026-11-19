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
  body: string;
}

export interface FlagDef {
  kind: 'flag';
  id: string;
  name: string;
  level: Level;
  svg: string;
}

export type PageDef = PictureDef | FlagDef;
