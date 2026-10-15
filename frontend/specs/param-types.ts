import type {
  BusinessType,
  OperationType,
} from '../src/lib/financial-types'

/** Optional inclusive date bounds for API query parameters. */
export interface DateRangeFilter {
  /** Optional start date in `YYYY-MM-DD` format; TypeScript does not validate the format at runtime. */
  start_date?: string
  /** Optional end date in `YYYY-MM-DD` format; TypeScript does not validate the format at runtime. */
  end_date?: string
}

/** Optional query parameters for filtering anomaly alerts. */
export interface AlertsParams extends DateRangeFilter {
  /** Optional non-negative ratio; the API default is `0.3` when omitted. */
  threshold?: number
  /** Optional aggregation interval: `day`, `week`, or `month`; the API default is `month`. */
  group_by?: 'day' | 'week' | 'month'
  /** Optional business line filter: `B2B` or `B2C`. */
  business_type?: BusinessType
}

/** Optional query parameters for retrieving top category totals. */
export interface TopCategoriesParams extends DateRangeFilter {
  /** Optional operation filter: `income` or `outcome`; the API default is `outcome`. */
  operation_type?: OperationType
  /** Optional integer result limit from `1` to `20`; the API default is `5`. */
  limit?: number
  /** Optional business line filter: `B2B` or `B2C`. */
  business_type?: BusinessType
}
