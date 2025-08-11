import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';

export interface XPEvent {
  userId: string;
  type: 'post_created' | 'comment_created' | 'like_received' | 'comment_liked' | 'daily_login';
  amount: number;
  metadata?: Record<string, unknown>;
}

// Configurația XP pentru fiecare activitate
export const XP_REWARDS = {
  post_created: 25,       // Crează un post
  comment_created: 10,    // Scrie un comentariu
  like_received: 5,       // Primește un like pe post
  comment_liked: 3,       // Primește un like pe comentariu
  daily_login: 2,         // Login zilnic
} as const;

// Calculul XP necesar pentru fiecare level
// Removed calculateXPForLevel as unused

// Calculul level-ului pe baza XP-ului total
export function calculateLevelFromXP(totalXP: number): number {
  return Math.floor(totalXP / 1000) + 1;
}

// Funcția principală pentru acordarea XP
export async function awardXP(event: XPEvent): Promise<{ 
  levelUp: boolean; 
  newLevel: number; 
  newXP: number; 
  xpGained: number 
} | null> {
  try {
    await connectToDatabase();
    
    const user = await User.findById(event.userId);
    if (!user) {
      console.error(`User not found: ${event.userId}`);
      return null;
    }

    const currentXP = user.experience || 0;
    const currentLevel = user.level || 1;
    const newXP = currentXP + event.amount;
    const newLevel = calculateLevelFromXP(newXP);
    
    const levelUp = newLevel > currentLevel;

    // Actualizează user-ul cu noul XP și level
    await User.findByIdAndUpdate(event.userId, {
      experience: newXP,
      level: newLevel
    });

    return {
      levelUp,
      newLevel,
      newXP,
      xpGained: event.amount
    };

  } catch (error) {
    console.error('Error awarding XP:', error);
    return null;
  }
}

// Funcții helper pentru activități specifice
export async function awardXPForPost(userId: string, postId: string) {
  return awardXP({
    userId,
    type: 'post_created',
    amount: XP_REWARDS.post_created,
    metadata: { postId }
  });
}

export async function awardXPForComment(userId: string, commentId: string, postId: string) {
  return awardXP({
    userId,
    type: 'comment_created',
    amount: XP_REWARDS.comment_created,
    metadata: { commentId, postId }
  });
}

export async function awardXPForLike(userId: string, targetType: 'post' | 'comment', targetId: string) {
  const amount = targetType === 'post' ? XP_REWARDS.like_received : XP_REWARDS.comment_liked;
  return awardXP({
    userId,
    type: targetType === 'post' ? 'like_received' : 'comment_liked',
    amount,
    metadata: { targetType, targetId }
  });
}

export async function awardXPForDailyLogin(userId: string) {
  // Verifică dacă user-ul a primit deja XP pentru login azi
  const user = await User.findById(userId);
  if (!user) return null;

  const today = new Date().toDateString();
  const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt).toDateString() : null;

  if (lastLogin !== today) {
    return awardXP({
      userId,
      type: 'daily_login',
      amount: XP_REWARDS.daily_login,
      metadata: { date: today }
    });
  }

  return null; // Deja a primit XP azi
}

// Funcție pentru a obține progresul către următorul level
// Removed getXPProgress as unused in the project
