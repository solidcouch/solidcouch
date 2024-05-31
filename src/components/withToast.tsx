import { ToastOptions, ToastPromiseParams, toast } from 'react-toastify'

const withToast = async <
  TData,
  TError extends Error = Error,
  TPending = unknown,
>(
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
            Something went wrong
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

  return await promise
}

export { withToast }
