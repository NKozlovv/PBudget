// Theus theme provider — replaces the v1 sterling tokens for this file.
const ThemeContext = React.createContext({ mode: 'dark', t: THEUS.dark });
const useT = () => React.useContext(ThemeContext);
const ThemeProvider = ({ mode, children }) => {
  const t = THEUS[mode] || THEUS.dark;
  return <ThemeContext.Provider value={{ mode, t }}>{children}</ThemeContext.Provider>;
};
Object.assign(window, { ThemeContext, useT, ThemeProvider });
