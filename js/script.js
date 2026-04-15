// =======================================================
// BOUNTYPLAY - FINAL BOSS TRAINING VERSION
// =======================================================

// ================= SCREEN CONTROL =================
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
    screen.style.display = "none";
  });

  const target = document.getElementById(id);
  if (target) {
    target.classList.add("active");
    target.style.display = "flex";
  }
}

// ================= TRAINING DATA =================
const emails = [
  {
    type: "phishing",
    subject: "Security Alert: Suspicious Sign-in Attempt",
    senderDisplay: "Google",
    sender: `Google Security <span class="clickable clue">security@google-support-alert.co</span>`,
    time: "Now",
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
      "This message used a fake sender domain, a suspicious verification link, and a spelling error. These are common phishing indicators."
  },
  {
    type: "phishing",
    subject: "Account Verification Required",
    senderDisplay: "Security Bank",
    sender: `Security Bank <span class="clickable clue">no-reply@securitybank-verify.com</span>`,
    time: "Now",
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
      "The sender domain is not the official bank domain, and the attachment is used as a lure to collect sensitive information."
  },
  {
    type: "phishing",
    subject: "Urgent request before my meeting",
    senderDisplay: "CEO Office",
    sender: `CEO Office <span class="clickable clue">ceo-office.external@consultantmail.com</span>`,
    time: "8:54 AM",
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
      "This email creates urgency, requests secrecy, and uses an unusual sender address. These are classic CEO fraud indicators."
  },
  {
    type: "phishing",
    subject: "Your parcel is on hold",
    senderDisplay: "FlashExpress",
    sender: `FlashExpress <span class="clickable clue">support@flashxpress-track.co</span>`,
    time: "8:22 AM",
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
      "The domain is suspicious and the email pressures the user to act quickly through a link."
  },
  {
    type: "safe",
    subject: "Your transaction receipt",
    senderDisplay: "Maya",
    sender: `Maya <span>no-reply@maya.ph</span>`,
    time: "7:41 AM",
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
      "This email does not pressure the user, does not request credentials, and appears to come from a legitimate sender."
  }
];

// ================= STATE =================
let currentEmailIndex = 0;
let score = 0;
let mistakes = 0;
const maxMistakes = 4;
let cluesFoundForCurrentEmail = 0;
let tutorialShown = false;
let selectedClassification = null;
let selectedAction = null;
let breachTriggered = false;

const emailResults = new Array(emails.length).fill(null);

const stats = {
  totalEmails: emails.length,
  correctClassifications: 0,
  safeReports: 0,
  riskyActions: 0,
  falsePositives: 0,
  cluesFound: 0,
  emailsReviewed: 0,
  unsafeEscalations: 0
};

// ================= STARTUP =================
window.addEventListener("DOMContentLoaded", () => {
  showScreen("briefingScreen");

  const idsToHide = [
    "tutorialOverlay",
    "tutorialModal",
    "feedbackModal",
    "decisionModal",
    "loginSimModal"
  ];

  idsToHide.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  updateHUD();
});

// ================= TRAINING START =================
function startTraining() {
  showScreen("gameScreen");
  resetTrainingUI();
  updateHUD();

  if (!tutorialShown) {
    setTimeout(showTutorial, 300);
    tutorialShown = true;
  }
}

// ================= RESET =================
function resetTrainingUI() {
  currentEmailIndex = 0;
  cluesFoundForCurrentEmail = 0;
  selectedClassification = null;
  selectedAction = null;

  document.getElementById("emailList").style.display = "block";
  document.getElementById("emailView").style.display = "none";

  document.querySelectorAll(".clickable-mail").forEach((item, index) => {
    item.classList.add("unread");
    item.classList.remove("read");
    item.style.opacity = "1";
    item.dataset.done = "false";

    if (index === 0) {
      item.id = "firstEmail";
    }
  });
}

// ================= TUTORIAL =================
function showTutorial() {
  const overlay = document.getElementById("tutorialOverlay");
  const modal = document.getElementById("tutorialModal");
  const target = document.getElementById("firstEmail");
  const gameScreen = document.getElementById("gameScreen");

  if (!overlay || !modal || !target || !gameScreen) return;

  overlay.style.display = "block";
  modal.style.display = "block";

  const rect = target.getBoundingClientRect();
  const parent = gameScreen.getBoundingClientRect();

  modal.style.top = `${rect.top - parent.top + 8}px`;
  modal.style.left = `${rect.right - parent.left + 12}px`;
}

function hideTutorial() {
  const overlay = document.getElementById("tutorialOverlay");
  const modal = document.getElementById("tutorialModal");

  if (overlay) overlay.style.display = "none";
  if (modal) modal.style.display = "none";
}

// ================= OPEN EMAIL =================
function openEmail(index) {
  if (mistakes >= maxMistakes) return;
  if (index < 0 || index >= emails.length) return;
  if (emailResults[index]) return;

  currentEmailIndex = index;
  cluesFoundForCurrentEmail = 0;
  selectedClassification = null;
  selectedAction = null;

  if (index === 0) {
    hideTutorial();
  }

  clearDecisionSelection();

  const email = emails[index];

  document.getElementById("emailList").style.display = "none";
  document.getElementById("emailView").style.display = "block";

  document.getElementById("emailSubject").innerText = email.subject;
  document.getElementById("emailSender").innerHTML = email.sender;
  document.getElementById("emailBody").innerHTML = email.body;
  document.getElementById("emailTimestamp").innerText = email.time;

  const item = document.querySelectorAll(".clickable-mail")[index];
  if (item) {
    item.classList.remove("unread");
    item.classList.add("read");
  }

  activateClueClicks();
  updateHUD();
}

// ================= BACK =================
function goBack() {
  document.getElementById("emailList").style.display = "block";
  document.getElementById("emailView").style.display = "none";
}

// ================= CLUE CLICK SYSTEM =================
function activateClueClicks() {
  const emailBody = document.getElementById("emailBody");
  const emailSender = document.getElementById("emailSender");

  if (!emailBody || !emailSender) return;

  emailBody.onclick = null;
  emailSender.onclick = null;

  function markClue(target) {
    if (target.classList.contains("clicked")) return false;

    target.classList.add("clicked");
    cluesFoundForCurrentEmail++;
    stats.cluesFound++;
    score += 10;
    updateHUD();
    return true;
  }

  function handleClick(event) {
    if (mistakes >= maxMistakes) return;

    const target = event.target;
    const attachment = target.closest(".attachment-clue");

    if (attachment) {
      markClue(attachment);
      return;
    }

    if (target.classList.contains("risky-link")) {
      markClue(target);
      setTimeout(() => {
        openLoginSim();
      }, 250);
      return;
    }

    if (target.classList.contains("clickable") || target.classList.contains("clue")) {
      markClue(target);
      return;
    }

    target.classList.add("wrong");
    mistakes++;

    setTimeout(() => {
      target.classList.remove("wrong");
    }, 350);

    updateHUD();

    if (mistakes >= maxMistakes) {
      breachTriggered = true;
      showScreen("breachScreen");
    }
  }

  emailBody.onclick = handleClick;
  emailSender.onclick = handleClick;
}

// ================= QUICK REPORT =================
function quickReport() {
  const email = emails[currentEmailIndex];

  if (emailResults[currentEmailIndex]) return;

  stats.emailsReviewed++;

  if (email.type === "phishing") {
    score += 25;
    stats.safeReports++;
    stats.correctClassifications++;

    showFeedback(
      "Correct — Reported Immediately",
      "You identified and reported the phishing email without engaging further. Immediate reporting is a strong defensive action.",
      "Threat escalated safely",
      ""
    );
  } else {
    mistakes++;
    stats.falsePositives++;
    stats.unsafeEscalations++;

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

  if (mistakes >= maxMistakes) {
    breachTriggered = true;
    showScreen("breachScreen");
  }
}

// ================= DECISION MODAL =================
function openDecisionModal() {
  if (mistakes >= maxMistakes) return;

  const modal = document.getElementById("decisionModal");
  if (modal) modal.style.display = "flex";
}

function closeDecisionModal() {
  const modal = document.getElementById("decisionModal");
  if (modal) modal.style.display = "none";
}

function clearDecisionSelection() {
  selectedClassification = null;
  selectedAction = null;

  document.querySelectorAll(".choice-btn").forEach(btn => {
    btn.classList.remove("selected");
  });
}

function setClassification(value) {
  selectedClassification = value;

  document.getElementById("classifyPhishingBtn").classList.remove("selected");
  document.getElementById("classifySafeBtn").classList.remove("selected");

  if (value === "phishing") {
    document.getElementById("classifyPhishingBtn").classList.add("selected");
  } else {
    document.getElementById("classifySafeBtn").classList.add("selected");
  }
}

function setAction(value) {
  selectedAction = value;

  document.getElementById("actionReportBtn").classList.remove("selected");
  document.getElementById("actionDeleteBtn").classList.remove("selected");
  document.getElementById("actionKeepBtn").classList.remove("selected");
  document.getElementById("actionReplyBtn").classList.remove("selected");

  if (value === "report") document.getElementById("actionReportBtn").classList.add("selected");
  if (value === "delete") document.getElementById("actionDeleteBtn").classList.add("selected");
  if (value === "keep") document.getElementById("actionKeepBtn").classList.add("selected");
  if (value === "reply") document.getElementById("actionReplyBtn").classList.add("selected");
}

// ================= LOGIN SIMULATION =================
function openLoginSim() {
  const modal = document.getElementById("loginSimModal");
  if (modal) modal.style.display = "flex";
}

function closeLoginSim() {
  const modal = document.getElementById("loginSimModal");
  if (modal) modal.style.display = "none";
}

function submitLoginSim() {
  closeLoginSim();

  score = Math.max(score - 15, 0);
  mistakes++;
  stats.riskyActions++;
  breachTriggered = true;

  showFeedback(
    "Credentials Exposed in Simulation",
    "Submitting credentials into a fake login page is one of the most damaging phishing outcomes. In a real attack, this could lead to account compromise.",
    "Credential harvesting simulated",
    "danger"
  );

  markEmailDone(currentEmailIndex);
  emailResults[currentEmailIndex] = true;
  updateHUD();
}

// ================= SUBMIT DECISION =================
function submitDecision() {
  if (!selectedClassification || !selectedAction) {
    alert("Please choose both a classification and an action.");
    return;
  }

  closeDecisionModal();

  const email = emails[currentEmailIndex];
  let title = "";
  let text = "";
  let impact = "";
  let badgeClass = "";
  let classificationCorrect = false;

  if (emailResults[currentEmailIndex]) return;

  stats.emailsReviewed++;

  if (selectedClassification === email.safeClassification) {
    classificationCorrect = true;
    score += 20;
    stats.correctClassifications++;
  } else {
    mistakes++;
  }

  if (email.type === "phishing") {
    if (selectedAction === "report") {
      score += 15;
      stats.safeReports++;
      impact = "Threat safely escalated";
    } else if (selectedAction === "delete") {
      score += 5;
      impact = "Threat removed, but not reported";
      badgeClass = "warn";
    } else if (selectedAction === "keep") {
      mistakes++;
      stats.riskyActions++;
      impact = "Threat remains in inbox";
      badgeClass = "danger";
      breachTriggered = true;
    } else if (selectedAction === "reply") {
      mistakes++;
      stats.riskyActions++;
      impact = "Attacker engagement increased";
      badgeClass = "danger";
      breachTriggered = true;
    }

    if (classificationCorrect && selectedAction === "report") {
      title = "Correct — You handled this phishing email well.";
      text = email.explanation;
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
      score += 10;
      impact = "Normal email flow preserved";
      title = classificationCorrect
        ? "Correct — This email appears legitimate."
        : "Mixed decision.";
      text = email.explanation;
    } else if (selectedAction === "report") {
      mistakes++;
      stats.falsePositives++;
      stats.unsafeEscalations++;
      impact = "False positive created";
      badgeClass = "warn";
      title = "False positive.";
      text = `This email appears legitimate. Reporting safe emails can create noise for the security team. ${email.explanation}`;
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

  if (!impact) impact = "Decision recorded";

  showFeedback(title, text, impact, badgeClass);
  markEmailDone(currentEmailIndex);
  emailResults[currentEmailIndex] = true;
  updateHUD();

  if (mistakes >= maxMistakes) {
    breachTriggered = true;
  }
}

// ================= FEEDBACK =================
function showFeedback(title, text, impact, badgeClass = "") {
  const feedbackModal = document.getElementById("feedbackModal");
  const feedbackTitle = document.getElementById("feedbackTitle");
  const feedbackText = document.getElementById("feedbackText");
  const feedbackImpact = document.getElementById("feedbackImpact");
  const feedbackClues = document.getElementById("feedbackClues");
  const feedbackBadge = document.getElementById("feedbackBadge");

  feedbackTitle.innerText = title;
  feedbackText.innerText = text;
  feedbackImpact.innerText = impact;
  feedbackClues.innerText = `${cluesFoundForCurrentEmail} clue(s)`;
  feedbackBadge.className = "feedback-badge";

  if (badgeClass) {
    feedbackBadge.classList.add(badgeClass);
  }

  feedbackModal.style.display = "flex";
}

function nextEmail() {
  const feedbackModal = document.getElementById("feedbackModal");
  if (feedbackModal) {
    feedbackModal.style.display = "none";
  }

  if (breachTriggered && (mistakes >= maxMistakes || currentEmailIndex === emails.length - 1)) {
    showScreen("breachScreen");
    return;
  }

  if (mistakes >= maxMistakes || emailResults.every(Boolean)) {
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

// ================= MARK EMAIL DONE =================
function markEmailDone(index) {
  const items = document.querySelectorAll(".clickable-mail");
  const item = items[index];

  if (!item || item.dataset.done === "true") return;

  item.dataset.done = "true";
  item.style.opacity = "0.5";
  item.classList.remove("unread");
  item.classList.add("read");
}

// ================= HUD =================
function updateHUD() {
  const scoreEl = document.getElementById("score");
  const progressEl = document.getElementById("progress");
  const mistakesEl = document.getElementById("mistakes");
  const progressFill = document.getElementById("progressFill");

  const reviewedCount = emailResults.filter(Boolean).length;
  const nextLabel = Math.min(reviewedCount + 1, emails.length);
  const percent = (reviewedCount / emails.length) * 100;

  if (scoreEl) scoreEl.innerText = score;
  if (progressEl) progressEl.innerText = `${nextLabel}/${emails.length}`;
  if (mistakesEl) mistakesEl.innerText = `${mistakes}/${maxMistakes}`;
  if (progressFill) progressFill.style.width = `${percent}%`;
}

// ================= FINAL DASHBOARD =================
function showFinalDashboard() {
  const cluePoints = emails.reduce((sum, email) => sum + (email.clueCount * 10), 0);
  const decisionPoints = emails.length * 35;
  const totalPossible = cluePoints + decisionPoints;

  const safeScore = Math.max(score, 0);
  const accuracy = totalPossible > 0 ? Math.round((safeScore / totalPossible) * 100) : 0;

  let risk = "";
  let summary = "";
  let behaviorProfile = "";

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

  if (stats.riskyActions >= 3 || breachTriggered) {
    behaviorProfile = "High Risk User";
  } else if (stats.safeReports >= 3 && stats.falsePositives === 0) {
    behaviorProfile = "Security Aware";
  } else if (stats.falsePositives >= 2) {
    behaviorProfile = "Over-Reporter";
  } else {
    behaviorProfile = "Needs Coaching";
  }

  document.getElementById("finalScore").innerText = safeScore;
  document.getElementById("accuracy").innerText = `${accuracy}%`;
  document.getElementById("risk").innerText = risk;

  document.getElementById("correctClassifications").innerText = stats.correctClassifications;
  document.getElementById("safeReports").innerText = stats.safeReports;
  document.getElementById("riskyActions").innerText = stats.riskyActions;
  document.getElementById("falsePositives").innerText = stats.falsePositives;
  document.getElementById("cluesFound").innerText = stats.cluesFound;
  document.getElementById("emailsReviewed").innerText = stats.emailsReviewed;
  document.getElementById("behaviorProfile").innerText = behaviorProfile;
  document.getElementById("unsafeEscalations").innerText = stats.unsafeEscalations;
  document.getElementById("breachTriggered").innerText = breachTriggered ? "Yes" : "No";
  document.getElementById("coachSummary").innerText = summary;

  showScreen("dashboardScreen");
}