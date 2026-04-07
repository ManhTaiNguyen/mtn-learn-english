import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");

  // 1. Create Exam Set
  const examSet = await prisma.examSet.upsert({
    where: { slug: "ket-cambridge-01" },
    update: {},
    create: {
      title: "KET Cambridge 01",
      slug: "ket-cambridge-01",
      is_published: true,
    },
  });

  // 2. Create Exams (Reading & Writing, Listening)
  const readingExam = await prisma.exam.create({
    data: {
      exam_set_id: examSet.id,
      skill_type: "Reading & Writing",
      duration_sec: 4200, // 70 mins
    },
  });

  const listeningExam = await prisma.exam.create({
    data: {
      exam_set_id: examSet.id,
      skill_type: "Listening",
      duration_sec: 1800, // 30 mins
    },
  });

  // 3. Create Parts and Questions for Reading & Writing
  // Part 1: Multiple Choice (Notices/Short texts)
  const part1 = await prisma.part.create({
    data: {
      exam_id: readingExam.id,
      order_index: 0,
      title: "Part 1",
      instruction: "Read the notices and choose the best answer.",
    },
  });

  await prisma.question.createMany({
    data: [
      {
        part_id: part1.id,
        order_index: 0,
        type: "MCQ",
        data_json: {
          text: "NO SMOKING IN THIS AREA",
          options: [
            "You can smoke here if you want.",
            "You are not allowed to smoke here.",
            "Smoking is allowed only in the area behind.",
          ],
          correctAnswer: "You are not allowed to smoke here.",
        },
        score_weight: 1,
        explanation: "The notice explicitly says 'No Smoking'.",
      },
      {
        part_id: part1.id,
        order_index: 1,
        type: "MCQ",
        data_json: {
          text: "To: All Students\nFrom: The Principal\nPlease remember to bring your library books back by Friday.",
          options: [
            "Students must return their library books every Friday.",
            "Students should bring back their library books before or on Friday.",
            "The library is closed on Friday.",
          ],
          correctAnswer:
            "Students should bring back their library books before or on Friday.",
        },
        score_weight: 1,
        explanation: "'By Friday' means Friday is the deadline.",
      },
    ],
  });

  // Part 2: Fill in the blanks
  const part2 = await prisma.part.create({
    data: {
      exam_id: readingExam.id,
      order_index: 1,
      title: "Part 2",
      instruction: "Complete the sentence with the correct word.",
    },
  });

  await prisma.question.create({
    data: {
      part_id: part2.id,
      order_index: 0,
      type: "MCQ",
      data_json: {
        text: "She ___ to the cinema yesterday.",
        options: ["goes", "went", "gone", "going"],
        correctAnswer: "went",
      },
      score_weight: 1,
      explanation: "Yesterday indicates past tense, so 'went' is correct.",
    },
  });

  // 4. Create Parts and Questions for Listening
  const listeningPart1 = await prisma.part.create({
    data: {
      exam_id: listeningExam.id,
      order_index: 0,
      title: "Part 1",
      instruction: "Listen and choose the correct picture.",
      audio_url: "https://www.learningenglish.org.vn/audio/ket-l-p1.mp3",
    },
  });

  await prisma.question.create({
    data: {
      part_id: listeningPart1.id,
      order_index: 0,
      type: "MCQ",
      data_json: {
        text: "What color is the woman's dress?",
        options: ["Blue", "Red", "Green"],
        correctAnswer: "Blue",
      },
      score_weight: 1,
      explanation: "The speaker mentioned her blue dress.",
    },
  });

  // 5. Create Accounts
  const hashedPassword = await bcrypt.hash("123456", 10);

  const accounts = [
    { email: "Admin@test.com", role: "admin" as const, fullName: "System Admin" },
    { email: "Teacher@test.com", role: "teacher" as const, fullName: "English Teacher" },
    { email: "Student@test.com", role: "user" as const, fullName: "Exam Student" },
  ];

  for (const acc of accounts) {
    await prisma.account.upsert({
      where: { email: acc.email },
      update: {
        password_hash: hashedPassword,
        role: acc.role,
      },
      create: {
        email: acc.email,
        password_hash: hashedPassword,
        role: acc.role,
        email_verified: true,
        info: {
          create: {
            full_name: acc.fullName,
          },
        },
      },
    });
    console.log(`- Created/Updated account: ${acc.email} (${acc.role})`);
  }

  // 6. Create Additional Exam Sets
  await createExamSet({
    title: "KET Cambridge 02",
    slug: "ket-cambridge-02",
    exams: [
      {
        skill_type: "Reading & Writing",
        duration_sec: 4200,
        parts: [
          {
            title: "Part 1",
            instruction: "Read the notices and choose the best answer.",
            questions: [
              {
                text: "DO NOT LEAVE LUGGAGE UNATTENDED",
                options: [
                  "Keep your bags with you at all times.",
                  "You can leave your bags here for a short time.",
                  "Luggage will be collected by the staff.",
                ],
                correctAnswer: "Keep your bags with you at all times.",
                explanation: "Unattended means without someone watching it.",
              },
            ],
          },
        ],
      },
      {
        skill_type: "Listening",
        duration_sec: 1800,
        parts: [
          {
            title: "Part 1",
            instruction: "Listen and choose the correct picture.",
            audio_url: "https://www.learningenglish.org.vn/audio/ket-02-l1.mp3",
            questions: [
              {
                text: "Where is the boy's hat?",
                options: ["On the table", "Under the chair", "Behind the door"],
                correctAnswer: "Under the chair",
                explanation: "The boy said 'It's under the chair'.",
              },
            ],
          },
        ],
      },
    ],
  });

  await createExamSet({
    title: "KET Cambridge 03",
    slug: "ket-cambridge-03",
    exams: [
      {
        skill_type: "Reading & Writing",
        duration_sec: 4200,
        parts: [
          {
            title: "Part 1",
            instruction: "Read the notices and choose the best answer.",
            questions: [
              {
                text: "PLEASE PAY FOR YOUR COFFEE AT THE COUNTER",
                options: [
                  "The waiter will bring the bill.",
                  "You should pay before you leave.",
                  "Coffee is free of charge.",
                ],
                correctAnswer: "You should pay before you leave.",
                explanation: "Paying at the counter is a common instruction for cafes.",
              },
            ],
          },
        ],
      },
    ],
  });

  console.log("Seeding finished.");
}

async function createExamSet(data: {
  title: string;
  slug: string;
  exams: {
    skill_type: string;
    duration_sec: number;
    parts: {
      title: string;
      instruction: string;
      audio_url?: string;
      questions: {
        text: string;
        options: string[];
        correctAnswer: string;
        explanation?: string;
      }[];
    }[];
  }[];
}) {
  const examSet = await prisma.examSet.upsert({
    where: { slug: data.slug },
    update: {},
    create: {
      title: data.title,
      slug: data.slug,
      is_published: true,
    },
  });
  console.log(`- Created/Updated Exam Set: ${data.title} (${data.slug})`);

  for (const examData of data.exams) {
    const exam = await prisma.exam.create({
      data: {
        exam_set_id: examSet.id,
        skill_type: examData.skill_type,
        duration_sec: examData.duration_sec,
      },
    });

    for (let i = 0; i < examData.parts.length; i++) {
      const partData = examData.parts[i];
      const part = await prisma.part.create({
        data: {
          exam_id: exam.id,
          order_index: i,
          title: partData.title,
          instruction: partData.instruction,
          audio_url: partData.audio_url,
        },
      });

      await prisma.question.createMany({
        data: partData.questions.map((q, qIndex) => ({
          part_id: part.id,
          order_index: qIndex,
          type: "MCQ",
          data_json: {
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
          },
          score_weight: 1,
          explanation: q.explanation,
        })),
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
