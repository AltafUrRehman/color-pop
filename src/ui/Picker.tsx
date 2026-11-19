import { useState } from 'react';
import { PROFILES, type ProfileId } from '../profiles';
import { useSettings } from '../settings';
import { HoldButton } from './HoldButton';
import { Avatar, GearIcon } from './icons';
import { ParentGate } from './Parent';

export function Picker({ onPick, onParent }: { onPick: (id: ProfileId) => void; onParent: () => void }) {
  const { settings } = useSettings();
  const [gate, setGate] = useState(false);
  return (
    <div className="picker">
      <HoldButton className="gear" label="Parent settings (hold)" ms={1500} onHold={() => setGate(true)}>
        <GearIcon />
      </HoldButton>
      <h1 className="logo" aria-label="Color Pop">
        {'Color Pop'.split('').map((ch, i) => (
          <span key={i} style={{ color: ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#ec407a', '#e53935', '#fb8c00'][i] }}>
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </h1>
      <div className="picker-row">
        {(Object.keys(PROFILES) as ProfileId[]).map((id) => {
          const p = PROFILES[id];
          const name = settings.names[id] || p.label;
          return (
            <button key={id} className="kid" style={{ background: p.tint }} onClick={() => onPick(id)} data-testid={`kid-${id}`}>
              <Avatar kind={p.avatar} size={id === 'little' ? 190 : 170} />
              <span className={`kid-name ${name.length > 8 ? 'long' : ''}`}>{name}</span>
            </button>
          );
        })}
      </div>
      {gate && (
        <ParentGate
          onCancel={() => setGate(false)}
          onPass={() => {
            setGate(false);
            onParent();
          }}
        />
      )}
    </div>
  );
}
