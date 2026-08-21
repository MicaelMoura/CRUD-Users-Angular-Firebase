import { before, test } from 'node:test';
import assert from 'node:assert/strict';

const projectId = 'demo-commercium-functions';
const apiKey = 'fake-api-key';
const authBase = `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts`;
const firestoreBase = `http://127.0.0.1:8080/v1/projects/${projectId}/databases/(default)/documents`;
const functionsBase = `http://127.0.0.1:5001/${projectId}/southamerica-east1`;
const suffix = Date.now();
let admin;

async function jsonRequest(url, init) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function createAuthUser(email, password) {
  const { response, body } = await jsonRequest(`${authBase}:signUp?key=${apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  assert.equal(response.ok, true, JSON.stringify(body));
  return body;
}

async function signIn(email, password) {
  return jsonRequest(`${authBase}:signInWithPassword?key=${apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
}

async function seedMembership(tenantId, uid, data) {
  const fields = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, { stringValue: value }]));
  const { response, body } = await jsonRequest(`${firestoreBase}/business/${tenantId}/users/${uid}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', authorization: 'Bearer owner' },
    body: JSON.stringify({ fields }),
  });
  assert.equal(response.ok, true, JSON.stringify(body));
}

async function callFunction(name, token, data) {
  return jsonRequest(`${functionsBase}/${name}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ data }),
  });
}

before(async () => {
  admin = await createAuthUser(`admin-${suffix}@example.com`, 'admin-seguro-123');
  await seedMembership('tenant-a', admin.localId, {
    id: admin.localId,
    nome: 'Admin Teste',
    email: `admin-${suffix}@example.com`,
    acesso: 'administrador',
    perfilId: 'administrador',
  });
});

test('provisiona, atualiza e remove o acesso mantendo Auth e Firestore coerentes', async () => {
  const originalEmail = `usuario-${suffix}@example.com`;
  const updatedEmail = `usuario-atualizado-${suffix}@example.com`;
  const password = 'usuario-seguro-123';
  const created = await callFunction('provisionarUsuario', admin.idToken, {
    empresaId: 'tenant-a', nome: 'Usuário Teste', email: originalEmail, senha: password, acesso: 'usuario',
  });
  assert.equal(created.response.ok, true, JSON.stringify(created.body));
  const userId = created.body.result?.userId ?? created.body.data?.userId;
  assert.ok(userId);

  const originalLogin = await signIn(originalEmail, password);
  assert.equal(originalLogin.response.ok, true, JSON.stringify(originalLogin.body));
  assert.equal(originalLogin.body.localId, userId);

  const membership = await jsonRequest(`${firestoreBase}/business/tenant-a/users/${userId}`, {
    headers: { authorization: 'Bearer owner' },
  });
  assert.equal(membership.response.ok, true, JSON.stringify(membership.body));
  assert.equal(membership.body.fields.acesso.stringValue, 'usuario');

  const updated = await callFunction('atualizarUsuario', admin.idToken, {
    empresaId: 'tenant-a', userId, nome: 'Usuário Atualizado', email: updatedEmail, acesso: 'visitante',
  });
  assert.equal(updated.response.ok, true, JSON.stringify(updated.body));
  const updatedLogin = await signIn(updatedEmail, password);
  assert.equal(updatedLogin.response.ok, true, JSON.stringify(updatedLogin.body));

  const removed = await callFunction('removerAcessoUsuario', admin.idToken, { empresaId: 'tenant-a', userId });
  assert.equal(removed.response.ok, true, JSON.stringify(removed.body));
  const removedMembership = await fetch(`${firestoreBase}/business/tenant-a/users/${userId}`, {
    headers: { authorization: 'Bearer owner' },
  });
  assert.equal(removedMembership.status, 404);
  const authStillExists = await signIn(updatedEmail, password);
  assert.equal(authStillExists.response.ok, true, 'A remoção de um tenant não deve apagar uma conta possivelmente multiempresa.');
});

test('nega operações administrativas para usuário comum', async () => {
  const regular = await createAuthUser(`regular-${suffix}@example.com`, 'regular-seguro-123');
  await seedMembership('tenant-a', regular.localId, {
    id: regular.localId, nome: 'Usuário Comum', email: `regular-${suffix}@example.com`, acesso: 'usuario', perfilId: 'usuario',
  });
  const result = await callFunction('provisionarUsuario', regular.idToken, {
    empresaId: 'tenant-a', nome: 'Intruso Teste', email: `intruso-${suffix}@example.com`, senha: 'intruso-seguro-123', acesso: 'administrador',
  });
  assert.equal(result.response.ok, false);
  assert.equal(result.body.error?.status, 'PERMISSION_DENIED');
});

test('impede o administrador de remover ou rebaixar o próprio acesso', async () => {
  const removeSelf = await callFunction('removerAcessoUsuario', admin.idToken, {
    empresaId: 'tenant-a', userId: admin.localId,
  });
  assert.equal(removeSelf.response.ok, false);
  assert.equal(removeSelf.body.error?.status, 'FAILED_PRECONDITION');

  const demoteSelf = await callFunction('atualizarUsuario', admin.idToken, {
    empresaId: 'tenant-a', userId: admin.localId, nome: 'Admin Teste', email: `admin-${suffix}@example.com`, acesso: 'usuario',
  });
  assert.equal(demoteSelf.response.ok, false);
  assert.equal(demoteSelf.body.error?.status, 'FAILED_PRECONDITION');
});
