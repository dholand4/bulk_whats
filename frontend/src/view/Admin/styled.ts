import styled from 'styled-components';

export const UsersList = styled.div`
  display: grid;
  gap: 12px;
`;

export const UserCard = styled.article`
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.48);
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
`;
