import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LayoutGrid, Trash2, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
  AVAILABLE_METRICS,
  METRIC_CATEGORIES,
  loadDashboard,
  saveDashboard,
} from './analyserMetrics';
import { MetricCard } from './MetricCard';

const MAX_METRICS = 18; // 6 rows × 3 per row

export function Analyser() {
  const [dashboard, setDashboard] = useState(loadDashboard);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(dashboard.name);

  const persist = useCallback((updated) => {
    setDashboard(updated);
    saveDashboard(updated);
  }, []);

  const handleAddMetric = () => {
    if (!selectedMetric) return;
    if (dashboard.metrics.length >= MAX_METRICS) {
      toast({ title: 'Dashboard full', description: `Maximum ${MAX_METRICS} metrics (6 rows × 3). Remove one first.`, variant: 'destructive' });
      return;
    }
    const updated = {
      ...dashboard,
      metrics: [...dashboard.metrics, { metricId: selectedMetric, serviceFilter: selectedFilter }],
    };
    persist(updated);
    setSelectedMetric('');
    setSelectedFilter('all');
    setAddDialogOpen(false);
    toast({ title: 'Metric added' });
  };

  const handleRemoveMetric = (index) => {
    const updated = {
      ...dashboard,
      metrics: dashboard.metrics.filter((_, i) => i !== index),
    };
    persist(updated);
  };

  const handleFilterChange = (index, filter) => {
    const updated = {
      ...dashboard,
      metrics: dashboard.metrics.map((m, i) => i === index ? { ...m, serviceFilter: filter } : m),
    };
    persist(updated);
  };

  const handleSaveName = () => {
    if (nameInput.trim()) {
      persist({ ...dashboard, name: nameInput.trim() });
      setEditingName(false);
    }
  };

  const handleClearDashboard = () => {
    if (!confirm('Remove all metrics from this dashboard?')) return;
    persist({ ...dashboard, metrics: [] });
    toast({ title: 'Dashboard cleared' });
  };

  const rowCount = Math.ceil(dashboard.metrics.length / 3);
  const usedMetricIds = new Set(dashboard.metrics.map(m => m.metricId));

  // Group available metrics by category for the add dialog
  const metricsByCategory = Object.entries(METRIC_CATEGORIES).map(([catKey, catLabel]) => ({
    key: catKey,
    label: catLabel,
    metrics: AVAILABLE_METRICS.filter(m => m.category === catKey),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutGrid className="h-5 w-5 text-accent" />
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                className="h-8 w-60 text-lg font-display font-bold"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSaveName}>
                <Check className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingName(false); setNameInput(dashboard.name); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold">{dashboard.name}</h2>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setEditingName(true)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          <Badge variant="secondary" className="text-xs">
            {dashboard.metrics.length}/{MAX_METRICS} metrics · {rowCount}/6 rows
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {dashboard.metrics.length > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive" onClick={handleClearDashboard}>
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </Button>
          )}

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5" disabled={dashboard.metrics.length >= MAX_METRICS}>
                <Plus className="h-3.5 w-3.5" /> Add Metric
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Metric to Dashboard</DialogTitle>
                <DialogDescription>Select a metric and optionally filter by service category.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <ScrollArea className="h-[300px] pr-3">
                  <div className="space-y-4">
                    {metricsByCategory.map(cat => (
                      <div key={cat.key}>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat.label}</h4>
                        <div className="space-y-1">
                          {cat.metrics.map(m => {
                            const alreadyAdded = usedMetricIds.has(m.id);
                            return (
                              <button
                                key={m.id}
                                onClick={() => !alreadyAdded && setSelectedMetric(m.id)}
                                disabled={alreadyAdded}
                                className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
                                  selectedMetric === m.id
                                    ? 'bg-accent/10 border border-accent/30'
                                    : alreadyAdded
                                    ? 'opacity-40 cursor-not-allowed'
                                    : 'hover:bg-muted'
                                }`}
                              >
                                <span className="font-medium">{m.label}</span>
                                {alreadyAdded && <Badge variant="secondary" className="ml-2 text-xs">Added</Badge>}
                                <span className="block text-xs text-muted-foreground">{m.description}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Separator />
                <div className="space-y-2">
                  <label className="text-sm font-medium">Service Filter</label>
                  <Select value={selectedFilter} onValueChange={v => setSelectedFilter(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      <SelectItem value="customer-account">Customer & Account</SelectItem>
                      <SelectItem value="cash-operations">Cash Operations</SelectItem>
                      <SelectItem value="payment-operations">Payment Operations</SelectItem>
                      <SelectItem value="card-services">Card Services</SelectItem>
                      <SelectItem value="fx-operations">FX Operations</SelectItem>
                      <SelectItem value="service-requests">Service Requests</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddMetric} disabled={!selectedMetric}>Add to Dashboard</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Grid – 3 per row */}
      {dashboard.metrics.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <LayoutGrid className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-display text-lg font-semibold mb-1">No metrics configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click "Add Metric" to build your personalised analytics dashboard.<br />
              You can add up to 18 metrics arranged in 6 rows of 3.
            </p>
            <Button size="sm" className="gap-1.5" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Your First Metric
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {dashboard.metrics.map((m, index) => (
              <motion.div
                key={`${m.metricId}-${index}`}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <MetricCard
                  metricId={m.metricId}
                  serviceFilter={m.serviceFilter}
                  onRemove={() => handleRemoveMetric(index)}
                  onFilterChange={filter => handleFilterChange(index, filter)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
