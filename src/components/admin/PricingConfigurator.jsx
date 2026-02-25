import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Plus, Trash2, Save, Loader2, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import {
  useWorkflowConfigs,
  useCustomerSegments,
  useInsertCustomerSegment,
  useDeleteCustomerSegment,
  usePricingConfigs,
  useBulkUpsertPricingConfigs,
} from '@/hooks/useAdminData';

export function PricingConfigurator() {
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [localPricing, setLocalPricing] = useState({});
  const [newSegmentKey, setNewSegmentKey] = useState('');
  const [newSegmentLabel, setNewSegmentLabel] = useState('');
  const [addSegmentOpen, setAddSegmentOpen] = useState(false);

  const { data: workflowConfigs, isLoading: loadingServices } = useWorkflowConfigs();
  const { data: segments, isLoading: loadingSegments } = useCustomerSegments();
  const { data: pricingConfigs, isLoading: loadingPricing } = usePricingConfigs();

  const insertSegment = useInsertCustomerSegment();
  const deleteSegment = useDeleteCustomerSegment();
  const bulkUpsert = useBulkUpsertPricingConfigs();

  // Services come from workflow_configs (services added via Workflow Designer)
  const services = useMemo(() => {
    return (workflowConfigs ?? []).map(wc => ({
      id: wc.service_id,
      title: wc.service_title,
    }));
  }, [workflowConfigs]);

  // Build pricing map for selected service
  const currentPricing = useMemo(() => {
    if (!selectedServiceId || !pricingConfigs || !segments) return {};
    const map = {};
    for (const seg of segments) {
      const existing = pricingConfigs.find(
        p => p.service_id === selectedServiceId && p.segment_key === seg.segment_key
      );
      map[seg.segment_key] = existing
        ? { 
            segment_key: seg.segment_key, 
            service_fee: Number(existing.service_fee), 
            percentage_fee: Number(existing.percentage_fee), 
            min_charge: Number(existing.min_charge), 
            max_charge: Number(existing.max_charge) 
          }
        : { segment_key: seg.segment_key, service_fee: 0, percentage_fee: 0, min_charge: 0, max_charge: 0 };
    }
    return map;
  }, [selectedServiceId, pricingConfigs, segments]);

  // Merge local edits over DB state
  const displayPricing = useMemo(() => {
    const merged = { ...currentPricing };
    for (const [key, val] of Object.entries(localPricing)) {
      if (key.startsWith(selectedServiceId + '::')) {
        const segKey = key.split('::')[1];
        merged[segKey] = val;
      }
    }
    return merged;
  }, [currentPricing, localPricing, selectedServiceId]);

  const updateCell = (segmentKey, field, value) => {
    const compositeKey = `${selectedServiceId}::${segmentKey}`;
    const current = localPricing[compositeKey] ?? displayPricing[segmentKey] ?? { segment_key: segmentKey, service_fee: 0, percentage_fee: 0, min_charge: 0, max_charge: 0 };
    setLocalPricing(prev => ({
      ...prev,
      [compositeKey]: { ...current, [field]: parseFloat(value) || 0 },
    }));
  };

  const handleSave = () => {
    if (!selectedServiceId || !segments) return;
    const configs = segments.map(seg => {
      const compositeKey = `${selectedServiceId}::${seg.segment_key}`;
      const row = localPricing[compositeKey] ?? displayPricing[seg.segment_key] ?? { service_fee: 0, percentage_fee: 0, min_charge: 0, max_charge: 0 };
      return {
        service_id: selectedServiceId,
        segment_key: seg.segment_key,
        service_fee: row.service_fee,
        percentage_fee: row.percentage_fee,
        min_charge: row.min_charge,
        max_charge: row.max_charge,
      };
    });

    bulkUpsert.mutate(configs, {
      onSuccess: () => {
        // Clear local edits for this service
        setLocalPricing(prev => {
          const cleaned = { ...prev };
          for (const k of Object.keys(cleaned)) {
            if (k.startsWith(selectedServiceId + '::')) delete cleaned[k];
          }
          return cleaned;
        });
        toast({ title: 'Pricing saved', description: `Pricing matrix for "${services.find(s => s.id === selectedServiceId)?.title}" saved.` });
      },
      onError: (err) => toast({ title: 'Save failed', description: err.message, variant: 'destructive' }),
    });
  };

  const handleAddSegment = () => {
    if (!newSegmentKey.trim() || !newSegmentLabel.trim()) return;
    const key = newSegmentKey.trim().toLowerCase().replace(/\s+/g, '-');
    insertSegment.mutate(
      { segment_key: key, label: newSegmentLabel.trim(), sort_order: (segments?.length ?? 0) + 1 },
      {
        onSuccess: () => {
          setNewSegmentKey('');
          setNewSegmentLabel('');
          setAddSegmentOpen(false);
          toast({ title: 'Segment added', description: `"${newSegmentLabel.trim()}" is now available across all services.` });
        },
        onError: (err) => toast({ title: 'Failed to add segment', description: err.message, variant: 'destructive' }),
      }
    );
  };

  const handleDeleteSegment = (segKey, label) => {
    if (!confirm(`Delete segment "${label}"? This will remove all associated pricing data.`)) return;
    deleteSegment.mutate(segKey, {
      onSuccess: () => toast({ title: 'Segment removed', description: `"${label}" and its pricing data have been deleted.` }),
      onError: (err) => toast({ title: 'Delete failed', description: err.message, variant: 'destructive' }),
    });
  };

  const selectedService = services.find(s => s.id === selectedServiceId);
  const isLoading = loadingServices || loadingSegments || loadingPricing;

  // Check if there are local edits for the selected service
  const hasLocalEdits = Object.keys(localPricing).some(k => k.startsWith(selectedServiceId + '::'));

  const configuredServiceIds = useMemo(() => {
    if (!pricingConfigs) return new Set();
    return new Set(pricingConfigs.map(p => p.service_id));
  }, [pricingConfigs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      {/* Service Selector */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-accent" />
            Services
          </CardTitle>
          <CardDescription>Select a service to configure its pricing matrix</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[55vh]">
            <div className="space-y-0.5 px-3 pb-3">
              {isLoading && <p className="text-xs text-muted-foreground text-center py-4">Loading…</p>}
              {!isLoading && services.length === 0 && (
                <div className="text-center py-8 px-4">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No services configured yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Add services via the Workflow Designer first.</p>
                </div>
              )}
              {services.map(service => (
                <button
                  key={service.id}
                  onClick={() => setSelectedServiceId(service.id)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    selectedServiceId === service.id
                      ? 'bg-accent/10 text-accent-foreground font-medium'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <span className="flex items-center justify-between">
                    <span className="font-medium">{service.title}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                  <span className="block text-xs text-muted-foreground mt-0.5">{service.id}</span>
                  {configuredServiceIds.has(service.id) && (
                    <Badge variant="secondary" className="mt-1 text-xs">Priced</Badge>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* Segment Management */}
          <Separator />
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Segments
              </h4>
              <Dialog open={addSegmentOpen} onOpenChange={setAddSegmentOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Customer Segment</DialogTitle>
                    <DialogDescription>Create a new segment for the pricing matrix.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>Segment Key</Label>
                      <Input placeholder="e.g. corporate" value={newSegmentKey} onChange={e => setNewSegmentKey(e.target.value)} />
                      <p className="text-xs text-muted-foreground">Lowercase identifier, no spaces (use hyphens).</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Display Label</Label>
                      <Input placeholder="e.g. Corporate Banking" value={newSegmentLabel} onChange={e => setNewSegmentLabel(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddSegment} disabled={insertSegment.isPending || !newSegmentKey.trim() || !newSegmentLabel.trim()}>
                      {insertSegment.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                      Add Segment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-1">
              {(segments ?? []).map(seg => (
                <div key={seg.segment_key} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-muted/50 group">
                  <span>{seg.label}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => handleDeleteSegment(seg.segment_key, seg.label)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Matrix */}
      {selectedService ? (
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">{selectedService.title}</CardTitle>
              <CardDescription>
                Define service fee, percentage fee, and charge caps per segment. Amounts in KES.
              </CardDescription>
            </div>
            <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={bulkUpsert.isPending}>
              {bulkUpsert.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Segment</TableHead>
                    <TableHead className="text-right">Service Fee</TableHead>
                    <TableHead className="text-right">% Fee</TableHead>
                    <TableHead className="text-right">Min Charge</TableHead>
                    <TableHead className="text-right">Max Charge</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(segments ?? []).map(seg => {
                    const row = displayPricing[seg.segment_key] ?? { service_fee: 0, percentage_fee: 0, min_charge: 0, max_charge: 0 };
                    return (
                      <TableRow key={seg.segment_key}>
                        <TableCell className="font-medium">
                          <span>{seg.label}</span>
                          <span className="block text-xs text-muted-foreground">{seg.segment_key}</span>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="text-right h-8 w-28 ml-auto"
                            value={row.service_fee}
                            onChange={e => updateCell(seg.segment_key, 'service_fee', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.001"
                            className="text-right h-8 w-28 ml-auto"
                            value={row.percentage_fee}
                            onChange={e => updateCell(seg.segment_key, 'percentage_fee', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="text-right h-8 w-28 ml-auto"
                            value={row.min_charge}
                            onChange={e => updateCell(seg.segment_key, 'min_charge', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="text-right h-8 w-28 ml-auto"
                            value={row.max_charge}
                            onChange={e => updateCell(seg.segment_key, 'max_charge', e.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {hasLocalEdits && (
              <p className="text-xs text-warning mt-3">You have unsaved changes. Click Save to persist.</p>
            )}
            <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-1">
              <p><strong>Service Fee:</strong> Flat fee in KES charged for the service.</p>
              <p><strong>% Fee:</strong> Percentage of the transaction amount (e.g. 0.005 = 0.5%).</p>
              <p><strong>Min/Max Charge:</strong> Floor and cap when percentage fee applies.</p>
              <p>Excise Duty (20%) and VAT (16%) are computed automatically at transaction time.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card flex items-center justify-center min-h-[400px]">
          <div className="text-center text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Select a service</p>
            <p className="text-sm">Choose a service from the left to configure its pricing</p>
          </div>
        </Card>
      )}
    </div>
  );
}
