import { Button } from '@/components'
import { IconLoading } from '@/components/IconLoading'
import { useConfig } from '@/config/hooks'
import { useReadEmailVerificationSetup } from '@/hooks/data/emailNotifications'
import { useCheckNotificationsQuery } from '@/hooks/data/useCheckSetup'
import {
  useInitEmailNotifications,
  usePreparePodForDirectEmailNotifications,
  useVerifyEmail,
} from '@/hooks/data/useSetupHospex'
import { useAuth } from '@/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FaCheck } from 'react-icons/fa'
import { StepProps } from './HospexSetup'

export const Step2 = ({
  onSuccess,
  isEmailNotifications,
  isSimpleEmailNotifications,
  hospexDocument,
  inbox,
}: StepProps & {
  isEmailNotifications: boolean | 'unset' | 'unverified'
  isSimpleEmailNotifications: boolean | 'unset'
  hospexDocument?: string
  inbox: string
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
  const verifyEmailMutation = useVerifyEmail()
  const { webId } = useAuth()
  const { emailNotificationsIdentity, emailNotificationsService } = useConfig()

  const { results } = useReadEmailVerificationSetup()
  const isNotificationsInitialized = results.some(
    result =>
      result.url &&
      result.permissions.acls[0].accesses?.some(
        value =>
          value.agents.includes(emailNotificationsIdentity) &&
          (value.modes.includes('Write') || value.modes.includes('Append')) &&
          value.modes.includes('Read'),
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
      if (!hospexDocument) throw new Error('no hospex document for community')
      if (!isEmailNotifications) {
        if (!isNotificationsInitialized)
          await preparePod({ hospexDocument, webId: webId!, email })

        await verifyEmailMutation.mutateAsync({ email })

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
    queryClient.invalidateQueries({ queryKey: ['simpleMailerIntegration'] })
  }

  if (isEmailNotifications)
    return (
      <div>
        <FaCheck />
        Your email notifications are set up.
        <Button primary onClick={onSuccess}>
          Finish Setup
        </Button>
      </div>
    )

  return (
    <form onSubmit={handleFormSubmit}>
      {!isEmailNotifications && (
        <div>
          <div>
            Enter your email address:{' '}
            <input
              required
              placeholder="email address"
              {...register('email')}
              type="email"
              disabled={sent}
            />
            <Button type="submit" secondary disabled={sending || countdown > 0}>
              {countdown > 0 ? (
                <>Resend Confirmation Email in {countdown}s</>
              ) : (
                <>Send Confirmation Email</>
              )}
            </Button>
          </div>
          {sent && !sending && (
            <div>
              A confirmation email has been sent to {sentToEmail}.<br />
              Please check your inbox (and spam folder) and follow the
              instructions.
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
        Finish Setup {checkQuery.isRefetching && <IconLoading />}
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
  inbox: string
}) => {
  const initEmailNotifications = useInitEmailNotifications()
  const { handleSubmit, register } = useForm<{ email: string }>()
  const { webId } = useAuth()

  const queryClient = useQueryClient()
  const handleFinish = () => {
    queryClient.invalidateQueries({ queryKey: ['mailerIntegration'] })
  }

  const handleFormSubmit = handleSubmit(({ email }) => {
    initEmailNotifications({
      email,
      webId: webId!,
      inbox,
    })
  })

  if (isEmailNotifications === true)
    return (
      <div>
        <FaCheck />
        Your email notifications are set up.
        <Button primary onClick={onSuccess}>
          Finish Setup
        </Button>
      </div>
    )

  return (
    <form onSubmit={handleFormSubmit}>
      {!isEmailNotifications && (
        <div>
          Setup email notifications{' '}
          <input
            type="email"
            placeholder="Your email"
            {...register('email')}
            required
          />
          <Button type="submit" primary>
            Send Confirmation Email
          </Button>
        </div>
      )}
      {isEmailNotifications === 'unverified' && (
        <div>
          Please verify your email
          <Button type="button" primary onClick={handleFinish}>
            Finish Setup
          </Button>
        </div>
      )}
    </form>
  )
}

const NoEmailNotifications = ({ onSuccess }: StepProps) => (
  <div>
    <FaCheck /> Email notifications are not available for this community.
    <div>
      <Button primary onClick={onSuccess}>
        Finish Setup
      </Button>
    </div>
  </div>
)
