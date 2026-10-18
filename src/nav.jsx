import { createContext, forwardRef, useContext } from 'react';

export const NavContext = createContext(() => {});

export const Link = forwardRef(function Link({ to, children, ...rest }, ref) {
  const navigate = useContext(NavContext);
  return (
    <a
      ref={ref}
      href={to}
      onClick={e => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
});
