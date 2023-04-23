import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/dist/query/react'
import { URI } from 'types'

export const fileApi = createApi({
  reducerPath: 'fileApi',
  baseQuery: fetchBaseQuery(),
  endpoints: builder => ({
    readRDF: builder.query<string, URI>({
      query: uri => uri,
    }),
  }),
})
