# Competitor roles, ownership, and attendance (salon/spa/beauty SMB platforms)

Research window: product help centers and feature docs retrieved Nov 2026. Prefer primary vendor docs; review sites used only where noted for corroboration. Region/package limits called out when sources state them.

---

## What roles do Fresha, Booksy, Vagaro, Square Appointments, Mindbody (and Africa/Nigeria alternatives) expose?

### Takeaway
Leading platforms separate **business ownership** (one privileged account) from **staff permission roles** (fixed ladders or customizable access levels). Africa-relevant Buk.ng and startbuddi also ship named role ladders; neither documents a dedicated salon time clock like Fresha/Vagaro/Square/Mindbody.

### Cited Findings
- **Fresha** uses customizable **permission roles** (unlimited custom roles). Permissions are grouped by area: Calendar, Sales, Clients, Reports, Team, Catalog, Online profile, Marketing, Payments and wallet, Workspace. Templated roles ship with each workspace; owners/admins with “Can manage permission levels” can create/edit roles. — [Create permission roles](https://www.fresha.com/help-center/knowledge-base/team/100687-create-permission-roles)
- **Booksy** exposes five fixed permission levels: **Owner, Manager, Reception (Receptionist), Staffer, Basic Staffer**. Owner/Manager alone can invite staff and assign permissions. Lower three levels allow some per-person customization after selection. — [How do I manage staff permissions?](https://support.booksy.com/hc/en-us/articles/16535688940946-How-do-I-manage-staff-permissions)
- **Vagaro** separates **Employee Type** (Service Provider vs Account Admin) from **Access Levels** (permissions). Default access levels: **Admin, Manager/Supervisor, Service Provider Commission, Service Provider Self-Employed, Employee**. Access levels are not tied to employee type. — [What are Employee Types?](https://support.vagaro.com/hc/en-us/articles/17310859833499-What-are-Employee-Types-); [Configure Access Levels](https://support.vagaro.com/hc/en-us/articles/18977275541531-Configure-Access-Levels-and-Employee-Permissions)
- **Square Appointments** default permission sets for calendars/POS: **Service Provider** (own calendar), **Front Desk** (all calendars), **Manager** (all calendars + account info; Google Calendar sync). Broader Square Staff permission sets can be Standard / Enhanced / Full or customized; custom-set count depends on plan (Appointments Premium = unlimited). — [Add and manage bookable team members](https://squareup.com/help/us/en/article/5350-create-staff-member-profiles-for-square-appointments); [Create and edit permission sets](https://squareup.com/help/gb/en/article/5822-employee-permissions)
- **Mindbody** uses **permission groups** (defaults include Manager and Staff; Front Desk appears in package permission matrices). Categories include Appointments, Clients, Reports, Time Clock, Payment Processing, Marketing, etc. Editing staff permissions is available on Accelerate, Ultimate, and Pro (Pro no longer sold). — [Staff Permissions explained](https://support.mindbodyonline.com/s/article/203253743-Staff-permissions-explained?language=en_US); [Staff permissions by package – Time Clock](https://support.mindbodyonline.com/s/article/Staff-permissions-for-each-MINDBODY-software-level-Time-Clock?language=en_US)
- **Buk.ng** (Nigeria): help center lists roles **Admin, Manager, Front desk, Finance, Marketer, Staff**, with per-person tightening; marketing also says “9 roles / Owner to front desk” and that owners invite admins, managers, finance, marketers, front desk, and staff. — [Set staff permissions](https://buk.ng/help/set-staff-permissions); [Buk.ng Help / FAQ](https://buk.ng/help); [Buk.ng homepage](https://buk.ng/)
- **startbuddi** (Nigeria/Africa-positioned): workspace roles **Owner, Admin, Manager, Member, View only**, plus **Client** for external project access. Scale plan adds per-module Full/View/None. — [How to manage seats and roles](https://startbuddi.com/help/billing-and-payments/how-to-manage-seats-and-roles/)

### Inferences
- Two patterns dominate: (1) **fixed named ladders** (Booksy, Buk.ng, startbuddi) vs (2) **custom access levels/groups** (Fresha, Vagaro, Square, Mindbody).
- Salon-specific language (Service Provider, Booth/Self-Employed, Reception) is strongest on Booksy, Vagaro, and Square Appointments; Fresha and startbuddi stay more generic “team/workspace.”

### Gaps
- Exact names of Fresha’s **templated** default roles are not enumerated in the create-roles article (only that templates exist; example given is “Manager”).
- Buk.ng’s “9 roles” marketing count vs six named help-center roles is not fully reconciled in docs fetched (Owner may be counted separately; Admin vs Owner relationship unclear).
- No reliable official role matrix found for Flowwbook beyond it being a Nigeria-relevant booking product.

---

## How is the first account / business owner treated vs stylists/practitioners?

### Takeaway
Across vendors, the **first/creator account is a singular Owner** with exclusive billing/security powers; stylists are invited team members with calendars and narrower permissions. Owners can also be bookable service providers, but ownership is a separate privilege layer.

### Cited Findings
- **Fresha**: A business account has **only one account owner** with full access. Ownership can be transferred to an existing team member; the former owner is then set to **High access** permission level (not dual-owner). Only owner (or members with permission-management rights) define permission roles. — [Transfer workspace ownership](https://www.fresha.com/help-center/knowledge-base/workspace-settings/100665-transfer-workspace-ownership-access-1); [Create permission roles](https://www.fresha.com/help-center/knowledge-base/team/100687-create-permission-roles)
- **Booksy**: **Owner** is automatically assigned to the person who created the account. Manager is nearly identical except cannot edit Owner’s profile, manage subscription, or access Owner security alerts for excessive client-data access. — [How do I manage staff permissions?](https://support.booksy.com/hc/en-us/articles/16535688940946-How-do-I-manage-staff-permissions)
- **Vagaro**: **Business owner account always has View and Modify on all permissions**; there is **no access level for the owner**. Docs recommend using Admin access level for trusted employees when settings need changing. Service Providers get bookable calendars (license fee per SP beyond owner’s, with volume pricing after seven). Account Admins typically have no calendar unless “Add Calendar” is toggled (extra license). — [Configure Access Levels](https://support.vagaro.com/hc/en-us/articles/18977275541531-Configure-Access-Levels-and-Employee-Permissions); [What are Employee Types?](https://support.vagaro.com/hc/en-us/articles/17310859833499-What-are-Employee-Types-)
- **Square**: Account owners (or team members with team-management permissions) create bookable team members and permission sets. Full Access assignees become **authorised representatives**. Team members are limited to assigned locations. — [Create and edit permission sets](https://squareup.com/help/gb/en/article/5822-employee-permissions); [Add and manage bookable team members](https://squareup.com/help/us/en/article/5350-create-staff-member-profiles-for-square-appointments)
- **Mindbody**: **One owner login per site** with full control; only owner can update subscription payment/bank details, manage third-party API integrations, manage Mindbody app listing settings, and (by default) Marketing Suite. Staff logins get capabilities via permission groups; owner-exclusive features remain. — Search/snippet from [Owner vs Staff vs Consumer logins](https://support.mindbodyonline.com/s/article/Logins-Owner-vs-Staff-vs-Consumer?language=en_US); [Staff Permissions explained](https://support.mindbodyonline.com/s/article/203253743-Staff-permissions-explained?language=en_US)
- **Buk.ng**: Owner is asked for NIN (and CAC if registered) for verification/payouts; owners invite staff into role-aware dashboards; only owners/managers see full salon bookings/numbers, while stylists can be limited to own schedule/notes. — [Buk.ng Help](https://buk.ng/help); [Buk for salons](https://buk.ng/for/salons)
- **startbuddi**: Only the **owner** can change someone’s role or remove them; nobody can change the owner’s own role from the staff permissions UI. Owner has full control of workspace, billing, and access. — [How to manage seats and roles](https://startbuddi.com/help/billing-and-payments/how-to-manage-seats-and-roles/)

### Inferences
- Product practice: **Owner = account/legal/billing principal**; **stylist = bookable calendar user**. Owners who cut hair still sit on the owner login (or separately as a staff profile with a distinct email—Mindbody warns against email collision with owner login).
- Manager is the common “near-owner” role for day-to-day ops without subscription/security control (Booksy, Vagaro Manager/Supervisor, Square Manager, Mindbody Manager).

### Gaps
- Mindbody owner-login article page returned a CSS error on fetch; findings for exclusive owner powers rely on search snippets from that URL and related permission docs—recommend re-fetch if quoting owner exclusivity line-by-line.
- Whether Fresha’s owner is automatically a bookable team member on day 1 is not spelled out in the permission/ownership articles reviewed.

---

## Do owners/managers typically clock in for shifts, or only service providers?

### Takeaway
Clock-in is modeled as an **optional, per-person (or permission-gated) attendance tool for hourly/shift labor**, not as something only stylists do. Vendors more often position time clock for **hourly / non-commission / front-desk** work; owners/managers usually **administer** timesheets rather than being required to clock—but products rarely forbid owners from clocking if wages/time clock are enabled for them.

### Cited Findings
- **Fresha**: Wages/timesheets are “best designed for team members who earn hourly, such as freelancers and shift-based staff.” Enabled **per team member**. Manual clock-in/out or auto clock based on scheduled shifts; optional ~50m proximity. Managers can view/edit timesheets and clock others out. Docs do not say “owners never clock.” — [Set up wages and timesheets](https://www.fresha.com/help-center/knowledge-base/team/291-set-up-wages-for-team-members); [Clock in and out](https://www.fresha.com/help-center/knowledge-base/personal-account/38-clock-in-and-out-of-your-shifts); [Manage team timesheets](https://www.fresha.com/help-center/knowledge-base/team/101636-manage-team-timesheets)
- **Mindbody**: Time Clock “is ideal for staff members who are **not paid to perform services**… such as front desk employees.” **By default, all staff logins can clock in and out.** Package matrix shows Owner/Manager/Staff (and Front Desk where applicable) all have Clock in/out; only higher roles get clock-others / edit / tasks. — [Time Clock](https://support.mindbodyonline.com/s/article/203253733-Time-Clock?language=en_US) (via search synthesis); [Time Clock permissions by package](https://support.mindbodyonline.com/s/article/Staff-permissions-for-each-MINDBODY-software-level-Time-Clock?language=en_US)
- **Vagaro**: Time cards are for **hourly employees** to clock in/out for payroll/Time Card reporting; employees can pick a **role** at clock-in for role-based hourly rates. Access Levels control who can view/edit time cards. — [Set Up Time Cards and Clock-In/Out](https://support.vagaro.com/hc/en-us/articles/204347510-Set-Up-Time-Cards-and-Clock-In-Out)
- **Square**: Team members clock in/out via POS / Square Team app; owners/managers with shifts permissions manage timecard reports. Time tracking marketed for hourly/shift-based teams. — [Employee Time Tracking](https://squareup.com/us/en/staff/shifts/features/time-tracking); [Appointments features – Square Staff](https://squareup.com/us/en/appointments/features)
- **Booksy**: Official help covers **working hours, shifts, breaks, time off**—not employee clock-in/out. Marketing says schedules + commissions/tips for “payroll math,” not a time clock. Third-party directories listing “Attendance/Timesheets” for Booksy are **not corroborated** by Booksy help articles reviewed. — [Adjust working hours](https://support.booksy.com/hc/en-us/articles/16536020166546-How-do-I-adjust-staff-members-working-hours); [Booksy Biz features](https://biz.booksy.com/); contradicted by aggregator [Crozdesk Booksy Biz](https://crozdesk.com/software/booksy-biz)
- **Buk.ng / startbuddi**: Documented staff schedules/roles; **no official time-clock/clock-in help article found** in this pass. startbuddi People module mentions leave/attendance setup in onboarding checklist language, but not a salon-style shift clock for stylists. — [Buk business](https://buk.ng/business); [startbuddi build a team](https://startbuddi.com/guides/how-to-build-your-first-team/)

### Inferences
- Industry product practice: **service providers are often paid on commission/booth rent**, so attendance clock is **optional**; **receptionists/hourly staff** are the primary clock users (Mindbody states this explicitly; Fresha/Vagaro/Square align via “hourly” framing).
- Owners/managers typically **review and correct** timesheets and may clock others in/out; whether an owner-operator who also takes clients clocks in depends on whether the salon treats them as hourly—products support both setups.

### Gaps
- No vendor publishes a survey of “% of owners who clock in.” Practice must be inferred from feature framing.
- Unclear whether Square Account Owner identity itself can hold a timecard without a separate team-member profile.

---

## What attendance / time tracking / payroll features exist?

### Takeaway
**Fresha, Vagaro, Square, and Mindbody** offer real clock-in/out → timesheets → payroll (or payroll reports). **Booksy** calculates commissions/tips for payout math but lacks documented clock-in. **Nigeria tools (Buk.ng, startbuddi)** emphasize deposits, schedules, and roles over US-style payroll clocks.

### Cited Findings

#### Fresha
- Per-member wages & timesheets; manual or auto clock; breaks; proximity control (~50m). — [Wages and timesheets](https://www.fresha.com/help-center/knowledge-base/team/291-set-up-wages-for-team-members)
- Timesheets feed **pay runs** (wages + commissions + tips + adjustments); pay via Fresha wallet, bank, or mark paid manually. Salaried staff via positive adjustment. — [Enable pay runs](https://www.fresha.com/help-center/knowledge-base/team/102232-enable-pay-runs-and-set-your-pay-period); [Pay your team overview](https://www.fresha.com/help-center/knowledge-base/team/587-paying-your-team-overview)
- Fixed and **tiered** commissions by item type; flow into pay runs. — [Set team commissions](https://www.fresha.com/help-center/knowledge-base/team/98-set-up-commissions-for-team-members)

#### Vagaro
- QR / physical time card / manual entry; role-based hourly rates; Time Card report; sync with **Vagaro Payroll**. — [Time Cards](https://support.vagaro.com/hc/en-us/articles/204347510-Set-Up-Time-Cards-and-Clock-In-Out); [Hourly pay rates](https://support.vagaro.com/hc/en-us/articles/21476003590299-Set-Up-Hourly-Pay-Rates)
- **Automatic rent collection** for booth renters/contractors (card on file, contracts, optional commission deduction from rent, 1099-MISC mentioned). Requires card processing; commission-from-rent needs payroll config. — [Automatic rent collection](https://support.vagaro.com/hc/en-us/articles/204347790-Set-Up-Automatic-Rent-Collection)

#### Square Appointments (+ Square Staff / Payroll)
- Digital timecards: clock-in/out, breaks, overtime, schedule enforcement; Shifts Free/Plus (and retail/restaurant plans). — [Time tracking](https://squareup.com/us/en/staff/shifts/features/time-tracking)
- Commissions (flat or tiered; Appointments Premium / Shifts Plus etc. plan-gated); import into **Square Payroll** with tips. **Only account owners can run payroll** (full-service Square Payroll). — [Commissions](https://squareup.com/help/us/en/article/7145-set-up-commission-tracking); [Run payroll](https://squareup.com/help/us/en/article/5855-run-payroll)
- Region note: Square Payroll / tip import docs are US-centric; availability outside US is not confirmed in these articles.

#### Mindbody
- Time Clock + **Time Clock Tasks** (job functions with pay rates); Time Clock and Payroll/Commission/Tips reports. Permissions: clock self, clock others, view all, edit, set up tasks—vary by Starter / Accelerate / Ultimate. — [Time Clock permissions by package](https://support.mindbodyonline.com/s/article/Staff-permissions-for-each-MINDBODY-software-level-Time-Clock?language=en_US); [Staff Permissions – Reports](https://support.mindbodyonline.com/s/article/Staff-Permissions-Reports?language=en_US)

#### Booksy
- Shifts, working hours, breaks, time off; **commissions and tips calculated at checkout** for payroll prep—not a documented clock or wage engine. — [Team management](https://biz.booksy.com/features/team-management); [Booksy Biz](https://biz.booksy.com/)

#### Africa / Nigeria alternatives
- **Buk.ng**: Naira deposits (Paystack), staff schedules/calendar columns, role-based access, reminders; no documented time clock/payroll in help pages reviewed. — [Buk.ng](https://buk.ng/); [Set staff permissions](https://buk.ng/help/set-staff-permissions)
- **startbuddi**: Bookings, Paystack deposits, staff calendars; seats/roles; People module for leave/attendance checklist language; fuller contractor timesheets described as “coming soon” in a 2026 guide. — [Salon software compared 2026](https://startbuddi.com/blog/salon-appointment-software/); [Seats and roles](https://startbuddi.com/help/billing-and-payments/how-to-manage-seats-and-roles/); [Build a team](https://startbuddi.com/guides/how-to-build-your-first-team/)

### Inferences
- Full **attendance → wages → payroll payout** stack is table-stakes mainly among **US/global POS-heavy** suites (Square, Vagaro, Fresha, Mindbody). Marketplace-led Booksy leans **commission reporting** over hourly clocks.
- For Nigeria SMBs, **deposit + staff schedule + roles** appear more documented than time-and-attendance payroll.

### Gaps
- Fresha / Vagaro / Mindbody payroll legal coverage by country (tax filing vs “pay run math”) not fully mapped; Square’s full-service payroll is clearly US W-2 oriented in docs cited.
- Booksy: no help-center article found for clock-in despite some third-party feature tags.

---

## What else is table-stakes for day-1 ops: multi-staff calendar, commissions, booth rental, permissions?

### Takeaway
Day-1 salon ops table-stakes across leaders: **multi-staff calendars, individual logins, permission roles, working hours/shifts, and commission tracking**. **Booth/chair rental** and **full time-clock payroll** are strong on Fresha/Vagaro (and Square payroll ecosystem) but not universal—Booksy and Nigeria tools often stop at commissions + schedules + permissions.

### Cited Findings

#### Multi-staff calendar
- Booksy: shared team calendar, per-staff shifts, drag-and-drop. — [Team management](https://biz.booksy.com/features/team-management)
- Square: bookable team members with own hours/services; Front Desk/Manager see all calendars. — [Bookable team members](https://squareup.com/help/us/en/article/5350-create-staff-member-profiles-for-square-appointments)
- Fresha: Calendar permissions for own vs all team calendars. — [Permission roles](https://www.fresha.com/help-center/knowledge-base/team/100687-create-permission-roles)
- Buk.ng: staff columns, day/week views, walk-ins beside online bookings. — [Buk for salons](https://buk.ng/for/salons)
- startbuddi: staff calendars, block time, round robin, personal booking pages. — [Salon software 2026](https://startbuddi.com/blog/salon-appointment-software/)

#### Commissions
- Fresha: fixed + tiered commissions into pay runs. — [Commissions](https://www.fresha.com/help-center/knowledge-base/team/98-set-up-commissions-for-team-members)
- Booksy: commission levels by staff/sale type; auto at checkout. — [Team management](https://biz.booksy.com/features/team-management); [Booksy Biz](https://biz.booksy.com/)
- Square: flat/tiered service commissions; import to payroll (plan-gated). — [Commission tracking](https://squareup.com/help/us/en/article/7145-set-up-commission-tracking)
- Mindbody: Commission reports (all staff vs own-only permissions). — [Staff Permissions – Reports](https://support.mindbodyonline.com/s/article/Staff-Permissions-Reports?language=en_US)
- Vagaro: default “Service Provider Commission” access level; rent can deduct commissions. — [Access Levels](https://support.vagaro.com/hc/en-us/articles/18977275541531-Configure-Access-Levels-and-Employee-Permissions); [Rent collection](https://support.vagaro.com/hc/en-us/articles/204347790-Set-Up-Automatic-Rent-Collection)

#### Booth / chair rental / independent contractors
- **Vagaro**: first-class **Rent Collection**—recurring rent, contracts, card on file, 1099-MISC, deduct commissions from rent; renters need employee profiles; “Service Provider Self-Employed” access level. — [Rent collection](https://support.vagaro.com/hc/en-us/articles/204347790-Set-Up-Automatic-Rent-Collection); [Access Levels](https://support.vagaro.com/hc/en-us/articles/18977275541531-Configure-Access-Levels-and-Employee-Permissions)
- **Fresha**: **Merchants** route client payments to individual wallets for chair renters/freelancers; blog (2024) also previewed booth rental charges in payroll. — [Merchants overview](https://www.fresha.com/help-center/knowledge-base/payments/100647-merchants-overview); [Q1 Up Next blog](https://www.fresha.com/blog/q1-up-next-fresha) (dated 2024—confirm current GA status in-product)
- Secondary: Homebase 2026 salon software article states Fresha and Vagaro support independent contractor setups; classification caution is editorial, not vendor docs. — [Salon management software 2026](https://www.joinhomebase.com/blog/salon-management-software-solutions)

#### Permissions (day-1)
- All major platforms above document staff permissions as core. Buk.ng and startbuddi treat roles as primary security model for SMB teams. — sources above under roles section

### Inferences
- **Must-have for multi-stylist SMB day 1**: shared calendar + per-staff availability + login isolation + permission ladder + commission tracking.
- **Should-have depending on labor model**: time clock/payroll (employee salons) vs merchant/booth rent (contractor salons).
- **Nigeria day-1 extras** that global docs under-emphasize: **Naira deposits (Paystack), WhatsApp reminders, ID/CAC verification**—visible on Buk.ng and startbuddi, not on Mindbody/Square help content reviewed.

### Gaps
- Fresha booth-rent “launch soon” blog is from 2024; current GA status of in-app rental agreements vs Merchants-only should be verified in live product/help (Merchants page is current; rent-charge article was not found as a dedicated 2025–2026 help article in this pass).
- Booksy booth-renter / 1099 workflow: Booksy blog discusses W2 vs 1099 conceptually; no Booksy help article on automatic rent collection found.
- Square booth rental: not found as a first-class Appointments feature in docs reviewed.

---

## Cross-competitor snapshot (for synthesizer)

| Platform | Owner model | Role model | Clock-in / attendance | Payroll / pay | Commissions | Booth / IC |
| --- | --- | --- | --- | --- | --- | --- |
| Fresha | Single workspace owner; transferable | Custom permission roles + templates | Per-member timesheets; manual/auto; geo | Pay runs to wallet/bank | Fixed + tiered | Merchants (chair renters); rent charges historically announced |
| Booksy | Creator = Owner | Fixed: Owner/Manager/Reception/Staffer/Basic | Working hours/shifts only (no official clock found) | Commission/tip math, not full clock payroll | Yes, at checkout | Not documented as rent collection |
| Vagaro | Owner always full access (no AL) | Employee Type + Access Levels (5 defaults) | Time cards / QR / roles at clock | Vagaro Payroll + Time Card report | Yes + rent deduct | Automatic rent collection |
| Square Appointments | Account owner; Full Access = authorised rep | Service Provider / Front Desk / Manager + custom sets | Square Shifts timecards | Square Payroll (US; owner-only run) | Flat/tiered (plan-gated) | Not found in Appointments docs |
| Mindbody | One owner login; exclusive powers | Permission groups (Manager/Staff/Front Desk…) | Time Clock + Tasks; all staff can clock by default | Payroll/Commission reports | Commission reports | Not covered in this pass |
| Buk.ng | Owner (+ verification) | Admin/Manager/Front desk/Finance/Marketer/Staff | Schedules; no clock docs found | Deposits/settlement in Naira | Not documented in pages fetched | N/A in pages fetched |
| startbuddi | Owner-only role changes | Owner/Admin/Manager/Member/View only/Client | Leave/attendance mentioned; clock not documented | Paystack deposits; not salon payroll clock | Not primary in docs fetched | External collaborator; contractor timesheets “coming soon” |

---

## Source quality notes
- Primary weight given to vendor help centers and product feature pages dated or retrieved 2025–2026.
- Mindbody Time Clock and Owner-login pages intermittently failed full fetch (CSS error); package permission tables and related articles were used with URL citations.
- Aggregators (Crozdesk) and vendor marketing blogs used only where flagged; when they conflict with help centers, help centers win.
- Africa alternatives documentation is thinner than Fresha/Vagaro/Square; treat Buk.ng/startbuddi feature completeness as “as documented,” not as exhaustive.
