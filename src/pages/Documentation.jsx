import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, BookOpen, Download, Loader2, Shield } from 'lucide-react';
import aidaLogo from "../assets/aida-logo.png";
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { useNavigate } from 'react-router-dom';

const Documentation = () => {
  const navigate = useNavigate();
  const [generatingSystem, setGeneratingSystem] = useState(false);
  const [generatingUser, setGeneratingUser] = useState(false);

  const handleSystemDoc = async () => {
    setGeneratingSystem(true);
    try {
      const { generateSystemDoc } = await import('../docs/generateSystemDoc');
      await generateSystemDoc();
    } finally {
      setGeneratingSystem(false);
    }
  };

  const handleUserManual = async () => {
    setGeneratingUser(true);
    try {
      const { generateUserManual } = await import('../docs/generateUserManual');
      await generateUserManual();
    } finally {
      setGeneratingUser(false);
    }
  };

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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden bg-white/10">
            <img src={aidaLogo} alt="AIDA" className="h-9 w-9 object-cover" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-primary-foreground tracking-tight">
              AIDA<span className="text-xs align-super text-accent/80">™</span> Documentation
            </h1>
            <p className="text-sm text-primary-foreground/60">Download system documentation & user manual</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Shield className="h-4 w-4" />
            <span>All documents include copyright clause assigning ownership to <strong className="text-foreground">Snapp Systems Kenya Limited</strong></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 mb-2">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-lg">System Documentation</CardTitle>
                <CardDescription>
                  Comprehensive technical documentation covering architecture, database schema, workflow engine, service catalogue, charge framework, cross-sell engine, admin module, security, and deployment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                  <li>• Executive Summary</li>
                  <li>• System Architecture & Tech Stack</li>
                  <li>• Database Schema & Enums</li>
                  <li>• Service Catalogue (18 services)</li>
                  <li>• Workflow Engine (9 stages)</li>
                  <li>• Service Charge Framework</li>
                  <li>• Cross-Sell Engine</li>
                  <li>• Admin Module (Designer, API, Publisher)</li>
                  <li>• Security & Deployment</li>
                </ul>
                <Button onClick={handleSystemDoc} disabled={generatingSystem} className="w-full gap-2 gold-gradient text-accent-foreground font-semibold shadow-gold">
                  {generatingSystem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {generatingSystem ? 'Generating...' : 'Download .docx'}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 mb-2">
                  <BookOpen className="h-7 w-7 text-accent" />
                </div>
                <CardTitle className="text-lg">User Manual</CardTitle>
                <CardDescription>
                  Step-by-step guide for bank officers and administrators. Covers customer verification, transaction processing, service charges, chat assistant, and the full admin workflow.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                  <li>• Getting Started & Demo Customers</li>
                  <li>• Customer Verification Flow</li>
                  <li>• Processing Transactions (all stages)</li>
                  <li>• FX Rates & Banking Assistant</li>
                  <li>• Session Management</li>
                  <li>• Admin: Workflow Designer</li>
                  <li>• Admin: API Configurator</li>
                  <li>• Admin: Publisher (Maker-Checker)</li>
                  <li>• Charges Reference & Troubleshooting</li>
                </ul>
                <Button onClick={handleUserManual} disabled={generatingUser} className="w-full gap-2 gold-gradient text-accent-foreground font-semibold shadow-gold">
                  {generatingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {generatingUser ? 'Generating...' : 'Download .docx'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Documentation;
