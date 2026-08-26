-- CreateIndex
CREATE INDEX `appointments_lawyerId_status_idx` ON `appointments`(`lawyerId`, `status`);

-- CreateIndex
CREATE INDEX `appointments_lawyerId_appointmentDate_idx` ON `appointments`(`lawyerId`, `appointmentDate`);

-- CreateIndex
CREATE INDEX `cases_lawyerId_status_idx` ON `cases`(`lawyerId`, `status`);

-- CreateIndex
CREATE INDEX `cases_lawyerId_updatedAt_idx` ON `cases`(`lawyerId`, `updatedAt`);

-- CreateIndex
CREATE INDEX `conversations_lastMessageAt_idx` ON `conversations`(`lastMessageAt`);

-- CreateIndex
CREATE INDEX `diary_entries_lawyerId_type_status_idx` ON `diary_entries`(`lawyerId`, `type`, `status`);

-- CreateIndex
CREATE INDEX `e_signature_requests_requestedById_status_idx` ON `e_signature_requests`(`requestedById`, `status`);

-- CreateIndex
CREATE INDEX `e_signature_requests_documentId_requestedToId_idx` ON `e_signature_requests`(`documentId`, `requestedToId`);

-- CreateIndex
CREATE INDEX `hearing_entries_caseId_hearingDate_idx` ON `hearing_entries`(`caseId`, `hearingDate`);

-- CreateIndex
CREATE INDEX `lawyer_profiles_verificationStatus_idx` ON `lawyer_profiles`(`verificationStatus`);

-- CreateIndex
CREATE INDEX `lawyer_profiles_avgRating_idx` ON `lawyer_profiles`(`avgRating`);

-- CreateIndex
CREATE INDEX `lawyer_profiles_consultationFee_idx` ON `lawyer_profiles`(`consultationFee`);

-- CreateIndex
CREATE INDEX `messages_conversationId_isRead_idx` ON `messages`(`conversationId`, `isRead`);

-- CreateIndex
CREATE INDEX `notifications_userId_isRead_idx` ON `notifications`(`userId`, `isRead`);

-- RenameIndex
ALTER TABLE `reviews` RENAME INDEX `reviews_lawyerId_fkey` TO `reviews_lawyerId_idx`;
