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
});

jobs = jobs.map(workflowEnsureQuotations);
saveJobs();
render();
