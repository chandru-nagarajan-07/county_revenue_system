import { useState, useMemo } from "react";
import {
  CreditCard,
  ShieldCheck,
  Settings,
  AlertCircle,
  Check
} from "lucide-react";

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
import { Switch } from "@/components/ui/switch";

import { getEligibleAccounts, ACCOUNT_TYPE_LABELS } from "@/data/demoCustomers";

/* ------------------- MOCK CARDS ------------------- */

function getCustomerCards(customer) {
  const accounts = customer?.accounts || [];

  const active = accounts.filter(
    (a) => a?.status === "ACTIVE" && ["savings", "current"].includes(a?.type)
  );

  if (active.length === 0) return [];

  return [
    {
      last4: "4521",
      type: "Visa Debit",
      account: active[0]?.accountNumber,
      posLimit: 200000,
      atmLimit: 100000
    }
  ];
}

/* ------------------- COMPONENT ------------------- */

export function CardServicesInput({ serviceId, customer, onSubmit }) {

  if (!customer) return null;

  const eligibleAccounts = useMemo(() => {
    try {
      return getEligibleAccounts(customer, serviceId) || [];
    } catch {
      return [];
    }
  }, [customer, serviceId]);

  const existingCards = useMemo(() => getCustomerCards(customer), [customer]);

  const [linkedAccount, setLinkedAccount] = useState("");

  /* -------- Card Issuance -------- */

  const [cardType, setCardType] = useState("");
  const [nameOnCard, setNameOnCard] = useState(customer?.fullName?.toUpperCase() || "");
  const [enableContactless, setEnableContactless] = useState(true);
  const [dailyPosLimit, setDailyPosLimit] = useState("200000");
  const [dailyAtmLimit, setDailyAtmLimit] = useState("100000");

  /* -------- Replacement -------- */

  const [selectedCard, setSelectedCard] = useState("");
  const [replacementReason, setReplacementReason] = useState("");

  /* -------- PIN -------- */

  const [pinCard, setPinCard] = useState("");
  const [pinAction, setPinAction] = useState("");

  /* -------- Limit -------- */

  const [limitCard, setLimitCard] = useState("");
  const [newPosLimit, setNewPosLimit] = useState("");
  const [newAtmLimit, setNewAtmLimit] = useState("");

  const handleSubmit = () => {

    if (serviceId === "card-issuance") {

      onSubmit({
        serviceType: serviceId,
        linkedAccount,
        cardType,
        nameOnCard,
        enableContactless,
        dailyPosLimit,
        dailyAtmLimit
      });

    }

    if (serviceId === "card-replacement") {

      onSubmit({
        serviceType: serviceId,
        cardLast4: selectedCard,
        replacementReason
      });

    }

    if (serviceId === "pin-management") {

      onSubmit({
        serviceType: serviceId,
        cardLast4: pinCard,
        pinAction
      });

    }

    if (serviceId === "card-limit") {

      onSubmit({
        serviceType: serviceId,
        cardLast4: limitCard,
        newPosLimit,
        newAtmLimit
      });

    }

  };

  return (

    <div className="space-y-5 max-w-lg mx-auto">

      {/* CUSTOMER */}

      <div className="flex items-center gap-3 border rounded-xl p-4 bg-muted/30">

        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold">

          {(customer?.fullName || "")
            .split(" ")
            .map(n => n[0])
            .join("")
            .slice(0,2)}

        </div>

        <div>

          <p className="font-semibold">{customer?.fullName}</p>

          <p className="text-xs text-muted-foreground">
            {customer?.customerId} • {customer?.phone}
          </p>

        </div>

      </div>

{/* ================= CARD ISSUANCE ================= */}

{serviceId === "card-issuance" && (

<div className="space-y-4">

<Label>Link Account</Label>

<Select value={linkedAccount} onValueChange={setLinkedAccount}>
<SelectTrigger>
<SelectValue placeholder="Select account"/>
</SelectTrigger>

<SelectContent>

{eligibleAccounts.map(acc => (

<SelectItem
key={acc.accountNumber}
value={acc.accountNumber}
>

{acc.accountNumber} • {ACCOUNT_TYPE_LABELS?.[acc.type]}

</SelectItem>

))}

</SelectContent>
</Select>

<Label>Card Type</Label>

<div className="grid grid-cols-2 gap-2">

{["Visa Debit","Mastercard Debit"].map(type => (

<button
key={type}
onClick={()=>setCardType(type)}
className={`border rounded-lg p-3 ${
cardType === type
? "border-primary bg-primary/10"
: "border-border"
}`}
>

{type}

</button>

))}

</div>

<Label>Name on Card</Label>

<Input
value={nameOnCard}
onChange={(e)=>setNameOnCard(e.target.value.toUpperCase())}
/>

<div className="flex justify-between">

<span>Contactless</span>

<Switch
checked={enableContactless}
onCheckedChange={setEnableContactless}
/>

</div>

<div className="grid grid-cols-2 gap-2">

<Input
type="number"
value={dailyPosLimit}
onChange={(e)=>setDailyPosLimit(e.target.value)}
placeholder="POS Limit"
/>

<Input
type="number"
value={dailyAtmLimit}
onChange={(e)=>setDailyAtmLimit(e.target.value)}
placeholder="ATM Limit"
/>

</div>

</div>

)}

{/* ================= CARD REPLACEMENT ================= */}

{serviceId === "card-replacement" && (

<div className="space-y-4">

<Label>Select Card</Label>

{existingCards.map(card => (

<button
key={card.last4}
onClick={()=>setSelectedCard(card.last4)}
className={`border rounded-lg p-4 w-full flex justify-between ${
selectedCard === card.last4
? "border-primary bg-primary/10"
: "border-border"
}`}
>

<span>•••• {card.last4}</span>

{selectedCard === card.last4 && <Check size={18}/>}

</button>

))}

<Label>Replacement Reason</Label>

<Select value={replacementReason} onValueChange={setReplacementReason}>

<SelectTrigger>

<SelectValue placeholder="Select reason"/>

</SelectTrigger>

<SelectContent>

<SelectItem value="lost">Lost</SelectItem>
<SelectItem value="stolen">Stolen</SelectItem>
<SelectItem value="damaged">Damaged</SelectItem>

</SelectContent>

</Select>

</div>

)}

{/* ================= PIN MANAGEMENT ================= */}

{serviceId === "pin-management" && (

<div className="space-y-4">

<Label>Select Card</Label>

{existingCards.map(card => (

<button
key={card.last4}
onClick={()=>setPinCard(card.last4)}
className={`border rounded-lg p-4 w-full flex justify-between ${
pinCard === card.last4
? "border-primary bg-primary/10"
: "border-border"
}`}
>

<span>•••• {card.last4}</span>

{pinCard === card.last4 && <Check size={18}/>}

</button>

))}

<Label>PIN Action</Label>

<Select value={pinAction} onValueChange={setPinAction}>

<SelectTrigger>
<SelectValue placeholder="Select action"/>
</SelectTrigger>

<SelectContent>

<SelectItem value="set-new">Set New PIN</SelectItem>
<SelectItem value="reset">Reset PIN</SelectItem>
<SelectItem value="unblock">Unblock PIN</SelectItem>

</SelectContent>

</Select>

</div>

)}

{/* ================= CARD LIMIT ================= */}

{serviceId === "card-limit" && (

<div className="space-y-4">

<Label>Select Card</Label>

{existingCards.map(card => (

<button
key={card.last4}
onClick={()=>setLimitCard(card.last4)}
className={`border rounded-lg p-4 w-full flex justify-between ${
limitCard === card.last4
? "border-primary bg-primary/10"
: "border-border"
}`}
>

<span>•••• {card.last4}</span>

{limitCard === card.last4 && <Check size={18}/>}

</button>

))}

<div className="grid grid-cols-2 gap-2">

<Input
type="number"
value={newPosLimit}
onChange={(e)=>setNewPosLimit(e.target.value)}
placeholder="New POS Limit"
/>

<Input
type="number"
value={newAtmLimit}
onChange={(e)=>setNewAtmLimit(e.target.value)}
placeholder="New ATM Limit"
/>

</div>

</div>

)}

<Button onClick={handleSubmit} className="w-full">

Submit for Validation

</Button>

</div>

);

}