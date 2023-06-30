FROM cypress/base:18.16.0

RUN mkdir /app
WORKDIR /app

COPY . /app

RUN npm install

#RUN $(npm bin)/cypress verify
RUN npx cypress verify

RUN ["npm", "run", "cypress:test"]
