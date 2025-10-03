// Contract Templates
export const CONTRACT_TEMPLATES = [
  {
    id: 'freelancer-web',
    name: 'Desarrollo Web Freelancer',
    description: 'Template para proyectos de desarrollo web',
    category: 'development',
    icon: '💻',
    fields: {
      projectType: 'web-development',
      skills: ['React', 'Node.js', 'MongoDB'],
      duration: '2-4 weeks',
      budget: '$2000-5000'
    }
  },
  {
    id: 'design-creative',
    name: 'Diseño Creativo',
    description: 'Template para proyectos de diseño gráfico',
    category: 'design',
    icon: '🎨',
    fields: {
      projectType: 'graphic-design',
      skills: ['Photoshop', 'Illustrator', 'Figma'],
      duration: '1-2 weeks',
      budget: '$500-2000'
    }
  },
  {
    id: 'marketing-digital',
    name: 'Marketing Digital',
    description: 'Template para campañas de marketing',
    category: 'marketing',
    icon: '📈',
    fields: {
      projectType: 'digital-marketing',
      skills: ['SEO', 'Social Media', 'Analytics'],
      duration: '1-3 months',
      budget: '$1000-5000'
    }
  }
];

export const CONTRACT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const CONTRACT_TYPES = {
  FREELANCER: 'freelancer',
  CLIENT: 'client'
};
