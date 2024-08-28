describe('Information about community', () => {
  it('should show linked data about community on homepage', () => {
    const communityData = {
      name: 'name' + Math.floor(Math.random() * 1000),
      about: `about this community - Lorem Ipsum Dolor sic amet`,
      pun: 'This is a funny tagline',
    }
    cy.createRandomAccount().then(account => {
      const communityUrl = account.podUrl + 'community#us'
      cy.setupCommunity({
        community: communityUrl,
        ...communityData,
        logo: { fixture: 'testlogo.png', contentType: 'image/png' },
      }).then(community => {
        cy.updateAppConfig(
          { communityId: community.community },
          { waitForContent: 'Sign in' },
        )
        cy.contains(communityData.name)
        cy.contains(communityData.about)
        cy.contains(communityData.pun)
      })
    })
  })
})
