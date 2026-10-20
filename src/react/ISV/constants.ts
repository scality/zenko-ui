export const BUCKET_TAG_VEEAM_APPLICATION = 'X-Scality-Veeam-Application';
export const BUCKET_TAG_APPLICATION = 'X-Scality-Application';
export const VEEAM_BACKUP_REPLICATION = 'Veeam Backup & Replication';
export const VEEAM_BACKUP_REPLICATION_XML_VALUE = 'Veeam Backup &#38; Replication';
export const VEEAM_OFFICE_365 = 'Veeam Backup for Microsoft 365 (v6, v7)';
export const VEEAM_OFFICE_365_V8 = 'Veeam Backup for Microsoft 365 (v8+)';
export const VEEAM_VBO_APPLICATION = 'Veeam Backup for Microsoft 365';
export const COMMVAULT_APPLICATION = 'Commvault';
export const KASTEN_APPLICATION = 'Kasten';

export const VEEAM_XML_PREFIX = '.system-d26a9498-cb7c-4a87-a44a-8ae204f5ba6c';
export const SYSTEM_XML_CONTENT = `<?xml version="1.0" encoding="UTF-8"?><SystemInfo><ProtocolVersion>"1.0"</ProtocolVersion><ModelName>"ARTESCA v1.7"</ModelName><ProtocolCapabilities><CapacityInfo>true</CapacityInfo><UploadSessions>false</UploadSessions><IAMSTS>false</IAMSTS></ProtocolCapabilities></SystemInfo>`;
export const GET_CAPACITY_XML_CONTENT = (capacity: string) =>
  `<?xml version="1.0" encoding="utf-8" ?><CapacityInfo><Capacity>${capacity}</Capacity><Available>0</Available><Used>0</Used></CapacityInfo>`;
export const VEEAM_DEFAULT_ACCOUNT_NAME = 'Veeam';
export enum VeeamApplicationType {
  VEEAM_BACKUP_REPLICATION = 'Veeam Backup & Replication',
  VEEAM_OFFICE_365 = 'Veeam Backup for Microsoft 365 (v6, v7)',
  VEEAM_OFFICE_365_V8 = 'Veeam Backup for Microsoft 365 (v8+)',
}
export const unitChoices = {
  GiB: 1024 ** 3,
  TiB: 1024 ** 4,
  PiB: 1024 ** 5,
};
export const VEEAM_OBJECT_KEY = `${VEEAM_XML_PREFIX}/capacity.xml`;
export const VEEAM_SYSTEM_KEY = `${VEEAM_XML_PREFIX}/system.xml`;

export const DEFAULT_IMMUTABLE_PERIOD_DAYS = 14;
export const MAX_IMMUTABLE_PERIOD_DAYS = 3650;

export const VEEAM_ARCHIVE_FOLDER_PATH = 'Veeam/Archive/bkp/';
export const VEEAM_BACKUP_CLIENTS_FOLDER_PATH = 'Veeam/Backup/bkp/Clients/';
export const VEEAM_BACKUP_CONFIG_FOLDER_PATH = 'Veeam/Backup/bkp/Config/';
