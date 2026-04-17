export interface RuntimeProfile {
  isCompatibilityMode: boolean;
}

function safeCssSupports(property: string, value: string): boolean {
  try {
    return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports(property, value);
  } catch {
    return false;
  }
}

export function getRuntimeProfile(): RuntimeProfile {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isSmartTvUa = /Tizen|SMART-TV|SmartTV|TV|NetCast|Web0S|WebOS|HbbTV/i.test(userAgent);

  const supportsModernColor = safeCssSupports('color', 'oklch(0.5 0.1 240)');
  const supportsHasSelector = safeCssSupports('selector(:has(*))', '');
  const supportsBackdropFilter =
    safeCssSupports('backdrop-filter', 'blur(2px)') || safeCssSupports('-webkit-backdrop-filter', 'blur(2px)');

  const isCompatibilityMode =
    isSmartTvUa || !supportsModernColor || !supportsHasSelector || !supportsBackdropFilter;

  return { isCompatibilityMode };
}
