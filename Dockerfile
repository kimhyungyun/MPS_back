FROM node:18-alpine

WORKDIR /app

# 1) package.json, lock, prisma 먼저 복사
COPY package.json package-lock.json ./
COPY prisma ./prisma

# 2) npm registry 안정화 (선택이지만 에러 나서 추가하는 게 좋음)
RUN npm config set registry https://registry.npmjs.org/

# 3) 의존성 설치 (@prisma/client postinstall에서 schema 필요함)
RUN npm ci

# 4) 나머지 파일 복사 (dist, keys, env)
COPY dist ./dist
COPY keys ./keys
COPY .env .env

# 5) Prisma Client 생성 (schema 위치 명시)
RUN npx prisma generate --schema=./prisma/schema.prisma

# 6) devDependencies 제거
RUN npm prune --production

EXPOSE 3001
CMD ["node", "dist/main.js"]
