'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PortalRaiz() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('associado_token')
    if (token) {
      router.replace('/portal/dashboard')
    } else {
      router.replace('/portal/login')
    }
  }, [router])

  return null
}