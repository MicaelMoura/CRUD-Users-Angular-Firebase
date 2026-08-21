import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseUsuarioAtualizacaoInput,
  parseUsuarioProvisionamentoInput,
  parseUsuarioRemocaoInput,
} from '../lib/index.js';

test('normaliza e valida o cadastro de usuário', () => {
  const input = parseUsuarioProvisionamentoInput({
    empresaId: ' Tenant-A ',
    nome: '  Maria da Silva  ',
    email: ' MARIA@EXAMPLE.COM ',
    senha: 'senha-segura-123',
    acesso: 'administrador',
  });
  assert.deepEqual(input, {
    empresaId: 'tenant-a',
    nome: 'Maria da Silva',
    email: 'maria@example.com',
    senha: 'senha-segura-123',
    acesso: 'administrador',
  });
});

test('rejeita senha curta e perfil desconhecido', () => {
  assert.throws(() => parseUsuarioProvisionamentoInput({
    empresaId: 'tenant-a', nome: 'Maria', email: 'maria@example.com', senha: 'curta', acesso: 'usuario',
  }), /Campo senha inválido/);
  assert.throws(() => parseUsuarioProvisionamentoInput({
    empresaId: 'tenant-a', nome: 'Maria', email: 'maria@example.com', senha: 'senha-segura-123', acesso: 'superuser',
  }), /Perfil de acesso inválido/);
});

test('aceita somente IDs e tenants seguros na atualização e remoção', () => {
  assert.deepEqual(parseUsuarioAtualizacaoInput({
    empresaId: 'tenant-a', userId: 'uid_123', nome: 'João Silva', email: 'joao@example.com', acesso: 'usuario',
  }), {
    empresaId: 'tenant-a', userId: 'uid_123', nome: 'João Silva', email: 'joao@example.com', acesso: 'usuario',
  });
  assert.deepEqual(parseUsuarioRemocaoInput({ empresaId: 'tenant-a', userId: 'uid_123' }), {
    empresaId: 'tenant-a', userId: 'uid_123',
  });
  assert.throws(() => parseUsuarioRemocaoInput({ empresaId: '../tenant', userId: 'uid_123' }), /empresa inválido/);
  assert.throws(() => parseUsuarioRemocaoInput({ empresaId: 'tenant-a', userId: '../uid' }), /usuário inválido/);
});

test('não aceita campos ausentes ou payload que não seja objeto', () => {
  assert.throws(() => parseUsuarioProvisionamentoInput(null), /Dados do usuário inválidos/);
  assert.throws(() => parseUsuarioAtualizacaoInput({}), /Campo empresaId inválido/);
});
