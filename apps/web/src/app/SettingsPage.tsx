import type { Profile } from '../api/types';
import { ProfileEditor } from '../components/ProfileEditor';

type Props = {
  profile: Profile;
  onChange: (partial: Partial<Profile>) => void;
  onReset: () => void;
};

export function SettingsPage({ profile, onChange, onReset }: Props) {
  return (
    <section>
      <h2>Profiler &amp; preferanser</h2>
      <ProfileEditor profile={profile} onChange={onChange} onReset={onReset} />
    </section>
  );
}

