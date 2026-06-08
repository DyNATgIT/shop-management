import React from 'react'

export function Card({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={`card ${className}`}>{children}</div>
}
export function Button({ children, className = '', variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  return <button {...props} className={`btn ${variant} ${className}`}>{children}</button>
}
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(props, ref) {
  return <input {...props} ref={ref} className={`input ${props.className || ''}`} />
})
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`input ${props.className || ''}`} />
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`input ${props.className || ''}`} />
}
export function Metric({ title, value, tone = 'blue' }: { title: string, value: string, tone?: string }) {
  return <Card className="metric"><div className={`dot ${tone}`}></div><div><p>{title}</p><h3>{value}</h3></div></Card>
}
