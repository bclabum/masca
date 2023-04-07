import React from 'react';

interface TitleProps {
  children: React.ReactNode;
}

const Title = ({ children }: TitleProps) => {
  return (
    <div className="text-h5 sm:text-h4 lg:text-h3 font-ubuntu bg-gradient-to-b from-pink-500 to-orange-500 bg-clip-text font-bold text-black text-opacity-0">
      {children}
    </div>
  );
};

export default Title;