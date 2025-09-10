
export interface Company {
  companyName: string;
  companyUrl: string;
}

export interface CompanyWithAnniversary extends Company {
  anniversary: string;
}
