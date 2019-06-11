var mosca = require('mosca');
var fs = require('fs');
var cytoscape = require('cytoscape');

var events = require('events');

var eventEmitter = new events.EventEmitter();

let rawdata = fs.readFileSync('virtualObjects/virtualObjects.json');
let virtualObjects = JSON.parse(rawdata);  

var ascoltatore = {
  //using ascoltatore
  type: 'mongo',
  url: 'mongodb://localhost:27017/mqtt',
  pubsubCollection: 'ascoltatori',
  mongo: {}
};

var settings = {
  port: 1883,
  backend: ascoltatore
  ,
  persistence: {
    factory: mosca.persistence.Mongo,
    url: 'mongodb://localhost:27017/mqtt'
  },
  stats: false,
  
};

var server = new mosca.Server(settings);

var fork = require('child_process').fork;
var child = [];

var cy = cytoscape({ 
//container: document.getElementById('cy')
});
cy.add({
    group: 'nodes',
    data: { id: 'identity' }
  })


//Create an event handler:
var showJsons = function () {

  var n;
  var nodes = cy.nodes().jsons();
  console.log("-----------------------------------")
  for (n in nodes)
  {
    console.log(nodes[n].data);
  }

  var edges = cy.edges('[source]').jsons();

  for(n in edges)
  {
    console.log(edges[n].data);
  }

};

var summonObjects = function () {

  var o;
  var edges = cy.edges('[source]').jsons();
  /**/
  for(i in edges)
  {
        for (o in virtualObjects)
        {
          //console.log("Checando esse id :" + virtualObjects[o].node.slice(0,-3));
          var node = cy.getElementById(virtualObjects[o].node.slice(0,-3));

          if(node.isNode())
          {
            //console.log(node.json().data.id);
            if (node.edgesWith('[id = "identity"]').nonempty())
            {
               //console.log("Iria MATAR o child." + o);
               if(child[o] != undefined)
               {
                 child[o].kill();
                 //node.remove();
               }
            }
            
          }

          
        }

    if((edges[i].data.target == "identity") && (edges[i].data.source == "identity"))
    {
      //console.log("ELEMENTO NULO");
      cy.getElementById(edges[i].data.id).remove();
    }


    else
    {

      for (j in edges)
      {
        if(j!=i)
        {
          if((edges[i].data.target == "identity") && (edges[j].data.source == "identity"))
          {
              //console.log("Achou dois edges colados na identity");
              for (o in virtualObjects)
              {
                if((virtualObjects[o].source == edges[i].data.id) && (virtualObjects[o].target == edges[j].data.id))
                {
                  if(child[o] != undefined)
                  {
                    
                    if(!child[o].connected)
                    {
                      child[o] = fork('./virtualObjects/' + virtualObjects[o].node);
                    }
                    
                  }
                  else
                  {

                    child[o] = fork('./virtualObjects/' + virtualObjects[o].node);
                                      
                  }
                  //console.log("E IGUAL - rodaria" + './virtualObjects/' + virtualObjects[o].node);
                  //child.kill();
                }
              }
          }
        }
      }
    }

  }
  /**/
  for (o in virtualObjects)
  {
    //console.log("Checando esse id :" + virtualObjects[o].node.slice(0,-3));
    var node = cy.getElementById(virtualObjects[o].node.slice(0,-3));

    if(node.isNode())
    {
      //console.log(node.json().data.id);
      if (node.edgesWith('[id = "identity"]').nonempty())
      {
         //console.log("Iria MATAR o child." + o);
         if(child[o] != undefined)
         {
           child[o].kill();
           //node.remove();
         }
      }
      
    }

    
  }

};

//Assign the event handler to an event:
eventEmitter.on('show', showJsons);
eventEmitter.on('virtual', summonObjects);

server.on('clientConnected', function(client) {

  cy.add({
    group: 'nodes',
    data: { id: client.id }
  });
  //console.log('client connected', client.id);
  
  eventEmitter.emit('virtual');
  eventEmitter.emit('show');  
  });


server.on('clientDisconnected', function(client) {

  var edges = cy.edges('[source = ' +'"'+ client.id +'"' + ']');
  edges.move({source:"identity"})

  var edges = cy.edges('[target = ' +'"'+ client.id +'"' + ']');
  edges.move({target:"identity"})

  cy.getElementById(client.id).remove();
  //console.log('Client Disconnected: ', client.id + "\n");


  var edges = cy.edges('[source]').jsons();
  for(i in edges)
  {
      if((edges[i].data.target == "identity") && (edges[i].data.source == "identity"))
    {
      //console.log("ELEMENTO NULO");
      cy.getElementById(edges[i].data.id).remove();
    }
  }
  eventEmitter.emit('virtual');
  eventEmitter.emit('show');
});


// fired when a message is received
server.on('published', function(packet, client) {

  //console.log('Published', packet.payload + "\n");
  if(packet != undefined && client != undefined)
  {
    //console.log("Entrei no server published, dentro do if");
    var edges = cy.edges('[source = ' +'"'+ client.id +'"' + ']').jsons();
    for (e in edges)
    {
      if(edges[e].data.id!=undefined)
      {

            if(edges[e].data.id!=packet.topic)
            {              
              cy.getElementById(edges[e].data.id).remove();  
              cy.add([
                { group: 'edges', data: { id: edges[e].data.id, source: 'identity' , target: edges[e].data.target } }
                ]);
            }        

      }
      
    }

    var edge = cy.getElementById(packet.topic);
    if(edge.isEdge())
    {
      //console.log("Entrei no server published, dentro do if - 2 ");
      edge.move({source:client.id})
    }
    else
    {
      //console.log("Entrei no server published, dentro do if - 3");
      //console.log(packet.topic);
      var node = cy.getElementById(client.id)
      if( node.isNode())
      {
        //console.log("Entrou");
        cy.add([
                { group: 'edges', data: { id: packet.topic, source: client.id , target: 'identity' } }
                ]);
      }

    }
    eventEmitter.emit('virtual');
    eventEmitter.emit('show');
  }
  

  
});

server.on('subscribed', function(topic, client) {
  
  //console.log('Client', client.id );
  //console.log('Subscribed to ', topic + "\r\n");
  
  if(topic != undefined && client != undefined)
  {
    var edge = cy.getElementById(topic);
    if(edge.isEdge())
    {
      edge.move({target:client.id})
    }
    else
    {
      cy.add([
      { group: 'edges', data: { id: topic, source: 'identity' ,target: client.id } }
      ]);
    }
  }
  eventEmitter.emit('virtual');
  eventEmitter.emit('show');
});

server.on('unsubscribed', function(topic, client) {

  //console.log('Client', client.id ); 
  //console.log('Unsubscribed from ', topic + "\r\n");

  if(topic != undefined && client != undefined)
  {
    var j = cy.getElementById(topic);
    //console.log(j.data('source'));
    j.move({target:'identity'});
  }
  eventEmitter.emit('virtual');
  eventEmitter.emit('show');
});

server.on('ready', setup);

// fired when the mqtt server is ready
function setup() {
  //console.log('Mosca server is up and running');
  eventEmitter.emit('virtual');
}

process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    if (options.cleanup) console.log('clean');
    if (err) console.log(err.stack);
    if (options.exit) 
    { 
      process.exit();
    }  
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));


