import Taro from '@tarojs/taro';

export async function copyText(text: string): Promise<void> {
  await Taro.setClipboardData({ data: text });
}
