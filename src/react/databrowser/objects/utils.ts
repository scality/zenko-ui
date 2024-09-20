import { DateTime, Duration } from 'luxon';
import type { ObjectMetadata } from '../../../types/s3';

function getDefaultRetention(objectMetadata: ObjectMetadata | null) {
  const isDefaultRetentionEnabled =
    objectMetadata?.objectRetention !== undefined;

  const defaultRetentionUntilDate =
    objectMetadata?.objectRetention?.retainUntilDate;
  const defaultRetentionMode =
    objectMetadata?.objectRetention?.mode || 'GOVERNANCE';
  return {
    isDefaultRetentionEnabled,
    defaultRetentionUntilDate,
    defaultRetentionMode,
  };
}

// input date format yyyy-mm-dd hh:mm:ss "2017-05-15 09:24:15"
// get the min value for calendar picker in object retention setting, with yyyy-mm-dd as format
function getDefaultMinRetainUntilDate(d: Date, mode: string): string {
  const futureDate = DateTime.now()
    .plus(
      Duration.fromObject({
        days: 1,
      }),
    )
    .toISODate();

  if (!d) {
    return futureDate;
  }

  // when we switch mode from "GOVERNANCE" to "COMPLIANCE", we should be able to keep the same previous retain date
  const previousRetainUntilDate =
    mode === 'GOVERNANCE'
      ? DateTime.fromJSDate(d).toISODate()
      : DateTime.fromJSDate(d)
          .plus(
            Duration.fromObject({
              days: 1,
            }),
          )
          .toISODate();
  return previousRetainUntilDate.valueOf() > futureDate.valueOf()
    ? previousRetainUntilDate
    : futureDate;
}

function getRetainUntilDateHint(d: string): string {
  const now = DateTime.now();
  const retainUntilDate = DateTime.fromISO(d);
  const diffInDays = retainUntilDate.diff(now, 'days');
  const days = Math.floor(diffInDays.toObject().days);

  if (days < 1) {
    return '(within 24 hours from now)';
  }

  if (days === 1) {
    return '(1 day from now)';
  }

  if (days >= 2) {
    return `(${days} days from now)`;
  }

  return '';
}

export {
  getDefaultRetention,
  getDefaultMinRetainUntilDate,
  getRetainUntilDateHint,
};