import { clsx } from 'clsx'
import ReactModal, { type Props as ReactModalProps } from 'react-modal'
import styles from './Modal.module.scss'

ReactModal.setAppElement('#root')

export const Modal = ({
  className,
  overlayClassName,
  ...props
}: ReactModalProps) => (
  <ReactModal
    className={clsx(styles.modal, className)}
    overlayClassName={clsx(styles.overlay, overlayClassName)}
    {...props}
  />
)
