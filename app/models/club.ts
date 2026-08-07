export interface Club {
  external_id: string;
  clubname: string;
  clubnr: string;
  organization_id: number;
  organization_name: string;
  organization_short: string;
}

export interface ClubsResponse {
  results: Club[];
  total_count: number;
  pages_count: number;
  page: number;
  pagesize: number;
}
