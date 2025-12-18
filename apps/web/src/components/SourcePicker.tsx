type Props = {
  availableSources: string[];
  selected: string[];
  onChange: (sources: string[]) => void;
};

export function SourcePicker({ availableSources, selected, onChange }: Props) {
  const toggle = (source: string) => {
    const isActive = selected.includes(source);
    if (isActive) {
      onChange(selected.filter((s) => s !== source));
    } else {
      onChange([...selected, source]);
    }
  };

  return (
    <div className="panel">
      <div className="panel-title">Kilder</div>
      <div className="source-grid">
        {availableSources.map((source) => (
          <label key={source} className="pill">
            <input
              type="checkbox"
              checked={selected.includes(source)}
              onChange={() => toggle(source)}
            />
            <span>{source}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

