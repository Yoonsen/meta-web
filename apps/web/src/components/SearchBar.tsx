import type { FormEvent } from 'react';

type Props = {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function SearchBar({ value, onChange, onSubmit, placeholder }: Props) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Søk etter web + scholarly...'}
      />
      <button type="submit">Søk</button>
    </form>
  );
}

