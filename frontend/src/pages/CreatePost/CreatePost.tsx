import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import {
  PlusIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  LinkIcon,
  MapPinIcon,
  CalendarIcon,
  TagIcon,
  FaceSmileIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  TrophyIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface PostDraft {
  content: string;
  type: 'post' | 'job' | 'event' | 'poll' | 'skill' | 'achievement';
  media: {
    type: 'image' | 'video' | 'document';
    url: string;
    thumbnail?: string;
  }[];
  tags: string[];
  location?: string;
  eventDate?: string;
  pollOptions?: string[];
  skillName?: string;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  achievementTitle?: string;
  achievementDescription?: string;
  jobTitle?: string;
  jobDescription?: string;
  jobRequirements?: string[];
  jobLocation?: string;
  jobType?: 'full-time' | 'part-time' | 'contract' | 'freelance';
  jobSalary?: string;
}

const CreatePost: React.FC = () => {
  const { isConnected } = useAccount();
  const [draft, setDraft] = useState<PostDraft>({
    content: '',
    type: 'post',
    media: [],
    tags: [],
  });
  const [showPreview, setShowPreview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const postTypes = [
    { id: 'post', name: 'Post', icon: DocumentTextIcon, description: 'Share your thoughts and updates' },
    { id: 'job', name: 'Job', icon: CurrencyDollarIcon, description: 'Post a job opportunity' },
    { id: 'event', name: 'Event', icon: CalendarIcon, description: 'Create an event or meetup' },
    { id: 'poll', name: 'Poll', icon: UserGroupIcon, description: 'Ask a question to the community' },
    { id: 'skill', name: 'Skill', icon: SparklesIcon, description: 'Showcase your skills' },
    { id: 'achievement', name: 'Achievement', icon: TrophyIcon, description: 'Share your accomplishments' },
  ];

  const handleTypeChange = (type: string) => {
    setDraft({ ...draft, type: type as any });
  };

  const handleContentChange = (content: string) => {
    setDraft({ ...draft, content });
  };

  const handleTagAdd = (tag: string) => {
    if (tag && !draft.tags.includes(tag)) {
      setDraft({ ...draft, tags: [...draft.tags, tag] });
    }
  };

  const handleTagRemove = (tag: string) => {
    setDraft({ ...draft, tags: draft.tags.filter(t => t !== tag) });
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsPublishing(false);
    // Reset form or redirect
    setDraft({
      content: '',
      type: 'post',
      media: [],
      tags: [],
    });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <PlusIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Connect your wallet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please connect your wallet to create posts
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Post
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Share your thoughts, achievements, or opportunities with the community
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {/* Post Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  What would you like to share?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {postTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => handleTypeChange(type.id)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                          draft.type === type.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <Icon className="h-6 w-6 text-gray-600 dark:text-gray-400 mb-2" />
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {type.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {type.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content
                </label>
                <textarea
                  value={draft.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={6}
                />
              </div>

              {/* Dynamic Fields Based on Post Type */}
              {draft.type === 'job' && (
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={draft.jobTitle || ''}
                      onChange={(e) => setDraft({ ...draft, jobTitle: e.target.value })}
                      placeholder="e.g., Senior Solidity Developer"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Job Description
                    </label>
                    <textarea
                      value={draft.jobDescription || ''}
                      onChange={(e) => setDraft({ ...draft, jobDescription: e.target.value })}
                      placeholder="Describe the role and responsibilities..."
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={draft.jobLocation || ''}
                        onChange={(e) => setDraft({ ...draft, jobLocation: e.target.value })}
                        placeholder="e.g., Remote, San Francisco, CA"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Job Type
                      </label>
                      <select
                        value={draft.jobType || ''}
                        onChange={(e) => setDraft({ ...draft, jobType: e.target.value as any })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select job type</option>
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="contract">Contract</option>
                        <option value="freelance">Freelance</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {draft.type === 'event' && (
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Date
                    </label>
                    <input
                      type="datetime-local"
                      value={draft.eventDate || ''}
                      onChange={(e) => setDraft({ ...draft, eventDate: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={draft.location || ''}
                      onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                      placeholder="e.g., San Francisco, CA or Online"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {draft.type === 'poll' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Poll Options
                  </label>
                  <div className="space-y-2">
                    {(draft.pollOptions || []).map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(draft.pollOptions || [])];
                            newOptions[index] = e.target.value;
                            setDraft({ ...draft, pollOptions: newOptions });
                          }}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => {
                            const newOptions = (draft.pollOptions || []).filter((_, i) => i !== index);
                            setDraft({ ...draft, pollOptions: newOptions });
                          }}
                          className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newOptions = [...(draft.pollOptions || []), ''];
                        setDraft({ ...draft, pollOptions: newOptions });
                      }}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      + Add option
                    </button>
                  </div>
                </div>
              )}

              {/* Tags */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {draft.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/20 rounded-full"
                    >
                      #{tag}
                      <button
                        onClick={() => handleTagRemove(tag)}
                        className="ml-2 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add tags (press Enter to add)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const tag = e.currentTarget.value.trim();
                      if (tag) {
                        handleTagAdd(tag);
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Media Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Media
                </label>
                <div className="flex space-x-2">
                  <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
                    <PhotoIcon className="h-4 w-4 mr-2" />
                    Photo
                  </button>
                  <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
                    <VideoCameraIcon className="h-4 w-4 mr-2" />
                    Video
                  </button>
                  <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Document
                  </button>
                  <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Link
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <FaceSmileIcon className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <MapPinIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    {showPreview ? 'Hide Preview' : 'Preview'}
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={!draft.content.trim() || isPublishing}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                  >
                    {isPublishing ? 'Publishing...' : 'Publish'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Post Guidelines */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Post Guidelines
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start space-x-2">
                  <CheckIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Be respectful and professional</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Share valuable content and insights</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Use relevant tags for better reach</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Engage with comments and feedback</span>
                </li>
              </ul>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                💡 Tips for Better Engagement
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>• Ask questions to encourage discussion</li>
                <li>• Share personal experiences and insights</li>
                <li>• Use visuals to make your post stand out</li>
                <li>• Post at optimal times for your audience</li>
                <li>• Respond to comments promptly</li>
              </ul>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Preview
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      Y
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        You
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        now
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {draft.content || 'Your post content will appear here...'}
                  </div>
                  {draft.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {draft.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/20 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;