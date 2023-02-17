import { handleIncomingRedirect } from '@inrupt/solid-client-authn-browser'
import { useAppDispatch, useAppSelector } from 'app/hooks'
import { api } from 'app/services/api'
import { Header as PageHeader } from 'components'
import { actions, selectAuth } from 'features/auth/authSlice'
import { usePreviousUriAfterSolidRedirect } from 'hooks/usePreviousUriAfterSolidRedirect'
import { Content, Header, Layout } from 'layouts/Layout'
import { acl } from 'rdf-namespaces'
import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

export const App = () => {
  // initialize the app, provide layout

  usePreviousUriAfterSolidRedirect()

  const dispatch = useAppDispatch()
  const auth = useAppSelector(selectAuth)

  useEffect(() => {
    ;(async () => {
      const session = await handleIncomingRedirect({
        restorePreviousSession: true,
      })

      if (session) dispatch(actions.signin(session))
    })()
  }, [dispatch])

  const [readSolidProfile] = api.endpoints.readSolidProfile.useLazyQuery()
  const [updateUser] = api.endpoints.updateUser.useMutation()
  const [saveAccess] = api.endpoints.saveAccess.useMutation()
  const [saveIndex] = api.endpoints.saveIndex.useMutation()

  useEffect(() => {
    ;(async () => {
      if (auth.webId) {
        // try to find hospex document
        // create personal hospex document at hospex/sleepy-bike/card folder
        // in home folder (pim:storage)
        const solidProfile = await readSolidProfile(auth.webId).unwrap()
        const storage = solidProfile.storage?.[0]['@id']
        if (storage) {
          await updateUser({
            id: auth.webId,
            document: storage + 'hospex/sleepy-bike/card',
            data: { name: 'test' },
          })
        }
        // try to change sleepy-bike folder permissions
        await saveAccess({
          url: storage + 'hospex/sleepy-bike/',
          data: {
            '@id': storage + 'hospex/sleepy-bike/.acl#Read',
            type: { '@id': 'Authorization' },
            accessTo: [{ '@id': storage + 'hospex/sleepy-bike/' }],
            mode: [{ '@id': acl.Read }],
          },
        })
        await saveAccess({
          url: storage + 'hospex/sleepy-bike/',
          data: {
            '@id': storage + 'hospex/sleepy-bike/.acl#ReadWriteControl',
            type: { '@id': 'Authorization' },
            accessTo: [{ '@id': storage + 'hospex/sleepy-bike/' }],
            default: { '@id': storage + 'hospex/sleepy-bike/' },
            mode: [
              { '@id': acl.Read },
              { '@id': acl.Write },
              { '@id': acl.Control },
            ],
            agent: [{ '@id': auth.webId }],
          },
        })
        // update public type index
        const publicTypeIndex = solidProfile.publicTypeIndex?.[0]['@id']
        if (publicTypeIndex)
          await saveIndex({
            index: publicTypeIndex,
            id: publicTypeIndex + '#hospex',
            type: 'http://w3id.org/hospex/ns#PersonalHospexDocument',
            location: storage + 'hospex/sleepy-bike/card',
          })
      }
    })()
  }, [auth.webId, readSolidProfile, saveAccess, saveIndex, updateUser])

  return (
    <Layout>
      <Header>
        <PageHeader />
      </Header>
      <Content>
        {auth.isLoggedIn === undefined ? <>Loading...</> : <Outlet />}
      </Content>
    </Layout>
  )
}
