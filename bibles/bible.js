const sqlite3 = require('sqlite3').verbose();

// Caminho para o arquivo do banco de dados SQLite
const biblePath = {
    ntlh: './bibles/NTLH.sqlite'
};

function searchVerse(entradas, version) {
    return new Promise((resolve, reject) => {
        // Conecta-se ao banco de dados
        const db = new sqlite3.Database(biblePath[version]); // Assumindo que você tenha um objeto `biblePath` que mapeia versões da Bíblia para caminhos do banco de dados

        // Consulta SQL para buscar os versículos
        const query = `SELECT text FROM verse WHERE book_id = ? AND chapter = ? AND verse = ?`;

        // Array para armazenar os resultados
        const resultados = [];

        // Função para executar a consulta para uma entrada específica
        function search(entrada) {
            return new Promise((resolve, reject) => {
                // Converte a entrada em valores separados para livro, capítulo e versículo
                const livro = parseInt(entrada.substring(0, 2));
                const capitulo = parseInt(entrada.substring(2, 5));
                const versiculo = parseInt(entrada.substring(5, 8));

                // Executa a consulta com os valores obtidos da entrada
                db.get(query, [livro, capitulo, versiculo], (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        // Se a linha foi encontrada, adiciona o texto do versículo aos resultados
                        if (row) {
                            resultados.push(row.text);
                        }
                        resolve();
                    }
                });
            });
        }

        // Função para executar as consultas sequencialmente
        async function executeQueriesInOrder() {
            for (const entrada of entradas) {
                try {
                    await search(entrada);
                } catch (err) {
                    // Em caso de erro, rejeita a Promise e fecha a conexão com o banco de dados
                    db.close();
                    reject(err);
                    return;
                }
            }
            // Fecha a conexão com o banco de dados após todas as consultas
            db.close();
            // Retorna os resultados
            resolve(resultados);
        }

        // Chama a função para executar as consultas sequencialmente
        executeQueriesInOrder();
    });
}

function searchReference(entradas) {
    return new Promise((resolve, reject) => {
        // Conecta-se ao banco de dados
        const db = new sqlite3.Database(biblePath.ntlh); // Assumindo que você tenha um objeto `biblePath` que mapeia versões da Bíblia para caminhos do banco de dados

        // Consulta SQL para buscar os versículos
        const query = `SELECT name FROM book WHERE book_reference_id = ?`;

        // Array para armazenar os resultados
        const resultados = [];

        // Função para executar a consulta para uma entrada específica
        function search(entrada) {
            return new Promise((resolve, reject) => {
                // Converte a entrada em valores separados para livro, capítulo e versículo
                const livro = parseInt(entrada.substring(0, 2));
                const capitulo = parseInt(entrada.substring(2, 5));
                const versiculo = parseInt(entrada.substring(5, 8));

                // Executa a consulta com os valores obtidos da entrada
                db.get(query, [livro], (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        // Se a linha foi encontrada, adiciona o texto do versículo aos resultados
                        if (row) {
                            resultados.push(row.name + ' ' + capitulo + '.' + versiculo);
                        }
                        resolve();
                    }
                });
            });
        }

        // Função para executar as consultas sequencialmente
        async function executeQueriesInOrder() {
            for (const entrada of entradas) {
                try {
                    await search(entrada);
                } catch (err) {
                    // Em caso de erro, rejeita a Promise e fecha a conexão com o banco de dados
                    db.close();
                    reject(err);
                    return;
                }
            }
            // Fecha a conexão com o banco de dados após todas as consultas
            db.close();
            // Retorna os resultados
            resolve(resultados);
        }

        // Chama a função para executar as consultas sequencialmente
        executeQueriesInOrder();
    });
}

// searchVerse(["01001001", "01001002", "01001003"], 'ntlh')
//     .then(resultados => {
//         console.log("Versículos encontrados:", resultados);
//     })
//     .catch(err => {
//         console.error("Erro ao buscar versículos:", err);
//     });


// Exportar funções
module.exports = {
    searchVerse: searchVerse,
    searchReference: searchReference
  };