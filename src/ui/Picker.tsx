import { PROFILES, type ProfileId } from '../profiles';
import { Avatar } from './icons';

export function Picker({ onPick }: { onPick: (id: ProfileId) => void }) {
  return (
    <div className="picker">
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
          return (
            <button key={id} className="kid" style={{ background: p.tint }} onClick={() => onPick(id)} data-testid={`kid-${id}`}>
              <Avatar kind={p.avatar} size={id === 'little' ? 190 : 170} />
              <span className="kid-age">{p.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
