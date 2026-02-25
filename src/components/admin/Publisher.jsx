import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, Clock, CheckCircle2, XCircle, RotateCcw, Eye, Shield,
  ChevronDown, ChevronRight, FileText, GitBranch, AlertTriangle,
  User, Calendar, ArrowRight, TestTube, Send, ThumbsUp, ThumbsDown,
  History, Tag, Loader2, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  useChangeRequests, useInsertChangeRequest, useUpdateChangeRequest,
  usePublishedVersions, useInsertPublishedVersion, useUpdatePublishedVersion,
} from '@/hooks/useAdminData';

const DEMO_USERS = [
  { id: 'supervisor', name: 'Jane Mwangi (Supervisor)', role: 'maker' },
  { id: 'tech-officer', name: 'Peter Ochieng (Tech Officer)', role: 'maker' },
  { id: 'manager', name: 'Sarah Kimani (Manager)', role: 'checker' },
  { id: 'it-lead', name: 'David Njoroge (IT Lead)', role: 'checker' },
];

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground', icon: FileText },
  submitted: { label: 'Submitted', color: 'bg-info/10 text-info', icon: Send },
  in_review: { label: 'In Review', color: 'bg-warning/10 text-warning', icon: Eye },
  testing: { label: 'Testing', color: 'bg-accent/10 text-accent-foreground', icon: TestTube },
  approved: { label: 'Approved', color: 'bg-success/10 text-success', icon: ThumbsUp },
  rejected: { label: 'Rejected', color: 'bg-destructive/10 text-destructive', icon: ThumbsDown },
  published: { label: 'Published', color: 'bg-success/10 text-success', icon: Rocket },
};

const FLOW_ORDER = ['draft', 'submitted', 'in_review', 'testing', 'approved', 'published'];

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <Badge variant="secondary" className={`gap-1 ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Main Component
export function Publisher() {
  const [selectedId, setSelectedId] = useState(null);
  const [activeRole, setActiveRole] = useState('supervisor');
  const [subView, setSubView] = useState('requests');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState('workflow');

  const { data: changes = [], isLoading: loadingCR } = useChangeRequests();
  const { data: versions = [], isLoading: loadingVer } = usePublishedVersions();
  const insertCR = useInsertChangeRequest();
  const updateCR = useUpdateChangeRequest();
  const insertVersion = useInsertPublishedVersion();
  const updateVersion = useUpdatePublishedVersion();

  const selected = changes.find(c => c.id === selectedId) ?? null;
  const activeUser = DEMO_USERS.find(u => u.id === activeRole);
  const isMaker = activeUser.role === 'maker';
  const isChecker = activeUser.role === 'checker';

  const handleCreateCR = () => {
    if (!newTitle.trim()) return;
    insertCR.mutate({
      title: newTitle,
      description: newDesc,
      change_type: newType,
      service_id: 'general',
      config_snapshot: {},
      status: 'draft',
      submitted_by: activeUser.name,
    }, {
      onSuccess: (data) => {
        setSelectedId(data.id);
        setNewTitle('');
        setNewDesc('');
        toast({ title: 'Change request created' });
      },
    });
  };

  const handleSubmit = (id) => {
    updateCR.mutate({ id, status: 'submitted' }, {
      onSuccess: () => toast({ title: 'Change submitted for review' }),
    });
  };

  const handlePickUp = (id) => {
    updateCR.mutate({ id, status: 'in_review', reviewed_by: activeUser.name }, {
      onSuccess: () => toast({ title: 'Review started', description: `${activeUser.name} is now reviewing.` }),
    });
  };

  const handleRunTests = (id) => {
    const mockTests = [
      { id: crypto.randomUUID(), name: 'Regression: core workflow', passed: true, details: 'All stages pass', runAt: new Date().toISOString() },
      { id: crypto.randomUUID(), name: 'Field mapping integrity', passed: true, details: 'No data loss detected', runAt: new Date().toISOString() },
      { id: crypto.randomUUID(), name: 'Performance benchmark', passed: Math.random() > 0.3, details: Math.random() > 0.3 ? 'Response < 500ms' : 'Response > 2s', runAt: new Date().toISOString() },
    ];
    updateCR.mutate({ id, status: 'testing', test_results: mockTests }, {
      onSuccess: () => toast({ title: 'Regression tests complete', description: `${mockTests.filter(t => t.passed).length}/${mockTests.length} passed.` }),
    });
  };

  const handleApprove = (id, notes) => {
    updateCR.mutate({ id, status: 'approved', review_notes: notes || 'Approved by checker.' }, {
      onSuccess: () => toast({ title: 'Change approved' }),
    });
  };

  const handleReject = (id, notes) => {
    updateCR.mutate({ id, status: 'rejected', review_notes: notes || 'Rejected.' }, {
      onSuccess: () => toast({ title: 'Change rejected', variant: 'destructive' }),
    });
  };

  const handlePublish = (id) => {
    const cr = changes.find(c => c.id === id);
    if (!cr) return;
    const versionNum = versions.length + 1;
    updateCR.mutate({ id, status: 'published' });
    insertVersion.mutate({
      change_request_id: id,
      version_number: versionNum,
      change_type: cr.change_type,
      service_id: cr.service_id,
      config_snapshot: cr.config_snapshot,
      published_by: activeUser.name,
      is_active: true,
    }, {
      onSuccess: () => toast({ title: '🚀 Published to production', description: `Version ${versionNum} is now live.` }),
    });
  };

  const handleRollback = (versionId) => {
    const ver = versions.find(v => v.id === versionId);
    updateVersion.mutate({ id: versionId, is_active: false }, {
      onSuccess: () => {
        if (ver?.change_request_id) {
          updateCR.mutate({ id: ver.change_request_id, status: 'rejected', review_notes: 'Rolled back from production.' });
        }
        toast({ title: 'Rollback complete', description: `Version ${ver?.version_number} deactivated.`, variant: 'destructive' });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant={subView === 'requests' ? 'default' : 'outline'} size="sm" className="gap-1.5" onClick={() => setSubView('requests')}>
            <FileText className="h-3.5 w-3.5" /> Change Requests
          </Button>
          <Button variant={subView === 'history' ? 'default' : 'outline'} size="sm" className="gap-1.5" onClick={() => setSubView('history')}>
            <History className="h-3.5 w-3.5" /> Version History
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Acting as:</Label>
          <Select value={activeRole} onValueChange={setActiveRole}>
            <SelectTrigger className="w-[260px] h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DEMO_USERS.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.name} <span className="text-muted-foreground ml-1">({u.role})</span></SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* VERSION HISTORY */}
      {subView === 'history' && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><GitBranch className="h-4 w-4 text-accent" /> Production Version History</CardTitle>
            <CardDescription>All published versions with rollback capability</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingVer && <p className="text-xs text-muted-foreground text-center py-4">Loading…</p>}
            <div className="space-y-3">
              {versions.map(v => (
                <div key={v.id} className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${v.is_active ? 'bg-success/5 border-success/20' : 'bg-muted/30 border-border/50'}`}>
                  <div className="flex items-center gap-2 shrink-0">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm font-semibold">v{v.version_number}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{v.service_id}</p>
                    <p className="text-xs text-muted-foreground">Published by {v.published_by} • {formatDate(v.created_at)}</p>
                  </div>
                  <Badge variant={v.change_type === 'workflow' ? 'outline' : 'secondary'} className="text-xs shrink-0">
                    {v.change_type === 'workflow' ? 'Workflow' : 'API'}
                  </Badge>
                  {v.is_active ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className="bg-success/10 text-success border-0 text-xs">Active</Badge>
                      {isChecker && (
                        <Button size="sm" variant="outline" className="gap-1 text-xs text-destructive hover:text-destructive" onClick={() => handleRollback(v.id)}>
                          <RotateCcw className="h-3 w-3" /> Rollback
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-xs shrink-0">Inactive</Badge>
                  )}
                </div>
              ))}
              {!loadingVer && versions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No versions published yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CHANGE REQUESTS */}
      {subView === 'requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Rocket className="h-4 w-4 text-accent" /> Change Requests</CardTitle>
              <CardDescription>Review and promote changes to production</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[45vh]">
                <div className="space-y-0.5 px-3 pb-3">
                  {loadingCR && <p className="text-xs text-muted-foreground text-center py-4">Loading…</p>}
                  {changes.map(cr => (
                    <button
                      key={cr.id}
                      onClick={() => setSelectedId(cr.id)}
                      className={`w-full text-left rounded-lg px-3 py-3 text-sm transition-colors ${
                        selectedId === cr.id ? 'bg-accent/10 text-accent-foreground' : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs text-muted-foreground">{cr.id.slice(0, 8)}</span>
                        <StatusBadge status={cr.status} />
                      </div>
                      <p className="font-medium text-sm">{cr.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cr.change_type === 'workflow' ? 'Workflow' : 'API'} • {cr.submitted_by?.split(' (')[0]}
                      </p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
              {/* Create new CR */}
              {isMaker && (
                <div className="border-t p-3 space-y-2">
                  <Label className="text-xs font-semibold">New Change Request</Label>
                  <Input placeholder="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="text-xs" />
                  <Textarea placeholder="Description" value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2} className="text-xs" />
                  <div className="flex gap-2">
                    <Select value={newType} onValueChange={v => setNewType(v)}>
                      <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="workflow">Workflow</SelectItem>
                        <SelectItem value="api">API</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="gap-1" onClick={handleCreateCR} disabled={insertCR.isPending}>
                      {insertCR.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Create
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detail */}
          {selected ? (
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{selected.id.slice(0, 8)}</span>
                      <StatusBadge status={selected.status} />
                    </div>
                    <CardTitle className="text-lg">{selected.title}</CardTitle>
                    <CardDescription className="mt-1">{selected.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[50vh] pr-4">
                  <div className="space-y-6">
                    {/* Pipeline */}
                    <section>
                      <h4 className="text-sm font-semibold mb-3">Promotion Pipeline</h4>
                      <div className="flex items-center gap-1 overflow-x-auto pb-2">
                        {FLOW_ORDER.map((stage, i) => {
                          const isCurrent = selected.status === stage;
                          const isPast = FLOW_ORDER.indexOf(selected.status) > i || selected.status === 'published';
                          return (
                            <div key={stage} className="flex items-center gap-1">
                              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                isCurrent ? 'bg-accent text-accent-foreground' : isPast ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                              }`}>
                                {isPast && !isCurrent ? <CheckCircle2 className="h-3 w-3" /> : null}
                                {STATUS_CONFIG[stage]?.label ?? stage}
                              </div>
                              {i < FLOW_ORDER.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    <Separator />

                    {/* Audit */}
                    <section className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Maker</Label>
                        <p className="text-sm font-medium flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{selected.submitted_by}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Checker</Label>
                        <p className="text-sm font-medium flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" />{selected.reviewed_by ?? 'Unassigned'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Created</Label>
                        <p className="text-xs flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{formatDate(selected.created_at)}</p>
                      </div>
                    </section>

                    <Separator />

                    {/* Test results */}
                    {selected.test_results && selected.test_results.length > 0 && (
                      <>
                        <section>
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><TestTube className="h-4 w-4" /> Test Results</h4>
                          <div className="space-y-2">
                            {selected.test_results.map(t => (
                              <div key={t.id} className={`flex items-center gap-3 rounded-md border px-3 py-2 text-xs ${t.passed ? 'border-success/20 bg-success/5' : 'border-destructive/20 bg-destructive/5'}`}>
                                {t.passed ? <CheckCircle2 className="h-4 w-4 text-success shrink-0" /> : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium">{t.name}</span>
                                  <span className="text-muted-foreground ml-2">{t.details}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                        <Separator />
                      </>
                    )}

                    {/* Review notes */}
                    {selected.review_notes && (
                      <>
                        <section>
                          <h4 className="text-sm font-semibold mb-2">Review Notes</h4>
                          <p className="text-sm bg-muted/30 rounded-lg p-3">{selected.review_notes}</p>
                        </section>
                        <Separator />
                      </>
                    )}

                    {/* Actions */}
                    <section className="space-y-3">
                      <h4 className="text-sm font-semibold">Actions</h4>
                      {isMaker && selected.status === 'draft' && (
                        <Button className="gap-1.5" onClick={() => handleSubmit(selected.id)} disabled={updateCR.isPending}>
                          <Send className="h-3.5 w-3.5" /> Submit for Review
                        </Button>
                      )}
                      {isMaker && selected.status === 'submitted' && (
                        <p className="text-sm text-muted-foreground">Waiting for a checker to pick up this review.</p>
                      )}
                      {isMaker && selected.status === 'rejected' && (
                        <Button className="gap-1.5" onClick={() => handleSubmit(selected.id)} disabled={updateCR.isPending}>
                          <Send className="h-3.5 w-3.5" /> Re-submit for Review
                        </Button>
                      )}
                      {isChecker && selected.status === 'submitted' && (
                        <Button className="gap-1.5" onClick={() => handlePickUp(selected.id)} disabled={updateCR.isPending}>
                          <Eye className="h-3.5 w-3.5" /> Pick Up for Review
                        </Button>
                      )}
                      {isChecker && (selected.status === 'in_review' || selected.status === 'testing') && (
                        <div className="space-y-3">
                          <Button variant="outline" className="gap-1.5" onClick={() => handleRunTests(selected.id)} disabled={updateCR.isPending}>
                            <TestTube className="h-3.5 w-3.5" /> Run Regression Tests
                          </Button>
                          <div className="flex gap-2">
                            <ReviewAction label="Approve" icon={ThumbsUp} variant="default" onAction={(notes) => handleApprove(selected.id, notes)} />
                            <ReviewAction label="Reject" icon={ThumbsDown} variant="destructive" onAction={(notes) => handleReject(selected.id, notes)} />
                          </div>
                        </div>
                      )}
                      {isChecker && selected.status === 'approved' && (
                        <Button className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground" onClick={() => handlePublish(selected.id)} disabled={insertVersion.isPending}>
                          {insertVersion.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
                          Publish to Production
                        </Button>
                      )}
                      {selected.status === 'published' && (
                        <div className="flex items-center gap-2 text-sm text-success"><CheckCircle2 className="h-4 w-4" /> Live in production</div>
                      )}
                    </section>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-card flex items-center justify-center min-h-[400px]">
              <div className="text-center text-muted-foreground">
                <Rocket className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Select a change request</p>
                <p className="text-sm">Choose a request from the left to review and promote</p>
              </div>
            </Card>
          )}
        </div>
      )}

    </div>
  );
}

// Review action with notes
function ReviewAction({ label, icon: Icon, variant, onAction }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');

  if (!open) {
    return (
      <Button variant={variant === 'destructive' ? 'outline' : 'default'} className={`gap-1.5 ${variant === 'destructive' ? 'text-destructive hover:text-destructive' : ''}`} onClick={() => setOpen(true)}>
        <Icon className="h-3.5 w-3.5" /> {label}
      </Button>
    );
  }

  return (
    <div className="space-y-2 w-full">
      <Textarea placeholder={`Add ${label.toLowerCase()} notes...`} value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="text-xs" />
      <div className="flex gap-2">
        <Button size="sm" variant={variant === 'destructive' ? 'destructive' : 'default'} onClick={() => { onAction(notes); setOpen(false); setNotes(''); }}>Confirm {label}</Button>
        <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setNotes(''); }}>Cancel</Button>
      </div>
    </div>
  );
}
