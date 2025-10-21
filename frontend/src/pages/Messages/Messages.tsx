import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  FaceSmileIcon,
  PaperClipIcon,
  EllipsisHorizontalIcon,
  PhoneIcon,
  VideoCameraIcon,
  UserCircleIcon,
  CheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  sender: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  content: string;
  timestamp: string;
  isRead: boolean;
  type: 'text' | 'image' | 'file' | 'system';
}

interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
    isOnline: boolean;
    lastSeen: string;
  }[];
  lastMessage: {
    content: string;
    timestamp: string;
    sender: string;
  };
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
}

const Messages: React.FC = () => {
  const { isConnected } = useAccount();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const conversations: Conversation[] = [
    {
      id: '1',
      participants: [
        {
          id: '1',
          name: 'Sarah Kim',
          avatar: '/avatars/sarah.jpg',
          verified: true,
          isOnline: true,
          lastSeen: 'now',
        },
      ],
      lastMessage: {
        content: 'Thanks for the great feedback on my DeFi protocol!',
        timestamp: '2m ago',
        sender: 'Sarah Kim',
      },
      unreadCount: 2,
      isPinned: true,
      isMuted: false,
    },
    {
      id: '2',
      participants: [
        {
          id: '2',
          name: 'Mike Johnson',
          avatar: '/avatars/mike.jpg',
          verified: false,
          isOnline: false,
          lastSeen: '1h ago',
        },
      ],
      lastMessage: {
        content: 'Are you available for a quick call about the project?',
        timestamp: '1h ago',
        sender: 'Mike Johnson',
      },
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
    },
    {
      id: '3',
      participants: [
        {
          id: '3',
          name: 'Emily Chen',
          avatar: '/avatars/emily.jpg',
          verified: true,
          isOnline: true,
          lastSeen: '5m ago',
        },
      ],
      lastMessage: {
        content: 'The security audit report is ready for review',
        timestamp: '5m ago',
        sender: 'Emily Chen',
      },
      unreadCount: 1,
      isPinned: false,
      isMuted: false,
    },
  ];

  const messages: Message[] = [
    {
      id: '1',
      sender: {
        name: 'Sarah Kim',
        avatar: '/avatars/sarah.jpg',
        verified: true,
      },
      content: 'Hey! I saw your latest post about the DeFi protocol. Really impressive work!',
      timestamp: '10:30 AM',
      isRead: true,
      type: 'text',
    },
    {
      id: '2',
      sender: {
        name: 'You',
        avatar: '/avatars/you.jpg',
        verified: true,
      },
      content: 'Thank you! It took months of development and testing. The gas optimization was the trickiest part.',
      timestamp: '10:32 AM',
      isRead: true,
      type: 'text',
    },
    {
      id: '3',
      sender: {
        name: 'Sarah Kim',
        avatar: '/avatars/sarah.jpg',
        verified: true,
      },
      content: 'I can imagine! The gas fees on Ethereum can be brutal. Have you considered deploying on Polygon as well?',
      timestamp: '10:35 AM',
      isRead: true,
      type: 'text',
    },
    {
      id: '4',
      sender: {
        name: 'You',
        avatar: '/avatars/you.jpg',
        verified: true,
      },
      content: 'Actually, I\'m planning to deploy on Polygon next week. The testnet deployment went smoothly.',
      timestamp: '10:37 AM',
      isRead: true,
      type: 'text',
    },
    {
      id: '5',
      sender: {
        name: 'Sarah Kim',
        avatar: '/avatars/sarah.jpg',
        verified: true,
      },
      content: 'That\'s great! I\'d love to help with the testing if you need any assistance.',
      timestamp: '10:40 AM',
      isRead: false,
      type: 'text',
    },
  ];

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Connect your wallet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please connect your wallet to access messages
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex h-[600px]">
            {/* Conversations Sidebar */}
            <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Messages
                  </h1>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                      selectedConversation === conversation.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <img
                          src={conversation.participants[0].avatar}
                          alt={conversation.participants[0].name}
                          className="w-12 h-12 rounded-full"
                        />
                        {conversation.participants[0].isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {conversation.participants[0].name}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {conversation.lastMessage.timestamp}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {conversation.lastMessage.content}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <div className="flex items-center justify-between mt-2">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-500 rounded-full">
                              {conversation.unreadCount}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConv ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={selectedConv.participants[0].avatar}
                            alt={selectedConv.participants[0].name}
                            className="w-10 h-10 rounded-full"
                          />
                          {selectedConv.participants[0].isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {selectedConv.participants[0].name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {selectedConv.participants[0].isOnline ? 'Online' : `Last seen ${selectedConv.participants[0].lastSeen}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
                          <PhoneIcon className="h-5 w-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
                          <VideoCameraIcon className="h-5 w-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
                          <EllipsisHorizontalIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender.name === 'You' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex space-x-2 max-w-xs lg:max-w-md ${message.sender.name === 'You' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          <img
                            src={message.sender.avatar}
                            alt={message.sender.name}
                            className="w-8 h-8 rounded-full flex-shrink-0"
                          />
                          <div className={`px-4 py-2 rounded-lg ${
                            message.sender.name === 'You'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <div className={`flex items-center justify-end mt-1 space-x-1 ${
                              message.sender.name === 'You' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              <span className="text-xs">{message.timestamp}</span>
                              {message.sender.name === 'You' && (
                                <CheckIcon className="h-3 w-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
                        <PaperClipIcon className="h-5 w-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
                        <PhotoIcon className="h-5 w-5" />
                      </button>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
                        <FaceSmileIcon className="h-5 w-5" />
                      </button>
                      <button className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200">
                        <PaperAirplaneIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Choose a conversation from the sidebar to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;