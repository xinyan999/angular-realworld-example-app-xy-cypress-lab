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

  it('intercepting and modifying the request and response', () => {
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

  it.only('delete an new article in global feed', () => {
    // const userCredentials = {
    //   "user": {
    //       "email": "artem.bondar16@gmail.com",
    //       "password": "CypressTest1"
    //   }
    // }

    const bodyRequest = {
      "article": {
          "title": "Request from API XY",
          "description": "API testing",
          "body": "Angular",
          "tagList": []
      }
  }
    // cy.request('POST','https://api.realworld.io/api/users/login?Con', userCredentials)
    //   .its('body')
    //   .then(body => {
    //     const token = body.user.token
    cy.get('@token').then(token => {
        cy.request({
          method: 'POST',
          url: Cypress.env('apiUrl') + '/api/articles/',
          headers: {
            Authorization: `Token ${token}`
          },
          body: bodyRequest
        }).then(response => {
          expect(response.status).to.equal(200)
        })

        cy.contains('Global Feed').click()
        cy.wait(5000)
        cy.get('.article-preview').first().click()
        cy.get('[class="article-actions"]').contains(' Delete Article ').click()

        cy.request({
          method: 'GET',
          url: Cypress.env('apiUrl') + '/api/articles?limit=10&offset=0',
          headers: {
            Authorization: `Token ${token}`
          }
        }).its('body').then( body => {
          expect(body.articles[0].title).not.to.equal('Request from API XY')
        })

      })
  })

})
