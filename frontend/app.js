const THEMES = {
  'obsidian-gold': {
    bgTop: '#0B0C10',
    bgBottom: '#14161D',
    card: 'rgba(255, 255, 255, 0.045)',
    cardBorder: 'rgba(245, 158, 11, 0.28)',
    accent: '#F59E0B',
    text: '#F8FAFC',
    muted: '#94A3B8',
    done: '#475569'
  },
  'nordic-paper': {
    bgTop: '#F4F3EF',
    bgBottom: '#E7E5DF',
    card: 'rgba(15, 23, 42, 0.045)',
    cardBorder: 'rgba(15, 23, 42, 0.16)',
    accent: '#0F172A',
    text: '#0F172A',
    muted: '#475569',
    done: '#94A3B8'
  },
  'cyber-emerald': {
    bgTop: '#041311',
    bgBottom: '#08221E',
    card: 'rgba(16, 185, 129, 0.06)',
    cardBorder: 'rgba(16, 185, 129, 0.30)',
    accent: '#10B981',
    text: '#ECFDF5',
    muted: '#6EE7B7',
    done: '#065F46'
  },
  'sunset-terracotta': {
    bgTop: '#190E0C',
    bgBottom: '#291512',
    card: 'rgba(251, 113, 133, 0.06)',
    cardBorder: 'rgba(251, 146, 60, 0.30)',
    accent: '#FB923C',
    text: '#FFF7ED',
    muted: '#FDBA74',
    done: '#7C2D12'
  },
  'deep-cobalt': {
    bgTop: '#060D1F',
    bgBottom: '#0C1A3A',
    card: 'rgba(56, 189, 248, 0.06)',
    cardBorder: 'rgba(56, 189, 248, 0.30)',
    accent: '#38BDF8',
    text: '#F0F9FF',
    muted: '#7DD3FC',
    done: '#1E3A8A'
  }
};

function defaultTargetIso() {
  const d = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
}

const state = {
  slug: null,
  readOnly: false,
  title: 'SEBI Grade A IT — Phase 1',
  mantra: 'Small daily blocks compound into completion.',
  targetIso: defaultTargetIso(),
  deviceType: 'mobile',
  themeId: 'obsidian-gold',
  showOverlay: true,
  milestones: [
    { id: 'm1', label: 'Complete core DSA & SQL patterns', dueOffsetLabel: 'T-10 Days', done: true },
    { id: 'm2', label: 'Revise OS, Networks & DBMS notes', dueOffsetLabel: 'T-6 Days', done: false },
    { id: 'm3', label: 'Attempt 3 full-length timed mocks', dueOffsetLabel: 'T-3 Days', done: false },
    { id: 'm4', label: 'Error log review & exam day kit', dueOffsetLabel: 'Deadline', done: false }
  ]
};

const el = {
  apiStatusBadge: document.getElementById('apiStatusBadge'),
  newDesignBtn: document.getElementById('newDesignBtn'),
  copyShareBtn: document.getElementById('copyShareBtn'),
  saveShareBtn: document.getElementById('saveShareBtn'),
  sharedBanner: document.getElementById('sharedBanner'),
  sharedBannerText: document.getElementById('sharedBannerText'),
  titleInput: document.getElementById('titleInput'),
  targetDateInput: document.getElementById('targetDateInput'),
  deviceSelect: document.getElementById('deviceSelect'),
  contextInput: document.getElementById('contextInput'),
  generateAiBtn: document.getElementById('generateAiBtn'),
  addMilestoneBtn: document.getElementById('addMilestoneBtn'),
  milestonesList: document.getElementById('milestonesList'),
  mantraInput: document.getElementById('mantraInput'),
  themePills: document.getElementById('themePills'),
  overlayToggle: document.getElementById('overlayToggle'),
  downloadWallpaperBtn: document.getElementById('downloadWallpaperBtn'),
  downloadCoverBtn: document.getElementById('downloadCoverBtn'),
  statusMsg: document.getElementById('statusMsg'),
  resolutionLabel: document.getElementById('resolutionLabel'),
  liveTickLabel: document.getElementById('liveTickLabel'),
  canvas: document.getElementById('lockCanvas')
};

function setStatus(msg) {
  el.statusMsg.textContent = msg;
}

function getStoredEditToken(slug) {
  try {
    return localStorage.getItem(`chronolock_token_${slug}`) || '';
  } catch {
    return '';
  }
}

function storeEditToken(slug, token) {
  try {
    localStorage.setItem(`chronolock_token_${slug}`, token);
  } catch {
    // Ignore storage quota errors
  }
}

function computeRemaining(targetIso) {
  const diff = Math.max(0, new Date(targetIso).getTime() - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { diff, days, hours, minutes, seconds };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function renderLockScreen(targetCanvas, width, height, includeOverlay) {
  targetCanvas.width = width;
  targetCanvas.height = height;
  const ctx = targetCanvas.getContext('2d');
  const theme = THEMES[state.themeId] || THEMES['obsidian-gold'];
  const isMobile = height > width;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, width * 0.35, height);
  grad.addColorStop(0, theme.bgTop);
  grad.addColorStop(1, theme.bgBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Subtle ambient glow
  const radial = ctx.createRadialGradient(
    width * 0.5,
    isMobile ? height * 0.42 : height * 0.35,
    20,
    width * 0.5,
    isMobile ? height * 0.42 : height * 0.35,
    Math.max(width, height) * 0.55
  );
  radial.addColorStop(0, theme.cardBorder);
  radial.addColorStop(1, 'transparent');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);

  // Safe-zone layout math (leaves top 29% open for Mobile OS Clock/Widgets)
  const padX = isMobile ? 84 : 180;
  const contentW = width - padX * 2;
  let cursorY = isMobile ? Math.round(height * 0.31) : Math.round(height * 0.16);

  // Target Date Eyebrow
  const targetDateObj = new Date(state.targetIso);
  const formattedTarget = Number.isNaN(targetDateObj.getTime())
    ? 'TARGET DEADLINE'
    : targetDateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).toUpperCase();

  ctx.fillStyle = theme.accent;
  ctx.font = `700 ${isMobile ? 28 : 26}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'left';
  ctx.fillText(`DEADLINE // ${formattedTarget}`, padX, cursorY);

  // Deadline Title
  cursorY += isMobile ? 64 : 58;
  ctx.fillStyle = theme.text;
  ctx.font = `800 ${isMobile ? 58 : 56}px "Inter", sans-serif`;
  ctx.fillText(state.title.slice(0, 44), padX, cursorY);

  // Countdown Hero Block
  cursorY += isMobile ? 54 : 46;
  const cardH = isMobile ? 250 : 210;
  ctx.fillStyle = theme.card;
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 2;
  roundRect(ctx, padX, cursorY, contentW, cardH, 28);
  ctx.fill();
  ctx.stroke();

  const rem = computeRemaining(state.targetIso);
  const units = [
    { val: String(rem.days).padStart(2, '0'), lbl: 'DAYS' },
    { val: String(rem.hours).padStart(2, '0'), lbl: 'HOURS' },
    { val: String(rem.minutes).padStart(2, '0'), lbl: 'MINS' }
  ];

  const colW = contentW / 3;
  units.forEach((u, i) => {
    const cx = padX + colW * i + colW / 2;
    ctx.textAlign = 'center';
    ctx.fillStyle = i === 0 ? theme.accent : theme.text;
    ctx.font = `800 ${isMobile ? 104 : 92}px "JetBrains Mono", monospace`;
    ctx.fillText(u.val, cx, cursorY + (isMobile ? 142 : 122));

    ctx.fillStyle = theme.muted;
    ctx.font = `600 ${isMobile ? 24 : 20}px "JetBrains Mono", monospace`;
    ctx.fillText(u.lbl, cx, cursorY + (isMobile ? 196 : 168));
  });

  // Progress Bar
  cursorY += cardH + (isMobile ? 52 : 42);
  const totalM = Math.max(1, state.milestones.length);
  const doneM = state.milestones.filter((m) => m.done).length;
  const pct = doneM / totalM;

  ctx.textAlign = 'left';
  ctx.fillStyle = theme.muted;
  ctx.font = `600 ${isMobile ? 26 : 22}px "JetBrains Mono", monospace`;
  ctx.fillText(`MILESTONE ROADMAP (${doneM}/${totalM})`, padX, cursorY);

  ctx.textAlign = 'right';
  ctx.fillStyle = theme.accent;
  ctx.fillText(`${Math.round(pct * 100)}%`, padX + contentW, cursorY);

  cursorY += 20;
  ctx.fillStyle = theme.card;
  roundRect(ctx, padX, cursorY, contentW, 12, 6);
  ctx.fill();

  if (pct > 0) {
    ctx.fillStyle = theme.accent;
    roundRect(ctx, padX, cursorY, Math.max(18, contentW * pct), 12, 6);
    ctx.fill();
  }

  // Chronological Milestones List
  cursorY += isMobile ? 42 : 34;
  const rowH = isMobile ? 112 : 84;
  const rowGap = isMobile ? 20 : 14;

  state.milestones.slice(0, 5).forEach((m) => {
    ctx.fillStyle = theme.card;
    ctx.strokeStyle = m.done ? 'transparent' : theme.cardBorder;
    ctx.lineWidth = 1.5;
    roundRect(ctx, padX, cursorY, contentW, rowH, 20);
    ctx.fill();
    ctx.stroke();

    // Checkbox Indicator
    const boxSize = isMobile ? 34 : 28;
    const boxX = padX + 28;
    const boxY = cursorY + (rowH - boxSize) / 2;

    if (m.done) {
      ctx.fillStyle = theme.accent;
      roundRect(ctx, boxX, boxY, boxSize, boxSize, 8);
      ctx.fill();
      ctx.strokeStyle = theme.bgTop;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(boxX + 8, boxY + boxSize * 0.52);
      ctx.lineTo(boxX + boxSize * 0.44, boxY + boxSize - 8);
      ctx.lineTo(boxX + boxSize - 7, boxY + 9);
      ctx.stroke();
    } else {
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 3;
      roundRect(ctx, boxX, boxY, boxSize, boxSize, 8);
      ctx.stroke();
    }

    // Milestone Label
    ctx.textAlign = 'left';
    ctx.fillStyle = m.done ? theme.done : theme.text;
    ctx.font = `${m.done ? '500' : '600'} ${isMobile ? 32 : 26}px "Inter", sans-serif`;
    const textY = cursorY + rowH / 2 + (isMobile ? 11 : 9);
    ctx.fillText(m.label.slice(0, 38), boxX + boxSize + 24, textY);

    // Due Offset Pill
    ctx.textAlign = 'right';
    ctx.fillStyle = m.done ? theme.done : theme.accent;
    ctx.font = `600 ${isMobile ? 24 : 20}px "JetBrains Mono", monospace`;
    ctx.fillText(m.dueOffsetLabel.slice(0, 14), padX + contentW - 28, textY);

    cursorY += rowH + rowGap;
  });

  // Footer Micro-Mantra (Leaves bottom 11% free for OS Flashlight/Camera/Dock)
  const footerY = isMobile ? height - 290 : height - 95;
  ctx.textAlign = 'center';
  ctx.fillStyle = theme.muted;
  ctx.font = `500 ${isMobile ? 28 : 24}px "Inter", sans-serif`;
  ctx.fillText(`“${state.mantra}”`, width / 2, footerY);

  // Simulated OS Lock Screen Clock Overlay (Preview only, never exported)
  if (includeOverlay) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 2;

    if (isMobile) {
      roundRect(ctx, 72, 130, width - 144, 460, 36);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '600 32px "Inter", sans-serif';
      ctx.fillText('Saturday, November 22', width / 2, 240);
      ctx.font = '800 185px "Inter", sans-serif';
      ctx.fillText('09:41', width / 2, 435);
      ctx.font = '600 22px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fillText('OS LOCK SCREEN CLOCK SAFE-ZONE (HIDDEN ON EXPORT)', width / 2, 540);
    } else {
      roundRect(ctx, 120, height - 340, 620, 220, 28);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '800 110px "Inter", sans-serif';
      ctx.fillText('09:41', 160, height - 210);
      ctx.font = '600 24px "Inter", sans-serif';
      ctx.fillText('OS Desktop Clock Safe-Zone (Hidden on Export)', 160, height - 155);
    }
    ctx.restore();
  }
}

function redrawPreview() {
  const isMobile = state.deviceType === 'mobile';
  const w = isMobile ? 1080 : 2560;
  const h = isMobile ? 2400 : 1440;
  el.resolutionLabel.textContent = `${w} × ${h} px • OS Clock Safe-Zone Active`;
  const rem = computeRemaining(state.targetIso);
  el.liveTickLabel.textContent = `${rem.days}d ${rem.hours}h ${rem.minutes}m ${rem.seconds}s`;
  renderLockScreen(el.canvas, w, h, state.showOverlay);
}

function renderMilestonesEditor() {
  el.milestonesList.innerHTML = '';
  const canEditProgress = !state.readOnly || Boolean(state.slug && getStoredEditToken(state.slug));

  state.milestones.forEach((m, index) => {
    const row = document.createElement('div');
    row.className = 'milestone-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(m.done);
    checkbox.disabled = !canEditProgress;
    checkbox.addEventListener('change', async () => {
      state.milestones[index].done = checkbox.checked;
      redrawPreview();
      if (state.slug) {
        await syncMilestonesToServer();
      }
    });

    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.maxLength = 44;
    labelInput.value = m.label;
    labelInput.disabled = state.readOnly;
    labelInput.addEventListener('input', () => {
      state.milestones[index].label = labelInput.value;
      redrawPreview();
    });

    const dueInput = document.createElement('input');
    dueInput.type = 'text';
    dueInput.className = 'milestone-due';
    dueInput.maxLength = 16;
    dueInput.value = m.dueOffsetLabel;
    dueInput.disabled = state.readOnly;
    dueInput.addEventListener('input', () => {
      state.milestones[index].dueOffsetLabel = dueInput.value;
      redrawPreview();
    });

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'remove-btn';
    delBtn.textContent = '×';
    delBtn.title = 'Remove milestone';
    delBtn.hidden = state.readOnly || state.milestones.length <= 1;
    delBtn.addEventListener('click', () => {
      state.milestones.splice(index, 1);
      renderMilestonesEditor();
      redrawPreview();
    });

    row.append(checkbox, labelInput, dueInput, delBtn);
    el.milestonesList.appendChild(row);
  });
}

async function syncMilestonesToServer() {
  const token = getStoredEditToken(state.slug);
  if (!token) return;
  try {
    const res = await fetch(`/api/designs/${encodeURIComponent(state.slug)}/milestones`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Edit-Token': token
      },
      body: JSON.stringify({ milestones: state.milestones })
    });
    if (res.ok) {
      setStatus('Milestone progress saved securely.');
    }
  } catch {
    setStatus('Offline: progress updated locally.');
  }
}

async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    el.apiStatusBadge.textContent = data.geminiConfigured ? 'Gemini API Ready' : 'Local Mode (Add Key in .env)';
  } catch {
    el.apiStatusBadge.textContent = 'Server Offline';
  }
}

async function loadSharedDesignIfPresent() {
  const match = window.location.pathname.match(/^\/d\/([A-Za-z0-9_-]{12,32})$/);
  if (!match) return;

  const slug = match[1];
  try {
    const res = await fetch(`/api/designs/${encodeURIComponent(slug)}`);
    if (!res.ok) {
      setStatus('Shared lock screen not found.');
      return;
    }
    const data = await res.json();
    state.slug = data.slug;
    state.readOnly = true;
    state.title = data.title;
    state.mantra = data.mantra;
    state.targetIso = data.targetIso.slice(0, 16);
    state.deviceType = data.deviceType;
    state.themeId = data.themeId;
    state.milestones = data.milestones;
    state.showOverlay = false;

    const isOwner = Boolean(getStoredEditToken(slug));
    el.sharedBanner.hidden = false;
    el.sharedBannerText.textContent = isOwner
      ? 'Owner Mode: Check off milestones directly—changes persist to your share URL.'
      : 'Published Read-Only Lock Screen: Download PNG or click "+ Create New" to build your own.';

    el.newDesignBtn.hidden = false;
    el.copyShareBtn.hidden = false;
    el.saveShareBtn.hidden = true;
    el.generateAiBtn.disabled = true;
    el.addMilestoneBtn.hidden = true;
    el.titleInput.disabled = true;
    el.targetDateInput.disabled = true;
    el.deviceSelect.disabled = true;
    el.contextInput.disabled = true;
    el.mantraInput.disabled = true;
  } catch {
    setStatus('Failed to load shared design.');
  }
}

function bindEvents() {
  el.titleInput.addEventListener('input', () => {
    state.title = el.titleInput.value || 'Untitled Deadline';
    redrawPreview();
  });

  el.targetDateInput.addEventListener('change', () => {
    if (el.targetDateInput.value) {
      state.targetIso = el.targetDateInput.value;
      redrawPreview();
    }
  });

  el.deviceSelect.addEventListener('change', () => {
    state.deviceType = el.deviceSelect.value;
    redrawPreview();
  });

  el.mantraInput.addEventListener('input', () => {
    state.mantra = el.mantraInput.value;
    redrawPreview();
  });

  el.overlayToggle.addEventListener('change', () => {
    state.showOverlay = el.overlayToggle.checked;
    redrawPreview();
  });

  el.themePills.querySelectorAll('.theme-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (state.readOnly) return;
      state.themeId = btn.dataset.theme;
      syncThemePills();
      redrawPreview();
    });
  });

  el.addMilestoneBtn.addEventListener('click', () => {
    if (state.milestones.length >= 5) {
      setStatus('Maximum 5 milestones recommended for lock screen legibility.');
      return;
    }
    state.milestones.push({
      id: `m${Date.now()}`,
      label: 'Next key milestone step',
      dueOffsetLabel: `Step ${state.milestones.length + 1}`,
      done: false
    });
    renderMilestonesEditor();
    redrawPreview();
  });

  el.generateAiBtn.addEventListener('click', async () => {
    el.generateAiBtn.disabled = true;
    setStatus('Gemini is architecting backward milestones...');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: state.title,
          targetIso: new Date(state.targetIso).toISOString(),
          context: el.contextInput.value
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      state.mantra = data.mantra;
      state.themeId = data.themeId;
      state.milestones = data.milestones;

      el.mantraInput.value = state.mantra;
      syncThemePills();
      renderMilestonesEditor();
      redrawPreview();
      setStatus(`Generated via ${data.source}.`);
    } catch (err) {
      setStatus(err.message);
    } finally {
      el.generateAiBtn.disabled = false;
    }
  });

  el.saveShareBtn.addEventListener('click', async () => {
    el.saveShareBtn.disabled = true;
    setStatus('Publishing hardened share link...');
    try {
      const res = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: state.title,
          mantra: state.mantra,
          targetIso: new Date(state.targetIso).toISOString(),
          deviceType: state.deviceType,
          themeId: state.themeId,
          milestones: state.milestones
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish');

      storeEditToken(data.slug, data.editToken);
      const fullUrl = `${window.location.origin}${data.sharePath}`;
      window.history.pushState({}, '', data.sharePath);
      state.slug = data.slug;
      el.copyShareBtn.hidden = false;
      await navigator.clipboard?.writeText(fullUrl);
      setStatus(`Published & copied URL: ${fullUrl}`);
    } catch (err) {
      setStatus(err.message);
    } finally {
      el.saveShareBtn.disabled = false;
    }
  });

  el.copyShareBtn.addEventListener('click', async () => {
    const url = window.location.href;
    await navigator.clipboard?.writeText(url);
    setStatus(`Copied share URL: ${url}`);
  });

  el.newDesignBtn.addEventListener('click', () => {
    window.location.href = '/';
  });

  // Export Clean Native Lock Screen PNG
  el.downloadWallpaperBtn.addEventListener('click', () => {
    const isMobile = state.deviceType === 'mobile';
    const exportCanvas = document.createElement('canvas');
    renderLockScreen(exportCanvas, isMobile ? 1080 : 2560, isMobile ? 2400 : 1440, false);

    const link = document.createElement('a');
    link.download = `chronolock-${state.deviceType}-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
    setStatus('Exported clean HiDPI lock screen PNG.');
  });

  // Export 1600x900 Showcase Cover Image for Handshake Submission
  el.downloadCoverBtn.addEventListener('click', () => {
    const cover = document.createElement('canvas');
    cover.width = 1600;
    cover.height = 900;
    const ctx = cover.getContext('2d');

    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, 1600, 900);

    // Render crisp phone lock screen mockup on the right
    const phoneCanvas = document.createElement('canvas');
    renderLockScreen(phoneCanvas, 1080, 2400, true);

    const mockW = 342;
    const mockH = 760;
    const mockX = 1110;
    const mockY = 70;

    ctx.save();
    roundRect(ctx, mockX - 8, mockY - 8, mockW + 16, mockH + 16, 40);
    ctx.fillStyle = '#27272A';
    ctx.fill();
    roundRect(ctx, mockX, mockY, mockW, mockH, 34);
    ctx.clip();
    ctx.drawImage(phoneCanvas, mockX, mockY, mockW, mockH);
    ctx.restore();

    // Left Typography Pitch
    ctx.fillStyle = '#F59E0B';
    ctx.font = '700 22px "JetBrains Mono", monospace';
    ctx.fillText('CHRONOLOCK // GEMINI AI LOCK SCREEN ARCHITECT', 100, 230);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '800 66px "Inter", sans-serif';
    ctx.fillText('Your Deadline,', 100, 325);
    ctx.fillText('Your Design.', 100, 405);

    ctx.fillStyle = '#A1A1AA';
    ctx.font = '500 28px "Inter", sans-serif';
    ctx.fillText('Backward-mapped Gemini milestones engineered', 100, 490);
    ctx.fillText('around native OS lock screen clock safe-zones.', 100, 534);

    ctx.fillStyle = '#18181D';
    roundRect(ctx, 100, 610, 860, 110, 18);
    ctx.fill();
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '700 24px "JetBrains Mono", monospace';
    ctx.fillText(`ACTIVE GOAL: ${state.title.slice(0, 34)}`, 132, 658);
    ctx.fillStyle = '#F59E0B';
    ctx.fillText(`THEME: ${state.themeId.toUpperCase()} • 1080×2400 & 2560×1440`, 132, 696);

    const link = document.createElement('a');
    link.download = `chronolock-handshake-cover-${Date.now()}.png`;
    link.href = cover.toDataURL('image/png');
    link.click();
    setStatus('Exported 1600×900 Handshake cover image.');
  });
}

function syncThemePills() {
  el.themePills.querySelectorAll('.theme-pill').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.theme === state.themeId);
  });
}

async function init() {
  await loadSharedDesignIfPresent();
  el.titleInput.value = state.title;
  el.targetDateInput.value = state.targetIso;
  el.deviceSelect.value = state.deviceType;
  el.mantraInput.value = state.mantra;
  el.overlayToggle.checked = state.showOverlay;

  syncThemePills();
  renderMilestonesEditor();
  bindEvents();
  redrawPreview();
  await checkHealth();

  setInterval(redrawPreview, 1000);
}

init();
