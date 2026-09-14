export function avatarFallback(event) {
  const img = event.currentTarget;
  if (!img || img.src === '/logo.png') return;
  img.onerror = null;
  img.src = '/logo.png';
}