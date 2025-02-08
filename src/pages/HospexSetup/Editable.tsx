import { ComponentPropsWithRef, useState } from 'react'
import { FaCheck, FaPencilAlt } from 'react-icons/fa'

export const Editable = ({
  value,
  ...props
}: ComponentPropsWithRef<'input'>) => {
  const [editable, setEditable] = useState(false)

  if (!editable)
    return (
      <>
        {value}{' '}
        <button type="button" onClick={() => setEditable(true)}>
          <FaPencilAlt />
        </button>
      </>
    )
  else
    return (
      <>
        <input {...props} />{' '}
        <button
          type="button"
          onClick={() => {
            setEditable(false)
          }}
        >
          <FaCheck />
        </button>
      </>
    )
}
