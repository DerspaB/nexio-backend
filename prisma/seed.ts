import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const GLOBAL_EXERCISES = [
  { name: 'Press de banca', muscleGroup: 'Pecho', equipment: 'Barra' },
  { name: 'Press inclinado con mancuernas', muscleGroup: 'Pecho', equipment: 'Mancuernas' },
  { name: 'Aperturas', muscleGroup: 'Pecho', equipment: 'Mancuernas' },
  { name: 'Fondos en paralelas', muscleGroup: 'Pecho', equipment: 'Peso corporal' },
  { name: 'Dominadas', muscleGroup: 'Espalda', equipment: 'Barra fija' },
  { name: 'Remo con barra', muscleGroup: 'Espalda', equipment: 'Barra' },
  { name: 'Jalón al pecho', muscleGroup: 'Espalda', equipment: 'Polea' },
  { name: 'Peso muerto', muscleGroup: 'Espalda', equipment: 'Barra' },
  { name: 'Sentadilla con barra', muscleGroup: 'Piernas', equipment: 'Barra' },
  { name: 'Prensa de piernas', muscleGroup: 'Piernas', equipment: 'Máquina' },
  { name: 'Peso muerto rumano', muscleGroup: 'Piernas', equipment: 'Barra' },
  { name: 'Zancadas', muscleGroup: 'Piernas', equipment: 'Mancuernas' },
  { name: 'Extensión de cuádriceps', muscleGroup: 'Piernas', equipment: 'Máquina' },
  { name: 'Curl de piernas', muscleGroup: 'Piernas', equipment: 'Máquina' },
  { name: 'Press militar', muscleGroup: 'Hombros', equipment: 'Barra' },
  { name: 'Elevaciones laterales', muscleGroup: 'Hombros', equipment: 'Mancuernas' },
  { name: 'Pájaros', muscleGroup: 'Hombros', equipment: 'Mancuernas' },
  { name: 'Curl con barra', muscleGroup: 'Bíceps', equipment: 'Barra' },
  { name: 'Curl con mancuernas', muscleGroup: 'Bíceps', equipment: 'Mancuernas' },
  { name: 'Curl martillo', muscleGroup: 'Bíceps', equipment: 'Mancuernas' },
  { name: 'Extensión en polea', muscleGroup: 'Tríceps', equipment: 'Polea' },
  { name: 'Press francés', muscleGroup: 'Tríceps', equipment: 'Barra' },
  { name: 'Fondos en banco', muscleGroup: 'Tríceps', equipment: 'Banco' },
  { name: 'Plancha', muscleGroup: 'Core', equipment: 'Peso corporal' },
  { name: 'Crunch abdominal', muscleGroup: 'Core', equipment: 'Peso corporal' },
  { name: 'Russian twist', muscleGroup: 'Core', equipment: 'Peso corporal' },
  { name: 'Caminata en cinta', muscleGroup: 'Cardio', equipment: 'Cinta' },
  { name: 'Bicicleta estática', muscleGroup: 'Cardio', equipment: 'Bicicleta' },
  { name: 'Saltar la cuerda', muscleGroup: 'Cardio', equipment: 'Cuerda' },
];

const DEMO_CLIENTS = [
  { email: 'maria.garcia@nexio.dev', firstName: 'María', lastName: 'García', status: 'ACTIVE', tags: ['principiante', 'pérdida de peso'] },
  { email: 'carlos.lopez@nexio.dev', firstName: 'Carlos', lastName: 'López', status: 'ACTIVE', tags: ['intermedio', 'hipertrofia'] },
  { email: 'ana.martinez@nexio.dev', firstName: 'Ana', lastName: 'Martínez', status: 'PAUSED', tags: ['avanzado'] },
  { email: 'jorge.ramirez@nexio.dev', firstName: 'Jorge', lastName: 'Ramírez', status: 'ACTIVE', tags: ['principiante'] },
  { email: 'lucia.fernandez@nexio.dev', firstName: 'Lucía', lastName: 'Fernández', status: 'INACTIVE', tags: ['intermedio', 'rehabilitación'] },
];

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const organization = await prisma.organization.upsert({
    where: { slug: 'nexio-demo' },
    update: {},
    create: {
      name: 'Nexio Demo',
      slug: 'nexio-demo',
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@nexio.dev' },
    update: {},
    create: {
      email: 'owner@nexio.dev',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Owner',
      role: 'OWNER',
      organizationId: organization.id,
    },
  });

  const coach = await prisma.user.upsert({
    where: { email: 'coach@nexio.dev' },
    update: {},
    create: {
      email: 'coach@nexio.dev',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Coach',
      role: 'COACH',
      organizationId: organization.id,
    },
  });

  console.log(`Organization: ${organization.name}`);
  console.log(`Owner: ${owner.email}`);
  console.log(`Coach: ${coach.email}`);

  for (const clientData of DEMO_CLIENTS) {
    const user = await prisma.user.upsert({
      where: { email: clientData.email },
      update: {},
      create: {
        email: clientData.email,
        passwordHash,
        firstName: clientData.firstName,
        lastName: clientData.lastName,
        role: 'CLIENT',
        organizationId: organization.id,
      },
    });

    const existingClient = await prisma.client.findUnique({
      where: { userId: user.id },
    });

    if (!existingClient) {
      await prisma.client.create({
        data: {
          userId: user.id,
          coachId: coach.id,
          organizationId: organization.id,
          status: clientData.status,
          tags: clientData.tags,
        },
      });
    }

    console.log(`Client: ${clientData.email} (${clientData.status})`);
  }

  const existingExercises = await prisma.exercise.count({
    where: { organizationId: null },
  });

  if (existingExercises === 0) {
    await prisma.exercise.createMany({
      data: GLOBAL_EXERCISES.map((e) => ({
        ...e,
        organizationId: null,
      })),
    });
    console.log(`Created ${GLOBAL_EXERCISES.length} global exercises`);
  } else {
    console.log(`Global exercises already exist (${existingExercises})`);
  }

  // --- Workout seed data ---
  const exercises = await prisma.exercise.findMany({
    where: { organizationId: null },
    select: { id: true, name: true },
  });

  const exerciseByName = (name: string) => {
    const ex = exercises.find((e) => e.name === name);
    if (!ex) throw new Error(`Exercise not found: ${name}`);
    return ex.id;
  };

  const firstClient = await prisma.client.findFirst({
    where: { organizationId: organization.id },
    orderBy: { createdAt: 'asc' },
  });

  if (!firstClient) {
    console.log('No clients found, skipping workout seed');
    console.log('Seed completed successfully');
    return;
  }

  const existingPlan = await prisma.plan.findFirst({
    where: { organizationId: organization.id, isTemplate: true },
  });

  if (!existingPlan) {
    const templatePlan = await prisma.plan.create({
      data: {
        name: 'PPL - Push/Pull/Legs',
        description: 'Rutina clásica de 3 días: empuje, tirón y piernas',
        isTemplate: true,
        status: 'TEMPLATE',
        durationWeeks: 8,
        createdById: coach.id,
        organizationId: organization.id,
        workoutDays: {
          create: [
            {
              dayOfWeek: 1,
              name: 'Push (Empuje)',
              order: 0,
              workoutBlocks: {
                create: [
                  { exerciseId: exerciseByName('Press de banca'), order: 0, sets: 4, reps: '8-10', restSeconds: 90 },
                  { exerciseId: exerciseByName('Press inclinado con mancuernas'), order: 1, sets: 3, reps: '10-12', restSeconds: 60 },
                  { exerciseId: exerciseByName('Press militar'), order: 2, sets: 3, reps: '10-12', restSeconds: 60 },
                  { exerciseId: exerciseByName('Elevaciones laterales'), order: 3, sets: 3, reps: '12-15', restSeconds: 45 },
                  { exerciseId: exerciseByName('Extensión en polea'), order: 4, sets: 3, reps: '12-15', restSeconds: 45 },
                ],
              },
            },
            {
              dayOfWeek: 3,
              name: 'Pull (Tirón)',
              order: 1,
              workoutBlocks: {
                create: [
                  { exerciseId: exerciseByName('Dominadas'), order: 0, sets: 4, reps: '6-10', restSeconds: 90 },
                  { exerciseId: exerciseByName('Remo con barra'), order: 1, sets: 4, reps: '8-10', restSeconds: 90 },
                  { exerciseId: exerciseByName('Jalón al pecho'), order: 2, sets: 3, reps: '10-12', restSeconds: 60 },
                  { exerciseId: exerciseByName('Curl con barra'), order: 3, sets: 3, reps: '10-12', restSeconds: 60 },
                  { exerciseId: exerciseByName('Curl martillo'), order: 4, sets: 3, reps: '12-15', restSeconds: 45 },
                ],
              },
            },
            {
              dayOfWeek: 5,
              name: 'Legs (Piernas)',
              order: 2,
              workoutBlocks: {
                create: [
                  { exerciseId: exerciseByName('Sentadilla con barra'), order: 0, sets: 4, reps: '6-8', restSeconds: 120 },
                  { exerciseId: exerciseByName('Prensa de piernas'), order: 1, sets: 3, reps: '10-12', restSeconds: 90 },
                  { exerciseId: exerciseByName('Peso muerto rumano'), order: 2, sets: 3, reps: '10-12', restSeconds: 90 },
                  { exerciseId: exerciseByName('Extensión de cuádriceps'), order: 3, sets: 3, reps: '12-15', restSeconds: 60 },
                  { exerciseId: exerciseByName('Curl de piernas'), order: 4, sets: 3, reps: '12-15', restSeconds: 60 },
                ],
              },
            },
          ],
        },
      },
    });

    console.log(`Template plan created: ${templatePlan.name}`);

    // Assign plan to first client
    await prisma.plan.create({
      data: {
        name: templatePlan.name,
        description: templatePlan.description,
        isTemplate: false,
        status: 'ACTIVE',
        durationWeeks: templatePlan.durationWeeks,
        clientId: firstClient.id,
        createdById: coach.id,
        organizationId: organization.id,
        workoutDays: {
          create: [
            {
              dayOfWeek: 1,
              name: 'Push (Empuje)',
              order: 0,
              workoutBlocks: {
                create: [
                  { exerciseId: exerciseByName('Press de banca'), order: 0, sets: 4, reps: '8-10', restSeconds: 90 },
                  { exerciseId: exerciseByName('Press inclinado con mancuernas'), order: 1, sets: 3, reps: '10-12', restSeconds: 60 },
                  { exerciseId: exerciseByName('Press militar'), order: 2, sets: 3, reps: '10-12', restSeconds: 60 },
                  { exerciseId: exerciseByName('Elevaciones laterales'), order: 3, sets: 3, reps: '12-15', restSeconds: 45 },
                  { exerciseId: exerciseByName('Extensión en polea'), order: 4, sets: 3, reps: '12-15', restSeconds: 45 },
                ],
              },
            },
            {
              dayOfWeek: 3,
              name: 'Pull (Tirón)',
              order: 1,
              workoutBlocks: {
                create: [
                  { exerciseId: exerciseByName('Dominadas'), order: 0, sets: 4, reps: '6-10', restSeconds: 90 },
                  { exerciseId: exerciseByName('Remo con barra'), order: 1, sets: 4, reps: '8-10', restSeconds: 90 },
                  { exerciseId: exerciseByName('Jalón al pecho'), order: 2, sets: 3, reps: '10-12', restSeconds: 60 },
                  { exerciseId: exerciseByName('Curl con barra'), order: 3, sets: 3, reps: '10-12', restSeconds: 60 },
                  { exerciseId: exerciseByName('Curl martillo'), order: 4, sets: 3, reps: '12-15', restSeconds: 45 },
                ],
              },
            },
            {
              dayOfWeek: 5,
              name: 'Legs (Piernas)',
              order: 2,
              workoutBlocks: {
                create: [
                  { exerciseId: exerciseByName('Sentadilla con barra'), order: 0, sets: 4, reps: '6-8', restSeconds: 120 },
                  { exerciseId: exerciseByName('Prensa de piernas'), order: 1, sets: 3, reps: '10-12', restSeconds: 90 },
                  { exerciseId: exerciseByName('Peso muerto rumano'), order: 2, sets: 3, reps: '10-12', restSeconds: 90 },
                  { exerciseId: exerciseByName('Extensión de cuádriceps'), order: 3, sets: 3, reps: '12-15', restSeconds: 60 },
                  { exerciseId: exerciseByName('Curl de piernas'), order: 4, sets: 3, reps: '12-15', restSeconds: 60 },
                ],
              },
            },
          ],
        },
      },
    });

    console.log(`Active plan assigned to client ${firstClient.id}`);

    // Create 12 days of check-ins for first client
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkInData: { daysAgo: number; status: 'COMPLETED' | 'PARTIAL' | 'SKIPPED'; completedBlocks: number; totalBlocks: number; durationMinutes: number }[] = [
      { daysAgo: 12, status: 'COMPLETED', completedBlocks: 5, totalBlocks: 5, durationMinutes: 65 },
      { daysAgo: 11, status: 'COMPLETED', completedBlocks: 5, totalBlocks: 5, durationMinutes: 70 },
      { daysAgo: 10, status: 'COMPLETED', completedBlocks: 5, totalBlocks: 5, durationMinutes: 60 },
      { daysAgo: 9, status: 'PARTIAL', completedBlocks: 3, totalBlocks: 5, durationMinutes: 40 },
      { daysAgo: 8, status: 'COMPLETED', completedBlocks: 5, totalBlocks: 5, durationMinutes: 72 },
      { daysAgo: 7, status: 'COMPLETED', completedBlocks: 5, totalBlocks: 5, durationMinutes: 68 },
      { daysAgo: 6, status: 'SKIPPED', completedBlocks: 0, totalBlocks: 5, durationMinutes: 0 },
      { daysAgo: 5, status: 'COMPLETED', completedBlocks: 5, totalBlocks: 5, durationMinutes: 75 },
      { daysAgo: 4, status: 'COMPLETED', completedBlocks: 5, totalBlocks: 5, durationMinutes: 62 },
      { daysAgo: 3, status: 'COMPLETED', completedBlocks: 5, totalBlocks: 5, durationMinutes: 58 },
      { daysAgo: 2, status: 'COMPLETED', completedBlocks: 5, totalBlocks: 5, durationMinutes: 66 },
      { daysAgo: 1, status: 'COMPLETED', completedBlocks: 5, totalBlocks: 5, durationMinutes: 70 },
    ];

    const existingCheckIns = await prisma.checkIn.count({
      where: { clientId: firstClient.id },
    });

    if (existingCheckIns === 0) {
      for (const ci of checkInData) {
        const date = new Date(today);
        date.setDate(date.getDate() - ci.daysAgo);

        await prisma.checkIn.create({
          data: {
            clientId: firstClient.id,
            date,
            status: ci.status,
            completedBlocks: ci.completedBlocks,
            totalBlocks: ci.totalBlocks,
            durationMinutes: ci.durationMinutes,
          },
        });
      }

      // Update client streak and adherence
      await prisma.client.update({
        where: { id: firstClient.id },
        data: { currentStreak: 5, adherenceRate: 83 },
      });

      console.log(`Created ${checkInData.length} check-ins for first client`);
    }

    // Create achievements
    const existingAchievements = await prisma.achievement.count({
      where: { clientId: firstClient.id },
    });

    if (existingAchievements === 0) {
      await prisma.achievement.createMany({
        data: [
          { clientId: firstClient.id, type: 'FIRST_CHECKIN' },
          { clientId: firstClient.id, type: 'STREAK_7' },
        ],
      });
      console.log('Created achievements for first client');
    }
  } else {
    console.log('Workout plans already exist, skipping workout seed');
  }

  // --- Messaging seed data ---
  const existingConversations = await prisma.conversation.count({
    where: { organizationId: organization.id },
  });

  if (existingConversations === 0) {
    const clients = await prisma.client.findMany({
      where: { organizationId: organization.id },
      include: { user: { select: { id: true, firstName: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const now = new Date();

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      const conversation = await prisma.conversation.create({
        data: {
          organizationId: organization.id,
          lastMessageAt: new Date(now.getTime() - i * 3600000),
          participants: {
            create: [
              { userId: coach.id },
              { userId: client.userId },
            ],
          },
        },
      });

      const messageTemplates = [
        { sender: 'coach', content: `¡Hola ${client.user.firstName}! Bienvenida/o a tu programa de entrenamiento.` },
        { sender: 'client', content: '¡Hola coach! Muchas gracias, estoy emocionada/o por empezar.' },
        { sender: 'coach', content: 'He preparado un plan personalizado para ti. ¿Tienes alguna lesión o limitación que deba saber?' },
        { sender: 'client', content: 'No, todo bien por ahora. Solo un poco de dolor en la rodilla derecha a veces.' },
        { sender: 'coach', content: 'Entendido, vamos a tener cuidado con los ejercicios de impacto. Te ajusto el plan.' },
        { sender: 'client', content: 'Perfecto, ¿cuándo empezamos?' },
        { sender: 'coach', content: 'Puedes empezar mañana. Revisa tu plan en la app y cualquier duda me escribes.' },
        { sender: 'client', content: '¡Genial! Ya lo revisé, se ve muy bien.' },
      ];

      const messageCount = 5 + Math.floor(Math.random() * 4);

      for (let j = 0; j < messageCount && j < messageTemplates.length; j++) {
        const tmpl = messageTemplates[j];
        const senderId = tmpl.sender === 'coach' ? coach.id : client.userId;
        const hoursAgo = (messageCount - j) * 4 + i * 24;

        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId,
            content: tmpl.content,
            createdAt: new Date(now.getTime() - hoursAgo * 3600000),
          },
        });
      }

      // First client: 3 unread messages for the coach
      if (i === 0) {
        await prisma.conversationParticipant.updateMany({
          where: { conversationId: conversation.id, userId: coach.id },
          data: { unreadCount: 3 },
        });
      }

      console.log(`Conversation created: coach <-> ${client.user.firstName}`);
    }

    console.log('Messaging seed completed');
  } else {
    console.log('Conversations already exist, skipping messaging seed');
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
