'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  LayoutDashboard,
  Inbox,
  FileText,
  LayoutTemplate,
  GitBranch,
  BarChart3,
  Keyboard,
  Rocket,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

const ONBOARDING_KEY = 'docsign-onboarding-complete';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  emoji: string;
  targetPage?: string;
  features?: string[];
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to DocuSign Enterprise!',
    description:
      'Your all-in-one platform for secure document signing, approval workflows, and compliance tracking. Let us show you around — it only takes a minute.',
    icon: <Sparkles className="h-10 w-10" />,
    emoji: '🎉',
  },
  {
    id: 'dashboard',
    title: 'Your Command Center',
    description:
      'The Dashboard gives you a complete overview of your document activity. Track stats, see recent documents, and take quick actions — all from one place.',
    icon: <LayoutDashboard className="h-10 w-10" />,
    emoji: '📊',
    targetPage: 'dashboard',
    features: [
      'Real-time document statistics',
      'Quick action buttons',
      'Activity heatmap & deadline tracker',
      'Signing analytics at a glance',
    ],
  },
  {
    id: 'inbox',
    title: 'Stay on Top of Tasks',
    description:
      'Your Inbox keeps all pending approvals and signature requests organized. Never miss an urgent document again with smart prioritization.',
    icon: <Inbox className="h-10 w-10" />,
    emoji: '📥',
    targetPage: 'inbox',
    features: [
      'Pending approvals queue',
      'Urgent items highlighted',
      'Smart notification grouping',
      'One-click sign or reject',
    ],
  },
  {
    id: 'documents',
    title: 'Document Management',
    description:
      'Upload, organize, and manage all your documents. Switch between grid and list views, apply filters, and perform bulk actions effortlessly.',
    icon: <FileText className="h-10 w-10" />,
    emoji: '📄',
    targetPage: 'documents',
    features: [
      'Upload & send for signature',
      'Grid & list view toggle',
      'Advanced filters & search',
      'Bulk actions & quick previews',
    ],
  },
  {
    id: 'templates',
    title: 'Work Smarter with Templates',
    description:
      'Create reusable templates for common document types. Set up fields once, and auto-fill them every time — saving hours on repetitive paperwork.',
    icon: <LayoutTemplate className="h-10 w-10" />,
    emoji: '📋',
    targetPage: 'templates',
    features: [
      'Category-based organization',
      'Variable auto-fill fields',
      'Usage tracking & analytics',
      'Recently used quick access',
    ],
  },
  {
    id: 'workflows',
    title: 'Automate Approvals',
    description:
      'Build powerful approval workflows with our visual builder. Set up sequential or parallel approval chains to keep documents moving.',
    icon: <GitBranch className="h-10 w-10" />,
    emoji: '🔄',
    targetPage: 'workflow-builder',
    features: [
      'Visual workflow builder',
      'Sequential & parallel paths',
      'Conditional routing rules',
      'Real-time progress tracking',
    ],
  },
  {
    id: 'reports',
    title: 'Track Everything',
    description:
      'Comprehensive analytics and compliance reporting. Monitor signing performance, department metrics, and compliance scores with beautiful charts.',
    icon: <BarChart3 className="h-10 w-10" />,
    emoji: '📈',
    targetPage: 'reports',
    features: [
      'Activity & trend charts',
      'Compliance score tracking',
      'Department breakdowns',
      'Top signer performance',
    ],
  },
  {
    id: 'shortcuts',
    title: 'Power User Tips',
    description:
      'Speed up your workflow with keyboard shortcuts. Navigate pages, search documents, and trigger actions without touching your mouse.',
    icon: <Keyboard className="h-10 w-10" />,
    emoji: '⌨️',
    features: [
      '⌘K — Open command palette',
      '⌘/ — Show keyboard shortcuts',
      'G then D — Go to Dashboard',
      'G then I — Go to Inbox',
    ],
  },
  {
    id: 'complete',
    title: "You're All Set!",
    description:
      'You now know the key areas of DocuSign Enterprise. Explore at your own pace, and remember — you can restart this tour anytime from Settings.',
    icon: <Rocket className="h-10 w-10" />,
    emoji: '🚀',
  },
];

export function OnboardingTour() {
  const { isAuthenticated, navigate } = useAppStore();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      const completed = localStorage.getItem(ONBOARDING_KEY);
      if (completed !== 'true') {
        // Small delay so the app renders first
        const timer = setTimeout(() => setIsVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage not available
    }
  }, [isAuthenticated]);

  const closeTour = useCallback(() => {
    setIsVisible(false);
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      // localStorage not available
    }
  }, []);

  const skipTour = useCallback(() => {
    closeTour();
  }, [closeTour]);

  const goNext = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      closeTour();
    }
  }, [currentStep, closeTour]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const goToDashboard = useCallback(() => {
    closeTour();
    navigate('dashboard');
  }, [closeTour, navigate]);

  // Navigate to the target page when step changes
  useEffect(() => {
    if (!isVisible) return;
    const step = tourSteps[currentStep];
    if (step?.targetPage) {
      navigate(step.targetPage);
    }
  }, [currentStep, isVisible, navigate]);

  if (!isVisible) return null;

  const step = tourSteps[currentStep];
  const isWelcome = currentStep === 0;
  const isComplete = currentStep === tourSteps.length - 1;
  const isContentStep = !isWelcome && !isComplete;
  const progressValue = ((currentStep + 1) / tourSteps.length) * 100;

  // Determine card position based on step
  const getCardPosition = () => {
    switch (step.id) {
      case 'welcome':
        return 'items-center justify-center';
      case 'dashboard':
        return 'items-start justify-start pt-20 pl-6 sm:pl-20';
      case 'inbox':
        return 'items-start justify-start pt-20 pl-6 sm:pl-20';
      case 'documents':
        return 'items-start justify-center';
      case 'templates':
        return 'items-start justify-end pr-6 sm:pr-20';
      case 'workflows':
        return 'items-center justify-end pr-6 sm:pr-20';
      case 'reports':
        return 'items-end justify-end pr-6 sm:pr-20 pb-20';
      case 'shortcuts':
        return 'items-end justify-start pl-6 sm:pl-20 pb-20';
      case 'complete':
        return 'items-center justify-center';
      default:
        return 'items-center justify-center';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={skipTour}
          />

          {/* Skip Tour button - always accessible */}
          <motion.button
            className="absolute top-4 right-4 z-[110] flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
            onClick={skipTour}
          >
            <X className="h-4 w-4" />
            Skip Tour
          </motion.button>

          {/* Floating Card */}
          <div className={`relative z-[105] flex p-4 sm:p-8 ${getCardPosition()}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Card
                  className="w-[340px] sm:w-[420px] overflow-hidden border-0 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Gradient top bar */}
                  <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

                  <div className="bg-card/90 backdrop-blur-xl p-6">
                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {isWelcome ? 'Getting Started' : `Step ${currentStep} of ${tourSteps.length - 2}`}
                        </span>
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {Math.round(progressValue)}%
                        </span>
                      </div>
                      <Progress value={progressValue} className="h-1.5 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:via-teal-500 [&>div]:to-cyan-500" />
                    </div>

                    {/* Icon / Emoji */}
                    <motion.div
                      className="flex items-center justify-center mb-4"
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                    >
                      <div className="relative">
                        <div className="text-5xl">{step.emoji}</div>
                        <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-full blur-xl -z-10" />
                      </div>
                    </motion.div>

                    {/* Step number badge */}
                    {isContentStep && (
                      <div className="flex justify-center mb-3">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-[11px] font-bold text-white">
                          {currentStep}
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-lg font-bold text-center mb-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground text-center leading-relaxed mb-4">
                      {step.description}
                    </p>

                    {/* Features list for content steps */}
                    {step.features && (
                      <div className="space-y-2 mb-5">
                        {step.features.map((feature, idx) => (
                          <motion.div
                            key={feature}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/50 border border-border/50"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 + idx * 0.07 }}
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            <span className="text-xs font-medium text-foreground/80">{feature}</span>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Completion checklist */}
                    {isComplete && (
                      <div className="space-y-1.5 mb-5">
                        {['Dashboard', 'Inbox', 'Documents', 'Templates', 'Workflows', 'Reports', 'Shortcuts'].map(
                          (item, idx) => (
                            <motion.div
                              key={item}
                              className="flex items-center gap-2 text-xs text-muted-foreground"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.1 + idx * 0.05 }}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              <span>{item} explored</span>
                            </motion.div>
                          )
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-between gap-2 mt-2">
                      {isWelcome ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={skipTour}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Skip for now
                          </Button>
                          <Button
                            size="sm"
                            onClick={goNext}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md"
                          >
                            Start Tour
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </>
                      ) : isComplete ? (
                        <div className="w-full flex justify-center">
                          <Button
                            onClick={goToDashboard}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md px-6"
                          >
                            Go to Dashboard
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={goBack}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Back
                          </Button>
                          <Button
                            size="sm"
                            onClick={goNext}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md"
                          >
                            {currentStep === tourSteps.length - 2 ? 'Finish' : 'Next'}
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Step indicator dots */}
                    {isContentStep && (
                      <div className="flex items-center justify-center gap-1.5 mt-4">
                        {tourSteps.slice(1, -1).map((s, idx) => (
                          <motion.div
                            key={s.id}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              idx + 1 === currentStep
                                ? 'w-6 bg-gradient-to-r from-emerald-500 to-teal-500'
                                : idx + 1 < currentStep
                                  ? 'w-1.5 bg-emerald-500/50'
                                  : 'w-1.5 bg-muted-foreground/20'
                            }`}
                            initial={false}
                            animate={
                              idx + 1 === currentStep
                                ? { scale: [1, 1.1, 1] }
                                : { scale: 1 }
                            }
                            transition={{ duration: 0.3 }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Spotlight effect - pulse animation around the card */}
          <AnimatePresence>
            {isContentStep && (
              <motion.div
                className="absolute inset-0 pointer-events-none z-[102]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-teal-500/40 to-transparent"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
