/* eslint jest/expect-expect: 0 */
const userProfile = {
    name: 'Nicolas Humbert',
};

describe('Authentication', () => {
    describe('Dummy test', () => {
        beforeEach(() =>  {
            cy.kcLogin();
        });

        it('should render logged user name somewhere on the page', () =>  {
            cy.visit('/');
            cy.get('.sc-navbar').should('exist');
            cy.get('.sc-navbar').should('contain', userProfile.name);
        });

        afterEach(() =>  {
            cy.kcLogout();
            cy.clearSession();
        });
    });

    // describe('Dummy test2', () => {
    //     beforeEach(() =>  {
    //         cy.kcFakeLogin(userProfile);
    //     });
    //
    //     it('should render logged user name somewhere on the page', () =>  {
    //         console.log('VISIT!!!');
    //         cy.visit('/');
    //         cy.get('.sc-navbar').should('exist');
    //         cy.get('.sc-navbar').should('contain', userProfile.name);
    //     });
    //
    //     afterEach(() =>  {
    //         cy.kcFakeLogout();
    //     });
    // });

    describe('Dummy test2', () => {
        beforeEach(() => {
            cy.kcFakeLogin(userProfile);
        });

        it('visit1', () =>  {
            cy.visit('/');
            cy.get('.sc-navbar').should('exist');
            cy.get('.sc-navbar').should('contain', userProfile.name);
        });

        it('visit2', () =>  {
            cy.visit('/');
        });

        afterEach(() =>  {
            cy.clearSession();
        });
    });
});
