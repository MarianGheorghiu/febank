import type { ButtonHTMLAttributes } from 'react';
import { X } from 'lucide-react';
export default function DialogCloseButton({className = '', ...props}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" aria-label="Close dialog" {...props} className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-white focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}><X size={15} aria-hidden/></button>;
}
