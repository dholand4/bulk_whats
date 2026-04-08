import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  :root {
    --bg: ${({ theme }) => theme.colors.bg};
    --bg-strong: ${({ theme }) => theme.colors.bgStrong};
    --surface: ${({ theme }) => theme.colors.surface};
    --surface-strong: ${({ theme }) => theme.colors.surfaceStrong};
    --surface-muted: ${({ theme }) => theme.colors.surfaceMuted};
    --text: ${({ theme }) => theme.colors.text};
    --muted: ${({ theme }) => theme.colors.muted};
    --primary: ${({ theme }) => theme.colors.primary};
    --primary-soft: ${({ theme }) => theme.colors.primarySoft};
    --accent: ${({ theme }) => theme.colors.accent};
    --accent-soft: ${({ theme }) => theme.colors.accentSoft};
    --border: ${({ theme }) => theme.colors.border};
    --danger: ${({ theme }) => theme.colors.danger};
    --warning: ${({ theme }) => theme.colors.warning};
    --shadow: ${({ theme }) => theme.shadow};
    --radius: ${({ theme }) => theme.radius};
  }

  * {
    box-sizing: border-box;
  }

  html, body, #root {
    min-height: 100%;
  }

  body {
    margin: 0;
    color: var(--text);
    font-family: 'Manrope', sans-serif;
    background:
      radial-gradient(circle at top left, rgba(217, 108, 63, 0.22), transparent 32%),
      radial-gradient(circle at top right, rgba(18, 53, 36, 0.18), transparent 26%),
      linear-gradient(180deg, var(--bg), var(--bg-strong));
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
    border-radius: 12px;
  }

  button {
    border: none;
    cursor: pointer;
    padding: 11px 14px;
    background: linear-gradient(135deg, var(--primary), var(--primary-soft));
    color: #fff;
    font-weight: 700;
    box-shadow: 0 10px 22px rgba(18, 53, 36, 0.15);
    transition: transform 0.18s ease, filter 0.18s ease;
  }

  button:hover {
    transform: translateY(-1px);
    filter: brightness(1.04);
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    transform: none;
    filter: none;
  }

  input,
  select,
  textarea {
    width: 100%;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.86);
    padding: 11px 13px;
    color: var(--text);
    font-size: 14px;
  }

  input:focus,
  select:focus,
  textarea:focus {
    outline: none;
    border-color: rgba(18, 53, 36, 0.45);
    box-shadow: 0 0 0 4px rgba(18, 53, 36, 0.08);
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  img {
    max-width: 100%;
    display: block;
  }
`;
