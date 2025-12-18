import type { Profile } from '../api/types';
import { profilePresets } from '../state/profiles';

type Props = {
  profile: Profile;
  onChange: (partial: Partial<Profile>) => void;
  onReset: () => void;
};

export function ProfileEditor({ profile, onChange, onReset }: Props) {
  return (
    <div className="panel">
      <div className="panel-title">Profiler</div>
      <div className="stack">
        <label>
          Foretrukne språk (komma-separert)
          <input
            type="text"
            value={profile.preferredLangs.join(', ')}
            onChange={(e) =>
              onChange({
                preferredLangs: e.target.value
                  .split(',')
                  .map((v) => v.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
        <label>
          Ekskluder språk
          <input
            type="text"
            value={profile.excludeLangs?.join(', ') ?? ''}
            onChange={(e) =>
              onChange({
                excludeLangs: e.target.value
                  .split(',')
                  .map((v) => v.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
        <label>
          Domene‑boost (comma)
          <input
            type="text"
            value={profile.domain?.boost?.join(', ') ?? ''}
            onChange={(e) =>
              onChange({
                domain: {
                  ...profile.domain,
                  boost: e.target.value
                    .split(',')
                    .map((v) => v.trim())
                    .filter(Boolean),
                },
              })
            }
          />
        </label>
        <label>
          Domene‑block (comma)
          <input
            type="text"
            value={profile.domain?.block?.join(', ') ?? ''}
            onChange={(e) =>
              onChange({
                domain: {
                  ...profile.domain,
                  block: e.target.value
                    .split(',')
                    .map((v) => v.trim())
                    .filter(Boolean),
                },
              })
            }
          />
        </label>
        <div className="preset-row">
          <select
            onChange={(e) => {
              const preset = profilePresets.find(
                (p) => p.id === e.target.value,
              );
              if (preset) onChange(preset.profile);
            }}
            defaultValue=""
          >
            <option value="" disabled>
              Velg preset
            </option>
            {profilePresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
          <button type="button" onClick={onReset}>
            Nullstill
          </button>
        </div>
      </div>
    </div>
  );
}

