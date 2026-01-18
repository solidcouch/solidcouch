import { Trans } from '@lingui/react/macro'
import { ToastOptions, ToastPromiseParams, toast } from 'react-toastify'

const withToast = <TData, TError extends Error = Error, TPending = unknown>(
  promise: Promise<TData>,
  { success, error, pending }: ToastPromiseParams<TData, TError, TPending>,
  options?: ToastOptions<TData>,
) => {
  toast.promise<TData, TError, TPending>(
    promise,
    {
      success,
      error: error ?? {
        render: ({ data: e }) => (
          <>
            <Trans>Something went wrong.</Trans>
            <br />
            {e.message}
          </>
        ),
        autoClose: false,
      },
      pending,
    },
    options,
  )

  return promise
}

export { withToast }
