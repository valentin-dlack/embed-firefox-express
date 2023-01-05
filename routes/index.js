var express = require('express');
var { spawn } = require('child_process');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/docker-start', async function(req, res, next) {
  const randomName = Math.random().toString(36).substring(4);
  const randomPort = Math.floor(Math.random() * 500) + 5500;
  const link = req.query.link;

  console.warn(`[LOG] - Starting firefox-${randomName} on port ${randomPort} with link ${link}`);

  const dockerProcess = spawn('docker', [
    'run',
    '--name',
    `firefox-${randomName}`,
    '-e',
    'CONTAINER_DEBUG=true',
    '-p',
    `${randomPort}:5800`,
    'jlesage/firefox'
  ]);

  dockerProcess.stdout.on('data', (data) => {
    console.log(`[LOG] - firefox-${randomName}: ${data}`);
  });

  dockerProcess.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
    // if the port is already in use, try again
    if (data.includes('port is already allocated')) {
      dockerProcess.kill();
      res.send('port in use');
    }
  });

  dockerProcess.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });

  // Wait for the container to start
  await new Promise(resolve => setTimeout(resolve, 5000));

  res.send(`firefox-${randomName};${randomPort}`);
});

router.get('/docker-stop/:name', function(req, res, next) {
  const dockerProcess = spawn('docker', ['stop', req.params.name]);

  dockerProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  dockerProcess.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  dockerProcess.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    // remove the container
    const dockerProcess = spawn('docker', ['rm', req.params.name]);
  });

  res.send('ok');
});

module.exports = router;
