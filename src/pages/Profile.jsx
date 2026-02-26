// src/pages/ProfilePage.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { User, Settings, ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { DashboardHeader } from '@/components/banking/DashboardHeader';

const Profile = ({ customer, onLogout, onBack }) => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DashboardHeader />

      <main className="flex-1 flex flex-col p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 max-w-4xl mx-auto w-full space-y-8"
        >
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="w-fit h-12 px-4 gap-2 text-base"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </Button>

          {/* Profile Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mx-auto mb-6">
              <User className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-4xl font-bold text-foreground">
              Profile
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your account information
            </p>
          </div>

          {/* Customer Profile Card */}
          {customer && (
            <CustomerProfile customer={customer} />
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <Button variant="outline" className="h-14 text-base">
              <Settings className="h-5 w-5 mr-2" />
              Account Settings
            </Button>
            <Button 
              variant="destructive" 
              className="h-14 text-base"
              onClick={onLogout}
            >
              <LogOut className="h-5 w-5 mr-2" />
              Log Out
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Profile ;
