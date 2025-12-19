import { Button } from '@/components'
import { ajvResolver } from '@hookform/resolvers/ajv'
import { useLingui } from '@lingui/react/macro'
import { JSONSchemaType } from 'ajv'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FaPaperPlane } from 'react-icons/fa'
import styles from './SendMessageForm.module.scss'

const validationSchema: JSONSchemaType<{ message: string }> = {
  type: 'object',
  required: ['message'],
  properties: {
    message: { type: 'string', minLength: 1, pattern: '\\S' },
  },
}

const validationSchemaWithTitle: JSONSchemaType<{
  message: string
  title: string
}> = {
  type: 'object',
  required: ['message', 'title'],
  properties: {
    message: { type: 'string', minLength: 1, pattern: '\\S' },
    title: { type: 'string', minLength: 1, pattern: '\\S' },
  },
}

export const SendMessageForm = ({
  disabled,
  onSendMessage,
  isNewChat,
}: {
  disabled?: boolean
  isNewChat?: boolean
  onSendMessage?: (data: {
    message: string
    title?: string
  }) => void | Promise<void>
}) => {
  const { t } = useLingui()
  const [submitting, setSubmitting] = useState(false)

  const resolver = useMemo(
    () =>
      isNewChat
        ? ajvResolver(validationSchemaWithTitle)
        : ajvResolver(validationSchema),
    [isNewChat],
  )

  const {
    handleSubmit,
    register,
    formState: { isValid },
    reset,
  } = useForm<{ message: string; title?: string }>({ resolver })
  const handleFormSubmit = handleSubmit(async data => {
    setSubmitting(true)
    try {
      await onSendMessage?.(data)
      reset({ message: '', title: '' })
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <form onSubmit={handleFormSubmit} className={styles.form}>
      {isNewChat && (
        <input type="text" {...register('title')} placeholder={t`Title`} />
      )}
      <div className={styles.sendMessage}>
        <textarea
          disabled={submitting}
          autoFocus
          required
          className={styles.messageInput}
          {...register('message')}
          placeholder={t`Send a message…`}
        />
        <Button
          type="submit"
          className={styles.submit}
          disabled={disabled || !isValid || submitting}
          aria-label={t`Send`}
          primary
        >
          <FaPaperPlane />
        </Button>
      </div>
    </form>
  )
}
