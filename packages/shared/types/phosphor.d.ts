import type type React from 'react';

// Declare the JSX namespace to extend the IntrinsicElements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'ph-house': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        size?: string;
        weight?: 'regular' | 'fill' | 'bold' | 'duotone' | 'thin' | 'light';
      };
      'ph-chats-circle': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        size?: string;
        weight?: 'regular' | 'fill' | 'bold' | 'duotone' | 'thin' | 'light';
      };
      'ph-info': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        size?: string;
        weight?: 'regular' | 'fill' | 'bold' | 'duotone' | 'thin' | 'light';
      };
      'ph-calendar-check': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        size?: string;
        weight?: 'regular' | 'fill' | 'bold' | 'duotone' | 'thin' | 'light';
      };
      'ph-users-three': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        size?: string;
        weight?: 'regular' | 'fill' | 'bold' | 'duotone' | 'thin' | 'light';
      };
      'ph-hand': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        size?: string;
        weight?: 'regular' | 'fill' | 'bold' | 'duotone' | 'thin' | 'light';
      };
      'ph-text-indent': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        size?: string;
        weight?: 'regular' | 'fill' | 'bold' | 'duotone' | 'thin' | 'light';
      };
    }
  }
}