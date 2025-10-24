import React from 'react';
import {
  StarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChartBarIcon,
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

interface SkillsMetricsProps {
  skills?: SkillMetric[];
  className?: string;
}

const SkillsMetrics: React.FC<SkillsMetricsProps> = ({ 
  skills = [], 
  className = '' 
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ChartBarIcon className="h-4 w-4 text-gray-500" />;
    }
  };

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
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Métricas por Skill
        </h3>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <ChartBarIcon className="h-5 w-5 mr-2" />
          Rendimiento actual
        </div>
      </div>

      <div className="space-y-6">
        {skillsData.map((skill, index) => (
          <div key={index} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 pb-6 last:pb-0">
            {/* Header con nombre del skill y rating */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {skill.name}
                </h4>
                <div className="flex items-center space-x-1">
                  <StarIcon className="h-5 w-5 text-yellow-400" />
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {skill.rating.toFixed(1)}
                  </span>
                </div>
              </div>
              
              {/* Cambio y tendencia */}
              <div className="flex items-center space-x-2">
                {getTrendIcon(skill.trend)}
                <span className={`text-sm font-medium ${getTrendColor(skill.trend)}`}>
                  +{skill.change.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Comparación con promedio */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>vs promedio:</span>
                <span className="font-medium">{skill.averageRating.toFixed(1)}</span>
              </div>
              
              {/* Barra de progreso visual */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(skill.rating / 5) * 100}%` 
                  }}
                />
              </div>
            </div>

            {/* Métricas en grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Contratos */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Contratos
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {skill.contracts}
                </div>
              </div>

              {/* Earnings */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CurrencyDollarIcon className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Earnings
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {skill.earnings.toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} GIG
                </div>
              </div>
            </div>

            {/* Indicador de rendimiento */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  skill.rating >= 4.5 ? 'bg-green-500' : 
                  skill.rating >= 4.0 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {skill.rating >= 4.5 ? 'Excelente' : 
                   skill.rating >= 4.0 ? 'Bueno' : 'Necesita mejora'}
                </span>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {skill.rating > skill.averageRating ? 
                  `${((skill.rating - skill.averageRating) / skill.averageRating * 100).toFixed(1)}% sobre el promedio` :
                  `${((skill.averageRating - skill.rating) / skill.averageRating * 100).toFixed(1)}% bajo el promedio`
                }
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen total */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {skillsData.reduce((sum, skill) => sum + skill.contracts, 0)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Contratos
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {(skillsData.reduce((sum, skill) => sum + skill.rating, 0) / skillsData.length).toFixed(1)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Rating Promedio
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {skillsData.reduce((sum, skill) => sum + skill.earnings, 0).toLocaleString('es-ES', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} GIG
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Earnings
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsMetrics;
