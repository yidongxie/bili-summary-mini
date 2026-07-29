import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getPaths, createPathApi, type LearningPath } from '@/lib/api';
import { useAuth } from '@/store';

export default function LearningPage() {
  const { user } = useAuth();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getPaths().then(data => setPaths(data.paths || [])).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  async function createPath() {
    if (!user) { Taro.showToast({ title: '请先登录', icon: 'none' }); return; }
    Taro.showModal({ title: '新建学习路径', editable: true, placeholderText: '路径标题' }).then(async res => {
      if (!res.confirm || !res.content) return;
      try {
        await createPathApi({ title: res.content, description: '' });
        const data = await getPaths();
        setPaths(data.paths || []);
        Taro.showToast({ title: '已创建', icon: 'success' });
      } catch (err: any) { Taro.showToast({ title: err.message || '创建失败', icon: 'none' }); }
    });
  }

  if (!user) return (
    <View className='page-container'><View className='empty-state'><Text className='empty-state__title'>请先登录</Text><Text className='empty-state__desc'>微信登录后可管理学习路径</Text></View></View>
  );

  return (
    <View className='page-container'>
      <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: 700 }}>📚 学习路径</Text>
        <View className='btn-primary' style={{ padding: '8px 16px', fontSize: 13 }} onClick={createPath}>新建路径</View>
      </View>

      {loading ? <View className='spinner' /> : paths.length === 0 ? (
        <View className='empty-state'><Text className='empty-state__title'>暂无学习路径</Text><Text className='empty-state__desc'>创建学习路径，系统化地组织你的收藏内容</Text></View>
      ) : (
        <ScrollView scrollY style={{ maxHeight: '70vh' }}>
          {paths.map(p => (
            <View key={p.id} className='glass-card-subtle' style={{ padding: 14, marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0a' }}>{p.title}</Text>
              {p.description ? <Text style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{p.description}</Text> : null}
              <View style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <Text style={{ fontSize: 12, color: '#5a5a5c' }}>📦 {p.total || 0} 条收藏</Text>
                <Text style={{ fontSize: 12, color: '#5a5a5c' }}>✅ {p.completed || 0} 已完成</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
