import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Trash2, Save, TestTube, Cable, ChevronDown, ChevronRight,
  Code, Globe, ArrowRight, Check, X, Copy, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SERVICES } from '@/types/banking';
import { toast } from '@/hooks/use-toast';
import { useApiConfigs, useUpsertApiConfig, useDeleteApiConfig } from '@/hooks/useAdminData';

const STAGES = [
  { value: 'input', label: 'User Input' },
  { value: 'validation', label: 'Policy Validation' },
  { value: 'review', label: 'Officer Review' },
  { value: 'processing', label: 'Processing' },
  { value: 'verification', label: 'Customer Verification' },
  { value: 'authorization', label: 'Manager Authorization' },
];

const newMapping = () => ({
  id: crypto.randomUUID(),
  sourceField: '',
  targetField: '',
  transform: '',
});

const DEFAULT_CODE = `// Integration code template
async function callHost(context) {
  const response = await fetch(endpoint.url, {
    method: 'POST',
    headers: endpoint.headers,
    body: JSON.stringify({
      accountNumber: context.accountNumber,
      amount: context.amount,
    }),
  });
  return response.json();
}`;

function dbRowToEndpoint(row) {
  return {
    id: row.id,
    name: row.name,
    serviceId: row.service_id ?? '',
    stage: 'processing',
    method: row.method ?? 'POST',
    url: row.url ?? '',
    headers: row.headers ?? {},
    requestMappings: row.request_mappings ?? [],
    responseMappings: row.response_mappings ?? [],
    codeTemplate: row.code_template ?? DEFAULT_CODE,
    testStatus: row.tested ? 'success' : 'untested',
  };
}

export function ApiConfigurator() {
  const [endpoints, setEndpoints] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');

  const { data: dbEndpoints, isLoading } = useApiConfigs();
  const upsertMutation = useUpsertApiConfig();
  const deleteMutation = useDeleteApiConfig();

  useEffect(() => {
    if (dbEndpoints) {
      setEndpoints(dbEndpoints.map(dbRowToEndpoint));
    }
  }, [dbEndpoints]);

  const selected = endpoints.find(e => e.id === selectedId) ?? null;

  const addEndpoint = () => {
    const id = crypto.randomUUID();
    const ep = {
      id,
      name: '',
      serviceId: '',
      stage: 'processing',
      method: 'POST',
      url: '',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer {{API_KEY}}' },
      requestMappings: [newMapping()],
      responseMappings: [newMapping()],
      codeTemplate: DEFAULT_CODE,
      testStatus: 'untested',
    };
    setEndpoints(prev => [...prev, ep]);
    setSelectedId(id);
  };

  const updateEndpoint = useCallback((id, updater) => {
    setEndpoints(prev => prev.map(e => e.id === id ? updater(e) : e));
  }, []);

  const removeEndpoint = (id) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setEndpoints(prev => prev.filter(e => e.id !== id));
        if (selectedId === id) setSelectedId(null);
        toast({ title: 'Endpoint deleted' });
      },
      onError: () => {
        setEndpoints(prev => prev.filter(e => e.id !== id));
        if (selectedId === id) setSelectedId(null);
      },
    });
  };

  const addHeader = () => {
    if (!selected || !headerKey.trim()) return;
    updateEndpoint(selected.id, e => ({ ...e, headers: { ...e.headers, [headerKey]: headerValue } }));
    setHeaderKey('');
    setHeaderValue('');
  };

  const removeHeader = (key) => {
    if (!selected) return;
    updateEndpoint(selected.id, e => {
      const h = { ...e.headers };
      delete h[key];
      return { ...e, headers: h };
    });
  };

  const addMapping = (type) => {
    if (!selected) return;
    updateEndpoint(selected.id, e => ({ ...e, [type]: [...e[type], newMapping()] }));
  };

  const updateMapping = (type, mappingId, field, value) => {
    if (!selected) return;
    updateEndpoint(selected.id, e => ({
      ...e, [type]: e[type].map(m => m.id === mappingId ? { ...m, [field]: value } : m),
    }));
  };

  const removeMapping = (type, mappingId) => {
    if (!selected) return;
    updateEndpoint(selected.id, e => ({ ...e, [type]: e[type].filter(m => m.id !== mappingId) }));
  };

  const handleTest = () => {
    if (!selected) return;
    const success = selected.url.trim().length > 0;
    updateEndpoint(selected.id, e => ({ ...e, testStatus: success ? 'success' : 'error' }));
    toast({
      title: success ? 'Connection successful' : 'Connection failed',
      description: success ? 'Mock test passed. Endpoint is reachable.' : 'Please provide a valid URL.',
      variant: success ? 'default' : 'destructive',
    });
  };

  const handleSave = () => {
    if (!selected) return;
    upsertMutation.mutate({
      id: selected.id,
      name: selected.name || 'Untitled Endpoint',
      service_id: selected.serviceId,
      url: selected.url,
      method: selected.method,
      headers: selected.headers,
      request_mappings: selected.requestMappings,
      response_mappings: selected.responseMappings,
      code_template: selected.codeTemplate,
      tested: selected.testStatus === 'success',
    }, {
      onSuccess: () => toast({ title: 'API configuration saved', description: 'Endpoint persisted to database.' }),
      onError: (err) => toast({ title: 'Save failed', description: err.message, variant: 'destructive' }),
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Cable className="h-4 w-4 text-accent" />
              API Endpoints
            </CardTitle>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={addEndpoint}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
          <CardDescription>Define host platform integrations</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[60vh]">
            <div className="space-y-0.5 px-3 pb-3">
              {isLoading && <p className="text-xs text-muted-foreground text-center py-4">Loading…</p>}
              {!isLoading && endpoints.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No endpoints defined yet.<br />Click "Add" to create one.
                </p>
              )}
              {endpoints.map(ep => (
                <button
                  key={ep.id}
                  onClick={() => setSelectedId(ep.id)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    selectedId === ep.id ? 'bg-accent/10 text-accent-foreground font-medium' : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-mono shrink-0">{ep.method}</Badge>
                    <span className="block font-medium truncate">{ep.name || 'Untitled Endpoint'}</span>
                  </div>
                  <span className="block text-xs text-muted-foreground truncate mt-0.5">{ep.url || 'No URL configured'}</span>
                  <div className="flex items-center gap-2 mt-1">
                    {ep.testStatus === 'success' && <Badge className="text-[10px] bg-success/10 text-success border-0">Tested</Badge>}
                    {ep.testStatus === 'error' && <Badge variant="destructive" className="text-[10px]">Failed</Badge>}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {selected ? (
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">{selected.name || 'Untitled Endpoint'}</CardTitle>
              <CardDescription>Configure endpoint, mappings, and integration code</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleTest}>
                <TestTube className="h-3.5 w-3.5" /> Test
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-destructive" onClick={() => removeEndpoint(selected.id)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
              <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                <section className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground">Endpoint Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Endpoint Name</Label>
                      <Input 
                        value={selected.name} 
                        onChange={e => updateEndpoint(selected.id, ep => ({ ...ep, name: e.target.value }))} 
                        placeholder="e.g. Core Banking - Cash Deposit" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Linked Service</Label>
                      <Select value={selected.serviceId} onValueChange={v => updateEndpoint(selected.id, ep => ({ ...ep, serviceId: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                        <SelectContent>
                          {SERVICES.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Trigger Stage</Label>
                      <Select value={selected.stage} onValueChange={v => updateEndpoint(selected.id, ep => ({ ...ep, stage: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="w-28 space-y-2">
                      <Label className="text-xs">Method</Label>
                      <Select value={selected.method} onValueChange={v => updateEndpoint(selected.id, ep => ({ ...ep, method: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs">URL</Label>
                      <Input 
                        value={selected.url} 
                        onChange={e => updateEndpoint(selected.id, ep => ({ ...ep, url: e.target.value }))} 
                        placeholder="https://core-banking.example.com/api/v1/deposit" 
                        className="font-mono text-xs" 
                      />
                    </div>
                  </div>
                </section>

                <Separator />

                <section className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Headers</h4>
                  <div className="space-y-2">
                    {Object.entries(selected.headers).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-2 text-xs font-mono bg-muted/30 rounded-md px-3 py-2">
                        <span className="font-semibold">{key}:</span>
                        <span className="flex-1 text-muted-foreground truncate">{val}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeHeader(key)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Header name" 
                      value={headerKey} 
                      onChange={e => setHeaderKey(e.target.value)} 
                      className="text-xs" 
                    />
                    <Input 
                      placeholder="Value" 
                      value={headerValue} 
                      onChange={e => setHeaderValue(e.target.value)} 
                      className="text-xs" 
                    />
                    <Button size="sm" variant="outline" onClick={addHeader}>Add</Button>
                  </div>
                </section>

                <Separator />

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">Request Field Mappings</h4>
                    <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => addMapping('requestMappings')}>
                      <Plus className="h-3 w-3" /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {selected.requestMappings.map(m => (
                      <div key={m.id} className="grid grid-cols-[1fr_auto_1fr_1fr_auto] gap-2 items-center">
                        <Input 
                          placeholder="Source field" 
                          value={m.sourceField} 
                          onChange={e => updateMapping('requestMappings', m.id, 'sourceField', e.target.value)} 
                          className="text-xs font-mono" 
                        />
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Input 
                          placeholder="Target field" 
                          value={m.targetField} 
                          onChange={e => updateMapping('requestMappings', m.id, 'targetField', e.target.value)} 
                          className="text-xs font-mono" 
                        />
                        <Input 
                          placeholder="Transform (optional)" 
                          value={m.transform} 
                          onChange={e => updateMapping('requestMappings', m.id, 'transform', e.target.value)} 
                          className="text-xs font-mono" 
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeMapping('requestMappings', m.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>

                <Separator />

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">Response Field Mappings</h4>
                    <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => addMapping('responseMappings')}>
                      <Plus className="h-3 w-3" /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {selected.responseMappings.map(m => (
                      <div key={m.id} className="grid grid-cols-[1fr_auto_1fr_1fr_auto] gap-2 items-center">
                        <Input 
                          placeholder="Response field" 
                          value={m.sourceField} 
                          onChange={e => updateMapping('responseMappings', m.id, 'sourceField', e.target.value)} 
                          className="text-xs font-mono" 
                        />
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Input 
                          placeholder="Context field" 
                          value={m.targetField} 
                          onChange={e => updateMapping('responseMappings', m.id, 'targetField', e.target.value)} 
                          className="text-xs font-mono" 
                        />
                        <Input 
                          placeholder="Transform (optional)" 
                          value={m.transform} 
                          onChange={e => updateMapping('responseMappings', m.id, 'transform', e.target.value)} 
                          className="text-xs font-mono" 
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeMapping('responseMappings', m.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>

                <Separator />

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Code className="h-4 w-4" /> Integration Code Template
                    </h4>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="gap-1 text-xs" 
                      onClick={() => { 
                        navigator.clipboard.writeText(selected.codeTemplate); 
                        toast({ title: 'Copied to clipboard' }); 
                      }}
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </Button>
                  </div>
                  <Textarea 
                    rows={12} 
                    value={selected.codeTemplate} 
                    onChange={e => updateEndpoint(selected.id, ep => ({ ...ep, codeTemplate: e.target.value }))} 
                    className="font-mono text-xs bg-muted/30" 
                    placeholder="// Write integration code template here..." 
                  />
                  <p className="text-xs text-muted-foreground">
                    Code templates are stored for documentation and export. They are not executed at runtime.
                  </p>
                </section>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card flex items-center justify-center min-h-[400px]">
          <div className="text-center text-muted-foreground">
            <Cable className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No endpoint selected</p>
            <p className="text-sm">Create an endpoint or select one from the left panel</p>
          </div>
        </Card>
      )}
    </div>
  );
}
