This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Setting up development

You need postgres 15.4 database for application to work correctly

To setup correct databases run following command that creates postgres databases using Docker and Docker Compose

Run commands in project root folder

Setup and/or start up databases:

```bash
# Runs start script
cd docker && sh start-docker.sh

# To apply migrations
npm run prisma:migrate:dev
```

## Starting project

Run the development server:

```bash
npm run dev
```