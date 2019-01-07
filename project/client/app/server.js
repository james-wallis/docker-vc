const app = require('express')();
const request = require('request');
const port = 3000

let webpagesScanned = 0;
let englandMentioned = 0;
let beginTIme = null;
// var socket = require('socket.io-client')('http://docker-vc-project-server:3000');
var socket = require('socket.io-client')('https://admin.james-wallis.com');
socket.on('connect', function () {
  console.log('connection');
});
socket.on('urls', function (data) {
  console.time('scrape-webpages');
  beginTime = Date.now();
  // console.log(data);
  console.log(data.length, 'urls to scan');
  scrapeWikipedia(data)
});

function scrapeWebpage(url, cb) {
  request(url, function (error, response, html) {
    if (!error) {
      // console.log(html);
      const webpage = html.toLowerCase();
      const count = (webpage.match(/england/g) || []).length;
      webpagesScanned++;
      englandMentioned+=count;
      cb();
    } else {
      console.error(error);
    }
  })
}

function scrapeWikipedia(array) {
  for (let i = 0; i < array.length; i++) {
    const url = array[i];
    setTimeout(function() {
      scrapeWebpage(url, function() {
        // console.log(webpagesScanned);
        // console.log(array.length);
        // console.log(englandMentioned);
        if (webpagesScanned == array.length) {
          console.log('the final count is', englandMentioned);
          console.timeEnd('scrape-webpages');
          //timeTaken in seconds
          const endTime = Date.now();
          let timeTaken = (endTime - beginTime)/1000;
          console.log(timeTaken);
          socket.emit('result', {
            webpagesScanned: webpagesScanned,
            englandMentioned: englandMentioned,
            timeTaken: timeTaken
          })
        }
      })
    }, i*500);
  }
}



