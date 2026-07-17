import { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

export const useRazorpay = () => {
  const [isProcessing, setIsProcessing] = useState(false)

  // Dynamically inject the external Razorpay script safely into the document body
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const processPayment = async (orderId, propertyTitle, amount) => {
    setIsProcessing(true)
    
    try {
      const isScriptLoaded = await loadRazorpayScript()
      if (!isScriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Check your internet connection.')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Your user session has expired. Please log in again.')
      }

      return new Promise((resolve, reject) => {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Loaded from frontend environment configurations
          amount: amount * 100, // Razorpay parses amounts strictly in subunits (e.g., Paise)
          currency: 'INR',
          name: 'Premium Placement Service',
          description: `Premium Upgrade for "${propertyTitle}"`,
          order_id: orderId,
          handler: async function (response) {
            const verificationToastId = toast.loading('Verifying secure transaction...')
            try {
              const { data: { session } } = await supabase.auth.getSession()
              
              // Forward authentication tokens alongside the payload to the Edge Function
              const verifyResponse = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-listing-payment`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                  },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  }),
                }
              )

              const verifyData = await verifyResponse.json()
              if (!verifyResponse.ok) throw new Error(verifyData.error || 'Signature check failed')

              toast.success('Listing promoted to premium successfully!', { id: verificationToastId })
              
              // Force window reload to refresh state values instantly across layouts
              window.location.reload()
              resolve(verifyData)
            } catch (err) {
              console.error('Payment Verification error:', err)
              toast.error(err.message || 'Payment verification failed', { id: verificationToastId })
              reject(err)
            }
          },
          prefill: {
            email: user.email,
          },
          theme: {
            color: '#CA3433', // Coordinated application theme branding accent
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false)
              toast.error('Payment wizard cancelled by user.')
            }
          }
        }

        const razorpayInstance = new window.Razorpay(options)
        razorpayInstance.open()
      })

    } catch (error) {
      console.error('Payment Initialization Error:', error)
      toast.error(error.message || 'Could not launch payment gateway')
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    processPayment,
    isProcessing,
  }
}
