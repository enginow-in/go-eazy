# Go Eazy — Repository Audit: Input Validation & Async Error Handling

**Audit date:** 2026-07-09
**Scope:** React + Vite + Redux frontend, Supabase Edge Functions (Deno), and the client-side async logic that ties them together
**Auditor:** Claude Code (Opus 4.8)
**Branch at time of audit:** `feature/login-page`

---

## Why this report exists

Go Eazy connects people looking for housing and services with the people who provide them — a student hunting for a hostel near campus, a landlord listing a flat for the first time, a tenant paying a small fee to unlock contact details, a service provider uploading verification documents. Each of those moments depends on the code in this repository doing what it should, and failing in a kind, recoverable way when it can't.

This audit went looking for the places where that trust can break down silently: where a request fails but the UI keeps smiling as if everything is fine, where data can slip into the database in a shape nobody expected, and where someone using the app can be left staring at a spinner or a message that doesn't match what actually happened.

---

## How we looked (methodology)

We reviewed the Supabase Edge Functions, the Redux store slices, the custom hooks (`useAuth`, `useProperties`, `useServices`), and the pages and components that perform async work — auth, the listing forms, the payment flows, the detail pages, settings, and search. Findings are grouped by the kind of harm they do: data integrity, security and information disclosure, hung UI states, and missing feedback to the user.

---

## How to read the severity levels

| Level | What it means |
|-------|---------------|
| **Critical** | Data corruption, information disclosure, or an app hang a normal user can trigger — the things with a direct, real-world cost. |
| **High** | A silent failure that leaves someone in a broken or incorrect state with no feedback. |
| **Medium** | A validation gap that lets malformed data through, but is contained by row-level security or database types. |
| **Low** | Hardening and edge cases — good to fix, not urgent. |

---

## What's already in good shape

Before the findings, it's worth saying what's working. The auth flow, the row-level-security posture, the Razorpay property-payment path with server-side verification, the favorites and recently-viewed features, and the i18n setup are all real engineering that hold up across the codebase. This report doesn't enumerate those — audits rarely do — but the issues below sit on top of a foundation that is mostly solid. Two of the high-severity items (H2 and H5) were also resolved as part of this pass, and that is noted inline where they appear.

---

## Critical

### C1. Unvalidated `property_data` is inserted straight from the client (server-side)

- **File:** `supabase/functions/verify-listing-payment/index.ts`
- **Lines:** 122–136 (insert), line 133 (error leak)
- **What's wrong:** The handler inserts `{ ...property_data, landlord_id: user.id }` directly from the client payload, with no whitelist and no validation. Whatever keys a client sends land in the database — including ones that don't belong, missing required fields, and out-of-range values. On top of that, line 133 returns `'Failed to create listing: ' + insertError.message`, which hands raw Postgres errors (column names, constraint names, schema hints) straight back to the caller.
- **Who it hurts:** A landlord on a flaky connection submits a listing and the price field doesn't make it through; the insert fails, and the message they get back is a Postgres leak rather than a helpful sentence. In a worse case, malformed values persist and resurface later to tenants browsing the marketplace.
- **How to fix:** Whitelist the allowed keys (`title`, `price`, `city`, `area`, `pincode`, `type`, `description`, `amenities`, `images`, `availability`, `nearby_landmarks`, `exact_location`, `contact_phone`, `contact_email`, `latitude`, `longitude`, `map_address`). Validate that `price` is a finite positive number and that `images` is an array of 1–3 strings. Return a generic `'Failed to create listing'` to the client and log `insertError.message` server-side only.

### C2. `createService` swallows three distinct failures as "success" (data integrity)

- **File:** `src/hooks/useServices.js`
- **Lines:** 159–238 (whole function); specifically 190, 222, 234
- **What's wrong:** Three sub-operations can fail silently while the function still returns `provider` as if everything succeeded:
  1. **Document uploads (line 190):** `if (!uploadError) {…}` has no `else` — a failed upload simply vanishes. Documents are required for verification, yet a dropped upload sends the listing to "pending verification" with no documents attached.
  2. **Service-items insert (line 222):** `if (itemsError) console.error(itemsError)` then falls through.
  3. **Plans insert (line 234):** the same pattern, then `return provider`.
- **Who it hurts:** A provider lists a service after spending time on the form. A momentary network blip during the items or plans insert — or an RLS rejection — produces a provider row with zero items and zero plans, while `ServiceNew.jsx` toasts "Service listing created! Pending verification." The provider later appears in the marketplace, effectively empty, and can't understand why nobody contacts them.
- **How to fix:** `throw` on each sub-step failure, or accumulate a `partialFailures` array and surface an explicit "created with these issues" state. Alternatively, roll back the `service_providers` insert when a critical sub-step fails.

### C3. `getSession().then()` has no `.catch()` — the app initializer can hang forever

- **File:** `src/hooks/useAuth.js`
- **Lines:** 12–19
- **What's wrong:** If `supabase.auth.getSession()` rejects (a transient network blip, a Deno runtime hiccup), the promise rejects unhandled. `dispatch(setUser(...))` and `dispatch(setLoading(false))` — the implicit else on line 18 — never run, so `auth.loading` stays `true` forever.
- **Who it hurts:** Someone opens the app on patchy mobile data; the session check fails; the global `AppInitializer` / `ProtectedRoute` that gate on `auth.loading` never resolve; the whole app hangs on its bootstrap loader with no way out — no retry, no error screen, just a spinner that never ends.
- **How to fix:** Append `.catch(() => dispatch(setLoading(false)))` (or a dedicated error state) so the app at least renders the auth gate in a known state and the person can retry.

### C4. `signUp` profile upsert error is swallowed — an orphaned account with no role

- **File:** `src/hooks/useAuth.js`
- **Lines:** 128–135
- **What's wrong:** After `supabase.auth.signUp` succeeds, a `.upsert(...)` into `profiles` is awaited with no error handling. If it fails — an RLS restriction, a foreign-key violation, a network drop — the account exists in `auth.users` but has no `profiles` row, so no `role` is ever resolved.
- **Who it hurts:** A landlord signs up and the profile insert fails; `signUp` returns `data` as if it worked; `AuthModal` navigates them to `/landlord`. On the next load, `fetchProfile` finds no profile and attempts an auto-upsert from `user.user_metadata.role` — which is set for email/password signups, but only if the original failure was transient. Persistent failures (an RLS misconfiguration) leave this person role-less across every session, perpetually nudged at a dead dashboard.
- **How to fix:** `const { error: upErr } = await supabase.from('profiles').upsert(...)`; `if (upErr) throw upErr` so `AuthModal`'s catch block fires and shows the failure honestly, instead of navigating into a dead end.

---

## High

### H1. "Unlock contact" for services is unpaid and unguarded

- **File:** `src/pages/ServiceDetail.jsx`
- **Lines:** 120–128 (`handleUnlockContact`)
- **What's wrong:** Unlike the property flow (`PropertyDetail.jsx:204`, which calls `create-razorpay-order` then Razorpay), the service "unlock" just sets `setContactUnlocked(true)` and fetches gated data for any logged-in user, with no payment at all. This makes the property paywall trivially bypassable in spirit — anyone can browse service contacts for free — and it is inconsistent with the rest of the paid-gate model.
- **Who it hurts:** The integrity of the monetization gate: any signed-in user clicks "Unlock" on a service and the contact details load for free, defeating the ₹9 gate for the entire service side of the product.
- **What to do:** Decide whether services are gated. If yes, route through the same Razorpay flow and verify server-side. If no, remove the locked UI entirely so it doesn't imply a paywall that isn't there. (This is also flagged below as an async issue: the `.then(setGatedData)` has no `.catch`.)

### H2. `fetchServiceById` hides the listing when the views-counter RPC throws — Resolved

- **File:** `src/hooks/useServices.js`
- **Lines:** 80–87 (original) — fix applied in `fetchServiceById`
- **What was wrong:** The `await supabase.rpc('increment_service_views', ...)` sat inside the same `try` as the service fetch. The catch block ran `dispatch(setCurrentService(null))` even when the service had been fetched perfectly well.
- **Who it could have hurt:** A seeker opens a service that exists; the listing loads; the views increment fails (the RPC function missing, or rate-limited); the catch wipes the service to `null` and shows "Service Not Found" for a listing that is right there. They leave assuming the provider doesn't exist.
- **What we did:** Removed the `await` so the RPC no longer propagates into the service-fetch try/catch. It is now a fire-and-forget promise with its own `.then(({ error }) => …)` / `.catch` that only `console.warn`s on failure. A views-counter error can no longer null an already-loaded service. Verified: `useServices.js` lints clean and `vite build` passes.

### H3. Site-visit insert failure is silently dropped *after* a successful payment

- **File:** `src/pages/PropertyDetail.jsx`
- **Lines:** 271–282
- **What's wrong:** Inside the Razorpay `handler` — which has already run the successful payment and verification — the `site_visits` insert uses `if (!visitErr)` and silently ignores errors. The success toast only fires when there is no error; on error the user has paid and gets no toast and no visit booking.
- **Who it hurts:** Payment verified, but the site-visit insert hits an RLS or unique-constraint error; the tenant paid ₹9 and was never told the visit request failed. They walk away assuming the visit is booked, and the landlord never hears from them.
- **How to fix:** On `visitErr`, `toast.error('Could not book your visit — contact support')` and/or surface a recovery path. Consider idempotency — re-inserting on retry could duplicate the booking.

### H4. `checkUnlockStatus` ignores the query error and re-prompts payment

- **File:** `src/pages/PropertyDetail.jsx`
- **Lines:** 96–109
- **What's wrong:** `const { data } = await supabase.from('unlocked_properties').select(...).maybeSingle()` does not capture `error`. On error, `data` is `undefined` and is treated as "not unlocked."
- **Who it hurts:** A user who has already paid sees the Unlock button again and is asked to pay a second time until the edge function's 409 `ALREADY_UNLOCKED` short-circuits it (line 222). The gated contact data also never loads on that path — a one-time purchase made to look like it never happened.
- **How to fix:** `const { data, error } = await …`; if `error`, `console.error` and leave `hasUnlocked` as-is rather than assuming `false`. Optionally surface a transient banner.

### H5. `navigator.clipboard` unguarded — a false success toast — Resolved

- **Files:** `src/pages/PropertyDetail.jsx` (`handleShare`), `src/pages/ServiceDetail.jsx` (`handleShare`)
- **What was wrong:** `navigator.clipboard.writeText(window.location.href)` ran unguarded. On insecure contexts or older browsers `navigator.clipboard` is `undefined` and throws a `TypeError`, yet the "Link copied" toast fired regardless.
- **Who it could have hurt:** Someone on an http preview or an older mobile WebView taps Share; nothing is copied, but the UI tells them it was. They move on, assuming the link reached a friend, and it never did.
- **What we did:** `handleShare` is now `async` with feature detection (`navigator?.clipboard?.writeText`) wrapped in `try/catch`. The success toast fires only on a confirmed copy. We added a legacy `document.execCommand('copy')` hidden-textarea fallback for browsers without the async Clipboard API before giving up. On any failure it fires `toast.error('Failed to copy link')` — no more false success. Verified: `vite build` passes.

### H6. Favorites and recently-viewed swallow all errors with zero feedback

- **File:** `src/hooks/useProperties.js`
- **Lines:** 257 (`catch { /* silent */ }`), 281 (`catch {}`)
- **What's wrong:** RLS or network failures silently render favorites and recently-viewed as empty. Someone's saved items appear to vanish with no diagnostic.
- **Who it hurts:** A user who carefully shortlisted three flats opens Favorites after a network drop and sees nothing — no message explaining it's a transient fetch failure, so they reasonably conclude they saved nothing, or worse, that their data is gone.
- **How to fix:** At minimum `console.error`; ideally surface a small banner so the person knows it's a temporary fetch failure, not "you have no favorites."

### H7. `ServiceNew` never validates the two pricing steps — submit with zero items/plans is possible

- **File:** `src/pages/ServiceNew.jsx`
- **Lines:** 114–121 (`validateStep`), 322 (step 3 price), 358 (step 4 plan price), 141–142 (filter-then-submit)
- **What's wrong:** `validateStep` checks steps 0, 1, 2, 6 only. Steps 3 (Services) and 4 (Plans) are unchecked. Prices are `type="number"` inputs but stored as strings (`e.target.value`), so `""` and `"abc"` slip inconsistently through `if (i.price)`. `handleSubmit` filters out empty rows (lines 141–142) but never enforces at least one surviving row.
- **Who it hurts:** A provider advances past steps 3 and 4 with all rows blank; the blanks are filtered out; `validItems` and `validPlans` are both `[]`; `createService` is called with no items and no plans and produces a verified-empty listing (this compounds C2). They've filled a long form and produced nothing searchable.
- **How to fix:** In `validateStep`, for steps 3 and 4 ensure at least one row has a non-empty name and a finite positive `Number(price)`. Coerce prices to numbers before passing them to `createService`.

### H8. `PropertyForm` price has no positivity, range, or bounds check

- **File:** `src/components/property/PropertyForm.jsx`
- **Lines:** 263 (`Number(e.target.value)` coercion), 161 (`validateForm` only checks `!form.price`)
- **What's wrong:** `validateForm` treats any truthy value as valid. `Number("-500")` becomes `-500` (truthy, passes); `Number("1e18")` likewise. There's no `Number.isFinite` or `> 0` guard.
- **Who it hurts:** A landlord types a negative or astronomically huge rent by mistake; it passes client validation and flows into the unvalidated `property_data` of C1's edge function and is persisted. It only gets through because C1 doesn't validate either — two missing checks that were supposed to back each other up.
- **How to fix:** `if (!form.price || !Number.isFinite(form.price) || form.price <= 0) { toast.error('Enter a valid rent'); return false }`.

### H9. `ServiceDetail` review submission shows **two** error toasts (a logic bug)

- **File:** `src/pages/ServiceDetail.jsx`
- **Lines:** 137–138
- **What's wrong:** `if (reviewRating === 0) { toast.error(t('property.sections.yourRating')) || toast.error('Please select a rating'); return }`. `toast.error(...)` returns a falsy toast id, so the `||` always evaluates the right side — two error toasts fire on every empty-rating submission.
- **Who it hurts:** Annoying rather than dangerous, but every rating-less review attempt double-toasts the same complaint, which reads as frantic and unpolished.
- **How to fix:** The intended i18n-fallback pattern is `t('key') || 'fallback'` wrapped around the *string*, with a single `toast.error`: `toast.error(t('property.sections.yourRating') || 'Please select a rating')`.

### H10. Submit-review inline handler loses the actual error message

- **File:** `src/pages/PropertyDetail.jsx`
- **Lines:** 636–648
- **What's wrong:** The inline `onClick` does `catch { toast.error(t('…reviewError')) }` — the `err` is discarded entirely.
- **Who it hurts:** A Supabase RLS rejection, a duplicate-key, or a rate-limit message is replaced with a generic "review error," making it much harder for the person (and for support) to understand what actually went wrong.
- **How to fix:** `catch (err) { toast.error(err.message || t('…reviewError')) }`.

---

## Medium

### M1. Phone and email format aren't validated on listing and settings forms

- **Files:** `src/pages/ServiceNew.jsx:423` (phone, tel), `:424` (email); `src/pages/Settings.jsx:174` (phone), `:39` (profile save)
- **What's wrong:** Contact phone is only checked for `trim()` presence — no length, no `+91…` prefix, no digit check. Neither listing nor settings validates email shape (only `AuthModal` does).
- **Who it hurts:** Garbage like `"phone"` or `"a@b"` is persisted to `contact_phone` / `contact_email` and then shown to users who paid to unlock contact details — a letdown right at the moment of connection.
- **How to fix:** Add a phone regex (e.g. `/^\+?91?[6-9]\d{9}$|^\d{10}$/`) and the same email regex `AuthModal` uses (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`).

### M2. `signInWithPassword` re-auth leaks timing and counts as a real login attempt

- **File:** `src/pages/Settings.jsx`
- **Lines:** 74–81
- **What's wrong:** To "verify current password" before a password change, the code calls `supabase.auth.signInWithPassword({ email, password: currentPassword })`. This is a real sign-in with the same account — it counts toward login-attempt throttling, and on success it refreshes and rotates the session token (a side effect: any other open tab's session changes too).
- **Who it hurts:** An attacker who knows the email can trigger lockouts faster by abusing the settings password-change endpoint, and a user changing their password quietly invalidates other open sessions elsewhere.
- **What to do:** Prefer Supabase's reauthentication path if available, or document the trade-off. At minimum, catch the case where `currentPassword` is empty before calling `signIn`.

### M3. SQL-wildcard characters are unescaped in read filters

- **Files:** `src/hooks/useProperties.js:49` (city `ilike '%'+city+'%'`), `:53` (area fuzzy), `src/hooks/useServices.js:38–40` (state/city/area `ilike`)
- **What's wrong:** User input is interpolated into `ilike` patterns without escaping `%` or `_`. A user typing `%` in the city or area filter turns it into a wildcard match.
- **Who it hurts:** Read-only impact — search returns broader-than-intended results, with no data exposure beyond what they could already fetch. But the results are skewed and pagination `hasMore` math can mislead, so a seeker's filtered search quietly stops meaning what it says.
- **How to fix:** Escape user-supplied `%` to `\%` and `_` to `\_` before concatenation, or switch to `textSearch` / full-text search.

### M4. `OnboardingQuiz` selections are sent to `updateProfile` with no shape validation

- **File:** `src/components/common/OnboardingQuiz.jsx`
- **Lines:** 95–108 (`finishQuiz`), line 98 (`updateProfile({ onboarding_data: selections })`)
- **What's wrong:** `selections.budget` is a whole range object poured into `onboarding_data`; nothing validates that `type` is in `PROPERTY_TYPES` or that `city` is in `CITIES`. A stale `selections` (after the QUIZ_STEPS changed, say) could persist an unrecognized enum.
- **Who it hurts:** Low. The consumer `getRecommendedProperties` (`useProperties.js:290–326`) defensively no-ops on unknown values, so the worst case is "no recommendations" rather than a crash. Still, the schema is unguarded.
- **How to fix:** Validate `selections.type` and `selections.city` against the enum arrays before saving.

### M5. Service-items/plans `unit` is a free-form select but not constrained server-side

- **File:** `src/pages/ServiceNew.jsx:327`
- **What's wrong:** The `<select>` for `unit` offers 6 values but the value is just a string sent to the DB; nothing server-side rejects `"per parsec"`.
- **Who it hurts:** Mostly cosmetic today, but it leaves the door open to inconsistent units in the marketplace and undermines the idea that the select's options are the real contract.
- **How to fix:** Enforce an enum server-side (a DB check constraint), or at minimum validate it client-side before send, alongside H7.

---

## Low

### L1. `signOut` has no try/catch — a throw skips `dispatch(logout())`

- **File:** `src/hooks/useAuth.js`
- **Lines:** 165–168
- **What's wrong:** If `supabase.auth.signOut()` rejects, `dispatch(logout())` is skipped and stale session state remains.
- **Who it hurts:** Someone who taps "Sign out" on a flaky connection may be left appearing logged in even though they wanted out — a small but real loss of control over their own session.
- **How to fix:** Wrap in `try/catch`; always `dispatch(logout())` in `finally`.

### L2. `PropertyEdit` `.then()` with no `.catch()`

- **File:** `src/pages/PropertyEdit.jsx`
- **Lines:** 13–15
- **What's wrong:** `fetchPropertyById(id).then(() => setLoading(false))` has no catch. Today this is safe because `fetchPropertyById` catches internally and never rejects, but a future rethrow (or schema change) would strand the page on the loader.
- **Who it hurts:** Latent — a landlord editing a listing could end up stuck on a loading spinner if the internal catch is ever removed.
- **How to fix:** Add `.catch(() => setLoading(false))` as a safety net.

### L3. `useProperties.fetchGatedData` swallows the direct-fetch error in an `||` chain

- **File:** `src/hooks/useProperties.js`
- **Lines:** 143–155
- **What's wrong:** `const { data: directData } = await supabase.from('properties').select(...)` ignores `error`; if both the RPC and the direct fetch fail, the function silently returns nulls.
- **Who it hurts:** A paying user who unlocked a property sees no contact details, with no hint as to whether the data is genuinely absent or the fetch simply failed.
- **How to fix:** Capture `error`; on total failure return `null` explicitly and let the caller (`PropertyDetail`) decide what to show.

### L4. Image-type/size checks exist for *property* posters but not for *service* documents

- **Files:** `src/components/property/PropertyForm.jsx:128` (7MB image check, present); `src/pages/ServiceNew.jsx:108–112` (`handleFileChange` has no size/type check)
- **What's wrong:** The documents step advertises "PDF, JPG, PNG (max 5MB each)" in the UI (line 391) but `handleFileChange` enforces nothing. A 50MB upload attempts and fails at the storage layer (logged only, per C2's silent swallow).
- **Who it hurts:** A provider uploads an oversized scan; it fails silently; they never learn why their documents didn't attach and their listing sits unverifiable.
- **How to fix:** Enforce `file.size <= 5_000_000` and `['application/pdf','image/jpeg','image/png'].includes(file.type)` in `handleFileChange` with a `toast.error`, before the upload.

### L5. `create-listing-order` and `create-razorpay-order` 500 responses leak `error.message` to the client

- **Files:** `supabase/functions/create-listing-order/index.ts:115`, `supabase/functions/create-razorpay-order/index.ts:188`
- **What's wrong:** The generic catch returns `{ error: \`Internal Server Error: ${error.message}\` }`. For an unexpected throw, `error.message` may contain environment or stack hints.
- **Who it hurts:** Minor information disclosure to a caller who shouldn't see server internals — a small chip away at defense-in-depth.
- **How to fix:** Log full detail server-side; return only `'Internal Server Error'` to the client.

---

## Summary table

| ID | Severity | File | Lines | One-line summary |
|----|----------|------|-------|------------------|
| C1 | Critical | `supabase/functions/verify-listing-payment/index.ts` | 122–136 | Unvalidated `property_data` insert + leaked DB error |
| C2 | Critical | `src/hooks/useServices.js` | 159–238 | `createService` silently drops doc/item/plan failures as success |
| C3 | Critical | `src/hooks/useAuth.js` | 12–19 | `getSession().then()` has no `.catch()` — app hangs on flaky network |
| C4 | Critical | `src/hooks/useAuth.js` | 128–135 | `signUp` profile upsert error swallowed — orphaned account |
| H1 | High | `src/pages/ServiceDetail.jsx` | 120–128 | Service "unlock" is unpaid/unverified — bypasses the paywall |
| H2 | High — Resolved | `src/hooks/useServices.js` | 80–87 | Views-RPC failure hid an otherwise-loaded service — now fire-and-forget with its own `.catch` |
| H3 | High | `src/pages/PropertyDetail.jsx` | 271–282 | Post-payment site-visit insert failure silently dropped |
| H4 | High | `src/pages/PropertyDetail.jsx` | 96–109 | `checkUnlockStatus` ignores error — re-prompts payment |
| H5 | High — Resolved | `src/pages/PropertyDetail.jsx`, `src/pages/ServiceDetail.jsx` | 165–168, 130–133 | `navigator.clipboard` unguarded — false success toast — now feature-detect + try/catch + `execCommand` fallback |
| H6 | High | `src/hooks/useProperties.js` | 257, 281 | Favorites and recently-viewed swallow all errors silently |
| H7 | High | `src/pages/ServiceNew.jsx` | 114–121, 322, 358, 141–142 | Pricing steps (3, 4) never validated; zero-item submit possible |
| H8 | High | `src/components/property/PropertyForm.jsx` | 263, 161 | Rent has no positivity/range/bounds check |
| H9 | High | `src/pages/ServiceDetail.jsx` | 137–138 | `toast.error() \|\| toast.error()` — two error toasts |
| H10 | High | `src/pages/PropertyDetail.jsx` | 636–648 | Inline review catch discards the real error message |
| M1 | Medium | `src/pages/ServiceNew.jsx`, `src/pages/Settings.jsx` | 423–424, 174/39 | Phone/email format not validated on listing/settings |
| M2 | Medium | `src/pages/Settings.jsx` | 74–81 | Real `signInWithPassword` for password-change verification |
| M3 | Medium | `src/hooks/useProperties.js`, `src/hooks/useServices.js` | 49, 53; 38–40 | `%` / `_` unescaped in `ilike` filters |
| M4 | Medium | `src/components/common/OnboardingQuiz.jsx` | 95–108 | `onboarding_data` selections sent with no enum validation |
| M5 | Medium | `src/pages/ServiceNew.jsx` | 327 | `unit` free-form, unconstrained server-side |
| L1 | Low | `src/hooks/useAuth.js` | 165–168 | `signOut` no try/catch — throw skips `logout()` |
| L2 | Low | `src/pages/PropertyEdit.jsx` | 13–15 | `.then()` with no `.catch()` |
| L3 | Low | `src/hooks/useProperties.js` | 143–155 | `fetchGatedData` direct-fetch error swallowed |
| L4 | Low | `src/pages/ServiceNew.jsx` | 108–112 | Document step has UI-stated (5MB/type) limits but no enforcement |
| L5 | Low | `supabase/functions/create-listing-order/index.ts`, `create-razorpay-order/index.ts` | 115, 188 | 500 responses leak `error.message` to client |

---

## Where we'd start (recommended fix order)

1. **C1, C2, C3, C4** — data integrity, the app hang, information disclosure, and orphaned accounts. These are the direct-cost items; they should go first.
2. **H7, H8, H1, H9** — the listing forms the team has already touched, plus the service-paywall inconsistency. Clearing these lets clean listing flows ship.
3. **H2 (Resolved), H5 (Resolved)** this pass — done. **H3, H4, H6, H10 remain** — UX regressions where someone is misled or stranded.
4. **M1–M5** — input-shape tightening; pair these with the C1 server-side whitelist so client and server validate consistently.
5. **L1–L5** — the hardening pass; cheap, calm wins.

---

*This report is a point-in-time snapshot. Code, schemas, and policies may have moved since the audit date — please re-check line numbers against the working tree before patching.*
