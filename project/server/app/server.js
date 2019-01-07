const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const https = require('https')
const fs = require('fs-extra')
const port = 3000
let connectCounter = 0;
const clients = [];

let totals = {
  scannedPages: 0,
  englandMentioned: 0,
  timeTaken: {
    high: 0,
    low: 0,
    alltimes: []
  }
}
let resultTotal = 0;

// const wiki = {
//   pages: []
// };
const wiki = fs.readJSONSync('/json/wikiPages.json');

app.get('/project', function(req, res) {
  res.send(wiki.pages);
})

app.get('/search/:no', function(req, res) {
  const no = req.params.no;
  const newArr = splitArray(wiki.pages, (wiki.pages.length/no));
  for (let i = 0; i < no; i++) {
    if (clients.length > i) {
      io.sockets.connected[clients[i]].emit('urls', newArr[i]);
    } else {
      console.log(`There is only ${clients.length} client(s), not the requested ${no}.`);
      break;
    }
    
  }
  res.send(newArr);
})

// Function to get 2000 wikipedia pages
// function getURL() {
//   https.get('https://en.wikipedia.org/wiki/Special:Random', (resp) => {
//     resp.on('data', () => { });
//     resp.on('end', () => {
//       wiki.pages.push(resp.headers.location)
//       console.log(resp.headers.location);
//       fs.writeJSON('/json/wikiPages.json', wiki);
//       if (wiki.pages.length > 2000) {
//         fs.writeJSON('/json/wikiPages.json', wiki);
//         clearInterval(interval);
//       }
//     });
//   }).on("error", (err) => {
//     console.log("Error: " + err.message);
//   });
// }
// const interval = setInterval(getURL, 1000);

// Count number of wiki pages to check - should output 2000
console.log(wiki.pages.length);

io.on('connection', function (socket) {
  clients.push(socket.id);
  console.log('vc connection made, number now is ' + clients.length);
  socket.on('disconnect', function () { 
    clients.pop(socket.id);
    console.log('vc connection lost, number now is ' + clients.length);
  });
  socket.on('result', function(result) {
    console.log(result);
    totals.scannedPages += result.webpagesScanned;
    totals.englandMentioned += result.englandMentioned;
    const timeTaken = result.timeTaken;
    if (timeTaken > totals.timeTaken.high) totals.timeTaken.high = result.timeTaken;
    if (timeTaken < totals.timeTaken.low || totals.timeTaken.low == 0) totals.timeTaken.low = result.timeTaken;
    totals.timeTaken.alltimes.push(timeTaken);
    // if scanned pages is equal to the amount of pages to scan then we are done
    if (totals.scannedPages >= wiki.pages.length) {
      console.log('Total pages scanned:', totals.scannedPages);
      console.log('Total times "england" is mentioned:', totals.englandMentioned);
      console.log('Time');
      console.log('Highest time taken:', totals.timeTaken.high, 'seconds');
      console.log('Lowest time taken:', totals.timeTaken.low, 'seconds');
      let mean = 0;
      for (let i = 0; i < totals.timeTaken.alltimes.length; i++) {
        mean += totals.timeTaken.alltimes[i];
      }
      mean = mean / totals.timeTaken.alltimes.length;
      console.log('Mean time taken:', mean, 'seconds');
    }
  })
});

http.listen(port, function () {
  console.log('listening on *:3000');
});

function splitArray(array, groupsize) {
  var sets = [];
  var chunks = array.length / groupsize;

  for (var i = 0, j = 0; i < chunks; i++ , j += groupsize) {
    sets[i] = array.slice(j, j + groupsize);
  }

  return sets;
};
