import { BindingsStream } from '@comunica/types'

export const bindings2data = async (bindingsStream: BindingsStream) => {
  const data = (await bindingsStream.toArray()).map(binding => {
    const keys = Array.from(binding.keys()).map(({ value }) => value)

    return Object.fromEntries(
      keys.map(key => [key, binding.get(key as string)?.value ?? null]),
    )
  })

  return data
}
