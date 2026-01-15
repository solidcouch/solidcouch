import { HttpError } from '@/utils/errors'
import { useLingui } from '@lingui/react/macro'
import { useMemo } from 'react'
import { UpdateOptions } from 'react-toastify'

export const useToastError = () => {
  const { t } = useLingui()

  return useMemo(
    (): UpdateOptions<Error> => ({
      autoClose: false,
      render({ data }) {
        let message = t`Something went wrong`
        if (data instanceof HttpError) {
          const {
            response: { url, status, statusText },
          } = data
          message = t`Request failed: ${status} ${statusText} ${url}`
        } else if (data instanceof Error) {
          const failure = data.message
          message = t`Something went wrong: ${failure}`
        }

        return message
      },
    }),
    [t],
  )
}
