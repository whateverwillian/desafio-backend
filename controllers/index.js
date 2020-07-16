'use strict';

const lodash = require('lodash');

module.exports = function (router) {
    router.get('/', function (req, res) {
        // Vamos pegar os 4 argumentos
        // 1 - Quantidade de Aeroportos
        // 2 - Quantidade de Nuvens
        // 3 - A altura do terreno
        // 4 - A largura do terreno
        // E vamos validar todos os dados
        
        const { airports, clouds, height, width } = req.query;
        
        // VALIDAÇÕES
        
        if (!airports || !clouds || !height || !width) {
            return res.status(400).json({ status: 'Error', message: 'Missing argument' })
        }
        
        if (isNaN(airports) || airports < 3) {
            return res.status(400).json({ status: 'Error', message: 'Provide a valid number of airports' })
        };

        if (isNaN(clouds) || clouds < 4) {
            return res.status(400).json({ status: 'Error', message: 'Provide a valid number of clouds' });
        }
        
        if (isNaN(height) || height < 10) {
            return res.status(400).json({ status: 'Error', message: 'Provide a valid height' })
        }
        
        if (isNaN(width) || width < 10) {
            return res.status(400).json({ status: 'Error', message: 'Provide a valid width' })
        }
        
        // CÁLCULOS
        
        // A quantidade de quadradinhos que o nosso grid vai ter
        const gridBlocksQuantity = width * height;
        
        // Nossa grid (a estrutura de dado será um array)
        // Iniciamos dizendo a quantidade de quadradinhos que nossa grid vai ter
        const grid = start(gridBlocksQuantity);
        
        // Ah, e estamos passando grid por referência aqui
        // então a função modifica o array
        distributeAirportsAndClouds(grid, {
            airports,
            clouds,
        });

        const result = cloudPropagation(grid, {
            width,
            height,
            airports,
        });
        
        res.json(result);
    });
    
};

// Cria a grid (terreno)
function start(quantityOfBlocks) {
    const grid = [];
    
    // Vamos ter três tipos de blocos na nossa grid
    // 1 - cloud
    // 2 - airport
    // 3 - empty, que é como vamos inicializar
    
    // Inicializando
    for (var block = 0; block < quantityOfBlocks; block ++) {
        grid.push({ block: 'empty', newCloud: false });
    }
    
    return grid;
}

// Distribui as clouds e os airports
function distributeAirportsAndClouds(grid, toDistribute) {
    const { airports, clouds } = toDistribute;
    
    // Distribuindo Airports
    for (var airport = 0; airport < airports; airport++) {
        
        // Vai decidir aleatóriamente a posição do airport
        // entre 0 e o tamanho da nossa grid
        while (true) {
            const randomIdx = Math.floor(Math.random() * grid.length);

            // Existe a chance do aeroporto cair duas vezes no mesmo lugar
            if (grid[randomIdx].block === 'empty') {
                grid[randomIdx].block = 'airport'

                break;
            }

        }

    }
    
    // Distribuindo Clouds
    for (var cloud = 0; cloud < clouds; cloud ++) {
        
        // Vai decidir aleatóriamente a posição da cloud
        // Porém, precisamos colocar a cloud em um lugar que não tenha um Airport
        while (true) {
            const randomIdx = Math.floor(Math.random() * grid.length);
            
            // Vai ficar nesse loop até achar uma posição vazia pra por a cloud
            if (grid[randomIdx].block === 'empty' || grid[randomIdx].block === 'cloud') {
                grid[randomIdx].block = 'cloud';
                
                break;
            }
        }
    }
}

// Calcula a propagação das nuvens
function cloudPropagation(grid, infoData) {

    // Vamos pegar aqui variáveis que precisamos e não temos acesso
    let { height, width, airports } = infoData;

    // AGORA, o caldo engrossou, vamos às variáveis

    var history = [] // Vamos registrar o estado de cada um dos dias
    
    // Controlar os dias
    var day = 0;
    
    // Quantos dias até o primeiro aeroporto ser coberto e quantos até todos serem
    var arrivedFirstAirport = { didArrive: false, day: null };
    var arrivedAllTheAirports = { didArrive: false, day: null };
    
    // Começamos o cálculo
    // Enquanto as nuvens não alcançarem todos os Aeroportos, o loop continua
    while (!arrivedAllTheAirports.didArrive) {
        day++;
        
        // No começo de todos os dias setamos que as nuvens já não são mais "new clouds"
        // Precisamos disso pra que as novas nuvens não se propaguem até um dia depois
        for (var idx = 0; idx < grid.length; idx ++) {
            grid[idx].newCloud = false;
        }
        
        // Clonamos o estado da grid no começo do dia e no final do dia,
        // E usamos o lodash para fazer um deep clone e não uma atribuição por referência
        const initial = lodash.cloneDeep(grid);

        // Vamos percorrer todos os blocos do grid, e cada loop do while é um dia
        for (var position = 0; position < grid.length; position ++) {

            // Se for empty ou airport tanto faz, a gente segue o loop
            if (grid[position].block === 'empty' || grid[position].block === 'airport') continue;
            
            // Se for cloud...
            // o grid position está no formato { block, newCloud } para que possamos controlar e 
            // propagar apenas as nuvens que já estavam no grid no começo do dia
            if (grid[position].block === 'cloud' && !grid[position].newCloud) {

                // Temos que propagar a cloud pros lados, e um bloco pra cima e baixo

                // Como estamos num array, temos o seguinte:
                var up = Number(position) - Number(width);
                var right = Number(position) + 1;
                var down = Number(position) + Number(width);
                var left = Number(position) - 1;

                // Vai loopar pelas direções, e fazer a movimentação
                const directions = [up, right, down, left];

                // Vamos ver o que tem na área da propagação da nuvem e ser for um airport
                for (var currentPosition = 0; currentPosition < directions.length; currentPosition ++) {
                    if (
                        grid[directions[currentPosition]] && 
                        grid[directions[currentPosition]].block && 
                        grid[directions[currentPosition]].block === 'airport'
                    ) {

                        // Foi o primeiro aeroporto que as nuvens alcançaram?
                        if (!arrivedFirstAirport.didArrive) {
    
                            // Se foi, a gente seta o dia em que isso aconteceu, e afirma que chegou
                            arrivedFirstAirport = { day, didArrive: true };
                        } 
    
                        // De qualquer forma, a gente decrementa o número de aeroportos que faltam
                        airports -= 1;
    
                        // E checamos se a nuvem já alcançou todos os aeroportos
                        if (airports === 0) {
    
                            // Anotamos o dia que isso aconteceu e terminamos o cálculo
                            arrivedAllTheAirports = { day, didArrive: true }
                        }
                    }
    
                    // Aqui o movimento acontece
                    // Vemos se o bloco existe e é válido dentro da grid, e vemos se ele é uma cloud
                    // Porque se for uma cloud, não vamos mexer, porque se for uma new Cloud ela nunca
                    // Sairá do estado de new Cloud, e não queremos isso, queremos que ela propague um dia depois
                    if (
                        grid[directions[currentPosition]] && 
                        grid[directions[currentPosition]].block && 
                        grid[directions[currentPosition]].block !== 'cloud'
                    ) {
                        grid[directions[currentPosition]].block  = 'cloud'
                        grid[directions[currentPosition]].newCloud = true;
                    }
                }
            }
        }

        // Para comparar com o começo do dia e checar se a resposta está correta
        const final = lodash.cloneDeep(grid);

        history.push({ day, grid: { initial, final } });
    }

    return {
        history,
        arrivedFirstAirport,
        arrivedAllTheAirports,
        terrain: {
            height,
            width,
        }
    };
}