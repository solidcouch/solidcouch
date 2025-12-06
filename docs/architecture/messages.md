# Messages

Built-in messaging is based on the [Chat Client-to-Client (C2C) specification](https://solid.github.io/chat/) for data storage, and Linked Data Notifications (LDN) or ActivityPub for notifications.

## Protocol

### Starting a new chat

One person creates a chat channel in their Pod, and give Read + Append access to one or all invited participants. This chat channel owner also writes a message to the channel, and sends a `as:Invite` notification to all invitees' inboxes.

### Inbox

Inboxes can be as follows:

- public append directory on Solid Pod, linked from the person's webid profile document with `ldp:inbox` (not recommended, not secure, as data validation and sender authentication are missing from Solid server implementations)
- authenticated agent append directory on Solid Pod, linked from the person's webid profile document with `ldp:inbox` (safer, but not perfect)
- hospex community members-only append directory on Solid Pod, linked from the hospex profile document with `ldp:inbox` (even safer, but not perfect)
- a dedicated inbox endpoint capable of authenticating, verifying, and validating the received notifications. This endpoint service then saves the authenticated and valid notification to a dedicated storage on the person's pod for the app to process. (safest, most complex)

The discovery and POSTing the notification is independent of the particular inbox implementations above.

### Joining a chat

Upon receiving an `as:Invite` notification, the invitee can choose whether to accept or reject the invitation to chat.

If they **reject**, the invite and message notifications get deleted, a `as:Reject` notification MAY be sent back to other chat participants.

If they **accept**, they append themself as a participant to the chat, send `as:Accept` to all other participants, and proceed with sending messages.

### Sending a message

To send a message, person must attach it to the chat according to the chat specification, and send a notification to all other participants.

Message SHOULD be signed with the message author's key.

### Notifications

- `Invite` is an ActivityStreams notification with actor, object - the chat URI, and target, the person being invited
- `Create`, `Update`, `Delete` - actor must match the authenticated user, object is the URI of the message, inReplyTo is URI of the message being replied to (if any), and context - the chat URI

### Unread messages

The messages that have corresponding `Create` notification in the inbox SHOULD be marked in the UI as unread. When the message gets read, the corresponding notification SHOULD be deleted. The UI MAY keep showing the message as unread until the next refresh, or change to read. Particular way of distinguishing unread and read messages is not mandated.
