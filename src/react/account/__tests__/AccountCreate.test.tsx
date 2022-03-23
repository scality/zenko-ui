import AccountCreate from '../AccountCreate';
import { reduxMountAct, reduxRender } from '../../utils/test';
import { screen, act } from "@testing-library/react";
import userEvent from '@testing-library/user-event'

describe('AccountCreate', () => {
  it('should render AccountCreate component with no error banner', async () => {
    const component = await reduxMountAct(<AccountCreate />);
    expect(component.find('#zk-error-banner')).toHaveLength(0);
    component.unmount();
  });
  it('should render AccountCreate component with error banner', async () => {
    const errorMessage = 'error message test';
    const component = await reduxMountAct(<AccountCreate />, {
      uiErrors: {
        errorMsg: errorMessage,
        errorType: 'byComponent',
      },
    });
    expect(component.find('#zk-error-banner')).toHaveLength(1);
    expect(component.find('#zk-error-banner').text()).toContain(errorMessage);
    component.unmount();
  });
  // * error input
  //   * button click
  const tests = [
    {
      description: 'should render no error if both name and email are valid',
      name: 'ba',
      email: 'test@test.com',
      expectedNameError: '',
      expectedEmailError: '',
    },
    {
      description: 'should render no error if name, email and quota are valid',
      name: 'ba',
      email: 'test@test.com',
      expectedNameError: '',
      expectedEmailError: '',
    },
    {
      description: 'should render error if name is missing',
      name: '',
      email: 'test@test.com',
      expectedNameError: '"Name" is not allowed to be empty',
      expectedEmailError: '',
    },
    {
      description: 'should render error if email is missing',
      name: 'bart',
      email: '',
      expectedNameError: '',
      expectedEmailError: '"Root Account Email" is not allowed to be empty',
    },
    {
      description: 'should render 2 errors if name and email are missing',
      name: '',
      email: '',
      expectedNameError: '"Name" is not allowed to be empty',
      expectedEmailError: '"Root Account Email" is not allowed to be empty',
    },
    {
      description: 'should render error if name is too short',
      name: 'b',
      email: 'test@test.com',
      expectedNameError: '"Name" length must be at least 2 characters long',
      expectedEmailError: '',
    },
    {
      description: 'should render error if name is too long (> 64)',
      name: 'b'.repeat(65),
      email: 'test@test.com',
      expectedNameError:
        '"Name" length must be less than or equal to 64 characters long',
      expectedEmailError: '',
    },
    {
      description: 'should render error if name is invalid',
      name: '^^',
      email: 'test@test.com',
      expectedNameError: 'Invalid Name',
      expectedEmailError: '',
    },
    {
      description: 'should render error if email is invalid',
      name: 'bart',
      email: 'invalid',
      expectedNameError: '',
      expectedEmailError: 'Invalid Root Account Email',
    },
    {
      description: 'should render error if email is too long (> 256)',
      name: 'bart',
      email: `${'b'.repeat(257)}@long.com`,
      expectedNameError: '',
      expectedEmailError:
        '"Root Account Email" length must be less than or equal to 256 characters long',
    },
    {
      description: 'should render error if quota is invalid',
      name: 'bart',
      email: 'test@test.com',
      expectedNameError: '',
      expectedEmailError: '',
    },
    {
      description: 'should render error if quota is set to 0',
      name: 'bart',
      email: 'test@test.com',
      expectedNameError: '',
      expectedEmailError: '',
    },
  ];
  tests.forEach((t) => {
    it(`Simulate click: ${t.description}`, async () => {
      await reduxRender(<AccountCreate />);

      userEvent.type(screen.getByRole('textbox', { name: /name/i }), t.name);
      userEvent.type(screen.getByRole('textbox', { name: /email/i }), t.email);
      // NOTE: All validation methods in React Hook Form are treated
      // as async functions, so it's important to wrap async around your act.
      await act(async () => {
        userEvent.click(screen.getByRole('button', { name: /create/i }));
      })

      if (t.expectedNameError) {
        expect(
          screen.getByText(new RegExp(`.*${t.expectedNameError}.*`, 'i')),
        ).toBeInTheDocument();
      } else {
        expect(
          screen
            .getByRole('textbox', { name: /name/i })
            .attributes.getNamedItem('aria-invalid')?.value,
        ).toBe('false');
      }

      if (t.expectedEmailError) {
        expect(
          screen.getByText(new RegExp(`.*${t.expectedEmailError}.*`, 'i')),
        ).toBeInTheDocument();
      } else {
        expect(
          screen
            .getByRole('textbox', { name: /email/i })
            .attributes.getNamedItem('aria-invalid')?.value,
        ).toBe('false');
      }
    });
  });
});
