import { skipToken } from '@reduxjs/toolkit/dist/query/react'
import { api } from 'app/services/api'
import { ImgHTMLAttributes } from 'react'

export const ProtectedImg = (props: ImgHTMLAttributes<HTMLImageElement>) => {
  const { data: src } = api.endpoints.readImage.useQuery(props.src ?? skipToken)

  return <img {...props} src={src} alt={props.alt ?? ''} />
}
