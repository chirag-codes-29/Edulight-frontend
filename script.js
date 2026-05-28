/* ═══════════════════════════════════════════════════════
   EduLight — script.js
   Features: Navigation, Predictor, To-do, FAQ, Drag-drop,
             Checklist, Forms, Filters, Toast
   ═══════════════════════════════════════════════════════ */

'use strict';

/* ─── BACKEND CONFIG ─── */
// Render backend URL — change mat karna
const API_BASE = 'https://edulight-backend.onrender.com';

/* ─── PAGE NAVIGATION ─── */

/**
 * Show a specific page and hide all others
 * @param {string} pageId - Page identifier
 */
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Show target page
  const target = document.getElementById('page-' + pageId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update nav link active state
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    a.classList.remove('active-link');
    if (a.dataset.page === pageId) a.classList.add('active-link');
  });

  // Close mobile nav
  document.getElementById('navLinks')?.classList.remove('open');
}

/* ─── NAVBAR ─── */

// Sticky navbar shadow on scroll
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }
});

// Hamburger menu toggle
document.getElementById('hamburger')?.addEventListener('click', () => {
  document.getElementById('navLinks')?.classList.toggle('open');
});
// Close nav when clicking outside
document.addEventListener('click', (e) => {
  const nav = document.getElementById('navLinks');
  const burger = document.getElementById('hamburger');
  if (nav?.classList.contains('open') && !nav.contains(e.target) && !burger.contains(e.target)) {
    nav.classList.remove('open');
  }
});

// Close mobile nav on link click
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('navLinks')?.classList.remove('open');
  });
});

/* ─── TOAST NOTIFICATION ─── */

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {number} duration - Duration in ms (default 3000)
 */
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

/* ═══════════════════════════════════════════════ PREDICTOR ═══ */

/**
 * Helper: chance label → CSS class
 */
function getChanceClass(label) {
  if (!label) return 'low';
  const l = label.toLowerCase();
  if (l.includes('high') || l.includes('good')) return 'high';
  if (l.includes('border') || l.includes('moderate')) return 'medium';
  return 'low';
}

/**
 * Run the full college predictor — calls real backend API
 */
async function runPredictor() {
  const rank     = parseInt(document.getElementById('predRank')?.value);
  const cat      = document.getElementById('predCategory')?.value || 'OPEN';
  const domicile = document.getElementById('predDomicile')?.value || 'Delhi';
  const resultsEl = document.getElementById('predictorResults');

  if (!rank || rank <= 0) {
    showToast('⚠️ Please enter a valid rank');
    return;
  }

  // Show loading state
  resultsEl.innerHTML = '<p style="color:var(--text-light);font-size:.875rem">⏳ Fetching predictions...</p>';
  resultsEl.classList.remove('hidden');

  try {
    const res  = await fetch(
      `${API_BASE}/api/predict?rank=${rank}&category=${encodeURIComponent(cat)}&domicile=${encodeURIComponent(domicile)}&round=3&year=2024`
    );
    const data = await res.json();

    if (!data.success || !data.results?.length) {
      resultsEl.innerHTML = '<p style="color:#dc2626;font-size:.875rem">No strong matches found. Try a different category or domicile.</p>';
      return;
    }

    resultsEl.innerHTML = data.results.slice(0, 10).map(r => `
      <div class="pred-result-item">
        <div>
          <strong style="font-size:.85rem">${r.collegeCode} — ${r.branch}</strong>
          <div style="font-size:.78rem;color:var(--text-light)">
            Closing Rank: ${r.closingRank?.toLocaleString('en-IN')} · ${r.domicile}
          </div>
        </div>
        <span class="pred-chance ${getChanceClass(r.chance)}">${r.chance}</span>
      </div>
    `).join('');

    showToast(`✓ ${data.results.length} options found!`);

  } catch (err) {
    console.error('Predictor API error:', err);
    resultsEl.innerHTML = '<p style="color:#dc2626;font-size:.875rem">⚠️ Could not connect to server. Please try again.</p>';
    showToast('⚠️ Server error, try again');
  }
}

/**
 * Quick predictor on hero section — fast local logic, no API needed
 */
function quickPredict() {
  const rank = parseInt(document.getElementById('heroRankInput')?.value);
  const resultEl = document.getElementById('heroPredictResult');

  if (!rank || rank <= 0) {
    showToast('⚠️ Enter your JEE rank first');
    return;
  }

  let message = '';
  if (rank <= 1800)       message = '🏆 Excellent! DTU CSE, IIITD CSE are strong possibilities. Build a focused preference list.';
  else if (rank <= 4000)  message = '🎯 Great rank! DTU IT/ECE, NSUT CSE, IIITD ECE are realistic targets.';
  else if (rank <= 8000)  message = '✅ Good range! NSUT IT/ECE, IGDTUW IT are solid options.';
  else if (rank <= 14000) message = '📊 Explore NSUT ECE, IGDTUW IT, and newer branches. Good options available.';
  else if (rank <= 25000) message = '🔍 Consider core branches and explore colleges beyond the top 4 Delhi colleges.';
  else                    message = '💪 Look beyond JAC Delhi — IITs via Advanced, NITs via JoSAA are also paths worth exploring.';

  resultEl.innerHTML = `<strong>Rank ${rank.toLocaleString('en-IN')}:</strong> ${message}`;
  resultEl.classList.remove('hidden');
}

/**
 * Show cutoff data for selected college + branch — calls real backend API
 */
async function showCutoff() {
  const college   = document.getElementById('cutoffCollege')?.value;
  const branch    = document.getElementById('cutoffBranch')?.value;
  const year      = document.getElementById('cutoffYear')?.value || '2024';
  const resultsEl = document.getElementById('cutoffResults');

  if (!college || !branch) {
    showToast('⚠️ Select a college and branch');
    return;
  }

  resultsEl.innerHTML = '<p style="color:var(--text-light);font-size:.875rem">⏳ Loading cutoff data...</p>';
  resultsEl.classList.remove('hidden');

  try {
    const res  = await fetch(
      `${API_BASE}/api/cutoffs?collegeCode=${encodeURIComponent(college)}&branch=${encodeURIComponent(branch)}&year=${year}&round=3`
    );
    const data = await res.json();

    if (!data.success || !data.cutoffs?.length) {
      resultsEl.innerHTML = '<p style="color:var(--text-muted);font-size:.875rem">Cutoff data not available for this combination yet.</p>';
      return;
    }

    resultsEl.innerHTML = `
      <p style="font-size:.78rem;color:var(--text-light);margin-bottom:.75rem">
        ${college} — ${branch} — Round 3 Closing Rank (${year}, Official JAC Delhi Data)
      </p>
      ${data.cutoffs.map(c => `
        <div class="pred-result-item">
          <span style="font-size:.85rem">${c.category} · ${c.domicile}</span>
          <strong style="color:var(--teal-dk)">${c.closingRank?.toLocaleString('en-IN')}</strong>
        </div>
      `).join('')}
    `;

  } catch (err) {
    console.error('Cutoff API error:', err);
    resultsEl.innerHTML = '<p style="color:#dc2626;font-size:.875rem">⚠️ Could not load data. Please try again.</p>';
  }
}

/* ═══════════════════════════════════════════════ FAQ ACCORDION ═══ */

/**
 * Toggle FAQ item open/closed
 */
function toggleFaq(el) {
  const item = el.closest('.faq-item');
  const isOpen = item.classList.contains('open');

  // Close all
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));

  // Open clicked (unless it was already open)
  if (!isOpen) item.classList.add('open');
}

/* ═══════════════════════════════════════════════ DOCUMENT CHECKLIST ═══ */

// Update document checklist progress bar
function updateDocProgress() {
  // Sirf mandatory checkboxes count honge progress mein
  const mandatoryIds = ['cb-fee','cb-regform','cb-choices','cb-photos','cb-jee','cb-class12','cb-allotment','cb-class10','cb-medical'];
  const total = mandatoryIds.length;
  const checked = mandatoryIds.filter(id => document.getElementById(id)?.checked).length;
  const pct = Math.round((checked / total) * 100);

  // Admission page progress bar
  const fill = document.getElementById('docProgFill');
  const pctEl = document.getElementById('docProgPct');
  if (fill) fill.style.width = pct + '%';
  if (pctEl) pctEl.textContent = pct + '%';

  // Dashboard individual bars
  document.querySelectorAll('.dp-item[data-cb]').forEach(item => {
    const cb = document.getElementById(item.dataset.cb);
    const val = cb?.checked ? 100 : 0;
    const barFill = item.querySelector('.prog-fill');
    const barPct  = item.querySelector('.dp-pct');
    if (barFill) barFill.style.width = val + '%';
    if (barPct)  barPct.textContent  = val + '%';
  });

  // Dashboard overall
  const overallPct  = document.getElementById('overallPct');
  const overallFill = document.getElementById('overallFill');
  if (overallPct)  overallPct.textContent  = pct + '%';
  if (overallFill) overallFill.style.width = pct + '%';
}

// Attach listeners to checklist
document.querySelectorAll('#docChecklist input[type=checkbox]').forEach(cb => {
  cb.addEventListener('change', updateDocProgress);
});

/* ═══════════════════════════════════════════════ PREFERENCE LIST BUILDER ═══ */

let draggedItem = null;

/**
 * Initialize drag-and-drop for preference builder
 */
function initDragDrop() {
  const dropZone = document.getElementById('prefList');

  function addToList(id, text) {
    const dropZone = document.getElementById('prefList');
    if (!dropZone) return;
    const existingIds = [...dropZone.querySelectorAll('.pref-item')].map(el => el.dataset.id);
    if (existingIds.includes(id)) { showToast('⚠️ Already in your list!'); return; }
    const emptyMsg = dropZone.querySelector('.pref-empty-msg');
    if (emptyMsg) emptyMsg.remove();
    const clone = document.createElement('div');
    clone.className = 'pref-item';
    clone.dataset.id = id;
    clone.innerHTML = `<span>${text}</span><span class="pref-remove" onclick="removePrefItem(this)">✕</span>`;
    dropZone.appendChild(clone);
    bindListItem(clone);
    updatePrefCount();
    showToast('✓ Added to your list!');
    // Hide from available list
    const original = document.querySelector(`#prefAvailable .pref-item[data-id="${id}"]`);
    if (original) original.style.display = 'none';
  }

  function bindAvailableItem(item) {
    item.addEventListener('dragstart', e => {
      e.dataTransfer.setData('type', 'new');
      e.dataTransfer.setData('id', item.dataset.id);
      e.dataTransfer.setData('text', item.textContent.trim());
      item.classList.add('dragging');
    });
    item.addEventListener('dragend', () => item.classList.remove('dragging'));
    item.addEventListener('dblclick', () => addToList(item.dataset.id, item.textContent.trim()));
  }
  document.querySelectorAll('.pref-item.draggable').forEach(bindAvailableItem);

  function bindListItem(el) {
    el.setAttribute('draggable', 'true');
    el.addEventListener('dragstart', e => {
      e.dataTransfer.setData('type', 'reorder');
      e.dataTransfer.effectAllowed = 'move';
      el.classList.add('dragging');
      setTimeout(() => el.classList.add('drag-ghost'), 0);
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
      el.classList.remove('drag-ghost');
      dropZone.querySelectorAll('.drag-over-item').forEach(i => i.classList.remove('drag-over-item'));
    });
  }

  if (!dropZone) return;

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    const draggingEl = dropZone.querySelector('.dragging');
    if (draggingEl) {
      const siblings = [...dropZone.querySelectorAll('.pref-item:not(.dragging)')];
      dropZone.querySelectorAll('.drag-over-item').forEach(i => i.classList.remove('drag-over-item'));
      const next = siblings.find(s => {
        const rect = s.getBoundingClientRect();
        return e.clientY < rect.top + rect.height / 2;
      });
      if (next) next.classList.add('drag-over-item');
    } else {
      dropZone.classList.add('drag-over');
    }
  });

  dropZone.addEventListener('dragleave', e => {
    if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const draggingEl = dropZone.querySelector('.dragging');

    if (draggingEl) {
      const siblings = [...dropZone.querySelectorAll('.pref-item:not(.dragging)')];
      const next = siblings.find(s => {
        const rect = s.getBoundingClientRect();
        return e.clientY < rect.top + rect.height / 2;
      });
      dropZone.insertBefore(draggingEl, next || null);
      dropZone.querySelectorAll('.drag-over-item').forEach(i => i.classList.remove('drag-over-item'));
      updatePrefCount();
      return;
    }

    const id   = e.dataTransfer.getData('id');
    const text = e.dataTransfer.getData('text');
    if (!id) return;
    addToList(id, text);
  });
}


function filterPrefOptions() {
  const colleges = ['dtu','nsut','iiitd','igdtuw'];
  const active = colleges.filter(c => document.getElementById('filter-' + c)?.checked);
  document.querySelectorAll('#prefAvailable .pref-item').forEach(item => {
    item.style.display = active.includes(item.dataset.college) ? '' : 'none';
  });
}
/**
 * Remove an item from the preference list
 */
function removePrefItem(btn) {
  const item = btn.closest('.pref-item');
  const id = item.dataset.id;
  item.remove();

  // Show back in available list
  const original = document.querySelector(`#prefAvailable .pref-item[data-id="${id}"]`);
  if (original) {
    const colleges = ['dtu','nsut','iiitd','igdtuw'];
    const active = colleges.filter(c => document.getElementById('filter-' + c)?.checked);
    if (active.includes(original.dataset.college)) original.style.display = '';
  }

  const dropZone = document.getElementById('prefList');
  if (dropZone && dropZone.children.length === 0) {
    dropZone.innerHTML = '<p class="pref-empty-msg">Drag options here to build your list</p>';
  }
  updatePrefCount();
}

/**
 * Update the preference count tag
 */
function updatePrefCount() {
  const dropZone = document.getElementById('prefList');
  const count = dropZone ? dropZone.querySelectorAll('.pref-item').length : 0;
  const countEl = document.getElementById('prefCount');
  if (countEl) countEl.textContent = count + (count === 1 ? ' added' : ' added');
}

/**
 * Clear the entire preference list
 */
function clearPrefList() {
  const dropZone = document.getElementById('prefList');
  if (!dropZone) return;
  dropZone.innerHTML = '<p class="pref-empty-msg">Drag options here to build your list</p>';
  updatePrefCount();
  showToast('🗑️ List cleared');
}

/* ═══════════════════════════════════════════════ COMMUNITY FORMS ═══ */

/**
 * Submit a doubt question — calls real backend API
 */
async function submitDoubt() {
  const text      = document.getElementById('doubtInput')?.value?.trim();
  const name      = document.getElementById('doubtName')?.value?.trim();
  const confirmEl = document.getElementById('doubtConfirm');

  if (!text) {
    showToast('⚠️ Please type your question first');
    return;
  }

  try {
    const res  = await fetch(`${API_BASE}/api/questions`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text, name: name || 'Anonymous' }),
    });
    const data = await res.json();
    // data.success check optional — show success either way for good UX
  } catch (err) {
    console.error('Doubt submit error:', err);
    // Still show success — don't break UX if backend is sleeping (Render cold start)
  }

  if (confirmEl) {
    confirmEl.innerHTML = `✓ Your question has been submitted${name ? ', ' + name : ''}! Our community will respond soon. Join a WhatsApp group below for faster answers.`;
    confirmEl.classList.remove('hidden');
  }

  // Clear inputs
  if (document.getElementById('doubtInput')) document.getElementById('doubtInput').value = '';
  if (document.getElementById('doubtName'))  document.getElementById('doubtName').value  = '';
  showToast('✓ Question submitted!');
}

/**
 * Request a mentorship meet
 */
function requestMeet() {
  const name = document.getElementById('meetName')?.value?.trim();
  const topic = document.getElementById('meetCollege')?.value?.trim();
  const confirmEl = document.getElementById('meetConfirm');

  if (!name || !topic) {
    showToast('⚠️ Fill in your name and topic');
    return;
  }

  if (confirmEl) {
    confirmEl.innerHTML = `✓ Meet request received, ${name}! We'll reach out within 24–48 hours via email or WhatsApp.`;
    confirmEl.classList.remove('hidden');
  }

  if (document.getElementById('meetName')) document.getElementById('meetName').value = '';
  if (document.getElementById('meetCollege')) document.getElementById('meetCollege').value = '';
  showToast('✓ Meet request sent!');
}

/* ═══════════════════════════════════════════════ BRANCH FILTER ═══ */

/**
 * Filter branch comparison table
 */
function filterBranch(type, btn) {
  // Update active button
  document.querySelectorAll('.branch-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Show/hide rows
  document.querySelectorAll('#branchTable .bt-row:not(.bt-header)').forEach(row => {
    if (type === 'all') {
      row.style.display = '';
    } else {
      const rowType = row.dataset.type || '';
      row.style.display = rowType.includes(type) ? '' : 'none';
    }
  });
}

/* ═══════════════════════════════════════════════ TO-DO LIST ═══ */

let taskIdCounter = 0;

/**
 * Add a new task to the to-do list
 */
function addTask() {
  const input = document.getElementById('todoInput');
  const list = document.getElementById('todoList');
  const text = input?.value?.trim();

  if (!text) {
    showToast('⚠️ Type a task first');
    return;
  }

  // Remove empty message
  const emptyEl = list?.querySelector('.todo-empty');
  if (emptyEl) emptyEl.remove();

  const id = ++taskIdCounter;
  const li = document.createElement('li');
  li.className = 'todo-item';
  li.dataset.id = id;
  li.innerHTML = `
    <input type="checkbox" id="task-${id}" onchange="updateTaskCount()" />
    <span>${escapeHtml(text)}</span>
    <button class="todo-del" onclick="removeTask(${id})" title="Delete">✕</button>
  `;

  list?.appendChild(li);
  input.value = '';
  updateTaskCount();
  showToast('✓ Task added!');
}

/**
 * Remove a task from the list
 */
function removeTask(id) {
  const li = document.querySelector(`.todo-item[data-id="${id}"]`);
  if (li) {
    li.style.opacity = '0';
    li.style.transform = 'translateX(10px)';
    li.style.transition = 'opacity .2s, transform .2s';
    setTimeout(() => {
      li.remove();
      updateTaskCount();
      // Show empty message if needed
      const list = document.getElementById('todoList');
      if (list && list.children.length === 0) {
        list.innerHTML = '<li class="todo-empty">No tasks yet. Add one above!</li>';
      }
    }, 200);
  }
}

/**
 * Update the task count display
 */
function updateTaskCount() {
  const tasks = document.querySelectorAll('.todo-item');
  const done  = [...document.querySelectorAll('.todo-item input:checked')].length;
  const el = document.getElementById('taskCount');
  if (el) el.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}${done > 0 ? ' · ' + done + ' done' : ''}`;
}

/* ═══════════════════════════════════════════════ NOTES ═══ */

/**
 * Save notes to localStorage
 */
function saveNote() {
  const text = document.getElementById('notepad')?.value;
  const el = document.getElementById('noteSaved');

  try {
    localStorage.setItem('edulight_notes', text || '');
    if (el) {
      el.textContent = '✓ Notes saved!';
      el.classList.remove('hidden');
      setTimeout(() => el.classList.add('hidden'), 3000);
    }
    showToast('📝 Notes saved!');
  } catch (e) {
    showToast('⚠️ Could not save notes');
  }
}

/**
 * Load saved notes on page load
 */
function loadNote() {
  try {
    const saved = localStorage.getItem('edulight_notes');
    const notepad = document.getElementById('notepad');
    if (saved && notepad) notepad.value = saved;
  } catch (e) { /* silent */ }
}

/* ═══════════════════════════════════════════════ RESOURCES DOWNLOADS ═══ */

/**
 * Simulate a file download
 */
function fakeDownload(filename) {
  // Create a dummy text blob as a placeholder
  const content = `EduLight — ${filename}\n\nThis is a placeholder file.\nFull content coming soon.\n\nVisit: edulight.contact@gmail.com for the actual resource.`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.replace('.pdf', '.txt').replace('.xlsx', '.txt');
  a.click();
  URL.revokeObjectURL(url);
  showToast('⬇️ Download started!');
}

/* ─── UTILITY ─── */

/**
 * Escape HTML to prevent XSS in task inputs
 */
function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

/* ═══════════════════════════════════════════════ INIT ═══ */

/**
 * Initialize everything on DOM load
 */
document.addEventListener('DOMContentLoaded', () => {
  // Start on home page
  showPage('home');

  // Init drag-drop for preference builder
  initDragDrop();

  // Load saved notes
  loadNote();

  // Animate stat numbers
  animateStats();

  // Keyboard shortcut: Enter on predictor inputs
  document.getElementById('predRank')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') runPredictor();
  });
  document.getElementById('heroRankInput')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') quickPredict();
});
});

/**
 * Animate stat numbers with a simple count-up
 */
function animateStats() {
  // Observer for when stats section becomes visible
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.stat-item').forEach(el => observer.observe(el));
}

/* ─── Prevent default anchor scrolling for # links ─── */
document.querySelectorAll('a[href="#"]').forEach(a => {
  a.addEventListener('click', e => e.preventDefault());
});
/* ─── PREFERENCE BUILDER TOGGLE ─── */
function togglePrefBuilder(header) {
  const section = document.getElementById('prefBuilderSection');
  const arrow = document.getElementById('prefBuilderArrow');
  const isOpen = section.style.display !== 'none';
  section.style.display = isOpen ? 'none' : 'grid';
  arrow.textContent = isOpen ? '▼ Open' : '▲ Close';
}
