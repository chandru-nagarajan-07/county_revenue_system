import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, CreditCard, ShieldCheck, ChevronRight, Sparkles, PiggyBank, Landmark, ArrowRight, Globe, Send, Wallet, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Category-specific offer pools per segment
const CATEGORY_OFFERS = {
  'cash-operations': {
    'high-value': [
      { icon: TrendingUp, title: 'Premium Cash Flow Manager', headline: 'Make your money work harder, overnight.', description: 'Automate sweeps between your current & fixed deposit accounts to maximise overnight returns. Premium clients enjoy preferential rates.', cta: 'Learn More', gradient: 'from-[hsl(215,50%,16%)] to-[hsl(215,45%,28%)]', iconBg: 'bg-[hsl(var(--accent))]', badge: 'Premium' },
      { icon: ShieldCheck, title: 'Keyman Insurance', headline: 'Protect what matters most to your business.', description: 'Comprehensive keyman cover with preferential rates for premium clients. Seamless claims process and dedicated relationship manager.', cta: 'Get Quote', gradient: 'from-[hsl(210,80%,42%)] to-[hsl(210,70%,55%)]', iconBg: 'bg-[hsl(var(--info))]' },
      { icon: Landmark, title: 'Wealth Advisory', headline: 'Your personal wealth strategy, tailored.', description: 'Access our team of certified wealth advisors for portfolio diversification, estate planning, and offshore investment opportunities.', cta: 'Book Session', gradient: 'from-[hsl(42,85%,45%)] to-[hsl(38,90%,55%)]', iconBg: 'bg-[hsl(var(--accent))]', badge: 'Exclusive' },
      { icon: PiggyBank, title: 'Fixed Deposit Special', headline: 'Lock in 12.5% p.a. for 6 months.', description: 'Limited-time offer for premium clients. Minimum KES 1M deposit. Interest paid monthly to your current account.', cta: 'Invest Now', gradient: 'from-[hsl(152,60%,32%)] to-[hsl(152,50%,45%)]', iconBg: 'bg-[hsl(var(--success))]', badge: 'Limited' },
    ],
    sme: [
      { icon: CreditCard, title: 'Digital Trade Credit', headline: 'Fuel your business growth instantly.', description: 'Access up to KES 5M revolving credit facility with instant disbursement. No collateral required for existing customers.', cta: 'Apply Now', gradient: 'from-[hsl(152,60%,32%)] to-[hsl(152,50%,45%)]', iconBg: 'bg-[hsl(var(--success))]', badge: 'Fast Track' },
      { icon: ShieldCheck, title: 'Business Insurance Bundle', headline: 'All-in-one cover for complete peace of mind.', description: 'Stock, premises & employee liability — bundled pricing saves SMEs up to 30%. One policy, one premium, zero hassle.', cta: 'View Plans', gradient: 'from-[hsl(38,92%,40%)] to-[hsl(38,85%,55%)]', iconBg: 'bg-[hsl(var(--warning))]' },
      { icon: TrendingUp, title: 'Business Cash Manager', headline: 'Optimise your working capital.', description: 'Smart sweep accounts that automatically move idle funds to high-yield overnight deposits. Earn up to 8% p.a. on surplus cash.', cta: 'Get Started', gradient: 'from-[hsl(215,50%,16%)] to-[hsl(215,45%,28%)]', iconBg: 'bg-[hsl(var(--accent))]' },
      { icon: Landmark, title: 'POS Terminal', headline: 'Accept card payments from day one.', description: 'Free POS terminal installation. Competitive merchant discount rates from 1.5%. Same-day settlement to your business account.', cta: 'Order Now', gradient: 'from-[hsl(210,80%,42%)] to-[hsl(210,70%,55%)]', iconBg: 'bg-[hsl(var(--info))]', badge: 'Free Setup' },
    ],
    retail: [
      { icon: CreditCard, title: 'Instant Personal Loan', headline: 'Pre-approved credit, funds in minutes.', description: 'Up to KES 500K digital credit. No paperwork, no branch visit. Competitive rates from 13% p.a. with flexible repayment.', cta: 'Check Eligibility', gradient: 'from-[hsl(152,60%,32%)] to-[hsl(152,50%,45%)]', iconBg: 'bg-[hsl(var(--success))]', badge: 'Pre-Approved' },
      { icon: ShieldCheck, title: 'Family Health Cover', headline: 'Healthcare for the whole family.', description: 'Affordable medical insurance for you and up to 5 dependants — from KES 1,200/month. Includes dental and optical cover.', cta: 'Get Quote', gradient: 'from-[hsl(210,80%,42%)] to-[hsl(210,70%,55%)]', iconBg: 'bg-[hsl(var(--info))]' },
      { icon: PiggyBank, title: 'Goal Savings Account', headline: 'Save smarter, reach goals faster.', description: 'Set a target, automate monthly contributions, and earn 7% p.a. bonus interest when you hit your goal. Start with just KES 500.', cta: 'Start Saving', gradient: 'from-[hsl(42,85%,45%)] to-[hsl(38,90%,55%)]', iconBg: 'bg-[hsl(var(--accent))]' },
      { icon: Landmark, title: 'Home Loan', headline: 'Your dream home, affordable rates.', description: 'Mortgage financing up to 90% of property value. Fixed rates from 12.5% p.a. for the first 3 years. Free property valuation.', cta: 'Pre-Qualify', gradient: 'from-[hsl(215,50%,16%)] to-[hsl(215,45%,28%)]', iconBg: 'bg-[hsl(var(--accent))]', badge: 'Popular' },
    ],
    'young-professional': [
      { icon: TrendingUp, title: 'Smart Savings Goal', headline: 'Build wealth on autopilot.', description: 'Set targets, automate contributions, and earn bonus interest when you hit your goal. Start building your future today.', cta: 'Start Saving', gradient: 'from-[hsl(42,85%,45%)] to-[hsl(38,90%,55%)]', iconBg: 'bg-[hsl(var(--accent))]', badge: 'Trending' },
      { icon: CreditCard, title: 'Salary Advance', headline: 'Access your salary before payday.', description: 'Up to 50% of your net salary — zero paperwork. Automatically repaid on your next payday. No interest for the first month.', cta: 'Apply Now', gradient: 'from-[hsl(152,60%,32%)] to-[hsl(152,50%,45%)]', iconBg: 'bg-[hsl(var(--success))]' },
      { icon: Sparkles, title: 'Digital Rewards Card', headline: 'Earn points on every purchase.', description: 'Cashback on dining, fuel & groceries. Redeem points for airtime, flights, or statement credit. Zero annual fee for the first year.', cta: 'Get Card', gradient: 'from-[hsl(210,80%,42%)] to-[hsl(210,70%,55%)]', iconBg: 'bg-[hsl(var(--info))]', badge: 'New' },
      { icon: ShieldCheck, title: 'Affordable Life Cover', headline: 'Peace of mind from KES 500/month.', description: 'Simple, transparent life insurance designed for young professionals. No medical exam for cover up to KES 2M.', cta: 'Get Quote', gradient: 'from-[hsl(215,50%,16%)] to-[hsl(215,45%,28%)]', iconBg: 'bg-[hsl(var(--accent))]' },
    ],
  },
  'customer-account': {
    'high-value': [
      { icon: Landmark, title: 'Priority Banking', headline: 'Upgrade to Priority Banking today.', description: 'Dedicated relationship manager, airport lounge access, preferential rates and zero-fee transactions across all channels.', cta: 'Upgrade Now', gradient: 'from-[hsl(215,50%,16%)] to-[hsl(215,45%,28%)]', iconBg: 'bg-[hsl(var(--accent))]', badge: 'Exclusive' },
      { icon: Globe, title: 'Multi-Currency Account', headline: 'Hold 12 currencies in one account.', description: 'Seamlessly hold, convert and transact in USD, GBP, EUR and 9 more currencies with competitive FX rates.', cta: 'Open Account', gradient: 'from-[hsl(42,85%,45%)] to-[hsl(38,90%,55%)]', iconBg: 'bg-[hsl(var(--accent))]' },
      { icon: ShieldCheck, title: 'Estate Planning', headline: 'Secure your legacy for generations.', description: 'Comprehensive will and trust services integrated with your banking relationship. Free initial consultation.', cta: 'Book Session', gradient: 'from-[hsl(210,80%,42%)] to-[hsl(210,70%,55%)]', iconBg: 'bg-[hsl(var(--info))]', badge: 'New' },
      { icon: CreditCard, title: 'Platinum Card', headline: 'The card that opens every door.', description: 'Unlimited lounge access, concierge service, 3% cashback on international spend. No foreign transaction fees.', cta: 'Apply Now', gradient: 'from-[hsl(152,60%,32%)] to-[hsl(152,50%,45%)]', iconBg: 'bg-[hsl(var(--success))]' },
    ],
    sme: [
      { icon: Building2, title: 'Business Account Plus', headline: 'Banking built for growing businesses.', description: 'Free payroll processing, integrated invoicing, and unlimited local transfers. Dedicated business support desk.', cta: 'Upgrade', gradient: 'from-[hsl(152,60%,32%)] to-[hsl(152,50%,45%)]', iconBg: 'bg-[hsl(var(--success))]', badge: 'Popular' },
      { icon: Wallet, title: 'Merchant Wallet', headline: 'Collect payments from anywhere.', description: 'Accept M-Pesa, card, and bank transfers into one unified wallet. Real-time settlement and smart reconciliation.', cta: 'Get Started', gradient: 'from-[hsl(38,92%,40%)] to-[hsl(38,85%,55%)]', iconBg: 'bg-[hsl(var(--warning))]' },
      { icon: ShieldCheck, title: 'Directors\' Cover', headline: 'Protect your leadership team.', description: 'Directors & officers liability insurance tailored for SMEs. Affordable premiums with comprehensive legal defence cover.', cta: 'Get Quote', gradient: 'from-[hsl(215,50%,16%)] to-[hsl(215,45%,28%)]', iconBg: 'bg-[hsl(var(--accent))]' },
      { icon: TrendingUp, title: 'Business Overdraft', headline: 'Flexible credit when you need it.', description: 'Pre-approved overdraft facility up to KES 2M. Pay interest only on what you use. Instant activation.', cta: 'Apply Now', gradient: 'from-[hsl(210,80%,42%)] to-[hsl(210,70%,55%)]', iconBg: 'bg-[hsl(var(--info))]', badge: 'Pre-Approved' },
    ],
    retail: [
      { icon: Sparkles, title: 'Digital Savings Account', headline: 'Earn 9% with zero minimum balance.', description: 'Open in 2 minutes, earn daily interest, withdraw anytime. No monthly charges, no hidden fees.', cta: 'Open Now', gradient: 'from-[hsl(42,85%,45%)] to-[hsl(38,90%,55%)]', iconBg: 'bg-[hsl(var(--accent))]', badge: 'Best Rate' },
      { icon: CreditCard, title: 'Free Debit Card', headline: 'Your gateway to cashless convenience.', description: 'Contactless Visa debit card with zero issuance fee. Use at 30M+ merchants worldwide. Instant virtual card available.', cta: 'Get Card', gradient: 'from-[hsl(210,80%,42%)] to-[hsl(210,70%,55%)]', iconBg: 'bg-[hsl(var(--info))]' },
      { icon: ShieldCheck, title: 'Personal Accident Cover', headline: 'Protection that costs less than coffee.', description: 'Cover up to KES 1M for accidental death & disability. From just KES 200/month. No medical required.', cta: 'Enrol Now', gradient: 'from-[hsl(152,60%,32%)] to-[hsl(152,50%,45%)]', iconBg: 'bg-[hsl(var(--success))]' },
      { icon: PiggyBank, title: 'Fixed Deposit', headline: 'Lock in 10% p.a. guaranteed returns.', description: 'Start from KES 10,000. Choose 3, 6 or 12 month terms. Interest paid at maturity or monthly.', cta: 'Invest Now', gradient: 'from-[hsl(215,50%,16%)] to-[hsl(215,45%,28%)]', iconBg: 'bg-[hsl(var(--accent))]', badge: 'Guaranteed' },
    ],
    'young-professional': [
      { icon: Sparkles, title: 'Starter Account', headline: 'Your first real bank account, reimagined.', description: 'Zero balance, zero charges, fully digital. Instant virtual card, budgeting tools, and spending insights built in.', cta: 'Open Free', gradient: 'from-[hsl(210,80%,42%)] to-[hsl(210,70%,55%)]', iconBg: 'bg-[hsl(var(--info))]', badge: 'Free' },
      { icon: TrendingUp, title: 'Round-Up Savings', headline: 'Save without even thinking about it.', description: 'Every purchase gets rounded up to the nearest KES 100. The spare change goes to your savings. Watch it grow!', cta: 'Activate', gradient: 'from-[hsl(42,85%,45%)] to-[hsl(38,90%,55%)]', iconBg: 'bg-[hsl(var(--accent))]', badge: 'Smart' },
      { icon: CreditCard, title: 'Student Credit Card', headline: 'Build your credit score early.', description: 'Low-limit credit card designed for young professionals. No annual fee, cashback on streaming and dining.', cta: 'Apply Now', gradient: 'from-[hsl(152,60%,32%)] to-[hsl(152,50%,45%)]', iconBg: 'bg-[hsl(var(--success))]' },
      { icon: ShieldCheck, title: 'Gadget Insurance', headline: 'Protect your phone and laptop.', description: 'Cover your devices against theft, damage and liquid spills. From KES 350/month. Claim via WhatsApp.', cta: 'Get Cover', gradient: 'from-[hsl(215,50%,16%)] to-[hsl(215,45%,28%)]', iconBg: 'bg-[hsl(var(--accent))]' },
    ],
  },
  'payment-operations': {
    'high-value': [
      { icon: Send, title: 'Bulk Payment Processing', headline: 'Pay thousands of beneficiaries in one click.', description: 'Upload payroll, supplier or dividend payment files. Real-time processing with detailed reconciliation reports.', cta: 'Get Started', gradient: 'from-[hsl(215,50%,16%)] to-[hsl(215,45%,28%)]', iconBg: 'bg-[hsl(var(--accent))]', badge: 'Enterprise' },
      { icon: Globe, title: 'International Payments', headline: 'Send money globally at bank rates.', description: 'Competitive FX rates for international transfers. Same-day SWIFT processing to 180+ countries. Full compliance handled.', cta: 'Send Now', gradient: 'from-[hsl(42,85%,45%)] to-[hsl(38,90%,55%)]', iconBg: 'bg-[hsl(var(--accent))]' },
      { icon: ShieldCheck, title: 'Payment Fraud Shield', headline: 'AI-powered fraud detection for your payments.', description: 'Real-time transaction monitoring, dual authorisation, and instant alerts. Protect your business from payment fraud.', cta: 'Activate', gradient: 'from-[hsl(210,80%,42%)] to-[hsl(210,70%,55%)]', iconBg: 'bg-[hsl(var(--info))]', badge: 'AI Powered' },
      { icon: Landmark, title: 'Escrow Services', headline: 'Secure large transactions with confidence.', description: 'Independent escrow for property deals, M&A, and large contracts. Funds released only when conditions are met.', cta: 'Learn More', gradient: 'from-[hsl(152,60%,32%)] to-[hsl(152,50%,45%)]', iconBg: 'bg-[hsl(var(--success))]' },
    ],
    sme: [
      { icon: Send, title: 'Payroll Solution', headline: 'Pay your team in 3 clicks.', description: 'Automated salary processing, statutory deductions, and payslip generation. Supports up to 500 employees.', cta: 'Try Free', gradient: 'from-[hsl(152,60%,32%)] to-[hsl(152,50%,45%)]', iconBg: 'bg-[hsl(var(--success))]', badge: '30-Day Trial' },
      { icon: Wallet, title: 'Supplier Finance', headline: 'Pay suppliers now, settle later.', description: 'Extend your payment terms by up to 90 days while suppliers get paid immediately. Improve relationships and cash flow.', cta: 'Apply Now', gradient: 'from-[hsl(38,92%,40%)] to-[hsl(38,85%,55%)]', iconBg: 'bg-[hsl(var(--warning))]' },
      { icon: CreditCard, title: 'Virtual Cards', headline: 'Instant virtual cards for online payments.', description: 'Create unlimited virtual Visa cards for subscriptions, advertising, and online purchases. Set individual limits per card.', cta: 'Create Card', gradient: 'from-[hsl(210,80%,42%)] to-[hsl(210,70%,55%)]', iconBg: 'bg-[hsl(var(--info))]', badge: 'Instant' },
      { icon: ShieldCheck, title: 'Payment Insurance', headline: 'Never lose a payment to fraud.', description: 'Comprehensive cover for unauthorised and erroneous payments. Automatic refund processing within 48 hours.', cta: 'Get Cover', gradient: 'from-[hsl(215,50%,16%)] to-[hsl(215,45%,28%)]', iconBg: 'bg-[hsl(var(--accent))]' },
    ],
    retail: [
      { icon: Sparkles, title: 'Bill Split', headline: 'Split bills instantly with friends.', description: 'Share restaurant bills, rent, or group expenses. Send requests via SMS or WhatsApp. Track who has paid in real-time.', cta: 'Try Now', gradient: 'from-[hsl(42,85%,45%)] to-[hsl(38,90%,55%)]', iconBg: 'bg-[hsl(var(--accent))]', badge: 'New' },
      { icon: Send, title: 'Scheduled Payments', headline: 'Set it and forget it.', description: 'Automate rent, school fees, and utility payments. Get reminders before each debit. Cancel anytime.', cta: 'Set Up', gradient: 'from-[hsl(210,80%,42%)] to-[hsl(210,70%,55%)]', iconBg: 'bg-[hsl(var(--info))]' },
      { icon: CreditCard, title: 'Buy Now Pay Later', headline: 'Shop now, pay in 4 instalments.', description: 'Interest-free instalments at 500+ partner merchants. Instant approval at checkout. No hidden fees.', cta: 'Learn More', gradient: 'from-[hsl(152,60%,32%)] to-[hsl(152,50%,45%)]', iconBg: 'bg-[hsl(var(--success))]', badge: '0% Interest' },
      { icon: PiggyBank, title: 'Cashback Rewards', headline: 'Get 2% back on every payment.', description: 'Earn cashback on utility bills, airtime, and M-Pesa payments. Cashback credited monthly to your account.', cta: 'Activate', gradient: 'from-[hsl(215,50%,16%)] to-[hsl(215,45%,28%)]', iconBg: 'bg-[hsl(var(--accent))]' },
    ],
    'young-professional': [
      { icon: Send, title: 'Instant P2P Transfer', headline: 'Send money in seconds, for free.', description: 'Instant transfers to any bank account in Kenya. Zero charges for transfers under KES 50K. Share via phone number.', cta: 'Send Free', gradient: 'from-[hsl(152,60%,32%)] to-[hsl(152,50%,45%)]', iconBg: 'bg-[hsl(var(--success))]', badge: 'Free' },
      { icon: Sparkles, title: 'Subscription Manager', headline: 'All your subscriptions in one place.', description: 'Track Netflix, Spotify, gym and all recurring charges. Get alerts before renewals. Cancel subscriptions in-app.', cta: 'Set Up', gradient: 'from-[hsl(210,80%,42%)] to-[hsl(210,70%,55%)]', iconBg: 'bg-[hsl(var(--info))]', badge: 'Smart' },
      { icon: CreditCard, title: 'BNPL Student', headline: 'Pay tuition in easy instalments.', description: 'Split education costs into 6 or 12 monthly payments. Low interest from 1% per month. Apply online in minutes.', cta: 'Apply Now', gradient: 'from-[hsl(42,85%,45%)] to-[hsl(38,90%,55%)]', iconBg: 'bg-[hsl(var(--accent))]' },
      { icon: Wallet, title: 'Spending Insights', headline: 'Know where every shilling goes.', description: 'AI-powered spending categories, monthly reports, and budget recommendations. Set spending alerts by category.', cta: 'Explore', gradient: 'from-[hsl(215,50%,16%)] to-[hsl(215,45%,28%)]', iconBg: 'bg-[hsl(var(--accent))]', badge: 'AI' },
    ],
  },
  'fx-operations': {
    'high-value': [
      { icon: Globe, title: 'FX Forward Contracts', headline: 'Lock in today\'s rate for future trades.', description: 'Hedge your currency exposure with forward contracts from 1 week to 12 months. Protect margins on large transactions.', cta: 'Get Quote', gradient: 'from-[hsl(215,50%,16%)] to-[hsl(215,45%,28%)]', iconBg: 'bg-[hsl(var(--accent))]', badge: 'Hedging' },
      { icon: TrendingUp, title: 'FX Advisory Service', headline: 'Expert guidance for currency decisions.', description: 'Daily market briefs, rate alerts, and direct access to our FX trading desk. Minimum deal size USD 50K.', cta: 'Subscribe', gradient: 'from-[hsl(42,85%,45%)] to-[hsl(38,90%,55%)]', iconBg: 'bg-[hsl(var(--accent))]', badge: 'VIP' },
      { icon: Landmark, title: 'Offshore Investment', headline: 'Diversify into global markets.', description: 'Invest in US, UK and EU equities and bonds through our custodial platform. Competitive brokerage from 0.25%.', cta: 'Explore', gradient: 'from-[hsl(210,80%,42%)] to-[hsl(210,70%,55%)]', iconBg: 'bg-[hsl(var(--info))]' },
      { icon: ShieldCheck, title: 'FX Options', headline: 'The right to buy — not the obligation.', description: 'Flexible currency options that protect your downside while preserving upside potential. Tailored structures available.', cta: 'Learn More', gradient: 'from-[hsl(152,60%,32%)] to-[hsl(152,50%,45%)]', iconBg: 'bg-[hsl(var(--success))]' },
    ],
    sme: [
      { icon: Globe, title: 'SME FX Account', headline: 'Trade currencies without the complexity.', description: 'Hold up to 5 foreign currencies. Auto-convert at the best rate. Zero monthly account fees for SME customers.', cta: 'Open Account', gradient: 'from-[hsl(152,60%,32%)] to-[hsl(152,50%,45%)]', iconBg: 'bg-[hsl(var(--success))]', badge: 'Zero Fees' },
      { icon: Send, title: 'Trade Finance', headline: 'Import & export financing made simple.', description: 'Letters of credit, documentary collections, and trade guarantees. Fast turnaround with dedicated trade specialists.', cta: 'Apply Now', gradient: 'from-[hsl(38,92%,40%)] to-[hsl(38,85%,55%)]', iconBg: 'bg-[hsl(var(--warning))]' },
      { icon: TrendingUp, title: 'FX Rate Alerts', headline: 'Never miss your target rate.', description: 'Set custom rate alerts for any currency pair. Get notified via SMS or email when the market hits your target.', cta: 'Set Alerts', gradient: 'from-[hsl(210,80%,42%)] to-[hsl(210,70%,55%)]', iconBg: 'bg-[hsl(var(--info))]' },
      { icon: ShieldCheck, title: 'Currency Risk Cover', headline: 'Insure against exchange rate losses.', description: 'Protect your import/export margins with affordable FX insurance. Premium starts from 0.5% of transaction value.', cta: 'Get Quote', gradient: 'from-[hsl(215,50%,16%)] to-[hsl(215,45%,28%)]', iconBg: 'bg-[hsl(var(--accent))]' },
    ],
    retail: [
      { icon: Globe, title: 'Travel Money Card', headline: 'The smart way to spend abroad.', description: 'Load multiple currencies onto one card. Lock in rates before you travel. No foreign transaction fees.', cta: 'Get Card', gradient: 'from-[hsl(42,85%,45%)] to-[hsl(38,90%,55%)]', iconBg: 'bg-[hsl(var(--accent))]', badge: 'Travel' },
      { icon: Send, title: 'Diaspora Remittance', headline: 'Receive money from abroad, fee-free.', description: 'Instant credits from 30+ countries. Best-in-market exchange rates. Receive in KES, USD, or GBP.', cta: 'Share Link', gradient: 'from-[hsl(152,60%,32%)] to-[hsl(152,50%,45%)]', iconBg: 'bg-[hsl(var(--success))]', badge: 'Fee-Free' },
      { icon: PiggyBank, title: 'USD Savings Account', headline: 'Save in dollars, grow in value.', description: 'Dollar-denominated savings with 4% p.a. interest. Protect against KES depreciation. Start with just USD 100.', cta: 'Open Now', gradient: 'from-[hsl(210,80%,42%)] to-[hsl(210,70%,55%)]', iconBg: 'bg-[hsl(var(--info))]' },
      { icon: CreditCard, title: 'Global Spend Card', headline: 'One card for every country.', description: 'Visa card with auto currency conversion at interbank rates. Free ATM withdrawals in 40+ countries.', cta: 'Apply Now', gradient: 'from-[hsl(215,50%,16%)] to-[hsl(215,45%,28%)]', iconBg: 'bg-[hsl(var(--accent))]' },
    ],
    'young-professional': [
      { icon: Globe, title: 'Micro FX Trading', headline: 'Trade currencies from KES 1,000.', description: 'Start small, learn FX trading with our guided platform. Practice with a demo account, then go live.', cta: 'Start Trading', gradient: 'from-[hsl(42,85%,45%)] to-[hsl(38,90%,55%)]', iconBg: 'bg-[hsl(var(--accent))]', badge: 'Learn' },
      { icon: Send, title: 'Student Abroad Transfer', headline: 'Send tuition fees internationally.', description: 'Discounted rates for education payments. Direct to university accounts in US, UK, Canada and Australia.', cta: 'Send Now', gradient: 'from-[hsl(210,80%,42%)] to-[hsl(210,70%,55%)]', iconBg: 'bg-[hsl(var(--info))]', badge: 'Student' },
      { icon: CreditCard, title: 'Travel Prepaid Card', headline: 'Your pocket-friendly travel companion.', description: 'Load USD, GBP or EUR before you travel. No surprise fees. Track spending in real-time via the app.', cta: 'Get Card', gradient: 'from-[hsl(152,60%,32%)] to-[hsl(152,50%,45%)]', iconBg: 'bg-[hsl(var(--success))]' },
      { icon: TrendingUp, title: 'FX Savings Pot', headline: 'Save in any currency you want.', description: 'Create currency savings pots for travel goals. Auto-convert at the best rate. Withdraw anytime in KES.', cta: 'Create Pot', gradient: 'from-[hsl(215,50%,16%)] to-[hsl(215,45%,28%)]', iconBg: 'bg-[hsl(var(--accent))]', badge: 'Goals' },
    ],
  },
  'card-services': {
    'high-value': [
      { icon: CreditCard, title: 'Infinite Card', headline: 'Unlimited privileges, unlimited rewards.', description: 'Visa Infinite with unlimited lounge access, personal concierge, 5% cashback on travel and dining. No pre-set spending limit.', cta: 'Apply Now', gradient: 'from-[hsl(215,50%,16%)] to-[hsl(215,45%,28%)]', iconBg: 'bg-[hsl(var(--accent))]', badge: 'Infinite' },
      { icon: ShieldCheck, title: 'Card Fraud Protection', headline: 'AI-powered security for every transaction.', description: 'Real-time fraud monitoring, instant card freeze, and guaranteed zero-liability on unauthorised transactions.', cta: 'Activate', gradient: 'from-[hsl(210,80%,42%)] to-[hsl(210,70%,55%)]', iconBg: 'bg-[hsl(var(--info))]', badge: 'AI Powered' },
      { icon: Globe, title: 'Global Travel Card', headline: 'Zero FX fees in 150+ countries.', description: 'Multi-currency Visa card with interbank rates. Free airport lounge access, travel insurance and emergency card replacement worldwide.', cta: 'Get Card', gradient: 'from-[hsl(42,85%,45%)] to-[hsl(38,90%,55%)]', iconBg: 'bg-[hsl(var(--accent))]' },
      { icon: Landmark, title: 'Premium Metal Card', headline: 'A card as distinguished as you.', description: 'Stainless steel card with bespoke design. Priority Pass membership, golf privileges, and exclusive event invitations.', cta: 'Request', gradient: 'from-[hsl(152,60%,32%)] to-[hsl(152,50%,45%)]', iconBg: 'bg-[hsl(var(--success))]', badge: 'Metal' },
    ],
    sme: [
      { icon: CreditCard, title: 'Business Expense Card', headline: 'Control team spending effortlessly.', description: 'Issue cards to employees with individual limits. Real-time expense tracking, auto-categorisation, and monthly reports.', cta: 'Get Started', gradient: 'from-[hsl(152,60%,32%)] to-[hsl(152,50%,45%)]', iconBg: 'bg-[hsl(var(--success))]', badge: 'Team' },
      { icon: Wallet, title: 'Virtual Card Suite', headline: 'Instant virtual cards for every need.', description: 'Create unlimited virtual Visa cards for subscriptions, ads, and supplier payments. Set budgets and auto-expire dates.', cta: 'Create Cards', gradient: 'from-[hsl(38,92%,40%)] to-[hsl(38,85%,55%)]', iconBg: 'bg-[hsl(var(--warning))]', badge: 'Instant' },
      { icon: TrendingUp, title: 'Business Credit Card', headline: 'Up to 45 days interest-free credit.', description: 'Revolving credit line up to KES 5M. Earn 1.5% cashback on all business purchases. Dedicated business rewards programme.', cta: 'Apply Now', gradient: 'from-[hsl(210,80%,42%)] to-[hsl(210,70%,55%)]', iconBg: 'bg-[hsl(var(--info))]' },
      { icon: ShieldCheck, title: 'Purchase Protection', headline: 'Every purchase insured for 90 days.', description: 'Automatic cover against damage, theft, and defects on all card purchases. Claims processed within 5 business days.', cta: 'Learn More', gradient: 'from-[hsl(215,50%,16%)] to-[hsl(215,45%,28%)]', iconBg: 'bg-[hsl(var(--accent))]' },
    ],
    retail: [
      { icon: CreditCard, title: 'Cashback Debit Card', headline: 'Earn 2% back on every swipe.', description: 'Automatic cashback on groceries, fuel, and utilities. Cashback credited monthly. No annual fee, no minimum spend.', cta: 'Get Card', gradient: 'from-[hsl(42,85%,45%)] to-[hsl(38,90%,55%)]', iconBg: 'bg-[hsl(var(--accent))]', badge: '2% Back' },
      { icon: ShieldCheck, title: 'Card Insurance Bundle', headline: 'Protect your card and your wallet.', description: 'Free purchase protection, extended warranty, and travel accident insurance on all card transactions. Zero extra cost.', cta: 'Activate', gradient: 'from-[hsl(210,80%,42%)] to-[hsl(210,70%,55%)]', iconBg: 'bg-[hsl(var(--info))]' },
      { icon: Sparkles, title: 'Rewards Credit Card', headline: 'Points on everything, redeem anywhere.', description: 'Earn 3x points on dining, 2x on shopping, 1x everywhere else. Redeem for flights, hotel stays, or statement credit.', cta: 'Apply Now', gradient: 'from-[hsl(152,60%,32%)] to-[hsl(152,50%,45%)]', iconBg: 'bg-[hsl(var(--success))]', badge: '3x Points' },
      { icon: PiggyBank, title: 'Save-As-You-Spend', headline: 'Round up transactions to save.', description: 'Every card purchase rounds up to the nearest KES 100. Spare change swept into your savings. Earn 7% bonus interest.', cta: 'Start Saving', gradient: 'from-[hsl(215,50%,16%)] to-[hsl(215,45%,28%)]', iconBg: 'bg-[hsl(var(--accent))]' },
    ],
    'young-professional': [
      { icon: Sparkles, title: 'Student Rewards Card', headline: 'Earn cashback on what you love.', description: 'Cashback on streaming, food delivery, and ride-hailing. No annual fee for the first 2 years. Build your credit history.', cta: 'Get Card', gradient: 'from-[hsl(210,80%,42%)] to-[hsl(210,70%,55%)]', iconBg: 'bg-[hsl(var(--info))]', badge: 'Students' },
      { icon: CreditCard, title: 'Digital-First Card', headline: 'Your card lives in your phone.', description: 'Instant virtual card for Apple Pay and Google Pay. Physical card optional. Real-time notifications and spending insights.', cta: 'Get Instantly', gradient: 'from-[hsl(152,60%,32%)] to-[hsl(152,50%,45%)]', iconBg: 'bg-[hsl(var(--success))]', badge: 'Instant' },
      { icon: TrendingUp, title: 'Credit Builder Card', headline: 'Build your credit score the smart way.', description: 'Low-limit card designed to build your credit profile. Free credit score tracking and personalised tips to improve your rating.', cta: 'Apply Now', gradient: 'from-[hsl(42,85%,45%)] to-[hsl(38,90%,55%)]', iconBg: 'bg-[hsl(var(--accent))]', badge: 'Build Credit' },
      { icon: ShieldCheck, title: 'Gadget Shield Card', headline: 'Buy gadgets with built-in protection.', description: 'Extended warranty and accidental damage cover on electronics purchased with your card. Claims via WhatsApp.', cta: 'Learn More', gradient: 'from-[hsl(215,50%,16%)] to-[hsl(215,45%,28%)]', iconBg: 'bg-[hsl(var(--accent))]' },
    ],
  },
};

function inferSegment(customer) {
  const totalBalance = customer.accounts.reduce((sum, a) => sum + Math.abs(a.balance), 0);
  const hasLoan = customer.accounts.some(a => a.type === 'loan');
  const hasFx = customer.accounts.some(a => a.type === 'fx');
  const accountCount = customer.accounts.length;

  if (totalBalance > 1500000 || hasFx) return 'high-value';
  if (accountCount >= 3 && hasLoan) return 'sme';
  if (totalBalance < 200000) return 'young-professional';
  return 'retail';
}

function OfferCard({ offer, index }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="group relative overflow-hidden rounded-2xl text-left w-full shadow-elevated transition-shadow hover:shadow-gold"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${offer.gradient} opacity-95`} />
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -right-2 top-12 h-16 w-16 rounded-full bg-white/5" />

      <div className="relative p-5">
        {offer.badge && (
          <span className="inline-block mb-3 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-widest text-white">
            {offer.badge}
          </span>
        )}
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${offer.iconBg} mb-3 shadow-card`}>
          <offer.icon className="h-5 w-5 text-primary-foreground" />
        </div>
        <h5 className="font-display text-lg font-bold text-white leading-tight mb-1">
          {offer.headline}
        </h5>
        <p className="text-xs text-white/75 leading-relaxed mb-4 line-clamp-2">
          {offer.description}
        </p>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white group-hover:gap-2.5 transition-all">
          {offer.cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </motion.button>
  );
}

export function CrossSellCard({ customer, category = 'cash-operations' }) {
  const segment = inferSegment(customer);
  const categoryKey = (category in CATEGORY_OFFERS ? category : 'cash-operations');
  const offers = CATEGORY_OFFERS[categoryKey][segment];
  const [showAll, setShowAll] = useState(false);

  const visibleOffers = showAll ? offers : offers.slice(0, 2);
  const hasMore = offers.length > 2 && !showAll;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[hsl(var(--accent))]" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recommended for You
        </h4>
      </div>

      <AnimatePresence mode="popLayout">
        <div className="grid gap-3">
          {visibleOffers.map((offer, i) => (
            <OfferCard key={offer.title} offer={offer} index={i} />
          ))}
        </div>
      </AnimatePresence>

      {hasMore && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAll(true)}
          className="w-full mt-1 text-xs"
        >
          <ChevronRight className="h-3.5 w-3.5" />
          See {offers.length - 2} more product{offers.length - 2 > 1 ? 's' : ''}
        </Button>
      )}

      {showAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(false)}
          className="w-full mt-1 text-xs text-muted-foreground"
        >
          Show less
        </Button>
      )}
    </div>
  );
}