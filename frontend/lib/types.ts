// ============================================================
// TheBudBoard — Shared Types
// ============================================================

export type StrainType = 'Indica' | 'Sativa' | 'Hybrid' | 'Unknown';
export type WeightKey  = '1' | '3.5' | '7' | '14' | '28';
export type CategoryKey = 'cheapest' | 'budget20' | 'highestThc';

export interface Deal {
  id:             string;
  name:           string;       // product name / strain
  strain:         StrainType;
  thc:            number;
  price:          number;
  pricePerGram:   number;
  dispensary:     string;
  address:        string;
  terp:           string;
  effect:         string;
  imageUrl?:      string;
  productUrl?:    string;
}

export interface DealsForWeight {
  cheapest:   Deal;
  budget20:   Deal;
  highestThc: Deal;
}

export interface DealsResponse {
  deals:       Record<WeightKey, DealsForWeight>;
  lastUpdated: string;            // ISO timestamp of most recent scrape
  dispensaries: string[];         // names shown in header
  error?:      string;
}

export interface NotifyRequest {
  dealId:      string;
  contactType: 'text' | 'email';
  contact:     string;
  productName: string;
  dispensary:  string;
}
