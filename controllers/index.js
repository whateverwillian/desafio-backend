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
        
        // Airports deve ser um número e deve ser no mínimo 3
        if (isNaN(airports) || airports < 3) {
            return res.status(400).json({ status: 'Error', message: 'Provide a valid number of airports' })
        };
        
        // Clouds deve ser um número e deve ser no mínimo 4 
        if (isNaN(clouds) || clouds < 4) {
            return res.status(400).json({ status: 'Error', message: 'Provide a valid number of clouds' });
        }
        
        // Height deve ser um número e deve ser no mínimo 10
        if (isNaN(height) || height < 10) {
            return res.status(400).json({ status: 'Error', message: 'Provide a valid height' })
        }
        
        // Width deve ser um número e deve ser no mínimo 10
        if (isNaN(width) || width < 10) {
            return res.status(400).json({ status: 'Error', message: 'Provide a valid width' })
        }
        
        // CÁLCULOS
        
        // A quantidade de quadradinhos que o nosso grid vai ter
        const gridBlocksQuantity = width * height;
        
        // Nossa grid (a estrutura de dado será um array)
        // Iniciamos dizendo a quantidade de quadradinhos que nossa grid vai ter
        // e esses quadradinhos serão distribuídos linearmente no Array
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

// Recebe o tamanho do array grid e checha se num uma posição válida dentro do grid
const isInsideGrid = (size, num) => num >= 0 && num < size;

// Calcula a propagação das nuvens
function cloudPropagation(grid, infoData) {

    // Vamos tirar daqui umas variáveis que não são globais
    let { height, width, airports } = infoData;

    // AGORA, o caldo engrossou, vamos às variáveis
    var history = [] // Vamos registrar cada um dos dias
    
    // Controlar os dias
    var day = 0;
    
    // Quantos dias até o primeiro aeroporto ser coberto e quantos até todos
    var arrivedFirstAirport = { didArrive: false, day: null };
    var arrivedAllTheAirports = { didArrive: false, day: null };
    
    // Começamos o cálculo
    while (!arrivedAllTheAirports.didArrive) {
        day++;
        
        for (var idx = 0; idx < grid.length; idx ++) {
            grid[idx].newCloud = false;
        }
        

        const initial = lodash.cloneDeep(grid);

        // Vamos percorrer todos os blocos do grid, e cada loop do while é um dia
        for (var position = 0; position < grid.length; position ++) {

            // Se for empty ou airport tanto faz, a gente segue o loop
            if (grid[position].block === 'empty' || grid[position].block === 'airport') continue;
            
            // Se for cloud...
            if (grid[position].block === 'cloud' && !grid[position].newCloud) {

                // Temos que propagar a cloud pros lados, e um bloco pra cima e baixo

                // Como estamos num array, temos o seguinte:
                var up = Number(position) - Number(width);
                var right = Number(position) + 1;
                var down = Number(position) + Number(width);
                var left = Number(position) - 1;

                // UP

                // Vamos ver o que tem na área da propagação da nuvem e ser for um airport
                if (grid[up] && grid[up].block && grid[up].block === 'airport') {

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

                if (
                    grid[up] && 
                    grid[up].block && 
                    isInsideGrid(grid.length, up) && 
                    grid[up].block !== 'cloud'
                ) {
                    grid[up].block  = 'cloud'
                    grid[up].newCloud = true;
                }

                // RIGHT

                // Para checar se a propriedade block existe, ou seja
                // se essa posição é uma posição válida no array
                if (grid[right] && grid[right].block && grid[right].block === 'airport') {

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

                if (
                    grid[right] && 
                    grid[right].block && 
                    isInsideGrid(grid.length, right) &&
                    grid[right].block !== 'cloud'
                ) {
                    grid[right].block = 'cloud'
                    grid[right].newCloud = true;
                }

                // DOWN

                if (grid[down] && grid[down].block && grid[down].block === 'airport') {

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

                if (
                    grid[down] && 
                    grid[down].block && 
                    isInsideGrid(grid.length, down) &&
                    grid[down].block !== 'cloud'    
                ) {
                    grid[down].block = 'cloud';
                    grid[down].newCloud = true;
                }

                // LEFT

                if (grid[left] && grid[left].block && grid[left].block === 'airport') {

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

                if (
                    grid[left] && 
                    grid[left].block && 
                    isInsideGrid(grid.length, left) &&
                    grid[left].block !== 'cloud'    
                ) {
                    grid[left].block = 'cloud';
                    grid[left].newCloud = true;
                }

            }
        }

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