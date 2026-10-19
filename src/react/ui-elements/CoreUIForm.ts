/* Import via this deep entry, not the bare '@scality/core-ui': the bare specifier is
   federation-shared and may resolve to a different copy than 'dist/next', and Form distributes
   `responsive`/`error`/`disabled` to its fields through a per-copy React context — a mismatched
   copy silently disables every `responsive` Form. */
export { Form, FormGroup, FormSection } from '@scality/core-ui/dist/index';
