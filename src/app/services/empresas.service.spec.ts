import { EmpresaPersistidaInput } from '../interfaces/empresas';
import { buildEmpresaPersistidaPayload } from './empresas.service';

describe('buildEmpresaPersistidaPayload', () => {
  it('não inclui senhaAdmin mesmo quando a entrada contém a propriedade indevida', () => {
    const input = {
      razaoSocial: 'Empresa Teste Ltda',
      nomeFantasia: 'Empresa Teste',
      cnpj: '00.000.000/0001-00',
      endereco: 'Rua Teste, 1',
      telefone: '(00) 00000-0000',
      email: 'contato@example.com',
      cidade: 'Cidade-UF',
      bairro: 'Centro',
      cep: '00000-000',
      complemento: '',
      emailAdmin: 'admin@example.com',
      senhaAdmin: 'segredo-que-nao-pode-persistir',
    } as unknown as EmpresaPersistidaInput;

    const payload = buildEmpresaPersistidaPayload(input);

    expect(Object.hasOwn(payload, 'senhaAdmin')).toBeFalse();
    expect(payload.emailAdmin).toBe('admin@example.com');
  });
});
