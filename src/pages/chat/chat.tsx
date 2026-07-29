import { useState } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { chatApi, getLibraryItem, type SummaryResult, type SubtitleSegment } from '@/lib/api';
import { useAuth } from '@/store';

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [summary, setSummary] = useState('');
  const [transcript, setTranscript] = useState('');
  const [segments, setSegments] = useState<SubtitleSegment[]>([]);

  async function send(question?: string) {
    const q = (question ?? input).trim();
    if (!q || streaming || !user) return;
    setMessages(m => [...m, { role: 'user', content: q }]);
    setInput('');
    setStreaming(true);
    try {
      const data = await chatApi({ question: q, summary, transcript, segments });
      setMessages(m => [...m, { role: 'ai', content: data.answer }]);
    } catch (err: any) {
      setMessages(m => [...m, { role: 'ai', content: '抱歉，AI 暂时不可用：' + (err.message || '未知错误') }]);
    } finally { setStreaming(false); }
  }

  return (
    <View className='page-container'>
      {!user ? (
        <View className='empty-state'><Text className='empty-state__title'>请先登录</Text><Text className='empty-state__desc'>登录后使用 AI 对话功能</Text></View>
      ) : (
        <View style={{ display: 'flex', flexDirection: 'column', height: '80vh' }}>
          <ScrollView scrollY style={{ flex: 1, marginBottom: 8 }}>
            {messages.length === 0 ? (
              <View className='empty-state'>
                <Text className='empty-state__title'>💬 AI 对话</Text>
                <Text className='empty-state__desc'>从收藏页进入某个视频的总结后可在此对话</Text>
              </View>
            ) : messages.map((m, i) => (
              <View key={i} style={{ marginBottom: 8, textAlign: m.role === 'user' ? 'right' : 'left' }}>
                <View style={{ display: 'inline-block', maxWidth: '80%', padding: 10, borderRadius: 12, fontSize: 13, background: m.role === 'user' ? '#0a0a0a' : '#f6f7f9', color: m.role === 'user' ? '#fff' : '#0a0a0a' }}>
                  <Text>{m.content}</Text>
                </View>
              </View>
            ))}
            {streaming && <Text style={{ color: '#888', fontSize: 12, textAlign: 'center' }}>AI 思考中...</Text>}
          </ScrollView>
          <View className='glass-card' style={{ display: 'flex', gap: 8, padding: 8, flexDirection: 'row', alignItems: 'center' }}>
            <Input style={{ flex: 1, fontSize: 13, padding: '6px 0' }} value={input} onInput={e => setInput(e.detail.value)} onConfirm={() => send()} placeholder='输入问题...' placeholderStyle='color:#a4a4a8' />
            <View className='btn-primary' style={{ padding: '6px 16px', fontSize: 13 }} onClick={() => send()}>发送</View>
          </View>
        </View>
      )}
    </View>
  );
}
