import { Button, Loading } from '@/components'
import { LocaleTextInput } from '@/components/LocaleTextInput/LocaleTextInput.tsx'
import { withToast } from '@/components/withToast.tsx'
import { useConfig } from '@/config/hooks'
import { useCreateFile, useDeleteFile, useFile } from '@/hooks/data/useFile'
import { useProfile, useUpdateHospexProfile } from '@/hooks/data/useProfile'
import { useAuth } from '@/hooks/useAuth'
import { useAppSelector } from '@/redux/hooks.ts'
import { selectLocale } from '@/redux/uiSlice.ts'
import { Person } from '@/types'
import { file2base64, getContainer } from '@/utils/helpers'
import { Trans, useLingui } from '@lingui/react/macro'
import merge from 'lodash/merge'
import omit from 'lodash/omit'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { FaCamera } from 'react-icons/fa'
import { useNavigate } from 'react-router'
import { EditInterests } from './EditInterests.tsx'
import styles from './EditProfile.module.scss'

export const EditProfile = () => {
  const { communityId } = useConfig()
  const auth = useAuth()
  const navigate = useNavigate()
  const { t } = useLingui()

  const [, , hospexDocument, , hospexProfile] = useProfile(
    auth.webId!,
    communityId,
  )

  const updateHospexProfile = useUpdateHospexProfile()
  const deleteFile = useDeleteFile()
  const createFile = useCreateFile()

  const handleSaveProfile = async (data: PersonPayload) => {
    if (!hospexDocument) throw new Error(t`Hospex document not found`)

    const photo = data.photo?.[0]
    let photoUri: string | undefined
    const previousPhoto = hospexProfile?.photo

    // create new photo if uploaded
    if (photo)
      photoUri = await createFile.mutateAsync({
        uri: getContainer(hospexDocument),
        data: photo,
      })

    // update profile
    await updateHospexProfile({
      hospexDocument,
      personId: auth.webId!,
      data: { ...data, photo: photoUri },
    })

    // delete previous photo if changed
    if (photo && previousPhoto) {
      await deleteFile.mutateAsync({ uri: previousPhoto })
    }

    navigate('..')
  }

  if (!hospexProfile)
    return (
      <Loading>
        <Trans>Fetching profile</Trans>
      </Loading>
    )

  return (
    <div className={styles.container}>
      <EditProfileForm
        initialData={hospexProfile}
        onSubmit={data =>
          withToast(handleSaveProfile(data), {
            pending: t`Updating profile`,
            success: t`Profile updated`,
          })
        }
      />
      <label>
        <Trans>Interests</Trans>
      </label>
      <EditInterests webId={auth.webId!} />
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
  const { t } = useLingui()
  const { register, handleSubmit, watch, setValue, getValues, control } =
    useForm<PersonPayload>({
      defaultValues: omit(initialData, 'photo'),
    })
  const locale = useAppSelector(selectLocale)

  // when data are loaded, update the form
  useEffect(() => {
    if (typeof initialData.name === 'string') setValue('name', initialData.name)
  }, [initialData.name, setValue])
  useEffect(() => {
    if (initialData.about)
      setValue('about', merge({}, initialData.about, getValues('about')))
  }, [getValues, initialData.about, locale, setValue])

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
      <label htmlFor="name">
        <Trans>Name</Trans>
      </label>
      <input
        id="name"
        type="text"
        {...register('name')}
        placeholder={t`Name`}
      />
      <label htmlFor="photo">
        <Trans>Photo</Trans>
      </label>
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
      <label htmlFor="about">
        <Trans>About me</Trans>
      </label>
      <Controller
        control={control}
        name="about"
        render={({ field }) => (
          <LocaleTextInput
            initialData={initialData.about}
            locale={locale}
            rows={5}
            {...field}
            value={field.value!}
          />
        )}
      />

      <Button primary>
        <Trans>Save changes</Trans>
      </Button>
    </form>
  )
}
