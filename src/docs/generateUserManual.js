import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, PageBreak,
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

const step = (num, text) =>
  new Paragraph({ 
    spacing: { after: 100 }, 
    children: [
      new TextRun({ text: `Step ${num}: `, bold: true, size: 22, color: BLUE }),
      new TextRun({ text, size: 22 }),
    ]
  });

const note = (text) =>
  new Paragraph({ 
    spacing: { before: 100, after: 100 }, 
    indent: { left: 400 }, 
    children: [
      new TextRun({ text: '📌 Note: ', bold: true, size: 22, color: GOLD }),
      new TextRun({ text, italics: true, size: 22 }),
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

export async function generateUserManual() {
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
          // ───── COVER PAGE ─────
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
            children: [new TextRun({ text: 'User Manual', size: 36, color: GOLD })] 
          }),
          new Paragraph({ 
            alignment: AlignmentType.CENTER, 
            spacing: { before: 100 }, 
            children: [new TextRun({ text: 'For Bank Officers & Administrators', size: 24, color: GRAY })] 
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

          // ───── TOC ─────
          heading('Table of Contents'),
          new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-3' }),
          new Paragraph({ children: [new PageBreak()] }),

          // ───── 1. GETTING STARTED ─────
          heading('1. Getting Started'),
          body('AIDA™ (AI Digital Assistant) is your primary tool for processing customer transactions at the branch. This manual walks you through every feature of the system.'),

          heading('1.1 Accessing the Platform', HeadingLevel.HEADING_2),
          body('Open your web browser and navigate to the platform URL provided by your IT department. The system works best on Google Chrome or Microsoft Edge.'),

          heading('1.2 Demo Customer IDs', HeadingLevel.HEADING_2),
          body('For training and demonstration purposes, the following customer IDs are available:'),
          simpleTable(['Customer ID', 'Name', 'Segment', 'Accounts'], [
            ['CUST001', 'James Mwangi Kariuki', 'Premium', 'Savings, Current, USD FX, Fixed Deposit'],
            ['CUST002', 'Amina Hassan Mohamed', 'SME', 'Savings, Current, Loan'],
            ['CUST003', 'Peter Ochieng Otieno', 'Premium', 'Savings, Current, EUR FX, GBP FX, Fixed Deposit'],
            ['CUST004', 'Grace Wanjiku Njoroge', 'Retail', 'Savings, Current'],
          ]),

         // ───── 2. CUSTOMER VERIFICATION ─────
          heading('2. Customer Verification'),
          body('Every transaction begins with verifying the customer\'s identity.'),
          step(1, 'On the Customer Verification screen, enter the customer\'s unique Customer Number (e.g., CUST001) in the search field.'),
          step(2, 'Click "Look Up Customer" or press Enter.'),
          step(3, 'The system will display the customer\'s profile including name, phone number, and all linked accounts with balances and statuses.'),
          step(4, 'Verify the customer\'s identity against their physical ID document.'),
          step(5, 'Click "Proceed" to access the service dashboard, or "Change Customer" to search again.'),
          note('Dormant accounts are shown but cannot be used for transactions. Frozen accounts are excluded.'),

          // ───── 3. SERVICE DASHBOARD ─────
          heading('3. Service Dashboard'),
          body('After customer verification, you\'ll see the main dashboard with six service categories.'),

          heading('3.1 Searching for Services', HeadingLevel.HEADING_2),
          body('Use the search bar at the top to quickly find any service. Type keywords like "deposit", "transfer", or "card" to filter results. Click on any result to start the transaction.'),

          heading('3.2 Browsing by Category', HeadingLevel.HEADING_2),
          body('Click on any category card to see all services within that category. Each category is colour-coded for quick identification:'),
          simpleTable(['Category', 'Description', 'Example Services'], [
            ['Customer & Account', 'Account lifecycle management', 'Open Account, KYC Update'],
            ['Cash Operations', 'Physical cash transactions', 'Deposit, Withdrawal, Denomination Exchange'],
            ['Payment Operations', 'Electronic fund movements', 'Transfer, Bill Payment, Standing Order'],
            ['FX Operations', 'Foreign currency dealings', 'Buy FX, Sell FX, International Transfer'],
            ['Card Services', 'Debit/credit card management', 'Issue Card, Replace Card, PIN Reset'],
            ['Service Requests', 'General banking services', 'Cheque Book, Account Statement'],
          ]),

          // ───── 4. PROCESSING A TRANSACTION ─────
          heading('4. Processing a Transaction'),
          body('All transactions follow a guided step-by-step workflow. The progress stepper at the top shows your current position.'),

          heading('4.1 Step 1: Input', HeadingLevel.HEADING_2),
          step(1, 'Select the customer\'s account from the dropdown. Only eligible accounts for this service type are shown.'),
          step(2, 'Fill in the required fields (amount, reference, beneficiary details, etc.). Required fields are marked with *.'),
          step(3, 'Click "Submit for Validation" to proceed.'),
          note('The system automatically populates the customer name and ID. You only need to select the account and enter transaction-specific details.'),

          heading('4.2 Step 2: Validation', HeadingLevel.HEADING_2),
          body('The system automatically validates the transaction against bank policies. This includes checking account status, transaction limits, and compliance rules. This step takes approximately 1-2 seconds.'),

          heading('4.3 Step 3: Review', HeadingLevel.HEADING_2),
          body('Review the complete transaction summary including:'),
          bullet('Customer and account details'),
          bullet('Transaction amount and reference'),
          bullet('Service charges breakdown (service fee, excise duty, VAT)'),
          bullet('Total charges with fee account selection'),
          step(1, 'Review all details carefully.'),
          step(2, 'If charges apply, select the account to debit fees from (defaults to the main current account).'),
          step(3, 'Add any officer notes in the text area (optional but recommended for audit trail).'),
          step(4, 'Click "Approve & Process" to proceed, or "Return to Input" to make changes.'),
          note('Service charges vary by customer segment. Premium customers enjoy waived or reduced fees.'),

          heading('4.4 Step 4: Processing', HeadingLevel.HEADING_2),
          body('The system processes the transaction against the core banking platform. A spinning indicator shows the operation is in progress. This typically takes 2-3 seconds.'),

          heading('4.5 Step 5: Verification', HeadingLevel.HEADING_2),
          body('Present the transaction details to the customer for confirmation:'),
          step(1, 'Show the customer the transaction summary on screen.'),
          step(2, 'The customer confirms the details are correct.'),
          step(3, 'Click "Confirm" to finalise.'),

          heading('4.6 Step 6: Authorization', HeadingLevel.HEADING_2),
          body('For transactions exceeding the configured threshold (typically KES 100,000), manager authorization is required:'),
          step(1, 'The system displays a supervisor approval prompt.'),
          step(2, 'Call your supervisor/manager to authorize the transaction.'),
          step(3, 'The manager reviews and approves or rejects.'),
          note('Authorization thresholds are configurable per service in the Admin module.'),

          heading('4.7 Cross-Sell Opportunities', HeadingLevel.HEADING_2),
          body('After the transaction is complete, the system presents relevant product recommendations based on the customer\'s profile and segment. These are opportunities to offer additional banking products.'),
          bullet('Premium customers see wealth management and priority banking offers'),
          bullet('SME customers see business credit and payroll solutions'),
          bullet('Retail customers see personal loans and savings products'),
          bullet('Young professionals see starter accounts and digital banking tools'),

          heading('4.8 Customer Feedback', HeadingLevel.HEADING_2),
          body('The customer can rate their service experience (1-5 stars) and leave optional comments. Click "Submit & Complete" or "Skip" to finish.'),

          heading('4.9 Completion', HeadingLevel.HEADING_2),
          body('A confirmation screen shows the transaction reference number and a success message. Click "New Transaction" to process another transaction for the same customer.'),

          // ───── 5. STANDING ORDER ─────
          heading('5. Standing Order'),
          body('Standing Orders allow customers to set up recurring payment instructions. The journey is initiated digitally and completed at the branch.'),
          step(1, 'Select the customer\'s source account from the dropdown (savings or current accounts).'),
          step(2, 'Enter the beneficiary account number and beneficiary name.'),
          step(3, 'Enter the recurring transfer amount in KES.'),
          step(4, 'Select the payment frequency: Weekly, Bi-Weekly, Monthly, Quarterly, or Annually.'),
          step(5, 'Choose the start date and end date using the calendar pickers.'),
          step(6, 'Click "Submit for Validation" to proceed through the workflow.'),
          note('The review stage displays a structured summary showing the frequency, date range, and total estimated payments.'),

          // ───── 6. CARD SERVICES ─────
          heading('6. Card Services'),
          body('Card Services covers four operations: Card Issuance, Card Replacement, PIN Management, and Card Limit Update. All journeys are initiated digitally and completed at the branch.'),

          heading('6.1 Card Issuance', HeadingLevel.HEADING_2),
          body('Issue a new debit or credit card to a customer.'),
          step(1, 'Select the customer\'s source account.'),
          step(2, 'Choose the card type: Visa or Mastercard.'),
          step(3, 'Select the card tier: Classic, Gold, Platinum, or Infinite. Each tier shows its included benefits.'),
          step(4, 'Enter the name to be embossed on the card (maximum 26 characters).'),
          step(5, 'Toggle feature preferences: Contactless (NFC) and International Usage.'),
          step(6, 'Choose the delivery method: Branch Collection or Courier Delivery.'),
          step(7, 'Click "Submit for Validation" to proceed.'),
          note('Card name defaults to the customer\'s full name. The character counter helps ensure the name fits the embossing limit.'),

          heading('6.2 Card Replacement', HeadingLevel.HEADING_2),
          body('Replace an existing card that is damaged, lost, stolen, or expired.'),
          step(1, 'Select the card to be replaced from the list of existing cards (shows masked number, type, and expiry).'),
          step(2, 'Select the replacement reason: Damaged, Lost/Stolen, Expired, or Upgrade.'),
          step(3, 'If the reason is "Lost/Stolen", enter the police abstract/OB reference number (mandatory).'),
          step(4, 'Choose whether to retain the current card number or issue a new number.'),
          step(5, 'Click "Submit for Validation" to proceed.'),
          note('The previous card is automatically blocked upon submission. For lost/stolen cards, immediate blocking is critical for fraud prevention.'),

          heading('6.3 PIN Management', HeadingLevel.HEADING_2),
          body('Set, reset, or unblock a card PIN.'),
          step(1, 'Select the PIN action: Set PIN (new card), Reset PIN (forgotten), or Unblock PIN (locked).'),
          step(2, 'Select the card from the list of active cards.'),
          step(3, 'Choose the PIN delivery method: SMS OTP (sent to registered mobile) or Branch PIN Mailer (physical mailer).'),
          step(4, 'Click "Submit for Validation" to proceed.'),
          note('For security, PINs are never entered or displayed in the application. They are delivered via the chosen secure channel.'),

          heading('6.4 Card Limit Update', HeadingLevel.HEADING_2),
          body('Adjust daily POS and ATM transaction limits on an existing card.'),
          step(1, 'Select the card to update from the list of active cards.'),
          step(2, 'Use the POS limit slider to set the new daily POS limit (KES 0 – 500,000).'),
          step(3, 'Use the ATM limit slider to set the new daily ATM limit (KES 0 – 200,000).'),
          step(4, 'Toggle e-commerce transactions on or off as required.'),
          step(5, 'Click "Submit for Validation" to proceed.'),
          note('A supervisor authorization warning appears if POS exceeds KES 300,000 or ATM exceeds KES 150,000. Percentage change indicators show the difference from current limits.'),

          // ───── 7. SERVICE REQUESTS ─────
          heading('7. Service Requests'),
          body('Service Requests covers Cheque Book Request and Statement Request. Both are initiated digitally and fulfilled at the branch.'),

          heading('7.1 Cheque Book Request', HeadingLevel.HEADING_2),
          body('Order a new cheque book for a current account.'),
          step(1, 'Select the current account to link the cheque book to (only current accounts are shown).'),
          step(2, 'Choose the number of leaves: 25, 50, or 100.'),
          step(3, 'Select the cheque series preference: Continue existing series or start a new series.'),
          step(4, 'Choose the collection branch.'),
          step(5, 'Set the notification preference: SMS, Email, or Both.'),
          step(6, 'Click "Submit for Validation" to proceed.'),
          note('Estimated turnaround is 3–5 business days. The customer will be notified via their chosen channel when the cheque book is ready for collection.'),

          heading('7.2 Statement Request', HeadingLevel.HEADING_2),
          body('Request an account statement in various formats.'),
          step(1, 'Select the account for the statement.'),
          step(2, 'Choose the statement type: Mini Statement (last 10 transactions), Interim (custom date range), Full Period (inception to date), or Audit (certified).'),
          step(3, 'For Interim or Full Period, select the start and end dates.'),
          step(4, 'Choose the output format: PDF, CSV, or Printed.'),
          step(5, 'Select the delivery method: Email or Branch Collection.'),
          step(6, 'For certified statements, toggle "Certified Statement" on and enter the purpose (e.g., Visa Application, Tax Filing).'),
          step(7, 'Click "Submit for Validation" to proceed.'),
          note('ETAs vary by type: Mini = Instant, PDF/CSV = 1–2 hours, Printed = Same day, Certified = 2–3 business days.'),
          body('A confirmation screen shows the transaction reference number and a success message. Click "New Transaction" to process another transaction for the same customer.'),

          // ───── 8. FX RATES ─────
          heading('8. FX Rate Ticker'),
          body('When browsing Cash Operations or FX Operations, a live FX rate ticker appears showing indicative exchange rates for 7 major currencies against KES. Rates include 1-week directional trends (up/down arrows with percentage change).'),
          note('These are indicative rates only. Actual transaction rates are determined at the time of booking.'),

          // ───── 9. BANKING ASSISTANT ─────
          heading('9. Banking Assistant'),
          body('A floating chat button (gold circle) appears at the bottom-right of the screen. Click it to open the Banking Assistant.'),
          heading('9.1 Using the Assistant', HeadingLevel.HEADING_2),
          bullet('Type your question or request in natural language'),
          bullet('Use the quick prompt buttons for common requests'),
          bullet('Ask for FX rates to see an indicative rate table'),
          bullet('Request guidance on any service — the assistant will direct you to the right menu'),

          // ───── 10. SESSION MANAGEMENT ─────
          heading('10. Session Management'),
          heading('10.1 Ending a Session', HeadingLevel.HEADING_2),
          body('Click "End Session" in the top-right corner to log out the current customer and return to the Customer Verification screen. Always end the session before serving the next customer.'),
          heading('10.2 Navigating Back', HeadingLevel.HEADING_2),
          body('Use the back arrow (←) at the top-left of any screen to return to the previous view. From a transaction workflow, back takes you to the category view. From a category, back takes you to the dashboard.'),

          // ───── 11. ADMIN MODULE ─────
          heading('11. Administration Module'),
          body('Access the Admin module by clicking the "Admin" button with the gear icon in the header bar. The Admin module has five tabs:'),

          heading('11.1 Workflow Designer', HeadingLevel.HEADING_2),
          body('Configure the transaction workflow for any banking service. Services are grouped under 6 collapsible category headings for easy navigation:'),
          step(1, 'Expand a service category (e.g., "Cash Operations") in the left panel.'),
          step(2, 'Select a service from the list.'),
          step(3, 'Toggle stages on/off using the switches.'),
          step(4, 'Drag stages to reorder the workflow sequence.'),
          step(5, 'Expand a stage (chevron icon) to configure:'),
          bullet('Approval requirements and threshold amounts'),
          bullet('Validation rules (one per line, e.g., "amount > 0")'),
          bullet('Custom processing scripts'),
          step(6, 'Optionally set a charge override amount.'),
          step(7, 'Click "Save" to persist the configuration.'),
          note('Use the + button to add new services to the menu. Removing a service also removes its pricing configuration.'),

          heading('11.2 Pricing Configurator', HeadingLevel.HEADING_2),
          body('Define the fee structure for every service across customer segments:'),
          step(1, 'View the pricing matrix — services as rows, customer segments as columns.'),
          step(2, 'Click any cell to edit the fees for that service/segment combination.'),
          step(3, 'Set the Service Fee (flat amount), Percentage Fee, Minimum Charge, and Maximum Charge.'),
          step(4, 'Click "Save All Pricing" to persist all changes.'),
          heading('11.2.1 Managing Customer Segments', HeadingLevel.HEADING_3),
          step(1, 'In the Segments sidebar, click "Add Segment".'),
          step(2, 'Enter a segment key (e.g., "corporate"), a display label, and sort order.'),
          step(3, 'Click "Add" to create it — a new column appears in the matrix.'),
          step(4, 'To remove a segment, click the trash icon next to it.'),
          note('Removing a segment also deletes all pricing data for that segment across all services.'),

          heading('11.3 API Configurator', HeadingLevel.HEADING_2),
          body('Define integration endpoints for connecting to the core banking or host platform:'),
          step(1, 'Click "Add" to create a new endpoint.'),
          step(2, 'Enter the endpoint name, linked service, and trigger stage.'),
          step(3, 'Set the HTTP method (GET, POST, PUT, PATCH, DELETE) and URL.'),
          step(4, 'Configure request headers (e.g., Authorization, Content-Type).'),
          step(5, 'Define request field mappings: map workflow fields to API request fields.'),
          step(6, 'Define response field mappings: extract data from API responses.'),
          step(7, 'Edit the code template for custom integration logic.'),
          step(8, 'Click "Test" to verify connectivity (mock test).'),
          step(9, 'Click "Save" to persist the configuration.'),

          heading('11.4 Analyser', HeadingLevel.HEADING_2),
          body('Build personalised analytics dashboards to monitor platform utilisation:'),
          step(1, 'Click "Add Metric" to open the metric catalogue.'),
          step(2, 'Browse metrics by category (Volume, Performance, Financial, User Activity, Operator, Quality).'),
          step(3, 'Select a metric and optionally filter by service category (e.g., Cash Operations only).'),
          step(4, 'The metric card appears on your dashboard showing a chart, current value, and trend.'),
          step(5, 'Click the "✨ Insight" button on any metric card to get AI-generated analysis.'),
          step(6, 'Remove metrics by hovering over a card and clicking the X button.'),
          note('Dashboards support up to 18 metrics (6 rows × 3 per row). Your dashboard layout is saved automatically.'),
          heading('11.4.1 Available Metric Categories', HeadingLevel.HEADING_3),
          simpleTable(['Category', 'Example Metrics'], [
            ['Transaction Volume', 'Transaction Volume, Channel Distribution, Segment Distribution'],
            ['Performance', 'Avg Processing Time, Avg Queue Wait Time'],
            ['Financial', 'Transaction Value, Cross-Sell Conversion, Revenue per Service, Monthly Growth, Cost per Transaction'],
            ['User Activity', 'Active Users, Avg Session Duration, Peak Usage Hours'],
            ['Operator Metrics', 'Operator Throughput, Pending Approvals, SLA Compliance, Operator Utilisation'],
            ['Quality & Compliance', 'Approval Rate, Completion Rate, Error Rate, Customer Satisfaction, First Contact Resolution'],
          ]),

          heading('11.5 Publisher (Change Management)', HeadingLevel.HEADING_2),
          body('The Publisher implements a maker-checker governance process for all configuration changes:'),

          heading('11.5.1 For Makers (Supervisors, Tech Officers)', HeadingLevel.HEADING_3),
          step(1, 'Select your role from the "Acting as" dropdown.'),
          step(2, 'Fill in the title, description, and change type (Workflow or API).'),
          step(3, 'Click "Create" to generate a draft change request.'),
          step(4, 'Click "Submit for Review" to send it to a checker.'),

          heading('11.5.2 For Checkers (Managers, IT Leads)', HeadingLevel.HEADING_3),
          step(1, 'Select your checker role from the "Acting as" dropdown.'),
          step(2, 'Click "Pick Up Review" on a submitted change request.'),
          step(3, 'Click "Run Tests" to execute automated regression tests.'),
          step(4, 'Review the test results and configuration snapshot.'),
          step(5, 'Add review notes and click "Approve" or "Reject".'),
          step(6, 'For approved changes, click "Publish to Production" to deploy.'),

          heading('11.5.3 Version History & Rollback', HeadingLevel.HEADING_3),
          body('Click the "Version History" tab to see all published versions. Active versions are highlighted in green. Checkers can click "Rollback" to deactivate a version and revert to the previous configuration.'),

          // ───── 12. SERVICE CHARGES REFERENCE ─────
          heading('12. Service Charges Quick Reference'),
          body('Below are common service charges by segment. All amounts in KES.'),
          simpleTable(['Service', 'Premium', 'SME', 'Retail', 'Young Prof.'], [
            ['Cash Deposit', 'FREE', '50', '100', '50'],
            ['Cash Withdrawal', '0 + 0.1%', '100 + 0.2%', '100 + 0.3%', '50 + 0.2%'],
            ['Funds Transfer', '0 + 0.1%', '50 + 0.3%', '50 + 0.5%', '30 + 0.3%'],
            ['Standing Order', '0 + 0.1%', '50 + 0.2%', '50 + 0.3%', '30 + 0.2%'],
            ['Bill Payment', 'FREE', '50', '50', '30'],
            ['FX Purchase', '0 + 0.2%', '200 + 0.5%', '200 + 0.8%', '100 + 0.5%'],
            ['Card Issuance', 'FREE', '500', '500', '250'],
            ['Card Replacement', 'FREE', '500', '1,000', '500'],
            ['PIN Management', 'FREE', '100', '200', '100'],
            ['Card Limit Update', 'FREE', 'FREE', '100', '50'],
            ['Statement Request', 'FREE', '100', '200', '100'],
            ['Cheque Book', 'FREE', '500', '750', '500'],
          ]),
          note('Percentage fees are applied to the transaction amount with min/max caps. Excise Duty (20%) and VAT (16%) are added on top of the service fee.'),


          // ───── 13. TROUBLESHOOTING ─────
          heading('13. Troubleshooting'),
          simpleTable(['Issue', 'Possible Cause', 'Resolution'], [
            ['Customer not found', 'Incorrect customer number', 'Verify the number and try again. Demo IDs: CUST001-CUST004'],
            ['No eligible accounts', 'Service requires specific account type', 'Check if customer has the required account type (e.g., cheque book requires current account)'],
            ['Transaction rejected', 'Amount exceeds limits or account inactive', 'Check account status and transaction limits'],
            ['Card not shown for replacement', 'Card is already blocked or closed', 'Only active and expired cards are available for replacement'],
            ['PIN action unavailable', 'Card is not in active status', 'Only active cards can have PIN operations performed'],
            ['Page not loading', 'Network connectivity issue', 'Check internet connection and refresh the page'],
            ['Changes not saving (Admin)', 'Database connection issue', 'Wait a moment and retry. Check for error messages'],
            ['FX rates not moving', 'Demo data uses static rates', 'This is expected in demo mode'],
          ]),

          // ───── 14. KEYBOARD SHORTCUTS ─────
          heading('14. Keyboard Shortcuts'),
          simpleTable(['Shortcut', 'Action'], [
            ['Enter', 'Submit current form / Confirm action'],
            ['Escape', 'Close chat panel / Cancel current dialog'],
          ]),

          // ───── GLOSSARY ─────
          heading('Glossary'),
          simpleTable(['Term', 'Definition'], [
            ['KYC', 'Know Your Customer — identity verification process'],
            ['FX', 'Foreign Exchange — currency conversion operations'],
            ['RLS', 'Row Level Security — database access control mechanism'],
            ['Maker', 'User who creates/submits configuration changes'],
            ['Checker', 'User who reviews/approves configuration changes'],
            ['Cross-Sell', 'Offering additional products during a service interaction'],
            ['Excise Duty', 'Government tax on financial services (20% in Kenya)'],
            ['VAT', 'Value Added Tax (16% standard rate in Kenya)'],
            ['SWIFT', 'International payment messaging network'],
            ['Segment', 'Customer pricing tier (e.g., Retail, SME, Premium)'],
            ['Pricing Matrix', 'Grid of fees defined per service and customer segment'],
            ['Analyser', 'Admin dashboard for visualising platform utilisation metrics'],
            ['AI Insight', 'Automated analysis of metric data powered by AI'],
            ['SLA', 'Service Level Agreement — target performance standards'],
            ['NFC', 'Near Field Communication — contactless payment technology'],
            ['PIN Mailer', 'Secure physical document containing a card PIN'],
            ['OTP', 'One-Time Password — temporary code sent via SMS for verification'],
            ['Standing Order', 'Recurring payment instruction executed automatically at set intervals'],
            ['Embossing', 'Physical engraving of cardholder name on a bank card'],
          ]),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, 'AIDA_User_Manual.docx');
}
