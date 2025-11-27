import { InfoMessage, spacing } from '@scality/core-ui';
import { Text } from '@scality/core-ui/dist/components/text/Text.component';
import { LOCATION_EDITOR_FORCED_LABEL_WIDTH } from '../locations/LocationEditor';
import { Box } from '@scality/core-ui/dist/next';

export const EndpointInfoMessage = ({ hasMargin }: { hasMargin?: boolean }) => {
  return (
    <Box
      style={{
        // Label width + padding + Input width
        width: `calc(20.5rem + 2rem + ${LOCATION_EDITOR_FORCED_LABEL_WIDTH}px)`,
        marginBottom: hasMargin ? spacing.r16 : 0,
      }}
    >
      <InfoMessage
        title="Certificate for HTTPS Endpoint"
        content={
          <Text>
            When using an HTTPS endpoint, you must add the endpoint's SSL/TLS
            certificate to the truststore for secure communication. You can
            check the certificates already present by opening the truststore,
            and import the endpoint's certificate if it is missing.
          </Text>
        }
        link={'/data/truststore'}
        linkText="Open truststore"
      />
    </Box>
  );
};
