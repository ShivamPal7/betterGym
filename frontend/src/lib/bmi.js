// BMI calculation, categorization, and healthy weight range utilities.
import { t } from './i18n-core.js'

export const LB_PER_KG = 2.2046226218
export const CM_PER_INCH = 2.54

/**
 * Calculates Body Mass Index (BMI).
 * @param {number} weight - Weight in kg or lb (specified by unit)
 * @param {number} heightCm - Height in centimeters
 * @param {'kg'|'lb'} unit - Weight unit ('kg' or 'lb')
 * @returns {number|null} BMI rounded to 1 decimal place, or null if invalid inputs
 */
export function calculateBMI(weight, heightCm, unit = 'kg') {
  const w = Number(weight)
  const h = Number(heightCm)
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null

  const weightKg = unit === 'lb' ? w / LB_PER_KG : w
  const heightM = h / 100
  if (heightM <= 0) return null

  const bmi = weightKg / (heightM * heightM)
  if (!Number.isFinite(bmi) || bmi <= 0) return null

  return Math.round(bmi * 10) / 10
}

/**
 * Returns category info for a given BMI value according to WHO standards.
 * @param {number} bmi
 * @returns {{ key: string, label: string, color: string, badgeBg: string }}
 */
export function getBMICategory(bmi) {
  const v = Number(bmi)
  if (!Number.isFinite(v) || v <= 0) {
    return { key: 'unknown', label: t('Unknown'), color: 'var(--label-3)', badgeBg: 'var(--surface-2)' }
  }

  if (v < 18.5) {
    return {
      key: 'underweight',
      label: t('Underweight'),
      color: 'var(--blue, #3b82f6)',
      badgeBg: 'color-mix(in srgb, var(--blue, #3b82f6) 16%, transparent)'
    }
  }
  if (v < 25.0) {
    return {
      key: 'normal',
      label: t('Normal weight'),
      color: 'var(--green, #22c55e)',
      badgeBg: 'color-mix(in srgb, var(--green, #22c55e) 16%, transparent)'
    }
  }
  if (v < 30.0) {
    return {
      key: 'overweight',
      label: t('Overweight'),
      color: 'var(--orange, #f59e0b)',
      badgeBg: 'color-mix(in srgb, var(--orange, #f59e0b) 16%, transparent)'
    }
  }
  return {
    key: 'obese',
    label: t('Obese'),
    color: 'var(--red, #ef4444)',
    badgeBg: 'color-mix(in srgb, var(--red, #ef4444) 16%, transparent)'
  }
}

/**
 * Returns the healthy weight range (BMI 18.5 - 24.9) for a given height.
 * @param {number} heightCm - Height in centimeters
 * @param {'kg'|'lb'} unit - Target unit ('kg' or 'lb')
 * @returns {{ min: number, max: number, unit: string } | null}
 */
export function getHealthyWeightRange(heightCm, unit = 'kg') {
  const h = Number(heightCm)
  if (!Number.isFinite(h) || h <= 0) return null

  const heightM = h / 100
  const minKg = 18.5 * heightM * heightM
  const maxKg = 24.9 * heightM * heightM

  if (unit === 'lb') {
    return {
      min: Math.round(minKg * LB_PER_KG * 10) / 10,
      max: Math.round(maxKg * LB_PER_KG * 10) / 10,
      unit: 'lb'
    }
  }

  return {
    min: Math.round(minKg * 10) / 10,
    max: Math.round(maxKg * 10) / 10,
    unit: 'kg'
  }
}

/**
 * Converts feet and inches to centimeters.
 * @param {number} feet
 * @param {number} inches
 * @returns {number} Height in centimeters
 */
export function heightToCm(feet, inches = 0) {
  const f = Math.max(0, Number(feet) || 0)
  const i = Math.max(0, Number(inches) || 0)
  const totalInches = f * 12 + i
  return Math.round(totalInches * CM_PER_INCH)
}

/**
 * Converts centimeters to feet and inches.
 * @param {number} cm
 * @returns {{ feet: number, inches: number }}
 */
export function cmToFeetInches(cm) {
  const c = Math.max(0, Number(cm) || 0)
  const totalInches = Math.round(c / CM_PER_INCH)
  const feet = Math.floor(totalInches / 12)
  const inches = totalInches % 12
  return { feet, inches }
}
