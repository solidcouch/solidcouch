---
title: Membership
---

# Membership

Currently, a person becomes a member of a community when they are added to the community group. This group serves both as a list of members, and a source of truth for data access.

## Joining a Community

Person becomes a member when they are added to the community's group.

### Open groups

A person sends a `Join` activity to community's inbox, and gets added immediately.

### Invitation-only (not implemented)

Join using an invitation, or get added by other person.

## Access to resources

Other community members need read access to the hospex profile and accommodations.

### WAC

A resource's .acl can have `acl:agentGroup` predicate pointing to a public community's vcard:Group document with a list of members. This is a primary way of sharing data at the moment. The downside is it's centralized and community breaks down if the community pod disappears.

Alternatives:

- `vcard:Group` document can be stored in each member's pod and updated with a dedicated service or by copying it from contacts.
- each person can be listed via `acl:agent` in each .acl document.

### ACP

Currently not supported. Would work well if ACP Matchers could be reused. Then we could have a central list of members, or a list for each member, similar to `vcard:Group` for WAC.

## Leaving a Community

TBD
