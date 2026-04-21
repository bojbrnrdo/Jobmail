// =======================================================
// BOUNTYPLAY - FULL ADVANCED TRAINING ENGINE
// VM SCALE + PHISHING TRAINING + FEEDBACK + DASHBOARD
// FULL UPDATED VERSION
// =======================================================

// =======================================================
// SECTION 1: APP CONFIG
// =======================================================

const APP_CONFIG = {
  baseWidth: 1200,
  baseHeight: 700,
  maxMistakes: 4,
  scorePerClue: 10,
  scoreCorrectClassification: 20,
  scoreCorrectReport: 15,
  scoreQuickReport: 25,
  scoreSafeKeep: 10,
  scoreDeletePhishing: 5,
  penaltyWrongClassification: 1,
  penaltyRiskyKeep: 1,
  penaltyRiskyReply: 1,
  penaltyFalsePositive: 1,
  loginSimPenaltyScore: 15,
  tutorialDelayMs: 350,
  riskyLinkDelayMs: 250,
  wrongFlashDelayMs: 350,
  defaultFeedbackBadge: "feedback-badge",
  debug: true
};

// =======================================================
// SECTION 2: GLOBAL STATE
// =======================================================

let currentEmailIndex = 0;
let score = 0;
let mistakes = 0;
let tutorialShown = false;
let breachTriggered = false;

let selectedClassification = null;
let selectedAction = null;
let cluesFoundForCurrentEmail = 0;
let riskyLinkOpenedForCurrentEmail = false;

let appInitialized = false;
let emailClicksBound = false;
let activeScreenId = "briefingScreen";

const emailResults = [];
const openedEmailIndexes = new Set();

const stats = {
  totalEmails: 0,
  correctClassifications: 0,
  safeReports: 0,
  riskyActions: 0,
  falsePositives: 0,
  cluesFound: 0,
  emailsReviewed: 0,
  unsafeEscalations: 0,
  quickReports: 0,
  deleteActions: 0,
  keepActions: 0,
  replyActions: 0,
  riskyLinkInteractions: 0,
  loginSimSubmitted: 0
};

// =======================================================
// SECTION 3: EMAIL DATA
// =======================================================

const emails = [
  {
    id: "google-alert",
    type: "phishing",
    senderDisplay: "Google",
    subject: "Security Alert: Suspicious Sign-in Attempt",
    time: "Now",
    sender: `Google Security <span class="clickable clue">security@google-support-alert.co</span>`,
    body: `
      <p>Dear User,</p>
      <p>We detected a suspicious sign-in attempt on your Google Account from a new device.</p>
      <p>If this was not you, please review your account activity immediately.</p>
      <p>To secure your account, please verify here:</p>
      <p>👉 <span class="clickable clue risky-link">google-account-security-check.co</span></p>
      <p>Failure to act may result in temporary account restriction.</p>
      <p>Thank you for your <span class="clickable clue">cooperatoin</span>.</p>
      <br>
      <p>Sincerely,<br>Google Security Team</p>
    `,
    clueCount: 3,
    safeClassification: "phishing",
    safeAction: "report",
    explanation:
      "The sender domain is not an official Google domain, the verification link is suspicious, and there is a spelling error. These are classic phishing indicators.",
    riskSummary:
      "This attack attempts credential theft through urgency and a fake verification page."
  },

  {
    id: "security-bank",
    type: "phishing",
    senderDisplay: "Security Bank",
    subject: "Account Verification Required",
    time: "Now",
    sender: `Security Bank <span class="clickable clue">no-reply@securitybank-verify.com</span>`,
    body: `
      <p>Dear Customer,</p>
      <p>Your account requires urgent verification.</p>
      <p>Please review the attached file and submit your account details immediately.</p>

      <div class="attachment clickable clue attachment-clue">
        <div class="file-icon">📄</div>
        <div class="file-info">
          <b>SecurityBank_Verification_Form.pdf</b>
          <span>PDF • 245 KB</span>
        </div>
      </div>

      <p>If you do not respond today, your account may be temporarily limited.</p>
      <p>Thank you for your continued trust.</p>
      <br>
      <p>Sincerely,<br>Security Bank Support Team</p>
    `,
    clueCount: 2,
    safeClassification: "phishing",
    safeAction: "report",
    explanation:
      "The sender domain is suspicious and the attachment is used as a lure to collect sensitive information.",
    riskSummary:
      "This attack tries to make the target open a deceptive document to trigger account compromise."
  },

  {
    id: "ceo-fraud",
    type: "phishing",
    senderDisplay: "CEO Office",
    subject: "Urgent request before my meeting",
    time: "8:54 AM",
    sender: `CEO Office <span class="clickable clue">ceo-office.external@consultantmail.com</span>`,
    body: `
      <p>Hello,</p>
      <p>I need you to handle an urgent payment request before my next meeting.</p>
      <p>Please keep this confidential and reply immediately so I can send the bank details.</p>
      <p>This must be completed within the next 15 minutes.</p>
      <br>
      <p>Sent from my iPhone</p>
    `,
    clueCount: 2,
    safeClassification: "phishing",
    safeAction: "report",
    explanation:
      "This email creates urgency, asks for secrecy, and uses an unusual sender address. These are common executive impersonation signs.",
    riskSummary:
      "This attack tries to manipulate the user into bypassing normal payment controls."
  },

  {
    id: "delivery-scam",
    type: "phishing",
    senderDisplay: "FlashExpress",
    subject: "Your parcel is on hold",
    time: "8:22 AM",
    sender: `FlashExpress <span class="clickable clue">support@flashxpress-track.co</span>`,
    body: `
      <p>Dear Customer,</p>
      <p>Your parcel is currently on hold due to an address mismatch.</p>
      <p>Please update your details here to avoid return to sender:</p>
      <p>👉 <span class="clickable clue risky-link">flashxpress-track.co/update-delivery</span></p>
      <p>A re-delivery fee may apply if no response is received today.</p>
      <br>
      <p>Thank you,<br>FlashExpress Support</p>
    `,
    clueCount: 2,
    safeClassification: "phishing",
    safeAction: "report",
    explanation:
      "The sender domain is misspelled and the email pressures the user to click a link quickly.",
    riskSummary:
      "This attack tries to harvest payment or delivery information through a fake logistics page."
  },

  {
    id: "maya-receipt",
    type: "safe",
    senderDisplay: "Maya",
    subject: "Your transaction receipt",
    time: "7:41 AM",
    sender: `Maya <span>no-reply@maya.ph</span>`,
    body: `
      <p>Hello,</p>
      <p>Your transaction was successfully processed.</p>
      <p>Reference Number: MXA-291144</p>
      <p>Amount: ₱250.00</p>
      <p>No further action is required.</p>
      <br>
      <p>Thank you for using Maya.</p>
    `,
    clueCount: 0,
    safeClassification: "safe",
    safeAction: "keep",
    explanation:
      "This email does not pressure the user, does not request credentials, and appears to come from a legitimate sender.",
    riskSummary:
      "This is a normal transaction receipt with no clear phishing indicators."
  }
];

stats.totalEmails = emails.length;

for (let i = 0; i < emails.length; i++) {
  emailResults.push(false);
}

// =======================================================
// SECTION 4: DOM HELPERS
// =======================================================

function byId(id) {
  return document.getElementById(id);
}

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return document.querySelectorAll(selector);
}

// =======================================================
// SECTION 5: DEBUG HELPERS
// =======================================================

function debugLog(...args) {
  if (APP_CONFIG.debug) {
    console.log(...args);
  }
}

function debugWarn(...args) {
  if (APP_CONFIG.debug) {
    console.warn(...args);
  }
}

function debugError(...args) {
  if (APP_CONFIG.debug) {
    console.error(...args);
  }
}

// =======================================================
// SECTION 6: VM SCALING
// =======================================================

function scaleApp() {
  const screens = qsa(".screen");
  if (!screens.length) return;

  const baseWidth = APP_CONFIG.baseWidth;
  const baseHeight = APP_CONFIG.baseHeight;

  const scale = Math.min(
    window.innerWidth / baseWidth,
    window.innerHeight / baseHeight
  );

  const offsetX = (window.innerWidth - baseWidth * scale) / 2;
  const offsetY = (window.innerHeight - baseHeight * scale) / 2;

  screens.forEach((screen) => {
    screen.style.transform = `scale(${scale})`;
    screen.style.left = `${offsetX}px`;
    screen.style.top = `${offsetY}px`;
  });

  debugLog("scaleApp:", { scale, offsetX, offsetY });
}

// =======================================================
// SECTION 7: SCREEN CONTROL
// =======================================================

function hideAllScreens() {
  qsa(".screen").forEach((screen) => {
    screen.classList.remove("active");
    screen.style.display = "none";
  });
}

function showScreen(id) {
  hideAllScreens();

  const target = byId(id);
  if (!target) {
    debugWarn("showScreen: target not found:", id);
    return;
  }

  target.classList.add("active");
  target.style.display = "flex";
  activeScreenId = id;

  scaleApp();
  debugLog("showScreen:", id);
}

function getActiveScreenId() {
  return activeScreenId;
}

function isScreenVisible(id) {
  const el = byId(id);
  if (!el) return false;
  return el.style.display === "flex" || el.classList.contains("active");
}

// =======================================================
// SECTION 8: MODAL CONTROL
// =======================================================

function openModal(id) {
  const modal = byId(id);
  if (modal) {
    modal.style.display = "flex";
    debugLog("openModal:", id);
  } else {
    debugWarn("openModal: modal not found:", id);
  }
}

function closeModal(id) {
  const modal = byId(id);
  if (modal) {
    modal.style.display = "none";
    debugLog("closeModal:", id);
  }
}

function closeAllModals() {
  const modalIds = [
    "decisionModal",
    "loginSimModal",
    "feedbackModal"
  ];

  modalIds.forEach(closeModal);
}

function isAnyModalOpen() {
  const modalIds = ["decisionModal", "loginSimModal", "feedbackModal"];
  return modalIds.some((id) => {
    const el = byId(id);
    return el && el.style.display === "flex";
  });
}

// =======================================================
// SECTION 9: EVENT / CLICK FIXES
// =======================================================

function disableOverlayClickBlock() {
  const tutorialOverlay = byId("tutorialOverlay");
  if (tutorialOverlay) {
    tutorialOverlay.style.pointerEvents = "none";
    debugLog("Overlay pointer-events disabled");
  }
}

function bindEmailClicks() {
  const items = qsa(".clickable-mail");

  if (!items.length) {
    debugWarn("bindEmailClicks: no clickable-mail items found");
    return;
  }

  items.forEach((item, index) => {
    item.onclick = function (event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      debugLog("📩 CLICK DETECTED:", index);
      openEmail(index);
    };
  });

  emailClicksBound = true;
  debugLog("bindEmailClicks: bound", items.length, "items");
}

function rebindDynamicHandlersIfNeeded() {
  if (!emailClicksBound) {
    bindEmailClicks();
  }
}

// =======================================================
// SECTION 10: INITIALIZATION
// =======================================================

function initializeApp() {
  const tutorialOverlay = byId("tutorialOverlay");
  const tutorialModal = byId("tutorialModal");

  if (tutorialOverlay) tutorialOverlay.style.display = "none";
  if (tutorialModal) tutorialModal.style.display = "none";

  disableOverlayClickBlock();
  closeAllModals();
  showScreen("briefingScreen");
  updateHUD();
  scaleApp();
  bindEmailClicks();

  appInitialized = true;
  debugLog("initializeApp complete");
}

// =======================================================
// SECTION 11: TRAINING START / RESET
// =======================================================

function resetDecisionState() {
  selectedClassification = null;
  selectedAction = null;

  const buttonIds = [
    "classifyPhishingBtn",
    "classifySafeBtn",
    "actionReportBtn",
    "actionDeleteBtn",
    "actionKeepBtn",
    "actionReplyBtn"
  ];

  buttonIds.forEach((id) => {
    const el = byId(id);
    if (el) el.classList.remove("selected");
  });
}

function resetCurrentEmailInteractionState() {
  cluesFoundForCurrentEmail = 0;
  riskyLinkOpenedForCurrentEmail = false;
  resetDecisionState();
}

function resetVisualInboxState() {
  qsa(".clickable-mail").forEach((item) => {
    item.classList.add("unread");
    item.classList.remove("read");
    item.style.opacity = "1";
    item.dataset.done = "false";
  });
}

function resetStats() {
  stats.correctClassifications = 0;
  stats.safeReports = 0;
  stats.riskyActions = 0;
  stats.falsePositives = 0;
  stats.cluesFound = 0;
  stats.emailsReviewed = 0;
  stats.unsafeEscalations = 0;
  stats.quickReports = 0;
  stats.deleteActions = 0;
  stats.keepActions = 0;
  stats.replyActions = 0;
  stats.riskyLinkInteractions = 0;
  stats.loginSimSubmitted = 0;
}

function resetEmailResults() {
  for (let i = 0; i < emailResults.length; i++) {
    emailResults[i] = false;
  }
}

function startTraining() {
  score = 0;
  mistakes = 0;
  currentEmailIndex = 0;
  breachTriggered = false;
  tutorialShown = false;
  openedEmailIndexes.clear();

  resetStats();
  resetEmailResults();
  resetCurrentEmailInteractionState();
  resetVisualInboxState();

  if (byId("emailList")) byId("emailList").style.display = "block";
  if (byId("emailView")) byId("emailView").style.display = "none";

  closeAllModals();
  showScreen("gameScreen");
  rebindDynamicHandlersIfNeeded();
  updateHUD();

  if (!tutorialShown) {
    setTimeout(() => {
      showTutorial();
      tutorialShown = true;
    }, APP_CONFIG.tutorialDelayMs);
  }

  debugLog("startTraining complete");
}

// =======================================================
// SECTION 12: TUTORIAL
// =======================================================

function showTutorial() {
  const overlay = byId("tutorialOverlay");
  const modal = byId("tutorialModal");
  const target = byId("firstEmail");
  const gameScreen = byId("gameScreen");

  if (!overlay || !modal || !target || !gameScreen) {
    debugWarn("showTutorial: missing tutorial elements");
    return;
  }

  overlay.style.display = "block";
  modal.style.display = "block";

  const targetRect = target.getBoundingClientRect();
  const gameRect = gameScreen.getBoundingClientRect();

  modal.style.top = `${targetRect.top - gameRect.top + 8}px`;
  modal.style.left = `${targetRect.right - gameRect.left + 12}px`;

  debugLog("showTutorial");
}

function hideTutorial() {
  const overlay = byId("tutorialOverlay");
  const modal = byId("tutorialModal");

  if (overlay) overlay.style.display = "none";
  if (modal) modal.style.display = "none";

  debugLog("hideTutorial");
}

// =======================================================
// SECTION 13: EMAIL FLOW
// =======================================================

function canOpenEmail(index) {
  if (mistakes >= APP_CONFIG.maxMistakes) return false;
  if (index < 0 || index >= emails.length) return false;
  if (emailResults[index]) return false;
  return true;
}

function renderEmail(email) {
  if (!email) return;

  if (byId("emailSubject")) {
    byId("emailSubject").innerText = email.subject;
  }

  if (byId("emailSender")) {
    byId("emailSender").innerHTML = email.sender;
  }

  if (byId("emailBody")) {
    byId("emailBody").innerHTML = email.body;
  }

  if (byId("emailTimestamp")) {
    byId("emailTimestamp").innerText = email.time;
  }
}

function markEmailAsOpened(index) {
  const items = qsa(".clickable-mail");
  const item = items[index];

  if (!item) return;

  item.classList.remove("unread");
  item.classList.add("read");
  openedEmailIndexes.add(index);
}

function openEmail(index) {
  debugLog("OPEN EMAIL CALLED:", index);

  if (!canOpenEmail(index)) {
    debugWarn("openEmail blocked:", index);
    return;
  }

  currentEmailIndex = index;
  resetCurrentEmailInteractionState();

  if (index === 0) {
    hideTutorial();
  }

  const email = emails[index];
  renderEmail(email);
  markEmailAsOpened(index);

  if (byId("emailList")) byId("emailList").style.display = "none";
  if (byId("emailView")) byId("emailView").style.display = "block";

  activateClueClicks();
  updateHUD();
}

function goBack() {
  if (byId("emailList")) byId("emailList").style.display = "block";
  if (byId("emailView")) byId("emailView").style.display = "none";
  debugLog("goBack");
}

function getCurrentEmail() {
  return emails[currentEmailIndex] || null;
}

// =======================================================
// SECTION 14: CLUE CLICK ENGINE
// =======================================================

function incrementScore(amount) {
  score += amount;
  if (score < 0) score = 0;
}

function incrementMistake(count = 1) {
  mistakes += count;
  if (mistakes < 0) mistakes = 0;
}

function markClue(target) {
  if (!target || target.classList.contains("clicked")) return false;

  target.classList.add("clicked");
  cluesFoundForCurrentEmail += 1;
  stats.cluesFound += 1;
  incrementScore(APP_CONFIG.scorePerClue);
  updateHUD();
  return true;
}

function markWrongTarget(target) {
  if (!target) return;

  target.classList.add("wrong");
  incrementMistake(1);
  updateHUD();

  setTimeout(() => {
    target.classList.remove("wrong");
  }, APP_CONFIG.wrongFlashDelayMs);

  if (mistakes >= APP_CONFIG.maxMistakes) {
    breachTriggered = true;
    showScreen("breachScreen");
  }
}

function activateClueClicks() {
  const emailBody = byId("emailBody");
  const emailSender = byId("emailSender");

  if (!emailBody || !emailSender) {
    debugWarn("activateClueClicks: missing email body or sender");
    return;
  }

  emailBody.onclick = null;
  emailSender.onclick = null;

  debugLog("Clue system active");

  function handleClick(event) {
    if (mistakes >= APP_CONFIG.maxMistakes) return;

    const target = event.target;
    const attachment = target.closest(".attachment-clue");

    debugLog("Clicked:", target);

    if (attachment) {
      markClue(attachment);
      return;
    }

    if (target.classList.contains("risky-link")) {
      const marked = markClue(target);

      if (marked && !riskyLinkOpenedForCurrentEmail) {
        riskyLinkOpenedForCurrentEmail = true;
        stats.riskyLinkInteractions += 1;

        setTimeout(() => {
          openLoginSim();
        }, APP_CONFIG.riskyLinkDelayMs);
      }

      return;
    }

    if (target.classList.contains("clickable") || target.classList.contains("clue")) {
      markClue(target);
      return;
    }

    markWrongTarget(target);
  }

  emailBody.onclick = handleClick;
  emailSender.onclick = handleClick;
}

// =======================================================
// SECTION 15: QUICK REPORT
// =======================================================

function markEmailDone(index) {
  const items = qsa(".clickable-mail");
  const item = items[index];

  if (!item) return;
  if (item.dataset.done === "true") return;

  item.dataset.done = "true";
  item.style.opacity = "0.5";
  item.classList.remove("unread");
  item.classList.add("read");
}

function quickReport() {
  const email = emails[currentEmailIndex];
  if (!email) return;
  if (emailResults[currentEmailIndex]) return;

  stats.emailsReviewed += 1;
  stats.quickReports += 1;

  if (email.type === "phishing") {
    incrementScore(APP_CONFIG.scoreQuickReport);
    stats.safeReports += 1;
    stats.correctClassifications += 1;

    showFeedback(
      "Correct — Reported Immediately",
      "You identified and reported the phishing email without interacting further. Immediate reporting is a strong defensive action.",
      "Threat escalated safely",
      ""
    );
  } else {
    incrementMistake(APP_CONFIG.penaltyFalsePositive);
    stats.falsePositives += 1;
    stats.unsafeEscalations += 1;

    showFeedback(
      "False Positive",
      "This email appears legitimate. Reporting safe emails can create unnecessary noise for the security team.",
      "Unnecessary escalation",
      "warn"
    );
  }

  markEmailDone(currentEmailIndex);
  emailResults[currentEmailIndex] = true;
  updateHUD();

  if (mistakes >= APP_CONFIG.maxMistakes) {
    breachTriggered = true;
    showScreen("breachScreen");
  }
}

// =======================================================
// SECTION 16: DECISION MODAL
// =======================================================

function openDecisionModal() {
  if (mistakes >= APP_CONFIG.maxMistakes) return;
  openModal("decisionModal");
}

function closeDecisionModal() {
  closeModal("decisionModal");
}

function setClassification(value) {
  selectedClassification = value;

  const phishingBtn = byId("classifyPhishingBtn");
  const safeBtn = byId("classifySafeBtn");

  if (phishingBtn) phishingBtn.classList.remove("selected");
  if (safeBtn) safeBtn.classList.remove("selected");

  if (value === "phishing" && phishingBtn) phishingBtn.classList.add("selected");
  if (value === "safe" && safeBtn) safeBtn.classList.add("selected");
}

function setAction(value) {
  selectedAction = value;

  const ids = [
    "actionReportBtn",
    "actionDeleteBtn",
    "actionKeepBtn",
    "actionReplyBtn"
  ];

  ids.forEach((id) => {
    const el = byId(id);
    if (el) el.classList.remove("selected");
  });

  if (value === "report" && byId("actionReportBtn")) {
    byId("actionReportBtn").classList.add("selected");
  }

  if (value === "delete" && byId("actionDeleteBtn")) {
    byId("actionDeleteBtn").classList.add("selected");
  }

  if (value === "keep" && byId("actionKeepBtn")) {
    byId("actionKeepBtn").classList.add("selected");
  }

  if (value === "reply" && byId("actionReplyBtn")) {
    byId("actionReplyBtn").classList.add("selected");
  }
}

// =======================================================
// SECTION 17: LOGIN SIMULATION
// =======================================================

function openLoginSim() {
  openModal("loginSimModal");
}

function closeLoginSim() {
  closeModal("loginSimModal");
}

function clearLoginSimInputs() {
  const simEmail = byId("simEmail");
  const simPassword = byId("simPassword");

  if (simEmail) simEmail.value = "";
  if (simPassword) simPassword.value = "";
}

function submitLoginSim() {
  closeLoginSim();
  stats.loginSimSubmitted += 1;
  stats.riskyActions += 1;
  breachTriggered = true;

  incrementScore(-APP_CONFIG.loginSimPenaltyScore);
  incrementMistake(1);

  showFeedback(
    "Credentials Exposed in Simulation",
    "Submitting credentials into a fake login page is one of the most damaging phishing outcomes. In a real incident, this could lead to account compromise.",
    "Credential harvesting simulated",
    "danger"
  );

  markEmailDone(currentEmailIndex);
  emailResults[currentEmailIndex] = true;
  updateHUD();

  if (mistakes >= APP_CONFIG.maxMistakes) {
    showScreen("breachScreen");
  }
}

// =======================================================
// SECTION 18: DECISION SUBMISSION
// =======================================================

function submitDecision() {
  if (!selectedClassification || !selectedAction) {
    alert("Please choose both a classification and an action.");
    return;
  }

  closeDecisionModal();

  const email = emails[currentEmailIndex];
  if (!email) return;
  if (emailResults[currentEmailIndex]) return;

  let title = "";
  let text = "";
  let impact = "";
  let badgeClass = "";
  let classificationCorrect = false;

  stats.emailsReviewed += 1;

  if (selectedClassification === email.safeClassification) {
    classificationCorrect = true;
    incrementScore(APP_CONFIG.scoreCorrectClassification);
    stats.correctClassifications += 1;
  } else {
    incrementMistake(APP_CONFIG.penaltyWrongClassification);
  }

  if (selectedAction === "delete") stats.deleteActions += 1;
  if (selectedAction === "keep") stats.keepActions += 1;
  if (selectedAction === "reply") stats.replyActions += 1;

  if (email.type === "phishing") {
    if (selectedAction === "report") {
      incrementScore(APP_CONFIG.scoreCorrectReport);
      stats.safeReports += 1;
      impact = "Threat safely escalated";
    } else if (selectedAction === "delete") {
      incrementScore(APP_CONFIG.scoreDeletePhishing);
      impact = "Threat removed, but not reported";
      badgeClass = "warn";
    } else if (selectedAction === "keep") {
      incrementMistake(APP_CONFIG.penaltyRiskyKeep);
      stats.riskyActions += 1;
      impact = "Threat remains in inbox";
      badgeClass = "danger";
      breachTriggered = true;
    } else if (selectedAction === "reply") {
      incrementMistake(APP_CONFIG.penaltyRiskyReply);
      stats.riskyActions += 1;
      impact = "Attacker engagement increased";
      badgeClass = "danger";
      breachTriggered = true;
    }

    if (classificationCorrect && selectedAction === "report") {
      title = "Correct — You handled this phishing email well.";
      text = `${email.explanation} ${email.riskSummary}`;
    } else if (classificationCorrect) {
      title = "Partially correct.";
      text = `You identified the email correctly, but your response was not the safest option. ${email.explanation}`;
    } else {
      title = "Unsafe assessment.";
      text = `This email was phishing. ${email.explanation}`;
      badgeClass = "danger";
      if (!impact) impact = "Threat handling failed";
    }
  } else {
    if (selectedAction === "keep") {
      incrementScore(APP_CONFIG.scoreSafeKeep);
      impact = "Normal email flow preserved";
      title = classificationCorrect
        ? "Correct — This email appears legitimate."
        : "Mixed decision.";
      text = email.explanation;
    } else if (selectedAction === "report") {
      incrementMistake(APP_CONFIG.penaltyFalsePositive);
      stats.falsePositives += 1;
      stats.unsafeEscalations += 1;
      impact = "False positive created";
      badgeClass = "warn";
      title = "False positive.";
      text = `This email appears legitimate. Reporting safe emails can create unnecessary workload for the security team. ${email.explanation}`;
    } else if (selectedAction === "delete") {
      impact = "Legitimate email removed";
      badgeClass = "warn";
      title = "Unnecessary action.";
      text = `This email appears legitimate. Deleting it avoided no real threat. ${email.explanation}`;
    } else if (selectedAction === "reply") {
      impact = "No immediate threat, but unnecessary action";
      title = "Not ideal.";
      text = `This email appears legitimate, but replying was unnecessary. ${email.explanation}`;
    }
  }

  if (!impact) {
    impact = "Decision recorded";
  }

  showFeedback(title, text, impact, badgeClass);
  markEmailDone(currentEmailIndex);
  emailResults[currentEmailIndex] = true;
  updateHUD();

  if (mistakes >= APP_CONFIG.maxMistakes) {
    breachTriggered = true;
  }
}

// =======================================================
// SECTION 19: FEEDBACK
// =======================================================

function showFeedback(title, text, impact, badgeClass = "") {
  const feedbackTitle = byId("feedbackTitle");
  const feedbackText = byId("feedbackText");
  const feedbackImpact = byId("feedbackImpact");
  const feedbackClues = byId("feedbackClues");
  const feedbackBadge = byId("feedbackBadge");

  if (feedbackTitle) feedbackTitle.innerText = title;
  if (feedbackText) feedbackText.innerText = text;
  if (feedbackImpact) feedbackImpact.innerText = impact;
  if (feedbackClues) feedbackClues.innerText = `${cluesFoundForCurrentEmail} clue(s)`;

  if (feedbackBadge) {
    feedbackBadge.className = APP_CONFIG.defaultFeedbackBadge;
    if (badgeClass) feedbackBadge.classList.add(badgeClass);
  }

  openModal("feedbackModal");
}

function nextEmail() {
  closeModal("feedbackModal");

  if (breachTriggered && (mistakes >= APP_CONFIG.maxMistakes || currentEmailIndex === emails.length - 1)) {
    showScreen("breachScreen");
    return;
  }

  const allDone = emailResults.every(Boolean);

  if (mistakes >= APP_CONFIG.maxMistakes || allDone) {
    if (breachTriggered) {
      showScreen("breachScreen");
    } else {
      showFinalDashboard();
    }
    return;
  }

  goBack();
  updateHUD();
}

// =======================================================
// SECTION 20: HUD + PROGRESS
// =======================================================

function getReviewedCount() {
  return emailResults.filter(Boolean).length;
}

function updateHUD() {
  const reviewedCount = getReviewedCount();
  const nextLabel = Math.min(reviewedCount + 1, emails.length);
  const percent = (reviewedCount / emails.length) * 100;

  if (byId("score")) {
    byId("score").innerText = score;
  }

  if (byId("progress")) {
    byId("progress").innerText = `${nextLabel}/${emails.length}`;
  }

  if (byId("mistakes")) {
    byId("mistakes").innerText = `${mistakes}/${APP_CONFIG.maxMistakes}`;
  }

  if (byId("progressFill")) {
    byId("progressFill").style.width = `${percent}%`;
  }
}

// =======================================================
// SECTION 21: BEHAVIOR PROFILE
// =======================================================

function getBehaviorProfile() {
  if (stats.riskyActions >= 3 || breachTriggered) {
    return "High Risk User";
  }

  if (stats.safeReports >= 3 && stats.falsePositives === 0) {
    return "Security Aware";
  }

  if (stats.falsePositives >= 2) {
    return "Over-Reporter";
  }

  return "Needs Coaching";
}

// =======================================================
// SECTION 22: FINAL DASHBOARD
// =======================================================

function showFinalDashboard() {
  const cluePoints = emails.reduce((sum, email) => {
    return sum + (email.clueCount * APP_CONFIG.scorePerClue);
  }, 0);

  const decisionPoints = emails.length * 35;
  const totalPossible = cluePoints + decisionPoints;

  const safeScore = Math.max(score, 0);
  const accuracy = totalPossible > 0
    ? Math.round((safeScore / totalPossible) * 100)
    : 0;

  let risk = "";
  let summary = "";

  if (accuracy >= 90) {
    risk = "Security Aware ✅";
    summary = "You consistently recognized suspicious indicators and chose safe responses. Your handling showed strong phishing awareness.";
  } else if (accuracy >= 75) {
    risk = "Needs Minor Improvement ⚠️";
    summary = "You identified many warning signs correctly, but a few response decisions reduced your overall safety posture.";
  } else if (accuracy >= 50) {
    risk = "At Risk ⚠️";
    summary = "You noticed some phishing cues, but risky decisions and missed signals increased your exposure.";
  } else {
    risk = "High Risk 🚨";
    summary = "You missed key phishing indicators and chose several unsafe responses. Additional phishing awareness practice is strongly recommended.";
  }

  if (byId("finalScore")) byId("finalScore").innerText = safeScore;
  if (byId("accuracy")) byId("accuracy").innerText = `${accuracy}%`;
  if (byId("risk")) byId("risk").innerText = risk;

  if (byId("correctClassifications")) {
    byId("correctClassifications").innerText = stats.correctClassifications;
  }

  if (byId("safeReports")) {
    byId("safeReports").innerText = stats.safeReports;
  }

  if (byId("riskyActions")) {
    byId("riskyActions").innerText = stats.riskyActions;
  }

  if (byId("falsePositives")) {
    byId("falsePositives").innerText = stats.falsePositives;
  }

  if (byId("cluesFound")) {
    byId("cluesFound").innerText = stats.cluesFound;
  }

  if (byId("emailsReviewed")) {
    byId("emailsReviewed").innerText = stats.emailsReviewed;
  }

  if (byId("behaviorProfile")) {
    byId("behaviorProfile").innerText = getBehaviorProfile();
  }

  if (byId("unsafeEscalations")) {
    byId("unsafeEscalations").innerText = stats.unsafeEscalations;
  }

  if (byId("breachTriggered")) {
    byId("breachTriggered").innerText = breachTriggered ? "Yes" : "No";
  }

  if (byId("coachSummary")) {
    byId("coachSummary").innerText = summary;
  }

  showScreen("dashboardScreen");
}

// =======================================================
// SECTION 23: EXTRA SAFETY HELPERS
// =======================================================

function forceBreachIfNeeded() {
  if (mistakes >= APP_CONFIG.maxMistakes) {
    breachTriggered = true;
    showScreen("breachScreen");
  }
}

function safeReloadTraining() {
  location.reload();
}

// =======================================================
// SECTION 24: OPTIONAL UTILITIES
// =======================================================

function isCurrentEmailPhishing() {
  const email = getCurrentEmail();
  return email ? email.type === "phishing" : false;
}

function isCurrentEmailSafe() {
  const email = getCurrentEmail();
  return email ? email.type === "safe" : false;
}

function hasCurrentEmailBeenCompleted() {
  return !!emailResults[currentEmailIndex];
}

function getTotalPossibleScore() {
  const cluePoints = emails.reduce((sum, email) => {
    return sum + (email.clueCount * APP_CONFIG.scorePerClue);
  }, 0);

  const decisionPoints = emails.length * 35;
  return cluePoints + decisionPoints;
}

function getAccuracy() {
  const totalPossible = getTotalPossibleScore();
  if (!totalPossible) return 0;
  return Math.round((Math.max(score, 0) / totalPossible) * 100);
}

// =======================================================
// SECTION 25: STATE SNAPSHOTS
// =======================================================

function getScore() {
  return score;
}

function getMistakes() {
  return mistakes;
}

function getCurrentEmailIndex() {
  return currentEmailIndex;
}

function getSelectedClassification() {
  return selectedClassification;
}

function getSelectedAction() {
  return selectedAction;
}

function getCluesFoundForCurrentEmail() {
  return cluesFoundForCurrentEmail;
}

function getRiskyLinkOpenedForCurrentEmail() {
  return riskyLinkOpenedForCurrentEmail;
}

function getOpenedEmailIndexesArray() {
  return Array.from(openedEmailIndexes);
}

function getEmailResultsSnapshot() {
  return [...emailResults];
}

function getStatsSnapshot() {
  return { ...stats };
}

// =======================================================
// SECTION 26: VALIDATION HELPERS
// =======================================================

function hasRequiredElements() {
  const requiredIds = [
    "briefingScreen",
    "gameScreen",
    "emailList",
    "emailView",
    "emailSubject",
    "emailSender",
    "emailBody",
    "feedbackModal"
  ];

  return requiredIds.every((id) => !!byId(id));
}

function validateAppStructure() {
  const valid = hasRequiredElements();
  if (!valid) {
    debugWarn("validateAppStructure: some required DOM elements are missing");
  } else {
    debugLog("validateAppStructure: OK");
  }
  return valid;
}

// =======================================================
// SECTION 27: DEBUG HELPERS
// =======================================================

function debugState() {
  console.log("CURRENT EMAIL INDEX:", currentEmailIndex);
  console.log("SCORE:", score);
  console.log("MISTAKES:", mistakes);
  console.log("CLUES FOUND (CURRENT):", cluesFoundForCurrentEmail);
  console.log("SELECTED CLASSIFICATION:", selectedClassification);
  console.log("SELECTED ACTION:", selectedAction);
  console.log("BREACH TRIGGERED:", breachTriggered);
  console.log("EMAIL RESULTS:", emailResults);
  console.log("STATS:", stats);
  console.log("ACTIVE SCREEN:", activeScreenId);
  console.log("APP INITIALIZED:", appInitialized);
  console.log("EMAIL CLICKS BOUND:", emailClicksBound);
}

function debugScale() {
  console.log("Window width:", window.innerWidth);
  console.log("Window height:", window.innerHeight);
  console.log("Base width:", APP_CONFIG.baseWidth);
  console.log("Base height:", APP_CONFIG.baseHeight);
}

// =======================================================
// SECTION 28: MANUAL CONTROL HELPERS
// =======================================================

function jumpToDashboard() {
  showFinalDashboard();
}

function jumpToBreach() {
  breachTriggered = true;
  showScreen("breachScreen");
}

function reopenCurrentEmail() {
  openEmail(currentEmailIndex);
}

function openFirstEmail() {
  openEmail(0);
}

function openLastEmail() {
  openEmail(emails.length - 1);
}

// =======================================================
// SECTION 29: TRAINING SUMMARY HELPERS
// =======================================================

function getSummaryObject() {
  return {
    score,
    mistakes,
    accuracy: getAccuracy(),
    behaviorProfile: getBehaviorProfile(),
    breachTriggered,
    reviewedCount: getReviewedCount(),
    stats: { ...stats }
  };
}

function printSummaryToConsole() {
  console.log(getSummaryObject());
}

function getPerformanceBand() {
  const accuracy = getAccuracy();

  if (accuracy >= 90) return "excellent";
  if (accuracy >= 75) return "good";
  if (accuracy >= 50) return "fair";
  return "poor";
}

// =======================================================
// SECTION 30: PLACEHOLDER FUNCTIONS FOR HTML SAFETY
// =======================================================

function switchTab() {
  // Placeholder so existing HTML won't break if this is still called somewhere.
}

function showFinalResultsDirectly() {
  showFinalDashboard();
}

// =======================================================
// SECTION 31: SAFE DOM PATCHES
// =======================================================

function ensureNoBlockingOverlay() {
  const overlay = byId("tutorialOverlay");
  if (overlay) {
    overlay.style.pointerEvents = "none";
  }
}

function ensureEmailListVisibleState() {
  const emailList = byId("emailList");
  const emailView = byId("emailView");

  if (!emailList || !emailView) return;

  if (activeScreenId === "gameScreen" && !isAnyModalOpen()) {
    if (emailResults.every(Boolean)) {
      emailList.style.display = "none";
    }
  }
}

function refreshBindingsAndLayout() {
  rebindDynamicHandlersIfNeeded();
  ensureNoBlockingOverlay();
  ensureEmailListVisibleState();
  scaleApp();
}

// =======================================================
// SECTION 32: SAFE ACTION SHORTCUTS
// =======================================================

function chooseReportAndSubmit() {
  setClassification("phishing");
  setAction("report");
  submitDecision();
}

function chooseSafeAndKeepAndSubmit() {
  setClassification("safe");
  setAction("keep");
  submitDecision();
}

// =======================================================
// SECTION 33: EMAIL RESULT HELPERS
// =======================================================

function getRemainingEmailCount() {
  return emails.length - getReviewedCount();
}

function isTrainingComplete() {
  return emailResults.every(Boolean);
}

function completeCurrentEmailManually() {
  markEmailDone(currentEmailIndex);
  emailResults[currentEmailIndex] = true;
  updateHUD();
}

// =======================================================
// SECTION 34: SAFE BIND REPAIR
// =======================================================

function rebindEmailClicksIfLost() {
  const items = qsa(".clickable-mail");
  let needsRebind = false;

  items.forEach((item) => {
    if (typeof item.onclick !== "function") {
      needsRebind = true;
    }
  });

  if (needsRebind) {
    bindEmailClicks();
    debugLog("rebindEmailClicksIfLost: rebound");
  }
}

// =======================================================
// SECTION 35: ESC KEY / KEYBOARD HELPERS
// =======================================================

function handleEscapeKey(event) {
  if (event.key !== "Escape") return;

  if (byId("feedbackModal") && byId("feedbackModal").style.display === "flex") {
    closeModal("feedbackModal");
    return;
  }

  if (byId("decisionModal") && byId("decisionModal").style.display === "flex") {
    closeModal("decisionModal");
    return;
  }

  if (byId("loginSimModal") && byId("loginSimModal").style.display === "flex") {
    closeModal("loginSimModal");
    return;
  }
}

// =======================================================
// SECTION 36: PAGE VISIBILITY HELPERS
// =======================================================

function handleVisibilityChange() {
  if (document.hidden) {
    debugLog("Document hidden");
  } else {
    debugLog("Document visible again");
    refreshBindingsAndLayout();
  }
}

// =======================================================
// SECTION 37: WINDOW EVENTS
// =======================================================

window.addEventListener("resize", () => {
  scaleApp();
  rebindEmailClicksIfLost();
});

window.addEventListener("load", () => {
  initializeApp();
  validateAppStructure();
});

window.addEventListener("keydown", handleEscapeKey);
document.addEventListener("visibilitychange", handleVisibilityChange);

// =======================================================
// SECTION 38: FAILSAFE INTERVAL
// =======================================================

let selfHealInterval = null;

function startSelfHealLoop() {
  if (selfHealInterval) return;

  selfHealInterval = setInterval(() => {
    if (!appInitialized) return;
    rebindEmailClicksIfLost();
  }, 2000);
}

function stopSelfHealLoop() {
  if (!selfHealInterval) return;
  clearInterval(selfHealInterval);
  selfHealInterval = null;
}

startSelfHealLoop();

// =======================================================
// SECTION 39: EXTRA NO-OP COMPATIBILITY HELPERS
// =======================================================

function noop() {
  return undefined;
}

function notImplementedYet() {
  debugWarn("Called placeholder function");
}

function keepAliveDebug() {
  debugLog("keepAliveDebug:", {
    score,
    mistakes,
    activeScreenId,
    currentEmailIndex
  });
}

// =======================================================
// SECTION 40: END OF FILE
// =======================================================
