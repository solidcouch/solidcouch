import { PersonBadge } from '@/components/PersonBadge/PersonBadge'
import { createChatChannel } from '@/hooks/data/mutations/chat'
import { QueryKey } from '@/hooks/data/types'
import { useSolidProfile } from '@/hooks/data/useProfile'
import { saveTypeRegistration } from '@/hooks/data/useSetupHospex'
import { useAuth } from '@/hooks/useAuth'
import { meeting } from '@/utils/rdf-namespaces'
import { SolidLeafUri } from '@ldo/connected-solid'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'react-toastify'
import { SendMessageForm } from '../messages/SendMessageForm'
import { useSendMessage } from '../messages/useSendMessage'

export const NewChat = () => {
  const auth = useAuth()
  const myWebId = auth.webId as SolidLeafUri
  const personWebId = useParams().webId! as SolidLeafUri

  const [mySolidProfile, { isFetched: isMySolidProfileFetched }] =
    useSolidProfile(auth.webId!)
  const myPrivateTypeIndex =
    mySolidProfile.privateTypeIndex?.toArray()[0]?.['@id']

  const navigate = useNavigate()

  const channelMutation = useMutation({
    mutationFn: createChatChannel,
    onSuccess: () => {
      toast.success(t`Chat channel was created`)
    },
    onError: (error, variables, context) => {
      toast.error(
        t`Creating channel failed` +
          error.name +
          error.message +
          variables +
          context,
      )
    },
  })

  const queryClient = useQueryClient()

  const saveToPrivateTypeIndex = useMutation({
    mutationFn: saveTypeRegistration,
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.rdfDocument, variables.index],
      })
    },
  })

  const [handleSendMessage, { isReady: isSendMessageReady }] = useSendMessage(
    useMemo(
      () => ({
        sender: myWebId,
        receivers: [personWebId],
      }),
      [myWebId, personWebId],
    ),
  )

  if (!myPrivateTypeIndex) {
    return <Trans>Loading</Trans>
  }

  const handleSubmit = async (data: { title: string; message: string }) => {
    const { channel } = await channelMutation.mutateAsync({
      title: data.title,
      owner: myWebId,
      participants: [myWebId, personWebId],
    })
    await saveToPrivateTypeIndex.mutateAsync({
      index: myPrivateTypeIndex,
      type: meeting.LongChat,
      location: channel,
    })
    await handleSendMessage({ message: data.message, channel })
    // const { messageUri, created } = await messageMutation.mutateAsync({
    //   channel,
    //   message: data.message,
    //   maker: myWebId,
    // })
    // await ldnMutation.mutateAsync({
    //   inbox: receiverSolidProfile.inbox['@id']!,
    //   senderId: myWebId,
    //   messageId: messageUri,
    //   chatId: channel,
    //   updated: created,
    //   content: data.message,
    // })
    // await emailNotificationMutation.mutateAsync({
    //   type: 'message',
    //   data: {
    //     from: { id: myWebId, name: myProfile.name },
    //     to: { id: personWebId, name: receiverProfile.name },
    //     messageId: messageUri,
    //     message: data.message,
    //   },
    // })
    navigate(`/messages/${encodeURIComponent(channel)}`)
  }

  return (
    <div>
      <h1>
        <Trans>
          New conversation with <PersonBadge webId={personWebId} />
        </Trans>
      </h1>

      <SendMessageForm
        isNewChat
        disabled={!isSendMessageReady || !isMySolidProfileFetched}
        onSendMessage={data =>
          handleSubmit({ ...data, title: data.title ?? '' })
        }
      />
    </div>
  )
}
