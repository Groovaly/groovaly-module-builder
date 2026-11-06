import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { ADDRESS_API } from './config';

export type AddressSuggestion = {
  label: string;
  /** Street line: house number + street, e.g. "12 Rue des Martyrs". */
  street: string;
  postcode: string;
  city: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
  /** Suggestions are only offered for France (Base Adresse Nationale). */
  enabled: boolean;
};

const MIN_CHARS = 4;
const DEBOUNCE_MS = 250;

type ApiFeature = {
  properties?: {
    label?: string;
    name?: string;
    housenumber?: string;
    street?: string;
    postcode?: string;
    city?: string;
    type?: string;
  };
};

export function parseAddressResponse(json: unknown): AddressSuggestion[] {
  const features = (json as { features?: ApiFeature[] })?.features;
  if (!Array.isArray(features)) return [];
  return features
    .map((feature) => feature.properties ?? {})
    .filter((p) => p.label && p.postcode && p.city && p.type !== 'municipality')
    .map((p) => ({
      label: p.label as string,
      street: p.name ?? [p.housenumber, p.street].filter(Boolean).join(' '),
      postcode: p.postcode as string,
      city: p.city as string,
    }));
}

export function AddressAutocomplete({ value, onChange, onSelect, enabled }: Props): JSX.Element {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const skipNextFetch = useRef(false);
  const listId = useId();

  useEffect(() => {
    if (!enabled) {
      setSuggestions([]);
      return;
    }
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    const query = value.trim();
    if (query.length < MIN_CHARS) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const url = `${ADDRESS_API}?q=${encodeURIComponent(query)}&limit=5&autocomplete=1&index=address`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(String(response.status));
        const results = parseAddressResponse(await response.json());
        setSuggestions(results);
        setActive(-1);
        setOpen(results.length > 0);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setSuggestions([]);
      }
    }, DEBOUNCE_MS);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [value, enabled]);

  const choose = (suggestion: AddressSuggestion) => {
    skipNextFetch.current = true;
    onSelect(suggestion);
    setOpen(false);
    setSuggestions([]);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => (index + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault();
      choose(suggestions[active]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="cb-address">
      <input
        required
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder={enabled ? 'Commencez à taper : numéro et rue…' : undefined}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        onFocus={() => setOpen(suggestions.length > 0)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && suggestions.length > 0 ? (
        <ul className="cb-address-list" id={listId} role="listbox">
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.label}-${index}`}
              role="option"
              aria-selected={index === active}
              className={index === active ? 'is-active' : ''}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(suggestion);
              }}
            >
              <span className="cb-address-street">{suggestion.street}</span>
              <span className="cb-address-city">
                {suggestion.postcode} {suggestion.city}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
