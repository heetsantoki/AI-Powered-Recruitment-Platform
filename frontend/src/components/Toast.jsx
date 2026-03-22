import { useState, useCallback } from 'react'

let toastId = 0
const listeners = []

export function useToast() {
  const show = useCallback((message, type = 'success') => {
    listeners.forEach(fn => fn({ id: ++toastId, message, type }))
  }, [])
  return { show }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  if (typeof window !== 'undefined' && listeners.length === 0) {
    listeners.push((toast) => {
      setToasts(prev => [...prev, toast])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, 3000)
    })
  }

  const icons = { success: '✓', error: '✕', info: 'ℹ' }

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{icons[t.type] || '•'}</span>
          {t.message}
        </div>
      ))}
    </div>
  )
}
