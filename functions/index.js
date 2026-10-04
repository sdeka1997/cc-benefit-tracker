const { onCall } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const admin = require('firebase-admin')
const https = require('https')
const axios = require('axios')

admin.initializeApp()

const TELLER_CERT = defineSecret('TELLER_CERT')
const TELLER_KEY = defineSecret('TELLER_KEY')

exports.storeTellerEnrollment = onCall({ secrets: [TELLER_CERT, TELLER_KEY] }, async (request) => {
  if (!request.auth) throw new Error('Unauthenticated')
  const { accessToken, institutionName } = request.data
  if (!accessToken) throw new Error('Missing accessToken')

  await admin.firestore().collection('users').doc(request.auth.uid).set({
    teller: { accessToken, institutionName, connectedAt: Date.now() },
  }, { merge: true })

  return { success: true }
})

exports.getTellerTransactions = onCall({ secrets: [TELLER_CERT, TELLER_KEY] }, async (request) => {
  if (!request.auth) throw new Error('Unauthenticated')

  const userSnap = await admin.firestore().collection('users').doc(request.auth.uid).get()
  const teller = userSnap.data()?.teller
  if (!teller?.accessToken) throw new Error('No Teller account connected')

  const agent = new https.Agent({
    cert: TELLER_CERT.value(),
    key: TELLER_KEY.value(),
  })

  const accountsRes = await axios.get('https://api.teller.io/accounts', {
    httpsAgent: agent,
    auth: { username: teller.accessToken, password: '' },
  })

  const creditAccounts = accountsRes.data.filter(a => a.type === 'credit')
  if (creditAccounts.length === 0) return { transactions: [], accounts: [] }

  const selectedAccountIds = teller.selectedAccountIds || []
  const accountsToSync = selectedAccountIds.length > 0
    ? creditAccounts.filter(a => selectedAccountIds.includes(a.id))
    : creditAccounts

  const allTransactions = []
  for (const account of accountsToSync) {
    const txRes = await axios.get(`https://api.teller.io/accounts/${account.id}/transactions`, {
      httpsAgent: agent,
      auth: { username: teller.accessToken, password: '' },
    })
    for (const tx of txRes.data) {
      allTransactions.push({
        id: tx.id,
        date: tx.date,
        description: tx.description,
        amount: parseFloat(tx.amount),
        status: tx.status,
        type: tx.type || null,
        accountId: account.id,
        accountName: account.name,
        institutionName: account.institution.name,
      })
    }
  }

  allTransactions.sort((a, b) => b.date.localeCompare(a.date))

  return {
    transactions: allTransactions,
    accounts: creditAccounts.map(a => ({ id: a.id, name: a.name, last4: a.last_four })),
    selectedAccountIds,
  }
})

exports.selectTellerAccount = onCall(async (request) => {
  if (!request.auth) throw new Error('Unauthenticated')
  const { accountIds, accountNames } = request.data
  await admin.firestore().collection('users').doc(request.auth.uid).update({
    'teller.selectedAccountIds': accountIds,
    'teller.selectedAccountNames': accountNames,
  })
  return { success: true }
})

exports.disconnectTeller = onCall(async (request) => {
  if (!request.auth) throw new Error('Unauthenticated')
  await admin.firestore().collection('users').doc(request.auth.uid).update({
    teller: admin.firestore.FieldValue.delete(),
  })
  return { success: true }
})
