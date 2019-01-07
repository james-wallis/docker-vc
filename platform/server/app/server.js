const express = require('express')
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs-extra');
app.use(bodyParser.urlencoded({ extended: false }));
const port = 3000

let projects = [
  {
    name: 'wikipedia-search',
    image: {
      name: 'jamesemwallis/docker-vc-project-client',
      tag: 'latest'
    },
    clients_assigned: []
  } 
]

/**
 * GET project
 * Returns the details of a project with the least amount of clients assigned
 */
app.get('/project', function(req, res) {
  let assignedArray = [];
  for (let i = 0; i < projects.length; i++) {
    const name = projects[i].name;
    const amountAssigned = projects[i].clients_assigned.length;
    const obj = {};
    obj['name'] = name;
    obj['amount'] = amountAssigned;
    obj['index'] = i;
    assignedArray.push(obj);
  }
  assignedArray = sortByKey(assignedArray, 'amount');
  // Send the first element of the assigned array to the client
  const project = projects[assignedArray[0].index];
  // Only send certain data
  const response = {
    name: project.name,
    image: {
      name: project.image.name,
      tag: project.image.tag
    }
  }
  res.send(response)
})

/**
 * POST project
 * Add a VC project to the projects array so it can be run on a donor's computer
 */
app.post('/project', function (req, res) {
  const body = req.body;
  if (!body.name || !body.image 
    || !body.image.name || !body.image.tag) res.sendStatus(400);
  let alreadyExists = false;
  let i = 0;
  while (alreadyExists = false && i < projects.length) {
    const p = projects[i];
    if (p.name == body.name 
      || (p.image.name == body.image.name 
      && p.image.tag == body.image.tag)) {
      alreadyExists = true;
    }
  }
  if (alreadyExists) {
    res.status = 500;
    res.send('Project already exists');
  } else {
    projects.push({
      name: body.name,
      image: {
        name: body.image.name,
        tag: body.image.tag
      },
      clients_assigned: []
    })
    res.sendStatus(200);
  }
})

app.listen(port, () => console.log(`Server listening on port ${port}!`))


// Functions

function sortByKey(array, key) {
  return array.sort(function (a, b) {
    var x = a[key]; var y = b[key];
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });
}
