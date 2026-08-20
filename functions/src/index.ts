import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { setGlobalOptions } from 'firebase-functions/v2';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

initializeApp();
setGlobalOptions({ region: 'southamerica-east1', maxInstances: 10 });

const SYSTEM_TENANT_ID = 'tecmhaicky';

interface EmpresaProvisionamento {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email: string;
  cidade: string;
  bairro: string;
  cep: string;
  complemento: string;
  emailAdmin: string;
  senhaAdmin: string;
}

export const provisionarEmpresa = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação obrigatória.');
  }

  const firestore = getFirestore();
  const systemMembership = await firestore
    .doc(`business/${SYSTEM_TENANT_ID}/users/${request.auth.uid}`)
    .get();
  if (systemMembership.data()?.['acesso'] !== 'administrador') {
    throw new HttpsError('permission-denied', 'Acesso administrativo obrigatório.');
  }

  const input = parseProvisioningInput(request.data);
  const auth = getAuth();
  let createdUserUid: string | null = null;

  try {
    const user = await auth.createUser({
      email: input.emailAdmin,
      password: input.senhaAdmin,
      displayName: input.nomeFantasia,
      emailVerified: false,
    });
    createdUserUid = user.uid;

    const companyId = firestore.collection('business').doc().id.toLowerCase();
    const companyReference = firestore.collection('business').doc(companyId);
    const batch = firestore.batch();
    const { senhaAdmin: _transientPassword, ...companyData } = input;

    batch.set(companyReference, {
      ...companyData,
      firebaseId: companyReference.id,
    });
    batch.set(companyReference.collection('users').doc(user.uid), {
      id: user.uid,
      nome: input.nomeFantasia,
      email: input.emailAdmin,
      acesso: 'administrador',
      perfilId: 'administrador',
    });
    await batch.commit();

    return { empresaId: companyReference.id };
  } catch (error: unknown) {
    if (createdUserUid) {
      await auth.deleteUser(createdUserUid).catch(() => undefined);
    }

    const code = getErrorCode(error);
    logger.error('Falha ao provisionar empresa.', { code });
    if (code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'O e-mail administrativo já está em uso.');
    }
    throw new HttpsError('internal', 'Não foi possível provisionar a empresa.');
  }
});

function parseProvisioningInput(value: unknown): EmpresaProvisionamento {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpsError('invalid-argument', 'Dados de provisionamento inválidos.');
  }

  const data = value as Record<string, unknown>;
  const emailAdmin = requiredEmail(data['emailAdmin'], 'emailAdmin');
  const senhaAdmin = requiredString(data['senhaAdmin'], 'senhaAdmin', 12, 128);

  return {
    razaoSocial: requiredString(data['razaoSocial'], 'razaoSocial', 2, 160),
    nomeFantasia: requiredString(data['nomeFantasia'], 'nomeFantasia', 2, 120),
    cnpj: requiredString(data['cnpj'], 'cnpj', 14, 24),
    endereco: requiredString(data['endereco'], 'endereco', 3, 200),
    telefone: requiredString(data['telefone'], 'telefone', 8, 24),
    email: requiredEmail(data['email'], 'email'),
    cidade: requiredString(data['cidade'], 'cidade', 2, 120),
    bairro: requiredString(data['bairro'], 'bairro', 2, 120),
    cep: requiredString(data['cep'], 'cep', 8, 12),
    complemento: optionalString(data['complemento'], 120),
    emailAdmin,
    senhaAdmin,
  };
}

function requiredString(
  value: unknown,
  field: string,
  minimumLength: number,
  maximumLength: number,
): string {
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', `Campo ${field} inválido.`);
  }
  const normalized = value.trim();
  if (normalized.length < minimumLength || normalized.length > maximumLength) {
    throw new HttpsError('invalid-argument', `Campo ${field} inválido.`);
  }
  return normalized;
}

function optionalString(value: unknown, maximumLength: number): string {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value !== 'string' || value.trim().length > maximumLength) {
    throw new HttpsError('invalid-argument', 'Campo opcional inválido.');
  }
  return value.trim();
}

function requiredEmail(value: unknown, field: string): string {
  const email = requiredString(value, field, 5, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpsError('invalid-argument', `Campo ${field} inválido.`);
  }
  return email;
}

function getErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : 'unknown';
  }
  return 'unknown';
}
