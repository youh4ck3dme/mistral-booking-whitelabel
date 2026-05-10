'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import styles from './compute-landing.module.css';

type ProcessStep = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
};

type SecurityItem = {
  title: string;
  description: string;
  image: string;
  icon: 'shield' | 'lock' | 'eye' | 'file-check';
};

type Testimonial = {
  quote: string;
  author: string;
  role: string;
  metric: string;
  metricLabel: string;
  company: string;
};

const navItems = [
  { href: '#features', label: 'Capabilities' },
  { href: '#how-it-works', label: 'Process' },
  { href: '#infra', label: 'Infra' },
  { href: '#integrations', label: 'Integrations' },
  { href: '#security', label: 'Security' },
];

const heroStats = [
  { value: '3500+', label: 'autonomous agents active' },
  { value: '99.7%', label: 'distributed uptime' },
  { value: '<50ms', label: 'execution latency' },
];

const processSteps: ProcessStep[] = [
  {
    id: 'define',
    number: '01',
    title: 'Define',
    subtitle: 'your agent',
    description:
      'Describe what your agent should do. Set its capabilities, constraints, and goals in natural language or code.',
  },
  {
    id: 'assign',
    number: '02',
    title: 'Assign',
    subtitle: 'the task',
    description:
      'Give your agent a mission. It breaks down complex tasks into steps and executes them autonomously.',
  },
  {
    id: 'monitor',
    number: '03',
    title: 'Monitor',
    subtitle: '& scale',
    description:
      'Track progress in real-time. Spin up more agents as needed. Pay only for compute used.',
  },
];

const integrations = [
  {
    category: 'LLM',
    label: 'OpenAI',
    path: 'M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.843-3.372 2.02-1.163a.076.076 0 0 1 .071 0l4.83 2.786a4.49 4.49 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.402-.678zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z',
  },
  {
    category: 'LLM',
    label: 'Anthropic',
    path: 'M13.827 3.52h3.603L24 20.48h-3.603l-6.57-16.96zm-7.258 0h3.767L16.906 20.48h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 10.959L8.453 7.687 6.205 14.48H10.7z',
  },
  {
    category: 'Comms',
    label: 'Slack',
    path: 'M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z',
  },
  {
    category: 'Code',
    label: 'GitHub',
    path: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  },
  {
    category: 'PM',
    label: 'Jira',
    path: 'M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.762a1.005 1.005 0 0 0-1.001-1.005zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24.017 12.49V1.005A1.005 1.005 0 0 0 23.013 0z',
  },
  {
    category: 'Storage',
    label: 'AWS S3',
    path: 'M11.87 0l.36.21v23.18l-.36.21-9.56-4.54V4.54L11.87 0zm.79.21l9.56 4.54v14.5l-9.56 4.54V.21zM5.87 16.26l5.21 2.48v-4.96l-5.21-1.02v3.5zm0-4.2l5.21 1.02V8.12L5.87 10.6v1.46zm0-2.22l5.21-2.48V3.4l-5.21 2.48v3.96zm7 6.42l5.21-2.48V10.6l-5.21 1.02v4.64zm0-5.42l5.21-1.02V5.88l-5.21 2.48v2.48z',
  },
  {
    category: 'Docs',
    label: 'Google Drive',
    path: 'M6.28 0l5.76 9.97H0L6.28 0zm11.44 0L24 9.97h-5.73L12.52 0h5.2zm1.16 10.82L24 19.94 17.72 24l-3.21-5.56 4.37-7.62zm-9.96.12L12 13.5l3.08-2.56H8.92zm-4.13 0L0 19.94l6.28 4.06 6.72-11.64-3.21-2.44zM12 14.06l-5.52 9.57h11.04L12 14.06z',
  },
  {
    category: 'CRM',
    label: 'Salesforce',
    path: 'M9.765 3.782a4.31 4.31 0 0 1 3.104-1.314 4.35 4.35 0 0 1 3.91 2.43 3.304 3.304 0 0 1 1.38-.301 3.33 3.33 0 0 1 3.327 3.33c0 .27-.033.53-.092.78a2.978 2.978 0 0 1-.485 5.88H6.58a3.644 3.644 0 0 1-.573-7.236 4.32 4.32 0 0 1 3.758-3.57z',
  },
  {
    category: 'Marketing',
    label: 'HubSpot',
    path: 'M22.175 11.282a4.258 4.258 0 0 0-3.651-4.205V5.047a1.558 1.558 0 0 0 .898-1.406V3.6a1.561 1.561 0 0 0-3.123 0v.041c0 .626.372 1.166.898 1.406V7.08a4.239 4.239 0 0 0-2.027.78L8.916 4.28a1.856 1.856 0 0 0 .065-.47A1.855 1.855 0 1 0 7.125 5.66l5.92 3.51a4.267 4.267 0 0 0 .44 5.51l-1.75 1.75a1.404 1.404 0 0 0-.407-.062 1.42 1.42 0 1 0 1.42 1.42 1.404 1.404 0 0 0-.062-.407l1.73-1.73a4.27 4.27 0 1 0 7.759-4.369zm-4.27 2.764a1.84 1.84 0 1 1 0-3.68 1.84 1.84 0 0 1 0 3.68z',
  },
  {
    category: 'Auto',
    label: 'Zapier',
    path: 'M14.974 10.61a5.978 5.978 0 0 1-.551 2.507H24v-5.01H14.422a5.978 5.978 0 0 1 .552 2.503zm-5.95 0a5.978 5.978 0 0 1 .552-2.503H0v5.01h9.576a5.978 5.978 0 0 1-.551-2.507zM12 16.56a5.966 5.966 0 0 1-2.505-.55v9.564h5.01V16.01A5.966 5.966 0 0 1 12 16.56zm0-11.9a5.97 5.97 0 0 1 2.505.55V5.646a.555.555 0 0 0 0-.075V-.43h-5.01v5.643A5.97 5.97 0 0 1 12 4.66z',
  },
  {
    category: 'Data',
    label: 'Snowflake',
    path: 'M13.1 1.049a1.1 1.1 0 0 0-2.2 0v3.388L8.746 2.283a1.1 1.1 0 0 0-1.556 1.556L9.957 6.6H6.57a1.1 1.1 0 0 0 0 2.2h3.387l-2.764 2.764a1.1 1.1 0 0 0 1.555 1.555L11.9 9.966v2.434a1.1 1.1 0 0 0 2.2 0V9.966l2.752 2.753a1.1 1.1 0 0 0 1.556-1.555L15.644 8.8H19.03a1.1 1.1 0 1 0 0-2.2h-3.386l2.766-2.761a1.1 1.1 0 0 0-1.556-1.556L14.1 4.437V1.049zM1.049 10.9a1.1 1.1 0 0 0 0 2.2h3.388l-2.154 2.154a1.1 1.1 0 0 0 1.556 1.556L6.6 14.043v3.387a1.1 1.1 0 0 0 2.2 0V14.043l2.764 2.767a1.1 1.1 0 0 0 1.555-1.556L9.966 12.1h2.434a1.1 1.1 0 0 0 0-2.2H9.966l2.753-2.752a1.1 1.1 0 0 0-1.555-1.556L8.8 8.356V4.97a1.1 1.1 0 0 0-2.2 0v3.386L4.439 5.59A1.1 1.1 0 0 0 2.883 7.146L5.437 9.9H1.049zm11.851 2.2h2.434l-2.767 2.764a1.1 1.1 0 0 0 1.556 1.556L16.87 14.662v2.768a1.1 1.1 0 0 0 2.2 0v-3.387l2.154 2.154a1.1 1.1 0 0 0 1.556-1.556L20.626 12.4h2.325a1.1 1.1 0 1 0 0-2.2H20.62l2.117-2.754a1.1 1.1 0 0 0-1.556-1.556L18.429 8.642V5.256a1.1 1.1 0 1 0-2.2 0V8.35l-2.764-2.766a1.1 1.1 0 0 0-1.556 1.556L14.662 9.9H12.9a1.1 1.1 0 1 0 0 2.2h-.001zm1.1 1.1v2.434l-2.753 2.752a1.1 1.1 0 0 0 1.555 1.556L15.556 18.2v3.386a1.1 1.1 0 0 0 2.2 0V18.2l2.154 2.742a1.1 1.1 0 0 0 1.556-1.556l-2.154-2.154h3.387a1.1 1.1 0 1 0 0-2.2H14z',
  },
  {
    category: 'Payments',
    label: 'Stripe',
    path: 'M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z',
  },
];

const securityItems: SecurityItem[] = [
  {
    title: 'Isolated execution',
    description: 'Each agent runs in its own secure sandbox.',
    image: 'https://projects.larsenevans.com/images/isolated.jpg',
    icon: 'shield',
  },
  {
    title: 'Encrypted memory',
    description: 'Data encrypted at rest and in transit.',
    image: 'https://projects.larsenevans.com/images/encrypted.jpg',
    icon: 'lock',
  },
  {
    title: 'Full audit trails',
    description: 'Every action logged and inspectable.',
    image: 'https://projects.larsenevans.com/images/audit.jpg',
    icon: 'eye',
  },
  {
    title: 'Permission boundaries',
    description: 'Principle of least privilege by design.',
    image: 'https://projects.larsenevans.com/images/permissions.jpg',
    icon: 'file-check',
  },
];

const developerFeatures = [
  {
    title: 'TypeScript native',
    description: 'Full type safety for agent configs and responses.',
  },
  {
    title: 'Streaming results',
    description: 'Watch your agents think and act in real-time.',
  },
  {
    title: 'Multi-model support',
    description: 'OpenAI, Anthropic, Mistral, or bring your own.',
  },
  {
    title: 'Local debugging',
    description: 'Test agents locally before deploying to cloud.',
  },
];

const testimonials: Testimonial[] = [
  {
    quote:
      'Our agents handle 80% of our customer support tickets autonomously. The ROI was immediate.',
    author: 'Sarah Chen',
    role: 'CTO, Meridian Labs',
    metric: '80%',
    metricLabel: 'Ticket resolution',
    company: 'Meridian Labs',
  },
  {
    quote:
      'We replaced brittle automation chains with resilient agents that run 24/7 across support and operations.',
    author: 'Aaron Vale',
    role: 'VP Operations, Flux Systems',
    metric: '24/7',
    metricLabel: 'Autonomous coverage',
    company: 'Flux Systems',
  },
  {
    quote:
      'The deployment speed is unreal. What used to take weeks in orchestration now ships in a single afternoon.',
    author: 'Mina Patel',
    role: 'Head of Platform, Beacon AI',
    metric: '6x',
    metricLabel: 'Faster rollout',
    company: 'Beacon AI',
  },
  {
    quote:
      'Compute gave us a safe way to let agents operate inside regulated workflows without losing control.',
    author: 'Jonas Reed',
    role: 'Security Lead, Prism Analytics',
    metric: '0',
    metricLabel: 'Security incidents',
    company: 'Prism Analytics',
  },
];

const pricingTiers = [
  {
    number: '01',
    name: 'Explorer',
    description: 'For tinkering and small automations',
    price: '$0',
    suffix: '/month',
    button: 'Start free',
    featured: false,
    items: [
      '3 concurrent agents',
      '1,000 tasks/month',
      'Community support',
      'Basic logging',
      'Public integrations',
    ],
  },
  {
    number: '02',
    name: 'Builder',
    description: 'For teams shipping with agents',
    price: '$65',
    suffix: '/month',
    meta: 'billed annually',
    button: 'Start trial',
    featured: true,
    items: [
      '25 concurrent agents',
      '50,000 tasks/month',
      'Priority support',
      'Full audit trails',
      'Private integrations',
      'Team workspaces',
      'Custom agent roles',
    ],
  },
  {
    number: '03',
    name: 'Scale',
    description: 'For agent-first organizations',
    price: 'Custom',
    button: 'Contact sales',
    featured: false,
    items: [
      'Unlimited agents',
      'Unlimited tasks',
      '24/7 dedicated support',
      'On-premise deployment',
      'SLA guarantee',
      'Custom LLM routing',
      'Advanced security',
      'Dedicated compute',
    ],
  },
];

const footerColumns = [
  {
    title: 'Product',
    links: [
      { label: 'Agent capabilities', href: '#features' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Integrations', href: '#integrations' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'Documentation', href: '#developers' },
      { label: 'Agent SDK', href: '#developers' },
      { label: 'API Reference', href: '#developers' },
      { label: 'Status', href: '#developers' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#', badge: 'Hiring' },
      { label: 'Contact', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'Security', href: '#security' },
    ],
  },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function ArrowUpRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function SecurityIcon({
  icon,
  className,
}: {
  icon: SecurityItem['icon'];
  className?: string;
}) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  };

  switch (icon) {
    case 'shield':
      return (
        <svg {...common}>
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...common}>
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    case 'eye':
      return (
        <svg {...common}>
          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          <path d="m9 15 2 2 4-4" />
        </svg>
      );
  }
}

function SectionLabel({ children, centered = false }: { children: React.ReactNode; centered?: boolean }) {
  return (
    <span className={cx(styles.sectionLabel, centered && styles.sectionLabelCentered)}>
      <span className={styles.sectionLine} />
      {children}
      {centered ? <span className={styles.sectionLine} /> : null}
    </span>
  );
}

export default function ComputeLandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeProcess, setActiveProcess] = useState(0);
  const [activeSecurity, setActiveSecurity] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveTestimonial((current) => (current + 1) % testimonials.length);
    }, 8000);

    return () => window.clearInterval(timer);
  }, []);

  const testimonial = testimonials[activeTestimonial];
  const activeSecurityItem = securityItems[activeSecurity];
  const heroWord = useMemo(
    () =>
      'automate'.split('').map((letter, index) => (
        <span
          key={`${letter}-${index}`}
          className={styles.gradientLetter}
          style={{ animationDelay: `${index * 80}ms` }}
        >
          {letter}
        </span>
      )),
    [],
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <nav className={styles.navShell}>
          <a className={styles.logo} href="#">
            <span className={styles.logoWord}>COMPUTE</span>
            <span className={styles.logoMark}>TM</span>
          </a>

          <div className={styles.navLinks}>
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className={styles.navLink}>
                {item.label}
              </a>
            ))}
          </div>

          <div className={styles.navActions}>
            <Link href="/login" className={styles.signInLink}>
              Sign in
            </Link>
            <a href="#pricing" className={styles.primaryPill}>
              Deploy agent
            </a>
            <button
              type="button"
              className={styles.menuButton}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((current) => !current)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </nav>

        <div className={cx(styles.mobileMenu, mobileOpen && styles.mobileMenuOpen)}>
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={styles.mobileMenuLink}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div className={styles.mobileMenuButtons}>
            <Link href="/login" className={styles.secondaryButton}>
              Sign in
            </Link>
            <a href="#pricing" className={styles.primaryButton}>
              Deploy agent
            </a>
          </div>
        </div>
      </header>

      <section className={styles.heroSection}>
        <div className={styles.heroMedia}>
          <video
            autoPlay
            muted
            loop
            playsInline
            className={styles.heroVideo}
            aria-hidden="true"
          >
            <source
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bg-hero-0BnFGdr81Ifnj3WbBZoNt1KE4D5DMT.mp4"
              type="video/mp4"
            />
          </video>
          <div className={styles.heroGradientLeft} />
          <div className={styles.heroGradientBottom} />
          <div className={styles.gridOverlay} />
        </div>

        <div className={styles.container}>
          <div className={styles.heroContent}>
            <SectionLabel>Autonomous AI agents for distributed computing</SectionLabel>
            <h1 className={styles.heroTitle}>
              <span>Distributed compute,</span>
              <span>
                agents that{' '}
                <span className={styles.gradientWord} aria-label="automate">
                  {heroWord}
                </span>
              </span>
            </h1>
          </div>

          <div className={styles.heroStats}>
            {heroStats.map((stat) => (
              <div key={stat.label} className={styles.heroStat}>
                <span className={styles.heroStatValue}>{stat.value}</span>
                <span className={styles.heroStatLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className={styles.section}>
        <div className={styles.container}>
          <div className={styles.splitHeading}>
            <div>
              <SectionLabel>Capabilities</SectionLabel>
              <h2 className={styles.massiveTitle}>
                Intelligent
                <br />
                <span className={styles.muted}>workers.</span>
              </h2>
            </div>
            <p className={styles.lead}>
              Deploy autonomous AI agents that execute complex tasks across distributed
              infrastructure. No supervision required.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureCanvas} />
            <div className={styles.featureContent}>
              <span className={styles.cardIndex}>01</span>
              <h3 className={styles.cardTitle}>Autonomous Execution</h3>
              <p className={styles.cardText}>
                Deploy AI agents that work independently. They analyze, decide, and
                execute complex multi-step tasks without human intervention.
              </p>
              <div className={styles.metricBlock}>
                <span className={styles.metricValue}>99.7%</span>
                <span className={styles.metricLabel}>task completion</span>
              </div>
            </div>
            <div className={styles.featureImageWrap}>
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Upscaled%20Image%20%2812%29-ng3RrNnsPMJ5CrtOjcPTmhHg01W11q.png"
                alt=""
                width={1280}
                height={1400}
                className={styles.featureImage}
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className={cx(styles.section, styles.processSection)}>
        <div className={styles.processGlow} />
        <div className={styles.container}>
          <div className={styles.processIntro}>
            <div className={styles.processCopy}>
              <SectionLabel>Process</SectionLabel>
              <h2 className={styles.massiveTitle}>
                Define.
                <br />
                <span className={styles.fade1}>Deploy.</span>
                <br />
                <span className={styles.fade2}>Scale.</span>
              </h2>
            </div>
            <div className={styles.processTreeWrap}>
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/tree-uAia6REvB137CQyHFCf0za3O6h2zKO.png"
                alt=""
                width={1200}
                height={1400}
                className={styles.processTree}
              />
            </div>
          </div>

          <div className={styles.processGrid}>
            {processSteps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                className={cx(
                  styles.processCard,
                  index === activeProcess && styles.processCardActive,
                )}
                onClick={() => setActiveProcess(index)}
              >
                <div className={styles.processHead}>
                  <span className={styles.processNumber}>{step.number}</span>
                  <div className={styles.processTrack}>
                    {index === activeProcess ? (
                      <div className={styles.processTrackFill} />
                    ) : null}
                  </div>
                </div>
                <h3 className={styles.processTitle}>{step.title}</h3>
                <span className={styles.processSubtitle}>{step.subtitle}</span>
                <p className={styles.processText}>{step.description}</p>
                <div
                  className={cx(
                    styles.processAccent,
                    index === activeProcess && styles.processAccentActive,
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="infra" className={styles.section}>
        <div className={styles.container}>
          <div className={styles.infraIntro}>
            <SectionLabel>Global infrastructure</SectionLabel>
            <div className={styles.infraHero}>
              <div className={styles.infraImageWrap}>
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/world-3i68QNWJwmO7W19ztZWbevAwJQHzYL.png"
                  alt="Global network sphere"
                  width={640}
                  height={640}
                  className={styles.infraImage}
                />
              </div>
              <div>
                <h2 className={styles.massiveTitle}>
                  Global by
                  <br />
                  <span className={styles.muted}>default.</span>
                </h2>
                <p className={styles.lead}>
                  Your agents run on distributed infrastructure across 29 regions. Sub-50ms
                  latency to 99% of the world.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.infraGrid}>
            <div className={styles.infraMapCard}>
              <div className={styles.infraNetwork}>
                {Array.from({ length: 20 }).map((_, index) => (
                  <span
                    key={`node-${index}`}
                    className={styles.networkDot}
                    style={{
                      left: `${10 + (index % 5) * 20}%`,
                      top: `${10 + Math.floor(index / 5) * 25}%`,
                      animationDelay: `${index * 120}ms`,
                    }}
                  />
                ))}
              </div>
              <div className={styles.regionStat}>
                <span className={styles.regionCount}>29</span>
                <span className={styles.regionWord}>regions</span>
              </div>
              <p className={styles.cardText}>
                Compute nodes distributed globally for maximum redundancy and minimum
                latency.
              </p>
            </div>

            <div className={styles.sideStatColumn}>
              <div className={styles.sideStatCard}>
                <span className={styles.sideStatValue}>99.99%</span>
                <span className={styles.sideStatLabel}>Uptime SLA</span>
              </div>
              <div className={styles.sideStatCard}>
                <span className={styles.sideStatValue}>&lt;50ms</span>
                <span className={styles.sideStatLabel}>Global latency</span>
              </div>
            </div>
          </div>

          <div className={styles.regionCards}>
            {[
              ['North America', '12 nodes'],
              ['Europe', '8 nodes'],
              ['Asia Pacific', '6 nodes'],
              ['South America', '3 nodes'],
            ].map(([name, nodes], index) => (
              <div
                key={name}
                className={cx(styles.regionCard, index === 0 && styles.regionCardActive)}
              >
                <div className={styles.regionStatus}>
                  <span className={styles.regionStatusDot} />
                  operational
                </div>
                <span className={styles.regionName}>{name}</span>
                <span className={styles.regionNodes}>{nodes}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.metricsBackdrop} />
        <div className={styles.container}>
          <div className={styles.metricsHeading}>
            <div className={styles.liveBadge}>
              <span className={styles.liveDot} />
              LIVE
            </div>
            <h2 className={styles.metricsTitle}>
              Real-time
              <br />
              <span className={styles.muted}>agent metrics.</span>
            </h2>
          </div>

          <div className={styles.metricsGraphWrap}>
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/real-time-graph-INFmn3u0MlUwvNPynoIhwxtPaPjxM5.png"
              alt=""
              width={2200}
              height={900}
              className={styles.metricsGraph}
            />
          </div>

          <div className={styles.metricsCards}>
            <div className={styles.metricPanel}>
              <div className={styles.metricPanelValue}>0</div>
              <div className={styles.sparkline}>
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className={styles.metricPanelTitle}>Tasks completed today</div>
              <div className={styles.metricPanelMeta}>by 23,847 active agents</div>
            </div>

            <div className={styles.metricSmallPanel}>
              <div className={styles.metricSmallMeta}>across all regions</div>
              <div className={styles.metricSmallTitle}>Availability</div>
              <div className={styles.microBars}>
                <span />
                <span />
                <span />
              </div>
              <div className={styles.metricSmallValue}>0.99%</div>
            </div>

            <div className={styles.metricSmallPanel}>
              <div className={styles.metricSmallMeta}>p99 latency</div>
              <div className={styles.metricSmallTitle}>Average execution</div>
              <div className={styles.microBars}>
                <span />
                <span />
                <span />
              </div>
              <div className={styles.metricSmallValue}>&lt;0ms</div>
            </div>
          </div>

          <div className={styles.modelList}>
            <span>OpenAI GPT-4 Turbo</span>
            <span>Anthropic Claude 3</span>
            <span>Mistral Large</span>
            <span>Llama 3</span>
            <span className={styles.modelListStrong}>+12 more models</span>
          </div>
        </div>
      </section>

      <section id="integrations" className={styles.integrationsSection}>
        <div className={styles.container}>
          <div className={styles.centeredHeading}>
            <SectionLabel centered>Integrations</SectionLabel>
            <h2 className={styles.massiveTitle}>
              Connect
              <br />
              <span className={styles.muted}>everything.</span>
            </h2>
            <p className={styles.centeredLead}>
              Your agents connect to 100+ tools and services. They read, write, and act
              autonomously across your entire stack.
            </p>
          </div>
        </div>

        <div className={styles.connectionImageWrap}>
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/connection-KeJwWPQvn6l0a7C48tCARYtNEdC92H.png"
            alt=""
            width={2200}
            height={1200}
            className={styles.connectionImage}
          />
        </div>

        <div className={styles.container}>
          <div className={styles.integrationGrid}>
            {integrations.map((integration) => (
              <div key={integration.label} className={styles.integrationCard}>
                <span className={styles.integrationBadge}>{integration.category}</span>
                <div className={styles.integrationIcon}>
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={integration.path} />
                  </svg>
                </div>
                <span className={styles.integrationName}>{integration.label}</span>
                <div className={styles.integrationUnderline} />
              </div>
            ))}
          </div>

          <div className={styles.integrationFooter}>
            <div className={styles.integrationMeta}>
              <div>
                <span className={styles.integrationBig}>100+</span>
                <span className={styles.integrationSmall}>Integrations</span>
              </div>
              <div>
                <span className={styles.integrationBig}>OAuth</span>
                <span className={styles.integrationSmall}>Auth built-in</span>
              </div>
              <div>
                <span className={styles.integrationBig}>Webhooks</span>
                <span className={styles.integrationSmall}>Real-time sync</span>
              </div>
            </div>
            <a href="#" className={styles.inlineArrow}>
              View all integrations
            </a>
          </div>
        </div>
      </section>

      <section id="security" className={styles.section}>
        <div className={styles.container}>
          <div className={styles.securityHeading}>
            <SectionLabel>Security</SectionLabel>
            <h2 className={styles.massiveTitle}>
              Autonomous,
              <br />
              <span className={styles.muted}>not uncontrolled.</span>
            </h2>
            <p className={styles.leadWide}>
              Your agents are powerful but constrained. Enterprise-grade security ensures
              they only do what you allow.
            </p>
          </div>

          <div className={styles.securityGrid}>
            <div className={styles.securityVisualCard}>
              <div className={styles.securityVisualMeta}>Active protection</div>
              <div className={styles.securityVisualValue}>0</div>
              <div className={styles.securityVisualLabel}>Security incidents this year</div>
              <div className={styles.securityImageFrame}>
                <Image
                  key={activeSecurityItem.image}
                  src={activeSecurityItem.image}
                  alt={activeSecurityItem.title}
                  fill
                  className={styles.securityImage}
                />
              </div>
              <div className={styles.complianceBadges}>
                {['SOC 2', 'ISO 27001', 'HIPAA', 'GDPR'].map((badge) => (
                  <span key={badge} className={styles.complianceBadge}>
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.securityList}>
              {securityItems.map((item, index) => (
                <button
                  type="button"
                  key={item.title}
                  className={cx(
                    styles.securityItem,
                    index === activeSecurity && styles.securityItemActive,
                  )}
                  onClick={() => setActiveSecurity(index)}
                >
                  <div className={styles.securityIconBox}>
                    <SecurityIcon icon={item.icon} className={styles.securityGlyph} />
                  </div>
                  <div>
                    <h3 className={styles.securityItemTitle}>{item.title}</h3>
                    <p className={styles.securityItemText}>{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="developers" className={styles.section}>
        <div className={styles.developerImageBg}>
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Upscaled%20Image%20%2813%29-OQ2DiR3ElVsUg8kTvTL1kC5A3Q6maM.png"
            alt=""
            width={1200}
            height={1600}
            className={styles.developerImage}
          />
        </div>

        <div className={styles.container}>
          <div className={styles.developerLayout}>
            <div className={styles.developerCopy}>
              <SectionLabel>Developer SDK</SectionLabel>
              <h2 className={styles.massiveTitle}>
                Code your agents.
                <br />
                <span className={styles.muted}>Or let them code.</span>
              </h2>
              <p className={styles.lead}>
                A powerful SDK for building, deploying, and orchestrating AI agents.
                Define behaviors in code or natural language.
              </p>
              <div className={styles.developerFeatures}>
                {developerFeatures.map((feature) => (
                  <div key={feature.title} className={styles.developerFeature}>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.codeTexture} aria-hidden="true">
              {'" " " " "" """ " "" "" " " " " " " "" " " "" "" " " " " " "" " " " " " " " " " " " " " " " " "" """ " " " " " " "" ""'}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.testimonialSection}>
        <div className={styles.container}>
          <div className={styles.testimonialHeader}>
            <div>
              <SectionLabel>Testimonials</SectionLabel>
              <h2 className={styles.testimonialTitle}>
                Trusted by teams
                <span className={styles.muted}> worldwide.</span>
              </h2>
            </div>
            <div className={styles.testimonialControls}>
              <button
                type="button"
                className={styles.controlButton}
                onClick={() =>
                  setActiveTestimonial(
                    (activeTestimonial - 1 + testimonials.length) % testimonials.length,
                  )
                }
                aria-label="Previous testimonial"
              >
                <ArrowLeftIcon className={styles.controlIcon} />
              </button>
              <button
                type="button"
                className={styles.controlButton}
                onClick={() =>
                  setActiveTestimonial((activeTestimonial + 1) % testimonials.length)
                }
                aria-label="Next testimonial"
              >
                <ArrowRightIcon className={styles.controlIcon} />
              </button>
            </div>
          </div>

          <div className={styles.testimonialGrid}>
            <div className={styles.quoteColumn}>
              <span className={styles.quoteMark}>“</span>
              <blockquote className={styles.quoteText}>{testimonial.quote}</blockquote>
              <div className={styles.authorRow}>
                <div className={styles.authorAvatar}>{testimonial.author.slice(0, 1)}</div>
                <div>
                  <p className={styles.authorName}>{testimonial.author}</p>
                  <p className={styles.authorRole}>{testimonial.role}</p>
                </div>
              </div>
            </div>

            <div className={styles.testimonialSidebar}>
              <div className={styles.testimonialMetricCard}>
                <span className={styles.testimonialMetricValue}>{testimonial.metric}</span>
                <span className={styles.testimonialMetricLabel}>{testimonial.metricLabel}</span>
              </div>
              <div className={styles.progressDots}>
                {testimonials.map((item, index) => (
                  <button
                    key={item.company}
                    type="button"
                    className={cx(
                      styles.progressDot,
                      index === activeTestimonial && styles.progressDotActive,
                    )}
                    onClick={() => setActiveTestimonial(index)}
                    aria-label={`Show testimonial ${index + 1}`}
                  />
                ))}
              </div>
              <div className={styles.featuredCompanies}>
                <span className={styles.featuredLabel}>Featured companies</span>
                <div className={styles.featuredCompanyTags}>
                  {['Meridian Labs', 'Flux Systems', 'Beacon AI', 'Prism Analytics'].map(
                    (company) => (
                      <button
                        key={company}
                        type="button"
                        className={cx(
                          styles.companyTag,
                          company === testimonial.company && styles.companyTagActive,
                        )}
                        onClick={() => {
                          const nextIndex = testimonials.findIndex(
                            (entry) => entry.company === company,
                          );
                          if (nextIndex >= 0) {
                            setActiveTestimonial(nextIndex);
                          }
                        }}
                      >
                        {company}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className={styles.section}>
        <div className={styles.container}>
          <div className={styles.pricingIntro}>
            <div>
              <SectionLabel>Pricing</SectionLabel>
              <h2 className={styles.massiveTitle}>
                Pay for
                <br />
                <span className={styles.outline}>results.</span>
              </h2>
            </div>
            <div className={styles.pricingArtWrap}>
              <Image
                src="https://projects.larsenevans.com/images/whale.png"
                alt="Organic whale"
                width={1951}
                height={1257}
                className={styles.pricingArt}
              />
            </div>
          </div>

          <div className={styles.pricingGrid}>
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={cx(styles.pricingCard, tier.featured && styles.pricingCardFeatured)}
              >
                {tier.featured ? <div className={styles.popularBadge}>Most Popular</div> : null}
                <div className={styles.pricingCardInner}>
                  <div className={styles.pricingHead}>
                    <span className={styles.cardIndex}>{tier.number}</span>
                    <h3 className={styles.pricingTitle}>{tier.name}</h3>
                    <p className={styles.pricingDescription}>{tier.description}</p>
                  </div>
                  <div className={styles.pricingValueRow}>
                    <span className={styles.pricingValue}>{tier.price}</span>
                    {tier.suffix ? <span className={styles.pricingSuffix}>{tier.suffix}</span> : null}
                  </div>
                  {tier.meta ? <p className={styles.pricingMeta}>{tier.meta}</p> : null}
                  <ul className={styles.pricingList}>
                    {tier.items.map((item) => (
                      <li key={item} className={styles.pricingListItem}>
                        <CheckIcon className={styles.checkIcon} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className={cx(
                      styles.pricingButton,
                      tier.featured && styles.pricingButtonFeatured,
                    )}
                  >
                    {tier.button}
                    <ArrowRightIcon className={styles.buttonIcon} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.pricingFootnote}>
            <div className={styles.pricingChecks}>
              {['Encrypted execution', 'Full audit logs', 'Multi-model routing'].map(
                (item) => (
                  <span key={item} className={styles.pricingCheck}>
                    <CheckIcon className={styles.checkIcon} />
                    {item}
                  </span>
                ),
              )}
            </div>
            <a href="#" className={styles.textLink}>
              Compare all features
            </a>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.ctaShell}>
            <div className={styles.ctaCopy}>
              <h2 className={styles.ctaTitle}>
                Ready to delegate
                <br />
                to AI agents?
              </h2>
              <p className={styles.leadWide}>
                Join teams automating complex workflows with COMPUTE agents. Deploy your
                first agent in minutes.
              </p>
              <div className={styles.ctaButtons}>
                <a href="#pricing" className={styles.primaryButton}>
                  Deploy your first agent
                  <ArrowRightIcon className={styles.buttonIcon} />
                </a>
                <a href="#pricing" className={styles.secondaryButton}>
                  Book a demo
                </a>
              </div>
              <p className={styles.ctaMeta}>1,000 free tasks with COMPUTE</p>
            </div>
            <div className={styles.bridgeWrap}>
              <Image
                src="https://projects.larsenevans.com/images/bridge.png"
                alt="Two trees connected by glowing arcs"
                width={2400}
                height={1600}
                className={styles.bridgeImage}
              />
            </div>
            <div className={styles.cornerTop} />
            <div className={styles.cornerBottom} />
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerImageBand}>
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Upscaled%20Image%20%2810%29-UnDKstODkIENp5xqTYUEpt0Sm8tNOw.png"
            alt="Bioluminescent landscape"
            fill
            className={styles.footerImage}
          />
          <div className={styles.footerImageFade} />
        </div>

        <div className={styles.container}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <a className={styles.logo} href="#">
                <span className={styles.logoWord}>COMPUTE</span>
                <span className={styles.logoMark}>TM</span>
              </a>
              <p className={styles.footerDescription}>
                Autonomous AI agents for distributed computing. Delegate complex tasks to
                intelligent workers.
              </p>
              <div className={styles.footerSocials}>
                {['Twitter', 'GitHub', 'LinkedIn'].map((item) => (
                  <a key={item} href="#" className={styles.footerSocial}>
                    {item}
                    <ArrowUpRightIcon className={styles.socialArrow} />
                  </a>
                ))}
              </div>
            </div>

            {footerColumns.map((column) => (
              <div key={column.title} className={styles.footerColumn}>
                <h3 className={styles.footerColumnTitle}>{column.title}</h3>
                <ul className={styles.footerLinks}>
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className={styles.footerLink}>
                        {link.label}
                        {link.badge ? (
                          <span className={styles.footerBadge}>{link.badge}</span>
                        ) : null}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className={styles.footerBottom}>
            <p>© 2025 COMPUTE. All rights reserved.</p>
            <div className={styles.statusInline}>
              <span className={styles.statusDot} />
              All agents operational
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
