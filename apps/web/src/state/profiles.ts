import type { Profile } from '../api/types';

export type ProfilePreset = {
  id: string;
  name: string;
  description: string;
  profile: Profile;
};

export const profilePresets: ProfilePreset[] = [
  {
    id: 'default',
    name: 'Balansert',
    description: 'Engelsk først, lett straff for mainstream-kilder.',
    profile: {
      preferredLangs: ['en'],
      mainstreamPenalty: 0.2,
      domain: { boost: ['.edu', '.org'] },
    },
  },
  {
    id: 'nordic',
    name: 'Nordisk',
    description: 'Foretrekker norsk/svensk/dansk, blokkerer kommersielle domener.',
    profile: {
      preferredLangs: ['no', 'sv', 'da'],
      excludeLangs: ['ru', 'zh'],
      mainstreamPenalty: 0.4,
      domain: { boost: ['.no', '.se', '.dk'], block: ['.com'] },
    },
  },
  {
    id: 'scholarly',
    name: 'Akademisk',
    description: 'Favoriserer DOI og institusjonelle domener.',
    profile: {
      preferredLangs: ['en'],
      mainstreamPenalty: 0.5,
      domain: { boost: ['.edu', '.ac.uk', '.org'], block: ['.com'] },
    },
  },
];

export const defaultProfile = profilePresets[0].profile;

export function mergeProfile(base: Profile, partial: Partial<Profile>): Profile {
  return {
    ...base,
    ...partial,
    domain: {
      ...base.domain,
      ...partial.domain,
      boost: partial.domain?.boost ?? base.domain?.boost,
      block: partial.domain?.block ?? base.domain?.block,
    },
  };
}

