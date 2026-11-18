const token = location.pathname.split('/').filter(Boolean).pop();

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

async function load() {
  const loading = document.getElementById('loading');
  try {
    const res = await fetch('/api/files/' + encodeURIComponent(token));
    const data = await res.json();
    loading.hidden = true;

    if (!res.ok) {
      document.getElementById('errorText').textContent = data.error || 'Something went wrong.';
      document.getElementById('errorBox').hidden = false;
      return;
    }
    document.getElementById('fileName').textContent = data.fileName;
    document.getElementById('fileMeta').textContent =
      formatSize(data.size) + ' | Expires ' + new Date(data.expiresAt).toLocaleString() +
      ' | Downloaded ' + data.downloads + ' time(s)';
    document.getElementById('downloadBtn').href = '/api/files/' + encodeURIComponent(token) + '/download';
    document.getElementById('fileBox').hidden = false;
  } catch (e) {
    loading.hidden = true;
    document.getElementById('errorText').textContent = 'Could not reach the server.';
    document.getElementById('errorBox').hidden = false;
  }
}
load();
