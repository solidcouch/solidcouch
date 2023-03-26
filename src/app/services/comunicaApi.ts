import { QueryEngine } from '@comunica/query-sparql'
import { QueryEngine as TraversalQueryEngine } from '@comunica/query-sparql-link-traversal'
import { fetch } from '@inrupt/solid-client-authn-browser'
import type { BaseQueryFn } from '@reduxjs/toolkit/dist/query/baseQueryTypes'
import { createApi } from '@reduxjs/toolkit/dist/query/react'
import { merge } from 'lodash'
import { DataFactory, Parser, Quad, Triple, Writer } from 'n3'
import {
  acl,
  dct,
  foaf,
  rdf,
  schema_https,
  sioc,
  solid,
  vcard,
} from 'rdf-namespaces'
import { Accommodation, Community, Message, Person, Thread, URI } from 'types'
import { fullFetch, removeHashFromURI } from 'utils/helpers'
import { createMessage, readMessages, readThreads } from './messages'
// import { bindingsStreamToGraphQl } from '@comunica/actor-query-result-serialize-tree'
// import { accommodationContext } from 'ldo/accommodation.context'

const geo = 'http://www.w3.org/2003/01/geo/wgs84_pos#'
const hospex = 'http://w3id.org/hospex/ns#'
const xsd = 'http://www.w3.org/TR/xmlschema11-2/#'

const { namedNode, literal, quad } = DataFactory

const myEngine = new TraversalQueryEngine()

const limitedEngine = new QueryEngine()
// const gql = ([s]: TemplateStringsArray) => s

const comunicaBaseQuery =
  (
    { baseSources }: { baseSources: string[] } = { baseSources: [] },
  ): BaseQueryFn<{
    query: string
    sources: [URI, ...URI[]]
    invalidate?: boolean | URI[]
  }> =>
  async ({ query, sources, invalidate = false }) => {
    if (invalidate) {
      if (Array.isArray(invalidate))
        await Promise.all(
          invalidate.map(url =>
            myEngine.invalidateHttpCache(removeHashFromURI(url)),
          ),
        )
      else await myEngine.invalidateHttpCache()
    }

    const sourcesCleaned = [...baseSources, ...sources].map(uri =>
      removeHashFromURI(uri),
    ) as [string, ...string[]]

    // invalidate all sources, otherwise our query may get stuck
    for (const uri of sourcesCleaned) {
      await myEngine.invalidateHttpCache(uri)
    }

    const bindingsStream = await myEngine.queryBindings(query, {
      sources: [...baseSources, ...sources],
      lenient: true,
      fetch: fullFetch,
    })

    const data = (await bindingsStream.toArray()).map(binding => {
      const keys = Array.from(binding.keys()).map(({ value }) => value)

      return Object.fromEntries(
        keys.map(key => [key, binding.get(key as string)?.value ?? null]),
      )
    })

    return {
      data,
    }
  }

export const comunicaApi = createApi({
  reducerPath: 'comunicaApi',
  baseQuery: comunicaBaseQuery(),
  tagTypes: ['Accommodation', 'Community'],
  endpoints: builder => ({
    readAccommodations: builder.query<
      Accommodation[],
      {
        webId: URI
        personalHospexDocuments: [URI, ...URI[]]
        language?: string
      }
    >({
      query: ({ webId, personalHospexDocuments, language = 'en' }) => ({
        query: query`
          SELECT ?accommodation ?description ?latitude ?longitude ?host WHERE {
            <${webId}> <${hospex}offers> ?accommodation.
            ?accommodation
              <${hospex}offeredBy> ?host;
              <${dct.description}> ?description;
              <${geo}location> ?location.
            ?location a <${geo}Point>;
              <${geo}lat> ?latitude;
              <${geo}long> ?longitude.

            FILTER(LANG(?description) = "${language}")
          }
        `,
        sources: personalHospexDocuments,
      }),
      transformResponse: (
        accommodations: {
          accommodation: URI
          description: string
          latitude: number
          longitude: number
          host: URI
        }[],
      ) =>
        accommodations.map(
          ({ accommodation, description, latitude, longitude, host }) => ({
            id: accommodation,
            description,
            location: {
              lat: Number(latitude),
              long: Number(longitude),
            },
            offeredBy: host,
          }),
        ),
      providesTags: (result, error, arg) => [
        ...(result?.map(accommodation => ({
          type: 'Accommodation' as const,
          id: accommodation.id,
        })) ?? []),
        { type: 'Accommodation', id: `LIST_OF_${arg.webId}` },
      ],
    }),
    createAccommodation: builder.mutation<
      null,
      {
        webId: URI
        accommodation: Accommodation
        personalHospexDocument: URI
      }
    >({
      queryFn: async ({ webId, accommodation, personalHospexDocument }) => {
        await saveAccommodation({
          webId,
          personalHospexDocument,
          data: accommodation,
        })

        return { data: null }
      },
      invalidatesTags: (res, err, arg) => [
        { type: 'Accommodation', id: `LIST_OF_${arg.webId}` },
        { type: 'Accommodation', id: 'LIST_OF_ALL' },
        { type: 'Accommodation', id: arg.accommodation.id },
      ],
    }),
    updateAccommodation: builder.mutation<
      null,
      {
        webId: URI
        accommodation: Accommodation
        personalHospexDocument: URI
      }
    >({
      queryFn: async ({ webId, accommodation, personalHospexDocument }) => {
        await saveAccommodation(
          {
            webId,
            personalHospexDocument,
            data: accommodation,
          },
          true,
        )

        return { data: null }
      },
      invalidatesTags: (res, err, arg) => [
        { type: 'Accommodation', id: `LIST_OF_${arg.webId}` },
        { type: 'Accommodation', id: 'LIST_OF_ALL' },
        { type: 'Accommodation', id: arg.accommodation.id },
      ],
    }),
    deleteAccommodation: builder.mutation<
      null,
      { webId: URI; id: URI; personalHospexDocument: URI }
    >({
      queryFn: async ({ webId, id, personalHospexDocument }) => {
        await deleteAccommodation({
          webId,
          personalHospexDocument,
          id,
        })

        return { data: null }
      },
      invalidatesTags: (res, err, arg) => [
        { type: 'Accommodation', id: `LIST_OF_${arg.webId}` },
        { type: 'Accommodation', id: arg.id },
        { type: 'Accommodation', id: 'LIST_OF_ALL' },
      ],
    }),
    readAccommodation: builder.query<Accommodation, { accommodationId: URI }>({
      query: ({ accommodationId }) => ({
        query: `SELECT (<${accommodationId}> as ?id) ?lat ?long ?description ?offeredBy WHERE {
          <${accommodationId}>
            <${hospex}offeredBy> ?offeredBy;
            <${dct.description}> ?description;
            <${geo}location> ?location.
          ?location a <${geo}Point>;
            <${geo}lat> ?lat;
            <${geo}long> ?long.
        }`,
        sources: [accommodationId],
      }),
      transformResponse: ([accommodation]: {
        id: URI
        description: string
        lat: number
        long: number
        offeredBy: URI
      }[]) => {
        if (!accommodation) throw new Error('Accommodation not found')

        const { id, description, lat, long, offeredBy } = accommodation
        return {
          id,
          description,
          location: {
            lat: Number(lat),
            long: Number(long),
          },
          offeredBy,
        }
      },
      providesTags: (result, error, arg) => [
        { type: 'Accommodation', id: arg.accommodationId },
      ],
    }),
    readCommunity: builder.query<
      Community,
      { communityId: string; language?: string }
    >({
      query: ({ communityId, language = 'en' }) => ({
        query: query`
          SELECT <${communityId}> as ?id ?name ?description ?group WHERE {
            <${communityId}>
                <${rdf.type}> <${sioc.Community}>;
                <${sioc.name}> ?name;
                <${sioc.about}> ?description;
                <${sioc.has_usergroup}> ?group.

            FILTER(LANG(?description) = "${language}")
            FILTER(LANG(?name) = "${language}")
          }
        `,
        sources: [communityId],
      }),
      transformResponse: ([community]: Community[]) => community,
    }),
    isMemberOf: builder.query<
      boolean,
      { webId: URI; communityId: URI; personalHospexDocuments: URI[] }
    >({
      query: ({ webId, communityId, personalHospexDocuments }) => ({
        query: query`SELECT ?group WHERE {
          <${webId}> <${sioc.member_of}> <${communityId}>.
          <${communityId}> <${sioc.has_usergroup}> ?group.
          ?group <${vcard.hasMember}> <${webId}>.
        }`,
        sources: [communityId, ...personalHospexDocuments],
        invalidate: true,
      }),
      transformResponse: (matchedDocuments: unknown[]) =>
        matchedDocuments.length > 0,
      providesTags: (res, err, args) => [
        { type: 'Community', id: 'IS_MEMBER_OF_' + args.communityId },
      ],
    }),
    joinCommunity: builder.mutation<
      null,
      {
        webId: URI
        communityId: URI
        personalHospexDocument: URI
        storage: URI
      }
    >({
      queryFn: async props => {
        await joinCommunity(props)
        return { data: null }
      },
      invalidatesTags: (res, err, args) => [
        { type: 'Community', id: 'IS_MEMBER_OF_' + args.communityId },
      ],
    }),
    readPerson: builder.query<Person, { webId: URI }>({
      queryFn: async ({ webId }) => {
        const person = await readPerson(webId)
        if (!person) return { error: 'Not found' }
        return {
          data: person,
        }
      },
    }),
    readOffers: builder.query<Accommodation[], { communityId: URI }>({
      query: ({ communityId }) => ({
        query: query`
          SELECT DISTINCT ?person ?lat ?long ?accommodation ?description WHERE {
            <${communityId}> <${sioc.has_usergroup}> ?group.
            ?group <${vcard.hasMember}> ?member.
            ?member <${solid.publicTypeIndex}> ?index.
            ?index
              <${rdf.type}> <${solid.TypeIndex}>;
              <${dct.references}> ?typeRegistration.
            ?typeRegistration
              <${rdf.type}> <${solid.TypeRegistration}>;
              <${solid.forClass}> <${hospex}PersonalHospexDocument>;
              <${solid.instance}> ?hospexDocument.
            ?person <${hospex}offers> ?accommodation.
            ?accommodation <${dct.description}> ?description;
              <${geo}location> ?location.
            ?location
              <${geo}lat> ?lat;
              <${geo}long> ?long.

            FILTER(?member = ?person)
          }
      `,
        sources: [communityId],
      }),
      transformResponse: (
        dataArray: {
          person: URI
          lat: number
          long: number
          accommodation: URI
          description: string
        }[],
      ) =>
        dataArray.map(({ person, lat, long, accommodation, description }) => ({
          id: accommodation,
          description,
          location: { lat, long },
          offeredBy: person,
        })),
      providesTags: () => [{ type: 'Accommodation', id: 'LIST_OF_ALL' }],
    }),
    readThreads: builder.query<Thread[], { me: URI }>({
      queryFn: async props => {
        return { data: await readThreads(props) }
      },
    }),
    readMessages: builder.query<Message[], { userId: URI; me: URI }>({
      queryFn: async props => {
        return { data: await readMessages(props) }
      },
    }),
    createMessage: builder.mutation<
      unknown,
      { senderId: URI; receiverId: URI; message: string }
    >({
      queryFn: async props => {
        await createMessage(props)
        return { data: null }
      },
    }),
  }),
})

export const readOffers = async ({ communityId }: { communityId: string }) => {
  await myEngine.invalidateHttpCache()
  const q = query`
    SELECT DISTINCT ?person ?lat ?long ?accommodation ?description WHERE {
      <${communityId}> <${sioc.has_usergroup}> ?group.
      ?group <${vcard.hasMember}> ?member.
      ?member <${solid.publicTypeIndex}> ?index.
      ?index
          <${rdf.type}> <${solid.TypeIndex}>;
          <${dct.references}> ?typeRegistration.
      ?typeRegistration
          <${rdf.type}> <${solid.TypeRegistration}>;
          <${solid.forClass}> <${hospex}PersonalHospexDocument>;
          <${solid.instance}> ?hospexDocument.
      ?person <${hospex}offers> ?accommodation.
        ?accommodation <${dct.description}> ?description;
            <${geo}location> ?location.
        ?location
            <${geo}lat> ?lat;
          <${geo}long> ?long.

      FILTER(?member = ?person)
    }`

  const bindingsStream = await myEngine.queryBindings(q, {
    sources: [communityId],

    lenient: true,
    fetch: fullFetch,
  })
  // bindingsStream.on('data', bindings => console.log(bindings))

  const data = (await bindingsStream.toArray()).map(binding => {
    const keys = Array.from(binding.keys()).map(({ value }) => value)

    return Object.fromEntries(
      keys.map(key => [key, binding.get(key as string)?.value ?? null]),
    )
  })
  return data

  // return {
  //   data: (await bindingsStream.toArray()).map(binding => {
  //     const keys = Array.from(binding.keys()).map(({ value }) => value)

  //     return Object.fromEntries(
  //       keys.map(key => [key, binding.get(key as string)?.value ?? null]),
  //     )
  //   }),
  // }
  // sources: [communityId]
}

const readPerson = async (webId: URI): Promise<Person> => {
  // read common profile
  const profileQuery = query`
    SELECT ?name ?about ?photo WHERE {
      <${webId}> <${foaf.name}> ?name;
      OPTIONAL { <${webId}> <${vcard.note}> ?about. }
      OPTIONAL { <${webId}> <${vcard.hasPhoto}> ?photo. }
    }`

  const genericProfileStream = await limitedEngine.queryBindings(profileQuery, {
    sources: [webId],
    fetch: fullFetch,
  })
  const [genericProfile] = (await genericProfileStream.toArray())
    .map(binding => {
      const keys = Array.from(binding.keys()).map(({ value }) => value)

      return Object.fromEntries(
        keys.map(key => [key, binding.get(key as string)?.value ?? null]),
      )
    })
    .map(({ name, about, photo }) => ({
      id: webId,
      name: name ?? '',
      photo: photo ?? undefined,
      about: about ?? undefined,
    }))

  // then find hospex document
  const hospexDocumentQuery = query`
    SELECT ?hospexDocument WHERE {
      <${webId}> <${solid.publicTypeIndex}> ?index.
      ?index
        <${rdf.type}> <${solid.TypeIndex}>;
        <${dct.references}> ?typeRegistration.
      ?typeRegistration
        <${rdf.type}> <${solid.TypeRegistration}>;
        <${solid.forClass}> <${hospex}PersonalHospexDocument>;
        <${solid.instance}> ?hospexDocument.
    }`

  const documentStream = await myEngine.queryBindings(hospexDocumentQuery, {
    sources: [webId],
    fetch: fullFetch,
    lenient: true,
  })
  const documents = (await documentStream.toArray())
    .map(binding => {
      const keys = Array.from(binding.keys()).map(({ value }) => value)

      return Object.fromEntries(
        keys.map(key => [key, binding.get(key as string)?.value ?? null]),
      )
    })
    .map(({ hospexDocument }) => hospexDocument as URI)

  if (documents.length < 1) return genericProfile

  // then read hospex profile
  const hospexProfileStream = await limitedEngine.queryBindings(profileQuery, {
    sources: documents as [URI, ...URI[]],
    fetch: fullFetch,
  })

  const [hospexProfile] = (await hospexProfileStream.toArray())
    .map(binding => {
      const keys = Array.from(binding.keys()).map(({ value }) => value)

      return Object.fromEntries(
        keys.map(key => [key, binding.get(key as string)?.value ?? null]),
      )
    })
    .map(({ name, about, photo }) => ({
      id: webId,
      name: name ?? undefined, // do not overwrite main profile name
      photo: photo ?? undefined,
      about: about ?? undefined,
    }))

  return merge(genericProfile, hospexProfile)
}

// export const readAccommodations = async ({
//   webId,
//   personalHospexDocuments,
//   language = 'en',
// }: {
//   webId: URI
//   personalHospexDocuments: [URI, ...URI[]]
//   language?: string
// }) => {
//   const result = await myEngine.queryBindings(
//     `
//     SELECT ?accommodation ?description ?latitude ?longitude WHERE {
//       <${webId}> <${hospex}offers> ?accommodation.
//       ?accommodation
//         <${dct.description}> ?description;
//         <${geo}location> ?location.
//       ?location a <${geo}Point>;
//         <${geo}lat> ?latitude;
//         <${geo}long> ?longitude.

//       FILTER(LANG(?description) = "${language}")
//     }
//   `,
//     { sources: [...personalHospexDocuments], fetch, lenient: true },
//   )

//   // result.on('data', bindings => console.log(bindings))
//   return await result.toArray()
// }

// export const readAccommodation = async () => {
//   myEngine.invalidateHttpCache()
//   const result = await myEngine.query(
//     gql`
//       {
//         id
//         ... on Accommodation {
//           comment
//           location(type: Point) @single {
//             lat @single
//             long @single
//           }
//         }
//       }
//     `,
//     {
//       sources: ['https://mrkvon.inrupt.net/public/hospex.ttl'],
//       queryFormat: {
//         language: 'graphql',
//         version: '1.0',
//       },
//       '@context': {
//         ...accommodationContext,
//         type: rdf.type,
//         Accommodation: 'https://hospex.example.com/terms/0.1#Accommodation',
//       },
//       sparqlJsonToTreeConverter: () => {},
//       asdf: '',
//     },
//   )

//   const data = await bindingsStreamToGraphQl(
//     (await result.execute()) as any,
//     result.context,
//     { materializeRdfJsTerms: false },
//   )

//   return data
// }

const saveAccommodation = async (
  {
    webId,
    personalHospexDocument,
    data,
    language = 'en',
  }: {
    webId: URI
    personalHospexDocument: URI
    data: Accommodation
    language?: string
  },
  update?: boolean,
) => {
  // save accommodation
  const insertions: Quad[] = []
  // const deletions: Quad[] = []

  const lu = new URL(data.id)
  lu.hash = 'location'
  const locationUri = lu.toString()

  const au = new URL(data.id)
  au.hash = 'accommodation'
  const auri = au.toString()

  insertions.push(
    quad(
      namedNode(auri),
      namedNode(rdf.type),
      namedNode(hospex + 'Accommodation'),
    ),
    quad(
      namedNode(auri),
      namedNode(rdf.type),
      namedNode(schema_https.Accommodation),
    ),
    quad(
      namedNode(auri),
      namedNode(dct.description),
      literal(data.description, language),
    ),
    quad(namedNode(auri), namedNode(geo + 'location'), namedNode(locationUri)),
    quad(namedNode(locationUri), namedNode(rdf.type), namedNode(geo + 'Point')),
    quad(
      namedNode(locationUri),
      namedNode(geo + 'lat'),
      literal(data.location.lat, namedNode(xsd + 'decimal')),
    ),
    quad(
      namedNode(locationUri),
      namedNode(geo + 'long'),
      literal(data.location.long, namedNode(xsd + 'decimal')),
    ),
    quad(namedNode(auri), namedNode(hospex + 'offeredBy'), namedNode(webId)),
  )

  if (update) {
    // TODO this query currently deletes descriptions in all languages
    const updateAccommodationQuery = query`DELETE {
    <${auri}> <${dct.description}> ?description.
    ?location ?predicate ?object.
  } INSERT {${insertions}} WHERE {
    <${auri}> <${dct.description}> ?description.
    <${auri}> <${geo}location> ?location.
    ?location ?predicate ?object.
    #FILTER(LANG(?description) = "${language}") #look closer at this
    #FILTER(isLiteral(?description) && langMatches(lang(?description), "en"))
  }`

    await limitedEngine.queryVoid(updateAccommodationQuery, {
      sources: [data.id],
      destination: { type: 'patchSparqlUpdate', value: data.id },
      fetch,
    })
  } else {
    // insert data in case it's a new accommodation
    const insertAccommodationQuery = query`INSERT DATA {${insertions}}`
    await limitedEngine.queryVoid(insertAccommodationQuery, {
      sources: [data.id],
      destination: { type: 'patchSparqlUpdate', value: data.id },
      fetch,
    })

    // save user offers accommodation
    await myEngine.queryVoid(
      query`INSERT DATA {${[
        quad(namedNode(webId), namedNode(hospex + 'offers'), namedNode(auri)),
      ]}}`,
      {
        sources: [personalHospexDocument],
        destination: {
          type: 'patchSparqlUpdate',
          value: personalHospexDocument,
        },
        fetch,
      },
    )
  }

  await myEngine.invalidateHttpCache()
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

const deleteAccommodation = async ({
  id,
  webId,
  personalHospexDocument,
}: {
  id: URI
  webId: URI
  personalHospexDocument: URI
}) => {
  // delete data from accommodation
  const deleteAccommodationQuery = query`
  DELETE {
    <${id}> ?predicate ?object.
    ?location ?lpredicate ?lobject.
  } WHERE {
    <${id}> ?predicate ?object.
    <${id}> <${geo}location> ?location.
    ?location ?lpredicate ?lobject.
  }`

  const deletePersonalProfileReferenceQuery = query`DELETE DATA {
    <${webId}> <${hospex}offers> <${id}>.
  }`

  // delete the accommodation
  await limitedEngine.queryVoid(deleteAccommodationQuery, {
    sources: [id],
    destination: { type: 'patchSparqlUpdate', value: id },
    fetch,
  })

  // delete mention of the accommodation from personalHospexDocument
  await limitedEngine.queryVoid(deletePersonalProfileReferenceQuery, {
    sources: [personalHospexDocument],
    destination: { type: 'patchSparqlUpdate', value: personalHospexDocument },
    fetch,
  })

  // delete file if empty
  const file = await (await fetch(id)).text()
  const parser = new Parser()
  const quads = parser.parse(file)
  if (quads.length === 0) await fetch(id, { method: 'DELETE' })

  // invalidate cache for updated documents
  await Promise.all(
    [id, personalHospexDocument].map(uri =>
      myEngine.invalidateHttpCache(removeHashFromURI(uri)),
    ),
  )
  // await myEngine.invalidateHttpCache()
}

const joinCommunity = async ({
  communityId,
  webId,
  personalHospexDocument,
  storage,
}: {
  webId: URI
  communityId: URI
  personalHospexDocument: URI
  storage: URI
}) => {
  // get community group
  const communityQuery = query`
    SELECT ?group WHERE {
        <${communityId}>
            <${rdf.type}> <${sioc.Community}>;
            <${sioc.has_usergroup}> ?group.
    }
  `
  const bindingsStream = await myEngine.queryBindings(communityQuery, {
    sources: [communityId],
    fetch,
  })
  const response = await bindingsStream.toArray()
  const groupId = response[0].get('group')?.value
  if (!groupId) throw new Error("Community doesn't advertise group to join")

  // add webId to group
  const addWebIdQuery = query`INSERT DATA {
    <${groupId}> <${vcard.hasMember}> <${webId}>.
  }`
  await myEngine.queryVoid(addWebIdQuery, {
    sources: [groupId],
    lenient: true,
    destination: { type: 'patchSparqlUpdate', value: groupId },
    fetch,
  })

  // add community to personal hospex documents (sioc:member_of, vcard:memberOf)
  const addToPersonalHospexDocument = query`INSERT DATA {
    <${webId}>
        <${sioc.member_of}> <${communityId}>;
        <${hospex}storage> <${storage}>.
  }`
  await myEngine.queryVoid(addToPersonalHospexDocument, {
    sources: [personalHospexDocument],
    lenient: true,
    destination: { type: 'patchSparqlUpdate', value: personalHospexDocument },
    fetch,
  })

  // update storage permissions so everybody from the group can read the stuff
  const addGroupPermissions = query`INSERT DATA {
    <${storage}.acl#Read>
        <${rdf.type}> <${acl.Authorization}>;
        <${acl.accessTo}> <${storage}>;
        <${acl.default__workaround}> <${storage}>;
        <${acl.mode}> <${acl.Read}>;
        <${acl.agentGroup}> <${groupId}>.
  }`
  await myEngine.queryVoid(addGroupPermissions, {
    sources: [storage + '.acl'],
    lenient: true,
    destination: { type: 'patchSparqlUpdate', value: storage + '.acl' },
    fetch,
  })

  await myEngine.invalidateHttpCache()
}
