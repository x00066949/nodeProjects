#download node from docker hub
# specify the node base image with your desired version node:<version>
FROM node:6

# Create app directory
WORKDIR /usr/app

# copy contents of my app
#COPY lib/  var/www/html

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

# replace this with your application's default port ...use >9000
#
EXPOSE 9005

CMD [ "npm", "run", "rebuild" ]
