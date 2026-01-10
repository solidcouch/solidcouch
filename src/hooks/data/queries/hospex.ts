import { hospex } from '@/utils/rdf-namespaces'
import { ldhop } from '@ldhop/core'
import { rdf, sioc, solid, space } from 'rdf-namespaces'
import { publicWebIdProfileQuery, webIdProfileQuery } from './profile'

// in public type index, find all personal hospex documents of the person for a particular community, and fetch them
const partialHospexDocumentQuery = ldhop(
  '?publicTypeIndex',
  '?person',
  '?community',
)
  .match(null, rdf.type, solid.TypeRegistration, '?publicTypeIndex')
  .s('?typeRegistration')
  .match('?typeRegistration', solid.forClass, hospex.PersonalHospexDocument)
  .s('?typeRegistrationForHospex')
  .match('?typeRegistrationForHospex', solid.instance)
  .o('?hospexDocument')
  .add()
  .match('?person', sioc.member_of, '?community')
  .g('?hospexDocumentForCommunity')

export const hospexDocumentQuery = ldhop('?person', '?community')
  .concat(publicWebIdProfileQuery)
  .concat(partialHospexDocumentQuery)

export const privateProfileAndHospexDocumentQuery = ldhop(
  '?person',
  '?community',
)
  .concat(webIdProfileQuery)
  .concat(partialHospexDocumentQuery)
  .match('?person', space.preferencesFile, null, '?hospexDocumentForCommunity')
  .o('?hospexSettings')
  // get all communities that are set up
  .match('?person', sioc.member_of)
  .o('?eachCommunity')
  .match('?eachCommunity', sioc.name)
  .o('?communityName')

export const emailVerificationQuery = hospexDocumentQuery

  .match('?person', space.preferencesFile, null, '?hospexDocumentForCommunity')
  .o('?hospexPreferencesFile')
  .match(
    '?person',
    'https://example.com/emailVerificationToken', // TODO parametrize
    null,
    '?hospexPreferencesFile',
  )
  .o('?emailVerificationToken')
