import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import designTokens from '../design-tokens.json';
import { ModuleBuilder, type BuilderController, type CompositionSnapshot } from '../components/ModuleBuilder';
import {
  COPY,
  DEFAULT_COMPOSITION,
  DEFAULT_FEET,
  DELIVERABLE_COUNTRIES,
  MODULE_HANDLES,
  OUTSIDE_ZONE_URL,
  SIGNATURE_HANDLES,
} from './config';
import {
  buildCartItems,
  formatMoney,
  levels,
  makeCompositionId,
  quoteComposition,
  type ShopCatalog,
} from './shopPricing';

/*
 * Messages exchanged with the Shopify page (see shopify/golden-age-builder.liquid):
 *   builder -> page  GROOVALY_SHOP_HELLO   { handles }          ask for live prices / variant ids
 *   page -> builder  GROOVALY_SHOP_CATALOG { catalog }
 *   builder -> page  GROOVALY_SHOP_ADD     { requestId, items } add lines to the Shopify cart
 *   page -> builder  GROOVALY_SHOP_ADDED   { requestId, ok, message? }
 *   builder -> page  { type: 'GROOVALY_SHOP_HEIGHT', height }   resize the iframe
 */

type Status = 'idle' | 'adding' | 'error';

const ALL_HANDLES = [...Object.values(MODULE_HANDLES), ...Object.values(SIGNATURE_HANDLES)];

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

function isEmbedded(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('embed') === '1' && window.parent !== window;
}

export default function ShopApp(): JSX.Element {
  const embed = useMemo(isEmbedded, []);
  const builderRef = useRef<BuilderController | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pendingRef = useRef<{ id: string; resolve: (result: { ok: boolean; message?: string }) => void } | null>(null);

  const [snapshot, setSnapshot] = useState<CompositionSnapshot>({
    placedItems: DEFAULT_COMPOSITION,
    addFeet: DEFAULT_FEET,
    metrics: null,
  });
  const [catalog, setCatalog] = useState<ShopCatalog | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [builderKey, setBuilderKey] = useState(0);
  const [startEmpty, setStartEmpty] = useState(false);

  // Talk to the Shopify page.
  useEffect(() => {
    if (!embed) return;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      const data = event.data || {};
      if (data.type === 'GROOVALY_SHOP_CATALOG' && data.catalog) {
        setCatalog(data.catalog as ShopCatalog);
      }
      if (data.type === 'GROOVALY_SHOP_ADDED' && pendingRef.current && data.requestId === pendingRef.current.id) {
        pendingRef.current.resolve({ ok: Boolean(data.ok), message: data.message });
        pendingRef.current = null;
      }
    };
    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: 'GROOVALY_SHOP_HELLO', handles: ALL_HANDLES }, '*');
    return () => window.removeEventListener('message', onMessage);
  }, [embed]);

  // Keep the iframe as tall as the content.
  useEffect(() => {
    if (!embed || !rootRef.current) return;
    let last = 0;
    const send = () => {
      const height = Math.ceil(rootRef.current?.getBoundingClientRect().height ?? 0);
      if (height > 0 && Math.abs(height - last) > 1) {
        last = height;
        window.parent.postMessage({ type: 'GROOVALY_SHOP_HEIGHT', height }, '*');
      }
    };
    const observer = new ResizeObserver(send);
    observer.observe(rootRef.current);
    send();
    return () => observer.disconnect();
  }, [embed]);

  const { placedItems, addFeet } = snapshot;
  const quote = useMemo(() => quoteComposition(placedItems, addFeet, catalog), [placedItems, addFeet, catalog]);
  const currency = catalog?.currency ?? 'EUR';
  const hasModules = placedItems.length > 0;
  const country = catalog?.country ?? null;
  const deliverable = catalog ? catalog.deliverable && (!country || DELIVERABLE_COUNTRIES.includes(country)) : true;
  const levelCount = levels(placedItems);
  const wallNote = levelCount >= 3 ? COPY.wallStronglyRecommended : levelCount >= 2 ? COPY.wallRecommended : null;

  const canAdd = embed && hasModules && deliverable && quote.purchasable && status !== 'adding';

  const summary = quote.signature
    ? COPY.signatureMatch(quote.signature.name)
    : quote.lines.map((line) => (line.key === 'feet' ? 'feet' : `${line.quantity} × ${line.label}`)).join(' · ');

  const requestAdd = (items: unknown[]): Promise<{ ok: boolean; message?: string }> =>
    new Promise((resolve) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      pendingRef.current = { id, resolve };
      window.parent.postMessage({ type: 'GROOVALY_SHOP_ADD', requestId: id, items }, '*');
      setTimeout(() => {
        if (pendingRef.current?.id === id) {
          pendingRef.current = null;
          resolve({ ok: false, message: 'timeout' });
        }
      }, 20000);
    });

  const handleAdd = async () => {
    if (!canAdd) return;
    setStatus('adding');
    setErrorMessage('');
    try {
      const compositionId = makeCompositionId();
      const payload = await builderRef.current?.captureComposition('White Pearl');
      const items = buildCartItems(quote, placedItems, addFeet, {
        compositionId,
        previewUrl: payload?.previewImageUrl,
      });
      const result = await requestAdd(items);
      if (!result.ok) throw new Error(result.message || 'cart');
      // The page now opens the cart. Leave the builder empty, so going back
      // does not suggest the composition can still be edited.
      setStartEmpty(true);
      setBuilderKey((key) => key + 1);
      setStatus('idle');
    } catch (error) {
      console.warn('[Groovaly shop builder] Add to cart failed', error);
      setErrorMessage(COPY.error);
      setStatus('error');
    }
  };

  const priceBlock = (
    <div className="sb-price-block">
      {hasModules ? (
        <>
          <p className="sb-price">{formatMoney(quote.total, currency)}</p>
          <p className="sb-summary">{summary}</p>
          {quote.capacity ? <p className="sb-meta">{COPY.capacity(quote.capacity.lp, quote.capacity.singles)}</p> : null}
          <p className="sb-meta">{COPY.priceNote}</p>
        </>
      ) : (
        <p className="sb-summary">{COPY.empty}</p>
      )}
    </div>
  );

  const action = (
    <div className="sb-action">
      {!deliverable ? (
        <div className="sb-zone">
          <p className="sb-zone-title">{COPY.outsideZoneTitle}</p>
          <p className="sb-zone-body">{COPY.outsideZoneBody}</p>
          <a className="sb-zone-link" href={OUTSIDE_ZONE_URL} target="_top">
            {COPY.outsideZoneLink}
          </a>
        </div>
      ) : (
        <>
          <button type="button" className="sb-cta" disabled={!canAdd} onClick={handleAdd}>
            {status === 'adding' ? (
              COPY.adding
            ) : (
              <>
                {COPY.cta}
                {hasModules ? <span className="sb-mobile-only"> · {formatMoney(quote.total, currency)}</span> : null}
              </>
            )}
          </button>
          {!embed ? <p className="sb-meta">{COPY.preview}</p> : null}
          {embed && hasModules && catalog && !quote.purchasable ? <p className="sb-error">{COPY.unavailable}</p> : null}
          {status === 'error' ? <p className="sb-error">{errorMessage}</p> : null}
        </>
      )}
    </div>
  );

  const note = wallNote ? (
    <aside className="sb-note" role="note">
      <span className="sb-note-icon" aria-hidden="true">
        i
      </span>
      <div>
        <p className="sb-note-title">{wallNote.title}</p>
        <p className="sb-note-body">{wallNote.body}</p>
      </div>
    </aside>
  ) : null;

  // Desktop: price, button and notes under the scene. Mobile: only the button
  // between the scene and the palette, everything else after the palette.
  const sceneFooter = (
    <div className="sb-scene-footer" aria-live="polite">
      <section className="sb-bar">
        <div className="sb-desktop-only">{priceBlock}</div>
        {action}
      </section>
      <div className="sb-desktop-only">{note}</div>
    </div>
  );

  const sideFooter = (
    <div className="sb-side-footer sb-mobile-only">
      {priceBlock}
      {note}
    </div>
  );

  return (
    <main className={`gb-app gb-app-fluid sb-app ${embed ? 'gb-app-embed' : ''}`} style={themeVars()}>
      <div ref={rootRef} className="sb-root">
        <section className="gb-content-shell gb-content-shell-builder-only">
          <ModuleBuilder
            key={builderKey}
            variant="shop"
            embedMode={embed}
            showHeader={false}
            controllerRef={builderRef}
            onCompositionChange={setSnapshot}
            initialItems={startEmpty ? [] : DEFAULT_COMPOSITION}
            initialAddFeet={startEmpty ? false : DEFAULT_FEET}
            sceneFooter={sceneFooter}
            sideFooter={sideFooter}
          />
        </section>
      </div>
    </main>
  );
}
