export interface RuleSource {
  readonly id: string;
  readonly title: string;
  readonly authority: string;
  readonly url: string;
  readonly modules: readonly string[];
  readonly lastReviewed: string;
}

export const RULE_SOURCES: readonly RuleSource[] = Object.freeze([
  { id: 'emirates-id-design', title: 'Emirates ID input pattern', authority: 'UAE Design System', url: 'https://designsystem.gov.ae/docs/patterns/emirates-id-input', modules: ['emirates-id', 'privacy'], lastReviewed: '2026-11-06' },
  { id: 'national-numbering-plan', title: 'National Numbering Plan', authority: 'TDRA', url: 'https://tdra.gov.ae/-/media/About/regulations-and-ruling/EN/National-Number-Plan-pdf.ashx', modules: ['phone', 'administrative'], lastReviewed: '2026-11-06' },
  { id: 'mobile-portability', title: 'Mobile number portability', authority: 'TDRA', url: 'https://tdra.gov.ae/en/consumer-tool-hub/topics/porting-numbers', modules: ['phone'], lastReviewed: '2026-11-06' },
  { id: 'uae-iban', title: 'UAE IBAN standard', authority: 'Central Bank of the UAE', url: 'https://centralbank.ae/en/our-operations/payments-and-settlements/regulations-and-standards/iban/', modules: ['iban', 'privacy'], lastReviewed: '2026-11-06' },
  { id: 'fta-e-invoicing', title: 'UAE e-invoicing', authority: 'Federal Tax Authority', url: 'https://tax.gov.ae/en/content/uae.einvoicing.aspx', modules: ['tax', 'privacy'], lastReviewed: '2026-11-06' },
  { id: 'seven-emirates', title: 'The Seven Emirates', authority: 'Official Portal of the UAE Government', url: 'https://u.ae/about-the-uae/the-seven-emirates', modules: ['administrative', 'address'], lastReviewed: '2026-11-06' },
  { id: 'postal-address', title: 'UAE addressing standard', authority: 'Emirates Post', url: 'https://www.emiratespost.ae/faq', modules: ['address'], lastReviewed: '2026-11-06' },
  { id: 'currency-unit', title: 'Article 52 — Currency Unit', authority: 'Central Bank of the UAE', url: 'https://rulebook.centralbank.ae/en/rulebook/article-52-currency-unit', modules: ['currency'], lastReviewed: '2026-11-06' }
]);

export const getSourcesForModule = (moduleName: string): readonly RuleSource[] => RULE_SOURCES.filter((source) => source.modules.includes(moduleName));
export const getSource = (id: string): RuleSource | null => RULE_SOURCES.find((source) => source.id === id) ?? null;
