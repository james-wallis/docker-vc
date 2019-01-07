const Docker = require('dockerode');
const docker = new Docker();
const express = require('express')
const app = express();
const https = require('https');

let currentProject = null;

function getProject() {
  https.get('https://dev.james-wallis.com/project', (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
      data += chunk;
    });
    resp.on('end', () => {
      const project = JSON.parse(data);
      console.log('project fetched');
      currentProject = project;
      pullImage(project);
    });

  }).on("error", (err) => {
    console.log("Error: " + err.message);
  });
}

function pullImage(project) {
  console.log('pulling image');
  docker.pull(`${project.image.name}:${project.image.tag}`, function (err, stream) {
    if (err) console.error(err);
    stream.pipe(process.stdout);
    stream.once('end', function() {
      if (err) console.error(err);
      if (!err) console.log('Image pulled');
      startProject(project)
    });
  });
}

function startProject(project) {
  const specs = { 
    Image: `${project.image.name}:${project.image.tag}`,
    name: project.name,
    NetworkMode: 'vc-project',
  }
  console.log('project to be started is:');
  console.log(specs);
  docker.createContainer(specs, function (err, container) {
    if (err) console.error(err);
    if (!err) console.log('Container created');
    container.start(function (err, data) {
      currentProject.containerId = container.id;
      currentProject.container = container;
      if (err) console.error(err);
      if (!err) console.log('Container started');
    });
  });
}

function isProjectUp() {
  // If no currentProject then the program needs to get one 
  if (!currentProject) {
    console.log('No currentProject, fetching one');
    getProject();
    return;
  }
  if (!currentProject.container) {
    console.log('project but no container');
    console.log('project object is as follows');
    console.log(currentProject);
    return;
  }
  // If container is exited it needs to be removed and a new project fetched
  // Removal includes removing the Docker image from the system
  currentProject.container.inspect(function (err, data) {
    // console.log('Checking container is running');
    if (data.State.Status != 'running' || data.State.ExitCode != 0) {
      // Container has exited
      console.log('Container has exited');
      const container = currentProject.container;
      // set current project to null
      currentProject = null;
      console.log('Removing container');
      container.remove({ force: true }, function (err) {
        if (err) console.error(err);
        if (!err) console.log('Container removed');
        console.log('removing image');
        let img = docker.getImage(data.Image)
        img.remove(function (err) {
          if (err) console.error(err);
          if (!err) console.log('Image removed');
        })
      });
    } 
    // else {
    //   console.log('container is running');
    // }
  });
}

// Check if the project is running every 10 seconds
setInterval(isProjectUp, 10000);
// Start initial function
getProject();