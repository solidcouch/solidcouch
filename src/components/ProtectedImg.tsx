import { useFile } from 'hooks/data/useFile'
import { ImgHTMLAttributes } from 'react'

export const ProtectedImg = (props: ImgHTMLAttributes<HTMLImageElement>) => {
  const { data: image } = useFile(props.src)
  return image ? <img {...props} src={image} alt={props.alt ?? ''} /> : null
}
