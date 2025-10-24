import React from 'react';
import {
  TrophyIcon,
  StarIcon,
  FireIcon,
  RocketLaunchIcon,
  SparklesIcon,
  HeartIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  StarIcon as CrownIcon,
  BoltIcon,
  AcademicCapIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import {
  TrophyIcon as TrophyIconSolid,
  StarIcon as StarIconSolid,
  FireIcon as FireIconSolid,
  StarIcon as CrownIconSolid,
  BoltIcon as BoltIconSolid
} from '@heroicons/react/24/solid';

interface PostBadgesProps {
  post: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    engagementRate?: number;
    isBoosted?: boolean;
    type: string;
    author: {
      reputation: number;
      level: string;
      verified: boolean;
    };
    tokensEarned?: number;
    clpEarned?: number;
  };
}

const PostBadges: React.FC<PostBadgesProps> = ({ post }) => {
  const badges: Array<{
    id: string;
    icon: React.ComponentType<any>;
    label: string;
    color: string;
    description: string;
  }> = [];

  // Badge por engagement alto
  if (post.engagementRate && post.engagementRate > 15) {
    badges.push({
      id: 'high-engagement',
      icon: FireIconSolid,
      label: 'Viral',
      color: 'from-red-500 to-orange-600',
      description: 'Alto engagement'
    });
  }

  // Badge por likes altos
  if (post.likes > 100) {
    badges.push({
      id: 'high-likes',
      icon: HeartIcon,
      label: 'Popular',
      color: 'from-pink-500 to-rose-600',
      description: `${post.likes} likes`
    });
  }

  // Badge por boost
  if (post.isBoosted) {
    badges.push({
      id: 'boosted',
      icon: RocketLaunchIcon,
      label: 'Boosted',
      color: 'from-purple-500 to-indigo-600',
      description: 'Publicación promocionada'
    });
  }

  // Badge por tipo de contenido
  if (post.type === 'achievement') {
    badges.push({
      id: 'achievement',
      icon: TrophyIconSolid,
      label: 'Logro',
      color: 'from-yellow-500 to-amber-600',
      description: 'Logro de la comunidad'
    });
  }

  // Badge por usuario verificado
  if (post.author.verified) {
    badges.push({
      id: 'verified',
      icon: StarIconSolid,
      label: 'Verificado',
      color: 'from-blue-500 to-cyan-600',
      description: 'Usuario verificado'
    });
  }

  // Badge por nivel de usuario
  if (post.author.level === 'Expert' || post.author.level === 'Senior') {
    badges.push({
      id: 'expert',
      icon: CrownIconSolid,
      label: 'Experto',
      color: 'from-indigo-500 to-purple-600',
      description: 'Usuario experto'
    });
  }

  // Badge por reputación alta
  if (post.author.reputation > 90) {
    badges.push({
      id: 'high-reputation',
      icon: AcademicCapIcon,
      label: 'Maestro',
      color: 'from-emerald-500 to-teal-600',
      description: 'Alta reputación'
    });
  }

  // Badge por tokens ganados
  if (post.tokensEarned && post.tokensEarned > 50) {
    badges.push({
      id: 'token-earner',
      icon: CurrencyDollarIcon,
      label: 'Earned',
      color: 'from-green-500 to-emerald-600',
      description: `${post.tokensEarned} tokens ganados`
    });
  }

  // Badge por interacciones múltiples
  const totalInteractions = post.likes + post.comments + post.shares;
  if (totalInteractions > 200) {
    badges.push({
      id: 'high-interactions',
      icon: BoltIconSolid,
      label: 'Interactivo',
      color: 'from-yellow-400 to-orange-500',
      description: 'Alta interacción'
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {badges.map((badge) => {
        const BadgeIcon = badge.icon;
        return (
          <div
            key={badge.id}
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${badge.color} shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 animate-pulse`}
            title={badge.description}
          >
            <BadgeIcon className="h-3 w-3 mr-1" />
            {badge.label}
          </div>
        );
      })}
    </div>
  );
};

export default PostBadges;
