"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  StudySessionActive,
  StudySessionEmpty,
  StudySessionResults,
  StudySessionSetup,
} from "./components";
import { useStudySessionData } from "./useStudySessionData";

export default function StudySession() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const langCode = params.lang as string;

  const {
    mode,
    direction,
    isLoading,
    isFinished,
    errorMsg,
    words,
    currentWord,
    currentIndex,
    isFlipped,
    reviewQueueTotal,
    remainingDueCount,
    sessionAnswers,
    progress,
    frontText,
    backText,
    canAnswer,
    modeLabel,
    completionMessage,
    completionTitle,
    recallScore,
    difficultAnswers,
    emptyStateTitle,
    emptyStateDescription,
    reviewStatusText,
    setDirection,
    startSession,
    openStudyModes,
    flipCard,
    handleResult,
    speakCurrentFront,
    speakCurrentBack,
    continueReview,
    reviewWeakPoints,
  } = useStudySessionData({
    langCode,
    requestedMode: searchParams.get("mode"),
    requestedDirection: searchParams.get("direction"),
  });

  if (!mode) {
    return (
      <StudySessionSetup
        direction={direction}
        onDirectionChange={setDirection}
        onStartSession={startSession}
        onCancel={() => router.back()}
      />
    );
  }

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400 tracking-widest uppercase animate-pulse">Loading Session...</div>;
  }

  if (words.length === 0) {
    return (
      <StudySessionEmpty
        title={emptyStateTitle}
        description={emptyStateDescription}
        langCode={langCode}
        onOpenStudyModes={openStudyModes}
      />
    );
  }

  if (isFinished) {
    return (
      <StudySessionResults
        mode={mode}
        direction={direction}
        langCode={langCode}
        remainingDueCount={remainingDueCount}
        reviewQueueTotal={reviewQueueTotal}
        sessionAnswers={sessionAnswers}
        completionMessage={completionMessage}
        completionTitle={completionTitle}
        recallScore={recallScore}
        difficultAnswers={difficultAnswers}
        onContinueReview={continueReview}
        onReviewWeakPoints={reviewWeakPoints}
        onOpenStudyModes={openStudyModes}
      />
    );
  }

  if (!currentWord) {
    return null;
  }

  return (
    <StudySessionActive
      errorMsg={errorMsg}
      progress={progress}
      modeLabel={modeLabel}
      direction={direction}
      currentIndex={currentIndex}
      totalWords={words.length}
      reviewStatusText={reviewStatusText}
      mode={mode}
      currentWord={currentWord}
      frontText={frontText}
      backText={backText}
      isFlipped={isFlipped}
      canAnswer={canAnswer}
      onOpenStudyModes={openStudyModes}
      onFlip={flipCard}
      onSpeakFront={speakCurrentFront}
      onSpeakBack={speakCurrentBack}
      onGrade={handleResult}
    />
  );
}
