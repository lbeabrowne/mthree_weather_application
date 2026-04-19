// Test 1: Rendered content assertion

describe('Home page', () => {
  beforeEach(() => {
    cy.visit('/')  // baseUrl is http://localhost:8000
  })

  it('displays the hero heading and tagline', () => {
    cy.get('[data-cy="hero-heading"]')
      .should('be.visible')
      .and('contain.text', 'Welcome to Acme')

    cy.get('[data-cy="hero-tagline"]')
      .should('exist')
  })

  it('has a working CTA button', () => {
    // Test 2: Button click
    cy.get('[data-cy="cta-btn"]')
      .should('be.visible')
      .and('not.be.disabled')
      .click()

    // After click, assert the expected outcome
    cy.url().should('include', '/signup')
  })

  it('renders a list of feature cards', () => {
    cy.get('[data-cy="feature-card"]')
      .should('have.length.at.least', 3)
  })
})