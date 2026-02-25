export enum JobSchedulerTypesEnum {
  DIVISION_CODE = 'division_code',
  STYLE_IDS = 'style_ids',
  TIER_RAWS = 'tier_raws',
  LENDERS = 'lenders',
  MS_LENDERS = 'market_scan_lenders',
  MS_LENDERS_OEM = 'market_scan_lenders_oem',
  LENDERS_MAPPING = 'lenders_mapping',
  RULES_AND_FEES = 'rules_and_fees',
  REBATES = 'rebates',
  REBATES_MAPPING = 'rebates_mapping',
  MS_REBATES = 'market_scan_rebates',
  MS_PROGRAMS = 'market_scan_programs',
  PROGRAMS_MAPPING = 'programs_mapping',
  MS_REBATES_CATEGORIES = 'market_scan_rebates_categories',
  MS_REBATES_VINS = 'market_scan_rebates_vins',
  MS_MAKES = 'makes',
  MS_MODELS = 'models',
  MS_TAXES = 'market_scan_taxes',
  MS_TERMS = 'market_scan_terms',
  MS_MANUFACTURERS = 'market_scan_manufacturers',
  MS_REBATE_DESCRIPTIONS = 'market_scan_rebate_descriptions',
  MS_PART_LABORS = 'market_scan_part_labors',
  MS_MILEAGE_ADJUSTMENTS = 'market_scan_mileage_adjustments',
  MS_VEHICLE_EQUIPMENT_RESIDUALIZABLE = 'market_scan_vehicle_equipment_residualizable',
  MS_BANK_FEE_MARKUPS = 'market_scan_bank_fee_markups',
  MS_CATEGORIES = 'market_scan_categories',
  MS_SUBCATEGORIES = 'market_scan_subcategories',
  MS_SUPER_CATEGORIES = 'market_scan_super_categories',
  MS_VEHICLES = 'market_scan_vehicles',
  VEHICLES = 'vehicles',
  VEHICLES_IN_LD_NOT_IN_ADS = 'vehicles_in_ld_not_in_ads',
  VEHICLES_EMPTY_PRICES = 'vehicles_empty_prices',
  VEHICLES_PRICES = 'vehicles_prices',
  VEHICLES_MAPPING_BETWEEN_MS_AND_ADS = 'vehicles_mapping_between_ms_and_ads',
  INVENTORY_SCOPE = 'inventory_scope',
  INVENTORY = 'inventory',
}

export enum JobSchedulerStatusesEnum {
  RUNNING = 'RUNNING',
  FINISH = 'FINISH',
  FAILED = 'FAILED',
}

export interface JobSchedulerConfig {
  _id: string;
  jobType: JobSchedulerTypesEnum;
  isActive: boolean;
  cron?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobScheduler {
  _id: string;
  name: string;
  cron: string;
  jobType: JobSchedulerTypesEnum;
  status: JobSchedulerStatusesEnum;
  metadata: Record<string, any>;
  endedAt?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetJobsResponse {
  jobs: JobScheduler[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface GetJobsQuery {
  status?: JobSchedulerStatusesEnum;
  jobType?: JobSchedulerTypesEnum;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}
