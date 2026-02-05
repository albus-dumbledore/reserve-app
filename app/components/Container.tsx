import type { ReactNode } from 'react';

export default function Container({
  children,
  size = 'md'
}: {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const width =
    size === 'sm'
      ? 'max-w-md'
      : size === 'lg'
      ? 'max-w-3xl'
      : 'max-w-xl';
  return (
    <main className={`mx-auto w-full ${width} px-6 py-10`}>{children}</main>
  );
}
