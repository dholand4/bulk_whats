import styled from 'styled-components';

export const DeviceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
`;

export const DeviceMeta = styled.div`
  display: grid;
  gap: 8px;
  color: var(--muted);
  font-size: 14px;
`;

export const AuthBox = styled.div`
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.48);
`;

export const QrImage = styled.img`
  width: min(100%, 280px);
  justify-self: center;
  border-radius: 18px;
  background: #fff;
  padding: 12px;
`;
