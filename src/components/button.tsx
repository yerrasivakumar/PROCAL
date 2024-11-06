import React from 'react';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ onClick, children, variant = "default" }) => {
  const variantStyles: { [key: string]: string } = {
    default: "bg-blue-500 text-white",
    outline: "border border-blue-500 text-blue-500",
    destructive: "bg-red-500 text-white",
    secondary: "bg-gray-500 text-white",
  };

  return (
 <>
    <Button
      onClick={onClick}
     
    >
      {children}
    </Button></>
  );
};
