import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ─── Workflow Configs ────────────────────────────────────────

export function useWorkflowConfigs() {
  return useQuery({
    queryKey: ['workflow-configs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('workflow_configs').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertWorkflowConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config) => {
      const { data, error } = await supabase
        .from('workflow_configs')
        .upsert(config, { onConflict: 'service_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflow-configs'] }),
  });
}

export function useDeleteWorkflowConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (serviceId) => {
      const { error } = await supabase.from('workflow_configs').delete().eq('service_id', serviceId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflow-configs'] }),
  });
}

// ─── API Configs ─────────────────────────────────────────────

export function useApiConfigs() {
  return useQuery({
    queryKey: ['api-configs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('api_configs').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertApiConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config) => {
      const { data, error } = await supabase
        .from('api_configs')
        .upsert(config)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-configs'] }),
  });
}

export function useDeleteApiConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('api_configs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-configs'] }),
  });
}

// ─── Change Requests ─────────────────────────────────────────

export function useChangeRequests() {
  return useQuery({
    queryKey: ['change-requests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('change_requests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useInsertChangeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cr) => {
      const { data, error } = await supabase.from('change_requests').insert(cr).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['change-requests'] }),
  });
}

export function useUpdateChangeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase.from('change_requests').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['change-requests'] }),
  });
}

// ─── Published Versions ──────────────────────────────────────

export function usePublishedVersions() {
  return useQuery({
    queryKey: ['published-versions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('published_versions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useInsertPublishedVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (version) => {
      const { data, error } = await supabase.from('published_versions').insert(version).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['published-versions'] }),
  });
}

export function useUpdatePublishedVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase.from('published_versions').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['published-versions'] }),
  });
}

// ─── Customer Segments ───────────────────────────────────────

export function useCustomerSegments() {
  return useQuery({
    queryKey: ['customer-segments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customer_segments').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useInsertCustomerSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (segment) => {
      const { data, error } = await supabase.from('customer_segments').insert(segment).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer-segments'] }),
  });
}

export function useDeleteCustomerSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (segmentKey) => {
      const { error } = await supabase.from('customer_segments').delete().eq('segment_key', segmentKey);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer-segments'] });
      qc.invalidateQueries({ queryKey: ['pricing-configs'] });
    },
  });
}

// ─── Pricing Configs ─────────────────────────────────────────

export function usePricingConfigs() {
  return useQuery({
    queryKey: ['pricing-configs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pricing_configs').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertPricingConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config) => {
      const { data, error } = await supabase
        .from('pricing_configs')
        .upsert(config, { onConflict: 'service_id,segment_key' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing-configs'] }),
  });
}

export function useBulkUpsertPricingConfigs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (configs) => {
      const { data, error } = await supabase
        .from('pricing_configs')
        .upsert(configs, { onConflict: 'service_id,segment_key' })
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing-configs'] }),
  });
}
