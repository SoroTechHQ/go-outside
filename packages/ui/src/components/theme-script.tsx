export function ThemeScript() {
  const script = `
    (() => {
      const key = 'gooutside-theme';
      const stored = window.localStorage.getItem(key);
      let theme;
      theme = (stored === 'dark' || stored === 'light') ? stored : 'light';
      document.documentElement.dataset.theme = theme;
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} suppressHydrationWarning />;
}
