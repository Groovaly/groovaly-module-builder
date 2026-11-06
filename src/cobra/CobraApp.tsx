import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import designTokens from '../design-tokens.json';
import {
  ModuleBuilder,
  type BuilderController,
  type CompositionSnapshot,
} from '../components/ModuleBuilder';
import {
  COUNTRIES,
  FINISHES,
  FORM_ENDPOINT,
  PASSWORD_SALT,
  PASSWORD_SHA256,
  PRICE_NOTES,
  SHEENS,
  SIGNATURES,
  STORE_NAME,
  type Finish,
  type FinishId,
} from './config';
import {
  countsFromBuilder,
  countsFromSignature,
  deliveryLabel,
  formatEuro,
  formatKg,
  priceCounts,
  priceLinesText,
  type PriceBreakdown,
} from './pricing';
import { RalPicker } from './RalPicker';
import { AddressAutocomplete } from './AddressAutocomplete';
import type { RalColour } from './ralColors';

const UNLOCK_KEY = 'groovaly-cobra-unlock';
const withBase = (path: string): string => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;

type Mode = 'custom' | 'signature';
type RequestType = 'Commande confirmée' | 'Devis à valider par le client';

type CustomerForm = {
  seller: string;
  requestType: RequestType;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  address: string;
  address2: string;
  postalCode: string;
  city: string;
  country: string;
  notes: string;
};

const EMPTY_FORM: CustomerForm = {
  seller: '',
  requestType: 'Commande confirmée',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  address: '',
  address2: '',
  postalCode: '',
  city: '',
  country: 'France',
  notes: '',
};

type SentOrder = {
  reference: string;
  sentAt: Date;
  compositionLabel: string;
  finishLabel: string;
  breakdown: PriceBreakdown;
  finish: Finish;
  form: CustomerForm;
  previewUrl: string;
  dimensions: string;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function safeStorageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the seller simply logs in again next time */
  }
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function makeReference(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const stamp = `${String(date.getFullYear()).slice(2)}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CB-${stamp}-${random}`;
}

function formatDate(date: Date): string {
  return date.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
}

function themeVars(): CSSProperties {
  const tokens = (designTokens as { tokens?: Record<string, string> }).tokens ?? {};
  return {
    '--gb-bg': tokens.backgroundColor ?? '#fafafa',
    '--gb-text': tokens.textColor ?? '#111',
    '--gb-muted': tokens.mutedColor ?? '#666',
    '--gb-border': tokens.borderColor ?? 'rgba(0,0,0,0.25)',
    '--gb-accent': tokens.buttonBackgroundColor ?? '#111',
    '--gb-heading-font': tokens.headingFontFamily ?? 'serif',
    '--gb-body-font': tokens.bodyFontFamily ?? 'sans-serif',
  } as CSSProperties;
}

/* ------------------------------------------------------------------ */
/* Password gate                                                       */
/* ------------------------------------------------------------------ */

function PasswordGate({ onUnlock }: { onUnlock: () => void }): JSX.Element {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setChecking(true);
    try {
      const hash = await sha256Hex(PASSWORD_SALT + value);
      if (hash === PASSWORD_SHA256) {
        safeStorageSet(UNLOCK_KEY, PASSWORD_SHA256);
        onUnlock();
      } else {
        setError(true);
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="cb-gate">
      <form className="cb-gate-card" onSubmit={submit}>
        <img src={withBase('/brand/Logo_Groovaly.webp')} alt="Groovaly" className="cb-gate-logo" />
        <p className="cb-eyebrow">Espace {STORE_NAME}</p>
        <h1 className="cb-gate-title">Golden Age</h1>
        <label className="cb-field">
          <span>Mot de passe</span>
          <input
            type="password"
            autoComplete="current-password"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError(false);
            }}
            autoFocus
          />
        </label>
        {error ? <p className="cb-error">Mot de passe incorrect.</p> : null}
        <button type="submit" className="cb-btn cb-btn-primary" disabled={checking || value.length === 0}>
          Accéder
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */

export default function CobraApp(): JSX.Element {
  const [unlocked, setUnlocked] = useState(() => safeStorageGet(UNLOCK_KEY) === PASSWORD_SHA256);

  useEffect(() => {
    document.title = `Collection Golden Age · ${STORE_NAME}`;
  }, []);

  if (!unlocked) {
    return (
      <main className="cb-app" style={themeVars()}>
        <PasswordGate onUnlock={() => setUnlocked(true)} />
      </main>
    );
  }

  return (
    <main className="cb-app" style={themeVars()}>
      <SellerPage
        onLock={() => {
          safeStorageSet(UNLOCK_KEY, null);
          setUnlocked(false);
        }}
      />
    </main>
  );
}

function SellerPage({ onLock }: { onLock: () => void }): JSX.Element {
  const builderRef = useRef<BuilderController | null>(null);
  const [mode, setMode] = useState<Mode>('custom');
  const [snapshot, setSnapshot] = useState<CompositionSnapshot>({ placedItems: [], addFeet: false, metrics: null });
  const [signatureId, setSignatureId] = useState<string | null>(null);
  const [finishId, setFinishId] = useState<FinishId>('white-pearl');
  const [sheen, setSheen] = useState<string>('À définir');
  const [ral, setRal] = useState<RalColour | null>(null);
  const [otherColour, setOtherColour] = useState('');
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sent, setSent] = useState<SentOrder | null>(null);
  const [builderKey, setBuilderKey] = useState(0);

  const finish = FINISHES.find((item) => item.id === finishId) ?? FINISHES[0];
  const signature = SIGNATURES.find((item) => item.id === signatureId) ?? null;

  const priceFor = (target: Finish): PriceBreakdown | null => {
    if (mode === 'signature') return signature ? priceCounts(countsFromSignature(signature), target, form.country) : null;
    if (snapshot.placedItems.length === 0) return null;
    return priceCounts(countsFromBuilder(snapshot.placedItems, snapshot.addFeet), target, form.country);
  };

  const breakdown = useMemo(() => priceFor(finish), [mode, signature, snapshot, finish, form.country]); // eslint-disable-line react-hooks/exhaustive-deps
  const hasComposition = breakdown !== null;

  const update = <K extends keyof CustomerForm>(key: K, value: CustomerForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const compositionLabel =
    mode === 'signature'
      ? signature
        ? `Composition signature ${signature.name}`
        : '—'
      : breakdown?.signature
        ? `Composition sur mesure, identique à ${breakdown.signature.name} (${snapshot.placedItems.length} modules)`
        : `Composition sur mesure (${snapshot.placedItems.length} module${snapshot.placedItems.length > 1 ? 's' : ''})`;

  const colourLabel = ral
    ? `RAL ${ral.code} ${ral.name}${otherColour.trim() ? ` (autre teinte notée : ${otherColour.trim()})` : ''}`
    : otherColour.trim() || 'Couleur à définir';
  const finishLabel = finish.isLacquer ? `${finish.label} · ${sheen} · ${colourLabel}` : finish.label;
  const tintHex = finish.isLacquer && ral ? ral.hex : null;

  const dimensions =
    mode === 'custom' && snapshot.metrics
      ? `${snapshot.metrics.heightCm} × ${snapshot.metrics.widthCm} × ${snapshot.metrics.depthCm} cm (H × L × P)`
      : '';

  const startNewOrder = () => {
    setSent(null);
    setMode('custom');
    setSignatureId(null);
    setFinishId('white-pearl');
    setSheen('À définir');
    setRal(null);
    setOtherColour('');
    setForm((current) => ({ ...EMPTY_FORM, seller: current.seller }));
    builderRef.current?.reset();
    setBuilderKey((key) => key + 1);
    window.scrollTo({ top: 0 });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!breakdown || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const sentAt = new Date();
    const reference = makeReference(sentAt);

    let compositionText = '';
    let layoutJson = '';
    let previewUrl = '';
    if (mode === 'custom') {
      const payload = await builderRef.current?.captureComposition(
        finish.isLacquer && ral ? `${finish.internalLabel} RAL ${ral.code}` : finish.internalLabel,
      );
      if (payload) {
        compositionText = payload.quotePayloadText ?? '';
        layoutJson = JSON.stringify(payload.layout);
        previewUrl = payload.previewImageUrl ?? '';
      }
    } else if (signature) {
      compositionText = `Composition signature : ${signature.name}`;
    }

    const address = [
      form.address,
      form.address2,
      `${form.postalCode} ${form.city}`.trim(),
      form.country,
    ]
      .filter((line) => line.trim().length > 0)
      .join('\n');

    const fields: Array<[string, string]> = [
      ['_subject', `${STORE_NAME} · ${form.requestType} ${reference} · ${form.clientName} · ${formatEuro(breakdown.total)}`],
      ['Référence', reference],
      ['Date', formatDate(sentAt)],
      ['Magasin', STORE_NAME],
      ['Type de demande', form.requestType],
      ['Vendeur', form.seller],
      ['Composition', compositionLabel],
      ['Finition', finish.label],
      ['Brillance', finish.isLacquer ? sheen : '—'],
      ['Couleur', finish.isLacquer ? colourLabel : 'White Pearl'],
      ['Code RAL', finish.isLacquer && ral ? `RAL ${ral.code}` : '—'],
      ['Couleur écran (HEX, indicatif)', finish.isLacquer && ral ? ral.hex : '—'],
      ['Prix total TTC', formatEuro(breakdown.total)],
      ['Prix composition', formatEuro(breakdown.compositionTotal)],
      ['Tarif appliqué', breakdown.signature ? `Composition identifiée : ${breakdown.signature.name}` : 'Sur mesure (somme des modules)'],
      ['Livraison', deliveryLabel(breakdown.delivery)],
      ['Zone / tranche', `${breakdown.delivery.zone ?? 'Hors zone'} · ${breakdown.delivery.bracket} · ${formatKg(breakdown.weightKg)}`],
      ['Détail du prix', priceLinesText(breakdown, finish)],
      ['Client', form.clientName],
      ['Email client', form.clientEmail],
      ['Téléphone client', form.clientPhone],
      ['Adresse de livraison', address],
      ['Remarques', form.notes || '—'],
      ['Dimensions', dimensions || '—'],
      ['Détail de la composition', compositionText.replace(/\r?\n/g, '\r\n')],
      ['Aperçu', previewUrl || '—'],
      ['Layout (JSON)', layoutJson || '—'],
    ];

    const body = new FormData();
    for (const [key, value] of fields) body.append(key, value);

    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body,
      });
      if (!response.ok) throw new Error(`Formspree ${response.status}`);
      setSent({
        reference,
        sentAt,
        compositionLabel,
        finishLabel,
        breakdown,
        finish,
        form,
        previewUrl,
        dimensions,
      });
      window.scrollTo({ top: 0 });
    } catch (error) {
      console.warn('[Groovaly Cobra] Submission failed', error);
      setSubmitError("L'envoi a échoué. Vérifiez la connexion et réessayez : rien n'a été perdu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header className="cb-header">
        <div className="cb-header-brand">
          <img src={withBase('/brand/Logo_Groovaly.webp')} alt="Groovaly" className="cb-header-logo" />
          <span className="cb-header-x">×</span>
          <span className="cb-header-store">{STORE_NAME}</span>
        </div>
        <div className="cb-header-title">Collection Golden Age</div>
        <button type="button" className="cb-link" onClick={onLock}>
          Verrouiller
        </button>
      </header>

      {sent ? <Confirmation order={sent} onNew={startNewOrder} /> : null}

      <div className={`cb-page ${sent ? 'is-hidden' : ''}`}>
        {/* 1. Composition */}
        <section className="cb-section">
          <div className="cb-section-head">
            <h2>
              <span className="cb-step">1</span> Composition
            </h2>
            <div className="cb-segmented" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'custom'}
                className={mode === 'custom' ? 'is-active' : ''}
                onClick={() => setMode('custom')}
              >
                Sur mesure
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signature'}
                className={mode === 'signature' ? 'is-active' : ''}
                onClick={() => setMode('signature')}
              >
                Composition signature
              </button>
            </div>
          </div>

          <div className={`cb-builder ${mode === 'custom' ? '' : 'is-hidden'}`}>
            <p className="cb-hint">
              Glissez les modules sur la grille. Un module seul se commande aussi ici. Pour une des 12 compositions
              signature, utilisez l'onglet « Composition signature ».
            </p>
            <div className="gb-app-fluid">
              <ModuleBuilder
                key={builderKey}
                variant="cobra"
                controllerRef={builderRef}
                onCompositionChange={setSnapshot}
                tintHex={tintHex}
                labels={{
                  dragHint: 'Glissez les modules sur la grille',
                  clearGrid: 'Tout effacer',
                  addFeet: 'ajouter des pieds',
                }}
              />
            </div>
          </div>

          {mode === 'signature' ? (
            <div className="cb-signatures">
              {SIGNATURES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`cb-signature ${item.id === signatureId ? 'is-selected' : ''}`}
                  onClick={() => setSignatureId(item.id)}
                  aria-pressed={item.id === signatureId}
                >
                  <span className="cb-signature-name">{item.name}</span>
                  <span className="cb-signature-price">
                    {formatEuro(priceCounts(countsFromSignature(item), finish, form.country).compositionTotal)}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <div className="cb-columns">
          <div className="cb-main">
            {/* 2. Finish */}
            <section className="cb-section">
              <div className="cb-section-head">
                <h2>
                  <span className="cb-step">2</span> Finition
                </h2>
              </div>
              <div className="cb-finishes">
                {FINISHES.map((item) => {
                  const price = priceFor(item);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`cb-finish ${item.id === finishId ? 'is-selected' : ''}`}
                      onClick={() => setFinishId(item.id)}
                      aria-pressed={item.id === finishId}
                    >
                      <span
                        className={`cb-finish-swatch cb-swatch-${item.id}`}
                        style={item.isLacquer && ral ? { background: ral.hex } : undefined}
                        aria-hidden="true"
                      />
                      <span className="cb-finish-label">{item.label}</span>
                      <span className="cb-finish-desc">{item.description}</span>
                      <span className="cb-finish-price">{price ? formatEuro(price.compositionTotal) : '—'}</span>
                    </button>
                  );
                })}
              </div>

              {finish.isLacquer ? (
                <>
                  <label className="cb-field cb-sheen">
                    <span>Brillance</span>
                    <select value={sheen} onChange={(event) => setSheen(event.target.value)}>
                      <option value="À définir">À définir</option>
                      {SHEENS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <h3 className="cb-subhead">Couleur</h3>
                  <RalPicker value={ral} onChange={setRal} other={otherColour} onOtherChange={setOtherColour} />
                </>
              ) : null}
            </section>

            {/* 3. Client & delivery */}
            <form className="cb-section" onSubmit={handleSubmit}>
              <div className="cb-section-head">
                <h2>
                  <span className="cb-step">3</span> Client et livraison
                </h2>
              </div>

              <div className="cb-grid-2">
                <label className="cb-field">
                  <span>Vendeur {STORE_NAME} *</span>
                  <input required value={form.seller} onChange={(event) => update('seller', event.target.value)} />
                </label>
                <label className="cb-field">
                  <span>Type de demande *</span>
                  <select
                    value={form.requestType}
                    onChange={(event) => update('requestType', event.target.value as RequestType)}
                  >
                    <option>Commande confirmée</option>
                    <option>Devis à valider par le client</option>
                  </select>
                </label>
              </div>

              <h3 className="cb-subhead">Client</h3>
              <label className="cb-field">
                <span>Nom et prénom *</span>
                <input
                  required
                  autoComplete="off"
                  value={form.clientName}
                  onChange={(event) => update('clientName', event.target.value)}
                />
              </label>
              <div className="cb-grid-2">
                <label className="cb-field">
                  <span>Email *</span>
                  <input
                    required
                    type="email"
                    autoComplete="off"
                    value={form.clientEmail}
                    onChange={(event) => update('clientEmail', event.target.value)}
                  />
                </label>
                <label className="cb-field">
                  <span>Téléphone *</span>
                  <input
                    required
                    type="tel"
                    autoComplete="off"
                    value={form.clientPhone}
                    onChange={(event) => update('clientPhone', event.target.value)}
                  />
                </label>
              </div>

              <h3 className="cb-subhead">Adresse de livraison</h3>
              <label className="cb-field">
                <span>Adresse *</span>
                <AddressAutocomplete
                  value={form.address}
                  enabled={form.country === 'France'}
                  onChange={(value) => update('address', value)}
                  onSelect={(suggestion) =>
                    setForm((current) => ({
                      ...current,
                      address: suggestion.street,
                      postalCode: suggestion.postcode,
                      city: suggestion.city,
                      country: 'France',
                    }))
                  }
                />
              </label>
              <label className="cb-field">
                <span>Complément</span>
                <input
                  autoComplete="off"
                  placeholder="Bâtiment, escalier, société…"
                  value={form.address2}
                  onChange={(event) => update('address2', event.target.value)}
                />
              </label>
              <div className="cb-grid-3">
                <label className="cb-field">
                  <span>Code postal *</span>
                  <input
                    required
                    autoComplete="off"
                    inputMode="numeric"
                    value={form.postalCode}
                    onChange={(event) => update('postalCode', event.target.value)}
                  />
                </label>
                <label className="cb-field">
                  <span>Ville *</span>
                  <input
                    required
                    autoComplete="off"
                    value={form.city}
                    onChange={(event) => update('city', event.target.value)}
                  />
                </label>
                <label className="cb-field">
                  <span>Pays *</span>
                  <select value={form.country} onChange={(event) => update('country', event.target.value)}>
                    {COUNTRIES.map((country) => (
                      <option key={country}>{country}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="cb-field">
                <span>Remarques</span>
                <textarea
                  rows={3}
                  value={form.notes}
                  placeholder="Disponibilités pour la livraison, gravure, demande particulière…"
                  onChange={(event) => update('notes', event.target.value)}
                />
              </label>

              {submitError ? <p className="cb-error">{submitError}</p> : null}
              {!hasComposition ? (
                <p className="cb-hint">
                  {mode === 'custom'
                    ? 'Placez au moins un module sur la grille pour envoyer la demande.'
                    : 'Choisissez une composition signature pour envoyer la demande.'}
                </p>
              ) : null}
              <button type="submit" className="cb-btn cb-btn-primary cb-submit" disabled={!hasComposition || submitting}>
                {submitting ? 'Envoi en cours…' : `Envoyer à Groovaly${breakdown ? ` · ${formatEuro(breakdown.total)}` : ''}`}
              </button>
            </form>
          </div>

          <aside className="cb-summary" aria-live="polite">
            <PriceSummary
              compositionLabel={compositionLabel}
              finishLabel={finishLabel}
              breakdown={breakdown}
              finish={finish}
              dimensions={dimensions}
            />
          </aside>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Price summary                                                       */
/* ------------------------------------------------------------------ */

function PriceSummary({
  compositionLabel,
  finishLabel,
  breakdown,
  finish,
  dimensions,
}: {
  compositionLabel: string;
  finishLabel: string;
  breakdown: PriceBreakdown | null;
  finish: Finish;
  dimensions: string;
}): JSX.Element {
  return (
    <div className="cb-summary-card">
      {breakdown ? <p className="cb-total">{formatEuro(breakdown.total)}</p> : null}
      <p className="cb-summary-meta">{compositionLabel}</p>
      <p className="cb-summary-meta">{finishLabel}</p>
      {dimensions ? <p className="cb-summary-meta cb-muted">{dimensions}</p> : null}

      {breakdown ? (
        <>
          {breakdown.signature && compositionLabel.startsWith('Composition sur mesure') ? (
            <p className="cb-identified">
              Cette composition correspond à {breakdown.signature.name} : le tarif de la composition signature
              s'applique.
            </p>
          ) : null}
          <PriceTable breakdown={breakdown} finish={finish} />
        </>
      ) : (
        <p className="cb-muted">Le prix s'affiche dès qu'une composition est choisie.</p>
      )}

      <ul className="cb-notes">
        {PRICE_NOTES.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
}

function PriceTable({ breakdown, finish }: { breakdown: PriceBreakdown; finish: Finish }): JSX.Element {
  const { delivery } = breakdown;
  return (
    <table className="cb-lines">
      <tbody>
        {breakdown.lines.map((line) => (
          <tr key={line.label}>
            <td>
              {line.quantity} × {line.label}
            </td>
            <td>{formatEuro(line.subtotal)}</td>
          </tr>
        ))}
        <tr className="cb-lines-sub">
          <td>Composition · {finish.label}</td>
          <td>{formatEuro(breakdown.compositionTotal)}</td>
        </tr>
        <tr>
          <td>
            Livraison
            <span className="cb-lines-detail">
              {delivery.zone ?? 'Pays hors zone'} · {formatKg(breakdown.weightKg)}
            </span>
          </td>
          <td>{deliveryLabel(delivery)}</td>
        </tr>
        <tr className="cb-lines-total">
          <td>Total TTC</td>
          <td>
            {formatEuro(breakdown.total)}
            {delivery.cost === null && !delivery.included ? ' + livraison' : ''}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/* ------------------------------------------------------------------ */
/* Confirmation (printable)                                            */
/* ------------------------------------------------------------------ */

function Confirmation({ order, onNew }: { order: SentOrder; onNew: () => void }): JSX.Element {
  const { form } = order;
  return (
    <section className="cb-confirm">
      <div className="cb-confirm-actions cb-no-print">
        <button type="button" className="cb-btn" onClick={() => window.print()}>
          Imprimer le récapitulatif
        </button>
        <button type="button" className="cb-btn cb-btn-primary" onClick={onNew}>
          Nouvelle commande
        </button>
      </div>

      <div className="cb-confirm-card">
        <div className="cb-confirm-head">
          <img src={withBase('/brand/Logo_Groovaly.webp')} alt="Groovaly" className="cb-header-logo" />
          <div>
            <p className="cb-eyebrow">
              {form.requestType} · {STORE_NAME}
            </p>
            <h2 className="cb-confirm-title">{order.reference}</h2>
            <p className="cb-muted">{formatDate(order.sentAt)}</p>
          </div>
        </div>

        <p className="cb-confirm-ok cb-no-print">
          Demande envoyée à Groovaly. Romain recevra le détail par email et reviendra vers vous pour la suite.
        </p>

        {order.previewUrl ? (
          <img
            src={order.previewUrl}
            alt="Aperçu de la composition"
            className="cb-confirm-preview"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        ) : null}

        <div className="cb-grid-2 cb-confirm-grid">
          <div>
            <h3 className="cb-subhead">Composition</h3>
            <p>{order.compositionLabel}</p>
            <p>{order.finishLabel}</p>
            {order.dimensions ? <p className="cb-muted">{order.dimensions}</p> : null}
            <PriceTable breakdown={order.breakdown} finish={order.finish} />
          </div>
          <div>
            <h3 className="cb-subhead">Client</h3>
            <p>{form.clientName}</p>
            <p>{form.clientEmail}</p>
            <p>{form.clientPhone}</p>
            <h3 className="cb-subhead">Livraison</h3>
            <p>{form.address}</p>
            {form.address2 ? <p>{form.address2}</p> : null}
            <p>
              {form.postalCode} {form.city}
            </p>
            <p>{form.country}</p>
            <h3 className="cb-subhead">Vendeur</h3>
            <p>{form.seller}</p>
          </div>
        </div>
        {form.notes ? (
          <>
            <h3 className="cb-subhead">Remarques</h3>
            <p>{form.notes}</p>
          </>
        ) : null}
        <ul className="cb-notes">
          {PRICE_NOTES.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
