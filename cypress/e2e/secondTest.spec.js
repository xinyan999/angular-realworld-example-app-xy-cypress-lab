describe('Test log out', () => {
  beforeEach('login to the app', () => {
    cy.loginToApplication()
  })

  // it('verify log out successfully', {retries:2}, {browser: 'chrome'}, () => {
  it('verify log out successfully', {retries:2}, () => {
    cy.contains(' Settings ').click()
    cy.contains(' Or click here to logout. ').click()
    cy.get('.navbar-nav').should('contain', ' Sign in ')
  })
})
