// To read access to a resource:
// we may want effective access, which is in some response header
// we may want the acl of the resource
// we may want the inherited acl - default part
// and return all the access control items for the resource

import { URI } from '@/types'
import { HttpError } from '@/utils/errors'
import {
  EffectiveAccessMode,
  fullFetch,
  getAcl,
  parseWacAllow,
  processAcl,
  removeHashFromURI,
} from '@/utils/helpers'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { fetchRdfDocument } from '@ldhop/core'
import { useQueries } from '@tanstack/react-query'
import LinkHeader from 'http-link-header'
import { NamedNode, Quad, Writer } from 'n3'
import { acl, rdf } from 'rdf-namespaces'
import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { AccessMode, QueryKey } from './types'
import { useUpdateRdfDocument } from './useRdfDocument'

const fetchRdfDocumentOrFail = async (url: string) => {
  url = removeHashFromURI(url)
  const response = await fetchRdfDocument(url, fetch)
  if (!response.ok)
    if (response.response)
      throw new HttpError(response.response.statusText, response.response)
    else throw new Error('unexpected')
  return response
}

/** TODO - useful but unused code
export const useReadAccess = (resource: string) => {
  resource = resource && removeHashFromURI(resource)
  const { data } = useQuery({
    queryKey: [QueryKey.rdfDocument, resource],
    queryFn: async () => fetchRdfDocumentOrFail(resource),
    enabled: Boolean(resource),
  })

  const headers = data?.response?.headers

  const linkHeader = headers?.get('link')
  const link = linkHeader ? LinkHeader.parse(linkHeader) : undefined
  const rawAclUri = link?.rel('acl')[0]?.uri
  // if aclUri is relative, return absolute uri
  const aclUri =
    rawAclUri && resource ? new URL(rawAclUri, resource).toString() : undefined

  const wacAllow = headers?.get('wac-allow')
  const effectivePermissions = wacAllow ? parseWacAllow(wacAllow) : undefined

  const { data: aclData } = useQuery({
    queryKey: [QueryKey.rdfDocument, aclUri],
    queryFn: () => fetchRdfDocumentOrFail(aclUri ?? ''),
    enabled: Boolean(aclUri) && effectivePermissions?.user?.has('control'),
  })

  const accesses =
    aclUri && typeof aclData?.rawData === 'string'
      ? processAcl(aclUri, aclData?.rawData)
      : undefined

  return {
    effectivePermissions,
    acls: [{ uri: aclUri, accesses }],
  }
}
*/

export const useReadAccesses = (resources: string[]) => {
  // Fetch RDF Documents for all resources
  const resourceQueries = useQueries({
    queries: resources.map(resource => ({
      queryKey: [QueryKey.rdfDocument, resource],
      queryFn: async () => fetchRdfDocumentOrFail(resource),
      enabled: Boolean(resource),
    })),
  })

  // Extract relevant access information
  const resourceAccessData = resourceQueries.map(({ data }, i) => {
    const resource = resources[i]
    const headers = data?.response?.headers

    const linkHeader = headers?.get('link')
    const link = linkHeader ? LinkHeader.parse(linkHeader) : undefined
    const rawAclUri = link?.rel('acl')[0]?.uri
    const aclUri =
      rawAclUri && resource
        ? new URL(rawAclUri, resource).toString()
        : undefined

    const wacAllow = headers?.get('wac-allow')
    const effectivePermissions = wacAllow ? parseWacAllow(wacAllow) : undefined

    return {
      resource,
      aclUri,
      effectivePermissions,
    }
  })

  // Fetch ACL Documents for all resources with valid ACL URIs
  const aclQueries = useQueries({
    queries: resourceAccessData.map(({ aclUri, effectivePermissions }) => ({
      queryKey: [QueryKey.rdfDocument, aclUri],
      queryFn: async () => fetchRdfDocumentOrFail(aclUri ?? ''),
      // it's only meaningful to fetch acl if user has control permission
      enabled:
        Boolean(aclUri) &&
        effectivePermissions?.user?.has(EffectiveAccessMode.control),
    })),
  })

  // Process ACL data
  const accesses = aclQueries.map(({ data, isError }, index) => {
    const aclUri = resourceAccessData[index]?.aclUri
    return aclUri && typeof data?.rawData === 'string' && !isError
      ? processAcl(aclUri, data.rawData)
      : undefined
  })

  return {
    isLoading:
      resourceQueries.some(q => q.isLoading) ||
      aclQueries.some(q => q.isLoading),
    results: resourceAccessData.map((accessData, i) => ({
      isLoading: resourceQueries[i]!.isLoading || aclQueries[i]!.isLoading,
      effectivePermissions: accessData.effectivePermissions,
      acls: [{ uri: accessData.aclUri, accesses: accesses[i] }],
    })),
  }
}
export const useUpdateAcl = () => {
  const updateAclMutation = useUpdateRdfDocument()

  return useCallback(
    async (
      uri: string, // uri of the document or container whose acl we want to update
      operations: {
        // operations to perform
        operation: 'add'
        access: AccessMode[] // add to this access
        default?: boolean
        agentGroups?: URI[]
        agents?: URI[]
      }[],
    ) => {
      const aclUri = await getAcl(uri)
      const aclResponse = await fullFetch(aclUri)

      const expected = aclResponse.ok || aclResponse.status === 404

      if (!expected)
        throw new HttpError('Acl could not be resolved', aclResponse)

      const aclBody = aclResponse.status === 404 ? '' : await aclResponse.text()

      const authorizations = processAcl(aclUri, aclBody)

      const writer = new Writer({ format: 'N-Triples' })

      for (const operation of operations) {
        operation.agents ??= []
        operation.agentGroups ??= []
        // find relevant access
        const auth = authorizations.find(a => {
          const expectedAccess = new Set(operation.access)
          const actualAccess = new Set(a.modes)

          return expectedAccess.size === actualAccess.size &&
            Array.from(expectedAccess).every(aa => actualAccess.has(aa)) &&
            operation.default
            ? a.defaults.includes(uri)
            : a.defaults.length === 0
        })

        const getNewAuthUrl = (uri: string) => {
          const newAuthURL = new URL(uri)
          newAuthURL.hash = uuidv4()
          return newAuthURL.toString()
        }

        const authUrl = auth?.url ?? getNewAuthUrl(aclUri)

        const authNode = new NamedNode(authUrl)

        writer.addQuads(
          operation.agentGroups.map(
            ag =>
              new Quad(
                authNode,
                new NamedNode(acl.agentGroup),
                new NamedNode(ag),
              ),
          ),
        )
        writer.addQuads(
          operation.agents.map(
            a => new Quad(authNode, new NamedNode(acl.agent), new NamedNode(a)),
          ),
        )

        if (!auth) {
          // untested!
          writer.addQuads([
            new Quad(
              authNode,
              new NamedNode(rdf.type),
              new NamedNode(acl.Authorization),
            ),
            new Quad(authNode, new NamedNode(acl.accessTo), new NamedNode(uri)),
            ...operation.access.map(
              a =>
                new Quad(
                  authNode,
                  new NamedNode(acl.mode),
                  new NamedNode(acl[a]),
                ),
            ),
          ])
          if (operation.default)
            writer.addQuads([
              new Quad(
                authNode,
                new NamedNode(acl.default__workaround),
                new NamedNode(uri),
              ),
            ])
        }
      }

      const insertions = await new Promise<string>((resolve, reject) => {
        writer.end((error, result) => {
          if (error) reject(error)
          else resolve(result)
        })
      })

      await updateAclMutation.mutateAsync({
        uri: aclUri,
        patch: `
        @prefix foaf: <http://xmlns.com/foaf/0.1/>.
        @prefix solid: <http://www.w3.org/ns/solid/terms#>.
        _:mutation a solid:InsertDeletePatch;
          solid:inserts {
            ${insertions}
          } .`,
      })
    },
    [updateAclMutation],
  )
}
