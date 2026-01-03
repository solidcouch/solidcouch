---
title: Notifications
---

# Notifications

Should be sent out when something requires a person's attention or action.

- somebody writes a message
- somebody initiates a contact
- somebody writes a reference
- somebody invites the person (not implemented)
- ...

## Email notifications

Solid specification doesn't support email notifications. We need a dedicated service for this purpose.

### Email verification

There can be something like a Verifiable Credential issued by the email notification service itself or by some other authority. The person can make it readable by an email notification service of their choice.

Currently this proof is stored on the person's pod in a form of JWT token.

### Direct email notifications

Triggered from the app when the other person does the relevant action (e.g. sends a message).

### Webhook email notifications

Triggered by [Solid webhook notification subscription](https://solid.github.io/notifications/webhook-channel-2023) on inbox.
