import React from 'react';

export const Card = ({ children, className }) => (
    <div className={`card ${className}`}>{children}</div>
);

export const CardContent = ({ children }) => <div>{children}</div>;
export const CardHeader = ({ children }) => <header>{children}</header>;
export const CardTitle = ({ children }) => <h2>{children}</h2>;
