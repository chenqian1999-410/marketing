import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '机会发现 | Marketing Intelligence',
  description: '基于品牌知识、历史活动和竞品情报的营销机会发现原型。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
