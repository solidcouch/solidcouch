import { createLdoDataset } from '@ldo/ldo'
import type { IssuerConfig } from '../../config/index.ts'
import { fetchRdfDocument } from '../../hooks/data/useRdfDocument.ts'
import { SolidProfileShapeType } from '../../ldo/app.shapeTypes.ts'
import { URI } from '../../types/index.ts'

// TODO this can be a candidate for a separate library

// Reads OIDC issuers from a WebID URI.
const readOidcIssuer = async (webId: URI): Promise<string[]> => {
  const { data } = await fetchRdfDocument(webId)
  const ldo = createLdoDataset(data)
    .usingType(SolidProfileShapeType)
    .fromSubject(webId)

  return ldo.oidcIssuer.flatMap(issuer => issuer['@id'] ?? [])
}

// Tries to guess the issuer from a WebID or returns the input if it's an issuer.
const guessIssuerFromWebID = async (webIdOrIssuer: URI): Promise<URI> => {
  try {
    const oidcIssuers = await readOidcIssuer(webIdOrIssuer)
    if (oidcIssuers.length === 0) throw new Error('OIDC issuer not found')
    return oidcIssuers[0]
  } catch {
    return webIdOrIssuer
  }
}

// Returns a known issuer URL by matching the host, or undefined if not found.
const healIssuerURL = (
  issuer: URI,
  oidcIssuers: IssuerConfig[],
): URI | undefined => {
  const issuerURL = new URL(issuer)
  return oidcIssuers.find(iss => iss.issuer.includes(issuerURL.host))?.issuer
}

// Ensures the URL has a protocol; tries to fix if it doesn't.
const ensureProtocol = (url: string): string => {
  const trimmedUrl = url.trim()
  return trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`
}

// Attempts to heal the issuer URL or return the URL if it's a known issuer.
const healIssuer = (
  issuer: URI,
  oidcIssuers: IssuerConfig[],
): URI | undefined => {
  const urlWithProtocol = ensureProtocol(issuer)
  return healIssuerURL(urlWithProtocol, oidcIssuers) ?? urlWithProtocol
}

// Main function to guess and heal an issuer URL from a given WebID or issuer.
export const guessIssuer = async (
  webIdOrIssuer: string,
  oidcIssuers: IssuerConfig[],
): Promise<URI> => {
  const urlWithProtocol = ensureProtocol(webIdOrIssuer)
  const issuer = await guessIssuerFromWebID(urlWithProtocol)
  return healIssuer(issuer, oidcIssuers) ?? issuer
}
