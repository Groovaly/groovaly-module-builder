import { useMemo, useState } from 'react';
import { RAL_EXCLUDED } from './config';
import { RAL_CLASSIC, RAL_FAMILIES, type RalColour, type RalFamily } from './ralColors';

const OFFERED = RAL_CLASSIC.filter((colour) => !RAL_EXCLUDED.includes(colour.code));

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/^ral\s*/, '')
    .trim();
}

type Props = {
  value: RalColour | null;
  onChange: (colour: RalColour | null) => void;
  other: string;
  onOtherChange: (value: string) => void;
};

export function RalPicker({ value, onChange, other, onOtherChange }: Props): JSX.Element {
  const [query, setQuery] = useState('');
  const [family, setFamily] = useState<RalFamily | 'all'>('all');

  const colours = useMemo(() => {
    const q = normalize(query);
    return OFFERED.filter((colour) => {
      if (family !== 'all' && colour.family !== family) return false;
      if (!q) return true;
      return (
        colour.code.includes(q.replace(/\s/g, '')) ||
        normalize(colour.name).includes(q) ||
        normalize(colour.nameEn).includes(q)
      );
    });
  }, [query, family]);

  return (
    <div className="cb-ral">
      <div className="cb-ral-selected">
        <span
          className={`cb-ral-selected-swatch ${value ? '' : 'is-empty'}`}
          style={value ? { background: value.hex } : undefined}
          aria-hidden="true"
        />
        <div className="cb-ral-selected-text">
          {value ? (
            <>
              <strong>RAL {value.code}</strong> · {value.name}
              <span className="cb-muted"> ({value.nameEn})</span>
            </>
          ) : (
            <span className="cb-muted">Aucune teinte choisie : touchez une couleur du nuancier.</span>
          )}
        </div>
        {value ? (
          <button type="button" className="cb-link" onClick={() => onChange(null)}>
            Retirer
          </button>
        ) : null}
      </div>

      <div className="cb-ral-tools">
        <input
          type="search"
          className="cb-ral-search"
          placeholder="Rechercher un code ou un nom (7016, anthracite, vert…)"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (event.target.value.trim()) setFamily('all');
          }}
        />
        <div className="cb-ral-families" role="tablist">
          <button
            type="button"
            className={family === 'all' ? 'is-active' : ''}
            onClick={() => setFamily('all')}
          >
            Toutes
          </button>
          {RAL_FAMILIES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={family === item.id ? 'is-active' : ''}
              onClick={() => {
                setFamily(item.id);
                setQuery('');
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="cb-ral-grid">
        {colours.map((colour) => (
          <button
            key={colour.code}
            type="button"
            className={`cb-ral-chip ${value?.code === colour.code ? 'is-selected' : ''}`}
            onClick={() => onChange(colour)}
            title={`RAL ${colour.code} · ${colour.name}`}
            aria-pressed={value?.code === colour.code}
          >
            <span className="cb-ral-chip-swatch" style={{ background: colour.hex }} />
            <span className="cb-ral-chip-code">{colour.code}</span>
            <span className="cb-ral-chip-name">{colour.name}</span>
          </button>
        ))}
        {colours.length === 0 ? <p className="cb-muted">Aucune teinte ne correspond à cette recherche.</p> : null}
      </div>

      <label className="cb-field cb-ral-other">
        <span>Autre teinte, hors RAL Classic (facultatif)</span>
        <input
          type="text"
          value={other}
          placeholder="Référence NCS ou Pantone, échantillon apporté par le client…"
          onChange={(event) => onOtherChange(event.target.value)}
        />
      </label>

      <p className="cb-ral-note">
        Couleurs à l'écran indicatives : validez la teinte avec le client sur un nuancier RAL physique.
      </p>
    </div>
  );
}
