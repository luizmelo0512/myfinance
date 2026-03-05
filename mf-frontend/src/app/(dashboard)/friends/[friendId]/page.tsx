import { FriendDetailScreen } from '@/src/screens/FriendScreen/FriendDetailScreen';

export default async function FriendDetailPage({
  params,
}: {
  params: Promise<{ friendId: string }>;
}) {
  const resolvedParams = await params;
  return <FriendDetailScreen friendId={resolvedParams.friendId} />;
}
