import { BindingsStream } from '@comunica/types'
import { Triple, Writer } from 'n3'

export const bindings2data = async (bindingsStream: BindingsStream) => {
  const data = (await bindingsStream.toArray()).map(binding => {
    const keys = Array.from(binding.keys()).map(({ value }) => value)

    return Object.fromEntries(
      keys.map(key => [key, binding.get(key as string)?.value ?? null]),
    )
  })

  return data
}

export const query = (
  strings: TemplateStringsArray,
  ...rest: (Triple[] | string)[]
) => {
  const writer = new Writer()
  const texts = [...strings]

  let output = texts.shift() ?? ''

  for (const quads of rest) {
    output += typeof quads === 'string' ? quads : writer.quadsToString(quads)
    output += texts.shift() as string
  }

  return output
}
