let stopAlignment;
export function stopEntryAlignment(){stopAlignment?.();}

/** Align the whole entry below a pinned header, including delayed layout changes. */
export function revealEntry(card) {
  stopAlignment?.();
  if (!card) return;
  const align = () => {
    if (!card.isConnected) return;
    const header = document.querySelector('.app > .top');
    const pinned = header && ['fixed', 'sticky'].includes(window.getComputedStyle(header).position);
    const offset = pinned ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
    window.scrollTo({ top: Math.max(0, window.scrollY + card.getBoundingClientRect().top - offset - 12), left: 0, behavior: 'instant' });
  };
  let frame, timer;
  const observer = new MutationObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(align); });
  const events = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
  const stop = () => {
    observer.disconnect(); clearTimeout(timer); cancelAnimationFrame(frame);
    events.forEach(event => window.removeEventListener(event, stop));
    if (stopAlignment === stop) stopAlignment = null;
  };
  stopAlignment = stop;
  observer.observe(card.closest('#app') || card, { childList: true, subtree: true });
  events.forEach(event => window.addEventListener(event, stop, { once: true, passive: true }));
  align(); frame = requestAnimationFrame(align); timer = setTimeout(stop, 2000);
}
