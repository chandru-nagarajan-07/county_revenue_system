import { useState, useMemo } from "react";
import { Zap, Clock, Shield, ArrowLeftRight, Smartphone, Check, AlertCircle, Info, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

import { getEligibleAccounts, ACCOUNT_TYPE_LABELS } from "@/data/demoCustomers";
import { recommendChannels } from "@/data/paymentChannels";

const ICON_MAP = {
  ArrowLeftRight: <ArrowLeftRight className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
  Clock: <Clock className="h-4 w-4" />,
  Shield: <Shield className="h-4 w-4" />,
  Smartphone: <Smartphone className="h-4 w-4" />
};

export function FundsTransferInput({ customer, onSubmit }) {

  if (!customer) return null;

  /* SAFE ACCOUNTS */

  const eligibleAccounts = useMemo(() => {
    try {
      return getEligibleAccounts(customer, "funds-transfer") || [];
    } catch {
      return [];
    }
  }, [customer]);

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [destination, setDestination] = useState("other-bank");
  const [beneficiaryAccount, setBeneficiaryAccount] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [errors, setErrors] = useState({});

  const numAmount = useMemo(() => {
    const n = Number(amount);
    return isNaN(n) || n <= 0 ? 0 : n;
  }, [amount]);

  const recommendations = useMemo(() => {
    if (numAmount === 0) return [];
    try {
      return recommendChannels(numAmount, destination) || [];
    } catch {
      return [];
    }
  }, [numAmount, destination]);

  const recommendedId = recommendations.find(r => r.recommended)?.channel?.id;
  const effectiveChannelId = selectedChannelId ?? recommendedId ?? null;

  const selectedRec = recommendations.find(r => r.channel?.id === effectiveChannelId);

  const validate = () => {

    const errs = {};

    if (!selectedAccount)
      errs.account = "Please select a source account";

    if (!beneficiaryAccount.trim())
      errs.beneficiaryAccount = "Beneficiary account is required";

    if (!beneficiaryName.trim())
      errs.beneficiaryName = "Beneficiary name is required";

    if (numAmount <= 0)
      errs.amount = "Enter a valid amount";

    if (!effectiveChannelId)
      errs.channel = "Please select a payment channel";

    if (selectedRec && !selectedRec.eligible)
      errs.channel =
        selectedRec.ineligibleReason ||
        "Channel not available for this amount";

    setErrors(errs);

    return Object.keys(errs).length === 0;

  };

  const handleSubmit = () => {

    if (!validate() || !selectedRec) return;

    onSubmit({
      sourceAccount: selectedAccount.accountNumber,
      beneficiaryAccount,
      beneficiaryName,
      amount,
      reference,
      destination,
      channelId: selectedRec.channel.id,
      channelName: selectedRec.channel.name,
      channelSla: selectedRec.channel.sla,
      networkCost: selectedRec.estimatedCost
    });

  };

  return (

    <div className="space-y-5 max-w-lg mx-auto">

      {/* CUSTOMER */}

      <div className="flex items-center gap-3 rounded-xl border p-4">

        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm">

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

      {/* SOURCE ACCOUNT */}

      <div className="space-y-2">

        <Label>Source Account *</Label>

        <Select
          value={selectedAccount?.accountNumber || ""}
          onValueChange={(val) => {

            const acc =
              eligibleAccounts.find(
                a => a.accountNumber === val
              ) || null;

            setSelectedAccount(acc);

          }}
        >

          <SelectTrigger>
            <SelectValue placeholder="Choose account"/>
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

        {errors.account && (
          <p className="text-xs text-destructive">
            {errors.account}
          </p>
        )}

      </div>

      {/* DESTINATION */}

      <div className="space-y-2">

        <Label>Destination *</Label>

        <Select
          value={destination}
          onValueChange={(val)=>{
            setDestination(val);
            setSelectedChannelId(null);
          }}
        >

          <SelectTrigger>
            <SelectValue/>
          </SelectTrigger>

          <SelectContent>

            <SelectItem value="same-bank">
              Same Bank
            </SelectItem>

            <SelectItem value="other-bank">
              Other Bank
            </SelectItem>

            <SelectItem value="mobile-wallet">
              Mobile Wallet
            </SelectItem>

          </SelectContent>

        </Select>

      </div>

      {/* BENEFICIARY */}

      <div className="space-y-2">

        <Label>Beneficiary *</Label>

        <Input
          value={beneficiaryAccount}
          onChange={(e)=>setBeneficiaryAccount(e.target.value)}
        />

      </div>

      <div className="space-y-2">

        <Label>Beneficiary Name *</Label>

        <Input
          value={beneficiaryName}
          onChange={(e)=>setBeneficiaryName(e.target.value)}
        />

      </div>

      {/* AMOUNT */}

      <div className="space-y-2">

        <Label>Amount *</Label>

        <Input
          type="number"
          value={amount}
          onChange={(e)=>setAmount(e.target.value)}
        />

      </div>

      {/* CHANNEL */}

      {recommendations.length > 0 && (

        <RadioGroup
          value={effectiveChannelId || ""}
          onValueChange={(val)=>setSelectedChannelId(val)}
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

/* CHANNEL CARD */

function ChannelOption({ rec, isSelected }) {

  const {
    channel,
    eligible,
    estimatedCost
  } = rec;

  return (

    <label
      className={`flex gap-3 border rounded-xl p-4 ${
        isSelected
        ? "border-primary"
        : "border-border"
      }`}
    >

      <RadioGroupItem
        value={channel.id}
        disabled={!eligible}
      />

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