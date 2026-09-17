/* The Form family must come from this deep entry rather than the bare '@scality/core-ui'.
   The bare specifier is federation-shared, so it resolves to whichever copy the host
   registered, while Input and Select come from 'dist/next' and so always from this app's own
   bundle. Form hands its fields `responsive`, `error` and `disabled` through a React context
   created per copy: across two copies the fields receive none of it and stay at their fixed
   width, which silently disables every `responsive` Form in the app. Both deep entries reach
   Form.component by relative path, so re-exporting the family here keeps a form on one copy. */
export { Form, FormGroup, FormSection } from '@scality/core-ui/dist/index';
