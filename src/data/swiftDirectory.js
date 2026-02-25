/**
 * Bankers Almanac-style SWIFT/BIC directory
 * Used for smart autocomplete on wire transfer beneficiary bank fields.
 */

const COUNTRIES = [
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' },
];

/** Representative sample from the Bankers Almanac / SWIFT directory */
const SWIFT_DIRECTORY = [
  // United States
  { bic: 'CITIUS33', bankName: 'Citibank N.A.', city: 'New York', countryCode: 'US' },
  { bic: 'CHASUS33', bankName: 'JPMorgan Chase Bank', city: 'New York', countryCode: 'US' },
  { bic: 'BOFAUS3N', bankName: 'Bank of America', city: 'Charlotte', countryCode: 'US' },
  { bic: 'WFBIUS6S', bankName: 'Wells Fargo Bank', city: 'San Francisco', countryCode: 'US' },
  { bic: 'MRMDUS33', bankName: 'Morgan Stanley', city: 'New York', countryCode: 'US' },
  { bic: 'GSCIUS33', bankName: 'Goldman Sachs Bank USA', city: 'New York', countryCode: 'US' },

  // United Kingdom
  { bic: 'BARCGB22', bankName: 'Barclays Bank PLC', city: 'London', countryCode: 'GB' },
  { bic: 'HBUKGB4B', bankName: 'HSBC UK Bank PLC', city: 'London', countryCode: 'GB' },
  { bic: 'LOYDGB2L', bankName: 'Lloyds Bank PLC', city: 'London', countryCode: 'GB' },
  { bic: 'NWBKGB2L', bankName: 'NatWest (National Westminster Bank)', city: 'London', countryCode: 'GB' },
  { bic: 'SCBLGB2L', bankName: 'Standard Chartered Bank', city: 'London', countryCode: 'GB' },
  { bic: 'BUKBGB22', bankName: 'Barclays Bank UK PLC', city: 'London', countryCode: 'GB' },

  // Germany
  { bic: 'DEUTDEFF', bankName: 'Deutsche Bank AG', city: 'Frankfurt', countryCode: 'DE' },
  { bic: 'COBADEFF', bankName: 'Commerzbank AG', city: 'Frankfurt', countryCode: 'DE' },
  { bic: 'DRESDEFF', bankName: 'Dresdner Bank AG', city: 'Frankfurt', countryCode: 'DE' },
  { bic: 'HYVEDEMM', bankName: 'UniCredit Bank (HypoVereinsbank)', city: 'Munich', countryCode: 'DE' },

  // France
  { bic: 'BNPAFRPP', bankName: 'BNP Paribas', city: 'Paris', countryCode: 'FR' },
  { bic: 'SOGEFRPP', bankName: 'Société Générale', city: 'Paris', countryCode: 'FR' },
  { bic: 'CRLYFRPP', bankName: 'Crédit Lyonnais (LCL)', city: 'Paris', countryCode: 'FR' },
  { bic: 'AGRIFRPP', bankName: 'Crédit Agricole', city: 'Paris', countryCode: 'FR' },

  // Switzerland
  { bic: 'UBSWCHZH', bankName: 'UBS AG', city: 'Zurich', countryCode: 'CH' },
  { bic: 'CRESCHZZ', bankName: 'Credit Suisse AG', city: 'Zurich', countryCode: 'CH' },

  // Japan
  { bic: 'BOTKJPJT', bankName: 'MUFG Bank (Bank of Tokyo-Mitsubishi)', city: 'Tokyo', countryCode: 'JP' },
  { bic: 'SMJPJPJT', bankName: 'Sumitomo Mitsui Banking Corporation', city: 'Tokyo', countryCode: 'JP' },
  { bic: 'MIZHKJJT', bankName: 'Mizuho Bank Ltd', city: 'Tokyo', countryCode: 'JP' },

  // China
  { bic: 'BKCHCNBJ', bankName: 'Bank of China', city: 'Beijing', countryCode: 'CN' },
  { bic: 'ICBKCNBJ', bankName: 'Industrial and Commercial Bank of China', city: 'Beijing', countryCode: 'CN' },
  { bic: 'PCBCCNBJ', bankName: 'China Construction Bank', city: 'Beijing', countryCode: 'CN' },

  // India
  { bic: 'SBININBB', bankName: 'State Bank of India', city: 'Mumbai', countryCode: 'IN' },
  { bic: 'HABORINB', bankName: 'HDFC Bank Ltd', city: 'Mumbai', countryCode: 'IN' },
  { bic: 'ABORINBB', bankName: 'Axis Bank Ltd', city: 'Mumbai', countryCode: 'IN' },

  // UAE
  { bic: 'EABORAEA', bankName: 'Emirates NBD', city: 'Dubai', countryCode: 'AE' },
  { bic: 'NBADORAE', bankName: 'Abu Dhabi National Bank (First Abu Dhabi Bank)', city: 'Abu Dhabi', countryCode: 'AE' },

  // Singapore
  { bic: 'DBSSSGSG', bankName: 'DBS Bank Ltd', city: 'Singapore', countryCode: 'SG' },
  { bic: 'OCBCSGSG', bankName: 'OCBC Bank', city: 'Singapore', countryCode: 'SG' },
  { bic: 'UOVBSGSG', bankName: 'United Overseas Bank (UOB)', city: 'Singapore', countryCode: 'SG' },

  // Hong Kong
  { bic: 'HSBCHKHH', bankName: 'HSBC Hong Kong', city: 'Hong Kong', countryCode: 'HK' },
  { bic: 'BOSHKHHX', bankName: 'Bank of China (Hong Kong)', city: 'Hong Kong', countryCode: 'HK' },

  // Australia
  { bic: 'CTBAAU2S', bankName: 'Commonwealth Bank of Australia', city: 'Sydney', countryCode: 'AU' },
  { bic: 'NATAAU33', bankName: 'National Australia Bank', city: 'Melbourne', countryCode: 'AU' },
  { bic: 'ANZBAU3M', bankName: 'ANZ Bank (Australia & New Zealand Banking Group)', city: 'Melbourne', countryCode: 'AU' },

  // South Africa
  { bic: 'SBZAZAJJ', bankName: 'Standard Bank of South Africa', city: 'Johannesburg', countryCode: 'ZA' },
  { bic: 'FIRNZAJJ', bankName: 'First National Bank (FNB South Africa)', city: 'Johannesburg', countryCode: 'ZA' },
  { bic: 'ABSAZAJJ', bankName: 'Absa Bank Ltd', city: 'Johannesburg', countryCode: 'ZA' },
  { bic: 'NEDSZAJJ', bankName: 'Nedbank Ltd', city: 'Johannesburg', countryCode: 'ZA' },

  // Kenya
  { bic: 'ABORKENX', bankName: 'Absa Bank Kenya PLC', city: 'Nairobi', countryCode: 'KE' },
  { bic: 'KCBLKENX', bankName: 'KCB Bank Kenya Ltd', city: 'Nairobi', countryCode: 'KE' },
  { bic: 'EABORKNX', bankName: 'Equity Bank Kenya Ltd', city: 'Nairobi', countryCode: 'KE' },
  { bic: 'COOPKENX', bankName: 'Co-operative Bank of Kenya', city: 'Nairobi', countryCode: 'KE' },
  { bic: 'SCBLKENX', bankName: 'Standard Chartered Bank Kenya', city: 'Nairobi', countryCode: 'KE' },
  { bic: 'DLOOKENX', bankName: 'Diamond Trust Bank Kenya', city: 'Nairobi', countryCode: 'KE' },
  { bic: 'SBICKENX', bankName: 'Stanbic Bank Kenya', city: 'Nairobi', countryCode: 'KE' },
  { bic: 'IMBLKENX', bankName: 'I&M Bank Kenya', city: 'Nairobi', countryCode: 'KE' },
  { bic: 'NCBAKENX', bankName: 'NCBA Bank Kenya', city: 'Nairobi', countryCode: 'KE' },

  // Nigeria
  { bic: 'ABORNGLA', bankName: 'Access Bank PLC', city: 'Lagos', countryCode: 'NG' },
  { bic: 'GTBINGLA', bankName: 'Guaranty Trust Bank (GTBank)', city: 'Lagos', countryCode: 'NG' },
  { bic: 'ZENINILAGOS', bankName: 'Zenith Bank PLC', city: 'Lagos', countryCode: 'NG' },
  { bic: 'FIDTNGLA', bankName: 'Fidelity Bank PLC', city: 'Lagos', countryCode: 'NG' },
  { bic: 'FBNINGLA', bankName: 'First Bank of Nigeria', city: 'Lagos', countryCode: 'NG' },

  // Ghana
  { bic: 'ECABORGH', bankName: 'Ecobank Ghana', city: 'Accra', countryCode: 'GH' },
  { bic: 'GHCBGHAC', bankName: 'GCB Bank Ltd', city: 'Accra', countryCode: 'GH' },
  { bic: 'SCBLGHAC', bankName: 'Standard Chartered Bank Ghana', city: 'Accra', countryCode: 'GH' },

  // Tanzania
  { bic: 'NMIBTZTZ', bankName: 'NMB Bank PLC', city: 'Dar es Salaam', countryCode: 'TZ' },
  { bic: 'CRDBTZTZ', bankName: 'CRDB Bank PLC', city: 'Dar es Salaam', countryCode: 'TZ' },
  { bic: 'SCBLTZTZ', bankName: 'Standard Chartered Bank Tanzania', city: 'Dar es Salaam', countryCode: 'TZ' },

  // Uganda
  { bic: 'SBICUGKX', bankName: 'Stanbic Bank Uganda', city: 'Kampala', countryCode: 'UG' },
  { bic: 'SCBLUGKA', bankName: 'Standard Chartered Bank Uganda', city: 'Kampala', countryCode: 'UG' },
  { bic: 'ABORUGKA', bankName: 'Absa Bank Uganda', city: 'Kampala', countryCode: 'UG' },

  // Rwanda
  { bic: 'BKIGRWRW', bankName: 'Bank of Kigali', city: 'Kigali', countryCode: 'RW' },
  { bic: 'EABORWRW', bankName: 'Equity Bank Rwanda', city: 'Kigali', countryCode: 'RW' },

  // Netherlands
  { bic: 'ABNANL2A', bankName: 'ABN AMRO Bank N.V.', city: 'Amsterdam', countryCode: 'NL' },
  { bic: 'INGBNL2A', bankName: 'ING Bank N.V.', city: 'Amsterdam', countryCode: 'NL' },
  { bic: 'RABONL2U', bankName: 'Rabobank', city: 'Utrecht', countryCode: 'NL' },

  // Canada
  { bic: 'ROYCCAT2', bankName: 'Royal Bank of Canada (RBC)', city: 'Toronto', countryCode: 'CA' },
  { bic: 'TDOMCATT', bankName: 'Toronto-Dominion Bank (TD)', city: 'Toronto', countryCode: 'CA' },
  { bic: 'BNDCCAMM', bankName: 'Bank of Nova Scotia (Scotiabank)', city: 'Toronto', countryCode: 'CA' },

  // Saudi Arabia
  { bic: 'NCBKSAJE', bankName: 'Saudi National Bank (SNB)', city: 'Riyadh', countryCode: 'SA' },
  { bic: 'RIBLSARI', bankName: 'Riyad Bank', city: 'Riyadh', countryCode: 'SA' },

  // Italy
  { bic: 'BCITITMM', bankName: 'Intesa Sanpaolo', city: 'Milan', countryCode: 'IT' },
  { bic: 'UNCRITMM', bankName: 'UniCredit S.p.A.', city: 'Milan', countryCode: 'IT' },

  // Spain
  { bic: 'BSCHESMM', bankName: 'Banco Santander S.A.', city: 'Madrid', countryCode: 'ES' },
  { bic: 'BBVAESMM', bankName: 'BBVA (Banco Bilbao Vizcaya Argentaria)', city: 'Madrid', countryCode: 'ES' },

  // Belgium
  { bic: 'GEBABEBB', bankName: 'BNP Paribas Fortis', city: 'Brussels', countryCode: 'BE' },
  { bic: 'KREDBEBB', bankName: 'KBC Bank N.V.', city: 'Brussels', countryCode: 'BE' },

  // Sweden
  { bic: 'ESSESESS', bankName: 'SEB (Skandinaviska Enskilda Banken)', city: 'Stockholm', countryCode: 'SE' },
  { bic: 'NDEASESS', bankName: 'Nordea Bank Abp (Sweden)', city: 'Stockholm', countryCode: 'SE' },

  // Denmark
  { bic: 'DABADKKK', bankName: 'Danske Bank A/S', city: 'Copenhagen', countryCode: 'DK' },

  // Norway
  { bic: 'DNBANOKKK', bankName: 'DNB Bank ASA', city: 'Oslo', countryCode: 'NO' },

  // Egypt
  { bic: 'NBEGEGCX', bankName: 'National Bank of Egypt', city: 'Cairo', countryCode: 'EG' },
  { bic: 'CBEGEGCX', bankName: 'Commercial International Bank (CIB Egypt)', city: 'Cairo', countryCode: 'EG' },

  // Ethiopia
  { bic: 'CBETETAA', bankName: 'Commercial Bank of Ethiopia', city: 'Addis Ababa', countryCode: 'ET' },
  { bic: 'AABORETAA', bankName: 'Awash Bank', city: 'Addis Ababa', countryCode: 'ET' },

  // Mauritius
  { bic: 'MCBLMUMU', bankName: 'Mauritius Commercial Bank', city: 'Port Louis', countryCode: 'MU' },
  { bic: 'SBICMUMU', bankName: 'SBI (Mauritius) Ltd', city: 'Port Louis', countryCode: 'MU' },

  // Zambia
  { bic: 'ZANMZMLU', bankName: 'Zanaco PLC', city: 'Lusaka', countryCode: 'ZM' },
  { bic: 'SBICZMLU', bankName: 'Stanbic Bank Zambia', city: 'Lusaka', countryCode: 'ZM' },

  // Zimbabwe
  { bic: 'CBZIZWHA', bankName: 'CBZ Bank', city: 'Harare', countryCode: 'ZW' },
  { bic: 'SBICZWHA', bankName: 'Stanbic Bank Zimbabwe', city: 'Harare', countryCode: 'ZW' },
];

/** Search the SWIFT directory by bank name (fuzzy) */
function searchByBankName(query, limit = 8) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return SWIFT_DIRECTORY
    .filter(e => e.bankName.toLowerCase().includes(q) || e.city.toLowerCase().includes(q))
    .slice(0, limit);
}

/** Search the SWIFT directory by BIC code (prefix match) */
function searchByBic(query, limit = 8) {
  if (!query || query.length < 3) return [];
  const q = query.toUpperCase();
  return SWIFT_DIRECTORY
    .filter(e => e.bic.startsWith(q) || e.bic.includes(q))
    .slice(0, limit);
}

/** Get country name from code */
function getCountryName(code) {
  return COUNTRIES.find(c => c.code === code)?.name || code;
}

// Export everything for use in React components
export {
  COUNTRIES,
  SWIFT_DIRECTORY,
  searchByBankName,
  searchByBic,
  getCountryName,
};
