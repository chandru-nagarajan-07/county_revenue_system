import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Workflow, Cable, Rocket, DollarSign, BarChart3 } from 'lucide-react';
import { Button } from '/src/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowDesigner } from '@/components/admin/WorkflowDesigner';
import { PricingConfigurator } from '@/components/admin/PricingConfigurator';
import { ApiConfigurator } from '@/components/admin/ApiConfigurator';
import { Publisher } from '@/components/admin/Publisher';
import { Analyser } from '@/components/admin/Analyser';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between px-8 py-5 navy-gradient">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold text-primary-foreground tracking-tight">
              Administration
            </h1>
            <p className="text-sm text-primary-foreground/60">Service Configuration & API Management</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8">
        <Tabs defaultValue="workflow" className="w-full">
          <TabsList className="mb-6 h-12">
            <TabsTrigger value="workflow" className="gap-2 px-6">
              <Workflow className="h-4 w-4" />
              Workflow Designer
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2 px-6">
              <DollarSign className="h-4 w-4" />
              Pricing Configurator
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2 px-6">
              <Cable className="h-4 w-4" />
              API Configurator
            </TabsTrigger>
            <TabsTrigger value="analyser" className="gap-2 px-6">
              <BarChart3 className="h-4 w-4" />
              Analyser
            </TabsTrigger>
            <TabsTrigger value="publisher" className="gap-2 px-6">
              <Rocket className="h-4 w-4" />
              Publisher
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workflow">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <WorkflowDesigner />
            </motion.div>
          </TabsContent>

          <TabsContent value="pricing">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <PricingConfigurator />
            </motion.div>
          </TabsContent>

          <TabsContent value="api">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <ApiConfigurator />
            </motion.div>
          </TabsContent>

          <TabsContent value="analyser">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Analyser />
            </motion.div>
          </TabsContent>

          <TabsContent value="publisher">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Publisher />
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
