import styled from 'styled-components';

export const UsersList = styled.div`
  display: grid;
  gap: 12px;
`;

export const UserCardContent = styled.div`
  min-width: 0;
  display: grid;
  gap: 6px;

  strong,
  p {
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
`;

export const UserMeta = styled.p`
  margin: 0;
  color: var(--muted);
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

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

export const AdminActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;

  @media (max-width: 720px) {
    width: 100%;

    > * {
      flex: 1 1 100%;
      width: 100%;
    }
  }
`;

export const FormActions = styled.div`
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
