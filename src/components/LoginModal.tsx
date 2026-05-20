import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, Info, QrCode, User } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { neteaseAPI } from '../services/netease';
import { buildLibrarySources } from '../services/librarySources';
import { buildPlayableSongs, LIBRARY_PAGE_SIZE, loadLibrarySourcePage } from '../services/songLoader';
import { getNeteaseUserId } from '../services/neteaseSession';
import type { LibrarySource, NeteasePlaylistSummary, NeteaseTrack, Song } from '../types';

const TEXT = {
  subtitle: '\u4f60\u7684\u79c1\u4eba AI \u7535\u53f0',
  neteaseLogin: '\u767b\u5f55',
  userId: '\u7528\u6237ID',
  guest: '\u6e38\u5ba2',
  qrGenerating: '\u6b63\u5728\u751f\u6210\u4e8c\u7ef4\u7801...',
  qrFailed: '\u4e8c\u7ef4\u7801\u751f\u6210\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5',
  qrPrompt: '\u8bf7\u7528\u7f51\u6613\u4e91\u97f3\u4e50 App \u626b\u7801\u767b\u5f55',
  qrExpired: '\u4e8c\u7ef4\u7801\u5df2\u8fc7\u671f\uff0c\u8bf7\u624b\u52a8\u5237\u65b0',
  qrScanned: '\u5df2\u626b\u7801\uff0c\u8bf7\u5728\u624b\u673a\u4e0a\u786e\u8ba4',
  qrSuccess: '\u767b\u5f55\u6210\u529f\uff0c\u6b63\u5728\u52a0\u8f7d\u6b4c\u5355...',
  neteaseUser: '\u7f51\u6613\u4e91\u7528\u6237',
  refreshQr: '\u5237\u65b0\u4e8c\u7ef4\u7801',
  qrAlt: '\u7f51\u6613\u4e91\u767b\u5f55\u4e8c\u7ef4\u7801',
  qrPlaceholder: '\u751f\u6210\u4e2d...',
  hotMandarin: '\u70ed\u95e8\u534e\u8bed',
  classicMandarin: '\u7ecf\u5178\u534e\u8bed',
  popMusic: '\u6d41\u884c\u97f3\u4e50',
  guestRecommend: '\u6e38\u5ba2\u63a8\u8350',
  guestDescription: '\u672a\u767b\u5f55\u65f6\u7684\u53ef\u64ad\u653e\u63a8\u8350',
  noSongs: '\u6682\u65f6\u6ca1\u6709\u627e\u5230\u53ef\u64ad\u653e\u6b4c\u66f2\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002',
  loadSongsFailed: '\u52a0\u8f7d\u6b4c\u66f2\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5',
  enterUserId: '\u8bf7\u8f93\u5165\u7528\u6237ID',
  invalidUserId: '\u7528\u6237ID\u65e0\u6548',
  userIdPlaceholder: '\u8f93\u5165\u7f51\u6613\u4e91\u7528\u6237ID',
  howToFindId: '\u5982\u4f55\u627e\u5230\u81ea\u5df1\u7684\u7528\u6237ID',
  userIdStep1: '\u6253\u5f00\u7f51\u6613\u4e91\u97f3\u4e50\u7f51\u9875\u7248\u5e76\u767b\u5f55\u3002',
  userIdStep2: '\u8fdb\u5165\u4f60\u7684\u4e2a\u4eba\u4e3b\u9875\u3002',
  userIdStep3: '\u590d\u5236\u6d4f\u89c8\u5668\u5730\u5740\u680f\u91cc id= \u540e\u9762\u7684\u6570\u5b57\u3002',
  userIdStep4: '\u4f8b\u5982 https://music.163.com/#/user/home?id=123456\uff0c\u7528\u6237ID\u5c31\u662f 123456\u3002',
  enterRadio: '\u8fdb\u5165\u7535\u53f0',
  guestCopy: '\u4ee5\u6e38\u5ba2\u6a21\u5f0f\u8fdb\u5165\uff0c\u5c06\u81ea\u52a8\u52a0\u8f7d\u70ed\u95e8\u63a8\u8350\u6b4c\u66f2\u3002',
  guestAccess: '\u6e38\u5ba2\u8bbf\u95ee',
};

export default function LoginModal() {
  const {
    setUserLoggedIn,
    setHasSkippedLogin,
    setPlaylist,
    setCurrentSong,
    setPlaying,
    setLoading,
    setLibrarySources,
    setActiveLibrarySource,
    updateLibrarySource,
    setBrowseSongs,
  } = useStore();
  const [mode, setMode] = useState<'netease' | 'userid' | 'guest'>('netease');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [qrKey, setQrKey] = useState('');
  const [qrImg, setQrImg] = useState('');
  const [qrStatus, setQrStatus] = useState('');
  const [qrIsLoading, setQrIsLoading] = useState(false);
  const loadSessionRef = useRef(0);
  const qrRequestRef = useRef(0);
  const qrLoginSuccessRef = useRef<(uid: string) => Promise<void>>(async () => {});

  function startPlaylist(songs: Array<Song & { url: string }>) {
    setPlaylist(songs);
    if (songs.length > 0) {
      setCurrentSong(songs[0]);
      setPlaying(true);
    }
  }

  async function loadDefaultSongs() {
    setLoading(true);
    setError('');
    const sessionId = ++loadSessionRef.current;

    try {
      const searchTerms = [TEXT.hotMandarin, TEXT.classicMandarin, TEXT.popMusic];

      for (const term of searchTerms) {
        const searchResult = await neteaseAPI.search(term, 30);
        const tracks: NeteaseTrack[] = searchResult.result?.songs || [];
        const playableSongs = await buildPlayableSongs(tracks);

        if (loadSessionRef.current !== sessionId) return;
        if (playableSongs.length > 0) {
          setLibrarySources([{
            id: 'guest',
            kind: 'guest',
            name: TEXT.guestRecommend,
            description: TEXT.guestDescription,
            isLoaded: true,
            songCount: playableSongs.length,
          }], 'guest');
          startPlaylist(playableSongs);
          return;
        }
      }

      setError(TEXT.noSongs);
    } catch (err) {
      console.error('Failed to load songs:', err);
      setError(TEXT.loadSongsFailed);
    } finally {
      setLoading(false);
    }
  }

  async function loadLibrarySource(source: LibrarySource, uid: string, sessionId: number) {
    setActiveLibrarySource(source.id);
    updateLibrarySource(source.id, { isLoading: true });

    const page = await loadLibrarySourcePage(source, uid, 0, LIBRARY_PAGE_SIZE);
    const playableSongs = page.songs;
    if (loadSessionRef.current !== sessionId) return;

    updateLibrarySource(source.id, {
      isLoaded: true,
      isLoading: false,
      songCount: page.rawCount,
    });

    if (playableSongs.length > 0) {
      setBrowseSongs(source.id, playableSongs, page.hasMore, page.nextOffset);
      startPlaylist(playableSongs);
    }
  }

  async function loadUserPlaylists(uid: string, sessionId: number) {
    try {
      const playlistsResult = await neteaseAPI.getUserPlaylists(uid);
      const playlists: NeteasePlaylistSummary[] = playlistsResult.playlist || [];

      if (playlists.length === 0) {
        await loadDefaultSongs();
        return;
      }

      const sources = buildLibrarySources({ userId: uid, playlists });
      setLibrarySources(sources, sources[0]?.id || null);

      if (loadSessionRef.current !== sessionId) return;

      for (const source of sources.slice(0, 3)) {
        await loadLibrarySource(source, uid, sessionId);
        if (useStore.getState().player.playlist.length > 0) break;
      }

      if (useStore.getState().player.playlist.length === 0) {
        await loadDefaultSongs();
      }
    } catch (err) {
      console.error('Failed to load playlists:', err);
      await loadDefaultSongs();
    }
  }

  async function handleUserId() {
    setError('');
    const sessionId = ++loadSessionRef.current;

    if (!userId.trim()) {
      setError(TEXT.enterUserId);
      return;
    }

    setLoading(true);
    try {
      const detail = await neteaseAPI.getUserDetail(userId.trim());
      if (detail.code !== 200) {
        setError(TEXT.invalidUserId);
        return;
      }

      setUserLoggedIn(true, userId.trim(), {
        userId: parseInt(userId, 10),
        nickname: detail.profile?.nickname || '',
        avatarUrl: detail.profile?.avatarUrl,
      });

      await loadUserPlaylists(userId.trim(), sessionId);
    } catch {
      setError(TEXT.invalidUserId);
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    ++loadSessionRef.current;
    setHasSkippedLogin(true);
    await loadDefaultSongs();
  }

  const startQrLogin = useCallback(async () => {
    const requestId = ++qrRequestRef.current;
    setError('');
    setQrKey('');
    setQrImg('');
    setQrIsLoading(true);
    setQrStatus(TEXT.qrGenerating);

    try {
      const keyResult = await neteaseAPI.getQrKey();
      if (qrRequestRef.current !== requestId) return;

      const key = keyResult.data?.unikey;
      if (!key) {
        setError(TEXT.qrFailed);
        setQrStatus('');
        return;
      }

      const qrResult = await neteaseAPI.createQr(key);
      if (qrRequestRef.current !== requestId) return;

      setQrKey(key);
      setQrImg(qrResult.data?.qrimg || '');
      setQrStatus(TEXT.qrPrompt);
    } catch (err) {
      if (qrRequestRef.current !== requestId) return;
      console.error('Failed to create QR login:', err);
      setError(TEXT.qrFailed);
      setQrStatus('');
    } finally {
      if (qrRequestRef.current === requestId) {
        setQrIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    qrLoginSuccessRef.current = async (uid: string) => {
      if (uid) {
        await loadUserPlaylists(uid, ++loadSessionRef.current);
      } else {
        await loadDefaultSongs();
      }
    };
  });

  useEffect(() => {
    if (mode !== 'netease' || qrKey || qrImg || qrIsLoading) return;
    const timer = window.setTimeout(() => {
      void startQrLogin();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [mode, qrKey, qrImg, qrIsLoading, startQrLogin]);

  useEffect(() => {
    if (mode !== 'netease' || !qrKey) return;

    const timer = window.setInterval(async () => {
      try {
        const result = await neteaseAPI.checkQr(qrKey);
        if (result.code === 800) {
          setQrStatus(TEXT.qrExpired);
          return;
        }
        if (result.code === 802) {
          setQrStatus(TEXT.qrScanned);
          return;
        }
        if (result.code === 803) {
          window.clearInterval(timer);
          setQrStatus(TEXT.qrSuccess);

          const status = await neteaseAPI.getLoginStatus();
          const session = status.data || result;
          const account = session.account || session.profile || {};
          const uid = getNeteaseUserId(session);
          setUserLoggedIn(true, uid || undefined, {
            userId: Number(uid || 0),
            nickname: result.profile?.nickname || account.nickname || TEXT.neteaseUser,
            avatarUrl: result.profile?.avatarUrl || account.avatarUrl,
          });

          await qrLoginSuccessRef.current(uid);
        }
      } catch (err) {
        console.error('Failed to check QR login:', err);
      }
    }, 2000);

    return () => window.clearInterval(timer);
  }, [mode, qrKey, setUserLoggedIn]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary">
      <div className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full border-2 border-caramel/50">
            <img
              src="/kuna-avatar.png"
              alt="Kuna"
              className="h-full w-full object-cover"
              onError={(event) => {
                const target = event.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="w-full h-full bg-caramel/20 flex items-center justify-center text-caramel text-2xl">K</div>';
                }
              }}
            />
          </div>
          <h1 className="text-3xl font-light tracking-widest text-glow glow-text">KUNADIO</h1>
          <p className="mt-2 text-sm text-text-muted">{TEXT.subtitle}</p>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              setMode('netease');
              setError('');
              void startQrLogin();
            }}
            className={`rounded-lg py-3 text-sm transition-all ${
              mode === 'netease'
                ? 'border border-caramel/30 bg-caramel/20 text-glow'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <QrCode size={16} className="mr-1 inline" />
            {TEXT.neteaseLogin}
          </button>
          <button
            onClick={() => {
              setMode('userid');
              setError('');
            }}
            className={`rounded-lg py-3 text-sm transition-all ${
              mode === 'userid'
                ? 'border border-caramel/30 bg-caramel/20 text-glow'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <User size={16} className="mr-1 inline" />
            {TEXT.userId}
          </button>
          <button
            onClick={() => {
              setMode('guest');
              setError('');
            }}
            className={`rounded-lg py-3 text-sm transition-all ${
              mode === 'guest'
                ? 'border border-caramel/30 bg-caramel/20 text-glow'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Eye size={16} className="mr-1 inline" />
            {TEXT.guest}
          </button>
        </div>

        <div className="space-y-4">
          {mode === 'netease' && (
            <>
              <div className="flex flex-col items-center rounded-lg border border-border bg-bg-panel/70 p-5">
                {qrImg ? (
                  <img src={qrImg} alt={TEXT.qrAlt} className="h-44 w-44 rounded-md bg-white p-2" />
                ) : (
                  <div className="flex h-44 w-44 items-center justify-center rounded-md bg-bg-primary text-text-muted">
                    {TEXT.qrPlaceholder}
                  </div>
                )}
                <p className="mt-4 text-center text-sm text-text-secondary">{qrStatus}</p>
              </div>
              <button
                onClick={() => void startQrLogin()}
                className="w-full rounded-lg border border-border bg-bg-panel py-3 text-text-secondary transition-all hover:border-caramel/30 hover:text-glow"
              >
                {TEXT.refreshQr}
              </button>
            </>
          )}

          {mode === 'userid' && (
            <>
              <input
                type="text"
                placeholder={TEXT.userIdPlaceholder}
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                className="w-full rounded-lg border border-border bg-bg-panel px-4 py-3 text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-caramel"
              />

              <div className="rounded-lg border border-border bg-bg-panel/70 p-4 text-xs text-text-secondary">
                <div className="mb-2 flex items-center gap-2 text-caramel">
                  <Info size={14} />
                  <span>{TEXT.howToFindId}</span>
                </div>
                <ol className="list-decimal space-y-1 pl-4">
                  <li>{TEXT.userIdStep1}</li>
                  <li>{TEXT.userIdStep2}</li>
                  <li>{TEXT.userIdStep3}</li>
                  <li>{TEXT.userIdStep4}</li>
                </ol>
              </div>

              <button
                onClick={handleUserId}
                className="w-full rounded-lg border border-caramel/30 bg-caramel/20 py-3 text-glow transition-all hover:bg-caramel/30"
              >
                {TEXT.enterRadio}
              </button>
            </>
          )}

          {mode === 'guest' && (
            <>
              <p className="text-center text-sm text-text-secondary">
                {TEXT.guestCopy}
              </p>
              <button
                onClick={handleGuest}
                className="w-full rounded-lg border border-caramel/30 bg-caramel/20 py-3 text-glow transition-all hover:bg-caramel/30"
              >
                {TEXT.guestAccess}
              </button>
            </>
          )}

          {error && <p className="text-center text-sm text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
