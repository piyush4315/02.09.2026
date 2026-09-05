# Plan: publish the add-on to the Google Workspace Marketplace

This is the path to make the ScrapSale Pro editor installable by others from the
Marketplace (instead of pasting the script into each sheet). It is only needed
for **distribution** — for personal/team use, the bound script or a **private
(domain) publish** is enough.

Official source: Google's *Publish an add-on* guide (updated 2026-07-22).

## 0. Decide the audience (this choice is permanent)
| Audience | Who can install | Review? | Best for |
|---|---|---|---|
| **Public** | anyone on the Marketplace | ✅ Google review (1–2+ weeks) | selling / wide distribution |
| **Private (domain)** | users in your Google Workspace domain only | ❌ no review | your team / company |

For a small team, **private (domain) publish** is the sweet spot: zero review,
instant availability. Public publish needs the full consent/review path below.

## 1. Meet the publication requirements
- The add-on must be **finished and tested** (not a work-in-progress), match its
  listing, and use only the scopes it actually needs.
- We already use the **least-privilege** scope (`spreadsheets.currentonly` +
  `script.container.ui`), which is exactly what reviewers look for.

## 2. Verify collaborator access
- You must have **edit access** to the Apps Script project, and be the
  publisher (or same domain as the owner).

## 3. Test as a "developer add-on" first
- In Apps Script: **Deploy → Test deployments → Install**, and share the
  project with testers. See Google's *Test Editor add-ons* guide.

## 4. Create a version (snapshot)
- In Apps Script: **Deploy → Manage deployments**, or use versioning
  (**File → Version history** / `clasp version`).
- **Editor add-ons publish by version number** (Workspace add-ons use a
  deployment ID) — record the version number for the SDK step below.

## 5. Create a standard Google Cloud project (required)
The default Apps Script GCP project **cannot** be published. You must:
1. Go to the [Google Cloud console](https://console.developers.google.com/project)
   → **Create Project** (e.g. `scrapsale-pro-addon`).
2. **Switch** the Apps Script project to it:
   Apps Script → **Project Settings → Google Cloud Platform (GCP) Project** →
   enter the new project number.

## 6. OAuth consent screen (public publish only)
1. GCP → **APIs & Services → OAuth consent screen** → **External**.
2. Fill app name, support email, developer contact.
3. **Scopes**: add
   `https://www.googleapis.com/auth/spreadsheets.currentonly` (this is a
   **sensitive** scope → needs verification for public publish) and
   `https://www.googleapis.com/auth/script.container.ui`.
4. **Test users**: add yourself and any testers while the app is in "Testing".

> Note: this add-on's OAuth is **separate** from the dashboard's OAuth Client ID
> (`…-6rgg8ho0…apps.googleusercontent.com`). The dashboard signs in via its own
> Web client; the add-on signs in as the sheet user via Apps Script. Don't mix
> the two consent screens up.

## 7. Configure the Marketplace SDK + listing
1. GCP → **Google Workspace Marketplace SDK** (enable it).
2. **App Configuration** tab: link the Apps Script **version number**
   (Editor add-on), set install/visibility (public or domain).
3. **Store listing** tab (needs): app name, short + full descriptions, icon
   (32×32 + 220×140 px minimums), and at least one **screenshot**
   (1280×800 recommended). These are what users see — they must not be
   placeholders.
4. Add support links, privacy policy URL, and category.

## 8. Publish
- **Private/domain**: publish immediately — no review.
- **Public**: submit → Google's review checks the app (security, scopes,
  listing accuracy). Budget **1–2 weeks**; keep the consent screen consistent
  with the listing or it's rejected.

## Recommended sequence for you
1. Keep the bound-script install (works today, nothing to publish).
2. If you're on **Google Workspace**, do the **private domain publish** — gives
   everyone in your org an install button with zero review.
3. Only if you want external/paid distribution: go **public** and budget for
   OAuth verification + review.

## Cost & timeline
- **Cost**: ₹0 (Google Cloud projects and the Marketplace SDK are free; paid
  listings are optional).
- **Private**: ~1 hour of setup. **Public**: ~1 hour setup + 1–2 weeks review +
  OAuth verification back-and-forth.
