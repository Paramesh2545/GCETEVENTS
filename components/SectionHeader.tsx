import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  colorScheme?: 'light' | 'dark';
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, align = 'center', colorScheme = 'dark' }) => {
  const alignClass = align === 'left' ? 'text-left' : 'text-center';
  const mxAuto = align === 'center' ? 'mx-auto' : '';
  const titleColor = colorScheme === 'dark' ? 'text-white' : 'text-gray-900';
  const subtitleColor = colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className={`${alignClass} mb-12`}>
      <h2 className={`text-4xl md:text-5xl font-extrabold ${titleColor} tracking-tighter`}>{title}</h2>
      {subtitle && <p className={`mt-4 max-w-2xl ${mxAuto} text-lg ${subtitleColor}`}>{subtitle}</p>}
    </div>
  );
};

export default SectionHeader;