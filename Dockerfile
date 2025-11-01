FROM node:18-alpine

WORKDIR /app

COPY .env .env
COPY package.json .
COPY package-lock.json .
COPY keys ./keys
COPY dist ./dist
COPY prisma ./prisma

# ✅ devDependencies 포함 설치
RUN npm ci

# ✅ Prisma Client 생성
RUN npx prisma generate

# ✅ 프로덕션 환경 최적화
RUN npm prune --production

EXPOSE 3001
CMD ["node", "dist/main.js"]
