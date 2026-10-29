import { useEffect, useState } from 'react';
import { Bot, ShieldCheck, Sparkles, Sun, Moon, ArrowRight, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import type { BeautyTaskResult, BeautyProduct } from '@workspace/api-client-react';

interface RoutineStep {
  step: string;
  category: string;
  product: BeautyProduct;
  reason: string;
}

interface ConsultData {
  summary: string;
  skinTypeDetected: string;
  primaryConcerns: string[];
  vitalityScore: number;
  amRoutine: RoutineStep[];
  pmRoutine: RoutineStep[];
  suggestedShadePairing: {
    undertone: string;
    foundation: {
      brand: string;
      shadeId: string;
      name: string;
      displayColorHex: string;
    };
    lipstick: {
      brand: string;
      name: string;
      hex: string;
      family: string;
    };
    whyHarmonious: string;
  };
  safetyNotes: string[];
}

interface AgenticDermBlueprintProps {
  taskResult: BeautyTaskResult | null;
  onSelectProduct: (product: BeautyProduct) => void;
  onApplyShadePairing?: (foundationHex: string, lipHex: string) => void;
}

export function AgenticDermBlueprint({
  taskResult,
  onSelectProduct,
  onApplyShadePairing,
}: AgenticDermBlueprintProps) {
  const [data, setData] = useState<ConsultData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!taskResult || taskResult.status !== 'success') {
      setData(null);
      return;
    }

    async function fetchConsult() {
      setLoading(true);
      try {
        const res = await fetch('/api/beauty/consult', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            skinTone: {
              skinColor: taskResult.skinColor,
              skinColorName: taskResult.skinColorName,
              undertone: taskResult.undertone,
              lipColor: taskResult.lipColor,
            },
            insights: taskResult.insights,
            vitalityScore: taskResult.vitalityScore,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to generate agent consult:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchConsult();
  }, [taskResult]);

  if (!taskResult || taskResult.status !== 'success') {
    return null;
  }

  if (loading) {
    return (
      <section className="derm-blueprint-section" aria-label="Loading Derm Blueprint">
        <div style={{ textAlign: 'center', padding: '30px 0', color: '#66786c' }}>
          <Bot size={32} style={{ margin: '0 auto 12px', animation: 'spin 2s linear infinite' }} />
          <h3 style={{ fontFamily: 'var(--app-font-serif)', fontSize: 20 }}>
            Synthesizing Autonomous Dermatological Blueprint…
          </h3>
          <p style={{ fontSize: 12 }}>
            Mapping 10 YouCam biomarkers against clinical formulation matrices and verified catalog science.
          </p>
        </div>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="derm-blueprint-section" aria-labelledby="agent-title">
      <div className="derm-blueprint-header">
        <div>
          <div className="agent-pill">
            <Bot size={13} /> BeautyLoop Agentic Derm Concierge
          </div>
          <h2 id="agent-title">Your Clinical Biomarker Blueprint</h2>
          <p style={{ color: '#68776e', fontSize: 12, margin: '6px 0 0', maxWidth: 640 }}>
            {data.summary}
          </p>
        </div>
        <div className="vitality-gauge" style={{ margin: 0, padding: '12px 18px' }}>
          <div
            className="vitality-score-circle"
            style={{ ['--pct' as any]: `${data.vitalityScore}%`, width: 54, height: 54 }}
          >
            <div className="vitality-score-inner" style={{ width: 42, height: 42, fontSize: 14 }}>
              {data.vitalityScore}
              <span>Index</span>
            </div>
          </div>
          <div className="vitality-info">
            <strong style={{ fontSize: 11 }}>Skin Vitality Score</strong>
            <p style={{ fontSize: 9 }}>Biomarker resilience baseline</p>
          </div>
        </div>
      </div>

      {/* Primary Diagnostic Concerns */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0 20px' }}>
        <span style={{ font: '9px var(--app-font-mono)', textTransform: 'uppercase', letterSpacing: '.08em', color: '#826051', alignSelf: 'center' }}>
          Biometric Findings:
        </span>
        {data.primaryConcerns.map((concern, idx) => (
          <span
            key={idx}
            style={{
              background: '#f2eae0',
              border: '1px solid #dfd1c3',
              borderRadius: 999,
              padding: '4px 10px',
              fontSize: 10,
              color: '#4e5e54',
            }}
          >
            {concern}
          </span>
        ))}
      </div>

      {/* AM / PM Dual Regimen Grid */}
      <div className="regimen-grid">
        {/* Morning Regimen */}
        <div className="regimen-card">
          <div className="regimen-card-header">
            <span className="regimen-time">
              <Sun size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Morning Protocol (Defense & Barrier)
            </span>
          </div>
          <div className="regimen-steps">
            {data.amRoutine.map((item, idx) => (
              <div key={idx} className="regimen-step-item">
                <span className="regimen-step-num">{idx + 1}</span>
                <div className="regimen-step-details" style={{ flex: 1 }}>
                  <strong>{item.step}</strong>
                  <p>{item.reason}</p>
                  <button
                    onClick={() => onSelectProduct(item.product)}
                    className="regimen-product-badge"
                    style={{ border: 0, cursor: 'pointer', textAlign: 'left' }}
                    title="Inspect product receipts"
                  >
                    {item.product.brand} · {item.product.name} (₹{item.product.priceINR.toLocaleString('en-IN')}) <ArrowRight size={9} style={{ display: 'inline' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evening Regimen */}
        <div className="regimen-card">
          <div className="regimen-card-header">
            <span className="regimen-time" style={{ color: '#566e60' }}>
              <Moon size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Evening Protocol (Nocturnal Cellular Repair)
            </span>
          </div>
          <div className="regimen-steps">
            {data.pmRoutine.map((item, idx) => (
              <div key={idx} className="regimen-step-item">
                <span className="regimen-step-num" style={{ background: '#e0e7df', color: '#385343' }}>
                  {idx + 1}
                </span>
                <div className="regimen-step-details" style={{ flex: 1 }}>
                  <strong>{item.step}</strong>
                  <p>{item.reason}</p>
                  <button
                    onClick={() => onSelectProduct(item.product)}
                    className="regimen-product-badge"
                    style={{ border: 0, cursor: 'pointer', textAlign: 'left', background: '#e3ece1', color: '#2b4f39' }}
                    title="Inspect product receipts"
                  >
                    {item.product.brand} · {item.product.name} (₹{item.product.priceINR.toLocaleString('en-IN')}) <ArrowRight size={9} style={{ display: 'inline' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Harmonious Shade Pairing Box */}
      {data.suggestedShadePairing && (
        <div className="shade-pairing-box">
          <div>
            <div style={{ font: '9px var(--app-font-mono)', textTransform: 'uppercase', letterSpacing: '.1em', color: '#90614f' }}>
              Colorimetry Synergy · {data.suggestedShadePairing.undertone.toUpperCase()} Undertone
            </div>
            <strong style={{ display: 'block', fontSize: 13, color: '#31443a', margin: '4px 0 2px' }}>
              Harmonized Complexion & Lip Pairing
            </strong>
            <p style={{ fontSize: 11, color: '#68776f', margin: 0, maxWidth: 520, lineHeight: 1.5 }}>
              {data.suggestedShadePairing.whyHarmonious}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="shade-pairing-swatches">
              <div className="shade-chip-combo">
                <div
                  className="shade-circle-swatch"
                  style={{ background: data.suggestedShadePairing.foundation.displayColorHex }}
                  title={`Foundation: ${data.suggestedShadePairing.foundation.name}`}
                />
                <span style={{ fontSize: 10, color: '#45574c' }}>
                  {data.suggestedShadePairing.foundation.shadeId} {data.suggestedShadePairing.foundation.name}
                </span>
              </div>
              <div className="shade-chip-combo">
                <div
                  className="shade-circle-swatch"
                  style={{ background: data.suggestedShadePairing.lipstick.hex }}
                  title={`Lipstick: ${data.suggestedShadePairing.lipstick.name}`}
                />
                <span style={{ fontSize: 10, color: '#45574c' }}>
                  {data.suggestedShadePairing.lipstick.family}
                </span>
              </div>
            </div>

            {onApplyShadePairing && (
              <button
                className="button-primary"
                style={{ fontSize: 11, padding: '9px 15px' }}
                onClick={() =>
                  onApplyShadePairing(
                    data.suggestedShadePairing.foundation.displayColorHex,
                    data.suggestedShadePairing.lipstick.hex,
                  )
                }
              >
                <Sparkles size={13} /> Try Harmonious Look VTO
              </button>
            )}
          </div>
        </div>
      )}

      {/* Safety & Schedule Separation */}
      <div className="safety-alert-strip">
        <ShieldCheck size={16} style={{ flex: '0 0 auto', color: '#4e755b' }} />
        <div>
          <strong>Verified Formulation Safety:</strong>{' '}
          {data.safetyNotes[0]}
        </div>
      </div>
    </section>
  );
}
