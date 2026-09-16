export interface Produto {
  codigo_produto: string;
  descricao: string;
  familia: string;
  preco: number;
  imagem_url: string;
  altura: number;
  largura: number;
  profundidade: number;
  peso_bruto: number;
  peso_liq: number;
}

export const mockProdutos: Produto[] = [
  {
    codigo_produto: "001",
    descricao: "O Senhor dos Anéis - A Sociedade do Anel",
    familia: "Ficção Científica",
    preco: 89.90,
    imagem_url: "https://via.placeholder.com/200x300?text=Senhor+dos+Anéis",
    altura: 20,
    largura: 15,
    profundidade: 5,
    peso_bruto: 0.5,
    peso_liq: 0.45
  },
  {
    codigo_produto: "002",
    descricao: "Harry Potter e a Pedra Filosofal",
    familia: "Fantasia",
    preco: 75.50,
    imagem_url: "https://via.placeholder.com/200x300?text=Harry+Potter",
    altura: 21,
    largura: 14,
    profundidade: 4,
    peso_bruto: 0.4,
    peso_liq: 0.35
  },
  {
    codigo_produto: "003",
    descricao: "1984 - George Orwell",
    familia: "Ficção Distópica",
    preco: 45.00,
    imagem_url: "https://via.placeholder.com/200x300?text=1984",
    altura: 19,
    largura: 13,
    profundidade: 3,
    peso_bruto: 0.38,
    peso_liq: 0.33
  },
  {
    codigo_produto: "004",
    descricao: "O Pequeno Príncipe",
    familia: "Infantil",
    preco: 35.90,
    imagem_url: "https://via.placeholder.com/200x300?text=Pequeno+Príncipe",
    altura: 18,
    largura: 12,
    profundidade: 2,
    peso_bruto: 0.25,
    peso_liq: 0.22
  },
  {
    codigo_produto: "005",
    descricao: "Cem Anos de Solidão",
    familia: "Realismo Mágico",
    preco: 62.00,
    imagem_url: "https://via.placeholder.com/200x300?text=Cem+Anos+Solidão",
    altura: 20,
    largura: 14,
    profundidade: 4,
    peso_bruto: 0.42,
    peso_liq: 0.38
  }
];
