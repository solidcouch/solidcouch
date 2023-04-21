import { ldoApi } from 'app/services/ldoApi'
import { acl, foaf } from 'rdf-namespaces'
import { useAuth } from './useAuth'

export const useSetupHospex = () => {
  const [readSolidProfile] = ldoApi.endpoints.readSolidProfile.useLazyQuery()
  const [updateUser] = ldoApi.endpoints.updateUser.useMutation()
  const [saveAccess] = ldoApi.endpoints.saveAccess.useMutation()
  const [saveTypeRegistration] =
    ldoApi.endpoints.saveTypeRegistration.useMutation()
  const [saveSolidProfile] = ldoApi.endpoints.saveSolidProfile.useMutation()
  const auth = useAuth()

  // TODO add options so users can have a choice
  const setupHospex = async () => {
    if (!auth.webId) {
      throw new Error("We couldn't find your webId")
    }
    // try to find hospex document
    // create personal hospex document at hospex/sleepy-bike/card folder
    // in home folder (pim:storage)
    const solidProfile = await readSolidProfile(auth.webId, true).unwrap()
    const storage = solidProfile.storage?.[0]['@id']

    if (!storage) throw new Error("We couldn't find your storage")

    const sleepyBikeFolder = storage + 'hospex/sleepy-bike/'

    await updateUser({
      id: auth.webId,
      document: sleepyBikeFolder + 'card',
      data: {},
    }).unwrap()

    // try to change sleepy-bike folder permissions
    await saveAccess({
      url: sleepyBikeFolder,
      data: {
        '@id': sleepyBikeFolder + '.acl#Read',
        type: { '@id': 'Authorization' },
        accessTo: [{ '@id': sleepyBikeFolder }],
        mode: [{ '@id': acl.Read }],
      },
    }).unwrap()
    await saveAccess({
      url: sleepyBikeFolder,
      data: {
        '@id': sleepyBikeFolder + '.acl#ReadWriteControl',
        type: { '@id': 'Authorization' },
        accessTo: [{ '@id': sleepyBikeFolder }],
        default: { '@id': sleepyBikeFolder },
        mode: [
          { '@id': acl.Read },
          { '@id': acl.Write },
          { '@id': acl.Control },
        ],
        agent: [{ '@id': auth.webId }],
      },
    }).unwrap()
    // update public type index
    let publicTypeIndex = solidProfile.publicTypeIndex?.[0]['@id']

    // create public type index if we haven't found it
    if (!publicTypeIndex) {
      const newIndex = storage + 'settings/publicTypeIndex.ttl'

      await saveAccess({
        url: newIndex,
        data: {
          '@id': newIndex + '.acl#ReadWriteControl',
          type: { '@id': 'Authorization' },
          accessTo: [{ '@id': newIndex }],
          mode: [
            { '@id': acl.Read },
            { '@id': acl.Write },
            { '@id': acl.Control },
          ],
          agent: [{ '@id': auth.webId }],
        },
      }).unwrap()

      await saveAccess({
        url: newIndex,
        data: {
          '@id': newIndex + '.acl#Read',
          type: { '@id': 'Authorization' },
          accessTo: [{ '@id': newIndex }],
          mode: [{ '@id': acl.Read }],
          agentClass: [{ '@id': foaf.Agent }],
        },
      }).unwrap()

      await saveSolidProfile({
        id: auth.webId,
        data: { publicTypeIndex: [{ '@id': newIndex }] },
      }).unwrap()

      publicTypeIndex = newIndex
    }

    // save hospex datatype to public type index
    await saveTypeRegistration({
      index: publicTypeIndex,
      id: publicTypeIndex + '#hospex',
      type: 'http://w3id.org/hospex/ns#PersonalHospexDocument',
      location: sleepyBikeFolder + 'card',
    }).unwrap()
  }

  return setupHospex
}
