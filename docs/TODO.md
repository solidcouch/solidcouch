# TODO

## Tasks and features

- [ ] make nicer dropdown with radix-ui
- [ ]

---

- [x] translations
- [ ] show loading indicators
- [ ] show errors
- [x] better accommodation search algorithm (show found accommodations sooner)
- [x] fix wasteful queries
- [ ] save about me in multiple languages
- [x] testing - WIP
- [ ] fix compatibility issues among different Solid servers
- [x] setup inbox if it's missing

### Profile

- [x] fix setup of profile, according to latest [WebId Profile specification](https://solid.github.io/webid-profile/), especially create appropriate preferencesFile document with privateTypeIndex

### Messages

- [ ] show new messages without reload (solid notifications, web sockets, or long polling)
- [x] email notifications
- [ ] design, UX
- [ ] implement _Ignore_ button in new conversations (to ignore conversations that person doesn't want to participate in)
- [ ] make sure chats are shown and linked to each other consistently and correctly, even when there are other chats between these two people, and when there are group chats

### Contacts

- [ ] email notifications
- [ ] design, UX

## Milestones

- [x] save separate hospex profile
- [x] making contacts
- [x] adding interests to profile
- [x] email notifications, especially about received messages

## Post-release features (non-essential)

- upload travel plans and invite travellers
- references

## Bugs

- fix the redirect error: Sometimes the app redirects to identity provider, but identity provider fails with
  (i think it happened with solidcommunity.net, which runs NodeSolidServer)
  ```json
  {
    "error": "invalid_request",
    "error_description": "Mismatching redirect uri"
  }
  ```
