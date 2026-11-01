import { useEffect, useState } from 'react';
import { Bot, ShieldCheck, Sparkles, Sun, Moon, ArrowRight, CheckCircle2, AlertTriangle, Layers, ChevronDown, Info } from 'lucide-react';
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
  resilienceTier?: string;
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

function AnimatedVitalityGauge({ score, tier }: { score: number; tier?: string }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1200; // ms
    const startVal = 0;
    const targetVal = score;

    function step(timestamp: number) {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutCubic curve
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(startVal + (targetVal - startVal) * ease));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [score]);

  const color = score >= 80 ? '#387c53' : score >= 65 ? '#c28336' : '#b85c48';
  const bgRing = score >= 80 ? '#dbece0' : score >= 65 ? '#f5e8d3' : '#f5ded8';
  const tierLabel = tier || (score >= 80 ? 'Optimal Barrier' : score >= 65 ? 'Balanced Barrier' : 'Hydration Focus');

  // SVG circular stroke calculation
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * displayScore) / 100;

  return (
    <div
      className="vitality-gauge interactive"
      style={{
        margin: 0,
        padding: '12px 18px',
        cursor: 'pointer',
        position: 'relative',
        background: '#f8f5ee',
        border: '1px solid #dfd7c5',
        borderRadius: 16,
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
      onClick={() => setShowDetails(!showDetails)}
      title="Click to view biomarker calculation breakdown"
    >
      <div style={{ position: 'relative', width: 56, height: 56, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="28"
            cy="28"
            r={radius}
            stroke={bgRing}
            strokeWidth="5"
            fill="transparent"
          />
          <circle
            cx="28"
            cy="28"
            r={radius}
            stroke={color}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.4s ease' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            font: '700 15px var(--app-font-serif)',
            color: '#253d33',
            pointerEvents: 'none',
          }}
        >
          {displayScore}
          <span style={{ font: '8px var(--app-font-mono)', color: '#778278', marginTop: -2 }}>
            /100
          </span>
        </div>
      </div>

      <div className="vitality-info" style={{ minWidth: 130 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <strong style={{ fontSize: 11.5, color: '#253d33', margin: 0 }}>Skin Vitality Index</strong>
          <span
            style={{
              display: 'inline-block',
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 6px ${color}88`,
            }}
          />
        </div>
        <p style={{ fontSize: 9.5, color: '#55695e', margin: '3px 0 1px', fontWeight: 600 }}>
          {tierLabel}
        </p>
        <span style={{ fontSize: 8.5, color: '#978577', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 2 }}>
          {showDetails ? 'Hide breakdown ▴' : 'Click breakdown ▾'}
        </span>
      </div>

      {showDetails && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: '#ffffff',
            border: '1px solid #dcd4c3',
            borderRadius: 12,
            padding: '12px 14px',
            boxShadow: '0 8px 24px rgba(35,56,44,0.12)',
            zIndex: 40,
            width: 250,
            fontSize: 10,
            color: '#34453b',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <strong style={{ display: 'block', marginBottom: 6, color: '#1f3429', fontSize: 11 }}>
            Biomarker Resilience Synthesis
          </strong>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>Hydration & Radiance</span>
            <span style={{ color: '#2f7a4e', fontWeight: 600 }}>+ Positive Factor</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>Sebum, Pores & Texture</span>
            <span style={{ color: '#b26839', fontWeight: 600 }}>- Regulated Factor</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ede8de', paddingTop: 6, marginTop: 6 }}>
            <strong>Calculated Score</strong>
            <strong style={{ color, fontSize: 11 }}>{score} / 100</strong>
          </div>
        </div>
      )}
    </div>
  );
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

    const currentTask = taskResult;

    async function fetchConsult() {
      setLoading(true);
      try {
        const res = await fetch('/api/beauty/consult', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            skinTone: {
              skinColor: currentTask.skinColor,
              skinColorName: currentTask.skinColorName,
              undertone: currentTask.undertone,
              lipColor: currentTask.lipColor,
            },
            insights: currentTask.insights,
            vitalityScore: currentTask.vitalityScore,
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

        <AnimatedVitalityGauge score={data.vitalityScore} tier={data.resilienceTier} />
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
