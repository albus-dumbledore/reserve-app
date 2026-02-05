'use client';

interface WeatherIconProps {
  condition: string;
  className?: string;
}

export default function WeatherIcon({ condition, className = '' }: WeatherIconProps) {
  const baseClass = 'text-[51px] leading-none';
  const iconClass = className ? `${baseClass} ${className}` : baseClass;

  // Rain/Drizzle - Cloud with rain
  if (condition.includes('Rain') || condition.includes('Drizzle')) {
    return <i className={`fi fi-rr-cloud-drizzle ${iconClass}`}></i>;
  }

  // Snow - Cloud with snow
  if (condition.includes('Snow')) {
    return <i className={`fi fi-rr-cloud-snow ${iconClass}`}></i>;
  }

  // Cloudy/Overcast/Haze - Cloud
  if (condition.includes('Cloud') || condition.includes('Overcast') || condition.includes('Haze')) {
    return <i className={`fi fi-rr-clouds ${iconClass}`}></i>;
  }

  // Clear/Sunny - Sun
  if (condition.includes('Clear') || condition.includes('Sun')) {
    return <i className={`fi fi-rr-sun ${iconClass}`}></i>;
  }

  // Default - Partly cloudy
  return <i className={`fi fi-rr-cloud-sun ${iconClass}`}></i>;
}
