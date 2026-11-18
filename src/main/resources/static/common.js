/* Helpers shared by the upload page and the download page */
const $ = id => document.getElementById(id);

function formatSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

const TYPE_COLORS = {
  pdf: 'c-pdf',
  jpg: 'c-img', jpeg: 'c-img', png: 'c-img', gif: 'c-img', webp: 'c-img', svg: 'c-img', heic: 'c-img',
  mp4: 'c-vid', mov: 'c-vid', mkv: 'c-vid', avi: 'c-vid', webm: 'c-vid',
  mp3: 'c-aud', wav: 'c-aud', m4a: 'c-aud', ogg: 'c-aud',
  zip: 'c-zip', rar: 'c-zip', '7z': 'c-zip', tar: 'c-zip', gz: 'c-zip',
  doc: 'c-doc', docx: 'c-doc', txt: 'c-doc', ppt: 'c-doc', pptx: 'c-doc', xls: 'c-doc', xlsx: 'c-doc', csv: 'c-doc'
};

/** Fills a badge element with the file extension and a colour for its type. */
function setTypeBadge(el, name) {
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
  el.textContent = ext ? ext.slice(0, 4).toUpperCase() : 'FILE';
  el.className = el.className.replace(/\bc-\w+/g, '').trim() + ' ' + (TYPE_COLORS[ext] || 'c-any');
}

function timeLeft(ms) {
  let s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60); s %= 60;
  const p = n => String(n).padStart(2, '0');
  return (d ? d + 'd ' : '') + p(h) + ':' + p(m) + ':' + p(s);
}

const fmtDate = d => d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

function toast(msg, isError) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.className = 'toast', 2600);
}
