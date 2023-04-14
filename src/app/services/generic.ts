import { QueryEngine } from '@comunica/query-sparql/lib/index-browser'
import * as config from 'config'
import n3 from 'n3'
import { URI } from 'types'
import { fullFetch, getContainer } from 'utils/helpers'
import { dct, hospex, rdf, rdfs, sioc, solid } from 'utils/rdf-namespaces'
import { bindings2data, query } from './helpers'

export const getHospexDocuments = async ({
  webId,
  communityId = config.communityId,
  sources = [webId],
}: {
  webId: URI
  communityId?: URI
  sources?: URI[]
}) => {
  const engine = new QueryEngine()
  await engine.invalidateHttpCache()
  const indexQuery = query`
    SELECT ?index WHERE {
      <${webId}> <${solid.publicTypeIndex}> ?index.
    }`

  const indexStream = await engine.queryBindings(indexQuery, {
    sources: sources as [URI, ...URI[]],
    fetch: fullFetch,
  })
  const indexes = (await bindings2data(indexStream)).map(
    ({ index }) => index as URI,
  )

  if (indexes.length === 0) throw new Error('No type index found')

  const hospexDocumentQuery = `
    SELECT ?hospexDocument WHERE {
      #<${indexes[0]}>
      #  <${rdf.type}> <${solid.TypeIndex}>;
      #  <${dct.references}> ?typeRegistration.
      ?typeRegistration
        <${rdf.type}> <${solid.TypeRegistration}>;
        <${solid.forClass}> <${hospex.PersonalHospexDocument}>;
        <${solid.instance}> ?hospexDocument.
    }`

  const documentStream = await engine.queryBindings(hospexDocumentQuery, {
    sources: indexes as [URI, ...URI[]],
    fetch: fullFetch,
  })
  const documents = (await bindings2data(documentStream)).map(
    ({ hospexDocument }) => hospexDocument as URI,
  )

  const communityDocuments: URI[] = []

  for (const document of documents) {
    const simpleEngine = new QueryEngine()
    const memberOfQuery = query`
      SELECT * WHERE { <${webId}> <${sioc.member_of}> <${communityId}>. }
    `
    const bindingsStream = await simpleEngine.queryBindings(memberOfQuery, {
      sources: [document],
      fetch: fullFetch,
    })
    const data = await bindings2data(bindingsStream)

    if (data.length > 0) communityDocuments.push(document)
  }

  return communityDocuments
}

export const getHospexContainer = async (webId: URI, communityId?: URI) => {
  const documents = await getHospexDocuments({ webId, communityId })

  if (documents.length !== 1)
    throw new Error(
      'hospex document not setup or we have multiple hospex documents',
    )

  const hospexContainer = getContainer(documents[0])

  return hospexContainer
}

const getSeeAlso = async ({
  id,
  document,
}: {
  id: URI
  document: URI
}): Promise<URI[]> => {
  const response = await fullFetch(document, {
    headers: { accept: 'text/turtle' },
  })
  const text = await response.text()
  // parse the turtle
  const parser = new n3.Parser({ format: 'text/turtle' })
  const results = parser.parse(text)
  return results
    .filter(
      result =>
        result.subject.value === id &&
        result.predicate.value === rdfs.seeAlso &&
        result.object.termType === 'NamedNode',
    )
    .map(result => result.value)
}

const getExtendedProfileDocuments = async (webId: URI): Promise<URI[]> => {
  const results: URI[] = []
  const seeAlso = await getSeeAlso({ id: webId, document: webId })
  results.push(...seeAlso)
  return results
}

export const getProfileDocuments = async ({ webId }: { webId: URI }) => {
  const extended = await getExtendedProfileDocuments(webId)

  return {
    primary: webId, // we don't worry about redirects here, but possibly we want to worry about them...
    extended: await getExtendedProfileDocuments(webId),
    hospex: await getHospexDocuments({ webId, sources: [webId, ...extended] }),
  }
}
