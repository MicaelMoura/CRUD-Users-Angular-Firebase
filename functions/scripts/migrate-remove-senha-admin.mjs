import { randomBytes } from 'node:crypto';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const options = new Map(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.split('=');
    return [key, value.join('=') || true];
  }),
);
const projectId = options.get('--project');
const applyChanges = options.has('--apply');
const confirmedProject = options.get('--confirm-project');

if (typeof projectId !== 'string' || !projectId) {
  throw new Error('Informe --project=<id-do-projeto>.');
}
if (applyChanges && confirmedProject !== projectId) {
  throw new Error('Para executar, informe também --confirm-project=<mesmo-id>.');
}

initializeApp({ credential: applicationDefault(), projectId });
const firestore = getFirestore();
const auth = getAuth();
const companiesSnapshot = await firestore.collection('business').get();
const affectedCompanies = companiesSnapshot.docs.filter((document) =>
  Object.prototype.hasOwnProperty.call(document.data(), 'senhaAdmin'),
);

let authAccountsFound = 0;
let authAccountsMissing = 0;
let invalidatedPasswords = 0;
let membershipsScanned = 0;
let membershipsNormalized = 0;

for (const company of companiesSnapshot.docs) {
  const companyData = company.data();
  const emailAdmin = companyData['emailAdmin'];
  const hasStoredPassword = Object.prototype.hasOwnProperty.call(companyData, 'senhaAdmin');
  let adminUser = null;

  const memberships = await company.ref.collection('users').get();
  for (const membership of memberships.docs) {
    membershipsScanned += 1;
    const membershipData = membership.data();
    const normalizedRole = normalizeRole(membershipData['acesso'])
      ?? normalizeRole(membershipData['perfilId'])
      ?? (sameEmail(membershipData['email'], emailAdmin) ? 'administrador' : 'visitante');
    if (membershipData['acesso'] !== normalizedRole) {
      membershipsNormalized += 1;
      if (applyChanges) {
        await membership.ref.set({ acesso: normalizedRole }, { merge: true });
      }
    }
  }

  if (typeof emailAdmin === 'string' && emailAdmin.includes('@')) {
    try {
      adminUser = await auth.getUserByEmail(emailAdmin);
      authAccountsFound += 1;
    } catch (error) {
      if (error?.code !== 'auth/user-not-found') {
        throw error;
      }
      authAccountsMissing += 1;
    }
  } else {
    authAccountsMissing += 1;
  }

  if (applyChanges && adminUser) {
    await company.ref.collection('users').doc(adminUser.uid).set({
      id: adminUser.uid,
      nome: companyData['nomeFantasia'] ?? 'Administrador',
      email: adminUser.email ?? emailAdmin,
      acesso: 'administrador',
      perfilId: 'administrador',
    }, { merge: true });
  }

  if (!applyChanges || !hasStoredPassword) {
    continue;
  }

  if (adminUser) {
    const invalidPassword = randomBytes(48).toString('base64url');
    await auth.updateUser(adminUser.uid, { password: invalidPassword });
    await auth.revokeRefreshTokens(adminUser.uid);
    invalidatedPasswords += 1;
  }

  await company.ref.update({ senhaAdmin: FieldValue.delete() });
}

console.log(JSON.stringify({
  mode: applyChanges ? 'apply' : 'dry-run',
  projectId,
  companiesScanned: companiesSnapshot.size,
  companiesWithStoredPassword: affectedCompanies.length,
  authAccountsFound,
  authAccountsMissing,
  invalidatedPasswords,
  membershipsScanned,
  membershipsNormalized,
  nextAction: applyChanges
    ? 'Administradores afetados devem usar a recuperação de senha.'
    : 'Revise os totais e execute novamente com --apply e --confirm-project.',
}, null, 2));

function normalizeRole(value) {
  return value === 'visitante' || value === 'usuario' || value === 'administrador'
    ? value
    : null;
}

function sameEmail(first, second) {
  return typeof first === 'string'
    && typeof second === 'string'
    && first.trim().toLowerCase() === second.trim().toLowerCase();
}
