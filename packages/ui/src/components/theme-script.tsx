export function ThemeScript() {
  const script = `
    (() => {
      const key = 'gooutside-theme';
      const stored = window.localStorage.getItem(key);
      const theme = stored === 'light' ? 'light' : 'dark';
      document.documentElement.dataset.theme = theme;
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} suppressHydrationWarning />;
}
