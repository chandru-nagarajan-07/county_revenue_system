import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, X, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/types/banking';
import {
  AVAILABLE_METRICS,
  generateMockTimeSeries,
  generatePieData,
} from './analyserMetrics';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const PIE_COLORS = [
  'hsl(215, 50%, 16%)',
  'hsl(42, 85%, 55%)',
  'hsl(152, 60%, 42%)',
  'hsl(210, 80%, 52%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 72%, 51%)',
];

export function MetricCard({ metricId, serviceFilter, onRemove, onFilterChange }) {
  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);

  const metric = AVAILABLE_METRICS.find(m => m.id === metricId);
  if (!metric) return null;

  const isPie = metric.chartType === 'pie';
  const timeData = !isPie
    ? generateMockTimeSeries(metricId, serviceFilter === 'all' ? 'customer-account' : serviceFilter)
    : [];
  const pieData = isPie ? generatePieData(metricId) : [];

  const currentValue = timeData.length > 0 ? timeData[timeData.length - 1].value : 0;
  const prevValue = timeData.length > 1 ? timeData[timeData.length - 2].value : currentValue;
  const trend = currentValue - prevValue;
  const trendPct = prevValue !== 0 ? ((trend / prevValue) * 100).toFixed(1) : '0';

  const chartConfig = {
    value: { label: metric.label, color: 'hsl(var(--accent))' },
  };

  const handleGetInsight = async () => {
    setInsightLoading(true);
    try {
      const summary = timeData.length > 0
        ? `Recent 30-day data for "${metric.label}" (${metric.unit}): Latest=${currentValue}, Trend=${trendPct}%, Min=${Math.min(...timeData.map(d => d.value))}, Max=${Math.max(...timeData.map(d => d.value))}, Avg=${(timeData.reduce((s, d) => s + d.value, 0) / timeData.length).toFixed(1)}`
        : `Pie data for "${metric.label}": ${pieData.map(d => `${d.name}=${d.value}`).join(', ')}`;

      const resp = await supabase.functions.invoke('analyser-insights', {
        body: { metricLabel: metric.label, metricDescription: metric.description, dataSummary: summary, serviceFilter },
      });

      if (resp.error) throw resp.error;
      setInsight(resp.data?.insight || 'No insight available.');
    } catch (err) {
      toast({ title: 'AI Insight failed', description: err.message, variant: 'destructive' });
    } finally {
      setInsightLoading(false);
    }
  };

  const renderChart = () => {
    if (isPie) {
      return (
        <ChartContainer config={chartConfig} className="h-[180px] w-full aspect-auto">
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {pieData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
      );
    }

    const shortData = timeData.map(d => ({ ...d, date: d.date.slice(5) }));

    if (metric.chartType === 'bar') {
      return (
        <ChartContainer config={chartConfig} className="h-[180px] w-full aspect-auto">
          <BarChart data={shortData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="hsl(var(--accent))" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ChartContainer>
      );
    }

    if (metric.chartType === 'area') {
      return (
        <ChartContainer config={chartConfig} className="h-[180px] w-full aspect-auto">
          <AreaChart data={shortData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey="value" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.2)" />
          </AreaChart>
        </ChartContainer>
      );
    }

    return (
      <ChartContainer config={chartConfig} className="h-[180px] w-full aspect-auto">
        <LineChart data={shortData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
          <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="value" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
        </LineChart>
      </ChartContainer>
    );
  };

  return (
    <Card className="shadow-card group relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive z-10"
        onClick={onRemove}
      >
        <X className="h-3.5 w-3.5" />
      </Button>

      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-2 pr-6">
          <div>
            <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
            <p className="text-xs text-muted-foreground">{metric.description}</p>
          </div>
        </div>

        {!isPie && (
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xl font-bold font-display">
              {metric.unit === 'KES' ? `KES ${currentValue.toLocaleString()}` : `${currentValue}${metric.unit === '%' ? '%' : ''}`}
            </span>
            <Badge variant={trend >= 0 ? 'default' : 'destructive'} className="text-xs gap-0.5">
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trendPct}%
            </Badge>
          </div>
        )}

        <div className="flex items-center gap-2 mt-1">
          <Select value={serviceFilter} onValueChange={v => onFilterChange(v)}>
            <SelectTrigger className="h-7 text-xs w-auto min-w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {Object.entries(SERVICE_CATEGORIES).map(([key, cat]) => (
                <SelectItem key={key} value={key}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleGetInsight} disabled={insightLoading}>
            {insightLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Insight
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-2 pb-3">
        {renderChart()}
        {insight && (
          <div className="mt-2 mx-2 p-2.5 rounded-md bg-accent/5 border border-accent/20 text-xs text-foreground leading-relaxed">
            <div className="flex items-center gap-1 text-accent font-medium mb-1">
              <Sparkles className="h-3 w-3" /> AI Insight
            </div>
            {insight}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
