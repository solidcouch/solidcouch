---
title: Hospex Data
---

# Hospex Data

How are hospex data structured?

Data organization is not finalized and may change.

Person can keep their data separate for each community, or share them among communities.

## Personal Hospex Document

- SHOULD be discoverable from public type index via `hospex:PersonalHospexDocument` predicate.
- Defines its audience community via `sioc:member_of` predicate. The community defines particular audience groups.
- Links accommodations offered by the hospex document owner via `hospex:offers` predicate.
- The audience defined with `hospex:offers` MUST be able to read the hospex document. Other audiences (individuals or groups) MAY also be able read it.
- The audiences defined with `hospex:offers` SHOULD be able to read the offered accommodations. Other audiences MAY also be able to read accommodations.
- In particular, individuals added as contacts are recommended to be added explicitly to read the particular community.

At the moment, the access is managed per directory. We may manage access per resource, to decouple accommodations and communities. However, this may be more difficult to manage multiple acl/acp.
