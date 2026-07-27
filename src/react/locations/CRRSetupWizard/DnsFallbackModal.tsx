import { Modal, Stack, Text } from '@scality/core-ui';
import { Box } from '@scality/core-ui/dist/components/box/Box';
import { Button, Input } from '@scality/core-ui/dist/next';
import { useEffect, useState } from 'react';
import type { HostAlias } from './api/types';

const IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

type Props = {
  isOpen: boolean;
  unresolvedHosts: string[];
  initialAliases: HostAlias[];
  onSubmit: (aliases: HostAlias[]) => void;
  onCancel: () => void;
};

export const DnsFallbackModal = ({ isOpen, unresolvedHosts, initialAliases, onSubmit, onCancel }: Props) => {
  const seedIp = () => initialAliases.find((alias) => unresolvedHosts.includes(alias.hostname))?.ip ?? '';
  const [ip, setIp] = useState(seedIp);

  const hostsKey = unresolvedHosts.join('|');
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-seed only when the host set changes, capturing initialAliases at that moment
  useEffect(() => {
    setIp(seedIp());
  }, [hostsKey]);

  const trimmed = ip.trim();
  const isValid = IPV4.test(trimmed);
  const plural = unresolvedHosts.length > 1;

  return (
    <Modal
      isOpen={isOpen}
      close={onCancel}
      title="Resolve destination hostnames"
      footer={
        <Box style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Stack>
            <Button variant="outline" label="Cancel" onClick={onCancel} />
            <Button
              variant="primary"
              label="Retry Connection"
              disabled={!isValid}
              tooltip={isValid ? undefined : { overlay: 'Enter a valid IPv4 address' }}
              onClick={() => onSubmit(unresolvedHosts.map((hostname) => ({ hostname, ip: trimmed })))}
            />
          </Stack>
        </Box>
      }
    >
      <Stack direction="vertical" gap="r16" style={{ maxWidth: '30rem' }}>
        <Text>
          The destination could not resolve the hostname{plural ? 's' : ''} below. Enter the destination cluster IP to
          reach {plural ? 'them' : 'it'}; it is used only for this setup, no DNS change is made.
        </Text>
        <Stack direction="vertical" gap="r4">
          {unresolvedHosts.map((host) => (
            <Text key={host} variant="Basic">
              • {host}
            </Text>
          ))}
        </Stack>
        <Stack direction="vertical" gap="r4">
          <Text>Destination cluster IP</Text>
          <Input
            id="dns-fallback-ip"
            aria-label="Destination cluster IP"
            noPlaceholderPrefix
            placeholder="10.0.0.10"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
          />
        </Stack>
      </Stack>
    </Modal>
  );
};
