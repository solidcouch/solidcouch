---
title: Setup
---

# Setup

For a correct functioning of the app, user needs:

- Solid Pod with WAC support
- Solid inbox (or ActivityPub in the future) - to receive linked data notifications
- preferences file - contains link to private type index
- public type index - for discovery of hospex data
- private type index - for discovery of chats
- join a community
- a dedicated data storage for the hospex community
- email verified with email notification service - to receive email notifications

## Pod Setup

At the first sign-in to the app, the user's pod is checked, and

### Generic

These are (draft) standard C2C resources.

https://solid.github.io/webid-profile/

#### Preferences File

#### Type Indexes

https://solid.github.io/type-indexes/

SolidCouch uses both Public and Private Type Index:

- Public - link to hospex document
- Private - link to chat

#### Inbox

Publicly appendable directory for notifications. Any authenticated agent can append to it. This is unsafe. We may replace it with an ActivityPub inbox in the future.

### SolidCouch-specific

#### Hospex document and storage

Hospex document is linked from public type index with predicate `hospex:PersonalHospexDocument`.

Typically located at `/hospex/[community-identifier]/card`.

Read more in [Hospex Data](./hospex-data.md).

It is possible to set up a hospex document for each community, or reuse a hospex document for multiple communities.

## Joining community

This involves becoming a member, and sharing data with other members.
[Read more](./membership.md)

## Email notifications

Email notifications need to be set up in order to send information about:

- new messages
- contact requests
- (future) experiences

[Read more](./notifications.md)
