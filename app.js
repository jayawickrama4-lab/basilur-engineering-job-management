const jobStorageKey = "basilur-engineering-jobs-v1";
const technicianStorageKey = "basilur-engineering-technicians-v1";

const seedJobs = [
  {
    id: "JOB-1001",
    customer: "Basilur Tea Export Plant",
    title: "Conveyor drive inspection",
    location: "Kelaniya Packing Line 2",
    status: "In Progress",
    priority: "High",
    technician: "Nimal Perera",
    scheduled: "2026-07-06",
    quoted: 185000,
    invoice: "Draft",
    notes: "Drive belt slipping under load. Check gearbox oil level and motor mounting alignment.",
    tasks: [
      { label: "Lockout and safety inspection", done: true },
      { label: "Check belt tension and pulley alignment", done: true },
      { label: "Prepare gearbox service recommendation", done: false }
    ],
    parts: ["V-belt B72", "Gear oil ISO 220", "Motor mounting bolts"]
  },
  {
    id: "JOB-1002",
    customer: "Ceylon Cold Storage",
    title: "Chiller pump seal replacement",
    location: "Colombo 10",
    status: "Scheduled",
    priority: "Medium",
    technician: "Ayesha Fernando",
    scheduled: "2026-07-07",
    quoted: 96000,
    invoice: "Not Ready",
    notes: "Customer reports leakage at pump 3 mechanical seal after morning startup.",
    tasks: [
      { label: "Confirm pump isolation window", done: false },
      { label: "Replace seal kit", done: false },
      { label: "Pressure test and handover", done: false }
    ],
    parts: ["Mechanical seal 32mm", "Gasket set", "Bearing grease"]
  },
  {
    id: "JOB-1003",
    customer: "Harbour Logistics",
    title: "Forklift charger fault",
    location: "Orugodawatta Warehouse",
    status: "Waiting Parts",
    priority: "High",
    technician: "Tharindu Silva",
    scheduled: "2026-07-08",
    quoted: 72500,
    invoice: "On Hold",
    notes: "Charger trips breaker after 15 minutes. Suspected rectifier module failure.",
    tasks: [
      { label: "Run input voltage test", done: true },
      { label: "Order rectifier module", done: false },
      { label: "Final load test", done: false }
    ],
    parts: ["Rectifier module", "Cooling fan", "Thermal paste"]
  },
  {
    id: "JOB-1004",
    customer: "Nuwara Tea Estate",
    title: "Dryer exhaust fan vibration",
    location: "Nuwara Eliya",
    status: "Completed",
    priority: "Low",
    technician: "Ravi Kumar",
    scheduled: "2026-07-02",
    quoted: 118000,
    invoice: "Sent",
    notes: "Fan bearing replaced and dynamic balance completed. Customer signed job card.",
    tasks: [
      { label: "Replace bearing", done: true },
      { label: "Balance fan wheel", done: true },
      { label: "Submit service report", done: true }
    ],
    parts: ["SKF bearing", "Locking collar", "Vibration report"]
  }
];

const seedTechnicians = [
  { name: "Nimal Perera", skill: "Mechanical drives", status: "Busy" },
  { name: "Ayesha Fernando", skill: "Pumps and chillers", status: "Available" },
  { name: "Tharindu Silva", skill: "Electrical diagnostics", status: "Busy" },
  { name: "Ravi Kumar", skill: "Fabrication and balancing", status: "Available" }
];

let jobs = loadJobs();
let technicians = loadTechnicians();
let selectedJobId = jobs[0]?.id;
let activeView = "dashboard";

const elements = {
  navItems: document.querySelectorAll(".nav-item"),
  sections: document.querySelectorAll(".screen-section"),
  dispatchPanel: document.querySelector('[data-panel="dispatch"]'),
  financePanel: document.querySelector('[data-panel="finance"]'),
  operationsSection: document.querySelector('[data-section="operations"]'),
  searchInput: document.querySelector("#searchInput"),
  statusFilter: document.querySelector("#statusFilter"),
  jobList: document.querySelector("#jobList"),
  detailPanel: document.querySelector("#detailPanel"),
  technicianList: document.querySelector("#technicianList"),
  invoiceList: document.querySelector("#invoiceList"),
  masterTechnicianList: document.querySelector("#masterTechnicianList"),
  addJobButton: document.querySelector("#addJobButton"),
  addTechnicianButton: document.querySelector("#addTechnicianButton"),
  resetSampleDataButton: document.querySelector("#resetSampleDataButton"),
  clearJobsButton: document.querySelector("#clearJobsButton"),
  jobDialog: document.querySelector("#jobDialog"),
  technicianDialog: document.querySelector("#technicianDialog"),
  closeDialogButton: document.querySelector("#closeDialogButton"),
  closeTechnicianDialogButton: document.querySelector("#closeTechnicianDialogButton"),
  jobForm: document.querySelector("#jobForm"),
  technicianForm: document.querySelector("#technicianForm"),
  todayJobs: document.querySelector("#todayJobs"),
  todaySummary: document.querySelector("#todaySummary"),
  openJobsMetric: document.querySelector("#openJobsMetric"),
  urgentJobsMetric: document.querySelector("#urgentJobsMetric"),
  revenueMetric: document.querySelector("#revenueMetric"),
  completionMetric: document.querySelector("#completionMetric"),
  jobCountAdmin: document.querySelector("#jobCountAdmin"),
  technicianCountAdmin: document.querySelector("#technicianCountAdmin")
};

function loadJobs() {
  const stored = localStorage.getItem(jobStorageKey);
  return stored ? JSON.parse(stored) : seedJobs;
}

function saveJobs() {
  localStorage.setItem(jobStorageKey, JSON.stringify(jobs));
}

function loadTechnicians() {
  const stored = localStorage.getItem(technicianStorageKey);
  return stored ? JSON.parse(stored) : seedTechnicians;
}

function saveTechnicians() {
  localStorage.setItem(technicianStorageKey, JSON.stringify(technicians));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value) {
  return `Rs. ${value.toLocaleString("en-LK")}`;
}

function filteredJobs() {
  const term = elements.searchInput.value.trim().toLowerCase();
  const status = elements.statusFilter.value;

  return jobs.filter((job) => {
    const haystack = `${job.id} ${job.customer} ${job.title} ${job.location} ${job.technician}`.toLowerCase();
    const matchesSearch = !term || haystack.includes(term);
    const matchesStatus = status === "all" || job.status === status;
    return matchesSearch && matchesStatus;
  });
}

function renderMetrics() {
  const open = jobs.filter((job) => job.status !== "Completed").length;
  const urgent = jobs.filter((job) => job.priority === "High" && job.status !== "Completed").length;
  const revenue = jobs.reduce((sum, job) => sum + job.quoted, 0);
  const completed = jobs.filter((job) => job.status === "Completed").length;
  const completion = jobs.length ? Math.round((completed / jobs.length) * 100) : 0;
  const today = jobs.filter((job) => job.scheduled === new Date().toISOString().slice(0, 10));

  elements.openJobsMetric.textContent = open;
  elements.urgentJobsMetric.textContent = urgent;
  elements.revenueMetric.textContent = money(revenue);
  elements.completionMetric.textContent = `${completion}%`;
  elements.todayJobs.textContent = `${today.length} site visit${today.length === 1 ? "" : "s"}`;
  elements.todaySummary.textContent = today.length
    ? today.map((job) => `${job.technician}: ${job.customer}`).join(" | ")
    : "No technician visits scheduled.";
}

function renderJobList() {
  const visibleJobs = filteredJobs();

  if (!visibleJobs.some((job) => job.id === selectedJobId)) {
    selectedJobId = visibleJobs[0]?.id || jobs[0]?.id;
  }

  if (!visibleJobs.length) {
    elements.jobList.innerHTML = '<p class="empty-state">No jobs found. Click New Job to create your first real job.</p>';
    return;
  }

  elements.jobList.innerHTML = visibleJobs
    .map(
      (job) => `
        <button class="job-card ${job.id === selectedJobId ? "active" : ""}" type="button" data-job-id="${job.id}">
          <div class="job-card-top">
            <span class="job-title">${escapeHtml(job.id)} · ${escapeHtml(job.title)}</span>
            <span class="priority ${escapeHtml(job.priority)}">${escapeHtml(job.priority)}</span>
          </div>
          <span>${escapeHtml(job.customer)}</span>
          <div class="job-card-top">
            <small class="muted">${escapeHtml(job.location)}</small>
            <span class="status">${escapeHtml(job.status)}</span>
          </div>
        </button>
      `
    )
    .join("");
}

function renderDetail() {
  const job = jobs.find((item) => item.id === selectedJobId);

  if (!job) {
    elements.detailPanel.innerHTML = "<p>No jobs match the current filters.</p>";
    return;
  }

  elements.detailPanel.innerHTML = `
    <div class="detail-top">
      <div>
        <p class="eyebrow">${escapeHtml(job.id)}</p>
        <h2>${escapeHtml(job.title)}</h2>
      </div>
      <span class="status">${escapeHtml(job.status)}</span>
    </div>

    <div class="detail-grid">
      <div class="mini-panel"><span>Customer</span><strong>${escapeHtml(job.customer)}</strong></div>
      <div class="mini-panel"><span>Technician</span><strong>${escapeHtml(job.technician)}</strong></div>
      <div class="mini-panel"><span>Schedule</span><strong>${escapeHtml(job.scheduled)}</strong></div>
      <div class="mini-panel"><span>Quote</span><strong>${money(job.quoted)}</strong></div>
    </div>

    <p>${escapeHtml(job.notes)}</p>

    <h2>Tasks</h2>
    ${job.tasks
      .map(
        (task, index) => `
          <label class="task-row">
            <span>${escapeHtml(task.label)}</span>
            <input type="checkbox" data-task-index="${index}" ${task.done ? "checked" : ""} />
          </label>
        `
      )
      .join("")}

    <h2>Parts and materials</h2>
    ${job.parts.map((part) => `<div class="meta-row"><span>${escapeHtml(part)}</span><strong>Required</strong></div>`).join("")}

    <div class="action-row">
      ${["New", "Scheduled", "In Progress", "Waiting Parts", "Completed"]
        .map((status) => `<button type="button" data-status="${status}">${status}</button>`)
        .join("")}
    </div>
  `;
}

function renderTechnicians() {
  if (!technicians.length) {
    elements.technicianList.innerHTML = '<p class="empty-state">No technicians yet. Add names in Master Data.</p>';
    return;
  }

  elements.technicianList.innerHTML = technicians
    .map((tech) => {
      const assigned = jobs.filter((job) => job.technician === tech.name && job.status !== "Completed").length;
      return `
        <div class="technician-row">
          <div>
            <strong>${escapeHtml(tech.name)}</strong>
            <div class="muted">${escapeHtml(tech.skill)}</div>
          </div>
          <div class="meta-row-inline">
            <span class="availability ${tech.status === "Busy" ? "busy" : ""}"></span>
            <span>${assigned} open</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderInvoices() {
  if (!jobs.length) {
    elements.invoiceList.innerHTML = '<p class="empty-state">No invoices yet. Create jobs first.</p>';
    return;
  }

  elements.invoiceList.innerHTML = jobs
    .map(
      (job) => `
        <div class="invoice-row">
          <div>
            <strong>${escapeHtml(job.customer)}</strong>
            <div class="muted">${escapeHtml(job.id)} · ${escapeHtml(job.invoice)}</div>
          </div>
          <span>${money(job.quoted)}</span>
        </div>
      `
    )
    .join("");
}

function renderMasterData() {
  elements.jobCountAdmin.textContent = jobs.length;
  elements.technicianCountAdmin.textContent = technicians.length;

  if (!technicians.length) {
    elements.masterTechnicianList.innerHTML = '<p class="empty-state">No technicians saved. Click Add Technician.</p>';
    return;
  }

  elements.masterTechnicianList.innerHTML = technicians
    .map(
      (tech) => `
        <div class="technician-row">
          <div>
            <strong>${escapeHtml(tech.name)}</strong>
            <div class="muted">${escapeHtml(tech.skill)} · ${escapeHtml(tech.status)}</div>
          </div>
          <button class="danger-link" type="button" data-remove-technician="${escapeHtml(tech.name)}">Remove</button>
        </div>
      `
    )
    .join("");
}

function renderTechnicianOptions() {
  const select = elements.jobForm.elements.technician;
  select.innerHTML = technicians.length
    ? technicians.map((tech) => `<option>${escapeHtml(tech.name)}</option>`).join("")
    : "<option>Unassigned</option>";
}

function setActiveView(view) {
  activeView = view;

  elements.navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.view === activeView);
  });

  elements.sections.forEach((section) => section.classList.add("is-hidden"));
  elements.dispatchPanel.classList.remove("is-hidden");
  elements.financePanel.classList.remove("is-hidden");
  elements.operationsSection.classList.remove("single-column");

  if (activeView === "dashboard") {
    document.querySelector('[data-section="dashboard"]').classList.remove("is-hidden");
    document.querySelector('[data-section="jobs"]').classList.remove("is-hidden");
    document.querySelector('[data-section="operations"]').classList.remove("is-hidden");
    return;
  }

  if (activeView === "jobs") {
    document.querySelector('[data-section="jobs"]').classList.remove("is-hidden");
    return;
  }

  if (activeView === "dispatch") {
    document.querySelector('[data-section="operations"]').classList.remove("is-hidden");
    elements.financePanel.classList.add("is-hidden");
    elements.operationsSection.classList.add("single-column");
    return;
  }

  if (activeView === "finance") {
    document.querySelector('[data-section="operations"]').classList.remove("is-hidden");
    elements.dispatchPanel.classList.add("is-hidden");
    elements.operationsSection.classList.add("single-column");
    return;
  }

  if (activeView === "master") {
    document.querySelector('[data-section="master"]').classList.remove("is-hidden");
  }
}

function render() {
  renderMetrics();
  renderJobList();
  renderDetail();
  renderTechnicians();
  renderInvoices();
  renderMasterData();
  renderTechnicianOptions();
  setActiveView(activeView);
}

function createJob(formData) {
  const currentNumbers = jobs.map((job) => Number(job.id.replace("JOB-", ""))).filter(Boolean);
  const nextNumber = currentNumbers.length ? Math.max(...currentNumbers) + 1 : 1001;
  const newJob = {
    id: `JOB-${nextNumber}`,
    customer: formData.get("customer"),
    title: formData.get("title"),
    location: formData.get("location"),
    status: "New",
    priority: formData.get("priority"),
    technician: formData.get("technician"),
    scheduled: formData.get("scheduled"),
    quoted: 0,
    invoice: "Not Ready",
    notes: formData.get("notes") || "No notes added.",
    tasks: [
      { label: "Confirm scope with customer", done: false },
      { label: "Complete site work", done: false },
      { label: "Prepare service report", done: false }
    ],
    parts: ["To be confirmed"]
  };

  jobs = [newJob, ...jobs];
  selectedJobId = newJob.id;
  saveJobs();
}

function createTechnician(formData) {
  const name = formData.get("name").trim();
  const exists = technicians.some((tech) => tech.name.toLowerCase() === name.toLowerCase());
  if (exists) return;

  technicians = [
    ...technicians,
    {
      name,
      skill: formData.get("skill").trim(),
      status: formData.get("status")
    }
  ];
  saveTechnicians();
}

elements.navItems.forEach((item) => {
  item.addEventListener("click", () => {
    setActiveView(item.dataset.view);
  });
});

elements.searchInput.addEventListener("input", render);
elements.statusFilter.addEventListener("change", render);

elements.jobList.addEventListener("click", (event) => {
  const card = event.target.closest("[data-job-id]");
  if (!card) return;
  selectedJobId = card.dataset.jobId;
  render();
});

elements.detailPanel.addEventListener("click", (event) => {
  const statusButton = event.target.closest("[data-status]");
  if (!statusButton) return;
  jobs = jobs.map((job) => (job.id === selectedJobId ? { ...job, status: statusButton.dataset.status } : job));
  saveJobs();
  render();
});

elements.detailPanel.addEventListener("change", (event) => {
  const checkbox = event.target.closest("[data-task-index]");
  if (!checkbox) return;
  const taskIndex = Number(checkbox.dataset.taskIndex);
  jobs = jobs.map((job) => {
    if (job.id !== selectedJobId) return job;
    const tasks = job.tasks.map((task, index) => (index === taskIndex ? { ...task, done: checkbox.checked } : task));
    return { ...job, tasks };
  });
  saveJobs();
  render();
});

elements.addJobButton.addEventListener("click", () => {
  elements.jobDialog.showModal();
});

elements.addTechnicianButton.addEventListener("click", () => {
  elements.technicianDialog.showModal();
});

elements.closeDialogButton.addEventListener("click", () => {
  elements.jobDialog.close();
});

elements.closeTechnicianDialogButton.addEventListener("click", () => {
  elements.technicianDialog.close();
});

elements.jobForm.addEventListener("submit", (event) => {
  event.preventDefault();
  createJob(new FormData(elements.jobForm));
  elements.jobForm.reset();
  elements.jobDialog.close();
  render();
});

elements.technicianForm.addEventListener("submit", (event) => {
  event.preventDefault();
  createTechnician(new FormData(elements.technicianForm));
  elements.technicianForm.reset();
  elements.technicianDialog.close();
  render();
});

elements.masterTechnicianList.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-technician]");
  if (!removeButton) return;
  technicians = technicians.filter((tech) => tech.name !== removeButton.dataset.removeTechnician);
  saveTechnicians();
  render();
});

elements.clearJobsButton.addEventListener("click", () => {
  const confirmed = window.confirm("Delete all jobs from this browser? Technician master data will stay.");
  if (!confirmed) return;
  jobs = [];
  selectedJobId = undefined;
  saveJobs();
  render();
});

elements.resetSampleDataButton.addEventListener("click", () => {
  jobs = seedJobs.map((job) => ({ ...job, tasks: job.tasks.map((task) => ({ ...task })), parts: [...job.parts] }));
  selectedJobId = jobs[0]?.id;
  saveJobs();
  render();
});

render();
