import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { supabase } from '../lib/supabase'
import { useNotifications } from './useNotifications'
import {
  setAgreements,
  addAgreement,
  updateAgreement,
  setCurrentLease,
  setLoading,
  openBuilderModal,
  closeBuilderModal,
  openSignatureModal,
  closeSignatureModal
} from '../store/leaseSlice'
import { toast } from 'react-hot-toast'

export const useLease = () => {
  const dispatch = useDispatch()
  const { user, profile } = useSelector(s => s.auth)
  const {
    agreements,
    currentLease,
    loading,
    builderModalOpen,
    builderPrefillData,
    signatureModalOpen,
    signatureTargetLeaseId
  } = useSelector(s => s.lease)

  const { sendNotification } = useNotifications()

  // Fetch user lease agreements from Supabase with fallback to Redux initial agreements
  const fetchLeases = useCallback(async () => {
    if (!user?.id) return agreements
    dispatch(setLoading(true))
    try {
      const { data, error } = await supabase
        .from('lease_agreements')
        .select('*')
        .or(`landlord_id.eq.${user.id},tenant_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data && data.length > 0) {
        // Map Supabase snake_case columns to camelCase object structure
        const mappedData = data.map(item => ({
          id: item.id,
          propertyId: item.property_id,
          propertyTitle: item.property_title || 'Rental Property',
          propertyCity: item.property_city || 'City',
          propertyImage: item.property_image || '/1.webp',
          landlordId: item.landlord_id,
          landlordName: item.landlord_name || 'Landlord',
          landlordEmail: item.landlord_email || '',
          landlordPhone: item.landlord_phone || '',
          tenantId: item.tenant_id,
          tenantName: item.tenant_name || 'Tenant',
          tenantEmail: item.tenant_email || '',
          tenantPhone: item.tenant_phone || '',
          monthlyRent: item.monthly_rent,
          securityDeposit: item.security_deposit,
          leaseStartDate: item.lease_start_date,
          leaseEndDate: item.lease_end_date,
          noticePeriodDays: item.notice_period_days || 30,
          specialTerms: item.special_terms || [],
          status: item.status || 'draft',
          landlordSignature: item.landlord_signature || null,
          landlordSignedAt: item.landlord_signed_at || null,
          tenantSignature: item.tenant_signature || null,
          tenantSignedAt: item.tenant_signed_at || null,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        }))
        dispatch(setAgreements(mappedData))
        return mappedData
      }
    } catch (err) {
      console.warn('Supabase fetch leases notice (using Redux state):', err.message)
    } finally {
      dispatch(setLoading(false))
    }
    return agreements
  }, [user?.id, dispatch, agreements])

  // Fetch single lease by ID
  const fetchLeaseById = useCallback((id) => {
    const found = agreements.find(a => a.id === id)
    if (found) {
      dispatch(setCurrentLease(found))
      return found
    }
    return null
  }, [agreements, dispatch])

  // Create a new digital lease agreement
  const createLease = useCallback(async (formData) => {
    const isLandlord = profile?.role === 'landlord'
    const newAgreement = {
      id: `lease-${Date.now()}`,
      propertyId: formData.propertyId || '1',
      propertyTitle: formData.propertyTitle || 'Property Listing',
      propertyCity: formData.propertyCity || 'Dehradun',
      propertyImage: formData.propertyImage || '/1.webp',
      landlordId: formData.landlordId || (isLandlord ? user?.id : 'landlord-demo'),
      landlordName: formData.landlordName || (isLandlord ? profile?.full_name : 'Landlord'),
      landlordEmail: formData.landlordEmail || user?.email || '',
      landlordPhone: formData.landlordPhone || profile?.phone || '',
      tenantId: formData.tenantId || (!isLandlord ? user?.id : 'demo-user'),
      tenantName: formData.tenantName || (!isLandlord ? profile?.full_name : 'Tenant'),
      tenantEmail: formData.tenantEmail || (!isLandlord ? user?.email : 'tenant@example.com'),
      tenantPhone: formData.tenantPhone || (!isLandlord ? profile?.phone : ''),
      monthlyRent: Number(formData.monthlyRent) || 15000,
      securityDeposit: Number(formData.securityDeposit) || 30000,
      leaseStartDate: formData.leaseStartDate || new Date().toISOString().split('T')[0],
      leaseEndDate: formData.leaseEndDate || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
      noticePeriodDays: Number(formData.noticePeriodDays) || 30,
      specialTerms: formData.specialTerms || [],
      status: 'pending_signatures',
      landlordSignature: isLandlord ? formData.signature : null,
      landlordSignedAt: isLandlord ? new Date().toISOString() : null,
      tenantSignature: !isLandlord ? formData.signature : null,
      tenantSignedAt: !isLandlord ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Add to Redux store for instant UI response
    dispatch(addAgreement(newAgreement))
    dispatch(closeBuilderModal())
    toast.success('Digital Lease Agreement Drafted!')

    // Dispatch notification to recipient
    const recipientId = isLandlord ? newAgreement.tenantId : newAgreement.landlordId
    const recipientRole = isLandlord ? 'user' : 'landlord'
    
    sendNotification({
      recipientId,
      recipientRole,
      type: 'service_approval',
      title: 'New Digital Lease Agreement',
      message: `${profile?.full_name || 'Counterparty'} generated a Smart Lease for ${newAgreement.propertyTitle}. Action required: E-Sign now.`,
      actionUrl: `/agreements/${newAgreement.id}`,
      metadata: { leaseId: newAgreement.id }
    })

    // Try Supabase insert asynchronously
    if (user?.id) {
      try {
        await supabase.from('lease_agreements').insert([{
          id: newAgreement.id,
          property_id: newAgreement.propertyId,
          landlord_id: newAgreement.landlordId,
          tenant_id: newAgreement.tenantId,
          monthly_rent: newAgreement.monthlyRent,
          security_deposit: newAgreement.securityDeposit,
          lease_start_date: newAgreement.leaseStartDate,
          lease_end_date: newAgreement.leaseEndDate,
          notice_period_days: newAgreement.noticePeriodDays,
          special_terms: newAgreement.specialTerms,
          status: newAgreement.status,
          landlord_signature: newAgreement.landlordSignature,
          landlord_signed_at: newAgreement.landlordSignedAt,
          tenant_signature: newAgreement.tenantSignature,
          tenant_signed_at: newAgreement.tenantSignedAt
        }])
      } catch (err) {
        console.warn('Supabase lease insert notice (using local state fallback):', err.message)
      }
    }

    return newAgreement
  }, [dispatch, profile, user, sendNotification])

  // E-Sign a digital lease agreement
  const signLease = useCallback(async (leaseId, signatureData) => {
    const lease = agreements.find(a => a.id === leaseId)
    if (!lease) {
      toast.error('Lease agreement not found')
      return null
    }

    const isLandlord = user?.id ? lease.landlordId === user.id : (profile?.role === 'landlord')
    const nowIso = new Date().toISOString()

    const updates = isLandlord
      ? { landlordSignature: signatureData, landlordSignedAt: nowIso }
      : { tenantSignature: signatureData, tenantSignedAt: nowIso }

    // Check if both signatures are present
    const updatedLandlordSig = isLandlord ? signatureData : lease.landlordSignature
    const updatedTenantSig = !isLandlord ? signatureData : lease.tenantSignature
    
    let nextStatus = lease.status
    if (updatedLandlordSig && updatedTenantSig) {
      nextStatus = 'active'
    }
    updates.status = nextStatus

    // Update Redux state
    dispatch(updateAgreement({ id: leaseId, updates }))
    dispatch(closeSignatureModal())

    if (nextStatus === 'active') {
      toast.success('Lease Fully Executed & Active! 🎉')
    } else {
      toast.success('Signature Successfully Recorded!')
    }

    // Trigger notification to other party
    const recipientId = isLandlord ? lease.tenantId : lease.landlordId
    const recipientRole = isLandlord ? 'user' : 'landlord'
    
    sendNotification({
      recipientId,
      recipientRole,
      type: 'payment_confirmation',
      title: nextStatus === 'active' ? 'Lease Agreement Fully Executed' : 'Signature Received',
      message: nextStatus === 'active'
        ? `Both parties have digitally signed the lease for ${lease.propertyTitle}. The contract is now Active.`
        : `${profile?.full_name || 'Counterparty'} signed the lease agreement for ${lease.propertyTitle}.`,
      actionUrl: `/agreements/${lease.id}`,
      metadata: { leaseId: lease.id, status: nextStatus }
    })

    // Sync with Supabase asynchronously
    if (user?.id) {
      try {
        await supabase.from('lease_agreements').update({
          landlord_signature: updatedLandlordSig,
          landlord_signed_at: isLandlord ? nowIso : lease.landlordSignedAt,
          tenant_signature: updatedTenantSig,
          tenant_signed_at: !isLandlord ? nowIso : lease.tenantSignedAt,
          status: nextStatus
        }).eq('id', leaseId)
      } catch (err) {
        console.warn('Supabase sign lease sync notice:', err.message)
      }
    }

    return { ...lease, ...updates }
  }, [agreements, user, profile, dispatch, sendNotification])

  const openBuilder = useCallback((prefill = null) => dispatch(openBuilderModal(prefill)), [dispatch])
  const closeBuilder = useCallback(() => dispatch(closeBuilderModal()), [dispatch])
  const openSign = useCallback((leaseId) => dispatch(openSignatureModal(leaseId)), [dispatch])
  const closeSign = useCallback(() => dispatch(closeSignatureModal()), [dispatch])

  return {
    agreements,
    currentLease,
    loading,
    builderModalOpen,
    builderPrefillData,
    signatureModalOpen,
    signatureTargetLeaseId,
    fetchLeases,
    fetchLeaseById,
    createLease,
    signLease,
    openBuilder,
    closeBuilder,
    openSign,
    closeSign
  }
}
