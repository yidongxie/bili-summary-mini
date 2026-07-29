import { useEffect, useState, useCallback } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getLibrary, deleteLibrary, type LibraryItem } from '@/lib/api';
import { relativeTime, formatDuration } from '@/lib';
import { useAuth } from '@/store';

export default function LibraryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (p = 1, q = '') => {
    if (!user) { setLoading(false); return; }
    try {
      const data = await getLibrary({ page: p, page_size: 20, q });
      if (p === 1) setItems(data.items || []);
      else setItems(prev => [...prev, ...(data.items || [])]);
      setHasMore((data.items || []).length >= 20);
    } catch {} finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(1); }, [load]);

  function onSearch() { setPage(1); setHasMore(true); load(1, search); }
  function loadMore() { if (hasMore && !loading) { const next = page + 1; setPage(next); load(next, search); } }

  if (!user) return (
    <View className='page-container'><View className='empty-state'><Text className='empty-state__title'>请先登录</Text><Text className='empty-state__desc'>微信一键登录后可查看收藏</Text></View></View>
  );

  return (
    <View className='page-container'>
      <Input className='glass-card' style={{ padding: 10, fontSize: 13, marginBottom: 12 }} value={search} onInput={e => setSearch(e.detail.value)} onConfirm={onSearch} placeholder='搜索收藏...'
        placeholderStyle='color:#a4a4a8' />

      {loading && items.length === 0 ? <View className='spinner' /> : items.length === 0 ? (
        <View className='empty-state'><Text className='empty-state__title'>暂无收藏</Text><Text className='empty-state__desc'>总结视频后保存到收藏库，随时复习</Text></View>
      ) : (
        <ScrollView scrollY onScrollToLower={loadMore} style={{ maxHeight: '75vh' }}>
          {items.map(item => (
            <View key={item.id} className='glass-card-subtle' style={{ padding: 12, marginBottom: 8 }}
              onClick={() => Taro.navigateTo({ url: `/pages/result/result?libraryId=${item.id}` })}>
              <Text style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0a' }} numberOfLines={2}>{item.title}</Text>
              <View style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#888' }}>{item.author}</Text>
                {item.duration ? <Text style={{ fontSize: 11, color: '#a4a4a8' }}>{formatDuration(item.duration)}</Text> : null}
                <Text style={{ fontSize: 11, color: '#a4a4a8', marginLeft: 'auto' }}>{relativeTime(item.created_at)}</Text>
              </View>
              {(item.tags || []).length > 0 && (
                <View style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                  {(item.tags || []).slice(0, 4).map(t => <Text key={t} className='tag-pill' style={{ fontSize: 10 }}>#{t}</Text>)}
                </View>
              )}
            </View>
          ))}
          {hasMore && <Text style={{ textAlign: 'center', color: '#888', fontSize: 12, padding: 16 }}>加载更多...</Text>}
        </ScrollView>
      )}
    </View>
  );
}
