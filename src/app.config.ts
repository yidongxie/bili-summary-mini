/** Taro pages and window configuration */
export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/result/result',
    'pages/library/library',
    'pages/learning/learning',
    'pages/chat/chat',
    'pages/settings/settings',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: 'BiliStudy',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f6f7f9',
  },
  tabBar: {
    color: '#888888',
    selectedColor: '#0a0a0a',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      { pagePath: 'pages/index/index', text: '📺 首页' },
      { pagePath: 'pages/library/library', text: '📚 收藏' },
      { pagePath: 'pages/learning/learning', text: '🎓 学习' },
      { pagePath: 'pages/settings/settings', text: '⚙️ 设置' },
    ],
  },
});
