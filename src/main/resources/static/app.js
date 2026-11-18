const fileInput = $('fileInput');
const dropZone = $('dropZone');
const uploadBtn = $('uploadBtn');
const MAX = 10 * 1024 * 1024;
let expiryHours = 24;
let current = null;      // last upload response
let timer = null;

/* ---------- choosing a file ---------- */
function showFile() {
  const f = fileInput.files[0];
  if (!f) return;
  setTypeBadge($('ftype'), f.name);
  $('fname').textContent = f.name;
  $('fsize').textContent = formatSize(f.size) + (f.size > MAX ? ' · too large (max 10 MB)' : '');
  dropZone.hidden = true;
  $('fileRow').hidden = false;
  if (f.size > MAX) toast('File is larger than 10 MB', true);
}
function clearFile() {
  fileInput.value = '';
  $('fileRow').hidden = true;
  dropZone.hidden = false;
}

fileInput.addEventListener('change', showFile);
$('removeBtn').addEventListener('click', clearFile);
['dragenter', 'dragover'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('over'); }));
['dragleave', 'drop'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('over'); }));
dropZone.addEventListener('drop', e => {
  if (e.dataTransfer.files.length) { fileInput.files = e.dataTransfer.files; showFile(); }
});

$('expirySeg').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  document.querySelectorAll('#expirySeg button').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  expiryHours = +b.dataset.h;
});

/* ---------- upload with progress ---------- */
uploadBtn.addEventListener('click', () => {
  const f = fileInput.files[0];
  if (!f) return toast('Choose a file first', true);
  if (f.size > MAX) return toast('Maximum size is 10 MB', true);

  const form = new FormData();
  form.append('file', f);
  form.append('expiryHours', expiryHours);

  // XMLHttpRequest instead of fetch because it reports upload progress
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/upload');
  uploadBtn.disabled = true;
  $('progress').hidden = false;

  xhr.upload.onprogress = e => {
    if (!e.lengthComputable) return;
    const p = Math.round(e.loaded / e.total * 100);
    $('bar').style.width = p + '%';
    $('progressPct').textContent = p + '%';
    if (p === 100) $('progressLabel').textContent = 'Saving to cloud storage…';
  };
  xhr.onload = () => {
    let data = {};
    try { data = JSON.parse(xhr.responseText); } catch (e) {}
    resetProgress();
    if (xhr.status >= 200 && xhr.status < 300) showResult(data);
    else toast(data.error || 'Upload failed, please try again', true);
  };
  xhr.onerror = () => { resetProgress(); toast('Network error, check your connection', true); };
  xhr.send(form);
});

function resetProgress() {
  uploadBtn.disabled = false;
  $('progress').hidden = true;
  $('bar').style.width = '0';
  $('progressPct').textContent = '0%';
  $('progressLabel').textContent = 'Uploading…';
}

/* ---------- result ---------- */
function showResult(data) {
  current = data;
  const expires = new Date(data.expiresAt); // server sends UTC, browser shows local time
  $('rName').textContent = 'Anyone with the link can download it';
  setTypeBadge($('rType'), data.fileName);
  $('rFile').textContent = data.fileName;
  $('rSize').textContent = formatSize(data.size);
  $('linkInput').value = data.link;
  $('rExpires').textContent = fmtDate(expires);
  clearInterval(timer);
  const tick = () => $('rLeft').textContent = timeLeft(expires - Date.now());
  tick();
  timer = setInterval(tick, 1000);

  $('waShare').href = 'https://wa.me/?text=' + encodeURIComponent('Download "' + data.fileName + '": ' + data.link);

  $('qr').innerHTML = '';
  if (window.QRCode) {
    new QRCode($('qr'), { text: data.link, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M });
  } else {
    document.querySelector('.qr-card').hidden = true;
  }

  $('uploadBox').hidden = true;
  $('result').hidden = false;
}

/* ---------- copy & share the link ---------- */
$('copyBtn').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(current.link); }
  catch (e) { $('linkInput').select(); document.execCommand('copy'); }
  $('copyBtn').textContent = 'Copied';
  toast('Link copied');
  setTimeout(() => $('copyBtn').textContent = 'Copy', 1600);
});

$('shareLinkBtn').addEventListener('click', async () => {
  const payload = { title: current.fileName, text: 'Download "' + current.fileName + '" from CloudShare', url: current.link };
  if (navigator.share) {
    try { await navigator.share(payload); } catch (e) { /* user closed the share sheet */ }
  } else {
    await navigator.clipboard.writeText(current.link).catch(() => {});
    toast('Sharing not supported here, link copied instead');
  }
});

/* ---------- QR code as an image ---------- */
/** Draws a clean share card (QR + file name + "scan to download") and returns it as a PNG blob. */
function buildQrImage() {
  const src = document.querySelector('#qr canvas') || document.querySelector('#qr img');
  const W = 600, H = 720;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, W, H);
  g.imageSmoothingEnabled = false;
  g.drawImage(src, 90, 70, 420, 420);
  g.fillStyle = '#09090b';
  g.textAlign = 'center';
  g.font = 'bold 30px "Plus Jakarta Sans", Arial, sans-serif';
  let name = current.fileName;
  if (name.length > 30) name = name.slice(0, 28) + '…';
  g.fillText(name, W / 2, 550);
  g.fillStyle = '#63636e';
  g.font = '22px "Plus Jakarta Sans", Arial, sans-serif';
  g.fillText('Scan to download · CloudShare', W / 2, 592);
  g.fillStyle = '#4f8cff';
  g.font = '18px "JetBrains Mono", monospace';
  g.fillText(current.link.replace(/^https?:\/\//, ''), W / 2, 640);
  return new Promise(res => c.toBlob(res, 'image/png'));
}

function qrFileName() {
  return 'cloudshare-qr-' + current.token + '.png';
}

$('qrDownloadBtn').addEventListener('click', async () => {
  const blob = await buildQrImage();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = qrFileName();
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('QR code downloaded');
});

$('qrShareBtn').addEventListener('click', async () => {
  const blob = await buildQrImage();
  const file = new File([blob], qrFileName(), { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: current.fileName, text: 'Scan to download: ' + current.link }); }
    catch (e) { /* user closed the share sheet */ }
  } else {
    $('qrDownloadBtn').click();
    toast('Image sharing not supported here, QR downloaded instead');
  }
});

$('anotherBtn').addEventListener('click', () => {
  clearInterval(timer);
  clearFile();
  $('result').hidden = true;
  $('uploadBox').hidden = false;
});
