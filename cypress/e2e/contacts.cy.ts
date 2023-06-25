import { CommunityConfig } from '../support/setup'

describe("person's contacts", () => {
  beforeEach(() => {
    cy.get<CommunityConfig>('@community').then(community => {
      cy.createPerson(
        { name: 'My Name', description: { en: 'My description' } },
        community,
      )
    })
  })
  it(
    'should show my contacts, including unconfirmed and pending, and confirm & remove button',
  )
  it("should show other person's confirmed (2-directional) contacts", () => {})

  it(
    'should allow adding other person as contact and send contact request notification',
  )

  it('should allow removing other person as contact')

  it('should allow confirming other person as contact')
})
