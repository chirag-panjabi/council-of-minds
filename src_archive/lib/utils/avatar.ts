export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function generateAvatarSvg(name: string): string {
  const initials = getInitials(name);
  
  // Deterministic color generation based on name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const h = Math.abs(hash) % 360;
  const s = 65 + (Math.abs(hash) % 20); // 65-85%
  const l = 45 + (Math.abs(hash) % 15); // 45-60%
  
  const bgColor = `hsl(${h}, ${s}%, ${l}%)`;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" fill="${bgColor}" rx="20" />
  <text x="50" y="50" font-family="system-ui, sans-serif" font-size="40" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">
    ${initials}
  </text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
