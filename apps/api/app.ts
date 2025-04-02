import Fastify from "fastify";

export const fastify = Fastify({ logger: true });
export const logger = fastify.log;
