import { skipToken } from '@reduxjs/toolkit/dist/query'
import { api } from 'app/services/api'
import { Button } from 'components'
import { FoafProfile } from 'ldo/foafProfile.typings'
import { pick } from 'lodash'
import { useForm } from 'react-hook-form'
import { useNavigate, useOutletContext } from 'react-router-dom'

export const EditProfile = () => {
  const navigate = useNavigate()
  const profile = useOutletContext<FoafProfile>()

  const [updateUser] = api.endpoints.updateUser.useMutation()
  const [createFile] = api.endpoints.createFile.useMutation()
  const { data: documentUrl } = api.endpoints.readDocumentUrl.useQuery(
    profile['@id'] ?? skipToken,
  )
  const [deleteFile] = api.endpoints.deleteFile.useMutation()

  const { register, handleSubmit } = useForm<
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

  return (
    <form onSubmit={handleFormSubmit}>
      Name: <input type="text" {...register('name')} />
      Photo: <input type="file" {...register('photo')} accept="image/*" />
      <Button primary>Update</Button>
    </form>
  )
}
