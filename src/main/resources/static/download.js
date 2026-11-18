const $ = id => document.getElementById(id);
const token = location.pathname.split('/').filter(Boolean).pop();

function formatSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - date) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

function startCountdown(expires) {
  const tick = () => {
    let s = Math.max(0, Math.floor((expires - Date.now()) / 1000));
    if (s === 0) { showError('Link expired', 'This link has expired and the file was removed.'); return; }
    const d = Math.floor(s / 86400); s %= 86400;
    const h = Math.floor(s / 3600); s %= 3600;
    const m = Math.floor(s / 60); s %= 60;
    $('countdown').textContent = d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m ${s}s`;
  };
  tick();
  setInterval(tick, 1000);
}

function showError(title, text) {
  $('loading').hidden = true;
  $('fileBox').hidden = true;
  $('errorTitle').textContent = title;
  $('errorText').textContent = text;
  $('errorBox').hidden = false;
}

async function load() {
  try {
    const res = await fetch('/api/files/' + encodeURIComponent(token));
    const data = await res.json();
    if (!res.ok) {
      showError(res.status === 410 ? 'Link expired' : 'Link not found', data.error || 'Something went wrong.');
      return;
    }
    const ext = data.fileName.includes('.') ? data.fileName.split('.').pop().toUpperCase().slice(0, 4) : 'FILE';
    $('fileIcon').textContent = ext;
    $('fileName').textContent = data.fileName;
    $('fileSize').textContent = formatSize(data.size);
    $('downloads').textContent = data.downloads;
    $('uploaded').textContent = timeAgo(new Date(data.uploadedAt));
    $('downloadBtn').href = '/api/files/' + encodeURIComponent(token) + '/download';
    $('downloadBtn').addEventListener('click', () => {
      setTimeout(() => $('downloads').textContent = +$('downloads').textContent + 1, 800);
    });
    startCountdown(new Date(data.expiresAt).getTime());
    $('loading').hidden = true;
    $('fileBox').hidden = false;
  } catch (e) {
    showError('Server unreachable', 'Could not reach the server. Please try again in a moment.');
  }
}
load();
