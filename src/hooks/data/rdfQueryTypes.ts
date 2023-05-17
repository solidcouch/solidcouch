import { UseQueryResult } from '@tanstack/react-query'
import { ShapeType } from 'ldo'
import { URI } from 'types'

export type Query<Params extends { [key: string]: string | URI }> = readonly (
  | readonly [string]
  | readonly [string, string, string]
  | readonly [string, (uri: URI) => URI, string, ShapeType<any>]
  | readonly [string, (ldo: any, params: Params) => boolean]
)[]

export type CombinedResults<Results> = Results extends (infer Result)[]
  ? Result extends UseQueryResult<any, any>
    ? {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        [K in keyof Result]: K extends `is${infer T}` ? boolean : Result[K][]
      }
    : never
  : never

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type StartsWith<
  Key,
  Prep extends string,
> = Key extends `${Prep}${infer T}` ? Key : never

type ResultOf<Query, K extends string> = Query extends readonly (infer Path)[]
  ? // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Path extends readonly [infer S, infer P, `?${K}`, ShapeType<infer Type>]
    ? Type
    : Path extends readonly [`?${infer S}`, infer P extends string, `?${K}`]
    ? ElementIfArray<NonNullable<PropertyOf<ResultOf<Query, S>, P>>>
    : never
  : never

type ElementIfArray<T> = T extends (infer E)[] ? E : T

export type ResultsOf<Query> = {
  [Key in ResultKeys<Query>]: ResultOf<Query, Key>[]
}

type ResultKeys<Query> = Query extends readonly (infer Path)[]
  ? // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Path extends readonly [`?${infer Var}`, ...infer Rest]
    ? Var
    : never
  : never

type PropertyOf<T, K> = T extends object
  ? K extends keyof T
    ? T[K]
    : never
  : never
