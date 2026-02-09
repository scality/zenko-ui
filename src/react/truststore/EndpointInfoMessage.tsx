import { InfoMessage, spacing } from '@scality/core-ui';
import { Text } from '@scality/core-ui/dist/components/text/Text.component';
import { Box } from '@scality/core-ui/dist/next';
import { LOCATION_EDITOR_FORCED_LABEL_WIDTH } from '../locations/LocationEditor';
import { useConfig, useDeployedMetalk8sInstances } from '../next-architecture/ui/ConfigProvider';

export const EndpointInfoMessage = ({ hasMargin }: { hasMargin?: boolean }) => {
  const { basePath } = useConfig();
  const metalK8sInstances = useDeployedMetalk8sInstances();
  const isMetalK8sEnabled = metalK8sInstances.length > 0;
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
        link={isMetalK8sEnabled ? `${basePath}/truststore` : undefined}
        linkText="Open truststore"
      />
    </Box>
  );
};
