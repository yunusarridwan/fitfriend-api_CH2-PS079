FROM node:18

# Copy package.json and package-lock.json
COPY package*.json ./

# Install npm production packages 
RUN npm install --production

COPY . .

ENV NODE_ENV production
ENV PORT 3000

EXPOSE 3000

CMD ["npm", "start"]
