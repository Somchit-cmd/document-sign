'use client';

import { useState, useRef, useCallback, useMemo, useEffect, Fragment } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitCompareArrows,
  ArrowLeftRight,
  Columns2,
  Rows3,
  ListFilter,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Shield,
  Info,
  ArrowUpDown,
  Minus,
  Plus,
  Pencil,
  Eye,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Layers,
  TrendingUp,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

// ============================================================
// Types
// ============================================================
type ViewMode = 'side-by-side' | 'unified' | 'differences-only';
type DiffType = 'add' | 'remove' | 'modify' | 'unchanged';
type Severity = 'major' | 'minor' | 'cosmetic';
type Category = 'Header' | 'Body' | 'Terms' | 'Signatures' | 'Dates';

interface DiffLine {
  lineA: number;
  lineB: number;
  textA: string;
  textB: string;
  type: DiffType;
  category: Category;
  severity: Severity;
}

interface MockDocument {
  id: string;
  name: string;
  version: string;
  date: string;
  lines: string[];
}

// ============================================================
// Mock Data - Service Agreement v2.1 vs v2.2
// ============================================================
const mockDocumentA: MockDocument = {
  id: 'doc-a',
  name: 'Service Agreement v2.1',
  version: '2.1',
  date: '2024-11-15',
  lines: [
    'SERVICE AGREEMENT',
    'Contract Reference: SA-2024-0147',
    'Effective Date: January 1, 2025',
    'Expiry Date: December 31, 2025',
    '',
    'PARTIES',
    'This Agreement is entered into between:',
    '  Provider: Acme Cloud Services Inc. ("Provider")',
    '  Client: GlobalTech Corporation ("Client")',
    '',
    '1. SCOPE OF SERVICES',
    'The Provider shall deliver cloud infrastructure services including:',
    '  (a) Server hosting and maintenance',
    '  (b) Database management and backup',
    '  (c) 24/7 technical support via email and phone',
    '  (d) Monthly performance reports',
    '',
    '2. SERVICE LEVEL AGREEMENT',
    'The Provider guarantees 99.5% uptime availability.',
    'Response time for critical issues: 4 hours.',
    'Response time for non-critical issues: 24 hours.',
    'Scheduled maintenance windows: Sundays 02:00-06:00 UTC.',
    '',
    '3. FEES AND PAYMENT',
    'Monthly service fee: $12,000.00 USD.',
    'Payment terms: Net 30 days from invoice date.',
    'Late payment penalty: 1.5% per month on outstanding balance.',
    'Annual price adjustment: Not to exceed 3% per annum.',
    '',
    '4. DATA PROTECTION',
    'The Provider shall comply with GDPR and CCPA regulations.',
    'Data encryption: AES-128 standard for data at rest.',
    'Data encryption: TLS 1.2 for data in transit.',
    'Data residency: United States only.',
    'Backup retention period: 90 days.',
    '',
    '5. CONFIDENTIALITY',
    'Both parties agree to maintain strict confidentiality.',
    'Confidential information includes business data, trade secrets,',
    'and technical specifications shared during the engagement.',
    'Confidentiality period: 3 years after termination.',
    '',
    '6. TERMINATION',
    'Either party may terminate with 60 days written notice.',
    'Early termination fee: $25,000.00 USD.',
    'Upon termination, Provider shall return all Client data within 30 days.',
    '',
    '7. LIABILITY',
    'Provider total liability shall not exceed fees paid in the last 6 months.',
    'Provider shall not be liable for indirect or consequential damages.',
    '',
    '8. GOVERNING LAW',
    'This Agreement shall be governed by the laws of California, USA.',
    'Disputes shall be resolved in the courts of San Francisco County.',
    '',
    'SIGNATURES',
    'Provider: _________________________ Date: __________',
    '  Name: Robert Chen, VP of Operations',
    'Client: _________________________ Date: __________',
    '  Name: Sarah Johnson, CTO',
  ],
};

const mockDocumentB: MockDocument = {
  id: 'doc-b',
  name: 'Service Agreement v2.2',
  version: '2.2',
  date: '2025-02-20',
  lines: [
    'SERVICE AGREEMENT',
    'Contract Reference: SA-2025-0147',
    'Effective Date: March 1, 2025',
    'Expiry Date: December 31, 2026',
    '',
    'PARTIES',
    'This Agreement is entered into between:',
    '  Provider: Acme Cloud Services Inc. ("Provider")',
    '  Client: GlobalTech Corporation ("Client")',
    '  Subcontractor: DataShield Analytics LLC ("Subcontractor")',
    '',
    '1. SCOPE OF SERVICES',
    'The Provider shall deliver cloud infrastructure services including:',
    '  (a) Server hosting and maintenance',
    '  (b) Database management and backup',
    '  (c) 24/7 technical support via email, phone, and chat',
    '  (d) Monthly performance reports',
    '  (e) Quarterly security audits and compliance reviews',
    '  (f) Dedicated account manager',
    '',
    '2. SERVICE LEVEL AGREEMENT',
    'The Provider guarantees 99.9% uptime availability.',
    'Response time for critical issues: 2 hours.',
    'Response time for non-critical issues: 12 hours.',
    'Scheduled maintenance windows: Sundays 02:00-04:00 UTC.',
    'Service credit: 10% refund for uptime below 99.5% in any month.',
    '',
    '3. FEES AND PAYMENT',
    'Monthly service fee: $15,500.00 USD.',
    'Payment terms: Net 15 days from invoice date.',
    'Late payment penalty: 2.0% per month on outstanding balance.',
    'Annual price adjustment: Not to exceed 5% per annum.',
    'Volume discount: 5% for annual prepayment.',
    '',
    '4. DATA PROTECTION',
    'The Provider shall comply with GDPR, CCPA, and SOC 2 Type II regulations.',
    'Data encryption: AES-256 standard for data at rest.',
    'Data encryption: TLS 1.3 for data in transit.',
    'Data residency: United States and European Union.',
    'Backup retention period: 180 days.',
    'Annual penetration testing by independent third party.',
    '',
    '5. CONFIDENTIALITY',
    'Both parties agree to maintain strict confidentiality.',
    'Confidential information includes business data, trade secrets,',
    'technical specifications, and customer PII shared during the engagement.',
    'Confidentiality period: 5 years after termination.',
    'Breach of confidentiality: $100,000 liquidated damages per incident.',
    '',
    '6. TERMINATION',
    'Either party may terminate with 30 days written notice.',
    'Early termination fee: $15,000.00 USD.',
    'Upon termination, Provider shall return all Client data within 14 days.',
    'Force majeure clause: Neither party liable for delays due to natural',
    'disasters, war, or government actions beyond reasonable control.',
    '',
    '7. LIABILITY AND INDEMNIFICATION',
    'Provider total liability shall not exceed fees paid in the last 12 months.',
    'Provider shall indemnify Client against third-party IP claims.',
    'Client shall indemnify Provider against misuse of services.',
    '',
    '8. GOVERNING LAW',
    'This Agreement shall be governed by the laws of Delaware, USA.',
    'Disputes shall be resolved through binding arbitration under AAA rules.',
    'Arbitration venue: Wilmington, Delaware.',
    '',
    '9. AUDIT RIGHTS',
    'Client reserves the right to audit Provider\'s compliance annually.',
    'Audit findings must be addressed within 30 business days.',
    '',
    'SIGNATURES',
    'Provider: _________________________ Date: __________',
    '  Name: Robert Chen, VP of Operations',
    'Client: _________________________ Date: __________',
    '  Name: Sarah Johnson, CTO',
    'Subcontractor: _________________________ Date: __________',
    '  Name: Michael Park, Managing Director',
  ],
};

const mockDocuments = [mockDocumentA, mockDocumentB];

// ============================================================
// Diff Engine
// ============================================================
function computeDiffs(docA: MockDocument, docB: MockDocument): DiffLine[] {
  const diffs: DiffLine[] = [];
  const maxLen = Math.max(docA.lines.length, docB.lines.length);

  const categories: Record<number, Category> = {
    0: 'Header', 1: 'Header', 2: 'Header', 3: 'Header', 4: 'Header',
    5: 'Header', 6: 'Header', 7: 'Header', 8: 'Header', 9: 'Header',
    10: 'Body', 11: 'Body', 12: 'Body', 13: 'Body', 14: 'Body', 15: 'Body', 16: 'Body',
    17: 'Body', 18: 'Terms', 19: 'Terms', 20: 'Terms', 21: 'Terms', 22: 'Terms',
    23: 'Terms', 24: 'Terms', 25: 'Terms', 26: 'Terms', 27: 'Terms', 28: 'Terms',
    29: 'Body', 30: 'Body', 31: 'Body', 32: 'Body', 33: 'Body', 34: 'Body',
    35: 'Body', 36: 'Body', 37: 'Body', 38: 'Body', 39: 'Body', 40: 'Body',
    41: 'Body', 42: 'Body',
    43: 'Body', 44: 'Body', 45: 'Body', 46: 'Body', 47: 'Body',
    48: 'Body', 49: 'Body', 50: 'Body',
    51: 'Terms', 52: 'Terms', 53: 'Terms', 54: 'Terms',
    55: 'Terms', 56: 'Terms', 57: 'Terms',
    58: 'Terms', 59: 'Terms', 60: 'Terms',
    61: 'Signatures', 62: 'Signatures', 63: 'Signatures', 64: 'Signatures',
    65: 'Signatures', 66: 'Signatures', 67: 'Signatures', 68: 'Signatures',
  };

  // Map known lines to determine diff type
  const lineAMap = new Map<string, number[]>();
  docA.lines.forEach((line, i) => {
    const key = line.trim();
    if (key) {
      if (!lineAMap.has(key)) lineAMap.set(key, []);
      lineAMap.get(key)!.push(i);
    }
  });

  const matchedB = new Set<number>();
  const matchedA = new Set<number>();

  // Find exact matches
  docB.lines.forEach((line, j) => {
    const key = line.trim();
    if (key && lineAMap.has(key)) {
      const candidates = lineAMap.get(key)!.filter(i => !matchedA.has(i));
      if (candidates.length > 0) {
        const i = candidates[0];
        matchedA.add(i);
        matchedB.add(j);
      }
    }
  });

  // Track which lines are additions (in B but not matched)
  // and which are removals (in A but not matched)
  // For modified lines, we need to pair unmatched lines

  const unmatchedA = docA.lines.map((_, i) => i).filter(i => !matchedA.has(i) && docA.lines[i].trim() !== '');
  const unmatchedB = docB.lines.map((_, i) => i).filter(i => !matchedB.has(i) && docB.lines[i].trim() !== '');

  // Simple heuristic: pair unmatched lines that are close in position as "modified"
  const modifiedPairs: [number, number][] = [];
  const usedA = new Set<number>();
  const usedB = new Set<number>();

  for (const i of unmatchedA) {
    for (const j of unmatchedB) {
      if (usedB.has(j)) continue;
      // Check if lines share significant words
      const wordsA = new Set(docA.lines[i].toLowerCase().split(/\s+/).filter(w => w.length > 3));
      const wordsB = new Set(docB.lines[j].toLowerCase().split(/\s+/).filter(w => w.length > 3));
      const overlap = [...wordsA].filter(w => wordsB.has(w)).length;
      const total = new Set([...wordsA, ...wordsB]).size;
      if (total > 0 && overlap / total > 0.3) {
        modifiedPairs.push([i, j]);
        usedA.add(i);
        usedB.add(j);
        break;
      }
    }
  }

  const modifiedAMap = new Map(modifiedPairs.map(([i, j]) => [i, j]));
  const modifiedBMap = new Map(modifiedPairs.map(([i, j]) => [j, i]));

  // Build the diff output
  let idxA = 0;
  let idxB = 0;

  // Determine severity
  const getSeverity = (textA: string, textB: string, type: DiffType): Severity => {
    if (type === 'unchanged') return 'cosmetic';
    if (type === 'add' || type === 'remove') {
      if (textA.match(/\$[\d,]+/) || textB.match(/\$[\d,]+/)) return 'major';
      if (textA.match(/\d+%/)|| textB.match(/\d+%/)) return 'major';
      if (textA.match(/liability|termination|indemnif/i) || textB.match(/liability|termination|indemnif/i)) return 'major';
      return 'minor';
    }
    // modify
    const numChange = textA.match(/\d+/g)?.join('') !== textB.match(/\d+/g)?.join('');
    const moneyChange = textA.match(/\$[\d,]+/)?.[0] !== textB.match(/\$[\d,]+/)?.[0];
    if (moneyChange || numChange) return 'major';
    if (textA.match(/law|govern|arbitrat/i) || textB.match(/law|govern|arbitrat/i)) return 'major';
    return 'minor';
  };

  // Interleave both documents preserving order
  while (idxA < docA.lines.length || idxB < docB.lines.length) {
    const a = idxA < docA.lines.length ? docA.lines[idxA] : undefined;
    const b = idxB < docB.lines.length ? docB.lines[idxB] : undefined;
    const aTrimmed = a?.trim() ?? '';
    const bTrimmed = b?.trim() ?? '';

    // Check if current A is matched with current B (both same)
    if (a !== undefined && b !== undefined && a === b && matchedA.has(idxA) && matchedB.has(idxB)) {
      const cat = categories[idxA] || categories[idxB] || 'Body';
      diffs.push({
        lineA: idxA + 1,
        lineB: idxB + 1,
        textA: a,
        textB: b,
        type: 'unchanged',
        category: cat,
        severity: 'cosmetic',
      });
      idxA++;
      idxB++;
    }
    // Check if A is matched with a later B (additions in B before match)
    else if (a !== undefined && matchedA.has(idxA)) {
      // A is matched but not with current B - check if B has additions
      if (b !== undefined && !matchedB.has(idxB) && !modifiedBMap.has(idxB)) {
        const cat = categories[idxB] || 'Body';
        diffs.push({
          lineA: 0,
          lineB: idxB + 1,
          textA: '',
          textB: b,
          type: 'add',
          category: cat,
          severity: getSeverity('', b, 'add'),
        });
        idxB++;
      } else if (b !== undefined && modifiedBMap.has(idxB) && modifiedBMap.get(idxB) === idxA) {
        const cat = categories[idxA] || 'Body';
        diffs.push({
          lineA: idxA + 1,
          lineB: idxB + 1,
          textA: a,
          textB: b,
          type: 'modify',
          category: cat,
          severity: getSeverity(a, b, 'modify'),
        });
        idxA++;
        idxB++;
      } else {
        // B line is matched with a later A - check if A has removals
        if (!matchedA.has(idxA) && !modifiedAMap.has(idxA) && aTrimmed) {
          const cat = categories[idxA] || 'Body';
          diffs.push({
            lineA: idxA + 1,
            lineB: 0,
            textA: a,
            textB: '',
            type: 'remove',
            category: cat,
            severity: getSeverity(a, '', 'remove'),
          });
          idxA++;
        } else if (modifiedAMap.has(idxA)) {
          const jTarget = modifiedAMap.get(idxA)!;
          // Process any B additions before this match
          while (idxB < jTarget && idxB < docB.lines.length) {
            const bLine = docB.lines[idxB];
            if (!matchedB.has(idxB) && !modifiedBMap.has(idxB) && bLine.trim()) {
              const cat = categories[idxB] || 'Body';
              diffs.push({
                lineA: 0,
                lineB: idxB + 1,
                textA: '',
                textB: bLine,
                type: 'add',
                category: cat,
                severity: getSeverity('', bLine, 'add'),
              });
            } else if (bLine.trim() === '') {
              const cat = categories[idxB] || 'Body';
              diffs.push({
                lineA: 0,
                lineB: idxB + 1,
                textA: '',
                textB: bLine,
                type: 'add',
                category: cat,
                severity: 'cosmetic',
              });
            }
            idxB++;
          }
          // Now process the modified pair
          const cat = categories[idxA] || 'Body';
          diffs.push({
            lineA: idxA + 1,
            lineB: idxB + 1,
            textA: a,
            textB: docB.lines[idxB],
            type: 'modify',
            category: cat,
            severity: getSeverity(a, docB.lines[idxB], 'modify'),
          });
          idxA++;
          idxB++;
        } else {
          // Unmatched A (removal) - empty line
          if (!aTrimmed) {
            diffs.push({
              lineA: idxA + 1,
              lineB: 0,
              textA: a,
              textB: '',
              type: 'unchanged',
              category: 'Body',
              severity: 'cosmetic',
            });
          }
          idxA++;
        }
      }
    }
    // Check if B is matched with a later A (removals in A before match)
    else if (b !== undefined && matchedB.has(idxB)) {
      if (a !== undefined && !matchedA.has(idxA) && !modifiedAMap.has(idxA) && aTrimmed) {
        const cat = categories[idxA] || 'Body';
        diffs.push({
          lineA: idxA + 1,
          lineB: 0,
          textA: a,
          textB: '',
          type: 'remove',
          category: cat,
          severity: getSeverity(a, '', 'remove'),
        });
        idxA++;
      } else if (a !== undefined && modifiedAMap.has(idxA)) {
        const jTarget = modifiedAMap.get(idxA)!;
        // Process removals in A
        if (!aTrimmed) {
          idxA++;
        } else {
          const cat = categories[idxA] || 'Body';
          diffs.push({
            lineA: idxA + 1,
            lineB: 0,
            textA: a,
            textB: '',
            type: 'remove',
            category: cat,
            severity: getSeverity(a, '', 'remove'),
          });
          idxA++;
        }
      } else {
        // skip empty lines
        if (a !== undefined && !aTrimmed) {
          idxA++;
        }
        if (!bTrimmed) {
          idxB++;
        }
      }
    }
    // Neither matched - could be additions/removals
    else {
      if (a !== undefined && b !== undefined && modifiedAMap.has(idxA) && modifiedAMap.get(idxA) === idxB) {
        const cat = categories[idxA] || 'Body';
        diffs.push({
          lineA: idxA + 1,
          lineB: idxB + 1,
          textA: a,
          textB: b,
          type: 'modify',
          category: cat,
          severity: getSeverity(a, b, 'modify'),
        });
        idxA++;
        idxB++;
      } else if (a !== undefined && !matchedA.has(idxA) && !modifiedAMap.has(idxA) && aTrimmed) {
        const cat = categories[idxA] || 'Body';
        diffs.push({
          lineA: idxA + 1,
          lineB: 0,
          textA: a,
          textB: '',
          type: 'remove',
          category: cat,
          severity: getSeverity(a, '', 'remove'),
        });
        idxA++;
      } else if (b !== undefined && !matchedB.has(idxB) && !modifiedBMap.has(idxB) && bTrimmed) {
        const cat = categories[idxB] || 'Body';
        diffs.push({
          lineA: 0,
          lineB: idxB + 1,
          textA: '',
          textB: b,
          type: 'add',
          category: cat,
          severity: getSeverity('', b, 'add'),
        });
        idxB++;
      } else {
        // Skip empty or already handled
        if (a !== undefined) idxA++;
        if (b !== undefined) idxB++;
      }
    }
  }

  return diffs;
}

// ============================================================
// Component
// ============================================================
export function DocumentComparisonPage() {
  const [selectedDocA, setSelectedDocA] = useState<string>('doc-a');
  const [selectedDocB, setSelectedDocB] = useState<string>('doc-b');
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [unifiedBase, setUnifiedBase] = useState<'A' | 'B'>('A');
  const [selectedDiff, setSelectedDiff] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [expandedDiffContext, setExpandedDiffContext] = useState<Set<number>>(new Set());
  const [isCompared, setIsCompared] = useState(true);

  const panelARef = useRef<HTMLDivElement>(null);
  const panelBRef = useRef<HTMLDivElement>(null);
  const isScrollingSynced = useRef(false);

  // Get selected documents
  const docA = mockDocuments.find(d => d.id === selectedDocA) || mockDocumentA;
  const docB = mockDocuments.find(d => d.id === selectedDocB) || mockDocumentB;

  // Compute diffs
  const diffs = useMemo(() => computeDiffs(docA, docB), [docA, docB]);

  // Stats
  const stats = useMemo(() => {
    const changes = diffs.filter(d => d.type !== 'unchanged');
    const additions = changes.filter(d => d.type === 'add').length;
    const removals = changes.filter(d => d.type === 'remove').length;
    const modifications = changes.filter(d => d.type === 'modify').length;
    const major = changes.filter(d => d.severity === 'major').length;
    const minor = changes.filter(d => d.severity === 'minor').length;
    const cosmetic = changes.filter(d => d.severity === 'cosmetic').length;

    const categoryBreakdown: Record<Category, { add: number; remove: number; modify: number }> = {
      Header: { add: 0, remove: 0, modify: 0 },
      Body: { add: 0, remove: 0, modify: 0 },
      Terms: { add: 0, remove: 0, modify: 0 },
      Signatures: { add: 0, remove: 0, modify: 0 },
      Dates: { add: 0, remove: 0, modify: 0 },
    };

    changes.forEach(d => {
      if (categoryBreakdown[d.category]) {
        categoryBreakdown[d.category][d.type as 'add' | 'remove' | 'modify']++;
      }
    });

    return { total: changes.length, additions, removals, modifications, major, minor, cosmetic, categoryBreakdown };
  }, [diffs]);

  // Only changed diffs
  const changedDiffs = useMemo(() => diffs.filter(d => d.type !== 'unchanged'), [diffs]);

  // Synchronized scrolling
  const handleScrollA = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isScrollingSynced.current) return;
    isScrollingSynced.current = true;
    const scrollRatio = e.currentTarget.scrollTop / (e.currentTarget.scrollHeight - e.currentTarget.clientHeight || 1);
    if (panelBRef.current) {
      panelBRef.current.scrollTop = scrollRatio * (panelBRef.current.scrollHeight - panelBRef.current.clientHeight);
    }
    requestAnimationFrame(() => { isScrollingSynced.current = false; });
  }, []);

  const handleScrollB = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isScrollingSynced.current) return;
    isScrollingSynced.current = true;
    const scrollRatio = e.currentTarget.scrollTop / (e.currentTarget.scrollHeight - e.currentTarget.clientHeight || 1);
    if (panelARef.current) {
      panelARef.current.scrollTop = scrollRatio * (panelARef.current.scrollHeight - panelARef.current.clientHeight);
    }
    requestAnimationFrame(() => { isScrollingSynced.current = false; });
  }, []);

  // Swap documents
  const handleSwap = () => {
    const tempA = selectedDocA;
    setSelectedDocA(selectedDocB);
    setSelectedDocB(tempA);
  };

  // Toggle unchanged sections in unified view
  const toggleSection = (idx: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // Toggle diff context in differences-only view
  const toggleDiffContext = (idx: number) => {
    setExpandedDiffContext(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // Build unified sections (group consecutive unchanged lines)
  const unifiedSections = useMemo(() => {
    const sections: { type: 'changed' | 'unchanged'; diffs: DiffLine[]; startIdx: number }[] = [];
    let currentSection: { type: 'changed' | 'unchanged'; diffs: DiffLine[]; startIdx: number } | null = null;

    diffs.forEach((d, i) => {
      const isUnchanged = d.type === 'unchanged';
      if (!currentSection || currentSection.type !== (isUnchanged ? 'unchanged' : 'changed')) {
        if (currentSection) sections.push(currentSection);
        currentSection = { type: isUnchanged ? 'unchanged' : 'changed', diffs: [d], startIdx: i };
      } else {
        currentSection.diffs.push(d);
      }
    });
    if (currentSection) sections.push(currentSection);
    return sections;
  }, [diffs]);

  // Click on mini-map to scroll
  const handleMinimapClick = (diffIdx: number) => {
    setSelectedDiff(diffIdx);
    const targetLine = diffs[diffIdx];
    if (panelARef.current && targetLine.lineA > 0) {
      const lineHeight = 28;
      panelARef.current.scrollTop = (targetLine.lineA - 1) * lineHeight;
    }
  };

  // Diff type styling helpers
  const getDiffBgA = (type: DiffType) => {
    switch (type) {
      case 'remove': return 'bg-red-500/15 dark:bg-red-500/20 border-l-2 border-red-500';
      case 'modify': return 'bg-amber-500/15 dark:bg-amber-500/20 border-l-2 border-amber-500';
      case 'add': return 'bg-emerald-500/5 dark:bg-emerald-500/10';
      default: return '';
    }
  };

  const getDiffBgB = (type: DiffType) => {
    switch (type) {
      case 'add': return 'bg-emerald-500/15 dark:bg-emerald-500/20 border-l-2 border-emerald-500';
      case 'modify': return 'bg-amber-500/15 dark:bg-amber-500/20 border-l-2 border-amber-500';
      case 'remove': return 'bg-red-500/5 dark:bg-red-500/10';
      default: return '';
    }
  };

  const getDiffBadge = (type: DiffType) => {
    switch (type) {
      case 'add': return <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] h-5"><Plus className="h-3 w-3 mr-0.5" />Added</Badge>;
      case 'remove': return <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 text-[10px] h-5"><Minus className="h-3 w-3 mr-0.5" />Removed</Badge>;
      case 'modify': return <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] h-5"><Pencil className="h-3 w-3 mr-0.5" />Modified</Badge>;
      default: return null;
    }
  };

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case 'major': return <Badge variant="destructive" className="text-[10px] h-5 gap-0.5"><AlertTriangle className="h-3 w-3" />Major</Badge>;
      case 'minor': return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] h-5 gap-0.5"><Info className="h-3 w-3" />Minor</Badge>;
      case 'cosmetic': return <Badge variant="secondary" className="text-[10px] h-5 gap-0.5"><Eye className="h-3 w-3" />Cosmetic</Badge>;
    }
  };

  const getCategoryIcon = (cat: Category) => {
    switch (cat) {
      case 'Header': return <FileText className="h-3 w-3" />;
      case 'Body': return <Layers className="h-3 w-3" />;
      case 'Terms': return <Shield className="h-3 w-3" />;
      case 'Signatures': return <Zap className="h-3 w-3" />;
      case 'Dates': return <TrendingUp className="h-3 w-3" />;
    }
  };

  // Find matching context lines for a diff
  const getContextLines = (diffIdx: number, radius: number = 2) => {
    const result: { line: string; fromA: boolean; lineNum: number }[] = [];
    const targetDiff = changedDiffs[diffIdx];
    const targetLineA = targetDiff.lineA;
    const targetLineB = targetDiff.lineB;

    for (let r = 1; r <= radius; r++) {
      // Before
      if (targetLineA - r > 0) {
        result.unshift({ line: docA.lines[targetLineA - r - 1], fromA: true, lineNum: targetLineA - r });
      }
      if (targetLineB - r > 0 && (targetLineA - r <= 0 || docA.lines[targetLineA - r - 1] !== docB.lines[targetLineB - r - 1])) {
        result.unshift({ line: docB.lines[targetLineB - r - 1], fromA: false, lineNum: targetLineB - r });
      }
      // After
      if (targetLineA + r <= docA.lines.length) {
        result.push({ line: docA.lines[targetLineA + r - 1], fromA: true, lineNum: targetLineA + r });
      }
      if (targetLineB + r <= docB.lines.length && (targetLineA + r > docA.lines.length || docA.lines[targetLineA + r - 1] !== docB.lines[targetLineB + r - 1])) {
        result.push({ line: docB.lines[targetLineB + r - 1], fromA: false, lineNum: targetLineB + r });
      }
    }

    return result;
  };

  // Initialize selected diff - just use 0 as default since isCompared starts true

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-2.5">
                  <GitCompareArrows className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Document Comparison</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">Compare document versions side by side with intelligent diff analysis</p>
                </div>
              </div>
            </div>
          </div>

          {/* Document selectors + controls */}
          <Card className="glass-card overflow-hidden">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                {/* Document A selector */}
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Document A (Original)</label>
                  <Select value={selectedDocA} onValueChange={setSelectedDocA}>
                    <SelectTrigger className="w-full border-red-500/30 focus:ring-red-500/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mockDocuments.map(doc => (
                        <SelectItem key={doc.id} value={doc.id}>
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-red-500" />
                            {doc.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Swap button */}
                <div className="flex items-end pb-0.5 lg:pb-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleSwap}
                          className="rounded-full border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all h-10 w-10"
                        >
                          <ArrowLeftRight className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Swap documents</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Document B selector */}
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Document B (Modified)</label>
                  <Select value={selectedDocB} onValueChange={setSelectedDocB}>
                    <SelectTrigger className="w-full border-emerald-500/30 focus:ring-emerald-500/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mockDocuments.map(doc => (
                        <SelectItem key={doc.id} value={doc.id}>
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            {doc.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Compare button */}
                <div className="flex items-end">
                  <Button
                    onClick={() => setIsCompared(true)}
                    className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 px-6 h-10"
                  >
                    <GitCompareArrows className="h-4 w-4 mr-2" />
                    Compare
                  </Button>
                </div>
              </div>

              {/* View mode toggle */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                <span className="text-xs font-medium text-muted-foreground mr-1">View:</span>
                {([
                  { mode: 'side-by-side' as ViewMode, icon: Columns2, label: 'Side-by-Side' },
                  { mode: 'unified' as ViewMode, icon: Rows3, label: 'Unified' },
                  { mode: 'differences-only' as ViewMode, icon: ListFilter, label: 'Differences Only' },
                ]).map(({ mode, icon: Icon, label }) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      'text-xs h-8 gap-1.5',
                      viewMode === mode && 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {isCompared && (
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* SIDE-BY-SIDE VIEW */}
              {viewMode === 'side-by-side' && (
                <div className="flex gap-4 relative">
                  {/* Mini-map */}
                  <div className="hidden xl:flex flex-col items-center gap-0.5 w-6 pt-2 shrink-0">
                    <span className="text-[8px] text-muted-foreground/50 mb-1">MAP</span>
                    <div className="relative w-3 rounded-full bg-muted/50 overflow-hidden" style={{ height: `${Math.min(diffs.length * 3, 400)}px` }}>
                      {diffs.map((d, i) => {
                        if (d.type === 'unchanged') return null;
                        return (
                          <button
                            key={i}
                            onClick={() => handleMinimapClick(i)}
                            className={cn(
                              'absolute left-0 right-0 h-[3px] rounded-full transition-all hover:scale-x-150',
                              d.type === 'add' && 'bg-emerald-500',
                              d.type === 'remove' && 'bg-red-500',
                              d.type === 'modify' && 'bg-amber-500',
                            )}
                            style={{ top: `${(i / diffs.length) * 100}%` }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Panel A */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      <span className="text-sm font-semibold truncate">{docA.name}</span>
                      <Badge variant="outline" className="text-[10px] h-5">{docA.version}</Badge>
                      <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground">{docA.date}</Badge>
                    </div>
                    <div
                      ref={panelARef}
                      onScroll={handleScrollA}
                      className="rounded-xl border border-border bg-card overflow-auto max-h-[600px] scroll-smooth"
                    >
                      <table className="w-full">
                        <tbody>
                          {diffs.map((d, i) => (
                            <tr
                              key={`a-${i}`}
                              onClick={() => d.type !== 'unchanged' && setSelectedDiff(i)}
                              className={cn(
                                'group cursor-default transition-colors',
                                getDiffBgA(d.type),
                                selectedDiff === i && 'ring-2 ring-violet-500 ring-inset',
                                d.type !== 'unchanged' && 'cursor-pointer hover:brightness-110',
                              )}
                            >
                              <td className="px-3 py-1 text-[11px] text-muted-foreground/50 font-mono w-10 text-right select-none border-r border-border/30">
                                {d.lineA > 0 ? d.lineA : ''}
                              </td>
                              <td className="px-3 py-1 text-sm font-mono whitespace-pre-wrap">
                                {d.type === 'remove' && <span className="text-red-600 dark:text-red-400">{d.textA}</span>}
                                {d.type === 'modify' && <span className="text-amber-700 dark:text-amber-300">{d.textA}</span>}
                                {d.type === 'unchanged' && <span className="text-foreground/80">{d.textA}</span>}
                                {d.type === 'add' && <span className="text-muted-foreground/30">{d.textA || '\u00A0'}</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Panel B */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="text-sm font-semibold truncate">{docB.name}</span>
                      <Badge variant="outline" className="text-[10px] h-5">{docB.version}</Badge>
                      <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground">{docB.date}</Badge>
                    </div>
                    <div
                      ref={panelBRef}
                      onScroll={handleScrollB}
                      className="rounded-xl border border-border bg-card overflow-auto max-h-[600px] scroll-smooth"
                    >
                      <table className="w-full">
                        <tbody>
                          {diffs.map((d, i) => (
                            <tr
                              key={`b-${i}`}
                              onClick={() => d.type !== 'unchanged' && setSelectedDiff(i)}
                              className={cn(
                                'group cursor-default transition-colors',
                                getDiffBgB(d.type),
                                selectedDiff === i && 'ring-2 ring-violet-500 ring-inset',
                                d.type !== 'unchanged' && 'cursor-pointer hover:brightness-110',
                              )}
                            >
                              <td className="px-3 py-1 text-[11px] text-muted-foreground/50 font-mono w-10 text-right select-none border-r border-border/30">
                                {d.lineB > 0 ? d.lineB : ''}
                              </td>
                              <td className="px-3 py-1 text-sm font-mono whitespace-pre-wrap">
                                {d.type === 'add' && <span className="text-emerald-600 dark:text-emerald-400">{d.textB}</span>}
                                {d.type === 'modify' && <span className="text-amber-700 dark:text-amber-300">{d.textB}</span>}
                                {d.type === 'unchanged' && <span className="text-foreground/80">{d.textB}</span>}
                                {d.type === 'remove' && <span className="text-muted-foreground/30">{d.textB || '\u00A0'}</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* UNIFIED VIEW */}
              {viewMode === 'unified' && (
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">Unified View</span>
                        <Badge variant="outline" className="text-[10px] h-5">
                          Base: {unifiedBase === 'A' ? docA.name : docB.name}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Base document:</span>
                        <Button
                          variant={unifiedBase === 'A' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setUnifiedBase('A')}
                          className={cn('text-xs h-7', unifiedBase === 'A' && 'bg-red-500/80 hover:bg-red-600/80')}
                        >
                          A
                        </Button>
                        <Button
                          variant={unifiedBase === 'B' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setUnifiedBase('B')}
                          className={cn('text-xs h-7', unifiedBase === 'B' && 'bg-emerald-500/80 hover:bg-emerald-600/80')}
                        >
                          B
                        </Button>
                      </div>
                    </div>
                    <div className="overflow-auto max-h-[600px]">
                      <table className="w-full">
                        <tbody>
                          {unifiedSections.map((section, sIdx) => {
                            if (section.type === 'changed') {
                              return section.diffs.map((d, dIdx) => {
                                const globalIdx = section.startIdx + dIdx;
                                const text = unifiedBase === 'A' ? d.textA : d.textB;
                                const altText = unifiedBase === 'A' ? d.textB : d.textA;
                                const lineNum = unifiedBase === 'A' ? d.lineA : d.lineB;

                                return (
                                  <tr
                                    key={`u-${sIdx}-${dIdx}`}
                                    onClick={() => setSelectedDiff(globalIdx)}
                                    className={cn(
                                      'cursor-pointer transition-colors',
                                      d.type === 'add' && 'bg-emerald-500/10 border-l-2 border-emerald-500',
                                      d.type === 'remove' && 'bg-red-500/10 border-l-2 border-red-500',
                                      d.type === 'modify' && 'bg-amber-500/10 border-l-2 border-amber-500',
                                      selectedDiff === globalIdx && 'ring-2 ring-violet-500 ring-inset',
                                    )}
                                  >
                                    <td className="px-3 py-1 text-[11px] text-muted-foreground/50 font-mono w-10 text-right select-none border-r border-border/30">
                                      {lineNum > 0 ? lineNum : ''}
                                    </td>
                                    <td className="px-3 py-1 w-8">
                                      {getDiffBadge(d.type)}
                                    </td>
                                    <td className="px-3 py-1 text-sm font-mono whitespace-pre-wrap">
                                      <span className={cn(
                                        d.type === 'add' && 'text-emerald-600 dark:text-emerald-400',
                                        d.type === 'remove' && 'text-red-600 dark:text-red-400 line-through',
                                        d.type === 'modify' && 'text-amber-700 dark:text-amber-300',
                                      )}>
                                        {text || '\u00A0'}
                                      </span>
                                      {d.type === 'modify' && altText && (
                                        <span className="block text-xs text-muted-foreground mt-0.5">
                                          → {altText}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              });
                            }

                            // Unchanged section - collapsible
                            const isExpanded = expandedSections.has(sIdx);
                            if (isExpanded) {
                              return (
                                <Fragment key={`section-${sIdx}`}>
                                  <tr
                                    className="cursor-pointer hover:bg-muted/50 border-l-2 border-transparent"
                                    onClick={() => toggleSection(sIdx)}
                                  >
                                    <td colSpan={3} className="px-3 py-1 text-xs text-muted-foreground text-center">
                                      <ChevronUp className="h-3 w-3 inline mr-1" />
                                      Collapse {section.diffs.length} unchanged lines
                                    </td>
                                  </tr>
                                  {section.diffs.map((d, dIdx) => {
                                    const text = unifiedBase === 'A' ? d.textA : d.textB;
                                    const lineNum = unifiedBase === 'A' ? d.lineA : d.lineB;
                                    return (
                                      <tr key={`u-exp-${sIdx}-${dIdx}`} className="text-muted-foreground/60">
                                        <td className="px-3 py-1 text-[11px] font-mono w-10 text-right select-none border-r border-border/30">
                                          {lineNum > 0 ? lineNum : ''}
                                        </td>
                                        <td className="px-3 py-1 w-8"></td>
                                        <td className="px-3 py-1 text-sm font-mono whitespace-pre-wrap">{text || '\u00A0'}</td>
                                      </tr>
                                    );
                                  })}
                                </Fragment>
                              );
                            }

                            return (
                              <tr
                                key={`section-${sIdx}`}
                                className="cursor-pointer hover:bg-muted/50 border-l-2 border-transparent"
                                onClick={() => toggleSection(sIdx)}
                              >
                                <td colSpan={3} className="px-3 py-1.5 text-xs text-muted-foreground text-center">
                                  <ChevronDown className="h-3 w-3 inline mr-1" />
                                  {section.diffs.length} unchanged lines (click to expand)
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* DIFFERENCES ONLY VIEW */}
              {viewMode === 'differences-only' && (
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
                      <div className="flex items-center gap-2">
                        <ListFilter className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">Differences Only</span>
                        <Badge variant="secondary" className="text-[10px]">{changedDiffs.length} changes</Badge>
                      </div>
                    </div>
                    <div className="overflow-auto max-h-[600px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-16 text-xs">Line #</TableHead>
                            <TableHead className="w-28 text-xs">Type</TableHead>
                            <TableHead className="text-xs">Document A</TableHead>
                            <TableHead className="text-xs">Document B</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {changedDiffs.map((d, i) => {
                            const isExpanded = expandedDiffContext.has(i);
                            const contextLines = isExpanded ? getContextLines(i) : [];

                            return (
                              <Fragment key={`diff-${i}`}>
                                <TableRow
                                  onClick={() => setSelectedDiff(diffs.indexOf(d))}
                                  className={cn(
                                    'cursor-pointer transition-colors',
                                    selectedDiff === diffs.indexOf(d) && 'bg-violet-500/10',
                                    d.type === 'add' && 'hover:bg-emerald-500/5',
                                    d.type === 'remove' && 'hover:bg-red-500/5',
                                    d.type === 'modify' && 'hover:bg-amber-500/5',
                                  )}
                                >
                                  <TableCell className="font-mono text-xs text-muted-foreground">
                                    {d.lineA > 0 ? d.lineA : '-'} / {d.lineB > 0 ? d.lineB : '-'}
                                  </TableCell>
                                  <TableCell>{getDiffBadge(d.type)}</TableCell>
                                  <TableCell className={cn(
                                    'font-mono text-xs max-w-[300px] truncate',
                                    d.type === 'remove' && 'text-red-600 dark:text-red-400',
                                    d.type === 'modify' && 'text-amber-700 dark:text-amber-300',
                                  )}>
                                    {d.textA || <span className="text-muted-foreground/40 italic">—</span>}
                                  </TableCell>
                                  <TableCell className={cn(
                                    'font-mono text-xs max-w-[300px] truncate',
                                    d.type === 'add' && 'text-emerald-600 dark:text-emerald-400',
                                    d.type === 'modify' && 'text-amber-700 dark:text-amber-300',
                                  )}>
                                    {d.textB || <span className="text-muted-foreground/40 italic">—</span>}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={(e) => { e.stopPropagation(); toggleDiffContext(i); }}
                                    >
                                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                                {isExpanded && contextLines.length > 0 && (
                                  <TableRow className="bg-muted/30">
                                    <TableCell colSpan={5} className="p-2">
                                      <div className="text-xs font-mono text-muted-foreground space-y-0.5">
                                        <div className="text-[10px] uppercase tracking-wider mb-1 text-muted-foreground/60">Context</div>
                                        {contextLines.map((cl, ci) => (
                                          <div key={ci} className={cn(
                                            'flex gap-2',
                                            cl.fromA ? 'text-red-500/60' : 'text-emerald-500/60',
                                          )}>
                                            <span className="w-8 text-right shrink-0">{cl.lineNum}</span>
                                            <span>{cl.line}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </Fragment>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Bottom Panels: Summary + AI Analysis */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Difference Summary Panel */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="xl:col-span-2 space-y-4"
                >
                  <Card className="glass-card overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <ArrowUpDown className="h-4 w-4 text-violet-500" />
                          Difference Summary
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                            <Download className="h-3 w-3" />
                            PDF
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                            <Download className="h-3 w-3" />
                            CSV
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* Total + breakdown */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-600/10 border border-violet-500/20 p-3 text-center">
                          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{stats.total}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Total Changes</div>
                        </div>
                        <div className="rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/20 p-3 text-center">
                          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.additions}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Additions</div>
                        </div>
                        <div className="rounded-lg bg-gradient-to-br from-red-500/10 to-rose-600/10 border border-red-500/20 p-3 text-center">
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.removals}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Deletions</div>
                        </div>
                        <div className="rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20 p-3 text-center">
                          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.modifications}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Modifications</div>
                        </div>
                      </div>

                      {/* Visual diff bar */}
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-2">Change Proportion</div>
                        <div className="h-4 rounded-full overflow-hidden bg-muted flex">
                          {stats.additions > 0 && (
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500"
                              style={{ width: `${(stats.additions / stats.total) * 100}%` }}
                            />
                          )}
                          {stats.removals > 0 && (
                            <div
                              className="bg-gradient-to-r from-red-500 to-rose-500 h-full transition-all duration-500"
                              style={{ width: `${(stats.removals / stats.total) * 100}%` }}
                            />
                          )}
                          {stats.modifications > 0 && (
                            <div
                              className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-500"
                              style={{ width: `${(stats.modifications / stats.total) * 100}%` }}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Additions</span>
                          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Deletions</span>
                          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Modifications</span>
                        </div>
                      </div>

                      {/* Severity */}
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-2">Severity Breakdown</div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <div>
                              <div className="text-sm font-semibold">{stats.major}</div>
                              <div className="text-[10px] text-muted-foreground">Major</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-amber-500" />
                            <div>
                              <div className="text-sm font-semibold">{stats.minor}</div>
                              <div className="text-[10px] text-muted-foreground">Minor</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-slate-400" />
                            <div>
                              <div className="text-sm font-semibold">{stats.cosmetic}</div>
                              <div className="text-[10px] text-muted-foreground">Cosmetic</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Category breakdown */}
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-2">Category Breakdown</div>
                        <div className="space-y-2">
                          {(Object.entries(stats.categoryBreakdown) as [Category, { add: number; remove: number; modify: number }][]).map(([cat, counts]) => {
                            const total = counts.add + counts.remove + counts.modify;
                            if (total === 0) return null;
                            return (
                              <div key={cat} className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 w-24 shrink-0">
                                  {getCategoryIcon(cat)}
                                  <span className="text-xs font-medium">{cat}</span>
                                </div>
                                <div className="flex-1">
                                  <Progress value={total > 0 ? (total / stats.total) * 100 : 0} className="h-2" />
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px]">
                                  {counts.add > 0 && <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[9px] h-4 px-1">+{counts.add}</Badge>}
                                  {counts.remove > 0 && <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 text-[9px] h-4 px-1">-{counts.remove}</Badge>}
                                  {counts.modify > 0 && <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[9px] h-4 px-1">~{counts.modify}</Badge>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* AI Analysis Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  <Card className="glass-card overflow-hidden border-violet-500/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-white" />
                        </div>
                        AI-Powered Change Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Summary */}
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Summary</div>
                        <p className="text-sm text-foreground/90 leading-relaxed">
                          Service Agreement v2.2 introduces significant changes including a <span className="text-amber-600 dark:text-amber-400 font-medium">29% fee increase</span> ($12K→$15.5K/mo), improved SLA guarantees (99.5%→99.9% uptime), enhanced data protection (AES-128→AES-256, TLS 1.2→1.3), and a new subcontractor party. Key risk areas include broader liability terms and reduced termination notice period.
                        </p>
                      </div>

                      <Separator />

                      {/* Risk Assessment */}
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Risk Assessment</div>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            <div>
                              <div className="text-sm font-medium text-red-600 dark:text-red-400">High Risk</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Fee increase from $12,000 to $15,500/month (+29%) with annual adjustment cap raised from 3% to 5%. Early termination fee reduced but notice period shortened from 60 to 30 days.
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                            <div>
                              <div className="text-sm font-medium text-amber-600 dark:text-amber-400">Medium Risk</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                New subcontractor (DataShield Analytics LLC) introduced without defined scope or liability. Governing law changed from California to Delaware with mandatory arbitration replacing court proceedings.
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                            <div>
                              <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Low Risk</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Enhanced SLA with service credits, improved encryption standards, and extended data retention are positive changes that strengthen the agreement.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Recommended Actions */}
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recommended Actions</div>
                        <div className="space-y-1.5">
                          {[
                            'Negotiate fee increase cap or phase-in over 6 months',
                            'Request subcontractor scope definition and liability clause',
                            'Review arbitration venue — consider neutral location',
                            'Add data breach notification timeline requirement',
                            'Clarify volume discount eligibility criteria',
                          ].map((action, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <span className="flex items-center justify-center h-4 w-4 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400 font-semibold shrink-0 mt-0.5 text-[9px]">
                                {i + 1}
                              </span>
                              <span className="text-foreground/80">{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Compliance Impact */}
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Compliance Impact</div>
                        <div className="space-y-2">
                          {[
                            { label: 'GDPR', status: 'improved', detail: 'EU data residency now supported' },
                            { label: 'SOC 2', status: 'new', detail: 'Type II compliance now required' },
                            { label: 'CCPA', status: 'unchanged', detail: 'No change to existing compliance' },
                            { label: 'ISO 27001', status: 'gap', detail: 'Penetration testing added but no ISO cert required' },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {item.status === 'improved' && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
                                {item.status === 'new' && <Plus className="h-3.5 w-3.5 text-blue-500" />}
                                {item.status === 'unchanged' && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                                {item.status === 'gap' && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                                <span className="text-xs font-medium">{item.label}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">{item.detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Selected Diff Detail */}
              {selectedDiff !== null && diffs[selectedDiff] && diffs[selectedDiff].type !== 'unchanged' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="fixed bottom-4 right-4 z-50 max-w-md"
                >
                  <Card className="glass-card shadow-2xl border-violet-500/30">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getDiffBadge(diffs[selectedDiff].type)}
                          {getSeverityBadge(diffs[selectedDiff].severity)}
                          <Badge variant="outline" className="text-[10px] h-5 gap-0.5">
                            {getCategoryIcon(diffs[selectedDiff].category)}
                            {diffs[selectedDiff].category}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedDiff(null)}>
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        {diffs[selectedDiff].textA && (
                          <div className="rounded bg-red-500/10 border border-red-500/20 px-3 py-1.5 font-mono text-xs">
                            <span className="text-red-500 mr-1">-</span>{diffs[selectedDiff].textA}
                          </div>
                        )}
                        {diffs[selectedDiff].textB && (
                          <div className="rounded bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 font-mono text-xs">
                            <span className="text-emerald-500 mr-1">+</span>{diffs[selectedDiff].textB}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>Line {diffs[selectedDiff].lineA > 0 ? `A:${diffs[selectedDiff].lineA}` : ''}{diffs[selectedDiff].lineA > 0 && diffs[selectedDiff].lineB > 0 ? ' → ' : ''}{diffs[selectedDiff].lineB > 0 ? `B:${diffs[selectedDiff].lineB}` : ''}</span>
                        <span>·</span>
                        <span>Change {selectedDiff + 1} of {changedDiffs.length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          disabled={selectedDiff <= 0}
                          onClick={() => {
                            const prevChanged = changedDiffs.findIndex((_, ci) => diffs.indexOf(changedDiffs[ci]) >= selectedDiff) - 1;
                            if (prevChanged >= 0) setSelectedDiff(diffs.indexOf(changedDiffs[prevChanged]));
                          }}
                        >
                          <ChevronLeft className="h-3 w-3 mr-1" />Prev
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          disabled={selectedDiff >= diffs.length - 1}
                          onClick={() => {
                            const curIdx = changedDiffs.findIndex(cd => diffs.indexOf(cd) === selectedDiff);
                            if (curIdx < changedDiffs.length - 1) setSelectedDiff(diffs.indexOf(changedDiffs[curIdx + 1]));
                          }}
                        >
                          Next<ChevronRightIcon className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


