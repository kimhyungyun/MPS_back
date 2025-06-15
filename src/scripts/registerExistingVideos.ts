import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const titles = [
  '1 안면근', '2 흉쇄유돌근', '3 교근', '4 측두근',
  '5 내익상근', '6 외익상근', '7 이복근', '8 승모근',
  '9 두판상근 경판상근', '10 후경근', '11 후두하근',
  '12 견갑거근', '13 사각근', '14 극상근', '15 극하근',
  '16 소원근', '17 대원근', '18 광배근', '19 견갑하근', '20 대, 소능형근',
];

async function main() {
  console.log('Starting lecture registration...');

  // Get the first admin user (mb_level >= 8)
  const instructor = await prisma.g5_member.findFirst({
    where: {
      mb_level: {
        gte: 8
      }
    },
    select: {
      mb_no: true,
      mb_id: true,
      mb_name: true,
      mb_level: true
    }
  });

  if (!instructor) {
    console.error('No admin user found. Please create an admin user first.');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log('Found admin user:', instructor.mb_id);

  // Get or create the default category
  const category = await prisma.lecture_category.upsert({
    where: { name: '근육 해부학' },
    update: {},
    create: {
      name: '근육 해부학'
    }
  });

  for (let i = 0; i < titles.length; i++) {
    const index = i + 1;
    const title = titles[i];
    const videoUrl = `https://d1q7q9w8v4y8j.cloudfront.net/videos/${index}.mp4`;
    const description = `${title}에 대한 상세 설명입니다.`;

    try {
      // First check if a lecture with this title exists
      const existingLecture = await prisma.lecture.findFirst({
        where: { title }
      });

      if (existingLecture) {
        // Update existing lecture
        await prisma.lecture.update({
          where: { id: existingLecture.id },
          data: {
            description,
            video_url: videoUrl,
            thumbnail_url: '/uploads/thumbnails/default.jpg',
            price: 0,
            type: 'single',
            instructorId: instructor.mb_no,
            categoryId: category.id
          }
        });
      } else {
        // Create new lecture
        await prisma.lecture.create({
          data: {
            title,
            description,
            video_url: videoUrl,
            thumbnail_url: '/uploads/thumbnails/default.jpg',
            price: 0,
            type: 'single',
            instructorId: instructor.mb_no,
            categoryId: category.id
          }
        });
      }

      console.log(`✅ ${title} 등록됨`);
    } catch (error) {
      console.error(`❌ ${title} 등록 실패:`, error);
    }
  }

  console.log('Lecture registration completed.');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Script execution failed:', e);
  prisma.$disconnect();
  process.exit(1);
}); 