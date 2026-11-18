const $ = id => document.getElementById(id);
const fileInput = $('fileInput');
const dropZone = $('dropZone');
const uploadBtn = $('uploadBtn');
const MAX = 10 * 1024 * 1024;
let expiryHours = 24;

function formatSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

function toast(msg, isError) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.className = 'toast', 2800);
}

function setFile() {
  const f = fileInput.files[0];
  if (!f) return;
  $('dropText').textContent = f.name;
  $('dropSub').textContent = formatSize(f.size) + ' · ready to upload';
  dropZone.classList.add('has-file');
  if (f.size > MAX) toast('This file is larger than 10 MB.', true);
}

fileInput.addEventListener('change', setFile);
['dragenter', 'dragover'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('over'); }));
['dragleave', 'drop'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('over'); }));
dropZone.addEventListener('drop', e => {
  if (e.dataTransfer.files.length) { fileInput.files = e.dataTransfer.files; setFile(); }
});

$('expirySeg').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  document.querySelectorAll('#expirySeg button').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  expiryHours = +b.dataset.h;
});

uploadBtn.addEventListener('click', () => {
  const f = fileInput.files[0];
  if (!f) return toast('Please choose a file first.', true);
  if (f.size > MAX) return toast('File is too large. Maximum is 10 MB.', true);

  const form = new FormData();
  form.append('file', f);
  form.append('expiryHours', expiryHours);

  // XMLHttpRequest is used instead of fetch because it reports upload progress
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/upload');
  uploadBtn.disabled = true;
  $('progress').hidden = false;

  xhr.upload.onprogress = e => {
    if (!e.lengthComputable) return;
    const p = Math.round(e.loaded / e.total * 100);
    $('progressBar').style.width = p + '%';
    $('progressPct').textContent = p + '%';
    if (p === 100) $('progressLabel').textContent = 'Saving to cloud storage...';
  };
  xhr.onload = () => {
    let data = {};
    try { data = JSON.parse(xhr.responseText); } catch (e) {}
    if (xhr.status >= 200 && xhr.status < 300) showResult(data);
    else { toast(data.error || 'Upload failed. Please try again.', true); resetProgress(); }
  };
  xhr.onerror = () => { toast('Network error. Please check your connection.', true); resetProgress(); };
  xhr.send(form);
});

function resetProgress() {
  uploadBtn.disabled = false;
  $('progress').hidden = true;
  $('progressBar').style.width = '0';
  $('progressPct').textContent = '0%';
  $('progressLabel').textContent = 'Uploading to cloud...';
}

function showResult(data) {
  $('linkInput').value = data.link;
  $('resultInfo').textContent = data.fileName + ' · ' + formatSize(data.size) +
    ' · expires ' + new Date(data.expiresAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  const text = encodeURIComponent('Here is a file for you: ' + data.link);
  $('waShare').href = 'https://wa.me/?text=' + text;
  $('mailShare').href = 'mailto:?subject=' + encodeURIComponent('File shared via CloudShare') + '&body=' + text;
  $('openLink').href = data.link;

  $('qr').innerHTML = '';
  if (window.QRCode) {
    new QRCode($('qr'), { text: data.link, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.M });
  } else {
    $('qr').hidden = true;
  }

  $('uploadBox').hidden = true;
  $('result').hidden = false;
  resetProgress();
}

$('copyBtn').addEventListener('click', async () => {
  const input = $('linkInput');
  input.select();
  try { await navigator.clipboard.writeText(input.value); } catch (e) { document.execCommand('copy'); }
  $('copyBtn').textContent = 'Copied ✓';
  toast('Link copied to clipboard');
  setTimeout(() => $('copyBtn').textContent = 'Copy', 1800);
});

$('anotherBtn').addEventListener('click', () => {
  fileInput.value = '';
  dropZone.classList.remove('has-file');
  $('dropText').innerHTML = 'Drop your file here, or <span class="grad">browse</span>';
  $('dropSub').textContent = 'Any file type · up to 10 MB';
  $('result').hidden = true;
  $('uploadBox').hidden = false;
});
