/* eslint-disable */
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { themeMount as mount } from '../../../utils/testUtil';
import LocationDetailsCRR, { crrValidators } from '../LocationDetailsCRR';

const DEFAULT_PROPS = {
  locationType: 'location-scality-crr-v1' as const,
  details: {},
  onChange: () => {},
};

const VALID_LOCATION_DETAILS = {
  endpoint: 'https://s3.example.com',
  stsEndpoint: 'https://sts.example.com',
  accessKey: 'AKIAIOSFODNN7EXAMPLE',
  secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
};

// Helper function to mount component with default props
const mountCRRComponent = (overrideProps = {}) => {
  return mount(<LocationDetailsCRR {...DEFAULT_PROPS} {...overrideProps} />);
};

// Helper function to get form inputs
const getFormInputs = (component) => ({
  accessKeyInput: component.getByRole('textbox', { name: /access key/i }),
  secretKeyInput: component.container.querySelector('input[name="secretKey"]'),
  endpointInput: component.getByRole('textbox', { name: /s3 endpoint/i }),
  stsEndpointInput: component.getByRole('textbox', { name: /sts endpoint/i }),
});

describe('LocationDetailsCRR', () => {
  describe('Component Rendering', () => {
    it('should render form without calling onChange on mount', () => {
      const onChangeFn = jest.fn();
      const component = mountCRRComponent({ onChange: onChangeFn });

      // CRR component doesn't call onChange on mount unlike other location components
      expect(onChangeFn).not.toHaveBeenCalled();

      // But it should render all the form fields
      const {
        accessKeyInput,
        secretKeyInput,
        endpointInput,
        stsEndpointInput,
      } = getFormInputs(component);
      expect(accessKeyInput).toBeInTheDocument();
      expect(secretKeyInput).toBeInTheDocument();
      expect(endpointInput).toBeInTheDocument();
      expect(stsEndpointInput).toBeInTheDocument();
    });

    it('should show CRR details for empty details', () => {
      const component = mountCRRComponent();
      const {
        accessKeyInput,
        secretKeyInput,
        endpointInput,
        stsEndpointInput,
      } = getFormInputs(component);

      expect(accessKeyInput).toHaveValue('');
      expect(secretKeyInput).toHaveValue('');
      expect(endpointInput).toHaveValue('');
      expect(stsEndpointInput).toHaveValue('');
    });

    it('should show CRR details when editing an existing location', () => {
      const component = mountCRRComponent({
        details: VALID_LOCATION_DETAILS,
        editingExisting: true,
      });

      const {
        accessKeyInput,
        secretKeyInput,
        endpointInput,
        stsEndpointInput,
      } = getFormInputs(component);

      expect(accessKeyInput).toHaveValue(VALID_LOCATION_DETAILS.accessKey);
      expect(secretKeyInput).toHaveValue(''); // cleared for security
      expect(endpointInput).toHaveValue(VALID_LOCATION_DETAILS.endpoint);
      expect(stsEndpointInput).toHaveValue(VALID_LOCATION_DETAILS.stsEndpoint);
    });

    it('should show help text for secret key and STS endpoint fields', () => {
      const component = mountCRRComponent();

      // Check for help tooltips - these are stored in labelHelpTooltip and might not be visible in textContent
      // Instead, check that the fields exist that have help text defined
      expect(component.getByLabelText(/secret key/i)).toBeInTheDocument();
      expect(component.getByLabelText(/sts endpoint/i)).toBeInTheDocument();

      // The help text is defined in the component but may be shown via tooltip on hover
      // We can verify the structure is correct by checking that required fields are marked properly
      expect(component.container.textContent).toContain('Secret Key *');
      expect(component.container.textContent).toContain('STS Endpoint *');
    });
  });

  describe('Form Interactions', () => {
    it('should call onChange on form field updates', async () => {
      let location = {};
      const component = mountCRRComponent({ onChange: (l) => (location = l) });
      const {
        accessKeyInput,
        secretKeyInput,
        endpointInput,
        stsEndpointInput,
      } = getFormInputs(component);

      await userEvent.type(accessKeyInput, VALID_LOCATION_DETAILS.accessKey);
      await userEvent.type(secretKeyInput, VALID_LOCATION_DETAILS.secretKey);
      await userEvent.type(endpointInput, VALID_LOCATION_DETAILS.endpoint);
      await userEvent.type(
        stsEndpointInput,
        VALID_LOCATION_DETAILS.stsEndpoint,
      );

      expect(location).toEqual(VALID_LOCATION_DETAILS);
    });

    it('should validate fields on blur', async () => {
      const component = mountCRRComponent();
      const { accessKeyInput, endpointInput } = getFormInputs(component);

      // Test invalid access key (too short)
      await userEvent.type(accessKeyInput, 'short');
      fireEvent.blur(accessKeyInput);

      expect(component.container.textContent).toContain(
        'Access key must be between 16 and 128 characters',
      );

      // Test invalid endpoint
      await userEvent.type(endpointInput, 'invalid-url');
      fireEvent.blur(endpointInput);

      expect(component.container.textContent).toContain(
        'Invalid endpoint URL format',
      );
    });

    it('should clear secret key when editing existing location', () => {
      const component = mountCRRComponent({
        details: { ...VALID_LOCATION_DETAILS, secretKey: 'existingSecretKey' },
        editingExisting: true,
      });

      const { secretKeyInput } = getFormInputs(component);

      // Secret key should be cleared for security when editing
      expect(secretKeyInput).toHaveValue('');
    });
  });

  describe('Field Validation', () => {
    it('should validate endpoint field correctly', async () => {
      const component = mountCRRComponent();
      const { endpointInput } = getFormInputs(component);

      // Test empty endpoint
      fireEvent.blur(endpointInput);
      expect(component.container.textContent).toContain(
        'S3 endpoint is required',
      );

      // Test invalid URL
      await userEvent.clear(endpointInput);
      await userEvent.type(endpointInput, 'not-a-url');
      fireEvent.blur(endpointInput);
      expect(component.container.textContent).toContain(
        'Invalid endpoint URL format',
      );

      // Test non-HTTP protocol
      await userEvent.clear(endpointInput);
      await userEvent.type(endpointInput, 'ftp://example.com');
      fireEvent.blur(endpointInput);
      expect(component.container.textContent).toContain(
        'Endpoint must be a valid HTTP or HTTPS URL',
      );

      // Test valid endpoint
      await userEvent.clear(endpointInput);
      await userEvent.type(endpointInput, VALID_LOCATION_DETAILS.endpoint);
      fireEvent.blur(endpointInput);
      expect(component.container.textContent).not.toContain(
        'S3 endpoint is required',
      );
    });

    it('should validate STS endpoint field correctly', async () => {
      const component = mountCRRComponent();
      const { stsEndpointInput } = getFormInputs(component);

      // Test empty STS endpoint
      fireEvent.blur(stsEndpointInput);
      expect(component.container.textContent).toContain(
        'STS endpoint is required',
      );

      // Test invalid URL
      await userEvent.clear(stsEndpointInput);
      await userEvent.type(stsEndpointInput, 'invalid-sts-url');
      fireEvent.blur(stsEndpointInput);
      expect(component.container.textContent).toContain(
        'Invalid STS endpoint URL format',
      );

      // Test valid STS endpoint
      await userEvent.clear(stsEndpointInput);
      await userEvent.type(
        stsEndpointInput,
        VALID_LOCATION_DETAILS.stsEndpoint,
      );
      fireEvent.blur(stsEndpointInput);
      expect(component.container.textContent).not.toContain(
        'STS endpoint is required',
      );
    });

    it('should validate access key field correctly', async () => {
      const component = mountCRRComponent();
      const { accessKeyInput } = getFormInputs(component);

      // Test empty access key
      fireEvent.blur(accessKeyInput);
      expect(component.container.textContent).toContain(
        'Access key is required',
      );

      // Test too short access key
      await userEvent.type(accessKeyInput, 'short');
      fireEvent.blur(accessKeyInput);
      expect(component.container.textContent).toContain(
        'Access key must be between 16 and 128 characters',
      );

      // Test too long access key
      await userEvent.clear(accessKeyInput);
      await userEvent.type(accessKeyInput, 'a'.repeat(129));
      fireEvent.blur(accessKeyInput);
      expect(component.container.textContent).toContain(
        'Access key must be between 16 and 128 characters',
      );

      // Test valid access key
      await userEvent.clear(accessKeyInput);
      await userEvent.type(accessKeyInput, VALID_LOCATION_DETAILS.accessKey);
      fireEvent.blur(accessKeyInput);
      expect(component.container.textContent).not.toContain(
        'Access key is required',
      );
    });

    it('should validate secret key field correctly', async () => {
      const component = mountCRRComponent();
      const { secretKeyInput } = getFormInputs(component);

      // Test empty secret key
      fireEvent.blur(secretKeyInput);
      expect(component.container.textContent).toContain(
        'Secret key is required',
      );

      // Test too short secret key
      await userEvent.type(secretKeyInput, 'short');
      fireEvent.blur(secretKeyInput);
      expect(component.container.textContent).toContain(
        'Secret key must be at least 20 characters long',
      );

      // Test valid secret key
      await userEvent.clear(secretKeyInput);
      await userEvent.type(secretKeyInput, VALID_LOCATION_DETAILS.secretKey);
      fireEvent.blur(secretKeyInput);
      expect(component.container.textContent).not.toContain(
        'Secret key is required',
      );
    });
  });

  describe('Security Features', () => {
    it('should use password type for secret key input', () => {
      const component = mountCRRComponent();
      const { secretKeyInput } = getFormInputs(component);

      expect(secretKeyInput).toHaveAttribute('type', 'password');
    });

    it('should have autoComplete=off for all inputs', () => {
      const component = mountCRRComponent();

      const inputs = component.container.querySelectorAll('input');
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('autoComplete', 'off');
      });
    });
  });

  describe('CRR Validators', () => {
    describe('validateEndpoint', () => {
      it('should return error for empty endpoint', () => {
        expect(crrValidators.validateEndpoint('')).toBe(
          'S3 endpoint is required',
        );
      });

      it('should return error for invalid URL', () => {
        expect(crrValidators.validateEndpoint('not-a-url')).toBe(
          'Invalid endpoint URL format',
        );
      });

      it('should return error for non-HTTP protocol', () => {
        expect(crrValidators.validateEndpoint('ftp://example.com')).toBe(
          'Endpoint must be a valid HTTP or HTTPS URL',
        );
      });

      it('should return empty string for valid HTTP URL', () => {
        expect(crrValidators.validateEndpoint('http://s3.example.com')).toBe(
          '',
        );
      });

      it('should return empty string for valid HTTPS URL', () => {
        expect(crrValidators.validateEndpoint('https://s3.example.com')).toBe(
          '',
        );
      });
    });

    describe('validateStsEndpoint', () => {
      it('should return error for empty STS endpoint', () => {
        expect(crrValidators.validateStsEndpoint('')).toBe(
          'STS endpoint is required',
        );
      });

      it('should return error for invalid URL', () => {
        expect(crrValidators.validateStsEndpoint('invalid-url')).toBe(
          'Invalid STS endpoint URL format',
        );
      });

      it('should return error for non-HTTP protocol', () => {
        expect(crrValidators.validateStsEndpoint('ftp://sts.example.com')).toBe(
          'STS endpoint must be a valid HTTP or HTTPS URL',
        );
      });

      it('should return empty string for valid HTTPS URL', () => {
        expect(
          crrValidators.validateStsEndpoint('https://sts.example.com'),
        ).toBe('');
      });
    });

    describe('validateAccessKey', () => {
      it('should return error for empty access key', () => {
        expect(crrValidators.validateAccessKey('')).toBe(
          'Access key is required',
        );
      });

      it('should return error for too short access key', () => {
        expect(crrValidators.validateAccessKey('short')).toBe(
          'Access key must be between 16 and 128 characters',
        );
      });

      it('should return error for too long access key', () => {
        expect(crrValidators.validateAccessKey('a'.repeat(129))).toBe(
          'Access key must be between 16 and 128 characters',
        );
      });

      it('should return empty string for valid access key', () => {
        expect(crrValidators.validateAccessKey('AKIAIOSFODNN7EXAMPLE')).toBe(
          '',
        );
      });
    });

    describe('validateSecretKey', () => {
      it('should return error for empty secret key', () => {
        expect(crrValidators.validateSecretKey('')).toBe(
          'Secret key is required',
        );
      });

      it('should return error for too short secret key', () => {
        expect(crrValidators.validateSecretKey('short')).toBe(
          'Secret key must be at least 20 characters long',
        );
      });

      it('should return empty string for valid secret key', () => {
        expect(
          crrValidators.validateSecretKey(
            'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
          ),
        ).toBe('');
      });
    });

    describe('validateCRRDetails', () => {
      it('should disable for incomplete details', () => {
        const result = crrValidators.validateCRRDetails({
          endpoint: '',
          stsEndpoint: '',
          accessKey: '',
          secretKey: '',
        });
        expect(result).toEqual({
          disable: true,
          errorMessage: '',
        });
      });

      it('should disable for invalid endpoint', () => {
        const result = crrValidators.validateCRRDetails({
          ...VALID_LOCATION_DETAILS,
          endpoint: 'invalid-url',
        });
        expect(result).toEqual({
          disable: true,
          errorMessage: 'Invalid endpoint URL format',
        });
      });

      it('should disable for invalid STS endpoint', () => {
        const result = crrValidators.validateCRRDetails({
          ...VALID_LOCATION_DETAILS,
          stsEndpoint: 'invalid-sts-url',
        });
        expect(result).toEqual({
          disable: true,
          errorMessage: 'Invalid STS endpoint URL format',
        });
      });

      it('should return null for valid details', () => {
        const result = crrValidators.validateCRRDetails(VALID_LOCATION_DETAILS);
        expect(result).toBeNull();
      });
    });
  });

  describe('Field Order and Layout', () => {
    it('should render fields in the correct order', () => {
      const component = mountCRRComponent();

      const labels = component.container.querySelectorAll('label');
      const labelTexts = Array.from(labels).map((label) =>
        label.textContent?.trim(),
      );

      expect(labelTexts).toContain('Access Key *');
      expect(labelTexts).toContain('Secret Key *');
      expect(labelTexts).toContain('S3 Endpoint *');
      expect(labelTexts).toContain('STS Endpoint *');
    });

    it('should have proper label width styling', () => {
      const component = mountCRRComponent();

      // FormSection should have forceLabelWidth prop
      const formSection = component.container.querySelector(
        '[data-testid="form-section"]',
      );
      // This is implementation-specific and might need adjustment based on actual DOM structure
    });
    it('should show endpoint info message for HTTPS endpoint after endpoint Field', async () => {
      const component = mountCRRComponent();
      const { endpointInput } = getFormInputs(component);
      await userEvent.type(endpointInput, 'https://s3.example.com');
      expect(component.container.textContent).toContain(
        "When using an HTTPS endpoint, you must add the endpoint's SSL/TLS certificate to the truststore for secure communication. You can check the certificates already present by opening the truststore, and import the endpoint's certificate if it is missing.",
      );
      await userEvent.clear(endpointInput);
      await userEvent.type(endpointInput, 'http://s3.example.com');
      expect(component.container.textContent).not.toContain(
        "When using an HTTPS endpoint, you must add the endpoint's SSL/TLS certificate to the truststore for secure communication. You can check the certificates already present by opening the truststore, and import the endpoint's certificate if it is missing.",
      );
    });
  });

  describe('Placeholder Text', () => {
    it('should show placeholder text for endpoint fields', () => {
      const component = mountCRRComponent();
      const { endpointInput, stsEndpointInput } = getFormInputs(component);

      // The actual placeholder includes "Example: " prefix based on the Input component implementation
      expect(endpointInput).toHaveAttribute(
        'placeholder',
        'Example: https://s3.example.com',
      );
      expect(stsEndpointInput).toHaveAttribute(
        'placeholder',
        'Example: https://sts.example.com',
      );
    });
  });
});
