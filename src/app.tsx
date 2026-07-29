import { PropsWithChildren } from 'react';
import { useLaunch } from '@tarojs/taro';
import { AuthProvider } from './store/auth';
import './styles/global.scss';
import './app.scss';

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    console.log('[BiliStudy Mini] App launched');
  });

  return <AuthProvider>{children}</AuthProvider>;
}

export default App;
