import type { WhyEntry } from '../api/types';

type Props = {
  why: WhyEntry[];
};

export function WhyDrawer({ why }: Props) {
  if (!why?.length) return null;

  return (
    <details className="why">
      <summary>Hvorfor dette treffet?</summary>
      <ul>
        {why.map((item) => (
          <li key={`${item.key}-${item.weight}`}>
            <strong>{item.key}</strong> · {item.weight.toFixed(2)}{' '}
            {item.note && <span>— {item.note}</span>}
          </li>
        ))}
      </ul>
    </details>
  );
}

