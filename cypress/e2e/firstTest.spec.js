/// <reference types="cypress" />

describe('Test with backend', () => {
  beforeEach('log to the app', () => {
    // cy.intercept('GET', 'https://api.realworld.io/api/tags', {fixture: 'tags.json'})
    // cy.intercept('GET', '**/tags', {fixture: 'tags.json'})
    cy.intercept({method: 'GET', path: 'tags'}, {fixture: 'tags.json'})
    cy.loginToApplication()
  })

  it('verify correct request and response', () => {
    // intercept must be called before the request
    cy.intercept('POST','https://api.realworld.io/api/articles/').as('postArticle')
    cy.contains(' New Article ').click()
    cy.get('[formcontrolname="title"]').type('New Article Title Test')
    cy.get('[formcontrolname="description"]').type('This is a description')
    cy.get('[formcontrolname="body"]').type('Body of the article')
    cy.contains(' Publish Article ').click()

    cy.wait('@postArticle').then( xhr => {
      console.log(xhr)
      expect(xhr.response.statusCode).to.equal(200)
      expect(xhr.request.body.article.body).to.equal('Body of the article')
      expect(xhr.response.body.article.description).to.equal('This is a description')
    })
  })

  it('verify popular tags are displayed', ()=> {
    cy.get('.tag-list')
    .should('contain', 'cypress')
    .and('contain', 'automation')
    .and('contain', 'test')
  })

  it('verify global feed likes count', () => {
    cy.intercept('GET', 'https://api.realworld.io/api/articles/feed*', '{"articles":[],"articlesCount":0}')
    cy.intercept('GET', 'https://api.realworld.io/api/articles*', {fixture: 'articles.json'})
    cy.contains(' Global Feed ').click()
    cy.get('app-article-list button').then(heartlist => {
      expect(heartlist[0]).to.contain('1')
      expect(heartlist[1]).to.contain('5')
    })

    cy.fixture('articles.json').then(file => {
      const articleLink = file.articles[1].slug
      file.articles[1].favoritesCount = 6
      cy.intercept('POST', 'https://api.realworld.io/api/articles/'+articleLink+'/favorite', file)
    })

    cy.get('app-article-list button').eq(1).click().should('contain', '6')
  })

  it.only('intercepting and modifying the request and response', () => {
    // intercept must be called before the request
    //1.
    // cy.intercept('POST','**/articles', req => {
    //   req.body.article.description = 'This is a description 2'
    // }).as('postArticle')
    //2.
    cy.intercept('POST','**/articles', req => {
      req.reply(res => {
        expect(res.body.article.description).to.equal('This is a description')
        res.body.article.description = 'This is a description 2'
      })
    }).as('postArticle')

    cy.contains(' New Article ').click()
    cy.get('[formcontrolname="title"]').type('New Article Title Test')
    cy.get('[formcontrolname="description"]').type('This is a description')
    cy.get('[formcontrolname="body"]').type('Body of the article')
    cy.contains(' Publish Article ').click()

    cy.wait('@postArticle')
    cy.get('@postArticle').then( xhr => {
      console.log(xhr)
      expect(xhr.response.statusCode).to.equal(200)
      expect(xhr.request.body.article.body).to.equal('Body of the article')
      expect(xhr.response.body.article.description).to.equal('This is a description 2')
    })
  })

})
