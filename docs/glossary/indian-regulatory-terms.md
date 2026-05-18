# Indian regulatory & commerce terms

**Audience**: every contributor + coding agents
**Phase**: P0 onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

Regulatory, tax, and payment terms relevant to an Indian e-commerce marketplace.

---

## BIS (Bureau of Indian Standards)

India's national standards body. Certain product categories (electronics, toys, safety equipment) require BIS certification before sale. Vendors must declare BIS compliance for applicable SKUs.

## Carrier aggregator

A service (e.g., Shiprocket, Delhivery) that provides a single API to multiple last-mile carriers (Bluedart, DTDC, Ecom Express, etc.). Enables rate comparison, label generation, and tracking across carriers. See [`ADR-0001`](../adr/0001-india-launch-razorpay-and-carrier-aggregator.md).

## COD (Cash on Delivery)

Payment collected at the time of delivery. Common in Indian e-commerce. Not supported in LotusGift v2 launch (corporate buyers use Razorpay online or PO/credit terms).

## FSSAI

Food Safety and Standards Authority of India. Required licence for vendors selling edible gifts (chocolates, dry fruits, hampers). Licence number must be displayed on product listing.

## GST (Goods and Services Tax)

India's unified indirect tax. Applies to all marketplace transactions. LotusGift collects GST at applicable rate (5% / 12% / 18% / 28% depending on HSN code) and remits as TCS (Tax Collected at Source) to the government.

## GSTIN

GST Identification Number — 15-character alphanumeric code assigned to GST-registered businesses. Required from all vendors during KYC onboarding.

## HSN (Harmonized System of Nomenclature)

Product classification code used by Indian customs and GST system. Each product variant must have an HSN code to determine the applicable GST rate. Managed in `services/tax-service`.

## KYC (Know Your Customer)

Vendor identity verification during onboarding: PAN card, GSTIN, bank account proof, address proof. Managed by `services/vendor-service`. Documents stored encrypted in R2.

## MSG91

Indian CPaaS (Communications Platform as a Service) provider for SMS and WhatsApp Business messaging. Used by `services/notification-service` for order updates, OTPs, and delivery notifications.

## NPCI (National Payments Corporation of India)

The entity that operates UPI, IMPS, and other payment rails. Razorpay connects to NPCI for UPI transactions.

## PAN (Permanent Account Number)

10-character alphanumeric tax identification number issued by the Income Tax Department. Required from all vendors for TDS/TCS compliance.

## PCI-DSS

Payment Card Industry Data Security Standard. LotusGift never stores raw card data — Razorpay handles PCI compliance as the payment gateway. We only store tokenized references.

## PO (Purchase Order)

A formal buyer document authorizing a purchase, common in B2B/corporate transactions. LotusGift supports PO-based payment for approved corporate buyers with credit terms.

## Razorpay

Indian payment gateway supporting UPI, credit/debit cards, netbanking, wallets, and EMI. The primary payment processor for LotusGift. See [`ADR-0001`](../adr/0001-india-launch-razorpay-and-carrier-aggregator.md).

## RBI (Reserve Bank of India)

India's central bank. Regulates payment aggregators, mandates KYC for financial instruments, and sets rules for recurring payments and refund timelines.

## TCS (Tax Collected at Source)

Under Section 52 of CGST Act, e-commerce operators must collect TCS at 1% (0.5% CGST + 0.5% SGST) on net taxable supplies. LotusGift must file TCS returns monthly.

## TDS (Tax Deducted at Source)

Tax withheld from vendor payouts above threshold limits. LotusGift deducts TDS from vendor settlements per Income Tax Act Section 194-O.

## UPI (Unified Payments Interface)

India's real-time payment system operated by NPCI. Most popular digital payment method. Supported via Razorpay integration.
