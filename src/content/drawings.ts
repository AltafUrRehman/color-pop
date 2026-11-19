import type { ProfileId } from '../profiles';
import { entries } from '../storage/db';
import type { DrawingDef } from './types';

/** what is stored in IndexedDB for one of a child's own drawings */
export interface DrawingRecord {
  id: string;
  created: number;
  w: number;
  h: number;
  ink: Blob;
}

export const drawingKey = (pid: ProfileId, rawId: string) => `drawing:${pid}:${rawId}`;

export const toDef = (r: DrawingRecord): DrawingDef => ({
  kind: 'drawing', id: `my-${r.id}`, name: 'My drawing', level: 1, ink: r.ink, w: r.w, h: r.h, created: r.created,
});

export async function loadDrawings(pid: ProfileId): Promise<DrawingDef[]> {
  const rows = await entries<DrawingRecord>(`drawing:${pid}:`);
  return rows.map(([, r]) => r).filter((r) => r && r.ink instanceof Blob).sort((a, b) => b.created - a.created).map(toDef);
}
