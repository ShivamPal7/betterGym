import React from 'react'
import { calculateBMI, getBMICategory, getHealthyWeightRange, heightToCm, cmToFeetInches } from '../lib/bmi.js'
import { t } from '../lib/i18n.js'
import Icon from './Icon.jsx'

/**
 * Reusable, visual BMI Calculator and health spectrum meter.
 *
 * @param {Object} props
 * @param {number} props.weight - Current weight in specified unit
 * @param {number} props.heightCm - Height in centimeters
 * @param {'kg'|'lb'} [props.unit='kg'] - Weight unit
 * @param {boolean} [props.interactive=false] - Whether to show interactive adjustment controls
 * @param {(w: number) => void} [props.onWeightChange] - Callback when weight changes
 * @param {(h: number) => void} [props.onHeightChange] - Callback when height changes
 */
export default function BmiCalculator({
  weight,
  heightCm,
  unit = 'kg',
  interactive = false,
  onWeightChange,
  onHeightChange
}) {
  const bmi = calculateBMI(weight, heightCm, unit)
  const category = getBMICategory(bmi)
  const range = getHealthyWeightRange(heightCm, unit)

  // Clamp BMI position on a scale from 14 to 38 for the visual meter needle (0% to 100%)
  const meterMin = 14
  const meterMax = 38
  const clampedBmi = bmi ? Math.min(meterMax, Math.max(meterMin, bmi)) : meterMin
  const needlePercent = Math.round(((clampedBmi - meterMin) / (meterMax - meterMin)) * 100)

  return (
    <div className="bmi-card">
      <div className="bmi-header">
        <div className="bmi-badge-wrap">
          <span className="lrow-i" style={{ background: category.badgeBg, color: category.color }}>
            <Icon name="heart" />
          </span>
          <div>
            <div className="lbl2">{t('Body Mass Index')}</div>
            <div className="row" style={{ gap: 8, alignItems: 'baseline' }}>
              <span className="bmi-score" style={{ color: category.color }}>
                {bmi ? bmi.toFixed(1) : '—'}
              </span>
              <span className="bmi-tag" style={{ color: category.color, background: category.badgeBg }}>
                {category.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual BMI Meter Spectrum */}
      <div className="bmi-meter-container">
        <div className="bmi-track">
          <div className="bmi-zone bmi-zone-under" title={t('Underweight (<18.5)')} />
          <div className="bmi-zone bmi-zone-normal" title={t('Normal (18.5–24.9)')} />
          <div className="bmi-zone bmi-zone-over" title={t('Overweight (25–29.9)')} />
          <div className="bmi-zone bmi-zone-obese" title={t('Obese (≥30)')} />
        </div>

        {bmi != null && (
          <div className="bmi-needle" style={{ left: `${needlePercent}%` }} aria-label={t('Current BMI: {0}', bmi)}>
            <div className="bmi-needle-point" style={{ borderBottomColor: category.color }} />
            <div className="bmi-needle-line" style={{ backgroundColor: category.color }} />
          </div>
        )}

        <div className="bmi-scale-labels">
          <span>18.5</span>
          <span>25.0</span>
          <span>30.0</span>
        </div>
      </div>

      {/* Healthy Weight Guidance */}
      {range && (
        <div className="bmi-guidance">
          <div className="row" style={{ gap: 6, alignItems: 'center' }}>
            <Icon name="target" style={{ fontSize: 14, color: 'var(--acc)' }} />
            <span className="small muted">
              {t('Healthy weight range for your height ({0} cm):', heightCm)}{' '}
              <strong style={{ color: 'var(--label)' }}>
                {range.min} – {range.max} {unit}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* Optional Interactive Tweaking Steppers */}
      {interactive && (
        <div className="bmi-interactive-controls">
          <div className="bmi-control-group">
            <span className="lbl2">{t('Adjust Weight ({0})', unit)}</span>
            <div className="row" style={{ gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                className="iconbtn"
                onClick={() => onWeightChange && onWeightChange(Math.max(20, Math.round((Number(weight) - 0.5) * 10) / 10))}
                aria-label={t('Decrease weight')}
              >
                <Icon name="minus" />
              </button>
              <input
                type="number"
                step="0.5"
                min="20"
                max="300"
                className="input"
                style={{ width: 80, textAlign: 'center', fontWeight: 600 }}
                value={weight || ''}
                onChange={e => onWeightChange && onWeightChange(parseFloat(e.target.value) || 0)}
              />
              <button
                type="button"
                className="iconbtn"
                onClick={() => onWeightChange && onWeightChange(Math.min(300, Math.round((Number(weight) + 0.5) * 10) / 10))}
                aria-label={t('Increase weight')}
              >
                <Icon name="plus" />
              </button>
            </div>
          </div>

          <div className="bmi-control-group">
            <span className="lbl2">{t('Adjust Height (cm)')}</span>
            <div className="row" style={{ gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                className="iconbtn"
                onClick={() => onHeightChange && onHeightChange(Math.max(100, (Number(heightCm) || 170) - 1))}
                aria-label={t('Decrease height')}
              >
                <Icon name="minus" />
              </button>
              <input
                type="number"
                step="1"
                min="100"
                max="250"
                className="input"
                style={{ width: 80, textAlign: 'center', fontWeight: 600 }}
                value={heightCm || ''}
                onChange={e => onHeightChange && onHeightChange(parseInt(e.target.value, 10) || 0)}
              />
              <button
                type="button"
                className="iconbtn"
                onClick={() => onHeightChange && onHeightChange(Math.min(250, (Number(heightCm) || 170) + 1))}
                aria-label={t('Increase height')}
              >
                <Icon name="plus" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bmi-context-note">
        <Icon name="info" style={{ fontSize: 13, flex: 'none', color: 'var(--label-3)' }} />
        <span>
          {t('BMI provides a baseline health metric. For strength athletes with higher muscle mass, BMI may read higher while body composition remains optimal.')}
        </span>
      </div>
    </div>
  )
}
