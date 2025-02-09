import animationStyles from '@/styles/animations.module.scss'
import clsx from 'clsx'
import { FaCircleNotch } from 'react-icons/fa'
import { IconBaseProps } from 'react-icons/lib'

export const IconLoading = ({ className, ...props }: IconBaseProps) => (
  <FaCircleNotch className={clsx(animationStyles.spin, className)} {...props} />
)
