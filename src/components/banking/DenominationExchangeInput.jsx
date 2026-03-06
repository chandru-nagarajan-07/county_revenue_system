import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

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

import { ACCOUNT_TYPE_LABELS } from "@/data/demoCustomers";
import { inferSegment, SEGMENT_LABELS } from "@/data/serviceCharges";

/* FX PAIRS */

const FX_PAIRS = [
  { code: "USD", label: "US Dollar", midRate: 129.45 },
  { code: "EUR", label: "Euro", midRate: 141.8 },
  { code: "GBP", label: "British Pound", midRate: 164.2 }
];

export function DenominationExchangeInput({ customer, onSubmit }) {

  /* SAFE CUSTOMER */
  if (!customer) return null;

  const accounts = customer?.accounts || [];

  const [direction, setDirection] = useState("BUY");
  const [selectedPair, setSelectedPair] = useState(null);
  const [fcyAmount, setFcyAmount] = useState("");
  const [sourceAccNum, setSourceAccNum] = useState("");
  const [settlementAccNum, setSettlementAccNum] = useState("");
  const [errors, setErrors] = useState({});

  /* SAFE SEGMENT */
  const segment = useMemo(() => {

    if (!customer) return "retail";

    return inferSegment({
      ...customer,
      accounts: customer.accounts || []
    });

  }, [customer]);

  /* ACCOUNT FILTERS */

  const kesAccounts = useMemo(() =>
    accounts.filter(
      acc =>
        acc?.status === "active" &&
        acc?.currency === "KES" &&
        (acc?.type === "current" || acc?.type === "savings")
    ),
    [accounts]
  );

  const fxAccounts = useMemo(() =>
    accounts.filter(
      acc =>
        acc?.status === "active" &&
        acc?.type === "fx"
    ),
    [accounts]
  );

  const sourceOptions =
    direction === "BUY" ? kesAccounts : fxAccounts;

  const settlementOptions =
    direction === "BUY" ? fxAccounts : kesAccounts;

  const fcyNum = Number(fcyAmount) || 0;

  const kesTotal = selectedPair
    ? fcyNum * selectedPair.midRate
    : 0;

  /* VALIDATION */

  const validate = () => {

    const errs = {};

    if (!selectedPair) errs.currency = "Select currency";
    if (!fcyAmount || fcyNum <= 0) errs.amount = "Enter valid amount";
    if (!sourceAccNum) errs.source = "Select source account";

    setErrors(errs);

    return Object.keys(errs).length === 0;
  };

  /* SUBMIT */

  const handleSubmit = () => {

    if (!validate()) return;

    onSubmit({
      direction,
      currency: selectedPair?.code,
      amount: fcyAmount,
      kesAmount: kesTotal,
      sourceAccount: sourceAccNum,
      settlementAccount: settlementAccNum
    });

  };

  return (

    <div className="space-y-5 max-w-lg mx-auto">

      {/* CUSTOMER BANNER */}

      <div className="flex items-center gap-3 rounded-xl border p-4">

        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">

          {(customer?.fullName || "")
            .split(" ")
            .map(n => n[0])
            .join("")
            .slice(0, 2)}

        </div>

        <div>

          <p className="text-sm font-semibold">
            {customer?.fullName}
          </p>

          <p className="text-xs text-muted-foreground">
            {customer?.customerId} • {customer?.phone}
          </p>

        </div>

        <span className="px-2 py-1 text-xs rounded bg-accent/10 text-accent">
          {SEGMENT_LABELS?.[segment]}
        </span>

      </div>

      {/* BUY / SELL */}

      <div className="grid grid-cols-2 gap-3">

        {["BUY", "SELL"].map(dir => (

          <button
            key={dir}
            onClick={() => {
              setDirection(dir);
              setSourceAccNum("");
              setSettlementAccNum("");
            }}
            className={`p-4 rounded-xl border ${
              direction === dir
                ? "border-primary bg-primary/10"
                : "border-border"
            }`}
          >

            {dir === "BUY"
              ? <TrendingUp className="h-4 w-4" />
              : <TrendingDown className="h-4 w-4" />}

            <p className="text-sm font-semibold mt-1">

              {dir === "BUY"
                ? "Buy Foreign Currency"
                : "Sell Foreign Currency"}

            </p>

          </button>

        ))}

      </div>

      {/* CURRENCY */}

      <div className="space-y-2">

        <Label>Currency *</Label>

        <Select
          value={selectedPair?.code || ""}
          onValueChange={(val) =>
            setSelectedPair(
              FX_PAIRS.find(p => p.code === val) || null
            )
          }
        >

          <SelectTrigger>
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>

          <SelectContent>

            {FX_PAIRS.map(pair => (

              <SelectItem
                key={pair.code}
                value={pair.code}
              >

                {pair.code} — {pair.label}

              </SelectItem>

            ))}

          </SelectContent>

        </Select>

        {errors.currency && (
          <p className="text-xs text-destructive">
            {errors.currency}
          </p>
        )}

      </div>

      {/* AMOUNT */}

      <div className="space-y-2">

        <Label>Foreign Amount *</Label>

        <Input
          type="number"
          value={fcyAmount}
          onChange={(e) => setFcyAmount(e.target.value)}
        />

        {errors.amount && (
          <p className="text-xs text-destructive">
            {errors.amount}
          </p>
        )}

      </div>

      {/* SOURCE ACCOUNT */}

      <div className="space-y-2">

        <Label>Source Account *</Label>

        <Select
          value={sourceAccNum}
          onValueChange={setSourceAccNum}
        >

          <SelectTrigger>
            <SelectValue placeholder="Select account" />
          </SelectTrigger>

          <SelectContent>

            {sourceOptions.map(acc => (

              <SelectItem
                key={acc.accountNumber}
                value={acc.accountNumber}
              >

                {acc.accountNumber} •
                {ACCOUNT_TYPE_LABELS?.[acc.type]} •
                {acc.currency} {acc.balance}

              </SelectItem>

            ))}

          </SelectContent>

        </Select>

        {errors.source && (
          <p className="text-xs text-destructive">
            {errors.source}
          </p>
        )}

      </div>

      {/* SUMMARY */}

      {selectedPair && fcyNum > 0 && (

        <div className="rounded-xl border p-4">

          <div className="flex justify-between text-sm">

            <span>Rate</span>
            <span>{selectedPair.midRate}</span>

          </div>

          <div className="flex justify-between font-semibold">

            <span>Total KES</span>
            <span>{kesTotal.toLocaleString()}</span>

          </div>

        </div>

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