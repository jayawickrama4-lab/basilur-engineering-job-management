const storageKey = "basilur-engineering-jobs-v1";

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

const technicians = [
  { name: "Nimal Perera", skill: "Mechanical drives", status: "Busy" },
  { name: "Ayesha Fernando", skill: "Pumps and chillers", status: "Available" },
  { name: "Tharindu Silva", skill: "Electrical diagnostics", status: "Busy" },
  { name: "Ravi Kumar", skill: "Fabrication and balancing", status: "Available" }
];

let jobs = loadJobs();
let selectedJobId = jobs[0]?.id;

const elements = {
  searchInput: document.querySelector("#searchInput"),
  statusFilter: document.querySelector("#statusFilter"),
  jobList: document.querySelector("#jobList"),
  detailPanel: document.querySelector("#detailPanel"),
  technicianList: document.querySelector("#technicianList"),
  invoiceList: document.querySelector("#invoiceList"),
  addJobButton: document.querySelector("#addJobButton"),
  jobDialog: document.querySelector("#jobDialog"),
  closeDialogButton: document.querySelector("#closeDialogButton"),
  jobForm: document.querySelector("#jobForm"),
  todayJobs: document.querySelector("#todayJobs"),
  todaySummary: document.querySelector("#todaySummary"),
  openJobsMetric: document.querySelector("#openJobsMetric"),
  urgentJobsMetric: document.querySelector("#urgentJobsMetric"),
  revenueMetric: document.querySelector("#revenueMetric"),
  completionMetric: document.querySelector("#completionMetric")
};

function loadJobs() {
  const stored = localStorage.getItem(storageKey);
  return stored ? JSON.parse(stored) : seedJobs;
}

function saveJobs() {
  localStorage.setItem(storageKey, JSON.stringify(jobs));
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

  elements.jobList.innerHTML = visibleJobs
    .map(
      (job) => `
        <button class="job-card ${job.id === selectedJobId ? "active" : ""}" type="button" data-job-id="${job.id}">
          <div class="job-card-top">
            <span class="job-title">${job.id} · ${job.title}</span>
            <span class="priority ${job.priority}">${job.priority}</span>
          </div>
          <span>${job.customer}</span>
          <div class="job-card-top">
            <small class="muted">${job.location}</small>
            <span class="status">${job.status}</span>
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
        <p class="eyebrow">${job.id}</p>
        <h2>${job.title}</h2>
      </div>
      <span class="status">${job.status}</span>
    </div>

    <div class="detail-grid">
      <div class="mini-panel"><span>Customer</span><strong>${job.customer}</strong></div>
      <div class="mini-panel"><span>Technician</span><strong>${job.technician}</strong></div>
      <div class="mini-panel"><span>Schedule</span><strong>${job.scheduled}</strong></div>
      <div class="mini-panel"><span>Quote</span><strong>${money(job.quoted)}</strong></div>
    </div>

    <p>${job.notes}</p>

    <h2>Tasks</h2>
    ${job.tasks
      .map(
        (task, index) => `
          <label class="task-row">
            <span>${task.label}</span>
            <input type="checkbox" data-task-index="${index}" ${task.done ? "checked" : ""} />
          </label>
        `
      )
      .join("")}

    <h2>Parts and materials</h2>
    ${job.parts.map((part) => `<div class="meta-row"><span>${part}</span><strong>Required</strong></div>`).join("")}

    <div class="action-row">
      ${["New", "Scheduled", "In Progress", "Waiting Parts", "Completed"]
        .map((status) => `<button type="button" data-status="${status}">${status}</button>`)
        .join("")}
    </div>
  `;
}

function renderTechnicians() {
  elements.technicianList.innerHTML = technicians
    .map((tech) => {
      const assigned = jobs.filter((job) => job.technician === tech.name && job.status !== "Completed").length;
      return `
        <div class="technician-row">
          <div>
            <strong>${tech.name}</strong>
            <div class="muted">${tech.skill}</div>
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
  elements.invoiceList.innerHTML = jobs
    .map(
      (job) => `
        <div class="invoice-row">
          <div>
            <strong>${job.customer}</strong>
            <div class="muted">${job.id} · ${job.invoice}</div>
          </div>
          <span>${money(job.quoted)}</span>
        </div>
      `
    )
    .join("");
}

function render() {
  renderMetrics();
  renderJobList();
  renderDetail();
  renderTechnicians();
  renderInvoices();
}

function createJob(formData) {
  const nextNumber = Math.max(...jobs.map((job) => Number(job.id.replace("JOB-", "")))) + 1;
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

elements.closeDialogButton.addEventListener("click", () => {
  elements.jobDialog.close();
});

elements.jobForm.addEventListener("submit", (event) => {
  event.preventDefault();
  createJob(new FormData(elements.jobForm));
  elements.jobForm.reset();
  elements.jobDialog.close();
  render();
});

render();
