(() => {
  const PRO_KEY = "2kiq_lab_pro_unlocked";
  const THEME_KEY = "2kiq_lab_theme";
  const LOADOUT_KEY = "2kiq_lab_saved_loadouts";
  const STRIPE_LINK = "https://buy.stripe.com/eVqaEZ768eFggv3e5NcbC03";

  const state = {
    reports: {},
    latestAnimationLoadout: null,
    initialProMarkup: {},
  };

  const byId = (id) => document.getElementById(id);
  const qa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const toNumber = (value, min, max) => {
    if (value === undefined || value === null || String(value).trim() === "") {
      return null;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    return clamp(parsed, min, max);
  };

  const escapeHtml = (text) =>
    String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const showToast = (message) => {
    const toast = byId("toast");
    if (!toast) {
      return;
    }
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(() => {
      toast.classList.remove("show");
    }, 2000);
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_error) {
      const helper = document.createElement("textarea");
      helper.value = text;
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.focus();
      helper.select();
      const copied = document.execCommand("copy");
      helper.remove();
      return copied;
    }
  };

  const isPro = () => localStorage.getItem(PRO_KEY) === "true";

  const setPro = (enabled) => {
    localStorage.setItem(PRO_KEY, enabled ? "true" : "false");
  };

  const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    const toggle = byId("theme-toggle");
    if (toggle) {
      toggle.textContent = theme === "dark" ? "Light" : "Dark";
      toggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }
  };

  const initializeTheme = () => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") {
      applyTheme(saved);
      return;
    }
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(systemDark ? "dark" : "light");
  };

  const scoreClass = (score, maxScore = 100) => {
    const ratio = maxScore <= 0 ? 0 : score / maxScore;
    if (ratio >= 0.7) {
      return "score-high";
    }
    if (ratio >= 0.45) {
      return "score-mid";
    }
    return "score-low";
  };

  const updateSharePreview = (report) => {
    const preview = byId("share-preview");
    if (!preview || !report) {
      return;
    }
    preview.innerHTML = `
      <h3>${escapeHtml(report.title)}</h3>
      <p>${escapeHtml(report.summary)}</p>
      <p class="tiny-note">${escapeHtml(report.verdict ? `Verdict: ${report.verdict}` : "Summary ready to share")}</p>
    `;
  };

  const renderReport = (targetId, toolId, report) => {
    const target = byId(targetId);
    if (!target) {
      return;
    }

    const metrics = (report.metrics || [])
      .map(
        (metric) => `
        <div class="metric">
          <div class="label">${escapeHtml(metric.label)}</div>
          <div class="value">${escapeHtml(metric.value)}</div>
        </div>
      `
      )
      .join("");

    const findings = (report.findings || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    const fixes = (report.fixes || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");

    const proActions = isPro()
      ? `
      <button class="secondary-btn" type="button" data-action="export-image" data-tool="${escapeHtml(toolId)}">Export Image</button>
      <button class="secondary-btn" type="button" data-action="copy-link" data-tool="${escapeHtml(toolId)}">Copy Share Link</button>
    `
      : `
      <button class="secondary-btn open-pro-modal" type="button">Pro: Export Image</button>
      <button class="secondary-btn open-pro-modal" type="button">Pro: Share Link</button>
    `;

    target.classList.remove("empty");
    target.innerHTML = `
      <div class="report-top">
        <h3>${escapeHtml(report.title)}</h3>
        <span class="score-pill ${scoreClass(report.primaryScore, report.maxScore)}">${escapeHtml(report.scoreLabel)}</span>
      </div>
      ${report.verdict ? `<p><strong>Verdict:</strong> ${escapeHtml(report.verdict)}</p>` : ""}
      ${metrics ? `<div class="metric-grid">${metrics}</div>` : ""}
      <div class="report-columns">
        <div>
          <h4>Key Findings</h4>
          <ul>${findings}</ul>
        </div>
        <div>
          <h4>Recommended Fixes</h4>
          <ul>${fixes}</ul>
        </div>
      </div>
      <div class="report-actions">
        <button class="secondary-btn" type="button" data-action="copy-summary" data-tool="${escapeHtml(toolId)}">Copy Summary</button>
        ${proActions}
      </div>
    `;

    state.reports[toolId] = report;
    updateSharePreview(report);
  };

  const renderReportMessage = (targetId, message) => {
    const target = byId(targetId);
    if (!target) {
      return;
    }
    target.classList.remove("empty");
    target.innerHTML = `<p>${escapeHtml(message)}</p>`;
  };

  const clearReport = (targetId, emptyText) => {
    const target = byId(targetId);
    if (!target) {
      return;
    }
    target.classList.add("empty");
    target.textContent = emptyText;
  };

  const renderProDetail = (targetId, html, lockedText) => {
    const target = byId(targetId);
    if (!target) {
      return;
    }
    if (isPro()) {
      target.classList.remove("pro-locked");
      target.innerHTML = html;
    } else {
      target.classList.add("pro-locked");
      target.innerHTML = `<div class="pro-lock-message">${escapeHtml(lockedText)}</div>`;
    }
  };

  const getModal = () => byId("pro-modal");

  const openModal = () => {
    const modal = getModal();
    if (!modal) {
      return;
    }
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    const modal = getModal();
    if (!modal) {
      return;
    }
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  const applyProState = () => {
    const pro = isPro();
    document.body.classList.toggle("hide-ads", pro);

    const stateBadge = byId("pro-state");
    if (stateBadge) {
      stateBadge.textContent = pro ? "Pro Active" : "Free Mode";
    }

    const note = byId("pro-storage-note");
    if (note) {
      note.textContent = pro
        ? "Pro active on this device/browser."
        : "Pro unlock stored on this device/browser.";
    }

    qa(".pro-extra").forEach((node) => {
      node.classList.toggle("pro-locked", !pro);
    });

    const animationMessage = byId("animation-pro-message");
    if (animationMessage) {
      animationMessage.textContent = pro
        ? "Pro mode active: save multiple loadouts and compare presets."
        : "Pro feature: save multiple loadouts and compare.";
    }

    refreshLoadoutSelects();
  };

  const initializeProMarkupDefaults = () => {
    qa(".pro-extra").forEach((node) => {
      if (node.id) {
        state.initialProMarkup[node.id] = node.innerHTML;
      }
    });
  };

  const buildShareLink = (toolId, summary) => {
    const url = new URL(window.location.href);
    url.searchParams.set("tool", toolId);
    url.searchParams.set("summary", summary);
    return url.toString();
  };

  const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
    const words = text.split(" ");
    let line = "";
    let currentY = y;

    words.forEach((word, index) => {
      const testLine = `${line}${word} `;
      const width = ctx.measureText(testLine).width;
      if (width > maxWidth && index > 0) {
        ctx.fillText(line.trim(), x, currentY);
        line = `${word} `;
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    });

    if (line) {
      ctx.fillText(line.trim(), x, currentY);
      currentY += lineHeight;
    }
    return currentY;
  };

  const exportReportCard = (report) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1200;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#0b1119");
    gradient.addColorStop(1, "#141f34");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.fillRect(70, 70, canvas.width - 140, canvas.height - 140);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "700 56px system-ui";
    ctx.fillText("2K IQ Lab Report", 120, 180);

    ctx.fillStyle = "#93c5fd";
    ctx.font = "700 42px system-ui";
    ctx.fillText(report.title, 120, 250);

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "600 32px system-ui";
    ctx.fillText(report.scoreLabel, 120, 315);

    ctx.fillStyle = "#d1d5db";
    ctx.font = "500 30px system-ui";
    let y = wrapText(ctx, report.summary, 120, 390, 960, 42);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "700 32px system-ui";
    y += 20;
    ctx.fillText("Top Findings", 120, y);

    ctx.fillStyle = "#d1d5db";
    ctx.font = "500 28px system-ui";
    y += 48;
    report.findings.slice(0, 3).forEach((finding) => {
      y = wrapText(ctx, `• ${finding}`, 120, y, 960, 36);
    });

    y += 10;
    ctx.fillStyle = "#f8fafc";
    ctx.font = "700 32px system-ui";
    ctx.fillText("Recommended Fixes", 120, y);

    ctx.fillStyle = "#d1d5db";
    ctx.font = "500 28px system-ui";
    y += 48;
    report.fixes.slice(0, 3).forEach((fix) => {
      y = wrapText(ctx, `• ${fix}`, 120, y, 960, 36);
    });

    ctx.fillStyle = "#60a5fa";
    ctx.font = "600 22px system-ui";
    ctx.fillText("2kiqlab static share card", 120, canvas.height - 110);

    const link = document.createElement("a");
    link.download = `${report.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const loadLoadouts = () => {
    try {
      const raw = localStorage.getItem(LOADOUT_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  };

  const saveLoadouts = (loadouts) => {
    localStorage.setItem(LOADOUT_KEY, JSON.stringify(loadouts));
  };

  const refreshLoadoutSelects = () => {
    const selectA = byId("loadout-a");
    const selectB = byId("loadout-b");
    if (!selectA || !selectB) {
      return;
    }

    const loadouts = loadLoadouts();

    const buildOptions = (selectedId) => {
      if (!loadouts.length) {
        return `<option value="">No saved loadouts</option>`;
      }
      return loadouts
        .map(
          (item) =>
            `<option value="${escapeHtml(item.id)}" ${selectedId === item.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`
        )
        .join("");
    };

    const previousA = selectA.value;
    const previousB = selectB.value;
    selectA.innerHTML = buildOptions(previousA);
    selectB.innerHTML = buildOptions(previousB);
  };

  const hash = (text) => {
    let result = 0;
    for (let i = 0; i < text.length; i += 1) {
      result = (result << 5) - result + text.charCodeAt(i);
      result |= 0;
    }
    return Math.abs(result);
  };

  const analyzeTeammate = (form) => {
    const gradeMap = {
      "A+": 96,
      A: 92,
      "A-": 88,
      "B+": 84,
      B: 80,
      "B-": 76,
      "C+": 72,
      C: 68,
      "C-": 64,
      "D+": 58,
      D: 52,
      "D-": 46,
      F: 38,
    };

    const platform = form.platform.value;
    const role = form.role.value;
    if (!platform || !role) {
      renderReportMessage("teammate-report", "Select platform and role first.");
      return;
    }

    const winPct = toNumber(form.winPct.value, 0, 100);
    const points = toNumber(form.points.value, 0, 100);
    const assists = toNumber(form.assists.value, 0, 30);
    const turnovers = toNumber(form.turnovers.value, 0, 20);
    const rebounds = toNumber(form.rebounds.value, 0, 30);
    const quitRate = toNumber(form.quitRate.value, 0, 100);
    const shotPct = toNumber(form.shotPct.value, 0, 100);
    const threePct = toNumber(form.threePct.value, 0, 100);
    const grade = form.grade.value;

    const filledStats = [winPct, points, assists, turnovers, rebounds, quitRate, shotPct, threePct].filter(
      (value) => value !== null
    ).length;

    if (filledStats < 2 && !grade) {
      renderReportMessage(
        "teammate-report",
        "Add at least two stats (or a teammate grade) for a reliable scan."
      );
      return;
    }

    const normalized = {
      winPct: winPct ?? 50,
      points: points ?? 14,
      assists: assists ?? 3,
      turnovers: turnovers ?? 2.5,
      rebounds: rebounds ?? (role === "Big" ? 8 : 4),
      quitRate: quitRate ?? 8,
      shotPct: shotPct ?? 49,
      threePct: threePct ?? 35,
      gradeScore: gradeMap[grade] ?? 72,
    };

    let ballHog =
      5 +
      (normalized.points - normalized.assists * 1.7) / 6 +
      (normalized.points >= 24 ? 1 : 0) +
      (normalized.shotPct < 38 ? 0.8 : 0) -
      (normalized.assists >= 7 ? 1.2 : 0);
    ballHog = clamp(ballHog, 0, 10);

    let passIq =
      5 +
      normalized.assists / 2.2 -
      normalized.turnovers * 0.65 +
      (normalized.gradeScore - 70) / 12 +
      (role === "Big" && normalized.rebounds >= 9 ? 0.75 : 0);
    passIq = clamp(passIq, 0, 10);

    let sellerRisk =
      2 +
      normalized.turnovers * 0.9 +
      normalized.quitRate / 9 +
      (100 - normalized.winPct) / 22 +
      (65 - normalized.gradeScore) / 18;
    if (normalized.quitRate >= 35) {
      sellerRisk += 2.2;
    }
    sellerRisk = clamp(sellerRisk, 0, 10);

    const overall = clamp(
      Math.round(
        58 +
          (normalized.winPct - 50) * 0.32 +
          passIq * 4.2 -
          ballHog * 2.3 -
          sellerRisk * 2.8 +
          (normalized.shotPct - 45) * 0.35 +
          (normalized.threePct - 33) * 0.25 +
          (normalized.gradeScore - 70) * 0.25
      ),
      0,
      100
    );

    const verdict = overall >= 74 ? "RUN IT" : overall >= 52 ? "RISKY" : "AVOID";

    const findings = [];
    if (ballHog > 7) {
      findings.push("Usage leans ball-dominant; touches likely stop with this teammate.");
    }
    if (passIq < 4.5) {
      findings.push("Passing reads project below average under pressure.");
    }
    if (sellerRisk > 7) {
      findings.push("Seller risk is high due to turnovers, quit rate, or weak consistency.");
    }
    if (normalized.quitRate >= 20) {
      findings.push("Quit tendency is elevated and can throw close games.");
    }
    if (normalized.turnovers >= 4) {
      findings.push("Turnover profile suggests forced actions in traffic.");
    }
    if (findings.length < 3) {
      findings.push("Shot profile is stable enough for role-based offense.");
      findings.push("Rebounding and grade indicators support baseline team value.");
    }

    const fixes = [];
    if (ballHog > 6.2) {
      fixes.push("Run first-possession touch rule: 2 passes before first self-created shot.");
    }
    if (passIq < 6) {
      fixes.push("Use simple reads: strong-side hit, corner skip, or reset at top.");
    }
    if (sellerRisk > 6) {
      fixes.push("Set a no-risk rule in red timing: no cross-court passes in traffic.");
    }
    if (normalized.quitRate > 15) {
      fixes.push("Queue only after agreement on role touches and defensive assignments.");
    }
    fixes.push("Call out two play types before tip: one half-court, one transition action.");

    const report = {
      title: "Teammate IQ Report Card",
      primaryScore: overall,
      maxScore: 100,
      scoreLabel: `Overall ${overall}/100`,
      verdict,
      metrics: [
        { label: "Ball Hog Rating", value: `${ballHog.toFixed(1)}/10` },
        { label: "Pass IQ", value: `${passIq.toFixed(1)}/10` },
        { label: "Seller Risk", value: `${sellerRisk.toFixed(1)}/10` },
      ],
      findings: findings.slice(0, 5),
      fixes: fixes.slice(0, 5),
      summary: `Teammate score ${overall}/100 (${verdict}) • Ball Hog ${ballHog.toFixed(
        1
      )}/10 • Pass IQ ${passIq.toFixed(1)}/10 • Seller Risk ${sellerRisk.toFixed(1)}/10.`,
    };

    renderReport("teammate-report", "teammate", report);

    const proHtml = `
      <div class="pro-rich">
        <h4>Pro breakdown</h4>
        <p>Role fit on ${escapeHtml(platform)}: this profile projects ${escapeHtml(
      verdict
    )} with a stronger outcome if turnovers stay under ${(normalized.turnovers - 0.8).toFixed(1)} and assists rise by 1-2 per game.</p>
        <ul>
          <li>Best teammate pairing: ${
            role === "Guard" ? "spot-up wing + glass big" : role === "Wing" ? "creator guard + anchor big" : "creator guard + weak-side shooter"
          }.</li>
          <li>Personalized trigger: ${
            ballHog > 6 ? "force early pass clock to keep everyone involved" : "use this player as primary advantage creator"
          }.</li>
          <li>Risk reducer: target quit rate under ${Math.max(5, normalized.quitRate - 6).toFixed(0)}% for stable sessions.</li>
        </ul>
      </div>
    `;

    renderProDetail("teammate-pro", proHtml, "Pro adds deeper behavioral reads and personalized fixes.");
  };

  const analyzeLosing = (form) => {
    const stats = {
      fg: [toNumber(form.teamFg.value, 0, 100), toNumber(form.oppFg.value, 0, 100)],
      three: [toNumber(form.team3.value, 0, 100), toNumber(form.opp3.value, 0, 100)],
      tov: [toNumber(form.teamTov.value, 0, 40), toNumber(form.oppTov.value, 0, 40)],
      orb: [toNumber(form.teamOrb.value, 0, 40), toNumber(form.oppOrb.value, 0, 40)],
      drb: [toNumber(form.teamDrb.value, 0, 60), toNumber(form.oppDrb.value, 0, 60)],
      fouls: [toNumber(form.teamFouls.value, 0, 40), toNumber(form.oppFouls.value, 0, 40)],
      fb: [toNumber(form.teamFb.value, 0, 80), toNumber(form.oppFb.value, 0, 80)],
    };

    const comparableCount = Object.values(stats).filter(([team, opp]) => team !== null && opp !== null).length;
    if (!comparableCount) {
      renderReportMessage("losing-report", "Add at least one matching stat pair for your team and opponent.");
      return;
    }

    const causes = [];

    const fgGap = stats.fg[1] !== null && stats.fg[0] !== null ? stats.fg[1] - stats.fg[0] : 0;
    const threeGap = stats.three[1] !== null && stats.three[0] !== null ? stats.three[1] - stats.three[0] : 0;
    const shootingSeverity = Math.max(0, fgGap * 1.1 + threeGap * 0.9);
    if (shootingSeverity > 1.5) {
      causes.push({
        label: "Poor shot quality / efficiency gap",
        severity: shootingSeverity,
        detail: `Opponent shot ${fgGap.toFixed(1)}% better FG and ${threeGap.toFixed(1)}% better from three.`,
        fix: "Run one paint touch before each perimeter shot in half-court sets.",
      });
    }

    const tovGap = stats.tov[0] !== null && stats.tov[1] !== null ? stats.tov[0] - stats.tov[1] : 0;
    if (tovGap > 0.8) {
      causes.push({
        label: "Turnovers killed possessions",
        severity: tovGap * 1.7,
        detail: `Your team gave away ${tovGap.toFixed(1)} more possessions via turnovers.`,
        fix: "Call safer outlet lanes and avoid live-dribble cross-court passes.",
      });
    }

    const reboundGap =
      stats.orb[0] !== null &&
      stats.orb[1] !== null &&
      stats.drb[0] !== null &&
      stats.drb[1] !== null
        ? stats.orb[1] + stats.drb[1] - (stats.orb[0] + stats.drb[0])
        : 0;
    if (reboundGap > 1.5) {
      causes.push({
        label: "Rebounding gap",
        severity: reboundGap * 1.2,
        detail: `Opponent controlled roughly ${reboundGap.toFixed(1)} extra boards.`,
        fix: "Tag roller early, then crash with weak-side wing on every contest.",
      });
    }

    const foulGap = stats.fouls[0] !== null && stats.fouls[1] !== null ? stats.fouls[0] - stats.fouls[1] : 0;
    if (foulGap > 2) {
      causes.push({
        label: "Foul pressure",
        severity: foulGap * 1.1,
        detail: `You committed ${foulGap.toFixed(1)} more fouls, gifting free points.`,
        fix: "Contain with chest-up defense and avoid swipe reaches in bonus.",
      });
    }

    const fbGap = stats.fb[1] !== null && stats.fb[0] !== null ? stats.fb[1] - stats.fb[0] : 0;
    if (fbGap > 2) {
      causes.push({
        label: "Transition defense breakdown",
        severity: fbGap * 0.9,
        detail: `Opponent converted ${fbGap.toFixed(1)} more fastbreak points.`,
        fix: "Send one guard back immediately on all shot attempts.",
      });
    }

    if (!causes.length) {
      causes.push({
        label: "Execution in late possessions",
        severity: 8,
        detail: "Stat gaps are small; this likely came down to late-clock decisions.",
        fix: "Install two clutch sets and assign first and second read before inbound.",
      });
    }

    causes.sort((a, b) => b.severity - a.severity);
    const topCauses = causes.slice(0, 3);
    const pressureIndex = clamp(Math.round(topCauses.reduce((sum, item) => sum + item.severity, 0) * 4), 0, 100);
    const stability = clamp(100 - pressureIndex, 0, 100);

    const report = {
      title: "Loss Cause Report Card",
      primaryScore: stability,
      maxScore: 100,
      scoreLabel: `Stability ${stability}/100`,
      verdict: stability >= 70 ? "Minor fixes needed" : stability >= 45 ? "Work needed" : "Urgent cleanup",
      metrics: [
        { label: "Pressure Index", value: `${pressureIndex}/100` },
        { label: "Compared Metrics", value: `${comparableCount}` },
      ],
      findings: topCauses.map((cause) => `${cause.label}: ${cause.detail}`),
      fixes: topCauses.map((cause) => cause.fix),
      summary: `Top loss causes: ${topCauses.map((item) => item.label).join(" • ")}.`,
    };

    renderReport("losing-report", "losing", report);

    const proHtml = `
      <div class="pro-rich">
        <h4>Pro practice plan</h4>
        <ul>
          <li>10-minute turnover discipline drill: no jump passes, no cross-court live dribble passes.</li>
          <li>8-minute rebound positioning drill: weak-side crash assignment on every shot.</li>
          <li>6-minute transition shell: first two defenders sprint to paint then fan out.</li>
        </ul>
        <button class="secondary-btn" type="button" data-action="print-plan">Print Routine</button>
      </div>
    `;

    renderProDetail("losing-pro", proHtml, "Pro adds a printable practice checklist and routine.");
  };

  const analyzeCounter = (form) => {
    const archetype = form.archetype.value.trim();
    const heightRange = form.heightRange.value;
    const threat = form.threat.value;
    const pnr = form.pnr.value;

    if (!archetype || !heightRange || !threat || !pnr) {
      renderReportMessage("counter-report", "Complete all matchup fields to generate a counter plan.");
      return;
    }

    const weaknessMap = {
      shooting: [
        "Relies on rhythm and space before launch.",
        "Efficiency drops when forced left-right into contested pull-ups.",
        "Can be baited into deep range attempts late clock.",
      ],
      finishing: [
        "Needs downhill angle; stalls when walled early.",
        "Tends to force contact in crowded paint.",
        "Handle pressure at half court disrupts momentum.",
      ],
      playmaking: [
        "Primary read dependence creates predictable pass windows.",
        "Likes same-side shake into corner skip.",
        "Gets impatient versus delayed help and recoveries.",
      ],
      defense: [
        "Aggressive closeouts are vulnerable to backdoor cuts.",
        "Can over-help off strong shooters.",
        "Tries to jump lanes early, leaving slips open.",
      ],
    };

    const tacticMap = {
      shooting: [
        "Top-lock off-ball and force cuts into traffic.",
        "Show high on screens, then peel switch late.",
        "Force drive to weak hand and rotate early from nail.",
        "Contest with vertical body, avoid jump fouls.",
        "Live with midrange pull-up over corner threes.",
      ],
      finishing: [
        "Gap one step and load two defenders at free throw line.",
        "Bring low man earlier on strong-hand drives.",
        "Ice side PnR to keep ball out of middle.",
        "Force kickouts by shrinking restricted area.",
        "Rotate rebound responsibility before every possession.",
      ],
      playmaking: [
        "Blitz first two PnRs to force early ball pickup.",
        "Stunt from corner then recover to shooters.",
        "Switch late clock to remove first read.",
        "Deny inbound return pass after outlet.",
        "Use one possession of zone look to break rhythm.",
      ],
      defense: [
        "Use ghost screens to force decision errors.",
        "Slip early when they hedge aggressively.",
        "Stack shooter in weak corner to punish over-help.",
        "Call flare counter when lock defender top-locks.",
        "Push pace after every stop before matchups set.",
      ],
    };

    const rolePlan = {
      Guard: "Set pace and pull help side with early paint touch, then spray to corner.",
      Wing: "Live in gap help, tag rollers, and be first leak-out option on stops.",
      Big: "Anchor screen level, communicate coverages, and dominate first rebound contact.",
    };

    const seed = hash(`${archetype}:${heightRange}:${threat}:${pnr}`);
    const counterConfidence = clamp(63 + (seed % 26) + (pnr === "no" ? 4 : 0), 45, 96);

    const findings = [...weaknessMap[threat]];
    if (pnr === "yes") {
      findings.push("Pick-and-roll frequency makes coverage discipline the deciding factor.");
    }

    const fixes = [...tacticMap[threat]];
    const report = {
      title: "Counter Matchup Report",
      primaryScore: counterConfidence,
      maxScore: 100,
      scoreLabel: `Counter Confidence ${counterConfidence}/100`,
      verdict: counterConfidence >= 78 ? "Prepared" : counterConfidence >= 58 ? "Manageable" : "Needs tighter plan",
      metrics: [
        { label: "Primary Threat", value: threat[0].toUpperCase() + threat.slice(1) },
        { label: "PnR Usage", value: pnr === "yes" ? "High" : "Low" },
      ],
      findings: findings.slice(0, 5),
      fixes: fixes.slice(0, 5),
      summary: `Vs ${archetype}, pressure the ${threat} threat early and execute role discipline to control tempo.`,
    };

    renderReport("counter-report", "counter", report);

    const proHtml = `
      <div class="pro-rich">
        <h4>Pro play-calling branch</h4>
        <ul>
          <li><strong>Base call:</strong> ${escapeHtml(
            threat === "shooting" ? "Top-lock floppy into switch-back" : threat === "finishing" ? "Pack-line contain into box out" : threat === "playmaking" ? "Show-and-recover, then late switch" : "Ghost and slip chain"
          )}.</li>
          <li><strong>If they adjust:</strong> ${escapeHtml(
            pnr === "yes" ? "Drop blitz frequency and pre-rotate weak side earlier." : "Increase off-ball denial and force secondary handler to create."
          )}</li>
          <li><strong>Role focus:</strong> Guard: ${escapeHtml(rolePlan.Guard)} Wing: ${escapeHtml(rolePlan.Wing)} Big: ${escapeHtml(rolePlan.Big)}</li>
        </ul>
      </div>
    `;

    renderProDetail("counter-pro", proHtml, "Pro adds play-calling and adjustment branches.");
  };

  const analyzeAnimation = (form) => {
    const height = toNumber(form.height.value, 60, 90);
    const ballHandle = toNumber(form.ballHandle.value, 25, 99);
    const threeRating = toNumber(form.threeRating.value, 25, 99);
    const dunkRating = toNumber(form.dunkRating.value, 25, 99);
    const playstyles = qa('input[name="playstyle"]:checked', form).map((box) => box.value);

    if (height === null || ballHandle === null || threeRating === null || dunkRating === null) {
      renderReportMessage("animation-report", "Enter all required ratings to optimize your loadout.");
      return;
    }

    const dribblePackage =
      ballHandle >= 92
        ? "Kyrie Escape + Trae Size-Up"
        : ballHandle >= 86
        ? "Pro Dribble Style + Zach LaVine Combo"
        : ballHandle >= 80
        ? "De'Aaron Burst + Basic Breakdown"
        : "Fundamental Dribble Control";

    const jumpShot =
      threeRating >= 92
        ? "T-Mac Base / Oscar Upper / Quick Release"
        : threeRating >= 85
        ? "Kobe Base / Bey Upper / A- Speed"
        : threeRating >= 78
        ? "Cam Johnson Base / Korver Blend"
        : "Set Shot 14 / Balanced Cue";

    const dunkPackage =
      dunkRating >= 94
        ? "Elite Contact + Quick Drops Off One"
        : dunkRating >= 87
        ? "Pro Contact + Side Clutches"
        : dunkRating >= 75
        ? "Athletic Hangs Off One"
        : "Safe Rim Protect Finishes";

    const layupPackage =
      height >= 80
        ? "Long Athlete"
        : playstyles.includes("quick stop")
        ? "Default Swing"
        : playstyles.includes("rim run")
        ? "Zach LaVine"
        : "Jordan Layup";

    const defenseMotion =
      playstyles.includes("lock") || height >= 80 ? "Defensive Slide: Kawhi" : "Defensive Slide: Jrue";

    const compatibility = clamp(
      Math.round((ballHandle * 0.34 + threeRating * 0.36 + dunkRating * 0.3) / 1 - Math.abs(height - 78) * 0.4),
      38,
      99
    );

    const findings = [
      `Primary dribble fit is ${dribblePackage}.`,
      `Shot profile aligns with ${jumpShot}.`,
      `Finishing package points to ${dunkPackage}.`,
    ];

    if (playstyles.includes("iso")) {
      findings.push("Iso tag boosts value from high-escape dribble timing windows.");
    }
    if (playstyles.includes("spot up")) {
      findings.push("Spot-up tag benefits most from stable catch-and-shoot base timing.");
    }

    const fixes = [
      "Keep release speed one tier below max if timing window feels volatile.",
      "Pair quick stop with one go-to combo package to avoid over-dribbling.",
      "Recheck finishing package after every dunk rating milestone.",
      "Use one defensive animation preset for all comps to keep rotations consistent.",
    ];

    const loadout = {
      dribblePackage,
      jumpShot,
      dunkPackage,
      layupPackage,
      defenseMotion,
      playstyles,
      compatibility,
      createdAt: new Date().toISOString(),
    };

    state.latestAnimationLoadout = loadout;

    const report = {
      title: "Animation Loadout Report",
      primaryScore: compatibility,
      maxScore: 100,
      scoreLabel: `Loadout Fit ${compatibility}/100`,
      verdict: compatibility >= 80 ? "High fit" : compatibility >= 62 ? "Solid fit" : "Needs tuning",
      metrics: [
        { label: "Dribble", value: dribblePackage },
        { label: "Jump Shot", value: jumpShot },
        { label: "Dunk", value: dunkPackage },
        { label: "Layup", value: layupPackage },
        { label: "Defense", value: defenseMotion },
      ],
      findings: findings.slice(0, 5),
      fixes: fixes.slice(0, 5),
      summary: `Recommended loadout: ${dribblePackage}; ${jumpShot}; ${dunkPackage}. Fit ${compatibility}/100.`,
    };

    renderReport("animation-report", "animation", report);

    const animationMessage = byId("animation-pro-message");
    if (animationMessage) {
      animationMessage.textContent = isPro()
        ? "Pro mode active: save this loadout and compare it against other presets."
        : "Pro feature: save multiple loadouts and compare.";
    }
    refreshLoadoutSelects();
  };

  const analyzeChemistry = (form) => {
    const players = [];

    for (let i = 1; i <= 5; i += 1) {
      const role = form[`p${i}Role`].value;
      const style = form[`p${i}Style`].value;
      const player = {
        role,
        style,
        three: toNumber(form[`p${i}3pt`].value, 25, 99),
        perD: toNumber(form[`p${i}PerD`].value, 25, 99),
        intD: toNumber(form[`p${i}IntD`].value, 25, 99),
        reb: toNumber(form[`p${i}Reb`].value, 25, 99),
        play: toNumber(form[`p${i}Play`].value, 25, 99),
      };

      const hasData =
        role ||
        style ||
        [player.three, player.perD, player.intD, player.reb, player.play].some((value) => value !== null);

      if (hasData) {
        players.push(player);
      }
    }

    if (players.length < 3) {
      renderReportMessage("chemistry-report", "Add at least 3 player profiles to evaluate chemistry.");
      return;
    }

    const roleCounts = { Guard: 0, Wing: 0, Big: 0 };
    const styleCounts = { creator: 0, shooter: 0, lock: 0, slasher: 0, glass: 0 };

    players.forEach((player) => {
      if (player.role && roleCounts[player.role] !== undefined) {
        roleCounts[player.role] += 1;
      }
      if (player.style && styleCounts[player.style] !== undefined) {
        styleCounts[player.style] += 1;
      }
    });

    const hasRimProtector = players.some(
      (player) => (player.intD !== null && player.intD >= 75) || player.style === "glass" || (player.role === "Big" && (player.intD ?? 0) >= 68)
    );
    const hasPoaDefender = players.some(
      (player) => (player.perD !== null && player.perD >= 75) || player.style === "lock"
    );
    const hasSecondaryHandler = players.some(
      (player) => (player.play !== null && player.play >= 70) || (player.style === "creator" && (player.role === "Guard" || player.role === "Wing"))
    );
    const hasRebounder = players.some(
      (player) => (player.reb !== null && player.reb >= 75) || player.style === "glass"
    );
    const hasFloorSpacer = players.some(
      (player) => (player.three !== null && player.three >= 78) || player.style === "shooter"
    );

    const missingRoles = [];
    if (!hasRimProtector) {
      missingRoles.push("Rim protector");
    }
    if (!hasPoaDefender) {
      missingRoles.push("POA defender");
    }
    if (!hasSecondaryHandler) {
      missingRoles.push("Secondary handler");
    }
    if (!hasRebounder) {
      missingRoles.push("Rebounder");
    }
    if (!hasFloorSpacer) {
      missingRoles.push("Floor spacer");
    }

    let balanceScore = 74;
    balanceScore += roleCounts.Guard ? 6 : -12;
    balanceScore += roleCounts.Wing ? 5 : -8;
    balanceScore += roleCounts.Big ? 8 : -14;
    balanceScore += styleCounts.creator ? 4 : -8;
    balanceScore += styleCounts.shooter ? 4 : -8;
    balanceScore += styleCounts.lock ? 4 : -2;
    balanceScore += styleCounts.glass ? 3 : 0;
    balanceScore += players.length === 5 ? 4 : 0;
    balanceScore -= missingRoles.length * 7;
    balanceScore = clamp(Math.round(balanceScore), 0, 100);

    const fixes = [];
    if (missingRoles.includes("Rim protector")) {
      fixes.push("Add a Big/lock with stronger interior defense and paint timing.");
    }
    if (missingRoles.includes("POA defender")) {
      fixes.push("Assign one wing or guard to lockdown perimeter point-of-attack duties.");
    }
    if (missingRoles.includes("Secondary handler")) {
      fixes.push("Upgrade one off-guard to secondary creator responsibilities.");
    }
    if (missingRoles.includes("Rebounder")) {
      fixes.push("Shift one wing toward glass responsibilities and crash rules.");
    }
    if (missingRoles.includes("Floor spacer")) {
      fixes.push("Add one high-confidence spot-up shooter to punish help rotations.");
    }
    if (!fixes.length) {
      fixes.push("Keep role discipline and rotate matchup assignments every two possessions.");
      fixes.push("Use one default transition coverage call to reduce confusion.");
      fixes.push("Re-check chemistry after every major build or badge change.");
    }

    const findings = [
      `Role split: ${roleCounts.Guard} Guard / ${roleCounts.Wing} Wing / ${roleCounts.Big} Big.`,
      `Style spread: creator ${styleCounts.creator}, shooter ${styleCounts.shooter}, lock ${styleCounts.lock}, slasher ${styleCounts.slasher}, glass ${styleCounts.glass}.`,
      missingRoles.length
        ? `Missing role coverage: ${missingRoles.join(", ")}.`
        : "No critical role gaps detected from supplied inputs.",
    ];

    const verdict = balanceScore >= 78 ? "Balanced" : balanceScore >= 55 ? "Playable with tweaks" : "Needs rebuild";

    const report = {
      title: "Squad Chemistry Report",
      primaryScore: balanceScore,
      maxScore: 100,
      scoreLabel: `Balance ${balanceScore}/100`,
      verdict,
      metrics: [{ label: "Players Entered", value: `${players.length}` }, { label: "Missing Roles", value: `${missingRoles.length}` }],
      findings,
      fixes: fixes.slice(0, 5),
      summary: `Chemistry score ${balanceScore}/100. ${
        missingRoles.length ? `Missing: ${missingRoles.join(", ")}.` : "Role coverage looks complete."
      }`,
    };

    renderReport("chemistry-report", "chemistry", report);

    const altCompA = "Guard creator • Wing lock • Wing shooter • Big glass • Guard secondary playmaker";
    const altCompB = "Guard shooter • Wing creator • Wing slasher • Big rim anchor • Wing lock spacer";

    const proHtml = `
      <div class="pro-rich">
        <h4>Pro optimal alternatives</h4>
        <ul>
          <li><strong>Comp A:</strong> ${escapeHtml(altCompA)}</li>
          <li><strong>Comp B:</strong> ${escapeHtml(altCompB)}</li>
        </ul>
      </div>
    `;

    renderProDetail("chemistry-pro", proHtml, "Pro generates alternate optimal team compositions.");
  };

  const initializeForms = () => {
    const teammateForm = byId("teammate-form");
    if (teammateForm) {
      teammateForm.addEventListener("submit", (event) => {
        event.preventDefault();
        analyzeTeammate(teammateForm);
      });
    }

    const losingForm = byId("losing-form");
    if (losingForm) {
      losingForm.addEventListener("submit", (event) => {
        event.preventDefault();
        analyzeLosing(losingForm);
      });
    }

    const counterForm = byId("counter-form");
    if (counterForm) {
      counterForm.addEventListener("submit", (event) => {
        event.preventDefault();
        analyzeCounter(counterForm);
      });
    }

    const animationForm = byId("animation-form");
    if (animationForm) {
      animationForm.addEventListener("submit", (event) => {
        event.preventDefault();
        analyzeAnimation(animationForm);
      });
    }

    const chemistryForm = byId("chemistry-form");
    if (chemistryForm) {
      chemistryForm.addEventListener("submit", (event) => {
        event.preventDefault();
        analyzeChemistry(chemistryForm);
      });
    }

    qa("[data-reset-form]").forEach((button) => {
      button.addEventListener("click", () => {
        const formId = button.getAttribute("data-reset-form");
        const reportTarget = button.getAttribute("data-report-target");
        const proTarget = button.getAttribute("data-pro-target");

        const form = formId ? byId(formId) : null;
        if (form) {
          form.reset();
        }

        if (reportTarget) {
          const fallbackMap = {
            "teammate-report": "Run a teammate scan to generate a report card.",
            "losing-report": "Compare team stats to see likely loss causes.",
            "counter-report": "Add matchup details to produce your counter game plan.",
            "animation-report": "Generate your loadout recommendation.",
            "chemistry-report": "Add player profiles to evaluate team chemistry.",
          };
          clearReport(reportTarget, fallbackMap[reportTarget] || "Report reset.");
          const toolByReport = {
            "teammate-report": "teammate",
            "losing-report": "losing",
            "counter-report": "counter",
            "animation-report": "animation",
            "chemistry-report": "chemistry",
          };
          const toolId = toolByReport[reportTarget];
          if (toolId) {
            delete state.reports[toolId];
          }
        }

        if (proTarget) {
          const proNode = byId(proTarget);
          if (proNode) {
            proNode.innerHTML = state.initialProMarkup[proTarget] || "";
          }
        }
      });
    });
  };

  const initializeLoadoutTools = () => {
    const saveButton = byId("save-loadout-btn");
    const compareButton = byId("compare-loadouts-btn");
    const compareOutput = byId("loadout-compare-output");

    if (saveButton) {
      saveButton.addEventListener("click", () => {
        if (!isPro()) {
          openModal();
          return;
        }

        if (!state.latestAnimationLoadout) {
          showToast("Run Animation Optimizer first.");
          return;
        }

        const name = window.prompt("Name this loadout", "Primary Park Setup");
        if (!name) {
          return;
        }

        const loadouts = loadLoadouts();
        loadouts.unshift({
          id: String(Date.now()),
          name: name.trim().slice(0, 50),
          loadout: state.latestAnimationLoadout,
        });

        saveLoadouts(loadouts.slice(0, 12));
        refreshLoadoutSelects();
        showToast("Loadout saved.");
      });
    }

    if (compareButton && compareOutput) {
      compareButton.addEventListener("click", () => {
        if (!isPro()) {
          openModal();
          return;
        }

        const selectA = byId("loadout-a");
        const selectB = byId("loadout-b");
        if (!selectA || !selectB || !selectA.value || !selectB.value) {
          compareOutput.textContent = "Select two saved loadouts to compare.";
          return;
        }

        const loadouts = loadLoadouts();
        const first = loadouts.find((item) => item.id === selectA.value);
        const second = loadouts.find((item) => item.id === selectB.value);

        if (!first || !second) {
          compareOutput.textContent = "Saved loadouts not found.";
          return;
        }

        compareOutput.innerHTML = `
          <strong>${escapeHtml(first.name)}</strong> vs <strong>${escapeHtml(second.name)}</strong><br />
          Dribble: ${escapeHtml(first.loadout.dribblePackage)} vs ${escapeHtml(second.loadout.dribblePackage)}<br />
          Jumper: ${escapeHtml(first.loadout.jumpShot)} vs ${escapeHtml(second.loadout.jumpShot)}<br />
          Dunk: ${escapeHtml(first.loadout.dunkPackage)} vs ${escapeHtml(second.loadout.dunkPackage)}<br />
          Fit: ${escapeHtml(String(first.loadout.compatibility))}/100 vs ${escapeHtml(String(second.loadout.compatibility))}/100
        `;
      });
    }

    refreshLoadoutSelects();
  };

  const initializeModalAndActions = () => {
    const stripeLink = byId("stripe-pay-link");
    if (stripeLink) {
      stripeLink.href = STRIPE_LINK;
    }

    const manualUnlock = byId("manual-unlock-btn");
    if (manualUnlock) {
      manualUnlock.addEventListener("click", () => {
        const confirmed = window.confirm("Confirm you completed payment and want to unlock Pro on this browser.");
        if (!confirmed) {
          return;
        }
        setPro(true);
        applyProState();
        closeModal();
        showToast("Pro unlocked on this device.");
      });
    }

    document.addEventListener("click", async (event) => {
      const openButton = event.target.closest(".open-pro-modal");
      if (openButton) {
        openModal();
        return;
      }

      const closeButton = event.target.closest("[data-close-modal='true']");
      if (closeButton) {
        closeModal();
        return;
      }

      const actionButton = event.target.closest("[data-action]");
      if (!actionButton) {
        return;
      }

      const action = actionButton.getAttribute("data-action");
      const tool = actionButton.getAttribute("data-tool");

      if (action === "print-plan") {
        if (!isPro()) {
          openModal();
          return;
        }
        window.print();
        return;
      }

      if (!tool || !state.reports[tool]) {
        showToast("Run the tool first.");
        return;
      }

      const report = state.reports[tool];

      if (action === "copy-summary") {
        const copied = await copyText(report.summary);
        showToast(copied ? "Summary copied." : "Copy failed.");
        return;
      }

      if (!isPro()) {
        openModal();
        return;
      }

      if (action === "copy-link") {
        const copied = await copyText(buildShareLink(tool, report.summary));
        showToast(copied ? "Share link copied." : "Copy failed.");
      }

      if (action === "export-image") {
        exportReportCard(report);
        showToast("Image exported.");
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    });
  };

  const initializeScrollReveal = () => {
    const items = qa(".reveal");
    if (!items.length || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    items.forEach((item) => observer.observe(item));
  };

  const initializeThemeToggle = () => {
    const toggle = byId("theme-toggle");
    if (!toggle) {
      return;
    }
    toggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      applyTheme(current === "dark" ? "light" : "dark");
    });
  };

  const loadSharedSummaryIfPresent = () => {
    const params = new URLSearchParams(window.location.search);
    const summary = params.get("summary");
    if (!summary) {
      return;
    }

    const tool = params.get("tool") || "shared";
    const preview = byId("share-preview");
    if (!preview) {
      return;
    }

    preview.innerHTML = `
      <h3>Shared ${escapeHtml(tool)} report</h3>
      <p>${escapeHtml(summary)}</p>
      <p class="tiny-note">Loaded from URL summary parameters.</p>
    `;
  };

  const initializeMetaBits = () => {
    const year = byId("year");
    if (year) {
      year.textContent = String(new Date().getFullYear());
    }
  };

  const boot = () => {
    initializeTheme();
    initializeThemeToggle();
    initializeMetaBits();
    initializeProMarkupDefaults();
    initializeModalAndActions();
    initializeForms();
    initializeLoadoutTools();
    initializeScrollReveal();
    loadSharedSummaryIfPresent();
    applyProState();
  };

  boot();
})();
