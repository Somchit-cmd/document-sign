'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload,
  FileUp,
  X,
  Loader2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
  Zap,
  UserPlus,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { DocumentPriority } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  preview?: string;
}

interface RecipientEntry {
  id: string;
  email: string;
  name: string;
  role: 'signer' | 'cc' | 'viewer';
}

type DocumentType = 'pdf' | 'docx' | 'doc' | 'xlsx' | 'xls' | 'png' | 'jpg' | 'jpeg' | 'other';

function getDocumentTypeInfo(fileName: string): { type: DocumentType; label: string; icon: typeof FileText; color: string } {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'pdf':
      return { type: 'pdf', label: 'PDF Document', icon: FileText, color: 'text-red-500' };
    case 'docx':
    case 'doc':
      return { type: 'docx', label: 'Word Document', icon: File, color: 'text-blue-500' };
    case 'xlsx':
    case 'xls':
      return { type: 'xlsx', label: 'Excel Spreadsheet', icon: FileSpreadsheet, color: 'text-emerald-500' };
    case 'png':
    case 'jpg':
    case 'jpeg':
      return { type: 'png', label: 'Image File', icon: ImageIcon, color: 'text-purple-500' };
    default:
      return { type: 'other', label: 'Document', icon: File, color: 'text-gray-500' };
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUploadDialog() {
  const [open, setOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<DocumentPriority>('normal');
  const [category, setCategory] = useState('');
  const [folderId, setFolderId] = useState('');
  const [tags, setTags] = useState('');
  const [recipients, setRecipients] = useState<RecipientEntry[]>([]);
  const [startWorkflow, setStartWorkflow] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [newRecipientEmail, setNewRecipientEmail] = useState('');
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newRecipientRole, setNewRecipientRole] = useState<'signer' | 'cc' | 'viewer'>('signer');
  const [step, setStep] = useState<1 | 2>(1);

  // Fetch folders for folder selector
  const { data: foldersData } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const res = await fetch('/api/folders');
      const data = await res.json();
      return data;
    },
    enabled: open,
  });

  const folders = (foldersData?.data?.folders || foldersData?.data || []) as { id: string; name: string }[];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const processFiles = useCallback((selectedFiles: File[]) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg'];
    const validExts = ['.pdf', '.doc', '.docx', '.xlsx', '.xls', '.png', '.jpg', '.jpeg'];

    const filteredFiles = selectedFiles.filter((f) => {
      const ext = '.' + (f.name.split('.').pop()?.toLowerCase() || '');
      return validTypes.includes(f.type) || validExts.includes(ext);
    });

    const newFiles: UploadedFile[] = filteredFiles.map((f) => ({
      file: f,
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      status: 'pending' as const,
      progress: 0,
    }));

    // Generate preview for image files
    newFiles.forEach((f) => {
      if (f.file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setFiles((prev) =>
            prev.map((existing) =>
              existing.id === f.id ? { ...existing, preview: reader.result as string } : existing
            )
          );
        };
        reader.readAsDataURL(f.file);
      }
    });

    setFiles((prev) => [...prev, ...newFiles]);

    // Auto-fill title from first file
    if (files.length === 0 && filteredFiles.length > 0) {
      setTitle(filteredFiles[0].name.replace(/\.[^/.]+$/, ''));
    }
  }, [files.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, [processFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      processFiles(selectedFiles);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (previewFile?.id === id) setPreviewFile(null);
  };

  const simulateUpload = async (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status: 'uploading', progress: 0 } : f))
    );

    for (let i = 0; i <= 100; i += Math.random() * 15 + 5) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const progress = Math.min(i, 100);
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, progress } : f))
      );
    }

    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status: 'done', progress: 100 } : f))
    );
  };

  const addRecipient = useCallback(() => {
    if (!newRecipientEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    const entry: RecipientEntry = {
      id: `r-${Date.now()}-${Math.random()}`,
      email: newRecipientEmail.trim(),
      name: newRecipientName.trim() || newRecipientEmail.trim().split('@')[0],
      role: newRecipientRole,
    };
    setRecipients((prev) => [...prev, entry]);
    setNewRecipientEmail('');
    setNewRecipientName('');
    toast.success(`${entry.name} added as ${entry.role}`);
  }, [newRecipientEmail, newRecipientName, newRecipientRole]);

  const removeRecipient = useCallback((id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleUpload = async () => {
    if (files.length === 0) return;

    // Upload all files
    for (const file of files) {
      if (file.status !== 'done') {
        await simulateUpload(file.id);
      }
    }

    toast.success(`${files.length} document(s) uploaded successfully`);
    resetForm();
  };

  const resetForm = () => {
    setFiles([]);
    setTitle('');
    setDescription('');
    setPriority('normal');
    setCategory('');
    setFolderId('');
    setTags('');
    setRecipients([]);
    setStartWorkflow(false);
    setPreviewFile(null);
    setStep(1);
    setOpen(false);
  };

  const allDone = files.length > 0 && files.every((f) => f.status === 'done');
  const anyUploading = files.some((f) => f.status === 'uploading');
  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 btn-click-scale">
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-emerald-600" />
            Upload Document
          </DialogTitle>
          <DialogDescription>
            Upload files and configure document settings
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-1">
          <button
            className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition-colors ${
              step === 1 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'
            }`}
            onClick={() => setStep(1)}
          >
            <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
              step === 1 ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>1</span>
            Files
          </button>
          <div className="flex-1 h-px bg-border" />
          <button
            className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition-colors ${
              step === 2 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'
            }`}
            onClick={() => files.length > 0 && setStep(2)}
            disabled={files.length === 0}
          >
            <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
              step === 2 ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>2</span>
            Details
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-2">
            {step === 1 ? (
              <>
                {/* Drop zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    dragActive
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 scale-[1.01]'
                      : 'border-border hover:border-emerald-400 dark:hover:border-emerald-600'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className={`mx-auto mb-3 ${dragActive ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                    <FileUp className="h-10 w-10 mx-auto" />
                  </div>
                  <p className="text-sm font-medium">
                    {dragActive ? 'Drop files here' : 'Drag & drop files here'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOCX, XLSX, or images · Multiple files supported · Up to 25MB each
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.xls"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload" className="mt-3 inline-block">
                    <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                      <span className="gap-1.5">
                        <Plus className="h-3.5 w-3.5" />
                        Browse Files
                      </span>
                    </Button>
                  </Label>
                </div>

                {/* File list */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{files.length} file(s) selected</span>
                      <span className="text-[10px] text-muted-foreground">Total: {formatSize(totalSize)}</span>
                    </div>
                    <div className="space-y-1.5 max-h-56 overflow-y-auto">
                      {files.map((file) => {
                        const docInfo = getDocumentTypeInfo(file.file.name);
                        const DocIcon = docInfo.icon;
                        return (
                          <div
                            key={file.id}
                            className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors ${
                              previewFile?.id === file.id
                                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10'
                                : 'border-border bg-muted/30 hover:bg-muted/50'
                            }`}
                          >
                            {/* File icon or preview */}
                            <div
                              className="shrink-0 w-10 h-10 rounded-md bg-white dark:bg-gray-800 border flex items-center justify-center overflow-hidden cursor-pointer"
                              onClick={() => setPreviewFile(previewFile?.id === file.id ? null : file)}
                            >
                              {file.preview ? (
                                <img src={file.preview} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <DocIcon className={`h-5 w-5 ${docInfo.color}`} />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate font-medium">{file.file.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-muted-foreground">{formatSize(file.file.size)}</span>
                                <Badge variant="outline" className="text-[9px] h-4">{docInfo.label}</Badge>
                              </div>
                              {file.status === 'uploading' && (
                                <Progress value={file.progress} className="h-1.5 w-full mt-1.5" />
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {file.status === 'done' ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              ) : file.status === 'error' ? (
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              ) : file.status === 'uploading' ? (
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[9px] border-0">
                                  {Math.round(file.progress)}%
                                </Badge>
                              ) : null}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => removeFile(file.id)}
                                disabled={file.status === 'uploading'}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* File preview panel */}
                    {previewFile && previewFile.preview && (
                      <div className="rounded-lg border overflow-hidden bg-white dark:bg-gray-900">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b">
                          <span className="text-[10px] font-medium">Preview</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => setPreviewFile(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="p-2 flex items-center justify-center max-h-40">
                          <img src={previewFile.preview} alt="Preview" className="max-h-36 object-contain rounded" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Next step button */}
                {files.length > 0 && (
                  <div className="flex justify-end">
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                      onClick={() => setStep(2)}
                    >
                      Next: Add Details
                    </Button>
                  </div>
                )}
              </>
            ) : (
              /* Step 2: Details */
              <>
                {/* Document details */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="doc-title" className="text-xs">Document Title *</Label>
                    <Input
                      id="doc-title"
                      placeholder="Enter document title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="doc-desc" className="text-xs">Description (Optional)</Label>
                    <Textarea
                      id="doc-desc"
                      placeholder="Brief description of the document"
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Priority</Label>
                      <Select value={priority} onValueChange={(v) => setPriority(v as DocumentPriority)}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="agreement">Agreement</SelectItem>
                          <SelectItem value="nda">NDA</SelectItem>
                          <SelectItem value="hr">HR</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Folder</Label>
                      <Select value={folderId} onValueChange={setFolderId}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select folder" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No folder</SelectItem>
                          {folders.map((f: { id: string; name: string }) => (
                            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="doc-tags" className="text-xs">Tags (comma separated)</Label>
                      <Input
                        id="doc-tags"
                        placeholder="e.g. contract, urgent"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  {tags && (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.split(',').map((tag, i) => tag.trim() && (
                        <Badge key={i} variant="secondary" className="text-[10px]">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Recipients */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <UserPlus className="h-3.5 w-3.5 text-emerald-600" />
                      Recipients / Signers
                    </Label>
                    <Badge variant="outline" className="text-[9px]">{recipients.length}</Badge>
                  </div>

                  {recipients.length > 0 && (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {recipients.map((r) => (
                        <div key={r.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[8px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                              {r.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{r.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{r.email}</p>
                          </div>
                          <Badge variant="outline" className="text-[9px] capitalize">{r.role}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-muted-foreground hover:text-destructive"
                            onClick={() => removeRecipient(r.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <Input
                        placeholder="Email address"
                        value={newRecipientEmail}
                        onChange={(e) => setNewRecipientEmail(e.target.value)}
                        className="h-8 text-sm"
                        type="email"
                      />
                    </div>
                    <div className="w-28 space-y-1">
                      <Select value={newRecipientRole} onValueChange={(v) => setNewRecipientRole(v as 'signer' | 'cc' | 'viewer')}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="signer">Signer</SelectItem>
                          <SelectItem value="cc">CC</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 shrink-0 gap-1"
                      onClick={addRecipient}
                      disabled={!newRecipientEmail.trim()}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Workflow option */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-xs font-medium">Start workflow immediately</p>
                      <p className="text-[10px] text-muted-foreground">Begin the signing process after upload</p>
                    </div>
                  </div>
                  <Switch
                    checked={startWorkflow}
                    onCheckedChange={setStartWorkflow}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex justify-between gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => resetForm()}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={files.length === 0 || anyUploading || !title.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                    >
                      {anyUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : allDone ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Done
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Upload {files.length > 1 ? `${files.length} Files` : ''}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
