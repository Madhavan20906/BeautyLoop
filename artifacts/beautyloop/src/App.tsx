import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, CircleHelp, Copy, ExternalLink, FlaskConical, Layers3, RefreshCw, ScanFace, Sparkles } from 'lucide-react';
import type { BeautyCompareInput, BeautyCompareResult, BeautyFoundationShade, BeautyProduct, BeautyStatus, BeautyTaskFeature, BeautyTaskInput, BeautyTaskResult } from '@workspace/api-client-react';
import { getGetBeautyFoundationsQueryKey, getGetBeautyProductsQueryKey, getGetBeautyStatusQueryKey, getGetBeautyTaskQueryKey, useCompareBeautyProducts, useCreateBeautyTask, useGetBeautyFoundations, useGetBeautyProducts, useGetBeautyStatus, useGetBeautyTask } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

const preferenceLabels: Record<NonNullable<BeautyCompareInput['preferredAttributes']>[number], string> = {
  fragrance_free: 'Fragrance-free',
  non_comedogenic: 'Non-comedogenic',
  essential_oil_free: 'Essential-oil-free',
  oil_free: 'Oil-free',
};

const demoToneSwatches = [
  { name: 'Linen', hex: '#E7C9AF' },
  { name: 'Almond', hex: '#D9AD8D' },
  { name: 'Sienna', hex: '#BD896B' },
  { name: 'Cedar', hex: '#A66E55' },
  { name: 'Umber', hex: '#80513F' },
  { name: 'Cocoa', hex: '#613C31' },
];

function Home() {
  const statusQuery = useGetBeautyStatus({ query: { queryKey: getGetBeautyStatusQueryKey() } });
  const productsQuery = useGetBeautyProducts({ query: { queryKey: getGetBeautyProductsQueryKey() } });
  const compare = useCompareBeautyProducts();
  const [category, setCategory] = useState<BeautyCompareInput['category'] | ''>('');
  const [maxPrice, setMaxPrice] = useState('');
  const [preferences, setPreferences] = useState<NonNullable<BeautyCompareInput['preferredAttributes']>>([]);
  const [compareResult, setCompareResult] = useState<BeautyCompareResult | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState('');
  const [taskSummary, setTaskSummary] = useState<BeautyTaskResult | null>(null);

  const products = productsQuery.data ?? [];
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );
  const visibleProducts = useMemo(() => {
    if (compareResult) return compareResult.matches.map((match) => match.product);
    return products;
  }, [compareResult, products]);

  function togglePreference(value: NonNullable<BeautyCompareInput['preferredAttributes']>[number]) {
    setPreferences((current) => current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value]);
  }

  function submitCompare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data: BeautyCompareInput = {};
    if (category) data.category = category;
    if (maxPrice.trim() && Number.isFinite(Number(maxPrice)) && Number(maxPrice) >= 0) data.maxPriceINR = Number(maxPrice);
    if (preferences.length) data.preferredAttributes = preferences;
    compare.mutate({ data }, {
      onSuccess: (result) => {
        setCompareResult(result);
        setSelectedProductId((current) => result.matches.some((match) => match.product.id === current) ? current : null);
      },
    });
  }

  function clearComparison() {
    setCompareResult(null);
    setSelectedProductId(null);
  }

  async function copyDecision() {
    if (!selectedProduct) return;
    const prefText = preferences.length ? preferences.map((preference) => preferenceLabels[preference]).join(', ') : 'No ingredient preferences selected';
    const taskLines = taskSummary?.status === 'success'
      ? `\nYouCam task completed: ${taskSummary.feature}${taskSummary.skinColor ? `\nReturned skin color: ${taskSummary.skinColor}${taskSummary.skinColorName ? ` (${taskSummary.skinColorName})` : ''}` : ''}${taskSummary.previewUrl ? `\nPreview: ${taskSummary.previewUrl}` : ''}\nAI result is informational and not a diagnosis.`
      : '\nNo completed YouCam task included in this summary.';
    const text = `My BeautyLoop shortlist\n${selectedProduct.brand} — ${selectedProduct.name}\n₹${selectedProduct.priceINR.toLocaleString('en-IN')}${selectedProduct.size ? ` · ${selectedProduct.size}` : ''}\nPreferences: ${prefText}${taskLines}\nProduct facts: ${selectedProduct.sourceName} — ${selectedProduct.sourceUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage('Decision card copied to clipboard.');
    } catch {
      setCopyMessage('Clipboard access is unavailable in this browser. You can still review the card here.');
    }
  }

  const status = statusQuery.data as BeautyStatus | undefined;
  const hasProductsError = productsQuery.isError;
  const hasStatusError = statusQuery.isError;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a href="#top" className="brand" data-testid="link-home" aria-label="BeautyLoop home">
          <span className="brand-mark" aria-hidden="true">b</span>
          <span className="brand-name">beautyloop</span>
        </a>
        <div className="topbar-note" data-testid="status-studio-note">
          <span aria-hidden="true" />
          <span>A clearer way to choose</span>
        </div>
      </header>

      <main id="top" className="main-wrap">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy-wrap">
            <div className="eyebrow">Beauty decisions, with receipts</div>
            <h1 id="hero-title">Know what<br />you’re <em>choosing.</em></h1>
            <p className="hero-copy">Check the provider status, compare skincare by sourced facts, or—when YouCam is configured—run one face-color or foundation task after consent. No diagnosis. No hype. Just your choice, with context.</p>
            <div className="hero-actions">
              <a className="button-primary" href="#compare" data-testid="link-start-comparing">Explore the catalog <ArrowDown size={15} /></a>
              <span className="eyebrow" style={{ fontSize: 9 }}>Sources always in view</span>
            </div>
          </div>
          <div className="hero-art" aria-label="Abstract warm-toned portrait-inspired artwork">
            <span className="art-sun" />
            <span className="art-orbit one" />
            <span className="art-orbit two" />
            <span className="hero-label">the considered choice</span>
            <span className="art-caption">BeautyLoop · decision studio</span>
          </div>
        </section>

        <nav className="journey-rail" aria-label="BeautyLoop journey">
          <div className="rail-step"><span className="rail-num">01</span><div><div className="rail-label">Check what’s live</div><div className="rail-sub">Capabilities, not assumptions</div></div></div>
          <div className="rail-step"><span className="rail-num">02</span><div><div className="rail-label">Choose a face task</div><div className="rail-sub">Consent before any upload</div></div></div>
          <div className="rail-step"><span className="rail-num">03</span><div><div className="rail-label">Explore & compare</div><div className="rail-sub">Skin color or sourced skincare</div></div></div>
          <div className="rail-step"><span className="rail-num">04</span><div><div className="rail-label">Keep your decision</div><div className="rail-sub">Your choice, with context</div></div></div>
        </nav>

        <section aria-labelledby="availability-title">
          <div className="section-heading">
            <div><div className="section-index">01 / CAPABILITIES</div><h2 id="availability-title">What’s available today</h2></div>
            <p>We show the state of each connection plainly. Where a feature is not configured, we don’t simulate it.</p>
          </div>
          {statusQuery.isLoading ? (
            <div className="availability" aria-label="Loading capability status" data-testid="loading-beauty-status">
              <div className="skeleton" /><div className="skeleton" /><div className="skeleton" />
            </div>
          ) : hasStatusError ? (
            <div className="notice" role="alert" data-testid="error-beauty-status">
              Capability status couldn’t be loaded. We won’t assume analysis or preview availability.
              <button className="retry-button" onClick={() => statusQuery.refetch()} data-testid="button-retry-status"><RefreshCw size={12} /> Retry status</button>
            </div>
          ) : status ? (
            <div className="availability" data-testid="content-beauty-status">
              <StatusTile icon={<ScanFace size={15} />} title="Skin tone" value={status.skinTone} description={status.skinTone === 'ready' ? 'Configured · access unverified until a task succeeds.' : 'Not configured · no color analysis available.'} />
              <StatusTile icon={<ScanFace size={15} />} title="Skin analysis" value={status.skinAnalysis} description={status.skinAnalysis === 'ready' ? 'Configured · access unverified until a task succeeds.' : 'Not configured · no insight task available.'} />
              <StatusTile icon={<Sparkles size={15} />} title="Virtual try-on" value={status.virtualTryOn} description={status.virtualTryOn === 'ready' ? 'Configured · access unverified until a task succeeds.' : 'Not configured · no virtual preview available.'} />
              <StatusTile icon={<Layers3 size={15} />} title="Product catalog" value={status.catalog} description={status.catalog === 'partial' ? 'Partial catalog · listed details are source-backed.' : 'Catalog available · listed details are source-backed.'} />
            </div>
          ) : null}
        </section>

        <YouCamStudio status={status} statusLoading={statusQuery.isLoading} onTaskResult={setTaskSummary} />

        <section id="compare" aria-labelledby="compare-title">
          <div className="section-heading" style={{ marginTop: 77 }}>
            <div><div className="section-index">03 / YOUR SHORTLIST</div><h2 id="compare-title">Compare what matters</h2></div>
            <p>Set a budget and product type, then choose the attributes you care about. Matches are based only on published catalog facts.</p>
          </div>
          <div className="comparison">
            <form className="filter-panel" onSubmit={submitCompare}>
              <h3 className="filter-title">Your preferences</h3>
              <p className="filter-note">These filters shape the comparison only. They are not skin or medical advice.</p>
              <label className="field-label" htmlFor="category-filter">Product type</label>
              <select id="category-filter" className="filter-select" value={category} onChange={(event) => setCategory(event.target.value as BeautyCompareInput['category'] | '')} data-testid="select-product-category">
                <option value="">All types</option><option value="serum">Serums</option><option value="moisturizer">Moisturizers</option>
              </select>
              <label className="field-label" htmlFor="budget-filter">Maximum price · INR</label>
              <input id="budget-filter" className="filter-input" type="number" min="0" inputMode="numeric" placeholder="No limit" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} data-testid="input-max-price" />
              <span className="field-label">Attributes to look for</span>
              <div className="check-list">
                {(Object.entries(preferenceLabels) as [keyof typeof preferenceLabels, string][]).map(([value, label]) => (
                  <label className="check-option" key={value}>
                    <input type="checkbox" checked={preferences.includes(value)} onChange={() => togglePreference(value)} data-testid={`checkbox-preference-${value}`} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <button className="compare-button" type="submit" disabled={compare.isPending || productsQuery.isLoading} data-testid="button-compare-products">
                {compare.isPending ? <><RefreshCw size={14} /> Comparing…</> : <>Compare catalog <ArrowRight size={14} /></>}
              </button>
              {compare.isError && <div className="compare-error" role="alert" data-testid="error-compare">Comparison didn’t load. Please try again.</div>}
              {compareResult && <button className="retry-button" type="button" onClick={clearComparison} data-testid="button-clear-comparison">Show full catalog</button>}
            </form>

            <div className="results-area">
              <div className="results-top">
                <h3>{compareResult ? 'Preference matches' : 'Source-backed catalog'}</h3>
                <span className="results-count" data-testid="text-product-count">{productsQuery.isLoading ? 'Loading' : `${visibleProducts.length} ${visibleProducts.length === 1 ? 'product' : 'products'}`}</span>
              </div>
              {productsQuery.isLoading ? (
                <div className="product-grid" aria-label="Loading catalog" data-testid="loading-products"><div className="skeleton" /><div className="skeleton" /></div>
              ) : hasProductsError ? (
                <div className="empty-state" role="alert" data-testid="error-products">
                  <CircleHelp size={25} color="#b87562" />
                  <h3>The catalog didn’t come through</h3>
                  <p>We couldn’t retrieve source-backed product details. Try again to continue comparing.</p>
                  <button className="retry-button" onClick={() => productsQuery.refetch()} data-testid="button-retry-products">Retry catalog</button>
                </div>
              ) : compareResult?.matches.length === 0 ? (
                <div className="empty-state" data-testid="empty-comparison">
                  <FlaskConical size={25} color="#b87562" />
                  <h3>No confirmed matches this time</h3>
                  <p>{compareResult.noMatchReason || 'No catalog products meet those filters with confirmed details.'} Try broadening your preferences or show the full catalog.</p>
                </div>
              ) : visibleProducts.length === 0 ? (
                <div className="empty-state" data-testid="empty-catalog">
                  <Layers3 size={25} color="#b87562" />
                  <h3>A small catalog, for now</h3>
                  <p>No products are available yet. When source-backed listings are added, they’ll appear here.</p>
                </div>
              ) : (
                <>
                  {compareResult && <p className="results-count" data-testid="text-comparison-explanation" style={{ margin: '0 0 14px' }}>Results reflect the preferences sent to the catalog comparator. Unconfirmed attributes remain clearly marked.</p>}
                  <div className="product-grid" data-testid="list-products">
                    {visibleProducts.map((product) => {
                      const result = compareResult?.matches.find((match) => match.product.id === product.id);
                      return <ProductCard key={product.id} product={product} selected={selectedProductId === product.id} onSelect={() => setSelectedProductId(product.id)} matchReasons={result?.matchReasons} unconfirmed={result?.unconfirmedPreferences} />;
                    })}
                  </div>
                </>
              )}
              {status?.catalog === 'partial' && !hasProductsError && !productsQuery.isLoading && <p className="toast-inline" data-testid="notice-partial-catalog">The catalog is marked partial; this list may not include every available product.</p>}
            </div>
          </div>
        </section>

        <section className="decision" aria-labelledby="decision-title">
          <div className="decision-content">
            <div className="section-index">04 / THE DECISION CARD</div>
            <h2 id="decision-title">{selectedProduct ? 'A choice, with context.' : 'Your next choice, honestly.'}</h2>
            <p className="decision-intro">Keep the product facts and your own preferences together. This card never implies a skin assessment or a virtual preview.</p>
            {selectedProduct ? (
              <>
                <div className="decision-product" data-testid="content-decision-product">
                  <div><div className="decision-product-name">{selectedProduct.name}</div><div className="decision-brand">{selectedProduct.brand}{selectedProduct.size ? ` · ${selectedProduct.size}` : ''}</div></div>
                  <div className="decision-price">₹{selectedProduct.priceINR.toLocaleString('en-IN')}</div>
                </div>
                <div className="decision-prefs" data-testid="text-decision-source">
                  Source: <a href={selectedProduct.sourceUrl} target="_blank" rel="noreferrer" data-testid="link-decision-source" style={{ color: '#e6c49f', textUnderlineOffset: 3 }}>{selectedProduct.sourceName} <ExternalLink size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /></a> · price observed {selectedProduct.priceObservedAt ? new Date(selectedProduct.priceObservedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'date not provided'}.
                </div>
                <div className="decision-prefs" data-testid="text-decision-preferences">
                  <strong>Your comparison preferences:</strong> {preferences.length ? preferences.map((preference) => preferenceLabels[preference]).join(' · ') : 'No specific attributes selected'}
                </div>
                {taskSummary?.status === 'success' && <div className="decision-prefs" data-testid="text-decision-task-summary"><strong>Completed YouCam task:</strong> {taskSummary.feature}{taskSummary.skinColor ? ` · ${taskSummary.skinColor}` : ''}</div>}
                <button className="button-secondary" style={{ marginTop: 18, background: '#f5f1e8', borderColor: '#f5f1e8' }} onClick={copyDecision} data-testid="button-copy-decision"><Copy size={14} /> Copy decision card</button>
                {copyMessage && <p className="toast-inline" style={{ color: '#dce5d8' }} role="status" data-testid="status-copy-decision">{copyMessage}</p>}
              </>
            ) : (
              <div className="decision-product"><div><div className="decision-product-name">No product selected</div><div className="decision-brand">Choose a catalog item above to add it here.</div></div><ArrowUpRight size={17} /></div>
            )}
          </div>
          <div className="decision-side">
            <h3>Clear about what isn’t here</h3>
            <div className="unavailable-line"><i /><span>YouCam provider access: <strong>{taskSummary?.status === 'success' ? 'confirmed by a successful task' : 'not yet confirmed; configuration alone is not proof'}</strong></span></div>
            <div className="unavailable-line"><i /><span>Skin insight: <strong>{taskSummary?.status === 'success' && taskSummary.feature === 'skin-analysis' ? 'task completed; informational only' : 'only shown after a successful selected task'}</strong></span></div>
            <div className="unavailable-line"><i /><span>Foundation preview: <strong>{taskSummary?.status === 'success' && taskSummary.feature === 'foundation-try-on' ? 'real preview returned' : 'only shown after a successful selected task'}</strong></span></div>
            <div className="unavailable-line"><i /><span>No treatment recommendations are made from skin measurements.</span></div>
            <div className="decision-foot">Evidence before influence · BeautyLoop</div>
          </div>
        </section>

        <footer className="footer">
          <span><strong>BeautyLoop</strong> · A thoughtful beauty decision studio.</span>
          <span>Product details link to their named sources. Attributes not confirmed by a source stay unknown.</span>
        </footer>
      </main>
    </div>
  );
}

function hexToLab(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match) return null;
  const channels = match[1].match(/.{2}/g);
  if (!channels) return null;
  const [red, green, blue] = channels.map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const x = (red * 0.4124564 + green * 0.3575761 + blue * 0.1804375) / 0.95047;
  const y = red * 0.2126729 + green * 0.7151522 + blue * 0.072175;
  const z = (red * 0.0193339 + green * 0.119192 + blue * 0.9503041) / 1.08883;
  const transform = (value: number) => value > 0.008856 ? Math.cbrt(value) : (7.787 * value) + 16 / 116;
  const fx = transform(x);
  const fy = transform(y);
  const fz = transform(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function closestDemoTone(hex: string) {
  const target = hexToLab(hex);
  if (!target) return null;
  return demoToneSwatches.reduce<{ name: string; hex: string; distance: number } | null>((closest, swatch) => {
    const lab = hexToLab(swatch.hex);
    if (!lab) return closest;
    const distance = Math.hypot(target[0] - lab[0], target[1] - lab[1], target[2] - lab[2]);
    return !closest || distance < closest.distance ? { ...swatch, distance } : closest;
  }, null);
}

function closestFoundationShade(hex: string, shades: BeautyFoundationShade[]) {
  const target = hexToLab(hex);
  if (!target) return null;
  return shades.reduce<{ shade: BeautyFoundationShade; distance: number } | null>((closest, shade) => {
    const lab = hexToLab(shade.displayColorHex);
    if (!lab) return closest;
    const distance = Math.hypot(target[0] - lab[0], target[1] - lab[1], target[2] - lab[2]);
    return !closest || distance < closest.distance ? { shade, distance } : closest;
  }, null);
}

function taskErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') {
    return error instanceof Error ? error.message : null;
  }
  const record = error as Record<string, unknown>;
  const sources = [record.data, (record.response as Record<string, unknown> | undefined)?.data];
  for (const source of sources) {
    if (source && typeof source === 'object') {
      const message = (source as Record<string, unknown>).error;
      if (typeof message === 'string' && message.trim()) return message;
    }
  }
  return typeof record.message === 'string' && record.message ? record.message : null;
}

async function compressPhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new Error('This browser could not prepare the image. Try another JPEG or PNG photo.');
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.86).split(',')[1] ?? '';
}

function YouCamStudio({ status, statusLoading, onTaskResult }: { status?: BeautyStatus; statusLoading: boolean; onTaskResult: (result: BeautyTaskResult | null) => void }) {
  const createTask = useCreateBeautyTask();
  const foundationsQuery = useGetBeautyFoundations({
    query: { queryKey: getGetBeautyFoundationsQueryKey() },
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [taskError, setTaskError] = useState('');
  const [preparing, setPreparing] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [accessConfirmed, setAccessConfirmed] = useState(false);
  const [taskCopyMessage, setTaskCopyMessage] = useState('');
  const [selectedFoundationId, setSelectedFoundationId] = useState<string | null>(null);
  const [selectedShadeId, setSelectedShadeId] = useState<string | null>(null);
  const [selectedSwatch, setSelectedSwatch] = useState<string | null>(null);
  const [colorIntensity, setColorIntensity] = useState(65);
  const [coverageIntensity, setCoverageIntensity] = useState(60);
  const [glowIntensity, setGlowIntensity] = useState(35);
  const taskResultCallback = useRef(onTaskResult);
  taskResultCallback.current = onTaskResult;

  const taskQuery = useGetBeautyTask(activeJobId ?? '', {
    query: {
      enabled: Boolean(activeJobId),
      queryKey: getGetBeautyTaskQueryKey(activeJobId ?? ''),
      refetchInterval: (query) => query.state.data?.status === 'running' ? 10_000 : false,
    },
  });
  const taskResult = taskQuery.data;
  const foundations = foundationsQuery.data ?? [];
  const foundation = foundations.find((item) => item.id === selectedFoundationId) ?? foundations[0] ?? null;
  const selectedFoundationShade = foundation?.shades.find((shade) => shade.id === selectedShadeId) ?? null;
  const selectedPreviewColor = selectedFoundationShade?.displayColorHex ?? selectedSwatch;
  const isRunning = taskResult?.status === 'running';
  const taskBusy = preparing || createTask.isPending || Boolean(isRunning);

  useEffect(() => {
    if (photoUrl) return () => URL.revokeObjectURL(photoUrl);
    return undefined;
  }, [photoUrl]);

  useEffect(() => {
    if (!activeJobId || taskResult?.jobId !== activeJobId) return;
    if (taskResult.status === 'success') {
      setAccessConfirmed(true);
      taskResultCallback.current(taskResult);
    }
  }, [activeJobId, taskResult]);

  function capabilityFor(feature: BeautyTaskFeature) {
    if (!status) return undefined;
    if (feature === 'skin-tone') return status.skinTone;
    if (feature === 'skin-analysis') return status.skinAnalysis;
    return status.virtualTryOn;
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setUploadError('');
    setTaskError('');
    if (!file) return;
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      setUploadError('Choose a JPEG or PNG image. Other image formats are not accepted.');
      return;
    }
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setImageFile(file);
    setPhotoUrl(URL.createObjectURL(file));
    setConsent(false);
    setSelectedShadeId(null);
    setSelectedSwatch(null);
    setActiveJobId(null);
    taskResultCallback.current(null);
  }

  function removePhoto() {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
    setImageFile(null);
    setConsent(false);
    setSelectedShadeId(null);
    setSelectedSwatch(null);
    setActiveJobId(null);
    setTaskError('');
    taskResultCallback.current(null);
  }

  async function runTask(feature: BeautyTaskFeature) {
    if (!imageFile || !consent || taskBusy || capabilityFor(feature) !== 'ready') return;
    if (feature === 'foundation-try-on' && !selectedPreviewColor) {
      setTaskError('Choose a sourced shade or an illustrative demo tone before starting the preview.');
      return;
    }
    setTaskError('');
    setActiveJobId(null);
    taskResultCallback.current(null);
    setPreparing(true);
    try {
      const imageBase64 = await compressPhoto(imageFile);
      if (!imageBase64) throw new Error('Image compression returned no data. Try selecting the photo again.');
      const data: BeautyTaskInput = { feature, imageBase64, mimeType: 'image/jpeg' };
      if (feature === 'foundation-try-on' && selectedPreviewColor) {
        data.foundationColor = selectedPreviewColor;
        data.colorIntensity = colorIntensity;
        data.coverageIntensity = coverageIntensity;
        data.glowIntensity = glowIntensity;
      }
      const accepted = await createTask.mutateAsync({ data });
      setActiveJobId(accepted.jobId);
    } catch (error) {
      const message = taskErrorMessage(error);
      setTaskError(message || 'The task could not start. Check the service configuration and try a clear JPEG or PNG face photo.');
    } finally {
      setPreparing(false);
    }
  }

  async function copyTaskSummary() {
    if (taskResult?.status !== 'success') return;
    const summary = [
      'BeautyLoop · beauty decision summary',
      `YouCam task: ${taskResult.feature}`,
      taskResult.skinColor ? `Returned skin color: ${taskResult.skinColor}${taskResult.skinColorName ? ` (${taskResult.skinColorName})` : ''}` : '',
      taskResult.insights.length ? `Provider observations: ${taskResult.insights.map((item) => `${item.type}${item.region ? ` (${item.region})` : ''}`).join('; ')}` : '',
      selectedFoundationShade ? `Sourced shade option: ${foundation?.brand} ${selectedFoundationShade.id} ${selectedFoundationShade.name} — preview color is an approximate screen illustration, not a retailer shade match` : '',
      !selectedFoundationShade && selectedSwatch ? `Illustrative demo tone: ${selectedSwatch} — not a retailer shade` : '',
      taskResult.previewUrl ? `Real YouCam preview: ${taskResult.previewUrl}` : '',
      'No diagnosis or treatment recommendation. BeautyLoop does not save the selfie or task result.',
    ].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(summary);
      setTaskCopyMessage('Task decision summary copied.');
    } catch {
      setTaskCopyMessage('Clipboard access is unavailable in this browser.');
    }
  }

  const skinToneResult = taskResult?.status === 'success' && taskResult.feature === 'skin-tone' && taskResult.skinColor ? taskResult : null;
  const closestShade = skinToneResult && foundation
    ? closestFoundationShade(skinToneResult.skinColor ?? '', foundation.shades)
    : null;
  const closestTone = skinToneResult ? closestDemoTone(skinToneResult.skinColor ?? '') : null;
  const skinAnalysisResult = taskResult?.status === 'success' && taskResult.feature === 'skin-analysis' ? taskResult : null;
  const previewResult = taskResult?.status === 'success' && taskResult.feature === 'foundation-try-on' && taskResult.previewUrl ? taskResult : null;

  return (
    <section className="youcam-section" aria-labelledby="youcam-title" data-testid="section-youcam-studio">
      <div className="section-heading">
        <div><div className="section-index">02 / COLOR & SKIN</div><h2 id="youcam-title">Your face, your call.</h2></div>
        <p>Use one selected YouCam task at a time. BeautyLoop shows real returned results only after the provider responds.</p>
      </div>
      <div className="provider-integrity" data-testid="status-provider-access">
        <span className={`provider-dot${accessConfirmed ? ' confirmed' : ''}`} />
        <span><strong>{accessConfirmed ? 'YouCam access confirmed' : 'Provider access not yet confirmed'}</strong>{' · '}A configured capability or API key is not proof of access; confirmation follows a successful task.</span>
      </div>
      <div className="youcam-layout">
        <div className="photo-column">
          <div className="photo-panel">
            <div className="panel-kicker">ONE PHOTO · THREE POSSIBLE TASKS</div>
            <h3>Start with a face photo</h3>
            <p className="panel-copy">Choose a clear, well-lit face photo. It stays in this page’s memory until you leave or remove it.</p>
            {photoUrl ? (
              <div className="photo-preview-wrap" data-testid="content-selected-selfie">
                <img className="selfie-preview" src={photoUrl} alt="Your selected face photo preview" />
                <button className="remove-photo" type="button" onClick={removePhoto} data-testid="button-remove-selfie">Remove photo</button>
              </div>
            ) : (
              <label className="photo-drop" htmlFor="face-photo-input" data-testid="dropzone-face-photo">
                <span className="upload-symbol"><ArrowUpRight size={18} /></span>
                <strong>Choose one face photo</strong>
                <span>JPEG or PNG · image is not sent on selection</span>
                <input id="face-photo-input" type="file" accept="image/jpeg,image/png" onChange={handleImageChange} data-testid="input-face-photo" />
              </label>
            )}
            {uploadError && <p className="inline-error" role="alert" data-testid="error-face-photo">{uploadError}</p>}
            {imageFile && (
              <label className="consent-check" data-testid="consent-face-photo">
                <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} data-testid="checkbox-face-photo-consent" />
                <span>I consent to send this photo to Perfect Corp for the specific task I choose below.</span>
              </label>
            )}
            <div className="privacy-note" data-testid="note-face-photo-privacy"><CircleHelp size={14} /><span>Selfies are sent to Perfect Corp only after you click a task action. BeautyLoop does not save your selfie or task results; they remain in memory for this visit.</span></div>
          </div>
          <div className="units-note" data-testid="note-youcam-units"><Sparkles size={14} /><span>Successful AI calls may consume YouCam units. <a href="https://yce.perfectcorp.com/ai-api/api-pricing" target="_blank" rel="noreferrer">Check published pricing</a>. One click starts one task.</span></div>
        </div>

        <div className="tasks-column">
          <div className="task-picker">
            <div className="task-picker-header">
              <div><div className="panel-kicker">CHOOSE ONE TASK</div><h3>What would you like to explore?</h3></div>
              <span className="task-mode-label">One at a time</span>
            </div>
            <div className="demo-tone-picker" data-testid="picker-demo-foundation-tone">
              <div className="demo-tone-label">Sourced foundation shade options <span>Approximate color chips · not official swatches</span></div>
              {foundation ? (
                <>
                  <div className="foundation-product-options" role="group" aria-label="Choose a foundation product">
                    {foundations.map((product) => (
                      <button
                        className={`foundation-product-option${foundation.id === product.id ? ' chosen' : ''}`}
                        type="button"
                        key={product.id}
                        onClick={() => {
                          setSelectedFoundationId(product.id);
                          setSelectedShadeId(null);
                          setSelectedSwatch(null);
                        }}
                        aria-pressed={foundation.id === product.id}
                        data-testid={`button-foundation-product-${product.id}`}
                      >
                        <strong>{product.name}</strong>
                        <small>{product.size} · ₹{product.priceINR.toLocaleString('en-IN')} reference price</small>
                      </button>
                    ))}
                  </div>
                  <div className="foundation-catalog-meta" data-testid="content-foundation-source-details">
                    <strong>{foundation.brand} · {foundation.name} · {foundation.size}</strong>
                    <span>₹{foundation.priceINR.toLocaleString('en-IN')} on {foundation.retailerSourceName} · MRP ₹{foundation.listPriceINR.toLocaleString('en-IN')} · price observed {new Date(foundation.priceObservedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <span>{foundation.priceNote}</span>
                    <span className="foundation-source-links">
                      Shade list: <a href={foundation.sourceUrl} target="_blank" rel="noreferrer">{foundation.sourceName} <ExternalLink size={10} /></a>
                      {' · '}Price & size: <a href={foundation.retailerSourceUrl} target="_blank" rel="noreferrer">{foundation.retailerSourceName} <ExternalLink size={10} /></a>
                    </span>
                  </div>
                  <div className="swatch-grid">
                    {foundation.shades.map((shade) => (
                      <button className={`tone-swatch${selectedShadeId === shade.id ? ' chosen' : ''}`} type="button" key={shade.id} onClick={() => { setSelectedShadeId(shade.id); setSelectedSwatch(null); }} data-testid={`button-foundation-shade-${shade.id}`} aria-pressed={selectedShadeId === shade.id}>
                        <span style={{ backgroundColor: shade.displayColorHex }} /><strong>{shade.name}</strong><small>{shade.id} · illustrative</small>
                      </button>
                    ))}
                  </div>
                  <p className="tone-picker-note">Shade names come from the manufacturer. The chip colors are BeautyLoop’s own screen approximations, not official calibrated swatches. Choose one for an illustrative YouCam preview; this cannot guarantee a product shade match. Skin-tone analysis is optional.</p>
                </>
              ) : foundationsQuery.isLoading ? (
                <p className="tone-picker-note" role="status" data-testid="loading-foundation-catalog">Loading sourced foundation shades…</p>
              ) : (
                <p className="tone-picker-note" role="alert" data-testid="error-foundation-catalog">Sourced foundation shade options are unavailable. Retry the catalog or choose an illustrative demo tone. <button type="button" onClick={() => foundationsQuery.refetch()} data-testid="button-retry-foundations">Retry shade catalog</button></p>
              )}
            </div>
            <div className="demo-tone-picker" data-testid="picker-illustrative-tone">
              <div className="demo-tone-label">Or use an illustrative tone <span>Not a retailer shade</span></div>
              <div className="swatch-grid">
                {demoToneSwatches.map((swatch) => (
                  <button className={`tone-swatch${selectedSwatch === swatch.hex ? ' chosen' : ''}`} type="button" key={swatch.hex} onClick={() => { setSelectedSwatch(swatch.hex); setSelectedShadeId(null); }} data-testid={`button-demo-tone-${swatch.name.toLowerCase()}`} aria-pressed={selectedSwatch === swatch.hex}>
                    <span style={{ backgroundColor: swatch.hex }} /><strong>{swatch.name}</strong><small>{swatch.hex}</small>
                  </button>
                ))}
              </div>
              <p className="tone-picker-note">These demo colors are separate from the sourced product shades. Either option sends only an approximate screen color to YouCam.</p>
            </div>
            <TaskAction feature="skin-tone" title="Skin-tone color analysis" description="Ask YouCam for a facial skin-color estimate, then compare it with approximate display colors for sourced foundation shade names." capability={statusLoading ? undefined : status?.skinTone} busy={taskBusy} readyToSend={Boolean(imageFile && consent)} onRun={runTask} testId="skin-tone" />
            <TaskAction feature="skin-analysis" title="Cosmetic skin insight" description="View provider-returned cosmetic observations. Informational only; not diagnosis or treatment advice." capability={statusLoading ? undefined : status?.skinAnalysis} busy={taskBusy} readyToSend={Boolean(imageFile && consent)} onRun={runTask} testId="skin-analysis" />
            <TaskAction feature="foundation-try-on" title="Foundation virtual try-on" description="Choose a sourced shade name or illustrative demo tone; YouCam uses only an approximate display color, not the product’s actual swatch." capability={statusLoading ? undefined : status?.virtualTryOn} busy={taskBusy} readyToSend={Boolean(imageFile && consent && selectedPreviewColor)} waitingLabel={!imageFile || !consent ? 'Add photo & consent' : 'Choose shade or tone'} onRun={runTask} testId="foundation-try-on" />
            {selectedFoundationShade && <div className="chosen-tone-note" data-testid="text-selected-foundation-tone"><span style={{ backgroundColor: selectedFoundationShade.displayColorHex }} /> Selected: {foundation?.brand} {selectedFoundationShade.id} {selectedFoundationShade.name} <code>approx. {selectedFoundationShade.displayColorHex}</code></div>}
            {selectedSwatch && <div className="chosen-tone-note" data-testid="text-selected-demo-tone"><span style={{ backgroundColor: selectedSwatch }} /> Selected illustrative demo tone <code>{selectedSwatch}</code></div>}
            {selectedPreviewColor && (
              <div className="intensity-controls" data-testid="controls-foundation-intensity">
                <p>Optional preview settings <span>Adjust before running the try-on</span></p>
                <IntensityControl label="Color" value={colorIntensity} onChange={setColorIntensity} testId="color" />
                <IntensityControl label="Coverage" value={coverageIntensity} onChange={setCoverageIntensity} testId="coverage" />
                <IntensityControl label="Glow" value={glowIntensity} onChange={setGlowIntensity} testId="glow" />
              </div>
            )}
            {!imageFile && <p className="task-hint" data-testid="hint-select-photo">Choose a photo and give consent before any task can be started.</p>}
            {imageFile && !consent && <p className="task-hint" data-testid="hint-consent-photo">Consent is required before sending your image for a task.</p>}
            {statusLoading && <p className="task-hint" data-testid="hint-checking-provider">Checking configured capability status…</p>}
            {!statusLoading && (!status || [status.skinTone, status.skinAnalysis, status.virtualTryOn].every((value) => value === 'not_configured')) && <p className="task-hint" data-testid="hint-provider-unavailable">No YouCam task is currently configured. Check back after the provider connection is set up.</p>}
          </div>
          {preparing && <div className="task-progress" role="status" data-testid="status-task-compressing"><span className="progress-pulse" />Preparing a smaller JPEG in this browser…</div>}
          {isRunning && <div className="task-progress" role="status" data-testid="status-task-running"><span className="progress-pulse" />{taskResult?.feature.replaceAll('-', ' ')} is processing. This can take a moment.</div>}
          {taskError && <div className="task-error" role="alert" data-testid="error-youcam-task"><strong>Task needs attention</strong><span>{taskError}</span><small>Check your connection, provider configuration and available units. Your image has not been saved by BeautyLoop.</small></div>}
          {taskQuery.isError && activeJobId && <div className="task-error" role="alert" data-testid="error-task-status"><strong>Couldn’t retrieve task status</strong><span>The task was submitted, but its progress could not be refreshed. Retry the task status from the task controls after checking the provider connection.</span><button type="button" onClick={() => taskQuery.refetch()} data-testid="button-retry-task-status">Retry task status</button></div>}
          {taskResult?.status === 'error' && <div className="task-error" role="alert" data-testid="error-task-result"><strong>The selected task didn’t complete</strong><span>{taskResult.errorMessage || 'The provider returned an error without more detail.'}</span><small>Try a clearer, front-facing image or check provider access and unit availability. No result has been invented.</small></div>}

          {skinToneResult && (
            <div className="result-panel" data-testid="result-skin-tone">
              <div className="result-panel-heading"><span className="result-overline">REAL YOUCAM RESULT</span><span className="result-job-id">Task {skinToneResult.jobId}</span></div>
              <h3>Returned skin color</h3>
              <div className="returned-color">
                <span className="returned-color-chip" style={{ backgroundColor: skinToneResult.skinColor ?? undefined }} />
                <span><strong>{skinToneResult.skinColorName || 'Skin color estimate'}</strong><code>{skinToneResult.skinColor}</code></span>
              </div>
              <p className="result-disclaimer">A provider-returned color estimate, not a retailer shade match. Lighting and image conditions can affect color.</p>
              {closestTone && (
                <div className="closest-tone-note" data-testid="text-closest-foundation-shade">
                  <span style={{ backgroundColor: closestTone.hex }} />
                  <span>Closest illustrative demo tone by CIE76: <strong>{closestTone.name}</strong> <code>{closestTone.hex}</code>. This is an approximate color comparison, not a retailer shade match.</span>
                  <button type="button" onClick={() => { setSelectedSwatch(closestTone.hex); setSelectedShadeId(null); }} data-testid="button-use-closest-demo-tone">{selectedSwatch === closestTone.hex ? 'Selected' : 'Use tone'}</button>
                </div>
              )}
              {closestShade && (
                <div className="closest-tone-note" data-testid="text-closest-demo-tone">
                  <span style={{ backgroundColor: closestShade.shade.displayColorHex }} />
                  <span>Closest approximate display color in the {foundation?.brand} shade list by CIE76: <strong>{closestShade.shade.id} {closestShade.shade.name}</strong> <code>{closestShade.shade.displayColorHex}</code>. This is a screen-color comparison only—not an official swatch, product match, or guarantee.</span>
                  <button type="button" onClick={() => { setSelectedShadeId(closestShade.shade.id); setSelectedSwatch(null); }} data-testid={`button-use-closest-shade-${closestShade.shade.id}`}>{selectedShadeId === closestShade.shade.id ? 'Selected' : 'Use color'}</button>
                </div>
              )}
              {!closestTone && !closestShade && (
                <p className="result-disclaimer">The returned color is not a six-digit hex value, so BeautyLoop can’t compare it with the approximate foundation shade colors.</p>
              )}
            </div>
          )}

          {taskResult?.status === 'success' && taskResult.feature === 'skin-tone' && !taskResult.skinColor && (
            <div className="task-hint" data-testid="empty-skin-tone-result">The task completed, but the provider returned no skin-color value to compare.</div>
          )}

          {skinAnalysisResult && (
            <div className="result-panel" data-testid="result-skin-analysis">
              <div className="result-panel-heading"><span className="result-overline">REAL YOUCAM RESULT</span><span className="result-job-id">Task {skinAnalysisResult.jobId}</span></div>
              <h3>Cosmetic skin insight</h3>
              <p className="result-disclaimer">These are observations returned by the provider, not a medical diagnosis or treatment recommendation.</p>
              {skinAnalysisResult.insights.length ? (
                <div className="insight-list">
                  {skinAnalysisResult.insights.map((insight, index) => (
                    <div className="insight-item" key={`${insight.type}-${insight.region}-${index}`} data-testid={`content-skin-insight-${index}`}>
                      <strong>{insight.type.replaceAll('_', ' ')}</strong>
                      <span>{insight.region ? `Region: ${insight.region}` : 'Region not specified'}</span>
                      {insight.displayScore !== null && <span>Reported display score: {insight.displayScore}</span>}
                      {insight.displayScore === null && insight.score !== null && <span>Reported score: {insight.score}</span>}
                    </div>
                  ))}
                </div>
              ) : <div className="task-hint" data-testid="empty-skin-insights">The provider returned no insight items for this task.</div>}
            </div>
          )}

          {previewResult && (
            <div className="result-panel" data-testid="result-foundation-preview">
              <div className="result-panel-heading"><span className="result-overline">REAL YOUCAM PREVIEW</span><span className="result-job-id">Task {previewResult.jobId}</span></div>
              <h3>Your live foundation preview</h3>
              <p className="result-disclaimer">Rendered by YouCam using BeautyLoop’s approximate screen color for the selected sourced shade name. It is not the manufacturer’s actual swatch, product formula, or a retailer shade match.</p>
              <div className="real-preview-frame"><img src={previewResult.previewUrl ?? ''} alt="Foundation try-on preview returned by YouCam" data-testid="img-youcam-preview" /></div>
            </div>
          )}

          {taskResult?.status === 'success' && taskResult.feature === 'foundation-try-on' && !taskResult.previewUrl && (
            <div className="task-hint" data-testid="empty-preview-result">The task completed, but the provider returned no preview image.</div>
          )}

          {taskResult?.status === 'success' && (
            <div className="task-summary-actions">
              <button className="copy-task-summary" type="button" onClick={copyTaskSummary} data-testid="button-copy-task-summary"><Copy size={13} /> Copy task decision summary</button>
              {taskCopyMessage && <span role="status" data-testid="status-copy-task-summary">{taskCopyMessage}</span>}
            </div>
          )}

          {!taskResult && !taskQuery.isError && (
            <div className="task-empty" data-testid="empty-youcam-results">
              <span className="task-empty-mark"><ScanFace size={19} /></span>
              <span><strong>No YouCam results yet</strong><small>Results and any preview appear here only after a real task succeeds.</small></span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TaskAction({ feature, title, description, capability, busy, readyToSend, waitingLabel, onRun, testId }: { feature: BeautyTaskFeature; title: string; description: string; capability?: string; busy: boolean; readyToSend: boolean; waitingLabel?: string; onRun: (feature: BeautyTaskFeature) => void; testId: string }) {
  const configured = capability === 'ready';
  const isUnavailable = capability === 'not_configured';
  const label = busy ? 'Working…' : !configured ? isUnavailable ? 'Not configured' : 'Checking status' : !readyToSend ? waitingLabel ?? 'Add photo & consent' : 'Run task';
  return (
    <article className={`task-action${configured ? ' task-action-ready' : ''}`} data-testid={`task-action-${testId}`}>
      <div className="task-action-copy"><div className="task-action-title">{title}<span className={`task-capability ${configured ? 'configured' : ''}`}>{isUnavailable ? 'Not configured' : configured ? 'Configured · unverified' : 'Checking'}</span></div><p>{description}</p></div>
      <button type="button" className="task-run-button" disabled={busy || !configured || !readyToSend} onClick={() => onRun(feature)} data-testid={`button-run-${testId}`}>{label}<ArrowRight size={13} /></button>
    </article>
  );
}

function IntensityControl({ label, value, onChange, testId }: { label: string; value: number; onChange: (value: number) => void; testId: string }) {
  return (
    <label className="intensity-control" data-testid={`control-intensity-${testId}`}>
      <span>{label}<strong>{value}</strong></span>
      <input type="range" min="0" max="100" value={value} onChange={(event) => onChange(Number(event.target.value))} data-testid={`input-intensity-${testId}`} />
    </label>
  );
}

function StatusTile({ icon, title, value, description }: { icon: ReactNode; title: string; value: string; description: string }) {
  const isUnavailable = value === 'not_configured';
  return (
    <div className="availability-item" data-testid={`status-tile-${title.toLowerCase().replaceAll(' ', '-')}`}>
      <span className={`status-icon${isUnavailable ? ' off' : ''}`}>{icon}</span>
      <div>
        <div className="status-title">{title} <span className="results-count" style={{ marginLeft: 5 }}>{value.replaceAll('_', ' ')}</span></div>
        <div className="status-sub">{description}</div>
      </div>
    </div>
  );
}

function ProductCard({ product, selected, onSelect, matchReasons, unconfirmed }: { product: BeautyProduct; selected: boolean; onSelect: () => void; matchReasons?: string[]; unconfirmed?: string[] }) {
  const initial = product.brand.trim().slice(0, 1).toLocaleUpperCase();
  const observedAt = product.priceObservedAt ? new Date(product.priceObservedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'date not provided';
  return (
    <article className={`product-card${selected ? ' selected' : ''}`} data-testid={`card-product-${product.id}`}>
      <div className="product-top">
        <div><div className="product-monogram" aria-hidden="true">{initial}</div><div className="product-category">{product.category}</div></div>
        <div className="product-price">₹{product.priceINR.toLocaleString('en-IN')}</div>
      </div>
      <h4>{product.name}</h4>
      <div className="product-brand">{product.brand}{product.size ? ` · ${product.size}` : ''}</div>
      <div className="ingredient-line">
        <strong>Key ingredients</strong><br />
        {product.keyIngredients?.length ? product.keyIngredients.join(' · ') : 'Not listed in the available source details.'}
      </div>
      <div className="attribute-row" aria-label="Published product attributes">
        {product.verifiedAttributes.map((attribute) => <span key={attribute} className="attribute">{attribute.replaceAll('_', ' ')}</span>)}
        {product.unknownAttributes.map((attribute) => <span key={attribute} className="attribute unknown">Unconfirmed: {attribute.replaceAll('_', ' ')}</span>)}
        {!product.verifiedAttributes.length && !product.unknownAttributes.length && <span className="attribute unknown">No attributes listed</span>}
      </div>
      {matchReasons?.length ? <div className="ingredient-line" data-testid={`text-match-reasons-${product.id}`}><strong>Why it matched</strong><br />{matchReasons.join(' · ')}</div> : null}
      {unconfirmed?.length ? <div className="ingredient-line" data-testid={`text-unconfirmed-${product.id}`}><strong>Still unconfirmed</strong><br />{unconfirmed.map((preference) => preferenceLabels[preference as keyof typeof preferenceLabels] ?? preference.replaceAll('_', ' ')).join(' · ')}</div> : null}
      <div className="product-bottom">
        <a className="source-link" href={product.sourceUrl} target="_blank" rel="noreferrer" data-testid={`link-source-${product.id}`} aria-label={`View source ${product.sourceName} for ${product.name}`}>{product.sourceName} · price observed {observedAt} <ExternalLink size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /></a>
        <button className="choose-button" type="button" onClick={onSelect} data-testid={`button-select-product-${product.id}`}>{selected ? <><Check size={13} /> Selected</> : <>Choose <ArrowRight size={12} /></>}</button>
      </div>
      <div style={{ marginTop: 9 }}><a className="source-link" href={product.productUrl} target="_blank" rel="noreferrer" data-testid={`link-product-${product.id}`}>Visit product details <ArrowUpRight size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /></a></div>
    </article>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
