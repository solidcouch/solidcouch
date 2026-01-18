import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import * as uiSlice from '@/redux/uiSlice'
import { Trans, useLingui } from '@lingui/react/macro'
import { ReactNode, useEffect, useMemo } from 'react'
import { FaTimes } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router'
import { Button } from '../Button/Button'
import styles from './Onboarding.module.scss'

const useOnboardingConfig = (): OnboardingStep[] => {
  const { t } = useLingui()

  return useMemo(
    (): OnboardingStep[] => [
      {
        // eslint-disable-next-line lingui/no-unlocalized-strings
        url: '/profile/edit',
        description: t`Introduce yourself — it builds trust`,
      },
      {
        // eslint-disable-next-line lingui/no-unlocalized-strings
        url: '/host/offers',
        description: t`Welcome travellers to your home — if you can`,
      },
      {
        // eslint-disable-next-line lingui/no-unlocalized-strings
        url: '/travel/search',
        description: t`Find people to stay with`,
      },
    ],
    [t],
  )
}

interface OnboardingStep {
  url: string
  description: ReactNode
}

export const Onboarding = () => {
  const { t } = useLingui()
  const steps = useOnboardingConfig()
  const dispatch = useAppDispatch()
  const step = useAppSelector(state => state.ui.onboarding)
  const navigate = useNavigate()

  const handleSkip = () => {
    dispatch(uiSlice.actions.setOnboarding(Infinity))
  }
  const handleFinish = handleSkip

  const handleNext = () => {
    dispatch(uiSlice.actions.setOnboardingNext())
  }

  const stepConfig = useMemo(() => steps[step], [step, steps])

  const url = stepConfig?.url

  useEffect(() => {
    if (url) navigate(url)
  }, [navigate, url])

  if (!stepConfig) return null

  const isLastStep = step === steps.length - 1

  return (
    <aside
      aria-label={t`Getting started`}
      className={styles.onboarding}
      data-testid={`onboarding-panel`}
    >
      <Button aria-label={t`Skip getting started`} onClick={handleSkip}>
        <FaTimes aria-hidden="true" />
      </Button>
      <p>
        <Link to={stepConfig.url}>{stepConfig.description}</Link>
      </p>
      {isLastStep ? (
        <Button onClick={handleFinish} primary>
          <Trans>Finish</Trans>
        </Button>
      ) : (
        <Button onClick={handleNext} primary>
          <Trans>Next</Trans>
        </Button>
      )}
    </aside>
  )
}
