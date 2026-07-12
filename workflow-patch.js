function workflowEnsureQuotations(job) {
  const existing = Array.isArray(job.quotations) ? job.quotations : [];
  const quotations = [0, 1, 2].map((index) => ({
    contractor: existing[index]?.contractor || "",
    value: Number(existing[index]?.value) || 0
  }));

  if (!quotations.some((quote) => quote.value) && Number(job.quoted)) {
    quotations[0].value = Number(job.quoted);
  }

  return {
    ...job,
    quotations,
    tasks: Array.isArray(job.tasks) ? job.tasks.map((task) => ({ label: task.label || String(task) })) : []
  };
}

function workflowEnsureEmailRoles() {
  const requiredRoles = [
    {
      role: "Procurement",
      email: "procurement@basilur.lk",
      responsibility: "Parts, contractor quotations, and purchasing follow-up"
    },
    {
      role: "Finance",
      email: "finance@basilur.lk",
      responsibility: "Quotation approval, invoice value, and spend records"
    },
    {
      role: "Admin",
      email: "admin@basilur.lk",
      responsibility: "Management visibility and document control"
    },
    {
      role: "Information",
      email: "info@basilur.lk",
      responsibility: "People who receive job creation alerts for visibility"
    }
  ];

  const mergedRoles = requiredRoles.map((requiredRole) => {
    const savedRole = emailRoles.find((role) => role.role === requiredRole.role);
    return savedRole ? { ...requiredRole, ...savedRole } : requiredRole;
  });
  const extraRoles = emailRoles.filter((role) => !requiredRoles.some((requiredRole) => requiredRole.role === role.role));
  emailRoles = [...mergedRoles, ...extraRoles];
  saveEmailRoles();
}

function saveEmailRoleForm(roleForm) {
  const formData = new FormData(roleForm);
  const roleName = roleForm.dataset.emailRoleForm;
  const nextRole = {
    role: roleName,
    email: formData.get("email").trim(),
    responsibility: formData.get("responsibility").trim()
  };

  const existingRole = emailRoles.find((role) => role.role === roleName);
  emailRoles = existingRole
    ? emailRoles.map((role) => (role.role === roleName ? { ...role, ...nextRole } : role))
    : [...emailRoles, nextRole];
  saveEmailRoles();
  render();
  const updatedForm = Array.from(elements.emailRoleList.querySelectorAll("[data-email-role-form]")).find(
    (form) => form.dataset.emailRoleForm === roleName
  );
  if (updatedForm) {
    showSaveFeedback(updatedForm);
  }
}

function showSaveFeedback(container) {
  const button = container.querySelector('button[type="submit"], button');
  if (!button) return;

  const originalText = button.dataset.originalText || button.textContent;
  button.dataset.originalText = originalText;
  button.textContent = "Saved";
  button.classList.add("save-confirmed");
  window.clearTimeout(Number(button.dataset.saveTimer || 0));
  button.dataset.saveTimer = window.setTimeout(() => {
    button.textContent = originalText;
    button.classList.remove("save-confirmed");
  }, 1600);
}

function renderEmailRoles() {
  elements.emailRoleList.innerHTML = emailRoles
    .map(
      (role) => `
        <form class="technician-row technician-edit-row" data-email-role-form="${escapeHtml(role.role)}">
          <div>
            <strong>${escapeHtml(role.role)}</strong>
            <div class="master-input-grid">
              <label>
                Email recipients
                <input name="email" value="${escapeHtml(role.email)}" placeholder="${escapeHtml(role.role.toLowerCase())}@basilur.lk" />
                <small class="input-help">Use commas for more than one email.</small>
              </label>
              <label>
                Responsibility
                <input name="responsibility" value="${escapeHtml(role.responsibility)}" placeholder="Main responsibility" />
              </label>
            </div>
          </div>
          <div class="row-actions">
            <button type="submit">Save</button>
          </div>
        </form>
      `
    )
    .join("");
}

const sharedDatabaseEndpointStorageKey = "basilur-engineering-shared-database-url-v1";
const sharedDatabaseLastSyncStorageKey = "basilur-engineering-shared-database-last-sync-v1";
const originalSaveJobs = saveJobs;
const originalSaveTechnicians = saveTechnicians;
const originalSaveEmailRoles = saveEmailRoles;
const originalRenderMasterData = renderMasterData;

function getSharedDatabaseEndpoint() {
  return localStorage.getItem(sharedDatabaseEndpointStorageKey) || "";
}

function getSharedDatabasePayload() {
  return {
    app: "basilur-engineering-job-management",
    version: 1,
    updatedAt: new Date().toISOString(),
    jobs: jobs.filter((job) => job.status !== "Completed"),
    technicians,
    emailRoles
  };
}

function isFirebaseDatabaseEndpoint(endpoint) {
  return endpoint.includes("firebaseio.com") || endpoint.includes("firebasedatabase.app");
}

function setSharedDatabaseStatus(message, type = "info") {
  const status = document.querySelector("[data-shared-db-status]");
  if (!status) return;
  status.textContent = message;
  status.dataset.statusType = type;
}

function applySharedDatabasePayload(payload) {
  const data = payload?.data || payload;
  if (!data) {
    throw new Error("The shared database returned no data.");
  }

  jobs = Array.isArray(data.jobs) ? data.jobs.filter((job) => job.status !== "Completed").map(normalizeJob) : jobs;
  technicians = Array.isArray(data.technicians) ? data.technicians.map(normalizeTechnician) : technicians;
  emailRoles = Array.isArray(data.emailRoles) ? data.emailRoles.map(normalizeEmailRole) : emailRoles;
  selectedJobId = jobs[0]?.id;
  originalSaveJobs();
  originalSaveTechnicians();
  originalSaveEmailRoles();
}

async function loadSharedDatabase() {
  const endpoint = getSharedDatabaseEndpoint();
  if (!endpoint) {
    setSharedDatabaseStatus("Add the database URL first.", "error");
    return;
  }

  setSharedDatabaseStatus("Loading shared data...", "info");
  try {
    const response = await fetch(endpoint, { method: "GET" });
    if (!response.ok) {
      throw new Error(`Database load failed: ${response.status}`);
    }
    const payload = await response.json();
    applySharedDatabasePayload(payload);
    localStorage.setItem(sharedDatabaseLastSyncStorageKey, new Date().toISOString());
    render();
    setSharedDatabaseStatus("Shared data loaded.", "success");
  } catch (error) {
    setSharedDatabaseStatus(error.message, "error");
  }
}

async function saveSharedDatabase() {
  const endpoint = getSharedDatabaseEndpoint();
  if (!endpoint) {
    setSharedDatabaseStatus("Add the database URL first.", "error");
    return;
  }

  setSharedDatabaseStatus("Saving shared data...", "info");
  try {
    const isFirebase = isFirebaseDatabaseEndpoint(endpoint);
    const response = await fetch(endpoint, {
      method: isFirebase ? "PUT" : "POST",
      headers: { "Content-Type": isFirebase ? "application/json" : "text/plain;charset=utf-8" },
      body: JSON.stringify(getSharedDatabasePayload())
    });
    if (!response.ok) {
      throw new Error(`Database save failed: ${response.status}`);
    }
    localStorage.setItem(sharedDatabaseLastSyncStorageKey, new Date().toISOString());
    setSharedDatabaseStatus("Shared data saved.", "success");
  } catch (error) {
    setSharedDatabaseStatus(error.message, "error");
  }
}

function saveSharedDatabaseIfConnected() {
  if (!getSharedDatabaseEndpoint()) return;
  saveSharedDatabase();
}

function renderSharedDatabasePanel() {
  const masterSection = document.querySelector('[data-section="master"]');
  if (!masterSection) return;

  let panel = document.querySelector("[data-shared-database-panel]");
  if (!panel) {
    panel = document.createElement("div");
    panel.className = "shared-database-panel";
    panel.dataset.sharedDatabasePanel = "true";
    const emailHeading = Array.from(masterSection.querySelectorAll("h2")).find((heading) =>
      heading.textContent.includes("Email recipients")
    );
    masterSection.insertBefore(panel, emailHeading || masterSection.firstChild);
  }

  const endpoint = getSharedDatabaseEndpoint();
  const lastSync = localStorage.getItem(sharedDatabaseLastSyncStorageKey);
  panel.innerHTML = `
    <div class="section-header">
      <div>
        <p class="eyebrow">Shared Database</p>
        <h2>Team data sync</h2>
      </div>
      <span class="shared-db-pill">${endpoint ? "Connected" : "Not connected"}</span>
    </div>
    <p class="muted">Use this when more than one person must update the same jobs, quotations, parts, and email recipients.</p>
    <label>
      Database URL
      <input data-shared-db-url value="${escapeHtml(endpoint)}" placeholder="Paste Firebase database URL or Google Apps Script URL here" />
    </label>
    <div class="action-row compact-actions">
      <button class="ghost-button" type="button" data-save-shared-db-url>Save URL</button>
      <button class="ghost-button" type="button" data-load-shared-db>Load Shared Data</button>
      <button class="primary-button" type="button" data-save-shared-db>Save Shared Data</button>
    </div>
    <p class="shared-db-status" data-shared-db-status data-status-type="info">${
      lastSync ? `Last sync: ${new Date(lastSync).toLocaleString()}` : "Shared database is optional until the URL is added."
    }</p>
  `;
}

saveJobs = function () {
  originalSaveJobs();
};

saveTechnicians = function () {
  originalSaveTechnicians();
};

saveEmailRoles = function () {
  originalSaveEmailRoles();
};

renderMasterData = function () {
  originalRenderMasterData();
  renderSharedDatabasePanel();
};

document.addEventListener("click", (event) => {
  const saveUrlButton = event.target.closest("[data-save-shared-db-url]");
  const loadButton = event.target.closest("[data-load-shared-db]");
  const saveButton = event.target.closest("[data-save-shared-db]");

  if (saveUrlButton) {
    const input = document.querySelector("[data-shared-db-url]");
    localStorage.setItem(sharedDatabaseEndpointStorageKey, input.value.trim());
    renderSharedDatabasePanel();
    setSharedDatabaseStatus("Database URL saved.", "success");
    showSaveFeedback(saveUrlButton.parentElement);
  }

  if (loadButton) {
    loadSharedDatabase();
  }

  if (saveButton) {
    saveSharedDatabase();
  }
});

document.addEventListener(
  "click",
  (event) => {
    const completedButton = event.target.closest('[data-status="Completed"]');
    if (!completedButton) return;
    window.setTimeout(saveSharedDatabaseIfConnected, 0);
  },
  true
);

function quotationCount(job) {
  return job.quotations.filter((quote) => quote.contractor || quote.value).length;
}

function selectedQuotationValue(job) {
  const values = job.quotations.map((quote) => Number(quote.value) || 0).filter(Boolean);
  return values.length ? Math.min(...values) : Number(job.quoted) || 0;
}

function collectTasks(formData) {
  const tasks = [1, 2, 3]
    .map((index) => formData.get(`task${index}`)?.trim())
    .filter(Boolean)
    .map((label) => ({ label }));

  return tasks.length
    ? tasks
    : [
        { label: "Confirm scope with contractor" },
        { label: "Complete outside contractor work" },
        { label: "Attach invoice and completion approval" }
      ];
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
    quotations: [
      { contractor: "", value: 0 },
      { contractor: "", value: 0 },
      { contractor: "", value: 0 }
    ],
    invoice: "Not Ready",
    notes: formData.get("notes") || "No notes added.",
    tasks: collectTasks(formData),
    parts: collectParts(formData),
    documents: []
  };

  jobs = [newJob, ...jobs];
  selectedJobId = newJob.id;
  saveJobs();
  return newJob;
}

function renderMetrics() {
  const open = jobs.filter((job) => job.status !== "Completed").length;
  const urgent = jobs.filter((job) => job.priority === "High" && job.status !== "Completed").length;
  const revenue = jobs.reduce((sum, job) => sum + selectedQuotationValue(job), 0);
  const pendingQuotes = jobs.filter((job) => quotationCount(job) < 3).length;

  elements.openJobsMetric.textContent = open;
  elements.urgentJobsMetric.textContent = urgent;
  elements.revenueMetric.textContent = money(revenue);
  elements.completionMetric.textContent = pendingQuotes;
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
      <div class="mini-panel"><span>Job site / department</span><strong>${escapeHtml(job.customer)}</strong></div>
      <div class="mini-panel"><span>Technician</span><strong>${escapeHtml(job.technician)}</strong></div>
      <div class="mini-panel"><span>Schedule</span><strong>${escapeHtml(job.scheduled)}</strong></div>
      <div class="mini-panel"><span>Best quotation</span><strong>${money(selectedQuotationValue(job))}</strong></div>
    </div>

    <p>${escapeHtml(job.notes)}</p>

    <h2>Tasks</h2>
    ${job.tasks
      .map(
        (task) => `
          <div class="task-row">
            <span>${escapeHtml(task.label)}</span>
          </div>
        `
      )
      .join("")}

    <h2>Procurement quotations</h2>
    <form class="quotation-table" data-quotation-form>
      ${job.quotations
        .map(
          (quote, index) => `
            <div class="quotation-row">
              <span>Quote ${index + 1}</span>
              <input name="quoteContractor${index + 1}" value="${escapeHtml(quote.contractor)}" placeholder="Contractor name" />
              <input name="quoteValue${index + 1}" type="number" min="0" step="1000" value="${quote.value || ""}" placeholder="Value" />
            </div>
          `
        )
        .join("")}
      <button type="submit">Save quotations</button>
      <p class="muted">Procurement may proceed with one quotation when only one is available.</p>
    </form>

    <h2>Parts and materials</h2>
    ${
      job.parts.length
        ? job.parts
            .map(
              (part, index) => `
                <form class="part-row" data-part-price-form="${index}">
                  <div>
                    <strong>${escapeHtml(part.name)}</strong>
                    <span class="muted">Qty: ${escapeHtml(part.quantity)}</span>
                  </div>
                  <label>
                    Procurement price
                    <input name="unitPrice" type="number" min="0" step="100" value="${part.unitPrice}" />
                  </label>
                  <strong>${money(partTotal(part))}</strong>
                  <button type="submit">Save</button>
                </form>
              `
            )
            .join("")
        : '<p class="empty-state">No parts requested for this job.</p>'
    }

    <h2>Documents</h2>
    <div class="document-upload">
      <input id="documentUpload" type="file" multiple data-document-upload />
      <small class="muted">This first version stores document names in this browser. Real file storage needs a database later.</small>
    </div>
    ${
      job.documents.length
        ? job.documents
            .map(
              (doc, index) => `
                <div class="meta-row">
                  <span>${escapeHtml(doc.name)}</span>
                  <button class="danger-link" type="button" data-remove-document="${index}">Remove</button>
                </div>
              `
            )
            .join("")
        : '<p class="empty-state">No documents attached.</p>'
    }

    <h2>Status email routing</h2>
    ${Object.entries(statusEmailRules)
      .map(
        ([status, rule]) => `
          <div class="meta-row">
            <span>${escapeHtml(status)}</span>
            <strong>${escapeHtml(rule.roles.join(", "))}</strong>
          </div>
        `
      )
      .join("")}
    <p class="muted">Emails open only when you change the job status. Technician and superior emails are not used.</p>

    <div class="action-row">
      ${["New", "Waiting Parts", "Collecting 3 Quotations", "In Progress", "Completed"]
        .map((status) => `<button type="button" data-status="${status}">${status}</button>`)
        .join("")}
    </div>
  `;
}

function renderTechnicians() {
  const pending = jobs.filter(
    (job) =>
      job.status === "Waiting Parts" ||
      job.status === "Collecting 3 Quotations" ||
      quotationCount(job) < 3 ||
      job.parts.some((part) => !part.unitPrice)
  );

  if (!pending.length) {
    elements.procurementList.innerHTML = '<p class="empty-state">No pending procurement jobs.</p>';
    return;
  }

  elements.procurementList.innerHTML = pending
    .map((job) => {
      const unpriced = job.parts.filter((part) => !part.unitPrice).length;
      const quotes = quotationCount(job);
      return `
        <div class="technician-row">
          <div>
            <strong>${escapeHtml(job.id)} · ${escapeHtml(job.title)}</strong>
            <div class="muted">${escapeHtml(job.customer)} · ${escapeHtml(job.status)} · ${quotes}/3 quotations</div>
          </div>
          <div class="meta-row-inline">
            <span class="availability busy"></span>
            <span>${unpriced} unpriced part${unpriced === 1 ? "" : "s"}</span>
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
          <span>${money(selectedQuotationValue(job) + job.parts.reduce((sum, part) => sum + partTotal(part), 0))}</span>
        </div>
      `
    )
    .join("");
}

function openStatusEmail(job, status) {
  const rule = statusEmailRules[status];
  if (!rule || !job) return;

  const recipients = rule.roles.flatMap((roleName) => splitEmails(emailRoles.find((role) => role.role === roleName)?.email));

  if (!recipients.length) {
    window.alert("Add email recipients in Master Data before sending this status alert.");
    return;
  }

  const subject = encodeURIComponent(`${rule.label}: ${job.id} ${job.title}`);
  const body = encodeURIComponent(
    `${rule.label}\n\nJob: ${job.id}\nJob site / department: ${job.customer}\nLocation: ${job.location}\nTechnician approver: ${job.technician}\nBest quotation: ${money(selectedQuotationValue(job))}\nParts requested:\n${job.parts.map((part) => `- ${part.name}: ${part.quantity}`).join("\n") || "No parts requested"}\n\nNotes:\n${job.notes}\n`
  );
  window.location.href = `mailto:${recipients.map((email) => encodeURIComponent(email)).join(",")}?subject=${subject}&body=${body}`;
}

elements.detailPanel.addEventListener("submit", (event) => {
  const quotationForm = event.target.closest("[data-quotation-form]");
  if (!quotationForm) return;
  event.preventDefault();

  const formData = new FormData(quotationForm);
  jobs = jobs.map((job) => {
    if (job.id !== selectedJobId) return job;
    const quotations = [1, 2, 3].map((index) => ({
      contractor: formData.get(`quoteContractor${index}`)?.trim() || "",
      value: Number(formData.get(`quoteValue${index}`)) || 0
    }));
    return { ...job, quotations, quoted: selectedQuotationValue({ ...job, quotations }) };
  });
  saveJobs();
  render();
  const updatedForm = elements.detailPanel.querySelector("[data-quotation-form]");
  if (updatedForm) {
    showSaveFeedback(updatedForm);
  }
});

document.addEventListener(
  "submit",
  (event) => {
    const form = event.target.closest("form");
    if (!form) return;
    window.setTimeout(() => showSaveFeedback(form), 0);
  },
  true
);

elements.emailRoleList.addEventListener(
  "submit",
  (event) => {
    const roleForm = event.target.closest("[data-email-role-form]");
    if (!roleForm) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    saveEmailRoleForm(roleForm);
  },
  true
);

jobs = jobs.map(workflowEnsureQuotations);
workflowEnsureEmailRoles();
saveJobs();
render();
