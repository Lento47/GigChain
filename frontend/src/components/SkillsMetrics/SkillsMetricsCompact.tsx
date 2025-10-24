import React from 'react';
import {
  StarIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/solid';

interface SkillMetric {
  name: string;
  rating: number;
  change: number;
  averageRating: number;
  contracts: number;
  earnings: number;
  trend: 'up' | 'down' | 'neutral';
}

interface SkillsMetricsCompactProps {
  skills?: SkillMetric[];
  className?: string;
  maxSkills?: number;
}

const SkillsMetricsCompact: React.FC<SkillsMetricsCompactProps> = ({ 
  skills = [], 
  className = '',
  maxSkills = 4
}) => {
  // Datos de ejemplo si no se proporcionan
  const defaultSkills: SkillMetric[] = [
    {
      name: 'Solidity',
      rating: 4.9,
      change: 0.3,
      averageRating: 4.2,
      contracts: 25,
      earnings: 8500.00,
      trend: 'up'
    },
    {
      name: 'Web3 Development',
      rating: 4.8,
      change: 0.2,
      averageRating: 4.1,
      contracts: 18,
      earnings: 5200.00,
      trend: 'up'
    },
    {
      name: 'Smart Contract Audit',
      rating: 5.0,
      change: 0.1,
      averageRating: 4.5,
      contracts: 12,
      earnings: 4800.00,
      trend: 'up'
    },
    {
      name: 'DeFi',
      rating: 4.7,
      change: 0.4,
      averageRating: 4.0,
      contracts: 10,
      earnings: 3900.00,
      trend: 'up'
    }
  ];

  const skillsData = skills.length > 0 ? skills : defaultSkills;
  const displaySkills = skillsData.slice(0, maxSkills);

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Top Skills
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {skillsData.length} total
        </div>
      </div>

      <div className="space-y-3">
        {displaySkills.map((skill, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {/* Skill name and rating */}
            <div className="flex items-center space-x-3 flex-1">
              <div className="flex items-center space-x-1">
                <StarIcon className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {skill.rating.toFixed(1)}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {skill.name}
              </span>
            </div>

            {/* Change indicator */}
            <div className="flex items-center space-x-1">
              <ArrowTrendingUpIcon className="h-3 w-3 text-green-500" />
              <span className={`text-xs font-medium ${getTrendColor(skill.trend)}`}>
                +{skill.change.toFixed(1)}
              </span>
            </div>

            {/* Metrics */}
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <DocumentTextIcon className="h-3 w-3" />
                <span>{skill.contracts}</span>
              </div>
              <div className="flex items-center space-x-1">
                <CurrencyDollarIcon className="h-3 w-3" />
                <span>{skill.earnings.toLocaleString('es-ES', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            Promedio: {(skillsData.reduce((sum, skill) => sum + skill.rating, 0) / skillsData.length).toFixed(1)}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            {skillsData.reduce((sum, skill) => sum + skill.contracts, 0)} contratos
          </span>
        </div>
      </div>
    </div>
  );
};

export default SkillsMetricsCompact;
