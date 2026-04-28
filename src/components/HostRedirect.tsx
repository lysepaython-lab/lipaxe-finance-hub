import { useEffect } from 'react';

type HostRedirectProps = {
  to: string;
};

export const HostRedirect = ({ to }: HostRedirectProps) => {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return null;
};
