// Import the framework and instantiate it
import Fastify from 'fastify'
import { configDotenv } from 'dotenv';
import { routes } from './routes/index.js';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import fastifyCors from 'fastify-cors';
import path from 'path';
import fs from 'fs';

// Load environment variables from.env file
configDotenv();


// Instantiate Fastify instance and configure it
const fastify = Fastify({
    logger: true
})

//cors middleware
fastify.register(fastifyCors, ({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true,
  exposedHeaders: ['Authorization']
}));

// serve static files from the 'public' directory
fastify.register(fastifyStatic, {
    root: path.join(process.cwd(), 'uploads'), 
    refix: '/uploads/',
})


// Configure Fastify to handle multipart/form-data
fastify.register(fastifyMultipart)

// Register the routes
fastify.register(routes);
// Declare a route
fastify.get('/', async function handler(request, reply) {
    return { hello: 'world' }
})

// uploads into the 'public' directory
fastify.get('/static/:file', ( request, reply ) => {
    const filePath = path.join(__dirname, 'static', request.params.file);

  if (fs.existsSync(filePath)) {
    reply.sendFile(filePath);
  } else {
    reply.status(404).send({ error: 'File not found' });
  }
})

// Run the server!
try {
    await fastify.listen({ port: 3000 })
    console.log(`Server listening on ${fastify.server.address().port}`)
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}