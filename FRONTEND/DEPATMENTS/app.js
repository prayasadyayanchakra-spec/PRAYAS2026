/* app.js */
/* =========================================================
   Internal Fund Request & Transfer System (SPA)
   Storage: LocalStorage
   RBAC: HEAD vs DEPARTMENT
   Audit-first transitions with timestamps
   ========================================================= */

/* =========================
   CONFIG / CONSTANTS
   ========================= */
const STORAGE_KEYS = {
  users: "users",
  requests: "requests",
  transactions: "transactions",
  ledgerEntries: "ledgerEntries",
  auditLogs: "auditLogs",
  currentUser: "currentUser",
  seedFlag: "seedEnabled"
};

const ROLES = { HEAD: "HEAD", DEPARTMENT: "DEPARTMENT" };

const REQUEST_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  ASSIGNED: "ASSIGNED",
  PAID_PENDING_RECEIPT: "PAID_PENDING_RECEIPT",
  COMPLETED: "COMPLETED"
};

const TXN_STATUS = {
  ASSIGNED: "ASSIGNED",
  PAYMENT_INITIATED: "PAYMENT_INITIATED",
  PAYMENT_CONFIRMED_BY_PAYER: "PAYMENT_CONFIRMED_BY_PAYER",
  CASH_RECEIPT_CONFIRMED_BY_RECEIVER: "CASH_RECEIPT_CONFIRMED_BY_RECEIVER",
  COMPLETED: "COMPLETED"
};

const DEPARTMENTS = Array.from({ length: 10 }, (_, i) => `DEPARTMENT${i + 1}`);

const HARD_CODED_USERS = [
  { username: "HEAD", role: ROLES.HEAD, password: "Head@12345!", department: "HEAD" },
  { username: "DEPARTMENT1", role: ROLES.DEPARTMENT, password: "Q7@vR2!mZ9#x", department: "DEPARTMENT1" },
  { username: "DEPARTMENT2", role: ROLES.DEPARTMENT, password: "kP4$Tn8^Aq1*", department: "DEPARTMENT2" },
  { username: "DEPARTMENT3", role: ROLES.DEPARTMENT, password: "X!5cD@3Lw7%r", department: "DEPARTMENT3" },
  { username: "DEPARTMENT4", role: ROLES.DEPARTMENT, password: "9u#Bz2&FhP6!", department: "DEPARTMENT4" },
  { username: "DEPARTMENT5", role: ROLES.DEPARTMENT, password: "R8^sJ1@tQ4k", department: "DEPARTMENT5" },
  { username: "DEPARTMENT6", role: ROLES.DEPARTMENT, password: "m3!Yw$Z7xC2%", department: "DEPARTMENT6" },
  { username: "DEPARTMENT7", role: ROLES.DEPARTMENT, password: "H6@pL!9dV#5a", department: "DEPARTMENT7" },
  { username: "DEPARTMENT8", role: ROLES.DEPARTMENT, password: "tK2^F8e@1M$", department: "DEPARTMENT8" },
  { username: "DEPARTMENT9", role: ROLES.DEPARTMENT, password: "Z!4nX7%bR3q@", department: "DEPARTMENT9" },
  { username: "DEPARTMENT10", role: ROLES.DEPARTMENT, password: "A5#cP2!vT9^L", department: "DEPARTMENT10" }
];

// Toggle sample seed (set true for initial demo, then false for clean ops)
const SEED_SAMPLE_DATA = true;

/* =========================
   UTILITIES
   ========================= */
function nowISO() { return new Date().toISOString(); }
function isoReadable(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function uuid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  // Fallback (not cryptographically strong; acceptable for deterministic local demo)
  return "id-" + Date.now().toString(16) + "-" + Math.random().toString(16).slice(2);
}

// Generate formatted Request ID (REQU0000001, REQU0000002, etc.)
function generateRequestId() {
  const counter = Store.get("requestIdCounter", 0);
  const newCounter = counter + 1;
  Store.set("requestIdCounter", newCounter);
  return `REQU${String(newCounter).padStart(7, "0")}`;
}

// Generate formatted Transaction ID (TRAN0000001, TRAN0000002, etc.)
function generateTransactionId() {
  const counter = Store.get("transactionIdCounter", 0);
  const newCounter = counter + 1;
  Store.set("transactionIdCounter", newCounter);
  return `TRAN${String(newCounter).padStart(7, "0")}`;
}

function toNumber(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : NaN;
}
function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, s => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[s]));
}
function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

/* =========================
   STORAGE LAYER
   ========================= */
const Store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  ensureKey(key, defaultValue) {
    if (localStorage.getItem(key) === null) this.set(key, defaultValue);
  }
};

function initStorage() {
  Store.ensureKey(STORAGE_KEYS.users, HARD_CODED_USERS);
  Store.ensureKey(STORAGE_KEYS.requests, []);
  Store.ensureKey(STORAGE_KEYS.transactions, []);
  Store.ensureKey(STORAGE_KEYS.ledgerEntries, []);
  Store.ensureKey(STORAGE_KEYS.auditLogs, []);
  Store.ensureKey(STORAGE_KEYS.seedFlag, SEED_SAMPLE_DATA);
  Store.ensureKey("requestIdCounter", 0);
  Store.ensureKey("transactionIdCounter", 0);

  // Seed sample request(s) only once and only if enabled
  const seedEnabled = Store.get(STORAGE_KEYS.seedFlag, false);
  const requests = Store.get(STORAGE_KEYS.requests, []);
  if (seedEnabled && requests.length === 0) {
    const sample = {
      requestId: "REQU0000001",
      requestedByDepartment: "DEPARTMENT2",
      requestedAmount: 25000,
      purpose: "Quarterly vendor settlement bridging",
      status: REQUEST_STATUS.PENDING,
      headDecision: { decisionBy: "", decisionAt: "", decisionNote: "" },
      createdAt: nowISO()
    };
    Store.set(STORAGE_KEYS.requests, [sample]);
    Store.set("requestIdCounter", 1);
    logAudit("SYSTEM", "SEED_REQUEST_CREATED", "Request", sample.requestId, { sample: true });
  }
}

/* =========================
   SESSION / RBAC
   ========================= */
function getCurrentUser() { return Store.get(STORAGE_KEYS.currentUser, null); }
function setCurrentUser(user) { Store.set(STORAGE_KEYS.currentUser, user); }
function clearSession() { localStorage.removeItem(STORAGE_KEYS.currentUser); }

function authenticateUser(username, password) {
  const users = Store.get(STORAGE_KEYS.users, []);
  const u = users.find(x => x.username === username && x.password === password);
  if (!u) return null;
  return { username: u.username, role: u.role, department: u.department };
}

function requireHead(user) { return user && user.role === ROLES.HEAD; }
function requireDept(user) { return user && user.role === ROLES.DEPARTMENT; }

/* =========================
   AUDIT LOGGING
   ========================= */
function logAudit(actor, action, entityType, entityId, details) {
  const logs = Store.get(STORAGE_KEYS.auditLogs, []);
  const record = {
    logId: uuid(),
    actor,
    action,
    entityType,
    entityId,
    timestamp: nowISO(),
    details: details ?? {}
  };
  logs.push(record);
  Store.set(STORAGE_KEYS.auditLogs, logs);
  return record;
}

/* =========================
   DATA ACCESS HELPERS
   ========================= */
function getRequests() { return Store.get(STORAGE_KEYS.requests, []); }
function setRequests(list) { Store.set(STORAGE_KEYS.requests, list); }

function getTransactions() { return Store.get(STORAGE_KEYS.transactions, []); }
function setTransactions(list) { Store.set(STORAGE_KEYS.transactions, list); }

function getLedgerEntries() { return Store.get(STORAGE_KEYS.ledgerEntries, []); }
function setLedgerEntries(list) { Store.set(STORAGE_KEYS.ledgerEntries, list); }

function getAuditLogs() { return Store.get(STORAGE_KEYS.auditLogs, []); }

function findRequestById(requestId) {
  return getRequests().find(r => r.requestId === requestId) || null;
}
function findTxnById(transactionId) {
  return getTransactions().find(t => t.transactionId === transactionId) || null;
}
function findTxnByRequestId(requestId) {
  return getTransactions().find(t => t.requestId === requestId) || null;
}

/* =========================
   WORKFLOW FUNCTIONS
   ========================= */
function createRequest(amount, purpose, currentUser) {
  if (!requireDept(currentUser)) throw new Error("Unauthorized");
  const n = toNumber(amount);
  if (!(n > 0)) throw new Error("Amount must be numeric and > 0.");
  const p = String(purpose || "").trim();
  if (!p) throw new Error("Purpose is required.");

  const req = {
    requestId: generateRequestId(),
    requestedByDepartment: currentUser.department,
    requestedAmount: n,
    purpose: p,
    status: REQUEST_STATUS.PENDING,
    headDecision: { decisionBy: "", decisionAt: "", decisionNote: "" },
    createdAt: nowISO()
  };

  const requests = getRequests();
  requests.push(req);
  setRequests(requests);

  logAudit(currentUser.username, "REQUEST_CREATED", "Request", req.requestId, {
    requestedAmount: n,
    purpose: p,
    department: currentUser.department
  });

  return req;
}

function approveRequest(requestId, decisionNote, currentUser) {
  if (!requireHead(currentUser)) throw new Error("Unauthorized");
  const requests = getRequests();
  const req = requests.find(r => r.requestId === requestId);
  if (!req) throw new Error("Request not found.");
  if (req.status !== REQUEST_STATUS.PENDING) throw new Error("Only PENDING requests can be approved.");

  req.status = REQUEST_STATUS.APPROVED;
  req.headDecision = {
    decisionBy: currentUser.username,
    decisionAt: nowISO(),
    decisionNote: String(decisionNote || "").trim()
  };
  setRequests(requests);

  logAudit(currentUser.username, "REQUEST_APPROVED", "Request", requestId, {
    decisionNote: req.headDecision.decisionNote
  });

  return req;
}

function rejectRequest(requestId, decisionNote, currentUser) {
  if (!requireHead(currentUser)) throw new Error("Unauthorized");
  const requests = getRequests();
  const req = requests.find(r => r.requestId === requestId);
  if (!req) throw new Error("Request not found.");
  if (req.status !== REQUEST_STATUS.PENDING) throw new Error("Only PENDING requests can be rejected.");

  req.status = REQUEST_STATUS.REJECTED;
  req.headDecision = {
    decisionBy: currentUser.username,
    decisionAt: nowISO(),
    decisionNote: String(decisionNote || "").trim()
  };
  setRequests(requests);

  logAudit(currentUser.username, "REQUEST_REJECTED", "Request", requestId, {
    decisionNote: req.headDecision.decisionNote
  });

  return req;
}

function assignPayer(requestId, payerDepartment, headOrderNote, currentUser) {
  if (!requireHead(currentUser)) throw new Error("Unauthorized");
  const requests = getRequests();
  const req = requests.find(r => r.requestId === requestId);
  if (!req) throw new Error("Request not found.");
  if (req.status !== REQUEST_STATUS.APPROVED) throw new Error("Request must be APPROVED before assignment.");

  const receiver = req.requestedByDepartment;
  const payer = String(payerDepartment || "").trim();

  if (!DEPARTMENTS.includes(payer)) throw new Error("Invalid payer department.");
  // Default guardrail: payer cannot be the receiver
  if (payer === receiver) throw new Error("Payer cannot be the receiver (default control).");

  // Create transaction (only one per request)
  if (findTxnByRequestId(requestId)) throw new Error("Transaction already exists for this request.");

  const txn = {
    transactionId: generateTransactionId(),
    requestId: req.requestId,
    payerDepartment: payer,
    receiverDepartment: receiver,
    amount: req.requestedAmount,
    status: TXN_STATUS.ASSIGNED,
    timestamps: {
      assignedAt: nowISO(),
      paymentInitiatedAt: "",
      payerConfirmedAt: "",
      receiverConfirmedAt: "",
      completedAt: ""
    },
    notes: {
      headOrderNote: String(headOrderNote || "").trim(),
      payerPaymentNote: "",
      receiverReceiptNote: ""
    }
  };

  req.status = REQUEST_STATUS.ASSIGNED;

  const txns = getTransactions();
  txns.push(txn);

  setRequests(requests);
  setTransactions(txns);

  logAudit(currentUser.username, "PAYER_ASSIGNED", "Transaction", txn.transactionId, {
    requestId: req.requestId,
    payerDepartment: payer,
    receiverDepartment: receiver,
    headOrderNote: txn.notes.headOrderNote
  });
  logAudit(currentUser.username, "REQUEST_STATUS_UPDATED", "Request", req.requestId, {
    newStatus: req.status,
    transactionId: txn.transactionId
  });

  return txn;
}

function initiatePayment(transactionId, payerPaymentNote, currentUser) {
  if (!requireDept(currentUser)) throw new Error("Unauthorized");
  const txns = getTransactions();
  const txn = txns.find(t => t.transactionId === transactionId);
  if (!txn) throw new Error("Transaction not found.");
  if (txn.payerDepartment !== currentUser.department) throw new Error("Not authorized for this transaction.");
  if (txn.status !== TXN_STATUS.ASSIGNED) throw new Error("Only ASSIGNED transactions can be initiated.");

  txn.status = TXN_STATUS.PAYMENT_INITIATED;
  txn.timestamps.paymentInitiatedAt = nowISO();
  txn.notes.payerPaymentNote = String(payerPaymentNote || "").trim();

  setTransactions(txns);

  logAudit(currentUser.username, "PAYMENT_INITIATED", "Transaction", transactionId, {
    payerPaymentNote: txn.notes.payerPaymentNote
  });

  return txn;
}

function confirmPaymentSent(transactionId, payerPaymentNote, currentUser) {
  if (!requireDept(currentUser)) throw new Error("Unauthorized");
  const txns = getTransactions();
  const txn = txns.find(t => t.transactionId === transactionId);
  if (!txn) throw new Error("Transaction not found.");
  if (txn.payerDepartment !== currentUser.department) throw new Error("Not authorized for this transaction.");
  if (![TXN_STATUS.ASSIGNED, TXN_STATUS.PAYMENT_INITIATED].includes(txn.status)) {
    throw new Error("Payer can confirm payment only after assignment (and optionally after initiation).");
  }

  txn.status = TXN_STATUS.PAYMENT_CONFIRMED_BY_PAYER;
  txn.timestamps.payerConfirmedAt = nowISO();
  if (String(payerPaymentNote || "").trim()) txn.notes.payerPaymentNote = String(payerPaymentNote).trim();

  // Update request status to PAID_PENDING_RECEIPT
  const requests = getRequests();
  const req = requests.find(r => r.requestId === txn.requestId);
  if (!req) throw new Error("Linked request not found.");
  req.status = REQUEST_STATUS.PAID_PENDING_RECEIPT;

  setTransactions(txns);
  setRequests(requests);

  logAudit(currentUser.username, "PAYMENT_CONFIRMED_BY_PAYER", "Transaction", transactionId, {
    payerPaymentNote: txn.notes.payerPaymentNote
  });
  logAudit(currentUser.username, "REQUEST_STATUS_UPDATED", "Request", req.requestId, {
    newStatus: req.status,
    transactionId
  });

  return txn;
}

function confirmCashReceived(transactionId, receiverReceiptNote, currentUser) {
  if (!requireDept(currentUser)) throw new Error("Unauthorized");
  const txns = getTransactions();
  const txn = txns.find(t => t.transactionId === transactionId);
  if (!txn) throw new Error("Transaction not found.");
  if (txn.receiverDepartment !== currentUser.department) throw new Error("Not authorized for this transaction.");
  if (txn.status !== TXN_STATUS.PAYMENT_CONFIRMED_BY_PAYER) {
    throw new Error("Receiver can confirm receipt only after payer confirms payment.");
  }

  // Receiver confirmation
  txn.status = TXN_STATUS.CASH_RECEIPT_CONFIRMED_BY_RECEIVER;
  txn.timestamps.receiverConfirmedAt = nowISO();
  txn.notes.receiverReceiptNote = String(receiverReceiptNote || "").trim();

  // Complete transaction
  txn.status = TXN_STATUS.COMPLETED;
  txn.timestamps.completedAt = nowISO();

  // Update request status to COMPLETED
  const requests = getRequests();
  const req = requests.find(r => r.requestId === txn.requestId);
  if (!req) throw new Error("Linked request not found.");
  req.status = REQUEST_STATUS.COMPLETED;

  setTransactions(txns);
  setRequests(requests);

  logAudit(currentUser.username, "CASH_RECEIPT_CONFIRMED_BY_RECEIVER", "Transaction", transactionId, {
    receiverReceiptNote: txn.notes.receiverReceiptNote
  });

  // Post ledger entries only upon completion
  postLedgerEntries(txn, currentUser);

  logAudit(currentUser.username, "TRANSACTION_COMPLETED", "Transaction", transactionId, {
    completedAt: txn.timestamps.completedAt
  });
  logAudit(currentUser.username, "REQUEST_STATUS_UPDATED", "Request", req.requestId, {
    newStatus: req.status,
    transactionId
  });

  return txn;
}

function postLedgerEntries(txn, currentUser) {
  const entries = getLedgerEntries();
  const createdAt = nowISO();

  const payerEntry = {
    entryId: uuid(),
    department: txn.payerDepartment,
    type: "DEBIT",
    amount: txn.amount,
    counterparty: txn.receiverDepartment,
    reference: {
      requestId: txn.requestId,
      transactionId: txn.transactionId
    },
    description: `Inter-department transfer to ${txn.receiverDepartment}`,
    createdAt
  };

  const receiverEntry = {
    entryId: uuid(),
    department: txn.receiverDepartment,
    type: "CREDIT",
    amount: txn.amount,
    counterparty: txn.payerDepartment,
    reference: {
      requestId: txn.requestId,
      transactionId: txn.transactionId
    },
    description: `Inter-department receipt from ${txn.payerDepartment}`,
    createdAt
  };

  entries.push(payerEntry, receiverEntry);
  setLedgerEntries(entries);

  logAudit(currentUser.username, "LEDGER_POSTED", "Ledger", payerEntry.entryId, payerEntry);
  logAudit(currentUser.username, "LEDGER_POSTED", "Ledger", receiverEntry.entryId, receiverEntry);
}

/* =========================
   PDF GENERATION (COMPLETED ONLY)
   ========================= */
async function generatePDF(transactionId, currentUser) {
  const txn = findTxnById(transactionId);
  if (!txn) throw new Error("Transaction not found.");
  if (txn.status !== TXN_STATUS.COMPLETED) throw new Error("PDF available only after COMPLETED.");

  // RBAC: HEAD can generate any; DEPT can generate if payer or receiver
  if (currentUser.role !== ROLES.HEAD) {
    const dept = currentUser.department;
    if (![txn.payerDepartment, txn.receiverDepartment].includes(dept)) {
      throw new Error("Unauthorized");
    }
  }

  const req = findRequestById(txn.requestId);
  if (!req) throw new Error("Linked request not found.");

  const { jsPDF } = window.jspdf;
  if (!jsPDF) throw new Error("jsPDF not loaded. Check CDN availability.");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const docNo = `DOC-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${transactionId.slice(0, 8)}`;
  const printedAt = nowISO();

  const title = "PRAYAS ADHAYANA CHAKRA";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);

  // Try to load logo (relative to DEPATMENTS folder)
  async function loadImageDataUrl(path) {
    try {
      const resp = await fetch(path);
      if (!resp.ok) throw new Error('logo fetch failed');
      const blob = await resp.blob();
      return await new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.onerror = rej;
        fr.readAsDataURL(blob);
      });
    } catch (err) {
      return null;
    }
  }

  const logoPath = "../IMAGES/Prayas/logo.jpg";
  const logoDataUrl = await loadImageDataUrl(logoPath);
  let titleX = 40;
  let titleY = 50;
  if (logoDataUrl) {
    try {
      const img = new Image();
      img.src = logoDataUrl;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
      const maxH = 40; const maxW = 80;
      const ratio = img.width && img.height ? Math.min(maxW / img.width, maxH / img.height) : 1;
      const w = img.width * ratio; const h = img.height * ratio;
      doc.addImage(logoDataUrl, 'JPEG', 40, 28, w, h);
      titleX = 40 + w + 12;
      titleY = 46;
    } catch (e) {
      // ignore logo problems
    }
  }

  doc.text(title, titleX, titleY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Document No: ${docNo}`, 40, 70);
  doc.text(`Generated At: ${isoReadable(printedAt)} (${printedAt})`, 40, 85);

  const lines = [
    ["Transaction Request Date/Time", `${isoReadable(req.createdAt)}`],
    ["Approved Date/Time", req.headDecision?.decisionAt ? `${isoReadable(req.headDecision.decisionAt)}` : "N/A"],
    ["Purpose", req.purpose || "-"],
    ["Decision Note", req.headDecision?.decisionNote || "-"],
    ["Order Note (Head)", txn.notes?.headOrderNote || "-"],
    ["Payment Note (Payer)", txn.notes?.payerPaymentNote || "-"],
    ["Payment Confirmed Date/Time (Payer)", txn.timestamps.payerConfirmedAt ? `${isoReadable(txn.timestamps.payerConfirmedAt)}` : "N/A"],
    ["Amount - Debit Department", `${txn.payerDepartment}: ${String(txn.amount)}`],
    ["Amount - Credit Department", `${txn.receiverDepartment}: ${String(txn.amount)}`]
  ];

  doc.setFont("helvetica", "bold");
  doc.text("Transaction Details", 40, 115);

  doc.autoTable({
    startY: 125,
    head: [["Information", "Value"]],
    body: lines,
    styles: { font: "helvetica", fontSize: 10, cellPadding: 5 },
    headStyles: { fillColor: [20, 38, 74] }
  });

  let y = doc.lastAutoTable.finalY + 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(168, 182, 216);
  doc.text("Generated by Internal Finance Operations System | Audit-first LocalStorage Implementation", 40, y);

  doc.save(`Transaction_Receipt_${docNo}.pdf`);

  logAudit(currentUser.username, "PDF_GENERATED", "Transaction", transactionId, { docNo, generatedAt: printedAt });
}

/* =========================
   UI LAYER
   ========================= */
const UI = (() => {
  const el = (id) => document.getElementById(id);

  function showToast(msg) {
    const t = el("toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    setTimeout(() => t.classList.add("hidden"), 2500);
  }

  function setView(viewId) {
    ["loginView", "headView", "deptView"].forEach(id => el(id).classList.add("hidden"));
    el(viewId).classList.remove("hidden");
  }

  function setSessionBadge(user) {
    const badge = el("sessionBadge");
    const logoutBtn = el("logoutBtn");
    if (!user) {
      badge.classList.add("hidden");
      logoutBtn.classList.add("hidden");
      return;
    }
    badge.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    el("rolePill").textContent = user.role;
    el("userLabel").textContent = user.role === ROLES.HEAD ? "HEAD" : user.department;
  }

  function statusBadge(status) {
    const s = String(status || "");
    let cls = "badge--neutral";
    if (["COMPLETED"].includes(s)) cls = "badge--good";
    else if (["PENDING", "APPROVED", "ASSIGNED", "PAYMENT_INITIATED", "PAYMENT_CONFIRMED_BY_PAYER", "PAID_PENDING_RECEIPT"].includes(s)) cls = "badge--warn";
    else if (["REJECTED"].includes(s)) cls = "badge--bad";
    else cls = "badge--info";
    return `<span class="badge ${cls}">${escapeHtml(s)}</span>`;
  }

  function kpiCard(label, value, hint) {
    return `
      <div class="kpi">
        <div class="kpi__label">${escapeHtml(label)}</div>
        <div class="kpi__value">${escapeHtml(String(value))}</div>
        <div class="kpi__hint">${escapeHtml(hint || "")}</div>
      </div>
    `;
  }

  function renderTable(tableEl, columns, rows) {
    // columns: [{key, label, render?}]
    const thead = `<thead><tr>${columns.map(c => `<th>${escapeHtml(c.label)}</th>`).join("")}</tr></thead>`;
    const tbody = `<tbody>${
      rows.map(r => `<tr>${
        columns.map(c => {
          const val = r[c.key];
          const html = c.render ? c.render(val, r) : escapeHtml(val ?? "");
          return `<td>${html}</td>`;
        }).join("")
      }</tr>`).join("")
    }</tbody>`;
    tableEl.innerHTML = thead + tbody;
  }

  function csvFromRows(columns, rows) {
    const header = columns.map(c => `"${String(c.label).replace(/"/g, '""')}"`).join(",");
    const lines = rows.map(r =>
      columns.map(c => {
        const v = (c.raw ? c.raw(r) : (r[c.key] ?? ""));
        return `"${String(v).replace(/"/g, '""')}"`;
      }).join(",")
    );
    return [header, ...lines].join("\n");
  }

  // Modal (single)
  function openModal(title, bodyHtml, footerButtons) {
    el("modalTitle").textContent = title;
    el("modalBody").innerHTML = bodyHtml;
    const footer = el("modalFooter");
    footer.innerHTML = "";
    (footerButtons || []).forEach(btn => footer.appendChild(btn));
    el("modalBackdrop").classList.remove("hidden");
  }
  function closeModal() {
    el("modalBackdrop").classList.add("hidden");
    el("modalBody").innerHTML = "";
    el("modalFooter").innerHTML = "";
  }

  return {
    el,
    showToast,
    setView,
    setSessionBadge,
    statusBadge,
    kpiCard,
    renderTable,
    csvFromRows,
    openModal,
    closeModal
  };
})();

/* =========================
   DASHBOARD RENDERING
   ========================= */
function computeLedgerSummary(dept) {
  const entries = getLedgerEntries().filter(e => e.department === dept);
  const totalCredit = entries.filter(e => e.type === "CREDIT").reduce((s, e) => s + e.amount, 0);
  const totalDebit = entries.filter(e => e.type === "DEBIT").reduce((s, e) => s + e.amount, 0);
  const net = totalCredit - totalDebit;
  return { totalCredit, totalDebit, net, entries };
}

// Get balance for all departments
function getAllDepartmentBalances() {
  const balances = {};
  DEPARTMENTS.forEach(dept => {
    const summary = computeLedgerSummary(dept);
    balances[dept] = {
      credits: summary.totalCredit,
      debits: summary.totalDebit,
      balance: summary.net
    };
  });
  return balances;
}

/* =========================
   HEAD KPI IMPROVEMENT:
   - HEAD can see all department balances health signal
   ========================= */
function renderHeadKpis() {
  const reqs = getRequests();
  const txns = getTransactions();

  const txnReceiverAction = txns.filter(t => t.status === TXN_STATUS.PAYMENT_CONFIRMED_BY_PAYER).length;

  const allBalances = getAllDepartmentBalances();
  const balancesArr = Object.entries(allBalances).map(([dept, v]) => ({ dept, ...v }));
  const negatives = balancesArr.filter(x => x.balance < 0);
  const worst = balancesArr.slice().sort((a, b) => a.balance - b.balance)[0];

  // System balance is the sum of all department balances
  const totalSystemBalance = balancesArr.reduce((s, d) => s + d.balance, 0);

  UI.el("headKpis").innerHTML = [
    UI.kpiCard(
      "System Balance",
      totalSystemBalance.toFixed(2),
      `Sum of ${balancesArr.length} department balances`
    ),
    UI.kpiCard("Transactions Pending Receiver", txnReceiverAction, "Cash receipt confirmation")
  ].join("");
}

function renderDeptKpis(dept) {
  const reqs = getRequests().filter(r => r.requestedByDepartment === dept);
  const txns = getTransactions();
  const payer = txns.filter(t => t.payerDepartment === dept && [TXN_STATUS.ASSIGNED, TXN_STATUS.PAYMENT_INITIATED].includes(t.status)).length;
  const receiver = txns.filter(t => t.receiverDepartment === dept && t.status === TXN_STATUS.PAYMENT_CONFIRMED_BY_PAYER).length;

  const ledger = computeLedgerSummary(dept);

  UI.el("deptKpis").innerHTML = [
    UI.kpiCard("My Pending Requests", reqs.filter(r => r.status === REQUEST_STATUS.PENDING).length, "Awaiting Head decision"),
    UI.kpiCard("My Requests In Flight", reqs.filter(r => [REQUEST_STATUS.APPROVED, REQUEST_STATUS.ASSIGNED, REQUEST_STATUS.PAID_PENDING_RECEIPT].includes(r.status)).length, "Approved/Assigned/Paid pending receipt"),
    UI.kpiCard("My Payer Actions", payer, "Transactions requiring my payment action"),
    UI.kpiCard("My Net Ledger Balance", ledger.net.toFixed(2), `Credits ${ledger.totalCredit.toFixed(2)} / Debits ${ledger.totalDebit.toFixed(2)}`)
  ].join("");
}

function renderHeadRequests() {
  const statusFilter = UI.el("headReqStatusFilter").value;
  const deptFilter = UI.el("headReqDeptFilter").value;
  const q = UI.el("headReqSearch").value.trim().toLowerCase();

  let rows = getRequests().slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (statusFilter) rows = rows.filter(r => r.status === statusFilter);
  if (deptFilter) rows = rows.filter(r => r.requestedByDepartment === deptFilter);
  if (q) rows = rows.filter(r => r.requestId.toLowerCase().includes(q) || r.purpose.toLowerCase().includes(q));

  const cols = [
    { key: "requestId", label: "Request ID" },
    { key: "requestedByDepartment", label: "Department" },
    { key: "requestedAmount", label: "Amount" },
    { key: "purpose", label: "Purpose" },
    { key: "status", label: "Status", render: (v) => UI.statusBadge(v) },
    { key: "createdAt", label: "Created", render: (v) => `${isoReadable(v)}` },
    { key: "_decision", label: "Head Decision", render: (_, r) => r.headDecision?.decisionAt
      ? `${escapeHtml(r.headDecision.decisionBy)}<div class="muted small">${isoReadable(r.headDecision.decisionAt)}</div>`
      : `<span class="muted">—</span>`
    }
  ];

  UI.renderTable(UI.el("headRequestsTable"), cols, rows);

  UI.el("headReqExportBtn").onclick = () => {
    const exportCols = [
      { key: "requestId", label: "Request ID" },
      { key: "requestedByDepartment", label: "Department" },
      { key: "requestedAmount", label: "Amount" },
      { key: "purpose", label: "Purpose" },
      { key: "status", label: "Status" },
      { key: "createdAt", label: "CreatedAt ISO" },
      { key: "decisionBy", label: "Decision By", raw: (r) => r.headDecision?.decisionBy || "" },
      { key: "decisionAt", label: "DecisionAt ISO", raw: (r) => r.headDecision?.decisionAt || "" },
      { key: "decisionNote", label: "Decision Note", raw: (r) => r.headDecision?.decisionNote || "" }
    ];
    const csv = UI.csvFromRows(exportCols, rows);
    downloadText(`head_requests_${nowISO().slice(0,10)}.csv`, csv);
  };
}

function renderHeadApprovals(currentUser) {
  const q = UI.el("headApprovalSearch").value.trim().toLowerCase();
  let rows = getRequests().filter(r => r.status === REQUEST_STATUS.PENDING)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (q) rows = rows.filter(r =>
    r.requestId.toLowerCase().includes(q) ||
    r.requestedByDepartment.toLowerCase().includes(q) ||
    r.purpose.toLowerCase().includes(q)
  );

  const cols = [
    { key: "requestId", label: "Request ID" },
    { key: "requestedByDepartment", label: "Department" },
    { key: "requestedAmount", label: "Amount" },
    { key: "purpose", label: "Purpose" },
    { key: "createdAt", label: "Created", render: (v) => isoReadable(v) },
    { key: "_actions", label: "Actions", render: (_, r) => `
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn--success" data-action="approve" data-id="${escapeHtml(r.requestId)}">Approve</button>
        <button class="btn btn--danger" data-action="reject" data-id="${escapeHtml(r.requestId)}">Reject</button>
      </div>
    ` }
  ];
  UI.renderTable(UI.el("headApprovalsTable"), cols, rows);

  UI.el("headApprovalsTable").onclick = (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    const action = btn.getAttribute("data-action");

    const noteId = `note-${uuid()}`;
    UI.openModal(
      action === "approve" ? "Approve Request" : "Reject Request",
      `
        <div class="field">
          <label>Decision Note</label>
          <textarea id="${noteId}" rows="4"></textarea>
        </div>
      `,
      [
        (() => {
          const b = document.createElement("button");
          b.className = "btn btn--secondary";
          b.textContent = "Cancel";
          b.onclick = UI.closeModal;
          return b;
        })(),
        (() => {
          const b = document.createElement("button");
          b.className = action === "approve" ? "btn btn--success" : "btn btn--danger";
          b.textContent = action === "approve" ? "Approve" : "Reject";
          b.onclick = () => {
            try {
              const note = document.getElementById(noteId).value;
              if (action === "approve") approveRequest(id, note, currentUser);
              else rejectRequest(id, note, currentUser);
              UI.closeModal();
              UI.showToast(`Request ${action.toUpperCase()}D`);
              rerender(currentUser);
            } catch (err) {
              UI.showToast(String(err.message || err));
            }
          };
          return b;
        })()
      ]
    );
  };
}

function renderHeadAssign(currentUser) {
  const q = UI.el("headAssignSearch").value.trim().toLowerCase();
  let rows = getRequests().filter(r => r.status === REQUEST_STATUS.APPROVED)
    .sort((a, b) => a.headDecision.decisionAt.localeCompare(b.headDecision.decisionAt));
  if (q) rows = rows.filter(r =>
    r.requestId.toLowerCase().includes(q) ||
    r.requestedByDepartment.toLowerCase().includes(q) ||
    r.purpose.toLowerCase().includes(q)
  );

  const cols = [
    { key: "requestId", label: "Request ID" },
    { key: "requestedByDepartment", label: "Receiver" },
    { key: "requestedAmount", label: "Amount" },
    { key: "purpose", label: "Purpose" },
    { key: "_dec", label: "Approved At", render: (_, r) => isoReadable(r.headDecision.decisionAt) },
    { key: "_assign", label: "Assign", render: (_, r) => `
      <button class="btn btn--primary" data-action="assign" data-id="${escapeHtml(r.requestId)}">Assign Payer</button>
    ` }
  ];

  UI.renderTable(UI.el("headAssignTable"), cols, rows);

  UI.el("headAssignTable").onclick = (e) => {
    const btn = e.target.closest("button[data-action='assign']");
    if (!btn) return;
    const requestId = btn.getAttribute("data-id");
    const req = findRequestById(requestId);
    if (!req) return;

    const payerSelectId = `payer-${uuid()}`;
    const noteId = `orderNote-${uuid()}`;

    // Improvement: show all department balances to HEAD during payer selection
    const allBalances = getAllDepartmentBalances();
    const payerOptions = DEPARTMENTS
      .filter(d => d !== req.requestedByDepartment)
      .map(d => {
        const bal = (allBalances[d]?.balance ?? 0);
        const label = `${d} (Bal: ${bal.toFixed(2)})`;
        return `<option value="${d}">${label}</option>`;
      })
      .join("");

    UI.openModal(
      "Assign Payer Department",
      `
        <div class="grid-2">
          <div class="field">
            <label>Payer Department (includes current balance)</label>
            <select id="${payerSelectId}">
              ${payerOptions}
            </select>
          </div>
          <div class="field">
            <label>Order Note</label>
            <input id="${noteId}" placeholder="Instruction to payer (optional)" />
          </div>
        </div>
        <div class="divider"></div>
        <div class="muted small">
          Control: payer cannot be the receiver by default.
        </div>
      `,
      [
        (() => {
          const b = document.createElement("button");
          b.className = "btn btn--secondary";
          b.textContent = "Cancel";
          b.onclick = UI.closeModal;
          return b;
        })(),
        (() => {
          const b = document.createElement("button");
          b.className = "btn btn--primary";
          b.textContent = "Assign";
          b.onclick = () => {
            try {
              const payer = document.getElementById(payerSelectId).value;
              const note = document.getElementById(noteId).value;

              // Optional control (currently disabled by default):
              // if ((allBalances[payer]?.balance ?? 0) < 0) throw new Error("Selected payer has negative balance (control).");

              assignPayer(requestId, payer, note, currentUser);
              UI.closeModal();
              UI.showToast("Payer assigned; transaction created.");
              rerender(currentUser);
            } catch (err) {
              UI.showToast(String(err.message || err));
            }
          };
          return b;
        })()
      ]
    );
  };
}

function renderHeadTransactions(currentUser) {
  const statusFilter = UI.el("headTxnStatusFilter").value;
  const q = UI.el("headTxnSearch").value.trim().toLowerCase();

  let rows = getTransactions().slice().sort((a, b) => b.timestamps.assignedAt.localeCompare(a.timestamps.assignedAt));
  if (statusFilter) rows = rows.filter(t => t.status === statusFilter);
  if (q) rows = rows.filter(t => t.transactionId.toLowerCase().includes(q) || t.requestId.toLowerCase().includes(q));

  const cols = [
    { key: "transactionId", label: "Transaction ID" },
    { key: "requestId", label: "Request ID" },
    { key: "payerDepartment", label: "Payer" },
    { key: "receiverDepartment", label: "Receiver" },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status", render: (v) => UI.statusBadge(v) },
    { key: "_timeline", label: "Timestamps", render: (_, r) => `
      <div class="small">
        <div><span class="muted">Completed:</span> ${r.timestamps.completedAt ? escapeHtml(isoReadable(r.timestamps.completedAt).split(' ')[0]) : 'N/A'}</div>
      </div>
    ` },
    { key: "_pdf", label: "Receipt", render: (_, r) => r.status === TXN_STATUS.COMPLETED
      ? `<button class="btn btn--secondary" data-action="pdf" data-id="${escapeHtml(r.transactionId)}">PDF</button>`
      : `<span class="muted">—</span>`
    }
  ];

  UI.renderTable(UI.el("headTransactionsTable"), cols, rows);

  UI.el("headTransactionsTable").onclick = async (e) => {
    const btn = e.target.closest("button[data-action='pdf']");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    try {
      await generatePDF(id, currentUser);
      UI.showToast("PDF generated.");
      rerender(currentUser);
    } catch (err) {
      UI.showToast(String(err.message || err));
    }
  };
}

function renderHeadLedger() {
  const dept = UI.el("headLedgerDept").value;
  const summary = computeLedgerSummary(dept);

  if (dept) {
    UI.el("headLedgerSummary").innerHTML = [
      UI.kpiCard("Total Credits", summary.totalCredit.toFixed(2), dept),
      UI.kpiCard("Total Debits", summary.totalDebit.toFixed(2), dept),
      UI.kpiCard("Net Balance", summary.net.toFixed(2), "Credit - Debit"),
      UI.kpiCard("Entries", summary.entries.length, "Posted on completion")
    ].join("");

    const rows = summary.entries.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const cols = [
      { key: "entryId", label: "Entry ID" },
      { key: "department", label: "Department" },
      { key: "type", label: "Type" },
      { key: "amount", label: "Amount" },
      { key: "counterparty", label: "Counterparty" },
      { key: "_ref", label: "Reference", render: (_, r) => `
        <div class="small">
          <div><span class="muted">Request:</span> ${escapeHtml(r.reference.requestId)}</div>
          <div><span class="muted">Txn:</span> ${escapeHtml(r.reference.transactionId)}</div>
        </div>
      ` },
      { key: "description", label: "Description" },
      { key: "createdAt", label: "Created", render: (v) => `${isoReadable(v)}` }
    ];
    UI.renderTable(UI.el("headLedgerTable"), cols, rows);
  } else {
    const allBalances = getAllDepartmentBalances();
    const totalAllCredits = Object.values(allBalances).reduce((sum, d) => sum + d.credits, 0);
    const totalAllDebits = Object.values(allBalances).reduce((sum, d) => sum + d.debits, 0);
    const totalAllBalance = totalAllCredits - totalAllDebits;

    UI.el("headLedgerSummary").innerHTML = [
      UI.kpiCard("Total All Credits", totalAllCredits.toFixed(2), "All Departments"),
      UI.kpiCard("Total All Debits", totalAllDebits.toFixed(2), "All Departments"),
      UI.kpiCard("Net System Balance", totalAllBalance.toFixed(2), "Credit - Debit"),
      UI.kpiCard("Active Departments", DEPARTMENTS.length, "Total departments")
    ].join("");

    const deptRows = DEPARTMENTS.map(d => ({
      department: d,
      credits: allBalances[d].credits,
      debits: allBalances[d].debits,
      balance: allBalances[d].balance
    }));

    const cols = [
      { key: "department", label: "Department" },
      { key: "credits", label: "Total Credits", render: (v) => v.toFixed(2) },
      { key: "debits", label: "Total Debits", render: (v) => v.toFixed(2) },
      { key: "balance", label: "Balance (Credits - Debits)", render: (v) => {
        const cls = v >= 0 ? "balance--pos" : "balance--neg";
        return `<strong class="${cls}">${v.toFixed(2)}</strong>`;
      } }
    ];
    UI.renderTable(UI.el("headLedgerTable"), cols, deptRows);

    UI.el("headLedgerExportBtn").onclick = () => {
      const allBalances2 = getAllDepartmentBalances();
      const exportData = DEPARTMENTS.map(d => [
        d,
        allBalances2[d].credits.toFixed(2),
        allBalances2[d].debits.toFixed(2),
        allBalances2[d].balance.toFixed(2)
      ]);
      exportData.unshift(["Department", "Total Credits", "Total Debits", "Net Balance"]);
      const csv = exportData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
      downloadText(`ledger_all_departments_${nowISO().slice(0, 10)}.csv`, csv);
    };
    return;
  }

  UI.el("headLedgerExportBtn").onclick = () => {
    const summary2 = computeLedgerSummary(dept);
    const rows = summary2.entries.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const exportCols = [
      { key: "entryId", label: "Entry ID" },
      { key: "department", label: "Department" },
      { key: "type", label: "Type" },
      { key: "amount", label: "Amount" },
      { key: "counterparty", label: "Counterparty" },
      { key: "requestId", label: "Request ID", raw: (r) => r.reference.requestId },
      { key: "transactionId", label: "Transaction ID", raw: (r) => r.reference.transactionId },
      { key: "description", label: "Description" },
      { key: "createdAt", label: "CreatedAt ISO" }
    ];
    const csv = UI.csvFromRows(exportCols, rows);
    downloadText(`ledger_${dept}_${nowISO().slice(0,10)}.csv`, csv);
  };
}

function renderHeadAudit() {
  const q = UI.el("headAuditSearch").value.trim().toLowerCase();
  const entityFilter = UI.el("headAuditEntityFilter").value;

  let rows = getAuditLogs().slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  if (entityFilter) rows = rows.filter(l => l.entityType === entityFilter);
  if (q) rows = rows.filter(l =>
    String(l.actor).toLowerCase().includes(q) ||
    String(l.action).toLowerCase().includes(q) ||
    String(l.entityId).toLowerCase().includes(q)
  );

  const cols = [
    { key: "timestamp", label: "Timestamp", render: (v) => `${isoReadable(v)}` },
    { key: "actor", label: "Actor" },
    { key: "action", label: "Action" },
    { key: "entityType", label: "Entity" },
    { key: "entityId", label: "Entity ID" },
    { key: "_details", label: "Details", render: (_, r) => `<div class="small">${escapeHtml(JSON.stringify(r.details ?? {}))}</div>` }
  ];
  UI.renderTable(UI.el("headAuditTable"), cols, rows);
}

function renderDeptRequests(dept) {
  const statusFilter = UI.el("deptReqStatusFilter").value;
  const q = UI.el("deptReqSearch").value.trim().toLowerCase();

  let rows = getRequests().filter(r => r.requestedByDepartment === dept)
    .slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (statusFilter) rows = rows.filter(r => r.status === statusFilter);
  if (q) rows = rows.filter(r => r.requestId.toLowerCase().includes(q) || r.purpose.toLowerCase().includes(q));

  const cols = [
    { key: "requestId", label: "Request ID" },
    { key: "requestedAmount", label: "Amount" },
    { key: "purpose", label: "Purpose" },
    { key: "status", label: "Status", render: (v) => UI.statusBadge(v) },
    { key: "createdAt", label: "Created", render: (v) => `${isoReadable(v)}` },
    { key: "_head", label: "Head Decision", render: (_, r) => r.headDecision?.decisionAt
      ? `<div class="small">
          <div><span class="muted">By:</span> ${escapeHtml(r.headDecision.decisionBy)}</div>
          <div><span class="muted">At:</span> ${escapeHtml(isoReadable(r.headDecision.decisionAt))}</div>
          <div><span class="muted">Note:</span> ${escapeHtml(r.headDecision.decisionNote || "")}</div>
        </div>`
      : `<span class="muted">—</span>`
    }
  ];

  UI.renderTable(UI.el("deptRequestsTable"), cols, rows);
}

function renderDeptPay(dept, currentUser) {
  const q = UI.el("deptPaySearch").value.trim().toLowerCase();

  let rows = getTransactions().filter(t =>
    t.payerDepartment === dept &&
    [TXN_STATUS.ASSIGNED, TXN_STATUS.PAYMENT_INITIATED].includes(t.status)
  ).slice().sort((a, b) => a.timestamps.assignedAt.localeCompare(b.timestamps.assignedAt));

  if (q) rows = rows.filter(t => t.transactionId.toLowerCase().includes(q) || t.requestId.toLowerCase().includes(q));

  const cols = [
    { key: "transactionId", label: "Transaction ID" },
    { key: "requestId", label: "Request ID" },
    { key: "receiverDepartment", label: "Receiver" },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status", render: (v) => UI.statusBadge(v) },
    { key: "_actions", label: "Actions", render: (_, r) => `
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn--primary" data-action="initiate" data-id="${escapeHtml(r.transactionId)}">Initiate Payment</button>
        <button class="btn btn--success" data-action="confirm" data-id="${escapeHtml(r.transactionId)}">Confirm Payment Sent</button>
      </div>
    ` }
  ];

  UI.renderTable(UI.el("deptPayTable"), cols, rows);

  UI.el("deptPayTable").onclick = (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");

    const noteId = `payNote-${uuid()}`;
    UI.openModal(
      action === "initiate" ? "Initiate Payment" : "Confirm Payment Sent",
      `
        <div class="field">
          <label>Payment Note (optional)</label>
          <input id="${noteId}" placeholder="Reference / method / context" />
        </div>
      `,
      [
        (() => {
          const b = document.createElement("button");
          b.className = "btn btn--secondary";
          b.textContent = "Cancel";
          b.onclick = UI.closeModal;
          return b;
        })(),
        (() => {
          const b = document.createElement("button");
          b.className = action === "initiate" ? "btn btn--primary" : "btn btn--success";
          b.textContent = action === "initiate" ? "Initiate" : "Confirm";
          b.onclick = () => {
            try {
              const note = document.getElementById(noteId).value;
              if (action === "initiate") initiatePayment(id, note, currentUser);
              else confirmPaymentSent(id, note, currentUser);
              UI.closeModal();
              UI.showToast("Transaction updated.");
              rerender(currentUser);
            } catch (err) {
              UI.showToast(String(err.message || err));
            }
          };
          return b;
        })()
      ]
    );
  };
}

function renderDeptConfirm(dept, currentUser) {
  const q = UI.el("deptConfirmSearch").value.trim().toLowerCase();

  let rows = getTransactions().filter(t =>
    t.receiverDepartment === dept &&
    t.status === TXN_STATUS.PAYMENT_CONFIRMED_BY_PAYER
  ).slice().sort((a, b) => a.timestamps.payerConfirmedAt.localeCompare(b.timestamps.payerConfirmedAt));

  if (q) rows = rows.filter(t => t.transactionId.toLowerCase().includes(q) || t.requestId.toLowerCase().includes(q));

  const cols = [
    { key: "transactionId", label: "Transaction ID" },
    { key: "requestId", label: "Request ID" },
    { key: "payerDepartment", label: "Payer" },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status", render: (v) => UI.statusBadge(v) },
    { key: "_actions", label: "Action", render: (_, r) => `
      <button class="btn btn--success" data-action="receipt" data-id="${escapeHtml(r.transactionId)}">Approve Cash Received</button>
    ` }
  ];

  UI.renderTable(UI.el("deptConfirmTable"), cols, rows);

  UI.el("deptConfirmTable").onclick = (e) => {
    const btn = e.target.closest("button[data-action='receipt']");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    const noteId = `recvNote-${uuid()}`;

    UI.openModal(
      "Approve Cash Received",
      `
        <div class="field">
          <label>Receipt Note (optional)</label>
          <input id="${noteId}" placeholder="Receipt confirmation details" />
        </div>
        <div class="divider"></div>
        <div class="muted small">
          Control: ledger postings will be created automatically on completion.
        </div>
      `,
      [
        (() => {
          const b = document.createElement("button");
          b.className = "btn btn--secondary";
          b.textContent = "Cancel";
          b.onclick = UI.closeModal;
          return b;
        })(),
        (() => {
          const b = document.createElement("button");
          b.className = "btn btn--success";
          b.textContent = "Approve";
          b.onclick = () => {
            try {
              const note = document.getElementById(noteId).value;
              confirmCashReceived(id, note, currentUser);
              UI.closeModal();
              UI.showToast("Receipt confirmed; ledger posted; transaction completed.");
              rerender(currentUser);
            } catch (err) {
              UI.showToast(String(err.message || err));
            }
          };
          return b;
        })()
      ]
    );
  };
}

function renderDeptLedger(dept) {
  const summary = computeLedgerSummary(dept);

  UI.el("deptLedgerSummary").innerHTML = [
    UI.kpiCard("Total Credits", summary.totalCredit.toFixed(2), dept),
    UI.kpiCard("Total Debits", summary.totalDebit.toFixed(2), dept),
    UI.kpiCard("Net Balance", summary.net.toFixed(2), "Credit - Debit"),
    UI.kpiCard("Entries", summary.entries.length, "Posted on completion")
  ].join("");

  const rows = summary.entries.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const cols = [
    { key: "entryId", label: "Entry ID" },
    { key: "type", label: "Type" },
    { key: "amount", label: "Amount" },
    { key: "counterparty", label: "Counterparty" },
    { key: "_ref", label: "Reference", render: (_, r) => `
      <div class="small">
        <div><span class="muted">Request:</span> ${escapeHtml(r.reference.requestId)}</div>
        <div><span class="muted">Txn:</span> ${escapeHtml(r.reference.transactionId)}</div>
      </div>
    ` },
    { key: "description", label: "Description" },
    { key: "createdAt", label: "Created", render: (v) => `${isoReadable(v)}` }
  ];
  UI.renderTable(UI.el("deptLedgerTable"), cols, rows);

  UI.el("deptLedgerExportBtn").onclick = () => {
    const exportCols = [
      { key: "entryId", label: "Entry ID" },
      { key: "department", label: "Department" },
      { key: "type", label: "Type" },
      { key: "amount", label: "Amount" },
      { key: "counterparty", label: "Counterparty" },
      { key: "requestId", label: "Request ID", raw: (r) => r.reference.requestId },
      { key: "transactionId", label: "Transaction ID", raw: (r) => r.reference.transactionId },
      { key: "description", label: "Description" },
      { key: "createdAt", label: "CreatedAt ISO" }
    ];
    const csv = UI.csvFromRows(exportCols, rows);
    downloadText(`ledger_${dept}_${nowISO().slice(0,10)}.csv`, csv);
  };
}

function renderDeptAudit(dept, currentUser) {
  const q = UI.el("deptAuditSearch").value.trim().toLowerCase();
  const entityFilter = UI.el("deptAuditEntityFilter").value;

  const reqIds = new Set(getRequests().filter(r => r.requestedByDepartment === dept).map(r => r.requestId));
  const txnIds = new Set(getTransactions().filter(t => t.payerDepartment === dept || t.receiverDepartment === dept).map(t => t.transactionId));
  const ledgerIds = new Set(getLedgerEntries().filter(e => e.department === dept).map(e => e.entryId));

  let rows = getAuditLogs().filter(l =>
    l.actor === currentUser.username ||
    (l.entityType === "Request" && reqIds.has(l.entityId)) ||
    (l.entityType === "Transaction" && txnIds.has(l.entityId)) ||
    (l.entityType === "Ledger" && ledgerIds.has(l.entityId))
  ).slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  if (entityFilter) rows = rows.filter(l => l.entityType === entityFilter);
  if (q) rows = rows.filter(l =>
    String(l.action).toLowerCase().includes(q) ||
    String(l.entityId).toLowerCase().includes(q)
  );

  const cols = [
    { key: "timestamp", label: "Timestamp", render: (v) => `${isoReadable(v)}` },
    { key: "actor", label: "Actor" },
    { key: "action", label: "Action" },
    { key: "entityType", label: "Entity" },
    { key: "entityId", label: "Entity ID" },
    { key: "_details", label: "Details", render: (_, r) => `<div class="small">${escapeHtml(JSON.stringify(r.details ?? {}))}</div>` }
  ];
  UI.renderTable(UI.el("deptAuditTable"), cols, rows);
}

function rerender(currentUser) {
  if (!currentUser) {
    UI.setView("loginView");
    UI.setSessionBadge(null);
    return;
  }

  UI.setSessionBadge(currentUser);

  const deptFilter = UI.el("headReqDeptFilter");
  if (deptFilter && deptFilter.options.length <= 1) {
    deptFilter.innerHTML = `<option value="">All Depts</option>` + DEPARTMENTS.map(d => `<option value="${d}">${d}</option>`).join("");
  }
  const headLedgerDept = UI.el("headLedgerDept");
  if (headLedgerDept && headLedgerDept.options.length === 0) {
    headLedgerDept.innerHTML = `<option value="">All Departments (Summary)</option>` + DEPARTMENTS.map(d => `<option value="${d}">${d}</option>`).join("");
    headLedgerDept.value = "";
  }

  if (requireHead(currentUser)) {
    UI.setView("headView");
    renderHeadKpis();
    renderHeadRequests();
    renderHeadApprovals(currentUser);
    renderHeadAssign(currentUser);
    renderHeadTransactions(currentUser);
    renderHeadLedger();
    renderHeadAudit();
  } else {
    UI.setView("deptView");
    renderDeptKpis(currentUser.department);
    renderDeptRequests(currentUser.department);
    renderDeptPay(currentUser.department, currentUser);
    renderDeptConfirm(currentUser.department, currentUser);
    renderDeptLedger(currentUser.department);
    renderDeptAudit(currentUser.department, currentUser);
  }
}

/* =========================
   TAB HANDLING
   ========================= */
function wireTabs(containerSelector) {
  const root = document.querySelector(containerSelector);
  if (!root) return;

  const tabs = root.querySelectorAll(".tab");
  const panes = root.querySelectorAll(".tabpane");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const id = tab.getAttribute("data-tab");
      tabs.forEach(t => t.classList.toggle("tab--active", t === tab));
      panes.forEach(p => p.classList.toggle("tabpane--active", p.id === id));
    });
  });
}

/* =========================
   APP INIT / EVENT WIRING
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
  initStorage();

  UI.el("modalCloseBtn").onclick = UI.closeModal;
  UI.el("modalBackdrop").addEventListener("click", (e) => {
    if (e.target.id === "modalBackdrop") UI.closeModal();
  });

  wireTabs("#headView");
  wireTabs("#deptView");

  UI.el("resetDataBtn").onclick = () => {
    localStorage.removeItem(STORAGE_KEYS.users);
    localStorage.removeItem(STORAGE_KEYS.requests);
    localStorage.removeItem(STORAGE_KEYS.transactions);
    localStorage.removeItem(STORAGE_KEYS.ledgerEntries);
    localStorage.removeItem(STORAGE_KEYS.auditLogs);
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    localStorage.removeItem(STORAGE_KEYS.seedFlag);
    initStorage();
    UI.showToast("LocalStorage datasets reset.");
    rerender(null);
  };

  // Clear financial data (requests, transactions, ledger entries, audit logs)
  async function clearFinanceData() {
    // remove requests, transactions and ledger entries
    setRequests([]);
    setTransactions([]);
    setLedgerEntries([]);

    // reset id counters
    Store.set("transactionIdCounter", 0);
    Store.set("requestIdCounter", 0);

    // remove audit logs entirely for a clean slate
    Store.set(STORAGE_KEYS.auditLogs, []);

    // ensure current session cleared
    Store.set(STORAGE_KEYS.currentUser, null);

    logAudit("SYSTEM", "FINANCE_DATA_CLEARED", "System", "-", { clearedAt: nowISO() });
    UI.showToast("All financial data cleared across departments (including HEAD).");
    rerender(null);
  }

  // Immediately clear financial data as requested
  clearFinanceData();

  // Wire UI button for finance-only clear (keeps users)
  const clearBtn = UI.el("clearFinanceBtn");
  if (clearBtn) {
    clearBtn.onclick = () => {
      clearFinanceData();
    };
  }

  UI.el("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const u = UI.el("username").value.trim();
    const p = UI.el("password").value;

    UI.el("loginError").classList.add("hidden");

    const user = authenticateUser(u, p);
    if (!user) {
      UI.el("loginError").textContent = "Invalid username or password.";
      UI.el("loginError").classList.remove("hidden");
      logAudit(u || "UNKNOWN", "LOGIN_FAILED", "Request", "-", { username: u });
      return;
    }

    setCurrentUser(user);
    logAudit(user.username, "LOGIN_SUCCESS", "Request", "-", { role: user.role, department: user.department });

    rerender(user);
  });

  UI.el("quickLoginHead")?.addEventListener("click", () => {
    UI.el("username").value = "HEAD";
    UI.el("password").value = "Head@12345!";
    setTimeout(() => UI.el("loginForm").dispatchEvent(new Event("submit")), 50);
  });

  for (let i = 1; i <= 10; i++) {
    const btnId = `quickLoginDept${i}`;
    const users = Store.get(STORAGE_KEYS.users, []);
    const deptUser = users.find(u => u.username === `DEPARTMENT${i}`);
    if (deptUser) {
      UI.el(btnId)?.addEventListener("click", () => {
        UI.el("username").value = deptUser.username;
        UI.el("password").value = deptUser.password;
        setTimeout(() => UI.el("loginForm").dispatchEvent(new Event("submit")), 50);
      });
    }
  }

  UI.el("logoutBtn").onclick = () => {
    const user = getCurrentUser();
    if (user) logAudit(user.username, "LOGOUT", "Request", "-", {});
    clearSession();
    rerender(null);
  };

  UI.el("createRequestForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const currentUser = getCurrentUser();
    if (!requireDept(currentUser)) {
      rerender(null);
      return;
    }

    UI.el("reqError").classList.add("hidden");

    try {
      const amt = UI.el("reqAmount").value;
      const purpose = UI.el("reqPurpose").value;
      createRequest(amt, purpose, currentUser);
      UI.el("reqAmount").value = "";
      UI.el("reqPurpose").value = "";
      UI.showToast("Request submitted.");
      rerender(currentUser);
    } catch (err) {
      UI.el("reqError").textContent = String(err.message || err);
      UI.el("reqError").classList.remove("hidden");
    }
  });

  ["headReqStatusFilter","headReqDeptFilter","headReqSearch"].forEach(id => UI.el(id)?.addEventListener("input", () => {
    const user = getCurrentUser(); if (requireHead(user)) renderHeadRequests();
  }));
  UI.el("headApprovalSearch")?.addEventListener("input", () => {
    const user = getCurrentUser(); if (requireHead(user)) renderHeadApprovals(user);
  });
  UI.el("headAssignSearch")?.addEventListener("input", () => {
    const user = getCurrentUser(); if (requireHead(user)) renderHeadAssign(user);
  });
  ["headTxnStatusFilter","headTxnSearch"].forEach(id => UI.el(id)?.addEventListener("input", () => {
    const user = getCurrentUser(); if (requireHead(user)) renderHeadTransactions(user);
  }));
  UI.el("headLedgerDept")?.addEventListener("change", () => {
    const user = getCurrentUser(); if (requireHead(user)) renderHeadLedger();
  });
  ["headAuditSearch","headAuditEntityFilter"].forEach(id => UI.el(id)?.addEventListener("input", () => {
    const user = getCurrentUser(); if (requireHead(user)) renderHeadAudit();
  }));

  ["deptReqStatusFilter","deptReqSearch"].forEach(id => UI.el(id)?.addEventListener("input", () => {
    const user = getCurrentUser(); if (requireDept(user)) renderDeptRequests(user.department);
  }));
  UI.el("deptPaySearch")?.addEventListener("input", () => {
    const user = getCurrentUser(); if (requireDept(user)) renderDeptPay(user.department, user);
  });
  UI.el("deptConfirmSearch")?.addEventListener("input", () => {
    const user = getCurrentUser(); if (requireDept(user)) renderDeptConfirm(user.department, user);
  });
  ["deptAuditSearch","deptAuditEntityFilter"].forEach(id => UI.el(id)?.addEventListener("input", () => {
    const user = getCurrentUser(); if (requireDept(user)) renderDeptAudit(user.department, user);
  }));

  const user = getCurrentUser();
  rerender(user);
});
