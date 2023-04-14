import { skipToken } from '@reduxjs/toolkit/dist/query'
import { api } from 'app/services/api'
import { Button } from 'components'
import { FoafProfile } from 'ldo/foafProfile.typings'
import { pick } from 'lodash'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FaCamera } from 'react-icons/fa'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { URI } from 'types'
import { file2base64 } from 'utils/helpers'
import { EditInterests } from './EditInterests'
import styles from './EditProfile.module.scss'

export const EditProfile = () => {
  const navigate = useNavigate()
  const profile = useOutletContext<FoafProfile>()

  const [updateUser] = api.endpoints.updateUser.useMutation()
  const [createFile] = api.endpoints.createFile.useMutation()
  const { data: documentUrl } = api.endpoints.readDocumentUrl.useQuery(
    profile['@id'] ?? skipToken,
  )
  const [deleteFile] = api.endpoints.deleteFile.useMutation()

  const { register, handleSubmit, watch } = useForm<
    Pick<FoafProfile, 'name' | 'img' | 'hasPhoto'> & {
      photo: FileList | null
    }
  >({ defaultValues: pick(profile, 'name', 'img', 'hasPhoto') })

  const handleFormSubmit = handleSubmit(async ({ photo, ...data }) => {
    if (photo && documentUrl) {
      const file = photo[0]

      // delete previous file if exists
      if (profile.hasPhoto?.['@id']) {
        await deleteFile(profile.hasPhoto['@id']).unwrap()
      }

      const location = await createFile({
        url: (documentUrl.split('/').slice(0, -1).join('/') + '/') as string,
        data: file,
      }).unwrap()

      if (location) data.hasPhoto = { '@id': location }
    }

    await updateUser({ id: profile['@id'] as string, data }).unwrap()
    navigate('..')
  })

  const [selectedPhoto, setSelectedPhoto] = useState<string>()

  useEffect(() => {
    const subscription = watch(async (value, { name }) => {
      if (name === 'photo') {
        const file = value.photo?.[0]

        if (file) {
          setSelectedPhoto(await file2base64(file))
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [watch])

  const currentPhoto = selectedPhoto || profile.hasPhoto?.['@id']

  return (
    <div>
      <form onSubmit={handleFormSubmit} className={styles.container}>
        <label htmlFor="name">Name</label>
        <input id="name" type="text" {...register('name')} placeholder="Name" />
        <label htmlFor="photo">Photo</label>
        <label
          tabIndex={0}
          htmlFor="photo"
          className={styles.uploadButton}
          style={
            currentPhoto
              ? { backgroundImage: `url(${currentPhoto})` }
              : undefined
          }
        >
          <FaCamera />
        </label>
        <input id="photo" type="file" {...register('photo')} accept="image/*" />
        <Button primary>Save changes</Button>
      </form>

      <EditInterests webId={profile['@id'] as URI} />
    </div>
  )
}
