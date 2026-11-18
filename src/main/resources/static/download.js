const token = location.pathname.split('/').filter(Boolean).pop();

function showError(title, text) {
  $('loading').hidden = true;
  $('fileBox').hidden = true;
  $('errorTitle').textContent = title;
  $('errorText').textContent = text;
  $('errorBox').hidden = false;
}

function startCountdown(expires) {
  const timer = setInterval(tick, 1000);
  function tick() {
    const left = expires - Date.now();
    if (left <= 0) {
      clearInterval(timer);
      showError('This link has expired', 'The file has been removed from cloud storage. Ask the sender for a new link.');
      return;
    }
    $('countdown').textContent = timeLeft(left);
  }
  tick();
}

async function load() {
  try {
    const res = await fetch('/api/files/' + encodeURIComponent(token));
    const data = await res.json();
    if (!res.ok) {
      res.status === 410
        ? showError('This link has expired', data.error)
        : showError('File not found', 'This link does not exist. Check that you copied the full link.');
      return;
    }
    setTypeBadge($('ftype'), data.fileName);
    $('fileName').textContent = data.fileName;
    $('fileSize').textContent = formatSize(data.size);
    $('uploaded').textContent = fmtDate(new Date(data.uploadedAt));
    $('downloads').textContent = data.downloads;
    $('downloadBtn').href = '/api/files/' + encodeURIComponent(token) + '/download';
    $('downloadBtn').addEventListener('click', () => {
      setTimeout(() => $('downloads').textContent = +$('downloads').textContent + 1, 800);
    });
    startCountdown(new Date(data.expiresAt).getTime());
    $('loading').hidden = true;
    $('fileBox').hidden = false;
  } catch (e) {
    showError('Server is waking up', 'The free cloud server sleeps when idle. Refresh this page in about 30 seconds.');
  }
}
load();
