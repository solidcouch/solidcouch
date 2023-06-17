import { Button, Loading } from 'components'
import { communityId } from 'config'
import { useCreateFile, useDeleteFile, useFile } from 'hooks/data/useFile'
import { useProfile, useUpdateHospexProfile } from 'hooks/data/useProfile'
import { useAuth } from 'hooks/useAuth'
import { omit } from 'lodash'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FaCamera } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { Person } from 'types'
import { file2base64, getContainer } from 'utils/helpers'
import { EditInterests } from './EditInterests'
import styles from './EditProfile.module.scss'

export const EditProfile = () => {
  const auth = useAuth()
  const navigate = useNavigate()

  const [profile, , hospexDocument] = useProfile(
    auth.webId as string,
    communityId,
  )

  const updateHospexProfile = useUpdateHospexProfile()
  const deleteFile = useDeleteFile()
  const createFile = useCreateFile()

  const handleSaveProfile = async (data: PersonPayload) => {
    if (!auth.webId) throw new Error('Not signed in (should not happen)')
    if (!hospexDocument) throw new Error('Hospex document not found')

    const photo = data.photo?.[0]
    let photoUri: string | undefined
    const previousPhoto = profile.photo

    // create new photo if uploaded
    if (photo)
      photoUri = await createFile.mutateAsync({
        uri: getContainer(hospexDocument),
        data: photo,
      })

    // update profile
    await updateHospexProfile({
      hospexDocument,
      personId: auth.webId,
      data: { ...data, photo: photoUri },
      language: 'en',
    })

    // delete previous photo if changed
    if (photo && previousPhoto) {
      await deleteFile.mutateAsync({ uri: previousPhoto })
    }

    navigate('..')
  }

  if (!auth.webId) throw new Error('Not signed in (should not happen)')

  if (!profile) return <Loading>Fetching profile</Loading>

  return (
    <div className={styles.container}>
      <EditProfileForm initialData={profile} onSubmit={handleSaveProfile} />
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
  const { register, handleSubmit, watch, setValue } = useForm<PersonPayload>({
    defaultValues: omit(initialData, 'photo'),
  })

  // when data are loaded, update the form
  useEffect(() => {
    if (typeof initialData.name === 'string') setValue('name', initialData.name)
  }, [initialData.name, setValue])
  useEffect(() => {
    if (typeof initialData.about === 'string')
      setValue('about', initialData.about)
  }, [initialData.about, setValue])

  const { data: photo } = useFile(initialData.photo)

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
        <input id="photo" type="file" {...register('photo')} accept="image/*" />
      </label>
      <label htmlFor="about">About me</label>
      <textarea id="about" {...register('about')} />
      <Button primary>Save changes</Button>
    </form>
  )
}
