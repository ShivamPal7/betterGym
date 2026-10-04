import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import { lastBW } from '../lib/history.js'
import { calculateBMI, getBMICategory, heightToCm, cmToFeetInches } from '../lib/bmi.js'
import Icon from '../components/Icon.jsx'
import { Button, Segmented } from '../components/ui.jsx'
import BmiCalculator from '../components/BmiCalculator.jsx'
import '../onboarding.css'

const GOALS = [
  { id: 'muscle', title: t('Build Muscle'), desc: t('Focus on progressive volume and hypertrophy.'), icon: 'arm' },
  { id: 'fatloss', title: t('Lose Fat & Lean Out'), desc: t('Maintain lean muscle while lowering body fat.'), icon: 'flame' },
  { id: 'strength', title: t('Build Strength'), desc: t('Heavy compound movements and strength progression.'), icon: 'barbell' },
  { id: 'general', title: t('General Fitness'), desc: t('Balanced workouts for functional health and energy.'), icon: 'heart' },
  { id: 'endurance', title: t('Stamina & Endurance'), desc: t('Higher reps, shorter rests, and conditioning.'), icon: 'figureRun' }
]

const LEVELS = [
  { id: 'beginner', title: t('Beginner'), desc: t('New to lifting or under 6 months. Focus on learning proper form.'), icon: 'sparkles' },
  { id: 'intermediate', title: t('Intermediate'), desc: t('6 months to 2 years consistent training. Ready for structured splits.'), icon: 'trophy' },
  { id: 'advanced', title: t('Advanced'), desc: t('2+ years dedicated lifting with consistent progressive overload.'), icon: 'flame' }
]

const DAYS_OF_WEEK = [
  { index: 1, label: t('Mon') },
  { index: 2, label: t('Tue') },
  { index: 3, label: t('Wed') },
  { index: 4, label: t('Thu') },
  { index: 5, label: t('Fri') },
  { index: 6, label: t('Sat') },
  { index: 0, label: t('Sun') }
]

const DURATIONS = [30, 45, 60, 75, 90]

export default function Onboarding() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const editing = params.get('edit') === '1'

  const S = useStore(s => s.S)
  const completeOnboarding = useStore(s => s.completeOnboarding)
  const toast = useUI(s => s.toast)

  const existingProfile = S.profile || {}
  const latestWeight = lastBW(S)?.w || (S.unit === 'lb' ? 155 : 70)

  // Initialize form state
  const [unit, setUnit] = useState(existingProfile.unit || S.unit || 'kg')
  const [sex, setSex] = useState(existingProfile.sex || S.body || 'male')
  const [goal, setGoal] = useState(existingProfile.goal || 'muscle')
  const [level, setLevel] = useState(existingProfile.level || 'beginner')

  // Body stats
  const [age, setAge] = useState(existingProfile.age || 26)
  const [heightCm, setHeightCm] = useState(existingProfile.height || 175)
  const initialImperial = cmToFeetInches(existingProfile.height || 175)
  const [feet, setFeet] = useState(initialImperial.feet)
  const [inches, setInches] = useState(initialImperial.inches)

  const [weight, setWeight] = useState(existingProfile.weight || latestWeight)
  const [targetWeight, setTargetWeight] = useState(existingProfile.targetWeight || S.targetW || '')

  // Schedule
  const [daysPerWeek, setDaysPerWeek] = useState(existingProfile.daysPerWeek || 3)
  const [preferredDays, setPreferredDays] = useState(existingProfile.preferredDays || [1, 3, 5])
  const [sessionMin, setSessionMin] = useState(existingProfile.sessionMin || 60)

  // Plan recommendation
  const [applyPlan, setApplyPlan] = useState(true)

  // Multi-step navigation
  const STEPS = ['welcome', 'goal', 'level', 'body', 'schedule', 'plan']
  const [stepIndex, setStepIndex] = useState(0)

  const currentStep = STEPS[stepIndex]
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === STEPS.length - 1

  // Handle Height changes
  const handleMetricHeightChange = val => {
    const clamped = Math.max(100, Math.min(250, val))
    setHeightCm(clamped)
    const imp = cmToFeetInches(clamped)
    setFeet(imp.feet)
    setInches(imp.inches)
  }

  const handleFeetChange = f => {
    const newF = Math.max(3, Math.min(7, f))
    setFeet(newF)
    setHeightCm(heightToCm(newF, inches))
  }

  const handleInchesChange = i => {
    const newI = Math.max(0, Math.min(11, i))
    setInches(newI)
    setHeightCm(heightToCm(feet, newI))
  }

  // Handle Day chip selection
  const togglePreferredDay = dayIdx => {
    if (preferredDays.includes(dayIdx)) {
      if (preferredDays.length > 1) {
        setPreferredDays(preferredDays.filter(d => d !== dayIdx))
      }
    } else {
      setPreferredDays([...preferredDays, dayIdx].sort())
    }
  }

  // Determine Recommended Starter Plan
  const getRecommendedPlan = () => {
    if (goal === 'strength' && daysPerWeek === 3) {
      return {
        id: '5x5',
        name: t('5×5 Strength Routine'),
        days: 3,
        desc: t('Focus on the five main compound lifts: Squat, Bench, Deadlift, Overhead Press, and Barbell Row.')
      }
    }
    if (daysPerWeek <= 3 || level === 'beginner') {
      return {
        id: 'full-body',
        name: t('Full Body (3 Days/Week)'),
        days: 3,
        desc: t('Hit every major muscle group 3 times a week with balanced compound and accessory exercises.')
      }
    }
    if (daysPerWeek === 4) {
      return {
        id: 'upper-lower',
        name: t('Upper / Lower Split (4 Days/Week)'),
        days: 4,
        desc: t('Train upper body twice and lower body twice for optimal recovery and hypertrophy.')
      }
    }
    return {
      id: 'ppl',
      name: t('Push / Pull / Legs (PPL)'),
      days: 3,
      desc: t('Separate pressing muscles, pulling muscles, and legs for maximum focus and volume.')
    }
  }

  const recommended = getRecommendedPlan()
  const bmiVal = calculateBMI(weight, heightCm, unit)
  const bmiCategory = getBMICategory(bmiVal)

  // Navigation handlers
  const goNext = () => {
    if (!isLastStep) {
      setStepIndex(stepIndex + 1)
      window.scrollTo(0, 0)
    } else {
      finish()
    }
  }

  const goBack = () => {
    if (!isFirstStep) {
      setStepIndex(stepIndex - 1)
      window.scrollTo(0, 0)
    } else if (editing) {
      nav(-1)
    }
  }

  const skip = () => {
    completeOnboarding(
      {
        unit,
        sex,
        goal,
        level,
        age,
        height: heightCm,
        weight: Number(weight),
        targetWeight: targetWeight ? Number(targetWeight) : null,
        daysPerWeek,
        preferredDays,
        sessionMin,
        bmi: bmiVal,
        bmiCategory: bmiCategory.key,
        updatedAt: new Date().toISOString()
      },
      null
    )
    toast(t('Preferences saved'))
    nav('/home', { replace: true })
  }

  const finish = () => {
    const profile = {
      unit,
      sex,
      goal,
      level,
      age: Number(age),
      height: Number(heightCm),
      weight: Number(weight),
      targetWeight: targetWeight ? Number(targetWeight) : null,
      daysPerWeek: Number(daysPerWeek),
      preferredDays,
      sessionMin: Number(sessionMin),
      bmi: bmiVal,
      bmiCategory: bmiCategory.key,
      updatedAt: new Date().toISOString()
    }

    const planToLoad = applyPlan && !editing ? recommended.id : null
    completeOnboarding(profile, planToLoad)

    toast(editing ? t('Profile updated') : t('Welcome! Your training plan is ready.'))
    nav('/home', { replace: true })
  }

  return (
    <div className="narrow onboarding-screen">
      {/* Top Bar with Navigation and Continuous Progress Indicator */}
      <div className="onboarding-top">
        {!isFirstStep ? (
          <button className="iconbtn" onClick={goBack} aria-label={t('Back')}>
            <Icon name="chevronLeft" />
          </button>
        ) : (
          <div style={{ width: 36 }} />
        )}

        <div className="onboarding-progress">
          <div
            className="onboarding-progress-bar"
            style={{ width: `${Math.round(((stepIndex + 1) / STEPS.length) * 100)}%` }}
          />
        </div>

        {!editing ? (
          <button className="iconbtn ob-skip" onClick={skip} aria-label={t('Skip onboarding')}>
            {t('Skip')}
          </button>
        ) : (
          <button className="iconbtn" onClick={() => nav(-1)} aria-label={t('Close')}>
            <Icon name="xmark" />
          </button>
        )}
      </div>

      <div className="onboarding-body">
        {/* ================= STEP 1: WELCOME & UNITS ================= */}
        {currentStep === 'welcome' && (
          <div>
            <div className="onboarding-eyebrow">{t('Step 1 of 6 · Getting Started')}</div>
            <h1 className="onboarding-title">{t('Welcome to betterGym')}</h1>
            <p className="onboarding-subtitle">
              {t('A private, self-hosted workout tracker you own. Let’s personalize your experience.')}
            </p>

            <div className="stat-box">
              <div className="stat-label">{t('Preferred Units')}</div>
              <Segmented
                options={[
                  { value: 'kg', label: t('Metric (kg, cm)') },
                  { value: 'lb', label: t('Imperial (lb, ft)') }
                ]}
                value={unit}
                onChange={setUnit}
              />
            </div>

            <div className="stat-box" style={{ marginTop: 14 }}>
              <div className="stat-label">{t('Biological Sex')}</div>
              <div className="muted small" style={{ marginBottom: 10 }}>
                {t('Used for bodyweight baselines and muscle balance templates.')}
              </div>
              <Segmented
                options={[
                  { value: 'male', label: t('Male'), icon: 'person' },
                  { value: 'female', label: t('Female'), icon: 'person' }
                ]}
                value={sex}
                onChange={setSex}
              />
            </div>
          </div>
        )}

        {/* ================= STEP 2: FITNESS GOAL ================= */}
        {currentStep === 'goal' && (
          <div>
            <div className="onboarding-eyebrow">{t('Step 2 of 6 · Primary Goal')}</div>
            <h1 className="onboarding-title">{t('What is your main focus?')}</h1>
            <p className="onboarding-subtitle">
              {t('We will tailor your routine structure and volume targets to support your goal.')}
            </p>

            <div className="onboarding-cards">
              {GOALS.map(g => {
                const selected = goal === g.id
                return (
                  <div
                    key={g.id}
                    className={`onboarding-card ${selected ? 'selected' : ''}`}
                    onClick={() => setGoal(g.id)}
                  >
                    <div className="card-icon">
                      <Icon name={g.icon} />
                    </div>
                    <div className="card-content">
                      <div className="card-title">{g.title}</div>
                      <div className="card-desc">{g.desc}</div>
                    </div>
                    <div className="card-check">
                      <Icon name="check" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ================= STEP 3: EXPERIENCE LEVEL ================= */}
        {currentStep === 'level' && (
          <div>
            <div className="onboarding-eyebrow">{t('Step 3 of 6 · Experience')}</div>
            <h1 className="onboarding-title">{t('What is your lifting experience?')}</h1>
            <p className="onboarding-subtitle">
              {t('Helps select the right progression rules, warm-up sets, and exercise complexity.')}
            </p>

            <div className="onboarding-cards">
              {LEVELS.map(lvl => {
                const selected = level === lvl.id
                return (
                  <div
                    key={lvl.id}
                    className={`onboarding-card ${selected ? 'selected' : ''}`}
                    onClick={() => setLevel(lvl.id)}
                  >
                    <div className="card-icon">
                      <Icon name={lvl.icon} />
                    </div>
                    <div className="card-content">
                      <div className="card-title">{lvl.title}</div>
                      <div className="card-desc">{lvl.desc}</div>
                    </div>
                    <div className="card-check">
                      <Icon name="check" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ================= STEP 4: BODY STATS & BMI CALCULATOR ================= */}
        {currentStep === 'body' && (
          <div>
            <div className="onboarding-eyebrow">{t('Step 4 of 6 · Body & BMI')}</div>
            <h1 className="onboarding-title">{t('Your Body Metrics & BMI')}</h1>
            <p className="onboarding-subtitle">
              {t('Enter your measurements to calculate your Body Mass Index (BMI) and establish your starting weight curve.')}
            </p>

            {/* Height input */}
            <div className="stat-box">
              <div className="stat-label">{t('Height')}</div>
              {unit === 'kg' ? (
                <div>
                  <div className="stat-value-display">
                    <span className="stat-huge">{heightCm}</span>
                    <span className="stat-unit">cm</span>
                  </div>
                  <div className="stepper-bar">
                    <button className="stepper-btn" onClick={() => handleMetricHeightChange(heightCm - 1)}>
                      <Icon name="minus" />
                    </button>
                    <input
                      type="range"
                      min="120"
                      max="220"
                      value={heightCm}
                      onChange={e => handleMetricHeightChange(Number(e.target.value))}
                      style={{ flex: 1, margin: '0 10px' }}
                    />
                    <button className="stepper-btn" onClick={() => handleMetricHeightChange(heightCm + 1)}>
                      <Icon name="plus" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="stat-value-display">
                    <span className="stat-huge">{feet}</span>
                    <span className="stat-unit">ft</span>
                    <span className="stat-huge" style={{ marginInlineStart: 12 }}>{inches}</span>
                    <span className="stat-unit">in</span>
                  </div>
                  <div className="row" style={{ gap: 14, justifyContent: 'center', marginTop: 10 }}>
                    <div className="row" style={{ gap: 6, alignItems: 'center' }}>
                      <button className="stepper-btn" onClick={() => handleFeetChange(feet - 1)}><Icon name="minus" /></button>
                      <span style={{ fontWeight: 600, width: 30, textAlign: 'center' }}>{feet} ft</span>
                      <button className="stepper-btn" onClick={() => handleFeetChange(feet + 1)}><Icon name="plus" /></button>
                    </div>
                    <div className="row" style={{ gap: 6, alignItems: 'center' }}>
                      <button className="stepper-btn" onClick={() => handleInchesChange(inches - 1)}><Icon name="minus" /></button>
                      <span style={{ fontWeight: 600, width: 30, textAlign: 'center' }}>{inches} in</span>
                      <button className="stepper-btn" onClick={() => handleInchesChange(inches + 1)}><Icon name="plus" /></button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Current Body Weight */}
            <div className="stat-box">
              <div className="stat-label">{t('Current Body Weight')}</div>
              <div className="stat-value-display">
                <span className="stat-huge">{Number(weight).toFixed(1)}</span>
                <span className="stat-unit">{unit}</span>
              </div>
              <div className="stepper-bar">
                <button
                  className="stepper-btn"
                  onClick={() => setWeight(w => Math.max(25, Math.round((Number(w) - 0.5) * 10) / 10))}
                >
                  <Icon name="minus" />
                </button>
                <button
                  className="stepper-btn"
                  onClick={() => setWeight(w => Math.min(300, Math.round((Number(w) + 0.5) * 10) / 10))}
                >
                  <Icon name="plus" />
                </button>
              </div>
            </div>

            {/* Live Interactive BMI Calculator Component */}
            <BmiCalculator weight={Number(weight)} heightCm={heightCm} unit={unit} />

            {/* Optional Target Goal Weight */}
            <div className="stat-box" style={{ marginTop: 14 }}>
              <div className="stat-label">{t('Target Goal Weight (Optional)')}</div>
              <div className="row" style={{ gap: 10, alignItems: 'center', marginTop: 6 }}>
                <input
                  type="number"
                  step="0.5"
                  className="input"
                  placeholder={t('e.g. {0} {1}', unit === 'kg' ? '68' : '150', unit)}
                  value={targetWeight}
                  onChange={e => setTargetWeight(e.target.value)}
                  style={{ flex: 1, fontSize: 18, fontWeight: 600 }}
                />
                <span className="muted">{unit}</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 5: SCHEDULE & FREQUENCY ================= */}
        {currentStep === 'schedule' && (
          <div>
            <div className="onboarding-eyebrow">{t('Step 5 of 6 · Schedule')}</div>
            <h1 className="onboarding-title">{t('Plan your weekly training')}</h1>
            <p className="onboarding-subtitle">
              {t('Consistency is key. Pick how often and which days you want to train.')}
            </p>

            <div className="stat-box">
              <div className="stat-label">{t('Workouts Per Week')}</div>
              <div className="stat-value-display">
                <span className="stat-huge">{daysPerWeek}</span>
                <span className="stat-unit">{t('days')}</span>
              </div>
              <Segmented
                options={[
                  { value: 2, label: '2' },
                  { value: 3, label: '3' },
                  { value: 4, label: '4' },
                  { value: 5, label: '5' },
                  { value: 6, label: '6' }
                ]}
                value={daysPerWeek}
                onChange={setDaysPerWeek}
              />
            </div>

            <div className="stat-box" style={{ marginTop: 14 }}>
              <div className="stat-label">{t('Preferred Training Days')}</div>
              <div className="day-selector-grid">
                {DAYS_OF_WEEK.map(d => {
                  const active = preferredDays.includes(d.index)
                  return (
                    <button
                      key={d.index}
                      type="button"
                      className={`day-chip ${active ? 'active' : ''}`}
                      onClick={() => togglePreferredDay(d.index)}
                    >
                      <span>{d.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="stat-box" style={{ marginTop: 14 }}>
              <div className="stat-label">{t('Target Session Duration')}</div>
              <div className="stat-value-display">
                <span className="stat-huge">{sessionMin}</span>
                <span className="stat-unit">{t('minutes')}</span>
              </div>
              <Segmented
                options={DURATIONS.map(m => ({ value: m, label: `${m}m` }))}
                value={sessionMin}
                onChange={setSessionMin}
              />
            </div>
          </div>
        )}

        {/* ================= STEP 6: RECOMMENDED PLAN & SUMMARY ================= */}
        {currentStep === 'plan' && (
          <div>
            <div className="onboarding-eyebrow">{t('Step 6 of 6 · Recommended Plan')}</div>
            <h1 className="onboarding-title">{t('Your Personalized Plan')}</h1>
            <p className="onboarding-subtitle">
              {t('Based on your goal ({0}) and {1} days/week schedule, here is your recommended routine:', GOALS.find(g => g.id === goal)?.title, daysPerWeek)}
            </p>

            {/* Recommended Plan Card */}
            <div
              className={`onboarding-card ${applyPlan ? 'selected' : ''}`}
              style={{ padding: '20px 18px', marginBottom: 16 }}
              onClick={() => setApplyPlan(!applyPlan)}
            >
              <div className="card-icon" style={{ width: 44, height: 44, fontSize: 24 }}>
                <Icon name="sparkles" />
              </div>
              <div className="card-content">
                <div className="card-title" style={{ fontSize: 19 }}>{recommended.name}</div>
                <div className="card-desc" style={{ marginTop: 4 }}>{recommended.desc}</div>
                <div className="row" style={{ gap: 8, marginTop: 10 }}>
                  <span className="tag acc">{t('{0} days per week', recommended.days)}</span>
                  <span className="tag">{GOALS.find(g => g.id === goal)?.title}</span>
                </div>
              </div>
              <div className="card-check">
                <Icon name="check" />
              </div>
            </div>

            {/* Plan Confirmation Toggle */}
            <div className="card" style={{ marginBottom: 16, background: 'var(--surface-2)' }}>
              <label className="row between" style={{ cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{t('Automatically load this starter plan')}</div>
                  <div className="muted small" style={{ marginTop: 2 }}>
                    {t('Schedules routines into your calendar so you can begin training immediately.')}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={applyPlan}
                  onChange={e => setApplyPlan(e.target.checked)}
                  style={{ width: 20, height: 20, accentColor: 'var(--acc)' }}
                />
              </label>
            </div>

            {/* Profile Overview Summary Card */}
            <div className="stat-box">
              <div className="stat-label">{t('Profile Summary')}</div>
              <div className="list">
                <div className="row between" style={{ padding: '8px 0', borderBottom: '1px solid var(--surface-3)' }}>
                  <span className="muted">{t('BMI')}</span>
                  <span className="row" style={{ gap: 6, fontWeight: 600 }}>
                    <span>{bmiVal ? bmiVal.toFixed(1) : '—'}</span>
                    <span className="bmi-tag" style={{ color: bmiCategory.color, background: bmiCategory.badgeBg }}>
                      {bmiCategory.label}
                    </span>
                  </span>
                </div>
                <div className="row between" style={{ padding: '8px 0', borderBottom: '1px solid var(--surface-3)' }}>
                  <span className="muted">{t('Starting Weight')}</span>
                  <span style={{ fontWeight: 600 }}>{weight} {unit}</span>
                </div>
                {targetWeight ? (
                  <div className="row between" style={{ padding: '8px 0', borderBottom: '1px solid var(--surface-3)' }}>
                    <span className="muted">{t('Target Weight')}</span>
                    <span style={{ fontWeight: 600, color: 'var(--yellow)' }}>{targetWeight} {unit}</span>
                  </div>
                ) : null}
                <div className="row between" style={{ padding: '8px 0' }}>
                  <span className="muted">{t('Frequency')}</span>
                  <span style={{ fontWeight: 600 }}>{daysPerWeek} {t('days / week')} ({sessionMin}m)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Buttons */}
      <div className="onboarding-foot">
        {!isFirstStep && (
          <Button variant="ghost" onClick={goBack} style={{ flex: 1 }}>
            {t('Back')}
          </Button>
        )}
        <Button
          variant="primary"
          onClick={goNext}
          style={{ flex: isFirstStep ? 1 : 2 }}
          icon={isLastStep ? 'sparkles' : undefined}
          trailingIcon={!isLastStep ? 'chevronRight' : undefined}
        >
          {isLastStep ? (editing ? t('Save Profile') : t('Complete Setup & Start')) : t('Continue')}
        </Button>
      </div>
    </div>
  )
}
