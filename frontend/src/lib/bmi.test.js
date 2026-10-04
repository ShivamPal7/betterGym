import { describe, it, expect } from 'vitest'
import {
  calculateBMI,
  getBMICategory,
  getHealthyWeightRange,
  heightToCm,
  cmToFeetInches
} from './bmi.js'

describe('calculateBMI', () => {
  it('calculates BMI correctly for metric values', () => {
    // 70 kg, 175 cm => 70 / (1.75^2) = 22.857... => 22.9
    expect(calculateBMI(70, 175, 'kg')).toBe(22.9)
    // 80 kg, 180 cm => 80 / (1.8^2) = 24.69... => 24.7
    expect(calculateBMI(80, 180, 'kg')).toBe(24.7)
  })

  it('calculates BMI correctly for imperial values', () => {
    // 154.32 lb (approx 70 kg), 175 cm => ~22.9
    expect(calculateBMI(154.32, 175, 'lb')).toBe(22.9)
  })

  it('returns null for invalid or non-positive inputs', () => {
    expect(calculateBMI(0, 175)).toBeNull()
    expect(calculateBMI(-50, 175)).toBeNull()
    expect(calculateBMI(70, 0)).toBeNull()
    expect(calculateBMI('abc', 175)).toBeNull()
    expect(calculateBMI(null, 175)).toBeNull()
  })
})

describe('getBMICategory', () => {
  it('categorizes BMI correctly', () => {
    expect(getBMICategory(17.5).key).toBe('underweight')
    expect(getBMICategory(18.5).key).toBe('normal')
    expect(getBMICategory(22.4).key).toBe('normal')
    expect(getBMICategory(24.9).key).toBe('normal')
    expect(getBMICategory(25.0).key).toBe('overweight')
    expect(getBMICategory(29.9).key).toBe('overweight')
    expect(getBMICategory(30.0).key).toBe('obese')
    expect(getBMICategory(35.2).key).toBe('obese')
  })

  it('handles invalid BMI values safely', () => {
    expect(getBMICategory(null).key).toBe('unknown')
    expect(getBMICategory(0).key).toBe('unknown')
  })
})

describe('getHealthyWeightRange', () => {
  it('computes healthy weight range in kg', () => {
    const range = getHealthyWeightRange(180, 'kg')
    expect(range).not.toBeNull()
    // 18.5 * 1.8^2 = 59.94 => 59.9
    expect(range.min).toBe(59.9)
    // 24.9 * 1.8^2 = 80.676 => 80.7
    expect(range.max).toBe(80.7)
    expect(range.unit).toBe('kg')
  })

  it('computes healthy weight range in lb', () => {
    const range = getHealthyWeightRange(180, 'lb')
    expect(range).not.toBeNull()
    expect(range.unit).toBe('lb')
    expect(range.min).toBeGreaterThan(130)
    expect(range.max).toBeLessThan(185)
  })

  it('returns null for invalid height', () => {
    expect(getHealthyWeightRange(0)).toBeNull()
    expect(getHealthyWeightRange(-10)).toBeNull()
  })
})

describe('height conversions', () => {
  it('converts feet and inches to cm', () => {
    // 5 feet 10 inches = 70 inches * 2.54 = 177.8 => 178 cm
    expect(heightToCm(5, 10)).toBe(178)
    expect(heightToCm(6, 0)).toBe(183)
  })

  it('converts cm to feet and inches', () => {
    expect(cmToFeetInches(178)).toEqual({ feet: 5, inches: 10 })
    expect(cmToFeetInches(183)).toEqual({ feet: 6, inches: 0 })
  })
})
