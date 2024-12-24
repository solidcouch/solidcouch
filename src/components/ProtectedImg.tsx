import { ImgHTMLAttributes } from 'react'
import { useFile } from '../hooks/data/useFile.ts'

export const ProtectedImg = (props: ImgHTMLAttributes<HTMLImageElement>) => {
  const { data: image } = useFile(props.src)
  return image ? (
    <img
      {...props}
      src={image}
      alt={props.alt ?? ''}
      data-original-src={props.src}
    />
  ) : null
}
