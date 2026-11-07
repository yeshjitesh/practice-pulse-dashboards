type Kpi = [string, string, string, string];
export type Demo = { id: string; name: string; intro: string; kpis: Kpi[]; chartTitle: string; bars: [string, number][]; listTitle: string; list: [string, number, string][] };

export const demos: Demo[] = [
  {
    id: "appointments", name: "Appointments & access", intro: "See demand, capacity and missed appointments for the week at a glance.",
    kpis: [["Appointments", "1,284", "+4% vs last week", "bg-sage"], ["DNA rate", "3.1%", "Down from 3.8%", "bg-peach"], ["Same-day", "41%", "Of all bookings", "bg-sky"], ["Wait (routine)", "6.2 days", "Target 7 days", "bg-secondary"]],
    chartTitle: "Appointments by day", bars: [["Mon", 312], ["Tue", 268], ["Wed", 244], ["Thu", 251], ["Fri", 209]],
    listTitle: "By appointment type", list: [["GP face to face", 46, "bg-primary"], ["GP telephone", 28, "bg-accent"], ["Nurse / HCA", 18, "bg-navy"], ["ARRS clinicians", 8, "bg-rose"]],
  },
  {
    id: "qof", name: "QOF tracker", intro: "Track points achieved and where patients still need reviews before year end.",
    kpis: [["QOF points", "512 / 635", "81% achieved", "bg-sage"], ["Est. value", "£118k", "Of £146k possible", "bg-peach"], ["Reviews due", "347", "Next 8 weeks", "bg-sky"], ["Exceptions", "4.6%", "Within normal range", "bg-secondary"]],
    chartTitle: "Achievement by month (%)", bars: [["Apr", 18], ["Jun", 34], ["Aug", 49], ["Oct", 66], ["Nov", 81]],
    listTitle: "Indicator groups", list: [["Diabetes", 74, "bg-primary"], ["Hypertension", 88, "bg-accent"], ["Asthma / COPD", 69, "bg-navy"], ["Mental health", 62, "bg-rose"]],
  },
  {
    id: "workforce", name: "Rotas & staffing", intro: "Know who's in, where the gaps are, and how leave affects next week.",
    kpis: [["Sessions covered", "96%", "2 gaps this week", "bg-sage"], ["Staff on leave", "5", "Of 38 staff", "bg-peach"], ["Locum sessions", "7", "£3.4k this week", "bg-sky"], ["Training due", "9", "Mandatory modules", "bg-secondary"]],
    chartTitle: "Clinical sessions per day", bars: [["Mon", 22], ["Tue", 20], ["Wed", 18], ["Thu", 21], ["Fri", 17]],
    listTitle: "Cover by team", list: [["GPs", 94, "bg-primary"], ["Nurses", 100, "bg-accent"], ["Reception", 92, "bg-navy"], ["Admin", 98, "bg-rose"]],
  },
  {
    id: "finance", name: "Practice finance", intro: "Follow income streams, spending and cash against budget each month.",
    kpis: [["Income (YTD)", "£842k", "+6% vs last year", "bg-sage"], ["Staff costs", "64%", "Of income", "bg-peach"], ["Enhanced services", "£71k", "Claimed YTD", "bg-sky"], ["Unclaimed", "£4.2k", "To review", "bg-secondary"]],
    chartTitle: "Monthly income (£k)", bars: [["Jul", 118], ["Aug", 112], ["Sep", 121], ["Oct", 126], ["Nov", 131]],
    listTitle: "Income sources", list: [["Global sum", 58, "bg-primary"], ["QOF", 14, "bg-accent"], ["Enhanced services", 12, "bg-navy"], ["Other", 16, "bg-rose"]],
  },
  {
    id: "es", name: "Enhanced Services (ES / LES / DES)", intro: "Activity against target for every service, and claims before deadlines.",
    kpis: [["Services tracked", "14", "DES, LES and ES", "bg-sage"], ["Claimed YTD", "£71k", "Of £88k forecast", "bg-peach"], ["Ready to claim", "£6.8k", "Due in 9 days", "bg-sky"], ["Missed claims", "3", "Flagged this month", "bg-secondary"]],
    chartTitle: "Claims value by month (£k)", bars: [["Jul", 9], ["Aug", 11], ["Sep", 12], ["Oct", 14], ["Nov", 13]],
    listTitle: "Activity vs target", list: [["Learning disability checks", 72, "bg-primary"], ["Childhood imms", 91, "bg-accent"], ["Minor surgery", 64, "bg-navy"], ["Anticoagulation", 83, "bg-rose"]],
  },
  {
    id: "cqc", name: "CQC readiness", intro: "Evidence, policies and logs mapped to the five key questions.",
    kpis: [["Readiness score", "87%", "Up 5% this quarter", "bg-sage"], ["Policies due", "6", "Review in 30 days", "bg-peach"], ["Open actions", "11", "From audits and SEAs", "bg-sky"], ["Evidence items", "214", "Mapped and current", "bg-secondary"]],
    chartTitle: "Evidence complete by quarter (%)", bars: [["Q1", 62], ["Q2", 71], ["Q3", 80], ["Q4", 87]],
    listTitle: "Key questions", list: [["Safe", 84, "bg-primary"], ["Effective", 90, "bg-accent"], ["Caring", 95, "bg-navy"], ["Responsive", 82, "bg-rose"]],
  },
  {
    id: "tasks", name: "Tasks & workflow", intro: "Backlogs, results waiting and overdue work by person.",
    kpis: [["Open tasks", "426", "Across 22 staff", "bg-sage"], ["Overdue", "38", "Over 5 days", "bg-peach"], ["Docman waiting", "117", "Avg 1.6 days", "bg-sky"], ["Lab results", "64", "To file today", "bg-secondary"]],
    chartTitle: "Tasks completed per day", bars: [["Mon", 182], ["Tue", 165], ["Wed", 171], ["Thu", 158], ["Fri", 149]],
    listTitle: "Workload share", list: [["GPs", 41, "bg-primary"], ["Admin team", 29, "bg-accent"], ["Nurses", 18, "bg-navy"], ["Pharmacists", 12, "bg-rose"]],
  },
  {
    id: "ltc", name: "Long-term conditions & recalls", intro: "Registers, annual reviews and recalls due across your list.",
    kpis: [["On LTC registers", "3,912", "Of 9,840 patients", "bg-sage"], ["Reviews done", "68%", "Year to date", "bg-peach"], ["Recalls overdue", "412", "Over 3 months", "bg-sky"], ["Med reviews due", "289", "Next 4 weeks", "bg-secondary"]],
    chartTitle: "Reviews completed per month", bars: [["Jul", 388], ["Aug", 302], ["Sep", 446], ["Oct", 471], ["Nov", 423]],
    listTitle: "Annual review status", list: [["Diabetes", 71, "bg-primary"], ["Asthma", 63, "bg-accent"], ["COPD", 69, "bg-navy"], ["Hypertension", 76, "bg-rose"]],
  },
  {
    id: "screening", name: "Screening & immunisations", intro: "Uptake against targets and who to invite this week.",
    kpis: [["Flu uptake 65+", "74%", "Target 75%", "bg-sage"], ["Childhood imms", "92%", "At age 2", "bg-peach"], ["Cervical screening", "77%", "Ages 25–64", "bg-sky"], ["To invite", "186", "This week", "bg-secondary"]],
    chartTitle: "Flu vaccines given per week", bars: [["Wk 1", 412], ["Wk 2", 538], ["Wk 3", 481], ["Wk 4", 356], ["Wk 5", 244]],
    listTitle: "Uptake by programme", list: [["Bowel screening", 71, "bg-primary"], ["Breast screening", 68, "bg-accent"], ["Shingles", 59, "bg-navy"], ["COVID autumn", 54, "bg-rose"]],
  },
  {
    id: "prescribing", name: "Prescribing & medicines", intro: "Spend against budget, safety monitoring and savings.",
    kpis: [["Spend YTD", "£612k", "2.1% under budget", "bg-sage"], ["Antibiotic items", "0.82", "Per STAR-PU", "bg-peach"], ["High-risk monitoring", "94%", "Up to date", "bg-sky"], ["Savings found", "£18k", "Medicines optimisation", "bg-secondary"]],
    chartTitle: "Monthly spend (£k)", bars: [["Jul", 89], ["Aug", 86], ["Sep", 91], ["Oct", 88], ["Nov", 84]],
    listTitle: "Spend by area", list: [["Diabetes", 19, "bg-primary"], ["Respiratory", 16, "bg-accent"], ["Cardiovascular", 14, "bg-navy"], ["Other", 51, "bg-rose"]],
  },
  {
    id: "experience", name: "Patient experience", intro: "Feedback, complaints and phone waits in one place.",
    kpis: [["FFT positive", "91%", "Last 30 days", "bg-sage"], ["GPPS overall", "78%", "Good experience", "bg-peach"], ["Complaints", "4", "This quarter", "bg-sky"], ["Avg phone wait", "3m 40s", "Down 1m 10s", "bg-secondary"]],
    chartTitle: "Calls answered per day", bars: [["Mon", 684], ["Tue", 512], ["Wed", 476], ["Thu", 455], ["Fri", 431]],
    listTitle: "Survey results", list: [["Ease of getting through", 62, "bg-primary"], ["Helpful reception", 86, "bg-accent"], ["Overall experience", 78, "bg-navy"], ["Confidence in clinician", 93, "bg-rose"]],
  },
  {
    id: "training", name: "Training & HR", intro: "Mandatory training, registrations and appraisals tracked by person.",
    kpis: [["Training compliance", "93%", "Across 38 staff", "bg-sage"], ["Appraisals due", "4", "Next 60 days", "bg-peach"], ["DBS renewals", "2", "This quarter", "bg-sky"], ["Revalidation", "1", "GP due in March", "bg-secondary"]],
    chartTitle: "Modules completed per month", bars: [["Jul", 41], ["Aug", 22], ["Sep", 57], ["Oct", 63], ["Nov", 48]],
    listTitle: "Compliance by module", list: [["Safeguarding", 97, "bg-primary"], ["Information governance", 94, "bg-accent"], ["Basic life support", 88, "bg-navy"], ["Fire safety", 91, "bg-rose"]],
  },
  {
    id: "pcn", name: "PCN & IIF overview", intro: "Network-wide indicators, earnings and practice comparisons.",
    kpis: [["IIF points", "142 / 186", "76% achieved", "bg-sage"], ["IIF earnings", "£46k", "Projected year end", "bg-peach"], ["ARRS staff", "19 WTE", "Of 22 funded", "bg-sky"], ["Practices", "6", "In the network", "bg-secondary"]],
    chartTitle: "IIF achievement by practice (%)", bars: [["A", 82], ["B", 74], ["C", 79], ["D", 68], ["E", 71]],
    listTitle: "ARRS roles in post", list: [["Clinical pharmacists", 86, "bg-primary"], ["Social prescribers", 100, "bg-accent"], ["Physician associates", 67, "bg-navy"], ["Care coordinators", 80, "bg-rose"]],
  },
  {
    id: "population", name: "Population health", intro: "Who your patients are and where the greatest need lies.",
    kpis: [["List size", "9,840", "+212 this year", "bg-sage"], ["Over 65s", "19%", "Of registered patients", "bg-peach"], ["High-risk patients", "2.4%", "Frailty and complex care", "bg-sky"], ["Care home patients", "96", "Across 3 homes", "bg-secondary"]],
    chartTitle: "New registrations per month", bars: [["Jul", 68], ["Aug", 54], ["Sep", 91], ["Oct", 77], ["Nov", 62]],
    listTitle: "Patients by deprivation (%)", list: [["Most deprived 20%", 31, "bg-primary"], ["Middle 60%", 52, "bg-accent"], ["Least deprived 20%", 17, "bg-navy"], ["Housebound", 3, "bg-rose"]],
  },
  {
    id: "safety", name: "Safety & governance", intro: "Incidents, safeguarding and checks so nothing is missed.",
    kpis: [["Significant events", "7", "This quarter", "bg-sage"], ["Actions open", "5", "2 due this week", "bg-peach"], ["Safeguarding reviews", "98%", "Up to date", "bg-sky"], ["DSPT status", "Met", "Submitted June", "bg-secondary"]],
    chartTitle: "Equipment checks completed (%)", bars: [["Jul", 96], ["Aug", 92], ["Sep", 100], ["Oct", 98], ["Nov", 97]],
    listTitle: "Checks up to date", list: [["Fridge temperatures", 100, "bg-primary"], ["Emergency drugs", 96, "bg-accent"], ["Defibrillator", 100, "bg-navy"], ["Oxygen", 92, "bg-rose"]],
  },
];

