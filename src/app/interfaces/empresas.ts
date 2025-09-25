export interface Empresas {
    id: string,
    razaoSocial: string,
    nomeFantasia: string,
    cnpj: string,
    endereco: string,
    telefone: string,
    email: string
    cidade?: string,
    bairro?: string,
    cep?: string,
    complemento?: string
}