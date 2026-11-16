export function regionalDate(now = new Date(), timeZone = 'America/Chicago') {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const value = type => parts.find(part => part.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function publishedBites(catalog, regionId, now = new Date()) {
  const region = catalog.regions.find(region => region.id === regionId);
  if (!region) return [];
  const today = regionalDate(now, region.timeZone);
  return catalog.entries.filter(entry => entry.regionId === regionId && entry.status === 'approved' && entry.publicationDate <= today)
    .sort((a, b) => b.publicationDate.localeCompare(a.publicationDate));
}

export function currentBite(catalog, regionId, now = new Date()) {
  const entry = publishedBites(catalog, regionId, now)[0];
  const region = catalog.regions.find(region => region.id === regionId);
  return entry ? { entry, isToday: entry.publicationDate === regionalDate(now, region.timeZone) } : null;
}

// Find the next local date boundary rather than assuming every day lasts 24 hours.
export function millisecondsToNextDate(now = new Date(), timeZone = 'America/Chicago') {
  const start = now.getTime(), today = regionalDate(now, timeZone);
  let low = start, high = start + 48 * 60 * 60 * 1000;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (regionalDate(new Date(middle), timeZone) === today) low = middle;
    else high = middle;
  }
  return high - start;
}

export function validateCatalog(catalog) {
  const errors = [], ids = new Set(), dates = new Set(), claims = new Set();
  const regions = new Map((catalog.regions || []).map(region => [region.id, region]));
  for (const region of regions.values()) {
    try { regionalDate(new Date(), region.timeZone); } catch { errors.push(`Invalid time zone: ${region.id}`); }
  }
  for (const entry of catalog.entries || []) {
    for (const field of ['id','regionId','title','summary','body','category','primarySubject','claimKey','publicationDate','verifiedAt']) {
      if (typeof entry[field] !== 'string' || !entry[field].trim()) errors.push(`${entry.id}: missing ${field}`);
    }
    if (!regions.has(entry.regionId)) errors.push(`${entry.id}: unknown region`);
    const parsedDate=new Date(`${entry.publicationDate}T12:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.publicationDate) || !Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0,10) !== entry.publicationDate) errors.push(`${entry.id}: invalid date`);
    if (!['draft','approved','rejected'].includes(entry.status)) errors.push(`${entry.id}: invalid status`);
    if (ids.has(entry.id)) errors.push(`Duplicate id: ${entry.id}`);
    ids.add(entry.id);
    if (!Array.isArray(entry.subjectTags) || !entry.subjectTags.length) errors.push(`${entry.id}: missing tags`);
    if (!entry.sources?.length || entry.sources.some(source => !source.name || !/^https:\/\//.test(source.url))) errors.push(`${entry.id}: invalid sources`);
    if (entry.status !== 'approved') continue;
    const dateKey = `${entry.regionId}:${entry.publicationDate}`, claimKey = `${entry.regionId}:${String(entry.claimKey||'').toLowerCase().replace(/[^a-z0-9]/g,'')}`;
    if (dates.has(dateKey)) errors.push(`Duplicate publication: ${dateKey}`);
    if (claims.has(claimKey)) errors.push(`Duplicate fact: ${entry.claimKey}`);
    dates.add(dateKey); claims.add(claimKey);
  }
  const approved = (catalog.entries || []).filter(entry => entry.status === 'approved');
  for (let a=0; a<approved.length; a++) for (let b=a+1; b<approved.length; b++) {
    const first=approved[a], second=approved[b];
    if (first.regionId !== second.regionId) continue;
    if (String(first.summary).trim().toLowerCase() === String(second.summary).trim().toLowerCase() || String(first.body).trim().toLowerCase() === String(second.body).trim().toLowerCase()) errors.push(`Repeated content: ${first.id}, ${second.id}`);
    const gap=Math.abs(Date.parse(first.publicationDate)-Date.parse(second.publicationDate))/86400000;
    if (gap<90 && first.primarySubject===second.primarySubject && !second.subjectRepeatApproval) errors.push(`Subject within 90 days: ${first.primarySubject}`);
  }
  return errors;
}
