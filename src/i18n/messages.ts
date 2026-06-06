import type { AbstractIntlMessages } from "next-intl";
import type { Locale } from "./config";

// Shared / common strings (used app-wide).
import shared_en from "./messages/en.json";
import shared_fr from "./messages/fr.json";
import shared_ar from "./messages/ar.json";

// Feature- and page-scoped strings, co-located with their code.
import features_demand_en from "@/features/demand/locales/en.json";
import features_demand_fr from "@/features/demand/locales/fr.json";
import features_demand_ar from "@/features/demand/locales/ar.json";
import features_live_ops_en from "@/features/live-ops/locales/en.json";
import features_live_ops_fr from "@/features/live-ops/locales/fr.json";
import features_live_ops_ar from "@/features/live-ops/locales/ar.json";
import features_verification_en from "@/features/verification/locales/en.json";
import features_verification_fr from "@/features/verification/locales/fr.json";
import features_verification_ar from "@/features/verification/locales/ar.json";
import features_coupons_en from "@/features/coupons/locales/en.json";
import features_coupons_fr from "@/features/coupons/locales/fr.json";
import features_coupons_ar from "@/features/coupons/locales/ar.json";
import features_promotions_en from "@/features/promotions/locales/en.json";
import features_promotions_fr from "@/features/promotions/locales/fr.json";
import features_promotions_ar from "@/features/promotions/locales/ar.json";
import features_news_en from "@/features/news/locales/en.json";
import features_news_fr from "@/features/news/locales/fr.json";
import features_news_ar from "@/features/news/locales/ar.json";
import features_blink_cash_en from "@/features/blink-cash/locales/en.json";
import features_blink_cash_fr from "@/features/blink-cash/locales/fr.json";
import features_blink_cash_ar from "@/features/blink-cash/locales/ar.json";
import features_support_en from "@/features/support/locales/en.json";
import features_support_fr from "@/features/support/locales/fr.json";
import features_support_ar from "@/features/support/locales/ar.json";
import features_notifications_en from "@/features/notifications/locales/en.json";
import features_notifications_fr from "@/features/notifications/locales/fr.json";
import features_notifications_ar from "@/features/notifications/locales/ar.json";
import features_deep_links_en from "@/features/deep-links/locales/en.json";
import features_deep_links_fr from "@/features/deep-links/locales/fr.json";
import features_deep_links_ar from "@/features/deep-links/locales/ar.json";
import features_marketplace_en from "@/features/marketplace/locales/en.json";
import features_marketplace_fr from "@/features/marketplace/locales/fr.json";
import features_marketplace_ar from "@/features/marketplace/locales/ar.json";
import features_library_en from "@/features/library/locales/en.json";
import features_library_fr from "@/features/library/locales/fr.json";
import features_library_ar from "@/features/library/locales/ar.json";
import features_settings_en from "@/features/settings/locales/en.json";
import features_settings_fr from "@/features/settings/locales/fr.json";
import features_settings_ar from "@/features/settings/locales/ar.json";
import features_users_en from "@/features/users/locales/en.json";
import features_users_fr from "@/features/users/locales/fr.json";
import features_users_ar from "@/features/users/locales/ar.json";
import features_overview_en from "@/features/overview/locales/en.json";
import features_overview_fr from "@/features/overview/locales/fr.json";
import features_overview_ar from "@/features/overview/locales/ar.json";
import features_orders_en from "@/features/orders/locales/en.json";
import features_orders_fr from "@/features/orders/locales/fr.json";
import features_orders_ar from "@/features/orders/locales/ar.json";
import features_riders_en from "@/features/riders/locales/en.json";
import features_riders_fr from "@/features/riders/locales/fr.json";
import features_riders_ar from "@/features/riders/locales/ar.json";
import features_trips_en from "@/features/trips/locales/en.json";
import features_trips_fr from "@/features/trips/locales/fr.json";
import features_trips_ar from "@/features/trips/locales/ar.json";
import features_agent_shops_en from "@/features/agent-shops/locales/en.json";
import features_agent_shops_fr from "@/features/agent-shops/locales/fr.json";
import features_agent_shops_ar from "@/features/agent-shops/locales/ar.json";
import features_vehicles_en from "@/features/vehicles/locales/en.json";
import features_vehicles_fr from "@/features/vehicles/locales/fr.json";
import features_vehicles_ar from "@/features/vehicles/locales/ar.json";
import features_access_en from "@/features/access/locales/en.json";
import features_access_fr from "@/features/access/locales/fr.json";
import features_access_ar from "@/features/access/locales/ar.json";

const byLocale: Record<Locale, Record<string, unknown>[]> = {
  en: [shared_en, features_demand_en, features_live_ops_en, features_verification_en, features_coupons_en, features_promotions_en, features_news_en, features_blink_cash_en, features_support_en, features_notifications_en, features_deep_links_en, features_marketplace_en, features_library_en, features_settings_en, features_users_en, features_overview_en, features_orders_en, features_riders_en, features_trips_en, features_agent_shops_en, features_vehicles_en, features_access_en],
  fr: [shared_fr, features_demand_fr, features_live_ops_fr, features_verification_fr, features_coupons_fr, features_promotions_fr, features_news_fr, features_blink_cash_fr, features_support_fr, features_notifications_fr, features_deep_links_fr, features_marketplace_fr, features_library_fr, features_settings_fr, features_users_fr, features_overview_fr, features_orders_fr, features_riders_fr, features_trips_fr, features_agent_shops_fr, features_vehicles_fr, features_access_fr],
  ar: [shared_ar, features_demand_ar, features_live_ops_ar, features_verification_ar, features_coupons_ar, features_promotions_ar, features_news_ar, features_blink_cash_ar, features_support_ar, features_notifications_ar, features_deep_links_ar, features_marketplace_ar, features_library_ar, features_settings_ar, features_users_ar, features_overview_ar, features_orders_ar, features_riders_ar, features_trips_ar, features_agent_shops_ar, features_vehicles_ar, features_access_ar],
};

// Merge every namespace bundle into the flat message object next-intl expects.
export function getAllMessages(locale: Locale): AbstractIntlMessages {
  return Object.assign({}, ...byLocale[locale]) as AbstractIntlMessages;
}
