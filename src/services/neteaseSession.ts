interface NeteaseSessionLike {
  account?: {
    id?: number | string;
    userId?: number | string;
    nickname?: string;
    avatarUrl?: string;
  };
  profile?: {
    userId?: number | string;
    id?: number | string;
    nickname?: string;
    avatarUrl?: string;
  };
}

export function getNeteaseUserId(session: NeteaseSessionLike): string {
  const id =
    session.account?.id ||
    session.account?.userId ||
    session.profile?.userId ||
    session.profile?.id;

  return id ? String(id) : '';
}
