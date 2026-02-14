'use client';

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    glass?: boolean;
}

export const Card = ({ className, children, glass = false, ...props }: CardProps) => {
    return (
        <div
            className={cn(
                'rounded-3xl shadow-sm border border-stone-100 overflow-hidden transition-all duration-300',
                glass ? 'bg-white/70 backdrop-blur-xl border-white/50' : 'bg-white',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export const CardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('px-6 py-4 border-b border-stone-50', className)} {...props}>
        {children}
    </div>
);

export const CardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('p-6', className)} {...props}>
        {children}
    </div>
);

export const CardFooter = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('px-6 py-4 bg-stone-50/50', className)} {...props}>
        {children}
    </div>
);
