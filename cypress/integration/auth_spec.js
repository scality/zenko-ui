/* eslint jest/expect-expect: 0 */
const userProfile = {
    name: 'Nicolas Humbert',
};

describe('Authentication with keycloak', () => {
    describe('User authenticated', () => {
        beforeEach(() =>  {
            cy.kcLogin();
        });

        it('should render user name', () =>  {
            cy.visit('/');
            cy.get('.sc-navbar').should('exist');
            cy.get('.sc-navbar').should('contain', userProfile.name);
        });

        afterEach(() =>  {
            cy.kcLogout();
        });
    });

    describe('User not authenticated', () => {
        it('should not render user name', () =>  {
            cy.visit('/');
            cy.get('.sc-navbar').should('not.exist');
            cy.url();
        });
    });
});

describe('Authentication with mocked authentication process', () => {
    describe('User authenticated', () => {
        beforeEach(() => {
            cy.kcFakeLogin(userProfile);
        });

        it('should render user name', () =>  {
            cy.visit('/');
            cy.get('.sc-navbar').should('exist');
            cy.get('.sc-navbar').should('contain', userProfile.name);
        });

        afterEach(() =>  {
            cy.clearSession();
        });
    });

    describe('User not authenticated', () => {
        it('should not render user name', () =>  {
            cy.visit('/');
            cy.get('.sc-navbar').should('not.exist');
            cy.url();
        });
    });
});
