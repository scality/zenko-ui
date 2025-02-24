import React from 'react';
import { VeeamVBOCardInfo } from '../modules/veeam-vbo';
import { ISVCardConfig } from '../types';
import CohesityLogo from './Modal/Logos/CohesityLogo';
import CteraLogo from './Modal/Logos/CteraLogo';
import HycuLogo from './Modal/Logos/HycuLogo';
import KastenLogo from './Modal/Logos/KastenLogo';
import RubrikLogo from './Modal/Logos/RubrikLogo';
import SplunkLogo from './Modal/Logos/SplunkLogo';
import VeritasLogo from './Modal/Logos/VeritasLogo';
import ZertoLogo from './Modal/Logos/ZertoLogo';
import { VeeamCardInfo } from '../modules/veeam';
import { CommvaultCardInfo } from '../modules/commvault';

export const ISVList: ISVCardConfig[] = [
  VeeamVBOCardInfo,
  VeeamCardInfo,
  CommvaultCardInfo,
  {
    id: 'kasten',
    name: 'Kasten',
    application: 'Veeam Kasten',
    documentationLink:
      '/docs/partner_applications/validated_designs/kasten.html',
    logo: <KastenLogo />,
  },
  {
    id: 'rubrik',
    name: 'Rubrik',
    logo: <RubrikLogo />,
    documentationLink:
      '/docs/partner_applications/validated_designs/rubrik_security_cloud.html',
  },

  {
    id: 'zerto',
    name: 'Zerto',
    logo: <ZertoLogo />,
    documentationLink:
      '/docs/partner_applications/validated_designs/zerto/zerto.html',
  },
  {
    id: 'splunk',
    name: 'Splunk',
    logo: <SplunkLogo />,

    documentationLink:
      '/docs/partner_applications/validated_designs/splunk.html',
  },
  {
    id: 'hycu',
    name: 'Hycu',
    logo: <HycuLogo />,
    documentationLink:
      '/docs/partner_applications/validated_designs/hycu_enterprise-clouds.html',
  },
  {
    id: 'ctera',
    name: 'Ctera',
    logo: <CteraLogo />,
    documentationLink:
      '/docs/partner_applications/validated_designs/ctera/index.html',
  },

  {
    id: 'veritas',
    name: 'Veritas NetBackup',
    logo: <VeritasLogo />,
    documentationLink:
      '/docs/partner_applications/validated_designs/veritas_netbackup.html',
  },

  {
    id: 'cohesity',
    name: 'Cohesity',
    logo: <CohesityLogo />,
    documentationLink:
      '/docs/partner_applications/validated_designs/cohesity_cloud_archive.html',
  },
];

export type ISVConfigurationProps = {
  application: 'Veeam' | 'Commvault';
  bucketTag: 'Veeam' | 'Commvault';
  logo: React.JSX.Element;
  fieldOverrides: [
    {
      name: string;
      label?: string;
      tooltip?: React.JSX.Element;
      helpText?: string;
      placeholder?: string;
      additionnal?: React.JSX.Element[];
    },
  ];
};
