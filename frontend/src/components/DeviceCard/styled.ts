import styled from 'styled-components';

export const DeviceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  gap: 18px;
`;

export const DeviceCardWrap = styled.article`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 24px;
  box-shadow: var(--shadow);
  display: grid;
  gap: 18px;

  @media (max-width: 720px) {
    padding: 18px;
  }
`;

export const DeviceHeader = styled.div`
  display: grid;
  gap: 10px;

  h3,
  p {
    margin: 0;
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
`;

export const DeviceMeta = styled.div`
  display: grid;
  gap: 8px;
  color: var(--muted);
  font-size: 14px;

  span {
    display: grid;
    gap: 2px;
    padding: 10px 12px;
    border-radius: 14px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.56);
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
`;

export const DeviceActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  @media (max-width: 720px) {
    > * {
      flex: 1 1 100%;
      width: 100%;
    }
  }
`;

export const AuthBox = styled.div`
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.48);

  @media (max-width: 720px) {
    padding: 14px;
  }
`;

export const QrImage = styled.img`
  width: min(100%, 280px);
  justify-self: center;
  border-radius: 18px;
  background: #fff;
  padding: 12px;
`;
