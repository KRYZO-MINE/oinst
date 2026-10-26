/* =====================================================================
   OINST — Application logic
   Vanilla JS, no framework. Talks to /api/proxy (server-side key),
   then renders the raw payload as a clean, human-readable report.
   ===================================================================== */

(function () {
  'use strict';

  const TOOLS = window.OINST_TOOLS || [];
  const PROXY = '/api/proxy';

  /* ------------------------------------------------------------------
     1. Icons (inline SVG sprite)
     ------------------------------------------------------------------ */
  const ICONS = {
    registration: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M9.5 12h5M9.5 15.5h5"/>',
    car: '<path d="M4 16v-3l1.6-4.2A2 2 0 0 1 7.5 7.5h9a2 2 0 0 1 1.9 1.3L20 13v3"/><path d="M4 13h16"/><circle cx="7.5" cy="17" r="1.6"/><circle cx="16.5" cy="17" r="1.6"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3"/>',
    device: '<rect x="4" y="4" width="16" height="12" rx="2"/><path d="M9 20h6M12 16v4"/>',
    wallet: '<path d="M3 8V6.5A2.5 2.5 0 0 1 5.5 4H17"/><rect x="3" y="8" width="18" height="12" rx="2.5"/><circle cx="16" cy="14" r="1.3"/>',
    idcard: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><circle cx="8.5" cy="11" r="2.2"/><path d="M5 16c.7-1.5 2-2.2 3.5-2.2S11.3 14.5 12 16"/><path d="M15 10h4M15 13.5h3"/>',
    send: '<path d="m21.5 3.5-9 17-2.2-6.8L3.5 11.5z"/><path d="m21.5 3.5-11.2 10.2"/>',
    users: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.6-3 2.9-4.6 5.5-4.6S14 16 14.6 19"/><path d="M16 6.2a3 3 0 0 1 0 5.6M17.5 19c-.2-1.7-.8-3.2-1.8-4.3 2.4-.4 4.5 1 5.3 4.3"/>',
    fingerprint: '<path d="M12 3a9 9 0 0 1 9 9"/><path d="M4 15a9 9 0 0 1 8-11.6"/><path d="M7.5 20.5A11 11 0 0 1 6 15c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M12 12.5A2.5 2.5 0 0 1 14.5 15c0 2-.5 4-1.3 5.5"/>',
    sparkles: '<path d="M12 3.5l1.7 4.3 4.3 1.7-4.3 1.7L12 15.5l-1.7-4.3L6 9.5l4.3-1.7z"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    check: '<path d="m4.5 12.5 5 5 10-11"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    download: '<path d="M12 3.5v11"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M4.5 19.5h15"/>',
    code: '<path d="m8.5 8-4 4 4 4"/><path d="m15.5 8 4 4-4 4"/>',
    reset: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4.5V11h-6.2"/>',
    bolt: '<path d="M13.5 3 5.5 13.5h5l-1 7.5 8-11h-5z"/>',
    shield: '<path d="M12 3l8 3v6c0 4.6-3.2 8.2-8 9.8C7.2 20.2 4 16.6 4 12V6z"/><path d="m9 12 2 2 4-4.5"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.4 2.4 3.6 5.3 3.6 8.5S14.4 18.1 12 20.5c-2.4-2.4-3.6-5.3-3.6-8.5S9.6 5.9 12 3.5Z"/>',
  };

  const svg = (name, cls) =>
    `<svg class="${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;

  /* ------------------------------------------------------------------
     2. Input validation rules per lookup kind
     ------------------------------------------------------------------ */
  const RULES = {
    vehicle: {
      hint: 'Format: MH12AB1234',
      test: (v) => /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/.test(v),
      clean: (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, ''),
      mode: 'alnum',
    },
    phone: {
      hint: '10-digit Indian mobile number',
      test: (v) => /^[6-9][0-9]{9}$/.test(v),
      clean: (v) => v.replace(/\D/g, '').replace(/^(?:91|0)(?=[6-9][0-9]{9}$)/, ''),
      mode: 'numeric',
    },
    upi: {
      hint: 'Format: name@bank',
      test: (v) => /^[A-Za-z0-9._-]{2,256}@[A-Za-z]{2,64}$/.test(v),
      clean: (v) => v.trim().toLowerCase(),
      mode: 'text',
    },
    pan: {
      hint: 'Format: ABCDE1234F',
      test: (v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v),
      clean: (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, ''),
      mode: 'alnum',
    },
    telegram: {
      hint: 'Numeric Telegram user ID',
      test: (v) => /^[0-9]{5,15}$/.test(v),
      clean: (v) => v.replace(/\D/g, ''),
      mode: 'numeric',
    },
    aadhaar: {
      hint: '12-digit reference number',
      test: (v) => /^[0-9]{12}$/.test(v),
      clean: (v) => v.replace(/\D/g, ''),
      mode: 'numeric',
    },
  };

  /* ------------------------------------------------------------------
     3. Small utilities
     ------------------------------------------------------------------ */
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** snake_case / camelCase / kebab-case -> Title Case */
  function humanize(key) {
    return String(key)
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const isUrl = (s) => typeof s === 'string' && /^https?:\/\/\S+$/i.test(s.trim());
  const isImage = (s) => isUrl(s) && /\.(png|jpe?g|gif|webp|bmp|svg|avif)(\?.*)?$/i.test(s.trim());
  const isEmail = (s) => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
  const isPhone = (s) => typeof s === 'string' && /^(?:\+?91[- ]?)?[6-9]\d{9}$/.test(s.trim());
  const isDateish = (s) =>
    typeof s === 'string' &&
    /^\d{4}-\d{2}-\d{2}([T ].*)?$/.test(s.trim()) &&
    !Number.isNaN(Date.parse(s));

  const isPrimitive = (v) => v === null || typeof v !== 'object';
  const isEmpty = (v) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);

  function toast(message, type) {
    const host = document.getElementById('toastHost');
    if (!host) return;
    const t = el('div', 'toast ' + (type || ''), message);
    host.appendChild(t);
    setTimeout(() => {
      t.style.transition = 'opacity .25s, transform .25s';
      t.style.opacity = '0';
      t.style.transform = 'translateY(8px)';
      setTimeout(() => t.remove(), 260);
    }, 3200);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard', 'ok');
    } catch (_) {
      toast('Copy failed — select the text manually', 'err');
    }
  }

  /* ------------------------------------------------------------------
     4. Human-friendly value rendering (safe DOM, no innerHTML for data)
     ------------------------------------------------------------------ */
  function valueNode(value, key) {
    // ---- Empty ----
    if (isEmpty(value)) return el('span', 'v-null', '— not available');

    // ---- Booleans -> pill ----
    if (typeof value === 'boolean') {
      const tag = el('span', 'tag ' + (value ? 'yes' : 'no'), value ? 'Yes' : 'No');
      return tag;
    }

    // ---- Numbers (kept verbatim — these are IDs, scores and codes,
    //      so digit grouping would corrupt them) ----
    if (typeof value === 'number') return el('span', 'v-mono', String(value));

    // ---- Strings ----
    if (typeof value === 'string') {
      const s = value.trim();
      if (isImage(s)) {
        const img = el('img', 'thumb');
        img.src = s;
        img.loading = 'lazy';
        img.alt = key || 'image';
        img.onerror = () => { img.replaceWith(el('span', 'v-mono', s)); };
        return img;
      }
      if (isUrl(s)) {
        const a = el('a', 'v-link', s);
        a.href = s;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        return a;
      }
      if (isEmail(s)) {
        const a = el('a', 'v-link', s);
        a.href = 'mailto:' + s;
        return a;
      }
      if (isPhone(s)) {
        const a = el('a', 'v-link v-mono', s);
        a.href = 'tel:' + s.replace(/\s/g, '');
        return a;
      }
      if (isDateish(s)) {
        const d = new Date(s);
        const pretty = d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        const wrap = el('span');
        wrap.appendChild(el('span', '', pretty));
        wrap.appendChild(document.createTextNode(' '));
        wrap.appendChild(el('span', 'v-mono v-null', '(' + s + ')'));
        return wrap;
      }
      // Long free text gets a readable paragraph
      if (s.length > 140) {
        const p = el('div', '', s);
        p.style.whiteSpace = 'pre-wrap';
        p.style.lineHeight = '1.6';
        return p;
      }
      return el('span', '', s);
    }

    // ---- Arrays ----
    if (Array.isArray(value)) {
      if (value.every(isPrimitive)) {
        const box = el('div');
        value.forEach((v) => box.appendChild(el('span', 'chip', isEmpty(v) ? '—' : String(v))));
        return box;
      }
      const box = el('div');
      box.style.display = 'grid';
      box.style.gap = '10px';
      value.forEach((item, i) => {
        const card = el('div', 'record');
        const head = el('div', 'record-head');
        head.appendChild(el('span', 'record-index', '#' + (i + 1)));
        head.appendChild(el('span', '', humanize(key || 'Record')));
        card.appendChild(head);
        card.appendChild(
          isPrimitive(item) ? valueNode(item, key) : objectTable(item)
        );
        box.appendChild(card);
      });
      return box;
    }

    // ---- Objects ----
    const nest = el('div', 'nest');
    nest.appendChild(objectTable(value));
    return nest;
  }

  /** Build a two-column label/value table for an object. */
  function objectTable(obj) {
    const table = el('div', 'kv');
    const entries = Object.entries(obj);

    if (!entries.length) {
      table.appendChild(el('div', 'k', 'Info'));
      table.appendChild(el('div', 'v', '— empty object'));
      return table;
    }

    entries.forEach(([k, v]) => {
      table.appendChild(el('div', 'k', humanize(k)));
      const vCell = el('div', 'v');
      vCell.appendChild(valueNode(v, k));
      table.appendChild(vCell);
    });
    return table;
  }

  /** Count every leaf node so we can show a "fields found" figure. */
  function countLeaves(value) {
    if (isEmpty(value)) return 0;
    if (Array.isArray(value)) return value.reduce((n, v) => n + countLeaves(v), 0);
    if (typeof value === 'object') {
      return Object.values(value).reduce((n, v) => n + (isPrimitive(v) ? (isEmpty(v) ? 0 : 1) : countLeaves(v)), 0);
    }
    return 1;
  }

  function countRecords(value) {
    if (Array.isArray(value)) return value.filter((v) => v && typeof v === 'object').length;
    if (value && typeof value === 'object') {
      let n = 0;
      Object.values(value).forEach((v) => { n += countRecords(v); });
      return n;
    }
    return 0;
  }

  /* ------------------------------------------------------------------
     5. Raw JSON viewer with lightweight syntax highlighting
     ------------------------------------------------------------------ */
  function highlight(jsonText) {
    const src = String(jsonText);
    const re =
      /("(?:\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

    let out = '';
    let last = 0;
    let m;
    // Walk the string token by token: matched tokens get a colour class,
    // everything in between is escaped verbatim (so even a non-JSON/HTML
    // upstream body can never inject markup).
    while ((m = re.exec(src)) !== null) {
      out += escapeHtml(src.slice(last, m.index));
      const token = m[0];
      let cls = 'tk-num';
      if (token.charAt(0) === '"') cls = /:\s*$/.test(token) ? 'tk-key' : 'tk-str';
      else if (token === 'true' || token === 'false') cls = 'tk-bool';
      else if (token === 'null') cls = 'tk-null';
      out += '<span class="' + cls + '">' + escapeHtml(token) + '</span>';
      last = m.index + token.length;
    }
    return out + escapeHtml(src.slice(last));
  }

  /* ------------------------------------------------------------------
     6. Section markup
     ------------------------------------------------------------------ */
  function buildSection(tool) {
    const rule = RULES[tool.kind];
    const section = el('section', 'tool');
    section.id = tool.id;
    section.dataset.cmd = tool.cmd;
    section.dataset.kind = tool.kind;

    // ---- Header ----
    const head = el('div', 'tool-head');
    const icon = el('div', 'tool-icon');
    icon.innerHTML = svg(tool.icon);
    head.appendChild(icon);

    const info = el('div', 'tool-info');
    info.style.flex = '1';

    const h2 = el('h2', '', tool.label);
    info.appendChild(h2);

    const badges = el('div', 'badges');
    badges.appendChild(el('span', 'cmd-badge', 'cmd=' + tool.cmd));
    badges.appendChild(el('span', 'eyebrow', tool.tagline));
    info.appendChild(badges);
    
    head.appendChild(info);

    const backBtn = el('button', 'btn btn-ghost btn-xs');
    backBtn.style.padding = '8px 12px';
    backBtn.innerHTML = svg('globe') + '<span>Back</span>';
    backBtn.addEventListener('click', () => showSection('home'));
    head.appendChild(backBtn);

    section.appendChild(head);

    // ---- Form ----
    const body = el('div');
    body.style.padding = '32px';

    const desc = el('p', '', tool.description);
    desc.style.margin = '0 0 24px';
    desc.style.fontSize = '15px';
    desc.style.lineHeight = '1.6';
    desc.style.color = 'var(--text-mid)';
    body.appendChild(desc);

    const form = el('form');
    form.style.display = 'flex';
    form.style.flexDirection = 'column';
    form.style.gap = '20px';

    const inputGroup = el('div');
    inputGroup.style.position = 'relative';

    const input = el('input', 'field');
    input.type = 'text';
    input.name = 'query';
    input.placeholder = tool.placeholder;
    input.autocomplete = 'off';
    input.style.fontSize = '16px';
    input.style.padding = '16px 20px';
    input.style.borderRadius = '16px';
    inputGroup.appendChild(input);

    const help = el('div', '', 'e.g. ' + tool.example + '  ·  ' + rule.hint);
    help.style.fontSize = '12px';
    help.style.color = 'var(--text-low)';
    help.style.marginTop = '10px';
    inputGroup.appendChild(help);
    form.appendChild(inputGroup);

    const actions = el('div');
    actions.style.display = 'flex';
    actions.style.gap = '12px';

    const submit = el('button', 'btn-fetch');
    submit.type = 'submit';
    submit.style.flex = '1';
    submit.setAttribute('aria-label', 'Fetch ' + tool.label);
    submit.innerHTML = svg('bolt') + '<span>Fetch Data</span>';

    const reset = el('button', 'btn btn-ghost');
    reset.type = 'button';
    reset.style.padding = '0 20px';
    reset.style.borderRadius = '12px';
    reset.innerHTML = svg('reset');

    actions.appendChild(submit);
    actions.appendChild(reset);
    form.appendChild(actions);
    body.appendChild(form);

    // ---- Output ----
    const output = el('div');
    output.style.marginTop = '16px';
    const empty = el('div', 'result-empty', 'Enter a query above and press Fetch — the raw API response will be formatted here.');
    output.appendChild(empty);
    body.appendChild(output);

    section.appendChild(body);
    section._parts = { form, input, submit, reset, output, empty };

    // ---- Events ----
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      runTool(tool, section);
    });

    // Auto-clean characters as the user types (uppercase VIN, digits only…)
    input.addEventListener('input', () => {
      input.classList.remove('is-invalid');
      if (rule.mode === 'numeric' || rule.mode === 'alnum') {
        const cleaned = rule.mode === 'numeric' ? input.value.replace(/\D/g, '') : rule.clean(input.value);
        if (cleaned !== input.value) input.value = cleaned;
      }
    });

    reset.addEventListener('click', () => {
      input.value = '';
      input.classList.remove('is-invalid');
      output.textContent = '';
      output.appendChild(el('div', 'result-empty', 'Enter a query above and press Fetch — the raw API response will be formatted here.'));
      input.focus();
    });

    return section;
  }

  /* ------------------------------------------------------------------
     7. Fetch + render pipeline
     ------------------------------------------------------------------ */

  // The circular loader stays on screen for at least this long, so the
  // animation reads as an intentional step instead of a flash (5–10s).
  const MIN_LOADER_MS = 5000;

  function loaderNode(tool) {
    const hold = el('div', 'loader-hold');
    const loader = el('div', 'loader');
    loader.appendChild(el('div', 'circle'));
    hold.appendChild(loader);
    hold.appendChild(el('p', '', 'Running ' + tool.label + ' lookup…'));
    return hold;
  }

  async function runTool(tool, section) {
    const { input, submit, output } = section._parts;
    const rule = RULES[tool.kind];
    const cleaned = rule.clean(input.value);
    input.value = cleaned;

    if (!cleaned) {
      input.classList.add('is-invalid');
      toast('Please enter a ' + tool.label + ' value', 'err');
      input.focus();
      return;
    }
    if (!rule.test(cleaned)) {
      input.classList.add('is-invalid');
      toast('Invalid format — ' + rule.hint, 'err');
      input.focus();
      return;
    }

    // ---- Loading state: circular loader + disabled button ----
    submit.disabled = true;
    const originalLabel = submit.innerHTML;
    submit.innerHTML = '<span class="spinner spinner-light"></span><span>Fetching…</span>';
    output.textContent = '';
    output.appendChild(loaderNode(tool));

    const started = performance.now();
    let outcome;

    try {
      const res = await fetch(`${PROXY}?cmd=${encodeURIComponent(tool.cmd)}&query=${encodeURIComponent(cleaned)}`, {
        headers: { Accept: 'application/json' },
      });

      let payload;
      try {
        payload = await res.json();
      } catch (_) {
        throw new Error(
          'PROXY_UNAVAILABLE: Could not reach the API proxy. Deploy to Vercel, or run `vercel dev` locally — opening index.html directly will not work.'
        );
      }

      if (!res.ok) throw new Error(payload.error || `Request failed (HTTP ${res.status})`);
      outcome = { type: 'data', payload };
    } catch (err) {
      outcome = { type: 'error', err };
    }

    // Hold the loader long enough for the animation to be seen.
    const elapsed = performance.now() - started;
    if (elapsed < MIN_LOADER_MS) await new Promise((r) => setTimeout(r, MIN_LOADER_MS - elapsed));

    const ms = Math.round(performance.now() - started);
    output.textContent = '';

    if (outcome.type === 'error') {
      const box = el('div', 'result-empty');
      box.style.borderColor = 'rgba(248,113,113,.45)';
      box.style.color = '#fca5a5';
      box.style.textAlign = 'left';
      box.style.lineHeight = '1.6';
      box.textContent = '⚠ ' + (outcome.err && outcome.err.message ? outcome.err.message : 'Something went wrong.');
      output.appendChild(box);
      toast('Lookup failed', 'err');
    } else if (outcome.payload.ok === false) {
      // Provider answered, but with a gate/outage notice instead of data.
      renderNotice(tool, section, outcome.payload);
      toast(outcome.payload.error || 'Provider unavailable', 'err');
    } else {
      renderResult(tool, section, outcome.payload, ms);
      section.classList.add('is-focus');
      setTimeout(() => section.classList.remove('is-focus'), 1400);
    }

    submit.disabled = false;
    submit.innerHTML = originalLabel;
  }

  /**
   * Provider-side notice (outage, patched API, blocked key…).
   * Rendered instead of a report so the user gets a clear explanation
   * rather than a wall of unrelated HTML.
   */
  function renderNotice(tool, section, payload) {
    const { output } = section._parts;
    output.textContent = '';

    const box = el('div', 'record fade-in');
    const head = el('div', 'record-head');
    head.appendChild(el('span', 'record-index', payload.code || 'NOTICE'));
    head.appendChild(el('span', '', 'Provider unavailable'));
    box.appendChild(head);

    const body = el('div');
    body.style.padding = '16px';
    body.style.display = 'grid';
    body.style.gap = '10px';

    const title = el('p', '', payload.error || 'The upstream provider could not be reached.');
    title.style.margin = '0';
    title.style.fontSize = '14px';
    title.style.fontWeight = '700';
    title.style.color = '#fca5a5';
    body.appendChild(title);

    if (payload.hint) {
      const hint = el('p', '', payload.hint);
      hint.style.margin = '0';
      hint.style.fontSize = '12.8px';
      hint.style.lineHeight = '1.7';
      hint.style.color = 'var(--text-mid)';
      body.appendChild(hint);
    }

    const meta = el('div');
    meta.style.display = 'flex';
    meta.style.flexWrap = 'wrap';
    meta.style.gap = '8px';
    meta.appendChild(el('span', 'chip', 'cmd: ' + payload.cmd));
    meta.appendChild(el('span', 'chip', 'query: ' + payload.query));
    if (payload.status) meta.appendChild(el('span', 'chip', 'http: ' + payload.status));
    if (payload.redirect) meta.appendChild(el('span', 'chip', 'redirect: ' + payload.redirect.replace(/^https?:\/\//, '')));
    body.appendChild(meta);

    const retry = el('button', 'btn btn-primary btn-xs');
    retry.type = 'button';
    retry.style.justifySelf = 'start';
    retry.innerHTML = svg('reset') + '<span>Try again</span>';
    retry.addEventListener('click', () => runTool(tool, section));
    body.appendChild(retry);

    box.appendChild(body);
    output.appendChild(box);
  }

  function renderResult(tool, section, payload, elapsedMs) {
    const { output } = section._parts;
    output.textContent = '';

    const data = payload.data;
    const rawText = typeof payload.raw === 'string' && payload.raw.length ? payload.raw : JSON.stringify(data, null, 2);

    // ---- Summary strip ----
    const bar = el('div', 'fade-in');
    bar.style.display = 'flex';
    bar.style.flexWrap = 'wrap';
    bar.style.gap = '10px';
    bar.style.alignItems = 'center';
    bar.style.marginBottom = '14px';

    const okTag = el('span', 'tag yes', '✓ response received');
    bar.appendChild(okTag);
    bar.appendChild(el('span', 'chip', 'cmd: ' + payload.cmd));
    bar.appendChild(el('span', 'chip', 'query: ' + payload.query));
    bar.appendChild(el('span', 'chip', 'fields: ' + countLeaves(data)));
    bar.appendChild(el('span', 'chip', 'records: ' + countRecords(data)));
    bar.appendChild(el('span', 'chip', 'http: ' + payload.status));
    bar.appendChild(el('span', 'chip', (elapsedMs ?? payload.elapsedMs ?? 0) + ' ms'));
    output.appendChild(bar);

    // ---- Formatted view ----
    const formatted = el('div', 'fade-in');
    if (data !== null && typeof data === 'object') {
      const card = el('div', 'record');
      const head = el('div', 'record-head');
      head.appendChild(el('span', 'record-index', 'OINST'));
      head.appendChild(el('span', '', tool.label + ' · formatted report'));
      card.appendChild(head);
      card.appendChild(Array.isArray(data) ? valueNode(data, tool.label) : objectTable(data));
      formatted.appendChild(card);
    } else if (typeof data === 'string' && data.trim()) {
      const p = el('div', 'record');
      const head = el('div', 'record-head');
      head.appendChild(el('span', 'record-index', 'TEXT'));
      head.appendChild(el('span', '', 'Plain response'));
      p.appendChild(head);
      const pv = el('div');
      pv.style.padding = '14px';
      pv.style.whiteSpace = 'pre-wrap';
      pv.style.lineHeight = '1.65';
      pv.style.fontSize = '13px';
      pv.textContent = data;
      p.appendChild(pv);
      formatted.appendChild(p);
    } else {
      const note = el('div', 'result-empty', 'The provider returned no parsable JSON. See the raw output below.');
      formatted.appendChild(note);
    }
    output.appendChild(formatted);

    // ---- Raw toggle ----
    const actions = el('div');
    actions.style.display = 'flex';
    actions.style.gap = '8px';
    actions.style.flexWrap = 'wrap';
    actions.style.marginTop = '14px';

    const rawToggle = el('button', 'btn btn-ghost btn-xs');
    rawToggle.type = 'button';
    rawToggle.innerHTML = svg('code') + '<span>Show raw response</span>';

    const copyBtn = el('button', 'btn btn-ghost btn-xs');
    copyBtn.type = 'button';
    copyBtn.innerHTML = svg('copy') + '<span>Copy JSON</span>';
    copyBtn.addEventListener('click', () => copyText(rawText));

    const dlBtn = el('button', 'btn btn-ghost btn-xs');
    dlBtn.type = 'button';
    dlBtn.innerHTML = svg('download') + '<span>Download</span>';
    dlBtn.addEventListener('click', () => {
      const blob = new Blob([rawText], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `oinst-${payload.cmd}-${payload.query}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });

    actions.appendChild(rawToggle);
    actions.appendChild(copyBtn);
    actions.appendChild(dlBtn);
    output.appendChild(actions);

    const rawBox = el('div', 'raw-box');
    rawBox.style.display = 'none';
    rawBox.style.marginTop = '12px';
    rawBox.innerHTML = highlight(rawText);
    output.appendChild(rawBox);

    rawToggle.addEventListener('click', () => {
      const visible = rawBox.style.display !== 'none';
      rawBox.style.display = visible ? 'none' : 'block';
      rawToggle.querySelector('span').textContent = visible ? 'Show raw response' : 'Hide raw response';
    });
  }

  /* ------------------------------------------------------------------
     8. Navigation + wiring
     ------------------------------------------------------------------ */

  // The nav is always a hamburger: this flips the panel open/closed.
  let setNavOpen = () => {};

  function showSection(id) {
    const sections = document.querySelectorAll('.tool');
    const dividers = document.querySelectorAll('#sections > .divider');
    const homeContent = document.getElementById('homeContent');
    const target = document.getElementById(id);
    
    if (id === 'home' || !id) {
      sections.forEach(s => s.style.display = 'none');
      dividers.forEach(d => d.style.display = 'none');
      if (homeContent) homeContent.style.display = 'block';
      
      const pills = document.querySelectorAll('.pill');
      pills.forEach(p => p.classList.remove('is-active'));
      history.replaceState(null, '', '/');
      return;
    }

    if (!target) return;

    sections.forEach(s => s.style.display = 'none');
    dividers.forEach(d => d.style.display = 'none');
    if (homeContent) homeContent.style.display = 'none';
    
    target.style.display = 'block';
    target.classList.add('fade-in');
    
    // Update active state in nav
    const pills = document.querySelectorAll('.pill');
    pills.forEach(p => {
      if (p.dataset.target === id) p.classList.add('is-active');
      else p.classList.remove('is-active');
    });

    history.replaceState(null, '', '#' + id);
    const input = target._parts.input;
    if (input) setTimeout(() => input.focus({ preventScroll: true }), 450);
  }

  function wireBurger() {
    const btn = document.getElementById('burgerBtn');
    const nav = document.getElementById('pillNav');
    if (!btn || !nav) return;

    const setOpen = (open) => {
      btn.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close lookup menu' : 'Open lookup menu');
      nav.hidden = !open;
    };
    setNavOpen = setOpen;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(nav.hidden);
    });

    // Close when clicking outside, or on Escape.
    document.addEventListener('click', (e) => {
      if (nav.hidden) return;
      if (!nav.contains(e.target) && !btn.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !nav.hidden) {
        setOpen(false);
        btn.focus();
      }
    });
  }

  function buildNav() {
    const nav = document.getElementById('pillNav');
    if (!nav) return;
    TOOLS.forEach((tool) => {
      const b = el('button', 'pill', tool.label);
      b.type = 'button';
      b.dataset.target = tool.id;
      b.addEventListener('click', () => {
        setNavOpen(false);
        showSection(tool.id);
      });
      nav.appendChild(b);
    });
  }

  function buildSections() {
    const host = document.getElementById('sections');
    if (!host) return;
    TOOLS.forEach((tool, i) => {
      if (i > 0) host.appendChild(el('div', 'divider'));
      host.appendChild(buildSection(tool));
    });
  }

  // Splash overlay is decorative: keep it up for ~2-3s, then fade out.
  function initSplash() {
    const splash = document.getElementById('splash');
    if (!splash) return;

    const MIN_MS = 2000;
    const MAX_MS = 3000;
    const start = performance.now();
    let done = false;

    const remove = () => {
      if (done) return;
      done = true;
      splash.classList.add('is-hidden');
      setTimeout(() => splash.remove(), 620);
    };

    const schedule = () => setTimeout(remove, Math.max(0, MIN_MS - (performance.now() - start)));
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });
    setTimeout(remove, MAX_MS); // hard cap — never traps the user
  }

  function init() {
    // Logo click to go home
    const logo = document.querySelector('.topbar a');
    if (logo) {
      logo.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('home');
      });
    }

    // Live host in the footer
    const hostLabel = document.getElementById('hostLabel');
    if (hostLabel) hostLabel.textContent = location.host || 'oinst.kryzo.space';

    // Copyright year
    const yearLabel = document.getElementById('yearLabel');
    if (yearLabel) yearLabel.textContent = String(new Date().getFullYear());

    initSplash();
    wireBurger();
    buildNav();
    buildSections();

    // Deep link or default to first tool
    const hash = location.hash.replace('#', '');
    showSection(hash || (TOOLS[0] ? TOOLS[0].id : null));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
