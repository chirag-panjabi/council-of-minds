import { sessionRepository } from '../db/repositories/session';
import { messageRepository } from '../db/repositories/message';

export async function exportSessionAsJson(sessionId: string) {
  try {
    const session = await sessionRepository.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const messages = await messageRepository.getForSession(sessionId);

    const exportData = {
      session,
      messages,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    
    // Create a safe filename
    const safeTitle = session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `chat_export_${safeTitle}_${Date.now()}.json`;
    
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Failed to export session:', error);
    return false;
  }
}
