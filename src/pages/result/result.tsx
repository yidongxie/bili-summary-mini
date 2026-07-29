import { useEffect, useState, useCallback } from 'react';
import { View, Text, RichText, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { pollTaskProgress, getLibraryItem, saveLibrary, type SummaryResult, type LibraryItem } from '@/lib/api';
import { formatDuration, formatTimelineTime, copyText } from '@/lib';
import { useAuth } from '@/store';

type TabKey = 'summary' | 'subtitles' | 'notes';

export default function ResultPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { taskId, url, mode, libraryId } = router.params;

  const [phase, setPhase] = useState<'loading' | 'success' | 'error'>('loading');
  const [progress, setProgress] = useState('正在提交…');
  const [error, setError] = useState('');
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('summary');

  // Load result: either poll task or fetch library item
  const load = useCallback(async () => {
    if (libraryId) {
      try {
        const data = await getLibraryItem(libraryId);
        const item: LibraryItem = data.item;
        setResult({
          type: (item.bvid || '').startsWith('http') ? 'xiaoyuzhou' : 'bilibili',
          video: { title: item.title, author: item.author, duration: item.duration || 0, bvid: item.bvid || '', link: item.link || '', pic: item.pic || '' },
          summary: item.summary || '', transcript: item.transcript || '',
          subtitle_count: item.subtitle_count || 0, mode: item.mode || 'brief',
          suggested_tags: item.tags || [], transcript_source: 'whisper',
        });
        setSaved(true);
        setPhase('success');
      } catch (err: any) { setError(err.message || '加载失败'); setPhase('error'); }
      return;
    }
    if (!taskId) { setError('缺少任务 ID'); setPhase('error'); return; }
    const interval = setInterval(async () => {
      try {
        const r = await pollTaskProgress(taskId);
        if (r.status === 'done') {
          setResult(r);
          setPhase('success');
          clearInterval(interval);
        } else if (r.status === 'error') {
          setError(r.error || '处理失败');
          setPhase('error');
          clearInterval(interval);
        } else {
          setProgress(r.progress || '处理中…');
        }
      } catch { /* retry */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [taskId, libraryId]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!result || !user) { Taro.showToast({ title: '请先登录', icon: 'none' }); return; }
    try {
      await saveLibrary({
        video: result.video || { title: '', author: '', duration: 0, bvid: '', link: '' },
        summary: result.summary, transcript: result.transcript || '',
        subtitle_count: result.subtitle_count, mode: result.mode || 'brief',
        category: '待整理', tags: result.suggested_tags || [], notes: '',
      });
      setSaved(true);
      Taro.showToast({ title: '已保存', icon: 'success' });
    } catch (err: any) { Taro.showToast({ title: err.message || '保存失败', icon: 'none' }); }
  }

  if (phase === 'loading') return (
    <View className='page-container' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <View className='spinner' />
      <Text style={{ marginTop: 16, color: '#888', fontSize: 13 }}>{progress}</Text>
    </View>
  );

  if (phase === 'error') return (
    <View className='page-container' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Text style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>处理失败</Text>
      <Text style={{ color: '#888', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>{error}</Text>
      <View className='btn-primary' onClick={() => Taro.navigateBack()}>返回</View>
    </View>
  );

  const meta = result?.video;
  const subtitles = result?.subtitle_segments || [];
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'summary', label: '总结' },
    { key: 'subtitles', label: `字幕 (${subtitles.length})` },
    { key: 'notes', label: '笔记' },
  ];

  return (
    <View className='page-container'>
      {/* Header */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: 700 }}>{meta?.title || '视频总结'}</Text>
        {meta && <Text style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{meta.author} · {formatDuration(meta.duration)}</Text>}
      </View>

      {/* Save button */}
      <View style={{ marginBottom: 12 }}>
        <View className={saved ? 'btn-secondary' : 'btn-primary'} onClick={handleSave} style={{ opacity: saved ? 0.6 : 1 }}>
          {saved ? '✅ 已收藏' : '💾 保存到收藏库'}
        </View>
      </View>

      {/* Tabs */}
      <View style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {tabs.map(t => (
          <View key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ padding: '8px 16px', borderRadius: 99, fontSize: 13, fontWeight: activeTab === t.key ? 600 : 500, background: activeTab === t.key ? '#0a0a0a' : '#f6f7f9', color: activeTab === t.key ? '#fff' : '#5a5a5c' }}>
            {t.label}
          </View>
        ))}
      </View>

      {/* Tab content */}
      <ScrollView scrollY style={{ maxHeight: '60vh' }}>
        {activeTab === 'summary' && (
          <View className='glass-card' style={{ padding: 16 }}>
            <RichText nodes={summaryToNodes(result?.summary || '')} />
          </View>
        )}

        {activeTab === 'subtitles' && (
          <View>
            {subtitles.length ? subtitles.map((seg, i) => (
              <View key={i} style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid #f0f1f3' }}>
                <Text style={{ fontSize: 11, color: '#888', width: 60, flexShrink: 0, fontFamily: 'monospace' }}>[{formatTimelineTime(seg.from)}]</Text>
                <Text style={{ fontSize: 13, color: '#0a0a0a', lineHeight: 1.5, flex: 1 }}>{seg.content}</Text>
              </View>
            )) : (
              <View className='empty-state'>
                <Text className='empty-state__title'>暂无字幕</Text>
                <Text className='empty-state__desc'>该视频没有提取到字幕内容</Text>
              </View>
            )}
            {subtitles.length > 0 && (
              <View className='btn-secondary' style={{ marginTop: 12 }} onClick={() => { const srt = subtitles.map((s, i) => `${i+1}\n${formatTimelineTime(s.from)} --> ${formatTimelineTime(s.to || s.from+3)}\n${s.content}\n`).join('\n'); copyText(srt); Taro.showToast({ title: '字幕已复制', icon: 'success' }); }}>
                📋 复制全部字幕
              </View>
            )}
          </View>
        )}

        {activeTab === 'notes' && (
          <View>
            <View className='glass-card' style={{ padding: 16, marginBottom: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>结构化笔记</Text>
              <RichText nodes={summaryToNodes(result?.summary || '')} />
            </View>
            <View className='btn-secondary' onClick={() => { copyText(result?.summary || ''); Taro.showToast({ title: '已复制', icon: 'success' }); }}>
              📋 复制笔记
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/** Simple Markdown-to-rich-text converter (headings, bold, paragraphs, list items) */
function summaryToNodes(md: string): string {
  return (md || '')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:16px;font-weight:700;margin:16px 0 6px;color:#0a0a0a">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:18px;font-weight:700;margin:20px 0 8px;color:#0a0a0a;border-bottom:1px solid #e5e7eb;padding-bottom:6px">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:650">$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:#f6f7f9;padding:1px 5px;border-radius:3px;font-size:12px">$1</code>')
    .replace(/^- (.+)$/gm, '<li style="margin-left:16px;line-height:1.7">$1</li>')
    .replace(/\n{2,}/g, '<br/>')
    .replace(/\n/g, '<br/>');
}
