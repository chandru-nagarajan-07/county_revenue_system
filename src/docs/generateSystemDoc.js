import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak,
  TableOfContents, Header, Footer, ShadingType,
} from 'docx';
import { saveAs } from 'file-saver';
import { COPYRIGHT_TEXT, COPYRIGHT_NOTICE } from './copyright';

const BLUE = '1a365d';
const GOLD = 'c9a227';
const GRAY = '6b7280';

const heading = (text, level = HeadingLevel.HEADING_1) =>
  new Paragraph({ 
    heading: level, 
    spacing: { before: 400, after: 200 }, 
    children: [new TextRun({ text, bold: true, color: BLUE })] 
  });

const body = (text) =>
  new Paragraph({ 
    spacing: { after: 120 }, 
    children: [new TextRun({ text, size: 22 })] 
  });

const bullet = (text) =>
  new Paragraph({ 
    bullet: { level: 0 }, 
    spacing: { after: 80 }, 
    children: [new TextRun({ text, size: 22 })] 
  });

const bold = (label, value) =>
  new Paragraph({ 
    spacing: { after: 80 }, 
    children: [
      new TextRun({ text: label, bold: true, size: 22 }), 
      new TextRun({ text: value, size: 22 })
    ] 
  });

function tableRow(cells, isHeader = false) {
  return new TableRow({
    children: cells.map(c => new TableCell({
      width: { size: Math.floor(9000 / cells.length), type: WidthType.DXA },
      shading: isHeader ? { type: ShadingType.SOLID, color: BLUE, fill: BLUE } : undefined,
      children: [new Paragraph({ 
        children: [new TextRun({ 
          text: c, 
          bold: isHeader, 
          color: isHeader ? 'ffffff' : '000000', 
          size: 20 
        })] 
      })],
    })),
  });
}

function simpleTable(headers, rows) {
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    rows: [tableRow(headers, true), ...rows.map(r => tableRow(r))],
  });
}

export async function generateSystemDoc() {
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22 } },
        heading1: { run: { font: 'Calibri', size: 32, bold: true, color: BLUE } },
        heading2: { run: { font: 'Calibri', size: 28, bold: true, color: BLUE } },
        heading3: { run: { font: 'Calibri', size: 24, bold: true, color: BLUE } },
      },
    },
    sections: [
      {
        properties: {},
        headers: { 
          default: new Header({ 
            children: [new Paragraph({ 
              children: [new TextRun({ text: COPYRIGHT_NOTICE, size: 16, color: GRAY, italics: true })] 
            })] 
          }) 
        },
        footers: { 
          default: new Footer({ 
            children: [new Paragraph({ 
              alignment: AlignmentType.CENTER, 
              children: [new TextRun({ text: 'Snapp Systems Kenya Limited — Confidential', size: 16, color: GRAY })] 
            })] 
          }) 
        },
        children: [
          // Cover page content remains exactly the same...
          new Paragraph({ spacing: { before: 2000 } }),
          new Paragraph({ 
            alignment: AlignmentType.CENTER, 
            children: [new TextRun({ text: 'AIDA™', bold: true, size: 52, color: BLUE })] 
          }),
          new Paragraph({ 
            alignment: AlignmentType.CENTER, 
            spacing: { before: 100 }, 
            children: [new TextRun({ text: 'AI Digital Assistant', size: 32, color: GOLD })] 
          }),
          new Paragraph({ 
            alignment: AlignmentType.CENTER, 
            spacing: { before: 200 }, 
            children: [new TextRun({ text: 'System Documentation', size: 36, color: GOLD })] 
          }),
          new Paragraph({ 
            spacing: { before: 600 }, 
            alignment: AlignmentType.CENTER, 
            children: [new TextRun({ 
              text: `Version 1.0 — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, 
              size: 24, 
              color: GRAY 
            })] 
          }),
          new Paragraph({ spacing: { before: 1200 } }),
          ...COPYRIGHT_TEXT.split('\n').map(line => 
            new Paragraph({ 
              alignment: AlignmentType.CENTER, 
              children: [new TextRun({ text: line, size: 18, italics: true, color: GRAY })] 
            })
          ),
          new Paragraph({ children: [new PageBreak()] }),

          // Table of Contents
          heading('Table of Contents'),
          new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-3' }),
          new Paragraph({ children: [new PageBreak()] }),

          // ───── 1. EXECUTIVE SUMMARY ─────
          heading('1. Executive Summary'),
          body('AIDA™ (AI Digital Assistant) is a modern, web-based banking operations platform designed for front-office bank officers. It streamlines customer service delivery across six core service categories: Customer & Account management, Cash Operations, Payment Operations, Card Services, FX Operations, and Service Requests.'),
          body('The platform features a guided transaction workflow engine, real-time FX rate display, intelligent cross-selling powered by customer segmentation, a banking assistant chatbot, and a comprehensive administration module for workflow configuration, pricing matrix management, API integration, AI-powered analytics, and governed change promotion.'),
          body('Built with React, TypeScript, and Tailwind CSS, the system connects to a Lovable Cloud backend for persistent storage of configurations, change requests, version history, and pricing matrices. AI-powered analytics are delivered via the Lovable AI Gateway.'),

          // ───── 2. SYSTEM ARCHITECTURE ─────
          heading('2. System Architecture'),
          heading('2.1 Technology Stack', HeadingLevel.HEADING_2),
          simpleTable(['Layer', 'Technology', 'Purpose'], [
            ['Frontend Framework', 'React 18 + TypeScript', 'Component-based UI with type safety'],
            ['Build Tool', 'Vite', 'Fast development server and optimised builds'],
            ['Styling', 'Tailwind CSS + shadcn/ui', 'Utility-first CSS with accessible component library'],
            ['State Management', 'TanStack React Query', 'Server state synchronisation and caching'],
            ['Animations', 'Framer Motion', 'Smooth page transitions and micro-interactions'],
            ['Routing', 'React Router v6', 'Client-side navigation'],
            ['Backend', 'Lovable Cloud (Supabase)', 'PostgreSQL database, auth, edge functions'],
            ['Icons', 'Lucide React', 'Consistent iconography'],
          ]),

          heading('2.2 Application Structure', HeadingLevel.HEADING_2),
          simpleTable(['Directory', 'Contents'], [
            ['src/pages/', 'Route-level page components (Index, Admin, Documentation, NotFound)'],
            ['src/components/banking/', 'Teller-facing UI components (workflows, lookup, chat)'],
            ['src/components/admin/', 'Admin module components (workflow designer, pricing configurator, API config, analyser, publisher)'],
            ['src/components/ui/', 'Reusable shadcn/ui primitives'],
            ['src/types/', 'TypeScript type definitions and service catalogues'],
            ['src/data/', 'Demo customer data and service charge matrices'],
            ['src/hooks/', 'Custom React hooks including database operations'],
            ['src/integrations/', 'Supabase client and auto-generated types'],
            ['src/docs/', 'Documentation generators (system doc, user manual)'],
            ['supabase/functions/', 'Edge functions (AI insights for Analyser)'],
          ]),

          heading('2.3 Database Schema', HeadingLevel.HEADING_2),
          body('The platform persists data in six primary tables:'),
          simpleTable(['Table', 'Purpose', 'Key Columns'], [
            ['workflow_configs', 'Stores workflow stage configurations per service', 'service_id, stages (JSONB), charge_override'],
            ['customer_segments', 'Defines customer pricing tiers', 'segment_key, label, sort_order'],
            ['pricing_configs', 'Fee matrix per service/segment combination', 'service_id, segment_key, service_fee, percentage_fee, min_charge, max_charge'],
            ['api_configs', 'API endpoint definitions for host integrations', 'service_id, url, method, headers, request/response mappings'],
            ['change_requests', 'Maker-checker lifecycle tracking', 'title, status (enum), change_type, config_snapshot, test_results'],
            ['published_versions', 'Deployment history with rollback', 'version_number, is_active, config_snapshot, change_request_id'],
          ]),
          body('Row Level Security (RLS) is enabled on all tables. Current policies allow public access (no authentication required for demo).'),

          // ───── 3. SERVICE CATALOGUE ─────
          heading('3. Service Catalogue'),
          body('The platform supports 18 banking services organised into 6 categories:'),
          simpleTable(['Category', 'Services'], [
            ['Customer & Account', 'Open New Account, KYC Update, Account Modification'],
            ['Cash Operations', 'Cash Deposit, Cash Withdrawal, Denomination Exchange'],
            ['Payment Operations', 'Funds Transfer, Bill Payment, Standing Order'],
            ['FX Operations', 'Buy Foreign Currency, Sell Foreign Currency, FX Transfer'],
            ['Card Services', 'Card Issuance, Card Replacement, PIN Management, Card Limit Update'],
            ['Service Requests', 'Cheque Book Request, Statement Request'],
          ]),

          heading('3.1 Standing Order (Payment Operations)', HeadingLevel.HEADING_2),
          body('The Standing Order service enables the setup of recurring payment instructions initiated digitally and completed at the branch. Key capabilities:'),
          bullet('Source account selection filtered by eligibility (savings and current accounts)'),
          bullet('Beneficiary account/name capture'),
          bullet('Frequency options: Weekly, Bi-Weekly, Monthly, Quarterly, Annually'),
          bullet('Start and end date scheduling with calendar pickers'),
          bullet('Validation ensures amount > 0, end date after start date, and all mandatory fields populated'),
          body('The workflow summary displays a structured recurring instruction card showing account details, amount, frequency schedule, and date range.'),

          heading('3.2 Card Services (4 User Stories)', HeadingLevel.HEADING_2),
          body('Card Services provides a unified digital-to-branch interface covering four distinct card operations, each with specialised input forms and validation logic:'),

          heading('3.2.1 Card Issuance', HeadingLevel.HEADING_3),
          body('New card provisioning for customers without an existing card or requiring an additional card.'),
          bullet('Card network selection: Visa or Mastercard'),
          bullet('Tier selection: Classic, Gold, Platinum, or Infinite — with feature badges (Lounge Access, Concierge, etc.)'),
          bullet('Name on card input with 26-character embossing limit and real-time counter'),
          bullet('Feature toggles: Contactless NFC payments and International usage'),
          bullet('Delivery method: Branch Collection or Courier Delivery'),

          heading('3.2.2 Card Replacement', HeadingLevel.HEADING_3),
          body('Replacement of existing cards due to damage, loss, theft, or expiry.'),
          bullet('Existing card selector showing masked card numbers with status and expiry'),
          bullet('Replacement reason: Damaged, Lost/Stolen, Expired, Upgrade'),
          bullet('Conditional police abstract reference field — mandatory when reason is "Lost/Stolen"'),
          bullet('Option to retain the current card number or issue a new number'),
          bullet('Previous card is automatically blocked upon replacement submission'),

          heading('3.2.3 PIN Management', HeadingLevel.HEADING_3),
          body('Secure PIN lifecycle management for active cards.'),
          bullet('Action types: PIN Set (new cards), PIN Reset (forgotten PIN), PIN Unblock (locked after failed attempts)'),
          bullet('Active card selection with masked number display'),
          bullet('PIN delivery method: SMS OTP to registered mobile or physical Branch PIN Mailer'),
          bullet('Security-first design — no PIN entry occurs in the application; delivery is via secure channel'),

          heading('3.2.4 Card Limit Update', HeadingLevel.HEADING_3),
          body('Adjustment of transaction limits on existing cards.'),
          bullet('Active card selector with current limit display'),
          bullet('Independent POS and ATM daily limit sliders (KES 0 – 500,000 POS, 0 – 200,000 ATM)'),
          bullet('Real-time percentage change indicators comparing current vs. new limits'),
          bullet('E-commerce transaction toggle (enable/disable online purchases)'),
          bullet('Supervisor authorization warning when POS limit exceeds KES 300,000 or ATM exceeds KES 150,000'),

          heading('3.3 Service Requests (2 User Stories)', HeadingLevel.HEADING_2),
          body('Service Requests covers non-transactional banking services initiated digitally and fulfilled at the branch.'),

          heading('3.3.1 Cheque Book Request', HeadingLevel.HEADING_3),
          body('Ordering new cheque books for current account holders.'),
          bullet('Account selection filtered to current accounts only (cheque-eligible)'),
          bullet('Leaf count options: 25, 50, or 100 leaves'),
          bullet('Cheque series preference: Continue from last series or request new series'),
          bullet('Collection branch selection'),
          bullet('Notification preference: SMS, Email, or Both'),
          bullet('Estimated turnaround: 3–5 business days displayed prominently'),

          heading('3.3.2 Statement Request', HeadingLevel.HEADING_3),
          body('Generation and delivery of account statements in various formats.'),
          bullet('Statement types: Mini (last 10 transactions), Interim (custom period), Full Period (account inception to date), Audit (certified for legal/regulatory use)'),
          bullet('Date range picker for Interim and Full Period types'),
          bullet('Output format: PDF, CSV, or Printed Hardcopy'),
          bullet('Delivery method: Email or Branch Collection'),
          bullet('Certified Statement toggle — requires purpose input (e.g., Visa Application, Court Order, Tax Filing)'),
          bullet('Dynamic ETA calculation: Mini = Instant, PDF/CSV = 1–2 hours, Printed = Same day, Certified = 2–3 business days'),

          // ───── 4. WORKFLOW ENGINE ─────
          heading('4. Transaction Workflow Engine'),
          body('Every banking transaction follows a configurable multi-stage workflow:'),
          simpleTable(['Stage', 'Purpose', 'Configurable'], [
            ['Input', 'Capture transaction data with account selection', 'Field set per service'],
            ['Validation', 'Automated policy checks (compliance, account status)', 'Validation rules'],
            ['Review', 'Officer reviews summary and service charges', 'Approval threshold'],
            ['Processing', 'Simulate core banking host call', 'Custom scripts'],
            ['Verification', 'Customer confirms transaction details', 'Enable/disable'],
            ['Authorization', 'Manager approval for high-value transactions', 'Threshold amount'],
            ['Cross-Sell', 'Segment-aware product recommendations', 'Enable/disable'],
            ['Feedback', 'Customer satisfaction rating', 'Enable/disable'],
            ['Complete', 'Transaction confirmation with reference number', 'N/A'],
          ]),

          // ───── 5. SERVICE CHARGES ─────
          heading('5. Service Charge Framework'),
          body('Charges are computed dynamically based on customer segment and transaction amount. The system applies:'),
          bullet('Flat service fees varying by segment'),
          bullet('Percentage-based fees with min/max caps for cash and FX operations'),
          bullet('Excise Duty at 20% of the service fee (Kenya regulation)'),
          bullet('VAT at 16% of (service fee + excise duty)'),
          heading('5.1 Customer Segmentation', HeadingLevel.HEADING_2),
          simpleTable(['Segment', 'Criteria', 'Fee Treatment'], [
            ['Premium (High-Value)', 'Total balance > KES 1.5M or holds FX accounts', 'Waived or reduced fees'],
            ['SME / Business', '3+ accounts and has a loan account', 'Standard commercial rates'],
            ['Retail', 'Default segment, balance > KES 200K', 'Standard retail rates'],
            ['Young Professional', 'Total balance < KES 200K', 'Discounted rates'],
          ]),

          // ───── 6. CROSS-SELL ENGINE ─────
          heading('6. Cross-Sell & Product Recommendation Engine'),
          body('The platform features a contextual cross-selling system that recommends products based on:'),
          bullet('Customer segment (Premium, SME, Retail, Young Professional)'),
          bullet('Current service category being used'),
          bullet('Product eligibility rules'),
          body('Each category presents 4 tailored offers per segment, totalling 80 unique product recommendations across the matrix. Offers include insurance, loans, savings products, investment tools, and digital banking services.'),

          // ───── 7. ADMIN MODULE ─────
          heading('7. Administration Module'),
          body('The Admin module (/admin) provides five integrated epics for platform governance, accessible via tabbed navigation.'),

          heading('7.1 Workflow Designer', HeadingLevel.HEADING_2),
          body('Provides a visual drag-and-drop interface for configuring transaction workflow stages per service. Services are grouped under 6 collapsible category headings (Customer & Account, Cash Operations, Payment Operations, Card Services, FX Operations, Service Requests). Features include:'),
          bullet('Add or remove services from the service menu dynamically'),
          bullet('Enable/disable individual stages'),
          bullet('Drag-to-reorder stage sequence'),
          bullet('Configure approval requirements and thresholds'),
          bullet('Define validation rules (one per line)'),
          bullet('Attach custom processing scripts'),
          bullet('Override default service charges'),
          body('Adding a service here automatically makes it available in the Pricing Configurator for fee matrix definition.'),

          heading('7.2 Pricing Configurator', HeadingLevel.HEADING_2),
          body('Manages the pricing matrix for all services across customer segments. Features include:'),
          bullet('Full matrix view showing all services (rows) vs. customer segments (columns)'),
          bullet('Define service fee, percentage fee, minimum charge, and maximum charge per cell'),
          bullet('Add and remove customer segments with custom labels and sort order'),
          bullet('Bulk save — all pricing changes are persisted atomically'),
          bullet('Services are automatically populated from the Workflow Designer'),
          body('Customer segments are stored in the customer_segments table and pricing values in pricing_configs with a composite unique key on (service_id, segment_key).'),

          heading('7.3 API Configurator', HeadingLevel.HEADING_2),
          body('Manages integration endpoints for connecting to host banking platforms:'),
          bullet('Full CRUD for API endpoints'),
          bullet('HTTP method, URL, and custom headers configuration'),
          bullet('Request field mapping (source → target with optional transforms)'),
          bullet('Response field mapping for data extraction'),
          bullet('Code template editor for integration logic'),
          bullet('Mock connection testing'),

          heading('7.4 Analyser', HeadingLevel.HEADING_2),
          body('Provides customisable analytics dashboards with AI-powered insights for monitoring platform utilisation. Features include:'),
          bullet('22 available metrics across 6 categories: Transaction Volume, Performance, Financial, User Activity, Operator Metrics, and Quality & Compliance'),
          bullet('Customisable dashboard layout — admins select which metrics to display, up to 18 metrics (6 rows × 3 per row)'),
          bullet('Each metric card shows a chart (line, bar, area, or pie), current value with trend indicator, and a service category filter'),
          bullet('AI-powered insight button on each metric — calls a Lovable AI edge function to generate contextual analysis of the data'),
          bullet('Dashboard name is editable and configurations are persisted per user in local storage'),
          body('The AI insights are powered by the analyser-insights edge function which calls the Lovable AI Gateway (Google Gemini) with metric summaries and returns concise, actionable observations.'),

          heading('7.5 Publisher (Maker-Checker)', HeadingLevel.HEADING_2),
          body('Implements a full governance lifecycle for configuration changes:'),
          simpleTable(['Role', 'Capabilities'], [
            ['Maker (Supervisor/Tech Officer)', 'Create change requests, submit for review'],
            ['Checker (Manager/IT Lead)', 'Review, run regression tests, approve/reject, publish, rollback'],
          ]),
          body('The promotion pipeline follows: Draft → Submitted → In Review → Testing → Approved → Published.'),
          body('Published versions are tracked with rollback capability. Each version stores a complete configuration snapshot.'),

          // ───── 8. CHAT ASSISTANT ─────
          heading('8. Banking Assistant (Chatbot)'),
          body('A floating chat panel provides contextual assistance:'),
          bullet('Quick prompts for common operations (deposits, transfers, KYC, FX rates)'),
          bullet('Keyword-based response matching'),
          bullet('Indicative FX rate display in tabular format'),
          bullet('Service navigation guidance'),
          body('Note: The current implementation uses pattern matching. Future versions may integrate AI-powered natural language processing via Lovable AI Gateway.'),

          // ───── 9. FX TICKER ─────
          heading('9. Real-Time FX Rate Ticker'),
          body('An animated horizontal ticker displays indicative exchange rates against KES for 7 major currencies (USD, GBP, EUR, JPY, CHF, ZAR, AED). Each rate shows the current mid-rate and 1-week percentage change with directional indicators.'),

          // ───── 10. SECURITY ─────
          heading('10. Security Considerations'),
          bullet('Row Level Security (RLS) enabled on all database tables'),
          bullet('Supabase handles connection security and API key management'),
          bullet('API keys stored as secrets, never in client-side code'),
          bullet('No direct SQL access from the frontend — all operations via Supabase SDK'),
          bullet('Current demo mode: public RLS policies (to be tightened with authentication)'),
          body('Recommended enhancements for production:'),
          bullet('Implement user authentication with email/password'),
          bullet('Role-based access control (RBAC) for maker/checker enforcement'),
          bullet('Audit logging for all configuration changes'),
          bullet('Rate limiting on API endpoints'),

          // ───── 11. DEPLOYMENT ─────
          heading('11. Deployment & Infrastructure'),
          body('The application is deployed via Lovable Cloud with the following architecture:'),
          bullet('Frontend: Static site deployed to CDN edge network'),
          bullet('Backend: Lovable Cloud (Supabase) — managed PostgreSQL + Edge Functions'),
          bullet('Preview URL for staging/testing'),
          bullet('Published URL for production'),
          body('CI/CD is handled automatically by the Lovable platform — code changes are deployed on save.'),

          // ───── APPENDIX ─────
          heading('Appendix A: Environment Variables'),
          simpleTable(['Variable', 'Description'], [
            ['VITE_SUPABASE_URL', 'Backend API endpoint URL'],
            ['VITE_SUPABASE_PUBLISHABLE_KEY', 'Public API key for client-side operations'],
            ['VITE_SUPABASE_PROJECT_ID', 'Project identifier'],
          ]),

          heading('Appendix B: Database Enumerations'),
          simpleTable(['Enum', 'Values'], [
            ['change_status', 'draft, submitted, in_review, testing, approved, rejected, published'],
            ['change_type', 'workflow, api'],
          ]),
        ],
      },
    ],
  });


  const blob = await Packer.toBlob(doc);
  saveAs(blob, 'AIDA_System_Documentation.docx');
}
