import { useState, useMemo } from "react";
import {
  Zap, Clock, Shield, ArrowLeftRight, Smartphone, Check, AlertCircle,
  Info, Star, Search, Receipt, Save, CalendarClock, Mail, Wallet,
  ChevronDown, ChevronUp
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

import { getEligibleAccounts, ACCOUNT_TYPE_LABELS } from "@/data/demoCustomers";
import { recommendChannels } from "@/data/paymentChannels";

import {
  BILLER_CATEGORY_LABELS,
  RECURRENCE_LABELS,
  getAllBillers,
  fetchBillPresentment
} from "@/data/billers";

const ICON_MAP = {
  ArrowLeftRight: <ArrowLeftRight className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
  Clock: <Clock className="h-4 w-4" />,
  Shield: <Shield className="h-4 w-4" />,
  Smartphone: <Smartphone className="h-4 w-4" />
};

const OD_LIMITS = {
  current: 500000,
  savings: 100000
};

export function BillPaymentInput({ customer, onSubmit }) {

  if (!customer) return null;

  const eligibleAccounts = useMemo(() => {
    try {
      return getEligibleAccounts(customer, "bill-payment") || [];
    } catch {
      return [];
    }
  }, [customer]);

  const [mode, setMode] = useState("preset");
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [billerSearch, setBillerSearch] = useState("");
  const [selectedBiller, setSelectedBiller] = useState(null);

  const [manualBillerCode, setManualBillerCode] = useState("");
  const [manualBillerName, setManualBillerName] = useState("");

  const [referenceNumber, setReferenceNumber] = useState("");
  const [amount, setAmount] = useState("");

  const [selectedChannelId, setSelectedChannelId] = useState(null);

  const [presentment, setPresentment] = useState(null);
  const [presentmentLoading, setPresentmentLoading] = useState(false);

  const [emailConfirmation, setEmailConfirmation] = useState(true);
  const [emailAddress, setEmailAddress] = useState(customer?.email || "");

  const [saveBiller, setSaveBiller] = useState(false);
  const [enableRecurrence, setEnableRecurrence] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState("monthly");

  const [useOverdraft, setUseOverdraft] = useState(false);

  const [showOptions, setShowOptions] = useState(false);
  const [errors, setErrors] = useState({});

  const activeBiller = mode === "preset" ? selectedBiller : null;

  const billerName =
    mode === "preset"
      ? selectedBiller?.name || ""
      : manualBillerName;

  const billerCode =
    mode === "preset"
      ? selectedBiller?.billerCode || ""
      : manualBillerCode;

  const allBillers = useMemo(() => getAllBillers(), []);

  const filteredBillers = useMemo(() => {
    if (!billerSearch) return allBillers;

    const q = billerSearch.toLowerCase();

    return allBillers.filter(
      b =>
        b.name.toLowerCase().includes(q) ||
        b.billerCode.includes(q)
    );
  }, [billerSearch, allBillers]);

  const groupedBillers = useMemo(() => {

    const groups = {};

    filteredBillers.forEach(b => {
      if (!groups[b.category]) groups[b.category] = [];
      groups[b.category].push(b);
    });

    return groups;

  }, [filteredBillers]);

  const handleFetchBill = () => {

    if (!activeBiller || !referenceNumber) return;

    setPresentmentLoading(true);

    setTimeout(() => {

      const result = fetchBillPresentment(
        activeBiller.id,
        referenceNumber
      );

      setPresentment(result);
      setPresentmentLoading(false);

      if (result) {
        setAmount(String(result.outstandingAmount));
      }

    }, 800);

  };

  const numAmount = useMemo(() => {
    const n = Number(amount);
    return isNaN(n) ? 0 : n;
  }, [amount]);

  const recommendations = useMemo(() => {

    if (numAmount === 0) return [];

    try {
      return recommendChannels(numAmount, "other-bank") || [];
    } catch {
      return [];
    }

  }, [numAmount]);

  const recommendedId =
    recommendations.find(r => r.recommended)?.channel?.id;

  const effectiveChannelId =
    selectedChannelId ?? recommendedId ?? null;

  const selectedRec =
    recommendations.find(
      r => r.channel?.id === effectiveChannelId
    );

  const odLimit =
    selectedAccount
      ? OD_LIMITS[selectedAccount.type] || 0
      : 0;

  const availableBalance =
    selectedAccount?.balance || 0;

  const totalAvailable =
    availableBalance +
    (useOverdraft ? odLimit : 0);

  const validate = () => {

    const errs = {};

    if (!selectedAccount)
      errs.account = "Select source account";

    if (!billerName)
      errs.biller = "Biller required";

    if (!referenceNumber)
      errs.reference = "Reference required";

    if (numAmount <= 0)
      errs.amount = "Enter valid amount";

    if (!effectiveChannelId)
      errs.channel = "Select payment channel";

    if (numAmount > totalAvailable)
      errs.amount = "Insufficient balance";

    if (emailConfirmation && !emailAddress)
      errs.email = "Email required";

    setErrors(errs);

    return Object.keys(errs).length === 0;

  };

  const handleSubmit = () => {

    if (!validate() || !selectedRec) return;

    onSubmit({

      sourceAccount:
        selectedAccount.accountNumber,

      billerName,
      billerCode,
      referenceNumber,
      amount,

      channelId: selectedRec.channel.id,
      channelName: selectedRec.channel.name,

      emailConfirmation,
      emailAddress,

      saveBiller,
      enableRecurrence,
      recurrenceFrequency,

      overdraftUsed: useOverdraft

    });

  };

  return (

    <div className="space-y-5 max-w-lg mx-auto">

      {/* CUSTOMER */}

      <div className="flex items-center gap-3 border p-4 rounded-xl">

        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold">

          {(customer.fullName || "")
            .split(" ")
            .map(n => n[0])
            .join("")
            .slice(0,2)}

        </div>

        <div>

          <p className="text-sm font-semibold">
            {customer.fullName}
          </p>

          <p className="text-xs text-muted-foreground">
            {customer.customerId} • {customer.phone}
          </p>

        </div>

      </div>

      {/* ACCOUNT */}

      <Select
        value={selectedAccount?.accountNumber || ""}
        onValueChange={(val)=>{

          const acc =
            eligibleAccounts.find(
              a => a.accountNumber === val
            ) || null;

          setSelectedAccount(acc);

        }}
      >

        <SelectTrigger>
          <SelectValue placeholder="Select Account"/>
        </SelectTrigger>

        <SelectContent>

          {eligibleAccounts.map(acc => (

            <SelectItem
              key={acc.accountNumber}
              value={acc.accountNumber}
            >

              {acc.accountNumber} •
              {ACCOUNT_TYPE_LABELS?.[acc.type]} •
              {acc.currency}

            </SelectItem>

          ))}

        </SelectContent>

      </Select>

      {/* AMOUNT */}

      <Input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e)=>setAmount(e.target.value)}
      />

      {/* CHANNEL */}

      {recommendations.length > 0 && (

        <RadioGroup
          value={effectiveChannelId || ""}
          onValueChange={setSelectedChannelId}
        >

          {recommendations.map(rec => (

            <ChannelOption
              key={rec.channel.id}
              rec={rec}
              isSelected={
                effectiveChannelId === rec.channel.id
              }
            />

          ))}

        </RadioGroup>

      )}

      <Button
        onClick={handleSubmit}
        className="w-full"
      >

        Submit for Validation

      </Button>

    </div>

  );

}

function ChannelOption({ rec, isSelected }) {

  const { channel, estimatedCost } = rec;

  return (

    <label
      className={`flex gap-3 border rounded-xl p-4 ${
        isSelected
          ? "border-primary"
          : "border-border"
      }`}
    >

      <RadioGroupItem value={channel.id} />

      <div>

        <p className="font-semibold">
          {channel.name}
        </p>

        <p className="text-xs text-muted-foreground">
          Cost: {estimatedCost}
        </p>

      </div>

    </label>

  );

}