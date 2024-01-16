// Importar a biblioteca
const artnet = require('artnet-protocol');

let dmx_values;

// Criar uma instância do receptor
const controller = new artnet.ArtNetController();
controller.bind('0.0.0.0');

controller.on('dmx', (dmx) => {
    // dmx contains an ArtDmx object
    //console.log(dmx.universe, dmx.data);
    dmx_values = dmx.data;

    dmx_values.unshift(0);
});

function getDmxValues(req, res){
    res.send({ status: "ok", dmx: dmx_values });
}

// Exportar funções
module.exports = {
    getDmxValues: getDmxValues
  };
