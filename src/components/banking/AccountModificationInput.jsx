import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShieldAlert, Lock, Moon, Sun,
  AlertCircle, ChevronRight, Calendar, Globe
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { getEligibleAccounts, ACCOUNT_TYPE_LABELS } from '@/data/demoCustomers';

const MODIFICATION_ACTIONS = [
  {
    id: 'set-transaction-limit',
    label: 'Set Transaction Limit',
    description: 'Configure daily, per-transaction, or monthly limits',
    icon: <ShieldAlert className="h-5 w-5" />,
    color: 'text-[hsl(var(--info))]',
  },
  {
    id: 'block-unblock',
    label: 'Block / Unblock Account',
    description: 'Temporarily restrict or restore account access',
    icon: <Lock className="h-5 w-5" />,
    color: 'text-[hsl(var(--destructive))]',
  },
  {
    id: 'set-standing-order',
    label: 'Set Standing Order',
    description: 'Create or modify recurring payment instructions',
    icon: <Calendar className="h-5 w-5" />,
    color: 'text-[hsl(var(--accent))]',
  },
  {
    id: 'change-currency',
    label: 'Change Account Currency',
    description: 'Convert account to another currency',
    icon: <Globe className="h-5 w-5" />,
    color: 'text-[hsl(var(--warning))]',
  },
  {
    id: 'activate-dormant',
    label: 'Activate / Set Dormant',
    description: 'Change account active status',
    icon: <Moon className="h-5 w-5" />,
    color: 'text-[hsl(var(--primary))]',
  },
];

const CURRENCIES = ['KES','USD','EUR','GBP','JPY'];

export function AccountModificationInput({ customer, onSubmit }) {

  if (!customer) return null;

  const [phase,setPhase] = useState('select');
  const [selectedAction,setSelectedAction] = useState(null);
  const [selectedAccount,setSelectedAccount] = useState(null);
  const [details,setDetails] = useState({});
  const [errors,setErrors] = useState({});

  /* SAFE ACCOUNTS */
  const allAccounts = useMemo(() => {
    return (customer?.accounts || []).filter(a =>
      a?.type === 'savings' || a?.type === 'current' || a?.type === 'fx'
    );
  }, [customer]);

  const updateDetail = (key,value) => {
    setDetails(prev => ({ ...prev, [key]:value }));
    setErrors(prev => ({ ...prev, [key]:'' }));
  };

  const handleSelectAction = (actionId) => {
    setSelectedAction(actionId);
    setDetails({});
    setErrors({});
    setSelectedAccount(null);
    setPhase('details');
  };

  const validate = () => {
    const errs = {};

    if(!selectedAccount) errs.account = "Select account";

    if(selectedAction === 'set-transaction-limit'){
      if(!details.limitAmount) errs.limitAmount="Enter amount";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {

    if(!validate()) return;

    const action = MODIFICATION_ACTIONS.find(a => a.id === selectedAction);

    onSubmit({
      selectedAction,
      actionLabel: action?.label || '',
      details:{
        ...details,
        accountNumber:selectedAccount?.accountNumber,
        accountName:selectedAccount?.accountName
      }
    });

  };

  const actionObj = MODIFICATION_ACTIONS.find(a => a.id === selectedAction);

  return (

    <div className="space-y-5 max-w-lg mx-auto">

      {/* CUSTOMER CARD */}

      <div className="flex items-center gap-3 rounded-xl border p-4">

        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm">
          {(customer?.fullName || "")
            .split(" ")
            .map(n=>n[0])
            .join("")
            .slice(0,2)}
        </div>

        <div>
          <p className="text-sm font-semibold">
            {customer?.fullName}
          </p>
          <p className="text-xs text-muted-foreground">
            {customer?.customerId} • {customer?.phone}
          </p>
        </div>

      </div>

      <AnimatePresence mode="wait">

        {/* SELECT ACTION */}

        {phase === "select" && (

          <motion.div
            key="select"
            initial={{opacity:0,y:20}}
            animate={{opacity:1,y:0}}
            exit={{opacity:0,y:-20}}
            className="space-y-3"
          >

            {MODIFICATION_ACTIONS.map(action => (

              <button
                key={action.id}
                onClick={()=>handleSelectAction(action.id)}
                className="w-full flex items-center gap-4 border rounded-xl p-4 hover:bg-muted"
              >

                <div className={`h-10 w-10 flex items-center justify-center ${action.color}`}>
                  {action.icon}
                </div>

                <div className="flex-1 text-left">
                  <h4 className="text-sm font-semibold">
                    {action.label}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {action.description}
                  </p>
                </div>

                <ChevronRight className="h-4 w-4"/>

              </button>

            ))}

          </motion.div>

        )}

        {/* DETAILS SCREEN */}

        {phase === "details" && selectedAction && (

          <motion.div
            key="details"
            initial={{opacity:0,y:20}}
            animate={{opacity:1,y:0}}
            exit={{opacity:0,y:-20}}
            className="space-y-5"
          >

            <button
              onClick={()=>setPhase("select")}
              className="flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="h-4 w-4"/> Back
            </button>

            {/* ACCOUNT SELECT */}

            <div className="space-y-2">

              <Label>Select Account</Label>

              <Select
                value={selectedAccount?.accountNumber || ""}
                onValueChange={(val)=>{

                  const acc = allAccounts.find(a=>a.accountNumber===val);
                  setSelectedAccount(acc || null);

                }}
              >

                <SelectTrigger>
                  <SelectValue placeholder="Choose account"/>
                </SelectTrigger>

                <SelectContent>

                  {allAccounts.map(acc => (

                    <SelectItem
                      key={acc.accountNumber}
                      value={acc.accountNumber}
                    >

                      {acc.accountNumber} • {ACCOUNT_TYPE_LABELS?.[acc.type]}

                    </SelectItem>

                  ))}

                </SelectContent>

              </Select>

            </div>

            {/* AMOUNT INPUT */}

            {selectedAction === "set-transaction-limit" && (

              <div className="space-y-2">

                <Label>Limit Amount</Label>

                <Input
                  type="number"
                  value={details.limitAmount || ""}
                  onChange={(e)=>updateDetail("limitAmount",e.target.value)}
                />

              </div>

            )}

            <Button
              onClick={handleSubmit}
              className="w-full mt-4"
            >
              Submit for Validation
            </Button>

          </motion.div>

        )}

      </AnimatePresence>

    </div>
  );
}