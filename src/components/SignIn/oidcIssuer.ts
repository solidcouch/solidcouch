import { fetchRdfDocument } from 'hooks/data/useRdfDocument'
import { createLdoDataset } from 'ldo'
import { SolidProfileShapeType } from 'ldo/app.shapeTypes'
import { URI } from 'types'

export const readOidcIssuer = async (webId: URI): Promise<string[]> => {
  const { data } = await fetchRdfDocument(webId)
  const ldo = createLdoDataset(data)
    .usingType(SolidProfileShapeType)
    .fromSubject(webId)

  return ldo.oidcIssuer.flatMap(issuer => issuer['@id'] ?? [])
}
