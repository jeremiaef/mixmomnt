'use client';

import { useLoggedInUsername } from '@/lib/auth';
import ChatDesignerToggle from '@/components/chat/ChatDesignerToggle';

interface ProfileAuthWrapperProps {
  username: string;
}

export default function ProfileAuthWrapper({ username }: ProfileAuthWrapperProps) {
  const loggedInUsername = useLoggedInUsername();
  const isOwnProfile = loggedInUsername === username;
  return <ChatDesignerToggle isOwnProfile={isOwnProfile} />;
}
