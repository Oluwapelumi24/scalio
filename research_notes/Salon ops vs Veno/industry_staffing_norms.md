# Salon/spa industry staffing & timekeeping norms

Research focus: how real beauty/wellness SMBs structure ownership, managers, practitioners, and front desk; how timekeeping relates to the appointment book; commission vs employee vs booth-renter models; and what ops software is expected to support. Markets covered: primarily US (most documentation), UK (HMRC employment status), and Nigeria (job-posting evidence of similar role split). Vendor blogs are labeled as such where they are not primary labor/trade sources.

## Typical org structure for a small salon (owner-operator vs multi-staff)?

### Takeaway
Small salons usually start as owner-operator (owner does services *and* runs the floor); as headcount grows, industry guidance separates owner (systems/strategy) from manager (daily ops), with stylists/therapists as the revenue core and a dedicated receptionist once volume justifies it. Nigeria multi-staff salons advertise the same manager / front-desk / practitioner split even when the founder is not behind the chair.

### Cited Findings
- Entrepreneur Press / Eileen Figure Sandlin (via NBC News excerpt of *Start Your Own Hair Salon and Day Spa*) list a typical staffing stack: **Owner/Operator** (ops + finance + hiring + performance, *plus* providing services if licensed); **Salon Manager** (paperwork, scheduling, purchasing, facility—recommended unless the salon is “extremely small”); **Hairstylist/Cosmetologist**; **Shampoo/Salon Assistant**; **Receptionist**; plus spa roles (aesthetician, massage therapist, etc.). — [NBC News / Entrepreneur](https://www.nbcnews.com/id/wbna55975680)
- Same source: an owner who also takes clients can expect **up to 60+ hours/week** in the salon depending on bookings. — [NBC News / Entrepreneur](https://www.nbcnews.com/id/wbna55975680)
- Spark Pro (salon ops vendor/consulting content): early-stage owners commonly act as manager by default; healthy later structure splits **owner = vision, pricing, policy, growth** vs **manager = daily scheduling, policy enforcement, first-line escalations**. — [Spark Pro](https://sparkprosalon.com/salon-owner-vs-manager/)
- Salon Business Plan modeling distinguishes **owner-operator management hours** vs **manager-run** daily work; even a manager-run model still needs owner oversight hours, and if the owner also cuts hair those service hours are separate from management replacement. — [Salon Business Plan](https://salonbusinessplan.com/blog/salon-owner-operator-vs-manager-run-model/)
- TheSaral (India/UK-facing salon ops guidance): manager job centers on roster, standards, billing targets, complaints, and stock; owner retains bank/GST/licences/price changes; promote senior stylist, hire external manager, or promote receptionist are common routes—with tradeoffs (chair time lost vs authority gaps). — [TheSaral](https://thesaral.com/salon/salon-manager-job-description)
- SpalonPro example responsibility matrix for multi-role salons: Owner (direction, finance, policies, escalations) → Manager (daily ops, staff coordination, quality, reporting) → Receptionist (enquiries, appointments, client updates) → Beauty professionals (services, prep, hygiene) → optional inventory coordinator. — [SpalonPro](https://www.spalonpro.com/blog/how-salon-owners-can-maintain-control-without-micro-managing)
- Nigeria job market evidence of multi-staff structure: Lagos **Salon Manager** role at Kinky Apothecary explicitly states “This is not a stylist position” and reports to Founder/senior management on bookings, KPIs, stock, complaints. — [Jobomas listing](https://ng.jobomas.com/salon_manager_iid_400004517) *(URL as returned by search; path may use underscore/hyphen variants)*; spa **Front Desk Officer** and salon **Front Desk Manager** listings emphasize appointments, payments, client records, and stylist coordination. — [Jobberman](https://www.jobberman.com/listings/front-desk-officer-rrj9p8); [Jobzilla](https://www.jobzilla.ng/jobs/front-desk-manager-at-amani-advisory-limited-346033)
- UK HMRC: industry includes employed salon staff, self-employed chair renters, mobile freelancers, and owner-run shops—status follows day-to-day practices, not labels. — [GOV.UK](https://www.gov.uk/guidance/check-employment-status-if-you-work-in-hair-and-beauty)

### Inferences
- “Good” structure for Veno-like SMB software should model **at least**: Owner/Admin, Manager, Front Desk, Service Provider, and optionally Booth Renter / self-employed provider—because that matches both US trade staffing lists and competitor default roles (see permissions section).
- Owner-operator vs pure owner-manager is a **lifecycle stage**, not two fixed industry types: same business often starts as owner-in-chair and later hires a floor manager while the owner may keep a personal book or exit the chair.

### Gaps
- No high-quality statistical census found for “% of small salons that are owner-operator vs manager-run” in US/UK/Nigeria; sources are trade guides, job ads, and consulting blogs rather than industry association surveys.
- Modern Salon / Salon Today pieces found were strong on **compensation** but thin on org-chart prevalence; association white papers with staffing ratios were not located in this pass.

## Do owners who also take clients usually appear on the appointment book AND/OR time clock?

### Takeaway
Working owners who take clients are expected to appear on the **appointment book / calendar** like any bookable provider; they are **not** generally required to punch a payroll time clock under US FLSA business-owner rules, though some shops may optionally track owner presence for ops visibility. Software systems treat “performs services / show on calendar” separately from payroll clocking.

### Cited Findings
- Entrepreneur staffing guide treats the owner/operator as someone who both oversees the business **and** provides salon services when licensed—i.e., they are part of service delivery capacity, not only management. — [NBC News / Entrepreneur](https://www.nbcnews.com/id/wbna55975680)
- Boulevard separates **Staff Role** (job title; whether the person **performs services**, appears on calendar/schedule, and which services they can do) from **Permission Groups** (what they can do in the product). Staff in roles that do **not** perform services do not appear in the booking overlay; roles that perform services can toggle **Show on calendar** / **Show on schedule**. — [Boulevard Staff Roles](https://support.boulevard.io/en/articles/5941382-staff-roles)
- US DOL Wage & Hour Field Operations Handbook: an employee who **owns ≥20% bona fide equity** and is **actively engaged in managing** the enterprise is an **exempt executive**; salary/salary-basis tests do not apply to these owners. — [DOL FOH Ch. 22](https://www.dol.gov/sites/dolgov/files/WHD/legacy/files/FOH_Ch22.pdf) (section 22b05); regulation reference 29 CFR 541.101
- DOL Small Entity Compliance Guide: for exempt EAP employees, employers are **not required** to keep daily/weekly hours-worked records the way they must for nonexempt staff (though identity/payment records still apply). — [DOL Small Entity Compliance Guide](https://www.dol.gov/agencies/whd/overtime/rulemaking/small-entity-compliance-guide)
- Mangomint (salon software / payroll guidance): nonexempt employees must have hours recorded; exempt white-collar employees don’t need those hours records under 29 CFR Part 516 framing they cite; time clock drives **hourly** payroll from clocked (not scheduled) hours. — [Mangomint](https://www.mangomint.com/blog/hourly-vs-salary-payroll/)
- Punch (time-clock vendor, salon guide): punch clocks are for people **on payroll**; booth renters don’t punch; owner/manager review of punches is the approval step—not framed as owners needing to clock for wage compliance. — [Punch](https://www.punchapp.io/blog/salon-barbershop-time-tracking-payroll-guide)
- Salon Business Plan: models owner **management** hours as unpaid owner work / opportunity cost for sole proprietors, distinct from employee wages and from owner service contribution if the owner later takes clients. — [Salon Business Plan](https://salonbusinessplan.com/blog/salon-owner-operator-vs-manager-run-model/)

### Inferences
- **Appointment book: yes** for owner-operators who take clients (bookable provider column).
- **Time clock: usually no for wage-hour compliance** for equity owners actively managing; optional for culture/ops if the shop wants presence data.
- Pure owner-managers who never take clients should **not** need a calendar column as a service provider (Boulevard’s “does not perform services → not in booking overlay”), but may still need Admin/Manager software login.

### Gaps
- No trade-association survey found that asks “do salon owners clock in?” as a practice norm; conclusion is inferred from labor rules + software product models + payroll vendor guidance.
- UK/Nigeria: no clear published norm on whether working directors clock attendance for internal ops; tax/employment guidance focuses on worker classification, not owner punches.

## Industry norms for time clocks vs appointment-based hours for stylists?

### Takeaway
Industry and labor guidance treat the **appointment book as capacity/scheduling**, not as a timesheet. For **employee** stylists (hourly or commission), actual clocked presence is the basis for minimum wage, overtime, and “greater of hourly vs commission” checks; gaps between clients while required to stay are generally **work time**, not breaks.

### Cited Findings
- Punch: “The calendar is not a timesheet. Booked appointments show who was scheduled, not who actually showed, when they arrived, or when they left. A no-show client does not mean the stylist was off the clock.” — [Punch](https://www.punchapp.io/blog/salon-barbershop-time-tracking-payroll-guide)
- EZTime: booking shows appointment times; time system shows presence; compare weekly (e.g., 18 booked hours vs 40 clocked hours signals under-booking or bad schedule). Waiting between clients if required to stay, setup, sanitizing, laundry, and required training count as working time. — [EZTime](https://eztime.com/industries/salons-and-spas/)
- XecuteTheVision / Updoot salon time-clock guide: common mistake is “Tracking appointments instead of hours. The book shows services, not time worked”; policy template states all non-exempt employees (including commission/tipped) clock in; booth renters do not. — [XecuteTheVision](https://xecutethevision.com/blog/f/best-time-clock-software-for-salons-and-spas)
- Dotbooker: schedule may say 9–5 while actual day includes early prep, shortened lunch, late walk-ins; appointment duration ≠ working time. — [Dotbooker](https://www.dotbooker.com/blogs/timesheet-software-salon-staff-hours)
- Mangomint: when Time Clock is enabled, hourly pay uses **clocked hours instead of scheduled hours**. — [Mangomint](https://www.mangomint.com/blog/hourly-vs-salary-payroll/)
- Homebase salon positioning: schedule stylists/assistants, track chair/time, calculate commissions/tips, pay W-2 and 1099 booth renters in one run—time tracking is connected to payroll, not replaced by appointment totals. — [Homebase](https://www.joinhomebase.com/industry/salon-payroll)
- When I Work salon/spa page: tablet/phone time clock for attendance; hours flow to payroll integrations; overtime flags before labor cost overruns. — [When I Work](https://wheniwork.com/industries/salon-spa)
- Alaska DOL letter (nail salon context, broader wage recordkeeping): employers must keep accurate records of hours actually worked; a mere record of hours **scheduled** may be insufficient; prep and post-service duties can count as hours worked. — [Alaska DOL PDF](https://labor.alaska.gov/lss/forms/nail_salon_letter.pdf)
- DOL: time clocks are **not required** by FLSA; employers must keep accurate hours records for nonexempt workers and may use various methods (including exceptions reporting for fixed schedules). — [DOL elaws Hours Worked](https://webapps.dol.gov/elaws/whd/flsa/hoursworked/screenEr29.asp); [Employer.gov recordkeeping](https://www.employer.gov/pay-and-benefits/recordkeeping/)

**Commission vs employee pay context (why hours still matter):**
- Modern Salon (medspa-oriented but beauty-industry trade press): recommends base **and/or** commission; pay “base draw or the commission—whichever is greater”; notes straight ~50% commission is becoming less viable for profitability. Example ranges cited: esthetician ~$10–15/hr with 35–45% tiered commission. — [Modern Salon](https://www.modernsalon.com/news/compensating-your-staff)
- Entrepreneur staffing excerpt: stylists paid **straight commission (often 35–50%)**, **salary/hourly**, or **salary plus commission**. — [NBC News / Entrepreneur](https://www.nbcnews.com/id/wbna55975680)
- This Ugly Beauty Business: employee options framed as hourly, hourly vs commission (greater of), or hourly + performance bonuses—not “appointments only.” — [This Ugly Beauty Business](https://thisuglybeautybusiness.com/2013/01/staff-compensation-comparison-of.html)
- EZTime / Punch: commission employees still need hour records for minimum-wage top-ups and FLSA §7(i) overtime exemption testing; slow weeks can fail the exemption and create overtime liability. — [EZTime](https://eztime.com/industries/salons-and-spas/); [Punch](https://www.punchapp.io/blog/salon-barbershop-time-tracking-payroll-guide)
- Mangomint: commissions must be included in the regular rate for overtime for nonexempt staff; product supports “whichever is greater” hourly vs commission. — [Mangomint](https://www.mangomint.com/blog/hourly-vs-salary-payroll/)

**What “good” ops/timekeeping software is expected to support (synthesis from vendor + labor alignment):**
- Separate **roster/shifts** from **appointment calendar** from **clocked timesheets**.
- Front-desk **kiosk/PIN** clock-in; break tracking; manager approval/audit of edits.
- Mixed pay: hourly, commission, tips, greater-of rules; overtime alerts.
- Distinguish employees who clock from booth renters who don’t.
- Export to payroll (ADP/Gusto/etc.) — emphasized by Homebase, When I Work, Punch, Updoot. — [Homebase](https://www.joinhomebase.com/industry/salon-payroll); [When I Work](https://wheniwork.com/industries/salon-spa); [Punch](https://www.punchapp.io/blog/salon-barbershop-time-tracking-payroll-guide); [XecuteTheVision](https://xecutethevision.com/blog/f/best-time-clock-software-for-salons-and-spas)

### Inferences
- Using appointment duration as payroll hours is an industry anti-pattern for employee salons.
- For **true** booth renters, appointment book may still matter for shared facility coordination, but **not** for employer wage records.
- Software that only has a calendar without a time clock is incomplete for US employee-model salons with hourly/commission staff.

### Gaps
- Limited non-US primary sources on whether UK employed stylists typically punch clocks vs use rota exceptions reporting; HMRC focuses on status, not clock technology.
- Nigeria: documented role structure exists; documented time-clock vs appointment norms for payroll compliance were not found in this research pass.

## Front desk vs practitioner vs manager responsibilities?

### Takeaway
Practitioners own service delivery and their chair/room work; front desk owns guest flow (book, check-in/out, payments, rebooking); managers own systems/roster/standards/first escalations and reporting. Owners keep strategy, pricing authority, hiring/pay changes, and final escalations—especially once the salon is past owner-operator stage.

### Cited Findings
- Entrepreneur role rundown: stylists deliver licensed services; assistants shampoo/clean/support; receptionist greets, answers phones, books, cashes out, product knowledge; manager handles scheduling/purchasing/paperwork with authority to act for owner. — [NBC News / Entrepreneur](https://www.nbcnews.com/id/wbna55975680)
- SpalonPro: manager = daily ops, staff coordination, quality checks, routine reporting; receptionist = enquiries, appointment coordination, client updates; professionals = assigned services, prep, hygiene, service records. Decision levels: independent routine tasks vs decisions within limits vs management approval. — [SpalonPro](https://www.spalonpro.com/blog/how-salon-owners-can-maintain-control-without-micro-managing)
- Storm Salon Social (owner interviews): manager runs **systems** (daily lists, booking rules, consultations, ordering, price conversations, stylist reviews); front desk **executes** those systems with clients. — [Storm Salon Social](https://www.stormsalonsocial.com/blog/salon-manager-duties)
- Booksy business blog: receptionist duties center on scheduling, gap elimination, phone/online booking balance. — [Booksy](https://biz.booksy.com/blog/salon-receptionist-duties-key-roles-and-responsibilities-in-a-thriving-beauty-business)
- Indeed / salon job post (Front Desk Floor Manager): lead front desk team, manage appointment flow/waitlists, check-in/out/payments/rebooking/retail, first guest concerns, monitor floor pacing and stylist breaks, report rebooking/retail/phone metrics—bridge between reception and floor leadership. — [Indeed job listing](https://www.indeed.com/job/front-desk-floor-manager-174e04893973b62d?vjs=3)
- Nigeria listings mirror the split: Front Desk = appointments, payments, records, client communication; Salon/Ops Manager = staff, rosters, SOPs, KPIs, stock, complaints; one Lagos salon manager posting explicitly excludes hands-on styling. — [Jobberman](https://www.jobberman.com/listings/front-desk-officer-rrj9p8); [Jobomas / Kinky Apothecary](https://ng.jobomas.com/salon_manager_iid_400004517); [MyJobNigeria ops manager](https://www.myjobnigeria.com/operations-manager-at-elvaridah-limited-lekki/)
- Boulevard default roles encode the same operational model in software: **Front Desk/Receptionist** (appointments, check-in/out, payments, waitlists—no advanced settings/reporting/permission admin); **Service Provider** (own schedule/appointments/notes/personal metrics); **Location Manager** (schedules, staff, appointments, location reports, check-in support—no full account financial/system control); **Admin** (owners/executives: users, pricing, permissions, financials). — [Boulevard default roles](https://support.boulevard.io/en/articles/13382959-default-roles-permission-groups)

### Inferences
- Best-practice ops is **role clarity + escalation limits**, not “everyone does everything.”
- Hybrid titles (Front Desk Manager, Receptionist-Manager) appear when salons are mid-size: reception leadership plus floor flow, still distinct from chair work.

### Gaps
- Compensation bands in older Entrepreneur/NBC excerpt are dated (2014 BLS figures); use for role structure, not current pay benchmarks.
- Spa-specific room-turnover management is covered lightly in EZTime but less in classic hair-salon trade staffing lists.

## Booth renter / independent contractor vs employee implications for attendance?

### Takeaway
True booth/chair renters set their own hours and generally **do not clock in**; requiring fixed attendance/schedules is a classic control factor that points toward **employee** status (US IRS and UK HMRC). Mislabeling commission employees as renters while controlling hours/prices/clients creates classification risk.

### Cited Findings
- IRS Publication 4902 (*Tax Tips for the Cosmetology & Barber Industry*): booth renter leases space and operates own business; indicators of independence include key to establishment, **setting own hours**, buying own products, own phone/business name, **determining prices**; if those factors are absent, worker is likely an employee. Shop-owner control questions include who sets open hours, who assigns shifts, who sets prices, who sets appointments. — [IRS Pub 4902](https://www.irs.gov/pub/irs-pdf/p4902.pdf)
- IRS general IC guidance: classification uses behavioral control, financial control, and relationship type; look at the whole relationship and right to direct/control. — [IRS](https://www.irs.gov/businesses/small-businesses-self-employed/independent-contractor-self-employed-or-employee)
- IRS SS-8 determination example (nail salon): salon control over methods, posted fees, common cash drawer, appointments/walk-ins through firm weighed toward employment even with flexible hours—illustrates that “flexible schedule” alone does not make a renter. — [IRS Form 14430-A example PDF](https://www.irs.gov/pub/ss8/05PCP002507.pdf)
- Chau Tran CPA (salon tax advisor): salon setting schedule and requiring attendance is a red flag that a “rental” arrangement is really employment. — [Chau Tran CPA](https://www.chautrancpa.com/blog/booth-rent-vs-employee-salon-classification.html)
- EZTime / Punch / XecuteTheVision: true booth renters do **not** clock in; employees do; keep the line clean for classification defensibility. — [EZTime](https://eztime.com/industries/salons-and-spas/); [Punch](https://www.punchapp.io/blog/salon-barbershop-time-tracking-payroll-guide); [XecuteTheVision](https://xecutethevision.com/blog/f/best-time-clock-software-for-salons-and-spas)
- UK GOV.UK HMRC table: employed → salon sets start/finish times, days, time off, clients, products, tasks, methods, pay rate; self-employed chair renter → decides hours/days/time off, provides own clients, may provide products, sets charges, client pays them, no pay without appointments. — [GOV.UK](https://www.gov.uk/guidance/check-employment-status-if-you-work-in-hair-and-beauty)
- UK accountants: chair rent consistent with self-employment but not proof; control over diary/hours is a primary factor; commission-of-salon-set-prices + salon-set hours ≈ employee with a rental label. — [Holloway Davies](https://www.hollowaydavies.co.uk/blog/sole-trader-and-self-employment/rent-a-chair-salon-tax-uk); [Bright Grahame Murray](https://www.bgm.co.uk/insight/news/employment-status-revised-for-hair-and-beauty-salons)
- Vagaro access levels explicitly include **Service Provider Commission** vs **Service Provider Self-Employed** as different default permission profiles—software acknowledges both employment models on one floor. — [Vagaro Support](https://support.vagaro.com/hc/en-us/articles/18977275541531-Configure-Access-Levels-and-Employee-Permissions)

### Inferences
- Attendance/time-clock requirements are not just an ops preference—they are a **classification signal**.
- Ops software should support renters appearing on a shared facility calendar (optional) **without** forcing them into employee timesheets/payroll hours.
- Homebase marketing claim of paying W-2 and 1099 booth renters “in one payroll run” is vendor capability messaging; legal classification still depends on facts. — [Homebase](https://www.joinhomebase.com/industry/salon-payroll)

### Gaps
- Nigeria-specific booth-rental vs employment labor guidance was not found; practice may exist informally but is not well documented in sources retrieved here.
- State-by-state US nuances (and IR35 edge cases for UK PSC stylists) are noted by advisors as uncommon on salon floors but not deeply surveyed here.

## What permissions separation is considered best practice?

### Takeaway
Best practice (encoded in major salon platforms) is **least privilege by operational role**: Admin/Owner full access; Manager location ops without full financial/system control; Front Desk scheduling + checkout without settings/payroll admin; Service Providers limited to own book/clients/metrics; optional Accountant (finance only) and Self-Employed provider profiles. Owner login is typically unique and cannot be diluted into a generic “Owner” permission group.

### Cited Findings
- Boulevard defaults: Admin (owners/execs—users, pricing, permissions, reports, payouts); Location Manager (location ops/schedules/staff/appointments/reports; cannot do system-level financial controls); Front Desk (appointments, check-in/out, payments, waitlists; no advanced settings/reporting/permission management); Service Provider (own schedule/appointments/client details related to their work; no business settings/users/sensitive financials beyond own work); Accountant (financial visibility without scheduling/clients). Detailed matrix: providers often create/edit/cancel **own** appointments only; front desk manages location appointments; revenue/export concentrated in Admin/Manager/Accountant. — [Boulevard](https://support.boulevard.io/en/articles/13382959-default-roles-permission-groups)
- Boulevard also separates **Staff Role** (bookable? services?) from **permissions**—so a manager who still takes clients can be bookable without needing Admin rights, and a receptionist can have front-desk permissions without appearing as a service provider. — [Boulevard Staff Roles](https://support.boulevard.io/en/articles/5941382-staff-roles)
- Vagaro defaults: Admin; Manager/Supervisor; Service Provider Commission; Service Provider Self-Employed; Employee (receptionist/admin non-providers). Owner account always has full View/Modify; examples of restrictions: hide business reports from receptionists, prevent providers from booking others’ calendars, limit discounts at checkout. Access level ≠ Employee Type (Admin vs Service Provider). — [Vagaro](https://support.vagaro.com/hc/en-us/articles/18977275541531-Configure-Access-Levels-and-Employee-Permissions)
- Mindbody: permission groups (defaults include Manager, Staff, Webmaster); cannot create a staff group named “Owner” because owner login already has all permissions; create separate groups when even one permission differs; Administer permission groups required to manage groups/IP restrictions. — [Mindbody](https://support.mindbodyonline.com/s/article/203253763-Permission-groups?language=en_US) *(page intermittently failed to fully render in fetch; title/snippet content from search index used with that caveat)*
- Ozync: staff see own queue/appointments/time clock; owners/managers see everyone; staff never see revenue unless granted dashboard. — [Ozync](https://ozync.com/salon-time-clock)
- da Salon Partner: Role Groups with No access / View only / Full access; limit staff to own or today’s clients; hide client contact details; timesheets + shifts alongside calendar. — [da Salon](https://www.dasalon.com/business/features/appointments-and-staff)
- SpalonPro / TheSaral ops guidance: written authority limits (discount caps, refund thresholds, hire/pay changes reserved to owner) are organizational best practice that software permissions should enforce. — [SpalonPro](https://www.spalonpro.com/blog/how-salon-owners-can-maintain-control-without-micro-managing); [TheSaral](https://thesaral.com/salon/salon-manager-job-description)

### Inferences
- Industry-standard permission model for Veno to match: **dual axis**—(1) employment/bookability type (employee provider, self-employed/booth, front desk, manager, owner) and (2) capability grants (calendar, POS/discounts, reports, payroll/time, settings).
- Front desk should not default to full financial reporting or permission admin; providers should default to **own** book; managers need timesheet approval + schedule control; owners uniquely hold banking/pricing/user governance.

### Gaps
- Mindbody full optional-permission matrix was not fully retrieved due to page CSS/load failure during fetch; Boulevard and Vagaro provide the clearest primary help-doc matrices.
- “Best practice” here is inferred from dominant vendor defaults + ops role design, not from a single salon association security standard.
