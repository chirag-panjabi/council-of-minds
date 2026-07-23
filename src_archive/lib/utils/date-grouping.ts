export type DateGroup = 'Today' | 'Yesterday' | 'Previous 7 Days' | 'Older';

export function getSessionDateGroup(timestamp: number): DateGroup {
  const now = new Date();
  const date = new Date(timestamp);

  // Reset time part to reliably compare days
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = Math.abs(today.getTime() - itemDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays <= 7) {
    return 'Previous 7 Days';
  } else {
    return 'Older';
  }
}
