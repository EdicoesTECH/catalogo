const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:cb969af93328084f2def@databases_postgres:5432/databases?sslmode=disable' });

pool.query(`
  SELECT codigo_produto, descricao, COALESCE(url_imagem,'') as url_imagem
  FROM produtos_omie
  WHERE (url_imagem IS NULL OR TRIM(url_imagem) = '')
    AND (inativo IS NULL OR inativo = 'N' OR inativo = 'false' OR inativo = '')
    AND UPPER(TRIM(familia)) NOT IN (
      'BONE','USO E CONSUMO','ACESSORIOS','TE SEGUIREI',
      'CAIXAS','SAZONAIS','LANCHONETE','MATERIAL DE ESCRITÓRIO',
      'EMBALAGENS','MANUAL'
    )
  ORDER BY descricao
`).then(r => {
  console.log('Produtos sem imagem: ' + r.rows.length);
  r.rows.forEach(p => console.log(p.codigo_produto + ' | ' + p.descricao));
  pool.end();
}).catch(e => { console.error('Erro: ' + e.message); pool.end(); });
