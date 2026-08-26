import { PrismaClient, Role, AppointmentStatus, AppointmentType, DiaryEntryType, DiaryStatus, MessageType, CaseType, CaseStatus, CourtType, CourtProvince, HearingStatus, DocumentCategory, FirmMemberRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Specializations ────────────────────────────────────────────────────────
  const specializationData = [
    { name: 'Family Law', nameUr: 'خاندانی قانون' },
    { name: 'Criminal Law', nameUr: 'فوجداری قانون' },
    { name: 'Civil Law', nameUr: 'دیوانی قانون' },
    { name: 'Corporate Law', nameUr: 'کارپوریٹ قانون' },
    { name: 'Property Law', nameUr: 'جائیداد قانون' },
    { name: 'Tax Law', nameUr: 'ٹیکس قانون' },
    { name: 'Labor Law', nameUr: 'مزدور قانون' },
    { name: 'Constitutional Law', nameUr: 'آئینی قانون' },
    { name: 'Immigration Law', nameUr: 'امیگریشن قانون' },
    { name: 'Intellectual Property', nameUr: 'دانشورانہ ملکیت' },
  ];

  const specializations = await Promise.all(
    specializationData.map((s) =>
      prisma.specialization.upsert({
        where: { name: s.name },
        update: {},
        create: s,
      }),
    ),
  );
  console.log(`✅ ${specializations.length} specializations`);

  // ─── Passwords ───────────────────────────────────────────────────────────────
  const ROUNDS = 12;
  const hash = (pw: string) => bcrypt.hash(pw, ROUNDS);

  // ─── Lawyer Users + Profiles ─────────────────────────────────────────────────
  const lawyerSeeds = [
    {
      email: 'ahmed.khan@legalconnect.pk',
      phone: '+923001234567',
      fullName: 'Ahmed Khan',
      barCouncilNumber: 'LHC-2018-001',
      bio: 'Experienced family law attorney with 12 years of practice in Lahore High Court. Specializes in divorce, child custody, and inheritance disputes.',
      cities: ['Lahore', 'Gujranwala'],
      experienceYears: 12,
      consultationFee: 3000,
      avgRating: 4.7,
      totalReviews: 38,
      specializations: ['Family Law', 'Civil Law'],
      availability: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '10:00' },
        { dayOfWeek: 1, startTime: '10:00', endTime: '11:00' },
        { dayOfWeek: 2, startTime: '14:00', endTime: '15:00' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '10:00' },
        { dayOfWeek: 4, startTime: '11:00', endTime: '12:00' },
      ],
    },
    {
      email: 'sara.hussain@legalconnect.pk',
      phone: '+923111234567',
      fullName: 'Sara Hussain',
      barCouncilNumber: 'SHC-2015-042',
      bio: 'Senior advocate at Sindh High Court with deep expertise in corporate mergers, business contracts, and commercial disputes.',
      cities: ['Karachi'],
      experienceYears: 15,
      consultationFee: 5000,
      avgRating: 4.9,
      totalReviews: 62,
      specializations: ['Corporate Law', 'Tax Law'],
      availability: [
        { dayOfWeek: 1, startTime: '10:00', endTime: '11:00' },
        { dayOfWeek: 2, startTime: '10:00', endTime: '11:00' },
        { dayOfWeek: 3, startTime: '15:00', endTime: '16:00' },
        { dayOfWeek: 5, startTime: '09:00', endTime: '10:00' },
      ],
    },
    {
      email: 'bilal.chaudhry@legalconnect.pk',
      phone: '+923331234567',
      fullName: 'Bilal Chaudhry',
      barCouncilNumber: 'PHC-2020-089',
      bio: 'Criminal defense lawyer based in Peshawar with a strong track record in acquittals. Also handles FIR registration and bail matters.',
      cities: ['Peshawar', 'Mardan'],
      experienceYears: 8,
      consultationFee: 2500,
      avgRating: 4.4,
      totalReviews: 27,
      specializations: ['Criminal Law'],
      availability: [
        { dayOfWeek: 0, startTime: '10:00', endTime: '11:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '10:00' },
        { dayOfWeek: 4, startTime: '14:00', endTime: '15:00' },
        { dayOfWeek: 6, startTime: '10:00', endTime: '11:00' },
      ],
    },
    {
      email: 'fatima.malik@legalconnect.pk',
      phone: '+923211234567',
      fullName: 'Fatima Malik',
      barCouncilNumber: 'LHC-2016-173',
      bio: 'Property law specialist with extensive experience in land acquisition, title disputes, housing societies, and RERA-related matters in Punjab.',
      cities: ['Lahore', 'Islamabad'],
      experienceYears: 10,
      consultationFee: 4000,
      avgRating: 4.6,
      totalReviews: 45,
      specializations: ['Property Law', 'Civil Law'],
      availability: [
        { dayOfWeek: 1, startTime: '11:00', endTime: '12:00' },
        { dayOfWeek: 3, startTime: '10:00', endTime: '11:00' },
        { dayOfWeek: 3, startTime: '11:00', endTime: '12:00' },
        { dayOfWeek: 5, startTime: '14:00', endTime: '15:00' },
      ],
    },
    {
      email: 'usman.tariq@legalconnect.pk',
      phone: '+923451234567',
      fullName: 'Usman Tariq',
      barCouncilNumber: 'IHC-2022-012',
      bio: 'Young and dynamic labor law attorney in Islamabad. Handles NIRC cases, termination disputes, EOBI claims, and workplace harassment matters.',
      cities: ['Islamabad', 'Rawalpindi'],
      experienceYears: 4,
      consultationFee: 2000,
      avgRating: 0,
      totalReviews: 0,
      specializations: ['Labor Law', 'Constitutional Law'],
      availability: [
        { dayOfWeek: 2, startTime: '10:00', endTime: '11:00' },
        { dayOfWeek: 4, startTime: '10:00', endTime: '11:00' },
      ],
    },
  ];

  const lawyerProfiles: any[] = [];

  for (const seed of lawyerSeeds) {
    const passwordHash = await hash('Lawyer@123!');
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: {},
      create: {
        email: seed.email,
        passwordHash,
        role: Role.LAWYER,
        phone: seed.phone,
      },
    });

    const profile = await prisma.lawyerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        fullName: seed.fullName,
        barCouncilNumber: seed.barCouncilNumber,
        bio: seed.bio,
        cities: seed.cities,
        experienceYears: seed.experienceYears,
        consultationFee: seed.consultationFee,
        avgRating: seed.avgRating,
        totalReviews: seed.totalReviews,
      },
    });

    // Specializations
    for (const specName of seed.specializations) {
      const spec = specializations.find((s) => s.name === specName)!;
      await prisma.lawyerSpecialization.upsert({
        where: { lawyerId_specializationId: { lawyerId: profile.id, specializationId: spec.id } },
        update: {},
        create: { lawyerId: profile.id, specializationId: spec.id },
      });
    }

    // Availability slots
    for (const slot of seed.availability) {
      await prisma.availabilitySlot.upsert({
        where: { lawyerId_dayOfWeek_startTime: { lawyerId: profile.id, dayOfWeek: slot.dayOfWeek, startTime: slot.startTime } },
        update: {},
        create: { lawyerId: profile.id, ...slot },
      });
    }

    lawyerProfiles.push(profile);
  }
  console.log(`✅ ${lawyerSeeds.length} lawyers`);

  // ─── Client Users + Profiles ─────────────────────────────────────────────────
  const clientSeeds = [
    { email: 'ali.raza@gmail.com', fullName: 'Ali Raza', phone: '+923001111111' },
    { email: 'zara.ahmed@gmail.com', fullName: 'Zara Ahmed', phone: '+923002222222' },
    { email: 'hassan.sheikh@gmail.com', fullName: 'Hassan Sheikh', phone: '+923003333333' },
    { email: 'nadia.iqbal@gmail.com', fullName: 'Nadia Iqbal', phone: '+923004444444' },
  ];

  const clientProfiles: any[] = [];

  for (const seed of clientSeeds) {
    const passwordHash = await hash('Client@123!');
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: {},
      create: {
        email: seed.email,
        passwordHash,
        role: Role.CLIENT,
        phone: seed.phone,
      },
    });

    const profile = await prisma.clientProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, fullName: seed.fullName },
    });

    clientProfiles.push(profile);
  }
  console.log(`✅ ${clientSeeds.length} clients`);

  // ─── Appointments ─────────────────────────────────────────────────────────────
  const now = new Date();
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000);

  const appointmentSeeds = [
    {
      clientId: clientProfiles[0].id,
      lawyerId: lawyerProfiles[0].id,
      appointmentDate: daysFromNow(-10),
      startTime: '09:00',
      endTime: '10:00',
      type: AppointmentType.PHYSICAL,
      status: AppointmentStatus.COMPLETED,
    },
    {
      clientId: clientProfiles[1].id,
      lawyerId: lawyerProfiles[1].id,
      appointmentDate: daysFromNow(-5),
      startTime: '10:00',
      endTime: '11:00',
      type: AppointmentType.ONLINE,
      status: AppointmentStatus.COMPLETED,
      meetingLink: 'https://meet.google.com/abc-xyz-123',
    },
    {
      clientId: clientProfiles[2].id,
      lawyerId: lawyerProfiles[2].id,
      appointmentDate: daysFromNow(-2),
      startTime: '14:00',
      endTime: '15:00',
      type: AppointmentType.PHYSICAL,
      status: AppointmentStatus.COMPLETED,
    },
    {
      clientId: clientProfiles[0].id,
      lawyerId: lawyerProfiles[3].id,
      appointmentDate: daysFromNow(2),
      startTime: '11:00',
      endTime: '12:00',
      type: AppointmentType.PHYSICAL,
      status: AppointmentStatus.CONFIRMED,
    },
    {
      clientId: clientProfiles[3].id,
      lawyerId: lawyerProfiles[0].id,
      appointmentDate: daysFromNow(5),
      startTime: '10:00',
      endTime: '11:00',
      type: AppointmentType.ONLINE,
      status: AppointmentStatus.PENDING,
      meetingLink: 'https://meet.google.com/def-uvw-456',
    },
    {
      clientId: clientProfiles[1].id,
      lawyerId: lawyerProfiles[3].id,
      appointmentDate: daysFromNow(-15),
      startTime: '14:00',
      endTime: '15:00',
      type: AppointmentType.PHYSICAL,
      status: AppointmentStatus.CANCELLED,
    },
  ];

  const existingApptCount = await prisma.appointment.count();
  const appointments = existingApptCount > 0
    ? await prisma.appointment.findMany()
    : await Promise.all(appointmentSeeds.map((a) => prisma.appointment.create({ data: a })));
  console.log(`✅ ${appointments.length} appointments`);

  // ─── Reviews (only for COMPLETED appointments) ────────────────────────────────
  const completedAppointments = appointments.filter((a) => a.status === AppointmentStatus.COMPLETED);
  const reviewData = [
    { rating: 5, comment: 'Excellent lawyer! Resolved my divorce case professionally and swiftly. Highly recommended.' },
    { rating: 5, comment: 'Sara handled our corporate restructuring with great expertise. Will definitely work with her again.' },
    { rating: 4, comment: 'Bilal got my FIR registered quickly. Very knowledgeable about criminal law.' },
  ];

  for (let i = 0; i < Math.min(completedAppointments.length, reviewData.length); i++) {
    const appt = completedAppointments[i];
    const review = reviewData[i];
    await prisma.review.upsert({
      where: { appointmentId: appt.id },
      update: {},
      create: {
        clientId: appt.clientId,
        lawyerId: appt.lawyerId,
        appointmentId: appt.id,
        rating: review.rating,
        comment: review.comment,
      },
    });
  }
  console.log(`✅ ${Math.min(completedAppointments.length, reviewData.length)} reviews`);

  // ─── Conversations + Messages ─────────────────────────────────────────────────
  const convSeeds = [
    {
      clientId: clientProfiles[0].id,
      lawyerId: lawyerProfiles[0].id,
      messages: [
        { fromClient: true, content: 'Assalamualaikum, I need advice on my divorce case.' },
        { fromClient: false, content: 'Walaikumassalam. Please share the details so I can guide you.' },
        { fromClient: true, content: 'My wife has filed for khula. We have two children.' },
        { fromClient: false, content: 'In khula cases, the court process takes 3-6 months. I can represent you.' },
      ],
    },
    {
      clientId: clientProfiles[1].id,
      lawyerId: lawyerProfiles[1].id,
      messages: [
        { fromClient: true, content: 'Hello Sara, I want to register a private limited company.' },
        { fromClient: false, content: 'Sure! I can help you with SECP registration. What is the nature of your business?' },
        { fromClient: true, content: 'IT services and software development.' },
        { fromClient: false, content: 'Perfect. I handle IT company incorporations regularly. My fee for this is PKR 25,000.' },
        { fromClient: true, content: 'That works. When can we proceed?' },
      ],
    },
  ];

  for (const conv of convSeeds) {
    const clientUser = await prisma.user.findFirst({ where: { clientProfile: { id: conv.clientId } } });
    const lawyerUser = await prisma.user.findFirst({ where: { lawyerProfile: { id: conv.lawyerId } } });

    const conversation = await prisma.conversation.upsert({
      where: { clientId_lawyerId: { clientId: conv.clientId, lawyerId: conv.lawyerId } },
      update: { lastMessageAt: new Date() },
      create: {
        clientId: conv.clientId,
        lawyerId: conv.lawyerId,
        lastMessageAt: new Date(),
      },
    });

    const existingMessages = await prisma.message.count({ where: { conversationId: conversation.id } });
    if (existingMessages === 0) {
      for (const msg of conv.messages) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: msg.fromClient ? clientUser!.id : lawyerUser!.id,
            content: msg.content,
            type: MessageType.TEXT,
            isRead: true,
          },
        });
      }
    }
  }
  console.log(`✅ ${convSeeds.length} conversations with messages`);

  // ─── Diary Entries (for lawyers) ─────────────────────────────────────────────
  const diarySeeds = [
    {
      lawyerId: lawyerProfiles[0].id,
      type: DiaryEntryType.HEARING,
      status: DiaryStatus.OPEN,
      title: 'Family Court Hearing - Raza vs Raza',
      content: 'Khula petition hearing. Prepare affidavit and child custody documents.',
      hearingDate: daysFromNow(7),
      clientName: 'Imran Raza',
      courtName: 'Family Court Lahore',
    },
    {
      lawyerId: lawyerProfiles[0].id,
      type: DiaryEntryType.TASK,
      status: DiaryStatus.IN_PROGRESS,
      title: 'Draft Inheritance Agreement',
      content: 'Draft inheritance distribution agreement for Siddiqui family estate.',
      clientName: 'Siddiqui Family',
    },
    {
      lawyerId: lawyerProfiles[1].id,
      type: DiaryEntryType.CASE,
      status: DiaryStatus.IN_PROGRESS,
      title: 'TechCorp SECP Registration',
      content: 'Handle full SECP incorporation for TechCorp Pvt Ltd. Documents submitted, awaiting approval.',
      clientName: 'TechCorp',
    },
    {
      lawyerId: lawyerProfiles[2].id,
      type: DiaryEntryType.HEARING,
      status: DiaryStatus.OPEN,
      title: 'Sessions Court - Bail Application',
      content: 'Bail application for accused in theft case. Prepare surety documents.',
      hearingDate: daysFromNow(3),
      clientName: 'Akbar Ali',
      courtName: 'Sessions Court Peshawar',
    },
    {
      lawyerId: lawyerProfiles[3].id,
      type: DiaryEntryType.REMINDER,
      status: DiaryStatus.OPEN,
      title: 'Property Document Verification',
      content: 'Verify original documents for DHA plot transfer. Client appointment on Friday.',
      reminderDate: daysFromNow(4),
      clientName: 'Saima Nawaz',
    },
  ];

  const existingDiaryCount = await prisma.diaryEntry.count();
  if (existingDiaryCount === 0) {
    await Promise.all(diarySeeds.map((d) => prisma.diaryEntry.create({ data: d })));
  }
  console.log(`✅ ${diarySeeds.length} diary entries`);

  // ─── Law Firm ─────────────────────────────────────────────────────────────────
  const ahmedUser = await prisma.user.findUnique({ where: { email: 'ahmed.khan@legalconnect.pk' } });
  const fatimaUser = await prisma.user.findUnique({ where: { email: 'fatima.malik@legalconnect.pk' } });
  const firm = await prisma.lawFirm.upsert({
    where: { ownerId: ahmedUser!.id },
    update: {},
    create: {
      name: 'Khan & Associates',
      city: 'Lahore',
      province: 'PUNJAB',
      address: '45-B, Gulberg III, Lahore',
      phone: '+924235901234',
      ownerId: ahmedUser!.id,
    },
  });

  // Add Ahmed as OWNER and Fatima as ASSOCIATE
  const fatimaProfile = fatimaUser ? lawyerProfiles.find((p) => p.userId === fatimaUser.id) : null;
  await prisma.firmMember.upsert({
    where: { firmId_lawyerId: { firmId: firm.id, lawyerId: lawyerProfiles[0].id } },
    update: {},
    create: { firmId: firm.id, lawyerId: lawyerProfiles[0].id, role: FirmMemberRole.OWNER },
  });
  if (fatimaProfile) {
    await prisma.firmMember.upsert({
      where: { firmId_lawyerId: { firmId: firm.id, lawyerId: fatimaProfile.id } },
      update: {},
      create: { firmId: firm.id, lawyerId: fatimaProfile.id, role: FirmMemberRole.ASSOCIATE },
    });
  }
  console.log(`✅ 1 law firm with members`);

  // ─── Cases ────────────────────────────────────────────────────────────────────
  const caseSeeds = [
    {
      caseNumber: 'LHC-FAM-2024-0012',
      title: 'Raza vs Raza – Khula Petition',
      description: 'Khula petition filed by wife. Matters of child custody and maintenance also pending.',
      caseType: CaseType.FAMILY,
      status: CaseStatus.HEARING_SCHEDULED,
      courtName: 'Family Court Lahore',
      courtCity: 'Lahore',
      courtProvince: CourtProvince.PUNJAB,
      courtType: CourtType.FAMILY,
      plaintiff: { name: 'Sana Raza' },
      defendant: { name: 'Imran Raza' },
      lawyerId: lawyerProfiles[0].id,
      clientId: clientProfiles[0].id,
      retainerAmount: 50000,
      notes: 'Client paying in two installments. Next hearing scheduled.',
    },
    {
      caseNumber: 'SHC-COM-2024-0089',
      title: 'TechCorp vs Alpha Vendors – Contract Dispute',
      description: 'Commercial dispute over software delivery agreement. Client claims breach of contract.',
      caseType: CaseType.CORPORATE,
      status: CaseStatus.IN_PROGRESS,
      courtName: 'Commercial Court Karachi',
      courtCity: 'Karachi',
      courtProvince: CourtProvince.SINDH,
      courtType: CourtType.HIGH,
      plaintiff: { name: 'TechCorp Pvt Ltd' },
      defendant: { name: 'Alpha Vendors Ltd' },
      lawyerId: lawyerProfiles[1].id,
      clientId: clientProfiles[1].id,
      retainerAmount: 150000,
    },
    {
      caseNumber: 'PHC-CRM-2024-0245',
      title: 'State vs Akbar Ali – Theft Case',
      description: 'Defending accused in theft under PPC 379. Bail granted. Trial ongoing.',
      caseType: CaseType.CRIMINAL,
      status: CaseStatus.IN_PROGRESS,
      courtName: 'Sessions Court Peshawar',
      courtCity: 'Peshawar',
      courtProvince: CourtProvince.KPK,
      courtType: CourtType.DISTRICT,
      plaintiff: { name: 'State' },
      defendant: { name: 'Akbar Ali' },
      firNumber: '245/2024',
      lawyerId: lawyerProfiles[2].id,
      clientId: clientProfiles[2].id,
      retainerAmount: 30000,
    },
    {
      caseNumber: 'LHC-PRO-2024-0067',
      title: 'Nawaz vs DHA – Plot Title Dispute',
      description: 'Disputed title for residential plot in DHA Phase 6. Original documents under verification.',
      caseType: CaseType.PROPERTY,
      status: CaseStatus.OPEN,
      courtName: 'Civil Court Lahore',
      courtCity: 'Lahore',
      courtProvince: CourtProvince.PUNJAB,
      courtType: CourtType.DISTRICT,
      plaintiff: { name: 'Saima Nawaz' },
      defendant: { name: 'DHA Lahore' },
      lawyerId: lawyerProfiles[3].id,
      clientId: clientProfiles[3].id,
      retainerAmount: 80000,
    },
  ];

  const cases: any[] = [];
  for (const c of caseSeeds) {
    const existing = await prisma.case.findFirst({ where: { caseNumber: c.caseNumber } });
    if (!existing) {
      const created = await prisma.case.create({ data: c });
      cases.push(created);
    } else {
      cases.push(existing);
    }
  }
  console.log(`✅ ${cases.length} cases`);

  // ─── Hearings ─────────────────────────────────────────────────────────────────
  const setTime = (d: Date, time: string) => {
    const [h, m] = time.split(':').map(Number);
    const copy = new Date(d);
    copy.setHours(h, m, 0, 0);
    return copy;
  };

  const hearingSeeds = [
    {
      caseId: cases[0].id,
      hearingDate: setTime(daysFromNow(7), '10:00'),
      courtRoom: 'Court Room 3',
      judge: 'Honorable Justice Ayesha Siddiqa',
      status: HearingStatus.SCHEDULED,
    },
    {
      caseId: cases[0].id,
      hearingDate: setTime(daysFromNow(-14), '09:30'),
      courtRoom: 'Court Room 3',
      judge: 'Honorable Justice Ayesha Siddiqa',
      status: HearingStatus.HELD,
      outcome: 'Petition accepted. Defendant notified. Next date fixed.',
    },
    {
      caseId: cases[1].id,
      hearingDate: setTime(daysFromNow(14), '11:00'),
      courtRoom: 'Chamber 7',
      judge: 'Honorable Justice Tariq Mehmood',
      status: HearingStatus.SCHEDULED,
    },
    {
      caseId: cases[2].id,
      hearingDate: setTime(daysFromNow(3), '14:00'),
      courtRoom: 'Sessions Court 2',
      judge: 'Honorable ASJ Imran Shah',
      status: HearingStatus.SCHEDULED,
    },
    {
      caseId: cases[2].id,
      hearingDate: setTime(daysFromNow(-7), '14:00'),
      courtRoom: 'Sessions Court 2',
      judge: 'Honorable ASJ Imran Shah',
      status: HearingStatus.ADJOURNED,
      outcome: 'Adjourned — prosecution witness absent.',
      nextHearingDate: setTime(daysFromNow(3), '14:00'),
    },
  ];

  const existingHearingCount = await prisma.hearingEntry.count();
  if (existingHearingCount === 0) {
    await Promise.all(hearingSeeds.map((h) => prisma.hearingEntry.create({ data: h })));
  }
  console.log(`✅ ${hearingSeeds.length} hearings`);

  // ─── Case Documents ───────────────────────────────────────────────────────────
  const bilalUser = await prisma.user.findUnique({ where: { email: 'bilal.chaudhry@legalconnect.pk' } });
  const docSeeds = [
    {
      caseId: cases[0].id,
      uploadedById: ahmedUser!.id,
      title: 'Khula Petition',
      category: DocumentCategory.PETITION,
      fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample.pdf',
      fileType: 'application/pdf',
      fileSizeBytes: 204800,
      isSharedWithClient: true,
    },
    {
      caseId: cases[0].id,
      uploadedById: ahmedUser!.id,
      title: 'Vakalatnama – Raza Case',
      category: DocumentCategory.VAKALATNAMA,
      fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample.pdf',
      fileType: 'application/pdf',
      fileSizeBytes: 102400,
      isSharedWithClient: false,
    },
    {
      caseId: cases[2].id,
      uploadedById: bilalUser!.id,
      title: 'FIR Copy – 245/2024',
      category: DocumentCategory.FIR,
      fileUrl: 'https://res.cloudinary.com/demo/raw/upload/sample.pdf',
      fileType: 'application/pdf',
      fileSizeBytes: 51200,
      isSharedWithClient: true,
    },
  ];

  const existingDocCount = await prisma.caseDocument.count();
  if (existingDocCount === 0) {
    await Promise.all(docSeeds.map((d) => prisma.caseDocument.create({ data: d })));
  }
  console.log(`✅ ${docSeeds.length} case documents`);

  // ─── Link diary entries to cases ─────────────────────────────────────────────
  await prisma.diaryEntry.updateMany({
    where: { title: 'Family Court Hearing - Raza vs Raza' },
    data: { caseId: cases[0].id },
  });
  await prisma.diaryEntry.updateMany({
    where: { title: 'Sessions Court - Bail Application' },
    data: { caseId: cases[2].id },
  });

  console.log('\n🎉 Seed complete!\n');
  console.log('─────────────────────────────────────────');
  console.log('Test credentials:');
  console.log('  Lawyers  →  password: Lawyer@123!');
  console.log('  Clients  →  password: Client@123!');
  console.log('  Admin    →  admin@legalconnect.pk / Admin@123!');
  console.log('─────────────────────────────────────────');
  console.log('Seeded: specializations, lawyers, clients,');
  console.log('  appointments, reviews, conversations,');
  console.log('  diary entries, firm, cases, hearings, docs');
  console.log('─────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
