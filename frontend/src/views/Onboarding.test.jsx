// @vitest-environment happy-dom
import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { useStore } from '../store/useStore.js'
import Onboarding from './Onboarding.jsx'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams()]
}))

let host, root
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  mockNavigate.mockClear()
  useStore.setState(s => ({
    S: {
      ...s.S,
      unit: 'kg',
      body: 'male',
      bodyweight: [],
      routines: [],
      week: {},
      onboarded: false,
      profile: null
    },
    user: null
  }))
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

describe('Onboarding component', () => {
  it('renders Step 1 (Welcome & Preferences) initially', () => {
    act(() => root.render(<Onboarding />))
    expect(host.textContent).toContain('Welcome to betterGym')
    expect(host.textContent).toContain('Step 1 of 6')
    expect(host.textContent).toContain('Metric (kg, cm)')
    expect(host.textContent).toContain('Imperial (lb, ft)')
  })

  it('navigates from Welcome through Goal to Level', () => {
    act(() => root.render(<Onboarding />))

    // Click Continue to go to Step 2
    const continueBtn = [...host.querySelectorAll('button')].find(b => b.textContent?.includes('Continue'))
    expect(continueBtn).toBeTruthy()
    act(() => { continueBtn.click() })

    // Step 2: Goal
    expect(host.textContent).toContain('Step 2 of 6')
    expect(host.textContent).toContain('What is your main focus?')
    expect(host.textContent).toContain('Build Muscle')

    // Click Continue to go to Step 3
    act(() => { continueBtn.click() })

    // Step 3: Level
    expect(host.textContent).toContain('Step 3 of 6')
    expect(host.textContent).toContain('What is your lifting experience?')
    expect(host.textContent).toContain('Beginner')
  })

  it('navigates to Step 4 and displays the live BMI Calculator', () => {
    act(() => root.render(<Onboarding />))
    const continueBtn = [...host.querySelectorAll('button')].find(b => b.textContent?.includes('Continue'))

    // Step 1 -> Step 2 -> Step 3 -> Step 4
    act(() => { continueBtn.click() })
    act(() => { continueBtn.click() })
    act(() => { continueBtn.click() })

    expect(host.textContent).toContain('Step 4 of 6')
    expect(host.textContent).toContain('Your Body Metrics & BMI')
    expect(host.textContent).toContain('Body Mass Index')
    expect(host.textContent).toContain('Normal weight')
    expect(host.textContent).toContain('Healthy weight range')
  })

  it('allows skipping onboarding and updates store', () => {
    act(() => root.render(<Onboarding />))
    const skipBtn = [...host.querySelectorAll('button')].find(b => b.textContent?.includes('Skip'))
    expect(skipBtn).toBeTruthy()

    act(() => { skipBtn.click() })

    const state = useStore.getState().S
    expect(state.onboarded).toBe(true)
    expect(state.profile).not.toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true })
  })

  it('completes the full onboarding flow and saves starter plan', () => {
    act(() => root.render(<Onboarding />))
    const continueBtn = () => [...host.querySelectorAll('button')].find(b =>
      b.textContent?.includes('Continue') || b.textContent?.includes('Complete Setup')
    )

    // Step 1 -> 2 -> 3 -> 4 -> 5 -> 6
    act(() => { continueBtn().click() })
    act(() => { continueBtn().click() })
    act(() => { continueBtn().click() })
    act(() => { continueBtn().click() })
    act(() => { continueBtn().click() })

    // Step 6: Recommended Plan & Summary
    expect(host.textContent).toContain('Step 6 of 6')
    expect(host.textContent).toContain('Your Personalized Plan')
    expect(host.textContent).toContain('Full Body')

    // Complete setup
    act(() => { continueBtn().click() })

    const state = useStore.getState().S
    expect(state.onboarded).toBe(true)
    expect(state.profile.goal).toBe('muscle')
    expect(state.profile.level).toBe('beginner')
    expect(state.routines.length).toBeGreaterThan(0) // Starter plan was applied
    expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true })
  })
})
