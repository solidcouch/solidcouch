import { Button } from '@/components'
import { IconLoading } from '@/components/IconLoading'
import { withToast } from '@/components/withToast'
import { useConfig } from '@/config/hooks'
import { useReadEmailVerificationSetup } from '@/hooks/data/emailNotifications'
import { AccessMode, QueryKey } from '@/hooks/data/types'
import { useCheckNotificationsQuery } from '@/hooks/data/useCheckSetup'
import {
  useInitEmailNotifications,
  usePreparePodForDirectEmailNotifications,
  useSendVerificationEmail,
} from '@/hooks/data/useSetupHospex'
import { useAuth } from '@/hooks/useAuth'
import { Trans, useLingui } from '@lingui/react/macro'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FaCheck } from 'react-icons/fa'
import { StepProps } from './HospexSetup'
import { SetupStatusKey } from './types'
import { useToastError } from './useToastError'

export const Step2 = ({
  onSuccess,
  isEmailNotifications,
  isSimpleEmailNotifications,
  hospexDocument,
  inbox,
}: StepProps & {
  [SetupStatusKey.isEmailNotifications]: boolean | 'unset' | 'unverified'
  [SetupStatusKey.isSimpleEmailNotifications]: boolean | 'unset'
  hospexDocument?: string
  inbox?: string
}) => {
  if (isSimpleEmailNotifications !== 'unset')
    return (
      <DirectEmailNotifications
        onSuccess={onSuccess}
        isEmailNotifications={isSimpleEmailNotifications}
        hospexDocument={hospexDocument}
      />
    )

  if (isEmailNotifications !== 'unset')
    return (
      <WebhookEmailNotifications
        onSuccess={onSuccess}
        isEmailNotifications={isEmailNotifications}
        inbox={inbox}
      />
    )

  return <NoEmailNotifications onSuccess={onSuccess} />
}

const DirectEmailNotifications = ({
  onSuccess,
  isEmailNotifications,
  hospexDocument,
}: StepProps & {
  isEmailNotifications: boolean
  hospexDocument?: string
}) => {
  const { handleSubmit, register } = useForm<{ email: string }>()
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [sentToEmail, setSentToEmail] = useState<string>()
  const [countdown, setCountdown] = useState(0)
  const preparePod = usePreparePodForDirectEmailNotifications()
  const sendVerificationEmailMutation = useSendVerificationEmail()
  const { webId } = useAuth()
  const { t } = useLingui()
  const { emailNotificationsIdentity, emailNotificationsService } = useConfig()

  const { results } = useReadEmailVerificationSetup()
  const isNotificationsInitialized = results.some(
    result =>
      result.url &&
      result.permissions.acls[0]?.accesses?.some(
        value =>
          value.agents.includes(emailNotificationsIdentity) &&
          (value.modes.includes(AccessMode.Write) ||
            value.modes.includes(AccessMode.Append)) &&
          value.modes.includes(AccessMode.Read),
      ),
  )

  const checkQuery = useCheckNotificationsQuery(
    webId!,
    emailNotificationsService,
  )

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer) // Cleanup timer
    }
  }, [countdown])

  const handleFormSubmit = handleSubmit(async ({ email }) => {
    setSending(true)

    try {
      if (!hospexDocument) throw new Error(t`No hospex document for community`)
      if (!isEmailNotifications) {
        if (!isNotificationsInitialized)
          await preparePod({ hospexDocument, webId: webId!, email })

        await sendVerificationEmailMutation.mutateAsync({ email })

        setSent(true)
        setCountdown(60)
        setSentToEmail(email)
      }
    } finally {
      setSending(false)
    }
  })

  const queryClient = useQueryClient()

  const handleFinish = () => {
    queryClient.invalidateQueries({
      queryKey: [QueryKey.simpleMailerIntegration],
    })
  }

  const toastError = useToastError()

  const handleFormSubmitWithInfo: typeof handleFormSubmit = useCallback(
    async (...props) =>
      await withToast(handleFormSubmit(...props), {
        pending: t`Preparing and sending verification email`,
        success: t`Verification email sent`,
        error: toastError,
      }),
    [handleFormSubmit, t, toastError],
  )

  if (isEmailNotifications)
    return (
      <div>
        <FaCheck />
        <Trans>Your email notifications are set up.</Trans>
        <Button primary onClick={onSuccess}>
          <Trans>Finish Setup</Trans>
        </Button>
      </div>
    )

  return (
    <form onSubmit={handleFormSubmitWithInfo}>
      {!isEmailNotifications && (
        <div>
          <div>
            <Trans>Enter your email address:</Trans>{' '}
            <input
              required
              placeholder={t`email address`}
              {...register('email')}
              type="email"
              disabled={sent}
            />
            <Button type="submit" secondary disabled={sending || countdown > 0}>
              {countdown > 0 ? (
                <Trans>Resend Confirmation Email in {countdown}s</Trans>
              ) : (
                <Trans>Send Confirmation Email</Trans>
              )}
            </Button>
          </div>
          {sent && !sending && (
            <div>
              <Trans>
                A confirmation email has been sent to {sentToEmail}.<br />
                Please check your inbox (and spam folder) and follow the
                instructions.
              </Trans>
            </div>
          )}
        </div>
      )}
      <Button
        type="button"
        primary
        disabled={!sent || checkQuery.isRefetching}
        onClick={handleFinish}
      >
        <Trans>Finish Setup</Trans> {checkQuery.isRefetching && <IconLoading />}
      </Button>
    </form>
  )
}

/**
 * TODO improve the UX of this, if we are going to keep it as an option
 */
const WebhookEmailNotifications = ({
  onSuccess,
  isEmailNotifications,
  inbox,
}: StepProps & {
  isEmailNotifications: boolean | 'unverified'
  inbox?: string
}) => {
  const { t } = useLingui()
  const initEmailNotifications = useInitEmailNotifications()
  const { handleSubmit, register } = useForm<{ email: string }>()
  const { webId } = useAuth()

  const queryClient = useQueryClient()
  const handleFinish = () => {
    queryClient.invalidateQueries({ queryKey: [QueryKey.mailerIntegration] })
  }

  const handleFormSubmit = handleSubmit(async ({ email }) => {
    if (!inbox) throw new Error(t`Inbox is not set up`)

    await initEmailNotifications({
      email,
      webId: webId!,
      inbox,
    })
  })

  const toastError = useToastError()

  const handleFormSubmitWithInfo: typeof handleFormSubmit = useCallback(
    async (...props) =>
      await withToast(handleFormSubmit(...props), {
        pending: t`Preparing and sending verification email`,
        success: t`Verification email sent`,
        error: toastError,
      }),
    [handleFormSubmit, t, toastError],
  )

  if (isEmailNotifications === true)
    return (
      <div>
        <FaCheck />
        <Trans>Your email notifications are set up.</Trans>
        <Button primary onClick={onSuccess}>
          <Trans>Finish Setup</Trans>
        </Button>
      </div>
    )

  return (
    <form onSubmit={handleFormSubmitWithInfo}>
      {!isEmailNotifications && (
        <div>
          <Trans>Setup email notifications</Trans>{' '}
          <input
            type="email"
            placeholder={t`Your email`}
            {...register('email')}
            required
          />
          <Button type="submit" primary>
            <Trans>Send Confirmation Email</Trans>
          </Button>
        </div>
      )}
      {isEmailNotifications === 'unverified' && (
        <div>
          <Trans>Please verify your email</Trans>
          <Button type="button" primary onClick={handleFinish}>
            <Trans>Finish Setup</Trans>
          </Button>
        </div>
      )}
    </form>
  )
}

const NoEmailNotifications = ({ onSuccess }: StepProps) => (
  <div>
    <FaCheck />{' '}
    <Trans>Email notifications are not available for this community.</Trans>
    <div>
      <Button primary onClick={onSuccess}>
        <Trans>Finish Setup</Trans>
      </Button>
    </div>
  </div>
)
