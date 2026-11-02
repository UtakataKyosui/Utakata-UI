export function withClassName(className: string, extraClassName?: string) {
  return [className, extraClassName].filter(Boolean).join(' ');
}
