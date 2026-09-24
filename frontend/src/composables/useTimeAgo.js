export function useTimeAgo() {
  function timeAgo(fecha) {
    const ahora = new Date();
    const antes = new Date(fecha);
    const diff = Math.floor((ahora - antes) / 1000);

    if (diff < 60) return 'hace un momento';
    if (diff < 3600) {
      const mins = Math.floor(diff / 60);
      return `hace ${mins} min`;
    }
    if (diff < 86400) {
      const hs = Math.floor(diff / 3600);
      return `hace ${hs}h`;
    }
    const dias = Math.floor(diff / 86400);
    return `hace ${dias}d`;
  }

  return { timeAgo };
}