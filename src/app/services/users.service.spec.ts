import { FirebaseService } from './firebase.service';
import { UserAdminFunctionsClient, UsersService } from './users.service';

describe('UsersService', () => {
  let client: jasmine.SpyObj<UserAdminFunctionsClient>;
  let service: UsersService;

  beforeEach(() => {
    client = jasmine.createSpyObj<UserAdminFunctionsClient>('UserAdminFunctionsClient', ['provision', 'update', 'remove']);
    service = new UsersService({} as FirebaseService, client);
  });

  it('provisiona o usuário no tenant informado e devolve o UID', async () => {
    client.provision.and.resolveTo('uid-created');
    const input = { nome: 'Maria Silva', email: 'maria@example.com', senha: 'senha-segura-123', acesso: 'usuario' as const };
    await expectAsync(service.addUser('tenant-a', input)).toBeResolvedTo('uid-created');
    expect(client.provision).toHaveBeenCalledOnceWith('tenant-a', input);
  });

  it('sincroniza a atualização pelo UID', async () => {
    client.update.and.resolveTo();
    const input = { nome: 'Maria Atualizada', email: 'nova@example.com', acesso: 'administrador' as const };
    await service.updateUser('tenant-a', 'uid-123', input);
    expect(client.update).toHaveBeenCalledOnceWith('tenant-a', 'uid-123', input);
  });

  it('remove somente a associação da empresa informada', async () => {
    client.remove.and.resolveTo();
    await service.deleteUser('tenant-a', 'uid-123');
    expect(client.remove).toHaveBeenCalledOnceWith('tenant-a', 'uid-123');
  });
});
