'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  User,
  Shield,
  Bell,
  Camera,
  Key,
  Smartphone,
  Mail,
  Monitor,
  Globe,
  Webhook,
  MessageSquare,
  Hash,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RefreshCw,
  ScanFace,
} from 'lucide-react';
import { toast } from 'sonner';

// ========= Profile Settings =========
function ProfileSettings() {
  const { user, token } = useAppStore();
  const queryClient = useQueryClient();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      return api.updateUser(user.id, { name, email, jobTitle, phone });
    },
    onSuccess: () => {
      if (user) {
        const updatedUser = { ...user, name, email, jobTitle, phone };
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('docsign-auth');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.user = updatedUser;
            localStorage.setItem('docsign-auth', JSON.stringify(parsed));
          }
        }
      }
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
      toast.success('Profile updated successfully');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const handleRestartTour = () => {
    try {
      localStorage.setItem('docsign-onboarding-complete', 'false');
    } catch {
      // localStorage not available
    }
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Information</CardTitle>
          <CardDescription>Update your personal details and avatar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar section */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />Upload Photo
              </Button>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF. Max 2MB.</p>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive mt-1">
                Remove
              </Button>
            </div>
          </div>

          <Separator />

          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              className="bg-primary hover:bg-primary/90"
              disabled={updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Onboarding</CardTitle>
          <CardDescription>Manage your tour and tutorial preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Restart Onboarding Tour</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Replay the guided tour to rediscover platform features
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRestartTour}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Restart Tour
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Upload(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

// ========= Security Settings =========
function SecuritySettings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const mfaMethods = [
    { name: 'Authenticator App', description: 'Use Google Authenticator or Authy', icon: Smartphone, enabled: true, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
    { name: 'Hardware Key', description: 'Use a YubiKey or similar security key', icon: Key, enabled: false, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
    { name: 'SMS Verification', description: 'Receive codes via text message', icon: Smartphone, enabled: false, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
    { name: 'Biometric', description: 'Use fingerprint or face recognition', icon: ScanFace, enabled: false, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
  ];

  const sessions = [
    { device: 'Chrome on MacOS', ip: '192.168.1.100', location: 'San Francisco, CA', current: true, lastActive: 'Now', browser: 'Chrome 120' },
    { device: 'Safari on iPhone', ip: '192.168.1.150', location: 'San Francisco, CA', current: false, lastActive: '2 hours ago', browser: 'Safari 17' },
    { device: 'Firefox on Windows', ip: '10.0.0.50', location: 'New York, NY', current: false, lastActive: '1 day ago', browser: 'Firefox 121' },
    { device: 'Edge on Surface Pro', ip: '172.16.0.22', location: 'Austin, TX', current: false, lastActive: '3 days ago', browser: 'Edge 120' },
  ];

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" />Change Password</CardTitle>
          <CardDescription>Ensure your account is using a strong password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <div className="relative">
              <Input type={showCurrentPassword ? 'text' : 'password'} placeholder="••••••••" />
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                {showCurrentPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input type={showNewPassword ? 'text' : 'password'} placeholder="••••••••" />
                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowNewPassword(!showNewPassword)}>
                  {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button className="bg-primary hover:bg-primary/90" onClick={() => toast.success('Password updated')}>Update Password</Button>
          </div>
        </CardContent>
      </Card>

      {/* MFA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" />Multi-Factor Authentication</CardTitle>
          <CardDescription>Add extra security to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mfaMethods.map((method) => {
            const Icon = method.icon;
            return (
              <div key={method.name} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg ${method.color} p-2`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{method.name}</p>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                  </div>
                </div>
                {method.enabled ? (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">Enabled</Badge>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => toast.info(`${method.name} setup coming soon`)}>Set Up</Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Monitor className="h-4 w-4" />Active Sessions</CardTitle>
          <CardDescription>Manage your active sessions across devices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessions.map((session, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{session.device}</p>
                      {session.current && <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Current</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {session.browser} · IP: {session.ip} · {session.location} · {session.lastActive}
                    </p>
                  </div>
                </div>
                {!session.current && (
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => toast.success('Session revoked')}>
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => toast.success('All other sessions revoked')}>
              Revoke All Other Sessions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ========= Notification Settings =========
function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailDocumentSent: true,
    emailDocumentSigned: true,
    emailDocumentRejected: true,
    emailDocumentExpiring: true,
    emailMentions: true,
    emailWeeklyDigest: false,
    emailDailySummary: true,
    pushDocumentSent: true,
    pushDocumentSigned: true,
    pushDocumentRejected: true,
    pushMentions: true,
    pushUrgentOnly: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const emailItems = [
    { key: 'emailDocumentSent' as const, label: 'Document sent', desc: 'When a document is sent for signature' },
    { key: 'emailDocumentSigned' as const, label: 'Document signed', desc: 'When a recipient signs a document' },
    { key: 'emailDocumentRejected' as const, label: 'Document rejected', desc: 'When a recipient rejects a document' },
    { key: 'emailDocumentExpiring' as const, label: 'Document expiring', desc: 'When a document is about to expire' },
    { key: 'emailMentions' as const, label: 'Mentions', desc: 'When you are mentioned in a comment' },
    { key: 'emailWeeklyDigest' as const, label: 'Weekly digest', desc: 'Summary of weekly activity' },
    { key: 'emailDailySummary' as const, label: 'Daily summary', desc: 'Daily email with pending items' },
  ];

  const pushItems = [
    { key: 'pushDocumentSent' as const, label: 'Document sent', desc: 'When a document is sent for signature' },
    { key: 'pushDocumentSigned' as const, label: 'Document signed', desc: 'When a recipient signs a document' },
    { key: 'pushDocumentRejected' as const, label: 'Document rejected', desc: 'When a recipient rejects a document' },
    { key: 'pushMentions' as const, label: 'Mentions', desc: 'When you are mentioned in a comment' },
    { key: 'pushUrgentOnly' as const, label: 'Urgent only', desc: 'Only receive push for urgent items' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" />Email Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {emailItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch checked={settings[item.key]} onCheckedChange={() => toggleSetting(item.key)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" />Push Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pushItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch checked={settings[item.key]} onCheckedChange={() => toggleSetting(item.key)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="bg-primary hover:bg-primary/90" onClick={() => toast.success('Notification preferences saved')}>Save Preferences</Button>
      </div>
    </div>
  );
}

// ========= API Keys Settings =========
function ApiKeysSettings() {
  const [keys, setKeys] = useState([
    { id: '1', name: 'Production API Key', prefix: 'dsg_prod_****a7f3', created: '2025-05-15', lastUsed: '2 hours ago', status: 'active' },
    { id: '2', name: 'Staging API Key', prefix: 'dsg_stg_****b2e1', created: '2025-06-01', lastUsed: '1 day ago', status: 'active' },
    { id: '3', name: 'Legacy Integration', prefix: 'dsg_legacy_****c4d5', created: '2024-11-20', lastUsed: '30 days ago', status: 'expired' },
  ]);

  const handleGenerateKey = () => {
    const newKey = {
      id: String(keys.length + 1),
      name: `API Key ${keys.length + 1}`,
      prefix: `dsg_${Math.random().toString(36).substring(2, 6)}_****${Math.random().toString(36).substring(2, 6)}`,
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      status: 'active',
    };
    setKeys([...keys, newKey]);
    toast.success('New API key generated');
  };

  const handleRevokeKey = (id: string) => {
    setKeys(keys.filter(k => k.id !== id));
    toast.success('API key revoked');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2"><Key className="h-4 w-4" />API Keys</CardTitle>
              <CardDescription className="mt-1">Manage API keys for programmatic access</CardDescription>
            </div>
            <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={handleGenerateKey}>
              <Plus className="mr-2 h-4 w-4" />Generate Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {keys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="text-sm font-medium">{key.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{key.prefix}</code>
                    <span className="text-xs text-muted-foreground">Created {key.created}</span>
                    <span className="text-xs text-muted-foreground">Last used {key.lastUsed}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={key.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}>
                    {key.status}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(key.prefix); toast.success('Copied to clipboard'); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleRevokeKey(key.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ========= Integrations Settings =========
function IntegrationsSettings() {
  const integrations = [
    { name: 'Microsoft SSO', description: 'Sign in with Microsoft Entra ID', icon: Globe, connected: true, category: 'SSO' },
    { name: 'Google SSO', description: 'Sign in with Google Workspace', icon: Globe, connected: false, category: 'SSO' },
    { name: 'SAML 2.0', description: 'Enterprise SSO via SAML', icon: Shield, connected: false, category: 'SSO' },
    { name: 'Slack', description: 'Send notifications to Slack channels', icon: Hash, connected: true, category: 'Messaging' },
    { name: 'Microsoft Teams', description: 'Send notifications to Teams channels', icon: MessageSquare, connected: false, category: 'Messaging' },
    { name: 'Webhooks', description: 'Custom HTTP callbacks for events', icon: Webhook, connected: true, category: 'Automation' },
    { name: 'Zapier', description: 'Connect with 5000+ apps via Zapier', icon: RefreshCw, connected: false, category: 'Automation' },
  ];

  return (
    <div className="space-y-6">
      {['SSO', 'Messaging', 'Automation'].map((category) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-base">{category}</CardTitle>
            <CardDescription>
              {category === 'SSO' && 'Single Sign-On providers for authentication'}
              {category === 'Messaging' && 'Notification integrations for your team'}
              {category === 'Automation' && 'Workflow automation and custom integrations'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {integrations.filter(i => i.category === category).map((integration) => {
                const Icon = integration.icon;
                return (
                  <div key={integration.name} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{integration.name}</p>
                        <p className="text-xs text-muted-foreground">{integration.description}</p>
                      </div>
                    </div>
                    {integration.connected ? (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                          <CheckCircle2 className="mr-1 h-3 w-3" />Connected
                        </Badge>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => toast.success(`${integration.name} disconnected`)}>
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => toast.info(`${integration.name} setup coming soon`)}>
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />Connect
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ========= Main Settings Page =========
export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />Profile</TabsTrigger>
          <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" />Security</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" />Notifications</TabsTrigger>
          <TabsTrigger value="api-keys"><Key className="mr-2 h-4 w-4" />API Keys</TabsTrigger>
          <TabsTrigger value="integrations"><Globe className="mr-2 h-4 w-4" />Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4"><ProfileSettings /></TabsContent>
        <TabsContent value="security" className="mt-4"><SecuritySettings /></TabsContent>
        <TabsContent value="notifications" className="mt-4"><NotificationSettings /></TabsContent>
        <TabsContent value="api-keys" className="mt-4"><ApiKeysSettings /></TabsContent>
        <TabsContent value="integrations" className="mt-4"><IntegrationsSettings /></TabsContent>
      </Tabs>
    </div>
  );
}
