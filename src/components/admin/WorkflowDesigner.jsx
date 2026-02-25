import { useState, useCallback, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import {
  Settings, Plus, Trash2, GripVertical, ChevronDown, ChevronRight,
  Save, Eye, Code, ShieldCheck, Loader2, ChevronsUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SERVICES, SERVICE_CATEGORIES } from '@/types/banking';
import { toast } from '@/hooks/use-toast';
import { useWorkflowConfigs, useUpsertWorkflowConfig, useDeleteWorkflowConfig } from '@/hooks/useAdminData';

const DEFAULT_STAGES = [
  { id: 'input', label: 'User Input', enabled: true, approvalRequired: false, validationRules: [], customScript: '' },
  { id: 'validation', label: 'Policy Validation', enabled: true, approvalRequired: false, validationRules: ['amount > 0', 'account is active'], customScript: '' },
  { id: 'review', label: 'Officer Review', enabled: true, approvalRequired: true, approvalThreshold: '50000', validationRules: [], customScript: '' },
  { id: 'processing', label: 'Processing', enabled: true, approvalRequired: false, validationRules: [], customScript: '' },
  { id: 'verification', label: 'Customer Verification', enabled: true, approvalRequired: false, validationRules: [], customScript: '' },
  { id: 'authorization', label: 'Manager Authorization', enabled: true, approvalRequired: true, approvalThreshold: '100000', validationRules: [], customScript: '' },
  { id: 'cross-sell', label: 'Cross-Sell', enabled: true, approvalRequired: false, validationRules: [], customScript: '' },
  { id: 'feedback', label: 'Feedback', enabled: true, approvalRequired: false, validationRules: [], customScript: '' },
];

export function WorkflowDesigner() {
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [localConfigs, setLocalConfigs] = useState({});
  const [expandedStage, setExpandedStage] = useState(null);
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [newServiceId, setNewServiceId] = useState('');
  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('customer-account');

  const { data: dbConfigs, isLoading } = useWorkflowConfigs();
  const upsertMutation = useUpsertWorkflowConfig();
  const deleteMutation = useDeleteWorkflowConfig();

  // Sync DB data into local state
  useEffect(() => {
    if (dbConfigs) {
      const map = {};
      for (const row of dbConfigs) {
        map[row.service_id] = {
          serviceId: row.service_id,
          serviceTitle: row.service_title,
          stages: row.stages,
          chargeOverride: row.charge_override,
        };
      }
      setLocalConfigs(prev => ({ ...map, ...Object.fromEntries(Object.entries(prev).filter(([k]) => !(k in map))) }));
    }
  }, [dbConfigs]);

  // Merge built-in SERVICES with any DB-only custom services
  const allServices = (() => {
    const builtIn = SERVICES.map(s => ({ id: s.id, title: s.title, description: s.description, category: s.category }));
    const dbServiceIds = new Set((dbConfigs ?? []).map(r => r.service_id));
    const builtInIds = new Set(builtIn.map(s => s.id));
    // Add DB-only services (custom ones added by admin)
    const custom = (dbConfigs ?? [])
      .filter(r => !builtInIds.has(r.service_id))
      .map(r => ({ id: r.service_id, title: r.service_title, description: 'Custom service', category: 'customer-account' }));
    return [...builtIn, ...custom];
  })();

  const savedServiceIds = new Set(dbConfigs?.map(r => r.service_id) ?? []);

  const activeConfig = selectedServiceId
    ? localConfigs[selectedServiceId] ?? {
        serviceId: selectedServiceId,
        serviceTitle: allServices.find(s => s.id === selectedServiceId)?.title ?? '',
        stages: DEFAULT_STAGES.map(s => ({ ...s, validationRules: [...s.validationRules] })),
      }
    : null;

  const updateConfig = useCallback((updater) => {
    if (!selectedServiceId) return;
    setLocalConfigs(prev => {
      const current = prev[selectedServiceId] ?? {
        serviceId: selectedServiceId,
        serviceTitle: allServices.find(s => s.id === selectedServiceId)?.title ?? '',
        stages: DEFAULT_STAGES.map(s => ({ ...s, validationRules: [...s.validationRules] })),
      };
      return { ...prev, [selectedServiceId]: updater(current) };
    });
  }, [selectedServiceId, allServices]);

  const toggleStage = (stageId) => {
    updateConfig(c => ({
      ...c,
      stages: c.stages.map(s => s.id === stageId ? { ...s, enabled: !s.enabled } : s),
    }));
  };

  const updateStageField = (stageId, field, value) => {
    updateConfig(c => ({
      ...c,
      stages: c.stages.map(s => s.id === stageId ? { ...s, [field]: value } : s),
    }));
  };

  const handleReorder = (newStages) => {
    updateConfig(c => ({ ...c, stages: newStages }));
  };

  const handleSave = () => {
    if (!activeConfig) return;
    upsertMutation.mutate({
      service_id: activeConfig.serviceId,
      service_title: activeConfig.serviceTitle,
      stages: activeConfig.stages,
      charge_override: activeConfig.chargeOverride || null,
    }, {
      onSuccess: () => toast({ title: 'Configuration saved', description: `Workflow for "${activeConfig.serviceTitle}" persisted to database.` }),
      onError: (err) => toast({ title: 'Save failed', description: err.message, variant: 'destructive' }),
    });
  };

  const handleAddService = () => {
    const id = newServiceId.trim().toLowerCase().replace(/\s+/g, '-');
    const title = newServiceTitle.trim();
    if (!id || !title) return;

    const config = {
      serviceId: id,
      serviceTitle: title,
      stages: DEFAULT_STAGES.map(s => ({ ...s, validationRules: [...s.validationRules] })),
    };

    upsertMutation.mutate({
      service_id: id,
      service_title: title,
      stages: config.stages,
    }, {
      onSuccess: () => {
        setNewServiceId('');
        setNewServiceTitle('');
        setNewServiceDesc('');
        setAddServiceOpen(false);
        setSelectedServiceId(id);
        toast({ title: 'Service added', description: `"${title}" is now on the service menu.` });
      },
      onError: (err) => toast({ title: 'Failed to add service', description: err.message, variant: 'destructive' }),
    });
  };

  const handleRemoveService = (serviceId) => {
    const title = allServices.find(s => s.id === serviceId)?.title ?? serviceId;
    if (!confirm(`Remove "${title}" from the service menu? This will delete its workflow configuration.`)) return;
    deleteMutation.mutate(serviceId, {
      onSuccess: () => {
        if (selectedServiceId === serviceId) setSelectedServiceId('');
        setLocalConfigs(prev => { const n = { ...prev }; delete n[serviceId]; return n; });
        toast({ title: 'Service removed', description: `"${title}" has been removed from the menu.` });
      },
      onError: (err) => toast({ title: 'Remove failed', description: err.message, variant: 'destructive' }),
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4 text-accent" />
              Service Menu
            </CardTitle>
            <Dialog open={addServiceOpen} onOpenChange={setAddServiceOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-7 w-7">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Service</DialogTitle>
                  <DialogDescription>Add a service to the menu. It will also appear in the Pricing Configurator.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Service ID</Label>
                    <Input placeholder="e.g. loan-disbursement" value={newServiceId} onChange={e => setNewServiceId(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Lowercase with hyphens, unique identifier.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Service Title</Label>
                    <Input placeholder="e.g. Loan Disbursement" value={newServiceTitle} onChange={e => setNewServiceTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={newServiceCategory} onValueChange={v => setNewServiceCategory(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(SERVICE_CATEGORIES).map(([key, cat]) => (
                          <SelectItem key={key} value={key}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddService} disabled={upsertMutation.isPending || !newServiceId.trim() || !newServiceTitle.trim()}>
                    {upsertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Add Service
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>Choose a service to configure its workflow. Use + to add new services.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[60vh]">
            <div className="px-3 pb-3 space-y-1">
              {isLoading && <p className="text-xs text-muted-foreground text-center py-4">Loading…</p>}
              {Object.entries(SERVICE_CATEGORIES).map(([catKey, cat]) => {
                const catServices = allServices.filter(s => s.category === catKey);
                if (catServices.length === 0) return null;
                const hasSelected = catServices.some(s => s.id === selectedServiceId);
                return (
                  <Collapsible key={catKey} defaultOpen={hasSelected || true}>
                    <CollapsibleTrigger className="flex items-center gap-2 w-full px-2 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50 group">
                      <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 group-data-[state=open]:rotate-0" />
                      <span className="flex-1 text-left">{cat.label}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                        {catServices.length}
                      </Badge>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-0.5 ml-2 pl-3 border-l border-border/50 mt-0.5 mb-1">
                        {catServices.map(service => (
                          <div key={service.id} className="group relative">
                            <button
                              onClick={() => setSelectedServiceId(service.id)}
                              className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors pr-10 ${
                                selectedServiceId === service.id
                                  ? 'bg-accent/10 text-accent-foreground font-medium'
                                  : 'hover:bg-muted text-foreground'
                              }`}
                            >
                              <span className="block font-medium">{service.title}</span>
                              <span className="block text-xs text-muted-foreground">{service.description}</span>
                              {(savedServiceIds.has(service.id) || localConfigs[service.id]) && (
                                <Badge variant="secondary" className="mt-1 text-xs">
                                  {savedServiceIds.has(service.id) ? 'Saved' : 'Modified'}
                                </Badge>
                              )}
                            </button>
                            {savedServiceIds.has(service.id) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                                onClick={e => { e.stopPropagation(); handleRemoveService(service.id); }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {activeConfig ? (
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">{activeConfig.serviceTitle}</CardTitle>
              <CardDescription>Drag to reorder stages. Toggle, configure rules, and add scripts.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Preview
              </Button>
              <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6 p-3 rounded-lg bg-muted/50">
              <Label className="text-sm font-medium whitespace-nowrap">Charge Override (KES)</Label>
              <Input
                placeholder="Leave blank for default"
                className="max-w-[200px]"
                value={activeConfig.chargeOverride ?? ''}
                onChange={e => updateConfig(c => ({ ...c, chargeOverride: e.target.value }))}
              />
            </div>

            <Reorder.Group axis="y" values={activeConfig.stages} onReorder={handleReorder} className="space-y-2">
              {activeConfig.stages.map((stage) => (
                <Reorder.Item key={stage.id} value={stage}>
                  <div className={`border rounded-lg transition-colors ${stage.enabled ? 'bg-card border-border' : 'bg-muted/30 border-border/50 opacity-60'}`}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
                      <Switch checked={stage.enabled} onCheckedChange={() => toggleStage(stage.id)} />
                      <span className="font-medium text-sm flex-1">{stage.label}</span>
                      {stage.approvalRequired && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <ShieldCheck className="h-3 w-3" /> Approval
                        </Badge>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}>
                        {expandedStage === stage.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </div>

                    {expandedStage === stage.id && stage.enabled && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-4 pb-4 space-y-4 border-t">
                        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Requires Approval</Label>
                            <Switch checked={stage.approvalRequired} onCheckedChange={v => updateStageField(stage.id, 'approvalRequired', v)} />
                          </div>
                          {stage.approvalRequired && (
                            <div className="space-y-2">
                              <Label className="text-xs">Approval Threshold (KES)</Label>
                              <Input value={stage.approvalThreshold ?? ''} onChange={e => updateStageField(stage.id, 'approvalThreshold', e.target.value)} placeholder="e.g. 50000" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Validation Rules (one per line)</Label>
                          <Textarea rows={3} value={stage.validationRules.join('\n')} onChange={e => updateStageField(stage.id, 'validationRules', e.target.value.split('\n'))} placeholder="e.g. amount > 0&#10;account.status === 'active'" className="font-mono text-xs" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1.5"><Code className="h-3.5 w-3.5" /> Custom Script</Label>
                          <Textarea rows={6} value={stage.customScript} onChange={e => updateStageField(stage.id, 'customScript', e.target.value)} placeholder={`// Custom processing logic for ${stage.label}\nfunction process(context) {\n  // context.amount, context.customer, context.account\n  return { approved: true };\n}`} className="font-mono text-xs bg-muted/30" />
                          <p className="text-xs text-muted-foreground">Scripts are stored for review/export. Not executed at runtime in demo mode.</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card flex items-center justify-center min-h-[400px]">
          <div className="text-center text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Select a service</p>
            <p className="text-sm">Choose a service from the left panel to configure its workflow</p>
          </div>
        </Card>
      )}
    </div>
  );
}
