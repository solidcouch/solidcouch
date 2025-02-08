// To read access to a resource:
// we may want effective access, which is in some response header
// we may want the acl of the resource
// we may want the inherited acl - default part
// and return all the access control items for the resource

import { HttpError } from '@/utils/errors'
import { parseWacAllow, processAcl, removeHashFromURI } from '@/utils/helpers'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { fetchRdfDocument } from '@ldhop/core'
import { useQueries, useQuery } from '@tanstack/react-query'
import LinkHeader from 'http-link-header'

const fetchRdfDocumentOrFail = async (url: string) => {
  url = removeHashFromURI(url)
  const response = await fetchRdfDocument(url, fetch)
  if (!response.ok)
    if (response.response)
      throw new HttpError(response.response.statusText, response.response)
    else throw new Error('unexpected')
  return response
}

export const useReadAccess = (resource: string) => {
  resource = resource && removeHashFromURI(resource)
  const { data } = useQuery({
    queryKey: ['rdfDocument', resource],
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
    queryKey: ['rdfDocument', aclUri],
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

export const useReadAccesses = (resources: string[]) => {
  // Fetch RDF Documents for all resources
  const resourceQueries = useQueries({
    queries: resources.map(resource => ({
      queryKey: ['rdfDocument', resource],
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
      queryKey: ['rdfDocument', aclUri],
      queryFn: async () => fetchRdfDocumentOrFail(aclUri ?? ''),
      // it's only meaningful to fetch acl if user has control permission
      enabled: Boolean(aclUri) && effectivePermissions?.user?.has('control'),
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
      effectivePermissions: accessData.effectivePermissions,
      acls: [{ uri: accessData.aclUri, accesses: accesses[i] }],
    })),
  }
}
