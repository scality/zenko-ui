import { getDateDaysDiff } from '@scality/core-ui';
import { ParsedCertificate } from '@scality/certchain';

const formatNumberToInternationalString = (number: number): string => {
  return Intl.NumberFormat('fr-FR').format(number);
};

export function formatExpiryDate(expiresOn: Date): {
  shortFormat: string;
  shortFormatWithPrefix: string;
  longFormat: string;
  longFormatWithPrefix: string;
  status: 'healthy' | 'warning' | 'critical';
} {
  const now = new Date();
  const diffInDays = getDateDaysDiff(now, expiresOn, 'days');
  const diffInDaysInternationalString =
    formatNumberToInternationalString(diffInDays);
  const shortFormat = Intl.DateTimeFormat('fr-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false,
  }).format(expiresOn);

  const timeFormat = Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(expiresOn);

  const longFormat = `${shortFormat} ${timeFormat}`;

  let prefix = '';
  let status: 'healthy' | 'warning' | 'critical';

  if (diffInDays > 14) {
    prefix = `In ${diffInDaysInternationalString} days - `;
    status = 'healthy';
  } else if (diffInDays > 1) {
    prefix = `In ${diffInDaysInternationalString} days - `;
    status = 'warning';
  } else if (diffInDays === 1) {
    prefix = `In ${diffInDaysInternationalString} day - `;
    status = 'warning';
  } else if (diffInDays === 0) {
    prefix =
      now < expiresOn ? `Expiration date is today - ` : 'Expired today - ';
    status = 'critical';
  } else if (diffInDays === -1) {
    prefix = `Expired 1 day ago - `;
    status = 'critical';
  } else {
    // diffInDays < -1
    const absoluteDiff = Math.abs(diffInDays);
    prefix = `Expired ${formatNumberToInternationalString(
      absoluteDiff,
    )} days ago - `;
    status = 'critical';
  }

  return {
    shortFormat,
    shortFormatWithPrefix: `${prefix}${shortFormat}`,
    longFormat,
    longFormatWithPrefix: `${prefix}${longFormat}`,
    status,
  };
}

export function downloadCertificate(
  certificate: ParsedCertificate & { originalPEM?: string },
): void {
  if (!certificate.originalPEM) {
    console.error('Original PEM not available for download');
    return;
  }

  const filename = `${
    certificate.commonName || certificate.name || 'certificate'
  }.pem`;
  const blob = new Blob([certificate.originalPEM], {
    type: 'application/x-pem-file',
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
