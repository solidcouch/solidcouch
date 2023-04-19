import { skipToken } from '@reduxjs/toolkit/dist/query'
import { api } from 'app/services/api'
import { comunicaApi } from 'app/services/comunicaApi'
import { Button, Loading } from 'components'
import { useAuth } from 'hooks/useAuth'
import { omit } from 'lodash'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FaCamera } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { Person } from 'types'
import { file2base64 } from 'utils/helpers'
import { EditInterests } from './EditInterests'
import styles from './EditProfile.module.scss'

export const EditProfile = () => {
  const auth = useAuth()
  const navigate = useNavigate()

  const { data: hospexProfile } =
    comunicaApi.endpoints.readHospexProfile.useQuery(
      auth.webId ? { id: auth.webId } : skipToken,
    )
  const [saveHospexProfile] =
    comunicaApi.endpoints.saveHospexProfile.useMutation()

  const handleSaveProfile = async ({ photo, ...data }: PersonPayload) => {
    if (!auth.webId) throw new Error('Not signed in (should not happen)')

    await saveHospexProfile({
      data: { id: auth.webId, photo: photo?.[0], ...data },
      language: 'en',
    }).unwrap()
    navigate('..')
  }

  if (!auth.webId) throw new Error('Not signed in (should not happen)')

  if (!hospexProfile) return <Loading>Fetching profile</Loading>

  return (
    <div className={styles.container}>
      <EditProfileForm
        initialData={hospexProfile}
        onSubmit={handleSaveProfile}
      />
      <label>Interests</label>
      <EditInterests webId={auth.webId} />
    </div>
  )
}

type PersonPayload = Pick<Person, 'name' | 'about'> & {
  photo?: FileList
}

const EditProfileForm = ({
  initialData,
  onSubmit,
}: {
  initialData: Partial<Pick<Person, 'name' | 'photo' | 'about'>>
  onSubmit: (data: PersonPayload) => unknown
}) => {
  const { register, handleSubmit, watch } = useForm<PersonPayload>({
    defaultValues: omit(initialData, 'photo'),
  })

  const { data: photo } = api.endpoints.readImage.useQuery(
    initialData.photo || skipToken,
  )

  const handleFormSubmit = handleSubmit(async data => {
    await onSubmit(data)
  })

  const [selectedPhoto, setSelectedPhoto] = useState<string>()

  useEffect(() => {
    const subscription = watch(async (value, { name }) => {
      if (name === 'photo') {
        const file = value.photo?.[0]

        if (file) setSelectedPhoto(await file2base64(file))
      }
    })

    return () => subscription.unsubscribe()
  }, [watch])

  const currentPhoto = selectedPhoto || photo

  return (
    <form onSubmit={handleFormSubmit}>
      <label htmlFor="name">Name</label>
      <input id="name" type="text" {...register('name')} placeholder="Name" />
      <label htmlFor="photo">Photo</label>
      <label
        tabIndex={0}
        htmlFor="photo"
        className={styles.uploadButton}
        style={
          currentPhoto ? { backgroundImage: `url(${currentPhoto})` } : undefined
        }
      >
        <FaCamera />
      </label>
      <input id="photo" type="file" {...register('photo')} accept="image/*" />
      <label htmlFor="about">About me</label>
      <textarea id="about" {...register('about')} />
      <Button primary>Save changes</Button>
    </form>
  )
}
