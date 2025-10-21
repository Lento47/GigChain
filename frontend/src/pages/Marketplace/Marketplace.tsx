import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  PlusIcon,
  StarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  TagIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  price: number;
  duration: string;
  provider: {
    name: string;
    avatar: string;
    rating: number;
    reviews: number;
    verified: boolean;
  };
  rating: number;
  reviews: number;
  completed: number;
  verified: boolean;
  createdAt: string;
}

const categories = [
  { id: 'all', name: 'All Categories', icon: TagIcon },
  { id: 'development', name: 'Development', icon: CheckCircleIcon },
  { id: 'design', name: 'Design', icon: StarIcon },
  { id: 'marketing', name: 'Marketing', icon: ExclamationTriangleIcon },
  { id: 'consulting', name: 'Consulting', icon: UserIcon },
  { id: 'writing', name: 'Writing', icon: ClockIcon },
  { id: 'translation', name: 'Translation', icon: CurrencyDollarIcon },
  { id: 'data', name: 'Data', icon: CheckCircleIcon },
  { id: 'other', name: 'Other', icon: TagIcon },
];

const skills = [
  'React', 'TypeScript', 'Solidity', 'Node.js', 'Python', 'AI/ML',
  'Blockchain', 'Web3', 'DeFi', 'NFT', 'Smart Contracts', 'Frontend',
  'Backend', 'Full Stack', 'Mobile', 'iOS', 'Android', 'Flutter',
  'UI/UX', 'Figma', 'Adobe', 'Photoshop', 'Illustrator', 'Sketch',
  'SEO', 'Content Marketing', 'Social Media', 'Growth Hacking',
  'Business Strategy', 'Financial Analysis', 'Project Management',
  'Agile', 'Scrum', 'DevOps', 'AWS', 'Docker', 'Kubernetes'
];

const Marketplace: React.FC = () => {
  const { isConnected } = useAccount();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockServices: Service[] = [
      {
        id: '1',
        title: 'Smart Contract Development',
        description: 'Expert Solidity development for DeFi protocols, NFTs, and DAOs. 5+ years experience with security best practices.',
        category: 'development',
        skills: ['Solidity', 'Web3', 'DeFi', 'Smart Contracts'],
        price: 5000,
        duration: '2-4 weeks',
        provider: {
          name: 'Alex Chen',
          avatar: '/avatars/alex.jpg',
          rating: 4.9,
          reviews: 127,
          verified: true,
        },
        rating: 4.9,
        reviews: 127,
        completed: 89,
        verified: true,
        createdAt: '2024-01-15',
      },
      {
        id: '2',
        title: 'UI/UX Design for Web3 App',
        description: 'Modern, user-friendly interface design for blockchain applications. Focus on user experience and accessibility.',
        category: 'design',
        skills: ['UI/UX', 'Figma', 'Web3', 'Mobile'],
        price: 3000,
        duration: '1-2 weeks',
        provider: {
          name: 'Sarah Kim',
          avatar: '/avatars/sarah.jpg',
          rating: 4.8,
          reviews: 95,
          verified: true,
        },
        rating: 4.8,
        reviews: 95,
        completed: 67,
        verified: true,
        createdAt: '2024-01-14',
      },
      {
        id: '3',
        title: 'DeFi Protocol Audit',
        description: 'Comprehensive security audit for DeFi smart contracts. Detailed report with recommendations and fixes.',
        category: 'development',
        skills: ['Solidity', 'Security', 'DeFi', 'Audit'],
        price: 8000,
        duration: '3-5 weeks',
        provider: {
          name: 'Blockchain Security Pro',
          avatar: '/avatars/security.jpg',
          rating: 5.0,
          reviews: 203,
          verified: true,
        },
        rating: 5.0,
        reviews: 203,
        completed: 156,
        verified: true,
        createdAt: '2024-01-13',
      },
      {
        id: '4',
        title: 'NFT Collection Design',
        description: 'Creative NFT artwork and collection design. 10,000 unique pieces with rarity system.',
        category: 'design',
        skills: ['NFT', 'Art', 'Photoshop', 'Illustrator'],
        price: 12000,
        duration: '4-6 weeks',
        provider: {
          name: 'Digital Artist',
          avatar: '/avatars/artist.jpg',
          rating: 4.7,
          reviews: 78,
          verified: true,
        },
        rating: 4.7,
        reviews: 78,
        completed: 45,
        verified: true,
        createdAt: '2024-01-12',
      },
      {
        id: '5',
        title: 'Web3 Marketing Strategy',
        description: 'Complete marketing strategy for Web3 project launch. Community building, social media, and growth hacking.',
        category: 'marketing',
        skills: ['Marketing', 'Web3', 'Community', 'Growth'],
        price: 4000,
        duration: '2-3 weeks',
        provider: {
          name: 'Crypto Marketing Expert',
          avatar: '/avatars/marketing.jpg',
          rating: 4.6,
          reviews: 112,
          verified: true,
        },
        rating: 4.6,
        reviews: 112,
        completed: 89,
        verified: true,
        createdAt: '2024-01-11',
      },
    ];
    
    setServices(mockServices);
    setFilteredServices(mockServices);
  }, []);

  // Filter services based on search, category, skills, and price
  useEffect(() => {
    let filtered = services;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    // Filter by skills
    if (selectedSkills.length > 0) {
      filtered = filtered.filter(service =>
        selectedSkills.some(skill =>
          service.skills.some(serviceSkill =>
            serviceSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(service =>
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.skills.some(skill =>
          skill.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Filter by price range
    filtered = filtered.filter(service =>
      service.price >= priceRange[0] && service.price <= priceRange[1]
    );

    // Sort services
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

    setFilteredServices(filtered);
  }, [services, selectedCategory, selectedSkills, searchQuery, sortBy, priceRange]);

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedSkills([]);
    setSearchQuery('');
    setPriceRange([0, 10000]);
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Professional Services Marketplace
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Find and hire top professionals for your Web3 and blockchain projects
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search services, skills, or professionals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="lg:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>

            {/* Create Service Button */}
            {isConnected && (
              <button className="flex items-center px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-200">
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Service
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categories
                  </label>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <label key={category.id} className="flex items-center">
                        <input
                          type="radio"
                          name="category"
                          value={category.id}
                          checked={selectedCategory === category.id}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {category.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Skills
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {skills.map((skill) => (
                      <label key={skill} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedSkills.includes(skill)}
                          onChange={() => handleSkillToggle(skill)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {skill}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price Range (CLP)
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="20000"
                      step="100"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredServices.length} services found
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200 overflow-hidden"
            >
              {/* Service Image/Header */}
              <div className="h-48 bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <TagIcon className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-medium">{service.category}</p>
                </div>
              </div>

              {/* Service Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {service.title}
                  </h3>
                  {service.verified && (
                    <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 ml-2" />
                  )}
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                  {service.description}
                </p>

                {/* Skills */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {service.skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {service.skills.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                      +{service.skills.length - 3} more
                    </span>
                  )}
                </div>

                {/* Provider Info */}
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {service.provider.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {service.provider.name}
                    </p>
                    <div className="flex items-center">
                      <StarIconSolid className="h-4 w-4 text-yellow-400" />
                      <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
                        {service.rating} ({service.reviews})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price and Duration */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${service.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {service.duration}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {service.completed} completed
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <button className="w-full bg-gradient-to-r from-primary-500 to-accent-500 text-white py-2 px-4 rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-200 font-medium">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No services found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Try adjusting your search criteria or filters
            </p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;