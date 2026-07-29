import { useState, useEffect } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAuth } from '@/store';
import { getLibrary, createSummarizeTask, type LibraryItem, type SummarizePayload } from '@/lib/api';
import { relativeTime } from '@/lib';

type SummaryMode = 'brief' | 'detailed' | 'timeline' | 'knowledge';
const MODES: { value: SummaryMode; label: string }[] = [
  { value: 'brief', label: '简洁' },
  { value: 'detailed', label: '详细' },
  { value: 'timeline', label: '时间线' },
  { value: 'knowledge', label: '卡片' },
];
const QUICK_TAGS = [
  { label: '🏄 热门', url: 'https://www.bilibili.com/video/BV1Pr4y1z7Yi' },
  { label: '📚 学术', url: 'https://www.bilibili.com/video/BV1uv411q7Mv' },
];

export default function HomePage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SummaryMode>('brief');
  const [recent, setRecent] = useState<LibraryItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    getLibrary({}).then(d => setRecent((d.items || []).slice(0, 4))).catch(() => {});
  }, [user]);

  async function handleSubmit() {
    const url = query.trim();
    if (!url) { Taro.showToast({ title: '请输入链接', icon: 'none' }); return; }
    if (!user) { Taro.showToast({ title: '请先登录', icon: 'none' }); return; }
    setSubmitting(true);
    try {
      const created = await createSummarizeTask({ url, mode } as SummarizePayload);
      if (!created.success || !created.task_id) throw new Error(created.error || '提交失败');
      Taro.navigateTo({ url: `/pages/result/result?taskId=${created.task_id}&url=${encodeURIComponent(url)}&mode=${mode}` });
    } catch (err: any) {
      Taro.showToast({ title: err.message || '提交失败', icon: 'none' });
    } finally { setSubmitting(false); }
  }

  return (
    <View className='page-container'>
      <View className='page-header'>
        <Text className='page-title'>📺 视频 AI 总结</Text>
        <Text className='page-subtitle'>粘贴链接，一键生成结构化学习笔记</Text>
      </View>

      {/* URL Input */}
      <View className='glass-card' style={{ padding: 12, marginBottom: 12 }}>
        <Input
          className='input-main'
          value={query}
          onInput={e => setQuery(e.detail.value)}
          onConfirm={handleSubmit}
          placeholder='粘贴 B 站视频或小宇宙播客链接'
          placeholderStyle='color: var(--muted)'
          style={{ fontSize: 14, color: '#0a0a0a', padding: '8px 0' }}
        />
        <View style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {QUICK_TAGS.map(t => (
            <View key={t.label} className='tag-pill' onClick={() => setQuery(t.url)}>{t.label}</View>
          ))}
        </View>
      </View>

      {/* Mode picker */}
      <View className='section-label'>模式</View>
      <View style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {MODES.map(m => (
          <View
            key={m.value}
            onClick={() => setMode(m.value)}
            style={{
              padding: '6px 14px', borderRadius: 99,
              fontSize: 13, fontWeight: m.value === mode ? 700 : 500,
              background: m.value === mode ? '#0a0a0a' : '#f6f7f9',
              color: m.value === mode ? '#fff' : '#5a5a5c',
            }}
          >{m.label}</View>
        ))}
      </View>

      {/* Submit button */}
      <View className='btn-primary' onClick={handleSubmit} style={{ opacity: submitting ? 0.6 : 1 }}>
        {submitting ? '提交中...' : '⚡ 一键总结'}
      </View>

      {/* Recent */}
      {recent.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <View className='section-label'>最近总结</View>
          <ScrollView scrollY style={{ maxHeight: 400 }}>
            {recent.map(item => (
              <View
                key={item.id}
                className='glass-card-subtle'
                style={{ padding: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}
                onClick={() => Taro.navigateTo({ url: `/pages/result/result?libraryId=${item.id}` })}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, background: '#e91e8c', flexShrink: 0 }} />
                <Text style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#0a0a0a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</Text>
                <Text className='tag-pill' style={{ flexShrink: 0 }}>{item.category || 'B站'}</Text>
                <Text style={{ fontSize: 11, color: '#888', flexShrink: 0 }}>{relativeTime(item.created_at)}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
