import { ComponentPropsWithRef, useState } from 'react'
import { FaCheck, FaPencilAlt } from 'react-icons/fa'

export const Editable = ({
  value,
  editable: isEditable,
  ...props
}: { editable?: boolean } & ComponentPropsWithRef<'input'>) => {
  const [editable, setEditable] = useState(false)

  if (!editable)
    return (
      <>
        {value}{' '}
        <button
          disabled={!isEditable}
          style={isEditable ? {} : { display: 'none' }}
          type="button"
          onClick={() => setEditable(true)}
        >
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
