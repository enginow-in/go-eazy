import { useState } from 'react'
import { supabase } from '../lib/supabase'

export const useRazorpay = () => {
  const [isProcessing, setIsProcessing] = useState(false)

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const processPayment = async (orderId, propertyTitle, amount = 500) => {
    setIsProcessing(true)
    const scriptLoaded = await loadRazorpayScript()

    if (!scriptLoaded) {
      alert('Razorpay SDK failed to load. Please check your internet connection.')
      setIsProcessing(false)
      return
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || '', // Public client-side key
      amount: amount * 100, // Dynamic amount converted to paise
      currency: 'INR',
      name: 'Go Eazy',
      description: `Premium Upgrade: ${propertyTitle}`,
      order_id: orderId,
      handler: async function (response) {
        alert('Payment authorized successfully! Processing activation...')
        window.location.reload()
      },
      prefill: {
        name: 'Landlord User',
      },
      theme: {
        color: '#CA3433', // Matches your brand styling color accent
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
    setIsProcessing(false)
  }

  return { processPayment, isProcessing }
}
