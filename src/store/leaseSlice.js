import { createSlice } from '@reduxjs/toolkit'

const initialAgreements = [
  {
    id: 'lease-101',
    propertyId: '1',
    propertyTitle: '2BHK Luxury Flat, Rajpur Road',
    propertyCity: 'Dehradun',
    propertyImage: '/1.webp',
    landlordId: 'landlord-demo',
    landlordName: 'Rajesh Sharma',
    landlordEmail: 'rajesh.sharma@example.com',
    landlordPhone: '+91 98765 43210',
    tenantId: 'demo-user',
    tenantName: 'Ankit Mehta',
    tenantEmail: 'ankit.m@example.com',
    tenantPhone: '+91 91234 56789',
    monthlyRent: 18000,
    securityDeposit: 36000,
    leaseStartDate: '2026-08-01',
    leaseEndDate: '2027-07-31',
    noticePeriodDays: 30,
    specialTerms: [
      'Rent is due on or before the 5th of every calendar month.',
      'No structural modifications or painting without written landlord consent.',
      'Tenant responsible for electricity and water utility bills.'
    ],
    status: 'pending_signatures', // 'draft' | 'pending_signatures' | 'active' | 'terminated' | 'expired'
    landlordSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50"><text x="10" y="35" font-family="cursive" font-size="24" fill="%231E293B">Rajesh Sharma</text></svg>',
    landlordSignedAt: '2026-07-20T10:30:00.000Z',
    tenantSignature: null,
    tenantSignedAt: null,
    createdAt: '2026-07-20T10:00:00.000Z',
    updatedAt: '2026-07-20T10:30:00.000Z'
  },
  {
    id: 'lease-102',
    propertyId: '2',
    propertyTitle: 'Modern Studio Apartment, Clock Tower',
    propertyCity: 'Dehradun',
    propertyImage: '/2.webp',
    landlordId: 'landlord-demo-2',
    landlordName: 'Priya Verma',
    landlordEmail: 'priya.v@example.com',
    landlordPhone: '+91 99887 76655',
    tenantId: 'demo-user',
    tenantName: 'Ankit Mehta',
    tenantEmail: 'ankit.m@example.com',
    tenantPhone: '+91 91234 56789',
    monthlyRent: 12000,
    securityDeposit: 24000,
    leaseStartDate: '2026-05-01',
    leaseEndDate: '2027-04-30',
    noticePeriodDays: 30,
    specialTerms: [
      'Quiet hours observed between 10:00 PM and 7:00 AM.',
      'Pets allowed with prior approval.'
    ],
    status: 'active',
    landlordSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50"><text x="10" y="35" font-family="cursive" font-size="24" fill="%231E293B">Priya Verma</text></svg>',
    landlordSignedAt: '2026-04-25T14:20:00.000Z',
    tenantSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50"><text x="10" y="35" font-family="cursive" font-size="24" fill="%23CA3433">Ankit Mehta</text></svg>',
    tenantSignedAt: '2026-04-26T09:15:00.000Z',
    createdAt: '2026-04-25T12:00:00.000Z',
    updatedAt: '2026-04-26T09:15:00.000Z'
  }
]

const leaseSlice = createSlice({
  name: 'lease',
  initialState: {
    agreements: initialAgreements,
    currentLease: null,
    loading: false,
    builderModalOpen: false,
    builderPrefillData: null,
    signatureModalOpen: false,
    signatureTargetLeaseId: null
  },
  reducers: {
    setAgreements: (state, action) => {
      state.agreements = action.payload
    },
    addAgreement: (state, action) => {
      const newLease = {
        id: `lease-${Date.now()}`,
        status: 'pending_signatures',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        specialTerms: [],
        ...action.payload
      }
      state.agreements.unshift(newLease)
      state.currentLease = newLease
    },
    updateAgreement: (state, action) => {
      const { id, updates } = action.payload
      const index = state.agreements.findIndex(a => a.id === id)
      if (index !== -1) {
        state.agreements[index] = {
          ...state.agreements[index],
          ...updates,
          updatedAt: new Date().toISOString()
        }
        if (state.currentLease?.id === id) {
          state.currentLease = state.agreements[index]
        }
      }
    },
    setCurrentLease: (state, action) => {
      state.currentLease = action.payload
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    openBuilderModal: (state, action) => {
      state.builderModalOpen = true
      state.builderPrefillData = action.payload || null
    },
    closeBuilderModal: (state) => {
      state.builderModalOpen = false
      state.builderPrefillData = null
    },
    openSignatureModal: (state, action) => {
      state.signatureModalOpen = true
      state.signatureTargetLeaseId = action.payload
    },
    closeSignatureModal: (state) => {
      state.signatureModalOpen = false
      state.signatureTargetLeaseId = null
    }
  }
})

export const {
  setAgreements,
  addAgreement,
  updateAgreement,
  setCurrentLease,
  setLoading,
  openBuilderModal,
  closeBuilderModal,
  openSignatureModal,
  closeSignatureModal
} = leaseSlice.actions

export default leaseSlice.reducer
