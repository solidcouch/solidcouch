import { mergeWith } from 'lodash'
import n3 from 'n3'
import { foaf, vcard } from 'rdf-namespaces'
import { Person, URI } from 'types'
import { Overwrite } from 'utility-types'
import { fullFetch, getContainer } from 'utils/helpers'
import { createFile, deleteFile, getHospexDocuments } from './generic'
import { query } from './helpers'

const { quad, namedNode, literal } = n3.DataFactory

export const readHospexProfile = async ({
  id,
  language = 'en',
}: {
  id: URI
  language?: string
}) => {
  // find hospex documents
  const hospexDocuments = await getHospexDocuments({ webId: id })

  const person: Person = { id, name: '' }

  // process each document
  for (const uri of hospexDocuments) {
    const profile = await readProfileFromDocument(id, uri, language)
    mergeWith(person, profile, (objValue, srcValue) => {
      if (typeof objValue !== 'object') {
        // return the newest value if it's truthy
        return srcValue || objValue
      }
    })
  }

  return person
}

const readProfileFromDocument = async (
  id: URI,
  docUri: URI,
  language = 'en',
): Promise<Person> => {
  const person: Person = { id, name: '' }

  // process document
  const doc = await (
    await fullFetch(docUri, { headers: { accept: 'text/turtle' } })
  ).text()

  const parser = new n3.Parser({ format: 'text/turtle', baseIRI: docUri })
  const quads = parser.parse(doc)

  // find name
  const name = quads.find(
    q => q.subject.value === id && q.predicate.value === foaf.name,
  )?.object.value
  if (name) person.name = name

  // find description in current language
  const about = quads.find(
    q =>
      q.subject.value === id &&
      q.predicate.value === vcard.note &&
      q.object.termType === 'Literal' &&
      q.object.language === language,
  )?.object.value
  if (about) person.about = about

  // find photo
  const photo = quads.find(
    q =>
      q.subject.value === id &&
      q.predicate.value === vcard.hasPhoto &&
      q.object.termType === 'NamedNode',
  )?.object.value
  if (photo) person.photo = photo

  return person
}

// export const readProfile = async ({ id }: { id: URI }) => {}

export const saveHospexProfile = async (
  person: Overwrite<Person, { photo?: File }>,
  language = 'en',
) => {
  const hospexDocuments = await getHospexDocuments({ webId: person.id })
  // just use the first document
  const doc = hospexDocuments[0]

  if (!doc) throw new Error('Personal hospex document is not available')
  await saveProfileToDocument(person, doc, language)
}

const saveProfileToDocument = async (
  data: Overwrite<Person, { photo?: File }>,
  document: URI,
  language = 'en',
) => {
  // first fetch the profile data
  const doc = await (
    await fullFetch(document, { headers: { accept: 'text/turtle' } })
  ).text()
  const parser = new n3.Parser({ format: 'text/turtle', baseIRI: document })
  const quads = parser.parse(doc)

  // collect triples to remove and add
  const triplesToRemove: n3.Quad[] = []
  const triplesToAdd: n3.Quad[] = []

  // photo
  if (data.photo) {
    // create new photo
    const newPhotoUri = await createFile(getContainer(document), data.photo)
    // delete old photos
    const previousPhotos = quads.filter(
      q =>
        q.subject.value === data.id &&
        q.predicate.value === vcard.hasPhoto &&
        q.object.termType === 'NamedNode',
    )
    await Promise.all(previousPhotos.map(quad => deleteFile(quad.object.value)))

    triplesToRemove.push(...previousPhotos)
    triplesToAdd.push(
      quad(
        namedNode(data.id),
        namedNode(vcard.hasPhoto),
        namedNode(newPhotoUri),
      ),
    )
  }

  // name
  if (typeof data.name === 'string') {
    const previousNames = quads.filter(
      q =>
        q.subject.value === data.id &&
        q.predicate.value === foaf.name &&
        q.object.termType === 'Literal',
    )
    triplesToRemove.push(...previousNames)
    triplesToAdd.push(
      quad(namedNode(data.id), namedNode(foaf.name), literal(data.name)),
    )
  }

  // description
  if (typeof data.about === 'string') {
    const previousDescriptions = quads.filter(
      q =>
        q.subject.value === data.id &&
        q.predicate.value === vcard.note &&
        q.object.termType === 'Literal' &&
        q.object.language === language,
    )

    triplesToRemove.push(...previousDescriptions)
    triplesToAdd.push(
      quad(
        namedNode(data.id),
        namedNode(vcard.note),
        literal(data.about, language),
      ),
    )
  }

  // save the update
  await fullFetch(document, {
    method: 'PATCH',
    body: query`DELETE DATA {${triplesToRemove}}; INSERT DATA {${triplesToAdd}}`,
    headers: { 'content-type': 'application/sparql-update' },
  })
}
