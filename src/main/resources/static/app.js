const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const dropText = document.getElementById('dropText');
const uploadBtn = document.getElementById('uploadBtn');
const message = document.getElementById('message');

function showError(text) {
  message.textContent = text;
  message.hidden = false;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

fileInput.addEventListener('change', () => {
  if (fileInput.files.length) {
    dropText.textContent = fileInput.files[0].name + ' (' + formatSize(fileInput.files[0].size) + ')';
  }
});

['dragenter', 'dragover'].forEach(ev =>
  dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('over'); }));
['dragleave', 'drop'].forEach(ev =>
  dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('over'); }));
dropZone.addEventListener('drop', e => {
  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event('change'));
  }
});

uploadBtn.addEventListener('click', async () => {
  message.hidden = true;
  if (!fileInput.files.length) { showError('Please choose a file first.'); return; }

  const form = new FormData();
  form.append('file', fileInput.files[0]);
  form.append('expiryHours', document.getElementById('expiry').value);

  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Uploading...';
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Upload failed. Please try again.');

    document.getElementById('linkInput').value = data.link;
    document.getElementById('resultInfo').textContent =
      data.fileName + ' (' + formatSize(data.size) + ') - expires ' + new Date(data.expiresAt).toLocaleString();
    document.getElementById('uploadBox').hidden = true;
    document.getElementById('result').hidden = false;
  } catch (err) {
    showError(err.message);
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Upload';
  }
});

document.getElementById('copyBtn').addEventListener('click', async () => {
  const input = document.getElementById('linkInput');
  input.select();
  try { await navigator.clipboard.writeText(input.value); } catch (e) { document.execCommand('copy'); }
  document.getElementById('copyBtn').textContent = 'Copied!';
  setTimeout(() => document.getElementById('copyBtn').textContent = 'Copy', 1500);
});

document.getElementById('anotherBtn').addEventListener('click', () => {
  fileInput.value = '';
  dropText.textContent = 'Click to choose a file or drag it here';
  document.getElementById('result').hidden = true;
  document.getElementById('uploadBox').hidden = false;
});
