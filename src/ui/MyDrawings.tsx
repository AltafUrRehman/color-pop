import { useEffect, useMemo, useRef, useState } from 'react';
import { drawingKey, type DrawingRecord } from '../content/drawings';
import type { DrawingDef } from '../content/types';
import { canvasBlob, extractLines, lineArtCanvas, type LineArt } from '../engine/drawing';
import { forget } from '../engine/prepare';
import type { Profile } from '../profiles';
import { FRAMED } from '../settings';
import { del, set } from '../storage/db';
import type { SavedPage } from './Coloring';
import { HoldButton } from './HoldButton';
import { BackIcon, CameraIcon, CheckIcon, PictureIcon, PlusIcon, StarIcon, TrashIcon, UndoIcon } from './icons';

interface Props {
  profile: Profile;
  drawings: DrawingDef[];
  saved: Record<string, SavedPage>;
  thumbs: Record<string, string>;
  onOpen: (id: string) => void;
  onChanged: (openId?: string) => void;
}

export function MyDrawings({ profile, drawings, saved, thumbs, onOpen, onChanged }: Props) {
  const [adding, setAdding] = useState(false);
  const inkUrls = useMemo(() => Object.fromEntries(drawings.map((d) => [d.id, URL.createObjectURL(d.ink)])), [drawings]);
  useEffect(() => () => Object.values(inkUrls).forEach((u) => URL.revokeObjectURL(u)), [inkUrls]);

  const remove = async (d: DrawingDef) => {
    const raw = d.id.replace(/^my-/, '');
    await Promise.all([del(drawingKey(profile.id, raw)), del(`progress:${profile.id}:${d.id}`), del(`thumb:${profile.id}:${d.id}`), del(`art:${profile.id}:${d.id}`)]);
    forget(d.id);
    onChanged();
  };

  return (
    <main className="grid mine">
      <button className="card add-card" onClick={() => setAdding(true)} aria-label="Add my drawing" data-testid="add-drawing">
        <PlusIcon />
        <CameraIcon size={44} />
      </button>
      {drawings.map((d) => (
        <div className="card-wrap" key={d.id}>
          <button className={`card ${saved[d.id]?.done ? 'done' : ''}`} onClick={() => onOpen(d.id)} data-testid={`page-${d.id}`}>
            <img src={thumbs[d.id] || inkUrls[d.id]} alt="" draggable={false} />
            {saved[d.id]?.done && (
              <span className="badge">
                <StarIcon size={40} />
              </span>
            )}
          </button>
          <HoldButton className="card-trash" ms={1500} label="Hold to delete" onHold={() => void remove(d)}>
            <TrashIcon />
          </HoldButton>
        </div>
      ))}
      {adding && (
        <AddDrawing
          profile={profile}
          onClose={() => setAdding(false)}
          onSaved={(id) => {
            setAdding(false);
            onChanged(id);
          }}
        />
      )}
    </main>
  );
}

function AddDrawing({ profile, onClose, onSaved }: { profile: Profile; onClose: () => void; onSaved: (id: string) => void }) {
  const [step, setStep] = useState<'choose' | 'camera' | 'busy' | 'preview'>('choose');
  const [art, setArt] = useState<LineArt | null>(null);
  const [preview, setPreview] = useState('');
  const [err, setErr] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stopCam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  useEffect(() => stopCam, []);
  useEffect(() => {
    if (step === 'camera' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => undefined);
    }
  }, [step]);

  const openCam = async () => {
    setErr('');
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      setStep('camera');
    } catch {
      setErr('The camera is not available. Try "Choose a picture" instead.');
    }
  };

  const process = (src: CanvasImageSource, w: number, h: number) => {
    setStep('busy');
    setTimeout(() => {
      const a = extractLines(src, w, h);
      setArt(a);
      setPreview(lineArtCanvas(a, '#ffffff').toDataURL('image/png'));
      setStep('preview');
    }, 30);
  };

  const snap = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')!.drawImage(v, 0, 0);
    stopCam();
    process(c, c.width, c.height);
  };

  const pickFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const bmp = await createImageBitmap(f);
      process(bmp, bmp.width, bmp.height);
    } catch {
      setErr('That picture could not be opened.');
    }
  };

  const save = async () => {
    if (!art) return;
    setStep('busy');
    const id = Date.now().toString(36);
    const rec: DrawingRecord = { id, created: Date.now(), w: art.w, h: art.h, ink: await canvasBlob(lineArtCanvas(art)) };
    await set(drawingKey(profile.id, id), rec);
    onSaved(`my-${id}`);
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet-card add-drawing" onClick={(e) => e.stopPropagation()} data-testid="add-modal">
        {step === 'choose' && (
          <>
            <p className="hint">Draw with a dark pen or crayon, then take a photo of the paper.</p>
            <div className="add-choices">
              {!FRAMED && !!navigator.mediaDevices?.getUserMedia && (
                <button className="big-choice" onClick={openCam} aria-label="Take a photo" data-testid="use-camera">
                  <CameraIcon size={90} />
                </button>
              )}
              <button className="big-choice" onClick={() => fileRef.current?.click()} aria-label="Choose a picture" data-testid="use-file">
                <PictureIcon size={90} />
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden data-testid="file-input" onChange={(e) => void pickFile(e.target.files?.[0])} />
          </>
        )}
        {step === 'camera' && (
          <>
            <video ref={videoRef} className="cam" playsInline muted />
            <div className="add-actions">
              <button className="round" onClick={() => { stopCam(); setStep('choose'); }} aria-label="Back">
                <BackIcon />
              </button>
              <button className="round big shutter" onClick={snap} aria-label="Take photo" data-testid="shutter" />
            </div>
          </>
        )}
        {step === 'busy' && (
          <div className="loading inline">
            <div className="dots"><div className="dot" /><div className="dot" /><div className="dot" /></div>
          </div>
        )}
        {step === 'preview' && art && (
          <>
            <img className="drawing-preview" src={preview} alt="" data-testid="drawing-preview" />
            {art.inkRatio < 0.003 && <p className="hint">I can hardly see any lines. Try a darker pen or more light.</p>}
            <div className="add-actions">
              <button className="round big" onClick={() => setStep('choose')} aria-label="Try again">
                <UndoIcon />
              </button>
              <button className="round big go" onClick={() => void save()} aria-label="Use this drawing" data-testid="use-drawing">
                <CheckIcon />
              </button>
            </div>
          </>
        )}
        {err && <p className="hint err">{err}</p>}
      </div>
    </div>
  );
}
