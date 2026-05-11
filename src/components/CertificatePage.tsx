'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Shield,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileCheck,
  Fingerprint,
  QrCode,
  Search,
  Share2,
  Printer,
  AlertCircle,
  CheckCircle,
  XCircle,
  Verified,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

type CertificateStatus = 'verified' | 'pending' | 'expired';
type ComplianceLevel = 'ESIGN' | 'UETA' | 'eIDAS' | 'ESIGN+UETA' | 'ESIGN+UETA+eIDAS';

interface Signer {
  name: string;
  role: string;
  signedDate: string;
  ipAddress: string;
  signatureHash: string;
  initials: string;
}

interface Certificate {
  id: string;
  documentTitle: string;
  issuedDate: string;
  expiryDate: string;
  status: CertificateStatus;
  signerCount: number;
  signers: Signer[];
  complianceLevel: ComplianceLevel;
  sha256Hash: string;
  digitalTimestamp: string;
  certificateChain: string;
  documentRef: string;
}

// ============================================================
// Mock Data
// ============================================================

const mockCertificates: Certificate[] = [
  {
    id: 'CERT-7842',
    documentTitle: 'Non-Disclosure Agreement - Project Aurora',
    issuedDate: '2025-02-28',
    expiryDate: '2026-02-28',
    status: 'verified',
    signerCount: 3,
    signers: [
      { name: 'Sarah Johnson', role: 'CEO', signedDate: '2025-02-28T14:32:00Z', ipAddress: '192.168.1.45', signatureHash: 'a3f8c9d2e1b4...', initials: 'SJ' },
      { name: 'Michael Chen', role: 'CTO', signedDate: '2025-02-28T15:01:00Z', ipAddress: '10.0.0.112', signatureHash: '7b2e4f8a1c3d...', initials: 'MC' },
      { name: 'Emily Davis', role: 'Legal Counsel', signedDate: '2025-02-28T16:15:00Z', ipAddress: '172.16.0.88', signatureHash: 'd9e6a2c5f3b1...', initials: 'ED' },
    ],
    complianceLevel: 'ESIGN+UETA+eIDAS',
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    digitalTimestamp: '2025-02-28T16:15:12Z',
    certificateChain: 'DigiCert Global Root CA → DigiCert SHA2 Extended Validation',
    documentRef: 'DOC-NDA-2025-0142',
  },
  {
    id: 'CERT-7843',
    documentTitle: 'Employment Agreement - David Park',
    issuedDate: '2025-03-01',
    expiryDate: '2026-03-01',
    status: 'verified',
    signerCount: 2,
    signers: [
      { name: 'David Park', role: 'New Hire - Sr. Engineer', signedDate: '2025-03-01T09:22:00Z', ipAddress: '203.0.113.42', signatureHash: '1a2b3c4d5e6f...', initials: 'DP' },
      { name: 'Lisa Thompson', role: 'HR Director', signedDate: '2025-03-01T10:45:00Z', ipAddress: '192.168.2.10', signatureHash: 'f6e5d4c3b2a1...', initials: 'LT' },
    ],
    complianceLevel: 'ESIGN+UETA',
    sha256Hash: 'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a',
    digitalTimestamp: '2025-03-01T10:45:33Z',
    certificateChain: 'DigiCert Global Root CA → DigiCert SHA2 Extended Validation',
    documentRef: 'DOC-EMP-2025-0089',
  },
  {
    id: 'CERT-7844',
    documentTitle: 'Vendor Service Agreement - CloudOps Inc.',
    issuedDate: '2025-03-05',
    expiryDate: '2026-03-05',
    status: 'pending',
    signerCount: 4,
    signers: [
      { name: 'Robert Kim', role: 'VP Procurement', signedDate: '2025-03-05T11:30:00Z', ipAddress: '192.168.3.22', signatureHash: '4k5l6m7n8o9p...', initials: 'RK' },
      { name: 'Anna Martinez', role: 'Legal Director', signedDate: '2025-03-05T13:15:00Z', ipAddress: '172.16.1.55', signatureHash: 'p9o8n7m6l5k4...', initials: 'AM' },
      { name: 'James Wilson', role: 'CFO', signedDate: '2025-03-05T14:00:00Z', ipAddress: '10.0.1.33', signatureHash: 'q1r2s3t4u5v6...', initials: 'JW' },
      { name: 'CloudOps Rep', role: 'Vendor Representative', signedDate: '', ipAddress: '', signatureHash: '', initials: 'CR' },
    ],
    complianceLevel: 'ESIGN+UETA+eIDAS',
    sha256Hash: 'b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c',
    digitalTimestamp: '2025-03-05T14:00:45Z',
    certificateChain: 'DigiCert Global Root CA → DigiCert SHA2 Extended Validation',
    documentRef: 'DOC-VEN-2025-0056',
  },
  {
    id: 'CERT-7845',
    documentTitle: 'Lease Agreement - 55 Market St Suite 400',
    issuedDate: '2025-01-15',
    expiryDate: '2025-07-15',
    status: 'expired',
    signerCount: 2,
    signers: [
      { name: 'Sarah Johnson', role: 'CEO', signedDate: '2025-01-15T10:00:00Z', ipAddress: '192.168.1.45', signatureHash: 'w7x8y9z0a1b2...', initials: 'SJ' },
      { name: 'Property Management', role: 'Landlord Agent', signedDate: '2025-01-15T11:30:00Z', ipAddress: '198.51.100.22', signatureHash: 'c3d4e5f6g7h8...', initials: 'PM' },
    ],
    complianceLevel: 'ESIGN',
    sha256Hash: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    digitalTimestamp: '2025-01-15T11:30:22Z',
    certificateChain: 'DigiCert Global Root CA → DigiCert SHA2 Standard Validation',
    documentRef: 'DOC-LES-2025-0018',
  },
  {
    id: 'CERT-7846',
    documentTitle: 'Partnership Agreement - TechVentures LLC',
    issuedDate: '2025-03-10',
    expiryDate: '2026-03-10',
    status: 'verified',
    signerCount: 5,
    signers: [
      { name: 'Sarah Johnson', role: 'CEO', signedDate: '2025-03-10T08:00:00Z', ipAddress: '192.168.1.45', signatureHash: 'i9j0k1l2m3n4...', initials: 'SJ' },
      { name: 'Michael Chen', role: 'CTO', signedDate: '2025-03-10T08:30:00Z', ipAddress: '10.0.0.112', signatureHash: 'o5p6q7r8s9t0...', initials: 'MC' },
      { name: 'Robert Kim', role: 'VP Procurement', signedDate: '2025-03-10T09:00:00Z', ipAddress: '192.168.3.22', signatureHash: 'u1v2w3x4y5z6...', initials: 'RK' },
      { name: 'TechVentures CEO', role: 'Partner CEO', signedDate: '2025-03-10T10:00:00Z', ipAddress: '203.0.113.77', signatureHash: 'a7b8c9d0e1f2...', initials: 'TC' },
      { name: 'TechVentures CFO', role: 'Partner CFO', signedDate: '2025-03-10T10:15:00Z', ipAddress: '203.0.113.78', signatureHash: 'g3h4i5j6k7l8...', initials: 'TF' },
    ],
    complianceLevel: 'ESIGN+UETA+eIDAS',
    sha256Hash: '486ea46224d1bb4fb680f34f7c9ad96a8f0ec3f7ebe6e4d5c5e5f0c3a9b2d1e8',
    digitalTimestamp: '2025-03-10T10:15:55Z',
    certificateChain: 'DigiCert Global Root CA → DigiCert SHA2 Extended Validation',
    documentRef: 'DOC-PRT-2025-0033',
  },
  {
    id: 'CERT-7847',
    documentTitle: 'IP Assignment - AI Research Division',
    issuedDate: '2025-03-12',
    expiryDate: '2026-03-12',
    status: 'pending',
    signerCount: 3,
    signers: [
      { name: 'Michael Chen', role: 'CTO', signedDate: '2025-03-12T16:00:00Z', ipAddress: '10.0.0.112', signatureHash: 'm9n0o1p2q3r4...', initials: 'MC' },
      { name: 'Lead Researcher', role: 'AI Division Head', signedDate: '2025-03-12T16:30:00Z', ipAddress: '10.0.2.55', signatureHash: 's5t6u7v8w9x0...', initials: 'LR' },
      { name: 'Legal Counsel', role: 'IP Attorney', signedDate: '', ipAddress: '', signatureHash: '', initials: 'LC' },
    ],
    complianceLevel: 'ESIGN+UETA',
    sha256Hash: '7d793037a0760186574b0282f2f435e7e8f3c6b8d9a2e1f0c3d4b5a6978869e',
    digitalTimestamp: '2025-03-12T16:30:18Z',
    certificateChain: 'DigiCert Global Root CA → DigiCert SHA2 Extended Validation',
    documentRef: 'DOC-IPA-2025-0011',
  },
  {
    id: 'CERT-7848',
    documentTitle: 'Merger Agreement - AcquireX Corp',
    issuedDate: '2025-02-20',
    expiryDate: '2025-08-20',
    status: 'expired',
    signerCount: 6,
    signers: [
      { name: 'Sarah Johnson', role: 'CEO', signedDate: '2025-02-20T09:00:00Z', ipAddress: '192.168.1.45', signatureHash: 'y1z2a3b4c5d6...', initials: 'SJ' },
      { name: 'Board Member 1', role: 'Director', signedDate: '2025-02-20T09:30:00Z', ipAddress: '198.51.100.5', signatureHash: 'e7f8g9h0i1j2...', initials: 'B1' },
      { name: 'Board Member 2', role: 'Director', signedDate: '2025-02-20T10:00:00Z', ipAddress: '198.51.100.6', signatureHash: 'k3l4m5n6o7p8...', initials: 'B2' },
      { name: 'External Counsel', role: 'M&A Attorney', signedDate: '2025-02-20T11:00:00Z', ipAddress: '203.0.113.99', signatureHash: 'q9r0s1t2u3v4...', initials: 'EC' },
      { name: 'AcquireX CEO', role: 'Target CEO', signedDate: '2025-02-20T14:00:00Z', ipAddress: '203.0.113.100', signatureHash: 'w5x6y7z8a9b0...', initials: 'AC' },
      { name: 'AcquireX CFO', role: 'Target CFO', signedDate: '2025-02-20T14:30:00Z', ipAddress: '203.0.113.101', signatureHash: 'c1d2e3f4g5h6...', initials: 'AF' },
    ],
    complianceLevel: 'ESIGN+UETA+eIDAS',
    sha256Hash: '1c9b7a3f5e8d2c4b6a0f3e7d9c1b5a4f8e2d6c0b4a8f3e7d1c5b9a4f8e2d6c0',
    digitalTimestamp: '2025-02-20T14:30:44Z',
    certificateChain: 'DigiCert Global Root CA → DigiCert SHA2 Extended Validation',
    documentRef: 'DOC-MRG-2025-0003',
  },
  {
    id: 'CERT-7849',
    documentTitle: 'SaaS Subscription Agreement - Enterprise Plan',
    issuedDate: '2025-03-14',
    expiryDate: '2026-03-14',
    status: 'verified',
    signerCount: 2,
    signers: [
      { name: 'Lisa Thompson', role: 'HR Director', signedDate: '2025-03-14T11:00:00Z', ipAddress: '192.168.2.10', signatureHash: 'i7j8k9l0m1n2...', initials: 'LT' },
      { name: 'Client CTO', role: 'Customer', signedDate: '2025-03-14T12:30:00Z', ipAddress: '198.51.100.50', signatureHash: 'o3p4q5r6s7t8...', initials: 'CC' },
    ],
    complianceLevel: 'ESIGN',
    sha256Hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    digitalTimestamp: '2025-03-14T12:30:09Z',
    certificateChain: 'DigiCert Global Root CA → DigiCert SHA2 Standard Validation',
    documentRef: 'DOC-SAA-2025-0077',
  },
];

// ============================================================
// Helper Components
// ============================================================

function StatusBadge({ status }: { status: CertificateStatus }) {
  const config = {
    verified: {
      label: 'Verified',
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
    },
    pending: {
      label: 'Pending',
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      icon: <Clock className="h-3 w-3 mr-1" />,
    },
    expired: {
      label: 'Expired',
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
      icon: <AlertCircle className="h-3 w-3 mr-1" />,
    },
  };

  const c = config[status];

  return (
    <Badge
      variant="outline"
      className={`${c.className} text-xs font-medium flex items-center relative`}
    >
      {c.icon}
      {c.label}
      {status === 'pending' && (
        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
      )}
    </Badge>
  );
}

function ComplianceBadges({ level }: { level: ComplianceLevel }) {
  const badges = level.split('+');
  const colors: Record<string, string> = {
    ESIGN: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800',
    UETA: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
    eIDAS: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  };

  return (
    <div className="flex gap-1.5 flex-wrap">
      {badges.map((b) => (
        <Badge key={b} variant="outline" className={`text-[10px] font-semibold px-1.5 py-0 ${colors[b] || ''}`}>
          {b}
        </Badge>
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      title="Copy to clipboard"
    >
      <Copy className="h-3 w-3" />
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// ============================================================
// Certificate Detail Dialog
// ============================================================

function CertificateDetailDialog({
  certificate,
  open,
  onOpenChange,
}: {
  certificate: Certificate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!certificate) return null;

  const signedSigners = certificate.signers.filter((s) => s.signedDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Certificate Document */}
        <div className="relative">
          {/* Ornamental border */}
          <div className="absolute inset-0 pointer-events-none" style={{
            border: '3px solid transparent',
            borderImage: 'linear-gradient(135deg, #10b981, #14b8a6, #06b6d4, #14b8a6, #10b981) 1',
            borderRadius: '8px',
          }} />
          {/* Corner ornaments */}
          <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-emerald-500/40 rounded-tl-sm" />
          <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-teal-500/40 rounded-tr-sm" />
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-cyan-500/40 rounded-bl-sm" />
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-teal-500/40 rounded-br-sm" />

          <div className="p-8">
            {/* Logo placeholder */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 border border-emerald-200 dark:border-emerald-800">
                <Award className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  DocuSign Enterprise
                </span>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-serif font-bold text-foreground tracking-wide uppercase">
                Electronic Signature
              </h2>
              <h2 className="text-2xl font-serif font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent tracking-wide uppercase">
                Compliance Certificate
              </h2>
              <div className="mt-3 flex justify-center">
                <div className="h-0.5 w-24 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" />
              </div>
            </div>

            {/* Certificate Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-muted/50 dark:bg-muted/20 rounded-lg p-3">
                <span className="text-muted-foreground text-xs">Certificate ID</span>
                <p className="font-mono font-bold text-foreground">{certificate.id}</p>
              </div>
              <div className="bg-muted/50 dark:bg-muted/20 rounded-lg p-3">
                <span className="text-muted-foreground text-xs">Document Reference</span>
                <p className="font-mono font-bold text-foreground">{certificate.documentRef}</p>
              </div>
            </div>

            {/* Certification Text */}
            <div className="mb-6 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
              <p className="text-sm text-foreground leading-relaxed">
                This certifies that the document entitled{' '}
                <strong className="text-emerald-700 dark:text-emerald-400">&quot;{certificate.documentTitle}&quot;</strong>{' '}
                has been electronically signed in compliance with applicable electronic signature laws and regulations.
                The signatures affixed herein have been verified as authentic and tamper-proof under the standards
                listed below.
              </p>
            </div>

            {/* Signers Table */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Verified Signers ({signedSigners.length} of {certificate.signerCount})
              </h3>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50 dark:bg-muted/20">
                      <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground">Name</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground">Role</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground">Signed Date</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground">IP Address</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground">Signature Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificate.signers.map((signer, i) => (
                      <tr key={i} className={i % 2 === 1 ? 'bg-muted/20 dark:bg-muted/10' : ''}>
                        <td className="py-2 px-3 font-medium flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[8px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                              {signer.initials}
                            </AvatarFallback>
                          </Avatar>
                          {signer.name}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">{signer.role}</td>
                        <td className="py-2 px-3 font-mono">
                          {signer.signedDate ? new Date(signer.signedDate).toLocaleString() : <span className="text-amber-500 italic">Pending</span>}
                        </td>
                        <td className="py-2 px-3 font-mono text-muted-foreground">{signer.ipAddress || '—'}</td>
                        <td className="py-2 px-3 font-mono text-muted-foreground">{signer.signatureHash || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Compliance Standards */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Compliance Standards Met
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'ESIGN Act (U.S. Federal)', desc: 'Electronic Signatures in Global and National Commerce Act' },
                  { name: 'UETA (Uniform)', desc: 'Uniform Electronic Transactions Act — adopted by 47 states' },
                  { name: 'eIDAS (EU)', desc: 'EU Regulation No 910/2014 on electronic identification' },
                  { name: '21 CFR Part 11', desc: 'FDA Electronic Records & Signatures Rule' },
                ].map((std) => {
                  const meets = certificate.complianceLevel.includes(std.name.split(' ')[0]) || std.name === '21 CFR Part 11';
                  return (
                    <div
                      key={std.name}
                      className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${
                        meets
                          ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10'
                          : 'border-border bg-muted/20'
                      }`}
                    >
                      {meets ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className={`font-semibold ${meets ? 'text-foreground' : 'text-muted-foreground'}`}>{std.name}</p>
                        <p className="text-muted-foreground">{std.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tamper-Proof Verification */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Tamper-Proof Verification
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 dark:bg-muted/20 text-xs">
                  <span className="text-muted-foreground font-medium w-32 shrink-0">SHA-256 Hash</span>
                  <code className="font-mono text-foreground break-all flex-1">{certificate.sha256Hash}</code>
                  <CopyButton text={certificate.sha256Hash} />
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 dark:bg-muted/20 text-xs">
                  <span className="text-muted-foreground font-medium w-32 shrink-0">Digital Timestamp</span>
                  <code className="font-mono text-foreground flex-1">{new Date(certificate.digitalTimestamp).toISOString()}</code>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 dark:bg-muted/20 text-xs">
                  <span className="text-muted-foreground font-medium w-32 shrink-0">Certificate Chain</span>
                  <code className="font-mono text-foreground flex-1 text-[10px]">{certificate.certificateChain}</code>
                </div>
              </div>
            </div>

            {/* QR Code Placeholder */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-lg border-2 border-dashed border-emerald-300 dark:border-emerald-700 flex items-center justify-center bg-emerald-50/30 dark:bg-emerald-900/10">
                <QrCode className="h-10 w-10 text-emerald-500/50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Scan to verify authenticity</p>
            </div>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Generated by <span className="font-semibold text-foreground">DocuSign Enterprise Platform</span>
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                {new Date(certificate.digitalTimestamp).toLocaleString()} · Certificate valid until{' '}
                {new Date(certificate.expiryDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4 flex items-center gap-2">
          <Button className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" className="flex-1">
            <ExternalLink className="h-4 w-4 mr-2" />
            Verify Online
          </Button>
          <Button variant="outline" className="flex-1">
            <Share2 className="h-4 w-4 mr-2" />
            Share Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Verify Certificate Dialog
// ============================================================

function VerifyCertificateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [certId, setCertId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<'valid' | 'invalid' | null>(null);
  const [verifiedCert, setVerifiedCert] = useState<Certificate | null>(null);

  const handleVerify = () => {
    setVerifying(true);
    setResult(null);
    setVerifiedCert(null);

    setTimeout(() => {
      const found = mockCertificates.find((c) => c.id === certId.toUpperCase().trim());
      if (found && found.status === 'verified') {
        setResult('valid');
        setVerifiedCert(found);
      } else {
        setResult('invalid');
        setVerifiedCert(null);
      }
      setVerifying(false);
    }, 1500);
  };

  const handleClose = () => {
    setCertId('');
    setVerifying(false);
    setResult(null);
    setVerifiedCert(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Verify Certificate
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Certificate ID
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter CERT-XXXX"
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && certId && handleVerify()}
                className="font-mono"
              />
              <Button
                onClick={handleVerify}
                disabled={!certId || verifying}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shrink-0"
              >
                {verifying ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <Verified className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {result === 'valid' ? (
                  <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                      >
                        <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                      </motion.div>
                      <div>
                        <p className="font-bold text-emerald-700 dark:text-emerald-400">Certificate Valid</p>
                        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                          This certificate has been verified as authentic and tamper-proof.
                        </p>
                      </div>
                    </div>
                    {verifiedCert && (
                      <div className="space-y-1.5 text-xs border-t border-emerald-200 dark:border-emerald-800 pt-3 mt-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Certificate ID</span>
                          <span className="font-mono font-bold">{verifiedCert.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Issued Date</span>
                          <span>{new Date(verifiedCert.issuedDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Signer Count</span>
                          <span>{verifiedCert.signerCount} signers</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Compliance</span>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">{verifiedCert.complianceLevel}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
                    <div className="flex items-center gap-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                      >
                        <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                      </motion.div>
                      <div>
                        <p className="font-bold text-red-700 dark:text-red-400">Certificate Invalid</p>
                        <p className="text-xs text-red-600/70 dark:text-red-400/70">
                          The certificate could not be verified. It may be expired, revoked, or the ID is incorrect.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Main CertificatePage Component
// ============================================================

export function CertificatePage() {
  const { navigate } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending' | 'expired'>('all');
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  // Filtered certificates
  const filteredCertificates = useMemo(() => {
    let filtered = [...mockCertificates];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.documentTitle.toLowerCase().includes(q) ||
          c.documentRef.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    // Date range
    if (dateRange !== 'all') {
      const now = new Date();
      const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
      const cutoff = new Date(now.getTime() - (daysMap[dateRange] || 0) * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((c) => new Date(c.issuedDate) >= cutoff);
    }

    return filtered;
  }, [searchQuery, statusFilter, dateRange]);

  // Stats
  const stats = useMemo(() => {
    const total = mockCertificates.length;
    const verified = mockCertificates.filter((c) => c.status === 'verified').length;
    const pending = mockCertificates.filter((c) => c.status === 'pending').length;
    const score = Math.round((verified / total) * 100);
    return { total, verified, pending, score };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Award className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              Signing Certificates
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Generate tamper-proof compliance certificates for completed document signings
            </p>
          </div>
          <Button
            onClick={() => setVerifyOpen(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20"
          >
            <Shield className="h-4 w-4 mr-2" />
            Verify Certificate
          </Button>
        </div>
      </motion.div>

      {/* Statistics Bar */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[
          {
            label: 'Total Certificates',
            value: stats.total,
            icon: FileCheck,
            gradient: 'from-emerald-500/10 to-emerald-500/5 dark:from-emerald-500/15 dark:to-emerald-500/5',
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            borderAccent: 'border-l-emerald-500',
          },
          {
            label: 'Verified This Month',
            value: stats.verified,
            icon: CheckCircle2,
            gradient: 'from-teal-500/10 to-teal-500/5 dark:from-teal-500/15 dark:to-teal-500/5',
            iconBg: 'bg-teal-100 dark:bg-teal-900/30',
            iconColor: 'text-teal-600 dark:text-teal-400',
            borderAccent: 'border-l-teal-500',
          },
          {
            label: 'Pending Verification',
            value: stats.pending,
            icon: Clock,
            gradient: 'from-amber-500/10 to-amber-500/5 dark:from-amber-500/15 dark:to-amber-500/5',
            iconBg: 'bg-amber-100 dark:bg-amber-900/30',
            iconColor: 'text-amber-600 dark:text-amber-400',
            borderAccent: 'border-l-amber-500',
          },
          {
            label: 'Compliance Score',
            value: `${stats.score}%`,
            icon: Shield,
            gradient: 'from-cyan-500/10 to-cyan-500/5 dark:from-cyan-500/15 dark:to-cyan-500/5',
            iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
            iconColor: 'text-cyan-600 dark:text-cyan-400',
            borderAccent: 'border-l-cyan-500',
          },
        ].map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className={`glass-card border-l-4 ${stat.borderAccent} relative overflow-hidden`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} pointer-events-none`} />
              <CardContent className="p-4 relative">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${stat.iconBg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Filter/Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by document name, certificate ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-1.5 flex-wrap">
                {(['all', 'verified', 'pending', 'expired'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className={
                      statusFilter === status
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                        : ''
                    }
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Date Range */}
              <div className="flex gap-1.5">
                {([
                  { key: 'all', label: 'All Time' },
                  { key: '7d', label: '7 Days' },
                  { key: '30d', label: '30 Days' },
                  { key: '90d', label: '90 Days' },
                ] as const).map((range) => (
                  <Button
                    key={range.key}
                    variant={dateRange === range.key ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setDateRange(range.key)}
                    className="text-xs"
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Certificate List */}
      <motion.div
        className="space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {filteredCertificates.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <FileCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No certificates found</p>
              <p className="text-muted-foreground/60 text-sm">Try adjusting your search or filter criteria</p>
            </motion.div>
          ) : (
            filteredCertificates.map((cert) => (
              <motion.div
                key={cert.id}
                variants={itemVariants}
                layout
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="card-gradient-top card-hover-lift overflow-hidden group">
                  <CardContent className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Left: Certificate Info */}
                      <div className="flex-1 min-w-0 space-y-2.5">
                        {/* Certificate ID + Copy */}
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {cert.id}
                          </span>
                          <CopyButton text={cert.id} />
                          <StatusBadge status={cert.status} />
                        </div>

                        {/* Document Title */}
                        <button
                          onClick={() => navigate('document-detail')}
                          className="text-base font-semibold text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors link-underline"
                        >
                          {cert.documentTitle}
                        </button>

                        {/* Dates */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Issued: {new Date(cert.issuedDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Compliance + Signers */}
                        <div className="flex flex-wrap items-center gap-3">
                          <ComplianceBadges level={cert.complianceLevel} />

                          {/* Signer avatars */}
                          <div className="flex items-center gap-1">
                            <div className="flex -space-x-1.5">
                              {cert.signers.slice(0, 4).map((signer, i) => (
                                <Avatar key={i} className="h-6 w-6 border-2 border-background">
                                  <AvatarFallback className="text-[8px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                    {signer.initials}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground ml-1">
                              {cert.signerCount} signer{cert.signerCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex lg:flex-col gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCert(cert);
                            setDetailOpen(true);
                          }}
                          className="text-xs"
                        >
                          <FileCheck className="h-3.5 w-3.5 mr-1.5" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs">
                          <Download className="h-3.5 w-3.5 mr-1.5" />
                          PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setVerifyOpen(true);
                          }}
                          className="text-xs"
                        >
                          <Shield className="h-3.5 w-3.5 mr-1.5" />
                          Verify
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs">
                          <Share2 className="h-3.5 w-3.5 mr-1.5" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* Dialogs */}
      <CertificateDetailDialog
        certificate={selectedCert}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
      <VerifyCertificateDialog open={verifyOpen} onOpenChange={setVerifyOpen} />
    </div>
  );
}
