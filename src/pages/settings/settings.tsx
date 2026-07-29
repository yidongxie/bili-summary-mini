import { useEffect, useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getConfig, saveConfig, testDeepSeekConfig, type AppConfig } from '@/lib/api';
import { useAuth } from '@/store';

export default function SettingsPage() {
  const { user, login, logout } = useAuth();
  const [config, setConfig] = useState<AppConfig>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) getConfig().then(d => setConfig(d.config || {})).catch(() => {});
  }, [user]);

  async function handleSave(key: string, value: string) {
    if (!user) { Taro.showToast({ title: '请先登录', icon: 'none' }); return; }
    setSaving(true);
    try {
      await saveConfig({ [key]: value });
      Taro.showToast({ title: '已保存', icon: 'success' });
    } catch (err: any) { Taro.showToast({ title: err.message || '保存失败', icon: 'none' }); }
    finally { setSaving(false); }
  }

  async function handleTestDeepSeek() {
    if (!config.api_key) { Taro.showToast({ title: '请先填写 API Key', icon: 'none' }); return; }
    try {
      await testDeepSeekConfig({ api_key: config.api_key, base_url: config.deepseek_base_url, model: config.deepseek_model });
      Taro.showToast({ title: '连接成功', icon: 'success' });
    } catch (err: any) { Taro.showToast({ title: err.message || '连接失败', icon: 'none' }); }
  }

  return (
    <View className='page-container'>
      {user ? (
        <View>
          <Text style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'block' }}>⚙️ 设置</Text>

          {/* DeepSeek API Key */}
          <View className='glass-card' style={{ padding: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>DeepSeek API Key</Text>
            <Input className='glass-card-subtle' style={{ padding: 10, fontSize: 13, marginBottom: 8 }} value={config.api_key || ''}
              onInput={e => setConfig({ ...config, api_key: e.detail.value })} placeholder='sk-...' placeholderStyle='color:#a4a4a8' />
            <View style={{ display: 'flex', gap: 8 }}>
              <View className='btn-primary' style={{ flex: 1, fontSize: 13 }} onClick={() => handleSave('api_key', config.api_key || '')}>💾 保存</View>
              <View className='btn-secondary' style={{ flex: 1, fontSize: 13 }} onClick={handleTestDeepSeek}>🔗 测试连接</View>
            </View>
            {config.api_key_set && <Text style={{ fontSize: 11, color: '#00b48a', marginTop: 4 }}>✅ 已配置</Text>}
          </View>

          {/* Model */}
          <View className='glass-card' style={{ padding: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>模型 & 端点</Text>
            <Text style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>DeepSeek Base URL</Text>
            <Input className='glass-card-subtle' style={{ padding: 10, fontSize: 13, marginBottom: 8 }} value={config.deepseek_base_url || 'https://api.deepseek.com/v1'}
              onInput={e => setConfig({ ...config, deepseek_base_url: e.detail.value })} />
            <Text style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Model</Text>
            <Input className='glass-card-subtle' style={{ padding: 10, fontSize: 13, marginBottom: 8 }} value={config.deepseek_model || 'deepseek-chat'}
              onInput={e => setConfig({ ...config, deepseek_model: e.detail.value })} />
            <View className='btn-secondary' style={{ fontSize: 13 }} onClick={() => { handleSave('deepseek_base_url', config.deepseek_base_url || ''); handleSave('deepseek_model', config.deepseek_model || ''); }}>
              💾 保存端点配置
            </View>
          </View>

          {/* Account */}
          <View className='glass-card' style={{ padding: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>账户</Text>
            <Text style={{ fontSize: 12, color: '#5a5a5c' }}>当前用户：{user.display_name || user.email}</Text>
            <View className='btn-secondary' style={{ marginTop: 12, color: '#d45656', borderColor: 'rgba(212,86,86,0.3)' }} onClick={logout}>退出登录</View>
          </View>
        </View>
      ) : (
        <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <Text style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>🔑 微信一键登录</Text>
          <Text style={{ fontSize: 13, color: '#888', marginBottom: 24, textAlign: 'center' }}>使用微信账号登录，安全便捷</Text>
          <View className='btn-primary' onClick={login}>微信授权登录</View>
        </View>
      )}
    </View>
  );
}
