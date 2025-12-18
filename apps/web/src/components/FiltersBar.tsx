import type { Profile } from '../api/types';

type Props = {
  profile: Profile;
  onChange: (partial: Partial<Profile>) => void;
};

export function FiltersBar({ profile, onChange }: Props) {
  const timeRange = profile.timeRange ?? {};

  return (
    <div className="panel filters">
      <div className="panel-title">Filtre</div>
      <div className="filter-row">
        <label>
          Fra
          <input
            type="date"
            value={timeRange.from ?? ''}
            onChange={(e) =>
              onChange({ timeRange: { ...timeRange, from: e.target.value } })
            }
          />
        </label>
        <label>
          Til
          <input
            type="date"
            value={timeRange.to ?? ''}
            onChange={(e) =>
              onChange({ timeRange: { ...timeRange, to: e.target.value } })
            }
          />
        </label>
        <label>
          Mainstream‑straff
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={profile.mainstreamPenalty ?? 0}
            onChange={(e) =>
              onChange({ mainstreamPenalty: Number(e.target.value) })
            }
          />
          <span className="value">
            {(profile.mainstreamPenalty ?? 0).toFixed(2)}
          </span>
        </label>
      </div>
    </div>
  );
}

