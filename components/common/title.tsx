import React from 'react'

interface TitleProps {
  children: React.ReactNode;
}

const Title = ({
  children,
}: TitleProps) => {
  return (
    <div className="container font-heading font-bold text-4xl w-1/2">{children}</div>
  );
};

export default Title