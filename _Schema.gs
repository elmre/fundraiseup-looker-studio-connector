/**
 * Schema definition for FundraiseUp donations data.
 * Supports 100+ fields declared in FundraiseUp API documentation.
 * @see https://api.fundraiseup.com/v1/docs/#/operations/GetDonations
 */

const DONATION_SCHEMA = [
  // Core fields
  {name: 'id', label: 'Donation ID', description: 'Unique identifier for the object.', dataType: 'STRING', isDefault: true, semantics: {conceptType: 'DIMENSION'}},
  {name: 'created_at', label: 'Created At', description: 'The time at which the object was created.', dataType: 'STRING', semantics: {conceptType: 'DIMENSION', 'semanticGroup': 'DATETIME', semanticType: 'YEAR_MONTH_DAY_SECOND'}},
  {name: 'comment', label: 'Comment', description: 'Optional comment provided by the supporter at the time of donation.', group: '', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'receipt_id', label: 'Receipt ID', description: 'Unique identifier for the donation receipt.', group: '', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},

  // Account
  {name: 'account_id', label: 'Account ID', description: 'Unique organization ID.', group: 'Account', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'account_code', label: 'Account Code', description: 'Organization code.', group: 'Account', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'account_name', label: 'Account Name', description: 'Organization name.', group: 'Account', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},

  // Status
  {name: 'anonymous', label: 'Anonymous', description: 'Indicates if the donation was made anonymously.', dataType: 'BOOLEAN', semantics: {conceptType: 'DIMENSION'}},
  {name: 'livemode', label: 'Livemode', description: 'Test mode indicator. true for live mode donations, false for test mode donations.', dataType: 'BOOLEAN', semantics: {conceptType: 'DIMENSION'}},
  {name: 'status', label: 'Status', description: 'Can be: succeeded, scheduled, pending, retrying, refunded, or failed.', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},

  // Amount
  {name: 'amount', label: 'Amount', description: 'Donation amount in the transaction currency.', dataType: 'NUMBER', semantics: {conceptType: 'METRIC', semanticGroup: 'CURRENCY'}},
  {name: 'amount_in_default_currency', label: 'Amount In Default Currency', description: 'Donation amount converted to the organization\'s default currency.', dataType: 'NUMBER', semantics: {conceptType: 'METRIC', semanticGroup: 'CURRENCY'}},
  {name: 'amount_before_fees_covered', label: 'Amount Before Fees Covered', description: 'Amount before fees were covered by supporter.', dataType: 'NUMBER', semantics: {conceptType: 'METRIC', semanticGroup: 'CURRENCY'}},
  {name: 'amount_before_fees_covered_in_default_currency', label: 'Amount Before Fees Covered In Default Currency', description: 'Donation amount before any fees were covered by the supporter in organization\'s default currency.', dataType: 'NUMBER', semantics: {conceptType: 'METRIC', semanticGroup: 'CURRENCY'}},

  // Benefit
  {name: 'benefit_state', label: 'Benefit State', description: 'Benefit state. Can be: not_shown, shown_not_selected, or selected.', group: 'Benefit', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},

  // Campaign
  {name: 'campaign_id', label: 'Campaign ID', description: 'Unique campaign identifier.', group: 'Campaign', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'campaign_code', label: 'Campaign Code', description: 'Campaign Code', group: 'Campaign', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'campaign_name', label: 'Campaign Name', description: 'Campaign Name', group: 'Campaign', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},

  // Consent
  {name: 'consent_general', label: 'Consent General', description: 'General communication consent. Can be: opted_in, opted_out, or not_shown.', group: 'Consent', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'consent_customized_email', label: 'Consent Email', description: 'Email communication consent.', group: 'Consent', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'consent_customized_phone_calls', label: 'Consent Phone Calls', description: 'Phone calls communication consent.', group: 'Consent', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'consent_customized_postal_mail', label: 'Consent Postal Mail', description: 'Postal mail communication consent.', group: 'Consent', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'consent_customized_sms', label: 'Consent SMS', description: 'SMS communication consent.', group: 'Consent', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'consent_customized_social_media', label: 'Consent Social Media', description: 'Social media communication consent.', group: 'Consent', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},

  // Designation
  {name: 'designation_id', label: 'Designation', description: 'Unique designation identifier.', group: 'Designation', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'designation_code', label: 'Designation Code', description: '', group: 'Designation', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'designation_name', label: 'Designation Name', description: '', group: 'Designation', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},

  // Element
  {name: 'element_id', label: 'Element ID', description: 'Unique element identifier.', group: 'Element', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'element_type', label: 'Element Type', description: 'Element type. Example: donationForm', group: 'Element', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'element_name', label: 'Element Name', description: '', group: 'Element', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},

  // Currency & Installment
  {name: 'currency', label: 'Currency', description: 'Three-letter ISO currency code, lowercase.', group: '', dataType: 'STRING', semantics: {semanticType: 'TEXT'}},
  {name: 'installment', label: 'Installment', description: 'null for one-time donations. 1+ for donations with recurring plan.', group: 'Recurring Plan', dataType: 'NUMBER', semantics: {conceptType: 'METRIC'}},

  // Recurring Plan
  {name: 'recurring_plan_id', label: 'Recurring Plan ID', description: 'Unique recurring identifier.', group: 'Recurring Plan', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'recurring_plan_status', label: 'Recurring Plan Status', description: 'Can be: active, scheduled, paused, retrying, completed, failed, or canceled', group: 'Recurring Plan', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'recurring_plan_frequency', label: 'Recurring Plan Frequency', description: 'Can be: daily, weekly, biweekly, every4weeks, monthly, bimonthly, quarterly, semiannual, or annual', group: 'Recurring Plan', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'recurring_plan_created_at', label: 'Recurring Plan Created At', description: 'Timestamp when the recurring plan was created.', group: 'Recurring Plan', dataType: 'STRING', semantics: {'semanticGroup': 'DATETIME', semanticType: 'YEAR_MONTH_DAY_SECOND'}},
  {name: 'recurring_plan_ended_at', label: 'Recurring Plan Ended at', description: 'Date on which the recurring plan ended.', group: 'Recurring Plan', dataType: 'STRING', semantics: {'semanticGroup': 'DATETIME', semanticType: 'YEAR_MONTH_DAY_SECOND'}},
  {name: 'next_installment_at', label: 'Next Installment at', description: 'Timestamp of the next installment.', group: 'Recurring Plan', dataType: 'STRING', semantics: {'semanticGroup': 'DATETIME', semanticType: 'YEAR_MONTH_DAY_SECOND'}},

  // Timestamps
  {name: 'succeeded_at', label: 'Succeeded at', description: 'The time at which the donation succeeded.', group: '', dataType: 'STRING', semantics: {'semanticGroup': 'DATETIME', semanticType: 'YEAR_MONTH_DAY_SECOND'}},
  {name: 'refunded_at', label: 'Refunded at', description: 'The time at which the donation was refunded.', group: '', dataType: 'STRING', semantics: {'semanticGroup': 'DATETIME', semanticType: 'YEAR_MONTH_DAY_SECOND'}},
  {name: 'failed_at', label: 'Failed at', description: 'The time at which the donation failed.', group: '', dataType: 'STRING', semantics: {'semanticGroup': 'DATETIME', semanticType: 'YEAR_MONTH_DAY_SECOND'}},

  // Fundraiser
  {name: 'fundraiser_id', label: 'Fundraiser ID', description: 'Unique fundraiser ID.', group: 'Fundraiser', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'fundraiser_name', label: 'Fundraiser Name', description: 'Fundraiser name', group: 'Fundraiser', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'on_behalf_of', label: 'On Behalf Of', description: 'Name of the organization the donation was made on behalf of.', group: '', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},

  // Gift Aid (UK only)
  {name: 'gift_aid_claimed', label: 'Gift Aid Claimed', description: 'Indicates if Gift Aid was claimed (UK only).', group: 'Gift Aid', dataType: 'BOOLEAN', semantics: {conceptType: 'DIMENSION'}},
  {name: 'gift_aid_legal_text', label: 'Gift Aid Legal Text', description: 'Gift Aid legal text shown to donor.', group: 'Gift Aid', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},

  // Platform Fee
  {name: 'platform_fee_amount', label: 'Platform Fee Amount', description: 'Amount in donation currency', group: 'Platform Fee', dataType: 'NUMBER', semantics: {'semanticGroup': 'CURRENCY'}},
  {name: 'platform_fee_amount_in_default_currency', label: 'Platform Fee Amount in Default Currency', description: 'Amount in organization\'s default currency, at donation time', group: 'Platform Fee', dataType: 'NUMBER', semantics: {'semanticGroup': 'CURRENCY'}},
  {name: 'platform_fee_currency', label: 'Platform Fee Currency', description: 'Three-letter ISO currency code, lowercase', group: 'Platform Fee', dataType: 'STRING', semantics: {'semanticGroup': 'CURRENCY'}},

  // Processing Fee
  {name: 'processing_fee_amount', label: 'Processing Fee Amount', description: 'Amount in donation currency', group: 'Processing Fee', dataType: 'NUMBER', semantics: {'semanticGroup': 'CURRENCY'}},
  {name: 'processing_fee_amount_in_default_currency', label: 'Processing Fee in Default Currency', description: 'Amount in organization\'s default currency, at donation time', group: 'Processing Fee', dataType: 'NUMBER', semantics: {'semanticGroup': 'CURRENCY'}},
  {name: 'processing_fee_currency', label: 'Processing Fee Currency', description: 'Three-letter ISO currency code, lowercase', group: 'Processing Fee', dataType: 'STRING'},

  // Payment
  {name: 'payment_id', label: 'Payment ID', description: 'For PayPal: Capture ID. For Stripe: Charge ID or Payment Intent ID. For other processors: payment ID.', group: 'Payment', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'payment_email', label: 'Payment Email', description: 'Email from payment method. Example: PayPal email.', group: 'Payment', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'payment_error_message', label: 'Payment Error Message', description: 'Returns the latest payment error message only if the status is failed or retrying. Otherwise, returns null.', group: 'Payment', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'payment_method', label: 'Payment Method', description: 'Payment method, in lowercase underscore. Examples: ach, apple_pay, google_pay, click_to_pay, paypal, venmo, becs_direct_debit, bacs_direct_debit, credit_card, pad, sepa_direct_debit, ideal, crypto, stock', group: 'Payment', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'payment_processor', label: 'Payment Processor', description: 'Payment processor, in lowercase. Examples: stripe, paypal, gemini, manual_brokerage, coinbase_commerce (deprecated)', group: 'Payment', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'payment_bank_account_last4', label: 'Payment Bank Account Last 4', description: 'Last four digits of the bank account number.', group: 'Payment', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'payment_credit_card_type', label: 'Payment CC Type', description: 'Credit card type. Example: visa, mastercard', group: 'Payment', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'payment_credit_card_exp_month', label: 'Payment CC Exp Month', description: 'Two-symbol string. Examples: 01, 12', group: 'Payment', dataType: 'STRING', semantics: {'semanticGroup': 'DATETIME', semanticType: 'MONTH'}},
  {name: 'payment_credit_card_exp_year', label: 'Payment CC Exp Year', description: 'Four-symbol string. Example: 2024', group: 'Payment', dataType: 'STRING', semantics: {'semanticGroup': 'DATETIME', semanticType: 'YEAR'}},
  {name: 'payment_credit_card_last4', label: 'Payment CC Last 4', description: 'Last four digits of the credit card number.', group: 'Payment', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},

  // Payout
  {name: 'payout_amount', label: 'Payout Amount', description: 'Amount in donation\'s currency.', group: 'Payout', dataType: 'NUMBER', semantics: {conceptType: 'METRIC', semanticGroup: 'CURRENCY'}},
  {name: 'payout_amount_in_default_currency', label: 'Payout Amount in Default Currency', description: 'Amount in organization\'s default currency, at donation time.', group: 'Payout', dataType: 'NUMBER', semantics: {conceptType: 'METRIC', semanticGroup: 'CURRENCY'}},
  {name: 'payout_currency', label: 'Payout Currency', description: 'Three-letter ISO currency code, lowercase', group: 'Payout', dataType: 'STRING'},

  // Supporter
  {name: 'supporter_id', label: 'Supporter ID', description: 'Unique supporter ID', group: 'Supporter', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'supporter_email', label: 'Supporter Email', description: '', group: 'Supporter', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'supporter_first_name', label: 'Supporter First Name', description: '', group: 'Supporter', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'supporter_last_name', label: 'Supporter Last Name', description: '', group: 'Supporter', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'supporter_title', label: 'Supporter Title', description: 'Returns null if the title is empty. Title options include values like mr, mrs, etc', group: 'Supporter', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'supporter_phone', label: 'Supporter Phone', description: '', group: 'Supporter', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'supporter_language', label: 'Supporter Language', description: 'Supporter language. Example: en-CA', group: 'Supporter', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'supporter_employer_name', label: 'Supporter Employer Name', description: '', group: 'Supporter', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'supporter_address_country', label: 'Supporter Address Country', description: 'Two-letter country code, lowercase.', group: 'Supporter', dataType: 'STRING', semantics: {'semanticGroup': 'GEO', semanticType: 'COUNTRY_CODE'}},
  {name: 'supporter_address_region', label: 'Supporter Address Region', description: '', group: 'Supporter', dataType: 'STRING', semantics: {'semanticGroup': 'GEO', semanticType: 'REGION_CODE'}},
  {name: 'supporter_address_city', label: 'Supporter Address City', description: '', group: 'Supporter', dataType: 'STRING', semantics: {'semanticGroup': 'GEO', semanticType: 'CITY'}},
  {name: 'supporter_address_line1', label: 'Supporter Address Line1', description: '', group: 'Supporter', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'supporter_address_line2', label: 'Supporter Address Line2', description: '', group: 'Supporter', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'supporter_address_postal_code', label: 'Supporter Address Postal Code', description: 'Postal/ZIP code', group: 'Supporter', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'supporter_covered_fee', label: 'Supporter Covered Fee', description: 'Amount of fees covered by the supporter.', group: 'Supporter', dataType: 'NUMBER', semantics: {conceptType: 'METRIC', semanticGroup: 'CURRENCY'}},
  {name: 'supporter_covered_fee_in_default_currency', label: 'Supporter Covered Fee in Default Currency', description: 'Amount of fees covered by the supporter in organization\'s default currency.', group: 'Supporter', dataType: 'NUMBER', semantics: {conceptType: 'METRIC', semanticGroup: 'CURRENCY'}},

  // Source
  {name: 'source', label: 'Source', description: 'Can be: website, campaign_page, virtual_terminal, donor_portal, dashboard, recurring_migration, api, giving_cart', group: '', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},

  // Tribute
  {name: 'tribute_id', label: 'Tribute ID', description: '', group: 'Tribute', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'tribute_type', label: 'Tribute Type', description: 'Can be: in_honor or in_memory', group: 'Tribute', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'tribute_honoree', label: 'Tribute Honoree', description: '', group: 'Tribute', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'tribute_sharing_type', label: 'Tribute Sharing Type', description: 'Sharing destination field name. Can be: email or address', group: 'Tribute', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'tribute_sharing_from', label: 'Tribute Sharing From', description: '', group: 'Tribute', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'tribute_sharing_message', label: 'Tribute Sharing Message', description: '', group: 'Tribute', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'tribute_sharing_recipient_email', label: 'Tribute Sharing Recipient Email', description: 'Email address for the email sharing type.', group: 'Tribute', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'tribute_sharing_recipient_address_country', label: 'Tribute Sharing Recipient Address Country', description: 'Two-letter country code, lowercase.', group: 'Tribute', dataType: 'STRING', semantics: {'semanticGroup': 'GEO', semanticType: 'COUNTRY'}},
  {name: 'tribute_sharing_recipient_address_region', label: 'Tribute Sharing Recipient Address Region', description: 'Region/state/province.', group: 'Tribute', dataType: 'STRING', semantics: {'semanticGroup': 'GEO', semanticType: 'REGION_CODE'}},
  {name: 'tribute_sharing_recipient_address_city', label: 'Tribute Sharing Recipient Address City', description: '', group: 'Tribute', dataType: 'STRING', semantics: {'semanticGroup': 'GEO', semanticType: 'CITY'}},
  {name: 'tribute_sharing_recipient_address_line1', label: 'Tribute Sharing Recipient Address Line1', description: '', group: 'Tribute', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'tribute_sharing_recipient_address_line2', label: 'Tribute Sharing Recipient Address Line2', description: '', group: 'Tribute', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'tribute_sharing_recipient_address_postal_code', label: 'Tribute Sharing Recipient Address Postal Code', description: '', group: 'Tribute', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'tribute_sharing_recipient_title', label: 'Tribute Sharing Recipient Title', description: '', group: 'Tribute', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'tribute_sharing_recipient_first_name', label: 'Tribute Sharing Recipient First Name', description: '', group: 'Tribute', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'tribute_sharing_recipient_last_name', label: 'Tribute Sharing Recipient Last Name', description: '', group: 'Tribute', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},

  // Device
  {name: 'device_browser', label: 'Device Browser', description: '', group: 'Device', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'device_os', label: 'Device OS', description: '', group: 'Device', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'device_type', label: 'Device Type', description: '', group: 'Device', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'device_user_agent', label: 'Device User Agent', description: 'Full user agent string.', group: 'Device', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'device_ip_address', label: 'Device IP', description: '', group: 'Device', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'device_ip_country_name', label: 'Device Country', description: '', group: 'Device', dataType: 'STRING', semantics: {'semanticGroup': 'GEO', semanticType: 'COUNTRY'}},
  {name: 'device_ip_region', label: 'Device Region', description: '', group: 'Device', dataType: 'STRING', semantics: {'semanticGroup': 'GEO', semanticType: 'REGION'}},
  {name: 'device_ip_city', label: 'Device City', description: '', group: 'Device', dataType: 'STRING', semantics: {'semanticGroup': 'GEO', semanticType: 'CITY'}},

  // UTM
  {name: 'utm_source', label: 'UTM Source', description: '', group: 'UTM', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'utm_campaign', label: 'UTM Campaign', description: '', group: 'UTM', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'utm_content', label: 'UTM Content', description: '', group: 'UTM', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'utm_medium', label: 'UTM Medium', description: '', group: 'UTM', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},
  {name: 'utm_term', label: 'UTM Term', description: '', group: 'UTM', dataType: 'STRING', semantics: {conceptType: 'DIMENSION'}},

  // URL
  {name: 'url', label: 'URL', description: 'URL from which the donation was made.', group: '', dataType: 'STRING', semantics: {semanticType: 'URL'}},

  // Custom calculated fields
  {name: 'frequency', label: 'Frequency', description: 'Can be: One-time, Recurring, First installment', group: '', dataType: 'NUMBER', formula: 'CASE WHEN installment IS NULL THEN "One-time" WHEN installment >= 1 THEN "Recurring" WHEN installment = 1 THEN "First installment" WHEN recurring_plan_frequency = "daily" THEN "Daily" WHEN recurring_plan_frequency = "weekly" THEN "Weekly" WHEN recurring_plan_frequency = "biweekly" THEN "Biweekly" WHEN recurring_plan_frequency = "every4weeks" THEN "Every 4 weeks" WHEN recurring_plan_frequency = "monthly" THEN "Monthly" WHEN recurring_plan_frequency = "bimonthly" THEN "Bimonthly" WHEN recurring_plan_frequency = "quarterly" THEN "Quarterly" WHEN recurring_plan_frequency = "semiannual" THEN "Semiannually" WHEN recurring_plan_frequency = "annual" THEN "Annually" END'},
  {name: 'device_type_mobile', label: 'Device Type Mobile', description: '', group: '', dataType: 'NUMBER', formula: 'CASE WHEN device_type = "mobile" THEN 1 ELSE 0 END', spreadsheet_formula: '=SWITCH(${device_type}, "mobile", 1, 0)'},
];

/**
 * Get a copy of the schema array.
 * Returns a new array to prevent mutations of the original schema.
 * @returns {Array} Copy of the donation schema
 */
function getSchemaDefinition() {
  return DONATION_SCHEMA.slice();
}

