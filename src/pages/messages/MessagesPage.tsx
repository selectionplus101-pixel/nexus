import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usersApi, messagesApi } from '../../services/api';
import { MessageCircle } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import toast from 'react-hot-toast';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        // Fetch all users to build conversation list
        const users = await usersApi.getAll({});

        // For each user, get unread count and build conversation data
        const conversationsData = await Promise.all(
          users.slice(0, 10).map(async (u: any) => {
            try {
              const messages = await messagesApi.getConversation(u.id);
              const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
              return {
                user: u,
                lastMessage,
                hasMessages: messages.length > 0
              };
            } catch (error) {
              return { user: u, lastMessage: null, hasMessages: false };
            }
          })
        );

        // Filter to only users with messages
        const withMessages = conversationsData.filter(c => c.hasMessages);
        setConversations(withMessages);
      } catch (error: any) {
        console.error('Error fetching conversations:', error);
        toast.error('Failed to load conversations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  if (!user) return null;

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
      {isLoading ? (
        <div className="h-full flex items-center justify-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="ml-4 text-gray-600">Loading conversations...</p>
        </div>
      ) : conversations.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {conversations.map((conv) => (
            <div
              key={conv.user.id}
              onClick={() => navigate(`/chat/${conv.user.id}`)}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Avatar
                  src={conv.user.avatarUrl}
                  alt={conv.user.name}
                  size="md"
                  status={conv.user.isOnline ? 'online' : 'offline'}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {conv.user.name}
                    </h3>
                    {conv.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {new Date(conv.lastMessage.timestamp || conv.lastMessage.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {conv.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center p-8">
          <div className="bg-gray-100 p-6 rounded-full mb-4">
            <MessageCircle size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-medium text-gray-900">No messages yet</h2>
          <p className="text-gray-600 text-center mt-2">
            Start connecting with entrepreneurs and investors to begin conversations
          </p>
        </div>
      )}
    </div>
  );
};