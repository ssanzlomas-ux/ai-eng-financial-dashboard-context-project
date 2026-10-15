import type {
  BusinessType,
  Category,
  OperationType,
} from '../src/lib/financial-types'

export interface FacetsResponse {
  /** Operation types available in the complete dataset: `income` or `outcome`. */
  operation_types: OperationType[]
  /** Business lines available in the complete dataset: `B2B` or `B2C`. */
  business_types: BusinessType[]
  /** Categories available in the complete dataset. */
  categories: Category[]
  /** Earliest available movement date, formatted as `YYYY-MM-DD`. */
  min_date: string
  /** Latest available movement date, formatted as `YYYY-MM-DD`. */
  max_date: string
}

export interface AlertEntry {
  /** Period key: `YYYY-MM-DD` for day, `YYYY-Www` for week, or `YYYY-MM` for month. */
  period: string
  /** Total outcome amount recorded for this period. */
  outcome_total: number
  /** Current API baseline: mean of all earlier periods present after date filtering. */
  baseline_average: number
  /** Relative increase over the baseline as a ratio; for example, `0.3` means 30%. */
  increase_ratio: number
}

/** Alerts returned for the requested threshold, grouping, and optional filters. */
export type AlertsResponse = AlertEntry[]

export interface CategoryEntry {
  /** Category identifier from the API category enum. */
  category: Category
  /** Operation represented by the category total: `income` or `outcome`. */
  operation_type: OperationType
  /** Sum of amounts for this category and operation, rounded to two decimals. */
  total_amount: number
}

/** Categories ordered by total amount; the response may contain fewer than the requested limit. */
export type TopCategoriesResponse = CategoryEntry[]
